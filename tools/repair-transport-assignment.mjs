const fs = require("node:fs");
const cp = require("node:child_process");
const targetPath = "backend/accounting-service/Code.gs";
const baseCommit = "2ec4276770de32df94fd2bcf8d3bd48e8315fe7b";
const original = cp.execFileSync("git", ["show", baseCommit + ":" + targetPath], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (original.length < 2000000 || original.split("\n").length < 25000) {
  throw new Error("Base source is incomplete; refusing to patch");
}
function replaceFunction(source, name, replacement) {
  const marker = "function " + name + "(";
  const start = source.indexOf(marker);
  if (start < 0 || source.indexOf(marker, start + marker.length) >= 0) throw new Error("Expected one function: " + name);
  const tail = source.slice(start);
  const close = /^}\s*$/m.exec(tail);
  if (!close) throw new Error("Function end not found: " + name);
  const end = start + close.index + close[0].length;
  return source.slice(0, start) + replacement + source.slice(end);
}
const helper = `function assertTransportStudentWriteAccess_(payload, ss, actor, studentUserId) {
  const targetUserId = String(studentUserId || "").trim();
  if (!targetUserId) return { authorized: false, code: "STUDENT_TARGET_REQUIRED" };
  const scope = getVerifiedAccountingDepartmentScope_(payload || {}, ss, actor);
  if (!scope || scope.valid !== true || scope.authorized !== true) {
    return { authorized: false, code: scope && scope.code || "DEPARTMENT_SCOPE_UNVERIFIED" };
  }
  const sheet = ss && ss.getSheetByName ? ss.getSheetByName("ExpedientesEstudiantes") : null;
  if (!sheet) return { authorized: false, code: "STUDENT_RESOURCE_NOT_FOUND" };
  const values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { authorized: false, code: "STUDENT_RESOURCE_NOT_FOUND" };
  const headers = values[0].map(value => String(value || "").trim());
  const expedienteIndexes = [], userIndexes = [];
  headers.forEach((header, index) => {
    if (header === "ExpedienteID") expedienteIndexes.push(index);
    if (header === "UserId") userIndexes.push(index);
  });
  if (expedienteIndexes.length !== 1 || userIndexes.length !== 1) {
    return { authorized: false, code: "STUDENT_RESOURCE_SCHEMA_INVALID" };
  }
  const expedienteIndex = expedienteIndexes[0], userIndex = userIndexes[0];
  const matches = values.slice(1).filter(row => String(row[userIndex] || "").trim() === targetUserId);
  if (matches.length !== 1) {
    return { authorized: false, code: matches.length ? "STUDENT_RESOURCE_AMBIGUOUS" : "STUDENT_RESOURCE_NOT_FOUND" };
  }
  const expedienteId = String(matches[0][expedienteIndex] || "").trim();
  if (!expedienteId) return { authorized: false, code: "STUDENT_RESOURCE_SCHEMA_INVALID" };
  const ownership = assertResourceOwnershipForScope_(ss, scope, "EXPEDIENTE_ESTUDIANTE", expedienteId, "WRITE");
  if (!ownership || ownership.authorized !== true) {
    return { authorized: false, code: ownership && ownership.code || "RESOURCE_SCOPE_DENIED" };
  }
  return { authorized: true, actor: actor, scope: scope, expedienteId: expedienteId, ownership: ownership };
}`;
const assign = `function assignStudentTransport(payload) {
  const request = payload || {};
  const rutaId = String(request.rutaId || "").trim();
  const estudianteUserId = String(request.estudianteUserId || "").trim();
  const { paradaNombre, horarioPlan, jornada, diasSemanaJSON, observaciones, modalidadServicio, fechaInicioServicio } = request;
  if (!rutaId || !estudianteUserId) throw new Error("rutaId y estudianteUserId son requeridos.");

  const actor = getVerifiedAccountingIdentity_(request);
  if (!actor || actor.authorized !== true) throw new Error(actor && actor.code || "VERIFIED_IDENTITY_REQUIRED");
  const permission = validateRolePermission(actor, "assignStudentTransport");
  if (!permission || permission.authorized !== true) throw new Error(permission && permission.code || "ROLE_PERMISSION_DENIED");

  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(15000);
  if (!hasLock) return { status: "error", code: "LOCK_TIMEOUT",
    message: "Operación de asignación de transporte bloqueada por concurrencia. Por favor reintente." };

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const studentAccess = assertTransportStudentWriteAccess_(request, ss, actor, estudianteUserId);
    if (!studentAccess || studentAccess.authorized !== true) throw new Error(studentAccess && studentAccess.code || "RESOURCE_SCOPE_DENIED");

    getOrCreateTransportVehiclesCatalog(ss);
    const billingSchema = transportEnsureBillingSchema_(ss);
    const rutaSheet = getOrCreateSheet(ss, "TransporteRutas");
    const asgnSheet = getOrCreateSheet(ss, "TransporteAsignaciones");
    const vehSheet = getOrCreateSheet(ss, "TransporteVehiculos");

    const rutasData = rutaSheet.getDataRange().getValues().slice(1);
    const routeMatches = rutasData.filter(row => String(row[0] || "").trim() === rutaId);
    if (routeMatches.length !== 1) return { status: "error",
      code: routeMatches.length ? "ROUTE_AMBIGUOUS" : "ROUTE_NOT_FOUND",
      message: "La ruta solicitada no es única o no existe." };
    const targetRuta = routeMatches[0];
    const routeState = String(targetRuta[6] || "").trim().toLowerCase();
    if (["active", "activo", "activa", "vigente"].indexOf(routeState) === -1) {
      return { status: "error", code: "ROUTE_NOT_ACTIVE" };
    }

    const unidadCod = String(targetRuta[2] || "").trim();
    const vehRows = vehSheet.getDataRange().getValues().slice(1);
    const targetVeh = vehRows.find(row => String(row[1] || "").trim() === unidadCod);
    const capAutorizada = targetVeh ? parseInt(targetVeh[5] || 0, 10) : parseInt(targetRuta[4] || 25, 10);
    const asgnData = asgnSheet.getDataRange().getValues().slice(1);

    const targetJornada = String(jornada || targetRuta[10] || "Matutina").toLowerCase().trim();
    const isDuplicate = asgnData.some(row =>
      String(row[2] || "").trim() === estudianteUserId &&
      String(row[1] || "").trim() === rutaId &&
      String(row[5] || "").toLowerCase().trim() === "active" &&
      String(row[7] || targetJornada).toLowerCase().trim() === targetJornada
    );
    if (isDuplicate) return { status: "error", code: "DUPLICATE_TRANSPORT_ASSIGNMENT",
      message: "El estudiante ya cuenta con una asignación activa en esta ruta y jornada." };

    const horaIniTarget = String(targetRuta[8] || "06:30").trim();
    const hasTimeConflict = asgnData.some(row => {
      if (String(row[2] || "").trim() !== estudianteUserId || String(row[5] || "").toLowerCase().trim() !== "active") return false;
      const otherRoute = rutasData.find(route => String(route[0] || "").trim() === String(row[1] || "").trim());
      if (!otherRoute) return false;
      const otherHoraIni = String(otherRoute[8] || "06:30").trim();
      const otherJornada = String(otherRoute[10] || "Matutina").toLowerCase().trim();
      return otherHoraIni === horaIniTarget && otherJornada === targetJornada;
    });
    if (hasTimeConflict) return { status: "error", code: "TRANSPORT_SCHEDULE_CONFLICT",
      message: "El estudiante ya tiene una ruta activa en el mismo horario." };

    const cuposOcupados = asgnData.filter(row =>
      String(row[1] || "").trim() === rutaId && String(row[5] || "").toLowerCase().trim() === "active"
    ).length;
    if (cuposOcupados >= capAutorizada) return { status: "error", code: "TRANSPORT_CAPACITY_EXCEEDED",
      capacidadMaxima: capAutorizada, cuposOcupados: cuposOcupados,
      message: "Capacidad vehicular agotada en la ruta solicitada." };

    const now = new Date(), serviceStart = transportParseDate_(fechaInicioServicio) || now;
    const serviceMode = transportNormalizeMode_(modalidadServicio || "COMPLETA");
    if (fechaInicioServicio && !transportParseDate_(fechaInicioServicio)) throw new Error("TRANSPORT_SERVICE_START_INVALID");
    const assignmentId = "TRN-" + now.getTime() + "-" + Utilities.getUuid().slice(0, 8);
    const chargeSnapshot = billingSchema.charges.getDataRange().getValues().map(row => row.slice());
    const assignmentStartRow = asgnSheet.getLastRow() + 1;

    asgnSheet.appendRow([assignmentId, rutaId, estudianteUserId, paradaNombre || "Parada Principal",
      horarioPlan || targetRuta[8] || "06:30 AM", "active", now.toISOString(), targetJornada,
      diasSemanaJSON ? (Array.isArray(diasSemanaJSON) ? JSON.stringify(diasSemanaJSON) : diasSemanaJSON) : "[\\"Lun\\",\\"Mar\\",\\"Mie\\",\\"Jue\\",\\"Vie\\"]",
      observaciones || "", serviceStart, "", serviceMode, "", "", ""]);
    let billing = { status: "success", created: false, missingTariff: 0 };
    try {
      billing = transportRecalculateStudentMonthlyChargeLocked_(ss, estudianteUserId, now.getFullYear(), now.getMonth() + 1);
    } catch (billingError) {
      asgnSheet.deleteRow(assignmentStartRow);
      const chargeSheet = billingSchema.charges;
      if (chargeSnapshot.length) chargeSheet.getRange(1, 1, chargeSnapshot.length, chargeSnapshot[0].length).setValues(chargeSnapshot);
      while (chargeSheet.getLastRow() > chargeSnapshot.length) chargeSheet.deleteRow(chargeSheet.getLastRow());
      throw billingError;
    }

    logStructuredEvent("TRANSPORT", "assignStudentTransport", "INFO", "TRANSPORT_ASSIGNMENT_CREATED",
      "Asignación de transporte creada para estudiante " + estudianteUserId + " en ruta " + rutaId,
      { asignacionTranspId: assignmentId, rutaId: rutaId, estudianteUserId: estudianteUserId,
        capAutorizada: capAutorizada, cuposOcupadosDespues: cuposOcupados + 1 }, actor.userId || "System");

    return { status: "success", asignacionTranspId: assignmentId, rutaId: rutaId,
      cuposRestantes: capAutorizada - (cuposOcupados + 1), facturacion: billing,
      billingStatus: billing.missingTariff ? "PENDIENTE_TARIFA" : "PROCESADA",
      message: billing.missingTariff ? "Estudiante asignado; configure la tarifa para generar el cargo."
        : "Estudiante asignado y cargo mensual sincronizado." };
  } finally { lock.releaseLock(); }
}`;
const cancel = `function cancelStudentTransportAssignment(payload) {
  const request = payload || {};
  const id = String(request.asignacionTranspId || request.assignmentId || "").trim();
  if (!id) throw new Error("TRANSPORT_ASSIGNMENT_ID_REQUIRED");
  const actor = getVerifiedAccountingIdentity_(request);
  if (!actor || actor.authorized !== true) throw new Error(actor && actor.code || "VERIFIED_IDENTITY_REQUIRED");
  const permission = validateRolePermission(actor, "cancelStudentTransportAssignment");
  if (!permission || permission.authorized !== true) throw new Error(permission && permission.code || "ROLE_PERMISSION_DENIED");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const assignmentSheet = ss.getSheetByName("TransporteAsignaciones");
    if (!assignmentSheet) throw new Error("TRANSPORT_ASSIGNMENT_NOT_FOUND");
    const data = assignmentSheet.getDataRange().getValues();
    const matches = data.map((row, index) => ({ row: row, index: index }))
      .filter(item => item.index > 0 && String(item.row[0] || "").trim() === id);
    if (!matches.length) throw new Error("TRANSPORT_ASSIGNMENT_NOT_FOUND");
    if (matches.length !== 1) throw new Error("TRANSPORT_ASSIGNMENT_AMBIGUOUS");
    const idx = matches[0].index;
    const original = matches[0].row.slice();
    const studentAccess = assertTransportStudentWriteAccess_(request, ss, actor, String(original[2] || ""));
    if (!studentAccess || studentAccess.authorized !== true) {
      throw new Error(studentAccess && studentAccess.code || "RESOURCE_SCOPE_DENIED");
    }

    const billingSchema = transportEnsureBillingSchema_(ss);
    const state = String(original[5] || "").toLowerCase();
    if (["cancelled", "cancelada"].indexOf(state) !== -1) return { status: "success", idempotent: true, asignacionTranspId: id };
    if (state !== "active" && state !== "activa") throw new Error("TRANSPORT_ASSIGNMENT_NOT_ACTIVE");
    const date = transportParseDate_(request.fechaCancelacion) || new Date();
    const start = transportParseDate_(original[10] || original[6]);
    if (request.fechaCancelacion && !transportParseDate_(request.fechaCancelacion)) throw new Error("TRANSPORT_CANCELLATION_DATE_INVALID");
    if (start && date < start) throw new Error("TRANSPORT_CANCELLATION_BEFORE_START");

    const chargeSnapshot = billingSchema.charges.getDataRange().getValues().map(row => row.slice());
    try {
      const updated = original.slice();
      updated[5] = "cancelled"; updated[11] = date; updated[13] = date;
      assignmentSheet.getRange(idx + 1, 1, 1, updated.length).setValues([updated]);
      const billing = transportRecalculateStudentMonthlyChargeLocked_(ss, String(original[2]), date.getFullYear(), date.getMonth() + 1);
      return { status: billing.missingTariff ? "warning" : "success", asignacionTranspId: id,
        fechaCancelacion: date.toISOString(), facturacion: billing };
    } catch (error) {
      assignmentSheet.getRange(idx + 1, 1, 1, original.length).setValues([original]);
      if (chargeSnapshot.length) billingSchema.charges.getRange(1, 1, chargeSnapshot.length, chargeSnapshot[0].length).setValues(chargeSnapshot);
      while (billingSchema.charges.getLastRow() > chargeSnapshot.length) billingSchema.charges.deleteRow(billingSchema.charges.getLastRow());
      throw error;
    }
  } finally { lock.releaseLock(); }
}`;
let updated = replaceFunction(original, "cancelStudentTransportAssignment", cancel);
updated = replaceFunction(updated, "assignStudentTransport", assign);
if (updated.includes("function assertTransportStudentWriteAccess_(")) throw new Error("Transport helper already exists in base");
updated = updated.replace("function assignStudentTransport(", helper + "\n\nfunction assignStudentTransport(");
if (updated.length < original.length - 20000 || updated.length > original.length + 20000 ||
    updated.split("\n").length < original.split("\n").length - 100) {
  throw new Error("Patched source size/line-count changed unexpectedly");
}
fs.writeFileSync(targetPath, updated, "utf8");
console.log(JSON.stringify({originalBytes: original.length, updatedBytes: updated.length, originalLines: original.split("\n").length, updatedLines: updated.split("\n").length}));
