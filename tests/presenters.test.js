const assert = require('assert')
const { presentItem, summarizeTripCosts } = require('../miniprogram/utils/presenters')

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

console.log('presenter tests passed')
