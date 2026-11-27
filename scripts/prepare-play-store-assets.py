#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
from PIL import Image
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "fastlane/metadata/android"

icon_data = cairosvg.svg2png(url=str(ROOT / "www/icons/icon.svg"), output_width=512, output_height=512)
icon_layer = Image.open(BytesIO(icon_data)).convert("RGBA")
if icon_layer.size != (512, 512):
    raise SystemExit("Source app icon must be 512x512.")
# The source logo has rounded transparent SVG corners. Google Play expects a
# square icon; composite it over the app's dark green brand background.
icon_background = Image.new("RGBA", (512, 512), (5, 45, 36, 255))
icon = Image.alpha_composite(icon_background, icon_layer)
if icon.getchannel("A").getextrema() != (255, 255):
    raise SystemExit("Play icon must be a fully opaque 32-bit RGBA PNG.")

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
