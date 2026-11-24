/**
 * Hubaish Smart Guide — Cloudflare Worker
 * Bind KV namespace as ADMINS. Add secrets GITHUB_TOKEN, SESSION_SECRET, BOOTSTRAP_KEY.
 * First setup: POST /setup {bootstrapKey,username,password,displayName}; then remove BOOTSTRAP_KEY.
 */
const OWNER="baraagpt6-droid",REPO="hubaish-smart-guide.",BRANCH="main",FILE="www/data/live-content.json";
const ROLES=new Set(["super_admin","editor"]),ITER=210000,UP="user:",AUDIT="audit:latest";
function b64bytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));return btoa(binary)}
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...h}});
const enc=s=>new TextEncoder().encode(s),dec=b=>new TextDecoder().decode(b);
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4)),c=>c.charCodeAt(0));
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const uname=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,32);
async function hkey(secret){return crypto.subtle.importKey("raw",enc(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"])}
async function issue(payload,secret){const body=b64u(enc(JSON.stringify(payload)));return body+"."+b64u(await crypto.subtle.sign("HMAC",await hkey(secret),enc(body)))}
async function check(token,secret){try{const [body,sig]=String(token||"").split(".");if(!body||!sig)return null;if(!await crypto.subtle.verify("HMAC",await hkey(secret),un64(sig),enc(body)))return null;const p=JSON.parse(dec(un64(body)));return p.exp>Date.now()?p:null}catch{return null}}
async function passHash(password,salt){const m=await crypto.subtle.importKey("raw",enc(password),"PBKDF2",false,["deriveBits"]);return b64u(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:ITER,hash:"SHA-256"},m,256))}
async function saveUser(env,user,password){const salt=random(16);await env.ADMINS.put(UP+user.username,JSON.stringify({...user,salt:b64u(salt),passwordHash:await passHash(password,salt),updatedAt:new Date().toISOString()}))}
const getUser=(env,name)=>env.ADMINS.get(UP+name,"json");
async function log(env,event){const a=await env.ADMINS.get(AUDIT,"json")||[];a.unshift({at:new Date().toISOString(),...event});await env.ADMINS.put(AUDIT,JSON.stringify(a.slice(0,200)))}
function cors(req,env){const o=req.headers.get("Origin")||"",allowed=env.ALLOWED_ORIGIN||"https://baraagpt6-droid.github.io";const ok=o===allowed;return {"Access-Control-Allow-Origin":ok?o:"null","Access-Control-Allow-Methods":"GET,POST,PUT,PATCH,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Max-Age":"86400","Vary":"Origin"}}
async function auth(req,env){const t=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,""),p=await check(t,env.SESSION_SECRET);if(!p?.sub)return null;const u=await getUser(env,p.sub);if(!u||u.disabled||u.role!==p.role)return null;return {username:u.username,displayName:u.displayName,role:u.role}}
async function ghRead(env){const url="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+FILE+"?ref="+BRANCH;const r=await fetch(url,{headers:{Authorization:"Bearer "+env.GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"Hubaish-CMS-Worker"}}),p=await r.json();if(!r.ok)throw Error("GitHub read failed: "+(p.message||r.status));const raw=atob(p.content.replace(/\s/g,"")),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return {sha:p.sha,data:JSON.parse(dec(bytes))}}
async function ghWrite(env,data,actor){const old=await ghRead(env),url="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+FILE,content=b64bytes(enc(JSON.stringify(data,null,2)+"\n"));const r=await fetch(url,{method:"PUT",headers:{Authorization:"Bearer "+env.GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json","User-Agent":"Hubaish-CMS-Worker"},body:JSON.stringify({message:"CMS: update live content by "+actor.username,content,sha:old.sha,branch:BRANCH,committer:{name:"Hubaish CMS — "+(actor.displayName||actor.username),email:"41898282+github-actions[bot]@users.noreply.github.com"}})}),p=await r.json();if(!r.ok)throw Error("GitHub write failed: "+(p.message||r.status));return p}
async function route(req,env){
 const u=new URL(req.url),path=u.pathname;
 if(req.method==="OPTIONS")return new Response(null,{status:204});
 if(!env.ADMINS||!env.GITHUB_TOKEN||!env.SESSION_SECRET) return json({error:"Configure ADMINS KV, GITHUB_TOKEN and SESSION_SECRET."},500);
 if(req.method==="POST"&&path==="/setup"){
  const b=await req.json(),keys=await env.ADMINS.list({prefix:UP,limit:1});
  if(keys.keys.length)return json({error:"Initial setup already completed."},409);
  if(!env.BOOTSTRAP_KEY||b.bootstrapKey!==env.BOOTSTRAP_KEY)return json({error:"Invalid bootstrap key."},403);
  const username=uname(b.username),password=String(b.password||"");if(!username||password.length<12)return json({error:"Username required; password must be at least 12 characters."},400);
  await saveUser(env,{username,displayName:String(b.displayName||username).slice(0,80),role:"super_admin",disabled:false,createdAt:new Date().toISOString()},password);
  await log(env,{actor:username,action:"bootstrap_super_admin"});return json({ok:true,message:"Admin created. Remove BOOTSTRAP_KEY secret now."},201)
 }
 if(req.method==="POST"&&path==="/auth/login"){
  const b=await req.json(),username=uname(b.username),password=String(b.password||""),user=username?await getUser(env,username):null;
  const ip=req.headers.get("CF-Connecting-IP")||"unknown",attemptKey="login-fail:"+ip+":"+username;
  const attempts=await env.ADMINS.get(attemptKey,"json")||{count:0};
  if(attempts.count>=8)return json({error:"تم إيقاف محاولات الدخول مؤقتاً. حاول بعد 15 دقيقة."},429);
  if(!user||user.disabled||await passHash(password,un64(user.salt))!==user.passwordHash){
   await env.ADMINS.put(attemptKey,JSON.stringify({count:attempts.count+1}),{expirationTtl:900});
   return json({error:"اسم المستخدم أو كلمة المرور غير صحيحة."},401);
  }
  await env.ADMINS.delete(attemptKey);
  const ttl=b.remember===true?30*86400000:8*3600000,token=await issue({sub:user.username,role:user.role,exp:Date.now()+ttl},env.SESSION_SECRET);
  await log(env,{actor:username,action:"login"});return json({token,expiresIn:ttl,user:{username,displayName:user.displayName,role:user.role}})
 }
 const actor=await auth(req,env);if(!actor)return json({error:"انتهت الجلسة أو بيانات الدخول غير صالحة."},401);
 if(path.startsWith("/admin/")&&actor.role!=="super_admin")return json({error:"يتطلب هذا الإجراء صلاحية المشرف العام."},403);
 if(req.method==="GET"&&path==="/auth/me")return json({user:actor});
 if(req.method==="PUT"&&path==="/content"){
  const d=await req.json(),keys=["landmarks","historyEvents","subDistrictUpdates","subDistricts","historicalFigures","communityLinks"];
  if(!keys.every(k=>Array.isArray(d?.[k]))||d.schemaVersion!==1)return json({error:"Invalid live-content schema."},400);
  if(JSON.stringify(d).length>700000)return json({error:"Content exceeds 700 KB."},413);
  d.updatedAt=new Date().toISOString();d.updatedBy={username:actor.username,displayName:actor.displayName,role:actor.role};
  const result=await ghWrite(env,d,actor);await log(env,{actor:actor.username,displayName:actor.displayName,role:actor.role,action:"publish_content",commit:result.commit?.sha||null});
  return json({ok:true,updatedAt:d.updatedAt,commit:result.commit?.sha||null})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="GET"){
  const keys=await env.ADMINS.list({prefix:UP,limit:100}),users=[];for(const k of keys.keys){const x=await getUser(env,k.name.slice(UP.length));if(x)users.push({username:x.username,displayName:x.displayName,role:x.role,disabled:!!x.disabled,createdAt:x.createdAt})}return json({users})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="POST"){
  const b=await req.json(),username=uname(b.username),password=String(b.password||""),role=String(b.role||"editor");
  if(!username||password.length<12||!ROLES.has(role))return json({error:"اسم المستخدم مطلوب وكلمة المرور 12 حرفاً على الأقل."},400);
  if(await getUser(env,username))return json({error:"اسم المستخدم مستخدم بالفعل."},409);
  await saveUser(env,{username,displayName:String(b.displayName||username).slice(0,80),role,disabled:false,createdAt:new Date().toISOString()},password);await log(env,{actor:actor.username,action:"create_admin",target:username,role});return json({ok:true},201)
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="PATCH"){
  const b=await req.json(),username=uname(b.username),user=await getUser(env,username);if(!user)return json({error:"الحساب غير موجود."},404);if(username===actor.username)return json({error:"لا يمكنك تعطيل حسابك الحالي."},400);
  user.disabled=b.disabled===true;await env.ADMINS.put(UP+username,JSON.stringify(user));await log(env,{actor:actor.username,action:user.disabled?"disable_admin":"enable_admin",target:username});return json({ok:true})
 }
 if(path==="/admin/audit"&&actor.role==="super_admin"&&req.method==="GET")return json({events:(await env.ADMINS.get(AUDIT,"json")||[]).slice(0,100)});
 return json({error:"Not found."},404)
}
export default {async fetch(req,env){const h=cors(req,env);if(req.method!=="OPTIONS"&&h["Access-Control-Allow-Origin"]==="null")return json({error:"Origin not allowed."},403);try{const r=await route(req,env),headers=new Headers(r.headers);for(const [k,v] of Object.entries(h))headers.set(k,v);return new Response(r.body,{status:r.status,headers})}catch(e){return json({error:e.message||"Worker error."},500,h)}}};