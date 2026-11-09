// Contract-level static checks for the Task-Service academic-year backup protocol.
// These checks do not replace Apps Script / Sheets / Drive isolated integration tests.
const assert = require("assert");
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
assert(source.includes("RESTORE_FAILED_ROLLED_BACK") && source.includes("ROLLBACK_INCOMPLETE"), "restore reports rollback outcome");
assert(source.includes("taskServiceVerifyAppendOnlyBackupLog_"), "Log_Cierres is preserved as append-only");
console.log("Task-Service backup/restore static contract checks passed.");
