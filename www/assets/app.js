'use strict';

const STORAGE_KEY = 'hubaish_pwa_state_v1';
const MAX_BACKUP_BYTES = 1024 * 1024;
const YEMEN_TIME_ZONE = 'Asia/Aden';
const YEMEN_LAT = 14.1167;
const YEMEN_LNG = 44.0833;
const YEMEN_UTC_OFFSET_HOURS = 3;

const UZAL_22 = [
  'بني معين', 'السلق', 'بني شبيب', 'بني الضاحيتين', 'التفادي', 'جبل خضراء',
  'جبل عميقة (جبل عنقه)', 'الجعافرة', 'ربع ظُلمة', 'الذارحي (الزراحي)', 'شباع',
  'صائر', 'الصدر', 'العارضة', 'الفراعي', 'قحزة (جحزه)', 'كومان', 'المشيرق',
  'الناحية', 'نقيل العقاب', 'وادي العقاب (وادي المعقاب)', 'الوطئة (الوطنة)'
];

const DEFAULT_HISTORY = [
  { id: 'h1', era: 'ancient', period: 'قبل الإسلام • رواية تحتاج تدقيقاً أثرياً', title: 'الجذور القديمة والحصون والصهاريج', body: 'تربط بعض الكتابات المحلية اسم حبيش بأصول حميرية أو سبئية، وتتناقل روايات عن حصون وصهاريج ومدرجات قديمة. لا يتوفر حتى الآن مسح أثري منشور يؤرخ هذه المنشآت في كل مواقع المديرية؛ لذلك يعرض هذا الربط بوصفه فرضية بحثية لا حقيقة محسومة.', status: 'local', source: 'كتاب نفيس الثمن في أسباب مسميات مديريات ومحافظات اليمن، مع الحاجة إلى تحقق أثري مستقل', sourceUrl: 'https://www.nafsam.org/ar/wp-content/uploads/2022/05/2022-05-28_01-12-25_532941-nafsam.pdf' },
  { id: 'h2', era: 'ancient', period: 'القرن الرابع الهجري وما بعده • نص محقق وحاشية', title: 'حبيش في شروح كتب الهمداني', body: 'يقدم كتاب صفة جزيرة العرب إطاراً مهماً لجغرافية اليمن القديمة. وفي حاشية تحقيق محمد الأكوع ترد إحالات إلى اسم حبيش وجبل حبيش ضمن ضبط المواضع. ينبغي التمييز بين نص الهمداني نفسه وبين تعليقات المحقق، وعدم اعتبار الإحالة وحدها دليلاً على حدود المديرية الحديثة.', status: 'documented', source: 'صفة جزيرة العرب، حاشية التحقيق، صفحة 197 في النسخة الرقمية', sourceUrl: 'https://ablibrary.net/book_content/b/9942/205' },
  { id: 'h3', scope: 'related_historical_region', era: 'ancient', period: 'القرن الثامن الهجري • العصر الرسولي', title: 'بلاد / مخلاف صهبان', body: 'تقع صهبان جنوب وجنوب غرب مدينة إب. وتذكر حاشية تحقيق صفة جزيرة العرب أن المنطقة كانت تعرف باسم نعيمة/نعيمة المسواد، ثم شاع اسم مخلاف صهبان في القرن الثامن الهجري حين تولاه الأمير الصهباني من الدولة الرسولية. ترتبط بها هضبة صهبان ومصنعة سير ومراكز تاريخية في السياني وذي السفال. هذا نطاق تاريخي خارج مديرية حبيش الحالية، ولا يساوى بحدودها أو بعزلها الـ22.', status: 'documented', source: 'صفة جزيرة العرب، حاشية تحقيق محمد علي الأكوع، ص 197؛ مرصد تاريخي عن السياني وصهبان', sourceUrl: 'https://ablibrary.net/book_content/b/9942/205' },
  { id: 'h4', scope: 'unverified_location', era: 'ancient', period: 'العصور الإسلامية • رواية محلية', title: 'المساجد والمدارس والحركة العلمية', body: 'تتداول الذاكرة المحلية أخبار مساجد قديمة ومجالس تعليم في ظُلمة وصهبان وبني سيف والأشعوب. لم تتوفر فهارس منشورة أو تواريخ تأسيس موثقة لهذه المواقع أثناء إعداد هذه النسخة؛ ويحتاج هذا المحور إلى مقابلات مع الأهالي، وتصوير النقوش والوثائق الوقفية إن وجدت.', status: 'local', source: 'روايات محلية أولية تحتاج جمع وثائق ومقابلات ميدانية' },
  { id: 'h5', era: 'modern', period: 'أبريل–مايو 1919م', title: 'انتفاضة حبيش ضد الحكم الإمامي', body: 'تورد دراسات صحفية تاريخية ومقتطفات من مذكرات وتقارير معاصرة مقاومة أبناء حبيش للحملة الإمامية سنة 1919م، وتذكر الشيخ محمد عائض العقاب ومواجهات في محيط حبيش. تختلف الروايات في بعض تفاصيل المعارك ومدتها؛ لذا يعرض الحدث مع إحالاته، لا بوصف كل رقم متداول حقيقة متفقاً عليها.', status: 'documented', source: 'دراسة الساحل الغربي عن انتفاضات إب، ومقال نشوان نيوز عن حبيش', sourceUrl: 'https://www.alsahil.net/news20987.html' },
  { id: 'h6', era: 'modern', period: '1357هـ / نحو 1938م وما بعده', title: 'التحول الإداري وظُلمة والعزل', body: 'تذكر مادة تاريخية عن مخلاف الحبيشية تغييرات إدارية سنة 1357هـ وربط المنطقة بلواء إب بعد أن كانت تتبع قضاء رداع. وتُعرّف البيانات الإدارية المتاحة ظُلمة مركزاً للمديرية، بينما تسجل قائمة الدليل 22 عزلة. وظلت المدرجات والبن والحبوب جزءاً من النشاط الزراعي المحلي، لكن قياس تطور الإنتاج الزراعي يحتاج إلى سلسلة إحصائية حديثة، كما تحتاج حدود العزل وقراها إلى مطابقة مع سجل رسمي.', status: 'documented', source: 'مادة تاريخية عن مخلاف الحبيشية والتقسيم الإداري', sourceUrl: 'https://www.thu-raein.com/index.php/ar/makhaleef-ar/hubaish-district-ar' }
];

const DEFAULT_PLACES = [
  { id: 'p1', scope: 'related_historical_region', cat: 'fort', title: 'حصن صهبان التاريخي', loc: 'مصنعة سير / هضبة صهبان جنوب مدينة إب — خارج حبيش الحالية', elevation: 'غير موثق ميدانياً', importance: 'سجل حصني لنطاق صهبان التاريخي؛ لا ينسب إلى مديرية حبيش الحالية.', status: 'documented', source: 'صفة جزيرة العرب، حاشية محمد علي الأكوع، ص 197', sourceUrl: 'https://ablibrary.net/book_content/b/9942/205', body: 'تذكر حاشية التحقيق أن مخلاف صهبان جنوب مدينة إب، وأن الاسم شاع في القرن الثامن الهجري مع الأمير الصهباني. تحفظ البطاقة هوية الموضع التاريخية ولا تفترض أن كل حصن متداول محلياً هو منشأة واحدة أو أن صهبان ضمن حبيش.' },
  { id: 'p2', cat: 'fort', title: 'حصن حبيش (جبل حبيش)', loc: 'جبل حبيش — الموقع الدقيق قيد التحقق', elevation: 'غير موثق ميدانياً', importance: 'معلم مرتبط باسم الجبل والمديرية في الرواية المحلية.', status: 'local', body: 'يرتبط اسم الحصن بجبل حبيش في الذاكرة المحلية. يحتاج وصف الأسوار والصهاريج، وتحديد موضعها وحدودها، إلى تصوير ميداني ومقارنة بالخرائط والسجلات الأثرية قبل اعتماد تفاصيل معمارية أو تاريخ بناء.' },
  { id: 'p3', cat: 'mosque', title: 'الجامع الكبير في ظُلمة', loc: 'مركز ظُلمة — العنوان التفصيلي قيد التوثيق', elevation: 'غير موثق ميدانياً', importance: 'معلم ديني واجتماعي في مركز المديرية.', status: 'local', body: 'يمثل الجامع الكبير نقطة مهمة في الحياة الدينية والاجتماعية في مركز ظُلمة. لا تتوفر في هذه النسخة وثيقة منشورة تثبت تاريخ البناء أو مراحل الترميم؛ يمكن إثراء البطاقة بصور الواجهة والنقوش وسجل الوقف بعد التحقق.' },
  { id: 'p4', cat: 'valley', title: 'وادي الدُّور ومدرجات البن', loc: 'وادي الدُّور — يحتاج تحديد حدوده', elevation: 'غير موثق ميدانياً', importance: 'مشهد زراعي مرتبط بالمدرجات والبن في الرواية المحلية.', status: 'local', body: 'تصف الروايات المحلية الوادي بمدرجاته الزراعية ومحاصيل البن والحبوب. تعتمد قيمة المكان على شبكة المدرجات ومصادر المياه والعمل الزراعي؛ وتحتاج أسماء القرى والروافد والارتفاعات إلى توثيق ميداني.' },
  { id: 'p5', cat: 'fort', title: 'حصن العارضة', loc: 'عزلة العارضة — الموضع الدقيق يحتاج تحققاً', elevation: 'غير موثق ميدانياً', importance: 'موقع حصني ضمن قائمة المعالم المقترحة للتوثيق.', status: 'local', body: 'يُدرج حصن العارضة ضمن أسماء المواقع التي يتداولها أبناء المنطقة. لم تتوفر إحداثيات أو دراسة منشورة تثبت تاريخ البناء أو مكوناته؛ ويستحسن توثيق مدخله وجدرانه وأي نقوش أو روايات مرتبطة به قبل كتابة تاريخ تفصيلي.' },
  { id: 'p6', cat: 'fort', title: 'حصن المنار', loc: 'الموقع والعزلة بحاجة إلى تأكيد', elevation: 'غير موثق ميدانياً', importance: 'موقع تراثي مقترح ضمن سجل الحصون.', status: 'local', body: 'تحتاج بطاقة حصن المنار إلى تحديد موضعه بالاسم المحلي والإحداثيات، ثم توثيق ما بقي من منشآته. لا تنسب إليه هذه النسخة تاريخاً أو ارتفاعاً غير مسند.' },
  { id: 'p7', cat: 'fort', title: 'حصن الشرف', loc: 'الموقع والعزلة بحاجة إلى تأكيد', elevation: 'غير موثق ميدانياً', importance: 'اسم حصن وارد في قائمة المواقع المقترحة.', status: 'local', body: 'يضاف حصن الشرف إلى سجل التراث المحلي بوصفه موقعاً يحتاج إلى التحقق. يمكن استكمال البطاقة بصور ميدانية ووصف التضاريس ومواد البناء وشهادات الأهالي.' },
  { id: 'p8', cat: 'mountain', title: 'جبل عميقة', loc: 'عميقة — يلزم تثبيت نقطة القمة', elevation: 'غير موثق ميدانياً', importance: 'مرتفع جبلي مرتبط بالذاكرة المحلية والمشهد الريفي.', status: 'local', body: 'يُعرف جبل عميقة ضمن أسماء المرتفعات المتداولة في حبيش. لا تعتمد هذه النسخة ارتفاعاً رقمياً أو مسار وصول؛ إذ يتطلب ذلك قياساً جغرافياً وتحديد نقطة القمة ومداخل الجبل.' },
  { id: 'p9', cat: 'mountain', title: 'جبل خضراء', loc: 'عزلة جبل خضراء — الارتفاع قيد التحقق', elevation: 'غير موثق ميدانياً', importance: 'مرتفع يحمل اسم إحدى العزل الواردة في قائمة الدليل.', status: 'local', body: 'يرتبط اسم جبل خضراء بالتقسيم المحلي وبالطبيعة الجبلية للمديرية. يمكن أن توثق البطاقة المدرجات والقرى القريبة ومصادر المياه بعد مراجعة الخرائط والزيارات الميدانية.' },
  { id: 'p10', cat: 'mountain', title: 'مرتفعات ظُلمة', loc: 'محيط مركز ظُلمة', elevation: 'غير موثق ميدانياً', importance: 'تطل على مركز المديرية ومحيطه العمراني والزراعي.', status: 'local', body: 'تجمع مرتفعات ظُلمة بين المشهد العمراني والحقول والمنحدرات. لا تعني التسمية قمة واحدة محددة؛ ويحتاج تحديد نطاقها وارتفاعاتها إلى طبقة تضاريس أو مسح GPS.' },
  { id: 'p11', cat: 'mountain', title: 'جبل بني شبيب', loc: 'بني شبيب — يلزم التحقق من الامتداد', elevation: 'غير موثق ميدانياً', importance: 'مرتفع مرتبط باسم عزلة بني شبيب.', status: 'local', body: 'يرتبط الجبل باسم بني شبيب في القائمة المحلية. توثق البطاقة حالياً الاسم فقط، وتنتظر تحديد القمم والقرى والطرق الزراعية ومصادر المياه من مصادر محلية معتمدة.' },
  { id: 'p12', cat: 'valley', title: 'وادي بناء (الروافد العليا)', loc: 'الروافد العليا — المسار يحتاج مطابقة', elevation: 'غير موثق ميدانياً', importance: 'مجرى مائي ومشهد زراعي يحتاج رسم حوضه وروافده.', status: 'local', body: 'يُدرج الجزء الأعلى من وادي بناء بوصفه نطاقاً طبيعياً يحتاج إلى رسم مجراه وروافده ومواقع الغيول. لا تعرض البطاقة مسافة أو اتجاه تدفق من دون قياس ميداني.' },
  { id: 'p13', cat: 'valley', title: 'وادي الشعيب', loc: 'الموقع التفصيلي قيد التحقق', elevation: 'غير موثق ميدانياً', importance: 'وادي محلي مقترح للتوثيق الطبيعي والزراعي.', status: 'local', body: 'تحتاج هذه البطاقة إلى تعيين حدود الوادي والقرى المحاذية وموسمية جريانه. يمكن إكمالها بصور للمنحدرات والمدرجات ومواقع عبور السيول.' },
  { id: 'p14', cat: 'valley', title: 'غيول حبيش الموسمية', loc: 'مواضع متعددة — تحتاج حصر مواقع', elevation: 'غير موثق ميدانياً', importance: 'مصادر مياه موسمية ذات صلة بالزراعة والغطاء النباتي.', status: 'local', body: 'تشير التسمية إلى عيون ومجاري مياه موسمية متفرقة. لا تمثل البطاقة غيلاً واحداً بإحداثيات معتمدة؛ وينبغي تسجيل كل موقع على حدة وقياس استمرارية جريانه وموسم ظهوره.' },
  { id: 'p15', scope: 'related_historical_region', cat: 'mosque', title: 'مسجد صهبان الأثري', loc: 'نطاق صهبان جنوب مدينة إب — خارج حبيش الحالية؛ الموقع التفصيلي قيد التحقق', elevation: 'غير موثق ميدانياً', importance: 'سجل ديني تاريخي محفوظ ضمن النطاق المرتبط، لا ضمن معالم حبيش الحالية.', status: 'local', source: 'سجل تراثي محلي عن بلاد صهبان؛ يلزم مرجع أثري محدد', sourceUrl: '', body: 'يحفظ هذا المعرّف القديم ضمن قسم النطاقات التاريخية المرتبطة. لا تتوفر في السجل الحالي وثيقة تثبت سنة بناء المسجد أو موقعه الدقيق أو وصفه الأثري؛ وتحتاج البطاقة إلى نقش أو وقف أو مسح ميداني.' },
  { id: 'p16', cat: 'mosque', title: 'المساجد العلمية القديمة في بني سيف والأشعوب', loc: 'بني سيف والأشعوب — المواقع الفردية غير محصورة', elevation: 'غير موثق ميدانياً', importance: 'ذاكرة التعليم الديني ومجالس القراءة في القرى.', status: 'local', body: 'تتداول الذاكرة المحلية وجود مساجد ومجالس تعليم قديمة في بني سيف والأشعوب. هذه بطاقة تجميعية لا تمثل مسجداً واحداً، ويجب فصل كل مبنى في سجل مستقل بعد حصر الاسم والوقف والنقوش وتاريخ الترميم.' }
];

const DEFAULT_SOCIALS = [{ name: 'مديرية حبيش HUBAISH DISTRICT', url: 'https://www.facebook.com/share/g/1JMCzDUsdZ/' }, { name: 'المركز الوطني للمعلومات اليمني', url: 'https://yemen-nic.info/contents/Brief/detail.php?ID=7617&phrase_id=1191776&print=Y' }];

const I18N = {
  AR: { dir: 'rtl', appName: 'دليل حبيش', appSub: 'دليل رقمي للتراث والمعالم', govBadge: 'محافظة إب • الجمهورية اليمنية', statCenter: 'مركز المديرية', heroTitle: 'دليل حبيش', heroDesc: 'موسوعة رقمية لتاريخ حبيش وعزلها وقراها وحصونها ومعالمها ومواقيت الصلاة.', statUzal: 'عزلة إدارية', statArea: 'كم² المساحة', statPop: 'نسمة (تعداد)', spotlightTitle: 'معلم مختار من حبيش', navHome: 'الرئيسية', navHistory: 'التاريخ', navPlaces: 'المعالم', navUzal: 'العزل', navMore: 'المزيد', moreExplore: "الاستكشاف والاختبار", moreTools: "الأدوات والمقارنة", morePersonal: "المفضلة والإعدادات", moreAdmin: "بوابة المشرفين", moreFavorites: "فتح المفضلة", moreDistrict: "حول المديرية", adminTabEdit: "إضافة / تعديل محتوى", adminTabList: "قائمة المحتوى الحالي", adminTabUsers: "المشرفون والصلاحيات", adminTabAudit: "سجل التدقيق والنسخ الاحتياطي", cloudLocaleSummary: "إضافة ترجمات EN / TR / FR", geoProfileTag: "ملف جغرافي", geoProfileTitle: "الموقع والحدود والطبيعة", geoProfileIntro: "تقع حبيش في الجزء الشمالي الغربي من محافظة إب. ويصف المرجع المحلي حدودها شمالاً بالقفر، وشرقاً بالمخادر، وغرباً بحزم العدين، وجنوباً بإب والعدين. يذكر المرجع نفسه مسافتين مختلفتين عن مدينة إب، 42 كم في مقدمة النص و27 كم في خاتمته؛ لذلك لا نعتمد مسافة ثابتة قبل مطابقتها بخريطة رسمية. هذه حدود وصفية من مرجع ثانوي وليست بديلاً عن الخريطة الإدارية المعتمدة.", geoTerrain: "التضاريس", geoTerrainText: "مرتفعات جبلية وسفوح ومدرجات زراعية؛ ومن أشهر الأسماء المحلية جبل الخضراء وجبل حبيش.", geoAgriculture: "الزراعة", geoAgricultureText: "مدرجات وحقول ريفية. وتشير مصادر محلية إلى البن والحبوب، بينما تعد الحبوب والخضروات من محاصيل محافظة إب الرئيسة.", geoWater: "المياه", geoWaterText: "تصف المصادر صهاريج وكروفاً محفورة في الصخر عند مواقع تاريخية مثل قلعة خدد ومصنعة وحاظة. لا تتوفر خريطة منشورة كاملة للغيول والأودية في هذه النسخة.", geoClimate: "المناخ", geoClimateText: "يتغير المشهد الزراعي والغطاء النباتي مع الارتفاع وموسم المطر. لا نعرض درجات حرارة أو معدلات أمطار محلية دون محطة أرصاد موثقة.", geoSourcesLabel: "مصادر الملف:", geoDataCaveat: "يورد جدول OCHA/HNRP 2025 مساحة 228 كم² وتعداداً تقديرياً 162,023 يشمل السكان والنازحين. أما 105,998 فهو رقم تعداد 2004، فلا يُعرضان بوصفهما القياس نفسه. بيانات الارتفاعات نطاق تقريبي وليست قياساً مساحياً.", storiesTitle: "استكشف حبيش في لحظات", storiesTag: "قصص بصرية", pulseTitle: "نبض حبيش الاستكشافي", pulseSubtitle: "اختر وجهتك التالية", westIbbMountains: "جبال إب الغربية", searchPlaceholder: "ابحث عن عزلة أو قرية أو حصن أو حدث...", dataSourceNote: "عدد السكان وفق تعداد 2004. تُستخدم مساحة 228 كم² في بيانات OCHA/Local Governance، بينما يذكر مرجع محلي آخر 330 كم²؛ لذلك يبقى رقم المساحة بحاجة إلى حسم رسمي. بيانات الارتفاعات نطاق تقريبي وليست قياساً مساحياً.", moreSections: "أقسام المزيد", openGeoProfile: "فتح الملف الجغرافي", galleryExploreCta:"معرض صور حبيش التراثي",galleryHomeDescription:"شاهد صوراً موثقة من حصون حبيش وقراها ووديانها.",galleryOpenLabel:"افتح المعرض",photoEditorTitle:"توثيق صورة المعلم",photoUploadLabel:"رفع صورة من الجهاز مع ضغط تلقائي",photoUploadHint:"يُضغط الملف قبل حفظه في سجل المحتوى. الحد الأقصى للنسخة المضغوطة 180 كيلوبايت.",photoUrlLabel:"أو رابط صورة موثق",photoCategoryLabel:"تصنيف الصورة في المعرض",photoCategoryForts:"الحصون والقلاع",photoCategoryValleys:"الوديان والمدرجات",photoCategoryVillages:"القرى والعزل",photoCategoryHeritage:"الآثار والمساجد",photoPhotographerLabel:"اسم المصور",photoAltArLabel:"النص البديل AR",photoAltEnLabel:"النص البديل EN",photoAltTrLabel:"النص البديل TR",photoAltFrLabel:"النص البديل FR",photoCaptionArLabel:"وصف الصورة AR",photoCaptionEnLabel:"وصف الصورة EN",photoCaptionTrLabel:"وصف الصورة TR",photoCaptionFrLabel:"وصف الصورة FR",photoCreditLabel:"نسبة الصورة / الجهة الناشرة",photoLicenseLabel:"الرخصة",photoSourceLabel:"رابط صفحة المصدر",photoVerifiedLabel:"أؤكد أن الصورة تخص مديرية حبيش وأن بيانات نسبها ومصدرها صحيحة" },
  EN: { dir: 'ltr', appName: 'Hubaish Guide', appSub: 'Digital heritage and landmark guide', govBadge: 'Ibb Governorate • Yemen', statCenter: 'District center', heroTitle: 'Hubaish Guide', heroDesc: 'A local guide to Hubaish history, sub-districts, villages, forts, landmarks and prayer times.', statUzal: 'Sub-districts', statArea: 'Area in km²', statPop: 'Population', spotlightTitle: 'Featured landmark', navHome: 'Home', navHistory: 'History', navPlaces: 'Landmarks', navUzal: 'Sub-districts', navMore: 'More', moreExplore: "Explore and quiz", moreTools: "Tools and comparison", morePersonal: "Favorites and settings", moreAdmin: "Admin portal", moreFavorites: "Open favorites", moreDistrict: "About the district", adminTabEdit: "Add / edit content", adminTabList: "Current content", adminTabUsers: "Administrators and roles", adminTabAudit: "Audit log and backups", cloudLocaleSummary: "Add EN / TR / FR translations", geoProfileTag: "Geographic profile", geoProfileTitle: "Location, boundaries and nature", geoProfileIntro: "Hubaish lies in the northwestern part of Ibb Governorate. A local reference describes its borders as Al-Qafr to the north, Al-Makhadir to the east, Hazm Al-Udayn to the west, and Ibb and Al-Udayn to the south. The same reference gives two different distances from Ibb city, 42 km in its introduction and 27 km in its conclusion, so this guide does not adopt a fixed distance until it is checked against an official map. These are descriptive boundaries from a secondary source, not a substitute for the approved administrative map.", geoTerrain: "Terrain", geoTerrainText: "Mountain highlands, slopes and agricultural terraces. Local place names include Jabal Al-Khadra and Jabal Hubaish.", geoAgriculture: "Agriculture", geoAgricultureText: "Rural terraces and fields. Local sources mention coffee and grain, while grain and vegetables are among the main crops of Ibb Governorate.", geoWater: "Water", geoWaterText: "Sources describe cisterns and rock-cut reservoirs at historical sites such as Khudad Fort, Masna'a and Haza. This edition does not include a complete published map of springs and valleys.", geoClimate: "Climate", geoClimateText: "Agriculture and vegetation vary with elevation and the rainy season. Local temperatures and rainfall rates are not shown without a documented weather station.", geoSourcesLabel: "Profile sources:", geoDataCaveat: "The OCHA/HNRP 2025 table lists an area of 228 km² and an estimated population of 162,023 including residents and displaced people. The figure 105,998 is from the 2004 census; the two figures do not describe the same measurement. Elevation values are approximate ranges, not a land survey.", storiesTitle: "Explore Hubaish in moments", storiesTag: "Visual stories", pulseTitle: "Hubaish explorer pulse", pulseSubtitle: "Choose your next destination", westIbbMountains: "Western Ibb Mountains", searchPlaceholder: "Search a sub-district, village, fort or event...", dataSourceNote: "Population uses the 2004 census. The OCHA/Local Governance dataset lists 228 km², while another local reference lists 330 km², so the area still needs official confirmation. Elevations are approximate ranges, not survey measurements.", moreSections: "More sections", openGeoProfile: "Open geographic profile", galleryExploreCta:"Hubaish Heritage Photo Gallery",galleryHomeDescription:"Browse attributed photographs of Hubaish forts, villages and wadis.",galleryOpenLabel:"Open photo gallery",photoEditorTitle:"Document a landmark photo",photoUploadLabel:"Upload a photo with automatic compression",photoUploadHint:"The image is compressed before it is saved. Maximum compressed size: 180 KB.",photoUrlLabel:"Or provide a verified image URL",photoCategoryLabel:"Gallery category",photoCategoryForts:"Forts and castles",photoCategoryValleys:"Wadis and terraces",photoCategoryVillages:"Villages and sub-districts",photoCategoryHeritage:"Heritage and mosques",photoPhotographerLabel:"Photographer name",photoAltArLabel:"Alternative text AR",photoAltEnLabel:"Alternative text EN",photoAltTrLabel:"Alternative text TR",photoAltFrLabel:"Alternative text FR",photoCaptionArLabel:"Photo description AR",photoCaptionEnLabel:"Photo description EN",photoCaptionTrLabel:"Photo description TR",photoCaptionFrLabel:"Photo description FR",photoCreditLabel:"Photo credit / publisher",photoLicenseLabel:"Licence",photoSourceLabel:"Source page URL",photoVerifiedLabel:"I confirm that this photo depicts Hubaish District and its attribution and source details are correct" },
  TR: { dir: 'ltr', appName: 'Hubaish Rehberi', appSub: 'Dijital miras ve gezi rehberi', govBadge: 'İbb Valiliği • Yemen', statCenter: 'İlçe merkezi', heroTitle: 'Hubaish Rehberi', heroDesc: 'Hubeyş tarihi, bucakları, köyleri, kaleleri, tarihi yerleri ve namaz vakitleri için yerel rehber.', statUzal: 'Bucak', statArea: 'Alan km²', statPop: 'Nüfus', spotlightTitle: 'Öne çıkan eser', navHome: 'Ana Sayfa', navHistory: 'Tarih', navPlaces: 'Yerler', navUzal: 'Bucaklar', navMore: 'Daha Fazla', moreExplore: "Keşif ve bilgi testi", moreTools: "Araçlar ve karşılaştırma", morePersonal: "Favoriler ve ayarlar", moreAdmin: "Yönetici kapısı", moreFavorites: "Favorileri aç", moreDistrict: "İlçe hakkında", adminTabEdit: "İçerik ekle / düzenle", adminTabList: "Mevcut içerik listesi", adminTabUsers: "Yöneticiler ve yetkiler", adminTabAudit: "Denetim kaydı ve yedekler", cloudLocaleSummary: "EN / TR / FR çevirilerini ekle", geoProfileTag: "Coğrafi profil", geoProfileTitle: "Konum, sınırlar ve doğa", geoProfileIntro: "Hubaish, İbb Valiliği'nin kuzeybatı bölümünde yer alır. Yerel bir kaynak sınırlarını kuzeyde El-Kafr, doğuda El-Mahadir, batıda Hazm El-Udeyn, güneyde ise İbb ve El-Udeyn olarak tanımlar. Aynı kaynak İbb şehrine uzaklık için girişte 42 km, sonuç bölümünde 27 km olmak üzere iki farklı değer verir. Bu nedenle resmî haritayla doğrulanmadan sabit bir mesafe kullanılmaz. Bunlar ikincil bir kaynaktan alınan betimleyici sınırlardır ve onaylı idarî haritanın yerine geçmez.", geoTerrain: "Yer şekilleri", geoTerrainText: "Dağlık yükseltiler, yamaçlar ve tarım terasları bulunur. Yerel adlar arasında Cebel el-Hadra ve Cebel Hubaish yer alır.", geoAgriculture: "Tarım", geoAgricultureText: "Kırsal teraslar ve tarlalar vardır. Yerel kaynaklar kahve ve tahıldan söz eder; tahıl ve sebzeler İbb Valiliği'nin başlıca ürünleri arasındadır.", geoWater: "Su kaynakları", geoWaterText: "Kaynaklarda Hudud Kalesi, Masna'a ve Haza gibi tarihî alanlarda sarnıçlar ve kayaya oyulmuş su depoları anlatılır. Bu sürümde pınarları ve vadileri gösteren eksiksiz bir yayımlanmış harita bulunmaz.", geoClimate: "İklim", geoClimateText: "Tarım ve bitki örtüsü yükseltiye ve yağış mevsimine göre değişir. Belgelenmiş bir meteoroloji istasyonu olmadan yerel sıcaklık ve yağış oranları gösterilmez.", geoSourcesLabel: "Profil kaynakları:", geoDataCaveat: "OCHA/HNRP 2025 tablosu 228 km² alan ve yerleşik nüfus ile yerinden edilmiş kişileri kapsayan 162.023 tahmini nüfus bildirir. 105.998 sayısı 2004 nüfus sayımındandır; bu iki sayı aynı ölçümü ifade etmez. Yükseklikler arazi ölçümü değil, yaklaşık aralıklardır.", storiesTitle: "Hubaish'i anlar içinde keşfedin", storiesTag: "Görsel hikâyeler", pulseTitle: "Hubaish keşif akışı", pulseSubtitle: "Bir sonraki hedefinizi seçin", westIbbMountains: "Batı İbb Dağları", searchPlaceholder: "Bucak, köy, kale veya olay arayın...", dataSourceNote: "Nüfus için 2004 sayımı kullanılmıştır. OCHA/Yerel Yönetim verileri 228 km², başka bir yerel kaynak ise 330 km² bildirir; bu nedenle alanın resmî olarak doğrulanması gerekir. Yükseklikler ölçüm değil, yaklaşık aralıklardır.", moreSections: "Diğer bölümler", openGeoProfile: "Coğrafi profili aç", galleryExploreCta:"Hubaish Miras Fotoğraf Galerisi",galleryHomeDescription:"Hubaish kaleleri, köyleri ve vadilerinden kaynaklı fotoğraflara göz atın.",galleryOpenLabel:"Fotoğraf galerisini aç",photoEditorTitle:"Yer fotoğrafını belgele",photoUploadLabel:"Otomatik sıkıştırmayla cihazdan fotoğraf yükle",photoUploadHint:"Dosya içerik kaydına eklenmeden önce sıkıştırılır. En yüksek sıkıştırılmış boyut 180 KB.",photoUrlLabel:"Veya doğrulanmış bir fotoğraf bağlantısı girin",photoCategoryLabel:"Galeri kategorisi",photoCategoryForts:"Kaleler",photoCategoryValleys:"Vadiler ve teraslar",photoCategoryVillages:"Köyler ve bucaklar",photoCategoryHeritage:"Miras ve camiler",photoPhotographerLabel:"Fotoğrafçı adı",photoAltArLabel:"Alternatif metin AR",photoAltEnLabel:"Alternatif metin EN",photoAltTrLabel:"Alternatif metin TR",photoAltFrLabel:"Alternatif metin FR",photoCaptionArLabel:"Fotoğraf açıklaması AR",photoCaptionEnLabel:"Fotoğraf açıklaması EN",photoCaptionTrLabel:"Fotoğraf açıklaması TR",photoCaptionFrLabel:"Fotoğraf açıklaması FR",photoCreditLabel:"Fotoğraf kredisi / yayıncı",photoLicenseLabel:"Lisans",photoSourceLabel:"Kaynak sayfası bağlantısı",photoVerifiedLabel:"Bu fotoğrafın Hubaish ilçesine ait olduğunu ve kaynak bilgilerinin doğru olduğunu onaylıyorum" },
  FR: { dir: 'ltr', appName: 'Guide de Hubaish', appSub: 'Guide numérique du patrimoine', govBadge: 'Gouvernorat d’Ibb • Yémen', statCenter: 'Centre du district', heroTitle: 'Guide de Hubaish', heroDesc: 'Guide local de l’histoire, des sous-districts, villages, forts, monuments et horaires de prière de Hubaish.', statUzal: 'Sous-districts', statArea: 'Superficie km²', statPop: 'Population', spotlightTitle: 'Monument à la une', navHome: 'Accueil', navHistory: 'Histoire', navPlaces: 'Monuments', navUzal: 'Sous-districts', navMore: 'Plus', moreExplore: "Explorer et tester", moreTools: "Outils et comparaison", morePersonal: "Favoris et paramètres", moreAdmin: "Portail administrateur", moreFavorites: "Ouvrir les favoris", moreDistrict: "À propos du district", adminTabEdit: "Ajouter / modifier le contenu", adminTabList: "Contenu actuel", adminTabUsers: "Administrateurs et rôles", adminTabAudit: "Journal d’audit et sauvegardes", cloudLocaleSummary: "Ajouter les traductions EN / TR / FR", geoProfileTag: "Profil géographique", geoProfileTitle: "Situation, limites et nature", geoProfileIntro: "Hubaish se situe dans la partie nord-ouest du gouvernorat d’Ibb. Une source locale décrit ses limites ainsi : Al-Qafr au nord, Al-Makhadir à l’est, Hazm Al-Udayn à l’ouest, et Ibb et Al-Udayn au sud. La même source donne deux distances différentes de la ville d’Ibb, 42 km dans son introduction et 27 km dans sa conclusion. Ce guide ne retient donc pas de distance fixe avant vérification sur une carte officielle. Il s’agit de limites descriptives issues d’une source secondaire, et non d’un remplacement de la carte administrative approuvée.", geoTerrain: "Relief", geoTerrainText: "Des hautes terres montagneuses, des versants et des terrasses agricoles. Parmi les noms locaux figurent Jabal Al-Khadra et Jabal Hubaish.", geoAgriculture: "Agriculture", geoAgricultureText: "Des terrasses et des champs ruraux. Des sources locales mentionnent le café et les céréales, tandis que les céréales et les légumes comptent parmi les principales cultures du gouvernorat d’Ibb.", geoWater: "Eau", geoWaterText: "Les sources décrivent des citernes et des réservoirs creusés dans la roche sur des sites historiques comme le fort de Khudad, Masna'a et Haza. Cette édition ne comprend pas de carte publiée complète des sources et des vallées.", geoClimate: "Climat", geoClimateText: "L’agriculture et la couverture végétale varient selon l’altitude et la saison des pluies. Aucune température ni moyenne pluviométrique locale n’est affichée sans station météorologique documentée.", geoSourcesLabel: "Sources du profil :", geoDataCaveat: "Le tableau OCHA/HNRP 2025 indique une superficie de 228 km² et une population estimée à 162 023 personnes, comprenant résidents et déplacés. Le chiffre de 105 998 provient du recensement de 2004 ; ces deux chiffres ne décrivent pas la même mesure. Les altitudes sont des fourchettes approximatives, pas un relevé topographique.", storiesTitle: "Explorer Hubaish en quelques instants", storiesTag: "Récits visuels", pulseTitle: "Parcours exploratoire de Hubaish", pulseSubtitle: "Choisissez votre prochaine destination", westIbbMountains: "Montagnes de l’ouest d’Ibb", searchPlaceholder: "Rechercher un sous-district, village, fort ou événement...", dataSourceNote: "La population indiquée provient du recensement de 2004. Les données OCHA/administration locale indiquent 228 km², tandis qu’une autre référence locale mentionne 330 km² ; la superficie doit donc être confirmée officiellement. Les altitudes sont approximatives et non issues d’un relevé.", moreSections: "Autres rubriques", openGeoProfile: "Ouvrir le profil géographique", galleryExploreCta:"Galerie photo patrimoniale de Hubaish",galleryHomeDescription:"Consultez des photos attribuées des forts, villages et vallées de Hubaish.",galleryOpenLabel:"Ouvrir la galerie",photoEditorTitle:"Documenter une photo de site",photoUploadLabel:"Téléverser une photo avec compression automatique",photoUploadHint:"L’image est compressée avant son enregistrement. Taille compressée maximale : 180 Ko.",photoUrlLabel:"Ou saisir une URL d’image vérifiée",photoCategoryLabel:"Catégorie de la galerie",photoCategoryForts:"Forts et châteaux",photoCategoryValleys:"Vallées et terrasses",photoCategoryVillages:"Villages et sous-districts",photoCategoryHeritage:"Patrimoine et mosquées",photoPhotographerLabel:"Nom du photographe",photoAltArLabel:"Texte alternatif AR",photoAltEnLabel:"Texte alternatif EN",photoAltTrLabel:"Texte alternatif TR",photoAltFrLabel:"Texte alternatif FR",photoCaptionArLabel:"Description de la photo AR",photoCaptionEnLabel:"Description de la photo EN",photoCaptionTrLabel:"Description de la photo TR",photoCaptionFrLabel:"Description de la photo FR",photoCreditLabel:"Crédit photo / éditeur",photoLicenseLabel:"Licence",photoSourceLabel:"URL de la page source",photoVerifiedLabel:"Je confirme que cette photo représente le district de Hubaish et que sa source et son attribution sont exactes" }
};

let currentEra = 'all';
let currentPlaceCategory = 'all';
let state = loadState();
let toastTimer = 0;

function cleanText(value, max = 700) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function validHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function makeId(prefix) {
  const suffix = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function validatePlace(item, index = 0) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const title = cleanText(item.title, 90);
  const body = cleanText(item.body, 700);
  const loc = cleanText(item.loc, 120);
  const cat = ['fort', 'mosque', 'valley', 'mountain', 'market', 'school'].includes(item.cat) ? item.cat : 'fort';
  const scope = ['hubaish_district', 'related_historical_region', 'adjacent_area', 'unverified_location'].includes(item.scope) ? item.scope : (['p1', 'p15'].includes(String(item.id || '')) ? 'related_historical_region' : 'hubaish_district');
  if (!title || !body) return null;
  const sourceUrl = validHttpUrl(item.sourceUrl) ? cleanText(item.sourceUrl, 500) : '';
  return {
    id: /^[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? String(item.id) : makeId('p' + index),
    scope, cat, title, body, loc: loc || 'مديرية حبيش',
    elevation: cleanText(item.elevation, 60) || 'غير موثق ميدانياً',
    importance: cleanText(item.importance, 300),
    source: cleanText(item.source, 300),
    sourceUrl,
    sourceTitle: cleanText(item.sourceTitle, 180),
    sourceAuthor: cleanText(item.sourceAuthor, 140),
    sourcePage: Number.isInteger(Number(item.sourcePage)) && Number(item.sourcePage) > 0 ? Number(item.sourcePage) : null,
    evidenceLevel: cleanText(item.evidenceLevel, 80),
    status: ['documented', 'local', 'unverified'].includes(item.status) ? item.status : 'unverified',
    ...(Number.isFinite(Number(item.distKm)) && Number(item.distKm) >= 0 && Number(item.distKm) <= 1000 ? { distKm: Number(item.distKm) } : {}),
    dir: cleanText(item.dir, 40)
  };
}

function validateHistory(item, index = 0) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const title = cleanText(item.title, 100);
  const body = cleanText(item.body, 700);
  if (!title || !body) return null;
  return {
    id: /^[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? String(item.id) : makeId('h' + index),
    scope: ['hubaish_district', 'related_historical_region', 'adjacent_area', 'unverified_location'].includes(item.scope) ? item.scope : (String(item.id || '') === 'h3' ? 'related_historical_region' : (String(item.id || '') === 'h4' ? 'unverified_location' : 'hubaish_district')),
    era: item.era === 'modern' ? 'modern' : 'ancient',
    period: cleanText(item.period, 70), title, body,
    status: ['documented', 'local', 'unverified'].includes(item.status) ? item.status : 'unverified',
    source: cleanText(item.source, 300),
    sourceUrl: validHttpUrl(item.sourceUrl) ? cleanText(item.sourceUrl, 500) : ''
  };
}

function normalizeState(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  let places = Array.isArray(source.places) ? source.places.slice(0, 200).map(validatePlace).filter(Boolean) : [];
  let history = Array.isArray(source.history) ? source.history.slice(0, 100).map(validateHistory).filter(Boolean) : [];
  // Restore missing built-in records without overwriting saved edits.
  const basePlaceIds = new Set(DEFAULT_PLACES.map(item => item.id));
  const baseHistoryIds = new Set(DEFAULT_HISTORY.map(item => item.id));
  places = [
    ...DEFAULT_PLACES.map(base => places.find(item => item.id === base.id) || { ...base }),
    ...places.filter(item => !basePlaceIds.has(item.id))
  ];
  history = [
    ...DEFAULT_HISTORY.map(base => history.find(item => item.id === base.id) || { ...base }),
    ...history.filter(item => !baseHistoryIds.has(item.id))
  ];
  const socials = Array.isArray(source.socials) ? source.socials.slice(0, 50).map(item => {
    if (!item || typeof item !== 'object') return null;
    const name = cleanText(item.name, 70);
    const url = cleanText(item.url, 500);
    return name && validHttpUrl(url) ? { name, url } : null;
  }).filter(Boolean) : DEFAULT_SOCIALS.map(item => ({ ...item }));
  const ids = new Set([...places, ...history].map(item => item.id));
  const favs = Array.isArray(source.favs) ? source.favs.filter(id => typeof id === 'string' && ids.has(id)).slice(0, 300) : [];
  return {
    contentVersion: 4,
    theme: source.theme === 'light' ? 'light' : 'dark',
    lang: I18N[source.lang] ? source.lang : 'AR',
    tab: ['home', 'history', 'places', 'uzal', 'more'].includes(source.tab) ? source.tab : 'home',
    favs, places, history, socials
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : normalizeState({});
  } catch {
    return normalizeState({});
  }
}

function saveState() {
  try {
    const persistentState = {
      ...state,
      places: state.places.filter(item => !String(item.id || '').startsWith('cloud-')),
      history: state.history.filter(item => !String(item.id || '').startsWith('cloud-')),
      socials: state.socials.filter(item => !item.cloudId)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
    window.HubaishFeatures?.touchSaved?.();
    const status = document.getElementById('saveStatusChip');
    if (status) status.textContent = document.documentElement.lang === 'ar' ? 'محفوظ على هذا الجهاز' : 'Saved on this device';
  } catch {
    showToast('تعذر الحفظ. قد تكون مساحة التخزين ممتلئة.');
  }
}

function showToast(message) {
  const element = document.getElementById('toast');
  element.textContent = String(message);
  element.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove('show'), 2400);
}

function syncNativeStatusBar() {
  const dark = document.documentElement.dataset.theme !== 'light';
  const color = dark ? '#081812' : '#f2f5ef';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  const statusBar = window.Capacitor?.Plugins?.StatusBar;
  if (!statusBar) return;
  Promise.resolve(statusBar.setStyle?.({ style: dark ? 'LIGHT' : 'DARK' })).catch(() => {});
}
function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  const themeToggle = document.getElementById('themeToggleBtn');
  const themeGlyph = themeToggle?.querySelector('#themeGlyph');
  if (themeGlyph) themeGlyph.setAttribute('d', state.theme === 'dark'
    ? 'M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'
    : 'M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z');
  if (themeToggle) themeToggle.setAttribute('aria-label', ({AR:state.theme==='dark'?'التبديل إلى المظهر النهاري':'التبديل إلى المظهر الليلي',EN:state.theme==='dark'?'Switch to light theme':'Switch to dark theme',TR:state.theme==='dark'?'Açık temaya geç':'Koyu temaya geç',FR:state.theme==='dark'?'Passer au thème clair':'Passer au thème sombre'})[state.lang]||'Change theme');
  syncNativeStatusBar();
  saveState();
}

function applyLang(lang) {
  state.lang = I18N[lang] ? lang : 'AR';
  const dictionary = I18N[state.lang];
  document.documentElement.lang = state.lang.toLowerCase();
  document.documentElement.dir = dictionary.dir;
  const languageCode = document.getElementById('langCode');
  if (languageCode) languageCode.textContent = state.lang;
  const languageSelect = document.getElementById('langSelect');
  if (languageSelect) languageSelect.value = state.lang;
  const offlineLabel=document.getElementById('offlineIndicator');
  if(offlineLabel)offlineLabel.textContent=({AR:'أنت دون اتصال. المحتوى المحفوظ متاح.',EN:'You are offline. Cached content is available.',TR:'Çevrimdışısınız. Önbellekteki içerik kullanılabilir.',FR:'Vous êtes hors ligne. Le contenu en cache reste disponible.'})[state.lang];
  const loginUser=document.getElementById('workerUsername'),loginPass=document.getElementById('workerPassword');
  if(loginUser)loginUser.placeholder=({AR:'اسم المستخدم',EN:'Username',TR:'Kullanıcı adı',FR:'Nom d’utilisateur'})[state.lang];
  if(loginPass)loginPass.placeholder=({AR:'كلمة المرور',EN:'Password',TR:'Şifre',FR:'Mot de passe'})[state.lang];
  const remember=document.querySelector('#workerRemember')?.parentElement;
  if(remember)remember.lastChild.textContent=' '+({AR:'تذكرني لمدة 30 يوماً',EN:'Remember me for 30 days',TR:'30 gün boyunca beni hatırla',FR:'Se souvenir de moi pendant 30 jours'})[state.lang];
  const loginButton=document.querySelector('#workerLoginForm button[type="submit"]');
  if(loginButton&&!loginButton.disabled)loginButton.textContent=({AR:'دخول آمن',EN:'Secure sign in',TR:'Güvenli giriş',FR:'Connexion sécurisée'})[state.lang];
  const code = document.getElementById('languageCurrentCode');
  if (code) code.textContent = state.lang;
  const trigger = document.getElementById('languagePickerButton');
  if (trigger) trigger.setAttribute('aria-label', ({AR:'اختر اللغة',EN:'Choose language',TR:'Dil seçin',FR:'Choisir la langue'})[state.lang]);
  const menu = document.getElementById('languagePickerMenu');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (menu) menu.hidden = true;
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.language === state.lang)));
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (dictionary[key]) element.textContent = dictionary[key];
  });
  window.HubaishCatalog?.applyUi?.();
  window.HubaishFeatures?.applyLanguage?.();
  localizeHomeStaticContent();
  window.dispatchEvent(new Event('hubaish:languagechange'));
  saveState();
}

function normalizeArabic(value) {
  return String(value ?? '').toLocaleLowerCase()
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '').replace(/[ـ]/g, '').trim();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function makeTag(text, gold = false) {
  return element('span', gold ? 'tag tag-gold' : 'tag', text);
}

function createAction(label, datasetKey, datasetValue, className = 'btn-sm') {
  const button = element('button', className, label);
  button.type = 'button';
  button.dataset[datasetKey] = datasetValue;
  return button;
}

function appendEmpty(container, text) {
  container.replaceChildren(element('div', 'empty-state', text));
}

function findDirectoryItem(id) {
  return [...state.places, ...state.history].find(item => item.id === id);
}

function isSaved(id) {
  return state.favs.includes(id);
}

function heritageIcon(kind = 'fort', className = 'heritage-icon') {
  const paths = {
    fort: 'M3 21h18M5 21V9l3-2 4 2 4-2 3 2v12M9 21v-5h6v5M8 11h.01M16 11h.01',
    mountain: 'm2 20 7-12 4 7 3-5 6 10H2ZM9 8l2-4 3 5',
    valley: 'M2 7c5 0 5 10 10 10S17 7 22 7M3 21h18M7 13h10',
    mosque: 'M3 21h18M5 21V10h14v11M9 10V7a3 3 0 0 1 6 0v3M12 4V2M8 14v3M16 14v3',
    market: 'M3 10h18l-2-6H5l-2 6ZM5 10v10h14V10M9 20v-6h6v6M3 10a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0',
    scroll: 'M7 4h11a2 2 0 0 1 2 2v13H7a3 3 0 0 1 0-6h13M7 13V4a2 2 0 0 0-2-2',
    bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
    compass: 'm12 2 3 8-3 12-3-12 3-8ZM12 10l8-3-8 3-8-3 8 3ZM12 10v4'
  };
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.65');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', paths[kind] || paths.fort);
  svg.append(path);
  return svg;
}

window.HubaishIcon = heritageIcon;

function localizedDirectoryItem(item) {
  const lang = state.lang || 'AR';
  const translated = window.HubaishCatalog?.localizeItem?.(item, lang) || item;
  return { ...translated, title: item.titleI18n?.[lang] || translated.title || item.title, body: item.bodyI18n?.[lang] || translated.body || item.body, loc: item.locI18n?.[lang] || translated.loc || item.loc };
}

function createContentCard(item, options = {}) {
  const view = localizedDirectoryItem(item);
  const isHistory = state.history.some(entry => entry.id === item.id);
  const card = element('article', 'item-card');
  card.dataset.exploreId = item.id;
  card.dataset.exploreKind = isHistory ? 'history' : 'place';
  const category = ({
    AR:{fort:'حصون وقلاع',mountain:'جبال ومرتفعات',valley:'أودية ومياه',mosque:'مساجد',school:'مدارس تاريخية',market:'أسواق شعبية',history:'محطة تاريخية',place:'معلم'},
    EN:{fort:'Forts and castles',mountain:'Mountains',valley:'Valleys and water',mosque:'Mosques',school:'Historic schools',market:'Local markets',history:'History stop',place:'Landmark'},
    TR:{fort:'Kaleler',mountain:'Dağlar',valley:'Vadiler ve su',mosque:'Camiler',school:'Tarihî okullar',market:'Yerel pazarlar',history:'Tarih durağı',place:'Yer'},
    FR:{fort:'Forts et châteaux',mountain:'Montagnes',valley:'Vallées et eau',mosque:'Mosquées',school:'Écoles historiques',market:'Marchés locaux',history:'Étape historique',place:'Monument'}
  }[state.lang]||{})[item.cat] || (isHistory ? ({AR:'محطة تاريخية',EN:'History stop',TR:'Tarih durağı',FR:'Étape historique'}[state.lang]||'History stop') : ({AR:'معلم',EN:'Landmark',TR:'Yer',FR:'Monument'}[state.lang]||'Landmark'));
  card.classList.add(item.cat ? ('category-' + item.cat) : 'category-history');
  const meta = element('div', 'item-meta');
  const genericMeta = {AR:isHistory?'محطة تاريخية':'معلم',EN:isHistory?'History stop':'Landmark',TR:isHistory?'Tarih durağı':'Yer',FR:isHistory?'Étape historique':'Monument'}[state.lang] || 'Landmark';
  meta.append(heritageIcon(isHistory ? 'scroll' : (item.cat || 'fort')), makeTag(options.meta || genericMeta, true));
  meta.append(makeTag(category, false));
  if (item.scope === 'related_historical_region') {
    const scopeLabels = { AR:'نطاق تاريخي مرتبط • خارج حبيش الحالية', EN:'Related historical region • outside present-day Hubaish', TR:'İlişkili tarihî bölge • günümüz Hubaish idaresinin dışında', FR:'Région historique associée • hors de Hubaish actuelle' };
    meta.append(makeTag(scopeLabels[state.lang] || scopeLabels.AR));
  } else if (item.scope === 'unverified_location') {
    const scopeLabels = { AR:'النطاق الجغرافي قيد التحقق', EN:'Geographic scope under review', TR:'Coğrafi kapsam doğrulanıyor', FR:'Portée géographique à vérifier' };
    meta.append(makeTag(scopeLabels[state.lang] || scopeLabels.AR));
  }
  if (options.extraMeta) meta.append(makeTag(options.extraMeta));
  card.append(meta);
  if (item.imageUrl && validHttpUrl(item.imageUrl)) {
    const figure = element('figure', 'content-photo');
    const photo = element('img', 'content-photo-image');
    photo.src = item.imageUrl;
    photo.alt = cleanText(item.imageAlt || view.title, 180);
    photo.loading = 'lazy';
    photo.decoding = 'async';
    photo.referrerPolicy = 'no-referrer';
    photo.dataset.lightboxSrc = item.imageUrl;
    photo.dataset.lightboxAlt = photo.alt;
    photo.addEventListener('error', () => figure.classList.add('photo-unavailable'), { once: true });
    figure.append(photo);
    if (item.imageCredit) {
      const credit = element('figcaption', 'photo-credit', item.imageCredit);
      if (item.imageSourceUrl && validHttpUrl(item.imageSourceUrl)) {
        const link = element('a', 'photo-credit-link', 'المصدر');
        link.href = item.imageSourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
        credit.append(' · ', link);
      }
      figure.append(credit);
    }
    card.append(figure);
  }
  card.append(element('h3', 'item-title', view.title), element('p', 'item-body', view.body));
  const actions = element('div', 'card-actions');
  const favButton = createAction(isSaved(item.id) ? 'محفوظ' : 'حفظ', 'favId', item.id);
  if (isSaved(item.id)) favButton.classList.add('saved');
  actions.append(
    favButton,
    createAction('مشاركة', 'share', item.id),
    createAction('اسأل المساعد', 'ask', view.title),
    createAction('التفاصيل', 'detail', item.id)
  );
  card.append(actions);
  return card;
}

function renderSpotlight() {
  const target = document.getElementById('spotlightContainer');
  target.replaceChildren();
  const candidates = [...state.places, ...state.history].filter(item => item.scope === 'hubaish_district');
  if (!candidates.length) return appendEmpty(target, 'لا توجد محطات مسجلة.');
  const date = getYemenDateParts();
  const day = dayOfYear(date.year, date.month, date.day);
  const item = candidates[day % candidates.length];
  const view = localizedDirectoryItem(item);
  const isHistory = state.history.some(entry => entry.id === item.id);
  const labels = { AR:'محطة اليوم', EN:'Today’s feature', TR:'Günün seçkisi', FR:'À la une du jour' };
  const meta = isHistory ? (view.period || 'محطة تاريخية') : (view.loc || 'معلم من حبيش');
  target.append(createContentCard(item, { meta, extraMeta: labels[state.lang] || labels.AR }));
}

function renderHistory(era = currentEra, query = '') {
  const target = document.getElementById('historyList');
  const needle = normalizeArabic(query);
  const items = state.history.filter(item => item.scope === 'hubaish_district').filter(item => {
    const view = localizedDirectoryItem(item);
    return (era === 'all' || item.era === era) && (!needle || normalizeArabic(`${item.title} ${item.period} ${item.body} ${view.title} ${view.period} ${view.body}`).includes(needle));
  });
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, state.lang==='EN'?'No matching history entries.':state.lang==='TR'?'Eşleşen tarih kaydı yok.':state.lang==='FR'?'Aucun événement correspondant.':'لا توجد نتائج مطابقة.');
  items.forEach(item => { const view = localizedDirectoryItem(item); const historyLabel={AR:'محطة تاريخية',EN:'History',TR:'Tarih',FR:'Histoire'}[state.lang]||'History'; target.append(createContentCard(item,{meta:view.period||item.period,extraMeta:historyLabel})); });
}

function renderPlaces(category = currentPlaceCategory, query = '') {
  const target = document.getElementById('placesList');
  const needle = normalizeArabic(query);
  const items = state.places.filter(item => item.scope === 'hubaish_district').filter(item => {
    const view = localizedDirectoryItem(item);
    return (category === 'all' || item.cat === category) &&
      (!needle || normalizeArabic(`${item.title} ${item.loc} ${item.body} ${view.title} ${view.loc} ${view.body}`).includes(needle));
  });
  target.replaceChildren();
  const empty = { AR:'لا توجد معالم مطابقة.', EN:'No matching landmarks.', TR:'Eşleşen yer bulunamadı.', FR:'Aucun monument correspondant.' };
  if (!items.length) return appendEmpty(target, empty[state.lang] || empty.AR);
  items.forEach(item => {
    const view = localizedDirectoryItem(item);
    const distance = Number.isFinite(item.distKm) ? ({
      AR:`مسافة تقديرية ${item.distKm} كم • ${item.dir || ''}`,
      EN:`Approx. distance ${item.distKm} km • ${item.dir || ''}`,
      TR:`Yaklaşık ${item.distKm} km • ${item.dir || ''}`,
      FR:`Distance approx. ${item.distKm} km • ${item.dir || ''}`
    }[state.lang] || '') : '';
    target.append(createContentCard(item, { meta: view.loc || item.loc, extraMeta: distance }));
  });
}

function renderRelatedHistoricalRegions() {
  const target = document.getElementById('relatedHistoricalRegionsList');
  if (!target) return;
  target.replaceChildren();
  const items = [
    ...state.places.filter(item => item.scope === 'related_historical_region'),
    ...state.history.filter(item => item.scope === 'related_historical_region')
  ];
  if (!items.length) return appendEmpty(target, state.lang === 'EN' ? 'No related historical records yet.' : state.lang === 'TR' ? 'Henüz ilişkili tarihî kayıt yok.' : state.lang === 'FR' ? 'Aucun document historique associé pour le moment.' : 'لا توجد سجلات تاريخية مرتبطة حالياً.');
  items.forEach(item => {
    const view = localizedDirectoryItem(item);
    const meta = state.history.some(entry => entry.id === item.id) ? (view.period || item.period || '') : (view.loc || item.loc || '');
    target.append(createContentCard(item, { meta, extraMeta: state.lang === 'EN' ? 'Related historical region' : state.lang === 'TR' ? 'İlişkili tarihî bölge' : state.lang === 'FR' ? 'Région historique associée' : 'نطاق تاريخي مرتبط' }));
  });
}

function renderUnverifiedHistoricalRecords() {
  const target = document.getElementById('unverifiedHistoricalRecordsList');
  if (!target) return;
  target.replaceChildren();
  const items = [
    ...state.places.filter(item => item.scope === 'unverified_location'),
    ...state.history.filter(item => item.scope === 'unverified_location')
  ];
  if (!items.length) return appendEmpty(target, state.lang === 'EN' ? 'No records awaiting geographic verification.' : state.lang === 'TR' ? 'Coğrafi doğrulama bekleyen kayıt yok.' : state.lang === 'FR' ? 'Aucun document en attente de vérification géographique.' : 'لا توجد سجلات تنتظر التحقق الجغرافي.');
  items.forEach(item => {
    const view = localizedDirectoryItem(item);
    const meta = state.history.some(entry => entry.id === item.id) ? (view.period || item.period || '') : (view.loc || item.loc || '');
    target.append(createContentCard(item, { meta, extraMeta: state.lang === 'EN' ? 'Geographic scope under review' : state.lang === 'TR' ? 'Coğrafi kapsam doğrulanıyor' : state.lang === 'FR' ? 'Portée géographique à vérifier' : 'النطاق الجغرافي قيد التحقق' }));
  });
}

function renderUzal(query = '') {
  const target = document.getElementById('uzalList');
  const needle = normalizeArabic(query);
  const directoryNames = window.HubaishFeatures?.getUzal?.() || UZAL_22;
  if (window.HubaishCatalog?.renderDistricts) return window.HubaishCatalog.renderDistricts(target, directoryNames, query, state.lang);
  const labels = {
    AR:{district:'عزلة',number:'عزلة',explore:'استكشف',question:'في مديرية حبيش'},
    EN:{district:'Sub-district',number:'Sub-district',explore:'Explore',question:'in Hubaish District'},
    TR:{district:'Bucak',number:'Bucak',explore:'Keşfet',question:'Hubaish ilçesinde'},
    FR:{district:'Sous-district',number:'Sous-district',explore:'Explorer',question:'dans le district de Hubaish'}
  }[state.lang] || {district:'Sub-district',number:'Sub-district',explore:'Explore',question:'in Hubaish District'};
  const items = directoryNames.map((name, index) => ({ name, number: index + 1 })).filter(item => !needle || normalizeArabic(item.name).includes(needle));
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, state.lang==='EN'?'No matching sub-district.':state.lang==='TR'?'Eşleşen bucak yok.':state.lang==='FR'?'Aucun sous-district correspondant.':'لا توجد عزلة مطابقة.');
  items.forEach(item => {
    const card = element('article', 'item-card');
    const row = element('div', 'item-meta');
    row.append(makeTag(labels.number+' #'+item.number, true));
    card.dataset.exploreId = item.name;
    card.dataset.exploreKind = 'uzal';
    card.append(heritageIcon('mountain'), row, element('h3', 'item-title', labels.district+' '+item.name), createAction(labels.explore, 'ask', labels.district+' '+item.name+' '+labels.question));
    target.append(card);
  });
}

function renderSocials() {
  const target = document.getElementById('socialLinksList');
  target.replaceChildren();
  if (!state.socials.length) return appendEmpty(target, 'لا توجد روابط مضافة.');
  state.socials.forEach(item => {
    if (!validHttpUrl(item.url)) return;
    const link = element('a', 'btn-sm', `↗ ${window.HubaishCatalog?.localizeSocial?.(item, state.lang) || item.name}`);
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.referrerPolicy = 'no-referrer';
    target.append(link);
  });
}

function renderAll() {
  renderSpotlight();
  renderHistory(currentEra, document.getElementById('histSearchInput').value);
  renderPlaces(currentPlaceCategory, document.getElementById('placeSearchInput').value);
  renderRelatedHistoricalRegions();
  renderUnverifiedHistoricalRecords();
  renderUzal(document.getElementById('uzalSearchInput').value);
  window.HubaishGallery?.render?.();
  renderSocials();
  updateFavCount();
}

function updateFavCount() {
  document.getElementById('favCount').textContent = String(state.favs.length);
  const trigger = document.getElementById('favOpenBtn');
  if (trigger) { trigger.classList.remove('fav-count-pulse'); void trigger.offsetWidth; trigger.classList.add('fav-count-pulse'); }
}

function renderFavorites() {
  const target = document.getElementById('favListContainer');
  target.replaceChildren();
  const items = state.favs.map(findDirectoryItem).filter(Boolean);
  if (!items.length) return appendEmpty(target, 'لا توجد عناصر محفوظة بعد.');
  items.forEach(item => { const card = createContentCard(item); card.dataset.kind = state.history.some(entry => entry.id === item.id) ? 'history' : 'place'; target.append(card); });
}

function toggleFavorite(id) {
  if (!findDirectoryItem(id)) return;
  state.favs = isSaved(id) ? state.favs.filter(value => value !== id) : [...state.favs, id].slice(0, 300);
  saveState();
  renderAll();
  renderFavorites();
  showToast(isSaved(id) ? 'تمت الإضافة إلى المحفوظات' : 'تمت الإزالة من المحفوظات');
}

function switchTab(tab) {
  const valid = ['home', 'history', 'places', 'uzal', 'more'];
  if (!valid.includes(tab)) return;
  state.tab = tab;
  document.querySelectorAll('.view-section').forEach(section => section.classList.toggle('active', section.id === `view-${tab}`));
  document.querySelectorAll('.nav-btn').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  saveState();
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  const firstInput = modal.querySelector('input:not([type=file]), button');
  firstInput?.focus({ preventScroll: true });
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function bindVoiceMic(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!button || !input) return;
  button.addEventListener('click', () => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) return showToast('الإدخال الصوتي غير مدعوم في هذا المتصفح.');
    const recognition = new SpeechRecognitionApi();
    recognition.lang = state.lang === 'AR' ? 'ar-YE' : state.lang === 'TR' ? 'tr-TR' : state.lang === 'FR' ? 'fr-FR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    button.classList.add('listening');
    button.disabled = true;
    recognition.onresult = event => {
      input.value = cleanText(event.results?.[0]?.[0]?.transcript, 500);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    recognition.onerror = () => showToast('تعذر التقاط الصوت. تحقق من إذن الميكروفون.');
    recognition.onend = () => { button.classList.remove('listening'); button.disabled = false; };
    try { recognition.start(); } catch { button.classList.remove('listening'); button.disabled = false; showToast('تعذر بدء الإدخال الصوتي.'); }
  });
}

function renderGlobalSearch(query) {
  const target = document.getElementById('globalSearchResults');
  const needle = normalizeArabic(query);
  target.replaceChildren();
  if (!needle) return;
  const matchedPlaces = state.places.filter(item => item.scope === 'hubaish_district' && normalizeArabic(`${item.title} ${item.loc} ${item.body}`).includes(needle));
  const matchedHistory = state.history.filter(item => item.scope === 'hubaish_district' && normalizeArabic(`${item.title} ${item.period} ${item.body}`).includes(needle));
  const matchedRelated = [...state.places, ...state.history].filter(item => item.scope === 'related_historical_region' && normalizeArabic(`${item.title} ${item.loc || ''} ${item.period || ''} ${item.body}`).includes(needle));
  const matchedUnverified = [...state.places, ...state.history].filter(item => item.scope === 'unverified_location' && normalizeArabic(`${item.title} ${item.loc || ''} ${item.period || ''} ${item.body}`).includes(needle));
  const directoryNames = window.HubaishFeatures?.getUzal?.() || UZAL_22;
  const matchedUzal = directoryNames.filter(name => normalizeArabic(name).includes(needle)).map((name, index) => ({ title: `عزلة ${name}`, body: 'إحدى العزل المدرجة ضمن قائمة مديرية حبيش. التفاصيل القروية بحاجة إلى توثيق ميداني.', id: `uzal-search-${index}` }));
  const matchedPeople = (window.HubaishFeatures?.getPeople?.() || []).filter(item => normalizeArabic(`${item.title} ${item.body}`).includes(needle)).map(item => ({title:item.title,body:item.body,id:`person-${normalizeArabic(item.title)}`}));
  const refs = [{title:'التعداد السكاني 2004',body:'105,998 نسمة وفق المركز الوطني للمعلومات اليمني.'},{title:'مساحة المديرية',body:'228 كم² في بيانات OCHA/Local Governance، مع وجود مرجع محلي ينشر 330 كم².'},{title:'التقسيم الإداري',body:'مديرية حبيش تضم 22 عزلة وفق المركز الوطني للمعلومات.'}].filter(item=>normalizeArabic(`${item.title} ${item.body}`).includes(needle)).map((item,index)=>({...item,id:`ref-${index}`}));
  const groups = [
    {label:'المعالم',kind:'landmark',items:matchedPlaces},
    {label:'التاريخ',kind:'history',items:matchedHistory},
    {label:'العزل',kind:'district',items:matchedUzal},
    {label:'الشخصيات',kind:'person',items:matchedPeople},
    {label:'النطاقات التاريخية المرتبطة',kind:'related-region',items:matchedRelated},
    {label:'سجلات بنطاق جغرافي قيد التحقق',kind:'unverified-region',items:matchedUnverified},
    {label:'المراجع',kind:'reference',items:refs}
  ].filter(group=>group.items.length);
  const all = groups.flatMap(group=>group.items.map(item=>({...item,searchKind:group.kind,searchLabel:group.label}))).slice(0, 24);
  if (!all.length) { appendEmpty(target, 'لا توجد نتائج مطابقة.'); target.append(createAction('اسأل المساعد عن: ' + cleanText(query, 80), 'ask', query, 'btn-primary')); return; }
  target.append(element('h2', 'section-title', `نتائج البحث المصنفة (${all.length})`));
  all.forEach(item => {
    const card = element('article', 'item-card search-result-card');
    card.append(makeTag(item.searchLabel,true),element('h3', 'item-title', item.title), element('p', 'item-body', item.body));
    card.append(createAction('اسأل المساعد', 'ask', item.title));
    if (item.scope === 'related_historical_region') card.append(element('p', 'small muted scope-note', 'هذا السجل مرتبط بنطاق تاريخي خارج الحدود الإدارية الحالية لمديرية حبيش.'));
    if (item.scope === 'unverified_location') card.append(element('p', 'small muted scope-note', 'النطاق الجغرافي لهذا السجل غير محسوم، وتحتاج مواضعه المذكورة إلى مطابقة مستقلة.'));
    target.append(card);
  });
}

function localAssistantAnswer(question) {
  const q = normalizeArabic(question);
  if (/حصن|حصون|قلاع|قلعة|fort|castle/i.test(question)) {
    const found=state.places.filter(item=>item.cat==='fort'&&item.scope==='hubaish_district');
    const title={AR:'الحصون والقلاع المسجلة في الموسوعة:',EN:'Forts and castles listed in the guide:',TR:'Rehberde kayıtlı kaleler:',FR:'Forts et châteaux répertoriés dans le guide :'}[state.lang]||'Forts:';
    return found.length?title+'\\n'+found.map((item,i)=>(i+1)+'. '+item.title+' — '+item.loc).join('\\n'):'لا توجد حالياً بطاقات حصون في المحتوى المحلي.';
  }
  if (/عزل|عزله|bucak|sub.?district|districts/i.test(question)) {
    const names=window.HubaishFeatures?.getUzal?.()||UZAL_22;
    const title={AR:'العزل الـ22 المدرجة في الدليل:',EN:'The 22 sub-districts listed in the guide:',TR:'Rehberde listelenen 22 bucak:',FR:'Les 22 sous-districts répertoriés :'}[state.lang]||'Sub-districts:';
    return title+'\\n'+names.map((name,i)=>(i+1)+'. '+name).join('، ');
  }
  if (/وادي|وديان|مدرجات|valley|wadi|terrace/i.test(question)) {
    const found=state.places.filter(item=>item.cat==='valley'&&item.scope==='hubaish_district');
    const title={AR:'الأودية والمدرجات المسجلة:',EN:'Recorded wadis and terraces:',TR:'Kayıtlı vadiler ve teraslar:',FR:'Vallées et terrasses répertoriées :'}[state.lang]||'Wadis:';
    return found.length?title+'\\n'+found.map((item,i)=>(i+1)+'. '+item.title+' — '+item.loc).join('\\n'):'لا توجد بطاقات أودية في المحتوى المحلي حالياً.';
  }
  if (/مسار|جوله|سياح|route|itinerary|tour/i.test(question)) {
    const places=state.places.filter(item=>item.scope==='hubaish_district'&&['fort','valley','mountain','mosque'].includes(item.cat)).slice(0,5);
    if(places.length)return 'اقتراح استكشاف من العناصر المنشورة في الموسوعة، وليس مسار ملاحة ميدانياً:\n'+places.map((item,index)=>(index+1)+'. '+item.title+' — '+item.loc).join('\n')+'\nتحقق من الطرق والوقت محلياً قبل الزيارة.';
  }
  if (/تاريخ|history|الحضاره|الانتفاضه/i.test(question)) {
    const events=state.history.filter(item=>item.scope==='hubaish_district').slice(0,4);
    if(events.length)return events.map(item=>item.title+' — '+item.period+'\n'+item.body).join('\n\n');
  }
  if (/صلاه|الفجر|الظهر|العصر|المغرب|العشاء|مواقيت/.test(q)) {
    const times = computePrayerTimesForToday();
    return `مواقيت الصلاة التقريبية في حبيش اليوم:\n${times.prayers.map(prayer => `${prayer.name}: ${formatYemenTime(prayer.timestamp)}`).join(' | ')}\n\nالتوقيت: اليمن (Asia/Aden).`;
  }
  const place = state.places.find(item => {
    const terms = normalizeArabic(`${item.title} ${item.loc}`).split(/\s+/).filter(term => term.length > 2);
    return terms.some(term => q.includes(term));
  });
  if (place) return `${place.title}\n${place.loc}\n${place.body}${place.scope==='related_historical_region'?'\nنطاق تاريخي مرتبط خارج الحدود الإدارية الحالية لمديرية حبيش.':place.scope==='unverified_location'?'\nالنطاق الجغرافي لهذا السجل غير محسوم ويحتاج إلى تحقق.':''}`;
  const directoryNames = window.HubaishFeatures?.getUzal?.() || UZAL_22;
  const uzla = directoryNames.find(name => q.includes(normalizeArabic(name)));
  if (uzla) return `عزلة ${uzla} مدرجة ضمن قائمة العزل الـ22 في بيانات هذا الدليل. لا تتوفر في النسخة الحالية تفاصيل مستقلة موثقة عن كل قرية أو حدود العزلة.`;
  const history = state.history.find(item => q.includes(normalizeArabic(item.title)) || normalizeArabic(item.title).split(/\s+/).some(term => term.length > 3 && q.includes(term)));
  if (history) return `${history.title} — ${history.period}\n${history.body}${history.scope==='related_historical_region'?'\nنطاق تاريخي مرتبط خارج الحدود الإدارية الحالية لمديرية حبيش.':history.scope==='unverified_location'?'\nالنطاق الجغرافي لهذا السجل غير محسوم ويحتاج إلى تحقق.':''}`;
  return 'لم أعثر على إجابة في المحتوى المحلي المتاح. جرّب اسم عزلة أو حصن أو استخدم البحث في الأقسام. هذا المساعد لا يتصل حالياً بخدمة ذكاء اصطناعي خارجية.';
}

function appendChatMessage(type, text) {
  const log = document.getElementById('aiChatLog');
  const message = element('div', `chat-msg ${type === 'user' ? 'user' : 'assistant'}`, text);
  message.dir = 'auto';
  log.append(message);
  log.scrollTop = log.scrollHeight;
}

function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const question = cleanText(input.value, 500);
  if (!question) return;
  input.value = '';
  appendChatMessage('user', question);
  const answer = window.HubaishFeatures?.assistantAnswer?.(question) || localAssistantAnswer(question);
  appendChatMessage('assistant', answer);
}

function getYemenDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: YEMEN_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function dayOfYear(year, month, day) {
  const today = Date.UTC(year, month - 1, day);
  return Math.floor((today - Date.UTC(year, 0, 0)) / 86400000);
}

function localClockToTimestamp(year, month, day, minutes) {
  return Date.UTC(year, month - 1, day, 0, 0, 0) + (minutes - YEMEN_UTC_OFFSET_HOURS * 60) * 60000;
}

function computePrayerTimesForDate(dateParts) {
  const { year, month, day } = dateParts;
  const n = dayOfYear(year, month, day);
  const gamma = 2 * Math.PI / 365 * (n - 1);
  const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const latitude = YEMEN_LAT * Math.PI / 180;
  const solarNoon = 720 - 4 * YEMEN_LNG - equationOfTime + YEMEN_UTC_OFFSET_HOURS * 60;
  const hourAngleMinutes = altitude => {
    const altitudeRadians = altitude * Math.PI / 180;
    const cosine = (Math.sin(altitudeRadians) - Math.sin(latitude) * Math.sin(declination)) / (Math.cos(latitude) * Math.cos(declination));
    if (cosine < -1 || cosine > 1) return null;
    return Math.acos(cosine) * 180 / Math.PI * 4;
  };
  const fajrAngle = hourAngleMinutes(-18);
  const sunriseSunset = hourAngleMinutes(-0.833);
  const ishaAngle = hourAngleMinutes(-17.5);
  const asrAltitude = Math.atan(1 / (1 + Math.tan(Math.abs(latitude - declination)))) * 180 / Math.PI;
  const asrAngle = hourAngleMinutes(asrAltitude);
  const minuteValues = [
    ['الفجر', fajrAngle === null ? null : solarNoon - fajrAngle],
    ['الظهر', solarNoon],
    ['العصر', asrAngle === null ? null : solarNoon + asrAngle],
    ['المغرب', sunriseSunset === null ? null : solarNoon + sunriseSunset],
    ['العشاء', ishaAngle === null ? null : solarNoon + ishaAngle]
  ];
  return minuteValues.filter(([, minutes]) => Number.isFinite(minutes)).map(([name, minutes]) => ({ name, timestamp: localClockToTimestamp(year, month, day, minutes) }));
}

function computePrayerTimesForToday() {
  const parts = getYemenDateParts();
  return { date: parts, prayers: computePrayerTimesForDate(parts) };
}

function formatYemenTime(timestamp) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: YEMEN_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(timestamp));
}

function formatYemenDate(parts) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  return new Intl.DateTimeFormat(state.lang === 'AR' ? 'ar-YE' : state.lang === 'TR' ? 'tr-TR' : state.lang === 'FR' ? 'fr-FR' : 'en-GB', { timeZone: YEMEN_TIME_ZONE, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function updatePrayerUI() {
  const result = computePrayerTimesForToday();
  const now = Date.now();
  let next = result.prayers.find(prayer => prayer.timestamp > now);
  if (!next) {
    const tomorrowDate = new Date(Date.UTC(result.date.year, result.date.month - 1, result.date.day + 1, 12));
    const tomorrowParts = { year: tomorrowDate.getUTCFullYear(), month: tomorrowDate.getUTCMonth() + 1, day: tomorrowDate.getUTCDate() };
    next = computePrayerTimesForDate(tomorrowParts)[0];
  }
  const remaining = Math.max(0, Math.floor((next.timestamp - now) / 1000));
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  document.getElementById('prayerCountdown').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.getElementById('prayerDate').textContent = `${formatYemenDate(result.date)} • توقيت اليمن (UTC+3)`;
  const grid = document.getElementById('prayerGrid');
  grid.replaceChildren();
  result.prayers.forEach(prayer => {
    const item = element('div', `p-item${prayer.name === next.name && prayer.timestamp === next.timestamp ? ' active' : ''}`);
    item.append(element('div', 'p-name', prayer.name), element('div', 'p-time', formatYemenTime(prayer.timestamp)));
    grid.append(item);
  });
}

function renderRadar() {
  const box = document.getElementById('radarBox');
  if (window.HubaishCatalog?.renderCompass) return window.HubaishCatalog.renderCompass(box, state.places.filter(item => item.scope === 'hubaish_district'), state.lang);
  const items = state.places.filter(item => Number.isFinite(item.distKm));
  box.replaceChildren(element('h3', 'item-title', 'المسافات والاتجاهات التقديرية من مركز ظُلمة'), element('p', 'small muted', 'القيم تقديرية من بيانات النسخة وليست قياسات مسارات أو إحداثيات GPS مؤكدة.'));
  const list = element('div', 'radar-list');
  if (!items.length) list.append(element('p', 'muted', 'لا تتوفر بيانات مسافة للمعالم الحالية.'));
  items.forEach(item => {
    const row = element('div', 'radar-row');
    row.append(element('strong', '', item.title), element('span', '', `${item.distKm} كم • ${item.dir || 'غير محدد'}`));
    list.append(row);
  });
  box.append(list);
}

function handleAddPlace() {
  if (!window.HubaishFeatures?.isAdminUnlocked?.()) return showToast('افتح لوحة الإشراف برمز المرور أولاً.');
  const title = cleanText(document.getElementById('newPlaceTitle').value, 90);
  const loc = cleanText(document.getElementById('newPlaceLoc').value, 90) || 'مديرية حبيش';
  const body = cleanText(document.getElementById('newPlaceDesc').value, 700);
  const cat = document.getElementById('newPlaceCat').value;
  if (!title || !body) return showToast('أدخل اسم المعلم ووصفه.');
  if (state.places.length >= 200) return showToast('وصلت إلى الحد الأقصى للمعالم المحلية.');
  const added={id:makeId('place'),scope:'hubaish_district',cat:['fort','mosque','valley','mountain','market','school'].includes(cat)?cat:'fort',title,loc,body};
  state.places.unshift(added);window.HubaishCatalog?.autoTranslate?.(added);
  saveState(); renderAll(); renderRadar();
  ['newPlaceTitle', 'newPlaceLoc', 'newPlaceDesc'].forEach(id => { document.getElementById(id).value = ''; });
  showToast('تم حفظ المعلم على هذا الجهاز.');
}

function handleAddSocial() {
  const name = cleanText(document.getElementById('newSocialName').value, 70);
  const url = cleanText(document.getElementById('newSocialUrl').value, 500);
  if (!name || !validHttpUrl(url)) return showToast('أدخل اسماً ورابط HTTP أو HTTPS صحيحاً.');
  if (state.socials.length >= 50) return showToast('وصلت إلى الحد الأقصى للروابط.');
  state.socials.push({ name, url });
  saveState(); renderSocials();
  document.getElementById('newSocialName').value = '';
  document.getElementById('newSocialUrl').value = '';
  showToast('تمت إضافة الرابط محلياً.');
}

function exportBackup() {
  const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = element('a');
  anchor.href = url;
  anchor.download = 'hubaish-guide-backup.json';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) return showToast('حجم ملف النسخة الاحتياطية يتجاوز 1 ميغابايت.');
  try {
    const parsed = JSON.parse(await file.text());
    const candidate = parsed && parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || !Array.isArray(candidate.places)) throw new Error('invalid schema');
    const incoming = normalizeState(candidate);
    if (incoming.places.length === 0 && candidate.places.length > 0) throw new Error('invalid place records');
    state = incoming;
    applyTheme(state.theme);
    applyLang(state.lang);
    renderAll();
    renderRadar();
    showToast('تم استيراد البيانات والتحقق من الحقول.');
  } catch {
    showToast('ملف JSON غير صالح أو لا يطابق بنية النسخة الاحتياطية.');
  } finally {
    document.getElementById('importJsonInput').value = '';
  }
}

function resetLocalData() {
  if (!window.HubaishFeatures?.isAdminUnlocked?.()) return showToast('افتح لوحة الإشراف برمز المرور أولاً.');
  if (!window.confirm('سيتم حذف الإضافات والمفضلة والإعدادات المحلية وإعادة البيانات الافتراضية. هل تريد المتابعة؟')) return;
  state = normalizeState({});
  window.HubaishFeatures?.reset?.();
  saveState();
  applyTheme(state.theme);
  applyLang(state.lang);
  renderAll();
  renderRadar();
  renderFavorites();
  showToast('تمت إعادة البيانات المحلية.');
}

function getReaderScale(){const value=Number(localStorage.getItem('hubaish_reader_scale')||'1');return Number.isFinite(value)?Math.max(.88,Math.min(1.18,value)):1}
function setReaderScale(value){
  const scale=Math.max(.88,Math.min(1.18,Math.round(value*100)/100));
  localStorage.setItem('hubaish_reader_scale',String(scale));
  document.documentElement.style.fontSize=(16*scale)+'px';
}
function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
  document.getElementById('homeLogoBtn').addEventListener('click', () => { switchTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.getElementById('themeToggleBtn').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
  setReaderScale(getReaderScale());
  document.getElementById('readerFontDecrease')?.addEventListener('click',()=>setReaderScale(getReaderScale()-.04));
  document.getElementById('readerFontIncrease')?.addEventListener('click',()=>setReaderScale(getReaderScale()+.04));
  document.getElementById('readerFontReset')?.addEventListener('click',()=>setReaderScale(1));
  document.getElementById('readerOpenFavorites')?.addEventListener('click',()=>document.getElementById('favOpenBtn')?.click());
  document.getElementById('readerToggleTheme')?.addEventListener('click',()=>applyTheme(state.theme==='dark'?'light':'dark'));
  const languageSelect = document.getElementById('langSelect');
  languageSelect?.addEventListener('change', () => applyLang(languageSelect.value));
  const languagePickerButton = document.getElementById('languagePickerButton');
  const languagePickerMenu = document.getElementById('languagePickerMenu');
  languagePickerButton?.addEventListener('click', () => {
    if (!languagePickerMenu) return;
    languagePickerMenu.hidden = !languagePickerMenu.hidden;
    languagePickerButton.setAttribute('aria-expanded', String(!languagePickerMenu.hidden));
  });
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => applyLang(button.dataset.language)));
  document.addEventListener('click', event => {
    if (event.target.closest('.language-picker')) return;
    if (languagePickerMenu) languagePickerMenu.hidden = true;
    languagePickerButton?.setAttribute('aria-expanded', 'false');
  });
  document.getElementById('globalSearchInput').addEventListener('input', event => renderGlobalSearch(event.target.value));
  document.getElementById('histSearchInput').addEventListener('input', event => renderHistory(currentEra, event.target.value));
  document.getElementById('placeSearchInput').addEventListener('input', event => renderPlaces(currentPlaceCategory, event.target.value));
  document.getElementById('uzalSearchInput').addEventListener('input', event => renderUzal(event.target.value));
  document.querySelectorAll('#histFilters [data-era]').forEach(button => button.addEventListener('click', () => {
    currentEra = button.dataset.era;
    document.querySelectorAll('#histFilters [data-era]').forEach(item => item.classList.toggle('active', item === button));
    renderHistory(currentEra, document.getElementById('histSearchInput').value);
  }));
  document.querySelectorAll('#placeFilters [data-pcat]').forEach(button => button.addEventListener('click', () => {
    currentPlaceCategory = button.dataset.pcat;
    document.querySelectorAll('#placeFilters [data-pcat]').forEach(item => item.classList.toggle('active', item === button));
    renderPlaces(currentPlaceCategory, document.getElementById('placeSearchInput').value);
  }));
  document.getElementById('radarToggleBtn').addEventListener('click', () => {
    const box = document.getElementById('radarBox');
    const willOpen = box.classList.contains('hidden');
    box.classList.toggle('hidden', !willOpen);
    if (willOpen) renderRadar();
  });
  document.getElementById('favOpenBtn').addEventListener('click', () => { renderFavorites(); openModal('favModal'); });
  document.getElementById('openAiBtn')?.addEventListener('click', () => openModal('aiModal'));
  document.getElementById('aiForm').addEventListener('submit', event => { event.preventDefault(); sendAiMessage(); });
  document.getElementById('openAiBtn')?.addEventListener('keydown', event => { if (event.key === 'Enter') openModal('aiModal'); });
  document.getElementById('addPlaceSaveBtn')?.addEventListener('click', handleAddPlace);
  // Social administration is handled by the extended local admin panel.
  // Full-state JSON export is handled by the extended feature layer.
  // Full-state JSON import is handled by the extended feature layer.
  document.getElementById('resetLocalBtn')?.addEventListener('click', resetLocalData);
  document.body.addEventListener('click', event => {
    const image = event.target.closest('[data-lightbox-src]');
    if (image) {
      const source = image.dataset.lightboxSrc;
      const preview = document.getElementById('imageLightboxImage');
      const caption = document.getElementById('imageLightboxCaption');
      if (preview && validHttpUrl(source)) {
        preview.src = source;
        preview.alt = image.dataset.lightboxAlt || image.alt || '';
        if (caption) caption.textContent = preview.alt;
        openModal('imageLightbox');
      }
      return;
    }
    const explored = event.target.closest('[data-explore-id]');
    if (explored) window.HubaishFeatures?.markExplored?.(explored.dataset.exploreId, explored.dataset.exploreKind);
    const fav = event.target.closest('[data-fav-id]');
    if (fav) toggleFavorite(fav.dataset.favId);
    const share = event.target.closest('[data-share]');
    if (share) {
      const item = findDirectoryItem(share.dataset.share);
      if (item) {
        const url = item.sourceUrl && validHttpUrl(item.sourceUrl) ? item.sourceUrl : location.href;
        const text = [item.title, item.period || item.loc || '', item.body, item.source || ''].filter(Boolean).join('\n');
        if (navigator.share) {
          navigator.share({ title: item.title, text, url }).catch(() => {});
        } else if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text + '\n' + url)
            .then(() => showToast('تم نسخ بطاقة المشاركة.'))
            .catch(() => showToast(text + '\n' + url));
        } else {
          showToast(text + '\n' + url);
        }
      }
      return;
    }
    const detail = event.target.closest('[data-detail]');
    if (detail) window.HubaishFeatures?.showDetail?.(detail.dataset.detail);
    const ask = event.target.closest('[data-ask]');
    if (ask) {
      openModal('aiModal');
      document.getElementById('aiInput').value = ask.dataset.ask || '';
      sendAiMessage();
    }
    const close = event.target.closest('[data-close]');
    if (close) closeModal(close.dataset.close);
  });
  document.querySelectorAll('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal.id); }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(modal => closeModal(modal.id)); });
  bindVoiceMic('globalMicBtn', 'globalSearchInput');
  bindVoiceMic('histMicBtn', 'histSearchInput');
  bindVoiceMic('placeMicBtn', 'placeSearchInput');
  bindVoiceMic('uzalMicBtn', 'uzalSearchInput');
  bindVoiceMic('aiMicBtn', 'aiInput');
  // The single visible language selector drives all four interface locales.
  const offlineIndicator = document.getElementById('offlineIndicator');
  const updateNetworkState = () => { if (offlineIndicator) offlineIndicator.hidden = navigator.onLine; };
  updateNetworkState();
  window.addEventListener('online', () => { updateNetworkState(); showToast('عاد الاتصال بالإنترنت.'); });
  window.addEventListener('offline', () => { updateNetworkState(); showToast('أنت الآن دون اتصال. المحتوى المحفوظ متاح.'); });
}

function bindServiceWorkerUpdates() {
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
  const banner = document.getElementById('swUpdateBanner');
  const updateButton = document.getElementById('swUpdateBtn');
  let registrationRef = null;
  let reloading = false;
  const offerUpdate = registration => {
    if (!registration?.waiting || !navigator.serviceWorker.controller || !banner) return;
    banner.classList.remove('hidden');
    updateButton?.addEventListener('click', () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }), { once: true });
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  navigator.serviceWorker.register(new URL('./sw.js', document.baseURI).href)
    .then(registration => {
      registrationRef = registration;
      offerUpdate(registration);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed') offerUpdate(registration);
        });
      });
      registration.update().catch(() => {});
    })
    .catch(() => showToast('تعذر تفعيل وضع العمل دون إنترنت.'));
  window.addEventListener('online', () => registrationRef?.update?.().catch(() => {}));
}

function init() {
  state = normalizeState(state);
  state.tab = 'home';
  let baselinePlaces = [];
  let baselineHistory = [];
  let baselinePlaceIds = new Set();
  let baselineHistoryIds = new Set();
  window.HubaishRuntime = {
    get places(){ return state.places; }, get history(){ return state.history; },
    renderAll: renderAll,
    applyCloudData(data) {
      const incoming = data || {};
      const mergeById = (base, additions) => {
        const merged = new Map((base || []).map(item => [String(item.id || ''), item]));
        for (const item of additions || []) {
          if (!item || !item.id) continue;
          merged.set(String(item.id), item);
        }
        return [...merged.values()];
      };
      const localPlaces = state.places.filter(item =>
        !baselinePlaceIds.has(String(item.id || '')) &&
        !String(item.id || '').startsWith('cms-landmark-'));
      const localHistory = state.history.filter(item =>
        !baselineHistoryIds.has(String(item.id || '')) &&
        !String(item.id || '').startsWith('cms-history_event-'));
      state.places = mergeById([...baselinePlaces.map(item => ({...item})), ...localPlaces], incoming.landmarks || []);
      state.history = mergeById([...baselineHistory.map(item => ({...item})), ...localHistory], incoming.history || []);
      state.socials = state.socials.filter(item => !item.cloudId).concat((incoming.links || []).filter(item => item?.url && item?.name));
    }
  };
  applyTheme(state.theme);
  applyLang(state.lang);
  if(window.HubaishCatalog?.seed?.(state))saveState();
  baselinePlaces = state.places.map(item => ({...item}));
  baselineHistory = state.history.map(item => ({...item}));
  baselinePlaceIds = new Set(baselinePlaces.map(item => String(item.id || '')));
  baselineHistoryIds = new Set(baselineHistory.map(item => String(item.id || '')));
  const bootReport = {
    landmarks: state.places.length, history: state.history.length,
    subDistricts: window.HubaishFeatures?.getUzal?.().length || UZAL_22.length,
    people: window.HubaishCatalog?.people?.length || 0,
    references: window.HubaishCatalog?.refs?.length || 0,
    quiz: window.HubaishCatalog?.quiz?.length || 0
  };
  window.HubaishRuntime.bootReport = bootReport;
  if (bootReport.landmarks < 19 || bootReport.history < 7 || bootReport.subDistricts < 22 || bootReport.people < 4 || bootReport.references < 1 || bootReport.quiz < 10) console.error('[Hubaish] Core catalog incomplete at boot:', bootReport);
  else console.info('[Hubaish] Boot check passed:', bootReport);
  window.HubaishCloud?.applyCached?.();
  initMoreSmartTabs();
  initAdminSubtabs();
  initCmsTranslationDisclosure();
  initFloatingAssistant();
  bindEvents();
  renderAll();
  renderRadar();
  updatePrayerUI();
  initCustomSelects();
  switchTab('home');
  window.HubaishCloud?.start?.();
  window.setInterval(updatePrayerUI, 1000);
  bindServiceWorkerUpdates();
}


function localizeHomeStaticContent() {
  const t = I18N[state.lang] || I18N.AR;
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    const key = node.dataset.i18nPlaceholder;
    if (t[key]) node.setAttribute('placeholder', t[key]);
  });
  const note = document.getElementById('dataSourceNote');
  if (note) {
    const notes = {
      AR: 'المساحة الإدارية 228 كم² وفق المركز الوطني للمعلومات ومنصة الحكم المحلي/OCHA. السكان: 105,998 في تعداد 2004؛ وتقدير HNRP/OCHA لعام 2025 هو 162,023 ويشمل المقيمين والنازحين. لا تجمع الرقمين ولا تعرض تقدير 2025 كتعداد. سوق حبيش الأسبوعي يوم الجمعة بحسب الجدول المنشور، مع ضرورة التأكيد محلياً.',
      EN: 'Administrative area: 228 km², reported by the National Information Centre and OCHA/local governance. Population: 105,998 in the 2004 census; the 2025 HNRP/OCHA estimate is 162,023 and includes residents and IDPs. Keep the two years and methods separate. Friday is listed for Hubaish weekly market; confirm locally.',
      TR: 'İdari alan 228 km². Nüfus: 2004 sayımında 105.998; 2025 HNRP/OCHA tahmini 162.023 olup yerleşikleri ve ülke içinde yerinden edilmiş kişileri kapsar. İki veri ayrı tutulur. Haftalık Hubaish pazarı için Cuma belirtilir; yerelden doğrulayın.',
      FR: 'Superficie administrative : 228 km². Population : 105 998 au recensement de 2004; estimation HNRP/OCHA 2025 : 162 023, résidents et déplacés internes compris. Les deux chiffres restent séparés. Le vendredi est indiqué pour le marché hebdomadaire; confirmez localement.'
    };
    note.textContent = notes[state.lang] || notes.AR;
  }

  const geoAdmin = document.getElementById('geoAdminContext');
  if (geoAdmin) geoAdmin.textContent = ({
    AR: 'المساحة 228 كم² وفق المركز الوطني للمعلومات وOCHA/الحكم المحلي. تعداد 2004: 105,998 نسمة. تقدير 2025: 162,023 ويشمل السكان المقيمين والنازحين داخلياً. سوق حبيش الأسبوعي يوم الجمعة بحسب الجدول المنشور؛ أكد الموعد محلياً قبل الزيارة.',
    EN: 'Area: 228 km² (National Information Centre and OCHA/local governance). 2004 census: 105,998. 2025 estimate: 162,023, including residents and IDPs. Friday is listed for the weekly Hubaish market; confirm locally before visiting.',
    TR: 'Alan: 228 km² (Ulusal Bilgi Merkezi ve OCHA/yerel yönetim). 2004 sayımı: 105.998. 2025 tahmini: yerleşikler ve ülke içinde yerinden edilmiş kişiler dahil 162.023. Haftalık pazar için Cuma belirtilir; ziyaret öncesi yerelden doğrulayın.',
    FR: 'Superficie : 228 km² (Centre national d’information et OCHA/administration locale). Recensement 2004 : 105 998. Estimation 2025 : 162 023, résidents et déplacés internes compris. Le vendredi est indiqué pour le marché hebdomadaire; confirmez localement avant la visite.'
  })[state.lang] || '';
  const geoTribal = document.getElementById('geoTribalContext');
  if (geoTribal) geoTribal.textContent = ({
    AR: 'تورد المراجع النسبية بطوناً من همدان وخولان العالية، منها آل راجح وبنو الصوفي وآل أبي حليقة وبنو السعيدي، بوصفها سياقاً تاريخياً نسبياً لا تعداداً قبلياً معاصراً. ويجب التمييز بين حبيش إب ومخلاف الحبيشية في سياق دمت/رداع و«ذو حبيش» في سفيان وسحار. فرضيات الاسم السبئية أو المعينية أو الحميرية قراءات بحثية غير محسومة.',
    EN: 'Genealogical references associate branches of Hamdan and Upper Khawlan with this historical context, including Al Rajih, Bani al-Sufi, Al Abi Hulayqa and Bani al-Saidi. This is historical lineage context, not a present-day tribal census. Distinguish Hubaish in Ibb from al-Hubayshiyya in the Dhamt/Rada’a context and Dhu Hubaish in Sufyan/Sahar. Sabaean, Minaean and Himyarite name-origin proposals remain research hypotheses.',
    TR: 'Nesep kaynakları Hamdan ve Yukarı Khawlan kollarını tarihî bağlamda anar; bu bilgi güncel nüfus sayımı değildir. İbb’deki Hubaish, Dhamt/Rada’a bağlamındaki al-Hubayshiyya ve Sufyan/Sahar’daki Dhu Hubaish birbirinden ayrılmalıdır. Sebeî, Mainî ve Himyerî köken önerileri araştırma varsayımlarıdır.',
    FR: 'Les références généalogiques relient certaines branches de Hamdan et de Khawlan supérieure à ce contexte historique; il ne s’agit pas d’un recensement tribal actuel. Distinguer Hubaish à Ibb, al-Hubayshiyya dans le contexte Dhamt/Rada’a et Dhu Hubaish à Sufyan/Sahar. Les hypothèses d’origine sabéenne, minéenne ou himyarite restent des pistes de recherche.'
  })[state.lang] || '';

  refreshMoreTabLabels();
}
function initMoreSmartTabs() {
  const view = document.getElementById('view-more');
  if (!view || view.dataset.smartTabsReady === 'true') return;
  const header = view.querySelector(':scope > .section-header');
  if (!header) return;
  const tabs = document.createElement('div');
  tabs.className = 'more-tabs-nav';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', (I18N[state.lang] || I18N.AR).moreSections);
  const panels = document.createElement('div');
  panels.className = 'more-tabs-panels';
  const defs = [
    ['explore','moreExplore'],
    ['tools','moreTools'],
    ['personal','morePersonal'],
    ['admin','moreAdmin']
  ];
  defs.forEach((def,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'more-tab-button';
    button.dataset.moreTab = def[0];
    button.dataset.i18n = def[1];
    button.setAttribute('role','tab');
    button.setAttribute('aria-selected',String(index===0));
    button.addEventListener('click',() => switchMoreTab(def[0]));
    tabs.append(button);
    const pane = document.createElement('div');
    pane.className = 'more-tab-panel' + (index===0?' active':'');
    pane.dataset.morePanel = def[0];
    pane.setAttribute('role','tabpanel');
    panels.append(pane);
  });
  header.after(tabs,panels);
  const pane = key => panels.querySelector('[data-more-panel="'+key+'"]');
  const move = (selector,target,closestSelector) => {
    const node = view.querySelector(selector);
    if (!node) return null;
    const card = closestSelector ? node.closest(closestSelector) : node;
    if (card && card.parentElement) target.append(card);
    return card;
  };
  move('#explorerTitle',pane('explore'),'article');
  move('#quizSectionTitle',pane('explore'),'article');
  move('#hubaishGallery',pane('explore'));
  move('.smart-tool-grid',pane('tools'));
  move('#assistantMoreTitle',pane('tools'),'article');
  const favorites = document.createElement('article');
  favorites.className = 'item-card hub-panel more-favorites-card';
  const favTitle = document.createElement('h3');
  favTitle.className = 'item-title';
  favTitle.dataset.i18n = 'moreFavorites';
  const favButton = document.createElement('button');
  favButton.type = 'button';
  favButton.className = 'btn-primary';
  favButton.dataset.openFavorites = 'true';
  favButton.addEventListener('click',() => document.getElementById('favOpenBtn')?.click());
  favorites.append(favTitle,favButton);
  pane('personal').append(favorites);
  move('.hub-community',pane('personal'));
  move('#peopleList',pane('personal'),'article');
  move('#referenceList',pane('personal'),'article');
  move('#socialLinksList',pane('personal'),'article');
  move('#contributionForm',pane('personal'),'article');
  move('.reading-settings',pane('personal'));
  move('.privacy-policy',pane('personal'));
  const about = document.createElement('article');
  about.className = 'item-card hub-panel more-about-card';
  const aboutTitle = document.createElement('h3');
  aboutTitle.className = 'item-title';
  aboutTitle.dataset.i18n = 'moreDistrict';
  const aboutButton = document.createElement('button');
  aboutButton.type = 'button';
  aboutButton.className = 'btn-secondary';
  aboutButton.dataset.i18n = 'openGeoProfile';
  aboutButton.textContent = (I18N[state.lang] || I18N.AR).openGeoProfile;
  aboutButton.addEventListener('click',() => {
    switchTab('home');
    document.getElementById('geoProfileTitle')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  about.append(aboutTitle,aboutButton);
  pane('personal').append(about);
  move('#cloudAdminCard',pane('admin'));
  view.dataset.smartTabsReady = 'true';
  refreshMoreTabLabels();
  switchMoreTab('explore');
}
function switchMoreTab(key) {
  const view = document.getElementById('view-more');
  if (!view) return;
  const valid = ['explore','tools','personal','admin'];
  if (!valid.includes(key)) return;
  view.querySelectorAll('[data-more-tab]').forEach(button => {
    const active = button.dataset.moreTab === key;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  view.querySelectorAll('[data-more-panel]').forEach(panel => panel.classList.toggle('active',panel.dataset.morePanel === key));
  view.dataset.activeMoreTab = key;
}
function refreshMoreTabLabels() {
  const t = I18N[state.lang] || I18N.AR;
  document.querySelectorAll('[data-more-tab]').forEach(button => {
    const key = button.dataset.i18n;
    if (t[key]) button.textContent = t[key];
  });
  document.querySelectorAll('[data-admin-tab]').forEach(button => {
    const key = button.dataset.i18n;
    if (t[key]) button.textContent = t[key];
  });
  document.querySelectorAll('[data-open-favorites]').forEach(button => {
    button.textContent = t.moreFavorites || 'Favorites';
  });
  document.querySelectorAll('.more-about-card button').forEach(button => {
    button.textContent = ({AR:'فتح الملف الجغرافي',EN:'Open geographic profile',TR:'Coğrafi profili aç',FR:'Ouvrir le profil géographique'})[state.lang] || 'فتح الملف الجغرافي';
  });
  syncAdminSubtabsVisibility();
}
function initAdminSubtabs() {
  const panel = document.getElementById('cloudAdminPanel');
  const superPanel = document.getElementById('cloudSuperAdminPanel');
  if (!panel || !superPanel || panel.dataset.smartTabsReady === 'true') return;
  const overview = panel.querySelector('.cloud-dashboard-overview');
  const editor = document.getElementById('cloudContentEditor');
  const manager = panel.querySelector('.cloud-manager-section');
  const note = superPanel.nextElementSibling?.tagName === 'P' ? superPanel.nextElementSibling : null;
  const auditList = document.getElementById('cloudAuditList');
  const auditTitle = auditList?.previousElementSibling;
  const backup = superPanel.querySelector('.cloud-backup-tools');
  const host = document.createElement('div');
  host.className = 'cloud-admin-tabs';
  const nav = document.createElement('div');
  nav.className = 'admin-subtabs-nav';
  nav.setAttribute('role','tablist');
  const panes = document.createElement('div');
  panes.className = 'admin-subtabs-panels';
  const definitions = [
    ['edit','adminTabEdit',false],
    ['review','adminTabReview',false],
    ['list','adminTabList',false],
    ['users','adminTabUsers',true],
    ['audit','adminTabAudit',true]
  ];
  definitions.forEach((def,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-subtab-button';
    button.dataset.adminTab = def[0];
    button.dataset.i18n = def[1];
    button.setAttribute('role','tab');
    button.setAttribute('aria-selected',String(index===0));
    if (def[2]) button.dataset.adminRoleRequired = 'true';
    button.addEventListener('click',() => switchAdminTab(def[0]));
    nav.append(button);
    const paneNode = document.createElement('div');
    paneNode.className = 'admin-subtab-panel' + (index===0?' active':'');
    paneNode.dataset.adminPanel = def[0];
    paneNode.setAttribute('role','tabpanel');
    if (def[2]) paneNode.dataset.adminRoleRequired = 'true';
    panes.append(paneNode);
  });
  host.append(nav,panes);
  panel.append(host);
  const target = key => panes.querySelector('[data-admin-panel="'+key+'"]');
  if (editor) target('edit').append(editor);
  const photoReview = document.getElementById('cloudPhotoReviewPanel');
  if (photoReview) target('review').append(photoReview);
  if (overview) target('list').append(overview);
  if (note) target('list').append(note);
  if (manager) target('list').append(manager);
  target('users').append(superPanel);
  if (auditTitle) target('audit').append(auditTitle);
  if (auditList) target('audit').append(auditList);
  if (backup) target('audit').append(backup);
  panel.dataset.smartTabsReady = 'true';
  window.HubaishSyncAdminTabs = syncAdminSubtabsVisibility;
  switchAdminTab('edit');
  syncAdminSubtabsVisibility();
}
function switchAdminTab(key) {
  const panel = document.getElementById('cloudAdminPanel');
  if (!panel) return;
  panel.querySelectorAll('[data-admin-tab]').forEach(button => {
    const active = button.dataset.adminTab === key;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  panel.querySelectorAll('[data-admin-panel]').forEach(pane => pane.classList.toggle('active',pane.dataset.adminPanel === key));
  panel.dataset.activeAdminTab = key;
}
function syncAdminSubtabsVisibility() {
  const superPanel = document.getElementById('cloudSuperAdminPanel');
  const isSuper = !!superPanel && !superPanel.classList.contains('hidden');
  const panel = document.getElementById('cloudAdminPanel');
  if (!panel) return;
  panel.querySelectorAll('[data-admin-role-required]').forEach(node => node.classList.toggle('hidden',!isSuper));
  const active = panel.dataset.activeAdminTab || 'edit';
  if (!isSuper && ['users','audit'].includes(active)) switchAdminTab('edit');
}
function initCmsTranslationDisclosure() {
  const form = document.getElementById('cloudContentForm');
  if (!form || form.dataset.localeDisclosureReady === 'true') return;
  const grid = form.querySelector('.cloud-fields-grid');
  if (!grid) return;
  const labels = [...grid.querySelectorAll(':scope > label')].filter(label => {
    const field = label.querySelector('input[id],textarea[id]');
    return field && /(En|Tr|Fr)$/.test(field.id);
  });
  if (!labels.length) return;
  const disclosure = document.createElement('details');
  disclosure.className = 'cloud-locale-disclosure';
  const summary = document.createElement('summary');
  summary.dataset.i18n = 'cloudLocaleSummary';
  disclosure.append(summary);
  labels.forEach(label => disclosure.append(label));
  grid.append(disclosure);
  form.dataset.localeDisclosureReady = 'true';
}
function initCustomSelects() {
  if (window.HubaishCustomSelectsReady || !document.body) return;
  window.HubaishCustomSelectsReady = true;
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-select-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML = '<section class="custom-select-sheet" role="dialog" aria-modal="true" aria-labelledby="customSelectTitle"><div class="custom-select-sheet-head"><div><span class="custom-select-eyebrow">HUBAISH</span><h3 id="customSelectTitle">اختر خياراً</h3></div><button class="custom-select-close" type="button" aria-label="إغلاق">×</button></div><div class="custom-select-options" role="listbox"></div></section>';
  document.body.append(backdrop);
  const sheetTitle = backdrop.querySelector('#customSelectTitle');
  const optionsRoot = backdrop.querySelector('.custom-select-options');
  const closeButton = backdrop.querySelector('.custom-select-close');
  let activeSelect = null;
  let lastTrigger = null;
  const localizedOptions = {
    AR:{all:'الكل',place:'معلم أو موقع',history:'معلومة تاريخية',uzal:'عزلة أو قرية',correction:'تصحيح معلومة',person:'شخصية أو علم',landmark:'معلم',history_event:'محطة تاريخية',sub_district:'تعديل إحدى العزل الـ22',sub_district_update:'قرية أو موضع داخل عزلة',historical_figure:'شخصية أو علم',community_link:'رابط مجتمع',editor:'محرر',super_admin:'مشرف عام'},
    EN:{all:'All',place:'Landmark or place',history:'Historical information',uzal:'Sub-district or village',correction:'Correction',person:'Person or notable figure',landmark:'Landmark',history_event:'Historical event',sub_district:'Edit one of the 22 sub-districts',sub_district_update:'Village or place in a sub-district',historical_figure:'Historical figure',community_link:'Community link',editor:'Editor',super_admin:'Super administrator'},
    TR:{all:'Tümü',place:'Yer veya mekân',history:'Tarihî bilgi',uzal:'Bucak veya köy',correction:'Düzeltme',person:'Kişi veya önemli şahsiyet',landmark:'Yer',history_event:'Tarihî olay',sub_district:'22 bucaktan birini düzenle',sub_district_update:'Bucaktaki köy veya yer',historical_figure:'Tarihî şahsiyet',community_link:'Topluluk bağlantısı',editor:'Editör',super_admin:'Süper yönetici'},
    FR:{all:'Tous',place:'Monument ou lieu',history:'Information historique',uzal:'Sous-district ou village',correction:'Correction',person:'Personnalité',landmark:'Monument',history_event:'Événement historique',sub_district:'Modifier l’un des 22 sous-districts',sub_district_update:'Village ou lieu du sous-district',historical_figure:'Personnalité historique',community_link:'Lien communautaire',editor:'Éditeur',super_admin:'Super administrateur'}
  };
  const labels = {
    comparePlaceA:{AR:'المعلم الأول',EN:'First landmark',TR:'İlk yer',FR:'Premier lieu'},
    comparePlaceB:{AR:'المعلم الثاني',EN:'Second landmark',TR:'İkinci yer',FR:'Deuxième lieu'},
    contribType:{AR:'نوع المساهمة',EN:'Contribution type',TR:'Katkı türü',FR:'Type de contribution'},
    cloudContentFilter:{AR:'تصفية المحتوى',EN:'Filter content',TR:'İçeriği filtrele',FR:'Filtrer le contenu'},
    newAdminRole:{AR:'صلاحية الحساب',EN:'Account role',TR:'Hesap rolü',FR:'Rôle du compte'},
    cloudRecordType:{AR:'نوع المحتوى',EN:'Content type',TR:'İçerik türü',FR:'Type de contenu'},
    favTypeFilter:{AR:'نوع المفضلة',EN:'Favorite type',TR:'Favoris',FR:'Type de favori'}
  };
  const translateOption = (select,option) => {
    if (['comparePlaceA','comparePlaceB'].includes(select.id)) return option.textContent;
    const dictionary = localizedOptions[state.lang] || localizedOptions.AR;
    return dictionary[option.value] || option.textContent;
  };
  const sync = (select,host) => {
    if (!select || !host) return;
    const trigger = host.querySelector('.custom-select-trigger');
    if (!trigger) return;
    const option = select.selectedOptions?.[0];
    const translated = option ? translateOption(select,option) : '';
    trigger.querySelector('.custom-select-value').textContent = translated || ({AR:'اختر خياراً',EN:'Choose an option',TR:'Bir seçenek seçin',FR:'Choisir une option'})[state.lang];
    trigger.disabled = select.disabled;
    trigger.setAttribute('aria-label',labels[select.id]?.[state.lang] || select.getAttribute('aria-label') || labels[select.id]?.AR || 'Choose an option');
    const chevron = trigger.querySelector('.custom-select-chevron');
    if (chevron) chevron.textContent = '⌄';
  };
  const close = () => {
    backdrop.hidden = true;
    if (lastTrigger) lastTrigger.focus({preventScroll:true});
    activeSelect = null;
    lastTrigger = null;
  };
  const open = (select,trigger) => {
    activeSelect = select;
    lastTrigger = trigger;
    const lang = state.lang || 'AR';
    sheetTitle.textContent = labels[select.id]?.[lang] || select.getAttribute('aria-label') || ({AR:'اختر خياراً',EN:'Choose an option',TR:'Bir seçenek seçin',FR:'Choisir une option'})[lang];
    optionsRoot.replaceChildren();
    const options = [...select.options].filter(option => !option.hidden);
    if (!options.length) {
      const empty = document.createElement('p');
      empty.className = 'custom-select-empty';
      empty.textContent = ({AR:'لا توجد خيارات متاحة بعد.',EN:'No options are available yet.',TR:'Henüz seçenek yok.',FR:'Aucune option disponible pour le moment.'})[lang];
      optionsRoot.append(empty);
    }
    options.forEach(option => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'custom-select-option' + (option.value === select.value ? ' selected' : '');
      item.setAttribute('role','option');
      item.setAttribute('aria-selected',String(option.value === select.value));
      item.disabled = option.disabled;
      const text = document.createElement('span');
      text.textContent = translateOption(select,option);
      const icon = document.createElement('span');
      icon.className = 'custom-select-check';
      icon.textContent = option.value === select.value ? '✓' : '';
      item.append(text,icon);
      item.addEventListener('click',() => {
        select.value = option.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        sync(select,select.parentElement);
        close();
      });
      optionsRoot.append(item);
    });
    backdrop.hidden = false;
    backdrop.querySelector('.custom-select-sheet')?.focus?.({preventScroll:true});
    window.requestAnimationFrame?.(() => optionsRoot.querySelector('.selected')?.scrollIntoView({block:'nearest'}));
  };
  const enhance = select => {
    if (!(select instanceof HTMLSelectElement) || select.classList.contains('language-sync-select')) return;
    if (select.dataset.customSelectReady === 'true') {
      sync(select,select.parentElement);
      return;
    }
    const host = document.createElement('span');
    host.className = 'custom-select-host';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = '<span class="custom-select-value"></span><span class="custom-select-chevron" aria-hidden="true">⌄</span>';
    select.dataset.customSelectReady = 'true';
    select.classList.add('custom-select-native');
    select.setAttribute('aria-hidden','true');
    select.tabIndex = -1;
    select.parentNode.insertBefore(host,select);
    host.append(select,trigger);
    trigger.addEventListener('click',() => open(select,trigger));
    sync(select,host);
  };
  const process = root => {
    if (root instanceof HTMLSelectElement) enhance(root);
    root.querySelectorAll?.('select:not(.language-sync-select)').forEach(enhance);
  };
  process(document);
  const observer = new MutationObserver(records => records.forEach(record => {
    record.addedNodes.forEach(node => {
      if (node.nodeType === 1) process(node);
    });
    if (record.target instanceof HTMLSelectElement) sync(record.target,record.target.parentElement);
  }));
  observer.observe(document.body,{childList:true,subtree:true});
  closeButton.addEventListener('click',close);
  backdrop.addEventListener('click',event => {if(event.target===backdrop)close()});
  document.addEventListener('keydown',event => {if(event.key==='Escape'&&!backdrop.hidden)close()});
  document.addEventListener('hubaish:languagechange',() => document.querySelectorAll('select:not(.language-sync-select)').forEach(select => {
    const dictionary=localizedOptions[state.lang]||localizedOptions.AR;
    [...select.options].forEach(option=>{if(!['comparePlaceA','comparePlaceB'].includes(select.id)&&dictionary[option.value])option.dataset.originalText=option.dataset.originalText||option.textContent;});
    sync(select,select.parentElement);
  }));
  window.HubaishRefreshCustomSelects = () => document.querySelectorAll('select:not(.language-sync-select)').forEach(select=>sync(select,select.parentElement));
}
function initFloatingAssistant() {
  if (document.getElementById('aiFabWrap')) return;
  const wrap = document.createElement('div');
  wrap.id = 'aiFabWrap';
  wrap.className = 'ai-fab-wrap';
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.id = 'aiFabOpen';
  launch.className = 'ai-fab ai-fab-launcher';
  launch.setAttribute('aria-label','Open Hubaish assistant');
  launch.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z"/></svg><span class="ai-fab-label"></span>';
  const minimize = document.createElement('button');
  minimize.type = 'button';
  minimize.className = 'ai-fab-minimize';
  minimize.setAttribute('aria-label','Minimize assistant launcher');
  minimize.textContent = '−';
  const restore = document.createElement('button');
  restore.type = 'button';
  restore.className = 'ai-fab-restore';
  restore.setAttribute('aria-label','Show assistant launcher');
  restore.textContent = '✦';
  wrap.append(launch,minimize,restore);
  document.body.append(wrap);
  const labels = {
    AR:['مساعد حبيش','فتح مساعد دليل حبيش','تصغير المساعد','إظهار المساعد'],
    EN:['Hubaish AI','Open Hubaish assistant','Minimize assistant','Show assistant'],
    TR:['Hubaish Asistanı','Hubaish asistanını aç','Asistanı küçült','Asistanı göster'],
    FR:['Assistant Hubaish','Ouvrir l’assistant Hubaish','Réduire l’assistant','Afficher l’assistant']
  };
  const update = () => {
    const t = labels[state.lang] || labels.AR;
    launch.querySelector('.ai-fab-label').textContent = t[0];
    launch.setAttribute('aria-label',t[1]);
    minimize.setAttribute('aria-label',t[2]);
    restore.setAttribute('aria-label',t[3]);
  };
  update();
  launch.addEventListener('click',() => openModal('aiModal'));
  const modal=document.getElementById('aiModal');
  const makeSuggestions=()=>{
    if(!modal)return;
    let bar=modal.querySelector('.ai-suggested-questions');
    if(!bar){bar=document.createElement('div');bar.className='ai-suggested-questions';const log=modal.querySelector('#aiChatLog');if(log?.parentElement)log.parentElement.insertBefore(bar,log);}
    const questions={
      AR:['ماذا نعرف عن تاريخ حبيش؟','ما الحصون الموثقة؟','عرّفني على عزل حبيش','اقترح جولة من المعالم المنشورة'],
      EN:['What is documented about Hubaish history?','Which forts are documented?','Tell me about Hubaish sub-districts','Suggest a route from published landmarks'],
      TR:['Hubaish tarihi hakkında neler belgelenmiş?','Hangi kaleler belgelenmiş?','Hubaish bucaklarını anlat','Yayımlanmış yerlerden rota öner'],
      FR:['Que sait-on de l’histoire de Hubaish ?','Quels forts sont documentés ?','Présentez les sous-districts de Hubaish','Proposez un parcours à partir des lieux publiés']
    }[state.lang]||[];
    bar.replaceChildren();
    questions.forEach(question=>{const button=document.createElement('button');button.type='button';button.className='quick-chip';button.textContent=question;button.addEventListener('click',()=>{const input=document.getElementById('aiInput');if(input){input.value=question;sendAiMessage()}});bar.append(button)});
  };
  makeSuggestions();
  document.addEventListener('hubaish:languagechange',makeSuggestions);
  minimize.addEventListener('click',() => wrap.classList.add('is-minimized'));
  restore.addEventListener('click',() => wrap.classList.remove('is-minimized'));
  document.addEventListener('hubaish:languagechange',update);
}

document.addEventListener('DOMContentLoaded', init, { once: true });
