const TYPE_KEYWORDS = {
  hotel: /酒店|宾馆|民宿|入住|退房|房型|hotel|check.?in/i,
  flight: /航班|登机|航空|机场|舱位|flight|boarding/i,
  train: /高铁|火车|动车|车次|检票口|铁路|12306/i,
  intercity_bus: /城际巴士|客运|汽车票|乘车点|巴士|大巴|bus/i
}

function clean(value) {
  return String(value || '').replace(/^\s+|\s+$/g, '').replace(/[：:]\s*$/, '')
}

function afterLabel(lines, labels) {
  const pattern = new RegExp(`^(?:${labels})[：:\\s]*(.+)$`, 'i')
  const exactPattern = new RegExp(`^(?:${labels})[：:]?$`, 'i')
  for (let index = 0; index < lines.length; index += 1) {
    const match = clean(lines[index]).match(pattern)
    if (match && clean(match[1])) return clean(match[1])
    if (exactPattern.test(clean(lines[index])) && lines[index + 1]) return clean(lines[index + 1])
  }
  return ''
}

function detectType(text, hintType) {
  if (hintType && hintType !== 'auto' && TYPE_KEYWORDS[hintType]) return hintType
  const scores = Object.keys(TYPE_KEYWORDS).map((type) => ({
    type,
    score: (text.match(new RegExp(TYPE_KEYWORDS[type].source, 'ig')) || []).length
  })).sort((a, b) => b.score - a.score)
  return scores[0].score ? scores[0].type : 'intercity_bus'
}

function normalizeDate(year, month, day) {
  const y = Number(year) || new Date().getFullYear()
  return `${y}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`
}

function extractDates(text) {
  const dates = []
  const full = /(20\d{2})\s*[年\-\/.]\s*(\d{1,2})\s*[月\-\/.]\s*(\d{1,2})\s*日?/g
  let match
  while ((match = full.exec(text))) dates.push(normalizeDate(match[1], match[2], match[3]))
  if (!dates.length) {
    const short = /(\d{1,2})\s*月\s*(\d{1,2})\s*日/g
    while ((match = short.exec(text))) dates.push(normalizeDate('', match[1], match[2]))
  }
  return Array.from(new Set(dates))
}

function extractTimes(text) {
  const times = []
  const pattern = /(?:^|\D)([01]?\d|2[0-3])\s*[：:]\s*([0-5]\d)(?!\d)/g
  let match
  while ((match = pattern.exec(text))) times.push(`${String(Number(match[1])).padStart(2, '0')}:${match[2]}`)
  return Array.from(new Set(times))
}

function routeFromArrow(lines) {
  for (const line of lines) {
    const match = clean(line).match(/^(.{2,30}?)\s*(?:→|➜|->|—|至)\s*(.{2,30})$/)
    if (match) return [clean(match[1]), clean(match[2])]
  }
  return ['', '']
}

function placeFromLabels(lines) {
  const start = afterLabel(lines, '出发地|出发站|起点|上车点|乘车点|始发站')
  const end = afterLabel(lines, '目的地|到达站|终点|下车点|终到站')
  return [start, end]
}

function findTransportNo(text, type) {
  const patterns = {
    flight: /\b((?:[A-Z]{2}|[A-Z]\d|\d[A-Z])\s?\d{3,4})\b/i,
    train: /\b([GDCZTKSLY]\s?\d{1,4})\b/i,
    intercity_bus: /(?:班次|车次|班车)[：:\s]*([A-Z0-9\-]{2,16})/i
  }
  if (!patterns[type]) return ''
  const match = text.match(patterns[type])
  return match ? match[1].replace(/\s/g, '').toUpperCase() : ''
}

function findHotelName(lines) {
  const labelled = afterLabel(lines, '酒店名称|酒店名|住宿名称|Hotel')
  if (labelled) return labelled
  const candidates = lines.map(clean).filter((line) => /酒店|宾馆|民宿|hotel/i.test(line) && !/订单|预订|确认|政策/.test(line))
  return candidates.sort((a, b) => b.length - a.length)[0] || ''
}

function findCity(lines, hotelName) {
  const labelled = afterLabel(lines, '城市|目的地城市|City')
  if (labelled) return labelled
  const source = `${hotelName} ${lines.join(' ')}`
  const match = source.match(/([\u4e00-\u9fa5]{2,8}(?:市|特别行政区))/)
  if (match) return match[1]
  const commonCity = source.match(/北京|上海|广州|深圳|杭州|成都|重庆|西安|南京|苏州|武汉|长沙|厦门|青岛|三亚|香港|澳门|台北|东京|大阪|京都|首尔|曼谷|新加坡|巴黎|伦敦|纽约|洛杉矶|悉尼|墨尔本/)
  return commonCity ? commonCity[0] : ''
}

function confidenceFor(item) {
  const required = item.type === 'hotel'
    ? ['title', 'city', 'roomType', 'date', 'checkOutDate']
    : ['locationStart', 'locationEnd', 'date', 'startTime']
  const found = required.filter((key) => item[key]).length
  return Math.round((found / required.length) * 100)
}

function parseOrderText(rawLines, hintType) {
  const lines = rawLines.map(clean).filter(Boolean)
  const text = lines.join('\n')
  const type = detectType(text, hintType)
  const dates = extractDates(text)
  const times = extractTimes(text)
  const item = {
    type,
    title: '',
    date: dates[0] || '',
    checkOutDate: dates[1] || '',
    startTime: times[0] || '',
    endTime: times[1] || '',
    locationStart: '',
    locationEnd: '',
    transportNo: findTransportNo(text, type),
    bookingStatus: type === 'hotel' ? 'confirmed' : 'ticketed',
    notes: '由订单截图识别，请核对后使用'
  }

  if (type === 'hotel') {
    item.title = findHotelName(lines)
    item.city = findCity(lines, item.title)
    item.roomType = afterLabel(lines, '房型|客房|Room type|Room')
    item.locationStart = afterLabel(lines, '酒店地址|地址|Address') || [item.city, item.title].filter(Boolean).join(' ')
  } else {
    const labelledRoute = placeFromLabels(lines)
    const arrowRoute = routeFromArrow(lines)
    item.locationStart = labelledRoute[0] || arrowRoute[0]
    item.locationEnd = labelledRoute[1] || arrowRoute[1]
    item.title = [item.locationStart, item.locationEnd].filter(Boolean).join(' → ')
    if (type === 'flight') {
      item.cabinClass = afterLabel(lines, '舱位|舱等|客舱|Cabin|Class') || ((text.match(/头等舱|公务舱|商务舱|超级经济舱|经济舱/) || [])[0] || '')
    }
    if (type === 'train') {
      item.seatClass = afterLabel(lines, '席别|座席|座位类型') || ((text.match(/商务座|特等座|一等座|二等座|硬卧|软卧|硬座|无座/) || [])[0] || '')
    }
  }

  const warnings = []
  if (!item.date) warnings.push('没有可靠识别到日期，请手动选择。')
  if (type === 'hotel' && !item.title) warnings.push('没有可靠识别到酒店名称，请手动填写。')
  if (type !== 'hotel' && (!item.locationStart || !item.locationEnd)) warnings.push('出发地或目的地不完整，请对照截图核对。')
  if (type !== 'hotel' && !item.startTime) warnings.push('没有可靠识别到出发时间，请手动选择。')

  return { item, confidence: confidenceFor(item), warnings }
}

module.exports = { parseOrderText }
