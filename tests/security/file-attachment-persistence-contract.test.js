const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const user = fs.readFileSync(path.resolve(__dirname, "../../backend/user-service/Code.gs"), "utf8");
const accounting = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
const student = fs.readFileSync(path.resolve(__dirname, "../../js/student.js"), "utf8");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}

assert.match(accounting, /function createPrivatePaymentAttachment_/);
assert.match(accounting, /function getOrCreatePrivateAttachmentFolder_/);
assert.match(accounting, /function assertJointFamilyVoucherOwnerAccess_/);
assert.match(accounting, /ATTACHMENT_PAIR_REQUIRED/);
assert.match(accounting, /ATTACHMENT_ORPHAN_REQUIRES_RECOVERY/);
assert.match(accounting, /DriveApp\.Access\.PRIVATE/);
assert.match(user, /function createPrivateRequestAttachment_/);
assert.match(user, /function getAdministrativeRequestAttachment/);
assert.match(user, /function resolveVerifiedRequestSubmitter_/);
assert.match(user, /UNTRUSTED_ATTACHMENT_REFERENCE/);
assert.match(user, /FAMILY_FINANCIAL_SCOPE_DENIED/);
assert.match(user, /ATTACHMENT_ORPHAN_REQUIRES_RECOVERY/);
assert.match(student, /joint-doc-file/);
assert.match(student, /fileData:attachment\.fileData/);
assert.doesNotMatch(student, /joint-doc-url/);
assert.doesNotMatch(extractFunction(accounting, "uploadPaymentVoucher"), /ANYONE_WITH_LINK/);
assert.match(extractFunction(accounting, "uploadPaymentVoucher"), /createPrivatePaymentAttachment_/);
assert.match(extractFunction(user, "submitInstitutionalFormRequest"), /createPrivateRequestAttachment_/);
assert.doesNotMatch(extractFunction(user, "submitInstitutionalFormRequest"), /ANYONE_WITH_LINK/);

let folderAccess = "PRIVATE";
let failFileSharing = false;
let createdFile = null;
const folder = {
  getSharingAccess: () => folderAccess,
  setSharing: (access) => { folderAccess = access; },
  setTrashed: () => { folderAccess = "TRASHED"; },
  createFile: (blob) => {
    createdFile = {
      blob, trashed: false, sharing: "PRIVATE",
      setSharing(access) { if (failFileSharing) throw new Error("sharing failure"); this.sharing = access; },
      getSharingAccess() { return this.sharing; },
      setTrashed(value) { this.trashed = value; },
      getId() { return "file-id-123456789012345678901"; },
      getName() { return "evidence.pdf"; }
    };
    return createdFile;
  }
};
const root = {
  existing: false,
  getFoldersByName: () => ({ hasNext: () => root.existing, next: () => folder }),
  createFolder: () => folder
};
const userContext = {
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  DriveApp: { Access: { PRIVATE: "PRIVATE" }, Permission: { NONE: "NONE" }, getRootFolder: () => root },
  Utilities: {
    base64Decode: (value) => Buffer.from(value, "base64"),
    newBlob: (bytes, mimeType, name) => ({ bytes, mimeType, name })
  },
  validateFileBinaryIntegrity: (data, name, options) => {
    assert.equal(name, "evidence.pdf");
    assert.equal(options.maxSizeBytes, 10 * 1024 * 1024);
    return { valid: true, mimeType: "application/pdf", byteLength: 3 };
  },
  logStructuredEvent: () => {}
};
const userFunctions = [
  extractFunction(user, "getOrCreatePrivateAttachmentFolder_"),
  extractFunction(user, "rollbackPrivateAttachment_"),
  extractFunction(user, "createPrivateRequestAttachment_")
].join("\n");
vm.runInNewContext(userFunctions + "\nthis.saveAttachment=createPrivateRequestAttachment_;this.getPrivateFolder=getOrCreatePrivateAttachmentFolder_;", userContext);
assert.throws(() => userContext.saveAttachment("YWJj", "", "private-test"), /ATTACHMENT_PAIR_REQUIRED/);
const saved = userContext.saveAttachment("YWJj", "evidence.pdf", "private-test", [".pdf"]);
assert.equal(saved, createdFile);
assert.equal(saved.sharing, "PRIVATE");
assert.equal(saved.trashed, false);
assert.equal(saved.blob.mimeType, "application/pdf");

root.existing = true;
folderAccess = "ANYONE_WITH_LINK";
assert.throws(() => userContext.getPrivateFolder("private-test"), /ATTACHMENT_FOLDER_NOT_PRIVATE/);
root.existing = false;
folderAccess = "PRIVATE";
failFileSharing = true;
assert.throws(() => userContext.saveAttachment("YWJj", "evidence.pdf", "private-test", [".pdf"]), /ATTACHMENT_STORAGE_PRIVATE_FAILED/);
assert.equal(createdFile.trashed, true, "failed privacy setup must attempt file cleanup");
failFileSharing = false;

const voucherFn = extractFunction(accounting, "uploadPaymentVoucher");
let rows = [];
let rollbackCount = 0;
let lockAvailable = true;
let appendFails = false;
let authorized = true;
let ownerAllowed = true;
const voucherContext = {
  getVerifiedAccountingIdentity_: () => authorized ? ({ authorized: true, userId: "student-1", role: "Estudiante" }) : ({ authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" }),
  assertPaymentVoucherOwnerAccess_: () => ownerAllowed ? ({ authorized: true }) : ({ authorized: false, code: "RESOURCE_SCOPE_DENIED" }),
  createPrivatePaymentAttachment_: () => ({ getId: () => "private-file-id" }),
  rollbackPrivatePaymentAttachment_: () => { rollbackCount++; },
  LockService: { getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock: () => {} }) },
  Utilities: { getUuid: () => "uuid-1" },
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: () => ({ appendRow: (row) => { if (appendFails) throw new Error("sheet failure"); rows.push(row); } }),
  SPREADSHEET_ID: "test"
};
vm.runInNewContext(voucherFn + "\nthis.upload=uploadPaymentVoucher;", voucherContext);
const denied = voucherContext.upload({ userId: "student-1", montoReportado: 10 });
assert.equal(denied.code, "VERIFIED_IDENTITY_REQUIRED");
authorized = true;
ownerAllowed = false;
const outOfScope = voucherContext.upload({ userId: "student-2", montoReportado: 10 });
assert.equal(outOfScope.code, "RESOURCE_SCOPE_DENIED");
ownerAllowed = true;
assert.throws(() => voucherContext.upload({ userId: "student-1", montoReportado: 10, fileData: "YWJj" }), /ATTACHMENT_PAIR_REQUIRED/);
const result = voucherContext.upload({ userId: "student-1", montoReportado: 10, fileData: "YWJj", fileName: "evidence.pdf" });
assert.equal(result.status, "success");
assert.equal(result.tieneComprobante, true);
assert.equal(result.comprobanteUrl, "");
assert.equal(rows.length, 1);
assert.equal(rows[0][8], "private-file-id");
appendFails = true;
assert.throws(() => voucherContext.upload({ userId: "student-1", montoReportado: 10, fileData: "YWJj", fileName: "evidence.pdf" }), /sheet failure/);
assert.equal(rollbackCount, 1);
appendFails = false;
lockAvailable = false;
assert.throws(() => voucherContext.upload({ userId: "student-1", montoReportado: 10, fileData: "YWJj", fileName: "evidence.pdf" }), /LOCK_TIMEOUT/);
assert.equal(rollbackCount, 2);

console.log("file-attachment-persistence-contract: PASS (private storage, fail-closed upload, scope, rollback)");
