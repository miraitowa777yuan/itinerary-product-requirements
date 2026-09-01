Page({
  data: {
    profile: {
      name: '旅行者',
      description: '个人空间待完善'
    }
  },

  onShow() {
    if (typeof this.getTabBar !== 'function') return
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 3 })
  }
})
