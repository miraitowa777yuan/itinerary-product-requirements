const tripStore = require('../../utils/trip-store')
const socialStore = require('../../utils/social-store')
const { presentTrip, presentItem, summarizeTripCosts, formatPrice } = require('../../utils/presenters')

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

function presentAaShare(share, friends) {
  if (!share) return null
  const friendMap = (friends || []).reduce((map, friend) => {
    map[friend.id] = friend.name
    return map
  }, {})
  const friendNames = (share.friendIds || []).map(id => friendMap[id]).filter(Boolean)
  const peopleCount = Number(share.peopleCount) || friendNames.length + 1
  const perPerson = Number.isFinite(Number(share.perPersonAmount))
    ? Number(share.perPersonAmount)
    : peopleCount > 0 ? Number(share.total || 0) / peopleCount : 0
  return Object.assign({}, share, {
    friendNames: friendNames.join('、') || '已选择好友',
    peopleCount,
    perPersonLabel: formatPrice(perPerson) || '¥0.00'
  })
}

Page({
  data: {
    tripId: '',
    trip: null,
    items: [],
    expenseSummary: { totalLabel: '¥0.00', pricedItemCount: 0, itemCount: 0, hasCosts: false, breakdown: [] },
    showExpenseDetails: false,
    friends: [],
    showAaPicker: false,
    aaShare: null
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
    const friends = socialStore.getFriends()
    this.setData({
      trip: presentTrip(trip),
      items,
      expenseSummary: summarizeTripCosts(trip),
      friends,
      aaShare: presentAaShare(socialStore.getTripShare(trip.id), friends)
    }, () => {
      if (this.data.showExpenseDetails) this.drawExpenseChart()
    })
  },

  toggleExpenseDetails() {
    const showExpenseDetails = !this.data.showExpenseDetails
    this.setData({ showExpenseDetails }, () => {
      if (showExpenseDetails) this.drawExpenseChart()
    })
  },

  drawExpenseChart() {
    const summary = this.data.expenseSummary
    if (!summary || !summary.hasCosts || !wx.createSelectorQuery) return
    const query = wx.createSelectorQuery().in(this)
    query.select('#expense-ring').fields({ node: true, size: true }).exec(result => {
      const field = result && result[0]
      const canvas = field && field.node
      const size = field && Math.min(Number(field.width) || 0, Number(field.height) || Number(field.width) || 0)
      if (!canvas || !size) return
      const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const dpr = Number(systemInfo.pixelRatio) || 2
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
      const context = canvas.getContext('2d')
      if (!context) return
      context.scale(dpr, dpr)
      context.clearRect(0, 0, size, size)
      const center = size / 2
      const radius = size * 0.35
      const lineWidth = size * 0.16
      context.lineWidth = lineWidth
      context.lineCap = 'butt'
      const total = Number(summary.total) || 0
      if (total <= 0) {
        context.beginPath()
        context.strokeStyle = '#D9E4DE'
        context.arc(center, center, radius, 0, Math.PI * 2)
        context.stroke()
      } else {
        let startAngle = -Math.PI / 2
        summary.breakdown.forEach(item => {
          const ratio = Number(item.percent) || 0
          const endAngle = startAngle + ratio * Math.PI * 2
          context.beginPath()
          context.strokeStyle = item.color || '#92A99C'
          context.arc(center, center, radius, startAngle, endAngle)
          context.stroke()
          startAngle = endAngle
        })
      }
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = '#17483C'
      context.font = `700 ${Math.max(12, Math.round(size * 0.105))}px sans-serif`
      context.fillText(summary.totalLabel, center, center - size * 0.06)
      context.fillStyle = '#78857E'
      context.font = `${Math.max(10, Math.round(size * 0.065))}px sans-serif`
      context.fillText('总计', center, center + size * 0.11)
    })
  },

  startAaShare() {
    if (!this.data.expenseSummary.hasCosts) {
      wx.showToast({ title: '请先填写至少一项价格', icon: 'none' })
      return
    }
    const friends = socialStore.getFriends()
    if (!friends.length) {
      wx.showModal({
        title: '还没有好友',
        content: '先在“个人”页面添加好友，再回来共享 AA 账单。',
        confirmText: '去添加',
        success: result => {
          if (result.confirm) wx.switchTab({ url: '/pages/profile/index' })
        }
      })
      return
    }
    this.setData({
      friends: friends.map(friend => Object.assign({}, friend, { selected: false })),
      showAaPicker: true
    })
  },

  stopAaPicker() {},

  closeAaPicker() {
    this.setData({ showAaPicker: false })
  },

  toggleAaFriend(event) {
    const friendId = event.currentTarget.dataset.id
    this.setData({
      friends: this.data.friends.map(friend => friend.id === friendId
        ? Object.assign({}, friend, { selected: !friend.selected })
        : friend)
    })
  },

  confirmAaShare() {
    const friendIds = this.data.friends.filter(friend => friend.selected).map(friend => friend.id)
    if (!friendIds.length) {
      wx.showToast({ title: '请选择至少一位好友', icon: 'none' })
      return
    }
    const summary = this.data.expenseSummary
    const saved = socialStore.shareTrip({
      tripId: this.data.tripId,
      tripTitle: this.data.trip && this.data.trip.title,
      friendIds,
      total: summary.total,
      totalLabel: summary.totalLabel,
      breakdown: summary.breakdown,
      itinerary: this.data.items.map(item => ({
        id: item.id,
        typeLabel: item.typeLabel,
        title: item.title,
        date: item.date,
        timeLabel: item.timeLabel,
        locationStart: item.locationStart,
        locationEnd: item.locationEnd,
        priceLabel: item.priceLabel,
        durationLabel: item.durationLabel
      }))
    })
    this.setData({
      showAaPicker: false,
      aaShare: presentAaShare(saved, this.data.friends)
    })
    wx.showToast({ title: 'AA 账单已共享' })
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
