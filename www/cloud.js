'use strict';
(() => {
  const CONFIG_KEY='hubaish_supabase_config_v1', CACHE_KEY='hubaish_supabase_cache_v1', SESSION_KEY='hubaish_supabase_session_v1';
  const TABLES=['landmarks','history_events','sub_districts_updates','historical_figures','community_links'];
  const $=id=>document.getElementById(id);
  let config=read(CONFIG_KEY,{}), cache=read(CACHE_KEY,{landmarks:[],history_events:[],sub_districts_updates:[],historical_figures:[],community_links:[]});
  let session=read(SESSION_KEY,null), started=false, syncing=false;
  function read(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'?x:fallback}catch{return fallback}}
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
  function status(message,error){const el=$('cloudStatus');if(el){el.textContent=message;el.classList.toggle('cloud-error',!!error);el.classList.toggle('cloud-ok',!error)}}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);else{const el=$('toast');if(el){el.textContent=message;el.classList.add('show')}}}
  function configReady(){return !!(config.url&&config.anonKey)}
  function admin(){return !!(session?.access_token&&session?.user?.app_metadata?.role==='hubaish_admin')}
  function lang(){const l=String(document.documentElement.lang||'ar').toUpperCase();return ['AR','EN','TR','FR'].includes(l)?l:'AR'}
  function loc(row,key,l){return row[key+'_'+String(l||lang()).toLowerCase()]||row[key+'_ar']||row[key+'_en']||''}
  function slug(value){return String(value||'').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,100)||('entry-'+Date.now())}
  function safeId(value){return String(value||'').replace(/[^a-zA-Z0-9_-]/g,'')}
  async function getToken(){
    if(!session?.access_token)throw new Error('سجّل دخول المشرف أولاً.');
    if(session.expires_at&&session.expires_at<Math.floor(Date.now()/1000)+90&&session.refresh_token){
      const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},anon:true});
      session=Object.assign({},next,{expires_at:Math.floor(Date.now()/1000)+Number(next.expires_in||3600)});save(SESSION_KEY,session);
    }
    return session.access_token;
  }
  async function request(path,opts){
    if(!configReady())throw new Error('احفظ Project URL وanon public key أولاً.');
    opts=opts||{};
    const token=opts.admin?await getToken():opts.anon?config.anonKey:(session?.access_token||config.anonKey);
    const headers={apikey:config.anonKey,Authorization:'Bearer '+token,Accept:'application/json'};
    if(opts.body!==undefined)headers['Content-Type']='application/json';
    if(opts.prefer)headers.Prefer=opts.prefer;
    const response=await fetch(config.url+path,{method:opts.method||'GET',headers,body:opts.body===undefined?undefined:JSON.stringify(opts.body),cache:'no-store'});
    const text=await response.text();let data=null;if(text){try{data=JSON.parse(text)}catch{data=text}}
    if(!response.ok)throw new Error(String(data?.message||data?.msg||data?.error_description||data?.error||('HTTP '+response.status)));
    return data;
  }
  function rest(table,query,opts){return request('/rest/v1/'+table+(query?'?'+query:''),opts||{})}
  function mapPlace(row,l){return{id:'cloud-'+safeId(row.id),cloudId:row.id,cat:['fort','mosque','valley','mountain'].includes(row.category)?row.category:'fort',title:loc(row,'title',l),loc:loc(row,'location',l),body:loc(row,'description',l),importance:row.importance_ar||'',source:row.source_text||'',sourceUrl:row.source_url||'',status:'documented'}}
  function mapHistory(row,l){return{id:'cloud-'+safeId(row.id),cloudId:row.id,era:row.era==='modern'?'modern':'ancient',title:loc(row,'title',l),period:loc(row,'period',l),body:loc(row,'body',l),source:row.source_text||'',sourceUrl:row.source_url||'',status:'documented'}}
  function applyCached(){
    if(!window.HubaishRuntime?.applyCloudData)return;
    const l=lang();
    const landmarks=(cache.landmarks||[]).map(x=>mapPlace(x,l)).filter(x=>x.title&&x.body);
    const history=(cache.history_events||[]).map(x=>mapHistory(x,l)).filter(x=>x.title&&x.body);
    const links=(cache.community_links||[]).map(x=>({name:loc(x,'label',l),url:x.url,cloudId:x.id})).filter(x=>x.name&&x.url);
    const people=(cache.historical_figures||[]).map(x=>({title:loc(x,'name',l),body:loc(x,'biography',l),source:x.source_text||'',sourceUrl:x.source_url||''})).filter(x=>x.title&&x.body);
    window.HubaishRuntime.applyCloudData({landmarks:landmarks,history:history,links:links});
    window.HubaishFeatures?.setCloudPeople?.(people);
  }
  function districtUpdates(name,l){
    return(cache.sub_districts_updates||[]).filter(x=>String(x.district_name_ar||'').trim()===String(name||'').trim())
      .map(x=>({place:loc(x,'place_name',l),description:loc(x,'description',l),source:x.source_text||''})).filter(x=>x.place||x.description);
  }
  async function sync(silent){
    if(!configReady()||syncing||!navigator.onLine)return false;
    syncing=true;
    try{
      const rows=await Promise.all(TABLES.map(t=>rest(t,'select=*&status=eq.approved&order=updated_at.desc&limit=500')));
      const next={landmarks:rows[0]||[],history_events:rows[1]||[],sub_districts_updates:rows[2]||[],historical_figures:rows[3]||[],community_links:rows[4]||[],updatedAt:new Date().toISOString()};
      const signature=x=>JSON.stringify([x.landmarks||[],x.history_events||[],x.sub_districts_updates||[],x.historical_figures||[],x.community_links||[]]);
      const changed=signature(cache)!==signature(next);cache=next;save(CACHE_KEY,cache);applyCached();window.HubaishRuntime?.renderAll?.();
      status('متصل بالسحابة · آخر مزامنة '+new Date().toLocaleTimeString('ar'),false);
      if(changed&&!silent)toast('وصل محتوى جديد من موسوعة حبيش السحابية.');
      return true;
    }catch(error){status('تعذر الاتصال بالسحابة. يعمل التطبيق بالبيانات المحلية.',true);if(!silent)toast('تعذرت المزامنة. بقي المحتوى المحلي متاحاً.');console.error('[HubaishCloud] sync:',error);return false}
    finally{syncing=false}
  }
  async function signIn(email,password){
    session=null;localStorage.removeItem(SESSION_KEY);
    const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email,password:password},anon:true});
    session=Object.assign({},result,{expires_at:Math.floor(Date.now()/1000)+Number(result.expires_in||3600)});save(SESSION_KEY,session);
    if(!admin()){session=null;localStorage.removeItem(SESSION_KEY);throw new Error('الحساب لا يحمل دور hubaish_admin. نفّذ أمر ترقية المشرف في SQL Editor ثم سجّل الدخول من جديد.')}
  }
  async function signOut(){try{if(session?.access_token)await request('/auth/v1/logout',{method:'POST',admin:true})}catch{}session=null;localStorage.removeItem(SESSION_KEY);showAdmin(false)}
  function showAdmin(show){$('cloudAdminPanel')?.classList.toggle('hidden',!show);$('cloudAdminLoginArea')?.classList.toggle('hidden',!!show);if($('cloudAdminIdentity'))$('cloudAdminIdentity').textContent=show?session?.user?.email||'مشرف حبيش':''}
  function val(id){return $(id)?$(id).value.trim():''}
  function put(id,value){if($(id))$(id).value=value||''}
  function blank(){return{ar:'',en:'',tr:'',fr:''}}
  function values(){
    return{type:val('cloudRecordType'),id:val('cloudRecordId'),contributionId:val('cloudContributionId'),
      title:{ar:val('cloudTitleAr'),en:val('cloudTitleEn'),tr:val('cloudTitleTr'),fr:val('cloudTitleFr')},
      details:{ar:val('cloudDetailsAr'),en:val('cloudDetailsEn'),tr:val('cloudDetailsTr'),fr:val('cloudDetailsFr')},
      location:{ar:val('cloudLocationAr'),en:val('cloudLocationEn'),tr:val('cloudLocationTr'),fr:val('cloudLocationFr')},
      district:{ar:val('cloudDistrictAr'),en:val('cloudDistrictEn'),tr:val('cloudDistrictTr'),fr:val('cloudDistrictFr')},
      place:{ar:val('cloudPlaceAr'),en:val('cloudPlaceEn'),tr:val('cloudPlaceTr'),fr:val('cloudPlaceFr')},
      period:{ar:val('cloudPeriodAr'),en:val('cloudPeriodEn'),tr:val('cloudPeriodTr'),fr:val('cloudPeriodFr')},
      category:val('cloudCategory')||'fort',url:val('cloudUrl'),source:val('cloudSource'),sourceUrl:val('cloudSourceUrl'),sortOrder:Number(val('cloudSortOrder')||0)};
  }
  async function translate(value,target){
    const response=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(value)+'&langpair=ar|'+target,{cache:'no-store'});
    const data=await response.json();if(!response.ok||Number(data.responseStatus)!==200)throw new Error('translation failed');
    return String(data.responseData?.translatedText||'').trim();
  }
  async function fillTranslations(v){
    for(const group of [v.title,v.details,v.location,v.district,v.place,v.period]){
      if(!group?.ar)continue;
      for(const l of ['en','tr','fr'])if(!group[l]){try{group[l]=await translate(group.ar,l)}catch{}}
    }
  }
  function payload(v){
    const common={status:'approved',source_text:v.source||null,source_url:v.sourceUrl||null};
    if(v.type==='landmark')return Object.assign({},common,{slug:slug(v.title.ar),category:v.category,title_ar:v.title.ar,title_en:v.title.en||null,title_tr:v.title.tr||null,title_fr:v.title.fr||null,location_ar:v.location.ar||'مديرية حبيش',location_en:v.location.en||null,location_tr:v.location.tr||null,location_fr:v.location.fr||null,description_ar:v.details.ar,description_en:v.details.en||null,description_tr:v.details.tr||null,description_fr:v.details.fr||null});
    if(v.type==='history_event')return Object.assign({},common,{slug:slug(v.title.ar),era:v.category==='modern'?'modern':'ancient',title_ar:v.title.ar,title_en:v.title.en||null,title_tr:v.title.tr||null,title_fr:v.title.fr||null,period_ar:v.period.ar||'',period_en:v.period.en||null,period_tr:v.period.tr||null,period_fr:v.period.fr||null,body_ar:v.details.ar,body_en:v.details.en||null,body_tr:v.details.tr||null,body_fr:v.details.fr||null});
    if(v.type==='sub_district_update')return Object.assign({},common,{slug:slug(v.district.ar+'-'+(v.place.ar||v.title.ar)),district_name_ar:v.district.ar,district_name_en:v.district.en||null,district_name_tr:v.district.tr||null,district_name_fr:v.district.fr||null,place_name_ar:v.place.ar||v.title.ar,place_name_en:v.place.en||v.title.en||null,place_name_tr:v.place.tr||v.title.tr||null,place_name_fr:v.place.fr||v.title.fr||null,description_ar:v.details.ar,description_en:v.details.en||null,description_tr:v.details.tr||null,description_fr:v.details.fr||null});
    if(v.type==='historical_figure')return Object.assign({},common,{slug:slug(v.title.ar),name_ar:v.title.ar,name_en:v.title.en||null,name_tr:v.title.tr||null,name_fr:v.title.fr||null,role_ar:v.category||'',biography_ar:v.details.ar,biography_en:v.details.en||null,biography_tr:v.details.tr||null,biography_fr:v.details.fr||null});
    if(v.type==='community_link')return Object.assign({},common,{slug:slug(v.title.ar),label_ar:v.title.ar,label_en:v.title.en||null,label_tr:v.title.tr||null,label_fr:v.title.fr||null,url:v.url,sort_order:v.sortOrder});
    throw new Error('نوع المحتوى غير معروف');
  }
  function fillEditor(row,type,contributionId){
    put('cloudRecordType',type);put('cloudRecordId',row?.id||'');put('cloudContributionId',contributionId||'');
    const read=key=>({ar:row?.[key+'_ar']||'',en:row?.[key+'_en']||'',tr:row?.[key+'_tr']||'',fr:row?.[key+'_fr']||''});
    let title=blank(),details=blank(),location=blank(),district=blank(),place=blank(),period=blank(),category='',url='';
    if(type==='landmark'){title=read('title');details=read('description');location=read('location');category=row?.category||'fort'}
    else if(type==='history_event'){title=read('title');details=read('body');period=read('period');category=row?.era||'ancient'}
    else if(type==='sub_district_update'){district=read('district_name');place=read('place_name');details=read('description');title=place}
    else if(type==='historical_figure'){title=read('name');details=read('biography');category=row?.role_ar||''}
    else if(type==='community_link'){title=read('label');url=row?.url||'';category='community'}
    ['Ar','En','Tr','Fr'].forEach(s=>{const l=s.toLowerCase();put('cloudTitle'+s,title[l]);put('cloudDetails'+s,details[l]);put('cloudLocation'+s,location[l]);put('cloudDistrict'+s,district[l]);put('cloudPlace'+s,place[l]);put('cloudPeriod'+s,period[l])});
    put('cloudCategory',category);put('cloudUrl',url);put('cloudSource',row?.source_text||'');put('cloudSourceUrl',row?.source_url||'');put('cloudSortOrder',row?.sort_order||0);
    $('cloudContentEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function tableForType(type){return({landmark:'landmarks',history_event:'history_events',sub_district_update:'sub_districts_updates',historical_figure:'historical_figures',community_link:'community_links'})[type]}
  function titleFor(table,row){if(table==='landmarks'||table==='history_events')return row.title_ar||'';if(table==='sub_districts_updates')return(row.district_name_ar||'')+' · '+(row.place_name_ar||'');if(table==='historical_figures')return row.name_ar||'';return row.label_ar||''}
  function button(label,action,id,cls){const b=document.createElement('button');b.type='button';b.className=cls||'btn-sm';b.textContent=label;b.dataset.cloudAction=action;if(id)b.dataset.cloudId=id;return b}
  function renderList(items){
    const box=$('cloudContentList');if(!box)return;box.replaceChildren();
    if(!items.length){const p=document.createElement('p');p.className='empty-state';p.textContent='لا يوجد محتوى سحابي حتى الآن.';box.append(p);return}
    items.forEach(item=>{const row=document.createElement('div');row.className='cloud-admin-row';const title=document.createElement('strong');title.textContent=item.title;const meta=document.createElement('span');meta.className='muted small';meta.textContent=item.table+' · '+item.status;const actions=document.createElement('div');actions.className='cloud-row-actions';actions.append(button('تعديل','edit',item.id),button('حذف','delete',item.id,'btn-sm mini-danger'));row.append(title,meta,actions);box.append(row)});
  }
  function renderInbox(items){
    const box=$('cloudInboxList');if(!box)return;box.replaceChildren();
    if(!items.length){const p=document.createElement('p');p.className='empty-state';p.textContent='لا توجد مساهمات سحابية معلّقة.';box.append(p);return}
    items.forEach(item=>{const row=document.createElement('article');row.className='cloud-inbox-item';const meta=document.createElement('div');meta.className='item-meta';meta.textContent=(item.category||'مساهمة')+' · '+new Date(item.created_at).toLocaleString('ar');const title=document.createElement('h4');title.className='item-title';title.textContent=item.title||'';const body=document.createElement('p');body.className='item-body';body.textContent=item.details||'';const source=document.createElement('small');source.className='muted';source.textContent=item.reference_url||'لم يرفق مرجعاً';const actions=document.createElement('div');actions.className='card-actions';actions.append(button('موافقة ونشر للجميع','approve-contribution',item.id,'btn-primary'),button('تعديل قبل النشر','edit-contribution',item.id),button('رفض','reject-contribution',item.id,'btn-sm mini-danger'));row.append(meta,title,body,source,actions);box.append(row)});
  }
  async function refreshAdmin(){
    if(!admin())return;
    const results=await Promise.all(TABLES.map(table=>rest(table,'select=*&order=updated_at.desc&limit=150',{admin:true})));
    const inbox=await rest('user_contributions','select=*&status=eq.pending&order=created_at.asc&limit=150',{admin:true});
    cache={landmarks:results[0]||[],history_events:results[1]||[],sub_districts_updates:results[2]||[],historical_figures:results[3]||[],community_links:results[4]||[],updatedAt:new Date().toISOString()};
    save(CACHE_KEY,cache);applyCached();renderList(TABLES.flatMap((table,i)=>(results[i]||[]).map(row=>({id:row.id,table,status:row.status||'approved',title:titleFor(table,row)}))));renderInbox(inbox||[]);
    window.HubaishRuntime?.renderAll?.();status('لوحة المشرف متصلة · '+TABLES.reduce((n,t,i)=>n+(results[i]||[]).length,0)+' سجل',false);
  }
  async function saveEditor(event){
    event.preventDefault();if(!admin()){toast('سجّل دخول المشرف أولاً.');return}
    const v=values();
    if(!v.title.ar&&v.type!=='sub_district_update'){toast('أدخل الاسم أو العنوان بالعربية.');return}
    if(v.type==='sub_district_update'&&!v.district.ar){toast('أدخل اسم العزلة بالعربية.');return}
    if(v.type==='community_link'&&!/^https?:\/\//i.test(v.url)){toast('أدخل رابطاً صالحاً.');return}
    if(!v.details.ar&&['landmark','history_event','sub_district_update','historical_figure'].includes(v.type)){toast('أدخل التفاصيل بالعربية.');return}
    try{
      status('جارٍ حفظ المحتوى...',false);await fillTranslations(v);const table=tableForType(v.type),data=payload(v);
      if(v.id)await rest(table,'id=eq.'+encodeURIComponent(v.id),{method:'PATCH',body:data,prefer:'return=representation',admin:true});
      else await rest(table,'',{method:'POST',body:data,prefer:'return=representation',admin:true});
      if(v.contributionId)await rest('user_contributions','id=eq.'+encodeURIComponent(v.contributionId),{method:'PATCH',body:{status:'approved',reviewed_at:new Date().toISOString(),reviewed_by:session.user.id},prefer:'return=minimal',admin:true});
      fillEditor(null,v.type,'');toast('تم نشر المحتوى السحابي للجميع.');await refreshAdmin();await sync(true);
    }catch(error){status('تعذر الحفظ: '+error.message,true);toast('فشل حفظ المحتوى. تحقق من صلاحيات المشرف.');console.error('[HubaishCloud] save:',error)}
  }
  async function updateContribution(id,stateValue){await rest('user_contributions','id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status:stateValue,reviewed_at:new Date().toISOString(),reviewed_by:session.user.id},prefer:'return=minimal',admin:true})}
  function contributionType(type){return type==='history'?'history_event':type==='uzal'?'sub_district_update':type==='person'?'historical_figure':'landmark'}
  async function approveContribution(row){
    const type=contributionType(row.category),v={type:type,id:'',contributionId:row.id,title:{ar:row.title,en:'',tr:'',fr:''},details:{ar:row.details,en:'',tr:'',fr:''},location:blank(),
      district:{ar:type==='sub_district_update'?row.title:'',en:'',tr:'',fr:''},place:{ar:type==='sub_district_update'?row.details.slice(0,120):'',en:'',tr:'',fr:''},
      period:{ar:'مساهمة مجتمعية',en:'',tr:'',fr:''},category:type==='history_event'?'modern':'fort',url:'',source:row.reference_url||'',sourceUrl:/^https?:\/\//i.test(row.reference_url||'')?row.reference_url:'',sortOrder:0};
    await fillTranslations(v);await rest(tableForType(type),'',{method:'POST',body:payload(v),prefer:'return=minimal',admin:true});await updateContribution(row.id,'approved');await refreshAdmin();await sync(true);toast('تمت الموافقة والنشر للجميع.');
  }
  async function inboxClick(event){
    const b=event.target.closest('[data-cloud-action]');if(!b)return;
    const id=b.dataset.cloudId;const found=await rest('user_contributions','id=eq.'+encodeURIComponent(id)+'&select=*',{admin:true});const row=found&&found[0];if(!row)return;
    try{
      if(b.dataset.cloudAction==='approve-contribution')await approveContribution(row);
      if(b.dataset.cloudAction==='reject-contribution'){await updateContribution(id,'rejected');await refreshAdmin();toast('تم رفض المساهمة.')}
      if(b.dataset.cloudAction==='edit-contribution'){
        const type=contributionType(row.category),sourceUrl=/^https?:\/\//i.test(row.reference_url||'')?row.reference_url:'';
        fillEditor({title_ar:row.title,name_ar:row.title,place_name_ar:row.title,district_name_ar:type==='sub_district_update'?row.title:'',
          description_ar:row.details,body_ar:row.details,biography_ar:row.details,source_text:row.reference_url||'',source_url:sourceUrl},type,row.id);
      }
    }catch(error){toast('تعذرت معالجة المساهمة: '+error.message)}
  }
  async function submitContribution(item){
    if(!configReady())throw new Error('Supabase غير مضبوط');
    return rest('user_contributions','',{method:'POST',body:{name:item.name||null,category:item.type,title:item.title,details:item.body,
      reference_url:/^https?:\/\//i.test(item.source||'')?item.source:null,status:'pending'},prefer:'return=minimal'});
  }
  function bind(){
    $('cloudConfigForm')?.addEventListener('submit',async event=>{event.preventDefault();try{
      const url=String(val('cloudProjectUrl')).trim().replace(/\/+$/,'');if(!/^https:\/\/[a-z0-9.-]+$/i.test(url))throw new Error('Project URL يجب أن يبدأ بـ https://');
      config={url:url,anonKey:val('cloudAnonKey')};if(config.anonKey.length<20)throw new Error('تحقق من anon public key.');save(CONFIG_KEY,config);status('تم حفظ الإعدادات. جارٍ الاتصال...',false);await sync(false)
    }catch(error){status(error.message,true)}});
    $('cloudAdminForm')?.addEventListener('submit',async event=>{event.preventDefault();try{await signIn(val('cloudAdminEmail'),$('cloudAdminPassword')?.value||'');showAdmin(true);await refreshAdmin()}catch(error){showAdmin(false);status(error.message,true)}});
    $('cloudAdminLogoutBtn')?.addEventListener('click',signOut);
    $('cloudContentForm')?.addEventListener('submit',saveEditor);
    $('cloudContentClearBtn')?.addEventListener('click',()=>fillEditor(null,val('cloudRecordType'),''));
    $('cloudRefreshBtn')?.addEventListener('click',async()=>{await sync(false);if(admin())await refreshAdmin()});
    $('cloudTranslateBtn')?.addEventListener('click',async()=>{const v=values();await fillTranslations(v);['Ar','En','Tr','Fr'].forEach(s=>{const l=s.toLowerCase();put('cloudTitle'+s,v.title[l]);put('cloudDetails'+s,v.details[l]);put('cloudLocation'+s,v.location[l]);put('cloudDistrict'+s,v.district[l]);put('cloudPlace'+s,v.place[l]);put('cloudPeriod'+s,v.period[l])});toast('اكتملت محاولة الترجمة. راجع النص قبل النشر.')});
    $('cloudContentList')?.addEventListener('click',async event=>{const b=event.target.closest('[data-cloud-action]');if(!b)return;const id=b.dataset.cloudId,table=TABLES.find(t=>(cache[t]||[]).some(x=>String(x.id)===String(id))),row=(cache[table]||[]).find(x=>String(x.id)===String(id));if(!row)return;
      if(b.dataset.cloudAction==='edit'){const type=table==='landmarks'?'landmark':table==='history_events'?'history_event':table==='sub_districts_updates'?'sub_district_update':table==='historical_figures'?'historical_figure':'community_link';fillEditor(row,type,'')}
      if(b.dataset.cloudAction==='delete'&&confirm('حذف هذا السجل السحابي نهائياً؟'))try{await rest(table,'id=eq.'+encodeURIComponent(id),{method:'DELETE',admin:true,prefer:'return=minimal'});await refreshAdmin();await sync(true);toast('تم حذف السجل.')}catch(error){toast('تعذر الحذف: '+error.message)}
    });
    $('cloudInboxList')?.addEventListener('click',inboxClick);
  }
  async function sync(silent){
    if(!configReady()||syncing||!navigator.onLine)return false;syncing=true;
    try{
      const rows=await Promise.all(TABLES.map(t=>rest(t,'select=*&status=eq.approved&order=updated_at.desc&limit=500')));
      const next={landmarks:rows[0]||[],history_events:rows[1]||[],sub_districts_updates:rows[2]||[],historical_figures:rows[3]||[],community_links:rows[4]||[],updatedAt:new Date().toISOString()};
      const signature=x=>JSON.stringify([x.landmarks||[],x.history_events||[],x.sub_districts_updates||[],x.historical_figures||[],x.community_links||[]]);
      const changed=signature(cache)!==signature(next);cache=next;save(CACHE_KEY,cache);applyCached();window.HubaishRuntime?.renderAll?.();
      status('متصل بالسحابة · آخر مزامنة '+new Date().toLocaleTimeString('ar'),false);if(changed&&!silent)toast('وصل محتوى جديد من الموسوعة السحابية.');return true;
    }catch(error){status('تعذر الاتصال بالسحابة. يعمل التطبيق بالبيانات المحلية.',true);if(!silent)toast('تعذرت المزامنة. بقي المحتوى المحلي متاحاً.');console.error('[HubaishCloud] sync:',error);return false}
    finally{syncing=false}
  }
  async function signIn(email,password){
    session=null;localStorage.removeItem(SESSION_KEY);
    const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email,password:password},anon:true});
    session=Object.assign({},result,{expires_at:Math.floor(Date.now()/1000)+Number(result.expires_in||3600)});save(SESSION_KEY,session);
    if(!admin()){session=null;localStorage.removeItem(SESSION_KEY);throw new Error('الحساب لا يحمل دور hubaish_admin. نفّذ أمر ترقية المشرف في SQL Editor ثم سجّل الدخول من جديد.')}
  }
  async function signOut(){try{if(session?.access_token)await request('/auth/v1/logout',{method:'POST',admin:true})}catch{}session=null;localStorage.removeItem(SESSION_KEY);showAdmin(false)}
  function showAdmin(show){$('cloudAdminPanel')?.classList.toggle('hidden',!show);$('cloudAdminLoginArea')?.classList.toggle('hidden',!!show);if($('cloudAdminIdentity'))$('cloudAdminIdentity').textContent=show?session?.user?.email||'مشرف حبيش':''}
  function start(){
    if(started)return;started=true;put('cloudProjectUrl',config.url||'');put('cloudAnonKey',config.anonKey||'');applyCached();bind();
    if(admin()){showAdmin(true);refreshAdmin().catch(error=>status('تعذر تحميل لوحة المشرف: '+error.message,true))}else showAdmin(false);
    if(configReady())sync(true);
    window.setInterval(()=>{if(document.visibilityState==='visible')sync(true)},60000);
    window.addEventListener('online',()=>sync(true));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(true)});
  }
  window.HubaishCloud={start:start,isConfigured:configReady,isAdmin:admin,submitContribution:submitContribution,applyCached:applyCached,getDistrictUpdates:districtUpdates,sync:sync,signOut:signOut};
})();