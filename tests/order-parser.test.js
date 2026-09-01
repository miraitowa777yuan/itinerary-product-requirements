const assert = require('assert')
const { parseOrderText } = require('../miniprogram/utils/order-parser')
const { airlineFromFlightNo, getHubSuggestions } = require('../miniprogram/utils/transport-data')

const flight = parseOrderText('中国国际航空 航班 CA145 2026年10月1日 13:40 17:45 杭州萧山国际机场 北京首都国际机场 经济舱')
assert.strictEqual(flight.type, 'flight')
assert.strictEqual(flight.transportNo, 'CA145')
assert.strictEqual(flight.locationStart, '杭州萧山国际机场')
assert.strictEqual(flight.locationEnd, '北京首都国际机场')
assert.strictEqual(flight.cabinClass, '经济舱')

const train = parseOrderText('铁路12306 G7331 2026-10-01 08:30 09:16 上海虹桥站 杭州东站 二等座')
assert.strictEqual(train.type, 'train')
assert.strictEqual(train.transportNo, 'G7331')
assert.strictEqual(train.seatClass, '二等座')

const hotel = parseOrderText('上海外滩华尔道夫酒店 入住 2026年10月1日 退房 2026年10月3日 豪华双床房 城市：上海')
assert.strictEqual(hotel.type, 'hotel')
assert.strictEqual(hotel.title, '上海外滩华尔道夫酒店')
assert.strictEqual(hotel.roomType, '豪华双床房')
assert.strictEqual(hotel.checkOutDate, '2026-10-03')

const bus = parseOrderText('城际巴士\n出发地：上海长途客运南站\n目的地：杭州汽车客运中心\n2026年10月1日 08:00')
assert.strictEqual(bus.type, 'intercity_bus')
assert.strictEqual(bus.locationStart, '上海长途客运南站')
assert.strictEqual(bus.locationEnd, '杭州汽车客运中心')

assert.strictEqual(airlineFromFlightNo('mu5101'), '中国东方航空')
assert.ok(getHubSuggestions('flight', '上海').some(item => item.name === '上海虹桥国际机场'))
assert.ok(getHubSuggestions('train', '杭州').some(item => item.name === '杭州东站'))

console.log('order parser tests passed')
