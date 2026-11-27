"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Falta " + name);
  const next = /\nfunction [A-Za-z0-9_$]+\s*\(/g;
  next.lastIndex = start + 10;
  const match = next.exec(source);
  return source.slice(start, match ? match.index : source.length);
}
function run(source, names, context) {
  vm.runInNewContext(names.map(name => extractFunction(source, name)).join("\n"), context);
  return context;
}
const vm = require("node:vm");
const userSource = read("backend/user-service/Code.gs");
const accountingSource = read("backend/accounting-service/Code.gs");

test("USER autoriza la lectura de referencias solo con el permiso dinámico y la identidad verificada", () => {
  const context = {
    PUBLIC_ACTIONS: [],
    getUserVerifiedRole(payload) { payload._verifiedUserId = "U-1"; return payload.role; },
    getDynamicPermissionsForRole: (role, action) => role === "Importador" && action === "readDepartmentReference"
  };
  run(userSource, ["validateRolePermission"], context);
  assert.equal(context.validateRolePermission("authorizeDepartmentReferenceRead", { role: "Importador" }).authorized, true);
  assert.equal(context.validateRolePermission("authorizeDepartmentReferenceRead", { role: "Auditor" }).authorized, false);
  assert.equal(context.validateRolePermission("authorizeDepartmentReferenceRead", { role: "Importador" }).userId, "U-1");
});

test("ACCOUNTING consulta USER mediante POST directo con sesión, sin HMAC ni Script Properties", () => {
  const calls = [];
  const context = {
    requestAccountingService_: (service, action, payload) => {
      calls.push({ service, action, payload });
      return { status: "success", authorized: true, requiresStandardAuthorization: true,
        approvedFields: ["categoriaDoc"], approvedDocumentIds: ["DOC-1"], grantId: "DRG-1", auditEventId: "LOG-1" };
    }
  };
  run(accountingSource, ["authorizeAccountingDepartmentReferenceReadViaUser_"], context);
  const result = context.authorizeAccountingDepartmentReferenceReadViaUser_(
    { sessionToken: "SESSION", activeDepartmentId: "DEP-1" }, "EXP-1", ["categoriaDoc"], ["DOC-1"]
  );
  assert.equal(result.status, "success");
  assert.deepEqual(calls[0], {
    service: "USER", action: "authorizeDepartmentReferenceRead",
    payload: { resourceType: "EXPEDIENTE_LABORAL", resourceId: "EXP-1", sessionToken: "SESSION",
      requestedFields: ["categoriaDoc"], requestedDocumentIds: ["DOC-1"], activeDepartmentId: "DEP-1" }
  });
  const helper = extractFunction(accountingSource, "authorizeAccountingDepartmentReferenceReadViaUser_");
  assert.doesNotMatch(helper, /PropertiesService|IMA_USER_SERVICE_URL|IMA_DEPARTMENT_REFERENCE_HMAC_SECRET|computeHmacSignature|hmacSignature|createInterServiceEnvelope/);
});

test("ACCOUNTING falla cerrado ante respuestas incompletas o campos/documentos no autorizados", () => {
  const context = { requestAccountingService_: () => ({
    status: "success", authorized: true, requiresStandardAuthorization: true,
    approvedFields: ["categoriaDoc"], approvedDocumentIds: [], grantId: "DRG-1", auditEventId: "LOG-1"
  }) };
  run(accountingSource, ["authorizeAccountingDepartmentReferenceReadViaUser_"], context);
  const result = context.authorizeAccountingDepartmentReferenceReadViaUser_(
    { sessionToken: "SESSION" }, "EXP-1", ["categoriaDoc"], ["DOC-1"]
  );
  assert.equal(result.status, "error");
  assert.equal(result.code, "RESOURCE_NOT_FOUND");
});

test("USER ya no acepta sobres HMAC para autorizar referencias departamentales", () => {
  assert.doesNotMatch(userSource, /IMA_DEPARTMENT_REFERENCE_HMAC_SECRET|verifyDepartmentReferenceEnvelope_|handleTrustedDepartmentReferenceEnvelope_/);
  const doPost = extractFunction(userSource, "doPost");
  assert.doesNotMatch(doPost, /handleTrustedDepartmentReferenceEnvelope_/);
  assert.match(doPost, /case "authorizeDepartmentReferenceRead": result = authorizeDepartmentReferenceRead\(payload\); break;/);
  const permission = extractFunction(userSource, "validateRolePermission");
  assert.match(permission, /action === "authorizeDepartmentReferenceRead"/);
  assert.match(permission, /readDepartmentReference/);
});
