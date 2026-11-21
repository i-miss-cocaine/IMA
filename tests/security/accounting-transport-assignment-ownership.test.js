"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
new vm.Script(source);
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed " + name);
}
const headers = {
  ExpedientesEstudiantes:["ExpedienteID","UserId"],
  TransporteRutas:["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado","Notas","HoraInicio","HoraFin","Jornada"],
  TransporteAsignaciones:["AsignacionTranspID","RutaID","EstudianteUserId","ParadaNombre","HorarioPlan","Estado","FechaAsignacion","Jornada","DiasSemanaJSON","Observaciones","FechaInicioServicio","FechaFinServicio","ModalidadServicio","FechaCancelacion","TarifaMensualAplicada","ConceptoTransporteID"],
  TransporteVehiculos:["VehiculoID","CodigoUnidad","Marca","Modelo","Placa","Capacidad","Estado"],
  CargosTransporte:["ID","Student","Amount"]
};
function makeHarness(options) {
  const cfg = Object.assign({
    permission:true, identity:{authorized:true,userId:"DIRECTOR-1",role:"Director",institutionId:"INST-1"},
    scopeValid:true, ownershipDenied:false, routeRows:[["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]","active","","06:30","","Matutina"]],
    assignmentRows:[], lockAvailable:true, billingFails:false, duplicateStudent:false
  }, options || {});
  const calls = { permission:[], ownership:[], scope:0, locks:0, releases:0, billing:0, events:[] };
  const data = {
    ExpedientesEstudiantes:[headers.ExpedientesEstudiantes,["EXP-1","STU-1"],["EXP-2","STU-2"]],
    TransporteRutas:[headers.TransporteRutas,...cfg.routeRows],
    TransporteAsignaciones:[headers.TransporteAsignaciones,...cfg.assignmentRows.map(row=>row.slice())],
    TransporteVehiculos:[headers.TransporteVehiculos,["V-1","BUS-1","Bus","","",20,"active"]],
    CargosTransporte:[headers.CargosTransporte,["C-1","STU-1",10]]
  };
  if (cfg.duplicateStudent) data.ExpedientesEstudiantes.push(["EXP-3","STU-1"]);
  const sheet = name => ({
    getDataRange:()=>({getValues:()=>data[name].map(row=>row.slice())}),
    getLastRow:()=>data[name].length,
    appendRow:row=>data[name].push(row.slice()),
    deleteRow:row=>data[name].splice(row-1,1),
    getRange:(row,col)=>({setValues:values=>{for(let r=0;r<values.length;r++)for(let c=0;c<values[r].length;c++)data[name][row-1+r][col-1+c]=values[r][c];}})
  });
  const ss = { getSheetByName:name=>data[name]?sheet(name):null };
  const runtime = {
    SPREADSHEET_ID:"TEST",
    getVerifiedAccountingIdentity_:()=>cfg.identity,
    validateRolePermission:(actor,action)=>{calls.permission.push(action);return {authorized:cfg.permission,actor};},
    getVerifiedAccountingDepartmentScope_:(payload,spreadsheet,actor)=>{calls.scope++;return cfg.scopeValid?
      {valid:true,authorized:true,institutionId:"INST-1",institutionWide:false,departmentIds:["DEP-1"]}:
      {valid:false,authorized:false,code:"DEPARTMENT_SCOPE_UNVERIFIED"};},
    assertMonthlyChargeStudentOwnership_:(spreadsheet,scope,studentIds,operation)=>{
      calls.ownership.push({studentIds:studentIds.slice(),operation});
      if(cfg.ownershipDenied||studentIds.some(id=>id==="STU-2"))throw new Error("RESOURCE_SCOPE_DENIED");
      return true;
    },
    SpreadsheetApp:{openById:()=>ss},
    LockService:{getScriptLock:()=>({
      tryLock:()=>{calls.locks++;return cfg.lockAvailable;},
      waitLock:()=>{calls.locks++;if(!cfg.lockAvailable)throw new Error("LOCK_TIMEOUT");},
      releaseLock:()=>{calls.releases++;}
    })},
    getOrCreateTransportVehiclesCatalog:()=>{},
    transportEnsureBillingSchema_:()=>({charges:sheet("CargosTransporte"),assignments:sheet("TransporteAsignaciones")}),
    getOrCreateSheet:(spreadsheet,name)=>sheet(name),
    transportParseDate_:value=>value?new Date(value):null,
    transportNormalizeMode_:value=>String(value||"COMPLETA"),
    transportRecalculateStudentMonthlyChargeLocked_:()=>{calls.billing++;if(cfg.billingFails)throw new Error("BILLING_FAILED");return {status:"success",created:true,missingTariff:0};},
    Utilities:{getUuid:()=>"12345678-1234-5678"},
    logStructuredEvent:(...args)=>calls.events.push(args),
    Date,String,Number,Object,Array,JSON,Math
  };
  vm.createContext(runtime);
  const names=["transportBillingActor_","transportAssertStudentOwnershipForMutation_","assignStudentTransport","cancelStudentTransportAssignment"];
  vm.runInContext(names.map(extractFunction).join("\n")+"\nthis.assign=assignStudentTransport;this.cancel=cancelStudentTransportAssignment;",runtime);
  return {runAssign:runtime.assign,runCancel:runtime.cancel,calls,data};
}
const payload=(extra)=>Object.assign({sessionToken:"verified",rutaId:"RUT-1",estudianteUserId:"STU-1"},extra||{});
const noIdentity=makeHarness({identity:{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"}});
assert.throws(()=>noIdentity.runAssign(payload()),/VERIFIED_IDENTITY_REQUIRED/);
assert.equal(noIdentity.calls.locks,0);
const noPermission=makeHarness({permission:false});
assert.throws(()=>noPermission.runAssign(payload()),/ROLE_PERMISSION_DENIED/);
assert.equal(noPermission.calls.locks,0);
const noScope=makeHarness({scopeValid:false});
assert.throws(()=>noScope.runAssign(payload()),/DEPARTMENT_SCOPE_UNVERIFIED/);
assert.equal(noScope.data.TransporteAsignaciones.length,1);
const foreignStudent=makeHarness();
assert.throws(()=>foreignStudent.runAssign(payload({estudianteUserId:"STU-2"})),/RESOURCE_SCOPE_DENIED/);
assert.equal(foreignStudent.data.TransporteAsignaciones.length,1);
const duplicateStudent=makeHarness({duplicateStudent:true});
assert.equal(duplicateStudent.runAssign(payload()).code,"TRANSPORT_STUDENT_AMBIGUOUS");
assert.equal(duplicateStudent.data.TransporteAsignaciones.length,1);
const missingRoute=makeHarness();
assert.equal(missingRoute.runAssign(payload({rutaId:"NO-ROUTE"})).code,"ROUTE_NOT_FOUND");
const duplicateRoute=makeHarness({routeRows:[
  ["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]","active","","06:30","","Matutina"],
  ["RUT-1","Ruta duplicate","BUS-1","EMP-1",20,"[]","active","","06:30","","Matutina"]
]});
assert.equal(duplicateRoute.runAssign(payload()).code,"ROUTE_ID_AMBIGUOUS");
const legacyActiveDuplicate = makeHarness({assignmentRows:[["AS-OLD","RUT-1","STU-1","Parada A","06:30","activo","2026-11-01","Matutina","[]","","2026-11-01","","COMPLETA",""]]});
assert.equal(legacyActiveDuplicate.runAssign(payload()).code,"DUPLICATE_TRANSPORT_ASSIGNMENT",
  "legacy active assignment states must prevent duplicate assignment");
const legacyCapacity = makeHarness({
  routeRows:[["RUT-1","Ruta 1","BUS-1","EMP-1",1,"[]","active","","06:30","","Matutina"]],
  assignmentRows:[["AS-OLD","RUT-1","STU-2","Parada A","06:30","activo","2026-11-01","Matutina","[]","","2026-11-01","","COMPLETA",""]]
});
legacyCapacity.data.TransporteVehiculos[1][5]=1;
assert.equal(legacyCapacity.runAssign(payload()).code,"TRANSPORT_CAPACITY_EXCEEDED",
  "legacy active assignments must count toward capacity");
const inactiveRoute=makeHarness({routeRows:[["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]","inactive","","06:30","","Matutina"]]});
assert.equal(inactiveRoute.runAssign(payload()).code,"ROUTE_NOT_ACTIVE");
for (const vehicleState of ["activo","activa","vigente"]) {
  const compatibleVehicle = makeHarness();
  compatibleVehicle.data.TransporteVehiculos[1][6] = vehicleState;
  assert.equal(compatibleVehicle.runAssign(payload()).status,"success",
    "assignment must accept vehicle states previously treated as active: " + vehicleState);
}
for (const activeState of ["activo","activa","vigente"]) {
  const compatibleRoute = makeHarness({routeRows:[["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]",activeState,"","06:30","","Matutina"]]});
  assert.equal(compatibleRoute.runAssign(payload()).status,"success",
    "assignment must accept route states exposed as active by getTransportRoutes: " + activeState);
}
const lockBusy=makeHarness({lockAvailable:false});
assert.equal(lockBusy.runAssign(payload()).code,"LOCK_TIMEOUT");
assert.equal(lockBusy.data.TransporteAsignaciones.length,1);
const success=makeHarness();
const assigned=success.runAssign(payload());
assert.equal(assigned.status,"success");
assert.equal(success.data.TransporteAsignaciones.length,2);
assert.deepEqual(success.calls.permission,["assignStudentTransport"]);
assert.equal(JSON.stringify(success.calls.ownership[0]),JSON.stringify({studentIds:["STU-1"],operation:"WRITE"}));
assert.equal(success.calls.releases,1);
assert.equal(success.calls.events[0][6],"DIRECTOR-1");
const assignRollback=makeHarness({billingFails:true});
assert.throws(()=>assignRollback.runAssign(payload()),/BILLING_FAILED/);
assert.equal(assignRollback.data.TransporteAsignaciones.length,1);
assert.equal(assignRollback.calls.releases,1);
const assignment=["AS-1","RUT-1","STU-1","Parada A","06:30","active","2026-11-01","Matutina","[]","","2026-11-01","","COMPLETA",""];
const foreignAssignment=assignment.slice();foreignAssignment[2]="STU-2";
const cancelForeign=makeHarness({assignmentRows:[foreignAssignment]});
assert.throws(()=>cancelForeign.runCancel({sessionToken:"verified",assignmentId:"AS-1"}),/RESOURCE_SCOPE_DENIED/);
assert.equal(cancelForeign.data.TransporteAsignaciones[1][5],"active");
assert.equal(cancelForeign.calls.releases,1);
const cancelNoPermission=makeHarness({permission:false,assignmentRows:[assignment]});
assert.throws(()=>cancelNoPermission.runCancel({sessionToken:"verified",assignmentId:"AS-1"}),/ROLE_PERMISSION_DENIED/);
assert.equal(cancelNoPermission.calls.locks,0);
const cancelLockBusy=makeHarness({lockAvailable:false,assignmentRows:[assignment]});
assert.throws(()=>cancelLockBusy.runCancel({sessionToken:"verified",assignmentId:"AS-1"}),/LOCK_TIMEOUT/);
assert.equal(cancelLockBusy.data.TransporteAsignaciones[1][5],"active");
const legacyActiveAssignment=assignment.slice();legacyActiveAssignment[5]="activo";
const cancelLegacyActive=makeHarness({assignmentRows:[legacyActiveAssignment]});
assert.equal(cancelLegacyActive.runCancel({sessionToken:"verified",assignmentId:"AS-1"}).status,"success",
  "legacy active assignment must remain cancellable");
const legacyCancelledAssignment=assignment.slice();legacyCancelledAssignment[5]="cancelado";
const cancelLegacyIdempotent=makeHarness({assignmentRows:[legacyCancelledAssignment]});
assert.equal(cancelLegacyIdempotent.runCancel({sessionToken:"verified",assignmentId:"AS-1"}).idempotent,true,
  "legacy cancelled assignment remains idempotent");
const cancelSuccess=makeHarness({assignmentRows:[assignment]});
const cancelled=cancelSuccess.runCancel({sessionToken:"verified",assignmentId:"AS-1"});
assert.equal(cancelled.status,"success");
assert.equal(cancelSuccess.data.TransporteAsignaciones[1][5],"cancelled");
assert.deepEqual(cancelSuccess.calls.permission,["cancelStudentTransportAssignment"]);
assert.equal(cancelSuccess.calls.releases,1);
const cancelDuplicate=makeHarness({assignmentRows:[assignment,assignment]});
assert.throws(()=>cancelDuplicate.runCancel({sessionToken:"verified",assignmentId:"AS-1"}),/TRANSPORT_ASSIGNMENT_AMBIGUOUS/);
assert.equal(cancelDuplicate.calls.billing,0);
const cancelRollback=makeHarness({assignmentRows:[assignment],billingFails:true});
assert.throws(()=>cancelRollback.runCancel({sessionToken:"verified",assignmentId:"AS-1"}),/BILLING_FAILED/);
assert.equal(cancelRollback.data.TransporteAsignaciones[1][5],"active");
assert.equal(cancelRollback.calls.releases,1);
console.log("accounting-transport-assignment-ownership: all assertions passed");
