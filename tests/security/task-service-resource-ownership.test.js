const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(root,"backend/task-service/Code.gs"),"utf8");
new vm.Script(source,{filename:"backend/task-service/Code.gs"});
function extractFunction(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"function exists: "+name);const open=source.indexOf("{",start);let depth=0,quote=null,escaped=false,line=false,block=false;for(let i=open;i<source.length;i++){const ch=source[i],next=source[i+1];if(line){if(ch==="\n")line=false;continue;}if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}if(ch==="/"&&next==="/"){line=true;i++;continue;}if(ch==="/"&&next==="*"){block=true;i++;continue;}if(ch==="'"||ch==='"'||ch==="\x60"){quote=ch;continue;}if(ch==="{")depth++;else if(ch==="}"&&--depth===0)return source.slice(start,i+1);}throw Error("unbalanced "+name);}
const headers=["OwnershipID","InstitutionID","ResourceType","ResourceID","DepartmentID","Status","RegisteredBy","CreatedAt","UpdatedAt"];
function sheet(rows){return {rows,getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),getRange:(r,c,n,m)=>({getValues:()=>rows.slice(r-1,r-1+(n||1)).map(x=>x.slice(c-1,c-1+(m||1))),setValue:v=>{rows[r-1][c-1]=v;}}),appendRow:r=>rows.push(r.slice())};}
function fixture(owners,scopes){const own=sheet([headers,...owners]),assign=sheet([["AsignacionAmbitoID","UserID","RoleID","ScopeType","ScopeValues","Estado","CreadoPor","FechaCreacion","FechaInicio","FechaFin","EsSuplente","SuplenteDeUserID"],...scopes]),ss={getSheetByName:n=>n==="ResourceOwnership"?own:n==="AsignacionesAmbitosRoles"?assign:null,insertSheet:n=>{if(n!=="ResourceOwnership")throw Error("unexpected sheet");return own;}};const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==="IMA_INSTITUTION_ID"?"INST-1":null})},SpreadsheetApp:{openById:()=>ss},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},Utilities:{getUuid:()=>"UUID-1"},getDynamicPermissionsForRole:(r,a)=>r==="Administrador"&&a==="registerResourceOwnership",verifySessionToken:t=>t==="valid"?{userId:"USER-1",role:"Administrador"}:null};vm.runInNewContext('var TASK_RESOURCE_OWNERSHIP_HEADERS_='+JSON.stringify(headers)+';var TASK_RESOURCE_OWNERSHIP_REQUEST_CACHE_=new WeakMap();'+["getVerifiedTaskIdentity_","getVerifiedDepartmentScopeForSession_","getVerifiedTaskDepartmentScope_","getTaskServiceResourceOwnershipSnapshot_","assertTaskServiceResourceOwnership_","resolveTaskServiceOwnershipDepartment_","ensureTaskServiceResourceOwnershipSheet_","registerTaskServiceResourceOwnership_"].map(extractFunction).join("\n")+';this.identity=getVerifiedTaskIdentity_;this.scope=getVerifiedTaskDepartmentScope_;this.owner=assertTaskServiceResourceOwnership_;this.department=resolveTaskServiceOwnershipDepartment_;this.register=registerTaskServiceResourceOwnership_;',ctx);return {ctx,own,ss};}
const dep=["AS-1","USER-1","Administrador","DEPARTAMENTO",'["DEP-A"]',"Activo","","","2026-01-01","2099-01-01"],depB=["AS-2","USER-1","Administrador","DEPARTAMENTO",'["DEP-B"]',"Activo","","","2026-01-01","2099-01-01"],inst=["AS-3","USER-1","Administrador","INSTITUCION",'["INST-1"]',"Activo","","","2026-01-01","2099-01-01"],row=["OWN-1","INST-1","TAREA","TSK-1","DEP-A","ACTIVE","USER-1","2026-01-01","2026-01-01"];
{const f=fixture([row],[dep]),p={sessionToken:"valid"},id=f.ctx.identity(p),scope=f.ctx.scope(p,f.ss,id);assert.equal(scope.authorized,true);assert.deepEqual(Array.from(scope.departmentIds),["DEP-A"]);assert.equal(f.ctx.owner(p,"TAREA","TSK-1","READ",f.ss,id,scope).authorized,true);assert.equal(f.ctx.owner(p,"TAREA","TSK-2","READ",f.ss,id,scope).code,"RESOURCE_OWNERSHIP_UNVERIFIED");assert.equal(f.ctx.owner(p,"TAREA","TSK-1","READ",f.ss,id,{...scope,departmentIds:["DEP-B"]}).code,"RESOURCE_SCOPE_DENIED");}
{const f=fixture([row],[inst]),p={sessionToken:"valid"},id=f.ctx.identity(p),scope=f.ctx.scope(p,f.ss,id);assert.equal(scope.institutionWide,true);assert.equal(f.ctx.owner(p,"TAREA","TSK-1","READ",f.ss,id,scope).authorized,true);assert.equal(f.ctx.department({departmentId:"DEP-UNCONFIGURED"},scope).authorized,true);assert.equal(f.ctx.register(scope,"TAREA","TSK-3","DEP-UNCONFIGURED",f.ss).authorized,true);}
{const f=fixture([row,row],[dep]),p={sessionToken:"valid"},id=f.ctx.identity(p),scope=f.ctx.scope(p,f.ss,id);assert.equal(f.ctx.owner(p,"TAREA","TSK-1","READ",f.ss,id,scope).code,"RESOURCE_OWNERSHIP_AMBIGUOUS");}
{const f=fixture([["OWN-2","INST-1","TAREA","TSK-1","","ACTIVE","USER-1","",""]],[dep]),p={sessionToken:"valid"},id=f.ctx.identity(p),scope=f.ctx.scope(p,f.ss,id);assert.equal(f.ctx.owner(p,"TAREA","TSK-1","READ",f.ss,id,scope).code,"RESOURCE_DEPARTMENT_UNRESOLVED");}
{const f=fixture([],[dep,depB]),p={sessionToken:"valid"},scope=f.ctx.scope(p,f.ss);assert.equal(f.ctx.department({departmentId:"DEP-A"},scope).departmentId,"DEP-A");assert.equal(f.ctx.department({},scope).code,"RESOURCE_DEPARTMENT_SELECTION_REQUIRED");assert.equal(f.ctx.department({departmentId:"DEP-C"},scope).code,"RESOURCE_DEPARTMENT_SELECTION_DENIED");}
{const f=fixture([],[dep]),p={sessionToken:"valid"},scope=f.ctx.scope(p,f.ss),registered=f.ctx.register(scope,"TAREA","TSK-2","DEP-A",f.ss);assert.equal(registered.authorized,true);assert.equal(registered.ownershipId,"OWN-UUID-1");assert.equal(f.ctx.register(scope,"TAREA","TSK-2","DEP-A",f.ss).idempotent,true);}
{const empty=sheet([]),assign=sheet([["ID","UserID","Role","ScopeType","ScopeValues","Status","x","x","Start","End"],dep]),ss={getSheetByName:n=>n==="AsignacionesAmbitosRoles"?assign:null,insertSheet:n=>empty},ctx={LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},Utilities:{getUuid:()=>"UUID-2"},getDynamicPermissionsForRole:()=>true};vm.runInNewContext('var TASK_RESOURCE_OWNERSHIP_HEADERS_='+JSON.stringify(headers)+';'+extractFunction("ensureTaskServiceResourceOwnershipSheet_")+';this.ensure=ensureTaskServiceResourceOwnershipSheet_;',ctx);const initialized=ctx.ensure(ss);assert.deepEqual(initialized.rows[0],headers);assert.equal(initialized.getLastRow(),1);}
{const f=fixture([],[dep]),p={sessionToken:"valid"},scope=f.ctx.scope(p,f.ss);f.ctx.getDynamicPermissionsForRole=()=>false;assert.equal(f.ctx.register(scope,"TAREA","TSK-2","DEP-A",f.ss).code,"AUTH_PERMISSION_DENIED");}
{const f=fixture([] ,[]),p={sessionToken:"valid"};assert.equal(f.ctx.scope(p,f.ss).code,"DEPARTMENT_SCOPE_NOT_ASSIGNED");assert.equal(f.ctx.identity({sessionToken:"bad"}).code,"VERIFIED_IDENTITY_REQUIRED");}
const create=extractFunction("createTask"),guard=extractFunction("assertTaskServiceTeacherCanManageTask"),list=extractFunction("getStudentTasks"),all=extractFunction("getAllTasks"),activity=extractFunction("getTeacherActivity"),ensure=extractFunction("ensureTaskServiceResourceOwnershipSheet_");
assert(create.includes('registerTaskServiceResourceOwnership_(scope,"TAREA",id,department.departmentId,ss)'));assert(create.includes("resolveTaskServiceOwnershipDepartment_(payload,scope)"));assert(extractFunction("registerTaskServiceResourceOwnership_").includes("ensureTaskServiceResourceOwnershipSheet_"),"registry initialization occurs inside locked registration");assert(guard.includes('assertTaskServiceResourceOwnership_(payload,"TAREA",row[0]'));
for(const [name,fn] of [["getStudentTasks",list],["getAllTasks",all],["getTeacherActivity",activity]])assert(fn.includes('assertTaskServiceResourceOwnership_(payload, "TAREA"'),name+" filters departmental ownership");
for(const name of ["gradeSubmission","gradeSubmissionWithRubric"])assert(extractFunction(name).includes("withAuthorizedTaskSubmissionMutation_"),name+" executes the locked, verified grade mutation wrapper");
assert(extractFunction("withAuthorizedTaskSubmissionMutation_").includes('getTaskServiceSubmissionAccess_(payload, "GRADE")'),"grade mutation revalidates task ownership and scope");
assert(extractFunction("withAuthorizedTaskSubmissionMutation_").includes("LockService.getScriptLock()"),"grade mutation serializes changes with ScriptLock");
assert(extractFunction("returnSubmissionForRevision").includes("assertTaskServiceSubmissionTaskOwnership_"),"return-for-revision keeps the direct ownership guard");
assert(extractFunction("deleteSubmission").includes('assertTaskServiceTeacherCanManageTask(payload,task,"DELETE_SUBMISSION")'));
assert(extractFunction("getSubmissionDocumentPreviewUrl").includes('"READ_CONTENT"'));
console.log("TASK-153 Task-Service ownership contract passed: scope, owner isolation, institutional access, ambiguity, validated assignment and staff read/mutation gates.");


// TASK-153: submission comments and version history must resolve their parent task
// and bind student/guardian access to a verified delivery, never to client-supplied IDs.
const submissionAccess = extractFunction("getTaskServiceSubmissionAccess_");
assert(submissionAccess.includes("getVerifiedTaskIdentity_(payload)"), "submission access derives identity from the signed session");
assert(submissionAccess.includes("assertTaskServiceTeacherCanManageTask(payload, task"), "staff submission access enforces task ownership and scope");
assert(submissionAccess.includes("assertTaskServiceStudentCanAccessTask(ss, studentId, task)"), "learner submission access enforces student/task relationship");
assert(submissionAccess.includes("getTaskServiceGuardianStudentIds(identity.userId)"), "guardian access derives linked students from verified identity");
for (const name of ["getSubmissionComments", "addSubmissionComment", "getSubmissionVersions"]) {
  assert(extractFunction(name).includes("getTaskServiceSubmissionAccess_(payload"), name + " resolves authorized parent task/delivery context");
}
const commentsFn = extractFunction("getSubmissionComments");
assert(commentsFn.includes("context.isStaff || !isPrivate"), "students and guardians cannot read private staff comments");
const addCommentFn = extractFunction("addSubmissionComment");
assert(addCommentFn.includes("context.identity.userId") && addCommentFn.includes("context.identity.role"), "comment author is derived from verified session");
assert(!addCommentFn.includes("payload.autorId") && !addCommentFn.includes("payload.rolAutor"), "client cannot impersonate comment author or role");
assert(addCommentFn.includes("context.isStaff && payload.esPrivado !== false"), "only staff can create private comments");
const versionsFn = extractFunction("getSubmissionVersions");
assert(versionsFn.includes("context.delivery") && versionsFn.includes("context.studentId"), "version history is restricted to the authorized delivery");
assert(versionsFn.includes("targetExists"), "staff cannot query versions for an unrelated user ID");

function makeSubmissionAccessFixture() {
  const taskRows = [
    ["TareaID","Tipo","Titulo","Descripcion","Parcial","Asignatura","Grado","Seccion","FechaLimite","Original","Profesor","Estado"],
    ["TASK-1","Tarea","Matemáticas","","P1","Matemáticas","6","A","","","PROF-1","Activa"]
  ];
  const deliveryRows = [
    ["EntregaID","TareaID","UserID"],
    ["ENT-1","TASK-1","STU-1"],
    ["ENT-2","TASK-1","STU-2"]
  ];
  const sheets = {
    Entregas: { getDataRange: () => ({ getValues: () => deliveryRows }) },
    Tareas: { getDataRange: () => ({ getValues: () => taskRows }) }
  };
  const calls = [];
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ({}) },
    getSheetOrThrow: (_ss, name) => sheets[name],
    getVerifiedTaskIdentity_: payload => payload.identity || { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" },
    isTaskServiceAdministrativeRole: role => ["Administrador","Desarrollador","Dirección","Secretaría"].includes(role),
    getTaskServiceGuardianStudentIds: userId => userId === "GUARD-1" ? ["STU-1"] : [],
    assertTaskServiceStudentCanAccessTask: (_ss, userId, task) => {
      if (userId !== "STU-1" || task[0] !== "TASK-1") throw new Error("RESOURCE_NOT_FOUND");
      calls.push(["student", userId]);
      return true;
    },
    assertTaskServiceTeacherCanManageTask: (payload, task, operation) => {
      calls.push(["staff", task[0], operation]);
      if (!payload.staffAuthorized) throw new Error("RESOURCE_NOT_FOUND");
      return true;
    }
  };
  vm.runInNewContext(submissionAccess + "\nthis.resolve = getTaskServiceSubmissionAccess_;", context);
  return { resolve: context.resolve, calls };
}
{
  const f = makeSubmissionAccessFixture();
  const student = { identity: { authorized: true, userId: "STU-1", role: "Estudiante" }, entregaId: "ENT-1" };
  assert.equal(f.resolve(student, "READ_HISTORY").studentId, "STU-1");
  assert.throws(() => f.resolve({ identity: student.identity, entregaId: "ENT-2" }, "READ_HISTORY"), /RESOURCE_NOT_FOUND/);
  assert.equal(f.resolve({ identity: student.identity, tareaId: "TASK-1" }, "READ_HISTORY").delivery[0], "ENT-1");
  const guardian = { identity: { authorized: true, userId: "GUARD-1", role: "Padre" }, tareaId: "TASK-1" };
  assert.equal(f.resolve(guardian, "READ_HISTORY").studentId, "STU-1");
  assert.throws(() => f.resolve({ identity: guardian.identity, entregaId: "ENT-2" }, "READ_HISTORY"), /RESOURCE_NOT_FOUND/);
  const staff = { identity: { authorized: true, userId: "PROF-1", role: "Profesor" }, tareaId: "TASK-1", staffAuthorized: true };
  assert.equal(f.resolve(staff, "READ_HISTORY").isStaff, true);
  assert.deepEqual(f.calls[f.calls.length - 1], ["staff", "TASK-1", "READ_HISTORY"]);
  assert.throws(() => f.resolve({ ...staff, staffAuthorized: false }, "READ_HISTORY"), /RESOURCE_NOT_FOUND/);
  assert.throws(() => f.resolve({ identity: student.identity, entregaId: "ENT-1", tareaId: "TASK-OTHER" }, "READ_HISTORY"), /RESOURCE_NOT_FOUND/);
}
console.log("TASK-153 submission discussion/history contract passed: signed identity, delivery ownership, guardian relationship, staff scope and anti-IDOR checks.");


// TASK-153: staff reading a student's task list must satisfy both the student's
// department ownership and the staff member's own authorized resource scope.
{
  const listFn = extractFunction("getStudentTasks");
  const taskRows = [
    ["TareaID","Tipo","Titulo","Descripcion","Parcial","Asignatura","Grado","Seccion","FechaLimite","OriginalID","ProfesorID","Estado","Puntaje","Archivo","FechaDisponible","TipoRecurso"],
    ["TASK-A","Tarea","Task A","","P1","Matemáticas","6","A","","","PROF-1","Activa",100,"","","Tarea"],
    ["TASK-B","Tarea","Task B","","P1","Matemáticas","6","A","","","PROF-2","Activa",100,"","","Tarea"]
  ];
  const deliveryRows = [["EntregaID","TareaID","UserID","Fecha","FileId","Nota","Estado","Comentario","MimeType"]];
  const sheets = {
    Tareas: { getDataRange: () => ({ getValues: () => taskRows.map(row => row.slice()) }) },
    Entregas: { getDataRange: () => ({ getValues: () => deliveryRows.map(row => row.slice()) }) }
  };
  const ownerDepartments = { "TASK-A": "D1", "TASK-B": "D2" };
  const scopeCalls = [];
  const context = {
    SPREADSHEET_ID: "LOCAL",
    SpreadsheetApp: { openById: () => ({}) },
    getSheetOrThrow: (_ss, name) => sheets[name],
    getTaskServiceUserProfile: userId => ({ userId, grado: "6", seccion: "A" }),
    getTaskServiceAuthorizedClassrooms: () => ["CLASS-A"],
    isTaskServiceAdministrativeRole: role => ["Administrador","Desarrollador","Dirección","Secretaría"].includes(role),
    getVerifiedTaskDepartmentScope_: (payload, _ss, identity) => {
      const actor = identity || { userId: payload._verifiedUserId, role: payload._verifiedRole };
      scopeCalls.push({ userId: actor.userId, role: actor.role });
      const departmentIds = actor.userId === "STUDENT-2" ? ["D2"] : ["D1"];
      return { authorized: true, userId: actor.userId, role: actor.role, institutionId: "I1", departmentIds, institutionWide: false };
    },
    assertTaskServiceResourceOwnership_: (_payload, _type, id, _operation, _ss, _identity, scope) => ({
      authorized: (scope.departmentIds || []).includes(ownerDepartments[id])
    }),
    isTaskServiceTeacherTaskAuthorized_: (task, _classrooms, actorId) => String(task[10]) === String(actorId),
    normalizeString: value => String(value || "").trim().toLowerCase(),
    isInTeacherList: (value, list) => !list || String(list).split(",").map(item => item.trim()).includes(String(value).trim())
  };
  vm.runInNewContext(listFn + "\nthis.list = getStudentTasks;", context);
  const sameDepartment = context.list({ _verifiedRole: "Profesor", _verifiedUserId: "PROF-1", studentId: "STUDENT-1" });
  assert.deepEqual(sameDepartment.data.map(item => item.tareaId), ["TASK-A"], "teacher sees only tasks inside both student and teacher scopes");
  const otherDepartment = context.list({ _verifiedRole: "Profesor", _verifiedUserId: "PROF-1", studentId: "STUDENT-2" });
  assert.deepEqual(otherDepartment.data, [], "teacher cannot expose department-A tasks to a student assigned to department B");
  assert(scopeCalls.some(call => call.userId === "STUDENT-2" && call.role === "Estudiante"), "staff request resolves the target student's department scope");
}
console.log("TASK-153 staff/student department intersection contract passed.");


// TASK-153: virtual classrooms are departmental resources; class-scoped posts/materials
// inherit the parent classroom's ownership. General content remains institution-wide.
{
  const authorizedFn = extractFunction("getTaskServiceAuthorizedClassrooms");
  const createFn = extractFunction("createVirtualClassroom");
  const accessFn = extractFunction("assertTaskServiceClassroomAccess");
  assert(authorizedFn.includes('assertTaskServiceResourceOwnership_(payload,"AULA_VIRTUAL"'), "classroom listings must filter by ResourceOwnership");
  assert(createFn.includes('registerTaskServiceResourceOwnership_(scope,"AULA_VIRTUAL"'), "classroom creation must register ownership");
  assert(createFn.includes("sh.deleteRow(rowIndex)"), "classroom creation must compensate failed ownership registration");
  assert(accessFn.includes('assertTaskServiceResourceOwnership_(payload,"AULA_VIRTUAL"'), "classroom writes must enforce owner scope");
  assert(accessFn.includes("scope.institutionWide!==true"), "General content requires institution-wide authorization");
  for (const name of ["getVirtualClassrooms","getPosts","getStudyMaterials"]) {
    assert(extractFunction(name).includes("getTaskServiceAuthorizedClassrooms(payload)"), name + " must consume owner-filtered classrooms");
  }
  for (const name of ["createPost","updatePost","deletePost","createStudyMaterial","deleteStudyMaterial"]) {
    assert(extractFunction(name).includes("assertTaskServiceClassroomAccess(payload"), name + " must enforce parent classroom ownership");
  }

  const classroomRows = [
    ["AulaID","OfertaID","Nombre","Grado","Seccion","Asignatura","ProfesorID","Estado"],
    ["AULA-D1","OFFER-1","Aula D1","6","A","Matemáticas","PROF-1","Activa"],
    ["AULA-D2","OFFER-2","Aula D2","6","A","Matemáticas","PROF-1","Activa"],
    ["AULA-D1B","OFFER-3","Aula D1B","7","B","Matemáticas","PROF-1","Activa"]
  ];
  const assignmentRows = [
    ["ID","OfertaID","ProfesorID","Asignatura","Inicio","Fin","Estado"],
    ["AS-1","OFFER-1","PROF-1","","2026-01-01","2099-01-01","Activo"],
    ["AS-2","OFFER-2","PROF-1","","2026-01-01","2099-01-01","Activo"],
    ["AS-3","OFFER-3","PROF-1","","2026-01-01","2099-01-01","Activo"]
  ];
  const ownerDepartments = { "AULA-D1":"D1", "AULA-D2":"D2", "AULA-D1B":"D1" };
  const classSheet = { getDataRange: () => ({ getValues: () => classroomRows.map(row => row.slice()) }) };
  const assignmentSheet = { getDataRange: () => ({ getValues: () => assignmentRows.map(row => row.slice()) }) };
  const ss = { getSheetByName: name => name === "AsignacionesDocentes" ? assignmentSheet : null };
  const context = {
    SPREADSHEET_ID:"LOCAL",
    SpreadsheetApp:{openById:()=>ss},
    getSheetOrThrow:(_ss,name)=>name==="AulasVirtuales"?classSheet:null,
    getVerifiedTaskIdentity_:payload=>({authorized:true,userId:payload._verifiedUserId,role:payload._verifiedRole}),
    getVerifiedTaskDepartmentScope_:(payload,_ss,identity)=>{
      const actor=identity||{userId:payload._verifiedUserId,role:payload._verifiedRole};
      const departmentIds=actor.userId==="STU-2"?["D2"]:actor.userId==="ADMIN-WIDE"?[]:["D1"];
      return {authorized:true,userId:actor.userId,role:actor.role,institutionId:"I1",departmentIds,institutionWide:actor.userId==="ADMIN-WIDE"};
    },
    getTaskServiceUserProfile:userId=>({userId,grado:"6",seccion:"A"}),
    getTaskServiceGuardianStudentIds:userId=>userId==="TUTOR-1"?["STU-1","STU-2"]:[],
    assertTaskServiceResourceOwnership_:(_payload,type,id,_operation,_ss,identity,scope)=>({
      authorized:type==="AULA_VIRTUAL"&&!!ownerDepartments[id]&&(scope.institutionWide===true||scope.departmentIds.includes(ownerDepartments[id]))
    }),
    isTaskServiceAdministrativeRole:role=>["Administrador","Desarrollador","Dirección","Secretaría"].includes(role),
    normalizeString:value=>String(value||"").trim().toLowerCase()
  };
  vm.runInNewContext(authorizedFn+"\nthis.list=getTaskServiceAuthorizedClassrooms;",context);
  assert.deepEqual(Array.from(context.list({_verifiedRole:"Estudiante",_verifiedUserId:"STU-1"}),row=>row[0]),["AULA-D1"],"student sees only same-department classrooms");
  assert.deepEqual(Array.from(context.list({_verifiedRole:"Padre",_verifiedUserId:"TUTOR-1"}),row=>row[0]),["AULA-D1","AULA-D2"],"guardian sees only classrooms belonging to linked students' departments");
  assert.deepEqual(Array.from(context.list({_verifiedRole:"Profesor",_verifiedUserId:"PROF-1"}),row=>row[0]),["AULA-D1","AULA-D1B"],"teacher sees only assigned classrooms in own departments");
  assert.deepEqual(Array.from(context.list({_verifiedRole:"Administrador",_verifiedUserId:"ADMIN-1"}),row=>row[0]),["AULA-D1","AULA-D1B"],"department-scoped admin cannot see foreign classrooms");
  assert.equal(context.list({_verifiedRole:"Administrador",_verifiedUserId:"ADMIN-WIDE"}).length,3,"institution-wide admin can see all classrooms in the same institution");
}
console.log("TASK-153 classroom ownership contract passed.");
