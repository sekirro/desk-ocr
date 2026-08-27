# Changelog

All notable changes to Desk OCR will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic versioning once stable releases begin.

## [Unreleased]

### Added

- Added a README demo animation of local OCR on the OpenAI Developers page and localized English and Chinese interface screenshots.
- Added drag-to-select region capture on the display under the pointer, with `Esc` and right-click cancellation and high-DPI crop scaling.

## [0.1.2] - 2026-08-22

### Added

- Added a Settings dialog with a Chinese-default interface, optional English UI, and a locally stored language preference.
- Added automated macOS arm64 DMG and ZIP builds to the tag-based preview release workflow.

### Changed

- Publish Windows x64 and macOS arm64 artifacts together without generating a SHA256 checksum file.

## [0.1.1] - 2026-08-21

### Added

- Unsigned macOS arm64 DMG and ZIP packaging with a bundled local OCR runtime.
- macOS screen-recording permission metadata and denied-permission guidance.

### Changed

- Generalized the frozen OCR-service build for Windows x64 and macOS arm64.
- Added a locked Python 3.12 dependency set for reproducible macOS arm64 release builds.
- Removed the obsolete `SHA256SUMS.txt` reference from the v0.1.1 download instructions.

### Fixed

- Build the preload bridge as CommonJS so `window.deskOCR` is available in the sandboxed packaged application.
- Extend the packaged Windows smoke test to verify the renderer-to-Electron bridge before exercising OCR.

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
