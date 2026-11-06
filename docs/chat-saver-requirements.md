# Chat Saver — requirements and verification

Source: BSERC Week 2 PDF, Section C, Project 12 (Chat Saver).

## Requirements (from the PDF)

- Save a chat from ChatGPT or Claude as Markdown or PDF.
- Works on 2 AI chat websites.
- A long chat of 50 or more messages saves completely.
- Code from the saved file can be copied and still runs.
- Tables stay as tables.
- Done when: the checks above pass, plus PDF export and select-only export work and the file is named from the chat title.

## What was built

- `content.js` — per-site parsers (ChatGPT: `data-turn-key` / `data-conversation-role` / `data-user-message-bubble` / `data-chatgpt-agent-turn-start`, old selectors as fallback; Claude: `data-testid="user-message"` / `"assistant-message"` / `.font-claude-message`) + generic fallback; floating toolbar; click-to-select.
- `lib/markdown.js` — DOM-to-Markdown conversion (headings, bold/italic/links, fenced code with language, GFM tables, ordered/unordered lists), filename sanitising (illegal chars stripped, empty title → "chat", 120-char cap).
- `popup.js` / `popup.html` — message/code-block counts, Save as Markdown / Save as PDF, Select all / Clear selection / Show toolbar.
- `background.js` + `print.html` / `print.js` — PDF export via a local print view (print job held in memory only).
- `manifest.json` — Manifest V3; matches chatgpt.com, chat.openai.com, claude.ai.

## Verification

| Check | Result |
|---|---|
| JS syntax (`node --check`, all JS files) | Pass (5 Nov 2026, VM) |
| Manifest valid JSON, Manifest V3 | Pass (5 Nov 2026, VM) |
| Markdown conversion (Node, fake inputs) | Pass — 6/6 (5 Nov 2026, VM) |
| All manifest-referenced files exist | Pass (5 Nov 2026, VM) |
| Sends nothing to any server | Pass — no `fetch(`/`XMLHttpRequest`/external URLs (5 Nov 2026, VM) |
| Loads unpacked in real Chrome | Pass (6 Nov 2026) |
| Finds messages on a real ChatGPT chat | Pass after fix (7 Nov 2026) — popup reported 6 messages · 23 code blocks |
| Save as Markdown produces a real file | Pass (7 Nov 2026) — .md opened in VS Code, content present |
| `##` heading count equals message count | Not yet hand-checked |
| Works on 2 AI chat websites (ChatGPT + Claude) | Partial — ChatGPT verified; Claude not yet |
| PDF export (real selectable text) | Not yet |
| Select-only export | Not yet |
| Saved code block copies out and runs | Not yet |
| Table stays a table | Not yet |

## Bug found on the live page and fixed

First real-Chrome test (6 Nov 2026) showed "no messages found on this page yet" on an open chat. Cause: ChatGPT's markup had changed since the extension was written — console probes returned 0 for `[data-message-author-role]`, `<article>`, and `[data-testid^="conversation-turn-"]`, and only 2 distinct `data-testid` values existed on the whole page. Fix (7 Nov 2026): `parseChatGPT()` rewritten as a layered parser on the live markers (`data-turn-key`, `data-conversation-role`, `data-user-message-bubble`, `data-chatgpt-agent-turn-start`); the no-messages alert now prints live marker counts. The first re-test failed only because the old `content.js` was still loaded in the tab — reloading the extension *and* the tab fixed it.
