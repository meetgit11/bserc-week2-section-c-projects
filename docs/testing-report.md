# Section C — testing report

Test dates: 5–7 November 2026. VM checks were run in the author's workspace (Node, no browser); live checks were run in the user's Chrome on his laptop, extensions loaded unpacked.

## Chat Saver

| Check | Result |
|---|---|
| JS syntax (`node --check`, all JS files) | Pass (5 Nov 2026, VM) |
| Manifest valid JSON, Manifest V3 | Pass (5 Nov 2026, VM) |
| Markdown conversion (Node, fake inputs) | Pass — 6/6 (5 Nov 2026, VM) |
| All manifest-referenced files exist | Pass (5 Nov 2026, VM) |
| Sends nothing to any server | Pass (5 Nov 2026, VM) |
| Loads unpacked in real Chrome | Pass (6 Nov 2026) |
| Finds messages on a real ChatGPT chat | Pass after fix (7 Nov 2026) — popup: 6 messages · 23 code blocks |
| Save as Markdown produces a real file | Pass (7 Nov 2026) — .md opened in VS Code, content present |
| `##` heading count equals message count | Not yet hand-checked |
| Works on Claude too | Not yet |
| PDF export (real selectable text) | Not yet |
| Select-only export | Not yet |
| Saved code block copies out and runs | Not yet |
| Table stays a table | Not yet |

Bug found and fixed during testing: first real-Chrome test showed "no messages found on this page yet" because ChatGPT's markup had changed — 0 for `[data-message-author-role]`, `<article>`, and `[data-testid^="conversation-turn-"]`. Fix: `parseChatGPT()` rewritten as a layered parser on the live markers (`data-turn-key`, `data-conversation-role`, `data-user-message-bubble`, `data-chatgpt-agent-turn-start`); the no-messages alert now prints live marker counts. The first re-test failed only because the old `content.js` was still loaded in the tab — reloading the extension *and* the tab fixed it.

## Style Spy

| Check | Result |
|---|---|
| JS syntax (`node --check`, all JS files) | Pass (5 Nov 2026, VM) |
| Manifest valid JSON, Manifest V3 | Pass (5 Nov 2026, VM) |
| Colour ranking (Node, fake inputs) | Pass — 5/5 (5 Nov 2026, VM) |
| All manifest-referenced files exist | Pass (5 Nov 2026, VM) |
| Sends nothing to any server | Pass (5 Nov 2026, VM) |
| Loads unpacked in real Chrome | Pass (6 Nov 2026) |
| Results match the page by hand (5 websites) | Partial — 1 of 5: hacktoberfest.com, 7 Nov 2026, 653 elements; top colours #10201d 75% and #f7f7f2 15% match the visible page |
| Saved kit survives a Chrome restart | Not yet |
| Kit exported as `.css` styles a plain page | Not yet |
| Click-to-copy | Not yet |

## Static checks (author's workspace, 5 Nov 2026)

- `node --check` passed on every JS file in both extensions.
- Both manifests are valid JSON, Manifest V3, and every referenced file exists.
- Grep over all JS found no `fetch(`, no `XMLHttpRequest`, no external URLs (only the chat sites' own domains in Chat Saver's manifest match patterns and an `example.com` URL inside a test).

## Screenshots

Genuine screenshots from the test machine, 7 November 2026: `docs/screenshots/chat-saver-popup.png` (Chat Saver popup: 6 messages · 23 code blocks) and `docs/screenshots/style-spy-hacktoberfest.png` (Style Spy on hacktoberfest.com, cropped to the extension popup).
