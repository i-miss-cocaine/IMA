const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../js/department-reference-admin.js"), "utf8");
new vm.Script(source, { filename: "js/department-reference-admin.js" });
const window = {};
const document = { readyState: "complete", getElementById() { return null; }, addEventListener() {} };
vm.runInNewContext(source, { window, document });
const api = window.DepartmentReferenceAdmin;
assert.ok(api, "administrative UI exports its testable contract");
assert.equal(api.constants.POLICY_STRICT, "BLOQUEO_TOTAL_CROSS_DEPARTAMENTO");
assert.equal(api.constants.POLICY_READ_ONLY, "PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL");
const from = "2026-11-13T10:00";
const until = "2026-11-14T10:00";
const payload = api.buildGrantPayload({
  resourceType: "expediente_laboral", resourceId: "EXP-001", targetDepartmentId: "DEP-B",
  allowedFields: "categoriaDoc, fechaCarga", allowedDocumentIds: "DOC-001, DOC-002",
  validFrom: from, expiresAt: until
});
assert.equal(payload.resourceType, "EXPEDIENTE_LABORAL");
assert.deepEqual(Array.from(payload.allowedFields), ["categoriaDoc", "fechaCarga"]);
assert.deepEqual(Array.from(payload.allowedDocumentIds), ["DOC-001", "DOC-002"]);
assert.equal(payload.validFrom, new Date(from).toISOString());
assert.equal(payload.expiresAt, new Date(until).toISOString());
assert.equal(Object.prototype.hasOwnProperty.call(payload, "institutionId"), false, "tenant is never supplied by the browser");
assert.throws(() => api.parseCsvList("DOC-1, DOC-1", "docs"), /duplicados/);
assert.throws(() => api.parseCsvList("DOC-1, *", "docs"), /comodín/);
assert.throws(() => api.buildGrantPayload({ resourceType: "bad type", resourceId: "R1", targetDepartmentId: "D2", allowedFields: "a", allowedDocumentIds: "DOC-1", validFrom: from, expiresAt: until }), /tipo de recurso/);
assert.throws(() => api.buildGrantPayload({ resourceType: "EXPEDIENTE", resourceId: "R1", targetDepartmentId: "D2", allowedFields: "a", allowedDocumentIds: "DOC-1", validFrom: until, expiresAt: from }), /vigencia/);
assert.throws(() => api.buildPolicyPayload("ALLOW_ALL"), /política/);
assert.equal(api.buildPolicyPayload(api.constants.POLICY_STRICT).value, api.constants.POLICY_STRICT);
assert.equal(api.buildPolicyPayload(api.constants.POLICY_READ_ONLY).value, api.constants.POLICY_READ_ONLY);
assert.equal(source.includes("innerHTML"), false, "untrusted grant data is rendered with textContent, never HTML interpolation");
for (const action of ["getDepartmentReferencePolicy", "getDepartmentReferenceGrants", "setDepartmentReferencePolicy", "createDepartmentReferenceGrant", "revokeDepartmentReferenceGrant"]) {
  assert.ok(source.includes('api("' + action + '"'), "UI uses USER action " + action);
}
process.stdout.write("Department reference admin UI contract: 15 assertions PASS.\\n");
