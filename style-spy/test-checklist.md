# Test checklist — Style Spy (PDF p.15, Project 13)

"Done when" items from the PDF, ticked only for what was actually verified here.

## Verified in this VM (5 Nov 2026)

- [x] **JS syntax** — `node --check` passed on every JS file: `lib/style.js`, `content.js`, `popup.js`, `test/test-style.js`.
- [x] **Manifest valid** — `python3 -m json.tool manifest.json` passed; Manifest V3.
- [x] **Colour ranking (pure functions, Node, fake inputs)** — `node test/test-style.js`: **5/5 passed**:
  - `rgbToHex` handles rgb/rgba/hex/transparent (transparent → null, ignored)
  - area-weighted ranking: 1 huge red banner (100,000 px) outranks 10 tiny blue links (100 px each); invisible elements ignored entirely
  - first font family taken from the stack, quotes stripped
  - CSS export produces `:root` variables (`--color-1`, `--color-2`, `--font-heading` = heaviest weight, `--font-body` = lightest) plus a kit comment
  - kit filename sanitising (`"My blog / palette?"` → `My-blog-palette.css`)
- [x] **All manifest-referenced files exist** — checked by script; none missing.
- [x] **Sends nothing to any server** — grep over all JS found no `fetch(`, no `XMLHttpRequest`, no external URLs.

## NOT verified here — needs your Chrome (no browser in this VM)

- [ ] **Check results by hand on 5 websites.** How to check (2 min per site): load the extension unpacked, open 5 different sites (e.g. a news site, a docs site, a shop, a blog, a dark-themed site), click **Analyse this page** on each, and compare the top 3 colours and top fonts with what you actually see on the page.
- [ ] **Saved kits survive a Chrome restart.** How to check: save a kit, close Chrome completely, reopen Chrome, open the popup — the kit must still be listed.
- [ ] **Paste a kit into a plain page and it picks up the style.** How to check: export a kit as `.css`, link it in a plain HTML page, use `var(--color-1)` / `var(--font-body)` in that page's CSS — the page must take on the kit's colours and fonts.
- [ ] **Click to copy.** How to check: click a colour swatch and a font row, then paste — the hex code / font description must be on the clipboard.

## Known limits

- Cannot run on Chrome's own pages (`chrome://`, Chrome Web Store) — Chrome blocks content scripts there; the popup reports this.
- Ranking is by visible area (per the PDF hint), not by element count.
- Fonts are reported from the computed `font-family` stack (first family only).

## Live Chrome test (7 Nov 2026, user's machine)

- [x] **Works on 1 site (~01:24 IST).** hacktoberfest.com/my/ — "Analysed 653 elements"; top colours #10201d 75% (dark green page background) and #f7f7f2 15% (cream body) match the visible page; red accents #e53927 / #e97b77 also present.
- [ ] 4 more sites to check by hand; kit restart test; CSS export + plain-page test; click-to-copy test.
