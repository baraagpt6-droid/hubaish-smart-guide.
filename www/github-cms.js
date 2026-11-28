'use strict';
(() => {
  const OWNER='baraagpt6-droid';
  const REPO='hubaish-smart-guide.';
  const BRANCH='main';
  const FILE='www/data/live-content.json';
  const RAW_URL='https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/'+BRANCH+'/'+FILE;
  const CACHE_KEY='hubaish_github_live_content_v1';
  const TABLES={
    landmark:'landmarks',
    history_event:'historyEvents',
    sub_district_update:'subDistrictUpdates',
    sub_district:'subDistricts',
    historical_figure:'historicalFigures',
    community_link:'communityLinks'
  };
  const $=id=>document.getElementById(id);
  function fetchWithTimeout(url,options={},timeoutMs=15000){
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),timeoutMs);
    return fetch(url,{...options,signal:controller.signal}).finally(()=>window.clearTimeout(timeout));
  }
  let documentData=readCache();
  const LEGACY_EXCLUDED_IDS=new Set(['p1','p12','p15','h3','al-dhuhrah-historic-settlement','\u006a\u0061\u0062\u0061\u006c-\u0064\u0068\u0069-\u0068\u0061\u0072\u0072\u0061\u006e']);
  const LEGACY_EXCLUDED_TEXT=/\u0645\u062f\u064a\u0646\u0629\s*\u0627\u0644\u0638\u0627\u0647\u0631\u0629|\u0635\u0647\u0628\u0627\u0646|\u0073\u0061\u0068\u0062\u0061\u006e|\u0648\u0627\u062f\u064a\s*\u0628\u0646\u0627\u0621|\u0077\u0061\u0064\u0069\s*\u0062\u0069\u006e\u0061|\u062c\u0628\u0644(?:\s*\u0630\u064a)?\s*\u0647\u0631\u0651?\u0627\u0646|\u006a\u0061\u0062\u0061\u006c\s*(?:\u0064\u0068\u0069\s*)?\u0068\u0061\u0072\u0072\u0061\u006e/i;
  let workerToken=sessionStorage.getItem('hubaish_worker_session')||localStorage.getItem('hubaish_worker_session')||'';
  let workerUser=(()=>{try{return JSON.parse(sessionStorage.getItem('hubaish_worker_user')||localStorage.getItem('hubaish_worker_user')||'null')}catch{return null}})();
  const DEFAULT_WORKER_URL='https://hubaish-cms.baraagpt6.workers.dev';
  // Remove any previously persisted endpoint. Production now has one canonical Worker URL.
  localStorage.removeItem('hubaish_worker_url');
  let workerUrl=DEFAULT_WORKER_URL;
  let started=false;
  let syncing=false;
  let saving=false;
  let setupState={checked:false,setupRequired:false,bootstrapKeyConfigured:false,error:''};

  function emptyDocument(){
    return {schemaVersion:1,updatedAt:null,landmarks:[],historyEvents:[],subDistrictUpdates:[],subDistricts:[],historicalFigures:[],communityLinks:[]};
  }
  function normalizeDocument(value){
    const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const clean={schemaVersion:1,updatedAt:typeof source.updatedAt==='string'?source.updatedAt:null,updatedBy:source.updatedBy&&typeof source.updatedBy==='object'?{username:String(source.updatedBy.username||''),displayName:String(source.updatedBy.displayName||''),role:String(source.updatedBy.role||'')}:null};
    for(const key of Object.values(TABLES))clean[key]=Array.isArray(source[key])?source[key].filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).filter(x=>{
      const id=String(x.id||'');
      if((key==='landmarks'&&LEGACY_EXCLUDED_IDS.has(id))||(key==='historyEvents'&&id==='h3'))return false;
      const searchable=[x.title_ar,x.title_en,x.location_ar,x.location_en,x.description_ar,x.description_en,x.body_ar,x.body_en].filter(Boolean).join(' ');
      return !LEGACY_EXCLUDED_TEXT.test(searchable);
    }).slice(0,1000):[];
    return clean;
  }
  function readCache(){
    try{return normalizeDocument(JSON.parse(localStorage.getItem(CACHE_KEY)||'null'))}
    catch{return emptyDocument()}
  }
  function saveCache(){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(documentData));return true}
    catch{return false}
  }
  function status(message,error){
    const el=$('cloudStatus');
    if(el){el.textContent=message;el.classList.toggle('cloud-error',!!error);el.classList.toggle('cloud-ok',!error);el.classList.toggle('cloud-offline',/وضع العمل المحلي دون اتصال بالسحابة/.test(String(message||'')))}
  }
  function adminStatus(){
    const authenticated=!!workerToken&&!!workerUser?.username;
    const canBootstrap=!setupState.error&&setupState.checked&&setupState.setupRequired&&setupState.bootstrapKeyConfigured;
    $('workerSetupArea')?.classList.toggle('hidden',authenticated||!canBootstrap);
    $('cloudAdminLoginArea')?.classList.toggle('hidden',authenticated||canBootstrap);
    $('cloudAdminPanel')?.classList.toggle('hidden',!authenticated);
    $('cloudSuperAdminPanel')?.classList.toggle('hidden',!authenticated||workerUser?.role!=='super_admin');
    window.HubaishSyncAdminTabs?.();
    $('workerBootstrapCleanupNotice')?.classList.toggle('hidden',!authenticated||setupState.setupRequired||!setupState.bootstrapKeyConfigured);
    const identity=$('cloudAdminIdentity');
    if(identity)identity.textContent=authenticated?(workerUser.displayName||workerUser.username)+' · '+(workerUser.role==='super_admin'?'مشرف عام':'محرر محتوى'):'';
  }
  function toast(message){
    if(typeof window.showToast==='function')window.showToast(message);
    else if($('toast')){$('toast').textContent=message;$('toast').classList.add('show')}
  }
  function lang(){
    const value=String(document.documentElement.lang||'ar').toUpperCase();
    return ['AR','EN','TR','FR'].includes(value)?value:'AR';
  }
  function localized(row,key,l){
    const code=String(l||lang()).toLowerCase();
    return String(row?.[key+'_'+code]??row?.[key+'_ar']??row?.[key+'_en']??'');
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function safeUrl(value){
    try{const url=new URL(String(value||''));return url.protocol==='https:'||url.protocol==='http:'}
    catch{return false}
  }
  function safeImageSource(value){
    const text=String(value||'');
    const bundledHeritageImage=/^\.\/assets\/heritage\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)$/i.test(text);
    return safeUrl(text)||bundledHeritageImage||(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(text)&&text.length<=260000);
  }
  function deepCopy(value){return JSON.parse(JSON.stringify(value))}
  function slug(value){
    return String(value||'').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,90)||'record';
  }
  function makeId(type){
    const suffix=globalThis.crypto?.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    return 'cms-'+type+'-'+suffix;
  }
  async function publicFetch(){
    const candidates=[DEFAULT_WORKER_URL+'/api/live-content',RAW_URL+'?v='+Date.now(),new URL('./data/live-content.json',document.baseURI).href];
    let lastError=null;
    for(const url of candidates){
      try{
        const response=await fetchWithTimeout(url,{cache:'no-store',headers:{Accept:'application/json','Cache-Control':'no-cache'}},12000);
        if(!response.ok)throw new Error('HTTP '+response.status);
        const incoming=await response.json();const parsed=normalizeDocument(incoming?.content||incoming);
        const incomingTime=parsed.updatedAt?Date.parse(parsed.updatedAt):0;
        const cachedTime=documentData.updatedAt?Date.parse(documentData.updatedAt):0;
        if(incomingTime&&cachedTime&&incomingTime<cachedTime)throw new Error('تم تجاهل نسخة أقدم من الكاش المحلي.');
        return parsed;
      }catch(error){lastError=error}
    }
    throw lastError||new Error('Network unavailable');
  }
  function mapPlace(row,l){
    return {
      id:String(row.id||makeId('landmark')),
      cmsOverride:true,
      cat:['fort','mosque','valley','mountain','market','school'].includes(row.category)?row.category:'fort',
      scope:['hubaish_district','adjacent_area','unverified_location'].includes(row.scope)?row.scope:'hubaish_district',
      title:localized(row,'title',l),
      loc:localized(row,'location',l)||'مديرية حبيش',
      body:localized(row,'description',l),
      elevation:row.elevation||'غير موثق ميدانياً',
      latitude:Number.isFinite(Number(row.latitude))?Number(row.latitude):null,
      longitude:Number.isFinite(Number(row.longitude))?Number(row.longitude):null,
      importance:localized(row,'importance',l),
      source:row.source_text||'',
      sourceUrl:row.source_url||'',
      sourceTitle:String(row.source_title||''),
      sourceAuthor:String(row.source_author||''),
      sourcePage:Number.isInteger(Number(row.source_page))&&Number(row.source_page)>0?Number(row.source_page):null,
      evidenceLevel:String(row.evidence_level||''),
      imageUrl:safeImageSource(row.image_url)?row.image_url:'',
      imageAlt:localized(row,'image_alt',l)||String(row.image_alt_ar||localized(row,'title',l)).slice(0,180),
      imageCaption:localized(row,'image_caption',l),
      imageCategory:['forts','valleys','villages','heritage'].includes(row.image_category)?row.image_category:'',
      imagePhotographer:String(row.image_photographer||'').slice(0,160),
      imageVerified:row.image_verified===true,
      imageLicense:String(row.image_license||'').slice(0,160),
      imageCredit:String(row.image_credit||'').slice(0,160),
      imageSourceUrl:safeUrl(row.image_source_url)?row.image_source_url:'',
      status:['documented','local','unverified'].includes(row.status)?row.status:'documented'
    };
  }
  function mapHistory(row,l){
    return {
      id:String(row.id||makeId('history')),
      cmsOverride:true,
      scope:['hubaish_district','adjacent_area','unverified_location'].includes(row.scope)?row.scope:'hubaish_district',
      era:row.era==='modern'?'modern':'ancient',
      title:localized(row,'title',l),
      period:localized(row,'period',l),
      body:localized(row,'body',l),
      source:row.source_text||'',
      sourceUrl:row.source_url||'',
      status:['documented','local','unverified'].includes(row.status)?row.status:'documented'
    };
  }
  function mapPerson(row,l){
    return {
      id:String(row.id||''),
      title:localized(row,'name',l),
      role:localized(row,'role',l),
      body:localized(row,'biography',l),
      source:row.source_text||'',
      sourceUrl:row.source_url||''
    };
  }
  function applyCached(){
    const l=lang();
    const landmarks=documentData.landmarks.map(x=>mapPlace(x,l)).filter(x=>x.title&&x.body);
    const history=documentData.historyEvents.map(x=>mapHistory(x,l)).filter(x=>x.title&&x.body);
    const links=documentData.communityLinks.filter(x=>x.id!=='community-main').map(x=>({id:x.id,cloudId:x.id,name:localized(x,'label',l),url:x.url})).filter(x=>x.name&&safeUrl(x.url));
    const people=documentData.historicalFigures.map(x=>mapPerson(x,l)).filter(x=>x.title&&x.body);
    window.HubaishRuntime?.applyCloudData?.({landmarks,history,links});
    window.HubaishFeatures?.setCloudPeople?.(people);
    const mainLink=documentData.communityLinks.find(x=>x.id==='community-main');
    window.HubaishFeatures?.setCommunityUrl?.(mainLink&&safeUrl(mainLink.url)?mainLink.url:'');
    window.HubaishFeatures?.renderSmartItineraries?.();
    window.HubaishFeatures?.renderSmartCompare?.();
  }
  function districtUpdates(name,l){
    return documentData.subDistrictUpdates.filter(x=>String(x.district_name_ar||'').trim()===String(name||'').trim()).map(x=>({
      place:localized(x,'place_name',l),
      description:localized(x,'description',l),
      source:x.source_text||'',
      sourceUrl:safeUrl(x.source_url)?x.source_url:''
    })).filter(x=>x.place||x.description);
  }
  function districtProfile(name,l){
    const row=documentData.subDistricts.find(x=>String(x.district_name_ar||'').trim()===String(name||'').trim());
    if(!row)return null;
    return {name:localized(row,'title',l),description:localized(row,'body',l)};
  }
  async function sync(silent){
    if(syncing||!navigator.onLine)return false;
    syncing=true;
    try{
      const next=await publicFetch();
      const changed=JSON.stringify(next)!==JSON.stringify(documentData);
      documentData=next;
      saveCache();
      applyCached();
      window.HubaishRuntime?.renderAll?.();
      if(changed&&!silent)toast('تم تحديث محتوى الموسوعة من GitHub.');
      status('محتوى GitHub محدث · '+new Date().toLocaleTimeString('ar'),false);
      return true;
    }catch(error){
      applyCached();
      const hasCache=!!(documentData.updatedAt||Object.values(TABLES).some(key=>documentData[key].length));
      status(hasCache?'تعذر الاتصال الآن. يعرض التطبيق آخر نسخة محفوظة.':'لا توجد بيانات سحابية جديدة. يعمل المحتوى الأساسي محلياً.',!!hasCache);
      if(!silent&&!hasCache)toast('تعذر تحميل ملف المحتوى المباشر. بقيت البيانات الأساسية متاحة.');
      return false;
    }finally{syncing=false}
  }
  function isAdmin(){return !!workerToken&&!!workerUser?.username}
  function workerRequest(path,options={}){
    workerUrl=DEFAULT_WORKER_URL;
    return fetchWithTimeout(workerUrl+path,{...options,headers:{...(options.headers||{}),...(workerToken?{Authorization:'Bearer '+workerToken}:{})},cache:'no-store'},15000);
  }
  async function readWorkerJson(response,fallback){
    const raw=await response.text();let result={};try{result=raw?JSON.parse(raw):{}}catch{throw new Error('أعاد الخادم استجابة غير صالحة.')}
    if(!response.ok)throw new Error(result.error||fallback||('تعذر تنفيذ الطلب (HTTP '+response.status+').'));
    return result;
  }
  async function refreshSetupStatus(){
    try{
      const response=await fetchWithTimeout(DEFAULT_WORKER_URL+'/setup/status',{headers:{Accept:'application/json'},cache:'no-store'},10000);
      const result=await readWorkerJson(response,'تعذر فحص حالة تأسيس المشرفين.');
      if(typeof result.setupRequired!=='boolean')throw new Error('استجابة حالة التأسيس غير مكتملة.');
      setupState={checked:true,setupRequired:result.setupRequired,bootstrapKeyConfigured:result.bootstrapKeyConfigured===true,error:''};
      adminStatus();
      if(result.setupRequired&&result.bootstrapKeyConfigured){
        status('لم يُنشأ مشرف بعد. أكمل تأسيس حساب المشرف الأول.',false);
      }else if(result.setupRequired&&!result.bootstrapKeyConfigured){
        status('لا يوجد مشرف. أضف BOOTSTRAP_KEY إلى أسرار Worker أولاً.',true);
      }else if(!result.setupRequired&&result.bootstrapKeyConfigured){
        status('احذف BOOTSTRAP_KEY من أسرار Cloudflare الآن.',true);
      }else if(!workerToken){
        status('السحابة متصلة وجاهزة للدخول.',false);
      }
      return result;
    }catch(error){
      setupState={checked:true,setupRequired:false,bootstrapKeyConfigured:false,error:'offline'};
      adminStatus();
      status('وضع العمل المحلي دون اتصال بالسحابة. يمكنك قراءة المحتوى المحفوظ؛ تحقق من الشبكة ثم أعد المحاولة.',false);
      return null;
    }
  }
  async function firstAdminSetup(event){
    event.preventDefault();
    const form=$('workerSetupForm'),submit=form?.querySelector('button[type="submit"]');
    const bootstrapKey=String($('workerBootstrapKey')?.value||'');
    const username=String($('workerSetupUsername')?.value||'').trim();
    const password=String($('workerSetupPassword')?.value||'');
    if(!bootstrapKey||!username||password.length<12){
      status('أدخل مفتاح التأسيس واسم المستخدم وكلمة مرور من 12 حرفاً على الأقل.',true);return;
    }
    if(submit){submit.disabled=true;submit.dataset.originalText=submit.textContent;submit.textContent='جارٍ إنشاء المشرف...'}
    status('جارٍ إنشاء أول حساب مشرف داخل Cloudflare KV...',false);
    try{
      const response=await fetchWithTimeout(DEFAULT_WORKER_URL+'/setup',{
        method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({bootstrapKey,username,password,displayName:username}),cache:'no-store'
      },20000);
      const result=await readWorkerJson(response,'تعذر إنشاء حساب المشرف الأول.');
      if($('workerBootstrapKey'))$('workerBootstrapKey').value='';
      setupState={checked:true,setupRequired:false,bootstrapKeyConfigured:true,error:''};
      adminStatus();
      await finishWorkerLogin(username,password,false);
      if($('workerSetupPassword'))$('workerSetupPassword').value='';
      if($('workerSetupUsername'))$('workerSetupUsername').value='';
      status('تم إنشاء المشرف وتسجيل الدخول. احذف BOOTSTRAP_KEY من أسرار Cloudflare Worker فوراً.',true);
      toast(result.message||'تم إنشاء حساب المشرف الأول.');
    }catch(error){
      status(error?.name==='AbortError'?'انتهت مهلة الاتصال بخادم الإدارة أثناء التأسيس. تحقق من إعداد Worker وحاول مجدداً.':error.message||'تعذر إكمال تأسيس المشرف الأول.',true);
      toast('لم يكتمل تأسيس حساب المشرف. راجع إعدادات Worker.');
    }finally{
      if(submit){submit.disabled=false;submit.textContent=submit.dataset.originalText||'إنشاء المشرف الأول';delete submit.dataset.originalText}
    }
  }
  async function finishWorkerLogin(username,password,remember){
    const response=await fetchWithTimeout(DEFAULT_WORKER_URL+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({username:String(username||'').trim(),password,remember:!!remember}),cache:'no-store'},15000);
    const result=await readWorkerJson(response,'اسم المستخدم أو كلمة المرور غير صحيحة.');
    if(!result.token||!result.user?.username)throw new Error('لم يرسل خادم الإدارة بيانات جلسة صالحة.');
    workerUrl=DEFAULT_WORKER_URL;workerToken=result.token;workerUser=result.user;
    const store=remember?localStorage:sessionStorage,other=remember?sessionStorage:localStorage;
    store.setItem('hubaish_worker_session',workerToken);store.setItem('hubaish_worker_user',JSON.stringify(workerUser));other.removeItem('hubaish_worker_session');other.removeItem('hubaish_worker_user');
    const verified=await readWorkerJson(await workerRequest('/auth/me'),'تعذر تأكيد جلسة المشرف.');
    if(!verified.user?.username)throw new Error('جلسة المصادقة غير مكتملة.');
    workerUser=verified.user;store.setItem('hubaish_worker_user',JSON.stringify(workerUser));
    adminStatus();
    try{documentData=await publicFetch();saveCache();applyCached()}catch{applyCached()}
    renderAdminList();
    if(workerUser.role==='super_admin'){
      try{await loadWorkerAdminData()}
      catch(error){
        const networkFailure=error?.name==='AbortError'||/failed to fetch|networkerror|load failed|fetch failed/i.test(String(error?.message||''));
        status(networkFailure
          ?'وضع العمل المحلي دون اتصال بالسحابة. تم التحقق من دخولك، لكن تعذر تحميل أدوات المشرف. تحقق من الشبكة ثم حدّث اللوحة.'
          :'تم الدخول، لكن تعذر تحميل إدارة الحسابات. '+String(error?.message||'حاول التحديث مرة أخرى.'),
          !networkFailure);
      }
    }
    await loadCommunitySubmissions();
    adminStatus();status('تم تسجيل الدخول والتحقق من الصلاحيات.',false);toast('مرحباً '+(workerUser.displayName||workerUser.username));
  }
  async function workerLogin(event){
    event.preventDefault();workerUrl=DEFAULT_WORKER_URL;
    const submit=$('workerLoginForm')?.querySelector('button[type="submit"]');
    const username=String($('workerUsername')?.value||'').trim(),password=String($('workerPassword')?.value||'');
    if(!username||!password){status('أدخل اسم المستخدم وكلمة المرور.',true);return}
    if(submit){submit.disabled=true;submit.dataset.originalText=submit.textContent;submit.textContent='جارٍ التحقق...'}
    status('جارٍ التحقق من حساب المشرف...',false);
    try{await finishWorkerLogin(username,password,!!$('workerRemember')?.checked);if($('workerPassword'))$('workerPassword').value=''}catch(error){
      workerToken='';workerUser=null;['hubaish_worker_session','hubaish_worker_user'].forEach(key=>{localStorage.removeItem(key);sessionStorage.removeItem(key)});
      adminStatus();
      const networkFailure=error?.name==='AbortError'||/failed to fetch|networkerror|load failed|fetch failed/i.test(String(error?.message||''));
      status(networkFailure?'وضع العمل المحلي دون اتصال بالسحابة. تحقق من اتصال الشبكة ثم حاول الدخول مجدداً.':error.message||'تعذر تسجيل الدخول. حاول مرة أخرى.',!networkFailure);
    }finally{if(submit){submit.disabled=false;submit.textContent=submit.dataset.originalText||'دخول آمن';delete submit.dataset.originalText}}
  }
  async function restoreWorkerSession(){
    if(!workerToken){adminStatus();return}
    try{const verified=await readWorkerJson(await workerRequest('/auth/me'),'انتهت صلاحية الجلسة.');workerUser=verified.user;if(workerUser.role==='super_admin')await loadWorkerAdminData();await loadCommunitySubmissions();adminStatus()}catch{signOut()}
  }
  function signOut(){
    workerToken='';workerUser=null;['hubaish_worker_session','hubaish_worker_user'].forEach(key=>{localStorage.removeItem(key);sessionStorage.removeItem(key)});
    adminStatus();status('تم تسجيل الخروج ومسح جلسة المشرف من هذا الجهاز.',false);renderAdminList();
  }
  async function submitCommunitySubmission(payload){
    const response=await fetchWithTimeout(DEFAULT_WORKER_URL+'/public/community-submissions',{
      method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),cache:'no-store'
    },20000);
    return readWorkerJson(response,'تعذر إرسال الطلب إلى قائمة المراجعة.');
  }
  async function getPublishedCommunitySubmissions(){
    const response=await fetchWithTimeout(DEFAULT_WORKER_URL+'/public/community-submissions',{headers:{Accept:'application/json'},cache:'no-store'},12000);
    const result=await readWorkerJson(response,'تعذر تحميل المساهمات المعتمدة.');
    return Array.isArray(result.submissions)?result.submissions.map(item=>({...item,attachmentUrl:item.attachmentUrl?(DEFAULT_WORKER_URL+item.attachmentUrl):'',ownerName:item.ownerName||''})):[];
  }
  async function loadCommunitySubmissions(){
    if(!isAdmin())return;
    const root=$('communitySubmissionList');if(!root)return;
    const statusNode=$('communitySubmissionStatus');if(statusNode)statusNode.textContent='جارٍ تحميل الطلبات...';
    try{
      const result=await readWorkerJson(await workerRequest('/review/community-submissions'),'تعذر تحميل طلبات المجتمع.');
      root.replaceChildren();
      for(const item of result.submissions||[]){
        const row=document.createElement('article');row.className='cloud-admin-row';
        const body=document.createElement('div'),heading=document.createElement('strong'),meta=document.createElement('p'),details=document.createElement('p'),source=document.createElement('p'),actions=document.createElement('div');
        heading.textContent=item.title+' · '+({author:'كتاب/بحث',family:'سيرة/أسرة',archive:'وثيقة/مخطوط',marketplace:'إعلان تجاري'}[item.type]||item.type);
        meta.className='small muted';meta.textContent=(item.name||'')+' · '+(item.submittedAt||'')+(item.contact?' · تواصل خاص: '+item.contact:'');
        details.className='small';details.textContent=String(item.body||'').slice(0,1400)+(item.ownerName?' · صاحب الوثيقة/المحقق: '+item.ownerName:'')+(item.marketCategory?' · التصنيف: '+item.marketCategory:'');
        source.className='small muted';source.textContent=item.source||'لم يرفق مصدر';
        body.append(heading,meta,details,source);actions.className='cloud-row-actions';
        if(item.attachment){
          const file=document.createElement('button');file.type='button';file.className='btn-sm';file.textContent='فتح المرفق · '+item.attachment.name;
          file.addEventListener('click',async()=>{
            file.disabled=true;try{const response=await workerRequest('/review/community-submissions/attachment?id='+encodeURIComponent(item.id));if(!response.ok)throw new Error('تعذر جلب المرفق.');const blob=await response.blob(),url=URL.createObjectURL(blob);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(error){toast(error.message)}finally{file.disabled=false}
          });actions.append(file);
        }
        for(const [action,label] of [['approve','اعتماد ونشر'],['reject','رفض وحذف']]){
          const button=document.createElement('button');button.type='button';button.className=action==='approve'?'btn-primary':'btn-sm mini-danger';button.textContent=label;
          button.addEventListener('click',async()=>{
            if(action==='reject'&&!window.confirm('رفض الطلب وحذف ملفه من قائمة المراجعة؟'))return;
            button.disabled=true;
            try{await readWorkerJson(await workerRequest('/review/community-submissions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,action})}),'تعذر تحديث الطلب.');toast(action==='approve'?'تم اعتماد الطلب ونشره.':'تم رفض الطلب.');await loadCommunitySubmissions()}
            catch(error){button.disabled=false;toast(error.message)}
          });actions.append(button);
        }
        row.append(body,actions);root.append(row);
      }
      if(!(result.submissions||[]).length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent='لا توجد طلبات معلقة.';root.append(empty)}
      if(statusNode)statusNode.textContent='طلبات معلقة: '+(result.submissions||[]).length;
    }catch(error){if(statusNode)statusNode.textContent=error.message}
  }
  async function loadWorkerAdminData(){
    if(workerUser?.role!=='super_admin')return;
    const [usersResponse,auditResponse]=await Promise.all([workerRequest('/admin/users'),workerRequest('/admin/audit')]);
    const users=await readWorkerJson(usersResponse,'تعذر تحميل حسابات المشرفين.'),audit=await readWorkerJson(auditResponse,'تعذر تحميل سجل التدقيق.');
    const list=$('cloudAdminUsersList');
    if(list){
      list.replaceChildren();
      for(const user of users.users||[]){
        const row=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('span'),actions=document.createElement('div'),role=document.createElement('select'),toggle=document.createElement('button'),password=document.createElement('button'),remove=document.createElement('button');
        row.className='cloud-admin-row';name.textContent=user.displayName||user.username;meta.textContent='@'+user.username+' · '+(user.disabled?'معطل':'نشط');actions.className='cloud-row-actions';
        role.className='input-field';role.dataset.userRole=user.username;role.setAttribute('aria-label','صلاحية '+user.username);
        for(const [value,label] of [['editor','محرر محتوى'],['super_admin','مشرف عام']]){const option=document.createElement('option');option.value=value;option.textContent=label;role.append(option)}
        role.value=user.role;
        toggle.className='btn-sm';toggle.type='button';toggle.dataset.userToggle=user.username;toggle.dataset.disabled=String(!user.disabled);toggle.textContent=user.disabled?'تفعيل':'تعطيل';
        password.className='btn-sm';password.type='button';password.dataset.userPassword=user.username;password.textContent='تغيير كلمة المرور';
        remove.className='btn-sm';remove.type='button';remove.dataset.userDelete=user.username;remove.textContent='حذف الحساب';
        actions.append(role,toggle,password,remove);row.append(name,meta,actions);list.append(row);
      }
      if(!users.users?.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='لا يوجد مشرفون.';list.append(empty)}
    }
    const log=$('cloudAuditList');
    if(log){
      log.replaceChildren();
      for(const event of audit.events||[]){
        const row=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('span');
        const changes=(event.changes||[]).map(item=>(item.action||'')+' · '+(item.title||item.id||'')).join('، ');
        row.className='cloud-admin-row';name.textContent=(event.actor||'')+(event.displayName?' · '+event.displayName:'');meta.textContent=(event.action||'')+' · '+(event.at||'')+(changes?' · '+changes:'');row.append(name,meta);log.append(row);
      }
      if(!audit.events?.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='لا توجد تعديلات مسجلة.';log.append(empty)}
    }
  }
  async function createWorkerAdmin(event){
    event.preventDefault();
    try{const response=await workerRequest('/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('newAdminUsername').value,displayName:$('newAdminDisplayName').value,password:$('newAdminPassword').value,role:$('newAdminRole').value})});await readWorkerJson(response,'تعذر إضافة المشرف.');$('cloudCreateAdminForm').reset();await loadWorkerAdminData();toast('تم إنشاء حساب المشرف.')}catch(error){toast(error.message)}
  }
  async function toggleWorkerAdmin(event){
    const button=event.target.closest('[data-user-toggle]');if(!button)return;
    try{const response=await workerRequest('/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:button.dataset.userToggle,disabled:button.dataset.disabled==='true'})});await readWorkerJson(response,'تعذر تحديث الحساب.');await loadWorkerAdminData();toast('تم تحديث حالة الحساب.')}catch(error){toast(error.message)}
  }
  async function changeWorkerAdminRole(event){
    const select=event.target.closest('[data-user-role]');if(!select)return;
    try{const response=await workerRequest('/admin/users',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:select.dataset.userRole,role:select.value})});await readWorkerJson(response,'تعذر تغيير الصلاحية.');await loadWorkerAdminData();toast('تم تحديث صلاحية الحساب.')}catch(error){toast(error.message);await loadWorkerAdminData()}
  }
  async function resetWorkerAdminPassword(username){
    const password=window.prompt('أدخل كلمة مرور جديدة لا تقل عن 12 حرفاً لحساب '+username);if(password===null)return;if(password.length<12){toast('كلمة المرور يجب أن تكون 12 حرفاً على الأقل.');return}
    try{const response=await workerRequest('/admin/users/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});await readWorkerJson(response,'تعذر تغيير كلمة المرور.');toast('تم تغيير كلمة المرور.')}catch(error){toast(error.message)}
  }
  async function deleteWorkerAdmin(username){
    if(!window.confirm('هل تريد حذف حساب المشرف '+username+'؟ لا يمكن التراجع عن هذا الإجراء.'))return;
    try{const response=await workerRequest('/admin/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});await readWorkerJson(response,'تعذر حذف الحساب.');await loadWorkerAdminData();toast('تم حذف حساب المشرف.')}catch(error){toast(error.message)}
  }
  async function handleAdminUserAction(event){
    const pass=event.target.closest('[data-user-password]');if(pass){await resetWorkerAdminPassword(pass.dataset.userPassword);return}
    const remove=event.target.closest('[data-user-delete]');if(remove)await deleteWorkerAdmin(remove.dataset.userDelete);
  }
  function allLocales(row,key){
    return {ar:row?.[key+'_ar']||'',en:row?.[key+'_en']||'',tr:row?.[key+'_tr']||'',fr:row?.[key+'_fr']||''};
  }
  function fromBasePlace(item){
    const result={id:item.id,category:item.cat||'fort',scope:item.scope||'hubaish_district',source_text:item.source||'',source_url:item.sourceUrl||'',source_title:item.sourceTitle||'',source_author:item.sourceAuthor||'',source_page:item.sourcePage||null,evidence_level:item.evidenceLevel||'',elevation:item.elevation||'',image_url:item.imageUrl||'',image_alt_ar:item.imageAlt||'',image_credit:item.imageCredit||'',image_source_url:item.imageSourceUrl||'',status:item.status||'documented'};
    for(const l of ['AR','EN','TR','FR']){
      const x=window.HubaishCatalog?.localizeItem?.(item,l)||item;
      const suffix=l.toLowerCase();
      result['title_'+suffix]=x.title||item.title;
      result['location_'+suffix]=x.loc||item.loc||'مديرية حبيش';
      result['description_'+suffix]=x.body||item.body;
      result['importance_'+suffix]=l==='AR'?(item.importance||''):'';
    }
    return result;
  }
  function fromBaseHistory(item){
    const result={id:item.id,era:item.era||'ancient',scope:item.scope||'hubaish_district',source_text:item.source||'',source_url:item.sourceUrl||'',status:item.status||'documented'};
    for(const l of ['AR','EN','TR','FR']){
      const x=window.HubaishCatalog?.localizeItem?.(item,l)||item;
      const suffix=l.toLowerCase();
      result['title_'+suffix]=x.title||item.title;
      result['period_'+suffix]=x.period||item.period||'';
      result['body_'+suffix]=x.body||item.body;
    }
    return result;
  }
  function basePersonRows(){
    const people=window.HubaishCatalog?.people||[];
    return people.map((person,index)=>{
      const row={id:'person-'+(index+1),source_text:person.s||'',source_url:person.u||''};
      for(let i=0;i<4;i++){
        const suffix=['ar','en','tr','fr'][i];
        row['name_'+suffix]=person.n?.[i]||'';
        row['role_'+suffix]=person.r?.[i]||'';
        row['biography_'+suffix]=person.b?.[i]||'';
      }
      return row;
    });
  }
  function baseDistrictRows(){
    return (window.HubaishCatalog?.districts||[]).map((district,index)=>({
      id:'district-'+(index+1),
      district_name_ar:district[0],
      title_ar:district[0],title_en:district[1],title_tr:district[2],title_fr:district[3],
      body_ar:'',body_en:'',body_tr:'',body_fr:''
    }));
  }
  function communityMainRow(){
    const stored=documentData.communityLinks.find(x=>x.id==='community-main');
    if(stored)return stored;
    const url=window.HubaishFeatures?.getState?.()?.communityUrl||'https://www.facebook.com/share/g/1JMCzDUsdZ/';
    return {id:'community-main',label_ar:'مجتمع حبيش',label_en:'Hubaish community',label_tr:'Hubaish topluluğu',label_fr:'Communauté Hubaish',url,sort_order:0};
  }
  function buildAdminRows(){
    const places=(window.HubaishRuntime?.places||[]).filter(x=>/^p\d+$/.test(x.id)||x.cmsOverride===true||String(x.id).startsWith('cms-landmark-'));
    const histories=(window.HubaishRuntime?.history||[]).filter(x=>/^h\d+$/.test(x.id)||x.cmsOverride===true||String(x.id).startsWith('cms-history_event-'));
    const placeRows=places.map(item=>{
      const stored=documentData.landmarks.find(x=>x.id===item.id);
      return {row:stored||fromBasePlace(item),type:'landmark',core:/^p\d+$/.test(item.id),hasOverride:!!stored,title:(stored?.title_ar)||item.title};
    });
    const historyRows=histories.map(item=>{
      const stored=documentData.historyEvents.find(x=>x.id===item.id);
      return {row:stored||fromBaseHistory(item),type:'history_event',core:/^h\d+$/.test(item.id),hasOverride:!!stored,title:(stored?.title_ar)||item.title};
    });
    const peopleBase=basePersonRows();
    const peopleRows=[
      ...peopleBase.map(base=>{
        const stored=documentData.historicalFigures.find(x=>x.id===base.id);
        return {row:stored||base,type:'historical_figure',core:true,hasOverride:!!stored,title:stored?.name_ar||base.name_ar};
      }),
      ...documentData.historicalFigures.filter(x=>!/^person-[1-4]$/.test(x.id)).map(row=>({row,type:'historical_figure',core:false,hasOverride:true,title:row.name_ar||''}))
    ];
    const districts=baseDistrictRows();
    const districtRows=districts.map(base=>{
      const stored=documentData.subDistricts.find(x=>x.id===base.id||x.district_name_ar===base.district_name_ar);
      return {row:stored||base,type:'sub_district',core:true,hasOverride:!!stored,title:stored?.title_ar||base.title_ar};
    });
    const updates=documentData.subDistrictUpdates.map(row=>({row,type:'sub_district_update',core:false,hasOverride:true,title:(row.district_name_ar||'')+' · '+(row.place_name_ar||'')}));
    const links=[communityMainRow(),...documentData.communityLinks.filter(x=>x.id!=='community-main')];
    const linkRows=links.map(row=>({row,type:'community_link',core:row.id==='community-main',hasOverride:!!documentData.communityLinks.find(x=>x.id===row.id),title:row.label_ar||''}));
    return [...placeRows,...historyRows,...districtRows,...updates,...peopleRows,...linkRows];
  }
  function button(label,action,id,cls,disabled){
    const b=document.createElement('button');b.type='button';b.className=cls||'btn-sm';b.textContent=label;b.dataset.cloudAction=action;b.dataset.cloudId=id||'';b.disabled=!!disabled;return b;
  }
  function renderAdminStats(rows){
    const stats=$('cloudAdminStats');if(!stats)return;
    const counts=[['landmark','المعالم'],['history_event','المحطات التاريخية'],['sub_district','العزل'],['historical_figure','الشخصيات'],['community_link','الروابط']];
    stats.replaceChildren();
    counts.forEach(([type,label])=>{
      const tile=document.createElement('div');tile.className='cloud-stat-tile';
      const value=document.createElement('strong');value.textContent=String(rows.filter(x=>x.type===type).length);
      const caption=document.createElement('span');caption.textContent=label;
      tile.append(value,caption);stats.append(tile);
    });
  }
  function renderAdminList(){
    const box=$('cloudContentList');if(!box)return;
    const allRows=buildAdminRows();
    renderAdminStats(allRows);
    const query=String($('cloudContentSearch')?.value||'').trim().toLowerCase();
    const type=String($('cloudContentFilter')?.value||'all');
    const rows=allRows.filter(entry=>{
      const matchesType=type==='all'||entry.type===type;
      const haystack=[entry.title,entry.row.id,entry.row.source_text,entry.row.location_ar,entry.row.description_ar,entry.row.body_ar,entry.row.name_ar].join(' ').toLowerCase();
      return matchesType&&(!query||haystack.includes(query));
    });
    box.replaceChildren();
    rows.forEach(entry=>{
      const row=document.createElement('div');row.className='cloud-admin-row';
      const title=document.createElement('strong');title.textContent=entry.title||entry.row.id;
      const meta=document.createElement('span');meta.className='muted small';meta.textContent=entry.type+(entry.core?(entry.hasOverride?' · تعديل سحابي':' · محتوى أساسي'):' · إضافة سحابية');
      const actions=document.createElement('div');actions.className='cloud-row-actions';
      actions.append(button('تعديل','edit',entry.row.id));
      const deleteLabel=entry.core?'إعادة للأصل':'حذف';
      const deleteAction=entry.core?'reset':'delete';
      actions.append(button(deleteLabel,deleteAction,entry.row.id,'btn-sm mini-danger',entry.core&&!entry.hasOverride));
      row.append(title,meta,actions);box.append(row);
    });
    if(!rows.length){const p=document.createElement('p');p.className='empty-state';p.textContent=query?'لا توجد نتائج مطابقة لبحثك.':'لا يوجد محتوى لإدارته.';box.append(p)}
  }
  function updateImagePreview(value){
    const preview=$('cloudImagePreview'),link=$('cloudImagePreviewLink');
    if(!preview)return;
    const valid=!!(value&&safeImageSource(value));
    preview.classList.toggle('hidden',!valid);
    if(link)link.classList.toggle('hidden',!valid);
    if(valid){preview.src=value;preview.alt=val('cloudImageAlt')||'معاينة صورة المعلم';if(link)link.href=value}
    else{preview.removeAttribute('src');if(link)link.removeAttribute('href')}
  }
  function val(id){return $(id)?String($(id).value||'').trim():''}
  function put(id,value){if($(id))$(id).value=value||''}
  function blank(){return{ar:'',en:'',tr:'',fr:''}}
  function formValues(){
    return {
      type:val('cloudRecordType'),id:val('cloudRecordId'),
      title:{ar:val('cloudTitleAr'),en:val('cloudTitleEn'),tr:val('cloudTitleTr'),fr:val('cloudTitleFr')},
      details:{ar:val('cloudDetailsAr'),en:val('cloudDetailsEn'),tr:val('cloudDetailsTr'),fr:val('cloudDetailsFr')},
      location:{ar:val('cloudLocationAr'),en:val('cloudLocationEn'),tr:val('cloudLocationTr'),fr:val('cloudLocationFr')},
      district:{ar:val('cloudDistrictAr'),en:val('cloudDistrictEn'),tr:val('cloudDistrictTr'),fr:val('cloudDistrictFr')},
      place:{ar:val('cloudPlaceAr'),en:val('cloudPlaceEn'),tr:val('cloudPlaceTr'),fr:val('cloudPlaceFr')},
      period:{ar:val('cloudPeriodAr'),en:val('cloudPeriodEn'),tr:val('cloudPeriodTr'),fr:val('cloudPeriodFr')},
      category:val('cloudCategory')||'fort',scope:val('cloudScope')||'hubaish_district',url:val('cloudUrl'),source:val('cloudSource'),sourceUrl:val('cloudSourceUrl'),
      sourceTitle:val('cloudSourceTitle'),sourceAuthor:val('cloudSourceAuthor'),sourcePage:val('cloudSourcePage'),evidenceLevel:val('cloudEvidenceLevel'),
      imageUrl:val('cloudImageUrl'),
      imageAlt:{ar:val('cloudImageAlt'),en:val('cloudImageAltEn'),tr:val('cloudImageAltTr'),fr:val('cloudImageAltFr')},
      imageCaption:{ar:val('cloudImageCaptionAr'),en:val('cloudImageCaptionEn'),tr:val('cloudImageCaptionTr'),fr:val('cloudImageCaptionFr')},
      imageCategory:val('cloudImageCategory'),imagePhotographer:val('cloudImagePhotographer'),imageVerified:!!$('cloudImageVerified')?.checked,
      imageLicense:val('cloudImageLicense'),imageCredit:val('cloudImageCredit'),imageSourceUrl:val('cloudImageSourceUrl'),
      linkPlacement:val('cloudLinkPlacement')||'more',socialPlatform:val('cloudSocialPlatform')||'website',
      elevation:val('cloudElevation'),latitude:val('cloudLatitude'),longitude:val('cloudLongitude'),
      importance:{ar:val('cloudImportanceAr'),en:val('cloudImportanceEn'),tr:val('cloudImportanceTr'),fr:val('cloudImportanceFr')},sortOrder:Number(val('cloudSortOrder')||0)
    };
  }
  async function translate(value,target){
    const response=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(value)+'&langpair=ar|'+target,{cache:'no-store'});
    const data=await response.json();
    if(!response.ok||Number(data.responseStatus)!==200)throw new Error(data.responseDetails||'خدمة الترجمة غير متاحة الآن.');
    const result=String(data.responseData?.translatedText||'').trim();
    if(!result)throw new Error('لم تُرجع خدمة الترجمة نصاً.');
    return result;
  }
  async function fillTranslations(v){
    const groups=[v.title,v.details,v.location,v.district,v.place,v.period,v.importance,v.imageAlt,v.imageCaption];
    for(const group of groups){
      if(!group?.ar)continue;
      for(const language of ['en','tr','fr'])if(!group[language])group[language]=await translate(group.ar,language);
    }
  }
  function localeFields(target,key,group){
    target[key+'_ar']=group.ar||'';
    target[key+'_en']=group.en||'';
    target[key+'_tr']=group.tr||'';
    target[key+'_fr']=group.fr||'';
  }
  function payload(v){
    const common={id:v.id||makeId(v.type),source_text:v.source||'',source_url:safeUrl(v.sourceUrl)?v.sourceUrl:'',status:'documented'};
    if(v.type==='landmark'){
      const row=Object.assign(common,{
        category:['fort','mosque','valley','mountain','market','school'].includes(v.category)?v.category:'fort',
        scope:['hubaish_district','adjacent_area','unverified_location'].includes(v.scope)?v.scope:'hubaish_district',
        source_title:String(v.sourceTitle||''),source_author:String(v.sourceAuthor||''),source_page:Number.isInteger(Number(v.sourcePage))&&Number(v.sourcePage)>0?Number(v.sourcePage):null,evidence_level:String(v.evidenceLevel||''),
        elevation:v.elevation!==''?Number(v.elevation):'غير موثق ميدانياً',
        latitude:v.latitude!==''?Number(v.latitude):null,longitude:v.longitude!==''?Number(v.longitude):null,
        image_url:safeImageSource(v.imageUrl)?v.imageUrl:'',
        image_category:['forts','valleys','villages','heritage'].includes(v.imageCategory)?v.imageCategory:'valleys',
        image_photographer:v.imagePhotographer||'',image_credit:v.imageCredit||'',
        image_license:v.imageLicense||'',image_source_url:safeUrl(v.imageSourceUrl)?v.imageSourceUrl:(safeUrl(v.sourceUrl)?v.sourceUrl:''),
        image_verified:!!v.imageVerified
      });
      localeFields(row,'title',v.title);localeFields(row,'location',v.location);localeFields(row,'description',v.details);localeFields(row,'importance',v.importance);
      localeFields(row,'image_alt',v.imageAlt);localeFields(row,'image_caption',v.imageCaption);localeFields(row,'image_district',v.district);
      return row;
    }
    if(v.type==='history_event'){
      const row=Object.assign(common,{scope:['hubaish_district','adjacent_area','unverified_location'].includes(v.scope)?v.scope:'hubaish_district',era:v.category==='modern'?'modern':'ancient'});
      localeFields(row,'title',v.title);localeFields(row,'period',v.period);localeFields(row,'body',v.details);return row;
    }
    if(v.type==='sub_district_update'){
      const row=Object.assign(common,{id:common.id});
      localeFields(row,'district_name',v.district);localeFields(row,'place_name',v.title);localeFields(row,'description',v.details);return row;
    }
    if(v.type==='sub_district'){
      const row=Object.assign(common,{id:v.id||'district-'+slug(v.district.ar),district_name_ar:v.district.ar});
      localeFields(row,'title',v.title);localeFields(row,'body',v.details);return row;
    }
    if(v.type==='historical_figure'){
      const row=Object.assign(common,{role_ar:v.category||''});
      localeFields(row,'name',v.title);localeFields(row,'role',{ar:v.category||'',en:v.category||'',tr:v.category||'',fr:v.category||''});localeFields(row,'biography',v.details);return row;
    }
    if(v.type==='community_link'){
      const row=Object.assign(common,{url:v.url,sort_order:v.sortOrder,display_location:['home','more','both'].includes(v.linkPlacement)?v.linkPlacement:'more',platform:String(v.socialPlatform||'website').slice(0,30)});
      localeFields(row,'label',v.title);return row;
    }
    throw new Error('نوع المحتوى غير معروف.');
  }
  function rowForBase(type,id){
    if(type==='landmark'){
      const item=(window.HubaishRuntime?.places||[]).find(x=>x.id===id);return item?fromBasePlace(item):null;
    }
    if(type==='history_event'){
      const item=(window.HubaishRuntime?.history||[]).find(x=>x.id===id);return item?fromBaseHistory(item):null;
    }
    if(type==='historical_figure')return basePersonRows().find(x=>x.id===id)||null;
    if(type==='sub_district')return baseDistrictRows().find(x=>x.id===id)||null;
    if(type==='community_link'&&id==='community-main')return communityMainRow();
    return null;
  }
  function fillEditor(row,type){
    if(!row)row=rowForBase(type,val('cloudRecordId'));
    const read=key=>allLocales(row,key);
    let title=blank(),details=blank(),location=blank(),district=blank(),period=blank(),importance=blank(),category='',url='',elevation='',latitude='',longitude='';
    if(type==='landmark'){title=read('title');details=read('description');location=read('location');importance=read('importance');category=row?.category||'fort';elevation=typeof row?.elevation==='number'?String(row.elevation):'';latitude=row?.latitude??'';longitude=row?.longitude??''}
    else if(type==='history_event'){title=read('title');details=read('body');period=read('period');category=row?.era||'ancient'}
    else if(type==='sub_district_update'){district=read('district_name');title=read('place_name');details=read('description')}
    else if(type==='sub_district'){district={ar:row?.district_name_ar||'',en:row?.district_name_en||row?.district_name_ar||'',tr:row?.district_name_tr||row?.district_name_ar||'',fr:row?.district_name_fr||row?.district_name_ar||''};title=read('title');details=read('body')}
    else if(type==='historical_figure'){title=read('name');details=read('biography');category=row?.role_ar||''}
    else if(type==='community_link'){title=read('label');url=row?.url||'';category='community';put('cloudLinkPlacement',row?.display_location||'more');put('cloudSocialPlatform',row?.platform||'website')}
    put('cloudRecordType',type);put('cloudRecordId',row?.id||'');
    ['Ar','En','Tr','Fr'].forEach(s=>{
      const l=s.toLowerCase();
      put('cloudTitle'+s,title[l]);put('cloudDetails'+s,details[l]);put('cloudLocation'+s,location[l]);
      put('cloudDistrict'+s,district[l]);put('cloudPlace'+s,'');put('cloudPeriod'+s,period[l]);
    });
    put('cloudCategory',category);put('cloudScope',row?.scope||'hubaish_district');put('cloudSourceTitle',row?.source_title||'');put('cloudSourceAuthor',row?.source_author||'');put('cloudSourcePage',row?.source_page||'');put('cloudEvidenceLevel',row?.evidence_level||'');put('cloudUrl',url);put('cloudElevation',elevation);put('cloudLatitude',latitude);put('cloudLongitude',longitude);put('cloudSource',row?.source_text||'');put('cloudSourceUrl',row?.source_url||'');
    put('cloudImageUrl',row?.image_url||'');
    const imageAlt=allLocales(row,'image_alt'),imageCaption=allLocales(row,'image_caption'),imageDistrict=allLocales(row,'image_district');
    put('cloudImageAlt',imageAlt.ar);put('cloudImageAltEn',imageAlt.en);put('cloudImageAltTr',imageAlt.tr);put('cloudImageAltFr',imageAlt.fr);
    put('cloudImageCaptionAr',imageCaption.ar);put('cloudImageCaptionEn',imageCaption.en);put('cloudImageCaptionTr',imageCaption.tr);put('cloudImageCaptionFr',imageCaption.fr);
    put('cloudDistrictAr',imageDistrict.ar||district.ar);put('cloudDistrictEn',imageDistrict.en||district.en);put('cloudDistrictTr',imageDistrict.tr||district.tr);put('cloudDistrictFr',imageDistrict.fr||district.fr);
    put('cloudImageCategory',row?.image_category||'valleys');put('cloudImagePhotographer',row?.image_photographer||'');
    put('cloudImageCredit',row?.image_credit||'');put('cloudImageLicense',row?.image_license||'');put('cloudImageSourceUrl',row?.image_source_url||'');
    if($('cloudImageVerified'))$('cloudImageVerified').checked=row?.image_verified===true;
    if($('cloudImageFile'))$('cloudImageFile').value='';
    updateImagePreview(row?.image_url||'');
    put('cloudImportanceAr',importance.ar);put('cloudImportanceEn',importance.en);put('cloudImportanceTr',importance.tr);put('cloudImportanceFr',importance.fr);put('cloudSortOrder',row?.sort_order||0);
    $('cloudContentEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function typeForCollection(collection){
    return {landmarks:'landmark',historyEvents:'history_event',subDistrictUpdates:'sub_district_update',subDistricts:'sub_district',historicalFigures:'historical_figure',communityLinks:'community_link'}[collection];
  }
  function collectionForType(type){return TABLES[type]}
  async function mutateRepository(mutator,message){
    if(!isAdmin())throw new Error('سجّل الدخول إلى بوابة المشرفين أولاً.');
    if(saving)throw new Error('هناك عملية نشر أخرى قيد التنفيذ.');
    saving=true;
    try{
      const draft=deepCopy(documentData);mutator(draft);draft.updatedAt=new Date().toISOString();
      const response=await workerRequest('/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
      const result=await readWorkerJson(response,'تعذر نشر المحتوى عبر الخادم.');
      documentData=normalizeDocument({...draft,updatedAt:result.updatedAt,updatedBy:result.updatedBy||null});
      saveCache();applyCached();renderAdminList();window.HubaishRuntime?.renderAll?.();
      return result;
    }finally{saving=false}
  }
  async function saveEditor(event){
    event.preventDefault();
    if(!isAdmin()){toast('سجّل الدخول إلى بوابة المشرفين أولاً.');return}
    const v=formValues();
    if(!v.title.ar){toast('أدخل الاسم أو العنوان بالعربية.');return}
    if(v.type!=='community_link'&&!v.details.ar){toast('أدخل التفاصيل بالعربية.');return}
    if(v.type==='sub_district_update'&&!v.district.ar){toast('اختر اسم العزلة بالعربية.');return}
    if(v.type==='sub_district'&&!v.district.ar){toast('اختر العزلة الأصلية المراد تعديلها.');return}
    if(v.type==='community_link'&&!safeUrl(v.url)){toast('أدخل رابط HTTPS أو HTTP صحيحاً.');return}
    if(v.sourceUrl&&!safeUrl(v.sourceUrl)){toast('رابط المصدر غير صالح.');return}
    if(v.type==='landmark'&&v.category==='school'&&(!v.source||!safeUrl(v.sourceUrl)||!v.sourceTitle||!v.sourceAuthor||!Number.isInteger(Number(v.sourcePage))||Number(v.sourcePage)<=0)){toast('يتطلب سجل المدرسة التاريخية عنوان المصدر ومؤلفه ورقم الصفحة الصحيحة ورابطه.');return}
    if(v.imageUrl&&!safeImageSource(v.imageUrl)){toast('ملف الصورة أو رابطها غير صالح أو أكبر من الحد المسموح.');return}
    if(v.imageUrl&&(!v.imageVerified||!v.imagePhotographer||!v.imageCredit||!safeUrl(v.imageSourceUrl||v.sourceUrl)||!v.imageLicense)){toast('لتوثيق صورة المعرض، أكّد انتماءها لحبيش وأدخل المصور والنسبة والرخصة ورابط المصدر.');return}
    if(v.type==='landmark'){
      const hasLat=v.latitude!==''&&v.latitude!==null,hasLon=v.longitude!==''&&v.longitude!==null;
      if(hasLat!==hasLon){toast('أدخل خط العرض وخط الطول معاً أو اتركهما فارغين.');return}
      if(hasLat&&(!Number.isFinite(Number(v.latitude))||Number(v.latitude)<-90||Number(v.latitude)>90||!Number.isFinite(Number(v.longitude))||Number(v.longitude)<-180||Number(v.longitude)>180)){toast('الإحداثيات خارج النطاق الصحيح لخط العرض أو الطول.');return}
      if(v.elevation!==''&&(!Number.isFinite(Number(v.elevation))||Number(v.elevation)<-500||Number(v.elevation)>9000)){toast('الارتفاع يجب أن يكون بين -500 و9000 متر.');return}
    }
    try{
      status('جارٍ استكمال ترجمات الحقول الناقصة...',false);
      await fillTranslations(v);
      const row=payload(v);
      if(v.type==='landmark'&&!v.id)row.id=makeId('landmark');
      if(v.type==='history_event'&&!v.id)row.id=makeId('history_event');
      if(v.type==='sub_district_update'&&!v.id)row.id=makeId('village');
      if(v.type==='historical_figure'&&!v.id)row.id=makeId('person');
      if(v.type==='community_link'&&!v.id)row.id=makeId('link');
      if(v.type==='community_link'&&v.id==='community-main')row.id='community-main';
      if(v.type==='sub_district'&&!v.id)row.id='district-'+slug(v.district.ar);
      const collection=collectionForType(v.type);
      await mutateRepository(draft=>{
        const index=draft[collection].findIndex(x=>x.id===row.id);
        if(index>=0)draft[collection][index]=row;
        else draft[collection].push(row);
      },'Update Hubaish live content: '+v.type);
      put('cloudRecordId','');
      fillEditor(null,v.type);
      toast('تم نشر المحتوى على GitHub. ستصل النسخة الجديدة للزوار عند المزامنة.');
      status('اكتمل Commit في GitHub · '+new Date().toLocaleTimeString('ar'),false);
    }catch(error){status(error.message,true);toast('تعذر النشر. لم يُعلن نجاح العملية.')}
  }
  async function deleteRecord(id,type,reset){
    if(!isAdmin())return;
    const collection=collectionForType(type);
    const confirmed=confirm(reset?'إزالة التعديل السحابي وإرجاع المحتوى الأصلي؟':'حذف هذه الإضافة من النسخة المنشورة؟');
    if(!confirmed)return;
    try{
      await mutateRepository(draft=>{
        draft[collection]=draft[collection].filter(x=>x.id!==id);
      },(reset?'Reset':'Delete')+' Hubaish live content: '+type);
      toast(reset?'تمت إعادة المحتوى إلى النسخة الأصلية.':'تم حذف السجل من النسخة المنشورة.');
      status('تم تحديث GitHub بنجاح.',false);
    }catch(error){status(error.message,true);toast('تعذر تعديل ملف البيانات.')}
  }
  function renderContentPreview(){
    const panel=$('cloudPreviewPanel'),root=$('cloudPreviewContent');
    if(!panel||!root)return;
    const values=formValues(),language=lang().toLowerCase();
    root.replaceChildren();
    const heading=document.createElement('h3');heading.className='item-title';heading.textContent=values.title[language]||values.title.ar||'—';root.append(heading);
    const description=document.createElement('p');description.className='item-body';description.textContent=values.details[language]||values.details.ar||'—';root.append(description);
    const facts=[];
    const location=values.location[language]||values.location.ar;
    if(location)facts.push(location);
    if(values.elevation)facts.push(String(values.elevation)+' m');
    if(values.latitude!==''&&values.longitude!=='')facts.push(String(values.latitude)+', '+String(values.longitude));
    const metadata=document.createElement('p');metadata.className='small muted';metadata.textContent=facts.join(' · ')||'—';root.append(metadata);
    if(values.imageUrl&&safeImageSource(values.imageUrl)){
      const image=document.createElement('img');image.src=values.imageUrl;image.alt=values.imageAlt||values.title.ar||'';image.loading='lazy';image.className='cloud-image-preview';root.append(image);
      if(values.imageCredit){const credit=document.createElement('p');credit.className='small muted';credit.textContent=values.imageCredit;root.append(credit)}
    }
    panel.classList.remove('hidden');panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
async function stampQuickImage(file,ownerName){
    if(typeof createImageBitmap!=='function')throw new Error('هذا الجهاز لا يدعم معاينة وختم الصورة.');
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||file.size>12*1024*1024)throw new Error('اختر صورة JPEG أو PNG أو WebP لا تتجاوز 12 ميغابايت.');
    const bitmap=await createImageBitmap(file);
    try{
      const canvas=document.createElement('canvas');let scale=Math.min(1,1500/Math.max(bitmap.width,bitmap.height)),blob=null;
      for(let pass=0;pass<8;pass++){
        canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('تعذر تجهيز العلامة المائية.');
        ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
        ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/7);ctx.textAlign='center';
        ctx.font='bold '+Math.max(16,canvas.width*.034)+'px sans-serif';
        for(let y=-canvas.height*1.5;y<canvas.height*1.5;y+=Math.max(145,canvas.width*.28)){
          for(let x=-canvas.width*1.5;x<canvas.width*1.5;x+=Math.max(210,canvas.width*.55)){
            ctx.fillStyle='rgba(212,175,55,.28)';ctx.fillText('أرشيف دليل حبيش الذكي',x,y);
            ctx.fillStyle='rgba(255,255,255,.30)';ctx.fillText('HUBAISH HERITAGE ARCHIVE',x,y+Math.max(24,canvas.width*.045));
            if(ownerName){ctx.font='bold '+Math.max(12,canvas.width*.022)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.26)';ctx.fillText(ownerName,x,y+Math.max(45,canvas.width*.075));ctx.font='bold '+Math.max(16,canvas.width*.034)+'px sans-serif'}
          }
        }
        ctx.restore();
        for(const quality of [.76,.66,.56]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=245*1024)break}
        if(blob&&blob.size<=245*1024)break;scale*=.82;
      }
      if(!blob||blob.size>245*1024)throw new Error('تعذر ضغط الصورة وختمها إلى الحجم المسموح.');
      const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('تعذرت قراءة الصورة.'));reader.readAsDataURL(blob)});
      return {name:file.name.replace(/\.[^.]+$/,'')+'.webp',mimeType:'image/webp',dataUrl};
    }finally{bitmap.close?.()}
  }
  function quickAddTypeChanged(){
    const type=val('cloudQuickType');
    const show=(id,on)=>$(id)?.classList.toggle('hidden',!on);
    show('cloudQuickImageWrap',type==='photo'||type==='archive');
    show('cloudQuickOwnerWrap',type==='archive');
    show('cloudQuickPhotoMeta',type==='photo');
    show('cloudQuickPhotoLicense',type==='photo');
    show('cloudQuickPhotoCategory',type==='photo');
    show('cloudQuickMarketMeta',type==='marketplace');
    show('cloudQuickNameWrap',type==='author'||type==='family'||type==='marketplace');
    show('cloudQuickPublicContactWrap',type==='marketplace');
  }
  function renderQuickAddPreview(){
    const root=$('cloudQuickPreview');if(!root)return;
    root.replaceChildren();
    const title=document.createElement('strong');title.textContent=val('cloudQuickTitle')||'معاينة العنوان';
    const meta=document.createElement('p');meta.textContent=val('cloudQuickLocation')+' · '+val('cloudQuickType');
    const body=document.createElement('p');body.textContent=val('cloudQuickDescription')||'سيظهر الوصف هنا.';
    root.append(title,meta,body);
    const file=$('cloudQuickImageFile')?.files?.[0];
    if(file){const label=document.createElement('p');label.className='small muted';label.textContent='المرفق المختار: '+file.name;root.append(label)}
    $('cloudQuickPreviewPanel')?.classList.remove('hidden');
  }
  async function submitQuickAdd(event){
    event.preventDefault();
    if(!isAdmin()){toast('سجّل الدخول إلى بوابة المشرفين أولاً.');return}
    const type=val('cloudQuickType'),title=val('cloudQuickTitle'),body=val('cloudQuickDescription'),location=val('cloudQuickLocation');
    if(!title||!body||!location||!$('cloudQuickRights')?.checked){toast('أكمل العنوان والوصف والعزلة وتأكيد حق النشر.');return}
    const file=$('cloudQuickImageFile')?.files?.[0];
    if((type==='photo'||type==='archive')&&!file){toast('اختر صورة أولاً.');return}
    if(type==='photo'&&(!val('cloudQuickSource')||!val('cloudQuickPhotographer')||!val('cloudQuickLicense'))){toast('أدخل مصدر الصورة والمصور والرخصة.');return}
    if(type==='archive'&&!val('cloudQuickOwner')){toast('أدخل مالك الوثيقة أو الجهة التي حفظتها.');return}
    if((type==='author'||type==='family'||type==='marketplace')&&!val('cloudQuickName')){toast('أدخل الاسم المطلوب لهذا السجل.');return}
    const button=$('cloudQuickSubmitBtn');if(button)button.disabled=true;
    try{
      const attachment=file?await stampQuickImage(file,type==='archive'?val('cloudQuickOwner'):val('cloudQuickPhotographer')):null;
      const payload={
        type,title,body,location,name:val('cloudQuickName'),source:val('cloudQuickSource'),
        ownerName:val('cloudQuickOwner'),photographer:val('cloudQuickPhotographer'),license:val('cloudQuickLicense'),
        category:val('cloudQuickPhotoCategory'),marketCategory:val('cloudQuickMarketCategory'),
        contact:val('cloudQuickContact'),publicContact:$('cloudQuickPublicContact')?.checked===true,
        rightsConsent:true,attachment
      };
      const response=await workerRequest('/admin/quick-add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await readWorkerJson(response,'تعذر حفظ الإضافة السريعة.');
      if(type==='photo'){
        documentData=await publicFetch();saveCache();applyCached();renderAdminList();window.HubaishRuntime?.renderAll?.();window.HubaishGallery?.render?.();
      }else await window.HubaishKnowledge?.load?.();
      $('cloudQuickAddForm')?.reset();quickAddTypeChanged();$('cloudQuickPreviewPanel')?.classList.add('hidden');
      const statusNode=$('cloudQuickStatus');if(statusNode)statusNode.textContent='تم الحفظ. سيظهر المحتوى بعد تحديث المزامنة لدى المستخدمين.';
      toast('تمت الإضافة إلى محتوى دليل حبيش.');
      status('اكتمل النشر السحابي · '+result.type,false);
    }catch(error){
      const statusNode=$('cloudQuickStatus');if(statusNode)statusNode.textContent=error.message||'تعذر الحفظ.';
      status(error.message||'تعذر حفظ الإضافة.',true);toast('لم يتم تأكيد حفظ الإضافة.');
    }finally{if(button)button.disabled=false}
  }
    function bind(){
    $('communitySubmissionRefresh')?.addEventListener('click',loadCommunitySubmissions);
    $('cloudQuickType')?.addEventListener('change',quickAddTypeChanged);
    $('cloudQuickPreviewBtn')?.addEventListener('click',renderQuickAddPreview);
    $('cloudQuickAddForm')?.addEventListener('submit',submitQuickAdd);
    quickAddTypeChanged();
    $('workerLoginForm')?.addEventListener('submit',workerLogin);
    $('workerSetupForm')?.addEventListener('submit',firstAdminSetup);
    $('cloudCreateAdminForm')?.addEventListener('submit',createWorkerAdmin);
    $('cloudAdminUsersList')?.addEventListener('click',event=>{toggleWorkerAdmin(event);handleAdminUserAction(event)});
    $('cloudAdminUsersList')?.addEventListener('change',changeWorkerAdminRole);
    $('cloudContentSearch')?.addEventListener('input',renderAdminList);
    $('cloudContentFilter')?.addEventListener('change',renderAdminList);
    $('cloudImageUrl')?.addEventListener('input',()=>updateImagePreview(val('cloudImageUrl')));
    $('cloudImageFile')?.addEventListener('change',async event=>{
      const file=event.target.files?.[0];if(!file)return;
      if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||file.size>15*1024*1024){toast('اختر صورة JPEG أو PNG أو WebP لا تتجاوز 15 ميغابايت.');event.target.value='';return}
      const statusNode=$('cloudImageCompressionStatus');if(statusNode)statusNode.textContent='جارٍ ضغط الصورة...';
      let bitmap;
      try{
        if(typeof createImageBitmap!=='function')throw new Error('هذا الجهاز لا يدعم ضغط الصور المحلي.');
        bitmap=await createImageBitmap(file);
        const canvas=document.createElement('canvas');let scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),blob=null;
        for(let pass=0;pass<9;pass++){
          canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
          const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('Canvas unavailable');
          context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
          for(const quality of [.82,.72,.62,.52]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=180*1024)break}
          if(blob&&blob.size<=180*1024)break;scale*=.82;
        }
        if(!blob||blob.size>180*1024)throw new Error('تعذر ضغط الصورة إلى أقل من 180 كيلوبايت.');
        const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('تعذر قراءة ملف الصورة.'));reader.readAsDataURL(blob)});
        put('cloudImageUrl',dataUrl);updateImagePreview(dataUrl);
        if(statusNode)statusNode.textContent='تم ضغط الصورة إلى '+Math.round(blob.size/1024)+' KB · '+canvas.width+'×'+canvas.height;
      }catch(error){if(statusNode)statusNode.textContent=error.message;toast(error.message)}
      finally{bitmap?.close?.()}
    });
    $('cloudImageAlt')?.addEventListener('input',()=>{if($('cloudImagePreview'))$('cloudImagePreview').alt=val('cloudImageAlt')||'معاينة صورة المعلم'});
    $('cloudAdminLogoutBtn')?.addEventListener('click',signOut);
    $('cloudContentForm')?.addEventListener('submit',saveEditor);
    $('cloudPreviewBtn')?.addEventListener('click',renderContentPreview);
    $('cloudContentClearBtn')?.addEventListener('click',()=>{
      const type=val('cloudRecordType');['cloudRecordId','cloudContributionId'].forEach(id=>put(id,''));
      ['cloudTitleAr','cloudTitleEn','cloudTitleTr','cloudTitleFr','cloudDetailsAr','cloudDetailsEn','cloudDetailsTr','cloudDetailsFr','cloudLocationAr','cloudLocationEn','cloudLocationTr','cloudLocationFr','cloudDistrictAr','cloudDistrictEn','cloudDistrictTr','cloudDistrictFr','cloudPlaceAr','cloudPlaceEn','cloudPlaceTr','cloudPlaceFr','cloudPeriodAr','cloudPeriodEn','cloudPeriodTr','cloudPeriodFr','cloudCategory','cloudScope','cloudSourceTitle','cloudSourceAuthor','cloudSourcePage','cloudEvidenceLevel','cloudUrl','cloudSource','cloudSourceUrl','cloudImportanceAr','cloudImportanceEn','cloudImportanceTr','cloudImportanceFr','cloudImageUrl','cloudImageAlt','cloudImageAltEn','cloudImageAltTr','cloudImageAltFr','cloudImageCaptionAr','cloudImageCaptionEn','cloudImageCaptionTr','cloudImageCaptionFr','cloudImageCategory','cloudImagePhotographer','cloudImageCredit','cloudImageLicense','cloudImageSourceUrl','cloudLinkPlacement','cloudSocialPlatform','cloudElevation','cloudLatitude','cloudLongitude'].forEach(id=>put(id,''));
      put('cloudRecordType',type);if($('cloudImageVerified'))$('cloudImageVerified').checked=false;if($('cloudImageFile'))$('cloudImageFile').value='';updateImagePreview('');$('cloudImageCompressionStatus')?.replaceChildren();$('cloudPreviewContent')?.replaceChildren();$('cloudPreviewPanel')?.classList.add('hidden');
    });
    $('cloudRefreshBtn')?.addEventListener('click',async()=>{
      if(workerToken){
        try{documentData=await publicFetch();saveCache();applyCached();renderAdminList();await loadWorkerAdminData();await loadCommunitySubmissions();status('تم تحديث لوحة المشرف.',false)}catch(error){status(error.message,true)}
      }else await sync(false);
    });
    $('cloudTranslateBtn')?.addEventListener('click',async()=>{
      const v=formValues();
      try{await fillTranslations(v);['Ar','En','Tr','Fr'].forEach(s=>{const l=s.toLowerCase();put('cloudTitle'+s,v.title[l]);put('cloudDetails'+s,v.details[l]);put('cloudLocation'+s,v.location[l]);put('cloudDistrict'+s,v.district[l]);put('cloudPlace'+s,v.place[l]);put('cloudPeriod'+s,v.period[l]);put('cloudImportance'+s,v.importance[l])});toast('اكتملت الترجمة الآلية. راجع النصوص قبل النشر.')}
      catch(error){toast(error.message)}
    });
    $('cloudContentList')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-cloud-action]');if(!button||!isAdmin())return;
      const id=button.dataset.cloudId;
      const entry=buildAdminRows().find(x=>String(x.row.id)===id);
      if(!entry)return;
      if(button.dataset.cloudAction==='edit'){
        put('cloudRecordId',entry.row.id);
        fillEditor(entry.row,entry.type);
      }else if(button.dataset.cloudAction==='delete')deleteRecord(id,entry.type,false);
      else if(button.dataset.cloudAction==='reset')deleteRecord(id,entry.type,true);
    });
  }
  async function importBackup(value){
    if(!isAdmin())throw new Error('سجّل الدخول إلى بوابة المشرفين قبل استعادة النسخة السحابية.');
    if(!value||value.schemaVersion!==1||!Object.values(TABLES).every(key=>Array.isArray(value[key])))throw new Error('بنية نسخة GitHub CMS غير صالحة.');
    const imported=normalizeDocument(value);
    await mutateRepository(draft=>{
      for(const key of Object.values(TABLES))draft[key]=deepCopy(imported[key]||[]);
    },'Restore Hubaish live content backup');
  }
  function start(){
    if(started)return;started=true;
    localStorage.removeItem('hubaish_direct_github_token');localStorage.removeItem('hubaish_worker_url');
    applyCached();bind();setTimeout(applyCached,0);
    if(navigator.onLine){sync(true);refreshSetupStatus()}
    window.setInterval(()=>{if(document.visibilityState==='visible'){sync(true);refreshSetupStatus();window.HubaishKnowledge?.load?.()}},15000);
    window.addEventListener('online',()=>{sync(true);refreshSetupStatus()});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(true)});
    renderAdminList();adminStatus();restoreWorkerSession();
  }
  window.HubaishCloud={
    start,isAdmin,applyCached,sync,signOut,
    submitCommunitySubmission,getPublishedCommunitySubmissions,
    publicAttachmentUrl:id=>DEFAULT_WORKER_URL+'/public/community-submissions/attachment?id='+encodeURIComponent(id),
    getDistrictUpdates:districtUpdates,
    getDistrictProfile:districtProfile,
    exportData:()=>deepCopy(documentData),
    importBackup,
    isConfigured:()=>true
  };
})();