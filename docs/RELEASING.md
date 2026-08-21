# Releasing

Desk OCR publishes an unsigned Windows x64 preview installer. The packaged application starts and stops its own localhost OCR service and bundles the Python, PaddleOCR, and PaddlePaddle runtime. Signed Windows releases and tested macOS/Linux artifacts remain release-readiness work.

## Prepare a release

1. Ensure `main` is green in CI.
2. Move relevant entries from `Unreleased` into a dated version section in `CHANGELOG.md`.
3. Update the version in `package.json` and `services/ocr/main.py` together, then refresh and review `services/ocr/requirements-windows-lock.txt` from a clean Python 3.12 Windows environment.
4. Run `npm run dist:win` on Windows.
5. Run `npm run smoke:win-packaged`, then complete a real capture/import and search UI smoke test.
6. Review `release/licenses`, `THIRD_PARTY_NOTICES.md`, and the resolved JavaScript/Python dependencies.
7. Write or update `docs/releases/vX.Y.Z.md`, including signing and platform limitations.
8. Commit the release preparation.
9. Create and push an annotated tag:

   ```bash
   git tag -a v0.1.0 -m "Desk OCR v0.1.0"
   git push origin v0.1.0
   ```

The release workflow repeats the quality gate on Windows, builds the bundled OCR service and NSIS installer, generates SHA-256 checksums, and publishes a GitHub pre-release. Keep releases marked as previews until the artifact is code-signed and the supported-platform matrix is verified.

## Binary license compliance

Binary releases redistribute third-party object code and must therefore:

1. generate a complete dependency inventory or SBOM from the exact release lockfiles;
2. include the full license and copyright notices for every bundled runtime dependency;
3. preserve applicable Apache-2.0 notices and mark any modified upstream files;
4. ship Electron's `LICENSE` and `LICENSES.chromium.html` materials;
5. include licenses from bundled Python wheels, including their native libraries;
6. verify and document the license and source of each bundled OCR model artifact;
7. make all notices readable from the installed application or its accompanying files.

The packaging task generates a license bundle from the installed dependency set. Review that generated bundle for every release; do not rely on the summary in `THIRD_PARTY_NOTICES.md` as the complete notice bundle for an installer.
