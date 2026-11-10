const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const claims = {
  "teacher-token": { userId: "TEACHER-1", role: "Profesor" },
  "director-token": { userId: "DIRECTOR-1", role: "Dirección" },
  "other-token": { userId: "TEACHER-2", role: "Profesor" }
};
const examRows = [
  ["EXM-1", "Propio y mismo departamento", "Matemáticas", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-2", "Propio pero otro departamento", "Ciencias", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-3", "Docente ajeno", "Historia", "10", "A", "", "", "Activo", "TEACHER-2", "P1"],
  ["EXM-4", "Sin propiedad", "Inglés", "10", "A", "", "", "Activo", "TEACHER-1", "P1"],
  ["EXM-5", "Propiedad duplicada", "Arte", "10", "A", "", "", "Activo", "TEACHER-1", "P1"]
];
const scopeRows = [
  ["AssignmentID", "UserID", "RoleID", "ScopeType", "ScopeValues", "Status", "", "", "StartAt", "EndAt"],
  ["ASG-1", "TEACHER-1", "Profesor", "DEPARTAMENTO", "D1", "ACTIVO", "", "", "", ""],
  ["ASG-2", "TEACHER-2", "Profesor", "DEPARTAMENTO", "D2", "ACTIVO", "", "", "", ""],
  ["ASG-3", "DIRECTOR-1", "Dirección", "INSTITUCION", "I1", "ACTIVO", "", "", "", ""]
];
const ownershipRows = [
  ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
  ["OWN-1", "I1", "EXAMEN", "EXM-1", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-2", "I1", "EXAMEN", "EXM-2", "D2", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-3", "I1", "EXAMEN", "EXM-3", "D1", "ACTIVE", "TEACHER-2", "", ""],
  ["OWN-4", "I1", "EXAMEN", "EXM-5", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-5", "I1", "EXAMEN", "EXM-5", "D1", "ACTIVE", "TEACHER-1", "", ""],
  ["OWN-6", "I2", "EXAMEN", "EXM-1", "D1", "ACTIVE", "TEACHER-1", "", ""]
];
const deliveryRows = [
  ["EntregaID", "ExamenID", "UserID", "Fecha", "Respuestas", "Nota", "Estado", "Comentario"],
  ["DEL-1", "EXM-1", "STUDENT-1", new Date("2026-11-01T10:00:00Z"), "[]", 90, "Entregado", ""],
  ["DEL-2", "EXM-2", "STUDENT-2", new Date("2026-11-02T10:00:00Z"), "[]", 80, "Entregado", ""],
  ["DEL-3", "EXM-3", "STUDENT-3", new Date("2026-11-03T10:00:00Z"), "[]", 70, "Entregado", ""]
];
const userRows = [
  ["UserID", "Nombre", "Grado", "Seccion", "Email"],
  ["STUDENT-1", "Estudiante Uno", "10", "A", "student1@example.invalid"],
  ["STUDENT-2", "Estudiante Dos", "10", "A", "student2@example.invalid"],
  ["STUDENT-3", "Estudiante Tres", "10", "A", "student3@example.invalid"]
];
const sheets = { Examenes: examRows, AsignacionesAmbitosRoles: scopeRows, ResourceOwnership: ownershipRows, EntregasExamen: deliveryRows, Usuarios: userRows };
const sheetObjects = Object.fromEntries(Object.entries(sheets).map(([name, rows]) => [name, { getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; } }]));
const ss = { getSheetByName(name) { return sheetObjects[name] || null; } };
const runtime = {
  SPREADSHEET_ID: "LOCAL", EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new WeakMap(),
  verifySessionToken(token) { return claims[token] || null; },
  PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "I1" : null; } }; } },
  SpreadsheetApp: { openById() { return ss; } },
  getSheetOrThrow(spreadsheet, name) { const sheet = spreadsheet.getSheetByName(name); if (!sheet) throw new Error("Missing sheet " + name); return sheet; },
  isInTeacherList(value, filter) { return String(value).trim() === String(filter).trim(); }
};
const helpers = ["getVerifiedExamIdentity_", "getVerifiedExamDepartmentScope_", "assertExamResourceOwnershipForScope_", "getAllExams", "getTeacherExamActivity"].map(name => extractFunction(source, name)).join("\n");
vm.runInNewContext(helpers + "\nthis.getAllExams = getAllExams; this.getTeacherExamActivity = getTeacherExamActivity; this.getVerifiedExamDepartmentScope_ = getVerifiedExamDepartmentScope_; this.assertExamResourceOwnershipForScope_ = assertExamResourceOwnershipForScope_;", runtime);
const payload = { sessionToken: "teacher-token", profesorId: "TEACHER-2" };
const list = runtime.getAllExams(payload);
assert.deepEqual(Array.from(list.data, row => row.examenId), ["EXM-1"], "teacher list uses signed identity and department ownership; client profesorId is ignored");
assert.equal(payload._verifiedUserId, "TEACHER-1");
const activity = runtime.getTeacherExamActivity({ sessionToken: "teacher-token", profesorId: "TEACHER-2" });
assert.deepEqual(Array.from(activity.data, row => row.entregaId), ["DEL-1"], "teacher activity is limited to owned exams");
const directorList = runtime.getAllExams({ sessionToken: "director-token" });
assert.deepEqual(Array.from(directorList.data, row => row.examenId), ["EXM-1", "EXM-2", "EXM-3"], "institution-wide role sees unique owned resources in its institution");
const scope = runtime.getVerifiedExamDepartmentScope_({ sessionToken: "teacher-token" }, ss);
const cross = runtime.assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", "EXM-2", "READ", {});
assert.equal(cross.authorized, false); assert.equal(cross.code, "RESOURCE_SCOPE_DENIED");
const missing = runtime.assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", "UNKNOWN", "READ", {});
assert.equal(missing.authorized, false); assert.equal(missing.code, "RESOURCE_OWNERSHIP_UNVERIFIED");
const duplicate = runtime.assertExamResourceOwnershipForScope_(ss, scope, "EXAMEN", "EXM-5", "READ", {});
assert.equal(duplicate.authorized, false); assert.equal(duplicate.code, "RESOURCE_OWNERSHIP_AMBIGUOUS");
assert.deepEqual(Array.from(runtime.getAllExams({ sessionToken: "other-token" }).data), [], "no accessible ownership returns an empty list");
process.stdout.write("exam-service-departmental-access: signed identity, department scope, tenant isolation and ownership assertions passed\n");
