# Style Spy — BSERC Week 2, Section C (Project 13)

Click any website to grab its colours and fonts, then save them as a kit.

## What it does

- Click the extension icon → **Analyse this page**. The popup injects the content script into the active tab, which reads every visible element's **final computed style** and ranks the page's main colours by **how much of the page uses each one** (area-weighted: element width × height, capped per element so one full-page wrapper can't drown out the rest).
- Shows **fonts with weights and sizes**, ranked the same way.
- **Click any colour or font to copy it** (hex code, or "Family · weight · size").
- **Save kits under a name** (stored in `chrome.storage.local` — survives a Chrome restart, never leaves your browser).
- **Export a kit as CSS variables** (`:root { --color-1: …; --font-heading: …; … }`) — downloadable as a `.css` file or copyable to the clipboard.
- Saved kits can be viewed again, exported, or deleted from the popup.
- **Nothing is sent to any server.** No network calls anywhere in the code.

## Files

| File | What it is |
|---|---|
| `manifest.json` | Manifest V3: popup, `activeTab` + `scripting` + `storage` permissions |
| `lib/style.js` | Pure analysis functions (colour normalisation, area-weighted ranking, CSS export) — testable in Node, no DOM needed |
| `content.js` | Injected on demand; walks visible elements, reads computed styles, returns the ranked summary |
| `popup.html` / `popup.css` / `popup.js` | Popup UI: analyse, colour/font lists, save kit, saved kits, CSS export |
| `icons/icon16.png`, `icon48.png`, `icon128.png` | Icons drawn locally with PIL (no external images) |
| `test/test-style.js` | Node load-tests for the pure functions |

## How to load it (unpacked)

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and choose this folder (`section-c-style-spy`).
4. Open any website, click the Style Spy icon, click **Analyse this page**.

## How to test it (2 minutes per site)

1. Open a website you like, click the extension icon → **Analyse this page**. The top colour should be the page's dominant background/brand colour; click a swatch — the hex code copies.
2. Save it as a kit with a name. Close Chrome completely, reopen it, open the popup — the kit must still be listed.
3. Click **Export .css** on the kit, then paste the CSS variables into a plain HTML page (set `body { background: var(--color-1); font-family: var(--font-body); }`) — the page must pick up the style.
4. **5-website check (PDF "Done when"):** repeat step 1 on 5 different websites (e.g. a news site, a docs site, a shop, a blog, a dark-themed site) and check the top colours/fonts by eye against what you actually see.

## Limits — read before you demo it

- It **cannot run on Chrome's own pages** (`chrome://`, the extensions page, the Chrome Web Store) — Chrome blocks content scripts there. The popup says so if you try.
- Colours are ranked by **visible area**, so a colour used by one huge banner outranks a colour used by many tiny links. That is what the PDF asks for ("ranked by how much they are used"), but it is a design choice, not a count of elements.
- Fonts come from the computed `font-family` stack (first family only) — a site that loads a webfont under a different name than its display name will show the name the page actually uses.
- The extension was **not** loaded in a real Chrome in this VM (no browser here) — see `test-checklist.md`. The checks above are the ones to do on your machine.
