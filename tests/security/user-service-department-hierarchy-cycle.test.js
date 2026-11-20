"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}

function makeSheet(headers, initialRows) {
  const header = headers.slice(), rows = initialRows.map(row => row.slice());
  return {
    getLastColumn: () => header.length,
    getLastRow: () => rows.length + (header.length ? 1 : 0),
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          if (row === 1) return [header.slice(col - 1, col - 1 + (numCols || 1))];
          return rows.slice(row - 2, row - 2 + (numRows || 1)).map(item => item.slice(col - 1, col - 1 + (numCols || 1)));
        },
        setValue(value) {
          if (row === 1) header[col - 1] = value;
          else rows[row - 2][col - 1] = value;
        },
        setValues(values) {
          values.forEach((valuesRow, offset) => {
            if (row + offset === 1) valuesRow.forEach((value, index) => { header[col - 1 + index] = value; });
            else {
              const target = rows[row + offset - 2] || (rows[row + offset - 2] = []);
              valuesRow.forEach((value, index) => { target[col - 1 + index] = value; });
            }
          });
        }
      };
    },
    getDataRange: () => ({ getValues: () => [header.slice(), ...rows.map(row => row.slice())] }),
    appendRow: row => rows.push(row.slice()),
    _header: header,
    _rows: rows
  };
}

const functions = [
  "getDepartmentHierarchyColumnMap_",
  "validateDepartmentHierarchy_",
  "manageDepartmentPositions"
].map(extractFunction).join("\n");

function createContext(sheet, options) {
  let nextId = 1;
  const spreadsheet = { getSheetByName: name => name === "CatalogoDepartamentos" ? sheet : null };
  const context = {
    SPREADSHEET_ID:"TEST",
    getUserVerifiedRole:() => options && options.role || "RecursosHumanos",
    SpreadsheetApp:{ openById:() => spreadsheet },
    getOrCreateSheet:(_ss,name) => name === "CatalogoDepartamentos" ? sheet : makeSheet([],[]),
    LockService:{ getScriptLock:() => ({ tryLock:() => !(options && options.lockBusy), releaseLock:() => {} }) },
    generateInstitutionalId:() => ({generatedId:"DEP-GEN-" + nextId++}),
    logStructuredEvent:() => {},
    invalidateUserRoleCache:() => {},
    recordEntityChangeLog:() => {},
    Date, String, Number, Object, Array, Set, Map, Error, Math,
    _sheet:sheet
  };
  vm.runInNewContext(functions + "\nthis.api={getDepartmentHierarchyColumnMap_,validateDepartmentHierarchy_,manageDepartmentPositions};", context);
  return context;
}

const legacySheet = makeSheet(
  ["deptId","nombre","jefaturaUserId","estado","fechaCreacion"],
  [
    ["DEP-A","Dirección","U1","Activo",new Date("2026-01-01")],
    ["DEP-B","Subdirección","U2","Activo",new Date("2026-01-02")],
    ["DEP-C","Coordinación","U3","Activo",new Date("2026-01-03")],
    ["DEP-X","Administración","U4","Activo",new Date("2026-01-04")],
    ["DEP-I","Archivo","U5","Inactivo",new Date("2026-01-05")]
  ]
);
const ctx = createContext(legacySheet);
const createdRoot = ctx.api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-ROOT-2", deptNombre:"Raíz secundaria", _verifiedUserId:"HR-1"
});
assert.equal(createdRoot.status,"success");
assert.equal(createdRoot.parentDeptId,"");
assert.equal(legacySheet._header.includes("DepartamentoPadreID"),true,"legacy schema receives additive parent column");
const createdChild = ctx.api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-D", deptNombre:"Departamento D", parentDeptId:"DEP-A", _verifiedUserId:"HR-1"
});
assert.deepEqual(Array.from(createdChild.hierarchyPath),["DEP-D","DEP-A"]);
ctx.api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-E", deptNombre:"Departamento E", parentDeptId:"DEP-D", _verifiedUserId:"HR-1"
});
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"UPDATE_DEPT", deptId:"DEP-A", parentDeptId:"DEP-E", _verifiedUserId:"HR-1"
}), /DEPARTMENT_HIERARCHY_CYCLE/);
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"UPDATE_DEPT", deptId:"DEP-D", parentDeptId:"DEP-D", _verifiedUserId:"HR-1"
}), /DEPARTMENT_HIERARCHY_CYCLE/);
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"UPDATE_DEPT", deptId:"DEP-D", parentDeptId:"DEP-MISSING", _verifiedUserId:"HR-1"
}), /DEPARTMENT_PARENT_NOT_FOUND/);
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"UPDATE_DEPT", deptId:"DEP-D", parentDeptId:"DEP-I", _verifiedUserId:"HR-1"
}), /DEPARTMENT_PARENT_INACTIVE/);
const beforeRejectedUpdate = legacySheet._rows.map(row => row.slice());
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"UPDATE_DEPT", deptId:"DEP-A", parentDeptId:"DEP-E", _verifiedUserId:"HR-1"
}), /DEPARTMENT_HIERARCHY_CYCLE/);
assert.deepEqual(legacySheet._rows,beforeRejectedUpdate,"rejected hierarchy update must not mutate existing rows");
const updated = ctx.api.manageDepartmentPositions({
  subAction:"UPDATE_DEPT", deptId:"DEP-E", deptNombre:"Departamento E actualizado", parentDeptId:"DEP-X", _verifiedUserId:"HR-1"
});
assert.equal(updated.status,"success");
assert.deepEqual(Array.from(updated.hierarchyPath),["DEP-E","DEP-X"]);
assert.equal(legacySheet._rows.find(row=>row[0]==="DEP-E")[1],"Departamento E actualizado");
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-ROOT-2", deptNombre:"Duplicado", _verifiedUserId:"HR-1"
}), /DEPARTMENT_ID_ALREADY_EXISTS/);
assert.throws(() => ctx.api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-BAD", deptNombre:"Sin padre", parentDeptId:"DEP-UNKNOWN", _verifiedUserId:"HR-1"
}), /DEPARTMENT_PARENT_NOT_FOUND/);

const locked = createContext(makeSheet(["deptId","nombre","estado"],[]),{lockBusy:true});
assert.throws(() => locked.api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-LOCKED", deptNombre:"Bloqueado", _verifiedUserId:"HR-1"
}), /DEPARTMENT_HIERARCHY_LOCK_TIMEOUT/);
assert.throws(() => createContext(makeSheet(["deptId","nombre","estado"],[]),{role:"Docente"}).api.manageDepartmentPositions({
  subAction:"CREATE_DEPT", deptId:"DEP-DENIED", deptNombre:"Denegado", _verifiedUserId:"T-1"
}), /Acceso denegado/);

const deepRows = [];
for (let i=0;i<1500;i++) deepRows.push(["D"+i,"Departamento "+i,"","Activo",new Date(),i===0?"":"D"+(i-1)]);
const deepSheet = makeSheet(["deptId","nombre","jefaturaUserId","estado","fechaCreacion","DepartamentoPadreID"],deepRows);
const deep = createContext(deepSheet);
const deepResult = deep.api.validateDepartmentHierarchy_(deepSheet,"D-NEW","D1499");
assert.equal(deepResult.path.length,1501,"iterative traversal handles deep trees without recursive stack growth");
assert.equal(deepResult.path[0],"D-NEW");
assert.equal(deepResult.path[1500],"D0");

console.log("user-service department hierarchy contract PASS (roots, legacy schema, parent validation, direct/indirect cycles, atomic rejection, lock and deep traversal).");
