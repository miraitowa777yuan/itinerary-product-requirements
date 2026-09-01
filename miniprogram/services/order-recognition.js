const { ensureCloud } = require('./cloud')

function uploadAndAnalyze(filePath, hintType) {
  ensureCloud()
  const suffix = (filePath.match(/\.[a-zA-Z0-9]+$/) || ['.jpg'])[0]
  const cloudPath = `order-screenshots/${Date.now()}-${Math.floor(Math.random() * 10000)}${suffix}`
  return wx.cloud.uploadFile({ cloudPath, filePath })
    .then((uploadResult) => wx.cloud.callFunction({
      name: 'analyzeOrder',
      data: { fileID: uploadResult.fileID, hintType: hintType || 'auto' }
    }).then((callResult) => ({ result: callResult.result })))
}

module.exports = { uploadAndAnalyze }
