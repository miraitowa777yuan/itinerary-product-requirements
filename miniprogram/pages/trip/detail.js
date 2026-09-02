const tripStore = require('../../utils/trip-store')
const { presentTrip, presentItem, summarizeTripCosts } = require('../../utils/presenters')

function transferEndpoint(item, side) {
  if (!item) return ''
  if (item.type === 'hotel') return item.title || item.city || ''
  if (side === 'from') return item.locationEnd || item.locationStart || item.title || ''
  return item.locationStart || item.locationEnd || item.title || ''
}

function canAddTaxiBetween(fromItem, toItem) {
  const supportedTypes = ['hotel', 'flight', 'train', 'intercity_bus', 'local_transport']
  if (!fromItem || !toItem || !supportedTypes.includes(fromItem.type) || !supportedTypes.includes(toItem.type)) return false
  return Boolean(transferEndpoint(fromItem, 'from') && transferEndpoint(toItem, 'to'))
}

Page({
  data: {
    tripId: '',
    trip: null,
    items: [],
    expenseSummary: { totalLabel: '¥0.00', pricedItemCount: 0, itemCount: 0, hasCosts: false, breakdown: [] },
    showExpenseDetails: false
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
    const items = trip.items.map(presentItem).map((item, index, list) => {
      const nextItem = list[index + 1]
      if (!canAddTaxiBetween(item, nextItem)) return item
      return Object.assign({}, item, {
        showTaxiAction: true,
        transferToId: nextItem.id,
        transferRouteLabel: `${transferEndpoint(item, 'from')} → ${transferEndpoint(nextItem, 'to')}`
      })
    })
    this.setData({
      trip: presentTrip(trip),
      items,
      expenseSummary: summarizeTripCosts(trip)
    })
  },

  toggleExpenseDetails() {
    this.setData({ showExpenseDetails: !this.data.showExpenseDetails })
  },

  addItem() {
    wx.navigateTo({ url: `/pages/item/edit?tripId=${this.data.tripId}` })
  },

  editItem(event) {
    wx.navigateTo({
      url: `/pages/item/edit?tripId=${this.data.tripId}&itemId=${event.currentTarget.dataset.id}`
    })
  },

  addTaxiBetween(event) {
    const fromId = event.currentTarget.dataset.fromId
    const toId = event.currentTarget.dataset.toId
    if (!fromId || !toId) return
    wx.navigateTo({
      url: `/pages/item/edit?tripId=${encodeURIComponent(this.data.tripId)}&type=taxi&fromId=${encodeURIComponent(fromId)}&toId=${encodeURIComponent(toId)}`
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
