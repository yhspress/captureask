# CaptureAsk Project Manual

## Product

CaptureAsk is a free Manifest V3 Chrome extension for visible-tab and selected-area screenshots. Users can save captures or copy one to the clipboard before opening ChatGPT, Claude, Gemini, or Grok. The extension must never contain AdSense code, advertising, an advertising reward, or a time gate.

## Website and revenue model

`captureask.com` is the editorial product, hosted on Cloudflare Pages and sourced from GitHub. AdSense is considered only for substantial, original guide pages. Ads must be clearly identified, separated from download, install, navigation, and capture controls, and never be required to install or use the extension. Do not ask users to click ads, open ad pop-ups, or put ads in the extension.

## Content plan

Maintain original guides covering: setup; screenshot question-writing; ChatGPT, Claude, Gemini, and Grok workflows; privacy and permissions; and advertising transparency. Add screenshots, tested examples, dates, and author review before publishing. Keep privacy, terms, and contact pages available.

## Languages and routes

English is the primary language. Fully translated routes are `/ko/`, `/ja/`, `/zh-TW/`, `/es/`, `/pt/`, `/ar/`, and `/fr/`, with matching `/guide.html` pages. The selector changes the URL; Cloudflare Pages `_redirects` routes those localized URLs to the translated application.

## Operations

1. Edit `site/` and validate the language routes locally.
2. Commit and push to `https://github.com/yhspress/captureask`.
3. Deploy `site/` to Cloudflare Pages project `captureask`.
4. Verify the deployed home page, guide page, all language paths, and that no time gate or ad reward wording exists.
5. Add AdSense only after site approval; use the account-provided code unchanged.

## Current candidate and verification

The isolated v0.3.7 candidate aligns `extension/` with the formerly ZIP-only v0.3.6 implementation. It repairs popup initialization and crop controls, exposes status outside hidden panels, distinguishes attempted file assignment from confirmed upload, retains a session preview for manual download, scopes the handoff to the opened AI tab, and clears legacy disk-backed screenshots. No new permissions were added relative to the shipped v0.3.6 ZIP. This candidate is not deployed.

Verify the static pages with `node scripts/check-site.mjs`, the handoff contract with `node scripts/check-extension.mjs`, and the local Chromium fixtures with `node scripts/check-browser.mjs`. The browser fixtures test file assignment and recovery without AI accounts; live provider upload acceptance and Chrome's operating-system picker require separate interactive checks.

## Current limitations

Chrome requires explicit screen-sharing confirmation for monitor capture. Provider file controls may accept an assigned image, but the extension cannot guarantee upload acceptance. The user must check the image thumbnail, and can download the retained preview for manual upload.
