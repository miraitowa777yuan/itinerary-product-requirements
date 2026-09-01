const { airlineFromFlightNo } = require('./transport-data')

const TYPE_LABELS = {
  flight: '航班',
  train: '高铁 / 火车',
  intercity_bus: '城际巴士',
  hotel: '酒店',
  activity: '活动',
  food: '餐饮',
  local_transport: '当地交通',
  custom: '自定义'
}

function isPastTrip(trip) {
  if (!trip || !trip.endDate) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return trip.endDate < today
}

function tripStatusLabel(status, trip) {
  if (trip && trip.archived) return '已归档'
  if (status === 'completed' || isPastTrip(trip)) return '已结束'
  return {
    upcoming: '即将出发',
    active: '旅途中',
    completed: '已结束',
    archived: '已归档'
  }[status] || '计划中'
}

function bookingStatusLabel(item) {
  if (item.bookingStatus === 'waiting_to_book') return '待抢票'
  if (item.bookingStatus === 'ticketed') return '已出票'
  if (item.bookingStatus === 'confirmed') return '已确认'
  return '计划中'
}

function presentTrip(trip) {
  return Object.assign({}, trip, {
    statusLabel: tripStatusLabel(trip.status, trip),
    itemCount: Array.isArray(trip.items) ? trip.items.length : 0,
    isArchived: Boolean(trip.archived),
    isPast: isPastTrip(trip)
  })
}

function presentItem(item) {
  return Object.assign({}, item, {
    typeLabel: TYPE_LABELS[item.type] || '行程',
    bookingStatusLabel: bookingStatusLabel(item),
    isWaitingToBook: item.bookingStatus === 'waiting_to_book',
    hasRoute: Boolean(item.locationEnd),
    timeLabel: item.startTime ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ''}` : '当天',
    travelClassLabel: item.seatClass || item.cabinClass || item.preferredSeatClass || '',
    hotelMetaLabel: [item.city, item.roomType, item.checkOutDate ? `退房 ${item.checkOutDate}` : ''].filter(Boolean).join(' · '),
    airlineName: item.type === 'flight' ? (item.airlineName || airlineFromFlightNo(item.transportNo)) : '',
    terminalLabel: item.type === 'flight'
      ? [item.departureTerminal ? `出发 ${item.departureTerminal}` : '', item.arrivalTerminal ? `到达 ${item.arrivalTerminal}` : ''].filter(Boolean).join(' · ')
      : ''
  })
}

module.exports = {
  TYPE_LABELS,
  presentTrip,
  presentItem
}
