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
add("LEGACY","estudiante","EST-2","ESTUDIANTE-2");
add("LEGACY","persona","PER-2","PERSONA-2");
add("LEGACY","persona","PER-3","PERSONA-3");
const sheet={getRange(r,c,n,m){return{getValues(){return identityRows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m));}};},getDataRange(){return{getValues(){return identityRows.map(row=>row.slice());}};}};
const targetRows=[["CursoID","NombreCurso","Nota","FechaInicio"],["CURSO-1","Historia",80,"2025-01-01"]];
const targetSheet={getDataRange(){return{getValues(){return targetRows.map(row=>row.slice());}};}};
const ss={getSheetByName(name){if(name==="CorrespondenciaIdentificadores")return sheet;if(name==="Cursos")return targetSheet;return null;}};
const schemas={curso:{service:"ACCOUNTING",sheet:"Cursos",headers:["CursoID","NombreCurso","Nota","FechaInicio"]},estudiante:{service:"ACADEMIC",sheet:"ExpedientesEstudiantes",headers:["ExpedienteID","PersonaID"]},persona:{service:"USER",sheet:"Personas",headers:["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto"]}};
const auditRows=[],writeCalls=[],rollbackCalls=[];
let remoteDuplicateMatches=[];
let failWriteAt=0,runCounter=0;
const audit={appendRow(row){auditRows.push(row);}};
let binaryFileHash="a".repeat(64);
const context={SPREADSHEET_ID:"TEST",MIGRATION_OWNER_SCHEMAS_:schemas,
 validateImportWorkbookBinary_:()=>({valid:true,fileHash:binaryFileHash}),
 SpreadsheetApp:{openById(){return ss;}},PropertiesService:{getScriptProperties(){return{getProperty(){return"INST-1";}};}},
 getOrCreateSheet(){return audit;},Utilities:{getUuid(){return"RUN-"+(++runCounter);}},
 sendMigrationOwnerRequest_(type,action,payload){assert.equal(action,"writeMigratedEntity");writeCalls.push({type,payload});if(failWriteAt&&writeCalls.length===failWriteAt)throw new Error("MOCK_OWNER_WRITE_FAILED");return{status:"success",idempotent:false};},
 rollbackMigrationOwnerWrites_(applied){rollbackCalls.push(applied.slice());return[];},
 requestAccountingUserAuthorization_(action,payload){return action==="verifyAccountingSession"?{status:"success",authorized:true,userId:"U-1",role:"Administrador",institutionId:"INST-1"}:{status:"success",authorized:true,importPermissionVerified:true,userId:"U-1",role:"Administrador"};},
 getVerifiedAccountingIdentity_(){return{authorized:true,userId:"U-1",role:"Administrador",institutionId:"INST-1"};},
 requestAccountingIdentityMapSnapshot_(payload){
  if(!payload||!payload.sessionToken)return{status:"error",code:"VERIFIED_IDENTITY_REQUIRED"};
  const requested={};(payload.lookups||[]).forEach(lookup=>(lookup.legacyIds||[]).forEach(id=>requested[[lookup.sourceName,lookup.entityType,id].join("|")]=true));
  const entries=identityRows.slice(1).filter(row=>requested[[row[1],row[2],row[3]].join("|")]&&row[5]==="INST-1")
   .map(row=>({sistemaOrigen:row[1],tipoEntidad:row[2],idOriginalLegado:row[3],idNuevoPlataforma:row[4],institucionId:row[5],hashRegistroOrigen:row[6],versionMapeo:row[8],estadoCorrespondencia:row[9]}));
  const counts={};entries.forEach(entry=>{const key=[entry.sistemaOrigen,entry.tipoEntidad,entry.idOriginalLegado].join("|");counts[key]=(counts[key]||0)+1;});
  return{status:"success",verified:true,service:"USER",institutionId:"INST-1",entries,
   uniquenessViolations:Object.keys(counts).filter(key=>counts[key]>1).map(key=>({key,count:counts[key]}))};
 },
 requestAccountingTrustedOwnerSnapshot_(service,payload){
  if(!payload||!payload.sessionToken)return{status:"error",code:"VERIFIED_IDENTITY_REQUIRED"};
  if(service==="ACADEMIC")return{status:"success",verified:true,service:"ACADEMIC",sheet:"ExpedientesEstudiantes",idField:"ExpedienteID",institutionId:"INST-1",existingTargetIds:["ESTUDIANTE-1"],targetRows:[],duplicateMatches:[],referenceErrors:[]};
  if(service==="USER")return{status:"success",verified:true,service:"USER",sheet:"Personas",idField:"PersonaID",institutionId:"INST-1",existingTargetIds:["PERSONA-1"],targetRows:[],duplicateMatches:remoteDuplicateMatches};
  return{status:"error",code:"OWNER_NOT_ALLOWED"};
 },
 buildAccountingDepartmentalImportPreflight_(){return{valid:true,applicable:false,institutionId:"INST-1",rows:[]};},
 mapMigrationRowToTarget_(row,mapping){const out={};Object.keys(mapping.campos||{}).forEach(field=>out[field]=row[mapping.campos[field]]);return out;},
 migrationStableJson_:value=>JSON.stringify(value),migrationHash_:value=>crypto.createHash("sha256").update(String(value)).digest("hex"),
 Date,String,Number,Array,Object,JSON,RegExp,Error,isFinite};
const funcs=["buildAccountingIdentityMapSnapshot_","resolveAccountingIdentityFromSnapshot_","normalizeMigrationNaturalKey_","migrationDuplicateKeyDefinitions_","buildMigrationDuplicateRequests_","buildMigrationReferenceRequests_","buildMigrationTargetExistenceSnapshot_","buildAccountingRelatedPersonExistenceSnapshot_","buildImportPreview_","validateImportPreview","importDataWithColumnMapping"].map(extract);
vm.createContext(context);vm.runInContext(header+"\n"+funcs.join("\n")+"\nthis.preview=buildImportPreview_;this.validate=validateImportPreview;this.import=importDataWithColumnMapping;",context);
const base={nombreArchivo:"cursos.xlsx",destinoModulo:"ACCOUNTING",sistemaOrigen:"LEGACY",tipoEntidad:"curso",sessionToken:"signed",
 columnaMapeo:{identificador:"legacyId",campos:{NombreCurso:"nombre",Nota:"nota",FechaInicio:"fechaInicio"}},
 filasData:[{legacyId:"CUR-1",nombre:"Matemáticas",nota:90,fechaInicio:"2026-02-01"}]};
const valid=context.preview(base);assert.equal(valid.status,"success",JSON.stringify(valid));assert.equal(valid.validForImport,true,JSON.stringify(valid));assert.equal(valid.filasValidas,1);
assert.equal(valid.preparedRows[0].NombreCurso,"Matemáticas");
assert.equal(valid.validRowIndexes.length,1);assert.equal(valid.identityResolutions[0].idNuevoPlataforma,"CURSO-1");assert.match(valid.previewHash,/^[a-f0-9]{64}$/);
assert.equal(valid.targetExistenceSnapshot.verified,true);
assert.deepEqual(Array.from(valid.targetExistenceSnapshot.existingTargetIds),["CURSO-1"]);
assert.ok(valid.advertencias.some(item=>item.codigo==="TARGET_RECORD_OVERWRITE"));
const initialTargetHash=valid.previewHash;
targetRows[1][2]=81;
assert.notEqual(context.preview(base).previewHash,initialTargetHash,"target edits invalidate a stale preview");
targetRows[1][2]=80;
assert.equal(context.validate(base).validForImport,true);
assert.equal(context.validate(base).resumenValidation.sobrescriturasDetectadas,1);
assert.equal(context.validate(base).resumenValidation.existenciaDestinoVerificada,true);
const publicPreview=context.validate(base);
assert.deepEqual(Array.from(publicPreview.targetExistenceSnapshot.targetRows),[],"preflight never returns unrelated destination row contents");
assert.equal(publicPreview.fileHash, undefined, "raw workbook digests remain server-side");
assert.equal(publicPreview.fileSizeBytes, undefined, "binary metadata is not exposed in the preflight response");
assert.deepEqual(Array.from(publicPreview.targetExistenceSnapshot.existingTargetIds),["CURSO-1"],"preflight reveals only target IDs in the submitted batch");
assert.notEqual(context.preview({...base,filasData:[{...base.filasData[0],nota:91}]}).previewHash,valid.previewHash);
binaryFileHash="b".repeat(64);
assert.notEqual(context.preview(base).previewHash,valid.previewHash,"the original uploaded file digest is bound into the preview hash");
binaryFileHash="a".repeat(64);
const unconfirmedValues=["false","true",1,{},[]];
for(const unconfirmed of unconfirmedValues){
 assert.throws(()=>context.import({...base,previewConfirmed:unconfirmed,previewHash:valid.previewHash}),/IMPORT_PREVIEW_INVALID_OR_STALE/);
}
assert.equal(writeCalls.length,0,"only the literal boolean true confirms an import preview");
const partialPayload={...base,analisisEstructural:{headerRowIndex:1,dataRowNumbers:[3,7]},filasData:[base.filasData[0],{...base.filasData[0],legacyId:"CUR-2",fechaInicio:"fecha-invalida"}]};
const partialPreview=context.preview(partialPayload);
assert.equal(partialPreview.validForImport,false);
assert.equal(partialPreview.validForPartialImport,true);
assert.deepEqual(Array.from(partialPreview.validRowIndexes),[0]);
assert.equal(partialPreview.validForPartialImport,true);
assert.equal(context.validate(partialPayload).validForPartialImport,true);
assert.equal(context.validate(partialPayload).resumenValidation.requiereConfirmacion,true);
assert.throws(()=>context.import({...partialPayload,previewConfirmed:true,previewHash:partialPreview.previewHash}),/IMPORT_PREVIEW_INVALID_OR_STALE/);
assert.equal(writeCalls.length,0);
const partialResult=context.import({...partialPayload,previewConfirmed:true,previewHash:partialPreview.previewHash,allowPartialImport:true});
assert.equal(partialResult.status,"success");
assert.equal(partialResult.estado,"partial");
assert.equal(partialResult.registrosEscritos,1);
assert.equal(partialResult.filasOmitidasPorValidacion,1);
assert.ok(partialResult.errores.some(item=>item.error==="INVALID_DATE_VALUE"));
assert.equal(partialResult.errores.find(item=>item.error==="INVALID_DATE_VALUE").fila,7);
assert.equal(writeCalls.length,1);
assert.equal(auditRows.length,1);
assert.ok(partialResult.advertencias.some(item=>item.codigo==="TARGET_RECORD_OVERWRITE"));
assert.ok(JSON.parse(auditRows[0][7]).some(item=>item.severity==="WARNING"&&item.codigo==="TARGET_RECORD_OVERWRITE"));
const partialRetry=context.import({...partialPayload,previewConfirmed:true,previewHash:partialPreview.previewHash,allowPartialImport:true});
assert.equal(partialRetry.status,"success");
assert.equal(writeCalls.length,2);
assert.equal(writeCalls[1].payload.idempotencyKey,writeCalls[0].payload.idempotencyKey,"retry preserves the same idempotency key");
const structurallyBlocked=context.preview({...partialPayload,analisisEstructural:{duplicateHeaders:["Nombre"]}});
assert.equal(structurallyBlocked.validForPartialImport,false);
assert.throws(()=>context.import({...partialPayload,analisisEstructural:{duplicateHeaders:["Nombre"]},previewConfirmed:true,previewHash:structurallyBlocked.previewHash,allowPartialImport:true}),/IMPORT_PREVIEW_INVALID_OR_STALE/);
assert.equal(writeCalls.length,2);
const rollbackBatch={...base,filasData:[base.filasData[0],{...base.filasData[0],legacyId:"CUR-2",nombre:"Otro curso"}]};
const rollbackPreview=context.preview(rollbackBatch);
failWriteAt=4;
const beforeRollbackWrites=writeCalls.length;
const rollbackResult=context.import({...rollbackBatch,previewConfirmed:true,previewHash:rollbackPreview.previewHash});
assert.equal(rollbackResult.status,"error");
assert.equal(rollbackResult.estado,"rolled_back");
assert.equal(rollbackResult.registrosEscritos,0);
assert.equal(rollbackCalls.length,1);
assert.equal(rollbackCalls[0].length,1);
assert.equal(writeCalls.length-beforeRollbackWrites,2);
assert.equal(auditRows.length,3);
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
const repeatedNaturalKey=context.preview({...base,filasData:[base.filasData[0],{legacyId:"CUR-2",nombre:"Matemáticas",nota:85,fechaInicio:"2026-03-01"}]});
assert.equal(repeatedNaturalKey.validForImport,false);assert.equal(repeatedNaturalKey.validForPartialImport,true);
assert.deepEqual(Array.from(repeatedNaturalKey.validRowIndexes),[0]);
assert.ok(repeatedNaturalKey.errores.some(x=>x.codigo==="DUPLICATE_NATURAL_KEY_IN_FILE"));
targetRows.push(["CURSO-2","Matemáticas",75,"2025-02-01"]);
const duplicateRejected=context.preview({...base,filasData:[{legacyId:"CUR-2",nombre:"Matemáticas",nota:90,fechaInicio:"2026-02-01"}]});
assert.equal(duplicateRejected.validForImport,false);assert.ok(duplicateRejected.errores.some(x=>x.codigo==="EXISTING_NATURAL_KEY_DUPLICATE"));
const duplicateUpdated=context.preview({...base,politicaDuplicados:"ACTUALIZAR",filasData:[{legacyId:"CUR-2",nombre:"Matemáticas",nota:90,fechaInicio:"2026-02-01"}]});
assert.equal(duplicateUpdated.validForImport,true,JSON.stringify(duplicateUpdated));
assert.ok(duplicateUpdated.advertencias.some(x=>x.codigo==="EXISTING_NATURAL_KEY_UPDATE"));
const duplicateMismatch=context.preview({...base,politicaDuplicados:"ACTUALIZAR",filasData:[{legacyId:"CUR-1",nombre:"Matemáticas",nota:90,fechaInicio:"2026-02-01"}]});
assert.equal(duplicateMismatch.validForImport,false);
targetRows.pop();
assert.equal(context.preview({...base,filasData:[{...base.filasData[0],legacyId:"CUR-PENDING"}]}).validForImport,false);
assert.equal(context.preview({...base,filasData:[{...base.filasData[0],legacyId:"CUR-OTHER"}]}).validForImport,false);
identityRows.push(identityRows[1].slice());const duplicateMap=context.preview(base);
assert.equal(duplicateMap.validForImport,false);assert.ok(duplicateMap.errores.some(x=>x.codigo==="IDENTITY_UNIQUENESS_VIOLATION"));identityRows.pop();
const student={...base,destinoModulo:"ACADEMIC",tipoEntidad:"estudiante",columnaMapeo:{identificador:"legacyId",campos:{PersonaID:"persona"}},filasData:[{legacyId:"EST-1",persona:"PER-1"}]};
assert.equal(context.preview(student).validForImport,true);
assert.equal(context.preview(student).targetExistenceSnapshot.verified,true);
assert.equal(context.preview(student).relatedReferenceSnapshot.verified,true);
assert.deepEqual(Array.from(context.preview(student).targetExistenceSnapshot.existingTargetIds),["ESTUDIANTE-1"]);
assert.deepEqual(Array.from(context.preview(student).relatedReferenceSnapshot.existingTargetIds),["PERSONA-1"]);
const personImport={...base,destinoModulo:"USER",tipoEntidad:"persona",columnaMapeo:{identificador:"legacyId",campos:{Nombres:"nombres",Apellidos:"apellidos",Identificacion:"dni",EmailContacto:"email"}},filasData:[{legacyId:"PER-3",nombres:"Persona",apellidos:"Privada",dni:"0801-1999-00011",email:"persona@example.test"}]};
remoteDuplicateMatches=[{rowIndex:0,targetId:"PERSONA-OLD",field:"NombreCompleto",matchType:"POSIBLE"}];
const possiblePersonDuplicate=context.preview(personImport);
assert.equal(possiblePersonDuplicate.validForImport,false);
assert.ok(possiblePersonDuplicate.advertencias.some(x=>x.codigo==="POSSIBLE_DUPLICATE_MATCH"));
assert.ok(possiblePersonDuplicate.errores.some(x=>x.codigo==="POSSIBLE_DUPLICATE_REQUIRES_REVIEW"));
remoteDuplicateMatches=[{rowIndex:0,targetId:"PERSONA-OLD",field:"Identificacion",matchType:"EXACTA"}];
const linkedPersonDuplicate=context.preview({...personImport,politicaDuplicados:"VINCULAR"});
assert.equal(linkedPersonDuplicate.validForImport,false);
assert.ok(linkedPersonDuplicate.errores.some(x=>x.codigo==="IMPORT_DUPLICATE_LINK_UNSUPPORTED"));
remoteDuplicateMatches=[{rowIndex:0,targetId:"PERSONA-3",field:"Identificacion",matchType:"EXACTA"}];
const alreadyLinked=context.preview({...personImport,politicaDuplicados:"VINCULAR"});
assert.equal(alreadyLinked.validForImport,true,JSON.stringify(alreadyLinked));
assert.equal(alreadyLinked.filasVinculadas,1);assert.equal(alreadyLinked.validRowIndexes.length,0);
const linkedImport=context.import({...personImport,politicaDuplicados:"VINCULAR",previewConfirmed:true,previewHash:alreadyLinked.previewHash});
assert.equal(linkedImport.status,"success");assert.equal(linkedImport.registrosEscritos,0);assert.equal(linkedImport.registrosVinculados,1);
remoteDuplicateMatches=[];
const orphan=context.preview({...student,filasData:[{legacyId:"EST-1",persona:"MISSING"}]});
assert.equal(orphan.validForImport,false);assert.ok(orphan.errores.some(x=>x.codigo==="ORPHANED_REFERENCE"));
const remoteOrphanBatch=context.preview({...student,filasData:[{legacyId:"EST-1",persona:"PER-1"},{legacyId:"EST-2",persona:"PER-2"}],analisisEstructural:{dataRowNumbers:[2,3]}});
assert.equal(remoteOrphanBatch.validForImport,false);
assert.equal(remoteOrphanBatch.validForPartialImport,true);
assert.deepEqual(Array.from(remoteOrphanBatch.validRowIndexes),[0],"rows with missing remote person references are excluded from partial writes");
assert.equal(remoteOrphanBatch.preparedRows.length,1);
assert.equal(remoteOrphanBatch.preparedRows[0].PersonaID,"PERSONA-1");
assert.ok(remoteOrphanBatch.errores.some(x=>x.codigo==="ORPHANED_REFERENCE"&&x.fila===3));
assert.equal(context.preview({...student,filasData:[{legacyId:"EST-1"}]}).validForImport,false);
const originalOwnerSnapshot=context.requestAccountingTrustedOwnerSnapshot_;
context.requestAccountingTrustedOwnerSnapshot_=()=>({status:"error",code:"MIGRATION_OWNER_SERVICE_NOT_CONFIGURED"});
const unverifiedRemote=context.preview(student);
assert.equal(unverifiedRemote.validForImport,false);
assert.equal(unverifiedRemote.validForPartialImport,false);
assert.equal(unverifiedRemote.targetExistenceSnapshot.verified,false);
assert.equal(unverifiedRemote.relatedReferenceSnapshot.verified,false);
assert.ok(unverifiedRemote.errores.some(item=>item.codigo==="TARGET_EXISTENCE_UNVERIFIED"));
context.requestAccountingTrustedOwnerSnapshot_=originalOwnerSnapshot;
console.log("Accounting semantic import preflight: local/remote target snapshots, tenant isolation, row validation and stale-preview hash PASS.");
