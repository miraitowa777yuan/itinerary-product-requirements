const STORAGE_KEY = 'itinerary_trips_v1'
const DAILY_TRIP_ID = 'trip_daily_local'

const seedTrips = [
  {
    id: 'trip_tokyo_demo',
    title: '东京六日行',
    destination: '东京 · 镰仓',
    startDate: '2026-10-01',
    endDate: '2026-10-06',
    status: 'upcoming',
    items: [
      {
        id: 'item_train_demo',
        type: 'train',
        title: '上海虹桥 → 杭州东',
        date: '2026-10-01',
        startTime: '08:30',
        endTime: '09:16',
        locationStart: '上海虹桥站',
        locationEnd: '杭州东站',
        transportNo: 'G7331',
        bookingStatus: 'waiting_to_book',
        expectedSaleAt: '2026-09-17 08:00',
        preferredSeatClass: '二等座',
        notes: '开售前 10 分钟提醒'
      },
      {
        id: 'item_flight_demo',
        type: 'flight',
        title: '杭州 → 东京',
        date: '2026-10-01',
        startTime: '13:40',
        endTime: '17:45',
        locationStart: '杭州萧山国际机场',
        locationEnd: '东京成田国际机场',
        transportNo: 'CA145',
        bookingStatus: 'ticketed',
        notes: ''
      },
      {
        id: 'item_hotel_demo',
        type: 'hotel',
        title: '银座酒店',
        date: '2026-10-01',
        startTime: '19:00',
        endTime: '',
        locationStart: '东京银座',
        locationEnd: '',
        transportNo: '',
        bookingStatus: 'confirmed',
        notes: '入住 5 晚'
      }
    ]
  }
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeTrip(trip) {
  const normalized = Object.assign({
    status: 'upcoming',
    items: [],
    archived: false,
    isDaily: false
  }, trip || {})
  normalized.items = Array.isArray(normalized.items) ? normalized.items : []
  normalized.archived = Boolean(normalized.archived)
  normalized.isDaily = Boolean(normalized.isDaily || normalized.id === DAILY_TRIP_ID)
  return normalized
}

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isPastTrip(trip) {
  return Boolean(trip && trip.endDate && trip.endDate < getTodayKey())
}

function ensureSeedData() {
  const current = wx.getStorageSync(STORAGE_KEY)
  if (!Array.isArray(current)) {
    wx.setStorageSync(STORAGE_KEY, clone(seedTrips))
  }
}

function readTrips() {
  ensureSeedData()
  return (wx.getStorageSync(STORAGE_KEY) || []).map(normalizeTrip)
}

function getTrips(options) {
  const settings = Object.assign({
    includeArchived: true,
    includeDaily: false,
    includePast: true
  }, options || {})
  return readTrips()
    .filter(trip => settings.includeDaily || !trip.isDaily)
    .filter(trip => settings.includeArchived || !trip.archived)
    .filter(trip => settings.includePast || !isPastTrip(trip))
    .map(clone)
}

function saveTrips(trips) {
  wx.setStorageSync(STORAGE_KEY, clone(trips))
}

function getTrip(tripId) {
  return readTrips().find((trip) => trip.id === tripId) || null
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function sortItems(items) {
  const sorted = items.slice().sort((a, b) => {
    const left = `${a.date || ''} ${a.startTime || ''}`
    const right = `${b.date || ''} ${b.startTime || ''}`
    const byTime = left.localeCompare(right)
    if (byTime !== 0) return byTime
    return String(a.id || '').localeCompare(String(b.id || ''))
  })
  // A shortcut-created taxi has no clock time by design. Keep it directly
  // after the itinerary item it connects, even when its date is the same.
  for (let pass = 0; pass < sorted.length; pass += 1) {
    let moved = false
    sorted.slice().forEach(item => {
      if (!item.afterItemId) return
      const currentIndex = sorted.findIndex(current => current.id === item.id)
      const anchorIndex = sorted.findIndex(current => current.id === item.afterItemId)
      if (currentIndex < 0 || anchorIndex < 0 || currentIndex === anchorIndex + 1) return
      sorted.splice(currentIndex, 1)
      const nextAnchorIndex = sorted.findIndex(current => current.id === item.afterItemId)
      sorted.splice(nextAnchorIndex + 1, 0, item)
      moved = true
    })
    if (!moved) break
  }
  return sorted
}

function saveTrip(input) {
  const trips = readTrips()
  const trip = Object.assign({
    id: makeId('trip'),
    status: 'upcoming',
    items: [],
    archived: false,
    isDaily: false
  }, input)
  trip.isDaily = false
  trip.archived = Boolean(trip.archived)
  const index = trips.findIndex((item) => item.id === trip.id)
  if (index >= 0) {
    trip.items = Array.isArray(input && input.items) ? input.items : trips[index].items
    trip.archived = typeof (input && input.archived) === 'boolean' ? input.archived : trips[index].archived
    trip.isDaily = trips[index].isDaily
    trips[index] = trip
  } else {
    trips.unshift(trip)
  }
  saveTrips(trips)
  return clone(trip)
}

function saveItem(tripId, input) {
  const trips = readTrips()
  const tripIndex = trips.findIndex((trip) => trip.id === tripId)
  if (tripIndex < 0) return null

  const item = Object.assign({}, input)
  if (!item.id) item.id = makeId('item')
  const itemIndex = trips[tripIndex].items.findIndex((current) => current.id === item.id)
  if (itemIndex >= 0) {
    trips[tripIndex].items[itemIndex] = item
  } else {
    trips[tripIndex].items.push(item)
  }
  trips[tripIndex].items = sortItems(trips[tripIndex].items)
  saveTrips(trips)
  return clone(item)
}

function updateBookingStatus(tripId, itemId, bookingStatus) {
  const trips = readTrips()
  const trip = trips.find((current) => current.id === tripId)
  if (!trip) return false
  const item = trip.items.find((current) => current.id === itemId)
  if (!item) return false
  item.bookingStatus = bookingStatus
  saveTrips(trips)
  return true
}

function deleteItem(tripId, itemId) {
  const trips = readTrips()
  const trip = trips.find((current) => current.id === tripId)
  if (!trip) return false
  trip.items = trip.items.filter((item) => item.id !== itemId)
  saveTrips(trips)
  return true
}

function ensureDailyTrip() {
  const trips = readTrips()
  const existing = trips.find(trip => trip.id === DAILY_TRIP_ID)
  if (existing) return clone(existing)
  const dailyTrip = {
    id: DAILY_TRIP_ID,
    title: '日常行程',
    destination: '周边城市',
    startDate: '',
    endDate: '',
    status: 'active',
    archived: false,
    isDaily: true,
    items: []
  }
  trips.push(dailyTrip)
  saveTrips(trips)
  return clone(dailyTrip)
}

function archiveTrip(tripId) {
  const trips = readTrips()
  const trip = trips.find(current => current.id === tripId)
  if (!trip || trip.isDaily) return false
  if (!trip.archived) trip.statusBeforeArchive = trip.status || 'upcoming'
  trip.archived = true
  trip.status = 'archived'
  trip.archivedAt = new Date().toISOString()
  saveTrips(trips)
  return true
}

function restoreTrip(tripId) {
  const trips = readTrips()
  const trip = trips.find(current => current.id === tripId)
  if (!trip || trip.isDaily) return false
  trip.archived = false
  trip.status = trip.statusBeforeArchive || (isPastTrip(trip) ? 'completed' : 'upcoming')
  delete trip.archivedAt
  delete trip.statusBeforeArchive
  saveTrips(trips)
  return true
}

function deleteTrip(tripId) {
  const trips = readTrips()
  const nextTrips = trips.filter(trip => trip.id !== tripId || trip.isDaily)
  if (nextTrips.length === trips.length) return false
  saveTrips(nextTrips)
  return true
}

const removeTrip = deleteTrip

module.exports = {
  DAILY_TRIP_ID,
  ensureSeedData,
  ensureDailyTrip,
  getTrips,
  getTrip,
  saveTrip,
  saveItem,
  updateBookingStatus,
  deleteItem,
  archiveTrip,
  restoreTrip,
  deleteTrip,
  removeTrip,
  isPastTrip
}
