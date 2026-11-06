/* Chat Saver — background service worker (Manifest V3).
 * Holds one print job in memory (never written to disk, never sent
 * anywhere) and opens the local print view for the PDF export.
 */
"use strict";

let printJob = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CS_PRINT") {
    printJob = {
      title: msg.title || "chat",
      url: msg.url || "",
      messages: msg.messages || [],
      savedAt: Date.now()
    };
    chrome.tabs.create({ url: chrome.runtime.getURL("print.html") });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "CS_GET_PRINT_JOB") {
    sendResponse({ ok: true, job: printJob });
    return true;
  }
  return false;
});
