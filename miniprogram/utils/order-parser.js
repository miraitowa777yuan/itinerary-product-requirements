const { CITY_HUBS, findKnownHubsInText } = require('./transport-data')

const FLIGHT_CLASSES = ['头等舱', '公务舱', '经济舱']
const TRAIN_CLASSES = ['商务座', '特等座', '一等座', '二等座', '站票']

function normalizeText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function parseDate(text) {
  const dates = extractDates(text)
  return dates[0] ? dates[0].value : ''
}

function extractDates(text) {
  const source = String(text || '')
  const explicitYear = source.match(/(20\d{2})[年\/.\-]/)
  const defaultYear = explicitYear ? Number(explicitYear[1]) : new Date().getFullYear()
  const dates = []
  const pattern = /(?:(20\d{2})[年\/.\-])?(\d{1,2})[月\/.\-](\d{1,2})日?/g
  let match
  while ((match = pattern.exec(source))) {
    const month = Number(match[2])
    const day = Number(match[3])
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    dates.push({
      value: `${match[1] || defaultYear}-${pad(month)}-${pad(day)}`,
      index: match.index,
      raw: match[0]
    })
  }
  return dates
}

function extractTimes(text) {
  const values = []
  const pattern = /(?:^|[^\d])([01]?\d|2[0-3])[:：]([0-5]\d)(?!\d)/g
  let match
  while ((match = pattern.exec(text))) {
    const value = `${pad(match[1])}:${match[2]}`
    const index = match.index + match[0].indexOf(match[1])
    if (!values.some(item => item.value === value && Math.abs(item.index - index) < 3)) {
      values.push({ value, index })
    }
  }
  return values
}

function nearbyText(text, index, radius) {
  return text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius))
}

function lineTextAt(text, index) {
  const lineStart = text.lastIndexOf('\n', index) + 1
  const nextLine = text.indexOf('\n', index)
  return text.slice(lineStart, nextLine >= 0 ? nextLine : text.length)
}

function findHubPosition(text, hub) {
  if (!hub) return -1
  const names = [
    hub.name,
    hub.name.replace(/国际机场$/, ''),
    hub.name.replace(/机场$/, ''),
    hub.city
  ]
  const positions = names.map(name => text.indexOf(name)).filter(index => index >= 0)
  return positions.length ? Math.min(...positions) : -1
}

function scoreTravelTime(text, candidate, role, hub) {
  const line = lineTextAt(text, candidate.index)
  const startLabels = /(起飞|出发|计划起飞|预计起飞|始发)/
  const endLabels = /(到达|抵达|计划到达|预计到达|终到)/
  const metadata = /(下单|预订|支付|出票|更新时间|提交|创建|取消|客服|开售|放票|发售|抢票)/
  let score = 0
  if ((role === 'start' ? startLabels : endLabels).test(line)) score += 120
  if ((role === 'start' ? endLabels : startLabels).test(line)) score -= 35
  if (metadata.test(line)) score -= 140
  if (candidate.index < 18) score -= 90
  const hubPosition = findHubPosition(text, hub)
  if (hubPosition >= 0) {
    const distance = Math.abs(candidate.index - hubPosition)
    score += Math.max(0, 100 - distance)
  }
  return score
}

function parseTravelTimes(text, hubs) {
  const candidates = extractTimes(text)
  if (!candidates.length) return []
  const choose = (role, excludedIndex) => candidates
    .map((candidate, index) => ({ candidate, index, score: scoreTravelTime(text, candidate, role, hubs[role === 'start' ? 0 : 1]) }))
    .filter(item => item.index !== excludedIndex)
    .sort((a, b) => b.score - a.score || a.candidate.index - b.candidate.index)[0]
  const start = choose('start', -1)
  const end = choose('end', start ? start.index : -1)
  const useful = candidates.filter(candidate => {
    const line = lineTextAt(text, candidate.index)
    if (/(下单|预订|支付|出票|更新|创建|客服|开售|放票|发售|抢票)/.test(line)) return false
    const isFirstLine = text.lastIndexOf('\n', candidate.index) < 0
    if (isFirstLine && !/(航班|铁路|高铁|火车|列车|起飞|出发|到达|机场|车站)/.test(line)) return false
    return true
  })
  const labelledStart = start && start.score >= 110 ? start.candidate : null
  const labelledEnd = end && end.score >= 110 ? end.candidate : null
  const startValue = labelledStart ? labelledStart.value : (useful[0] && useful[0].value)
  const endFallback = useful.find(item => item.value !== startValue)
  const endValue = labelledEnd && labelledEnd.value !== startValue ? labelledEnd.value : (endFallback && endFallback.value)
  return [startValue || '', endValue || '']
}

function findDateByLabels(text, dates, labels) {
  const sameLineMatches = dates.map(date => {
    const lineStart = text.lastIndexOf('\n', date.index) + 1
    const nextLine = text.indexOf('\n', date.index)
    const lineEnd = nextLine >= 0 ? nextLine : text.length
    const line = text.slice(lineStart, lineEnd)
    const linePattern = new RegExp(labels.source, 'g')
    const distances = []
    let lineMatch
    while ((lineMatch = linePattern.exec(line))) {
      distances.push(Math.abs(lineStart + lineMatch.index - date.index))
    }
    return { date, distance: distances.length ? Math.min(...distances) : Infinity }
  }).filter(item => Number.isFinite(item.distance))
  if (sameLineMatches.length) {
    return sameLineMatches.sort((a, b) => a.distance - b.distance || a.date.index - b.date.index)[0].date
  }
  const labelPattern = new RegExp(labels.source, 'g')
  const labelPositions = []
  let match
  while ((match = labelPattern.exec(text))) labelPositions.push(match.index)
  const closest = dates
    .map(date => ({
      date,
      distance: labelPositions.length ? Math.min(...labelPositions.map(index => Math.abs(index - date.index))) : Infinity
    }))
    .filter(item => item.distance <= 32)
    .sort((a, b) => a.distance - b.distance || a.date.index - b.date.index)[0]
  return closest ? closest.date : undefined
}

function findTravelDate(text, dates) {
  const labelled = findDateByLabels(text, dates, /(航班日期|起飞日期|出发日期|乘车日期|行程日期|出行日期|入住|出发)/)
  if (labelled) return labelled.value
  const nonMetadata = dates.find(date => !/(下单|预订|支付|出票|创建|取消|开售|放票|发售|抢票)/.test(nearbyText(text, date.index, 30)))
  return (nonMetadata || dates[0] || {}).value || ''
}

function detectType(text) {
  if (/(酒店|宾馆|旅馆|民宿|入住|退房|房型|Hotel)/i.test(text)) return 'hotel'
  if (/(航班|航空|机场|登机|值机|舱位)/.test(text) || /\b(?:CA|MU|CZ|HU|MF|ZH|SC|FM|KN|HO|GS|JD|PN|GJ|EU|TV|NS|BK|KY|QW|GX|AQ|Y8|DR|UQ|LT|RY|DZ|3U|9C)\s?\d{3,4}\b/i.test(text)) return 'flight'
  if (/(高铁|火车|列车|铁路|检票口|候车室|座位)/.test(text) || /(?:^|\s)[GDCZTKYS]\s?\d{1,4}(?:\s|$)/i.test(text)) return 'train'
  if (/(城际巴士|大巴|客运|巴士|汽车站)/.test(text)) return 'intercity_bus'
  return 'custom'
}

function captureLabelValue(text, labels) {
  const labelPattern = labels.join('|')
  const match = text.match(new RegExp(`(?:${labelPattern})[：:\\s]*([^\\n]{2,30})`, 'i'))
  return match ? match[1].trim().replace(/[|｜].*$/, '').trim() : ''
}

function findTransportNo(text, type) {
  if (type === 'flight') {
    const match = text.toUpperCase().match(/(?:^|[^A-Z0-9])((?:3U|9C|[A-Z0-9]{2})\s?\d{3,4})(?!\d)/)
    return match ? match[1].replace(/\s+/g, '') : ''
  }
  if (type === 'train') {
    const match = text.toUpperCase().match(/(?:^|[^A-Z0-9])([GDCZTKYS]\s?\d{1,4})(?!\d)/)
    return match ? match[1].replace(/\s+/g, '') : ''
  }
  return captureLabelValue(text, ['班次', '车次'])
}

function findHotelName(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const line = lines.find(value => /(酒店|宾馆|旅馆|民宿|Hotel)/i.test(value) && value.length <= 36)
  if (line) return line
  const match = text.match(/([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,24}(?:酒店|宾馆|旅馆|民宿|Hotel))/i)
  return match ? match[1] : ''
}

function findRoomType(text) {
  const match = text.match(/([^\s\n，,：:]{0,8}(?:大床房|双床房|单人房|家庭房|套房|榻榻米房|公寓房))/)
  return match ? match[1].replace(/^(房型|客房)[：:\s]*/, '').trim() : ''
}

function findHotelCity(text, hotelName) {
  const labelled = captureLabelValue(text, ['酒店城市', '所在城市', '入住城市', '目的地', '城市'])
  const labelledCity = labelled.match(/^([\u4e00-\u9fa5]{2,8}?)(?:市|地区|自治州|$|[ ,，])/)
  if (labelledCity) return labelledCity[1].replace(/省$/, '')
  const address = captureLabelValue(text, ['酒店地址', '地址', '位置'])
  const addressCity = address.match(/(?:[\u4e00-\u9fa5]{2,8}(?:省|自治区))?([\u4e00-\u9fa5]{2,6})市/)
  if (addressCity) return addressCity[1]
  const cityWithSuffix = text.match(/(?:[\u4e00-\u9fa5]{2,8}(?:省|自治区))?([\u4e00-\u9fa5]{2,6})市(?:[\u4e00-\u9fa5]{0,8}(?:区|县|镇|街|路|道|号))?/)
  if (cityWithSuffix) return cityWithSuffix[1]
  return Object.keys(CITY_HUBS).find(city => String(hotelName || '').includes(city) || text.includes(city)) || ''
}

function findStationCity(stationName) {
  const cities = Object.keys(CITY_HUBS)
  for (const city of cities) {
    if (CITY_HUBS[city].stations.includes(stationName)) return city
  }
  const cityPrefix = cities.find(city => stationName.startsWith(city))
  if (cityPrefix) return cityPrefix
  return stationName.replace(/站$/, '').replace(/(?:东|西|南|北)$/, '')
}

function findTrainHubs(text) {
  const matches = []
  const stationPattern = /(?:^|[\s\n])([\u4e00-\u9fa5]{2,10}站)(?=$|[\s\n\d>＞→])/g
  const noise = /^(进站|到站|车站|站点|接送站|始发站|终点站)$/
  let match
  while ((match = stationPattern.exec(text))) {
    const name = match[1]
    if (noise.test(name) || matches.some(item => item.name === name)) continue
    matches.push({ city: findStationCity(name), name, terminals: [], position: match.index })
  }
  findKnownHubsInText(text, 'train').forEach(hub => {
    if (!matches.some(item => item.name === hub.name)) matches.push(hub)
  })
  return matches.sort((a, b) => a.position - b.position)
}

function findExpectedSaleAt(text) {
  const match = text.match(/((?:20\d{2}[年\/.\-])?\d{1,2}[月\/.\-]\d{1,2}日?)[^\n]{0,16}?([01]?\d|2[0-3])[:：]([0-5]\d)[^\n]{0,8}?(?:开售|放票|发售)/)
  if (!match) return ''
  return `${parseDate(match[1])} ${pad(match[2])}:${match[3]}`
}

function parseOrderText(rawText) {
  const text = normalizeText(rawText)
  const type = detectType(text)
  const dates = extractDates(text)
  const hubs = type === 'train' ? findTrainHubs(text) : (type === 'flight' ? findKnownHubsInText(text, type) : [])
  const times = type === 'flight' || type === 'train' ? parseTravelTimes(text, hubs) : extractTimes(text).slice(0, 2).map(item => item.value)
  const date = findTravelDate(text, dates)
  const result = {
    type,
    date,
    startTime: times[0] || '',
    endTime: times[1] || '',
    title: '',
    locationStart: '',
    locationEnd: '',
    locationStartCity: '',
    locationEndCity: '',
    transportNo: findTransportNo(text, type),
    cabinClass: '',
    seatClass: '',
    city: '',
    roomType: '',
    checkOutDate: '',
    expectedSaleAt: '',
    source: 'ocr'
  }

  if (type === 'hotel') {
    result.title = findHotelName(text)
    result.city = findHotelCity(text, result.title)
    result.roomType = findRoomType(text)
    const checkIn = findDateByLabels(text, dates, /(入住|到店|入住日期)/) || dates[0]
    const checkOut = findDateByLabels(text, dates, /(退房|离店|退房日期)/) || dates.find(item => !checkIn || item.index !== checkIn.index)
    result.date = checkIn ? checkIn.value : result.date
    result.checkOutDate = checkOut ? checkOut.value : ''
  } else if (type === 'flight' || type === 'train') {
    if (hubs[0]) {
      result.locationStart = hubs[0].name
      result.locationStartCity = hubs[0].city
    }
    if (hubs[1]) {
      result.locationEnd = hubs[1].name
      result.locationEndCity = hubs[1].city
    }
    const classValues = type === 'flight' ? FLIGHT_CLASSES : TRAIN_CLASSES
    const detectedClasses = classValues.filter(value => text.includes(value))
    if (type === 'train' && text.includes('无座')) detectedClasses.push('站票')
    const travelClass = detectedClasses.length === 1 ? detectedClasses[0] : ''
    if (type === 'flight') result.cabinClass = travelClass
    if (type === 'train') {
      result.seatClass = travelClass
      result.expectedSaleAt = findExpectedSaleAt(text)
    }
    result.title = [result.locationStartCity || result.locationStart, result.locationEndCity || result.locationEnd].filter(Boolean).join(' → ')
  } else if (type === 'intercity_bus') {
    result.locationStart = captureLabelValue(text, ['出发站点', '出发地', '上车点', '始发站'])
    result.locationEnd = captureLabelValue(text, ['目的地站点', '目的地', '下车点', '终点站'])
    result.title = [result.locationStart, result.locationEnd].filter(Boolean).join(' → ')
  }

  return result
}

module.exports = {
  FLIGHT_CLASSES,
  TRAIN_CLASSES,
  normalizeText,
  parseOrderText
}
