const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
function extractFunction(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function "+name+" exists");
 const open=source.indexOf("{",start);let depth=0,quote="",escape=false,lineComment=false,blockComment=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];
  if(lineComment){if(c==="\n")lineComment=false;continue;}
  if(blockComment){if(c==="*"&&n==="/"){blockComment=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}
  if(c==="/"&&n==="/"){lineComment=true;i++;continue;}if(c==="/"&&n==="*"){blockComment=true;i++;continue;}
  if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue;}
  if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error("Unbalanced "+name);
}
function makeSheet(rows){
 return {
  getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),
  getLastRow:()=>rows.length,
  appendRow:row=>rows.push(row.slice()),
  getRange:(r,c)=>({setValue:v=>{if(!rows[r-1])rows[r-1]=[];rows[r-1][c-1]=v;}})
 };
}
const accounting=fs.readFileSync(path.resolve(__dirname,"../../backend/accounting-service/Code.gs"),"utf8");
const names=[
 "getVerifiedAccountingIdentity_","getVerifiedAccountingDepartmentScope_","assertResourceOwnershipForScope_","resolveEmployeeDepartmentId_","assertEmployeeExpedienteScopeAccess_",
 "getAccountingPersonIdForUser_","resolveStudentExpedienteForAccounting_","assertPaymentVoucherOwnerAccess_",
 "extractDriveFileId","getEmployeeDocuments","getEmployeeRecords","uploadEmployeeDocument","uploadPaymentVoucher","getPaymentVouchers","getPaymentVoucherFile","reviewPaymentVoucher","validateRolePermission"
];
const code="var RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();\n"+names.map(n=>extractFunction(accounting,n)).join("\n");
const claims={
 staffA:{userId:"U-A",role:"Director"},staffB:{userId:"U-B",role:"Director"},
 employee:{userId:"U-EMP",role:"Empleado"},admin:{userId:"U-ADMIN",role:"Administrador"},
 student:{userId:"U-STUDENT",role:"Estudiante"},guardian:{userId:"U-GUARDIAN",role:"Tutor"},invalid:null
};
const rows={
 AsignacionesAmbitosRoles:[
  ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"],
  ["S-A","U-A","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
  ["S-B","U-B","Director","DEPARTAMENTO",'["DEP-B"]',"Activo","","","","","",""],
  ["S-ADMIN","U-ADMIN","Administrador","INSTITUCION",'["INST-1"]',"Activo","","","","","",""]
 ],
 ExpedientesLaborales:[
  ["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],
  ["EXP-A","P-A","U-EMP","Docente","DEP-A","","","","Activo",""],
  ["EXP-B","P-B","U-B","Docente","DEP-B","","","","Activo",""],
  ["EXP-NO-DEPT","P-X","U-X","Docente","","","","","Activo",""]
 ],
 DepartamentosAcademicos:[["DepartamentoID","Nombre"],["DEP-A","Departamento A"],["DEP-B","Departamento B"]],
 DocumentosLaborales:[
  ["DocumentoID","ExpedienteID","CategoriaDoc","TituloDocumento","ArchivoUrl","FechaCarga","CargadoPor","EstadoVisibilidad","Observaciones"],
  ["DOC-A","EXP-A","Contrato","A","url","","U-A","Privado",""],
  ["DOC-B","EXP-B","Contrato","B","url","","U-B","Privado",""]
 ],
 ResourceOwnership:[
  ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],
  ["OWN-EMP-A","INST-1","EXPEDIENTE_LABORAL","EXP-A","DEP-A","ACTIVE","U-ADMIN","",""],
  ["OWN-EMP-B","INST-1","EXPEDIENTE_LABORAL","EXP-B","DEP-B","ACTIVE","U-ADMIN","",""],
  ["OWN-STUDENT-A","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-STUDENT","DEP-A","ACTIVE","U-ADMIN","",""],
  ["OWN-STUDENT-B","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-OTHER","DEP-B","ACTIVE","U-ADMIN","",""]
 ],
 Usuarios:[
  ["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta","FechaCreacion","UltimoAcceso"],
  ["U-STUDENT","","","","","","Estudiante","","","P-STUDENT","Activo","",""],
  ["U-OTHER","","","","","","Estudiante","","","P-OTHER","Activo","",""],
  ["U-GUARDIAN","","","","","","Tutor","","","P-GUARDIAN","Activo","",""],
  ["U-NODEPT","","","","","","Estudiante","","","P-NODEPT","Activo","",""],
  ["U-EMP","","","","","","Empleado","","","P-EMP","Activo","",""]
 ],
 ExpedientesEstudiantes:[
  ["ExpedienteID","PersonaID","CodigoInstitucional","DepartamentoID"],
  ["EXP-STUDENT","P-STUDENT","COD-S","DEP-A"],
  ["EXP-OTHER","P-OTHER","COD-O","DEP-B"],
  ["EXP-NODEPT","P-NODEPT","COD-N",""]
 ],
 RelacionesEstudianteTutor:[
  ["RelacionID","ExpedienteID","ResponsableID","TipoParentesco","EsRepresentanteLegal","EsContactoEmergencia","EsResponsableFinanciero","AutorizadoPickUp","AccesoPortal","Estado"],
  ["REL-1","EXP-STUDENT","RESP-1","Madre","Sí","Sí","Sí","Sí","Sí","Activo"]
 ],
 ResponsablesTutores:[["ResponsableID","PersonaID","Nombres","Apellidos"],["RESP-1","P-GUARDIAN","",""]],
 ComprobantesPago:[
  ["ComprobanteID","Fecha","UserId","Alumno","CargoID","MontoReportado","MetodoPago","Referencia","ComprobanteUrl","Estado","Observaciones"],
  ["VCH-A",new Date("2026-01-01"),"U-STUDENT","Alumno A","GRAL",100,"Transferencia","REF-A","https://lh3.googleusercontent.com/d/FILE_A_123456789012345678901234567890","En Revisión",""],
  ["VCH-B",new Date("2026-01-02"),"U-OTHER","Alumno B","GRAL",200,"Transferencia","REF-B","https://lh3.googleusercontent.com/d/FILE_B_123456789012345678901234567890","En Revisión",""],
  ["VCH-N",new Date("2026-01-03"),"U-NODEPT","Alumno N","GRAL",300,"Transferencia","REF-N","https://lh3.googleusercontent.com/d/FILE_N_123456789012345678901234567890","En Revisión",""]
 ]
};
const ss={getSheetByName:name=>rows[name]?makeSheet(rows[name]):null};
const fileBytes=Buffer.from("%PDF-1.4 test");
const files={
 FILE_A_123456789012345678901234567890:{isTrashed:()=>false,getName:()=>"voucher-a.pdf",getMimeType:()=>"application/pdf",getBlob:()=>({getBytes:()=>Array.from(fileBytes),getContentType:()=>"application/pdf"})},
 FILE_B_123456789012345678901234567890:{isTrashed:()=>false,getName:()=>"voucher-b.pdf",getMimeType:()=>"application/pdf",getBlob:()=>({getBytes:()=>Array.from(fileBytes),getContentType:()=>"application/pdf"})},
 FILE_N_123456789012345678901234567890:{isTrashed:()=>false,getName:()=>"voucher-n.pdf",getMimeType:()=>"application/pdf",getBlob:()=>({getBytes:()=>Array.from(fileBytes),getContentType:()=>"application/pdf"})},
 FILE_TRASHED_123456789012345678901234567890:{isTrashed:()=>true,getName:()=>"voucher-trashed.pdf",getMimeType:()=>"application/pdf",getBlob:()=>({getBytes:()=>Array.from(fileBytes),getContentType:()=>"application/pdf"})},
 FILE_BADTYPE_123456789012345678901234567890:{isTrashed:()=>false,getName:()=>"voucher.exe",getMimeType:()=>"application/octet-stream",getBlob:()=>({getBytes:()=>Array.from(fileBytes),getContentType:()=>"application/octet-stream"})},
 FILE_EMPTY_123456789012345678901234567890:{isTrashed:()=>false,getName:()=>"voucher-empty.pdf",getMimeType:()=>"application/pdf",getBlob:()=>({getBytes:()=>[],getContentType:()=>"application/pdf"})}
};
const context={
 SPREADSHEET_ID:"TEST",
 PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==="IMA_INSTITUTION_ID"?"INST-1":null})},
 SpreadsheetApp:{openById:()=>ss},
 verifySessionToken:token=>claims[token]||null,
 getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||makeSheet([[]]),
 DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},getFileById:id=>{if(!files[id])throw new Error("File not found");return files[id];}},
 Utilities:{base64Encode:bytes=>Buffer.from(bytes).toString("base64")},
 logStructuredEvent:()=>{}
};
vm.runInNewContext(code+"\nthis.assertEmployeeExpedienteScopeAccess_=assertEmployeeExpedienteScopeAccess_;this.assertPaymentVoucherOwnerAccess_=assertPaymentVoucherOwnerAccess_;this.getEmployeeDocuments=getEmployeeDocuments;this.getEmployeeRecords=getEmployeeRecords;this.uploadEmployeeDocument=uploadEmployeeDocument;this.uploadPaymentVoucher=uploadPaymentVoucher;this.getPaymentVouchers=getPaymentVouchers;this.getPaymentVoucherFile=getPaymentVoucherFile;this.reviewPaymentVoucher=reviewPaymentVoucher;",context);
const actor=token=>({sessionToken:token});
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-A").authorized,true);
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-B").code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("admin"),ss,"EXP-B").accessType,"INSTITUTION");
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-NO-DEPT").code,"RESOURCE_OWNERSHIP_UNVERIFIED");
rows.ResourceOwnership.push(["OWN-EMP-NODEPT","INST-1","EXPEDIENTE_LABORAL","EXP-NO-DEPT","DEP-A","ACTIVE","U-ADMIN","",""]);
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("staffA"),ss,"EXP-NO-DEPT").authorized,true,"ownership registry must work without legacy employee department column");
assert.equal(context.assertEmployeeExpedienteScopeAccess_(actor("employee"),ss,"EXP-A").accessType,"SELF");
assert.equal(context.assertEmployeeExpedienteScopeAccess_({sessionToken:"invalid"},ss,"EXP-A").code,"VERIFIED_IDENTITY_REQUIRED");
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("staffA")).documentos,d=>d.documentoId),["DOC-A"]);
assert.equal(context.getEmployeeDocuments({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("admin")).documentos,d=>d.documentoId),["DOC-A","DOC-B"]);
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("employee")).documentos,d=>d.documentoId),["DOC-A"]);
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("staffA")).expedientes,r=>r.expedienteId),["EXP-A","EXP-NO-DEPT"],"department staff must receive only verified owned employee records");
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("staffB")).expedientes,r=>r.expedienteId),["EXP-B"],"another department must not receive department A records");
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("admin")).expedientes,r=>r.expedienteId),["EXP-A","EXP-B","EXP-NO-DEPT"],"institution scope still requires unique registered ownership");
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("employee")).expedientes,r=>r.expedienteId),["EXP-A"],"employee self-service must remain limited to the verified actor");
assert.equal(context.getEmployeeRecords({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","a specific out-of-scope expediente must not disclose existence");
assert.deepEqual(Array.from(context.getEmployeeRecords({sessionToken:"staffA",userId:"U-B"}).expedientes,r=>r.expedienteId),[],"client userId filters must not grant access");
assert.equal(context.getEmployeeRecords({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED","unverified callers must be rejected");
const duplicateEmployeeRow=rows.ExpedientesLaborales[1].slice();
rows.ExpedientesLaborales.push(duplicateEmployeeRow);
assert.equal(context.getEmployeeRecords({sessionToken:"staffA",expedienteId:"EXP-A"}).code,"RESOURCE_NOT_FOUND","duplicate expediente IDs must fail closed");
rows.ExpedientesLaborales.pop();
rows.ExpedientesLaborales.splice(1);
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("admin")).expedientes,r=>r.expedienteId),[],"empty employee sheets must return an empty list");
assert.equal(rows.ExpedientesLaborales.length,1,"read-only listing must not seed demonstration employee records");
rows.ExpedientesLaborales.push(duplicateEmployeeRow);
assert.equal(context.uploadEmployeeDocument({sessionToken:"staffA",expedienteId:"EXP-B",tituloDocumento:"No autorizado"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("student"),"U-STUDENT",{}).accessType,"SELF");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("student"),"U-OTHER",{}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("student"),"U-STUDENT",{requireStaff:true}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("guardian"),"U-STUDENT",{}).accessType,"GUARDIAN");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("guardian"),"U-OTHER",{}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("staffA"),"U-STUDENT",{}).accessType,"DEPARTMENT");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("staffA"),"U-OTHER",{}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("staffA"),"U-NODEPT",{}).code,"RESOURCE_OWNERSHIP_UNVERIFIED");
assert.equal(context.assertPaymentVoucherOwnerAccess_(actor("admin"),"U-OTHER",{}).accessType,"INSTITUTION");
assert.deepEqual(Array.from(context.getPaymentVouchers({sessionToken:"student",userId:"U-OTHER"}).comprobantes,c=>c.comprobanteId),["VCH-A"]);
const studentVoucherList=context.getPaymentVouchers(actor("student")).comprobantes;
assert.equal(studentVoucherList[0].comprobanteUrl,"","voucher list must not disclose the legacy Drive URL");
assert.equal(studentVoucherList[0].tieneComprobante,true,"voucher list must expose only attachment availability");
assert.deepEqual(Array.from(context.getPaymentVouchers(actor("guardian")).comprobantes,c=>c.comprobanteId),["VCH-A"]);
assert.deepEqual(Array.from(context.getPaymentVouchers(actor("staffA")).comprobantes,c=>c.comprobanteId),["VCH-A"]);
assert.deepEqual(Array.from(context.getPaymentVouchers(actor("admin")).comprobantes,c=>c.comprobanteId),["VCH-A","VCH-B"],"institution-wide access still requires a registered resource owner");
rows.ComprobantesPago.push(
 ["VCH-TRASHED",new Date("2026-01-04"),"U-STUDENT","Alumno A","GRAL",100,"Transferencia","REF-T","https://lh3.googleusercontent.com/d/FILE_TRASHED_123456789012345678901234567890","En Revisión",""],
 ["VCH-BADTYPE",new Date("2026-01-05"),"U-STUDENT","Alumno A","GRAL",100,"Transferencia","REF-X","https://lh3.googleusercontent.com/d/FILE_BADTYPE_123456789012345678901234567890","En Revisión",""],
 ["VCH-EMPTY",new Date("2026-01-06"),"U-STUDENT","Alumno A","GRAL",100,"Transferencia","REF-E","https://lh3.googleusercontent.com/d/FILE_EMPTY_123456789012345678901234567890","En Revisión",""]
);
assert.equal(context.getPaymentVouchers({sessionToken:"staffA",userId:"U-OTHER"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.uploadPaymentVoucher({sessionToken:"student",userId:"U-OTHER",montoReportado:100}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.reviewPaymentVoucher({sessionToken:"student",comprobanteId:"VCH-A",nuevoEstado:"Rechazado"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.reviewPaymentVoucher({sessionToken:"staffA",comprobanteId:"VCH-B",nuevoEstado:"Rechazado"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.reviewPaymentVoucher({sessionToken:"staffA",comprobanteId:"VCH-A",nuevoEstado:"Rechazado"}).status,"success");
const ownFile=context.getPaymentVoucherFile({sessionToken:"student",comprobanteId:"VCH-A",fileId:"FILE_B_123456789012345678901234567890"});
assert.equal(ownFile.status,"success","student may retrieve only their own voucher file");
assert.equal(ownFile.fileName,"voucher-a.pdf","file reference must come from the stored voucher row, not client fileId");
assert.equal(ownFile.mimeType,"application/pdf");
assert.equal(ownFile.fileData,Buffer.from("%PDF-1.4 test").toString("base64"));
assert.equal(context.getPaymentVoucherFile({sessionToken:"student",comprobanteId:"VCH-B"}).code,"RESOURCE_NOT_FOUND","unauthorized voucher IDs must not reveal resource existence");
assert.equal(context.getPaymentVoucherFile({sessionToken:"guardian",comprobanteId:"VCH-A"}).status,"success","linked guardian may retrieve the linked voucher");
assert.equal(context.getPaymentVoucherFile({sessionToken:"staffA",comprobanteId:"VCH-A"}).status,"success","department staff may retrieve an in-scope voucher");
assert.equal(context.getPaymentVoucherFile({sessionToken:"staffA",comprobanteId:"VCH-B"}).code,"RESOURCE_NOT_FOUND","department staff must not learn whether another department voucher exists");
assert.equal(context.getPaymentVoucherFile({sessionToken:"admin",comprobanteId:"VCH-B"}).status,"success","institution-wide scope may retrieve an authorized voucher");
assert.equal(context.getPaymentVoucherFile({sessionToken:"invalid",comprobanteId:"VCH-A"}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(context.getPaymentVoucherFile({sessionToken:"student",comprobanteId:"NO-SUCH-VOUCHER"}).code,"RESOURCE_NOT_FOUND");
assert.equal(context.getPaymentVoucherFile({sessionToken:"student",comprobanteId:"VCH-TRASHED"}).code,"VOUCHER_FILE_UNAVAILABLE");
assert.equal(context.getPaymentVoucherFile({sessionToken:"student",comprobanteId:"VCH-BADTYPE"}).code,"VOUCHER_FILE_TYPE_NOT_ALLOWED");
assert.equal(context.getPaymentVoucherFile({sessionToken:"student",comprobanteId:"VCH-EMPTY"}).code,"VOUCHER_FILE_EMPTY");

assert.ok(extractFunction(accounting,"validateRolePermission").includes("getVerifiedAccountingDepartmentScope_"));
assert.ok(extractFunction(accounting,"uploadEmployeeDocument").includes("DriveApp.Access.PRIVATE"));
assert.ok(!extractFunction(accounting,"uploadEmployeeDocument").includes("ANYONE_WITH_LINK"));
assert.ok(extractFunction(accounting,"uploadPaymentVoucher").includes("DriveApp.Access.PRIVATE"));
assert.ok(!extractFunction(accounting,"uploadPaymentVoucher").includes("ANYONE_WITH_LINK"));
assert.ok(extractFunction(accounting,"assertEmployeeExpedienteScopeAccess_").includes("assertResourceOwnershipForScope_"));
assert.ok(extractFunction(accounting,"assertPaymentVoucherOwnerAccess_").includes("assertResourceOwnershipForScope_"));
assert.ok(extractFunction(accounting,"getPaymentVouchers").includes("assertPaymentVoucherOwnerAccess_"));
assert.ok(extractFunction(accounting,"reviewPaymentVoucher").includes("assertPaymentVoucherOwnerAccess_"));
assert.ok(accounting.includes('"getPaymentVoucherFile"'),"new file action must be declared in role permissions");
assert.ok(accounting.includes('case "getPaymentVoucherFile": result = getPaymentVoucherFile(payload); break;'));
console.log("Accounting departmental resource and payment voucher access contracts passed.");
