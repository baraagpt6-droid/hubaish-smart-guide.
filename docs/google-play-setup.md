# Google Play Closed Testing automation

This repository uses GitHub Actions, Google Cloud Workload Identity Federation (WIF), and Fastlane Supply. It stores no service-account JSON key. Publishing is manual and restricted to `main`; the workflow blocks the Production track.

## Workflow sequence

1. Runs `npm run build` and `node scripts/verify-build.mjs`.
2. Validates bilingual listing text; generates a 512x512 RGBA icon and 1024x500 RGB feature graphic.
3. Opens the actual application in Chromium and captures four phone screens in Arabic and English.
4. For a publishing run, authenticates using WIF and calculates the next version code from existing Play tracks.
5. Builds a signed Android App Bundle using the existing upload-keystore secrets.
6. Uploads the AAB, metadata, graphics and screenshots to Closed testing using Fastlane.

The dispatch default is `verify_only`. Select `publish_closed_testing` only when ready to upload. `PLAY_TRACK` defaults to the custom track name you supplied: `Hubaish Closed Test`. Google Play closed-testing tracks are created manually and use their custom track name as the API track identifier. The default here is the exact name you supplied, `Hubaish Closed Test`. If Play Console shows a different name, update `PLAY_TRACK` to that exact name. The workflow blocks `production` and `*:production`.

## 1. Google Cloud setup in a mobile browser

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select the Cloud project linked to the Play developer account. In Play Console, use **Settings → Developer account → API access** to identify the linked project and enable **Google Play Android Developer API**.
2. In Google Cloud, open **IAM & Admin → Workload Identity Federation** and tap **Create pool**.
3. Pool name and ID: `github-actions-hubaish`. Location: **Global**. Create it.
4. Open the pool and tap **Add provider**. Choose **OpenID Connect (OIDC)**. Provider name and ID: `github-hubaish-play`. Issuer URL: `https://token.actions.githubusercontent.com`. Keep the default audience.
5. Add these attribute mappings: `google.subject=assertion.sub`, `attribute.repository_id=assertion.repository_id`, `attribute.ref=assertion.ref`, `attribute.workflow_ref=assertion.workflow_ref`.
6. Add this attribute condition:
   ```
   assertion.repository_id == '1469488424' &&
   assertion.ref == 'refs/heads/main' &&
   assertion.workflow_ref == 'baraagpt6-droid/hubaish-smart-guide./.github/workflows/google-play-closed-testing.yml@refs/heads/main'
   ```
   It allows only this repository, main branch and publishing workflow.
7. Open **IAM & Admin → Service Accounts → Create service account**. Name it `hubaish-play-publisher`. Do not create a key.
8. Open the service account's **Permissions / Manage access → Grant access**. Add this WIF principal set, replacing `PROJECT_NUMBER` with your numeric Cloud project number:
   ```
   principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-hubaish/attribute.repository_id/1469488424
   ```
   Grant **Workload Identity User** (`roles/iam.workloadIdentityUser`).
9. Copy the service-account email and provider resource name:
   ```
   projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-hubaish/providers/github-hubaish-play
   ```

## 2. Grant Play Console permissions

1. Open [Google Play Console](https://play.google.com/console/) and select **Hubaish Smart Guide**.
2. Open **Users and permissions → Invite new users**.
3. Enter the service-account email from Google Cloud.
4. Choose **App permissions**, select only Hubaish Smart Guide, then enable these three permissions: **View app information (read-only)**, **Manage store presence**, and **Release apps to testing tracks**. These cover Play API reads, listing text/images and AAB releases to testing tracks. Do not enable **Release to production, exclude devices, and use Play App Signing**. Google documents the testing-track permission as unable to publish to Production.
5. Send the invitation and confirm the account is accepted. Cloud IAM alone does not grant Play Console access.

## 3. Add GitHub repository variables

On GitHub mobile, open [the repository](https://github.com/baraagpt6-droid/hubaish-smart-guide.) → **Settings**. If repository settings are not shown in the app, open GitHub in Chrome and choose **Request desktop site**.

Go to **Secrets and variables → Actions → Variables → New repository variable** and add:
- `PLAY_TRACK`: defaults in code to `Hubaish Closed Test`; set this only if the actual custom track name in Play Console differs.
- `GCP_PROJECT_ID`: Cloud project ID (not the numeric project number).
- `GCP_WIF_PROVIDER`: full provider resource name.
- `GCP_SERVICE_ACCOUNT`: service-account email.
- `PLAY_TRACK`: the exact custom closed-track name shown in Play Console. Defaults to `Hubaish Closed Test`.

Do not add a `PLAY_JSON_KEY` secret. WIF replaces the service-account key.

## 4. Confirm Android upload signing secrets

AAB updates must use the same upload certificate used for the first Play upload, unless Play App Signing's formal upload-key reset was completed.

Under **Settings → Secrets and variables → Actions → Secrets**, ensure these existing secrets are present and correct: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD`. These names match the existing Android workflow. Never commit the keystore or its passwords. If the first Play AAB used another keystore, stop and restore that upload key before publishing.

## 5. Run the workflow

PR #2 is stacked on `feat/hubaish-historical-schools-scope` so it contains only the Play automation changes. Merge PR #1 first. Then change PR #2's base branch to `main`, review its resulting diff, and merge it only after approval:

1. Open the repository on GitHub.
2. Tap **Actions → Google Play Closed Testing → Run workflow**.
3. Select branch `main`.
4. Run `verify_only` first. It builds the app, validates screenshots and uploads an Actions artifact without publishing.
5. When ready, run again and select `publish_closed_testing`.
6. Check the run and Play Console → **Testing → Closed testing**. Complete any Play review or tester rollout step shown there.

The workflow is manual only and is not triggered by PRs or branch pushes. It cannot publish to Production.

## Store listing paths

Text is stored under `fastlane/metadata/android/ar` and `fastlane/metadata/android/en-US`. PNG graphics and real Chromium phone screenshots are generated in each locale's `images/` folder immediately before upload. Screenshots are also included in the Actions artifact.

## Prerequisites

- The Play app must exist and have received its first AAB/APK before Supply can manage its listing.
- The service account must be accepted in Play Console.
- Play may still process or review an upload; a successful CI upload does not mean public approval.
- Native Android is generated each run with Capacitor 8 rather than committed to the repository.
