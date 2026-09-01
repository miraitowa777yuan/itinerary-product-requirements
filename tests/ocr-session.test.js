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

let sortedText = ''
const sortedContext = Object.assign({}, pageDefinition, {
  _ocrResolve: text => { sortedText = text },
  _ocrReject: () => {},
  _ocrChunks: []
})
pageDefinition.handleOcrAnchors.call(sortedContext, [
  { text: '苏州站', centerX: 0.8, centerY: 0.7 },
  { text: '11:29', centerX: 0.2, centerY: 0.3 },
  { text: '上海虹桥站', centerX: 0.2, centerY: 0.7 }
])
clearTimeout(sortedContext._ocrResultTimer)
pageDefinition.completeOcrRecognition.call(sortedContext)
assert.strictEqual(sortedText, '11:29\n上海虹桥站\n苏州站')

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

const portraitTiles = pageDefinition.buildOcrTiles({ width: 1206, height: 2622 })
assert.strictEqual(portraitTiles.length, 2)
assert.deepStrictEqual(portraitTiles[0], {
  sourceY: 0,
  sourceHeight: 1600,
  outputWidth: 1206,
  outputHeight: 1600
})
assert.strictEqual(portraitTiles[1].sourceY, 1440)
assert.strictEqual(portraitTiles[1].sourceHeight, 1182)

const wideTiles = pageDefinition.buildOcrTiles({ width: 2800, height: 1600 })
assert.strictEqual(wideTiles.length, 1)
assert.strictEqual(wideTiles[0].outputWidth, 1400)
assert.strictEqual(wideTiles[0].outputHeight, 800)

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
