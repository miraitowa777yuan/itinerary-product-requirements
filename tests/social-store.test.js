const assert = require('assert')

const storage = {}
global.wx = {
  getStorageSync(key) { return storage[key] },
  setStorageSync(key, value) { storage[key] = value }
}

const socialStore = require('../miniprogram/utils/social-store')

const alice = socialStore.addFriend({ name: '小林', note: '同行人' })
const bob = socialStore.addFriend({ name: '阿杰' })
assert.ok(alice.id)
assert.strictEqual(socialStore.getFriends().length, 2)
assert.strictEqual(socialStore.getFriends()[0].avatarText, '小')
assert.strictEqual(socialStore.addFriend({ name: '小林' }).id, alice.id)

const share = socialStore.shareTrip({
  tripId: 'trip_test', tripTitle: '杭州周末行', friendIds: [alice.id, bob.id],
  total: 600, totalLabel: '¥600.00', breakdown: [{ key: 'hotel', amount: 600 }]
})
assert.strictEqual(share.peopleCount, 3)
assert.strictEqual(share.perPersonAmount, 200)
assert.strictEqual(socialStore.getTripShare('trip_test').tripTitle, '杭州周末行')
assert.strictEqual(socialStore.getShares().length, 1)

console.log('social store tests passed')
