import { appendFile, readFile } from 'node:fs/promises';

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!apiToken || !accountId) {
  throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required to resolve the active Worker URL.');
}

const apiRoot = 'https://api.cloudflare.com/client/v4';
async function cloudflare(path, options = {}) {
  const response = await fetch(apiRoot + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + apiToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(15000)
  });
  const raw = await response.text();
  let payload;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Cloudflare API returned non-JSON HTTP ' + response.status + ' for ' + path);
  }
  if (!response.ok || payload.success !== true) {
    const reasons = Array.isArray(payload.errors)
      ? payload.errors.map(error => error.message).filter(Boolean).join('; ')
      : '';
    throw new Error('Cloudflare API HTTP ' + response.status + ' for ' + path + (reasons ? ': ' + reasons : ''));
  }
  return payload.result || {};
}

const wrangler = await readFile('cloudflare-worker/wrangler.toml', 'utf8');
const workerName = wrangler.match(/^name\s*=\s*["']([^"']+)["']/m)?.[1];
if (!workerName || !/^[a-z0-9-]{1,63}$/i.test(workerName)) {
  throw new Error('cloudflare-worker/wrangler.toml does not contain a valid Worker name.');
}

const account = await cloudflare('/accounts/' + encodeURIComponent(accountId) + '/workers/subdomain');
const accountSubdomain = String(account.subdomain || '').trim().toLowerCase();
if (!/^[a-z0-9-]{1,63}$/.test(accountSubdomain)) {
  throw new Error('Cloudflare returned an empty or invalid workers.dev account subdomain.');
}

const scriptSubdomainPath =
  '/accounts/' + encodeURIComponent(accountId) +
  '/workers/scripts/' + encodeURIComponent(workerName) + '/subdomain';
let scriptSubdomain = await cloudflare(scriptSubdomainPath);
if (scriptSubdomain.enabled !== true) {
  console.log('Worker workers.dev route is disabled; enabling the named hubaish-cms route.');
  scriptSubdomain = await cloudflare(scriptSubdomainPath, {
    method: 'POST',
    body: JSON.stringify({ enabled: true })
  });
}
if (scriptSubdomain.enabled !== true) {
  scriptSubdomain = await cloudflare(scriptSubdomainPath);
}
if (scriptSubdomain.enabled !== true) {
  throw new Error('Cloudflare did not enable the workers.dev route for ' + workerName + '.');
}

const baseUrl = 'https://' + workerName + '.' + accountSubdomain + '.workers.dev';
const appSource = await readFile('www/github-cms.js', 'utf8');
const appUrl = appSource.match(/const\s+DEFAULT_WORKER_URL\s*=\s*['"]([^'"]+)['"]/)?.[1];
const auditSource = await readFile('scripts/audit-runtime.mjs', 'utf8');
const auditUrl = auditSource.match(/const\s+workerUrl\s*=\s*['"]([^'"]+)['"]/)?.[1];
if (appUrl !== baseUrl || auditUrl !== baseUrl) {
  throw new Error(
    'Worker hostname mismatch. Cloudflare reports ' + baseUrl +
    '; app endpoint is ' + (appUrl || 'missing') +
    '; runtime audit endpoint is ' + (auditUrl || 'missing') +
    '. Update both source references before continuing.'
  );
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, 'base_url=' + baseUrl + '\n', 'utf8');
}
console.log('PASS: Cloudflare account workers.dev subdomain resolved without exposing credentials.');
console.log('PASS: ' + workerName + ' workers.dev route is enabled.');
console.log('CLOUDFLARE_WORKER_URL=' + baseUrl);
