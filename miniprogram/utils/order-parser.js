const { findKnownHubsInText } = require('./transport-data')

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
  let match = text.match(/(20\d{2})[年\/.\-](\d{1,2})[月\/.\-](\d{1,2})日?/)
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`
  match = text.match(/(\d{1,2})月(\d{1,2})日/)
  if (match) return `${new Date().getFullYear()}-${pad(match[1])}-${pad(match[2])}`
  return ''
}

function parseTimes(text) {
  const values = []
  const pattern = /(?:^|[^\d])([01]?\d|2[0-3])[:：]([0-5]\d)(?!\d)/g
  let match
  while ((match = pattern.exec(text)) && values.length < 2) {
    const value = `${pad(match[1])}:${match[2]}`
    if (!values.includes(value)) values.push(value)
  }
  return values
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

function parseOrderText(rawText) {
  const text = normalizeText(rawText)
  const type = detectType(text)
  const times = parseTimes(text)
  const date = parseDate(text)
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
    source: 'ocr'
  }

  if (type === 'hotel') {
    result.title = findHotelName(text)
    result.city = captureLabelValue(text, ['酒店城市', '城市', '目的地']).replace(/市$/, '')
    result.roomType = findRoomType(text)
    const dates = text.match(/20\d{2}[年\/.\-]\d{1,2}[月\/.\-]\d{1,2}日?/g) || []
    if (dates[1]) result.checkOutDate = parseDate(dates[1])
  } else if (type === 'flight' || type === 'train') {
    const hubs = findKnownHubsInText(text, type)
    if (hubs[0]) {
      result.locationStart = hubs[0].name
      result.locationStartCity = hubs[0].city
    }
    if (hubs[1]) {
      result.locationEnd = hubs[1].name
      result.locationEndCity = hubs[1].city
    }
    const classValues = type === 'flight' ? FLIGHT_CLASSES : TRAIN_CLASSES
    const travelClass = classValues.find(value => text.includes(value)) || ''
    if (type === 'flight') result.cabinClass = travelClass
    if (type === 'train') result.seatClass = travelClass
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
