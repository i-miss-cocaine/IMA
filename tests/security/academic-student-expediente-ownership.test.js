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


// Admission conversion must not reuse an identity-matched expediente from another
// department or resolve its linked student account before ownership is verified.
{
  const requestRows=[
    ["SolicitudID","Fecha","Ano","Grado","Nombres","Apellidos","Identificacion","Nacimiento","Responsable","Telefono","Email","Estado","Canal","Notas","ExpedienteID"],
    ["ADM-FOREIGN","","2026","1","Ana","Example","DNI-123","2018-01-01","","","","Admitida","","",""]
  ];
  const expedienteRows=[
    ["ExpedienteID","PersonaID","Codigo","Nacimiento","Nacionalidad","x5","x6","Estado","Creado","Actualizado","Identificacion"],
    ["EXP-FOREIGN","PERSON-FOREIGN","STU-FOREIGN","2018-01-01","","","","Activo","","","DNI-123"]
  ];
  const makeWritableSheet=rows=>({
    getLastRow:()=>rows.length,
    getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),
    appendRow:()=>{throw Error("unexpected write before duplicate ownership check");},
    getRange:()=>({setValue:()=>{throw Error("unexpected write before duplicate ownership check");}})
  });
  const sheets={
    SolicitudesAdmision:makeWritableSheet(requestRows),
    ExpedientesEstudiantes:makeWritableSheet(expedienteRows)
  };
  const ss={getSheetByName:name=>sheets[name]||null};
  let ownershipChecks=0,studentIdentityLookups=0,ownershipWrites=0;
  const context={
    ALLOW_INCOMPLETE_ADMISSION_CONVERSION:true,
    getAcademicAdmissionScopeContext_:()=>({
      authorized:true,ss,actor:{authorized:true,userId:"DIRECTOR-1",role:"Director"},
      scope:{authorized:true,userId:"DIRECTOR-1",role:"Director",institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},
      requestAccess:{authorized:true}
    }),
    resolveAcademicAdmissionDepartment_:()=>({authorized:true,departmentId:"D1"}),
    getDynamicPermissionsForRole:()=>false,
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    getOrCreateSheet:(_ss,name)=>sheets[name],
    checkEnrollmentCapacity:()=>({hayCupo:true}),
    generateInstitutionalId:({entityType})=>({generatedId:entityType+"-NEW"}),
    normalizeString:value=>String(value||"").trim().toLowerCase(),
    assertResourceOwnershipForScope_:(_ss,_scope,type,id,operation)=>{
      ownershipChecks++;
      assert.equal(type,"EXPEDIENTE_ESTUDIANTE");
      assert.equal(id,"EXP-FOREIGN");
      assert.equal(operation,"UPDATE");
      return {authorized:false,code:"RESOURCE_SCOPE_DENIED",departmentId:"D2"};
    },
    getStudentIdentityForPerson_:()=>{studentIdentityLookups++;return {userId:"STU-FOREIGN"};},
    registerAcademicResourceOwnership_:()=>{ownershipWrites++;return {authorized:true,created:true,ownershipId:"OWN-NEW"};}
  };
  vm.runInNewContext(extractFunction("convertAdmissionToStudent")+"\nthis.run=convertAdmissionToStudent;",context);
  assert.throws(()=>context.run({solicitudId:"ADM-FOREIGN"}),/RESOURCE_NOT_FOUND/);
  assert.equal(ownershipChecks,1,"the existing expediente must be checked against active department ownership");
  assert.equal(studentIdentityLookups,0,"foreign student identity must not be resolved");
  assert.equal(ownershipWrites,0,"no ownership may be assigned to a foreign expediente");
}
console.log("ACADEMIC admission conversion duplicate expediente ownership contract passed.");


// Admission conversion compensates every write when a downstream movement write fails.
{
  function mutableSheet(rows, failAppend) {
    return {
      rows: rows.map(row=>row.slice()),
      getLastRow(){return this.rows.length;},
      getDataRange(){const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      appendRow(row){if(failAppend)throw Error("INJECTED_MOVEMENT_FAILURE");this.rows.push(row.slice());},
      deleteRow(row){this.rows.splice(row-1,1);},
      getRange(row,col,numRows,numCols){
        const self=this;
        return {
          setValue(value){self.rows[row-1][col-1]=value;},
          setValues(values){for(let r=0;r<numRows;r++)for(let c=0;c<numCols;c++)self.rows[row-1+r][col-1+c]=values[r][c];}
        };
      }
    };
  }
  const sheets={
    SolicitudesAdmision:mutableSheet([["SolicitudID","","","","","","","","","","","Estado","","","ExpedienteID"],["ADM-ROLLBACK","","2026","1","Ada","Example","","2018","","","", "Admitida","","",""]]),
    ExpedientesEstudiantes:mutableSheet([["ExpedienteID","PersonaID","Codigo","FechaNacimiento","Nacionalidad","","","Estado","Creado","Actualizado","Identificacion"]]),
    Usuarios:mutableSheet([["UserID","","","","","","Rol","","","PersonaID","Estado"]]),
    ResourceOwnership:mutableSheet([["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","CreatedBy","CreatedAt","UpdatedAt"]]),
    Matriculas:mutableSheet([["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"]]),
    CargosEstudiante:mutableSheet([["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento"]]),
    DocumentosEstudiante:mutableSheet([["DocumentoID","ExpedienteID","SolicitudID"]]),
    MovimientosEstudiante:mutableSheet([["MovimientoID","ExpedienteID","MatriculaID","Ano","Tipo"]],true)
  };
  const ss={getSheetByName:name=>sheets[name]||null};
  let ownershipSequence=0;
  const context={
    ALLOW_INCOMPLETE_ADMISSION_CONVERSION:true,SPREADSHEET_ID:"TEST",
    SpreadsheetApp:{openById:()=>ss},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    getAcademicAdmissionScopeContext_:()=>({authorized:true,ss,actor:{authorized:true,userId:"DIR-1",role:"Director"},scope:{authorized:true,userId:"DIR-1",role:"Director",institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},requestAccess:{authorized:true}}),
    resolveAcademicAdmissionDepartment_:()=>({authorized:true,departmentId:"D1"}),
    getDynamicPermissionsForRole:()=>false,
    getOrCreateSheet:(_ss,name)=>sheets[name],
    checkEnrollmentCapacity:()=>({hayCupo:true}),
    generateInstitutionalId:({entityType})=>({generatedId:entityType+"-ROLLBACK"}),
    normalizeString:value=>String(value||"").trim().toLowerCase(),
    registerAcademicResourceOwnership_:(_ss,_scope,type,id,departmentId)=>{const ownershipId="OWN-"+(++ownershipSequence);sheets.ResourceOwnership.appendRow([ownershipId,"INST-1",type,id,departmentId,"ACTIVE","DIR-1",new Date(),new Date()]);return {authorized:true,created:true,ownershipId};},
    deleteAcademicResourceOwnership_:(_ss,id)=>{const rows=sheets.ResourceOwnership.rows;const index=rows.findIndex((row,i)=>i>0&&row[0]===id);if(index>0)sheets.ResourceOwnership.deleteRow(index+1);return index>0;},
    getInstitutionParams:()=>({data:[]}),
    logStructuredEvent:()=>{},
    Utilities:{getUuid:()=>"UUID"},
    Date
  };
  const functions=[
    "assertAdmissionEnrollmentRetrySafe_",
    "findAdmissionConversionMovement_",
    "convertAdmissionToStudent",
    "registerStudentEnrollmentInternal_"
  ].map(extractFunction).join("\n");
  vm.runInNewContext(functions+"\nthis.run=convertAdmissionToStudent;",context);
  assert.throws(()=>context.run({solicitudId:"ADM-ROLLBACK"}),/INJECTED_MOVEMENT_FAILURE/);
  assert.equal(sheets.SolicitudesAdmision.rows[1][11],"Admitida","admission state must remain unchanged after rollback");
  assert.equal(sheets.SolicitudesAdmision.rows[1][14],"","admission expediente link must be restored");
  assert.equal(sheets.ExpedientesEstudiantes.rows.length,1,"new expediente must be removed");
  assert.equal(sheets.ResourceOwnership.rows.length,1,"new ownership rows must be removed");
  assert.equal(sheets.Matriculas.rows.length,1,"new enrollment must be removed");
  assert.equal(sheets.CargosEstudiante.rows.length,1,"new enrollment charge must be removed");
  assert.equal(sheets.MovimientosEstudiante.rows.length,1,"failed movement must not persist");
}
console.log("ACADEMIC admission conversion compensation contract passed.");


// Admission conversion retries may reuse only records created by the same request.
{
  const helperSource=extractFunction("assertAdmissionEnrollmentRetrySafe_")+"\n"+extractFunction("findAdmissionConversionMovement_");
  const helperContext={};
  vm.runInNewContext(helperSource+"\nthis.enrollment=assertAdmissionEnrollmentRetrySafe_;this.movement=findAdmissionConversionMovement_;",helperContext);
  const enrollmentHeader=["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"];
  const sameRequest=["MAT-1",new Date(),"STU-1","Ada Example","1","A","2026","IngresoNuevo","Activa",0,"Convertido desde solicitud ADM-1"];
  assert.equal(helperContext.enrollment([enrollmentHeader,sameRequest],"STU-1","2026","1","A","ADM-1")[0],"MAT-1",
    "retry may reuse the exact enrollment created for the same admission request");
  assert.throws(()=>helperContext.enrollment([enrollmentHeader,["MAT-OLD",new Date(),"STU-1","Ada Example","1","A","2026","Ordinaria","Activa",0,"Matrícula ordinaria"]],"STU-1","2026","1","A","ADM-1"),/ADMISSION_ENROLLMENT_CONFLICT/,
    "conversion must not overwrite an unrelated existing enrollment");
  assert.throws(()=>helperContext.enrollment([enrollmentHeader,sameRequest],"STU-1","2026","2","A","ADM-1"),/ADMISSION_ENROLLMENT_CONFLICT/,
    "retry with changed grade or section must not silently mutate the original enrollment");
  assert.throws(()=>helperContext.enrollment([enrollmentHeader,sameRequest,sameRequest],"STU-1","2026","1","A","ADM-1"),/ADMISSION_ENROLLMENT_AMBIGUOUS/,
    "duplicate enrollment candidates must fail closed");

  const movementHeader=["MovimientoID","ExpedienteID","MatriculaID","Ano","Tipo","x5","x6","Grado","Seccion","Fecha","Observaciones"];
  const unrelated=["MOV-OLD","EXP-1","MAT-OLD","2026","IngresoNuevo","","","1","A",new Date(),"Ingreso nuevo importado"];
  const exact=["MOV-1","EXP-1","MAT-1","2026","IngresoNuevo","","","1","A",new Date(),"Admisión y Matrícula Inicial aprobada desde ADM-1"];
  assert.equal(helperContext.movement([movementHeader,unrelated],"EXP-1","2026","ADM-1","MAT-1"),null,
    "unrelated ingress movements must not be mistaken for this admission conversion");
  assert.equal(helperContext.movement([movementHeader,exact],"EXP-1","2026","ADM-1","MAT-1")[0],"MOV-1",
    "retry must reuse its own matching ingress movement");
  assert.throws(()=>helperContext.movement([movementHeader,exact],"EXP-1","2026","ADM-1","MAT-OTHER"),/ADMISSION_MOVEMENT_CONFLICT/,
    "request movement linked to another enrollment must fail closed");
  assert.throws(()=>helperContext.movement([movementHeader,exact,exact],"EXP-1","2026","ADM-1","MAT-1"),/ADMISSION_MOVEMENT_AMBIGUOUS/,
    "duplicate request movements must fail closed");
}
console.log("ACADEMIC admission conversion idempotency contract passed.");


// A converted admission is idempotently successful only when its expediente,
// active student identity, exact enrollment, and request-linked ingress movement
// are all present and mutually consistent. Missing artifacts fail closed.
{
  function readSheet(rows) {
    return {
      getLastRow:()=>rows.length,
      getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())})
    };
  }
  const requestRow=["ADM-RETRY","","2026","1","","","","","","","","Convertida","","","EXP-RETRY"];
  const expedienteRow=["EXP-RETRY","PERSON-RETRY","STU-CODE","","","","","","","","ID-RETRY"];
  const userRow=["STU-RETRY","","Student","","","","Estudiante","","","PERSON-RETRY","Activa"];
  const enrollmentRow=["MAT-RETRY",new Date(),"STU-RETRY","Student","1","B","2026","IngresoNuevo","Activa",0,"Convertido desde solicitud ADM-RETRY"];
  const movementRow=["MOV-RETRY","EXP-RETRY","MAT-RETRY","2026","IngresoNuevo","","","1","B",new Date(),"Admisión y Matrícula Inicial aprobada desde ADM-RETRY"];
  const chargeRow=["CRG-RETRY",new Date(),"STU-RETRY","Matrícula Ordinaria 2026",1500,0,1500,"Pendiente","","ADMISION|ADM-RETRY|MAT-RETRY"];
  const headers={
    SolicitudesAdmision:["SolicitudID","","Ano","Grado","","","","","","","","Estado","","","ExpedienteID"],
    ExpedientesEstudiantes:["ExpedienteID","PersonaID"],
    Usuarios:["UserID","","","","","","Rol","","","PersonaID","Estado"],
    Matriculas:["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"],
    MovimientosEstudiante:["MovimientoID","ExpedienteID","MatriculaID","Ano","Tipo","","","Grado","Seccion","Fecha","Observaciones"],
    CargosEstudiante:["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento","ReferenciaOrigen"]
  };
  function runAlreadyConverted(overrides) {
    const data=Object.assign({
      SolicitudesAdmision:[headers.SolicitudesAdmision,requestRow],
      ExpedientesEstudiantes:[headers.ExpedientesEstudiantes,expedienteRow],
      Usuarios:[headers.Usuarios,userRow],
      Matriculas:[headers.Matriculas,enrollmentRow],
      MovimientosEstudiante:[headers.MovimientosEstudiante,movementRow],
      CargosEstudiante:[headers.CargosEstudiante,chargeRow]
    },overrides||{});
    const sheets={};
    Object.keys(data).forEach(name=>sheets[name]=readSheet(data[name]));
    const ss={getSheetByName:name=>sheets[name]||null};
    const context={
      getAcademicAdmissionScopeContext_:()=>({
        authorized:true,ss,
        actor:{userId:"DIR-RETRY",role:"Director"},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},
        requestAccess:{authorized:true}
      }),
      resolveAcademicAdmissionDepartment_:()=>({authorized:true,departmentId:"D1"}),
      getDynamicPermissionsForRole:()=>false,
      LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
      getOrCreateSheet:(_ss,name)=>sheets[name],
      assertResourceOwnershipForScope_:(_ss,_scope,type,id,operation)=>{
        assert.equal(type,"EXPEDIENTE_ESTUDIANTE");
        assert.equal(id,"EXP-RETRY");
        assert.equal(operation,"READ");
        return {authorized:true,departmentId:"D1"};
      }
    };
    const functions=[
      "getStudentIdentityForPerson_",
      "findAdmissionConversionEnrollment_",
      "findAdmissionConversionMovement_",
      "findAdmissionConversionCharge_",
      "assertAdmissionConversionArtifactsComplete_",
      "convertAdmissionToStudent"
    ].map(extractFunction).join("\n");
    vm.runInNewContext(functions+"\nthis.run=convertAdmissionToStudent;",context);
    return context.run({solicitudId:"ADM-RETRY"});
  }
  const complete=runAlreadyConverted();
  assert.equal(complete.status,"success","complete converted admission retry remains idempotently successful");
  assert.equal(complete.matriculaId,"MAT-RETRY");
  assert.equal(complete.movimientoId,"MOV-RETRY");
  assert.equal(complete.cargoId,"CRG-RETRY","complete converted admission must expose its uniquely linked charge");
  assert.throws(()=>runAlreadyConverted({
    CargosEstudiante:[headers.CargosEstudiante]
  }),/ADMISSION_CONVERSION_INCOMPLETE/,"missing admission charge must not be reported as successfully converted");
  assert.throws(()=>runAlreadyConverted({
    CargosEstudiante:[headers.CargosEstudiante,["CRG-LEGACY",new Date(),"STU-RETRY","Matrícula Ordinaria 2026",1500,0,1500,"Pendiente",""]]
  }),/ADMISSION_CHARGE_CONFLICT/,"unmarked legacy charge must not be adopted by a converted admission");

  assert.throws(()=>runAlreadyConverted({
    Matriculas:[headers.Matriculas]
  }),/ADMISSION_CONVERSION_INCOMPLETE/,"missing enrollment must not be reported as successfully converted");
  assert.throws(()=>runAlreadyConverted({
    MovimientosEstudiante:[headers.MovimientosEstudiante]
  }),/ADMISSION_CONVERSION_INCOMPLETE/,"missing request-linked ingress movement must fail closed");
  assert.throws(()=>runAlreadyConverted({
    MovimientosEstudiante:[headers.MovimientosEstudiante,["MOV-RETRY","EXP-RETRY","MAT-OTHER","2026","IngresoNuevo","","","1","B",new Date(),"Admisión y Matrícula Inicial aprobada desde ADM-RETRY"]]
  }),/ADMISSION_MOVEMENT_CONFLICT/,"request movement linked to another enrollment must fail closed");
  assert.throws(()=>runAlreadyConverted({
    MovimientosEstudiante:[headers.MovimientosEstudiante,["MOV-RETRY","EXP-RETRY","MAT-RETRY","2026","IngresoNuevo","","","1","A",new Date(),"Admisión y Matrícula Inicial aprobada desde ADM-RETRY"]]
  }),/ADMISSION_CONVERSION_INCOMPLETE/,"movement grade/section must agree with the enrollment");
  assert.throws(()=>runAlreadyConverted({
    ExpedientesEstudiantes:[headers.ExpedientesEstudiantes,expedienteRow,expedienteRow]
  }),/ADMISSION_CONVERSION_INCOMPLETE/,"ambiguous expediente must not be treated as a complete conversion");
}
console.log("ACADEMIC converted admission reconciliation contract passed.");


// Admission-generated enrollment charges carry an exact request/enrollment reference.
// Unmarked ordinary charges are never adopted as admission charges.
{
  const helperSource=extractFunction("findAdmissionConversionCharge_");
  const helperContext={};
  vm.runInNewContext(helperSource+"\nthis.find=findAdmissionConversionCharge_;",helperContext);
  const header=["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento","ReferenciaOrigen"];
  const linked=["CRG-1",new Date(),"STU-1","Matrícula Ordinaria 2026",1500,0,1500,"Pendiente","",
    "ADMISION|ADM-1|MAT-1"];
  assert.equal(helperContext.find([header,linked],"STU-1","2026","ADM-1","MAT-1")[0],"CRG-1",
    "exactly linked admission charge must be found");
  assert.throws(()=>helperContext.find([header,["CRG-OLD",new Date(),"STU-1","Matrícula Ordinaria 2026",1500,0,1500,"Pendiente",""]],"STU-1","2026","ADM-1","MAT-1"),
    /ADMISSION_CHARGE_CONFLICT/,"unmarked legacy charge must not be adopted");
  assert.throws(()=>helperContext.find([header],"STU-1","2026","ADM-1","MAT-1"),
    /ADMISSION_CONVERSION_INCOMPLETE/,"missing admission charge must fail closed");
  assert.throws(()=>helperContext.find([header,linked,linked],"STU-1","2026","ADM-1","MAT-1"),
    /ADMISSION_CHARGE_AMBIGUOUS/,"duplicate admission charge references must fail closed");
  const incompleteCharge=linked.slice();incompleteCharge[4]="";
  assert.throws(()=>helperContext.find([header,incompleteCharge],"STU-1","2026","ADM-1","MAT-1"),
    /ADMISSION_CHARGE_CONFLICT/,"charge with missing amount fields must fail closed");
  assert.throws(()=>helperContext.find([header,[...linked.slice(0,2),"STU-OTHER",...linked.slice(3)]],"STU-1","2026","ADM-1","MAT-1"),
    /ADMISSION_CHARGE_CONFLICT/,"reference owned by another user must fail closed");

  function mutableChargeSheet(rows) {
    return {
      rows:rows.map(row=>row.slice()),
      getLastRow(){return this.rows.length;},
      getDataRange(){const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      appendRow(row){this.rows.push(row.slice());},
      deleteRow(row){this.rows.splice(row-1,1);},
      getRange(row,col) {
        const self=this;
        return {setValue(value){self.rows[row-1][col-1]=value;}};
      }
    };
  }
  function registerCharge(initialRows, reference, amount) {
    const sheet=mutableChargeSheet(initialRows);
    const ss={getSheetByName:name=>name==="CargosEstudiante"?sheet:null};
    const context={
      SPREADSHEET_ID:"TEST",
      SpreadsheetApp:{openById:()=>ss},
      getOrCreateSheet:(_ss,name)=>name==="CargosEstudiante"?sheet:{
        getDataRange:()=>({getValues:()=>[["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"]]}),
        appendRow:()=>{},getLastRow:()=>1
      },
      Date,
      Math
    };
    vm.runInNewContext(extractFunction("registerStudentEnrollmentInternal_")+"\nthis.register=registerStudentEnrollmentInternal_;",context);
    const rollback=[];
    const result=context.register({
      userId:"STU-1",alumno:"Student",grado:"1",seccion:"A",periodo:"2026",
      cargos:[{concepto:"Matrícula Ordinaria 2026",montoBase:amount,descuento:0,estado:"Pendiente"}],
      _chargeReference:reference,_rollbackActions:rollback
    });
    return {sheet,result,rollback};
  }
  const emptyHeader=[["CargoID","Fecha","UserId","Concepto","MontoBase","Descuento","MontoFinal","Estado","FechaVencimiento"]];
  const first=registerCharge(emptyHeader,"ADMISION|ADM-1|MAT-1",1500);
  assert.equal(first.sheet.rows.length,2,"admission charge must be inserted once");
  assert.equal(first.sheet.rows[0][9],"ReferenciaOrigen","legacy sheet header must be extended");
  assert.equal(first.sheet.rows[1][9],"ADMISION|ADM-1|MAT-1","new charge must carry exact request/enrollment reference");
  const retry=registerCharge(first.sheet.rows,"ADMISION|ADM-1|MAT-1",1500);
  assert.equal(retry.sheet.rows.length,2,"exact retry must reuse its charge without inserting a duplicate");
  assert.throws(()=>registerCharge([emptyHeader[0],["CRG-OLD",new Date(),"STU-1","Matrícula Ordinaria 2026",1500,0,1500,"Pendiente",""]],"ADMISION|ADM-1|MAT-1",1500),
    /ADMISSION_CHARGE_CONFLICT/,"unmarked active charge must block admission charge creation");
  assert.throws(()=>registerCharge([emptyHeader[0],linked],"ADMISION|ADM-1|MAT-1",1600),
    /ADMISSION_CHARGE_CONFLICT/,"same reference with changed amount must fail closed");
  const ordinary=registerCharge(emptyHeader,"",1500);
  assert.equal(ordinary.sheet.rows[1].length,9,"ordinary charges must preserve the legacy nine-column row shape");
  assert.equal(ordinary.sheet.rows[0].length,9,"ordinary enrollment must not trigger admission-reference schema migration");
  const voided=registerCharge([emptyHeader[0],["CRG-VOID",new Date(),"STU-1","Matrícula Ordinaria 2026",1500,0,1500,"ANULADO",""]],"ADMISION|ADM-1|MAT-1",1500);
  assert.equal(voided.sheet.rows.length,3,"a voided legacy charge must not block a new admission-linked charge");
}
console.log("ACADEMIC admission charge attribution contract passed.");


// The public enrollment action must never accept internal admission charge markers
// or caller-supplied rollback callbacks.
{
  let forwarded;
  const context={registerStudentEnrollmentInternal_:payload=>{forwarded=payload;return {status:"success"};}};
  vm.runInNewContext(extractFunction("registerStudentEnrollment")+"\nthis.run=registerStudentEnrollment;",context);
  const result=context.run({
    userId:"STU-1",grado:"1",periodo:"2026",
    _chargeReference:"ADMISION|FORGED|MAT-1",
    _rollbackActions:[()=>{throw Error("untrusted callback executed");}]
  });
  assert.equal(result.status,"success");
  assert.equal(Object.prototype.hasOwnProperty.call(forwarded,"_chargeReference"),false,
    "public enrollment API must strip admission-only charge reference");
  assert.equal(Object.prototype.hasOwnProperty.call(forwarded,"_rollbackActions"),false,
    "public enrollment API must strip caller-controlled rollback callbacks");
}
console.log("ACADEMIC public enrollment internal-metadata isolation contract passed.");
