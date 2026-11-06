# Test checklist — Chat Saver (PDF p.14, Project 12)

"Done when" items from the PDF, ticked only for what was actually verified here.

## Verified in this VM (5 Nov 2026)

- [x] **JS syntax** — `node --check` passed on every JS file: `lib/markdown.js`, `content.js`, `background.js`, `print.js`, `popup.js`, `test/test-markdown.js`.
- [x] **Manifest valid** — `python3 -m json.tool manifest.json` passed; Manifest V3.
- [x] **Markdown conversion (pure functions, Node, fake inputs)** — `node test/test-markdown.js`: **6/6 passed**:
  - headings + bold/italic/links
  - fenced code block keeps its language and code intact
  - table becomes a GFM table (`| Name | Score |`, separator row, data row)
  - ordered + unordered lists
  - whole-chat export keeps You/Assistant roles, title, source URL, and runnable fenced code
  - filename sanitising (illegal chars stripped, empty title → "chat", 120-char cap)
- [x] **All manifest-referenced files exist** — checked by script; none missing.
- [x] **Sends nothing to any server** — grep over all JS found no `fetch(`, no `XMLHttpRequest`, no external URLs (only the chat sites' own domains in the manifest's match patterns and the `example.com` URL inside a test).

## NOT verified here — needs your Chrome (no browser in this VM)

- [ ] **A long chat of 50 or more messages saves completely.** How to check (2 min): load the extension unpacked, open a ChatGPT chat with 50+ messages, Save as Markdown, count the `##` headings in the file — it must equal the number of messages in the chat.
- [ ] **Code from the saved file can be copied and still runs.** How to check: save a chat containing a Python code block, copy the code out of the `.md` file, paste it into a Python file and run it.
- [ ] **Tables stay as tables.** How to check: save a chat containing a table and open the `.md` — the table must render as a table (or be a valid GFM table), not a jumble of lines.
- [ ] **Works on 2 AI chat websites.** How to check: do the Markdown + PDF saves above on **ChatGPT** and then on **Claude** (claude.ai).
- [ ] **PDF export.** How to check: Save as PDF → print view opens → Print → Save as PDF → open the PDF and select/copy a line of text.
- [ ] **Select-only export.** How to check: click two messages (blue outline), save — the file must contain only those two.
- [ ] **File named from the chat title.** How to check: the downloaded file's name must match the chat's title.

## Known limits

- ChatGPT/Claude change their page markup over time. If the extension ever finds 0 messages or labels roles as "Message 1, 2, …", the selectors in `parseChatGPT` / `parseClaude` in `content.js` need updating — the generic fallback will still save the message blocks in order.

## Live Chrome test (6–7 Nov 2026, user's machine)

- [x] **Loads unpacked without errors** — both extensions loaded at chrome://extensions, no load errors.
- [ ] **ChatGPT save — FAILED first try (6 Nov 2026, ~20:50 IST):** on a real open chat, Save as Markdown showed "Chat Saver: no messages found on this page yet." Console probes on the live page: `[data-message-author-role]` = 0, `<article>` = 0, `[data-testid^="conversation-turn-"]` = 0; only 2 distinct `data-testid` values on the whole page, neither a message. Filtered `data-*` names (20) include the new markers: `data-turn-key`, `data-conversation-role`, `data-user-message-bubble`, `data-chatgpt-agent-turn-start`, `data-chatgpt-selection-message-id`.
- [ ] **Fix applied 7 Nov 2026 (~00:50 IST) in `content.js`:** `parseChatGPT()` rewritten as a layered parser — (1) outermost `[data-turn-key]` containers with role from `data-conversation-role` / user bubble / agent-turn-start, (2) `[data-conversation-role]` elements, (3) bubbles + agent-turn-starts directly, (4) old selectors as fallback; `normaliseRole()` added; the "no messages found" alert now prints live marker counts so the next debug round needs no guessing. Syntax-checked with `node --check`. **Re-test pending on the user's machine:** reload the extension, reload the ChatGPT tab, scroll to the top of the chat first, Save as Markdown, count `##` headings vs message count.
- [x] **Re-test 7 Nov 2026 (~01:13 IST): EXPORT WORKS.** After replacing content.js, reloading the extension AND the ChatGPT tab, Save as Markdown produced a real .md file (opened in VS Code, content present). Note: the first re-test failed only because the old content.js was still loaded in the tab — the alert had no marker counts, which proved it. Still to confirm on this export: `##` heading count vs message count in the chat.
- [x] **Live Chrome re-test 7 Nov 2026 (~01:24 IST): WORKS.** Popup on the "Build GhostShell Project" chat reported "6 messages · 23 code blocks · 6 selected"; Save as Markdown produced a real .md file (opened in VS Code, content present). Still to confirm by hand: `##` heading count in the file vs 6 messages; Claude test; PDF export text check; select-only export; code-block-runs check; table check.
