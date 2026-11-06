# Auditoría de tareas completadas: T-UX-23

- **Fecha:** 2026-11-06.
- **ID de sesión:** IMA-AUDIT-20261106-0254Z (inicio C1.63; sesión abierta).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** 67260fa9bfc79c34c9bf945b8b56a9a8ce9ef580.
- **Dictamen:** **NO CUMPLE**.

## Especificación y flujo
T-UX-23 figura [X] en completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676). Exige acceso discreto, descripción comprensible, validación de campos y registro real en TicketsReporteProblemas.

### UI y validación
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- initProblemReportingUI (3583+) crea btn-global-report-issue, asegura los modales de reporte/Mis Reportes/Admin y carga paleta.
- ensureReportIssueModalExists construye form-report-issue. La descripción y el resultado esperado tienen required, maxlength 2000, contadores y mensajes de error.
- openReportIssueModal abre el modal y asigna el área según contexto.
- submitProblemReportForm (3768+) aplica trim y mínimo de 20 caracteres a descripción y resultado esperado; deshabilita el botón mientras se envía, llama fetchApi(USER, submitProblemTicket, payload), restaura el botón en respuesta/error y conserva los campos si falla.
- El payload contiene userId, nombreUsuario, authRole, areaFuncion, seccionPagina, tipoApp, versionGlobal, descripcion y resultadoEsperado. No incluye sessionToken/authToken/token.

### Contrato de API y backend
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, fetchApi (39-58) recupera currentUser, agrega requesterUserId/requesterRole y serializa el payload. No adjunta la credencial de sesión.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - getUserVerifiedRole (1146+) exige sessionToken/authToken/token firmado y devuelve NO_ACCESS cuando falta.
  - validateRolePermission (1253-1294) llama al verificador antes de su allowlist especial que incluye submitProblemTicket/getProblemTickets/replyProblemTicket.
  - doPost (1351+) devuelve AUTH_PERMISSION_DENIED antes de entrar al switch cuando la identidad no puede verificarse.
  - submitProblemTicket (400-468) valida longitud mínima de ambos campos, obtiene TicketsReporteProblemas/HistorialMensajesTickets, agrega filas y devuelve ticketId si llega a ejecutarse.
- Como el frontend no adjunta token y fetchApi no lo inyecta, la petición observada es rechazada antes de ejecutar el handler. La existencia del appendRow no demuestra que el flujo UI registre reportes. No se ejecutó una llamada real ni una escritura productiva.

## Reconciliación con hallazgos y tareas
- **AUD-NG-001 (CRÍTICO):** token de sesión generado/almacenado y transmitido en todas las llamadas protegidas. El fetchApi actual sigue sin propagarlo. Ya está pendiente en Pendientes.md.
- **AUD-NG-128 (CRÍTICO):** validateRolePermission omite matriz/contexto para acciones de tickets; getProblemTickets y replyProblemTicket confían en payload.userId y submitProblemTicket registra userId del cliente. Ya está pendiente y cubre IDOR/suplantación/filtrado.
- **TASK-484 / AUD-NG-187:** UX-08 debe probar validación, envío válido, confirmación simulada, error, rechazo de red, reactivación y conservación de datos. Sigue siendo la tarea de pruebas conductuales.
- TASK-279 cubre clasificación automática/SLA, no sustituye las brechas de autenticación y flujo aquí observadas.
- No se crea AUD-NG ni TASK duplicada y no se modifica Pendientes.md.

## Dictamen por criterio
- Acceso discreto y formulario: **PARCIAL** (existe botón/modal compartido; no se probó ejecución visual).
- Descripción comprensible y validación: **PARCIAL/CÓDIGO PRESENTE** (frontend y backend aplican mínimo de 20 caracteres; sin prueba runtime).
- Envío autenticado desde UI: **FAIL** (no se transmite token requerido).
- Persistencia real desde el flujo UI: **FAIL / NO ACREDITADA** (el handler persiste, pero la petición queda rechazada antes de alcanzarlo).
- Seguimiento y seguridad de tickets: **FAIL** por AUD-NG-128 (ID cliente no verificado y riesgo de acceso cruzado).

## Pruebas y límites
Ejecutado: inspección estática/manual del UI, payload, fetchApi, verificación de token, validateRolePermission, doPost, handler y backlog.
No ejecutado: navegador/DOM, envío HTTP, Apps Script, Google Sheets, confirmación de ticket productivo ni suites automatizadas.

## Cierre
T-UX-23: **NO CUMPLE**. Se reutilizan AUD-NG-001, AUD-NG-128 y TASK-484; sin tareas nuevas. Código/tests, completadas.md, Pendientes.md, METODOLOGIA_DESARROLLO.md y ChangesLogs.txt sin modificaciones. Progreso 64/183; 119 pendientes. Siguiente: T-UX-24 - Normalizar las acciones, los estados y la jerarquía visual institucional.
