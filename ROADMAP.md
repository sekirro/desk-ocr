# Roadmap

Desk OCR is developed in small, reviewable milestones. Priorities may change based on user feedback and maintainer capacity.

## Near term

- Add region-selection capture and better multi-monitor/high-DPI coverage.
- Add keyboard-first navigation and an accessibility audit.
- Add deterministic OCR API contract fixtures for more PaddleOCR result variants.
- Publish a project demo image and short walkthrough.

## Release readiness

- Bundle or bootstrap the Python runtime safely for end-user builds.
- Produce signed Windows and macOS installers and Linux packages.
- Add release provenance, checksums, and automated release notes.
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
