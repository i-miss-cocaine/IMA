const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../.."),up=path.join(root,"backend/user-service/Code.gs"),ap=path.join(root,"backend/accounting-service/Code.gs");
const user=fs.readFileSync(up,"utf8"),accounting=fs.readFileSync(ap,"utf8"),academic=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8"),method=fs.readFileSync(path.join(root,"METODOLOGIA_DESARROLLO.md"),"utf8"),persistence=fs.readFileSync(path.join(root,"js/persistence.js"),"utf8"),api=fs.readFileSync(path.join(root,"js/api.js"),"utf8"),secretary=fs.readFileSync(path.join(root,"js/secretary.js"),"utf8"),dashboard=fs.readFileSync(path.join(root,"dashboard-secretaria.html"),"utf8");
new vm.Script(secretary,{filename:"js/secretary.js"});
assert.ok(api.includes("window.findPersonMatches"));assert.ok(api.includes("window.linkPersonAccount"));
for(const id of ["modal-identity-mapping","form-identity-search","form-identity-register","btn-identity-confirm","btn-identity-reject","btn-identity-history","form-identity-link"])assert.ok(dashboard.includes('id="'+id+'"'),"UI control "+id);
for(const fn of ["openIdentityMappingManager","handleIdentityMatchSearch","handleIdentityMappingRegister","handleIdentityMappingReview","loadIdentityDecisionHistory","handleIdentityAccountLink"])assert.ok(secretary.includes("window."+fn+" ="));
assert.ok(dashboard.includes('role === "Secretaría"')&&dashboard.includes('role === "Administrador"'));
new vm.Script(user,{filename:up}); new vm.Script(accounting,{filename:ap}); new vm.Script(academic,{filename:"backend/academic-service/Code.gs"}); new vm.Script(persistence,{filename:"js/persistence.js"}); new vm.Script(api,{filename:"js/api.js"});
const headers=["idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataforma","institucionId","hashRegistroOrigen","fechaMigracion","versionMapeo","estadoCorrespondencia","metodoCoincidencia","nivelConfianza","migradoPor"];
for(const h of headers) assert.ok(user.includes('"'+h+'"'),"header "+h);
for(const fn of ["registerLegacyIdentifierMapping","resolveInternalIdFromLegacy","resolveLegacyIdFromInternal","resolveUserByLegacyId","reviewLegacyIdentifierMapping","getIdentityDecisionHistory"]) {assert.ok(user.includes("function "+fn+"("));assert.ok(user.includes('case "'+fn+'"'));}
assert.ok(user.includes('const IDENTITY_MANAGER_ROLES_ = ["Administrador", "Secretaría"]'));
assert.ok(user.includes('"findPersonMatches", "linkPersonAccount"'),"identity candidate search and account linking require manager-only RBAC");
const permissionStart=user.indexOf("function validateRolePermission("),permissionEnd=user.indexOf("\n}",permissionStart);
const permissionContext={PUBLIC_ACTIONS:[],IDENTITY_MANAGER_ACTIONS_:["findPersonMatches","linkPersonAccount"],IDENTITY_MANAGER_ROLES_:["Administrador","Secretaría"],getUserVerifiedRole:function(p){return p.role;},validateContextualAccess:()=>({authorized:false,reason:"test"}),ROLE_PERMISSIONS:{},logStructuredEvent:()=>{}};
vm.runInNewContext(user.slice(permissionStart,permissionEnd+2)+"\nthis.validate=validateRolePermission;",permissionContext);
["findPersonMatches","linkPersonAccount"].forEach(function(action){assert.equal(permissionContext.validate(action,{role:"Secretaría"}).authorized,true);assert.equal(permissionContext.validate(action,{role:"Administrador"}).authorized,true);assert.equal(permissionContext.validate(action,{role:"Docente"}).authorized,false);});
assert.ok(user.includes('getProperty("IMA_INSTITUTION_ID")'));assert.ok(user.includes("LockService.getScriptLock()"));
assert.ok(user.includes("function ensureIdentityMappingSheet_()"));
assert.ok(user.includes("IDENTITY_MAPPING_NOT_INITIALIZED"));
assert.ok(user.includes("function identityTargetExists_"));
assert.ok(user.includes("const IDENTITY_TARGET_SCHEMAS_ = {"));
assert.ok(user.includes("JSON.stringify(headers) !== JSON.stringify(target.headers)"),"complete target schema must be validated");
const canonicalSchemas=[
  ['["PersonaID", "Nombres", "Apellidos", "Identificacion", "EmailContacto", "TelefonoContacto", "EstadoPersona", "FechaCreacion", "FechaActualizacion", "Observaciones"]',user],
  ['["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta", "FechaCreacion", "UltimoAcceso"]',user],
  ['["ExpedienteID", "PersonaID", "CodigoInstitucional", "FechaNacimiento", "Nacionalidad", "DireccionResidencia", "FotografiaUrl", "EstadoExpediente", "FechaCreacion", "FechaActualizacion", "Observaciones"]',academic],
  ['["ResponsableID", "PersonaID", "Nombres", "Apellidos", "Identificacion", "Telefono", "Email", "Direccion", "Ocupacion", "Estado"]',academic],
  ['["AsignaturaID", "NombreOficial", "Codigo", "AreaAcademica", "CargaHorariaRef", "Estado"]',academic],
  ['["MatriculaID", "Fecha", "UserId", "Alumno", "Grado", "Seccion", "Periodo", "Tipo", "Estado", "BecaDescuento", "Observaciones"]',academic],
  ['["DocumentoID", "ExpedienteID", "SolicitudID", "TipoDocumento", "NombreArchivo", "DriveFileId", "DriveUrl", "FechaRecepcion", "FechaVencimiento", "EstadoRevision", "SubidoPor", "ValidadoPor", "Observaciones"]',academic],
  ['["ExpedienteID", "PersonaId", "UserId", "Puesto", "Departamento", "CentroCosto", "FechaIngreso", "FechaSalida", "EstadoLaboral", "Observaciones"]',accounting],
  ['["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"]',accounting]
];
canonicalSchemas.forEach(([schema,source])=>assert.ok(source.includes(schema),"canonical destination schema "+schema));
const targetStart=user.indexOf("const IDENTITY_TARGET_SCHEMAS_ = {");
const targetFunctionStart=user.indexOf("function identityTargetExists_(",targetStart);
const targetEnd=user.indexOf(String.fromCharCode(10)+"}",targetFunctionStart);
assert.ok(targetStart>=0&&targetFunctionStart>targetStart&&targetEnd>targetFunctionStart,"destination schema registry and validator are extractable");
const targetSource=user.slice(targetStart,targetEnd+2);
let sheetByName={};
const targetContext={
  SPREADSHEET_ID:"isolated-test",
  SpreadsheetApp:{openById:function(){return {getSheetByName:function(name){return sheetByName[name]||null;}};}}
};
vm.runInNewContext(targetSource+String.fromCharCode(10)+"this.schemas=IDENTITY_TARGET_SCHEMAS_;this.exists=identityTargetExists_;",targetContext);
function mockSheet(headers,id){
  const row=headers.map(()=> "");
  row[0]=id;
  return {
    getRange:function(r,c,n,m){return {getValues:function(){return [headers.slice(0,m)];}};},
    getDataRange:function(){return {getValues:function(){return [headers,row];}};}
  };
}
Object.keys(targetContext.schemas).forEach(function(type){
  const schema=targetContext.schemas[type];
  sheetByName[schema.sheet]=mockSheet(schema.headers,"TARGET-1");
  assert.equal(targetContext.exists(type,"TARGET-1"),true,"valid full schema: "+type);
  const bad=schema.headers.slice();bad[bad.length-1]="WRONG_HEADER";
  sheetByName[schema.sheet]=mockSheet(bad,"TARGET-1");
  assert.equal(targetContext.exists(type,"TARGET-1"),false,"reject mismatched full schema: "+type);
});
assert.equal(targetContext.exists("persona",""),false,"empty destination ID rejected");
assert.equal(targetContext.exists("unknown","TARGET-1"),false,"unsupported entity rejected");
sheetByName={};
assert.equal(targetContext.exists("persona","TARGET-1"),false,"missing destination sheet rejected");
assert.ok(user.includes("IDENTITY_TARGET_NOT_FOUND_OR_UNSUPPORTED"));
assert.ok(user.includes("identityTextCell_(String(e.motivo || \"\").slice(0, 2000))"));
assert.ok(user.includes("identityHash_(sourceRecord)"));
assert.ok(user.includes("IDENTITY_MAPPING_CONFLICT"));assert.ok(user.includes('String(found[0][9])!=="CONFIRMADA"'));
assert.ok(user.includes("fusionAutomaticaPermitida: false"));assert.ok(accounting.includes("function resolveCrossReferenceIdentifier("));
assert.ok(!accounting.includes("DESTINATION_WRITER_NOT_CONFIGURED"),"legacy no-writer blocker must be removed after owner transport implementation");
assert.ok(accounting.includes("MIGRATION_TRANSPORT_CONFIGURATION_REQUIRED"));
assert.ok(accounting.includes("MIGRATION_BATCH_ROLLED_BACK"));assert.ok(method.includes("3.14.1 Respaldo alternativo verificable mediante el historial Git"));
const pure=user.match(/function identityCompositeKey_\([\s\S]*?\n\}/);assert.ok(pure);
const box={};vm.runInNewContext(pure[0]+"\nthis.key=identityCompositeKey_;",box);
assert.notEqual(box.key("SACE","estudiante","X","I1"),box.key("LEGACY","estudiante","X","I1"));
assert.notEqual(box.key("SACE","estudiante","X","I1"),box.key("SACE","usuario","X","I1"));
assert.notEqual(box.key("SACE","estudiante","X","I1"),box.key("SACE","estudiante","X","I2"));

assert.ok(persistence.includes("DB_VERSION: 5"));
assert.ok(persistence.includes("'identity_mapping_cache'"));
assert.ok(persistence.includes("IDENTITY_CACHE_ONLY_CONFIRMED_MAPPINGS"));
assert.ok(persistence.includes("clearIdentityMappingCache"));
assert.ok(api.includes("window.registerLegacyIdentifierMapping"));
assert.ok(api.includes("window.resolveInternalIdFromLegacy"));
assert.ok(api.includes("window.resolveLegacyIdFromInternal"));
assert.ok(api.includes("window.resolveUserByLegacyId"));
assert.ok(api.includes("window.reviewLegacyIdentifierMapping"));
assert.ok(api.includes("window.getIdentityDecisionHistory"));


const classifyStart=user.indexOf("function identityDateKey_(");
const classifyEnd=user.indexOf("\nfunction identityReadOptionalRows_", classifyStart);
assert.ok(classifyStart>=0&&classifyEnd>classifyStart,"identity candidate classifier is extractable");
const classifySource=user.slice(classifyStart,classifyEnd);
const classifyContext={normalizeString:function(value){return String(value||"").toLowerCase().trim();}};
vm.runInNewContext(classifySource+String.fromCharCode(10)+"this.classify=identityClassifyCandidate_;",classifyContext);
const candidate={identificacion:"0801-1990-12345",codigoInstitucional:"ALU-01",emailContacto:"ana@example.test",fullName:"ana perez",fechaNacimiento:"2010-05-10",responsibleIdentifications:["0801-1970-99999"],enrollmentIds:["MAT-01"]};
const exact=classifyContext.classify(candidate,{identificacion:"0801-1990-12345"});
assert.equal(exact.clasificacionIdentidad,"COINCIDENCIA_EXACTA_PENDIENTE_CONFIRMACION");
assert.equal(exact.fusionAutomaticaPermitida,false);
const probable=classifyContext.classify(candidate,{fechaNacimiento:"2010-05-10",responsableIdentificacion:"0801-1970-99999"});
assert.equal(probable.clasificacionIdentidad,"COINCIDENCIA_PROBABLE_PENDIENTE_REVISION");
assert.equal(classifyContext.classify(candidate,{matriculaId:"MAT-01"}).tipoCoincidencia,"HISTORIAL_MATRICULA");
assert.equal(classifyContext.classify(candidate,{fullName:"Ana Perez"}).clasificacionIdentidad,"POSIBLE_DUPLICADO");
assert.equal(classifyContext.classify(candidate,{fullName:"Luis Lopez"}),null);
assert.equal(classifyContext.classify(candidate,{fullName:"Ana Perez",identificacion:"9999-9999-99999"}),null,"same-name homonym with a different national ID remains independent");
assert.equal(classifyContext.classify(candidate,{fullName:"Ana Perez",fechaNacimiento:"2011-05-10"}),null,"same-name homonym with a different birth date remains independent");
assert.equal(classifyContext.classify(candidate,{identificacion:"0801-1990-12345",fechaNacimiento:"2011-05-10"}),null,"conflicting strong identity evidence vetoes a match");


function makeMigrationSheet(headers){const rows=[];return{rows,getRange:(r,c,n,m)=>({getValues:()=>rows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+m)),setValues:v=>v.forEach((x,i)=>rows[r-1+i]=x.slice()),setValue:v=>rows[r-1][c-1]=v}),getDataRange:()=>({getValues:()=>rows.map(x=>x.slice())}),appendRow:x=>rows.push(x.slice()),getLastRow:()=>rows.length,deleteRow:r=>rows.splice(r-1,1)};}
function runMigrationWriterFixture(source,entity){
 const schemaStart=source.indexOf("const MIGRATION_WRITER_SCHEMAS_"),firstFn=source.indexOf("function migrationStableJson_",schemaStart);assert.ok(schemaStart>=0&&firstFn>schemaStart);
 const constants=source.slice(schemaStart,firstFn),names=["migrationStableJson_","migrationSafeCell_","migrationEncodeSnapshot_","migrationDecodeSnapshot_","ensureMigrationWriterSheet_","applyTrustedMigrationWrite_","compensateTrustedMigrationWrite_"];
 const code=constants+names.map(n=>extractBalancedFunction(source,n)).join(String.fromCharCode(10))+"this.apply=applyTrustedMigrationWrite_;this.compensate=compensateTrustedMigrationWrite_;this.schemas=MIGRATION_WRITER_SCHEMAS_;this.journalHeaders=MIGRATION_WRITER_JOURNAL_HEADERS_;";
 const sheets={},ctx={SPREADSHEET_ID:"LOCAL",SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},Date,JSON,String,Object,Array,Error};
 const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>sheets[n]=makeMigrationSheet(n==="MigracionEscrituras"?ctx.journalHeaders:ctx.schemas[entity].headers)};
 vm.runInNewContext(code,ctx);
 const schema=ctx.schemas[entity];
 const data={};schema.headers.slice(1).forEach((h,i)=>data[h]="v"+i);
 const input={tipoEntidad:entity,idNuevoPlataforma:"INT-001",idempotencyKey:"MIG-001",datos:data};
 assert.equal(ctx.apply(input).accion,"INSERT");const target=sheets[schema.sheet];assert.equal(ctx.apply(input).idempotent,true);assert.equal(target.rows.length,2);
 assert.throws(()=>ctx.apply(Object.assign({},input,{datos:Object.assign({},data,{[schema.headers[1]]:"different"})})),/MIGRATION_IDEMPOTENCY_CONFLICT/);
 assert.equal(ctx.compensate({idempotencyKey:"MIG-001"}).compensated,true);assert.equal(target.rows.length,1);assert.equal(ctx.compensate({idempotencyKey:"MIG-001"}).idempotent,true);
 const dateField=schema.headers.find(h=>/^Fecha/.test(h)),dateIndex=schema.headers.indexOf(dateField),oldRow=schema.headers.map(()=>"");oldRow[0]="INT-OLD";oldRow[1]="Original";oldRow[dateIndex]=new Date("2020-02-03T04:05:06.000Z");target.rows.push(oldRow);
 const update={tipoEntidad:entity,idNuevoPlataforma:"INT-OLD",idempotencyKey:"MIG-UPDATE",datos:{[schema.headers[1]]:"Updated"}};
 assert.equal(ctx.apply(update).accion,"UPDATE");assert.equal(target.rows[1][1],"Updated");
 assert.equal(ctx.compensate({idempotencyKey:"MIG-UPDATE"}).compensated,true);assert.equal(target.rows[1][1],"Original");assert.ok(target.rows[1][dateIndex] instanceof Date,"Date type preserved during compensation");
}

runMigrationWriterFixture(user,"persona");
runMigrationWriterFixture(academic,"estudiante");
console.log("TASK-068 migration writers: upsert idempotency, payload conflict and compensation passed.");

function extractBalancedFunction(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function "+name+" exists");const open=source.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const ch=source[i],next=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch==="\x60"){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw new Error("unbalanced "+name);}
function runMigrationEnvelopeFixture(source,target){const secret="local-fixture-secret-0123456789-abcdef",cache=new Map(),calls=[];const names=["computeHmacSignature","createInterServiceEnvelope","verifyInterServiceEnvelope","handleTrustedMigrationEnvelope_"];const code=names.map(n=>extractBalancedFunction(source,n)).join(String.fromCharCode(10));const ctx={Utilities:{MacAlgorithm:{HMAC_SHA_256:"HMAC_SHA_256"},computeHmacSignature:(alg,msg,key)=>Array.from(crypto.createHmac("sha256",key).update(msg).digest()).map(b=>b>127?b-256:b)},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v)})},PropertiesService:{getScriptProperties:()=>({getProperty:()=>secret})},applyTrustedMigrationWrite_:p=>{calls.push(p);return{status:"success",written:true};},compensateTrustedMigrationWrite_:p=>{calls.push(p);return{status:"success",compensated:true};},Date,Math,JSON,String,Object,Array,Error};vm.runInNewContext(code,ctx);const payload={tipoEntidad:"persona",idNuevoPlataforma:"PER-1",idempotencyKey:"MIG-1",datos:{Nombres:"Ana"}};const envelope=ctx.createInterServiceEnvelope("ACCOUNTING",target,"writeMigratedEntity",payload,secret);assert.equal(ctx.handleTrustedMigrationEnvelope_(envelope).written,true);assert.equal(calls.length,1);assert.throws(()=>ctx.handleTrustedMigrationEnvelope_(envelope),/REPLAY_DETECTED/);const wrongSource=ctx.createInterServiceEnvelope("UNTRUSTED",target,"writeMigratedEntity",payload,secret);assert.throws(()=>ctx.handleTrustedMigrationEnvelope_(wrongSource),/MIGRATION_SOURCE_NOT_ALLOWED/);const tampered=ctx.createInterServiceEnvelope("ACCOUNTING",target,"writeMigratedEntity",payload,secret);tampered.payload.idNuevoPlataforma="PER-TAMPERED";assert.throws(()=>ctx.handleTrustedMigrationEnvelope_(tampered),/INVALID_INTERSERVICE_SIGNATURE/);}


function makeMigrationOrchestrationFixture(options){
 options=options||{};const calls=[],auditRows=[],state={writes:0,uuid:0};
 const audit={appendRow:row=>auditRows.push(row)},ss={};
 const ctx={
  SPREADSHEET_ID:"LOCAL",
  SpreadsheetApp:{openById:()=>ss},
  getOrCreateSheet:()=>audit,
  Utilities:{DigestAlgorithm:{SHA_256:"SHA-256"},Charset:{UTF_8:"UTF-8"},getUuid:()=> "RUN-"+(++state.uuid),computeDigest:(alg,value)=>Array.from(crypto.createHash("sha256").update(String(value)).digest()).map(b=>b>127?b-256:b)},
  resolveCrossReferenceIdentifier:p=>p.idOriginalLegado==="PENDING"?{status:"pending_review",code:"IDENTITY_REVIEW_REQUIRED"}:{status:"success",idMapeo:"MAP-"+p.idOriginalLegado,idNuevoPlataforma:"PER-SHARED"},
  sendMigrationOwnerRequest_:(entity,action,payload)=>{calls.push({entity,action,payload});if(action==="writeMigratedEntity"){state.writes++;if(options.failWriteAt===state.writes)throw new Error("MOCK_OWNER_WRITE_FAILED");return{status:"success"};}if(action==="compensateMigratedEntity"){if(options.failCompensation)throw new Error("MOCK_COMPENSATION_FAILED");return{status:"success",compensated:true};}throw new Error("unexpected action");},
  Date,JSON,String,Object,Array,Error
 };
 const start=accounting.indexOf("const MIGRATION_OWNER_SCHEMAS_"),first=accounting.indexOf("function migrationStableJson_",start);
 const constants=accounting.slice(start,first),names=["migrationStableJson_","migrationHash_","mapMigrationRowToTarget_","rollbackMigrationOwnerWrites_","importDataWithColumnMapping"];
 const code=constants+names.map(n=>extractBalancedFunction(accounting,n)).join(String.fromCharCode(10));
 vm.runInNewContext(code,ctx);
 return{ctx,calls,auditRows,state};
}
function runMigrationOrchestrationTests(source){
 const fixture=makeMigrationOrchestrationFixture(),payload=(system,legacy)=>({nombreArchivo:"fixture.csv",destinoModulo:"USER",columnaMapeo:{identificador:"legacy",campos:{Nombres:"Nombres",Apellidos:"Apellidos",Identificacion:"DNI"}},filasData:[{legacy:legacy,Nombres:"Ana",Apellidos:"Perez",DNI:"0801-1990-12345"}],creadoPor:"TEST",sistemaOrigen:system,tipoEntidad:"persona"});
 const a=fixture.ctx.importDataWithColumnMapping(payload("LEGACY_A","A-01"));const b=fixture.ctx.importDataWithColumnMapping(payload("LEGACY_B","B-99"));
 assert.equal(a.status,"success");assert.equal(b.status,"success");
 const writes=fixture.calls.filter(x=>x.action==="writeMigratedEntity");assert.equal(writes.length,2);
 assert.equal(writes[0].payload.idNuevoPlataforma,"PER-SHARED");assert.equal(writes[1].payload.idNuevoPlataforma,"PER-SHARED");
 assert.notEqual(writes[0].payload.idempotencyKey,writes[1].payload.idempotencyKey,"different source IDs retain distinct idempotency keys");
 const retry=fixture.ctx.importDataWithColumnMapping(payload("LEGACY_A","A-01"));assert.equal(retry.status,"success");
 assert.equal(fixture.calls.filter(x=>x.action==="writeMigratedEntity")[2].payload.idempotencyKey,writes[0].payload.idempotencyKey);
 const rollback=makeMigrationOrchestrationFixture({failWriteAt:2});
 const batch=Object.assign(payload("LEGACY_A","A-01"),{filasData:[{legacy:"A-01",Nombres:"Ana"},{legacy:"A-02",Nombres:"Luis"}]});
 const rolled=rollback.ctx.importDataWithColumnMapping(batch);assert.equal(rolled.code,"MIGRATION_BATCH_ROLLED_BACK");assert.equal(rolled.estado,"rolled_back");
 assert.equal(rollback.calls.filter(x=>x.action==="compensateMigratedEntity").length,1);
 const failedComp=makeMigrationOrchestrationFixture({failWriteAt:2,failCompensation:true});
 const compResult=failedComp.ctx.importDataWithColumnMapping(batch);assert.equal(compResult.code,"MIGRATION_COMPENSATION_REQUIRED");assert.equal(compResult.estado,"compensation_required");
 const pending=makeMigrationOrchestrationFixture();const pendingResult=pending.ctx.importDataWithColumnMapping(payload("LEGACY_A","PENDING"));
 assert.equal(pendingResult.estado,"failed_validation");assert.equal(pending.calls.length,0);
 assert.throws(()=>fixture.ctx.importDataWithColumnMapping(Object.assign(payload("LEGACY_A","A-01"),{destinoModulo:"ACADEMIC"})),/MIGRATION_DESTINATION_MISMATCH/);
}

runMigrationOrchestrationTests(accounting);
runMigrationEnvelopeFixture(user,"USER");
runMigrationEnvelopeFixture(academic,"ACADEMIC");
assert.ok(accounting.includes('getProperty("IMA_MIGRATION_HMAC_SECRET")'));
assert.ok(accounting.includes('urlProperty:"IMA_USER_SERVICE_URL"'));
assert.ok(accounting.includes('urlProperty:"IMA_ACADEMIC_SERVICE_URL"'));
assert.ok(accounting.includes("function sendMigrationOwnerRequest_"));
assert.ok(accounting.includes("function rollbackMigrationOwnerWrites_"));
assert.ok(accounting.includes("function mapMigrationRowToTarget_"));
assert.ok(user.includes('request && request.sourceService'));
assert.ok(academic.includes('request && request.sourceService'));
console.log("TASK-068 HMAC transport: signature, target binding, source allowlist and replay protection passed.");
console.log("TASK-068 identity mapping contract: syntax, schemas, destination validation and conservative identity classification passed.");


// TASK-068 local acceptance: multiple confirmed source references resolve to one canonical ID.
const mappingRows=[headers,
 ["MAP-1","SACE","estudiante","RNE-1","EXP-1","INST-1","h1",new Date(),"1","CONFIRMADA","ID_EXACTO","NO_CALIBRADA","ADMIN"],
 ["MAP-2","LEGACY_A","estudiante","A-77","EXP-1","INST-1","h2",new Date(),"1","CONFIRMADA","ID_EXACTO","NO_CALIBRADA","ADMIN"],
 ["MAP-3","LEGACY_B","estudiante","B-55","EXP-1","INST-1","h3",new Date(),"1","PENDIENTE_REVISION","SIN_CONFIRMAR","NO_CALIBRADA","ADMIN"],
 ["MAP-4","SACE","estudiante","RNE-OTHER","EXP-2","INST-2","h4",new Date(),"1","CONFIRMADA","ID_EXACTO","NO_CALIBRADA","ADMIN"]];
const mappingSheet={getDataRange:function(){return{getValues:function(){return mappingRows;}};}};
const mappingContext={requireIdentityManager_:function(){return{actorId:"ADMIN",role:"Administrador"};},getIdentityInstitutionId_:function(){return"INST-1";},getIdentityMappingSheet_:function(){return mappingSheet;},identityCompositeKey_:function(s,t,l,i){return JSON.stringify([String(s).trim(),String(t).trim().toLowerCase(),String(l).trim(),String(i).trim()]);}};
vm.runInNewContext(["resolveInternalIdFromLegacy","resolveLegacyIdFromInternal"].map(n=>extractBalancedFunction(user,n)).join(String.fromCharCode(10))+"this.resolve=resolveInternalIdFromLegacy;this.reverse=resolveLegacyIdFromInternal;",mappingContext);
assert.equal(mappingContext.resolve({sistemaOrigen:"SACE",tipoEntidad:"estudiante",idOriginalLegado:"RNE-1"}).idNuevoPlataforma,"EXP-1");
assert.equal(mappingContext.resolve({sistemaOrigen:"LEGACY_A",tipoEntidad:"estudiante",idOriginalLegado:"A-77"}).idNuevoPlataforma,"EXP-1");
const refs=mappingContext.reverse({tipoEntidad:"estudiante",idNuevoPlataforma:"EXP-1"});
assert.equal(refs.referencias.length,2,"two confirmed source systems map to the same internal ID");
assert.deepEqual(refs.referencias.map(x=>x.sistemaOrigen).sort(),["LEGACY_A","SACE"]);
assert.ok(!refs.referencias.some(x=>x.sistemaOrigen==="LEGACY_B"),"pending reference is not returned as confirmed");
assert.ok(!refs.referencias.some(x=>x.institucionId==="INST-2"),"cross-institution reference is excluded");

// TASK-068 relationship regression: candidate discovery reads family and enrollment links by canonical IDs.
const tables={
 "Personas":[["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto","TelefonoContacto","EstadoPersona"],["PER-1","Ana","Perez","0801-1990-12345","ana@example.test","","Activa"]],
 "ExpedientesEstudiantes":[["ExpedienteID","PersonaID","CodigoInstitucional","FechaNacimiento"],["EXP-1","PER-1","ALU-01","2010-05-10"]],
 "ResponsablesTutores":[["ResponsableID","PersonaID","Nombres","Apellidos","Identificacion"],["RES-1","PER-2","Luis","Perez","0801-1970-99999"]],
 "RelacionesFamiliares":[["RelacionID","PersonaID","ResponsableID","Tipo","Estado","FechaInicio","FechaFin"],["REL-1","PER-1","PER-2","Tutor","Verificada","",""]],
 "Usuarios":[["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID"],["USR-1","Ana","","","ana@example.test","","Estudiante","","1","PER-1"]],
 "Matriculas":[["MatriculaID","Fecha","UserId"],["MAT-1","2026-01-01","USR-1"]]
};
const ssFixture={getSheetByName:function(n){return tables[n]?{getDataRange:function(){return{getValues:function(){return tables[n].map(r=>r.slice());}};}}:null;}};
const findContext={SPREADSHEET_ID:"LOCAL",requireIdentityManager_:function(){return true;},SpreadsheetApp:{openById:function(){return ssFixture;}},getOrCreateSheet:function(_ss,n){return ssFixture.getSheetByName(n);},normalizeString:function(x){return String(x||"").toLowerCase().trim();}};
const findNames=["identityDateKey_","identityClassifyCandidate_","identityReadOptionalRows_","findPersonMatches"];
vm.runInNewContext(findNames.map(n=>extractBalancedFunction(user,n)).join(String.fromCharCode(10))+"this.find=findPersonMatches;",findContext);
const relationSnapshot=JSON.stringify(tables.RelacionesFamiliares),enrollmentSnapshot=JSON.stringify(tables.Matriculas);
const found=findContext.find({nombres:"Ana",apellidos:"Perez",responsableIdentificacion:"0801-1970-99999",matriculaId:"MAT-1"});
assert.equal(found.matches.length,1);
assert.equal(found.matches[0].personaId,"PER-1");
assert.equal(found.matches[0].evidencia.responsableCoincidente,true);
assert.equal(found.matches[0].evidencia.historialMatriculaCoincidente,true);
assert.equal(JSON.stringify(tables.RelacionesFamiliares),relationSnapshot,"candidate search must not mutate family relations");
assert.equal(JSON.stringify(tables.Matriculas),enrollmentSnapshot,"candidate search must not mutate enrollment links");

// TASK-068 IndexedDB cache contract: only confirmed, institution-scoped mappings may be cached.
const persistenceContext={window:{},Promise:Promise,Date:Date,console:console};
vm.runInNewContext(persistence,persistenceContext);
const pm=persistenceContext.window.PersistenceManager,cacheOps=[];
pm.set=function(store,data,key){cacheOps.push({op:"set",store:store,data:data,key:key});return Promise.resolve({id:key,data:data});};
pm.get=function(store,key){cacheOps.push({op:"get",store:store,key:key});return Promise.resolve({id:key});};
pm.getAll=function(){return Promise.resolve([{id:"a",data:{institutionId:"INST-1"}},{id:"b",data:{institutionId:"INST-2"}}]);};
pm.delete=function(store,key){cacheOps.push({op:"delete",store:store,key:key});return Promise.resolve();};
(async function(){
 const saved=await pm.setIdentityMappingCache({institutionId:"INST-1",sourceSystem:"SACE",entityType:"Estudiante",legacyId:"RNE-1",status:"success",confirmed:true,internalId:"EXP-1"});
 assert.equal(saved.id,JSON.stringify(["INST-1","SACE","estudiante","RNE-1"]));
 assert.equal(saved.data.status,"CONFIRMADA");
 assert.equal((await pm.getIdentityMappingCache("INST-1","SACE","ESTUDIANTE","RNE-1")).id,saved.id);
 await assert.rejects(pm.setIdentityMappingCache({institutionId:"INST-1",sourceSystem:"SACE",entityType:"estudiante",legacyId:"PENDING",status:"pending_review",confirmed:false,internalId:"EXP-2"}),/IDENTITY_CACHE_ONLY_CONFIRMED_MAPPINGS/);
 assert.equal(await pm.clearIdentityMappingCache("INST-1"),1);
 assert.ok(cacheOps.some(x=>x.op==="delete"&&x.key==="a"));
 console.log("TASK-068 local acceptance: multiple source references, relationship integrity and confirmed-only IndexedDB cache passed.");
})().catch(function(error){console.error(error);process.exitCode=1;});


// TASK-068 account linking: server-side justification, verified manager, audit and relation preservation.
const linkUsers=[["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID"],["USR-1","Ana","","","","","Estudiante","","1","PER-OLD"]];
const linkPeople=[["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto","TelefonoContacto","EstadoPersona","FechaCreacion","FechaActualizacion","Observaciones"],["PER-NEW","Ana","Perez","","","","Activa","","",""]];
const familyRows=[["RelacionID","PersonaID","ResponsableID","Tipo","Estado"],["REL-1","PER-OLD","PER-RESP","Tutor","Verificada"]];
const familyBefore=JSON.stringify(familyRows),decisionRows=[];
function linkSheet(rows){return{getDataRange:function(){return{getValues:function(){return rows.map(r=>r.slice());}};},getRange:function(row,col){return{setValue:function(value){rows[row-1][col-1]=value;}};}};}
const linkUserSheet=linkSheet(linkUsers),linkPeopleSheet=linkSheet(linkPeople),decisionSheet={appendRow:function(row){decisionRows.push(row);}};
const linkSS={};
const linkContext={
 SPREADSHEET_ID:"LOCAL",
 requireIdentityManager_:function(){return{actorId:"ADMIN-1",role:"Administrador"};},
 getIdentityInstitutionId_:function(){return"INST-1";},
 LockService:{getScriptLock:function(){return{waitLock:function(){},releaseLock:function(){}};}},
 SpreadsheetApp:{openById:function(){return linkSS;}},
 getSheetOrThrow:function(_ss,name){if(name==="Usuarios")return linkUserSheet;if(name==="Personas")return linkPeopleSheet;throw new Error("unexpected sheet "+name);},
 ensureIdentityDecisionSheet_:function(){return decisionSheet;},
 appendIdentityDecisionAudit_:function(sheet,event){sheet.appendRow([event.decision,event.idOriginalLegado,event.idNuevoPlataformaAnterior,event.idNuevoPlataformaNuevo,event.motivo,event.actorId,event.institucionId]);},
 identityTextCell_:function(value){return String(value==null?"":value);}
};
vm.runInNewContext(extractBalancedFunction(user,"linkPersonAccount")+"this.link=linkPersonAccount;",linkContext);
assert.throws(()=>linkContext.link({userId:"USR-1",personaId:"PER-NEW",motivo:"corto"}),/mínimo 10 caracteres/);
assert.equal(linkUsers[1][9],"PER-OLD","invalid reason cannot mutate account link");
const linked=linkContext.link({userId:"USR-1",personaId:"PER-NEW",motivo:"Correspondencia verificada por Secretaría"});
assert.equal(linked.status,"success");
assert.equal(linkUsers[1][9],"PER-NEW");
assert.equal(decisionRows.length,1,"link decision must be audited");
assert.equal(decisionRows[0][4],"Correspondencia verificada por Secretaría");
assert.equal(JSON.stringify(familyRows),familyBefore,"account linking must not rewrite family relationship IDs");


// TASK-068 mapping reconciliation: duplicate composite keys and orphan confirmed targets are surfaced, never auto-fixed.
const mappingAuditRows=[headers,
 ["MAP-OK","SACE","estudiante","RNE-OK","EXISTS","INST-1","h1",new Date(),"1","CONFIRMADA","EXACTA","NO_CALIBRADA","ADMIN"],
 ["MAP-DUP","SACE","estudiante","RNE-OK","EXISTS","INST-1","h2",new Date(),"1","CONFIRMADA","EXACTA","NO_CALIBRADA","ADMIN"],
 ["MAP-ORPHAN","LEGACY","estudiante","OLD-9","MISSING","INST-1","h3",new Date(),"1","CONFIRMADA","EXACTA","NO_CALIBRADA","ADMIN"],
 ["MAP-PENDING","LEGACY","estudiante","OLD-10","MISSING","INST-1","h4",new Date(),"1","PENDIENTE_REVISION","SIN_CONFIRMAR","NO_CALIBRADA","ADMIN"],
 ["MAP-BAD","","estudiante","OLD-11","EXISTS","INST-1","h5",new Date(),"1","PENDIENTE_REVISION","SIN_CONFIRMAR","NO_CALIBRADA","ADMIN"]];
const mappingAuditSheet={getRange:function(){return{getValues:function(){return[mappingAuditRows[0]];}};},getDataRange:function(){return{getValues:function(){return mappingAuditRows.map(r=>r.slice());}};}};
const mappingAuditContext={IDENTITY_MAPPING_HEADERS_:headers,identityCompositeKey_:function(s,t,l,i){return JSON.stringify([s,t,l,i]);},identityTargetExists_:function(type,id){return type==="estudiante"&&id==="EXISTS";}};
vm.runInNewContext(extractBalancedFunction(user,"auditIdentityMappingConsistency_")+"this.audit=auditIdentityMappingConsistency_;",mappingAuditContext);
const identityAuditIssues=mappingAuditContext.audit({getSheetByName:function(name){return name==="CorrespondenciaIdentificadores"?mappingAuditSheet:null;}});
assert.ok(identityAuditIssues.some(x=>x.type==="DUPLICATE_IDENTITY_MAPPING_KEY"));
assert.ok(identityAuditIssues.some(x=>x.type==="ORPHAN_CONFIRMED_IDENTITY_MAPPING"));
assert.ok(identityAuditIssues.some(x=>x.type==="INCOMPLETE_IDENTITY_MAPPING"));
assert.ok(!identityAuditIssues.some(x=>x.id==="MAP-PENDING"&&x.type==="ORPHAN_CONFIRMED_IDENTITY_MAPPING"));
assert.ok(identityAuditIssues.every(x=>x.status==="PENDIENTE_REVISION"));
assert.ok(user.includes("const identityMappingIssues = auditIdentityMappingConsistency_(ss);"));
assert.ok(user.includes("inconsistenciasIdentidad: identityMappingIssues"));


function runAccountingMigrationWriterFixture(source,entity){
 const schemaStart=source.indexOf("const ACCOUNTING_MIGRATION_WRITER_SCHEMAS_"),firstFn=source.indexOf("function accountingMigrationStableJson_",schemaStart);
 assert.ok(schemaStart>=0&&firstFn>schemaStart,"accounting migration writer schema "+entity);
 const constants=source.slice(schemaStart,firstFn),names=["accountingMigrationStableJson_","accountingMigrationSafeCell_","accountingMigrationEncodeSnapshot_","accountingMigrationDecodeSnapshot_","ensureAccountingMigrationSheet_","applyAccountingMigrationWrite_","compensateAccountingMigrationWrite_"];
 const code=constants+names.map(n=>extractBalancedFunction(source,n)).join(String.fromCharCode(10))+"this.apply=applyAccountingMigrationWrite_;this.compensate=compensateAccountingMigrationWrite_;this.schemas=ACCOUNTING_MIGRATION_WRITER_SCHEMAS_;";
 const sheets={},ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>sheets[n]=makeMigrationSheet([])};
 const ctx={SPREADSHEET_ID:"LOCAL",SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},Date,JSON,String,Object,Array,Error};
 vm.runInNewContext(code,ctx);const schema=ctx.schemas[entity],data={};
 schema.headers.slice(1).forEach((h,i)=>data[h]=/^Fecha/.test(h)?new Date("2026-02-03T04:05:06.000Z"):"v"+i);
 data[schema.headers[1]]="=1+1";
 const input={tipoEntidad:entity,idNuevoPlataforma:"OWNER-1",idempotencyKey:"ACC-MIG-1",datos:data};
 assert.equal(ctx.apply(input).accion,"INSERT");const target=sheets[schema.sheet];assert.equal(ctx.apply(input).idempotent,true);
 assert.equal(target.rows.length,2);assert.equal(target.rows[1][1],"'=1+1");
 assert.throws(()=>ctx.apply(Object.assign({},input,{datos:Object.assign({},data,{[schema.headers[1]]:"different"})})),/IDEMPOTENCY_CONFLICT/);
 assert.equal(ctx.compensate({idempotencyKey:"ACC-MIG-1"}).compensated,true);assert.equal(target.rows.length,1);
 const dateField=schema.headers.find(h=>/^Fecha/.test(h)),dateIndex=schema.headers.indexOf(dateField),oldRow=schema.headers.map(()=> "");
 oldRow[0]="OWNER-OLD";oldRow[1]="Original";oldRow[dateIndex]=new Date("2020-04-05T06:07:08.000Z");target.rows.push(oldRow);
 const update={tipoEntidad:entity,idNuevoPlataforma:"OWNER-OLD",idempotencyKey:"ACC-MIG-UPDATE",datos:{[schema.headers[1]]:"Updated"}};
 assert.equal(ctx.apply(update).accion,"UPDATE");assert.equal(target.rows[1][1],"Updated");
 assert.equal(ctx.compensate({idempotencyKey:"ACC-MIG-UPDATE"}).compensated,true);
 assert.equal(target.rows[1][1],"Original");assert.ok(target.rows[1][dateIndex] instanceof Date,"accounting owner writer restores typed Date snapshot");
}
runAccountingMigrationWriterFixture(accounting,"empleado");
runAccountingMigrationWriterFixture(accounting,"curso");
assert.ok(accounting.includes('if(route.service==="ACCOUNTING")'));
const accountingRouteContext={MIGRATION_OWNER_SCHEMAS_:{empleado:{service:"ACCOUNTING"},curso:{service:"ACCOUNTING"}},applyAccountingMigrationWrite_:p=>({status:"success",written:p.tipoEntidad}),compensateAccountingMigrationWrite_:p=>({status:"success",compensated:p.tipoEntidad})};
vm.runInNewContext(extractBalancedFunction(accounting,"sendMigrationOwnerRequest_")+"this.send=sendMigrationOwnerRequest_;",accountingRouteContext);
assert.equal(accountingRouteContext.send("empleado","writeMigratedEntity",{tipoEntidad:"empleado"}).written,"empleado");
assert.equal(accountingRouteContext.send("curso","compensateMigratedEntity",{tipoEntidad:"curso"}).compensated,"curso");
assert.throws(()=>accountingRouteContext.send("empleado","unknown",{}),/ACCOUNTING_MIGRATION_ACTION_NOT_ALLOWED/);


// TASK-068 real mapping workflow: register is idempotent, conflicting targets fail, human decisions are auditable.
const mappingDecisionHeaders=["decisionId","idMapeo","sistemaOrigen","tipoEntidad","idOriginalLegado","idNuevoPlataformaAnterior","idNuevoPlataformaNuevo","decision","motivo","actorUserId","actorRole","fechaDecision","institucionId"];
function makeIdentitySheet(rows){return{getDataRange:function(){return{getValues:function(){return rows.map(r=>r.slice());}};},appendRow:function(row){rows.push(row.slice());},getLastRow:function(){return rows.length;},deleteRow:function(row){rows.splice(row-1,1);},getRange:function(row,col){return{setValue:function(value){rows[row-1][col-1]=value;}};}};}
const mappingWorkflowRows=[headers],decisionWorkflowRows=[mappingDecisionHeaders];
const mappingWorkflowSheet=makeIdentitySheet(mappingWorkflowRows),decisionWorkflowSheet=makeIdentitySheet(decisionWorkflowRows);
let identityUuid=0;
const mappingWorkflowContext={
 requireIdentityManager_:function(){return{actorId:"ADMIN-1",role:"Administrador"};},
 getIdentityInstitutionId_:function(){return"INST-1";},
 ensureIdentityMappingSheet_:function(){return mappingWorkflowSheet;},
 ensureIdentityDecisionSheet_:function(){return decisionWorkflowSheet;},
 getIdentityMappingSheet_:function(){return mappingWorkflowSheet;},
 getIdentityDecisionSheet_:function(){return decisionWorkflowSheet;},
 identityCompositeKey_:function(s,t,l,i){return JSON.stringify([String(s).trim(),String(t).trim().toLowerCase(),String(l).trim(),String(i).trim()]);},
 identityTextCell_:function(v){const x=String(v==null?"":v);return /^[=+@-]/.test(x)?"'"+x:x;},
 identityHash_:function(v){return "HASH-"+String(v).length;},
 identityTargetExists_:function(type,id){return type==="persona"&&["PER-1","PER-2"].indexOf(id)!==-1;},
 appendIdentityDecisionAudit_:function(sheet,e){sheet.appendRow(["DEC-"+(decisionWorkflowRows.length),e.idMapeo||"",e.sistemaOrigen||"",e.tipoEntidad||"",e.idOriginalLegado||"",e.idNuevoPlataformaAnterior||"",e.idNuevoPlataformaNuevo||"",e.decision,e.motivo,e.actorId,e.actorRole,new Date(),e.institucionId]);},
 Utilities:{getUuid:function(){return"UUID-"+(++identityUuid);}},
 LockService:{getScriptLock:function(){return{waitLock:function(){},releaseLock:function(){}};}}
};
const mappingWorkflowFns=["registerLegacyIdentifierMapping","resolveInternalIdFromLegacy","resolveLegacyIdFromInternal","reviewLegacyIdentifierMapping","getIdentityDecisionHistory"];
vm.runInNewContext(mappingWorkflowFns.map(n=>extractBalancedFunction(user,n)).join(String.fromCharCode(10))+"this.register=registerLegacyIdentifierMapping;this.resolve=resolveInternalIdFromLegacy;this.reverse=resolveLegacyIdFromInternal;this.review=reviewLegacyIdentifierMapping;this.history=getIdentityDecisionHistory;",mappingWorkflowContext);
const sourceA=mappingWorkflowContext.register({sistemaOrigen:"SACE",tipoEntidad:"persona",idOriginalLegado:"RNE-100",idNuevoPlataforma:"PER-1"});
const sourceB=mappingWorkflowContext.register({sistemaOrigen:"LEGACY_A",tipoEntidad:"persona",idOriginalLegado:"A-100",idNuevoPlataforma:"PER-1"});
assert.equal(sourceA.estadoCorrespondencia,"PENDIENTE_REVISION");
assert.equal(sourceB.estadoCorrespondencia,"PENDIENTE_REVISION");
assert.equal(mappingWorkflowContext.register({sistemaOrigen:"SACE",tipoEntidad:"persona",idOriginalLegado:"RNE-100",idNuevoPlataforma:"PER-1"}).idempotent,true);
assert.throws(()=>mappingWorkflowContext.register({sistemaOrigen:"SACE",tipoEntidad:"persona",idOriginalLegado:"RNE-100",idNuevoPlataforma:"PER-2"}),/IDENTITY_MAPPING_CONFLICT/);
assert.equal(mappingWorkflowContext.resolve({sistemaOrigen:"SACE",tipoEntidad:"persona",idOriginalLegado:"RNE-100"}).status,"pending_review");
mappingWorkflowContext.review({idMapeo:sourceA.idMapeo,decision:"CONFIRMAR",motivo:"Identidad verificada contra expediente institucional"});
mappingWorkflowContext.review({idMapeo:sourceB.idMapeo,decision:"CONFIRMAR",motivo:"Segunda fuente conciliada por Secretaría"});
assert.equal(mappingWorkflowContext.resolve({sistemaOrigen:"SACE",tipoEntidad:"persona",idOriginalLegado:"RNE-100"}).idNuevoPlataforma,"PER-1");
assert.equal(mappingWorkflowContext.resolve({sistemaOrigen:"LEGACY_A",tipoEntidad:"persona",idOriginalLegado:"A-100"}).idNuevoPlataforma,"PER-1");
const reverseWorkflow=mappingWorkflowContext.reverse({tipoEntidad:"persona",idNuevoPlataforma:"PER-1"});
assert.equal(reverseWorkflow.referencias.length,2);
assert.equal(mappingWorkflowContext.history({idMapeo:sourceA.idMapeo}).historial.length,2,"registration and human confirmation are auditable");
