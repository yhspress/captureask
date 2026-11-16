# AdSense content revision — 2026-09-13

Publisher: `pub-8403055012653535`.

Removed the AdSense loader from all 16 home/setup pages. No ad units are enabled by this revision. Keep the ownership meta tag and ads.txt. After approval, configure advertising separately on substantive articles and verify actual placements before enabling it. Do not place ads on installation/download actions, legal/contact pages or error pages.

Expanded three practical articles using the downloadable v0.3.6 ZIP as the implementation reference: full-screen capture, area capture and AI attachment troubleshooting. The repository's older extension/ directory is not the published v0.3.6 artifact. Illustrative examples are labeled; no provider upload test or invented screenshot is claimed.

Added localized capture/attachment/prompt guidance to all eight home and setup routes. Detailed English articles are explicitly identified as English. Translation alone is not proof of a policy violation; Google has not identified an exact rejected URL in the supplied screenshot.

Build: `node scripts/refresh-pages.mjs` followed by `node scripts/build-editorial.mjs`. Check: `node scripts/check-site.mjs` plus public page/asset validation after deployment.

After checking the live revision, request another review in AdSense. Approval is Google's decision; this content revision does not itself submit or guarantee approval.

## Rejection follow-up — 2026-11-16

AdSense still reports low-value content. Public ads.txt returns HTTP200 with the correct publisher while the dashboard says not found; these are separate states and neither establishes content approval.

Prepared a screenshot-evidence worksheet with explicit arithmetic, missing-data boundaries and a reusable review record. Removed the repeated worked example from the area-capture article and linked the worksheet instead. Used semantic HTML table text (16px at390px viewport) rather than a downscaled SVG. Preserved all download assets and paused advertising. Existing16 language/page behavior cases,128 language switches and452 local links/assets pass.

This is a verified content and usability improvement, not evidence that Google will approve the site. Recheck deployed content, download hash, mobile layout, legal/contact routes, robots/sitemap and the actual AdSense state before reporting review readiness.
