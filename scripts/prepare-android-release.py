#!/usr/bin/env python3
import os
import re
from pathlib import Path

gradle = Path("android/app/build.gradle")
if not gradle.is_file():
    raise SystemExit("Generated android/app/build.gradle was not found.")

source = gradle.read_text(encoding="utf-8")
version_code = os.environ.get("ANDROID_VERSION_CODE", "").strip()
version_name = os.environ.get("ANDROID_VERSION_NAME", "").strip()
keystore_path = os.environ.get("ANDROID_KEYSTORE_PATH", "").strip()

if not version_code.isdigit() or int(version_code) <= 0:
    raise SystemExit("ANDROID_VERSION_CODE must be a positive integer.")
if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version_name):
    raise SystemExit("ANDROID_VERSION_NAME must be x.y.z.")
if not keystore_path:
    raise SystemExit("ANDROID_KEYSTORE_PATH is missing.")

source, code_count = re.subn(
    r"(?m)^(\s*versionCode\s*(?:=\s*)?).+$",
    lambda match: match.group(1) + version_code,
    source,
    count=1,
)
source, name_count = re.subn(
    r'(?m)^(\s*versionName\s*(?:=\s*)?).+$',
    lambda match: match.group(1) + '"' + version_name + '"',
    source,
    count=1,
)
if code_count != 1 or name_count != 1:
    raise SystemExit("Could not safely set Android versionCode/versionName.")

if "signingConfigs {" in source:
    raise SystemExit("Unexpected existing signingConfigs block; refusing to overwrite it.")

signing = """
    signingConfigs {
        hubaishPlayRelease {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storeType "JKS"
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
"""
source = source.replace("android {", "android {\n" + signing, 1)

release_block = re.search(r"(?s)(buildTypes\s*\{\s*release\s*\{)", source)
if release_block:
    insert_at = release_block.end()
    source = source[:insert_at] + "\n            signingConfig signingConfigs.hubaishPlayRelease" + source[insert_at:]
else:
    source = source.replace(
        "android {",
        "android {\n    buildTypes { release { signingConfig signingConfigs.hubaishPlayRelease } }",
        1,
    )

gradle.write_text(source, encoding="utf-8")
print(f"Configured signed Play bundle: versionCode={version_code}, versionName={version_name}")
