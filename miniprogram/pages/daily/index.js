const tripStore = require('../../utils/trip-store')
const { presentTrip, presentItem } = require('../../utils/presenters')

Page({
  data: {
    trip: null,
    items: []
  },

  onShow() {
    tripStore.ensureDailyTrip()
    this.loadTrip()
  },

  loadTrip() {
    const trip = tripStore.getTrip(tripStore.DAILY_TRIP_ID)
    if (!trip) return
    this.setData({
      trip: presentTrip(trip),
      items: trip.items.map(presentItem)
    })
  },

  addItem() {
    wx.navigateTo({ url: `/pages/item/edit?tripId=${tripStore.DAILY_TRIP_ID}` })
  },

  editItem(event) {
    wx.navigateTo({
      url: `/pages/item/edit?tripId=${tripStore.DAILY_TRIP_ID}&itemId=${event.currentTarget.dataset.id}`
    })
  },

  markTicketed(event) {
    const itemId = event.currentTarget.dataset.id
    wx.showModal({
      title: '确认已经出票？',
      content: '状态将从“待抢票”更新为“已出票”。',
      confirmText: '已出票',
      success: result => {
        if (!result.confirm) return
        tripStore.updateBookingStatus(tripStore.DAILY_TRIP_ID, itemId, 'ticketed')
        this.loadTrip()
        wx.showToast({ title: '已更新' })
      }
    })
  }
})
