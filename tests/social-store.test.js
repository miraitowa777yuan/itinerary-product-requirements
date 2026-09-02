const assert = require('assert')

const storage = {}
global.wx = {
  getStorageSync(key) { return storage[key] },
  setStorageSync(key, value) { storage[key] = value }
}

const socialStore = require('../miniprogram/utils/social-store')

const profile = socialStore.getProfile()
assert.ok(socialStore.isValidAccountNo(profile.accountNo))
assert.strictEqual(socialStore.searchAccount(profile.accountNo).status, 'self')
const alice = socialStore.addFriend({ name: '小林', note: '同行人' })
const bob = socialStore.addFriend({ accountNo: 'TRV-1234-5678', name: '阿杰' })
assert.ok(alice.id)
assert.ok(socialStore.isValidAccountNo(alice.accountNo))
assert.strictEqual(socialStore.formatAccountNo('trv12345678'), 'TRV-1234-5678')
assert.strictEqual(socialStore.searchAccount(alice.accountNo).status, 'found')
assert.strictEqual(socialStore.getFriends().length, 2)
assert.strictEqual(socialStore.getFriends()[0].avatarText, '小')
assert.strictEqual(socialStore.addFriend({ name: '小林' }).id, alice.id)
assert.strictEqual(socialStore.updateFriend(alice.id, { note: '室友' }).note, '室友')
assert.strictEqual(socialStore.getFriends()[0].note, '室友')

const share = socialStore.shareTrip({
  tripId: 'trip_test', tripTitle: '杭州周末行', friendIds: [alice.id, bob.id],
  total: 600, totalLabel: '¥600.00', breakdown: [{ key: 'hotel', amount: 600 }],
  splitSummary: { total: 600, participants: [{ id: 'self', amount: 300 }, { id: alice.id, amount: 300 }], items: [] }
})
assert.strictEqual(share.peopleCount, 3)
assert.strictEqual(share.perPersonAmount, 200)
assert.strictEqual(share.splitSummary.participants.length, 2)
assert.strictEqual(socialStore.getTripShare('trip_test').tripTitle, '杭州周末行')
assert.strictEqual(socialStore.getShares().length, 1)

console.log('social store tests passed')
