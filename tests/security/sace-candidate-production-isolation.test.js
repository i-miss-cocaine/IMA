"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const entrypoints = [
  "index.html",
  "student-dashboard.html",
  "teacher-dashboard.html",
  "js/index-ui.js",
  "js/teacher.js",
  "js/student.js",
  "js/api.js"
];
const forbiddenClientIntegration = [
  /sace-export-orchestrator/i,
  /sace-template\.js/i,
  /prepareCandidateExport(?:FromAcademic)?Snapshot/i,
  /uploadSace/i,
  /downloadSace/i
];
entrypoints.forEach(file => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  forbiddenClientIntegration.forEach(pattern => {
    assert.doesNotMatch(source, pattern, file + " must not activate the SACE candidate exporter");
  });
});
const academic = fs.readFileSync(path.join(root, "backend/academic-service/Code.gs"), "utf8");
const exam = fs.readFileSync(path.join(root, "backend/exam-service/Code.gs"), "utf8");
const saceActions = [...academic.matchAll(/case\s+["']([^"']*Sace[^"']*)["']\s*:/gi)].map(match => match[1]);
assert.deepEqual(saceActions, ["getSaceAttendanceSnapshot"],
  "Academic-Service may expose only the read-only SACE attendance snapshot action");
assert.doesNotMatch(academic, /case\s+["'][^"']*Sace[^"']*["']\s*:\s*(?:result\s*=\s*)?(?:upload|download|export)/i,
  "Academic-Service must not expose a SACE upload, download or export action");
const examSaceActions = [...exam.matchAll(/case\s+["']([^"']*Sace[^"']*)["']\s*:/gi)].map(match => match[1]);
assert.deepEqual(examSaceActions.sort(), ["getSaceGradebookSnapshot", "getSaceGradebookSnapshots"].sort(),
  "Exam-Service may expose only the singular and atomic batch read-only SACE gradebook snapshot actions");
assert.doesNotMatch(exam, /case\s+["'][^"']*Sace[^"']*["']\s*:\s*(?:result\s*=\s*)?(?:upload|download|export)/i,
  "Exam-Service must not expose a SACE upload, download or export action");
const orchestrator = fs.readFileSync(path.join(root, "js/sace-export-orchestrator.js"), "utf8");
assert.match(orchestrator, /status:\s*"candidate"/);
assert.doesNotMatch(orchestrator, /XMLHttpRequest|UrlFetchApp|DriveApp|SpreadsheetApp|fetch\s*\(|download|upload/i,
  "the candidate orchestrator must remain an in-memory transformation without external I/O");
console.log("sace-candidate-production-isolation: PASS (candidate-only; no UI activation or SACE upload/download action)");
