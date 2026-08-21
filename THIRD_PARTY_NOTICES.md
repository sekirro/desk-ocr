# Third-party software notices

Desk OCR's own source code is licensed under the MIT License in `LICENSE`. This document identifies the project's direct third-party components and does not change their licenses or replace their authoritative license texts.

The source repository declares dependencies but does not vendor npm packages, Python wheels, Electron binaries, or PaddleOCR model weights. Exact transitive components vary by operating system and resolved dependency version.

## Runtime components

| Component | Role | License | Upstream |
| --- | --- | --- | --- |
| PaddleOCR | OCR pipeline and model integration | Apache-2.0 | https://github.com/PaddlePaddle/PaddleOCR |
| PaddlePaddle | Native inference runtime | Apache-2.0 | https://github.com/PaddlePaddle/Paddle |
| FastAPI | Local HTTP API | MIT | https://github.com/fastapi/fastapi |
| Uvicorn | Local ASGI server | BSD-3-Clause | https://github.com/Kludex/uvicorn |
| python-multipart | OCR upload parsing | Apache-2.0 | https://github.com/Kludex/python-multipart |
| Pillow | Image validation and metadata | MIT-CMU | https://github.com/python-pillow/Pillow |
| Electron | Desktop runtime | MIT; bundled Chromium and other components have additional notices | https://github.com/electron/electron |
| React and React DOM | Renderer UI | MIT | https://github.com/facebook/react |
| Lucide React | UI icons | ISC; some icons are derived from Feather under MIT | https://github.com/lucide-icons/lucide |

Current JavaScript versions are recorded in `package-lock.json`. Python version constraints are recorded in `services/ocr/requirements*.txt`; the installed wheel metadata is authoritative for a resolved environment.

## Development-only direct components

The repository also uses TypeScript (Apache-2.0), Vite and `@vitejs/plugin-react` (MIT), Vitest (MIT), electron-vite (MIT), concurrently (MIT), Ruff (MIT), pytest (MIT), and type definition packages (MIT). Development tools are not intended to be part of an end-user runtime bundle.

## OCR model files

By default, PaddleX downloads the configured PaddleOCR model files on first use. Desk OCR does not currently store or redistribute those model artifacts. If a future installer bundles model weights, the release maintainer must verify the exact artifact's source and applicable terms, retain required attribution, and record the artifact and checksum in the release materials.

## Distribution requirements

Permissive licenses still carry conditions. In particular:

- MIT, ISC, BSD, and MIT-CMU components require applicable copyright and license notices to be retained when their software is redistributed.
- Apache-2.0 redistribution requires a copy of the license, retention of applicable notices, prominent notices on modified upstream files, and reproduction of an upstream `NOTICE` file when one is supplied and relevant.
- Electron binary distributions must retain Electron's license and the third-party notices provided in `LICENSES.chromium.html`.
- Python wheels and Electron may contain additional native or transitive components whose notices are not fully represented by the direct-dependency table above.

Before publishing any installer, portable archive, or bundled runtime, follow `docs/RELEASING.md` and generate a complete license bundle from the exact artifacts being shipped.
