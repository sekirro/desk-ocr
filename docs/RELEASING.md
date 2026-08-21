# Releasing

Desk OCR currently publishes source releases. Installable, signed desktop artifacts are tracked in the roadmap because they require a safe Python/PaddlePaddle bundling strategy.

## Prepare a release

1. Ensure `main` is green on Windows, macOS, and Linux CI.
2. Move relevant entries from `Unreleased` into a dated version section in `CHANGELOG.md`.
3. Update the version in `package.json` and `services/ocr/main.py` together.
4. Run `npm run check` and a real capture/import OCR smoke test.
5. Review `THIRD_PARTY_NOTICES.md` against the resolved JavaScript and Python dependencies.
6. Commit the release preparation.
7. Create and push an annotated tag:

   ```bash
   git tag -a v0.1.0 -m "Desk OCR v0.1.0"
   git push origin v0.1.0
   ```

The source-release workflow repeats the quality gate and creates a GitHub release with generated notes. Do not attach Electron bundles as end-user applications until the OCR runtime is bundled or bootstrapped and the artifacts have platform-appropriate signing/checksums.

## Binary license compliance

Source releases do not vendor npm packages, Python wheels, Electron, or OCR models. A future binary release will redistribute third-party object code and must therefore:

1. generate a complete dependency inventory or SBOM from the exact release lockfiles;
2. include the full license and copyright notices for every bundled runtime dependency;
3. preserve applicable Apache-2.0 notices and mark any modified upstream files;
4. ship Electron's `LICENSE` and `LICENSES.chromium.html` materials;
5. include licenses from bundled Python wheels, including their native libraries;
6. verify and document the license and source of each bundled OCR model artifact;
7. make all notices readable from the installed application or its accompanying files.

Do not rely on the summary in `THIRD_PARTY_NOTICES.md` as the complete notice bundle for an installer.
