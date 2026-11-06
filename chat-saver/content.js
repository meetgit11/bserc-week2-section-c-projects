/* Chat Saver — content script (Manifest V3).
 * Runs on chatgpt.com / chat.openai.com and claude.ai.
 * Finds messages, lets the user click to select them, and exports the
 * full chat (or only the selected messages) as Markdown or PDF.
 * NOTHING is sent to any server: exports are built locally and
 * downloaded / opened as a local print view in this browser.
 */
(function () {
  "use strict";
  var MD = window.ChatSaverMarkdown;
  var selected = new Set(); // indexes into lastMessages
  var lastMessages = [];
  var toolbar = null;

  /* ---------- Site detection ---------- */
  function site() {
    var h = location.hostname;
    if (h.indexOf("claude.ai") !== -1) return "claude";
    return "chatgpt"; // chatgpt.com / chat.openai.com
  }

  /* ---------- Message parsing ----------
   * One function per site, plus a generic fallback. Chat UIs change
   * their markup often, so every parser tries several selectors and
   * the generic fallback is the last resort. Each parser returns
   * [{ role, element }] where element is the node holding the
   * message content (the part that becomes Markdown). */

  /* Normalise a role string from the page into user / assistant /
   * system / tool / unknown. */
  function normaliseRole(v) {
    v = (v || "").toLowerCase();
    if (v.indexOf("user") !== -1 || v === "human") return "user";
    if (v.indexOf("assistant") !== -1 || v.indexOf("chatgpt") !== -1 || v === "ai" || v === "model") return "assistant";
    if (v === "system" || v === "tool") return v;
    return "unknown";
  }

  /* Counts of the markers the parsers look for — shown in the
   * "no messages found" alert so the next fix needs no guessing. */
  function markerCountsText() {
    function n(s) { return document.querySelectorAll(s).length; }
    return "(markers on this page: turn-key=" + n("[data-turn-key]") +
      ", conversation-role=" + n("[data-conversation-role]") +
      ", user-bubble=" + n("[data-user-message-bubble]") +
      ", agent-turn-start=" + n("[data-chatgpt-agent-turn-start]") + ")";
  }

  function parseChatGPT() {
    var out = [];
    // Current ChatGPT (Nov 2026, "app shell" layout, verified on the
    // live page 7 Nov 2026): messages are plain <div>s — no <article>,
    // no data-message-author-role, no conversation-turn testids.
    // Turns carry data-turn-key; roles are marked by
    // data-conversation-role, by the user bubble
    // (data-user-message-bubble) and by the assistant turn start
    // (data-chatgpt-agent-turn-start).

    // 1) Turn containers — one per message, outermost only, in order.
    var turns = Array.prototype.filter.call(
      document.querySelectorAll("[data-turn-key]"),
      function (el) { var p = el.parentElement; return !p || !p.closest("[data-turn-key]"); }
    );
    if (turns.length) {
      turns.forEach(function (turn) {
        if ((turn.innerText || "").trim().length < 2) return;
        var role = "unknown";
        var roleEl = turn.hasAttribute("data-conversation-role") ? turn : turn.querySelector("[data-conversation-role]");
        if (roleEl) role = normaliseRole(roleEl.getAttribute("data-conversation-role"));
        if (role === "unknown") {
          if (turn.querySelector("[data-user-message-bubble]")) role = "user";
          else if (turn.querySelector("[data-chatgpt-agent-turn-start]")) role = "assistant";
        }
        out.push({ role: role, element: turn });
      });
      if (out.length) return out;
    }

    // 2) Role-marked elements directly.
    var roleEls = document.querySelectorAll("[data-conversation-role]");
    if (roleEls.length) {
      roleEls.forEach(function (el) {
        out.push({ role: normaliseRole(el.getAttribute("data-conversation-role")), element: el });
      });
      return out;
    }

    // 3) User bubbles and assistant turn starts directly.
    var bubbles = document.querySelectorAll("[data-user-message-bubble], [data-chatgpt-agent-turn-start]");
    bubbles.forEach(function (el) {
      out.push({ role: el.hasAttribute("data-user-message-bubble") ? "user" : "assistant", element: el });
    });
    if (out.length) return out;

    // 4) Older ChatGPT layout, kept as a fallback.
    var legacyRoleEls = document.querySelectorAll("[data-message-author-role]");
    if (legacyRoleEls.length) {
      legacyRoleEls.forEach(function (el) {
        out.push({ role: normaliseRole(el.getAttribute("data-message-author-role")), element: el });
      });
      return out;
    }
    var legacyTurns = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    legacyTurns.forEach(function (article) {
      if ((article.innerText || "").trim().length < 2) return;
      out.push({ role: "unknown", element: article });
    });
    return out;
  }

  function parseClaude() {
    var out = [];
    // Claude marks user turns with data-testid="user-message".
    // Assistant turns are the message blocks that follow them; the
    // current layout groups each turn in a container with
    // data-testid="message" or class "font-claude-message".
    var userEls = document.querySelectorAll('[data-testid="user-message"]');
    var asstEls = document.querySelectorAll('[data-testid="assistant-message"], .font-claude-message');
    if (userEls.length || asstEls.length) {
      // Merge in document order.
      var all = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"], .font-claude-message');
      all.forEach(function (el) {
        var isUser = el.getAttribute("data-testid") === "user-message";
        var isAsst = el.getAttribute("data-testid") === "assistant-message" || el.classList.contains("font-claude-message");
        if (isUser) out.push({ role: "user", element: el });
        else if (isAsst) out.push({ role: "assistant", element: el });
      });
      if (out.length) return out;
    }
    // Older Claude layout: turns live in .group or in a grid of
    // message containers; fall through to the generic parser.
    return out;
  }

  function parseGeneric() {
    // Last resort: take the largest message-like containers in the
    // main content area, in document order. Roles are unknown, so
    // the export labels them "Message 1, 2, …" instead of guessing.
    var root = document.querySelector("main") || document.body;
    var candidates = root.querySelectorAll("article, [data-message-author-role], [data-testid*='message'], [data-turn-key], [data-user-message-bubble], [data-chatgpt-agent-turn-start]");
    var out = [];
    candidates.forEach(function (el) {
      if ((el.innerText || "").trim().length < 2) return;
      // Skip containers that already contain a candidate child.
      if (el.querySelector("article, [data-testid*='message'], [data-turn-key]")) return;
      out.push({ role: "unknown", element: el });
    });
    return out;
  }

  function collectMessages() {
    var parsed = site() === "claude" ? parseClaude() : parseChatGPT();
    if (!parsed.length) parsed = parseGeneric();
    lastMessages = parsed.map(function (m, i) {
      var tree = null;
      try { tree = MD.domToTree(m.element); } catch (e) { tree = null; }
      return {
        index: i,
        role: m.role,
        element: m.element,
        tree: tree,
        text: (m.element.innerText || "").trim(),
        codeBlocks: m.element.querySelectorAll("pre").length
      };
    });
    return lastMessages;
  }

  function chatTitle() {
    var t = (document.title || "chat").trim();
    return t;
  }

  /* ---------- Selection UI ---------- */
  function markSelection() {
    lastMessages.forEach(function (m) {
      m.element.classList.toggle("cs-selected", selected.has(m.index));
      m.element.classList.add("cs-message");
    });
    updateToolbar();
  }

  function injectStyles() {
    if (document.getElementById("cs-styles")) return;
    var s = document.createElement("style");
    s.id = "cs-styles";
    s.textContent = [
      ".cs-message { cursor: pointer; }",
      ".cs-message.cs-selected { outline: 3px solid #2b7cd3 !important; outline-offset: -3px; background: rgba(43,124,211,.08) !important; border-radius: 8px; }",
      "#cs-toolbar { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; background: #fff; color: #111; border: 1px solid #ccc; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.25); padding: 10px 12px; font: 14px system-ui, sans-serif; max-width: 320px; }",
      "#cs-toolbar b { display: block; margin-bottom: 4px; }",
      "#cs-toolbar .cs-count { color: #444; font-size: 13px; margin-bottom: 8px; }",
      "#cs-toolbar button { margin: 2px 4px 2px 0; padding: 6px 10px; border-radius: 8px; border: 1px solid #2b7cd3; background: #2b7cd3; color: #fff; cursor: pointer; }",
      "#cs-toolbar button.cs-ghost { background: #fff; color: #2b7cd3; }",
      "#cs-toolbar button.cs-mini { background: #fff; color: #111; border-color: #999; padding: 4px 8px; }",
      "#cs-toolbar .cs-hint { font-size: 12px; color: #555; margin-top: 6px; }"
    ].join("\n");
    document.head.appendChild(s);
  }

  function buildToolbar() {
    if (toolbar) return;
    injectStyles();
    toolbar = document.createElement("div");
    toolbar.id = "cs-toolbar";
    toolbar.innerHTML =
      "<b>Chat Saver</b>" +
      "<div class='cs-count' id='cs-count'>Scanning…</div>" +
      "<button id='cs-md'>Save as Markdown</button>" +
      "<button id='cs-pdf'>Save as PDF</button><br>" +
      "<button id='cs-all' class='cs-ghost'>Select all</button>" +
      "<button id='cs-clear' class='cs-ghost'>Clear selection</button>" +
      "<button id='cs-hide' class='cs-mini'>Hide</button>" +
      "<div class='cs-hint'>Click any message to select it — only selected messages are saved. With nothing selected, the whole chat is saved.</div>";
    document.body.appendChild(toolbar);
    document.getElementById("cs-md").addEventListener("click", function () { exportMarkdown(); });
    document.getElementById("cs-pdf").addEventListener("click", function () { exportPdf(); });
    document.getElementById("cs-all").addEventListener("click", function () {
      collectMessages();
      lastMessages.forEach(function (m) { selected.add(m.index); });
      markSelection();
    });
    document.getElementById("cs-clear").addEventListener("click", function () { selected.clear(); markSelection(); });
    document.getElementById("cs-hide").addEventListener("click", function () { toolbar.style.display = "none"; });
  }

  function updateToolbar() {
    if (!toolbar) return;
    var codeBlocks = lastMessages.reduce(function (n, m) { return n + m.codeBlocks; }, 0);
    var el = document.getElementById("cs-count");
    if (el) {
      el.textContent = lastMessages.length + " messages · " + codeBlocks + " code blocks" +
        (selected.size ? " · " + selected.size + " selected" : " · none selected (whole chat will be saved)");
    }
  }

  function attachClickHandlers() {
    lastMessages.forEach(function (m) {
      if (m.element.__csBound) return;
      m.element.__csBound = true;
      m.element.addEventListener("click", function (e) {
        // Do not hijack clicks on links/buttons inside a message.
        if (e.target.closest("a, button, input, textarea, pre")) return;
        if (selected.has(m.index)) selected.delete(m.index);
        else selected.add(m.index);
        markSelection();
      });
    });
  }

  function refresh() {
    collectMessages();
    buildToolbar();
    if (toolbar) toolbar.style.display = "block";
    attachClickHandlers();
    markSelection();
  }

  function chosenMessages() {
    if (!selected.size) return lastMessages;
    return lastMessages.filter(function (m) { return selected.has(m.index); });
  }

  /* ---------- Exports ---------- */
  function downloadBlob(blob, filename) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  function exportMarkdown() {
    refresh();
    var msgs = chosenMessages();
    if (!msgs.length) { alert("Chat Saver: no messages found on this page yet. " + markerCountsText()); return; }
    var md = MD.messagesToMarkdown(msgs, MD.sanitizeFilename(chatTitle()), location.href);
    downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), MD.sanitizeFilename(chatTitle()) + ".md");
  }

  function exportPdf() {
    refresh();
    var msgs = chosenMessages();
    if (!msgs.length) { alert("Chat Saver: no messages found on this page yet. " + markerCountsText()); return; }
    chrome.runtime.sendMessage({
      type: "CS_PRINT",
      title: chatTitle(),
      url: location.href,
      messages: msgs.map(function (m) {
        return { role: m.role, html: m.element.innerHTML };
      })
    }, function (resp) {
      if (chrome.runtime.lastError) alert("Chat Saver: could not open the print view — " + chrome.runtime.lastError.message);
    });
  }

  /* ---------- Messages from the popup ---------- */
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === "CS_GET_INFO") {
      refresh();
      var codeBlocks = lastMessages.reduce(function (n, m) { return n + m.codeBlocks; }, 0);
      sendResponse({ ok: true, title: chatTitle(), messages: lastMessages.length, codeBlocks: codeBlocks, selected: selected.size, site: site() });
      return true;
    }
    if (msg.type === "CS_EXPORT_MD") { exportMarkdown(); sendResponse({ ok: true }); return true; }
    if (msg.type === "CS_EXPORT_PDF") { exportPdf(); sendResponse({ ok: true }); return true; }
    if (msg.type === "CS_SELECT_ALL") {
      refresh();
      lastMessages.forEach(function (m) { selected.add(m.index); });
      markSelection();
      sendResponse({ ok: true, selected: selected.size });
      return true;
    }
    if (msg.type === "CS_CLEAR") { selected.clear(); markSelection(); sendResponse({ ok: true }); return true; }
    if (msg.type === "CS_SHOW") { buildToolbar(); if (toolbar) toolbar.style.display = "block"; refresh(); sendResponse({ ok: true }); return true; }
  });

  // The page is a live app: new messages arrive without a reload.
  // Re-scan when the DOM changes (debounced), so the toolbar count
  // stays correct on long chats.
  var debounce = null;
  function observe() {
    if (!document.body || typeof MutationObserver === "undefined") return;
    new MutationObserver(function () {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(function () { refresh(); }, 1500);
    }).observe(document.body, { childList: true, subtree: true });
  }

  refresh();
  observe();
})();
