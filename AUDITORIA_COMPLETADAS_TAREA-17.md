# Auditoría TAREA-17: analítica académica por área, asignatura y programa

**Fecha:** 2026-11-05  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 4868aa20f934f20579ebcea8d2623d00509a9322  
**Dictamen:** CUMPLE PARCIALMENTE; analítica contextual y exportación institucional no acreditadas.

## Alcance
Distribución de notas, tendencias por parcial, alertas de acompañamiento, comparativas homogéneas por grado/sección/programa/idioma, exclusión de pendientes, exportación para Dirección/Coordinación, correspondencia con fuente y permisos.

## Archivos inspeccionados

| Archivo | SHA |
|---|---|
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 |
| teacher-dashboard.html | cbb9e6a272a7d8ad33f99727303305d950533e71 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f |
| tests/regression/academic-grading-suite.js | 3433b707edd4a2f35c68368a3172932adc2a3b32 |

## Hallazgos

### 1. Analítica sin dimensiones ni filtros reales
getCurricularAnalyticsReport (academic-service, 2927-2978) recibe area/asignatura/grado/programa/periodo, pero lee todas las filas de CalificacionesEstudiantes y no aplica filtros ni agrupaciones. Los parámetros se devuelven como etiquetas; no hay sección, idioma ni año lectivo. Calcula un promedio y una distribución global. Sí excluye borradores, no publicadas y notas no numéricas del promedio, lo que cumple parcialmente el criterio de pendientes.

El esquema real de CalificacionesEstudiantes (exam-service, línea 36) es ID, EvaluacionID, UserID, NotaObtenida, PuntajePonderado, EsBorrador, EsPublicada, Observaciones y FechaRegistro. No contiene por sí solo área, asignatura, grado, sección, programa ni idioma; el endpoint no enlaza EvaluacionID/UserID con Evaluaciones, Matrículas u OfertaAcademica. Por tanto no puede atribuir correctamente cada nota a las dimensiones solicitadas.

alertasAcompanamiento es simplemente el conteo de notas inferiores a 70, no el número de alertas activas ni estudiantes únicos.

### 2. Alertas tempranas con métricas simuladas
evaluateAndDispatchEarlyWarningAlerts (academic-service, 9264-9535) calcula asistencia desde RegistrosAsistencia sin filtrar por año lectivo o período. failingSubjectsCount y missingTasksCount se obtienen de mockFailingSubjects/mockMissingTasks enviados en payload (9424-9429), no de notas y entregas persistidas. anolectivo se recibe pero no interviene en el cálculo. La clave de deduplicación no incluye año lectivo, por lo que una alerta activa de un ciclo puede suprimir otra del siguiente. NotificadoA se almacena como texto; no se encontró envío efectivo a canales de notificación. Sí se registran filas en AlertasTempranas y se intenta crear CasosSeguimiento para riesgos Alto/Crítico.

F11-Task08 está marcada completada, pero el flujo no acredita los indicadores reales de reprobación e incumplimiento de tareas que exige su alcance.

### 3. Interfaz y RBAC desconectados
teacher.js (2275-2306) define el controlador TAREA-17 y llama getCurricularAnalyticsReport con payload vacío. teacher-dashboard.html no contiene modal-academic-analytics, btn-close-academic-analytics ni IDs analytics; no hay interfaz visible que el controlador pueda abrir.

ROLE_PERMISSIONS incluye getCurricularAnalyticsReport para Director (línea 170) y Administrador wildcard, pero no para Coordinador (222) ni Profesor (242), aunque el controlador está en teacher.js. La acción no está disponible para los perfiles requeridos de Coordinación ni para el contexto docente que intenta llamarla.

### 4. Reporte y exportación no equivalentes a analítica
El reporte tradicional de teacher.js (2940-3045) convierte entregas ausentes en cero (2979), suma puntos de tareas/exámenes heterogéneos y determina aprobación con total >=70 (2991). El filtro de tareas (3022) usa PARCIAL_ACTUAL, no el valor seleccionado en report-parcial; los exámenes (3023) no filtran por parcial. La exportación export-excel-btn (4585-4627) vuelve a exportar tareas/exámenes, no el resultado de getCurricularAnalyticsReport, y también asigna cero a entregas ausentes.

El catálogo REP-ACAD-01 en user-service (8396+) declara filtros año/grado/sección/período y roles que incluyen Coordinador. Sin embargo, generateInstitutionalReport (8624; rama académica 8687) interpreta la hoja con índices incompatibles: usa r[0] como ID estudiante, r[1] como nombre, r[2] como grado, r[3] como sección y r[6] como nota (8701), aunque el esquema real define r[6] como EsPublicada. Tampoco aplica los filtros declarados y agrega EST-001/EST-002 ficticios cuando no hay filas (8720). REP-ACAD-02 no tiene generador propio y cae en la misma rama genérica category=ACADEMICA.

### 5. Pruebas
tests/regression/academic-grading-suite.js no contiene referencias a getCurricularAnalyticsReport ni a runPhase24ReportsAndAnalyticsRegressionSuite. No se acreditan pruebas funcionales de filtros, agrupaciones, comparativas, alertas reales, permisos ni igualdad entre pantalla y exportación.

## Dictamen por criterio

- Distribución global de notas: **Parcial**.
- Tendencias por parcial: **No cumple**.
- Comparativas grado/sección/programa/idioma: **No cumple**.
- Exclusión de borradores/no publicadas del promedio del endpoint: **Cumple parcialmente**; el reporte/exportación docente convierte ausencias en cero.
- Alertas pedagógicas basadas en notas/tareas reales: **No cumple**.
- Exportación analítica para Dirección/Coordinadores: **No cumple**.
- Correspondencia con fuente académica: **No cumple**.
- Permisos y ámbito: **No cumple** para Coordinador/Profesor en el endpoint analítico.

## Reconciliación

No se crea AUD-NG nuevo. Ampliar TASK-050 (catálogo), TASK-051 (diccionario), TASK-052 (filtros), TASK-054 (regresión), TASK-235 (series), TASK-237 (exportación), AUD-NG-167 (fuente única de calificaciones), AUD-NG-158 (RBAC/ABAC) y F11-Task08 (alertas tempranas marcadas completadas con métricas mock). TASK-051 presenta inconsistencia: encabezado [X] y Estado interno [ ] Pendiente; no se modifica su estado en esta auditoría.

## Pruebas y límites
Inspección estática/manual. No se ejecutaron endpoints, cálculos con fixtures, pruebas de roles, exportaciones ni notificaciones. No se utilizaron datos productivos ni se modificó código fuente. La planificación AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md citada por TAREA-17 no está disponible en esta rama; se utilizó el alcance explícito de completadas.md.
