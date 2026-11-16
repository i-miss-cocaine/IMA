"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");

const evidenceStart = source.indexOf("function validateEvidenceFileAndPermissions(payload)");
const evidenceEnd = source.indexOf("\nfunction ", evidenceStart + 10);
const binaryStart = source.indexOf("function validateFileBinaryIntegrity(fileData, fileName, options)");
const binaryEnd = source.indexOf("\nfunction ", binaryStart + 10);
const pageStart = source.indexOf("function classifyPdfDocumentPages_(rawBytes)");
const pageEnd = source.indexOf("\nfunction ", pageStart + 10);
assert.ok(evidenceStart >= 0 && evidenceEnd > evidenceStart, "Drive evidence validator must exist");
assert.ok(binaryStart >= 0 && binaryEnd > binaryStart, "binary integrity validator must exist");
assert.ok(pageStart >= 0 && pageEnd > pageStart, "PDF page classifier must exist");
const validatorCode = source.slice(evidenceStart, evidenceEnd) + "\n" +
  source.slice(binaryStart, binaryEnd) + "\n" + source.slice(pageStart, pageEnd);

const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nstartxref\n10\n%%EOF\n", "utf8");
let actualMime = "application/pdf";
let actualSize = pdfBytes.length;
let blobBytes = Array.from(pdfBytes);
let ownerAuthorized = true;
let driveCalls = 0;
const documentSheet = {
  getDataRange() { return { getValues() { return [["A", "B", "C", "D", "E", "FileId"], ["", "", "", "", "", "FILE-1"]]; } }; }
};
const ss = { getSheetByName(name) { return name === "DocumentosEstudiante" ? documentSheet : null; } };
const context = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById() { return ss; } },
  DriveApp: { getFileById(id) {
    driveCalls++;
    assert.equal(id, "FILE-1");
    return {
      getMimeType() { return actualMime; },
      getSize() { return actualSize; },
      getName() { return "evidence.pdf"; },
      getBlob() { return { getBytes() { return blobBytes; } }; }
    };
  } },
  Utilities: {
    base64Encode(bytes) { return Buffer.from(bytes).toString("base64"); },
    base64Decode(value) { return Array.from(Buffer.from(value, "base64")); }
  },
  getVerifiedAcademicIdentity_() { return { authorized: true, userId: "USER-1", role: "Secretaría" }; },
  assertStudentDocumentScopeAccess_() { return { authorized: ownerAuthorized, code: ownerAuthorized ? "" : "RESOURCE_SCOPE_DENIED" }; },
  logStructuredEvent() {},
  Buffer, Date, String, Number, Array, Object, Math, JSON, RegExp, Error, isFinite
};
vm.createContext(context);
vm.runInContext(validatorCode +
  "\nthis.validateEvidenceFileAndPermissions=validateEvidenceFileAndPermissions;" +
  "\nthis.validateFileBinaryIntegrity=validateFileBinaryIntegrity;", context);

const base64 = pdfBytes.toString("base64");
const directValid = context.validateFileBinaryIntegrity(base64, "evidence.pdf", { maxSizeBytes: 1024, allowedExtensions: [".pdf"] });
assert.equal(directValid.valid, true);
assert.equal(directValid.detectedFormat, "pdf");
assert.equal(directValid.byteLength, pdfBytes.length);
assert.throws(() => context.validateFileBinaryIntegrity(base64, "evidence.png"), /PNG_STRUCTURE_INVALID/);
assert.throws(() => context.validateFileBinaryIntegrity("", "evidence.pdf"), /FILE_MISSING/);
assert.throws(() => context.validateFileBinaryIntegrity(base64, "payload.exe"), /DANGEROUS_FILE_EXTENSION/);
assert.throws(() => context.validateFileBinaryIntegrity(base64.slice(0, -12), "evidence.pdf"), /PDF_STRUCTURE_INVALID/);

const valid = context.validateEvidenceFileAndPermissions({ fileId: "FILE-1", mimeType: "application/pdf", sizeBytes: pdfBytes.length });
assert.equal(valid.status, "success");
assert.equal(valid.integrityVerified, true);
assert.equal(valid.detectedFormat, "pdf");
assert.equal(valid.byteLength, pdfBytes.length);

const wrongDeclaredMime = context.validateEvidenceFileAndPermissions({ fileId: "FILE-1", mimeType: "image/png" });
assert.equal(wrongDeclaredMime.code, "FILE_MIME_MISMATCH");

actualMime = "image/png";
const wrongActualMime = context.validateEvidenceFileAndPermissions({ fileId: "FILE-1", mimeType: "image/png" });
assert.equal(wrongActualMime.code, "FILE_BINARY_MIME_MISMATCH");

actualMime = "application/pdf";
actualSize = pdfBytes.length + 1;
const sizeMismatch = context.validateEvidenceFileAndPermissions({ fileId: "FILE-1" });
assert.equal(sizeMismatch.code, "FILE_SIZE_MISMATCH");

actualSize = pdfBytes.length;
ownerAuthorized = false;
const driveCallsBeforeDenied = driveCalls;
const denied = context.validateEvidenceFileAndPermissions({ fileId: "FILE-1" });
assert.equal(denied.code, "RESOURCE_SCOPE_DENIED");
assert.equal(driveCalls, driveCallsBeforeDenied, "unauthorized users must not cause Drive file reads");

console.log("PASS academic file validation: extension, MIME, magic bytes, PDF structure, stored size, ownership-before-Drive and binary integrity");
