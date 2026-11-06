/* Chat Saver — Markdown conversion (shared, testable).
 *
 * Design: the converter works on a small plain-object tree
 *   { tag: "p"|"h2"|"ul"|"li"|"pre"|"code"|"table"|..., text: "...",
 *     attrs: { href, lang, ... }, children: [...] }
 * so it can be unit-tested in Node with fake trees (no DOM needed).
 * In the browser, domToTree() converts a real DOM node into that tree.
 * No network, no external libraries.
 */
(function (root) {
  "use strict";

  function inlineText(node) {
    // Inline rendering of a node and its children (no block breaks).
    if (!node) return "";
    if (node.tag === "#text") return node.text || "";
    var tag = (node.tag || "").toLowerCase();
    var inner = (node.children || []).map(inlineText).join("");
    if (tag === "strong" || tag === "b") return "**" + inner + "**";
    if (tag === "em" || tag === "i") return "*" + inner + "*";
    if (tag === "code") return "`" + (node.text || inner).replace(/`/g, "'") + "`";
    if (tag === "a") {
      var href = (node.attrs && node.attrs.href) || "";
      return href ? "[" + inner + "](" + href + ")" : inner;
    }
    if (tag === "br") return "  \n";
    if (tag === "img") return (node.attrs && node.attrs.alt) ? "![" + node.attrs.alt + "]" : "";
    return inner;
  }

  function blockToMarkdown(node, out, indent) {
    if (!node) return;
    if (node.tag === "#text") {
      var t = (node.text || "").trim();
      if (t) out.push(indent + t);
      return;
    }
    var tag = (node.tag || "").toLowerCase();
    var children = node.children || [];

    if (/^h[1-6]$/.test(tag)) {
      var level = parseInt(tag[1], 10);
      out.push("#".repeat(level) + " " + children.map(inlineText).join("").trim());
      out.push("");
      return;
    }
    if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
      var text = children.map(inlineText).join("").trim();
      if (text) { out.push(indent + text); out.push(""); }
      else { children.forEach(function (c) { blockToMarkdown(c, out, indent); }); }
      return;
    }
    if (tag === "ul" || tag === "ol") {
      children.forEach(function (li, i) {
        if (li.tag !== "li") { blockToMarkdown(li, out, indent); return; }
        var prefix = tag === "ol" ? (i + 1) + ". " : "- ";
        var parts = [];
        (li.children || []).forEach(function (c) {
          if (c.tag === "ul" || c.tag === "ol") {
            var sub = [];
            blockToMarkdown(c, sub, indent + "  ");
            parts.push("\n" + sub.join("\n"));
          } else {
            parts.push(inlineText(c));
          }
        });
        var line = parts.join("").trim();
        if (line) out.push(indent + prefix + line);
      });
      out.push("");
      return;
    }
    if (tag === "pre") {
      var lang = (node.attrs && node.attrs.lang) || "";
      var code = "";
      var codeNode = children.find(function (c) { return c.tag === "code"; });
      if (codeNode) code = codeNode.text || (codeNode.children || []).map(inlineText).join("");
      else code = children.map(inlineText).join("");
      out.push("```" + lang);
      out.push(code.replace(/\n+$/, ""));
      out.push("```");
      out.push("");
      return;
    }
    if (tag === "blockquote") {
      var q = children.map(inlineText).join("").trim();
      if (q) q.split("\n").forEach(function (l) { out.push("> " + l); });
      out.push("");
      return;
    }
    if (tag === "hr") { out.push("---"); out.push(""); return; }
    if (tag === "table") {
      var rows = [];
      children.forEach(function (section) {
        if (section.tag === "tr") rows.push(section);
        else (section.children || []).forEach(function (r) { if (r.tag === "tr") rows.push(r); });
      });
      rows.forEach(function (row, ri) {
        var cells = (row.children || []).filter(function (c) { return c.tag === "td" || c.tag === "th"; });
        var line = "| " + cells.map(function (c) { return inlineText(c).replace(/\|/g, "\\|").trim(); }).join(" | ") + " |";
        out.push(line);
        if (ri === 0) out.push("| " + cells.map(function () { return "---"; }).join(" | ") + " |");
      });
      out.push("");
      return;
    }
    if (tag === "code") { // stray inline code block at block level
      out.push("`" + inlineText(node) + "`");
      return;
    }
    // Unknown / wrapper element: recurse.
    children.forEach(function (c) { blockToMarkdown(c, out, indent); });
  }

  // Convert a tree (or a list of trees) to Markdown text.
  function treeToMarkdown(nodes) {
    var list = Array.isArray(nodes) ? nodes : [nodes];
    var out = [];
    list.forEach(function (n) { blockToMarkdown(n, out, ""); });
    // Collapse 3+ blank lines to 2, trim trailing blanks.
    return out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "") + "\n";
  }

  // Browser-only: convert a real DOM node into a tree.
  function domToTree(node) {
    if (typeof document === "undefined") throw new Error("domToTree needs a browser DOM");
    if (node.nodeType === 3) return { tag: "#text", text: node.nodeValue };
    if (node.nodeType !== 1) return null;
    var tag = node.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "noscript" || tag === "button" || tag === "svg") return null;
    var tree = { tag: tag, attrs: {}, children: [] };
    if (tag === "a") tree.attrs.href = node.getAttribute("href") || "";
    if (tag === "img") tree.attrs.alt = node.getAttribute("alt") || "";
    if (tag === "pre") {
      var codeEl = node.querySelector("code");
      var cls = (codeEl && codeEl.className) || node.className || "";
      var m = /language-([\w-]+)/.exec(cls);
      if (m) tree.attrs.lang = m[1];
    }
    if (tag === "code" && node.parentElement && node.parentElement.tagName.toLowerCase() !== "pre") {
      tree.text = node.textContent;
    }
    Array.prototype.forEach.call(node.childNodes, function (child) {
      var t = domToTree(child);
      if (t) tree.children.push(t);
    });
    // A <pre> holds raw code text, not nested formatting.
    if (tag === "pre") tree.children = [{ tag: "#text", text: node.textContent }];
    return tree;
  }

  function htmlToMarkdown(html) {
    if (typeof document === "undefined") throw new Error("htmlToMarkdown needs a browser DOM");
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    var trees = [];
    Array.prototype.forEach.call(tpl.content.childNodes, function (child) {
      var t = domToTree(child);
      if (t) trees.push(t);
    });
    return treeToMarkdown(trees);
  }

  function sanitizeFilename(title) {
    var name = (title || "chat").replace(/[\/\\?%*:|"<>]/g, "").replace(/\s+/g, " ").trim();
    name = name.replace(/\s+-\s+(ChatGPT|Claude)$/i, "");
    if (!name) name = "chat";
    return name.slice(0, 120);
  }

  // messages: [{ role: "user"|"assistant"|"unknown", tree?: node|node[], html?: string, text?: string }]
  function messagesToMarkdown(messages, title, sourceUrl) {
    var lines = [];
    if (title) lines.push("# " + title, "");
    if (sourceUrl) lines.push("Source: " + sourceUrl, "");
    (messages || []).forEach(function (msg, i) {
      var role = msg.role === "user" ? "You" : msg.role === "assistant" ? "Assistant" : "Message " + (i + 1);
      lines.push("## " + role, "");
      var md = "";
      if (msg.tree) md = treeToMarkdown(msg.tree);
      else if (msg.html && typeof document !== "undefined") md = htmlToMarkdown(msg.html);
      else md = (msg.text || "").trim() + "\n";
      lines.push(md.replace(/\s+$/, ""), "");
    });
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "") + "\n";
  }

  var api = { treeToMarkdown: treeToMarkdown, domToTree: domToTree, htmlToMarkdown: htmlToMarkdown, sanitizeFilename: sanitizeFilename, messagesToMarkdown: messagesToMarkdown, inlineText: inlineText };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ChatSaverMarkdown = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
