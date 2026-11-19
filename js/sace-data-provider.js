(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SACEDataProvider = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this), function () {
  "use strict";
  const ABSENCE_STATES = new Set(["AUSENTE", "AUSENCIA", "FALTA", "INASISTENCIA", "ABSENT", "JUSTIFICADA"]);
  const NON_ABSENCE_STATES = new Set(["PRESENTE", "TARDANZA", "SALIDAANTICIPADA", "SALIDA ANTICIPADA", "EXENTO"]);
  function text(value) {
    return String(value == null ? "" : value).normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  }
  function dateKey(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"),
        String(value.getDate()).padStart(2, "0")].join("-");
    }
    const raw = String(value == null ? "" : value).trim();
    const match = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(raw);
    if (!match) return "";
    const parsed = new Date(match[1] + "T00:00:00.000Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === match[1] ? match[1] : "";
  }
  function required(value, code) {
    const result = String(value == null ? "" : value).trim();
    if (!result) throw new Error(code);
    return result;
  }
  function assertPeriodSnapshot(snapshot, expected, period, label) {
    if (!snapshot || snapshot.status !== "success" || !snapshot.data) throw new Error("SACE_GRADEBOOK_SNAPSHOT_INVALID:" + label);
    const data = snapshot.data, context = data.contexto || {};
    ["anoId", "grado", "seccion", "asignatura", "institutionId"].forEach(field => {
      if (!text(context[field]) || text(context[field]) !== text(expected[field])) {
        throw new Error("SACE_GRADEBOOK_CONTEXT_MISMATCH:" + label + ":" + field);
      }
    });
    if (text(context.periodoId) !== text(period.periodoId)) throw new Error("SACE_GRADEBOOK_PERIOD_MISMATCH:" + label);
    if (text(data.estadoPeriodo) !== "CERRADO") throw new Error("SACE_GRADEBOOK_PERIOD_NOT_CLOSED:" + label);
    if (!Array.isArray(data.alumnos) || !data.alumnos.length || !data.resumenes ||
        typeof data.resumenes !== "object") throw new Error("SACE_GRADEBOOK_DATA_INCOMPLETE:" + label);
    if (!Array.isArray(data.recuperaciones)) {
      throw new Error("SACE_GRADEBOOK_RECOVERY_DATA_INCOMPLETE:" + label);
    }
    if (data.recuperaciones.length) {
      throw new Error("SACE_RECOVERY_MAPPING_UNVERIFIED:" + label);
    }
    const students = new Map();
    data.alumnos.forEach(student => {
      const userId = required(student && student.userId, "SACE_GRADEBOOK_STUDENT_ID_REQUIRED");
      if (students.has(userId)) throw new Error("SACE_GRADEBOOK_STUDENT_DUPLICATE:" + label);
      students.set(userId, student);
    });
    return { data, students };
  }
  function validatePeriod(period, label, expectedAnoId) {
    const id = required(period && period.periodoId, "SACE_PERIOD_ID_REQUIRED:" + label);
    const anoId = required(period && period.anoId, "SACE_PERIOD_YEAR_REQUIRED:" + label);
    if (text(anoId) !== text(expectedAnoId)) throw new Error("SACE_PERIOD_YEAR_MISMATCH:" + label);
    const start = dateKey(period && period.fechaInicio), end = dateKey(period && period.fechaFin);
    if (!start || !end || start > end) throw new Error("SACE_PERIOD_RANGE_INVALID:" + label);
    return { periodoId: id, anoId, start, end };
  }
  function countAbsencesForPeriods(studentIds, sessions, records, expected, period1, period2, labelMode) {
    if (!Array.isArray(sessions) || !Array.isArray(records)) {
      throw new Error("SACE_ATTENDANCE_SNAPSHOT_REQUIRED");
    }
    const selected = { partial1: [], partial2: [] };
    const sessionIds = new Set();
    sessions.forEach(session => {
      const id = String(session && session.sesionId || "").trim();
      if (!id) throw new Error("SACE_ATTENDANCE_SESSION_ID_REQUIRED");
      if (sessionIds.has(id)) throw new Error("SACE_ATTENDANCE_SESSION_DUPLICATE");
      sessionIds.add(id);
      const day = dateKey(session.fecha);
      if (!day) throw new Error("SACE_ATTENDANCE_SESSION_DATE_INVALID");
      let label = "";
      if (day >= period1.start && day <= period1.end) label = "partial1";
      else if (day >= period2.start && day <= period2.end) label = "partial2";
      if (!label) return;
      if (text(session.grado) !== text(expected.grado) ||
          text(session.seccion) !== text(expected.seccion) ||
          text(session.asignaturaId) !== text(expected.asignaturaId) ||
          String(session.docenteUserId || "").trim() !== expected.teacherUserId) return;
      if (["CERRADA", "CERRADO", "FINALIZADA", "FINALIZADO", "COMPLETADA", "COMPLETADO"].indexOf(text(session.estado)) === -1) {
        throw new Error("SACE_ATTENDANCE_SESSION_NOT_CLOSED:" + label);
      }
      const closeTimestamp = String(session.fechaCierre == null ? "" : session.fechaCierre).trim();
      if (!closeTimestamp || !Number.isFinite(Date.parse(closeTimestamp))) {
        throw new Error("SACE_ATTENDANCE_SESSION_CLOSE_TIMESTAMP_REQUIRED:" + label);
      }
      selected[label].push({ id, date: day });
    });
    if (!selected.partial1.length) throw new Error("SACE_ATTENDANCE_SESSIONS_EMPTY:partial1");
    if (!selected.partial2.length) throw new Error("SACE_ATTENDANCE_SESSIONS_EMPTY:partial2");
    const selectedLabels = new Map();
    selected.partial1.concat(selected.partial2).forEach(session => {
      selectedLabels.set(session.id, session.date >= period1.start && session.date <= period1.end ? "partial1" : "partial2");
    });
    const selectedIds = new Set(selectedLabels.keys());
    const studentSet = new Set(studentIds), byKey = new Map();
    records.forEach(record => {
      const sessionId = String(record && record.sesionId || "").trim();
      if (!selectedIds.has(sessionId)) return;
      const userId = String(record && record.userId || "").trim();
      const label = selectedLabels.get(sessionId);
      if (!studentSet.has(userId)) throw new Error("SACE_ATTENDANCE_STUDENT_OUTSIDE_ROSTER:" + label);
      const key = sessionId + "|" + userId;
      if (byKey.has(key)) throw new Error("SACE_ATTENDANCE_RECORD_DUPLICATE:" + label);
      byKey.set(key, record);
    });
    const buildCounts = label => {
      const counts = Object.create(null);
      studentIds.forEach(id => { counts[id] = 0; });
      selected[label].forEach(session => studentIds.forEach(userId => {
        const record = byKey.get(session.id + "|" + userId);
        if (!record) throw new Error("SACE_ATTENDANCE_RECORD_MISSING:" + label);
        if (typeof record.justificado !== "boolean") {
          throw new Error("SACE_ATTENDANCE_JUSTIFICATION_STATE_REQUIRED:" + label);
        }
        if (record.justificacionVerificada !== true) {
          throw new Error("SACE_ATTENDANCE_JUSTIFICATION_UNVERIFIED:" + label);
        }
        const attendanceState = text(record.estadoAsistencia);
        if (!ABSENCE_STATES.has(attendanceState) && !NON_ABSENCE_STATES.has(attendanceState)) {
          throw new Error("SACE_ATTENDANCE_STATE_UNSUPPORTED:" + label);
        }
        if (attendanceState === "JUSTIFICADA" && record.justificado !== true) {
          throw new Error("SACE_ATTENDANCE_JUSTIFICATION_UNVERIFIED:" + label);
        }
        if (ABSENCE_STATES.has(attendanceState)) {
          if (!(record.justificado && labelMode === "EXCLUDE")) counts[userId]++;
        }
      }));
      return { counts, sessions: selected[label].length };
    };
    return { partial1: buildCounts("partial1"), partial2: buildCounts("partial2") };
  }
  function buildCandidateStudents(input) {
    const value = input || {}, raw = value.expectedContext || {};
    const context = {
      anoId: required(raw.anoId, "SACE_CONTEXT_REQUIRED:anoId"),
      grado: required(raw.grado, "SACE_CONTEXT_REQUIRED:grado"),
      seccion: required(raw.seccion, "SACE_CONTEXT_REQUIRED:seccion"),
      asignatura: required(raw.asignatura, "SACE_CONTEXT_REQUIRED:asignatura"),
      asignaturaId: required(raw.asignaturaId, "SACE_CONTEXT_REQUIRED:asignaturaId"),
      institutionId: required(raw.institutionId, "SACE_CONTEXT_REQUIRED:institutionId"),
      teacherUserId: required(raw.teacherUserId, "SACE_TEACHER_CONTEXT_REQUIRED")
    };
    const absencePolicy = value.absencePolicy || {};
    const justifiedAbsenceMode = required(absencePolicy.justifiedAbsenceMode,
      "SACE_ABSENCE_POLICY_REQUIRED").toUpperCase();
    if (["COUNT", "EXCLUDE"].indexOf(justifiedAbsenceMode) === -1) {
      throw new Error("SACE_ABSENCE_POLICY_INVALID");
    }
    const period1 = validatePeriod(value.partial1Period, "partial1", context.anoId);
    const period2 = validatePeriod(value.partial2Period, "partial2", context.anoId);
    if (period1.periodoId === period2.periodoId) throw new Error("SACE_PERIODS_MUST_BE_DISTINCT");
    if (period1.end >= period2.start) throw new Error("SACE_PERIOD_RANGE_OVERLAP_OR_ORDER_INVALID");
    const first = assertPeriodSnapshot(value.partial1Gradebook, context, period1, "partial1");
    const second = assertPeriodSnapshot(value.partial2Gradebook, context, period2, "partial2");
    if (first.students.size !== second.students.size) throw new Error("SACE_GRADEBOOK_ROSTER_MISMATCH");
    first.students.forEach((student, id) => {
      const other = second.students.get(id);
      if (!other || text(student.nombreCompleto) !== text(other.nombreCompleto)) throw new Error("SACE_GRADEBOOK_ROSTER_MISMATCH");
    });
    if (!Array.isArray(value.identityRecords)) throw new Error("SACE_IDENTITY_DIRECTORY_REQUIRED");
    const identities = new Map();
    value.identityRecords.forEach(record => {
      const id = required(record && record.userId, "SACE_IDENTITY_USER_REQUIRED");
      if (identities.has(id)) throw new Error("SACE_IDENTITY_RECORD_DUPLICATE");
      identities.set(id, {
        identity: required(record.identity, "SACE_STUDENT_IDENTITY_REQUIRED"),
        documentType: String(record.documentType || "").trim(),
        documentMarker: required(record.documentMarker, "SACE_STUDENT_DOCUMENT_TYPE_REQUIRED"),
        name: record.name
      });
    });
    const studentIds = Array.from(first.students.keys());
    if (identities.size !== studentIds.length ||
        Array.from(identities.keys()).some(id => !first.students.has(id))) {
      throw new Error("SACE_IDENTITY_RECORD_ROSTER_MISMATCH");
    }
    const normalizedIdentities = new Set();
    studentIds.forEach(id => {
      const identity = identities.get(id);
      if (!identity) throw new Error("SACE_IDENTITY_RECORD_MISSING");
      const normalizedIdentity = String(identity.identity || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (!normalizedIdentity || normalizedIdentities.has(normalizedIdentity)) {
        throw new Error("SACE_IDENTITY_DOCUMENT_DUPLICATE");
      }
      normalizedIdentities.add(normalizedIdentity);
      const name = String(first.students.get(id).nombreCompleto || "").trim();
      if (!name) throw new Error("SACE_STUDENT_NAME_REQUIRED");
      if (identity.name && text(identity.name) !== text(name)) throw new Error("SACE_STUDENT_NAME_MISMATCH");
    });
    const absenceCounts = countAbsencesForPeriods(studentIds, value.attendanceSessions,
      value.attendanceRecords, context, period1, period2, justifiedAbsenceMode);
    const absences1 = absenceCounts.partial1, absences2 = absenceCounts.partial2;
    const sourceStudents = studentIds.map(id => {
      const student = first.students.get(id), one = first.data.resumenes[id], two = second.data.resumenes[id];
      [one, two].forEach((summary, index) => {
        if (!summary || summary.status !== "calculated" || summary.notaFinal === null ||
            summary.notaFinal === undefined || summary.notaFinal === "" ||
            !Number.isFinite(Number(summary.notaFinal)) || Number(summary.notaFinal) < 0 || Number(summary.notaFinal) > 100) {
          throw new Error("SACE_GRADE_NOT_FINAL:" + (index === 0 ? "partial1" : "partial2"));
        }
      });
      const identity = identities.get(id);
      return {
        userId: id, identity: identity.identity, documentType: identity.documentType, documentMarker: identity.documentMarker,
        name: student.nombreCompleto, partial1Absences: absences1.counts[id],
        partial1: Number(one.notaFinal), partial2Absences: absences2.counts[id],
        partial2: Number(two.notaFinal), recovery: null
      };
    });
    return {
      status: "candidate", sourceStudents,
      attendance: {
        partial1: { sessions: absences1.sessions, absencesByStudent: absences1.counts },
        partial2: { sessions: absences2.sessions, absencesByStudent: absences2.counts },
        absencePolicy: {
          justifiedAbsenceMode: justifiedAbsenceMode,
          verification: "explicit-input-not-confirmed-against-official-SACE-rule"
        }
      },
      limitations: [
        "period-to-SACE-partial mapping is supplied explicitly and is not inferred",
        "recovery values are not exported until the official SACE rule is verified",
        "identity document type must come from the verified institutional Personas record",
        "documentType-to-documentMarker mapping is supplied explicitly and must be confirmed against an official SACE template",
        "attendance snapshots must be obtained server-side for the authenticated teacher context",
        "justified-absence treatment is explicit input and remains unverified against the official SACE rule; output is candidate only"
      ]
    };
  }

  function buildCandidateStudentsFromSnapshot(input) {
    const value = input || {}, snapshot = value.attendanceSnapshot;
    if (!snapshot || snapshot.status !== "success" || !snapshot.data) {
      throw new Error("SACE_ATTENDANCE_SNAPSHOT_INVALID");
    }
    const data = snapshot.data;
    if (!Array.isArray(data.periods) || data.periods.length !== 2) {
      throw new Error("SACE_ATTENDANCE_PERIODS_INVALID");
    }
    const firstId = required(value.partial1PeriodId, "SACE_PARTIAL1_PERIOD_MAPPING_REQUIRED");
    const secondId = required(value.partial2PeriodId, "SACE_PARTIAL2_PERIOD_MAPPING_REQUIRED");
    if (firstId === secondId) throw new Error("SACE_PERIODS_MUST_BE_DISTINCT");
    const periods = new Map();
    data.periods.forEach(period => {
      const id = required(period && period.periodoId, "SACE_ATTENDANCE_PERIOD_ID_REQUIRED");
      if (periods.has(id)) throw new Error("SACE_ATTENDANCE_PERIOD_DUPLICATE");
      periods.set(id, period);
    });
    const partial1Period = periods.get(firstId), partial2Period = periods.get(secondId);
    if (!partial1Period || !partial2Period) throw new Error("SACE_PARTIAL_PERIOD_NOT_IN_SNAPSHOT");
    if (!Array.isArray(data.identityRecords) || !data.identityRecords.length) throw new Error("SACE_IDENTITY_DIRECTORY_REQUIRED");
    if (!Array.isArray(value.documentTypeMappings) || !value.documentTypeMappings.length) {
      throw new Error("SACE_DOCUMENT_TYPE_MAPPING_REQUIRED");
    }
    const markerByType = new Map();
    value.documentTypeMappings.forEach(mapping => {
      const documentType = text(required(mapping && mapping.documentType, "SACE_DOCUMENT_TYPE_MAPPING_TYPE_REQUIRED"));
      const marker = required(mapping && mapping.documentMarker, "SACE_DOCUMENT_TYPE_MAPPING_MARKER_REQUIRED");
      if (markerByType.has(documentType)) throw new Error("SACE_DOCUMENT_TYPE_MAPPING_DUPLICATE");
      markerByType.set(documentType, marker);
    });
    const mappedIdentityRecords = data.identityRecords.map(record => {
      const documentType = required(record && record.documentType, "SACE_STUDENT_DOCUMENT_TYPE_REQUIRED");
      const marker = markerByType.get(text(documentType));
      if (!marker) throw new Error("SACE_DOCUMENT_TYPE_MAPPING_MISSING");
      if (record.documentMarker && text(record.documentMarker) !== text(marker)) {
        throw new Error("SACE_DOCUMENT_TYPE_MAPPING_CONFLICT");
      }
      return Object.assign({}, record, { documentMarker: marker });
    });
    const candidate = buildCandidateStudents({
      expectedContext: data.expectedContext,
      partial1Period,
      partial2Period,
      partial1Gradebook: value.partial1Gradebook,
      partial2Gradebook: value.partial2Gradebook,
      identityRecords: mappedIdentityRecords,
      attendanceSessions: data.attendanceSessions,
      attendanceRecords: data.attendanceRecords,
      absencePolicy: value.absencePolicy
    });
    const limitations = Array.isArray(snapshot.limitations) ? snapshot.limitations.slice() : [];
    return Object.assign({}, candidate, {
      limitations: candidate.limitations.concat(limitations, ["documentType-to-SACE-marker mapping is explicit input and has not been independently verified by this local provider"])
    });
  }

  return { buildCandidateStudents, buildCandidateStudentsFromSnapshot, dateKey };
});
