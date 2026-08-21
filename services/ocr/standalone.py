from __future__ import annotations

from multiprocessing import freeze_support

import uvicorn

from services.ocr.main import app


def main() -> None:
    freeze_support()
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8787,
        access_log=False,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
