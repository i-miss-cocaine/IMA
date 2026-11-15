"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const source = fs.readFileSync("backend/academic-service/Code.gs", "utf8");
const userSource = fs.readFileSync("backend/user-service/Code.gs", "utf8");
const teacherUi = fs.readFileSync("teacher-dashboard.html", "utf8");
const teacherJs = fs.readFileSync("js/teacher.js", "utf8");

function extractFunction(name, text = source) {
  const start = text.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = text.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}

function extractConst(name, text = source) {
  const start = text.indexOf("const " + name + " =");
  assert.notEqual(start, -1, "missing const " + name);
  let quote = "", escaped = false, brackets = 0, braces = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (escaped) escaped = false; else if (c === "\\\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "[") brackets++;
    else if (c === "]") brackets--;
    else if (c === "{") braces++;
    else if (c === "}") braces--;
    else if (c === ";" && brackets === 0 && braces === 0) return text.slice(start, i + 1);
  }
  throw new Error("unclosed const " + name);
}

const store = Object.create(null);
let lockBusy = false, uuid = 0, driveSharing = "PRIVATE", beforeLock = null;
function sheet(name) {
  if (!store[name]) store[name] = [];
  const rows = store[name];
  function width() { return rows.reduce((m, r) => Math.max(m, r.length), 0); }
  function padded(row) { return Array.from({length:width()},(_,i)=>row[i]===undefined?"":row[i]); }
  return {
    getLastRow(){return rows.length;},
    getLastColumn(){return width();},
    getDataRange(){return {getValues(){return rows.map(padded);}};},
    appendRow(row){rows.push(row.slice());},
    getRange(row,col,numRows,numCols){
      return {
        getValues(){
          const h=numRows||1,w=numCols||1,out=[];
          for(let r=0;r<h;r++){const sourceRow=rows[row-1+r]||[];out.push(Array.from({length:w},(_,c)=>sourceRow[col-1+c]===undefined?"":sourceRow[col-1+c]));}
          return out;
        },
        setValue(value){while(rows.length<row)rows.push([]);while(rows[row-1].length<col)rows[row-1].push("");rows[row-1][col-1]=value;},
        setValues(values){values.forEach((vr,ri)=>{while(rows.length<row+ri)rows.push([]);while(rows[row+ri-1].length<col+vr.length-1)rows[row+ri-1].push("");vr.forEach((v,ci)=>{rows[row+ri-1][col+ci-1]=v;});});}
      };
    }
  };
}
const context = {
  SPREADSHEET_ID:"TEST",
  SpreadsheetApp:{openById(){return {getSheetByName(name){return store[name]?sheet(name):null;},insertSheet(name){store[name]=[];return sheet(name);}};}},
  getOrCreateSheet(_ss,name){return sheet(name);},
  LockService:{getScriptLock(){return {waitLock(){if(lockBusy)throw new Error("LOCK_BUSY");if(beforeLock){const fn=beforeLock;beforeLock=null;fn();}},releaseLock(){}};}},
  Utilities:{
    getUuid(){uuid++;return "00000000-0000-4000-8000-"+String(uuid).padStart(12,"0");},
    computeDigest(_alg,value){return Array.from(crypto.createHash("sha256").update(String(value)).digest()).map(v=>v>127?v-256:v);},
    base64Encode(bytes){return Buffer.from(bytes).toString("base64");},
    DigestAlgorithm:{SHA_256:"SHA_256"},Charset:{UTF_8:"UTF-8"}
  },
  DriveApp:{
    Access:{PRIVATE:"PRIVATE"},
    getFileById(id){
      if(id!=="FILE-1")throw new Error("NOT_FOUND");
      return {isTrashed(){return false;},getSharingAccess(){return driveSharing;},getBlob(){return {getContentType(){return "application/pdf";},getBytes(){return Buffer.from("%PDF-test");}};},getSize(){return 9;},getMimeType(){return "application/pdf";},getName(){return "constancia.pdf";}};
    }
  },
  getVerifiedAcademicIdentity_(payload){return payload && payload.actor || {authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"};},
  logStructuredEvent(){},
  Date,Math,JSON,String,Number,Array,Object,Error,Set
};
vm.createContext(context);
const constants = extractConst("ABSENCE_JUSTIFICATION_HEADERS_") + "\n" + extractConst("TEACHER_JUSTIFICATION_ACK_HEADERS_");
const functions=[
  "ensureAbsenceHeaders_","absenceDateKey_","absenceSheetMap_","getAcademicOfferColumnMap","getAcademicOfferValue",
  "teacherJustificationNormalizeRole_","teacherJustificationHeaderMap_","teacherJustificationActiveState_",
  "teacherJustificationAssignmentAllowsDate_","teacherJustificationEvidencePolicy_","logTeacherJustificationAccessEvent_","auditTeacherJustificationDenied_",
  "resolveTeacherJustificationScope_","teacherJustificationSha256_","getTeacherStudentJustifications",
  "acknowledgeTeacherStudentJustification","getTeacherJustificationEvidence","saveTeacherJustificationEvidencePolicy"
];
vm.runInContext(constants+"\n"+functions.map(name=>extractFunction(name)).join("\n"),context);

const assignments=sheet("AsignacionesDocentes");
assignments.appendRow(["AsignacionID","OfertaID","DocenteUserId","RolDocente","FechaInicio","FechaFin","Estado","AutorizadoPor","Motivo"]);
assignments.appendRow(["ASG-1","OFFER-MATH","TEACHER-1","Titular","2026-01-01","2026-12-31","Activo","ADMIN",""]);
assignments.appendRow(["ASG-2","OFFER-ENG","TEACHER-2","Titular","2026-01-01","2026-12-31","Activo","ADMIN",""]);
assignments.appendRow(["ASG-3","OFFER-OLD","TEACHER-1","Titular","2026-01-01","2026-12-31","Activo","ADMIN",""]);
assignments.appendRow(["ASG-4","OFFER-NO-ENROLL","TEACHER-1","Titular","2026-01-01","2026-12-31","Activo","ADMIN",""]);
const offers=sheet("OfertaAcademica");
offers.appendRow(["OfertaID","AnoID","SedeID","Grado","Seccion","AsignaturaID","PlanID","Modalidad","CapacidadMax","Estado","CodigoClase"]);
offers.appendRow(["OFFER-MATH","2026","","10","A","MAT","PLAN-1","Presencial",30,"Activa",""]);
offers.appendRow(["OFFER-ENG","2026","","10","A","ENG","PLAN-1","Presencial",30,"Activa",""]);
offers.appendRow(["OFFER-OLD","2026","","10","A","SCI","PLAN-1","Presencial",30,"Inactiva",""]);
offers.appendRow(["OFFER-NO-ENROLL","2026","","11","B","BIO","PLAN-1","Presencial",30,"Activa",""]);
const enrollments=sheet("Matriculas");
enrollments.appendRow(["MatriculaID","Fecha","UserId","Alumno","Grado","Seccion","Periodo","Tipo","Estado","BecaDescuento","Observaciones"]);
enrollments.appendRow(["MAT-1",new Date("2026-01-01"),"STUDENT-1","Estudiante Uno","10","A","2026","IngresoNuevo","Confirmada",0,""]);
enrollments.appendRow(["MAT-2",new Date("2026-01-01"),"STUDENT-2","Estudiante Dos","11","B","2026","IngresoNuevo","Confirmada",0,""]);
enrollments.appendRow(["MAT-RETIRED",new Date("2026-01-01"),"STUDENT-4","Estudiante Cuatro","10","A","2026","IngresoNuevo","Retirada",0,""]);
const periods=sheet("PeriodosAcademicos");
periods.appendRow(["PeriodoID","AnoID","Nombre","Tipo","FechaInicio","FechaFin","Orden","Estado"]);
periods.appendRow(["P-2026","2026","I Parcial","Parcial","2026-01-01","2026-12-31",1,"Activo"]);
periods.appendRow(["P-EXPIRED","2026","Período vencido","Parcial","2026-01-01","2026-06-30",2,"Activo"]);
const sessions=sheet("SesionesAsistencia");
sessions.appendRow(["SesionID","Fecha","HoraInicio","HoraFin","Grado","Seccion","AsignaturaID","DocenteUserId","Estado","Observaciones"]);
sessions.appendRow(["SESSION-MATH","2026-11-10","07:00","07:45","10","A","MAT","TEACHER-1","Cerrada",""]);
sessions.appendRow(["SESSION-ENG","2026-11-10","08:00","08:45","10","A","ENG","TEACHER-2","Cerrada",""]);
sessions.appendRow(["SESSION-OLD","2026-11-10","09:00","09:45","10","A","SCI","TEACHER-1","Cerrada",""]);
sessions.appendRow(["SESSION-OTHER-STUDENT","2026-11-10","07:00","07:45","11","B","MAT","TEACHER-1","Cerrada",""]);
sessions.appendRow(["SESSION-EXPIRED-PERIOD","2026-05-15","07:00","07:45","10","A","MAT","TEACHER-1","Cerrada",""]);
sessions.appendRow(["SESSION-NO-ENROLL","2026-11-10","10:00","10:45","11","B","BIO","TEACHER-1","Cerrada",""]);
const attendance=sheet("RegistrosAsistencia");
attendance.appendRow(["RegistroID","SesionID","UserId","EstadoAsistencia","HoraLlegada","MinutosTardanza","Justificado","ObservacionDocente","FechaRegistro","JustificacionID"]);
attendance.appendRow(["REG-1","SESSION-MATH","STUDENT-1","Ausente","","",false,"",new Date("2026-11-10"),"JUST-00000001"]);
attendance.appendRow(["REG-2","SESSION-ENG","STUDENT-1","Ausente","","",false,"",new Date("2026-11-10"),"JUST-00000001"]);
attendance.appendRow(["REG-3","SESSION-OTHER-STUDENT","STUDENT-2","Ausente","","",false,"",new Date("2026-11-10"),""]);
attendance.appendRow(["REG-4","SESSION-NO-ENROLL","STUDENT-3","Ausente","","",false,"",new Date("2026-11-10"),""]);
attendance.appendRow(["REG-5","SESSION-MATH","STUDENT-4","Ausente","","",false,"",new Date("2026-11-10"),""]);
attendance.appendRow(["REG-6","SESSION-EXPIRED-PERIOD","STUDENT-1","Ausente","","",false,"",new Date("2026-05-15"),""]);
const justifications=sheet("JustificacionesAsistencia");
justifications.appendRow(["JustificacionID","UserId","FechaAfectada","Periodo","MotivoDeclarado","AdjuntoUrl","PresentadoPor","EstadoRevision","RevisadoPor","ObservacionesAdmin","FechaResolucion","SolicitudID","SesionIDsJSON","DecisionHistoryJSON","SyncEstado","UltimoError","CreadoPorUserId","ActualizadoEn","ObservacionesPublicas"]);
justifications.appendRow(["JUST-00000001","STUDENT-1","2026-11-10","P-2026","Diagnóstico médico reservado","FILE-1","GUARDIAN-1","Aprobada","SECRETARY-1","PRIVATE INTERNAL NOTE","","JUST-00000001",'["SESSION-MATH","SESSION-ENG","SESSION-OTHER-STUDENT","SESSION-OLD"]',"[]","SINCRONIZADO","", "GUARDIAN-1",new Date(),"Aprobado por Secretaría"]);
justifications.appendRow(["JUST-NO-ENROLL","STUDENT-3","2026-11-10","P-2026","Dato privado","", "GUARDIAN-1","Aprobada","SECRETARY-1","PRIVATE","","JUST-NO-ENROLL",'["SESSION-NO-ENROLL"]',"[]","SINCRONIZADO","", "GUARDIAN-1",new Date(),""]);
justifications.appendRow(["JUST-RETIRED","STUDENT-4","2026-11-10","P-2026","No debe exponer matrícula retirada","", "GUARDIAN-1","Aprobada","SECRETARY-1","PRIVATE","","JUST-RETIRED",'["SESSION-MATH"]',"[]","SINCRONIZADO","", "GUARDIAN-1",new Date(),""]);
justifications.appendRow(["JUST-EXPIRED-PERIOD","STUDENT-1","2026-05-15","P-EXPIRED","No debe exponer período vencido","", "GUARDIAN-1","Aprobada","SECRETARY-1","PRIVATE","","JUST-EXPIRED-PERIOD",'["SESSION-EXPIRED-PERIOD"]',"[]","SINCRONIZADO","", "GUARDIAN-1",new Date(),""]);
const config=sheet("ConfiguracionInstitucional");
config.appendRow(["Parametro","Valor","Estado"]);
config.appendRow(["DOCENTE_VISIBILIDAD_EVIDENCIAS_MEDICAS","SOLO_DICTAMEN_SECRETARIA","Activo"]);

function actor(userId,role){return {authorized:true,userId,role};}
const teacher1={actor:actor("TEACHER-1","Profesor")};
const teacher2={actor:actor("TEACHER-2","Profesor")};
const outsider={actor:actor("TEACHER-3","Profesor")};
let t1=context.getTeacherStudentJustifications(teacher1);
assert.equal(t1.status,"success");
assert.equal(t1.data.length,1,"students without a current enrollment or with expired periods must not be exposed");
assert.equal(t1.data[0].estudianteNombre,"Estudiante Uno");
assert.deepEqual(Array.from(t1.data[0].sesiones.map(x=>x.sesionId)),["SESSION-MATH"]);
assert.equal(t1.data[0].grado,"10");
assert.equal(t1.data[0].seccion,"A");
assert.equal(t1.data[0].estado,"Aprobada");
assert.equal(t1.data[0].observacionesPublicas,"Aprobado por Secretaría");
assert.equal(t1.data[0].evidenciaDisponible,false);
assert.equal("motivoDeclarado" in t1.data[0],false);
assert.equal("observacionesAdmin" in t1.data[0],false);
assert.equal("adjuntoUrl" in t1.data[0],false);
assert.equal("userId" in t1.data[0],false);

const t2=context.getTeacherStudentJustifications(teacher2);
assert.equal(t2.data.length,1);
assert.deepEqual(Array.from(t2.data[0].sesiones.map(x=>x.sesionId)),["SESSION-ENG"]);
assert.equal(context.getTeacherStudentJustifications(outsider).data.length,0);
const deniedRole=context.getTeacherStudentJustifications({actor:actor("STUDENT-1","Estudiante")});
assert.equal(deniedRole.code,"AUTH_PERMISSION_DENIED");
assert.ok(store.RegistroEventos.length>=2,"unauthorized access attempts must be audited");
assert.ok(store.RegistroEventos.some(row=>String(row[3]||"")==="getTeacherStudentJustifications" && String(row[6]||"")==="TEACHER_JUSTIFICATIONS_LISTED" && String(row[8]||"")==="SUCCESS"),"successful teacher reads must be audited");
context.auditTeacherJustificationDenied_("getTeacherStudentJustifications",{justificacionId:"JUST-00000001"},"Estudiante","ROLE_PERMISSION_DENIED");
assert.ok(store.RegistroEventos.length>=3,"dispatcher-level denials must also be audited in RegistroEventos");

lockBusy=true;
const locked=context.acknowledgeTeacherStudentJustification(Object.assign({},teacher1,{justificacionId:"JUST-00000001",sesionIds:["SESSION-MATH"]}));
assert.equal(locked.code,"LOCK_TIMEOUT");
lockBusy=false;
const idorAck=context.acknowledgeTeacherStudentJustification(Object.assign({},outsider,{justificacionId:"JUST-00000001"}));
assert.equal(idorAck.code,"RESOURCE_NOT_FOUND");
beforeLock=()=>assignments.getRange(2,7).setValue("Revocada");
const revokedBetweenCheckAndWrite=context.acknowledgeTeacherStudentJustification(Object.assign({},teacher1,{justificacionId:"JUST-00000001",sesionIds:["SESSION-MATH"]}));
assert.equal(revokedBetweenCheckAndWrite.code,"RESOURCE_NOT_FOUND","assignment revocation between precheck and lock must deny the write");
assert.equal(sheet("ConstanciasConocimientoDocente").getLastRow(),0,"revoked teacher must not create the acknowledgment ledger");
assignments.getRange(2,7).setValue("Activo");
const badSession=context.acknowledgeTeacherStudentJustification(Object.assign({},teacher1,{justificacionId:"JUST-00000001",sesionIds:["SESSION-ENG"]}));
assert.equal(badSession.code,"TEACHER_JUSTIFICATION_SESSION_SCOPE_DENIED");

const ack=context.acknowledgeTeacherStudentJustification(Object.assign({},teacher1,{justificacionId:"JUST-00000001",sesionIds:["SESSION-MATH"]}));
assert.equal(ack.status,"success");
assert.equal(ack.data.created,1);
const conformity = context.acknowledgeTeacherStudentJustification(Object.assign({},teacher2,{justificacionId:"JUST-00000001",sesionIds:["SESSION-ENG"],tipoConstancia:"CONFORMIDAD"}));
assert.equal(conformity.status,"success");
assert.equal(conformity.data.created,1);
assert.equal(context.getTeacherStudentJustifications(teacher2).data[0].sesiones[0].tipoConstancia,"CONFORMIDAD");
assert.equal(justifications.getRange(2,8).getValues()[0][0],"Aprobada","teacher acknowledgment must not alter secretariat decision");
const retry=context.acknowledgeTeacherStudentJustification(Object.assign({},teacher1,{justificacionId:"JUST-00000001",sesionIds:["SESSION-MATH"]}));
assert.equal(retry.status,"success");
assert.equal(retry.data.created,0);
assert.equal(retry.data.alreadyRegistered,1);
t1=context.getTeacherStudentJustifications(teacher1);
assert.equal(t1.data[0].sesiones[0].conocimientoRegistrado,true);

const evidenceRestricted=context.getTeacherJustificationEvidence(Object.assign({},teacher1,{justificacionId:"JUST-00000001"}));
assert.equal(evidenceRestricted.code,"TEACHER_EVIDENCE_POLICY_RESTRICTED");
const deniedPolicy = context.saveTeacherJustificationEvidencePolicy(Object.assign({},teacher1,{valor:"PERMITIR_VER_CONSTANCIA_MEDICA_COMPLETA"}));
assert.equal(deniedPolicy.code,"AUTH_PERMISSION_DENIED");
const savedPolicy = context.saveTeacherJustificationEvidencePolicy({actor:actor("DIR-1","Director"),valor:"PERMITIR_VER_CONSTANCIA_MEDICA_COMPLETA"});
assert.equal(savedPolicy.status,"success");
assert.equal(config.getRange(2,2).getValues()[0][0],"PERMITIR_VER_CONSTANCIA_MEDICA_COMPLETA");
t1=context.getTeacherStudentJustifications(teacher1);
assert.equal(t1.data[0].evidenciaDisponible,true);
const evidence=context.getTeacherJustificationEvidence(Object.assign({},teacher1,{justificacionId:"JUST-00000001"}));
assert.equal(evidence.status,"success");
assert.equal(evidence.data.mimeType,"application/pdf");
assert.equal(evidence.data.fileName,"constancia.pdf");
driveSharing="ANYONE_WITH_LINK";
assert.equal(context.getTeacherJustificationEvidence(Object.assign({},teacher1,{justificacionId:"JUST-00000001"})).code,"TEACHER_EVIDENCE_NOT_PRIVATE");
driveSharing="PRIVATE";

const oldAssignmentOnly=context.getTeacherStudentJustifications(teacher1);
assert.ok(oldAssignmentOnly.data[0].sesiones.every(x=>x.sesionId!=="SESSION-OLD"),"an inactive offer must not grant access even when assignment date matches");
assert.match(source,/case "getTeacherStudentJustifications": result = getTeacherStudentJustifications\(payload\); break;/);
assert.match(source,/"getTeacherStudentJustifications", "acknowledgeTeacherStudentJustification", "getTeacherJustificationEvidence"/);
assert.match(source,/DOCENTE_VISIBILIDAD_EVIDENCIAS_MEDICAS/);
assert.match(source,/case "saveTeacherJustificationEvidencePolicy": result = saveTeacherJustificationEvidencePolicy\(payload\); break;/);
assert.match(source,/"getInstitutionParams", "saveInstitutionParam", "saveTeacherJustificationEvidencePolicy"/);
assert.match(source,/saveTeacherJustificationEvidencePolicy"].indexOf\(String\(action\|\|""\)\)/);
assert.match(source,/RegistroEventos/);
assert.match(source,/auditTeacherJustificationDenied_\(action,payload,"Sin Credenciales de Sesión","SESSION_REQUIRED"\)/);
assert.match(source,/auditTeacherJustificationDenied_\(action,payload,userRole,"ROLE_PERMISSION_DENIED"\)/);
assert.match(userSource,/observacionesPublicas: p\.observacionesPublicas \|\| ""/);
assert.match(teacherUi,/id="nav-justificaciones"/);
assert.match(teacherUi,/id="section-justificaciones"/);
assert.match(teacherJs,/fetchApi\('ACADEMIC', 'getTeacherStudentJustifications', \{\}\)/);
assert.match(teacherJs,/fetchApi\('ACADEMIC', 'acknowledgeTeacherStudentJustification'/);
assert.match(teacherJs,/Registrar conformidad/);
assert.match(teacherJs,/data-tipo-constancia="CONFORMIDAD"/);
assert.match(teacherJs,/fetchApi\('ACADEMIC', 'getTeacherJustificationEvidence'/);
const duplicateJustification = justifications.getDataRange().getValues()[1].slice();
duplicateJustification[12] = '["SESSION-MATH"]';
justifications.appendRow(duplicateJustification);
assert.equal(context.getTeacherStudentJustifications(teacher1).data.length,0,"duplicate justification IDs must fail closed");
assert.equal(context.getTeacherJustificationEvidence(Object.assign({},teacher1,{justificacionId:"JUST-00000001"})).code,"RESOURCE_NOT_FOUND");
console.log("PASS: teacher ABAC by authenticated identity, active/historical assignment dates, offer, period, enrollment, exact sessions, data minimization, evidence policy/privacy, access audit, scoped acknowledgment and idempotency");
