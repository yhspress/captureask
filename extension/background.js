const AI_ORIGINS = new Set(['https://chatgpt.com', 'https://claude.ai', 'https://gemini.google.com', 'https://grok.com']);
let handoff = Promise.resolve();
function serialize(action) { const next = handoff.then(action); handoff = next.catch(() => {}); return next; }
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const fromPopup = !sender.tab && sender.url === chrome.runtime.getURL('popup.html');
  let task;
  if (message.type === 'open-ai' && fromPopup) task = serialize(() => openAi(message));
  if (message.type === 'select-tab-area' && fromPopup) {
    selectTabArea(message.targetUrl).catch(async () => chrome.storage.session.set({captureStatus:'Area capture failed. Try Current tab, then Select area.'}));
    sendResponse({ok:true}); return;
  }
  if (message.type === 'discard-capture' && fromPopup) task = serialize(() => chrome.storage.session.remove(['pendingAiImage','pendingCapturePreview','captureStatus']).then(() => ({ok:true})));
  if (message.type === 'get-pending-image' && sender.tab) task = serialize(() => getPendingImage(sender));
  if (!task) return;
  task.then(sendResponse).catch(error => sendResponse({ok:false,error:error.message})); return true;
});
async function getPendingImage(sender) {
  const {pendingAiImage,pendingCapturePreview} = await chrome.storage.session.get(['pendingAiImage','pendingCapturePreview']);
  if (!pendingAiImage) return {};
  if (pendingAiImage.expiresAt < Date.now() || pendingAiImage.captureId !== pendingCapturePreview?.captureId) { await chrome.storage.session.remove('pendingAiImage'); return {}; }
  if (sender.tab.id !== pendingAiImage.tabId || new URL(sender.url).origin !== pendingAiImage.targetOrigin) return {};
  await chrome.storage.session.remove('pendingAiImage');
  return pendingCapturePreview ? {pendingAiImage:{...pendingAiImage,dataUrl:pendingCapturePreview.dataUrl}} : {};
}
async function openAi({dataUrl,mime,targetUrl}) {
  const target = new URL(targetUrl);
  if (!AI_ORIGINS.has(target.origin)) throw new Error('Unsupported AI target.');
  if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg);base64,/.test(dataUrl)) throw new Error('Invalid capture.');
  await chrome.storage.local.set({preferredAi:target.href});
  await chrome.storage.session.remove(['pendingAiImage','captureStatus']);
  const captureId = crypto.randomUUID();
  if (dataUrl.length <= 9000000) await chrome.storage.session.set({pendingCapturePreview:{dataUrl,captureId}});
  else await chrome.storage.session.remove('pendingCapturePreview');
  const tab = await chrome.tabs.create({url:'about:blank',active:true});
  const queued = dataUrl.length <= 7000000;
  if (queued) await chrome.storage.session.set({pendingAiImage:{captureId,mime,filename:mime==='image/jpeg'?'captureask.jpg':'captureask.png',targetOrigin:target.origin,tabId:tab.id,expiresAt:Date.now()+120000}});
  await chrome.tabs.update(tab.id,{url:target.href});
  return {ok:true,queued};
}
async function selectTabArea(targetUrl) {
  const [tab] = await chrome.tabs.query({active:true,lastFocusedWindow:true});
  if (!tab?.id || !tab.windowId) throw new Error('Active tab unavailable.');
  const [selection] = await chrome.scripting.executeScript({target:{tabId:tab.id},func:drawSelectionOverlay});
  if (!selection?.result) { await chrome.storage.session.set({captureStatus:'Area selection cancelled. Reopen CaptureAsk to review or discard the previous preview.'}); return; }
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});
  const contexts = await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[chrome.runtime.getURL('offscreen.html')]});
  if (!contexts.length) await chrome.offscreen.createDocument({url:'offscreen.html',reasons:['BLOBS'],justification:'Crop a user-selected browser-tab screenshot.'});
  const result = await chrome.runtime.sendMessage({type:'crop-tab-capture',dataUrl,region:selection.result});
  if (!result?.dataUrl) throw new Error('Crop failed.');
  if (result.dataUrl.length > 9000000) {
    const message = 'This area is too large to retain. No AI tab was opened. Reopen CaptureAsk, use Current tab and choose a smaller area, or download its preview before closing. Any recovered preview is from an earlier capture.';
    await chrome.storage.session.set({captureStatus:message});
    await chrome.scripting.executeScript({target:{tabId:tab.id},func:showCaptureRecoveryNotice,args:[message]});
    return;
  }
  await serialize(() => openAi({dataUrl:result.dataUrl,mime:'image/png',targetUrl}));
}
function showCaptureRecoveryNotice(message) {
  const notice=document.createElement('aside');notice.setAttribute('role','alert');
  Object.assign(notice.style,{position:'fixed',top:'18px',right:'18px',zIndex:'2147483647',maxWidth:'380px',padding:'16px',border:'2px solid #2962ff',borderRadius:'8px',background:'#fff',color:'#14213d',font:'14px Arial,sans-serif'});
  const text=document.createElement('p');text.textContent='CaptureAsk: '+message;
  const close=document.createElement('button');close.textContent='Dismiss';close.addEventListener('click',()=>notice.remove());notice.append(text,close);document.documentElement.append(notice);
}
chrome.runtime.onInstalled.addListener(() => chrome.storage.local.remove('pendingAiImage'));
chrome.runtime.onStartup.addListener(() => chrome.storage.local.remove('pendingAiImage'));
function drawSelectionOverlay() { return new Promise(resolve => { const overlay=document.createElement('div'), box=document.createElement('div'), hint=document.createElement('div'); Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'2147483647',cursor:'crosshair',background:'rgba(9,16,38,.28)'}); Object.assign(box.style,{position:'fixed',border:'2px solid #2962ff',background:'rgba(41,98,255,.14)',display:'none'}); Object.assign(hint.style,{position:'fixed',top:'18px',left:'50%',transform:'translateX(-50%)',padding:'10px 14px',borderRadius:'8px',background:'#14213d',color:'#fff',font:'13px Arial,sans-serif'}); hint.textContent='Drag to select an area · Esc to cancel'; overlay.append(box,hint); document.documentElement.append(overlay); let start; const clean=()=>{overlay.remove();removeEventListener('keydown',onKey);}; overlay.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};box.style.display='block';}); overlay.addEventListener('pointermove',e=>{if(!start)return;const x=Math.min(start.x,e.clientX),y=Math.min(start.y,e.clientY),w=Math.abs(e.clientX-start.x),h=Math.abs(e.clientY-start.y);Object.assign(box.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});}); overlay.addEventListener('pointerup',e=>{if(!start)return;const x=Math.min(start.x,e.clientX),y=Math.min(start.y,e.clientY),width=Math.abs(e.clientX-start.x),height=Math.abs(e.clientY-start.y);clean();resolve(width>5&&height>5?{x,y,width,height,scale:devicePixelRatio}:null);}); function onKey(e){if(e.key==='Escape'){clean();resolve(null);}} addEventListener('keydown',onKey); }); }
