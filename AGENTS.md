# AGENTS.md — Hubaish Smart Guide

Read this file before changing the repository. Keep its durable release rules aligned with PROJECT_MEMORY.md. Update both files when project identity, the security model, or release policy changes.

## Repository identity
- Exact repository: baraagpt6-droid/hubaish-smart-guide. The final period is part of the GitHub repository name.
- Active branch: main.
- App: دليل حبيش / Hubaish Smart Guide.
- Android package: com.hubaish.guide.
- Repository ID: 1469488424.
- Architecture: Arabic-first offline-capable PWA with a Capacitor 8.6.2 Android shell. Web sources are under www/; Android is generated and synchronized by CI.
- Main app files: www/app.js, www/catalog.js, www/features.js, www/github-cms.js.

## Google Cloud authentication — fixed WIF/OIDC configuration
Use GitHub OIDC with Workload Identity Federation only. Do not use a service-account JSON key.

- Google Cloud project ID: dalilna-play-automation-516000.
- Workload Identity Pool: projects/28058491662/locations/global/workloadIdentityPools/github-pool.
- Workload Identity Provider resource: projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider.
- Service account: dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com.
- Required API scope: https://www.googleapis.com/auth/androidpublisher.
- GitHub Actions permissions: contents: read and id-token: write.
- Allowed repository identity: baraagpt6-droid/hubaish-smart-guide. (repository ID 1469488424).
- Publishing ref: refs/heads/main only.
- Provider trust and IAM impersonation must remain restricted to this repository and main. Do not broaden trust to other repositories, branches, forks, or untrusted pull requests.
- The service account needs app-scoped Google Play access to com.hubaish.guide. The owner reported that the 13 available Play Console permissions were granted; re-check the live grant if Google Play API authorization fails.
- The WIF principal needs permission to impersonate this service account through roles/iam.workloadIdentityUser.

Never create or store service-account private keys. Never place credentials or private key material in source files, artifacts, logs, or documentation.

## Android signing
The workflow reuses the existing Play upload JKS. These GitHub Actions secrets must exist; document names only, never values:
- KEYSTORE_BASE64
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD

Do not generate or rotate an upload key without an explicit migration plan. Validate the keystore, password, alias, and AAB certificate fingerprint before uploading.

## Google Play policy — Hubaish only
- Package: com.hubaish.guide.
- The only permitted Google Play track is exactly Hubaish Closed Test.
- PLAY_TRACK is pinned in the workflow. Do not replace it with a repository variable or add a fallback to alpha, beta, internal, open, QA, form-factor, or Production tracks.
- Every push to main automatically runs the preview_draft mode.
- Every automatic AAB upload must use release status draft, regardless of prior reviewed releases.
- A draft is a preview and is not the same as a published or tester-available release.
- workflow_dispatch choices are verify_only, preview_draft, and publish_approved_release. The default is verify_only.
- publish_approved_release is an explicit human action. It promotes exactly one existing draft on Hubaish Closed Test to completed; it does not build or upload another AAB.
- Manual promotion must fail closed if there are zero or multiple drafts, if the draft has no versionCodes, or if package/track identity differs from this project.
- Fastlane's automated upload lane must reject every release status other than draft.
- Production is prohibited. No workflow, Fastlane lane, or helper may upload to, promote, modify, or publish on Production. A read-only Production versionCode snapshot is permitted only to prove that a Closed-testing upload did not alter Production.
- Never infer Google Play review completion from a successful GitHub Actions run or API commit. Report the state returned by Google Play.

## Release workflow and implementation
- Main workflow: .github/workflows/google-play-closed-testing.yml.
- Version name source: release-version.txt.
- Listing source: fastlane/metadata/android/ with ar and en-US locale folders.
- Upload lane: android upload_closed_testing in fastlane/Fastfile.
- Track/version resolver: scripts/resolve-play-release.py.
- Manual approval script: scripts/promote-play-draft.py.
- Build/static verifier: scripts/verify-build.mjs.
- Inspect these files together before changing release logic.
- Resolver must find the exact Hubaish Closed Test track or fail. It must never silently fall back to another track.
- Next versionCode must be greater than every existing Play release/bundle versionCode. Never reuse a code.
- Build and sign an Android App Bundle (AAB) for preview_draft. Upload AAB, bilingual listing text, graphics, and screenshots with status draft.
- Workflow generates and validates Arabic and English Play listing assets and eight phone screenshots.
- verify_only does not authenticate to Google Cloud or upload to Google Play; it produces a debug APK validation artifact.
- The Google Play workflow does not build or publish a signed Release APK or GitHub APK prerelease.
- After each draft upload, read the track back from Google Play, verify expected versionCode and draft status, and prove Production versionCodes are unchanged.
- Validate YAML, Python, Ruby, JavaScript syntax and static release-policy checks before finalizing changes.

## Application boundaries and factual integrity
- The app is a local guide to Hubaish, Yemen. Preserve its historical and geographic scope.
- The project has 22 current Hubaish sub-districts. Suhban is a related historical region and must not be inserted into the current 22 sub-district list.
- Do not present unverified locations, historical claims, sources, images, or attribution details as facts.
- Preserve provenance rules in README.md and app data.
- App features include place search and filters, detail pages, favorites, a local assistant, itinerary tools, language selection, offline support, and estimated prayer times. Verify source before claiming any feature has shipped.
- UI languages currently include Arabic, English, Turkish, and French.

## Connected services and credentials
- Cloudflare Worker CMS endpoint documented by the project: https://hubaish-cms.baraag6.workers.dev. Verify live configuration before changing it.
- GitHub Pages serves the public web app.
- Do not expose Cloudflare credentials, administrator passwords, GitHub tokens, or Android signing secrets.
- Keep service bindings aligned with cloudflare-worker/wrangler.toml and deployment workflows.
- Documentation-only changes to AGENTS.md and PROJECT_MEMORY.md must not trigger Pages or Cloudflare deployment.

## Engineering rules
- Node.js 22 or later.
- Install dependencies with npm install; build and verify with npm run build.
- Capacitor sync uses npx cap sync android.
- Native Android project is generated by CI; do not commit generated signing material.
- Do not claim build, upload, Play review, or production deployment succeeded without checking the actual workflow/API result.
- Never force-push or overwrite a branch ref to resolve a conflict. Inspect and reconcile first.

## Durable release checklist
1. Confirm exact repository, main branch, package, WIF provider, service account, and Hubaish Closed Test track.
2. Validate source build, bilingual assets, and screenshots.
3. Resolve a never-before-used versionCode from Google Play.
4. Sign the AAB with the existing upload key.
5. Upload only as draft.
6. Read back the draft and confirm Production is unchanged.
7. Leave publication to the separate publish_approved_release manual action.

## Play status monitor and runtime audit
- Read-only monitor workflow: .github/workflows/play-status-monitor.yml.
- Monitor entry point: scripts/monitor-play-status.py.
- Run it manually with workflow_dispatch or automatically every day at 09:00 Asia/Kuala_Lumpur (01:00 UTC), and after each Google Play Closed Testing workflow run completes.
- Monitor uses the same fixed WIF provider/service account and Android Publisher scope. It must remain read-only: open a temporary Play edit, GET tracks/bundles only, then discard that temporary edit. It must never PUT a track, commit a release, or promote a draft.
- Report package com.hubaish.guide, exact track Hubaish Closed Test, versionCodes 413 and 414, active version, draft count, alternate testing tracks containing version codes, and Production status. It must call out that Edits.tracks does not expose a separate policy-review queue state or tester email list.
- Runtime quality check: scripts/audit-runtime.mjs. It verifies mobile/tablet overflow, language/navigation, Service Worker activation, cache contents, offline home rendering, browser errors, and read-only Cloudflare /health and /setup/status checks.
- The Google Play preview workflow runs the runtime audit before generating/uploading its AAB. A failed app/UI/offline test must block the draft upload.
- Do not change or remove release 413 as part of monitoring or runtime audit. Never modify Production.
- Any app-store listing or rollout change that could affect an active review must wait until the current release status has been checked; do not claim review completion from a track status alone.

## Build reliability and live monitor findings
- Gradle may retry up to four times only when Maven Central returns HTTP 429. The retry delay is bounded (20s, 40s, 60s). Every other Gradle failure exits immediately; after the last 429, the build fails and no AAB is uploaded.
- On 2026-11-27T16:10:27Z, the read-only Play monitor returned 413 completed and 414 draft on Hubaish Closed Test, exactly one draft on that track, no alternate track version codes, and no Production version codes. It also found an empty draft record on the separate legacy Closed testing track without a versionCode; do not mutate that track automatically.
- The same runtime audit passed UI, layout, Service Worker/cache and offline checks, but the GitHub runner could not reach the Worker /health and /setup/status endpoints (fetch failed). Treat Worker connectivity as unverified until a successful live health run confirms it.
