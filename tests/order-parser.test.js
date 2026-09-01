const assert = require('assert')
const { parseOrderText } = require('../cloudfunctions/analyzeOrder/parser')

const hotel = parseOrderText([
  '东京银座花园酒店',
  '房型：豪华双床房',
  '入住日期 2026年10月1日',
  '退房日期 2026年10月6日',
  '地址：东京都中央区银座1-1'
], 'auto')
assert.strictEqual(hotel.item.type, 'hotel')
assert.strictEqual(hotel.item.city, '东京')
assert.strictEqual(hotel.item.roomType, '豪华双床房')
assert.strictEqual(hotel.item.date, '2026-10-01')
assert.strictEqual(hotel.item.checkOutDate, '2026-10-06')

const flight = parseOrderText([
  '电子客票',
  'CA145',
  '杭州萧山国际机场 → 东京成田国际机场',
  '2026-10-01',
  '13:40 17:45',
  '舱位：经济舱 Y'
], 'auto')
assert.strictEqual(flight.item.type, 'flight')
assert.strictEqual(flight.item.transportNo, 'CA145')
assert.strictEqual(flight.item.locationStart, '杭州萧山国际机场')
assert.strictEqual(flight.item.startTime, '13:40')
assert.strictEqual(flight.item.cabinClass, '经济舱 Y')

const train = parseOrderText([
  '中国铁路',
  'G7331',
  '上海虹桥站 → 杭州东站',
  '2026年10月1日 08:30',
  '二等座'
], 'auto')
assert.strictEqual(train.item.type, 'train')
assert.strictEqual(train.item.transportNo, 'G7331')
assert.strictEqual(train.item.seatClass, '二等座')
assert.strictEqual(train.item.bookingStatus, 'ticketed')

const bus = parseOrderText([
  '城际巴士电子票',
  '乘车点：浦东机场客运站',
  '下车点：苏州北广场站',
  '2026/10/02 09:20'
], 'auto')
assert.strictEqual(bus.item.type, 'intercity_bus')
assert.strictEqual(bus.item.locationStart, '浦东机场客运站')
assert.strictEqual(bus.item.locationEnd, '苏州北广场站')
assert.strictEqual(bus.item.startTime, '09:20')

console.log('order parser tests passed')
