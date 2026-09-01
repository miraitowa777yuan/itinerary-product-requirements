const tripStore = require('../../utils/trip-store')
const { presentTrip } = require('../../utils/presenters')

Page({
  data: {
    trips: []
  },

  onShow() {
    this.setData({ trips: tripStore.getTrips().map(presentTrip) })
  },

  openTrip(event) {
    wx.navigateTo({ url: `/pages/trip/detail?id=${event.currentTarget.dataset.id}` })
  },

  createTrip() {
    wx.navigateTo({ url: '/pages/trip/edit' })
  }
})

