import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const required = [
  'www/index.html', 'www/styles.css', 'www/app.js', 'www/catalog.js', 'www/features.js', 'www/sw.js',
  'www/assets/styles.css', 'www/assets/app.js', 'www/assets/catalog.js', 'www/assets/features.js',
  'www/manifest.json', 'www/manifest.webmanifest', 'www/icons/icon.svg',
  'www/icons/icon-192.png', 'www/icons/icon-512.png', 'capacitor.config.json',
  'scripts/serve.mjs', '.github/workflows/build-and-deploy.yml'
];
for (const file of required) await access(resolve(root, file));

const html = await readFile(resolve(root, 'www/index.html'), 'utf8');
const app = await readFile(resolve(root, 'www/app.js'), 'utf8');
const catalog = await readFile(resolve(root, 'www/catalog.js'), 'utf8');
const features = await readFile(resolve(root, 'www/features.js'), 'utf8');
const css = await readFile(resolve(root, 'www/styles.css'), 'utf8');
const sw = await readFile(resolve(root, 'www/sw.js'), 'utf8');
const appAsset = await readFile(resolve(root, 'www/assets/app.js'), 'utf8');
const catalogAsset = await readFile(resolve(root, 'www/assets/catalog.js'), 'utf8');
const featuresAsset = await readFile(resolve(root, 'www/assets/features.js'), 'utf8');
const cssAsset = await readFile(resolve(root, 'www/assets/styles.css'), 'utf8');
if (appAsset !== app || catalogAsset !== catalog || featuresAsset !== features || cssAsset !== css) throw new Error('Duplicate public assets in www/assets must exactly match the root app files');

const manifest = JSON.parse(await readFile(resolve(root, 'www/manifest.webmanifest'), 'utf8'));
const manifestJson = JSON.parse(await readFile(resolve(root, 'www/manifest.json'), 'utf8'));
const capacitor = JSON.parse(await readFile(resolve(root, 'capacitor.config.json'), 'utf8'));
const workflow = await readFile(resolve(root, '.github/workflows/build-and-deploy.yml'), 'utf8');

for (const file of ['www/app.js', 'www/catalog.js', 'www/features.js', 'www/sw.js']) {
  const result = spawnSync(process.execPath, ['--check', resolve(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('JavaScript syntax check failed for ' + file + ': ' + (result.stderr || result.stdout));
}


for (const fragment of ['./styles.css', './app.js', './catalog.js', './features.js', './manifest.webmanifest']) {
  if (!html.includes(fragment)) throw new Error(`Missing app reference: ${fragment}`);
}
if (!manifest.name || manifest.start_url !== './' || manifest.scope !== './' || !manifest.icons?.length) throw new Error('PWA manifest is incomplete');
if (JSON.stringify(manifest) !== JSON.stringify(manifestJson)) throw new Error('manifest.json and manifest.webmanifest must match');
if (capacitor.webDir !== 'www' || !capacitor.appId) throw new Error('Capacitor webDir/appId configuration is incomplete');
if (!sw.includes('addAll(APP_SHELL)') || !sw.includes("request.mode === 'navigate'") || !sw.includes("'features.js'") || !sw.includes("'catalog.js'")) throw new Error('Offline app-shell caching is incomplete');
if (!workflow.includes('actions/deploy-pages@v4') || !workflow.includes('assembleDebug') || !workflow.includes('upload-artifact@v4')) throw new Error('Deployment or APK build workflow is incomplete');
if (/\bon(?:click|load|error)\s*=/i.test(html)) throw new Error('Inline event handlers are prohibited');
if (/<script\b(?![^>]*\bsrc=)/i.test(html)) throw new Error('Inline scripts are prohibited');
if (/\bstyle\s*=/i.test(html)) throw new Error('Inline style attributes are prohibited');
if (/\.innerHTML\s*=/.test(app + features)) throw new Error('Unsafe HTML string assignment detected');
if (!css.includes('--bg:#08100d') || !css.includes('--gold:#d4af37') || !css.includes('--green:#34d399')) throw new Error('Expected theme tokens are missing');
for (const feature of ['normalizeArabic', 'renderGlobalSearch', 'renderFavorites', 'sendAiMessage', 'renderUzal', 'renderHistory']) {
  if (!app.includes(`function ${feature}`)) throw new Error(`Required core feature is missing: ${feature}`);
}
for (const lang of ["'AR'", "'EN'", "'TR'", "'FR'"]) if (!app.includes(lang)) throw new Error(`Language support missing: ${lang}`);
if (!features.includes('function renderQuiz') || !features.includes('function submitContribution') || !features.includes('function exportAllBackup')) throw new Error('Feature module is incomplete');
if (!catalog.includes("p19:['وادي نخلة'") || !catalog.includes("h7:{") || !catalog.includes('Muhammad A’id al-Aqab')) throw new Error('Extended landmark and history catalogue missing');
if (!catalog.includes("['بني معين'") || !catalog.includes("['الوطئة (الوطنة)'") || (catalog.match(/\n    \[\['/g)||[]).length !== 10) throw new Error('The 22-district catalogue or ten-question quiz is incomplete');
if (!html.includes('id="referenceList"') || !html.includes('id="communityTag"') || !html.includes('id="translationNotice"')) throw new Error('Interactive hub sections are missing');
for (const key of ['quizArea', 'contributionForm', 'adminPanel', 'favModal', 'detailModal']) if (!html.includes(`id="${key}"`)) throw new Error(`UI section missing: ${key}`);


if (html.includes('id="langToggleBtn"')) throw new Error('A duplicate language switch is still present');
if (!html.includes('id="langSelect"') || !html.includes('id="swUpdateBanner"') || !html.includes('id="explorerProgressMeter"')) throw new Error('Language, update or explorer controls are missing');
for (const key of ['adminAuthGate','adminPinEntry','adminPinChangeForm','adminLockBtn']) if (!html.includes('id="' + key + '"')) throw new Error('Admin lock control missing: ' + key);
if (!features.includes('PBKDF2') || !features.includes('function verifyAdminPin') || !features.includes('function changeAdminPin') || !features.includes('function markExplored') || !features.includes('function renderSeasonGuide')) throw new Error('Admin PIN or explorer features are incomplete');
if (!app.includes("window.HubaishIcon = heritageIcon")) throw new Error('Heritage icon helper is not exposed');
if (!css.includes('left:16px!important') || !css.includes('width:46px!important') || !css.includes('right:auto!important')) throw new Error('The assistant button must be fixed at 46px on the left');
if (!sw.includes('hubaish-guide-v3.1.0') || !sw.includes("event.data?.type === 'SKIP_WAITING'") || !sw.includes('fetch(request)')) throw new Error('Seamless update service worker is incomplete');
if ((app.match(/\{\s*id:\s*['"]p\d+['"]/g) || []).length < 16) throw new Error('At least 16 landmark records are required');
if ((app.match(/\{\s*id:\s*['"]h\d+['"]/g) || []).length < 6) throw new Error('At least 6 history milestones are required');
for (const key of ['KEYSTORE_BASE64','KEYSTORE_PASSWORD','KEY_ALIAS','KEY_PASSWORD']) if (!workflow.includes('secrets.' + key)) throw new Error('Android signing secret mapping is incomplete: ' + key);
if (!workflow.includes('assembleRelease') || !workflow.includes('GITHUB_RUN_NUMBER') || !workflow.includes('softprops/action-gh-release@v2') || !workflow.includes("needs.build-android.outputs.signed == 'true'")) throw new Error('Android versioning and signed-release workflow is incomplete');

for (const [file, expected] of [['www/icons/icon-192.png', 192], ['www/icons/icon-512.png', 512]]) {
  const image = await readFile(resolve(root, file));
  if (image.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error(`${file} is not a PNG`);
  if (image.readUInt32BE(16) !== expected || image.readUInt32BE(20) !== expected) throw new Error(`${file} must be ${expected}x${expected}`);
}
console.log(`Build check passed. ${required.length} required files found; PWA manifests, offline shell, Capacitor, workflow, themes, languages, core UI and icon dimensions verified.`);
