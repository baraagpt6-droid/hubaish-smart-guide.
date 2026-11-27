import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = resolve(root, 'play-store/feature-graphic.svg');
const output = resolve(root, 'play-store/feature-graphic.png');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(svg).href, { waitUntil: 'load', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, type: 'png', fullPage: false, animations: 'disabled' });
} finally {
  await browser.close();
}
