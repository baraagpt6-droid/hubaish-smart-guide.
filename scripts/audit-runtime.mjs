import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4174;
const baseUrl = 'http://127.0.0.1:' + port;
const workerUrl = 'https://hubaish-cms.baraagpt6.workers.dev';
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
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const response = await fetch(workerUrl + path, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });
      const raw = await response.text();
      let body;
      try { body = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error('HTTP ' + response.status + ' returned non-JSON content.'); }
      if (response.status !== 200) {
        throw new Error('Expected HTTP 200, received HTTP ' + response.status + ': ' + JSON.stringify(body).slice(0, 300));
      }
      if (path === '/health') {
        if (body.ok !== true) throw new Error('/health reports degraded checks: ' + JSON.stringify(body.checks));
        for (const key of ['kv', 'githubContentsRead', 'sessionSecret']) {
          if (body.checks?.[key]?.ok !== true) {
            throw new Error('/health check failed for ' + key + ': ' + (body.checks?.[key]?.error || 'missing or not ok'));
          }
        }
      }
      if (path === '/setup/status' && typeof body.setupRequired !== 'boolean') {
        throw new Error('/setup/status returned an invalid setupRequired field.');
      }
      return {
        ok: true,
        status: response.status,
        attempts: attempt,
        ...(path === '/health' ? { checks: body.checks } : { setupRequired: body.setupRequired })
      };
    } catch (error) {
      lastError = error;
      const cause = error?.cause;
      const detail = [error?.name, error?.message, cause?.code, cause?.message].filter(Boolean).join(' | ');
      console.warn('WARN: Cloudflare Worker ' + path + ' attempt ' + attempt + '/6 failed: ' + detail);
      if (attempt < 6) await delay(Math.min(1000 * (2 ** (attempt - 1)), 10000));
    }
  }
  const cause = lastError?.cause;
  const detail = [lastError?.name, lastError?.message, cause?.code, cause?.message].filter(Boolean).join(' | ');
  return { ok: false, attempts: 6, error: detail || 'Unknown Worker request failure.' };
}

let browser;
try {
  await waitForServer();
  const archiveAssetResponse = await fetch(baseUrl + '/assets/heritage/1183-wood-inscription.webp', {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000)
  });
  const archiveAssetType = (archiveAssetResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const archiveAssetBytes = new Uint8Array(await archiveAssetResponse.arrayBuffer());
  const archiveAssetFormat = archiveAssetBytes.length >= 12
    ? new TextDecoder().decode(archiveAssetBytes.slice(8, 12))
    : '';
  if (!archiveAssetResponse.ok || archiveAssetType !== 'image/webp' || archiveAssetFormat !== 'WEBP') {
    throw new Error('Local archive image must be served as a valid image/webp asset; HTTP ' +
      archiveAssetResponse.status + ', type=' + archiveAssetType + ', format=' + archiveAssetFormat + '.');
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  // The app preview is local, but production CORS must not allow loopback origins.
  // Proxy the real read-only setup-status response through the Node test runner.
  await page.route(workerUrl + '/setup/status', async route => {
    try {
      const upstream = await fetch(workerUrl + '/setup/status', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });
      const body = await upstream.text();
      return route.fulfill({
        status: upstream.status,
        headers: {
          'access-control-allow-origin': baseUrl,
          'access-control-allow-methods': 'GET,OPTIONS',
          'access-control-allow-headers': 'accept',
          'content-type': upstream.headers.get('content-type') || 'application/json',
          'cache-control': 'no-store'
        },
        body
      });
    } catch (error) {
      return route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Worker test proxy failed: ' + String(error?.message || 'network error') })
      });
    }
  });
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  const httpErrors = [];
  const mockedSubmissions = [];
  let intentionalOffline = false;
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !intentionalOffline) consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => {
    if (intentionalOffline) return;
    const failure = request.failure()?.errorText || 'unknown network failure';
    if (failure !== 'net::ERR_ABORTED') requestFailures.push({ url: request.url(), error: failure });
  });
  page.on('response', response => {
    if (!intentionalOffline && response.status() >= 400) {
      httpErrors.push({ url: response.url(), status: response.status() });
    }
  });
  await page.route('**/public/community-submissions', async route => {
    const request = route.request();
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'accept,content-type'
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200, headers: corsHeaders, contentType: 'application/json',
        body: JSON.stringify({ submissions: [] })
      });
    }
    if (request.method() === 'POST') {
      let payload;
      try { payload = request.postDataJSON(); }
      catch { return route.fulfill({ status: 400, headers: corsHeaders, body: 'Invalid test JSON.' }); }
      mockedSubmissions.push(payload);
      if (!payload?.type || !payload?.title || !payload?.body || payload.publishConsent !== true) {
        return route.fulfill({
          status: 400, headers: corsHeaders, contentType: 'application/json',
          body: JSON.stringify({ ok: false, error: 'Incomplete test payload.' })
        });
      }
      return route.fulfill({
        status: 201, headers: corsHeaders, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: 'qa-' + mockedSubmissions.length, status: 'pending' })
      });
    }
    return route.continue();
  });

  const started = Date.now();
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response?.ok()) throw new Error('App shell returned HTTP ' + (response?.status() ?? 'no response'));
  await page.locator('#view-home.active').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#globalSearchInput').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => window.HubaishKnowledge?.getData?.()?.landmarkRecords?.length === 16, { timeout: 15000 });
  const knowledgeCardCount = await page.locator('#knowledgeLandmarksList .knowledge-card').count();
  if (knowledgeCardCount !== 16) throw new Error('Expected 16 core landmark cards; received ' + knowledgeCardCount + '.');
  const globalSearch = page.locator('#globalSearchInput');
  await globalSearch.fill('مصنعة وحاظة');
  await page.locator('#globalSearchResults .search-result-card').first().waitFor({ state: 'visible', timeout: 10000 });
  if (!(await page.locator('#globalSearchResults').innerText()).includes('مصنعة وحاظة')) {
    throw new Error('Unified search did not return the Wuhaza heritage record.');
  }
  await globalSearch.fill('آل الناهي');
  await page.locator('#globalSearchResults .search-result-card').first().waitFor({ state: 'visible', timeout: 10000 });
  if (!(await page.locator('#globalSearchResults').innerText()).includes('آل الناهي')) {
    throw new Error('Unified search did not return the Nahi family entry.');
  }
  await globalSearch.fill('صهبان');
  await page.waitForTimeout(150);
  if (await page.locator('#globalSearchResults .search-result-card').count()) {
    throw new Error('The excluded geographic region is still returned in search results.');
  }
  await globalSearch.fill('');

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

  // Check all twenty-two districts, the local assistant, and the protected archive viewer.
  await page.locator('.nav-btn[data-tab="uzal"]').click();
  await page.locator('#view-uzal.active').waitFor({ state: 'visible', timeout: 10000 });
  const districtCount = await page.locator('#uzalList .uzal-card').count();
  if (districtCount !== 22) throw new Error('Expected 22 sub-district cards; received ' + districtCount + '.');
  await page.locator('#uzalSearchInput').fill('شباع');
  if (!(await page.locator('#uzalList').innerText()).includes('شباع')) throw new Error('Sub-district search failed.');
  await page.locator('#uzalSearchInput').fill('');
  if (await page.locator('#uzalList .uzal-card').count() !== 22) throw new Error('Clearing the district search did not restore all records.');

  await page.locator('.nav-btn[data-tab="more"]').click();
  await page.locator('#view-more.active').waitFor({ state: 'visible', timeout: 10000 });
  const sadiqText = await page.locator('#knowledgePeopleList').innerText();
  if (!sadiqText.includes('صادق محمد محمد الناهي')) throw new Error('The sourced Sadiq profile is missing.');
  await page.locator('#view-more .more-tab-button[data-more-tab="tools"]').click();
  await page.locator('#view-more [data-more-panel="tools"].active').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#openAiBtn').click();
  await page.locator('#aiModal.open').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#aiInput').fill('مدرسة الزواحي');
  await page.locator('#aiForm button[type="submit"]').click();
  const assistantReply = page.locator('#aiChatLog .chat-msg.assistant').last();
  await assistantReply.waitFor({ state: 'visible', timeout: 10000 });
  if (!(await assistantReply.innerText()).includes('الزواحي')) throw new Error('The local assistant did not answer the Zawahi school query.');
  await page.locator('#aiModal [data-close="aiModal"]').click();
  await page.locator('#aiModal').waitFor({ state: 'hidden', timeout: 5000 });

  await page.locator('#knowledgeArchiveList .archive-open').first().click();
  await page.locator('.archive-viewer').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.archive-watermarked-canvas');
    return canvas?.dataset.sourceLoaded === 'true' || canvas?.dataset.sourceError === 'true';
  }, { timeout: 10000 });
  const archiveCanvas = await page.locator('.archive-watermarked-canvas').evaluate(canvas => ({
    width: canvas.width,
    height: canvas.height,
    sourceLoaded: canvas.dataset.sourceLoaded === 'true',
    sourceError: canvas.dataset.sourceError === 'true',
    rendered: canvas.getContext('2d')?.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3] > 0
  }));
  if (!archiveCanvas.sourceLoaded || archiveCanvas.sourceError ||
      archiveCanvas.width < 100 || archiveCanvas.height < 100 || !archiveCanvas.rendered) {
    throw new Error('The double-watermarked archive viewer did not render the source image: ' + JSON.stringify(archiveCanvas));
  }
  if (await page.locator('#knowledgeArchiveList a[href*="1183-wood-inscription"]').count()) {
    throw new Error('A raw Marwaha image link is exposed outside the protected viewer.');
  }
  await page.locator('.archive-viewer-head button').click();
  await page.locator('.archive-viewer').waitFor({ state: 'detached', timeout: 5000 });

  // Exercise each form against the mocked endpoint; no QA data reaches production KV.
  const forms = [
    { selector: '#authorSubmissionForm', type: 'author' },
    { selector: '#familyCvForm', type: 'family' },
    { selector: '#archiveSubmissionForm', type: 'archive' },
    { selector: '#marketListingForm', type: 'marketplace' }
  ];
  for (const test of forms) {
    const form = page.locator(test.selector);
    await form.locator('[name="name"]').fill('اختبار آلي');
    await form.locator('[name="title"]').fill('سجل اختبار آلي');
    await form.locator('[name="body"]').fill('محتوى اصطناعي لفحص النموذج فقط، ولا يمثل حقيقة منشورة.');
    if (await form.locator('[name="source"]').count()) await form.locator('[name="source"]').fill('QA synthetic record');
    if (await form.locator('[name="contact"]').count()) await form.locator('[name="contact"]').fill('000000000');
    if (test.type === 'archive') await form.locator('[name="ownerName"]').fill('صاحب وثيقة الاختبار');
    if (test.type === 'marketplace') await form.locator('[name="marketCategory"]').selectOption('service');
    await form.locator('[name="publishConsent"]').check();
    await form.locator('button[type="submit"]').click();
    await page.waitForFunction(selector => {
      const form = document.querySelector(selector);
      return form?.querySelector('[aria-live="polite"]')?.textContent?.includes('وصل طلبك');
    }, test.selector, { timeout: 10000 });
  }
  const submittedTypes = mockedSubmissions.map(item => item.type).sort();
  if (mockedSubmissions.length !== 4 ||
      JSON.stringify(submittedTypes) !== JSON.stringify(['archive', 'author', 'family', 'marketplace'])) {
    throw new Error('One or more community forms did not submit all four expected consent-bearing records: ' + JSON.stringify(submittedTypes));
  }

  // Check zero horizontal overflow across all major views and target widths.
  const layouts = [];
  for (const width of [360, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: width < 500 ? 800 : 900 });
    for (const tab of ['home', 'history', 'places', 'uzal', 'more']) {
      await page.locator('.nav-btn[data-tab="' + tab + '"]').click();
      await page.locator('#view-' + tab + '.active').waitFor({ state: 'visible', timeout: 10000 });
      const size = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));
      const overflow = Math.max(size.document, size.body) - size.viewport;
      layouts.push({ width, tab, overflowPx: overflow });
      if (overflow > 0) throw new Error('Horizontal overflow ' + overflow + 'px at viewport ' + width + 'px in ' + tab + '.');
    }
  }

  // Wait for the service worker, then reload once to attach its controller.
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    return Promise.race([
      navigator.serviceWorker.ready.then(registration => ({ supported: true, state: registration.active?.state || 'inactive' })),
      new Promise(resolve => setTimeout(() => resolve({ supported: true, state: 'timeout' }), 15000))
    ]);
  });
  if (!swReady.supported || swReady.state !== 'activated') {
    const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(registration => ({
      scope: registration.scope,
      active: registration.active?.state || null,
      installing: registration.installing?.state || null,
      waiting: registration.waiting?.state || null
    })));
    throw new Error('Service Worker did not reach activated state within 15 seconds: ' + JSON.stringify({ swReady, registrations }));
  }
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
      knowledgeCached: keys.some(request => new URL(request.url).pathname.endsWith('/data/heritage-knowledge.json')),
      knowledgeModuleCached: keys.some(request => new URL(request.url).pathname.endsWith('/knowledge.js')),
      archiveImageCached: keys.some(request => new URL(request.url).pathname.endsWith('/assets/heritage/1183-wood-inscription.webp')),
      assetCount: keys.length
    };
  });
  if (!cacheState.appCache || !cacheState.indexCached || !cacheState.knowledgeCached ||
      !cacheState.knowledgeModuleCached || !cacheState.archiveImageCached || cacheState.assetCount < 10) {
    throw new Error('Offline shell cache is incomplete: ' + JSON.stringify(cacheState));
  }

  intentionalOffline = true;
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('#view-home.active').waitFor({ state: 'visible', timeout: 10000 });
  const offlineHome = await page.locator('.hero-title').textContent();
  if (!offlineHome?.trim()) throw new Error('Home view is not rendered while offline.');
  await context.setOffline(false);
  intentionalOffline = false;

  if (pageErrors.length || consoleErrors.length || requestFailures.length || httpErrors.length) {
    throw new Error('Browser/network errors detected: ' + JSON.stringify({
      pageErrors, consoleErrors, requestFailures, httpErrors
    }));
  }

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
    browserErrors: pageErrors,
    consoleErrors,
    requestFailures,
    httpErrors,
    knowledgeCardCount,
    districtCount,
    assistantReply: await assistantReply.innerText(),
    protectedArchiveViewer: archiveCanvas,
    submittedTypes
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
  throw new Error('Cloudflare Worker verification failed after bounded DNS/network retries: ' +
    JSON.stringify(workerChecks));
}
