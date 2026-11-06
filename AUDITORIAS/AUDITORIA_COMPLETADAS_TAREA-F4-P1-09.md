# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P1-09

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `2d78507eceaa335116e58127ecf3d4a845aed204`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1512Z` (chat iniciado y cerrado en C1.84; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE**

## 1. Alcance y límite de fuente

`completadas.md` marca TAREA-F4-P1-09 como completada, con severidad Alto y archivos `js/ui-common.js`, `dashboard-direccion.html` y `backend/user-service/Code.gs`. La descripción conserva el título, origen, clasificación y archivos, pero no criterios de aceptación detallados. La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no aparece en el árbol actual. Por ello, no se inventan criterios ausentes: se contrasta el objetivo declarado con el panel, los endpoints que lo alimentan y los contratos de auditoría ya documentados.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques revisados |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | ROLE_PERMISSIONS 922-980; autenticación/autorización 1050-1305; doPost 1345-1480; getPaginatedAuditLogReport 4243-4369; generatePrivilegeAndAccountAuditReport 4372-4453; getSecurityAndComplianceDashboardData 4454-4540; recordTraceabilityLog 4548-4608; registerAndDispatchEvent/retryFailedEventsQueue 4618-4759; logStructuredEvent 320-380; loginUser 2460-2555; getSecurityDelegations 1803-1859. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | openSecurityAndComplianceDashboardModal 5616-5760. |
| `dashboard-direccion.html` | `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` | botón del panel 46; inclusión de ui-common.js y vinculación del botón 160-205, dentro del bloque revisado 1-220. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | TAREA-F4-P1-09, líneas 1757-1761. |
| `Pendientes.md` | SHA previo `2a3bc3bc1afbc92b0793589096c1dab169662552` | AUD-NG-145 18358-18375; AUD-NG-219/TASK-498 19809-19835 y reconciliación de dependencias. |
| `Auditoria.txt` | `53895a0f4fcafbaece2bbac75b672cd0335d1771` | AUD-NG-145, observaciones de TAREA-F4-P1-01 y hallazgos de auditoría de logs. |
| `AUDITORIA_COMPLETADAS_PLAN.md` | `848c8298c963958a99f9ff5dd3f63269e8337cf2` | resultados hasta C1.83. |
| `MapaDependencias.md` | `ab44f70607436e8fbdc650ed894c6272079dfc04` | dependencias de TAREA-F4-P1-08 y servicios de seguridad. |

## 3. Hallazgos y evidencia

### 3.1. Los indicadores no respetan los filtros aplicados

En `getSecurityAndComplianceDashboardData` (USER 4454-4540), la lista `eventsList` se construye aplicando fecha, usuario y tipo de evento (aprox. 4475-4497). Sin embargo, los incrementos de `failedLogins`, `successfulLogins` y `revokedSessions` se ejecutan fuera de esas condiciones (aprox. 4500-4504). En consecuencia, activeDelegationsCount puede quedar en cero aunque existan delegaciones activas. El mismo patrón aparece en generatePrivilegeAndAccountAuditReport (4372-4453): crea otra llamada a getSecurityDelegations({ statusFilter: "ACTIVA" }) sin token y captura el error sin propagarlo, por lo que delegationsCount también puede quedar en cero. No se ejecutaron los endpoints en Apps Script; la conclusión deriva del flujo estático y del contrato de ambas funciones.

Este defecto se registra como ampliación de AUD-NG-219, no como un nuevo hallazgo del motor de delegaciones.

### 3.3. El backend devuelve información que la interfaz no presenta

`getSecurityAndComplianceDashboardData` devuelve `activeDelegations` y `healthReport` además de `metrics` y `events` (aprox. 4528-4538). `openSecurityAndComplianceDashboardModal` solo consume los cuatro contadores y `res.events` (js/ui-common.js 5715-5758); no muestra el arreglo de delegaciones ni el informe de salud.

Existen endpoints registrados en el router y concedidos a Director en `ROLE_PERMISSIONS`: `generatePrivilegeAndAccountAuditReport` y `getPaginatedAuditLogReport` (USER 922-980 y 1450-1480). Sin embargo, no se encontraron llamadas a ellos en el modal ni en el bloque de integración de `dashboard-direccion.html`. La revisión de cuentas privilegiadas/inactivas y el informe paginado no están conectados a la experiencia del panel. El panel no ofrece tampoco navegación paginada hacia los registros que el endpoint ya permite consultar.

### 3.4. Riesgo de renderizado inseguro de registros

En js/ui-common.js 5740-5755, el modal concatena valores de los eventos y mensajes de error dentro de cadenas HTML asignadas a `tbody.innerHTML`. No se observa escape contextual para `evt.userId`, `evt.module`, `evt.action`, `evt.details` ni `err.message`. Dado que el contrato de `BitacoraEventos` ya presenta el desajuste registrado en AUD-NG-145, el campo interpretado como `module` puede recibir el JSON de `eventData` escrito por `registerAndDispatchEvent`. Si un valor almacenado contiene marcado, el navegador podría interpretarlo como HTML. Esto se registra como riesgo condicional de renderizado almacenado; no se ejecutó prueba XSS en navegador ni se afirma explotación confirmada.

### 3.5. Reconciliación con hallazgos existentes

- **AUD-NG-145:** ya cubre que `logStructuredEvent` escribe en `LogsSistema`, mientras el panel lee `BitacoraEventos`; también cubre el esquema incompatible entre `registerAndDispatchEvent` y sus lectores, y el nombre `BitacoraTraceability` frente a `BitacoraTrazabilidad`. La auditoría C1.75 ya había registrado que los eventos LOGIN_FAILED/LOGIN_SUCCESS no alimentan los contadores del panel. Se amplía AUD-NG-145 por el sink `innerHTML` sin escape; no se crea un hallazgo duplicado de fuentes/DTO.
- **AUD-NG-219/TASK-498:** conserva la autoridad, ámbito, cadena y gestión de delegaciones. Se amplía por la llamada interna del panel que pierde el contexto autenticado y no usa el nombre de filtro esperado.
- **AUD-NG-160:** conserva vigencia e invalidación de cachés; no se duplica.
- **Nuevo AUD-NG-227/TASK-507:** cubre exclusivamente la composición del panel, consistencia de indicadores con filtros, paginación visible, integración de reportes y presentación de salud/datos disponibles. No reemplaza AUD-NG-145 ni AUD-NG-219.

## 4. Dictamen

**NO CUMPLE.** Existe un modal conectado a un botón del dashboard de Dirección y un endpoint de consolidación, pero el resultado no constituye un panel fiable de seguridad, auditoría y cumplimiento: los KPI no siguen los filtros, la lista está truncada a 200 sin paginación, el contador de delegaciones pierde la identidad autenticada, y los reportes de privilegios/auditoría y la salud operativa no se presentan. Además, el renderizado de registros no aplica escape contextual visible.

## 5. Pruebas y limitaciones

**Ejecutado:** inspección estática/manual de las funciones, variables, contratos, rutas del router, permisos, fuentes de datos y renderizado UI; comparación de SHA; reconciliación con AUD-NG-145 y AUD-NG-219/TASK-498.

**No ejecutado:** ejecución de Apps Script, HTTP, acceso a Google Sheets productivo, navegador/DOM, filtros con datos reales, paginación sobre más de 200 filas, validación multirol, consulta real de delegaciones, medición de salud operativa, prueba XSS ni suites automatizadas.

No se modificó código fuente ni se afirma comportamiento productivo probado.

## 6. Cierre documental

Se amplían AUD-NG-145 y AUD-NG-219 en `Pendientes.md`; se crea AUD-NG-227/TASK-507 para las brechas propias de integración/presentación del panel. Se actualizan `Auditoria.txt`, `MapaDependencias.md`, `AUDITORIA_COMPLETADAS_PLAN.md`, `Pendientes.md` y `Contexto_personal.txt\), y se crea este informe. No se modifican código fuente, `completadas.md`, `ChangesLogs.txt`, `METODOLOGIA_DESARROLLO.md` ni `README.md`.
