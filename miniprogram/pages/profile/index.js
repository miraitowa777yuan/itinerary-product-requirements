const socialStore = require('../../utils/social-store')

Page({
  data: {
    profile: {
      name: '旅行者',
      description: '个人空间待完善',
      accountNo: ''
    },
    friends: [],
    sharedTrips: [],
    showAddFriend: false,
    newFriendAccountNo: '',
    newFriendName: '',
    newFriendNote: '',
    accountSearchStatus: 'idle',
    accountSearchResult: null,
    editingFriendId: '',
    editingFriendNote: ''
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
    const profile = socialStore.getProfile()
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
      profile: Object.assign({}, this.data.profile, profile),
      friends: friends.map(friend => Object.assign({}, friend, { sharedCount: sharedCount[friend.id] || 0 })),
      sharedTrips
    })
  },

  startAddFriend() {
    this.setData({
      showAddFriend: true,
      newFriendAccountNo: '',
      newFriendName: '',
      newFriendNote: '',
      accountSearchStatus: 'idle',
      accountSearchResult: null
    })
  },

  cancelAddFriend() {
    this.setData({ showAddFriend: false, accountSearchStatus: 'idle', accountSearchResult: null })
  },

  updateFriendField(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [field]: event.detail.value })
  },

  searchAccount() {
    const result = socialStore.searchAccount(this.data.newFriendAccountNo)
    if (result.status === 'invalid') {
      this.setData({ accountSearchStatus: 'invalid', accountSearchResult: null })
      wx.showToast({ title: '请输入正确的账户号', icon: 'none' })
      return
    }
    if (result.status === 'self') {
      this.setData({ accountSearchStatus: 'self', accountSearchResult: result })
      wx.showToast({ title: '不能添加自己的账户号', icon: 'none' })
      return
    }
    if (result.status === 'found') {
      this.setData({
        accountSearchStatus: 'found',
        accountSearchResult: result.friend,
        newFriendName: result.friend.name
      })
      return
    }
    this.setData({
      accountSearchStatus: 'not_found',
      accountSearchResult: { accountNo: result.accountNo },
      newFriendName: ''
    })
  },

  saveFriend() {
    const accountNo = socialStore.formatAccountNo(this.data.newFriendAccountNo)
    if (!socialStore.isValidAccountNo(accountNo)) {
      wx.showToast({ title: '请先输入并搜索账户号', icon: 'none' })
      return
    }
    if (socialStore.searchAccount(accountNo).status === 'self') {
      wx.showToast({ title: '不能添加自己的账户号', icon: 'none' })
      return
    }
    const existing = this.data.friends.find(friend => socialStore.normalizeAccountNo(friend.accountNo) === socialStore.normalizeAccountNo(accountNo))
    if (existing) {
      wx.showToast({ title: '这位好友已添加', icon: 'none' })
      return
    }
    const friend = socialStore.addFriend({
      accountNo,
      name: this.data.newFriendName,
      note: this.data.newFriendNote
    })
    if (!friend) {
      wx.showToast({ title: '账户号无效，无法添加', icon: 'none' })
      return
    }
    this.setData({
      showAddFriend: false,
      newFriendAccountNo: '',
      newFriendName: '',
      newFriendNote: '',
      accountSearchStatus: 'idle',
      accountSearchResult: null
    })
    this.loadSocialData()
    wx.showToast({ title: '好友已添加' })
  },

  copyAccountNo() {
    wx.setClipboardData({
      data: this.data.profile.accountNo,
      success: () => wx.showToast({ title: '账户号已复制', icon: 'none' })
    })
  },

  startEditFriend(event) {
    const friend = this.data.friends.find(item => item.id === event.currentTarget.dataset.id)
    if (!friend) return
    this.setData({ editingFriendId: friend.id, editingFriendNote: friend.note || '' })
  },

  updateEditingFriendNote(event) {
    this.setData({ editingFriendNote: event.detail.value })
  },

  cancelEditFriend() {
    this.setData({ editingFriendId: '', editingFriendNote: '' })
  },

  saveEditFriend() {
    if (!this.data.editingFriendId) return
    socialStore.updateFriend(this.data.editingFriendId, { note: this.data.editingFriendNote })
    this.setData({ editingFriendId: '', editingFriendNote: '' })
    this.loadSocialData()
    wx.showToast({ title: '备注已更新', icon: 'none' })
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
