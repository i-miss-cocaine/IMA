"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/exam-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/exam-service/Code.gs" });
function extractFunction(name) {
  const match = new RegExp("function " + name + "\\s*\\(").exec(source);
  assert.ok(match, "missing function " + name);
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (c === "\\") { escaped = true; continue; }
      if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error("unbalanced function " + name);
}
function makeSheet(rows) { return { rows, getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; } }; }
function fixture(options = {}) {
  const historyRows = [
    ["RECT-1","E-1","STU-1","RECTIFICACION_NOTA",60,80,"Motivo válido de rectificación","PROF-1",new Date("2026-11-10T10:00:00Z")],
    ["RECT-2","E-2","STU-2","RECTIFICACION_NOTA",50,70,"Otro estudiante","PROF-2",new Date("2026-11-10T11:00:00Z")],
    ["RECT-3","E-3","STU-1","REAPERTURA_PERIODO","Cerrado","Reabierto","Reapertura","ADMIN", "bad-date"],
    ["RECT-DUP","E-4","STU-1","RECTIFICACION_NOTA",20,40,"Duplicado A","PROF-1",null],
    ["RECT-DUP","E-5","STU-1","RECTIFICACION_NOTA",30,50,"Duplicado B","PROF-1",null],
    ["","E-6","STU-1","RECTIFICACION_NOTA",20,40,"Sin ID","PROF-1",null],
    ["RECT-NO-EVAL","","STU-1","RECTIFICACION_NOTA",20,40,"Sin evaluación","PROF-1",null],
    ["RECT-BLANK","E-7","STU-1","RECTIFICACION_NOTA",""," ","Vacío","PROF-1",null]
  ];
  const sheets = { Usuarios: makeSheet([["UserID"],["STU-1","One","10","A","","","Estudiante"],
    ["STU-2","Two","10","A","","","Estudiante"],["DUP","A","10","A","","","Estudiante"],
    ["DUP","B","10","A","","","Estudiante"]]) };
  if (!options.missingSheet) sheets.HistorialRectificacionesNotas = makeSheet([
    ["RectificacionID","EvaluacionID","UserID","Accion","NotaAnterior","NotaNueva","Motivo","AutorizadoPor","Fecha"], ...historyRows]);
  const ss = { getSheetByName: name => sheets[name] || null };
  const actor = options.actor || {userId:"STU-1",role:"Estudiante"};
  const context = { actor, ss, scope:{authorized:options.authorized!==false,institutionWide:options.institutionWide!==false},
    guardianActor:options.guardian===true, profile:options.guardian?{userId:"STU-1",role:"Estudiante"}:null };
  let held=false, acquires=0, releases=0;
  const LockService={getScriptLock(){return {tryLock(){acquires++; if(options.beforeAcquire){const cb=options.beforeAcquire;options.beforeAcquire=null;cb();} if(options.lockAvailable===false||held)return false;held=true;return true;},releaseLock(){releases++;held=false;}};}};
  const helpers=["getGradeRectificationHistory","getGradeRectificationHistoryUnlocked_","withAuthorizedExamRead_"].map(extractFunction).join("\n");
  const vmContext={LockService,getAuthorizedExamReadContext_(action){
    if(action!=="getGradeRectificationHistory"||options.permissionDenied||context.scope.authorized!==true)throw new Error("RESOURCE_NOT_AVAILABLE");
    return context;
  },getExamStudentProfile_(spreadsheet,id){
    const rows=spreadsheet.getSheetByName("Usuarios").getDataRange().getValues().slice(1).filter(row=>String(row[0]||"").trim()===id);
    return rows.length===1?{userId:id,role:String(rows[0][6]||"").trim()}:null;
  }};
  vm.runInNewContext(helpers+"\nthis.getGradeRectificationHistory=getGradeRectificationHistory;",vmContext);
  return {call:p=>vmContext.getGradeRectificationHistory(p),sheets,stats:()=>({acquires,releases,held})};
}
const cases=[];
function test(name,fn){fn();cases.push(name);}
function denied(fn,pattern=/RESOURCE_NOT_AVAILABLE/){assert.throws(fn,pattern);}
test("student sees own history only",()=>{const r=fixture().call({});assert.deepEqual(Array.from(r.data,x=>x.userId),["STU-1","STU-1","STU-1"]);});
test("student cannot request another student",()=>denied(()=>fixture().call({userId:"STU-2"})));
test("student may filter own history by evaluation",()=>{const r=fixture().call({evaluacionId:"E-1"});assert.deepEqual(Array.from(r.data,x=>x.rectificacionId),["RECT-1"]);});
test("guardian reads only verified linked student",()=>{const x=fixture({actor:{userId:"GUARD-1",role:"Tutor"},guardian:true});assert.equal(x.call({userId:"STU-1"}).data.length,3);});
test("guardian cannot change linked student",()=>denied(()=>fixture({actor:{userId:"GUARD-1",role:"Tutor"},guardian:true}).call({userId:"STU-2"})));
test("guardian without verified relationship is denied",()=>denied(()=>fixture({actor:{userId:"GUARD-1",role:"Tutor"}}).call({userId:"STU-1"})));
test("institution role requires institution-wide scope",()=>denied(()=>fixture({actor:{userId:"ADMIN",role:"Administrador"},institutionWide:false}).call({userId:"STU-1"})));
test("institution role requires explicit target",()=>denied(()=>fixture({actor:{userId:"ADMIN",role:"Administrador"}}).call({})));
test("institution role reads one unique student",()=>assert.equal(fixture({actor:{userId:"ADMIN",role:"Administrador"}}).call({userId:"STU-1"}).data.length,3));
test("teacher direct access is denied in favor of gradebook assignment controls",()=>denied(()=>fixture({actor:{userId:"PROF-1",role:"Profesor"}}).call({userId:"STU-1"})));
test("unknown role denied",()=>denied(()=>fixture({actor:{userId:"OTHER",role:"Coordinador"}}).call({userId:"STU-1"})));
test("RBAC denial fails closed",()=>denied(()=>fixture({permissionDenied:true}).call({})));
test("unauthorized scope denied",()=>denied(()=>fixture({authorized:false}).call({})));
test("lock timeout fails closed",()=>{const x=fixture({lockAvailable:false});denied(()=>x.call({}),/EXAM_READ_LOCK_TIMEOUT/);assert.deepEqual(x.stats(),{acquires:1,releases:0,held:false});});
test("lock released after successful read",()=>{const x=fixture();x.call({});assert.deepEqual(x.stats(),{acquires:1,releases:1,held:false});});
test("missing history sheet returns empty without creating it",()=>{const x=fixture({missingSheet:true});assert.deepEqual(x.call({}),{status:"success",data:[]});assert.equal(x.sheets.HistorialRectificacionesNotas,undefined);});
test("duplicate and empty rectification IDs excluded",()=>{const r=fixture().call({});assert.ok(!r.data.some(x=>x.rectificacionId==="RECT-DUP"||!x.rectificacionId));});
test("empty evaluation IDs excluded",()=>assert.ok(!fixture().call({}).data.some(x=>!x.evaluacionId)));
test("invalid dates normalized to null",()=>assert.equal(fixture().call({}).data.find(x=>x.rectificacionId==="RECT-3").fecha,null));
test("empty or nonnumeric grade values normalized to null",()=>{const x=fixture().call({}).data.find(y=>y.rectificacionId==="RECT-BLANK");assert.equal(x.notaAnterior,null);assert.equal(x.notaNueva,null);});
test("duplicate student identity denied",()=>denied(()=>fixture({actor:{userId:"DUP",role:"Estudiante"}}).call({})));
test("incompatible schema fails closed",()=>{const x=fixture();x.sheets.HistorialRectificacionesNotas.rows[0][0]="Wrong";denied(()=>x.call({}),/GRADE_RECTIFICATION_HISTORY_SCHEMA_INVALID/);});
test("snapshot is read after acquiring lock",()=>{let x;x=fixture({beforeAcquire(){x.sheets.HistorialRectificacionesNotas.rows.push(["RECT-LATE","E-8","STU-1","RECTIFICACION_NOTA",1,2,"late","P",null]);}});assert.ok(x.call({}).data.some(y=>y.rectificacionId==="RECT-LATE"));});
test("student roles have explicit RBAC permission for own history",()=>{assert.match(source,/"Estudiante": \[[\s\S]*?"getGradeRectificationHistory"/);assert.match(source,/"Alumno": \[[\s\S]*?"getGradeRectificationHistory"/);});
test("guardian roles have explicit RBAC permission for linked history",()=>{for(const role of ["Padre","Tutor","Responsable"])assert.match(source,new RegExp('"'+role+'": \\[.*?"getGradeRectificationHistory"'));});
test("teacher RBAC does not grant direct history access",()=>{const block=/"Profesor": \[([\s\S]*?)\n  \],/.exec(source);assert.ok(block);assert.ok(!block[1].includes('"getGradeRectificationHistory"'));});
process.stdout.write("exam-service-grade-rectification-history-security: PASS ("+cases.length+" scenarios)\n");
