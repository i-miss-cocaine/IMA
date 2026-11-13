const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extractFunction(s,n){const a=s.indexOf("function "+n+"(");assert.ok(a>=0,n);const o=s.indexOf("{",a);let d=0,q="",esc=false,line=false,block=false;for(let i=o;i<s.length;i++){const c=s[i],x=s[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&x==="/"){block=false;i++;}continue;}if(q){if(esc){esc=false;continue;}if(c==="\\"){esc=true;continue;}if(c===q)q="";continue;}if(c==="/"&&x==="/"){line=true;i++;continue;}if(c==="/"&&x==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue;}if(c==="{")d++;else if(c==="}"&&--d===0)return s.slice(a,i+1);}throw Error(n+" unbalanced");}
const root=path.resolve(__dirname,"../.."),accounting=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");assert.doesNotThrow(()=>new Function(accounting));
const names=["getVerifiedAccountingIdentity_","getVerifiedAccountingDepartmentScope_","resolveEmployeeDepartmentId_","assertResourceOwnershipForScope_","assertEmployeeExpedienteScopeAccess_","normalizeVacationRole_","getVacationSheetSnapshot_","resolveVacationEmployeeAccess_","assertVacationWriteAccess_","submitVacationRequestCore_","submitLeaveVacationRequest","submitVacationRequest","getLeaveVacationRequests","reviewLeaveVacationRequest","calculateVacationBalances","recordMedicalLeave","getVacationRequests","reviewVacationRequest"];
const code=["var RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();",names.map(n=>extractFunction(accounting,n)).join("\n")].join("\n");
const claims={"ha":{userId:"U-HA",role:"RecursosHumanos"},"hb":{userId:"U-HB",role:"RecursosHumanos"},"emp":{userId:"U-EMP",role:"Empleado"},"prof":{userId:"U-PROF",role:"Profesor"},"dir":{userId:"U-DIR",role:"Director"},"admin":{userId:"U-ADMIN",role:"Administrador"},"bad":null};
const scopes={"U-HA":{departmentIds:["A"],institutionWide:false},"U-HB":{departmentIds:["B"],institutionWide:false},"U-DIR":{departmentIds:["A"],institutionWide:false},"U-ADMIN":{departmentIds:[],institutionWide:true}};
const rows={
ExpedientesLaborales:[["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],["EA","PA","U-EMP","Empleado","A","","2020-01-01","","Activo",""],["EB","PB","U-OTHER","Empleado","B","","2021-01-01","","Activo",""],["EP","PP","U-PROF","Profesor","A","","2022-01-01","","Activo",""]],
ResourceOwnership:[["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],["OA","I","EXPEDIENTE_LABORAL","EA","A","ACTIVE","U-ADMIN","",""],["OB","I","EXPEDIENTE_LABORAL","EB","B","ACTIVE","U-ADMIN","",""],["OP","I","EXPEDIENTE_LABORAL","EP","A","ACTIVE","U-ADMIN","",""]],
SolicitudesVacaciones:[["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"],["VA","EA","Vacaciones","2026-12-01","2026-12-05",5,"PendienteAprobacion","","A"],["VB","EB","Permiso","2026-12-02","2026-12-03",2,"PendienteAprobacion","","B"]],
IncapacidadesMedicas:[["IncapacidadID","ExpedienteID","CentroMedico","DiagnosticoPrivadoUrl","FechaInicio","FechaFin","DiasOtorgados","EstadoIHSS","Observaciones"],["IA","EA","IHSS","PRIVATE","2026-01-10","2026-01-12",3,"AceptadaIHSS","A"],["IB","EB","IHSS","PRIVATE","2026-01-11","2026-01-13",3,"AceptadaIHSS","B"]]};
function sheet(n){return {getDataRange:()=>({getValues:()=>(rows[n]||[]).map(r=>r.slice())}),getLastRow:()=>(rows[n]||[]).length,appendRow:r=>rows[n].push(r.slice()),getRange:(r,c)=>({setValue:v=>rows[n][r-1][c-1]=v})};}
const ss={getSheetByName:n=>Object.hasOwn(rows,n)?sheet(n):null,insertSheet:n=>(rows[n]=[],sheet(n))};let uuid=0,locked=false,available=true;
const ctx={console,Date,Math,Number,String,Object,Array,JSON,WeakMap,isNaN,parseInt,SPREADSHEET_ID:"T",verifySessionToken:t=>claims[t]||null,
getVerifiedDepartmentScopeForSession_:(p,s,a)=>scopes[a.userId]?{authorized:true,userId:a.userId,role:a.role,institutionId:"I",departmentIds:scopes[a.userId].departmentIds,institutionWide:scopes[a.userId].institutionWide}:{authorized:false,code:"DEPARTMENT_SCOPE_NOT_ASSIGNED"},
SpreadsheetApp:{openById:()=>ss},getOrCreateSheet:(s,n)=>(rows[n]||(rows[n]=[]),sheet(n)),Utilities:{getUuid:()=>"U"+(++uuid)},
LockService:{getScriptLock:()=>({tryLock:()=>{if(!available||locked)return false;locked=true;return true;},releaseLock:()=>locked=false})}};
vm.createContext(ctx);vm.runInContext(code,ctx);const p=t=>({sessionToken:t}),count=rows.SolicitudesVacaciones.length;
assert.equal(ctx.submitLeaveVacationRequest(p("bad")).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(ctx.submitLeaveVacationRequest({...p("emp"),expedienteId:"EB",fechaInicio:"2026-12-10",fechaFin:"2026-12-11"}).code,"RESOURCE_NOT_FOUND");assert.equal(rows.SolicitudesVacaciones.length,count);
assert.equal(ctx.submitLeaveVacationRequest({...p("emp"),fechaInicio:"2026-12-10",fechaFin:"2026-12-12",diasSolicitados:3}).status,"success");assert.equal(rows.SolicitudesVacaciones.at(-1)[1],"EA");
assert.equal(ctx.submitLeaveVacationRequest({...p("hb"),expedienteId:"EA",fechaInicio:"2026-12-10",fechaFin:"2026-12-11"}).code,"RESOURCE_NOT_FOUND");
assert.equal(ctx.submitLeaveVacationRequest({...p("ha"),expedienteId:"EA",fechaInicio:"2026-12-10",fechaFin:"2026-12-11"}).status,"success");
assert.equal(ctx.submitVacationRequest({...p("dir"),expedienteId:"EA",fechaInicio:"2026-12-15",fechaFin:"2026-12-16"}).status,"success");
assert.equal(ctx.submitVacationRequest({...p("prof"),fechaInicio:"2026-12-15",fechaFin:"2026-12-16"}).status,"success");
assert.equal(ctx.submitVacationRequest({...p("emp"),fechaInicio:"2026-12-15",fechaFin:"2026-12-16"}).code,"ROLE_NOT_ALLOWED");
assert.ok(ctx.getLeaveVacationRequests(p("ha")).solicitudes.every(x=>x.expedienteId==="EA"));
assert.equal(ctx.getVacationRequests({...p("ha"),expedienteId:"EB"}).code,"RESOURCE_NOT_FOUND");
assert.ok(ctx.getLeaveVacationRequests(p("emp")).solicitudes.every(x=>x.expedienteId==="EA"));
assert.equal(ctx.getVacationRequests({...p("emp"),expedienteId:"EB"}).code,"RESOURCE_NOT_FOUND");
assert.equal(ctx.calculateVacationBalances({...p("ha"),expedienteId:"EA"}).status,"success");
assert.equal(ctx.calculateVacationBalances({...p("hb"),expedienteId:"EA"}).code,"RESOURCE_NOT_FOUND");
assert.equal(ctx.calculateVacationBalances({...p("emp"),expedienteId:"EA"}).code,"ROLE_NOT_ALLOWED");
const m=rows.IncapacidadesMedicas.length;assert.equal(ctx.recordMedicalLeave({...p("hb"),expedienteId:"EA",fechaInicio:"2026-11-01",fechaFin:"2026-11-02"}).code,"RESOURCE_NOT_FOUND");assert.equal(rows.IncapacidadesMedicas.length,m);
assert.equal(ctx.recordMedicalLeave({...p("emp"),expedienteId:"EA",fechaInicio:"2026-11-01",fechaFin:"2026-11-02"}).code,"ROLE_NOT_ALLOWED");
assert.equal(ctx.recordMedicalLeave({...p("ha"),expedienteId:"EA",fechaInicio:"2026-11-01",fechaFin:"2026-11-02",diasOtorgados:2}).status,"success");
const before=rows.SolicitudesVacaciones.find(r=>r[0]==="VA").slice(6,9);
assert.equal(ctx.reviewVacationRequest({...p("hb"),solicitudId:"VA",nuevoEstado:"Aprobado"}).code,"RESOURCE_NOT_FOUND");assert.deepEqual(rows.SolicitudesVacaciones.find(r=>r[0]==="VA").slice(6,9),before);
assert.equal(ctx.reviewVacationRequest({...p("ha"),solicitudId:"VA",nuevoEstado:"Aprobado"}).status,"success");assert.equal(rows.SolicitudesVacaciones.find(r=>r[0]==="VA")[7],"RecursosHumanos");
available=false;const n=rows.SolicitudesVacaciones.length;assert.equal(ctx.submitLeaveVacationRequest({...p("emp"),fechaInicio:"2026-12-20",fechaFin:"2026-12-21"}).code,"CONCURRENT_UPDATE_RETRY");assert.equal(rows.SolicitudesVacaciones.length,n);assert.equal(ctx.reviewVacationRequest({...p("ha"),solicitudId:"VA",nuevoEstado:"Rechazado"}).code,"CONCURRENT_UPDATE_RETRY");available=true;
const dup=rows.SolicitudesVacaciones.length;rows.SolicitudesVacaciones.push(["DUP","EA","V","a","b",1,"Pending","",""],["DUP","EA","V","a","b",1,"Pending","",""]);assert.ok(!ctx.getVacationRequests(p("admin")).solicitudes.some(x=>x.solicitudId==="DUP"));rows.SolicitudesVacaciones.splice(dup);
const header=rows.SolicitudesVacaciones[0].slice();rows.SolicitudesVacaciones[0][0]="bad";assert.equal(ctx.getVacationRequests(p("admin")).code,"RESOURCE_SCHEMA_INVALID");rows.SolicitudesVacaciones[0]=header;
const saved=rows.SolicitudesVacaciones;delete rows.SolicitudesVacaciones;assert.deepEqual(Array.from(ctx.getVacationRequests(p("admin")).solicitudes),[]);assert.equal(Object.hasOwn(rows,"SolicitudesVacaciones"),false);rows.SolicitudesVacaciones=saved;
const gate=extractFunction(accounting,"validateRolePermission");for(const a of ["submitLeaveVacationRequest","submitVacationRequest","getLeaveVacationRequests","getVacationRequests","reviewLeaveVacationRequest","reviewVacationRequest","calculateVacationBalances","recordMedicalLeave"])assert.ok(gate.includes('"'+a+'"'),a+" missing scope gate");
console.log("ACCOUNTING vacation and medical-leave ownership contract passed");
