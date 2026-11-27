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
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
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


test("getEmployeeDocuments entrega solo metadatos expresamente aprobados para una referencia interdepartamental", () => {
  const employeeValues = [
    ["ExpedienteID", "UserId"],
    ["EXP-1", "U-OWNER"]
  ];
  const documentValues = [
    ["DocumentoID", "ExpedienteID", "CategoriaDoc", "TituloDocumento", "ArchivoUrl", "FechaCarga", "CargadoPor", "EstadoVisibilidad", "Observaciones"],
    ["DOC-1", "EXP-1", "Contrato", "Contrato privado", "https://drive.google.com/file/d/FILE-PRIVATE", "2026-01-01", "U-OWNER", "Privado", "Nota privada"]
  ];
  const ownershipValues = [
    ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"]
  ];
  const sheets = {
    ExpedientesLaborales: { getDataRange: () => ({ getValues: () => employeeValues }) },
    DocumentosLaborales: { getDataRange: () => ({ getValues: () => documentValues }) },
    ResourceOwnership: { getDataRange: () => ({ getValues: () => ownershipValues }) }
  };
  let scopeCalls = 0, referenceCalls = 0;
  const context = {
    SPREADSHEET_ID: "SS-1",
    getVerifiedAccountingIdentity_: () => ({ authorized: true, userId: "U-READER", role: "Director", institutionId: "INST-1" }),
    getVerifiedAccountingDepartmentScope_: () => {
      scopeCalls++;
      return { valid: true, institutionId: "INST-1", departmentIds: ["DEP-READER"], institutionWide: false };
    },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] || null }) },
    assertEmployeeExpedienteScopeAccess_: () => ({ authorized: false, code: "RESOURCE_SCOPE_DENIED" }),
    authorizeAccountingDepartmentReferenceReadViaUser_: (payload, resourceId, fields, documentIds) => {
      referenceCalls++;
      assert.equal(resourceId, "EXP-1");
      assert.deepEqual(fields, ["categoriaDoc"]);
      assert.deepEqual(documentIds, ["DOC-1"]);
      return { status: "success", authorized: true, approvedFields: ["categoriaDoc"],
        approvedDocumentIds: ["DOC-1"], grantId: "DRG-1", auditEventId: "LOG-1" };
    }
  };
  run(accountingSource, ["getEmployeeDocuments"], context);
  const result = context.getEmployeeDocuments({
    sessionToken: "SESSION", expedienteId: "EXP-1", activeDepartmentId: "DEP-READER",
    referenceRequestedFields: ["categoriaDoc"], referenceDocumentIds: ["DOC-1"]
  });
  assert.equal(result.status, "success");
  assert.equal(result.referenceOnly, true);
  assert.equal(result.grantId, "DRG-1");
  assert.equal(result.documentos.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result.documentos[0])), {
    documentoId: "DOC-1", categoriaDoc: "Contrato"
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.documentos[0], "tituloDocumento"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.documentos[0], "archivoUrl"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.documentos[0], "observaciones"), false);
  assert.equal(scopeCalls, 1);
  assert.equal(referenceCalls, 1);
});
