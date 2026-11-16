# CaptureAsk

`site/` contains the static marketing and help pages for `captureask.com`.

`extension/` is a Manifest V3 Chrome extension MVP. In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, then select the `extension/` folder.

## Current extension scope

- Capture the visible area of the active Chrome tab.
- Select and crop a region of the active tab.
- Save the capture using Chrome's download prompt.
- Copy a capture to the clipboard and open ChatGPT, Claude, Gemini, or Grok.

It intentionally does not attempt unattended operating-system-wide capture or automatic upload into third-party AI chat fields.

## AdSense

The landing page contains a labeled placeholder only. Add AdSense code after approval and keep advertising separate from the extension-install and usage actions.

## Production source and review preparation (2026-11-16)

The published website uses the downloadable `site/downloads/CaptureAsk-extension-v0.3.6-full-screen.zip`. The older `extension/` MVP above is not the published v0.3.6 package. Do not rebuild the production download from that directory. Cloudflare Pages project `captureask` currently uses direct uploads, not automatic Git deployments.

Build editorial pages with `node scripts/build-editorial.mjs` and validate with `node scripts/check-site.mjs`. The screenshot-evidence worksheet consolidates the worked arithmetic example previously embedded in the area-capture guide; that guide links to the worksheet. Its invented dataset is labeled, and it makes no claim of a live AI-provider upload test.
