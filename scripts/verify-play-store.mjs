import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = path => readFile(resolve(root, path), 'utf8');
const app = JSON.parse(await read('capacitor.config.json'));
if (app.appId !== 'com.hubaish.guide') throw new Error('Package ID must be com.hubaish.guide.');
for (const locale of ['ar', 'en-US']) {
  const base = `fastlane/metadata/android/${locale}`;
  const fields = await Promise.all(['title.txt','short_description.txt','full_description.txt','changelogs/default.txt'].map(name => read(`${base}/${name}`)));
  const [title, short, full, notes] = fields.map(value => value.trim());
  if (!title || [...title].length > 30) throw new Error(`${locale} title must be 1-30 chars.`);
  if (!short || [...short].length > 80) throw new Error(`${locale} short description must be 1-80 chars.`);
  if (!full || [...full].length > 4000) throw new Error(`${locale} full description must be 1-4000 chars.`);
  if (!notes || [...notes].length > 500) throw new Error(`${locale} release notes must be 1-500 chars.`);
}
async function checkPng(path, w, h, colorType) {
  const data = await readFile(resolve(root, path));
  if (data.toString('hex', 0, 8) !== '89504e470d0a1a0a' || data.readUInt32BE(16) !== w || data.readUInt32BE(20) !== h || data[25] !== colorType) throw new Error(`Invalid Google Play graphic: ${path}`);
  if (path.endsWith('/icon.png') && data.length > 1024 * 1024) throw new Error(`${path} exceeds Google Play's 1 MB icon limit.`);
}
for (const locale of ['ar','en-US']) {
  const base = `fastlane/metadata/android/${locale}/images`;
  await checkPng(`${base}/icon.png`, 512, 512, 6);
  await checkPng(`${base}/featureGraphic.png`, 1024, 500, 2);
}
if (process.argv.includes('--require-screenshots')) {
  for (const locale of ['ar','en-US']) {
    const dir = resolve(root, `fastlane/metadata/android/${locale}/images/phoneScreenshots`);
    for (const name of ['01-home.png','02-history.png','03-landmarks.png','04-sub-districts.png']) {
      const file = resolve(dir, name); await stat(file);
      const data = await readFile(file); const w = data.readUInt32BE(16), h = data.readUInt32BE(20);
      if (data.toString('hex', 0, 8) !== '89504e470d0a1a0a' || data[25] !== 2 || w !== 1080 || h !== 1920) throw new Error(`Invalid screenshot: ${locale}/${name}`);
    }
  }
}
console.log('PASS: bilingual listing limits, package ID, RGBA icon, RGB feature graphic' + (process.argv.includes('--require-screenshots') ? ', and eight phone screenshots.' : '.'));
