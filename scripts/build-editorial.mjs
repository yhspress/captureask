import fs from 'node:fs';
import path from 'node:path';
import {articles,localized} from './editorial-content.mjs';
const site=fs.realpathSync(new URL('../site/',import.meta.url));
const cardLinks=Object.entries(articles).map(([slug,a])=>`<a href="/guides/${slug}" hreflang="en"><b>${a.title}</b><span>${a.intro}</span></a>`).join('');
for(const [slug,a] of Object.entries(articles)){
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${a.intro}"><title>${a.title} — CaptureAsk</title><link rel="canonical" href="https://captureask.com/guides/${slug}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/v036.css"><link rel="stylesheet" href="/layout.css"><link rel="icon" href="/favicon.png"><script src="/return-language.js" defer></script></head>
<body><header class="topbar wrap"><a class="brand" href="/">CaptureAsk</a><nav><a href="/guide">Guides</a><a href="/privacy">Privacy</a></nav></header><main class="legal wrap"><p class="eyebrow">CAPTUREASK · PRACTICAL GUIDE</p><h1>${a.title}</h1><p class="updated">Updated September 13, 2026 · Based on the downloadable v0.3.6 package</p><p class="lede">${a.intro}</p>${a.body}<p class="notice">Implementation details were checked against the downloadable extension code. AI provider interfaces and account limits can change; automatic attachment is not guaranteed. Examples on this page are illustrative.</p><p class="article-nav"><a href="/guide">← Back to the setup guide</a></p><h2>Related walkthroughs</h2><div class="guide-cards">${Object.entries(articles).filter(([s])=>s!==slug).map(([s,v])=>`<a href="/guides/${s}">${v.title}</a>`).join('')}</div></main><footer class="wrap"><a class="brand" href="/">CaptureAsk</a><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div><small>© 2026 CaptureAsk</small></footer></body></html>`;
  fs.writeFileSync(path.join(site,'guides',slug+'.html'),html);
}
for(const [lang,c] of Object.entries(localized))for(const page of ['index','guide']){
  const file=path.join(site,lang==='en'?'':lang,page+'.html');
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/\s*<script\b[^>]*src="https:\/\/pagead2\.googlesyndication\.com[^>]*><\/script>/g,'');
  html=html.replace(/\s*<!-- editorial:start -->[\s\S]*?<!-- editorial:end -->/g,'');
  // Replace the old short English-only recommendation block, where present.
  html=html.replace(/\s*<section id="more-guides">[\s\S]*?<\/section>/g,'');
  const body=`<h2>${c[0]}</h2><p>${c[1]}</p><h2>${c[2]}</h2><p>${c[3]}</p><h2>${c[4]}</h2><p>${c[5]}</p><h2>${c[6]}</h2><div class="guide-cards" lang="en" dir="ltr">${cardLinks}</div>`;
  const block=`\n<!-- editorial:start -->\n<section id="practical-help" class="${page==='index'?'editorial wrap':'editorial'}">${body}</section>\n<!-- editorial:end -->\n`;
  html=page==='index'?html.replace('</main>',block+'</main>'):html.replace('</article>',block+'</article>');
  fs.writeFileSync(file,html.replace(/[ \t]+$/gm,''));
}
let sitemap=fs.readFileSync(path.join(site,'sitemap.xml'),'utf8');
if(!sitemap.includes('/guides/ai-troubleshooting'))sitemap=sitemap.replace('</urlset>','<url><loc>https://captureask.com/guides/ai-troubleshooting</loc></url>\n</urlset>');
fs.writeFileSync(path.join(site,'sitemap.xml'),sitemap);
