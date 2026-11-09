# AUDITORÍA FUNCIONAL Y TÉCNICA — TAREA-F7-IMP-21
## Auditoría operativa y trazabilidad de la planificación

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-1852Z (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.252.
- **Repositorio:** `i-miss-cocaine/IMA`.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `503ff832d0fe6f0696b15a6a730a3395babf0a57`.
- **Rama base protegida:** `NG_beta_0.0.0.1`, HEAD `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Estado en completadas.md:** [X] histórico; no equivale a certificación funcional.
- **Prioridad declarada:** P2.
- **Dictamen:** **NO CUMPLE**.
- **Fuente primaria:** bloque completo TAREA-F7-IMP-21 en `completadas.md`, líneas 4592-4619, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- **Fuente secundaria declarada:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md`, no localizada en la rama.
- **Informe individual esperado:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-21.md`, no localizado. Se ejecutó la auditoría directamente; no se omitió la tarea.

---

## 1. Alcance y criterios de aceptación

La tarea requiere una vista consolidada que permita revisar operaciones de creación, edición, borrador, publicación, cancelación/eliminación y restauración de horarios. Debe identificar actor, timestamp, operación y registros afectados; diferenciar éxito, rechazo y fallo; registrar conflictos y resolución; detectar notificaciones fallidas; filtrar por usuario, período, recurso, operación y estado; restringir el acceso por roles autorizados; impedir alteración por usuarios no autorizados; correlacionar operaciones con errores/notificaciones; y minimizar datos sensibles.

Criterios auditados:

- **CA-F7-128:** una operación relevante se rastrea desde solicitud hasta resultado.
- **CA-F7-129:** los errores identifican componente y registro afectados.
- **CA-F7-130:** usuarios no autorizados no consultan ni alteran la bitácora.
- **CA-F7-131:** se distingue conflicto de planificación de fallo técnico.
- **CA-F7-132:** las consultas de seguimiento no modifican los datos auditados.

## 2. Procedimiento y fuentes

1. Verificar rama, HEAD, árbol, checkpoint C1.252 y rama base.
2. Consultar `completadas.md`, la fuente secundaria, el informe individual y `ChangesLogs.txt`.
3. Recuperar y consultar `Pendientes.md` desde su blob Git, conforme a la instrucción expresa de esta tarea. Aunque la metodología contiene una regla general que excluye Pendientes.md del flujo operativo, la instrucción actual ordena consultarlo y tiene prioridad para esta iteración.
4. Inspeccionar manualmente, función por función, los escritores y lectores de auditoría, mutaciones de horarios, notificaciones, permisos RBAC, transporte API, UI y pruebas.
5. Contrastar cada requisito y criterio; reconciliar hallazgos con AUD-NG-224 y AUD-NG-145 para no duplicar defectos generales de historial/bitácora.
6. Registrar los hallazgos y las tareas derivadas sin modificar código ni datos productivos.

### Integridad documental

- `completadas.md`: SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; TAREA-F7-IMP-21 está marcada [X] en líneas 4592-4619.
- El informe individual IMP-21 y `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` devuelven NOT_FOUND.
- `Pendientes.md`: lectura ordinaria devuelve 0 caracteres, SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`. Se recuperó directamente por blob: 1.782.094 caracteres, 20.182 líneas y cero U+FFFD. La ruta en la rama referencia el mismo SHA; no requiere restauración ni transferencia.
- Reconciliación: AUD-NG-224/TASK-504 ya cubre la unificación del esquema de HistorialCambiosEntidad, actores verificados, integridad, permisos, paginación y alineación de UI. AUD-NG-145 ya cubre LogsSistema, BitacoraEventos, BitacoraTraceability/BitacoraTrazabilidad, DTO, sanitización y productores. Estos alcances se amplían; no se crean duplicados.
- `ChangesLogs.txt`, líneas 2547-2568, afirma que en 2025-05-24 se añadió el botón y el modal de auditoría en `teacher-dashboard.html`. La inspección actual del HTML completo no encuentra `modal-academic-audit-logs`, `academic-audit-logs-container` ni `openAcademicAuditLogsModal`. El registro histórico no coincide con el estado vigente del archivo.

## 3. Inspección técnica y evidencia

### 3.1 Persistencia y escritores de eventos

**`backend/academic-service/Code.gs`, SHA `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`.**

- `logStructuredEvent`, líneas 52-77, persiste en `LogsSistema` y captura/suprime errores de escritura (74-76). No escribe en `HistorialCambiosEntidad` ni acredita por sí solo una bitácora durable e íntegra de planificación.
- `recordEntityChangeLog`, líneas 1568-1590, escribe nueve columnas: `HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable, CorrelationID`. Su catch también absorbe fallos de escritura.
- Se localizaron llamadas de negocio a `recordEntityChangeLog` en operaciones de admisión y ciclo de vida estudiantil (2023, 2095, 11341, 11859, 11928, 11980, 12129, 12189). No se encontraron llamadas desde las mutaciones de horarios auditadas.
- `createClassSchedule`, líneas 6900-6990: registra `SCHEDULE_SAVED` mediante `logStructuredEvent` (6962), no mediante historial de entidad; registra fallo de notificación en LogsSistema (6982-6983). No genera evento diferenciado de creación/edición con snapshot anterior/nuevo, actor verificado y correlationId.
- `deleteClassSchedule`, líneas 6992-7005: desactiva el bloque en HorariosClase (7003) y retorna éxito (7004) sin registrar evento de auditoría.
- `publishClassSchedules`, líneas 7008-7116: registra el éxito en LogsSistema (7084), pero la ruta de conflicto devuelve error con detalle (7067-7073) sin persistir un evento específico de conflicto/rechazo. El snapshot de versión puede fallar y solo produce un log estructurado (7103-7104).
- `restoreScheduleVersion`, líneas 7224-7314: restaura y genera versión; registra un evento en LogsSistema (7306), no una fila del historial de planificación.
- `copyClassSchedules`, líneas 7317-7395: registra resumen de copia en LogsSistema (7386); los conflictos/omisiones quedan en la respuesta, no como eventos individuales consultables en la bitácora consolidada.
- `applyScheduleTemplate`, líneas 14000-14100: aplica bloques y llama a invalidación de caché (14093), pero no registra evento de auditoría de aplicación.
- `saveClassroomResource` y `saveClassroomMaintenance`, líneas 7752-7838, registran solo mediante `logStructuredEvent`; no se conectan con la vista consolidada.
- Las notificaciones fallidas de `createClassSchedule` se escriben en LogsSistema, pero el endpoint de auditoría no consulta esa fuente ni la cola/historial de notificaciones.
- En `createClassSchedule`, el rol de log se obtiene de `payload.authRole`; en publicación/restauración el actor se obtiene de `payload.authUserId`. La validación de sesión establece `payload._verifiedUserId` y `payload._verifiedRole` (524-543), pero estas mutaciones no usan consistentemente esos campos verificados para atribuir el actor.

### 3.2 Lectores y contrato de datos

- `getAcademicPlanningAuditLogs`, líneas 13837-13890, lee exclusivamente `HistorialCambiosEntidad` (13844-13849). No consulta `LogsSistema`, `BitacoraTraceability`/`BitacoraTrazabilidad`, errores del dispatcher ni registros de notificaciones.
- El lector interpreta `row[1]` como tipo de entidad, `row[3]` como operación, `row[5]` como detalles, `row[6]` como timestamp y `row[8]` como estado (13851-13858). El escritor ACADEMIC `recordEntityChangeLog` coloca en esos índices fecha, entityId, snapshot anterior, snapshot nuevo y correlationId, respectivamente; el entityType se escribe en `row[2]`. Por tanto, el lector no reconstruye correctamente las filas producidas por el esquema ACADEMIC. Esta incompatibilidad pertenece al alcance ya registrado de AUD-NG-224/TASK-504; se amplía allí, no se crea un hallazgo duplicado.
- La lista de tipos aceptados se filtra sobre `row[1]` (13853), lo que descarta filas del esquema ACADEMIC cuyo tipo real está en `row[2]`.
- Los únicos filtros del endpoint son usuario, operación y estado (13840-13842, 13860-13862). No hay filtros por período/fecha ni recurso. No hay paginación ni límite de resultados.
- La dependencia declarada en la tarea, `getAcademicAuditLogs`, es otra función: líneas 7841-7869, consulta `BitacoraAuditoriaEstructurada`. La vista llama a `getAcademicPlanningAuditLogs`, no al endpoint genérico declarado; tampoco se encontró una integración de `BitacoraTraceability` en el lector de planificación.
- `getOrCreateSheet` (84-155) crea una hoja vacía si no existe. El lector puede crear `HistorialCambiosEntidad` al consultarlo (13844), retornar éxito con lista vacía y alterar la estructura del spreadsheet aunque no modifique filas de auditoría.

### 3.3 RBAC y transporte de la solicitud

- `getAcademicPlanningAuditLogs` está en la lista de permisos del rol `Profesor` (Code.gs:242-253) y queda disponible para `Administrador` por wildcard. No aparece en las listas explícitas de `Director`, `Secretaría` ni `Secretaria`; estos roles tienen `getAcademicAuditLogs`, que es un endpoint diferente.
- `PUBLIC_ACTIONS` no incluye `getAcademicPlanningAuditLogs`. `validateRolePermission` exige token de sesión en `sessionToken`, `authToken` o `token` (524-543).
- `js/api.js`, SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`, líneas 39-57, solo agrega `requesterUserId` y `requesterRole` desde currentUser y envía ese payload; no inyecta `sessionToken` ni `authToken`.
- El controlador `loadAcademicPlanningAuditLogs` invoca `fetchApi('ACADEMIC', 'getAcademicPlanningAuditLogs', {})` (teacher.js:1397-1404), sin token ni filtros. En el contrato actual, la llamada UI no satisface el requisito de autenticación y el servidor la rechaza antes del dispatcher. Además, el conjunto de roles explícitamente autorizado no está alineado con los roles administrativos que tienen el endpoint genérico.

### 3.4 Interfaz de usuario

- `js/teacher.js`, SHA `c475fce5afcd28fca23e7b64398ad32b17773746`, líneas 1390-1432, define `openAcademicAuditLogsModal` y `loadAcademicPlanningAuditLogs`.
- El controlador intenta abrir `modal-academic-audit-logs` y cargar `academic-audit-logs-container`; si el contenedor no existe, retorna sin mostrar nada (1397-1400).
- `teacher-dashboard.html`, SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`, completo: no contiene el modal, el contenedor ni el botón invocador. Solo aparece una mención no relacionada a “Historial archivado”.
- `openAcademicAuditLogsModal` tiene una sola referencia en `teacher.js` (su definición); no hay invocación desde el HTML. El loader tiene dos apariciones, definición y llamada interna.
- La UI no presenta controles de filtro y siempre envía `{}`; no permite filtrar por usuario, período, recurso, tipo de operación o estado.
- El renderizador concatena valores de bitácora directamente en `innerHTML` (1411-1424), incluidos detalles, actor, entidad, ID y operación, sin escape contextual visible. El riesgo de renderizado inseguro se reconcilia con AUD-NG-224 y AUD-NG-145, sin duplicar un hallazgo genérico de sanitización.

### 3.5 Pruebas

- `runAcademicPlanningRegressionSuite`, líneas 14150-14151, ejecuta TC-F7-07 llamando `getAcademicPlanningAuditLogs({ estado: "EXITOSO" })` y considera aprobada la prueba si la respuesta tiene `status === "success"` y `logs` es un arreglo.
- El endpoint puede retornar `status: "success"` y `logs: []` cuando no existen filas (o cuando el esquema no coincide). Por ello TC-F7-07 puede aprobar sin demostrar que se haya rastreado una operación real.
- No se comprueban creación/edición/borrador/publicación/cancelación/restauración, errores, conflictos, notificaciones fallidas, correlación, filtros, permisos positivos/negativos, integridad de actor, read-only ni renderizado seguro.
- `tests/regression/academic-grading-suite.js`, SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`, no aporta cobertura conductual para CA-F7-128..132.

## 4. Hallazgos

### AUD-NG-261 — MEDIO/P2: las operaciones de planificación no generan un historial durable y correlacionado completo

**Evidencia:** Code.gs 52-77, 1568-1590, 6900-7005, 7008-7116, 7224-7314, 7317-7395, 7752-7838, 13837-13890 y 14000-14100.

**Descripción:** las mutaciones de horarios escriben de forma parcial en LogsSistema o no escriben ningún evento; no se registran de forma uniforme en HistorialCambiosEntidad. El endpoint de planificación consulta solo HistorialCambiosEntidad y no puede consolidar los registros que se escriben en LogsSistema. No hay cobertura durable para borrado, aplicación de plantillas y conflictos de publicación; los fallos de notificación tampoco se integran. Los campos de actor usados por algunas mutaciones proceden de payload no verificado y no hay correlationId común que enlace solicitud, resultado, error y notificación.

**Impacto:** no es posible reconstruir con fiabilidad el ciclo de vida de un horario ni identificar todos los actores, resultados y operaciones fallidas. Una consulta puede aparentar éxito aunque no existan registros recuperables.

**Reconciliación:** ampliar AUD-NG-224/TASK-504 para que el contrato canónico cubra escritores y lectores de planificación; ampliar AUD-NG-145 para conectar LogsSistema y fuentes de trazabilidad sin duplicar sus defectos generales.

### AUD-NG-262 — MEDIO/P2: la consola de auditoría declarada no existe en el dashboard vigente

**Evidencia:** teacher.js 1390-1432; teacher-dashboard.html completo; ChangesLogs.txt 2547-2568.

**Descripción:** existe controlador JavaScript, pero faltan botón, modal y contenedor HTML. El loader retorna inmediatamente si falta el contenedor. No existen controles de filtros y el único llamado envía payload vacío. ChangesLogs afirma que el modal y botón fueron añadidos, pero el HTML actual no contiene sus identificadores.

**Impacto:** la vista no es alcanzable desde el dashboard y no satisface la consulta administrativa prevista. Los datos de auditoría no pueden revisarse mediante la interfaz que declara la tarea.

**Reconciliación:** ampliar TASK-504 para el contrato común de historial y su UI; crear TASK-621 para terminar la consola específica de planificación. El renderizado con innerHTML sin escape se mantiene dentro de AUD-NG-224/AUD-NG-145.

### AUD-NG-263 — MEDIO/P2: autorización y transporte de credenciales incompatibles con el acceso a la bitácora

**Evidencia:** Code.gs 168-253, 524-543, PUBLIC_ACTIONS y dispatcher 763-765; js/api.js 39-57; teacher.js 1397-1404.

**Descripción:** la acción no es pública y exige token, pero el consumidor no lo envía. Además, el permiso específico está concedido a Profesor y Administrador, mientras Director y Secretaría solo tienen la acción genérica distinta. No hay un contrato explícito y coherente de los roles autorizados para esta vista.

**Impacto:** el consumidor de UI no puede completar la consulta autenticada; la concesión de permisos no demuestra que la vista esté restringida al conjunto de roles administrativos previsto. La auditoría de permisos no puede aprobarse con el mapa actual.

**Reconciliación:** ampliar TASK-504/AUD-NG-224 para política de roles y consulta de historial; TASK-621 debe consumir credenciales verificadas y aplicar los roles autorizados explícitamente.

### AUD-NG-264 — MEDIO/P2: TC-F7-07 es una prueba de humo que acepta una bitácora vacía

**Evidencia:** Code.gs 14150-14151 y 13837-13890; tests/regression/academic-grading-suite.js completo.

**Descripción:** TC-F7-07 comprueba únicamente que el endpoint devuelve éxito y un arreglo. No exige un evento sembrado ni verifica el contenido, actor, timestamp, estado, correlación, filtros, permisos o ausencia de mutación. Una bitácora vacía o un lector incompatible puede superar el test.

**Impacto:** la suite no acredita ninguno de los comportamientos esenciales de trazabilidad y permite conservar una marca histórica de completado sin evidencia funcional.

**Reconciliación:** TASK-621 incorpora pruebas conductuales específicas de la consola; TASK-504 mantiene las pruebas de contrato/migración e integridad genérica. AUD-NG-161 se coordina para la estrategia transversal de pruebas, sin duplicar la cobertura de esta tarea.

## 5. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-128 | NO CUMPLE | Mutaciones sin registro durable uniforme; falta correlación solicitud-resultado-error-notificación. |
| CA-F7-129 | NO CUMPLE | Errores/conflictos no aparecen en la bitácora consultada con componente y registro afectados. |
| CA-F7-130 | NO CUMPLE | Token no enviado por el consumidor; permisos específicos inconsistentes entre Profesor, Dirección y Secretaría. |
| CA-F7-131 | NO CUMPLE | Conflictos de publicación retornan detalle pero no se persisten; fallos técnicos se registran aparte en LogsSistema y no se consolidan. |
| CA-F7-132 | PARCIAL | El lector no modifica filas existentes, pero getOrCreateSheet puede crear la hoja vacía al consultar; no hay prueba que garantice read-only. |

**Dictamen global: NO CUMPLE.**

## 6. Tareas ejecutables derivadas de los hallazgos

### [TASK-620] Conectar el ciclo de vida de planificación con un historial durable y correlacionado
- **Hallazgo de origen:** AUD-NG-261.
- **Prioridad:** P2.
- **Objetivo:** registrar de manera uniforme todas las operaciones de horarios y recursos desde la solicitud hasta el resultado, con actor verificado y correlationId.
- **Acciones:** integrar creación, edición, borrador, cancelación/desactivación, publicación, restauración, copia, aplicación de plantillas y cambios de recursos con el escritor canónico; persistir snapshots anteriores/nuevos y registros afectados; tomar actor/rol desde claims verificados; propagar requestId/correlationId; registrar éxitos, rechazos, fallos, conflictos y su resolución; relacionar notificaciones fallidas y reintentos; no silenciar fallos de auditoría obligatoria ni declarar éxito si se pierde evidencia crítica; minimizar PII/secretos.
- **Criterios:** cada operación relevante produce un evento recuperable; los eventos distinguen operación y estado; actor y correlación son verificables; conflictos y errores identifican el horario/recurso afectado; notificaciones se correlacionan; fallos de escritura quedan recuperables y visibles; las pruebas demuestran persistencia sin exponer datos sensibles.
- **Dependencias:** TASK-504/AUD-NG-224 para esquema y escritor canónicos; AUD-NG-145 para bitácoras estructuradas y trazabilidad central; AUD-NG-161 para regresión.
- **Estado:** Pendiente.

### [TASK-621] Completar la consola de auditoría de planificación, autorización y pruebas conductuales
- **Hallazgos de origen:** AUD-NG-262, AUD-NG-263 y AUD-NG-264.
- **Prioridad:** P2.
- **Objetivo:** proporcionar una vista operativa real, accesible solo a roles autorizados, con filtros y evidencia verificable.
- **Acciones:** incorporar botón, modal, contenedor y estados de carga/vacío/error en teacher-dashboard.html o en el dashboard administrativo autorizado; conectar controlador y endpoint con token de sesión válido; definir y aplicar explícitamente los roles permitidos; implementar filtros por usuario, período/fecha, recurso, tipo de operación y estado, con paginación acotada; mostrar componente, registro afectado, conflicto/error y notificación correlacionados; renderizar datos con escape contextual; garantizar que la consulta no altere filas auditadas ni cree estructuras inesperadas; sustituir TC-F7-07 por pruebas conductuales con fixtures y permisos positivos/negativos.
- **Criterios:** la vista puede abrirse desde un control real; el endpoint recibe identidad autenticada; roles no autorizados son rechazados; cada filtro altera los resultados; los errores y conflictos se distinguen; valores hostiles se muestran como texto; la consulta no modifica registros; los tests fallan ante lista vacía cuando se esperaba un evento y validan contenido, correlación y seguridad.
- **Dependencias:** TASK-620; TASK-504/AUD-NG-224; AUD-NG-145; AUD-NG-161.
- **Estado:** Pendiente.

### Ampliaciones de tareas y hallazgos existentes

- **AUD-NG-224 / TASK-504:** añadir expresamente `getAcademicPlanningAuditLogs`, el mapeo incompatible del esquema ACADEMIC, el endpoint de planificación, la UI docente y la autorización/paginación de esa vista. Mantener el alcance transversal de esquema canónico, migración, actor verificado, integridad y manejo de fallos.
- **AUD-NG-145:** añadir que las mutaciones de planificación escriben en LogsSistema o no escriben, mientras la vista lee HistorialCambiosEntidad; el endpoint no integra BitacoraTraceability/BitacoraTrazabilidad ni las notificaciones. Mantener en AUD-NG-145 los defectos generales de DTO, fuentes, sanitización y correlación.
- **AUD-NG-161:** coordinar pruebas de regresión/integración y permisos; TASK-621 mantiene los casos específicos CA-F7-128..132.
- **Control de duplicidad:** no crear otro hallazgo para la incompatibilidad general de HistorialCambiosEntidad ni para el desajuste BitacoraTraceability/BitacoraTrazabilidad; ya están en AUD-NG-224 y AUD-NG-145 respectivamente.

## 7. Pruebas y límites

- **Ejecutadas:** inspección manual de las funciones y consumidores citados; revisión de llamadas a recordEntityChangeLog y logStructuredEvent; contraste de esquemas y posiciones; revisión del dispatcher, RBAC, PUBLIC_ACTIONS y fetchApi; inspección completa del HTML; comparación de ChangesLogs con el estado vigente; revisión de TC-F7-07; recuperación directa del blob de Pendientes.md; verificación de rama, HEAD y rama base.
- **No ejecutadas:** Apps Script runtime, Google Sheets productivas, llamadas HTTP/OAuth reales, navegador/DOM, pruebas XSS, ejecución de TC-F7-01..07, pruebas de roles reales, concurrencia, fallos de escritura, notificaciones reales, Node ni E2E.
- No se afirma que el endpoint haya sido ejecutado contra datos productivos ni que se haya probado la entrega de notificaciones.
- No se modificó código, UI, pruebas, datos productivos, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, metodología ni rama base.

## 8. Cierre

- **TAREA-F7-IMP-21:** NO CUMPLE; se conserva la marca histórica [X] en `completadas.md`.
- **Hallazgos nuevos:** AUD-NG-261, AUD-NG-262, AUD-NG-263 y AUD-NG-264 (MEDIO/P2).
- **Hallazgos ampliados:** AUD-NG-224 y AUD-NG-145.
- **Tareas nuevas:** TASK-620 y TASK-621.
- **Tareas ampliadas:** TASK-504. Coordinar AUD-NG-161 únicamente para los criterios de pruebas conductuales de bitácoras, sin trasladar su alcance específico de idempotencia/concurrencia.
- **Archivo nuevo:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-21.md`.
- **Archivos actualizados:** `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`, `AUDITORIAS/Contexto_personal.txt`.
- **Siguiente tarea:** TAREA-F7-IMP-22, plantillas y reutilización controlada de horarios.
