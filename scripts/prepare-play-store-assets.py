#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
from PIL import Image
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "fastlane/metadata/android"

icon_data = cairosvg.svg2png(url=str(ROOT / "www/icons/icon.svg"), output_width=512, output_height=512)
icon = Image.open(BytesIO(icon_data)).convert("RGBA")
if icon.size != (512, 512) or icon.getchannel("A").getextrema() != (255, 255):
    raise SystemExit("Play icon must be a 512x512 RGBA PNG with an opaque background.")

feature_path = ROOT / "play-store/feature-graphic.png"
if not feature_path.is_file():
    raise SystemExit("Chromium-rendered feature graphic is missing.")
feature = Image.open(feature_path).convert("RGB")
if feature.size != (1024, 500):
    raise SystemExit(f"Feature graphic must be 1024x500, got {feature.size}.")

for locale in ("ar", "en-US"):
    images = OUT / locale / "images"
    images.mkdir(parents=True, exist_ok=True)
    icon.save(images / "icon.png", format="PNG", optimize=True)
    feature.save(images / "featureGraphic.png", format="PNG", optimize=True)

print("Generated Play icon 512x512 RGBA and Chromium-rendered feature graphic 1024x500 RGB.")
