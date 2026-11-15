"use strict";
const assert=require("node:assert/strict"),crypto=require("node:crypto"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.resolve(__dirname,"../../backend/accounting-service/Code.gs"),"utf8");
function extract(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,name+" exists");const end=name==="validateImportPreview"?source.indexOf("\n\nconst ACCOUNTING_IDENTITY_MAPPING_HEADERS_",start+10):source.indexOf("\nfunction ",start+10);return source.slice(start,end<0?source.length:end);}
const hs=source.indexOf("const ACCOUNTING_IDENTITY_MAPPING_HEADERS_="),he=source.indexOf(";",hs)+1;
assert.ok(hs>=0&&he>hs);
const header=source.slice(hs,he);
const identityHeaders=["idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataforma","institucionId","hashRegistroOrigen","fechaMigracion","versionMapeo","estadoCorrespondencia","metodoCoincidencia","nivelConfianza","migradoPor"];
const identityRows=[identityHeaders];
function add(sourceName,type,legacy,target,status="CONFIRMADA",institution="INST-1"){identityRows.push(["MAP-"+identityRows.length,sourceName,type,legacy,target,institution,"HASH-"+legacy,"2026-11-15","1",status,"EXACTA","NO_CALIBRADA","TEST"]);}
add("LEGACY","curso","CUR-1","CURSO-1");
add("LEGACY","curso","CUR-2","CURSO-2");
add("LEGACY","curso","CUR-PENDING","CURSO-P","PENDIENTE_REVISION");
add("LEGACY","curso","CUR-OTHER","CURSO-X","CONFIRMADA","INST-2");
add("LEGACY","estudiante","EST-1","ESTUDIANTE-1");
add("LEGACY","persona","PER-1","PERSONA-1");
const sheet={getRange(r,c,n,m){return{getValues(){return identityRows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m));}};},getDataRange(){return{getValues(){return identityRows.map(row=>row.slice());}};}};
const ss={getSheetByName(name){return name==="CorrespondenciaIdentificadores"?sheet:null;}};
const schemas={curso:{service:"ACCOUNTING",sheet:"Cursos",headers:["CursoID","Nombre","Nota","FechaInicio"]},estudiante:{service:"ACADEMIC",sheet:"Estudiantes",headers:["EstudianteID","PersonaID"]}};
const context={SPREADSHEET_ID:"TEST",MIGRATION_OWNER_SCHEMAS_:schemas,
 SpreadsheetApp:{openById(){return ss;}},PropertiesService:{getScriptProperties(){return{getProperty(){return"INST-1";}};}},
 getVerifiedAccountingIdentity_(){return{authorized:true,userId:"U-1",role:"Administrador"};},
 buildAccountingDepartmentalImportPreflight_(){return{valid:true,applicable:false,institutionId:"INST-1",rows:[]};},
 mapMigrationRowToTarget_(row,mapping){const out={};Object.keys(mapping.campos||{}).forEach(field=>out[field]=row[mapping.campos[field]]);return out;},
 migrationStableJson_:value=>JSON.stringify(value),migrationHash_:value=>crypto.createHash("sha256").update(String(value)).digest("hex"),
 Date,String,Number,Array,Object,JSON,RegExp,Error,isFinite};
const funcs=["buildAccountingIdentityMapSnapshot_","resolveAccountingIdentityFromSnapshot_","buildImportPreview_","validateImportPreview"].map(extract);
vm.createContext(context);vm.runInContext(header+"\n"+funcs.join("\n")+"\nthis.preview=buildImportPreview_;this.validate=validateImportPreview;",context);
const base={nombreArchivo:"cursos.xlsx",destinoModulo:"Cursos",sistemaOrigen:"LEGACY",tipoEntidad:"curso",sessionToken:"signed",
 columnaMapeo:{identificador:"legacyId",campos:{Nombre:"nombre",Nota:"nota",FechaInicio:"fechaInicio"}},
 filasData:[{legacyId:"CUR-1",nombre:"Matemáticas",nota:90,fechaInicio:"2026-02-01"}]};
const valid=context.preview(base);assert.equal(valid.status,"success");assert.equal(valid.validForImport,true);assert.equal(valid.filasValidas,1);
assert.equal(valid.preparedRows[0].Nombre,"Matemáticas");assert.equal(valid.identityResolutions[0].idNuevoPlataforma,"CURSO-1");assert.match(valid.previewHash,/^[a-f0-9]{64}$/);
assert.equal(context.validate(base).validForImport,true);
assert.notEqual(context.preview({...base,filasData:[{...base.filasData[0],nota:91}]}).previewHash,valid.previewHash);
const duplicate=context.preview({...base,filasData:[base.filasData[0],{...base.filasData[0]}]});
assert.equal(duplicate.validForImport,false);assert.ok(duplicate.errores.some(x=>x.codigo==="DUPLICATE_IDENTIFIER_IN_FILE"));
const missing=context.preview({...base,filasData:[{nombre:"Sin ID",nota:80,fechaInicio:"2026-02-01"}]});
assert.equal(missing.validForImport,false);assert.ok(missing.errores.some(x=>x.codigo==="IDENTIFIER_MISSING"));
for(const structure of [{duplicateHeaders:["Nombre"]},{unresolvedFormulas:["C3"]},{repeatedHeaderRows:[5]}]){
 const result=context.preview({...base,analisisEstructural:structure});assert.equal(result.validForImport,false);
}
assert.equal(context.preview({...base,analisisEstructural:{visibleSheetCount:2}}).validForImport,false);
const warnings=context.preview({...base,hojaSeleccionada:"Datos",analisisEstructural:{visibleSheetCount:2,selectedSheet:"Datos",hiddenSheets:["Oculta"],mergedCells:["A1:B1"],headerRowIndex:2,blankRows:[7],typeInconsistencies:["Nota"]}});
assert.equal(warnings.validForImport,true);for(const code of ["HIDDEN_SHEETS_PRESENT","MERGED_CELLS_PRESENT","HEADER_ROW_SHIFTED","BLANK_ROWS_PRESENT","COLUMN_TYPE_INCONSISTENCY"])assert.ok(warnings.advertencias.some(x=>x.codigo===code));
assert.equal(context.preview({...base,filasData:[{...base.filasData[0],nota:120}]}).validForImport,false);
assert.equal(context.preview({...base,filasData:[{...base.filasData[0],fechaInicio:"no-es-fecha"}]}).validForImport,false);
assert.equal(context.preview({...base,filasData:[{...base.filasData[0],legacyId:"CUR-PENDING"}]}).validForImport,false);
assert.equal(context.preview({...base,filasData:[{...base.filasData[0],legacyId:"CUR-OTHER"}]}).validForImport,false);
identityRows.push(identityRows[1].slice());const duplicateMap=context.preview(base);
assert.equal(duplicateMap.validForImport,false);assert.ok(duplicateMap.errores.some(x=>x.codigo==="IDENTITY_UNIQUENESS_VIOLATION"));identityRows.pop();
const student={...base,destinoModulo:"Estudiantes",tipoEntidad:"estudiante",columnaMapeo:{identificador:"legacyId",campos:{PersonaID:"persona"}},filasData:[{legacyId:"EST-1",persona:"PER-1"}]};
assert.equal(context.preview(student).validForImport,true);
const orphan=context.preview({...student,filasData:[{legacyId:"EST-1",persona:"MISSING"}]});
assert.equal(orphan.validForImport,false);assert.ok(orphan.errores.some(x=>x.codigo==="ORPHANED_REFERENCE"));
assert.equal(context.preview({...student,filasData:[{legacyId:"EST-1"}]}).validForImport,false);
console.log("Accounting semantic import preflight: identity snapshots, tenant isolation, structural blockers/warnings, row validation, related references and preview hash PASS.");
