'use strict';
(() => {
  const DATA_URL='./data/heritage-knowledge.json';
  const CACHE_KEY='hubaish_knowledge_v1';
  const $=id=>document.getElementById(id);
  let data=null, published=[];
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
  const safe=value=>String(value??'').trim();
  const norm=value=>safe(value).toLocaleLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'');
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
    fill($('knowledgeSchoolsList'),data.schools,(x)=>card(x.title,x.summary,x.location+' · '+x.period,x.status==='documented_school_founder_conflict_curriculum_pending'?'المؤسس محل اختلاف في النقل؛ المقررات التفصيلية قيد المطابقة':'إحالة تاريخية'), 'لا توجد بيانات مدارس إضافية.');
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
    image.onload=draw;image.onerror=()=>{canvas.dataset.sourceError='true';caption.textContent='تعذر تحميل صورة الوثيقة من الحزمة المحلية.'};image.src=item.image;
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
  function search(query){
    if(!data)return[];const q=norm(query);if(!q)return[];
    const rows=[];
    for(const group of ['landmarkRecords','additionalMosques','schools','works','people','families','archives']){
      for(const x of data[group]||[]){
        const title=x.title||x.name||'';const body=[x.summary,x.bio,x.description,x.note,x.location,x.author,x.role,x.source,x.sourceUrl,x.relatedFamily,x.subdistrict,x.date,x.period,x.transcription].filter(Boolean).join(' ');
        if(norm(title+' '+body).includes(q))rows.push({id:x.id||title,title,body:body.slice(0,520),category:group});
      }
    }
    for(const x of published){
      const body=[x.title,x.body,x.name,x.source].filter(Boolean).join(' ');
      if(norm(body).includes(q))rows.push({id:x.id,title:x.title,body:body.slice(0,520),category:x.type});
    }
    return rows.slice(0,10);
  }
  function answer(question){
    if(!data)return null;const q=norm(question);
    const rules=[
      [/وحاظه|هجره وحاظه|wuhaza/,'هجرة وحاظة','كانت مركز ولاية وعلم في القرنين الخامس والسادس الهجريين، وترتبط باللغة وغريب الألفاظ والفقه والأدب. المصادر المذكورة: الأكوع، هجر العلم، ج4، ص2329–2331؛ الجندي؛ الأفضل العباس.'],
      [/الزواحي|مدرسه الزواحي/,'مدرسة الزواحي','تقع في قرية الزواحي بعزلة كومان. يختلف النقل في اسم المؤسس؛ ينسب الأكوع البناء والوقف إلى قاسم بن حمير الوائلي، بينما يذكر الجندي بعض مشايخ بني وائل دون تسمية شخص. أسماء مقررات التنبيه وصحيح البخاري ونظام الغريب لا تزال بحاجة إلى مقابلة نصية.'],
      [/نظام الغريب|عيسى بن ابراهيم|عيسى الربعي/,'نظام الغريب','كتاب في اللغة وغريب الألفاظ ينسب إلى عيسى بن إبراهيم الربعي الوحاظي، الذي عاش بحسب الترجمة بين 458 و528هـ.'],
      [/زيد بن الحسن|التهذيب|الفائشي/,'زيد بن الحسن الفائشي','فقيه من وحاظة ينسب إليه كتاب التهذيب. وتُنسب إليه خزانة قيل إنها بلغت نحو 500 كتاب فقهي؛ لا يصح تحويل ذلك إلى مكتبة عامة للمدرسة دون دليل.'],
      [/اسماعيل بن ابراهيم الوحاظي|الاوابد|قيد الاوابد/,'إسماعيل بن إبراهيم الوحاظي','لغوي وأديب، أخو عيسى. تنسب إليه قصيدة الأوابد وشرحها، مع اختلاف في عنوانها بين بعض النقول.'],
      [/مروحه|النقش الخشبي|1183|811/,'مسجد مروحة','الموقع في عزلة نقيل العقاب. ينقل التقرير أن نقشاً خشبياً يؤرخ البناء إلى 811هـ / 1409م، وأن البناء الحالي يعود إلى 1183هـ / 1718م. التفريغ الحرفي للنقش يحتاج صورة أدق أو معاينة.'],
      [/بين الدور|359/,'قبة مسجد بين الدور','تقع في قرية بين الدور بعزلة قحزة. ينقل التقرير تاريخ 359هـ / 963م من دراسة العروسي.'],
      [/الذره|الدفان|مدافن الحبوب|المدافن/,'مدافن الحبوب والتراث الزراعي','تذكر المواد المرجعية زراعة الحبوب والبن والمدرجات وحصاد مياه الأمطار. أما تقدير أكثر من 150 مدفناً ودور الدفّان ودفاتر الذرة وبيت المال فهي إفادات محلية لم يرفق بها مسح أو نسخ وثائق حتى الآن.'],
      [/سوق الجمعه|سوق حبيش|الجمعة/,'سوق حبيش الأسبوعي','يسجل المركز الوطني للمعلومات يوم الجمعة. يظل موقع السوق وساعات نشاطه بحاجة إلى تأكيد محلي.']
    ];
    for(const [re,title,body] of rules)if(re.test(q))return title+'\n'+body;
    const found=search(question)[0];return found?found.title+'\n'+found.body:null;
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
    try{published=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]')}catch{published=[]}
    render();await refreshPublished();
  }
  window.HubaishKnowledge={search,answer,load,getData:()=>data};
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