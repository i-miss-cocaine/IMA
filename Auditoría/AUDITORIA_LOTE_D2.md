# Informe de auditoría - Lote D2

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base:** `NG_beta_0.0.0.1`  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`  
**Commit de referencia:** `44d9891132332e692dbe2ba8602b41f50a508a59`

## Alcance

Se auditaron REQ-EXP-004, REQ-EXP-005 y REQ-EXP-006, incluyendo microservicios TASK, EXAM y ACADEMIC, dashboard docente/estudiantil y el informe de Fase 10. La revisión fue estática. No se ejecutaron pruebas ni se modificó código fuente.

## REQ-EXP-004 - Consolidación académica, evaluaciones y tareas
**Estado: Cumple parcialmente.** El dashboard docente combina tareas y exámenes mediante `fetchTeacherActivity`; el backend mantiene servicios TASK/EXAM y la asistencia se implementa en ACADEMIC. `submitAssignment` registra versiones de entregas en `EntregasVersiones`, y el estudiante ve actividades por asignatura. Sin embargo:
1. La entrega tardía solo cambia el estado a `EntregadaTarde`; no aplica el 50% indicado en la tarea. `gradeSubmission` acepta la calificación enviada por el cliente.
2. Los endpoints de asistencia permiten a Profesor consultar/escribir registros sin validar asignación docente; `getDailyAttendance` ignora grado/sección y `getClassAttendance` devuelve todo si no se proporciona sesionId.
3. Padre/Tutor/Responsable pueden invocar consultas amplias de asistencia; `getStudentAttendanceSummary` acepta cualquier userId y no valida relación familiar.
4. Las notas de tareas y exámenes se actualizan en la fila actual sin historial de rectificación ni comprobación de propiedad del docente. Las correcciones de asistencia también sobrescriben el estado anterior.
Hallazgos AUD-NG-121 a AUD-NG-125.

## REQ-EXP-005 - Cierre de año escolar y purga de Drive
**Estado: Cumple parcialmente con riesgo crítico.** La UI solicita confirmación y el backend utiliza `DriveApp.File.setTrashed(true)` (la acción esperada por el requisito histórico), elimina Tareas y Entregas y restablece filas de ConfiguracionAcademica. Pero `closeAcademicYear` está permitido al rol Profesor sin vincular `profesorId` con `_verifiedUserId`; además elimina todas las filas de Entregas aunque el cierre sea granular. Esto puede afectar a otros docentes. El `backupId` es solo una cadena generada, el parámetro `format` se registra sin crear respaldo, la acción `generateAcademicArchiveZip` no tiene función en el único archivo del microservicio TASK y no se limpian Examenes/PreguntasExamen/EntregasExamen aunque la interfaz lo anuncia. Si falla el movimiento de un archivo a papelera, la fila de Entregas se elimina igualmente. Hallazgos AUD-NG-119 y AUD-NG-120.

## REQ-EXP-006 - Dashboard estudiantil, WhatsApp y recursos por unidad
**Estado: Cumple parcialmente.** `renderStudentHeader` muestra email, teléfono y enlace WhatsApp. `renderSubjectNavigation` construye tarjetas desde `GLOBAL_SCOPE.GranularConfig`, aplica autorización por parcial y ordena pendientes ascendentemente por fecha límite para la tarjeta. `js/index-ui.js` filtra materias y temas por `GLOBAL_SCOPE.UnidadActual`; las funciones actuales son `renderDownloadSubjects` y `renderDownloadTopics`, sustituyendo la referencia histórica a `downloadContentData`. La vista expandida de una asignatura vuelve a ordenar las actividades en sentido descendente, por lo que las fechas más lejanas pueden aparecer antes que las próximas. Hallazgo AUD-NG-126.

## Pruebas y límites

Se inspeccionaron los servicios y funciones referidos, además de `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` y `phase-10-attendance-coexistence-spec.md`. El informe Fase 10 declara 86/86 criterios, pero esa declaración no sustituye la verificación de código: los endpoints revisados no aplican los controles de ámbito descritos. No se ejecutaron suites, no se accedió a datos productivos y no se probó la operación destructiva.

Tareas derivadas:
- AUD-NG-119: aislar el cierre de año al docente autenticado y sus entregas.
- AUD-NG-120: implementar respaldo real y cierre completo de tareas y exámenes.
- AUD-NG-121: aplicar en servidor la penalización del 50% por entrega tardía.
- AUD-NG-122: aplicar ámbito docente en todas las operaciones de asistencia.
- AUD-NG-123: restringir la consulta de asistencia de padres y tutores a sus representados.
- AUD-NG-124: validar propiedad y conservar historial de rectificaciones de calificaciones.
- AUD-NG-125: preservar historial inmutable de correcciones de asistencia.
- AUD-NG-126: unificar el orden de actividades por fecha límite en la vista expandida.

## Continuidad

- Tres tareas históricas inspeccionadas; ninguna marca histórica fue alterada.
- AUD-NG-101 permanece En Ejecución.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- Siguiente lote: E.
