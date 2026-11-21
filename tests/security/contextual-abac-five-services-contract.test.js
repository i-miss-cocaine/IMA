"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

const services = [
  ["USER", "backend/user-service/Code.gs"],
  ["ACADEMIC", "backend/academic-service/Code.gs"],
  ["TASK", "backend/task-service/Code.gs"],
  ["EXAM", "backend/exam-service/Code.gs"]
];

for (const [service, path] of services) {
  const source = fs.readFileSync(path, "utf8");
  new vm.Script(source, { filename: path });
  const fn = extractFunction(source, "validateContextualAccess");
  const runtime = {
    getGuardianStudents: () => ({ data: [] }),
    SpreadsheetApp: { openById: () => ({}) },
    getVerifiedAcademicDepartmentScope_: () => ({ authorized: true, institutionWide: false, scopes: [] }),
    getAcademicAreaCoordinationScope: () => ({ status: "success", scopes: [] }),
    Date, Number, String, Object, Array
  };
  vm.createContext(runtime);
  vm.runInContext(fn + "\nthis.check = validateContextualAccess;", runtime);
  const check = runtime.check;
  assert.equal(check("read", {}, "", "Administrador").authorized, false, service + ": privileged role without verified identity must deny");
  assert.equal(check("read", {}, "U-1", "").authorized, false, service + ": missing role must deny");
  assert.equal(check("read", { studentId: "U-2" }, "", "Estudiante").authorized, false, service + ": target with missing identity must deny");
  assert.equal(check("read", { studentId: "U-2" }, "U-1", "Estudiante").authorized, false, service + ": cross-student access must deny");
  assert.equal(check("read", { studentId: "U-1" }, "U-1", "Estudiante").authorized, true, service + ": own-student access remains compatible");
  assert.equal(check("read", {}, "ADMIN-1", "Administrador").authorized, true, service + ": verified administrator retains access");
  assert.equal(check("read", {}, "DEV-1", "Desarrollador").authorized, true, service + ": verified developer retains access");
}

const userSource = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const userFn = extractFunction(userSource, "validateContextualAccess");
let guardianRequest = null;
const guardianRuntime = {
  getGuardianStudents(payload) {
    guardianRequest = payload;
    return { data: [{ studentUserId: "STUDENT-1", permisos: {} }] };
  },
  Date, Number, String, Object, Array
};
vm.createContext(guardianRuntime);
vm.runInContext(userFn + "\nthis.check = validateContextualAccess;", guardianRuntime);
const guardianDecision = guardianRuntime.check("getStudentRecords",
  { studentId: "STUDENT-1", sessionToken: "signed-token" }, "GUARDIAN-1", "Padre");
assert.equal(guardianDecision.authorized, true, "verified guardian can access a linked student");
assert.equal(guardianRequest.sessionToken, "signed-token", "guardian relationship lookup must carry the verified session");
assert.equal(guardianRequest._verifiedUserId, "GUARDIAN-1");
guardianRuntime.getGuardianStudents = () => ({ data: [] });
const unlinkedDecision = guardianRuntime.check("getStudentRecords",
  { studentId: "STUDENT-2", sessionToken: "signed-token" }, "GUARDIAN-1", "Tutor");
assert.equal(unlinkedDecision.authorized, false, "unlinked guardian-student relationship must deny");

assert.match(userSource,
  /getGuardianStudents\(\{ userIdResponsable: uid, sessionToken: payload && \(payload\.sessionToken \|\| payload\.authToken \|\| payload\.token\) \}\)/,
  "family consolidated summary must propagate the authenticated session to its relationship lookup");

const accountingSource = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
new vm.Script(accountingSource, { filename: "backend/accounting-service/Code.gs" });
const accountingIdentityFn = extractFunction(accountingSource, "getVerifiedAccountingIdentity_");
const accountingRuntime = {
  requestAccountingUserAuthorization_: () => ({
    status: "success", authorized: true, userId: "U-1", role: "Director", institutionId: "INST-1"
  }),
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "IMA_INSTITUTION_ID" ? "INST-1" : "" }) },
  String
};
vm.createContext(accountingRuntime);
vm.runInContext(accountingIdentityFn + "\nthis.resolve = getVerifiedAccountingIdentity_;", accountingRuntime);
assert.equal(accountingRuntime.resolve({}).authorized, false, "ACCOUNTING rejects missing session token");
assert.equal(accountingRuntime.resolve({ sessionToken: "token" }).authorized, true, "ACCOUNTING accepts a verified institution-bound identity");
accountingRuntime.requestAccountingUserAuthorization_ = () => ({
  status: "success", authorized: true, userId: "U-1", role: "Director", institutionId: "OTHER"
});
assert.equal(accountingRuntime.resolve({ sessionToken: "token" }).authorized, false, "ACCOUNTING rejects another institution");


function sheet(rows) {
  return { getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
}
const familyRows = [
  ["RelacionID","ExpedienteID","ResponsableID","Parentesco","EstadoAutorizacion","FechaInicio","FechaFin","Observaciones","PermisosJSON"],
  ["R1","EXP-1","GUARDIAN-1","Madre","Activa","2020-01-01","2099-12-31","", "{\"permisoAcademico\":true}"],
  ["R2","EXP-2","GUARDIAN-1","Madre","Activa","2099-01-01","2099-12-31","", "{\"permisoAcademico\":true}"],
  ["R3","EXP-3","GUARDIAN-1","Madre","Activa","2020-01-01","2020-12-31","", "{\"permisoAcademico\":true}"],
  ["R4","EXP-4","GUARDIAN-1","Madre","Activa","invalid-date","2099-12-31","", "{\"permisoAcademico\":true}"],
  ["R5","EXP-5","GUARDIAN-1","Madre","Activa","2020-01-01","2099-12-31","", "{\"permisoAcademico\":false}"],
  ["R6","EXP-6","GUARDIAN-1","Madre","Activa","2020-01-01","2099-12-31","", "{bad-json"]
];
const expedienteRows = [["ExpedienteID","UserID"],["EXP-1","STU-1"],["EXP-2","STU-2"],["EXP-3","STU-3"],["EXP-4","STU-4"],["EXP-5","STU-5"]];
const userRows = [["UserId","Nombre","Grado","Seccion","Email","Unused","Rol","Telefono","Unused2","PersonaID","Estado"],
  ["STU-1","Student 1","1","A","","","Estudiante","","","P-1","Activa"],
  ["STU-2","Student 2","1","A","","","Estudiante","","","P-2","Activa"],
  ["STU-3","Student 3","1","A","","","Estudiante","","","P-3","Activa"],
  ["STU-4","Student 4","1","A","","","Estudiante","","","P-4","Activa"],
  ["STU-5","Student 5","1","A","","","Estudiante","","","P-5","Activa"],
  ["STU-6","Student 6","1","A","","","Estudiante","","","P-6","Activa"]];
const legacyRows = [["RelacionID","ExpedienteID","ResponsableID","","","","","","","Estado"],
  ["L1","STU-LEGACY","GUARDIAN-1","","","","","","","Activa"]];

const userGuardianFn = extractFunction(userSource, "getGuardianStudents");
const userSheets = {
  ExpedientesEstudiantes: sheet(expedienteRows),
  Usuarios: sheet(userRows),
  RelacionesFamiliares: sheet(familyRows),
  RelacionesEstudianteTutor: sheet(legacyRows)
};
const userGuardianRuntime = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: (_ss, name) => userSheets[name],
  getUserVerifiedRole: payload => { payload._verifiedUserId = "GUARDIAN-1"; return "Padre"; },
  Date, String, Number, Object, Array, JSON
};
vm.createContext(userGuardianRuntime);
vm.runInContext(userGuardianFn + "\nthis.lookup = getGuardianStudents;", userGuardianRuntime);
const userGuardianResult = userGuardianRuntime.lookup({ sessionToken: "signed" });
assert.deepEqual(Array.from(userGuardianResult.data, row => row.studentUserId), ["STU-1","STU-5"],
  "USER includes current relationships, preserves explicit granular permissions and never falls back to legacy after primary rows exist");
familyRows.push(["R1","EXP-2","GUARDIAN-1","Madre","Activa","2020-01-01","2099-12-31","","{\"permisoAcademico\":true}"]);
assert.deepEqual(Array.from(userGuardianRuntime.lookup({ sessionToken: "signed" }).data, row => row.studentUserId), ["STU-5"],
  "USER excludes a guardian relationship when its ID is duplicated across active records");
familyRows.pop();
assert.equal(userGuardianResult.data.find(row => row.studentUserId === "STU-5").permisos.permisoAcademico, false,
  "USER preserves explicit academic denial for downstream contextual checks");

const taskSource = fs.readFileSync("backend/task-service/Code.gs", "utf8");
const taskGuardianFn = extractFunction(taskSource, "getTaskServiceGuardianStudentIds");
const taskRuntime = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById: () => ({ getSheetByName: name =>
    name === "ExpedientesEstudiantes" ? sheet(expedienteRows) :
      (name === "RelacionesFamiliares" ? sheet(familyRows) : null)
  }) },
  Date, String, Number, Object, Array, JSON
};
vm.createContext(taskRuntime);
vm.runInContext(taskGuardianFn + "\nthis.lookup = getTaskServiceGuardianStudentIds;", taskRuntime);
assert.deepEqual(Array.from(taskRuntime.lookup("GUARDIAN-1")), ["STU-1"],
  "TASK excludes future, expired, malformed and academically restricted family relations");
familyRows.push(["R1","EXP-2","GUARDIAN-1","Madre","Activa","2020-01-01","2099-12-31","","{\"permisoAcademico\":true}"]);
assert.deepEqual(Array.from(taskRuntime.lookup("GUARDIAN-1")), [],
  "TASK denies ambiguous duplicate relationship IDs instead of deduplicating them into a grant");
familyRows.pop();

const duplicateExpedienteRows = expedienteRows.concat([expedienteRows[1]]);
const duplicateMappingTaskRuntime = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById: () => ({ getSheetByName: name =>
    name === "ExpedientesEstudiantes" ? sheet(duplicateExpedienteRows) :
      (name === "RelacionesFamiliares" ? sheet(familyRows) : null)
  }) },
  Date, String, Number, Object, Array, JSON
};
vm.createContext(duplicateMappingTaskRuntime);
vm.runInContext(taskGuardianFn + "\nthis.lookup = getTaskServiceGuardianStudentIds;", duplicateMappingTaskRuntime);
assert.deepEqual(Array.from(duplicateMappingTaskRuntime.lookup("GUARDIAN-1")), [],
  "TASK denies ambiguous expediente-to-student mappings");
const missingExpedienteTaskRuntime = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById: () => ({ getSheetByName: name =>
    name === "RelacionesFamiliares" ? sheet(familyRows) : null
  }) },
  Date, String, Number, Object, Array, JSON
};
vm.createContext(missingExpedienteTaskRuntime);
vm.runInContext(taskGuardianFn + "\nthis.lookup = getTaskServiceGuardianStudentIds;", missingExpedienteTaskRuntime);
assert.deepEqual(Array.from(missingExpedienteTaskRuntime.lookup("GUARDIAN-1")), [],
  "TASK fails closed when expediente ownership source is unavailable");

const examSource = fs.readFileSync("backend/exam-service/Code.gs", "utf8");
const examGuardianFn = extractFunction(examSource, "getVerifiedGuardianStudentIds_");
const examRuntime = {
  Date, String, Number, Object, Array, JSON
};
vm.createContext(examRuntime);
vm.runInContext(examGuardianFn + "\nthis.lookup = getVerifiedGuardianStudentIds_;", examRuntime);
const examSheets = { getSheetByName: name =>
  name === "ExpedientesEstudiantes" ? sheet(expedienteRows) :
    (name === "RelacionesFamiliares" ? sheet(familyRows) : null)
};
assert.deepEqual(Array.from(examRuntime.lookup(examSheets, "GUARDIAN-1")), ["STU-1"],
  "EXAM excludes future, expired and malformed family relations while preserving its documented relation-permission semantics");
familyRows.push(["R1","EXP-2","GUARDIAN-1","Madre","Activa","2020-01-01","2099-12-31","","{\"permisoAcademico\":true}"]);
assert.deepEqual(Array.from(examRuntime.lookup(examSheets, "GUARDIAN-1")), [],
  "EXAM denies ambiguous duplicate relationship IDs instead of deduplicating them into a grant");
familyRows.pop();

const duplicateExamMappingSheets = {
  getSheetByName: name => name === "ExpedientesEstudiantes" ? sheet(duplicateExpedienteRows) :
    (name === "RelacionesFamiliares" ? sheet(familyRows) : null)
};
assert.deepEqual(Array.from(examRuntime.lookup(duplicateExamMappingSheets, "GUARDIAN-1")), [],
  "EXAM denies ambiguous expediente-to-student mappings");

const legacyExamRows = [
  ["RelacionID","ExpedienteID","ResponsableID","","","","","","Portal","Estado"],
  ["LEG-1","STU-BLOCKED","GUARDIAN-1","","","","","","NO","Activa"],
  ["LEG-2","STU-LEGACY","GUARDIAN-1","","","","","","SI","Verificada"]
];
const legacyExamSheets = {
  getSheetByName: name => name === "ExpedientesEstudiantes" ? sheet([expedienteRows[0]]) :
    (name === "RelacionesFamiliares" ? sheet([familyRows[0]]) :
      (name === "RelacionesEstudianteTutor" ? sheet(legacyExamRows) : null))
};
assert.deepEqual(Array.from(examRuntime.lookup(legacyExamSheets, "GUARDIAN-1")), ["STU-LEGACY"],
  "EXAM legacy fallback requires active relationship and portal permission");
const duplicateLegacyExamSheets = {
  getSheetByName: name => name === "ExpedientesEstudiantes" ? sheet([expedienteRows[0]]) :
    (name === "RelacionesFamiliares" ? sheet([familyRows[0]]) :
      (name === "RelacionesEstudianteTutor" ? sheet(legacyExamRows.concat([legacyExamRows[2]])) : null))
};
assert.deepEqual(Array.from(examRuntime.lookup(duplicateLegacyExamSheets, "GUARDIAN-1")), [],
  "EXAM legacy fallback denies duplicate relationship records");

const accountingFamilyUsers = [
  ["UserId","PersonaID","Rol","Estado","Unused5","Unused6","Unused7","Unused8","Unused9","Unused10"],
  ["GUARDIAN-1","PERSON-G","Padre","Activo","","","","","",""],
  ["STU-1","PERSON-S1","Estudiante","Activo","","","","","",""],
  ["STU-2","PERSON-S2","Estudiante","Activo","","","","","",""],
  ["STU-3","PERSON-S3","Estudiante","Activo","","","","","",""],
  ["STU-4","PERSON-S4","Estudiante","Activo","","","","","",""]
];
const accountingFamilyRelations = [
  ["RelacionID","PersonaEstudianteID","PersonaResponsableID","TipoRelacion","Estado","FechaInicio","FechaFin","VerificadaPor","FechaVerificacion","EstadoAutorizacion"],
  ["R1","PERSON-S1","PERSON-G","Madre","Activo","2020-01-01","2099-12-31","","","Activo"],
  ["R2","PERSON-S2","PERSON-G","Madre","Activo","2099-01-01","2099-12-31","","","Activo"],
  ["R3","PERSON-S3","PERSON-G","Madre","Activo","2020-01-01","2020-12-31","","","Activo"],
  ["R4","PERSON-S4","PERSON-G","Madre","Activo","invalid-date","2099-12-31","","","Activo"]
];
const familyCreditFn = extractFunction(accountingSource, "familyCreditGetActiveStudentUserIdsForGuardian_");
const familyCreditRuntime = {
  institutionalServiceRoleKey_: role => String(role || "").toLowerCase(),
  Date, String, Number, Object, Array
};
vm.createContext(familyCreditRuntime);
vm.runInContext(familyCreditFn + "\nthis.lookup = familyCreditGetActiveStudentUserIdsForGuardian_;", familyCreditRuntime);
const familyCreditSheetSet = {
  getSheetByName: name => name === "Usuarios" ? sheet(accountingFamilyUsers) :
    (name === "RelacionesFamiliares" ? sheet(accountingFamilyRelations) : null)
};
assert.deepEqual(Array.from(familyCreditRuntime.lookup(familyCreditSheetSet, "GUARDIAN-1")), ["STU-1"],
  "ACCOUNTING family-credit scope rejects future, expired and malformed relationship windows");

accountingFamilyRelations.push(["R1","PERSON-S2","PERSON-G","Madre","Activo","2020-01-01","2099-12-31","","","Activo"]);
assert.deepEqual(Array.from(familyCreditRuntime.lookup(familyCreditSheetSet, "GUARD-1")), [],
  "ACCOUNTING denies duplicate active relationship IDs instead of collapsing them into a grant");
accountingFamilyRelations.pop();

const transportUsers = [
  ["UserId","Rol","PersonaID","Estado"],
  ["STU-1","Estudiante","PERSON-S1","Activo"],
  ["STU-2","Estudiante","PERSON-S2","Activo"],
  ["STU-3","Estudiante","PERSON-S3","Activo"],
  ["STU-4","Estudiante","PERSON-S4","Activo"],
  ["GUARDIAN-1","Tutor","PERSON-G","Activo"]
];
const transportFunctions = [
  "institutionalServiceRoleKey_", "serviceFamilyHeaderIndex_", "serviceFamilyRelationIsActive_", "serviceStudentGuardianIds_"
].map(name => extractFunction(accountingSource, name));
const transportRuntime = { Date, String, Number, Object, Array, Set, JSON };
vm.createContext(transportRuntime);
vm.runInContext(transportFunctions.join("\n") + "\nthis.lookup = serviceStudentGuardianIds_;", transportRuntime);
const transportSheetSet = {
  getSheetByName: name => name === "Usuarios" ? sheet(transportUsers) :
    (name === "RelacionesFamiliares" ? sheet(accountingFamilyRelations) : null)
};
assert.deepEqual(Array.from(transportRuntime.lookup(transportSheetSet, "STU-1")), ["PERSON-G"],
  "ACCOUNTING transport guardian scope rejects malformed, future and expired relationships");

const jointFamilyFn = extractFunction(accountingSource, "assertJointFamilyVoucherOwnerAccess_");
const jointFamilyRuntime = {
  getVerifiedAccountingIdentity_: () => ({ authorized: true, userId: "GUARDIAN-1", role: "Tutor" }),
  normalizeVacationRole_: role => String(role || "").toLowerCase(),
  getAccountingPersonIdForUser_: (_ss, userId) => userId === "GUARDIAN-1" ? "PERSON-G" : (userId === "STU-1" ? "PERSON-S1" : ""),
  Date, String, Number, Object, Array
};
vm.createContext(jointFamilyRuntime);
vm.runInContext(jointFamilyFn + "\nthis.check = assertJointFamilyVoucherOwnerAccess_;", jointFamilyRuntime);
const jointRelations = [
  ["RelacionID","PersonaEstudianteID","PersonaResponsableID","EstadoAutorizacion","FechaInicio","FechaFin"],
  ["R1","PERSON-S1","PERSON-G","Activo","2020-01-01","2099-12-31"]
];
const jointSheetSet = { getSheetByName: () => sheet(jointRelations) };
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, true,
  "ACCOUNTING joint family owner accepts one active linked relationship");
for (const [start,end] of [["2099-01-01","2099-12-31"],["2020-01-01","2020-12-31"],["invalid-date","2099-12-31"]]) {
  const invalidSheet = { getSheetByName: () => sheet([
    jointRelations[0], ["R2","PERSON-S1","PERSON-G","Activo",start,end]
  ]) };
  assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, invalidSheet, "STU-1").authorized, false,
    "ACCOUNTING joint family owner denies invalid or inactive relationship dates");
}

process.stdout.write("contextual-abac-five-services-contract: all assertions passed\n");
