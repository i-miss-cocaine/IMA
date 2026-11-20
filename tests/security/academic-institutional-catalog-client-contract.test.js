"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/config.js", "utf8");
const marker = "window.fetchInstitutionalCatalog = function(catalogType) {";
const start = source.indexOf(marker);
assert.notEqual(start, -1, "client catalog synchronization function must exist");
const open = source.indexOf("{", start);
let depth = 0, quote = "", escaped = false, lineComment = false, blockComment = false, end = -1;
for (let i = open; i < source.length; i++) {
  const ch = source[i], next = source[i + 1];
  if (lineComment) { if (ch === "\n") lineComment = false; continue; }
  if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
  if (quote) { if (escaped) { escaped = false; continue; } if (ch === "\\") { escaped = true; continue; } if (ch === quote) quote = ""; continue; }
  if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
  if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
  if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
  if (ch === "{") depth++;
  else if (ch === "}" && --depth === 0) { end = i + 1; break; }
}
assert.notEqual(end, -1, "client catalog synchronization function must be balanced");
const fn = source.slice(start, end);
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function harness(api) {
  const window = {
    INSTITUTIONAL_CATALOG_CACHE:{areas:{},subjects:{},departments:{}},
    INSTITUTIONAL_CATALOG_STATE:{source:"LOCAL_FALLBACK",authoritative:false,catalogRevision:null,catalogRevisions:{areas:null,subjects:null,departments:null},catalogSources:{areas:"LOCAL_FALLBACK",subjects:"LOCAL_FALLBACK",departments:"LOCAL_FALLBACK"}},
    SERVICE_VERSIONS:{ACADEMIC:"test"}, CACHE_POLICIES:{INSTITUTIONAL_CATALOGS:{ttlSeconds:60}},
    getSharedConfigVersion:()=>"test-config", fetchApi:api,
    registerNewCurricularAreaServiceConfig(item) { this.INSTITUTIONAL_CATALOG_CACHE.areas[item.areaId]=item; },
    registerNewAcademicSubjectServiceConfig(item) { this.INSTITUTIONAL_CATALOG_CACHE.subjects[item.asignaturaId]=item; },
    registerNewAcademicDepartmentServiceConfig(item) { this.INSTITUTIONAL_CATALOG_CACHE.departments[item.departmentId||item.deptId]=item; }
  };
  vm.runInNewContext(fn,{window,Promise,Number,String,Object,Array,Date,console});
  return window;
}
function result(revision,data) { return {status:"success",schemaVersion:"1.0.0",version:"2026.2",catalogRevision:revision,data}; }
(async function main() {
  const pending=[];
  const window=harness(() => { const d=deferred(); pending.push(d); return d.promise; });
  const first=window.fetchInstitutionalCatalog("SUBJECTS");
  pending[0].resolve(result(5,{areasCurricularesMetadata:[],asignaturasMetadata:[{asignaturaId:"SUB-5",nombreOficial:"Asignatura cinco",codigo:"S5",estado:"Activo",isActive:true}],departamentosAcademicosMetadata:[]}));
  const partial=await first;
  assert.equal(partial.status,"success");
  assert.equal(partial.authoritative,false,"one catalog cannot claim whole-catalog authority");
  assert.equal(window.INSTITUTIONAL_CATALOG_STATE.catalogSources.subjects,"SERVER");
  assert.equal(window.INSTITUTIONAL_CATALOG_STATE.catalogSources.areas,"LOCAL_FALLBACK");

  const oldRequest=window.fetchInstitutionalCatalog("SUBJECTS");
  const newRequest=window.fetchInstitutionalCatalog("SUBJECTS");
  pending[2].resolve(result(7,{areasCurricularesMetadata:[],asignaturasMetadata:[{asignaturaId:"SUB-7",nombreOficial:"Versión nueva",codigo:"S7",estado:"Activo",isActive:true}],departamentosAcademicosMetadata:[]}));
  await newRequest;
  pending[1].resolve(result(6,{areasCurricularesMetadata:[],asignaturasMetadata:[{asignaturaId:"SUB-6",nombreOficial:"Versión antigua",codigo:"S6",estado:"Activo",isActive:true}],departamentosAcademicosMetadata:[]}));
  const stale=await oldRequest;
  assert.equal(stale.status,"stale");
  assert.equal(stale.staleResponseIgnored,true);
  assert.equal(window.INSTITUTIONAL_CATALOG_CACHE.subjects["SUB-7"].nombreOficial,"Versión nueva");
  assert.equal(window.INSTITUTIONAL_CATALOG_CACHE.subjects["SUB-6"],undefined);
  assert.equal(window.INSTITUTIONAL_CATALOG_STATE.catalogRevision,7);

  const oldAll=window.fetchInstitutionalCatalog("ALL");
  const newerSubjects=window.fetchInstitutionalCatalog("SUBJECTS");
  pending[4].resolve(result(9,{areasCurricularesMetadata:[],asignaturasMetadata:[{asignaturaId:"SUB-9",nombreOficial:"Asignatura nueve",codigo:"S9",estado:"Activo",isActive:true}],departamentosAcademicosMetadata:[]}));
  await newerSubjects;
  pending[3].resolve(result(8,{
    areasCurricularesMetadata:[{areaId:"AREA-8",name:"Área ocho",code:"A8",estado:"Activo",isActive:true}],
    asignaturasMetadata:[{asignaturaId:"SUB-8",nombreOficial:"Asignatura ocho",codigo:"S8",estado:"Activo",isActive:true}],
    departamentosAcademicosMetadata:[{departmentId:"DEP-8",name:"Departamento ocho",estado:"Activo",isActive:true}]
  }));
  const mixed=await oldAll;
  assert.equal(mixed.status,"success");
  assert.deepEqual(Array.from(mixed.staleCatalogTypes),["subjects"]);
  assert.equal(window.INSTITUTIONAL_CATALOG_CACHE.subjects["SUB-9"].nombreOficial,"Asignatura nueve");
  assert.equal(window.INSTITUTIONAL_CATALOG_CACHE.subjects["SUB-8"],undefined);
  assert.equal(window.INSTITUTIONAL_CATALOG_CACHE.areas["AREA-8"].name,"Área ocho");
  assert.equal(window.INSTITUTIONAL_CATALOG_CACHE.departments["DEP-8"].name,"Departamento ocho");
  assert.equal(window.INSTITUTIONAL_CATALOG_STATE.catalogRevision,9);
  assert.equal(window.INSTITUTIONAL_CATALOG_STATE.authoritative,true);

  const unavailableApi = harness(null);
  const unavailable = await unavailableApi.fetchInstitutionalCatalog("ALL");
  assert.equal(unavailable.status,"fallback");
  assert.equal(unavailable.authoritative,false);
  assert.equal(unavailable.source,"LOCAL_FALLBACK");
  assert.equal(unavailable.error.code,"FETCH_API_UNAVAILABLE");

  const malformedApi = harness(() => Promise.resolve({status:"success",schemaVersion:"0.0.0",catalogRevision:10,data:{}}));
  const malformed = await malformedApi.fetchInstitutionalCatalog("SUBJECTS");
  assert.equal(malformed.status,"fallback");
  assert.equal(malformed.authoritative,false);
  assert.equal(malformed.error.code,"INVALID_CATALOG_CONTRACT");

  const offlineApi = harness(() => Promise.reject(new Error("offline")));
  const offline = await offlineApi.fetchInstitutionalCatalog("CURRICULAR_AREAS");
  assert.equal(offline.status,"fallback");
  assert.equal(offline.authoritative,false);
  assert.equal(offline.error.code,"CATALOG_SYNC_FAILED");

  const emptyApi = harness(() => Promise.resolve(result(11,{
    areasCurricularesMetadata:[],asignaturasMetadata:[],departamentosAcademicosMetadata:[]
  })));
  const empty = await emptyApi.fetchInstitutionalCatalog("ALL");
  assert.equal(empty.status,"success","a valid empty institutional catalog is not a transport failure");
  assert.equal(empty.authoritative,true);
  assert.equal(empty.catalogRevision,11);
  assert.equal(Object.keys(emptyApi.INSTITUTIONAL_CATALOG_CACHE.subjects).length,0);

  console.log("Institutional catalog client contract PASS (race ordering, partial authority, malformed/empty/transport fallback).");
})().catch(error => { console.error(error); process.exitCode = 1; });
