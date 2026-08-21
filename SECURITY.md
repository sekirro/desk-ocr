# Security Policy

## Supported versions

Desk OCR is currently pre-1.0. Security fixes are applied to the latest release and the `main` branch.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub's **Report a vulnerability** / private security advisory feature for the repository. Include:

- affected version or commit;
- operating system and configuration;
- reproduction steps or proof of concept;
- expected impact;
- any suggested mitigation.

Maintainers will acknowledge a complete report as soon as practical, investigate it privately, and coordinate disclosure after a fix is available. Please avoid accessing data that is not your own and do not disrupt other users while testing.

## Security boundaries

- Screenshots and OCR results are intended to remain on the local machine.
- The OCR API binds to `127.0.0.1` and is not designed for network exposure.
- Do not expose port `8787` through a proxy or public interface.
- Downloaded PaddleOCR models are managed by PaddleX and remain subject to upstream integrity and supply-chain considerations.
