const tripStore = require('../../utils/trip-store')
const { presentTrip } = require('../../utils/presenters')

Page({
  data: {
    trips: []
  },

  onShow() {
    this.updateTabBar(2)
    this.loadTrips()
  },

  updateTabBar(selected) {
    if (typeof this.getTabBar !== 'function') return
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.setData({ selected })
  },

  loadTrips() {
    const trips = tripStore.getTrips({
      includeArchived: true,
      includeDaily: false,
      includePast: true
    }).filter(trip => trip.archived || tripStore.isPastTrip(trip))
      .sort((left, right) => {
        const leftKey = left.endDate || left.archivedAt || ''
        const rightKey = right.endDate || right.archivedAt || ''
        return String(rightKey).localeCompare(String(leftKey))
      })
      .map(presentTrip)
    this.setData({ trips })
  },

  openTrip(event) {
    wx.navigateTo({ url: `/pages/trip/detail?id=${event.currentTarget.dataset.id}` })
  },

  restoreTrip(event) {
    const tripId = event.currentTarget.dataset.id
    if (!tripId || !tripStore.restoreTrip(tripId)) return
    this.loadTrips()
    wx.showToast({ title: '已移回旅行行程', icon: 'none' })
  },

  confirmDeleteTrip(event) {
    const tripId = event.currentTarget.dataset.id
    if (!tripId) return
    wx.showModal({
      title: '删除这个旅行？',
      content: '删除后会同时移除其中的酒店、交通和其他行程，且无法恢复。',
      confirmText: '删除',
      confirmColor: '#9f3229',
      success: result => {
        if (!result.confirm) return
        if (!tripStore.deleteTrip(tripId)) return
        this.loadTrips()
        wx.showToast({ title: '已删除', icon: 'none' })
      }
    })
  }
})
