const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extractFunction(s,n){const a=s.indexOf("function "+n+"(");assert.ok(a>=0,n);const o=s.indexOf("{",a);let d=0,q="",esc=false,line=false,block=false;for(let i=o;i<s.length;i++){const c=s[i],x=s[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&x==="/"){block=false;i++;}continue;}if(q){if(esc){esc=false;continue;}if(c==="\\"){esc=true;continue;}if(c===q)q="";continue;}if(c==="/"&&x==="/"){line=true;i++;continue;}if(c==="/"&&x==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue;}if(c==="{")d++;else if(c==="}"&&--d===0)return s.slice(a,i+1);}throw Error(n+" unbalanced");}
const root=path.resolve(__dirname,"../.."),accounting=fs.readFileSync(path.join(root,"backend/accounting-service/Code.gs"),"utf8");assert.doesNotThrow(()=>new Function(accounting));
const names=["getVerifiedAccountingIdentity_","getVerifiedAccountingDepartmentScope_","accountingHasRolePermission_","validateRolePermission","resolveEmployeeDepartmentId_","assertResourceOwnershipForScope_","assertEmployeeExpedienteScopeAccess_","auditEmployeeSelfServiceDenied_","getEmployeeRecords","normalizeVacationRole_","getVacationSheetSnapshot_","getEmployeePersonNameIndex_","normalizeVacationRequestStatus_","resolveVacationEmployeeAccess_","assertVacationWriteAccess_","submitVacationRequestCore_","submitLeaveVacationRequest","submitVacationRequest","getLeaveVacationRequests","reviewLeaveVacationRequest","calculateVacationBalances","recordMedicalLeave","getVacationRequests","reviewVacationRequest"];
const permissionSourceStart=accounting.indexOf("const ROLE_PERMISSIONS = {"),permissionSourceEnd=accounting.indexOf("\n};",permissionSourceStart);
assert.ok(permissionSourceStart>=0&&permissionSourceEnd>permissionSourceStart,"ACCOUNTING role permission map must exist");
const permissionSourceBlock=accounting.slice(permissionSourceStart,permissionSourceEnd+3);
const code=[permissionSourceBlock,"var RESOURCE_OWNERSHIP_REQUEST_CACHE_ = new WeakMap();",names.map(n=>extractFunction(accounting,n)).join("\n")].join("\n");
const claims={"ha":{userId:"U-HA",role:"RecursosHumanos"},"hb":{userId:"U-HB",role:"RecursosHumanos"},"hrGlobal":{userId:"U-HR-GLOBAL",role:"RecursosHumanos"},"emp":{userId:"U-EMP",role:"Empleado"},"prof":{userId:"U-PROF",role:"Profesor"},"parent":{userId:"U-PARENT",role:"Padre"},"dir":{userId:"U-DIR",role:"Director"},"admin":{userId:"U-ADMIN",role:"Administrador"},"bad":null};
const scopes={"U-HA":{departmentIds:["A"],institutionWide:false},"U-HB":{departmentIds:["B"],institutionWide:false},"U-HR-GLOBAL":{departmentIds:[],institutionWide:true},"U-DIR":{departmentIds:["A"],institutionWide:false},"U-ADMIN":{departmentIds:[],institutionWide:true}};
const rows={
ExpedientesLaborales:[["ExpedienteID","PersonaId","UserId","Puesto","Departamento","CentroCosto","FechaIngreso","FechaSalida","EstadoLaboral","Observaciones"],["EA","PA","U-EMP","Empleado","A","","2020-01-01","","Activo","Nota interna A"],["EB","PB","U-OTHER","Empleado","B","","2021-01-01","","Activo","Nota interna B"],["EP","PP","U-PROF","Profesor","A","","2022-01-01","","Activo","Nota interna P"]],
Personas:[["PersonaID","Nombres","Apellidos","Identificacion","EmailContacto","TelefonoContacto","EstadoPersona","FechaCreacion","FechaActualizacion","Observaciones"],["PA","Ana","Lopez","","","","Activo","","",""],["PB","Luis","Perez","","","","Activo","","",""],["PP","Maria","Santos","","","","Activo","","",""]],
ResourceOwnership:[["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],["OA","I","EXPEDIENTE_LABORAL","EA","A","ACTIVE","U-ADMIN","",""],["OB","I","EXPEDIENTE_LABORAL","EB","B","ACTIVE","U-ADMIN","",""],["OP","I","EXPEDIENTE_LABORAL","EP","A","ACTIVE","U-ADMIN","",""]],
SolicitudesVacaciones:[["SolicitudID","ExpedienteID","Tipo","FechaInicio","FechaFin","DiasSolicitados","Estado","AprobadoPor","Observaciones"],["VA","EA","Vacaciones","2026-12-01","2026-12-05",5,"PendienteAprobacion","","A"],["VB","EB","Permiso","2026-12-02","2026-12-03",2,"PendienteAprobacion","","B"]],
IncapacidadesMedicas:[["IncapacidadID","ExpedienteID","CentroMedico","DiagnosticoPrivadoUrl","FechaInicio","FechaFin","DiasOtorgados","EstadoIHSS","Observaciones"],["IA","EA","IHSS","PRIVATE","2026-01-10","2026-01-12",3,"AceptadaIHSS","A"],["IB","EB","IHSS","PRIVATE","2026-01-11","2026-01-13",3,"AceptadaIHSS","B"]]};
let onAppend=null;function sheet(n){return {getDataRange:()=>({getValues:()=>(rows[n]||[]).map(r=>r.slice())}),getLastRow:()=>(rows[n]||[]).length,appendRow:r=>{if(onAppend)onAppend();rows[n].push(r.slice());},getRange:(r,c)=>({setValue:v=>rows[n][r-1][c-1]=v})};}
const ss={getSheetByName:n=>Object.hasOwn(rows,n)?sheet(n):null,insertSheet:n=>(rows[n]=[],sheet(n))};let uuid=0,locked=false,available=true;
const auditEvents=[];const ctx={console,Date,Math,Number,String,Object,Array,JSON,WeakMap,isNaN,parseInt,SPREADSHEET_ID:"T",
requestAccountingUserAuthorization_:(action,payload)=>{const actor=claims[payload.sessionToken];return actor?{status:"success",authorized:true,userId:actor.userId,role:actor.role,institutionId:"I",membershipId:"M-"+actor.userId}:{status:"error",code:"VERIFIED_IDENTITY_REQUIRED"};},
PropertiesService:{getScriptProperties:()=>({getProperty:n=>n==="IMA_INSTITUTION_ID"?"I":""})},logStructuredEvent:(...args)=>auditEvents.push(args),
getVerifiedDepartmentScopeForSession_:(p,s,a)=>scopes[a.userId]?{authorized:true,userId:a.userId,role:a.role,institutionId:"I",departmentIds:scopes[a.userId].departmentIds,institutionWide:scopes[a.userId].institutionWide}:{authorized:false,code:"DEPARTMENT_SCOPE_NOT_ASSIGNED"},
SpreadsheetApp:{openById:()=>ss},getOrCreateSheet:(s,n)=>(rows[n]||(rows[n]=[]),sheet(n)),Utilities:{getUuid:()=>"U"+(++uuid)},
LockService:{getScriptLock:()=>({tryLock:()=>{if(!available||locked)return false;locked=true;return true;},releaseLock:()=>locked=false})}};
vm.createContext(ctx);vm.runInContext(code,ctx);
ctx.getVerifiedAccountingDepartmentScope_=(payload,spreadsheet,actor)=>{const verified=actor||ctx.getVerifiedAccountingIdentity_(payload);const scope=verified&&scopes[verified.userId];return scope?{valid:true,authorized:true,userId:verified.userId,roleId:verified.role,institutionId:"I",membershipId:"M-"+verified.userId,departmentIds:scope.departmentIds,institutionWide:scope.institutionWide}:{valid:false,authorized:false,code:"RESOURCE_NOT_FOUND"};};
const p=t=>({sessionToken:t}),count=rows.SolicitudesVacaciones.length;
const ownRecords=ctx.getEmployeeRecords(p("emp"));
assert.equal(ownRecords.status,"success");
assert.ok(Array.isArray(ownRecords.data));
assert.equal(ownRecords.data.length,1);
assert.equal(Array.from(ownRecords.expedientes,r=>r.expedienteId).join(","),"EA");
assert.equal(ownRecords.expedientes[0].empleadoNombre,"Ana Lopez");
assert.equal(ownRecords.expedientes[0].observaciones,"","self-service must not expose internal HR notes");
assert.equal(ctx.getEmployeeRecords({...p("emp"),userId:"U-OTHER"}).code,"RESOURCE_NOT_FOUND");
assert.equal(ctx.getEmployeeRecords({...p("emp"),expedienteId:"EB"}).code,"RESOURCE_NOT_FOUND");
assert.equal(ctx.getEmployeeRecords({...p("emp"),userId:"U-EMP",expedienteId:"EB"}).code,"RESOURCE_NOT_FOUND");
assert.equal(Array.from(ctx.getEmployeeRecords(p("ha")).expedientes,r=>r.expedienteId).sort().join(","),"EA,EP");
assert.equal(Array.from(ctx.getEmployeeRecords(p("hb")).expedientes,r=>r.expedienteId).join(","),"EB");
assert.equal(Array.from(ctx.getEmployeeRecords(p("admin")).expedientes,r=>r.expedienteId).sort().join(","),"EA,EB,EP");
assert.equal(ctx.getEmployeeRecords(p("bad")).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(ctx.getEmployeeRecords(p("parent")).code,"ROLE_NOT_ALLOWED");
assert.equal(ctx.getVacationRequests(p("parent")).code,"ROLE_NOT_ALLOWED");
assert.equal(Array.from(ctx.getEmployeeRecords(p("ha")).expedientes,r=>r.expedienteId).join(","),"EA,EP");
assert.equal(ctx.getEmployeeRecords(p("ha")).expedientes[0].observaciones,"Nota interna A","authorized HR scope retains its permitted record details");
assert.equal(Array.from(ctx.getEmployeeRecords(p("hrGlobal")).expedientes,r=>r.expedienteId).sort().join(","),"EA,EB,EP","institution-wide HR scope may view the full authorized institution");
assert.ok(ctx.getVacationRequests(p("hrGlobal")).solicitudes.some(r=>r.expedienteId==="EB"),"institution-wide HR scope may view requests within its authorized institution");
assert.equal(ctx.getEmployeeRecords(p("emp")).expedientes[0].observaciones,"");
assert.equal(ctx.submitLeaveVacationRequest(p("bad")).code,"VERIFIED_IDENTITY_REQUIRED");
assert.equal(ctx.submitLeaveVacationRequest({...p("emp"),expedienteId:"EB",fechaInicio:"2026-12-10",fechaFin:"2026-12-11"}).code,"RESOURCE_NOT_FOUND");assert.equal(rows.SolicitudesVacaciones.length,count);
assert.equal(ctx.submitLeaveVacationRequest({...p("emp"),fechaInicio:"2026-12-10",fechaFin:"2026-12-12",diasSolicitados:3}).status,"success");assert.equal(rows.SolicitudesVacaciones.at(-1)[1],"EA");
assert.equal(ctx.submitLeaveVacationRequest({...p("emp"),fechaInicio:"2026-12-11",fechaFin:"2026-12-13"}).code,"VACATION_REQUEST_OVERLAP");
assert.equal(ctx.submitLeaveVacationRequest({...p("hb"),expedienteId:"EA",fechaInicio:"2026-12-10",fechaFin:"2026-12-11"}).code,"RESOURCE_NOT_FOUND");
assert.equal(ctx.submitLeaveVacationRequest({...p("ha"),expedienteId:"EA",fechaInicio:"2026-12-13",fechaFin:"2026-12-14"}).status,"success");
assert.equal(ctx.submitVacationRequest({...p("dir"),expedienteId:"EA",fechaInicio:"2026-12-15",fechaFin:"2026-12-16"}).status,"success");
assert.equal(ctx.submitVacationRequest({...p("prof"),fechaInicio:"2026-12-15",fechaFin:"2026-12-16"}).status,"success");
assert.equal(ctx.submitVacationRequest({...p("emp"),fechaInicio:"2026-12-15",fechaFin:"2026-12-16"}).code,"ROLE_NOT_ALLOWED");
let reentrantResult=null;const beforeRace=rows.SolicitudesVacaciones.length;onAppend=()=>{onAppend=null;reentrantResult=ctx.submitLeaveVacationRequest({...p("emp"),fechaInicio:"2026-12-18",fechaFin:"2026-12-18"});};const raceResult=ctx.submitLeaveVacationRequest({...p("emp"),fechaInicio:"2026-12-18",fechaFin:"2026-12-18"});assert.equal(raceResult.status,"success");assert.equal(reentrantResult.code,"CONCURRENT_UPDATE_RETRY");assert.equal(rows.SolicitudesVacaciones.length,beforeRace+1);
const hrResponse=ctx.getLeaveVacationRequests(p("ha"));const hrRequests=hrResponse.solicitudes;assert.ok(Array.isArray(hrResponse.data));assert.equal(hrResponse.total,hrResponse.data.length);assert.ok(hrRequests.every(x=>["EA","EP"].includes(x.expedienteId)));assert.ok(hrRequests.every(x=>x.empleadoNombre));assert.ok(hrRequests.every(x=>Object.prototype.hasOwnProperty.call(x,"observaciones")&&!Object.prototype.hasOwnProperty.call(x,"userId")));assert.ok(hrRequests.some(x=>x.estado==="Pendiente"&&x.estadoOriginal==="PendienteAprobacion"&&x.tipoSolicitud==="Vacaciones"));assert.ok(hrRequests.some(x=>x.expedienteId==="EA")&&hrRequests.some(x=>x.expedienteId==="EP"));assert.ok(!hrRequests.some(x=>x.expedienteId==="EB"));
assert.equal(ctx.getVacationRequests({...p("ha"),expedienteId:"EB"}).code,"RESOURCE_NOT_FOUND");
const ownLeaveResponse=ctx.getLeaveVacationRequests(p("emp"));assert.ok(Array.isArray(ownLeaveResponse.data));assert.ok(ownLeaveResponse.data.every(x=>x.expedienteId==="EA"&&x.empleadoNombre==="Ana Lopez"&&!Object.prototype.hasOwnProperty.call(x,"observaciones")&&!Object.prototype.hasOwnProperty.call(x,"aprobadoPor")));assert.ok(ownLeaveResponse.solicitudes.every(x=>x.expedienteId==="EA"));
assert.ok(ctx.getLeaveVacationRequests({...p("emp"),userId:"U-OTHER"}).solicitudes.every(x=>x.expedienteId==="EA"),"client userId must not override the signed employee identity");
assert.equal(ctx.getVacationRequests({...p("emp"),expedienteId:"EB"}).code,"RESOURCE_NOT_FOUND");
const probeEvent=auditEvents.find(event=>event[3]==="UNAUTHORIZED_EMPLOYEE_RESOURCE_ACCESS");
assert.ok(probeEvent,"foreign employee resource probes must be audited");
assert.equal(probeEvent[6],"Empleado","audit records the verified role, not a client-supplied role");

assert.ok(auditEvents.every(event=>!JSON.stringify(event[5]||{}).includes("EB")&&!JSON.stringify(event[5]||{}).includes("U-OTHER")),"audit must not persist attacker-supplied target IDs");
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
const saved=rows.SolicitudesVacaciones;delete rows.SolicitudesVacaciones;assert.deepEqual(Array.from(ctx.getVacationRequests(p("admin")).solicitudes),[]);assert.deepEqual(Array.from(ctx.getVacationRequests(p("admin")).data),[]);assert.equal(Object.hasOwn(rows,"SolicitudesVacaciones"),false);rows.SolicitudesVacaciones=saved;
const permissionStart=accounting.indexOf("const ROLE_PERMISSIONS = {");
const permissionEnd=accounting.indexOf("\n};",permissionStart);
const permissionText=accounting.slice(permissionStart,permissionEnd);
const gate=extractFunction(accounting,"validateRolePermission");assert.ok(gate.includes("accountingHasRolePermission_"),"role gate must delegate to the verified role permission map");for(const a of ["submitLeaveVacationRequest","submitVacationRequest","getLeaveVacationRequests","getVacationRequests","reviewLeaveVacationRequest","reviewVacationRequest","calculateVacationBalances","recordMedicalLeave"])assert.ok(permissionText.includes('"'+a+'"'),a+" missing explicit role permission");
function rolePermissionBlock(role){const start=permissionText.indexOf('"'+role+'": [');assert.ok(start>=0,role+" role permissions missing");const end=permissionText.indexOf('\n  "',start+1);return permissionText.slice(start,end<0?permissionText.length:end);}
assert.ok(rolePermissionBlock("Empleado").includes('"getEmployeeRecords"'),"employee self-service action must be RBAC-permitted");
assert.ok(rolePermissionBlock("RecursosHumanos").includes('"getEmployeeRecords"'),"HR action must be RBAC-permitted");
console.log("ACCOUNTING vacation and medical-leave ownership contract passed");
