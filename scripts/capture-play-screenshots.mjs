import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.PLAY_SCREENSHOT_URL || 'http://127.0.0.1:4173';
const server = spawn(process.execPath, [resolve(root, 'scripts/serve.mjs')], { cwd: root, env: { ...process.env, PORT: '4173' }, stdio: ['ignore', 'pipe', 'pipe'] });
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });
async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1500) }); if (response.ok) return; } catch {}
    await delay(500);
  }
  throw new Error('Local preview server did not start. ' + serverOutput);
}
const tabs = [{ id: 'home', file: '01-home.png' }, { id: 'history', file: '02-history.png' }, { id: 'places', file: '03-landmarks.png' }, { id: 'uzal', file: '04-sub-districts.png' }];
try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    for (const locale of ['ar', 'en-US']) {
      const lang = locale === 'ar' ? 'AR' : 'EN';
      const outputDir = resolve(root, `fastlane/metadata/android/${locale}/images/phoneScreenshots`);
      await mkdir(outputDir, { recursive: true });
      const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.locator('#view-home').waitFor({ state: 'visible', timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
      if (lang === 'EN') {
        await page.locator('#languagePickerButton').click();
        await page.locator('[data-language="EN"]').click();
        await page.waitForFunction(() => document.documentElement.lang.toLowerCase() === 'en');
      }
      for (const tab of tabs) {
        if (tab.id !== 'home') {
          await page.locator(`.nav-btn[data-tab="${tab.id}"]`).click();
          await page.locator(`#view-${tab.id}.active`).waitFor({ state: 'visible', timeout: 10000 });
        }
        await page.waitForTimeout(350);
        await page.screenshot({ path: resolve(outputDir, tab.file), type: 'png', fullPage: false, animations: 'disabled' });
      }
      await context.close();
    }
  } finally { await browser.close(); }
} finally { server.kill('SIGTERM'); }
