"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("backend/user-service/Code.gs", "utf8");
new vm.Script(source, { filename: "backend/user-service/Code.gs" });
function extract(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = source.indexOf("{", start);
  let depth = 0, quote = "", escaped = false, line = false, block = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === "\`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unbalanced " + name);
}
class Sheet {
  constructor(rows) { this.rows = rows.map(row => row.slice()); }
  getLastColumn() { return this.rows.length ? this.rows[0].length : 0; }
  getLastRow() { return this.rows.length; }
  getDataRange() {
    const width = this.getLastColumn();
    return { getValues: () => this.rows.map(row => Array.from({ length: width }, (_, i) => row[i] === undefined ? "" : row[i])) };
  }
  getRange(row, col, rowCount = 1, colCount = 1) {
    const self = this;
    return {
      getValues() {
        return Array.from({ length: rowCount }, (_, ri) =>
          Array.from({ length: colCount }, (_, ci) => (self.rows[row - 1 + ri] || [])[col - 1 + ci] === undefined ? "" : self.rows[row - 1 + ri][col - 1 + ci]));
      },
      setValue(value) {
        while (self.rows.length < row) self.rows.push([]);
        while (self.rows[row - 1].length < col) self.rows[row - 1].push("");
        self.rows[row - 1][col - 1] = value;
      },
      setValues(values) {
        values.forEach((valuesRow, ri) => {
          while (self.rows.length < row + ri) self.rows.push([]);
          valuesRow.forEach((value, ci) => {
            while (self.rows[row - 1 + ri].length < col + ci) self.rows[row - 1 + ri].push("");
            self.rows[row - 1 + ri][col - 1 + ci] = value;
          });
        });
      }
    };
  }
  appendRow(row) { this.rows.push(row.slice()); }
}
const legacyHeaders = ["PersonaID", "Nombres", "Apellidos", "Identificacion", "EmailContacto", "TelefonoContacto", "EstadoPersona", "FechaCreacion", "FechaActualizacion", "Observaciones"];
const legacyRows = [legacyHeaders, ["PER-OLD", "Ana", "López", "0801-1999-00011", "", "", "Activa", new Date("2025-01-01"), new Date("2025-01-01"), ""]];
const sheet = new Sheet(legacyRows);
let eventCount = 0;
const context = {
  SPREADSHEET_ID: "USER-SHEET",
  SpreadsheetApp: { openById(id) { assert.equal(id, "USER-SHEET"); return {}; } },
  getOrCreateSheet(_ss, name) { assert.equal(name, "Personas"); return sheet; },
  advanceSaceUserSourceRevisionLocked_() { return "TEST-REVISION:1"; },
  LockService: { getScriptLock() { return {
    waitLock(timeout) { assert.equal(timeout, 10000); context.lockWaits++; context.lockHeld = true; },
    releaseLock() { assert.equal(context.lockHeld, true); context.lockHeld = false; context.lockReleases++; }
  }; } },
  lockWaits: 0, lockReleases: 0, lockHeld: false,
  logStructuredEvent() { eventCount++; },
  Date, String, Number, Array, Object, Error
};
vm.createContext(context);
vm.runInContext(extract("createPerson") + "\nthis.createPerson=createPerson;", context);
const created = context.createPerson({
  nombres: "Mario", apellidos: "Díaz", identificacion: "0801-1998-00099",
  tipoIdentificacion: "DNI", emailContacto: "MARIO@EXAMPLE.TEST"
});
assert.equal(created.status, "success");
assert.equal(sheet.rows[0][10], "TipoIdentificacion", "legacy Personas schema is extended by appending a new column");
assert.equal(sheet.getDataRange().getValues()[1][10], "", "existing identities are not assigned a guessed document type");
assert.equal(sheet.rows[2][10], "DNI", "new document type is persisted as an explicit institutional value");
assert.equal(sheet.rows[2][1], "Mario");
assert.equal(sheet.rows[2][4], "mario@example.test");
assert.equal(eventCount, 1);
assert.deepEqual({ waits: context.lockWaits, releases: context.lockReleases, held: context.lockHeld },
  { waits: 1, releases: 1, held: false }, "Personas writes must use the same USER-Service lock as identity-directory reads");
assert.throws(() => context.createPerson({ nombres: "Luz", apellidos: "Paz", tipoIdentificacion: "X".repeat(41) }), /PERSON_DOCUMENT_TYPE_INVALID/);
const withoutType = context.createPerson({ nombres: "Luz", apellidos: "Paz" });
assert.equal(withoutType.status, "success");
assert.equal(sheet.rows[3][10], "", "document type may remain explicitly unclassified rather than being inferred");
assert.deepEqual({ waits: context.lockWaits, releases: context.lockReleases, held: context.lockHeld },
  { waits: 2, releases: 2, held: false }, "each successful person write acquires and releases the shared lock");

const userHeaders = ["UserId", "Nombre", "Grado", "Seccion", "Email", "PasswordHash", "Rol", "Telefono", "NumeroLista", "PersonaID", "EstadoCuenta", "FechaCreacion", "UltimoAcceso"];
const userSheet = new Sheet([userHeaders]);
let userLockHeld = false, userLockWaits = 0, userLockReleases = 0, cacheInvalidations = 0;
const registrationContext = {
  SPREADSHEET_ID: "USER-SHEET",
  advanceSaceUserSourceRevisionLocked_() { return "TEST-REVISION:1"; },
  SpreadsheetApp: { openById(id) { assert.equal(id, "USER-SHEET"); return {}; } },
  getSheetOrThrow(_ss, name) { assert.equal(name, "Usuarios"); return userSheet; },
  LockService: { getScriptLock() { return {
    waitLock(timeout) { assert.equal(timeout, 10000); assert.equal(userLockHeld, false); userLockHeld = true; userLockWaits++; },
    releaseLock() { assert.equal(userLockHeld, true); userLockHeld = false; userLockReleases++; }
  }; } },
  generateInstitutionalId() {
    assert.equal(userLockHeld, false, "ID generation must not nest the USER sheet lock");
    return { generatedId: "USR-000001" };
  },
  Utilities: { DigestAlgorithm: { SHA_256: "SHA_256" }, computeDigest() { return [1, 2, 3]; } },
  invalidateUserRoleCache() { cacheInvalidations++; },
  Date, String, Number, Array, Object, Error, Math
};
const originalAppendUser = userSheet.appendRow.bind(userSheet);
userSheet.appendRow = row => {
  assert.equal(userLockHeld, true, "student account rows must be appended under the identity read lock");
  originalAppendUser(row);
};
vm.createContext(registrationContext);
vm.runInContext(extract("registerUser") + "\nthis.registerUser=registerUser;", registrationContext);
const registered = registrationContext.registerUser({
  nombre: "Estudiante Nuevo", grado: "11", seccion: "A",
  email: "nuevo@example.test", password: "secret", personaId: "PER-NEW"
});
assert.equal(registered.status, "success");
assert.equal(registered.userId, "USR-000001");
assert.equal(userSheet.rows[1][9], "PER-NEW");
assert.deepEqual({ waits: userLockWaits, releases: userLockReleases, held: userLockHeld },
  { waits: 2, releases: 2, held: false },
  "registration checks and commits under the same lock used by the identity directory");
const updated = registrationContext.registerUser({
  nombre: "Estudiante Actualizado", grado: "11", seccion: "B",
  email: "nuevo@example.test", password: "secret2", personaId: "PER-NEW", forceUpdate: true
});
assert.equal(updated.status, "success");
assert.equal(userSheet.rows[1][3], "B");
assert.equal(cacheInvalidations, 1);
assert.deepEqual({ waits: userLockWaits, releases: userLockReleases, held: userLockHeld },
  { waits: 3, releases: 3, held: false },
  "existing account identity updates must be serialized with directory reads");

assert(source.includes('"Observaciones", "TipoIdentificacion"'), "new Personas sheets expose the canonical type field");
assert(source.includes('"Observaciones","TipoIdentificacion"'), "migration writer schema includes the canonical type field");
process.stdout.write("user-person-document-type: PASS (additive schema, explicit value, legacy compatibility and no inference)\n");
