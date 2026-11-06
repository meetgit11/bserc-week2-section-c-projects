/* Style Spy — content script (Manifest V3).
 * Injected on demand from the popup (chrome.scripting). Walks the
 * visible elements of the current page, reads each one's final
 * computed style, and returns area-weighted colour/font summaries
 * to the popup. Nothing is sent to any server; nothing is stored
 * on the page itself.
 */
(function () {
  "use strict";
  // Guard: the popup may inject this file more than once on the same
  // page — only register the message listener once.
  if (window.__styleSpyReady) return;
  var S = window.StyleSpy;

  function isVisible(el, cs) {
    if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function analysePage() {
    var items = [];
    var els = document.querySelectorAll("body *");
    els.forEach(function (el) {
      var cs = getComputedStyle(el);
      if (!isVisible(el, cs)) return;
      var r = el.getBoundingClientRect();
      // Cap a single element's area so one full-page wrapper cannot
      // drown out every other colour on the page.
      var area = Math.min(r.width * r.height, 200000);
      items.push({
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        area: area,
        visible: true
      });
    });
    var result = S.analyse(items);
    return {
      url: location.href,
      title: document.title,
      elements: els.length,
      colours: result.colours.slice(0, 12),
      fonts: result.fonts.slice(0, 8)
    };
  }

  // The popup injects this file and then asks for the result.
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === "SS_ANALYSE") {
      try { sendResponse({ ok: true, result: analysePage() }); }
      catch (e) { sendResponse({ ok: false, error: String(e && e.message || e) }); }
      return true;
    }
  });

  // Also answer immediately if the popup injected us and then called.
  window.__styleSpyReady = true;
})();
