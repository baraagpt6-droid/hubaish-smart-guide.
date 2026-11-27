#!/usr/bin/env python3
"""Read-only Google Play status report for Hubaish Smart Guide."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

EXPECTED_PACKAGE = "com.hubaish.guide"
EXPECTED_TRACK = "Hubaish Closed Test"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"
TESTER_URL = f"https://play.google.com/apps/testing/{EXPECTED_PACKAGE}"
STORE_URL = f"https://play.google.com/store/apps/details?id={EXPECTED_PACKAGE}"


def fail(message):
    raise SystemExit(message)


def api_json(session, method, url):
    response = session.request(method, url, timeout=60)
    if not response.ok:
        fail(f"Google Play API {method} failed ({response.status_code}): {response.text[:1000]}")
    return response.json() if response.content else {}


def close_inspection_edit(session, edit_url):
    # Discard the temporary read-only inspection edit, not a Play release.
    try:
        response = session.delete(edit_url, timeout=30)
        if not response.ok and response.status_code not in (404, 410):
            print(f"::warning::Temporary inspection edit cleanup returned HTTP {response.status_code}.")
    except Exception as exc:
        print(f"::warning::Temporary inspection edit cleanup failed: {exc}")


def version_codes(releases):
    values = set()
    for release in releases or []:
        for value in release.get("versionCodes") or []:
            try:
                code = int(value)
            except (TypeError, ValueError):
                continue
            if code > 0:
                values.add(code)
    return sorted(values)


def release_for_code(releases, version_code):
    for release in releases or []:
        if version_code in version_codes([release]):
            return release
    return None


def status_label(status):
    return {
        "completed": "مكتمل على مسار الاختبار",
        "inprogress": "قيد الطرح",
        "halted": "متوقف",
        "draft": "مسودة",
    }.get(str(status or "").casefold(), f"حالة API: {status or 'غير محددة'}")


def safe_release_rows(rows):
    result = []
    for row in rows or []:
        releases = row.get("releases") or []
        result.append({
            "track": str(row.get("track") or ""),
            "releases": [{
                "name": str(release.get("name") or ""),
                "status": str(release.get("status") or ""),
                "versionCodes": version_codes([release]),
                "userFraction": release.get("userFraction"),
            } for release in releases],
        })
    return result


def main():
    package = os.environ.get("PLAY_PACKAGE_NAME", EXPECTED_PACKAGE).strip()
    track = os.environ.get("PLAY_TRACK", EXPECTED_TRACK).strip()
    if package != EXPECTED_PACKAGE:
        fail(f"Package guard failed. Expected {EXPECTED_PACKAGE}.")
    if track.casefold() != EXPECTED_TRACK.casefold():
        fail(f"Track guard failed. Only {EXPECTED_TRACK} is permitted.")

    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(package, safe="")
    edits_url = f"{API_ROOT}/applications/{app}/edits"
    created = session.post(edits_url, json={}, timeout=60)
    if not created.ok:
        fail(f"Could not open read-only Google Play inspection edit ({created.status_code}): {created.text[:1000]}")
    edit_id = created.json().get("id")
    if not edit_id:
        fail("Google Play returned an inspection edit without an ID.")
    edit_url = f"{edits_url}/{quote(str(edit_id), safe='')}"

    try:
        rows = api_json(session, "GET", f"{edit_url}/tracks").get("tracks") or []
        bundles = api_json(session, "GET", f"{edit_url}/bundles").get("bundles") or []
    finally:
        close_inspection_edit(session, edit_url)

    matching = [row for row in rows if str(row.get("track") or "").casefold() == EXPECTED_TRACK.casefold()]
    if len(matching) != 1:
        fail(f"Expected one {EXPECTED_TRACK} track in Google Play API, found {len(matching)}.")
    target = matching[0]
    releases = target.get("releases") or []
    code_413 = release_for_code(releases, 413)
    code_414 = release_for_code(releases, 414)

    active_codes = set()
    for release in releases:
        if str(release.get("status") or "").casefold() in {"completed", "inprogress"}:
            active_codes.update(version_codes([release]))
    effective_code = max(active_codes, default=None)

    drafts = [
        {"name": str(release.get("name") or ""), "versionCodes": version_codes([release])}
        for release in releases
        if str(release.get("status") or "").casefold() == "draft"
    ]

    production_rows = [row for row in rows if str(row.get("track") or "").casefold() == "production"]
    production_releases = [release for row in production_rows for release in (row.get("releases") or [])]
    production_codes = sorted({code for release in production_releases for code in version_codes([release])})
    production_statuses = sorted({str(release.get("status") or "") for release in production_releases})

    ignored_empty_tracks = []
    alternate_track_releases = []
    for row in rows:
        name = str(row.get("track") or "")
        if name.casefold() == EXPECTED_TRACK.casefold() or name.casefold() in {"production", "internal", "qa"}:
            continue
        row_releases = row.get("releases") or []
        codes = sorted({code for release in row_releases for code in version_codes([release])})
        if codes:
            alternate_track_releases.append({"track": name, "versionCodes": codes})
        elif row_releases:
            ignored_empty_tracks.append({"track": name, "statuses": sorted({str(x.get("status") or "") for x in row_releases})})

    all_track_codes = set()
    for row in rows:
        all_track_codes.update(version_codes(row.get("releases") or []))
    uploaded_bundle_codes = set()
    for bundle in bundles:
        try:
            value = int(bundle.get("versionCode", 0))
        except (TypeError, ValueError):
            continue
        if value > 0:
            uploaded_bundle_codes.add(value)

    def summary_release(release):
        if not release:
            return {"found": False, "status": None, "versionCodes": []}
        status = str(release.get("status") or "")
        return {
            "found": True,
            "status": status,
            "statusArabic": status_label(status),
            "versionCodes": version_codes([release]),
            "name": str(release.get("name") or ""),
            "userFraction": release.get("userFraction"),
        }

    checked_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    report = {
        "checkedAt": checked_at,
        "packageName": package,
        "track": EXPECTED_TRACK,
        "effectiveVersionCode": effective_code,
        "versionCode413": summary_release(code_413),
        "versionCode414": summary_release(code_414),
        "draftReleaseCount": len(drafts),
        "drafts": drafts,
        "trackReadyByApi": bool(effective_code),
        "trackReleases": safe_release_rows([target]),
        "production": {"versionCodes": production_codes, "statuses": production_statuses},
        "alternateTracksWithVersionCodes": alternate_track_releases,
        "emptyAlternateTracks": ignored_empty_tracks,
        "highestSeenVersionCode": max(all_track_codes | uploaded_bundle_codes, default=None),
        "testerOptInUrl": TESTER_URL,
        "storeUrl": STORE_URL,
        "readOnly": True,
        "reviewLimitation": "Google Play Edits.tracks exposes release status, not a separate policy-review queue state or tester allow-list.",
    }

    lines = [
        "# تقرير حالة Google Play — دليل حبيش",
        "",
        f"- آخر فحص UTC: {checked_at}",
        f"- الحزمة: {package}",
        f"- مسار الاختبار: {EXPECTED_TRACK}",
        f"- الإصدار الفعّال وفق حالة المسار: {effective_code if effective_code is not None else 'لا يوجد إصدار مكتمل أو قيد الطرح'}",
        "",
        "## حالة الإصدارات المطلوبة",
        "",
        "| الإصدار | حالة Google Play API |",
        "|---|---|",
    ]
    for code, release in [(413, code_413), (414, code_414)]:
        if release:
            lines.append(f"| {code} | {status_label(release.get('status'))} ({release.get('status')}) |")
        else:
            lines.append(f"| {code} | غير موجود في بيانات المسار الحالي |")

    lines += ["", "## جاهزية المختبرين", ""]
    if code_413 and str(code_413.get("status") or "").casefold() == "completed":
        lines.append("- 413 حالته completed على مسار الاختبار. هذا يثبت اكتمال حالة الإصدار في سجل المسار، لكنه ليس حقلاً مستقلاً يؤكد قرار مراجعة السياسات.")
        lines.append("- واجهة Edits.tracks لا تعرض حالة طابور المراجعة أو قائمة حسابات المختبرين. يجب أن تكون صفحة التطبيق بحالة Published وأن يكون حساب المختبر ضمن قائمة الاختبار حتى يعمل رابط الانضمام.")
    elif code_413:
        lines.append(f"- 413 ليس بحالة مكتملة؛ الحالة الحالية {code_413.get('status') or 'غير محددة'}.")
    else:
        lines.append("- لم يظهر 413 في المسار المحدد.")
    if code_414 and str(code_414.get("status") or "").casefold() == "draft":
        lines.append("- 414 مسودة معاينة، وليست الإصدار المتاح للمختبرين.")
    elif code_414:
        lines.append(f"- حالة 414 الحالية هي {code_414.get('status') or 'غير محددة'}.")
    else:
        lines.append("- لا يوجد سجل 414 في المسار الحالي.")

    lines += ["", "## تعارض المسارات", ""]
    if alternate_track_releases:
        for row in alternate_track_releases:
            lines.append(f"- تنبيه: المسار الآخر {row['track']} يحتوي versionCode(s): {', '.join(map(str, row['versionCodes']))}. لم يجرِ تعديله.")
    else:
        lines.append("- لا توجد أرقام إصدارات في مسارات اختبار بديلة خارج المسار المحدد.")
    if ignored_empty_tracks:
        for row in ignored_empty_tracks:
            lines.append(f"- المسار {row['track']} يحتوي سجلاً بلا versionCode ({', '.join(row['statuses'])}); لم يُستخدم ولم يُعدّل.")
    if len(drafts) == 1:
        lines.append("- يوجد مسودة واحدة على المسار المحدد؛ خيار الاعتماد اليدوي يستطيع استهدافها.")
    elif len(drafts) == 0:
        lines.append("- لا توجد مسودة حالياً على المسار المحدد.")
    else:
        lines.append(f"- يوجد {len(drafts)} مسودات على المسار المحدد. الاعتماد اليدوي متوقف احترازياً حتى يبقى اختيار واحد فقط.")

    lines += [
        "",
        "## مسار Production",
        "",
        f"- الحالات: {', '.join(production_statuses) if production_statuses else 'لا توجد إصدارات مسجلة'}",
        f"- versionCodes: {', '.join(map(str, production_codes)) if production_codes else 'لا يوجد'}",
        "- هذا الفحص قرائي فقط؛ لم يتم رفع أو تعديل أي إصدار.",
        "",
        "## روابط المشاركة",
        "",
        f"- رابط الانضمام القياسي: {TESTER_URL}",
        f"- صفحة المتجر على Android: {STORE_URL}",
        "- هذه الروابط لا تتجاوز قيود المسار المغلق. قد لا يظهر رابط الانضمام قبل أن تكون حالة التطبيق Published، ويجب أن يكون حساب المختبر مؤهلاً.",
        "",
        "## حدود الاستعلام",
        "",
        "- Google Play Developer API أعاد بيانات المسارات والإصدارات فقط. لا يوفّر هذا الاستعلام وحده حالة مراجعة السياسات المنفصلة أو قائمة المختبرين.",
        "- تم فتح تحرير فحص مؤقت وقراءة البيانات ثم حذفه دون تعديل المسارات أو الالتزام بأي إصدار.",
    ]
    markdown = "\n".join(lines) + "\n"
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write(markdown)
    Path("play-status-monitor.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if alternate_track_releases:
        print("::warning::Release version codes exist on non-target tracks. No other track was changed.")


if __name__ == "__main__":
    main()
