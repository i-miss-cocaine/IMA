const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
const uiSource = fs.readFileSync(path.join(__dirname, "../../js/ui-common.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(__dirname, "../../app/html/dashboards/dynamic-dashboard.html"), "utf8");
new vm.Script(source);

function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = null; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c.charCodeAt(0) === 96) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}

function makeSheet(rows) {
  return {
    rows: rows.map(row => row.slice()),
    getDataRange() {
      const sheet = this;
      return { getValues: () => sheet.rows.map(row => row.slice()) };
    },
    appendRow(row) { this.rows.push(row.slice()); },
    getLastRow() { return this.rows.length; },
    getRange(row, column, numRows, numColumns) {
      const sheet = this;
      return {
        getValues() {
          const result = [];
          for (let r = 0; r < (numRows || 1); r++) {
            const line = [];
            for (let c = 0; c < (numColumns || 1); c++) {
              line.push((sheet.rows[row - 1 + r] || [])[column - 1 + c] || "");
            }
            result.push(line);
          }
          return result;
        },
        setValue(value) {
          while (sheet.rows.length < row) sheet.rows.push([]);
          sheet.rows[row - 1][column - 1] = value;
        },
        setValues(values) {
          values.forEach((line, r) => {
            while (sheet.rows.length < row + r) sheet.rows.push([]);
            sheet.rows[row - 1 + r] = line.slice();
          });
        }
      };
    }
  };
}

const activityHeaders = ["ExtracurricularID", "AnoID", "Nombre", "Categoria", "HorarioJSON", "EncargadosJSON",
  "SupervisoresJSON", "Estado", "EvidenciasDriveFolderId", "EvidenciasJSON"];
const chargeHeaders = ["CargoID", "Fecha", "UserId", "Concepto", "MontoBase", "Descuento", "MontoFinal", "Estado", "FechaVencimiento", "Observaciones", "ClaveUnicaDedupe", "BatchId"];
const users = [
  ["UserId", "Nombre", "", "", "", "", "Rol", "", "", "PersonaID", "Estado"],
  ["G1", "Tutor Uno", "", "", "", "", "Padre", "", "", "P-G1", "Activo"],
  ["S1", "Alumno Uno", "", "", "", "", "Estudiante", "", "", "P-S1", "Activo"],
  ["S2", "Alumno Dos", "", "", "", "", "Estudiante", "", "", "P-S2", "Activo"],
  ["G2", "Tutor Dos", "", "", "", "", "Padre", "", "", "P-G2", "Activo"]
];
const relations = [
  ["RelacionID", "EstudiantePersonaID", "ResponsablePersonaID", "Parentesco", "Estado", "FechaInicio", "FechaFin"],
  ["R1", "P-S1", "P-G1", "Padre", "Aprobado", new Date("2025-01-01"), new Date("2030-01-01")],
  ["R2", "P-S2", "P-G1", "Padre", "Aprobado", new Date("2025-01-01"), new Date("2030-01-01")]
];
const sheets = {
  Usuarios: makeSheet(users),
  RelacionesFamiliares: makeSheet(relations),
  ActividadesExtracurriculares: makeSheet([activityHeaders]),
  CargosEstudiante: makeSheet([chargeHeaders]),
  TransporteRutas: makeSheet([["RutaID", "NombreRuta", "UnidadCodigo", "ConductorEmpleadoId", "Capacidad", "ParadasJSON", "Estado", "Observaciones"], ["RUTA-ESPECIAL-1", "Ruta evento", "BUS-1", "DRV-1", 30, "[]", "Activa", ""]])
};
const ss = {
  getSheetByName(name) { return sheets[name] || null; },
  insertSheet(name) { sheets[name] = makeSheet([]); return sheets[name]; }
};
let lockBusy = false, lockReleased = true, uuid = 0;
const context = {
  SpreadsheetApp: { openById: () => ss },
  LockService: { getScriptLock: () => ({
    waitLock() { if (lockBusy) throw new Error("LOCK_BUSY"); lockReleased = false; },
    releaseLock() { lockReleased = true; }
  }) },
  Utilities: { getUuid: () => "UUID-" + (++uuid) },
  getOrCreateSheet(sheet, name) {
    let result = sheet.getSheetByName(name);
    if (!result) {
      result = sheet.insertSheet(name);
      if (name === "ActividadesExtracurriculares") result.appendRow(activityHeaders);
      if (name === "CargosEstudiante") result.appendRow(chargeHeaders);
    }
    return result;
  },
  SPREADSHEET_ID: "TEST",
  Date, Math, JSON, Number, String, Object, Set, Array, isFinite
};
const names = [
  "ensureExtracurricularActivitySchema_", "ensureExtracurricularEnrollmentSheet_", "ensureExtracurricularChargeSheet_",
  "extracurricularRoleKey_", "extracurricularGuardianCanManageStudent_", "createExtracurricularCharge_",
  "promoteNextExtracurricularWaitlist_", "saveExtracurricularActivity", "getExtracurricularActivities",
  "enrollStudentInExtracurricular", "getStudentExtracurricularEnrollments", "cancelExtracurricularEnrollment"
];
vm.runInNewContext(names.map(extract).join("\n"), context);

const activity = context.saveExtracurricularActivity({
  _verifiedRole: "Director", extracurricularId: "EXTRA-1", anoId: "2027",
  nombre: "Fútbol", categoria: "Deportiva", cupoMaximo: 1, tarifa: 500,
  horarioJSON: { dias: ["Lunes", "Miércoles"], horaInicio: "15:00", horaFin: "16:30" },
  encargadosJSON: ["DOC-1"], supervisoresJSON: ["DIR-1"],
  transporteExtraordinarioJSON: { requiereTransporte: true, fechaEvento: "2027-02-10", destino: "Estadio Central", rutaId: "RUTA-ESPECIAL-1" },
  fechaInicio: "2027-01-15", fechaFin: "2027-05-30", estado: "Activa"
});
assert.equal(activity.status, "success");
assert.equal(activity.cupoMaximo, 1);
assert.equal(activity.tarifa, 500);
const activities = context.getExtracurricularActivities({});
assert.equal(activities.activities[0].cupoMaximo, 1);
assert.equal(activities.activities[0].tarifa, 500);
assert.match(activities.activities[0].transporteExtraordinarioJSON, /RUTA-ESPECIAL-1/);
const updatedActivity = context.saveExtracurricularActivity({
  _verifiedRole: "Director", extracurricularId: "EXTRA-1", nombre: "Fútbol actualizado", categoria: "Deportiva"
});
assert.equal(updatedActivity.actualizado, true);
const preservedActivity = context.getExtracurricularActivities({}).activities[0];
assert.equal(preservedActivity.cupoMaximo, 1, "partial updates must preserve capacity");
assert.equal(preservedActivity.tarifa, 500, "partial updates must preserve the fee");
assert.match(preservedActivity.horario, /Lunes/, "partial updates must preserve the schedule");
assert.match(preservedActivity.transporteExtraordinarioJSON, /RUTA-ESPECIAL-1/, "partial updates must preserve the extraordinary route");
assert.match(uiSource, /loadFamilyExtracurricularPanel/);
assert.match(uiSource, /loadExtracurricularAdminPanel/);
assert.match(uiSource, /saveExtracurricularActivity/);
assert.match(dashboardSource, /extracurricular-admin-panel/);
assert.match(uiSource, /enrollStudentInExtracurricular/);
assert.match(dashboardSource, /family-extracurricular-panel/);
assert.throws(() => context.saveExtracurricularActivity({
  _verifiedRole: "Padre", nombre: "No autorizada", categoria: "Deportiva"
}), /EXTRACURRICULAR_CONFIG_ROLE_NOT_ALLOWED/);
assert.throws(() => context.saveExtracurricularActivity({
  _verifiedRole: "Director", nombre: "Cupo inválido", categoria: "Deportiva", cupoMaximo: -1
}), /EXTRACURRICULAR_CAPACITY_INVALID/);
assert.throws(() => context.saveExtracurricularActivity({
  _verifiedRole: "Director", nombre: "Ruta inválida", categoria: "Deportiva", cupoMaximo: 2,
  transporteExtraordinarioJSON: { requiereTransporte: true, fechaEvento: "2027-02-10", destino: "Estadio", rutaId: "NO-EXISTE" }
}), /EXTRACURRICULAR_TRANSPORT_ROUTE_NOT_AVAILABLE/);

const first = context.enrollStudentInExtracurricular({
  _verifiedUserId: "G1", _verifiedRole: "Padre", estudianteUserId: "S1", extracurricularId: "EXTRA-1"
});
assert.equal(first.estado, "PendientePago");
assert.ok(first.cargoId);
assert.equal(sheets.CargosEstudiante.rows.length, 2);
assert.match(sheets.CargosEstudiante.rows[1][10], /EXTRACURRICULAR\|EXTRA-1\|S1/);
const duplicate = context.enrollStudentInExtracurricular({
  _verifiedUserId: "G1", _verifiedRole: "Padre", estudianteUserId: "S1", extracurricularId: "EXTRA-1"
});
assert.equal(duplicate.idempotent, true);
assert.equal(sheets.CargosEstudiante.rows.length, 2, "duplicate enrollment must not create another charge");

const waitlisted = context.enrollStudentInExtracurricular({
  _verifiedUserId: "G1", _verifiedRole: "Padre", estudianteUserId: "S2", extracurricularId: "EXTRA-1"
});
assert.equal(waitlisted.estado, "ListaEspera");
assert.equal(waitlisted.posicionListaEspera, 1);
assert.equal(sheets.CargosEstudiante.rows.length, 2, "waitlisted students must not be charged");

const cancelled = context.cancelExtracurricularEnrollment({
  _verifiedUserId: "G1", _verifiedRole: "Padre", inscripcionId: first.inscripcionId
});
assert.equal(cancelled.estado, "Cancelada");
assert.equal(cancelled.siguienteEnLista.estado, "PendientePago");
assert.equal(sheets.CargosEstudiante.rows.length, 3);
assert.equal(sheets.CargosEstudiante.rows[1][7], "Anulado", "cancelled pending charge must be annulled");
assert.equal(sheets.ServiciosInscripciones.rows[2][5], "PendientePago", "waitlist promotion must reserve the released place");

sheets.CargosEstudiante.rows[2][7] = "Pagado";
const family = context.getStudentExtracurricularEnrollments({ _verifiedUserId: "G1", _verifiedRole: "Padre" });
assert.equal(family.children.length, 2);
assert.equal(family.enrollments.length, 2);
assert.equal(family.enrollments.find(row => row.estudianteUserId === "S2").estado, "Confirmada");
assert.equal(family.enrollments.find(row => row.estudianteUserId === "S2").cargoEstado, "Pagado");

assert.throws(() => context.enrollStudentInExtracurricular({
  _verifiedUserId: "G2", _verifiedRole: "Padre", estudianteUserId: "S1", extracurricularId: "EXTRA-1"
}), /EXTRACURRICULAR_ACTIVE_FAMILY_RELATION_REQUIRED/);
assert.throws(() => context.cancelExtracurricularEnrollment({
  _verifiedUserId: "G1", _verifiedRole: "Padre", inscripcionId: cancelled.siguienteEnLista.inscripcionId
}), /EXTRACURRICULAR_PAID_ENROLLMENT_REFUND_REQUIRED/);

lockBusy = true;
assert.throws(() => context.enrollStudentInExtracurricular({
  _verifiedUserId: "G1", _verifiedRole: "Padre", estudianteUserId: "S1", extracurricularId: "EXTRA-1"
}), /LOCK_BUSY/);
lockBusy = false;
assert.equal(lockReleased, true);
console.log("ACADEMIC extracurricular capacity, family enrollment and billing contract PASS.");
