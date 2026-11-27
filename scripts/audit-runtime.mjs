import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4174;
const baseUrl = 'http://127.0.0.1:' + port;
const workerUrl = 'https://hubaish-cms.baraag6.workers.dev';
const server = spawn(process.execPath, [resolve(root, 'scripts/serve.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1200) });
      if (response.ok) return;
    } catch {}
    await delay(300);
  }
  throw new Error('Local preview server did not start. ' + serverOutput);
}

async function checkWorker(path) {
  try {
    const response = await fetch(workerUrl + path, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000)
    });
    const body = await response.json();
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + JSON.stringify(body).slice(0, 300));
    if (path === '/health' && body.ok !== true) throw new Error('Worker health checks report degraded: ' + JSON.stringify(body.checks));
    if (path === '/setup/status' && typeof body.setupRequired !== 'boolean') throw new Error('Worker setup response is invalid.');
    return { ok: true, status: response.status, ...(path === '/health' ? { checks: body.checks } : { setupRequired: body.setupRequired }) };
  } catch (error) {
    const cause = error?.cause;
    const detail = [error?.name, error?.message, cause?.code, cause?.message].filter(Boolean).join(' | ');
    console.warn('WARN: Cloudflare Worker ' + path + ' health check failed: ' + detail);
    return { ok: false, error: detail };
  }
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const started = Date.now();
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response?.ok()) throw new Error('App shell returned HTTP ' + (response?.status() ?? 'no response'));
  await page.locator('#view-home.active').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#globalSearchInput').waitFor({ state: 'visible', timeout: 10000 });

  // Verify the language picker and navigation without changing persistent content.
  await page.locator('#languagePickerButton').click();
  await page.locator('[data-language="EN"]').click();
  await page.waitForFunction(() => document.documentElement.lang.toLowerCase() === 'en', { timeout: 10000 });
  await page.locator('.nav-btn[data-tab="history"]').click();
  await page.locator('#view-history.active').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('.nav-btn[data-tab="places"]').click();
  await page.locator('#view-places.active').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('.nav-btn[data-tab="home"]').click();
  await page.locator('#view-home.active').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#languagePickerButton').click();
  await page.locator('[data-language="AR"]').click();
  await page.waitForFunction(() => document.documentElement.lang.toLowerCase() === 'ar', { timeout: 10000 });

  // Common mobile and tablet widths.
  const layouts = [];
  for (const width of [360, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: width < 500 ? 800 : 900 });
    const size = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    const overflow = Math.max(size.document, size.body) - size.viewport;
    layouts.push({ width, overflowPx: overflow });
    if (overflow > 16) throw new Error('Horizontal overflow ' + overflow + 'px at viewport ' + width + 'px.');
  }

  // Wait for the service worker, then reload once to attach its controller.
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const registration = await navigator.serviceWorker.ready;
    return { supported: true, state: registration.active?.state || 'inactive' };
  });
  if (!swReady.supported || swReady.state !== 'activated') throw new Error('Service Worker did not reach activated state.');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#view-home.active').waitFor({ state: 'visible', timeout: 10000 });
  const cacheState = await page.evaluate(async () => {
    const names = await caches.keys();
    const appCache = names.find(name => name.startsWith('hubaish-guide-'));
    if (!appCache) return { names, appCache: null, indexCached: false, assetCount: 0 };
    const cache = await caches.open(appCache);
    const keys = await cache.keys();
    return {
      names,
      appCache,
      indexCached: keys.some(request => new URL(request.url).pathname.endsWith('/index.html')),
      assetCount: keys.length
    };
  });
  if (!cacheState.appCache || !cacheState.indexCached || cacheState.assetCount < 10) {
    throw new Error('Offline shell cache is incomplete: ' + JSON.stringify(cacheState));
  }

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('#view-home.active').waitFor({ state: 'visible', timeout: 10000 });
  const offlineHome = await page.locator('.hero-title').textContent();
  if (!offlineHome?.trim()) throw new Error('Home view is not rendered while offline.');
  await context.setOffline(false);

  if (pageErrors.length) throw new Error('Uncaught browser errors: ' + pageErrors.join(' | '));

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return nav ? {
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadEventMs: Math.round(nav.loadEventEnd),
      transferBytes: nav.transferSize || null
    } : null;
  });
  console.log('PASS: responsive, language, navigation, service-worker cache and offline navigation checks.');
  console.log(JSON.stringify({
    appShellStatus: response.status,
    initialReadyMs: Date.now() - started,
    timing,
    layouts,
    serviceWorker: swReady,
    cache: cacheState,
    offlineHome: offlineHome.trim(),
    browserErrors: pageErrors
  }, null, 2));
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}

// The health endpoint uses a short-lived KV key and removes it in a finally block.
const workerChecks = await Promise.all([checkWorker('/health'), checkWorker('/setup/status')]);
console.log('CLOUDFLARE_WORKER_CHECKS=' + JSON.stringify(workerChecks));
if (!workerChecks.every(check => check.ok)) {
  console.warn('::warning::Cloudflare Worker is degraded or unreachable. The local/offline content fallback remains available.');
}
