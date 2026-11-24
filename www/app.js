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
  { id: 'h1', era: 'ancient', period: 'العصر الحميري', title: 'الاستيطان الحميري وبناء الحصون', body: 'تربط الرواية المحلية مرتفعات حبيش بمملكة حمير، وتشير إلى الحصون الصخرية والصهاريج المائية والمدرجات الزراعية في المنطقة.' },
  { id: 'h2', era: 'ancient', period: 'القرن 5–8 هـ', title: 'العهد الصليحي والرسولي', body: 'تذكر مواد الدليل أهمية جبال حبيش وحصن صهبان في الفترات الصليحية والرسولية، إلى جانب المساجد والمدارس العلمية.' },
  { id: 'h3', era: 'modern', period: 'التاريخ الحديث', title: 'مركز المديرية في ظُلمة والتقسيم الإداري', body: 'تُعرف ظُلمة بوصفها مركز مديرية حبيش الإداري، وتضم المديرية عزلًا وقرى زراعية تشتهر بالمدرجات والبن والحبوب.' },
  { id: 'h4', era: 'modern', period: '1919م • رواية تحتاج إلى توثيق', title: 'رواية عن تحرك شعبي في حبيش', body: 'تتداول بعض الروايات المحلية حديثاً عن انتفاضة أو تحرك شعبي سنة 1919م. لم يتوفر في المصادر المفتوحة التي تمت مراجعتها توثيق مستقل كافٍ، لذلك لا تُعرض هذه الرواية كواقعة مؤكدة حتى العثور على مصدر تاريخي أولي.' }
];

const DEFAULT_PLACES = [
  { id: 'p1', cat: 'fort', title: 'حصن صهبان التاريخي', loc: 'عزلة صهبان • 2,420 م', distKm: 4.5, dir: 'شمال شرق', body: 'أحد أبرز الحصون الواردة في مواد دليل حبيش. يقع على قمة جبلية ويطل على أجزاء من المديرية ومخلاف جعفر.' },
  { id: 'p2', cat: 'fort', title: 'حصن حَبِيش (جبل حبيش)', loc: 'مرتفعات حبيش • 2,350 م', distKm: 3.2, dir: 'شمال', body: 'معلم جبلي ارتبط اسمه بالمديرية. تذكر بيانات الدليل بقايا أسوار حجرية وصهاريج ومخازن حبوب في محيطه.' },
  { id: 'p3', cat: 'mosque', title: 'الجامع الكبير في ظُلمة', loc: 'مركز ظُلمة • 1,890 م', distKm: 0.4, dir: 'المركز', body: 'مسجد في مركز المديرية، وتصفه مواد الدليل بالعمارة الحجرية التقليدية والسقف الخشبي.' },
  { id: 'p4', cat: 'valley', title: 'وادي الدُّور ومدرجات البن', loc: 'المنحدرات الغربية • 1,580 م', distKm: 7.8, dir: 'غرب', body: 'وادي زراعي تذكر بيانات الدليل وجود مدرجات للبن والذرة الرفيعة وغيول موسمية فيه.' }
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
  const loc = cleanText(item.loc, 90);
  const cat = ['fort', 'mosque', 'valley', 'mountain'].includes(item.cat) ? item.cat : 'fort';
  if (!title || !body) return null;
  const distance = Number(item.distKm);
  return {
    id: /^[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? String(item.id) : makeId(`p${index}`),
    cat, title, body, loc: loc || 'مديرية حبيش',
    ...(Number.isFinite(distance) && distance >= 0 && distance <= 1000 ? { distKm: distance } : {}),
    dir: cleanText(item.dir, 40)
  };
}

function validateHistory(item, index = 0) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const title = cleanText(item.title, 100);
  const body = cleanText(item.body, 700);
  if (!title || !body) return null;
  return {
    id: /^[a-zA-Z0-9_-]{1,100}$/.test(String(item.id || '')) ? String(item.id) : makeId(`h${index}`),
    era: item.era === 'modern' ? 'modern' : 'ancient',
    period: cleanText(item.period, 70), title, body
  };
}

function normalizeState(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const places = Array.isArray(source.places) ? source.places.slice(0, 200).map(validatePlace).filter(Boolean) : DEFAULT_PLACES.map(item => ({ ...item }));
  const history = Array.isArray(source.history) ? source.history.slice(0, 100).map(validateHistory).filter(Boolean) : DEFAULT_HISTORY.map(item => ({ ...item }));
  const socials = Array.isArray(source.socials) ? source.socials.slice(0, 50).map(item => {
    if (!item || typeof item !== 'object') return null;
    const name = cleanText(item.name, 70);
    const url = cleanText(item.url, 500);
    return name && validHttpUrl(url) ? { name, url } : null;
  }).filter(Boolean) : DEFAULT_SOCIALS.map(item => ({ ...item }));
  const ids = new Set([...places, ...history].map(item => item.id));
  const favs = Array.isArray(source.favs) ? source.favs.filter(id => typeof id === 'string' && ids.has(id)).slice(0, 300) : [];
  return {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  document.getElementById('themeToggleBtn').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  saveState();
}

function applyLang(lang) {
  state.lang = I18N[lang] ? lang : 'AR';
  const dictionary = I18N[state.lang];
  document.documentElement.lang = state.lang.toLowerCase();
  document.documentElement.dir = dictionary.dir;
  document.getElementById('langCode').textContent = state.lang;
  const languageSelect = document.getElementById('langSelect');
  if (languageSelect) languageSelect.value = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (dictionary[key]) element.textContent = dictionary[key];
  });
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

function createContentCard(item, options = {}) {
  const card = element('article', 'item-card');
  if (options.meta) {
    const meta = element('div', 'item-meta');
    meta.append(makeTag(options.meta, true));
    if (options.extraMeta) meta.append(makeTag(options.extraMeta));
    card.append(meta);
  }
  card.append(element('h3', 'item-title', item.title));
  card.append(element('p', 'item-body', item.body));
  const actions = element('div', 'card-actions');
  const favButton = createAction(isSaved(item.id) ? '★ محفوظ' : '☆ حفظ', 'favId', item.id);
  if (isSaved(item.id)) favButton.classList.add('saved');
  actions.append(favButton, createAction('✦ اسأل المساعد', 'ask', item.title), createAction('التفاصيل', 'detail', item.id));
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
  const items = state.history.filter(item => (era === 'all' || item.era === era) && (!needle || normalizeArabic(`${item.title} ${item.period} ${item.body}`).includes(needle)));
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, 'لا توجد نتائج مطابقة.');
  items.forEach(item => target.append(createContentCard(item, { meta: item.period, extraMeta: 'مادة تاريخية' })));
}

function renderPlaces(category = currentPlaceCategory, query = '') {
  const target = document.getElementById('placesList');
  const needle = normalizeArabic(query);
  const items = state.places.filter(item => (category === 'all' || item.cat === category) && (!needle || normalizeArabic(`${item.title} ${item.loc} ${item.body}`).includes(needle)));
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, 'لا توجد معالم مطابقة.');
  items.forEach(item => {
    const extra = Number.isFinite(item.distKm) ? `🧭 ${item.distKm} كم • ${item.dir || ''}` : '';
    target.append(createContentCard(item, { meta: item.loc, extraMeta: extra }));
  });
}

function renderUzal(query = '') {
  const target = document.getElementById('uzalList');
  const needle = normalizeArabic(query);
  const directoryNames = window.HubaishFeatures?.getUzal?.() || UZAL_22;
  const items = directoryNames.map((name, index) => ({ name, number: index + 1 })).filter(item => !needle || normalizeArabic(item.name).includes(needle));
  target.replaceChildren();
  if (!items.length) return appendEmpty(target, 'لا توجد عزلة مطابقة.');
  items.forEach(item => {
    const card = element('article', 'item-card');
    const row = element('div', 'item-meta');
    row.append(makeTag(`عزلة #${item.number}`, true));
    card.append(row, element('h3', 'item-title', `عزلة ${item.name}`), createAction('✦ استكشف', 'ask', `عزلة ${item.name} في مديرية حبيش`));
    target.append(card);
  });
}

function renderSocials() {
  const target = document.getElementById('socialLinksList');
  target.replaceChildren();
  if (!state.socials.length) return appendEmpty(target, 'لا توجد روابط مضافة.');
  state.socials.forEach(item => {
    if (!validHttpUrl(item.url)) return;
    const link = element('a', 'btn-sm', `↗ ${item.name}`);
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
    card.append(createAction('✦ اسأل المساعد', 'ask', item.title));
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
  const title = cleanText(document.getElementById('newPlaceTitle').value, 90);
  const loc = cleanText(document.getElementById('newPlaceLoc').value, 90) || 'مديرية حبيش';
  const body = cleanText(document.getElementById('newPlaceDesc').value, 700);
  const cat = document.getElementById('newPlaceCat').value;
  if (!title || !body) return showToast('أدخل اسم المعلم ووصفه.');
  if (state.places.length >= 200) return showToast('وصلت إلى الحد الأقصى للمعالم المحلية.');
  state.places.unshift({ id: makeId('place'), cat: ['fort', 'mosque', 'valley', 'mountain'].includes(cat) ? cat : 'fort', title, loc, body });
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
  const languages = ['AR', 'EN', 'TR', 'FR'];
  document.getElementById('langToggleBtn').addEventListener('click', () => applyLang(languages[(languages.indexOf(state.lang) + 1) % languages.length]));
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
  document.getElementById('resetLocalBtn').addEventListener('click', resetLocalData);
  document.body.addEventListener('click', event => {
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
  // Keep the legacy language cycle available to assistive or keyboard users; the select is the visible control.
  window.addEventListener('online', () => showToast('عاد الاتصال بالإنترنت.'));
  window.addEventListener('offline', () => showToast('أنت الآن دون اتصال. المحتوى المحفوظ متاح.'));
}

function init() {
  applyTheme(state.theme);
  applyLang(state.lang);
  bindEvents();
  renderAll();
  renderRadar();
  updatePrayerUI();
  switchTab(state.tab || 'home');
  window.setInterval(updatePrayerUI, 1000);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register(new URL('./sw.js', document.baseURI).href).catch(() => showToast('تعذر تفعيل وضع العمل دون إنترنت.'));
  }
}

document.addEventListener('DOMContentLoaded', init, { once: true });
