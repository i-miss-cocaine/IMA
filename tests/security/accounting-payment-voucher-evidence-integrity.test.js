"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed " + name);
}

const names = [
  "validateFileBinaryIntegrity", "computeDocumentSHA256", "getOrCreatePrivateAttachmentFolder_",
  "rollbackPrivatePaymentAttachment_", "createPrivatePaymentAttachment_", "ensurePaymentVoucherEvidenceSchema_",
  "getAccountingEvidenceIntegrityPolicy_", "createPrivatePaymentAttachmentWithIntegrity_",
  "verifyPaymentVoucherEvidence_", "extractDriveFileId", "uploadPaymentVoucher", "getPaymentVouchers",
  "getPaymentVoucherFile", "reviewPaymentVoucher"
];

const baseHeaders = ["ComprobanteID","Fecha","UserId","Alumno","CargoID","MontoReportado","MetodoPago","Referencia","ComprobanteUrl","Estado","Observaciones"];
const rows = { ComprobantesPago: [baseHeaders.slice()] };
let uuid = 0, lockBusy = false, lockTryCalls = 0, failLockTryAt = -1, tamperOnCreate = false;
const files = Object.create(null), events = [];
function makeSheet(name) {
  if (!rows[name]) rows[name] = [];
  return {
    getDataRange() {
      return { getValues() { return rows[name].map(row => row.slice()); } };
    },
    getLastRow() { return rows[name].length; },
    getLastColumn() { return rows[name].reduce((max,row)=>Math.max(max,row.length),0); },
    appendRow(row) { rows[name].push(row.slice()); },
    getRange(row,col,numRows,numCols) {
      return {
        getValues() {
          const height = numRows || 1, width = numCols || 1, out = [];
          for (let r=0;r<height;r++) {
            const sourceRow = rows[name][row-1+r] || [];
            out.push(Array.from({length:width},(_,i)=>sourceRow[col-1+i] === undefined ? "" : sourceRow[col-1+i]));
          }
          return out;
        },
        setValue(value) {
          while (rows[name].length < row) rows[name].push([]);
          while (rows[name][row-1].length < col) rows[name][row-1].push("");
          rows[name][row-1][col-1] = value;
        },
        setValues(values) {
          values.forEach((valuesRow,r)=>{
            while (rows[name].length < row+r) rows[name].push([]);
            while (rows[name][row-1+r].length < col+valuesRow.length-1) rows[name][row-1+r].push("");
            valuesRow.forEach((value,i)=>{ rows[name][row-1+r][col-1+i] = value; });
          });
        }
      };
    }
  };
}
const ss = { getSheetByName(name) { return rows[name] ? makeSheet(name) : null; } };
const getOrCreateSheet = (_ss,name) => makeSheet(name);
function makeBlob(bytes,mime,name) {
  const data = Array.from(bytes);
  return { getBytes(){return data.slice();}, getContentType(){return mime;}, getName(){return name;} };
}
const folder = {
  getSharingAccess(){return "PRIVATE";},
  setSharing(){},
  createFile(blob) {
    const id = "DRIVE-FILE-" + String(++uuid).padStart(24,"0");
    let data = blob.getBytes();
    if (tamperOnCreate) { tamperOnCreate = false; data = Array.from(Buffer.from("%PDF-1.4\n%mutated\nstartxref\n10\n%%EOF","utf8")); }
    const file = {
      id, name: blob.getName(), mime: blob.getContentType(), bytes: data, trashed: false, sharing: "PRIVATE",
      getId(){return id;}, getName(){return this.name;}, getMimeType(){return this.mime;},
      isTrashed(){return this.trashed;}, getSharingAccess(){return this.sharing;},
      setSharing(access){this.sharing=access;}, setTrashed(value){this.trashed=!!value;},
      getBlob(){return {getBytes:()=>this.bytes.slice(),getContentType:()=>this.mime};}
    };
    files[id] = file;
    return file;
  }
};
const root = {
  getFoldersByName(){let used=false;return {hasNext(){return !used;},next(){used=true;return folder;}};},
  createFolder(){return folder;}
};
const context = {
  SPREADSHEET_ID:"TEST",
  SpreadsheetApp:{openById(){return ss;}},
  LockService:{getScriptLock(){return {
    tryLock(){lockTryCalls++;if(lockBusy||lockTryCalls===failLockTryAt)return false;lockBusy=true;return true;},
    waitLock(){if(lockBusy)throw new Error("LOCK_BUSY");lockBusy=true;},
    releaseLock(){lockBusy=false;}
  };}},
  DriveApp:{
    Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},
    getRootFolder(){return root;},
    getFileById(id){if(!files[id])throw new Error("NOT_FOUND");return files[id];}
  },
  Utilities:{
    getUuid(){return "UUID-"+String(++uuid).padStart(8,"0");},
    base64Decode(value){return Array.from(Buffer.from(value,"base64"));},
    base64Encode(value){return Buffer.from(value).toString("base64");},
    newBlob(value,mime,name){return makeBlob(Array.isArray(value)?value:Buffer.from(String(value),"utf8"),mime||"text/plain",name||"blob");},
    computeDigest(_algorithm,value){return Array.from(require("node:crypto").createHash("sha256").update(Buffer.from(value.map(v=>v<0?v+256:v))).digest()).map(v=>v>127?v-256:v);},
    DigestAlgorithm:{SHA_256:"SHA_256"}
  },
  getOrCreateSheet, console, Date, Math, String, Number, Object, Array, JSON, Error, Set, Map, Buffer,
  assertPaymentVoucherOwnerAccess_(payload,target,options){const actor=context.getVerifiedAccountingIdentity_(payload);if(options&&options.requireStaff)return actor.role==="Secretaría"?{authorized:true}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};return actor.userId===String(target||"")||actor.role==="Secretaría"?{authorized:true}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};},
  assertJointFamilyVoucherOwnerAccess_(){return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};},
  getVerifiedAccountingIdentity_(payload){return {authorized:true,userId:String(payload&&payload._verifiedUserId||payload&&payload.userId||"STU-1"),role:String(payload&&payload._verifiedRole||"Estudiante")};},
  assertJointFamilyVoucherOwnerAccess_(){return {authorized:false,code:"RESOURCE_SCOPE_DENIED"};},
  extractDriveFileId(value){return String(value||"").trim();},
  logStructuredEvent(...args){events.push(args);},
  recordStudentPayment(){return {status:"success",pagoId:"PAY-TEST"};}
};
context.extractDriveFileId=value=>String(value||"").trim();
vm.createContext(context);
vm.runInContext(names.map(extractFunction).join("\n"),context);
const jsonHashInput=JSON.stringify({evidence:["one","two"],version:2});
assert.equal(context.computeDocumentSHA256(jsonHashInput),require("node:crypto").createHash("sha256").update(jsonHashInput,"utf8").digest("hex"),"JSON decision payloads must be hashed as UTF-8, not parsed as data URIs");

function pdfData(marker) {
  const bytes = Buffer.from("%PDF-1.4\n%"+marker+"\n1 0 obj\n<<>>\nendobj\nstartxref\n10\n%%EOF","utf8");
  return "data:application/pdf;base64,"+bytes.toString("base64");
}
function voucherPayload(overrides) {
  return Object.assign({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",userId:"STU-1",alumno:"Estudiante Uno",
    cargoId:"CARGO-1",montoReportado:100,metodoPago:"Transferencia",referencia:"REF-1",
    fileData:pdfData("original"),fileName:"voucher.pdf"},overrides||{});
}

const first = context.uploadPaymentVoucher(voucherPayload());
assert.equal(first.status,"success");
assert.equal(first.versionNumero,1);
assert.match(first.sha256,/^[a-f0-9]{64}$/);
let stored = rows.ComprobantesPago[1];
const map = Object.fromEntries(rows.ComprobantesPago[0].map((name,index)=>[name,index]));
assert.equal(stored[map.SHA256],first.sha256);
assert.equal(stored[map.EsVersionActual],true);
assert.equal(stored[map.EstadoIntegridad],"VERIFICADO");

let listed = context.getPaymentVouchers({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante"});
assert.equal(listed.status,"success");
assert.equal(listed.comprobantes[0].comprobanteUrl,"","Drive URL must never be returned");
assert.equal(listed.comprobantes[0].comprobanteGrupoId,first.comprobanteGrupoId);
assert.equal(listed.comprobantes[0].versionNumero,1);

let downloaded = context.getPaymentVoucherFile({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",comprobanteId:first.comprobanteId});
assert.equal(downloaded.status,"success");
assert.equal(downloaded.integrityVerified,true);
assert.equal(downloaded.sha256Actual,first.sha256);

const firstFileId = stored[map.ComprobanteUrl];
files[firstFileId].bytes = Array.from(Buffer.from("%PDF-1.4\n%tampered\n1 0 obj\n<<>>\nendobj\nstartxref\n10\n%%EOF","utf8"));
let blocked = context.getPaymentVoucherFile({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",comprobanteId:first.comprobanteId});
assert.equal(blocked.code,"EVIDENCE_TAMPERING_DETECTED","strict policy must block altered evidence");

rows.ConfiguracionInstitucional = [
  ["Clave","Valor","Estado"],
  ["BLOQUEO_AUTOMATICO_POR_DISCREPANCIA_HASH","ADVERTENCIA_VISUAL_REVISOR","Activo"]
];
let warned = context.getPaymentVoucherFile({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",comprobanteId:first.comprobanteId});
assert.equal(warned.status,"success");
assert.equal(warned.integrityWarning,true);
assert.equal(warned.integrityVerified,false);

const approved = context.reviewPaymentVoucher({_verifiedUserId:"SEC-1",_verifiedRole:"Secretaría",comprobanteId:first.comprobanteId,nuevoEstado:"Aprobado"});
assert.equal(approved.status,"success");
assert.equal(approved.integrityWarning,true);
stored = rows.ComprobantesPago[1];
assert.equal(stored[map.DecisionIntegrityWarning],true);
assert.match(stored[map.DecisionHash],/^[a-f0-9]{64}$/);
const fileCountAfterApproval = Object.keys(files).length;
const immutable = context.uploadPaymentVoucher(voucherPayload({comprobanteGrupoId:first.comprobanteGrupoId,fileData:pdfData("attempted-replacement")}));
assert.equal(immutable.code,"VOUCHER_VERSION_IMMUTABLE");
assert.equal(Object.keys(files).length,fileCountAfterApproval,"approved evidence must not be replaceable");

const second = context.uploadPaymentVoucher(voucherPayload({cargoId:"CARGO-2",referencia:"REF-2",fileData:pdfData("v1-second")}));
assert.equal(second.status,"success");
const secondRowIndex = rows.ComprobantesPago.findIndex((row,index)=>index>0&&row[map.ComprobanteID]===second.comprobanteId);
rows.ComprobantesPago[secondRowIndex][map.Estado]="Observado";
const secondV2 = context.uploadPaymentVoucher(voucherPayload({cargoId:"CARGO-2",referencia:"REF-2",comprobanteGrupoId:second.comprobanteGrupoId,fileData:pdfData("v2-second")}));
assert.equal(secondV2.status,"success");
assert.equal(secondV2.versionNumero,2);
const historicalRow = rows.ComprobantesPago.find(row=>row[map.ComprobanteID]===second.comprobanteId);
assert.equal(historicalRow[map.EsVersionActual],false);
assert.equal(historicalRow[map.Estado],"SUPERADA");
const historicalDownload = context.getPaymentVoucherFile({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",comprobanteId:second.comprobanteId});
assert.equal(historicalDownload.status,"success");
assert.equal(historicalDownload.integrityVerified,true);
const currentDownload = context.getPaymentVoucherFile({_verifiedUserId:"STU-1",_verifiedRole:"Estudiante",comprobanteId:secondV2.comprobanteId});
assert.equal(currentDownload.status,"success");
assert.equal(currentDownload.integrityVerified,true);

const v2Approval = context.reviewPaymentVoucher({_verifiedUserId:"SEC-1",_verifiedRole:"Secretaría",comprobanteId:secondV2.comprobanteId,nuevoEstado:"Aprobado"});
assert.equal(v2Approval.status,"success");
const v3Blocked = context.uploadPaymentVoucher(voucherPayload({cargoId:"CARGO-2",referencia:"REF-2",comprobanteGrupoId:second.comprobanteGrupoId,fileData:pdfData("v3-second")}));
assert.equal(v3Blocked.code,"VOUCHER_VERSION_IMMUTABLE");

const unauthorized = context.getPaymentVoucherFile({_verifiedUserId:"STU-OTHER",_verifiedRole:"Estudiante",comprobanteId:secondV2.comprobanteId});
assert.equal(unauthorized.code,"RESOURCE_NOT_FOUND");

const rowCountBeforeLockFailure = rows.ComprobantesPago.length;
lockTryCalls = 0; failLockTryAt = 2;
assert.throws(()=>context.uploadPaymentVoucher(voucherPayload({cargoId:"CARGO-LOCK",fileData:pdfData("lock-failure")})),/LOCK_TIMEOUT/);
failLockTryAt = -1;
assert.equal(rows.ComprobantesPago.length,rowCountBeforeLockFailure,"lock failure must not append a voucher row");
assert.ok(Object.values(files).some(file=>file.trashed),"lock failure must trash the uncommitted file");

tamperOnCreate = true;
const beforeFailedReadback = rows.ComprobantesPago.length;
assert.throws(()=>context.uploadPaymentVoucher(voucherPayload({cargoId:"CARGO-READBACK",fileData:pdfData("readback")})),/ATTACHMENT_STORAGE_INTEGRITY_MISMATCH/);
assert.equal(rows.ComprobantesPago.length,beforeFailedReadback,"read-back mismatch must not persist a voucher");
assert.ok(Object.values(files).some(file=>file.trashed),"read-back mismatch must roll back the Drive file");

console.log("ACCOUNTING payment voucher SHA-256, versioning, privacy and decision binding contract: PASS");
