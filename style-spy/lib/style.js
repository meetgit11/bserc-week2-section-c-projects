/* Style Spy — pure analysis functions (testable in Node).
 *
 * Input: a list of element summaries built by the content script:
 *   { color, backgroundColor, borderColor, fontFamily, fontWeight,
 *     fontSize, area, visible }
 * Colours are ranked by total visible area (width x height), as the
 * PDF hint suggests — a colour used by a huge hero banner counts
 * more than one used by a tiny link. No DOM access here.
 */
(function (root) {
  "use strict";

  // "rgb(43, 124, 211)" / "rgba(43,124,211,0.5)" -> "#2b7cd3" (null if transparent)
  function rgbToHex(rgb) {
    if (!rgb) return null;
    var m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/.exec(rgb);
    if (!m) {
      var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((rgb || "").trim());
      return hex ? hex[0].toLowerCase() : null;
    }
    var alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (alpha === 0) return null;
    function h(n) { return ("0" + parseInt(n, 10).toString(16)).slice(-2); }
    return ("#" + h(m[1]) + h(m[2]) + h(m[3])).toLowerCase();
  }

  function firstFontFamily(stack) {
    if (!stack) return "";
    // "Inter, system-ui, sans-serif" -> "Inter" (strip quotes)
    var first = stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
    return first;
  }

  // items: element summaries (see header). Returns ranked lists.
  function analyse(items) {
    var colours = {}; // hex -> { hex, area, count, kinds: {background, text, border} }
    var fonts = {};   // "Family|weight|size" -> { family, weight, size, area, count }

    function addColour(hex, area, kind) {
      if (!hex) return;
      var c = colours[hex] || (colours[hex] = { hex: hex, area: 0, count: 0, kinds: {} });
      c.area += area; c.count += 1; c.kinds[kind] = true;
    }

    (items || []).forEach(function (it) {
      if (!it.visible) return;
      var area = Math.max(0, it.area || 0);
      if (!area) return;
      addColour(rgbToHex(it.backgroundColor), area, "background");
      addColour(rgbToHex(it.color), area, "text");
      addColour(rgbToHex(it.borderColor), area, "border");
      var family = firstFontFamily(it.fontFamily);
      if (family) {
        var key = family + "|" + (it.fontWeight || "400") + "|" + (it.fontSize || "");
        var f = fonts[key] || (fonts[key] = { family: family, weight: String(it.fontWeight || "400"), size: it.fontSize || "", area: 0, count: 0 });
        f.area += area; f.count += 1;
      }
    });

    var colourList = Object.keys(colours).map(function (k) { return colours[k]; })
      .sort(function (a, b) { return b.area - a.area; });
    var fontList = Object.keys(fonts).map(function (k) { return fonts[k]; })
      .sort(function (a, b) { return b.area - a.area; });
    return { colours: colourList, fonts: fontList };
  }

  // kit: { name, colours: [{hex}], fonts: [{family, weight, size}], url }
  // Export as CSS variables. Colours become --color-1..n, the top
  // font becomes --font-heading / --font-body by weight.
  function buildCssVariables(kit) {
    var lines = [":root {"];
    (kit.colours || []).forEach(function (c, i) {
      lines.push("  --color-" + (i + 1) + ": " + c.hex + ";");
    });
    var fonts = kit.fonts || [];
    if (fonts.length) {
      var heading = fonts.slice().sort(function (a, b) { return parseInt(b.weight, 10) - parseInt(a.weight, 10); })[0];
      var body = fonts.slice().sort(function (a, b) { return parseInt(a.weight, 10) - parseInt(b.weight, 10); })[0] || heading;
      lines.push('  --font-heading: "' + heading.family + '", sans-serif;');
      lines.push('  --font-body: "' + body.family + '", sans-serif;');
      lines.push("  --font-heading-weight: " + heading.weight + ";");
      lines.push("  --font-body-weight: " + body.weight + ";");
      if (heading.size) lines.push("  --font-heading-size: " + heading.size + ";");
      if (body.size) lines.push("  --font-body-size: " + body.size + ";");
    }
    lines.push("}");
    lines.push("");
    lines.push("/* Kit: " + (kit.name || "untitled") + (kit.url ? " · grabbed from " + kit.url : "") + " */");
    return lines.join("\n");
  }

  function kitFileName(name) {
    var n = (name || "style-kit").replace(/[\/\\?%*:|"<>]/g, "").replace(/\s+/g, "-").trim();
    return (n || "style-kit").slice(0, 80) + ".css";
  }

  var api = { rgbToHex: rgbToHex, firstFontFamily: firstFontFamily, analyse: analyse, buildCssVariables: buildCssVariables, kitFileName: kitFileName };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StyleSpy = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
