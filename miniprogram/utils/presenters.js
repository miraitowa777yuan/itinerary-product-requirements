const { airlineFromFlightNo } = require('./transport-data')

const TYPE_LABELS = {
  flight: '航班',
  train: '高铁 / 火车',
  intercity_bus: '城际巴士',
  hotel: '酒店',
  activity: '活动',
  food: '餐饮',
  local_transport: '当地交通',
  taxi: '打车',
  custom: '自定义'
}

const COST_GROUPS = {
  flight: { key: 'flight', label: '机票' },
  hotel: { key: 'hotel', label: '酒店' },
  train: { key: 'train', label: '火车票' },
  taxi: { key: 'taxi', label: '打车' },
  intercity_bus: { key: 'intercity_bus', label: '城际巴士' },
  other: { key: 'other', label: '其他' }
}

const COST_COLORS = {
  flight: '#3D7185',
  hotel: '#C47756',
  train: '#5F6FA5',
  taxi: '#C28A3C',
  intercity_bus: '#8267A7',
  other: '#82928A'
}

function parsePrice(value) {
  const raw = String(value == null ? '' : value).trim().replace(/[¥￥元人民币,\s]/g, '')
  if (!raw) return null
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null
  const amount = Number(raw)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function formatPrice(value) {
  const amount = typeof value === 'number' ? value : parsePrice(value)
  return amount === null || !Number.isFinite(amount) ? '' : `¥${amount.toFixed(2)}`
}

function costGroupForType(type) {
  return COST_GROUPS[type] || COST_GROUPS.other
}

function summarizeTripCosts(trip) {
  const groups = {}
  let total = 0
  let pricedItemCount = 0
  const items = Array.isArray(trip && trip.items) ? trip.items : []
  items.forEach(item => {
    const amount = parsePrice(item && item.price)
    if (amount === null) return
    const group = costGroupForType(item.type)
    if (!groups[group.key]) groups[group.key] = { key: group.key, label: group.label, amount: 0, count: 0 }
    groups[group.key].amount += amount
    groups[group.key].count += 1
    total += amount
    pricedItemCount += 1
  })
  const order = ['flight', 'hotel', 'train', 'taxi', 'intercity_bus', 'other']
  const breakdown = order
    .map(key => groups[key])
    .filter(Boolean)
    .map(group => Object.assign({}, group, {
      amountLabel: formatPrice(group.amount),
      countLabel: `${group.count} 项`,
      color: COST_COLORS[group.key] || COST_COLORS.other,
      percent: total > 0 ? group.amount / total : 0,
      percentLabel: total > 0 ? `${(group.amount / total * 100).toFixed(1)}%` : '0%'
    }))
  return {
    total,
    totalLabel: formatPrice(total) || '¥0.00',
    pricedItemCount,
    itemCount: items.length,
    hasCosts: pricedItemCount > 0,
    breakdown
  }
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
  const priceValue = parsePrice(item.price)
  return Object.assign({}, item, {
    typeLabel: TYPE_LABELS[item.type] || '行程',
    bookingStatusLabel: bookingStatusLabel(item),
    isWaitingToBook: item.bookingStatus === 'waiting_to_book',
    hasRoute: Boolean(item.locationEnd),
    timeLabel: item.type === 'taxi'
      ? '车程'
      : (item.startTime ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ''}` : '当天'),
    travelClassLabel: item.seatClass || item.cabinClass || item.preferredSeatClass || '',
    hotelMetaLabel: [item.city, item.roomType, item.checkOutDate ? `退房 ${item.checkOutDate}` : ''].filter(Boolean).join(' · '),
    priceValue,
    priceLabel: formatPrice(priceValue),
    hasPrice: priceValue !== null,
    durationLabel: item.type === 'taxi' && item.durationMinutes ? `车程 ${item.durationMinutes} 分钟` : '',
    airlineName: item.type === 'flight' ? (item.airlineName || airlineFromFlightNo(item.transportNo)) : '',
    terminalLabel: item.type === 'flight'
      ? [item.departureTerminal ? `出发 ${item.departureTerminal}` : '', item.arrivalTerminal ? `到达 ${item.arrivalTerminal}` : ''].filter(Boolean).join(' · ')
      : ''
  })
}

module.exports = {
  TYPE_LABELS,
  parsePrice,
  formatPrice,
  summarizeTripCosts,
  presentTrip,
  presentItem
}
