"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const backend = fs.readFileSync(path.join(__dirname, "../../backend/developer-service/Code.gs"), "utf8");
const api = fs.readFileSync(path.join(__dirname, "../../js/api.js"), "utf8");
const dashboard = fs.readFileSync(path.join(__dirname, "../../developer-dashboard.html"), "utf8");
const developerUi = fs.readFileSync(path.join(__dirname, "../../js/developer.js"), "utf8");
const normalizerMatch = backend.match(/function developerNormalizeRequestEnvelope_\(rawEnvelope\) \{[\s\S]*?\n\}/);
assert.ok(normalizerMatch, "Debe existir el normalizador del sobre HTTP");
const normalize = vm.runInNewContext("(" + normalizerMatch[0] + ")");
test("normaliza el sobre del cliente y conserva el token dentro del payload", () => {
 const token = "signed-session-token";
 const result = normalize({ action: "registerServiceInstance", correlationId: "REQ-1", payload: { serviceId: "SVC-1", sessionToken: token } });
 assert.equal(result.action, "registerServiceInstance"); assert.equal(result.payload.serviceId, "SVC-1");
 assert.equal(result.payload.sessionToken, token); assert.equal(result.correlationId, "REQ-1");
});
test("mantiene compatibilidad con solicitudes planas heredadas", () => {
 const result = normalize({ action: "getCentralServiceRegistry", sessionToken: "legacy-token" });
 assert.equal(result.action, "getCentralServiceRegistry"); assert.equal(result.payload.sessionToken, "legacy-token");
});
test("rechaza sobres nulos, arrays y valores no objeto", () => {
 for (const value of [null, [], "invalid", 4]) assert.throws(() => normalize(value), { message: "INVALID_REQUEST_ENVELOPE" });
});
function resolverFor(rows, relations = []) {
 const match = backend.match(/function resolveServiceEndpoint\(payload\) \{[\s\S]*?\n\}/);
 assert.ok(match, "Debe existir el resolver central");
 const lock = { tryLock: () => true, releaseLock: () => {} };
 const context = {
  SPREADSHEET_ID: "CONTROL",
  LockService: { getScriptLock: () => lock },
  SpreadsheetApp: { openById: () => ({ getSheetByName: name => {
   if (name === "CatalogoServicios") return { getDataRange: () => ({ getValues: () => [["headers"], ...rows] }) };
   if (name === "CatalogoRelacionesServicios") return { getDataRange: () => ({ getValues: () => [["headers"], ...relations] }) };
   return null;
  } }) },
  developerParseServiceRegistryRows_: data => ({ rows: data.slice(1) })
 };
 return vm.runInNewContext("(" + match[0] + ")", context);
}
function serviceRow(state, permissions = ["readRecord"]) {
 const row = Array(17).fill("");
 row[0] = "SVC-1"; row[4] = "https://script.google.com/macros/s/AbCd_123/exec";
 row[7] = state; row[8] = "v1"; row[9] = JSON.stringify(permissions);
 return row;
}
test("el resolver permite solo acciones concedidas en servicios activos", () => {
 const resolve = resolverFor([serviceRow("Activo")]);
 const allowed = resolve({ serviceId: "SVC-1", action: "readRecord" });
 assert.equal(allowed.status, "success"); assert.match(allowed.endpointUrl, /^https:\/\/script\.google\.com/);
 assert.equal(resolve({ serviceId: "SVC-1", action: "deleteRecord" }).code, "SERVICE_ACTION_NOT_GRANTED");
});
test("el resolver bloquea servicios suspendidos, retirados y desconectados", () => {
 for (const state of ["suspendido", "retirado", "desconectado"]) {
  const result = resolverFor([serviceRow(state)])({ serviceId: "SVC-1", action: "readRecord" });
  assert.notEqual(result.status, "success");
  assert.equal(result.endpointUrl, "");
 }
});
test("el resolver rechaza IDs duplicados y endpoints inseguros", () => {
 assert.equal(resolverFor([serviceRow("activo"), serviceRow("activo")])({ serviceId: "SVC-1", action: "readRecord" }).code, "SERVICE_REGISTRY_DUPLICATE_ID");
 const bad = serviceRow("activo"); bad[4] = "http://evil.example/exec";
 assert.equal(resolverFor([bad])({ serviceId: "SVC-1", action: "readRecord" }).code, "SERVICE_ENDPOINT_INVALID");
});
test("las actualizaciones de recursos y permisos quedan auditadas", () => {
 assert.match(backend, /function updateServiceMetadata_\(payload, verifiedActorId\)/);
 assert.match(backend, /Actualización auditada de metadatos/);
 assert.match(backend, /SERVICE_METADATA_COMPENSATION_REQUIRED/);
 assert.match(developerUi, /updateServiceMetadata/);
});
test("el cliente usa resolución central y el formulario registra permisos explícitos", () => {
 assert.match(api, /fetchApi\("DEVELOPER", "resolveServiceEndpoint"/);
 assert.match(api, /window\.fetchRegisteredServiceApi/);
 assert.match(dashboard, /id="service-registry-permissions"/);
 assert.match(developerUi, /service-registry-permissions/);
});
test("el dispatcher limita resolución y edición al rol Desarrollador", () => {
 assert.match(backend, /"Desarrollador": \[[^\]]*"resolveServiceEndpoint"[^\]]*"updateServiceMetadata"/);
 assert.match(backend, /case "resolveServiceEndpoint": result = resolveServiceEndpoint\(payload\); break;/);
 assert.match(backend, /case "updateServiceMetadata": result = updateServiceMetadata_\(payload, payload\._verifiedUserId\); break;/);
});

test("el resolver exige relación activa cuando se identifica un servicio emisor", () => {
 const relation = ["REL-1", "SRC-1", "SVC-1", "readRecord", "ACTIVE"];
 const source = serviceRow("activo"); source[0] = "SRC-1";
 const serviceRows = [serviceRow("activo"), source];
 const resolveAllowed = resolverFor(serviceRows, [relation]);
 assert.equal(resolveAllowed({ serviceId: "SVC-1", sourceServiceId: "SRC-1", action: "readRecord" }).status, "success");
 assert.equal(resolverFor(serviceRows, [])({ serviceId: "SVC-1", sourceServiceId: "SRC-1", action: "readRecord" }).code, "SERVICE_RELATION_NOT_GRANTED");
 relation[4] = "REVOKED";
 assert.equal(resolverFor(serviceRows, [relation])({ serviceId: "SVC-1", sourceServiceId: "SRC-1", action: "readRecord" }).code, "SERVICE_RELATION_NOT_GRANTED");
});
test("la consola puede habilitar y revocar relaciones de comunicación auditadas", () => {
 assert.match(backend, /function setServiceCommunicationPermission_\(payload, verifiedActorId\)/);
 assert.match(backend, /CatalogoRelacionesServicios/);
 assert.match(backend, /REL-SVC-/);
 assert.match(backend, /Cambio de relación de comunicación/);
 assert.match(developerUi, /setServiceCommunicationPermission/);
});
test("la auditoría identifica IDs duplicados, metadatos incompletos y relaciones huérfanas", () => {
 assert.match(backend, /function auditServiceRegistryIntegrity\(payload\)/);
 assert.match(backend, /SERVICE_METADATA_INCOMPLETE/);
 assert.match(backend, /orphanRelations/);
 assert.match(developerUi, /auditServiceRegistryIntegrity/);
 assert.match(dashboard, /btn-audit-service-registry/);
});

function postHandler() {
 const match = backend.match(/function doPost\(e\) \{[\s\S]*?\n\}/);
 assert.ok(match, "Debe existir doPost");
 const normalizerMatch = backend.match(/function developerNormalizeRequestEnvelope_\(rawEnvelope\) \{[\s\S]*?\n\}/);
 assert.ok(normalizerMatch);
 const normalizer = vm.runInNewContext("(" + normalizerMatch[0] + ")");
 const context = {
  developerNormalizeRequestEnvelope_: normalizer,
  ROLE_PERMISSIONS: { Desarrollador: ["getCentralServiceRegistry"], Docente: [], Administrador: [] },
  verifySessionToken: (token, options) => token === "valid-session" ? { role: "Desarrollador", userId: "USER-1" } :
    token === "docente-session" ? { role: "Docente", userId: "USER-2" } :
    token === "membership-session" && options && options.allowMembership ? { role: "Docente", userId: "USER-3", membershipId: "MEM-1", institutionId: "INST-1" } : null,
  textResponse: value => value,
  doGet: () => ({ status: "success" }),
  getCentralServiceRegistry: payload => ({ status: "success", actor: payload._verifiedUserId })
 };
 return vm.runInNewContext("(" + match[0] + ")", context);
}
test("doPost exige el token de sesión dentro del payload normalizado", () => {
 const post = postHandler();
 const missing = post({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", payload: { authRole: "Administrador" } }) } });
 assert.equal(missing.code, "AUTHENTICATION_REQUIRED");
 const invalid = post({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", payload: { sessionToken: "bad" } }) } });
 assert.equal(invalid.code, "INVALID_SESSION_TOKEN");
 const expired = post({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", payload: { sessionToken: "expired-session" } }) } });
 assert.equal(expired.code, "INVALID_SESSION_TOKEN");
});
test("doPost deriva identidad y rol de claims firmados, no de authRole del cliente", () => {
 const post = postHandler();
 const forged = post({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", payload: { sessionToken: "docente-session", authRole: "Desarrollador" } }) } });
 assert.equal(forged.code, "PERMISSION_DENIED");
 const valid = post({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", payload: { sessionToken: "valid-session" } }) } });
 assert.equal(valid.status, "success");
 assert.equal(valid.actor, "USER-1");
});

test("el resolver de solo lectura está disponible a cualquier rol con sesión válida", () => {
 const match = backend.match(/function doPost\(e\) \{[\s\S]*?\n\}/);
 const normalizerMatch = backend.match(/function developerNormalizeRequestEnvelope_\(rawEnvelope\) \{[\s\S]*?\n\}/);
 const normalize = vm.runInNewContext("(" + normalizerMatch[0] + ")");
 const post = vm.runInNewContext("(" + match[0] + ")", {
  developerNormalizeRequestEnvelope_: normalize,
  ROLE_PERMISSIONS: { Docente: [] },
  verifySessionToken: (token, options) => token === "membership-session" && options && options.allowMembership ? { role: "Docente", userId: "DOC-1", membershipId: "MEM-1", institutionId: "INST-1" } : null,
  textResponse: value => value,
  resolveServiceEndpoint: payload => ({ status: "success", serviceId: payload.serviceId }),
  doGet: () => ({ status: "success" })
 });
 const response = post({ postData: { contents: JSON.stringify({ action: "resolveServiceEndpoint", payload: { serviceId: "SVC-1", action: "readRecord", sessionToken: "membership-session" } }) } });
 assert.equal(response.status, "success");
 assert.equal(response.serviceId, "SVC-1");
});

test("el resolver valida la versión de contrato y el estado del emisor", () => {
 const target = serviceRow("activo"); target[8] = "2.1";
 const source = serviceRow("activo"); source[0] = "SRC-1";
 const relation = ["REL-1", "SRC-1", "SVC-1", "readRecord", "ACTIVE"];
 const rows = [target, source];
 const resolve = resolverFor(rows, [relation]);
 assert.equal(resolve({ serviceId: "SVC-1", action: "readRecord", contractVersion: "1.0" }).code, "SERVICE_CONTRACT_VERSION_MISMATCH");
 assert.equal(resolve({ serviceId: "SVC-1", action: "readRecord", contractVersion: "2.1" }).status, "success");
 source[7] = "suspendido";
 assert.equal(resolverFor([target, source], [relation])({ serviceId: "SVC-1", sourceServiceId: "SRC-1", action: "readRecord" }).code, "SERVICE_SOURCE_NOT_ACTIVE");
});

test("el cliente adjunta la versión de contrato resuelta y el emisor opcional", () => {
 assert.match(api, /contractVersion: options\.contractVersion \|\| resolution\.version/);
 assert.match(api, /sourceServiceId: options\.sourceServiceId \|\| ""/);
});

test("las sesiones de membresía se reutilizan solo para resolver rutas, no para acciones de control", () => {
 const match = backend.match(/function doPost\(e\) \{[\s\S]*?\n\}/);
 const normalizerMatch = backend.match(/function developerNormalizeRequestEnvelope_\(rawEnvelope\) \{[\s\S]*?\n\}/);
 const normalize = vm.runInNewContext("(" + normalizerMatch[0] + ")");
 const calls = [];
 const context = {
  developerNormalizeRequestEnvelope_: normalize,
  ROLE_PERMISSIONS: { Docente: [], Desarrollador: ["getCentralServiceRegistry"] },
  verifySessionToken: (token, options) => {
   calls.push(options && options.allowMembership);
   return token === "membership-session" && options && options.allowMembership ? { role: "Docente", userId: "DOC-1", membershipId: "MEM-1", institutionId: "INST-1" } : null;
  },
  textResponse: value => value,
  resolveServiceEndpoint: payload => ({ status: "success", serviceId: payload.serviceId }),
  getCentralServiceRegistry: () => ({ status: "success" }),
  doGet: () => ({ status: "success" })
 };
 const post = vm.runInNewContext("(" + match[0] + ")", context);
 const route = post({ postData: { contents: JSON.stringify({ action: "resolveServiceEndpoint", payload: { serviceId: "SVC-1", action: "readRecord", sessionToken: "membership-session" } }) } });
 assert.equal(route.status, "success");
 const admin = post({ postData: { contents: JSON.stringify({ action: "getCentralServiceRegistry", payload: { sessionToken: "membership-session" } }) } });
 assert.equal(admin.code, "INVALID_SESSION_TOKEN");
 assert.deepEqual(calls, [true, false]);
});
