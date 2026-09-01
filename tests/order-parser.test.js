const assert = require('assert')
const { parseOrderText } = require('../miniprogram/utils/order-parser')
const { airlineFromFlightNo, getHubSuggestions } = require('../miniprogram/utils/transport-data')

const flight = parseOrderText('中国国际航空 航班 CA145 2026年10月1日 13:40 17:45 杭州萧山国际机场 北京首都国际机场 经济舱')
assert.strictEqual(flight.type, 'flight')
assert.strictEqual(flight.transportNo, 'CA145')
assert.strictEqual(flight.locationStart, '杭州萧山国际机场')
assert.strictEqual(flight.locationEnd, '北京首都国际机场')
assert.strictEqual(flight.cabinClass, '经济舱')
assert.strictEqual(flight.date, '2026-10-01')
assert.strictEqual(flight.startTime, '13:40')
assert.strictEqual(flight.endTime, '17:45')

const train = parseOrderText('铁路12306 G7331 2026-10-01 08:30 09:16 上海虹桥站 杭州东站 二等座')
assert.strictEqual(train.type, 'train')
assert.strictEqual(train.transportNo, 'G7331')
assert.strictEqual(train.seatClass, '二等座')
assert.strictEqual(train.startTime, '08:30')
assert.strictEqual(train.endTime, '09:16')

const trainSearchScreenshot = parseOrderText([
  '3:56',
  '10月02日 周五出发',
  '11:29',
  '上海虹桥站',
  '26分',
  'G7316 经停',
  '11:55',
  '苏州站',
  '携程·超级秒杀 9月18日13:45开售',
  '二等座 一等座 商务座 无座',
  '预约购票 开售自动抢'
].join('\n'))
assert.strictEqual(trainSearchScreenshot.type, 'train')
assert.strictEqual(trainSearchScreenshot.date, '2026-10-02')
assert.strictEqual(trainSearchScreenshot.startTime, '11:29')
assert.strictEqual(trainSearchScreenshot.endTime, '11:55')
assert.strictEqual(trainSearchScreenshot.transportNo, 'G7316')
assert.strictEqual(trainSearchScreenshot.locationStart, '上海虹桥站')
assert.strictEqual(trainSearchScreenshot.locationEnd, '苏州站')
assert.strictEqual(trainSearchScreenshot.locationStartCity, '上海')
assert.strictEqual(trainSearchScreenshot.locationEndCity, '苏州')
assert.strictEqual(trainSearchScreenshot.title, '上海 → 苏州')
assert.strictEqual(trainSearchScreenshot.expectedSaleAt, '2026-09-18 13:45')
assert.strictEqual(trainSearchScreenshot.seatClass, '')

const hotel = parseOrderText('上海外滩华尔道夫酒店 入住 2026年10月1日 退房 2026年10月3日 豪华双床房 城市：上海')
assert.strictEqual(hotel.type, 'hotel')
assert.strictEqual(hotel.title, '上海外滩华尔道夫酒店')
assert.strictEqual(hotel.city, '上海')
assert.strictEqual(hotel.roomType, '豪华双床房')
assert.strictEqual(hotel.checkOutDate, '2026-10-03')

const hotelScreenshot = parseOrderText([
  '03:02',
  '预订成功',
  '金华大酒店（人民广场店）',
  '酒店地址 浙江省金华市婺城区人民东路99号',
  '09月18日 周五 入住',
  '09月19日 周六 退房',
  '豪华双床房'
].join('\n'))
assert.strictEqual(hotelScreenshot.type, 'hotel')
assert.strictEqual(hotelScreenshot.city, '金华')
assert.strictEqual(hotelScreenshot.date, '2026-09-18')
assert.strictEqual(hotelScreenshot.checkOutDate, '2026-09-19')

const flightScreenshot = parseOrderText([
  '3:16',
  '订单详情',
  '下单时间 2026-08-30 15:45',
  '航班日期 09月18日 周五',
  '中国东方航空 MU5101 经济舱',
  '08:20 上海虹桥T2 出发',
  '10:35 北京首都T2 到达',
  '出票时间 16:08'
].join('\n'))
assert.strictEqual(flightScreenshot.type, 'flight')
assert.strictEqual(flightScreenshot.date, '2026-09-18')
assert.strictEqual(flightScreenshot.startTime, '08:20')
assert.strictEqual(flightScreenshot.endTime, '10:35')

const bus = parseOrderText('城际巴士\n出发地：上海长途客运南站\n目的地：杭州汽车客运中心\n2026年10月1日 08:00')
assert.strictEqual(bus.type, 'intercity_bus')
assert.strictEqual(bus.locationStart, '上海长途客运南站')
assert.strictEqual(bus.locationEnd, '杭州汽车客运中心')

assert.strictEqual(airlineFromFlightNo('mu5101'), '中国东方航空')
assert.ok(getHubSuggestions('flight', '上海').some(item => item.name === '上海虹桥国际机场'))
assert.ok(getHubSuggestions('train', '杭州').some(item => item.name === '杭州东站'))

console.log('order parser tests passed')
