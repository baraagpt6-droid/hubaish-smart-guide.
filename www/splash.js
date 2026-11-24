(() => {
  const splash = document.getElementById('appSplash');
  if (!splash) return;
  const started = Date.now();
  const minimumDuration = 850;
  const finish = () => {
    const remaining = Math.max(0, minimumDuration - (Date.now() - started));
    window.setTimeout(() => {
      splash.classList.add('is-leaving');
      window.setTimeout(() => splash.remove(), 420);
    }, remaining);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finish, { once: true });
  else finish();
})();
