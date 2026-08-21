# Roadmap

Desk OCR is developed in small, reviewable milestones. Priorities may change based on user feedback and maintainer capacity.

## Near term

- Add region-selection capture and better multi-monitor/high-DPI coverage.
- Add keyboard-first navigation and an accessibility audit.
- Add deterministic OCR API contract fixtures for more PaddleOCR result variants.
- Publish a project demo image and short walkthrough.

## Release readiness

- Code-sign the Windows preview and document publisher verification.
- Produce and test macOS installers and Linux packages.
- Add artifact provenance in addition to existing checksums and release notes.
- Reduce the size and startup cost of the bundled OCR runtime.
- Document offline model installation and model integrity checks.

## Later

- Optional, local-only OCR history with explicit retention controls.
- Additional OCR languages and configurable models.
- Region redaction and export workflows.
- Performance profiling and an opt-in oneDNN path when upstream compatibility is reliable.

## Non-goals

- Uploading screenshots to a hosted OCR service by default.
- Requiring an account or API key for local OCR.
- Silent telemetry or hidden background collection.
