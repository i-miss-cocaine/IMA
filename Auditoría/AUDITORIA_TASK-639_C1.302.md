# AUDITORÍA TASK-639 — Duplicaciones, símbolos globales y ciclos

- **Sesión:** IMA-AUDIT-20261109-1339Z-01
- **Fecha:** 2026-11-09
- **Repositorio/rama:** i-miss-cocaine/IMA — `NG_beta_0.0.0.1_work`
- **Commit auditado (HEAD):** `aa5a85f9eaedec5f89963a15cd32e8ed5e6e45e6`
- **Rama base verificada:** `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`
- **Tarea/fase:** TASK-639 — PM-00
- **Expediente de origen:** AUD-NG-283 en `Auditoría/AUDITORIA_COMPLETADAS_F8-TASK02.md`
- **Dependencias:** TASK-637 y TASK-638; ambas verificadas como Completadas en la evidencia C1.301.
- **Alcance:** inspección estática de los 24 archivos JS y 6 archivos Apps Script inventariados en C1.301; revisión de los puntos de entrada y orden de carga de dashboards relevantes; análisis de declaraciones globales, dispatchers, llamadas interservicio y contratos compartidos.
- **Límite:** no se ejecutó código ni se accedió a Apps Script runtime, deployments, Script Properties, navegador, Drive o Sheets productivos.

## 1. Dictamen ejecutivo

Se satisface el alcance estático de TASK-639. Se confirmaron redefiniciones globales en tres microservicios y colisiones de cuatro símbolos globales del frontend en dashboards que cargan simultáneamente los módulos de Secretaría y Docente. También se identificaron helpers compartidos entre microservicios independientes, que no colisionan en runtime pero sí requieren control de deriva contractual.

No se encontró un ciclo en el grafo estático de llamadas interservicio inspeccionado: la única llamada de red entre servicios identificada es USER → TASK. Tampoco se identificaron aristas de importación ES-module en los módulos JS revisados. Esto no certifica ausencia de ciclos dinámicos que dependan de datos, eventos, callbacks o deployments no inspeccionados.

**Resultado:** TASK-639 puede marcarse Completada como auditoría estática/documental. No se modificó código fuente. Los defectos accionables quedan derivados a tareas independientes; no bloquean el cierre del inventario PM-00.

## 2. Cobertura y método

Se reutilizó el inventario y mapa C1.301; no se repitió TASK-637 ni TASK-638. Se inspeccionaron declaraciones de funciones, asignaciones a `window`, símbolos exportados, orden de scripts, dispatchers `doPost`, llamadas a `UrlFetchApp.fetch` y referencias de los símbolos compartidos identificados.

Módulos frontend revisados: `js/accounting.js`, `js/api.js`, `js/auth.js`, `js/config.js`, `js/data.js`, `js/destreza_teclado.js`, `js/developer.js`, `js/exam.js`, `js/games-adapter.js`, `js/index-ui.js`, `js/perifericos_juego.js`, `js/persistence.js`, `js/presentation-engine.js`, `js/quizpro.js`, `js/results.js`, `js/secretary.js`, `js/security-minigames.js`, `js/student.js`, `js/teacher.js`, `js/ui-common.js`, `js/webmaster_quiz_juego.js`, `sw.js` y las dos suites de regresión JS inventariadas.

Servicios Apps Script revisados: `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/developer-service/Code.gs`, `backend/exam-service/Code.gs`, `backend/task-service/Code.gs` y `backend/user-service/Code.gs`.

## 3. Hallazgos confirmados

### AUD-NG-374 — Redefiniciones de funciones globales en microservicios

**Severidad:** MEDIO / **Prioridad:** P2.

| Propietario | Símbolo | Declaraciones | Consumidor/dispatcher | Dictamen |
|---|---|---:|---|---|
| TASK | `normalizeString` | 9 y 1209 | handlers del servicio TASK | duplicación global; cuerpos equivalentes |
| TASK | `uploadChunk` | 795 y 1967 | `doPost`, case 394 | la segunda declaración sustituye la versión marcada DEPRECATED; contrato cambia de `uploadId` a `sessionKey` |
| ACCOUNTING | `manageTransportRoute` | 15699 y 16744 | `doPost`, case 775 | la segunda versión añade validación de vehículo, mantenimiento, seguro/licencia y capacidad |
| USER | `getIdempotencyPayloadSignature` | 209 y 1299 | `checkAndRegisterIdempotencyKey` y `doPost` | segunda versión excluye también `_verifiedRole` y `_verifiedUserId` |
| USER | `getNews` | 3116 y 5574 | `doPost`, case 1408 | segunda versión reemplaza la primera |
| USER | `getInstitutionalAnnouncements` | 3817 y 5684 | `doPost`, case 1435 | segunda versión incorpora lógica de vigencia y rol |
| USER | `createInstitutionalAnnouncement` | 3848 y 5784 | `doPost`, case 1436 | segunda versión incorpora validación de rol y vigencia |
| USER | `submitAnnouncementReceiptConfirmation` | 3873 y 5901 | `doPost`, case 1437 | segunda versión cambia el contrato de confirmación |
| USER | `getAnnouncementReadReport` | 3895 y 5934 | `doPost`, case 1438 | segunda versión reemplaza la primera |

Las declaraciones de función global con el mismo nombre se resuelven a la última declaración en el ámbito del proyecto; por ello, las primeras implementaciones quedan efectivamente desplazadas. No se afirma que la versión final sea incorrecta en todos los casos: el defecto confirmado es la coexistencia de implementaciones activas/legadas bajo el mismo nombre, con riesgo de mantenimiento, regresión y pérdida de comportamiento al editar la versión no efectiva.

**Falsos positivos descartados:** `parseSafeDate` aparece dentro de dos funciones de planilla distintas en ACCOUNTING; `recordTest` aparece anidada en suites de regresión de ACCOUNTING y DEVELOPER. Son funciones locales, no redefiniciones globales entre sí.

### AUD-NG-375 — Colisión de propietarios globales entre Secretaría y Docente

**Severidad:** MEDIO / **Prioridad:** P2.

| Símbolo global | Secretaría | Docente | Consumidores/impacto |
|---|---:|---:|---|
| `openClassroomManagerModal` | `js/secretary.js:657` | `js/teacher.js:2521` | ambos módulos asignan la misma propiedad global |
| `openAcademicLoadPlanningModal` | `js/secretary.js:766` | `js/teacher.js:2436` | ambos módulos asignan la misma propiedad global |
| `refreshAcademicPlanningData` | `js/secretary.js:774` | `js/teacher.js:2455` | llamada inline desde `dashboard-direccion.html:397` |
| `openAcademicAnalyticsModal` | `js/secretary.js:808` | `js/teacher.js:2279` | propiedad global redefinida; consumidor HTML directo no localizado en los dashboards muestreados |

`dashboard-direccion.html` carga `js/config.js`, `js/ui-common.js`, `js/secretary.js` y después `js/teacher.js`. Por tanto, las asignaciones del módulo Docente sustituyen las de Secretaría durante esa página. `dashboard-secretaria.html` carga Secretaría sin Docente, por lo que no presenta esa colisión en su secuencia actual. El propietario efectivo de los cuatro símbolos en Dirección es el último módulo cargado, no una autoridad declarada por contrato.

**Caso intencional descartado:** `window.GamesAdapter` tiene un fallback en `js/config.js` y una implementación principal en `js/games-adapter.js`. `index.html` carga primero configuración y después el adaptador principal; el patrón `||` del fallback y el orden observado son consistentes con una sustitución deliberada. No se registra como defecto confirmado.

### AUD-NG-376 — Helpers y contratos repetidos entre microservicios

**Severidad:** MEDIO / **Prioridad:** P2.

Se repiten nombres de helpers en proyectos Apps Script separados: `normalizeString`, `getOrCreateSheet`, `logStructuredEvent`, `computeHmacSignature`, `getAuthTokenSecret`, `verifySessionToken`, `validateContextualAccess`, `validateRolePermission`, `getDynamicPermissionsForRole`, `hasActiveDelegationForAction`, `getIdempotencyPayloadSignature`, `checkAndRegisterIdempotencyKey`, `saveIdempotentResult`, `createInterServiceEnvelope` y `verifyInterServiceEnvelope`.

**Propiedad:** cada implementación pertenece al `Code.gs` de su propio servicio (USER, ACADEMIC, TASK, EXAM, ACCOUNTING o DEVELOPER, según disponibilidad). **Consumidores:** dispatcher y handlers del mismo servicio; no existe un namespace global compartido entre los deployments separados. Por tanto, la repetición no constituye colisión de runtime, pero permite que autorización, firma, idempotencia y normalización evolucionen de forma divergente. Se deriva una tarea para formalizar contratos compartidos y controles de compatibilidad.

## 4. Acoplamientos y ciclos

- Frontend: `js/api.js` consume `window.SERVICE_URLS` declarada en `js/config.js`; `SERVICE_REGISTRY` describe propietarios y responsabilidades. Los dashboards dependen del orden de carga de scripts clásicos y de asignaciones `window.*`, no de imports modulares explícitos.
- Backend: se encontró una llamada `UrlFetchApp.fetch` en `backend/user-service/Code.gs:7955`, dentro de `delegateToTaskService`, que establece la arista USER → TASK. No se encontraron llamadas de red equivalentes en ACADEMIC, ACCOUNTING, DEVELOPER, EXAM o TASK, ni una arista TASK → USER en el código inspeccionado.
- Grafo estático interservicio observado: USER → TASK; no forma ciclo.
- No se detectaron ciclos de importación ES-module en los módulos JS inspeccionados. No se declara descartado todo ciclo dinámico: callbacks, eventos, invocaciones indirectas, configuración de deployment y comportamiento runtime no fueron ejecutados.

## 5. Evidencia de fuentes

SHA de blobs consultados en HEAD `aa5a85f9eaedec5f89963a15cd32e8ed5e6e45e6`:
- `backend/user-service/Code.gs`: `12079dd410aa6d8afbce55a4bc62a79dea605f9f`
- `backend/task-service/Code.gs`: `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe`
- `backend/accounting-service/Code.gs`: `38b979d41596b85e888b4a7060b37bbac0840a28`
- `backend/developer-service/Code.gs`: `8aa4bac67cfe5c8c54da51a0784a56fef633e412`
- `backend/academic-service/Code.gs`: `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`
- `backend/exam-service/Code.gs`: `1d93296628fae31f680004f637897e2b1314a64c`
- `js/secretary.js`: `08a81266957b4c18cc25f8ba6749eac30a8f2c2c`
- `js/teacher.js`: `c475fce5afcd28fca23e7b64398ad32b17773746`
- `js/config.js`: `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc`
- `js/games-adapter.js`: `4f43a67aa98a14e8d381c29ac585bf5952013a85`
- `dashboard-direccion.html`: `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c`
- `dashboard-secretaria.html`: `fa0d8c23aace24a6acab2d4956398a7f5e1309b8`

## 6. Tareas derivadas de los hallazgos de auditoría

### TASK-691 — Consolidar redefiniciones globales en microservicios
- **Hallazgo:** AUD-NG-374; **fase:** PM-02; **prioridad:** P2.
- **Archivos:** `backend/task-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`.
- **Acción:** reconciliar cada par de implementaciones, conservar explícitamente el comportamiento vigente y los criterios más completos, eliminar definiciones desplazadas y verificar los dispatchers/callers.
- **Dependencias:** controles de identidad/autorización PM-01 relacionados con TASK-636 y TASK-685; no retirar validaciones de las versiones más recientes.
- **Criterios:** una sola definición global por símbolo; contrato documentado; pruebas de regresión para upload chunked, rutas, noticias, comunicados e idempotencia.

### TASK-692 — Establecer propiedad única de handlers globales en dashboards
- **Hallazgo:** AUD-NG-375; **fase:** PM-02; **prioridad:** P2.
- **Archivos:** `js/secretary.js`, `js/teacher.js`, `js/ui-common.js`, `dashboard-direccion.html`, `dashboard-secretaria.html` y dashboards consumidores.
- **Acción:** asignar propietario por función, separar handlers compartidos de los específicos de rol y eliminar la dependencia accidental del orden de carga.
- **Criterios:** cada símbolo global tiene propietario único; Secretaría, Docente y Dirección ejecutan el handler correcto; pruebas de carga por dashboard y ausencia de sobrescrituras.

### TASK-693 — Formalizar contratos de helpers compartidos y guardas estáticas
- **Hallazgo:** AUD-NG-376; **fase:** PM-02; **prioridad:** P2.
- **Archivos:** microservicios Apps Script y pruebas/reglas de arquitectura.
- **Acción:** definir contratos versionados para autorización, sesión/HMAC, idempotencia, normalización y persistencia; añadir una verificación estática que detecte redefiniciones globales y ciclos interservicio.
- **Criterios:** cada servicio declara su propietario y versión contractual; diferencias intencionales quedan documentadas; la verificación detecta duplicados en un mismo ámbito y ciclos reales sin confundir proyectos aislados ni funciones locales.

## 7. Pruebas y límites

**Ejecutadas:** inspección estática de 24 JS y 6 GS; extracción de declaraciones y asignaciones globales; detección de duplicados por archivo; comparación de las versiones duplicadas; comprobación de cases en dispatchers; revisión de orden de scripts en dashboards; búsqueda de llamadas `UrlFetchApp.fetch`; comprobación de la única arista USER → TASK.

**No ejecutadas:** suites de regresión, Node, navegador, lint/runtime, Apps Script, HTTP, pruebas de contrato desplegadas, integración/E2E, multiusuario, deployments y Script Properties. No se declara ninguna de ellas como satisfactoria.

## 8. Dictamen y cierre

- Criterio de propietarios/consumidores: satisfecho para los símbolos compartidos y colisiones identificados; los consumidores no localizados se indican expresamente.
- Duplicados confirmados/descartados: documentados con archivo, líneas y dispatcher.
- Ciclos: ninguno en el grafo estático interservicio observado; los ciclos dinámicos quedan como límite no verificable.
- Código fuente: sin modificaciones.
- **Estado TASK-639:** Completada como auditoría estática/documental; los hallazgos de producto continúan abiertos en TASK-691/692/693.
- **Siguiente fase:** PM-01. La siguiente tarea concreta debe seleccionarse aplicando §6.1 del Plan Maestro, verificando dependencias y auditoría previa antes de iniciar.
