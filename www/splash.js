(() => {
  const splash = document.getElementById('appSplash');
  if (!splash) return;
  const STORAGE_KEY = 'hubaishIntroSeenSessionV2';
  const skip = splash.querySelector('#welcomeSkipBtn');
  const progress = splash.querySelector('.welcome-progress');
  const bar = splash.querySelector('#welcomeProgressBar');
  const greeting = splash.querySelector('#welcomeGreeting');
  let repeated = false;
  try { repeated = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch {}
  const duration = repeated ? 1200 : 2000;
  const started = performance.now();
  let finished = false;
  const hour = new Date().getHours();
  if (greeting) greeting.textContent = hour >= 5 && hour < 11
    ? 'صباح الخير من مرتفعات حبيش'
    : hour >= 11 && hour < 17
      ? 'نهارك جميل بين قرى ومدرجات حبيش'
      : hour >= 17 && hour < 23
        ? 'مساء الخير من رحاب حبيش'
        : 'أهلاً بك في رحاب جبل حبيش التاريخي';
  const finish = (instant = false) => {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
    if (progress) progress.setAttribute('aria-valuenow', '100');
    if (bar) bar.style.width = '100%';
    splash.classList.add('is-leaving');
    splash.setAttribute('aria-hidden', 'true');
    if (instant) { splash.remove(); return; }
    window.setTimeout(() => splash.remove(), 320);
  };
  const params = new URLSearchParams(location.search);
  if ((navigator.webdriver && !params.has('intro-test')) || params.has('e2e')) {
    if (!params.has('intro-test')) { finish(true); return; }
  }
  skip?.addEventListener('click', () => finish(true), { once: true });
  const update = now => {
    if (finished) return;
    const value = Math.min(1, Math.max(0, (now - started) / duration));
    if (bar) bar.style.width = (value * 100).toFixed(1) + '%';
    if (progress) progress.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    if (value >= 1) finish(false);
    else window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
})();
