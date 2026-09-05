import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root = new URL('../site/', import.meta.url);
const context = vm.createContext({ window: {} });
for (const file of ['i18n.js', 'final-copy.js']) vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context);
const locales = context.window.CAPTUREASK_I18N;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('<head>')) continue; // Keep ownership verification files untouched.
    if (!html.includes('/layout.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/layout.css">\n</head>');
    if (!html.includes('/favicon.png')) html = html.replace('</head>', '<link rel="icon" type="image/png" href="/favicon.png">\n</head>');
    const lang = html.match(/<html lang="([^"]+)"/)?.[1] || 'en';
    const t = locales[lang];
    if (html.includes('data-page=')) {
      html = html.replace(/<([a-z][a-z0-9]*)\b([^>]*\bdata-t="([^"]+)"[^>]*)>[\s\S]*?<\/\1>/g, (all, tag, attrs, key) =>
        typeof t[key] === 'string' ? `<${tag}${attrs}>${t[key]}</${tag}>` : all);
      for (const [id, values] of [['steps', t.steps], ['installList', t.installSteps], ['startList', t.startList]]) {
        const content = values.map(item => Array.isArray(item) ? `<li><b>${item[0]}</b><h3>${item[1]}</h3><p>${item[2]}</p></li>` : `<li>${item}</li>`).join('');
        html = html.replace(new RegExp(`(<ol id="${id}">)[\\s\\S]*?(</ol>)`), `$1${content}$2`);
      }
      const prefix = lang === 'en' ? '/' : `/${lang}/`;
      const page = html.includes('data-page="guide"') ? 'guide' : '';
      html = html.replace(/<link rel="(?:canonical|alternate)"[^>]*>\s*/g, '');
      const canonical = `https://captureask.com${prefix}${page}`;
      const alternates = Object.keys(locales).map(code => `<link rel="alternate" hreflang="${code}" href="https://captureask.com${code === 'en' ? '/' : `/${code}/`}${page}">`).join('\n');
      html = html.replace('</head>', `<link rel="canonical" href="${canonical}">\n${alternates}\n<link rel="alternate" hreflang="x-default" href="https://captureask.com/${page}">\n</head>`);
      html = html.replace(/href="\/(?:index\.html)?"/g, `href="${prefix}"`)
        .replace(/href="\/guide(?:\.html)?([#?"][^"]*)/g, `href="${prefix}guide$1`);
      if (lang === 'ar') html = html.replace('<html lang="ar">', '<html lang="ar" dir="rtl">');
    } else if (!html.includes('/return-language.js')) {
      html = html.replace('</head>', '<script src="/return-language.js" defer></script>\n</head>');
    }
    fs.writeFileSync(file, html);
  }
}
visit(fs.realpathSync(root));
