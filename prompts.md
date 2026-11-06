# prompts.md — BSERC Week 2, Section C

Prompts used, in order, as required by the Week 2 PDF. One entry per prompt, with who asked it and what it produced. The per-extension `prompts.md` files (inside `chat-saver/` and `style-spy/`) hold the full builder prompts; this file is the chronological record for the section.

## 1. User → Muse (5 Nov 2026)
> Shared the Week 2 projects PDF (19 pages) and confirmed the final selection: Section A — Form Photo Fixer, Resume Builder; Section B — Reel Monster (Level 1, manual), Bill Book; Section C — Chat Saver, Style Spy; Section D — Your Own Skill (/viva), Same Page, New Design. Working model: "me and chatgpt will be giving and planning along with you, but your work mainly will be to build along side connected tools like Vercel, Render, etc." Build order: Section A → D.

Result: `plan.md` written with per-project specs and "Done when" lists from the PDF.

## 2. User → Muse (5 Nov 2026, ~21:06 IST)
> "why did u start building the projects?"

Result: correction recorded — Muse had read a general direction as a go-ahead and built Sections A, C, D (and started B) before the user answered the order/split question. Rule from then on: user + ChatGPT plan first; Muse builds only the specific project the user names. All building paused. Section C was left on disk as drafted (both extensions substantially written, verified only in the VM: `node --check`, manifest valid, Node tests 6/6 Markdown and 5/5 style).

## 3. User → Muse (6 Nov 2026)
> "today we will cover 2 sections that is Section B and C"

Result: the Nov 5 pause was lifted for Sections B and C only. Section B was covered first (Android apps, verified on the phone, mini report, GitHub repo). Section C's Chrome tests were still to do on the user's machine.

## 4. User → Muse (6 Nov 2026, ~20:42 IST)
> "now lets start with section C now, i hope you remember what we need to build right?"

Result: confirmed — Chat Saver + Style Spy, both already built and VM-verified; the remaining work was loading them unpacked in the user's Chrome and running the checklists. The user loaded both without errors.

## 5. User → Muse (6 Nov 2026, ~20:50 IST)
> Chat Saver showed "Chat Saver: no messages found on this page yet" on a real open ChatGPT chat, and asked whether a fresh tab was needed.

Result: diagnosed as stale selectors, not a tab problem — the extension was running (its own alert appeared), but ChatGPT's markup had changed. The user ran console probes as directed: `[data-message-author-role]` = 0, `<article>` = 0, `[data-testid^="conversation-turn-"]` = 0; only 2 distinct `data-testid` values on the whole page. A filtered `data-*` list (20) then showed the new markers: `data-turn-key`, `data-conversation-role`, `data-user-message-bubble`, `data-chatgpt-agent-turn-start`, `data-chatgpt-selection-message-id`.

## 6. User → Muse (6–7 Nov 2026, ~00:50 IST)
> Sent the probe results and asked to wrap up fast (12:45 am).

Result: `content.js` rewritten — `parseChatGPT()` became a layered parser (outermost `[data-turn-key]` containers with role from `data-conversation-role` / user bubble / agent-turn-start, then `[data-conversation-role]` elements, then bubbles + agent-turn-starts, old selectors last), plus `normaliseRole()` and live marker counts in the no-messages alert. Syntax-checked with `node --check`; the fixed file was sent to the user as a download link.

## 7. User → Muse (7 Nov 2026, ~01:06 IST)
> Retest showed the same "no messages found" alert.

Result: the alert had no marker counts, which proved the old `content.js` was still loaded in the tab. Fix: replace the file, reload the extension at chrome://extensions, then reload the ChatGPT tab (content scripts only load on page load).

## 8. User → Muse (7 Nov 2026, ~01:13–01:24 IST)
> "yuppie, its working" — and then two screenshots: the Chat Saver popup reporting "6 messages · 23 code blocks" on the Build GhostShell Project chat, and Style Spy analysing 653 elements on hacktoberfest.com with matching colours.

Result: both extensions verified working in real Chrome. Results recorded in both `test-checklist.md` files. Remaining checks (## count, Claude, PDF, select-only, kit restart, CSS export, click-to-copy, 4 more sites) recorded as open.

## 9. User → Muse (7 Nov 2026, ~01:25 IST)
> "Push Section C to GitHub now" (via the options widget).

Result: this repository — `bserc-week2-section-c-projects` — created (public, MIT), both extensions pushed with their READMEs, prompts and test checklists, docs, icons, and the two genuine screenshots (the Style Spy one cropped to the popup so the page's account card is not published).
