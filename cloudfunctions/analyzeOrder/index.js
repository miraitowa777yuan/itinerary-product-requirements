const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs-ocr')
const { parseOrderText } = require('./parser')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  if (!event.fileID) return { ok: false, message: '缺少订单截图' }
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    return { ok: false, message: 'OCR 云函数尚未配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY' }
  }

  try {
    const download = await cloud.downloadFile({ fileID: event.fileID })
    const OcrClient = tencentcloud.ocr.v20181119.Client
    const client = new OcrClient({
      credential: { secretId, secretKey },
      region: process.env.TENCENT_OCR_REGION || 'ap-guangzhou',
      profile: { httpProfile: { endpoint: 'ocr.tencentcloudapi.com' } }
    })
    const response = await client.GeneralAccurateOCR({ ImageBase64: download.fileContent.toString('base64') })
    const lines = (response.TextDetections || []).map((item) => item.DetectedText).filter(Boolean)
    if (!lines.length) return { ok: false, message: '截图中没有识别到可用文字' }
    return Object.assign({ ok: true }, parseOrderText(lines, event.hintType))
  } catch (error) {
    console.error('analyzeOrder failed', error)
    return { ok: false, message: error.message || '腾讯云 OCR 调用失败' }
  } finally {
    try { await cloud.deleteFile({ fileList: [event.fileID] }) } catch (error) { console.warn('temporary screenshot cleanup failed', error) }
  }
}
