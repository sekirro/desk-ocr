# Contributing to Desk OCR

Thank you for helping improve Desk OCR. Contributions of code, tests, documentation, translations, design feedback, and reproducible bug reports are welcome.

## Before opening an issue

- Search existing issues and the roadmap.
- For bugs, include the operating system, display scaling, Node/Python versions, exact command, logs, and reproduction steps.
- Remove screenshots or OCR output that contain private information.
- Report security issues privately according to `SECURITY.md`.

## Development setup

```bash
npm install
npm run install:python:dev
npm run dev
```

Paddle models download on the first real OCR request. Unit tests do not load or download OCR models.

## Quality checks

Run the complete local gate before opening a pull request:

```bash
npm run check
```

Changes should include focused tests when behavior changes. Avoid unrelated formatting or dependency churn in the same pull request.

## Pull requests

1. Keep each pull request focused on one problem.
2. Explain the user impact and implementation tradeoffs.
3. Link the relevant issue when one exists.
4. Include screenshots for visible UI changes.
5. Update documentation and `CHANGELOG.md` for user-facing changes.
6. Confirm that screenshots and test fixtures contain no confidential data.

Maintainers may request changes to keep the local-only privacy model, Electron security boundaries, API contract, and cross-platform behavior intact.

## Commit messages

Use short, imperative subjects such as `Add image import validation` or `Fix Windows OCR startup`. Conventional Commits are welcome but not required.

## License

By contributing, you agree that your contribution is licensed under the MIT License used by this repository.
