import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('../www/',import.meta.url)));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  const path=decodeURIComponent(url.pathname);
  const file=resolve(root,path==='/'?'index.html':'.'+path);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
  const info=await stat(file);if(!info.isFile())throw new Error('not a file');
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':file.endsWith('sw.js')?'no-cache':'no-cache'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');}
}).listen(port,'0.0.0.0',()=>process.stdout.write(`Hubaish Guide: http://localhost:${port}\n`));
