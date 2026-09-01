const tripStore = require('../../utils/trip-store')
const { presentTrip, presentItem } = require('../../utils/presenters')

Page({
  data: {
    tripId: '',
    trip: null,
    items: []
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
    this.setData({
      trip: presentTrip(trip),
      items: trip.items.map(presentItem)
    })
  },

  addItem() {
    wx.navigateTo({ url: `/pages/item/edit?tripId=${this.data.tripId}` })
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
