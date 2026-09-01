const assert = require('assert')

let pageDefinition
global.wx = {}
global.Page = definition => { pageDefinition = definition }
require('../miniprogram/pages/item/edit')

let recognizedText = ''
const resultContext = Object.assign({}, pageDefinition, {
  _ocrResolve: text => { recognizedText = text },
  _ocrReject: () => {},
  _ocrChunks: [],
  _ocrTimer: setTimeout(() => {}, 10000)
})

pageDefinition.handleOcrAnchors.call(resultContext, [
  { text: '上海虹桥站' },
  { subtext: 'G7331' }
])
pageDefinition.handleOcrAnchors.call(resultContext, [
  { text: '上海虹桥站' },
  { text: '杭州东站' }
])
clearTimeout(resultContext._ocrResultTimer)
pageDefinition.completeOcrRecognition.call(resultContext)
assert.strictEqual(recognizedText, '上海虹桥站\nG7331\n杭州东站')

let frameCalls = 0
let nextFrame
const session = {
  getVKFrame(width, height) {
    frameCalls += 1
    assert.strictEqual(width, 320)
    assert.strictEqual(height, 480)
  },
  requestAnimationFrame(callback) { nextFrame = callback }
}
const frameContext = { _ocrSession: session }
pageDefinition.startOcrFrameLoop.call(frameContext, session, { width: 320, height: 480 })
assert.ok(nextFrame)
nextFrame()
assert.strictEqual(frameCalls, 1)

let stopped = false
const resetContext = {
  _ocrSession: { stop() { stopped = true } },
  _ocrTimer: setTimeout(() => {}, 10000),
  _ocrResultTimer: setTimeout(() => {}, 10000)
}
pageDefinition.resetOcrSession.call(resetContext)
assert.ok(stopped)
assert.strictEqual(resetContext._ocrSession, null)

console.log('ocr session tests passed')
