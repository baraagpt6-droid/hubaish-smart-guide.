#!/usr/bin/env python3
"""Retire only the accidental 419 preview draft before the guarded 420 release."""
import os
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

EXPECTED_PACKAGE = "com.hubaish.guide"
EXPECTED_TRACK = "Hubaish Closed Test"
EXPECTED_REPOSITORY = "baraagpt6-droid/hubaish-smart-guide."
EXPECTED_REF = "refs/heads/main"
PREVIEW_CODE = 419
ACTIVE_CODE = 418
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"


def fail(message):
    raise SystemExit(message)


def codes(release):
    out = set()
    for raw in release.get("versionCodes") or []:
        try:
            value = int(raw)
        except (TypeError, ValueError):
            continue
        if value > 0:
            out.add(value)
    return sorted(out)


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


def get_tracks(session, edit_url):
    return request(session, "GET", edit_url + "/tracks", purpose="Reading Google Play tracks").get("tracks") or []


def target_track(rows):
    matches = [row for row in rows if str(row.get("track") or "").casefold() == EXPECTED_TRACK.casefold()]
    if len(matches) != 1:
        fail(f"Expected exactly one {EXPECTED_TRACK} track; found {len(matches)}.")
    return matches[0]


def production_codes(rows):
    return sorted({
        code
        for row in rows
        if str(row.get("track") or "").casefold() == "production"
        for release in (row.get("releases") or [])
        for code in codes(release)
    })


def verify_state(rows, *, allow_preview):
    if production_codes(rows):
        fail(f"Production must remain empty; found {production_codes(rows)}.")
    target = target_track(rows)
    releases = target.get("releases") or []
    drafts = [item for item in releases if str(item.get("status") or "").casefold() == "draft" and codes(item)]
    completed = [item for item in releases if str(item.get("status") or "").casefold() == "completed"]
    in_progress = [item for item in releases if str(item.get("status") or "").casefold() == "inprogress"]
    if in_progress:
        fail("An in-progress Hubaish Closed Test rollout exists. Refusing to modify the track.")
    if len(completed) != 1 or codes(completed[0]) != [ACTIVE_CODE]:
        fail(f"Expected exactly completed {ACTIVE_CODE}; found {[codes(item) for item in completed]}.")
    if allow_preview:
        if len(drafts) > 1 or (drafts and codes(drafts[0]) != [PREVIEW_CODE]):
            fail(f"Only one exact {PREVIEW_CODE} preview draft may be retired; found {[codes(item) for item in drafts]}.")
    elif drafts:
        fail(f"Versioned drafts remain after cleanup: {[codes(item) for item in drafts]}.")
    return target, releases, drafts, completed


def main():
    package = os.environ.get("PLAY_PACKAGE_NAME", "").strip()
    track = os.environ.get("PLAY_TRACK", "").strip()
    if package != EXPECTED_PACKAGE:
        fail(f"Package lock failed: expected {EXPECTED_PACKAGE}.")
    if track != EXPECTED_TRACK:
        fail(f"Only the exact {EXPECTED_TRACK} track is permitted.")
    if os.environ.get("GITHUB_REPOSITORY") != EXPECTED_REPOSITORY:
        fail("Repository identity lock failed.")
    if os.environ.get("GITHUB_REF") != EXPECTED_REF:
        fail("Preview cleanup is restricted to refs/heads/main.")

    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(package, safe="")
    edits_url = f"{API_ROOT}/applications/{app}/edits"
    track_path = f"/tracks/{quote(track, safe='')}"

    edit_url = open_edit(session, edits_url, "Opening 419 preview cleanup edit")
    removed = False
    try:
        rows = get_tracks(session, edit_url)
        _, releases, drafts, completed = verify_state(rows, allow_preview=True)
        if drafts:
            retained = [
                dict(item) for item in releases
                if item is not drafts[0]
            ]
            if len(retained) != 1 or codes(retained[0]) != [ACTIVE_CODE] or str(retained[0].get("status") or "").casefold() != "completed":
                fail("Unexpected target-track release state. No change committed.")
            track_url = edit_url + track_path
            saved = request(
                session,
                "PUT",
                track_url,
                payload={"track": EXPECTED_TRACK, "releases": retained},
                purpose=f"Removing only preview draft {PREVIEW_CODE}",
            )
            if str(saved.get("track") or EXPECTED_TRACK) != EXPECTED_TRACK:
                fail("Google Play returned an unexpected track after preview cleanup.")
            request(session, "POST", f"{edit_url}:commit", payload={}, purpose="Committing 419 preview cleanup")
            removed = True
    finally:
        discard_edit(session, edit_url)

    readback_url = open_edit(session, edits_url, "Opening fresh 420 release preflight read-back")
    try:
        rows = get_tracks(session, readback_url)
        _, _, drafts, completed = verify_state(rows, allow_preview=False)
        if len(completed) != 1 or codes(completed[0]) != [ACTIVE_CODE]:
            fail(f"Read-back did not preserve completed {ACTIVE_CODE}.")
    finally:
        discard_edit(session, readback_url)

    print(f"VERIFIED: 419 preview draft removed={removed}; completed 418 retained; versioned drafts=0; Production empty.")
    print("Only Hubaish Closed Test was read or changed. No tester list, opt-in configuration, or other track was modified.")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"preview_419_removed={'true' if removed else 'false'}\n")
            handle.write("active_release_preserved=418\n")


if __name__ == "__main__":
    main()
