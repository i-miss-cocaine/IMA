"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");

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
  const header = headers.slice();
  const rows = (initialRows || []).map(row => row.slice());
  return {
    getLastColumn: () => header.length,
    getLastRow: () => rows.length + (header.length ? 1 : 0),
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          if (row === 1) return [header.slice(col - 1, col - 1 + (numCols || 1))];
          return rows.slice(row - 2, row - 2 + (numRows || 1)).map(value => value.slice(col - 1, col - 1 + (numCols || 1)));
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

const names = [
  "normalizeInstitutionalCatalogStatus_",
  "getInstitutionalCatalogRevision_",
  "bumpInstitutionalCatalogRevision_",
  "getInstitutionalCatalogHeaderMap_",
  "getInstitutionalAreaColumnMap_",
  "getInstitutionalSubjectColumnMap_",
  "getInstitutionalDepartmentColumnMap_",
  "getInstitutionalAreaRecords_",
  "getInstitutionalDepartmentRecords_",
  "getInstitutionalSubjectRecords_",
  "getInstitutionalCatalog",
  "validateCatalogReference",
  "getSubjectCatalog",
  "createSubjectCatalogItem",
  "registerCurricularAreaExtension",
  "toggleCurricularAreaStatus",
  "runCurricularAreaServiceTests"
];
const functions = names.map(extractFunction).join("\n");

function createContext(overrides) {
  const sheets = {
    AreasCurricularesExtensiones: makeSheet(
      ["AreaID","NombreArea","Codigo","ServiceKey","ServiceUrl","HerramientasJSON","DepartamentoID","Estado","FechaRegistro"],
      [
        ["AREA-A","Ciencias","SCI","SERVICE_SCI","https://example.test","[\"lab\"]","D1","Activo","2026-01-01"],
        ["AREA-B","Humanidades","HUM","SERVICE_HUM","https://example.test","not-json","D1","Inactivo","2026-01-02"]
      ]
    ),
    DepartamentosAcademicos: makeSheet(
      ["DepartamentoID","Nombre","JefeUserID","Estado"],
      [["D1","Departamento Uno","U1","Activo"],["D2","Departamento Dos","U2","Activo"]]
    ),
    CatalogoAsignaturas: makeSheet(
      ["AsignaturaID","NombreOficial","Codigo","AreaAcademica","CargaHorariaRef","Estado","AreaID","DepartamentoID"],
      [
        ["ASIG-1","Matemáticas","MAT-01","Ciencias",4,"Activo","AREA-A","D1"],
        ["ASIG-2","Historia","HIS-01","Humanidades",3,"Activo","AREA-B","D1"],
        ["ASIG-3","Física","FIS-01","Ciencias","Activo","","AREA-A","D1"]
      ]
    )
  };
  const properties = new Map([["INSTITUTIONAL_CATALOG_REVISION", "7"]]);
  const context = Object.assign({
    SPREADSHEET_ID: "TEST",
    SpreadsheetApp: { openById: () => ({}) },
    getOrCreateSheet: (_ss, name) => sheets[name] || (sheets[name] = makeSheet([], [])),
    getVerifiedAcademicIdentity_: () => ({ authorized: true, userId: "U1", role: "Director" }),
    getVerifiedAcademicDepartmentScope_: () => ({ authorized: true, institutionWide: false, departmentIds: ["D1"] }),
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => properties.has(key) ? properties.get(key) : null,
      setProperty: (key, value) => properties.set(key, String(value))
    }) },
    Utilities: { getUuid: () => "00000000-0000-4000-8000-000000000001" },
    logStructuredEvent: () => {},
    Date, Number, String, Error, JSON, Array, Object, Math,
    _sheets: sheets,
    _properties: properties
  }, overrides || {});
  vm.runInNewContext(functions + "\nthis.api={getInstitutionalCatalog,validateCatalogReference,getSubjectCatalog,createSubjectCatalogItem,registerCurricularAreaExtension,toggleCurricularAreaStatus,runCurricularAreaServiceTests};", context);
  return context;
}

const ctx = createContext();
const all = ctx.api.getInstitutionalCatalog({ catalogType: "ALL" });
assert.equal(all.schemaVersion, "1.0.0");
assert.equal(all.catalogType, "ALL_INSTITUTIONAL_CATALOGS");
assert.equal(all.catalogRevision, 7);
assert.deepEqual(all.data.areasCurriculares.map(x => x.areaId), ["AREA-A"]);
assert.deepEqual(all.data.asignaturas.map(x => x.asignaturaId), ["ASIG-1","ASIG-3"], "inactive parent area is excluded; legacy misplaced status is recognized");
assert.equal(all.data.areasCurricularesMetadata.length, 2, "inactive area metadata remains available to synchronize state");
assert.equal(all.data.asignaturasMetadata.length, 3);
assert.deepEqual(all.data.departamentosAcademicos.map(x => x.departmentId), ["D1"]);

const validArea = ctx.api.validateCatalogReference({ catalogType: "ALL", referenceKey: "AREA-A" });
assert.equal(validArea.isValid, true);
assert.equal(validArea.catalogType, "CURRICULAR_AREAS");
assert.throws(() => ctx.api.validateCatalogReference({ catalogType: "ALL", referenceKey: "AREA-B" }), /CATALOG_REFERENCE_INACTIVE/);
assert.throws(() => ctx.api.validateCatalogReference({ catalogType: "SUBJECTS", referenceKey: "ASIG-2" }), /CATALOG_REFERENCE_INACTIVE/);
assert.throws(() => ctx.api.validateCatalogReference({ catalogType: "ALL", referenceKey: "D2" }), /CATALOG_REFERENCE_NOT_FOUND_OR_OUT_OF_SCOPE/);

const created = ctx.api.createSubjectCatalogItem({
  nombreOficial: "Química", codigo: "QUI-01", areaId: "AREA-A",
  cargaHorariaRef: 4, creditos: 3, grado: "10", idioma: "es"
});
assert.equal(created.data.estado, "Activo");
const subjectSheet = ctx._sheets.CatalogoAsignaturas;
const subjectHeaders = subjectSheet._header;
const subjectRow = subjectSheet._rows[subjectSheet._rows.length - 1];
assert.equal(subjectRow[subjectHeaders.indexOf("Estado")], "Activo");
assert.equal(subjectRow[subjectHeaders.indexOf("CargaHorariaRef")], 4);
assert.equal(subjectRow[subjectHeaders.indexOf("AreaID")], "AREA-A");
assert.equal(subjectRow[subjectHeaders.indexOf("DepartamentoID")], "D1");
assert.throws(() => ctx.api.createSubjectCatalogItem({
  nombreOficial: "Duplicada", codigo: "MAT-01", areaId: "AREA-A"
}), /SUBJECT_CODE_ALREADY_EXISTS/);
assert.throws(() => ctx.api.createSubjectCatalogItem({
  nombreOficial: "Créditos inválidos", codigo: "QUI-02", areaId: "AREA-A", creditos: "abc"
}), /SUBJECT_CREDITS_INVALID/);

const areaSheet = ctx._sheets.AreasCurricularesExtensiones;
const oldAreaRow = areaSheet._rows[0].slice();
const updated = ctx.api.registerCurricularAreaExtension({
  areaId: "AREA-A", name: "Ciencias Actualizadas", code: "SCI", serviceKey: "SERVICE_SCI",
  departmentId: "D1", tools: ["lab","simulator"]
});
assert.equal(updated.area.estado, "Activo", "metadata update must preserve existing status");
assert.equal(areaSheet._rows[0][7], "Activo");
assert.equal(areaSheet._rows[0][1], "Ciencias Actualizadas");
assert.equal(areaSheet._rows.length, 2, "metadata update must not duplicate area");
assert.notDeepEqual(areaSheet._rows[0], oldAreaRow);
const newArea = ctx.api.registerCurricularAreaExtension({
  areaId: "AREA-C", name: "Artes", code: "ART", serviceKey: "SERVICE_ART",
  departmentId: "D1", tools: "[\"drawing\"]"
});
assert.equal(newArea.area.estado, "Inactivo_PendientePruebas");
assert.throws(() => ctx.api.registerCurricularAreaExtension({
  areaId: "AREA-D", name: "Arte duplicado", code: "ART", serviceKey: "SERVICE_ART2",
  departmentId: "D1", tools: []
}), /AREA_CODE_ALREADY_EXISTS/);
assert.throws(() => ctx.api.registerCurricularAreaExtension({
  areaId: "AREA-E", name: "Sin departamento", code: "NEW", serviceKey: "SERVICE_NEW", tools: []
}), /AREA_ID_NAME_CODE_SERVICE_AND_DEPARTMENT_REQUIRED/);

assert.throws(() => ctx.api.toggleCurricularAreaStatus({
  areaId: "AREA-C", nuevoEstado: "Activo", motivo: "Aprobación"
}), /EXPLICIT_REACTIVATION_CONFIRMATION_REQUIRED/);
const activated = ctx.api.toggleCurricularAreaStatus({
  areaId: "AREA-C", nuevoEstado: "Activo", motivo: "Aprobación documentada", confirmReactivation: true
});
assert.equal(activated.nuevoEstado, "Activo");
assert.equal(areaSheet._rows[2][7], "Activo");

const beforeRunState = areaSheet._rows[1][7];
const report = ctx.api.runCurricularAreaServiceTests({ areaId: "AREA-B" });
assert.equal(report.status, "error", "invalid tools schema must not be reported as a pass");
assert.equal(report.todasPruebasExitosas, false);
assert.equal(report.activationAllowed, false);
assert.equal(areaSheet._rows[1][7], beforeRunState, "test execution must never reactivate or mutate the area");

console.log("academic-institutional-catalog-contract: PASS (versioned contract, active references, metadata preservation, no false activation)");
