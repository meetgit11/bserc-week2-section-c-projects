# prompts.md — Chat Saver (BSERC Week 2, Section C)

Prompts used, in order, as required by the Week 2 PDF.

## 1. Parent agent → builder (5 Nov 2026)
> Build BSERC Week 2 Section C — TWO Chrome extensions (Manifest V3), no external libraries, no network calls, nothing sent to any server. Context: BSERC GenAI Internship Week 2 (Bharat Space Education Research Centre, instructor Karan Bagul). Source PDF: ~/workspace/user/files/Week-2-Projects.pdf (read the Section C pages: Chat Saver p.14, Style Spy p.15). Build plan: ~/workspace/bserc-week2/plan.md — read it first. PDF rules: test with fake/sample data only, no paid API/login, keep prompts in order.
>
> EXTENSION 1 — Chat Saver in ~/workspace/bserc-week2/section-c-chat-saver/ : Works on at least 2 AI chat websites: ChatGPT (chatgpt.com / chat.openai.com) and Claude (claude.ai). A content script finds how each page separates user messages from AI replies (use the sites' message/article structure with defensive fallbacks — selectors change, so keep the parsing in one clearly-commented function per site plus a generic fallback that treats top-level message blocks in order). Save the full chat or only the messages the user selects (click a message to toggle selection, with a floating toolbar: count of messages/code blocks, "Save as Markdown", "Save as PDF", "Select all / Clear"). Keep headings, lists, tables and code blocks. Export as Markdown (.md download) and as PDF (open a clean print view in a new tab and call window.print so the user saves via Print to PDF — text stays selectable). Name the file from the chat's title (sanitised). manifest.json (Manifest V3), content script, popup or toolbar UI, README with load-unpacked steps (chrome://extensions → Developer mode → Load unpacked).
>
> Deliverables per extension folder: manifest.json + all JS/CSS/HTML files, icons (simple inline SVG or canvas-generated PNGs — no external images), README.md, prompts.md, test-checklist.md. Verification you MUST do here: `node --check` on every JS file; `python3 -m json.tool` on manifest.json; load-test the pure functions (Markdown conversion, colour ranking, CSS export) in Node with small fake inputs and report the results. You CANNOT load the extensions in a real Chrome here (no browser in this VM) — say so honestly in the test checklist and in your final report, with the exact 2-minute checks the user must do in their Chrome.

Result: built `manifest.json`, `content.js`, `lib/markdown.js`, `background.js`, `print.html`/`print.js`, `popup.html`/`popup.js`, PIL-generated icons, `test/test-markdown.js` (6/6 tests pass), README and this file. `node --check` passed on all JS; `python3 -m json.tool` passed on the manifest; no network calls in the code (grep-verified). Real-Chrome load test not possible in this VM — see test-checklist.md.

<!-- Add each further prompt below, in order, as work continues. -->

## Fix prompt — user → Muse (7 Nov 2026, ~00:50 IST)
> Chat Saver showed "no messages found on this page yet" on a real open ChatGPT chat. User ran console probes as directed: role/article/turn counts all 0; only 2 data-testids on the page; filtered data-* list (20) showed the new markers data-turn-key, data-conversation-role, data-user-message-bubble, data-chatgpt-agent-turn-start.

Result: `content.js` — `parseChatGPT()` rewritten as a layered parser using the live markers (turn-key containers first, then role elements, then bubbles/agent-turn-starts, old selectors last), plus `normaliseRole()` and marker counts in the no-messages alert. Re-test pending on the user's machine.
