# BSERC Week 2 — Section C Projects

Two Manifest V3 Chrome extensions developed as part of the Bharat Space Education Research Centre (BSERC) GenAI Internship Week 2: **Chat Saver** and **Style Spy**. Built with AI-assisted development, focusing on practical functionality, privacy, responsive UI/UX and software engineering fundamentals.

> This is an independently developed student project. **BSERC does not endorse it.** Everything below states what was actually built and tested; anything not yet tested is marked as such.

## The two extensions

### 1. Chat Saver — save a ChatGPT or Claude chat as Markdown or PDF

Saves any ChatGPT (chatgpt.com / chat.openai.com) or Claude (claude.ai) chat as a clean Markdown file or a PDF, in one click. Full chat or only the messages you select by clicking them (blue outline). Floating toolbar + popup, filename taken from the chat title. Nothing is sent to any server — exports are built locally.

- **Verified in real Chrome (7 Nov 2026):** loads unpacked without errors; on the "Build GhostShell Project" chat the popup reported 6 messages · 23 code blocks, and Save as Markdown produced a real `.md` file.
- **A real bug was found and fixed during testing:** the first version found 0 messages on the live ChatGPT page because ChatGPT's markup had changed — no `<article>`, no `data-message-author-role`, no `conversation-turn` testids. Console probes on the live page found the new markers (`data-turn-key`, `data-conversation-role`, `data-user-message-bubble`, `data-chatgpt-agent-turn-start`), and `content.js` was rewritten as a layered parser around them (old selectors kept as a fallback). The "no messages found" alert now prints live marker counts, so a future markup change is diagnosable in one step.
- **Still open:** `##` heading count vs message count by hand; the same saves on Claude; PDF export with real selectable text; select-only export; a saved Python code block copied out and run; a table staying a table.

See [`chat-saver/README.md`](chat-saver/README.md) and [`chat-saver/test-checklist.md`](chat-saver/test-checklist.md).

### 2. Style Spy — see any page's colours and fonts

Analyses the page you're on and shows its colours ranked by visible area, plus its fonts, weights and sizes. Click any colour or font to copy it; save kits; export a kit as CSS variables (`--color-1`, `--font-body`, …). Popup + on-demand content script; nothing is sent to any server.

- **Verified in real Chrome (7 Nov 2026):** loads unpacked without errors; on hacktoberfest.com it analysed 653 elements and the top colours matched the visible page (dark green `#10201d` 75%, cream `#f7f7f2` 15%, red accents `#e53927` / `#e97b77`).
- **Still open:** 4 more sites by hand; a saved kit surviving a full Chrome restart; exporting a kit as `.css` and using it in a plain page; click-to-copy to the clipboard.

See [`style-spy/README.md`](style-spy/README.md) and [`style-spy/test-checklist.md`](style-spy/test-checklist.md).

## Screenshots

Genuine screenshots from the test machine, 7 November 2026:

| Extension | Screenshot |
|-----------|-----------|
| Chat Saver popup on a ChatGPT chat | [`docs/screenshots/chat-saver-popup.png`](docs/screenshots/chat-saver-popup.png) |
| Style Spy on hacktoberfest.com | [`docs/screenshots/style-spy-hacktoberfest.png`](docs/screenshots/style-spy-hacktoberfest.png) |

(The Style Spy screenshot is cropped to the extension popup so the page's account card is not published.)

## Repository structure

```
bserc-week2-section-c-projects/
├── README.md, prompts.md, LICENSE (MIT)
├── chat-saver/                  # full extension (Manifest V3)
│   ├── manifest.json, background.js, content.js, popup.html, popup.js
│   ├── lib/markdown.js, print.html, print.js, icons/
│   ├── README.md, prompts.md, test-checklist.md, test/
│   └── docs/ (none — screenshots live in the root docs/)
├── style-spy/                   # full extension (Manifest V3)
│   ├── manifest.json, content.js, popup.html, popup.js, popup.css
│   ├── lib/style.js, icons/
│   └── README.md, prompts.md, test-checklist.md, test/
└── docs/
    ├── project-overview.md
    ├── chat-saver-requirements.md
    ├── style-spy-requirements.md
    ├── testing-report.md
    └── screenshots/
```

## Install (load unpacked, in Chrome)

1. Open Chrome → `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `chat-saver/` folder (repeat for `style-spy/`).
4. Chat Saver: open a ChatGPT or Claude chat and use the floating toolbar or the extension icon. Style Spy: open any page and click the extension icon → **Analyse this page**.

Notes: Chat Saver's content script only runs on pages loaded after the extension is installed or reloaded — after updating the extension, reload the extension *and* the chat tab. Style Spy cannot run on Chrome's own pages (`chrome://`, Chrome Web Store); the popup reports this.

## Testing

Full per-extension checklists with honest pass/open status: [`chat-saver/test-checklist.md`](chat-saver/test-checklist.md), [`style-spy/test-checklist.md`](style-spy/test-checklist.md), and the consolidated [`docs/testing-report.md`](docs/testing-report.md).

## Prompts

Every prompt used to build these extensions, in order: [`prompts.md`](prompts.md) (plus the per-extension `prompts.md` files inside each folder).

## License

MIT — see [`LICENSE`](LICENSE). It covers the original code only.
