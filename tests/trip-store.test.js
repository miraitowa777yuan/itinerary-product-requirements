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
assert.strictEqual(tripStore.deleteTrip(created.id), true)

console.log('trip store tests passed')
