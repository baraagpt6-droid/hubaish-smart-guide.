import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const required = [
  'www/index.html', 'www/styles.css', 'www/app.js', 'www/catalog.js', 'www/features.js',
  'www/github-cms.js', 'www/data/live-content.json', 'www/sw.js', 'cloudflare-worker/worker.js', 'cloudflare-worker/wrangler.toml', 'cloudflare-worker/README.md',
  'www/assets/styles.css', 'www/assets/app.js', 'www/assets/catalog.js', 'www/assets/features.js',
  'www/manifest.json', 'www/manifest.webmanifest', 'www/icons/icon.svg',
  'www/icons/icon-192.png', 'www/icons/icon-512.png', 'www/icons/apple-touch-icon.png', 'www/icons/favicon-32.png', 'www/icons/photo-fallback.svg', 'capacitor.config.json',
  'scripts/generate-icons.py', 'scripts/apply-android-icons.py', 'scripts/serve.mjs', 'cloudflare-worker/worker.js', 'cloudflare-worker/wrangler.toml', '.github/workflows/build-and-deploy.yml'
];
for (const file of required) await access(resolve(root, file));

const read = async file => readFile(resolve(root, file), 'utf8');
const html = await read('www/index.html');
const app = await read('www/app.js');
const catalog = await read('www/catalog.js');
const features = await read('www/features.js');
const githubCms = await read('www/github-cms.js');
const css = await read('www/styles.css');
const sw = await read('www/sw.js');
const data = JSON.parse(await read('www/data/live-content.json'));
const appAsset = await read('www/assets/app.js');
const catalogAsset = await read('www/assets/catalog.js');
const featuresAsset = await read('www/assets/features.js');
const cssAsset = await read('www/assets/styles.css');
if (appAsset !== app || catalogAsset !== catalog || featuresAsset !== features || cssAsset !== css) {
  throw new Error('Duplicate Android web assets must exactly match the source app files.');
}

const manifest = JSON.parse(await read('www/manifest.webmanifest'));
const manifestJson = JSON.parse(await read('www/manifest.json'));
const capacitor = JSON.parse(await read('capacitor.config.json'));
const workflow = await read('.github/workflows/build-and-deploy.yml');

for (const file of ['www/app.js', 'www/catalog.js', 'www/features.js', 'www/github-cms.js', 'www/sw.js']) {
  const result = spawnSync(process.execPath, ['--check', resolve(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('JavaScript syntax check failed for ' + file + ': ' + (result.stderr || result.stdout));
}

for (const fragment of ['./styles.css', './app.js', './catalog.js', './features.js', './github-cms.js', './manifest.webmanifest']) {
  if (!html.includes(fragment)) throw new Error('Missing app reference: ' + fragment);
}
if (!html.includes('https://*.workers.dev') || !html.includes('https://api.github.com') || !html.includes('https://raw.githubusercontent.com') ||
    !html.includes('https://api.mymemory.translated.net')) throw new Error('CSP does not allow GitHub JSON CMS or translation requests.');
if (html.includes('supabase') || app.includes('supabase') || features.includes('supabase') ||
    catalog.includes('supabase') || githubCms.includes('supabase') || sw.includes('supabase')) {
  throw new Error('Supabase remnants remain in the shipped application.');
}
if (!html.includes('<script src="./github-cms.js" defer></script>') || html.includes('./cloud.js') || html.includes('supabase-config.js')) {
  throw new Error('The app must load the GitHub CMS module and no retired cloud module.');
}
if (!manifest.name || manifest.start_url !== './' || manifest.scope !== './' || !manifest.icons?.length) {
  throw new Error('PWA manifest is incomplete.');
}
if (JSON.stringify(manifest) !== JSON.stringify(manifestJson)) throw new Error('PWA manifests must match.');
if (capacitor.webDir !== 'www' || !capacitor.appId) throw new Error('Capacitor webDir/appId configuration is incomplete.');

const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicateHtmlIds = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
if (duplicateHtmlIds.length) throw new Error('Duplicate HTML id values: ' + duplicateHtmlIds.join(', '));
for (const source of [app, features]) {
  const directBindings = [...source.matchAll(/getElementById\(['"]([^'"]+)['"]\)\s*\.addEventListener/g)].map(match => match[1]);
  const missingBindings = directBindings.filter(id => !html.includes('id="' + id + '"'));
  if (missingBindings.length) throw new Error('Event bindings target missing HTML elements: ' + missingBindings.join(', '));
}
for (const id of ['historyList','placesList','uzalList','peopleList','referenceList','quizArea','langSelect',
  'cloudAdminForm','cloudAdminPassword','cloudContentForm','cloudContentList','cloudStatus','cloudAdminPanel',
  'cloudRefreshBtn','cloudAdminLogoutBtn','cloudRecordType','cloudTranslateBtn','cloudContentClearBtn']) {
  if (!html.includes('id="' + id + '"')) throw new Error('Required UI container is missing: ' + id);
}
for (const type of ['landmark','history_event','sub_district','sub_district_update','historical_figure','community_link']) {
  if (!html.includes('value="' + type + '"')) throw new Error('GitHub CMS content type is missing: ' + type);
}
if (!html.includes('GitHub Personal Access Token') || !html.includes('Fine-grained')) throw new Error('Session-only GitHub token guidance is missing.');
if (/<script\b(?![^>]*\bsrc=)/i.test(html)) throw new Error('Inline scripts are prohibited.');
if (/\bon(?:click|load|error)\s*=/i.test(html)) throw new Error('Inline event handlers are prohibited.');
if (/\bstyle\s*=/i.test(html)) throw new Error('Inline style attributes are prohibited.');
if (/\.innerHTML\s*=/.test(app + features + catalog + githubCms)) throw new Error('Unsafe HTML string assignment detected.');

for (const key of ['landmarks','historyEvents','subDistrictUpdates','subDistricts','historicalFigures','communityLinks']) {
  if (!Array.isArray(data[key])) throw new Error('GitHub live-content.json is missing collection: ' + key);
}
if (data.subDistricts.length !== 22) throw new Error('GitHub live-content.json must include 22 translated sub-district profiles.');
if (data.schemaVersion !== 1) throw new Error('Unsupported GitHub live-content.json schema version.');
if (!githubCms.includes('raw.githubusercontent.com') || !githubCms.includes('api.github.com/repos/') ||
    !githubCms.includes("method:'PUT'") || !githubCms.includes('/contents/') || !githubCms.includes("cache:'no-store'")) {
  throw new Error('GitHub raw JSON polling or Contents API publishing is incomplete.');
}
if (!githubCms.includes('const CACHE_KEY=') || !githubCms.includes('localStorage.setItem(CACHE_KEY') ||
    !githubCms.includes('function applyCached') || !githubCms.includes('getDistrictProfile')) {
  throw new Error('Offline cache or live district profile merge is incomplete.');
}
if (!githubCms.includes('githubToken') || !githubCms.includes('Authorization:') || !githubCms.includes('Bearer ') ||
    !githubCms.includes('githubToken=\'\'') || /localStorage\.(?:setItem|getItem)\([^)]*githubToken/i.test(githubCms)) {
  throw new Error('GitHub token must remain in memory and be sent only as an API authorization header.');
}
const workerSource = await read('cloudflare-worker/worker.js');
const workerSyntax = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: workerSource, encoding: 'utf8' });
if (workerSyntax.status !== 0) throw new Error('Cloudflare Worker syntax check failed: ' + (workerSyntax.stderr || workerSyntax.stdout));
const worker = await read('cloudflare-worker/worker.js');
const workerConfig = await read('cloudflare-worker/wrangler.toml');
const expectedWorkerOrigins = 'ALLOWED_ORIGIN = "https://baraagpt6-droid.github.io,http://localhost,http://localhost:4173"';
if (!workerConfig.includes(expectedWorkerOrigins)) {
  throw new Error('Cloudflare Worker CORS must allow the production GitHub Pages origin and http://localhost.');
}
if (!worker.includes('filter(x=>x&&x!=="*")') || worker.includes('"Access-Control-Allow-Origin":"*"')) {
  throw new Error('Cloudflare Worker CORS must reject wildcard origins and use an explicit allowlist.');
}
if (!worker.includes('path==="/api/health"') || !worker.includes('githubContentsRead') ||
    !worker.includes('sessionSecret') || !worker.includes('healthKV')) {
  throw new Error('Cloudflare Worker health endpoint must check KV, GitHub contents and SESSION_SECRET.');
}
if (!githubCms.includes('imageUrl:val(\'cloudImageUrl\')') ||
    !githubCms.includes('function updateImagePreview') || !githubCms.includes('image_url:safeUrl(v.imageUrl)') ||
    !html.includes('id="cloudImagePreview"') || !html.includes('id="cloudImageUrl"')) {
  throw new Error('CMS image URL, preview or publishing workflow is incomplete.');
}
if (!html.includes('id="imageLightbox"') || !html.includes('data-lightbox-src') ||
    !app.includes('photo.loading') || !sw.includes('REMOTE_IMAGE_HOSTS') ||
    !sw.includes('icons/apple-touch-icon.png')) {
  throw new Error('Image lazy loading, lightbox or offline image caching is incomplete.');
}
if (!html.includes('id="cloudAdminStats"') || !html.includes('id="cloudContentSearch"') ||
    !githubCms.includes('function renderAdminStats') || !githubCms.includes('cloudContentFilter')) {
  throw new Error('CMS admin dashboard counters and content search are incomplete.');
}
if (!html.includes('upload.wikimedia.org') || !html.includes('al-jandprovince.com') ||
    !html.includes('hekmahyemanya.com') || !html.toLowerCase().includes('cc by-sa') ) {
  throw new Error('Photo gallery must include verified sources and license attribution.');
}
const frontendWorkerContracts = [
  "fetch(value+'/setup/status'",
  "fetch(endpoint+'/setup'",
  "fetch(endpoint+'/auth/login'",
  "workerRequest('/auth/me'",
  "workerRequest('/admin/users'",
  "workerRequest('/admin/audit'",
  "workerRequest('/content'"
];
for (const contract of frontendWorkerContracts) {
  if (!githubCms.includes(contract)) throw new Error('Frontend Cloudflare Worker endpoint contract is missing: ' + contract);
}
if (!githubCms.includes('result.bootstrapKeyConfigured===false') ||
    !githubCms.includes('BOOTSTRAP_KEY غير مضبوط في Cloudflare Secrets')) {
  throw new Error('First-admin setup UI must detect a missing BOOTSTRAP_KEY before submitting the form.');
}
if (!worker.includes('/setup/status') || !worker.includes('/setup') || !worker.includes('https://baraagpt6-droid.github.io') || !worker.includes('capacitor://localhost') || !worker.includes('http://localhost') || !worker.includes('https://localhost') || !worker.includes('ALLOWED_ORIGIN') || !worker.includes('/auth/login') || !worker.includes('/admin/users') || !worker.includes('/admin/audit') ||
    !worker.includes('PBKDF2') || !worker.includes('GITHUB_TOKEN') || !worker.includes('SESSION_SECRET') ||
    !worker.includes('super_admin') || !worker.includes('editor') || !worker.includes('updatedBy')) {
  throw new Error('Cloudflare Worker multi-admin authentication, RBAC or audit support is incomplete.');
}
const setupFormStart = html.indexOf('<form id="workerSetupForm"');
const setupFormEnd = html.indexOf('</form>', setupFormStart);
const setupForm = setupFormStart >= 0 && setupFormEnd > setupFormStart ? html.slice(setupFormStart, setupFormEnd) : '';
const setupFieldIds = [...setupForm.matchAll(/id="(workerSetupEndpoint|workerBootstrapKey|workerSetupUsername|workerSetupPassword)"/g)].map(m => m[1]);
if (setupFieldIds.join(',') !== 'workerSetupEndpoint,workerBootstrapKey,workerSetupUsername,workerSetupPassword') {
  throw new Error('First-admin setup must show exactly four required fields.');
}
if (!githubCms.includes("localStorage.setItem('hubaish_direct_github_token'") ||
    !githubCms.includes("localStorage.getItem('hubaish_direct_github_token')") ||
    !githubCms.includes("localStorage.setItem('hubaish_worker_url'")) {
  throw new Error('Remembered direct GitHub token or Worker URL settings are missing.');
}
if (!githubCms.includes('workerLoginForm') || !githubCms.includes('hubaish_worker_session') ||
    !githubCms.includes('workerToken') || !githubCms.includes('cloudCreateAdminForm') ||
    !githubCms.includes('async function firstAdminSetup') || !githubCms.includes('/setup/status') ||
    !html.includes('id="workerSetupForm"') || !html.includes('id="workerSetupEndpoint"') ||
    !html.includes('id="workerBootstrapKey"') || !html.includes('id="workerSetupUsername"') ||
    !html.includes('id="workerSetupPassword"') || !html.includes('إنشاء حساب المشرف العام وتفعيل الربط') ||
    !html.includes('id="workerRemember"') || !html.includes('id="cloudTokenRemember"') ||
    !html.includes('id="cloudAuditList"') || !html.includes('id="cloudAdminUsersList"')) {
  throw new Error('Cloudflare Worker login, remember-me or super-admin UI is incomplete.');
}
if (!githubCms.includes('function fillTranslations') || !githubCms.includes('api.mymemory.translated.net')) {
  throw new Error('Four-language translation workflow is missing.');
}
if (!features.includes('function exportAllBackup') || !features.includes('function importAllBackup') ||
    !features.includes('liveContent:window.HubaishCloud?.exportData?.()') ||
    !features.includes('window.HubaishCloud.importBackup(parsed.liveContent)') ||
    !githubCms.includes('exportData:()=>deepCopy(documentData)') || !githubCms.includes('async function importBackup(value)') ||
    !html.includes('id="exportJsonBtn"') || !html.includes('id="importJsonInput"')) {
  throw new Error('Complete local and GitHub CMS JSON backup/restore is missing.');
}
if (!app.includes('window.HubaishRuntime.bootReport') || !app.includes('landmarks < 19') ||
    !app.includes('history < 7') || !app.includes('subDistricts < 22') ||
    !app.includes('people < 4') || !app.includes('references < 1') || !app.includes('quiz < 10')) {
  throw new Error('Core catalogue boot checks are missing.');
}
const districtStart = catalog.indexOf('const D=[');
const districtEnd = catalog.indexOf('const PN=', districtStart);
const districtBlock = districtStart >= 0 && districtEnd > districtStart ? catalog.slice(districtStart, districtEnd) : '';
const districtRows = [...districtBlock.matchAll(/^\s*\['/gm)].length;
if (districtRows !== 22) throw new Error('The core sub-district directory must contain 22 names.');
const personStart = catalog.indexOf('const PEOPLE=[');
const personEnd = catalog.indexOf('const REFS=', personStart);
const personBlock = personStart >= 0 && personEnd > personStart ? catalog.slice(personStart, personEnd) : '';
if ([...personBlock.matchAll(/^\s*\{n:/gm)].length !== 4) throw new Error('The four baseline historical figures are incomplete.');
const refsStart = catalog.indexOf('const REFS=[');
const refsEnd = catalog.indexOf('const QUIZ=', refsStart);
const refsBlock = refsStart >= 0 && refsEnd > refsStart ? catalog.slice(refsStart, refsEnd) : '';
if ([...refsBlock.matchAll(/^\s*\{t:/gm)].length !== 4) throw new Error('The four baseline references are incomplete.');
const quizStart = catalog.indexOf('const QUIZ=[');
const quizEnd = catalog.indexOf('  ];', quizStart);
const quizBlock = quizStart >= 0 && quizEnd > quizStart ? catalog.slice(quizStart, quizEnd) : '';
if ([...quizBlock.matchAll(/^\s*\[\[/gm)].length !== 10) throw new Error('The ten-question quiz is incomplete.');
const placeTranslations = catalog.match(/const PN=\{([\s\S]*?)\n  \};/);
if (!placeTranslations || [...placeTranslations[1].matchAll(/^\s*p\d+:\[/gm)].length !== 19) {
  throw new Error('The 19 landmark translations are incomplete.');
}
const locationStart = catalog.indexOf('const PLOC={');
const locationEnd = locationStart >= 0 ? catalog.indexOf('\n  };', locationStart) : -1;
const locationBlock = locationStart >= 0 && locationEnd > locationStart ? catalog.slice(locationStart, locationEnd) : '';
if (locationBlock.split('\n').filter(line => line.trim().startsWith('p') && line.includes(':[')).length !== 19 ||
    !catalog.includes('if(!item.cmsOverride&&PLOC[item.id])copy.loc=PLOC[item.id][index]')) {
  throw new Error('All 19 landmark locations must be localized in four languages.');
}
const historyStart = catalog.indexOf('const HISTORY={');
const historyEnd = catalog.indexOf('const HISTORY_BODY=', historyStart);
const historyBlock = historyStart >= 0 && historyEnd > historyStart ? catalog.slice(historyStart, historyEnd) : '';
if ([...historyBlock.matchAll(/\bh[1-7]:\{/g)].length !== 7) throw new Error('The seven history milestones are incomplete.');

if (!css.includes('--bg:#08100d') || !css.includes('--gold:#d4af37') || !css.includes('--green:#34d399')) {
  throw new Error('Expected theme tokens are missing.');
}
if (!css.includes('left:16px!important') || !css.includes('width:46px!important') || !css.includes('right:auto!important')) {
  throw new Error('The assistant button must remain fixed at left:16px.');
}
if (!sw.includes('hubaish-guide-v3.7.0') || !sw.includes("'github-cms.js'") ||
    !sw.includes("'data/live-content.json'") || !sw.includes("event.data?.type === 'SKIP_WAITING'") ||
    sw.includes('supabase')) throw new Error('Offline app shell does not include the GitHub CMS or live JSON file.');
if (!workflow.includes('actions/deploy-pages@v4') || !workflow.includes('assembleDebug') ||
    !workflow.includes('upload-artifact@v4') || !workflow.includes('assembleRelease')) {
  throw new Error('Website deployment and Android release workflow is incomplete.');
}
for (const [file, expected] of [['www/icons/icon-192.png',192],['www/icons/icon-512.png',512]]) {
  const image=await readFile(resolve(root,file));
  if(image.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error(file+' is not a PNG.');
  if(image.readUInt32BE(16)!==expected||image.readUInt32BE(20)!==expected)throw new Error(file+' must be '+expected+'x'+expected+'.');
}
console.log('Build check passed. GitHub JSON CMS, token memory handling, offline cache, 19 landmarks, 22 districts, 7 history events, 4 figures, 4 references, 10 quiz questions, four-language landmark data, PWA and Android assets verified.');
