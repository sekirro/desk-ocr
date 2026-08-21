# Changelog

All notable changes to Desk OCR will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic versioning once stable releases begin.

## [Unreleased]

## [0.1.0] - 2026-08-21

### Added

- Full-display capture with a global shortcut.
- Local image import alongside screen capture.
- Local PaddleOCR service.
- OCR boxes, selectable text overlay, search highlighting, and copy-all action.
- Clickable OCR search results.
- Cross-platform Python environment scripts and an optional `DESK_OCR_PYTHON` override.
- Upload size, pixel-count, image validation, and CORS protections.
- Cross-platform CI, contribution guidance, security policy, privacy documentation, and issue templates.
- Third-party dependency and binary-distribution license guidance.
- Unsigned Windows x64 preview installer with a bundled local OCR runtime.
- Packaged OCR service lifecycle management, a locked Windows runtime, generated license bundle, release notes, and SHA-256 checksums.

### Changed

- Disabled oneDNN OCR inference by default for stable PaddlePaddle 3.x CPU behavior.
- Upgraded Electron and Vitest to security-fixed releases.
