#!/usr/bin/env python3
"""Remove only the accidental 421 preview draft from Hubaish Closed Test.

Fail closed unless the track contains exactly one completed 420 release and
exactly one draft 421 release, with Production empty. Tester configuration and
all other tracks are intentionally left untouched.
"""
import os
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

PACKAGE = "com.hubaish.guide"
TRACK = "Hubaish Closed Test"
REPOSITORY = "baraagpt6-droid/hubaish-smart-guide."
REF = "refs/heads/main"
DRAFT_CODE = 421
ACTIVE_CODE = 420
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API = "https://androidpublisher.googleapis.com/androidpublisher/v3"


def fail(message):
    raise SystemExit(message)


def codes(release):
    result = set()
    for raw in release.get("versionCodes") or []:
        try:
            code = int(raw)
        except (TypeError, ValueError):
            continue
        if code > 0:
            result.add(code)
    return sorted(result)


def request(session, method, url, *, payload=None, purpose):
    response = session.request(method, url, json=payload, timeout=60)
    if not response.ok:
        fail(f"{purpose} failed (HTTP {response.status_code}): {response.text[:1000]}")
    return response.json() if response.content else {}


def open_edit(session, edits_url, purpose):
    result = request(session, "POST", edits_url, payload={}, purpose=purpose)
    edit_id = result.get("id")
    if not edit_id:
        fail("Google Play returned no edit ID.")
    return f"{edits_url}/{quote(str(edit_id), safe='')}"


def discard_edit(session, edit_url):
    try:
        response = session.delete(edit_url, timeout=30)
        if not response.ok and response.status_code not in (404, 410):
            print(f"::warning::Play edit cleanup returned HTTP {response.status_code}.")
    except Exception as exc:
        print(f"::warning::Could not discard temporary Play edit: {exc}")


def read_tracks(session, edit_url):
    return request(
        session, "GET", f"{edit_url}/tracks", purpose="Reading Google Play track state"
    ).get("tracks") or []


def find_target(rows):
    found = [
        row for row in rows
        if str(row.get("track") or "").strip().casefold() == TRACK.casefold()
    ]
    if len(found) != 1:
        fail(f"Expected exactly one {TRACK} record; found {len(found)}.")
    return found[0]


def production_codes(rows):
    return sorted({
        code
        for row in rows
        if str(row.get("track") or "").strip().casefold() == "production"
        for release in (row.get("releases") or [])
        for code in codes(release)
    })


def validate(rows):
    production = production_codes(rows)
    if production:
        fail(f"Production must remain empty; found versionCodes {production}. No change committed.")
    target = find_target(rows)
    releases = target.get("releases") or []
    drafts = [
        item for item in releases
        if str(item.get("status") or "").strip().casefold() == "draft"
    ]
    completed = [
        item for item in releases
        if str(item.get("status") or "").strip().casefold() == "completed"
    ]
    in_progress = [
        item for item in releases
        if str(item.get("status") or "").strip().casefold() == "inprogress"
    ]
    if in_progress:
        fail("An in-progress Hubaish Closed Test rollout exists. No change committed.")
    if len(releases) != 2 or len(drafts) != 1 or len(completed) != 1:
        fail(
            "Expected exactly two target-track release records: one draft 421 and one completed 420; "
            f"found statuses={[item.get('status') for item in releases]} "
            f"codes={[codes(item) for item in releases]}. No change committed."
        )
    if codes(drafts[0]) != [DRAFT_CODE]:
        fail(f"The only removable draft must be exactly {DRAFT_CODE}; found {codes(drafts[0])}.")
    if codes(completed[0]) != [ACTIVE_CODE]:
        fail(f"The sole completed release must be exactly {ACTIVE_CODE}; found {codes(completed[0])}.")
    return target, drafts[0], completed[0]


def main():
    if os.environ.get("GITHUB_REPOSITORY") != REPOSITORY:
        fail("Repository identity lock failed.")
    if os.environ.get("GITHUB_REF") != REF:
        fail("Cleanup is restricted to refs/heads/main.")
    if os.environ.get("PLAY_PACKAGE_NAME", "").strip() != PACKAGE:
        fail(f"Package lock failed; expected {PACKAGE}.")
    if os.environ.get("PLAY_TRACK", "").strip() != TRACK:
        fail(f"Track lock failed; only {TRACK} is permitted.")
    if os.environ.get("PLAY_EXPECTED_DRAFT_VERSION_CODE", "").strip() != str(DRAFT_CODE):
        fail(f"This cleanup may remove only versionCode {DRAFT_CODE}.")

    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(PACKAGE, safe="")
    edits_url = f"{API}/applications/{app}/edits"
    target_url = f"{quote(TRACK, safe='')}"
    edit_url = open_edit(session, edits_url, "Opening exact 421 cleanup edit")
    try:
        _, draft, completed = validate(read_tracks(session, edit_url))
        retained = [dict(completed)]
        saved = request(
            session,
            "PUT",
            f"{edit_url}/tracks/{target_url}",
            payload={"track": TRACK, "releases": retained},
            purpose=f"Removing only draft versionCode {DRAFT_CODE}",
        )
        if str(saved.get("track") or TRACK) != TRACK:
            fail("Google Play returned an unexpected track after cleanup.")
        request(
            session, "POST", f"{edit_url}:commit", payload={},
            purpose=f"Committing removal of draft {DRAFT_CODE}",
        )
    finally:
        discard_edit(session, edit_url)

    readback = open_edit(session, edits_url, "Opening fresh 421 cleanup read-back")
    try:
        rows = read_tracks(session, readback)
        _, _, completed = validate_after_cleanup(rows)
    finally:
        discard_edit(session, readback)

    print(
        f"VERIFIED: draft {DRAFT_CODE} removed from {TRACK}; "
        f"completed {ACTIVE_CODE} retained; Production versionCodes=0."
    )
    print("Tester list, opt-in URL, tester eligibility and every other Play track were not changed.")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write("removed_draft_version_code=421\n")
            handle.write("completed_version_code=420\n")
            handle.write("production_version_codes=0\n")


def validate_after_cleanup(rows):
    production = production_codes(rows)
    if production:
        fail(f"Production changed or is not empty after cleanup: {production}.")
    target = find_target(rows)
    releases = target.get("releases") or []
    drafts = [
        item for item in releases
        if str(item.get("status") or "").strip().casefold() == "draft" and codes(item)
    ]
    completed = [
        item for item in releases
        if str(item.get("status") or "").strip().casefold() == "completed"
    ]
    if drafts:
        fail(f"Versioned drafts remain after cleanup: {[codes(item) for item in drafts]}.")
    if len(releases) != 1 or len(completed) != 1 or codes(completed[0]) != [ACTIVE_CODE]:
        fail(
            "Fresh read-back must contain only completed 420; "
            f"statuses={[item.get('status') for item in releases]} "
            f"codes={[codes(item) for item in releases]}."
        )
    return target, completed[0]


if __name__ == "__main__":
    main()
