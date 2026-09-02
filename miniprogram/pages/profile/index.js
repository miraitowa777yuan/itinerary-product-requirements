const socialStore = require('../../utils/social-store')

Page({
  data: {
    profile: {
      name: '旅行者',
      description: '个人空间待完善'
    },
    friends: [],
    sharedTrips: [],
    showAddFriend: false,
    newFriendName: '',
    newFriendNote: ''
  },

  onShow() {
    this.updateTabBar(3)
    this.loadSocialData()
  },

  updateTabBar(selected) {
    if (typeof this.getTabBar !== 'function') return
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.setData({ selected })
  },

  loadSocialData() {
    const friends = socialStore.getFriends()
    const shares = socialStore.getShares()
    const friendMap = friends.reduce((map, friend) => {
      map[friend.id] = friend.name
      return map
    }, {})
    const sharedTrips = shares.map(share => Object.assign({}, share, {
      friendNames: (share.friendIds || []).map(id => friendMap[id]).filter(Boolean).join('、') || '已选择好友',
      itineraryCount: Array.isArray(share.itinerary) ? share.itinerary.length : 0,
      itineraryLabel: Array.isArray(share.itinerary) ? `行程 ${share.itinerary.length} 项` : '行程与账单'
    }))
    const sharedCount = friends.reduce((map, friend) => {
      map[friend.id] = shares.filter(share => (share.friendIds || []).includes(friend.id)).length
      return map
    }, {})
    this.setData({
      friends: friends.map(friend => Object.assign({}, friend, { sharedCount: sharedCount[friend.id] || 0 })),
      sharedTrips
    })
  },

  startAddFriend() {
    this.setData({ showAddFriend: true, newFriendName: '', newFriendNote: '' })
  },

  cancelAddFriend() {
    this.setData({ showAddFriend: false })
  },

  updateFriendField(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [field]: event.detail.value })
  },

  saveFriend() {
    const name = String(this.data.newFriendName || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写好友昵称', icon: 'none' })
      return
    }
    const existing = this.data.friends.find(friend => friend.name === name)
    if (existing) {
      wx.showToast({ title: '这位好友已添加', icon: 'none' })
      return
    }
    socialStore.addFriend({ name, note: this.data.newFriendNote })
    this.setData({ showAddFriend: false, newFriendName: '', newFriendNote: '' })
    this.loadSocialData()
    wx.showToast({ title: '好友已添加' })
  },

  removeFriend(event) {
    const friendId = event.currentTarget.dataset.id
    const friend = this.data.friends.find(item => item.id === friendId)
    if (!friend) return
    wx.showModal({
      title: '移除这位好友？',
      content: `移除后不会删除已共享的账单记录。`,
      confirmText: '移除',
      confirmColor: '#9f3229',
      success: result => {
        if (!result.confirm) return
        socialStore.removeFriend(friendId)
        this.loadSocialData()
        wx.showToast({ title: '已移除', icon: 'none' })
      }
    })
  },

  openSharedTrip(event) {
    const tripId = event.currentTarget.dataset.id
    if (tripId) wx.navigateTo({ url: `/pages/trip/detail?id=${encodeURIComponent(tripId)}` })
  }
})
