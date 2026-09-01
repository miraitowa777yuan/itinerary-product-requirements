const tabs = [
  { pagePath: 'pages/daily/index', text: '日常行程' },
  { pagePath: 'pages/trips/index', text: '旅行行程' },
  { pagePath: 'pages/archive/index', text: '过往旅行' },
  { pagePath: 'pages/profile/index', text: '个人' }
]

Component({
  data: {
    selected: 1,
    tabs
  },

  pageLifetimes: {
    show() {
      this.syncSelected()
    }
  },

  methods: {
    syncSelected() {
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const currentPage = pages[pages.length - 1]
      const route = currentPage && currentPage.route
      const selected = Math.max(0, tabs.findIndex(tab => tab.pagePath === route))
      this.setData({ selected })
    },

    switchTab(event) {
      const pagePath = event.currentTarget.dataset.path
      if (!pagePath) return
      wx.switchTab({ url: `/${pagePath}` })
    }
  }
})
