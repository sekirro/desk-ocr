from __future__ import annotations

import json
import re
import shutil
import sys
from importlib.metadata import distributions
from pathlib import Path

LICENSE_PATTERN = re.compile(r"^(licen[cs]e|notice|copying|authors?)", re.IGNORECASE)


def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-") or "unknown"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: collect-python-licenses.py <output-directory>")

    output_root = Path(sys.argv[1]).resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    inventory: list[dict[str, str | None]] = []

    for distribution in sorted(
        distributions(), key=lambda item: (item.metadata.get("Name") or "").lower()
    ):
        name = distribution.metadata.get("Name") or "unknown"
        version = distribution.version
        license_expression = distribution.metadata.get("License-Expression")
        license_name = license_expression or distribution.metadata.get("License")
        inventory.append({"name": name, "version": version, "license": license_name})

        package_output = output_root / f"{safe_name(name)}-{safe_name(version)}"
        copied = 0
        for relative_file in distribution.files or []:
            if not LICENSE_PATTERN.match(relative_file.name):
                continue
            source = Path(distribution.locate_file(relative_file))
            if not source.is_file():
                continue
            package_output.mkdir(parents=True, exist_ok=True)
            destination = package_output / f"{copied:02d}-{source.name}"
            shutil.copy2(source, destination)
            copied += 1

    (output_root / "packages.json").write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
