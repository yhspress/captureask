// Shared English reference pages retain the language used to reach them.
(() => {
  let code;
  try { code = localStorage.getItem('captureask-language'); } catch { return; }
  if (!['ko', 'ja', 'zh-TW', 'es', 'pt', 'ar', 'fr'].includes(code)) return;
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href.startsWith('//')) return;
    const url = new URL(href, location.origin);
    if (url.pathname === '/') url.pathname = `/${code}/`;
    else if (['/guide', '/guide.html'].includes(url.pathname)) url.pathname = `/${code}/guide`;
    else return;
    link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
  });
})();
