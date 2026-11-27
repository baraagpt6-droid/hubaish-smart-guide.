# AGENTS.md — Hubaish Smart Guide

Read this file before changing the project. Keep it identical to PROJECT_MEMORY.md when durable project rules change.

## Identity and repository
- Repository: baraagpt6-droid/hubaish-smart-guide. (trailing period is part of repository name)
- Branch: main.
- App name: دليل حبيش الذكي / Hubaish Smart Guide.
- Android package: com.hubaish.guide.
- Architecture: Arabic-first offline-capable PWA with Capacitor Android/iOS shell. Main runtime files: www/app.js, www/catalog.js, www/features.js.

## Google Cloud authentication — WIF/OIDC only
- Project: dalilna-play-automation-516000.
- Provider: projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider.
- Service account: dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com.
- GitHub Actions authentication must use GitHub OIDC and Workload Identity Federation.
- Never create, store, upload, or use service-account JSON keys. Never put credentials in repository files, artifacts, logs, or GitHub Secrets.
- Owner reports all 13 available Google Play app permissions are granted to the service account. Verify the live grant if API permission errors occur.

## Google Play release policy
- Package: com.hubaish.guide.
- Approved Closed testing track: Hubaish Closed Test.
- Owner-confirmed last published/approved release: 1.0.401, versionCode 411.
- Owner-confirmed store assets: Arabic and English listing text, icon, feature graphic, and eight screenshots.
- Production is prohibited for automated workflows. Never upload to, modify, promote to, or release on production.
- Automated uploads may target only Hubaish Closed Test and must always use status draft.
- A push to main builds and uploads a draft preview only.
- Human approval is separate: workflow_dispatch with mode=approve_draft may promote exactly one existing draft on Hubaish Closed Test to completed. It must not upload another AAB.
- Approval fails closed if zero or multiple drafts exist.
- workflow_dispatch defaults to verify_only. preview_draft creates a draft. approve_draft is the only mode allowed to change draft to completed.
- Draft is not a published release. API commit is not proof Google review has completed.

## Mandatory Preview Before Publish
Every push to main (which runs in `preview_draft` mode) must:
1. Check out the exact main commit.
2. Install dependencies and run npm run build.
3. Generate app icons, Play listing graphics, and actual Arabic/English app screenshots.
4. Validate Arabic and English listing text and all screenshots.
5. Authenticate to Google Cloud with WIF/OIDC only.
6. Build both the signed AAB and signed Release APK from the same Android Release variant, using the existing upload-keystore secrets without exposing them.
7. Verify the APK signature and confirm its SHA-256 certificate fingerprint matches the certificate exported from the configured upload keystore.
8. Upload the AAB and bilingual listing assets to Hubaish Closed Test with status draft only.
9. Preserve the AAB, signed APK, and listing assets as a workflow artifact.
10. Publish the signed APK to GitHub Releases as a prerelease, using a version-and-commit-specific tag. Re-running the same commit/version updates the same prerelease and overwrites the identically named APK asset.
11. Put the direct APK download URL at the top of the Preview Report and the GitHub Actions job summary, followed by commit, version, track, AAB artifact, listing text, and generated image details.

The GitHub APK prerelease is a direct installation preview. It is not a Google Play publication or approval. The Google Play AAB remains draft-only. Never auto-convert a Play draft to completed. Never add production as a fallback.

## Release implementation
- Workflow: .github/workflows/google-play-closed-testing.yml.
- Version name: release-version.txt.
- Listing: fastlane/metadata/android/ (ar and en-US).
- Fastlane lane: android upload_closed_testing.
- Resolver: scripts/resolve-play-release.py.
- Manual draft approval: scripts/promote-play-draft.py.
- Fastlane default release status must be draft; CI must explicitly pass PLAY_RELEASE_STATUS=draft.
- Version codes must exceed every existing Play version code. Never reuse a code.
- Block reserved tracks internal, beta, production, qa, open, and form-factor tracks.
- Validate workflow YAML and Python scripts before release changes.

## Signed Release APK preview in GitHub Releases
- The workflow runs both `bundleRelease` and `assembleRelease` for `preview_draft` using the same `hubaishPlayRelease` signing configuration and existing `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD` secrets.
- The APK is signature-verified with Android `apksigner`. CI compares its signer certificate SHA-256 fingerprint with the certificate exported from the configured upload keystore and fails closed on mismatch.
- APK filename: `Hubaish-Smart-Guide-v<version>-<12-character-commit>-release.apk`.
- GitHub Release tag: `preview-v<version>-<full-commit-SHA>`. The release name includes the version and short commit SHA.
- GitHub Releases must mark this item as `prerelease: true`; `overwrite_files: true` makes a rerun of the same version/commit replace the existing asset instead of failing on duplicate asset names.
- The APK publishing job alone receives `contents: write` and `actions: read`. The Google Play build/publish job retains its existing read-only Contents permission and WIF `id-token: write` permission.
- The Preview Report and GitHub Actions job summary show the actual `browser_download_url` returned by GitHub for the uploaded APK, near the top of the report.
- This GitHub prerelease does not change the Google Play gate. The AAB upload remains `draft` on `Hubaish Closed Test`; only the separate manual `approve_draft` mode may promote exactly one existing draft. The APK job does not run for `verify_only` or `approve_draft`.

## App architecture and capabilities
- Stack: HTML/CSS/JavaScript PWA plus Capacitor 8.6.2 shell.
- Offline-first Service Worker, offline cache, and local JSON fallback.
- Languages: Arabic, English, Turkish, French, with text direction and locally saved preference.
- README describes 19 landmarks, 22 sub-districts, 7 historical stations, 4 historical figures, 4 references, and a 10-question quiz.
- Features include search, filters, detail pages, favorites, local assistant, and estimated prayer times.
- Shared content CMS: www/data/live-content.json through GitHub Contents API. Public visitors read without authentication; admin publishing uses Cloudflare Worker.
- Preserve historical/geographic scope. Suhban must not be moved into the current 22 Hubaish sub-districts. Do not present unverified locations as facts. Follow README provenance rules.

## Connected services
- Cloudflare Worker CMS URL documented in README: https://hubaish-cms.baraagpt6.workers.dev (verify exact live configuration before changing).
- GitHub Pages hosts public web/store content.
- GitHub Releases distributes signed Android artifacts when signing secrets exist.
- Keep Worker and Android signing secrets outside the repository. Never print their values.
- Do not rotate secrets, delete production resources, or change service bindings without an explicit change plan.

## Engineering
- Node.js 22+.
- Install: npm install. Verify: npm run build. Preview: npm run preview.
- Capacitor sync: npx cap sync android.
- Android native project is generated by CI.
- Read README, relevant scripts, and workflows before architectural changes. Preserve IDs and factual scope.
- Never claim a workflow passed unless its actual Actions result was inspected. Never claim Play approval, public release, or Cloudflare deployment unless verified.

## Durable change log
- 2026-11-27: Owner confirmed WIF/OIDC, Closed testing track, service-account permissions, and last approved release 1.0.401 (411).
- 2026-11-27: Draft-only preview and separate manual approval gate established. Older push automation uploading completed is unsafe and must be corrected.
