#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

root = Path("fastlane/metadata/android")
expected = ("01-home.png", "02-history.png", "03-landmarks.png", "04-sub-districts.png")
for locale in ("ar", "en-US"):
    directory = root / locale / "images" / "phoneScreenshots"
    for name in expected:
        path = directory / name
        if not path.is_file():
            raise SystemExit(f"Screenshot is missing: {path}")
        image = Image.open(path).convert("RGB")
        image.save(path, format="PNG", optimize=True)
print("Normalized eight Google Play phone screenshots to 24-bit RGB PNG without alpha.")
