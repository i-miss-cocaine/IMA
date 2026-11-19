# AUDITORÍA TASK-638 — C1.297: trazabilidad USER/ACADEMIC, identidad y acciones públicas

- **Sesión:** `IMA-AUDIT-20261109-1152Z`; checkpoint inicial C1.294; checkpoints intermedios C1.295 y C1.296.
- **Tarea:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo.
- **Fase:** metodológica 0 y 2; PM-00 (auditoría de dependencias y conversión de hallazgos).
- **HEAD de partida:** `5bf51a6b0c12fd62edc42385c55976789d00a423`; rama `NG_beta_0.0.0.1_work`; tree `ca33a4e8bcf0127e3b16c49954375a5b0ebadb20`.
- **Rama base protegida:** `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Requisito íntegro:** `pendientes/Contabilidad/Pendientes.md`, TASK-638.
- **Informe anterior:** `Auditoría/AUDITORIA_TASK-638_C1.296.md`.

## 1. Continuidad y auditoría de la tarea anterior

Se contrastó TASK-637 con su requisito, el informe C1.295 y el commit A `0edce6ae2721b1d839ef259dad7ea77962fe8ab3`. El commit contiene el inventario reconciliado, informe y checkpoint; la cobertura documentada es 1.021/1.021 blobs en el cierre C1.295 y el estado de TASK-637 en el backlog es Completada. No se encontró incumplimiento que justifique reabrirla. TASK-638 puede continuar.

El HEAD de trabajo coincide con C1.296. La rama base sigue en `44d9891132332e692dbe2ba8602b41f50a508a59`; compare: 369 commits adelante, 0 detrás. El tree recursivo de partida contiene 1.022 blobs y no está truncado.

## 2. Identidad y propagación de sesión — ampliación de AUD-NG-001

Evidencia actual:
- `js/auth.js:138-160`: login llama USER/`loginUser` y construye `userData` con userId, nombre, email y rol, pero no conserva `result.sessionToken` ni `result.data.sessionToken`; persiste solo `currentUser`.
- `js/api.js:39-58`: `fetchApi` lee `currentUser` y añade únicamente `requesterUserId` y `requesterRole`. El cuerpo JSON contiene `action` y `payload`, sin `sessionToken`, `authToken` ni `token`.
- USER `validateRolePermission` (`backend/user-service/Code.gs:1253-1261`) obtiene el rol mediante `getUserVerifiedRole(payload)`; las acciones especiales autenticadas solo se admiten después de esa verificación. ACADEMIC aplica el mismo requisito en `Code.gs:524+`.
- El logout elimina claves `sessionToken` (`js/ui-common.js:223-250`), pero no se encontró código frontend que guarde o adjunte el token.

**Dictamen:** AUD-NG-001 permanece abierto y se amplía; no se crea un ID duplicado. El mapa contenía una afirmación genérica incorrecta sobre propagación de token en `js/api.js`; se corrige con evidencia de las líneas actuales. No se ejecutaron peticiones HTTP, por lo que el efecto en deployments no se certifica en runtime.

## 3. USER — acciones de tickets y controles de propietario

La capa `validateRolePermission` (`Code.gs:1253-1261`) permite diez acciones autenticadas mediante una lista temprana que retorna antes de `validateContextualAccess` y RBAC. Entre ellas están `submitProblemTicket`, `getProblemTickets` y `replyProblemTicket`.

- `submitProblemTicket` (`Code.gs:400+`) toma `userId`, nombre y rol del payload para guardar el autor; no sustituye el identificador por `payload._verifiedUserId`.
- `getProblemTickets` (`Code.gs:470+`) filtra por `currentUserId` solo si el valor está presente. Si un usuario autenticado omite `userId`, la condición no excluye tickets de otros usuarios y la función devuelve el conjunto completo (salvo notas internas para no administradores).
- `replyProblemTicket` (`Code.gs:603+`) verifica propiedad solo cuando `currentUserId` es truthy. Si falta, permite responder a cualquier ticket; además, el autor se registra con el identificador recibido del payload o el fallback `USER`.
- Consumidores UI: `js/ui-common.js:3806-3823` envía identidad cliente al crear; `3901-3911` envía userId al listar «Mis tickets»; `3985-4003` envía userId al responder; el panel administrativo llama `getProblemTickets` con payload vacío en `4096`.

### AUD-NG-364 — ALTO/P1 — Acceso cruzado e impersonación en tickets USER

La identidad y propiedad de los tickets se basan en campos opcionales y manipulables del payload. La omisión de userId produce controles fail-open en lectura y respuesta; la creación permite atribuir tickets a otro usuario. Requiere token válido para superar la capa de autenticación, pero no una autorización por rol/propietario en estas acciones. Es un hallazgo nuevo; no sustituye AUD-NG-001 ni AUD-NG-280.

**Tarea derivada:** ampliar TASK-636 existente (backlog `pendientes/Otros/Pendientes.md`), sin crear ID nuevo: retirar el bypass para estas acciones o aplicar permiso explícito; derivar autor desde claims; exigir identidad obligatoria; comprobar propiedad siempre y rechazar ausencia/mismatch; cubrir pruebas positivas y negativas.

## 4. USER — acciones declaradas públicas con filtros de audiencia no confiables

`PUBLIC_ACTIONS` (`Code.gs:922-924`) contiene `getNews` y `getInstitutionalAnnouncements`; `validateRolePermission:1253-1255` las autoriza antes de verificar sesión.

- `getNews` (`Code.gs:3116-3152`) acepta `includeInactive`, `grado` y `seccion` del cliente. Si `includeInactive` es truthy omite el filtro de estado y vigencia; los filtros de grado/sección se aplican al valor que el propio llamante elige.
- `getInstitutionalAnnouncements` (`Code.gs:3817-3845`) acepta `rol`/`audiencia` del cliente y devuelve contenido de los comunicados cuya audiencia coincida con ese valor. No contrasta el público solicitado con un claim verificado.
- `js/student.js:3055` consulta comunicados con `currentUser.rol` y `TodaLaComunidad`; `js/index-ui.js:759` consulta noticias con payload vacío. El contrato público permite, no obstante, enviar otros valores directamente.

### AUD-NG-365 — MEDIO/P2 — Filtros de audiencia y vigencia manipulables en consultas públicas USER

Las acciones públicas permiten solicitar noticias inactivas/fuera de vigencia o comunicados de audiencias distintas de la propia, sin identidad verificada. La existencia y sensibilidad de registros concretos en Sheets no se verificó; el hallazgo documenta la capacidad estructural de consulta, no una extracción real.

**Tarea derivada:** ampliar TASK-636 existente para clasificar qué datos son realmente públicos, retirar el bypass donde corresponda y derivar audiencia/grado/sección desde claims o limitar el DTO público; mantener excepciones anónimas solo para contenido expresamente público. Añadir pruebas de filtros manipulados y de contenido retirado/fuera de vigencia.

## 5. ACADEMIC — rutas públicas y dependencias ya registradas

- `PUBLIC_ACTIONS` (`backend/academic-service/Code.gs:265`) contiene `ping`, `createAdmissionRequest`, `getPublicAdmissionStatus`, `saveAdmissionDraft`, `getAdmissionDraft` y `getServiceHealthDiagnostics`.
- `js/student.js:3179` llama `createAdmissionRequest`; `3189` llama `getPublicAdmissionStatus`; el fallback de seguimiento familiar también lo llama en `278`.
- `saveAdmissionDraft` (`Code.gs:1433+`) y `getAdmissionDraft` (`1482+`) siguen dependiendo de email/draftKey aportados por cliente. Ya están cubiertos por AUD-NG-002/AUD-NG-357 y el informe F5-004; no se duplica hallazgo.
- `getPublicAdmissionStatus` (`1510-1543`) permite búsqueda por código o DNI y devuelve nombres, grado, estado y expedienteId. La falta de segundo factor/rate limit ya consta en la auditoría F5-004/AUD-NG-002; no se crea ID duplicado.
- `getServiceHealthDiagnostics` (`4451-4491`) fija `connectivity: PASS` y `permissions: PASS`; comprueba apertura de Spreadsheet y solo prueba Drive cuando `fullCheck` es truthy. No demuestra deployment ni conectividad HTTP real; conservar la relación con AUD-NG-323.
- Las llamadas protegidas ACADEMIC comparten el problema de AUD-NG-001: `fetchApi` no transmite el token y el login no lo conserva.

## 6. Reconciliación de IDs y tareas

- **AUD-NG-001:** ampliado por ausencia de persistencia/transmisión del token en el flujo frontend actual.
- **AUD-NG-280:** se conserva para `getAutomationRules` sin guardia de rol; no duplicar.
- **AUD-NG-002/AUD-NG-357:** se conservan para acciones públicas sensibles de tareas/admisión y borradores.
- **AUD-NG-364 y AUD-NG-365:** nuevos hallazgos USER descritos en las secciones 3 y 4.
- **TASK-636:** ampliación de la tarea existente para tickets y filtros públicos USER; no crear tarea duplicada.
- **TASK-678:** ampliada para incorporar la traza de acciones, identidad/claims y persistencia; TASK-638 continúa En ejecución.

## 7. Límites, pruebas y siguiente acción

Inspección estática de código, callsites y documentación Git. No se ejecutaron Node, navegador, Apps Script, HTTP, Drive, Sheets, multiusuario, regresión, integración ni E2E. No se verificaron deployments ni Script Properties; no se inspeccionaron registros reales de comunicados/noticias.

Siguiente bloque: continuar la matriz individual de ACADEMIC y USER por cada callsite/acción, siguiendo dispatcher → handler → helpers → claims/contexto → persistencia/Drive → respuesta/errores; completar la cobertura restante de HTML inline y servicios TASK/EXAM. Mantener TASK-638 En ejecución y no modificar código durante la auditoría.

## 8. Archivos

Modificados: informe C1.297, `Auditoría/MapaDependencias.md`, `Auditoria.txt`, `tareas_auditoria.txt`, `changueslogs.txt`, checkpoint Parte_0002, índice y `docs/architecture/repository-inventory.md`.

Revisados sin modificación: requisito TASK-638, informe C1.296, informe C1.295/TASK-637, metodología, plan maestro, seis Code.gs y los JS de autenticación/tickets/admisión consultados. No se modificó código, endpoints, contratos ni datos productivos.

## 9. Checkpoint

C1.297; sesión `IMA-AUDIT-20261109-1152Z`; estado de sesión abierta; checkpoint inicial C1.294. Ubicación: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt`, sección C1.297. Commit de cierre: el commit que contiene este checkpoint; SHA se confirma externamente.
