'use strict';
(() => {
  const OWNER='baraagpt6-droid';
  const REPO='hubaish-smart-guide.';
  const BRANCH='main';
  const FILE='www/data/live-content.json';
  const API_URL='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+FILE;
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
  let documentData=readCache();
  let githubToken='';
  let started=false;
  let syncing=false;
  let saving=false;

  function emptyDocument(){
    return {schemaVersion:1,updatedAt:null,landmarks:[],historyEvents:[],subDistrictUpdates:[],subDistricts:[],historicalFigures:[],communityLinks:[]};
  }
  function normalizeDocument(value){
    const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const clean={schemaVersion:1,updatedAt:typeof source.updatedAt==='string'?source.updatedAt:null};
    for(const key of Object.values(TABLES))clean[key]=Array.isArray(source[key])?source[key].filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,1000):[];
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
    if(el){el.textContent=message;el.classList.toggle('cloud-error',!!error);el.classList.toggle('cloud-ok',!error)}
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
  function safeUrl(value){
    try{const url=new URL(String(value||''));return url.protocol==='https:'||url.protocol==='http:'}
    catch{return false}
  }
  function deepCopy(value){return JSON.parse(JSON.stringify(value))}
  function slug(value){
    return String(value||'').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,90)||'record';
  }
  function makeId(type){
    const suffix=globalThis.crypto?.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    return 'cms-'+type+'-'+suffix;
  }
  function decodeBase64(value){
    const binary=atob(String(value||'').replace(/\s/g,''));
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encodeBase64(value){
    const bytes=new TextEncoder().encode(value);
    let binary='';
    for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));
    return btoa(binary);
  }
  function apiHeaders(token){
    return {Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  }
  async function readRepositoryFile(token){
    const response=await fetch(API_URL+'?ref='+encodeURIComponent(BRANCH)+'&t='+Date.now(),{headers:apiHeaders(token),cache:'no-store'});
    const raw=await response.text();
    let payload={};try{payload=raw?JSON.parse(raw):{}}catch{}
    if(!response.ok){
      if(response.status===401||response.status===403)throw new Error('رفض GitHub الرمز. تحقق من انتهاء صلاحيته وصلاحية Contents Read.');
      if(response.status===404)throw new Error('لم يتم العثور على ملف البيانات أو لا يملك الرمز صلاحية الوصول.');
      throw new Error(payload.message||'تعذر قراءة ملف البيانات من GitHub (HTTP '+response.status+').');
    }
    if(!payload.content||!payload.sha)throw new Error('استجابة GitHub لا تحتوي محتوى الملف أو SHA.');
    let parsed;
    try{parsed=JSON.parse(decodeBase64(payload.content))}
    catch{throw new Error('ملف live-content.json ليس JSON صالحاً. لم يتم تعديل الملف.')}
    return {data:normalizeDocument(parsed),sha:payload.sha};
  }
  async function publicFetch(){
    const candidates=[RAW_URL+'?v='+Date.now(),new URL('./data/live-content.json',document.baseURI).href];
    let lastError=null;
    for(const url of candidates){
      try{
        const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json','Cache-Control':'no-cache'}});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const parsed=normalizeDocument(await response.json());
        return parsed;
      }catch(error){lastError=error}
    }
    throw lastError||new Error('Network unavailable');
  }
  function mapPlace(row,l){
    return {
      id:String(row.id||makeId('landmark')),
      cat:['fort','mosque','valley','mountain'].includes(row.category)?row.category:'fort',
      title:localized(row,'title',l),
      loc:localized(row,'location',l)||'مديرية حبيش',
      body:localized(row,'description',l),
      elevation:row.elevation||'غير موثق ميدانياً',
      importance:localized(row,'importance',l),
      source:row.source_text||'',
      sourceUrl:row.source_url||'',
      status:['documented','local','unverified'].includes(row.status)?row.status:'documented'
    };
  }
  function mapHistory(row,l){
    return {
      id:String(row.id||makeId('history')),
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
  }
  function districtUpdates(name,l){
    return documentData.subDistrictUpdates.filter(x=>String(x.district_name_ar||'').trim()===String(name||'').trim()).map(x=>({
      place:localized(x,'place_name',l),
      description:localized(x,'description',l),
      source:x.source_text||''
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
  function isAdmin(){return !!githubToken}
  function adminStatus(){
    $('cloudAdminPanel')?.classList.toggle('hidden',!isAdmin());
    $('cloudAdminLoginArea')?.classList.toggle('hidden',isAdmin());
    if($('cloudAdminIdentity'))$('cloudAdminIdentity').textContent=isAdmin()?'GitHub · '+OWNER+'/'+REPO+' · '+BRANCH:'';
  }
  async function connect(event){
    event.preventDefault();
    const input=$('cloudAdminPassword');
    const candidate=String(input?.value||'').trim();
    if(!candidate){status('أدخل GitHub Personal Access Token.',true);return}
    try{
      status('جارٍ التحقق من الرمز وقراءة ملف البيانات...',false);
      const remote=await readRepositoryFile(candidate);
      githubToken=candidate;
      documentData=remote.data;
      saveCache();
      applyCached();
      adminStatus();
      renderAdminList();
      if(input)input.value='';
      status('تم الاتصال بالمستودع. الرمز محفوظ في ذاكرة الجلسة فقط.',false);
      toast('تم فتح لوحة GitHub CMS.');
    }catch(error){
      githubToken='';
      adminStatus();
      status(error.message,true);
    }
  }
  function signOut(){
    githubToken='';
    adminStatus();
    status('تم تسجيل الخروج. لا يبقى رمز GitHub في ذاكرة الصفحة.',false);
    renderAdminList();
  }
  function allLocales(row,key){
    return {ar:row?.[key+'_ar']||'',en:row?.[key+'_en']||'',tr:row?.[key+'_tr']||'',fr:row?.[key+'_fr']||''};
  }
  function fromBasePlace(item){
    const result={id:item.id,category:item.cat||'fort',source_text:item.source||'',source_url:item.sourceUrl||'',elevation:item.elevation||'',status:item.status||'documented'};
    for(const l of ['AR','EN','TR','FR']){
      const x=window.HubaishCatalog?.localizeItem?.(item,l)||item;
      const suffix=l.toLowerCase();
      result['title_'+suffix]=x.title||item.title;
      result['location_'+suffix]=x.loc||item.loc||'مديرية حبيش';
      result['description_'+suffix]=x.body||item.body;
      result['importance_'+suffix]=x.importance||item.importance||'';
    }
    return result;
  }
  function fromBaseHistory(item){
    const result={id:item.id,era:item.era||'ancient',source_text:item.source||'',source_url:item.sourceUrl||'',status:item.status||'documented'};
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
    const places=(window.HubaishRuntime?.places||[]).filter(x=>/^p\d+$/.test(x.id)||String(x.id).startsWith('cms-landmark-'));
    const histories=(window.HubaishRuntime?.history||[]).filter(x=>/^h\d+$/.test(x.id)||String(x.id).startsWith('cms-history_event-'));
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
  function renderAdminList(){
    const box=$('cloudContentList');if(!box)return;
    box.replaceChildren();
    const rows=buildAdminRows();
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
    if(!rows.length){const p=document.createElement('p');p.className='empty-state';p.textContent='لا يوجد محتوى لإدارته.';box.append(p)}
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
      category:val('cloudCategory')||'fort',url:val('cloudUrl'),source:val('cloudSource'),sourceUrl:val('cloudSourceUrl'),
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
    const groups=[v.title,v.details,v.location,v.district,v.place,v.period,v.importance];
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
      const row=Object.assign(common,{category:v.category,elevation:'غير موثق ميدانياً'});
      localeFields(row,'title',v.title);localeFields(row,'location',v.location);localeFields(row,'description',v.details);localeFields(row,'importance',v.importance);
      return row;
    }
    if(v.type==='history_event'){
      const row=Object.assign(common,{era:v.category==='modern'?'modern':'ancient'});
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
      const row=Object.assign(common,{url:v.url,sort_order:v.sortOrder});
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
    let title=blank(),details=blank(),location=blank(),district=blank(),period=blank(),importance=blank(),category='',url='';
    if(type==='landmark'){title=read('title');details=read('description');location=read('location');importance=read('importance');category=row?.category||'fort'}
    else if(type==='history_event'){title=read('title');details=read('body');period=read('period');category=row?.era||'ancient'}
    else if(type==='sub_district_update'){district=read('district_name');title=read('place_name');details=read('description')}
    else if(type==='sub_district'){district={ar:row?.district_name_ar||'',en:row?.district_name_en||row?.district_name_ar||'',tr:row?.district_name_tr||row?.district_name_ar||'',fr:row?.district_name_fr||row?.district_name_ar||''};title=read('title');details=read('body')}
    else if(type==='historical_figure'){title=read('name');details=read('biography');category=row?.role_ar||''}
    else if(type==='community_link'){title=read('label');url=row?.url||'';category='community'}
    put('cloudRecordType',type);put('cloudRecordId',row?.id||'');
    ['Ar','En','Tr','Fr'].forEach(s=>{
      const l=s.toLowerCase();
      put('cloudTitle'+s,title[l]);put('cloudDetails'+s,details[l]);put('cloudLocation'+s,location[l]);
      put('cloudDistrict'+s,district[l]);put('cloudPlace'+s,'');put('cloudPeriod'+s,period[l]);
    });
    put('cloudCategory',category);put('cloudUrl',url);put('cloudSource',row?.source_text||'');put('cloudSourceUrl',row?.source_url||'');
    put('cloudImportanceAr',importance.ar);put('cloudImportanceEn',importance.en);put('cloudImportanceTr',importance.tr);put('cloudImportanceFr',importance.fr);put('cloudSortOrder',row?.sort_order||0);
    $('cloudContentEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function typeForCollection(collection){
    return {landmarks:'landmark',historyEvents:'history_event',subDistrictUpdates:'sub_district_update',subDistricts:'sub_district',historicalFigures:'historical_figure',communityLinks:'community_link'}[collection];
  }
  function collectionForType(type){return TABLES[type]}
  async function mutateRepository(mutator,message){
    if(!isAdmin())throw new Error('سجّل الدخول إلى GitHub أولاً.');
    if(saving)throw new Error('هناك عملية نشر أخرى قيد التنفيذ.');
    saving=true;
    try{
      for(let attempt=0;attempt<2;attempt++){
        const latest=await readRepositoryFile(githubToken);
        const draft=deepCopy(latest.data);
        mutator(draft);
        draft.updatedAt=new Date().toISOString();
        const body={message:message,content:encodeBase64(JSON.stringify(draft,null,2)+'\n'),sha:latest.sha,branch:BRANCH};
        const response=await fetch(API_URL,{method:'PUT',headers:{...apiHeaders(githubToken),'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
        const raw=await response.text();let result={};try{result=raw?JSON.parse(raw):{}}catch{}
        if(response.ok){
          documentData=normalizeDocument(draft);saveCache();applyCached();renderAdminList();window.HubaishRuntime?.renderAll?.();
          return result;
        }
        if((response.status===409||response.status===422)&&attempt===0)continue;
        if(response.status===401||response.status===403)throw new Error('رفض GitHub النشر. تحقق من صلاحية Contents Read and write ومن صلاحية الرمز.');
        throw new Error(result.message||'فشل تحديث ملف JSON في GitHub (HTTP '+response.status+').');
      }
      throw new Error('تغير الملف بالتزامن مع النشر. أعد المحاولة لتفادي الكتابة فوق تعديل آخر.');
    }finally{saving=false}
  }
  async function saveEditor(event){
    event.preventDefault();
    if(!isAdmin()){toast('سجّل الدخول برمز GitHub أولاً.');return}
    const v=formValues();
    if(!v.title.ar){toast('أدخل الاسم أو العنوان بالعربية.');return}
    if(v.type!=='community_link'&&!v.details.ar){toast('أدخل التفاصيل بالعربية.');return}
    if(v.type==='sub_district_update'&&!v.district.ar){toast('اختر اسم العزلة بالعربية.');return}
    if(v.type==='sub_district'&&!v.district.ar){toast('اختر العزلة الأصلية المراد تعديلها.');return}
    if(v.type==='community_link'&&!safeUrl(v.url)){toast('أدخل رابط HTTPS أو HTTP صحيحاً.');return}
    if(v.sourceUrl&&!safeUrl(v.sourceUrl)){toast('رابط المصدر غير صالح.');return}
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
  function bind(){
    $('cloudAdminForm')?.addEventListener('submit',connect);
    $('cloudAdminLogoutBtn')?.addEventListener('click',signOut);
    $('cloudContentForm')?.addEventListener('submit',saveEditor);
    $('cloudContentClearBtn')?.addEventListener('click',()=>{
      const type=val('cloudRecordType');['cloudRecordId','cloudContributionId'].forEach(id=>put(id,''));
      ['cloudTitleAr','cloudTitleEn','cloudTitleTr','cloudTitleFr','cloudDetailsAr','cloudDetailsEn','cloudDetailsTr','cloudDetailsFr','cloudLocationAr','cloudLocationEn','cloudLocationTr','cloudLocationFr','cloudDistrictAr','cloudDistrictEn','cloudDistrictTr','cloudDistrictFr','cloudPlaceAr','cloudPlaceEn','cloudPlaceTr','cloudPlaceFr','cloudPeriodAr','cloudPeriodEn','cloudPeriodTr','cloudPeriodFr','cloudCategory','cloudUrl','cloudSource','cloudSourceUrl','cloudImportanceAr','cloudImportanceEn','cloudImportanceTr','cloudImportanceFr'].forEach(id=>put(id,''));
      put('cloudRecordType',type);
    });
    $('cloudRefreshBtn')?.addEventListener('click',async()=>{
      if(isAdmin()){
        try{const latest=await readRepositoryFile(githubToken);documentData=latest.data;saveCache();applyCached();renderAdminList();status('تم تحديث لوحة المشرف من main.',false)}
        catch(error){status(error.message,true)}
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
  function start(){
    if(started)return;started=true;
    applyCached();bind();setTimeout(applyCached,0);
    if(navigator.onLine)sync(true);
    window.setInterval(()=>{if(document.visibilityState==='visible')sync(true)},60000);
    window.addEventListener('online',()=>sync(true));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(true)});
    renderAdminList();
  }
  window.HubaishCloud={
    start,isAdmin,applyCached,sync,signOut,
    getDistrictUpdates:districtUpdates,
    getDistrictProfile:districtProfile,
    isConfigured:()=>true
  };
})();