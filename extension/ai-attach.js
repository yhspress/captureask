let attaching = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const siteSelectors = {
  'chatgpt.com': {
    file: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    composer: ['#prompt-textarea', '[contenteditable="true"]', 'textarea'],
  },
  'claude.ai': {
    file: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    composer: ['[contenteditable="true"]', 'textarea'],
  },
  'gemini.google.com': {
    file: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    composer: ['[contenteditable="true"]', 'textarea'],
  },
  'grok.com': {
    file: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    composer: ['[contenteditable="true"]', 'textarea'],
  },
};

function configForCurrentSite() {
  return Object.entries(siteSelectors).find(([host]) => location.hostname === host || location.hostname.endsWith(`.${host}`))?.[1];
}

function firstMatch(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

async function waitForFileInput(config) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const input = firstMatch(config.file);
    if (input && !input.disabled) return input;
    await sleep(250);
  }
  return null;
}

function setFiles(input, files) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
  if (!descriptor?.set) throw new Error('Browser does not allow file assignment.');
  descriptor.set.call(input, files);
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

async function attachPendingImage() {
  if (attaching) return;
  const config = configForCurrentSite();
  const { pendingAiImage } = await chrome.runtime.sendMessage({ type: 'get-pending-image' });
  if (!pendingAiImage) return;
  if (pendingAiImage.expiresAt < Date.now()) return;
  if (!config || pendingAiImage.targetOrigin !== location.origin) return;
  attaching = true;
  const notice = document.createElement('aside');
  notice.setAttribute('role', 'status');
  Object.assign(notice.style, {position:'fixed',bottom:'16px',right:'16px',zIndex:'2147483647',maxWidth:'340px',padding:'14px',background:'#fff',color:'#14213d',border:'2px solid #2962ff',borderRadius:'8px',font:'14px Arial,sans-serif'});
  const text = document.createElement('p'); text.textContent = 'CaptureAsk is trying to attach your capture. Check the AI image thumbnail before sending.';
  const download = document.createElement('a'); download.textContent = 'Save capture for manual upload'; download.href = pendingAiImage.dataUrl; download.download = pendingAiImage.filename || 'captureask.png';
  const close = document.createElement('button'); close.textContent = 'Dismiss'; close.style.marginLeft = '12px'; close.addEventListener('click', () => notice.remove());
  notice.append(text,download,close); document.documentElement.append(notice);
  try {
    const input = await waitForFileInput(config);
    if (!input) { text.textContent = 'CaptureAsk could not find an image upload control. Save the capture below, then upload it manually.'; return; }
    const blob = await fetch(pendingAiImage.dataUrl).then((response) => response.blob());
    const transfer = new DataTransfer();
    transfer.items.add(new File([blob], pendingAiImage.filename || 'captureask.png', { type: pendingAiImage.mime || blob.type || 'image/png', lastModified: Date.now() }));
    setFiles(input, transfer.files);
    text.textContent = 'CaptureAsk selected the file; upload completion is unconfirmed. Check for an image thumbnail, or save and upload it manually.';
    await sleep(80);
    firstMatch(config.composer)?.focus({ preventScroll: true });
  } catch {
    text.textContent = 'Automatic attachment failed. Save the capture below, or reopen CaptureAsk to download the preview.';
  } finally {
    attaching = false;
  }
}

attachPendingImage().catch(() => { /* CaptureAsk retains the browser-session preview for recovery. */ });
