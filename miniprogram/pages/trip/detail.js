const tripStore = require('../../utils/trip-store')
const socialStore = require('../../utils/social-store')
const {
  presentTrip,
  presentItem,
  summarizeTripCosts,
  summarizeTripSplit,
  participantIdsForItem,
  formatPrice,
  parsePrice
} = require('../../utils/presenters')

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
  const splitSummary = share.splitSummary && Array.isArray(share.splitSummary.participants)
    ? share.splitSummary
    : null
  const friendNames = (share.friendIds || []).map(id => friendMap[id]).filter(Boolean)
  const splitFriendNames = splitSummary
    ? splitSummary.participants.filter(participant => participant.id !== 'self').map(participant => participant.name).filter(Boolean)
    : []
  const peopleCount = Number(share.peopleCount) || Number(splitSummary && splitSummary.peopleCount) || friendNames.length + 1
  const perPerson = Number.isFinite(Number(share.perPersonAmount))
    ? Number(share.perPersonAmount)
    : peopleCount > 0 ? Number(share.total || 0) / peopleCount : 0
  const participantAmounts = splitSummary
    ? splitSummary.participants.map(participant => Object.assign({}, participant, {
      amountLabel: participant.amountLabel || formatPrice(participant.amount || 0)
    }))
    : [{ id: 'self', name: '我', amountLabel: formatPrice(perPerson) || '¥0.00' }]
      .concat((share.friendIds || []).map(id => ({
        id,
        name: friendMap[id] || '已选择好友',
        amountLabel: formatPrice(perPerson) || '¥0.00'
      })))
  const itemRows = splitSummary && Array.isArray(splitSummary.items)
    ? splitSummary.items.map(item => Object.assign({}, item, {
      amountLabel: item.amountLabel || formatPrice(item.amount || 0),
      participantLabel: item.participantLabel || (item.participantNames || []).join('、')
    }))
    : []
  return Object.assign({}, share, {
    friendNames: (friendNames.length ? friendNames : splitFriendNames).join('、') || '已选择好友',
    peopleCount,
    perPersonLabel: formatPrice(perPerson) || '¥0.00',
    splitModeLabel: splitSummary ? '按每项参与人计算' : '所有人均摊',
    participantAmounts,
    itemRows
  })
}

function defaultAaFriendIds(items, friends) {
  const allFriendIds = (friends || []).map(friend => friend.id)
  const selected = new Set()
  let hasLegacyItem = false
  const sourceItems = Array.isArray(items) ? items : []
  sourceItems.forEach(item => {
    if (!item.hasPrice && parsePrice(item.price) === null) return
    if (Array.isArray(item.participantIds) && item.participantIds.length) {
      item.participantIds.forEach(id => {
        if (id !== 'self' && allFriendIds.includes(id)) selected.add(id)
      })
    } else {
      hasLegacyItem = true
    }
  })
  if (hasLegacyItem) allFriendIds.forEach(id => selected.add(id))
  return allFriendIds.filter(id => selected.has(id))
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
    const defaultFriendIds = defaultAaFriendIds(this.data.items, friends)
    this.setData({
      friends: friends.map(friend => Object.assign({}, friend, { selected: defaultFriendIds.includes(friend.id) })),
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
    const selectedIds = new Set(['self'].concat(friendIds))
    const friendMap = this.data.friends.reduce((map, friend) => {
      map[friend.id] = friend.name
      return map
    }, {})
    const missingParticipantIds = []
    this.data.items.forEach(item => {
      if (!item.hasPrice && parsePrice(item.price) === null) return
      participantIdsForItem(item, friendIds).forEach(id => {
        if (id !== 'self' && friendMap[id] && !selectedIds.has(id) && !missingParticipantIds.includes(id)) {
          missingParticipantIds.push(id)
        }
      })
    })
    if (missingParticipantIds.length) {
      wx.showToast({
        title: `请先选择${missingParticipantIds.map(id => friendMap[id]).join('、')}`,
        icon: 'none'
      })
      return
    }
    const summary = this.data.expenseSummary
    const splitSummary = summarizeTripSplit({ items: this.data.items }, this.data.friends, friendIds)
    const saved = socialStore.shareTrip({
      tripId: this.data.tripId,
      tripTitle: this.data.trip && this.data.trip.title,
      friendIds,
      total: summary.total,
      totalLabel: summary.totalLabel,
      breakdown: summary.breakdown,
      splitSummary,
      itinerary: this.data.items.map(item => ({
        id: item.id,
        typeLabel: item.typeLabel,
        title: item.title,
        date: item.date,
        timeLabel: item.timeLabel,
        locationStart: item.locationStart,
        locationEnd: item.locationEnd,
        priceLabel: item.priceLabel,
        durationLabel: item.durationLabel,
        participantIds: item.participantIds || [],
        participantNames: (item.participantIds || []).map(id => id === 'self'
          ? '我'
          : (this.data.friends.find(friend => friend.id === id) || {}).name).filter(Boolean)
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
