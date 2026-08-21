from __future__ import annotations

import importlib.metadata
import subprocess
import sys
from pathlib import Path

import paddlex


def main() -> None:
    if sys.platform != "win32" or sys.version_info[:2] != (3, 12):
        raise SystemExit("Windows release packaging requires Python 3.12 on Windows.")

    project_root = Path(__file__).resolve().parents[1]
    release_root = project_root / "release"
    work_root = release_root / ".pyinstaller"

    installed = {
        distribution.metadata["Name"]
        for distribution in importlib.metadata.distributions()
        if distribution.metadata.get("Name")
    }
    paddlex_dependencies = set(paddlex.utils.deps.BASE_DEP_SPECS)
    metadata_packages = sorted(installed & paddlex_dependencies)

    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        str(project_root / "services" / "ocr" / "standalone.py"),
        "--name",
        "desk-ocr-service",
        "--onedir",
        "--noconfirm",
        "--clean",
        "--distpath",
        str(release_root / "ocr"),
        "--workpath",
        str(work_root / "build"),
        "--specpath",
        str(work_root),
        "--paths",
        str(project_root),
        "--collect-data",
        "paddlex",
        "--collect-binaries",
        "paddle",
        "--collect-submodules",
        "uvicorn",
        "--exclude-module",
        "pytest",
        "--exclude-module",
        "_pytest",
        "--exclude-module",
        "ruff",
        "--exclude-module",
        "tkinter",
        "--exclude-module",
        "_tkinter",
        "--copy-metadata",
        "paddleocr",
        "--copy-metadata",
        "paddlepaddle",
        "--copy-metadata",
        "paddlex",
    ]

    for package in metadata_packages:
        command.extend(["--copy-metadata", package])

    subprocess.run(command, cwd=project_root, check=True)


if __name__ == "__main__":
    main()
