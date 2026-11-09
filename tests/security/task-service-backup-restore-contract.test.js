// Contract-level static checks for the Task-Service academic-year backup protocol.
// These checks do not replace Apps Script / Sheets / Drive isolated integration tests.
const assert = require("assert");
const vm = require("node:vm");
const crypto = require("node:crypto");
const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.resolve(__dirname, "../../backend/task-service/Code.gs"), "utf8");
const closeStart = source.indexOf("function closeAcademicYear");
const closeEnd = source.indexOf("const TASK_SERVICE_BACKUP_SCHEMA_VERSION", closeStart);
assert(closeStart >= 0 && closeEnd > closeStart, "closeAcademicYear and backup protocol exist");
const closeBody = source.slice(closeStart, closeEnd);
assert(closeBody.includes("BACKUP_REQUIRED"), "destructive close remains fail-closed");
assert(!/deleteRow|deleteRows|setTrashed|clearContents/.test(closeBody), "close handler performs no destructive mutation");
[
  "createTaskServiceAcademicYearBackup",
  "verifyTaskServiceAcademicYearBackup",
  "restoreTaskServiceAcademicYearBackup",
  "recoverTaskServiceAcademicYearRestore"
].forEach(name => {
  assert(source.includes("case \"" + name + "\""), "dispatcher exposes " + name);
  assert(source.includes("function " + name + "("), "handler exists for " + name);
});
assert(source.includes("Utilities.DigestAlgorithm.SHA_256"), "SHA-256 is used");
assert(source.includes("checksum !== computed"), "manifest checksum comparison is strict");
assert(source.includes('"Tareas", "Entregas", "ConfiguracionAcademica"'), "required sheets are in backup scope");
assert(source.includes("taskServiceBackupCaptureSharing_"), "Drive sharing metadata is captured");
assert(source.includes("taskServiceVerifyBackupAsset_"), "backup assets are verified");
assert(source.includes("lock.waitLock(30000)") && source.includes("lock.releaseLock()"), "restore uses script lock");
assert(source.includes("PropertiesService.getScriptProperties()"), "restore journal is durable in script properties");
assert(source.includes("RECOVERY_REQUIRED") && source.includes("rollbackManifestFileId"), "interrupted restore requires durable recovery");
assert(source.includes("RECOVERY_CONFIRMATION_REQUIRED"), "manual recovery requires explicit confirmation");
assert(source.includes("TASK_SERVICE_RESTORE_STATE_PREFIX"), "recovery progress is stored outside the size-limited script property");
assert(source.includes("taskServiceReadRestoreState_") && source.includes("taskServicePersistRestoreState_"), "durable restore state can be resumed");
assert(source.includes("taskServiceRestoreMarkerName_") && source.includes("taskServiceFindRestoreMarker_"), "asset creation is idempotent after abrupt interruption");
assert(source.includes("taskServiceRestoreAcademicYearBackup_(durableJournal.rollbackManifestFileId, actor, true, true, durableJournal)"), "recovery reuses the existing exclusive script lock and progress journal");
assert(source.includes("if (!lockAlreadyHeld) lock.waitLock(30000)") && source.includes("if (!lockAlreadyHeld) lock.releaseLock()"), "recovery serializes access without reacquiring its held script lock");
assert(source.includes("lock.waitLock(30000)") && source.includes("function recoverTaskServiceAcademicYearRestore(payload)"), "recovery obtains the script lock before reading its journal");
assert(source.includes("lastRecoveryError") && source.includes('durableJournal.state = "RECOVERY_REQUIRED"'), "failed recovery preserves a retryable journal");
assert(source.includes('["APPLYING", "RECOVERY_REQUIRED", "RECOVERING"].indexOf(durableJournal.state) === -1'), "unknown journal states are rejected");
assert(source.includes("rollbackErrors.slice(0, 10)"), "journal error details are bounded");
assert(source.includes("RESTORE_STATE_PARENT_MISMATCH"), "reused Drive IDs must remain under their expected parent");
assert(source.includes('parentFolder.getFoldersByName(markerName)') && source.includes('parentFolder.getFilesByName(markerName)'), "interrupted Drive copies are located by deterministic markers");
assert(source.includes("DriveApp.getFileById(fileId).setContent(JSON.stringify(state))"), "restore progress is persisted to a Drive state file");
assert(source.includes("RESTORE_STATE_NAME_MISMATCH"), "reused Drive IDs must match the restore marker or target name");
assert(source.includes("mappedHash !== node.sha256"), "reused restored files are hash-verified before metadata mutation");
assert(source.includes("RESTORE_FAILED_ROLLED_BACK") && source.includes("ROLLBACK_INCOMPLETE"), "restore reports rollback outcome");
assert(source.includes("taskServiceVerifyAppendOnlyBackupLog_"), "Log_Cierres is preserved as append-only");

function extractFunction(name) {
  const start = source.indexOf("function " + name + "(");
  assert.ok(start >= 0, "function exists: " + name);
  const open = source.indexOf("{", start);
  assert.ok(open > start, "function opening brace exists: " + name);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error("function body is not balanced: " + name);
}

// Parse the complete Apps Script source with the local Node parser.
new vm.Script(source, { filename: "backend/task-service/Code.gs" });

// Exercise deterministic helpers with isolated local mocks; no Google service is called.
const digestContext = {
  Utilities: {
    DigestAlgorithm: { SHA_256: "SHA-256" },
    Charset: { UTF_8: "UTF-8" },
    computeDigest: function (_algorithm, value) {
      const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
      return Array.from(crypto.createHash("sha256").update(bytes).digest()).map(b => b > 127 ? b - 256 : b);
    }
  }
};
vm.runInNewContext(extractFunction("taskServiceBackupSha256_") + String.fromCharCode(10) + "this.hash = taskServiceBackupSha256_;", digestContext);
assert.equal(digestContext.hash("abc", false), crypto.createHash("sha256").update("abc").digest("hex"));
assert.equal(digestContext.hash(Buffer.from([0, 1, 2, 255]), true), crypto.createHash("sha256").update(Buffer.from([0, 1, 2, 255])).digest("hex"));

const snapshotContext = {};
vm.runInNewContext(
  extractFunction("taskServiceBackupEncodeValue_") + String.fromCharCode(10) +
  extractFunction("taskServiceBackupSnapshotSheet_") + String.fromCharCode(10) + "this.snapshot = taskServiceBackupSnapshotSheet_;",
  snapshotContext
);
const snapDate = vm.runInNewContext('new Date("2026-01-02T03:04:05.000Z")', snapshotContext);
const mockSheet = {
  getName: () => "Tareas",
  getLastRow: () => 2,
  getLastColumn: () => 2,
  getRange: () => ({
    getValues: () => [[snapDate, 7], ["TSK-1", "Activa"]],
    getFormulas: () => [["", ""], ["", ""]]
  })
};
const snapshot = JSON.parse(JSON.stringify(snapshotContext.snapshot(mockSheet)));
assert.equal(snapshot.name, "Tareas");
assert.equal(snapshot.rows, 2);
assert.equal(snapshot.columns, 2);
assert.deepEqual(snapshot.values[0][0], { __taskServiceBackupType: "Date", value: "2026-01-02T03:04:05.000Z" });
assert.equal(snapshot.values[1][0], "TSK-1");
assert.equal(snapshot.formulas.length, 2);

const emptySnapshot = JSON.parse(JSON.stringify(snapshotContext.snapshot({
  getName: () => "Entregas",
  getLastRow: () => 0,
  getLastColumn: () => 0
})));
assert.deepEqual(emptySnapshot, { name: "Entregas", rows: 0, columns: 0, values: [], formulas: [] });

console.log("Task-Service backup/restore contract: static guards, Node syntax, SHA-256 and local snapshot fixtures passed.");

