"use strict";
const assert=require("node:assert/strict"),crypto=require("node:crypto"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const accounting=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");
const user=fs.readFileSync(path.join(root,"backend/user-service/Code.gs"),"utf8");
const academic=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8");
function extract(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,name+" exists");const open=source.indexOf("{",start);
 let depth=0,quote="",escape=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="`"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}
 throw new Error("Unbalanced "+name);
}
const secret="remote-snapshot-hmac-secret-with-more-than-32-characters";
function ownerRuntime(source,service,handlerName,snapshotName,rows,expectedSheet,idField){
 const handler=extract(source,handlerName),snapshot=extract(source,snapshotName);
 const runtime={
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==="IMA_MIGRATION_HMAC_SECRET"?secret:(key==="IMA_INSTITUTION_ID"?"INST-1":"")})},
  verifyInterServiceEnvelope:(envelope,target,supplied)=>{assert.equal(target,service);assert.equal(supplied,secret);return{sourceService:envelope.sourceService,action:envelope.action,payload:envelope.payload};},
  verifySessionToken:token=>token==="SIGNED-SESSION"?{userId:"U-1",role:"Director",institutionId:"INST-1"}:null,
  getIdentityInstitutionId_:()=>"INST-1",
  getDynamicPermissionsForRole:()=>true,
  migrationStableJson_:value=>JSON.stringify(value),
  migrationHash_:value=>crypto.createHash("sha256").update(String(value)).digest("hex"),
  SPREADSHEET_ID:"TEST",
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>name===expectedSheet?{getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())})}:null})}
 };
 vm.createContext(runtime);
 vm.runInContext(snapshot+"\n"+handler+"\nthis.handle= "+handlerName+";",runtime);
 return runtime;
}
const userRuntime=ownerRuntime(user,"USER","handleTrustedMigrationEnvelope_","getTrustedMigrationTargetExistenceSnapshot_",
 [["PersonaID","Nombres"],["PER-1","PERSONA PRIVADA"],["PER-2","OTRA PERSONA"]],"Personas","PersonaID");
const userResult=userRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"persona",targetIds:["PER-1","MISSING"]}});
assert.equal(userResult.verified,true);assert.deepEqual(Array.from(userResult.existingTargetIds),["PER-1"]);assert.equal(userResult.targetRows.length,0);
assert.ok(!JSON.stringify(userResult).includes("PERSONA PRIVADA"),"USER returns IDs only, not personal data");
assert.equal(userRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"persona",targetIds:[""]}}).code,"MIGRATION_SNAPSHOT_TARGET_ID_INVALID");
const duplicateUserRuntime=ownerRuntime(user,"USER","handleTrustedMigrationEnvelope_","getTrustedMigrationTargetExistenceSnapshot_",[["PersonaID"],["PER-1"],["PER-1"]],"Personas","PersonaID");
assert.equal(duplicateUserRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"persona",targetIds:["PER-1"]}}).code,"MIGRATION_SNAPSHOT_DUPLICATE_TARGET_ID");
assert.equal(userRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"FORGED",institutionId:"INST-1",entityType:"persona",targetIds:["PER-1"]}}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(userRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-2",entityType:"persona",targetIds:["PER-1"]}}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.throws(()=>userRuntime.handle({sourceService:"ACADEMIC",action:"getMigrationTargetExistenceSnapshot",payload:{}}),/MIGRATION_SOURCE_NOT_ALLOWED/);
const academicRuntime=ownerRuntime(academic,"ACADEMIC","handleTrustedMigrationEnvelope_","getTrustedAcademicMigrationTargetExistenceSnapshot_",
 [["ExpedienteID","PersonaID"],["EXP-1","PER-1"],["EXP-2","PER-2"]],"ExpedientesEstudiantes","ExpedienteID");
const academicResult=academicRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"estudiante",targetIds:["EXP-1","MISSING"]}});
assert.equal(academicResult.verified,true);assert.deepEqual(Array.from(academicResult.existingTargetIds),["EXP-1"]);assert.equal(academicResult.targetRows.length,1);assert.equal(academicResult.targetRows[0].ExpedienteID,"EXP-1");assert.match(academicResult.targetRows[0].__rowHash,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(academicResult.targetRows).includes("PER-1"),"ACADEMIC returns row hashes, not student personal data");
assert.equal(academicRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"estudiante",targetIds:[""]}}).code,"MIGRATION_SNAPSHOT_TARGET_ID_INVALID");
const duplicateAcademicRuntime=ownerRuntime(academic,"ACADEMIC","handleTrustedMigrationEnvelope_","getTrustedAcademicMigrationTargetExistenceSnapshot_",[["ExpedienteID","PersonaID"],["EXP-1","PER-1"],["EXP-1","PER-2"]],"ExpedientesEstudiantes","ExpedienteID");
assert.equal(duplicateAcademicRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"estudiante",targetIds:["EXP-1"]}}).code,"MIGRATION_SNAPSHOT_DUPLICATE_TARGET_ID");
assert.equal(academicRuntime.handle({sourceService:"ACCOUNTING",action:"getMigrationTargetExistenceSnapshot",payload:{sessionToken:"SIGNED-SESSION",institutionId:"INST-1",entityType:"persona",targetIds:["EXP-1"]}}).code,"MIGRATION_SNAPSHOT_CONTRACT_INVALID");

const accountingFunctions=["isAccountingTrustedAppsScriptEndpoint_","accountingComputeHmacSignature_","requestAccountingTrustedOwnerSnapshot_","buildMigrationTargetExistenceSnapshot_","buildAccountingRelatedPersonExistenceSnapshot_"].map(name=>extract(accounting,name));
let remoteData={status:"success",verified:true,service:"ACADEMIC",sheet:"ExpedientesEstudiantes",idField:"ExpedienteID",institutionId:"INST-1",existingTargetIds:["EXP-1"],targetRows:[{ExpedienteID:"EXP-1",__rowHash:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]};
let envelopeSeen=null;
const accountingRuntime={
 Date,String,JSON,Array,Object,Number,Math,RegExp,Error,
 PropertiesService:{getScriptProperties:()=>({getProperty:key=>({IMA_ACADEMIC_SERVICE_URL:"https://script.google.com/macros/s/AKfycbACADEMIC123/exec",IMA_USER_SERVICE_URL:"https://script.google.com/macros/s/AKfycbUSER123/exec",IMA_MIGRATION_HMAC_SECRET:secret})[key]||""})},
 Utilities:{MacAlgorithm:{HMAC_SHA_256:"HMAC_SHA_256"},getUuid:()=>"12345678-1234-1234-1234-123456789012",computeHmacSignature:(algorithm,message,key)=>Array.from(crypto.createHmac("sha256",key).update(String(message)).digest())},
 UrlFetchApp:{fetch:(url,options)=>{envelopeSeen=JSON.parse(options.payload);return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({apiVersion:"1.0.0",status:"success",data:remoteData})};}}
};
vm.createContext(accountingRuntime);
vm.runInContext(accountingFunctions.join("\n")+"\nthis.api={endpoint:isAccountingTrustedAppsScriptEndpoint_,target:buildMigrationTargetExistenceSnapshot_,related:buildAccountingRelatedPersonExistenceSnapshot_};",accountingRuntime);
const schema={service:"ACADEMIC",sheet:"ExpedientesEstudiantes",headers:["ExpedienteID","PersonaID"]};
assert.equal(accountingRuntime.api.endpoint("https://script.google.com/macros/s/AKfycbACADEMIC123/exec"),true);
assert.equal(accountingRuntime.api.endpoint("https://script.google.com/a/macros/example.edu/s/AKfycbACADEMIC123/exec"),true);
assert.equal(accountingRuntime.api.endpoint("http://script.google.com/macros/s/AKfycbACADEMIC123/exec"),false);
assert.equal(accountingRuntime.api.endpoint("https://script.google.com/macros/s/AKfycbACADEMIC123/exec?x=1"),false);
const target=accountingRuntime.api.target(schema,[{ExpedienteID:"EXP-1"}],"INST-1",{}, {sessionToken:"SIGNED-SESSION"});
assert.equal(target.verified,true);assert.deepEqual(Array.from(target.existingTargetIds),["EXP-1"]);assert.equal(target.targetRows[0].__rowHash,"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
assert.equal(envelopeSeen.action,"getMigrationTargetExistenceSnapshot");assert.equal(envelopeSeen.targetService,"ACADEMIC");
const signedBody=[envelopeSeen.requestId,envelopeSeen.timestamp,envelopeSeen.correlationId,envelopeSeen.sourceService,envelopeSeen.targetService,envelopeSeen.action,JSON.stringify(envelopeSeen.payload)].join("|");
assert.equal(envelopeSeen.hmacSignature,crypto.createHmac("sha256",secret).update(signedBody).digest("hex"));
remoteData={status:"success",verified:true,service:"USER",sheet:"Personas",idField:"PersonaID",institutionId:"INST-1",existingTargetIds:["PER-1"],targetRows:[]};
const related=accountingRuntime.api.related([{PersonaId:"PER-1"}],"empleado","INST-1",{sessionToken:"SIGNED-SESSION"});
assert.equal(related.verified,true);assert.deepEqual(Array.from(related.existingTargetIds),["PER-1"]);
remoteData={status:"error",code:"MIGRATION_OWNER_SERVICE_NOT_CONFIGURED"};
assert.equal(accountingRuntime.api.related([{PersonaID:"PER-1"}],"estudiante","INST-1",{sessionToken:"SIGNED-SESSION"}).verified,false);
process.stdout.write("Accounting USER/ACADEMIC remote target snapshot contract: all assertions passed.\n");
