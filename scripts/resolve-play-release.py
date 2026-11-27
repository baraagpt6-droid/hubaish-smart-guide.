#!/usr/bin/env python3
"""Resolve Play closed-testing track and next versionCode through Android Publisher API.

The script reads track and bundle data in a temporary edit. If no Closed-testing
track exists, it creates the configured empty custom track and commits that
track definition only; it never uploads a bundle or touches Production.
"""
import json
import os
import re
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

PACKAGE = os.environ.get("PLAY_PACKAGE_NAME", "com.hubaish.guide").strip()
PREFERRED_TRACK = os.environ.get("PLAY_TRACK", "Hubaish Closed Test").strip()
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"
RESERVED_TRACKS = {"internal", "beta", "production", "qa", "closed", "open", "closed-testing", "open-testing"}
RELEASED_STATUSES = {"completed", "inProgress", "halted"}


def fail(message):
    raise SystemExit(message)


def validate_track_name(name):
    if not name or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_. -]{2,59}", name):
        fail("PLAY_TRACK is empty or has unsupported characters.")
    lowered = name.lower()
    if lowered in RESERVED_TRACKS or lowered.endswith((":production", ":beta", ":qa", ":internal")):
        fail(f"Refusing non-Closed track '{name}'. Internal, open/beta, QA and Production tracks are blocked.")
    if ":" in name:
        fail(f"Refusing form-factor track '{name}'. Only the default Android form factor is permitted.")


def main():
    if PACKAGE != "com.hubaish.guide":
        fail(f"Package lock failed: expected com.hubaish.guide, received {PACKAGE!r}.")
    validate_track_name(PREFERRED_TRACK)

    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(PACKAGE, safe="")
    edits_url = f"{API_ROOT}/applications/{app}/edits"

    created = session.post(edits_url, json={}, timeout=60)
    if not created.ok:
        fail(f"Google Play could not open a discovery edit ({created.status_code}): {created.text[:1200]}")
    edit_id = created.json().get("id")
    if not edit_id:
        fail("Google Play returned an edit without an ID.")

    def request(method, url, **kwargs):
        response = session.request(method, url, timeout=60, **kwargs)
        if not response.ok:
            fail(f"Google Play {method} request failed ({response.status_code}): {response.text[:1200]}")
        return response.json() if response.content else {}

    edit_base = f"{edits_url}/{quote(str(edit_id), safe='')}"
    tracks = request("GET", f"{edit_base}/tracks").get("tracks") or []
    track_names = sorted({str(row.get("track", "")).strip() for row in tracks if row.get("track")})
    tracks_by_name = {str(row.get("track", "")).strip(): row for row in tracks if row.get("track")}
    created_track = False
    create_track_later = False

    if PREFERRED_TRACK in tracks_by_name:
        selected_track = PREFERRED_TRACK
    else:
        custom_tracks = [
            name for name in track_names
            if name.lower() not in RESERVED_TRACKS
            and not name.lower().endswith((":production", ":beta", ":qa", ":internal"))
            and ":" not in name
        ]
        if len(custom_tracks) == 1:
            selected_track = custom_tracks[0]
            print(f"Preferred track '{PREFERRED_TRACK}' was not listed; using the only custom testing track '{selected_track}'.")
        elif len(custom_tracks) > 1:
            fail(
                f"More than one custom testing track exists and '{PREFERRED_TRACK}' does not. "
                f"Refusing to guess. Available tracks: {', '.join(track_names) or '(none)'}"
            )
        elif "alpha" in tracks_by_name:
            selected_track = "alpha"
            print("No named custom track exists; using the existing legacy closed-testing track 'alpha'.")
        else:
            selected_track = PREFERRED_TRACK
            create_track_later = True

    validate_track_name(selected_track)

    codes = []
    has_reviewed_release = False
    for track in tracks:
        for release in track.get("releases") or []:
            for value in release.get("versionCodes") or []:
                try:
                    code = int(value)
                except (TypeError, ValueError):
                    continue
                if code > 0:
                    codes.append(code)
            if str(release.get("status", "")) in RELEASED_STATUSES:
                has_reviewed_release = True

    bundles = request("GET", f"{edit_base}/bundles").get("bundles") or []
    for bundle in bundles:
        try:
            code = int(bundle.get("versionCode", 0))
        except (TypeError, ValueError):
            continue
        if code > 0:
            codes.append(code)

    version_code = max(codes, default=0) + 1
    if version_code <= 0 or version_code > 2_100_000_000:
        fail(f"Calculated versionCode {version_code} is outside Android's supported positive integer range.")

    if create_track_later:
        request(
            "POST",
            f"{edit_base}/tracks",
            json={"track": selected_track, "type": "CLOSED_TESTING", "formFactor": "DEFAULT"},
        )
        committed = session.post(f"{edits_url}/{quote(str(edit_id), safe='')}:commit", json={}, timeout=60)
        if not committed.ok:
            fail(f"Google Play could not create the Closed testing track '{selected_track}' ({committed.status_code}): {committed.text[:1200]}")
        created_track = True
        print(f"Created custom Closed testing track '{selected_track}' without uploading or releasing an app bundle.")

    release_status = "completed" if has_reviewed_release else "draft"
    version_name = open("release-version.txt", encoding="utf-8").read().strip()
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version_name):
        fail("release-version.txt must contain a semantic version in x.y.z format.")

    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"track={selected_track}\n")
        output.write(f"version_code={version_code}\n")
        output.write(f"version_name={version_name}\n")
        output.write(f"release_status={release_status}\n")
        output.write(f"has_reviewed_release={'true' if has_reviewed_release else 'false'}\n")

    print(json.dumps({
        "packageName": PACKAGE,
        "trackCreated": created_track,
        "availableTracksBeforeSelection": track_names,
        "selectedClosedTestingTrack": selected_track,
        "highestExistingVersionCode": max(codes, default=0),
        "nextVersionCode": version_code,
        "versionName": version_name,
        "releaseStatus": release_status,
        "reason": "A previously reviewed release exists." if has_reviewed_release else "No previously reviewed release exists; keep the first submission draft.",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
