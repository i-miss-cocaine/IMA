"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function extract(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"missing "+name);
 const open=source.indexOf("{",start);let depth=0,quote="",escape=false,line=false,block=false;
 for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==="\n")line=false;continue;}if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}if(c==="/"&&n==="/"){line=true;i++;continue;}if(c==="/"&&n==="*"){block=true;i++;continue;}if(c==="'"||c==='"'||c==="\x60"){quote=c;continue;}if(c==="{")depth++;else if(c==="}"&&--depth===0)return source.slice(start,i+1);}
 throw Error("unbalanced "+name);
}
const services=["user","academic","accounting","task","exam"];
function permissionLookup(service,matrixRows,versionRows,cache){
 const source=fs.readFileSync(path.resolve(__dirname,"../../backend/"+service+"-service/Code.gs"),"utf8");
 const matrix={getLastRow:()=>matrixRows.length,getDataRange:()=>({getValues:()=>matrixRows.map(r=>r.slice())})};
 const versions={getDataRange:()=>({getValues:()=>versionRows.map(r=>r.slice())})};
 const context={SPREADSHEET_ID:"LOCAL",getIdentityInstitutionId_:()=>"INST-A",PropertiesService:{getScriptProperties:()=>({getProperty:()=>"INST-A"})},
  cache:cache,CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>{cache[k]=v;},remove:k=>{delete cache[k];}})},
  SpreadsheetApp:{openById:()=>({getSheetByName:n=>n==="VersionesSeguridad"?versions:(n==="MatrizPermisosRoles"?matrix:null)})}};
 const prelude=source.slice(source.indexOf("var SECURITY_VERSION_HEADERS_"),source.indexOf("function getDynamicPermissionsForRole"));
 vm.runInNewContext(prelude+"\n"+extract(source,"getPermissionMatrixInstitutionId_")+"\n"+extract(source,"getDynamicPermissionsForRole")+"\nthis.lookup=getDynamicPermissionsForRole;",context);
 return context.lookup;
}
for(const service of services){
 const module=service.toUpperCase(),cache={},matrix=[["rol","modulo","accion","permitido","ambito"],["Director",module,"readSensitive",true,"INST-A"]];
 const versions=[["Clave","Version","UpdatedAt","UpdatedBy"],["PERMISSION_MATRIX",0,"",""]];
 assert.equal(permissionLookup(service,matrix,versions,cache)("Director",module,"readSensitive","INST-A"),true,service+" starts with grant");
 matrix[1][3]=false;versions[1][1]=1;
 assert.equal(permissionLookup(service,matrix,versions,cache)("Director",module,"readSensitive","INST-A"),false,service+" observes cross-service version change");
 assert.ok(Object.keys(cache).some(k=>k.indexOf("dynamic_permissions_matrix_v3:"+module+":INST-A:1")===0),service+" cache key includes logical version");
}
const userSource=fs.readFileSync(path.resolve(__dirname,"../../backend/user-service/Code.gs"),"utf8");
const versionPrelude=userSource.slice(userSource.indexOf("var SECURITY_VERSION_HEADERS_"),userSource.indexOf("function getDynamicPermissionsForRole"));
const versionSheet={rows:[["Clave","Version","UpdatedAt","UpdatedBy"],["USER_ROLE:u-1",2,new Date(),"admin"]],
 getLastRow(){return this.rows.length;},getDataRange(){return{getValues:()=>this.rows.map(r=>r.slice())};},
 appendRow(row){this.rows.push(row.slice());},getRange(row,col,nr,nc){const self=this;return{setValues:values=>{for(let y=0;y<nr;y++)for(let x=0;x<nc;x++)self.rows[row+y-1][col+x-1]=values[y][x];}};}};
const versionContext={SPREADSHEET_ID:"LOCAL",SpreadsheetApp:{openById:()=>({getSheetByName:()=>versionSheet,insertSheet:()=>versionSheet})}};
vm.runInNewContext(versionPrelude+"\n"+extract(userSource,"incrementSecurityVersionLocked_")+"\nthis.read=getSecurityVersion_;this.bump=incrementSecurityVersionLocked_;",versionContext);
assert.equal(versionContext.read("USER_ROLE:u-1"),2,"read persisted role version");
assert.equal(versionContext.bump("USER_ROLE:u-1","admin"),3,"role version increments monotonically");
assert.equal(versionContext.read("USER_ROLE:u-1"),3,"same execution observes its own version bump");
versionSheet.rows.push(["USER_ROLE:u-1",3,new Date(),"admin"]);
assert.equal(versionContext.bump("USER_ROLE:u-1","admin"),false,"duplicate version key fails closed");
function verifyWithVersion(claimVersion,currentVersion){
 const now=Math.floor(Date.now()/1000),claims={userId:"u-1",role:"Director",iat:now-10,exp:now+3600,sessionId:"S-1"};
 if(claimVersion!==undefined)claims.roleVersion=claimVersion;
 const versions=[["Clave","Version","UpdatedAt","UpdatedBy"],["USER_ROLE:u-1",currentVersion,new Date(),"admin"]];
 const userSheet={getDataRange:()=>({getValues:()=>[["id","","","","","","role","","","","state"],["u-1","","","","","","Director","","","","Activa"]]})};
 const vSheet={getDataRange:()=>({getValues:()=>versions.map(r=>r.slice())})};
 const context={SPREADSHEET_ID:"LOCAL",getAuthTokenSecret:()=>"secret",computeHmacSignature:()=>"sig",isSessionRevoked_:()=>false,
  Utilities:{base64Decode:()=>[],newBlob:()=>({getDataAsString:()=>JSON.stringify(claims)})},
  CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},
  SpreadsheetApp:{openById:()=>({getSheetByName:n=>n==="VersionesSeguridad"?vSheet:(n==="Usuarios"?userSheet:null)})}};
 vm.runInNewContext(versionPrelude+"\n"+extract(userSource,"verifySessionToken")+"\nthis.verify=verifySessionToken;",context);
 return context.verify("payload.sig");
}
assert.ok(verifyWithVersion(2,2),"current role version token is accepted");
assert.equal(verifyWithVersion(1,2),null,"stale role version token is rejected");
assert.equal(verifyWithVersion(undefined,2),null,"legacy token is rejected after privilege version changes");
assert.ok(verifyWithVersion(undefined,0),"legacy token remains compatible before first versioned privilege change");
process.stdout.write("security version propagation, five-service cache invalidation, monotonic role versions and stale-session rejection PASS\n");
