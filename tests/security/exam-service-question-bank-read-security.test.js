const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extractFunction(text, name) {
  const start = text.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c.charCodeAt(0) === 96) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
const claims = {
  "teacher-token": { userId: "TEACHER-1", role: "Profesor" },
  "reader-token": { userId: "READER-1", role: "Lector" },
  "student-token": { userId: "STUDENT-1", role: "Estudiante" },
  "unscoped-token": { userId: "UNSCOPED-1", role: "Lector" }
};
const bankRows = [
 ["BancoPreguntaID","AreaCurricular","Asignatura","Grado","Tema","Dificultad","Tipo","TextoPregunta","OpcionesJSON","RespuestaCorrecta","Etiquetas","PuntosPredeterminados","Estado"],
 ["Q-D1","Ciencias","Biología","10","Célula","Media","opcion_multiple","Pregunta propia",'{"A":"Uno"}',"A","bio",1,"Activo"],
 ["Q-D2","Ciencias","Física","10","Energía","Media","opcion_multiple","Pregunta otro departamento","{}","B","fis",1,"Activo"],
 ["Q-LEGACY","General","","10","","Media","opcion_multiple","Sin ownership","{}","C","",1,"Activo"],
 ["Q-DUP","General","","10","","Media","opcion_multiple","Ownership duplicado","{}","D","",1,"Activo"],
 ["Q-INACTIVE","General","","10","","Media","opcion_multiple","Inactiva","{}","E","",1,"Inactivo"],
 ["Q-OTHER-INSTITUTION","General","","10","","Media","opcion_multiple","Otra institución","{}","F","",1,"Activo"],
 ["Q-D1-2","Ciencias","Biología","10","Célula","Difícil","opcion_multiple","Otra propia","{}","G","bio",2,"Activo"]
];
const ownershipRows = [
 ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],
 ["OWN-1","I1","BANCO_PREGUNTA","Q-D1","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-2","I1","BANCO_PREGUNTA","Q-D2","D2","ACTIVE","TEACHER-2","",""],
 ["OWN-4A","I1","BANCO_PREGUNTA","Q-DUP","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-4B","I1","BANCO_PREGUNTA","Q-DUP","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-5","I1","BANCO_PREGUNTA","Q-INACTIVE","D1","ACTIVE","TEACHER-1","",""],
 ["OWN-6","I2","BANCO_PREGUNTA","Q-OTHER-INSTITUTION","D1","ACTIVE","OTHER","",""],
 ["OWN-7","I1","BANCO_PREGUNTA","Q-D1-2","D1","ACTIVE","TEACHER-1","",""]
];
const scopeRows = [
 ["AssignmentID","UserID","RoleID","ScopeType","ScopeValues","Status","","","StartAt","EndAt"],
 ["ASG-1","TEACHER-1","Profesor","DEPARTAMENTO","D1","ACTIVO","","","",""],
 ["ASG-2","READER-1","Lector","DEPARTAMENTO","D1","ACTIVO","","","",""]
];
function makeSheet(rows) { return { getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; } }; }
const sheets = { BancoPreguntas: makeSheet(bankRows), ResourceOwnership: makeSheet(ownershipRows), AsignacionesAmbitosRoles: makeSheet(scopeRows) };
const ss = { getSheetByName(name) { return sheets[name] || null; } };
const runtime = {
 SPREADSHEET_ID:"LOCAL", EXAM_RESOURCE_OWNERSHIP_REQUEST_CACHE_:new WeakMap(), PUBLIC_ACTIONS:[],
 ROLE_PERMISSIONS:{Profesor:["getQuestionBank","manageQuestionBank"],Lector:["getQuestionBank"],Estudiante:[]},
 verifySessionToken(token){return claims[token]||null;}, validateContextualAccess(){return {authorized:true};},
 getDynamicPermissionsForRole(role,action){if(role==="Lector")return action==="getQuestionBank";return null;},
 hasActiveDelegationForAction(){return false;},
 PropertiesService:{getScriptProperties(){return {getProperty(name){return name==="IMA_INSTITUTION_ID"?"I1":null;}};}},
 SpreadsheetApp:{openById(){return ss;}}, getSheetOrThrow(spreadsheet,name){const sheet=spreadsheet.getSheetByName(name);if(!sheet)throw Error("Missing "+name);return sheet;},
 normalizeString(value){return String(value||"").trim().toLowerCase();}
};
const helpers=["validateRolePermission","getVerifiedExamIdentity_","getVerifiedExamDepartmentScope_","assertExamResourceOwnershipForScope_","getQuestionBank"].map(name=>extractFunction(source,name)).join("\n");
vm.runInNewContext(helpers+"\nthis.getQuestionBank=getQuestionBank;",runtime);
const teacherResult=runtime.getQuestionBank({sessionToken:"teacher-token"});
assert.equal(teacherResult.status,"success");
assert.deepEqual(Array.from(teacherResult.preguntas,q=>q.bancoPreguntaId),["Q-D1","Q-D1-2"],"only active questions with unique ownership in the signed department are returned");
assert.equal(teacherResult.preguntas[0].respuestaCorrecta,"A","roles with manageQuestionBank may retrieve the answer key");
assert.equal(teacherResult.preguntas.some(q=>q.bancoPreguntaId==="Q-D2"),false,"another department is not exposed");
assert.equal(teacherResult.preguntas.some(q=>q.bancoPreguntaId==="Q-LEGACY"),false,"legacy rows without ownership are not exposed");
assert.equal(teacherResult.preguntas.some(q=>q.bancoPreguntaId==="Q-DUP"),false,"ambiguous ownership rows are not exposed");
assert.equal(teacherResult.preguntas.some(q=>q.bancoPreguntaId==="Q-INACTIVE"),false,"inactive questions are not exposed");
assert.equal(teacherResult.preguntas.some(q=>q.bancoPreguntaId==="Q-OTHER-INSTITUTION"),false,"another institution is not exposed");
const readerResult=runtime.getQuestionBank({sessionToken:"reader-token"});
assert.deepEqual(Array.from(readerResult.preguntas,q=>q.bancoPreguntaId),["Q-D1","Q-D1-2"]);
assert.equal(Object.prototype.hasOwnProperty.call(readerResult.preguntas[0],"respuestaCorrecta"),false,"read-only role does not receive answer keys");
assert.throws(()=>runtime.getQuestionBank({sessionToken:"student-token"}),/RESOURCE_NOT_AVAILABLE/,"role without question-bank permission is denied");
assert.throws(()=>runtime.getQuestionBank({}),/RESOURCE_NOT_AVAILABLE/,"missing signed session is denied");
assert.throws(()=>runtime.getQuestionBank({sessionToken:"unscoped-token"}),/RESOURCE_NOT_AVAILABLE/,"identity without an assigned department scope is denied");
const filtered=runtime.getQuestionBank({sessionToken:"teacher-token",asignatura:"Biología",dificultad:"Media"});
assert.deepEqual(Array.from(filtered.preguntas,q=>q.bancoPreguntaId),["Q-D1"],"existing subject and difficulty filters remain functional");
process.stdout.write("exam-service-question-bank-read-security: signed identity, ownership filtering and answer-key authorization passed\n");
