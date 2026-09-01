const tripStore = require('./utils/trip-store')

App({
  onLaunch() {
    tripStore.ensureSeedData()
  },

  globalData: {
    appName: '行程计划器'
  }
})

