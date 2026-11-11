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
    rows: options.badSchema ? [["wrong", "header"]] : (options.noAuditSheet ? [] : [["EventoID","EntregaExamenID","ExamenID","EstudianteID","ActorID","RolActor","Motivo","FechaSolicitud","Estado"]]),
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getLastRow() { return this.rows.length; },
    appendRow(row) { if (options.failAuditAppend) throw new Error("audit append failed"); this.rows.push(row.slice()); calls.auditRows.push(row.slice()); },
    getRange(row, col) { return { setValue(value) { if (options.failAuditUpdate) throw new Error("audit update failed"); audit.rows[row - 1][col - 1] = value; calls.auditUpdates.push(value); } }; }
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
      if (options.denied || payload.entregaId && payload.entregaId !== "EEX-1" ||
          payload.examenId && payload.examenId !== "EXM-1") throw new Error("RESOURCE_NOT_AVAILABLE");
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
  const x = fixture();
  x.call({ motivo: "  " + reason + "  " });
  assert.equal(x.calls.auditRows[0][6], reason, "reason is trimmed before audit persistence");
});
test(() => {
  const x = fixture();
  const result = x.call({ motivo: reason });
  const event = x.calls.auditRows[0];
  assert.equal(event.length, 9, "audit stores identifiers and metadata only, not answer payload");
  assert.equal(event.includes("[]"), false, "student answer JSON is not copied into the audit");
  assert.equal(result.eventoId, event[0]);
});
test(() => {
  const handler = extract("deleteExamSubmission");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  assert.ok(handler.includes('withAuthorizedExamSubmissionMutation_(payload, "deleteExamSubmission"'));
  assert.ok(wrapper.includes("LockService.getScriptLock()") && wrapper.includes("tryLock(5000)") &&
    wrapper.includes("getAuthorizedExamSubmissionMutationContext_(payload, action)") &&
    wrapper.includes("finally") && wrapper.includes("releaseLock()"));
});

function runSubmissionMutationWrapper(options = {}) {
  const events = [];
  let permissionCalls = 0, identityCalls = 0;
  const runtime = {
    validateRolePermission() {
      permissionCalls++; events.push("permission");
      return { authorized: !(options.preflightPermissionDenied || (options.contextPermissionDenied && permissionCalls > 1)) };
    },
    getVerifiedExamIdentity_() {
      identityCalls++; events.push("identity");
      return {
        authorized: !(options.preflightIdentityDenied || (options.contextIdentityDenied && identityCalls > 1)),
        userId: options.preflightEmptyUserId || (options.contextEmptyUserId && identityCalls > 1) ? "" : "ACTOR-1"
      };
    },
    LockService: { getScriptLock() {
      events.push("lock-request");
      return {
        tryLock() { events.push("lock-acquire"); return options.lockAvailable !== false; },
        releaseLock() { events.push("lock-release"); }
      };
    } },
    getAuthorizedExamSubmissionMutationContext_() {
      events.push("context");
      const permission = runtime.validateRolePermission();
      if (!permission.authorized) throw new Error("RESOURCE_NOT_AVAILABLE");
      const actor = runtime.getVerifiedExamIdentity_();
      if (!actor || actor.authorized !== true || !String(actor.userId || "").trim()) {
        throw new Error("RESOURCE_NOT_AVAILABLE");
      }
      return { actor };
    }
  };
  vm.runInNewContext(extract("withAuthorizedExamSubmissionMutation_") +
    "\nthis.invoke = withAuthorizedExamSubmissionMutation_;", runtime);
  return {
    events,
    call(mutation = () => "ok") { return runtime.invoke({}, "gradeExamSubmission", mutation); }
  };
}
test(() => {
  const x = runSubmissionMutationWrapper({ preflightPermissionDenied: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.events, ["permission"], "RBAC denial must happen before requesting the shared lock");
});
test(() => {
  const x = runSubmissionMutationWrapper({ preflightIdentityDenied: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.events, ["permission", "identity"], "invalid identity must not acquire the shared lock");
});
test(() => {
  const x = runSubmissionMutationWrapper();
  assert.equal(x.call(() => { x.events.push("mutation"); return "saved"; }), "saved");
  assert.deepEqual(x.events, ["permission", "identity", "lock-request", "lock-acquire", "context",
    "permission", "identity", "mutation", "lock-release"]);
});
test(() => {
  const x = runSubmissionMutationWrapper({ contextPermissionDenied: true });
  assert.throws(() => x.call(() => { x.events.push("mutation"); }), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.events, ["permission", "identity", "lock-request", "lock-acquire", "context",
    "permission", "lock-release"], "full authorization is rechecked under lock and lock is released on denial");
});
test(() => {
  const x = runSubmissionMutationWrapper();
  assert.throws(() => x.call(() => { x.events.push("mutation"); throw new Error("write failed"); }), /write failed/);
  assert.equal(x.events[x.events.length - 1], "lock-release", "lock is released after mutation failure");
});
test(() => {
  const x = runSubmissionMutationWrapper({ lockAvailable: false });
  assert.throws(() => x.call(), /EXAM_SUBMISSION_LOCK_TIMEOUT/);
  assert.deepEqual(x.events, ["permission", "identity", "lock-request", "lock-acquire"]);
});

test(() => {
  const x = runSubmissionMutationWrapper({ preflightEmptyUserId: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.events, ["permission", "identity"], "empty signed userId must be rejected before requesting the shared lock");
});
test(() => {
  const x = runSubmissionMutationWrapper({ contextEmptyUserId: true });
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.deepEqual(x.events, ["permission", "identity", "lock-request", "lock-acquire", "context",
    "permission", "identity", "lock-release"], "context must reject an empty signed userId and release the lock");
});
test(() => {
  const context = extract("getAuthorizedExamSubmissionMutationContext_");
  const identityCheck = context.indexOf('!String(actor.userId || "").trim()');
  const spreadsheetOpen = context.indexOf("SpreadsheetApp.openById(SPREADSHEET_ID)");
  assert.ok(identityCheck >= 0 && spreadsheetOpen > identityCheck,
    "context must reject an empty signed userId before opening Sheets");
});

test(() => {
  const context = extract("getAuthorizedExamSubmissionMutationContext_");
  const examContext = extract("getAuthorizedExamMutationContext_");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  const handler = extract("gradeExamSubmission");
  const events = [];
  let identityCalls = 0, spreadsheetOpens = 0, deliveryReads = 0, writes = 0;
  const deliverySheet = {
    getDataRange() {
      deliveryReads++;
      events.push("delivery-read");
      return { getValues() { return [["EntregaID","ExamenID","EstudianteID"], ["EEX-1","EXM-1","STU-1"]]; } };
    },
    getRange() { return { setValues() { writes++; } }; }
  };
  const ss = { getSheetByName(name) { events.push("sheet:" + name); return name === "EntregasExamen" ? deliverySheet : null; } };
  const runtime = {
    validateRolePermission(action) { events.push("permission:" + action); return { authorized: true }; },
    getVerifiedExamIdentity_() {
      identityCalls++;
      events.push("identity:" + identityCalls);
      return { authorized: true, userId: identityCalls < 3 ? "TEACHER-1" : "   ", role: "Profesor" };
    },
    LockService: { getScriptLock() { return {
      tryLock() { events.push("lock-acquire"); return true; },
      releaseLock() { events.push("lock-release"); }
    }; } },
    SpreadsheetApp: { openById() { spreadsheetOpens++; events.push("spreadsheet-open"); return ss; } },
    SPREADSHEET_ID: "SYNTHETIC-SHEET",
    getSheetOrThrow(sheet, name) { return sheet.getSheetByName(name); }
  };
  const executable = [examContext, context, wrapper, handler].join("\n");
  const grade = new Function("runtime", "with (runtime) { " + executable + "; return gradeExamSubmission; }")(runtime);
  let error;
  try {
    grade({ entregaId: "EEX-1", examenId: "EXM-1", calificacion: 90, estado: "Calificado" });
  } catch (e) { error = e.message; }
  assert.equal(error, "RESOURCE_NOT_AVAILABLE",
    "nested exam ownership revalidation must reject an identity that becomes incomplete");
  assert.equal(identityCalls, 3, "preflight, delivery context and nested exam context must each verify identity");
  assert.equal(spreadsheetOpens, 1, "the nested context must reject before opening Sheets a second time");
  assert.equal(deliveryReads, 1, "only the delivery lookup needed to resolve its exam may occur before nested revalidation");
  assert.equal(writes, 0, "the rejected grade must not mutate the delivery");
  assert.equal(events[events.length - 1], "lock-release", "the shared lock must be released after nested identity denial");
});


test(() => {
  const examContext = extract("getAuthorizedExamMutationContext_");
  const deliveryContext = extract("getAuthorizedExamSubmissionMutationContext_");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  const handler = extract("gradeExamSubmission");
  const events = [];
  const permissionResults = [true, true, false];
  let permissionIndex = 0, identityCalls = 0, spreadsheetOpens = 0, deliveryReads = 0, writes = 0;
  const deliverySheet = {
    getDataRange() {
      deliveryReads++;
      events.push("delivery-read");
      return { getValues() { return [["EntregaID","ExamenID","EstudianteID"], ["EEX-1","EXM-1","STU-1"]]; } };
    },
    getRange() { return { setValues() { writes++; events.push("delivery-write"); } }; }
  };
  const ss = { getSheetByName(name) { events.push("sheet:" + name); return name === "EntregasExamen" ? deliverySheet : null; } };
  const runtime = {
    validateRolePermission(action) {
      const authorized = permissionResults[Math.min(permissionIndex++, permissionResults.length - 1)] === true;
      events.push("permission:" + action + ":" + permissionIndex);
      return { authorized };
    },
    getVerifiedExamIdentity_() {
      identityCalls++;
      events.push("identity:" + identityCalls);
      return { authorized: true, userId: "TEACHER-1", role: "Profesor" };
    },
    LockService: { getScriptLock() { return {
      tryLock() { events.push("lock-acquire"); return true; },
      releaseLock() { events.push("lock-release"); }
    }; } },
    SpreadsheetApp: { openById() { spreadsheetOpens++; events.push("spreadsheet-open"); return ss; } },
    SPREADSHEET_ID: "SYNTHETIC-SHEET",
    getSheetOrThrow(sheet, name) { return sheet.getSheetByName(name); }
  };
  const executable = [examContext, deliveryContext, wrapper, handler].join("\n");
  const grade = new Function("runtime", "with (runtime) { " + executable + "; return gradeExamSubmission; }")(runtime);
  let error;
  try {
    grade({ entregaId: "EEX-1", examenId: "EXM-1", calificacion: 90, estado: "Calificado" });
  } catch (e) { error = e.message; }
  assert.equal(error, "RESOURCE_NOT_AVAILABLE",
    "nested exam RBAC revocation must reject the grade mutation");
  assert.deepEqual(events, [
    "permission:gradeExamSubmission:1", "identity:1", "lock-acquire",
    "permission:gradeExamSubmission:2", "identity:2", "spreadsheet-open",
    "sheet:EntregasExamen", "delivery-read", "permission:gradeExamSubmission:3", "lock-release"
  ]);
  assert.equal(permissionIndex, 3, "preflight, delivery context and nested exam context must each check RBAC");
  assert.equal(identityCalls, 2, "nested RBAC denial must occur before a third identity check");
  assert.equal(spreadsheetOpens, 1, "nested RBAC denial must occur before a second Sheets open");
  assert.equal(deliveryReads, 1, "only the delivery lookup may occur before nested exam revalidation");
  assert.equal(writes, 0, "the rejected grade must not mutate the delivery");
  assert.equal(events[events.length - 1], "lock-release", "the shared lock must be released after nested RBAC denial");
});


test(() => {
  const auditHelper = extract("getOrCreateExamSubmissionDeletionAuditSheet_");
  const examContext = extract("getAuthorizedExamMutationContext_");
  const deliveryContext = extract("getAuthorizedExamSubmissionMutationContext_");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  const handler = extract("deleteExamSubmission");
  const events = [];
  let permissionCalls = 0, identityCalls = 0, spreadsheetOpens = 0;
  let deliveryReads = 0, deleted = 0, auditCreated = 0;
  const deliverySheet = {
    getDataRange() {
      deliveryReads++;
      events.push("delivery-read");
      return { getValues() { return [["EntregaID","ExamenID","EstudianteID"], ["EEX-1","EXM-1","STU-1","2026-11-11","[]","95.00","Calificado"]]; } };
    },
    deleteRow() { deleted++; events.push("delivery-delete"); }
  };
  const ss = {
    getSheetByName(name) {
      events.push("sheet:" + name);
      return name === "EntregasExamen" ? deliverySheet : null;
    },
    insertSheet() { auditCreated++; throw new Error("audit must not be created"); }
  };
  const runtime = {
    validateRolePermission(action) {
      permissionCalls++;
      events.push("permission:" + action + ":" + permissionCalls);
      return { authorized: true };
    },
    getVerifiedExamIdentity_() {
      identityCalls++;
      events.push("identity:" + identityCalls);
      return { authorized: true, userId: identityCalls < 3 ? "ADMIN-1" : "   ", role: "Administrador" };
    },
    LockService: { getScriptLock() { return {
      tryLock() { events.push("lock-acquire"); return true; },
      releaseLock() { events.push("lock-release"); }
    }; } },
    SpreadsheetApp: { openById() { spreadsheetOpens++; events.push("spreadsheet-open"); return ss; } },
    SPREADSHEET_ID: "SYNTHETIC-SHEET",
    getSheetOrThrow(sheet, name) { return sheet.getSheetByName(name); },
    Utilities: { getUuid() { return "UUID-EVENT-1"; } },
    Date, String, Error
  };
  const executable = [auditHelper, examContext, deliveryContext, wrapper, handler].join("\n");
  const remove = new Function("runtime", "with (runtime) { " + executable + "; return deleteExamSubmission; }")(runtime);
  let error;
  try {
    remove({ entregaId: "EEX-1", examenId: "EXM-1", motivo: "Solicitud administrativa documentada." });
  } catch (e) { error = e.message; }
  assert.equal(error, "RESOURCE_NOT_AVAILABLE",
    "nested exam ownership revalidation must reject an identity that becomes incomplete");
  assert.equal(permissionCalls, 3, "preflight, delivery context and nested exam context must each recheck permission");
  assert.equal(identityCalls, 3, "preflight, delivery context and nested exam context must each verify identity");
  assert.equal(spreadsheetOpens, 1, "nested identity denial must occur before a second Sheets open");
  assert.equal(deliveryReads, 1, "only the delivery lookup needed to resolve examId may occur");
  assert.equal(deleted, 0, "the rejected delete must not remove the delivery row");
  assert.equal(auditCreated, 0, "the rejected delete must not create an audit sheet");
  assert.equal(events.includes("sheet:HistorialEliminacionesEntregasExamen"), false,
    "audit history must not be accessed after nested identity denial");
  assert.equal(events[events.length - 1], "lock-release", "the shared lock must be released after nested identity denial");
});


test(() => {
  const examContext = extract("getAuthorizedExamMutationContext_");
  const deliveryContext = extract("getAuthorizedExamSubmissionMutationContext_");
  const wrapper = extract("withAuthorizedExamSubmissionMutation_");
  const auditHelper = extract("getOrCreateExamSubmissionDeletionAuditSheet_");
  const handler = extract("deleteExamSubmission");
  const events = [];
  const permissionResults = [true, true, false];
  let permissionIndex = 0, identityCalls = 0, spreadsheetOpens = 0;
  let deliveryReads = 0, deleted = 0, auditCreated = 0;
  const deliverySheet = {
    getDataRange() {
      deliveryReads++;
      events.push("delivery-read");
      return { getValues() { return [["EntregaID","ExamenID","EstudianteID"], ["EEX-1","EXM-1","STU-1","2026-11-11","[]","95.00","Calificado"]]; } };
    },
    deleteRow() { deleted++; events.push("delivery-delete"); }
  };
  const ss = {
    getSheetByName(name) {
      events.push("sheet:" + name);
      return name === "EntregasExamen" ? deliverySheet : null;
    },
    insertSheet() { auditCreated++; throw new Error("audit must not be created"); }
  };
  const runtime = {
    validateRolePermission(action) {
      const authorized = permissionResults[Math.min(permissionIndex++, permissionResults.length - 1)] === true;
      events.push("permission:" + action + ":" + permissionIndex);
      return { authorized };
    },
    getVerifiedExamIdentity_() {
      identityCalls++;
      events.push("identity:" + identityCalls);
      return { authorized: true, userId: "ADMIN-1", role: "Administrador" };
    },
    LockService: { getScriptLock() { return {
      tryLock() { events.push("lock-acquire"); return true; },
      releaseLock() { events.push("lock-release"); }
    }; } },
    SpreadsheetApp: { openById() { spreadsheetOpens++; events.push("spreadsheet-open"); return ss; } },
    SPREADSHEET_ID: "SYNTHETIC-SHEET",
    getSheetOrThrow(sheet, name) { return sheet.getSheetByName(name); },
    Utilities: { getUuid() { return "UUID-EVENT-1"; } },
    Date, String, Error
  };
  const executable = [examContext, deliveryContext, wrapper, auditHelper, handler].join("\n");
  const remove = new Function("runtime", "with (runtime) { " + executable + "; return deleteExamSubmission; }")(runtime);
  let error;
  try {
    remove({ entregaId: "EEX-1", examenId: "EXM-1", motivo: "Solicitud administrativa documentada." });
  } catch (e) { error = e.message; }
  assert.equal(error, "RESOURCE_NOT_AVAILABLE",
    "nested exam RBAC revocation must reject the deletion mutation");
  assert.deepEqual(events, [
    "permission:deleteExamSubmission:1", "identity:1", "lock-acquire",
    "permission:deleteExamSubmission:2", "identity:2", "spreadsheet-open",
    "sheet:EntregasExamen", "delivery-read", "permission:deleteExamSubmission:3", "lock-release"
  ]);
  assert.equal(permissionIndex, 3, "preflight, delivery context and nested exam context must each check RBAC");
  assert.equal(identityCalls, 2, "nested RBAC denial must occur before a third identity check");
  assert.equal(spreadsheetOpens, 1, "nested RBAC denial must occur before a second Sheets open");
  assert.equal(deliveryReads, 1, "only the delivery lookup may occur before nested exam revalidation");
  assert.equal(deleted, 0, "the rejected delete must not remove the delivery");
  assert.equal(auditCreated, 0, "the rejected delete must not create an audit sheet");
  assert.equal(events.includes("sheet:HistorialEliminacionesEntregasExamen"), false,
    "audit history must not be accessed after nested RBAC denial");
  assert.equal(events[events.length - 1], "lock-release", "the shared lock must be released after nested RBAC denial");
});

console.log("exam-service-delete-submission-audit: " + scenarios + "/" + scenarios + " PASS");
