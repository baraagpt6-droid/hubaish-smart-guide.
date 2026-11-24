import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is missing. Add it as a GitHub Actions variable or secret.');
if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN is missing. Add a Cloudflare API token as a GitHub Actions secret.');

const configPath = resolve('cloudflare-worker/wrangler.toml');
const namespaceTitle = 'hubaish-admins';
const headers = { Authorization: 'Bearer ' + apiToken, Accept: 'application/json' };

async function getNamespaces() {
  const all = [];
  let page = 1, totalPages = 1;
  do {
    const url = new URL('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(accountId) + '/storage/kv/namespaces');
    url.searchParams.set('per_page', '1000');
    url.searchParams.set('page', String(page));
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success !== true) {
      const detail = (body.errors || []).map(x => x.message || x.code).join('; ');
      throw new Error('Cloudflare KV namespace lookup failed (HTTP ' + response.status + '): ' + (detail || 'API request rejected. Check token permissions.'));
    }
    all.push(...(Array.isArray(body.result) ? body.result : []));
    totalPages = Math.max(1, Number(body.result_info?.total_pages || 1));
    page++;
  } while (page <= totalPages);
  return all;
}

const namespaces = await getNamespaces();
const matches = namespaces.filter(item => item && item.title === namespaceTitle);
if (matches.length === 0) throw new Error('Cloudflare account does not contain "' + namespaceTitle + '". No new namespace was created, to avoid disconnecting existing administrator data.');
if (matches.length > 1) throw new Error('Multiple KV namespaces are titled "' + namespaceTitle + '". Resolve the duplicate before deployment.');
const namespaceId = String(matches[0].id || '');
if (!/^[a-f0-9]{32}$/i.test(namespaceId)) throw new Error('Cloudflare returned an invalid KV namespace ID.');

let toml = await readFile(configPath, 'utf8');
const blockPattern = /\[\[kv_namespaces\]\][\s\S]*?(?=\n\[\[|\n\[|$)/g;
const blocks = [...toml.matchAll(blockPattern)];
const matchesBinding = blocks.filter(match => /binding\s*=\s*["']ADMINS["']/.test(match[0]));
if (matchesBinding.length > 1) throw new Error('wrangler.toml contains duplicate ADMINS KV bindings.');
const bindingBlock = `[[kv_namespaces]]
binding = "ADMINS"
id = "${namespaceId}"`;
if (matchesBinding.length === 1) {
  toml = toml.replace(matchesBinding[0][0], bindingBlock);
} else {
  if (/\[\[kv_namespaces\]\]/.test(toml)) throw new Error('Other KV bindings exist; refusing to overwrite them.');
  toml = toml.trimEnd() + '\n\n' + bindingBlock + '\n';
}
await writeFile(configPath, toml, 'utf8');
console.log('Resolved "' + namespaceTitle + '" and injected binding ADMINS in cloudflare-worker/wrangler.toml.');
console.log('Namespace ID: ' + namespaceId);
