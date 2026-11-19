# AUDITORÍA TÉCNICA - TAREA-F6-012: Seguridad, aislamiento y gestión centralizada de permisos

- **Sesión:** IMA-AUDIT-20261107-2055Z-01 | **Checkpoint inicial:** C1.228 | **Rama:** NG_beta_0.0.0.1_work
- **HEAD de partida:** 813feb3285747cd73ed6f159e9125559ec45ce0e | **Fecha:** 2026-11-07
- **Estado en completadas.md:** [X] (se conserva como dato histórico)
- **Dictamen:** **NO CUMPLE**
- **Ampliación:** TAREA-F6-037; informe individual: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-037.md.

## 1. Fuentes y continuidad

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2825-2849: F6-012 [X], criterios CA-062..CA-065.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1997-2001: el cierre previo se basó principalmente en validateContextualAccess de ACADEMIC, insuficiente para certificar todos los servicios.
- Pendientes.md: lectura ordinaria 0 caracteres; blob Git de la rama de trabajo SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado: 1.803.672 bytes UTF-8, 1.782.094 caracteres, 20.182 líneas, 0 U+FFFD. F6-012 y F6-037 no aparecen. No se modificó ni restauró.
- No existían informes individuales F6-012/F6-037 en el árbol del HEAD inicial.
- Rama base NG_beta_0.0.0.1 HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; rama de trabajo 296 commits adelante y 0 atrás.

## 2. Archivos inspeccionados

| Archivo | SHA | Funciones/rangos |
|---|---|---|
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | ROLE_PERMISSIONS:27; getAuthTokenSecret:41-51; verifySessionToken:115-143; doPost:145-175; executeOperationalCommand:2388-2414; manageUserMultiRolePermissions:2585-2596 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | PUBLIC_ACTIONS:922-928; generateSessionToken:1065-1083; getUserVerifiedRole:1146-1165; validateContextualAccess/validateRolePermission:1213-1298; savePermissionMatrix:1934-1978; revokeUserSession:2318-2333; logoutUser:2456-2474; loginUser:2479-2535; createPerson/linkPersonAccount:1663-1705; assignRoleScope:9117-9181; scope helpers:9183-9251; getInternalRoleAssignments:9767-9807 |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | PUBLIC_ACTIONS:265; validateContextualAccess:465-523; purgeSecurityCaches:3702-3740; getAcademicAreaCoordinationScope:4321-4349 |
| backend/accounting-service/Code.gs | 38b979d41596b85e8884b7060b37bbac0840a28 | PUBLIC_ACTIONS:218; validateContextualAccess:418-433; validateRolePermission:434-571 |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | PUBLIC_ACTIONS:85-89; validation:209-267; doPost:368-420; getStudentTasks:613-690; getAllTasks:1177-1203 |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c | PUBLIC_ACTIONS:75-78; validation:191-244; doPost:345-400; getAllExams:609-632; getStudentExams:1057-1103; getExamResult:1105-1170 |
| js/auth.js | 8444dd085a3186106d2db7005b61ef934d3c22d8 | login/currentUser:146-159; registro automático:227-239 |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi:11-48 |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | 412 líneas; sin escenarios F6-012, token o IDOR |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | 61 líneas; sin escenarios de autorización |
| developer-dashboard.html / js/developer.js | 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e / 6fa4c4bd9be580c974b1fbede4f0cf79485dc331 | sin UI/handlers manageUserMultiRolePermissions ni assignRoleScope |

## 3. Hallazgos

### H1 - CRÍTICO/P0: DEVELOPER acepta suplantación de rol y tiene fallback de secreto predecible
doPost:145-175 acepta payload.authRole cuando no hay token; ROLE_PERMISSIONS:27 otorga wildcard a Administrador. verifySessionToken:115-143 no exige exp ni comprueba estado/revocación. getAuthTokenSecret:41-51 deriva el fallback de SPREADSHEET_ID y una constante versionada. Si falta AUTH_TOKEN_SECRET, no existe secreto independiente del código.

### H2 - CRÍTICO/P0: TASK y EXAM exponen operaciones privadas en PUBLIC_ACTIONS
TASK:85-89 permite getStudentTasks/getAllTasks; EXAM:75-78 permite getStudentExams/getAllExams. El dispatcher omite la autenticación para esas acciones. getStudentTasks:613-690 y getStudentExams:1057-1103 aceptan identidad/curso del payload si no existe claim verificado; getAllTasks:1177-1203 y getAllExams:609-632 exponen listados globales.

### H3 - CRÍTICO/P0: logoutUser permite revocar sesiones ajenas
USER:922-928 incluye logoutUser en PUBLIC_ACTIONS. logoutUser:2456-2474 conserva userId/sessionId del payload si no hay token válido y llama a revokeUserSession:2318-2333, que escribe marcadores sin comprobar propiedad del solicitante.

### H4 - CRÍTICO/P0: IDOR en getExamResult
EXAM ROLE_PERMISSIONS:79-105 autoriza getExamResult a Estudiante. validateContextualAccess:191-206 solo compara campos studentId/estudianteId/targetUserId/userId. getExamResult:1105-1170 busca por entregaExamenId y devuelve respuesta del alumno, respuesta correcta y calificación sin validar que la entrega pertenezca al usuario del token.

### H5 - CRÍTICO/P0: el frontend descarta el token de sesión
USER loginUser:2479-2535 devuelve sessionToken. auth.js:146-159 y 227-239 no lo conservan en currentUser. api.js:11-48 solo agrega requesterUserId/requesterRole, no sessionToken/authToken/token. Los campos de localStorage no sustituyen claims verificados.

### H6 - ALTO/P1: multirol no está implementado de forma efectiva
generateSessionToken:1065-1083 emite un único role; loginUser toma Usuarios[6]. DEVELOPER manageUserMultiRolePermissions:2585-2596 solo devuelve roles/áreas recibidos. USER assignRoleScope:9117-9181 administra ámbitos, no un conjunto de roles efectivos; no valida roleId contra CatalogoRolesInternos ni integra scopes en todos los servicios. createPerson/linkPersonAccount:1663-1705 no demuestra unicidad Persona-Cuenta. No se encontró UI/handler multirol en el dashboard desarrollador.

### H7 - CRÍTICO/P0: ABAC parcial y fail-open
ACADEMIC validateContextualAccess:465-523 comprueba ámbito solo si llegan scopeType/requestedValue y absorbe excepciones con catch vacío; la comprobación del Coordinador también continúa ante error y solo se activa si llega areaId. ACCOUNTING:418-433, TASK:209-224 y EXAM:191-206 comprueban campos de identidad limitados, no scopes por objeto/área/operación en cada handler. validateRoleScopeAccess no es un guard transversal.

### H8 - CRÍTICO/P0: revocación e invalidación de permisos no se propagan
USER revokeUserSession:2318-2333 escribe marcadores en CacheService del proyecto USER. Los demás microservicios usan cachés de script independientes. savePermissionMatrix:1934-1978 invalida solo la matriz local de USER. ACADEMIC purgeSecurityCaches:3702-3740 elimina revoked_session_ al recibir sessionId, en vez de insertar el marcador. DEVELOPER verifySessionToken no consulta revocación ni estado de cuenta.

### H9 - ALTO/P1: comandos sin permisos específicos y atribución de actor incompleta
DEVELOPER executeOperationalCommand:2388-2414 valida allowlist, pero no permiso individual por comando/ámbito/recurso y devuelve resultado sintético. Algunas rutas USER toman authRole/actor desde payload para registrar atribución; el actor debe derivarse del token verificado. La allowlist evita comandos desconocidos, pero no satisface CA-117.

### H10 - ALTO/P1: no hay pruebas de seguridad que acrediten los criterios
No se encontraron archivos dedicados a auth/RBAC/ABAC/IDOR. Las suites inspeccionadas no incluyen casos F6-012/F6-037, token ausente, spoofing, manipulación de IDs, revocación distribuida ni pruebas directas de backend/navegador.

## 4. Matriz de aceptación F6-012

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-062 autorización server-side por microservicio | No cumple | bypass DEVELOPER, PUBLIC_ACTIONS sensibles y frontend sin token |
| CA-063 múltiples roles sin duplicar identidad | No cumple | claim único, multirol no persistente, scopes no integrados |
| CA-064 impedir acceso a objetos ajenos por IDs manipulados | No cumple | consultas TASK/EXAM públicas e IDOR getExamResult |
| CA-065 revocación inmediata en todas las llamadas | No cumple | cachés separadas, propagación incompleta y DEVELOPER sin revocación |

## 5. Registros existentes ampliados

Sin crear IDs globales duplicados:
- AUD-NG-001: token descartado/no transmitido y logout público.
- AUD-NG-002: consultas TASK/EXAM públicas e IDOR getExamResult.
- AUD-NG-086: permisos por comando.
- AUD-NG-145: trazabilidad/atribución de actores.
- AUD-NG-221/TASK-501: matriz RBAC e invalidación de cachés.
- AUD-NG-222/TASK-502: ABAC fail-open.
- AUD-NG-225/TASK-505: catálogo de roles, scopes y multirol.

## 6. Tareas ejecutables derivadas de los hallazgos

### F6-012-A01 - Cerrar autenticación y firma del microservicio DEVELOPER
- **Origen/severidad:** H1; Crítico/P0.
- **Objetivo/acción:** exigir token firmado, claims obligatorios (userId, role, exp, sessionId, audiencia/servicio), estado y revocación; eliminar authRole del payload y el fallback derivado de IDs públicos; provisionar secreto aleatorio fuera del repositorio.
- **Archivos:** backend/developer-service/Code.gs; emisión/verificación USER; configuración de deployments.
- **Dependencias/riesgos:** HMAC interservicio, rotación de secretos y sesiones existentes.
- **Alcance:** autenticación DEVELOPER/control plane, sin secretos en frontend.
- **Aceptación:** authRole sin token siempre denegado; token inválido/expirado/revocado o sin claims denegado; secreto ausente falla cerrado.
- **Prioridad/estado:** P0 / Pendiente. **Cierre:** pendiente de implementación, pruebas y Code Review.

### F6-012-A02 - Cerrar endpoints públicos sensibles e IDOR en USER/TASK/EXAM
- **Origen/severidad:** H2-H4; Crítico/P0.
- **Objetivo/acción:** reducir PUBLIC_ACTIONS a acciones realmente públicas; retirar logoutUser de esa lista; derivar userId/sessionId del token; validar ownership de tareas, entregas, exámenes y documentos en cada handler, incluido getExamResult.
- **Archivos:** backend/user-service/Code.gs, task-service/Code.gs, exam-service/Code.gs y pruebas.
- **Dependencias/riesgos:** contratos de login/logout, IDs históricos y dashboards.
- **Alcance:** autorización de acciones/objetos, sin alterar datos productivos.
- **Aceptación:** llamadas anónimas no acceden a datos privados; logout solo revoca la sesión propia; IDs ajenos no devuelven resultados ni respuestas; listados globales requieren permiso/ámbito explícitos.
- **Prioridad/estado:** P0 / Pendiente. **Cierre:** pendiente.

### F6-012-A03 - Propagar y conservar el token de sesión en el cliente
- **Origen/severidad:** H5; Crítico/P0.
- **Objetivo/acción:** persistir sessionToken, adjuntarlo en fetchApi, retirar requesterRole como autoridad, adaptar registro y logout y preservar la identidad real al cambiar de contexto visual.
- **Archivos:** js/auth.js, js/api.js, gestión de sesión y wrappers de dashboards.
- **Dependencias/riesgos:** remember-me, almacenamiento, expiración y renovación.
- **Alcance:** transporte de credencial; nunca guardar claves privadas en navegador.
- **Aceptación:** toda llamada protegida envía token; servidor ignora roles/IDs declarados por cliente; expiración/revocación produce rechazo; login/registro/logout conservan identidad.
- **Prioridad/estado:** P0 / Pendiente. **Cierre:** pendiente.

### F6-012-A04 - Implementar identidad institucional única y multirol persistente
- **Origen/severidad:** H6; Alto/P1.
- **Objetivo/acción:** modelo canónico Persona-Cuenta-Roles-Ámbitos; validar unicidad/FK/vigencias; persistir asignaciones; resolver múltiples roles en servidor y construir UI administrativa.
- **Archivos:** backend/user-service/Code.gs, developer-service/Code.gs, demás servicios, dashboards y pruebas.
- **Dependencias/riesgos:** CatalogoRolesInternos, AsignacionesAmbitosRoles, Usuarios y migración.
- **Alcance:** varios roles por una identidad; no conceder privilegios por defecto.
- **Aceptación:** identidad canónica única; roles simultáneos con vigencia/ámbito; cada servicio resuelve permisos desde datos persistidos; revocar un rol no elimina otros.
- **Prioridad/estado:** P1 / Pendiente. **Cierre:** pendiente.

### F6-012-A05 - Aplicar RBAC/ABAC fail-closed por operación y objeto
- **Origen/severidad:** H2/H4/H7; Crítico/P0.
- **Objetivo/acción:** contrato común que valide sujeto, acción, recurso, servicio y ámbito; ownership por ID; scopes por área/asignatura/grado/sección; reemplazar catches permisivos por denegación.
- **Archivos:** backend/academic-service, accounting-service, task-service, exam-service y user-service.
- **Dependencias/riesgos:** matrices, relaciones familiares, coordinación académica, IDs y contratos.
- **Alcance:** autorización server-side; UI no es barrera.
- **Aceptación:** toda acción privada valida token/permiso; toda lectura/escritura valida propietario/ámbito; scope ausente/error deniega; sin wildcard implícito.
- **Prioridad/estado:** P0 / Pendiente. **Cierre:** pendiente.

### F6-012-A06 - Propagar revocaciones e invalidación de permisos por servicio
- **Origen/severidad:** H3/H8; Crítico/P0.
- **Objetivo/acción:** evento de revocación autenticado e idempotente; distribución a servicios; corregir purgeSecurityCaches; invalidar matrices en cada deployment; separar revocación de usuario/sesión/rol/servicio.
- **Archivos:** USER, ACADEMIC, ACCOUNTING, TASK, EXAM, DEVELOPER, eventos y cachés.
- **Dependencias/riesgos:** CacheService por deployment, TTL, colas y disponibilidad parcial.
- **Alcance:** revocar solo el servicio objetivo cuando corresponda.
- **Aceptación:** revocación efectiva antes de otra operación protegida; servicios no objetivo conservan acceso; eventos repetidos no reactivan sesiones; fallos se detectan/reintentan.
- **Prioridad/estado:** P0 / Pendiente. **Cierre:** pendiente.

### F6-012-A07 - Auditar comandos, actores y pruebas de seguridad directas
- **Origen/severidad:** H9/H10; Alto/P1.
- **Objetivo/acción:** permiso por comando/ámbito/recurso; actor desde claims; registrar acción/objeto/decisión/correlationId; sanitizar logs; crear pruebas backend/browser para spoofing, IDOR, revocación, scopes y multirol.
- **Archivos:** backend/developer-service, user-service, demás servicios, tests/regression y dashboards.
- **Dependencias/riesgos:** auditoría inmutable, contratos de logs y entorno aislado.
- **Alcance:** pruebas no destructivas con datos sintéticos.
- **Aceptación:** pruebas negativas por rol/servicio/objeto; spoofing/IDOR bloqueados; logs sin secretos y con actor verificado; comandos no autorizados rechazados; evidencia de navegador y HTTP directo.
- **Prioridad/estado:** P1 / Pendiente. **Cierre:** pendiente.

## 7. Pruebas y límites

- **Ejecutadas:** inspección manual de funciones, dispatchers, matrices, claims, scopes, logout/revocación, UI, suites, SHAs, árbol Git y blob Pendientes.md.
- **No ejecutadas:** Apps Script runtime, HTTP contra deployments, navegador, explotación activa, Sheets/Drive productivos, concurrencia multiusuario ni suites automatizadas.
- No se afirma que una prueba dinámica haya pasado.

## 8. Cierre

- TAREA-F6-012: **NO CUMPLE**; [X] en completadas.md preservado como histórico.
- TAREA-F6-037: **NO CUMPLE**; se reutiliza el bloque canónico F6-012-A01..A07, sin duplicar IDs.
- Sin cambios en código, configuración, datos productivos, completadas.md, Pendientes.md ni ChangesLogs.txt.
- Siguiente auditoría: TAREA-F6-013 y TAREA-F6-038.

## 9. Referencias

completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff. SHAs de código en la tabla de la sección 2.
