# Google Play Closed Testing automation — Hubaish Guide

This guide applies only to repository baraagpt6-droid/hubaish-smart-guide. and Android package com.hubaish.guide. Every push to main creates a draft preview on the exact Hubaish Closed Test track. Publishing that draft requires a separate manual workflow action.

## Fixed Google Cloud identity

The workflow uses GitHub OIDC and Workload Identity Federation. It must not use a service-account JSON key.

- Google Cloud project ID: dalilna-play-automation-516000.
- Workload Identity Pool: projects/28058491662/locations/global/workloadIdentityPools/github-pool.
- Workload Identity Provider: projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider.
- Service account: dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com.
- Google Play API scope: https://www.googleapis.com/auth/androidpublisher.
- GitHub repository: baraagpt6-droid/hubaish-smart-guide.
- GitHub repository ID: 1469488424.
- Allowed branch/ref: main / refs/heads/main.
- Workflow: .github/workflows/google-play-closed-testing.yml.
- GitHub Actions permissions: contents: read and id-token: write.

The provider trust condition and service-account impersonation binding must be restricted to this exact repository and main branch. The expected impersonation role is roles/iam.workloadIdentityUser. The service account must have app-scoped Google Play access for com.hubaish.guide. The owner reported that all 13 available app permissions were granted.

## Android signing secrets

The workflow reuses the existing JKS upload key. These GitHub Actions secrets must be configured:
- KEYSTORE_BASE64
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD

Only the secret names are documented. Never print, commit, or expose their values. The workflow validates the JKS, password and alias, signs the AAB, and compares the AAB signer fingerprint with the existing upload certificate.

## Fixed release target and version allocation

- Application ID: com.hubaish.guide.
- The only allowed track: Hubaish Closed Test.
- The workflow pins PLAY_TRACK to this exact value; a repository variable cannot redirect the upload.
- No fallback to alpha, beta, internal, open, QA, form-factor, or Production tracks.
- The resolver reads Play track releases and uploaded bundles, then calculates max(existing versionCode) + 1.
- Version name comes from release-version.txt.
- If the exact Hubaish Closed Test track is absent, the run fails instead of selecting another track.
- Production versionCodes are read before and after an upload only to verify that Production did not change.

## Automatic draft preview on push

Every push to main triggers the Play workflow in preview_draft mode. This includes pushes that only update documentation or workflow files. The job:
1. Checks out main and builds with Node.js 22.
2. Installs dependencies and runs npm run build.
3. Generates app icons, bilingual Play listing graphics, Arabic/English screenshots, and validates all eight phone screenshots.
4. Authenticates to Google Cloud using GitHub OIDC/WIF.
5. Resolves the next unused Play versionCode from Google Play.
6. Builds and signs the Android App Bundle with the existing upload JKS.
7. Uploads the AAB, listing metadata, images and screenshots to Hubaish Closed Test with release status draft.
8. Reads the committed release back from Google Play and verifies exact track, versionCode and draft status.
9. Verifies Production versionCodes are unchanged.

Fastlane's automated upload lane rejects every release status other than draft. The resolver always emits draft even when a previous reviewed release exists. A successful draft API commit is not an approval or public release.

## Manual workflow actions

workflow_dispatch offers three choices and defaults to verify_only:
- verify_only: build validation and a debug APK artifact. No Google Cloud authentication or Play upload.
- preview_draft: manually request another draft preview using the same draft-only upload path.
- publish_approved_release: explicitly promote one existing draft to completed on Hubaish Closed Test. It does not build or upload a new AAB.

The manual publication script requires exactly one draft with versionCodes. If no draft exists or more than one draft exists, it stops without making changes. It is pinned to the Hubaish package and exact Hubaish Closed Test track. It never targets Production.

A completed release state in the Play API remains subject to Google's review and rollout processing. A GitHub Actions success must not be described as Google approval unless the Play Console/API state confirms it.

## Workflow protection

- Workflow runs only when github.ref equals refs/heads/main.
- Authentication uses google-github-actions/auth@v2.
- The Play job uses contents: read and id-token: write.
- No workflow step uploads, promotes, or modifies the Production track.
- Draft uploads are read back from Google Play before the job can succeed.
- The resolver and manual promoter reject every track except Hubaish Closed Test.
- Pages and Cloudflare workflows ignore changes limited to this guide, AGENTS.md, PROJECT_MEMORY.md, and Play automation files.

## Listing assets

Arabic metadata is under fastlane/metadata/android/ar and English metadata is under fastlane/metadata/android/en-US. The workflow generates the feature graphic and captures actual app screens through Chromium before uploading. Eight phone screenshots are validated before any AAB upload.

## Daily Google Play status monitor

.github/workflows/play-status-monitor.yml uses the same fixed GitHub OIDC/WIF configuration as the release workflow. It runs:
- Manually via workflow_dispatch.
- Daily at 01:00 UTC (09:00 in Malaysia, Asia/Kuala_Lumpur).
- After every completed Google Play Closed Testing workflow run on main.

scripts/monitor-play-status.py reads the com.hubaish.guide app and exact Hubaish Closed Test track. It reports versionCode 413, versionCode 414, the current active code, draft count, alternate tracks that contain release version codes, Production version codes/statuses, and the standard tester opt-in/store URL formats. It writes an Arabic GitHub Actions Step Summary and a machine-readable JSON artifact.

The monitor is read-only with respect to releases. It opens a temporary Google Play edit, reads tracks and uploaded bundles, and discards the inspection edit. It never updates a track, commits an edit, or promotes a release. A track status is not a separate policy-review queue state; the Android Publisher Edits.tracks response does not provide the tester email list either. Do not claim that testers can install until the app-level publication status and closed-test tester eligibility are confirmed in Play Console.

## Runtime quality audit

scripts/audit-runtime.mjs is executed by the preview workflow after Chromium is installed and before the AAB is built. It checks app navigation, Arabic/English language switching, widths 360/390/768/1024, Service Worker activation, cached shell contents, offline home rendering, browser errors, and Cloudflare Worker /health and /setup/status. Worker checks are reported separately so a Worker outage does not erase the local/offline fallback result. The Worker health endpoint uses only a short-lived KV self-test key which is deleted immediately.

Do not modify release 413 or Production as part of monitoring. Do not automatically promote any draft.

## Build rate limits and last live status snapshot

The Android bundle step retries up to four times only for Maven Central HTTP 429 responses (20s, 40s, and 60s backoff). Other Gradle errors fail immediately. If all retries are rate-limited, the job exits before upload.

Read-only Google Play Status Monitor run 46031294660 (2026-11-27 16:10:27 UTC) read:
- Hubaish Closed Test versionCode 413: completed; versionName 1.0.401.
- Hubaish Closed Test versionCode 414: draft; versionName 1.0.401.
- One draft exists on Hubaish Closed Test.
- No version codes on alternative tracks. A separate legacy Closed testing track had a draft with no versionCode; it was not modified.
- Production had no versionCodes.
- Edits.tracks does not provide a distinct policy-review queue state or tester email allow-list.
