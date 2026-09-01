const STORAGE_KEY = 'itinerary_trips_v1'

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

function ensureSeedData() {
  const current = wx.getStorageSync(STORAGE_KEY)
  if (!Array.isArray(current)) {
    wx.setStorageSync(STORAGE_KEY, clone(seedTrips))
  }
}

function getTrips() {
  ensureSeedData()
  return clone(wx.getStorageSync(STORAGE_KEY) || [])
}

function saveTrips(trips) {
  wx.setStorageSync(STORAGE_KEY, clone(trips))
}

function getTrip(tripId) {
  return getTrips().find((trip) => trip.id === tripId) || null
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function saveTrip(input) {
  const trips = getTrips()
  const trip = Object.assign({
    id: makeId('trip'),
    status: 'upcoming',
    items: []
  }, input)
  const index = trips.findIndex((item) => item.id === trip.id)
  if (index >= 0) {
    trip.items = Array.isArray(input.items) ? input.items : trips[index].items
    trips[index] = trip
  } else {
    trips.unshift(trip)
  }
  saveTrips(trips)
  return clone(trip)
}

function saveItem(tripId, input) {
  const trips = getTrips()
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
  trips[tripIndex].items.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
  saveTrips(trips)
  return clone(item)
}

function updateBookingStatus(tripId, itemId, bookingStatus) {
  const trips = getTrips()
  const trip = trips.find((current) => current.id === tripId)
  if (!trip) return false
  const item = trip.items.find((current) => current.id === itemId)
  if (!item) return false
  item.bookingStatus = bookingStatus
  saveTrips(trips)
  return true
}

function deleteItem(tripId, itemId) {
  const trips = getTrips()
  const trip = trips.find((current) => current.id === tripId)
  if (!trip) return false
  trip.items = trip.items.filter((item) => item.id !== itemId)
  saveTrips(trips)
  return true
}

module.exports = {
  ensureSeedData,
  getTrips,
  getTrip,
  saveTrip,
  saveItem,
  updateBookingStatus,
  deleteItem
}
