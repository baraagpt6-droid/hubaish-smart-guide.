#!/usr/bin/env python3
"""Remove only the explicitly superseded 417 draft from the existing Hubaish Closed Test track."""

import os
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

EXPECTED_PACKAGE = "com.hubaish.guide"
EXPECTED_TRACK = "Hubaish Closed Test"
EXPECTED_REPOSITORY = "baraagpt6-droid/hubaish-smart-guide."
EXPECTED_REF = "refs/heads/main"
OBSOLETE_DRAFT_CODE = 417
EXPECTED_COMPLETED_CODE = 416
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"


def fail(message):
    raise SystemExit(message)


def codes(release):
    values = set()
    for value in release.get("versionCodes") or []:
        try:
            code = int(value)
        except (TypeError, ValueError):
            continue
        if code > 0:
            values.add(code)
    return sorted(values)


def request(session, method, url, *, payload=None, purpose):
    response = session.request(method, url, json=payload, timeout=60)
    if not response.ok:
        fail(f"{purpose} failed ({response.status_code}): {response.text[:1000]}")
    return response.json() if response.content else {}


def open_edit(session, edits_url, purpose):
    data = request(session, "POST", edits_url, payload={}, purpose=purpose)
    edit_id = data.get("id")
    if not edit_id:
        fail("Google Play returned no edit ID.")
    return f"{edits_url}/{quote(str(edit_id), safe='')}"


def discard_edit(session, edit_url):
    try:
        response = session.delete(edit_url, timeout=30)
        if not response.ok and response.status_code not in (404, 410):
            print(f"::warning::Play edit cleanup returned HTTP {response.status_code}.")
    except Exception as exc:
        print(f"::warning::Play edit cleanup failed: {exc}")


def read_tracks(session, edit_url):
    return request(session, "GET", f"{edit_url}/tracks", purpose="Reading Google Play tracks").get("tracks") or []


def find_target(rows):
    matches = [
        row for row in rows
        if str(row.get("track") or "").casefold() == EXPECTED_TRACK.casefold()
    ]
    if len(matches) != 1:
        fail(f"Expected exactly one existing {EXPECTED_TRACK} track; found {len(matches)}.")
    return matches[0]


def production_codes(rows):
    return sorted({
        code
        for row in rows
        if str(row.get("track") or "").casefold() == "production"
        for release in (row.get("releases") or [])
        for code in codes(release)
    })


def main():
    package = os.environ.get("PLAY_PACKAGE_NAME", "").strip()
    track = os.environ.get("PLAY_TRACK", "").strip()
    raw_obsolete = os.environ.get("PLAY_OBSOLETE_DRAFT_VERSION_CODE", "").strip()

    if package != EXPECTED_PACKAGE:
        fail(f"Package lock failed: expected {EXPECTED_PACKAGE}.")
    if track != EXPECTED_TRACK:
        fail(f"Only the exact {EXPECTED_TRACK} track is permitted.")
    if raw_obsolete != str(OBSOLETE_DRAFT_CODE):
        fail(f"This one-shot cleanup can remove only versionCode {OBSOLETE_DRAFT_CODE}.")
    if os.environ.get("GITHUB_REPOSITORY") != EXPECTED_REPOSITORY:
        fail("Repository identity lock failed.")
    if os.environ.get("GITHUB_REF") != EXPECTED_REF:
        fail("Draft cleanup is restricted to refs/heads/main.")

    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(package, safe="")
    edits_url = f"{API_ROOT}/applications/{app}/edits"
    track_path = f"/tracks/{quote(track, safe='')}"

    edit_url = open_edit(session, edits_url, "Opening exact-track draft cleanup edit")
    try:
        rows = read_tracks(session, edit_url)
        if production_codes(rows):
            fail(f"Production is not empty before cleanup: {production_codes(rows)}. No change committed.")

        target = find_target(rows)
        releases = target.get("releases") or []
        drafts = [
            (index, item) for index, item in enumerate(releases)
            if str(item.get("status") or "").casefold() == "draft"
        ]
        completed = [
            (index, item) for index, item in enumerate(releases)
            if str(item.get("status") or "").casefold() == "completed"
        ]
        if len(drafts) != 1 or codes(drafts[0][1]) != [OBSOLETE_DRAFT_CODE]:
            fail(
                f"Expected exactly one obsolete draft [{OBSOLETE_DRAFT_CODE}] on {EXPECTED_TRACK}; "
                f"found {[codes(item) for _, item in drafts]}. No change committed."
            )
        if len(completed) != 1 or codes(completed[0][1]) != [EXPECTED_COMPLETED_CODE]:
            fail(
                f"Expected the sole active completed release [{EXPECTED_COMPLETED_CODE}]; "
                f"found {[codes(item) for _, item in completed]}. No change committed."
            )
        if len(releases) != 2 or any(
            str(item.get("status") or "").casefold() not in {"draft", "completed"}
            for item in releases
        ):
            fail("Unexpected target-track release state detected. No change committed.")

        retained = [dict(completed[0][1])]
        track_url = edit_url + track_path
        saved = request(
            session,
            "PUT",
            track_url,
            payload={"track": EXPECTED_TRACK, "releases": retained},
            purpose=f"Removing only obsolete draft versionCode {OBSOLETE_DRAFT_CODE}",
        )
        if str(saved.get("track") or EXPECTED_TRACK) != EXPECTED_TRACK:
            fail("Google Play returned an unexpected track after draft cleanup.")
        request(session, "POST", f"{edit_url}:commit", payload={}, purpose="Committing exact-track draft cleanup")
    finally:
        discard_edit(session, edit_url)

    # Fresh read-back proves the old draft is gone and the active 416 remains.
    readback_url = open_edit(session, edits_url, "Opening fresh cleanup read-back")
    try:
        rows = read_tracks(session, readback_url)
        target = find_target(rows)
        releases = target.get("releases") or []
        drafts = [
            item for item in releases
            if str(item.get("status") or "").casefold() == "draft" and codes(item)
        ]
        completed = [
            item for item in releases
            if str(item.get("status") or "").casefold() == "completed"
        ]
        if drafts:
            fail(f"Read-back still shows versioned draft(s): {[codes(item) for item in drafts]}.")
        if len(completed) != 1 or codes(completed[0]) != [EXPECTED_COMPLETED_CODE]:
            fail("Read-back did not preserve exactly the prior completed 416 release.")
        if production_codes(rows):
            fail("Production is not empty after cleanup.")
    finally:
        discard_edit(session, readback_url)

    print(
        f"VERIFIED: obsolete draft {OBSOLETE_DRAFT_CODE} removed from {EXPECTED_TRACK}; "
        f"completed {EXPECTED_COMPLETED_CODE} retained; Production remains empty."
    )
    print("No testers resource, tester list, opt-in configuration, or other track was read or modified.")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write("obsolete_draft_removed=417\n")
            handle.write("active_release_preserved=416\n")
            handle.write("production_version_codes=\n")


if __name__ == "__main__":
    main()
