/* Style Spy — Node load-tests for lib/style.js (pure functions).
 * Run: node test/test-style.js
 * Uses only fake element summaries — no DOM, no browser, no network.
 */
"use strict";
const assert = require("node:assert");
const S = require("../lib/style.js");

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok - " + name);
}

// 1. Colour normalisation.
check("rgbToHex handles rgb/rgba/hex/transparent", () => {
  assert.strictEqual(S.rgbToHex("rgb(43, 124, 211)"), "#2b7cd3");
  assert.strictEqual(S.rgbToHex("rgba(43,124,211,0.5)"), "#2b7cd3");
  assert.strictEqual(S.rgbToHex("rgba(0, 0, 0, 0)"), null); // transparent
  assert.strictEqual(S.rgbToHex("transparent"), null);
  assert.strictEqual(S.rgbToHex("#ABC"), "#abc");
  assert.strictEqual(S.rgbToHex(""), null);
});

// 2. Area-weighted ranking: a huge hero banner outranks a tiny link.
check("analyse ranks colours by area, not by count", () => {
  const result = S.analyse([
    // 10 tiny blue links, 100 px each
    ...Array.from({ length: 10 }, () => ({
      color: "rgb(0, 0, 255)", backgroundColor: "rgba(0, 0, 0, 0)", borderColor: "rgba(0, 0, 0, 0)",
      fontFamily: "Inter, sans-serif", fontWeight: "400", fontSize: "14px", area: 100, visible: true,
    })),
    // 1 huge red banner, 100000 px
    { color: "rgb(0, 0, 0)", backgroundColor: "rgb(255, 0, 0)", borderColor: "rgba(0, 0, 0, 0)",
      fontFamily: "Inter, sans-serif", fontWeight: "700", fontSize: "32px", area: 100000, visible: true },
    // invisible element must be ignored entirely
    { color: "rgb(0, 255, 0)", backgroundColor: "rgb(0, 255, 0)", borderColor: "rgb(0, 255, 0)",
      fontFamily: "Comic Sans", fontWeight: "400", fontSize: "99px", area: 999999, visible: false },
  ]);
  assert.strictEqual(result.colours[0].hex, "#ff0000", "biggest area should rank first");
  assert.strictEqual(result.colours[0].area, 100000);
  assert.ok(!result.colours.some((c) => c.hex === "#00ff00"), "invisible elements ignored");
  assert.ok(result.fonts.some((f) => f.family === "Inter" && f.weight === "700"));
  assert.ok(!result.fonts.some((f) => f.family === "Comic Sans"), "invisible font ignored");
});

// 3. Font family: first family in the stack, quotes stripped.
check("firstFontFamily takes the first family", () => {
  assert.strictEqual(S.firstFontFamily('"Lora", Georgia, serif'), "Lora");
  assert.strictEqual(S.firstFontFamily("Inter, system-ui, sans-serif"), "Inter");
  assert.strictEqual(S.firstFontFamily(""), "");
});

// 4. CSS export: variables, heaviest font = heading, lightest = body.
check("buildCssVariables exports colours and fonts", () => {
  const css = S.buildCssVariables({
    name: "Test kit",
    url: "https://example.com",
    colours: [{ hex: "#123a5c" }, { hex: "#ffd54a" }],
    fonts: [
      { family: "Inter", weight: "700", size: "32px" },
      { family: "Lora", weight: "400", size: "16px" },
    ],
  });
  assert.ok(css.includes("--color-1: #123a5c;"));
  assert.ok(css.includes("--color-2: #ffd54a;"));
  assert.ok(css.includes('--font-heading: "Inter"'));
  assert.ok(css.includes('--font-body: "Lora"'));
  assert.ok(css.includes("--font-heading-weight: 700;"));
  assert.ok(css.startsWith(":root {"));
  assert.ok(css.includes("/* Kit: Test kit"));
});

// 5. Kit filename sanitising.
check("kitFileName is safe for download", () => {
  assert.strictEqual(S.kitFileName("My blog / palette?"), "My-blog-palette.css");
  assert.strictEqual(S.kitFileName(""), "style-kit.css");
});

console.log("\n" + passed + " style tests passed.");
