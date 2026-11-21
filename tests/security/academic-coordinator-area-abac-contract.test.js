"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function extractFunction(source, name) {
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

const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
const names = [
  "getVerifiedAcademicCoordinatorAreaIds_",
  "resolveAcademicAreaIdForCoordinator_",
  "assertAcademicCoordinatorAreaAccess_",
  "validateContextualAccess"
];
const code = names.map(name => extractFunction(source, name)).join("\n");
const areaRows = [
  ["AreaID","NombreArea","Codigo","ServiceKey","ServiceUrl","HerramientasJSON","DepartamentoID","Estado","FechaRegistro"],
  ["AREA-1","Ciencias","SCI","","","[]","DEP-1","Activo","2026-01-01"],
  ["AREA-2","Humanidades","HUM","","","[]","DEP-1","Activo","2026-01-01"]
];
const subjectRows = [
  ["AsignaturaID","NombreOficial","Codigo","AreaAcademica","CargaHorariaRef","Estado","AreaID"],
  ["SUB-1","Matemáticas","MAT","Ciencias","","Activo","AREA-1"],
  ["SUB-2","Historia","HIS","Humanidades","","Activo","AREA-2"],
  ["SUB-INACTIVE","Física","PHY","Ciencias","","Inactiva","AREA-1"]
];
function sheet(rows) {
  return { getLastRow: () => rows.length, getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) };
}
function runtime(options = {}) {
  const scopeRows = options.scopeRows || [{
    userId: "COORD-1", areaId: "AREA-1",
    ambitoSupervision: { areaId: "AREA-1", tipoCoordinacion: "Titular", fechaInicio: "2026-01-01", fechaFin: "2099-12-31" }
  }];
  const context = {
    Date, String, Number, Object, Array, JSON,
    getAcademicAreaCoordinationScope: options.scopeError
      ? () => { throw new Error("scope unavailable"); }
      : () => ({ status: options.scopeStatus || "success", scopes: scopeRows }),
    getInstitutionalSubjectColumnMap_: () => ({ asignaturaId: 0, nombreOficial: 1, codigo: 2, areaAcademica: 3, estado: 5, areaId: 6 }),
    getInstitutionalAreaColumnMap_: () => ({ areaId: 0, name: 1, estado: 7 }),
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => context.ss },
    ss: {
      getSheetByName(name) {
        if (options.missingAreaSheet && name === "AreasCurricularesExtensiones") return null;
        if (name === "AreasCurricularesExtensiones") return sheet(options.areaRows || areaRows);
        if (name === "CatalogoAsignaturas") return sheet(options.subjectRows || subjectRows);
        return null;
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(code + "\nthis.scope = getVerifiedAcademicCoordinatorAreaIds_; this.resolve = resolveAcademicAreaIdForCoordinator_; this.check = assertAcademicCoordinatorAreaAccess_; this.contextual = validateContextualAccess;", context);
  return context;
}

let ctx = runtime();
assert.equal(ctx.scope({ _verifiedUserId: "", _verifiedRole: "Coordinador" }).authorized, false,
  "missing verified coordinator identity must deny");
assert.equal(ctx.scope({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }).authorized, true,
  "active verified area assignment must be accepted");
assert.equal(ctx.check({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }, ctx.ss, "SUB-1", true).authorized, true,
  "coordinator may access a subject in their assigned area");
assert.equal(ctx.check({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }, ctx.ss, "SUB-2", true).authorized, false,
  "coordinator may not access a subject outside their assigned area");
assert.equal(ctx.check({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }, ctx.ss, "Ciencias", false).authorized, true,
  "coordinator may access a rubric mapped to their assigned area");
assert.equal(ctx.check({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }, ctx.ss, "Humanidades", false).authorized, false,
  "coordinator may not access a rubric in another area");
assert.equal(ctx.check({ _verifiedUserId: "DIRECTOR-1", _verifiedRole: "Director" }, ctx.ss, "Humanidades", false).authorized, true,
  "non-coordinator roles preserve existing role-level behavior");

ctx = runtime({ scopeError: true });
assert.equal(ctx.scope({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }).authorized, false,
  "coordination lookup errors must fail closed");
ctx = runtime({ scopeStatus: "error" });
assert.equal(ctx.scope({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }).authorized, false,
  "invalid coordination response must fail closed");
ctx = runtime({ scopeRows: [{
  userId: "COORD-1", areaId: "AREA-1",
  ambitoSupervision: { areaId: "AREA-2", tipoCoordinacion: "Titular", fechaInicio: "2026-01-01", fechaFin: "2099-12-31" }
}] });
assert.equal(ctx.scope({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }).authorized, false,
  "mismatched supervision area must fail closed");
ctx = runtime({ scopeRows: [{
  userId: "COORD-1", areaId: "AREA-1",
  ambitoSupervision: { areaId: "AREA-1", tipoCoordinacion: "Titular", fechaInicio: "2099-01-01", fechaFin: "2099-12-31" }
}] });
assert.equal(ctx.scope({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }).authorized, false,
  "future coordinator assignment must not authorize");
ctx = runtime({ subjectRows: subjectRows.concat([subjectRows[1]]) });
assert.equal(ctx.resolve(ctx.ss, "SUB-1", true), "",
  "ambiguous subject identity must not resolve an authorization area");
ctx = runtime({ subjectRows: [subjectRows[0], subjectRows[3]] });
assert.equal(ctx.resolve(ctx.ss, "SUB-INACTIVE", true), "",
  "inactive subject must not resolve an authorization area");
ctx = runtime({ missingAreaSheet: true });
assert.equal(ctx.check({ _verifiedUserId: "COORD-1", _verifiedRole: "Coordinador" }, ctx.ss, "Ciencias", false).authorized, false,
  "unavailable area catalog must fail closed");

for (const name of ["savePedagogicalPlanning", "getPedagogicalPlannings", "submitPlanningForReview",
  "reviewPedagogicalPlanning", "getPlanningReviewHistory", "saveSupervisionRubric", "getSupervisionRubrics", "removeTeacherFromAcademicArea", "getAcademicAreasByTeacher"]) {
  const body = extractFunction(source, name);
  assert.match(body, /assertAcademicCoordinatorAreaAccess_|getVerifiedAcademicCoordinatorAreaIds_/,
    name + " must enforce coordinator area scope");
}

const coordinationFn = extractFunction(source, "getAcademicAreaCoordinationScope");
const coordinationRuntime = {
  SPREADSHEET_ID: "TEST",
  SpreadsheetApp: { openById: () => ({}) },
  getOrCreateSheet: () => sheet([
    ["CoordinacionID","AreaID","UserId","NombreCoordinador","AmbitoJSON","Estado","FechaAsignacion"],
    ["C1","AREA-1","COORD-1","Coordinator 1",JSON.stringify({ areaId: "AREA-1", tipoCoordinacion: "Titular" }),"Activo","2026-01-01"],
    ["C2","AREA-2","VICTIM-1","Coordinator 2",JSON.stringify({ areaId: "AREA-2", tipoCoordinacion: "Titular" }),"Activo","2026-01-01"]
  ]),
  String, JSON
};
vm.createContext(coordinationRuntime);
vm.runInContext(coordinationFn + "\nthis.query = getAcademicAreaCoordinationScope;", coordinationRuntime);
const ownCoordination = coordinationRuntime.query({
  _verifiedRole: "Coordinador", _verifiedUserId: "COORD-1", userId: "VICTIM-1"
});
assert.deepEqual(Array.from(ownCoordination.scopes, row => row.userId), ["COORD-1"],
  "coordinator cannot spoof another user's id when reading coordination scopes");

process.stdout.write("academic-coordinator-area-abac-contract: all assertions passed\n");
