const $ = (id) => document.getElementById(id);
let imageBlob = null, previewUrl = null, cropStart = null, cropBox = null, previewPersistent = true;
const status = (text) => { $('status').textContent = text + (imageBlob && !previewPersistent ? ' This preview could not be retained in session storage. Download it before closing this popup.' : ''); };
async function blobFromDataUrl(dataUrl) { return (await fetch(dataUrl)).blob(); }
function dataUrlFromBlob(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); }
async function showPreview(blob, restore = false) {
  if (!blob) throw new Error('The image could not be prepared. Capture again.');
  imageBlob = blob;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(blob);
  $('preview').src = previewUrl;
  $('capture-panel').hidden = true; $('preview-panel').hidden = false;
  $('selection').hidden = true; $('apply-crop').hidden = true;
  $('preview-wrap').classList.remove('selecting'); cropStart = cropBox = null;
  $('download').textContent = blob.type === 'image/jpeg' ? 'Download JPEG' : 'Download PNG';
  if (restore) { previewPersistent = true; return; }
  await chrome.storage.session.remove(['pendingAiImage','captureStatus']);
  const dataUrl = await dataUrlFromBlob(blob);
  previewPersistent = dataUrl.length <= 9000000;
  try { if (previewPersistent) await chrome.storage.session.set({ pendingCapturePreview: { dataUrl } }); else await chrome.storage.session.remove(['pendingCapturePreview','pendingAiImage']); }
  catch { previewPersistent = false; await chrome.storage.session.remove(['pendingCapturePreview','pendingAiImage']); }
}
async function openAiWithImage(blob, targetUrl) {
  const dataUrl = await dataUrlFromBlob(blob);
  let copied = false;
  try { await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]); copied = true; } catch { /* Recover through the preview. */ }
  await chrome.storage.local.set({ preferredAi: targetUrl });
  const result = await chrome.runtime.sendMessage({ type: 'open-ai', dataUrl, mime: blob.type, targetUrl });
  if (!result?.ok) throw new Error(result?.error || 'AI could not be opened. Download the preview and upload it manually.');
  status(result.queued
    ? 'AI opened; attachment is being attempted. Check its image thumbnail before sending. Reopen CaptureAsk to download this preview.'
    : copied ? 'AI opened. This image is too large for automatic attachment; paste it or download this preview.'
    : 'AI opened. Automatic attachment and clipboard copy are unavailable; download this preview and upload it manually.');
}
function beginCrop() { cropStart = cropBox = null; $('preview-wrap').classList.add('selecting'); $('selection').hidden = true; $('apply-crop').hidden = false; status('Drag over the image, then choose Use selected area.'); }
$('tab').addEventListener('click', async () => {
  try { await showPreview(await blobFromDataUrl(await chrome.tabs.captureVisibleTab({ format: 'png' }))); status('Preview ready. Review it before sharing.'); }
  catch { status('Chrome could not capture this tab. Open a regular web page and try again.'); }
});
$('tab-area').addEventListener('click', async () => {
  try { const result = await chrome.runtime.sendMessage({ type: 'select-tab-area', targetUrl: $('quick-ai').value }); if (!result?.ok) throw new Error(); window.close(); }
  catch { status('Area selection could not start. Try Current tab, then Select area.'); }
});
$('screen').addEventListener('click', () => {
  const targetUrl = $('quick-ai').value;
  chrome.desktopCapture.chooseDesktopMedia(['screen'], async (streamId) => {
    if (!streamId) { status('Screen sharing cancelled. You can try again or capture the current tab.'); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId } }, audio: false });
      const video = document.createElement('video'); video.srcObject = stream; await video.play();
      const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach(track => track.stop());
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      await showPreview(blob); await openAiWithImage(blob, targetUrl);
    } catch { status('Screen capture or AI handoff failed. If a preview is available, download it; otherwise capture again.'); }
    finally { stream?.getTracks().forEach(track => track.stop()); }
  });
});
$('download').addEventListener('click', async () => {
  try { const extension = imageBlob.type === 'image/jpeg' ? 'jpg' : 'png'; await chrome.downloads.download({ url: previewUrl, filename: `captureask-${Date.now()}.${extension}`, saveAs: true }); status('Download requested. Check Chrome Downloads for completion.'); }
  catch { status('Download could not start. Try Copy image or capture again.'); }
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.write([new ClipboardItem({ [imageBlob.type]: imageBlob })]); status('Image copied. Paste it into the AI chat and check its thumbnail.'); }
  catch { status('Clipboard access failed. Download the preview and upload it manually.'); }
});
$('send').addEventListener('click', async () => { try { await openAiWithImage(imageBlob, $('ai').value); } catch (error) { status(error.message); } });
$('again').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'discard-capture' });
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  imageBlob = previewUrl = null; $('preview-panel').hidden = true; $('capture-panel').hidden = false; status('Capture discarded.');
});
chrome.storage.local.remove('pendingAiImage');
chrome.storage.local.get('preferredAi').then(({ preferredAi }) => { if (preferredAi) { $('ai').value = preferredAi; $('quick-ai').value = preferredAi; } });
chrome.storage.session.get(['pendingCapturePreview','captureStatus']).then(async ({ pendingCapturePreview, captureStatus }) => {
  if (pendingCapturePreview) await showPreview(await blobFromDataUrl(pendingCapturePreview.dataUrl),true);
  if (captureStatus) status(captureStatus); else if (pendingCapturePreview) status('Recovered the last capture. Check the AI thumbnail, or download this preview.');
}).catch(() => status('The saved preview could not be recovered. Capture again.'));
$('crop').addEventListener('click', beginCrop);
function point(event) { const rect = $('preview').getBoundingClientRect(); return { x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)), y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)) }; }
$('preview-wrap').addEventListener('pointerdown', event => { if (!$('preview-wrap').classList.contains('selecting')) return; cropStart = point(event); $('selection').hidden = false; event.currentTarget.setPointerCapture(event.pointerId); });
$('preview-wrap').addEventListener('pointermove', event => { if (!cropStart) return; const end = point(event); cropBox = { x: Math.min(cropStart.x,end.x), y: Math.min(cropStart.y,end.y), w: Math.abs(end.x-cropStart.x), h: Math.abs(end.y-cropStart.y) }; const image = $('preview'); Object.assign($('selection').style,{left:(image.offsetLeft+cropBox.x)+'px',top:(image.offsetTop+cropBox.y)+'px',width:cropBox.w+'px',height:cropBox.h+'px'}); });
$('preview-wrap').addEventListener('pointerup', () => { cropStart = null; });
$('apply-crop').addEventListener('click', async () => {
  if (!cropBox || cropBox.w < 5 || cropBox.h < 5) { status('Select an area at least 5 pixels wide and high.'); return; }
  try { const image=$('preview'), scaleX=image.naturalWidth/image.clientWidth, scaleY=image.naturalHeight/image.clientHeight, canvas=document.createElement('canvas'); canvas.width=Math.round(cropBox.w*scaleX); canvas.height=Math.round(cropBox.h*scaleY); canvas.getContext('2d').drawImage(image,cropBox.x*scaleX,cropBox.y*scaleY,canvas.width,canvas.height,0,0,canvas.width,canvas.height); await showPreview(await new Promise(resolve => canvas.toBlob(resolve,'image/png'))); status('Cropped preview ready.'); }
  catch { status('Cropping failed. Download the existing preview or select another area.'); }
});
