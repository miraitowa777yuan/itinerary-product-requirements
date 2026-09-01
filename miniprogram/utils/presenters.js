const TYPE_LABELS = {
  flight: '航班',
  train: '高铁 / 火车',
  hotel: '酒店',
  activity: '活动',
  food: '餐饮',
  local_transport: '当地交通',
  custom: '自定义'
}

function tripStatusLabel(status) {
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
    statusLabel: tripStatusLabel(trip.status),
    itemCount: Array.isArray(trip.items) ? trip.items.length : 0
  })
}

function presentItem(item) {
  return Object.assign({}, item, {
    typeLabel: TYPE_LABELS[item.type] || '行程',
    bookingStatusLabel: bookingStatusLabel(item),
    isWaitingToBook: item.bookingStatus === 'waiting_to_book',
    hasRoute: Boolean(item.locationEnd),
    timeLabel: item.startTime ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ''}` : '当天'
  })
}

module.exports = {
  TYPE_LABELS,
  presentTrip,
  presentItem
}

