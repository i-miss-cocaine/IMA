"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
function extractFunction(name) {
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
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
function harness(options) {
  const cfg = Object.assign({ permission: true, identity: { authorized: true, userId: "DIRECTOR-1", role: "Director" },
    access: true, expedienteRows: [["EXP-1", "PERSON-1"]] }, options || {});
  const calls = { permission: 0, identity: 0, access: [], attendanceReads: 0 };
  const sheets = {
    ExpedientesEstudiantes: [["ExpedienteID", "PersonaID"], ...cfg.expedienteRows],
    RegistrosAsistencia: [["ID","Fecha","UserId","Estado","X","Y","Justificada"],
      ["A1","2026-11-01","STUDENT-1","Presente","","",true],
      ["A2","2026-11-02","STUDENT-1","Tardanza","","",false],
      ["A3","2026-11-03","STUDENT-2","Ausente","","",false]]
  };
  const runtime = {
    SPREADSHEET_ID: "TEST",
    validateRolePermission: () => { calls.permission++; return { authorized: cfg.permission }; },
    getVerifiedAcademicIdentity_: () => { calls.identity++; return cfg.identity; },
    getStudentPersonIdForUser_: (ss, userId) => ({ "STUDENT-1":"PERSON-1", "STUDENT-2":"PERSON-2" }[userId] || ""),
    assertStudentExpedienteScopeAccess_: (payload, ss, sheet, row, key, operation) => {
      calls.access.push({ actor: payload._verifiedUserId, expedienteId: row[0], key, operation });
      return { authorized: cfg.access, code: "RESOURCE_SCOPE_DENIED", accessType: "DEPARTMENT", departmentId: "DEP-1" };
    },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] ? {
      getDataRange: () => ({ getValues: () => sheets[name].map(row => row.slice()) })
    } : null }) },
    getOrCreateSheet: (ss, name) => ({ getDataRange: () => ({ getValues: () => {
      calls.attendanceReads++; return sheets[name].map(row => row.slice());
    } }) }),
    String, Number, Object, Array, Date, JSON
  };
  vm.createContext(runtime);
  vm.runInContext(extractFunction("getStudentAttendanceSummary") + "\nthis.run = getStudentAttendanceSummary;", runtime);
  return { run: runtime.run, calls };
}
const req = (role, user, extra) => Object.assign({ _verifiedRole: role, _verifiedUserId: user }, extra || {});
const noPermission = harness({ permission: false });
assert.equal(noPermission.run(req("Director","DIRECTOR-1",{userId:"STUDENT-1"})).code,"AUTH_PERMISSION_DENIED");
assert.equal(noPermission.calls.attendanceReads,0);
const noIdentity = harness({ identity: { authorized:false, code:"VERIFIED_IDENTITY_REQUIRED" } });
assert.equal(noIdentity.run(req("Director","DIRECTOR-1",{userId:"STUDENT-1"})).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(noIdentity.calls.attendanceReads,0);
const student = harness({ identity:{authorized:true,userId:"STUDENT-1",role:"Estudiante"} });
const self = student.run(req("Estudiante","STUDENT-1",{userId:"STUDENT-2"}));
assert.equal(self.status,"success");
assert.equal(self.data.userId,"STUDENT-1","student cannot substitute another userId");
assert.equal(self.data.totalSesiones,2);
assert.equal(self.data.presentes,1);
assert.equal(self.data.tardanzas,1);
assert.deepEqual(student.calls.access[0],{actor:"STUDENT-1",expedienteId:"EXP-1",key:"permisoAcademico",operation:"READ"});
const guardianDenied = harness({identity:{authorized:true,userId:"GUARDIAN-1",role:"Tutor"},access:false});
assert.equal(guardianDenied.run(req("Tutor","GUARDIAN-1",{userId:"STUDENT-1"})).code,"RESOURCE_SCOPE_DENIED");
assert.equal(guardianDenied.calls.attendanceReads,0);
const staffDenied = harness({access:false});
assert.equal(staffDenied.run(req("Director","DIRECTOR-1",{userId:"STUDENT-1"})).code,"RESOURCE_SCOPE_DENIED");
assert.equal(staffDenied.calls.attendanceReads,0);
const staffAllowed = harness();
const summary = staffAllowed.run(req("Director","DIRECTOR-1",{userId:"STUDENT-1"}));
assert.equal(summary.status,"success");
assert.equal(summary.data.userId,"STUDENT-1");
assert.equal(summary.data.totalSesiones,2);
const ambiguous = harness({expedienteRows:[["EXP-1","PERSON-1"],["EXP-2","PERSON-1"]]});
assert.equal(ambiguous.run(req("Director","DIRECTOR-1",{userId:"STUDENT-1"})).code,"RESOURCE_AMBIGUOUS");
assert.equal(ambiguous.calls.attendanceReads,0);
const noTarget = harness();
assert.equal(noTarget.run(req("Director","DIRECTOR-1")).code,"STUDENT_TARGET_REQUIRED");
assert.equal(noTarget.calls.attendanceReads,0);
console.log("academic-student-attendance-summary-ownership: all assertions passed");
