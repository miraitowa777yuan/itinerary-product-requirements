const tripStore = require('../../utils/trip-store')
const { getHubSuggestions, airlineFromFlightNo } = require('../../utils/transport-data')
const { FLIGHT_CLASSES, TRAIN_CLASSES, parseOrderText } = require('../../utils/order-parser')

const types = [
  { value: 'train', label: '高铁 / 火车' },
  { value: 'flight', label: '航班' },
  { value: 'hotel', label: '酒店' },
  { value: 'intercity_bus', label: '城际巴士' },
  { value: 'activity', label: '活动' },
  { value: 'food', label: '餐饮' },
  { value: 'local_transport', label: '当地交通' },
  { value: 'custom', label: '自定义' }
]

function emptyForm() {
  return {
    type: 'train', title: '', date: '', startTime: '', endTime: '',
    locationStart: '', locationEnd: '', locationStartCity: '', locationEndCity: '',
    departureTerminal: '', arrivalTerminal: '', transportNo: '', airlineName: '',
    city: '', roomType: '', checkOutDate: '', cabinClass: '', seatClass: '',
    driveToNextMinutes: '', bookingStatus: 'waiting_to_book', expectedSaleAt: '',
    preferredSeatClass: '', notes: '', source: 'manual'
  }
}

Page({
  data: {
    tripId: '', itemId: '', entryMode: 'manual', types, typeIndex: 0,
    flightClasses: FLIGHT_CLASSES, trainClasses: TRAIN_CLASSES,
    cabinClassIndex: 0, seatClassIndex: 0, preferredSeatClassIndex: 0,
    startSuggestions: [], endSuggestions: [], screenshotPath: '',
    ocrStatus: 'idle', ocrMessage: '', recognizedText: '', form: emptyForm()
  },

  onLoad(options) {
    const tripId = options.tripId || ''
    const itemId = options.itemId || ''
    const nextData = { tripId, itemId }
    if (itemId) {
      const trip = tripStore.getTrip(tripId)
      const item = trip && trip.items.find(current => current.id === itemId)
      if (item) {
        const form = Object.assign(emptyForm(), item)
        nextData.form = form
        nextData.entryMode = form.source === 'ocr' ? 'scan' : 'manual'
        nextData.typeIndex = Math.max(0, types.findIndex(type => type.value === item.type))
        nextData.cabinClassIndex = Math.max(0, FLIGHT_CLASSES.indexOf(form.cabinClass))
        nextData.seatClassIndex = Math.max(0, TRAIN_CLASSES.indexOf(form.seatClass))
        nextData.preferredSeatClassIndex = Math.max(0, TRAIN_CLASSES.indexOf(form.preferredSeatClass))
      }
    }
    this.setData(nextData)
    wx.setNavigationBarTitle({ title: itemId ? '编辑行程' : '添加行程' })
  },

  onUnload() {
    if (this._ocrTimer) clearTimeout(this._ocrTimer)
    if (this._ocrSession && this._ocrSession.stop) this._ocrSession.stop()
    this._ocrSession = null
  },

  changeEntryMode(event) {
    const entryMode = event.currentTarget.dataset.mode
    this.setData({ entryMode })
  },

  updateField(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  updateTransportNo(event) {
    const transportNo = event.detail.value.toUpperCase().replace(/\s+/g, '')
    this.setData({
      'form.transportNo': transportNo,
      'form.airlineName': this.data.form.type === 'flight' ? airlineFromFlightNo(transportNo) : ''
    })
  },

  updateType(event) {
    const typeIndex = Number(event.detail.value)
    const type = types[typeIndex].value
    this.setData({
      typeIndex,
      'form.type': type,
      'form.bookingStatus': type === 'train' ? 'waiting_to_book' : 'confirmed',
      'form.airlineName': type === 'flight' ? airlineFromFlightNo(this.data.form.transportNo) : '',
      startSuggestions: [], endSuggestions: []
    })
  },

  updateLocationQuery(event) {
    const side = event.currentTarget.dataset.side
    const cityField = side === 'start' ? 'locationStartCity' : 'locationEndCity'
    const locationField = side === 'start' ? 'locationStart' : 'locationEnd'
    const suggestionsField = side === 'start' ? 'startSuggestions' : 'endSuggestions'
    const query = event.detail.value
    this.setData({
      [`form.${cityField}`]: query,
      [`form.${locationField}`]: '',
      [suggestionsField]: getHubSuggestions(this.data.form.type, query)
    })
  },

  selectHub(event) {
    const side = event.currentTarget.dataset.side
    const index = Number(event.currentTarget.dataset.index)
    const suggestionsField = side === 'start' ? 'startSuggestions' : 'endSuggestions'
    const locationField = side === 'start' ? 'locationStart' : 'locationEnd'
    const cityField = side === 'start' ? 'locationStartCity' : 'locationEndCity'
    const terminalField = side === 'start' ? 'departureTerminal' : 'arrivalTerminal'
    const hub = this.data[suggestionsField][index]
    if (!hub) return
    const nextData = {
      [`form.${locationField}`]: hub.name,
      [`form.${cityField}`]: hub.city,
      [`form.${terminalField}`]: '',
      [suggestionsField]: []
    }
    const startCity = side === 'start' ? hub.city : this.data.form.locationStartCity
    const endCity = side === 'end' ? hub.city : this.data.form.locationEndCity
    if ((!this.data.form.title || this.data.form.title.includes('→')) && startCity && endCity) {
      nextData['form.title'] = `${startCity} → ${endCity}`
    }
    this.setData(nextData)
    if (this.data.form.type === 'flight' && hub.terminals.length) {
      wx.showActionSheet({
        itemList: hub.terminals,
        alertText: `选择${side === 'start' ? '出发' : '到达'}航站楼`,
        success: result => this.setData({ [`form.${terminalField}`]: hub.terminals[result.tapIndex] })
      })
    }
  },

  updateCabinClass(event) {
    const cabinClassIndex = Number(event.detail.value)
    this.setData({ cabinClassIndex, 'form.cabinClass': FLIGHT_CLASSES[cabinClassIndex] })
  },

  updateSeatClass(event) {
    const seatClassIndex = Number(event.detail.value)
    this.setData({ seatClassIndex, 'form.seatClass': TRAIN_CLASSES[seatClassIndex] })
  },

  updatePreferredSeatClass(event) {
    const preferredSeatClassIndex = Number(event.detail.value)
    this.setData({ preferredSeatClassIndex, 'form.preferredSeatClass': TRAIN_CLASSES[preferredSeatClassIndex] })
  },

  updateDate(event) { this.setData({ 'form.date': event.detail.value }) },
  updateStartTime(event) { this.setData({ 'form.startTime': event.detail.value }) },
  updateEndTime(event) { this.setData({ 'form.endTime': event.detail.value }) },
  updateCheckOutDate(event) { this.setData({ 'form.checkOutDate': event.detail.value }) },
  updateBookingStatus(event) {
    this.setData({ 'form.bookingStatus': event.detail.value ? 'waiting_to_book' : 'ticketed' })
  },

  chooseScreenshot() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album'],
      success: result => {
        const screenshotPath = result.tempFiles[0].tempFilePath
        this.setData({ screenshotPath, ocrStatus: 'ready', ocrMessage: '图片已选择，可以开始识别。' })
      }
    })
  },

  prepareOcrSession() {
    if (this._ocrSession) return Promise.resolve(this._ocrSession)
    if (this._ocrPreparing) return this._ocrPreparing
    if (!wx.createVKSession) return Promise.reject(new Error('当前微信版本不支持本地 OCR'))
    this._ocrPreparing = new Promise((resolve, reject) => {
      wx.createSelectorQuery().select('#ocr-canvas').node().exec(result => {
        try {
          const canvas = result[0] && result[0].node
          const gl = canvas && canvas.getContext('webgl')
          if (!canvas || !gl) throw new Error('OCR 画布初始化失败')
          const session = wx.createVKSession({ track: { OCR: { mode: 2 } }, version: 'v1', gl })
          session.on('updateAnchors', anchors => this.handleOcrAnchors(anchors))
          session.start(error => {
            if (error) {
              this._ocrPreparing = null
              reject(error)
              return
            }
            this._ocrSession = session
            this._ocrCanvas = canvas
            resolve(session)
          })
        } catch (error) {
          this._ocrPreparing = null
          reject(error)
        }
      })
    })
    return this._ocrPreparing
  },

  handleOcrAnchors(anchors) {
    if (!this._ocrResolve || !Array.isArray(anchors) || !anchors.length) return
    const chunks = []
    anchors.forEach(anchor => {
      if (anchor.text && !chunks.includes(anchor.text)) chunks.push(anchor.text)
      if (!anchor.text && anchor.subtext && !chunks.includes(anchor.subtext)) chunks.push(anchor.subtext)
    })
    const text = chunks.join('\n').trim()
    if (!text) return
    clearTimeout(this._ocrTimer)
    const resolve = this._ocrResolve
    this._ocrResolve = null
    resolve(text)
  },

  async recognizeScreenshot() {
    if (!this.data.screenshotPath || this.data.ocrStatus === 'recognizing') return
    this.setData({ ocrStatus: 'recognizing', ocrMessage: '正在本地识别，请稍候…' })
    wx.showLoading({ title: '本地识别中', mask: true })
    try {
      const session = await this.prepareOcrSession()
      const imageInfo = await new Promise((resolve, reject) => {
        wx.getImageInfo({ src: this.data.screenshotPath, success: resolve, fail: reject })
      })
      const maxSide = 1600
      const scale = Math.min(1, maxSide / Math.max(imageInfo.width, imageInfo.height))
      const width = Math.max(1, Math.round(imageInfo.width * scale))
      const height = Math.max(1, Math.round(imageInfo.height * scale))
      const canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
      const context = canvas.getContext('2d')
      const image = canvas.createImage()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = this.data.screenshotPath
      })
      context.drawImage(image, 0, 0, width, height)
      const imageData = context.getImageData(0, 0, width, height)
      const recognizedText = await new Promise((resolve, reject) => {
        this._ocrResolve = resolve
        this._ocrTimer = setTimeout(() => {
          this._ocrResolve = null
          reject(new Error('识别超时，请换一张更清晰的截图'))
        }, 15000)
        session.runOCR({ frameBuffer: imageData.data.buffer, width, height })
      })
      this.applyRecognizedText(recognizedText)
    } catch (error) {
      const rawMessage = error && error.message ? error.message : ''
      const ocrMessage = /current device does not support|当前设备不支持/i.test(rawMessage)
        ? '开发者工具模拟器不支持本地 OCR，请使用真机预览测试；手动录入仍可正常使用。'
        : (rawMessage || '本地识别失败，请改用手动录入。')
      this.setData({ ocrStatus: 'error', ocrMessage })
      wx.showToast({ title: '识别失败，可手动填写', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  applyRecognizedText(recognizedText) {
    const parsed = parseOrderText(recognizedText)
    const form = Object.assign({}, this.data.form, parsed, {
      bookingStatus: parsed.type === 'train' ? this.data.form.bookingStatus : 'confirmed',
      airlineName: parsed.type === 'flight' ? airlineFromFlightNo(parsed.transportNo) : ''
    })
    this.setData({
      recognizedText, ocrStatus: 'done',
      ocrMessage: '识别完成，请检查并补充下方字段后再保存。',
      typeIndex: Math.max(0, types.findIndex(type => type.value === form.type)), form,
      cabinClassIndex: Math.max(0, FLIGHT_CLASSES.indexOf(form.cabinClass)),
      seatClassIndex: Math.max(0, TRAIN_CLASSES.indexOf(form.seatClass)),
      preferredSeatClassIndex: Math.max(0, TRAIN_CLASSES.indexOf(form.preferredSeatClass))
    })
  },

  save() {
    const form = Object.assign({}, this.data.form)
    if (!form.title || !form.date) {
      wx.showToast({ title: `请填写${form.type === 'hotel' ? '酒店名称' : '标题'}和日期`, icon: 'none' })
      return
    }
    if (form.type === 'hotel') {
      form.locationStart = ''; form.locationEnd = ''
      form.locationStartCity = ''; form.locationEndCity = ''
    }
    if (form.driveToNextMinutes !== '') {
      const minutes = Number(form.driveToNextMinutes)
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
        wx.showToast({ title: '驾车时长请填写 1–1440 分钟', icon: 'none' })
        return
      }
      form.driveToNextMinutes = String(Math.round(minutes))
    }
    form.source = this.data.entryMode === 'scan' ? 'ocr' : 'manual'
    if (this.data.itemId) form.id = this.data.itemId
    tripStore.saveItem(this.data.tripId, form)
    wx.navigateBack()
  },

  remove() {
    wx.showModal({
      title: '删除这项行程？', content: '删除后无法在当前原型中恢复。', confirmColor: '#9f3229',
      success: result => {
        if (!result.confirm) return
        tripStore.deleteItem(this.data.tripId, this.data.itemId)
        wx.navigateBack()
      }
    })
  }
})
