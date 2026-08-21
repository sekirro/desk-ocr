# Privacy

Desk OCR is designed for local processing.

## Data processed

The application processes screenshots selected by the user, images opened by the user, OCR text, bounding boxes, confidence values, and search queries.

## Where data goes

- Images are sent only from the Electron renderer to the FastAPI service on `127.0.0.1`.
- OCR runs locally through PaddleOCR/PaddlePaddle.
- Temporary upload files are deleted after each request.
- Screenshots, recognized text, and search queries are not persisted by Desk OCR.
- Desk OCR contains no analytics or telemetry code.

PaddleX downloads OCR model files from its configured model source on first use. That network request downloads models; it does not intentionally include the user's screenshot or OCR result.

## User controls

Users choose when to capture a screen or open an image. Closing the application clears in-memory screenshots and OCR results. Model caches remain on disk and can be managed through `PADDLE_PDX_CACHE_HOME` or the PaddleX default cache location.

## Future features

Any future history, synchronization, telemetry, or hosted inference feature must be opt-in, documented, and designed with explicit retention and deletion controls. It must not silently change the local-only default.
