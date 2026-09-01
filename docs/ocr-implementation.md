# 本地截图识别实现说明

## 方案

- 用户可在“手动录入”和“截图识别”之间切换。
- 截图通过 `wx.chooseMedia` 选择，只在本机内存中处理，不上传、不长期保存。
- 文字识别调用微信客户端的 `wx.createVKSession({ track: { OCR: { mode: 2 } } })` 与 `session.runOCR`。
- OCR 会话持续运行 `requestAnimationFrame` / `getVKFrame` 帧循环，同时接收 `addAnchors` 与 `updateAnchors`，并在结果稳定后合并文字。
- WebGL 画布保留在可渲染区域并将帧率限制为 30 FPS，避免 iOS 暂停完全隐藏画布的 VisionKit 会话。
- 超长订单截图按最高 1600 像素高度切成带重叠区的片段，逐段识别后去重合并，避免整张长图无结果。
- 识别出的文字由仓库内 `miniprogram/utils/order-parser.js` 解析为酒店、航班、火车或城际巴士字段。
- 自动结果不会直接保存，用户必须在同一编辑页检查后主动点击“保存”。

## 开源来源与许可证

微信端调用流程参考微信官方开源示例仓库 [wechat-miniprogram/miniprogram-demo](https://github.com/wechat-miniprogram/miniprogram-demo) 中的 `photo-ocr-detect` 示例。该示例以 MIT License 发布。

需要区分：示例调用代码是开源的，但 OCR 模型由微信客户端运行时提供，并不是复制进本仓库的独立模型文件。调研过的 Tesseract.js 与 PaddleOCR.js 依赖标准浏览器 Worker、DOM 或标准 WebAssembly，直接加入原生微信小程序会造成兼容问题和显著包体 / 内存压力，因此当前版本不采用它们。

## 调试限制

- 微信开发者工具的 macOS 模拟器会返回 `createVKSession:fail The current device does not support version "v1"`。
- 页面、字段解析和失败降级可在模拟器验证；实际 OCR 必须在支持 VKSession 的微信真机环境测试。
- 如果真机不支持，界面会保留截图并提示失败，用户可以切回手动录入，不会卡死页面。
- 长截图最多保留 1440 × 3600 像素且限制在约 350 万像素内，避免小字被过度压缩；单次识别等待上限为 30 秒，超时后会释放旧会话以便安全重试。
