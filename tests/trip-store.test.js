const assert = require('assert')

const storage = {}
global.wx = {
  getStorageSync(key) { return storage[key] },
  setStorageSync(key, value) { storage[key] = value }
}

const tripStore = require('../miniprogram/utils/trip-store')

tripStore.ensureSeedData()
const created = tripStore.saveTrip({
  title: '存储测试',
  destination: '杭州',
  startDate: '2099-01-01',
  endDate: '2099-01-02'
})

assert.strictEqual(tripStore.getTrips({ includeArchived: false, includePast: false }).some(item => item.id === created.id), true)
assert.strictEqual(tripStore.archiveTrip(created.id), true)
assert.strictEqual(tripStore.getTrips({ includeArchived: false }).some(item => item.id === created.id), false)
assert.strictEqual(tripStore.getTrips({ includeArchived: true }).some(item => item.id === created.id), true)
assert.strictEqual(tripStore.restoreTrip(created.id), true)

const daily = tripStore.ensureDailyTrip()
assert.strictEqual(daily.id, tripStore.DAILY_TRIP_ID)
assert.strictEqual(tripStore.getTrips().some(item => item.id === tripStore.DAILY_TRIP_ID), false)
assert.strictEqual(tripStore.deleteTrip(tripStore.DAILY_TRIP_ID), false)

const past = tripStore.saveTrip({
  title: '已结束测试',
  destination: '上海',
  startDate: '2000-01-01',
  endDate: '2000-01-02'
})
assert.strictEqual(tripStore.isPastTrip(past), true)
assert.strictEqual(tripStore.getTrips({ includePast: false }).some(item => item.id === past.id), false)

const orderedTrip = tripStore.saveTrip({
  title: '打车排序测试', destination: '杭州', startDate: '2099-02-01', endDate: '2099-02-01'
})
tripStore.saveItem(orderedTrip.id, { id: 'train-item', type: 'train', title: '车站', date: '2099-02-01', startTime: '08:00' })
tripStore.saveItem(orderedTrip.id, { id: 'flight-item', type: 'flight', title: '机场', date: '2099-02-01', startTime: '12:00' })
tripStore.saveItem(orderedTrip.id, {
  id: 'taxi-item', type: 'taxi', title: '车站 → 机场', date: '2099-02-01', durationMinutes: '35', afterItemId: 'train-item'
})
assert.deepStrictEqual(tripStore.getTrip(orderedTrip.id).items.map(item => item.id), ['train-item', 'taxi-item', 'flight-item'])
assert.strictEqual(tripStore.deleteTrip(created.id), true)

console.log('trip store tests passed')
