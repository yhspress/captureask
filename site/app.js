const locales = window.CAPTUREASK_I18N;
const codes = ['en', 'ko', 'ja', 'zh-TW', 'es', 'pt', 'ar', 'fr'];
const segment = location.pathname.split('/').filter(Boolean)[0];
const code = locales[segment] ? segment : 'en';
const t = locales[code];
const seo = {
  en:['CaptureAsk — Capture Screens. Ask AI.','CaptureAsk is a Chrome extension that captures your screen, tab, or selected area and prepares it for AI questions.'],
  ko:['CaptureAsk — 화면을 캡처하고 AI에 질문하세요.','CaptureAsk는 전체 화면, 현재 탭 또는 선택 영역을 캡처하여 AI 질문에 활용할 수 있도록 준비하는 Chrome 확장 프로그램입니다.'],
  ja:['CaptureAsk — 画面をキャプチャして AI に質問。','CaptureAsk は画面全体、現在のタブ、または選択範囲をキャプチャして AI の質問に活用できる Chrome 拡張機能です。'],
  'zh-TW':['CaptureAsk — 擷取畫面，詢問 AI。','CaptureAsk 是可擷取整個螢幕、目前分頁或選取區域，並用於 AI 提問的 Chrome 擴充功能。'],
  es:['CaptureAsk — Captura pantallas. Pregunta a la IA.','CaptureAsk es una extensión de Chrome que captura la pantalla, la pestaña o un área seleccionada para hacer preguntas a la IA.'],
  pt:['CaptureAsk — Capture telas. Pergunte à IA.','CaptureAsk é uma extensão do Chrome que captura a tela, a aba ou uma área selecionada para perguntas à IA.'],
  ar:['CaptureAsk — التقط الشاشة. اسأل الذكاء الاصطناعي.','CaptureAsk إضافة Chrome تلتقط الشاشة أو علامة التبويب أو منطقة محددة لاستخدامها في أسئلة الذكاء الاصطناعي.'],
  fr:['CaptureAsk — Capturez l’écran. Demandez à l’IA.','CaptureAsk est une extension Chrome qui capture l’écran, l’onglet ou une zone sélectionnée pour vos questions à l’IA.']
};
document.documentElement.lang = code;
document.documentElement.dir = t.dir;
document.title = seo[code][0];
const description = document.querySelector('meta[name="description"]');
if (description) description.setAttribute('content', seo[code][1]);
document.querySelectorAll('[data-t]').forEach(el => { const value = t[el.dataset.t]; if (value) el.innerHTML = value; });
const language = document.querySelector('#language');
if (language) {
  language.innerHTML = codes.map(value => `<option value="${value}" ${value === code ? 'selected' : ''}>${locales[value].name}</option>`).join('');
  language.onchange = () => { const page = document.body.dataset.page === 'guide' ? 'guide' : ''; location.href = language.value === 'en' ? `/${page}` : `/${language.value}/${page}`; };
}
const steps = document.querySelector('#steps');
if (steps) steps.innerHTML = t.steps.map(item => `<li><b>${item[0]}</b><h3>${item[1]}</h3><p>${item[2]}</p></li>`).join('');
const installList = document.querySelector('#installList');
if (installList) installList.innerHTML = t.installSteps.map(item => `<li>${item}</li>`).join('');
const startList = document.querySelector('#startList');
if (startList) startList.innerHTML = t.startList.map(item => `<li>${item}</li>`).join('');
document.querySelectorAll('a[href^="/"]').forEach(link => {
  if (code === 'en' || link.href.includes('//')) return;
  const href = link.getAttribute('href');
  if (href === '/') link.href = `/${code}/`;
  else if (href.startsWith('/guide.html')) link.href = `/${code}/guide${href.slice(11)}`;
});
