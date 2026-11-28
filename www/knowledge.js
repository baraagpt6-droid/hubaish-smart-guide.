'use strict';
(() => {
  const DATA_URL='./data/heritage-knowledge.json';
  const CACHE_KEY='hubaish_knowledge_v1';
  const $=id=>document.getElementById(id);
  let data=null, published=[],liveData=null,reviewData=null;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
  const safe=value=>String(value??'').trim();
  const norm=value=>window.normalizeArabicText?window.normalizeArabicText(value):safe(value).toLocaleLowerCase().replace(/[إأآٱا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[\u064B-\u065F\u0670\u06D6-\u06EDـ]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  function card(title,body,meta,status){
    const node=el('article','knowledge-card');const head=el('h4','knowledge-card-title',title);node.append(head);
    if(meta)node.append(el('p','knowledge-meta',meta));
    if(body)node.append(el('p','knowledge-body',body));
    if(status)node.append(el('span','knowledge-status',status));
    return node;
  }
  function fill(root,rows,mapper,empty){
    if(!root)return;root.replaceChildren();
    if(!rows?.length){root.append(el('p','knowledge-empty',empty));return}
    rows.forEach(row=>root.append(mapper(row)));
  }
  function render(){
    if(!data)return;
    fill($('knowledgeLandmarksList'),data.landmarkRecords,x=>card(x.title,x.summary,x.location+' · '+x.source,x.status==='documented_reference'?'مرجع تاريخي':x.status==='location_needs_field_check'?'اختلاف في تعيين الموقع':x.status==='image_attached_literal_transcription_pending'?'صورة مرفقة · التفريغ قيد المراجعة':'بحاجة إلى مسح أو تحقق ميداني'),'لا توجد بطاقات معالم.');
    fill($('knowledgeAdditionalMosquesList'),data.additionalMosques,x=>card(x.title,x.summary,x.location+' · '+x.source,'أسماء مساجد وقباب تنتظر المسح الميداني'),'لا توجد سجلات إضافية.');
    fill($('knowledgeSchoolsList'),data.schools,(x)=>card(x.title,[x.summary||'',(x.subjects||[]).join('، '),(x.claimsPending||[]).length?'رواية مقررات محلية: '+x.claimsPending.join('، '):'',x.activity_ar||''].filter(Boolean).join('؛ '),[x.location,x.period,x.cuzla?'العزلة: '+x.cuzla:'',x.source].filter(Boolean).join(' · '),x.status==='documented_school_founder_conflict_curriculum_pending'?'المؤسس محل اختلاف في النقل؛ المقررات المحلية منسوبة وتحتاج مقابلة نصية':'إحالة تاريخية'),'لا توجد بيانات مدارس إضافية.');
    const workRows=[...data.works,...published.filter(x=>x.type==='work').map(x=>({title:x.title,description:x.body,author:x.name,source:x.source,period:x.location,status:'owner_submitted'}))];
    fill($('knowledgeWorksList'),workRows,x=>card(x.title,x.description,[x.author,x.period,x.source].filter(Boolean).join(' · '),x.status==='title_variant_needs_collation'?'عنوان العمل يحتاج مقابلة النسخة الأصلية':x.status==='owner_submitted'?'مادة مكتبية أضيفت من بوابة المشرف':'عمل تاريخي منسوب'), 'لا توجد أعمال مفهرسة.');
    const peopleRows=[...data.people,...published.filter(x=>x.type==='figure').map(x=>({name:x.title,bio:x.body,role:x.name,location:x.location,source:x.source,status:'self_supplied_profile_and_published_initiative'}))];
    fill($('knowledgePeopleList'),peopleRows,x=>card(x.name,x.bio,[x.role,x.location?'الموضع: '+x.location:'',x.relatedFamily?'ملف الأسرة: '+x.relatedFamily:'',x.source].filter(Boolean).join(' · '),x.status==='self_supplied_profile_and_published_initiative'?'السيرة المهنية مقدمة من صاحبها أو بوابة المشرف':x.status==='historical_press_and_family_testimony'?'مصدر صحفي مع شهادة أسرية منسوبة':x.status==='historical_press_account'?'رواية تاريخية منشورة':'ترجمة تاريخية منقولة'), 'لا توجد تراجم في الفهرس المحلي.');
    const familyRows=[...data.families,...published.filter(x=>x.type==='family').map(x=>({name:x.title,note:x.body,status:'approved'}))];
    fill($('knowledgeFamiliesList'),familyRows,x=>card(x.name,x.note,[x.location||'ملف الأسرة',x.source||''].filter(Boolean).join(' · '),x.status==='approved'?'مراجَع للنشر':'سجل تعارف؛ لا تُنشر شجرة نسب قبل توثيقها وموافقة الأسرة'), 'لم تُعتمد بعد ملفات أسر موثقة.');
    const archiveRows=[...data.archives,...published.filter(x=>x.type==='archive').map(x=>({id:x.id,title:x.title,summary:x.body,source:x.source,status:'approved',date:x.createdAt,image:x.attachmentUrl||'',imageOwner:x.ownerName||'صاحب الوثيقة غير محدد'}))];
    fill($('knowledgeArchiveList'),archiveRows,x=>{
      const n=card(x.title,x.summary,(x.location||'')+' '+(x.date||''),x.status==='approved'?'مساهمة راجعها المشرف':x.status==='image_available_literal_transcription_pending'?'صورة متاحة · التفريغ النصي قيد المراجعة':'قيد استلام الأصل');
      if(x.image){const b=el('button','btn-sm archive-open','عرض الوثيقة بعلامة مائية');b.type='button';b.addEventListener('click',()=>openArchiveViewer(x));n.append(b)}
      if(x.source)n.append(el('p','knowledge-source',x.source));
      return n;
    }, 'لا توجد وثائق معتمدة إضافية.');
    fill($('knowledgeResearchNotesList'),data.researchNotes||[],x=>card(x.title,x.body,x.source,x.status==='reference_context_only'?'إحالة مرجعية — لا تثبت نسباً أسرياً':x.status==='family_name_disambiguation'?'تمييز أسماء أسرية — لا استنتاج نسب':'ملاحظة لضبط النطاق الجغرافي'),'لا توجد ملاحظات بحثية إضافية.');
    const ag=$('knowledgeAgriculture');if(ag){ag.replaceChildren(el('h3','knowledge-section-title',data.agriculture.title),el('p','knowledge-body',data.agriculture.summary));data.agriculture.practices.forEach((p,i)=>ag.append(card('سجل زراعي '+(i+1),p,'التراث الزراعي', 'بحاجة إلى توثيق محلي')));ag.append(el('p','knowledge-source',data.agriculture.source))}
    const market=$('knowledgeMarketList');
    const marketRows=published.filter(x=>x.type==='marketplace');
    fill(market,marketRows,x=>{
      const n=card(x.title,x.body,x.marketCategory||'سوق حبيش المفتوح','إعلان معتمد');
      if(x.contactPublic){const a=el('a','btn-sm','تواصل مع المعلن');a.href='tel:'+encodeURIComponent(x.contactPublic);n.append(a)}
      return n;
    },'لا توجد إعلانات معتمدة حالياً. أرسل بيانات محل أو عرض، وسيظهر بعد مراجعة الإدارة.');
    fill($('knowledgeAuthorsList'),published.filter(x=>x.type==='author').map(x=>({...x,title:x.title,body:x.body,source:x.source})),x=>card(x.title,x.body,x.name+' · '+(x.source||'مساهمة منشورة'),'مساهمة راجعها المشرف'),'لا توجد كتب أو أبحاث مقدمة ومعتمدة بعد. استخدم نموذج النشر لإضافة عملك.');
    const honors=$('knowledgeHonorRoll');fill(honors,data.honorRoll,x=>card(x.name,x.contribution,x.source||'إسناد مقترح من فريق المشروع',x.status==='attributed_in_report'?'إسناد في التقرير':'بانتظار تأكيد المساهمة وموافقة صاحب الاسم'),'لا توجد أسماء إسناد.');
    const friday=$('knowledgeFridayMarket');if(friday){friday.replaceChildren(el('strong','market-day',data.market.day),el('p','knowledge-body',data.market.summary),el('p','knowledge-source',data.market.source),el('p','knowledge-status','موقع السوق وساعات نشاطه تحتاج إلى تأكيد محلي.'))}
    renderReviewRecords();
  }
  function openArchiveViewer(item){
    const modal=el('div','archive-viewer');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',item.title);
    const panel=el('section','archive-viewer-panel'),header=el('div','archive-viewer-head');
    header.append(el('strong','',item.title));
    const close=el('button','btn-sm','إغلاق');close.type='button';header.append(close);
    const viewport=el('div','archive-viewer-viewport'),canvas=el('canvas','archive-watermarked-canvas');
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label','نسخة عرض تحمل علامة مائية مزدوجة من أرشيف دليل حبيش الذكي');
    const tools=el('div','archive-viewer-controls'),zoomLabel=el('label','', 'التكبير');
    const zoom=document.createElement('input');zoom.type='range';zoom.min='1';zoom.max='2.6';zoom.step='.1';zoom.value='1';zoomLabel.append(zoom);
    tools.append(zoomLabel,el('span','small','لا يعرض هذا العارض رابط تنزيل مباشر للصورة.'));
    const caption=el('p','small archive-viewer-caption','التاريخ المنقول: 811هـ للنقش، والبناء الحالي 1183هـ. لا يمكن اعتماد تفريغ حرفي من الصورة الحالية وحدها.');
    viewport.append(canvas);panel.append(header,viewport,tools,caption);modal.append(panel);document.body.append(modal);
    const ctx=canvas.getContext('2d');const image=new Image();
    const draw=()=>{
      canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);
      ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/7);ctx.textAlign='center';ctx.font='bold '+Math.max(18,canvas.width*.035)+'px sans-serif';
      for(let y=-canvas.height*1.5;y<canvas.height*1.5;y+=Math.max(150,canvas.width*.28)){
        for(let x=-canvas.width*1.5;x<canvas.width*1.5;x+=Math.max(220,canvas.width*.55)){
          ctx.fillStyle='rgba(255,226,145,.22)';ctx.fillText('أرشيف دليل حبيش الذكي',x,y);
          ctx.fillStyle='rgba(255,255,255,.20)';ctx.fillText(item.imageOwner||'صاحب الوثيقة غير محدد',x,y+Math.max(22,canvas.width*.045));
        }
      }
      ctx.restore();
      canvas.dataset.sourceLoaded='true';
    };
    image.crossOrigin='anonymous';image.onload=draw;image.onerror=()=>{canvas.dataset.sourceError='true';caption.textContent='تعذر تحميل صورة الوثيقة من المصدر السحابي أو الحزمة المحلية.'};image.src=item.image;
    zoom.addEventListener('input',()=>{canvas.style.transform='scale('+zoom.value+')';canvas.style.transformOrigin='top center'});
    const dismiss=()=>{
      if(!document.body.contains(modal)||modal.classList.contains('is-closing'))return;
      modal.classList.add('is-closing');
      window.setTimeout(()=>modal.remove(),220);
    };
    close.addEventListener('click',dismiss);modal.addEventListener('click',e=>{if(e.target===modal)dismiss()});
    modal.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('dragstart',e=>e.preventDefault());
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'&&document.body.contains(modal)){dismiss();document.removeEventListener('keydown',esc)}});
  }
  const STOP_WORDS=new Set(['ابحث','اعطني','اعطيني','اعرض','وين','فين','ايش','ماذا','ما','هي','هو','عن','لي','من','في','هل','قصة','صورة','افتح','اريد','اريدك','لو','سمحت','ممكن','فضلا','رجاء','اخبرني','عرفني','علمني','هذا','هذه']);
  function queryForSearch(value){
    const raw=norm(value);if(!raw)return'';
    const parts=raw.split(/\s+/).filter(Boolean),terms=parts.filter(x=>!STOP_WORDS.has(x));
    return(terms.length?terms:parts).join(' ');
  }
  function matches(haystack,query){
    const q=queryForSearch(query);if(!q)return false;
    if(window.HubaishSearch?.matches)return window.HubaishSearch.matches(haystack,q);
    const h=norm(haystack);return h.includes(q)||q.split(' ').every(term=>h.includes(term));
  }
  function allRecords(){
    if(!data)return[];
    const rows=[];
    const add=(id,title,body,category,meta,source,status,extra={})=>{
      if(!safe(title))return;
      rows.push({id:String(id||category+'-'+rows.length),title:String(title),body:safe(body),category,meta:safe(meta),source:safe(source),status:safe(status),...extra});
    };
    for(const group of ['landmarkRecords','additionalMosques','schools','works','people','families','archives','researchNotes']){
      for(const x of data[group]||[]){
        const title=x.title||x.name||'';
        const body=[x.summary,x.bio,x.description,x.note,x.body,x.role,x.activity_ar,(x.subjects||[]).join(' '),(x.claimsPending||[]).join(' '),x.location,x.era_year_ar||x.period,x.source,x.lineage_caveat_ar].filter(Boolean).join(' ');
        add(x.id||title,title,body,group,[x.location,x.cuzla,x.era_year_ar||x.period,x.source].filter(Boolean).join(' · '),x.source||x.source_text,x.status,{location:x.location||'',cuzla:x.cuzla||x.subdistrict||'',era:x.era_year_ar||x.period||''});
      }
    }
    for(const x of liveData?.landmarks||[])add(x.id,x.title_ar,x.description_ar||x.summary_ar,'landmarkRecords',[x.location_ar,x.cuzla||x.subdistrict_ar,x.era_year_ar].filter(Boolean).join(' · '),x.source_text,x.status,{location:x.location_ar||'',cuzla:x.cuzla||x.subdistrict_ar||'',era:x.era_year_ar||x.period_ar||'',image_url:x.image_url||''});
    for(const x of liveData?.historicalFigures||[])add(x.id,x.name_ar,[x.role_ar,x.biography_ar].filter(Boolean).join('؛'),'people',[x.location_ar,x.cuzla||x.subdistrict_ar,x.era_year_ar].filter(Boolean).join(' · '),x.source_text,x.status,{location:x.location_ar||'',cuzla:x.cuzla||x.subdistrict_ar||''});
    for(const x of liveData?.historyEvents||[])add(x.id,x.title_ar,x.body_ar,'historyEvents',[x.period_ar,x.location_ar].filter(Boolean).join(' · '),x.source_text,x.status,{location:x.location_ar||''});
    for(const x of liveData?.educationalRecords||[])add(x.id,x.title_ar,[x.activity_ar,x.summary_ar,(x.subject_claims_pending_verification_ar||[]).join(' ')].filter(Boolean).join('؛'),'schools',[x.location_ar,x.era_year_ar||x.period_ar,x.cuzla].filter(Boolean).join(' · '),x.source_text,x.status);
    for(const x of liveData?.subDistrictUpdates||[])add(x.id,x.title_ar||x.name_ar,x.description_ar||x.body_ar,'districtUpdates',[x.subdistrict_ar,x.location_ar].filter(Boolean).join(' · '),x.source_text,x.status);
    for(const x of liveData?.subDistricts||[])add('district:'+x.district_name_ar,'عزلة '+x.district_name_ar,[x.profile_ar,x.summary_ar].filter(Boolean).join(' '),'district','مديرية حبيش','تقرير قائمة العزل المرجعية، 2026م','reference_list_pending_district_approval');
    for(const x of published||[]){const body=[x.title,x.body,x.name,x.source,x.location,x.marketCategory].filter(Boolean).join(' ');add(x.id,x.title||x.name,body,x.type,[x.location,x.createdAt].filter(Boolean).join(' · '),x.source,x.status||'approved');}
    const byId=new Map();
    for(const row of rows){const key=row.id||norm(row.title),old=byId.get(key);if(!old||row.body.length>old.body.length)byId.set(key,row);}
    const byTitle=new Map();
    for(const row of byId.values()){const key=norm(row.title),old=byTitle.get(key);if(!old||(row.body.length+row.meta.length)>(old.body.length+old.meta.length))byTitle.set(key,row);}
    return [...byTitle.values()];
  }
  function getRecord(id){return allRecords().find(x=>x.id===String(id))||null;}
  function search(query){
    if(!data)return[];
    const q=queryForSearch(query);if(!q)return[];
    return allRecords().filter(x=>matches([x.title,x.body,x.meta,x.source,x.location,x.cuzla,x.era].filter(Boolean).join(' '),q)).slice(0,16);
  }
  function renderReviewRecords(){
    const root=$('unverifiedHistoricalRecordsList');if(!root||!reviewData)return;
    root.replaceChildren();
    for(const x of reviewData.records||[]){
      const n=card(x.title,x.body,[x.location_note,x.source_text].filter(Boolean).join(' · '),'سجل تاريخي — لا يُعرض ضمن معالم المديرية أو مسارات الزيارة');
      n.dataset.reviewId=x.id;
      if(x.source_url){const a=el('a','btn-sm','المصدر');a.href=x.source_url;a.target='_blank';a.rel='noopener noreferrer';n.append(a);}
      root.append(n);
    }
  }
  function answer(question){
    if(!data)return null;
    const q=norm(question);
    if(/162023|162 023|تقدير 2025|سكان 2025|population 2025/.test(q))return'تقدير HNRP/OCHA لعام 2025 هو 162,023 نسمة، ويشمل المقيمين والنازحين داخلياً. هذا تقدير تخطيطي وليس تعداداً جديداً، ويُعرض منفصلاً عن تعداد 2004.';
    if(/105998|105 998|تعداد 2004|سكان 2004/.test(q))return'بلغ عدد السكان 105,998 نسمة وفق تعداد 2004 المنقول عن المركز الوطني للمعلومات اليمني. لا يُجمع هذا الرقم مع تقدير 2025 لأن نوع القياس وسنته مختلفان.';
    if(/سوق|الجمعة|جمعه|السوق الاسبوعي/.test(q))return'يسجل المركز الوطني للمعلومات يوم الجمعة لسوق مديرية حبيش الأسبوعي. يظل موقع السوق الحالي وساعات نشاطه بحاجة إلى تأكيد ميداني.';
    if(/زراعه|زراعي|محاصيل|حبوب|بقول|بن|فواكه|حصاد مياه|مدرجات/.test(q))return'تسجل المراجع المحاصيل والأنشطة الزراعية التالية في حبيش: الحبوب والبقوليات والبن والفواكه والخضروات، إلى جانب المدرجات الزراعية ومشاريع حصاد مياه الأمطار. تختلف المواسم حسب الارتفاع والقرية؛ تحقّق محلياً قبل الزيارة.';
    if(/الزوم|قبه الزوم/.test(q))return'تقع قبة الزوم في شرق ظُلمة السفلى. تصف دراسة علي يحيى الحبابي عمارتها وفناءها ومئذنتها وبركها وترميمها خلال 2004–2005م. عنوان المقال يذكر «حيس»، لكن متن الدراسة يحدد الموقع في ظُلمة/حبيش. لا يثبت المقال تاريخ تأسيس القبة.';
    if(/همدان|خولان|الناهي|النسب|قبائل/.test(q)){
      const n=(data.researchNotes||[]).find(x=>x.id==='al-hajri-tribal-reference-scope'||x.id==='al-nahi-family-disambiguation');
      return n?n.title+'\n'+n.body+'\nالمصدر: '+n.source:'تُعرض إحالات الحجري بوصفها مادة مرجعية تاريخية لا إثباتاً لنسب أسرة معاصرة.';
    }
    const rules=[
      [/وحاظه|هجره وحاظه|wuhaza/,'هجرة وحاظة','كانت مركز ولاية وعلم في القرنين الخامس والسادس الهجريين، وترتبط باللغة وغريب الألفاظ والفقه والأدب. يذكر الأكوع تراجم لسبعة من علمائها، ويحيل إلى ج4، ص2329–2331. وتُنسب إلى زيد الفائشي خزانة قيل إنها بلغت نحو 500 كتاب فقهي، ولا تُعرض بوصفها مكتبة عامة للمدرسة.'],
      [/الزواحي|مدرسه الزواحي/,'مدرسة الزواحي','تقع في قرية الزواحي بعزلة كومان. ينسب الأكوع البناء والوقف إلى قاسم بن حمير الوائلي، بينما يذكر الجندي في السلوك ص431 بعض مشايخ بني وائل دون تسمية شخص. وتنقل الرواية المحلية مواد «التنبيه» و«صحيح البخاري» و«نظام الغريب» على أنها مقررات منسوبة، وتحتاج إلى مقابلة نصية ولا تُعرض كمنهج محسوم.'],
      [/نظام الغريب|عيسى بن ابراهيم|عيسى الربعي/,'نظام الغريب','كتاب في اللغة وغريب الألفاظ ينسب إلى عيسى بن إبراهيم الربعي الوحاظي (458–528هـ بحسب الترجمة المنقولة). ويذكر التقرير دفنه بجامع الجعامي، مع بقاء موضع الدفن بحاجة إلى تحقق ميداني.'],
      [/زيد بن الحسن|التهذيب|الفائشي/,'زيد بن الحسن الفائشي','فقيه من وحاظة ينسب إليه كتاب «التهذيب». وتُنسب إليه خزانة قيل إنها بلغت نحو 500 كتاب فقهي؛ لا يصح تحويل ذلك إلى مكتبة عامة للمدرسة دون دليل.'],
      [/اسماعيل بن ابراهيم الوحاظي|الاوابد|قيد الاوابد/,'إسماعيل بن إبراهيم الوحاظي','لغوي وأديب، أخو عيسى. تنسب إليه قصيدة «الأوابد» وشرحها، مع اختلاف في عنوان العمل بين بعض النقول.'],
      [/مروحه|النقش الخشبي|1183|811/,'مسجد مروحة','يقع في عزلة نقيل العقاب. ينقل التقرير نقشاً خشبياً يؤرخ البناء إلى 811هـ / 1409م، ويذكر أن البناء الحالي يعود إلى 1183هـ / 1718م. التفريغ الحرفي للنقش يحتاج إلى صورة أدق أو معاينة.'],
      [/بين الدور|359/,'قبة مسجد بين الدور','تقع في قرية بين الدور بعزلة قحزة. ينقل التقرير تاريخ 359هـ / 963م من دراسة منشورة؛ ينبغي مطابقة النقش الأصلي قبل اعتماد لوحة أثرية نهائية.'],
      [/حصن خدد|قلعه خدد|خدد/,'حصن خدد','يُوصف بقصر وآبار وكروف منحوتة في الصخر الأسود وسدود حميرية، وتذكر المصادر أنه صار أطلالاً. يوجد اختلاف في تحديد موضعه بين روايات التقرير؛ لذلك لا تُعتمد إحداثيات قبل مسح ميداني.'],
      [/حصن العضادي|العضادي/,'حصن العضادي','يورد التقرير حصناً وسداً ومسجداً في قرية العضادي، وينقل عن مصدر ثانوي تقديراً بين 400 و500 سنة ونقوشاً كوفية وثلثاً ورقعة. يحتاج التأريخ والوصف إلى الرجوع إلى الدراسة الميدانية الأصلية.'],
      [/حصن يريس|شاحط|بني وائل/,'حصن يريس وقرية شاحط','يربط التقرير حصن يريس بإمارة بني وائل بن عيسى الحميريين ويذكر شاحط مدينةً لهم قبل القرن الخامس الهجري، نقلاً عن عمارة اليمني. لا تُعامل هذه الرواية اسماً إضافياً للعزل الـ22.']
    ];
    for(const [re,title,body] of rules)if(re.test(q))return title+'\n'+body;
    const found=search(question)[0];return found?found.title+'\n'+found.body+'\n'+found.meta+'\nالمصدر: '+found.source:null;
  }
  async function filePayload(form,type){
    const file=form.querySelector('input[type=file]')?.files?.[0];if(!file)return null;
    if(file.size>300*1024)throw new Error('الملف يجب ألا يتجاوز 300 كيلوبايت في هذه المرحلة.');
    const allowed=['application/pdf','text/plain','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if(!allowed.includes(file.type))throw new Error('نوع الملف غير مدعوم. استخدم PDF أو DOCX أو TXT أو صورة.');
    let upload=file,mimeType=file.type,name=file.name.slice(0,120);
    if(type==='archive'&&file.type.startsWith('image/')){
      if(typeof createImageBitmap!=='function')throw new Error('هذا الجهاز لا يدعم ختم صور الوثائق. استخدم متصفحاً يدعم Canvas أو أرسل ملف PDF.');
      const bitmap=await createImageBitmap(file);
      try{
        const canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
        canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('تعذر تجهيز علامة الأرشيف للصورة.');
        ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
        const owner=safe(form.querySelector('[name=ownerName]')?.value)||'صاحب الوثيقة غير محدد';
        ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/7);ctx.textAlign='center';ctx.font='bold '+Math.max(15,canvas.width*.032)+'px sans-serif';
        for(let y=-canvas.height*1.4;y<canvas.height*1.4;y+=Math.max(130,canvas.width*.27)){
          for(let x=-canvas.width*1.4;x<canvas.width*1.4;x+=Math.max(190,canvas.width*.53)){
            ctx.fillStyle='rgba(255,226,145,.22)';ctx.fillText('أرشيف دليل حبيش الذكي',x,y);
            ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillText(owner,x,y+Math.max(20,canvas.width*.04));
          }
        }
        ctx.restore();
        upload=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('تعذر حفظ صورة الوثيقة الموسومة.')),'image/webp',.78));
        if(upload.size>300*1024)throw new Error('حجم الصورة بعد إضافة العلامة المائية يتجاوز 300 كيلوبايت. قلّل أبعاد الصورة ثم أعد المحاولة.');
        mimeType='image/webp';name=name.replace(/\.[^.]+$/,'')+'.webp';
      }finally{bitmap.close?.()}
    }
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('تعذرت قراءة الملف.'));reader.readAsDataURL(upload)});
    return {name,mimeType,dataUrl};
  }
  async function submit(form,type){
    const consent=form.querySelector('[name=publishConsent]')?.checked===true;
    if(!consent){throw new Error('يلزم تأكيد حقك في إرسال المادة والموافقة على مراجعتها قبل النشر.')}
    const value=name=>safe(form.querySelector('[name='+name+']')?.value);
    const payload={type,name:value('name'),title:value('title'),body:value('body'),source:value('source'),contact:value('contact'),ownerName:value('ownerName'),marketCategory:value('marketCategory'),publicContact:form.querySelector('[name=publicContact]')?.checked===true,publishConsent:consent};
    if(!payload.title||!payload.body)throw new Error('أدخل العنوان والتفاصيل.');
    payload.attachment=await filePayload(form,type);
    const result=await window.HubaishCloud?.submitCommunitySubmission?.(payload);
    if(!result?.ok)throw new Error(result?.error||'تعذر إرسال الطلب إلى الخادم.');
    form.reset();return result;
  }
  function bindForm(id,type){
    const form=$(id);if(!form)return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
      try{await submit(form,type);const note=form.querySelector('[aria-live]');if(note)note.textContent='وصل طلبك إلى قائمة مراجعة الإدارة. لن يظهر للزوار قبل الاعتماد.';else window.showToast?.('وصل الطلب إلى قائمة المراجعة.');}
      catch(error){window.showToast?.(error.message||'تعذر الإرسال.');}
      finally{if(button)button.disabled=false}
    });
  }
  async function refreshPublished(){
    if(!navigator.onLine||!window.HubaishCloud?.getPublishedCommunitySubmissions)return;
    try{published=await window.HubaishCloud.getPublishedCommunitySubmissions();localStorage.setItem(CACHE_KEY,JSON.stringify(published));render()}
    catch{ /* keep the last approved snapshot for offline use */ }
  }
  async function load(){
    try{const response=await fetch(DATA_URL,{cache:'no-cache'});if(!response.ok)throw new Error('knowledge data unavailable');data=await response.json();localStorage.setItem(CACHE_KEY+':base',JSON.stringify(data))}
    catch{try{data=JSON.parse(localStorage.getItem(CACHE_KEY+':base')||'null')}catch{data=null}}
    try{const response=await fetch('./data/live-content.json',{cache:'no-cache'});if(!response.ok)throw new Error('live content unavailable');liveData=await response.json();localStorage.setItem(CACHE_KEY+':live',JSON.stringify(liveData))}
    catch{try{liveData=JSON.parse(localStorage.getItem(CACHE_KEY+':live')||'null')}catch{liveData=null}}
    try{const response=await fetch('./data/geography-review.json',{cache:'no-cache'});if(!response.ok)throw new Error('geography review unavailable');reviewData=await response.json();localStorage.setItem(CACHE_KEY+':review',JSON.stringify(reviewData))}
    catch{try{reviewData=JSON.parse(localStorage.getItem(CACHE_KEY+':review')||'null')}catch{reviewData=null}}
    try{published=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]')}catch{published=[]}
    render();await refreshPublished();window.dispatchEvent(new CustomEvent('hubaish:knowledge-ready'));
  }
  window.HubaishKnowledge={search,answer,load,getData:()=>data,getLiveData:()=>liveData,getRecord,allRecords,getReviewRecords:()=>reviewData?.records||[]};
  document.addEventListener('DOMContentLoaded',()=>{
    load();
    bindForm('authorSubmissionForm','author');
    bindForm('familyCvForm','family');
    bindForm('archiveSubmissionForm','archive');
    bindForm('marketListingForm','marketplace');
    window.addEventListener('online',refreshPublished);
    window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshPublished()});
    window.setInterval(()=>{if(document.visibilityState==='visible')refreshPublished()},15000);
    window.addEventListener('hubaish:languagechange',render);
  },{once:true});
})();