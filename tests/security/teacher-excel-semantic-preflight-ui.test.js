"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const js = fs.readFileSync(path.join(root, "js/teacher.js"), "utf8");
const html = fs.readFileSync(path.join(root, "teacher-dashboard.html"), "utf8");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "("); assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start); let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++; else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function: " + name);
}
["excel-import-source-system","excel-import-entity-type","excel-import-identifier-column","excel-import-field-mappings","btn-run-excel-preflight","excel-semantic-result","excel-confirm-preflight-check","btn-confirm-excel-preflight"].forEach(id => assert.ok(html.includes('id="' + id + '"'), "HTML control exists: " + id));
assert.match(js, /fetchApi\('ACCOUNTING',\s*'validateImportPreview'/);
assert.match(js, /requestSequence !== excelPreflightRequestSequence/);
assert.match(js, /targetExistenceSnapshot\.verified !== true/);
const start = js.indexOf("// FASE 28: IMPORTADOR UNIVERSAL DE ARCHIVOS EXCEL");
const end = js.indexOf("});\n/**\n * REQ: Soporte para copia de código", start);
assert.ok(start >= 0 && end > start, "Excel importer controller block is bounded");
const block = js.slice(start, end);
assert.ok(!block.includes("importDataWithColumnMapping"), "review UI must not invoke business persistence");
assert.match(block, /No se guardó, importó ni modificó ningún registro/);
const helper = extractFunction(js, "buildExcelImportPreflightPayload_");
const context = {}; vm.createContext(context); vm.runInContext(helper + "\nthis.build = buildExcelImportPreflightPayload_;", context);
const rows = [{ LegacyCourse: "C-1", CourseName: "Matemáticas", Score: 95 }];
const payload = context.build({nombreArchivo:"cursos.xlsx",sistemaOrigen:"LEGACY_2024",tipoEntidad:"curso",identificador:"LegacyCourse",campos:{Nombre:"CourseName",Nota:"Score"},filasData:rows,hojaSeleccionada:"Cursos",analisisEstructural:{visibleSheetCount:1,selectedSheet:"Cursos"}});
assert.equal(payload.tipoEntidad,"curso"); assert.equal(payload.destinoModulo,"ACCOUNTING"); assert.equal(payload.columnaMapeo.identificador,"LegacyCourse");
assert.deepEqual(JSON.parse(JSON.stringify(payload.columnaMapeo.campos)),{Nombre:"CourseName",Nota:"Score"}); assert.equal(payload.filasData,rows);
assert.throws(()=>context.build({sistemaOrigen:"X",tipoEntidad:"curso",identificador:"LegacyCourse",filasData:rows,campos:{}}),/REQUIRED_FIELD_MAPPING_MISSING:Nombre/);
assert.throws(()=>context.build({sistemaOrigen:"X",tipoEntidad:"estudiante",identificador:"LegacyStudent",filasData:rows,campos:{}}),/REQUIRED_FIELD_MAPPING_MISSING:PersonaID/);
assert.throws(()=>context.build({sistemaOrigen:"X",tipoEntidad:"empleado",identificador:"LegacyEmployee",filasData:rows,campos:{PersonaId:"Person",Puesto:"Role",Departamento:"Dept"}}),/ACTIVE_DEPARTMENT_REQUIRED/);
const employee=context.build({sistemaOrigen:"X",tipoEntidad:"empleado",identificador:"LegacyEmployee",activeDepartmentId:"DEPT-1",filasData:rows,campos:{PersonaId:"Person",Puesto:"Role",Departamento:"Dept"}});
assert.equal(employee.activeDepartmentId,"DEPT-1"); assert.equal(employee.destinoModulo,"ACCOUNTING");
assert.throws(()=>context.build({sistemaOrigen:"X",tipoEntidad:"unknown",identificador:"id",filasData:rows}),/ENTITY_TYPE_NOT_SUPPORTED/);
process.stdout.write("Teacher Excel semantic preflight UI contract: all assertions passed.\n");
