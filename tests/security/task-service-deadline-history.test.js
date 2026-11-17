"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "backend/task-service/Code.gs"), "utf8");
const teacherSource = fs.readFileSync(path.join(root, "js/teacher.js"), "utf8");
new vm.Script(source, { filename: "backend/task-service/Code.gs" });
new vm.Script(teacherSource, { filename: "js/teacher.js" });
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "\x60") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
function makeSheet(rows, options = {}) {
  return {
    rows,
    getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    getRange: (r, c, n, m) => ({
      setValues(values) {
        if (options.failNextSetValues) { options.failNextSetValues = false; throw new Error("simulated row write failure"); }
        values.forEach((row, ri) => row.forEach((value, ci) => { rows[r - 1 + ri][c - 1 + ci] = value; }));
      },
      setValue(value) { rows[r - 1][c - 1] = value; }
    }),
    appendRow(row) {
      if (options.failAppend) throw new Error("simulated history append failure");
      rows.push(row.slice());
    }
  };
}
const historyHeaders = ["HistoryID","TaskID","PreviousDeadline","NewDeadline","ChangedByUserID","ChangedByRole","ChangedAt","Reason","CorrelationID"];
function makeHarness(options = {}) {
  let identity = options.identity || { authorized: true, userId: "PROF-1", role: "Profesor" };
  const taskRows = [
    ["TareaID","Tipo","Titulo","Descripcion","Parcial","Asignatura","Grado","Seccion","FechaLimite","TareaOriginalID","ProfesorID","Estado","Puntaje","ArchivoUrl","FechaDisponible","TipoRecurso"],
    ["TASK-1","Tarea","Original","Descripción","I","MAT-1","6","A","2026-12-01T00:00:00.000Z","","PROF-1","Activa",100,"","", "Tarea"]
  ];
  const historyRows = options.historySchemaMismatch ? [["WrongHeader"]] : [historyHeaders.slice()];
  const taskSheet = makeSheet(taskRows);
  const historySheet = makeSheet(historyRows, { failAppend: options.failHistoryAppend });
  const classroomSheet = makeSheet([
    ["AulaID","OfertaID","Nombre","Grado","Seccion","Asignatura","ProfesorID","Estado"],
    ["AULA-1","OFFER-1","Aula","6","A","MAT-1","PROF-1","Activa"]
  ]);
  const sheets = { Tareas: taskSheet, HistorialFechasLimiteTareas: historySheet, AulasVirtuales: classroomSheet };
  const ss = {
    getSheetByName: name => sheets[name] || null,
    insertSheet: name => { const sheet = makeSheet([]); sheets[name] = sheet; return sheet; }
  };
  const lockState = { acquired: options.lockAvailable !== false, releases: 0 };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ss },
    LockService: { getScriptLock: () => ({ tryLock: () => lockState.acquired, releaseLock: () => { lockState.releases++; } }) },
    Utilities: { getUuid: () => "UUID-1" },
    getVerifiedTaskIdentity_: payload => {
      if (!payload || payload.sessionToken !== "valid") return { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
      return identity;
    },
    assertTaskServiceTeacherCanManageTask: (payload, row) => {
      if (!identity.authorized || (!["Administrador","Desarrollador","Dirección","Secretaría"].includes(identity.role) &&
          (identity.role !== "Profesor" || String(row[10]) !== String(identity.userId)))) throw new Error("RESOURCE_NOT_FOUND");
      return true;
    },
    getSheetOrThrow: (_ss, name) => { if (!sheets[name]) throw new Error("missing " + name); return sheets[name]; },
    normalizeString: value => String(value || "").trim().toLowerCase(),
    assertTaskServiceTeacherAssignedToOffer: (userId, offerId) => {
      if (userId !== "PROF-1" || offerId !== "OFFER-1") throw new Error("TEACHER_ASSIGNMENT_DENIED");
      return true;
    }
  };
  vm.runInNewContext("const TASK_DEADLINE_HISTORY_HEADERS_ = " + JSON.stringify(historyHeaders) + ";\n" + extractFunction("normalizeTaskDeadlineForHistory_") + "\n" +
    extractFunction("ensureTaskDeadlineHistorySheet_") + "\n" + extractFunction("updateTask") +
    "\nthis.update=updateTask;", context);
  return { context, taskRows, historyRows, lockState, sheets };
}
{
  const h = makeHarness();
  const result = h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Ajuste del calendario", correlationId:"CORR-1",
    _verifiedUserId:"FORGED-USER", _verifiedRole:"Administrador" });
  assert.equal(result.status, "success");
  assert.equal(result.deadlineHistoryRecorded, true);
  assert.equal(h.taskRows[1][8], "2026-12-02");
  assert.equal(h.historyRows.length, 2);
  assert.equal(h.historyRows[1][2], "2026-12-01T00:00:00.000Z");
  assert.equal(h.historyRows[1][3], "2026-12-02T00:00:00.000Z");
  assert.equal(h.historyRows[1][4], "PROF-1");
  assert.equal(h.historyRows[1][5], "Profesor");
  assert.equal(h.historyRows[1][7], "Ajuste del calendario");
  assert.equal(h.historyRows[1][8], "CORR-1");
  assert.equal(h.lockState.releases, 1);
}
{
  const h = makeHarness();
  h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Cambio inicial" });
  h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-03", motivoCambioFechaLimite:"Nueva reprogramación" });
  assert.equal(h.historyRows.length, 3);
  assert.equal(h.historyRows[2][2], "2026-12-02T00:00:00.000Z");
  assert.equal(h.historyRows[2][3], "2026-12-03T00:00:00.000Z");
}
{
  const h = makeHarness();
  h.context.update({ sessionToken:"valid", tareaId:"TASK-1", titulo:"Título actualizado" });
  assert.equal(h.historyRows.length, 1);
  assert.equal(h.taskRows[1][2], "Título actualizado");
}
{
  const h = makeHarness();
  assert.throws(() => h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02" }), /TASK_DEADLINE_CHANGE_REASON_REQUIRED/);
  assert.equal(h.taskRows[1][8], "2026-12-01T00:00:00.000Z");
  assert.equal(h.historyRows.length, 1);
}
{
  const h = makeHarness({ lockAvailable:false });
  assert.throws(() => h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Cambio" }), /TASK_UPDATE_LOCK_UNAVAILABLE/);
  assert.equal(h.taskRows[1][8], "2026-12-01T00:00:00.000Z");
  assert.equal(h.historyRows.length, 1);
}
{
  const h = makeHarness({ historySchemaMismatch:true });
  assert.throws(() => h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Cambio" }), /TASK_DEADLINE_HISTORY_SCHEMA_MISMATCH/);
  assert.equal(h.taskRows[1][8], "2026-12-01T00:00:00.000Z");
}
{
  const h = makeHarness({ failHistoryAppend:true });
  assert.throws(() => h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Cambio" }), /TASK_DEADLINE_HISTORY_WRITE_FAILED/);
  assert.equal(h.taskRows[1][8], "2026-12-01T00:00:00.000Z");
  assert.equal(h.historyRows.length, 1);
}
{
  const h = makeHarness({ identity:{authorized:true,userId:"PROF-2",role:"Profesor"} });
  assert.throws(() => h.context.update({ sessionToken:"valid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Cambio" }), /RESOURCE_NOT_FOUND/);
  assert.equal(h.taskRows[1][8], "2026-12-01T00:00:00.000Z");
}
{
  const h = makeHarness();
  assert.throws(() => h.context.update({ sessionToken:"invalid", tareaId:"TASK-1", fechaLimite:"2026-12-02", motivoCambioFechaLimite:"Cambio" }), /VERIFIED_IDENTITY_REQUIRED/);
}
assert(teacherSource.includes("motivoCambioFechaLimite"));
assert(teacherSource.includes("dataset.originalValue"));

{
  const materialRows = [];
  const materialSheet = {
    rows: materialRows,
    getLastRow: () => materialRows.length,
    appendRow: row => materialRows.push(row.slice()),
    getDataRange: () => ({ getValues: () => materialRows.map(row => row.slice()) }),
    getRange: (row, col) => ({ setValue: value => { materialRows[row - 1][col - 1] = value; } })
  };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ({}) },
    getVerifiedTaskIdentity_: payload => payload && payload.sessionToken === "valid"
      ? { authorized: true, userId: "PROF-1", role: "Profesor" }
      : { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" },
    getTaskServiceClassroomById: classId => classId === "AULA-1"
      ? ["AULA-1","OFFER-1","","","","","PROF-1","Activa"] : null,
    normalizeString: value => String(value || "").trim().toLowerCase(),
    assertTaskServiceTeacherAssignedToOffer: (userId, offerId) => {
      assert.equal(userId, "PROF-1");
      assert.equal(offerId, "OFFER-1");
      return true;
    },
    isTaskServiceAdministrativeRole: role => ["Administrador","Desarrollador","Dirección","Secretaría"].includes(role),
    getOrCreateSheet: () => materialSheet,
    Utilities: { getUuid: () => "MATERIAL-1" }
  };
  vm.runInNewContext(extractFunction("createStudyMaterial") + "\nthis.createMaterial=createStudyMaterial;", context);
  const result = context.createMaterial({ sessionToken:"valid", _verifiedUserId:"FORGED", _verifiedRole:"Administrador",
    aulaId:"AULA-1", titulo:"Material", archivoUrl:"https://example.invalid/material.pdf" });
  assert.equal(result.status, "success");
  assert.equal(materialRows[1][10], "PROF-1", "material author is derived from the signed session, not client identity fields");
}
{
  const materialRows = [
    ["ID","AulaID","Titulo","Descripcion","TipoRecurso","Parcial","Unidad","Tema","ArchivoUrl","DriveId","AutorID","FechaPublicacion","Estado"],
    ["MAT-1","AULA-1","Material","","PDF","I","","","","","PROF-2",new Date(),"Activo"]
  ];
  const materialSheet = {
    getDataRange: () => ({ getValues: () => materialRows.map(row => row.slice()) }),
    getRange: (row, col) => ({ setValue: value => { materialRows[row - 1][col - 1] = value; } })
  };
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ({}) },
    getVerifiedTaskIdentity_: payload => payload && payload.sessionToken === "valid"
      ? { authorized: true, userId: "PROF-1", role: "Profesor" }
      : { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" },
    getOrCreateSheet: () => materialSheet,
    isTaskServiceAdministrativeRole: role => ["Administrador","Desarrollador","Dirección","Secretaría"].includes(role),
    assertTaskServiceClassroomAccess: () => true
  };
  vm.runInNewContext(extractFunction("deleteStudyMaterial") + "\nthis.deleteMaterial=deleteStudyMaterial;", context);
  assert.throws(() => context.deleteMaterial({ sessionToken:"valid", _verifiedUserId:"PROF-2", _verifiedRole:"Administrador", materialId:"MAT-1" }),
    /El material no pertenece al docente/);
  assert.equal(materialRows[1][12], "Activo", "a forged administrative role cannot delete another teacher's material");
}

console.log("AUD-NG-158 task deadline history: verified actor, append-only history, reason, lock, rollback and cross-owner denial PASS.");
