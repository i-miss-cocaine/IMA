# AUDITORÍA TÉCNICA - TAREA-F7-IMP-07: programación de evaluaciones y prevención de sobrecargas

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2258Z-01 (identificador operativo, no ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.238  
**Checkpoint de cierre:** C1.239  
**HEAD auditado:** eacd5cdc8b8c8c078516f2acb98d17b9f9e1c980  
**Árbol auditado reconstruido:** 277dda1ea733c953d3c5c2c89318a0671773e704, derivado del árbol C1.237 c1f2fcea3990fbfff8bfb9e9a80080676f8d4d34 y del diff íntegro C1.238 (cinco rutas).  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- Rama base protegida: `NG_beta_0.0.0.1`, HEAD verificado `44d9891132332e692dbe2ba8602b41f50a508a59`. Rama de trabajo: `NG_beta_0.0.0.1_work`, HEAD verificado `eacd5cdc8b8c8c078516f2acb98d17b9f9e1c980`; al inicio estaba 306 commits adelante y 0 atrás de la base.
- El checkpoint más reciente es C1.238 y marca como siguiente tarea `TAREA-F7-IMP-07`. No se encontró el informe individual `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md`; se audita la especificación de `completadas.md`.
- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, 5.963 líneas; `TAREA-F7-IMP-07` aparece en la línea 4093 con marca [X] y criterios CA-F7-45..CA-F7-50. La marca histórica se conserva, pero no acredita cumplimiento.
- El archivo de origen `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` no existe en la rama. No se inventa ni se sustituye por otra fuente.
- `Pendientes.md` respondió vacío por lectura ordinaria. Se recuperó el blob Git directo SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`, que contiene 1.803.672 bytes, 1.782.094 caracteres y 20.182 líneas, sin caracteres U+FFFD. El blob de la rama coincide con el SHA indicado; no fue necesario restaurarlo ni transferirlo. El contenido no registra `TAREA-F7-IMP-07`, CA-F7-45..50 ni los IDs nuevos TASK-552..TASK-559. Se consultó por instrucción expresa de esta tarea; el registro de tareas derivadas de auditoría sigue residiendo exclusivamente en los informes individuales, conforme a la metodología.
- El alcance incluye reglas institucionales, límites diarios y por intervalo, períodos de separación, identificación de grupos/estudiantes afectados, conflictos de docentes/aulas/recursos, calendario no lectivo, tipos de evaluación, simulación y confirmación de reprogramaciones, conservación de calificaciones, propagación a calendarios/vistas, autenticación, permisos y regresión.
- El informe individual previo no existía. La entrada de `ChangesLogs.txt` del 2026-10-26 describe una implementación de modal y botón que no están presentes en el HTML actual.

## 2. Archivos y respaldos inspeccionados

Se registraron los SHA de respaldo antes de la inspección. No se modificó ninguno de estos archivos y sus SHA se volvieron a consultar al finalizar:

- `backend/exam-service/Code.gs` SHA `1d93296628fae31f680004f637897e2b1314a64c`:
  - `getOrCreateSheet` (línea 26; esquema de Examenes, EntregasExamen y tablas de calificación).
  - `PUBLIC_ACTIONS` / `ROLE_PERMISSIONS` (75-101).
  - `verifySessionToken` / `validateRolePermission` (127-251).
  - Dispatcher `doPost` (345-408).
  - `createExam` (506), `updateExam` (555), `deleteExam` (578), `getAllExams` (609).
  - `checkExamSchedulingConflict` (875), `simulateExamReschedule` (910).
  - `submitExam` (996), `getStudentExams` (1057), `getExamResult` (1106), `gradeExamSubmission` (1236), `saveGradebookGrades` (1533), `saveStudentRecovery` (1722).
- `backend/academic-service/Code.gs` SHA `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`:
  - `getOrCreateSheet` (84-155), esquema `CalendarioAcademico` y `ReglasAcademicas`.
  - `ROLE_PERMISSIONS` (168-265) y dispatcher `doPost`.
  - `getAcademicCalendar` (6616), `createCalendarEvent` (6651), `getScheduleCalendarConflicts` (6876), `checkScheduleConflict` (7493), `getAcademicRules` (8164), `saveAcademicRule` (8181).
- `js/teacher.js` SHA `c475fce5afcd28fca23e7b64398ad32b17773746`:
  - referencias del formulario de creación (189), carga/renderizado de evaluaciones (3286-3354), edición (3441-3476), controlador `openExamScheduleValidationModal` (1756-1827) y envío de creación `createExamForm.onsubmit` (4764-4800).
- `teacher-dashboard.html` SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`:
  - sección de tareas/exámenes (179-205), formulario de examen (286-323); ausencia de `modal-exam-schedule-validation`, `form-exam-reschedule-simulation`, `sim-exam-id`, `sim-exam-fecha` y cualquier referencia a `openExamScheduleValidationModal`.
- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`: `fetchApi` (11-60), carga de `currentUser` y construcción de `enrichedPayload` (38-58).
- `tests/regression/academic-grading-suite.js` SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`: suite estática de evaluaciones/calificaciones; no contiene `checkExamSchedulingConflict`, `simulateExamReschedule`, TAREA-F7-IMP-07 ni CA-F7-45..50.
- `backend/developer-service/Code.gs` SHA `8aa4bac67cfe5c8c54da51a0784a56fef633e412`: no contiene referencias a las dos funciones de programación evaluativa ni a TAREA-F7-IMP-07.
- `ChangesLogs.txt` SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`: entrada histórica del 2026-10-26, líneas aproximadas 2310-2319.
- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; `Pendientes.md` blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`.
- Documentos de auditoría de partida: `Auditoria.txt` SHA `baf44793ea58fe292387a34bc66e64d15488b87e`; `MapaDependencias.md` SHA `867db24a0ce54c65eda248ef32812cd4695e6495`; `AUDITORIA_COMPLETADAS_PLAN.md` SHA `e83dd1df4d659550a979b76a52e8ac8a009de369`; `Contexto_personal.txt` SHA `c2f18b5dafa589d839c15067d2ae47bdeec7f4cd`.

## 3. Hallazgos

### H1 - CRÍTICO/P0: la validación de conflictos no bloquea la creación ni la actualización de evaluaciones

`checkExamSchedulingConflict` y `simulateExamReschedule` están expuestas en el dispatcher de EXAM, pero `createExam` (506) no invoca la comprobación antes de insertar el examen y `updateExam` (555) escribe los campos directamente sin validar el cambio. El formulario de creación (teacher.js:4764-4800) envía `createExam` sin consulta previa; el formulario de edición (3441-3476) llama directamente a `updateExam`. `updateExamStatus` también cambia el estado sin revisar si la evaluación queda programada en una fecha incompatible. La existencia aislada de una función de validación no garantiza que el flujo real la ejecute antes de confirmar.

### H2 - ALTO/P1: límites rígidos, ámbito de grupo ambiguo y ausencia de separación configurable

`checkExamSchedulingConflict` (875-907) aplica `Number(maxExamenesPorDia) || 2`; por tanto, impone dos evaluaciones incluso si la institución no configuró límite y reemplaza valores falsy por 2. No consulta `ReglasAcademicas` ni otra configuración institucional. `simulateExamReschedule` fija además `maxExamenesPorDia: 2` (926), y el mensaje de la interfaz afirma que siempre se aplica un máximo de dos (teacher.js:1807). No existe regla de separación entre evaluaciones por horas/días ni límites por intervalo configurable.

La comparación de grupo usa `r[4] === seccionAsignada OR r[3] === seccionAsignada`, comparando la sección o el grado por separado. No compone grado+sección+año/período ni usa una identidad de grupo/oferta. Puede mezclar secciones homónimas de grados distintos o comparar una sección con el texto de un grado. El cálculo utiliza `fechaLimite`, no una fecha de aplicación del examen independiente de la fecha límite de entrega.

### H3 - ALTO/P1: el modelo de Examenes no representa una programación evaluativa completa

El encabezado de `Examenes` (exam-service:30) contiene ExamenID, Titulo, Asignatura, Grado, Seccion, FechaLimite, TiempoLimite, Estado, ProfesorID, Parcial, AreaCurricular, DuracionMinutos, IntentosPermitidos y EsAleatorio. No dispone de una fecha/hora efectiva de aplicación separada de `FechaLimite`, hora de inicio/fin, año/período académico, identificador de grupo/oferta, aula, recursos reservados ni un tipo que diferencie examen ordinario, recuperación y otras actividades evaluativas. `createExam` persiste solo los primeros diez valores y no incorpora un contrato de calendario/recursos.

En consecuencia, el validador actual no puede detectar de forma fiable coincidencias de docente por intervalo, solapamientos de aula, recursos exclusivos/compartidos ni incompatibilidades por tipo de evaluación. Tampoco identifica estudiantes afectados; la simulación solo devuelve una sección en texto.

### H4 - CRÍTICO/P0: la integración del calendario no lectivo está rota por divergencia de esquema e índices

El inicializador académico crea `CalendarioAcademico` con nueve columnas: EventoID, AnoID, SedeID, NombreEvento, TipoDia, FechaInicio, FechaFin, Visibilidad, Estado (academic-service:113). Sin embargo, `createCalendarEvent` (6651-6715) espera un esquema de trece columnas y, al llamar primero a `getOrCreateSheet`, la hoja nueva ya tiene una cabecera de nueve; la condición `getLastRow() === 0` no añade la cabecera alternativa. Se escriben trece valores bajo una cabecera incompatible.

Los lectores tampoco respetan el esquema de nueve columnas: `getAcademicCalendar` (6616-6644) interpreta r[2] como nombre cuando es SedeID, r[3] como TipoDia cuando es NombreEvento, r[4]/r[5] como fechas cuando son TipoDia/FechaInicio, r[6] como visibilidad cuando es FechaFin y r[7] como estado cuando es Visibilidad. `getScheduleCalendarConflicts` (6876-6897) y la rama de calendario de `checkScheduleConflict` (7525-7542) usan igualmente r[3], r[4], r[5] y r[7] como si correspondieran a TipoDia, fechas y estado. Con el encabezado declarado, esos índices no corresponden. Además, el servicio EXAM no consulta el calendario ni llama a la validación académica para vacaciones, suspensiones o días no lectivos. La fecha de una evaluación puede ser aceptada sin verificar el calendario institucional.

### H5 - CRÍTICO/P0: la interfaz de simulación no existe en el HTML y no hay punto de entrada

`js/teacher.js` define `window.openExamScheduleValidationModal` (1757) y espera `modal-exam-schedule-validation`, `form-exam-reschedule-simulation`, `sim-exam-id`, `sim-exam-seccion`, `sim-exam-fecha` y `sim-exam-result-box`. Ninguno de esos nodos existe en `teacher-dashboard.html`; tampoco hay botón ni referencia HTML a la función. El controlador queda sin forma de abrirse y su listener no se registra. La UI de creación solo muestra título, asignatura, grado y fecha límite; no ofrece tipo de evaluación, fecha/hora real, período, aula, recursos ni restricciones. El historial de ChangesLogs que afirma la incorporación del botón/modal no coincide con el estado versionado actual.

### H6 - ALTO/P1: la simulación es solo una vista previa incompleta y no existe confirmación segura de reprogramación

`simulateExamReschedule` (910-945) excluye el propio examen y devuelve un resumen, pero solo ejecuta el conteo diario limitado de H2. No simula calendario, docente, aula, recursos, separación temporal ni estudiantes afectados. No existe una acción de confirmación que aplique exactamente la propuesta validada. En cambio, la edición ordinaria llama directamente a `updateExam`, que cambia `fechaLimite` sin volver a validar. No hay vínculo transaccional entre el resultado de simulación y el cambio confirmado, ni protección contra que los datos cambien entre ambos pasos.

`updateExam` conserva el mismo `ExamenID`, lo que mantiene la referencia de `EntregasExamen` cuando se modifica esa fila; por ello, no se afirma que toda edición rompa el vínculo histórico. Sin embargo, `deleteExam` (578-607) solo comprueba `EntregasExamen`: si no encuentra entregas elimina físicamente el examen y preguntas sin comprobar `CalificacionesEstudiantes` o `RecuperacionesEstudiante`. No hay prueba de integridad de esas referencias, bitácora de reprogramación ni evidencia de propagación de la fecha efectiva a calendarios/vistas.

### H7 - CRÍTICO/P0: el flujo API no entrega el token que el servicio EXAM exige

`validateRolePermission` (207-227) requiere `sessionToken`, `authToken` o `token` para acciones no públicas. `checkExamSchedulingConflict`, `simulateExamReschedule`, `createExam` y `updateExam` no están en `PUBLIC_ACTIONS); se encuentran en permisos del rol Profesor, pero el permiso solo se evalúa después de validar la credencial. `fetchApi` (js/api.js:38-58) recupera `currentUser` y añade `requesterUserId`/`requesterRole`, pero no añade ninguna de las tres claves de token. El controlador de simulación tampoco las envía. Por la ruta normal, las acciones privadas carecen de la credencial que el backend exige. Se amplía el hallazgo existente AUD-NG-001; no se crea un mecanismo de autenticación paralelo.

### H8 - ALTO/P1: no existe regresión conductual de los criterios de programación evaluativa

La suite `tests/regression/academic-grading-suite.js` comprueba funciones de calificación F9, pero no contiene casos para `checkExamSchedulingConflict`, `simulateExamReschedule`, TAREA-F7-IMP-07 ni CA-F7-45..50. `backend/developer-service/Code.gs` tampoco referencia las funciones de programación evaluativa. No hay pruebas para límites ausentes/configurados, intervalos de separación, grupos homónimos, calendario no lectivo, conflictos de docente/aula/recurso, simulación frente a confirmación, duplicados, conservación de resultados ni propagación a calendario.

## 4. Evaluación de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-45 | NO CUMPLE | La creación/edición no ejecuta el validador; la función aislada solo cuenta coincidencias de sección/fecha. |
| CA-F7-46 | NO CUMPLE | Se aplica límite 2 por defecto y la simulación lo fija explícitamente; no se consulta una regla institucional configurada. |
| CA-F7-47 | PARCIAL | `updateExam` modifica la fila existente y conserva ExamenID, pero no es una operación de reprogramación validada ni usa la fecha efectiva de aplicación; la simulación no confirma. |
| CA-F7-48 | PARCIAL | El ID estable mantiene EntregasExamen en una edición; no se verifica el resto de referencias históricas y `deleteExam` solo protege frente a entregas. |
| CA-F7-49 | NO CUMPLE | EXAM no consulta calendario y los lectores académicos usan índices incompatibles con el encabezado real. |
| CA-F7-50 | NO CUMPLE | La simulación omite restricciones relevantes, no tiene UI HTML y no existe confirmación enlazada a la propuesta. |

## 5. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

### [TASK-552] Normalizar el modelo de programación y la configuración institucional de evaluaciones
- **Hallazgo de origen:** AUD-NG-242 / H2-H3.
- **Severidad:** Alta.
- **Objetivo:** separar la fecha de aplicación de la fecha límite y representar el contexto completo de cada evaluación.
- **Acción ejecutable:** versionar/migrar el esquema de Examenes para incorporar fecha efectiva, hora/duración, año/período, grupo/oferta, tipo evaluativo, docente, aula y recursos; definir contrato de configuración institucional por ámbito sin introducir límites predeterminados no autorizados.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; backend/academic-service/Code.gs; hojas Examenes y ReglasAcademicas.
- **Dependencias y riesgos:** createExam/updateExam/getAllExams/getStudentExams; getAcademicRules/saveAcademicRule; compatibilidad de filas históricas y referencias de calificaciones.
- **Alcance:** migración no destructiva, identificadores estables, valores explícitos y compatibilidad de lectura con registros anteriores.
- **Criterios de aceptación:** FechaEvaluacion es independiente de FechaLimite; los campos requeridos tienen encabezados/versionado; el tipo distingue ordinario/recuperación/otro; las reglas se consultan por ámbito y no se inventa un límite cuando no existe.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-553] Implementar el motor configurable de carga, coincidencia y separación entre evaluaciones
- **Hallazgo de origen:** AUD-NG-242 / H1-H2.
- **Severidad:** Alta.
- **Objetivo:** detectar incompatibilidades antes de crear o modificar una evaluación.
- **Acción ejecutable:** ampliar checkExamSchedulingConflict para aplicar límites diarios/por intervalo solo cuando estén configurados, períodos mínimos de separación, tipos evaluativos y ámbito compuesto de grupo (año, período, grado, sección/oferta); excluir el propio registro durante reprogramación y resolver estudiantes/grupos afectados desde fuentes autorizadas.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; hojas Examenes, OfertaAcademica, Matriculas y ReglasAcademicas.
- **Dependencias y riesgos:** TASK-552; estados de examen, períodos académicos y modelo de matrícula; evitar falsos positivos entre secciones homónimas.
- **Alcance:** un único motor compartido por creación, actualización, simulación y confirmación; no aceptar valores de conteo/grupo no verificados desde el cliente.
- **Criterios de aceptación:** límite ausente no bloquea por un valor inventado; límite configurado se aplica; separación temporal se respeta; solo colisiona el mismo grupo/contexto; se devuelve lista verificable de conflictos y afectados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-554] Corregir el contrato de CalendarioAcademico e integrar días no lectivos al validador EXAM
- **Hallazgo de origen:** AUD-NG-242 / H4; amplía AUD-NG-236.
- **Severidad:** Crítica.
- **Objetivo:** que vacaciones, feriados, suspensiones y días no lectivos se lean con fechas/estados correctos y bloqueen evaluaciones según política institucional.
- **Acción ejecutable:** unificar encabezados y DTO de CalendarioAcademico; alinear getAcademicCalendar, createCalendarEvent, getScheduleCalendarConflicts y checkScheduleConflict; resolver fechas por encabezado, estado y visibilidad correctos; exponer una consulta compartida para el servicio EXAM y validar intersección de rangos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/exam-service/Code.gs; hoja CalendarioAcademico.
- **Dependencias y riesgos:** TASK-552/553; datos de calendario existentes, fechas inclusivas y zona horaria institucional; migración sin pérdida de eventos.
- **Alcance:** conservar eventos y metadatos, no duplicar calendarios ni modificar eventos históricos sin trazabilidad.
- **Criterios de aceptación:** los lectores devuelven los campos conforme al encabezado real; los eventos inactivos no bloquean; un evento no lectivo activo bloquea el rango que corresponde; EXAM recibe el resultado antes de confirmar.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-555] Integrar conflictos de docentes, aulas y recursos físicos en la programación evaluativa
- **Hallazgo de origen:** AUD-NG-242 / H3; depende de los contratos de TASK-552 y amplía las tareas de espacios TASK-545..TASK-551.
- **Severidad:** Alta.
- **Objetivo:** impedir solapamientos de evaluaciones con disponibilidad docente, aulas y recursos reservables.
- **Acción ejecutable:** consultar docente asignado, horario, duración, aula, mantenimiento, reservas y recursos compartidos/exclusivos; validar conflictos por intervalo y grupo; devolver cada causa de incompatibilidad.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; backend/academic-service/Code.gs; hojas HorariosClase, SedesAulas, MantenimientoAulas y catálogo físico de recursos.
- **Dependencias y riesgos:** TASK-545..TASK-551 y TASK-552..TASK-554; no duplicar el catálogo físico de recursos ni la lógica común de disponibilidad.
- **Alcance:** consumir servicios/contratos comunes y evitar escrituras durante la validación.
- **Criterios de aceptación:** se detecta docente ocupado, aula ocupada/no disponible y recurso insuficiente/exclusivo; la validación no crea ni modifica reservas; las causas se muestran separadas y trazables.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-556] Implementar simulación y confirmación segura de reprogramaciones sin perder historial
- **Hallazgo de origen:** AUD-NG-242 / H1-H6; amplía AUD-NG-238.
- **Severidad:** Crítica.
- **Objetivo:** aplicar únicamente propuestas que hayan sido simuladas y revalidadas, manteniendo la identidad e historial de la evaluación.
- **Acción ejecutable:** crear operación de confirmación que reciba propuesta/versionado, revalide conflictos al confirmar, actualice la misma evaluación por ExamenID, use idempotencia/lock y registre actor, motivo, antes/después; propagar fecha efectiva a calendarios y vistas; impedir eliminación física si existen calificaciones/recuperaciones/referencias históricas.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; backend/academic-service/Code.gs; hojas Examenes, EntregasExamen, CalificacionesEstudiantes, RecuperacionesEstudiante y CalendarioAcademico.
- **Dependencias y riesgos:** TASK-552..TASK-555; concurrencia, duplicados, datos históricos y operación de calendario.
- **Alcance:** la simulación permanece sin efectos laterales; la confirmación es una operación separada, atómica o compensable, y nunca crea un segundo examen para reprogramar el existente.
- **Criterios de aceptación:** simulación no escribe; confirmación revalida; ExamenID permanece estable; no se duplican evaluaciones; calificaciones/entregas/recuperaciones siguen vinculadas; calendario/vistas reflejan fecha efectiva; fallos parciales no dejan referencias huérfanas.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-557] Conectar la interfaz docente de programación y simulación de evaluaciones
- **Hallazgo de origen:** AUD-NG-242 / H5-H6; amplía AUD-NG-237.
- **Severidad:** Crítica.
- **Objetivo:** hacer accesible el flujo de programación, validación, simulación y confirmación desde el dashboard.
- **Acción ejecutable:** incorporar botón, modal y formulario reales; agregar campos de fecha/hora efectiva, tipo, período, grupo, docente, aula y recursos; conectar la validación antes de guardar/editar; mostrar conflictos y estudiantes afectados; habilitar confirmar solo después de simulación vigente y autorizada.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/exam-service/Code.gs.
- **Dependencias y riesgos:** TASK-552..TASK-556; navegación y permisos docentes; evitar HTML dinámico inseguro.
- **Alcance:** no alterar flujos de tareas no evaluativas ni crear controles sin invocador real.
- **Criterios de aceptación:** los nodos HTML existen; el botón abre el modal; crear/editar/reprogramar ejecuta el mismo motor; la propuesta y sus causas se ven antes de confirmar; la UI muestra errores reales y no declara éxito anticipado.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-558] Restablecer autenticación y autorización de las acciones privadas de programación EXAM
- **Hallazgo de origen:** AUD-NG-242 / H7; amplía AUD-NG-001.
- **Severidad:** Crítica.
- **Objetivo:** entregar y verificar la credencial de sesión que el backend requiere para cada operación privada.
- **Acción ejecutable:** corregir el ciclo loginUser/currentUser/fetchApi para conservar y transmitir sessionToken (o el campo canónico vigente); validar identidad/rol desde claims firmados; aplicar permisos de Profesor/Director/Administrador a consulta, simulación y confirmación sin confiar en requesterRole del cliente.
- **Archivos/módulos afectados:** js/auth.js; js/api.js; backend/exam-service/Code.gs; backend/user-service/Code.gs si requiere ajuste del contrato de login.
- **Dependencias y riesgos:** AUD-NG-001 y el contrato de sesión HMAC; no crear tokens paralelos ni convertir acciones privadas en públicas.
- **Alcance:** solo el flujo de identidad/token y permisos relacionados; preservar los controles ABAC/RBAC existentes.
- **Criterios de aceptación:** llamadas privadas contienen credencial vigente; token ausente/expirado/revocado es rechazado; rol se deriva de claims verificados; Profesor solo gestiona evaluaciones dentro de su ámbito; simulación y confirmación quedan auditadas.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### [TASK-559] Añadir regresión conductual integral para CA-F7-45..CA-F7-50
- **Hallazgo de origen:** AUD-NG-242 / H1-H8.
- **Severidad:** Alta.
- **Objetivo:** demostrar comportamiento real del motor y del ciclo de reprogramación.
- **Acción ejecutable:** incorporar fixtures aislados para límites configurados/ausentes, separación, grupos homónimos, estados, tipo evaluativo, calendario no lectivo, docentes, aulas, recursos, estudiantes afectados, simulación, confirmación, idempotencia, referencias históricas, propagación, permisos y errores parciales.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js; backend/exam-service/Code.gs; backend/academic-service/Code.gs; backend/developer-service/Code.gs; teacher-dashboard.html; js/teacher.js.
- **Dependencias y riesgos:** TASK-552..TASK-558; aislamiento de Apps Script/Sheets y no usar datos productivos.
- **Alcance:** pruebas unitarias/integración/E2E según entorno; no limitarse a buscar nombres de funciones o cadenas estáticas.
- **Criterios de aceptación:** cada CA-F7-45..50 tiene casos positivos/negativos; se verifican persistencia, recarga, no duplicación y referencias históricas; la suite falla ante regresiones reales; se registra el resultado y el entorno exacto.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### Hallazgos existentes ampliados y control de duplicidad

- **AUD-NG-001:** se amplía el hallazgo de token para createExam, updateExam, checkExamSchedulingConflict y simulateExamReschedule; no se crea otro hallazgo general de autenticación.
- **AUD-NG-236:** se amplía el motor de conflicto y la lectura temporal de CalendarioAcademico; se conserva su alcance general de horarios y validación.
- **AUD-NG-237:** se amplía la brecha de UI del panel docente por la ausencia del botón/modal de validación de evaluaciones.
- **AUD-NG-238:** se amplía la falta de simulación integral y confirmación enlazada para reprogramar evaluaciones.
- **Nuevo hallazgo:** AUD-NG-242. **Tareas nuevas:** TASK-552..TASK-559. Los IDs se verificaron ausentes en Auditoria.txt, MapaDependencias.md, Plan, Contexto, completadas.md y blob de Pendientes.md.
- No se duplican TASK-515..TASK-537 ni TASK-545..TASK-551; las nuevas tareas dependen de esos componentes cuando corresponda y delimitan el dominio de evaluaciones.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual de los contratos, encabezados, funciones, flujos de creación/edición/validación/simulación, permisos, calendario, datos de resultados, HTML, API, suite, historial, SHAs y estructura Git.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth, navegador, Google Sheets/Drive productivas, concurrencia real, pruebas de persistencia, rollback, carga ni E2E. No se ejecutó la suite Node del repositorio; no se dispone de un entorno aislado verificado para esta auditoría.
- No se inspeccionaron datos reales de Examenes, CalendarioAcademico, EntregasExamen, CalificacionesEstudiantes ni RecuperacionesEstudiante; las conclusiones se limitan al código y a los esquemas declarados.
- No se verificó la entrega de correo/notificaciones ni la publicación en entornos productivos.
- No se modificaron código, pruebas, datos productivos, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, metodología ni rama base.

## 7. Cierre y siguiente tarea

- `TAREA-F7-IMP-07`: **NO CUMPLE**; marca histórica [X] preservada.
- Hallazgo nuevo: AUD-NG-242. Se amplían AUD-NG-001, AUD-NG-236, AUD-NG-237 y AUD-NG-238.
- Tareas derivadas TASK-552..TASK-559: Pendientes.
- **Siguiente tarea cronológica:** `TAREA-F7-IMP-08`, “Ampliar las excepciones del calendario y la gestión de sesiones”.
