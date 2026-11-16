"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const academic = fs.readFileSync(path.join(root, "backend/academic-service/Code.gs"), "utf8");
const teacher = fs.readFileSync(path.join(root, "js/teacher.js"), "utf8");
new vm.Script(academic, { filename: "backend/academic-service/Code.gs" });
new vm.Script(teacher, { filename: "js/teacher.js" });
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "\x60") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
let sharing = "PRIVATE";
let trashed = false;
const context = {
  DriveApp: {
    Access: { ANYONE: "ANYONE", ANYONE_WITH_LINK: "ANYONE_WITH_LINK" },
    getFileById: id => {
      assert.equal(id, "FILE1234567890");
      return { isTrashed: () => trashed, getSharingAccess: () => sharing };
    }
  }
};
vm.runInNewContext(extractFunction(academic, "sanitizeReusableResourceText_") + "\n" +
  extractFunction(academic, "validateReusableResourceDriveUrl_") + "\n" +
  "this.sanitize=sanitizeReusableResourceText_;this.validateUrl=validateReusableResourceDriveUrl_;", context);
assert.equal(context.sanitize('<img src=x onerror=alert(1)>Título<script>alert(1)</script>', 160), "Título alert(1)");
assert.equal(context.sanitize("Recurso" + String.fromCharCode(0) + " seguro", 40), "Recurso seguro");
assert.throws(() => context.sanitize("x".repeat(161), 160), /REUSABLE_RESOURCE_TEXT_TOO_LONG/);
assert.equal(context.validateUrl(""), "");
assert.equal(context.validateUrl("https://drive.google.com/file/d/FILE1234567890/view"), "https://drive.google.com/file/d/FILE1234567890/view");
assert.equal(context.validateUrl("https://docs.google.com/document/d/FILE1234567890/edit"), "https://drive.google.com/file/d/FILE1234567890/view");
sharing = "ANYONE_WITH_LINK";
assert.throws(() => context.validateUrl("https://drive.google.com/file/d/FILE1234567890/view"), /RESOURCE_DRIVE_FILE_PUBLIC/);
sharing = "PRIVATE";
trashed = true;
assert.throws(() => context.validateUrl("https://drive.google.com/file/d/FILE1234567890/view"), /RESOURCE_DRIVE_FILE_UNAVAILABLE/);
trashed = false;
for (const invalid of [
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "https://evil.example/file/d/FILE1234567890/view",
  "https://drive.google.com/uc?export=download&id=FILE1234567890",
  "https://drive.google.com/file/d/FILE1234567890/view?redirect=https://evil.example"
]) assert.throws(() => context.validateUrl(invalid), /RESOURCE_DRIVE_URL_INVALID/);
assert(academic.includes('getVerifiedAcademicIdentity_(request)'), "catalog and resource writes use verified identity");
assert(academic.includes('validateReusableResourceDriveUrl_(urlDrive)'), "resource writes validate Drive destination and ACL");
assert(academic.includes('String(actor.userId)'), "resource author is derived from verified identity");
assert(teacher.includes("cell.textContent = String(value"), "catalog text is rendered as text, not HTML");
assert(teacher.includes("link.rel = 'noopener noreferrer'"), "external Drive link is isolated from the opener");
assert(!teacher.includes("tableBody.innerHTML = combined.map(item =>"), "untrusted catalog values are not interpolated into innerHTML");
assert(!/migrationReportDetails\.innerHTML\s*=/.test(teacher), "curricular equivalence and migration results must never be rendered as HTML");
assert(teacher.includes("appendCurricularMigrationText_(migrationReportDetails,"), "curricular reports render through the text-only DOM helper");
const uiContext = { document: { createElement: () => ({ className: "", textContent: "", children: [], appendChild(node) { this.children.push(node); } }) } };
vm.runInNewContext(extractFunction(teacher, "appendCurricularMigrationText_") + "\nthis.appendSafe = appendCurricularMigrationText_;", uiContext);
const rendered = { children: [], appendChild(node) { this.children.push(node); } };
const hostileFields = [
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(2)>',
  '</div><script>alert(3)</script>',
  'javascript:alert(4)',
  '<iframe srcdoc="<script>alert(5)</script>"></iframe>'
];
hostileFields.forEach(value => {
  uiContext.appendSafe(rendered, value);
  assert.equal(rendered.children[rendered.children.length - 1].textContent, value,
    "curricular fields, errors and result strings are inserted as inert text");
});
console.log("reusable-resource-xss-url-contract: PASS");
