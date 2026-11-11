"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "\x60") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const OH = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
function makeSheet(rows, options = {}) {
  return {
    rows: rows.map(row => row.slice()), writes: 0,
    getLastRow() { return this.rows.length; },
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    appendRow(row) {
      this.rows.push(row.slice());
      if (options.failAppendAfterWrite) { options.failAppendAfterWrite = false; throw new Error("append persisted then failed"); }
      if (options.failAppend) throw new Error("append failed");
    },
    getRange(startRow, startCol, rowCount, colCount) {
      return { setValues: values => {
        this.writes++;
        if (options.failWrite) throw new Error("write failed");
        for (let r = 0; r < rowCount; r++) {
          if (!this.rows[startRow - 1 + r]) this.rows[startRow - 1 + r] = [];
          for (let c = 0; c < colCount; c++) this.rows[startRow - 1 + r][startCol - 1 + c] = values[r][c];
        }
      }};
    },
    deleteRow(index) { this.rows.splice(index - 1, 1); }
  };
}
function fixture(options = {}) {
  const stats = { permissionCalls: 0, action: "", acquired: 0, released: 0, opened: 0, held: false, events: [] };
  const sheets = {
    Examenes: makeSheet([["ID","Titulo","Asignatura","Grado","Seccion","FechaLimite","Tiempo","Estado","ProfesorID","Parcial"]], { failAppend: options.failExamAppend }),
    PreguntasExamen: makeSheet([["ID","ExamenID","Tipo","Texto","Opciones","Respuesta"]], { failWrite: options.failQuestionWrite }),
    ResourceOwnership: makeSheet([OH], { failAppendAfterWrite: options.failOwnershipAppendAfterWrite, failAppend: options.failOwnershipAppend })
  };
  let uuid = 0;
  const runtime = {
    SPREADSHEET_ID: "TEST",
    validateRolePermission(action) { stats.events.push("rbac"); stats.permissionCalls++; stats.action = action; const allowed = Array.isArray(options.permissions) ? options.permissions.shift() : options.permissionDenied !== true; return { authorized: allowed !== false }; },
    getVerifiedExamIdentity_() { stats.events.push("identity"); if (Array.isArray(options.actors)) return options.actors.shift(); if (options.invalidIdentity) return { authorized: false, userId: "P1", role: "Profesor" }; if (options.actor !== undefined) return options.actor; return { authorized: true, userId: "P1", role: "Profesor" }; },
    getVerifiedExamDepartmentScope_() { stats.events.push("scope"); return options.invalidScope ? { authorized: false } : { authorized: true, institutionId: "I1", departmentIds: ["D1"] }; },
    SpreadsheetApp: { openById() { stats.events.push("sheets"); stats.opened++; return { getSheetByName: name => sheets[name] || null }; } },
    getSheetOrThrow(ss, name) { const sheet = ss.getSheetByName(name); if (!sheet) throw new Error("missing " + name); return sheet; },
    LockService: { getScriptLock: () => ({
      tryLock() { stats.events.push("lock"); stats.acquired++; if (options.lockTimeout || stats.held) return false; stats.held = true; return true; },
      releaseLock() { stats.released++; stats.held = false; }
    })},
    Utilities: { getUuid() { uuid++; return "UUID-" + uuid; } },
    Date
  };
  vm.runInNewContext(extract("withAuthorizedExamCreation_") + "\n" + extract("createExamUnlocked_") + "\n" + extract("createExam"), runtime);
  return { runtime, sheets, stats, call(payload = {}) { return runtime.createExam(Object.assign({
    sessionToken: "signed", departmentId: "D1", titulo: "Evaluación", asignatura: "Matemáticas",
    gradoAsignado: "10", seccionAsignada: "A", fechaLimite: "2026-11-20",
    preguntas: [{ preguntaTipo: "opcion_multiple", textoPregunta: "2+2", opciones: { a: "4" }, respuestaCorrecta: "a" }]
  }, payload)); }};
}
let scenarios = 0;
function test(fn) { fn(); scenarios++; }
test(() => {
  const x = fixture(), result = x.call();
  assert.equal(result.status, "success");
  assert.equal(x.stats.action, "createExam");
  assert.equal(x.stats.permissionCalls, 2);
  assert.deepEqual(x.stats.events, ["rbac","identity","lock","rbac","identity","sheets","scope"]);
  assert.equal(x.sheets.Examenes.rows.length, 2);
  assert.equal(x.sheets.ResourceOwnership.rows.length, 2);
  assert.equal(x.sheets.PreguntasExamen.rows.length, 2);
  assert.equal(x.sheets.PreguntasExamen.rows[1][1], result.examenId);
  assert.equal(x.sheets.ResourceOwnership.rows[1][3], result.examenId);
  assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held],[1,1,false]);
});
test(() => { const x=fixture({permissionDenied:true}); assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.stats.opened,0); assert.equal(x.stats.acquired,0); });
test(() => { const x=fixture({invalidIdentity:true}); assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.stats.opened,0); });
test(() => { const x=fixture({actor:{authorized:true,role:"Profesor"}}); assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.stats.opened,0); assert.equal(x.stats.acquired,0); });
test(() => { const x=fixture({actor:{authorized:true,userId:" ",role:"Profesor"}}); assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.stats.opened,0); assert.equal(x.stats.acquired,0); });
test(() => { const x=fixture({invalidScope:true}); assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/); assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held,x.stats.opened],[1,1,false,1]); });
test(() => { const x=fixture({lockTimeout:true}); assert.throws(()=>x.call(),/EXAM_CREATE_LOCK_TIMEOUT/); assert.equal(x.sheets.Examenes.rows.length,1); assert.equal(x.sheets.ResourceOwnership.rows.length,1); });
test(() => { const x=fixture({failOwnershipAppendAfterWrite:true}); assert.throws(()=>x.call(),/append persisted then failed/); assert.equal(x.sheets.ResourceOwnership.rows.length,1); assert.equal(x.sheets.Examenes.rows.length,1); assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held],[1,1,false]); });
test(() => { const x=fixture({failExamAppend:true}); assert.throws(()=>x.call(),/append failed/); assert.equal(x.sheets.Examenes.rows.length,1); assert.equal(x.sheets.ResourceOwnership.rows.length,1); assert.equal(x.sheets.PreguntasExamen.rows.length,1); });
test(() => { const x=fixture({failQuestionWrite:true}); assert.throws(()=>x.call(),/write failed/); assert.equal(x.sheets.Examenes.rows.length,1); assert.equal(x.sheets.ResourceOwnership.rows.length,1); assert.equal(x.sheets.PreguntasExamen.rows.length,1); });
test(() => { const x=fixture(); assert.throws(()=>x.call({departmentId:"D2"}),/RESOURCE_SCOPE_DENIED/); assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held],[1,1,false]); });
test(() => { const x=fixture(); x.sheets.ResourceOwnership.rows[0]=["wrong"]; assert.throws(()=>x.call(),/RESOURCE_OWNERSHIP_SCHEMA_INVALID/); assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held],[1,1,false]); });
test(() => {
 const x=fixture({actors:[{authorized:true,userId:"P1",role:"Profesor"},{authorized:true,userId:"   ",role:"Profesor"}]});
 assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);
 assert.deepEqual(x.stats.events,["rbac","identity","lock","rbac","identity"]);
 assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held,x.stats.opened],[1,1,false,0]);
 assert.deepEqual([x.sheets.Examenes.rows.length,x.sheets.PreguntasExamen.rows.length,x.sheets.ResourceOwnership.rows.length],[1,1,1]);
});
test(() => {
 const x=fixture({permissions:[true,false]});
 assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);
 assert.deepEqual(x.stats.events,["rbac","identity","lock","rbac"]);
 assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held,x.stats.opened],[1,1,false,0]);
});
console.log("exam-service-create-exam-security: " + scenarios + "/" + scenarios + " PASS");
