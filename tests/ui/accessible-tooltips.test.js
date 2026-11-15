"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("js/ui-common.js", "utf8");
assert.doesNotThrow(() => new Function(source), "ui-common.js must parse");

const start = source.indexOf("window.calculateAccessibleTooltipPosition = function");
const end = source.indexOf("\n\nwindow.initAccessibleTooltips", start);
assert.ok(start >= 0 && end > start, "pure tooltip positioning function must exist");
const positionBlock = source.slice(start, end);
const windowStub = {};
new Function("window", positionBlock)(windowStub);
const position = windowStub.calculateAccessibleTooltipPosition;

assert.deepEqual(
  JSON.parse(JSON.stringify(position({ left: 200, top: 100, bottom: 120 }, { width: 200, height: 60 }, { width: 800, height: 600 }))),
  { top: 128, left: 200, placement: "bottom" }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(position({ left: 200, top: 540, bottom: 560 }, { width: 200, height: 100 }, { width: 800, height: 600 }))),
  { top: 432, left: 200, placement: "top" }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(position({ left: 790, top: 100, bottom: 120 }, { width: 200, height: 60 }, { width: 800, height: 600 }))),
  { top: 128, left: 592, placement: "bottom" }
);

const tooltipBlock = source.slice(start, source.indexOf("[F38-Task02]", start));
for (const token of ["aria-describedby", "aria-expanded", "aria-controls", 'setAttribute("role", "tooltip")', '"Escape"', '"mouseenter"', '"focus"', '"click"', "MutationObserver", "textContent"]) {
  assert.ok(tooltipBlock.includes(token), "accessible tooltip contract missing " + token);
}
assert.ok(source.includes("window.initAccessibleTooltips(document)"));
assert.ok(source.includes("window.calculateAccessibleTooltipPosition"));
assert.ok(source.includes('fetchApi("USER", "getUIMetadataCatalog", {})'));
const helpStart = source.indexOf("window.applyPermanentFieldHelp = function");
const helpEnd = source.indexOf("\n\nif (!window.__imaFieldHelpObserver", helpStart);
assert.ok(helpStart >= 0 && helpEnd > helpStart, "permanent field help renderer must exist");
const helpBlock = source.slice(helpStart, helpEnd);
assert.ok(helpBlock.includes("textContent"), "help content must be inserted as text");
assert.ok(helpBlock.includes("aria-describedby"), "field help must be associated for assistive technology");
assert.doesNotMatch(helpBlock, /innerHTML/, "field help must not interpret metadata as HTML");
assert.ok(source.includes("window.__imaFieldHelpObserver"));
console.log("PASS accessible tooltips: keyboard/focus/touch hooks, aria relationships, Escape, dynamic DOM and viewport collision placement");
