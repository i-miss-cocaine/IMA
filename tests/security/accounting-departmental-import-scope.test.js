const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
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
  throw new Error("Unbalanced " + name);
}
const accounting = fs.readFileSync(path.resolve(__dirname, "../../backend/accounting-service/Code.gs"), "utf8");
const shared = fs.readFileSync(path.resolve(__dirname, "../../backend/shared/DepartmentCatalogContract.gs"), "utf8");
const names = ["getVerifiedAccountingIdentity_", "getVerifiedDepartmentScopeForSession_", "getVerifiedAccountingDepartmentScope_", "mapMigrationRowToTarget_", "accountingHasInstitutionalImportPermission_", "resolveAccountingImportRowDepartmentSnapshot_", "buildAccountingDepartmentalImportPreflight_", "validateImportPreview", "importDataWithColumnMapping"];
const functions = names.map(name => extractFunction(accounting, name));
functions.push(extractFunction(shared, "validateDepartmentalImportScope_"));
const snapshotHeaders = ["ImportBatchID","SnapshotID","RowID","InstitutionID","Domain","DepartmentID","Status","VerifiedBy","VerifiedAt","SnapshotVersion"];
const snapshotSchema = "const ACCOUNTING_IMPORT_ROW_DEPARTMENT_SNAPSHOT_HEADERS_ = " + JSON.stringify(snapshotHeaders) + ";";
const schema = { service: "ACCOUNTING", sheet: "ExpedientesLaborales", headers: ["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"] };
const assignmentHeaders = ["AsignacionAmbitoID", "UserID", "RoleID", "ScopeType", "ScopeValues", "Estado", "CreadoPor", "FechaCreacion", "FechaInicio", "FechaFin", "EsSuplente", "SuplenteDeUserID", "InstitutionID", "MembershipID", "ResponsibilityID"];
let assignmentRows = [assignmentHeaders, ["ASG-1", "U-1", "Director", "DEPARTAMENTO", '["DEP-A","DEP-B"]', "Activo", "U-ADMIN", "", "", "", "No", "", "INST-1", "MEM-1", "RESP-1"]];
const auditRows = [], writes = [], rollbackBatches = [];
let snapshotRows = [snapshotHeaders,["BATCH-1","SNAP-1","ROW-1","INST-1","ACCOUNTING","DEP-A","VERIFIED","U-ADMIN","2026-11-12T22:00:00.000Z","1"],["BATCH-1","SNAP-1","ROW-2","INST-1","ACCOUNTING","DEP-B","VERIFIED","U-ADMIN","2026-11-12T22:00:00.000Z","1"]];
let institutionalImportPermission = true;
let writerAttempts = 0, failWriterAt = 0;
const ownershipCalls = [], ownershipCompensations = [];
let failOwnershipRegistration = false, idempotentEmployeeWrite = false;
const assignmentSheet = { getDataRange: () => ({ getValues: () => assignmentRows.map(row => row.slice()) }) };
const snapshotSheet = { getDataRange: () => ({ getValues: () => snapshotRows.map(row => row.slice()) }) };
const spreadsheet = { getSheetByName: name => name === "AsignacionesAmbitosRoles" ? assignmentSheet : (name === "AsignacionesImportacionDepartamental" ? snapshotSheet : null) };
const claims = { signed: { userId: "U-1", role: "Director", membershipId: "MEM-1", institutionId: "INST-1" } };
const context = {
  SPREADSHEET_ID: "TEST", MIGRATION_OWNER_SCHEMAS_: { empleado: schema },
  verifySessionToken: token => claims[token] || null,
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_INSTITUTION_ID" ? "INST-1" : null }) },
  SpreadsheetApp: { openById: () => spreadsheet },
  resolveInternalResponsibilityForRoleScope_: () => ({ responsibilityId: "RESP-1" }),
  getDynamicPermissionsForRole: (role, action) => action === "importDataWithColumnMapping" ? institutionalImportPermission : null,
  ROLE_PERMISSIONS: {},
  getOrCreateSheet: (_ss, name) => { assert.equal(name, "AuditoriaMigraciones"); return { appendRow: row => auditRows.push(row) }; },
  Utilities: { getUuid: () => "RUN-1" },
  resolveCrossReferenceIdentifier: payload => ({ status: "success", idNuevoPlataforma: "EMP-" + String(payload.idOriginalLegado || "1").replace(/[^A-Za-z0-9]/g, "") }),
  migrationStableJson_: value => JSON.stringify(value), migrationHash_: () => "HASH-1",
  sendMigrationOwnerRequest_: (_type, action, payload) => {
    if (action === "compensateMigratedEntity") return { status: "success", compensated: true };
    if (action === "compensateMigratedResourceOwnership") { ownershipCompensations.push(payload); return { status: "success", compensated: true }; }
    if (action === "registerMigratedResourceOwnership") { ownershipCalls.push(payload); if (failOwnershipRegistration) throw new Error("MOCK_OWNERSHIP_TRANSPORT_FAILED"); return { status: "success", ownershipId: "OWN-" + payload.resourceId }; }
    writerAttempts++;
    if (writerAttempts === failWriterAt) throw new Error("MOCK_OWNER_WRITE_FAILED");
    writes.push(payload);
    return { status: "success", idempotent: idempotentEmployeeWrite };
  },
  rollbackMigrationOwnerWrites_: applied => { rollbackBatches.push(applied.slice()); return []; }
};
vm.runInNewContext(snapshotSchema + "\n" + functions.join("\n") + "\nthis.api = { build: buildAccountingDepartmentalImportPreflight_, preview: validateImportPreview, run: importDataWithColumnMapping };", context);
const base = { sessionToken: "signed", activeDepartmentId: "DEP-A", tipoEntidad: "empleado", sistemaOrigen: "Legacy", destinoModulo: "ExpedientesLaborales", columnaMapeo: { identificador: "legacyId", campos: { Puesto: "Puesto", Departamento: "Departamento" } }, filasData: [{ legacyId: "LEG-1", Puesto: "Docente" }] };
const preflight = context.api.build(base, spreadsheet, schema);
assert.equal(preflight.valid, true);
assert.equal(preflight.departmentId, "DEP-A");
assert.equal(preflight.rows[0].Departamento, "DEP-A");
const preview = context.api.preview(base);
assert.equal(preview.status, "success");
assert.equal(preview.departamentoDestino, "DEP-A");
const mixed = context.api.build({ ...base, filasData: [{ legacyId: "LEG-1", Puesto: "Docente", Departamento: "DEP-B" }] }, spreadsheet, schema);
assert.equal(mixed.valid, false);
assert.equal(mixed.code, "DEPARTMENT_IMPORT_MIXED_DEPARTMENTS");
const freeText = context.api.build({ ...base, filasData: [{ legacyId: "LEG-1", Puesto: "Docente", Departamento: "Departamento A" }] }, spreadsheet, schema);
assert.equal(freeText.valid, false);
const deniedPreview = context.api.preview({ ...base, activeDepartmentId: "DEP-X" });
assert.equal(deniedPreview.status, "error");
assert.equal(deniedPreview.resumenValidation.filasValidas, 0);
assignmentRows = [assignmentHeaders, ["ASG-2", "U-1", "Director", "INSTITUCION", '["INST-1"]', "Activo", "U-ADMIN", "", "", "", "No", "", "INST-1", "MEM-1", "RESP-1"]];
const institutionWide = context.api.build({ ...base, activeDepartmentId: "" }, spreadsheet, schema);
assert.equal(institutionWide.valid, false);
assignmentRows = [assignmentHeaders, ["ASG-1", "U-1", "Director", "DEPARTAMENTO", '["DEP-A","DEP-B"]', "Activo", "U-ADMIN", "", "", "", "No", "", "INST-1", "MEM-1", "RESP-1"]];
claims.legacy = { userId: "U-1", role: "Director" };
const missingMembership = context.api.build({ ...base, sessionToken: "legacy" }, spreadsheet, schema);
assert.equal(missingMembership.valid, false);
const nonDepartmentEntity = context.api.build({ ...base, tipoEntidad: "curso" }, spreadsheet, schema);
assert.equal(nonDepartmentEntity.valid, true);
assert.equal(nonDepartmentEntity.applicable, false);
let denied = false;
try { context.api.run({ ...base, activeDepartmentId: "DEP-X" }); } catch (error) { denied = String(error.message).includes("ACTIVE_SCOPE_NOT_ASSIGNED"); }
assert.equal(denied, true);
assert.equal(auditRows.length, 0);
assert.equal(writes.length, 0);
const imported = context.api.run(base);
assert.equal(imported.status, "success");
assert.equal(writes.length, 1);
assert.equal(writes[0].datos.Departamento, "DEP-A");
assert.equal(ownershipCalls.length, 1);
assert.equal(ownershipCalls[0].resourceId, "EMP-LEG1");
assert.equal(ownershipCalls[0].departmentId, "DEP-A");
assert.equal(ownershipCalls[0].sessionToken, "signed");
assert.equal(auditRows.length, 1);

const retry = context.api.run(base);
assert.equal(retry.status, "success");
assert.equal(writes[1].idempotencyKey, writes[0].idempotencyKey, "retry retains a stable idempotency key");

const beforeMixedWriters = writerAttempts, beforeMixedAudit = auditRows.length;
let mixedImportDenied = false;
try {
  context.api.run({ ...base, filasData: [
    { legacyId: "LEG-1", Puesto: "Docente", Departamento: "DEP-A" },
    { legacyId: "LEG-2", Puesto: "Docente", Departamento: "DEP-B" }
  ] });
} catch (error) { mixedImportDenied = String(error.message).includes("DEPARTMENT_IMPORT_MIXED_DEPARTMENTS"); }
assert.equal(mixedImportDenied, true);
assert.equal(writerAttempts, beforeMixedWriters, "the entire mixed batch is rejected before the first writer");
assert.equal(auditRows.length, beforeMixedAudit, "a rejected batch creates no migration audit row");

failWriterAt = writerAttempts + 2;
const rollback = context.api.run({ ...base, filasData: [
  { legacyId: "LEG-3", Puesto: "Docente" },
  { legacyId: "LEG-4", Puesto: "Docente" }
] });
assert.equal(rollback.code, "MIGRATION_BATCH_ROLLED_BACK");
assert.equal(rollback.estado, "rolled_back");
assert.equal(rollbackBatches.at(-1).length, 2, "employee write and ownership intent are compensated");
assert.equal(auditRows.at(-1)[8], "rolled_back");
assert.equal(rollbackBatches.at(-1).some(x => x.tipoEntidad === "empleadoOwnership"), true);
failOwnershipRegistration = true;
const failedOwnership = context.api.run({ ...base, filasData: [{ legacyId: "LEG-5", Puesto: "Docente" }] });
assert.equal(failedOwnership.status, "error");
assert.equal(failedOwnership.estado, "rolled_back");
assert.equal(rollbackBatches.at(-1).length, 2, "employee write and attempted ownership registration both enter compensation");
assert.equal(auditRows.at(-1)[8], "rolled_back");
failOwnershipRegistration = false;
const rollbackCalls = [];
const rollbackHarness = { sendMigrationOwnerRequest_: (type, action, payload) => { rollbackCalls.push({ type, action, payload }); return { status: "success" }; } };
vm.runInNewContext(extractFunction(accounting, "rollbackMigrationOwnerWrites_") + "\nthis.rollback = rollbackMigrationOwnerWrites_;", rollbackHarness);
const rollbackErrors = rollbackHarness.rollback([{ tipoEntidad: "empleado", idempotencyKey: "MIG-1" }, { tipoEntidad: "empleadoOwnership", idempotencyKey: "OWN-1" }]);
assert.equal(rollbackErrors.length, 0);
assert.equal(rollbackCalls[0].action, "compensateMigratedResourceOwnership");
assert.equal(rollbackCalls[1].action, "compensateMigratedEntity");
const routeStart = accounting.indexOf("const MIGRATION_OWNER_SCHEMAS_=");
const routeEnd = accounting.indexOf("function migrationStableJson_", routeStart);
const routeCalls = [];
const routeHarness = { PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_USER_SERVICE_URL" ? "https://user.example.test/exec" : "12345678901234567890123456789012" }) }, createInterServiceEnvelope: (source, target, action, payload) => ({ sourceService: source, targetService: target, action, payload }), UrlFetchApp: { fetch: (url, options) => { routeCalls.push({ url, envelope: JSON.parse(options.payload) }); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ status: "success", ownershipId: "OWN-1" }) }; } } };
vm.runInNewContext(accounting.slice(routeStart, routeEnd) + "\n" + extractFunction(accounting, "sendMigrationOwnerRequest_") + "\nthis.send = sendMigrationOwnerRequest_;", routeHarness);
assert.equal(routeHarness.send("empleadoOwnership", "registerMigratedResourceOwnership", { resourceId: "EMP-1" }).status, "success");
assert.equal(routeCalls[0].url, "https://user.example.test/exec");
assert.equal(routeCalls[0].envelope.sourceService, "ACCOUNTING");
assert.equal(routeCalls[0].envelope.targetService, "USER");
assert.equal(routeCalls[0].envelope.action, "registerMigratedResourceOwnership");


failOwnershipRegistration = true; idempotentEmployeeWrite = true;
const idempotentOwnershipFailure = context.api.run({ ...base, filasData: [{ legacyId: "LEG-6", Puesto: "Docente" }] });
assert.equal(idempotentOwnershipFailure.status, "error");
assert.equal(idempotentOwnershipFailure.code, "MIGRATION_COMPENSATION_REQUIRED");
assert.equal(idempotentOwnershipFailure.estado, "compensation_required");
assert.equal(rollbackBatches.at(-1).length, 1, "a previously committed idempotent employee write is never compensated");
assert.equal(rollbackBatches.at(-1)[0].tipoEntidad, "empleadoOwnership");
assert.equal(idempotentOwnershipFailure.errores.some(x => x.error === "RESOURCE_OWNERSHIP_REPAIR_REQUIRED"), true);
failOwnershipRegistration = false; idempotentEmployeeWrite = false;


assignmentRows=[assignmentHeaders,["ASG-I","U-1","Director","INSTITUCION",'["INST-1"]',"Activo","U-ADMIN","","","","No","","INST-1","MEM-1","RESP-1"]];
const institutionalBase={...base,activeDepartmentId:"",importBatchId:"BATCH-1",filasData:[{legacyId:"LEG-7",RowID:"ROW-1",Puesto:"Docente"},{legacyId:"LEG-8",RowID:"ROW-2",Puesto:"Administrativo"}]};
const ip=context.api.build(institutionalBase,spreadsheet,schema);assert.equal(ip.valid,true);assert.equal(ip.institutionWide,true);assert.equal(ip.snapshotId,"SNAP-1");assert.deepEqual(Array.from(ip.rows,r=>r.Departamento),["DEP-A","DEP-B"]);assert.deepEqual(Array.from(ip.departmentIds).sort(),["DEP-A","DEP-B"]);
const iv=context.api.preview(institutionalBase);assert.equal(iv.status,"success");assert.deepEqual(Array.from(iv.departamentosDestino).sort(),["DEP-A","DEP-B"]);assert.equal(iv.snapshotId,"SNAP-1");
const ii=context.api.run(institutionalBase);assert.equal(ii.status,"success");assert.equal(ownershipCalls.at(-2).departmentId,"DEP-A");assert.equal(ownershipCalls.at(-2).rowDepartmentSnapshotId,"SNAP-1");assert.equal(ownershipCalls.at(-2).rowDepartmentSnapshotRowId,"ROW-1");assert.equal(ownershipCalls.at(-1).departmentId,"DEP-B");assert.equal(ownershipCalls.at(-1).rowDepartmentSnapshotRowId,"ROW-2");
const beforeW=writerAttempts,beforeA=auditRows.length;let missing=false;try{context.api.run({...institutionalBase,importBatchId:"MISSING"});}catch(e){missing=String(e.message).includes("DEPARTMENT_IMPORT_ROW_SNAPSHOT_NOT_FOUND");}assert.equal(missing,true);assert.equal(writerAttempts,beforeW);assert.equal(auditRows.length,beforeA);
const forged=context.api.build({...institutionalBase,importBatchId:"FORGED",rowDepartmentAssignments:[{rowId:"ROW-1",departmentId:"DEP-A",verified:true,institutionId:"INST-1",domain:"ACCOUNTING",snapshotId:"SNAP-X"}],rowDepartmentSnapshotVerified:true},spreadsheet,schema);assert.equal(forged.valid,false);assert.equal(forged.code,"DEPARTMENT_IMPORT_ROW_SNAPSHOT_NOT_FOUND");
assert.equal(context.api.build({...institutionalBase,filasData:[{legacyId:"LEG-9",Puesto:"Docente"}]},spreadsheet,schema).code,"DEPARTMENT_IMPORT_ROW_ID_REQUIRED");
assert.equal(context.api.build({...institutionalBase,filasData:[{legacyId:"LEG-9",RowID:"ROW-1",Puesto:"Docente"},{legacyId:"LEG-10",RowID:"ROW-1",Puesto:"Docente"}]},spreadsheet,schema).code,"DEPARTMENT_IMPORT_ROW_ID_DUPLICATE");
assert.equal(context.api.build({...institutionalBase,filasData:[{legacyId:"LEG-11",RowID:"ROW-1",Puesto:"Docente",Departamento:"DEP-B"},{legacyId:"LEG-12",RowID:"ROW-2",Puesto:"Docente"}]},spreadsheet,schema).code,"DEPARTMENT_IMPORT_ROW_TARGET_MISMATCH");
const saved=snapshotRows.map(r=>r.slice());snapshotRows=[snapshotHeaders,...saved.slice(1).map(r=>r.slice())];snapshotRows[1][3]="INST-OTHER";assert.equal(context.api.build(institutionalBase,spreadsheet,schema).code,"DEPARTMENT_IMPORT_TENANT_MISMATCH");
snapshotRows=[snapshotHeaders,saved[1].slice()];assert.equal(context.api.build(institutionalBase,spreadsheet,schema).code,"DEPARTMENT_IMPORT_ROW_SNAPSHOT_INCOMPLETE");
snapshotRows=[snapshotHeaders,...saved.slice(1).map(r=>r.slice())];snapshotRows[2][6]="REVOKED";assert.equal(context.api.build(institutionalBase,spreadsheet,schema).code,"DEPARTMENT_IMPORT_ROW_SNAPSHOT_UNVERIFIED");
snapshotRows=[snapshotHeaders,...saved.slice(1).map(r=>r.slice())];snapshotRows.push(snapshotRows[1].slice());assert.equal(context.api.build(institutionalBase,spreadsheet,schema).code,"DEPARTMENT_IMPORT_ROW_SNAPSHOT_INCOMPLETE");
snapshotRows=[snapshotHeaders,...saved.slice(1).map(r=>r.slice())];institutionalImportPermission=false;assert.equal(context.api.build(institutionalBase,spreadsheet,schema).code,"DEPARTMENT_IMPORT_INSTITUTION_WIDE_UNAUTHORIZED");institutionalImportPermission=true;
assignmentRows=[assignmentHeaders,["ASG-1","U-1","Director","DEPARTAMENTO",'["DEP-A","DEP-B"]',"Activo","U-ADMIN","","","","No","","INST-1","MEM-1","RESP-1"]];
console.log("Accounting departmental import scope: 40 scenarios passed.");
