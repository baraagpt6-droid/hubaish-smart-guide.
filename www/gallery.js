'use strict';
(() => {
  const T={
    AR:{title:'معرض صور حبيش التراثي',sub:'صور موثقة من حصون حبيش وقراها ووديانها',all:'الكل',forts:'الحصون والقلاع',valleys:'الوديان والمدرجات',villages:'القرى والعزل',heritage:'الآثار والمساجد',count:'صورة موثقة',empty:'جاري توثيق وإضافة الصور الحصرية لمديرية حبيش عبر فريق الإشراف',emptyFilter:'لا توجد صور في هذا التصنيف حتى الآن.',add:'إضافة أول صورة',place:'المعلم',district:'العزلة / الموقع',height:'الارتفاع',photographer:'المصور',source:'المصدر والرخصة',share:'مشاركة الصورة',close:'إغلاق',prev:'السابق',next:'التالي',zoom:'تكبير',reset:'إعادة الحجم',copied:'تم نسخ رابط المصدر',unknown:'غير موثق في المصدر',sourceLabel:'فتح صفحة الصورة والرخصة'},
    EN:{title:'Hubaish Heritage Photo Gallery',sub:'Attributed photographs of Hubaish forts, villages and wadis',all:'All',forts:'Forts and castles',valleys:'Wadis and terraces',villages:'Villages and sub-districts',heritage:'Heritage and mosques',count:'verified photos',empty:'Exclusive photographs of Hubaish District are being documented and added by the editorial team',emptyFilter:'There are no photos in this category yet.',add:'Add the first photo',place:'Landmark',district:'Sub-district / location',height:'Elevation',photographer:'Photographer',source:'Source and licence',share:'Share photo',close:'Close',prev:'Previous',next:'Next',zoom:'Zoom in',reset:'Reset zoom',copied:'Source link copied',unknown:'Not documented by the source',sourceLabel:'Open image source and licence'},
    TR:{title:'Hubaish Miras Fotoğraf Galerisi',sub:'Hubaish kaleleri, köyleri ve vadilerinden kaynaklı fotoğraflar',all:'Tümü',forts:'Kaleler',valleys:'Vadiler ve teraslar',villages:'Köyler ve bucaklar',heritage:'Miras ve camiler',count:'doğrulanmış fotoğraf',empty:'Hubaish ilçesine ait özel fotoğraflar editör ekibi tarafından belgelenip ekleniyor',emptyFilter:'Bu kategoride henüz fotoğraf yok.',add:'İlk fotoğrafı ekle',place:'Yer',district:'Bucak / konum',height:'Yükseklik',photographer:'Fotoğrafçı',source:'Kaynak ve lisans',share:'Fotoğrafı paylaş',close:'Kapat',prev:'Önceki',next:'Sonraki',zoom:'Yakınlaştır',reset:'Boyutu sıfırla',copied:'Kaynak bağlantısı kopyalandı',unknown:'Kaynakta belirtilmemiş',sourceLabel:'Fotoğraf kaynağını ve lisansını aç'},
    FR:{title:'Galerie photo patrimoniale de Hubaish',sub:'Photos attribuées des forts, villages et vallées de Hubaish',all:'Tout',forts:'Forts et châteaux',valleys:'Vallées et terrasses',villages:'Villages et sous-districts',heritage:'Patrimoine et mosquées',count:'photos vérifiées',empty:'Les photos exclusives du district de Hubaish sont en cours de documentation par l’équipe éditoriale',emptyFilter:'Aucune photo dans cette catégorie pour le moment.',add:'Ajouter la première photo',place:'Monument',district:'Sous-district / lieu',height:'Altitude',photographer:'Photographe',source:'Source et licence',share:'Partager la photo',close:'Fermer',prev:'Précédent',next:'Suivant',zoom:'Agrandir',reset:'Réinitialiser',copied:'Lien source copié',unknown:'Non indiqué par la source',sourceLabel:'Ouvrir la source et la licence'}
  };
  const categories=['all','forts','valleys','villages','heritage'];
  let active='all',items=[],index=0,overlay=null,zoom=1,x=0,y=0,pointers=new Map(),gesture=null,pinch=null,clickSuppressed=false;
  const lang=()=>String(document.documentElement.lang||'ar').toUpperCase();
  const t=()=>T[lang()]||T.AR;
  const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
  const http=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'||u.protocol==='http:'}catch{return false}};
  const source=row=>http(row.image_source_url)?row.image_source_url:(http(row.source_url)?row.source_url:'');
  const safeImage=value=>http(value)||/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(String(value||''));
  const localized=(row,key)=>String(row?.[key+'_'+lang().toLowerCase()]||row?.[key+'_ar']||row?.[key+'_en']||'');
  const district=row=>String(row['image_district_'+lang().toLowerCase()]||row.image_district_ar||localized(row,'location')||'');
  const photographer=row=>String(row.image_photographer||row.image_credit||t().unknown);
  const elevation=row=>{const v=row.image_elevation??row.elevation;return (typeof v==='number'||String(v||'').trim()&&!/غير موثق|غير مقاس|unknown|not surveyed/i.test(String(v)))?String(v):t().unknown};
  function galleryRows(){
    const rows=window.HubaishCloud?.exportData?.()?.landmarks;
    if(!Array.isArray(rows))return [];
    return rows.filter(r=>r&&r.image_verified===true&&safeImage(r.image_url)&&source(r)&&String(r.title_ar||'').trim())
      .map(r=>({...r,_source:source(r)}))
      .sort((a,b)=>String(a.title_ar).localeCompare(String(b.title_ar),'ar'));
  }
  function category(row){
    if(categories.includes(row.image_category))return row.image_category;
    if(['fort','castle'].includes(row.category))return 'forts';
    if(['mosque','archaeology'].includes(row.category))return 'heritage';
    if(/قرية|عزلة|village|sub.?district/i.test(String(row.title_ar)+' '+String(row.location_ar)))return 'villages';
    return 'valleys';
  }
  function render(){
    const root=document.getElementById('hubaishGallery');if(!root)return;
    if(!root.querySelector('.heritage-gallery-head'))build(root);
    const all=galleryRows(),visible=active==='all'?all:all.filter(r=>category(r)===active);
    items=visible;
    const counter=root.querySelector('#heritageGalleryCount');if(counter)counter.textContent=String(visible.length);
    root.querySelectorAll('[data-gallery-filter]').forEach(b=>{const on=b.dataset.galleryFilter===active;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
    const grid=root.querySelector('#heritageGalleryGrid');if(!grid)return;grid.replaceChildren();
    if(!all.length){
      const empty=el('article','heritage-gallery-empty');
      empty.append(el('span','heritage-gallery-empty-mark','✦'),el('h3','item-title',t().title),el('p','item-body',t().empty));
      if(window.HubaishCloud?.isAdmin?.()){
        const add=el('button','btn-primary heritage-gallery-admin',t().add);add.type='button';add.addEventListener('click',openEditor);empty.append(add);
      }
      grid.append(empty);return;
    }
    if(!visible.length){grid.append(el('p','empty-state heritage-gallery-filter-empty',t().emptyFilter));return}
    visible.forEach((row,i)=>{
      const button=el('button','heritage-gallery-card');button.type='button';button.dataset.index=String(i);
      const img=el('img','heritage-gallery-card-image');img.src=row.image_url;img.alt=String(row['image_alt_'+lang().toLowerCase()]||row.image_alt_ar||localized(row,'title'));img.loading='lazy';img.decoding='async';
      img.addEventListener('error',()=>{button.classList.add('image-missing');img.removeAttribute('src')},{once:true});
      const caption=el('span','heritage-gallery-card-copy');caption.append(el('strong','',localized(row,'title')),el('small','',district(row)||t().unknown));
      button.append(img,caption);button.addEventListener('click',()=>openAt(i));grid.append(button);
    });
  }
  function build(root){
    const header=el('div','heritage-gallery-head'),text=el('div','heritage-gallery-heading');
    text.append(el('span','heritage-gallery-kicker','HUBAISH • HERITAGE ARCHIVE'),el('h2','section-title',t().title),el('p','section-sub',t().sub));
    const wrap=el('div','heritage-gallery-count-wrap'),count=el('strong','heritage-gallery-count','0');count.id='heritageGalleryCount';wrap.append(count,el('small','',t().count));header.append(text,wrap);
    const filters=el('div','heritage-gallery-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label',t().title);
    const labels={all:t().all,forts:t().forts,valleys:t().valleys,villages:t().villages,heritage:t().heritage};
    categories.forEach(key=>{const b=el('button','heritage-gallery-filter'+(key===active?' active':''),labels[key]);b.type='button';b.dataset.galleryFilter=key;b.setAttribute('aria-pressed',String(key===active));filters.append(b)});
    filters.addEventListener('click',event=>{const b=event.target.closest('[data-gallery-filter]');if(b){active=b.dataset.galleryFilter;render()}});
    const grid=el('div','heritage-gallery-grid');grid.id='heritageGalleryGrid';
    root.replaceChildren(header,filters,grid);
  }
  function openEditor(){
    if(!window.HubaishCloud?.isAdmin?.())return;
    if(typeof window.switchTab==='function')window.switchTab('more');
    if(typeof window.switchMoreTab==='function')window.switchMoreTab('admin');
    const type=document.getElementById('cloudRecordType');if(type){type.value='landmark';type.dispatchEvent(new Event('change',{bubbles:true}))}
    document.getElementById('cloudContentEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
    document.getElementById('cloudTitleAr')?.focus({preventScroll:true});
  }
  function buildOverlay(){
    if(overlay)return;
    overlay=el('div','heritage-lightbox');overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',t().title);
    const sheet=el('div','heritage-lightbox-sheet');
    const top=el('header','heritage-lightbox-top');top.append(el('span','heritage-gallery-kicker','HUBAISH • PHOTO'));
    const close=el('button','heritage-lightbox-close','×');close.type='button';close.setAttribute('aria-label',t().close);close.addEventListener('click',closeOverlay);top.append(close);
    const stage=el('div','heritage-lightbox-stage');
    const prev=el('button','heritage-lightbox-arrow previous','‹');prev.type='button';prev.setAttribute('aria-label',t().prev);prev.addEventListener('click',()=>move(-1));
    const img=el('img','heritage-lightbox-image');img.alt='';img.draggable=false;
    const next=el('button','heritage-lightbox-arrow next','›');next.type='button';next.setAttribute('aria-label',t().next);next.addEventListener('click',()=>move(1));stage.append(prev,img,next);
    const zoomControls=el('div','heritage-lightbox-zoom');
    const minus=el('button','','−'),reset=el('button','',t().reset),plus=el('button','', '+');[minus,reset,plus].forEach(b=>b.type='button');
    minus.setAttribute('aria-label',t().zoom);plus.setAttribute('aria-label',t().zoom);reset.setAttribute('aria-label',t().reset);
    minus.addEventListener('click',()=>setZoom(zoom/1.3));plus.addEventListener('click',()=>setZoom(zoom*1.3));reset.addEventListener('click',resetZoom);zoomControls.append(minus,reset,plus);
    const info=el('section','heritage-lightbox-info'),heading=el('h3','item-title'),caption=el('p','item-body'),facts=el('div','heritage-lightbox-facts');
    heading.id='heritageLightboxTitle';caption.id='heritageLightboxCaption';facts.id='heritageLightboxFacts';
    const actions=el('div','heritage-lightbox-actions'),share=el('button','btn-primary',t().share);share.type='button';share.addEventListener('click',shareCurrent);
    const sourceLink=el('a','btn-sm',t().source);sourceLink.id='heritageLightboxSource';sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.referrerPolicy='no-referrer';actions.append(share,sourceLink);
    const thumbs=el('div','heritage-lightbox-thumbs');thumbs.id='heritageLightboxThumbs';
    info.append(heading,caption,facts,actions);sheet.append(top,stage,zoomControls,info,thumbs);overlay.append(sheet);
    overlay.addEventListener('click',event=>{if(event.target===overlay)closeOverlay()});
    img.addEventListener('dblclick',()=>setZoom(zoom>1?1:2));
    img.addEventListener('wheel',event=>{event.preventDefault();setZoom(zoom+(event.deltaY<0?.2:-.2))},{passive:false});
    img.addEventListener('pointerdown',pointerDown);img.addEventListener('pointermove',pointerMove);img.addEventListener('pointerup',pointerUp);img.addEventListener('pointercancel',pointerUp);
    document.body.append(overlay);
  }
  function openAt(i){if(!items.length)return;buildOverlay();index=(i+items.length)%items.length;overlay.hidden=false;document.body.classList.add('gallery-lightbox-open');renderCurrent();overlay.querySelector('.heritage-lightbox-close')?.focus({preventScroll:true})}
  function closeOverlay(){if(!overlay)return;overlay.hidden=true;document.body.classList.remove('gallery-lightbox-open');resetZoom()}
  function move(delta){if(!items.length)return;index=(index+delta+items.length)%items.length;renderCurrent()}
  function renderCurrent(){
    const row=items[index];if(!row||!overlay)return;
    const img=overlay.querySelector('.heritage-lightbox-image');img.src=row.image_url;img.alt=String(row['image_alt_'+lang().toLowerCase()]||row.image_alt_ar||localized(row,'title'));resetZoom();
    overlay.querySelector('#heritageLightboxTitle').textContent=localized(row,'title');
    overlay.querySelector('#heritageLightboxCaption').textContent=String(row['image_caption_'+lang().toLowerCase()]||row.image_caption_ar||localized(row,'description'));
    const facts=overlay.querySelector('#heritageLightboxFacts');facts.replaceChildren();
    [[t().place,localized(row,'title')],[t().district,district(row)||t().unknown],[t().height,elevation(row)],[t().photographer,photographer(row)]].forEach(([label,value])=>{const item=el('div','heritage-lightbox-fact');item.append(el('small','',label),el('strong','',value));facts.append(item)});
    const sourceLink=overlay.querySelector('#heritageLightboxSource');sourceLink.href=row._source;sourceLink.textContent=t().source;
    const thumbs=overlay.querySelector('#heritageLightboxThumbs');thumbs.replaceChildren();
    items.forEach((item,i)=>{const button=el('button','heritage-lightbox-thumb'+(i===index?' active':''));button.type='button';button.setAttribute('aria-label',localized(item,'title'));const thumb=el('img','');thumb.src=item.image_url;thumb.alt='';thumb.loading='lazy';button.append(thumb);button.addEventListener('click',()=>{index=i;renderCurrent()});thumbs.append(button)});
    overlay.querySelector('.heritage-lightbox-top .heritage-gallery-kicker').textContent=(index+1)+' / '+items.length+' · HUBAISH';
    thumbs.children[index]?.scrollIntoView({block:'nearest',inline:'center'});
  }
  function resetZoom(){zoom=1;x=0;y=0;applyTransform()}
  function setZoom(value){zoom=Math.max(1,Math.min(4,Number(value)||1));if(zoom===1){x=0;y=0}applyTransform()}
  function applyTransform(){const img=overlay?.querySelector('.heritage-lightbox-image');if(img)img.style.transform='translate('+x+'px,'+y+'px) scale('+zoom+')'}
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function pointerDown(event){
    const img=event.currentTarget;img.setPointerCapture?.(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){const p=[...pointers.values()];pinch={distance:gap(p[0],p[1]),zoom};gesture=null}
    else gesture={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY};
  }
  function pointerMove(event){
    if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size>1&&pinch){const p=[...pointers.values()];setZoom(pinch.zoom*gap(p[0],p[1])/Math.max(1,pinch.distance));clickSuppressed=true;return}
    if(zoom>1&&gesture){x+=event.clientX-gesture.lastX;y+=event.clientY-gesture.lastY;gesture.lastX=event.clientX;gesture.lastY=event.clientY;applyTransform();clickSuppressed=true}
  }
  function pointerUp(event){
    pointers.delete(event.pointerId);if(pointers.size<2)pinch=null;
    if(pointers.size===0&&gesture){const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
      if(zoom===1&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.2){move(dx<0?1:-1);clickSuppressed=true}
      gesture=null;if(clickSuppressed)window.setTimeout(()=>{clickSuppressed=false},0);
    }
  }
  async function shareCurrent(){
    const row=items[index];if(!row)return;const payload={title:localized(row,'title'),text:String(row['image_caption_'+lang().toLowerCase()]||row.image_caption_ar||''),url:row._source};
    try{if(navigator.share)await navigator.share(payload);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(row._source);window.showToast?.(t().copied)}}catch(error){if(error?.name!=='AbortError')window.showToast?.(t().sourceLabel)}
  }
  function open(){active='all';if(typeof window.switchTab==='function')window.switchTab('more');if(typeof window.switchMoreTab==='function')window.switchMoreTab('explore');render();document.getElementById('hubaishGallery')?.scrollIntoView({behavior:'smooth',block:'start'})}
  document.addEventListener('keydown',event=>{if(!overlay||overlay.hidden)return;if(event.key==='Escape')closeOverlay();else if(event.key==='ArrowLeft')move(lang()==='AR'?1:-1);else if(event.key==='ArrowRight')move(lang()==='AR'?-1:1)});
  document.addEventListener('hubaish:languagechange',()=>{if(document.getElementById('hubaishGallery'))render();if(overlay&&!overlay.hidden)renderCurrent()});
  window.HubaishGallery={render,open,close:closeOverlay};
})();
