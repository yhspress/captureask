const status = document.querySelector("#status"); let mode = "full";
document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click",()=>{mode=button.dataset.mode;document.querySelectorAll("[data-mode]").forEach(item=>item.classList.toggle("active",item===button));document.querySelector("#mode-note").textContent=mode==="full"?"현재 보이는 Chrome 탭을 캡처합니다.":"드래그하여 필요한 영역만 선택합니다.";}));
document.querySelectorAll("button[data-target]").forEach((button) => button.addEventListener("click", () => {
  status.textContent = "캡처 중…";
  chrome.runtime.sendMessage({ type: mode === "region" ? "select-region" : "capture", target: button.dataset.target }, (response) => {
    if (!response?.ok) { status.textContent = "실패"; return; }
    status.textContent = response.action === "downloaded" ? "저장됨" : response.action === "opened-without-copy" ? "AI 탭을 열었어요 · 직접 붙여넣기" : "AI 탭을 열었어요";
  });
}));
