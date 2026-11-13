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
 "parseJsonSafe","getVerifiedAccountingIdentity_","getVerifiedAccountingDepartmentScope_","getVerifiedDepartmentScopeForSession_","assertResourceOwnershipForScope_","resolveEmployeeDepartmentId_","assertEmployeeExpedienteScopeAccess_",
 "getAccountingPersonIdForUser_","resolveStudentExpedienteForAccounting_","assertPaymentVoucherOwnerAccess_",
 "extractDriveFileId","getEmployeeDocuments","getEmployeeContracts","getEmployeeContractAlerts","getEmployeeTrainingHistory","getLaborIncidentsHistory","getWorkShiftsAndSubstitutionsHistory","getStaffAttendanceLogs","recordStaffCheckIn","getStaffPayrollReceipt","getEmployeeLoansAdvances","getLoanAmortizationSchedule","getEmployeeRecords","getEmployeeSelfServicePortal","uploadEmployeeDocument","uploadPaymentVoucher","getPaymentVouchers","getPaymentVoucherFile","reviewPaymentVoucher","validateRolePermission"
];
const code="var RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();\n"+names.map(n=>extractFunction(accounting,n)).join("\n");
const claims={
 staffA:{userId:"U-A",role:"Director"},staffB:{userId:"U-B",role:"Director"},hrA:{userId:"U-A",role:"RecursosHumanos"},hrB:{userId:"U-B",role:"RecursosHumanos"},
 employee:{userId:"U-EMP",role:"Empleado"},professor:{userId:"U-EMP",role:"Profesor"},admin:{userId:"U-ADMIN",role:"Administrador"},
 student:{userId:"U-STUDENT",role:"Estudiante"},guardian:{userId:"U-GUARDIAN",role:"Tutor"},invalid:null
};
const rows={
 AsignacionesAmbitosRoles:[
  ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"],
  ["S-A","U-A","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
  ["S-B","U-B","Director","DEPARTAMENTO",'["DEP-B"]',"Activo","","","","","",""],
  ["S-HR-A","U-A","RecursosHumanos","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
  ["S-HR-B","U-B","RecursosHumanos","DEPARTAMENTO",'["DEP-B"]',"Activo","","","","","",""],
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
 ContratosLaborales:[
  ["ContratoID","ExpedienteID","TipoContrato","FechaInicio","FechaFin","SalarioBase","Jornada","EstadoContrato","Observaciones"],
  ["CTR-A","EXP-A","Indefinido","2026-01-01","","20000","Completa","Activo","A"],
  ["CTR-B","EXP-B","Temporal","2026-01-01","","15000","Parcial","Activo","B"]
 ],
 SolicitudesVacaciones:[
  ["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"],
  ["VAC-A","EXP-A","Vacaciones","2026-12-01","2026-12-05",5,"Pendiente","","A"],
  ["VAC-B","EXP-B","Permiso","2026-12-02","2026-12-03",2,"Pendiente","","B"]
 ],
 AnticiposPrestamosEmpleado:[
  ["PrestamoID","Fecha","EmpleadoId","Tipo","MontoSolicitado","MontoAprobado","PlazoCuotas","CuotaMensual","SaldoPendiente","EstadoAprobacion","AprobadoPor","Observaciones"],
  ["ADV-A","2026-01-01","U-EMP","Anticipo",1000,1000,2,500,1000,"Aprobado","","A"],
  ["ADV-B","2026-01-01","U-B","Anticipo",2000,0,4,500,2000,"Pendiente","","B"]
 ],
 DeduccionesAsistencia:[
  ["AsistenciaID","Fecha","EmpleadoId","EmpleadoNombre","HoraEntrada","HoraSalida","MinutosTardanza","EstadoAsistencia","Observaciones"],
  ["AST-A",new Date("2026-02-05T12:00:00.000Z"),"U-EMP","Empleado A","07:30","15:00",0,"EntradaPuntual",""],
  ["AST-B",new Date("2026-02-06T12:00:00.000Z"),"U-B","Empleado B","07:40","15:00",10,"Tardanza",""],
  ["AST-UNKNOWN",new Date("2026-02-07T12:00:00.000Z"),"U-UNKNOWN","Desconocido","07:30","15:00",0,"EntradaPuntual",""]
 ],
 AsignacionesTurnosLaborales:[
  ["AsignacionTurnoID","EmpleadoID","NombreTurno","FechaInicio","FechaFin","HoraEntrada","HoraSalida","DepartamentoArea","Estado","CreadoPor","FechaCreacion","UltimaModificacion"],
  ["TUR-A","U-EMP","Matutino","2026-01-01","2026-12-31","07:00","15:00","DEP-A","Activo","","",""],
  ["TUR-B","U-B","Vespertino","2026-01-01","2026-12-31","13:00","21:00","DEP-B","Activo","","",""]
 ],
 SustitucionesPersonal:[["SustitucionID","EmpleadoSustitutoID","EmpleadoSustituidoID","FechaInicio","FechaFin","HoraEntrada","HoraSalida","MotivoSustitucion","DepartamentoArea","Estado","CreadoPor","FechaCreacion","UltimaModificacion"],["SUST-A","U-EMP","U-EMP","2026-02-01","2026-02-02","07:00","15:00","Cobertura","DEP-A","Confirmada","U-A","",""],["SUST-CROSS","U-EMP","U-B","2026-02-03","2026-02-04","07:00","15:00","Cobertura","DEP-A","Confirmada","U-A","",""]],

 PlanillasNomenclatura:[["PlanillaID","FechaGeneracion","PeriodoMes","EmpleadoId","EmpleadoNombre","CargoPuesto","SalarioBase","HorasExtras","MontoHorasExtras","Bonificaciones","DeduccionIHSS","DeduccionRAP","DeduccionISR","OtrasDeducciones","SalarioNeto","Estado","PatronalIHSS","PatronalRAP","PatronalINFOP","CostoLaboralTotal"],["PLN-A","2026-02-28","2026-02","EXP-A","Empleado A","Docente",20000,2,500,0,700,150,0,0,19650,"Calculada",0,0,0,0],["PLN-B","2026-02-28","2026-02","EXP-B","Empleado B","Docente",15000,0,0,0,525,70,0,0,14405,"Calculada",0,0,0,0]],
 BoletasPago:[["BoletaID","PlanillaID","FechaEmision","EmpleadoId","EmpleadoNombre","PeriodoMes","TotalDevengado","TotalDeducciones","NetoAPagar","EstadoBoleta"],["BOL-A","PLN-A","2026-02-28","EXP-A","Empleado A","2026-02",20500,850,19650,"Emitida"],["BOL-B","PLN-B","2026-02-28","EXP-B","Empleado B","2026-02",15000,595,14405,"Emitida"]],
 SolicitudesHorasExtras:[["SolicitudID","EmpleadoID","Fecha","HorasSolicitadas","Motivo","Estado","AprobadoPor"],["OT-A","U-EMP","2026-02-05",2,"Evento","Pendiente","U-A"],["OT-B","U-B","2026-02-06",3,"Evento","Aprobada","U-B"]],
 CatalogoCursosCapacitacion:[
  ["CursoID","NombreCurso","Categoria","ProveedorResponsable","Modalidad","DuracionHoras","Requisitos","DirigidoA","Estado","CreadoPor","FechaCreacion","UltimaModificacion"],
  ["CUR-A","Curso A","General","Interno","Presencial",8,"[]","Todos","Activo","","",""],
  ["CUR-B","Curso B","General","Interno","Virtual",4,"[]","Todos","Activo","","",""]
 ],
 InscripcionesCapacitacion:[
  ["InscripcionID","CursoID","EmpleadoID","FechaInscripcion","EstadoInscripcion","AsistenciaPorcentaje","ResultadoNota","CertificadoDriveUrl","FechaEmisionCertificado","FechaVencimientoCertificado","Observaciones","CreadoPor","FechaCreacion","UltimaModificacion"],
  ["CAP-A","CUR-A","U-EMP","2026-01-01","Finalizado",100,95,"private-a","","","","","",""],
  ["CAP-B","CUR-B","U-B","2026-01-01","Finalizado",100,90,"private-b","","","","","",""]
 ],
 IncidenciasLaborales:[
  ["IncidenciaID","EmpleadoID","Fecha","Categoria","DescripcionObjetiva","ResponsableRegistro","Estado","ResponsabilidadEstablecida","DocumentacionDriveUrl","ObservacionesAclaraciones","HistorialAclaracionesJSON","CreadoPor","FechaCreacion","UltimaModificacion"],
  ["INC-A","U-EMP","2026-01-10","Seguridad","Incidencia A","U-A","Registrada",false,"private-a","Aclaración A","[]","U-A","2026-01-10",""],
  ["INC-B","U-B","2026-01-11","Conducta","Incidencia B","U-B","Cerrada",true,"private-b","Aclaración B","[]","U-B","2026-01-11",""]
 ],
 MedidasDisciplinarias:[
  ["MedidaID","IncidenciaID","EmpleadoID","TipoMedida","FundamentoDocumentado","FechaEfectiva","ResponsableAprobacion","EstadoMedida","DiasSuspension","ActaFirmadaDriveUrl","CreadoPor","FechaCreacion","UltimaModificacion"],
  ["MED-A","INC-A","U-EMP","Amonestación","Fundamento A","2026-01-12","U-A","Aprobada",0,"private-med-a","U-A","2026-01-12",""],
  ["MED-B","INC-B","U-B","Suspensión","Fundamento B","2026-01-13","U-B","Aprobada",2,"private-med-b","U-B","2026-01-13",""]
 ],
 PlanesDesarrolloProfesional:[
  ["PlanID","EmpleadoID","TituloObjetivo","Descripcion","MetasAccionesJSON","FechaInicio","FechaMeta","EstadoObjetivo","EvaluacionSeguimiento","CreadoPor","FechaCreacion","UltimaModificacion"],
  ["PLAN-A","U-EMP","Objetivo A","Plan A","[]","2026-01-01","","EnProgreso","","","2026-01-01",""],
  ["PLAN-B","U-B","Objetivo B","Plan B","[]","2026-01-01","","EnProgreso","","","2026-01-01",""]
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
 LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},
 getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||makeSheet([[]]),
 DriveApp:{Access:{PRIVATE:"PRIVATE"},Permission:{NONE:"NONE"},getFileById:id=>{if(!files[id])throw new Error("File not found");return files[id];}},
 Utilities:{base64Encode:bytes=>Buffer.from(bytes).toString("base64")},
 logStructuredEvent:()=>{}
};
vm.runInNewContext(code+"\nthis.assertEmployeeExpedienteScopeAccess_=assertEmployeeExpedienteScopeAccess_;this.assertPaymentVoucherOwnerAccess_=assertPaymentVoucherOwnerAccess_;this.getEmployeeDocuments=getEmployeeDocuments;this.getEmployeeContracts=getEmployeeContracts;this.getEmployeeContractAlerts=getEmployeeContractAlerts;this.getEmployeeTrainingHistory=getEmployeeTrainingHistory;this.getLaborIncidentsHistory=getLaborIncidentsHistory;this.getWorkShiftsAndSubstitutionsHistory=getWorkShiftsAndSubstitutionsHistory;this.getStaffAttendanceLogs=getStaffAttendanceLogs;this.recordStaffCheckIn=recordStaffCheckIn;this.getStaffPayrollReceipt=getStaffPayrollReceipt;this.getEmployeeLoansAdvances=getEmployeeLoansAdvances;this.getLoanAmortizationSchedule=getLoanAmortizationSchedule;this.getEmployeeRecords=getEmployeeRecords;this.getEmployeeSelfServicePortal=getEmployeeSelfServicePortal;this.uploadEmployeeDocument=uploadEmployeeDocument;this.uploadPaymentVoucher=uploadPaymentVoucher;this.getPaymentVouchers=getPaymentVouchers;this.getPaymentVoucherFile=getPaymentVoucherFile;this.reviewPaymentVoucher=reviewPaymentVoucher;",context);
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
assert.equal(context.getEmployeeDocuments({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","out-of-scope expediente queries must not disclose resource existence");
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("admin")).documentos,d=>d.documentoId),["DOC-A","DOC-B"]);
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("employee")).documentos,d=>d.documentoId),["DOC-A"]);
assert.deepEqual(Array.from(context.getEmployeeDocuments({sessionToken:"staffA",categoriaDoc:"contrato"}).documentos,d=>d.documentoId),["DOC-A"],"category filters must not expand the verified department scope");
assert.equal(context.getEmployeeDocuments({sessionToken:"employee",authRole:"Director",authUserId:"U-B",userId:"U-B",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","client identity and role fields must not override the signed actor");
assert.equal(context.getEmployeeDocuments({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED","unverified callers must be rejected even when no expediente filter is supplied");
const originalDocumentRows=rows.DocumentosLaborales.map(r=>r.slice());
rows.DocumentosLaborales.push(["DOC-A","EXP-B","Contrato","Duplicado","url","","U-B","Privado",""]);
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("admin")).documentos,d=>d.documentoId),["DOC-B"],"duplicate document IDs must be excluded rather than attributed to either expediente");
rows.DocumentosLaborales.splice(0,rows.DocumentosLaborales.length,...originalDocumentRows);
const originalDocumentHeader=rows.DocumentosLaborales[0][0];
rows.DocumentosLaborales[0][0]="Documento";
assert.equal(context.getEmployeeDocuments(actor("admin")).code,"RESOURCE_SCHEMA_INVALID","unexpected document headers must fail closed");
rows.DocumentosLaborales[0][0]=originalDocumentHeader;
const originalDocumentOpen=context.SpreadsheetApp.openById,originalDocumentGetOrCreate=context.getOrCreateSheet;
let documentSheetCreationAttempts=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:()=>null});
context.getOrCreateSheet=()=>{documentSheetCreationAttempts++;throw new Error("read path must not create sheets");};
assert.deepEqual(Array.from(context.getEmployeeDocuments(actor("admin")).documentos),[],"missing document sheet must return an empty result");
assert.equal(documentSheetCreationAttempts,0,"document reads must not create a missing sheet");
context.SpreadsheetApp.openById=originalDocumentOpen;
context.getOrCreateSheet=originalDocumentGetOrCreate;
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("staffA")).expedientes,r=>r.expedienteId),["EXP-A","EXP-NO-DEPT"],"department staff must receive only verified owned employee records");
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("staffB")).expedientes,r=>r.expedienteId),["EXP-B"],"another department must not receive department A records");
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("admin")).expedientes,r=>r.expedienteId),["EXP-A","EXP-B","EXP-NO-DEPT"],"institution scope still requires unique registered ownership");
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("employee")).expedientes,r=>r.expedienteId),["EXP-A"],"employee self-service must remain limited to the verified actor");
assert.equal(context.getEmployeeRecords({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","a specific out-of-scope expediente must not disclose existence");
assert.deepEqual(Array.from(context.getEmployeeRecords({sessionToken:"staffA",userId:"U-B"}).expedientes,r=>r.expedienteId),[],"client userId filters must not grant access");
assert.equal(context.getEmployeeRecords({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED","unverified callers must be rejected");
const employeeRowsSnapshot=rows.ExpedientesLaborales.map(r=>r.slice());
const duplicateEmployeeRow=rows.ExpedientesLaborales[1].slice();
rows.ExpedientesLaborales.push(duplicateEmployeeRow);
assert.equal(context.getEmployeeRecords({sessionToken:"staffA",expedienteId:"EXP-A"}).code,"RESOURCE_NOT_FOUND","duplicate expediente IDs must fail closed");
rows.ExpedientesLaborales.pop();
rows.ExpedientesLaborales.splice(1);
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("admin")).expedientes,r=>r.expedienteId),[],"empty employee sheets must return an empty list");
assert.equal(rows.ExpedientesLaborales.length,1,"read-only listing must not seed demonstration employee records");
rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...employeeRowsSnapshot);
const originalOpenById=context.SpreadsheetApp.openById;
const originalGetOrCreateSheet=context.getOrCreateSheet;
let missingSheetFallbackCalls=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:()=>null});
context.getOrCreateSheet=(spreadsheet,name)=>{missingSheetFallbackCalls++;return makeSheet([[]]);};
assert.deepEqual(Array.from(context.getEmployeeRecords(actor("admin")).expedientes,r=>r.expedienteId),[],"a missing employee sheet must return an empty list");
assert.equal(missingSheetFallbackCalls,0,"read-only listing must not create a missing employee sheet");
context.SpreadsheetApp.openById=originalOpenById;
context.getOrCreateSheet=originalGetOrCreateSheet;
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
const selfPortal=context.getEmployeeSelfServicePortal(actor("employee"));
assert.equal(selfPortal.status,"success");
assert.equal(selfPortal.data.effectiveUserId,"U-EMP");
assert.equal(selfPortal.data.expediente.expedienteId,"EXP-A");
assert.equal(selfPortal.data.expediente.puesto,"Docente");
assert.equal(selfPortal.data.expediente.departamento,"DEP-A");
assert.deepEqual(Array.from(selfPortal.data.contratos,r=>r.contratoId),["CTR-A"]);
assert.deepEqual(Array.from(selfPortal.data.solicitudesVacaciones,r=>r.solicitudId),["VAC-A"]);
assert.deepEqual(Array.from(selfPortal.data.prestamos,r=>r.prestamoId),["ADV-A"]);
assert.deepEqual(Array.from(selfPortal.data.turnos,r=>r.asignacionTurnoId),["TUR-A"]);
assert.deepEqual(Array.from(selfPortal.data.capacitaciones,r=>r.inscripcionId),["CAP-A"]);
assert.equal(context.getEmployeeSelfServicePortal({sessionToken:"employee",authRole:"Director",authUserId:"U-B",targetUserId:"U-B"}).data.expediente.expedienteId,"EXP-A","self-service payload identity and target overrides must be ignored");
assert.equal(context.getEmployeeSelfServicePortal({sessionToken:"staffA",targetUserId:"U-EMP"}).status,"success");
assert.equal(context.getEmployeeSelfServicePortal({sessionToken:"staffB",targetUserId:"U-EMP"}).code,"RESOURCE_NOT_FOUND");
assert.equal(context.getEmployeeSelfServicePortal({sessionToken:"staffA",targetUserId:"U-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(context.getEmployeeSelfServicePortal({sessionToken:"admin",targetUserId:"U-B"}).status,"success");
assert.equal(context.getEmployeeSelfServicePortal({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED");
const duplicatePortalEmployee=rows.ExpedientesLaborales[1].slice();duplicatePortalEmployee[0]="EXP-DUP";rows.ExpedientesLaborales.push(duplicatePortalEmployee);
assert.equal(context.getEmployeeSelfServicePortal(actor("employee")).code,"RESOURCE_NOT_FOUND","duplicate employee user mappings fail closed");
rows.ExpedientesLaborales.pop();
const originalPortalOpen=context.SpreadsheetApp.openById,originalPortalGetOrCreate=context.getOrCreateSheet;let portalCreationAttempts=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:()=>null});
context.getOrCreateSheet=()=>{portalCreationAttempts++;throw new Error("read path must not create sheets");};
assert.equal(context.getEmployeeSelfServicePortal(actor("employee")).code,"RESOURCE_NOT_FOUND");
assert.equal(portalCreationAttempts,0,"self-service reads must not create sheets");
context.SpreadsheetApp.openById=originalPortalOpen;context.getOrCreateSheet=originalPortalGetOrCreate;
assert.ok(extractFunction(accounting,"getEmployeeDocuments").includes('getSheetByName("DocumentosLaborales")'));
assert.ok(!extractFunction(accounting,"getEmployeeDocuments").includes("getOrCreateSheet"),"document reads must not create sheets");
const employeeContracts= context.getEmployeeContracts;
assert.deepEqual(Array.from(employeeContracts(actor("staffA")).contratos,c=>c.contratoId),["CTR-A"],"department staff may list only contracts owned by their department");
assert.deepEqual(Array.from(employeeContracts(actor("staffB")).contratos,c=>c.contratoId),["CTR-B"],"other department staff may list only their own department contracts");
assert.deepEqual(Array.from(employeeContracts(actor("admin")).contratos,c=>c.contratoId),["CTR-A","CTR-B"],"institution-wide scope may list authorized contracts");
assert.deepEqual(Array.from(employeeContracts(actor("employee")).contratos,c=>c.contratoId),["CTR-A"],"employees may list only their own contracts");
assert.equal(employeeContracts({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","out-of-scope contract queries must not disclose resource existence");
assert.equal(employeeContracts({sessionToken:"employee",authRole:"Director",authUserId:"U-B",userId:"U-B",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","client identity and role fields must not override the signed actor");
assert.equal(employeeContracts({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED","unverified callers must be rejected before contract lookup");
const originalContractRows=rows.ContratosLaborales.map(r=>r.slice());
rows.ContratosLaborales.push(["CTR-A","EXP-B","Duplicado","2026-01-01","","1","Completa","Activo",""]);
assert.deepEqual(Array.from(employeeContracts(actor("admin")).contratos,c=>c.contratoId),["CTR-B"],"duplicate contract IDs must be excluded");
rows.ContratosLaborales.splice(0,rows.ContratosLaborales.length,...originalContractRows);
const originalEmployeeRows=rows.ExpedientesLaborales.map(r=>r.slice());
rows.ExpedientesLaborales.push(rows.ExpedientesLaborales[1].slice());
assert.deepEqual(Array.from(employeeContracts(actor("admin")).contratos,c=>c.contratoId),["CTR-B"],"contracts linked to ambiguous employee expediente IDs must be excluded");
rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...originalEmployeeRows);
const ambiguousUserEmployee=rows.ExpedientesLaborales[1].slice();ambiguousUserEmployee[0]="EXP-EMP-DUP";ambiguousUserEmployee[2]="U-EMP";rows.ExpedientesLaborales.push(ambiguousUserEmployee);
assert.equal(employeeContracts(actor("employee")).code,"RESOURCE_NOT_FOUND","employees with ambiguous user-to-expediente mappings must not receive multiple personnel files");
rows.ExpedientesLaborales.pop();
const originalContractHeader=rows.ContratosLaborales[0][0];
rows.ContratosLaborales[0][0]="Contrato";
assert.equal(employeeContracts(actor("admin")).code,"RESOURCE_SCHEMA_INVALID","unexpected contract headers must fail closed");
rows.ContratosLaborales[0][0]=originalContractHeader;
const originalContractOpen=context.SpreadsheetApp.openById,originalContractGetOrCreate=context.getOrCreateSheet;
let contractSheetCreationAttempts=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:name=>name==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});
context.getOrCreateSheet=()=>{contractSheetCreationAttempts++;throw new Error("read path must not create sheets");};
assert.deepEqual(Array.from(employeeContracts(actor("admin")).contratos),[],"missing contract sheet must return an empty result");
assert.equal(contractSheetCreationAttempts,0,"contract reads must not create sheets");
context.SpreadsheetApp.openById=originalContractOpen;
context.getOrCreateSheet=originalContractGetOrCreate;
assert.ok(extractFunction(accounting,"getEmployeeContracts").includes('getSheetByName("ContratosLaborales")'));
assert.ok(!extractFunction(accounting,"getEmployeeContracts").includes("getOrCreateSheet"),"contract reads must not create sheets");
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeContracts"'),"contracts must be included in resource scope authorization");
assert.ok(extractFunction(accounting,"validateRolePermission").includes('["getEmployeeDocuments", "getEmployeeContracts", "getEmployeeContractAlerts", "getEmployeeTrainingHistory", "getStaffAttendanceLogs", "getEmployeeLoansAdvances", "uploadEmployeeDocument", "getEmployeeSelfServicePortal", "recordStaffCheckIn"]'),"employees must retain self-service contract access");
assert.ok(extractFunction(accounting,"getEmployeeSelfServicePortal").includes("assertEmployeeExpedienteScopeAccess_"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeSelfServicePortal"'));

const contractAlerts=context.getEmployeeContractAlerts;
assert.deepEqual(Array.from(contractAlerts(actor("staffA")).data,r=>r.contratoId),["CTR-A"],"contract alerts must be restricted to department A");
assert.deepEqual(Array.from(contractAlerts(actor("staffB")).data,r=>r.contratoId),["CTR-B"],"contract alerts must be restricted to department B");
assert.deepEqual(Array.from(contractAlerts(actor("admin")).data,r=>r.contratoId),["CTR-A","CTR-B"],"institution-wide actors may see only uniquely owned contracts");
assert.deepEqual(Array.from(contractAlerts(actor("employee")).data,r=>r.contratoId),["CTR-A"],"employees may see only alerts for their signed employee identity");
assert.equal(contractAlerts({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","out-of-scope alert queries must not disclose existence");
assert.equal(contractAlerts({sessionToken:"employee",authRole:"Director",authUserId:"U-B",expedienteId:"EXP-B"}).code,"RESOURCE_NOT_FOUND","client identity and role fields must not override the signed actor");
assert.equal(contractAlerts({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED","unverified alert queries must be rejected");
const originalAlertRows=rows.ContratosLaborales.map(r=>r.slice());
rows.ContratosLaborales.push(["CTR-A","EXP-B","Duplicado","2026-01-01","","1","Completa","Activo",""]);
assert.deepEqual(Array.from(contractAlerts(actor("admin")).data,r=>r.contratoId),["CTR-B"],"duplicate contract IDs must be excluded from alerts");
rows.ContratosLaborales.splice(0,rows.ContratosLaborales.length,...originalAlertRows);
const originalAlertEmployeeRows=rows.ExpedientesLaborales.map(r=>r.slice());
rows.ExpedientesLaborales.push(rows.ExpedientesLaborales[1].slice());
assert.deepEqual(Array.from(contractAlerts(actor("admin")).data,r=>r.contratoId),["CTR-B"],"contracts linked to ambiguous expediente IDs must be excluded");
rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...originalAlertEmployeeRows);
const originalAlertHeader=rows.ContratosLaborales[0][0];
rows.ContratosLaborales[0][0]="Contrato";
assert.equal(contractAlerts(actor("admin")).code,"RESOURCE_SCHEMA_INVALID","invalid contract headers must fail closed");
rows.ContratosLaborales[0][0]=originalAlertHeader;
const originalAlertOpen=context.SpreadsheetApp.openById,originalAlertGetOrCreate=context.getOrCreateSheet;
let alertSheetCreationAttempts=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:name=>name==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});
context.getOrCreateSheet=()=>{alertSheetCreationAttempts++;throw new Error("alert reads must not create sheets");};
assert.deepEqual(Array.from(contractAlerts(actor("admin")).data),[],"missing contract sheet must return an empty result");
assert.equal(alertSheetCreationAttempts,0,"contract alert reads must not create missing sheets");
context.SpreadsheetApp.openById=originalAlertOpen;
context.getOrCreateSheet=originalAlertGetOrCreate;
assert.ok(extractFunction(accounting,"getEmployeeContractAlerts").includes('getSheetByName("ContratosLaborales")'));
assert.ok(!extractFunction(accounting,"getEmployeeContractAlerts").includes("getOrCreateSheet"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeContractAlerts"'));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeContractAlerts", "getEmployeeTrainingHistory", "getStaffAttendanceLogs", "getEmployeeLoansAdvances", "uploadEmployeeDocument"'));


const trainingHistory=context.getEmployeeTrainingHistory;
assert.deepEqual(Array.from(trainingHistory(actor("staffA")).data.inscripciones,r=>r.inscripcionId),["CAP-A"]);
assert.deepEqual(Array.from(trainingHistory(actor("staffB")).data.inscripciones,r=>r.inscripcionId),["CAP-B"]);
assert.deepEqual(Array.from(trainingHistory(actor("admin")).data.inscripciones,r=>r.inscripcionId),["CAP-A","CAP-B"]);
assert.deepEqual(Array.from(trainingHistory(actor("employee")).data.inscripciones,r=>r.inscripcionId),["CAP-A"]);
assert.deepEqual(Array.from(trainingHistory(actor("staffA")).data.planesDesarrollo,r=>r.planId),["PLAN-A"]);
assert.deepEqual(Array.from(trainingHistory(actor("staffB")).data.planesDesarrollo,r=>r.planId),["PLAN-B"]);
assert.equal(trainingHistory({sessionToken:"staffA",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(trainingHistory({sessionToken:"employee",empleadoId:"U-B",userRole:"Director",authenticatedUserId:"U-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(trainingHistory({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.deepEqual(Array.from(trainingHistory({sessionToken:"staffA",cursoId:"CUR-A"}).data.inscripciones,r=>r.inscripcionId),["CAP-A"]);
const originalTrainingRows=rows.InscripcionesCapacitacion.map(r=>r.slice());rows.InscripcionesCapacitacion.push(["CAP-A","CUR-B","U-B","2026-01-01","Finalizado",100,90,"private","","","","","",""]);
assert.deepEqual(Array.from(trainingHistory(actor("admin")).data.inscripciones,r=>r.inscripcionId),["CAP-B"]);rows.InscripcionesCapacitacion.splice(0,rows.InscripcionesCapacitacion.length,...originalTrainingRows);
const originalPlanRows=rows.PlanesDesarrolloProfesional.map(r=>r.slice());rows.PlanesDesarrolloProfesional.push(rows.PlanesDesarrolloProfesional[1].slice());
assert.deepEqual(Array.from(trainingHistory(actor("admin")).data.planesDesarrollo,r=>r.planId),["PLAN-B"]);rows.PlanesDesarrolloProfesional.splice(0,rows.PlanesDesarrolloProfesional.length,...originalPlanRows);
const originalTrainingEmployees=rows.ExpedientesLaborales.map(r=>r.slice());rows.ExpedientesLaborales.push(rows.ExpedientesLaborales[1].slice());
assert.deepEqual(Array.from(trainingHistory(actor("admin")).data.inscripciones,r=>r.inscripcionId),["CAP-B"],"ambiguous U-EMP expediente must exclude CAP-A");rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...originalTrainingEmployees);
const originalTrainingHeader=rows.InscripcionesCapacitacion[0][0];rows.InscripcionesCapacitacion[0][0]="Inscripcion";
assert.equal(trainingHistory(actor("admin")).code,"RESOURCE_SCHEMA_INVALID");rows.InscripcionesCapacitacion[0][0]=originalTrainingHeader;
const originalTrainingOpen=context.SpreadsheetApp.openById,originalTrainingGetOrCreate=context.getOrCreateSheet;let trainingSheetCreationAttempts=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:name=>name==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});
context.getOrCreateSheet=()=>{trainingSheetCreationAttempts++;throw new Error("training history reads must not create sheets");};
assert.deepEqual(Array.from(trainingHistory(actor("admin")).data.inscripciones),[]);assert.equal(trainingSheetCreationAttempts,0);
context.SpreadsheetApp.openById=originalTrainingOpen;context.getOrCreateSheet=originalTrainingGetOrCreate;
assert.ok(!extractFunction(accounting,"getEmployeeTrainingHistory").includes("getOrCreateSheet"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeTrainingHistory"'));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeTrainingHistory", "getStaffAttendanceLogs", "getEmployeeLoansAdvances", "uploadEmployeeDocument"'));

const laborHistory=context.getLaborIncidentsHistory;
assert.deepEqual(Array.from(laborHistory(actor("staffA")).data.incidencias,r=>r.incidenciaId),["INC-A"]);
assert.deepEqual(Array.from(laborHistory(actor("staffB")).data.incidencias,r=>r.incidenciaId),["INC-B"]);
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.incidencias,r=>r.incidenciaId),["INC-A","INC-B"]);
assert.deepEqual(Array.from(laborHistory(actor("staffA")).data.medidasDisciplinarias,r=>r.medidaId),["MED-A"]);
assert.equal(laborHistory({sessionToken:"employee",userRole:"Administrador",empleadoId:"U-B"}).code,"ROLE_NOT_ALLOWED");
assert.equal(laborHistory({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(laborHistory({sessionToken:"staffA",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(laborHistory({sessionToken:"staffA",incidenciaId:"INC-B"}).code,"RESOURCE_NOT_FOUND");
assert.deepEqual(Array.from(laborHistory({sessionToken:"staffA",categoria:"seguridad"}).data.incidencias,r=>r.incidenciaId),["INC-A"]);
assert.deepEqual(Array.from(laborHistory({sessionToken:"staffA",categoria:"seguridad"}).data.medidasDisciplinarias,r=>r.medidaId),["MED-A"],"category filters must not accidentally suppress measures for authorized employees");
assert.deepEqual(Array.from(laborHistory({sessionToken:"staffA",incidenciaId:"INC-A"}).data.medidasDisciplinarias,r=>r.medidaId),["MED-A"]);
const origInc=rows.IncidenciasLaborales.map(r=>r.slice());rows.IncidenciasLaborales.push(rows.IncidenciasLaborales[1].slice());
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.incidencias,r=>r.incidenciaId),["INC-B"]);
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.medidasDisciplinarias,r=>r.medidaId),["MED-B"]);
rows.IncidenciasLaborales.splice(0,rows.IncidenciasLaborales.length,...origInc);
const origMed=rows.MedidasDisciplinarias.map(r=>r.slice());rows.MedidasDisciplinarias.push(rows.MedidasDisciplinarias[1].slice());
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.medidasDisciplinarias,r=>r.medidaId),["MED-B"]);
rows.MedidasDisciplinarias.splice(0,rows.MedidasDisciplinarias.length,...origMed);
const origLaborEmployees=rows.ExpedientesLaborales.map(r=>r.slice());
const ambiguousLaborEmployee=rows.ExpedientesLaborales[1].slice();ambiguousLaborEmployee[0]="EXP-EMP-AMBIGUOUS";ambiguousLaborEmployee[2]="U-EMP";rows.ExpedientesLaborales.push(ambiguousLaborEmployee);
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.incidencias,r=>r.incidenciaId),["INC-B"],"ambiguous employee-to-expediente mappings must exclude their labor history");
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.medidasDisciplinarias,r=>r.medidaId),["MED-B"],"ambiguous employee mappings must also exclude disciplinary measures");
rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...origLaborEmployees);
rows.MedidasDisciplinarias.push(["MED-ORPHAN","INC-UNKNOWN","U-EMP","Amonestación","Fundamento","","","Aprobada",0,"","","",""]);
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.medidasDisciplinarias,r=>r.medidaId),["MED-A","MED-B"],"measures linked to missing incidents must be excluded");
rows.MedidasDisciplinarias.pop();
const origHeader=rows.IncidenciasLaborales[0][0];rows.IncidenciasLaborales[0][0]="Incidente";
assert.equal(laborHistory(actor("admin")).code,"RESOURCE_SCHEMA_INVALID");rows.IncidenciasLaborales[0][0]=origHeader;
const origOpen=context.SpreadsheetApp.openById,origCreate=context.getOrCreateSheet;let creations=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:n=>n==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});
context.getOrCreateSheet=()=>{creations++;throw Error("read must not create sheets");};
assert.deepEqual(Array.from(laborHistory(actor("admin")).data.incidencias),[]);assert.equal(creations,0);
context.SpreadsheetApp.openById=origOpen;context.getOrCreateSheet=origCreate;
assert.ok(extractFunction(accounting,"getLaborIncidentsHistory").includes("assertEmployeeExpedienteScopeAccess_"));
assert.ok(!extractFunction(accounting,"getLaborIncidentsHistory").includes("getOrCreateSheet"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getLaborIncidentsHistory"'));

const shiftHistory=context.getWorkShiftsAndSubstitutionsHistory;
assert.deepEqual(Array.from(shiftHistory(actor("staffA")).data.turnos,r=>r.asignacionTurnoId),["TUR-A"]);assert.deepEqual(Array.from(shiftHistory(actor("staffB")).data.turnos,r=>r.asignacionTurnoId),["TUR-B"]);assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.turnos,r=>r.asignacionTurnoId),["TUR-A","TUR-B"]);
assert.deepEqual(Array.from(shiftHistory(actor("staffA")).data.sustituciones,r=>r.sustitucionId),["SUST-A"]);assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.sustituciones,r=>r.sustitucionId),["SUST-A","SUST-CROSS"]);
assert.deepEqual(Array.from(shiftHistory(actor("staffA")).data.horasExtras,r=>r.solicitudId),["OT-A"]);assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.horasExtras,r=>r.solicitudId),["OT-A","OT-B"]);
assert.equal(shiftHistory({sessionToken:"employee",userRole:"Administrador",empleadoId:"U-B"}).code,"ROLE_NOT_ALLOWED");assert.equal(shiftHistory({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED");assert.equal(shiftHistory({sessionToken:"staffA",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND");
assert.deepEqual(Array.from(shiftHistory({sessionToken:"staffA",departamentoArea:"DEP-A"}).data.turnos,r=>r.asignacionTurnoId),["TUR-A"]);
const oldT=rows.AsignacionesTurnosLaborales.map(r=>r.slice());rows.AsignacionesTurnosLaborales.push(rows.AsignacionesTurnosLaborales[1].slice());assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.turnos,r=>r.asignacionTurnoId),["TUR-B"]);rows.AsignacionesTurnosLaborales.splice(0,rows.AsignacionesTurnosLaborales.length,...oldT);
const oldE=rows.ExpedientesLaborales.map(r=>r.slice()),amb=rows.ExpedientesLaborales[1].slice();amb[0]="EXP-AMB-SHIFT";amb[2]="U-EMP";rows.ExpedientesLaborales.push(amb);assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.turnos,r=>r.asignacionTurnoId),["TUR-B"]);assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.horasExtras,r=>r.solicitudId),["OT-B"]);assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.sustituciones,r=>r.sustitucionId),[]);rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...oldE);
const oldS=rows.SustitucionesPersonal.map(r=>r.slice());rows.SustitucionesPersonal.push(rows.SustitucionesPersonal[1].slice());assert.deepEqual(Array.from(shiftHistory(actor("admin")).data.sustituciones,r=>r.sustitucionId),["SUST-CROSS"]);rows.SustitucionesPersonal.splice(0,rows.SustitucionesPersonal.length,...oldS);
const oldH=rows.SolicitudesHorasExtras[0][0];rows.SolicitudesHorasExtras[0][0]="Solicitud";assert.equal(shiftHistory(actor("admin")).code,"RESOURCE_SCHEMA_INVALID");rows.SolicitudesHorasExtras[0][0]=oldH;
const shiftOpenOriginal=context.SpreadsheetApp.openById,shiftCreateOriginal=context.getOrCreateSheet;let shiftCreations=0;context.SpreadsheetApp.openById=()=>({getSheetByName:n=>n==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});context.getOrCreateSheet=()=>{shiftCreations++;throw Error("history reads must not create sheets");};assert.deepEqual(JSON.parse(JSON.stringify(shiftHistory(actor("admin")).data)),{turnos:[],sustituciones:[],horasExtras:[],totalTurnos:0,totalSustituciones:0,totalHorasExtras:0});assert.equal(shiftCreations,0);context.SpreadsheetApp.openById=shiftOpenOriginal;context.getOrCreateSheet=shiftCreateOriginal;
assert.ok(extractFunction(accounting,"getWorkShiftsAndSubstitutionsHistory").includes("assertEmployeeExpedienteScopeAccess_"));assert.ok(!extractFunction(accounting,"getWorkShiftsAndSubstitutionsHistory").includes("getOrCreateSheet"));assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getWorkShiftsAndSubstitutionsHistory"'));

const payroll=context.getStaffPayrollReceipt;
assert.deepEqual(Array.from(payroll(actor("staffA")).boletas,r=>r.planillaId),["PLN-A"]);
assert.deepEqual(Array.from(payroll(actor("staffB")).boletas,r=>r.planillaId),["PLN-B"]);
assert.deepEqual(Array.from(payroll(actor("admin")).boletas,r=>r.planillaId),["PLN-A","PLN-B"]);
assert.deepEqual(Array.from(payroll({sessionToken:"employee"}).boletas,r=>r.planillaId),["PLN-A"]);
assert.deepEqual(Array.from(payroll({sessionToken:"professor"}).boletas,r=>r.planillaId),["PLN-A"]);
assert.equal(payroll({sessionToken:"professor",empleadoId:"EXP-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(payroll({sessionToken:"staffA",empleadoId:"EXP-B"}).code,"RESOURCE_NOT_FOUND");
assert.deepEqual(Array.from(payroll({sessionToken:"staffA",periodoMes:"2026-02"}).boletas,r=>r.planillaId),["PLN-A"]);
assert.deepEqual(Array.from(payroll({sessionToken:"staffA",boletaId:"BOL-A"}).boletas,r=>r.planillaId),["PLN-A"]);
assert.equal(payroll({sessionToken:"staffA",boletaId:"BOL-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(payroll({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(payroll({sessionToken:"employee",userRole:"Director",authUserId:"U-B",empleadoId:"EXP-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(payroll({sessionToken:"student"}).code,"ROLE_NOT_ALLOWED");
const payrollOriginal=rows.PlanillasNomenclatura.map(r=>r.slice());rows.PlanillasNomenclatura.push(rows.PlanillasNomenclatura[1].slice());assert.deepEqual(Array.from(payroll(actor("admin")).boletas,r=>r.planillaId),["PLN-B"]);rows.PlanillasNomenclatura.splice(0,rows.PlanillasNomenclatura.length,...payrollOriginal);
const boletaOriginal=rows.BoletasPago.map(r=>r.slice());rows.BoletasPago.push(rows.BoletasPago[1].slice());assert.equal(payroll({sessionToken:"staffA",boletaId:"BOL-A"}).code,"RESOURCE_NOT_FOUND");rows.BoletasPago.splice(0,rows.BoletasPago.length,...boletaOriginal);
const payrollEmployeeOriginal=rows.ExpedientesLaborales.map(r=>r.slice()),ambPayroll=rows.ExpedientesLaborales[1].slice();ambPayroll[0]="EXP-PAYROLL-AMB";ambPayroll[2]="U-EMP";rows.ExpedientesLaborales.push(ambPayroll);assert.deepEqual(Array.from(payroll(actor("admin")).boletas,r=>r.planillaId),["PLN-B"]);rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...payrollEmployeeOriginal);
const payrollHeader=rows.PlanillasNomenclatura[0][0];rows.PlanillasNomenclatura[0][0]="Planilla";assert.equal(payroll(actor("admin")).code,"RESOURCE_SCHEMA_INVALID");rows.PlanillasNomenclatura[0][0]=payrollHeader;
const payrollOpen=context.SpreadsheetApp.openById,payrollCreate=context.getOrCreateSheet;let payrollCreations=0;context.SpreadsheetApp.openById=()=>({getSheetByName:n=>n==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});context.getOrCreateSheet=()=>{payrollCreations++;throw Error("payroll reads must not create sheets");};assert.deepEqual(JSON.parse(JSON.stringify(payroll(actor("admin")))),{status:"success",boletas:[]});assert.equal(payrollCreations,0);context.SpreadsheetApp.openById=payrollOpen;context.getOrCreateSheet=payrollCreate;
assert.ok(extractFunction(accounting,"getStaffPayrollReceipt").includes("assertEmployeeExpedienteScopeAccess_"));assert.ok(!extractFunction(accounting,"getStaffPayrollReceipt").includes("getOrCreateSheet"));assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getStaffPayrollReceipt"'));

const loans=context.getEmployeeLoansAdvances, amortization=context.getLoanAmortizationSchedule;
assert.deepEqual(Array.from(loans(actor("hrA")).solicitudes,r=>r.prestamoId),["ADV-A"]);
assert.deepEqual(Array.from(loans(actor("hrB")).solicitudes,r=>r.prestamoId),["ADV-B"]);
assert.deepEqual(Array.from(loans(actor("admin")).solicitudes,r=>r.prestamoId),["ADV-A","ADV-B"]);
assert.deepEqual(Array.from(loans(actor("employee")).solicitudes,r=>r.prestamoId),["ADV-A"]);
assert.deepEqual(Array.from(loans({sessionToken:"employee",empleadoId:"U-EMP",estadoAprobacion:"NoExiste"}).solicitudes),[],"employees with no matching requests retain an empty-list response");
assert.equal(loans({sessionToken:"employee",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND","self-service cannot query another employee");
assert.equal(loans({sessionToken:"hrA",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND","department HR cannot query another department");
assert.equal(loans({sessionToken:"hrA",prestamoId:"ADV-B"}).code,"RESOURCE_NOT_FOUND","loan ID filters cannot bypass department ownership");
assert.deepEqual(Array.from(loans({sessionToken:"hrA",estadoAprobacion:"Aprobado"}).solicitudes,r=>r.prestamoId),["ADV-A"]);
assert.equal(loans({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(loans({sessionToken:"student"}).code,"ROLE_NOT_ALLOWED");
assert.deepEqual(Array.from(amortization({sessionToken:"hrA",prestamoId:"ADV-A"}).tablaAmortizacion,r=>r.saldoRestante),[500,0]);
assert.equal(amortization({sessionToken:"hrA",prestamoId:"ADV-B"}).code,"RESOURCE_NOT_FOUND");
assert.equal(amortization({sessionToken:"invalid",prestamoId:"ADV-A"}).code,"VERIFIED_IDENTITY_REQUIRED");
const loanRowsOriginal=rows.AnticiposPrestamosEmpleado.map(r=>r.slice());rows.AnticiposPrestamosEmpleado.push(rows.AnticiposPrestamosEmpleado[1].slice());
assert.deepEqual(Array.from(loans(actor("admin")).solicitudes,r=>r.prestamoId),["ADV-B"],"duplicate loan IDs must be excluded");
assert.equal(amortization({sessionToken:"admin",prestamoId:"ADV-A"}).code,"RESOURCE_NOT_FOUND","amortization must not resolve an ambiguous loan ID");
rows.AnticiposPrestamosEmpleado.splice(0,rows.AnticiposPrestamosEmpleado.length,...loanRowsOriginal);
const loanEmployeeOriginal=rows.ExpedientesLaborales.map(r=>r.slice()),ambLoanEmployee=rows.ExpedientesLaborales[1].slice();ambLoanEmployee[0]="EXP-LOAN-AMB";ambLoanEmployee[2]="U-EMP";rows.ExpedientesLaborales.push(ambLoanEmployee);
assert.deepEqual(Array.from(loans(actor("admin")).solicitudes,r=>r.prestamoId),["ADV-B"],"ambiguous employee mappings must exclude loan records");
rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...loanEmployeeOriginal);
const loanHeader=rows.AnticiposPrestamosEmpleado[0][0];rows.AnticiposPrestamosEmpleado[0][0]="LoanID";
assert.equal(loans(actor("admin")).code,"RESOURCE_SCHEMA_INVALID");rows.AnticiposPrestamosEmpleado[0][0]=loanHeader;
const loanOpen=context.SpreadsheetApp.openById,loanCreate=context.getOrCreateSheet;let loanCreations=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:n=>n==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});
context.getOrCreateSheet=()=>{loanCreations++;throw Error("loan reads must not create sheets");};
assert.deepEqual(JSON.parse(JSON.stringify(loans(actor("admin")))),{status:"success",solicitudes:[]});assert.equal(loanCreations,0);
context.SpreadsheetApp.openById=loanOpen;context.getOrCreateSheet=loanCreate;
assert.ok(extractFunction(accounting,"getEmployeeLoansAdvances").includes("assertEmployeeExpedienteScopeAccess_"));
assert.ok(!extractFunction(accounting,"getEmployeeLoansAdvances").includes("getOrCreateSheet"));
assert.ok(extractFunction(accounting,"getLoanAmortizationSchedule").includes("getEmployeeLoansAdvances"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getEmployeeLoansAdvances"'));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getLoanAmortizationSchedule"'));


const attendance=context.getStaffAttendanceLogs;
assert.deepEqual(Array.from(attendance(actor("staffA")).asistencias,r=>r.asistenciaId),["AST-A"],"department A must see only attendance rows for employees with verified ownership in department A");
assert.deepEqual(Array.from(attendance(actor("hrB")).asistencias,r=>r.asistenciaId),["AST-B"],"department B HR must see only attendance rows for department B");
assert.deepEqual(Array.from(attendance(actor("admin")).asistencias,r=>r.asistenciaId),["AST-A","AST-B"],"institution-wide attendance access must still require unique employee ownership");
assert.deepEqual(Array.from(attendance(actor("employee")).asistencias,r=>r.asistenciaId),["AST-A"],"employee self-service must use the signed user identity");
assert.equal(attendance({sessionToken:"staffA",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND","department staff cannot query another department's attendance");
assert.equal(attendance({sessionToken:"employee",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND","employee self-service cannot query another employee");
assert.equal(attendance({sessionToken:"employee",authRole:"Administrador",authUserId:"U-B",empleadoId:"U-B"}).code,"RESOURCE_NOT_FOUND","client identity and role fields cannot override signed attendance identity");
assert.equal(attendance({sessionToken:"invalid"}).code,"VERIFIED_IDENTITY_REQUIRED","attendance history requires a valid signed session");
assert.equal(attendance({sessionToken:"student"}).code,"ROLE_NOT_ALLOWED","non-staff roles cannot query employee attendance");
assert.deepEqual(Array.from(attendance({sessionToken:"admin",fechaInicio:"2026-02-06",fechaFin:"2026-02-06"}).asistencias,r=>r.asistenciaId),["AST-B"],"date filters must be inclusive and must not expand access");
assert.equal(attendance({sessionToken:"admin",fechaInicio:"2026-02-07",fechaFin:"2026-02-06"}).code,"INVALID_DATE_RANGE","reversed date ranges must fail closed");
const attendanceRowsOriginal=rows.DeduccionesAsistencia.map(r=>r.slice());
rows.DeduccionesAsistencia.push(rows.DeduccionesAsistencia[1].slice());rows.DeduccionesAsistencia[rows.DeduccionesAsistencia.length-1][2]="U-B";
assert.deepEqual(Array.from(attendance(actor("admin")).asistencias,r=>r.asistenciaId),["AST-B"],"duplicate attendance IDs must be excluded rather than attributed to either employee");
rows.DeduccionesAsistencia.splice(0,rows.DeduccionesAsistencia.length,...attendanceRowsOriginal);
const attendanceEmployeesOriginal=rows.ExpedientesLaborales.map(r=>r.slice()),ambAttendanceEmployee=rows.ExpedientesLaborales[1].slice();
ambAttendanceEmployee[0]="EXP-ATTENDANCE-AMB";ambAttendanceEmployee[2]="U-EMP";rows.ExpedientesLaborales.push(ambAttendanceEmployee);
assert.deepEqual(Array.from(attendance(actor("admin")).asistencias,r=>r.asistenciaId),["AST-B"],"ambiguous UserID-to-expediente mappings must exclude attendance records");
rows.ExpedientesLaborales.splice(0,rows.ExpedientesLaborales.length,...attendanceEmployeesOriginal);
const attendanceHeader=rows.DeduccionesAsistencia[0][0];rows.DeduccionesAsistencia[0][0]="AttendanceID";
assert.equal(attendance(actor("admin")).code,"RESOURCE_SCHEMA_INVALID","attendance schema changes must fail closed");
rows.DeduccionesAsistencia[0][0]=attendanceHeader;
const attendanceOpen=context.SpreadsheetApp.openById,attendanceCreate=context.getOrCreateSheet;let attendanceCreations=0;
context.SpreadsheetApp.openById=()=>({getSheetByName:n=>n==="ExpedientesLaborales"?makeSheet(rows.ExpedientesLaborales):null});
context.getOrCreateSheet=()=>{attendanceCreations++;throw Error("attendance reads must not create sheets");};
assert.deepEqual(JSON.parse(JSON.stringify(attendance(actor("admin")))),{status:"success",asistencias:[]},"a missing attendance sheet must return an empty collection");
assert.equal(attendanceCreations,0,"attendance reads must not create missing sheets");
context.SpreadsheetApp.openById=attendanceOpen;context.getOrCreateSheet=attendanceCreate;
assert.ok(extractFunction(accounting,"getStaffAttendanceLogs").includes("assertEmployeeExpedienteScopeAccess_"));
assert.ok(!extractFunction(accounting,"getStaffAttendanceLogs").includes("getOrCreateSheet"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getStaffAttendanceLogs"'));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"getStaffAttendanceLogs", "getEmployeeLoansAdvances"'),"employees must retain self-service attendance access");


const attendanceShiftTime=rows.AsignacionesTurnosLaborales[1][5];rows.AsignacionesTurnosLaborales[1][5]="23:59";
const attendanceWritesBefore=rows.DeduccionesAsistencia.length;
assert.equal(context.recordStaffCheckIn({sessionToken:"invalid",empleadoId:"U-EMP"}).code,"VERIFIED_IDENTITY_REQUIRED","attendance mutation requires signed identity");
assert.equal(context.recordStaffCheckIn({sessionToken:"student",empleadoId:"U-EMP"}).code,"ROLE_NOT_ALLOWED","non-staff roles cannot register attendance");
assert.equal(context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-B",tipoRegistro:"Entrada"}).code,"RESOURCE_NOT_FOUND","employee cannot register attendance for another user");
assert.equal(rows.DeduccionesAsistencia.length,attendanceWritesBefore,"denied attendance writes must not mutate storage");
const selfEntry=context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",empleadoNombre:"Empleado A",horaEntradaEsperada:"00:01",tipoRegistro:"Entrada"});
assert.equal(selfEntry.status,"success","employee can register own attendance");
assert.equal(rows.DeduccionesAsistencia[rows.DeduccionesAsistencia.length-1][2],"U-EMP","attendance owner must be derived from signed identity");
assert.notEqual(rows.DeduccionesAsistencia[rows.DeduccionesAsistencia.length-1][7],"Tardanza","client-supplied expected time cannot manipulate tardiness; assigned shift is authoritative");
assert.equal(context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",tipoRegistro:"Entrada"}).code,"ATTENDANCE_ALREADY_RECORDED","duplicate entry must not overwrite the original mark");
const exitResult=context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",tipoRegistro:"Salida"});
assert.equal(exitResult.status,"success","employee can register own exit");
assert.equal(rows.DeduccionesAsistencia[rows.DeduccionesAsistencia.length-1][5]!==""||rows.DeduccionesAsistencia.find(r=>r[2]==="U-EMP"&&r[1] instanceof Date&&r[1].toISOString().slice(0,10)===new Date().toISOString().slice(0,10))[5]!=="",true,"exit must update the same attendance row");
assert.equal(context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",tipoRegistro:"Salida"}).code,"ATTENDANCE_ALREADY_RECORDED","duplicate exit must not overwrite the original mark");
const beforeForeign=rows.DeduccionesAsistencia.length;
assert.equal(context.recordStaffCheckIn({sessionToken:"hrB",empleadoId:"U-EMP",tipoRegistro:"Entrada"}).code,"RESOURCE_NOT_FOUND","HR cannot write attendance outside its verified department");
assert.equal(rows.DeduccionesAsistencia.length,beforeForeign,"out-of-scope HR attempts must not mutate storage");
const hrWrite=context.recordStaffCheckIn({sessionToken:"hrA",empleadoId:"U-X",tipoRegistro:"Entrada"});
assert.equal(hrWrite.status,"success","HR with matching department ownership can register attendance for an employee");
const adminWrite=context.recordStaffCheckIn({sessionToken:"admin",empleadoId:"U-B",tipoRegistro:"Entrada"});
assert.equal(adminWrite.status,"success","institution-wide manager can register attendance for an owned employee");
const invalidType=context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",tipoRegistro:"DELETE"});
assert.equal(invalidType.code,"INVALID_ATTENDANCE_TYPE","unsupported attendance mutations must be rejected");
const noScope={sessionToken:"staffA",empleadoId:"U-B"};
assert.equal(context.recordStaffCheckIn(noScope).code,"RESOURCE_NOT_FOUND","department manager cannot write to another department");
const lockOriginal=context.LockService,lockState={held:false},lockSheet=ss.getSheetByName("DeduccionesAsistencia"),appendOriginal=lockSheet.appendRow;
let nestedLockResult=null;
context.LockService={getScriptLock:()=>({waitLock:()=>{if(lockState.held)throw Error("lock busy");lockState.held=true;},releaseLock:()=>{lockState.held=false;}})};
lockSheet.appendRow=row=>{nestedLockResult=context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",tipoRegistro:"Entrada"});appendOriginal(row);};
const concurrencyResult=context.recordStaffCheckIn({sessionToken:"employee",empleadoId:"U-EMP",tipoRegistro:"Entrada"});
assert.equal(concurrencyResult.status,"success");
assert.equal(nestedLockResult.code,"CONCURRENT_UPDATE_RETRY","a concurrent/reentrant write must fail safely while the script lock is held");
lockSheet.appendRow=appendOriginal;context.LockService=lockOriginal;
assert.ok(extractFunction(accounting,"recordStaffCheckIn").includes("assertResourceOwnershipForScope_"));
assert.ok(extractFunction(accounting,"recordStaffCheckIn").includes("getVerifiedAccountingIdentity_"));
assert.ok(extractFunction(accounting,"validateRolePermission").includes('"recordStaffCheckIn"'));
rows.AsignacionesTurnosLaborales[1][5]=attendanceShiftTime;

console.log("Accounting departmental resource and payment voucher access contracts passed.");
