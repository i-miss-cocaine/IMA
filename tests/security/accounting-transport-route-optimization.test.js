"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/accounting-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed function " + name);
}
const names = [
  "transportOptimizationActor_", "transportOptimizationTime_", "transportOptimizationDistanceKm_",
  "transportOptimizationNormalizeStops_", "transportOptimizationEvaluate_", "transportOptimizationOrder_",
  "transportOptimizationSheet_", "optimizeRouteStopsSequence", "getRouteOptimizationProposals",
  "approveRouteStopsOptimization", "rejectRouteStopsOptimization"
];
const rows = Object.create(null);
const routeHeaders = ["RutaID","NombreRuta","UnidadCodigo","ConductorEmpleadoId","Capacidad","ParadasJSON","Estado","Observaciones","HoraInicio","HoraFin","Jornada"];
const proposalHeaders = ["PropuestaID","RutaID","FechaCreacion","CreadoPor","VelocidadPromedioKmh","HoraInicio","DistanciaActualKm","DistanciaPropuestaKm","TiempoEstimadoMinutos","ParadasOriginalesJSON","ParadasPropuestasJSON","Estado","ResueltoPor","FechaResolucion","Observaciones"];
rows.TransporteRutas = [routeHeaders];
rows.TransporteOptimizaciones = [proposalHeaders];
function makeSheet(name) {
  return {
    getDataRange() { return { getValues() { const width=Math.max(0,...rows[name].map(r=>r.length));return rows[name].map(r=>Array.from({length:width},(_,i)=>r[i]===undefined?"":r[i])); } }; },
    getLastRow() { return rows[name].length; },
    appendRow(row) { rows[name].push(row.slice()); },
    deleteRow(index) { rows[name].splice(index-1,1); },
    getRange(row,col,numRows,numCols) {
      return {
        setValue(value) { while(rows[name].length<row)rows[name].push([]);while(rows[name][row-1].length<col)rows[name][row-1].push("");rows[name][row-1][col-1]=value; },
        setValues(values) { values.forEach((r,ri)=>{while(rows[name].length<row+ri)rows[name].push([]);while(rows[name][row+ri-1].length<col+r.length-1)rows[name][row+ri-1].push("");r.forEach((v,ci)=>rows[name][row+ri-1][col+ci-1]=v);}); }
      };
    }
  };
}
const ss={getSheetByName(name){return rows[name]?makeSheet(name):null;}};
function getOrCreateSheet(database,name){if(!rows[name])rows[name]=[[]];return makeSheet(name);}
let uuid=0,lockBusy=false;
const context={
  SPREADSHEET_ID:"TEST",
  SpreadsheetApp:{openById(){return ss;}},
  LockService:{getScriptLock(){return {waitLock(){if(lockBusy)throw new Error("LOCK_BUSY");},releaseLock(){}};}},
  Utilities:{getUuid(){return "UUID-"+(++uuid);}},
  getOrCreateSheet,
  getVerifiedAccountingIdentity_(p){return {authorized:true,userId:(p&&p._verifiedUserId)||"DIR-1",role:(p&&p._verifiedRole)||"Director"};},
  console,Date,Math,Set,Map,Number,String,Object,Array,JSON,Error
};
vm.createContext(context);
vm.runInContext(names.map(extractFunction).join("\n"),context);
const stops=[
 {id:"origin",parada:"Origen",lat:14.1000,lng:-87.2000,ventanaInicio:"06:30",ventanaFin:"06:45"},
 {id:"far",parada:"Lejana",lat:14.2000,lng:-87.2000,ventanaInicio:"07:10",ventanaFin:"07:40"},
 {id:"near",parada:"Cercana",lat:14.1100,lng:-87.2100,ventanaInicio:"06:40",ventanaFin:"07:10"},
 {id:"school",parada:"Colegio",lat:14.1200,lng:-87.1900,esDestino:true,ventanaInicio:"07:20",ventanaFin:"07:50"}
];
const original=JSON.stringify(stops);
rows.TransporteRutas.push(["R1","Ruta de prueba","BUS-1","DRV-1",20,original,"active","","06:30","07:30","Matutina"]);
const payload={rutaId:"R1",velocidadPromedioKmh:25,horaInicio:"06:30",_verifiedUserId:"DIR-1",_verifiedRole:"Director"};
const proposal=context.optimizeRouteStopsSequence(payload);
assert.equal(proposal.status,"success");
assert.equal(proposal.estado,"PENDIENTE");
assert.equal(rows.TransporteRutas[1][5],original,"optimization must not modify the active route before approval");
assert.ok(proposal.distanciaActualKm>0,"current route distance is reported even when its time windows are invalid");
assert.equal(proposal.ventanasActualesValidas,false);
assert.ok(proposal.distanciaPropuestaKm>0);
assert.ok(proposal.tiempoEstimadoMinutos>0);
assert.equal(proposal.paradasPropuestas[0].id,"origin","first stop remains the fixed route origin");
assert.equal(proposal.paradasPropuestas.at(-1).id,"school","declared destination remains last");
assert.notDeepEqual(proposal.paradasPropuestas.map(x=>x.id),stops.map(x=>x.id),"route optimizer should propose a changed order for the synthetic case");
const listed=context.getRouteOptimizationProposals({...payload,estado:"PENDIENTE"});
assert.equal(listed.total,1);
const approved=context.approveRouteStopsOptimization({propuestaId:proposal.propuestaId,_verifiedUserId:"DIR-1",_verifiedRole:"Director"});
assert.equal(approved.estado,"APROBADA");
assert.notEqual(rows.TransporteRutas[1][5],original,"only explicit approval applies the proposed sequence");
assert.equal(context.approveRouteStopsOptimization({propuestaId:proposal.propuestaId,_verifiedUserId:"DIR-1",_verifiedRole:"Director"}).idempotent,true);
const approvedStops=JSON.parse(rows.TransporteRutas[1][5]);
assert.deepEqual(approvedStops.map(x=>x.orden),[1,2,3,4]);
const stale=context.optimizeRouteStopsSequence(payload);
rows.TransporteRutas[1][5]=JSON.stringify(approvedStops.concat([{id:"extra",parada:"Extra",lat:14.13,lng:-87.18}]));
assert.throws(()=>context.approveRouteStopsOptimization({propuestaId:stale.propuestaId,_verifiedUserId:"DIR-1",_verifiedRole:"Director"}),/ROUTE_OPTIMIZATION_STALE_ROUTE/);
const routeBeforeReject=rows.TransporteRutas[1][5];
const rejected=context.rejectRouteStopsOptimization({propuestaId:stale.propuestaId,motivo:"La propuesta incumple la ventana operativa.",_verifiedUserId:"DIR-1",_verifiedRole:"Director"});
assert.equal(rejected.estado,"RECHAZADA");
assert.equal(rows.TransporteRutas[1][5],routeBeforeReject,"rejection must never modify the active route");
assert.equal(context.rejectRouteStopsOptimization({propuestaId:stale.propuestaId,motivo:"Repetir rechazo.",_verifiedUserId:"DIR-1",_verifiedRole:"Director"}).idempotent,true);
const invalid=JSON.stringify([{id:"a",lat:14,lng:-87},{id:"b",lat:null,lng:""}]);
rows.TransporteRutas.push(["R2","Ruta sin coordenadas","BUS-2","DRV-2",10,invalid,"active","","06:30","07:30","Matutina"]);
assert.throws(()=>context.optimizeRouteStopsSequence({...payload,rutaId:"R2"}),/ROUTE_STOP_COORDINATES_INVALID/);
const impossible=JSON.stringify([{id:"a",lat:14,lng:-87},{id:"b",lat:14.5,lng:-87,ventanaFin:"06:31"}]);
rows.TransporteRutas.push(["R3","Ventana imposible","BUS-3","DRV-3",10,impossible,"active","","06:30","07:30","Matutina"]);
assert.throws(()=>context.optimizeRouteStopsSequence({...payload,rutaId:"R3",velocidadPromedioKmh:20}),/ROUTE_OPTIMIZATION_TIME_WINDOW_CONFLICT/);
assert.throws(()=>context.optimizeRouteStopsSequence({...payload,_verifiedRole:"Estudiante"}),/ROUTE_OPTIMIZATION_ROLE_NOT_ALLOWED/);
lockBusy=true;
assert.throws(()=>context.optimizeRouteStopsSequence({...payload,rutaId:"R1"}),/LOCK_BUSY/);
lockBusy=false;
assert.equal(context.transportOptimizationTime_("06:30 AM"),390);
assert.equal(context.transportOptimizationTime_("12:15 PM"),735);
assert.throws(()=>context.transportOptimizationTime_("25:70"),/ROUTE_OPTIMIZATION_TIME_INVALID/);
console.log("TASK-209 route optimization proposal, time windows, approval and stale-write contract: PASS");
