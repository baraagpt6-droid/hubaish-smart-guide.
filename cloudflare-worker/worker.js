// 2026-11-28: redeploy and revalidate the canonical workers.dev route.
/**
 * Hubaish Smart Guide — Cloudflare Worker
 * Bind the production KV namespace as ADMINS. Required secrets: GITHUB_TOKEN and SESSION_SECRET.
 * BOOTSTRAP_KEY is required only for first-admin setup and must be removed afterward.
 */
const OWNER="baraagpt6-droid",REPO="hubaish-smart-guide.",BRANCH="main",FILE="www/data/live-content.json";
const ROLES=new Set(["super_admin","editor"]),ITER=100000,UP="user:",AUDIT="audit:latest";
function b64bytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));return btoa(binary)}
const SECURITY_HEADERS={"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"microphone=(self)","Strict-Transport-Security":"max-age=31536000; includeSubDomains","Cross-Origin-Resource-Policy":"same-site","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...SECURITY_HEADERS,...h}});
const enc=s=>new TextEncoder().encode(s),dec=b=>new TextDecoder().decode(b);
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4)),c=>c.charCodeAt(0));
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const sessionVersion=()=>b64u(random(16));
const versionOf=user=>String(user.sessionVersion||"legacy");
const uname=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,32);
async function hkey(secret){return crypto.subtle.importKey("raw",enc(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"])}
async function issue(payload,secret){const body=b64u(enc(JSON.stringify(payload)));return body+"."+b64u(await crypto.subtle.sign("HMAC",await hkey(secret),enc(body)))}
async function check(token,secret){try{const [body,sig]=String(token||"").split(".");if(!body||!sig)return null;if(!await crypto.subtle.verify("HMAC",await hkey(secret),un64(sig),enc(body)))return null;const p=JSON.parse(dec(un64(body)));return p.exp>Date.now()?p:null}catch{return null}}
async function passHash(password,salt,iterations=ITER){if(!Number.isInteger(iterations)||iterations<10000||iterations>ITER)throw Error("Unsupported password hash parameters.");const m=await crypto.subtle.importKey("raw",enc(password),"PBKDF2",false,["deriveBits"]);return b64u(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations,hash:"SHA-256"},m,256))}
async function passwordMatches(password,user){const iterations=Number(user.hashIterations||ITER);if(iterations>ITER)return false;return await passHash(password,un64(user.salt),iterations)===user.passwordHash}
async function saveUser(env,user,password){const salt=random(16);await env.ADMINS.put(UP+user.username,JSON.stringify({...user,sessionVersion:user.sessionVersion||sessionVersion(),hashIterations:ITER,salt:b64u(salt),passwordHash:await passHash(password,salt),updatedAt:new Date().toISOString()}))}
const getUser=(env,name)=>env.ADMINS.get(UP+name,"json");
async function log(env,event){const a=await env.ADMINS.get(AUDIT,"json")||[];a.unshift({at:new Date().toISOString(),...event});await env.ADMINS.put(AUDIT,JSON.stringify(a.slice(0,200)))}
function cors(req,env){
 const origin=req.headers.get("Origin")||"";
 const configured=String(env.ALLOWED_ORIGIN||"").split(",").map(x=>x.trim()).filter(x=>x&&x!=="*");
 const defaults=["https://baraagpt6-droid.github.io","capacitor://localhost","http://localhost","https://localhost"];
 const allowed=new Set([...defaults,...configured]);
 const permitted=!origin||allowed.has(origin);
 return {
  ...(origin&&permitted?{"Access-Control-Allow-Origin":origin}:{}),
  "Access-Control-Allow-Methods":"GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type,Authorization",
  "Access-Control-Max-Age":"86400",
  "Vary":"Origin"
 };
}
async function auth(req,env){const t=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,""),p=await check(t,env.SESSION_SECRET);if(!p?.sub)return null;const u=await getUser(env,p.sub);if(!u||u.disabled||u.role!==p.role||String(p.ver||"legacy")!==versionOf(u))return null;return {username:u.username,displayName:u.displayName,role:u.role}}
async function ghRead(env){const url="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+FILE+"?ref="+BRANCH;const r=await fetch(url,{headers:{Authorization:"Bearer "+env.GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"Hubaish-CMS-Worker"}}),p=await r.json();if(!r.ok)throw Error("GitHub read failed: "+(p.message||r.status));const raw=atob(p.content.replace(/\s/g,"")),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return {sha:p.sha,data:JSON.parse(dec(bytes))}}
async function ghWrite(env,data,actor){const old=await ghRead(env),url="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+FILE,content=b64bytes(enc(JSON.stringify(data,null,2)+"\n"));const r=await fetch(url,{method:"PUT",headers:{Authorization:"Bearer "+env.GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json","User-Agent":"Hubaish-CMS-Worker"},body:JSON.stringify({message:"CMS: update live content by "+actor.username,content,sha:old.sha,branch:BRANCH,committer:{name:"Hubaish CMS — "+(actor.displayName||actor.username),email:"41898282+github-actions[bot]@users.noreply.github.com"}})}),p=await r.json();if(!r.ok)throw Error("GitHub write failed: "+(p.message||r.status));return p}
async function healthKV(env){
 if(!env.ADMINS)throw Error("ADMINS binding missing.");
 const key="healthcheck:"+b64u(random(16));let created=false;
 try{
  await env.ADMINS.put(key,"ok",{expirationTtl:60});created=true;
  const value=await env.ADMINS.get(key);
  if(value!=="ok")throw Error("KV read-back failed.");
 }finally{if(created)await env.ADMINS.delete(key)}
}
async function healthGitHub(env){
 if(!env.GITHUB_TOKEN)throw Error("GITHUB_TOKEN missing.");
 const result=await ghRead(env),data=result.data;
 const keys=["landmarks","historyEvents","subDistrictUpdates","subDistricts","historicalFigures","communityLinks"];
 if(!data||data.schemaVersion!==1||!keys.every(key=>Array.isArray(data[key])))throw Error("GitHub CMS JSON schema is invalid.");
}
async function healthSession(env){
 if(typeof env.SESSION_SECRET!=="string"||new TextEncoder().encode(env.SESSION_SECRET).length<32)throw Error("SESSION_SECRET must contain at least 32 bytes.");
 await hkey(env.SESSION_SECRET);
}
async function healthStatus(env){
 const run=async fn=>{try{await fn();return {ok:true}}catch(error){return {ok:false,error:String(error?.message||"check failed").slice(0,180)}}};
 const checks={kv:await run(()=>healthKV(env)),githubContentsRead:await run(()=>healthGitHub(env)),sessionSecret:await run(()=>healthSession(env))};
 const ok=Object.values(checks).every(check=>check.ok);
 return json({ok,status:ok?"healthy":"degraded",checks,bootstrapKeyConfigured:!!env.BOOTSTRAP_KEY,checkedAt:new Date().toISOString()},ok?200:503);
}
async function route(req,env){
 const u=new URL(req.url),path=u.pathname;
 if(req.method==="OPTIONS")return new Response(null,{status:204});
 if(req.method==="GET"&&(path==="/health"||path==="/api/health"))return healthStatus(env);
 if(req.method==="POST"&&path==="/public/photo-submissions"){
  return json({ok:false,error:"Visitor photo submissions are temporarily disabled."},410);
 }
 if(!env.ADMINS||!env.GITHUB_TOKEN||!env.SESSION_SECRET) return json({error:"Configure ADMINS KV, GITHUB_TOKEN and SESSION_SECRET."},500);
 if(req.method==="GET"&&path==="/setup/status"){
  const keys=await env.ADMINS.list({prefix:UP,limit:1});
  return json({setupRequired:keys.keys.length===0,configured:true,bootstrapKeyConfigured:!!env.BOOTSTRAP_KEY});
 }
 if(req.method==="POST"&&path==="/setup"){
  const b=await req.json(),keys=await env.ADMINS.list({prefix:UP,limit:1});
  if(keys.keys.length)return json({error:"Initial setup already completed."},409);
  if(!env.BOOTSTRAP_KEY||b.bootstrapKey!==env.BOOTSTRAP_KEY)return json({error:"Invalid bootstrap key."},403);
  const username=uname(b.username),password=String(b.password||"");if(!username||password.length<12)return json({error:"Username required; password must be at least 12 characters."},400);
  await saveUser(env,{username,displayName:String(b.displayName||username).slice(0,80),role:"super_admin",disabled:false,sessionVersion:sessionVersion(),createdAt:new Date().toISOString()},password);
  await log(env,{actor:username,action:"bootstrap_super_admin"});return json({ok:true,message:"Admin created. Remove BOOTSTRAP_KEY secret now."},201)
 }
 if(req.method==="POST"&&path==="/auth/login"){
  const b=await req.json(),username=uname(b.username),password=String(b.password||""),user=username?await getUser(env,username):null;
  const ip=req.headers.get("CF-Connecting-IP")||"unknown",attemptKey="login-fail:"+ip+":"+username;
  const attempts=await env.ADMINS.get(attemptKey,"json")||{count:0};
  if(attempts.count>=8)return json({error:"تم إيقاف محاولات الدخول مؤقتاً. حاول بعد 15 دقيقة."},429);
  let passwordValid=false;
  if(user&&!user.disabled){try{passwordValid=await passwordMatches(password,user)}catch{passwordValid=false}}
  if(!passwordValid){
   await env.ADMINS.put(attemptKey,JSON.stringify({count:attempts.count+1}),{expirationTtl:900});
   return json({error:"اسم المستخدم أو كلمة المرور غير صحيحة."},401);
  }
  await env.ADMINS.delete(attemptKey);
  const ttl=b.remember===true?30*86400000:8*3600000,token=await issue({sub:user.username,role:user.role,ver:versionOf(user),exp:Date.now()+ttl},env.SESSION_SECRET);
  await log(env,{actor:username,action:"login"});return json({token,expiresIn:ttl,user:{username,displayName:user.displayName,role:user.role}})
 }
 const actor=await auth(req,env);if(!actor)return json({error:"انتهت الجلسة أو بيانات الدخول غير صالحة."},401);
 if(path.startsWith("/admin/")&&actor.role!=="super_admin")return json({error:"يتطلب هذا الإجراء صلاحية المشرف العام."},403);
 if(req.method==="GET"&&path==="/review/photo-submissions"){
  const keys=await env.ADMINS.list({prefix:"photo-submission:",limit:100}),submissions=[];
  for(const key of keys.keys){const value=await env.ADMINS.get(key.name,"json");if(value&&value.status==="pending")submissions.push(value)}
  submissions.sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt)));return json({submissions})
 }
 if((req.method==="PATCH"||req.method==="DELETE")&&path==="/review/photo-submissions"){
  const b=await req.json(),id=String(b.id||"").trim(),key="photo-submission:"+id;
  if(!/^[0-9a-f-]{20,40}$/i.test(id))return json({error:"Invalid submission id."},400);
  const submission=await env.ADMINS.get(key,"json");if(!submission||submission.status!=="pending")return json({error:"Photo submission not found."},404);
  if(req.method==="DELETE"){await env.ADMINS.delete(key);await log(env,{actor:actor.username,action:"reject_visitor_photo",target:id});return json({ok:true})}
  if(b.action!=="approve")return json({error:"Unsupported review action."},400);
  const doc=(await ghRead(env)).data;if(!doc||!Array.isArray(doc.landmarks))return json({error:"Live content unavailable."},503);
  const rowId="visitor-photo-"+id.replace(/-/g,"").slice(0,18);if(doc.landmarks.some(item=>item.id===rowId))return json({error:"Photo already published."},409);
  const category=submission.placeType==="fort"?"forts":submission.placeType==="mountain"||submission.placeType==="valley"?"valleys":"villages";
  doc.landmarks.push({id:rowId,category:category==="forts"?"fort":category==="valleys"?"valley":"village",title_ar:submission.title,title_en:submission.title,title_tr:submission.title,title_fr:submission.title,
   location_ar:submission.location+" – مديرية حبيش",location_en:submission.location+" – Hubaish District",location_tr:submission.location+" – Hubaish",location_fr:submission.location+" – Hubaish",
   description_ar:"صورة زائر راجعها واعتمدها مشرف الدليل بعد التحقق من موقعها.",description_en:"Visitor photo reviewed and approved by a Hubaish Guide moderator.",description_tr:"Hubaish Rehberi yöneticisi tarafından incelenip onaylanan ziyaretçi fotoğrafı.",description_fr:"Photo de visiteur vérifiée et approuvée par un modérateur du guide Hubaish.",
   source_text:"Visitor-submitted photo. Contributor confirmed ownership or permission and granted CC BY 4.0 publication permission.",source_url:"https://github.com/baraagpt6-droid/hubaish-smart-guide./blob/main/www/data/live-content.json",
   image_url:submission.imageData,image_category:category,image_photographer:submission.photographer,image_credit:"Photo: "+submission.photographer,image_license:"CC BY 4.0",
   image_source_url:"https://github.com/baraagpt6-droid/hubaish-smart-guide./blob/main/www/data/live-content.json",image_verified:true,image_alt_ar:submission.title,image_alt_en:submission.title,image_alt_tr:submission.title,image_alt_fr:submission.title,
   image_caption_ar:"صورة زائر معتمدة من إدارة دليل حبيش.",image_caption_en:"Visitor photo approved by Hubaish Guide.",image_caption_tr:"Hubaish Rehberi tarafından onaylanan ziyaretçi fotoğrafı.",image_caption_fr:"Photo de visiteur approuvée par le guide Hubaish.",
   image_district_ar:submission.location,image_district_en:submission.location,image_district_tr:submission.location,image_district_fr:submission.location});
  if(JSON.stringify(doc).length>680000)return json({error:"Photo exceeds live content storage limit."},413);
  doc.updatedAt=new Date().toISOString();doc.updatedBy={username:actor.username,displayName:actor.displayName,role:actor.role};
  const result=await ghWrite(env,doc,actor);await env.ADMINS.delete(key);await log(env,{actor:actor.username,action:"approve_visitor_photo",target:id,commit:result.commit?.sha||null});return json({ok:true,commit:result.commit?.sha||null})
 }
 if(req.method==="GET"&&path==="/auth/me")return json({user:actor});
 if(req.method==="PUT"&&path==="/content"){
  const d=await req.json(),keys=["landmarks","historyEvents","subDistrictUpdates","subDistricts","historicalFigures","communityLinks"];
  if(!keys.every(k=>Array.isArray(d?.[k]))||d.schemaVersion!==1)return json({error:"Invalid live-content schema."},400);
  if(JSON.stringify(d).length>700000)return json({error:"Content exceeds 700 KB."},413);
  const previous=(await ghRead(env)).data,changes=[];
  for(const key of keys){
   const before=new Map((previous[key]||[]).map(item=>[String(item.id||""),item]));
   const after=new Map((d[key]||[]).map(item=>[String(item.id||""),item]));
   for(const [id,item] of after){
    const prior=before.get(id);
    if(!prior)changes.push({collection:key,id,action:"add",title:String(item.title_ar||item.name_ar||item.district_name_ar||id).slice(0,120)});
    else if(JSON.stringify(prior)!==JSON.stringify(item))changes.push({collection:key,id,action:"edit",title:String(item.title_ar||item.name_ar||item.district_name_ar||id).slice(0,120)});
   }
   for(const [id,item] of before)if(!after.has(id))changes.push({collection:key,id,action:"delete",title:String(item.title_ar||item.name_ar||item.district_name_ar||id).slice(0,120)});
  }
  d.updatedAt=new Date().toISOString();d.updatedBy={username:actor.username,displayName:actor.displayName,role:actor.role};
  const result=await ghWrite(env,d,actor);await log(env,{actor:actor.username,displayName:actor.displayName,role:actor.role,action:"publish_content",changes:changes.slice(0,100),commit:result.commit?.sha||null});
  return json({ok:true,updatedAt:d.updatedAt,updatedBy:d.updatedBy,commit:result.commit?.sha||null})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="GET"){
  const keys=await env.ADMINS.list({prefix:UP,limit:100}),users=[];for(const k of keys.keys){const x=await getUser(env,k.name.slice(UP.length));if(x)users.push({username:x.username,displayName:x.displayName,role:x.role,disabled:!!x.disabled,createdAt:x.createdAt})}return json({users})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="POST"){
  const b=await req.json(),username=uname(b.username),password=String(b.password||""),role=String(b.role||"editor");
  if(!username||password.length<12||!ROLES.has(role))return json({error:"اسم المستخدم مطلوب وكلمة المرور 12 حرفاً على الأقل."},400);
  if(await getUser(env,username))return json({error:"اسم المستخدم مستخدم بالفعل."},409);
  await saveUser(env,{username,displayName:String(b.displayName||username).slice(0,80),role,disabled:false,sessionVersion:sessionVersion(),createdAt:new Date().toISOString()},password);await log(env,{actor:actor.username,action:"create_admin",target:username,role});return json({ok:true},201)
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="PATCH"){
  const b=await req.json(),username=uname(b.username),user=await getUser(env,username);if(!user)return json({error:"الحساب غير موجود."},404);if(username===actor.username)return json({error:"لا يمكنك تعطيل حسابك الحالي."},400);
  const wasDisabled=!!user.disabled;user.disabled=b.disabled===true;if(user.disabled!==wasDisabled)user.sessionVersion=sessionVersion();user.updatedAt=new Date().toISOString();await env.ADMINS.put(UP+username,JSON.stringify(user));await log(env,{actor:actor.username,action:user.disabled?"disable_admin":"enable_admin",target:username});return json({ok:true})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="PUT"){
  const b=await req.json(),username=uname(b.username),user=await getUser(env,username);
  if(!user)return json({error:"الحساب غير موجود."},404);
  const role=String(b.role||user.role);if(!ROLES.has(role))return json({error:"الصلاحية المطلوبة غير صالحة."},400);
  if(username===actor.username&&(role!=="super_admin"||b.disabled===true))return json({error:"لا يمكنك تعطيل حسابك أو خفض صلاحيتك."},400);
  const previousRole=user.role,previousDisabled=!!user.disabled;user.role=role;
  if(typeof b.displayName==="string"&&b.displayName.trim())user.displayName=b.displayName.trim().slice(0,80);
  if(typeof b.disabled==="boolean")user.disabled=b.disabled;
  if(user.role!==previousRole||!!user.disabled!==previousDisabled)user.sessionVersion=sessionVersion();
  user.updatedAt=new Date().toISOString();await env.ADMINS.put(UP+username,JSON.stringify(user));
  await log(env,{actor:actor.username,action:"update_admin",target:username,role});return json({ok:true})
 }
 if(path==="/admin/users/password"&&actor.role==="super_admin"&&req.method==="POST"){
  const b=await req.json(),username=uname(b.username),password=String(b.password||""),user=await getUser(env,username);
  if(!user)return json({error:"الحساب غير موجود."},404);
  if(password.length<12)return json({error:"كلمة المرور يجب أن تتكون من 12 حرفاً على الأقل."},400);
  user.sessionVersion=sessionVersion();await saveUser(env,user,password);await log(env,{actor:actor.username,action:"reset_admin_password",target:username});return json({ok:true})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="DELETE"){
  const b=await req.json(),username=uname(b.username);if(!username)return json({error:"اسم المستخدم غير صالح."},400);
  if(username===actor.username)return json({error:"لا يمكنك حذف حسابك الحالي."},400);
  if(!await getUser(env,username))return json({error:"الحساب غير موجود."},404);
  await env.ADMINS.delete(UP+username);await log(env,{actor:actor.username,action:"delete_admin",target:username});return json({ok:true})
 }
 if(path==="/admin/audit"&&actor.role==="super_admin"&&req.method==="GET")return json({events:(await env.ADMINS.get(AUDIT,"json")||[]).slice(0,100)});
 return json({error:"Not found."},404)
}
export default {async fetch(req,env){const h=cors(req,env);const origin=req.headers.get("Origin")||"";if(origin&&!h["Access-Control-Allow-Origin"])return json({error:"Origin not allowed."},403);try{const r=await route(req,env),headers=new Headers(r.headers);for(const [k,v] of Object.entries(h))headers.set(k,v);return new Response(r.body,{status:r.status,headers})}catch(e){return json({error:e.message||"Worker error."},500,h)}}};