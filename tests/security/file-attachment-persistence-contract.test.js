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
assert.match(extractFunction(accounting, "uploadPaymentVoucher"), /createPrivatePaymentAttachmentWithIntegrity_/);
assert.match(extractFunction(accounting, "createPrivatePaymentAttachmentWithIntegrity_"), /createPrivatePaymentAttachment_/);
assert.match(extractFunction(user, "submitInstitutionalFormRequest"), /createPrivateRequestAttachment(?:WithIntegrity)?_/);
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
const voucherHeaders = ["ComprobanteID","Fecha","UserId","Alumno","CargoID","MontoReportado","MetodoPago","Referencia","ComprobanteUrl","Estado","Observaciones","AprobadoPor","SolicitudID","EvidenciaID","DriveFileID","NombreOriginal","EsVersionActual","EstadoIntegridad","SHA256","VersionNumero","SizeBytes","MimeType","FechaRecepcion","DecisionIntegrityWarning","DecisionHash","DecisionState","ComprobanteGrupoID","DecisionActor","DecisionDate"];
const voucherMap = Object.fromEntries(voucherHeaders.map((name,index)=>[name,index]));
let rows = [voucherHeaders.slice()];
let rollbackCount = 0;
let lockAvailable = true;
let appendFails = false;
let authorized = true;
let ownerAllowed = true;
const voucherSheet = {
  getLastRow:()=>rows.length,
  getLastColumn:()=>voucherHeaders.length,
  getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),
  appendRow(row){if(appendFails)throw new Error("sheet failure");rows.push(row.slice());}
};
const voucherContext = {
  getVerifiedAccountingIdentity_: () => authorized ? ({ authorized: true, userId: "student-1", role: "Estudiante" }) : ({ authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" }),
  assertPaymentVoucherOwnerAccess_: () => ownerAllowed ? ({ authorized: true }) : ({ authorized: false, code: "RESOURCE_SCOPE_DENIED" }),
  ensurePaymentVoucherEvidenceSchema_:()=>({sheet:voucherSheet,map:voucherMap,headers:voucherHeaders}),
  createPrivatePaymentAttachmentWithIntegrity_: () => ({file:{getId:()=> "private-file-id"},sha256:"a".repeat(64),sizeBytes:3,mimeType:"application/pdf",receivedAt:"2026-11-15T00:00:00.000Z"}),
  rollbackPrivatePaymentAttachment_: () => { rollbackCount++; },
  LockService: { getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock: () => {} }) },
  Utilities: { getUuid: () => "uuid-1" },
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: () => voucherSheet,
  SPREADSHEET_ID: "test"
};
vm.runInNewContext(voucherFn + "\nthis.upload=uploadPaymentVoucher;", voucherContext);
authorized = false;
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
assert.equal(rows.length, 2);
assert.equal(rows[1][voucherMap.ComprobanteUrl], "private-file-id");
assert.equal(rows[1][voucherMap.SHA256], "a".repeat(64));
assert.equal(rows[1][voucherMap.SolicitudID], rows[1][voucherMap.ComprobanteGrupoID]);
assert.equal(rows[1][voucherMap.EvidenciaID], rows[1][voucherMap.ComprobanteID]);
assert.equal(rows[1][voucherMap.DriveFileID], "private-file-id");
assert.equal(rows[1][voucherMap.NombreOriginal], "evidence.pdf");
appendFails = true;
assert.throws(() => voucherContext.upload({ userId: "student-1", montoReportado: 10, fileData: "YWJj", fileName: "evidence.pdf" }), /sheet failure/);
assert.equal(rollbackCount, 1);
appendFails = false;
lockAvailable = false;
assert.throws(() => voucherContext.upload({ userId: "student-1", montoReportado: 10, fileData: "YWJj", fileName: "evidence.pdf" }), /LOCK_TIMEOUT/);
assert.equal(rollbackCount, 2);



// Todos los puntos de entrada de USER deben usar el mismo almacenamiento privado y rechazar referencias del cliente.
[
  "submitInstitutionalFormRequest",
  "submitStudentAbsenceJustification",
  "submitAdministrativeRequest",
  "submitJointFamilyPayment"
].forEach(function(name) {
  const fn = extractFunction(user, name);
  assert.match(fn, /createPrivateRequestAttachment(?:WithIntegrity)?_/, name + " must persist through the private attachment helper");
  assert.match(fn, /UNTRUSTED_ATTACHMENT_REFERENCE/, name + " must reject client-supplied URLs/IDs");
  assert.match(fn, /rollbackPrivateAttachment_/, name + " must compensate failed persistence");
});

// El helper de ACCOUNTING también se ejecuta con Drive simulado: carpeta/archivo privados y rollback de permisos fallidos.
const accountingAttachmentFunctions = [
  extractFunction(accounting, "getOrCreatePrivateAttachmentFolder_"),
  extractFunction(accounting, "rollbackPrivatePaymentAttachment_"),
  extractFunction(accounting, "createPrivatePaymentAttachment_")
].join("\n");
let paymentFolderExists = false;
let paymentFolderAccess = "PRIVATE";
let paymentFileShareFails = false;
let paymentCreatedFile = null;
const paymentFolder = {
  getSharingAccess: () => paymentFolderAccess,
  setSharing: (access) => { paymentFolderAccess = access; },
  setTrashed: () => { paymentFolderAccess = "TRASHED"; },
  createFile: (blob) => {
    paymentCreatedFile = {
      blob, sharing: "PRIVATE", trashed: false,
      setSharing(access) { if (paymentFileShareFails) throw new Error("file sharing failure"); this.sharing = access; },
      getSharingAccess() { return this.sharing; },
      setTrashed() { this.trashed = true; },
      getId() { return "payment-file-id-123456789012345678901"; }
    };
    return paymentCreatedFile;
  }
};
const paymentRoot = {
  getFoldersByName: () => ({ hasNext: () => paymentFolderExists, next: () => paymentFolder }),
  createFolder: () => paymentFolder
};
const paymentContext = {
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  DriveApp: { Access: { PRIVATE: "PRIVATE" }, Permission: { NONE: "NONE" }, getRootFolder: () => paymentRoot },
  Utilities: {
    base64Decode: (value) => Buffer.from(value, "base64"),
    newBlob: (bytes, mimeType, name) => ({ bytes, mimeType, name })
  },
  validateFileBinaryIntegrity: (data, name, options) => {
    assert.equal(name, "evidence.pdf");
    assert.equal(options.maxSizeBytes, 10 * 1024 * 1024);
    return { valid: true, mimeType: "application/pdf", byteLength: 3 };
  },
  logStructuredEvent: () => {},
  enqueueDriveRecovery_: () => {}
};
vm.runInNewContext(accountingAttachmentFunctions + "\nthis.savePayment=createPrivatePaymentAttachment_;this.getPaymentFolder=getOrCreatePrivateAttachmentFolder_;", paymentContext);
assert.throws(() => paymentContext.savePayment("YWJj", "", "evidence.pdf"), /ATTACHMENT_PAIR_REQUIRED/);
const privatePaymentFile = paymentContext.savePayment("YWJj", "evidence.pdf");
assert.equal(privatePaymentFile.sharing, "PRIVATE");
assert.equal(privatePaymentFile.trashed, false);
assert.equal(privatePaymentFile.blob.mimeType, "application/pdf");
paymentFolderExists = true;
paymentFolderAccess = "ANYONE_WITH_LINK";
assert.throws(() => paymentContext.getPaymentFolder("Comprobantes_Pago_Privados_v1"), /ATTACHMENT_FOLDER_NOT_PRIVATE/);
paymentFolderExists = false;
paymentFolderAccess = "PRIVATE";
paymentFileShareFails = true;
assert.throws(() => paymentContext.savePayment("YWJj", "evidence.pdf"), /ATTACHMENT_STORAGE_PRIVATE_FAILED/);
assert.equal(paymentCreatedFile.trashed, true, "failed accounting privacy setup must attempt cleanup");

// Descargas privadas: autorización previa, privacidad incluso para referencias históricas y binario íntegro.
const voucherDownloadFn = extractFunction(accounting, "getPaymentVoucherFile");
const voucherVerificationFns = [
  extractFunction(accounting, "verifyPaymentVoucherEvidence_"),
  extractFunction(accounting, "getAccountingEvidenceIntegrityPolicy_")
].join("\n");
const voucherDownloadMap = {ComprobanteID:0,Fecha:1,UserId:2,Alumno:3,CargoID:4,MontoReportado:5,MetodoPago:6,
  Referencia:7,ComprobanteUrl:8,Estado:9,Observaciones:10,ComprobanteGrupoID:11,VersionNumero:12,SHA256:13,
  SizeBytes:14,MimeType:15,FechaRecepcionISO:16,EstadoIntegridad:17,EsVersionActual:18,DecisionHash:19,
  DecisionTimestamp:20,DecisionBy:21,DecisionIntegrityWarning:22};
const voucherVerifyFn = extractFunction(accounting, "verifyPaymentVoucherEvidence_");
assert.match(voucherVerifyFn, /file\.getSharingAccess\(\)\s*!==\s*DriveApp\.Access\.PRIVATE/);
assert.match(voucherVerifyFn, /validateFileBinaryIntegrity/);
let voucherSharing = "PRIVATE";
let voucherBlobReads = 0;
let voucherOwnerAllowed = true;
const voucherDownloadContext = {
  getVerifiedAccountingIdentity_: () => ({ authorized: true, userId: "student-1", role: "Estudiante" }),
  assertPaymentVoucherOwnerAccess_: () => voucherOwnerAllowed ? ({ authorized: true }) : ({ authorized: false, code: "RESOURCE_SCOPE_DENIED" }),
  extractDriveFileId: () => "legacy-file-id",
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => ({ getDataRange: () => ({ getValues: () => [
    ["id","fecha","userId","alumno","cargoId","monto","metodo","referencia","archivo","estado","observaciones"],
    ["VCH-1",new Date(),"student-1","Estudiante","GRAL",10,"Transferencia","REF","https://drive.google.com/file/d/legacy-file-id/view","En Revisión",""]
  ] }) }) }) },
  ensurePaymentVoucherEvidenceSchema_: () => voucherDownloadMap,
  computeDocumentSHA256: () => "a".repeat(64),
  DriveApp: { Access: { PRIVATE: "PRIVATE" }, getFileById: () => ({
    isTrashed: () => false,
    getSharingAccess: () => voucherSharing,
    getBlob: () => { voucherBlobReads++; return { getBytes: () => [1,2,3], getContentType: () => "application/pdf" }; },
    getName: () => "evidence.pdf",
    getMimeType: () => "application/pdf"
  }) },
  Utilities: { base64Encode: () => "YWJj" },
  validateFileBinaryIntegrity: () => ({ valid: true, mimeType: "application/pdf", byteLength: 3 }),
  logStructuredEvent: () => {},
  SPREADSHEET_ID: "test"
};
vm.runInNewContext(voucherVerificationFns + "\n" + voucherDownloadFn + "\nthis.download=getPaymentVoucherFile;", voucherDownloadContext);
const privateVoucherDownload = voucherDownloadContext.download({ comprobanteId: "VCH-1" });
assert.equal(privateVoucherDownload.status, "success");
assert.equal(privateVoucherDownload.fileData, "YWJj");
voucherSharing = "ANYONE_WITH_LINK";
const publicLegacyVoucherDownload = voucherDownloadContext.download({ comprobanteId: "VCH-1" });
assert.equal(publicLegacyVoucherDownload.code, "VOUCHER_FILE_NOT_PRIVATE");
assert.equal(voucherBlobReads, 1, "public legacy files must be rejected before reading bytes");
voucherSharing = "PRIVATE";
voucherOwnerAllowed = false;
const unauthorizedVoucherDownload = voucherDownloadContext.download({ comprobanteId: "VCH-1" });
assert.equal(unauthorizedVoucherDownload.code, "RESOURCE_NOT_FOUND");
assert.equal(voucherBlobReads, 1, "unauthorized callers must not read voucher bytes");

// Las consultas de solicitudes nunca exponen URLs históricas, aunque el archivo tenga una referencia legacy.
const requestsFn = extractFunction(user, "getAdministrativeRequests");
assert.match(requestsFn, /adjuntoUrl:""/);
assert.doesNotMatch(requestsFn, /adjuntoUrl:\s*row\[5\]/);
const legacyRequestUrl = "https://drive.google.com/file/d/legacy-request-file/view";
const requestRows = [
  ["id","userId","studentId","type","description","attachment","state","assigned","notes","created","resolved"],
  ["SOL-1","guardian-1","student-1","Trámite","Solicitud",legacyRequestUrl,"Enviada","Secretaría","","2026-01-01",""]
];
const requestListContext = {
  getUserVerifiedRole: () => "Padre",
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: () => ({ getDataRange: () => ({ getValues: () => requestRows }) }),
  SPREADSHEET_ID: "test"
};
vm.runInNewContext(requestsFn + "\nthis.list=getAdministrativeRequests;", requestListContext);
const listedRequests = requestListContext.list({ _verifiedUserId: "guardian-1", userId: "guardian-1" });
assert.equal(listedRequests.data.length, 1);
assert.equal(listedRequests.data[0].adjuntoUrl, "");
assert.equal(listedRequests.data[0].tieneAdjunto, true);

// La descarga administrativa comprueba identidad/relación antes de abrir Drive y exige archivo privado.
const requestDownloadHelperFn = extractFunction(user, "requestAttachmentHeaderMap_");
const requestDownloadFn = extractFunction(user, "getAdministrativeRequestAttachment");
let requestFileLookups = 0, requestFileSharing = "PRIVATE", requestBlobReads = 0;
const requestDownloadHeaders = ["SolicitudID","UserId","EstudianteID","TipoTramite","Descripcion","AdjuntoUrl"];
const requestDownloadRows = [
  requestDownloadHeaders,
  ["SOL-1","guardian-1","student-1","Trámite","Solicitud","legacy-request-file-id-123456789012345"]
];
const requestDownloadSheet = {
  getLastRow: () => requestDownloadRows.length,
  getLastColumn: () => requestDownloadHeaders.length,
  getRange: (row,col,numRows,numCols) => ({ getValues: () => [requestDownloadRows[row-1].slice(col-1,col-1+(numCols||1))] }),
  getDataRange: () => ({ getValues: () => requestDownloadRows })
};
const requestDownloadContext = {
  getUserVerifiedRole: () => "Estudiante",
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => requestDownloadSheet }) },
  DriveApp: { Access: { PRIVATE: "PRIVATE" }, getFileById: () => {
    requestFileLookups++;
    return { isTrashed: () => false, getSharingAccess: () => requestFileSharing,
      getBlob: () => { requestBlobReads++; return { getBytes: () => [1,2,3], getContentType: () => "application/pdf" }; },
      getName: () => "evidence.pdf", getMimeType: () => "application/pdf" };
  } },
  Utilities: { base64Encode: () => "YWJj" },
  validateFileBinaryIntegrity: () => ({ valid: true, mimeType: "application/pdf", byteLength: 3 }),
  logStructuredEvent: () => {},
  validateRolePermission: () => ({ authorized: false }),
  SPREADSHEET_ID: "test"
};
vm.runInNewContext(requestDownloadHelperFn + "\n" + requestDownloadFn + "\nthis.download=getAdministrativeRequestAttachment;", requestDownloadContext);
const deniedRequestDownload = requestDownloadContext.download({ _verifiedUserId: "intruder", solicitudId: "SOL-1" });
assert.equal(deniedRequestDownload.code, "RESOURCE_NOT_FOUND");
assert.equal(requestFileLookups, 0, "unauthorized callers must not reach Drive");
const allowedRequestDownload = requestDownloadContext.download({ _verifiedUserId: "student-1", solicitudId: "SOL-1" });
assert.equal(allowedRequestDownload.status, "success");
assert.equal(allowedRequestDownload.fileData, "YWJj");
requestFileSharing = "ANYONE_WITH_LINK";
const publicRequestDownload = requestDownloadContext.download({ _verifiedUserId: "student-1", solicitudId: "SOL-1" });
assert.equal(publicRequestDownload.code, "ATTACHMENT_NOT_PRIVATE");
assert.equal(requestBlobReads, 1, "public request files must be rejected before reading bytes");

console.log("file-attachment-persistence-contract: PASS (binary validation, all upload paths, private storage, authorized downloads, fail-closed behavior, rollback and legacy URL suppression)");
