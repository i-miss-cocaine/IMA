const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  const block = source.slice(start, next === -1 ? source.length : next);
  const close = block.indexOf("\n}\n");
  assert.notEqual(close, -1, "unterminated function " + name);
  return block.slice(0, close + 2);
}
function hasGuard(name, guard) {
  assert.ok(extractFunction(name).includes(guard), name + " must enforce " + guard);
}

for (const name of ["getAdmissionEvaluations","getAdmissionInterviews","saveAdmissionEvaluation","scheduleAdmissionInterview","recordInterviewOutcome","getAdmissionAnalyticsReport","addToWaitlist","getWaitlist","reorderWaitlist","offerWaitlistSlot","reopenAdmissionRequest","resolveAdmissionDuplicate","convertAdmissionToStudent"]) {
  hasGuard(name, "getAcademicAdmissionScopeContext_");
}
hasGuard("getAdmissionEvaluations", "getAuthorizedAdmissionRequestIds_");
hasGuard("getAdmissionInterviews", "getAuthorizedAdmissionRequestIds_");
hasGuard("getAdmissionAnalyticsReport", "getAuthorizedAdmissionRequestIds_");
hasGuard("getWaitlist", "getAuthorizedAdmissionRequestIds_");
hasGuard("convertAdmissionToStudent", "registerAcademicResourceOwnership_");
hasGuard("convertAdmissionToStudent", "SOLICITUD_ADMISION");
hasGuard("convertAdmissionToStudent", "EXPEDIENTE_ESTUDIANTE");
hasGuard("convertAdmissionToStudent", "deleteAcademicResourceOwnership_");
assert.ok(extractFunction("convertAdmissionToStudent").includes("DOCUMENT_VALIDATION_FAILED"), "document validation must fail closed");
assert.ok(extractFunction("convertAdmissionToStudent").includes("CAPACITY_VALIDATION_FAILED"), "capacity validation must fail closed");
hasGuard("resolveAdmissionDuplicate", "assertResourceOwnershipForScope_");
assert.ok(extractFunction("updateAdmissionStatus").includes("Object.assign({}, payload || {}, { solicitudId: solicitudId })"), "internal admission reads must preserve verified session context");

// Exercise department selection rules.
const departmentCode = extractFunction("resolveAcademicAdmissionDepartment_");
const context = {};
vm.runInNewContext(departmentCode, context);
assert.equal(context.resolveAcademicAdmissionDepartment_({}, {authorized:true,departmentIds:["D1"]}, {departmentId:"D1"}).departmentId, "D1");
assert.equal(context.resolveAcademicAdmissionDepartment_({departmentId:"D2"}, {authorized:true,institutionWide:true,departmentIds:[]}, {code:"INSTITUTION_UNASSIGNED"}).departmentId, "D2");
assert.equal(context.resolveAcademicAdmissionDepartment_({}, {authorized:true,institutionWide:true,departmentIds:[]}, {code:"INSTITUTION_UNASSIGNED"}).code, "RESOURCE_DEPARTMENT_SELECTION_REQUIRED");
assert.equal(context.resolveAcademicAdmissionDepartment_({departmentId:"D2"}, {authorized:true,departmentIds:["D1"]}, {departmentId:"D1"}).authorized, false);

// Exercise idempotent and fail-closed ResourceOwnership registration.
const registerCode = extractFunction("registerAcademicResourceOwnership_");
const headers = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","CreatedBy","CreatedAt","UpdatedAt"];
const rows = [headers.slice()];
const sheet = {
  getLastRow: () => rows.length,
  getRange: (row,col,numRows,numCols) => ({ getValues: () => [rows[row-1].slice(col-1,col-1+numCols)] }),
  getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
  appendRow: row => rows.push(row.slice()),
  deleteRow: row => rows.splice(row-1,1)
};
const ss = { getSheetByName: () => sheet, insertSheet: () => sheet };
const registerContext = {
  getDynamicPermissionsForRole: () => true,
  Utilities: { getUuid: () => "OWN-1" },
  Date
};
vm.runInNewContext(registerCode, registerContext);
const scope = {authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false,role:"Director",userId:"U-DIR"};
const first = registerContext.registerAcademicResourceOwnership_(ss,scope,"SOLICITUD_ADMISION","REQ-1","D1","U-DIR");
assert.equal(first.authorized,true);
assert.equal(first.created,true);
const second = registerContext.registerAcademicResourceOwnership_(ss,scope,"SOLICITUD_ADMISION","REQ-1","D1","U-DIR");
assert.equal(second.authorized,true);
assert.equal(second.existing,true);
const multiScope = {authorized:true,institutionId:"INST-1",departmentIds:["D1","D2"],institutionWide:false,role:"Director",userId:"U-DIR"};
const conflict = registerContext.registerAcademicResourceOwnership_(ss,multiScope,"SOLICITUD_ADMISION","REQ-1","D2","U-DIR");
assert.equal(conflict.authorized,false);
assert.equal(conflict.code,"RESOURCE_OWNERSHIP_CONFLICT");
rows.push(["OWN-2","INST-1","SOLICITUD_ADMISION","REQ-2","D1","ACTIVE","U-DIR",new Date(),new Date()]);
rows.push(["OWN-3","INST-1","SOLICITUD_ADMISION","REQ-2","D1","ACTIVE","U-DIR",new Date(),new Date()]);
const ambiguous = registerContext.registerAcademicResourceOwnership_(ss,scope,"SOLICITUD_ADMISION","REQ-2","D1","U-DIR");
assert.equal(ambiguous.authorized,false);
assert.equal(ambiguous.code,"RESOURCE_OWNERSHIP_AMBIGUOUS");

console.log("academic admission ownership contract: PASS");
