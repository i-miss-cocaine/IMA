const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/academic-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/academic-service/Code.gs" });
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start); let depth = 0, quote = null, escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function: " + name);
}
const users = [
  ["UserID","Email","Nombre","x3","x4","x5","Rol","x7","x8","PersonaID","EstadoCuenta"],
  ["STAFF-1","","Staff","","","","Director","","","P-STAFF","Activo"],
  ["STU-1","","Student","","","","Estudiante","","","P-STU-1","Activo"],
  ["STU-2","","Student 2","","","","Alumno","","","P-STU-2","Activo"],
  ["STU-3","","Student 3","","","","Estudiante","","","P-STU-3","Activo"],
  ["STU-INACTIVE","","Inactive","","","","Estudiante","","","P-INACTIVE","Inactiva"]
];
const expedientes = [
  ["ExpedienteID","PersonaID"],
  ["EXP-1","P-STU-1"],
  ["EXP-2","P-STU-2"],
  ["EXP-3","P-STU-3"],
  ["EXP-3","P-INACTIVE"]
];
function sheet(rows) { return { getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }) }; }
const sheets = { Usuarios: sheet(users), ExpedientesEstudiantes: sheet(expedientes) };
const calls = { scope: 0, ownership: 0 };
let actor = { authorized: true, userId: "STAFF-1", role: "Director" };
let ownershipAllowed = true;
const context = {
  SPREADSHEET_ID: "SYNTHETIC",
  SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) },
  getVerifiedAcademicIdentity_: () => actor,
  getVerifiedAcademicDepartmentScope_: (_p,_ss,a) => { calls.scope++; return { authorized: true, institutionId: "I-1", departmentIds: ["D-1"], userId: a.userId }; },
  assertResourceOwnershipForScope_: (_ss,scope,type,id,operation) => {
    calls.ownership++;
    assert.equal(scope.institutionId, "I-1");
    assert.equal(type, "EXPEDIENTE_ESTUDIANTE");
    assert.equal(operation, "UPDATE");
    return ownershipAllowed && id === "EXP-1" ? { authorized: true, departmentId: "D-1" } : { authorized: false, code: "RESOURCE_SCOPE_DENIED" };
  }
};
vm.runInNewContext(extractFunction("assertAcademicEnrollmentMutationAccess_") + "\nthis.check=assertAcademicEnrollmentMutationAccess_;", context);
const check = context.check;
assert.equal(check({sessionToken:"valid"}, "STU-1").authorized, true, "authorized staff can update owned student");
assert.equal(check({sessionToken:"valid"}, "STU-3").code, "RESOURCE_SCOPE_DENIED", "foreign department ownership is denied");
assert.equal(check({sessionToken:"valid"}, "STU-INACTIVE").code, "STUDENT_ACCOUNT_INACTIVE_OR_INVALID", "inactive student account is denied");
assert.equal(check({sessionToken:"valid"}, "STU-MISSING").code, "RESOURCE_OWNER_UNRESOLVED", "unknown student is denied");
actor = { authorized: true, userId: "STU-1", role: "Estudiante" };
assert.equal(check({sessionToken:"valid"}, "STU-1").code, "ENROLLMENT_MUTATION_ROLE_DENIED", "student cannot mutate enrollment");
actor = { authorized: true, userId: "TUTOR-1", role: "Tutor" };
assert.equal(check({sessionToken:"valid"}, "STU-1").code, "ENROLLMENT_MUTATION_ROLE_DENIED", "guardian cannot mutate enrollment");
actor = { authorized: false, code: "VERIFIED_IDENTITY_REQUIRED" };
assert.equal(check({}, "STU-1").code, "VERIFIED_IDENTITY_REQUIRED", "missing verified session is denied");
actor = { authorized: true, userId: "STAFF-1", role: "Director" };
ownershipAllowed = false;
assert.equal(check({sessionToken:"valid"}, "STU-1").code, "RESOURCE_SCOPE_DENIED", "revoked ownership is denied");
ownershipAllowed = true;
assert.equal(calls.ownership, 3, "ownership is evaluated only after valid actor and target resolution");
const duplicateUsers = users.concat([["STU-1","","Duplicate","","","","Estudiante","","","P-STU-1","Activo"]]);
sheets.Usuarios = sheet(duplicateUsers);
assert.equal(check({sessionToken:"valid"}, "STU-1").code, "STUDENT_ACCOUNT_AMBIGUOUS", "duplicate student account mapping is denied");
console.log("ACADEMIC enrollment mutation identity, staff role, active student mapping, unique expediente and department UPDATE ownership contracts passed.");

// Wrapper invariants: no caller-supplied lock bypass, identity check occurs while lock is held,
// and failed multi-sheet writes execute compensations in reverse order.
const createFn = extractFunction("createStudentEnrollment");
const renewFn = extractFunction("renewStudentEnrollment");
const registerFn = extractFunction("registerStudentEnrollment");
assert.ok(createFn.includes("const lock = LockService.getScriptLock();") && createFn.includes("const success = lock.tryLock(10000);") && !createFn.includes("if (!skipLock)"), "create endpoint cannot bypass its lock via payload");
assert.ok(renewFn.includes("Object.assign({}, request"), "renewal preserves signed session/context fields");
assert.ok(registerFn.indexOf("lock.tryLock") < registerFn.indexOf("assertAcademicEnrollmentMutationAccess_"), "registration checks ownership under the mutation lock");
const events = [];
let shouldFail = false, undone = false, internalPayload = null, wrapperLockAvailable = true;
const wrapperContext = {
  LockService: { getScriptLock: () => ({ tryLock: ms => { events.push("lock:" + ms); return wrapperLockAvailable; }, releaseLock: () => events.push("release") }) },
  assertAcademicEnrollmentMutationAccess_: (payload,id) => { events.push("authorize:" + id); return { authorized: true }; },
  registerStudentEnrollmentInternal_: payload => {
    internalPayload = payload;
    if (shouldFail) { payload._rollbackActions.push(() => { undone = true; }); throw new Error("synthetic-write-failure"); }
    return { status: "success", matriculaId: "MAT-1" };
  }
};
vm.runInNewContext(registerFn + "\nthis.register=registerStudentEnrollment;", wrapperContext);
const success = wrapperContext.register({userId:"STU-1",skipLock:true,_chargeReference:"spoof",_rollbackActions:[]});
assert.equal(success.status,"success");
assert.deepEqual(events.slice(0,2),["lock:10000","authorize:STU-1"],"lock is acquired before ownership validation");
assert.equal(internalPayload.skipLock, undefined, "external skipLock is discarded");
assert.equal(internalPayload._chargeReference, undefined, "internal charge references cannot be injected");
assert.ok(Array.isArray(internalPayload._rollbackActions), "server-owned compensation journal is supplied");
shouldFail = true;
assert.throws(() => wrapperContext.register({userId:"STU-1"}), /synthetic-write-failure/);
assert.equal(undone,true,"failed registration executes compensation");
assert.equal(events.at(-1),"release","lock is released after rollback");
wrapperLockAvailable = false;
events.length = 0;
assert.throws(() => wrapperContext.register({userId:"STU-1"}), /Servicio ocupado/);
assert.deepEqual(events,["lock:10000"],"a contending registration fails before authorization or persistence");
const createContext = {
  LockService:{getScriptLock:()=>({tryLock:ms=>{assert.equal(ms,10000);return false;},releaseLock:()=>{throw Error("lock must not be released when not acquired");}})},
  SpreadsheetApp:{openById:()=>{throw Error("persistence must not be touched while lock is contended");}}
};
vm.runInNewContext(createFn+"\\nthis.create=createStudentEnrollment;",createContext);
assert.throws(()=>createContext.create({userId:"STU-1",grado:"1",seccion:"A",skipLock:true}),/Servicio ocupado/,
  "untrusted skipLock cannot bypass a contended create operation");
let renewedPayload;
const renewContext={
  createStudentEnrollment:payload=>{renewedPayload=payload;return {status:"success"};},
  getVerifiedAcademicIdentity_:()=>({authorized:true,userId:"STAFF-1",role:"Director"})
};
vm.runInNewContext(renewFn+"\\nthis.renew=renewStudentEnrollment;",renewContext);
renewContext.renew({userId:"STU-1",nuevoAnoLectivo:"2027",nuevoGrado:"2",sessionToken:"signed",activeDepartmentId:"D-1"});
assert.equal(renewedPayload.sessionToken,"signed","renewal forwards the signed session token");
assert.equal(renewedPayload.activeDepartmentId,"D-1","renewal forwards the active department scope");
assert.equal(renewedPayload.callerUserId,"STAFF-1","renewal records the verified actor, not the target student");
console.log("ACADEMIC enrollment write lock, contention, caller bypass rejection, renewal context preservation and rollback contracts passed.");
