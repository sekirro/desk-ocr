# Privacy

Desk OCR is designed for local processing.

## Data processed

The application processes screenshots selected by the user, images opened by the user, OCR text, bounding boxes, confidence values, and search queries.

## Where data goes

- Images are sent only from the Electron renderer to the FastAPI service on `127.0.0.1`.
- OCR runs locally through PaddleOCR/PaddlePaddle.
- Temporary upload files are deleted after each request.
- Screenshots, recognized text, and search queries are not persisted by Desk OCR.
- The interface language selected in Settings is stored locally as the only persistent UI preference. It does not change or duplicate screenshots or OCR results.
- Desk OCR contains no analytics or telemetry code.

PaddleX downloads OCR model files from its configured model source on first use. That network request downloads models; it does not intentionally include the user's screenshot or OCR result.

## User controls

Users choose when to capture a screen or open an image, and they can change or reset the interface language from Settings. Closing the application clears in-memory screenshots and OCR results. Model caches and the user-selected interface language remain on disk. Packaged builds store model caches in the Desk OCR per-user application-data directory; source-development builds use `PADDLE_PDX_CACHE_HOME` or the PaddleX default cache location. Downloading a release artifact from GitHub is separate from OCR processing and is subject to GitHub's own network and privacy behavior.

## Future features

Any future history, synchronization, telemetry, or hosted inference feature must be opt-in, documented, and designed with explicit retention and deletion controls. It must not silently change the local-only default.
