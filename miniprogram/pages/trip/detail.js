const tripStore = require('../../utils/trip-store')
const { presentTrip, presentItem } = require('../../utils/presenters')
const { buildAirportHotelPairs, fetchDurations } = require('../../services/route-duration')

Page({
  data: {
    tripId: '',
    trip: null,
    items: [],
    routeLoading: false,
    routeMessage: ''
  },

  onLoad(options) {
    this.setData({ tripId: options.id || '' })
  },

  onShow() {
    this.loadTrip()
  },

  loadTrip() {
    const trip = tripStore.getTrip(this.data.tripId)
    if (!trip) {
      wx.showToast({ title: '旅行不存在', icon: 'none' })
      return
    }
    wx.setNavigationBarTitle({ title: trip.title })
    const items = trip.items.map(presentItem)
    this.setData({
      trip: presentTrip(trip),
      items: this.attachRouteLegs(items, trip.routeLegs || [])
    })
    this.loadRouteDurations(trip, false)
  },

  attachRouteLegs(items, routeLegs) {
    const routeMap = {}
    routeLegs.forEach((route) => { routeMap[route.fromItemId] = route })
    return items.map((item) => Object.assign({}, item, { routeToNext: routeMap[item.id] || null }))
  },

  loadRouteDurations(trip, force) {
    const pairs = buildAirportHotelPairs(trip.items)
    if (!pairs.length || this.data.routeLoading) return
    const cached = trip.routeLegs || []
    const currentSignature = pairs.map((pair) => `${pair.id}:${pair.origin}:${pair.destination}`).join('|')
    const cachedSignature = cached.map((route) => `${route.id}:${route.origin}:${route.destination}`).join('|')
    if (!force && cached.length && currentSignature === cachedSignature) return

    this.setData({ routeLoading: true, routeMessage: '' })
    fetchDurations(pairs)
      .then((routes) => {
        tripStore.saveRouteLegs(this.data.tripId, routes)
        this.setData({ items: this.attachRouteLegs(this.data.items, routes) })
      })
      .catch(() => {
        this.setData({ routeMessage: '配置腾讯地图服务后，将自动显示机场与酒店间的驾车时长。' })
      })
      .finally(() => this.setData({ routeLoading: false }))
  },

  refreshRoutes() {
    const trip = tripStore.getTrip(this.data.tripId)
    if (trip) this.loadRouteDurations(trip, true)
  },

  addItem() {
    wx.navigateTo({ url: `/pages/item/edit?tripId=${this.data.tripId}` })
  },

  importScreenshot() {
    wx.navigateTo({ url: `/pages/import/order?tripId=${this.data.tripId}` })
  },

  editItem(event) {
    wx.navigateTo({
      url: `/pages/item/edit?tripId=${this.data.tripId}&itemId=${event.currentTarget.dataset.id}`
    })
  },

  markTicketed(event) {
    const itemId = event.currentTarget.dataset.id
    wx.showModal({
      title: '确认已经出票？',
      content: '状态将从“待抢票”更新为“已出票”。',
      confirmText: '已出票',
      success: (result) => {
        if (!result.confirm) return
        tripStore.updateBookingStatus(this.data.tripId, itemId, 'ticketed')
        this.loadTrip()
        wx.showToast({ title: '已更新' })
      }
    })
  }
})
