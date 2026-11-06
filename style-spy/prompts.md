# prompts.md — Style Spy (BSERC Week 2, Section C)

Prompts used, in order, as required by the Week 2 PDF.

## 1. Parent agent → builder (5 Nov 2026)
> Build BSERC Week 2 Section C — TWO Chrome extensions (Manifest V3), no external libraries, no network calls, nothing sent to any server. Context: BSERC GenAI Internship Week 2 (Bharat Space Education Research Centre, instructor Karan Bagul). Source PDF: ~/workspace/user/files/Week-2-Projects.pdf (read the Section C pages: Chat Saver p.14, Style Spy p.15). Build plan: ~/workspace/bserc-week2/plan.md — read it first. PDF rules: test with fake/sample data only, no paid API/login, keep prompts in order.
>
> EXTENSION 2 — Style Spy in ~/workspace/bserc-week2/section-c-style-spy/ : Click any website to grab its colours and fonts, then save them as a kit. Popup + content script: read each visible element's computed style, rank the page's main colours by how much of the page uses each (area-weighted: element width × height), show fonts with weights and sizes, click anything to copy it. Save kits under a name (chrome.storage.local), list/delete saved kits, export a kit as CSS variables (:root { --color-1: ...; --font-heading: ... }) downloadable as a .css file and copyable. Works on any website; no server calls.
>
> Deliverables per extension folder: manifest.json + all JS/CSS/HTML files, icons (simple inline SVG or canvas-generated PNGs — no external images), README.md, prompts.md, test-checklist.md. Verification you MUST do here: `node --check` on every JS file; `python3 -m json.tool` on manifest.json; load-test the pure functions (Markdown conversion, colour ranking, CSS export) in Node with small fake inputs and report the results. You CANNOT load the extensions in a real Chrome here (no browser in this VM) — say so honestly in the test checklist and in your final report, with the exact 2-minute checks the user must do in their Chrome (including the 5-website check for Style Spy and the 50+ message chat check for Chat Saver).

Result: built `manifest.json`, `lib/style.js`, `content.js`, `popup.html`/`popup.css`/`popup.js`, PIL-generated icons, `test/test-style.js` (5/5 tests pass), README and this file. `node --check` passed on all JS; `python3 -m json.tool` passed on the manifest; no network calls in the code (grep-verified). Real-Chrome load test not possible in this VM — see test-checklist.md.

<!-- Add each further prompt below, in order, as work continues. -->
