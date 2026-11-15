"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/teacher.js", "utf8");
const start = source.indexOf("window.analyzePdfDocumentStructure = async function(pdfDocument)");
const end = source.indexOf("\n    function renderPdfValidationSummary_", start);
assert.ok(start >= 0 && end > start, "PDF structure analyzer must exist");
const window = { pdfjsLib: { OPS: {
  paintImageXObject: 1, paintJpegXObject: 2, paintInlineImageXObject: 3,
  paintImageMaskXObject: 4, paintImageMaskXObjectGroup: 5
} } };
vm.createContext({ window });
const context = { window };
vm.runInNewContext(source.slice(start, end), context);

const pages = {
  1: { async getTextContent() { return { items: [{ str: "Acta de cierre" }] }; }, async getOperatorList() { return { fnArray: [] }; } },
  2: { async getTextContent() { return { items: [{ str: " " }] }; }, async getOperatorList() { return { fnArray: [1] }; } },
  3: { async getTextContent() { return { items: [{ str: "Firma" }] }; }, async getOperatorList() { return { fnArray: [2] }; } },
  4: { async getTextContent() { return { items: [] }; }, async getOperatorList() { return { fnArray: [] }; } }
};
const analysis = await window.analyzePdfDocumentStructure({
  numPages: 4,
  async getPage(number) { return pages[number]; }
});
assert.equal(analysis.valid, true);
assert.equal(analysis.documentType, "MIXTO");
assert.equal(analysis.pageCount, 4);
assert.equal(analysis.textPages, 1);
assert.equal(analysis.scannedPages, 1);
assert.equal(analysis.mixedPages, 1);
assert.equal(analysis.emptyOrVectorOnlyPages, 1);
assert.equal(analysis.requiresOcr, true);
assert.equal(analysis.pages[1].classification, "ESCANEADO");
assert.ok(analysis.warnings.some(item => item.code === "PDF_EMPTY_OR_VECTOR_ONLY_PAGES"));

const failedPage = await window.analyzePdfDocumentStructure({
  numPages: 1,
  async getPage() { throw new Error("corrupt page"); }
});
assert.equal(failedPage.pages[0].classification, "NO_ANALIZADA");
assert.ok(failedPage.warnings.some(item => item.code === "PDF_PAGE_ANALYSIS_FAILED"));
await assert.rejects(() => window.analyzePdfDocumentStructure(null), /PDF_DOCUMENT_INVALID/);
console.log("PASS PDF page classifier: digital, scanned, mixed, empty/vector-only, failed pages and invalid documents");
