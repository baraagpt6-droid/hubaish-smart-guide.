#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
from PIL import Image
import cairosvg

root = Path(__file__).resolve().parents[1]
source = root / "www/icons/icon.svg"
out = root / "www/icons"
png = cairosvg.svg2png(url=str(source), output_width=1024, output_height=1024)
image = Image.open(BytesIO(png)).convert("RGB")
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")]:
    rendered = image.resize((size, size), Image.Resampling.LANCZOS).quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    rendered.save(out / name, format="PNG", optimize=True)
print("Generated PWA icons from www/icons/icon.svg")
