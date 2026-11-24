#!/usr/bin/env python3
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID_NS)
ROOT = Path("android/app/src/main")
if not ROOT.exists():
    raise SystemExit("Capacitor Android project was not generated.")

# Use the short launcher name on all generated Android resource variants.
string_files = list((ROOT / "res").glob("values*/strings.xml"))
if not string_files:
    raise SystemExit("Android strings.xml files were not generated.")
for path in string_files:
    tree = ET.parse(path)
    resources = tree.getroot()
    item = next((x for x in resources.findall("string") if x.get("name") == "app_name"), None)
    if item is None:
        item = ET.SubElement(resources, "string", {"name": "app_name"})
    item.text = "دليل حبيش"
    tree.write(path, encoding="utf-8", xml_declaration=True)

# Android 15 / API 35 edge-to-edge enforcement opt-out plus explicit system colors.
style_files = list((ROOT / "res").glob("values*/styles.xml"))
if not style_files:
    raise SystemExit("Android styles.xml files were not generated.")
system_items = {
    "android:statusBarColor": "@android:color/transparent",
    "android:navigationBarColor": "@android:color/transparent",
    "android:windowLightStatusBar": "false",
    "android:windowLightNavigationBar": "false",
}
for path in style_files:
    tree = ET.parse(path)
    resources = tree.getroot()
    for style in resources.findall("style"):
        if "NoActionBar" not in style.get("name", "") and style.get("name") != "AppTheme":
            continue
        for name, value in system_items.items():
            item = next((x for x in style.findall("item") if x.get("name") == name), None)
            if item is None:
                item = ET.SubElement(style, "item", {"name": name})
            item.text = value
    tree.write(path, encoding="utf-8", xml_declaration=True)

# Enable edge-to-edge and expose safe-area insets to the WebView.
main_activity = next(iter((ROOT / "java").rglob("MainActivity.java")), None)
if main_activity is None:
    raise SystemExit("Capacitor MainActivity.java was not generated.")
source = main_activity.read_text(encoding="utf-8")
for import_line in (
    "import android.graphics.Color;\n",
    "import android.os.Bundle;\n",
    "import androidx.core.view.WindowCompat;\n",
    "import androidx.core.view.WindowInsetsControllerCompat;\n",
):
    if import_line.strip() not in source:
        package_match = re.search(r"(?m)^package [^;]+;\s*\n", source)
        if package_match:
            source = source[:package_match.end()] + import_line + source[package_match.end():]
        else:
            source = import_line + source
if "setDecorFitsSystemWindows" not in source:
    class_match = re.search(r"(public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{)", source)
    if not class_match:
        raise SystemExit("Unable to locate MainActivity BridgeActivity declaration.")
    method = """
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Capacitor 8 targets API 36. Keep edge-to-edge enabled and let
        // Android WebView expose system-bar safe areas to CSS env() variables.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        WindowInsetsControllerCompat insetsController =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.setAppearanceLightStatusBars(false);
        insetsController.setAppearanceLightNavigationBars(false);
    }
"""
    source = source[:class_match.end()] + method + source[class_match.end():]
main_activity.write_text(source, encoding="utf-8")

manifest = ROOT / "AndroidManifest.xml"
tree = ET.parse(manifest)
application = tree.getroot().find("application")
if application is not None:
    application.set("{" + ANDROID_NS + "}label", "@string/app_name")
tree.write(manifest, encoding="utf-8", xml_declaration=True)
print("Android app label, transparent system bars and Android 16 edge-to-edge safe-area handling configured.")
