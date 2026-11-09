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
console.log("Task-Service backup/restore static contract checks passed.");
