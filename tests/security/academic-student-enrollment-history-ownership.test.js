const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"backend/academic-service/Code.gs"),"utf8");
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
const userRows=[
 ["UserID","Email","Nombre","x3","x4","x5","Rol","x7","x8","PersonaID","EstadoCuenta"],
 ["STU-1","","Student 1","","","","Estudiante","","","PERSON-1","Activo"],
 ["STU-2","","Student 2","","","","Alumno","","","PERSON-2","Activo"],
 ["TUTOR-1","","Guardian","","","","Tutor","","","PERSON-T","Activo"],
 ["STAFF-A","","Director A","","","","Director","","","PERSON-SA","Activo"],
 ["STAFF-B","","Director B","","","","Director","","","PERSON-SB","Activo"]
];
const expedienteRows=[
 ["ExpedienteID","PersonaID","CodigoInstitucional"],
 ["EXP-1","PERSON-1","COD-1"],
 ["EXP-2","PERSON-2","COD-2"]
];
const matriculaRows=[
 ["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"],
 ["MAT-1","2026-01-01","STU-1","Student 1","1","A","2026","Ordinaria","Activa",0,""],
 ["MAT-1-OLD","2025-01-01","STU-1","Student 1","K","A","2025","Ordinaria","Cerrada",0,""],
 ["MAT-2","2026-01-01","STU-2","Student 2","2","B","2026","Ordinaria","Activa",0,""]
];
const cargoRows=[
 ["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento"],
 ["CRG-1","2026-01-01","STU-1","Colegiatura",100,0,100,"Pendiente","2026-02-01"],
 ["CRG-2","2026-01-01","STU-1","Transporte",50,0,50,"Pendiente","2026-02-01"],
 ["CRG-3","2026-01-01","STU-2","Colegiatura",200,0,200,"Pendiente","2026-02-01"]
];
const relationRows=[
 ["RelacionID","ExpedienteID","ResponsableID","TipoParentesco","Representante","Emergencia","EsResponsableFinanciero","PickUp","AccesoPortal","Estado"],
 ["REL-1","EXP-1","RESP-1","Madre","Sí","Sí","Sí","Sí","Sí","Activo"]
];
const guardianRows=[["ResponsableID","PersonaID"],["RESP-1","PERSON-T"]];
const ownership={"EXP-1":"D1","EXP-2":"D2"};
const scopeByUser={"STU-1":"D1","STU-2":"D2","STAFF-A":"D1","STAFF-B":"D2"};
let createAttempts=0,guardCalls=0;
function makeSheet(rows){return {getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())})};}
const sheets={
 Usuarios:makeSheet(userRows),
 ExpedientesEstudiantes:makeSheet(expedienteRows),
 Matriculas:makeSheet(matriculaRows),
 CargosEstudiante:makeSheet(cargoRows),
 RelacionesEstudianteTutor:makeSheet(relationRows),
 ResponsablesTutores:makeSheet(guardianRows)
};
const ss={getSheetByName:name=>sheets[name]||null};
const context={
 SPREADSHEET_ID:"SYNTHETIC",
 SpreadsheetApp:{openById:id=>{assert.equal(id,"SYNTHETIC");return ss;}},
 getVerifiedAcademicIdentity_:request=>request&&request.identity||{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"},
 getStudentIdentityForPerson_:(_ss,personId)=>{
   const rows=userRows.slice(1).filter(row=>row[9]===personId&&["ESTUDIANTE","ALUMNO"].includes(String(row[6]).toUpperCase())&&row[10]==="Activo");
   return rows.length===1?{userId:rows[0][0],role:rows[0][6]}:null;
 },
 assertStudentExpedienteScopeAccess_:(request,_ss,_sheet,exp)=>{
   guardCalls++;
   const actor=request.identity||{},role=String(actor.role||"").toUpperCase(),expId=String(exp[0]);
   if(["ESTUDIANTE","ALUMNO"].includes(role))return {authorized:actor.userId=== (expId==="EXP-1"?"STU-1":"STU-2"),accessType:"SELF"};
   if(["TUTOR","PADRE","MADRE","RESPONSABLE"].includes(role)){
     const linked=relationRows.slice(1).some(row=>row[1]===expId&&row[8]==="Sí"&&row[9]==="Activo")&&guardianRows.slice(1).some(row=>row[0]==="RESP-1"&&row[1]===userRows[3][9]);
     return {authorized:linked&&actor.userId==="TUTOR-1",accessType:"GUARDIAN"};
   }
   return {authorized:(scopeByUser[actor.userId]||"")===ownership[expId],accessType:"DEPARTMENT"};
 },
 getOrCreateSheet:()=>{createAttempts++;throw Error("READ_MUST_NOT_CREATE_SHEETS");}
};
vm.runInNewContext(extractFunction("getStudentEnrollmentHistory")+"\nthis.run=getStudentEnrollmentHistory;",context);
const call=(identity,extra)=>context.run(Object.assign({identity},extra||{}));
{
 const result=call({authorized:true,userId:"STU-1",role:"Estudiante"},{userId:"STU-2"});
 assert.equal(result.status,"success","student can read own history");
 assert.deepEqual(Array.from(result.data.matriculas,row=>row.matriculaId),["MAT-1","MAT-1-OLD"],"client userId spoof is ignored");
 assert.deepEqual(Array.from(result.data.cargos,row=>row.cargoId),["CRG-1","CRG-2"],"only own charges are returned");
}
{
 const result=call({authorized:true,userId:"TUTOR-1",role:"Tutor"},{userId:"STU-1"});
 assert.equal(result.status,"success","linked guardian with portal access can read enrollment history");
 assert.deepEqual(Array.from(result.data.cargos,row=>row.cargoId),["CRG-1","CRG-2"],"financially responsible guardian can read charges");
 relationRows[1][6]="No";
 const restricted=call({authorized:true,userId:"TUTOR-1",role:"Tutor"},{userId:"STU-1"});
 assert.equal(restricted.status,"success");
 assert.deepEqual(Array.from(restricted.data.matriculas,row=>row.matriculaId),["MAT-1","MAT-1-OLD"]);
 assert.deepEqual(Array.from(restricted.data.cargos),[],"guardian without financial responsibility cannot read charges");
 relationRows[1][6]="Sí";
 assert.equal(call({authorized:true,userId:"TUTOR-1",role:"Tutor"},{userId:"STU-2"}).code,"RESOURCE_NOT_FOUND","guardian cannot query an unrelated student");
}
{
 assert.equal(call({authorized:true,userId:"STAFF-A",role:"Director"},{userId:"STU-1"}).status,"success","staff can read history in its owned department");
 assert.equal(call({authorized:true,userId:"STAFF-A",role:"Director"},{userId:"STU-2"}).code,"RESOURCE_NOT_FOUND","cross-department access is denied");
 assert.equal(call({authorized:true,userId:"STAFF-B",role:"Director"},{userId:"STU-2"}).status,"success","owner department can read its own student");
 assert.equal(context.run({userId:"STU-1"}).code,"VERIFIED_IDENTITY_REQUIRED","unverified identity is denied");
}
{
 const duplicate=userRows[1].slice();userRows.push(duplicate);
 assert.equal(call({authorized:true,userId:"STU-1",role:"Estudiante"}).code,"VERIFIED_IDENTITY_REQUIRED","duplicate signed actor mapping fails closed");
 userRows.pop();
 const duplicateTarget=userRows[2].slice();duplicateTarget[0]="STU-3";userRows.push(duplicateTarget);
 assert.equal(call({authorized:true,userId:"STAFF-B",role:"Director"},{userId:"STU-2"}).code,"RESOURCE_NOT_FOUND","duplicate active person mapping fails closed");
 userRows.pop();
 const duplicateExp=expedienteRows[1].slice();duplicateExp[0]="EXP-1-DUP";expedienteRows.push(duplicateExp);
 assert.equal(call({authorized:true,userId:"STAFF-A",role:"Director"},{userId:"STU-1"}).code,"RESOURCE_NOT_FOUND","duplicate expediente mapping fails closed");
 expedienteRows.pop();
}
{
 matriculaRows.push(matriculaRows[1].slice());
 cargoRows.push(cargoRows[1].slice());
 const result=call({authorized:true,userId:"STU-1",role:"Estudiante"});
 assert.deepEqual(Array.from(result.data.matriculas,row=>row.matriculaId),["MAT-1-OLD"],"duplicate MatriculaID rows are excluded");
 assert.deepEqual(Array.from(result.data.cargos,row=>row.cargoId),["CRG-2"],"duplicate CargoID rows are excluded");
 matriculaRows.pop();cargoRows.pop();
}
{
 sheets.Matriculas=makeSheet([["MatriculaID","UserId"]]);
 assert.equal(call({authorized:true,userId:"STU-1",role:"Estudiante"}).code,"RESOURCE_SCHEMA_INVALID","malformed enrollment schema is rejected");
 sheets.Matriculas=makeSheet(matriculaRows);
 sheets.CargosEstudiante=makeSheet([["CargoID","UserId"]]);
 assert.equal(call({authorized:true,userId:"STU-1",role:"Estudiante"}).code,"RESOURCE_SCHEMA_INVALID","malformed charge schema is rejected");
 sheets.CargosEstudiante=makeSheet(cargoRows);
 delete sheets.Matriculas;delete sheets.CargosEstudiante;
 const empty=call({authorized:true,userId:"STU-1",role:"Estudiante"});
 assert.deepEqual(Array.from(empty.data.matriculas),[]);
 assert.deepEqual(Array.from(empty.data.cargos),[]);
 assert.equal(createAttempts,0,"missing read models never create sheets");
}
{
 const before=guardCalls;
 const results=await Promise.all(Array.from({length:25},()=>Promise.resolve(call({authorized:true,userId:"STU-1",role:"Estudiante"}))));
 assert.equal(results.every(result=>result.status==="success"),true,"concurrent read-only requests remain consistent");
 assert.equal(guardCalls-before,25,"every concurrent request independently revalidates ownership");
 assert.equal(createAttempts,0,"concurrent reads have no persistence side effects");
}
const fn=extractFunction("getStudentEnrollmentHistory");
assert(fn.includes("getVerifiedAcademicIdentity_")&&fn.includes("assertStudentExpedienteScopeAccess_"),"history endpoint must use verified identity and expediente ownership");
assert(!fn.includes("getOrCreateSheet"),"history endpoint must remain read-only and must not create sheets");
console.log("ACADEMIC student enrollment history identity, guardian, department ownership, financial privacy, schema, duplicate-ID and concurrency contracts passed.");
