const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const next = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, next < 0 ? source.length : next);
}
function extractConst(name) {
  const start = source.indexOf("const " + name);
  assert.notEqual(start, -1, "missing const " + name);
  const end = source.indexOf(";", start);
  assert.notEqual(end, -1, "missing const terminator " + name);
  return source.slice(start, end + 1);
}
assert.ok(source.includes('case "getUserHelpPreferences": result = getUserHelpPreferences(payload); break;'));
assert.ok(source.includes('case "saveUserHelpPreferences": result = saveUserHelpPreferences(payload); break;'));
assert.ok(source.includes('["getUserHelpPreferences", "saveUserHelpPreferences"]'), "help preference endpoints must be restricted to authenticated self-service");

const code = [
  extractConst("USER_HELP_PREFERENCE_HEADERS_"),
  extractConst("USER_HELP_TOUR_ROLES_"),
  extractFunction("getUserHelpPreferenceActor_"),
  extractFunction("ensureUserHelpPreferencesSheet_"),
  extractFunction("getUserHelpPreferences"),
  extractFunction("saveUserHelpPreferences"),
  extractFunction("getHelpGuidesCatalog")
].join("\n\n");

function harness() {
  const state = { userId:"U-1", role:"Estudiante", institutionId:"INST-1", lock:false };
  const rows = [[""]];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }),
    appendRow: row => rows.push(row.slice()),
    getRange(row,column,rowCount,columnCount) {
      return { setValues(values) {
        for (let r=0;r<rowCount;r++) {
          while (rows.length < row+r) rows.push([]);
          rows[row-1+r].splice(column-1,columnCount,...values[r]);
        }
      }};
    }
  };
  const context = {
    SPREADSHEET_ID:"TEST",
    verifySessionToken: token => token === "VALID" ? {userId:state.userId,role:state.role,sessionId:"S-1"} : null,
    getIdentityInstitutionId_: () => state.institutionId,
    getUserVerifiedRole: () => state.role,
    SpreadsheetApp: {openById:id => {assert.equal(id,"TEST");return {getSheetByName:name=>name==="PreferenciasUsuario"?sheet:null};}},
    getOrCreateSheet: (_ss,name) => {assert.equal(name,"PreferenciasUsuario");return sheet;},
    LockService: {getScriptLock:()=>({tryLock:()=>{if(state.lock)return false;state.lock=true;return true;},releaseLock:()=>{state.lock=false;}})},
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error
  };
  vm.runInNewContext(code,context);
  return {context,state,rows};
}
const payload=(overrides={})=>Object.assign({sessionToken:"VALID",_verifiedUserId:"U-1",tourKey:"studentSubmission",stepIndex:2,dismissed:false,tourVersion:"1",expectedVersion:0},overrides);

{
  const h=harness();
  const saved=h.context.saveUserHelpPreferences(payload());
  assert.equal(saved.status,"success");
  assert.equal(saved.version,1);
  assert.equal(h.rows.length,2);
  assert.equal(h.rows[0][0],"PreferenceID","blank preference sheet must initialize headers at row one");
  const listed=h.context.getUserHelpPreferences({sessionToken:"VALID",_verifiedUserId:"U-1"});
  assert.equal(listed.status,"success");
  assert.equal(listed.preferences.length,1);
  assert.equal(listed.preferences[0].stepIndex,2);
  assert.equal(listed.preferences[0].dismissed,false);
  assert.equal(h.context.saveUserHelpPreferences(payload({stepIndex:3,expectedVersion:0})).code,"USER_HELP_PREFERENCE_VERSION_CONFLICT");
  const updated=h.context.saveUserHelpPreferences(payload({stepIndex:3,expectedVersion:1}));
  assert.equal(updated.version,2);
  assert.equal(h.rows.length,3,"preference history is append-only");
  const reset=h.context.saveUserHelpPreferences(payload({stepIndex:1,dismissed:false,expectedVersion:2}));
  assert.equal(reset.version,3);
  const resetAll=h.context.saveUserHelpPreferences({sessionToken:"VALID",_verifiedUserId:"U-1",resetAll:true});
  assert.equal(resetAll.status,"success");
  assert.equal(resetAll.resetCount,1);
  const afterReset=h.context.getUserHelpPreferences({sessionToken:"VALID",_verifiedUserId:"U-1"});
  assert.equal(afterReset.preferences[0].stepIndex,1);
  assert.equal(afterReset.preferences[0].dismissed,false);
  assert.equal(afterReset.preferences[0].version,4);
}

{
  const h=harness();
  assert.equal(h.context.getUserHelpPreferences({sessionToken:"INVALID",_verifiedUserId:"U-1"}).code,"VERIFIED_IDENTITY_REQUIRED");
  assert.equal(h.context.saveUserHelpPreferences(payload({tourKey:"teacherReview"})).code,"USER_HELP_TOUR_NOT_ALLOWED");
  assert.equal(h.context.saveUserHelpPreferences(payload({expectedVersion:undefined})).code,"USER_HELP_PREFERENCE_VALUE_INVALID");
  assert.equal(h.context.saveUserHelpPreferences(payload({stepIndex:0})).code,"USER_HELP_PREFERENCE_VALUE_INVALID");
  assert.equal(h.rows.length,1,"invalid requests must not write preferences");
  h.state.lock=true;
  assert.equal(h.context.saveUserHelpPreferences(payload()).code,"USER_HELP_PREFERENCE_LOCK_TIMEOUT");
  h.state.lock=false;
}

{
  const h=harness();
  h.context.saveUserHelpPreferences(payload());
  h.state.userId="U-2";
  const other=h.context.getUserHelpPreferences({sessionToken:"VALID",_verifiedUserId:"U-2"});
  assert.equal(other.preferences.length,0,"preferences must remain private to the signed-in user");
  assert.equal(h.context.saveUserHelpPreferences(payload({_verifiedUserId:"U-1"})).code,"VERIFIED_IDENTITY_REQUIRED","a client-supplied user ID cannot impersonate another account");
  h.state.institutionId="INST-2";
  assert.equal(h.context.getUserHelpPreferences({sessionToken:"VALID",_verifiedUserId:"U-2"}).preferences.length,0);
}

{
  const h=harness();
  h.state.role="Profesor";
  const saved=h.context.saveUserHelpPreferences(payload({tourKey:"teacherTemplates",stepIndex:2,expectedVersion:0}));
  assert.equal(saved.status,"success");
  assert.equal(saved.tourKey,"teacherTemplates");
  const reset=h.context.saveUserHelpPreferences({sessionToken:"VALID",_verifiedUserId:"U-1",resetAll:true});
  assert.equal(reset.resetCount,1);
}

{
  const h=harness();
  const student=h.context.getHelpGuidesCatalog({});
  assert.equal(student.status,"success");
  assert.deepEqual(Array.from(student.guides, g=>g.id),["GUIDE-STUDENT-TASKS"]);
  h.state.role="Profesor";
  const teacher=h.context.getHelpGuidesCatalog({});
  assert.deepEqual(Array.from(teacher.guides, g=>g.id),["GUIDE-TEACHER-GRADEBOOK","GUIDE-TEMPLATES-DESIGN"]);
}

console.log("User help preferences contract PASS: signed identity, owner isolation, server persistence, append-only versions, conflict detection, reset, role filtering and lock contention.");
