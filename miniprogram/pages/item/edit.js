const tripStore = require('../../utils/trip-store')

const types = [
  { value: 'train', label: '高铁 / 火车' },
  { value: 'flight', label: '航班' },
  { value: 'hotel', label: '酒店' },
  { value: 'activity', label: '活动' },
  { value: 'food', label: '餐饮' },
  { value: 'local_transport', label: '当地交通' },
  { value: 'custom', label: '自定义' }
]

Page({
  data: {
    tripId: '',
    itemId: '',
    types,
    typeIndex: 0,
    form: {
      type: 'train',
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      locationStart: '',
      locationEnd: '',
      transportNo: '',
      bookingStatus: 'waiting_to_book',
      expectedSaleAt: '',
      preferredSeatClass: '',
      notes: ''
    }
  },

  onLoad(options) {
    const tripId = options.tripId || ''
    const itemId = options.itemId || ''
    const nextData = { tripId, itemId }
    if (itemId) {
      const trip = tripStore.getTrip(tripId)
      const item = trip && trip.items.find((current) => current.id === itemId)
      if (item) {
        nextData.form = Object.assign({}, this.data.form, item)
        nextData.typeIndex = Math.max(0, types.findIndex((type) => type.value === item.type))
      }
    }
    this.setData(nextData)
    wx.setNavigationBarTitle({ title: itemId ? '编辑行程' : '添加行程' })
  },

  updateField(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  updateType(event) {
    const typeIndex = Number(event.detail.value)
    const type = types[typeIndex].value
    this.setData({
      typeIndex,
      'form.type': type,
      'form.bookingStatus': type === 'train' ? 'waiting_to_book' : 'confirmed'
    })
  },

  updateDate(event) {
    this.setData({ 'form.date': event.detail.value })
  },

  updateStartTime(event) {
    this.setData({ 'form.startTime': event.detail.value })
  },

  updateEndTime(event) {
    this.setData({ 'form.endTime': event.detail.value })
  },

  updateBookingStatus(event) {
    this.setData({ 'form.bookingStatus': event.detail.value ? 'waiting_to_book' : 'ticketed' })
  },

  save() {
    const form = this.data.form
    if (!form.title || !form.date) {
      wx.showToast({ title: '请填写标题和日期', icon: 'none' })
      return
    }
    const item = Object.assign({}, form)
    if (this.data.itemId) item.id = this.data.itemId
    tripStore.saveItem(this.data.tripId, item)
    wx.navigateBack()
  },

  remove() {
    wx.showModal({
      title: '删除这项行程？',
      content: '删除后无法在当前原型中恢复。',
      confirmColor: '#9f3229',
      success: (result) => {
        if (!result.confirm) return
        tripStore.deleteItem(this.data.tripId, this.data.itemId)
        wx.navigateBack()
      }
    })
  }
})
