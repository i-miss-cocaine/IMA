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
function makeSheet(rows) { return {
  getLastRow: () => rows.length,
  getLastColumn: () => Math.max(1,...rows.map(r=>r.length)),
  getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
  appendRow: row => rows.push(row.slice()),
  insertRowBefore: index => rows.splice(index-1,0,[]),
  getRange: (row,column,rowCount,columnCount) => ({
    getValues:()=>Array.from({length:rowCount||1},(_,ri)=>Array.from({length:columnCount||1},(_,ci)=>(rows[row-1+ri]||[])[column-1+ci]||"")),
    setValue: value => {while(rows.length<row)rows.push([]);while(rows[row-1].length<column)rows[row-1].push("");rows[row-1][column-1]=value;},
    setValues: values => {for(let ri=0;ri<(rowCount||1);ri++){while(rows.length<row+ri)rows.push([]);rows[row-1+ri].splice(column-1,columnCount||1,...values[ri]);}}
  })
}; }
const academic = fs.readFileSync(path.resolve(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
const names = ["getRequestSessionToken_","getVerifiedRequestSessionClaims_","getVerifiedAcademicIdentity_","getVerifiedDepartmentScopeForSession_","getVerifiedAcademicDepartmentScope_","getAcademicDelegatedMembershipForScope_","resolveInternalResponsibilityForRoleScope_","getVerifiedAcademicGuardianDepartmentScope_","assertResourceOwnershipForScope_","getStudentPersonIdForUser_","getStudentIdentityForPerson_","assertStudentExpedienteScopeAccess_","assertStudentDocumentScopeAccess_","assertStudentRequestScopeAccess_","resolveAcademicRequestDepartment_","hasActiveTeacherAssignment_","validateAcademicResponsibilityAndScopeAccess","getStudentFile","ensureStudentDocumentSchema_","ensureDocumentVersionHistorySchema_","getStudentDocumentFile_","getPrivateStudentDocumentFile_","getStudentDocumentFile","getStudentDocuments","sanitizeStudentPhotoUrl_","validateFileBinaryIntegrity","classifyPdfDocumentPages_","validateEvidenceFileAndPermissions","assertRecordOwnership","getStudentFileSummary","getStudentTimeline","restoreDocumentVersion"];
const code = "var RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();\n" + names.map(n => extractFunction(academic, n)).join("\n");
const claims = {
  staffA:{userId:"U-A",role:"Director"}, staffB:{userId:"U-B",role:"Director"},
  admin:{userId:"U-ADMIN",role:"Administrador"}, auditor:{userId:"U-AUDITOR",role:"Auditor"}, teacher:{userId:"U-TEACH",role:"Docente"},
  student:{userId:"U-STUDENT",role:"Estudiante"}, guardian:{userId:"U-GUARDIAN",role:"Tutor"}, invalid:null
};
const rows = {
  AsignacionesAmbitosRoles:[
    ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"],
    ["S-A","U-A","Director","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","",""],
    ["S-B","U-B","Director","DEPARTAMENTO",'["DEP-B"]',"Activo","","","","","",""],
    ["S-ADMIN","U-ADMIN","Administrador","INSTITUCION",'["INST-1"]',"Activo","","","","","",""],
    ["S-AUDITOR","U-AUDITOR","Auditor","INSTITUCION",'["INST-1"]',"Activo","","","","","",""],
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
    ["U-A","","","","","","Director","","","P-DIRECTOR-A","","",""],
    ["U-B","","","","","","Director","","","P-DIRECTOR-B","","",""],
    ["U-TEACH","","","","","","Docente","","","P-TEACH","","",""]
  ],
  ExpedientesEstudiantes:[
    ["ExpedienteID","PersonaID","CodigoInstitucional","DepartamentoID","Nacionalidad","DireccionResidencia","FotografiaURL"],
    ["EXP-A","P-A","COD-A","DEP-A","HN","City","https://drive.google.com/file/d/PHOTO-A/view"],
    ["EXP-B","P-B","COD-B","DEP-B","HN","City","https://drive.google.com/file/d/PHOTO-B/view"],
    ["EXP-STUDENT","P-STUDENT","COD-S","DEP-A","HN","City","https://cdn.example.test/photo.png"]
  ],
  RelacionesEstudianteTutor:[
    ["RelacionID","ExpedienteID","ResponsableID","TipoParentesco","EsRepresentanteLegal","EsContactoEmergencia","EsResponsableFinanciero","AutorizadoPickUp","AccesoPortal","Estado"],
    ["REL-1","EXP-A","RESP-1","Madre","Sí","Sí","Sí","Sí","Sí","Activo"]
  ],
  RelacionesFamiliares:[
    ["RelacionID","ExpedienteID","ResponsableID","TipoParentesco","Estado","FechaInicio","FechaFin","VerificadaPor","PermisosJSON"],
    ["REL-PRIMARY-1","EXP-A","U-GUARDIAN","Madre","Verificada","2020-01-01","2099-12-31","","{\"permisoAcademico\":true,\"permisoDocumental\":true}"]
  ],
  ResponsablesTutores:[["ResponsableID","PersonaID","Nombres","Apellidos"],["RESP-1","P-GUARDIAN","",""]],
  DocumentosEstudiante:[
    ["DocumentoID","ExpedienteID","SolicitudID","TipoDocumento","NombreArchivo","DriveFileId","DriveUrl","FechaRecepcion","FechaVencimiento","EstadoRevision","SubidoPor","ValidadoPor","Observaciones","VersionDocumento","SHA256"],
    ["DOC-A","EXP-A","","ID","a.pdf","FILE-A","url-a","","","Aprobado","","","","1.1","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ["DOC-B","EXP-B","","ID","b.pdf","FILE-B","url-b","","","Aprobado","","","","1.0","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ["DOC-B2","EXP-B","","ID","b2.pdf","FILE-B2","url-b2","","","Aprobado","","","","1.0","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ["DOC-S","EXP-STUDENT","","ID","s.pdf","FILE-S","url-s","","","Aprobado","","","","1.0","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ["DOC-MISMATCH","EXP-A","SOL-B","ID","x.pdf","FILE-X","url-x","","","Aprobado","","","","1.0","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]
  ],
  SolicitudesAdmision:[["SolicitudID","FechaSolicitud","AnoLectivo","GradoSolicitado","NombresAspirante","ApellidosAspirante","Identificacion","FechaNacimiento","NombreResponsable","TelefonoContacto","EmailContacto","EstadoSolicitud","CanalIngreso","Observaciones","ExpedienteID"],["SOL-B","","","","","","","","","","","","","","EXP-B"]],
  HistorialVersionesDocumentos:[
    ["VersionID","DocumentoID","NombreArchivo","DriveFileId","DriveUrl","FechaCreacion","ArchivadoPor","MotivoArchivado","FechaArchivado","VersionDocumento","SHA256"],
    ["VER-A","DOC-A","old-a.pdf","FILE-A-OLD","url-old-a",new Date("2026-01-01"),"U-A","legacy","","1.0","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["VER-B","DOC-B","old-b.pdf","FILE-B-OLD","url-old-b",new Date("2026-01-02"),"U-B","legacy","","1.0","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["VER-S","DOC-S","old-s.pdf","FILE-S-OLD","url-old-s",new Date("2026-01-03"),"U-STUDENT","legacy","","1.0","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
  ],
  Matriculas:[["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"]],
  MovimientosEstudiante:[["MovimientoID","ExpedienteID","MatriculaID","AnoLectivo","TipoMovimiento","GradoOrigen","SeccionOrigen","GradoDestino","SeccionDestino","FechaEfectiva","Motivo"]],
  CatalogoAsignaturas:[["AsignaturaID","NombreOficial","Codigo","AreaAcademica","CargaHorariaRef","Estado"],["ASIG-A","A","A","AREA-A","","Activo"],["ASIG-B","B","B","AREA-B","","Activo"]],
  AreasCurricularesExtensiones:[["AreaID","NombreArea","Codigo","ServiceKey","ServiceUrl","HerramientasJSON","DepartamentoID","Estado","FechaRegistro"],["AREA-A","Area A","AA","","","","DEP-A","Activo",""],["AREA-B","Area B","AB","","","","DEP-B","Activo",""]],
  AsignacionesDocentes:[["DocenteUserId","AsignaturaID","Grado","Seccion","PeriodoID","Estado"],["U-TEACH","ASIG-A","10","A","2026","Activo"]]
};
const ss={getSheetByName:name=>rows[name]?makeSheet(rows[name]):null};
const validPdfBytes=Array.from(Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nstartxref\n10\n%%EOF\n","utf8"));
const context={
  SPREADSHEET_ID:"TEST",
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==="IMA_INSTITUTION_ID"?"INST-1":null})},
  SpreadsheetApp:{openById:()=>ss},
  verifySessionToken:token=>claims[token]||null,
  validateRolePermission:()=>({authorized:true}),
  getOrCreateSheet:(spreadsheet,name)=>spreadsheet.getSheetByName(name)||makeSheet([[]]),
  DriveApp:{getFileById:id=>({isTrashed:()=>false,getName:()=>id+".pdf",getMimeType:()=>"application/pdf",getDownloadUrl:()=>"download:"+id,getSize:()=>validPdfBytes.length,getBlob:()=>({getBytes:()=>validPdfBytes})})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  Utilities:{getUuid:()=>"test-version-id",base64Encode:bytes=>Buffer.from(bytes).toString("base64"),base64Decode:value=>Array.from(Buffer.from(value,"base64"))},
  logStructuredEvent:()=>{}
};
vm.runInNewContext(code + "\nthis.assertStudentExpedienteScopeAccess_=assertStudentExpedienteScopeAccess_;this.assertStudentDocumentScopeAccess_=assertStudentDocumentScopeAccess_;this.assertStudentRequestScopeAccess_=assertStudentRequestScopeAccess_;this.validateAcademicResponsibilityAndScopeAccess=validateAcademicResponsibilityAndScopeAccess;this.getStudentFile=getStudentFile;this.getStudentDocumentFile=getStudentDocumentFile;this.getStudentDocuments=getStudentDocuments;this.validateEvidenceFileAndPermissions=validateEvidenceFileAndPermissions;this.assertRecordOwnership=assertRecordOwnership;",context);
const originalDocumentScopeCheck=context.assertStudentDocumentScopeAccess_;
context.documentScopeAssertionCalls=0;
context.assertStudentDocumentScopeAccess_=function(){context.documentScopeAssertionCalls++;return originalDocumentScopeCheck.apply(context,arguments);};
const actor=token=>({sessionToken:token});
const expSheet=makeSheet(rows.ExpedientesEstudiantes);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("staffA"),ss,expSheet,rows.ExpedientesEstudiantes[1]).authorized,true);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("staffA"),ss,expSheet,rows.ExpedientesEstudiantes[2]).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("admin"),ss,expSheet,rows.ExpedientesEstudiantes[2]).authorized,true);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("student"),ss,expSheet,rows.ExpedientesEstudiantes[3]).accessType,"SELF");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("student"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).accessType,"GUARDIAN");
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[2]).code,"RESOURCE_SCOPE_DENIED");
rows.RelacionesFamiliares.push(["REL-PRIMARY-1","EXP-B","U-GUARDIAN","Madre","Verificada","2020-01-01","2099-12-31","","{\"permisoAcademico\":true}"]);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_SCOPE_DENIED","guardian access must fail closed when a primary relationship ID is duplicated");
rows.RelacionesFamiliares.pop();
const primaryRelations = rows.RelacionesFamiliares.splice(1);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"RESOURCE_SCOPE_DENIED","legacy links cannot authorize access without a primary domain grant");
rows.RelacionesFamiliares.push(...primaryRelations);
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

const legacyScopeRows = rows.AsignacionesAmbitosRoles;
rows.AsignacionesAmbitosRoles = [
  ["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID","InstitutionID","MembershipID","ResponsibilityID"],
  ["S-STUDENT-MEM","U-STUDENT-A","Estudiante","DEPARTAMENTO",'["DEP-A"]',"Activo","","","","","","","INST-1","MEM-STUDENT-A","RESP-STUDENT-A"]
];
rows.MembresiasRolesRBAC = [
  ["MembershipID","UserID","RoleID","InstitutionID","Status","StartAt","EndAt","CreatedBy","CreatedAt","UpdatedAt","RevokedBy","RevokedAt"],
  ["MEM-STUDENT-A","U-STUDENT-A","Estudiante","INST-1","ACTIVE","","","","","","",""]
];
rows.MatrizPermisosRoles = [["RoleID"],["Estudiante"]];
rows.CatalogoRolesInternos = [
  ["RolInternoID","CodigoInterno","NombreResponsabilidad","Descripcion","Departamento","AreaAcademica","TipoResponsabilidad","VigenciaMeses","PermiteSuplencia","Estado","CreadoPor","FechaCreacion","FechaActualizacion"],
  ["RESP-STUDENT-A","","Estudiante","","","","","","","ACTIVO","","",""]
];
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).accessType,"GUARDIAN","guardian delegation must resolve the linked student's active RBAC membership and department assignment");
rows.MembresiasRolesRBAC[1][4] = "REVOKED";
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"ROLE_MEMBERSHIP_NOT_ACTIVE","guardian access must not use a revoked linked-student membership");
rows.MembresiasRolesRBAC[1][4] = "ACTIVE";
rows.MembresiasRolesRBAC.push(["MEM-STUDENT-A-2","U-STUDENT-A","Estudiante","INST-1","ACTIVE","","","","","","",""]);
assert.equal(context.assertStudentExpedienteScopeAccess_(actor("guardian"),ss,expSheet,rows.ExpedientesEstudiantes[1]).code,"ROLE_MEMBERSHIP_AMBIGUOUS","guardian access must fail closed when linked-student role membership is ambiguous");
rows.AsignacionesAmbitosRoles = legacyScopeRows;
delete rows.MembresiasRolesRBAC;
delete rows.MatrizPermisosRoles;
delete rows.CatalogoRolesInternos;
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
assert.equal(context.assertStudentDocumentScopeAccess_(actor("staffA"),ss,makeSheet(rows.DocumentosEstudiante),rows.DocumentosEstudiante[5],expSheet).code,"RESOURCE_OWNER_UNRESOLVED");
assert.equal(context.assertStudentRequestScopeAccess_(actor("staffA"),ss,"EXP-A","SOL-B").code,"RESOURCE_OWNER_UNRESOLVED");
assert.ok(extractFunction(academic,"assertStudentExpedienteScopeAccess_").includes("assertResourceOwnershipForScope_"));
assert.ok(extractFunction(academic,"assertStudentDocumentScopeAccess_").includes("assertResourceOwnershipForScope_"));
const ownFile=context.getStudentFile({sessionToken:"student",userId:"P-B"});
assert.equal(ownFile.status,"success"); assert.equal(ownFile.studentFile.expedienteId,"EXP-STUDENT");
assert.equal("driveUrl" in ownFile.studentFile.documents[0],false,"student file summaries must not expose permanent Drive URLs");
assert.equal(context.getStudentFile({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.equal(context.getStudentFile({sessionToken:"admin",expedienteId:"EXP-B"}).status,"success");
assert.equal(context.getStudentDocuments(actor("staffA")).code,"RESOURCE_SCOPE_DENIED","document queries without a target expediente/application are rejected");
assert.deepEqual(Array.from(context.getStudentDocuments({sessionToken:"staffA",expedienteId:"EXP-STUDENT"}).documents,d=>d.documentoId),["DOC-S"]);
assert.equal(context.getStudentDocuments({sessionToken:"staffA",expedienteId:"EXP-B"}).code,"RESOURCE_SCOPE_DENIED");
assert.deepEqual(Array.from(context.getStudentDocuments({sessionToken:"student",expedienteId:"EXP-STUDENT"}).documents,d=>d.documentoId),["DOC-S"]);
assert.equal(context.getStudentDocuments(actor("admin")).code,"RESOURCE_SCOPE_DENIED","institution-wide scope does not bypass explicit target binding");
context.documentScopeAssertionCalls=0;
const adminDocuments=context.getStudentDocuments({sessionToken:"admin",expedienteId:"EXP-B"});
assert.deepEqual(Array.from(adminDocuments.documents,d=>d.documentoId),["DOC-B","DOC-B2"]);
assert.equal(context.documentScopeAssertionCalls,1,"document listing checks the target once, not once per attachment");
assert.equal(context.getStudentDocuments(actor("auditor")).code,"RESOURCE_SCOPE_DENIED");
assert.deepEqual(Array.from(context.getStudentDocuments({sessionToken:"auditor",expedienteId:"EXP-B"}).documents,d=>d.documentoId),["DOC-B","DOC-B2"]);
assert.equal(context.getStudentFile({sessionToken:"auditor",expedienteId:"EXP-B"}).status,"success",
  "Auditor with institution-wide scope may read metadata without receiving direct Drive URLs");
assert.equal(context.getStudentFile({sessionToken:"auditor",expedienteId:"EXP-B"}).studentFile.fotografiaUrl,"",
  "Google Drive profile-photo URLs are not exposed in student metadata");
assert.equal(context.getStudentFile({sessionToken:"student",expedienteId:"EXP-STUDENT"}).studentFile.fotografiaUrl,
  "https://cdn.example.test/photo.png","non-Drive external profile images remain compatible");
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
assert.equal(context.getStudentDocumentFile({sessionToken:"staffA",documentoId:"DOC-B"}).code,"RESOURCE_NOT_FOUND",
  "the direct document read still enforces the actor's expediente scope");
assert.equal(context.getStudentDocumentFile({sessionToken:"staffA",documentoId:"DOC-A"}).status,"success",
  "a staff member can read a document in the authorized department with one direct request");
assert.throws(()=>context.getStudentDocumentFile({sessionToken:"staffA",fileId:"FILE-A"}),/documentoId requerido/,
  "a Drive file ID alone is not a document reference");
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
