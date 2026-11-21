"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed " + name);
}
const headers = {
  ExpedientesEstudiantes:["ExpedienteID","UserId"],
  ResourceOwnership:["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"],
  TransporteRutas:["RutaID","Nombre","Unidad","Conductor","Capacidad","Paradas","Estado","X","HoraInicio","X2","Jornada"],
  TransporteAsignaciones:["ID","RutaID","EstudianteUserId","Parada","Horario","Estado","Fecha","Jornada","Dias","Observaciones","FechaInicio","FechaFin","Modalidad","FechaCancelacion"],
  TransporteVehiculos:["ID","Unidad","Tipo","Marca","Modelo","Capacidad","Estado"],
  CargosTransporte:["ID","Student","Amount"]
};
function makeHarness(options) {
  const cfg=Object.assign({permission:true,identity:{authorized:true,userId:"DIRECTOR-1",role:"Director",institutionId:"INST-1"},
    scopeValid:true,routeRows:[["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]","active","","06:30","","Matutina"]],
    assignmentRows:[],lockAvailable:true,billingFails:false},options||{});
  const calls={permission:[],ownership:[],scope:0,locks:0,releases:0,billing:0,events:[]};
  const data={
    ExpedientesEstudiantes:[headers.ExpedientesEstudiantes,["EXP-1","STU-1"],["EXP-2","STU-2"]],
    ResourceOwnership:[headers.ResourceOwnership,
      ["OWN-1","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-1","DEP-1","ACTIVE","TEST","2026-01-01","",""],
      ["OWN-2","INST-1","EXPEDIENTE_ESTUDIANTE","EXP-2","DEP-2","ACTIVE","TEST","2026-01-01","",""]],
    TransporteRutas:[headers.TransporteRutas,...cfg.routeRows],
    TransporteAsignaciones:[headers.TransporteAsignaciones,...cfg.assignmentRows],
    TransporteVehiculos:[headers.TransporteVehiculos,["V-1","BUS-1","Bus","","",20,"active"]],
    CargosTransporte:[headers.CargosTransporte,["C-1","STU-1",10]]
  };
  const sheet=name=>({
    getDataRange:()=>({getValues:()=>data[name].map(row=>row.slice())}),
    getLastRow:()=>data[name].length,
    appendRow:row=>data[name].push(row.slice()),
    deleteRow:row=>data[name].splice(row-1,1),
    getRange:(row,col)=>({setValues:values=>{for(let r=0;r<values.length;r++)for(let c=0;c<values[r].length;c++)data[name][row-1+r][col-1+c]=values[r][c];}})
  });
  const ss={getSheetByName:name=>data[name]?sheet(name):null};
  const runtime={
    SPREADSHEET_ID:"TEST",
    getVerifiedAccountingIdentity_:()=>cfg.identity,
    validateRolePermission:(actor,action)=>{calls.permission.push(action);return{authorized:cfg.permission,actor};},
    getVerifiedAccountingDepartmentScope_:(payload,spreadsheet,actor)=>{calls.scope++;return cfg.scopeValid?
      {valid:true,authorized:true,institutionId:"INST-1",institutionWide:false,departmentIds:["DEP-1"]}:
      {valid:false,authorized:false,code:"DEPARTMENT_SCOPE_UNVERIFIED"};},
    assertResourceOwnershipForScope_:(spreadsheet,scope,resourceType,resourceId,operation)=>{
      calls.ownership.push({resourceType,resourceId,operation});
      const rows=data.ResourceOwnership.slice(1).filter(row=>row[1]===scope.institutionId&&row[2]===resourceType&&row[3]===resourceId&&row[5]==="ACTIVE");
      return{authorized:rows.length===1&&(scope.institutionWide===true||scope.departmentIds.includes(rows[0][4])),code:"RESOURCE_SCOPE_DENIED"};
    },
    SpreadsheetApp:{openById:()=>ss},
    LockService:{getScriptLock:()=>({tryLock:()=>{calls.locks++;return cfg.lockAvailable;},waitLock:()=>{calls.locks++;if(!cfg.lockAvailable)throw new Error("LOCK_TIMEOUT");},releaseLock:()=>{calls.releases++;}})},
    getOrCreateTransportVehiclesCatalog:()=>{},
    transportEnsureBillingSchema_:()=>({charges:sheet("CargosTransporte"),assignments:sheet("TransporteAsignaciones")}),
    getOrCreateSheet:(spreadsheet,name)=>sheet(name),
    transportParseDate_:value=>value?new Date(value):null,
    transportNormalizeMode_:value=>String(value),
    transportRecalculateStudentMonthlyChargeLocked_:()=>{calls.billing++;if(cfg.billingFails)throw new Error("BILLING_FAILED");return{status:"success",created:true,missingTariff:0};},
    Utilities:{getUuid:()=>"12345678-1234-5678"},logStructuredEvent:(...args)=>calls.events.push(args),
    Date,String,Number,Object,Array,JSON,Math
  };
  vm.createContext(runtime);
  const names=["assertResourceOwnershipForScope_","assertTransportStudentWriteAccess_","assignStudentTransport","cancelStudentTransportAssignment"];
  vm.runInContext(names.map(extractFunction).join(String.fromCharCode(10))+String.fromCharCode(10)+
    "this.assign=assignStudentTransport;this.cancel=cancelStudentTransportAssignment;",runtime);
  return{runAssign:runtime.assign,runCancel:runtime.cancel,calls,data};
}
const payload=(user,role,extra)=>Object.assign({_verifiedUserId:user,_verifiedRole:role,sessionToken:"verified"},extra||{});
const noIdentity=makeHarness({identity:{authorized:false,code:"VERIFIED_IDENTITY_REQUIRED"}});
assert.throws(()=>noIdentity.runAssign({rutaId:"RUT-1",estudianteUserId:"STU-1"}),/VERIFIED_IDENTITY_REQUIRED/);
assert.equal(noIdentity.calls.locks,0);
const noPermission=makeHarness({permission:false});
assert.throws(()=>noPermission.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})),/ROLE_PERMISSION_DENIED/);
assert.equal(noPermission.calls.locks,0);
const noScope=makeHarness({scopeValid:false});
assert.throws(()=>noScope.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})),/DEPARTMENT_SCOPE_UNVERIFIED/);
assert.equal(noScope.data.TransporteAsignaciones.length,1);
const foreignStudent=makeHarness();
assert.throws(()=>foreignStudent.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-2"})),/RESOURCE_SCOPE_DENIED/);
assert.equal(foreignStudent.data.TransporteAsignaciones.length,1);
const duplicateStudent=makeHarness();
duplicateStudent.data.ExpedientesEstudiantes.push(["EXP-3","STU-1"]);
assert.throws(()=>duplicateStudent.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})),/STUDENT_RESOURCE_AMBIGUOUS/);
assert.equal(duplicateStudent.data.TransporteAsignaciones.length,1);
const missingRoute=makeHarness();
assert.equal(missingRoute.runAssign(payload("DIRECTOR-1","Director",{rutaId:"NO-ROUTE",estudianteUserId:"STU-1"})).code,"ROUTE_NOT_FOUND");
const duplicateRoute=makeHarness({routeRows:[
 ["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]","active","","06:30","","Matutina"],
 ["RUT-1","Ruta duplicate","BUS-1","EMP-1",20,"[]","active","","06:30","","Matutina"]]});
assert.equal(duplicateRoute.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})).code,"ROUTE_AMBIGUOUS");
const inactiveRoute=makeHarness({routeRows:[["RUT-1","Ruta 1","BUS-1","EMP-1",20,"[]","inactive","","06:30","","Matutina"]]});
assert.equal(inactiveRoute.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})).code,"ROUTE_NOT_ACTIVE");
const lockBusy=makeHarness({lockAvailable:false});
assert.equal(lockBusy.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})).code,"LOCK_TIMEOUT");
assert.equal(lockBusy.data.TransporteAsignaciones.length,1);
const success=makeHarness();
const assigned=success.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"}));
assert.equal(assigned.status,"success");
assert.equal(success.data.TransporteAsignaciones.length,2);
assert.deepEqual(success.calls.permission,["assignStudentTransport"]);
assert.deepEqual(success.calls.ownership[0],{resourceType:"EXPEDIENTE_ESTUDIANTE",resourceId:"EXP-1",operation:"WRITE"});
assert.equal(success.calls.releases,1);
assert.equal(success.calls.events[0][6],"DIRECTOR-1");
const assignRollback=makeHarness({billingFails:true});
assert.throws(()=>assignRollback.runAssign(payload("DIRECTOR-1","Director",{rutaId:"RUT-1",estudianteUserId:"STU-1"})),/BILLING_FAILED/);
assert.equal(assignRollback.data.TransporteAsignaciones.length,1);
assert.equal(assignRollback.calls.releases,1);
const assignment=["AS-1","RUT-1","STU-1","Parada A","06:30","active","2026-11-01","Matutina","[]","","2026-11-01","","COMPLETA",""];
const foreignAssignment=assignment.slice(); foreignAssignment[2]="STU-2";
const cancelForeign=makeHarness({assignmentRows:[foreignAssignment]});
assert.throws(()=>cancelForeign.runCancel(payload("DIRECTOR-1","Director",{assignmentId:"AS-1"})),/RESOURCE_SCOPE_DENIED/);
assert.equal(cancelForeign.data.TransporteAsignaciones[1][5],"active");
assert.equal(cancelForeign.calls.releases,1);
const cancelNoPermission=makeHarness({permission:false,assignmentRows:[assignment]});
assert.throws(()=>cancelNoPermission.runCancel(payload("DIRECTOR-1","Director",{assignmentId:"AS-1"})),/ROLE_PERMISSION_DENIED/);
assert.equal(cancelNoPermission.calls.locks,0);
const cancelLockBusy=makeHarness({lockAvailable:false,assignmentRows:[assignment]});
assert.throws(()=>cancelLockBusy.runCancel(payload("DIRECTOR-1","Director",{assignmentId:"AS-1"})),/LOCK_TIMEOUT/);
assert.equal(cancelLockBusy.data.TransporteAsignaciones[1][5],"active");
const cancelSuccess=makeHarness({assignmentRows:[assignment]});
const cancelled=cancelSuccess.runCancel(payload("DIRECTOR-1","Director",{assignmentId:"AS-1"}));
assert.equal(cancelled.status,"success");
assert.equal(cancelSuccess.data.TransporteAsignaciones[1][5],"cancelled");
assert.deepEqual(cancelSuccess.calls.permission,["cancelStudentTransportAssignment"]);
assert.equal(cancelSuccess.calls.releases,1);
const cancelDuplicate=makeHarness({assignmentRows:[assignment,assignment]});
assert.throws(()=>cancelDuplicate.runCancel(payload("DIRECTOR-1","Director",{assignmentId:"AS-1"})),/TRANSPORT_ASSIGNMENT_AMBIGUOUS/);
assert.equal(cancelDuplicate.calls.billing,0);
const cancelRollback=makeHarness({assignmentRows:[assignment],billingFails:true});
assert.throws(()=>cancelRollback.runCancel(payload("DIRECTOR-1","Director",{assignmentId:"AS-1"})),/BILLING_FAILED/);
assert.equal(cancelRollback.data.TransporteAsignaciones[1][5],"active");
assert.equal(cancelRollback.calls.releases,1);
console.log("accounting-transport-assignment-ownership: all assertions passed");
