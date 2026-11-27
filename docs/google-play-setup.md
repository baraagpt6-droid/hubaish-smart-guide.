# Google Play Closed Testing automation

The repository is configured for GitHub Actions, Google Cloud Workload Identity Federation (WIF) and Fastlane. Publishing is manual, restricted to `main`, and locked to application ID `com.hubaish.guide`. The workflow accepts a custom Closed testing track only; internal, open and Production tracks are rejected.

## Configuration contract

Required repository variables:

- `GCP_PROJECT_ID`: Google Cloud project ID.
- `GCP_WIF_PROVIDER`: full Workload Identity Provider resource name.
- `GCP_SERVICE_ACCOUNT`: service-account email.

Optional repository variable:

- `PLAY_TRACK`: exact custom Closed testing track name shown in Play Console. Defaults to `Hubaish Closed Test`. Set it only when the actual track name differs.

Existing Android upload-signing secrets:

- `KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

No service-account JSON key is used. Do not add `PLAY_JSON_KEY`; WIF creates a short-lived external-account credential file during publishing.

## Trust boundary

The Google Cloud OIDC provider must allow only:

- Repository ID `1469488424`.
- Ref `refs/heads/main`.
- Workflow `baraagpt6-droid/hubaish-smart-guide./.github/workflows/google-play-closed-testing.yml@refs/heads/main`.

The publishing job uses `id-token: write` only for a manual main-branch run. The validation workflow has `contents: read` only, does not authenticate to Google Cloud and cannot upload.

The Play service account needs app-scoped read access, store presence management and release to testing tracks. It must not receive Production release permission. Cloud IAM trust and Play Console app permission are separate checks.

## Run sequence

1. Review and merge the development PRs to `main` only when you decide.
2. Run **Actions → Google Play Closed Testing → Run workflow** on `main`.
3. Select `verify_only` first. It builds and validates without uploading.
4. Only after that succeeds, select `publish_closed_testing` to upload the signed AAB and bilingual listing to the custom Closed testing track.
5. Complete any tester rollout or Play review step shown in Play Console.

The workflow does not run on pull requests or branch pushes. It cannot publish to Production. A successful upload to Closed testing is not a public Production release.

## Store listing

Text is stored in `fastlane/metadata/android/ar` and `fastlane/metadata/android/en-US`. The workflow generates store graphics and actual Chromium phone screenshots before upload. The CI-only validation AAB uses a temporary signing key and must never be uploaded to Play.
