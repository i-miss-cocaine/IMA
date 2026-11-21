# IMA Contextual Authorization Contract

- **Contract ID:** IMA-CABAC
- **Version:** 1.0.0
- **Status:** Integration in progress
- **Scope:** USER, ACADEMIC, ACCOUNTING, TASK and EXAM
- **Origin:** AUD-NG-222 / TASK-502
- **Compatibility:** RBAC matrix versioning and verified-session claims remain separate dependencies; this contract does not replace them.

## 1. Decision envelope

Every contextual decision is made for one verified actor, one action and one concrete resource. The internal decision envelope is:

```text
{
  policyId: "IMA-CABAC",
  policyVersion: "1.0.0",
  authorized: boolean,
  code: string,
  actorUserId: verified claim only,
  actorRole: verified claim only,
  action: server-selected action,
  resourceType: server-resolved type,
  resourceId: server-resolved identifier,
  correlationId: request correlation identifier
}
```

The envelope is internal/audit metadata. Client-provided identity, role, owner, institution, area, department, grade, section, relationship, assignment or scope values are never accepted as proof. A handler may accept a client identifier as a lookup selector, but it must resolve the record from the authoritative institutional source and compare the result with verified claims and policy scope.

## 2. Context requirements by resource class

| Resource class | Required evidence | Deny conditions |
|---|---|---|
| Student-owned resource | Verified actor; unique student identity; resource owner resolved from institutional record | Missing actor/owner, duplicate owner mapping, owner mismatch |
| Guardian/student resource | Verified guardian; unique active relationship; student identity resolved; effective date window; permission for the requested domain | Missing/ambiguous relationship, pending/revoked/expired/future relationship, invalid date or permission document, domain permission explicitly denied |
| Teacher/academic resource | Verified teacher; active assignment; assignment linked to a unique active academic offer; exact subject, grade and section match; assignment date window | Missing assignment/offer/catalog, duplicate IDs, inactive offer/assignment, mismatch, invalid dates |
| Coordinator/area resource | Verified coordinator; unique active coordination assignment; exact area match; supervision area/type/date bounds | Missing area, missing assignment, duplicate assignment, malformed supervision JSON, inactive/future/expired assignment |
| Departmental resource | Verified identity and active role membership; same institution; resource department resolved; department included in verified scope; ownership checked where applicable | Missing membership/scope/resource department, cross-institution mismatch, inactive membership, ambiguous ownership |
| Accounting/financial resource | Verified accounting identity; institution boundary; exact account/resource owner or current guardian relationship; action-specific department/resource scope | Missing account owner, unverified relationship, institution mismatch, unavailable source, ambiguous resource |

## 3. Authoritative sources and service adapters

The five microservices retain their own data adapters because they execute in separate Apps Script deployments. They must implement the same decision semantics and this versioned contract; they may not create permissive local exceptions.

- **USER:** signed session claims, role membership/version state, `Usuarios`, `ExpedientesEstudiantes`, `RelacionesFamiliares`, `RelacionesEstudianteTutor` (legacy only where no primary relation exists), and resource ownership records.
- **ACADEMIC:** signed identity, `AsignacionesDocentes` joined to `OfertaAcademica`, `CoordinacionesArea`, active subject/area catalogs, verified department memberships and resource ownership records.
- **ACCOUNTING:** `getVerifiedAccountingIdentity_`, institution-bound department membership, current family relationship records, account/expediente owner resolution and resource ownership records.
- **TASK:** signed identity, current guardian relationship, teacher-to-offer assignment, task/offer ownership, and verified department scope.
- **EXAM:** signed identity, current guardian relationship, exam/student profile, exam ownership, teacher/department scope and verified resource ownership.

A service adapter must derive each required fact from the source above before calling the common decision semantics. If a source is not configured or cannot be read, the adapter returns a denial; it does not infer authorization from the payload.

## 4. Action/resource policy binding

Each protected action must declare or resolve its resource class before authorization. At minimum, the action-to-resource binding must state:

- the resource class and stable identifier;
- whether student ownership, guardian relationship, teacher assignment, coordinator area, department scope, institution boundary or a combination is required;
- the authoritative source and identity key for each attribute;
- whether a read is filtered to the authorized set or a single-object request is denied as not found;
- the correlation ID used for decision audit.

A missing action binding is not equivalent to a public action. Public actions must be explicitly classified by the existing RBAC/public-action governance and may not expose student, teacher, department, financial or institutional records.

## 5. Fail-closed semantics

The decision is denied when any required attribute is missing, malformed, ambiguous, inactive, expired, future-dated, cross-institutional, inconsistent with the resource, or unavailable. Empty query results may be returned only after the adapter has proved the caller's authorized scope; they must not substitute for failed verification.

Date windows are inclusive at their boundaries. Invalid non-empty dates are rejected. Duplicate primary identities, assignment IDs, offer IDs, relation IDs or ownership mappings are ambiguous and therefore denied. Legacy data is not allowed to reactivate a revoked or pending primary relationship.

## 6. Audit requirements

Record the policy ID/version, action, resource class, decision code, service, actor ID from verified claims, and request correlation ID. Do not record session tokens, raw credentials, unnecessary student/family details, or full payloads. Denial messages returned to clients should not disclose whether a protected resource belongs to another person.

## 7. Required verification matrix

| Scenario | Expected result |
|---|---|
| Student accesses own resource | Allow only after owner resolution |
| Student accesses another student's resource | Deny |
| Guardian accesses linked student within relationship dates and domain permission | Allow |
| Guardian accesses unlinked, revoked, future, expired or domain-disallowed student | Deny |
| Teacher accesses an active assigned subject/grade/section | Allow |
| Teacher accesses unassigned, inactive, expired or ambiguous offer/assignment | Deny |
| Coordinator accesses assigned active area | Allow |
| Coordinator accesses another area or supplies no required area | Deny |
| Department member accesses resource in current institution and assigned department | Allow |
| Department member accesses other institution/department or ambiguous owner | Deny |
| Any required source is missing, errors or returns malformed data | Deny |
| A regression endpoint omits required action/resource context | Deny |

These scenarios must execute against each applicable service adapter, with positive and negative results recorded alongside the exact source/test SHAs.

## 8. Implementation status

Version 1.0.0 is the canonical contract baseline for TASK-502. Current integration includes verified identity and guardian/department checks across the services, plus ACADEMIC coordinator-area enforcement for planning/rubric resources and active teacher-assignment enforcement for planning resources. Full action/resource binding parity across all five services, service-specific integration tests for every row above, deployment/runtime verification and final review remain open. This document does not claim TASK-502 completion.
