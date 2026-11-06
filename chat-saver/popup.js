/* Chat Saver — popup. Asks the active tab's content script for the
 * chat info, and forwards export commands to it. */
(function () {
  "use strict";
  var countEl = document.getElementById("count");
  var errEl = document.getElementById("err");

  function send(type, done) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) { errEl.textContent = "No active tab."; return; }
      chrome.tabs.sendMessage(tabs[0].id, { type: type }, function (resp) {
        if (chrome.runtime.lastError) {
          errEl.textContent = "Chat Saver is not running on this page. Open a ChatGPT or Claude chat and reload it.";
          return;
        }
        if (done) done(resp);
      });
    });
  }

  function refresh() {
    send("CS_GET_INFO", function (resp) {
      if (!resp || !resp.ok) return;
      countEl.textContent = (resp.title || "Chat") + " — " + resp.messages + " messages · " +
        resp.codeBlocks + " code blocks" +
        (resp.selected ? " · " + resp.selected + " selected" : " · none selected (whole chat will be saved)");
    });
  }

  document.getElementById("mdBtn").addEventListener("click", function () { send("CS_EXPORT_MD", refresh); });
  document.getElementById("pdfBtn").addEventListener("click", function () { send("CS_EXPORT_PDF", refresh); });
  document.getElementById("allBtn").addEventListener("click", function () { send("CS_SELECT_ALL", refresh); });
  document.getElementById("clearBtn").addEventListener("click", function () { send("CS_CLEAR", refresh); });
  document.getElementById("showBtn").addEventListener("click", function () { send("CS_SHOW", refresh); });
  refresh();
})();
