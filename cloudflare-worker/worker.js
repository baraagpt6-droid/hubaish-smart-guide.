// 2026-11-28: revalidate the workers.dev hostname returned by Cloudflare account metadata.
/**
 * Hubaish Smart Guide — Cloudflare Worker
 * Bind the production KV namespace as ADMINS. Required secrets: GITHUB_TOKEN and SESSION_SECRET.
 * BOOTSTRAP_KEY is required only for first-admin setup and must be removed afterward.
 */
const OWNER="baraagpt6-droid",REPO="hubaish-smart-guide.",BRANCH="main",FILE="www/data/live-content.json";
const ROLES=new Set(["super_admin","editor"]),ITER=100000,UP="user:",AUDIT="audit:latest",LIVE_KEY="live-content:published";
function b64bytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));return btoa(binary)}
const SECURITY_HEADERS={"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"microphone=(self)","Strict-Transport-Security":"max-age=31536000; includeSubDomains","Cross-Origin-Resource-Policy":"same-site","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...SECURITY_HEADERS,...h}});
const enc=s=>new TextEncoder().encode(s),dec=b=>new TextDecoder().decode(b);
function requestError(status,message){const error=new Error(message);error.status=status;return error}
async function readJson(req,maxBytes=16384){
 const contentType=(req.headers.get("Content-Type")||"").toLowerCase();
 if(!contentType.startsWith("application/json"))throw requestError(415,"Content-Type must be application/json.");
 const declaredHeader=req.headers.get("Content-Length");
 if(declaredHeader!==null){
  const declared=Number(declaredHeader);
  if(!Number.isSafeInteger(declared)||declared<0)throw requestError(400,"Invalid Content-Length.");
  if(declared>maxBytes)throw requestError(413,"Request body exceeds the allowed size.");
 }
 if(!req.body)throw requestError(400,"JSON request body is required.");
 const reader=req.body.getReader(),chunks=[];let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;
   if(size>maxBytes){await reader.cancel().catch(()=>{});throw requestError(413,"Request body exceeds the allowed size.");}
   chunks.push(value);
  }
 }finally{try{reader.releaseLock()}catch{}}
 const bytes=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 let raw;
 try{raw=new TextDecoder("utf-8",{fatal:true}).decode(bytes)}
 catch{throw requestError(400,"Request body must be valid UTF-8.")}
 try{return JSON.parse(raw)}
 catch{throw requestError(400,"Request body must contain valid JSON.")}
}
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
 const defaults=["https://baraagpt6-droid.github.io","capacitor://localhost"];
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
async function publishLiveContent(env,data){
 if(!env.ADMINS)return false;
 const snapshot={...data,schemaVersion:1,updatedAt:data.updatedAt||new Date().toISOString()};
 await env.ADMINS.put(LIVE_KEY,JSON.stringify(snapshot));
 return true;
}
async function readLiveContent(env){
 let snapshot=env.ADMINS?await env.ADMINS.get(LIVE_KEY,"json"):null;
 if(!snapshot||snapshot.schemaVersion!==1){
  snapshot=(await ghRead(env)).data;
  const keys=["landmarks","historyEvents","subDistrictUpdates","subDistricts","historicalFigures","communityLinks"];
  if(!snapshot||snapshot.schemaVersion!==1||!keys.every(key=>Array.isArray(snapshot[key])))throw Error("Live content schema is invalid.");
  if(env.ADMINS)await env.ADMINS.put(LIVE_KEY,JSON.stringify(snapshot));
 }
 return snapshot;
}
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
 if(req.method==="GET"&&path==="/public/quick-add-image"){
  if(!env.ADMINS)return json({error:"Image store unavailable."},503);
  const id=String(u.searchParams.get("id")||"");
  if(!/^quick-[0-9a-f-]{36}$/i.test(id))return json({error:"Invalid image id."},400);
  const stored=await env.ADMINS.get("quick-image:"+id,"json");
  if(!stored||!/^image\/(?:jpeg|png|webp)$/.test(String(stored.mimeType||""))||typeof stored.dataUrl!=="string")return json({error:"Published image not found."},404);
  const match=stored.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match||match[1]!==stored.mimeType)return json({error:"Stored image is invalid."},415);
  const bytes=Uint8Array.from(atob(match[2]),ch=>ch.charCodeAt(0));
  const headers={...cors(req,env),...SECURITY_HEADERS,"Content-Type":match[1],"Content-Length":String(bytes.length),"Cache-Control":"public, max-age=86400, immutable","Cross-Origin-Resource-Policy":"cross-origin","X-Content-Type-Options":"nosniff"};
  return new Response(bytes,{status:200,headers});
 }
 if(req.method==="GET"&&path==="/api/live-content"){
  try{
   const content=await readLiveContent(env);
   const updatedAt=String(content.updatedAt||"");
   return json({content,updatedAt,revision:updatedAt||"initial",source:"cloudflare-kv"},200,{"Cache-Control":"no-store","X-Hubaish-Live-Feed":"1"});
  }catch{
   return json({error:"Live content is temporarily unavailable."},503,{"Cache-Control":"no-store"});
  }
 }
 if(req.method==="POST"&&path==="/public/photo-submissions"){
  return json({ok:false,error:"Visitor photo submissions are temporarily disabled."},410);
 }
 if(req.method==="GET"&&path==="/public/community-submissions/attachment"){
  if(!env.ADMINS)return json({error:"Public archive unavailable."},503);
  const id=String(u.searchParams.get("id")||"");
  if(!/^[0-9a-f-]{20,40}$/i.test(id))return json({error:"Invalid attachment id."},400);
  const value=await env.ADMINS.get("community-published:"+id,"json");
  if(!value||value.status!=="approved"||value.type!=="archive"||!value.attachment?.dataUrl)return json({error:"Published image not found."},404);
  const match=String(value.attachment.dataUrl).match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match)return json({error:"Only approved archive images may be displayed."},415);
  const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  const owner=esc(value.ownerName||"صاحب الوثيقة غير محدد"),brand="أرشيف دليل حبيش الذكي";
  const watermark=Array.from({length:18},(_,i)=>{const x=(i%3)*360+180,y=Math.floor(i/3)*230+120;return '<text x="'+x+'" y="'+y+'" fill="#ffe291" fill-opacity=".24" font-family="sans-serif" font-size="30" font-weight="700" text-anchor="middle">'+brand+'</text><text x="'+x+'" y="'+(y+34)+'" fill="#ffffff" fill-opacity=".22" font-family="sans-serif" font-size="24" text-anchor="middle">'+owner+'</text>'}).join("");
  const svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="1800" viewBox="0 0 900 1800"><image x="0" y="0" width="900" height="1800" preserveAspectRatio="xMidYMid meet" href="'+value.attachment.dataUrl+'" xlink:href="'+value.attachment.dataUrl+'"/><g transform="rotate(-24 450 900)">'+watermark+'</g></svg>';
  const headers={...cors(req,env),...SECURITY_HEADERS,"Content-Type":"image/svg+xml; charset=utf-8","Content-Length":String(new TextEncoder().encode(svg).length),"Content-Disposition":"inline; filename=watermarked-archive.svg","Cache-Control":"private, max-age=300","Cross-Origin-Resource-Policy":"cross-origin","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; img-src data:; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"};
  return new Response(svg,{status:200,headers});
 }
 if(req.method==="GET"&&path==="/public/community-submissions"){
  if(!env.ADMINS)return json({error:"Public submissions store unavailable."},503);
  const keys=await env.ADMINS.list({prefix:"community-published:",limit:100}),submissions=[];
  for(const key of keys.keys){
   const value=await env.ADMINS.get(key.name,"json");
   if(value&&value.status==="approved")submissions.push({
    id:value.id,type:value.type,name:value.name,title:value.title,body:value.body,source:value.source,
    createdAt:value.reviewedAt||value.submittedAt,
    contactPublic:value.type==="marketplace"&&value.contactPublic===true?value.contactPublicValue:"",ownerName:value.type==="archive"?(value.ownerName||""):"",marketCategory:value.marketCategory||"",location:value.location||"",
    hasAttachment:!!value.attachment,attachmentName:value.attachment?.name||"",attachmentUrl:value.type==="archive"&&["image/jpeg","image/png","image/webp"].includes(value.attachment?.mimeType)?"/public/community-submissions/attachment?id="+encodeURIComponent(value.id):""
   });
  }
  submissions.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  return json({submissions});
 }
 if(req.method==="POST"&&path==="/public/community-submissions"){
  if(!env.ADMINS)return json({error:"Submission store unavailable."},503);
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384);
  const types=new Set(["author","family","archive","marketplace"]);
  const clean=(v,max)=>(typeof v==="string"?v:"").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,max);
  const type=String(b.type||"");
  const name=clean(b.name,120),title=clean(b.title,180),body=clean(b.body,5000),source=clean(b.source,1000),contact=clean(b.contact,160),ownerName=clean(b.ownerName,160),marketCategory=clean(b.marketCategory,40);
  if(!types.has(type)||!name||!title||!body||b.publishConsent!==true)return json({error:"A valid category, name, title, content and rights consent are required."},400);
  if(type==="marketplace"&&!contact)return json({error:"A contact method is required for a marketplace listing."},400);
  if(type==="marketplace"&&!["shop","artisan","service","weekly_market","sale","wanted"].includes(marketCategory))return json({error:"A marketplace category is required."},400);
  if(b.publicContact===true&&(!contact||type!=="marketplace"))return json({error:"Public contact is allowed only for marketplace listings."},400);
  let attachment=null;
  if(b.attachment!=null){
   const file=b.attachment,mime=String(file.mimeType||""),allowed=new Set(["application/pdf","text/plain","image/jpeg","image/png","image/webp","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
   const match=String(file.dataUrl||"").match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/);
   if(!allowed.has(mime)||!match||match[1]!==mime||match[2].length>420000)return json({error:"Unsupported or oversized attachment."},400);
   attachment={name:clean(file.name,120)||"attachment",mimeType:mime,dataUrl:file.dataUrl};
  }
  const ip=String(req.headers.get("CF-Connecting-IP")||"unknown"),ipHash=b64u(await crypto.subtle.digest("SHA-256",enc(ip)));
  const rateKey="community-submit-rate:"+ipHash,rate=await env.ADMINS.get(rateKey,"json")||{count:0};
  if(Number(rate.count||0)>=6)return json({error:"تم بلوغ حد الإرسال اليومي. حاول غداً."},429);
  const id=crypto.randomUUID(),submittedAt=new Date().toISOString();
  const record={id,type,name,title,body,source,contact,ownerName:type==="archive"?ownerName:"",marketCategory:type==="marketplace"?marketCategory:"",publicContact:b.publicContact===true&&type==="marketplace",publishConsent:true,attachment,submittedAt,status:"pending"};
  await env.ADMINS.put("community-submission:"+id,JSON.stringify(record),{expirationTtl:60*60*24*90});
  await env.ADMINS.put(rateKey,JSON.stringify({count:Number(rate.count||0)+1}),{expirationTtl:86400});
  return json({ok:true,id,status:"pending",message:"تم استلام الطلب وهو بانتظار المراجعة."},201);
 }
 if(!env.ADMINS||!env.GITHUB_TOKEN||!env.SESSION_SECRET) return json({error:"Configure ADMINS KV, GITHUB_TOKEN and SESSION_SECRET."},500);
 if(req.method==="GET"&&path==="/setup/status"){
  const keys=await env.ADMINS.list({prefix:UP,limit:1});
  return json({setupRequired:keys.keys.length===0,configured:true,bootstrapKeyConfigured:!!env.BOOTSTRAP_KEY});
 }
 if(req.method==="POST"&&path==="/setup"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),keys=await env.ADMINS.list({prefix:UP,limit:1});
  if(keys.keys.length)return json({error:"Initial setup already completed."},409);
  const setupIp=String(req.headers.get("CF-Connecting-IP")||"unknown");
  const setupIpHash=b64u(await crypto.subtle.digest("SHA-256",enc(setupIp)));
  const setupRateKey="setup-fail:"+setupIpHash;
  const setupRate=await env.ADMINS.get(setupRateKey,"json")||{count:0};
  if(Number(setupRate.count||0)>=6)return json({error:"Initial setup attempts are temporarily limited."},429,{"Retry-After":"900"});
  if(!env.BOOTSTRAP_KEY||b.bootstrapKey!==env.BOOTSTRAP_KEY){
   await env.ADMINS.put(setupRateKey,JSON.stringify({count:Number(setupRate.count||0)+1}),{expirationTtl:900});
   return json({error:"Invalid bootstrap key."},403);
  }
  await env.ADMINS.delete(setupRateKey);
  const username=uname(b.username),password=String(b.password||"");if(!username||password.length<12)return json({error:"Username required; password must be at least 12 characters."},400);
  await saveUser(env,{username,displayName:String(b.displayName||username).slice(0,80),role:"super_admin",disabled:false,sessionVersion:sessionVersion(),createdAt:new Date().toISOString()},password);
  await log(env,{actor:username,action:"bootstrap_super_admin"});return json({ok:true,message:"Admin created. Remove BOOTSTRAP_KEY secret now."},201)
 }
 if(req.method==="POST"&&path==="/auth/login"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),username=uname(b.username),password=String(b.password||""),user=username?await getUser(env,username):null;
  const ip=String(req.headers.get("CF-Connecting-IP")||"unknown");
  const ipHash=b64u(await crypto.subtle.digest("SHA-256",enc(ip)));
  const attemptKey="login-fail:"+ipHash+":"+username,ipAttemptKey="login-ip-fail:"+ipHash;
  const attempts=await env.ADMINS.get(attemptKey,"json")||{count:0};
  const ipAttempts=await env.ADMINS.get(ipAttemptKey,"json")||{count:0};
  if(Number(attempts.count||0)>=8||Number(ipAttempts.count||0)>=30)return json({error:"تم إيقاف محاولات الدخول مؤقتاً. حاول بعد 15 دقيقة."},429,{"Retry-After":"900"});
  let passwordValid=false;
  if(user&&!user.disabled){try{passwordValid=await passwordMatches(password,user)}catch{passwordValid=false}}
  if(!passwordValid){
   await env.ADMINS.put(attemptKey,JSON.stringify({count:Number(attempts.count||0)+1}),{expirationTtl:900});
   await env.ADMINS.put(ipAttemptKey,JSON.stringify({count:Number(ipAttempts.count||0)+1}),{expirationTtl:900});
   return json({error:"اسم المستخدم أو كلمة المرور غير صحيحة."},401);
  }
  await env.ADMINS.delete(attemptKey);
  const ttl=b.remember===true?30*86400000:8*3600000,token=await issue({sub:user.username,role:user.role,ver:versionOf(user),exp:Date.now()+ttl},env.SESSION_SECRET);
  await log(env,{actor:username,action:"login"});return json({token,expiresIn:ttl,user:{username,displayName:user.displayName,role:user.role}})
 }
 const actor=await auth(req,env);if(!actor)return json({error:"انتهت الجلسة أو بيانات الدخول غير صالحة."},401);
 if(path.startsWith("/review/")&&actor.role!=="super_admin")return json({error:"يتطلب هذا الإجراء صلاحية المشرف العام."},403);
 if(req.method==="GET"&&path==="/review/community-submissions"){
  const keys=await env.ADMINS.list({prefix:"community-submission:",limit:100}),submissions=[];
  for(const key of keys.keys){
   const value=await env.ADMINS.get(key.name,"json");
   if(value&&value.status==="pending")submissions.push({
    id:value.id,type:value.type,name:value.name,title:value.title,body:value.body,source:value.source,contact:value.contact,ownerName:value.ownerName||"",marketCategory:value.marketCategory||"",
    publicContact:!!value.publicContact,submittedAt:value.submittedAt,
    attachment:value.attachment?{name:value.attachment.name,mimeType:value.attachment.mimeType}:null
   });
  }
  submissions.sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt)));
  return json({submissions});
 }
 if(req.method==="GET"&&path==="/review/community-submissions/attachment"){
  const id=String(u.searchParams.get("id")||"");
  if(!/^[0-9a-f-]{20,40}$/i.test(id))return json({error:"Invalid submission id."},400);
  const value=await env.ADMINS.get("community-submission:"+id,"json");
  if(!value||value.status!=="pending"||!value.attachment?.dataUrl)return json({error:"Pending attachment not found."},404);
  const match=String(value.attachment.dataUrl).match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match)return json({error:"Stored attachment is invalid."},500);
  const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
  const filename=String(value.attachment.name||"attachment").replace(/[^\p{L}\p{N}._-]/gu,"_").slice(0,100)||"attachment";
  return new Response(bytes,{status:200,headers:{...SECURITY_HEADERS,"Content-Type":match[1],"Content-Length":String(bytes.length),"Content-Disposition":"inline; filename*=UTF-8''"+encodeURIComponent(filename),"Cache-Control":"no-store"}});
 }
 if(req.method==="PATCH"&&path==="/review/community-submissions"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),id=String(b.id||""),key="community-submission:"+id;
  if(!/^[0-9a-f-]{20,40}$/i.test(id))return json({error:"Invalid submission id."},400);
  const record=await env.ADMINS.get(key,"json");
  if(!record||record.status!=="pending")return json({error:"Pending submission not found."},404);
  if(b.action==="reject"){
   await env.ADMINS.delete(key);await log(env,{actor:actor.username,action:"reject_community_submission",target:id,type:record.type});
   return json({ok:true,status:"rejected"});
  }
  if(b.action!=="approve"||record.publishConsent!==true)return json({error:"Explicit rights approval is required."},400);
  const approved={id,type:record.type,name:record.name,title:record.title,body:record.body,source:record.source,ownerName:record.ownerName||"",marketCategory:record.marketCategory||"",
   contactPublic:record.type==="marketplace"&&record.publicContact===true,
   contactPublicValue:record.type==="marketplace"&&record.publicContact===true?record.contact:"",
   attachment:record.attachment||null,location:record.location||"",submittedAt:record.submittedAt,reviewedAt:new Date().toISOString(),reviewedBy:actor.username,status:"approved"};
  await env.ADMINS.put("community-published:"+id,JSON.stringify(approved),{expirationTtl:60*60*24*365});
  await env.ADMINS.delete(key);await log(env,{actor:actor.username,action:"approve_community_submission",target:id,type:record.type});
  return json({ok:true,status:"approved",id});
 }
 if(req.method==="POST"&&path==="/admin/quick-add"){
  if(!["super_admin","editor"].includes(actor.role))return json({error:"لا تملك صلاحية إضافة المحتوى."},403);
  const b=await readJson(req,700000);
  const type=String(b.type||"").trim(),title=String(b.title||"").trim().slice(0,180),name=String(b.name||"").trim().slice(0,120),body=String(b.body||"").trim().slice(0,5000),location=String(b.location||"").trim().slice(0,120),source=String(b.source||"").trim().slice(0,1000);
  if(!["photo","archive","author","figure","work","family","marketplace"].includes(type)||!title||!body||!location||b.rightsConsent!==true)return json({error:"أكمل النوع والعنوان والوصف والعزلة وتأكيد حق النشر."},400);
  let attachment=null;
  if(type==="photo"||type==="archive"){
   const file=b.attachment||{},mime=String(file.mimeType||"");
   const match=String(file.dataUrl||"").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
   if(!match||match[1]!==mime||match[2].length>390000)return json({error:"ارفع صورة JPEG أو PNG أو WebP بعد ختمها، وبحجم مناسب."},400);
   attachment={name:String(file.name||"image.webp").slice(0,120),mimeType:mime,dataUrl:file.dataUrl};
  }
  const live=(await ghRead(env)).data;
  const knownDistricts=(live.subDistricts||[]).map(x=>String(x.district_name_ar||"").trim()).filter(Boolean);
  if(!knownDistricts.includes(location))return json({error:"اختر عزلة من قائمة مديرية حبيش المعتمدة داخل التطبيق."},400);
  const id="quick-"+crypto.randomUUID(),now=new Date().toISOString();
  if(type==="photo"){
   if(!attachment||!source||!/^https?:\/\//i.test(source)||!String(b.photographer||"").trim()||!String(b.license||"").trim())return json({error:"الصورة تحتاج مصدراً ومصوراً ورخصة موثقة."},400);
   const category=String(b.category||"heritage");
   const categoryMap={forts:"fort",valleys:"valley",villages:"village",heritage:"mosque"};
   if(!categoryMap[category])return json({error:"تصنيف الصورة غير صالح."},400);
   live.landmarks.push({
    id,category:categoryMap[category],scope:"hubaish_district",
    title_ar:title,title_en:title,title_tr:title,title_fr:title,
    location_ar:location+"، مديرية حبيش",location_en:location+", Hubaish District",location_tr:location+", Hubaish",location_fr:location+", Hubaish",
    description_ar:body,description_en:body,description_tr:body,description_fr:body,
    source_text:source,source_url:source,
    image_url:new URL("/public/quick-add-image?id="+encodeURIComponent(id),u.origin).href,image_verified:true,image_category:category,
    image_photographer:String(b.photographer).trim().slice(0,160),image_credit:String(b.photographer).trim().slice(0,160),
    image_license:String(b.license).trim().slice(0,120),image_source_url:source,
    image_alt_ar:title,image_alt_en:title,image_alt_tr:title,image_alt_fr:title,
    image_caption_ar:body,image_caption_en:body,image_caption_tr:body,image_caption_fr:body,
    image_district_ar:location,image_district_en:location+", Hubaish District"
   });
   if(JSON.stringify(live).length>700000)return json({error:"ملف المحتوى تجاوز الحد المسموح."},413);
   live.updatedAt=now;live.updatedBy={username:actor.username,displayName:actor.displayName,role:actor.role};
   await env.ADMINS.put("quick-image:"+id,JSON.stringify(attachment),{expirationTtl:60*60*24*365});
   let result;
   try{result=await ghWrite(env,live,actor)}catch(error){await env.ADMINS.delete("quick-image:"+id);throw error}
   const liveFeedUpdated=await publishLiveContent(env,live).catch(()=>false);
   await log(env,{actor:actor.username,action:"quick_add_photo",target:id,location,commit:result.commit?.sha||null,liveFeedUpdated});
   return json({ok:true,id,type,updatedAt:live.updatedAt,liveFeedUpdated},201);
  }
  if(type==="archive"&&!attachment)return json({error:"اختر صورة الوثيقة حتى تُحفظ بعلامتها المائية."},400);
  if(type==="archive"&&!String(b.ownerName||"").trim())return json({error:"أدخل اسم صاحب الوثيقة أو الجهة المالكة."},400);
  if((type==="author"||type==="figure"||type==="work")&&!name)return json({error:"أدخل اسم صاحب السجل أو المؤلف."},400);
  if(type==="family"&&!name)return json({error:"أدخل اسم الأسرة أو العائلة."},400);
  const marketCategory=String(b.marketCategory||"");
  if(type==="marketplace"&&!["shop","artisan","service","weekly_market","sale","wanted"].includes(marketCategory))return json({error:"اختر تصنيف إعلان السوق."},400);
  const contact=String(b.contact||"").trim().slice(0,160);
  const publicContact=b.publicContact===true&&type==="marketplace"&&!!contact;
  const record={id,type,name:name||String(b.ownerName||actor.displayName||actor.username).slice(0,120),title,body,source,location,ownerName:type==="archive"?String(b.ownerName).trim().slice(0,160):"",marketCategory:type==="marketplace"?marketCategory:"",publicContact,contact,contactPublic:publicContact,contactPublicValue:publicContact?contact:"",attachment,submittedAt:now,reviewedAt:now,reviewedBy:actor.username,status:"approved",publishConsent:true};
  await env.ADMINS.put("community-published:"+id,JSON.stringify(record),{expirationTtl:60*60*24*365});
  await log(env,{actor:actor.username,action:"quick_add_"+type,target:id,location});
  return json({ok:true,id,type,updatedAt:now},201);
 }
 if(path.startsWith("/admin/")&&actor.role!=="super_admin")return json({error:"يتطلب هذا الإجراء صلاحية المشرف العام."},403);
 if(req.method==="GET"&&path==="/review/photo-submissions"){
  const keys=await env.ADMINS.list({prefix:"photo-submission:",limit:100}),submissions=[];
  for(const key of keys.keys){const value=await env.ADMINS.get(key.name,"json");if(value&&value.status==="pending")submissions.push(value)}
  submissions.sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt)));return json({submissions})
 }
 if((req.method==="PATCH"||req.method==="DELETE")&&path==="/review/photo-submissions"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),id=String(b.id||"").trim(),key="photo-submission:"+id;
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
  const result=await ghWrite(env,doc,actor);const liveFeedUpdated=await publishLiveContent(env,doc).catch(()=>false);await env.ADMINS.delete(key);await log(env,{actor:actor.username,action:"approve_visitor_photo",target:id,commit:result.commit?.sha||null,liveFeedUpdated});return json({ok:true,commit:result.commit?.sha||null,liveFeedUpdated})
 }
 if(req.method==="GET"&&path==="/auth/me")return json({user:actor});
 if(req.method==="PUT"&&path==="/content"){
  const d=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),keys=["landmarks","historyEvents","subDistrictUpdates","subDistricts","historicalFigures","communityLinks"];
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
  const result=await ghWrite(env,d,actor);const liveFeedUpdated=await publishLiveContent(env,d).catch(()=>false);await log(env,{actor:actor.username,displayName:actor.displayName,role:actor.role,action:"publish_content",changes:changes.slice(0,100),commit:result.commit?.sha||null,liveFeedUpdated});
  return json({ok:true,updatedAt:d.updatedAt,updatedBy:d.updatedBy,commit:result.commit?.sha||null,liveFeedUpdated})
 }

 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="GET"){
  const keys=await env.ADMINS.list({prefix:UP,limit:100}),users=[];for(const k of keys.keys){const x=await getUser(env,k.name.slice(UP.length));if(x)users.push({username:x.username,displayName:x.displayName,role:x.role,disabled:!!x.disabled,createdAt:x.createdAt})}return json({users})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="POST"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),username=uname(b.username),password=String(b.password||""),role=String(b.role||"editor");
  if(!username||password.length<12||!ROLES.has(role))return json({error:"اسم المستخدم مطلوب وكلمة المرور 12 حرفاً على الأقل."},400);
  if(await getUser(env,username))return json({error:"اسم المستخدم مستخدم بالفعل."},409);
  await saveUser(env,{username,displayName:String(b.displayName||username).slice(0,80),role,disabled:false,sessionVersion:sessionVersion(),createdAt:new Date().toISOString()},password);await log(env,{actor:actor.username,action:"create_admin",target:username,role});return json({ok:true},201)
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="PATCH"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),username=uname(b.username),user=await getUser(env,username);if(!user)return json({error:"الحساب غير موجود."},404);if(username===actor.username)return json({error:"لا يمكنك تعطيل حسابك الحالي."},400);
  const wasDisabled=!!user.disabled;user.disabled=b.disabled===true;if(user.disabled!==wasDisabled)user.sessionVersion=sessionVersion();user.updatedAt=new Date().toISOString();await env.ADMINS.put(UP+username,JSON.stringify(user));await log(env,{actor:actor.username,action:user.disabled?"disable_admin":"enable_admin",target:username});return json({ok:true})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="PUT"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),username=uname(b.username),user=await getUser(env,username);
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
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),username=uname(b.username),password=String(b.password||""),user=await getUser(env,username);
  if(!user)return json({error:"الحساب غير موجود."},404);
  if(password.length<12)return json({error:"كلمة المرور يجب أن تتكون من 12 حرفاً على الأقل."},400);
  user.sessionVersion=sessionVersion();await saveUser(env,user,password);await log(env,{actor:actor.username,action:"reset_admin_password",target:username});return json({ok:true})
 }
 if(path==="/admin/users"&&actor.role==="super_admin"&&req.method==="DELETE"){
  const b=await readJson(req,path==="/public/community-submissions"?480000:path==="/content"?700000:16384),username=uname(b.username);if(!username)return json({error:"اسم المستخدم غير صالح."},400);
  if(username===actor.username)return json({error:"لا يمكنك حذف حسابك الحالي."},400);
  if(!await getUser(env,username))return json({error:"الحساب غير موجود."},404);
  await env.ADMINS.delete(UP+username);await log(env,{actor:actor.username,action:"delete_admin",target:username});return json({ok:true})
 }
 if(path==="/admin/audit"&&actor.role==="super_admin"&&req.method==="GET")return json({events:(await env.ADMINS.get(AUDIT,"json")||[]).slice(0,100)});
 return json({error:"Not found."},404)
}
export default {async fetch(req,env){const h=cors(req,env);const origin=req.headers.get("Origin")||"";if(origin&&!h["Access-Control-Allow-Origin"])return json({error:"Origin not allowed."},403);try{const r=await route(req,env),headers=new Headers(r.headers);for(const [k,v] of Object.entries(h))headers.set(k,v);return new Response(r.body,{status:r.status,headers})}catch(e){const status=Number(e?.status)||500;const message=status>=400&&status<500?String(e?.message||"Invalid request.").slice(0,160):"Worker internal error.";return json({error:message},status,h)}}};