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
    "android:statusBarColor": "#071711",
    "android:navigationBarColor": "#071711",
    "android:windowLightStatusBar": "false",
    "android:windowLightNavigationBar": "false",
    "android:windowSplashScreenBackground": "#071711",
    "android:windowBackground": "#071711",
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
        getWindow().setStatusBarColor(Color.parseColor("#071711"));
        getWindow().setNavigationBarColor(Color.parseColor("#071711"));
        WindowInsetsControllerCompat insetsController =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.setAppearanceLightStatusBars(false);
        insetsController.setAppearanceLightNavigationBars(false);
    }
"""
    source = source[:class_match.end()] + method + source[class_match.end():]
main_activity.write_text(source, encoding="utf-8")

# Generate a small native Android speech bridge without adding a Capacitor
# community plugin whose current major version targets a different Capacitor API.
package_match = re.search(r"(?m)^package ([^;]+);", source)
if not package_match:
    raise SystemExit("Unable to resolve the generated Android package name.")
package_name = package_match.group(1)
bridge_path = main_activity.parent / "HubaishSpeechBridge.java"
bridge_source = r"""__PACKAGE__

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;
import java.util.ArrayList;

public final class HubaishSpeechBridge {
    private static final int REQUEST_CODE = 48192;
    private final Activity activity;
    private final WebView webView;
    private SpeechRecognizer recognizer;
    private String requestId = "";
    private String language = "ar-YE";

    public HubaishSpeechBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public void startListening(String id, String locale) {
        activity.runOnUiThread(() -> {
            requestId = id == null ? "" : id;
            language = locale == null || locale.trim().isEmpty() ? "ar-YE" : locale;
            if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
                finish(null, "unavailable");
                return;
            }
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(activity,
                    new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_CODE);
                return;
            }
            beginRecognition();
        });
    }

    @JavascriptInterface
    public void stopListening() {
        activity.runOnUiThread(() -> {
            if (recognizer != null) {
                try { recognizer.stopListening(); }
                catch (Exception ignored) { finish(null, "cancelled"); }
            }
        });
    }

    void onRequestPermissionsResult(int code, int[] grantResults) {
        if (code != REQUEST_CODE) return;
        if (grantResults != null && grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            beginRecognition();
        } else {
            finish(null, "permission-denied");
        }
    }

    private void beginRecognition() {
        releaseRecognizer();
        try {
            recognizer = SpeechRecognizer.createSpeechRecognizer(activity);
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onEvent(int eventType, Bundle params) {}
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onResults(Bundle results) {
                    ArrayList<String> matches = results == null ? null
                        : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    String transcript = matches == null || matches.isEmpty() ? "" : matches.get(0);
                    if (transcript.trim().isEmpty()) finish(null, "no-speech");
                    else finish(transcript, null);
                }
                @Override public void onError(int error) {
                    String value;
                    switch (error) {
                        case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: value = "permission-denied"; break;
                        case SpeechRecognizer.ERROR_NETWORK:
                        case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: value = "network"; break;
                        case SpeechRecognizer.ERROR_NO_MATCH:
                        case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: value = "no-speech"; break;
                        case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: value = "busy"; break;
                        case SpeechRecognizer.ERROR_CLIENT: value = "cancelled"; break;
                        default: value = "recognition-error"; break;
                    }
                    finish(null, value);
                }
            });
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, activity.getPackageName());
            recognizer.startListening(intent);
        } catch (Exception error) {
            finish(null, "unavailable");
        }
    }

    private void finish(String transcript, String error) {
        JSONObject detail = new JSONObject();
        try {
            detail.put("requestId", requestId);
            detail.put("transcript", transcript == null ? "" : transcript);
            detail.put("error", error == null ? "" : error);
        } catch (Exception ignored) {}
        String payload = detail.toString();
        webView.post(() -> webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('hubaish:native-speech',{detail:" + payload + "}))",
            null
        ));
        releaseRecognizer();
    }

    private void releaseRecognizer() {
        if (recognizer == null) return;
        try { recognizer.cancel(); } catch (Exception ignored) {}
        try { recognizer.destroy(); } catch (Exception ignored) {}
        recognizer = null;
    }
}
"""
bridge_source = bridge_source.replace("__PACKAGE__", "package " + package_name + ";")
bridge_path.write_text(bridge_source, encoding="utf-8")

# Register the native bridge in the generated Capacitor MainActivity.
if "HubaishNativeSpeech" not in source:
    anchor = "WindowCompat.setDecorFitsSystemWindows(getWindow(), false);"
    if anchor not in source:
        raise SystemExit("Unable to locate MainActivity onCreate insertion point.")
    source = source.replace(
        anchor,
        'hubaishSpeechBridge = new HubaishSpeechBridge(this, getBridge().getWebView());\n'
        '        getBridge().getWebView().addJavascriptInterface(hubaishSpeechBridge, "HubaishNativeSpeech");\n'
        + anchor,
        1,
    )
if "private HubaishSpeechBridge hubaishSpeechBridge;" not in source:
    class_match = re.search(r"(public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{)", source)
    if not class_match:
        raise SystemExit("Unable to locate MainActivity for speech bridge field.")
    source = source[:class_match.end()] + "\n    private HubaishSpeechBridge hubaishSpeechBridge;\n" + source[class_match.end():]
if "hubaishSpeechBridge.onRequestPermissionsResult" not in source:
    close_index = source.rfind("}")
    if close_index < 0:
        raise SystemExit("Unable to locate MainActivity class closing brace.")
    callback = """
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (hubaishSpeechBridge != null) {
            hubaishSpeechBridge.onRequestPermissionsResult(requestCode, grantResults);
        }
    }
"""
    source = source[:close_index] + callback + source[close_index:]
main_activity.write_text(source, encoding="utf-8")

manifest = ROOT / "AndroidManifest.xml"
tree = ET.parse(manifest)
manifest_root = tree.getroot()
android_name = "{" + ANDROID_NS + "}name"
if not any(item.get(android_name) == "android.permission.RECORD_AUDIO" for item in manifest_root.findall("uses-permission")):
    ET.SubElement(manifest_root, "uses-permission", {android_name: "android.permission.RECORD_AUDIO"})
if not any(item.get(android_name) == "android.hardware.microphone" for item in manifest_root.findall("uses-feature")):
    ET.SubElement(manifest_root, "uses-feature", {android_name: "android.hardware.microphone", "{" + ANDROID_NS + "}required": "false"})
queries = manifest_root.find("queries")
if queries is None:
    queries = ET.Element("queries")
    application_node = manifest_root.find("application")
    manifest_root.insert(list(manifest_root).index(application_node), queries)
recognition_query = False
for query_intent in queries.findall("intent"):
    action = query_intent.find("action")
    if action is not None and action.get(android_name) == "android.speech.RecognitionService":
        recognition_query = True
if not recognition_query:
    query_intent = ET.SubElement(queries, "intent")
    ET.SubElement(query_intent, "action", {android_name: "android.speech.RecognitionService"})
application = manifest_root.find("application")
if application is not None:
    application.set("{" + ANDROID_NS + "}label", "@string/app_name")
tree.write(manifest, encoding="utf-8", xml_declaration=True)
print("Android app label, system bars, RECORD_AUDIO runtime permission and native speech bridge configured.")

