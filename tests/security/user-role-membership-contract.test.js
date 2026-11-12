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
const functionNames = ["generateSessionToken","verifySessionToken","getUserVerifiedRole","getUserRoleMemberships","switchActiveRole","manageUserRoleMemberships","ensureUserRoleMembershipSheet_","isConfiguredRbacRole_"];
const functions = functionNames.map(name => extractFunction(sourceCode, name));
const headers = ["MembershipID","UserID","RoleID","InstitutionID","Status","StartAt","EndAt","CreatedBy","CreatedAt","UpdatedAt","RevokedBy","RevokedAt"];
const now = new Date(), start = new Date(now.getTime()-86400000).toISOString(), end = new Date(now.getTime()+86400000).toISOString();

function makeHarness(membershipRows = [headers]) {
  const userRows = [
    ["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta","FechaCreacion","UltimoAcceso"],
    ["U-1","Test User","","","u1@example.test","","Student","","","","Activa","",""]
  ];
  const matrixRows = [
    ["rol","modulo","accion","permitido","ambito","ultimaModificacion","modificadoPor"],
    ["Director","General","manageUserRoleMemberships",true,"Global",now,"U-ADMIN"],
    ["Director","General","read",true,"Global",now,"U-ADMIN"],
    ["Coordinador","General","read",true,"Global",now,"U-ADMIN"]
  ];
  const sheets = {};
  function sheet(rows) {
    return {
      rows,
      getLastRow() { return rows.length; },
      getDataRange() { return { getValues: () => rows.map(r => r.slice()) }; },
      getRange(r,c,nr,nc) {
        return {
          getValues() { return rows.slice(r-1,r-1+(nr||1)).map(x=>x.slice(c-1,c-1+(nc||1))); },
          setValue(v) { rows[r-1][c-1]=v; },
          setValues(v) { v.forEach((x,i)=>rows[r-1+i].splice(c-1,x.length,...x)); }
        };
      },
      appendRow(r) { rows.push(r.slice()); }
    };
  }
  sheets.MembresiasRolesRBAC = sheet(membershipRows);
  sheets.Usuarios = sheet(userRows);
  sheets.MatrizPermisosRoles = sheet(matrixRows);
  const cache = {};
  const ctx = {
    SPREADSHEET_ID:"LOCAL",
    ROLE_PERMISSIONS:{Student:[],Director:[],Coordinador:[],Future:[],Expired:[],Revoked:[],Other:[],BadDate:[]},
    SpreadsheetApp:{openById(id){assert.equal(id,"LOCAL");return{getSheetByName:n=>sheets[n]||null,insertSheet(n){sheets[n]=sheet([]);return sheets[n];}};}},
    CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})},
    Utilities:{
      base64EncodeWebSafe:v=>Buffer.from(v).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_"),
      base64Decode:v=>Buffer.from(v,"base64"),
      newBlob:v=>({getDataAsString:()=>Buffer.from(v).toString("utf8")}),
      getUuid:()=>"uuid-test-001"
    },
    getAuthTokenSecret:()=>"secret",
    computeHmacSignature:(v,s)=>"sig:"+v+":"+s,
    getIdentityInstitutionId_:()=>"INST-1",
    LockService:{getScriptLock:()=>({waitLock(){ctx.locked=true;},releaseLock(){ctx.locked=false;}})},
    validateRolePermission:()=>({authorized:true}),
    invalidateUserRoleCache:()=>true,
    logStructuredEvent:()=>true,
    locked:false
  };
  vm.runInNewContext(membershipHelpers+"\n"+functions.join("\n")+
    "\nthis.generateSessionToken=generateSessionToken;this.verifySessionToken=verifySessionToken;"+
    "this.getUserVerifiedRole=getUserVerifiedRole;this.getUserRoleMemberships=getUserRoleMemberships;"+
    "this.switchActiveRole=switchActiveRole;this.manageUserRoleMemberships=manageUserRoleMemberships;"+
    "this.resolveUserRoleMembership_=resolveUserRoleMembership_;this.getUserRoleMembershipState_=getUserRoleMembershipState_;",ctx);
  return {ctx,sheets,cache,membershipRows};
}
function membership(id,user,role,institution,status="ACTIVE",from=start,to=end){return[id,user,role,institution,status,from,to,"U-ADMIN",now,now,"",""];}

{
  const rows=[headers,membership("M1","U-1","Director","INST-1"),membership("MF","U-1","Future","INST-1","ACTIVE",new Date(now.getTime()+86400000).toISOString(),""),membership("ME","U-1","Expired","INST-1","ACTIVE","",new Date(now.getTime()-86400000).toISOString()),membership("MR","U-1","Revoked","INST-1","REVOKED"),membership("MX","U-1","Other","INST-2"),membership("MU","U-2","Director","INST-1"),membership("MB","U-1","BadDate","INST-1","ACTIVE","invalid","")];
  const {ctx}=makeHarness(rows);
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1").membershipId,"M1");
  for(const role of ["Future","Expired","Revoked","Other","BadDate"]) assert.equal(ctx.resolveUserRoleMembership_("U-1",role,"INST-1"),null,role+" must be denied");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-2"),null,"wrong institution denied");
  assert.equal(ctx.resolveUserRoleMembership_("U-2","Director","INST-1").membershipId,"MU","exact user binding");
}
{
  const duplicate=makeHarness([headers,membership("M1","U-1","Director","INST-1"),membership("M2","U-1","Director","INST-1")]);
  assert.equal(duplicate.ctx.resolveUserRoleMembership_("U-1","Director","INST-1"),null,"duplicate active memberships fail closed");
  const duplicateId=makeHarness([headers,membership("M1","U-1","Director","INST-1"),membership("M1","U-2","Coordinador","INST-1")]);
  assert.equal(duplicateId.ctx.resolveUserRoleMembership_("U-1","Director","INST-1"),null,"duplicate membership ID fails closed");
  const bad=makeHarness([["MembershipID","UserID","RoleID"]]);
  assert.throws(()=>bad.ctx.getUserRoleMembershipState_("U-1","INST-1"),/ROLE_MEMBERSHIP_SCHEMA_MISMATCH/);
}
{
  const rows=[headers,membership("M-DIR","U-1","Director","INST-1")];
  const {ctx,membershipRows}=makeHarness(rows);
  const token=ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Director",membershipId:"M-DIR",institutionId:"INST-1"});
  assert.equal(ctx.verifySessionToken(token).role,"Director","membership role may differ from legacy Users.Rol");
  membershipRows[1][4]="REVOKED";
  assert.equal(ctx.verifySessionToken(token),null,"revocation invalidates token");
  const legacy=ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Student"});
  assert.equal(ctx.verifySessionToken(legacy).role,"Student","legacy single-role compatibility");
  const forged=ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Director"});
  assert.equal(ctx.verifySessionToken(forged),null,"legacy token cannot elevate role");
  const incomplete=ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Director",membershipId:"M-DIR"});
  assert.equal(ctx.verifySessionToken(incomplete),null,"membership token requires institution");
}
{
  const rows=[headers,membership("M-DIR","U-1","Director","INST-1"),membership("M-COORD","U-1","Coordinador","INST-1")];
  const {ctx}=makeHarness(rows);
  const legacy=ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Student"});
  const switched=ctx.switchActiveRole({sessionToken:legacy,activeRoleId:"Coordinador"});
  assert.equal(switched.status,"success");
  assert.equal(ctx.verifySessionToken(switched.sessionToken).role,"Coordinador");
  assert.equal(ctx.verifySessionToken(legacy),null,"role switch revokes previous session");
  assert.equal(ctx.switchActiveRole({sessionToken:switched.sessionToken,activeRoleId:"Administrador"}).code,"ROLE_MEMBERSHIP_NOT_ACTIVE");
}
{
  const rows=[headers], {ctx,membershipRows}=makeHarness(rows);
  const adminSession=ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Student"});
  const assigned=ctx.manageUserRoleMemberships({sessionToken:adminSession,action:"ASSIGN",userId:"U-1",roleId:"Director",startAt:start,endAt:end});
  assert.equal(assigned.status,"success");
  assert.equal(membershipRows.length,2);
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1").membershipId,assigned.membershipId);
  assert.equal(ctx.manageUserRoleMemberships({sessionToken:adminSession,action:"ASSIGN",userId:"U-1",roleId:"Director"}).code,"ROLE_MEMBERSHIP_ALREADY_EXISTS");
  assert.equal(ctx.manageUserRoleMemberships({sessionToken:adminSession,action:"REVOKE",userId:"U-1",membershipId:assigned.membershipId}).status,"success");
  assert.equal(membershipRows[1][4],"REVOKED");
  assert.equal(ctx.resolveUserRoleMembership_("U-1","Director","INST-1"),null);
  assert.equal(ctx.locked,false,"ScriptLock is released");
}

console.log("User role membership contract: institution/user binding, effective dates, revocation, duplicate denial, signed active-role switching, legacy compatibility and locked assignment lifecycle passed.");


{
  const servicePaths = [
    "../../backend/academic-service/Code.gs",
    "../../backend/accounting-service/Code.gs",
    "../../backend/task-service/Code.gs",
    "../../backend/exam-service/Code.gs"
  ];
  const sharedRows = [headers,membership("M-SHARED","U-1","Director","INST-1")];
  const userHarness = makeHarness(sharedRows);
  const signedRoleToken = userHarness.ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Director",membershipId:"M-SHARED",institutionId:"INST-1"});
  const legacyToken = userHarness.ctx.generateSessionToken({userId:"U-1",email:"u1@example.test",role:"Student"});
  for (const relativePath of servicePaths) {
    const serviceSource = fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");
    const membershipVerifier = extractFunction(serviceSource, "verifyUserRoleMembershipClaim_");
    const sessionVerifier = extractFunction(serviceSource, "verifySessionToken");
    const cache = {};
    const serviceCtx = {
      SPREADSHEET_ID:"LOCAL",
      PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==="IMA_INSTITUTION_ID"?"INST-1":""})},
      SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="Usuarios"?{getDataRange:()=>({getValues:()=>[
        ["UserId","Nombre","Grado","Seccion","Email","PasswordHash","Rol","Telefono","NumeroLista","PersonaID","EstadoCuenta"],
        ["U-1","Test User","","","u1@example.test","","Student","","","","Activa"]
      ]})}:name==="MembresiasRolesRBAC"?{getDataRange:()=>({getValues:()=>sharedRows.map(r=>r.slice())})}:null})},
      CacheService:{getScriptCache:()=>({get:key=>cache[key]||null,put:(key,value)=>cache[key]=value})},
      Utilities:{base64Decode:value=>Buffer.from(value,"base64"),newBlob:value=>({getDataAsString:()=>Buffer.from(value).toString("utf8")})},
      getAuthTokenSecret:()=>"secret",
      computeHmacSignature:(value,secret)=>"sig:"+value+":"+secret
    };
    vm.runInNewContext(membershipVerifier+"\\n"+sessionVerifier+"\\nthis.verifySessionToken=verifySessionToken;",serviceCtx);
    assert.equal(serviceCtx.verifySessionToken(signedRoleToken).role,"Director",relativePath+" accepts active membership token");
    sharedRows[1][4]="REVOKED";
    assert.equal(serviceCtx.verifySessionToken(signedRoleToken),null,relativePath+" rejects revoked membership");
    sharedRows[1][4]="ACTIVE";
    assert.equal(serviceCtx.verifySessionToken(legacyToken).role,"Student",relativePath+" preserves legacy token");
  }
}

{
  const developerSource = fs.readFileSync(path.resolve(__dirname, "../../backend/developer-service/Code.gs"), "utf8");
  const developerVerifier = extractFunction(developerSource, "verifySessionToken");
  const developerCtx = {
    getAuthTokenSecret:()=>"secret",
    Utilities:{
      MacAlgorithm:{HMAC_SHA_256:"HMAC_SHA_256"},
      computeHmacSignature:()=>[1,2,3],
      base64Decode:value=>Buffer.from(value,"base64"),
      newBlob:value=>({getDataAsString:()=>Buffer.from(value).toString("utf8")})
    }
  };
  vm.runInNewContext(developerVerifier+"\\nthis.verifySessionToken=verifySessionToken;",developerCtx);
  const nowSeconds=Math.floor(Date.now()/1000);
  function developerToken(extra) {
    const claims=Object.assign({userId:"U-1",role:"Student",iat:nowSeconds,exp:nowSeconds+3600,sessionId:"DEV-SESSION"},extra||{});
    const payload=Buffer.from(JSON.stringify(claims)).toString("base64").replace(/=/g,"").replace(/\\+/g,"-").replace(/\\//g,"_");
    return payload+".010203";
  }
  assert.equal(developerCtx.verifySessionToken(developerToken({membershipId:"M-SHARED",institutionId:"INST-1"})),null,"separate developer control plane rejects app membership tokens");
  assert.equal(developerCtx.verifySessionToken(developerToken()).role,"Student","developer control plane preserves legacy token compatibility");
}
