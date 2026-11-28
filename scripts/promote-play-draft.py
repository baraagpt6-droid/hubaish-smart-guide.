#!/usr/bin/env python3
"""Promote only the explicitly requested Hubaish Closed Test draft and verify the committed state."""
import os
from urllib.parse import quote
import google.auth
from google.auth.transport.requests import AuthorizedSession

EXPECTED_PACKAGE = "com.hubaish.guide"
EXPECTED_TRACK = "Hubaish Closed Test"
EXPECTED_REPOSITORY = "baraagpt6-droid/hubaish-smart-guide."
EXPECTED_REF = "refs/heads/main"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"


def fail(message):
    raise SystemExit(message)


def codes(release):
    out = set()
    for item in release.get("versionCodes") or []:
        try:
            code = int(item)
        except (TypeError, ValueError):
            continue
        if code > 0:
            out.add(code)
    return sorted(out)


def request(session, method, url, *, payload=None, purpose):
    response = session.request(method, url, json=payload, timeout=60)
    if not response.ok:
        fail(f"{purpose} failed ({response.status_code}): {response.text[:1000]}")
    return response.json() if response.content else {}


def open_edit(session, url, purpose):
    data = request(session, "POST", url, payload={}, purpose=purpose)
    edit_id = data.get("id")
    if not edit_id:
        fail("Google Play returned no edit ID.")
    return f"{url}/{quote(str(edit_id), safe='')}"


def discard_edit(session, url):
    try:
        response = session.delete(url, timeout=30)
        if not response.ok and response.status_code not in (404, 410):
            print(f"::warning::Play edit cleanup returned HTTP {response.status_code}.")
    except Exception as exc:
        print(f"::warning::Play edit cleanup failed: {exc}")


def main():
    package = os.environ.get("PLAY_PACKAGE_NAME", "").strip()
    track = os.environ.get("PLAY_TRACK", "").strip()
    raw_code = os.environ.get("PLAY_EXPECTED_VERSION_CODE", "").strip()
    if package != EXPECTED_PACKAGE:
        fail(f"Package lock failed: expected {EXPECTED_PACKAGE}.")
    if track != EXPECTED_TRACK:
        fail(f"Only the exact {EXPECTED_TRACK} track is permitted.")
    if os.environ.get("GITHUB_REPOSITORY") != EXPECTED_REPOSITORY:
        fail("Repository identity lock failed.")
    if os.environ.get("GITHUB_REF") != EXPECTED_REF:
        fail("Approval is restricted to refs/heads/main.")
    if not raw_code.isdigit():
        fail("PLAY_EXPECTED_VERSION_CODE must name the exact existing draft.")
    expected = int(raw_code)
    if expected < 1 or expected > 2_100_000_000:
        fail("Requested versionCode is outside the valid Android range.")

    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(package, safe="")
    edits_url = f"{API_ROOT}/applications/{app}/edits"
    track_path = f"/tracks/{quote(track, safe='')}"

    approval_edit = open_edit(session, edits_url, "Opening approval edit")
    try:
        track_url = approval_edit + track_path
        data = request(session, "GET", track_url, purpose="Reading target Closed Test track")
        releases = data.get("releases") or []
        drafts = [(i, item) for i, item in enumerate(releases)
                  if str(item.get("status") or "").casefold() == "draft"]
        if len(drafts) != 1:
            fail(f"Expected exactly one draft on {EXPECTED_TRACK}; found {len(drafts)}.")
        draft_index, draft = drafts[0]
        draft_codes = codes(draft)
        if draft_codes != [expected]:
            fail(f"Expected draft versionCodes [{expected}], received {draft_codes}. No change committed.")

        completed_releases = [
            (index, item) for index, item in enumerate(releases)
            if str(item.get("status") or "").casefold() == "completed"
        ]
        if len(completed_releases) > 1:
            fail("The target track already contains multiple completed release records. No change committed.")
        prior_completed_codes = sorted({
            code for _, item in completed_releases for code in codes(item)
        })
        if expected == 418 and prior_completed_codes != [416]:
            fail(
                "The one-shot 418 release may replace only the existing completed versionCode 416; "
                f"found {prior_completed_codes}. No change committed."
            )
        if expected == 420 and prior_completed_codes != [418]:
            fail(
                "The one-shot 420 release may replace only the existing completed versionCode 418; "
                f"found {prior_completed_codes}. No change committed."
            )
        if expected == 422 and prior_completed_codes != [420]:
            fail(
                "The one-shot 422 release may replace only the existing completed versionCode 420; "
                f"found {prior_completed_codes}. No change committed."
            )
        if any(not codes(item) for _, item in completed_releases):
            fail("The existing completed target-track release has no versionCodes. No change committed.")
        if any(str(item.get("status") or "").casefold() == "inprogress" for item in releases):
            fail("An in-progress release exists on the target track. Refusing to overlap rollouts.")

        duplicates = [
            item for index, item in enumerate(releases)
            if index != draft_index and expected in codes(item)
        ]
        if duplicates:
            fail(f"versionCode {expected} also exists in another target-track release. No change committed.")

        promoted_release = dict(draft)
        promoted_release["versionCodes"] = [str(code) for code in draft_codes]
        promoted_release["status"] = "completed"

        # The newer version supersedes the previous completed assignment on
        # this track. Its uploaded bundle remains in Play bundle history, but
        # the lower code cannot remain in the active track assignment once
        # every compatible device would receive the newer APK.
        updated_releases = [
            dict(item)
            for index, item in enumerate(releases)
            if index != draft_index
            and str(item.get("status") or "").casefold() not in {"completed", "draft"}
        ]
        updated_releases.append(promoted_release)
        saved = request(
            session, "PUT", track_url,
            payload={"track": EXPECTED_TRACK, "releases": updated_releases},
            purpose="Replacing the previous completed assignment with the requested newer Closed Test release",
        )
        if str(saved.get("track") or EXPECTED_TRACK) != EXPECTED_TRACK:
            fail("Google Play update returned an unexpected track.")
        request(session, "POST", f"{approval_edit}:commit", payload={}, purpose="Committing approval")
    finally:
        discard_edit(session, approval_edit)

    # Read the persisted release from a new edit after commit.
    readback_edit = open_edit(session, edits_url, "Opening fresh post-commit read-back")
    try:
        after = request(
            session, "GET", readback_edit + track_path,
            purpose="Reading persisted Closed Test track",
        )
        found = [item for item in (after.get("releases") or []) if expected in codes(item)]
        if len(found) != 1:
            fail(f"Post-commit read-back expected one release with {expected}, found {len(found)}.")
        actual_status = str(found[0].get("status") or "").casefold()
        if actual_status != "completed":
            fail(f"Post-commit read-back did not return completed for versionCode {expected}.")
        if codes(found[0]) != [expected]:
            fail(
                f"Post-commit read-back expected only versionCode [{expected}], "
                f"received {codes(found[0])}."
            )
        completed_after = [
            item for item in (after.get("releases") or [])
            if str(item.get("status") or "").casefold() == "completed"
        ]
        if len(completed_after) != 1 or codes(completed_after[0]) != [expected]:
            fail("Post-commit read-back did not show exactly one completed release for the requested code.")
        if any(
            prior_code in codes(item)
            for prior_code in prior_completed_codes
            for item in (after.get("releases") or [])
        ):
            fail("Post-commit read-back still contains a superseded completed versionCode on the target track.")
    finally:
        discard_edit(session, readback_edit)

    print(
        f"VERIFIED: versionCode {expected} is completed on {EXPECTED_TRACK}; "
        f"previous completed track versionCodes superseded={prior_completed_codes}."
    )
    print(f"Active completed release versionCodes={[expected]}. No AAB build/upload.")
    print("No other package or Play track accessed.")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"version_code={expected}\n")
            handle.write("release_status=completed\n")


if __name__ == "__main__":
    main()
