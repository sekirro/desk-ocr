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

## Windows Migration Notes

当前项目是 macOS 优先实现。要迁移到 Windows，核心架构不需要重写，但需要处理 Python 虚拟环境路径、Electron 二进制、截图权限和 PaddleOCR 运行环境。

### 环境要求

建议 Windows 使用：

- Windows 10/11
- Node.js 20 LTS 或 22 LTS
- npm
- Python 3.10 或 3.11
- Visual C++ Redistributable
- 稳定网络，用于首次下载 PaddleOCR 模型

不建议一开始用过新的 Python 版本，PaddlePaddle 在 Windows 上对 wheel 支持可能更挑版本。

### Python 启动路径

当前 macOS 写法是：

```json
".venv/bin/python"
```

Windows 应改为：

```text
.venv\\Scripts\\python.exe
```

推荐做法不是在 `package.json` 里写死平台路径，而是在 Node 脚本中判断：

```js
const pythonPath =
  process.platform === 'win32'
    ? '.venv\\Scripts\\python.exe'
    : '.venv/bin/python'
```

然后所有 OCR 启动、测试命令都通过 Node 脚本调用这个 `pythonPath`。

### 安装脚本

当前安装脚本：

```bash
python3 -m venv .venv && .venv/bin/python -m pip install -r services/ocr/requirements.txt
```

Windows 等价逻辑：

```bat
py -3.11 -m venv .venv
.venv\Scripts\python.exe -m pip install -r services\ocr\requirements.txt
```

推荐新增 `scripts/install-python.mjs`，自动判断平台并执行对应命令，避免用户手动区分 macOS/Windows。

### Electron 二进制

macOS 手工下载的是：

```text
electron-v35.7.5-darwin-arm64.zip
```

Windows 需要下载：

```text
electron-v35.7.5-win32-x64.zip
```

正常情况下 `npm install` 会自动下载，不需要手动处理。只有 Electron postinstall 卡住时才需要手动下载。

Windows 手动恢复时，`path.txt` 应指向 Electron 可执行文件，通常是：

```text
electron.exe
```

### 截图功能

项目截图使用 Electron `desktopCapturer`，这是跨平台 API，Windows 不需要重写截图逻辑。

但要注意：

- Windows 不需要 macOS 的“屏幕录制权限”。
- 有些安全软件可能限制截图或全局快捷键。
- 多显示器、高 DPI 缩放要重点测试坐标是否对齐。

### 全局快捷键

当前快捷键：

```text
CommandOrControl + Shift + O
```

在 Windows 上会变成：

```text
Ctrl + Shift + O
```

Electron 支持这个写法，不需要改，但需要测试是否和系统或其他软件快捷键冲突。

### PaddleOCR 模型缓存

PaddleOCR/PaddleX 默认模型缓存目录在用户目录下：

```text
%USERPROFILE%\.paddlex\official_models
```

可以通过环境变量修改：

```bat
set PADDLE_PDX_CACHE_HOME=D:\desk-ocr-models
npm run dev
```

首次 OCR 会下载模型。建议提前确认 Windows 机器能访问 Paddle 模型源，或者准备离线模型目录。

### OCR 模型下载

当前项目默认使用：

```text
PADDLE_PDX_MODEL_SOURCE=bos
PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
```

Windows 也应保留这两个环境变量。

如果模型下载失败，需要换网络、配置代理，或手动下载模型到本地后通过环境变量或配置指定本地模型路径。

### 路径分隔符

Windows 路径分隔符是 `\`，macOS/Linux 是 `/`。

代码中应避免手写路径拼接，Node 侧统一使用：

```js
import { join } from 'node:path'
```

Python 侧使用：

```py
from pathlib import Path
```

### 推荐迁移步骤

1. 在 Windows 安装 Node.js、Python 3.10/3.11。
2. 克隆或复制项目到 Windows。
3. 删除旧的 macOS 依赖目录：
   ```bat
   rmdir /s /q node_modules
   rmdir /s /q .venv
   ```
4. 运行：
   ```bat
   npm install
   ```
5. 创建 Python 虚拟环境：
   ```bat
   py -3.11 -m venv .venv
   .venv\Scripts\python.exe -m pip install -r services\ocr\requirements.txt
   ```
6. 修改项目脚本为跨平台 Python 路径。
7. 运行：
   ```bat
   npm run dev
   ```
8. 测试 Electron 启动、截图、`Ctrl+Shift+O`、OCR、红框坐标、透明文字层和搜索高亮。

### 必测场景

Windows 上至少测试：

- 单显示器 100% 缩放
- 单显示器 125% / 150% 缩放
- 双显示器不同缩放比例
- 中文界面截图
- 英文界面截图
- 深色模式截图
- OCR 首次模型下载
- 无网络或模型下载失败时的错误提示

### 结论

迁移到 Windows 不需要重做核心功能。主要工作是：

- 把 Python 启动和安装脚本改成跨平台。
- 重新安装 Windows 版本 Electron 和 Python 依赖。
- 测试高 DPI、多显示器、模型下载和全局快捷键。
