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
- Every push to main defaults to preview_draft.
- The legacy root markers `.promote-416`, `.promote-416-retry` and `.promote-416-final` are one-shot approval-only paths for the exact existing 416 draft. They skip app build, screenshots, signing, AAB creation, artifacts and upload.
- The root marker `.publish-418` is a separately authorized, one-shot exception for the 28 November 2026 clean 418 release only. It must be newly added by the push (absent from its parent commit) and contain exactly `418`. It runs the complete source build, Playwright runtime audit, listing/screenshots validation, Android sync, signed Gradle `bundleRelease`, then retires only the exact obsolete 417 draft, uploads 418 as draft and promotes that exact draft to completed on `Hubaish Closed Test`.
- The 418 path is fail-closed: the resolver must find exactly one 417 draft and calculate 418; the retirement helper must find exactly 417 draft plus 416 completed, require Production to be empty, and verify 416 remains active after the draft removal. After the upload, the promoter requires exactly one 418 draft and replaces the previous completed track assignment; final API read-back must show exactly one completed 418 and zero versioned drafts. Any unexpected release code, status, track, package, repository or Production state aborts the operation.
- The `.publish-418` path must never read or modify `edits.testers`, the tester list, opt-in configuration, other testing tracks, or Production. The marker is consumed by parent-commit comparison; existing markers do not affect future pushes, which return to preview_draft.
- The attempted 419 verify-only build on 28 November 2026 failed before producing an AAB because Maven Central returned HTTP 429 after four bounded Gradle retries. It did not authenticate to or write Google Play; the latest read-only monitor still showed 418 completed, zero versioned drafts on Hubaish Closed Test, highestSeenVersionCode 418, and Production empty.
- The root marker `.publish-420` is the separately owner-authorized one-shot build-and-publish path for Hubaish 1.0.403 only. It must be newly added by the push (absent from its parent commit) and contain exactly `420`. The workflow builds/tests the current source, signs versionCode 420 with the existing Play upload key, uploads it as a draft, promotes it to completed on the existing `Hubaish Closed Test` track, and verifies the committed release with a fresh API read-back.
- The 420 path is fail-closed: the resolver requires exactly one completed `418` on the target track, zero versioned drafts, no in-progress rollout, empty Production, highest uploaded bundle/versionCode exactly 418, and unused target code 420. It deliberately skips 419 because the attempted 419 job failed before AAB creation. The promoter requires exactly one 420 draft and may replace only the existing completed 418; final read-back must show exactly one completed 420, zero versioned drafts, and unchanged empty Production. It does not retire 417 again.
- The `.publish-420` path must never read or modify `edits.testers`, tester lists, opt-in configuration, other testing tracks, or Production. It only replaces the release assignment on the same existing Hubaish Closed Test track. Parent-commit comparison makes the marker single-use; ordinary later pushes return to `preview_draft`.
- workflow_dispatch defaults to verify_only and supports an explicit expected_version_code for promotion.
- Promotion requires exactly one target-track draft whose complete versionCodes list equals the explicit expected code. It fails closed on draft count, duplicate code, package, repository, ref or track mismatch.
- Google permits one completed release per track. Promotion replaces the previous completed track assignment with the requested newer versionCode as the single completed release. The older bundle remains in Play's uploaded-bundle history, but its lower code is no longer assigned to the active target track. The promoter verifies the exact state after commit and never builds or uploads an AAB.
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
- One-shot old-draft retirement helper: scripts/retire-obsolete-play-draft.py. It removes only versionCode 417 from the exact target track after a signed 418 AAB has passed all app tests; it never touches tester settings or Production.
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
- Public geography is restricted to Hubaish District, Ibb Governorate. Do not retain comparison entries, historical administrative units, biographies, families, or landmarks from outside the district. Unknown locality must remain unpublished or explicitly unverified.
- The project has 22 current Hubaish sub-districts. Suhban is a related historical region and must not be inserted into the current 22 sub-district list.
- Do not present unverified locations, historical claims, sources, images, or attribution details as facts.
- The 22-name list from the 27 November 2026 project report is a reference list pending district-administration confirmation, not a certified administrative instrument.
- Heritage knowledge lives in www/data/heritage-knowledge.json and is rendered by www/knowledge.js. The Marwaha wood-inscription image must remain branded and opened through the watermarked viewer; never add a public raw-image link.
- Community author, family/CV, archive, and marketplace submissions are private Cloudflare KV moderation records. Public output includes approved records only. Super-admin review is required. Preserve owner/investigator attribution and explicit publishing consent.
- Worker request bodies use a bounded streaming JSON reader: 16 KiB for ordinary/auth/admin requests, 480 KB for community submissions, and 700 KB for published content. Reject invalid content types, malformed UTF-8/JSON, and over-limit bodies before KV writes.
- Bootstrap failures are rate-limited per hashed source IP (6 per 15 minutes); login failures are limited per hashed IP/username (8) and per hashed IP (30) in a 15-minute window. These KV counters are best-effort under concurrent requests because KV is eventually consistent; do not describe them as strict edge-level rate limits.
- Worker 5xx responses must not reveal internal exception messages. Keep public submission state pending and require authenticated super_admin approval for publish/reject actions.
- Production Worker CORS allowlist is limited to the GitHub Pages origin and Capacitor app origin. Never add loopback or local preview origins to production CORS; proxy read-only Worker checks through the Node Playwright harness instead.
- Every `/review/*` route, including visitor-photo review, is super_admin-only. Public community submissions are capped at 6 per 24 hours per hashed source IP using KV; because KV is eventually consistent, this remains a best-effort limit rather than an atomic global rate limiter.
- The generated Android Gradle files must place the Google Cloud Storage Maven Central mirror before every `mavenCentral()` declaration for Play AAB builds, retaining Maven Central as fallback. Apply this in `scripts/prepare-android-release.py` because native Gradle files are generated in CI.
- Preserve provenance rules in README.md and app data.
- App features include place search and filters, detail pages, favorites, a local assistant, itinerary tools, language selection, offline support, and estimated prayer times. Verify source before claiming any feature has shipped.
- UI languages currently include Arabic, English, Turkish, and French.

## Connected services and credentials
- Cloudflare Worker CMS endpoint documented by the project: https://hubaish-cms.baraagpt6.workers.dev. Verify live configuration before changing it.
- Resolve the active account subdomain and script route using `scripts/resolve-cloudflare-worker-url.mjs`; it reads Cloudflare API state, enables the named workers.dev route when disabled, and rejects any mismatch with the app and runtime-audit URL. Never infer the account subdomain from the Worker name.
- GitHub Pages serves the public web app.
- Do not expose Cloudflare credentials, administrator passwords, GitHub tokens, or Android signing secrets.
- Keep service bindings aligned with cloudflare-worker/wrangler.toml and deployment workflows.
- After Worker code changes, verify both `/health` and `/setup/status`; a passing health response must include KV, GitHub content-read, and session-secret checks.
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
7. Leave ordinary draft publication to the separate publish_approved_release manual action. A one-shot exception requires a newly-added, exact-code marker and an explicit owner authorization; never generalize it to future pushes.

## Play status monitor and runtime audit
- Read-only monitor workflow: .github/workflows/play-status-monitor.yml.
- Monitor entry point: scripts/monitor-play-status.py.
- Run it manually with workflow_dispatch or automatically every day at 09:00 Asia/Kuala_Lumpur (01:00 UTC), and after each Google Play Closed Testing workflow run completes.
- Monitor uses the same fixed WIF provider/service account and Android Publisher scope. It must remain read-only: open a temporary Play edit, GET tracks/bundles only, then discard that temporary edit. It must never PUT a track, commit a release, or promote a draft.
- Report package com.hubaish.guide, exact track Hubaish Closed Test, latest active release, latest draft, draft count, alternate testing tracks containing version codes, and read-only Production status. Derive latest records dynamically from versionCodes; do not hardcode historical codes. Preserve the Edits.tracks review-queue and tester-list limitation.
- Runtime quality check: scripts/audit-runtime.mjs. It verifies mobile/tablet overflow, language/navigation, Service Worker activation, cache contents, offline home rendering, browser errors, and read-only Cloudflare /health and /setup/status checks.
- The Google Play preview workflow runs the runtime audit before generating/uploading its AAB. A failed app/UI/offline test must block the draft upload.
- Monitoring is read-only and must not alter releases. Never modify Production.
- Any app-store listing or rollout change that could affect an active review must wait until the current release status has been checked; do not claim review completion from a track status alone.

## Build reliability and live monitor findings
- Gradle may retry up to four times only when Maven Central returns HTTP 429. The retry delay is bounded (20s, 40s, 60s). Every other Gradle failure exits immediately; after the last 429, the build fails and no AAB is uploaded.
- On 2026-11-27T16:10:27Z, the read-only Play monitor returned 413 completed and 414 draft on Hubaish Closed Test, exactly one draft on that track, no alternate track version codes, and no Production version codes. It also found an empty draft record on the separate legacy Closed testing track without a versionCode; do not mutate that track automatically.
- The same runtime audit passed UI, layout, Service Worker/cache and offline checks, but the GitHub runner could not reach the Worker /health and /setup/status endpoints (fetch failed). Treat Worker connectivity as unverified until a successful live health run confirms it.


## Standing owner-submitted source integration rule
- When the owner supplies a photograph, scanned document, biography, family record, or heritage fact in a future conversation for this project, treat it as project intake without requiring the owner to repeat the instruction. Inspect the source, preserve provenance, source/owner attribution and evidence level, and prepare the relevant project data, knowledge index, gallery, archive, search and local-assistant updates within Hubaish District, Ibb Governorate only.
- Automatic intake does not authorize public disclosure. Require explicit publication rights and relevant consent for photographs, documents, biographies and family records. Keep family/personal data private until consent is clear; mark uncertain facts and locations as unverified and exclude out-of-district material.

## Live content and native Android speech
- Cloudflare Worker provides public `GET /api/live-content` backed by KV key `live-content:published`. Successful content writes update the GitHub source and KV snapshot. The client polls every 15 seconds while visible, persists its last snapshot in localStorage, and retains static/offline fallbacks. Cloudflare KV replication is eventually consistent; describe the pipeline as near-real-time, not simultaneous instant delivery to every edge.
- Authenticated `/admin/quick-add` supports gallery photos, archived image scans, historical-figure/biography records, authors and library works, family cards and marketplace listings. Image uploads are compressed to WebP and stamped with bilingual Hubaish branding; archive images also receive the in-app viewer watermark. District selection must stay limited to the existing 22-name Hubaish reference list. Public family/biography entries require the consent assertion and remain subject to super-admin review policy.
- Android microphone input uses generated `HubaishSpeechBridge.java` and `SpeechRecognizer`, with `RECORD_AUDIO` permission requested on first use. Keep the JS bridge restricted to the local Capacitor WebView. Do not add an incompatible speech plugin without a validated Capacitor 8 build.
