const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}
function makeSheet(rows) { return { getLastRow: () => rows.length, getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }), appendRow: row => rows.push(row.slice()), getRange: () => ({ setValue: () => {} }) }; }
const academic = fs.readFileSync(path.resolve(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
const names = ["getVerifiedAcademicIdentity_","getVerifiedDepartmentScopeForSession_","getVerifiedAcademicDepartmentScope_","getVerifiedAcademicGuardianDepartmentScope_","assertResourceOwnershipForScope_","getStudentPersonIdForUser_","getStudentIdentityForPerson_","assertStudentExpedienteScopeAccess_","assertStudentDocumentScopeAccess_","assertStudentRequestScopeAccess_","resolveAcademicRequestDepartment_","hasActiveTeacherAssignment_","validateAcademicResponsibilityAndScopeAccess","getStudentFile","getStudentDocuments","getSecureDocumentStream","validateEvidenceFileAndPermissions","assertRecordOwnership","getStudentFileSummary","getStudentTimeline","restoreDocumentVersion"];
const code = "var RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();\n" + names.map(n => extractFunction(academic, n)).join("\n");
const claims = {
  staffA:{userId:"U-A",role:"Director"}, staffB:{userId:"U-B",role:"Director"},
  admin:{userId:"U-ADMIN",role:"Administrador"}, teacher:{userId:"U-TEACH",role:"Docente"},
  student:{userId:"U-STUDENT",role:"Estudiante"}, guardian:{userId:"U-GUARDIAN",role:"Tutor"}, invalid:null
};
const rows = {
  AsignacionesAmbitosRoles:[
    ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"],
    ["S-A","U-A","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
    ["S-B","U-B","Director","DEPARTAMENTO",'["DEP-B"]',"Activo","","","","","",""],
    ["S-ADMIN","U-ADMIN","Administrador","INSTITUCION",'["INST-1"]',"Activo","","","","","",""],
    ["S-TEACH","U-TEACH","Docente","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
    ["S-STUDENT","U-STUDENT","Estudiante","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
    ["S-STUDENT-A","U-STUDENT-A","Estudiante","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
    ["S-EXPIRED","U-A","Director","DEPARTAMENTO",'["DEP-OLD"]',"Activo","","","2020-01-01","2021-01-01","",""]
  ],
  ResourceOwnership:[
    ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],
    ["OWN-EXP-A","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-A","DEP-A","ACTIVE","U-ADMIN","",""],
    ["OWN-EXP-B","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-B","DEP-B","ACTIVE","U-ADMIN","",""],
    ["OWN-EXP-S","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-STUDENT","DEP-A","ACTIVE","U-ADMIN","",""]
  ],
  Usuarios:[
    ["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta","FechaCreacion","UltimoAcceso"],
    ["U-STUDENT","","","","","","Estudiante","","","P-STUDENT","Activo","",""],
    ["U-STUDENT-A","","","","","","Estudiante","","","P-A","Activo","",""],
    ["U-GUARDIAN","","","","","","Tutor","","","P-GUARDIAN","Activo","",""],
    ["U-A","","","","","","Director","","","P-A","","",""],
    ["U-B","","","","","","Director","","","P-B","","",""],
    ["U-TEACH","","","","","","Docente","","","P-TEACH","","",""]
  ],
  ExpedientesEstudiantes:[
    ["ExpedienteID","PersonaID","CodigoInstitucional","DepartamentoID"],
    ["EXP-A","P-A","COD-A","DEP-A"],["EXP-B","P-B","COD-B","DEP-B"],["EXP-STUDENT","P-STUDENT","COD-S","DEP-A"]
  ],
  RelacionesEstudianteTutor:[
    ["RelacionID","ExpedienteID","ResponsableID","TipoParentesco","EsRepresentanteLegal","EsContactoEmergencia","EsResponsableFinanciero","AutorizadoPickUp","AccesoPortal","Estado"],
    ["REL-1","EXP-A","RESP-1","Madre","Sí","Sí","Sí","Sí","Sí","Activo"]
  ],
  ResponsablesTutores:[["ResponsableID","PersonaID","Nombres","Apellidos"],["RESP-1","P-GUARDIAN","",""]],
  DocumentosEstudiante:[
    ["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl","FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones"],
    ["DOC-A","EXP-A","","ID","a.pdf","FILE-A","url-a","","","Aprobado","","",""],
    ["DOC-B","EXP-B","","ID","b.pdf","FILE-B","url-b","","","Aprobado","","",""],
    ["DOC-S","EXP-STUDENT","","ID","s.pdf","FILE-S","url-s","","","Aprobado","","",""],
    ["DOC-MISMATCH","EXP-A","SOL-B","ID","x.pdf","FILE-X","url-x","","","Aprobado","","",""]
  ],
  SolicitudesAdmision:[["SolicitudID","FechaSolicitud","AnoLectivo","GradoSolicitado","NombresAspirante","ApellidosAspirante","Identificacion","FechaNacimiento","NombreResponsable","TelefonoContacto","EmailContacto","EstadoSolicitud","CanalIngreso","Observaciones","ExpedienteID"],["SOL-B","","","","","","","","","","","","","","EXP-B"]],
  HistorialVersionesDocumentos:[
    ["VersionID","DocumentoID","NombreArchivo","DriveFileId","DriveUrl","FechaCreacion","ArchivadoPor","MotivoArchivado","FechaArchivado"],
    ["VER-A","DOC-A","old-a.pdf","FILE-A-OLD","url-old-a",new Date("2026-01-01"),"U-A","legacy",""],
    ["VER-B","DOC-B","old-b.pdf","FILE-B-OLD","url-old-b",new Date("2026-01-02"),"U-B","legacy",""],
    ["VER-S","DOC-S","old-s.pdf","FILE-S-OLD","url-old-s",new Date("2026-01-03"),"U-STUDENT","legacy",""]
  ],
  Matriculas:[["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"]],
  MovimientosEstudiante:[["MovimientoID","ExpedienteID","MatriculaID","AnoLectivo","TipoMovimiento","GradoOrigen","SeccionOrigen","GradoDestino","SeccionDestino","FechaEfectiva","Motivo"]],
  CatalogoAsignaturas:[["AsignaturaID","NombreOficial","Codigo","AreaAcademica","CargaHorariaRef","Estado"],["ASIG-A","A","A","AREA-A","","Activo"],["ASIG-B","B","B","AREA-B","","Activo"]],
  AreasCurricularesExtensiones:[["AreaID","NombreArea","Codigo","ServiceKey","ServiceUrl","HerramientasJSON","DepartamentoID","Estado","FechaRegistro"],["AREA-A","Area A","AA","","","","DEP-A","Activo",""],["AREA-B","Area B","AB","","","","DEP-B","Activo",""]],
  AsignacionesDocentes:[["DocenteUserId","AsignaturaID","Grado","Seccion","PeriodoID","Estado"],["U-TEACH","ASIG-A","10","A","2026","Activo"]]
};
const ss={getSheetByName:name=>rows[name]?makeSheet(rows[name]):null};
const context={
  SPREADSHEET_ID:"TEST",
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==="IMA_INSTITUTION_ID"?"INST-1":null})},
  SpreadsheetApp:{openById:()=>ss},
  verifySessionToken:token=>claims[token]||null,
  getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||makeSheet([[]]),
  DriveApp:{getFileById:id=>({isTrashed:()=>false,getName:()=>id,getMimeType:()=>"application/pdf",getDownloadUrl:()=>"download:"+id,getSize:()=>1024})},
  logStructuredEvent:()=>{}
};
vm.runInNewContext(code + "\nthis.assertStudentExpedienteScopeAccess_=assertStudentExpedienteScopeAccess_;this.assertStudentDocumentScopeAccess_=assertStudentDocumentScopeAccess_;this.assertStudentRequestScopeAccess_=assertStudentRequestScopeAccess_;this.validateAcademicResponsibilityAndScopeAccess=validateAcademicResponsibilityAndScopeAccess;this.getStudentFile=getStudentFile;this.getStudentDocuments=getStudentDocuments;this.getSecureDocumentStream=getSecureDocumentStream;this.validateEvidenceFileAndPermissions=validateEvidenceFileAndPermissions;this.assertRecordOwnership=assertRecordOwnership;",context);
const actor=token=>({sessionToken:token});
const expSheet=makeSheet(rows.ExpedientesEstudiantes);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("staffA"),ss,expSheet,rows.ExpedientesEstudiantes[1]).authorized,true);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("staffA"),ss,expSheet,rows.ExpedientesEstudiantes[2]).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("admin"),ss,expSheet,rows.ExpedientesEstudiantes[2]).authorized,true);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("student"),ss,expSheet,rows.ExpedientesEstudiantes[3]).accessType,"SELF");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("student"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).accessType,"GUARDIAN");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[2]).code,"RESOURCE_SCOPE_DENIED");
const guardianOwnership = rows.ResourceOwnership.find(row => row[3] === "EXP-A");
const originalGuardianOwnership = guardianOwnership.slice();
guardianOwnership[1] = "INST-OTHER";
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_OWNERSHIP_UNVERIFIED","guardian access must not cross institutions");
guardianOwnership.splice(0,guardianOwnership.length,...originalGuardianOwnership);
guardianOwnership[5] = "INACTIVE";
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_OWNERSHIP_UNVERIFIED","guardian access must require active resource ownership");
guardianOwnership.splice(0,guardianOwnership.length,...originalGuardianOwnership);
guardianOwnership[4] = "";
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_DEPARTMENT_UNRESOLVED","guardian access must fail closed when department ownership is unresolved");
guardianOwnership.splice(0,guardianOwnership.length,...originalGuardianOwnership);
rows.ResourceOwnership.push(["OWN-EXP-A-DUP","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-A","DEP-A","ACTIVE","U-ADMIN","",""]);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_OWNERSHIP_AMBIGUOUS","guardian access must fail closed on duplicate active ownership");
rows.ResourceOwnership.pop();
claims.guardian.membershipId = "MEM-GUARDIAN";
claims.guardian.institutionId = "INST-OTHER";
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"ROLE_MEMBERSHIP_INSTITUTION_MISMATCH","guardian session membership must match the current institution");
delete claims.guardian.membershipId;
delete claims.guardian.institutionId;
assert.equal(context.assertStudentExpedienteScopeAccess_({sessionToken:"invalid"},ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"VERIFIED_IDENTITY_REQUIRED");
const noDept=makeSheet([["ExpedienteID","PersonaID"],["EXP-X","P-X"]]);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("staffA"),ss,noDept,["EXP-X","P-X"]).code,"RESOURCE_OWNERSHIP_UNVERIFIED");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("admin"),ss,noDept,["EXP-X","P-X"]).code,"RESOURCE_OWNERSHIP_UNVERIFIED");
rows.ResourceOwnership.push(["OWN-EXP-X","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-X","DEP-A","ACTIVE","U-ADMIN","",""]);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("staffA"),ss,noDept,["EXP-X","P-X"]).authorized,true,"registry ownership must work without legacy DepartmentID");
rows.ResourceOwnership.push(["OWN-EXP-BLANK","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-BLANK","","ACTIVE","U-ADMIN","",""]);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("admin"),ss,noDept,["EXP-BLANK","P-X"]).code,"RESOURCE_DEPARTMENT_UNRESOLVED");
assert.equal(context.assertStudentDocumentScopeAccess_(actor("staffA"),ss,makeSheet(rows.DocumentosEstudiante),rows.DocumentosEstudiante[1],expSheet).authorized,true);
assert.equal(context.assertStudentDocumentScopeAccess_(actor("staffA"),ss,makeSheet(rows.DocumentosEstudiante),rows.DocumentosEstudiante[2],expSheet).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertStudentDocumentScopeAccess_(actor("staffA"),ss,makeSheet(rows.DocumentosEstudiante),rows.DocumentosEstudiante[4],expSheet).code,"RESOURCE_OWNER_UNRESOLVED");
assert.equal(context.assertStudentRequestScopeAccess_(actor("staffA"),ss,"EXP-A","SOL-B").code,"RESOURCE_OWNER_UNRESOLVED");
assert.ok(extractFunction(academic,"assertStudentExpedienteScopeAccess_").includes("assertResourceOwnershipForScope_"));
assert.ok(extractFunction(academic,"assertStudentDocumentScopeAccess_").includes("assertResourceOwnershipForScope_"));
const ownFile=context.getStudentFile({sessionToken:"student",userId:"P-B"});
assert.equal(ownFile.status,"success"); assert.equal(ownFile.studentFile.expedienteId,"EXP-STUDENT");
assert.equal(context.getStudentFile({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.getStudentFile({sessionToken:"admin",expedienteId:"EXP-B"}).status,"success");
assert.deepEqual(Array.from(context.getStudentDocuments(actor("staffA")).documents,d=>d.documentoId),["DOC-A","DOC-S"]);
assert.equal(context.getStudentDocuments({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.deepEqual(Array.from(context.getStudentDocuments(actor("student")).documents,d=>d.documentoId),["DOC-S"]);
assert.deepEqual(Array.from(context.getStudentDocuments(actor("admin")).documents,d=>d.documentoId),["DOC-A","DOC-B","DOC-S"]);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"staffA",asignaturaId:"ASIG-A"}).authorized,true);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"staffA",asignaturaId:"ASIG-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"teacher",asignaturaId:"ASIG-A",grado:"10",seccion:"A",periodoId:"2026"}).authorized,true);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"teacher",userId:"U-ADMIN",role:"Administrador",asignaturaId:"ASIG-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"student",estudianteId:"U-STUDENT"}).authorized,true);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"student",estudianteId:"U-B"}).authorized,false);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"guardian",estudianteId:"U-A"}).authorized,true);

assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"staffA",estudianteId:"U-A"}).authorized,true);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"staffA",estudianteId:"U-B"}).authorized,false);
assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"admin"}).authorized,true);

assert.equal(context.validateAcademicResponsibilityAndScopeAccess({sessionToken:"invalid",userId:"U-ADMIN",role:"Administrador"}).authorized,false);
for(const [fn,needle] of [["uploadStudentDocument","assertStudentRequestScopeAccess_"],["updateDocumentStatus","assertStudentDocumentScopeAccess_"],["grantDocumentExemption","assertStudentRequestScopeAccess_"],["getPendingDocumentsReport","assertStudentRequestScopeAccess_"]]) assert.ok(extractFunction(academic,fn).includes(needle),fn+" must enforce scope");

assert.equal(context.assertRecordOwnership("Director","U-A","U-B","DOCUMENT").authorized,false);
assert.equal(context.assertRecordOwnership("Estudiante","U-STUDENT","U-STUDENT","DOCUMENT").authorized,true);
assert.equal(context.getSecureDocumentStream({sessionToken:"staffA",fileId:"FILE-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.getSecureDocumentStream({sessionToken:"staffA",fileId:"FILE-A"}).status,"success");
assert.equal(context.validateEvidenceFileAndPermissions({sessionToken:"staffA",fileId:"FILE-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.validateEvidenceFileAndPermissions({sessionToken:"staffA",fileId:"FILE-A"}).status,"success");
assert.ok(extractFunction(academic,"getStudentFileSummary").includes("getVerifiedAcademicIdentity_"));
assert.ok(extractFunction(academic,"getStudentTimeline").includes("getVerifiedAcademicIdentity_"));

const historyBeforeRestore = rows.HistorialVersionesDocumentos.length;
const mismatchedVersion = context.restoreDocumentVersion({sessionToken:"staffA",documentoId:"DOC-B",versionId:"VER-A"});
assert.equal(mismatchedVersion.code,"RESOURCE_NOT_FOUND","a version must belong to the requested document");
assert.equal(rows.HistorialVersionesDocumentos.length,historyBeforeRestore,"mismatched versions must not mutate history");
const crossDepartmentRestore = context.restoreDocumentVersion({sessionToken:"staffA",documentoId:"DOC-B",versionId:"VER-B"});
assert.equal(crossDepartmentRestore.code,"RESOURCE_NOT_FOUND","cross-department restore must not disclose document existence");
assert.equal(rows.HistorialVersionesDocumentos.length,historyBeforeRestore,"denied restore must not mutate history");
const studentRestore = context.restoreDocumentVersion({sessionToken:"student",documentoId:"DOC-S",versionId:"VER-S"});
assert.equal(studentRestore.code,"RESOURCE_NOT_FOUND","self-service access does not authorize or disclose document restoration");
assert.equal(rows.HistorialVersionesDocumentos.length,historyBeforeRestore,"student restore must not mutate history");
const allowedRestore = context.restoreDocumentVersion({sessionToken:"staffA",documentoId:"DOC-A",versionId:"VER-A"});
assert.equal(allowedRestore.status,"success","authorized department staff may restore an in-scope version");
assert.equal(rows.HistorialVersionesDocumentos.length,historyBeforeRestore+1,"authorized restore must archive the current version");
assert.ok(extractFunction(academic,"restoreDocumentVersion").includes("assertStudentDocumentScopeAccess_"));
assert.ok(extractFunction(academic,"restoreDocumentVersion").includes("getVerifiedAcademicIdentity_"));
console.log("Academic departmental resource access contracts passed.");
