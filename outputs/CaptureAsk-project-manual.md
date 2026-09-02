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

## Current limitations

Browser extensions cannot silently capture the entire operating system or automatically upload into third-party AI text fields. CaptureAsk therefore captures the visible tab or user-selected area and uses the clipboard for AI handoff.
