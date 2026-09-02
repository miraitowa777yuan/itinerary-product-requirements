const FRIENDS_STORAGE_KEY = 'itinerary_friends_v1'
const SHARES_STORAGE_KEY = 'itinerary_trip_shares_v1'
const PROFILE_STORAGE_KEY = 'itinerary_profile_v1'
const ACCOUNT_PREFIX = 'TRV'

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

function normalizeAccountNo(value) {
  return String(value == null ? '' : value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function formatAccountNo(value) {
  const normalized = normalizeAccountNo(value)
  if (!normalized) return ''
  if (normalized.startsWith(ACCOUNT_PREFIX) && normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
  }
  return normalized
}

function isValidAccountNo(value) {
  return /^TRV\d{8}$/.test(normalizeAccountNo(value))
}

function accountNoFromSeed(seed) {
  let hash = 0
  String(seed || '').split('').forEach(char => {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  })
  const digits = String(Math.abs(hash)).padStart(8, '0').slice(-8)
  return formatAccountNo(`${ACCOUNT_PREFIX}${digits}`)
}

function makeAccountNo(usedAccountNos) {
  const used = new Set((usedAccountNos || []).map(normalizeAccountNo))
  let accountNo = ''
  do {
    const digits = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    accountNo = formatAccountNo(`${ACCOUNT_PREFIX}${digits}`)
  } while (used.has(normalizeAccountNo(accountNo)))
  return accountNo
}

function getProfile() {
  const saved = wx.getStorageSync(PROFILE_STORAGE_KEY)
  if (saved && isValidAccountNo(saved.accountNo)) {
    return clone(Object.assign({ name: '旅行者' }, saved, { accountNo: formatAccountNo(saved.accountNo) }))
  }
  const profile = {
    name: saved && saved.name ? String(saved.name).trim() : '旅行者',
    accountNo: makeAccountNo()
  }
  wx.setStorageSync(PROFILE_STORAGE_KEY, clone(profile))
  return clone(profile)
}

function readFriendsWithMigration() {
  const friends = readArray(FRIENDS_STORAGE_KEY)
  const used = new Set()
  let changed = false
  const migrated = friends.map((friend, index) => {
    const originalAccountNo = String(friend && friend.accountNo || '')
    let accountNo = isValidAccountNo(originalAccountNo)
      ? formatAccountNo(originalAccountNo)
      : accountNoFromSeed(friend.id || `friend_${index}`)
    if (used.has(normalizeAccountNo(accountNo))) accountNo = makeAccountNo(Array.from(used))
    used.add(normalizeAccountNo(accountNo))
    if (accountNo === originalAccountNo) return friend
    changed = true
    return Object.assign({}, friend, { accountNo })
  })
  if (changed) writeArray(FRIENDS_STORAGE_KEY, migrated)
  return migrated
}

function presentFriend(friend) {
  const name = String(friend && friend.name || '').trim()
  return Object.assign({}, friend, {
    name,
    accountNo: formatAccountNo(friend && friend.accountNo),
    avatarText: name.slice(0, 1) || '友'
  })
}

function getFriends() {
  return readFriendsWithMigration().map(presentFriend).map(clone)
}

function addFriend(input) {
  const rawAccountNo = String(input && input.accountNo || '').trim()
  if (rawAccountNo && !isValidAccountNo(rawAccountNo)) return null
  const friends = readFriendsWithMigration()
  const accountNo = formatAccountNo(rawAccountNo) || makeAccountNo([
    getProfile().accountNo,
    ...friends.map(friend => friend.accountNo)
  ])
  const name = String(input && input.name || '').trim() || `好友·${accountNo.slice(-4)}`
  const existing = friends.find(friend => normalizeAccountNo(friend.accountNo) === normalizeAccountNo(accountNo)
    || (!rawAccountNo && friend.name === name))
  if (existing) return clone(existing)
  const friend = {
    id: makeId('friend'),
    name,
    accountNo,
    note: String(input && input.note || '').trim(),
    createdAt: new Date().toISOString()
  }
  friends.push(friend)
  writeArray(FRIENDS_STORAGE_KEY, friends)
  return clone(friend)
}

function searchAccount(accountNo) {
  const normalized = normalizeAccountNo(accountNo)
  if (!isValidAccountNo(normalized)) return { status: 'invalid', accountNo: '' }
  const formatted = formatAccountNo(normalized)
  const profile = getProfile()
  if (normalizeAccountNo(profile.accountNo) === normalized) {
    return { status: 'self', accountNo: formatted, name: profile.name }
  }
  const friend = getFriends().find(item => normalizeAccountNo(item.accountNo) === normalized)
  return friend
    ? { status: 'found', accountNo: formatted, friend }
    : { status: 'not_found', accountNo: formatted }
}

function updateFriend(friendId, patch) {
  const friends = readFriendsWithMigration()
  let updated = null
  const next = friends.map(friend => {
    if (friend.id !== friendId) return friend
    updated = Object.assign({}, friend, {
      note: String(patch && patch.note || '').trim()
    })
    return updated
  })
  if (!updated) return null
  writeArray(FRIENDS_STORAGE_KEY, next)
  return clone(updated)
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
  const friendIds = Array.from(new Set(
    Array.isArray(input && input.friendIds)
      ? input.friendIds.filter(id => id && id !== 'self')
      : []
  ))
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
    splitSummary: input && input.splitSummary ? clone(input.splitSummary) : null,
    sharedAt: new Date().toISOString()
  }
  const index = shares.findIndex(item => item.tripId === tripId)
  if (index >= 0) shares[index] = nextShare
  else shares.unshift(nextShare)
  writeArray(SHARES_STORAGE_KEY, shares)
  return clone(nextShare)
}

module.exports = {
  getProfile,
  getFriends,
  addFriend,
  searchAccount,
  updateFriend,
  removeFriend,
  getShares,
  getTripShare,
  shareTrip,
  normalizeAccountNo,
  formatAccountNo,
  isValidAccountNo
}
