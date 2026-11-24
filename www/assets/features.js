'use strict';

/* Optional feature layer: relies on the core data and safe rendering functions in app.js. */
(() => {
  const FEATURE_KEY = 'hubaish_features_v2';
  const FACEBOOK_URL = 'https://www.facebook.com/share/g/1JMCzDUsdZ/';
  const FACTS = [
    'المدرجات الجبلية تحفظ التربة وتبطئ جريان مياه المطر، وتحتاج إلى صيانة مصارفها قبل مواسم الأمطار.',
    'يختلف موعد نضج البن وقطافه بين السفوح المنخفضة والمرتفعات؛ لذلك لا يوجد موعد واحد لكل قرى حبيش.',
    'يشير تقويم البن لمنطقة إب إلى موسم إزهار رئيسي في مارس–أبريل، مع اختلاف التوقيت حسب الارتفاع والطقس.',
    'حصر أسماء الغيول ومجاري السيول والقرى القريبة منها يساعد على توثيق موارد الماء في المديرية.',
    'توثيق اسم الموضع ورواية أهله ومصدرها يحفظ ذاكرة المكان ويميز التاريخ المنشور من الحكاية المحلية.'
  ];
  const FACTS_I18N = {
    AR: FACTS,
    EN: ['Mountain terraces help retain soil and slow rain runoff. Their drainage channels need maintenance before rainy periods.','Coffee ripening and harvest vary between lower slopes and higher ground; there is no single date for every Hubaish village.','The Ibb coffee calendar indicates a main flowering period around March–April, with timing affected by altitude and weather.','Recording springs, seasonal streams and nearby villages helps document the district’s water resources.','Recording a place name, a resident’s account and its source helps preserve local memory and distinguish published history from oral tradition.'],
    TR: ['Dağ terasları toprağı tutar ve yağmur akışını yavaşlatır. Yağış öncesinde drenaj kanalları temizlenmelidir.','Kahvenin olgunlaşma ve hasat zamanı alçak yamaçlarla yüksek kesimler arasında değişir; her Hubaish köyü için tek tarih yoktur.','İbb kahve takvimi ana çiçeklenme dönemini yaklaşık Mart–Nisan olarak gösterir; rakım ve hava etkiler.','Kaynakları, mevsimlik dereleri ve yakındaki köyleri kaydetmek ilçenin su kaynaklarını belgelemeye yardımcı olur.','Yer adını, yerel anlatıyı ve kaynağını kaydetmek belleği korur; yayımlanmış tarih ile sözlü geleneği ayırır.'],
    FR: ['Les terrasses de montagne retiennent le sol et ralentissent le ruissellement. Leurs drains doivent être entretenus avant les pluies.','La maturation et la récolte du café varient entre les versants bas et les hauteurs; il n’existe pas une date unique pour tous les villages.','Le calendrier du café d’Ibb indique une floraison principale vers mars–avril, selon l’altitude et la météo.','Recenser les sources, les cours d’eau saisonniers et les villages proches aide à documenter les ressources en eau du district.','Noter un nom de lieu, un récit local et sa source préserve la mémoire et distingue l’histoire publiée de la tradition orale.']
  };
  const QUIZ_TRANSLATIONS = {
    EN: [
      {q:'In which governorate is Hubaish District located?',a:['Ibb','Taiz','Dhamar'],why:'Hubaish is part of Ibb Governorate.'},
      {q:'What is named as the administrative centre?',a:['Yarim','Dhulmah','Jiblah'],why:'The available administrative listing names Dhulmah.'},
      {q:'What population was recorded in the 2004 census?',a:['105,998','85,300','228,000'],why:'The National Information Center lists 105,998 residents.'},
      {q:'Which area figure is used in the OCHA/local governance table?',a:['330 km²','228 km²','480 km²'],why:'The OCHA/local governance district table lists 228 km².'},
      {q:'Which fort is highlighted in this guide?',a:['Sahban Fort','Cairo Fort','Hab Fort'],why:'The guide highlights Sahban Fort.'}
    ],
    TR: [
      {q:'Hubaish ilçesi hangi valilikte bulunur?',a:['İbb','Taiz','Zamar'],why:'Hubaish, İbb Valiliği sınırları içindedir.'},
      {q:'İdari merkez olarak hangi yer belirtilir?',a:['Yarim','Dhulmah','Jiblah'],why:'Mevcut idari listede merkez Dhulmah olarak belirtilir.'},
      {q:'2004 nüfus sayımında kaç kişi kaydedildi?',a:['105.998','85.300','228.000'],why:'Ulusal Bilgi Merkezi 105.998 kişi kaydeder.'},
      {q:'OCHA/yerel yönetişim tablosundaki yüzölçümü nedir?',a:['330 km²','228 km²','480 km²'],why:'Tabloda 228 km² bilgisi yer alır.'},
      {q:'Bu rehberde hangi kale öne çıkarılır?',a:['Sahban Kalesi','Kahire Kalesi','Hab Kalesi'],why:'Rehber Sahban Kalesi’ni öne çıkarır.'}
    ],
    FR: [
      {q:'Dans quel gouvernorat se trouve Hubaish ?',a:['Ibb','Taëz','Dhamar'],why:'Hubaish fait partie du gouvernorat d’Ibb.'},
      {q:'Quel lieu est indiqué comme centre administratif ?',a:['Yarim','Dhulmah','Jiblah'],why:'La liste administrative disponible indique Dhulmah.'},
      {q:'Quelle population a été recensée en 2004 ?',a:['105 998','85 300','228 000'],why:'Le Centre national d’information indique 105 998 habitants.'},
      {q:'Quelle superficie figure dans le tableau OCHA/gouvernance locale ?',a:['330 km²','228 km²','480 km²'],why:'Le tableau indique 228 km².'},
      {q:'Quel fort est mis en avant dans ce guide ?',a:['Fort de Sahban','Fort du Caire','Fort Hab'],why:'Le guide met en avant le fort de Sahban.'}
    ]
  };
  const QUIZ = window.HubaishCatalog?.quiz || [];
  const UI_TEXT = {
    AR: {'.terrain-strip strong':'جبال إب الغربية','.terrain-strip small':'إحداثيات تقريبية 14°07′N · 44°05′E','.terrain-strip b':'1,550–2,450 م','.section-heading-inline .section-title':'استكشف حبيش في لحظات','.pulse-bar strong':'نبض حبيش الاستكشافي','.pulse-bar small':'اختر وجهتك التالية','#prayerTitle':'مواقيت الصلاة في حبيش','.fact-card .tag':'هل تعلم عن حبيش؟','.fact-card .text-action':'معلومة أخرى ↻','.spotlight-card .tag':'معلم مختار اليوم','#view-history .section-title':'تاريخ مديرية حبيش','#view-places .section-title':'المعالم','#view-uzal .section-title':'عزل مديرية حبيش (22 عزلة)','#view-more .section-title':'المزيد','#histSearchInput':'ابحث في المحطات التاريخية...','#placeSearchInput':'ابحث عن حصن أو جبل أو وادٍ...','#uzalSearchInput':'ابحث باسم العزلة...','#newPlaceTitle':'اسم المعلم','#newPlaceLoc':'العزلة / الموقع','#newPlaceDesc':'وصف المعلم','#newHistoryTitle':'عنوان الحدث','#newHistoryPeriod':'الفترة','#newHistoryBody':'التفاصيل والمصدر','#newSocialName':'اسم المنصة','#newSocialUrl':'https://example.com','#contribTitle':'عنوان المساهمة','#contribBody':'اكتب التفاصيل والمصدر إن وجد','#contribName':'اسمك (اختياري)','#contribSource':'رابط أو مرجع يدعم المعلومة (اختياري)'},
    EN: {'.terrain-strip strong':'Western Ibb Highlands','.terrain-strip small':'Approximate coordinates 14°07′N · 44°05′E','.terrain-strip b':'1,550–2,450 m','.section-heading-inline .section-title':'Explore Hubaish in moments','.pulse-bar strong':'Hubaish exploration pulse','.pulse-bar small':'Choose your next destination','#prayerTitle':'Prayer times in Hubaish','.fact-card .tag':'Did you know?','.fact-card .text-action':'Another fact ↻','.spotlight-card .tag':'Featured landmark today','#view-history .section-title':'History of Hubaish District','#view-places .section-title':'Landmarks','#view-uzal .section-title':'Hubaish sub-districts (22)','#view-more .section-title':'More','#histSearchInput':'Search historical events…','#placeSearchInput':'Search forts, mountains or valleys…','#uzalSearchInput':'Search sub-districts…','#newPlaceTitle':'Landmark name','#newPlaceLoc':'Sub-district / location','#newPlaceDesc':'Description','#newHistoryTitle':'Event title','#newHistoryPeriod':'Period','#newHistoryBody':'Details and source','#newSocialName':'Platform name','#newSocialUrl':'https://example.com','#contribTitle':'Contribution title','#contribBody':'Write details and source if available','#contribName':'Your name (optional)','#contribSource':'Source link or reference (optional)'},
    TR: {'.terrain-strip strong':'Batı İbb Dağları','.terrain-strip small':'Yaklaşık koordinatlar 14°07′K · 44°05′D','.terrain-strip b':'1.550–2.450 m','.section-heading-inline .section-title':'Hubaish’i keşfedin','.pulse-bar strong':'Hubaish keşif akışı','.pulse-bar small':'Sonraki durağınızı seçin','#prayerTitle':'Hubaish namaz vakitleri','.fact-card .tag':'Biliyor muydunuz?','.fact-card .text-action':'Başka bir bilgi ↻','.spotlight-card .tag':'Günün öne çıkan yeri','#view-history .section-title':'Hubaish İlçesi tarihi','#view-places .section-title':'Tarihî yerler','#view-uzal .section-title':'Hubaish bucakları (22)','#view-more .section-title':'Daha fazla','#histSearchInput':'Tarihî olayları ara…','#placeSearchInput':'Kale, dağ veya vadi ara…','#uzalSearchInput':'Bucakları ara…','#newPlaceTitle':'Yer adı','#newPlaceLoc':'Bucak / konum','#newPlaceDesc':'Açıklama','#newHistoryTitle':'Olay başlığı','#newHistoryPeriod':'Dönem','#newHistoryBody':'Ayrıntılar ve kaynak','#newSocialName':'Platform adı','#newSocialUrl':'https://example.com','#contribTitle':'Katkı başlığı','#contribBody':'Ayrıntıları ve varsa kaynağı yazın','#contribName':'Adınız (isteğe bağlı)','#contribSource':'Kaynak bağlantısı veya referans'},
    FR: {'.terrain-strip strong':'Montagnes de l’ouest d’Ibb','.terrain-strip small':'Coordonnées approximatives 14°07′N · 44°05′E','.terrain-strip b':'1 550–2 450 m','.section-heading-inline .section-title':'Découvrez Hubaish','.pulse-bar strong':'Explorer Hubaish','.pulse-bar small':'Choisissez votre prochaine étape','#prayerTitle':'Horaires de prière à Hubaish','.fact-card .tag':'Le saviez-vous ?','.fact-card .text-action':'Autre fait ↻','.spotlight-card .tag':'Monument du jour','#view-history .section-title':'Histoire du district de Hubaish','#view-places .section-title':'Monuments','#view-uzal .section-title':'Sous-districts de Hubaish (22)','#view-more .section-title':'Plus','#histSearchInput':'Rechercher dans l’histoire…','#placeSearchInput':'Rechercher un fort, une montagne ou une vallée…','#uzalSearchInput':'Rechercher les sous-districts…','#newPlaceTitle':'Nom du monument','#newPlaceLoc':'Sous-district / lieu','#newPlaceDesc':'Description','#newHistoryTitle':'Titre de l’événement','#newHistoryPeriod':'Période','#newHistoryBody':'Détails et source','#newSocialName':'Nom de la plateforme','#newSocialUrl':'https://example.com','#contribTitle':'Titre de la contribution','#contribBody':'Écrivez les détails et la source si disponible','#contribName':'Votre nom (facultatif)','#contribSource':'Lien ou référence source (facultatif)'}
  };
  const D = {
    AR: { greetingMorning:'صباح الخير', greetingEvening:'مساء الخير', stories:['الحصون','العزل','المحطات','المجتمع'], question:'السؤال', start:'ابدأ', next:'التالي', score:'نتيجتك', finish:'انتهى الاختبار', noResult:'لم أعثر على نتيجة مطابقة. جرّب كلمة أخرى أو اسأل المساعد.', ask:'هل تريد أن تسأل المساعد عن هذا الموضوع؟', saved:'تم حفظ التغييرات على هذا الجهاز', pending:'بانتظار المراجعة', approved:'تمت المراجعة', rejected:'مرفوضة', save:'حفظ', edit:'تعديل', delete:'حذف', empty:'لا توجد بيانات هنا بعد.', local:'تحرير محلي على هذا الجهاز فقط', notVerified:'رواية تحتاج إلى توثيق', memberCount:'مجموعة عامة • +11,068 عضو', noVillages:'لا تتوفر حالياً قائمة قرى معتمدة لهذه العزلة في قاعدة البيانات.' },
    EN: { greetingMorning:'Good morning', greetingEvening:'Good evening', stories:['Forts','Sub-districts','Timeline','Community'], question:'Question', start:'Start', next:'Next', score:'Your score', finish:'Quiz complete', noResult:'No matching result. Try another term or ask the assistant.', ask:'Would you like to ask the assistant about this?', saved:'Changes saved on this device', pending:'Pending review', approved:'Reviewed', rejected:'Rejected', save:'Save', edit:'Edit', delete:'Delete', empty:'No data has been added here yet.', local:'Local editing on this device only', notVerified:'Unverified local account', memberCount:'Public group • 11,068+ members', noVillages:'No verified village list is available for this sub-district yet.' },
    TR: { greetingMorning:'Günaydın', greetingEvening:'İyi akşamlar', stories:['Kaleler','Bucaklar','Zaman çizelgesi','Topluluk'], question:'Soru', start:'Başla', next:'Sonraki', score:'Puanınız', finish:'Test tamamlandı', noResult:'Eşleşen sonuç bulunamadı. Başka bir kelime deneyin veya asistana sorun.', ask:'Bu konu hakkında asistana sormak ister misiniz?', saved:'Değişiklikler bu cihaza kaydedildi', pending:'İnceleme bekliyor', approved:'İncelendi', rejected:'Reddedildi', save:'Kaydet', edit:'Düzenle', delete:'Sil', empty:'Henüz veri eklenmedi.', local:'Yalnızca bu cihazda yerel düzenleme', notVerified:'Doğrulanmamış yerel anlatı', memberCount:'Herkese açık grup • 11.068+ üye', noVillages:'Bu bucak için henüz doğrulanmış köy listesi yok.' },
    FR: { greetingMorning:'Bonjour', greetingEvening:'Bonsoir', stories:['Forteresses','Sous-districts','Chronologie','Communauté'], question:'Question', start:'Commencer', next:'Suivant', score:'Votre score', finish:'Quiz terminé', noResult:'Aucun résultat correspondant. Essayez un autre terme ou demandez à l’assistant.', ask:'Voulez-vous demander à l’assistant ?', saved:'Modifications enregistrées sur cet appareil', pending:'En attente de vérification', approved:'Vérifié', rejected:'Rejeté', save:'Enregistrer', edit:'Modifier', delete:'Supprimer', empty:'Aucune donnée ajoutée pour le moment.', local:'Modification locale sur cet appareil uniquement', notVerified:'Récit local non vérifié', memberCount:'Groupe public • 11 068+ membres', noVillages:'Aucune liste de villages vérifiée n’est disponible.' }
  };
  let featureState = loadFeatureState();
  let factIndex = 0;
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let seasonIndex = -1;
  let adminUnlocked = false;
  let adminFailedAttempts = 0;
  let adminLockoutUntil = 0;
  const ADMIN_PIN_KEY = 'hubaish_admin_pin_v1';
  const SEASONS = {
    AR: [
      {title:'قطاف البن في المرتفعات',body:'تُظهر بيانات سلسلة قيمة البن في اليمن أن الحصاد في منطقة إب قد يمتد في أكتوبر–ديسمبر، مع موسم آخر في يناير–فبراير. تتقدم بعض المواقع المنخفضة في النضج عن المرتفعات، لذلك تختلف المواعيد بين القرى.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'إزهار أشجار البن',body:'يشير تقويم البن لمنطقة إب إلى تركز الإزهار في مارس–أبريل. يتأثر الإزهار بالأمطار وارتفاع الموقع والعناية بالأشجار، ولا يمثل موعداً ثابتاً لكل مزارع حبيش.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'موسم الأمطار في المرتفعات',body:'تسجل تقاويم الزراعة للمناطق الجبلية في اليمن فترتي أمطار رئيسيتين تقريباً، الأولى في الربيع والثانية خلال الصيف والخريف. راقب السيول واحمِ مدرجات الحقول وممرات المياه.',source:'FEWS NET — Yemen seasonal calendar for highlands (2025/2026)'},
      {title:'الزراعة بعد انحسار الأمطار',body:'تختلف مواعيد تجهيز الأرض وزراعة الحبوب بحسب القرية ومصدر المياه وارتفاع الحقول. يُستخدم هذا الدليل للتذكير الموسمي فقط، ويُقدّم قرار الزراعة وفق خبرة المزارعين ونشرة الطقس المحلية.',source:'دليل إقليمي استرشادي — يلزم تأكيد محلي'}
    ],
    EN: [
      {title:'Coffee harvest in the highlands',body:'FAO’s Yemen coffee value-chain calendar indicates harvest periods in Ibb around October–December and again in January–February. Lower sites can ripen earlier than higher slopes, so village dates differ.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'Coffee flowering season',body:'The Ibb coffee calendar places flowering mainly in March–April. Rainfall, altitude and farm care shift the timing; it is not a fixed date for every Hubaish farm.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'Rain seasons in the highlands',body:'Agricultural calendars for Yemen’s highlands show two broad rainy periods, around spring and again through summer into autumn. Watch runoff and keep terrace drains clear.',source:'FEWS NET — Yemen seasonal calendar for highlands (2025/2026)'},
      {title:'Field work after the rains',body:'Planting and soil preparation vary by village, water access and field elevation. Use this as a regional guide and follow local farmers and current weather information.',source:'Regional guide — local confirmation required'}
    ],
    TR: [
      {title:'Yüksek kesimlerde kahve hasadı',body:'FAO Yemen kahve takviminde İbb için hasat dönemleri yaklaşık Ekim–Aralık ve Ocak–Şubat olarak verilir. Rakım ve sıcaklık olgunlaşma tarihini köyden köye değiştirir.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'Kahve çiçeklenme dönemi',body:'İbb kahve takvimi çiçeklenmenin ağırlıkla Mart–Nisan döneminde olduğunu gösterir. Yağış, rakım ve bakım zamanı etkiler; her Hubaish çiftliği için aynı tarih değildir.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'Dağlık bölgelerde yağış',body:'Yemen yaylalarının tarım takvimlerinde ilkbahar ve yaz sonu–sonbahar dönemlerinde iki geniş yağış dönemi görülür. Teras kanallarını açık tutun ve ani sel riskini izleyin.',source:'FEWS NET — Yemen seasonal calendar for highlands (2025/2026)'},
      {title:'Yağış sonrası tarla çalışması',body:'Ekim ve toprak hazırlığı köye, suya erişime ve tarla rakımına göre değişir. Bu metin bölgesel bir rehberdir; yerel çiftçilerin bilgisini ve güncel hava durumunu esas alın.',source:'Bölgesel rehber — yerel doğrulama gerekli'}
    ],
    FR: [
      {title:'Récolte du café en altitude',body:'Le calendrier de la FAO pour Ibb indique des périodes de récolte vers octobre–décembre puis janvier–février. L’altitude décale la maturation entre les villages.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'Floraison du caféier',body:'Le calendrier du café pour Ibb situe principalement la floraison en mars–avril. Les pluies, l’altitude et l’entretien modifient les dates d’une exploitation à l’autre.',source:'FAO Yemen — Coffee Value Chain in Yemen (2025)'},
      {title:'Saisons des pluies en montagne',body:'Les calendriers agricoles des hauts plateaux du Yémen montrent deux périodes pluvieuses générales, au printemps puis de l’été à l’automne. Surveillez le ruissellement et les drains des terrasses.',source:'FEWS NET — Yemen seasonal calendar for highlands (2025/2026)'},
      {title:'Travaux agricoles après les pluies',body:'Les semis et la préparation du sol varient selon le village, l’accès à l’eau et l’altitude. Ce guide est indicatif; suivez les agriculteurs et les informations météo locales.',source:'Guide régional — confirmation locale nécessaire'}
    ]
  };


  function t(key) { const lang = (typeof state !== 'undefined' && state.lang) || 'AR'; return (D[lang] || D.AR)[key] || D.AR[key] || key; }
  function toBase64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
  function fromBase64(value) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
  async function hashAdminPin(pin, salt) {
    if (!globalThis.crypto?.subtle) throw new Error('secure crypto unavailable');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'}, material, 256));
  }
  async function getAdminPinRecord() {
    let record;
    try { record = JSON.parse(localStorage.getItem(ADMIN_PIN_KEY) || 'null'); } catch {}
    if (record?.version === 1 && record.salt && record.hash && record.iterations === 210000) return record;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashAdminPin('1234', salt);
    record = {version:1, salt:toBase64(salt), hash:toBase64(hash), iterations:210000};
    localStorage.setItem(ADMIN_PIN_KEY, JSON.stringify(record));
    return record;
  }
  async function verifyAdminPin(pin) {
    if (Date.now() < adminLockoutUntil) return false;
    const record = await getAdminPinRecord();
    const actual = await hashAdminPin(pin, fromBase64(record.salt));
    const expected = fromBase64(record.hash);
    return actual.length === expected.length && actual.every((byte,index)=>byte===expected[index]);
  }
  async function storeAdminPin(pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashAdminPin(pin, salt);
    localStorage.setItem(ADMIN_PIN_KEY, JSON.stringify({version:1,salt:toBase64(salt),hash:toBase64(hash),iterations:210000}));
  }
  function localizeAdminControls() {
    const lang=state.lang||'AR';
    const labels={
      AR:{open:'فتح أدوات التحرير',close:'إغلاق أدوات التحرير',prompt:'أدخل رمز الإشراف',placeholder:'رمز المرور',unlock:'فتح اللوحة',lock:'قفل اللوحة',change:'تغيير رمز المرور',current:'الرمز الحالي',next:'الرمز الجديد (4 إلى 12 رقماً)',confirm:'تأكيد الرمز الجديد',save:'حفظ الرمز الجديد'},
      EN:{open:'Unlock editor',close:'Close editor',prompt:'Enter admin PIN',placeholder:'PIN',unlock:'Unlock panel',lock:'Lock panel',change:'Change PIN',current:'Current PIN',next:'New PIN (4–12 digits)',confirm:'Confirm new PIN',save:'Save new PIN'},
      TR:{open:'Düzenleyiciyi aç',close:'Düzenleyiciyi kapat',prompt:'Yönetici PIN kodunu girin',placeholder:'PIN',unlock:'Paneli aç',lock:'Paneli kilitle',change:'PIN kodunu değiştir',current:'Mevcut PIN',next:'Yeni PIN (4–12 rakam)',confirm:'Yeni PIN doğrula',save:'Yeni PIN kaydet'},
      FR:{open:'Ouvrir l’éditeur',close:'Fermer l’éditeur',prompt:'Saisir le code administrateur',placeholder:'Code PIN',unlock:'Ouvrir le panneau',lock:'Verrouiller le panneau',change:'Modifier le code PIN',current:'Code actuel',next:'Nouveau code (4 à 12 chiffres)',confirm:'Confirmer le nouveau code',save:'Enregistrer le code'}
    }[lang]||{};
    const toggle=document.getElementById('adminPanelToggle');if(toggle)toggle.textContent=adminUnlocked?labels.close:labels.open;
    const prompt=document.getElementById('adminPinPrompt');if(prompt)prompt.textContent=labels.prompt;
    const entry=document.getElementById('adminPinEntry');if(entry)entry.placeholder=labels.placeholder;
    const unlock=document.getElementById('adminUnlockBtn');if(unlock)unlock.textContent=labels.unlock;
    const lock=document.getElementById('adminLockBtn');if(lock)lock.textContent=labels.lock;
    const form=document.getElementById('adminPinChangeForm');
    const heading=form?.querySelector('h4');if(heading)heading.textContent=labels.change;
    const current=document.getElementById('adminCurrentPin');if(current)current.placeholder=labels.current;
    const next=document.getElementById('adminNewPin');if(next)next.placeholder=labels.next;
    const confirm=document.getElementById('adminConfirmPin');if(confirm)confirm.placeholder=labels.confirm;
    const save=form?.querySelector('button[type=submit]');if(save)save.textContent=labels.save;
    const heritage=document.getElementById('heritageWisdomLabel');if(heritage)heritage.textContent=({AR:'من تراث وحكمة حبيش',EN:'Hubaish heritage and wisdom',TR:'Hubaish mirası ve bilgeliği',FR:'Patrimoine et savoirs de Hubaish'})[lang];
    const factButton=document.getElementById('nextFactBtn');if(factButton)factButton.textContent=({AR:'معلومة أخرى',EN:'Another insight',TR:'Başka bir bilgi',FR:'Autre information'})[lang];
    const fact=document.getElementById('didYouKnow');if(fact)fact.textContent=(FACTS_I18N[lang]||FACTS)[factIndex];
  }
  function closeAdminPanel() {
    adminUnlocked = false;
    document.getElementById('adminPanel')?.classList.add('hidden');
    document.getElementById('adminAuthGate')?.classList.add('hidden');
    const toggle = document.getElementById('adminPanelToggle');
    localizeAdminControls();
    const pin = document.getElementById('adminPinEntry');
    if (pin) pin.value = '';
  }
  async function unlockAdmin(event) {
    event.preventDefault();
    const input = document.getElementById('adminPinEntry');
    const pin = clean(input?.value,12);
    if (!/^\d{4,12}$/.test(pin)) { showToast('استخدم من 4 إلى 12 رقماً.'); return; }
    if (Date.now() < adminLockoutUntil) { showToast('تم إيقاف المحاولة مؤقتاً. أعد المحاولة بعد قليل.'); return; }
    try {
      if (!await verifyAdminPin(pin)) {
        adminFailedAttempts++;
        if (adminFailedAttempts >= 5) { adminLockoutUntil = Date.now()+30000; adminFailedAttempts=0; }
        showToast('رمز المرور غير صحيح.'); input.value=''; input.focus(); return;
      }
      adminFailedAttempts=0; adminUnlocked=true;
      document.getElementById('adminAuthGate')?.classList.add('hidden');
      document.getElementById('adminPanel')?.classList.remove('hidden');
      localizeAdminControls();
      input.value=''; showToast('تم فتح لوحة التحرير على هذا الجهاز.');
    } catch { showToast('تعذر التحقق الآمن من الرمز في هذا المتصفح.'); }
  }
  async function changeAdminPin(event) {
    event.preventDefault(); if (!adminUnlocked) return;
    const current=clean(document.getElementById('adminCurrentPin')?.value,12);
    const next=clean(document.getElementById('adminNewPin')?.value,12);
    const confirmPin=clean(document.getElementById('adminConfirmPin')?.value,12);
    if (!/^\d{4,12}$/.test(next) || next!==confirmPin) { showToast('الرمز الجديد يجب أن يتكون من 4 إلى 12 رقماً وأن يتطابق مع التأكيد.'); return; }
    try { if (!await verifyAdminPin(current)) { showToast('الرمز الحالي غير صحيح.'); return; } await storeAdminPin(next); document.getElementById('adminPinChangeForm')?.reset(); showToast('تم تحديث رمز المرور المشتق والمملح.'); }
    catch { showToast('تعذر حفظ رمز المرور.'); }
  }
  function initAdminLock() {
    const toggle=document.getElementById('adminPanelToggle');
    const gate=document.getElementById('adminAuthGate');
    toggle?.addEventListener('click',async()=>{
      if(adminUnlocked){closeAdminPanel();return;}
      gate?.classList.remove('hidden'); document.getElementById('adminPanel')?.classList.add('hidden');
      document.getElementById('adminPinEntry')?.focus();
      try { await getAdminPinRecord(); } catch { showToast('الحماية تتطلب متصفحاً يدعم Web Crypto عبر HTTPS.'); }
    });
    gate?.addEventListener('submit',unlockAdmin);
    document.getElementById('adminLockBtn')?.addEventListener('click',()=>{closeAdminPanel();showToast('تم قفل لوحة التحرير.');});
    document.getElementById('adminPinChangeForm')?.addEventListener('submit',changeAdminPin);
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&adminUnlocked)closeAdminPanel();});
    closeAdminPanel();
    localizeAdminControls();
  }
  function renderExplorerProgress() {
    const total=Math.max(1,(state.places?.length||0)+(state.history?.length||0)+22);
    const done=Math.min(total,featureState.visitedPlaces.length+featureState.visitedUzal.length);
    const percent=Math.round(done/total*100);
    const meter=document.getElementById('explorerProgressMeter'); const value=document.getElementById('explorerProgressText'); const meta=document.getElementById('explorerProgressMeta');
    if(meter)meter.value=percent; if(value)value.textContent=percent+'%';
    if(meta)meta.textContent=state.lang==='EN' ? done+' of '+total+' landmarks, history stops and sub-districts explored on this device.' : state.lang==='TR' ? total+' yer ve bucaktan '+done+' tanesi bu cihazda keşfedildi.' : state.lang==='FR' ? done+' éléments explorés sur '+total+' monuments, étapes et sous-districts sur cet appareil.' : 'استكشفت '+done+' من أصل '+total+' بين المعالم والمحطات التاريخية والعزل على هذا الجهاز.';
  }
  function markExplored(itemId, kind) {
    if(!itemId)return; const key=String(itemId); const list=kind==='uzal'?featureState.visitedUzal:featureState.visitedPlaces;
    if(list.includes(key))return; list.push(key);
    if(kind==='uzal')featureState.visitedUzal=list.slice(-60); else featureState.visitedPlaces=list.slice(-300);
    saveFeatureState(); renderExplorerProgress();
  }
  function renderSeasonGuide() {
    const lang=state.lang||'AR'; const month=new Date().getMonth();
    const monthIndex=(month<=1||month>=9)?0:month<=3?1:month<=8?2:3;
    if(seasonIndex<0)seasonIndex=monthIndex; const data=SEASONS[lang]||SEASONS.AR; const item=data[seasonIndex%data.length];
    const title=document.getElementById('seasonTitle'); const body=document.getElementById('seasonCopy'); const source=document.getElementById('seasonSource'); const label=document.getElementById('seasonLabel'); const next=document.getElementById('nextSeasonBtn');
    if(title)title.textContent=item.title; if(body)body.textContent=item.body; if(source)source.textContent=item.source;
    if(label)label.textContent=({AR:'دليل المواسم الزراعية والمناخ الجبلي',EN:'Mountain farming and seasons',TR:'Dağ tarımı ve mevsimler',FR:'Agriculture de montagne et saisons'})[lang];
    if(next)next.textContent=({AR:'موسم آخر',EN:'Another season',TR:'Başka mevsim',FR:'Autre saison'})[lang];
  }

  function clean(value, max = 1500) { return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max); }
  function id(prefix) { return `${prefix}-${globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = String(text); return el; }
  function button(text, action, value, cls = 'btn-sm') { const el = node('button', cls, text); el.type = 'button'; el.dataset.featureAction = action; if (value !== undefined) el.dataset.featureValue = value; return el; }
  function loadFeatureState() {
    const baseUzal = typeof UZAL_22 !== 'undefined' ? UZAL_22.slice() : [];
    const defaults = { contributions: [], quizRuns: 0, lastSavedAt: null, socialHidden: [], people: [], uzal: baseUzal, visitedPlaces: [], visitedUzal: [], communityUrl: FACEBOOK_URL, schemaVersion: 4 };
    try {
      const raw = JSON.parse(localStorage.getItem(FEATURE_KEY) || 'null');
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
      const savedUzal = Array.isArray(raw.uzal) ? raw.uzal.map(x => clean(x, 70)).filter(Boolean).slice(0, 60) : [];
      const mergedUzal = [...baseUzal, ...savedUzal.filter(name => !baseUzal.includes(name))].slice(0, 60);
      return {
        ...defaults,
        ...raw,
        contributions: Array.isArray(raw.contributions) ? raw.contributions.slice(0, 200) : [],
        quizRuns: Number.isFinite(raw.quizRuns) ? raw.quizRuns : 0,
        socialHidden: Array.isArray(raw.socialHidden) ? raw.socialHidden.filter(x => typeof x === 'string') : [],
        people: Array.isArray(raw.people) ? raw.people.slice(0, 100) : [],
        uzal: mergedUzal,
        visitedPlaces: Array.isArray(raw.visitedPlaces) ? [...new Set(raw.visitedPlaces.filter(x => typeof x === 'string'))].slice(0, 300) : [],
        visitedUzal: Array.isArray(raw.visitedUzal) ? [...new Set(raw.visitedUzal.filter(x => typeof x === 'string'))].slice(0, 60) : [],
        communityUrl: validHttpUrl(raw.communityUrl) ? raw.communityUrl : FACEBOOK_URL,
        schemaVersion: 4
      };
    } catch {
      return defaults;
    }
  }
  function touchSaved() { saveFeatureState(); }
  function saveFeatureState() {
    featureState.lastSavedAt = new Date().toISOString();
    try { localStorage.setItem(FEATURE_KEY, JSON.stringify(featureState)); } catch { showToast('تعذر حفظ البيانات المحلية.'); }
    const label = document.getElementById('lastSavedAt');
    if (label) label.textContent = `آخر حفظ: ${new Date(featureState.lastSavedAt).toLocaleString(document.documentElement.lang || 'ar')}`;
  }
  function updateSavedAt() {
    const label = document.getElementById('lastSavedAt');
    if (label) label.textContent = featureState.lastSavedAt ? `آخر حفظ: ${new Date(featureState.lastSavedAt).toLocaleString(document.documentElement.lang || 'ar')}` : 'لم يُسجل وقت الحفظ بعد';
  }
  function localizeDynamicLabels() {
    const lang = state.lang || 'AR';
    const words = {
      AR: { save: 'حفظ', saved: 'محفوظ', ask: 'اسأل المساعد', details: 'التفاصيل', empty: 'لا توجد نتائج مطابقة.' },
      EN: { save: 'Save', saved: 'Saved', ask: 'Ask assistant', details: 'Details', empty: 'No matching results.' },
      TR: { save: 'Kaydet', saved: 'Kaydedildi', ask: 'Asistana sor', details: 'Ayrıntılar', empty: 'Eşleşen sonuç bulunamadı.' },
      FR: { save: 'Enregistrer', saved: 'Enregistré', ask: 'Demander à l’assistant', details: 'Détails', empty: 'Aucun résultat correspondant.' }
    }[lang];
    document.querySelectorAll('.card-actions button').forEach(btn => {
      const text = btn.textContent.trim();
      let label = text;
      if (/محفوظ|Saved|Kaydedildi|Enregistré/.test(text)) label = words.saved;
      else if (/حفظ|^Save$|^Kaydet$|^Enregistrer$/.test(text)) label = words.save;
      else if (/اسأل المساعد|Ask assistant|Asistana sor|Demander à l’assistant/.test(text)) label = words.ask;
      else if (/^التفاصيل$|^Details$|^Ayrıntılar$|^Détails$/.test(text)) label = words.details;
      if (btn.textContent !== label) btn.textContent = label;
    });
    document.querySelectorAll('.empty-state').forEach(el => {
      if (/لا توجد نتائج مطابقة|No matching results|Eşleşen sonuç bulunamadı|Aucun résultat correspondant/.test(el.textContent) && el.textContent !== words.empty) el.textContent = words.empty;
    });
  }
  function applyExtendedLang() {
    const lang = state.lang || 'AR';
    document.querySelectorAll('[data-i18n-extra]').forEach(el => { const key = el.dataset.i18nExtra; if (D[lang]?.[key]) el.textContent = D[lang][key]; });
    const select = document.getElementById('langSelect'); if (select && select.value !== lang) select.value = lang;
    const translations=UI_TEXT[lang]||{};Object.entries(translations).forEach(([selector,value])=>{document.querySelectorAll(selector).forEach(el=>{if(el.matches('input,textarea'))el.placeholder=value;else el.textContent=value;});});
    const greeting = document.getElementById('greetingChip');
    if (greeting) { const hour = Number(new Intl.DateTimeFormat('en', { hour:'2-digit', hourCycle:'h23', timeZone:'Asia/Aden' }).format(new Date())); greeting.textContent = hour >= 5 && hour < 12 ? t('greetingMorning') : t('greetingEvening'); }
    window.HubaishCatalog?.applyUi?.();
  }
  function renderStories() {
    const box=document.getElementById('visualStories'); if(!box)return;
    const lang=state.lang||'AR'; const labels=(D[lang]||D.AR).stories;
    const titles={AR:['حصن صهبان','العزل الـ22','محطات التاريخ','مجتمع حبيش'],EN:['Sahban Fort','22 Sub-districts','History timeline','Hubaish community'],TR:['Sahban Kalesi','22 Bucak','Tarih çizelgesi','Hubaish topluluğu'],FR:['Fort de Sahban','22 sous-districts','Chronologie','Communauté de Hubaish']}[lang]||['حصن صهبان','العزل الـ22','محطات التاريخ','مجتمع حبيش'];
    const data=[['fort',titles[0],labels[0],'places'],['mountain',titles[1],labels[1],'uzal'],['scroll',titles[2],labels[2],'history'],['compass',titles[3],labels[3],'more']];
    box.replaceChildren();
    data.forEach(([icon,title,sub,tab])=>{
      const card=node('button','story-card');card.type='button';card.dataset.storyTab=tab;
      const artwork=window.HubaishIcon?.(icon,'story-heritage-icon');
      if(artwork)card.append(artwork);
      card.append(node('strong','',title),node('small','',sub));box.append(card);
    });
  }
  function currentQuiz(){return window.HubaishCatalog?.quizItem?.(quizIndex,state.lang)||QUIZ[quizIndex];}
  function renderQuiz() {
    const box=document.getElementById('quizArea');if(!box)return;box.replaceChildren();
    const lang=state.lang||'AR';const ui=window.HubaishCatalog?.ui?.[lang]||window.HubaishCatalog?.ui?.AR;
    const progress=node('progress','quiz-progress');progress.max=QUIZ.length;progress.value=Math.min(quizIndex,QUIZ.length);box.append(progress);
    if(quizIndex>=QUIZ.length){
      const perfect=quizScore===QUIZ.length;box.append(node('p','quiz-question',ui.score+': '+quizScore+'/'+QUIZ.length));
      box.append(node('div',perfect?'quiz-badge earned':'quiz-badge',perfect?ui.badge:'Hubaish Explorer'));
      box.append(button(ui.share,'quiz-share',String(quizScore),'btn-primary'),button(ui.restart,'quiz-restart',undefined,'btn-sm'));return;
    }
    const q=currentQuiz();box.append(node('div','item-meta',ui.question+' '+(quizIndex+1)+'/'+QUIZ.length),node('p','quiz-question',q.q));
    const opts=node('div','quiz-options');q.a.forEach((answer,i)=>{const btn=button(answer,'quiz-answer',String(i),'quiz-option');if(quizAnswered&&i===q.correct)btn.classList.add('correct');opts.append(btn)});box.append(opts);
    if(quizAnswered)box.append(node('p','quiz-feedback',q.why),button(quizIndex===QUIZ.length-1?ui.score:ui.next,'quiz-next',undefined,'btn-primary'));
  }
  function resetQuiz() { quizIndex=0; quizScore=0; quizAnswered=false; renderQuiz(); }
  function handleQuizAction(action, value) {
    if(action==='quiz-share'){
      const lang=state.lang||'AR',score=String(value||quizScore);
      const message=lang==='AR'?'نتيجتي في تحدي معلومات حبيش: '+score+'/'+QUIZ.length:lang==='TR'?'Hubaish bilgi testindeki sonucum: '+score+'/'+QUIZ.length:lang==='FR'?'Mon résultat au quiz Hubaish : '+score+'/'+QUIZ.length:'My Hubaish quiz score: '+score+'/'+QUIZ.length;
      if(navigator.share)navigator.share({title:'Hubaish District Quiz',text:message}).catch(()=>{});
      else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(message).then(()=>showToast('تم نسخ النتيجة.')).catch(()=>showToast(message));else showToast(message);return;
    }
    if (action==='detail-favorite'){toggleFavorite(value);return;}
    if (action==='detail-ask'){openModal('aiModal');document.getElementById('aiInput').value=value;sendAiMessage();return;}
    if (action==='quiz-restart') { resetQuiz(); return; }
    if (action==='quiz-answer' && !quizAnswered) { const answer=Number(value); quizAnswered=true; const correct=currentQuiz().correct; if (answer===correct) quizScore++; renderQuiz(); const options=document.querySelectorAll('#quizArea .quiz-option'); options.forEach((el,i)=>{el.disabled=true;if(i===answer&&i!==correct)el.classList.add('wrong');}); return; }
    if (action==='quiz-next' && quizAnswered) { quizIndex++; quizAnswered=false; if(quizIndex>=QUIZ.length){featureState.quizRuns++;saveFeatureState();} renderQuiz(); }
  }
  function renderUzalDetails() { /* District profiles are rendered by the multilingual catalogue. */ }
  function renderCommunitySocials() {
    const base = document.getElementById('socialLinksList'); if (!base) return;
    [...base.children].forEach(el=>{ const name=el.textContent.replace(/^↗\s*/, '').trim(); el.hidden=featureState.socialHidden.includes(name); el.dataset.extended='1'; });
    const join=document.getElementById('communityJoinLink'); if(join) join.href=featureState.communityUrl;
  }
  function renderAdminLists() {
    const social = document.getElementById('socialAdminList');
    if (social) { social.replaceChildren(); (state.socials||[]).forEach((item,index)=>{ const row=node('div','admin-list-row'); row.append(node('span','',item.name)); const actions=node('div','admin-list-actions'); actions.append(button(featureState.socialHidden.includes(item.name)?'إظهار':'إخفاء','social-hide',String(index)),button('تعديل','social-edit',String(index)),button('حذف','social-delete',String(index),'btn-sm mini-danger')); row.append(actions); social.append(row); }); }
    const uzalAdmin = document.getElementById('uzalAdminList');
    if(uzalAdmin){uzalAdmin.replaceChildren();(featureState.uzal||[]).forEach((name,index)=>{const row=node('div','admin-list-row');row.append(node('span','',`${index+1}. ${name}`));const actions=node('div','admin-list-actions');actions.append(button('تعديل','uzal-edit',String(index)),button('حذف','uzal-delete',String(index),'btn-sm mini-danger'));row.append(actions);uzalAdmin.append(row);});}
    const content = document.getElementById('contentAdminList');
    if (content) { content.replaceChildren(); [...state.places.map(x=>({...x,_kind:'place'})),...state.history.map(x=>({...x,_kind:'history'}))].forEach(item=>{ const row=node('div','admin-list-row'); row.append(node('span','',`${item.title} · ${item._kind==='place'?'معلم':'تاريخ'}`)); const actions=node('div','admin-list-actions'); actions.append(button('تعديل','content-edit',`${item._kind}:${item.id}`),button('حذف','content-delete',`${item._kind}:${item.id}`,'btn-sm mini-danger')); row.append(actions); content.append(row); }); if(!content.childElementCount)content.append(node('p','empty-state',t('empty'))); }
    const review = document.getElementById('contributionReviewList');
    if (review) { review.replaceChildren(); const pending=featureState.contributions.filter(x=>x.status==='pending'); if(!pending.length)review.append(node('p','empty-state','لا توجد مساهمات بانتظار المراجعة.')); pending.forEach(item=>{const row=node('article','item-card');row.append(node('div','item-meta',`${item.type} · ${new Date(item.createdAt).toLocaleDateString()}`),node('h4','item-title',item.title),node('p','item-body',item.body),node('small','muted',item.source||'لم يرفق مصدر'));const actions=node('div','card-actions');actions.append(button('اعتماد','contrib-approve',item.id,'btn-primary'),button('رفض','contrib-reject',item.id,'btn-sm mini-danger'));row.append(actions);review.append(row);}); }
  }
  function addHistory() {
    if(!adminUnlocked){showToast('افتح لوحة الإشراف برمز المرور أولاً.');return;}
    const title=clean(document.getElementById('newHistoryTitle')?.value,100),period=clean(document.getElementById('newHistoryPeriod')?.value,70),body=clean(document.getElementById('newHistoryBody')?.value,700),era=document.getElementById('newHistoryEra')?.value;
    if(!title||!body){showToast('أدخل عنوان المحطة وتفاصيلها.');return;}
    const added={id:id('history'),era:era==='modern'?'modern':'ancient',period,title,body};state.history.unshift(added);window.HubaishCatalog?.autoTranslate?.(added);saveState();renderAll();renderAdminLists();['newHistoryTitle','newHistoryPeriod','newHistoryBody'].forEach(k=>document.getElementById(k).value='');showToast('تم حفظ المحطة على هذا الجهاز.');
  }
  function submitContribution(event) {
    event.preventDefault();
    const item={id:id('contrib'),name:clean(document.getElementById('contribName').value,70),type:document.getElementById('contribType').value,title:clean(document.getElementById('contribTitle').value,100),body:clean(document.getElementById('contribBody').value,1600),source:clean(document.getElementById('contribSource').value,350),status:'pending',createdAt:new Date().toISOString()};
    if(!item.title||!item.body){showToast('أدخل عنوان المساهمة والتفاصيل.');return;}
    if(item.source && /^javascript:/i.test(item.source)){showToast('رابط المصدر غير صالح.');return;}
    featureState.contributions.unshift(item);saveFeatureState();renderAdminLists();event.target.reset();showToast('حُفظت المساهمة محلياً بانتظار المراجعة.');
  }
  function handleContribution(idValue, approve) {
    const item=featureState.contributions.find(x=>x.id===idValue);if(!item)return;
    if(approve){
      if(item.type==='place') state.places.unshift({id:id('place'),cat:'fort',title:item.title,loc:'مديرية حبيش',body:item.body});
      else if(item.type==='history') state.history.unshift({id:id('history'),era:'modern',period:'مساهمة زائر',title:item.title,body:`${item.body}${item.source?`\nالمصدر: ${item.source}`:''}`});
      else if(item.type==='person') featureState.people.unshift({title:item.title,body:item.body,source:item.source});
      else if(item.type==='uzal') featureState.uzal.unshift(item.title);
      item.status='approved';item.reviewedAt=new Date().toISOString();
      if(item.type==='place'&&state.places[0])window.HubaishCatalog?.autoTranslate?.(state.places[0]);
      if(item.type==='history'&&state.history[0])window.HubaishCatalog?.autoTranslate?.(state.history[0]);
      if(item.type==='person')window.HubaishCatalog?.autoTranslate?.({id:'person-'+item.id,title:item.title,body:item.body});
      saveState();
    }else{item.status='rejected';item.reviewedAt=new Date().toISOString();}
    saveFeatureState();renderAll();renderAdminLists();renderPeople();showToast(approve?'تم اعتماد المساهمة وإضافتها محلياً.':'تم رفض المساهمة محلياً.');
  }
  function showDetail(itemId) {
    const original=findDirectoryItem(itemId);if(!original)return;
    const item=window.HubaishCatalog?.localizeItem?.(original,state.lang)||original;
    const box=document.getElementById('detailContent');if(!box)return;
    const lang=state.lang||'AR';
    const L={
      AR:{category:'التصنيف',location:'العزلة / الموقع',height:'الارتفاع',status:'حالة التوثيق',importance:'الأهمية',source:'المصدر',documented:'إحالة منشورة',local:'رواية محلية تحتاج تحققاً',unverified:'قيد التحقق',unknown:'غير موثق ميدانياً',share:'مشاركة',ask:'اسأل المساعد',save:'حفظ'},
      EN:{category:'Category',location:'Area / location',height:'Elevation',status:'Evidence',importance:'Importance',source:'Source',documented:'Published reference',local:'Local account — verify',unverified:'To be verified',unknown:'Not field-verified',share:'Share',ask:'Ask assistant',save:'Save'},
      TR:{category:'Kategori',location:'Bölge / konum',height:'Yükseklik',status:'Kaynak durumu',importance:'Önem',source:'Kaynak',documented:'Yayımlanmış kaynak',local:'Yerel anlatı — doğrulanmalı',unverified:'Doğrulanacak',unknown:'Sahada doğrulanmadı',share:'Paylaş',ask:'Asistana sor',save:'Kaydet'},
      FR:{category:'Catégorie',location:'Zone / lieu',height:'Altitude',status:'État des sources',importance:'Importance',source:'Source',documented:'Référence publiée',local:'Récit local — à vérifier',unverified:'À vérifier',unknown:'Non vérifié sur le terrain',share:'Partager',ask:'Demander à l’assistant',save:'Enregistrer'}
    }[lang];
    const cats=({
      AR:{fort:'حصون وقلاع',mountain:'جبال ومرتفعات',valley:'أودية ومياه',mosque:'مساجد'},
      EN:{fort:'Forts and castles',mountain:'Mountains',valley:'Valleys and water',mosque:'Mosques'},
      TR:{fort:'Kaleler',mountain:'Dağlar',valley:'Vadiler ve su',mosque:'Camiler'},
      FR:{fort:'Forts et châteaux',mountain:'Montagnes',valley:'Vallées et eau',mosque:'Mosquées'}
    }[lang]||{})
    const status=L[item.status]||L.unknown;
    box.replaceChildren(node('span','tag tag-gold',item.loc||item.period||'مديرية حبيش'),node('h3','item-title',item.title),node('p','item-body',item.body));
    const facts=node('div','detail-grid');
    [[L.category,cats[item.cat]||'محطة تاريخية'],[L.location,item.loc||'مديرية حبيش'],[L.height,item.elevation||L.unknown],[L.status,status]].forEach(([key,value])=>{const cell=node('div','detail-cell');cell.append(node('strong','',key),node('div','',value));facts.append(cell);});
    box.append(facts);
    if(item.importance)box.append(node('p','item-body',L.importance+': '+item.importance));
    if(item.source)box.append(node('p','small muted',L.source+': '+item.source));
    if(item.sourceUrl&&validHttpUrl(item.sourceUrl)){const link=node('a','btn-sm',L.source+' ↗');link.href=item.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';box.append(link);}
    const actions=node('div','card-actions');
    actions.append(button(isSaved(item.id)?'محفوظ':L.save,'detail-favorite',item.id),button(L.ask,'detail-ask',item.title,'btn-primary'),button(L.share,'detail-share',item.id));
    box.append(actions);openModal('detailModal');
  }
  function renderPeople(){const box=document.getElementById('peopleList');if(!box)return;if(window.HubaishCatalog?.renderPeople){window.HubaishCatalog.renderPeople(box,featureState.people,state.lang||'AR');return;}box.replaceChildren();}
  function exportAllBackup(){if(!adminUnlocked){showToast('افتح لوحة الإشراف برمز المرور أولاً.');return;}const payload={schemaVersion:2,exportedAt:new Date().toISOString(),coreState:state,featureState};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='hubaish-guide-complete-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function importAllBackup(file){if(!adminUnlocked){showToast('افتح لوحة الإشراف برمز المرور أولاً.');return;}if(!file)return;if(file.size>2*1024*1024){showToast('حجم النسخة يتجاوز 2 ميغابايت.');return;}file.text().then(raw=>{const parsed=JSON.parse(raw);const incoming=parsed.coreState||parsed.state;if(!incoming||typeof incoming!=='object'||!Array.isArray(incoming.places)||!Array.isArray(incoming.history))throw new Error('bad schema');const normalized=normalizeState(incoming);state=normalized;const ext=parsed.featureState;if(ext&&typeof ext==='object'&&!Array.isArray(ext)){featureState={...featureState,...ext,contributions:Array.isArray(ext.contributions)?ext.contributions.slice(0,200):[]};}saveState();saveFeatureState();applyTheme(state.theme);applyLang(state.lang);renderAll();renderRadar();renderAdminLists();renderPeople();showToast('تم استيراد النسخة والتحقق من البيانات.');}).catch(()=>showToast('ملف النسخة غير صالح أو لا يطابق البنية المطلوبة.')).finally(()=>{const input=document.getElementById('importJsonInput');if(input)input.value='';});}
  function editItem(typeAndId){const [kind,itemId]=typeAndId.split(':');const array=kind==='place'?state.places:state.history;const item=array.find(x=>x.id===itemId);if(!item)return;const title=prompt('العنوان الجديد',item.title);if(title===null)return;const body=prompt('الوصف الجديد',item.body);if(body===null)return;item.title=clean(title,100);item.body=clean(body,700);window.HubaishCatalog?.autoTranslate?.(item);saveState();renderAll();renderAdminLists();showToast('تم تحديث العنصر.');}
  function deleteItem(typeAndId){if(!confirm('هل تريد حذف هذا العنصر من بيانات هذا الجهاز؟'))return;const [kind,itemId]=typeAndId.split(':');if(kind==='place')state.places=state.places.filter(x=>x.id!==itemId);else state.history=state.history.filter(x=>x.id!==itemId);state.favs=state.favs.filter(x=>x!==itemId);saveState();renderAll();renderAdminLists();showToast('تم حذف العنصر.');}
  function addSocial(){if(!adminUnlocked){showToast('افتح لوحة الإشراف برمز المرور أولاً.');return;}const name=clean(document.getElementById('newSocialName').value,70),url=clean(document.getElementById('newSocialUrl').value,500);if(!name||!validHttpUrl(url)){showToast('أدخل اسماً ورابط HTTP أو HTTPS صحيحاً.');return;}if(state.socials.length>=50){showToast('وصلت إلى الحد الأقصى للروابط.');return;}const added={name,url};state.socials.push(added);window.HubaishCatalog?.autoTranslateSocial?.(added);saveState();renderAll();renderAdminLists();renderCommunitySocials();document.getElementById('newSocialName').value='';document.getElementById('newSocialUrl').value='';showToast('تمت إضافة المنصة.');}
  function randomTour(){const choices=[...state.places.map(p=>({title:p.title,body:p.body,tab:'places'})),...UZAL_22.map(z=>({title:`عزلة ${z}`,body:`${z} ضمن قائمة العزل في مديرية حبيش. ${t('noVillages')}`,tab:'uzal'}))];if(!choices.length)return;const choice=choices[Math.floor(Math.random()*choices.length)];switchTab(choice.tab);setTimeout(()=>{openModal('aiModal');document.getElementById('aiInput').value=`عرفني على ${choice.title}`;sendAiMessage();},80);}
  function updateCounters(){document.querySelectorAll('[data-count]').forEach(el=>{const target=Number(el.dataset.count);if(!Number.isFinite(target))return;let start=0;const step=Math.max(1,Math.ceil(target/36));const timer=setInterval(()=>{start=Math.min(target,start+step);el.textContent=start.toLocaleString('en-US');if(start>=target)clearInterval(timer);},22);});}
  function animateBookmark(source){const target=document.getElementById('favOpenBtn');if(!source||!target)return;const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();const flyer=node('span','fly-bookmark');const bookmarkIcon=window.HubaishIcon?.('bookmark','fly-bookmark-icon');if(bookmarkIcon)flyer.append(bookmarkIcon);flyer.style.left=`${a.left+a.width/2}px`;flyer.style.top=`${a.top+a.height/2}px`;document.body.append(flyer);requestAnimationFrame(()=>{flyer.style.transform=`translate(${b.left-a.left}px,${b.top-a.top}px) scale(.3)`;flyer.style.opacity='0.1';});setTimeout(()=>flyer.remove(),780);target.classList.remove('fav-count-pulse');void target.offsetWidth;target.classList.add('fav-count-pulse');}
  function localizeAssistant(question, fallback){const lang=state.lang||'AR';const answer=window.HubaishCatalog?.assistant?.(question,fallback,lang);if(answer&&answer!==fallback)return answer;const q=normalizeArabic(question);if(lang==='AR')return fallback;const yes={EN:'This answer comes from the guide data stored on this device.\n\n',TR:'Bu yanıt cihazınızda saklanan rehber verilerinden alınmıştır.\n\n',FR:'Cette réponse provient des données du guide stockées sur cet appareil.\n\n'};if(/105998|105,998|population|nufus|population/.test(q))return ({EN:'The 2004 census figure listed for Hubaish is 105,998 residents.',TR:'Hubaish için 2004 nüfus sayımında 105.998 kişi kaydedilmiştir.',FR:'Le recensement de 2004 indique 105 998 habitants pour Hubaish.'})[lang];if(/228|مساحه|alan|superficie/.test(q))return ({EN:'The published area figure used in this guide is 228 km².',TR:'Bu rehberde kullanılan yayımlanmış yüzölçümü 228 km²’dir.',FR:'La superficie publiée utilisée dans ce guide est de 228 km².'})[lang];if(/subdistrict|bucak|sous district|عزله|عزل/.test(q))return ({EN:'The guide lists 22 sub-district names. Verified village-level details are not yet available for every one.',TR:'Rehberde 22 bucak adı listelenmiştir. Her biri için doğrulanmış köy ayrıntıları henüz mevcut değildir.',FR:'Le guide répertorie 22 sous-districts. Les détails vérifiés des villages ne sont pas encore disponibles pour chacun.'})[lang];if(/prayer|namaz|صلاه|مواقيت/.test(q))return ({EN:'Approximate prayer times are displayed on the home screen for Hubaish. Check the local mosque timetable for confirmation.',TR:'Yaklaşık namaz vakitleri ana ekranda gösterilir. Kesin bilgi için yerel cami takvimini kontrol edin.',FR:'Les horaires approximatifs sont affichés sur l’accueil. Vérifiez le calendrier de la mosquée locale.'})[lang];return (yes[lang]||'')+fallback;}
  function openDetails(item){const modal=document.getElementById('aiModal');openModal('aiModal');const input=document.getElementById('aiInput');input.value=`${item.title} — ${item.body}`;sendAiMessage();}
  function onFeatureClick(event){const action=event.target.closest('[data-feature-action]');if(action){const a=action.dataset.featureAction,v=action.dataset.featureValue;if(action.closest('#adminPanel')&&!adminUnlocked){showToast('افتح اللوحة برمز المرور أولاً.');return;}if(a==='detail-share'){const item=findDirectoryItem(v);if(item){const sharedText=item.title+'\n'+item.body+'\n'+(item.sourceUrl||location.href);if(navigator.share){navigator.share({title:item.title,text:sharedText,url:item.sourceUrl||location.href}).catch(()=>{});}else if(navigator.clipboard?.writeText){navigator.clipboard.writeText(sharedText).then(()=>showToast('تم نسخ تفاصيل المعلم.')).catch(()=>showToast(sharedText));}else showToast(sharedText);}return;}if(a.startsWith('quiz-')||a==='detail-favorite'||a==='detail-ask'){handleQuizAction(a,v);return;}if(a==='contrib-approve'||a==='contrib-reject'){handleContribution(v,a==='contrib-approve');return;}if(a==='uzal-edit'){const index=Number(v);const old=featureState.uzal[index];if(old!==undefined){const name=prompt('اسم العزلة',old);if(name!==null&&clean(name,70)){featureState.uzal[index]=clean(name,70);saveFeatureState();renderUzal();renderUzalDetails();renderAdminLists();}}return;}if(a==='uzal-delete'){const index=Number(v);if(Number.isInteger(index)&&confirm('حذف اسم العزلة من القائمة المحلية؟')){featureState.uzal.splice(index,1);saveFeatureState();renderUzal();renderAdminLists();}return;}if(a==='social-delete'){const index=Number(v);if(Number.isInteger(index)){state.socials.splice(index,1);saveState();renderAll();renderAdminLists();}return;}if(a==='social-hide'){const item=state.socials[Number(v)];if(item){if(featureState.socialHidden.includes(item.name))featureState.socialHidden=featureState.socialHidden.filter(x=>x!==item.name);else featureState.socialHidden.push(item.name);saveFeatureState();renderSocials();renderCommunitySocials();renderAdminLists();}return;}if(a==='social-edit'){const item=state.socials[Number(v)];if(item){const name=prompt('اسم المنصة',item.name);if(name===null)return;const url=prompt('رابط المنصة',item.url);if(url===null)return;if(!clean(name,70)||!validHttpUrl(url)){showToast('الاسم أو الرابط غير صالح.');return;}item.name=clean(name,70);item.url=clean(url,500);saveState();renderAll();renderAdminLists();renderCommunitySocials();}return;}if(a==='content-edit'){editItem(v);return;}if(a==='content-delete'){deleteItem(v);return;}}
    const story=event.target.closest('[data-story-tab]');if(story){switchTab(story.dataset.storyTab);window.scrollTo({top:0,behavior:'smooth'});return;}
    const quick=event.target.closest('[data-query]');if(quick){const input=document.getElementById('globalSearchInput');input.value=quick.dataset.query;input.dispatchEvent(new Event('input',{bubbles:true}));return;}
    const question=event.target.closest('[data-ai-question]');if(question){openModal('aiModal');document.getElementById('aiInput').value=question.dataset.aiQuestion;sendAiMessage();}
  }
  function init() {
    if(typeof state==='undefined')return;
    document.getElementById('communityJoinLink')?.setAttribute('href',featureState.communityUrl);
    const categorySelect=document.getElementById('langSelect');if(categorySelect){categorySelect.value=state.lang||'AR';categorySelect.addEventListener('change',()=>{applyExtendedLang();renderStories();renderQuiz();renderExplorerProgress();renderSeasonGuide();localizeAdminControls();});}
    applyExtendedLang();renderStories();renderQuiz();renderPeople();window.HubaishCatalog?.applyUi?.();const fact=document.getElementById('didYouKnow');if(fact)fact.textContent=(FACTS_I18N[state.lang]||FACTS)[factIndex];renderAdminLists();renderCommunitySocials();renderUzalDetails();updateCounters();updateSavedAt();initAdminLock();renderExplorerProgress();renderSeasonGuide();
    document.getElementById('nextFactBtn')?.addEventListener('click',()=>{factIndex=(factIndex+1)%FACTS.length;document.getElementById('didYouKnow').textContent=(FACTS_I18N[state.lang]||FACTS)[factIndex];});
    document.getElementById('randomTourBtn')?.addEventListener('click',randomTour);
    document.getElementById('nextSeasonBtn')?.addEventListener('click',()=>{seasonIndex=(seasonIndex+1)%4;renderSeasonGuide();});
    document.getElementById('addHistorySaveBtn')?.addEventListener('click',addHistory);
    document.getElementById('addUzalBtn')?.addEventListener('click',()=>{if(!adminUnlocked){showToast('افتح لوحة الإشراف برمز المرور أولاً.');return;}const input=document.getElementById('newUzalName');const name=clean(input.value,70);if(!name){showToast('أدخل اسم العزلة.');return;}if(featureState.uzal.length>=60){showToast('وصل الحد الأقصى للأسماء.');return;}featureState.uzal.push(name);saveFeatureState();input.value='';renderUzal();renderAdminLists();showToast('تمت إضافة الاسم إلى القائمة المحلية.');});
    document.getElementById('contributionForm')?.addEventListener('submit',submitContribution);
    document.getElementById('addSocialSaveBtn')?.addEventListener('click',addSocial);
    document.getElementById('exportJsonBtn')?.addEventListener('click',exportAllBackup);
    document.getElementById('importJsonInput')?.addEventListener('change',e=>importAllBackup(e.target.files?.[0]));
    document.getElementById('favSearch')?.addEventListener('input',filterFavorites);
    document.getElementById('favTypeFilter')?.addEventListener('change',filterFavorites);
    document.getElementById('favExportBtn')?.addEventListener('click',exportFavorites);
    document.getElementById('copyCommunityBtn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(featureState.communityUrl);showToast('تم نسخ رابط المجموعة.');}catch{showToast(featureState.communityUrl);}});
    document.getElementById('editCommunityBtn')?.addEventListener('click',()=>{if(!adminUnlocked){showToast('افتح لوحة الإشراف برمز المرور أولاً.');return;}const url=prompt('رابط مجموعة فيسبوك',featureState.communityUrl);if(url===null)return;if(!validHttpUrl(url)){showToast('أدخل رابط HTTP أو HTTPS صحيحاً.');return;}featureState.communityUrl=url;const fb=state.socials.find(x=>x.name.includes('HUBAISH')||x.name.includes('حبيش'));if(fb)fb.url=url;saveState();saveFeatureState();renderAll();renderAdminLists();renderCommunitySocials();showToast('تم تحديث رابط المجتمع محلياً.');});
    document.body.addEventListener('click',onFeatureClick);
    const socialsRoot=document.getElementById('socialLinksList');if(socialsRoot)new MutationObserver(renderCommunitySocials).observe(socialsRoot,{childList:true});
    const dynamicRoots=['placesList','historyList','uzalList','spotlightContainer','favListContainer','globalSearchResults'];dynamicRoots.forEach(key=>{const target=document.getElementById(key);if(target)new MutationObserver(()=>{localizeDynamicLabels();if(key==='uzalList')renderUzalDetails();}).observe(target,{childList:true,subtree:true});});
    const prayerGrid=document.getElementById('prayerGrid');if(prayerGrid)new MutationObserver(()=>{const lang=state.lang||'AR';const names={EN:['Fajr','Dhuhr','Asr','Maghrib','Isha'],TR:['İmsak','Öğle','İkindi','Akşam','Yatsı'],FR:['Fajr','Dhuhr','Asr','Maghrib','Isha']}[lang];if(names)prayerGrid.querySelectorAll('.p-name').forEach((el,i)=>{if(names[i] && el.textContent!==names[i])el.textContent=names[i];});}).observe(prayerGrid,{childList:true});
    localizeDynamicLabels();
    document.getElementById('homeLogoBtn')?.addEventListener('click',()=>{if(state.tab==='home'){updateCounters();showToast('تم تحديث مؤشرات الصفحة الرئيسية.');}else showToast('عدت إلى الصفحة الرئيسية.');},{capture:true});
    document.body.addEventListener('click',e=>{const fav=e.target.closest('[data-fav-id]');if(fav)animateBookmark(fav);},{capture:true});
    const langObserver=new MutationObserver(()=>applyExtendedLang());langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  function filterFavorites(){const query=normalizeArabic(document.getElementById('favSearch')?.value||'');const type=document.getElementById('favTypeFilter')?.value||'all';const list=document.querySelectorAll('#favListContainer .item-card');list.forEach(card=>{const text=normalizeArabic(card.textContent);const isHistory=card.dataset.kind==='history';card.hidden=!!((type==='history'&&!isHistory)||(type==='place'&&isHistory)||(query&&!text.includes(query)));});}
  function exportFavorites(){const items=state.favs.map(id=>[...state.places,...state.history].find(x=>x.id===id)).filter(Boolean);const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),favorites:items},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='hubaish-favorites.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  if (typeof localAssistantAnswer === 'function') { const baseAnswer=localAssistantAnswer; window.localAssistantAnswer = question => localizeAssistant(question,baseAnswer(question)); }
  window.normAr = value => normalizeArabic(value);
  window.HubaishFeatures = { exportAllBackup, randomTour, renderAdminLists, getState:()=>featureState, isAdminUnlocked:()=>adminUnlocked, touchSaved, markExplored, renderExplorerProgress, getUzal:()=>featureState.uzal.slice(), getPeople:()=>featureState.people.slice(), showDetail, assistantAnswer:question=>localizeAssistant(question,localAssistantAnswer(question)), text:t, reset:()=>{localStorage.removeItem(FEATURE_KEY);featureState=loadFeatureState();saveFeatureState();renderAdminLists();renderExplorerProgress();} };
  document.addEventListener('DOMContentLoaded',init,{once:true});
})();
