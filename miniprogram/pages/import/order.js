const tripStore = require('../../utils/trip-store')
const { uploadAndAnalyze } = require('../../services/order-recognition')
const { cloudErrorMessage } = require('../../services/cloud')

const typeOptions = [
  { value: 'auto', label: '自动判断' },
  { value: 'hotel', label: '酒店订单' },
  { value: 'flight', label: '机票' },
  { value: 'train', label: '高铁 / 火车票' },
  { value: 'intercity_bus', label: '城际巴士' }
]

function emptyForm() {
  return {
    type: '',
    title: '',
    city: '',
    roomType: '',
    date: '',
    checkOutDate: '',
    startTime: '',
    endTime: '',
    locationStart: '',
    locationEnd: '',
    transportNo: '',
    cabinClass: '',
    seatClass: '',
    bookingStatus: 'ticketed',
    notes: ''
  }
}

Page({
  data: {
    tripId: '',
    typeOptions,
    typeIndex: 0,
    imagePath: '',
    cloudFileID: '',
    recognizing: false,
    recognized: false,
    confidence: 0,
    warnings: [],
    form: emptyForm()
  },

  onLoad(options) {
    this.setData({ tripId: options.tripId || '' })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        const file = result.tempFiles && result.tempFiles[0]
        if (!file) return
        if (file.size && file.size > 7 * 1024 * 1024) {
          wx.showToast({ title: '截图请小于 7MB', icon: 'none' })
          return
        }
        this.setData({ imagePath: file.tempFilePath, recognized: false, form: emptyForm(), warnings: [] })
        this.analyze()
      }
    })
  },

  updateHintType(event) {
    this.setData({ typeIndex: Number(event.detail.value) })
  },

  analyze() {
    if (!this.data.imagePath || this.data.recognizing) return
    this.setData({ recognizing: true })
    wx.showLoading({ title: '正在识别订单', mask: true })
    const hintType = typeOptions[this.data.typeIndex].value
    uploadAndAnalyze(this.data.imagePath, hintType)
      .then(({ result }) => {
        if (!result || !result.ok) throw new Error((result && result.message) || '订单识别失败')
        const item = Object.assign(emptyForm(), result.item || {})
        this.setData({
          recognized: true,
          confidence: result.confidence || 0,
          warnings: result.warnings || [],
          form: item
        })
      })
      .catch((error) => {
        wx.showModal({ title: '暂时无法识别', content: cloudErrorMessage(error), showCancel: false })
      })
      .finally(() => {
        wx.hideLoading()
        this.setData({ recognizing: false })
      })
  },

  updateField(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  updateDate(event) {
    this.setData({ 'form.date': event.detail.value })
  },

  updateCheckOutDate(event) {
    this.setData({ 'form.checkOutDate': event.detail.value })
  },

  updateStartTime(event) {
    this.setData({ 'form.startTime': event.detail.value })
  },

  updateEndTime(event) {
    this.setData({ 'form.endTime': event.detail.value })
  },

  updateTrainStatus(event) {
    this.setData({ 'form.bookingStatus': event.detail.value ? 'waiting_to_book' : 'ticketed' })
  },

  save() {
    const form = Object.assign({}, this.data.form)
    if (!form.type || !form.date) {
      wx.showToast({ title: '请确认类型和日期', icon: 'none' })
      return
    }
    if (!form.title) {
      form.title = form.type === 'hotel'
        ? (form.locationStart || '酒店住宿')
        : [form.locationStart, form.locationEnd].filter(Boolean).join(' → ')
    }
    if (!form.title) {
      wx.showToast({ title: '请填写酒店名或出发地', icon: 'none' })
      return
    }
    form.source = 'screenshot_ocr'
    tripStore.saveItem(this.data.tripId, form)
    wx.showToast({ title: '已加入行程' })
    setTimeout(() => wx.navigateBack(), 500)
  }
})
