#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "www/icons/icon-512.png").convert("RGBA")
res = root / "android/app/src/main/res"
sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for density, size in sizes.items():
    directory = res / f"mipmap-{density}"
    directory.mkdir(parents=True, exist_ok=True)
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(directory / "ic_launcher.png", optimize=True)
    icon.save(directory / "ic_launcher_round.png", optimize=True)
    icon.save(directory / "ic_launcher_foreground.png", optimize=True)
adaptive = res / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
foreground = res / "drawable/hubaish_launcher_foreground.png"
foreground.parent.mkdir(parents=True, exist_ok=True)
source.save(foreground, optimize=True)
(adaptive / "ic_launcher.xml").write_text('''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/hubaish_launcher_bg" />
  <foreground android:drawable="@drawable/hubaish_launcher_foreground" />
</adaptive-icon>
''')
(adaptive / "ic_launcher_round.xml").write_text((adaptive / "ic_launcher.xml").read_text())
values = res / "values"
values.mkdir(parents=True, exist_ok=True)
(values / "hubaish_icon_colors.xml").write_text('''<?xml version="1.0" encoding="utf-8"?>
<resources><color name="hubaish_launcher_bg">#07543D</color></resources>
''')
manifest = root / "android/app/src/main/AndroidManifest.xml"
if manifest.exists():
    text = manifest.read_text()
    text = text.replace('android:icon="@mipmap/ic_launcher"', 'android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"')
    manifest.write_text(text)
print("Applied Hubaish launcher icons to generated Android resources")
