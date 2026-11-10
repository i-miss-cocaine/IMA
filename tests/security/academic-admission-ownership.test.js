const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  const block = source.slice(start, next === -1 ? source.length : next);
  let close = block.indexOf("\n}\n");
  if (close === -1) close = block.lastIndexOf("\n}");
  assert.notEqual(close, -1, "unterminated function " + name);
  return block.slice(0, close + 2);
}
function hasGuard(name, guard) {
  assert.ok(extractFunction(name).includes(guard), name + " must enforce " + guard);
}

for (const name of ["getAdmissionEvaluations","getAdmissionInterviews","saveAdmissionEvaluation","scheduleAdmissionInterview","recordInterviewOutcome","getAdmissionAnalyticsReport","addToWaitlist","getWaitlist","reorderWaitlist","offerWaitlistSlot","reopenAdmissionRequest","resolveAdmissionDuplicate","convertAdmissionToStudent"]) {
  hasGuard(name, "getAcademicAdmissionScopeContext_");
}
hasGuard("getAdmissionEvaluations", "getAuthorizedAdmissionRequestIds_");
hasGuard("getAdmissionInterviews", "getAuthorizedAdmissionRequestIds_");
hasGuard("getAdmissionAnalyticsReport", "getAuthorizedAdmissionRequestIds_");
hasGuard("getWaitlist", "getAuthorizedAdmissionRequestIds_");
hasGuard("convertAdmissionToStudent", "registerAcademicResourceOwnership_");
hasGuard("convertAdmissionToStudent", "SOLICITUD_ADMISION");
hasGuard("convertAdmissionToStudent", "EXPEDIENTE_ESTUDIANTE");
hasGuard("convertAdmissionToStudent", "deleteAcademicResourceOwnership_");
assert.ok(extractFunction("convertAdmissionToStudent").includes("DOCUMENT_VALIDATION_FAILED"), "document validation must fail closed");
assert.ok(extractFunction("convertAdmissionToStudent").includes("CAPACITY_VALIDATION_FAILED"), "capacity validation must fail closed");
hasGuard("resolveAdmissionDuplicate", "assertResourceOwnershipForScope_");
assert.ok(extractFunction("updateAdmissionStatus").includes("Object.assign({}, payload || {}, { solicitudId: solicitudId })"), "internal admission reads must preserve verified session context");

// Exercise department selection rules.
const departmentCode = extractFunction("resolveAcademicAdmissionDepartment_");
const context = {};
vm.runInNewContext(departmentCode, context);
assert.equal(context.resolveAcademicAdmissionDepartment_({}, {authorized:true,departmentIds:["D1"]}, {departmentId:"D1"}).departmentId, "D1");
assert.equal(context.resolveAcademicAdmissionDepartment_({departmentId:"D2"}, {authorized:true,institutionWide:true,departmentIds:[]}, {code:"INSTITUTION_UNASSIGNED"}).departmentId, "D2");
assert.equal(context.resolveAcademicAdmissionDepartment_({}, {authorized:true,institutionWide:true,departmentIds:[]}, {code:"INSTITUTION_UNASSIGNED"}).code, "RESOURCE_DEPARTMENT_SELECTION_REQUIRED");
assert.equal(context.resolveAcademicAdmissionDepartment_({departmentId:"D2"}, {authorized:true,departmentIds:["D1"]}, {departmentId:"D1"}).authorized, false);

// Exercise idempotent and fail-closed ResourceOwnership registration.
const registerCode = extractFunction("registerAcademicResourceOwnership_");
const headers = ["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","CreatedBy","CreatedAt","UpdatedAt"];
const rows = [headers.slice()];
const sheet = {
  getLastRow: () => rows.length,
  getRange: (row,col,numRows,numCols) => ({ getValues: () => [rows[row-1].slice(col-1,col-1+numCols)] }),
  getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
  appendRow: row => rows.push(row.slice()),
  deleteRow: row => rows.splice(row-1,1)
};
const ss = { getSheetByName: () => sheet, insertSheet: () => sheet };
const registerContext = {
  getDynamicPermissionsForRole: () => true,
  Utilities: { getUuid: () => "OWN-1" },
  Date
};
vm.runInNewContext(registerCode, registerContext);
const scope = {authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false,role:"Director",userId:"U-DIR"};
const first = registerContext.registerAcademicResourceOwnership_(ss,scope,"SOLICITUD_ADMISION","REQ-1","D1","U-DIR");
assert.equal(first.authorized,true);
assert.equal(first.created,true);
const second = registerContext.registerAcademicResourceOwnership_(ss,scope,"SOLICITUD_ADMISION","REQ-1","D1","U-DIR");
assert.equal(second.authorized,true);
assert.equal(second.existing,true);
const multiScope = {authorized:true,institutionId:"INST-1",departmentIds:["D1","D2"],institutionWide:false,role:"Director",userId:"U-DIR"};
const conflict = registerContext.registerAcademicResourceOwnership_(ss,multiScope,"SOLICITUD_ADMISION","REQ-1","D2","U-DIR");
assert.equal(conflict.authorized,false);
assert.equal(conflict.code,"RESOURCE_OWNERSHIP_CONFLICT");
rows.push(["OWN-2","INST-1","SOLICITUD_ADMISION","REQ-2","D1","ACTIVE","U-DIR",new Date(),new Date()]);
rows.push(["OWN-3","INST-1","SOLICITUD_ADMISION","REQ-2","D1","ACTIVE","U-DIR",new Date(),new Date()]);
const ambiguous = registerContext.registerAcademicResourceOwnership_(ss,scope,"SOLICITUD_ADMISION","REQ-2","D1","U-DIR");
assert.equal(ambiguous.authorized,false);
assert.equal(ambiguous.code,"RESOURCE_OWNERSHIP_AMBIGUOUS");

console.log("academic admission ownership contract: PASS");

// Interview scheduling serializes the overlap check and append; result updates
// verify the request scope before reading interview details.
{
  const interviewHeader=["EntrevistaID","SolicitudID","Fecha","HoraInicio","HoraFin","EvaluadorUserID","Lugar","Modalidad","Estado","Observaciones","Creada"] ;
  function makeInterviewSheet(rows) {
    return {
      rows:rows.map(row=>row.slice()),
      getLastRow(){return this.rows.length;},
      getDataRange(){const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      getRange(row,col,numRows,numCols){
        const self=this;
        return {
          getValues(){return Array.from({length:numRows},(_,r)=>self.rows[row-1+r].slice(col-1,col-1+numCols));},
          setValue(value){self.rows[row-1][col-1]=value;}
        };
      },
      appendRow(row){this.rows.push(row.slice());}
    };
  }
  const existing=["ENT-1","REQ-1","2026-11-11","09:00","10:00","EVAL-1","Campus","Presencial","Programada","","created"];
  const sheet=makeInterviewSheet([interviewHeader,existing]);
  let lockHeld=false,lockAttempts=0,releases=0,sheetReads=0;
  const scheduleContext={
    getAcademicAdmissionScopeContext_:(_payload,action,requestId,operation)=>({
      authorized:action==="scheduleAdmissionInterview"&&requestId==="REQ-2"&&operation==="UPDATE",
      ss:{},actor:{authorized:true,userId:"EVAL-1",role:"Evaluador"},
      scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},
      requestAccess:{authorized:true,departmentId:"D1"}
    }),
    LockService:{getScriptLock:()=>({
      tryLock:()=>{lockAttempts++;lockHeld=true;return true;},
      releaseLock:()=>{assert.equal(lockHeld,true);lockHeld=false;releases++;}
    })},
    getOrCreateSheet:()=>{assert.equal(lockHeld,true,"interview rows must be read only while the scheduling lock is held");sheetReads++;return sheet;},
    generateInstitutionalId:()=>{assert.equal(lockHeld,true);return {generatedId:"ENT-NEW"};},
    logStructuredEvent:()=>{},Date
  };
  vm.runInNewContext(extractFunction("scheduleAdmissionInterview"),scheduleContext);
  assert.throws(()=>scheduleContext.scheduleAdmissionInterview({
    solicitudId:"REQ-2",fecha:"2026-11-11",horaInicio:"09:30",horaFin:"10:30",evaluadorUserId:"EVAL-1"
  }),/Conflicto de horario/,"overlapping interviews for the same evaluator must be rejected");
  assert.equal(sheet.rows.length,2,"conflicting schedule must not append an interview");
  assert.equal(lockHeld,false,"the scheduling lock must be released after a conflict");
  const scheduled=scheduleContext.scheduleAdmissionInterview({
    solicitudId:"REQ-2",fecha:"2026-11-11",horaInicio:"10:00",horaFin:"11:00",evaluadorUserId:"EVAL-1"
  });
  assert.equal(scheduled.entrevistaId,"ENT-NEW","non-overlapping adjacent interval must be schedulable");
  assert.equal(sheet.rows.length,3);
  assert.equal(lockHeld,false);
  assert.equal(lockAttempts,2);
  assert.equal(releases,2);
  assert.equal(sheetReads,2);

  function runOutcome(requestAuthorized) {
    const outcomeSheet=makeInterviewSheet([interviewHeader,["ENT-OUT","REQ-OUT","2026-11-12","12:00","13:00","EVAL-OUT","Campus","Presencial","Programada","Nota privada","created"]]);
    let contextVerified=false,scopeVerified=false,fullRowReads=0,writes=0,held=false,released=0;
    const context={
      getAcademicAdmissionScopeContext_:(_payload,action,requestId,operation)=>{
        assert.equal(action,"recordInterviewOutcome");assert.equal(requestId,null);assert.equal(operation,"UPDATE");
        contextVerified=true;
        return {authorized:true,ss:{},actor:{authorized:true,userId:"EVAL-OUT",role:"Evaluador"},
          scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false}};
      },
      LockService:{getScriptLock:()=>({tryLock:()=>{held=true;return true;},releaseLock:()=>{held=false;released++;}})},
      getOrCreateSheet:()=>{assert.equal(contextVerified,true,"identity/scope must be verified before resolving interview IDs");return outcomeSheet;},
      assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id,_payload,operation)=>{
        assert.equal(id,"REQ-OUT");assert.equal(operation,"UPDATE");scopeVerified=true;return {authorized:requestAuthorized};
      },
      isAcademicAdmissionManagerRole_:()=>false
    };
    const originalGetRange=outcomeSheet.getRange.bind(outcomeSheet);
    outcomeSheet.getRange=(row,col,numRows,numCols)=>{
      if(row===2&&col===1&&numRows===1&&numCols===11){
        assert.equal(scopeVerified,true,"request ownership must pass before reading interview details");fullRowReads++;
      }
      const range=originalGetRange(row,col,numRows,numCols);
      const originalSet=range.setValue;
      range.setValue=value=>{writes++;return originalSet(value);};
      return range;
    };
    vm.runInNewContext(extractFunction("recordInterviewOutcome"),context);
    return {
      execute:()=>context.recordInterviewOutcome({entrevistaId:"ENT-OUT",estado:"Realizada",observaciones:"Evaluación completada"}),
      state:()=>({contextVerified,scopeVerified,fullRowReads,writes,held,released,row:outcomeSheet.rows[1]})
    };
  }
  const denied=runOutcome(false);
  assert.throws(()=>denied.execute(),/RESOURCE_NOT_FOUND/);
  assert.deepEqual({...denied.state(),row:undefined},{contextVerified:true,scopeVerified:true,fullRowReads:0,writes:0,held:false,released:1,row:undefined},
    "out-of-scope interview must not read private details or mutate status/observations");
  const allowed=runOutcome(true);
  const result=allowed.execute();
  assert.equal(result.status,"success");
  const state=allowed.state();
  assert.equal(state.fullRowReads,1);
  assert.equal(state.writes,2);
  assert.equal(state.held,false);
  assert.equal(state.released,1);
  assert.equal(state.row[8],"Realizada");
  assert.equal(state.row[9],"Nota privada | [Realizada]: Evaluación completada");
}

console.log("academic admission interview ownership and lock contracts: PASS");

// A contending schedule request must fail before checking or appending interview rows.
{
  let reads=0,appends=0,releases=0;
  const busySheet={getDataRange:()=>{reads++;return {getValues:()=>[[]]};},appendRow:()=>{appends++;}};
  const context={
    getAcademicAdmissionScopeContext_:()=>({authorized:true,ss:{},actor:{authorized:true,userId:"EVAL-BUSY",role:"Evaluador"},
      scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},requestAccess:{authorized:true,departmentId:"D1"}}),
    LockService:{getScriptLock:()=>({tryLock:()=>false,releaseLock:()=>{releases++;}})},
    getOrCreateSheet:()=>busySheet,
    generateInstitutionalId:()=>({generatedId:"SHOULD-NOT-EXIST"}),
    logStructuredEvent:()=>{}
  };
  vm.runInNewContext(extractFunction("scheduleAdmissionInterview"),context);
  assert.throws(()=>context.scheduleAdmissionInterview({solicitudId:"REQ-BUSY",fecha:"2026-11-13",
    horaInicio:"09:00",horaFin:"10:00",evaluadorUserId:"EVAL-BUSY"}),/Servicio ocupado/);
  assert.deepEqual({reads,appends,releases},{reads:0,appends:0,releases:0},
    "a schedule request that cannot acquire the lock must not inspect or append interviews");
}

// Admission evaluations are append-only records: serialize ID generation and
// append, and log the verified actor role rather than a caller-supplied role.
{
  function runEvaluation(lockAvailable) {
    let held=false,reads=0,appends=0,releases=0,loggedRole="";
    const rows=[];
    const sheet={
      appendRow(row){assert.equal(held,true,"evaluation append must occur while the script lock is held");appends++;rows.push(row.slice());}
    };
    const context={
      getAcademicAdmissionScopeContext_:(_payload,action,id,operation)=>({
        authorized:action==="saveAdmissionEvaluation"&&id==="REQ-EVAL"&&operation==="UPDATE",
        ss:{},actor:{authorized:true,userId:"EVAL-VERIFIED",role:"Evaluador"},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},
        requestAccess:{authorized:true,departmentId:"D1"}
      }),
      LockService:{getScriptLock:()=>({
        tryLock:()=>{if(!lockAvailable)return false;held=true;return true;},
        releaseLock:()=>{assert.equal(held,true);held=false;releases++;}
      })},
      getOrCreateSheet:()=>{assert.equal(held,true,"evaluation sheet must not be accessed before acquiring the lock");reads++;return sheet;},
      generateInstitutionalId:()=>{assert.equal(held,true);return {generatedId:"EVAL-LOCK-1"};},
      logStructuredEvent:(_service,_fn,_level,_code,_message,_data,role)=>{loggedRole=role;},
      Date
    };
    vm.runInNewContext(extractFunction("saveAdmissionEvaluation"),context);
    return {
      execute:()=>context.saveAdmissionEvaluation({solicitudId:"REQ-EVAL",tipoEvaluacion:"Academica",dictamen:"Aprobado",
        puntajeNum:90,rubricaJSON:{criterio:"lectura"},observaciones:"Correcto",authRole:"Director"}),
      state:()=>({held,reads,appends,releases,loggedRole,rows})
    };
  }
  const saved=runEvaluation(true);
  const result=saved.execute();
  assert.equal(result.status,"success");
  assert.equal(result.evaluacionId,"EVAL-LOCK-1");
  const state=saved.state();
  assert.equal(state.held,false);
  assert.equal(state.reads,1);
  assert.equal(state.appends,1);
  assert.equal(state.releases,1);
  assert.equal(state.rows[0][7],"EVAL-VERIFIED","evaluator identity must come from the verified actor");
  assert.equal(state.loggedRole,"Evaluador","audit role must come from verified identity, not payload.authRole");
  const busy=runEvaluation(false);
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.deepEqual(busy.state(),{held:false,reads:0,appends:0,releases:0,loggedRole:"",rows:[]},
    "a contending evaluation request must fail before reading or appending records");
}

console.log("academic admission evaluation identity and lock contracts: PASS");

// Duplicate decisions must be serialized, ownership-checked and single-shot.
{
  const requestHeader=Array.from({length:15},(_,i)=>"H"+(i+1));
  function makeRequestSheet(observations="",expedienteId="") {
    const row=["REQ-DUP",new Date(),"2026","1ro","Ana","Prueba","ID-1","2015-01-01","Tutor","555","a@example.test","Recibida","Web",observations,expedienteId];
    const rows=[requestHeader,row];
    return {
      rows,
      getDataRange(){return {getValues:()=>rows.map(r=>r.slice())};},
      getRange(rowNumber,column,numRows=1,numCols=1){
        return {
          setValue(value){rows[rowNumber-1][column-1]=value;},
          setValues(values){for(let r=0;r<numRows;r++)for(let c=0;c<numCols;c++)rows[rowNumber-1+r][column-1+c]=values[r][c];}
        };
      }
    };
  }
  function runResolution({resolution="AprobarNuevo",lockAvailable=true,destinationAuthorized=true,alreadyResolved=false,historyFails=false,initialExpediente=""}={}) {
    let held=false,lockAttempts=0,releases=0,requestReads=0,ownershipChecks=0,historyWrites=0,loggedRole="",loggedHistoryFailure=false;
    const requestSheet=makeRequestSheet(alreadyResolved?"[DUPLICADO_RESUELTO: anterior]":"",initialExpediente);
    const historySheet={appendRow(){assert.equal(held,true,"history append must be protected by the resolution lock");if(historyFails)throw new Error("history unavailable");historyWrites++;}};
    const ss={getSheetByName:name=>name==="SolicitudesAdmision"?requestSheet:name==="HistorialCambiosEntidad"?historySheet:null};
    const context={
      getAcademicAdmissionScopeContext_:(payload,action,id,operation)=>({
        authorized:action==="resolveAdmissionDuplicate"&&id==="REQ-DUP"&&operation==="UPDATE",ss,
        actor:{authorized:true,userId:"USER-VERIFIED",role:"Director"},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false},
        requestAccess:{authorized:true,departmentId:"D1"}
      }),
      LockService:{getScriptLock:()=>({
        tryLock:()=>{lockAttempts++;if(!lockAvailable)return false;held=true;return true;},
        releaseLock:()=>{assert.equal(held,true);held=false;releases++;}
      })},
      assertResourceOwnershipForScope_:(_ss,_scope,type,id,operation)=>{
        assert.equal(held,true,"destination ownership must be checked within the critical section");ownershipChecks++;
        assert.equal(type,"EXPEDIENTE_ESTUDIANTE");assert.equal(id,"EXP-DEST");assert.equal(operation,"UPDATE");
        return {authorized:destinationAuthorized};
      },
      getOrCreateSheet:(_ss,name)=>{assert.equal(held,true,"request sheet must be accessed only under lock");if(name==="SolicitudesAdmision")requestReads++;return name==="SolicitudesAdmision"?requestSheet:historySheet;},
      logStructuredEvent:(_service,_fn,_level,code,_message,_data,role)=>{loggedRole=role;if(code==="DUPLICATE_RESOLUTION_HISTORY_FAILED")loggedHistoryFailure=true;},
      Date
    };
    vm.runInNewContext(extractFunction("resolveAdmissionDuplicate"),context);
    return {
      execute:()=>context.resolveAdmissionDuplicate({solicitudId:"REQ-DUP",resolucion:resolution,
        expedienteDestinoId:resolution==="VincularExistente"?"EXP-DEST":undefined,
        motivoJustificado:"Validación documental confirmada",authRole:"Estudiante"}),
      state:()=>({held,lockAttempts,releases,requestReads,ownershipChecks,historyWrites,loggedRole,loggedHistoryFailure,row:requestSheet.rows[1]})
    };
  }
  const approved=runResolution();
  const approvedResult=approved.execute();
  assert.equal(approvedResult.status,"success");
  let state=approved.state();
  assert.equal(state.held,false);assert.equal(state.lockAttempts,1);assert.equal(state.releases,1);
  assert.equal(state.requestReads,1);assert.equal(state.historyWrites,1);
  assert.equal(state.row[13].includes("DUPLICADO_RESUELTO: Aprobado como nuevo postulante"),true);
  assert.equal(state.row[11],"Recibida","AprobarNuevo must preserve the existing request status");
  assert.equal(state.loggedRole,"Director","audit role must come from verified actor");
  assert.throws(()=>approved.execute(),/RESOURCE_CONFLICT_ALREADY_RESOLVED/,"a second decision must not overwrite the first");
  assert.equal(approved.state().historyWrites,1);

  const linked=runResolution({resolution:"VincularExistente"});
  const linkedResult=linked.execute();
  assert.equal(linkedResult.status,"success");
  state=linked.state();
  assert.equal(state.ownershipChecks,1);assert.equal(state.row[14],"EXP-DEST");
  assert.equal(state.row[13].includes("Vinculado a expediente EXP-DEST"),true);

  const rejected=runResolution({resolution:"RechazarDuplicado"});
  rejected.execute();
  state=rejected.state();
  assert.equal(state.row[11],"Rechazada");
  assert.equal(state.row[12],"Web");
  assert.equal(state.row[13].includes("Rechazada por duplicidad"),true);

  const busy=runResolution({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  state=busy.state();
  assert.deepEqual({held:state.held,releases:state.releases,requestReads:state.requestReads,historyWrites:state.historyWrites},
    {held:false,releases:0,requestReads:0,historyWrites:0},"lock contention must not read or mutate request records");

  const denied=runResolution({resolution:"VincularExistente",destinationAuthorized:false});
  assert.throws(()=>denied.execute(),/RESOURCE_NOT_FOUND/);
  state=denied.state();
  assert.equal(state.requestReads,0);assert.equal(state.historyWrites,0);assert.equal(state.row[14],"");
  assert.equal(state.releases,1);

  const duplicate=runResolution({alreadyResolved:true});
  assert.throws(()=>duplicate.execute(),/RESOURCE_CONFLICT_ALREADY_RESOLVED/);
  assert.equal(duplicate.state().historyWrites,0);
  const linkedConflict=runResolution({resolution:"VincularExistente",initialExpediente:"EXP-OTHER"});
  assert.throws(()=>linkedConflict.execute(),/RESOURCE_CONFLICT_EXPEDIENTE_ALREADY_LINKED/);
  assert.equal(linkedConflict.state().historyWrites,0);

  const historyFailure=runResolution({historyFails:true});
  const historyResult=historyFailure.execute();
  assert.equal(historyResult.status,"success");
  assert.equal(historyResult.historyRecorded,false);
  assert.equal(historyFailure.state().loggedHistoryFailure,true,"failed history append must be surfaced in the structured audit log");
}

console.log("academic admission duplicate resolution ownership and concurrency contracts: PASS");


// Duplicate resolution requires a verified manager, serializes read/validate/write,
// and never links an admission request to an expediente in another department.
{
  const requestHeader=["SolicitudID","Fecha","Ano","Grado","Nombres","Apellidos","Identificacion","Nacimiento","Responsable","Telefono","Email","Estado","Canal","Observaciones","ExpedienteID"];
  function makeRequestSheet() {
    return {
      rows:[requestHeader,["REQ-DUP","2026-11-10","2026","1","Aspirante","Prueba","ID-1","","Responsable","000","a@b.test","EnRevision","Web","Observación previa",""]],
      reads:0,writes:[],
      getDataRange(){this.reads++;const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      getRange(row,col){const self=this;return {setValue(value){self.writes.push({row,col,value});self.rows[row-1][col-1]=value;}};}
    };
  }
  function makeResolutionHarness(options) {
    const requests=makeRequestSheet(),history={appended:[],appendRow(row){this.appended.push(row.slice());}};
    let held=false,attempts=0,releases=0,requestChecks=0,destinationChecks=0,loggedRole="";
    const context={
      getAcademicAdmissionScopeContext_:()=>({
        authorized:true,ss:{},actor:{authorized:true,userId:"MGR-1",role:options.role||"Director"},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1","D2"],institutionWide:false}
      }),
      isAcademicAdmissionManagerRole_:role=>["director","administrador","desarrollador","secretaria"].includes(String(role).toLowerCase()),
      LockService:{getScriptLock:()=>({tryLock:()=>{attempts++;if(!options.lockAvailable)return false;held=true;return true;},
        releaseLock:()=>{assert.equal(held,true);held=false;releases++;}})},
      assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id,payload,operation)=>{
        assert.equal(held,true,"request ownership must be revalidated inside the lock");
        assert.equal(id,"REQ-DUP");assert.equal(payload,null);assert.equal(operation,"UPDATE");requestChecks++;
        return options.requestAccess||{authorized:true,departmentId:"D1"};
      },
      resolveAcademicAdmissionDepartment_:(_payload,_scope,access)=>{
        assert.equal(held,true);return {authorized:true,departmentId:access.departmentId||"D1"};
      },
      assertResourceOwnershipForScope_:(_ss,_scope,type,id,operation,payload)=>{
        assert.equal(held,true,"destination ownership must be checked under the lock");
        assert.equal(type,"EXPEDIENTE_ESTUDIANTE");assert.equal(id,"EXP-1");
        assert.equal(operation,"UPDATE");assert.equal(payload,null);destinationChecks++;
        return {authorized:true,departmentId:options.destinationDepartment||"D1"};
      },
      getOrCreateSheet:(_ss,name)=>{
        assert.equal(held,true,"request/history sheets must not be accessed before lock acquisition");
        return name==="SolicitudesAdmision"?requests:history;
      },
      logStructuredEvent:(_service,_fn,_level,_code,_message,_data,role)=>{loggedRole=role;},
      Date
    };
    vm.runInNewContext(extractFunction("resolveAdmissionDuplicate"),context);
    return {execute:()=>context.resolveAdmissionDuplicate({solicitudId:"REQ-DUP",resolucion:"VincularExistente",
      expedienteDestinoId:"EXP-1",motivoJustificado:"Coincidencia confirmada documentalmente"}),
      state:()=>({held,attempts,releases,requestChecks,destinationChecks,reads:requests.reads,writes:requests.writes,
        history:history.appended,loggedRole,row:requests.rows[1]})};
  }

  const crossDepartment=makeResolutionHarness({lockAvailable:true,destinationDepartment:"D2"});
  assert.throws(()=>crossDepartment.execute(),/RESOURCE_SCOPE_DENIED/);
  const crossState=crossDepartment.state();
  assert.equal(crossState.reads,0,"cross-department destination must be rejected before reading/writing the request");
  assert.equal(crossState.writes.length,0);
  assert.equal(crossState.history.length,0);
  assert.equal(crossState.held,false);
  assert.equal(crossState.releases,1);

  const sameDepartment=makeResolutionHarness({lockAvailable:true,destinationDepartment:"D1"});
  const result=sameDepartment.execute();
  assert.equal(result.status,"success");
  const sameState=sameDepartment.state();
  assert.equal(sameState.reads,1);
  assert.equal(sameState.row[14],"EXP-1");
  assert.equal(sameState.writes.length,2,"destination and audit observations are the only request writes");
  assert.equal(sameState.history.length,1);
  assert.equal(sameState.loggedRole,"Director");
  assert.equal(sameState.held,false);
  assert.equal(sameState.releases,1);

  const busy=makeResolutionHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.deepEqual({reads:busy.state().reads,writes:busy.state().writes.length,releases:busy.state().releases},
    {reads:0,writes:0,releases:0},"contending resolution must fail before any sheet access");

  const nonManager=makeResolutionHarness({lockAvailable:true,role:"Evaluador"});
  assert.throws(()=>nonManager.execute(),/AUTH_PERMISSION_DENIED/);
  assert.deepEqual({attempts:nonManager.state().attempts,reads:nonManager.state().reads},
    {attempts:0,reads:0},"non-manager role must be rejected before acquiring the lock");
}

console.log("academic admission duplicate resolution ownership, role and lock contracts: PASS");
