/* Chat Saver — Node load-tests for lib/markdown.js (pure functions).
 * Run: node test/test-markdown.js
 * Uses only fake trees — no DOM, no browser, no network.
 */
"use strict";
const assert = require("node:assert");
const MD = require("../lib/markdown.js");

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok - " + name);
}

// 1. Headings, paragraphs, bold/italic, links.
check("headings + inline formatting", () => {
  const md = MD.treeToMarkdown([
    { tag: "h2", children: [{ tag: "#text", text: "Explain RAG simply" }] },
    { tag: "p", children: [
      { tag: "#text", text: "RAG stands for " },
      { tag: "strong", children: [{ tag: "#text", text: "retrieval" }] },
      { tag: "#text", text: " and " },
      { tag: "em", children: [{ tag: "#text", text: "generation" }] },
      { tag: "#text", text: ". See " },
      { tag: "a", attrs: { href: "https://example.com" }, children: [{ tag: "#text", text: "the guide" }] },
      { tag: "#text", text: "." },
    ]},
  ]);
  assert.ok(md.includes("## Explain RAG simply"));
  assert.ok(md.includes("**retrieval**"));
  assert.ok(md.includes("*generation*"));
  assert.ok(md.includes("[the guide](https://example.com)"));
});

// 2. Fenced code block keeps its language and its code intact.
check("code block with language", () => {
  const md = MD.treeToMarkdown([
    { tag: "pre", attrs: { lang: "python" }, children: [
      { tag: "code", text: "def retrieve(query):\n    return docs\n" },
    ]},
  ]);
  assert.ok(md.includes("```python"));
  assert.ok(md.includes("def retrieve(query):"));
  assert.ok(md.includes("    return docs"));
});

// 3. Tables stay tables (GFM).
check("table becomes GFM table", () => {
  const md = MD.treeToMarkdown([
    { tag: "table", children: [
      { tag: "tr", children: [
        { tag: "th", children: [{ tag: "#text", text: "Name" }] },
        { tag: "th", children: [{ tag: "#text", text: "Score" }] },
      ]},
      { tag: "tr", children: [
        { tag: "td", children: [{ tag: "#text", text: "Riya" }] },
        { tag: "td", children: [{ tag: "#text", text: "9" }] },
      ]},
    ]},
  ]);
  assert.ok(md.includes("| Name | Score |"));
  assert.ok(md.includes("| --- | --- |"));
  assert.ok(md.includes("| Riya | 9 |"));
});

// 4. Lists (ordered + nested unordered).
check("lists", () => {
  const md = MD.treeToMarkdown([
    { tag: "ol", children: [
      { tag: "li", children: [{ tag: "#text", text: "First step" }] },
      { tag: "li", children: [{ tag: "#text", text: "Second step" }] },
    ]},
    { tag: "ul", children: [
      { tag: "li", children: [{ tag: "#text", text: "Note one" }] },
    ]},
  ]);
  assert.ok(md.includes("1. First step"));
  assert.ok(md.includes("2. Second step"));
  assert.ok(md.includes("- Note one"));
});

// 5. Whole-chat export: roles, title, source, code still runnable.
check("messagesToMarkdown keeps roles and runnable code", () => {
  const md = MD.messagesToMarkdown([
    { role: "user", tree: [{ tag: "p", children: [{ tag: "#text", text: "Explain RAG simply" }] }] },
    { role: "assistant", tree: [
      { tag: "p", children: [{ tag: "#text", text: "Here is the code:" }] },
      { tag: "pre", attrs: { lang: "python" }, children: [{ tag: "code", text: "def retrieve(query):\n    return docs\n" }] },
    ]},
  ], "RAG chat", "https://chatgpt.com/c/fake123");
  assert.ok(md.startsWith("# RAG chat"));
  assert.ok(md.includes("## You"));
  assert.ok(md.includes("## Assistant"));
  assert.ok(md.includes("Source: https://chatgpt.com/c/fake123"));
  assert.ok(md.includes("```python\ndef retrieve(query):\n    return docs\n```"));
});

// 6. Filename sanitising.
check("sanitizeFilename strips illegal characters", () => {
  assert.strictEqual(MD.sanitizeFilename("My chat: RAG? *test*"), "My chat RAG test");
  assert.strictEqual(MD.sanitizeFilename("   "), "chat");
  assert.strictEqual(MD.sanitizeFilename("Thermodynamics - ChatGPT"), "Thermodynamics");
  assert.ok(MD.sanitizeFilename("x".repeat(200)).length <= 120);
});

console.log("\n" + passed + " markdown tests passed.");
