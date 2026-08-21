# Changelog

All notable changes to Desk OCR will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic versioning once stable releases begin.

## [Unreleased]

### Added

- Cross-platform Python environment scripts.
- Local image import alongside screen capture.
- Clickable OCR search results.
- Upload size, pixel-count, image validation, and CORS protections.
- Cross-platform CI, contribution guidance, security policy, privacy documentation, and issue templates.
- Optional `DESK_OCR_PYTHON` override for existing system or Conda environments.
- Third-party dependency and binary-distribution license guidance.

### Changed

- Disabled oneDNN OCR inference by default for stable PaddlePaddle 3.x CPU behavior.
- Upgraded Electron and Vitest to security-fixed releases.

## [0.1.0] - 2026-08-21

### Added

- Full-display capture with a global shortcut.
- Local PaddleOCR service.
- OCR boxes, selectable text overlay, search highlighting, and copy-all action.
