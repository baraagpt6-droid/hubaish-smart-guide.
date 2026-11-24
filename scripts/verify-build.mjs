import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=process.cwd();
const required=['www/index.html','www/assets/styles.css','www/assets/app.js','www/sw.js','www/manifest.webmanifest','www/icons/icon.svg','www/icons/icon-192.png','www/icons/icon-512.png','capacitor.config.json'];
for(const file of required) await access(resolve(root,file));
const html=await readFile(resolve(root,'www/index.html'),'utf8');
const manifest=JSON.parse(await readFile(resolve(root,'www/manifest.webmanifest'),'utf8'));
if(!html.includes('assets/styles.css')||!html.includes('assets/app.js')) throw new Error('Missing web asset references');
if(!manifest.name||manifest.scope!=='./'||manifest.start_url!=='./') throw new Error('Invalid PWA manifest');
for(const [file,size] of [['www/icons/icon-192.png',192],['www/icons/icon-512.png',512]]){
 const b=await readFile(resolve(root,file));
 if(b.toString('hex',0,8)!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==size||b.readUInt32BE(20)!==size) throw new Error('Invalid PNG icon '+file);
}
console.log('Build verification passed: web files, PWA manifest and PNG icons are present.');
