"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "function exists: " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
const helpers = [extract("getOrCreateExamSubmissionDeletionAuditSheet_"), extract("deleteExamSubmission")].join("\n");
let scenarios = 0;
function test(fn) { fn(); scenarios++; }
function fixture(options = {}) {
  const calls = { deleted: 0, auditRows: [], auditUpdates: [], auditCreated: false, action: null };
  const audit = {
    rows: options.badSchema ? [["wrong", "header"]] : [["EventoID","EntregaExamenID","ExamenID","EstudianteID","ActorID","RolActor","Motivo","FechaSolicitud","Estado"]],
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) { if (options.failAuditAppend) throw new Error("audit append failed"); this.rows.push(row.slice()); calls.auditRows.push(row.slice()); },
    getRange(row, col) { return { setValue(value) { if (options.failAuditUpdate) throw new Error("audit update failed"); this.rows[row - 1][col - 1] = value; calls.auditUpdates.push(value); } }; }
  };
  const delivery = {
    deleteRow() { calls.deleted++; if (options.failDelete) throw new Error("delete failed"); }
  };
  const ss = {
    getSheetByName(name) { return name === "HistorialEliminacionesEntregasExamen" ? (options.noAuditSheet ? null : audit) : null; },
    insertSheet(name) { calls.auditCreated = true; if (options.failCreate) throw new Error("create failed"); return audit; }
  };
  const context = {
    withAuthorizedExamSubmissionMutation_(payload, action, callback) {
      calls.action = action;
      if (options.denied) throw new Error("RESOURCE_NOT_AVAILABLE");
      return callback({
        ss, actor: { userId: "ADMIN-1", role: "Administrador" },
        examId: "EXM-1", entregaId: "EEX-1",
        delivery: { row: ["EEX-1","EXM-1","STU-1",new Date(),"[]","95.00","Calificado"], rowIndex: 1 },
        deliverySheet: delivery
      });
    },
    Utilities: { getUuid() { return "UUID-EVENT-1"; } },
    Date, String, Error
  };
  vm.runInNewContext(helpers + "\nthis.deleteExamSubmission = deleteExamSubmission;", context);
  return { calls, call(payload) { return context.deleteExamSubmission(payload); }, audit };
}
const reason = "Solicitud administrativa documentada.";
test(() => {
  const x = fixture(), result = x.call({ motivo: reason });
  assert.equal(result.status, "success");
  assert.equal(result.eventoId, "UUID-EVENT-1");
  assert.equal(x.calls.action, "deleteExamSubmission");
  assert.equal(x.calls.deleted, 1);
  assert.equal(x.calls.auditRows.length, 1);
  assert.deepEqual(Array.from(x.calls.auditRows[0]), ["UUID-EVENT-1","EEX-1","EXM-1","STU-1","ADMIN-1","Administrador",reason,x.calls.auditRows[0][7],"DELETE_REQUESTED"]);
  assert.deepEqual(x.calls.auditUpdates, ["DELETED"]);
});
test(() => { const x=fixture(); assert.throws(()=>x.call({motivo:"corto"}),/EXAM_SUBMISSION_DELETION_REASON_INVALID/); assert.equal(x.calls.deleted,0); assert.equal(x.calls.auditRows.length,0); });
test(() => { const x=fixture(); assert.throws(()=>x.call({motivo:"x".repeat(2001)}),/EXAM_SUBMISSION_DELETION_REASON_INVALID/); assert.equal(x.calls.deleted,0); });
test(() => { const x=fixture(); assert.throws(()=>x.call({motivo:7}),/EXAM_SUBMISSION_DELETION_REASON_INVALID/); assert.equal(x.calls.deleted,0); });
test(() => { const x=fixture({denied:true}); assert.throws(()=>x.call({motivo:reason}),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.calls.deleted,0); assert.equal(x.calls.auditRows.length,0); });
test(() => { const x=fixture({badSchema:true}); assert.throws(()=>x.call({motivo:reason}),/EXAM_SUBMISSION_DELETION_AUDIT_SCHEMA_INVALID/); assert.equal(x.calls.deleted,0); });
test(() => { const x=fixture({noAuditSheet:true}); x.call({motivo:reason}); assert.equal(x.calls.auditCreated,true); assert.equal(x.calls.deleted,1); assert.equal(x.calls.auditUpdates[0],"DELETED"); });
test(() => { const x=fixture({failCreate:true,noAuditSheet:true}); assert.throws(()=>x.call({motivo:reason}),/create failed/); assert.equal(x.calls.deleted,0); });
test(() => { const x=fixture({failAuditAppend:true}); assert.throws(()=>x.call({motivo:reason}),/audit append failed/); assert.equal(x.calls.deleted,0); });
test(() => { const x=fixture({failDelete:true}); assert.throws(()=>x.call({motivo:reason}),/delete failed/); assert.equal(x.calls.deleted,1); assert.deepEqual(x.calls.auditUpdates,["DELETE_FAILED"]); });
test(() => { const x=fixture({failDelete:true,failAuditUpdate:true}); assert.throws(()=>x.call({motivo:reason}),/EXAM_SUBMISSION_DELETION_AUDIT_UPDATE_FAILED/); assert.equal(x.calls.auditRows.length,1); });
test(() => { const x=fixture({failAuditUpdate:true}); assert.throws(()=>x.call({motivo:reason}),/EXAM_SUBMISSION_DELETION_AUDIT_FINALIZATION_FAILED/); assert.equal(x.calls.deleted,1); });
test(() => { const x=fixture(); assert.throws(()=>x.call({motivo:reason,entregaId:"EEX-OTHER"}),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.calls.deleted,0); });
test(() => { const x=fixture(); assert.throws(()=>x.call({motivo:reason,examenId:"EXM-OTHER"}),/RESOURCE_NOT_AVAILABLE/); assert.equal(x.calls.deleted,0); });
test(() => {
  const handler = extract("deleteExamSubmission");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  assert.ok(handler.includes('withAuthorizedExamSubmissionMutation_(payload, "deleteExamSubmission"'));
  assert.ok(wrapper.includes("LockService.getScriptLock()") && wrapper.includes("tryLock(5000)") &&
    wrapper.includes("getAuthorizedExamSubmissionMutationContext_(payload, action)") &&
    wrapper.includes("finally") && wrapper.includes("releaseLock()"));
});
console.log("exam-service-delete-submission-audit: " + scenarios + "/" + scenarios + " PASS");
