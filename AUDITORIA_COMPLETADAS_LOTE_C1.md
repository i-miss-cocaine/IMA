# Auditoría de completadas.md - Lote C1.1

**Fecha:** 2026-11-04  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea revisada:** TAREA-01 (seguridad de los cinco servicios)  
**HEAD de referencia:** 00d0e68fa8b9b28df0ccfd8cc8a0c45abcf62745  
**Inventario fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676

## Dictamen
**TAREA-01: CUMPLE PARCIALMENTE.** Existen controles RBAC/HMAC en servidor, pero el flujo de sesión frontend-backend está desconectado, existen lecturas sensibles que eluden autenticación y se identificó un bypass crítico en el cierre de sesión.

## Evidencia

### 1. Identidad y propagación de sesión
- backend/user-service/Code.gs:2479-2537 (loginUser) genera sessionToken y lo devuelve en el nivel superior y dentro de data.
- js/auth.js:140-165 construye currentUser con userId, rol y datos de perfil, pero no copia result.data.sessionToken.
- js/api.js:45-57 lee currentUser de almacenamiento local y añade requesterUserId/requesterRole; el body solo contiene action y enrichedPayload, no sessionToken.
- Los validadores de USER, ACADEMIC, ACCOUNTING, TASK y EXAM esperan sessionToken/authToken/token y rechazan acciones protegidas sin credencial.
- El contrato de autenticación está incompleto en el cliente. Hallazgo existente AUD-NG-001; no se duplica.

### 2. Autorización y contexto
- USER/getUserVerifiedRole valida un token y deriva _verifiedUserId/_verifiedRole de claims.
- ACADEMIC, ACCOUNTING, TASK y EXAM tienen validateRolePermission con verificación de token y matrices de permisos por rol.
- TASK/PUBLIC_ACTIONS incluye getStudentTasks, getAllTasks, listProjects, loadProject, getAllStudentProjects y otras consultas; EXAM/PUBLIC_ACTIONS incluye getStudentExams y getAllExams. Esas acciones retornan autorización antes de validar token.
- TASK y EXAM limitan el contexto básico de estudiante a su propio ID, pero no aplican el mismo control contextual de relación familiar que USER. Los riesgos de lecturas públicas y alcance están registrados en AUD-NG-002.
- En los verificadores revisados la expiración se comprueba solo cuando claims.exp existe, por lo que la ausencia de exp no se rechaza. Relacionado con AUD-NG-003.
- Los cinco servicios derivan un secreto HMAC determinista de SPREADSHEET_ID si falta AUTH_TOKEN_SECRET. Relacionado con AUD-NG-004.
- La invalidación de estado/sesión usa cachés por servicio; la coherencia transversal está en AUD-NG-005.

### 3. Hallazgo nuevo: logout público y revocación arbitraria
- backend/user-service/Code.gs:920-924 incluye logoutUser en PUBLIC_ACTIONS, que evita validateRolePermission.
- backend/user-service/Code.gs:2456-2475 toma userId/sessionId del payload. La verificación de sessionToken es opcional y, si no hay token válido, no elimina ni sustituye los identificadores aportados por el cliente.
- backend/user-service/Code.gs:2318-2332 revokeUserSession escribe revoked_user_<userId> y revoked_session_<sessionId> durante 21,600 segundos sin validar actor, propiedad ni rol.
- verifySessionToken rechaza los tokens cuyo userId tenga la marca revoked_user_. loginUser crea tokens nuevos pero no limpia la marca.
- Una petición anónima puede revocar las sesiones de un usuario ajeno conociendo su userId y bloquear nuevos tokens en USER durante la vigencia de la marca.
- **Nuevo hallazgo:** AUD-NG-159, severidad CRÍTICA (P0), registrado en Auditoria.txt y Pendientes.md.
- No se duplica AUD-NG-005: ese registro trata la coherencia de revocación entre servicios; AUD-NG-159 trata la falta de autorización del actor que solicita el cierre.

### 4. Otros criterios
- Las matrices RBAC existen, pero son específicas por servicio y conviven con listas de acciones públicas. La uniformidad efectiva no está demostrada.
- La separación entre permisos de aplicación y permisos efectivos de Drive depende de configuración/despliegue y controles por documento. Se relaciona con TASK-085 y TASK-142.
- El código de USER registra eventos estructurados, pero el actor no se deriva uniformemente en todos los handlers. Se requiere revisar la cobertura al auditar las tareas F4 posteriores.
- Los puntos de entrada inspeccionados no acreditan una comprobación de origen/CSRF. AUD-NG-112 cubre una prueba CORS real pendiente, que no equivale a una prueba CSRF.
- La identidad de ejecución y el acceso efectivo del despliegue Apps Script no se pueden confirmar únicamente con el código versionado.
- USER/doPost devuelve err.message en la respuesta de excepción; el requisito de no revelar información interna se relaciona con TASK-418, que también sigue pendiente.

## Referencias de tareas existentes
AUD-NG-001, AUD-NG-002, AUD-NG-003, AUD-NG-004, AUD-NG-005, AUD-NG-112, TASK-085, TASK-142 y TASK-418. El nuevo alcance es AUD-NG-159.

## Resumen
- TAREA-01: cumple parcialmente.
- Hallazgos nuevos: 1 (AUD-NG-159).
- Hallazgos existentes vinculados: 9.
- Archivos de código inspeccionados: USER, ACADEMIC, ACCOUNTING, TASK, EXAM, js/auth.js y js/api.js.
- SHA de respaldo: USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING 38b979d41596b85e888b4a7060b37bbac0840a28; TASK 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM 1d93296628fae31f680004f637897e2b1314a64c; js/auth.js 8444dd085a3186106d2db7005b61ef934d3c22d8; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- Código fuente y completadas.md: sin modificaciones.
- Pruebas dinámicas y despliegue: no ejecutados/no verificables desde este entorno.
- El siguiente registro de la secuencia es FASE2-T01; las tareas F4 deben auditarse individualmente y no se consideran certificadas por esta revisión.
