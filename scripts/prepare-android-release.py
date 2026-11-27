#!/usr/bin/env python3
import os, re
from pathlib import Path
path = Path("android/app/build.gradle")
if not path.is_file(): raise SystemExit("Generated android/app/build.gradle was not found.")
source = path.read_text(encoding="utf-8")
code = os.environ.get("ANDROID_VERSION_CODE", "").strip()
name = os.environ.get("ANDROID_VERSION_NAME", "").strip()
if not code.isdigit() or int(code) <= 0: raise SystemExit("ANDROID_VERSION_CODE must be a positive integer.")
if not re.fullmatch(r"[0-9]+\\.[0-9]+\\.[0-9]+", name): raise SystemExit("ANDROID_VERSION_NAME must be x.y.z.")
if not os.environ.get("ANDROID_KEYSTORE_PATH"): raise SystemExit("ANDROID_KEYSTORE_PATH is missing.")
source, c = re.subn(r"(?m)^(\\s*versionCode\\s*(?:=\\s*)?).+$", lambda m: m.group(1)+code, source, count=1)
source, n = re.subn(r'(?m)^(\\s*versionName\\s*(?:=\\s*)?).+$', lambda m: m.group(1)+'"'+name+'"', source, count=1)
if c != 1 or n != 1: raise SystemExit("Could not safely set Gradle versionCode/versionName.")
if "signingConfigs {" in source: raise SystemExit("Unexpected existing signingConfigs; refusing to overwrite.")
signing = '''\n    signingConfigs {\n        hubaishPlayRelease {\n            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))\n            storeType "JKS"\n            storePassword System.getenv("KEYSTORE_PASSWORD")\n            keyAlias System.getenv("KEY_ALIAS")\n            keyPassword System.getenv("KEY_PASSWORD")\n        }\n    }\n'''
source = source.replace("android {", "android {"+signing, 1)
m = re.search(r"(?s)(buildTypes\\s*\\{\\s*release\\s*\\{)", source)
if m: source = source[:m.end()] + "\\n            signingConfig signingConfigs.hubaishPlayRelease" + source[m.end():]
else: source = source.replace("android {", "android {\\n    buildTypes { release { signingConfig signingConfigs.hubaishPlayRelease } }", 1)
path.write_text(source, encoding="utf-8")
print(f"Configured signed Play bundle: versionCode={code}, versionName={name}")
