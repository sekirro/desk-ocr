# Architecture

Desk OCR separates privileged desktop operations, the unprivileged UI, and native OCR inference.

## Components

### Electron main process

`src/main/index.ts` owns desktop capture, the full-display region-selection overlay, image cropping, the native image picker, the global shortcut, and window lifecycle. The renderer cannot access Node.js directly. Navigation and new windows are denied outside the expected renderer origin.

### Preload bridge

`src/preload/index.ts` exposes a deliberately small API through `contextBridge`: start a capture, complete or cancel a region selection, open an image, and subscribe to the capture shortcut. Raw Electron IPC is not exposed, and region-selection messages are accepted only from the active overlay window.

### React renderer

`src/renderer` displays the image and three aligned layers:

1. an SVG line-box layer;
2. a search-highlight layer;
3. a transparent selectable HTML text layer.

Coordinates from the OCR image are scaled to the rendered image size. Search operates on normalized OCR word blocks and keeps an active result for navigation.

### OCR service

`services/ocr/main.py` is a FastAPI process bound to `127.0.0.1:8787`. It validates uploads, invokes PaddleOCR lazily, and normalizes PaddleOCR 2.x/3.x-style outputs into a stable JSON contract.

The service is a separate process because PaddlePaddle is a native Python dependency and should not run in Electron's renderer or main-process event loop.

In packaged Windows builds, the Electron main process launches the bundled OCR executable from the application resources directory, waits for a valid `/health` response, and terminates the child process when the app exits. Models are cached under Electron's per-user application-data directory. Source-development builds continue to use the project Python environment or `DESK_OCR_PYTHON` override.

## Data flow

```text
capture/open image
      ↓ IPC payload (data URL + dimensions)
renderer preview
      ↓ multipart image upload to localhost
FastAPI validation → temporary file → PaddleOCR
      ↓ normalized lines, words, boxes, confidence
renderer boxes + selectable text + search
```

Temporary OCR files are deleted in a `finally` block. The application does not persist screenshots or OCR results.

## API contract

`GET /health` returns the service identity and version. `POST /ocr` accepts one image and returns:

```json
{
  "image": { "width": 100, "height": 50 },
  "lines": [],
  "words": []
}
```

Each line and word includes an ID, text, confidence, polygon, and axis-aligned bounding box. Lines also contain the IDs of their word blocks.

## Trust boundaries

- Electron main and preload are privileged; the renderer is sandboxed.
- Only explicit IPC methods cross the Electron boundary.
- The local API is not an authentication boundary and must never be exposed publicly.
- Uploaded image size and decoded pixel count are bounded before inference.
- Model downloads are delegated to PaddleX and should be treated as an upstream supply-chain dependency.
