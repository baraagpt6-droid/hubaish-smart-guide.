#!/usr/bin/env python3
"""Resolve a safe Closed-testing track/version, then verify the committed Play release."""
import argparse
import json
import os
import re
from pathlib import Path
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

PACKAGE = os.environ.get("PLAY_PACKAGE_NAME", "com.hubaish.guide").strip()
EXPECTED_TRACK = "Hubaish Closed Test"
PREFERRED_TRACK = os.environ.get("PLAY_TRACK", EXPECTED_TRACK).strip()
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"
FORBIDDEN_TRACKS = {"internal", "production", "open", "open-testing", "open testing", "qa"}
RELEASED_STATUSES = {"completed", "inprogress", "halted"}
FORM_FACTOR_TRACK_MARKERS = (":production", ":internal", ":open", ":qa")


def fail(message):
    raise SystemExit(message)


def validate_track_name(name):
    if name.casefold() != EXPECTED_TRACK.casefold():
        fail(f"Only the Hubaish Closed Test track is allowed; received {name!r}.")
    if not name or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_. -]{2,59}", name):
        fail("PLAY_TRACK is empty or has unsupported characters.")
    lowered = name.casefold()
    if lowered in FORBIDDEN_TRACKS or lowered.endswith(FORM_FACTOR_TRACK_MARKERS):
        fail(f"Refusing non-Closed testing track '{name}'. Production, Internal, Open and QA tracks are blocked.")
    if ":" in name:
        fail(f"Refusing form-factor track '{name}'. Only the default Android form factor is permitted.")


def new_api_session():
    if PACKAGE != "com.hubaish.guide":
        fail(f"Package lock failed: expected com.hubaish.guide, received {PACKAGE!r}.")
    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(PACKAGE, safe="")
    edits_url = f"{API_ROOT}/applications/{app}/edits"
    created = session.post(edits_url, json={}, timeout=60)
    if not created.ok:
        fail(f"Google Play could not open a read-only inspection edit ({created.status_code}): {created.text[:1200]}")
    edit_id = created.json().get("id")
    if not edit_id:
        fail("Google Play returned an edit without an ID.")
    edit_url = f"{edits_url}/{quote(str(edit_id), safe='')}"
    return session, edits_url, edit_url


def api_json(session, method, url):
    response = session.request(method, url, timeout=60)
    if not response.ok:
        fail(f"Google Play {method} request failed ({response.status_code}): {response.text[:1200]}")
    return response.json() if response.content else {}


def close_inspection_edit(session, edit_url):
    try:
        response = session.delete(edit_url, timeout=30)
        if not response.ok and response.status_code not in (404, 410):
            print(f"::warning::Could not discard read-only Play inspection edit ({response.status_code}).")
    except Exception as exc:
        print(f"::warning::Could not discard read-only Play inspection edit: {exc}")


def codes_for_release(releases):
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


def choose_track(track_rows):
    names = sorted({str(row.get("track", "")).strip() for row in track_rows if row.get("track")})
    by_fold = {name.casefold(): name for name in names}
    selected = by_fold.get(EXPECTED_TRACK.casefold())
    if not selected:
        fail(
            f"Required Closed-testing track '{EXPECTED_TRACK}' was not found. "
            "Refusing to fall back to alpha, beta, or another track."
        )
    validate_track_name(selected)
    return selected, names


def read_release_version():
    version_name = Path("release-version.txt").read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version_name):
        fail("release-version.txt must contain a semantic version in x.y.z format.")
    return version_name


def discover_release():
    validate_track_name(PREFERRED_TRACK)
    session, edits_url, edit_url = new_api_session()
    try:
        tracks = api_json(session, "GET", f"{edit_url}/tracks").get("tracks") or []
        selected_track, track_names = choose_track(tracks)
        selected_rows = [row for row in tracks if str(row.get("track", "")).strip().casefold() == selected_track.casefold()]
        draft_records = [
            release
            for row in selected_rows
            for release in (row.get("releases") or [])
            if str(release.get("status", "")).strip().casefold() == "draft"
            and codes_for_release([release])
        ]
        release_mode = os.environ.get("PLAY_RELEASE_MODE", "preview_draft").strip()
        if release_mode == "publish_new_release":
            allowed_obsolete_code = os.environ.get("PLAY_ALLOWED_EXISTING_DRAFT_VERSION_CODE", "").strip()
            if allowed_obsolete_code != "417":
                fail("The one-shot 418 release may tolerate only explicitly identified obsolete draft 417.")
            if len(draft_records) != 1 or codes_for_release([draft_records[0]]) != [417]:
                fail(
                    "The one-shot 418 release requires exactly one obsolete 417 draft before cleanup; "
                    f"found {[codes_for_release([item]) for item in draft_records]}."
                )
        elif release_mode == "publish_420_release":
            if len(draft_records) > 1 or (draft_records and codes_for_release([draft_records[0]]) != [419]):
                fail(
                    "The one-shot 420 release may clean up only one exact 419 preview draft before continuing; "
                    f"found {[codes_for_release([item]) for item in draft_records]}."
                )
            completed_records = [
                release
                for row in selected_rows
                for release in (row.get("releases") or [])
                if str(release.get("status", "")).strip().casefold() == "completed"
            ]
            if len(completed_records) != 1 or codes_for_release([completed_records[0]]) != [418]:
                fail(
                    "The one-shot 420 release may replace only the sole completed Hubaish Closed Test versionCode 418; "
                    f"found {[codes_for_release([item]) for item in completed_records]}."
                )
            if any(str(release.get("status", "")).strip().casefold() == "inprogress"
                   for row in selected_rows for release in (row.get("releases") or [])):
                fail("An in-progress Closed Test release exists. Refusing to overlap rollouts.")
        elif release_mode == "publish_422_release":
            if draft_records:
                fail(
                    "The one-shot 422 release requires zero versioned drafts on Hubaish Closed Test; "
                    f"found {[codes_for_release([item]) for item in draft_records]}."
                )
            completed_records = [
                release
                for row in selected_rows
                for release in (row.get("releases") or [])
                if str(release.get("status", "")).strip().casefold() == "completed"
            ]
            if len(completed_records) != 1 or codes_for_release([completed_records[0]]) != [420]:
                fail(
                    "The one-shot 422 release may replace only the sole completed Hubaish Closed Test versionCode 420; "
                    f"found {[codes_for_release([item]) for item in completed_records]}."
                )
            if any(str(release.get("status", "")).strip().casefold() == "inprogress"
                   for row in selected_rows for release in (row.get("releases") or [])):
                fail("An in-progress Closed Test release exists. Refusing to overlap rollouts.")
        elif draft_records:
            fail(
                f"Closed-testing track '{selected_track}' already contains draft versionCode(s) "
                f"{[codes_for_release([item]) for item in draft_records]}. Refusing to create a duplicate draft."
            )
        all_codes = set()
        has_reviewed_release = False
        production_codes = []
        summaries = []
        for row in tracks:
            name = str(row.get("track", "")).strip()
            releases = row.get("releases") or []
            release_codes = codes_for_release(releases)
            all_codes.update(release_codes)
            statuses = [str(release.get("status", "")).strip() for release in releases]
            summaries.append({"track": name, "statuses": statuses, "versionCodes": release_codes})
            # Internal testing is not treated as proof that an app has passed its first
            # closed/public review. A released closed or production track is.
            if name.casefold() == "production":
                production_codes = release_codes
            if name.casefold() != "internal" and any(status.casefold() in RELEASED_STATUSES for status in statuses):
                has_reviewed_release = True

        bundles = api_json(session, "GET", f"{edit_url}/bundles").get("bundles") or []
        for bundle in bundles:
            try:
                code = int(bundle.get("versionCode", 0))
            except (TypeError, ValueError):
                continue
            if code > 0:
                all_codes.add(code)

        highest_code = max(all_codes, default=0)
        if release_mode == "publish_420_release":
            allowed_highest = 419 if draft_records else 418
            if highest_code != allowed_highest or 420 in all_codes:
                fail(f"The one-shot 420 release requires bundle history to end at 418, or at one exact 419 draft being retired, and code 420 unused; highest={highest_code}.")
            version_code = 420
        elif release_mode == "publish_422_release":
            if highest_code != 421 or 422 in all_codes:
                fail(f"The one-shot 422 release requires bundle history to end at the already-consumed 421, with no existing 422 bundle; highest={highest_code}.")
            version_code = 422
        else:
            version_code = highest_code + 1
        if version_code <= 0 or version_code > 2_100_000_000:
            fail(f"Calculated versionCode {version_code} is outside Android's supported positive integer range.")
        if release_mode == "publish_new_release" and version_code != 418:
            fail(f"The one-shot clean release is locked to versionCode 418; Play resolved {version_code}.")
        if release_mode == "publish_420_release" and version_code != 420:
            fail(f"The one-shot clean release is locked to versionCode 420; Play resolved {version_code}.")
        if release_mode == "publish_420_release" and production_codes:
            fail(f"Production must remain empty before the 420 release; found {production_codes}.")
        if release_mode == "publish_422_release" and version_code != 422:
            fail(f"The one-shot clean release is locked to versionCode 422; Play resolved {version_code}.")
        if release_mode == "publish_422_release" and production_codes:
            fail(f"Production must remain empty before the 422 release; found {production_codes}.")

        version_name = read_release_version()
        release_status = "draft"
        output_path = os.environ.get("GITHUB_OUTPUT")
        if not output_path:
            fail("GITHUB_OUTPUT is missing; cannot pass the resolved Play release to subsequent steps.")
        with open(output_path, "a", encoding="utf-8") as output:
            output.write(f"track={selected_track}\n")
            output.write(f"version_code={version_code}\n")
            output.write(f"version_name={version_name}\n")
            output.write(f"release_status={release_status}\n")
            output.write(f"has_reviewed_release={'true' if has_reviewed_release else 'false'}\n")
            output.write(f"production_version_codes={','.join(str(code) for code in production_codes)}\n")

        print(json.dumps({
            "packageName": PACKAGE,
            "availableTracks": track_names,
            "trackSummaries": summaries,
            "selectedClosedTestingTrack": selected_track,
            "highestExistingVersionCode": highest_code,
            "nextVersionCode": version_code,
            "versionName": version_name,
            "hasPriorReviewedNonInternalRelease": has_reviewed_release,
            "releaseStatus": release_status,
            "productionVersionCodesBeforeUpload": production_codes,
            "productionTrackWillBeUploaded": False,
        }, ensure_ascii=False))
    finally:
        close_inspection_edit(session, edit_url)


def verify_upload():
    track = os.environ.get("PLAY_TRACK", "").strip()
    validate_track_name(track)
    try:
        expected_code = int(os.environ.get("ANDROID_VERSION_CODE", "0"))
    except ValueError:
        expected_code = 0
    expected_status = os.environ.get("PLAY_RELEASE_STATUS", "").strip()
    if expected_code <= 0:
        fail("ANDROID_VERSION_CODE must be a positive integer for post-upload verification.")
    if expected_status not in {"draft", "completed"}:
        fail("PLAY_RELEASE_STATUS must be draft or completed for post-upload verification.")

    baseline_production = sorted(
        int(value) for value in os.environ.get("PLAY_PRODUCTION_VERSION_CODES", "").split(",") if value.strip().isdigit()
    )
    session, edits_url, edit_url = new_api_session()
    try:
        rows = api_json(session, "GET", f"{edit_url}/tracks").get("tracks") or []
        matches = [row for row in rows if str(row.get("track", "")).casefold() == track.casefold()]
        if len(matches) != 1:
            fail(f"Expected one committed Closed-testing track '{track}', found {len(matches)}.")
        releases = matches[0].get("releases") or []
        found = None
        for release in releases:
            codes = codes_for_release([release])
            if expected_code in codes:
                found = release
                break
        if found is None:
            fail(f"Google Play does not show versionCode {expected_code} on Closed-testing track '{track}'.")
        actual_status = str(found.get("status", "")).strip()
        if actual_status != expected_status:
            fail(f"Google Play shows release status '{actual_status}', expected '{expected_status}' for versionCode {expected_code}.")

        draft_releases = [
            item for item in releases
            if str(item.get("status", "")).casefold() == "draft" and codes_for_release([item])
        ]
        completed_releases = [
            item for item in releases
            if str(item.get("status", "")).casefold() == "completed"
        ]
        if expected_status == "draft":
            if len(draft_releases) != 1 or codes_for_release([draft_releases[0]]) != [expected_code]:
                fail("Draft read-back must show exactly the uploaded versionCode and no other versioned draft.")
        elif expected_status == "completed":
            if draft_releases:
                fail(f"Completed release read-back found pending versioned draft(s): {[codes_for_release([item]) for item in draft_releases]}.")
            if len(completed_releases) != 1 or codes_for_release([completed_releases[0]]) != [expected_code]:
                fail("Completed read-back must show exactly one completed release with the expected versionCode.")

        production_rows = [row for row in rows if str(row.get("track", "")).casefold() == "production"]
        current_production = sorted({code for row in production_rows for code in codes_for_release(row.get("releases") or [])})
        if current_production != baseline_production:
            fail(
                "Production track versionCodes changed during Closed-testing upload. "
                f"Before={baseline_production}, after={current_production}."
            )

        print(json.dumps({
            "verified": True,
            "packageName": PACKAGE,
            "track": track,
            "versionCode": expected_code,
            "releaseStatus": actual_status,
            "productionVersionCodesUnchanged": True,
        }, ensure_ascii=False))
    finally:
        close_inspection_edit(session, edit_url)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-upload", action="store_true", help="Read back the committed track and confirm the release.")
    args = parser.parse_args()
    if args.verify_upload:
        verify_upload()
    else:
        discover_release()


if __name__ == "__main__":
    main()
