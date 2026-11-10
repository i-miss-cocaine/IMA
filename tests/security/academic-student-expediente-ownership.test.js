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


// Guardian relation endpoints must validate the target expediente before exposing
// guardian PII or changing a relationship.
{
  const expSheet=makeSheet([
    ["ExpedienteID","PersonaID"],
    ["EXP-FOREIGN","PERSON-FOREIGN"]
  ]);
  let guardianSheetReads=0,guardianWrites=0,relationWrites=0;
  const relationSheet={
    getDataRange:()=>({getValues:()=>[
      ["RelacionID","ExpedienteID","ResponsableID","Parentesco","x4","x5","x6","x7","Portal","Estado"],
      ["REL-FOREIGN","EXP-FOREIGN","RESP-1","","","","","","Sí","Activo"]
    ]}),
    getRange:()=>({setValue:()=>{relationWrites++;}})
  };
  const base={
    SPREADSHEET_ID:"LOCAL",
    SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="ExpedientesEstudiantes"?expSheet:null})},
    validateRolePermission:action=>({authorized:true,action}),
    getVerifiedAcademicIdentity_:()=>({authorized:true,userId:"DIRECTOR-1",role:"Director"}),
    assertStudentExpedienteScopeAccess_:()=>({authorized:false,code:"RESOURCE_SCOPE_DENIED"}),
    getOrCreateSheet:(_ss,name)=>{
      if(name==="RelacionesEstudianteTutor")return relationSheet;
      if(name==="ResponsablesTutores"){guardianSheetReads++;return {getDataRange:()=>({getValues:()=>[["ID"]]})};}
      throw Error("unexpected sheet "+name);
    },
    normalizeString:value=>String(value||"").trim().toLowerCase()
  };
  const getContext=Object.assign({},base);
  vm.runInNewContext(extractFunction("getStudentGuardians")+"\nthis.run=getStudentGuardians;",getContext);
  const getResult=getContext.run({expedienteId:"EXP-FOREIGN"});
  assert.equal(getResult.code,"RESOURCE_NOT_FOUND","guardian PII is hidden outside the actor's expediente scope");
  assert.equal(guardianSheetReads,0,"guardian records are not read before the expediente guard passes");

  const saveContext=Object.assign({},base);
  vm.runInNewContext(extractFunction("saveStudentGuardian")+"\nthis.run=saveStudentGuardian;",saveContext);
  assert.throws(()=>saveContext.run({expedienteId:"EXP-FOREIGN",nombres:"Test",apellidos:"Guardian"}),/RESOURCE_NOT_FOUND/);
  assert.equal(guardianSheetReads,0,"guardian data is not changed for an out-of-scope expediente");

  const unlinkContext=Object.assign({},base);
  vm.runInNewContext(extractFunction("unlinkStudentGuardian")+"\nthis.run=unlinkStudentGuardian;",unlinkContext);
  assert.throws(()=>unlinkContext.run({relacionId:"REL-FOREIGN"}),/RESOURCE_NOT_FOUND/);
  assert.equal(relationWrites,0,"an out-of-scope guardian relationship is not deactivated");
}
for(const name of ["getStudentGuardians","saveStudentGuardian","unlinkStudentGuardian"]){
  const fn=extractFunction(name);
  assert(fn.includes("validateRolePermission")&&fn.includes("assertStudentExpedienteScopeAccess_"),
    name+" must enforce RBAC and expediente ownership");
}
console.log("ACADEMIC guardian relation endpoint ownership contracts passed.");


// Administrative duplicate search and reports must filter every returned record
// through the requesting actor's verified department ownership.
{
  const expRows=[
    ["EXP-1","PERSON-1","CODE-1","2000-01-01","","","","Activo"],
    ["EXP-2","PERSON-2","CODE-2","2000-01-01","","","","Activo"]
  ];
  const userRows=[
    ["STU-1","Ana Example","","","same@example.test","5551111","","","ID-1"],
    ["STU-2","Ana Example","","","same@example.test","5552222","","","ID-2"]
  ];
  const appRows=[
    ["ADM-1","","2026","1","Ana","Example","ID-1","2000-01-01","","5551111","same@example.test","Recibida"],
    ["ADM-2","","2026","1","Ana","Example","ID-2","2000-01-01","","5552222","same@example.test","Recibida"]
  ];
  const matRows=[
    ["MAT-1","","PERSON-1","Ana","1","A","2026","Ordinaria","Activa"],
    ["MAT-2","","PERSON-2","Ana","1","A","2026","Ordinaria","Activa"]
  ];
  const movRows=[["MOV-1","EXP-1","","2026","Ingreso"],["MOV-2","EXP-2","","2026","Ingreso"]];
  const docRows=[
    ["DOC-1","EXP-1","","Partida","one.pdf","","","2026-01-01","","Pendiente"],
    ["DOC-2","EXP-2","","Partida","two.pdf","","","2026-01-01","","Pendiente"]
  ];
  const sheetFor=rows=>makeSheet([["header"],...rows]);
  const sheets={
    Usuarios:sheetFor(userRows),
    ResourceOwnership:sheetFor([["OWN-1","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-1","D1","ACTIVE"]]),
    SolicitudesAdmision:sheetFor(appRows),
    ExpedientesEstudiantes:sheetFor(expRows),
    Matriculas:sheetFor(matRows),
    MovimientosEstudiante:sheetFor(movRows),
    DocumentosEstudiante:sheetFor(docRows)
  };
  const ss={getSheetByName:name=>sheets[name]||null};
  const common={
    SPREADSHEET_ID:"LOCAL",
    SpreadsheetApp:{openById:()=>ss},
    validateRolePermission:()=>({authorized:true}),
    getVerifiedAcademicIdentity_:()=>({authorized:true,userId:"DIR-1",role:"Director"}),
    getVerifiedAcademicDepartmentScope_:()=>({authorized:true,userId:"DIR-1",role:"Director",institutionId:"INST-1",departmentIds:["D1"],institutionWide:false}),
    getStudentIdentityForPerson_:(_ss,personId)=>personId==="PERSON-1"?{userId:"STU-1",role:"Estudiante"}:({userId:"STU-2",role:"Estudiante"}),
    assertResourceOwnershipForScope_:(_ss,scope,type,id)=>({authorized:type==="EXPEDIENTE_ESTUDIANTE"&&id==="EXP-1",code:"RESOURCE_SCOPE_DENIED"}),
    assertAcademicAdmissionRequestScopeAccess_:()=>({authorized:false,code:"RESOURCE_OWNERSHIP_UNVERIFIED"}),
    getOrCreateSheet:(_ss,name)=>sheets[name],
    normalizeString:value=>String(value||"").trim().toLowerCase(),
    maskDni:value=>"MASKED-"+value,
    logStructuredEvent:()=>{}
  };
  const duplicateContext=Object.assign({},common);
  vm.runInNewContext(extractFunction("findDuplicateStudents")+"\nthis.run=findDuplicateStudents;",duplicateContext);
  const duplicateResult=duplicateContext.run({nombres:"Ana",apellidos:"Example",email:"same@example.test"});
  assert.equal(duplicateResult.candidates.length,1,"duplicate search only returns expediente matches owned by the actor's department");
  assert.equal(duplicateResult.candidates[0].id,"EXP-1");

  const reportContext=Object.assign({},common);
  vm.runInNewContext(extractFunction("getStudentFileAdministrativeReports")+"\nthis.run=getStudentFileAdministrativeReports;",reportContext);
  const states=reportContext.run({reporteTipo:"ESTADO_EXPEDIENTES"});
  assert.deepEqual(states.reporte.map(row=>row.expedienteId),["EXP-1"],"expediente report excludes other-department records");
  const enrollments=reportContext.run({reporteTipo:"MATRICULAS_POR_PERIODO"});
  assert.deepEqual(enrollments.reporte.map(row=>row.matriculaId),["MAT-1"],"enrollment report is filtered by the owned person/expediente");
  const movements=reportContext.run({reporteTipo:"REINCORPORACIONES_Y_MOVIMIENTOS"});
  assert.deepEqual(movements.reporte.map(row=>row.expedienteId),["EXP-1"],"movement report excludes foreign expediente history");
  const documents=reportContext.run({reporteTipo:"DOCUMENTOS_PENDIENTES_VENCIDOS"});
  assert.deepEqual(documents.reporte.map(row=>row.documentoId),["DOC-1"],"document report excludes foreign expediente documents");
}
for(const name of ["findDuplicateStudents","getStudentFileAdministrativeReports"]){
  const fn=extractFunction(name);
  assert(fn.includes("validateRolePermission")&&fn.includes("getVerifiedAcademicDepartmentScope_")&&fn.includes("assertResourceOwnershipForScope_"),
    name+" must enforce RBAC and ResourceOwnership scope");
}
console.log("ACADEMIC administrative search/report ResourceOwnership contracts passed.");


// Unassigned public admission requests are institution-wide intake records only;
// once an ownership row exists, the normal department owner guard takes over.
{
  let ownershipChecks=0;
  const context={
    assertResourceOwnershipForScope_:(_ss,scope,type,id)=>{ownershipChecks++;return {authorized:scope.departmentIds.includes("D1")&&id==="ADM-OWNED",code:"RESOURCE_SCOPE_DENIED"};}
  };
  vm.runInNewContext(extractFunction("assertAcademicAdmissionRequestScopeAccess_")+"\nthis.run=assertAcademicAdmissionRequestScopeAccess_;",context);
  const noOwnership={getSheetByName:()=>makeSheet([["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status"]])};
  const institutionScope={authorized:true,institutionId:"INST-1",departmentIds:[],institutionWide:true};
  assert.equal(context.run(noOwnership,institutionScope,"ADM-UNASSIGNED",{}).authorized,true,
    "only an institution-wide scope may read a never-assigned public intake request");
  const departmentScope={authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false};
  assert.equal(context.run(noOwnership,departmentScope,"ADM-UNASSIGNED",{}).authorized,false,
    "department scope cannot read an unassigned admission request");
  const foreignHistory={getSheetByName:()=>makeSheet([
    ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status"],
    ["OWN-1","OTHER-INST","SOLICITUD_ADMISION","ADM-UNASSIGNED","D9","ACTIVE"]
  ])};
  assert.equal(context.run(foreignHistory,institutionScope,"ADM-UNASSIGNED",{}).authorized,false,
    "institution-wide unassigned exception cannot override an existing foreign ownership record");
  const ownedHistory={getSheetByName:()=>makeSheet([
    ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status"],
    ["OWN-2","INST-1","SOLICITUD_ADMISION","ADM-OWNED","D1","ACTIVE"]
  ])};
  assert.equal(context.run(ownedHistory,departmentScope,"ADM-OWNED",{}).authorized,true);
  assert(ownershipChecks>=2);
}
{
  const requests=[
    ["ADM-1","","2026","1","Ana","One","","","","","ana@example.test","Recibida"],
    ["ADM-2","","2026","1","Ana","Two","","","","","ana2@example.test","Recibida"]
  ];
  const requestSheet=makeSheet([["SolicitudID"],...requests]);
  const context={
    SPREADSHEET_ID:"LOCAL",
    SpreadsheetApp:{openById:()=>({})},
    validateRolePermission:()=>({authorized:true}),
    getVerifiedAcademicIdentity_:()=>({authorized:true,userId:"DIR-1",role:"Director"}),
    getVerifiedAcademicDepartmentScope_:()=>({authorized:true,userId:"DIR-1",institutionId:"INST-1",departmentIds:["D1"],institutionWide:false}),
    getOrCreateSheet:()=>requestSheet,
    assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id)=>({authorized:id==="ADM-1"}),
    normalizeString:value=>String(value||"").trim().toLowerCase()
  };
  vm.runInNewContext(extractFunction("getAdmissionRequests")+"\nthis.run=getAdmissionRequests;",context);
  const listed=context.run({fetchAll:true});
  assert.deepEqual(listed.requests.map(row=>row.solicitudId),["ADM-1"],"admission queue hides requests outside the actor's department ownership");
  const direct=context.run({solicitudId:"ADM-2"});
  assert.equal(direct.code,"RESOURCE_NOT_FOUND","direct request ID cannot bypass admission ownership");
}
{
  const statusFn=extractFunction("updateAdmissionStatus");
  assert(statusFn.includes('validateRolePermission("updateAdmissionStatus"')&&
    statusFn.includes("getVerifiedAcademicDepartmentScope_")&&
    statusFn.includes("assertAcademicAdmissionRequestScopeAccess_")&&
    statusFn.includes("const actorUserId = actor.userId"),
    "admission status mutation must verify request ownership and use the signed actor identity");
}
console.log("ACADEMIC admission queue and institution-wide intake ownership contracts passed.");
