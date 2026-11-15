"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const vm = require("node:vm");

const userSource = fs.readFileSync("backend/user-service/Code.gs", "utf8");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
const base64 = Buffer.from("%PDF-test").toString("base64");
const originalBytes = Buffer.from("%PDF-test");
let storedBytes = Buffer.from(originalBytes);
let tamperOnCreate = false;
let sharing = "PRIVATE", trashed = false, folderExists = false, events = [];
const fileId = "file-id-123456789012345678901";
const file = {
  setSharing(access) { sharing = access; },
  getSharingAccess() { return sharing; },
  setTrashed(value) { trashed = !!value; },
  isTrashed() { return trashed; },
  getId() { return fileId; },
  getName() { return "evidence.pdf"; },
  getMimeType() { return "application/pdf"; },
  getSize() { return storedBytes.length; },
  getBlob() { return { getBytes() { return Array.from(storedBytes); }, getContentType() { return "application/pdf"; } }; }
};
const folder = {
  getSharingAccess() { return "PRIVATE"; },
  setSharing() {},
  createFile(blob) { storedBytes = Buffer.from(blob.bytes); if (tamperOnCreate) storedBytes[storedBytes.length - 1] ^= 1; sharing = "PRIVATE"; trashed = false; return file; }
};
const root = {
  getFoldersByName() { return { hasNext() { return folderExists; }, next() { return folder; } }; },
  createFolder() { folderExists = true; return folder; }
};
const headers = ["SolicitudID","UserId","EstudianteID","TipoTramite","Descripcion","AdjuntoUrl","Estado","AsignadoA","ObservacionesAdmin","FechaSolicitud","FechaResolucion","AdjuntoSHA256","AdjuntoVersion","AdjuntoSizeBytes","AdjuntoMimeType","AdjuntoFechaRecepcion","AdjuntoIntegridadEstado"];
let requestRows = [headers, ["REQ-1","STU-1","STU-1","Solicitud","Evidencia",fileId,"Enviada","Secretaría","","","",crypto.createHash("sha256").update(originalBytes).digest("hex"),1,originalBytes.length,"application/pdf","2026-11-15T10:00:00.000Z","VERIFICADO"]];
const sheet = {
  getLastRow() { return requestRows.length; },
  getLastColumn() { return headers.length; },
  getDataRange() { return { getValues() { return requestRows.map(row => row.slice()); } }; },
  getRange(row,col,numRows,numCols) {
    return { getValues() { const h=numRows||1,w=numCols||1,out=[]; for(let r=0;r<h;r++) out.push(Array.from({length:w},(_,c)=>((requestRows[row-1+r]||[])[col-1+c]===undefined?"":requestRows[row-1+r][col-1+c]))); return out; } };
  }
};
const context = {
  SPREADSHEET_ID: "TEST",
  LockService: { getScriptLock() { return { tryLock() { return true; }, releaseLock() {} }; } },
  DriveApp: {
    Access: { PRIVATE: "PRIVATE" }, Permission: { NONE: "NONE" },
    getRootFolder() { return root; },
    getFileById(id) { if(id!==fileId) throw new Error("NOT_FOUND"); return file; }
  },
  Utilities: {
    base64Decode(value) { return Array.from(Buffer.from(value,"base64")); },
    base64Encode(value) { return Buffer.from(value).toString("base64"); },
    newBlob(bytes,mimeType,name) { return { bytes:Array.from(bytes),mimeType,name }; },
    computeDigest(_algorithm,value) {
      const bytes=Array.isArray(value)?Buffer.from(value.map(v=>v<0?v+256:v)):Buffer.from(String(value));
      return Array.from(crypto.createHash("sha256").update(bytes).digest()).map(v=>v>127?v-256:v);
    },
    DigestAlgorithm: { SHA_256: "SHA_256" }
  },
  validateFileBinaryIntegrity(data,name,options) {
    const bytes=Buffer.from(String(data).includes(",")?String(data).slice(String(data).indexOf(",")+1):String(data),"base64");
    assert.equal(name,"evidence.pdf");
    assert.equal(options.maxSizeBytes,10*1024*1024);
    return { valid:true,byteLength:bytes.length,mimeType:"application/pdf" };
  },
  SpreadsheetApp: { openById() { return { getSheetByName(name) { return name==="SolicitudesTramites"?sheet:null; } }; } },
  getUserVerifiedRole() { return "Estudiante"; },
  getGuardianStudents() { return { data: [] }; },
  validateRolePermission() { return { authorized:false }; },
  logStructuredEvent(_service,_fn,_level,event,_message,metadata) { events.push({event,metadata}); },
  Date, Math, JSON, String, Number, Array, Object, Error
};
vm.createContext(context);
const functions = [
  "getOrCreatePrivateAttachmentFolder_","rollbackPrivateAttachment_","createPrivateRequestAttachment_",
  "createPrivateRequestAttachmentWithIntegrity_","computeDocumentSHA256","requestAttachmentHeaderMap_",
  "getEvidenceIntegrityPolicy_","logEvidenceTampering_","getAdministrativeRequestAttachment"
];
vm.runInContext(functions.map(name=>extractFunction(userSource,name)).join("\n"),context);
context.getEvidenceIntegrityPolicy_ = function() { return "ESTRICTO_BLOQUEAR_ACCESO_Y_NOTIFICAR_AUDITORIA"; };
const created=context.createPrivateRequestAttachmentWithIntegrity_(base64,"evidence.pdf","Tramites_Adjuntos_Privados_v1",[".pdf"]);
assert.equal(created.file,file);
assert.equal(created.fileId,fileId);
assert.equal(created.sha256,crypto.createHash("sha256").update(originalBytes).digest("hex"));
assert.equal(created.sizeBytes,originalBytes.length);
assert.equal(created.version,1);
assert.equal(created.mimeType,"application/pdf");
assert.equal(created.integrityStatus,"VERIFICADO");
assert.equal(sharing,"PRIVATE");
assert.equal(trashed,false);

// La carga debe comparar los bytes persistidos con el origen y retirar el archivo si Drive devuelve contenido distinto.
tamperOnCreate = true;
assert.throws(
  () => context.createPrivateRequestAttachmentWithIntegrity_(base64,"evidence.pdf","Tramites_Adjuntos_Privados_v1",[".pdf"]),
  /ATTACHMENT_STORAGE_INTEGRITY_MISMATCH/
);
assert.equal(trashed,true,"a file whose read-back hash differs must be rolled back");
tamperOnCreate = false;
storedBytes = Buffer.from(originalBytes);
trashed = false;

let result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.status,"success");
assert.equal(result.integrityVerified,true);
assert.equal(result.integrityStatus,"VERIFICADO");
assert.equal(result.sha256,created.sha256);
assert.equal(Buffer.from(result.fileData,"base64").toString(),"%PDF-test");

storedBytes=Buffer.from("%PDF-tampered");
result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.code,"EVIDENCE_TAMPERING_DETECTED","mutated Drive bytes must be rejected and classified as evidence tampering");
storedBytes=Buffer.from(originalBytes);

sharing="ANYONE_WITH_LINK";
result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.code,"ATTACHMENT_NOT_PRIVATE");
sharing="PRIVATE";

requestRows[1][11]="";
requestRows[1][12]="";
requestRows[1][13]="";
requestRows[1][14]="";
requestRows[1][15]="";
requestRows[1][16]="LEGACY_UNVERIFIED";
result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.status,"success");
assert.equal(result.integrityVerified,false);
assert.equal(result.integrityStatus,"LEGACY_UNVERIFIED","legacy files must not be represented as hash-verified");

requestRows[1][11]="invalid";
requestRows[1][12]=1;
requestRows[1][13]=originalBytes.length;
requestRows[1][14]="application/pdf";
requestRows[1][15]="2026-11-15T10:00:00.000Z";
requestRows[1][16]="VERIFICADO";
result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.code,"ATTACHMENT_INTEGRITY_METADATA_INVALID");

requestRows[1][11]=crypto.createHash("sha256").update(originalBytes).digest("hex");
requestRows[1][12]=0;
result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.code,"ATTACHMENT_INTEGRITY_METADATA_INVALID","zero versions must fail closed");
requestRows[1][12]=2;
result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-1",solicitudId:"REQ-1"});
assert.equal(result.status,"success","versioned evidence v2 must remain verifiable");
assert.equal(result.attachmentVersion,2);

result=context.getAdministrativeRequestAttachment({_verifiedUserId:"STU-OTHER",solicitudId:"REQ-1"});
assert.equal(result.code,"RESOURCE_NOT_FOUND","attachment ownership must still be enforced");
assert.ok(events.some(event=>event.event==="EVIDENCE_TAMPERING_DETECTED"));
assert.ok(events.some(event=>event.event==="ATTACHMENT_DELIVERED_LEGACY_UNVERIFIED"));

const absenceSubmit=extractFunction(userSource,"submitStudentAbsenceJustification");
const adminSubmit=extractFunction(userSource,"submitAdministrativeRequest");
const formSubmit=extractFunction(userSource,"submitInstitutionalFormRequest");
const review=extractFunction(userSource,"reviewAbsenceJustification");
assert.match(absenceSubmit,/createPrivateRequestAttachmentWithIntegrity_/);
assert.match(absenceSubmit,/adjuntoSHA256/);
assert.match(absenceSubmit,/setRequestAttachmentIntegrity_/);
assert.match(adminSubmit,/createPrivateRequestAttachmentWithIntegrity_/);
assert.match(adminSubmit,/setRequestAttachmentIntegrity_/);
assert.match(formSubmit,/createPrivateRequestAttachmentWithIntegrity_/);
assert.match(formSubmit,/setRequestAttachmentIntegrity_/);
assert.match(review,/adjuntoSHA256/);
assert.match(userSource,/AdjuntoIntegridadEstado/);
assert.match(userSource,/ATTACHMENT_INTEGRITY_MISMATCH/);
console.log("PASS: request attachment SHA-256 baseline, private storage read-back, metadata/version persistence, tamper detection, legacy-unverified disclosure and ownership checks");
