"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(source,name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const services=["user","academic","accounting","task","exam"];
const rows=[["rol","modulo","accion","permitido","ambito","ultimaModificacion","modificadoPor"],["Director","USER","readData",true,"Global"],["Director","USER","readData",false,"INST-A"],["Director","ACADEMIC","readData",true,"INST-A"],["Director","TASK","readData",true,"INST-B"],["Director","EXAM","readData","invalid","INST-A"],["Director","USER","globalOnly",true,"Global"],["Director","USER","denyWins",false,"Global"],["Director","USER","denyWins",true,"INST-A"],["Director","USER","duplicate",true,"INST-A"],["Director","USER","duplicate",true,"INST-A"]];
function run(service,data,tenant){
 const source=fs.readFileSync(path.resolve(__dirname,"../../backend/"+service+"-service/Code.gs"),"utf8");
 const versionRows=[["Clave","Version","UpdatedAt","UpdatedBy"],["PERMISSION_MATRIX",0,"",""]];
 const versionSheet={getDataRange:()=>({getValues:()=>versionRows.map(r=>r.slice())})};
 const matrixSheet={getLastRow:()=>data.length,getDataRange:()=>({getValues:()=>data.map(r=>r.slice())})};
 const context={SPREADSHEET_ID:"LOCAL",getIdentityInstitutionId_:()=>tenant,PropertiesService:{getScriptProperties:()=>({getProperty:()=>tenant})},
  cache:{},CacheService:{getScriptCache:()=>({get:(k)=>context.cache[k]||null,put:(k,v)=>{context.cache[k]=v;},remove:(k)=>{delete context.cache[k];}})},
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="VersionesSeguridad"?versionSheet:matrixSheet})}};
 const versionPrelude=source.slice(source.indexOf("var SECURITY_VERSION_HEADERS_"),source.indexOf("function getDynamicPermissionsForRole"));
 vm.runInNewContext('const PERMISSION_MATRIX_SERVICE_="'+service.toUpperCase()+'";\n'+versionPrelude+"\n"+extract(source,"getPermissionMatrixInstitutionId_")+"\n"+extract(source,"getDynamicPermissionsForRole")+"\nthis.lookup=getDynamicPermissionsForRole;",context);
 return context.lookup;
}
for(const service of services){const lookup=run(service,rows,"INST-A");if(service==="user")assert.equal(lookup("Director","readData"),false);if(service==="academic")assert.equal(lookup("Director","readData"),true);if(service==="task")assert.equal(lookup("Director","readData"),false);if(service==="accounting")assert.equal(lookup("Director","readData"),false);if(service==="exam")assert.equal(lookup("Director","readData"),false);}
const user=run("user",rows,"INST-A");assert.equal(user("Director","globalOnly"),true);assert.equal(user("Director","denyWins"),false);assert.equal(user("Director","duplicate"),false);assert.equal(run("user",rows,"")("Director","globalOnly"),false);assert.equal(run("user",[rows[0]],"INST-A")("Director","unconfigured"),null);assert.equal(run("user",[["role","action"]],"INST-A")("Director","x"),false);
const us=fs.readFileSync(path.resolve(__dirname,"../../backend/user-service/Code.gs"),"utf8"),save=extract(us,"savePermissionMatrix");assert.ok(save.includes("PERMISSION_MATRIX_DUPLICATE_KEY")&&save.includes("waitLock")&&us.includes("HistorialMatrizPermisos"));assert.ok(save.includes("getPermissionMatrixAdminContext_")&&save.includes("PERMISSION_MATRIX_GLOBAL_ADMIN_REQUIRED"));
const dashboard=fs.readFileSync(path.resolve(__dirname,"../../developer-dashboard.html"),"utf8"),controller=fs.readFileSync(path.resolve(__dirname,"../../js/developer.js"),"utf8");["permission-matrix-role","permission-matrix-module","permission-matrix-action","permission-matrix-scope","permission-matrix-allowed","permission-matrix-rows"].forEach(id=>assert.ok(dashboard.includes('id="'+id+'"')));assert.ok(controller.includes("migrateLegacyPermissionMatrix")&&controller.includes("textContent"));

function makeSheet(initial){const rows=initial.map(r=>r.slice()),sheet={rows,failAppend:false,getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),appendRow:r=>{if(sheet.failAppend)throw Error("AUDIT_WRITE_FAIL");rows.push(r.slice());},getRange:(row,col,nr,nc)=>({setValues:vals=>{for(let y=0;y<nr;y++){while(rows.length<row+y)rows.push([]);for(let x=0;x<nc;x++)rows[row+y-1][col+x-1]=vals[y][x];}}}),deleteRow:n=>rows.splice(n-1,1)};return sheet;}
const matrixSheet=makeSheet([["rol","modulo","accion","permitido","ambito","ultimaModificacion","modificadoPor"]]),auditSheet=makeSheet([]),versionSheet=makeSheet([["Clave","Version","UpdatedAt","UpdatedBy"]]);
let activeRole="Administrador",lockCalls=0;
const handlerContext={SPREADSHEET_ID:"LOCAL",ROLE_PERMISSIONS:{Administrador:["*"],Desarrollador:["*"],Director:["getStudents","getNews"]},getUserVerifiedRole:p=>{p._verifiedUserId="verified-admin";return activeRole;},getIdentityInstitutionId_:()=>"INST-A",getOrCreateSheet:(ss,name)=>name==="MatrizPermisosRoles"?matrixSheet:auditSheet,SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="VersionesSeguridad"?versionSheet:(name==="MatrizPermisosRoles"?matrixSheet:(name==="HistorialMatrizPermisos"?auditSheet:null)),insertSheet:()=>versionSheet})},LockService:{getScriptLock:()=>({waitLock:()=>{lockCalls++;},releaseLock:()=>{}})},Utilities:{getUuid:()=>"AUDIT-ID"},CacheService:{getScriptCache:()=>({remove:()=>{}})}};
const versionPrelude=us.slice(us.indexOf("var SECURITY_VERSION_HEADERS_"),us.indexOf("function getDynamicPermissionsForRole"));
const matrixPrelude=us.slice(us.indexOf("const PERMISSION_MATRIX_MODULES_"),us.indexOf("function getPermissionMatrix(payload)"));
const handlerCode=versionPrelude+"\n"+extract(us,"incrementSecurityVersionLocked_")+"\n"+extract(us,"getPermissionMatrixInstitutionId_")+"\n"+matrixPrelude+"\n"+extract(us,"getPermissionMatrixAdminContext_")+"\n"+extract(us,"getPermissionMatrixAuditSheet_")+"\n"+save;
vm.runInNewContext(handlerCode+"\nthis.savePermissionMatrix=savePermissionMatrix;",handlerContext);
const rule={rol:"Director",modulo:"USER",accion:"getStudents",permitido:true,ambito:"INST-A"};
assert.equal(handlerContext.savePermissionMatrix(rule).status,"success","authorized admin can create exact tuple");
assert.equal(handlerContext.savePermissionMatrix(rule).idempotent,true,"repeated identical upsert is idempotent");
assert.equal(handlerContext.savePermissionMatrix({...rule,permitido:false}).status,"success","same tuple updates rather than duplicates");
assert.equal(matrixSheet.rows.length,2,"same tuple must occupy one row");
assert.equal(matrixSheet.rows[1][3],false,"update must persist explicit denial");
assert.equal(handlerContext.savePermissionMatrix({rol:"Director",modulo:"ACADEMIC",accion:"getClassSchedules",permitido:true,ambito:"INST-A"}).status,"success","separate module rule can coexist");
assert.equal(matrixSheet.rows.length,3,"different module tuple must not collide");
matrixSheet.rows.push(matrixSheet.rows[1].slice());
assert.equal(handlerContext.savePermissionMatrix({...rule,permitido:true}).code,"PERMISSION_MATRIX_DUPLICATE_KEY","duplicate tuple fails closed");
matrixSheet.rows.pop();
activeRole="Director";
assert.equal(handlerContext.savePermissionMatrix(rule).code,"PERMISSION_MATRIX_ADMIN_REQUIRED","direct endpoint call requires verified admin");
activeRole="Administrador";
assert.equal(handlerContext.savePermissionMatrix({...rule,ambito:"Global"}).code,"PERMISSION_MATRIX_GLOBAL_ADMIN_REQUIRED","tenant admin cannot edit global rules");
assert.equal(handlerContext.savePermissionMatrix({...rule,accion:"notARealAction"}).code,"PERMISSION_MATRIX_ACTION_INVALID","unknown actions are rejected");
const beforeCompensation=matrixSheet.rows[1].slice();auditSheet.failAppend=true;
assert.notEqual(handlerContext.savePermissionMatrix({...rule,permitido:true}).status,"success","audit failure aborts write");
assert.deepEqual(matrixSheet.rows[1],beforeCompensation,"audit failure restores previous row");
assert.ok(lockCalls>=6,"writes are serialized by script lock");
process.stdout.write("permission matrix dimensions, tenant isolation, deny precedence, malformed/duplicate fail-closed, protected upsert, audit compensation and UI contract PASS\n");
