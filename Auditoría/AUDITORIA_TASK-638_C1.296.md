# AUDITORÍA TASK-638 — C1.296: contratos, autorización y persistencia

- Sesión: `IMA-AUDIT-20261109-1152Z`; checkpoint inicial C1.294; commit A C1.295 verificado.
- Tarea: TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo.
- Fase PM: PM-00; fase metodológica 0 y 2 (auditoría, registro y conversión de hallazgos).
- HEAD de partida: `0edce6ae2721b1d839ef259dad7ea77962fe8ab3`; rama `NG_beta_0.0.0.1_work`; base protegida `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`.
- Requisito íntegro: `pendientes/Contabilidad/Pendientes.md`, TASK-638; dependencia TASK-637 satisfecha en commit A.
- Informes previos: C1.289, C1.290, C1.291, C1.292 y C1.293; continuidad en `Auditoría/MapaDependencias.md`.

## 1. Requisito y alcance

TASK-638 exige documentar por archivo las dependencias HTML script/link, CSS, imágenes, fuentes, imports, referencias dinámicas, rutas, endpoints, acciones backend, contratos y servicios externos; distinguir comprobado/inferido y registrar consumidores/proveedores. Criterios: origen/destino exactos, rutas relativas y sensibilidad a mayúsculas, contratos de rutas dinámicas/endpoints y ninguna ruta funcional sin evidencia. Alcance exclusivo de auditoría/documentación: no cambiar rutas ni contratos.

## 2. Continuidad y cobertura previa

Commit A `0edce6ae2721b1d839ef259dad7ea77962fe8ab3` fue verificado antes de iniciar B; TASK-637 quedó Completada y el inventario se reconcilió. La rama base permanece sin cambios.

Se conservan los cierres parciales: HTML/HTM 101/101 (C1.291), JS 24/24 (C1.292), CSS 6/6, GS 6/6 estructural y JSON 27/27 (C1.293). No equivalen al cierre global: sigue pendiente el recorrido individual de cada acción a handler, autorización y persistencia, además de deployments.

## 3. Revisión de código y contratos

### 3.1 Fuentes backend y conteos

| Servicio | SHA Code.gs | Casos doPost | PUBLIC_ACTIONS | Handlers inexistentes | Hojas literales | openById | DriveApp |
|---|---|---:|---:|---:|---:|---:|---:|
| USER | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | 182 | 9 | 4 | 20 | 160 | 6 |
| ACADEMIC | `df87a2eea9f0ef79d0b966d03fd5bbe432003df5` | 241 | 6 | 1 | 25 | 221 | 13 |
| TASK | `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe` | 44 | 9 | 1 | 5 | 38 | 25 |
| EXAM | `1d93296628fae31f680004f637897e2b1314a64c` | 38 | 4 | 0 | 3 | 42 | 0 |
| ACCOUNTING | `38b979d41596b85e888b4a7060b37bbac0840a28` | 240 | 3 | 0 | 10 | 225 | 6 |
| DEVELOPER | `8aa4bac67cfe5c8c54da51a0784a56fef633e412` | 39 | 0 | 0 | 3 | 10 | 0 |

Los contadores de escritura appendRow/setValues/setValue son USER 134/19/97; ACADEMIC 178/20/203; TASK 20/6/15; EXAM 33/7/16; ACCOUNTING 184/45/314; DEVELOPER 4/0/1. Son referencias estáticas, no evidencia de ejecución exitosa.

### 3.2 Consumidores frontend

Se inspeccionaron los 24 JavaScript del inventario (21 bajo js/, más sw.js y dos suites de regresión; los tres adicionales no contienen llamadas fetchApi): 262 llamadas literales fetchApi; USER 70, ACADEMIC 120, TASK 23, EXAM 19, ACCOUNTING 30, DEVELOPER 0. `dashboard-recursos-humanos.html` agrega 25 llamadas inline ACCOUNTING; al menos 287 callsites identificados.

El total 211 de C1.293 no cubre el universo completo. Se localizaron además `js/api.js` (9 wrappers), `js/config.js` (2), `js/index-ui.js` (1), `js/ui-common.js` (19) y 25 llamadas HTML inline. La diferencia total respecto al subtotal informado es 76.

### 3.3 Autorización y datos

- Cinco servicios llaman validateRolePermission antes del switch; PUBLIC_ACTIONS omite verificación de claims/contexto. USER 9; ACADEMIC 6; TASK 9; EXAM 4; ACCOUNTING 3. DEVELOPER usa lógica separada.
- ACADEMIC publica saveAdmissionDraft/getAdmissionDraft, que consultan o escriben BorradoresAdmision usando draftKey/email sin identidad verificada (AUD-NG-357).
- TASK publica getStudentTasks/loadProject/getAllStudentProjects, entre otras. getStudentTasks usa userId de payload sin claims; loadProject puede leer Drive por fileId sin comprobar propietario (AUD-NG-002).
- EXAM publica getStudentExams/getAllExams; getStudentExams lee Examenes y EntregasExamen, y devuelve calificación/comentario a partir de userId del payload sin token (AUD-NG-356).
- USER manageAccountState actualiza Usuarios y registra el cambio antes de llamar dispatchSecurityEvent, inexistente; el error posterior puede dejar persistencia con respuesta de error (AUD-NG-359/TASK-688).
- DEVELOPER doPost confía en payload.authRole si no recibe token; el rol Desarrollador tiene wildcard. HMAC helpers y secreto determinista no están integrados en la ruta (AUD-NG-082/083/084/086).

### 3.4 Dispatchers sin handlers y contratos sin ruta

USER despacha cuatro funciones inexistentes: purgeSecurityCaches, dispatchSecurityEvent, processSecurityEventQueue y getSecurityEventsQueue. ACADEMIC despacha generateInstitutionalReport sin función declarada. TASK despacha generateAcademicArchiveZip sin función declarada. Total: seis referencias sin handler (AUD-NG-359/TASK-688).

js/api.js declara cuatro wrappers sin dispatcher: USER getBackupsList, restoreSpreadsheetBackup, runSystemMaintenance; ACADEMIC exportSchoolYearArchive. js/developer.js tiene callers observados para getBackupsList y exportSchoolYearArchive; los otros dos wrappers no tienen caller localizado en developer.js/developer-dashboard.html. Mantener AUD-NG-358/TASK-687 y precisar el alcance.

### 3.5 Servicios, endpoints y persistencia

USER, ACADEMIC, TASK, EXAM y ACCOUNTING usan el mismo literal SPREADSHEET_ID. DEVELOPER usa el marcador 1DEVELOPER-CONTROL-PLANE-SPREADSHEET-ID. js/config.js contiene URLs con forma de deployment para USER/ACADEMIC/TASK/EXAM; ACCOUNTING y DEVELOPER conservan placeholders. ACCOUNTING tiene 55 callsites identificados; DEVELOPER no presenta fetchApi literal en los 21 JS. No se verificaron deployments ni permisos efectivos.

USER delegateToTaskService envía JSON plano a TASK_SERVICE_URL, no utiliza createInterServiceEnvelope y, ante excepción, retorna status success local con sessionKey. TASK no define verifyInterServiceEnvelope. Se amplían AUD-NG-083/AUD-NG-174; no duplicar IDs.

## 4. Hallazgo nuevo

### AUD-NG-363 — MEDIO/P2 — Conteo y matriz de consumidores API incompletos

Evidencia: C1.293 registró 211 llamadas; la reauditoría estática identificó 262 callsites en 21 JavaScript y 25 llamadas inline en dashboard-recursos-humanos.html. Impacto: el denominador parcial deja consumidores y contratos fuera de la matriz. Causa: subtotal de archivos sin alcance/denominador explícito. Acción: ampliar TASK-678 existente para incluir todos los callsites y sus cadenas de despacho.

## 5. Tareas derivadas

TASK-678 se amplía con AUD-NG-363 sin crear un ID duplicado. Debe registrar los 287 callsites identificados, el mapa servicio/acción/dispatcher/handler/permisos/persistencia, las cuatro rutas wrapper sin dispatcher y las seis referencias a handlers inexistentes, con caller real frente a wrapper huérfano. Se mantienen las tareas existentes TASK-685..690 y las ampliaciones AUD-NG-002/082/083/084/086/174/323; no se duplican.

## 6. Pruebas y límites

Ejecutadas: verificación de HEAD/ramas; lectura íntegra del requisito TASK-638 y de los informes C1.289-C1.293; inspección estática de los seis Code.gs, los 21 JS, las rutas configuradas, los cuatro wrappers, developer-dashboard.html y dashboard-recursos-humanos.html; contraste de dispatchers, funciones, PUBLIC_ACTIONS, llamadas de almacenamiento y referencias de hoja/Drive.

No ejecutadas: Node, navegador, HTTP, Apps Script, Drive, Sheets, multi-cuenta, regresión, integración y E2E. No se verificaron deployments, Script Properties, permisos efectivos ni datos reales. No se afirma conectividad ni ejecución de operaciones.

## 7. Dictamen

**TASK-638: EN EJECUCIÓN — auditoría parcial ampliada; NO CUMPLE todavía el criterio global.** Se ha ampliado la matriz y corregido el denominador, pero resta completar el mapeo individual handler → helpers → hoja/archivo persistido para cada acción, revisar dependencias dinámicas restantes y verificar destinos desplegados con evidencia autorizada. No se modificó código, rutas, endpoints ni datos.

## 8. Archivos

Modificados: `Auditoría/MapaDependencias.md`, `Auditoría/AUDITORIA_TASK-638_C1.296.md` (nuevo), `Auditoria.txt`, `tareas_auditoria.txt`, `changueslogs.txt`, `pendientes/Contabilidad/Pendientes.md`, `Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md`, `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt`, `Auditoría/INDICE_CHECKPOINTS.md` e `docs/architecture/repository-inventory.md` (reconciliación de los artefactos de esta iteración).

Revisados sin modificación: `METODOLOGIA_DESARROLLO.md`, `index.html`, los seis `Code.gs`, 21 JavaScript, `developer-dashboard.html`, `dashboard-recursos-humanos.html`, los informes C1.289-C1.293 y los demás backlogs.

## 9. Próxima acción reproducible

Abrir `Auditoría/MapaDependencias.md`, sección C1.296. Completar la matriz individual de cada service/action identificando dispatcher, handler, helpers transitivos, claims/contextual access, hojas/archivos/Drive, mutaciones y respuesta; empezar por los 287 callsites y priorizar USER/ACADEMIC/TASK/EXAM/ACCOUNTING. Contrastar rutas de wrappers con callers, cerrar las dependencias AUD-NG-358/359 y las ampliaciones TASK-678, y verificar deployments/Script Properties mediante evidencia autorizada. No implementar correcciones de código durante TASK-638.

## 10. Checkpoint

C1.296; sesión `IMA-AUDIT-20261109-1152Z`; checkpoint inicial C1.294; commit A C1.295 verificado `0edce6ae2721b1d839ef259dad7ea77962fe8ab3`; sesión abierta. Fase metodológica 0/2; PM-00. TASK-638 En ejecución; AUD-NG-363 registrado.

HEAD de partida B: `0edce6ae2721b1d839ef259dad7ea77962fe8ab3`; rama base protegida `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`.

Ubicación: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt`, sección C1.296; índice `Auditoría/INDICE_CHECKPOINTS.md`, fila C1.296.

Commit B de cierre: el commit que contiene este checkpoint; SHA a verificar externamente.