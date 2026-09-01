const tripStore = require('./utils/trip-store')

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true })
    }
    tripStore.ensureSeedData()
  },

  globalData: {
    appName: '行程计划器'
  }
})
