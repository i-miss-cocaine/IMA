const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/academic-service/Code.gs"});
function extractFunction(name){
  const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function exists: "+name);
  const open=source.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=open;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==="\n")line=false;continue;}
    if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
    if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==="/"&&next==="/"){line=true;i++;continue;}
    if(ch==="/"&&next==="*"){block=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch==="\x60"){quote=ch;continue;}
    if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw Error("unbalanced "+name);
}
function makeSheet(rows){
  return {getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())})};
}
const userRows=[
  ["UserID","Email","Nombre","x3","x4","x5","Rol","x7","x8","PersonaID","Estado"],
  ["STU-1","","Student","","","","Estudiante","","","PERSON-1","Activa"],
  ["STU-2","","Student 2","","","","Alumno","","","PERSON-2","Activa"],
  ["TUTOR-1","","Guardian","","","","Tutor","","","PERSON-T","Activa"]
];
const relationRows=[
  ["RelacionID","ExpedienteID","ResponsableID","Parentesco","x4","x5","x6","x7","AccesoPortal","Estado"],
  ["REL-1","EXP-1","RESP-1","","","","","","Sí","Activo"]
];
const guardianRows=[
  ["ResponsableID","PersonaID","Nombres"],
  ["RESP-1","PERSON-T","Guardian"]
];
const sheets={
  Usuarios:makeSheet(userRows),
  RelacionesEstudianteTutor:makeSheet(relationRows),
  ResponsablesTutores:makeSheet(guardianRows)
};
const ownershipByExam={"EXP-1":"D1","EXP-2":"D2"};
const scopeCalls=[];
const context={
  getVerifiedAcademicIdentity_:payload=>payload.identity,
  getVerifiedAcademicDepartmentScope_:(_payload,_ss,identity)=>{
    scopeCalls.push({userId:identity.userId,role:identity.role});
    const departmentIds=identity.userId==="STU-2"?["D2"]:["D1"];
    return {authorized:true,userId:identity.userId,role:identity.role,institutionId:"INST-1",departmentIds,institutionWide:false};
  },
  assertResourceOwnershipForScope_:(_ss,scope,type,id,operation)=>{
    const owner=ownershipByExam[id];
    return {authorized:type==="EXPEDIENTE_ESTUDIANTE"&&operation==="READ"&&!!owner&&scope.departmentIds.includes(owner),
      code:"RESOURCE_SCOPE_DENIED",departmentId:owner||""};
  }
};
context.getSheetOrThrow=(_ss,name)=>sheets[name];
const functions=[
  extractFunction("getStudentPersonIdForUser_"),
  extractFunction("getStudentIdentityForPerson_"),
  extractFunction("assertStudentExpedienteScopeAccess_")
].join("\n");
vm.runInNewContext(functions+"\nthis.check=assertStudentExpedienteScopeAccess_;",context);
context.getVerifiedAcademicIdentity_=payload=>payload.identity;
const ss={getSheetByName:name=>sheets[name]||null};
function access(identity,expRow){return context.check({identity},ss,{getDataRange:()=>({getValues:()=>[["ExpedienteID","PersonaID"],expRow]})},expRow);}
{
  const result=access({authorized:true,userId:"STU-1",role:"Estudiante"},["EXP-1","PERSON-1"]);
  assert.equal(result.authorized,true,"student can read own expediente when its department owner matches the student's scope");
  assert.equal(result.accessType,"SELF");
  assert.equal(result.departmentId,"D1");
}
{
  const result=access({authorized:true,userId:"STU-1",role:"Estudiante"},["EXP-1","PERSON-1"]);
  ownershipByExam["EXP-1"]="D2";
  const denied=access({authorized:true,userId:"STU-1",role:"Estudiante"},["EXP-1","PERSON-1"]);
  assert.equal(denied.authorized,false,"student self access is denied when expediente ownership is outside the student's department");
  ownershipByExam["EXP-1"]="D1";
}
{
  scopeCalls.length=0;
  const result=access({authorized:true,userId:"TUTOR-1",role:"Tutor"},["EXP-1","PERSON-1"]);
  assert.equal(result.authorized,true,"guardian with an active portal relationship can read the linked student's expediente inside the student's department");
  assert.equal(result.accessType,"GUARDIAN");
  assert.equal(scopeCalls.some(call=>call.userId==="STU-1"&&call.role==="Estudiante"),true,"guardian ownership scope is resolved from the linked student account, not the guardian");
}
{
  ownershipByExam["EXP-1"]="D2";
  const denied=access({authorized:true,userId:"TUTOR-1",role:"Tutor"},["EXP-1","PERSON-1"]);
  assert.equal(denied.authorized,false,"guardian relationship does not bypass the linked student's department ownership");
  ownershipByExam["EXP-1"]="D1";
}
{
  const denied=access({authorized:true,userId:"TUTOR-1",role:"Tutor"},["EXP-2","PERSON-2"]);
  assert.equal(denied.authorized,false,"guardian cannot access an expediente without an active relationship even if the department scope matches");
}
for(const name of ["getStudentDocuments","uploadStudentDocument","updateDocumentStatus","restoreDocumentVersion","getStudentFile"]){
  const fn=extractFunction(name);
  assert(fn.includes("assertStudentDocumentScopeAccess_")||fn.includes("assertStudentRequestScopeAccess_")||fn.includes("assertStudentExpedienteScopeAccess_"),
    name+" must inherit the hardened expediente ownership guard");
}
console.log("ACADEMIC student/guardian expediente ResourceOwnership contract passed.");
