import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const required = [
  'www/index.html', 'www/styles.css', 'www/app.js', 'www/features.js', 'www/sw.js',
  'www/manifest.json', 'www/manifest.webmanifest', 'www/icons/icon.svg',
  'www/icons/icon-192.png', 'www/icons/icon-512.png', 'capacitor.config.json',
  'scripts/serve.mjs', '.github/workflows/build-and-deploy.yml'
];
for (const file of required) await access(resolve(root, file));

const html = await readFile(resolve(root, 'www/index.html'), 'utf8');
const app = await readFile(resolve(root, 'www/app.js'), 'utf8');
const features = await readFile(resolve(root, 'www/features.js'), 'utf8');
const css = await readFile(resolve(root, 'www/styles.css'), 'utf8');
const sw = await readFile(resolve(root, 'www/sw.js'), 'utf8');
const manifest = JSON.parse(await readFile(resolve(root, 'www/manifest.webmanifest'), 'utf8'));
const manifestJson = JSON.parse(await readFile(resolve(root, 'www/manifest.json'), 'utf8'));
const capacitor = JSON.parse(await readFile(resolve(root, 'capacitor.config.json'), 'utf8'));
const workflow = await readFile(resolve(root, '.github/workflows/build-and-deploy.yml'), 'utf8');

for (const fragment of ['./styles.css', './app.js', './features.js', './manifest.webmanifest']) {
  if (!html.includes(fragment)) throw new Error(`Missing app reference: ${fragment}`);
}
if (!manifest.name || manifest.start_url !== './' || manifest.scope !== './' || !manifest.icons?.length) throw new Error('PWA manifest is incomplete');
if (JSON.stringify(manifest) !== JSON.stringify(manifestJson)) throw new Error('manifest.json and manifest.webmanifest must match');
if (capacitor.webDir !== 'www' || !capacitor.appId) throw new Error('Capacitor webDir/appId configuration is incomplete');
if (!sw.includes('addAll(APP_SHELL)') || !sw.includes("request.mode === 'navigate'") || !sw.includes("'features.js'")) throw new Error('Offline app-shell caching is incomplete');
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
for (const key of ['quizArea', 'contributionForm', 'adminPanel', 'favModal', 'detailModal']) if (!html.includes(`id="${key}"`)) throw new Error(`UI section missing: ${key}`);

for (const [file, expected] of [['www/icons/icon-192.png', 192], ['www/icons/icon-512.png', 512]]) {
  const image = await readFile(resolve(root, file));
  if (image.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error(`${file} is not a PNG`);
  if (image.readUInt32BE(16) !== expected || image.readUInt32BE(20) !== expected) throw new Error(`${file} must be ${expected}x${expected}`);
}
console.log(`Build check passed. ${required.length} required files found; PWA manifests, offline shell, Capacitor, workflow, themes, languages, core UI and icon dimensions verified.`);
