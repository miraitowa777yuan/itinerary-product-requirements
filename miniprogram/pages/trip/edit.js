const tripStore = require('../../utils/trip-store')

Page({
  data: {
    form: {
      title: '',
      destination: '',
      startDate: '',
      endDate: ''
    }
  },

  updateField(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  updateStartDate(event) {
    this.setData({ 'form.startDate': event.detail.value })
  },

  updateEndDate(event) {
    this.setData({ 'form.endDate': event.detail.value })
  },

  save() {
    const { title, destination, startDate, endDate } = this.data.form
    if (!title || !startDate || !endDate) {
      wx.showToast({ title: '请填写名称和日期', icon: 'none' })
      return
    }
    const trip = tripStore.saveTrip({ title, destination, startDate, endDate })
    wx.redirectTo({ url: `/pages/trip/detail?id=${trip.id}` })
  }
})

