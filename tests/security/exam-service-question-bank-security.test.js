const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source);
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
  const end = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, end < 0 ? source.length : end);
}
const bankRows = [
 ["BancoPreguntaID","AreaCurricular","Asignatura","Grado","Tema","Dificultad","Tipo","TextoPregunta","OpcionesJSON","RespuestaCorrecta","Etiquetas","PuntosPredeterminados","Estado"],
 ["BNK-D1","Ciencias","Biología","10","Célula","Media","opcion_multiple","Propia","{}","A","",1,"Activo"],
 ["BNK-D2","Ciencias","Física","10","Energía","Media","opcion_multiple","Ajena","{}","B","",1,"Activo"],
 ["BNK-LEGACY","General","","","","Media","opcion_multiple","Legacy","{}","A","",1,"Activo"],
 ["BNK-DUP","General","","","","Media","opcion_multiple","Duplicada","{}","A","",1,"Activo"],
 ["BNK-RACE","General","","","","Media","opcion_multiple","Race","{}","A","",1,"Activo"]
];
const ownershipRows = [
 ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],
 ["OWN-D1","I1","BANCO_PREGUNTA","BNK-D1","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-D2","I1","BANCO_PREGUNTA","BNK-D2","D2","ACTIVE","TEACHER-2","",""],
 ["OWN-RACE","I1","BANCO_PREGUNTA","BNK-RACE","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-DUP1","I1","BANCO_PREGUNTA","BNK-DUP","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-DUP2","I1","BANCO_PREGUNTA","BNK-DUP","D1","ACTIVE","TEACHER-1","",""]
];
const scopeRows = [
 ["AssignmentID","UserID","RoleID","ScopeType","ScopeValues","Status","","","StartAt","EndAt"],
 ["ASG-1","TEACHER-1","Profesor","DEPARTAMENTO","D1","ACTIVO","","","",""],
 ["ASG-2","TEACHER-2","Profesor","DEPARTAMENTO","D2","ACTIVO","","","",""]
];
const claims = {
 "teacher-token": {userId:"TEACHER-1",role:"Profesor"},
 "other-token": {userId:"TEACHER-2",role:"Profesor"},
 "student-token": {userId:"STUDENT-1",role:"Estudiante"}
};
let failBankAppend=false, lockAvailable=true, lockHeld=false, beforeAcquire=null, lockAcquires=0, lockReleases=0, uuid=0;
function makeSheet(rows,kind) {
 return {
  getDataRange(){return {getValues:()=>rows.map(row=>row.slice())};},
  appendRow(row){if(kind==="bank"&&failBankAppend){failBankAppend=false;throw Error("synthetic bank append failure");}rows.push(row.slice());},
  deleteRow(n){rows.splice(n-1,1);},
  getRange(row,col,numRows,numCols){return {
   setValue(v){rows[row-1][col-1]=v;},
   setValues(values){values.forEach((v,ri)=>{for(let ci=0;ci<(numCols||v.length);ci++)rows[row-1+ri][col-1+ci]=v[ci];});}
  };}
 };
}
const bankSheet=makeSheet(bankRows,"bank"), ownershipSheet=makeSheet(ownershipRows,"ownership");
const sheets={BancoPreguntas:bankSheet,ResourceOwnership:ownershipSheet,AsignacionesAmbitosRoles:makeSheet(scopeRows,"scope")};
const ss={getSheetByName(name){return sheets[name]||null;}};
const runtime={
 SPREADSHEET_ID:"LOCAL",EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_:new WeakMap(),
 ROLE_PERMISSIONS:{Profesor:["manageQuestionBank"],Estudiante:[]},PUBLIC_ACTIONS:[],
 getDynamicPermissionsForRole(){return null;},hasActiveDelegationForAction(){return false;},
 verifySessionToken(token){return claims[token]||null;},validateContextualAccess(){return {authorized:true};},
 PropertiesService:{getScriptProperties(){return {getProperty(name){return name==="IMA_INSTITUTION_ID"?"I1":null;}};}},
 SpreadsheetApp:{openById(){return ss;}},getSheetOrThrow(spreadsheet,name){const sheet=spreadsheet.getSheetByName(name);if(!sheet)throw Error("Missing "+name);return sheet;},
 getOrCreateSheet(spreadsheet,name){const sheet=spreadsheet.getSheetByName(name);if(!sheet)throw Error("Missing "+name);return sheet;},
 Utilities:{getUuid(){uuid++;return "UUID-"+uuid;}},
 LockService:{getScriptLock(){return {
  tryLock(){lockAcquires++;if(beforeAcquire){const fn=beforeAcquire;beforeAcquire=null;fn();}if(!lockAvailable||lockHeld)return false;lockHeld=true;return true;},
  releaseLock(){lockReleases++;lockHeld=false;}
 };}}
};
const names=["getVerifiedExamIdentity_","getVerifiedExamDepartmentScope_","assertExamResourceOwnershipForScope_","validateRolePermission","getAuthorizedQuestionBankMutationContext_","withAuthorizedQuestionBankMutation_","manageQuestionBank","manageQuestionBankUnlocked_"];
vm.runInNewContext(names.map(extract).join("\n")+"\nthis.manageQuestionBank=manageQuestionBank;",runtime);
const created=runtime.manageQuestionBank({sessionToken:"teacher-token",departmentId:"D1",accion:"crear",areaCurricular:"Ciencias",asignatura:"Biología",textoPregunta:"Nueva",opcionesJSON:{A:"Uno"},respuestaCorrecta:"A"});
assert.equal(created.status,"success");
assert.ok(created.bancoPreguntaId.startsWith("BNK-"));
assert.equal(bankRows.find(r=>r[0]===created.bancoPreguntaId)[7],"Nueva");
assert.equal(ownershipRows.filter(r=>r[3]===created.bancoPreguntaId&&r[2]==="BANCO_PREGUNTA").length,1);
assert.equal(ownershipRows.find(r=>r[3]===created.bancoPreguntaId)[4],"D1");
const updated=runtime.manageQuestionBank({sessionToken:"teacher-token",bancoPreguntaId:"BNK-D1",accion:"actualizar",textoPregunta:"Actualizada",opcionesJSON:{A:"Nueva"}});
assert.equal(updated.status,"success");
assert.equal(bankRows.find(r=>r[0]==="BNK-D1")[7],"Actualizada");
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"other-token",bancoPreguntaId:"BNK-D1",accion:"actualizar",textoPregunta:"Ataque"}),/RESOURCE_NOT_AVAILABLE/);
assert.equal(bankRows.find(r=>r[0]==="BNK-D1")[7],"Actualizada");
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",bancoPreguntaId:"BNK-D2",accion:"eliminar"}),/RESOURCE_NOT_AVAILABLE/);
assert.equal(bankRows.find(r=>r[0]==="BNK-D2")[12],"Activo");
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",bancoPreguntaId:"BNK-LEGACY",accion:"actualizar"}),/RESOURCE_NOT_AVAILABLE/);
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",bancoPreguntaId:"BNK-DUP",accion:"actualizar"}),/RESOURCE_NOT_AVAILABLE/);
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"student-token",bancoPreguntaId:"BNK-D1",accion:"actualizar"}),/RESOURCE_NOT_AVAILABLE/);
const deleted=runtime.manageQuestionBank({sessionToken:"teacher-token",bancoPreguntaId:"BNK-D1",accion:"eliminar"});
assert.equal(deleted.status,"success");
assert.equal(bankRows.find(r=>r[0]==="BNK-D1")[12],"Inactivo");
assert.equal(ownershipRows.find(r=>r[3]==="BNK-D1"&&r[5]==="INACTIVE")[5],"INACTIVE");
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",accion:"crear",departmentId:"D2",textoPregunta:"Cross"}),/RESOURCE_SCOPE_DENIED/);
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",accion:"eliminar"}),/RESOURCE_NOT_AVAILABLE/);
const bankBefore=bankRows.length,ownerBefore=ownershipRows.length;
lockAvailable=false;
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",departmentId:"D1",accion:"crear",textoPregunta:"Timeout"}),/QUESTION_BANK_LOCK_TIMEOUT/);
assert.equal(bankRows.length,bankBefore);assert.equal(ownershipRows.length,ownerBefore);lockAvailable=true;
beforeAcquire=()=>{const i=bankRows.findIndex(r=>r[0]==="BNK-RACE");if(i>=0)bankRows.splice(i,1);};
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",bancoPreguntaId:"BNK-RACE",accion:"actualizar"}),/RESOURCE_NOT_AVAILABLE/);
assert.equal(bankRows.some(r=>r[0]==="BNK-RACE"),false);
const bankCount=bankRows.length,ownerCount=ownershipRows.length;
failBankAppend=true;
assert.throws(()=>runtime.manageQuestionBank({sessionToken:"teacher-token",departmentId:"D1",accion:"crear",textoPregunta:"Rollback"}),/synthetic bank append failure/);
assert.equal(bankRows.length,bankCount);assert.equal(ownershipRows.length,ownerCount);
assert.equal(lockAcquires,lockReleases+1,"only the contended lock acquisition is unreleased");
process.stdout.write("exam-service-question-bank-security: ownership, department scope, serialized writes and rollback assertions passed\n");
