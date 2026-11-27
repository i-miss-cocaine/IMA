"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
const accountingSource = read("backend/accounting-service/Code.gs");

test("ACCOUNTING reutiliza la identidad verificada dentro de una misma petición", () => {
  let verificationCalls = 0;
  const payload = { sessionToken: "SESSION" };
  const context = {
    requestAccountingUserAuthorization_: () => {
      verificationCalls++;
      return { status: "success", authorized: true, userId: "U-1", role: "Director",
        membershipId: "MEM-1", institutionId: "INST-1" };
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "INST-1" }) }
  };
  run(accountingSource, ["getVerifiedAccountingIdentity_"], context);
  const first = context.getVerifiedAccountingIdentity_(payload);
  const second = context.getVerifiedAccountingIdentity_(payload);
  assert.equal(first.authorized, true);
  assert.equal(second.userId, "U-1");
  assert.equal(verificationCalls, 1);
});

test("la comprobación de expedientes reutiliza actor, ámbito y snapshots sin volver a consultar hojas", () => {
  const resourceRows = [
    ["ExpedienteID", "UserId"],
    ["EXP-1", "U-1"]
  ];
  const ownershipRows = [
    ["OwnershipID", "InstitutionID", "ResourceType", "ResourceID", "DepartmentID", "Status", "RegisteredBy", "CreatedAt", "UpdatedAt"],
    ["OWN-1", "INST-1", "EXPEDIENTE_LABORAL", "EXP-1", "DEP-1", "ACTIVE", "HR-1", "", ""]
  ];
  let identityCalls = 0, scopeCalls = 0, sheetReads = 0;
  const context = {
    getVerifiedAccountingIdentity_: () => { identityCalls++; throw new Error("No debe revalidar la identidad"); },
    getVerifiedAccountingDepartmentScope_: () => { scopeCalls++; throw new Error("No debe reconstruir el ámbito"); }
  };
  run(accountingSource, ["assertResourceOwnershipForScope_", "assertEmployeeExpedienteScopeAccess_"], context);
  const result = context.assertEmployeeExpedienteScopeAccess_(
    { sessionToken: "SESSION" },
    { getSheetByName: () => { sheetReads++; throw new Error("No debe releer hojas"); } },
    "EXP-1",
    { authorized: true, userId: "U-2", role: "Director" },
    { valid: true, authorized: true, institutionId: "INST-1", departmentIds: ["DEP-1"], institutionWide: false },
    { values: resourceRows, expedienteIndex: 0, userIndex: 1 },
    { resourceRows, ownershipRows }
  );
  assert.equal(result.authorized, true);
  assert.equal(result.departmentId, "DEP-1");
  assert.equal(identityCalls, 0);
  assert.equal(scopeCalls, 0);
  assert.equal(sheetReads, 0);
});
