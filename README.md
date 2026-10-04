# CaptureAsk

`site/` contains the static marketing and help pages for `captureask.com`.

`extension/` contains the v0.3.7 release candidate based on the previously downloadable v0.3.6 package. In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, then select the `extension/` folder. This branch does not publish the candidate or update installed extensions.

## Current extension scope

- Capture the visible area of the active Chrome tab.
- Select and crop a region of the active tab.
- Capture a monitor after Chrome's screen-sharing confirmation.
- Save the capture using Chrome's download prompt.
- Copy a capture to the clipboard and open ChatGPT, Claude, Gemini, or Grok.

Selecting an AI attempts to assign the capture to that provider's file input in the newly opened tab. Upload completion is unconfirmed: check its image thumbnail. No chat message is submitted. The preview remains available for manual download in browser-session storage, within its capacity limit. Clipboard failure has an explicit download fallback.

## Local verification

Run `node scripts/check-site.mjs` and `node scripts/check-extension.mjs`. `scripts/check-browser.mjs` runs local Chromium fixtures using an existing Playwright installation; set `CAPTUREASK_PLAYWRIGHT_ROOT` to a directory with `@playwright/test` installed. These fixtures cover UI and file assignment, and do not authenticate to or confirm upload acceptance by third-party AI services. Rebuild the release ZIP from `extension/*` after changes and verify every ZIP entry against its source.

On PowerShell 7, `./scripts/package-extension.ps1` rebuilds the ZIP using the manifest version and checks every entry against its source bytes.

## AdSense

The landing page contains a labeled placeholder only. Add AdSense code after approval and keep advertising separate from the extension-install and usage actions.
