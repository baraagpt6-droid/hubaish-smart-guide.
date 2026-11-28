(() => {
  const splash = document.getElementById('appSplash');
  if (!splash) return;

  const STORAGE_KEY = 'hubaishWelcomeSeenV1';
  const duration = 1100;
  const started = Date.now();
  const skip = splash.querySelector('#welcomeSkipBtn');
  let finished = false;

  const finish = (instant = false) => {
    if (finished) return;
    finished = true;
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* Storage may be disabled. */ }
    splash.classList.add('is-leaving');
    splash.setAttribute('aria-hidden', 'true');
    if (instant) {
      splash.remove();
      return;
    }
    window.setTimeout(() => splash.remove(), 360);
  };

  // Automated browser audits must start on the real app shell, not the welcome curtain.
  let alreadySeen = false;
  try { alreadySeen = localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* Continue without persistence. */ }
  if (navigator.webdriver || new URLSearchParams(location.search).has('e2e') || alreadySeen) {
    finish(true);
    return;
  }

  skip?.addEventListener('click', () => finish(true), { once: true });
  const waitForReady = () => {
    const remaining = Math.max(0, duration - (Date.now() - started));
    window.setTimeout(() => finish(false), remaining);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForReady, { once: true });
  else waitForReady();
})();
