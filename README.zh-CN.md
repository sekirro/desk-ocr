# Desk OCR

一个隐私优先、支持文字搜索与选择的桌面截图 OCR 工具。

[English](README.md) · [贡献指南](CONTRIBUTING.md) · [路线图](ROADMAP.md) · [安全策略](SECURITY.md)

Desk OCR 可以截取鼠标所在屏幕或打开本地图片，在本机运行 PaddleOCR，并在原图上绘制文本框、叠加可选择文字层，支持搜索、高亮与复制。图片和识别结果不会上传到云端。

## 主要功能

- 使用 `Command/Ctrl + Shift + O` 截取当前屏幕。
- 从本地打开 PNG、JPEG、WebP 或 BMP 图片。
- 使用 PaddleOCR 识别中英文。
- 搜索识别文字，并在上一个/下一个结果间跳转。
- 直接选择截图上的透明文字，或一键复制全部结果。
- 无账号、无 API Key、无遥测、无云端上传。
- 可在“设置”中切换中文或英文界面，首次启动默认使用中文。
- Windows、macOS、Linux 跨平台开发脚本。

## 项目状态

Desk OCR 目前是早期公开版本。Windows x64 与 Apple 芯片 macOS 预览版均内置本地 Python/PaddleOCR 运行时，并已完成导入图片 → OCR 的打包验证。安装包尚未进行代码签名或公证。Linux 目前仍是源码开发目标，尚无经过发布测试的安装包。

## Windows 下载

可从 [GitHub Releases](https://github.com/sekirro/desk-ocr/releases) 下载 Windows x64 预览版，普通用户无需另行安装 Node.js 或 Python。

由于预览版尚未代码签名，Windows SmartScreen 可能显示未知发布者提示。第一次 OCR 会下载 PaddleOCR 模型，之后会复用应用模型缓存。

## macOS 下载

可从 [GitHub Releases](https://github.com/sekirro/desk-ocr/releases) 下载 macOS arm64 DMG 或 ZIP。该版本适用于 Apple 芯片 Mac，普通用户无需另行安装 Node.js 或 Python。

由于预览版尚未代码签名和公证，macOS 可能阻止首次启动。请按住 Control 点击应用，选择“打开”并确认。截图功能还需要在“系统设置 → 隐私与安全性 → 屏幕与系统音频录制”中授权。第一次 OCR 同样会下载本地 PaddleOCR 模型。

## 架构

```text
Electron 主进程 ── 截图 / 文件选择
       │ IPC
React 渲染进程 ─── 图片、文字层、搜索界面
       │ HTTP（仅本机）
FastAPI 服务 ───── PaddleOCR CPU 推理
```

OCR 服务只监听 `127.0.0.1:8787`。首次识别会下载 Paddle 模型，之后复用本地缓存。更多信息见[架构说明](docs/ARCHITECTURE.md)和[隐私说明](docs/PRIVACY.md)。

## 源码开发环境要求

- Node.js 22.12 或更高版本
- npm 10 或更高版本
- Python 3.10–3.12
- Windows 10/11、较新的 macOS，或现代 Linux 桌面环境
- 首次下载 PaddleOCR 模型时需要网络

Windows 可能需要安装最新的 Microsoft Visual C++ Redistributable。Linux 截图能力可能受桌面环境和 Wayland portal 配置影响。

## 快速开始

```bash
git clone https://github.com/sekirro/desk-ocr.git
cd desk-ocr
npm install
npm run install:python
npm run dev
```

Electron 窗口会自动打开。点击“截图并 OCR”“导入图片”，或按 `Command/Ctrl + Shift + O`。首次启动默认使用中文，可通过“设置 → 界面语言”切换为英文。语言选择只保存在本机，不会改变截图或 OCR 结果。

第一次 OCR 会下载移动版检测和识别模型，后续启动会使用缓存。

`npm run install:python` 会自动创建项目内的 `.venv`，不需要用户手动执行 `python -m venv`。默认推荐虚拟环境，因为 PaddlePaddle 包含平台相关的原生依赖，隔离环境可以避免污染或破坏系统 Python。

如果已经有配置好的系统 Python、Conda 或其他环境，也可以完全不创建 `.venv`。先在该环境中安装依赖，再指定 Python 可执行文件：

```powershell
python -m pip install -r services/ocr/requirements.txt
$env:DESK_OCR_PYTHON='python'
npm run dev
```

macOS 或 Linux 可使用 `DESK_OCR_PYTHON=python3 npm run dev`。也可以把 `DESK_OCR_PYTHON=...` 写入 `.env`。Windows 与 macOS 预览版已内置项目专用的 Python 运行时，普通用户无需执行这些开发配置。

如果 Windows 无法从 GitHub 下载 Electron，可以使用可访问的镜像：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install
```

## 开发

安装 Python 开发工具：

```bash
npm run install:python:dev
```

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 同时启动 OCR 服务和 Electron 应用 |
| `npm run dev:ocr` | 只启动 FastAPI 服务 |
| `npm run dev:electron` | 只启动 Electron 应用 |
| `npm run check` | 执行类型检查、测试、Python lint/格式检查和构建 |
| `npm run test` | 执行前端单元测试 |
| `npm run test:ocr` | 执行不加载 OCR 模型的服务测试 |
| `npm run build` | 构建 Electron 主进程、preload 和 renderer |
| `npm run dist:mac` | 完整检查并构建未签名的 macOS arm64 DMG 和 ZIP |
| `npm run dist:win` | 完整检查并构建未签名的 Windows x64 安装包 |
| `npm run smoke:win-packaged` | 在 Windows 上验证打包应用和内置 OCR 运行时 |

服务运行时可通过 `http://127.0.0.1:8787/health` 检查健康状态。

如需覆盖模型或上传限制，可在运行前设置环境变量，或把 `.env.example` 复制为 `.env`。

## 隐私与安全

Desk OCR 不包含遥测，也不会把截图发送到托管服务。本地 API 会限制浏览器来源、验证图片内容，并限制上传大小与解码像素数。安全漏洞请按 [SECURITY.md](SECURITY.md) 私下报告。

## 参与贡献

欢迎提交 Issue 和 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)，提交前运行 `npm run check`。

## 许可证

Desk OCR 使用 [MIT License](LICENSE)。PaddleOCR 模型和第三方依赖仍遵循各自许可证，详情见[第三方软件声明](THIRD_PARTY_NOTICES.md)。
