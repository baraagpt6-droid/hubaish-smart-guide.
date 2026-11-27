import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const required = [
  'www/index.html','www/styles.css','www/app.js','www/upgrade-400.js','www/catalog.js','www/features.js',
  'www/github-cms.js','www/gallery.js','www/splash.js','www/data/live-content.json','www/sw.js',
  'www/manifest.json','www/manifest.webmanifest','www/icons/icon.svg',
  'www/icons/icon-192.png','www/icons/icon-512.png','www/icons/apple-touch-icon.png',
  'www/icons/favicon-32.png','www/icons/photo-fallback.svg','www/assets/app.js',
  'www/assets/catalog.js','www/assets/features.js','www/assets/styles.css',
  'cloudflare-worker/worker.js','cloudflare-worker/wrangler.toml',
  'capacitor.config.json','package.json','scripts/generate-icons.py',
  'scripts/apply-android-icons.py','scripts/patch-android-config.py',
  'scripts/serve.mjs','scripts/configure-cloudflare-kv.mjs','.github/workflows/deploy-cloudflare-worker.yml','.github/workflows/build-and-deploy.yml',
  '.github/workflows/worker-production-health.yml','.github/workflows/deploy-cloudflare-worker.yml','scripts/configure-cloudflare-kv.mjs','README.md','cloudflare-worker/README.md',
  'assets/icon-only.png','assets/icon-foreground.png','assets/icon-background.png',
  'assets/splash.png','assets/splash-dark.png',
  'Gemfile','fastlane/Appfile','fastlane/Fastfile',
  'fastlane/metadata/android/ar/title.txt','fastlane/metadata/android/ar/short_description.txt','fastlane/metadata/android/ar/full_description.txt','fastlane/metadata/android/ar/changelogs/default.txt',
  'fastlane/metadata/android/en-US/title.txt','fastlane/metadata/android/en-US/short_description.txt','fastlane/metadata/android/en-US/full_description.txt','fastlane/metadata/android/en-US/changelogs/default.txt',
  'play-store/feature-graphic.svg','scripts/render-play-feature-graphic.mjs','scripts/prepare-play-store-assets.py','scripts/normalize-play-screenshots.py','scripts/capture-play-screenshots.mjs','scripts/normalize-play-screenshots.py','scripts/verify-play-store.mjs','scripts/prepare-android-release.py','scripts/resolve-play-release.py',
  '.github/workflows/google-play-closed-testing.yml','docs/google-play-setup.md'
];
for (const file of required) await access(resolve(root,file));
const read = file => readFile(resolve(root,file),'utf8');
const [html,css,app,catalog,features,cms,sw,worker,wrangler,workflow,readme,workerReadme,androidPatch,cloudflareDeployWorkflow,kvSetupScript,gallery] = await Promise.all([
  read('www/index.html'),read('www/styles.css'),read('www/app.js'),read('www/catalog.js'),
  read('www/features.js'),read('www/github-cms.js'),read('www/sw.js'),
  read('cloudflare-worker/worker.js'),read('cloudflare-worker/wrangler.toml'),
  read('.github/workflows/build-and-deploy.yml'),read('README.md'),
  read('cloudflare-worker/README.md'),read('scripts/patch-android-config.py'),read('.github/workflows/deploy-cloudflare-worker.yml'),read('scripts/configure-cloudflare-kv.mjs'),read('www/gallery.js')
]);
const manifest=JSON.parse(await read('www/manifest.webmanifest'));
const manifestJson=JSON.parse(await read('www/manifest.json'));
const capacitor=JSON.parse(await read('capacitor.config.json'));
const pkg=JSON.parse(await read('package.json'));
const data=JSON.parse(await read('www/data/live-content.json'));
const assets = {
  app: await read('www/assets/app.js'),
  catalog: await read('www/assets/catalog.js'),
  features: await read('www/assets/features.js'),
  styles: await read('www/assets/styles.css')
};
if (assets.app!==app || assets.catalog!==catalog || assets.features!==features || assets.styles!==css) {
  throw new Error('Android duplicate web assets do not match the current web sources.');
}
for (const file of ['www/app.js','www/catalog.js','www/features.js','www/github-cms.js','www/gallery.js','www/sw.js','www/upgrade-400.js','cloudflare-worker/worker.js']) {
  const result=spawnSync(process.execPath,['--check',resolve(root,file)],{encoding:'utf8'});
  if(result.status!==0)throw new Error('JavaScript syntax error in '+file+': '+(result.stderr||result.stdout));
}
for (const fragment of ['./styles.css','./splash.js','./app.js','./catalog.js','./features.js','./github-cms.js','./gallery.js','./manifest.webmanifest']) {
  if(!html.includes(fragment))throw new Error('Missing app reference: '+fragment);
}
if (!html.includes('id="appSplash"') || !html.includes('id="offlineIndicator"') ||
    !html.includes('id="privacyPolicyText"') || !html.includes('id="languagePickerMenu"') ||
    !html.includes('id="readerFontIncrease"') || !html.includes('id="readerOpenFavorites"')) {
  throw new Error('Splash, offline, privacy, custom language or reading controls are missing.');
}
const loginStart=html.indexOf('<form id="workerLoginForm"'),loginEnd=html.indexOf('</form>',loginStart);
const login=loginStart>=0&&loginEnd>loginStart?html.slice(loginStart,loginEnd):'';
if(!login.includes('workerUsername')||!login.includes('workerPassword')||!login.includes('workerRemember')||
   login.includes('workerBootstrapKey')||login.includes('workerEndpoint')||
   html.includes('id="adminPanelToggle"')||html.includes('id="adminAuthGate"')) {
  throw new Error('Public login must only show username, password and 30-day remember-me.');
}
const setupStart=html.indexOf('<form id="workerSetupForm"');
const setupEnd=html.indexOf('</form>',setupStart);
const setup=setupStart>=0&&setupEnd>setupStart?html.slice(setupStart,setupEnd):'';
if(!setup.includes('workerBootstrapKey')||!setup.includes('workerSetupUsername')||
   !setup.includes('workerSetupPassword')||!setup.includes('minlength="12"')||
   setup.includes('workerEndpoint')||setup.includes('GITHUB_TOKEN')||
   !html.includes('id="workerBootstrapCleanupNotice"')) {
  throw new Error('One-time first-admin setup form or bootstrap cleanup notice is missing.');
}
if(!html.includes('id="cloudAdminPanel" class="hidden"')||!html.includes('id="cloudSuperAdminPanel"')||
   !html.includes('id="cloudContentForm"')||!html.includes('id="cloudAdminUsersList"')||
   !html.includes('id="cloudAuditList"')||!html.includes('id="exportJsonBtn"')||
   !html.includes('id="importJsonInput"')) {
  throw new Error('Authenticated admin dashboard, content editor, audit or backup interface is incomplete.');
}
if(!app.includes('function initFloatingAssistant()')||!app.includes('id = \'aiFabWrap\'')||!html.includes('id="openAiBtn"'))throw new Error('Floating AI launcher or More-tab assistant is missing.');
if(!app.includes('function initMoreSmartTabs()')||!app.includes('function initAdminSubtabs()')||!app.includes('function switchTab(tab) {'))throw new Error('More and administrator smart tabs are missing.');
if(!app.includes('function initCustomSelects()')||!css.includes('.custom-select-sheet')||!css.includes('.custom-select-option.selected'))throw new Error('The emerald/gold custom select sheet is missing.');
if(!app.includes('state.tab = \'home\'')||!app.includes('function localizeHomeStaticContent()'))throw new Error('Default Home startup or static home translations are missing.');
if(!html.includes('id="cloudLatitude"')||!html.includes('id="cloudLongitude"')||!html.includes('id="cloudElevation"')||
   !html.includes('id="cloudPreviewBtn"')||!cms.includes('function renderContentPreview()')||
   !html.includes('id="itineraryList"')||!html.includes('id="comparePlaceA"')||
   !features.includes('function renderSmartItineraries')||!features.includes('function compareSelectedPlaces')||
   !features.includes('shareExplorerBadge')||!features.includes('quizBest')) {
  throw new Error('Smart routes, comparison or explorer gamification are incomplete.');
}
if (!['AR','EN','TR','FR'].every(lang=>app.includes('appName:') && features.includes(lang+': {')) ||
    !features.includes('#globalSearchInput') || !features.includes('#dataSourceNote') ||
    !features.includes('Politique de confidentialité') || !features.includes('Gizlilik Politikası')) {
  throw new Error('Four-language labels, search, statistics or privacy translations are missing.');
}
if (features.includes('adminUnlocked')||features.includes('ADMIN_PIN_KEY')||
    features.includes('initAdminLock')||features.includes('adminPinEntry')) {
  throw new Error('The legacy device-local PIN admin path must remain removed.');
}
if(cms.includes('githubToken')||cms.includes('API_URL')||cms.includes('readRepositoryFile')||
   cms.includes('cloudAdminForm')||
   !cms.includes('function adminStatus()')||!cms.includes('async function restoreWorkerSession')||
   !cms.includes("readWorkerJson(await workerRequest('/auth/me')")||
   !cms.includes("localStorage.removeItem('hubaish_direct_github_token')")||
   !cms.includes("function isAdmin(){return !!workerToken&&!!workerUser?.username}")) {
  throw new Error('Admin login must use Worker sessions only and validate /auth/me.');
}
if(!cms.includes("fetchWithTimeout(DEFAULT_WORKER_URL+'/auth/login'")||!cms.includes("String($('workerUsername')?.value||'').trim()")||
   !cms.includes("DEFAULT_WORKER_URL+'/setup/status'")||!cms.includes("DEFAULT_WORKER_URL+'/setup'")||
   !cms.includes('async function firstAdminSetup')||!cms.includes('async function refreshSetupStatus')||
   !cms.includes("await workerRequest('/content'")||!cms.includes('data-user-role')||
   !cms.includes('data-user-password')||!cms.includes('data-user-delete')||
   !cms.includes('BOOTSTRAP_KEY')||!cms.includes('workerBootstrapCleanupNotice')) {
  throw new Error('Worker login, one-time setup, cleanup reminder or super-admin account controls are incomplete.');
}
if(!worker.includes('ITER=100000')||!worker.includes('hashIterations:ITER')||
   !worker.includes('function passwordMatches')||!worker.includes('path==="/auth/login"')||
   !worker.includes('path==="/auth/me"')||!worker.includes('path==="/admin/users/password"')||
   !worker.includes('req.method==="DELETE"')||!worker.includes('req.method==="PUT"')||
   !worker.includes('changes:changes.slice(0,100)')||
   !worker.includes('X-Content-Type-Options')||!worker.includes('Content-Security-Policy')||
   !worker.includes('microphone=(self)')||
   !worker.includes('sessionVersion=()=>b64u(random(16))')||
   !worker.includes('String(p.ver||"legacy")!==versionOf(u)')||
   !worker.includes('ver:versionOf(user)')||
   !worker.includes('user.sessionVersion=sessionVersion()')) {
  throw new Error('Worker authentication, RBAC, audit log or security headers are incomplete.');
}
if(!cms.includes('function fetchWithTimeout(')||!cms.includes("'/auth/login'")||!worker.includes('path==="/health"')) {
  throw new Error('Worker login timeouts or the public production health endpoint are missing.');
}
if(!css.includes('env(safe-area-inset-top')||!css.includes('var(--status-bar-height')||
   !css.includes('env(safe-area-inset-bottom')||!css.includes('.ai-fab-launcher')||!css.includes('bottom:calc(84px + env(safe-area-inset-bottom,0px))')) {
  throw new Error('Safe-area CSS or floating assistant removal is missing.');
}
if(capacitor.appName!=='دليل حبيش'||capacitor.plugins?.StatusBar?.style!=='LIGHT'||
   'overlaysWebView' in (capacitor.plugins?.StatusBar||{})||
   'backgroundColor' in (capacitor.plugins?.StatusBar||{})||
   manifest.short_name!=='دليل حبيش'||manifest.name!=='دليل حبيش'||
   manifestJson.short_name!=='دليل حبيش'||manifestJson.name!=='دليل حبيش'||
   !pkg.dependencies?.['@capacitor/status-bar']||
   !html.includes('<title>دليل حبيش | Hubaish Guide</title>')||
   html.includes('دليل حبيش الذكي')||app.includes('Hubaish Smart Guide')||
   features.includes('Hubaish Smart Guide')) {
  throw new Error('Unified app branding or native StatusBar configuration is inconsistent.');
}
if(!app.includes("statusBar.setStyle?.({ style: dark ? 'LIGHT' : 'DARK' })")||
   app.includes('setOverlaysWebView')||app.includes('setBackgroundColor?.({ color })')||
   !app.includes('setReaderScale')||!app.includes('languagePickerButton')) {
  throw new Error('Runtime status-bar style, reader settings or custom language picker wiring is missing.');
}
if(!css.includes('padding-top:max(9px,env(safe-area-inset-top')||
   !css.includes('padding-bottom:max(6px,env(safe-area-inset-bottom')) {
  throw new Error('Android 15/16 top and bottom safe-area padding is missing.');
}
if(!sw.includes('hubaish-guide-v4.0.7')||!sw.includes("'splash.js'")||
   !sw.includes("'github-cms.js'")||!sw.includes("'gallery.js'")||!sw.includes("'data/live-content.json'")) {
  throw new Error('The service-worker cache does not include the updated app shell.');
}
if(!html.includes('id="hubaishGallery"')||!html.includes('id="galleryFromPlaces"')||
   !html.includes('id="galleryHomeOpen"')||!html.includes('id="cloudImageFile"')||
   !html.includes('id="cloudImageVerified"')||!app.includes("window.HubaishGallery?.render?.()")||
   !app.includes("move('#hubaishGallery',pane('explore'))")||
   !gallery.includes("image_verified===true")||!gallery.includes('heritage-lightbox-thumb')||
   !gallery.includes("pointerdown")||!gallery.includes("navigator.share")) {
  throw new Error('Hubaish heritage gallery, lightbox interactions or admin photo provenance form is incomplete.');
}
const verifiedPhotoRows=data.landmarks.filter(row=>row.image_url);
if(verifiedPhotoRows.length!==4||verifiedPhotoRows.some(row=>row.image_verified!==true||!row.image_source_url||!row.image_photographer||!row.image_license)) {
  throw new Error('The published image catalogue must contain exactly four sourced and verified Hubaish photo records.');
}
const blockedImageTerms=['Ibb_1987_01.jpg','Yemen_-_Ibb_IMG_2929A1-1600.jpg','Wide-angle_view_of_Ibb_city','جبلة – محافظة إب'];
const serializedData=JSON.stringify(data);
if(blockedImageTerms.some(term=>html.includes(term)||serializedData.includes(term))) {
  throw new Error('A regional photo that is not identified as Hubaish remains in the gallery or data file.');
}
if(!cms.includes('safeImageSource')||!cms.includes("image_verified:!!v.imageVerified")||
   !cms.includes('cloudImageFile')||!cms.includes('180*1024')||
   !cms.includes("localeFields(row,'image_caption',v.imageCaption)")) {
  throw new Error('Verified image upload, compression, attribution or locale fields are incomplete.');
}
const hubaishAdminsNamespaceId = 'c34ad73bd79444119bd6884856516cf2';
if(!wrangler.includes('[[kv_namespaces]]')||
   !wrangler.includes('binding = "ADMINS"')||
   !wrangler.includes('id = "'+hubaishAdminsNamespaceId+'"')||
   wrangler.includes('__HUBAISH_ADMINS_KV_NAMESPACE_ID__')||
   !kvSetupScript.includes("const namespaceId = '"+hubaishAdminsNamespaceId+"'")||
   kvSetupScript.includes('writeFile')||kvSetupScript.includes('CLOUDFLARE_API_TOKEN')||
   !cloudflareDeployWorkflow.includes('Validate the fixed hubaish-admins ADMINS binding')||
   !cloudflareDeployWorkflow.includes('run: node scripts/configure-cloudflare-kv.mjs')||
   !cloudflareDeployWorkflow.includes('wrangler-action@v3')||
   !cloudflareDeployWorkflow.includes("env.CLOUDFLARE_API_TOKEN != ''")||
   !cloudflareDeployWorkflow.includes("check('/health')")) {
  throw new Error('The fixed ADMINS KV namespace, credential-independent validation, conditional deployment or production health check is incomplete.');
}
if(!workflow.includes('actions/deploy-pages@v4')||!workflow.includes('assembleRelease')||
   !workflow.includes('bundleRelease')||!workflow.includes('Daleel-Hubaish-v')||
   !workflow.includes('Daleel-Hubaish-release.aab')||
   !workflow.includes('patch-android-config.py')||!workflow.includes('upload-artifact@v4')) {
  throw new Error('The signed APK/AAB and Pages release workflow is incomplete.');
}
if(androidPatch.includes('android:windowOptOutEdgeToEdgeEnforcement')||
   !androidPatch.includes('WindowCompat.setDecorFitsSystemWindows(getWindow(), false)')||
   !androidPatch.includes('Color.TRANSPARENT')||
   !androidPatch.includes('WindowInsetsControllerCompat')||
   !androidPatch.includes('دليل حبيش')) {
  throw new Error('Android 15/16 edge-to-edge safe-area and app-name patch is incomplete.');
}
const districtStart=catalog.indexOf('const D=['),districtEnd=catalog.indexOf('const PN=',districtStart);
const districtBlock=districtStart>=0&&districtEnd>districtStart?catalog.slice(districtStart,districtEnd):'';
if([...districtBlock.matchAll(/^\s*\['/gm)].length!==22)throw new Error('The core district list must contain 22 names.');
const quizStart=catalog.indexOf('const QUIZ=['),quizEnd=catalog.indexOf('  ];',quizStart);
const quizBlock=quizStart>=0&&quizEnd>quizStart?catalog.slice(quizStart,quizEnd):'';
if([...quizBlock.matchAll(/^\s*\[\[/gm)].length!==10)throw new Error('The ten-question quiz catalogue is incomplete.');
const liveKeys=['landmarks','historyEvents','subDistrictUpdates','subDistricts','historicalFigures','communityLinks'];
if(data.schemaVersion!==1||!liveKeys.every(key=>Array.isArray(data[key])))throw new Error('The live content JSON schema is invalid.');
const zawahi=data.landmarks.find(item=>item.id==='zawahi-islamic-school');
if(!zawahi||zawahi.category!=='school'||zawahi.scope!=='hubaish_district'||zawahi.source_page!==431||zawahi.source_author!=='بهاء الدين الجندي')throw new Error('Al-Zawahi school record is missing its classification, scope or page-level source.');
if(!cms.includes("scope:item.scope||'hubaish_district'")||!cms.includes('source_title:item.sourceTitle||'))throw new Error('CMS conversion of local base landmarks must preserve geographic scope and source metadata.');
if(!cms.includes('Number.isInteger(Number(v.sourcePage))')||!cms.includes('Number(v.sourcePage)<=0'))throw new Error('Historical school source-page validation is too permissive.');
const uzalStart=app.indexOf('const UZAL_22 = ['),uzalEnd=app.indexOf('];',uzalStart),uzalBlock=uzalStart>=0&&uzalEnd>uzalStart?app.slice(uzalStart,uzalEnd):'';
if(!uzalBlock||[...uzalBlock.matchAll(/'[^']+'/g)].length!==22||uzalBlock.includes('صهبان'))throw new Error('Sahban must not be added to Hubaish’s 22 sub-districts.');
for(const id of ["id: 'p1', scope: 'related_historical_region'","id: 'p15', scope: 'related_historical_region'","id: 'h3', scope: 'related_historical_region'"])if(!app.includes(id))throw new Error('A legacy Sahban record or scope was lost: '+id);
if(!app.includes("item.scope === 'hubaish_district'")||!app.includes('function renderRelatedHistoricalRegions'))throw new Error('District filtering or the related-historical-region display is missing.');
if(!app.includes("'market', 'school'")||!cms.includes("'market','school'")||!html.includes('data-pcat="school"'))throw new Error('The school category is not supported consistently by the app, CMS and filter.');
if(!html.includes('id="relatedHistoricalRegionsList"')||!html.includes('id="unverifiedHistoricalRecordsList"')||!html.includes('بلاد أو مخلاف صهبان')||!cms.includes('cloudScope')||!cms.includes('source_page'))throw new Error('Related-region UI or CMS evidence metadata is missing.');
if(!app.includes("id: 'h4', scope: 'unverified_location'")||!app.includes('function renderUnverifiedHistoricalRecords')||!app.includes('matchedUnverified'))throw new Error('Mixed-location oral history must remain discoverable under an unverified geographic scope.');
if(!features.includes('Al-Zawahi School')||features.includes('Which fort is highlighted in this guide?'))throw new Error('School quiz wording is not updated.');
for(const label of ['بلاد أو مخلاف صهبان','Bilad or Mikhlaf Sahban','Bilad veya Mikhlaf Sahban','Bilad ou Mikhlaf Sahban'])if(!features.includes(label))throw new Error('The translated quick-search label for Sahban is incorrect: '+label);
if(!cms.includes("['p1','p15'].includes(String(row.id||''))")||!cms.includes("String(row.id||'')==='h3'"))throw new Error('CMS mapping must preserve the legacy Sahban scope for p1, p15 and h3 when scope is absent.');
if(!app.includes("item.cat==='fort'&&item.scope==='hubaish_district'")||!app.includes("item.cat==='valley'&&item.scope==='hubaish_district'")||!app.includes("item.scope==='hubaish_district'&&['fort','valley','mountain','mosque']"))throw new Error('Assistant and compass suggestions must exclude related historical regions from Hubaish itineraries.');
if(!catalog.includes('Related historical region outside the current administrative boundaries of Hubaish District.')||!features.includes("state.places.filter(p=>p.scope==='hubaish_district')"))throw new Error('Assistant scope label or random tour scope filter is missing.');
if(!catalog.includes("item.scope==='related_historical_region'&&!/صهبان|sahban/.test(q)"))throw new Error('Generic assistant questions must not misclassify related historical regions as Hubaish sites.');
if(!sw.includes("hubaish-guide-v4.0.7"))throw new Error('Service Worker cache version was not advanced.');
for(const [file,expected] of [['www/icons/icon-192.png',192],['www/icons/icon-512.png',512]]) {
  const image=await readFile(resolve(root,file));
  if(image.toString('hex',0,8)!=='89504e470d0a1a0a'||image.readUInt32BE(16)!==expected||image.readUInt32BE(20)!==expected)
    throw new Error(file+' must be a valid '+expected+'x'+expected+' PNG.');
}
if(readme.includes('الدخول المباشر الاحتياطي باستخدام GitHub Token')||workerReadme.includes('emergency fallback')||workerReadme.includes('GitHub Personal Access Token login'))throw new Error('Documentation still advertises the removed direct-token login.');
if(!html.includes('upgrade-400.js')||!css.includes('F7F5EE')||!css.includes('0D2B22')||!app.includes("['review','adminTabReview',false]")||!worker.includes('/public/photo-submissions')||!worker.includes('/review/photo-submissions')||!html.includes('cloudPhotoReviewPanel')||!sw.includes("'upgrade-400.js'"))throw new Error('v1.0.400 theme, locale extensions, offline app shell or visitor photo moderation queue is incomplete.');

const playWorkflow = await read('.github/workflows/google-play-closed-testing.yml');
const playFastfile = await read('fastlane/Fastfile');
const playResolver = await read('scripts/resolve-play-release.py');
const playStoreVerifier = await read('scripts/verify-play-store.mjs');
if (!playWorkflow.includes('workflow_dispatch:') ||
    playWorkflow.includes('pull_request:') ||
    !playWorkflow.includes('  push:') || !playWorkflow.includes('branches: [main]') ||
    !playWorkflow.includes("if: github.ref == 'refs/heads/main'") ||
    !playWorkflow.includes("github.event_name == 'push' && 'preview_draft'") ||
    !playWorkflow.includes("inputs.mode || 'verify_only'") ||
    !playWorkflow.includes('google-github-actions/auth@v2') ||
    !playWorkflow.includes('projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider') ||
    !playWorkflow.includes('dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com') ||
    !playWorkflow.includes('npm run build') ||
    !playWorkflow.includes('node scripts/verify-play-store.mjs --require-screenshots') ||
    !playWorkflow.includes('scripts/resolve-play-release.py') ||
    !playWorkflow.includes('PLAY_RELEASE_STATUS: ${{ steps.play-release.outputs.release_status }}') ||
    !playWorkflow.includes('python3 scripts/resolve-play-release.py --verify-upload') ||
    !playWorkflow.includes('bundle exec fastlane android upload_closed_testing') ||
    !playWorkflow.includes("PLAY_TRACK: Hubaish Closed Test") ||
    !playWorkflow.includes("- preview_draft") ||
    !playWorkflow.includes("- publish_approved_release") ||
    !playWorkflow.includes("PLAY_RELEASE_STATUS: draft") ||
    !playWorkflow.includes("python3 scripts/promote-play-draft.py") ||
    playWorkflow.includes("publish_closed_testing") ||
    playWorkflow.includes("approve_draft")) {
  throw new Error('Google Play workflow must upload draft previews on main pushes, require explicit manual approval, use WIF, verify signing and read back the release.');
}
if (!playFastfile.includes('google_play_track_version_codes') ||
    !playFastfile.includes('PLAY_RELEASE_STATUS') ||
    !playFastfile.includes('release_status: release_status') ||
    !playFastfile.includes('closed_testing_track!') ||
    !playFastfile.includes('Production tracks are blocked') ||
    !playFastfile.includes('metadata_path: "fastlane/metadata/android"')) {
  throw new Error('Fastlane Play upload lane or Closed-testing-only safeguards are incomplete.');
}
if (!playResolver.includes('/tracks') ||
    !playResolver.includes('/bundles') ||
    !playResolver.includes('nextVersionCode') ||
    !playResolver.includes('selectedClosedTestingTrack') ||
    !playResolver.includes('RELEASED_STATUSES') ||
    !playResolver.includes("release_status = \"draft\"") ||
    !playResolver.includes('EXPECTED_TRACK = "Hubaish Closed Test"') ||
    !playResolver.includes('--verify-upload') ||
    !playResolver.includes('production_version_codes')) {
  throw new Error('Google Play track discovery and versionCode resolver is incomplete.');
}

const profile=data.districtProfile;
if(!profile||profile.area_km2?.value!==228||profile.population?.find(x=>x.year===2004)?.value!==105998||profile.population?.find(x=>x.year===2025)?.value!==162023)throw new Error('District area and year-specific population values are missing.');
if(!profile.population.find(x=>x.year===2025).type.includes('HNRP'))throw new Error('2025 population must remain an HNRP estimate, not a census.');
if(profile.weekly_market?.day_ar!=='الجمعة'||!profile.weekly_market?.verification_note_ar)throw new Error('Weekly market day or local confirmation note is missing.');
if(profile.subdistrict_count!==22||data.subDistricts.length!==22)throw new Error('Hubaish must retain exactly 22 administrative sub-districts.');
if(!profile.tribal_context?.named_branches_ar?.includes('آل راجح')||!profile.geographic_disambiguation?.some(x=>x.name_ar==='مخلاف الحبيشية')||profile.name_origin_hypotheses?.status!=='research_hypotheses')throw new Error('Tribal lineage, geographic distinction or name-origin caveat is missing.');
const requiredHeritage=['khudad-fort','wuhaza-fortress','yaris-fortress','dahran-fort-bani-wail','al-dhuhrah-historic-settlement','al-udadi-fort','musaynia-fort','bayt-al-batul-fort','maghram-khair-fort','bayn-al-dur-dome','al-farawi-mosque-dome','marwaha-mosque','al-jami-mosque','dhulmah-grand-mosque','qubbat-al-zum'];
for(const id of requiredHeritage)if(!data.landmarks.some(x=>x.id===id))throw new Error('A required historical landmark record is missing: '+id);
for(const id of ['p1','p15'])if(!app.includes("id: '"+id+"', scope: 'related_historical_region'"))throw new Error('Legacy Sahban landmark id/scope was changed: '+id);
if(!app.includes("id: 'h3', scope: 'related_historical_region'"))throw new Error('Legacy Sahban event h3 was changed.');
if(!data.landmarks.some(x=>x.id==='zawahi-islamic-school'&&x.category==='school'&&x.subject_claims_pending_verification?.length===3))throw new Error('Al-Zawahi attributed curriculum claims must remain provisional.');
const wuhaza=data.landmarks.find(x=>x.id==='hijra-wuhaza-learning-centre');
if(!wuhaza||wuhaza.category!=='school'||wuhaza.status!=='documented'||wuhaza.scope!=='hubaish_district'||!wuhaza.source_text.includes('ص 2329'))throw new Error('Wuhaza learning centre record is invalid.');
if(!Array.isArray(data.educationalRecords)||data.educationalRecords.length<7)throw new Error('Educational evidence catalogue is incomplete.');
for(const id of ['isa-al-rubai-wuhazi','ismail-al-wuhazi','zayd-al-faishi','asad-ibn-wa-il','qasim-ibn-humayr-al-waili','sadiq-mohammed-al-nahi'])if(!data.historicalFigures.some(x=>x.id===id))throw new Error('A required historical figure profile is missing: '+id);
if(!catalog.includes('162,023')||!catalog.includes('Engineer Sadiq Mohammed')||!catalog.includes('Shaykh Qasim ibn Humayr'))throw new Error('Assistant answers or additional profiles were not added to the catalog.');
const zawahiRecord=data.landmarks.find(x=>x.id==='zawahi-islamic-school');
const sadiq=data.historicalFigures.find(x=>x.id==='sadiq-mohammed-al-nahi');
if(!zawahiRecord?.description_ar.includes('عبد الرحمن بن عمران')||!zawahiRecord?.description_ar.includes('يوسف بن علي بن عبيد الله بن الهيثم'))throw new Error('Al-Zawahi student evidence is incomplete.');
if(!sadiq?.biography_ar.includes('أبو العتيق أبو بكر العنسي الوعلي')||!sadiq?.biography_ar.includes('بيت الناهي السعيدي بريمة')||sadiq.lineage_research_status!=='unverified_separate_research_thread')throw new Error('Sadiq al-Nahi lineage hypotheses must remain separate and unverified.');

if(!html.includes('id="geoAdminContext"')||!html.includes('id="geoTribalContext"')||!app.includes('geoAdminContext')||!app.includes('geoTribalContext'))throw new Error('Administrative and tribal profile panels are missing.');

console.log('Build check passed: Worker-only login, visitor photo moderation, four locales, ivory/emerald daytime theme, offline shell, Android assets and APK/AAB workflow.');
