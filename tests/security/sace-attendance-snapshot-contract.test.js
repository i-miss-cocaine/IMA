"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
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
  throw new Error("unbalanced " + name);
}

const tables = {
  AnosLectivos: [
    ["AnoID", "Nombre"], ["YEAR-2026", "2026"]
  ],
  PeriodosAcademicos: [
    ["PeriodoID", "AnoID", "Nombre", "Tipo", "FechaInicio", "FechaFin", "Orden", "Estado"],
    ["P1", "YEAR-2026", "I Parcial", "Parcial", "2026-01-01", "2026-03-31", 1, "Cerrado"],
    ["P2", "YEAR-2026", "II Parcial", "Parcial", "2026-04-01", "2026-06-30", 2, "Cerrado"]
  ],
  CatalogoAsignaturas: [
    ["AsignaturaID", "NombreOficial"], ["SUB-1", "Informática"]
  ],
  Usuarios: [
    ["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta"],
    ["STU-1", "Ana Pérez", "11", "A", "", "", "Estudiante", "", 1, "PER-1", "Activa"],
    ["STU-2", "Luis Gómez", "11", "A", "", "", "Estudiante", "", 2, "PER-2", "Activa"],
    ["TEACHER-1", "Docente", "", "", "", "", "Profesor", "", "", "PER-T", "Activa"]
  ],
  Personas: [
    ["PersonaID", "Nombres", "Apellidos", "Identificacion", "EmailContacto", "TelefonoContacto", "EstadoPersona"],
    ["PER-1", "Ana", "Pérez", "0801-2000-00001", "", "", "Activa"],
    ["PER-2", "Luis", "Gómez", "0801-2000-00002", "", "", "Activa"]
  ],
  Matriculas: [
    ["MatriculaID", "Fecha", "UserId", "Alumno", "Grado", "Seccion", "Periodo", "Tipo", "Estado", "BecaDescuento", "Observaciones"],
    ["MAT-1", "2026-01-01", "STU-1", "Ana Pérez", "11", "A", "2026", "Regular", "Activa", "", ""],
    ["MAT-2", "2026-01-01", "STU-2", "Luis Gómez", "11", "A", "YEAR-2026", "Regular", "Activa", "", ""]
  ],
  SesionesAsistencia: [
    ["SesionID", "Fecha", "HoraInicio", "HoraFin", "Grado", "Seccion", "AsignaturaID", "DocenteUserId", "Estado", "Observaciones"],
    ["S-1", "2026-02-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Cerrada", ""],
    ["S-2", "2026-05-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Finalizada", ""],
    ["S-WRONG-TEACHER", "2026-02-03", "", "", "11", "A", "SUB-1", "TEACHER-2", "Cerrada", ""],
    ["S-WRONG-SUBJECT", "2026-02-03", "", "", "11", "A", "SUB-2", "TEACHER-1", "Cerrada", ""],
    ["S-CANCELLED", "2026-02-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Cancelada", ""],
    ["S-OUTSIDE", "2026-07-03", "", "", "11", "A", "SUB-1", "TEACHER-1", "Cerrada", ""]
  ],
  RegistrosAsistencia: [
    ["RegistroID", "SesionID", "UserId", "EstadoAsistencia", "HoraLlegada", "MinutosTardanza", "Justificado", "ObservacionDocente", "FechaRegistro", "JustificacionID"],
    ["R-1", "S-1", "STU-1", "Ausente", "", "", false, "", "2026-02-03", ""],
    ["R-2", "S-1", "STU-2", "Presente", "", "", false, "", "2026-02-03", ""],
    ["R-3", "S-2", "STU-1", "Tardanza", "", 5, false, "", "2026-05-03", ""],
    ["R-4", "S-2", "STU-2", "Ausente", "", "", true, "", "2026-05-03", ""],
    ["R-OTHER", "S-WRONG-TEACHER", "STU-1", "Ausente", "", "", false, "", "2026-02-03", ""]
  ]
};

function createContext(actorRole = "Profesor", institutionId = "INST-1", includeDocumentType = false) {
  const sheets = {};
  Object.keys(tables).forEach(name => {
    let rows = tables[name];
    if (name === "Personas" && includeDocumentType) {
      rows = [rows[0].concat("TipoIdentificacion")].concat(rows.slice(1).map(row => row.concat("DNI")));
    }
    sheets[name] = { getDataRange() { return { getValues() { return rows.map(row => row.slice()); } }; } };
  });
  const context = {
    SPREADSHEET_ID: "TEST",
    PropertiesService: { getScriptProperties() { return { getProperty(name) { return name === "IMA_INSTITUTION_ID" ? "INST-1" : ""; } }; } },
    SpreadsheetApp: { openById(id) { assert.equal(id, "TEST"); return { getSheetByName(name) { return sheets[name] || null; } }; } },
    Utilities: { formatDate(value) { return value.toISOString().slice(0, 10); } },
    Session: { getScriptTimeZone() { return "UTC"; } },
    getVerifiedAcademicIdentity_(payload) {
      return { authorized: true, userId: "TEACHER-1", role: actorRole };
    },
    getVerifiedRequestSessionClaims_() { return { userId: "TEACHER-1", role: actorRole, institutionId }; },
    Date, String, Number, Array, Object, Set, Error, Math, JSON
  };
  vm.createContext(context);
  vm.runInContext(extract("getSaceAttendanceSnapshot") + "\nthis.runSnapshot=getSaceAttendanceSnapshot;", context);
  return context;
}

const payload = {
  anoId: "YEAR-2026", grado: "11", seccion: "A", asignaturaId: "SUB-1",
  periodoIds: ["P1", "P2"], studentIds: ["STU-1", "STU-2"],
  docenteUserId: "ATTACKER-SPOOF"
};
const result = createContext().runSnapshot(payload);
assert.equal(result.status, "success");
assert.equal(result.data.expectedContext.teacherUserId, "TEACHER-1", "teacher identity must come from the verified session");
assert.equal(result.data.expectedContext.institutionId, "INST-1", "institution must come from verified claims and service configuration");
assert.equal(result.data.expectedContext.asignatura, "Informática");
assert.deepEqual(Array.from(result.data.periods, period => period.periodoId), ["P1", "P2"]);
assert.deepEqual(Array.from(result.data.identityRecords, row => [row.userId, row.identity, row.documentType, row.documentMarker]), [
  ["STU-1", "0801-2000-00001", "", ""], ["STU-2", "0801-2000-00002", "", ""]
]);
const typedSnapshot = createContext("Profesor", "INST-1", true).runSnapshot(payload);
assert.deepEqual(Array.from(typedSnapshot.data.identityRecords, row => [row.userId, row.documentType, row.documentMarker]), [
  ["STU-1", "DNI", ""], ["STU-2", "DNI", ""]
], "TipoIdentificacion is returned separately; it must not be mistaken for a SACE template marker");
assert.equal(result.data.attendanceSessions.length, 2);
assert.deepEqual(Array.from(result.data.attendanceSessions, row => row.sesionId), ["S-1", "S-2"]);
assert.equal(result.data.attendanceRecords.length, 4);
assert.equal(result.data.attendanceRecords.find(row => row.registroId === "R-4").justificado, true);
assert(result.limitations.some(item => item.includes("documentMarker remains empty")));
assert.equal(result.data.attendanceRecords.some(row => row.registroId === "R-OTHER"), false);

assert.equal(createContext("Estudiante").runSnapshot(payload).code, "SACE_TEACHER_CONTEXT_REQUIRED");
assert.equal(createContext("Profesor", "INST-OTHER").runSnapshot(payload).code, "SACE_INSTITUTION_CONTEXT_REQUIRED");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { studentIds: ["STU-1", "STU-1"] })).code, "SACE_STUDENT_ROSTER_DUPLICATE");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { periodoIds: ["P1", "P1"] })).code, "SACE_PERIODS_MUST_BE_DISTINCT");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { studentIds: ["STU-UNKNOWN"] })).code, "SACE_STUDENT_ACCOUNT_INVALID");
assert.equal(createContext().runSnapshot(Object.assign({}, payload, { periodoIds: ["P1", "P-UNKNOWN"] })).code, "SACE_PERIOD_CONTEXT_MISMATCH");

const professorStart = source.indexOf('"Profesor": [', source.indexOf("const ROLE_PERMISSIONS"));
const assistantStart = source.indexOf('"Asistente": [', professorStart);
const professorPermissions = source.slice(professorStart, assistantStart);
assert(professorPermissions.includes('"getSaceAttendanceSnapshot"'), "only teacher role should be explicitly granted the endpoint");
assert(!source.slice(source.indexOf('"Estudiante": [', assistantStart), source.indexOf('"Alumno": [', assistantStart)).includes('"getSaceAttendanceSnapshot"'));
assert(extract("doPost").includes('case "getSaceAttendanceSnapshot": result = getSaceAttendanceSnapshot(payload); break;'));
console.log("sace-attendance-snapshot-contract: PASS (verified teacher scope, institution, periods, enrollment, identity join and session attendance)");
