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
const academicSource = read("backend/academic-service/Code.gs");

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


test("ACADEMIC autoriza referencias de expedientes estudiantiles con POST directo y sesión existente", () => {
  const requests = [];
  const context = {
    ACADEMIC_USER_SERVICE_ENDPOINT_: "https://script.google.com/macros/s/USER/exec",
    getRequestSessionToken_: payload => payload.sessionToken,
    UrlFetchApp: { fetch(url, options) {
      requests.push({ url, options });
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
        status: "success", authorized: true, requiresStandardAuthorization: true,
        approvedFields: ["tipoDocumento"], approvedDocumentIds: ["DOC-1"], grantId: "DRG-1", auditEventId: "LOG-1"
      }) };
    } }
  };
  run(academicSource, ["authorizeAcademicDepartmentReferenceReadViaUser_"], context);
  const result = context.authorizeAcademicDepartmentReferenceReadViaUser_(
    { sessionToken: "SESSION", activeDepartmentId: "DEP-2" },
    "EXPEDIENTE_ESTUDIANTE", "EXP-1", ["tipoDocumento"], ["DOC-1"]
  );
  assert.equal(result.status, "success");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, context.ACADEMIC_USER_SERVICE_ENDPOINT_);
  const sent = JSON.parse(requests[0].options.payload);
  assert.equal(sent.action, "authorizeDepartmentReferenceRead");
  assert.equal(sent.payload.sessionToken, "SESSION");
  assert.equal(sent.payload.resourceType, "EXPEDIENTE_ESTUDIANTE");
  assert.equal(sent.payload.resourceId, "EXP-1");
  assert.equal(sent.payload.activeDepartmentId, "DEP-2");
  assert.doesNotMatch(extractFunction(academicSource, "authorizeAcademicDepartmentReferenceReadViaUser_"),
    /PropertiesService|HMAC|hmacSignature|createInterServiceEnvelope/);
});

test("getStudentDocuments devuelve solo metadatos autorizados y no lee historial ni archivos en modo referencia", () => {
  const employeeDocuments = [
    ["DocumentoID", "ExpedienteID", "SolicitudID", "TipoDocumento", "NombreArchivo", "DriveFileId", "DriveUrl",
      "FechaRecepcion", "FechaVencimiento", "EstadoRevision", "SubidoPor", "ValidadoPor", "Observaciones"],
    ["DOC-1", "EXP-1", "SOL-1", "Acta", "Acta privada.pdf", "FILE-1", "https://drive.google.com/file/d/FILE-1",
      "2026-01-01", "2026-02-01", "Validado", "U-1", "U-2", "Nota privada"]
  ];
  let versionReads = 0, referenceCalls = 0;
  const context = {
    SPREADSHEET_ID: "SS-1",
    SpreadsheetApp: { openById: () => ({
      getSheetByName(name) {
        if (name === "DocumentosEstudiante") return { getDataRange: () => ({ getValues: () => employeeDocuments }) };
        if (name === "ExpedientesEstudiantes") return {};
        if (name === "HistorialVersionesDocumentos") { versionReads++; return { getDataRange: () => ({ getValues: () => [] }) }; }
        return null;
      }
    }) },
    assertStudentRequestScopeAccess_: () => ({ authorized: false, code: "RESOURCE_SCOPE_DENIED" }),
    authorizeAcademicDepartmentReferenceReadViaUser_: (request, type, id, fields, ids) => {
      referenceCalls++;
      assert.equal(type, "EXPEDIENTE_ESTUDIANTE");
      assert.equal(id, "EXP-1");
      assert.deepEqual(fields, ["tipoDocumento"]);
      assert.deepEqual(ids, ["DOC-1"]);
      return { status: "success", approvedFields: ["tipoDocumento"], approvedDocumentIds: ["DOC-1"],
        grantId: "DRG-1", auditEventId: "LOG-1" };
    }
  };
  run(academicSource, ["getStudentDocuments"], context);
  const result = context.getStudentDocuments({
    expedienteId: "EXP-1", sessionToken: "SESSION",
    referenceRequestedFields: ["tipoDocumento"], referenceDocumentIds: ["DOC-1"]
  });
  assert.equal(result.status, "success");
  assert.equal(result.referenceOnly, true);
  assert.equal(result.documents.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result.documents[0])), { documentoId: "DOC-1", tipoDocumento: "Acta" });
  assert.equal(Object.prototype.hasOwnProperty.call(result.documents[0], "nombreArchivo"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.documents[0], "driveFileId"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.documents[0], "observaciones"), false);
  assert.equal(versionReads, 0);
  assert.equal(referenceCalls, 1);
});


test("el evaluador de referencias aplica revocación, vigencia, allowlists y solo lectura en cada solicitud", () => {
  const userSource = read("backend/user-service/Code.gs");
  const context = run(userSource, ["evaluateDepartmentReferenceAccess_"], {});
  const grant = {
    InstitutionID: "INST-1", GrantID: "GRANT-1", ResourceType: "EXPEDIENTE_ESTUDIANTE", ResourceID: "EXP-1",
    OwnerDepartmentID: "DEP-1", TargetDepartmentID: "DEP-2",
    AllowedFieldsJSON: '["tipoDocumento"]', AllowedDocumentIDsJSON: '["DOC-1"]',
    AuthorizedBy: "ADMIN-1", AuthorizedAt: "2026-11-01T00:00:00Z",
    ValidFrom: "2026-11-01T00:00:00Z", ExpiresAt: "2026-12-01T00:00:00Z",
    Status: "ACTIVE", RevokedAt: ""
  };
  const base = {
    actorContext: { status: "success", verified: true, userId: "U-1", membershipId: "MEM-1",
      roleId: "Director", institutionId: "INST-1", activeDepartmentId: "DEP-2", institutionWide: false },
    resourceOwnership: { authorized: true, institutionId: "INST-1", departmentId: "DEP-1",
      resourceType: "EXPEDIENTE_ESTUDIANTE", resourceId: "EXP-1" },
    institutionalConfig: { institutionId: "INST-1", key: "POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL",
      value: "PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL" },
    referenceGrants: [grant], operation: "READ_REFERENCE",
    requestedFields: ["tipoDocumento"], requestedDocumentIds: ["DOC-1"], now: "2026-11-26T12:00:00Z"
  };
  const allowed = context.evaluateDepartmentReferenceAccess_(base);
  assert.equal(allowed.authorized, true);
  assert.equal(allowed.requiresStandardAuthorization, true);
  assert.equal(allowed.auditEvent.decision, "ALLOW");
  const revoked = context.evaluateDepartmentReferenceAccess_({ ...base,
    referenceGrants: [{ ...grant, Status: "REVOKED", RevokedAt: "2026-11-25T00:00:00Z" }] });
  assert.equal(revoked.authorized, false);
  assert.equal(revoked.code, "DEPARTMENT_REFERENCE_GRANT_INVALID");
  assert.equal(revoked.auditEvent.decision, "DENY");
  const expired = context.evaluateDepartmentReferenceAccess_({ ...base,
    referenceGrants: [{ ...grant, ExpiresAt: "2026-11-26T00:00:00Z" }] });
  assert.equal(expired.code, "DEPARTMENT_REFERENCE_GRANT_OUT_OF_WINDOW");
  const wildcard = context.evaluateDepartmentReferenceAccess_({ ...base,
    referenceGrants: [{ ...grant, AllowedFieldsJSON: '["*"]' }] });
  assert.equal(wildcard.code, "DEPARTMENT_REFERENCE_ALLOWLIST_INVALID");
  const exceeded = context.evaluateDepartmentReferenceAccess_({ ...base, requestedDocumentIds: ["DOC-OTHER"] });
  assert.equal(exceeded.code, "DEPARTMENT_REFERENCE_SCOPE_EXCEEDED");
  const write = context.evaluateDepartmentReferenceAccess_({ ...base, operation: "WRITE" });
  assert.equal(write.code, "CROSS_DEPARTMENT_OPERATION_DENIED");
});


test("el export heredado de calificaciones falla cerrado y no queda expuesto por doPost", () => {
  const context = { SpreadsheetApp: { openById: () => { throw new Error("No debe leer calificaciones"); } } };
  run(academicSource, ["exportAcademicGradesData"], context);
  const result = context.exportAcademicGradesData({ userId: "U-ATTACKER", authRole: "Administrador", incluirBorradores: true });
  assert.equal(result.status, "error");
  assert.equal(result.code, "DEPARTMENT_SCOPED_EXPORT_REQUIRED");
  const dispatcher = extractFunction(academicSource, "doPost");
  assert.doesNotMatch(dispatcher, /case "exportAcademicGradesData"/);
});
