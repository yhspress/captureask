# CaptureAsk Chrome extension

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `extension` folder.
4. Pin CaptureAsk in Chrome's toolbar.

This v0.3.7 candidate captures a monitor after Chrome's screen-sharing picker, the visible tab, or a selected tab area. Screen and area capture open the chosen AI and attempt to assign the image to its upload control. Current tab opens a preview first. Check the AI's image thumbnail before sending your question; selecting a file does not confirm that the provider accepted it. No message is submitted automatically.

Reopen CaptureAsk to recover and download the last preview. PNG captures download as PNG; screen JPEG captures download as JPEG. Clipboard copy can fail, so use the download fallback. The pending handoff is restricted to the newly opened AI tab and expires after two minutes; the recovery preview stays in browser-session memory until replaced, discarded, or the browser closes. Very large previews exceeding session capacity must be downloaded before the popup closes. Only the AI preference is stored locally; legacy on-disk screenshot queues are removed on update, startup, and popup open.
