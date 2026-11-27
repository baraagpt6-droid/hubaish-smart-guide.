# Google Play Closed Testing automation

This repository deploys the Android app `com.hubaish.guide` to Google Play Closed testing from GitHub Actions. Every push to `main` runs a signed build and attempts a Closed-testing upload. A manual `workflow_dispatch` remains available for verification-only or publishing runs.

## Fixed Google Cloud identity

The workflow uses GitHub OIDC and Workload Identity Federation. It does not use a service-account JSON key.

- Google Cloud project ID: `dalilna-play-automation-516000`
- Workload Identity Provider: `projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- Service account: `dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com`
- GitHub repository ID: `1469488424`
- GitHub repository: `baraagpt6-droid/hubaish-smart-guide.`
- Allowed ref: `refs/heads/main`
- Workflow: `.github/workflows/google-play-closed-testing.yml`

The provider's attribute condition must permit this repository and this main-branch workflow. The Cloud IAM binding must grant `roles/iam.workloadIdentityUser` to the repository principal set for repository ID `1469488424`. The Play service account must have app-scoped access to package `com.hubaish.guide`.

## Repository configuration

Existing Android upload-signing secrets used by the main-branch Android release build:

- `KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

The workflow reuses this persistent JKS upload key. It validates the Base64 JKS header, password and alias with `keytool` before signing. Do not generate a replacement upload key when the existing Play App Signing upload key is available.

Optional repository variable:

- `PLAY_TRACK`: preferred custom Closed-testing track identifier. Defaults to `Hubaish Closed Test`.

Google Cloud project, provider and service-account identifiers are fixed in the workflow to avoid dependency on unverified repository variables.

## Track and version resolution

Before building, `scripts/resolve-play-release.py` opens a temporary Google Play edit and reads `edits.tracks.list` and `edits.bundles.list`.

- It prefers the exact `PLAY_TRACK` track.
- If that identifier is absent, it chooses the only named Closed-testing candidate, or the only Hubaish-named candidate when several exist.
- If no named custom track exists, it accepts legacy `alpha` or `beta` Closed-testing tracks. If no track exists, it uses the configured custom name for the Fastlane upload.
- It refuses Internal, Open, QA and Production tracks and refuses to guess when multiple candidates remain.
- It reads existing release states outside Internal testing. A prior reviewed Closed/Production release selects `completed`; otherwise the first upload is `draft`.
- It computes the next `versionCode` as one greater than the highest code found in all track releases and uploaded bundles.
- It uses release status `draft` when no prior reviewed release exists. Once a previously reviewed release is present, the status becomes `completed`.

The discovery edit is read-only and discarded. Fastlane creates and commits the upload edit after the signed AAB and listing assets pass validation. A post-upload API read-back confirms the selected track, versionCode and release status, and verifies Production versionCodes are unchanged.

## Workflow behavior

- A push to `main` automatically runs in `publish_closed_testing` mode.
- Manual workflow dispatch supports `verify_only` and `publish_closed_testing`.
- Verification-only builds a debug APK and does not authenticate or upload.
- Publishing authenticates using `google-github-actions/auth@v2`, builds a signed AAB, validates the bilingual listing and screenshots, then uploads the AAB, metadata, graphics and screenshots to the discovered Closed-testing track.
- Only the Closed-testing track is passed to Fastlane. Internal, beta/open, QA and Production targets are rejected.
- No workflow step publishes to the Google Play Production track.

## First review

For the initial app submission, the workflow uses a draft release if Google Play does not show any prior reviewed release. Google Play may still require the initial changes to be sent for review. If Play Console presents a first-submission review action that the API does not permit, that single review action remains a Play Console step. Later uploads use `completed` on the existing Closed-testing track.

## Store listing

Arabic and English listing text lives under `fastlane/metadata/android/ar` and `fastlane/metadata/android/en-US`. The workflow generates the feature graphic and real Chromium screenshots before upload and validates all eight phone screenshots.
