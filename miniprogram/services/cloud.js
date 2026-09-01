function ensureCloud() {
  if (!wx.cloud) {
    throw new Error('当前基础库不支持微信云开发，请升级基础库')
  }
}

function cloudErrorMessage(error) {
  const message = (error && (error.errMsg || error.message)) || '云服务暂不可用'
  if (/environment|env|cloud.*not|未开通|not found/i.test(message)) {
    return '尚未配置微信云开发环境，请先按仓库 README 完成云环境和密钥配置。'
  }
  return message
}

module.exports = { ensureCloud, cloudErrorMessage }
