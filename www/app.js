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
  { id: 'h3', era: 'ancient', period: 'القرن الثامن الهجري', title: 'صهبان في العصر الرسولي', body: 'تتناقل بعض الروايات المحلية أن مرتفعات إب وحصونها كانت ذات أهمية في العهد الصليحي، لكن لا تتوفر هنا وثيقة تربط حصن صهبان تحديداً بدور صليحي. أما في العهد الرسولي، فتذكر حاشية طبعة صفة جزيرة العرب ارتباط مخلاف صهبان بالأمير الصهباني في القرن الثامن الهجري وتشير إلى حصن في المنطقة. هذه إحالة تاريخية مهمة، لكنها لا تثبت وحدها هوية كل موضع حصني متداول اليوم.', status: 'documented', source: 'حاشية تحقيق صفة جزيرة العرب، صفحة 197', sourceUrl: 'https://ablibrary.net/book_content/b/9942/205' },
  { id: 'h4', era: 'ancient', period: 'العصور الإسلامية • رواية محلية', title: 'المساجد والمدارس والحركة العلمية', body: 'تتداول الذاكرة المحلية أخبار مساجد قديمة ومجالس تعليم في ظُلمة وصهبان وبني سيف والأشعوب. لم تتوفر فهارس منشورة أو تواريخ تأسيس موثقة لهذه المواقع أثناء إعداد هذه النسخة؛ ويحتاج هذا المحور إلى مقابلات مع الأهالي، وتصوير النقوش والوثائق الوقفية إن وجدت.', status: 'local', source: 'روايات محلية أولية تحتاج جمع وثائق ومقابلات ميدانية' },
  { id: 'h5', era: 'modern', period: 'أبريل–مايو 1919م', title: 'انتفاضة حبيش ضد الحكم الإمامي', body: 'تورد دراسات صحفية تاريخية ومقتطفات من مذكرات وتقارير معاصرة مقاومة أبناء حبيش للحملة الإمامية سنة 1919م، وتذكر الشيخ محمد عائض العقاب ومواجهات في محيط حبيش. تختلف الروايات في بعض تفاصيل المعارك ومدتها؛ لذا يعرض الحدث مع إحالاته، لا بوصف كل رقم متداول حقيقة متفقاً عليها.', status: 'documented', source: 'دراسة الساحل الغربي عن انتفاضات إب، ومقال نشوان نيوز عن حبيش', sourceUrl: 'https://www.alsahil.net/news20987.html' },
  { id: 'h6', era: 'modern', period: '1357هـ / نحو 1938م وما بعده', title: 'التحول الإداري وظُلمة والعزل', body: 'تذكر مادة تاريخية عن مخلاف الحبيشية تغييرات إدارية سنة 1357هـ وربط المنطقة بلواء إب بعد أن كانت تتبع قضاء رداع. وتُعرّف البيانات الإدارية المتاحة ظُلمة مركزاً للمديرية، بينما تسجل قائمة الدليل 22 عزلة. وظلت المدرجات والبن والحبوب جزءاً من النشاط الزراعي المحلي، لكن قياس تطور الإنتاج الزراعي يحتاج إلى سلسلة إحصائية حديثة، كما تحتاج حدود العزل وقراها إلى مطابقة مع سجل رسمي.', status: 'documented', source: 'مادة تاريخية عن مخلاف الحبيشية والتقسيم الإداري', sourceUrl: 'https://www.thu-raein.com/index.php/ar/makhaleef-ar/hubaish-district-ar' }
];

const DEFAULT_PLACES = [
  { id: 'p1', cat: 'fort', title: 'حصن صهبان التاريخي', loc: 'موضع صهبان — يحتاج مطابقة جغرافية', elevation: 'غير موثق ميدانياً', importance: 'إرث حصني وارد في حاشية تاريخية؛ موقعه الدقيق بالنسبة لحدود المديرية يحتاج تحققاً.', status: 'documented', source: 'حاشية تحقيق صفة جزيرة العرب، صفحة 197', sourceUrl: 'https://ablibrary.net/book_content/b/9942/205', body: 'تذكر حاشية طبعة صفة جزيرة العرب مخلاف صهبان والأمير الصهباني في القرن الثامن الهجري وعهده الرسولي، وتشير إلى حصن في المنطقة. لا تكفي هذه الإحالة وحدها لتأكيد أن كل موضع يشار إليه محلياً باسم حصن صهبان هو الحصن نفسه؛ لذلك لا نعتمد ارتفاعاً أو إحداثيات قبل المسح الميداني.' },
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
  { id: 'p15', cat: 'mosque', title: 'مسجد صهبان الأثري', loc: 'صهبان — العنوان يحتاج توثيقاً', elevation: 'غير موثق ميدانياً', importance: 'موقع ديني تراثي مقترح لتوثيق العمارة والوقف.', status: 'local', body: 'يُذكر المسجد ضمن قائمة المواقع التراثية المحلية. لا تتوفر في هذه النسخة وثيقة تثبت سنة بنائه أو وصفاً أثرياً مستقلاً؛ ويمكن التحقق من ذلك عبر النقوش وسجلات الأوقاف وروايات أئمة المسجد.' },
  { id: 'p16', cat: 'mosque', title: 'المساجد العلمية القديمة في بني سيف والأشعوب', loc: 'بني سيف والأشعوب — المواقع الفردية غير محصورة', elevation: 'غير موثق ميدانياً', importance: 'ذاكرة التعليم الديني ومجالس القراءة في القرى.', status: 'local', body: 'تتداول الذاكرة المحلية وجود مساجد ومجالس تعليم قديمة في بني سيف والأشعوب. هذه بطاقة تجميعية لا تمثل مسجداً واحداً، ويجب فصل كل مبنى في سجل مستقل بعد حصر الاسم والوقف والنقوش وتاريخ الترميم.' }
];

const DEFAULT_SOCIALS = [{ name: 'مديرية حبيش HUBAISH DISTRICT', url: 'https://www.facebook.com/share/g/1JMCzDUsdZ/' }, { name: 'المركز الوطني للمعلومات اليمني', url: 'https://yemen-nic.info/contents/Brief/detail.php?ID=7617&phrase_id=1191776&print=Y' }];

const I18N = {
  AR: { dir: 'rtl', appName: 'مديرية حبيش', appSub: 'موسوعة جغرافية وتاريخية', govBadge: 'محافظة إب • الجمهورية اليمنية', heroTitle: 'دليل مديرية حبيش', heroDesc: 'موسوعة رقمية لتاريخ حبيش وعزلها وقراها وحصونها ومعالمها ومواقيت الصلاة.', statUzal: 'عزلة إدارية', statArea: 'كم² المساحة', statPop: 'نسمة (تعداد)', spotlightTitle: 'معلم مختار من حبيش', navHome: 'الرئيسية', navHistory: 'التاريخ', navPlaces: 'المعالم', navUzal: 'العزل', navMore: 'المزيد' },
  EN: { dir: 'ltr', appName: 'Hubaish District', appSub: 'Geographical and Historical Encyclopedia', govBadge: 'Ibb Governorate • Yemen', heroTitle: 'Hubaish District Guide', heroDesc: 'A local guide to Hubaish history, sub-districts, villages, forts, landmarks and prayer times.', statUzal: 'Sub-districts', statArea: 'Area in km²', statPop: 'Population', spotlightTitle: 'Featured landmark', navHome: 'Home', navHistory: 'History', navPlaces: 'Landmarks', navUzal: 'Sub-districts', navMore: 'More' },
  TR: { dir: 'ltr', appName: 'Hubeyş İlçesi', appSub: 'Coğrafi ve Tarihî Ansiklopedi', govBadge: 'İbb Valiliği • Yemen', heroTitle: 'Hubeyş İlçe Rehberi', heroDesc: 'Hubeyş tarihi, bucakları, köyleri, kaleleri, tarihi yerleri ve namaz vakitleri için yerel rehber.', statUzal: 'Bucak', statArea: 'Alan km²', statPop: 'Nüfus', spotlightTitle: 'Öne çıkan eser', navHome: 'Ana Sayfa', navHistory: 'Tarih', navPlaces: 'Yerler', navUzal: 'Bucaklar', navMore: 'Daha Fazla' },
  FR: { dir: 'ltr', appName: 'District de Hubaish', appSub: 'Encyclopédie géographique et historique', govBadge: 'Gouvernorat d’Ibb • Yémen', heroTitle: 'Guide du district de Hubaish', heroDesc: 'Guide local de l’histoire, des sous-districts, villages, forts, monuments et horaires de prière de Hubaish.', statUzal: 'Sous-districts', statArea: 'Superficie km²', statPop: 'Population', spotlightTitle: 'Monument à la une', navHome: 'Accueil', navHistory: 'Histoire', navPlaces: 'Monuments', navUzal: 'Sous-districts', navMore: 'Plus' }
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
  const cat = ['fort', 'mosque', 'valley', 'mountain'].includes(item.cat) ? item.cat : 'fort';
  if (!title || !body) return null;
  const sourceUrl = validHttpUrl(item.sourceUrl) ? cleanText(item.sourceUrl, 500) : '';
  return {
    id: /^[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? String(item.id) : makeId('p' + index),
    cat, title, body, loc: loc || 'مديرية حبيش',
    elevation: cleanText(item.elevation, 60) || 'غير موثق ميدانياً',
    importance: cleanText(item.importance, 300),
    source: cleanText(item.source, 300),
    sourceUrl,
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

function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  const themeToggle = document.getElementById('themeToggleBtn');
  const themeGlyph = themeToggle?.querySelector('#themeGlyph');
  if (themeGlyph) themeGlyph.setAttribute('d', state.theme === 'dark'
    ? 'M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'
    : 'M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z');
  if (themeToggle) themeToggle.setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
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
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (dictionary[key]) element.textContent = dictionary[key];
  });
  window.HubaishCatalog?.applyUi?.();
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
    AR:{fort:'حصون وقلاع',mountain:'جبال ومرتفعات',valley:'أودية ومياه',mosque:'مساجد',history:'محطة تاريخية',place:'معلم'},
    EN:{fort:'Forts and castles',mountain:'Mountains',valley:'Valleys and water',mosque:'Mosques',history:'History stop',place:'Landmark'},
    TR:{fort:'Kaleler',mountain:'Dağlar',valley:'Vadiler ve su',mosque:'Camiler',history:'Tarih durağı',place:'Yer'},
    FR:{fort:'Forts et châteaux',mountain:'Montagnes',valley:'Vallées et eau',mosque:'Mosquées',history:'Étape historique',place:'Monument'}
  }[state.lang]||{})[item.cat] || (isHistory ? ({AR:'محطة تاريخية',EN:'History stop',TR:'Tarih durağı',FR:'Étape historique'}[state.lang]||'History stop') : ({AR:'معلم',EN:'Landmark',TR:'Yer',FR:'Monument'}[state.lang]||'Landmark'));
  card.classList.add(item.cat ? ('category-' + item.cat) : 'category-history');
  const meta = element('div', 'item-meta');
  const genericMeta = {AR:isHistory?'محطة تاريخية':'معلم',EN:isHistory?'History stop':'Landmark',TR:isHistory?'Tarih durağı':'Yer',FR:isHistory?'Étape historique':'Monument'}[state.lang] || 'Landmark';
  meta.append(heritageIcon(isHistory ? 'scroll' : (item.cat || 'fort')), makeTag(options.meta || genericMeta, true));
  meta.append(makeTag(category, false));
  if (options.extraMeta) meta.append(makeTag(options.extraMeta));
  card.append(meta, element('h3', 'item-title', view.title), element('p', 'item-body', view.body));
  const actions = element('div', 'card-actions');
  const favButton = createAction(isSaved(item.id) ? 'محفوظ' : 'حفظ', 'favId', item.id);
  if (isSaved(item.id)) favButton.classList.add('saved');
  actions.append(favButton, createAction('اسأل المساعد', 'ask', view.title), createAction('التفاصيل', 'detail', item.id));
  card.append(actions);
  return card;
}

function renderSpotlight() {
  const target = document.getElementById('spotlightContainer');
  target.replaceChildren();
  const place = state.places[0];
  if (!place) return appendEmpty(target, 'لا توجد معالم مسجلة.');
  target.append(createContentCard(place, { meta: place.loc, extraMeta: 'معلم بارز' }));
}

function renderHistory(era = currentEra, query = '') {
  const target = document.getElementById('historyList');
  const needle = normalizeArabic(query);
  const items = state.history.filter(item => {
    const view = localizedDirectoryItem(item);
    return (era === 'all' || item.era === era) && (!needle || normalizeArabic(`${item.title} ${item.period} ${item.body} ${view.title} ${view.period} ${view.body}`).includes(needle));
  });
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, state.lang==='EN'?'No matching history entries.':state.lang==='TR'?'Eşleşen tarih kaydı yok.':state.lang==='FR'?'Aucun événement correspondant.':'لا توجد نتائج مطابقة.');
  items.forEach(item => { const view = localizedDirectoryItem(item); target.append(createContentCard(item,{meta:view.period||item.period,extraMeta:state.lang==='AR'?'محطة تاريخية':'History'})); });
}

function renderPlaces(category = currentPlaceCategory, query = '') {
  const target = document.getElementById('placesList');
  const needle = normalizeArabic(query);
  const items = state.places.filter(item => (category === 'all' || item.cat === category) && (!needle || normalizeArabic(`${item.title} ${item.loc} ${item.body}`).includes(needle)));
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, 'لا توجد معالم مطابقة.');
  items.forEach(item => {
    const extra = Number.isFinite(item.distKm) ? `مسافة تقديرية ${item.distKm} كم • ${item.dir || ''}` : '';
    target.append(createContentCard(item, { meta: item.loc, extraMeta: extra }));
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
  renderUzal(document.getElementById('uzalSearchInput').value);
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
  const matchedPlaces = state.places.filter(item => normalizeArabic(`${item.title} ${item.loc} ${item.body}`).includes(needle));
  const matchedHistory = state.history.filter(item => normalizeArabic(`${item.title} ${item.period} ${item.body}`).includes(needle));
  const directoryNames = window.HubaishFeatures?.getUzal?.() || UZAL_22;
  const matchedUzal = directoryNames.filter(name => normalizeArabic(name).includes(needle)).map((name, index) => ({ title: `عزلة ${name}`, body: 'إحدى العزل المدرجة ضمن قائمة مديرية حبيش. التفاصيل القروية بحاجة إلى توثيق ميداني.', id: `uzal-search-${index}` }));
  const matchedPeople = (window.HubaishFeatures?.getPeople?.() || []).filter(item => normalizeArabic(`${item.title} ${item.body}`).includes(needle)).map(item => ({title:item.title,body:item.body,id:`person-${normalizeArabic(item.title)}`}));
  const refs = [{title:'التعداد السكاني 2004',body:'105,998 نسمة وفق المركز الوطني للمعلومات اليمني.'},{title:'مساحة المديرية',body:'228 كم² في بيانات OCHA/Local Governance، مع وجود مرجع محلي ينشر 330 كم².'},{title:'التقسيم الإداري',body:'مديرية حبيش تضم 22 عزلة وفق المركز الوطني للمعلومات.'}].filter(item=>normalizeArabic(`${item.title} ${item.body}`).includes(needle)).map((item,index)=>({...item,id:`ref-${index}`}));
  const all = [...matchedPlaces, ...matchedHistory, ...matchedUzal, ...matchedPeople, ...refs].slice(0, 20);
  if (!all.length) { appendEmpty(target, 'لا توجد نتائج مطابقة.'); target.append(createAction('اسأل المساعد عن: ' + cleanText(query, 80), 'ask', query, 'btn-primary')); return; }
  target.append(element('h2', 'section-title', `نتائج البحث (${all.length})`));
  all.forEach(item => {
    const card = element('article', 'item-card');
    card.append(element('h3', 'item-title', item.title), element('p', 'item-body', item.body));
    card.append(createAction('اسأل المساعد', 'ask', item.title));
    target.append(card);
  });
}

function localAssistantAnswer(question) {
  const q = normalizeArabic(question);
  if (/صلاه|الفجر|الظهر|العصر|المغرب|العشاء|مواقيت/.test(q)) {
    const times = computePrayerTimesForToday();
    return `مواقيت الصلاة التقريبية في حبيش اليوم:\n${times.prayers.map(prayer => `${prayer.name}: ${formatYemenTime(prayer.timestamp)}`).join(' | ')}\n\nالتوقيت: اليمن (Asia/Aden).`;
  }
  const place = state.places.find(item => {
    const terms = normalizeArabic(`${item.title} ${item.loc}`).split(/\s+/).filter(term => term.length > 2);
    return terms.some(term => q.includes(term));
  });
  if (place) return `${place.title}\n${place.loc}\n${place.body}`;
  const directoryNames = window.HubaishFeatures?.getUzal?.() || UZAL_22;
  const uzla = directoryNames.find(name => q.includes(normalizeArabic(name)));
  if (uzla) return `عزلة ${uzla} مدرجة ضمن قائمة العزل الـ22 في بيانات هذا الدليل. لا تتوفر في النسخة الحالية تفاصيل مستقلة موثقة عن كل قرية أو حدود العزلة.`;
  const history = state.history.find(item => q.includes(normalizeArabic(item.title)) || normalizeArabic(item.title).split(/\s+/).some(term => term.length > 3 && q.includes(term)));
  if (history) return `${history.title} — ${history.period}\n${history.body}`;
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
  if (window.HubaishCatalog?.renderCompass) return window.HubaishCatalog.renderCompass(box, state.places, state.lang);
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
  const added={id:makeId('place'),cat:['fort','mosque','valley','mountain'].includes(cat)?cat:'fort',title,loc,body};
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

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
  document.getElementById('homeLogoBtn').addEventListener('click', () => { switchTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.getElementById('themeToggleBtn').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
  const languageSelect = document.getElementById('langSelect');
  languageSelect?.addEventListener('change', () => applyLang(languageSelect.value));
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
  document.getElementById('openAiBtn').addEventListener('click', () => openModal('aiModal'));
  document.getElementById('aiForm').addEventListener('submit', event => { event.preventDefault(); sendAiMessage(); });
  document.getElementById('openAiBtn').addEventListener('keydown', event => { if (event.key === 'Enter') openModal('aiModal'); });
  document.getElementById('addPlaceSaveBtn').addEventListener('click', handleAddPlace);
  // Social administration is handled by the extended local admin panel.
  // Full-state JSON export is handled by the extended feature layer.
  // Full-state JSON import is handled by the extended feature layer.
  document.getElementById('resetLocalBtn')?.addEventListener('click', resetLocalData);
  document.body.addEventListener('click', event => {
    const explored = event.target.closest('[data-explore-id]');
    if (explored) window.HubaishFeatures?.markExplored?.(explored.dataset.exploreId, explored.dataset.exploreKind);
    const fav = event.target.closest('[data-fav-id]');
    if (fav) toggleFavorite(fav.dataset.favId);
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
  window.addEventListener('online', () => showToast('عاد الاتصال بالإنترنت.'));
  window.addEventListener('offline', () => showToast('أنت الآن دون اتصال. المحتوى المحفوظ متاح.'));
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
  bindEvents();
  renderAll();
  renderRadar();
  updatePrayerUI();
  switchTab(state.tab || 'home');
  window.HubaishCloud?.start?.();
  window.setInterval(updatePrayerUI, 1000);
  bindServiceWorkerUpdates();
}

document.addEventListener('DOMContentLoaded', init, { once: true });
