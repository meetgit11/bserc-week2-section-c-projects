# Style Spy — requirements and verification

Source: BSERC Week 2 PDF, Section C, Project 13 (Style Spy).

## Requirements (from the PDF)

- Analyse any page and show its colours and fonts.
- Colours ranked by visible area.
- Click to copy a colour or font.
- Save kits; export a kit as CSS variables.
- Done when: results match the page by hand on 5 websites; a saved kit survives a Chrome restart; a kit exported as `.css` styles a plain page; click-to-copy works.

## What was built

- `content.js` + `lib/style.js` — on-demand content script; colours from computed styles, ranked by visible area (invisible elements ignored); fonts from the computed `font-family` stack (first family only), with weights and sizes.
- `popup.js` / `popup.html` / `popup.css` — colour swatches + font rows, click-to-copy, kit list, CSS-variable export.
- Kits stored in `chrome.storage.local`; export produces `:root` variables (`--color-1`, `--color-2`, `--font-heading` = heaviest weight, `--font-body` = lightest) plus a kit comment.
- `manifest.json` — Manifest V3.

## Verification

| Check | Result |
|---|---|
| JS syntax (`node --check`, all JS files) | Pass (5 Nov 2026, VM) |
| Manifest valid JSON, Manifest V3 | Pass (5 Nov 2026, VM) |
| Colour ranking (Node, fake inputs) | Pass — 5/5 (5 Nov 2026, VM) |
| All manifest-referenced files exist | Pass (5 Nov 2026, VM) |
| Sends nothing to any server | Pass — no `fetch(`/`XMLHttpRequest`/external URLs (5 Nov 2026, VM) |
| Loads unpacked in real Chrome | Pass (6 Nov 2026) |
| Results match the page by hand (5 websites) | Partial — 1 of 5: hacktoberfest.com, 7 Nov 2026, 653 elements; top colours #10201d 75% and #f7f7f2 15% match the visible page |
| Saved kit survives a Chrome restart | Not yet |
| Kit exported as `.css` styles a plain page | Not yet |
| Click-to-copy | Not yet |

## Known limits

- Cannot run on Chrome's own pages (`chrome://`, Chrome Web Store) — Chrome blocks content scripts there; the popup reports this.
- Ranking is by visible area (per the PDF hint), not by element count.
- Fonts are reported from the computed `font-family` stack (first family only).
