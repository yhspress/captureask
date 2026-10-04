import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = fs.realpathSync(new URL('../site/', import.meta.url));
const scripts = ['i18n.js','final-copy.js','app.js'].map(file => fs.readFileSync(path.join(root,file),'utf8'));
const codes = ['en','ko','ja','zh-TW','es','pt','ar','fr'];
for (const code of codes) for (const page of ['home','guide']) {
  const prefix = code === 'en' ? '/' : `/${code}/`;
  const links = ['/', '/guide.html#privacy', '/downloads/CaptureAsk-extension-v0.3.7-full-screen.zip', '//example.com/'].map(href => ({href, getAttribute(){return this.href;},setAttribute(key,value){this[key]=value;}}));
  const language = {value:code};
  const location = {pathname:prefix+(page==='guide'?'guide':''),origin:'https://captureask.com',search:'',hash:'#privacy'};
  const document = {documentElement:{},body:{dataset:{page}},querySelector:selector=>selector==='#language'?language:null,querySelectorAll:selector=>selector==='[data-t]'?[]:links};
  const context = vm.createContext({window:{},document,location,URL,localStorage:{setItem(){throw new Error('Storage unavailable');}}});
  scripts.forEach(script => vm.runInContext(script,context));
  assert.equal(document.documentElement.lang,code);
  assert.equal(links[0].href,prefix);
  assert.equal(links[1].href,prefix+'guide#privacy');
  assert.equal(links[2].href,'/downloads/CaptureAsk-extension-v0.3.7-full-screen.zip');
  assert.equal(links[3].href,'//example.com/');
  for (const target of codes) {
    language.value=target; language.onchange();
    assert.equal(location.href,(target==='en'?'/':`/${target}/`)+(page==='guide'?'guide':'')+'#privacy');
  }
}
let pages=0,links=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){walk(file);continue;}
  if(!file.endsWith('.html'))continue;
  const html=fs.readFileSync(file,'utf8'); if(!html.includes('<head>'))continue;
  pages++;
  for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(!href.startsWith('/')&&!href.startsWith('#')||href.startsWith('//'))continue;
    const url=new URL(href,'https://captureask.com/'+path.relative(root,file).replaceAll('\\','/'));
    const base=path.join(root,decodeURIComponent(url.pathname));
    const target=[base,base+'.html',path.join(base,'index.html')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    assert.ok(target,`${file}: missing ${href}`);links++;
    if(url.hash)assert.ok(fs.readFileSync(target,'utf8').includes(`id="${url.hash.slice(1)}"`),`${file}: missing anchor ${href}`);
  }
}}
walk(root);
console.log(`PASS: 16 language/page cases, 128 language switches (storage disabled), ${pages} pages and ${links} local links/assets.`);
