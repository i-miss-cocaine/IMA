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
const AH = ["ID","Fecha","Parcial","Grado","Sección","Asignatura","Unidad","Tema","profesorId"];
const KH = ["ID","Asignatura","NombreCategoria","Ponderacion","Grado","Seccion","Periodo","FechaRegistro"];
const OH = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
function makeSheet(rows, options = {}) {
  return {
    rows: rows.map(row => row.slice()), writes: 0, failWrite: options.failWrite === true,
    getLastRow() { return this.rows.length; },
    getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; },
    getRange(startRow, startCol, rowCount, colCount) {
      return { setValues: values => {
        this.writes++;
        if (this.failWrite) throw new Error("write failed");
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
  const actor = options.actor || { authorized: true, userId: "P1", role: "Profesor" };
  const actors = options.actors || [actor];
  let identityCalls = 0;
  const scope = options.scope || { authorized: true, institutionId: "I1", institutionWide: false, departmentIds: ["D1"] };
  const sourceAssignment = ["A1", new Date(), "P1", "10", "A", "Matemáticas", "", "", "P1"];
  const destinationAssignment = ["A2", new Date(), "P1", "10", "B", "Matemáticas", "", "", "P1"];
  if (options.foreignSource) sourceAssignment[8] = "P2";
  if (options.foreignDestination) destinationAssignment[8] = "P2";
  const assignments = [AH.slice(), sourceAssignment, destinationAssignment];
  if (options.duplicateDestination) assignments.push(destinationAssignment.slice());
  const categoryHeader = options.canonicalSchema
    ? ["ID","Nombre","Ambito","PorcentajePonderacion","EscalaID","Estado"] : KH.slice();
  const categories = [categoryHeader];
  if (!options.noCategories) categories.push(["CAT-SRC-1","Matemáticas","Tarea",20,"10","A","P1",new Date()]);
  if (options.duplicateCategoryId) categories.push(categories[1].slice());
  const ownership = [OH.slice()];
  if (!options.noOwnership) ownership.push(["OWN-SRC-1","I1","CATEGORIA_EVALUACION","CAT-SRC-1",options.ownerDepartment || "D1","ACTIVE","P1",new Date().toISOString(),new Date().toISOString()]);
  if (options.duplicateOwnership) ownership.push(ownership[1].slice());
  if (options.duplicateOwnershipId) ownership.push(["OWN-SRC-1","I1","CATEGORIA_EVALUACION","CAT-OTHER","D1","INACTIVE","P1","t","t"]);
  if (options.badCategory) categories[1][3] = "invalid";
  const sheets = {
    ConfiguracionAcademica: makeSheet(assignments),
    CategoriasEvaluacion: makeSheet(categories, { failWrite: options.failCategoryWrite }),
    ResourceOwnership: makeSheet(ownership)
  };
  const stats = { acquired: 0, released: 0, held: false, opens: 0, action: "", reentryError: "", events: [] };
  let uuid = 0;
  const runtime = {
    SPREADSHEET_ID: "TEST",
    LockService: { getScriptLock: () => { stats.events.push("getScriptLock"); return {
      tryLock() { stats.events.push("tryLock"); stats.acquired++; if (options.lockTimeout || stats.held) return false; stats.held = true; return true; },
      releaseLock() { stats.events.push("releaseLock"); stats.released++; stats.held = false; }
    }; }},
    validateRolePermission(action) { stats.events.push("rbac"); stats.action = action; return { authorized: options.permissionDenied !== true }; },
    getVerifiedExamIdentity_() {
      stats.events.push("identity");
      identityCalls++;
      return options.invalidIdentity ? { authorized: false } : actors[Math.min(identityCalls - 1, actors.length - 1)];
    },
    getVerifiedExamDepartmentScope_() { return options.invalidScope ? { authorized: false } : scope; },
    SpreadsheetApp: { openById() { stats.events.push("openById"); stats.opens++; if (options.reenter && stats.opens === 1) { try { runtime.run(payload); } catch (error) { stats.reentryError = String(error); } } return { getSheetByName: name => sheets[name] || null }; } },
    getSheetOrThrow(ss, name) { const sheet = ss.getSheetByName(name); if (!sheet) throw new Error("missing " + name); return sheet; },
    normalizeString(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); },
    Utilities: { getUuid() { uuid++; return options.uuid || "U" + uuid; } }
  };
  const names = ["copyEvaluationSetupBetweenGroups","withAuthorizedEvaluationSetupCopy_","getAuthorizedEvaluationSetupCopyContext_","copyEvaluationSetupBetweenGroupsUnlocked_"];
  vm.runInNewContext(names.map(extract).join("\n") + "\nthis.run=copyEvaluationSetupBetweenGroups;", runtime);
  const payload = {
    sessionToken: "signed", grupoOrigen: { asignatura: "Matemáticas", grado: "10", seccion: "A", periodo: "P1" },
    grupoDestino: { asignatura: "Matemáticas", grado: "10", seccion: "B", periodo: "P1" }
  };
  return { runtime, sheets, stats, payload, identityCalls: () => identityCalls, call(overrides = {}) { return runtime.run(Object.assign({}, payload, overrides)); } };
}
let scenarios = 0;
function test(fn) { fn(); scenarios++; }
test(() => {
  const x = fixture(), result = x.call();
  assert.equal(result.status, "success");
  assert.equal(result.categoriasCopias, 1);
  assert.equal(x.sheets.CategoriasEvaluacion.rows.length, 3);
  assert.equal(x.sheets.CategoriasEvaluacion.rows[2][1], "Matemáticas");
  assert.equal(x.sheets.CategoriasEvaluacion.rows[2][4], "10");
  assert.equal(x.sheets.CategoriasEvaluacion.rows[2][5], "B");
  assert.equal(x.sheets.CategoriasEvaluacion.rows[2][6], "P1");
  assert.equal(x.sheets.ResourceOwnership.rows.length, 3);
  assert.equal(x.sheets.ResourceOwnership.rows[2][3], x.sheets.CategoriasEvaluacion.rows[2][0]);
  assert.equal(x.stats.action, "copyEvaluationSetupBetweenGroups");
  assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held,x.stats.opens],[1,1,false,1]);
});
test(() => { const x=fixture({noCategories:true}),r=x.call();assert.equal(r.categoriasCopias,0);assert.equal(x.sheets.ResourceOwnership.writes,0); });
test(() => assert.throws(() => fixture({permissionDenied:true}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({invalidIdentity:true}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({actor:{authorized:true,userId:"D1",role:"Director"}}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({invalidScope:true}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({foreignSource:true}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({foreignDestination:true}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({duplicateDestination:true}).call(), /RESOURCE_NOT_AVAILABLE/));
test(() => assert.throws(() => fixture({ownerDepartment:"D2"}).call(), /RESOURCE_SCOPE_DENIED/));
test(() => assert.throws(() => fixture({noOwnership:true}).call(), /RESOURCE_OWNERSHIP_UNVERIFIED/));
test(() => assert.throws(() => fixture({duplicateOwnership:true}).call(), /RESOURCE_OWNERSHIP_UNVERIFIED/));
test(() => assert.throws(() => fixture({duplicateOwnershipId:true}).call(), /RESOURCE_OWNERSHIP_RECORD_AMBIGUOUS/));
test(() => assert.throws(() => fixture({badCategory:true}).call(), /EVALUATION_CATEGORY_RECORD_INVALID/));
test(() => assert.throws(() => fixture({duplicateCategoryId:true}).call(), /EVALUATION_CATEGORY_RECORD_AMBIGUOUS/));
test(() => assert.throws(() => fixture({canonicalSchema:true}).call(), /EVALUATION_CATEGORY_COPY_SCHEMA_UNSUPPORTED/));
test(() => assert.throws(() => fixture().call({grupoDestino:{asignatura:"Matemáticas",grado:"10",seccion:"A",periodo:"P1"}}), /EVALUATION_COPY_SOURCE_EQUALS_DESTINATION/));
test(() => assert.throws(() => fixture().call({grupoDestino:{asignatura:"Matemáticas",grado:"10",seccion:"B"}}), /EVALUATION_COPY_GROUP_CONTEXT_REQUIRED/));
test(() => { const x=fixture({lockTimeout:true});assert.throws(()=>x.call(),/EVALUATION_SETUP_COPY_LOCK_TIMEOUT/);assert.equal(x.stats.opens,0); });
test(() => { const x=fixture({reenter:true}),r=x.call();assert.equal(r.categoriasCopias,1);assert.match(x.stats.reentryError,/EVALUATION_SETUP_COPY_LOCK_TIMEOUT/);assert.equal(x.sheets.CategoriasEvaluacion.writes,1);assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held],[2,1,false]); });
test(() => {
  const x=fixture({failCategoryWrite:true});
  assert.throws(()=>x.call(),/write failed/);
  assert.equal(x.sheets.CategoriasEvaluacion.rows.length,2);
  assert.equal(x.sheets.ResourceOwnership.rows.length,2);
  assert.deepEqual([x.stats.acquired,x.stats.released,x.stats.held],[1,1,false]);
});
test(() => {
  const x=fixture({uuid:"DUP"});
  x.sheets.CategoriasEvaluacion.rows.push(["CAT-COPY-DUP","Matemáticas","Tarea",20,"10","B","P1",new Date()]);
  assert.throws(()=>x.call(),/EVALUATION_COPY_ID_COLLISION/);
  assert.equal(x.sheets.ResourceOwnership.writes,0);
});

test(() => { const x=fixture(),r=x.call(),e=x.stats.events;assert.equal(r.status,"success");assert.ok(e.indexOf("rbac")<e.indexOf("getScriptLock"));assert.ok(e.indexOf("identity")<e.indexOf("getScriptLock"));assert.equal(e.filter(v=>v==="rbac").length,2);assert.equal(e.filter(v=>v==="identity").length,2); });
test(() => { const x=fixture({permissionDenied:true});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual([x.stats.acquired,x.stats.opens],[0,0]);assert.deepEqual(x.stats.events,["rbac"]); });
test(() => { const x=fixture({invalidIdentity:true});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual([x.stats.acquired,x.stats.opens],[0,0]);assert.deepEqual(x.stats.events,["rbac","identity"]); });
test(() => { const x=fixture({actor:{authorized:true,userId:"",role:"Profesor"}});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual([x.stats.acquired,x.stats.opens],[0,0]);assert.deepEqual(x.stats.events,["rbac","identity"]); });
test(() => { const x=fixture({actor:{authorized:true,userId:"P1",role:"Director"}});assert.throws(()=>x.call(),/RESOURCE_NOT_AVAILABLE/);assert.deepEqual([x.stats.acquired,x.stats.opens],[0,0]);assert.deepEqual(x.stats.events,["rbac","identity"]); });
test(() => {
  const x = fixture({ actors: [
    { authorized: true, userId: "P1", role: "Profesor" },
    { authorized: true, userId: "   ", role: "Profesor" }
  ] });
  const categoriesBefore = x.sheets.CategoriasEvaluacion.rows.map(row => row.slice());
  const ownershipBefore = x.sheets.ResourceOwnership.rows.map(row => row.slice());
  assert.throws(() => x.call(), /RESOURCE_NOT_AVAILABLE/);
  assert.equal(x.identityCalls(), 2, "signed identity must be revalidated after lock acquisition");
  assert.deepEqual(x.stats.events, ["rbac", "identity", "getScriptLock", "tryLock", "rbac", "identity", "releaseLock"]);
  assert.deepEqual([x.stats.acquired, x.stats.released, x.stats.held, x.stats.opens], [1, 1, false, 0]);
  assert.deepEqual(x.sheets.CategoriasEvaluacion.rows, categoriesBefore, "categories must remain unchanged");
  assert.deepEqual(x.sheets.ResourceOwnership.rows, ownershipBefore, "ownership must remain unchanged");
});
console.log("exam-service-evaluation-setup-copy-security: PASS (" + scenarios + " scenarios)");
