# Codex for Open Source application notes

This document is a factual draft for the maintainer. Do not invent adoption metrics.

## Project

- **Name:** Desk OCR
- **Public repository:** https://github.com/sekirro/desk-ocr
- **Primary maintainer:** [sekirro](https://github.com/sekirro)
- **License:** MIT
- **Current release:** 0.1.0 / pre-1.0

## What Desk OCR does

Desk OCR is a privacy-first desktop utility that captures a screen or opens an image, performs OCR locally with PaddleOCR, and overlays searchable/selectable text on the original image. It helps users retrieve text from interfaces, screenshots, and image-only content without sending sensitive captures to a hosted OCR provider.

## Why it matters

- It provides a local-first alternative for screenshots that may contain private work or personal data.
- Its overlay approach preserves spatial context while making image text searchable and copyable.
- The codebase is small enough to be approachable for first-time Electron, React, FastAPI, and OCR contributors.
- Cross-platform OCR integration has real maintenance cost across Electron, Python, native wheels, display scaling, and model versions.

## Current evidence

- Cross-platform development scripts for Windows, macOS, and Linux.
- Automated renderer and API/normalization tests.
- CI definitions for all three desktop operating systems.
- Local-only privacy model, Electron sandboxing, bounded image processing, and a private vulnerability-reporting policy.
- An installable Windows x64 preview whose bundled OCR runtime has passed a real end-to-end smoke test.
- [Add release/download/user/star/issue metrics only after they exist.]

## How Codex support would be used

- Reproduce and fix cross-platform capture and high-DPI issues.
- Review pull requests and maintain API/overlay regression tests.
- Triage dependency and native-runtime compatibility changes.
- Improve release automation, installer reproducibility, and security hardening.
- Expand accessible keyboard navigation and OCR model coverage.
- Use API credits for maintainer automation such as issue triage, PR summaries, release notes, and regression-fixture generation—never to upload user screenshots by default.

## Six-month plan

1. Publish the first reproducible Windows preview and collect platform reports.
2. Implement region selection and expand high-DPI/multi-monitor tests.
3. Code-sign the checksummed Windows artifact and produce verified macOS/Linux builds.
4. Add release provenance and dependency/security review automation.
5. Establish a contributor cadence and label a set of well-scoped starter issues.

## Application checklist

- [ ] Repository is public and has a real remote URL.
- [ ] Maintainer profile and contact path are present.
- [ ] At least one tagged release and demo image/video are published.
- [ ] CI is green on the public repository.
- [ ] GitHub private vulnerability reporting is enabled.
- [ ] Repository description, topics, and license are set on GitHub.
- [ ] Real adoption or ecosystem evidence is included without exaggeration.
- [ ] The application explains the maintainer workload Codex would directly support.
