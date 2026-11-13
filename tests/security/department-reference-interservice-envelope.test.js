const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../backend/user-service/Code.gs"), "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });
const secret="department-reference-secret-with-more-than-32-characters";
function sign(envelope) {
  const body=envelope.requestId+"|"+envelope.timestamp+"|"+envelope.correlationId+"|"+
    envelope.sourceService+"|"+envelope.targetService+"|"+envelope.action+"|"+JSON.stringify(envelope.payload||{});
  return crypto.createHmac("sha256",secret).update(body).digest("hex");
}
function envelope(overrides={}) {
  const e=Object.assign({sourceService:"ACADEMIC",targetService:"USER",action:"authorizeDepartmentReferenceRead",
    requestId:"REQ-"+Date.now()+"-ABC123",timestamp:Date.now(),correlationId:"CORR-"+Date.now(),
    payload:{sessionToken:"signed-session-token",resourceType:"DOCUMENTO_ESTUDIANTE",resourceId:"DOC-1",
      requestedFields:["nombreArchivo"],requestedDocumentIds:["DOC-1"]}},overrides);
  e.hmacSignature=sign(e);
  return e;
}
function makeRuntime(options={}) {
  const cache=new Map(), state={calls:[],cache};
  const lock={tryLock(){return !options.lockBusy;},releaseLock(){}};
  const runtime={
    Date,String,JSON,Array,Object,Number,Math,isNaN,
    computeHmacSignature(message,key){return crypto.createHmac("sha256",key).update(message).digest("hex");},
    LockService:{getScriptLock(){return lock;}},
    CacheService:{getScriptCache(){return {get(key){return cache.get(key)||null;},put(key,value,ttl){cache.set(key,value);}};}},
    PropertiesService:{getScriptProperties(){return {getProperty(name){return name==="IMA_DEPARTMENT_REFERENCE_HMAC_SECRET"?(options.secret===undefined?secret:options.secret):null;}};}},
    authorizeDepartmentReferenceRead(payload){state.calls.push(payload);return {status:"success",authorized:true,code:"DEPARTMENT_REFERENCE_ALLOWED"};}
  };
  const start=source.indexOf("function verifyDepartmentReferenceEnvelope_");
  const end=source.indexOf("function handleTrustedMigrationEnvelope_(envelope)");
  assert.ok(start>=0&&end>start,"trusted reference envelope implementation exists");
  vm.runInNewContext(source.slice(start,end)+"\nthis.verify=verifyDepartmentReferenceEnvelope_; this.handle=handleTrustedDepartmentReferenceEnvelope_;",runtime);
  return {runtime,state};
}
{
  const h=makeRuntime(),e=envelope();
  const r=h.runtime.verify(e,"USER",secret);
  assert.equal(r.valid,true); assert.equal(r.sourceService,"ACADEMIC");
  assert.equal(r.payload.resourceId,"DOC-1");
}
{
  const h=makeRuntime(),e=envelope({sourceService:"ACCOUNTING"});
  e.hmacSignature=sign(e);
  assert.equal(h.runtime.verify(e,"USER",secret).sourceService,"ACCOUNTING");
}
{
  const h=makeRuntime(),e=envelope({sourceService:"EXAM"});
  e.hmacSignature=sign(e);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_INVALID/);
}
{
  const h=makeRuntime(),e=envelope({targetService:"ACADEMIC"});
  e.hmacSignature=sign(e);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_INVALID/);
}
{
  const h=makeRuntime(),e=envelope({action:"createDepartmentReferenceGrant"});
  e.hmacSignature=sign(e);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_INVALID/);
}
{
  const h=makeRuntime(),e=envelope({timestamp:Date.now()-600000});
  e.hmacSignature=sign(e);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_INVALID/);
}
{
  const h=makeRuntime(),e=envelope({requestId:"bad"});
  e.hmacSignature=sign(e);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_INVALID/);
}
{
  const h=makeRuntime(),e=envelope();
  e.hmacSignature="0".repeat(64);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_SIGNATURE_INVALID/);
}
{
  const h=makeRuntime(),e=envelope();
  assert.throws(()=>h.runtime.verify(e,"USER","short"),/DEPARTMENT_REFERENCE_TRANSPORT_SECRET_REQUIRED/);
}
{
  const h=makeRuntime({lockBusy:true}),e=envelope();
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_SERVICE_BUSY/);
}
{
  const h=makeRuntime(),e=envelope();
  h.runtime.verify(e,"USER",secret);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_REPLAY/);
}
{
  const h=makeRuntime(),e=envelope();
  e.hmacSignature="0".repeat(64);
  assert.throws(()=>h.runtime.verify(e,"USER",secret),/DEPARTMENT_REFERENCE_ENVELOPE_SIGNATURE_INVALID/);
  e.hmacSignature=sign(e);
  assert.equal(h.runtime.verify(e,"USER",secret).valid,true,"invalid HMAC must not poison the replay cache");
}
{
  const h=makeRuntime(),e=envelope();
  const r=h.runtime.handle(e);
  assert.equal(r.authorized,true);
  assert.equal(h.state.calls.length,1);
  assert.equal(h.state.calls[0].resourceId,"DOC-1");
}
{
  const h=makeRuntime({secret:""});
  assert.throws(()=>h.runtime.handle(envelope()),/DEPARTMENT_REFERENCE_TRANSPORT_SECRET_REQUIRED/);
  assert.equal(h.state.calls.length,0);
}
{
  assert.ok(source.includes('if (request && request.sourceService && request.action === "authorizeDepartmentReferenceRead") return textResponse(handleTrustedDepartmentReferenceEnvelope_(request));'));
}
process.stdout.write("Department reference interservice envelope contract: 15 scenarios PASS.\n");
