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
      normalizeString:value=>String(value||"").toLowerCase(),
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
      assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id,_payload,operation)=>{assert.equal(held,true,"request ownership must be revalidated under lock");assert.equal(id,"REQ-DUP");assert.equal(operation,"UPDATE");return {authorized:true,departmentId:"D1"};},
      resolveAcademicAdmissionDepartment_:()=>({authorized:true,departmentId:"D1"}),
      LockService:{getScriptLock:()=>({
        tryLock:()=>{lockAttempts++;if(!lockAvailable)return false;held=true;return true;},
        releaseLock:()=>{assert.equal(held,true);held=false;releases++;}
      })},
      assertResourceOwnershipForScope_:(_ss,_scope,type,id,operation)=>{
        assert.equal(held,true,"destination ownership must be checked within the critical section");ownershipChecks++;
        assert.equal(type,"EXPEDIENTE_ESTUDIANTE");assert.equal(id,"EXP-DEST");assert.equal(operation,"UPDATE");
        return {authorized:destinationAuthorized,departmentId:"D1"};
      },
      getOrCreateSheet:(_ss,name)=>{assert.equal(held,true,"request sheet must be accessed only under lock");if(name==="SolicitudesAdmision")requestReads++;return name==="SolicitudesAdmision"?requestSheet:historySheet;},
      logStructuredEvent:(_service,_fn,_level,code,_message,_data,role)=>{loggedRole=role;if(code==="DUPLICATE_RESOLUTION_HISTORY_FAILED")loggedHistoryFailure=true;},
      Date
    };
    vm.runInNewContext(extractFunction("isAcademicAdmissionManagerRole_")+"\n"+extractFunction("resolveAdmissionDuplicate"),context);
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
      getRange(row,col,numRows,numCols){const self=this;return {
        setValue(value){self.writes.push({row,col,value});self.rows[row-1][col-1]=value;},
        setValues(values){values.forEach((line,r)=>line.forEach((value,cell)=>{self.writes.push({row:row+r,col:col+cell,value});self.rows[row+r-1][col+cell-1]=value;}));}
      };}
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
      normalizeString:value=>String(value||"").toLowerCase(),
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
    vm.runInNewContext("function isAcademicAdmissionManagerRole_(role){return [\"director\",\"administrador\",\"desarrollador\",\"secretaria\"].indexOf(String(role||\"\").toLowerCase())!==-1;}"+extractFunction("resolveAdmissionDuplicate"),context);
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

  const sameDepartment=makeResolutionHarness({lockAvailable:true,destinationDepartment:"D1",role:"Secretaría"});
  const result=sameDepartment.execute();
  assert.equal(result.status,"success");
  const sameState=sameDepartment.state();
  assert.equal(sameState.reads,1);
  assert.equal(sameState.row[14],"EXP-1");
  assert.equal(sameState.writes.length,2,"destination and audit observations are the only request writes");
  assert.equal(sameState.history.length,1);
  assert.equal(sameState.loggedRole,"Secretaría","accented verified manager roles must remain authorized and auditable");
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

// Reopening an admission request is a manager-only, single-shot transition
// protected by ScriptLock and recorded using the canonical entity-history schema.
{
  const historyHeaders=["HistorialID","Fecha","EntidadTipo","EntidadID","Accion","ValorAnteriorJSON","ValorNuevoJSON","UsuarioResponsable","CorrelationID"];
  function runReopen({lockAvailable=true,role="Director",initialStatus="Rechazada",expedienteId="",badHistorySchema=false}={}) {
    let held=false,attempts=0,releases=0,requestChecks=0,requestReads=0,historyReads=0,events=[];
    const requestRows=[["SolicitudID","Fecha","Ano","Grado","Nombres","Apellidos","Identificacion","Nacimiento","Responsable","Telefono","Email","Estado","Canal","Observaciones","ExpedienteID"],
      ["REQ-REOPEN",new Date(),"2026","1","Ana","Prueba","ID-REOPEN","2015-01-01","Tutor","555","a@example.test",initialStatus,"Web","Nota previa",expedienteId]];
    const requestSheet={
      rows:requestRows,
      getDataRange(){requestReads++;const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      getRange(row,col,numRows,numCols){const self=this;return {setValues(values){for(let r=0;r<numRows;r++)for(let c=0;c<numCols;c++)self.rows[row-1+r][col-1+c]=values[r][c];}};}
    };
    const historyRows=badHistorySchema?[["Wrong","Header"]]:[];
    const historySheet={
      rows:historyRows,
      getLastRow(){return this.rows.length;},
      getRange(row,col,numRows,numCols){historyReads++;const self=this;return {getValues(){return [self.rows[row-1].slice(col-1,col-1+numCols)];}};},
      appendRow(row){assert.equal(held,true,"history writes must be inside the reopen lock");this.rows.push(row.slice());}
    };
    const ss={};
    const context={
      getAcademicAdmissionScopeContext_:(_payload,action,id,operation)=>({
        authorized:action==="reopenAdmissionRequest"&&id==="REQ-REOPEN"&&operation==="UPDATE",ss,
        actor:{authorized:true,userId:"MANAGER-VERIFIED",role},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false}
      }),
      assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id,_payload,operation)=>{
        assert.equal(held,true,"request ownership must be revalidated under lock");assert.equal(id,"REQ-REOPEN");assert.equal(operation,"UPDATE");requestChecks++;
        return {authorized:true,departmentId:"D1"};
      },
      LockService:{getScriptLock:()=>({tryLock:()=>{attempts++;if(!lockAvailable)return false;held=true;return true;},releaseLock:()=>{assert.equal(held,true);held=false;releases++;}})},
      getOrCreateSheet:(_ss,name)=>{assert.equal(held,true,"request and history sheets must not be accessed before lock");return name==="SolicitudesAdmision"?requestSheet:historySheet;},
      logStructuredEvent:(_service,_fn,_level,code,_message,data,eventRole)=>events.push({code,data,role:eventRole}),
      Date
    };
    vm.runInNewContext("function isAcademicAdmissionManagerRole_(role){return [\"director\",\"administrador\",\"desarrollador\",\"secretaria\"].indexOf(String(role||\"\").toLowerCase())!==-1;}"+extractFunction("reopenAdmissionRequest"),context);
    return {
      execute:extra=>context.reopenAdmissionRequest(Object.assign({solicitudId:"REQ-REOPEN",motivoReapertura:"Revisión documental adicional justificada"},extra||{})),
      state:()=>({held,attempts,releases,requestChecks,requestReads,historyReads,requestRow:requestSheet.rows[1],historyRows:historySheet.rows,events})
    };
  }
  const reopened=runReopen();
  const result=reopened.execute();
  assert.equal(result.status,"success");assert.equal(result.nuevoEstado,"Reabierta");assert.equal(result.historyRecorded,true);
  let state=reopened.state();
  assert.equal(state.held,false);assert.equal(state.releases,1);assert.equal(state.requestChecks,1);
  assert.equal(state.requestRow[11],"Reabierta");assert.equal(state.requestRow[12],"Web");
  assert.equal(state.requestRow[13].includes("Nota previa | [REAPERTURA"),true);
  assert.equal(JSON.stringify(Array.from(state.historyRows[0])),JSON.stringify(historyHeaders),"history header must use the canonical entity-change schema");
  assert.equal(state.historyRows[1][2],"SolicitudAdmision");assert.equal(state.historyRows[1][3],"REQ-REOPEN");
  assert.equal(state.historyRows[1][7],"MANAGER-VERIFIED");
  assert.throws(()=>reopened.execute(),/RESOURCE_CONFLICT_ADMISSION_ALREADY_REOPENED/);
  assert.equal(reopened.state().historyRows.length,2,"repeat reopening must not duplicate history");

  const busy=runReopen({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.deepEqual({attempts:busy.state().attempts,releases:busy.state().releases,requestReads:busy.state().requestReads,historyReads:busy.state().historyReads},
    {attempts:1,releases:0,requestReads:0,historyReads:0},"lock contention must fail before reading either sheet");

  const nonManager=runReopen({role:"Evaluador"});
  assert.throws(()=>nonManager.execute(),/RESOURCE_NOT_FOUND/);
  assert.deepEqual({attempts:nonManager.state().attempts,requestReads:nonManager.state().requestReads},{attempts:0,requestReads:0});

  const converted=runReopen({initialStatus:"Convertida",expedienteId:"EXP-1"});
  assert.throws(()=>converted.execute(),/RESOURCE_CONFLICT_ADMISSION_ALREADY_CONVERTED/);
  assert.equal(converted.state().requestRow[11],"Convertida");
  const invalidTarget=runReopen();
  assert.throws(()=>invalidTarget.execute({nuevoEstado:"Convertida"}),/ESTADO_REAPERTURA_INVALIDO/);
  assert.equal(invalidTarget.state().attempts,0);

  const badHistory=runReopen({badHistorySchema:true});
  const badResult=badHistory.execute();
  assert.equal(badResult.status,"success");assert.equal(badResult.historyRecorded,false);
  assert.equal(badHistory.state().requestRow[11],"Reabierta");
  assert.equal(badHistory.state().events.some(event=>event.code==="ADMISSION_REOPEN_HISTORY_FAILED"),true);
}

console.log("academic admission reopening ownership, lock and history contracts: PASS");

// Adding a request to the waitlist is single-shot under ScriptLock and
// compensates the appended waitlist row if the admission status write fails.
{
  const waitHeader=["EsperaID","SolicitudID","AnoLectivo","Grado","Posicion","Puntaje","CriteriosJSON","EstadoOferta","FechaExpiracionOferta","JustificacionManual","FechaIngreso","UltimaActualizacion"];
  function makeWaitlistHarness({lockAvailable=true,requestAuthorized=true,requestRows=null,waitRows=null,failStatusWrite=false,failRollback=false}={}) {
    let held=false,attempts=0,releases=0,scopeChecks=0,authorizedIdsChecks=0,reads=0,idCalls=0,events=[];
    const admissions=requestRows||[["SolicitudID","Fecha","Ano","Grado","Nombres","Apellidos","Identificacion","Nacimiento","Responsable","Telefono","Email","Estado","Canal","Observaciones","ExpedienteID"],
      ["REQ-WAIT",new Date(),"2026","1","Ana","Prueba","ID-WAIT","2015-01-01","Tutor","555","a@example.test","Recibida","Web","",""]];
    const admissionSheet={
      rows:admissions,
      getDataRange(){reads++;const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      getRange(row,col){const self=this;return {setValue(value){if(failStatusWrite)throw new Error("status write failed");self.rows[row-1][col-1]=value;}};}
    };
    const waitRowsActual=waitRows||[waitHeader];
    const waitSheet={
      rows:waitRowsActual,
      getDataRange(){reads++;const self=this;return {getValues(){return self.rows.map(row=>row.slice());}};},
      appendRow(row){assert.equal(held,true,"waitlist append must be under lock");this.rows.push(row.slice());},
      getLastRow(){return this.rows.length;},
      deleteRow(row){if(failRollback)throw new Error("rollback failed");this.rows.splice(row-1,1);}
    };
    const ss={};
    const context={
      getAcademicAdmissionScopeContext_:(_payload,action,id,operation)=>({
        authorized:action==="addToWaitlist"&&id==="REQ-WAIT"&&operation==="UPDATE",ss,
        actor:{authorized:true,userId:"MANAGER-WAIT",role:"Director"},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false}
      }),
      LockService:{getScriptLock:()=>({tryLock:()=>{attempts++;if(!lockAvailable)return false;held=true;return true;},releaseLock:()=>{assert.equal(held,true);held=false;releases++;}})},
      assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id,_payload,operation)=>{
        assert.equal(held,true,"request ownership must be revalidated after acquiring lock");assert.equal(id,"REQ-WAIT");assert.equal(operation,"UPDATE");scopeChecks++;
        return {authorized:requestAuthorized,departmentId:"D1"};
      },
      getAuthorizedAdmissionRequestIds_:(_ss,_scope,_payload,operation)=>{
        assert.equal(held,true);assert.equal(operation,"READ");authorizedIdsChecks++;return requestAuthorized?new Set(["REQ-WAIT","REQ-OTHER"]):new Set();
      },
      getOrCreateSheet:(_ss,name)=>{assert.equal(held,true,"admission/waitlist sheets must not be accessed before lock");return name==="SolicitudesAdmision"?admissionSheet:waitSheet;},
      generateInstitutionalId:()=>{assert.equal(held,true,"waitlist ID must be generated under lock");idCalls++;return {generatedId:"ESP-NEW"};},
      logStructuredEvent:(_service,_fn,_level,code,_message,data,role)=>events.push({code,data,role}),
      Date
    };
    vm.runInNewContext(extractFunction("addToWaitlist"),context);
    return {execute:criteria=>context.addToWaitlist({solicitudId:"REQ-WAIT",criteriosJSON:criteria||{tieneHermanosMatriculados:true,esHijoPersonal:true}}),
      state:()=>({held,attempts,releases,scopeChecks,authorizedIdsChecks,reads,idCalls,events,admissionRow:admissionSheet.rows[1],waitRows:waitSheet.rows})};
  }
  const added=makeWaitlistHarness();
  const addedResult=added.execute();
  assert.equal(addedResult.status,"success");assert.equal(addedResult.esperaId,"ESP-NEW");
  let state=added.state();
  assert.equal(state.held,false);assert.equal(state.attempts,1);assert.equal(state.releases,1);
  assert.equal(state.scopeChecks,1);assert.equal(state.authorizedIdsChecks,1);assert.equal(state.idCalls,1);
  assert.equal(state.admissionRow[11],"En_Espera");assert.equal(state.waitRows.length,2);
  assert.equal(state.waitRows[1][4],1);assert.equal(state.waitRows[1][5],90);
  const duplicateResult=added.execute();
  assert.equal(duplicateResult.isExisting,true);assert.equal(duplicateResult.esperaId,"ESP-NEW");
  assert.equal(added.state().waitRows.length,2,"repeat request must reuse the active waitlist entry");

  const busy=makeWaitlistHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(),/Servicio ocupado/);
  assert.deepEqual({reads:busy.state().reads,releases:busy.state().releases,idCalls:busy.state().idCalls},{reads:0,releases:0,idCalls:0});

  const denied=makeWaitlistHarness({requestAuthorized:false});
  assert.throws(()=>denied.execute(),/RESOURCE_NOT_FOUND/);
  assert.equal(denied.state().reads,0);assert.equal(denied.state().idCalls,0);

  const duplicateAdmissionRows=makeWaitlistHarness({requestRows:[
    ["SolicitudID","Fecha","Ano","Grado","Nombres","Apellidos","Identificacion","Nacimiento","Responsable","Telefono","Email","Estado","Canal","Observaciones","ExpedienteID"],
    ["REQ-WAIT",new Date(),"2026","1","Ana","Prueba","ID-1","","Tutor","555","a@b.test","Recibida","Web","",""],
    ["REQ-WAIT",new Date(),"2026","1","Ana","Prueba","ID-1","","Tutor","555","a@b.test","Recibida","Web","",""]
  ]});
  assert.throws(()=>duplicateAdmissionRows.execute(),/RESOURCE_NOT_FOUND/);
  assert.equal(duplicateAdmissionRows.state().waitRows.length,1);

  const activeDuplicates=makeWaitlistHarness({waitRows:[waitHeader,
    ["ESP-1","REQ-WAIT","2026","1",1,10,"{}","En_Espera","","",new Date(),new Date()],
    ["ESP-2","REQ-WAIT","2026","1",2,10,"{}","Plaza_Ofrecida","","",new Date(),new Date()]
  ]});
  assert.throws(()=>activeDuplicates.execute(),/RESOURCE_CONFLICT_WAITLIST_DUPLICATE/);
  assert.equal(activeDuplicates.state().idCalls,0);

  const invalidCriteria=makeWaitlistHarness();
  assert.throws(()=>invalidCriteria.execute({tieneHermanosMatriculados:"true"}),/CRITERIO_LISTA_ESPERA_INVALIDO/);
  assert.equal(invalidCriteria.state().waitRows.length,1);assert.equal(invalidCriteria.state().admissionRow[11],"Recibida");

  const compensated=makeWaitlistHarness({failStatusWrite:true});
  assert.throws(()=>compensated.execute(),/WAITLIST_WRITE_FAILED/);
  assert.equal(compensated.state().waitRows.length,1,"failed admission status write must compensate the appended waitlist row");
  assert.equal(compensated.state().admissionRow[11],"Recibida");
  const failedRollback=makeWaitlistHarness({failStatusWrite:true,failRollback:true});
  assert.throws(()=>failedRollback.execute(),/WAITLIST_WRITE_FAILED/);
  assert.equal(failedRollback.state().events.some(event=>event.code==="WAITLIST_COMPENSATION_FAILED"),true);
}

console.log("academic admission waitlist insertion ownership, idempotency and lock contracts: PASS");

// Waitlist offers resolve only the key columns before request ownership,
// serialize the transition, and avoid replacing an already active offer.
{
  const offerHeader=["EsperaID","SolicitudID","AnoLectivo","Grado","Posicion","Puntaje","CriteriosJSON","EstadoOferta","FechaExpiracionOferta","JustificacionManual","FechaIngreso","UltimaActualizacion"];
  function makeOfferHarness({lockAvailable=true,requestAuthorized=true,status="En_Espera",expiry=null,duplicateId=false}={}) {
    let held=false,attempts=0,releases=0,keyReads=0,fullReads=0,writes=0,ownershipChecks=0,events=[];
    const now=Date.now();
    const row=["ESP-OFFER","REQ-OFFER","2026","1",1,90,"{}",status,expiry,"Nota manual",new Date(now-10000),new Date(now-10000)];
    const rows=[offerHeader,row];
    if(duplicateId)rows.push(["ESP-OFFER","REQ-OTHER","2026","1",2,50,"{}","En_Espera","","",new Date(),new Date()]);
    const sheet={
      rows,
      getLastRow(){return this.rows.length;},
      getRange(rowNumber,column,numRows,numCols){
        const self=this;
        return {
          getValues(){if(column===1&&numCols===2)keyReads++;else if(numCols===12)fullReads++;return Array.from({length:numRows},(_,r)=>self.rows[rowNumber-1+r].slice(column-1,column-1+numCols));},
          setValues(values){writes++;for(let r=0;r<numRows;r++)for(let c=0;c<numCols;c++)self.rows[rowNumber-1+r][column-1+c]=values[r][c];}
        };
      }
    };
    const context={
      getAcademicAdmissionScopeContext_:(_payload,action,id,operation)=>({
        authorized:action==="offerWaitlistSlot"&&id===null&&operation==="UPDATE",ss:{},
        actor:{authorized:true,userId:"MGR-OFFER",role:"Director"},
        scope:{authorized:true,institutionId:"INST-1",departmentIds:["D1"],institutionWide:false}
      }),
      LockService:{getScriptLock:()=>({tryLock:()=>{attempts++;if(!lockAvailable)return false;held=true;return true;},releaseLock:()=>{assert.equal(held,true);held=false;releases++;}})},
      getOrCreateSheet:()=>{assert.equal(held,true,"waitlist sheet must not be accessed before lock");return sheet;},
      assertAcademicAdmissionRequestScopeAccess_:(_ss,_scope,id,_payload,operation)=>{
        assert.equal(held,true,"request ownership must be checked under lock");assert.equal(id,"REQ-OFFER");assert.equal(operation,"UPDATE");ownershipChecks++;
        return {authorized:requestAuthorized,departmentId:"D1"};
      },
      logStructuredEvent:(_service,_fn,_level,code,_message,data,role)=>events.push({code,data,role}),
      Date
    };
    vm.runInNewContext(extractFunction("offerWaitlistSlot"),context);
    return {execute:hours=>context.offerWaitlistSlot({esperaId:"ESP-OFFER",horasVigencia:hours}),
      state:()=>({held,attempts,releases,keyReads,fullReads,writes,ownershipChecks,events,row:sheet.rows[1],rows})};
  }
  const offered=makeOfferHarness();
  const result=offered.execute(48);
  assert.equal(result.status,"success");
  let state=offered.state();
  assert.equal(state.row[7],"Plaza_Ofrecida");assert.equal(state.writes,1);
  assert.equal(state.keyReads,1);assert.equal(state.fullReads,1);assert.equal(state.ownershipChecks,1);
  assert.equal(state.held,false);assert.equal(state.releases,1);
  assert.ok(new Date(state.row[8]).getTime()>Date.now()+47*60*60*1000);
  const repeat=offered.execute(24);
  assert.equal(repeat.isExisting,true,"an active offer must be idempotent");
  assert.equal(offered.state().writes,1,"repeat offer must not reset expiry or emit another write");

  const expired=makeOfferHarness({status:"Plaza_Ofrecida",expiry:new Date(Date.now()-60000)});
  const renewed=expired.execute(24);
  assert.equal(renewed.status,"success");assert.equal(expired.state().row[7],"Plaza_Ofrecida");
  assert.ok(new Date(expired.state().row[8]).getTime()>Date.now());

  const busy=makeOfferHarness({lockAvailable:false});
  assert.throws(()=>busy.execute(72),/Servicio ocupado/);
  assert.deepEqual({keyReads:busy.state().keyReads,fullReads:busy.state().fullReads,writes:busy.state().writes,releases:busy.state().releases},
    {keyReads:0,fullReads:0,writes:0,releases:0});

  const denied=makeOfferHarness({requestAuthorized:false});
  assert.throws(()=>denied.execute(72),/RESOURCE_NOT_FOUND/);
  assert.equal(denied.state().keyReads,1);assert.equal(denied.state().fullReads,0);assert.equal(denied.state().writes,0);

  const ambiguous=makeOfferHarness({duplicateId:true});
  assert.throws(()=>ambiguous.execute(72),/RESOURCE_NOT_FOUND/);
  assert.equal(ambiguous.state().fullReads,0);

  const invalidState=makeOfferHarness({status:"Retirada"});
  assert.throws(()=>invalidState.execute(72),/RESOURCE_CONFLICT_WAITLIST_STATE/);
  assert.equal(invalidState.state().writes,0);
  const invalidExpiry=makeOfferHarness({status:"Plaza_Ofrecida",expiry:"not-a-date"});
  assert.throws(()=>invalidExpiry.execute(72),/RESOURCE_CONFLICT_WAITLIST_EXPIRY_INVALID/);
  const invalidHours=makeOfferHarness();
  assert.throws(()=>invalidHours.execute(-1),/VIGENCIA_OFERTA_INVALIDA/);
  assert.equal(invalidHours.state().attempts,0);
}

console.log("academic admission waitlist offer ownership, state and lock contracts: PASS");
