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
  getVerifiedAccountingDepartmentScope_: () => scope
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
