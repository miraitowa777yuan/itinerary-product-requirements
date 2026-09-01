const { ensureCloud } = require('./cloud')

function isAirport(item, location) {
  return item.type === 'flight' || /机场|航站楼|airport|terminal/i.test(location || '')
}

function buildAirportHotelPairs(items) {
  const pairs = []
  for (let index = 0; index < items.length - 1; index += 1) {
    const fromItem = items[index]
    const toItem = items[index + 1]
    const origin = fromItem.locationEnd || fromItem.locationStart
    const destination = toItem.locationStart
    const airportHotel = (isAirport(fromItem, origin) && toItem.type === 'hotel') ||
      (fromItem.type === 'hotel' && isAirport(toItem, destination))
    if (airportHotel && origin && destination) {
      pairs.push({ id: `${fromItem.id}__${toItem.id}`, fromItemId: fromItem.id, toItemId: toItem.id, origin, destination })
    }
  }
  return pairs
}

function fetchDurations(pairs) {
  ensureCloud()
  if (!pairs.length) return Promise.resolve([])
  return wx.cloud.callFunction({ name: 'routeDuration', data: { pairs } })
    .then((result) => ((result.result && result.result.routes) || []).filter((route) => route.durationMinutes))
}

module.exports = { buildAirportHotelPairs, fetchDurations }
