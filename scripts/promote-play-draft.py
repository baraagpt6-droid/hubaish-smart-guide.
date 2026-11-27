#!/usr/bin/env python3
"""Promote exactly one existing Closed-testing draft after explicit manual dispatch. Legacy alpha/beta tracks are allowed."""
import os
import re
from urllib.parse import quote
import google.auth
from google.auth.transport.requests import AuthorizedSession

PACKAGE = os.environ.get("PLAY_PACKAGE_NAME", "").strip()
TRACK = os.environ.get("PLAY_TRACK", "Hubaish Closed Test").strip()
EXPECTED_PACKAGE = "com.hubaish.guide"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3"
RESERVED = {"internal", "beta", "production", "qa", "closed", "open", "closed-testing", "open-testing"}

def fail(message):
    raise SystemExit(message)

def main():
    if PACKAGE != EXPECTED_PACKAGE:
        fail(f"Package lock failed: expected {EXPECTED_PACKAGE}.")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_. -]{2,59}", TRACK):
        fail("Invalid Closed testing track name.")
    if TRACK.lower() in RESERVED or ":" in TRACK or TRACK.lower().endswith((":production", ":qa", ":internal", ":open")):
        fail("Refusing reserved, Production, internal, open, or form-factor track.")
    credentials, _ = google.auth.default(scopes=[SCOPE])
    session = AuthorizedSession(credentials)
    app = quote(PACKAGE, safe="")
    edits = f"{API_ROOT}/applications/{app}/edits"
    created = session.post(edits, json={}, timeout=60)
    if not created.ok:
        fail(f"Could not open Play edit ({created.status_code}): {created.text[:1000]}")
    edit_id = created.json().get("id")
    if not edit_id:
        fail("Google Play returned no edit ID.")
    base = f"{edits}/{quote(str(edit_id), safe='')}"
    track_url = f"{base}/tracks/{quote(TRACK, safe='')}"
    response = session.get(track_url, timeout=60)
    if not response.ok:
        fail(f"Could not read Closed testing track ({response.status_code}): {response.text[:1000]}")
    data = response.json()
    releases = data.get("releases") or []
    drafts = [release for release in releases if str(release.get("status", "")).lower() == "draft"]
    if len(drafts) != 1:
        fail(f"Expected exactly one draft on '{TRACK}', found {len(drafts)}. No changes made.")
    draft = drafts[0]
    if not draft.get("versionCodes"):
        fail("Draft has no versionCodes. No changes made.")
    draft["status"] = "completed"
    saved = session.put(track_url, json={"track": TRACK, "releases": releases}, timeout=60)
    if not saved.ok:
        fail(f"Could not update draft ({saved.status_code}): {saved.text[:1000]}")
    committed = session.post(f"{base}:commit", json={}, timeout=60)
    if not committed.ok:
        fail(f"Could not commit manual approval ({committed.status_code}): {committed.text[:1000]}")
    print(f"Manually approved Closed testing draft on {TRACK}; versionCodes={','.join(map(str, draft['versionCodes']))}.")
    print("No AAB was uploaded. Production was not accessed.")

if __name__ == "__main__":
    main()
