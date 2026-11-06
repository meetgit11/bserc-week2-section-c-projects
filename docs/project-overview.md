# Section C — project overview

Two Manifest V3 Chrome extensions, built for the BSERC GenAI Internship Week 2 (Section C: browser extensions), and tested in real Chrome.

## Chat Saver

Saves a ChatGPT or Claude chat as Markdown or PDF.

- **Parsing:** per-site parsers plus a generic fallback. ChatGPT's markup changed during testing (Nov 2026): the parser now reads the live markers `data-turn-key`, `data-conversation-role`, `data-user-message-bubble`, `data-chatgpt-agent-turn-start`, with the old selectors kept as a fallback. Claude uses `data-testid="user-message"` / `"assistant-message"` / `.font-claude-message`.
- **Features:** floating toolbar + popup, click-to-select messages (blue outline), whole-chat or selected-only export, Markdown (GFM tables, fenced code) + Print-to-PDF via a clean print view, filename from the chat title.
- **Privacy:** no network calls, no account, no login; exports are built locally.
- **Key files:** `content.js`, `lib/markdown.js`, `popup.js`, `popup.html`, `background.js` (holds one print job in memory), `print.html`, `print.js`, `manifest.json`.

## Style Spy

Shows any page's colours and fonts.

- **Analysis:** on-demand content script reads computed styles; colours ranked by visible area (not element count); fonts from the computed `font-family` stack (first family only), with weights and sizes.
- **Features:** popup with colour swatches + font rows (click to copy), kits saved in `chrome.storage.local`, CSS-variable export (`--color-1`, `--font-heading`, `--font-body`).
- **Limits:** cannot run on Chrome's own pages (`chrome://`, Chrome Web Store) — the popup reports this.
- **Key files:** `content.js`, `lib/style.js`, `popup.js`, `popup.html`, `popup.css`, `manifest.json`.

## Shared facts

- **Stack:** vanilla JavaScript, Manifest V3, no build step, no dependencies.
- **Test browser:** the user's Chrome on his laptop, extensions loaded unpacked.
- **Privacy:** neither extension makes any network request; neither has an account or login; all testing used the user's own chats and public websites.
- **Status (7 Nov 2026):** both extensions load and their main flows are verified in real Chrome. Open checks: Chat Saver `##`-count hand-check, Claude test, PDF export, select-only, code-block-runs, table check; Style Spy 4 more sites, kit restart test, CSS export + plain-page test, click-to-copy test. See `testing-report.md`.
