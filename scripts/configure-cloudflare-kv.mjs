import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// This is a fixed production binding. Never discover, rewrite, clear, or
// replace it through environment variables or Cloudflare API credentials.
const namespaceTitle = 'hubaish-admins';
const namespaceId = 'c34ad73bd79444119bd6884856516cf2';
const configPath = resolve('cloudflare-worker/wrangler.toml');
const toml = await readFile(configPath, 'utf8');

const blockPattern = /\[\[kv_namespaces\]\][\s\S]*?(?=\n\[\[|\n\[|$)/g;
const blocks = [...toml.matchAll(blockPattern)].map(match => match[0]);
const admins = blocks.filter(block => /binding\s*=\s*["']ADMINS["']/.test(block));

if (admins.length !== 1) {
  throw new Error('wrangler.toml must contain exactly one ADMINS KV binding.');
}

const bindingId = admins[0].match(/\bid\s*=\s*["']([a-f0-9]{32})["']/i)?.[1];
if (bindingId !== namespaceId) {
  throw new Error('ADMINS must point to the fixed production hubaish-admins namespace ID.');
}
if (toml.includes('__HUBAISH_ADMINS_KV_NAMESPACE_ID__')) {
  throw new Error('Unresolved ADMINS namespace placeholder remains in wrangler.toml.');
}

console.log('PASS: ADMINS is permanently configured for ' + namespaceTitle + ' (' + namespaceId + ').');
console.log('No Cloudflare credentials are required to validate this static binding.');
