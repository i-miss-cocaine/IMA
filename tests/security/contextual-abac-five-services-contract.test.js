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
const userFn = [extractFunction(userSource, "getGuardianPermissionKeyForAction_"), extractFunction(userSource, "validateContextualAccess")].join(String.fromCharCode(10));
let guardianRequest = null;
const guardianRuntime = {
  getGuardianStudents(payload) {
    guardianRequest = payload;
    return { status: "success", data: [{ studentUserId: "STUDENT-1", permisos: { permisoAcademico: true } }] };
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
guardianRuntime.getGuardianStudents = () => ({ status: "success", data: [] });
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
const primaryRowsSnapshot = familyRows.splice(1);
const legacyOnlyResult = userGuardianRuntime.lookup({ sessionToken: "signed" });
assert.equal(legacyOnlyResult.data.length, 1, "USER preserves a unique legacy guardian relation for non-domain metadata");
assert.equal(legacyOnlyResult.data[0].permisos.permisoAcademico, false, "USER legacy relationships do not infer academic permission");
legacyRows.push(legacyRows[1].slice());
assert.deepEqual(Array.from(userGuardianRuntime.lookup({ sessionToken: "signed" }).data), [],
  "USER rejects duplicate legacy relationship identities instead of returning an ambiguous grant");
legacyRows.pop();
familyRows.push(...primaryRowsSnapshot);

const guardianPolicyCode = [
  extractFunction(userSource, "getGuardianPermissionKeyForAction_"),
  extractFunction(userSource, "validateContextualAccess")
].join(String.fromCharCode(10));
const guardianPolicyRuntime = {
  getGuardianStudents: payload => userGuardianRuntime.lookup(payload),
  Date, String, Number, Object, Array
};
vm.createContext(guardianPolicyRuntime);
vm.runInContext(guardianPolicyCode + "\nthis.check = validateContextualAccess;", guardianPolicyRuntime);
assert.equal(guardianPolicyRuntime.check("getStudentAcademicReport", { studentId: "STU-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, true,
  "USER allows a guardian only when the linked relationship explicitly grants the requested academic domain");
assert.equal(guardianPolicyRuntime.check("enrollStudentInExtracurricular",
  { estudianteUserId: "STU-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, true,
  "USER maps extracurricular enrollment to the explicit academic relationship permission");
assert.equal(guardianPolicyRuntime.check("enrollStudentInExtracurricular",
  { estudianteUserId: "STU-2", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, false,
  "USER denies extracurricular enrollment for a student outside the verified guardian relationship");
const unclassifiedGuardianDecision = guardianPolicyRuntime.check("customStudentResourceAction",
  { studentId: "STU-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre");
assert.equal(unclassifiedGuardianDecision.authorized, false,
  "USER denies guardian access when a student resource action has no explicit domain classification");
assert.equal(unclassifiedGuardianDecision.reason, "GUARDIAN_DOMAIN_PERMISSION_UNCLASSIFIED",
  "unclassified guardian actions fail closed before resource access");
assert.equal(guardianPolicyRuntime.check("getPaymentVouchers", { studentId: "STU-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, false,
  "USER denies a financial action when the relationship omits its financial permission");
assert.equal(guardianPolicyRuntime.check("getStudentAcademicReport", { expedienteId: "EXP-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, true,
  "USER resolves an expediente selector against the linked student's authoritative relationship");
familyRows[1][8] = "";
const missingPermissionResult = userGuardianRuntime.lookup({ sessionToken: "signed" });
assert.equal(missingPermissionResult.data.find(row => row.studentUserId === "STU-1").permisos.permisoAcademico, false,
  "USER treats an absent permission document as deny, not implicit allow");
assert.equal(guardianPolicyRuntime.check("getStudentAcademicReport", { studentId: "STU-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, false,
  "USER denies academic access when the primary relationship has no explicit domain permission");
assert.equal(guardianPolicyRuntime.check("getStudentAcademicReport",
  { userId: "GUARDIAN-1", expedienteId: "EXP-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, false,
  "USER must resolve the student expediente even when payload.userId contains the guardian's own identity");
familyRows[1][8] = "{\"permisoAcademico\":true,\"permisoFinanciero\":true}";
assert.equal(guardianPolicyRuntime.check("getPaymentVouchers", { studentId: "STU-1", sessionToken: "signed" }, "GUARDIAN-1", "Padre").authorized, true,
  "USER allows financial access only after the financial permission is explicitly granted");

const guardianDomainPermissionFn = extractFunction(userSource, "hasExplicitGuardianDomainPermission_");
const guardianDomainPermissionRuntime = {};
vm.createContext(guardianDomainPermissionRuntime);
vm.runInContext(guardianDomainPermissionFn + "\nthis.check = hasExplicitGuardianDomainPermission_;", guardianDomainPermissionRuntime);
assert.equal(guardianDomainPermissionRuntime.check({ permisos: { permisoFinanciero: true } }, "permisoFinanciero"), true);
assert.equal(guardianDomainPermissionRuntime.check({ permisos: { permisoFinanciero: false } }, "permisoFinanciero"), false);
assert.equal(guardianDomainPermissionRuntime.check({ permisos: {} }, "permisoFinanciero"), false,
  "missing domain permissions must not grant family financial access");
assert.equal(guardianDomainPermissionRuntime.check({ permisos: { permisoFinanciero: "true" } }, "permisoFinanciero"), false,
  "string booleans must not grant family financial access");
assert.equal(guardianDomainPermissionRuntime.check({ permisos: [] }, "permisoFinanciero"), false);
assert(extractFunction(userSource, "getFamilyConsolidatedSummary").includes('hasExplicitGuardianDomainPermission_(s, "permisoFinanciero")'),
  "family summary applies explicit financial permission");
assert(extractFunction(userSource, "resolveVerifiedRequestSubmitter_").includes("hasExplicitGuardianDomainPermission_(linkedMatches[0], permissionKey)"),
  "family requests require explicit permission for their domain");
assert(extractFunction(userSource, "getAdministrativeRequestAttachment").includes('hasExplicitGuardianDomainPermission_(linkedMatches[0], "permisoDocumental")'),
  "guardian document attachments require explicit document permission");



const guardianApplicantFn = extractFunction(userSource, "getGuardianApplicants");
const applicantRows = [
  ["SolicitudID","Fecha","Ano","Grado","Nombres","Apellidos","Identificacion","Nacimiento","Responsable","Telefono","Email","Estado","Canal","Observaciones","ExpedienteID"],
  ["APP-OWNED",new Date(),"2027","1","Applicant","Owned","","","Guardian G1","","guardian@example.test","Pendiente","Online","",""],
  ["APP-NAME-SUBSTRING",new Date(),"2027","1","Applicant","Other","","","G1 Household","","other@example.test","Pendiente","Online","",""],
  ["APP-OTHER",new Date(),"2027","1","Applicant","Other","","","Other Guardian","","other@example.test","Pendiente","Online","",""]
];
const applicantUsers = [
  ["UserId","Nombre","","","","","Rol","","","PersonaID","Estado"],
  ["GUARDIAN-1","Guardian","","","guardian@example.test","","Padre","","","PERSON-G1","Activo"],
  ["OTHER-1","Other","","","other@example.test","","Padre","","","PERSON-O1","Activo"]
];
const applicantSheets = {
  Usuarios: { getDataRange: () => ({ getValues: () => applicantUsers.map(row => row.slice()) }) },
  SolicitudesAdmision: { getDataRange: () => ({ getValues: () => applicantRows.map(row => row.slice()) }) }
};
const applicantRuntime = {
  SPREADSHEET_ID: "TEST",
  getUserVerifiedRole: () => "Padre",
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: (_ss, name) => applicantSheets[name],
  Date, String, Number, Object, Array
};
vm.createContext(applicantRuntime);
vm.runInContext(guardianApplicantFn + "\nthis.lookup = getGuardianApplicants;", applicantRuntime);
const ownedApplicants = applicantRuntime.lookup({ _verifiedUserId: "GUARDIAN-1", userId: "OTHER-1" });
assert.deepEqual(Array.from(ownedApplicants.data, row => row.solicitudId), ["APP-OWNED"],
  "guardian applicants are filtered by the exact email on the verified account, not a name substring or payload identity");
applicantRuntime.getUserVerifiedRole = () => "Estudiante";
assert.throws(() => applicantRuntime.lookup({ _verifiedUserId: "GUARDIAN-1" }), /GUARDIAN_ROLE_REQUIRED/,
  "non-guardian roles cannot use guardian applicant ownership lookup");

let familyScholarshipLockAvailable = true, familyScholarshipLockReleases = 0;
const familyScholarshipRuntime = {
  LockService: { getScriptLock: () => ({
    tryLock: () => familyScholarshipLockAvailable,
    releaseLock: () => { familyScholarshipLockReleases++; }
  }) },
  getUserVerifiedRole: payload => { payload._verifiedUserId = "GUARDIAN-1"; return "Padre"; },
  getGuardianStudents: () => ({ status: "success", data: [
    { userId: "STU-1", studentUserId: "STU-1", permisos: { permisoFinanciero: true } },
    { userId: "STU-2", studentUserId: "STU-2", permisos: { permisoFinanciero: false } },
    { userId: "STU-3", studentUserId: "STU-3", permisos: { permisoFinanciero: true } }
  ] }),
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: () => familyScholarshipSheet,
  SPREADSHEET_ID: "TEST", Date, String, Number, Object, Array, JSON
};
const familyScholarshipRows = [
  ["SolicitudID","ResponsableID","EstudiantesIDs","Tipo","Alcance","Motivo","Monto","Estado","Fecha","Observaciones"],
  ["B-1","GUARDIAN-1","STU-1, STU-3","Beca","Familiar","Motivo","Por evaluar","Pendiente",new Date(),""],
  ["B-2","OTHER-USER","STU-1","Beca","Familiar","Otro","Por evaluar","Pendiente",new Date(),""],
  ["B-3","GUARDIAN-1","STU-2","Beca","Familiar","No permitido","Por evaluar","Pendiente",new Date(),""],
  ["B-4","GUARDIAN-1","Todos","Beca","Familiar","Todos","Por evaluar","Pendiente",new Date(),""]
];
const familyScholarshipSheet = {
  getDataRange: () => ({ getValues: () => familyScholarshipRows.map(row => row.slice()) }),
  appendRow: row => familyScholarshipRows.push(row.slice())
};
const familyScholarshipFns = [
  extractFunction(userSource, "hasExplicitGuardianDomainPermission_"),
  extractFunction(userSource, "resolveVerifiedRequestSubmitter_"),
  extractFunction(userSource, "getVerifiedGuardianFinancialStudentIds_"),
  extractFunction(userSource, "normalizeGuardianFinancialStudentIds_"),
  extractFunction(userSource, "getFamilyScholarships"),
  extractFunction(userSource, "submitFamilyScholarshipApplication")
].join(String.fromCharCode(10));
vm.createContext(familyScholarshipRuntime);
vm.runInContext(familyScholarshipFns + "\nthis.read=getFamilyScholarships; this.submit=submitFamilyScholarshipApplication;", familyScholarshipRuntime);
const scholarshipList = familyScholarshipRuntime.read({ sessionToken: "signed", userIdResponsable: "OTHER-USER" });
assert.deepEqual(Array.from(scholarshipList.data, row => row.solicitudId), ["B-1","B-4"],
  "family scholarship reads are owner-bound and hide applications for children without current financial permission");
assert.equal(scholarshipList.data.find(row => row.solicitudId === "B-4").estudiantesIds, "STU-1, STU-3",
  "family-wide scholarship reads disclose only currently permitted student IDs");
assert.throws(() => familyScholarshipRuntime.submit({
  sessionToken: "signed", userIdResponsable: "OTHER-USER", estudiantesIds: ["STU-1"], tipoBeneficio: "Beca", motivo: "Test"
}), /VERIFIED_IDENTITY_MISMATCH/,
  "family scholarship submission cannot spoof another guardian identity");
assert.throws(() => familyScholarshipRuntime.submit({
  sessionToken: "signed", estudiantesIds: ["STU-1","STU-2"], tipoBeneficio: "Beca", motivo: "Test"
}), /FAMILY_FINANCIAL_SCOPE_DENIED/,
  "family scholarship submission requires explicit financial permission for every student");
familyScholarshipRuntime.submit({
  sessionToken: "signed", estudiantesIds: "Todos", tipoBeneficio: "Beca", motivo: "Test"
});
assert.equal(familyScholarshipRows[familyScholarshipRows.length-1][1], "GUARDIAN-1",
  "family scholarship records bind to the verified guardian identity");
assert.equal(familyScholarshipRows[familyScholarshipRows.length-1][2], "STU-1, STU-3",
  "family-wide scholarship submission expands only to explicitly permitted students");
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
assert.deepEqual(Array.from(examRuntime.lookup(legacyExamSheets, "GUARDIAN-1")), [],
  "EXAM legacy relationships without explicit academic-domain permission fail closed");
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
  ["RelacionID","PersonaEstudianteID","PersonaResponsableID","TipoRelacion","Estado","FechaInicio","FechaFin","VerificadaPor","FechaVerificacion","EstadoAutorizacion","PermisoFinanciero"],
  ["R1","PERSON-S1","PERSON-G","Madre","Activo","2020-01-01","2099-12-31","","","Activo",true],
  ["R2","PERSON-S2","PERSON-G","Madre","Activo","2099-01-01","2099-12-31","","","Activo",true],
  ["R3","PERSON-S3","PERSON-G","Madre","Activo","2020-01-01","2020-12-31","","","Activo",true],
  ["R4","PERSON-S4","PERSON-G","Madre","Activo","invalid-date","2099-12-31","","","Activo",true]
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

accountingFamilyRelations.push(["R1","PERSON-S2","PERSON-G","Madre","Activo","2020-01-01","2099-12-31","","","Activo",true]);
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
  ["RelacionID","PersonaEstudianteID","PersonaResponsableID","EstadoAutorizacion","FechaInicio","FechaFin","PermisoFinanciero","PermisosJSON"],
  ["R1","PERSON-S1","PERSON-G","Activo","2020-01-01","2099-12-31",true,""]
];
const jointSheetSet = { getSheetByName: () => sheet(jointRelations) };
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, true,
  "ACCOUNTING joint family owner accepts one active linked relationship");

const jointPermissionRow = jointRelations[1].slice();
jointRelations[1][6] = "";
jointRelations[1][7] = "";
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, false,
  "ACCOUNTING joint family owner requires an explicit financial grant");
jointRelations[1][7] = '{"permisoFinanciero":true}';
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, true,
  "ACCOUNTING accepts an explicit JSON financial grant");
jointRelations[1][7] = '{"permisoFinanciero":"true"}';
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, false,
  "ACCOUNTING rejects string financial booleans");
jointRelations[1][6] = false;
jointRelations[1][7] = '{"permisoFinanciero":true}';
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, false,
  "ACCOUNTING direct financial denial overrides a JSON grant");
jointRelations[1].splice(0, jointRelations[1].length, ...jointPermissionRow);
jointRelations.push(["R1","PERSON-S2","PERSON-G","Activo","2020-01-01","2099-12-31",true,""]);
assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, jointSheetSet, "STU-1").authorized, false,
  "ACCOUNTING denies duplicate relation IDs across different student targets");
jointRelations.pop();
for (const [start,end] of [["2099-01-01","2099-12-31"],["2020-01-01","2020-12-31"],["invalid-date","2099-12-31"]]) {
  const invalidSheet = { getSheetByName: () => sheet([
    jointRelations[0], ["R2","PERSON-S1","PERSON-G","Activo",start,end,true,""]
  ]) };
  assert.equal(jointFamilyRuntime.check({ sessionToken: "signed" }, invalidSheet, "STU-1").authorized, false,
    "ACCOUNTING joint family owner denies invalid or inactive relationship dates");
}


const guardianSubmitterRuntime = {
  getUserVerifiedRole: () => "Tutor",
  getGuardianStudents: () => ({ status: "success", data: [
    { studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoAcademico: true } }
  ] })
};
vm.createContext(guardianSubmitterRuntime);
vm.runInContext(
  guardianDomainPermissionFn + "\n" +
  extractFunction(userSource, "resolveVerifiedRequestSubmitter_") +
  "\nthis.resolve = resolveVerifiedRequestSubmitter_;",
  guardianSubmitterRuntime
);
assert.throws(
  () => guardianSubmitterRuntime.resolve({ _verifiedUserId: "GUARDIAN-1" }, "STU-1", true, "permisoFinanciero"),
  /GUARDIAN_DOMAIN_PERMISSION_DENIED/,
  "USER must not infer financial permission from an academic-only guardian grant"
);
assert.throws(
  () => guardianSubmitterRuntime.resolve({ _verifiedUserId: "GUARDIAN-1" }, "STU-1", true, ""),
  /GUARDIAN_DOMAIN_PERMISSION_UNCLASSIFIED/,
  "USER guardian request must have an explicit action-to-domain binding"
);
guardianSubmitterRuntime.getGuardianStudents = () => ({ status: "success", data: [
  { studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoFinanciero: true } },
  { studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoFinanciero: true } }
] });
assert.throws(
  () => guardianSubmitterRuntime.resolve({ _verifiedUserId: "GUARDIAN-1" }, "STU-1", true, "permisoFinanciero"),
  /GUARDIAN_STUDENT_SCOPE_DENIED/,
  "USER must deny duplicate guardian target resolutions"
);
guardianSubmitterRuntime.getGuardianStudents = () => ({ status: "success", data: [
  { studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoFinanciero: true } }
] });
assert.equal(
  guardianSubmitterRuntime.resolve({ _verifiedUserId: "GUARDIAN-1" }, "STU-1", true, "permisoFinanciero").estudianteId,
  "STU-1",
  "USER allows guardian request when exact target and exact domain are uniquely verified"
);

const familySummaryRuntime = {
  getUserVerifiedRole: () => "Tutor",
  getGuardianStudents: () => ({ status: "success", data: [{
    userId: "STU-1", studentUserId: "STU-1", nombre: "Student 1", permisos: { permisoAcademico: true }
  }] }),
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: (_ss, name) => sheet(name === "CargosEstudiante"
    ? [["ID","StudentID","","","Monto","","Estado"],["C-1","STU-1","","",250,"","Pendiente"]]
    : [["ID","StudentID","","","","Monto","","","","Estado"]]),
  SPREADSHEET_ID: "TEST", Date, String, Number, Object, Array, JSON, parseFloat
};
vm.createContext(familySummaryRuntime);
vm.runInContext(
  guardianDomainPermissionFn + "\n" +
  extractFunction(userSource, "getFamilyConsolidatedSummary") +
  "\nthis.summary = getFamilyConsolidatedSummary;",
  familySummaryRuntime
);
const familySummaryResult = familySummaryRuntime.summary({ _verifiedUserId: "GUARDIAN-1", sessionToken: "signed" });
assert.equal(familySummaryResult.data.estudiantes[0].tienePermisoFinanciero, false,
  "USER family summary requires an explicit financial permission");
assert.equal(familySummaryResult.data.estudiantes[0].saldoPendiente, null,
  "USER family summary hides balances when only academic permission exists");
assert.equal(familySummaryResult.data.totalCargosPendientes, 0,
  "USER family summary excludes balances without explicit financial permission");

const attachmentRows = [
  ["SolicitudID","UserId","EstudianteID","AdjuntoUrl"],
  ["REQ-1","OTHER-USER","STU-1",""]
];
const attachmentRuntime = {
  getUserVerifiedRole: () => "Tutor",
  getGuardianStudents: () => ({ status: "success", data: [
    { userId: "STU-1", studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoAcademico: true } }
  ] }),
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet(attachmentRows) }) },
  requestAttachmentHeaderMap_: () => ({ SolicitudID: 0, UserId: 1, EstudianteID: 2, AdjuntoUrl: 3 }),
  logStructuredEvent: () => {}, SPREADSHEET_ID: "TEST",
  String, Number, Object, Array, Date
};
vm.createContext(attachmentRuntime);
vm.runInContext(
  guardianDomainPermissionFn + "\n" +
  extractFunction(userSource, "getAdministrativeRequestAttachment") +
  "\nthis.download = getAdministrativeRequestAttachment;",
  attachmentRuntime
);
assert.equal(
  attachmentRuntime.download({ _verifiedUserId: "GUARDIAN-1", solicitudId: "REQ-1" }).code,
  "RESOURCE_NOT_FOUND",
  "USER denies document download when guardian has only academic permission"
);
attachmentRuntime.getGuardianStudents = () => ({ status: "success", data: [
  { studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoDocumental: true } },
  { studentUserId: "STU-1", expedienteEstudianteId: "EXP-1", permisos: { permisoDocumental: true } }
] });
assert.equal(
  attachmentRuntime.download({ _verifiedUserId: "GUARDIAN-1", solicitudId: "REQ-1" }).code,
  "RESOURCE_NOT_FOUND",
  "USER denies document download when guardian target is ambiguous"
);
const jointPaymentRuntime = {
  resolveVerifiedRequestSubmitter_: () => ({ userId: "GUARDIAN-1" }),
  getGuardianStudents: () => ({ status: "success", data: [
    { studentUserId: "STU-1", permisos: { permisoAcademico: true } }
  ] }),
  hasExplicitGuardianDomainPermission_: (student, key) => !!student && !!student.permisos && student.permisos[key] === true,
  createPrivateRequestAttachment_: () => { throw new Error("ATTACHMENT_MUST_NOT_BE_CREATED_BEFORE_AUTHORIZATION"); },
  rollbackPrivateAttachment_: () => {},
  LockService: { getScriptLock: () => ({ tryLock: () => false, releaseLock: () => {} }) },
  String, Number, Object, Array, Date
};
vm.createContext(jointPaymentRuntime);
vm.runInContext(
  extractFunction(userSource, "assertGuardianFinancialDistributionScope_") + "\n" +
  extractFunction(userSource, "submitJointFamilyPayment") + "\nthis.submit = submitJointFamilyPayment;",
  jointPaymentRuntime
);
assert.throws(
  () => jointPaymentRuntime.submit({ montoTotal: 10, distribuciones: [{ estudianteId: "STU-1", montoAplicado: 10 }] }),
  /FAMILY_FINANCIAL_SCOPE_DENIED/,
  "joint family payments require explicit financial permission per student"
);
jointPaymentRuntime.getGuardianStudents = () => ({ status: "success", data: [
  { studentUserId: "STU-1", permisos: { permisoFinanciero: true } },
  { studentUserId: "STU-1", permisos: { permisoFinanciero: true } }
] });
assert.throws(
  () => jointPaymentRuntime.submit({ montoTotal: 10, distribuciones: [{ estudianteId: "STU-1", montoAplicado: 10 }] }),
  /FAMILY_FINANCIAL_SCOPE_DENIED/,
  "joint family payments deny ambiguous duplicate guardian targets"
);
jointPaymentRuntime.getGuardianStudents = () => ({ status: "success", data: [
  { studentUserId: "STU-1", permisos: { permisoFinanciero: true } }
] });
jointPaymentRuntime.createPrivateRequestAttachment_ = () => null;
assert.throws(
  () => jointPaymentRuntime.submit({ montoTotal: 10, distribuciones: [{ estudianteId: "STU-1", montoAplicado: 10 }] }),
  /LOCK_TIMEOUT/,
  "joint family payment with an explicit financial grant reaches the serialized mutation boundary"
);


let guardianReadCount = 0, paymentAttachmentRolledBack = false, paymentLockReleased = false;
jointPaymentRuntime.getGuardianStudents = () => {
  guardianReadCount++;
  return { status: "success", data: [{
    studentUserId: "STU-1",
    permisos: { permisoFinanciero: guardianReadCount === 1 }
  }] };
};
jointPaymentRuntime.createPrivateRequestAttachment_ = () => ({ getId: () => "PRIVATE-FILE" });
jointPaymentRuntime.rollbackPrivateAttachment_ = () => { paymentAttachmentRolledBack = true; };
jointPaymentRuntime.LockService = {
  getScriptLock: () => ({
    tryLock: () => true,
    releaseLock: () => { paymentLockReleased = true; }
  })
};
jointPaymentRuntime.Utilities = { getUuid: () => "PAYMENT-1" };
assert.throws(
  () => jointPaymentRuntime.submit({ montoTotal: 10, distribuciones: [{ estudianteId: "STU-1", montoAplicado: 10 }] }),
  /FAMILY_FINANCIAL_SCOPE_DENIED/,
  "joint family payment revalidates financial permission after acquiring the mutation lock"
);
assert.equal(guardianReadCount, 2, "joint family payment resolves guardian scope both before and inside the lock");
assert.equal(paymentAttachmentRolledBack, true, "joint family payment compensates the private attachment after permission revocation");
assert.equal(paymentLockReleased, true, "joint family payment releases its lock after a failed in-lock permission recheck");

let permissionUpdateReleased = false, permissionUpdateWritten = false;
let permissionRelationRows = [
  ["RelacionID","ExpedienteID","ResponsableID","","Estado","","","","PermisosJSON"],
  ["REL-1","EXP-1","GUARDIAN-1","","Activa","","","","{}"],
  ["REL-1","EXP-2","GUARDIAN-1","","Activa","","","","{}"]
];
const permissionUpdateRuntime = {
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => { permissionUpdateReleased = true; } }) },
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: () => ({
    getDataRange: () => ({ getValues: () => permissionRelationRows.map(row => row.slice()) }),
    getRange: () => ({ setValue: () => { permissionUpdateWritten = true; } })
  }),
  SPREADSHEET_ID: "TEST", String, Object, Array, JSON
};
vm.createContext(permissionUpdateRuntime);
vm.runInContext(
  extractFunction(userSource, "updateFamilyLinkPermissions") + "\nthis.update = updateFamilyLinkPermissions;",
  permissionUpdateRuntime
);
assert.throws(
  () => permissionUpdateRuntime.update({ relacionId: "REL-1", permisos: { permisoFinanciero: true } }),
  /FAMILY_RELATIONSHIP_AMBIGUOUS/,
  "family permission update denies duplicate relationship IDs"
);
assert.equal(permissionUpdateWritten, false, "ambiguous family permission update performs no write");
assert.equal(permissionUpdateReleased, true, "family permission update releases its lock after ambiguity denial");
permissionUpdateReleased = false;
permissionRelationRows = permissionRelationRows.slice(0, 2);
const permissionUpdateResult = permissionUpdateRuntime.update({ relacionId: "REL-1", permisos: { permisoFinanciero: true } });
assert.equal(permissionUpdateResult.status, "success", "unique family permission update remains available");
assert.equal(permissionUpdateWritten, true, "unique family permission update writes under the lock");
assert.equal(permissionUpdateReleased, true, "successful family permission update releases its lock");


familyScholarshipRuntime.getGuardianStudents = () => ({ status: "success", data: [
  { userId: "STU-1", studentUserId: "STU-1", permisos: { permisoFinanciero: false } },
  { userId: "STU-3", studentUserId: "STU-3", permisos: { permisoFinanciero: false } }
] });
const scholarshipRowsBeforeRevocation = familyScholarshipRows.length;
const scholarshipReleasesBeforeRevocation = familyScholarshipLockReleases;
assert.throws(() => familyScholarshipRuntime.submit({
  sessionToken: "signed", estudiantesIds: ["STU-1"], tipoBeneficio: "Beca", motivo: "Revoked"
}), /FAMILY_FINANCIAL_SCOPE_DENIED/,
  "family scholarship submission denies after financial permission revocation");
assert.equal(familyScholarshipRows.length, scholarshipRowsBeforeRevocation,
  "revoked family scholarship submission performs no append");
assert.equal(familyScholarshipLockReleases, scholarshipReleasesBeforeRevocation + 1,
  "family scholarship submission releases its lock after authorization denial");
assert.deepEqual(Array.from(familyScholarshipRuntime.read({ sessionToken: "signed" }).data), [],
  "family scholarship read hides historical applications after all financial grants are revoked");
familyScholarshipLockAvailable = false;
const scholarshipRowsBeforeLockTimeout = familyScholarshipRows.length;
assert.throws(() => familyScholarshipRuntime.submit({
  sessionToken: "signed", estudiantesIds: ["STU-1"], tipoBeneficio: "Beca", motivo: "Busy"
}), /FAMILY_SCHOLARSHIP_LOCK_TIMEOUT/,
  "family scholarship submission fails closed when the shared permission lock is busy");
assert.equal(familyScholarshipRows.length, scholarshipRowsBeforeLockTimeout,
  "family scholarship lock timeout performs no write");
familyScholarshipLockAvailable = true;

process.stdout.write("contextual-abac-five-services-contract: all assertions passed\n");
