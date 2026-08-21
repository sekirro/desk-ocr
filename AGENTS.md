# Repository guidance

## Project shape

- `src/main`: privileged Electron main-process code for capture and file dialogs.
- `src/preload`: the narrow IPC bridge exposed to the renderer.
- `src/renderer`: React UI, overlays, search, and renderer tests.
- `services/ocr`: localhost FastAPI service, PaddleOCR normalization, and Python tests.
- `scripts`: cross-platform Python and development process launchers.

## Required checks

Run `npm run check` after behavior or dependency changes. For a quick renderer-only loop, run `npm run typecheck` and `npm test`. OCR unit tests must not download models or require network access.

## Security and privacy invariants

- Keep `nodeIntegration` disabled, `contextIsolation` enabled, and the renderer sandbox enabled.
- Add renderer capabilities through explicit preload IPC methods; do not expose raw `ipcRenderer`.
- Keep the OCR service bound to `127.0.0.1` and preserve upload validation and limits.
- Do not add telemetry, cloud upload, or persistence without explicit user control and documentation.
- Never commit screenshots, OCR results, model caches, virtual environments, or personal data.

## Style

- Keep TypeScript strict and prefer small typed helpers.
- Keep Paddle imports lazy so API/unit tests do not load inference models.
- Add focused tests for changed normalization, validation, geometry, or search behavior.
- Update `CHANGELOG.md` and user documentation for visible changes.
