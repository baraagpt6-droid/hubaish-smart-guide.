#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw
import cairosvg

root = Path(__file__).resolve().parents[1]
source = root / "www/icons/icon.svg"
out = root / "www/icons"
png = cairosvg.svg2png(url=str(source), output_width=1024, output_height=1024)
image = Image.open(BytesIO(png)).convert("RGB")
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")]:
    rendered = image.resize((size, size), Image.Resampling.LANCZOS).quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    rendered.save(out / name, format="PNG", optimize=True)

# Capacitor assets source images.
assets = root / "assets"
assets.mkdir(parents=True, exist_ok=True)
image.save(assets / "icon-only.png", format="PNG", optimize=True)
Image.new("RGB", (1024, 1024), "#07543d").save(assets / "icon-background.png", optimize=True)

svg = source.read_text(encoding="utf-8")
background_rect = '<rect width="512" height="512" rx="104" fill="url(#bg)"/>'
if background_rect not in svg:
    raise SystemExit("Brand SVG background shape changed; cannot safely create transparent adaptive foreground.")
foreground_svg = svg.replace(background_rect, "")
foreground_png = cairosvg.svg2png(bytestring=foreground_svg.encode("utf-8"), output_width=1024, output_height=1024)
foreground = Image.open(BytesIO(foreground_png)).convert("RGBA")
foreground.save(assets / "icon-foreground.png", format="PNG", optimize=True)

# Android 12+ uses a centered mark on a solid color. Older Android versions
# use the full-canvas splash image generated from the same visual identity.
def create_splash(path: Path):
    size = 2732
    canvas = Image.new("RGB", (size, size), "#052d24")
    draw = ImageDraw.Draw(canvas)
    # Quiet topographic rings keep the image restrained behind the emblem.
    for inset in range(180, 1120, 150):
        draw.arc((inset, inset, size - inset, size - inset), 195, 345, fill="#0b4935", width=5)
    mark = foreground.copy()
    mark.thumbnail((1180, 1180), Image.Resampling.LANCZOS)
    x = (size - mark.width) // 2
    y = (size - mark.height) // 2 - 35
    canvas_rgba = canvas.convert("RGBA")
    canvas_rgba.alpha_composite(mark, (x, y))
    canvas_rgba.convert("RGB").save(path, format="PNG", optimize=True)

create_splash(assets / "splash.png")
create_splash(assets / "splash-dark.png")
print("Generated PWA icons, Capacitor adaptive icon sources and 2732px splash images.")
