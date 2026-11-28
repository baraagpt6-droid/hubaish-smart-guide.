import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const required = [
  'www/index.html','www/styles.css','www/app.js','www/upgrade-400.js','www/catalog.js','www/features.js',
  'www/github-cms.js','www/gallery.js','www/knowledge.js','www/splash.js','www/data/live-content.json','www/data/heritage-knowledge.json','www/assets/heritage/1183-wood-inscription.webp','www/sw.js',
  'www/manifest.json','www/manifest.webmanifest','www/icons/icon.svg',
  'www/icons/icon-192.png','www/icons/icon-512.png','www/icons/apple-touch-icon.png',
  'www/icons/favicon-32.png','www/icons/photo-fallback.svg','www/assets/app.js',
  'www/assets/catalog.js','www/assets/features.js','www/assets/styles.css',
  'cloudflare-worker/worker.js','cloudflare-worker/wrangler.toml',
  'capacitor.config.json','package.json','scripts/generate-icons.py',
  'scripts/apply-android-icons.py','scripts/patch-android-config.py',
  'scripts/serve.mjs','scripts/configure-cloudflare-kv.mjs','scripts/resolve-cloudflare-worker-url.mjs','.github/workflows/deploy-cloudflare-worker.yml','.github/workflows/build-and-deploy.yml',
  '.github/workflows/worker-production-health.yml','.github/workflows/deploy-cloudflare-worker.yml','scripts/configure-cloudflare-kv.mjs','README.md','cloudflare-worker/README.md',
  'assets/icon-only.png','assets/icon-foreground.png','assets/icon-background.png',
  'assets/splash.png','assets/splash-dark.png',
  'Gemfile','fastlane/Appfile','fastlane/Fastfile',
  'fastlane/metadata/android/ar/title.txt','fastlane/metadata/android/ar/short_description.txt','fastlane/metadata/android/ar/full_description.txt','fastlane/metadata/android/ar/changelogs/default.txt',
  'fastlane/metadata/android/en-US/title.txt','fastlane/metadata/android/en-US/short_description.txt','fastlane/metadata/android/en-US/full_description.txt','fastlane/metadata/android/en-US/changelogs/default.txt',
  'play-store/feature-graphic.svg','scripts/render-play-feature-graphic.mjs','scripts/prepare-play-store-assets.py','scripts/normalize-play-screenshots.py','scripts/capture-play-screenshots.mjs','scripts/normalize-play-screenshots.py','scripts/verify-play-store.mjs','scripts/prepare-android-release.py','scripts/resolve-play-release.py','scripts/retire-obsolete-play-draft.py','scripts/retire-preview-419-draft.py',
  '.github/workflows/google-play-closed-testing.yml','.github/workflows/play-status-monitor.yml',
  'scripts/monitor-play-status.py','scripts/audit-runtime.mjs','docs/google-play-setup.md'
];
for (const file of required) await access(resolve(root,file));
const read = file => readFile(resolve(root,file),'utf8');
const prepareAndroid = await read('scripts/prepare-android-release.py');
const [html,css,app,catalog,features,cms,sw,worker,wrangler,workflow,readme,workerReadme,androidPatch,cloudflareDeployWorkflow,kvSetupScript,gallery,knowledgeJs,playMonitorWorkflow,playMonitorScript,runtimeAudit,workerHealthWorkflow,workerUrlResolver,serve] = await Promise.all([
  read('www/index.html'),read('www/styles.css'),read('www/app.js'),read('www/catalog.js'),
  read('www/features.js'),read('www/github-cms.js'),read('www/sw.js'),
  read('cloudflare-worker/worker.js'),read('cloudflare-worker/wrangler.toml'),
  read('.github/workflows/build-and-deploy.yml'),read('README.md'),
  read('cloudflare-worker/README.md'),read('scripts/patch-android-config.py'),read('.github/workflows/deploy-cloudflare-worker.yml'),read('scripts/configure-cloudflare-kv.mjs'),read('www/gallery.js'),read('www/knowledge.js'),
  read('.github/workflows/play-status-monitor.yml'),read('scripts/monitor-play-status.py'),read('scripts/audit-runtime.mjs'),
  read('.github/workflows/worker-production-health.yml'),read('scripts/resolve-cloudflare-worker-url.mjs'),read('scripts/serve.mjs')
]);
const manifest=JSON.parse(await read('www/manifest.webmanifest'));
const manifestJson=JSON.parse(await read('www/manifest.json'));
const capacitor=JSON.parse(await read('capacitor.config.json'));
const pkg=JSON.parse(await read('package.json'));
const data=JSON.parse(await read('www/data/live-content.json'));
const knowledge=JSON.parse(await read('www/data/heritage-knowledge.json'));
const geographyPayload=JSON.stringify(data)+"\\n"+JSON.stringify(knowledge)+"\\n"+readme;
const forbiddenExternalLabels=["صهبان","وادي بناء","جبل هران","المحويت","سفيان","سحار","مخلاف الحبيشية","ذو حبيش","بنو حبيش"];
for(const label of forbiddenExternalLabels)if(geographyPayload.includes(label))throw new Error('Out-of-scope geographic label found in public guide data: '+label);
if(/(?:^|[\\s،؛/])دمت(?=$|[\\s،؛/])/u.test(geographyPayload)||/(?:^|[\\s،؛/])رداع(?=$|[\\s،؛/])/u.test(geographyPayload))throw new Error('Out-of-scope locality label found in public guide data.');
if(!Array.isArray(data.subDistricts)||data.subDistricts.length!==22||data.subDistricts.some(x=>x.district_name_ar==null))throw new Error('The Hubaish reference district list must contain exactly 22 named entries.');
const assets = {
  app: await read('www/assets/app.js'),
  catalog: await read('www/assets/catalog.js'),
  features: await read('www/assets/features.js'),
  styles: await read('www/assets/styles.css')
};
if (assets.app!==app || assets.catalog!==catalog || assets.features!==features || assets.styles!==css) {
  throw new Error('Android duplicate web assets do not match the current web sources.');
}
for (const file of ['www/app.js','www/catalog.js','www/features.js','www/github-cms.js','www/gallery.js','www/knowledge.js','www/sw.js','www/upgrade-400.js','cloudflare-worker/worker.js','scripts/audit-runtime.mjs','scripts/resolve-cloudflare-worker-url.mjs']) {
  const result=spawnSync(process.execPath,['--check',resolve(root,file)],{encoding:'utf8'});
  if(result.status!==0)throw new Error('JavaScript syntax error in '+file+': '+(result.stderr||result.stdout));
}
for (const fragment of ['./styles.css','./splash.js','./app.js','./catalog.js','./features.js','./github-cms.js','./gallery.js','./knowledge.js','./manifest.webmanifest']) {
  if(!html.includes(fragment))throw new Error('Missing app reference: '+fragment);
}
if (!html.includes('id="appSplash"') || !html.includes('id="welcomeSkipBtn"') || !html.includes('welcome-graphic') || !html.includes('id="offlineIndicator"') ||
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
if(/http:\/\/localhost|https:\/\/localhost|127\.0\.0\.1/i.test(worker)||/http:\/\/localhost|https:\/\/localhost|127\.0\.0\.1/i.test(wrangler))throw new Error('Production Worker CORS must not allow loopback origins.');
if(!runtimeAudit.includes("page.route(workerUrl + '/setup/status'")||!runtimeAudit.includes("await fetch(workerUrl + '/setup/status'"))throw new Error('The runtime audit must proxy the real read-only setup-status response through Node instead of widening production CORS.');
if(!worker.includes('path.startsWith("/review/")&&actor.role!=="super_admin"')||worker.includes('path.startsWith("/review/community-submissions")&&actor.role!=="super_admin"'))throw new Error('Every review endpoint must require super_admin; editor roles must never change moderation state.');
if(!worker.includes('community-submit-rate:')||!worker.includes('Number(rate.count||0)>=6')||!worker.includes('expirationTtl:86400'))throw new Error('Public community intake must have the hashed-IP daily rate limit.');
if(!runtimeAudit.includes("const assistantReplyText = await assistantReply.innerText();")||!runtimeAudit.includes("assistantReply: assistantReplyText,"))throw new Error('The runtime audit must snapshot the assistant reply before offline reload.');
if(!catalog.includes("id:'h8'")||!catalog.includes("17 مايو 1919م")||!catalog.includes('الشيخ عبدالعزيز بن عبدالكريم الحداد'))throw new Error('The seventh evidence-led Hubaish history station is missing.');
if(!serve.includes("'.webp':'image/webp'")||!knowledgeJs.includes("canvas.dataset.sourceLoaded='true'")||!knowledgeJs.includes("canvas.dataset.sourceError='true'"))throw new Error('The local archive viewer must serve WebP correctly and expose image load state.');

if(!css.includes('env(safe-area-inset-top')||!css.includes('calc(env(safe-area-inset-top,0px) + 12px)')||!css.includes('var(--status-bar-height')||
   !css.includes('env(safe-area-inset-bottom')||!css.includes('.ai-fab-launcher')||!css.includes('bottom:calc(84px + env(safe-area-inset-bottom,0px))')) {
  throw new Error('Safe-area CSS or floating assistant removal is missing.');
}
if(capacitor.appName!=='دليل حبيش'||capacitor.plugins?.StatusBar?.style!=='LIGHT'||
   'overlaysWebView' in (capacitor.plugins?.StatusBar||{})||
   capacitor.plugins?.StatusBar?.backgroundColor!=='#071711'||
   manifest.short_name!=='دليل حبيش'||manifest.name!=='دليل حبيش'||
   manifestJson.short_name!=='دليل حبيش'||manifestJson.name!=='دليل حبيش'||
   !pkg.dependencies?.['@capacitor/status-bar']||
   !html.includes('<title>دليل حبيش | Hubaish Guide</title>')||
   html.includes('دليل حبيش الذكي')||app.includes('Hubaish Smart Guide')||
   features.includes('Hubaish Smart Guide')) {
  throw new Error('Unified app branding or native StatusBar configuration is inconsistent.');
}
if(!app.includes("statusBar.setStyle?.({ style: dark ? 'LIGHT' : 'DARK' })")||
   app.includes('setOverlaysWebView')||!app.includes('setBackgroundColor?.({ color })')||
   !app.includes('setReaderScale')||!app.includes('languagePickerButton')) {
  throw new Error('Runtime status-bar style, reader settings or custom language picker wiring is missing.');
}
if(!css.includes('padding-top:max(9px,env(safe-area-inset-top')||
   !css.includes('padding-bottom:max(6px,env(safe-area-inset-bottom')) {
  throw new Error('Android 15/16 top and bottom safe-area padding is missing.');
}
if(app.includes('innerHTML'))throw new Error('The app must build DOM nodes with textContent instead of innerHTML.');
if(!prepareAndroid.includes('maven-central.storage-download.googleapis.com/maven2/')||!prepareAndroid.includes('mavenCentral()')||!prepareAndroid.includes('android_dir.rglob("*.gradle")'))throw new Error('Signed Android releases must place the GCS Maven Central mirror ahead of Maven Central in generated Gradle files and retain the fallback.');
if(!sw.includes('hubaish-guide-v4.1.6')||!sw.includes("assets/heritage/1183-wood-inscription.webp")||!sw.includes("'splash.js'")||
   !sw.includes("'github-cms.js'")||!sw.includes("'gallery.js'")||!sw.includes("'data/live-content.json'")) {
  throw new Error('The service-worker cache does not include the updated app shell.');
}
if(!worker.includes('LIVE_KEY="live-content:published"')||!worker.includes('/api/live-content')||!worker.includes('/admin/quick-add')||!worker.includes('publishLiveContent(env,live)'))throw new Error('Cloudflare live KV feed or Quick Add endpoint is missing.');
if(!cms.includes("DEFAULT_WORKER_URL+'/api/live-content'")||!cms.includes("workerRequest('/admin/quick-add'")||!cms.includes('function stampQuickImage')||!cms.includes("setInterval(()=>{if(document.visibilityState==='visible'){sync(true);refreshSetupStatus();window.HubaishKnowledge?.load?.()}},15000)"))throw new Error('Client live-feed polling, offline refresh or Quick Add publishing path is incomplete.');
if(!knowledgeJs.includes("setInterval(()=>{if(document.visibilityState==='visible')refreshPublished()},15000)"))throw new Error('Approved archive/family/market content is not refreshed while the app is open.');
if(!html.includes('id="cloudQuickAddForm"')||!html.includes('id="cloudQuickImageFile"')||!html.includes('id="cloudQuickRights"')||!html.includes('id="cloudQuickPreviewBtn"'))throw new Error('Admin Quick Add Studio or rights confirmation is missing.');
if(!html.includes('value="figure"')||!html.includes('value="work"')||!worker.includes('"figure","work"')||!knowledgeJs.includes("published.filter(x=>x.type==='figure')")||!knowledgeJs.includes("published.filter(x=>x.type==='work')"))throw new Error('Quick Add historical-figure or library records are not connected to the knowledge index.');
if(!androidPatch.includes('android.permission.RECORD_AUDIO')||!androidPatch.includes('HubaishSpeechBridge.java')||!androidPatch.includes('SpeechRecognizer')||!androidPatch.includes('HubaishNativeSpeech'))throw new Error('Native Android microphone permission or SpeechRecognizer bridge is missing.');
if(!app.includes('window.HubaishNativeSpeech')||!app.includes("hubaish:native-speech")||!app.includes('permission-denied'))throw new Error('Search/assistant controls are not wired to the native Android speech bridge.');
if(!html.includes('data-query="حصن يريس"')||!html.includes('data-query="عزلة شباع"')||!html.includes('data-query="مسجد مروحة"')||!html.includes('data-query="مدرسة وحاظة"')||
   html.includes('data-query="صهبان"')||html.includes('data-query="وادي بناء"'))throw new Error('Home quick-search chips must stay within documented Hubaish localities.');
if(!html.includes('<meta name="application-release" content="1.0.403">')||!html.includes('<meta name="application-version-code" content="420">')||!html.includes('id="hubaishGallery"')||!html.includes('id="galleryFromPlaces"')||
   !html.includes('id="galleryHomeOpen"')||!html.includes('id="cloudImageFile"')||
   !html.includes('id="cloudImageVerified"')||!app.includes("window.HubaishGallery?.render?.()")||
   !app.includes("move('#hubaishGallery',pane('explore'))")||
   !gallery.includes("image_verified===true")||!gallery.includes('heritage-lightbox-thumb')||
   !gallery.includes("pointerdown")||!gallery.includes("navigator.share")||!gallery.includes('heritage-lightbox-watermark')) {
  throw new Error('Hubaish heritage gallery, lightbox interactions or admin photo provenance form is incomplete.');
}
const verifiedPhotoRows=data.landmarks.filter(row=>row.image_url);
const marwahaGalleryRow=data.landmarks.find(row=>row.id==='marwaha-mosque');
if(!marwahaGalleryRow?.image_title_ar?.includes('نقيل العقاب')||!marwahaGalleryRow?.image_title_ar?.includes('١١٨٣ هـ')||
   !marwahaGalleryRow?.image_caption_ar?.includes('811هـ')||!marwahaGalleryRow?.image_caption_ar?.includes('1183هـ')) {
  throw new Error('Marwaha image must distinguish the reported 811 AH inscription date from the 1183 AH current-building date and use Naqil al-Aqab locality.');
}
if(verifiedPhotoRows.length!==5||verifiedPhotoRows.some(row=>row.image_verified!==true||!row.image_source_url||!row.image_photographer||!row.image_license)) {
  throw new Error('The published image catalogue must contain exactly five sourced and attributed Hubaish photo records.');
}
const blockedImageTerms=['Ibb_1987_01.jpg','Yemen_-_Ibb_IMG_2929A1-1600.jpg','Wide-angle_view_of_Ibb_city','جبلة – محافظة إب'];
const serializedData=JSON.stringify(data);
if(blockedImageTerms.some(term=>html.includes(term)||serializedData.includes(term))) {
  throw new Error('A regional photo that is not identified as Hubaish remains in the gallery or data file.');
}
if(!cms.includes('safeImageSource')||!cms.includes('bundledHeritageImage')||!cms.includes("image_verified:!!v.imageVerified")||
   !cms.includes('cloudImageFile')||!cms.includes('180*1024')||
   !cms.includes("localeFields(row,'image_caption',v.imageCaption)")) {
  throw new Error('Verified image upload, compression, attribution or locale fields are incomplete.');
}
const hubaishAdminsNamespaceId = 'c34ad73bd79444119bd6884856516cf2';
if(!wrangler.includes('workers_dev = true')||
   !wrangler.includes('[[kv_namespaces]]')||
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
if(!workflow.includes('actions/checkout@v7')||!workflow.includes('actions/setup-node@v7')||
   !workflow.includes('actions/setup-java@v6')||!workflow.includes('actions/configure-pages@v6')||
   !workflow.includes('actions/upload-pages-artifact@v5')||!workflow.includes('actions/deploy-pages@v5')||
   !workflow.includes('actions/upload-artifact@v7')||!workflow.includes('actions/download-artifact@v7')||
   !workflow.includes('assembleRelease')||!workflow.includes('bundleRelease')||
   !workflow.includes('Daleel-Hubaish-v')||!workflow.includes('Daleel-Hubaish-release.aab')||
   !workflow.includes('patch-android-config.py')) {
  throw new Error('The signed APK/AAB and Node 24 Pages release workflow is incomplete.');
}
if(androidPatch.includes('android:windowOptOutEdgeToEdgeEnforcement')||
   !androidPatch.includes('WindowCompat.setDecorFitsSystemWindows(getWindow(), false)')||
   !androidPatch.includes('Color.parseColor("#071711")')||
   !androidPatch.includes('"android:statusBarColor": "#071711"')||
   !androidPatch.includes('"android:windowSplashScreenBackground": "#071711"')||
   !androidPatch.includes('WindowInsetsControllerCompat')||
   !androidPatch.includes('دليل حبيش')) {
  throw new Error('Android 15/16 edge-to-edge safe-area and app-name patch is incomplete.');
}
const districtStart=catalog.indexOf('const D=['),districtEnd=catalog.indexOf('const PN=',districtStart);
const districtBlock=districtStart>=0&&districtEnd>districtStart?catalog.slice(districtStart,districtEnd):'';
if([...districtBlock.matchAll(/^\s*\['/gm)].length!==22)throw new Error('The core district list must contain 22 names.');
const districtLines=districtBlock.split('\n');
const watnahLine=districtLines.find(line=>line.includes("['الوطئة'"));
const qahzahLine=districtLines.find(line=>line.includes("['قحزة'"));
if(!watnahLine||!watnahLine.trimEnd().endsWith('],')||!qahzahLine)throw new Error("The district array must separate Al-Wat'ah and Qahzah as distinct entries.");
const quizStart=catalog.indexOf('const QUIZ=['),quizEnd=catalog.indexOf('  ];',quizStart);
const quizBlock=quizStart>=0&&quizEnd>quizStart?catalog.slice(quizStart,quizEnd):'';
if([...quizBlock.matchAll(/^\s*\[\[/gm)].length!==10)throw new Error('The ten-question quiz catalogue is incomplete.');
const liveKeys=['landmarks','historyEvents','subDistrictUpdates','subDistricts','historicalFigures','communityLinks'];
if(data.schemaVersion!==1||!liveKeys.every(key=>Array.isArray(data[key])))throw new Error('The live content JSON schema is invalid.');
const zawahi=data.landmarks.find(item=>item.id==='zawahi-islamic-school');
if(!zawahi||zawahi.category!=='school'||zawahi.scope!=='hubaish_district'||zawahi.source_page!==431||zawahi.source_author!=='بهاء الدين الجندي')throw new Error('Al-Zawahi school record is missing its classification, scope or page-level source.');
if(!cms.includes("scope:item.scope||'hubaish_district'")||!cms.includes('source_title:item.sourceTitle||'))throw new Error('CMS conversion of local base landmarks must preserve geographic scope and source metadata.');
if(!cms.includes('Number.isInteger(Number(v.sourcePage))')||!cms.includes('Number(v.sourcePage)<=0'))throw new Error('Historical school source-page validation is too permissive.');
const expectedSubdistricts=['ربع ظلمة','جبل عميقة','بني معين','بني الضاحيتين','صائر','جبل خضراء','نقيل العقاب','الفراعي','السلق','وادي المعقاب','الجعافرة','شباع','الذارحي','التفادي','كومان','الوطئة','قحزة','المشيرق','الصدر','العارضة','بني شبيب','الناحية'];
const uzalStart=app.indexOf('const UZAL_22 = ['),uzalEnd=app.indexOf('];',uzalStart),uzalBlock=uzalStart>=0&&uzalEnd>uzalStart?app.slice(uzalStart,uzalEnd):'';
const catalogDistrictBlock=catalog.slice(catalog.indexOf('const D=['),catalog.indexOf('const PN='));
const appDistrictNames=[...uzalBlock.matchAll(/'([^']+)'/g)].map(x=>x[1]);
const catalogDistrictNames=[...catalogDistrictBlock.matchAll(/^\s*\['([^']+)'/gm)].map(x=>x[1]);
if(JSON.stringify(appDistrictNames)!==JSON.stringify(expectedSubdistricts)||JSON.stringify(catalogDistrictNames)!==JSON.stringify(expectedSubdistricts))throw new Error('App and catalog must use the exact 22-name reference list from the attached report.');
if(JSON.stringify(data.subDistricts.map(x=>x.district_name_ar))!==JSON.stringify(expectedSubdistricts)||data.districtProfile.subdistrict_list_status!=='reference_list_pending_district_approval')throw new Error('Live district list must be the report list and disclose pending district confirmation.');
if(data.relatedHistoricalRegions!==undefined||data.landmarks.some(x=>['p1','p12','p15','jabal-dhi-harran','al-dhuhrah-historic-settlement'].includes(x.id))||data.historyEvents.some(x=>x.id==='h3'))throw new Error('Excluded historic region or removed landmark remains in live content.');
if(knowledge.landmarkRecords.some(x=>x.id==='al-dhuhrah-historic-settlement')||JSON.stringify(knowledge).includes('مدينة الظاهرة')||JSON.stringify(data).includes('قرب قرية ملكان'))throw new Error('The unverified Dhuhrah/Malkan location is still exposed in public Hubaish content.');
if(!app.includes('al-dhuhrah-historic-settlement')||!cms.includes('al-dhuhrah-historic-settlement')||!app.includes('excludedLegacyIds')||!cms.includes('LEGACY_EXCLUDED_IDS'))throw new Error('Legacy cached Dhuhrah records are not excluded from local or CMS snapshots.');
if(/صهبان|Sahban|وادي بناء|Wadi Bina|جبل ذي هران|Jabal Dhi Harran/i.test([app,catalog,features,html,cms].join(' ')))throw new Error('Removed geographic records remain in runtime interface or assistant.');
if(!app.includes('excludedLegacyIds')||!app.includes('excludedLegacyHistoryIds')||!cms.includes('LEGACY_EXCLUDED_IDS'))throw new Error('Saved local and CMS legacy content is not sanitized.');
if(!html.includes('id="unverifiedHistoricalRecordsList"')||html.includes('relatedHistoricalRegionsList'))throw new Error('Unverified location section should remain but related-region panel must be removed.');
if(!html.includes('id="knowledgeLandmarksList"')||!html.includes('id="knowledgeSchoolsList"')||!html.includes('id="knowledgeWorksList"')||!html.includes('id="knowledgePeopleList"')||!html.includes('id="knowledgeFamiliesList"')||!html.includes('id="knowledgeArchiveList"')||!html.includes('id="knowledgeMarketList"'))throw new Error('Knowledge archive panels are incomplete.');
if(!app.includes('bootReport.landmarks < 13'))throw new Error('Boot integrity threshold must match the 13 active core place cards.');
if(knowledge.landmarkRecords?.length!==15||!Array.isArray(knowledge.additionalMosques)||!Array.isArray(knowledge.schools)||!Array.isArray(knowledge.people)||!Array.isArray(knowledge.families)||!Array.isArray(knowledge.archives))throw new Error('Knowledge content must include 15 in-district core landmarks, schools, people, families and archive records.');
if(!html.includes('id="authorSubmissionForm"')||!html.includes('id="familyCvForm"')||!html.includes('id="archiveSubmissionForm"')||!html.includes('name="ownerName"')||!html.includes('id="marketListingForm"')||!html.includes('id="communitySubmissionReview"'))throw new Error('Community submission or admin review forms are incomplete.');
if(!cms.includes('/public/community-submissions')||!cms.includes('/review/community-submissions')||!cms.includes('DEFAULT_WORKER_URL+item.attachmentUrl')||!worker.includes('/public/community-submissions')||!worker.includes('/review/community-submissions')||!worker.includes('ownerName:type==="archive"?ownerName:""')||!worker.includes('actor.role!=="super_admin"'))throw new Error('Community submissions must use the Worker review queue.');
if(!app.includes("window.HubaishKnowledge?.answer?.(question)")||!catalog.includes('window.HubaishKnowledge?.answer?.(question)')||!knowledgeJs.includes('archive-watermarked-canvas'))throw new Error('Knowledge assistant and document viewer are not integrated.');
if(!features.includes('const mergedUzal = baseUzal.slice()'))throw new Error('Stale local storage must not reintroduce obsolete sub-districts.');
if(!html.includes('name="marketCategory"'))throw new Error('Marketplace category control is missing.');
if(!worker.includes('value.type!=="archive"')||!worker.includes('image/svg+xml; charset=utf-8')||!worker.includes('actor.role!=="super_admin"')||!worker.includes('marketCategory:type==="marketplace"?marketCategory:""')||!worker.includes('value.status==="approved"'))throw new Error('Archive watermark, approved-only publication, marketplace category or super-admin review control is missing.');
if(!knowledgeJs.includes("ctx.fillText('أرشيف دليل حبيش الذكي'")||!knowledgeJs.includes("ctx.fillText(item.imageOwner||'صاحب الوثيقة غير محدد',x,y+")||!knowledgeJs.includes('payload.attachment=await filePayload(form,type)')||!knowledgeJs.includes("marketCategory:value('marketCategory')")||knowledgeJs.includes('فتح المرفق المعتمد'))throw new Error('The archive image watermark, second viewer watermark, or protected submission form is incomplete.');
if(!cms.includes('DEFAULT_WORKER_URL+item.attachmentUrl')||!cms.includes('item.marketCategory'))throw new Error('Published archive URL or marketplace category mapping is missing.');
const liveWorkerUrl=cms.match(/const DEFAULT_WORKER_URL\s*=\s*['"]([^'"]+)['"]/);
const liveWorkerHost=liveWorkerUrl?.[1]?.split('://')[1]?.split('/')[0];
if(!liveWorkerHost||!sw.includes(liveWorkerHost))throw new Error('Service Worker does not cache approved archive images from the configured Cloudflare Worker host: '+(liveWorkerHost||'missing Worker URL')+'.');
const archiveImage=await readFile(resolve(root,'www/assets/heritage/1183-wood-inscription.webp'));
if(archiveImage.toString('ascii',0,4)!=='RIFF'||archiveImage.toString('ascii',8,12)!=='WEBP'||archiveImage.length>15000)throw new Error('The branded Marwaha WebP image is missing, invalid or exceeds its size target.');
for(const [file,expected] of [['www/icons/icon-192.png',192],['www/icons/icon-512.png',512]]) {
  const image=await readFile(resolve(root,file));
  if(image.toString('hex',0,8)!=='89504e470d0a1a0a'||image.readUInt32BE(16)!==expected||image.readUInt32BE(20)!==expected)
    throw new Error(file+' must be a valid '+expected+'x'+expected+' PNG.');
}
if(readme.includes('الدخول المباشر الاحتياطي باستخدام GitHub Token')||workerReadme.includes('emergency fallback')||workerReadme.includes('GitHub Personal Access Token login'))throw new Error('Documentation still advertises the removed direct-token login.');
if(!html.includes('upgrade-400.js')||!css.includes('F7F5EE')||!css.includes('0D2B22')||!app.includes("['review','adminTabReview',false]")||!worker.includes('/public/photo-submissions')||!worker.includes('/review/photo-submissions')||!html.includes('cloudPhotoReviewPanel')||!worker.includes('community-submit-rate:')||!html.includes('communitySubmissionReview')||!sw.includes("'upgrade-400.js'"))throw new Error('v1.0.400 theme, locale extensions, offline app shell or visitor photo moderation queue is incomplete.');

const playWorkflow = await read('.github/workflows/google-play-closed-testing.yml');
const playFastfile = await read('fastlane/Fastfile');
const playResolver = await read('scripts/resolve-play-release.py');
const playStoreVerifier = await read('scripts/verify-play-store.mjs');
const playPromoter = await read('scripts/promote-play-draft.py');
const playRetirer = await read('scripts/retire-obsolete-play-draft.py');
const play420Retirer = await read('scripts/retire-preview-419-draft.py');
if (!playWorkflow.includes('workflow_dispatch:') ||
    playWorkflow.includes('pull_request:') ||
    !playWorkflow.includes('  push:') || !playWorkflow.includes('branches: [main]') ||
    !playWorkflow.includes("if: github.ref == 'refs/heads/main'") ||
    !playWorkflow.includes("github.event_name == 'push' && 'preview_draft'") ||
    !playWorkflow.includes("inputs.mode || 'verify_only'") ||
    !playWorkflow.includes('google-github-actions/auth@v3') || playWorkflow.includes('google-github-actions/auth@v2') ||
    !playWorkflow.includes('projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider') ||
    !playWorkflow.includes('dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com') ||
    !playWorkflow.includes('npm run build') ||
    !playWorkflow.includes('node scripts/verify-play-store.mjs --require-screenshots') ||
    !playWorkflow.includes('scripts/resolve-play-release.py') ||
    !playWorkflow.includes('PLAY_RELEASE_STATUS: draft') ||
    !playWorkflow.includes('python3 scripts/resolve-play-release.py --verify-upload') ||
    !playWorkflow.includes('bundle exec fastlane android upload_closed_testing') ||
    !playWorkflow.includes("PLAY_TRACK: Hubaish Closed Test") ||
    !playWorkflow.includes("- preview_draft") ||
    !playWorkflow.includes("- publish_approved_release") ||
    !playWorkflow.includes("PLAY_RELEASE_STATUS: draft") ||
    !playWorkflow.includes("python3 scripts/promote-play-draft.py") ||
    !playWorkflow.includes(".promote-416") ||
    !playWorkflow.includes(".promote-416-retry") ||
    !playWorkflow.includes(".promote-416-final") ||
    !playWorkflow.includes("git cat-file -e") ||
    !playWorkflow.includes("PLAY_EXPECTED_VERSION_CODE") ||
    !playWorkflow.includes("publish_new_release") ||
    !playWorkflow.includes(".publish-418") ||
    !playWorkflow.includes("PLAY_ALLOWED_EXISTING_DRAFT_VERSION_CODE") ||
    !playWorkflow.includes("scripts/retire-obsolete-play-draft.py") ||
    !playWorkflow.includes("Verify completed 418, zero pending drafts") ||
    !playWorkflow.includes(".publish-420") ||
    !playWorkflow.includes("publish_420_release") ||
    !playWorkflow.includes("Verify completed 420, zero pending drafts and unchanged Production") ||
    !playWorkflow.includes("steps.publish-420-release.outputs.release_status") ||
    !playWorkflow.includes("retire-preview-419-draft.py") ||
    !playWorkflow.includes("Retire only an exact 419 preview draft after the clean 420 bundle is signed") ||
    !playResolver.includes("allowed_highest = 419 if draft_records") ||
    !play420Retirer.includes("PREVIEW_CODE = 419") ||
    !play420Retirer.includes("ACTIVE_CODE = 418") ||
    !play420Retirer.includes("No tester list, opt-in configuration, or other track was modified.") ||
    !playResolver.includes('release_mode == "publish_420_release"') ||
    !playResolver.includes("version_code != 420") ||
    !playResolver.includes("may clean up only one exact 419 preview draft") ||
    !playPromoter.includes("prior_completed_codes != [418]") ||
    !playWorkflow.includes(".publish-420") ||
    !playWorkflow.includes("publish_420_release") ||
    !playWorkflow.includes("Verify completed 420, zero pending drafts and unchanged Production") ||
    !playResolver.includes('release_mode == "publish_420_release"') ||
    !playResolver.includes("version_code != 420") ||
    !playResolver.includes("may clean up only one exact 419 preview draft") ||
    !playPromoter.includes("prior_completed_codes != [418]") ||
    !playWorkflow.includes("steps.publish-420-release.outputs.release_status") ||
    !playRetirer.includes("OBSOLETE_DRAFT_CODE = 417") ||
    !playRetirer.includes("EXPECTED_COMPLETED_CODE = 416") ||
    !playRetirer.includes("No testers resource, tester list, opt-in configuration, or other track was read or modified.") ||
    !playRetirer.includes("if production_codes(rows):") ||
    !playPromoter.includes("draft_codes != [expected]") ||
    !playPromoter.includes("prior_completed_codes") ||
    !playPromoter.includes("prior_completed_codes != [416]") ||
    !playPromoter.includes("Replacing the previous completed assignment") ||
    !playPromoter.includes("updated_releases.append(promoted_release)") ||
    !playPromoter.includes("Post-commit read-back") ||
    !playPromoter.includes('actual_status != "completed"') ||
    !playPromoter.includes("completed_after") ||
    playWorkflow.includes("publish_closed_testing") ||
    playWorkflow.includes("approve_draft")) {
  throw new Error('Google Play workflow must upload draft previews on main pushes, require explicit manual approval, use WIF, verify signing and read back the release.');
}
const pythonSyntax = spawnSync('python3', ['-m','py_compile','scripts/patch-android-config.py','scripts/resolve-play-release.py','scripts/promote-play-draft.py','scripts/retire-obsolete-play-draft.py','scripts/retire-preview-419-draft.py'], { encoding: 'utf8' });
if(pythonSyntax.status!==0)throw new Error('Python release/native build script syntax error: '+(pythonSyntax.stderr||pythonSyntax.stdout));
if(!playResolver.includes('version_code = 420')||!playResolver.includes('allowed_highest = 419 if draft_records')||!playPromoter.includes('expected == 420'))throw new Error('One-shot versionCode 420 must skip unused 419, require bundle history to end at 418, and replace only completed 418.');
if (!playWorkflow.includes('status code 429') ||
    !playWorkflow.includes('Too Many Requests') ||
    !playWorkflow.includes('Gradle remained rate-limited after 4 attempts') ||
    !playWorkflow.includes('No AAB was uploaded')) {
  throw new Error('The signed AAB build must retry only Maven Central HTTP 429 and fail safely after bounded retries.');
}
if (!playFastfile.includes('google_play_track_version_codes') ||
    !playFastfile.includes('PLAY_RELEASE_STATUS') ||
    !playFastfile.includes('release_status: release_status') ||
    !playFastfile.includes('closed_testing_track!') ||
    !playFastfile.includes('Only the exact Hubaish Closed Test track is allowed') ||
    !playFastfile.includes('Automated uploads to Hubaish Closed Test must always use draft status.') ||
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

if (!playMonitorWorkflow.includes('workflow_dispatch:') ||
    !playMonitorWorkflow.includes("cron: '0 1 * * *'") ||
    !playMonitorWorkflow.includes('workflow_run:') ||
    !playMonitorWorkflow.includes('Google Play Closed Testing') ||
    !playMonitorWorkflow.includes('google-github-actions/auth@v3') && !playMonitorWorkflow.includes('google-github-actions/auth@v2') ||
    !playMonitorWorkflow.includes('projects/28058491662/locations/global/workloadIdentityPools/github-pool/providers/github-provider') ||
    !playMonitorWorkflow.includes('dalilna-play-automation@dalilna-play-automation-516000.iam.gserviceaccount.com') ||
    !playMonitorWorkflow.includes('scripts/monitor-play-status.py')) {
  throw new Error('Google Play status monitor must be scheduled, manually runnable and WIF-authenticated.');
}
if (!playMonitorScript.includes('EXPECTED_PACKAGE = "com.hubaish.guide"') ||
    !playMonitorScript.includes('EXPECTED_TRACK = "Hubaish Closed Test"') ||
    !playMonitorScript.includes('"latestActiveRelease"') ||
    !playMonitorScript.includes('"latestDraftRelease"') ||
    !playMonitorScript.includes("latest_active = max(active_releases") ||
    !playMonitorScript.includes("latest_draft = max(draft_releases") ||
    playMonitorScript.includes('"versionCode413"') ||
    playMonitorScript.includes('"versionCode414"') ||
    !playMonitorScript.includes('"alternateTracksWithVersionCodes"') ||
    !playMonitorScript.includes('production_codes') ||
    playMonitorScript.includes('session.put(') ||
    playMonitorScript.includes(':commit')) {
  throw new Error('Google Play monitor must inspect release states and alternate tracks without modifying releases.');
}
if (!runtimeAudit.includes('context.setOffline(true)') ||
    !runtimeAudit.includes('navigator.serviceWorker.ready') ||
    !runtimeAudit.includes('[360, 390, 768, 1024]') ||
    !runtimeAudit.includes('if (overflow > 0)') ||
    !runtimeAudit.includes('requestFailures.length') ||
    !runtimeAudit.includes('consoleErrors.length') ||
    !runtimeAudit.includes('mockedSubmissions.length !== 4') ||
    !runtimeAudit.includes('archive-watermarked-canvas') ||
    !runtimeAudit.includes('knowledgeCached') ||
    !runtimeAudit.includes('https://hubaish-cms.baraagpt6.workers.dev') ||
    !runtimeAudit.includes('/health') ||
    !runtimeAudit.includes('/setup/status')) {
  throw new Error('Runtime audit must enforce zero horizontal overflow, zero JS/network errors, interactive search/assistant/forms/archive, offline knowledge assets and Worker health.');
}

if (!cms.includes("https://hubaish-cms.baraagpt6.workers.dev") ||
    !runtimeAudit.includes('attempt <= 6') ||
    !workerUrlResolver.includes('/workers/subdomain') ||
    !workerUrlResolver.includes('/workers/scripts/') ||
    !workerUrlResolver.includes("method: 'POST'") ||
    !workerUrlResolver.includes('process.env.GITHUB_OUTPUT') ||
    !cloudflareDeployWorkflow.includes('scripts/resolve-cloudflare-worker-url.mjs') ||
    !cloudflareDeployWorkflow.includes('steps.worker-url.outputs.base_url') ||
    !workerHealthWorkflow.includes('scripts/resolve-cloudflare-worker-url.mjs') ||
    !workerHealthWorkflow.includes('steps.worker-url.outputs.base_url')) {
  throw new Error('Cloudflare endpoint source, account-subdomain discovery, workers.dev activation or retry safeguards are incomplete.');
}

const profile=data.districtProfile;
if(!profile||profile.area_km2?.value!==228||profile.population?.find(x=>x.year===2004)?.value!==105998||profile.population?.find(x=>x.year===2025)?.value!==162023)throw new Error('District area and year-specific population values are missing.');
if(!profile.population.find(x=>x.year===2025).type.includes('HNRP'))throw new Error('2025 population must remain an HNRP estimate, not a census.');
if(profile.weekly_market?.day_ar!=='الجمعة'||!profile.weekly_market?.verification_note_ar)throw new Error('Weekly market day or local confirmation note is missing.');
if(profile.subdistrict_count!==22||data.subDistricts.length!==22)throw new Error('Hubaish must retain exactly 22 administrative sub-districts.');
if(profile.tribal_context||profile.geographic_disambiguation?.length!==1||profile.geographic_disambiguation[0]?.name_ar!=='مديرية حبيش'||profile.name_origin_hypotheses?.status!=='research_hypotheses')throw new Error('Hubaish-only geographic scope or name-origin caveat is missing.');
const requiredHeritage=['khudad-fort','wuhaza-fortress','yaris-fortress','dahran-fort-bani-wail','jabal-khadra-terraces','al-udadi-fort','musaynia-fort','bayt-al-batul-fort','maghram-khair-fort','bayn-al-dur-dome','al-farawi-mosque-dome','marwaha-mosque','al-jami-mosque','dhulmah-grand-mosque','qubbat-al-zum'];
for(const id of requiredHeritage)if(!data.landmarks.some(x=>x.id===id))throw new Error('A required historical landmark record is missing: '+id);
for(const id of ['p1','p12','p15'])if(app.includes("id: '"+id+"'"))throw new Error('Excluded legacy landmark was reintroduced: '+id);
if(app.includes("id: 'h3'"))throw new Error('Excluded legacy history event was reintroduced.');
if(!data.landmarks.some(x=>x.id==='zawahi-islamic-school'&&x.category==='school'&&x.subject_claims_pending_verification?.length===3))throw new Error('Al-Zawahi attributed curriculum claims must remain provisional.');
const wuhaza=data.landmarks.find(x=>x.id==='hijra-wuhaza-learning-centre');
if(!wuhaza||wuhaza.category!=='school'||wuhaza.status!=='documented'||wuhaza.scope!=='hubaish_district'||!wuhaza.source_text.includes('ص 2329'))throw new Error('Wuhaza learning centre record is invalid.');
if(!Array.isArray(data.educationalRecords)||data.educationalRecords.length<7)throw new Error('Educational evidence catalogue is incomplete.');
for(const id of ['isa-al-rubai-wuhazi','ismail-al-wuhazi','zayd-al-faishi','asad-ibn-wa-il','qasim-ibn-humayr-al-waili','sadiq-mohammed-al-nahi'])if(!data.historicalFigures.some(x=>x.id===id))throw new Error('A required historical figure profile is missing: '+id);
if(!catalog.includes('162,023')||!catalog.includes('Engineer Sadiq Mohammed')||!catalog.includes('Shaykh Qasim ibn Humayr'))throw new Error('Assistant answers or additional profiles were not added to the catalog.');
const zawahiRecord=data.landmarks.find(x=>x.id==='zawahi-islamic-school');
const sadiq=data.historicalFigures.find(x=>x.id==='sadiq-mohammed-al-nahi');
if(!zawahiRecord?.description_ar.includes('عبد الرحمن بن عمران')||!zawahiRecord?.description_ar.includes('يوسف بن علي بن عبيد الله بن الهيثم'))throw new Error('Al-Zawahi student evidence is incomplete.');
if(!sadiq?.biography_ar.includes('شلمبرجر')||sadiq?.biography_ar.includes('أبو العتيق')||sadiq?.lineage_research_status)throw new Error('Sadiq al-Nahi profile must avoid unsupported lineage claims.');

if(!html.includes('id="geoAdminContext"')||!html.includes('id="geoTribalContext"')||!app.includes('geoAdminContext')||!app.includes('geoTribalContext'))throw new Error('Administrative and tribal profile panels are missing.');

console.log('Build check passed: Hubaish 22-name reference list, 16-landmark knowledge archive, moderated community submissions, offline archive assets, four locales and draft-only Android workflow.');
