const assert = require('assert')
const { presentItem, summarizeTripCosts, summarizeTripSplit } = require('../miniprogram/utils/presenters')

const taxi = presentItem({ type: 'taxi', title: '酒店 → 机场', price: '35.50', durationMinutes: '35' })
assert.strictEqual(taxi.typeLabel, '打车')
assert.strictEqual(taxi.priceLabel, '¥35.50')
assert.strictEqual(taxi.durationLabel, '车程 35 分钟')

const summary = summarizeTripCosts({ items: [
  { type: 'flight', price: '2200' },
  { type: 'hotel', price: '419.40' },
  { type: 'taxi', price: '35.50' },
  { type: 'activity', price: '' }
] })
assert.strictEqual(summary.totalLabel, '¥2654.90')
assert.strictEqual(summary.pricedItemCount, 3)
assert.deepStrictEqual(summary.breakdown.map(item => item.label), ['机票', '酒店', '打车'])
assert.strictEqual(summary.breakdown[0].percentLabel, '82.9%')
assert.ok(summary.breakdown.every(item => item.color))

const split = summarizeTripSplit({ items: [
  { id: 'flight-1', type: 'flight', title: '上海 → 广州', price: '300', participantIds: ['self', 'alice'] },
  { id: 'hotel-1', type: 'hotel', title: '广州酒店', price: '600', participantIds: ['self', 'alice', 'bob'] }
] }, [
  { id: 'alice', name: '小林' },
  { id: 'bob', name: '阿杰' }
], ['alice', 'bob'])
assert.strictEqual(split.totalLabel, '¥900.00')
assert.deepStrictEqual(split.participants.map(item => item.amountLabel), ['¥350.00', '¥350.00', '¥200.00'])
assert.strictEqual(split.items[0].participantLabel, '我、小林')

console.log('presenter tests passed')
