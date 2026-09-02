const FRIENDS_STORAGE_KEY = 'itinerary_friends_v1'
const SHARES_STORAGE_KEY = 'itinerary_trip_shares_v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function readArray(key) {
  const value = wx.getStorageSync(key)
  return Array.isArray(value) ? value : []
}

function writeArray(key, value) {
  wx.setStorageSync(key, clone(value))
}

function presentFriend(friend) {
  const name = String(friend && friend.name || '').trim()
  return Object.assign({}, friend, {
    name,
    avatarText: name.slice(0, 1) || '友'
  })
}

function getFriends() {
  return readArray(FRIENDS_STORAGE_KEY).map(presentFriend).map(clone)
}

function addFriend(input) {
  const name = String(input && input.name || '').trim()
  if (!name) return null
  const friends = readArray(FRIENDS_STORAGE_KEY)
  const existing = friends.find(friend => friend.name === name)
  if (existing) return clone(existing)
  const friend = {
    id: makeId('friend'),
    name,
    note: String(input && input.note || '').trim(),
    createdAt: new Date().toISOString()
  }
  friends.push(friend)
  writeArray(FRIENDS_STORAGE_KEY, friends)
  return clone(friend)
}

function removeFriend(friendId) {
  const friends = readArray(FRIENDS_STORAGE_KEY)
  const next = friends.filter(friend => friend.id !== friendId)
  if (next.length === friends.length) return false
  writeArray(FRIENDS_STORAGE_KEY, next)
  return true
}

function getShares() {
  return readArray(SHARES_STORAGE_KEY).map(clone)
}

function getTripShare(tripId) {
  const share = getShares().find(item => item.tripId === tripId)
  return share || null
}

function shareTrip(input) {
  const tripId = String(input && input.tripId || '')
  const friendIds = Array.isArray(input && input.friendIds)
    ? input.friendIds.filter(Boolean)
    : []
  if (!tripId || !friendIds.length) return null
  const total = Number(input && input.total) || 0
  const peopleCount = friendIds.length + 1
  const shares = getShares()
  const nextShare = {
    id: makeId('share'),
    tripId,
    tripTitle: String(input && input.tripTitle || '').trim(),
    friendIds,
    total,
    totalLabel: String(input && input.totalLabel || ''),
    breakdown: Array.isArray(input && input.breakdown) ? clone(input.breakdown) : [],
    itinerary: Array.isArray(input && input.itinerary) ? clone(input.itinerary) : [],
    sharedScope: 'itinerary_and_expense',
    peopleCount,
    perPersonAmount: total / peopleCount,
    sharedAt: new Date().toISOString()
  }
  const index = shares.findIndex(item => item.tripId === tripId)
  if (index >= 0) shares[index] = nextShare
  else shares.unshift(nextShare)
  writeArray(SHARES_STORAGE_KEY, shares)
  return clone(nextShare)
}

module.exports = {
  getFriends,
  addFriend,
  removeFriend,
  getShares,
  getTripShare,
  shareTrip
}
