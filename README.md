# Desk OCR

Privacy-first desktop screenshot OCR with searchable, selectable text overlays.

[简体中文](README.zh-CN.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md) · [Security](SECURITY.md)

Desk OCR captures the display under your pointer or opens an existing image, runs OCR on your own machine, draws the detected text boxes, and lets you search, select, and copy the recognized text. Images and OCR results stay local.

## Highlights

- Capture the current display with `Command/Ctrl + Shift + O`.
- Open PNG, JPEG, WebP, or BMP images from disk.
- Recognize Chinese and English text with PaddleOCR.
- Search OCR text with next/previous navigation and visual highlighting.
- Select text directly over the screenshot or copy all recognized lines.
- Run locally without an account, API key, analytics, or cloud upload.
- Develop on Windows, macOS, and Linux with platform-aware scripts.

## Status

Desk OCR is an early public release. The Windows x64 and Apple Silicon macOS previews bundle the local Python/PaddleOCR runtime and have been tested through the import → OCR path. The installers are not code-signed or notarized. Linux remains a source-development target without a tested release artifact.

## Download for Windows

Download the Windows x64 preview from [GitHub Releases](https://github.com/sekirro/desk-ocr/releases). It does not require a separate Node.js or Python installation.

Because this preview is not code-signed, Windows SmartScreen may show an unknown-publisher warning. The first OCR request downloads the PaddleOCR models; subsequent requests reuse the application model cache.

## Download for macOS

Download the macOS arm64 DMG or ZIP from [GitHub Releases](https://github.com/sekirro/desk-ocr/releases). This build supports Apple Silicon Macs and does not require a separate Node.js or Python installation.

The preview is not code-signed or notarized, so macOS may block its first launch. Open it with **Control-click → Open** and confirm the prompt. Screen capture requires permission in **System Settings → Privacy & Security → Screen & System Audio Recording**. The first OCR request also downloads the local PaddleOCR models.

## Architecture

```text
Electron main process ── screenshot / file dialog
        │ IPC
React renderer ───────── image, text layer, search UI
        │ HTTP (localhost only)
FastAPI service ──────── PaddleOCR CPU inference
```

The OCR service listens only on `127.0.0.1:8787`. Paddle models are downloaded on first use and cached by PaddleX. Read [Architecture](docs/ARCHITECTURE.md) and [Privacy](docs/PRIVACY.md) for details.

## Source development requirements

- Node.js 22.12 or newer
- npm 10 or newer
- Python 3.10–3.12
- Windows 10/11, a recent macOS release, or a modern Linux desktop
- A network connection for the first PaddleOCR model download

Windows users may need the current Microsoft Visual C++ Redistributable. Linux screen capture behavior can depend on the desktop environment and Wayland portal configuration.

## Quick start

```bash
git clone https://github.com/sekirro/desk-ocr.git
cd desk-ocr
npm install
npm run install:python
npm run dev
```

The Electron window opens automatically. Click **Capture and OCR**, click **Open image**, or press `Command/Ctrl + Shift + O`.

The first OCR request downloads the mobile detection and recognition models. Later runs reuse the local model cache.

`npm run install:python` creates the project-local `.venv` automatically; you do not need to create it by hand. The virtual environment is the recommended development default because PaddlePaddle contains platform-specific native packages and should not modify an unrelated global Python installation.

To use an existing system, Conda, or other Python environment without creating `.venv`, install the runtime requirements into that environment and point Desk OCR to its executable:

```powershell
python -m pip install -r services/ocr/requirements.txt
$env:DESK_OCR_PYTHON='python'
npm run dev
```

On macOS or Linux, use the applicable executable, for example `DESK_OCR_PYTHON=python3 npm run dev`. You can also put `DESK_OCR_PYTHON=...` in `.env`. The Windows and macOS previews bundle a private Python runtime, so these development steps do not apply to end users.

### Windows download fallback

If Electron's GitHub download is unavailable, install through a reachable mirror:

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install
```

## Development

Install the additional Python quality tools:

```bash
npm run install:python:dev
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the OCR service and Electron app |
| `npm run dev:ocr` | Start only the FastAPI service |
| `npm run dev:electron` | Start only the Electron app |
| `npm run check` | Run TypeScript, JS tests, Python tests, lint, formatting, and build |
| `npm run test` | Run renderer unit tests |
| `npm run test:ocr` | Run OCR service tests without loading models |
| `npm run build` | Build Electron main, preload, and renderer bundles |
| `npm run dist:mac` | Validate and build the unsigned macOS arm64 DMG and ZIP |
| `npm run dist:win` | Validate and build the unsigned Windows x64 installer |
| `npm run smoke:win-packaged` | Exercise the packaged app and bundled OCR runtime on Windows |

The OCR health endpoint is available at `http://127.0.0.1:8787/health` while the service is running.

## Configuration

Export variables in your shell or copy `.env.example` to `.env` before `npm run dev`.

| Environment variable | Default | Description |
| --- | --- | --- |
| `DESK_OCR_TEXT_DETECTION_MODEL` | `PP-OCRv5_mobile_det` | PaddleOCR detection model name or local model identifier |
| `DESK_OCR_TEXT_RECOGNITION_MODEL` | `PP-OCRv5_mobile_rec` | PaddleOCR recognition model name or local model identifier |
| `DESK_OCR_PYTHON` | Project `.venv` executable | Existing Python/Conda executable to use instead of `.venv` |
| `DESK_OCR_MAX_IMAGE_BYTES` | `20971520` | Maximum uploaded image size in bytes |
| `DESK_OCR_MAX_IMAGE_PIXELS` | `40000000` | Maximum decoded image pixel count |
| `PADDLE_PDX_CACHE_HOME` | PaddleX default | Override the PaddleX model cache directory |
| `PADDLE_PDX_MODEL_SOURCE` | `bos` | PaddleX model source |

oneDNN is disabled for OCR inference by default because current PaddlePaddle 3.x CPU builds can fail on some systems while converting PIR attributes. The standard CPU kernels are slower but provide a more reliable cross-platform default.

## Privacy and security

Desk OCR does not include telemetry and does not send screenshots to a hosted service. The local API restricts browser origins, validates image content, and limits upload size and decoded dimensions. Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and run `npm run check` before submitting a change.

## License

Desk OCR is available under the [MIT License](LICENSE). PaddleOCR models and third-party dependencies remain subject to their own licenses; see [Third-party notices](THIRD_PARTY_NOTICES.md).
