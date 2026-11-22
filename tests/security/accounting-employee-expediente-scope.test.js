"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/accounting-service/Code.gs" });
const start = source.indexOf("function assertEmployeeExpedienteScopeAccess_(");
assert.ok(start >= 0);
const end = source.indexOf("\nfunction ", start + 10);
const fn = source.slice(start, end < 0 ? source.length : end);
const rows = [
  ["ExpedienteID","UserId","Departamento"],
  ["EXP-1","EMP-1","DEP-A"],
  ["EXP-2","EMP-2","DEP-B"]
];
const sheet = { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
let actor = { authorized: true, userId: "EMP-1", role: "Empleado", institutionId: "INST-1" };
let scope = { valid: true, institutionWide: false, departmentIds: ["DEP-A"] };
const context = {
  getVerifiedAccountingIdentity_: () => actor,
  getVerifiedAccountingDepartmentScope_: () => scope,
  assertResourceOwnershipForScope_: (_ss, currentScope, _type, expedienteId, _operation) => {
    const row = rows.find(item => item[0] === expedienteId);
    if (!row) return { authorized: false, code: "RESOURCE_NOT_FOUND" };
    if (currentScope.institutionWide) return { authorized: true, accessType: "INSTITUTION" };
    return currentScope.departmentIds.includes(row[2])
      ? { authorized: true, accessType: "DEPARTMENT", departmentId: row[2] }
      : { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  }
};
vm.runInNewContext(fn + "\nthis.check=assertEmployeeExpedienteScopeAccess_;", context);
const ss = { getSheetByName: name => name === "ExpedientesLaborales" ? sheet : null };
assert.deepEqual(JSON.parse(JSON.stringify(context.check({ sessionToken: "SELF" }, ss, "EXP-1"))),
  { authorized: true, accessType: "SELF" });
assert.equal(context.check({ sessionToken: "SELF" }, ss, "EXP-2").code, "RESOURCE_SCOPE_DENIED");
actor = { authorized: true, userId: "DIR-1", role: "Director", institutionId: "INST-1" };
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-1").accessType, "DEPARTMENT");
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-2").code, "RESOURCE_SCOPE_DENIED");
scope = { valid: true, institutionWide: true, departmentIds: [] };
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-2").accessType, "INSTITUTION");
scope = { valid: false, code: "DEPARTMENT_IMPORT_MEMBERSHIP_SCOPE_UNVERIFIED" };
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-1").code, "RESOURCE_SCOPE_DENIED");
actor = { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
assert.equal(context.check({ sessionToken: "FORGED" }, ss, "EXP-1").code, "VERIFIED_IDENTITY_REQUIRED");
actor = { authorized: true, userId: "DIR-1", role: "Director", institutionId: "INST-1" };
rows.push(["EXP-1","EMP-3","DEP-A"]);
assert.equal(context.check({ sessionToken: "DIR" }, ss, "EXP-1").code, "RESOURCE_SCOPE_DENIED",
  "duplicate expediente identifiers fail closed");
assert.equal(context.check({ sessionToken: "DIR" }, { getSheetByName: () => null }, "EXP-1").code, "RESOURCE_SCOPE_DENIED");
process.stdout.write("Accounting employee expediente scope: self, department, institution, invalid identity and duplicate-ID fail-closed checks PASS.\n");

const accountingDocumentSource = source;
function extractAccountingFunction(name) {
  const from = accountingDocumentSource.indexOf("function " + name + "(");
  assert.ok(from >= 0, "missing " + name);
  const to = accountingDocumentSource.indexOf("\n/* Runtime configuration", from + 10);
  return accountingDocumentSource.slice(from, to < 0 ? accountingDocumentSource.length : to);
}
const employeeSheetRows = [
  ["ExpedienteID","UserId","Departamento"],
  ["EXP-1","EMP-1","DEP-A"]
];
const employeeDocumentRows = [
  ["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"],
  ["DOC-1","EXP-1","CONTRATO","Contrato laboral","https://drive.google.com/file/d/FILE123456789/view","2026-01-01","EMP-1","PRIVADO",""],
  ["DOC-2","EXP-1","ANEXO","Anexo sin archivo","","2026-01-02","EMP-1","PRIVADO",""]
];
function accountingSheet(rows) {
  return { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
}
const accountingSheets = {
  ExpedientesLaborales: accountingSheet(employeeSheetRows),
  DocumentosLaborales: accountingSheet(employeeDocumentRows)
};
const accountingSs = { getSheetByName: name => accountingSheets[name] || null };
let employeeActor = { authorized: true, userId: "EMP-1", role: "Empleado", institutionId: "INST-1" };
actor = employeeActor;
scope = { valid: true, institutionWide: false, departmentIds: ["DEP-A"] };
const employeeDocumentContext = {
  SPREADSHEET_ID: "IN_MEMORY",
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => "IN_MEMORY" }) },
  SpreadsheetApp: { openById: () => accountingSs },
  getVerifiedAccountingIdentity_: () => employeeActor,
  getVerifiedAccountingDepartmentScope_: () => ({ valid: true, institutionWide: false, departmentIds: ["DEP-A"] }),
  enforcePrivateEmployeeDocumentFile_: () => true,
  assertEmployeeExpedienteScopeAccess_: context.check,
  authorizeAccountingDepartmentReferenceReadViaUser_: () => ({ status: "error" })
};
vm.runInNewContext(extractAccountingFunction("getEmployeeDocuments") +
  "\nthis.getEmployeeDocuments = getEmployeeDocuments;", employeeDocumentContext);
const employeeDocuments = employeeDocumentContext.getEmployeeDocuments({ sessionToken: "EMP-SESSION" });
assert.equal(employeeDocuments.status, "success");
assert.equal(employeeDocuments.documentos.length, 2);
assert.equal(employeeDocuments.documentos[0].tieneArchivo, true);
assert.equal(employeeDocuments.documentos[1].tieneArchivo, false);
assert.equal("archivoUrl" in employeeDocuments.documentos[0], false,
  "authorized employee document metadata must not disclose a direct Drive URL");
assert.equal("ArchivoUrl" in employeeDocuments.documentos[0], false);
employeeActor = { authorized: true, userId: "EMP-2", role: "Empleado", institutionId: "INST-1" };
actor = employeeActor;
assert.equal(employeeDocumentContext.getEmployeeDocuments({ expedienteId: "EXP-1", sessionToken: "EMP-2-SESSION" }).code,
  "RESOURCE_NOT_FOUND", "cross-employee document metadata remains concealed");


// Employee document uploads must revalidate authorization after waiting for ScriptLock.
{
  function makeUploadHarness({revokePermission=false,revokeScope=false,changeActor=false}={}) {
    let actor={authorized:true,userId:"EMP-1",role:"Empleado",institutionId:"INST-1"};
    let permissionActive=true,scopeActive=true,permissionCalls=0,scopeCalls=0,lockReleases=0,sheetCreations=0,writes=0;
    const rows=[["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"]];
    const sheet={
      getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),
      appendRow:row=>{writes++;rows.push(row.slice());}
    };
    const ss={getSheetByName:name=>name==="DocumentosLaborales"?sheet:null};
    const context={
      SPREADSHEET_ID:"IN_MEMORY",
      SpreadsheetApp:{openById:()=>ss},
      getVerifiedAccountingIdentity_:()=>actor,
      validateRolePermission:(_actor,action)=>{assert.equal(action,"uploadEmployeeDocument");permissionCalls++;return permissionActive?{authorized:true}:{authorized:false,code:"AUTH_PERMISSION_DENIED"};},
      assertEmployeeExpedienteScopeAccess_:()=>{scopeCalls++;return scopeActive?{authorized:true}:{authorized:false,code:"RESOURCE_SCOPE_DENIED"};},
      LockService:{getScriptLock:()=>({tryLock:()=>{if(revokePermission)permissionActive=false;if(revokeScope)scopeActive=false;if(changeActor)actor={authorized:true,userId:"EMP-2",role:"Empleado",institutionId:"INST-1"};return true;},releaseLock:()=>{lockReleases++;}})},
      getOrCreateSheet:()=>{sheetCreations++;return sheet;},
      Utilities:{getUuid:()=>"UPLOAD-UNIQUE-123456789"},
      String,Array,Object,Date
    };
    vm.runInNewContext(extractAccountingFunction("uploadEmployeeDocument")+"\nthis.run=uploadEmployeeDocument;",context);
    return {run:payload=>context.run(payload),state:()=>({permissionCalls,scopeCalls,lockReleases,sheetCreations,writes,rows})};
  }
  const revokedPermission=makeUploadHarness({revokePermission:true});
  const permissionResult=revokedPermission.run({sessionToken:"SESSION-1",expedienteId:"EXP-1",tituloDocumento:"Contrato"});
  assert.equal(permissionResult.code,"AUTH_PERMISSION_DENIED");
  assert.deepEqual(revokedPermission.state(),{permissionCalls:2,scopeCalls:1,lockReleases:1,sheetCreations:0,writes:0,rows:[["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"]]});

  const revokedScope=makeUploadHarness({revokeScope:true});
  const scopeResult=revokedScope.run({sessionToken:"SESSION-1",expedienteId:"EXP-1",tituloDocumento:"Contrato"});
  assert.equal(scopeResult.code,"RESOURCE_SCOPE_DENIED");
  assert.deepEqual(revokedScope.state(),{permissionCalls:2,scopeCalls:2,lockReleases:1,sheetCreations:0,writes:0,rows:[["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"]]});

  const refreshed=makeUploadHarness({changeActor:true});
  const success=refreshed.run({sessionToken:"SESSION-1",expedienteId:"EXP-1",tituloDocumento:"Contrato"});
  assert.equal(success.status,"success");
  assert.equal(refreshed.state().scopeCalls,2);
  assert.equal(refreshed.state().permissionCalls,2);
  assert.equal(refreshed.state().rows[1][6],"EMP-2","the document audit actor must use the identity refreshed under lock");
  assert.equal(refreshed.state().writes,1);
  assert.equal(refreshed.state().lockReleases,1);
}
console.log("ACCOUNTING uploadEmployeeDocument post-lock identity, permission and scope revalidation contracts passed.");
