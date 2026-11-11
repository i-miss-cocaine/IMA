"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });

function extractFunction(name) {
  const match = new RegExp("function\\s+" + name + "\\s*\\([^)]*\\)\\s*\\{").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && next === "/") { lineComment = true; i++; continue; }
    if (c === "/" && next === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
function fixture(options = {}) {
  const state = { opens: 0, lockAttempts: 0, releases: 0, identityCalls: 0, mutations: 0, held: false };
  const actor = { authorized: true, userId: "TEACHER-1", role: "Profesor" };
  const actors = options.actors || [actor, actor];
  const identity = () => actors[Math.min(state.identityCalls++, actors.length - 1)];
  const permission = () => ({ authorized: options.permission !== false });
  const scope = () => ({ authorized: options.scope !== false, institutionId: "I1", departmentIds: ["D1"] });
  const examSheet = { getDataRange: () => ({ getValues: () => [
    ["ID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "Tiempo", "Estado", "ProfesorID"],
    ["EXAM-1", "Examen", "Matemáticas", "10", "A", "", "", "Inactivo", "TEACHER-1"]
  ] }) };
  const context = new Function(
    "validateRolePermission", "getVerifiedExamIdentity_", "SpreadsheetApp", "SPREADSHEET_ID",
    "getVerifiedExamDepartmentScope_", "getSheetOrThrow", "assertExamResourceOwnershipForScope_",
    extractFunction("getAuthorizedExamMutationContext_") + "; return getAuthorizedExamMutationContext_;"
  )(permission, identity, { openById() { state.opens++; return {}; } }, "TEST", scope, () => examSheet, () => ({ authorized: true }));
  const lock = {
    tryLock() { state.lockAttempts++; if (options.timeout || state.held) return false; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const wrapper = new Function(
    "validateRolePermission", "getVerifiedExamIdentity_", "LockService", "getAuthorizedExamMutationContext_",
    extractFunction("withAuthorizedExamMutation_") + "; return withAuthorizedExamMutation_;"
  )(permission, identity, { getScriptLock: () => lock }, context);
  return {
    state,
    run() { return wrapper({ examenId: "EXAM-1" }, "updateExam", () => { state.mutations++; return { status: "success" }; }); },
    readContext() { return context({ examenId: "EXAM-1" }, "updateExam"); }
  };
}
let passed = 0;
function test(fn) { fn(); passed++; }
test(() => {
  const x = fixture({ permission: false });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.lockAttempts, 0);
  assert.equal(x.state.opens, 0);
});
for (const actor of [
  null, { authorized: false, userId: "T1", role: "Profesor" },
  { authorized: true, role: "Profesor" }, { authorized: true, userId: "", role: "Profesor" },
  { authorized: true, userId: "  ", role: "Profesor" }, { authorized: 1, userId: "T1", role: "Profesor" }
]) test(() => {
  const x = fixture({ actors: [actor] });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.lockAttempts, 0);
  assert.equal(x.state.opens, 0);
});
test(() => {
  const x = fixture({ actors: [{ authorized: true, userId: " ", role: "Profesor" }] });
  assert.throws(() => x.readContext(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.opens, 0);
});
test(() => {
  const x = fixture({ actors: [{ authorized: true, userId: "TEACHER-1", role: "Profesor" }, { authorized: true, role: "Profesor" }] });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.identityCalls, 2);
  assert.equal(x.state.lockAttempts, 1);
  assert.equal(x.state.opens, 0);
  assert.equal(x.state.releases, 1);
  assert.equal(x.state.held, false);
});
test(() => {
  const x = fixture();
  assert.deepEqual(x.run(), { status: "success" });
  assert.equal(x.state.opens, 1);
  assert.equal(x.state.mutations, 1);
  assert.equal(x.state.releases, 1);
  assert.equal(x.state.held, false);
});
test(() => {
  const x = fixture({ scope: false });
  assert.throws(() => x.run(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.state.releases, 1);
  assert.equal(x.state.held, false);
});
test(() => {
  const x = fixture({ timeout: true });
  assert.throws(() => x.run(), /EXAM_MUTATION_LOCK_TIMEOUT/);
  assert.equal(x.state.opens, 0);
  assert.equal(x.state.mutations, 0);
  assert.equal(x.state.releases, 0);
});

test(() => {
  const ownershipCheck = extractFunction("assertExamResourceOwnershipForScope_");
  const context = extractFunction("getAuthorizedExamMutationContext_");
  const wrapper = extractFunction("withAuthorizedExamMutation_");
  const deleteHandler = extractFunction("deleteExam");
  const deleteWorker = extractFunction("deleteExamUnlocked_");
  const state = { permissionCalls: 0, identityCalls: 0, opens: 0, lockAttempts: 0,
    releases: 0, held: false, writes: 0, deletes: 0 };
  const actors = [
    { authorized: true, userId: "TEACHER-1", role: "Profesor" },
    { authorized: true, userId: "   ", role: "Profesor" }
  ];
  const examRows = [
    ["ID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "Tiempo", "Estado", "ProfesorID"],
    ["EXAM-1", "Examen", "Matemáticas", "10", "A", "", "", "Inactivo", "TEACHER-1"]
  ];
  const ownershipRows = [
    ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
    ["OWN-1", "I1", "EXAMEN", "EXAM-1", "D1", "ACTIVE", "TEACHER-1", "", ""]
  ];
  const examSnapshot = JSON.stringify(examRows), ownershipSnapshot = JSON.stringify(ownershipRows);
  const examSheet = { getDataRange() { return { getValues() { return examRows; } }; },
    getRange() { return { setValue() { state.writes++; }, setValues() { state.writes++; } }; } };
  const ownershipSheet = { getDataRange() { return { getValues() { return ownershipRows; } }; },
    getRange() { return { setValue() { state.writes++; } }; } };
  const deliveriesSheet = { getDataRange() { return { getValues() { return [["EntregaID","ExamenID"], ["E-1","EXAM-1"]]; } }; } };
  const ss = { getSheetByName(name) {
    return ({ Examenes: examSheet, ResourceOwnership: ownershipSheet, EntregasExamen: deliveriesSheet })[name] || null;
  }};
  const lock = { tryLock() { state.lockAttempts++; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; } };
  const runtime = {
    validateRolePermission() { state.permissionCalls++; return { authorized: true }; },
    getVerifiedExamIdentity_() { return actors[Math.min(state.identityCalls++, actors.length - 1)]; },
    getVerifiedExamDepartmentScope_() { return { authorized: true, institutionId: "I1", departmentIds: ["D1"] }; },
    SpreadsheetApp: { openById() { state.opens++; return ss; } }, SPREADSHEET_ID: "SYNTHETIC",
    LockService: { getScriptLock() { return lock; } },
    getSheetOrThrow(sheet, name) { const value = sheet.getSheetByName(name); if (!value) throw new Error("missing " + name); return value; },
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new Map(), String, Error
  };
  const executable = [ownershipCheck, context, wrapper, deleteWorker, deleteHandler].join("\n");
  const remove = new Function("runtime", "with (runtime) { " + executable + "; return deleteExam; }")(runtime);
  assert.throws(() => remove({ examenId: "EXAM-1" }), /RESOURCE_NOT_AVAILABLE/,
    "deleteExam must reject the identity that loses its userId during context revalidation");
  assert.equal(state.permissionCalls, 2);
  assert.equal(state.identityCalls, 2);
  assert.equal(state.lockAttempts, 1);
  assert.equal(state.releases, 1);
  assert.equal(state.held, false);
  assert.equal(state.opens, 0);
  assert.equal(state.writes, 0);
  assert.equal(state.deletes, 0);
  assert.equal(JSON.stringify(examRows), examSnapshot);
  assert.equal(JSON.stringify(ownershipRows), ownershipSnapshot);
});



test(() => {
  const ownershipCheck = extractFunction("assertExamResourceOwnershipForScope_");
  const context = extractFunction("getAuthorizedExamMutationContext_");
  const wrapper = extractFunction("withAuthorizedExamMutation_");
  const deleteWorker = extractFunction("deleteExamUnlocked_");
  const deleteHandler = extractFunction("deleteExam");
  const state = { permissionCalls: 0, identityCalls: 0, opens: 0, lockAttempts: 0, releases: 0, held: false, writes: 0, deletes: 0 };
  const examRows = [["ID","Titulo","Asignatura","Grado","Seccion","FechaLimite","Tiempo","Estado","ProfesorID"],["EXAM-1","Examen","Matemáticas","10","A","","","Inactivo","TEACHER-1"]];
  const ownershipRows = [["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],["OWN-1","I1","EXAMEN","EXAM-1","D1","ACTIVE","TEACHER-1","",""]];
  const examSnapshot = JSON.stringify(examRows), ownershipSnapshot = JSON.stringify(ownershipRows);
  const actor = { authorized: true, userId: "TEACHER-1", role: "Profesor" };
  const examSheet = { getDataRange() { return { getValues() { return examRows; } }; }, getRange() { return { setValue() { state.writes++; }, setValues() { state.writes++; } }; } };
  const ownershipSheet = { getDataRange() { return { getValues() { return ownershipRows; } }; }, getRange() { return { setValue() { state.writes++; } }; } };
  const deliveriesSheet = { getDataRange() { return { getValues() { return [["EntregaID","ExamenID"],["E-1","EXAM-1"]]; } }; } };
  const ss = { getSheetByName(name) { return ({ Examenes: examSheet, ResourceOwnership: ownershipSheet, EntregasExamen: deliveriesSheet })[name] || null; } };
  const lock = { tryLock() { state.lockAttempts++; state.held = true; return true; }, releaseLock() { state.releases++; state.held = false; } };
  const runtime = {
    validateRolePermission() { state.permissionCalls++; return { authorized: state.permissionCalls === 1 }; },
    getVerifiedExamIdentity_() { state.identityCalls++; return actor; },
    getVerifiedExamDepartmentScope_() { return { authorized: true, institutionId: "I1", departmentIds: ["D1"] }; },
    SpreadsheetApp: { openById() { state.opens++; return ss; } }, SPREADSHEET_ID: "SYNTHETIC",
    LockService: { getScriptLock() { return lock; } },
    getSheetOrThrow(sheet, name) { const value = sheet.getSheetByName(name); if (!value) throw new Error("missing " + name); return value; },
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new Map(), String, Error
  };
  const executable = [ownershipCheck, context, wrapper, deleteWorker, deleteHandler].join("\n");
  const remove = new Function("runtime", "with (runtime) { " + executable + "; return deleteExam; }")(runtime);
  assert.throws(() => remove({ examenId: "EXAM-1" }), /RESOURCE_NOT_AVAILABLE/, "deleteExam must reject RBAC revoked during locked context revalidation");
  assert.equal(state.permissionCalls, 2);
  assert.equal(state.identityCalls, 1);
  assert.equal(state.lockAttempts, 1);
  assert.equal(state.releases, 1);
  assert.equal(state.held, false);
  assert.equal(state.opens, 0);
  assert.equal(state.writes, 0);
  assert.equal(state.deletes, 0);
  assert.equal(JSON.stringify(examRows), examSnapshot);
  assert.equal(JSON.stringify(ownershipRows), ownershipSnapshot);
});

test(() => {
  const ownershipCheck = extractFunction("assertExamResourceOwnershipForScope_");
  const context = extractFunction("getAuthorizedExamMutationContext_");
  const wrapper = extractFunction("withAuthorizedExamMutation_");
  const statusWorker = extractFunction("updateExamStatusUnlocked_");
  const statusHandler = extractFunction("updateExamStatus");
  const state = { permissionCalls: 0, identityCalls: 0, opens: 0,
    lockAttempts: 0, releases: 0, held: false, writes: 0 };
  const actors = [
    { authorized: true, userId: "TEACHER-1", role: "Profesor" },
    { authorized: true, userId: "   ", role: "Profesor" }
  ];
  const examRows = [
    ["ID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "Tiempo", "Estado", "ProfesorID"],
    ["EXAM-1", "Examen", "Matemáticas", "10", "A", "", "", "Inactivo", "TEACHER-1"]
  ];
  const examSnapshot = JSON.stringify(examRows);
  const examSheet = {
    getDataRange() { return { getValues() { return examRows; } }; },
    getRange() { return { setValue() { state.writes++; }, setValues() { state.writes++; } }; }
  };
  const ss = { getSheetByName(name) { return name === "Examenes" ? examSheet : null; } };
  const lock = {
    tryLock() { state.lockAttempts++; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const runtime = {
    validateRolePermission() { state.permissionCalls++; return { authorized: true }; },
    getVerifiedExamIdentity_() { return actors[Math.min(state.identityCalls++, actors.length - 1)]; },
    getVerifiedExamDepartmentScope_() { return { authorized: true, institutionId: "I1", departmentIds: ["D1"] }; },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    SPREADSHEET_ID: "SYNTHETIC",
    LockService: { getScriptLock() { return lock; } },
    getSheetOrThrow(sheet, name) { const value = sheet.getSheetByName(name); if (!value) throw new Error("missing " + name); return value; },
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new Map(), String, Error
  };
  const executable = [ownershipCheck, context, wrapper, statusWorker, statusHandler].join("\n");
  const update = new Function("runtime", "with (runtime) { " + executable + "; return updateExamStatus; }")(runtime);
  assert.throws(() => update({ examenId: "EXAM-1", estado: "Activo" }), /RESOURCE_NOT_AVAILABLE/,
    "updateExamStatus must reject identity that loses userId during locked context revalidation");
  assert.equal(state.permissionCalls, 2, "permission must be checked before and inside the lock");
  assert.equal(state.identityCalls, 2, "identity must be reverified after lock acquisition");
  assert.equal(state.lockAttempts, 1);
  assert.equal(state.releases, 1);
  assert.equal(state.held, false, "lock must be released after identity denial");
  assert.equal(state.opens, 0, "incomplete identity must be rejected before Sheets is opened");
  assert.equal(state.writes, 0, "status must not be written after identity denial");
  assert.equal(JSON.stringify(examRows), examSnapshot, "exam status must remain unchanged");
});


test(() => {
  const ownershipCheck = extractFunction("assertExamResourceOwnershipForScope_");
  const context = extractFunction("getAuthorizedExamMutationContext_");
  const wrapper = extractFunction("withAuthorizedExamMutation_");
  const updateWorker = extractFunction("updateExamUnlocked_");
  const updateHandler = extractFunction("updateExam");
  const state = { permissionCalls: 0, identityCalls: 0, opens: 0,
    lockAttempts: 0, releases: 0, held: false, writes: 0 };
  const actors = [
    { authorized: true, userId: "TEACHER-1", role: "Profesor" },
    { authorized: true, userId: "   ", role: "Profesor" }
  ];
  const examRows = [
    ["ID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "Tiempo", "Estado", "ProfesorID", "Parcial"],
    ["EXAM-1", "Examen", "Matemáticas", "10", "A", "2026-11-30", 45, "Inactivo", "TEACHER-1", "I"]
  ];
  const examSnapshot = JSON.stringify(examRows);
  const ownershipRows = [
    ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
    ["OWN-1", "I1", "EXAMEN", "EXAM-1", "D1", "ACTIVE", "TEACHER-1", "", ""]
  ];
  const examSheet = {
    getDataRange() { return { getValues() { return examRows; } }; },
    getRange() { return { setValue() { state.writes++; }, setValues() { state.writes++; } }; }
  };
  const ownershipSheet = { getDataRange() { return { getValues() { return ownershipRows; } }; } };
  const ss = { getSheetByName(name) {
    return ({ Examenes: examSheet, ResourceOwnership: ownershipSheet })[name] || null;
  }};
  const lock = {
    tryLock() { state.lockAttempts++; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const runtime = {
    validateRolePermission() { state.permissionCalls++; return { authorized: true }; },
    getVerifiedExamIdentity_() { return actors[Math.min(state.identityCalls++, actors.length - 1)]; },
    getVerifiedExamDepartmentScope_() { return { authorized: true, institutionId: "I1", departmentIds: ["D1"] }; },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    SPREADSHEET_ID: "SYNTHETIC",
    LockService: { getScriptLock() { return lock; } },
    getSheetOrThrow(sheet, name) { const value = sheet.getSheetByName(name); if (!value) throw new Error("missing " + name); return value; },
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new Map(), String, Error
  };
  const executable = [ownershipCheck, context, wrapper, updateWorker, updateHandler].join("\n");
  const update = new Function("runtime", "with (runtime) { " + executable + "; return updateExam; }")(runtime);
  assert.throws(() => update({
    examenId: "EXAM-1", titulo: "Título alterado", asignatura: "Ciencias",
    gradoAsignado: "11", seccionAsignada: "B", fechaLimite: "2026-12-15",
    tiempoLimite: 90, parcial: "II"
  }), /RESOURCE_NOT_AVAILABLE/,
    "updateExam must reject identity that loses userId during locked context revalidation");
  assert.equal(state.permissionCalls, 2, "permission must be checked before and inside the lock");
  assert.equal(state.identityCalls, 2, "identity must be reverified after lock acquisition");
  assert.equal(state.lockAttempts, 1);
  assert.equal(state.releases, 1);
  assert.equal(state.held, false, "lock must be released after identity denial");
  assert.equal(state.opens, 0, "incomplete identity must be rejected before Sheets is opened");
  assert.equal(state.writes, 0, "exam fields must not be written after identity denial");
  assert.equal(JSON.stringify(examRows), examSnapshot, "all exam fields must remain unchanged");
});


test(() => {
 const ownershipCheck=extractFunction("assertExamResourceOwnershipForScope_"), context=extractFunction("getAuthorizedExamMutationContext_"), wrapper=extractFunction("withAuthorizedExamMutation_"), worker=extractFunction("updateExamStatusUnlocked_"), handler=extractFunction("updateExamStatus");
 const state={permissionCalls:0,identityCalls:0,opens:0,lockAttempts:0,releases:0,held:false,writes:0};
 const rows=[["ID","Titulo","Asignatura","Grado","Seccion","FechaLimite","Tiempo","Estado","ProfesorID"],["EXAM-1","Examen","Matemáticas","10","A","","","Inactivo","TEACHER-1"]], snapshot=JSON.stringify(rows);
 const sheet={getDataRange(){return {getValues(){return rows;}}},getRange(){return {setValue(){state.writes++;},setValues(){state.writes++;}}}};
 const ss={getSheetByName(n){return n==="Examenes"?sheet:null;}};
 const lock={tryLock(){state.lockAttempts++;state.held=true;return true;},releaseLock(){state.releases++;state.held=false;}};
 const runtime={validateRolePermission(){state.permissionCalls++;return {authorized:state.permissionCalls===1};},
 getVerifiedExamIdentity_(){state.identityCalls++;return {authorized:true,userId:"TEACHER-1",role:"Profesor"};},
 getVerifiedExamDepartmentScope_(){return {authorized:true,institutionId:"I1",departmentIds:["D1"]};},
 SpreadsheetApp:{openById(){state.opens++;return ss;}},SPREADSHEET_ID:"SYNTHETIC",LockService:{getScriptLock(){return lock;}},
 getSheetOrThrow(s,n){const v=s.getSheetByName(n);if(!v)throw new Error("missing "+n);return v;},EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_:new Map(),String,Error};
 const executable=[ownershipCheck,context,wrapper,worker,handler].join("\n");
 const update=new Function("runtime","with (runtime) { "+executable+"; return updateExamStatus; }")(runtime);
 assert.throws(()=>update({examenId:"EXAM-1",estado:"Activo"}),/RESOURCE_NOT_AVAILABLE/,"RBAC revocation under lock must reject");
 assert.equal(state.permissionCalls,2);assert.equal(state.identityCalls,1);assert.equal(state.lockAttempts,1);assert.equal(state.releases,1);
 assert.equal(state.held,false);assert.equal(state.opens,0);assert.equal(state.writes,0);assert.equal(JSON.stringify(rows),snapshot);
});


test(() => {
  const ownershipCheck = extractFunction("assertExamResourceOwnershipForScope_");
  const context = extractFunction("getAuthorizedExamMutationContext_");
  const wrapper = extractFunction("withAuthorizedExamMutation_");
  const updateWorker = extractFunction("updateExamUnlocked_");
  const updateHandler = extractFunction("updateExam");
  const state = { permissionCalls: 0, identityCalls: 0, opens: 0,
    lockAttempts: 0, releases: 0, held: false, writes: 0 };
  const examRows = [
    ["ID", "Titulo", "Asignatura", "Grado", "Seccion", "FechaLimite", "Tiempo", "Estado", "ProfesorID", "Parcial"],
    ["EXAM-1", "Examen original", "Matemáticas", "10", "A", "2026-11-30", 45, "Inactivo", "TEACHER-1", "I"]
  ];
  const examSnapshot = JSON.stringify(examRows);
  const ownershipRows = [
    ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
    ["OWN-1", "I1", "EXAMEN", "EXAM-1", "D1", "ACTIVE", "TEACHER-1", "", ""]
  ];
  const examSheet = {
    getDataRange() { return { getValues() { return examRows; } }; },
    getRange() { return { setValue() { state.writes++; }, setValues() { state.writes++; } }; }
  };
  const ownershipSheet = { getDataRange() { return { getValues() { return ownershipRows; } }; } };
  const ss = { getSheetByName(name) {
    return ({ Examenes: examSheet, ResourceOwnership: ownershipSheet })[name] || null;
  }};
  const lock = {
    tryLock() { state.lockAttempts++; state.held = true; return true; },
    releaseLock() { state.releases++; state.held = false; }
  };
  const runtime = {
    validateRolePermission() {
      state.permissionCalls++;
      return { authorized: state.permissionCalls === 1 };
    },
    getVerifiedExamIdentity_() {
      state.identityCalls++;
      return { authorized: true, userId: "TEACHER-1", role: "Profesor" };
    },
    getVerifiedExamDepartmentScope_() {
      return { authorized: true, institutionId: "I1", departmentIds: ["D1"] };
    },
    SpreadsheetApp: { openById() { state.opens++; return ss; } },
    SPREADSHEET_ID: "SYNTHETIC",
    LockService: { getScriptLock() { return lock; } },
    getSheetOrThrow(sheet, name) {
      const value = sheet.getSheetByName(name);
      if (!value) throw new Error("missing " + name);
      return value;
    },
    EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_: new Map(),
    String, Error
  };
  const executable = [ownershipCheck, context, wrapper, updateWorker, updateHandler].join("\n");
  const update = new Function("runtime", "with (runtime) { " + executable + "; return updateExam; }")(runtime);
  assert.throws(() => update({
    examenId: "EXAM-1", titulo: "Título no autorizado", asignatura: "Ciencias",
    gradoAsignado: "11", seccionAsignada: "B", fechaLimite: "2026-12-15",
    tiempoLimite: 90, parcial: "II"
  }), /RESOURCE_NOT_AVAILABLE/, "updateExam must reject RBAC revoked during locked context revalidation");
  assert.equal(state.permissionCalls, 2, "RBAC must be checked in preflight and again under lock");
  assert.equal(state.identityCalls, 1, "revoked RBAC must stop before contextual identity lookup");
  assert.equal(state.lockAttempts, 1);
  assert.equal(state.releases, 1);
  assert.equal(state.held, false, "lock must be released after RBAC revocation");
  assert.equal(state.opens, 0, "revoked permission must be rejected before Sheets is opened");
  assert.equal(state.writes, 0, "no exam fields may be written after RBAC revocation");
  assert.equal(JSON.stringify(examRows), examSnapshot, "the complete exam row must remain unchanged");
});

process.stdout.write("exam-service-exam-mutation-security: " + passed + "/18 PASS\\n");
