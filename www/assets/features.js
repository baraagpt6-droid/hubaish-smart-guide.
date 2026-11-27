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
      {q:'Which historic school is documented in Kuman, Hubaish?',a:['Al-Zawahi School','Dhulmah Mosque','Al-Aridah Fort'],why:'Al-Jundi records Al-Zawahi School and Yusuf’s study there (al-Suluk, p. 431).'}
    ],
    TR: [
      {q:'Hubaish ilçesi hangi valilikte bulunur?',a:['İbb','Taiz','Zamar'],why:'Hubaish, İbb Valiliği sınırları içindedir.'},
      {q:'İdari merkez olarak hangi yer belirtilir?',a:['Yarim','Dhulmah','Jiblah'],why:'Mevcut idari listede merkez Dhulmah olarak belirtilir.'},
      {q:'2004 nüfus sayımında kaç kişi kaydedildi?',a:['105.998','85.300','228.000'],why:'Ulusal Bilgi Merkezi 105.998 kişi kaydeder.'},
      {q:'OCHA/yerel yönetişim tablosundaki yüzölçümü nedir?',a:['330 km²','228 km²','480 km²'],why:'Tabloda 228 km² bilgisi yer alır.'},
      {q:'Hubaish’in Kuman bölgesinde hangi tarihî okul belgelenmiştir?',a:['Al-Zawahi Okulu','Dhulmah Camii','Al-Aridah Kalesi'],why:'Al-Jundi, Al-Zawahi Okulu’nu ve Yusuf’un burada eğitim gördüğünü kaydeder (al-Suluk, s. 431).'}
    ],
    FR: [
      {q:'Dans quel gouvernorat se trouve Hubaish ?',a:['Ibb','Taëz','Dhamar'],why:'Hubaish fait partie du gouvernorat d’Ibb.'},
      {q:'Quel lieu est indiqué comme centre administratif ?',a:['Yarim','Dhulmah','Jiblah'],why:'La liste administrative disponible indique Dhulmah.'},
      {q:'Quelle population a été recensée en 2004 ?',a:['105 998','85 300','228 000'],why:'Le Centre national d’information indique 105 998 habitants.'},
      {q:'Quelle superficie figure dans le tableau OCHA/gouvernance locale ?',a:['330 km²','228 km²','480 km²'],why:'Le tableau indique 228 km².'},
      {q:'Quelle école historique est documentée à Kuman, dans Hubaish ?',a:['École d’al-Zawahi','Mosquée de Dhulmah','Fort d’al-Aridah'],why:'Al-Jundi mentionne l’école d’al-Zawahi et les études de Yusuf (al-Suluk, p. 431).'}
    ]
  };
  const QUIZ = window.HubaishCatalog?.quiz || [];
  const UI_TEXT = {
    AR: {'.terrain-strip strong':'جبال إب الغربية','.terrain-strip small':'إحداثيات تقريبية 14°07′N · 44°05′E','.terrain-strip b':'1,550–2,450 م','.section-heading-inline .section-title':'استكشف حبيش في لحظات','.pulse-bar strong':'نبض حبيش الاستكشافي','.pulse-bar small':'اختر وجهتك التالية','#prayerTitle':'مواقيت الصلاة في حبيش','.fact-card .tag':'هل تعلم عن حبيش؟','.fact-card .text-action':'معلومة أخرى ↻','.spotlight-card .tag':'معلم مختار اليوم','#view-history .section-title':'تاريخ مديرية حبيش','#view-places .section-title':'المعالم','#view-uzal .section-title':'عزل مديرية حبيش (22 عزلة)','#view-more .section-title':'المزيد','#histSearchInput':'ابحث في المحطات التاريخية...','#placeSearchInput':'ابحث عن حصن أو جبل أو وادٍ...','#uzalSearchInput':'ابحث باسم العزلة...',"#assistantMoreTitle":"المساعد الذكي","#assistantMoreDesc":"اسأل عن المعالم والعزل والتاريخ والمصادر.","#itineraryTitle":"مسارات حبيش المقترحة","#itineraryDesc":"مسارات موضوعية من العناصر المنشورة في الموسوعة، وليست تعليمات ملاحة ميدانية.","#compareTitle":"المقارن الذكي","#compareDesc":"قارن بين حصنين أو معلمين وفق البيانات المتاحة في الدليل.","#readingSettingsTitle":"إعدادات القراءة","#readingSettingsDesc":"تحكم في حجم الخط والمظهر والمفضلة.","#readerFontDecrease":"A− تصغير النص","#readerFontIncrease":"A+ تكبير النص","#readerFontReset":"إعادة الحجم","#readerOpenFavorites":"المفضلة","#readerToggleTheme":"الوضع الليلي/النهاري","#workerSetupTitle":"تأسيس حساب المشرف الأول","#workerSetupDesc":"يظهر هذا النموذج مرة واحدة عند عدم وجود مشرف. أدخل مفتاح التأسيس المؤقت الذي أعددته في Cloudflare.","#workerBootstrapKey":"مفتاح التأسيس المؤقت","#workerSetupUsername":"اسم المستخدم","#workerSetupPassword":"كلمة مرور لا تقل عن 12 حرفاً","#workerSetupForm button[type=\"submit\"]":"إنشاء المشرف الأول","#workerSetupNotice":"بعد نجاح التأسيس احذف BOOTSTRAP_KEY من أسرار Worker فوراً.",'#globalSearchInput':'ابحث عن عزلة أو قرية أو حصن أو حدث...','[data-query="ظُلمة"]':'مدينة ظُلمة','[data-query="صهبان"]':'بلاد أو مخلاف صهبان','[data-query="جبل عميقة"]':'جبل عميقة','[data-query="وادي بناء"]':'وادي بناء','#saveStatusChip':'محفوظ على هذا الجهاز','#dataSourceNote':'عدد السكان وفق تعداد 2004. تُستخدم مساحة 228 كم² في بيانات OCHA/الحكم المحلي، بينما يذكر مرجع محلي آخر 330 كم²؛ لذلك يحتاج رقم المساحة إلى حسم رسمي. الارتفاعات نطاق تقريبي وليست قياساً مساحياً.','#view-more .section-sub':'الاكتشاف والاختبار والمسارات والمراجع والإدارة.','#newPlaceTitle':'اسم المعلم','#newPlaceLoc':'العزلة / الموقع','#newPlaceDesc':'وصف المعلم','#newHistoryTitle':'عنوان الحدث','#newHistoryPeriod':'الفترة','#newHistoryBody':'التفاصيل والمصدر','#newSocialName':'اسم المنصة','#newSocialUrl':'https://example.com','#contribTitle':'عنوان المساهمة','#contribBody':'اكتب التفاصيل والمصدر إن وجد','#contribName':'اسمك (اختياري)','#contribSource':'رابط أو مرجع يدعم المعلومة (اختياري)'},
    EN: {'.terrain-strip strong':'Western Ibb Highlands','.terrain-strip small':'Approximate coordinates 14°07′N · 44°05′E','.terrain-strip b':'1,550–2,450 m','.section-heading-inline .section-title':'Explore Hubaish in moments','.pulse-bar strong':'Hubaish exploration pulse','.pulse-bar small':'Choose your next destination','#prayerTitle':'Prayer times in Hubaish','.fact-card .tag':'Did you know?','.fact-card .text-action':'Another fact ↻','.spotlight-card .tag':'Featured landmark today','#view-history .section-title':'History of Hubaish District','#view-places .section-title':'Landmarks','#view-uzal .section-title':'Hubaish sub-districts (22)','#view-more .section-title':'More','#histSearchInput':'Search historical events…','#placeSearchInput':'Search forts, mountains or valleys…','#uzalSearchInput':'Search sub-districts…',"#assistantMoreTitle":"Smart assistant","#assistantMoreDesc":"Ask about landmarks, sub-districts, history and sources.","#itineraryTitle":"Suggested Hubaish routes","#itineraryDesc":"Themed routes using published entries. They are not turn-by-turn navigation.","#compareTitle":"Smart comparison","#compareDesc":"Compare two forts or landmarks using available guide data.","#readingSettingsTitle":"Reading settings","#readingSettingsDesc":"Adjust text size, theme and saved items.","#readerFontDecrease":"A− Smaller text","#readerFontIncrease":"A+ Larger text","#readerFontReset":"Reset size","#readerOpenFavorites":"Favorites","#readerToggleTheme":"Dark / light mode","#workerSetupTitle":"Create the first administrator","#workerSetupDesc":"This one-time form appears only when no administrator exists. Enter the temporary bootstrap key configured in Cloudflare.","#workerBootstrapKey":"Temporary bootstrap key","#workerSetupUsername":"Username","#workerSetupPassword":"Password (at least 12 characters)","#workerSetupForm button[type=\"submit\"]":"Create first administrator","#workerSetupNotice":"After setup succeeds, remove BOOTSTRAP_KEY from Worker secrets immediately.",'#globalSearchInput':'Search for a sub-district, village, fort or event…','[data-query="ظُلمة"]':'Dhulmah city','[data-query="صهبان"]':'Bilad or Mikhlaf Sahban','[data-query="جبل عميقة"]':'Amiqa Mountain','[data-query="وادي بناء"]':'Banna Valley','#saveStatusChip':'Saved on this device','#dataSourceNote':'Population uses the 2004 census. An OCHA/local governance dataset reports 228 km², while another local reference reports 330 km²; the area still needs official reconciliation. Elevation is approximate, not a survey.','#view-more .section-sub':'Discovery, quizzes, routes, references and administration.','#newPlaceTitle':'Landmark name','#newPlaceLoc':'Sub-district / location','#newPlaceDesc':'Description','#newHistoryTitle':'Event title','#newHistoryPeriod':'Period','#newHistoryBody':'Details and source','#newSocialName':'Platform name','#newSocialUrl':'https://example.com','#contribTitle':'Contribution title','#contribBody':'Write details and source if available','#contribName':'Your name (optional)','#contribSource':'Source link or reference (optional)'},
    TR: {'.terrain-strip strong':'Batı İbb Dağları','.terrain-strip small':'Yaklaşık koordinatlar 14°07′K · 44°05′D','.terrain-strip b':'1.550–2.450 m','.section-heading-inline .section-title':'Hubaish’i keşfedin','.pulse-bar strong':'Hubaish keşif akışı','.pulse-bar small':'Sonraki durağınızı seçin','#prayerTitle':'Hubaish namaz vakitleri','.fact-card .tag':'Biliyor muydunuz?','.fact-card .text-action':'Başka bir bilgi ↻','.spotlight-card .tag':'Günün öne çıkan yeri','#view-history .section-title':'Hubaish İlçesi tarihi','#view-places .section-title':'Tarihî yerler','#view-uzal .section-title':'Hubaish bucakları (22)','#view-more .section-title':'Daha fazla','#histSearchInput':'Tarihî olayları ara…','#placeSearchInput':'Kale, dağ veya vadi ara…','#uzalSearchInput':'Bucakları ara…',"#assistantMoreTitle":"Akıllı asistan","#assistantMoreDesc":"Yerler, bucaklar, tarih ve kaynaklar hakkında sorun.","#itineraryTitle":"Önerilen Hubaish rotaları","#itineraryDesc":"Yayınlanan kayıtlara göre tematik rotalar. Adım adım navigasyon değildir.","#compareTitle":"Akıllı karşılaştırma","#compareDesc":"Rehberdeki verilere göre iki kale veya yeri karşılaştırın.","#readingSettingsTitle":"Okuma ayarları","#readingSettingsDesc":"Yazı boyutunu, temayı ve favorileri yönetin.","#readerFontDecrease":"A− Yazıyı küçült","#readerFontIncrease":"A+ Yazıyı büyüt","#readerFontReset":"Boyutu sıfırla","#readerOpenFavorites":"Favoriler","#readerToggleTheme":"Koyu / açık mod","#workerSetupTitle":"İlk yönetici hesabını oluştur","#workerSetupDesc":"Bu tek seferlik form yalnızca yönetici yoksa görünür. Cloudflare üzerinde ayarlanan geçici kurulum anahtarını girin.","#workerBootstrapKey":"Geçici kurulum anahtarı","#workerSetupUsername":"Kullanıcı adı","#workerSetupPassword":"En az 12 karakterli parola","#workerSetupForm button[type=\"submit\"]":"İlk yöneticiyi oluştur","#workerSetupNotice":"Kurulum tamamlandıktan sonra BOOTSTRAP_KEY sırrını hemen kaldırın.",'#globalSearchInput':'Bucak, köy, kale veya olay ara…','[data-query="ظُلمة"]':'Dhulmah şehri','[data-query="صهبان"]':'Bilad veya Mikhlaf Sahban','[data-query="جبل عميقة"]':'Amiqa Dağı','[data-query="وادي بناء"]':'Banna Vadisi','#saveStatusChip':'Bu cihazda kaydedildi','#dataSourceNote':'Nüfus 2004 sayımına dayanır. OCHA/yerel yönetim verisi 228 km², başka bir yerel kaynak ise 330 km² bildirir; alanın resmî olarak doğrulanması gerekir. Yükseklikler yaklaşık değerlerdir.','#view-more .section-sub':'Keşif, bilgi yarışması, rotalar, kaynaklar ve yönetim.','#newPlaceTitle':'Yer adı','#newPlaceLoc':'Bucak / konum','#newPlaceDesc':'Açıklama','#newHistoryTitle':'Olay başlığı','#newHistoryPeriod':'Dönem','#newHistoryBody':'Ayrıntılar ve kaynak','#newSocialName':'Platform adı','#newSocialUrl':'https://example.com','#contribTitle':'Katkı başlığı','#contribBody':'Ayrıntıları ve varsa kaynağı yazın','#contribName':'Adınız (isteğe bağlı)','#contribSource':'Kaynak bağlantısı veya referans'},
    FR: {'.terrain-strip strong':'Montagnes de l’ouest d’Ibb','.terrain-strip small':'Coordonnées approximatives 14°07′N · 44°05′E','.terrain-strip b':'1 550–2 450 m','.section-heading-inline .section-title':'Découvrez Hubaish','.pulse-bar strong':'Explorer Hubaish','.pulse-bar small':'Choisissez votre prochaine étape','#prayerTitle':'Horaires de prière à Hubaish','.fact-card .tag':'Le saviez-vous ?','.fact-card .text-action':'Autre fait ↻','.spotlight-card .tag':'Monument du jour','#view-history .section-title':'Histoire du district de Hubaish','#view-places .section-title':'Monuments','#view-uzal .section-title':'Sous-districts de Hubaish (22)','#view-more .section-title':'Plus','#histSearchInput':'Rechercher dans l’histoire…','#placeSearchInput':'Rechercher un fort, une montagne ou une vallée…','#uzalSearchInput':'Rechercher les sous-districts…',"#assistantMoreTitle":"Assistant intelligent","#assistantMoreDesc":"Posez des questions sur les sites, les sous-districts, l’histoire et les sources.","#itineraryTitle":"Itinéraires suggérés à Hubaish","#itineraryDesc":"Parcours thématiques fondés sur les éléments publiés, sans navigation virage par virage.","#compareTitle":"Comparaison intelligente","#compareDesc":"Comparez deux forts ou monuments selon les données du guide.","#readingSettingsTitle":"Paramètres de lecture","#readingSettingsDesc":"Réglez la taille du texte, le thème et les favoris.","#readerFontDecrease":"A− Réduire le texte","#readerFontIncrease":"A+ Agrandir le texte","#readerFontReset":"Réinitialiser","#readerOpenFavorites":"Favoris","#readerToggleTheme":"Mode sombre / clair","#workerSetupTitle":"Créer le premier administrateur","#workerSetupDesc":"Ce formulaire unique apparaît uniquement lorsqu’aucun administrateur n’existe. Saisissez la clé temporaire configurée dans Cloudflare.","#workerBootstrapKey":"Clé temporaire d’initialisation","#workerSetupUsername":"Nom d’utilisateur","#workerSetupPassword":"Mot de passe (12 caractères minimum)","#workerSetupForm button[type=\"submit\"]":"Créer le premier administrateur","#workerSetupNotice":"Après la création, supprimez immédiatement BOOTSTRAP_KEY des secrets du Worker.",'#globalSearchInput':'Rechercher un sous-district, un village, un fort ou un événement…','[data-query="ظُلمة"]':'Ville de Dhulmah','[data-query="صهبان"]':'Bilad ou Mikhlaf Sahban','[data-query="جبل عميقة"]':'Mont Amiqa','[data-query="وادي بناء"]':'Vallée de Banna','#saveStatusChip':'Enregistré sur cet appareil','#dataSourceNote':'La population utilise le recensement de 2004. Une source OCHA/administration locale indique 228 km², tandis qu’une autre référence locale indique 330 km²; la superficie doit être vérifiée officiellement. Les altitudes sont approximatives.','#view-more .section-sub':'Découverte, quiz, itinéraires, références et administration.','#newPlaceTitle':'Nom du monument','#newPlaceLoc':'Sous-district / lieu','#newPlaceDesc':'Description','#newHistoryTitle':'Titre de l’événement','#newHistoryPeriod':'Période','#newHistoryBody':'Détails et source','#newSocialName':'Nom de la plateforme','#newSocialUrl':'https://example.com','#contribTitle':'Titre de la contribution','#contribBody':'Écrivez les détails et la source si disponible','#contribName':'Votre nom (facultatif)','#contribSource':'Lien ou référence source (facultatif)'}
  };
  const D = {
    AR: { greetingMorning:'صباح الخير', greetingEvening:'مساء الخير', stories:['الحصون','العزل','المحطات','المجتمع'], question:'السؤال', start:'ابدأ', next:'التالي', score:'نتيجتك', finish:'انتهى الاختبار', noResult:'لم أعثر على نتيجة مطابقة. جرّب كلمة أخرى أو اسأل المساعد.', ask:'هل تريد أن تسأل المساعد عن هذا الموضوع؟', saved:'تم حفظ التغييرات على هذا الجهاز', pending:'بانتظار المراجعة', approved:'تمت المراجعة', rejected:'مرفوضة', save:'حفظ', edit:'تعديل', delete:'حذف', empty:'لا توجد بيانات هنا بعد.', local:'تحرير محلي على هذا الجهاز فقط', notVerified:'رواية تحتاج إلى توثيق', memberCount:'مجموعة عامة • +11,068 عضو', noVillages:'لا تتوفر حالياً قائمة قرى معتمدة لهذه العزلة في قاعدة البيانات.' },
    EN: { greetingMorning:'Good morning', greetingEvening:'Good evening', stories:['Forts','Sub-districts','Timeline','Community'], question:'Question', start:'Start', next:'Next', score:'Your score', finish:'Quiz complete', noResult:'No matching result. Try another term or ask the assistant.', ask:'Would you like to ask the assistant about this?', saved:'Changes saved on this device', pending:'Pending review', approved:'Reviewed', rejected:'Rejected', save:'Save', edit:'Edit', delete:'Delete', empty:'No data has been added here yet.', local:'Local editing on this device only', notVerified:'Unverified local account', memberCount:'Public group • 11,068+ members', noVillages:'No verified village list is available for this sub-district yet.' },
    TR: { greetingMorning:'Günaydın', greetingEvening:'İyi akşamlar', stories:['Kaleler','Bucaklar','Zaman çizelgesi','Topluluk'], question:'Soru', start:'Başla', next:'Sonraki', score:'Puanınız', finish:'Test tamamlandı', noResult:'Eşleşen sonuç bulunamadı. Başka bir kelime deneyin veya asistana sorun.', ask:'Bu konu hakkında asistana sormak ister misiniz?', saved:'Değişiklikler bu cihaza kaydedildi', pending:'İnceleme bekliyor', approved:'İncelendi', rejected:'Reddedildi', save:'Kaydet', edit:'Düzenle', delete:'Sil', empty:'Henüz veri eklenmedi.', local:'Yalnızca bu cihazda yerel düzenleme', notVerified:'Doğrulanmamış yerel anlatı', memberCount:'Herkese açık grup • 11.068+ üye', noVillages:'Bu bucak için henüz doğrulanmış köy listesi yok.' },
    FR: { greetingMorning:'Bonjour', greetingEvening:'Bonsoir', stories:['Forteresses','Sous-districts','Chronologie','Communauté'], question:'Question', start:'Commencer', next:'Suivant', score:'Votre score', finish:'Quiz terminé', noResult:'Aucun résultat correspondant. Essayez un autre terme ou demandez à l’assistant.', ask:'Voulez-vous demander à l’assistant ?', saved:'Modifications enregistrées sur cet appareil', pending:'En attente de vérification', approved:'Vérifié', rejected:'Rejeté', save:'Enregistrer', edit:'Modifier', delete:'Supprimer', empty:'Aucune donnée ajoutée pour le moment.', local:'Modification locale sur cet appareil uniquement', notVerified:'Récit local non vérifié', memberCount:'Groupe public • 11 068+ membres', noVillages:'Aucune liste de villages vérifiée n’est disponible.' }
  };
  let featureState = loadFeatureState();
  let cloudPeople = [];
  let factIndex = 0;
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let seasonIndex = -1;
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
  function localizeAdminControls() {
    const lang=state.lang||'AR';
    const heritage=document.getElementById('heritageWisdomLabel');
    if(heritage)heritage.textContent=({AR:'اكتشاف اليوم من حبيش',EN:'Today in Hubaish',TR:'Bugün Hubaish’te',FR:'Découverte du jour à Hubaish'})[lang]||'اكتشاف اليوم من حبيش';
    const factButton=document.getElementById('nextFactBtn');
    if(factButton)factButton.textContent=({AR:'معلومة أخرى',EN:'Another insight',TR:'Başka bir bilgi',FR:'Autre information'})[lang]||'معلومة أخرى';
    const fact=document.getElementById('didYouKnow');
    if(fact)fact.textContent=(FACTS_I18N[lang]||FACTS)[factIndex];
  }
  function renderExplorerProgress() {
    const total=Math.max(1,(state.places?.length||0)+(state.history?.length||0)+22);
    const done=Math.min(total,featureState.visitedPlaces.length+featureState.visitedUzal.length);
    const percent=Math.round(done/total*100);
    const meters=document.querySelectorAll('[data-explorer-progress-meter]');
    const values=document.querySelectorAll('[data-explorer-progress-text]');
    const metas=document.querySelectorAll('[data-explorer-progress-meta]');
    meters.forEach(meter=>meter.value=percent);
    values.forEach(value=>value.textContent=percent+'%');
    const copy=state.lang==='EN' ? done+' of '+total+' landmarks, history stops and sub-districts explored on this device.' : state.lang==='TR' ? total+' yer ve bucaktan '+done+' tanesi bu cihazda keşfedildi.' : state.lang==='FR' ? done+' éléments explorés sur '+total+' monuments, étapes et sous-districts sur cet appareil.' : 'استكشفت '+done+' من أصل '+total+' بين المعالم والمحطات التاريخية والعزل على هذا الجهاز.';
    metas.forEach(meta=>meta.textContent=copy);
    const rank=percent>=65||Number(featureState.quizBest)>=8
      ?({AR:'مؤرخ حبيش الذهبي',EN:'Golden Hubaish Historian',TR:'Altın Hubaish Tarihçisi',FR:'Historien d’or de Hubaish'}[state.lang])
      :percent>=25||Number(featureState.quizBest)>=4
        ?({AR:'باحث في تراث حبيش',EN:'Hubaish Heritage Researcher',TR:'Hubaish Miras Araştırmacısı',FR:'Chercheur du patrimoine de Hubaish'}[state.lang])
        :({AR:'مستكشف مبتدئ',EN:'Beginner Explorer',TR:'Yeni Kaşif',FR:'Explorateur débutant'}[state.lang]);
    document.querySelectorAll('[data-explorer-rank]').forEach(el=>el.textContent=rank);

  }
  function renderSmartItineraries(){
    const root=document.getElementById('itineraryList');if(!root)return;root.replaceChildren();
    const places=(Array.isArray(state.places)?state.places:[]).filter(place=>place.scope==='hubaish_district');const lang=state.lang||'AR';
    const labels={
      AR:[['جولة الحصون التاريخية','محطات من الحصون والمعالم التاريخية المنشورة.','fort'],['جولة الوديان والمدرجات الخضراء','معالم طبيعية من الوديان والجبال المنشورة.','nature'],['جولة المعالم الأثرية والدينية','مواقع تراثية ودينية من بيانات الموسوعة.','heritage']],
      EN:[['Historic forts route','Published forts and historic landmarks.','fort'],['Valleys and green terraces','Published valleys and mountain landmarks.','nature'],['Heritage and religious sites','Heritage and religious places in the catalogue.','heritage']],
      TR:[['Tarihi kaleler rotası','Yayınlanan kaleler ve tarihi yerler.','fort'],['Vadiler ve yeşil teraslar','Yayınlanan vadiler ve dağlar.','nature'],['Miras ve dini yerler','Katalogdaki miras ve dini yerler.','heritage']],
      FR:[['Circuit des forts historiques','Forts et sites historiques publiés.','fort'],['Vallées et terrasses vertes','Vallées et montagnes publiées.','nature'],['Sites patrimoniaux et religieux','Sites patrimoniaux et religieux du catalogue.','heritage']]
    }[lang]||[];
    labels.forEach(([title,description,type])=>{
      const chosen=places.filter(place=>{const cat=String(place.cat||'').toLowerCase(),name=String(place.title||'').toLowerCase();return type==='fort'?(cat==='fort'||name.includes('حصن')||name.includes('fort')):type==='nature'?(['valley','mountain','nature'].includes(cat)||/وادي|جبل|valley|mountain/.test(name)):(['mosque','historic','fort'].includes(cat)||/مسجد|أثر|تاريخ|mosque|heritage/.test(name))}).slice(0,4);
      const card=document.createElement('div'),heading=document.createElement('strong'),copy=document.createElement('p'),list=document.createElement('ol');
      card.className='itinerary-item';heading.textContent=title;copy.textContent=description;
      chosen.forEach((place,index)=>{const item=document.createElement('li');item.textContent=(index+1)+'. '+String(place.title||'');list.append(item)});
      if(!chosen.length){const item=document.createElement('li');item.textContent=lang==='EN'?'No matching published places yet.':lang==='TR'?'Henüz eşleşen yayınlanmış yer yok.':lang==='FR'?'Aucun lieu correspondant publié pour le moment.':'لا توجد عناصر منشورة مطابقة حالياً.';list.append(item)}
      card.append(heading,copy,list);root.append(card);
    });
  }
  function renderSmartCompare(){
    const first=document.getElementById('comparePlaceA'),second=document.getElementById('comparePlaceB');if(!first||!second)return;
    const places=(Array.isArray(state.places)?state.places:[]).filter(place=>place.scope==='hubaish_district'),oldA=first.value,oldB=second.value;
    [first,second].forEach(select=>{select.replaceChildren();places.forEach(place=>{const option=document.createElement('option');option.value=String(place.id);option.textContent=String(place.title||place.id);select.append(option)})});
    if(places.some(place=>String(place.id)===oldA))first.value=oldA;
    if(places.some(place=>String(place.id)===oldB))second.value=oldB;
    if(places.length>1&&first.value===second.value)second.selectedIndex=1;
  }
  function compareSelectedPlaces(){
    const places=(Array.isArray(state.places)?state.places:[]).filter(place=>place.scope==='hubaish_district');
    const a=places.find(place=>String(place.id)===document.getElementById('comparePlaceA')?.value);
    const b=places.find(place=>String(place.id)===document.getElementById('comparePlaceB')?.value);
    const root=document.getElementById('compareResult');if(!root)return;root.replaceChildren();
    if(!a||!b||a.id===b.id){root.textContent=state.lang==='EN'?'Choose two different landmarks.':state.lang==='TR'?'İki farklı yer seçin.':state.lang==='FR'?'Choisissez deux lieux différents.':'اختر معلمين مختلفين للمقارنة.';return}
    const headings=({AR:['البيان','التصنيف','الموقع','الارتفاع','الوصف'],EN:['Field','Type','Location','Elevation','Description'],TR:['Alan','Tür','Konum','Yükseklik','Açıklama'],FR:['Champ','Type','Lieu','Altitude','Description']})[state.lang]||['البيان','التصنيف','الموقع','الارتفاع','الوصف'];
    const values=[[a.title,b.title],[a.cat||'—',b.cat||'—'],[a.loc||'—',b.loc||'—'],[a.elevation||'—',b.elevation||'—'],[a.body||'—',b.body||'—']];
    const table=document.createElement('table');table.className='compare-table';
    const header=document.createElement('tr');[headings[0],a.title,b.title].forEach(text=>{const cell=document.createElement('th');cell.textContent=String(text);header.append(cell)});table.append(header);
    values.forEach((row,index)=>{const tr=document.createElement('tr'),name=document.createElement('th');name.textContent=headings[index+1];tr.append(name);row.forEach(value=>{const cell=document.createElement('td');cell.textContent=String(value);tr.append(cell)});table.append(tr)});root.append(table);
  }
  function shareExplorerBadge(){
    const rank=document.querySelector('[data-explorer-rank]')?.textContent||'مستكشف حبيش';
    const progress=document.querySelector('[data-explorer-progress-text]')?.textContent||'0%';
    const text=({AR:'رتبتي في استكشاف حبيش: ',EN:'My Hubaish Explorer rank: ',TR:'Hubaish kaşif seviyem: ',FR:'Mon niveau d’explorateur Hubaish : '})[state.lang]||'رتبتي في استكشاف حبيش: ';
    const message=text+rank+' · '+progress;
    if(navigator.share)navigator.share({title:'Hubaish Guide',text:message}).catch(()=>{});
    else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(message).then(()=>showToast('تم نسخ شارة الإنجاز.')).catch(()=>showToast(message));
    else showToast(message);
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

  function applyLanguage() {
    localizeAdminControls();
    renderExplorerProgress();
    renderSmartItineraries();
    renderSmartCompare();
    renderSeasonGuide();
    localizeDynamicLabels();
    updateSavedAt();
  }

  function clean(value, max = 1500) { return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max); }
  function id(prefix) { return `${prefix}-${globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = String(text); return el; }
  function button(text, action, value, cls = 'btn-sm') { const el = node('button', cls, text); el.type = 'button'; el.dataset.featureAction = action; if (value !== undefined) el.dataset.featureValue = value; return el; }
  function loadFeatureState() {
    const baseUzal = typeof UZAL_22 !== 'undefined' ? UZAL_22.slice() : [];
    const defaults = { contributions: [], quizRuns: 0, quizBest: 0, lastSavedAt: null, socialHidden: [], people: [], uzal: baseUzal, visitedPlaces: [], visitedUzal: [], communityUrl: FACEBOOK_URL, schemaVersion: 5 };
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
        quizBest: Number.isFinite(raw.quizBest) ? Math.max(0, Math.min(100, raw.quizBest)) : 0,
        socialHidden: Array.isArray(raw.socialHidden) ? raw.socialHidden.filter(x => typeof x === 'string') : [],
        people: Array.isArray(raw.people) ? raw.people.slice(0, 100) : [],
        uzal: mergedUzal,
        visitedPlaces: Array.isArray(raw.visitedPlaces) ? [...new Set(raw.visitedPlaces.filter(x => typeof x === 'string'))].slice(0, 300) : [],
        visitedUzal: Array.isArray(raw.visitedUzal) ? [...new Set(raw.visitedUzal.filter(x => typeof x === 'string'))].slice(0, 60) : [],
        communityUrl: validHttpUrl(raw.communityUrl) ? raw.communityUrl : FACEBOOK_URL,
        schemaVersion: 5
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
      AR: { save: 'حفظ', saved: 'محفوظ', ask: 'اسأل المساعد', details: 'التفاصيل', share: 'مشاركة', empty: 'لا توجد نتائج مطابقة.' },
      EN: { save: 'Save', saved: 'Saved', ask: 'Ask assistant', details: 'Details', share: 'Share', empty: 'No matching results.' },
      TR: { save: 'Kaydet', saved: 'Kaydedildi', ask: 'Asistana sor', details: 'Ayrıntılar', share: 'Paylaş', empty: 'Eşleşen sonuç bulunamadı.' },
      FR: { save: 'Enregistrer', saved: 'Enregistré', ask: 'Demander à l’assistant', details: 'Détails', share: 'Partager', empty: 'Aucun résultat correspondant.' }
    }[lang];
    document.querySelectorAll('.card-actions button').forEach(btn => {
      const text = btn.textContent.trim();
      let label = text;
      if (/محفوظ|Saved|Kaydedildi|Enregistré/.test(text)) label = words.saved;
      else if (/حفظ|^Save$|^Kaydet$|^Enregistrer$/.test(text)) label = words.save;
      else if (/اسأل المساعد|Ask assistant|Asistana sor|Demander à l’assistant/.test(text)) label = words.ask;
      else if (/^التفاصيل$|^Details$|^Ayrıntılar$|^Détails$/.test(text)) label = words.details;
      else if (/^مشاركة$|^Share$|^Paylaş$|^Partager$/.test(text)) label = words.share;
      if (btn.textContent !== label) btn.textContent = label;
    });
    document.querySelectorAll('.empty-state').forEach(el => {
      if (/لا توجد نتائج مطابقة|لا توجد معالم مطابقة|No matching (results|landmarks)|Eşleşen (sonuç|yer) bulunamadı|Aucun (résultat|monument) correspondant/.test(el.textContent) && el.textContent !== words.empty) el.textContent = words.empty;
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
    localizeAdminControls();
    const privacy={
      AR:'يحفظ التطبيق المفضلة وتقدم الاستكشاف وإعدادات القراءة على جهازك. يعمل المحتوى المخزن دون اتصال. عند دخول المشرف تُحفظ جلسة المصادقة في تخزين الجلسة أو التخزين المحلي عند تفعيل «تذكرني». ترسل عمليات النشر إلى Cloudflare Worker ثم GitHub. تستخدم MyMemory فقط عند طلب ترجمة المحتوى، وقد تُحمّل الصور من مواقع مصادرها. لا تضع كلمات المرور أو مفاتيح الوصول في المساهمات.',
      EN:'Favorites, exploration progress and reading settings are stored on this device. Cached content remains available offline. Administrator sessions are held in session storage, or local storage when Remember Me is enabled. Publishing goes through Cloudflare Worker to GitHub. MyMemory is used only when translation is requested. Images may load from their source websites. Never include passwords or access keys in contributions.',
      TR:'Favoriler, keşif ilerlemesi ve okuma ayarları bu cihazda saklanır. Önbelleğe alınan içerik çevrimdışı kullanılabilir. Yönetici oturumları, Beni Hatırla etkinse yerel depolamada, değilse oturum depolamasında tutulur. Yayınlar Cloudflare Worker üzerinden GitHub’a gönderilir. MyMemory yalnızca çeviri istendiğinde kullanılır. Görseller kaynak sitelerinden yüklenebilir. Katkılara parola veya erişim anahtarı eklemeyin.',
      FR:'Les favoris, la progression et les préférences de lecture sont conservés sur cet appareil. Le contenu en cache reste disponible hors ligne. Les sessions administrateur sont stockées en session, ou localement si « Se souvenir de moi » est activé. Les publications passent par Cloudflare Worker puis GitHub. MyMemory n’est utilisé que sur demande de traduction. Les images peuvent provenir de sites sources. N’ajoutez jamais de mots de passe ni de clés d’accès aux contributions.'
    };
    const offlineLabel=document.getElementById('offlineIndicator');
    if(offlineLabel)offlineLabel.textContent=({AR:'أنت دون اتصال. المحتوى المحفوظ متاح.',EN:'You are offline. Cached content is available.',TR:'Çevrimdışısınız. Önbellekteki içerik kullanılabilir.',FR:'Vous êtes hors ligne. Le contenu en cache reste disponible.'})[lang]||'أنت دون اتصال. المحتوى المحفوظ متاح.';
    const privacyTitle=document.getElementById('privacyPolicyTitle');
    const privacyText=document.getElementById('privacyPolicyText');
    if(privacyTitle)privacyTitle.textContent=({AR:'سياسة الخصوصية',EN:'Privacy Policy',TR:'Gizlilik Politikası',FR:'Politique de confidentialité'})[lang]||'سياسة الخصوصية';
    if(privacyText)privacyText.textContent=privacy[lang]||privacy.AR;
    renderSmartItineraries();renderSmartCompare();renderExplorerProgress();
  }
  function renderStories() {
    const box=document.getElementById('visualStories'); if(!box)return;
    const lang=state.lang||'AR'; const labels=(D[lang]||D.AR).stories;
    const titles={AR:['بلاد أو مخلاف صهبان','العزل الـ22','محطات التاريخ','مجتمع حبيش'],EN:['Bilad / Mikhlaf Sahban','22 Sub-districts','History timeline','Hubaish community'],TR:['Bilad / Mikhlaf Sahban','22 Bucak','Tarih çizelgesi','Hubaish topluluğu'],FR:['Bilad / Mikhlaf Sahban','22 sous-districts','Chronologie','Communauté de Hubaish']}[lang]||['بلاد أو مخلاف صهبان','العزل الـ22','محطات التاريخ','مجتمع حبيش'];
    const data=[['scroll',titles[0],labels[0],'more'],['mountain',titles[1],labels[1],'uzal'],['scroll',titles[2],labels[2],'history'],['compass',titles[3],labels[3],'more']];
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
      featureState.quizBest=Math.max(Number(featureState.quizBest)||0,quizScore);saveFeatureState();
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
  async function submitContribution(event) {
    event.preventDefault();
    const item={id:id('contrib'),name:clean(document.getElementById('contribName').value,70),type:document.getElementById('contribType').value,title:clean(document.getElementById('contribTitle').value,100),body:clean(document.getElementById('contribBody').value,1600),source:clean(document.getElementById('contribSource').value,350),status:'pending',createdAt:new Date().toISOString()};
    if(!item.title||!item.body){showToast('أدخل عنوان المساهمة والتفاصيل.');return;}
    if(item.source && /^javascript:/i.test(item.source)){showToast('رابط المصدر غير صالح.');return;}
    featureState.contributions.unshift(item);saveFeatureState();renderAdminLists();event.target.reset();
    showToast('حُفظت المساهمة على هذا الجهاز. أرسلها إلى المشرف لمراجعتها ونشرها عبر لوحة GitHub.');
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
  function renderPeople(){const box=document.getElementById('peopleList');if(!box)return;if(window.HubaishCatalog?.renderPeople){window.HubaishCatalog.renderPeople(box,[...featureState.people,...cloudPeople],state.lang||'AR');return;}box.replaceChildren();}
  function setCloudPeople(items){cloudPeople=Array.isArray(items)?items:[];renderPeople();}
  function exportAllBackup(){if(!window.HubaishCloud?.isAdmin?.()){showToast('سجّل الدخول إلى بوابة المشرفين أولاً.');return;}const payload={schemaVersion:3,exportedAt:new Date().toISOString(),coreState:state,featureState,liveContent:window.HubaishCloud?.exportData?.()||null};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='hubaish-guide-complete-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function importAllBackup(file){if(!window.HubaishCloud?.isAdmin?.()){showToast('سجّل الدخول إلى بوابة المشرفين أولاً.');return;}if(!file)return;if(file.size>2*1024*1024){showToast('حجم النسخة يتجاوز 2 ميغابايت.');return;}file.text().then(async raw=>{const parsed=JSON.parse(raw);const incoming=parsed.coreState||parsed.state;if(!incoming||typeof incoming!=='object'||!Array.isArray(incoming.places)||!Array.isArray(incoming.history))throw new Error('bad schema');if(parsed.liveContent&&!window.HubaishCloud?.isAdmin?.())throw new Error('سجّل الدخول إلى بوابة المشرفين قبل استعادة البيانات السحابية.');if(parsed.liveContent)await window.HubaishCloud.importBackup(parsed.liveContent);const normalized=normalizeState(incoming);state=normalized;const ext=parsed.featureState;if(ext&&typeof ext==='object'&&!Array.isArray(ext)){featureState={...featureState,...ext,contributions:Array.isArray(ext.contributions)?ext.contributions.slice(0,200):[]};}saveState();saveFeatureState();applyTheme(state.theme);applyLang(state.lang);renderAll();renderRadar();renderAdminLists();renderPeople();showToast(parsed.liveContent?'تم استيراد النسخة المحلية والسحابية.':'تم استيراد النسخة المحلية والتحقق من البيانات.');}).catch(error=>showToast(error.message||'ملف النسخة غير صالح أو لا يطابق البنية المطلوبة.')).finally(()=>{const input=document.getElementById('importJsonInput');if(input)input.value='';});}
  function randomTour(){const choices=[...state.places.map(p=>({title:p.title,body:p.body,tab:'places'})),...UZAL_22.map(z=>({title:`عزلة ${z}`,body:`${z} ضمن قائمة العزل في مديرية حبيش. ${t('noVillages')}`,tab:'uzal'}))];if(!choices.length)return;const choice=choices[Math.floor(Math.random()*choices.length)];switchTab(choice.tab);setTimeout(()=>{openModal('aiModal');document.getElementById('aiInput').value=`عرفني على ${choice.title}`;sendAiMessage();},80);}
  function updateCounters(){document.querySelectorAll('[data-count]').forEach(el=>{const target=Number(el.dataset.count);if(!Number.isFinite(target))return;let start=0;const step=Math.max(1,Math.ceil(target/36));const timer=setInterval(()=>{start=Math.min(target,start+step);el.textContent=start.toLocaleString('en-US');if(start>=target)clearInterval(timer);},22);});}
  function animateBookmark(source){const target=document.getElementById('favOpenBtn');if(!source||!target)return;const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();const flyer=node('span','fly-bookmark');const bookmarkIcon=window.HubaishIcon?.('bookmark','fly-bookmark-icon');if(bookmarkIcon)flyer.append(bookmarkIcon);flyer.style.left=`${a.left+a.width/2}px`;flyer.style.top=`${a.top+a.height/2}px`;document.body.append(flyer);requestAnimationFrame(()=>{flyer.style.transform=`translate(${b.left-a.left}px,${b.top-a.top}px) scale(.3)`;flyer.style.opacity='0.1';});setTimeout(()=>flyer.remove(),780);target.classList.remove('fav-count-pulse');void target.offsetWidth;target.classList.add('fav-count-pulse');}
  function localizeAssistant(question, fallback){const lang=state.lang||'AR';const answer=window.HubaishCatalog?.assistant?.(question,fallback,lang);if(answer&&answer!==fallback)return answer;const q=normalizeArabic(question);if(lang==='AR')return fallback;const yes={EN:'This answer comes from the guide data stored on this device.\n\n',TR:'Bu yanıt cihazınızda saklanan rehber verilerinden alınmıştır.\n\n',FR:'Cette réponse provient des données du guide stockées sur cet appareil.\n\n'};if(/105998|105,998|population|nufus|population/.test(q))return ({EN:'The 2004 census figure listed for Hubaish is 105,998 residents.',TR:'Hubaish için 2004 nüfus sayımında 105.998 kişi kaydedilmiştir.',FR:'Le recensement de 2004 indique 105 998 habitants pour Hubaish.'})[lang];if(/228|مساحه|alan|superficie/.test(q))return ({EN:'The published area figure used in this guide is 228 km².',TR:'Bu rehberde kullanılan yayımlanmış yüzölçümü 228 km²’dir.',FR:'La superficie publiée utilisée dans ce guide est de 228 km².'})[lang];if(/subdistrict|bucak|sous district|عزله|عزل/.test(q))return ({EN:'The guide lists 22 sub-district names. Verified village-level details are not yet available for every one.',TR:'Rehberde 22 bucak adı listelenmiştir. Her biri için doğrulanmış köy ayrıntıları henüz mevcut değildir.',FR:'Le guide répertorie 22 sous-districts. Les détails vérifiés des villages ne sont pas encore disponibles pour chacun.'})[lang];if(/prayer|namaz|صلاه|مواقيت/.test(q))return ({EN:'Approximate prayer times are displayed on the home screen for Hubaish. Check the local mosque timetable for confirmation.',TR:'Yaklaşık namaz vakitleri ana ekranda gösterilir. Kesin bilgi için yerel cami takvimini kontrol edin.',FR:'Les horaires approximatifs sont affichés sur l’accueil. Vérifiez le calendrier de la mosquée locale.'})[lang];return (yes[lang]||'')+fallback;}
  function openDetails(item){const modal=document.getElementById('aiModal');openModal('aiModal');const input=document.getElementById('aiInput');input.value=`${item.title} — ${item.body}`;sendAiMessage();}
  function onFeatureClick(event){const action=event.target.closest('[data-feature-action]');if(action){const a=action.dataset.featureAction,v=action.dataset.featureValue;if(a==='detail-share'){const item=findDirectoryItem(v);if(item){const sharedText=item.title+'\n'+item.body+'\n'+(item.sourceUrl||location.href);if(navigator.share){navigator.share({title:item.title,text:sharedText,url:item.sourceUrl||location.href}).catch(()=>{});}else if(navigator.clipboard?.writeText){navigator.clipboard.writeText(sharedText).then(()=>showToast('تم نسخ تفاصيل المعلم.')).catch(()=>showToast(sharedText));}else showToast(sharedText);}return;}if(a.startsWith('quiz-')||a==='detail-favorite'||a==='detail-ask'){handleQuizAction(a,v);return;}if(a==='contrib-approve'||a==='contrib-reject'){handleContribution(v,a==='contrib-approve');return;}if(a==='uzal-edit'){const index=Number(v);const old=featureState.uzal[index];if(old!==undefined){const name=prompt('اسم العزلة',old);if(name!==null&&clean(name,70)){featureState.uzal[index]=clean(name,70);saveFeatureState();renderUzal();renderUzalDetails();renderAdminLists();}}return;}if(a==='uzal-delete'){const index=Number(v);if(Number.isInteger(index)&&confirm('حذف اسم العزلة من القائمة المحلية؟')){featureState.uzal.splice(index,1);saveFeatureState();renderUzal();renderAdminLists();}return;}if(a==='social-delete'){const index=Number(v);if(Number.isInteger(index)){state.socials.splice(index,1);saveState();renderAll();renderAdminLists();}return;}if(a==='social-hide'){const item=state.socials[Number(v)];if(item){if(featureState.socialHidden.includes(item.name))featureState.socialHidden=featureState.socialHidden.filter(x=>x!==item.name);else featureState.socialHidden.push(item.name);saveFeatureState();renderSocials();renderCommunitySocials();renderAdminLists();}return;}if(a==='social-edit'){const item=state.socials[Number(v)];if(item){const name=prompt('اسم المنصة',item.name);if(name===null)return;const url=prompt('رابط المنصة',item.url);if(url===null)return;if(!clean(name,70)||!validHttpUrl(url)){showToast('الاسم أو الرابط غير صالح.');return;}item.name=clean(name,70);item.url=clean(url,500);saveState();renderAll();renderAdminLists();renderCommunitySocials();}return;}}
    const story=event.target.closest('[data-story-tab]');if(story){switchTab(story.dataset.storyTab);window.scrollTo({top:0,behavior:'smooth'});return;}
    const quick=event.target.closest('[data-query]');if(quick){const input=document.getElementById('globalSearchInput');input.value=quick.dataset.query;input.dispatchEvent(new Event('input',{bubbles:true}));return;}
    const question=event.target.closest('[data-ai-question]');if(question){openModal('aiModal');document.getElementById('aiInput').value=question.dataset.aiQuestion;sendAiMessage();}
  }
  function init() {
    if(typeof state==='undefined')return;
    document.getElementById('communityJoinLink')?.setAttribute('href',featureState.communityUrl);
    const categorySelect=document.getElementById('langSelect');if(categorySelect){categorySelect.value=state.lang||'AR';categorySelect.addEventListener('change',()=>{applyExtendedLang();renderStories();renderQuiz();renderExplorerProgress();renderSeasonGuide();localizeAdminControls();});}
    const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Aden',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const dateValues=Object.fromEntries(dateParts.map(part=>[part.type,part.value]));
    const dayNumber=Math.floor(Date.UTC(Number(dateValues.year),Number(dateValues.month)-1,Number(dateValues.day))/86400000);
    factIndex=((dayNumber%FACTS.length)+FACTS.length)%FACTS.length;
    applyExtendedLang();renderStories();renderQuiz();renderPeople();renderSmartItineraries();renderSmartCompare();window.HubaishCloud?.applyCached?.();window.HubaishCatalog?.applyUi?.();const fact=document.getElementById('didYouKnow');if(fact)fact.textContent=(FACTS_I18N[state.lang]||FACTS)[factIndex];renderAdminLists();renderCommunitySocials();renderUzalDetails();updateCounters();updateSavedAt();renderExplorerProgress();renderSeasonGuide();
    document.getElementById('comparePlacesBtn')?.addEventListener('click',compareSelectedPlaces);
    document.getElementById('explorerBadgeShare')?.addEventListener('click',shareExplorerBadge);
    document.getElementById('nextFactBtn')?.addEventListener('click',()=>{factIndex=(factIndex+1)%FACTS.length;document.getElementById('didYouKnow').textContent=(FACTS_I18N[state.lang]||FACTS)[factIndex];});
    document.querySelectorAll('[data-random-tour]').forEach(button=>button.addEventListener('click',randomTour));
    document.getElementById('nextSeasonBtn')?.addEventListener('click',()=>{seasonIndex=(seasonIndex+1)%4;renderSeasonGuide();});
    document.getElementById('contributionForm')?.addEventListener('submit',submitContribution);
    document.getElementById('exportJsonBtn')?.addEventListener('click',exportAllBackup);
    document.getElementById('importJsonInput')?.addEventListener('change',e=>importAllBackup(e.target.files?.[0]));
    document.getElementById('favSearch')?.addEventListener('input',filterFavorites);
    document.getElementById('favTypeFilter')?.addEventListener('change',filterFavorites);
    document.getElementById('favExportBtn')?.addEventListener('click',exportFavorites);
    document.getElementById('copyCommunityBtn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(featureState.communityUrl);showToast('تم نسخ رابط المجموعة.');}catch{showToast(featureState.communityUrl);}});
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
  function setCommunityUrl(url){featureState.communityUrl=validHttpUrl(url)?url:FACEBOOK_URL;const link=document.getElementById('communityJoinLink');if(link)link.href=featureState.communityUrl;saveFeatureState();renderCommunitySocials();}
  window.HubaishFeatures = { exportAllBackup, randomTour, renderAdminLists, applyLanguage, getState:()=>featureState, isAdminUnlocked:()=>window.HubaishCloud?.isAdmin?.(), touchSaved, markExplored, renderExplorerProgress, getUzal:()=>featureState.uzal.slice(), getPeople:()=>featureState.people.slice(), setCloudPeople, setCommunityUrl, showDetail, renderSmartItineraries, renderSmartCompare, assistantAnswer:question=>localizeAssistant(question,localAssistantAnswer(question)), text:t, reset:()=>{localStorage.removeItem(FEATURE_KEY);featureState=loadFeatureState();saveFeatureState();renderAdminLists();renderExplorerProgress();} };
  document.addEventListener('DOMContentLoaded',init,{once:true});
})();
