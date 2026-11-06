/* Chat Saver — print view.
 * Renders the captured messages for the PDF export. The HTML comes
 * from the chat page the user was on, so it is cleaned before
 * inserting: scripts, iframes, forms, event-handler attributes and
 * javascript: links are stripped. No network is used.
 */
(function () {
  "use strict";

  function clean(html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    tpl.content.querySelectorAll("script, style, iframe, object, embed, form, button, input, textarea, svg, video, audio").forEach(function (el) { el.remove(); });
    tpl.content.querySelectorAll("*").forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        if (attr.name.indexOf("on") === 0) el.removeAttribute(attr.name);
        if (attr.name === "href" && /^javascript:/i.test(attr.value)) el.removeAttribute("href");
        if (attr.name === "src" && /^javascript:/i.test(attr.value)) el.removeAttribute("src");
      });
    });
    return tpl.innerHTML;
  }

  chrome.runtime.sendMessage({ type: "CS_GET_PRINT_JOB" }, function (resp) {
    var job = resp && resp.job;
    if (!job) {
      document.getElementById("title").textContent = "No chat captured";
      document.getElementById("source").textContent = "Open a chat, then use Save as PDF from the Chat Saver toolbar or popup.";
      return;
    }
    document.title = job.title;
    document.getElementById("title").textContent = job.title;
    document.getElementById("source").textContent = "Source: " + job.url + " · Saved " + new Date(job.savedAt).toLocaleString();
    var wrap = document.getElementById("messages");
    job.messages.forEach(function (m, i) {
      var div = document.createElement("div");
      div.className = "msg";
      var role = m.role === "user" ? "You" : m.role === "assistant" ? "Assistant" : "Message " + (i + 1);
      var h = document.createElement("h2");
      h.textContent = role;
      div.appendChild(h);
      var body = document.createElement("div");
      body.innerHTML = clean(m.html || "");
      div.appendChild(body);
      wrap.appendChild(div);
    });
  });

  document.getElementById("printBtn").addEventListener("click", function () { window.print(); });
})();
