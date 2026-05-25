# Desk OCR

截图、OCR、红框标注、透明可选文字层和词级搜索的桌面 MVP。

## Stack

- Electron + React + TypeScript
- FastAPI + PaddleOCR + PaddlePaddle
- SVG 红框层
- HTML 透明文字层

## Setup

```bash
npm install
npm run install:python
```

如果 Electron 二进制下载卡住，可以手工下载并解压：

```bash
curl -L -o /private/tmp/desk-ocr-electron.zip \
  https://github.com/electron/electron/releases/download/v35.7.5/electron-v35.7.5-darwin-arm64.zip
mkdir -p node_modules/electron/dist
unzip -q /private/tmp/desk-ocr-electron.zip -d node_modules/electron/dist
printf 'Electron.app/Contents/MacOS/Electron' > node_modules/electron/path.txt
```

## Run

```bash
npm run dev
```

开发时也可以分开启动：

```bash
npm run dev:ocr
npm run dev:electron
```

OCR 服务监听 `http://127.0.0.1:8787`。Electron renderer dev server 是
`http://localhost:5173/`，但截图能力只在 Electron 桌面窗口里可用。

macOS 首次截图时需要授予屏幕录制权限。

截图时应用窗口会先自动隐藏，避免截到自己。也可以不用切到应用，直接按全局快捷键：

```text
Command/Ctrl + Shift + O
```

如果看到 `address already in use`，说明 `127.0.0.1:8787` 已有 OCR 服务占用。
通常重新运行即可复用现有 OCR 服务；如果需要手动停止旧进程：

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
kill <PID>
```

PaddleOCR 首次识别会下载模型。项目默认关闭文档方向/矫正模型，只下载截图 OCR
需要的检测和识别模型，并优先使用 BOS：

```bash
PADDLE_PDX_MODEL_SOURCE=bos PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True npm run dev
```

如果网络仍然无法访问 Paddle 模型源，OCR 会失败；需要换网络、配置代理，或提前把模型下载到本机后通过
`DESK_OCR_TEXT_DETECTION_MODEL` / `DESK_OCR_TEXT_RECOGNITION_MODEL` 指向可用模型。

## Verify

```bash
npm run typecheck
npm run test
npm run test:ocr
curl http://127.0.0.1:8787/health
```

## MVP Scope

- 截取鼠标所在屏幕的整屏截图。
- 上传截图到本地 OCR 服务。
- 在截图上绘制 OCR 红框。
- 叠加透明 HTML 文字层，让 OCR 文本可选择和复制。
- 搜索 OCR 词块，并高亮所有命中与当前命中。

暂不包含历史记录、SQLite、区域截图和发布打包。
