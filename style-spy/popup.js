/* Style Spy — popup.
 * "Analyse this page" injects lib/style.js + content.js into the
 * active tab (chrome.scripting, activeTab permission), asks it for
 * the area-weighted colours/fonts, and renders them. Kits are kept
 * in chrome.storage.local — nothing leaves the browser.
 */
(function () {
  "use strict";
  var S = window.StyleSpy;
  var current = null; // last analysis result
  var statusEl = document.getElementById("status");

  function setStatus(msg, isErr) {
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (isErr ? " err" : "");
  }

  function copyText(text, el) {
    function done() {
      var note = document.createElement("span");
      note.className = "copied";
      note.textContent = " copied ✓";
      if (el) { el.appendChild(note); setTimeout(function () { note.remove(); }, 1200); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* clipboard unavailable */ }
    ta.remove();
  }

  function renderColours(colours) {
    var wrap = document.getElementById("colours");
    wrap.innerHTML = "";
    wrap.classList.remove("empty");
    if (!colours.length) { wrap.textContent = "No colours found."; return; }
    var total = colours.reduce(function (n, c) { return n + c.area; }, 0) || 1;
    colours.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "swatch-row";
      var kinds = Object.keys(c.kinds || {}).join(", ");
      row.innerHTML = '<span class="swatch"></span><span class="hex"></span><span class="meta"></span>';
      row.querySelector(".swatch").style.background = c.hex;
      row.querySelector(".hex").textContent = c.hex;
      row.querySelector(".meta").textContent = Math.round((c.area / total) * 100) + "% · " + kinds + " · ×" + c.count;
      row.title = "Click to copy " + c.hex;
      row.addEventListener("click", function () { copyText(c.hex, row); });
      wrap.appendChild(row);
    });
  }

  function renderFonts(fonts) {
    var wrap = document.getElementById("fonts");
    wrap.innerHTML = "";
    wrap.classList.remove("empty");
    if (!fonts.length) { wrap.textContent = "No fonts found."; return; }
    fonts.forEach(function (f) {
      var row = document.createElement("div");
      row.className = "font-row";
      var label = f.family + " · " + f.weight + (f.size ? " · " + f.size : "");
      row.innerHTML = '<span class="fname"></span> <span class="meta"></span>';
      row.querySelector(".fname").textContent = f.family;
      row.querySelector(".fname").style.fontFamily = '"' + f.family + '", sans-serif';
      row.querySelector(".meta").textContent = "weight " + f.weight + (f.size ? " · " + f.size : "") + " · ×" + f.count;
      row.title = "Click to copy " + label;
      row.addEventListener("click", function () { copyText(label, row); });
      wrap.appendChild(row);
    });
  }

  function currentKit() {
    if (!current) return null;
    var name = document.getElementById("kitName").value.trim() || ("Kit from " + new URL(current.url).hostname);
    return { name: name, url: current.url, colours: current.colours, fonts: current.fonts, savedAt: Date.now() };
  }

  function loadKits(cb) {
    chrome.storage.local.get(["styleSpyKits"], function (res) {
      cb(res.styleSpyKits || {});
    });
  }

  function renderKits() {
    var wrap = document.getElementById("kits");
    loadKits(function (kits) {
      wrap.innerHTML = "";
      var names = Object.keys(kits);
      if (!names.length) { wrap.textContent = "No saved kits yet."; wrap.classList.add("empty"); return; }
      wrap.classList.remove("empty");
      names.sort(function (a, b) { return (kits[b].savedAt || 0) - (kits[a].savedAt || 0); }).forEach(function (name) {
        var kit = kits[name];
        var div = document.createElement("div");
        div.className = "kit";
        var dots = (kit.colours || []).slice(0, 8).map(function (c) {
          return '<span class="dot" style="background:' + c.hex + '" title="' + c.hex + '"></span>';
        }).join("");
        div.innerHTML = "<b></b><div class='meta'></div><div class='dots'>" + dots + "</div>";
        div.querySelector("b").textContent = name;
        div.querySelector(".meta").textContent = (kit.colours || []).length + " colours · " + (kit.fonts || []).length + " fonts" +
          (kit.url ? " · " + kit.url : "") + " · saved " + new Date(kit.savedAt || Date.now()).toLocaleDateString();
        var loadBtn = document.createElement("button");
        loadBtn.textContent = "View";
        loadBtn.addEventListener("click", function () {
          current = kit;
          renderColours(kit.colours || []);
          renderFonts(kit.fonts || []);
          document.getElementById("kitName").value = name;
          setStatus("Showing saved kit “" + name + "”.");
        });
        var cssBtn = document.createElement("button");
        cssBtn.textContent = "Export .css";
        cssBtn.addEventListener("click", function () { exportCss(kit); });
        var delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", function () {
          loadKits(function (all) {
            delete all[name];
            chrome.storage.local.set({ styleSpyKits: all }, renderKits);
          });
        });
        div.appendChild(loadBtn); div.appendChild(cssBtn); div.appendChild(delBtn);
        wrap.appendChild(div);
      });
    });
  }

  function exportCss(kit) {
    var css = S.buildCssVariables(kit);
    var blob = new Blob([css], { type: "text/css;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = S.kitFileName(kit.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  document.getElementById("analyseBtn").addEventListener("click", function () {
    setStatus("Analysing this page…");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab || !tab.id) { setStatus("No active tab.", true); return; }
      if (/^chrome:\/\//.test(tab.url || "") || /^chrome-extension:\/\//.test(tab.url || "")) {
        setStatus("Style Spy cannot run on Chrome's own pages. Open a normal website first.", true);
        return;
      }
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["lib/style.js", "content.js"] }, function () {
        if (chrome.runtime.lastError) {
          setStatus("Could not run on this page: " + chrome.runtime.lastError.message, true);
          return;
        }
        chrome.tabs.sendMessage(tab.id, { type: "SS_ANALYSE" }, function (resp) {
          if (chrome.runtime.lastError || !resp || !resp.ok) {
            setStatus("Analysis failed: " + ((resp && resp.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || "no reply from the page"), true);
            return;
          }
          current = resp.result;
          renderColours(current.colours);
          renderFonts(current.fonts);
          setStatus("Analysed " + current.elements + " elements on " + current.title + ".");
        });
      });
    });
  });

  document.getElementById("saveBtn").addEventListener("click", function () {
    var kit = currentKit();
    if (!kit) { setStatus("Analyse a page first, then save it as a kit.", true); return; }
    loadKits(function (kits) {
      kits[kit.name] = kit;
      chrome.storage.local.set({ styleSpyKits: kits }, function () {
        setStatus("Saved kit “" + kit.name + "”.");
        renderKits();
      });
    });
  });

  document.getElementById("copyCssBtn").addEventListener("click", function () {
    var kit = currentKit();
    if (!kit) { setStatus("Analyse a page first.", true); return; }
    copyText(S.buildCssVariables(kit), document.getElementById("copyCssBtn").parentElement);
  });

  document.getElementById("exportCssBtn").addEventListener("click", function () {
    var kit = currentKit();
    if (!kit) { setStatus("Analyse a page first.", true); return; }
    exportCss(kit);
  });

  renderKits();
})();
