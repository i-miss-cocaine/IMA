const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function " + name + " exists");
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escape = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (c === "\\") { escape = true; continue; } if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === String.fromCharCode(96)) { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unbalanced function " + name);
}

const sourceCode = fs.readFileSync(path.resolve(__dirname, "../../backend/user-service/Code.gs"), "utf8");
const helperStart = sourceCode.indexOf("const USER_ROLE_MEMBERSHIP_HEADERS_ =");
const helperEnd = sourceCode.indexOf("function generateSessionToken(user) {", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "membership helpers exist");
const membershipHelpers = sourceCode.slice(helperStart, helperEnd);
const functions = [
  "generateSessionToken", "verifySessionToken", "getUserVerifiedRole",
  "getUserRoleMemberships", "switchActiveRole", "manageUserRoleMemberships",
  "ensureUserRoleMembershipSheet_", "isConfiguredRbacRole_"
].map(name => extractFunction(sourceCode, name));

const headers = ["MembershipID","UserID","RoleID","InstitutionID","Status","StartAt","EndAt","CreatedBy","CreatedAt","UpdatedAt","RevokedBy","RevokedAt"];
const now = new Date();
const activeStart = new Date(now.getTime() - 86400000).toISOString();
const activeEnd = new Date(now.getTime() + 86400000).toISOString();

function makeHarness(options = {}) {
  const membershipRows = options.membershipRows || [headers];
  const userRows = options.userRows || [
    ["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta","FechaCreacion","UltimoAcceso"],
    ["U-1","Test User","","","u1@example.test","","Student","","","","Activa","",""]
  ];
  const matrixRows = options.matrixRows || [
    ["rol","modulo","accion","permitido","ambito","ultimaModificacion","modificadoPor"],
    ["Director","General","manageUserRoleMemberships",true,"Global",now,"U-ADMIN"],
    ["Director","General","read",true,"Global",now,"U-ADMIN"],
    ["Coordinador","General","read",true,"Global",now,"U-ADMIN"]
  ];
  const sheets = {};
  function makeSheet(rows) {
    return {
      rows,
      getLastRow() { return rows.length; },
      getDataRange() { return { getValues: () => rows.map(row => row.slice()) }; },
      getRange(row, col, numRows, numCols) {
        return {
          getValues() { return rows.slice(row - 1, row - 1 + (numRows || 1)).map(r => r.slice(col - 1, col - 1 + (numCols || 1))); },
          setValue(value) { rows[row - 1][col - 1] = value; },
          setValues(values) { values.forEach((r, i) => { rows[row - 1 + i].splice(col - 1, r.length, ...r); }); }
        };
      },
      appendRow(row) { rows.push(row.slice()); }
    };
  }
  sheets.MembresiasRolesRBAC = makeSheet(membershipRows);
  sheets.Usuarios = makeSheet(userRows);
  sheets.MatrizPermisosRoles = makeSheet(matrixRows);
  const cacheValues = {};
  const ctx = {
    SPREADSHEET_ID: "LOCAL",
    ROLE_PERMISSIONS: { Student: [], Director: [], Coordinador: [] },
    USER_ROLE_MEMBERSHIP_HEADERS_: headers,
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, "LOCAL");
        return {
          getSheetByName(name) { return sheets[name] || null; },
          insertSheet(name) { sheets[name] = makeSheet([]); return sheets[name]; }
        };
      }
    },
    CacheService: { getScriptCache: () => ({
      get(key) { return cacheValues[key] || null; },
      put(key, value) { cacheValues[key] = value; },
      remove(key) { delete cacheValues[key]; }
    }) },
    Utilities: {
      base64EncodeWebSafe(value) { return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\\+/g, "-").replace(/\\//g, "_"); },
      base64Decode(value) { return Buffer.from(value, "base64"); },
      newBlob(bytes) { return { getDataAsString: () => Buffer.from(bytes).toString("utf8") }; },
      getUuid() { return "uuid-test-001"; }
    },
    getAuthTokenSecret: () => "test-secret",
    computeHmacSignature: (value, secret) => "sig:" + value + ":" + secret,
    getIdentityInstitutionId_: () => "INST-1",
    LockService: { getScriptLock: () => ({ waitLock() { ctx.locked = true; }, releaseLock() { ctx.locked = false; } }) },
    validateRolePermission: () => ({ authorized: true }),
    invalidateUserRoleCache: () => true,
    logStructuredEvent: () => true,
    locked: false
  };
  vm.runInNewContext(membershipHelpers + "\n" + functions.join("\n") +
    "\nthis.generateSessionToken=generateSessionToken;this.verifySessionToken=verifySessionToken;" +
    "this.getUserVerifiedRole=getUserVerifiedRole;this.getUserRoleMemberships=getUserRoleMemberships;" +
    "this.switchActiveRole=switchActiveRole;this.manageUserRoleMemberships=manageUserRoleMemberships;", ctx);
  return { ctx, sheets, cacheValues, membershipRows, userRows, matrixRows };
}

function row(id, user, role, institution, status, start, end) {
  return [id,user,role,institution,status,start,end,"U-ADMIN",now,now,"",""];
}

{
  const rows = [
    headers,
    row("MEM-1","U-1","Director","INST-1","ACTIVE",activeStart,activeEnd),
    row("MEM-FUTURE","U-1","Coordinador","INST-1","ACTIVE",new Date(now.getTime()+86400000).toISOString(),""),
    row("MEM-EXPIRED","U-1","Expired","INST-1","ACTIVE","",new Date(now.getTime()-86400000).toISOString()),
    row("MEM-REVOKED","U-1","Revoked","INST-1","REVOKED",activeStart,activeEnd),
    row("MEM-OTHER","U-1","OtherTenant","INST-2","ACTIVE",activeStart,activeEnd),
    row("MEM-OTHER-USER","U-2","Director","INST-1","ACTIVE",activeStart,activeEnd),
    row("MEM-BAD-DATE","U-1","BadDate","INST-1","ACTIVE","not-a-date","")
  ];
  const { ctx } = makeHarness({ membershipRows: rows });
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1").membershipId,"MEM-1");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Coordinador","INST-1"),null,"future membership is not active");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Expired","INST-1"),null,"expired membership is denied");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Revoked","INST-1"),null,"revoked membership is denied");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","OtherTenant","INST-1"),null,"cross-institution membership is denied");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-2"),null,"institution selector cannot cross tenant");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","BadDate","INST-1"),null,"malformed dates fail closed");
  assert.equal(ctx.resolveUserRoleMembership_("U-2","Director","INST-1").membershipId,"MEM-OTHER-USER","membership is bound to exact user");
}

{
  const duplicate = [headers,row("MEM-D1","U-1","Director","INST-1","ACTIVE",activeStart,activeEnd),row("MEM-D2","U-1","Director","INST-1","ACTIVE",activeStart,activeEnd)];
  const { ctx } = makeHarness({ membershipRows: duplicate });
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1"),null,"ambiguous duplicate active role grants are denied");
  const duplicateId = [headers,row("MEM-DUP","U-1","Director","INST-1","ACTIVE",activeStart,activeEnd),row("MEM-DUP","U-2","Coordinador","INST-1","ACTIVE",activeStart,activeEnd)];
  const second = makeHarness({ membershipRows: duplicateId });
  assert.equal(second.ctx.resolveUserRoleMembership_("U-1","Director","INST-1"),null,"globally duplicated membership identifiers are denied");
  const badSchema = makeHarness({ membershipRows: [["MembershipID","UserID","RoleID"]] });
  assert.throws(() => badSchema.ctx.getUserRoleMembershipState_("U-1","INST-1"), /ROLE_MEMBERSHIP_SCHEMA_MISMATCH/);
}

{
  const rows = [headers,row("MEM-DIR","U-1","Director","INST-1","ACTIVE",activeStart,activeEnd)];
  const { ctx, membershipRows } = makeHarness({ membershipRows: rows });
  const roleToken = ctx.generateSessionToken({ userId:"U-1",email:"u1@example.test",role:"Director",membershipId:"MEM-DIR",institutionId:"INST-1" });
  const roleClaims = ctx.verifySessionToken(roleToken);
  assert.equal(roleClaims.role,"Director","membership-backed role may differ from legacy Users.Rol");
  assert.equal(roleClaims.membershipId,"MEM-DIR");
  membershipRows[1][4] = "REVOKED";
  assert.equal(ctx.verifySessionToken(roleToken),null,"revocation invalidates the signed role token");
  const legacyToken = ctx.generateSessionToken({ userId:"U-1",email:"u1@example.test",role:"Student" });
  assert.equal(ctx.verifySessionToken(legacyToken).role,"Student","legacy single-role tokens remain compatible");
  const forgedLegacyRole = ctx.generateSessionToken({ userId:"U-1",email:"u1@example.test",role:"Director" });
  assert.equal(ctx.verifySessionToken(forgedLegacyRole),null,"legacy token cannot choose a role outside Usuarios.Rol");
  const incompleteMembershipToken = ctx.generateSessionToken({ userId:"U-1",email:"u1@example.test",role:"Director",membershipId:"MEM-DIR" });
  assert.equal(ctx.verifySessionToken(incompleteMembershipToken),null,"membership claims require institution binding");
}

{
  const rows = [headers,row("MEM-DIR","U-1","Director","INST-1","ACTIVE",activeStart,activeEnd),row("MEM-COORD","U-1","Coordinador","INST-1","ACTIVE",activeStart,activeEnd)];
  const { ctx } = makeHarness({ membershipRows: rows });
  const legacyToken = ctx.generateSessionToken({ userId:"U-1",email:"u1@example.test",role:"Student" });
  const switched = ctx.switchActiveRole({ sessionToken:legacyToken,activeRoleId:"Coordinador" });
  assert.equal(switched.status,"success");
  const activeClaims = ctx.verifySessionToken(switched.sessionToken);
  assert.equal(activeClaims.role,"Coordinador");
  assert.equal(activeClaims.membershipId,"MEM-COORD");
  assert.equal(ctx.verifySessionToken(legacyToken),null,"switching active role revokes the previous session");
  const denied = ctx.switchActiveRole({ sessionToken:switched.sessionToken,activeRoleId:"Administrador" });
  assert.equal(denied.code,"ROLE_MEMBERSHIP_NOT_ACTIVE");
}

{
  const rows = [headers];
  const { ctx, membershipRows, sheets } = makeHarness({ membershipRows: rows });
  const assigned = ctx.manageUserRoleMemberships({ sessionToken:"signed-admin",_verifiedUserId:"U-ADMIN",action:"ASSIGN",userId:"U-1",roleId:"Director",startAt:activeStart,endAt:activeEnd });
  assert.equal(assigned.status,"success");
  assert.equal(membershipRows.length,2);
  assert.equal(membershipRows[1][4],"ACTIVE");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1").membershipId,assigned.membershipId);
  const duplicate = ctx.manageUserRoleMemberships({ sessionToken:"signed-admin",_verifiedUserId:"U-ADMIN",action:"ASSIGN",userId:"U-1",roleId:"Director",startAt:activeStart,endAt:activeEnd });
  assert.equal(duplicate.code,"ROLE_MEMBERSHIP_ALREADY_EXISTS");
  const revoked = ctx.manageUserRoleMemberships({ sessionToken:"signed-admin",_verifiedUserId:"U-ADMIN",action:"REVOKE",userId:"U-1",membershipId:assigned.membershipId });
  assert.equal(revoked.status,"success");
  assert.equal(membershipRows[1][4],"REVOKED");
  assert.equal(membershipRows[1][10],"U-ADMIN");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1"),null);
  assert.equal(ctx.locked,false,"membership writes release ScriptLock");
  assert.ok(sheets.MembresiasRolesRBAC);
}

console.log("User role membership contract: institution/user binding, effective dates, revocation, duplicate denial, signed active role switching, legacy compatibility and locked assignment lifecycle passed.");
