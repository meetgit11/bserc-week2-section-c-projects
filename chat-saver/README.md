# Chat Saver — BSERC Week 2, Section C (Project 12)

Save any ChatGPT or Claude chat as a clean Markdown file or PDF, in one click. Save the full chat, or only the messages you select.

## What it does

- Works on **ChatGPT** (chatgpt.com, chat.openai.com) and **Claude** (claude.ai) — two AI chat websites, as the PDF requires.
- A small toolbar appears at the bottom-right of the chat: message count, code-block count, **Save as Markdown**, **Save as PDF**, **Select all**, **Clear selection**, **Hide**.
- **Click any message to select it.** With nothing selected, the whole chat is saved; with a selection, only those messages are saved.
- Keeps **headings, lists, tables and code blocks**. Code blocks are exported as fenced blocks with their language, so code copied from the saved file still runs. Tables become Markdown tables.
- **Names the file from the chat's title** (illegal filename characters stripped).
- PDF export opens a clean local print view — use **Print → Save as PDF** there. The text stays selectable in the PDF.
- **Nothing is sent to any server.** Exports are built locally in your browser; the print job lives only in the extension's memory until you print it.

## Files

| File | What it is |
|---|---|
| `manifest.json` | Manifest V3: content script on ChatGPT + Claude, popup, background service worker |
| `content.js` | Finds messages (one parser per site + a generic fallback), selection, toolbar, exports |
| `lib/markdown.js` | Markdown conversion on a plain-object tree — testable in Node, no DOM needed |
| `background.js` | Holds one print job in memory and opens `print.html` |
| `print.html` / `print.js` | Clean print view; strips scripts/event handlers before rendering |
| `popup.html` / `popup.js` | Extension popup: counts, Save as Markdown/PDF, select all/clear |
| `icons/icon16.png`, `icon48.png`, `icon128.png` | Icons drawn locally with PIL (no external images) |
| `test/test-markdown.js` | Node load-tests for the Markdown converter |

## How to load it (unpacked)

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and choose this folder (`section-c-chat-saver`).
4. Open a ChatGPT or Claude chat and reload the page. The toolbar appears bottom-right.

## How to test it (2 minutes)

1. Open a **ChatGPT** chat with a few messages, including one with a code block and one with a table. Click **Save as Markdown** — a `.md` file named after the chat downloads. Open it: headings, the table and the fenced code block should be intact, and the code should copy out runnable.
2. Click two messages to select them (they get a blue outline), then **Save as Markdown** again — only those two should be in the file.
3. Click **Save as PDF** — a print view opens. Click **Print / Save as PDF**, choose **Save as PDF**. Open the PDF and check the text is selectable.
4. Repeat steps 1–3 on a **Claude** chat (claude.ai).
5. **50+ message check (PDF "Done when"):** open a long chat (50+ messages), save as Markdown, and count the `##` message headings in the file — it should match the chat. The content script re-scans the page as new messages arrive.

## Limits — read before you demo it

- **Chat UIs change.** The parsers try several selectors per site and fall back to a generic parser, but if ChatGPT or Claude redesign their message markup, the extension may find fewer messages (or label roles "Message 1, 2, …" instead of You/Assistant) until the selectors are updated. The parsing lives in one clearly-commented function per site in `content.js` (`parseChatGPT`, `parseClaude`, `parseGeneric`) so it is easy to fix.
- **PDF is Print-to-PDF**, not a built-in PDF writer — that is deliberate, so the text stays selectable.
- The extension was **not** loaded in a real Chrome in this VM (no browser here) — see `test-checklist.md`. The checks above are the ones to do on your machine.
- It only runs on ChatGPT and Claude. It does nothing on other sites.
