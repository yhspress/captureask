import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const playwrightRoot=process.env.CAPTUREASK_PLAYWRIGHT_ROOT || path.resolve('../heic-jpeg');
const require=createRequire(path.join(playwrightRoot,'package.json'));
const {chromium}=require('@playwright/test');
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=path.join(process.cwd(),name.startsWith('/extension/')?'': 'site',name);
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)&&fs.existsSync(file+'.html'))file+='.html';
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(3199,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:800}});
 page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const values={};
  const store={get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,values[k]])),set:async obj=>Object.assign(values,obj),remove:async keys=>{for(const k of Array.isArray(keys)?keys:[keys])delete values[k];}};
  window.mockValues=values;window.downloads=[];
  Object.defineProperty(navigator,'clipboard',{value:{write:async()=>{throw new Error('Clipboard blocked');}},configurable:true});
  window.chrome={storage:{session:store,local:store},runtime:{sendMessage:async message=>{
   if(message.type==='open-ai')return{ok:true,queued:message.dataUrl.length<=7000000};
   if(message.type==='discard-capture'){await store.remove(['pendingCapturePreview','captureStatus']);return{ok:true};}
   if(message.type==='get-pending-image')return{pendingAiImage:{dataUrl:window.captureFixture,filename:'captureask.png',mime:'image/png',targetOrigin:location.origin,expiresAt:Date.now()+10000}};
   return{ok:true};
  }},tabs:{captureVisibleTab:async()=>{const c=document.createElement('canvas');c.width=800;c.height=200;const ctx=c.getContext('2d');ctx.fillStyle='#2962ff';ctx.fillRect(0,0,800,200);return c.toDataURL();}},downloads:{download:async value=>window.downloads.push(value)},desktopCapture:{chooseDesktopMedia:(_types,callback)=>callback('')}};
 });
 await page.goto('http://127.0.0.1:3199/ko/');
 assert.equal(await page.locator('header a[data-t="navPrivacy"]').getAttribute('href'),'/privacy.html');
 assert.equal(await page.locator('footer a[data-t="navPrivacy"]').getAttribute('href'),'/privacy.html');
 assert.equal(await page.locator('footer a[href="/terms.html"]').count(),1);
 assert.match(await page.locator('[data-t="sendDetail"]').textContent(),/썸네일/);
 fs.mkdirSync('.local',{recursive:true});await page.screenshot({path:'.local/ko-home.png',fullPage:true});
 await page.setViewportSize({width:360,height:850});
 await page.goto('http://127.0.0.1:3199/extension/popup.html');
 await page.locator('#screen').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('cancelled'));
 assert.equal(await page.locator('#status').isVisible(),true);
 await page.locator('#tab').click();await page.locator('#preview-panel').waitFor({state:'visible'});
 await page.locator('#copy').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Clipboard access failed'));
 await page.locator('#send').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('thumbnail'));
 await page.locator('#download').click();await page.waitForFunction(()=>window.downloads.length===1);
 assert.match((await page.evaluate(()=>window.downloads[0])).filename,/\.png$/);
 await page.locator('#crop').click();const rect=await page.locator('#preview').boundingBox();await page.mouse.move(rect.x+10,rect.y+10);await page.mouse.down();await page.mouse.move(rect.x+110,rect.y+40);await page.mouse.up();await page.locator('#apply-crop').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='Cropped preview ready.');
 await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=800;c.height=200;c.getContext('2d').fillRect(0,0,800,200);await showPreview(await new Promise(resolve=>c.toBlob(resolve,'image/jpeg')));});
 await page.locator('#download').click();assert.match((await page.evaluate(()=>window.downloads[1])).filename,/\.jpg$/);
 await page.evaluate(async()=>{await openAiWithImage(new Blob(['A'.repeat(6000000)],{type:'image/png'}),'https://chatgpt.com/');});
 assert.match(await page.locator('#status').textContent(),/clipboard copy are unavailable/);
 await page.screenshot({path:'.local/popup-recovery.png'});
 await page.locator('#again').click();assert.equal(await page.evaluate(()=>window.mockValues.pendingCapturePreview),undefined);assert.equal(await page.locator('#capture-panel').isVisible(),true);
 // The provider page is a fixture: assigning a file must never claim upload completion.
 await page.goto('http://127.0.0.1:3199/extension/popup.html');
 await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2;c.height=2;window.captureFixture=c.toDataURL();document.body.innerHTML='<input type="file" accept="image/png"><textarea></textarea>';Object.defineProperty(location,'hostname',{value:'chatgpt.com'});}).catch(async()=>{
  await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2;c.height=2;window.captureFixture=c.toDataURL();document.body.innerHTML='<input type="file" accept="image/png"><textarea></textarea>';});
 });
 let attach=fs.readFileSync('extension/ai-attach.js','utf8').replace('location.hostname === host','host === \'chatgpt.com\'');
 await page.addScriptTag({content:attach});await page.waitForFunction(()=>document.querySelector('aside p')?.textContent.includes('unconfirmed'),null,{timeout:10000}).catch(async error=>{console.log(await page.evaluate(()=>({notice:document.querySelector('aside')?.textContent,body:document.body.innerHTML,fixture:window.captureFixture?.slice(0,40)})));throw error;});
 assert.equal(await page.locator('input[type=file]').evaluate(el=>el.files.length),1);
 assert.equal(await page.locator('aside a[download]').count(),1);
 assert.deepEqual(errors,[]);
 console.log('PASS: Chromium localized policy/terms links, visible cancellation, tab preview, clipboard failure, handoff wording, PNG/JPEG downloads, crop, oversized fallback, discard and native file assignment with unconfirmed upload notice.');
}finally{await browser.close();server.close();}
