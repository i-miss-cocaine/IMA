# AUDITORÍA DE TAREA COMPLETADA - TAREA-F4-P0-01
FECHA: 2026-11-06
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: e7178d4bd02afc4d3ad9fd1f2ae538ccf886504c
RAMA BASE: NG_beta_0.0.0.1
HEAD DE LA RAMA BASE: 44d9891132332e692dbe2ba8602b41f50a508a59
TAREA: TAREA-F4-P0-01 - Unificar la autenticación y autorización de los cinco microservicios
ESTADO EN completadas.md: [X] Completada
CHECKPOINT: C1.72
ID OPERATIVO DE SESIÓN: IMA-AUDIT-20261106-1138Z
INICIO DE SESIÓN: C1.71 (sesión abierta)
================================================================

## 1. Alcance y trazabilidad

La tarea figura en completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, dentro del grupo FASE 4 / PRIORIDAD P0. Declara como componentes backend/user-service/Code.gs, backend/academic-service/Code.gs, backend/accounting-service/Code.gs, backend/exam-service/Code.gs, backend/task-service/Code.gs, js/auth.js y js/api.js. El registro maestro solo contiene título, origen, clasificación, archivos y estado [X]; no aporta criterios de aceptación detallados. El informe de origen AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md citado por completadas.md no se localizó en el árbol actual del repositorio. La revisión se ancla en el registro maestro, el código vigente y los hallazgos AUD-NG-001..005 ya existentes.

## 2. Dictamen

**NO CUMPLE.** El token emitido por USER se descarta en el frontend y no se transmite desde fetchApi; varias operaciones sensibles están en listas PUBLIC_ACTIONS y eluden el validador; la ruta pública logoutUser permite revocación de sesiones con IDs suministrados por el solicitante; la consulta/actualización de borradores de admisión también se expone sin acreditar propiedad; los cinco verificadores no exigen claims.exp y conservan un fallback predecible para el secreto HMAC. Además, las matrices estáticas no comparten una normalización de roles demostrable.

## 3. Evidencia del flujo de autenticación frontend-backend

### 3.1 Emisión del token

**backend/user-service/Code.gs**, SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:

- loginUser, líneas 2479-2545, genera sessionToken mediante generateSessionToken.
- La respuesta incluye sessionToken tanto en el nivel superior como dentro de data.sessionToken.
- El token incorpora claims userId, email, role, accountState, iat, exp y sessionId.

### 3.2 Pérdida del token en el cliente

**js/auth.js**, SHA 8444dd085a3186106d2db7005b61ef934d3c22d8, líneas 138-175:

- Tras loginUser, construye userData con userId, nombre, email, rol, grado, sección, etc.
- No copia result.sessionToken ni result.data.sessionToken a userData.
- Persiste currentUser sin la credencial de sesión.

**js/api.js**, SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 35-58:

- fetchApi recupera currentUser y añade requesterUserId/requesterRole al payload.
- No añade sessionToken/authToken/token al payload ni a un mecanismo de cabecera.
- Los campos requesterUserId/requesterRole no sustituyen claims firmados.

### 3.3 Consecuencia en los cinco servicios

Las funciones validateRolePermission consultan payload.sessionToken/authToken/token y rechazan si no hay credencial, salvo cuando la acción aparece en PUBLIC_ACTIONS. Los puntos actuales de entrada son USER (1253), ACADEMIC (524), ACCOUNTING (434), EXAM (207) y TASK (225). Por tanto, el flujo de autenticación de las operaciones protegidas no está integrado de extremo a extremo.

## 4. Operaciones sensibles que eluden autorización

### 4.1 Revocación arbitraria mediante logoutUser

**backend/user-service/Code.gs**, SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:

- PUBLIC_ACTIONS, línea 922, incluye logoutUser.
- validateRolePermission permite inmediatamente cualquier acción incluida en PUBLIC_ACTIONS antes de comprobar token.
- logoutUser, líneas 2456-2475, toma userId/sessionId directamente del payload. Si hay token válido, solo usa claims para completar los campos ausentes; los IDs suministrados por el solicitante prevalecen.
- revokeUserSession, líneas 2318-2330, escribe revoked_session_<sessionId> y revoked_user_<userId> con TTL de 21600 segundos, sin validar identidad ni autorización del objetivo.
- Resultado estático: una llamada a la ruta pública puede revocar la sesión o todas las sesiones asociadas a un userId elegido por el solicitante. No se ejecutó una petición real contra el deployment; el bypass y la ruta de escritura están demostrados por el código.

Este caso se incorpora a AUD-NG-002 por el mismo origen de autorización omitida en PUBLIC_ACTIONS y se coordina con AUD-NG-005/TAREA-F4-P0-03 para la propagación de revocaciones. No se crea un hallazgo duplicado.

### 4.2 Lectura y modificación pública de borradores de admisión

**backend/academic-service/Code.gs**, SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc:

- PUBLIC_ACTIONS, línea 265, incluye saveAdmissionDraft y getAdmissionDraft.
- validateRolePermission retorna autorizado antes de validar token para esas acciones.
- saveAdmissionDraft, líneas 1433-1478, usa draftKey o emailResponsable como userKey y actualiza un borrador existente si coincide con la clave o el correo.
- getAdmissionDraft, líneas 1480-1510, acepta draftKey o emailResponsable como selector y devuelve draftData completo. No exige token, prueba de posesión de una capacidad opaca ni identidad propietaria verificada.
- Conocer el correo de responsable permite seleccionar el borrador asociado; el endpoint también permite actualizarlo mediante el mismo identificador. No se realizó explotación runtime.

Se amplía AUD-NG-002 para incluir USER y ACADEMIC. Las acciones públicas de creación/consulta pública de admisión deben permanecer limitadas a datos deliberadamente públicos; la lectura/actualización de borradores requiere autenticación o una capacidad aleatoria, limitada y vinculada al borrador.

### 4.3 Consultas sensibles en TASK y EXAM

Persisten los casos ya registrados en AUD-NG-002:

- TASK, SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe, PUBLIC_ACTIONS líneas 85-89: getStudentTasks, getDriveStorageQuotaMetricsReport, getAllTasks, listProjects, loadProject, getAllStudentProjects, getVirtualClassrooms, getPosts y getStudyMaterials.
- EXAM, SHA 1d93296628fae31f680004f637897e2b1314a64c, PUBLIC_ACTIONS líneas 75-77: getStudentExams y getAllExams, además de catálogos de evaluación.
- Los validadores de ambos servicios retornan autorizado antes de verificar claims para las acciones públicas. AUD-NG-002 ya exige retirar consultas sensibles, obtener la identidad de claims y comprobar rol/relación/ámbito.

ACCOUNTING, SHA 38b979d41596b85e888b4a7060b37bbac0840a28, limita PUBLIC_ACTIONS a ping, getInstitutionalPolicies y verifySchoolDocumentByCUV. No se amplía AUD-NG-002 con otra acción contable en esta revisión; los riesgos del CUV se mantienen bajo AUD-NG-059/AUD-NG-061.

## 5. Validación incompleta de expiración en los cinco microservicios

La función verifySessionToken conserva el mismo patrón permisivo en los cinco servicios:

if (claims.exp && now > claims.exp) return null;

Archivos y SHA:

- USER: 12079dd410aa6d8afbce55a4bc62a79dea605f9f, verifySessionToken desde línea 1083.
- ACADEMIC: daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc, desde línea 401.
- ACCOUNTING: 38b979d41596b85e888b4a7060b37bbac0840a28, desde línea 354.
- EXAM: 1d93296628fae31f680004f637897e2b1314a64c, desde línea 127.
- TASK: 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe, desde línea 145.

La condición solo rechaza un exp truthy que ya venció. No exige que exista, que sea numérico ni que tenga una estructura válida; por ejemplo, claims sin exp o con exp no numérico no se rechazan por esta comprobación. AUD-NG-003 ya cubre el defecto y se amplía su lista de archivos a los cinco servicios.

## 6. Secreto HMAC y consistencia de autorización

### 6.1 Fallback de secreto

Los cinco servicios conservan getAuthTokenSecret con el fallback que calcula SHA-256 a partir de SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET" cuando AUTH_TOKEN_SECRET no está configurado, e intenta persistir ese resultado. El código no falla de forma cerrada si falta el secreto aleatorio. Esto mantiene vigente AUD-NG-004. No se inspeccionaron Script Properties ni deployments, por lo que no se afirma si el fallback se está ejecutando en producción.

### 6.2 Deriva de nombres de roles

Las matrices estáticas de USER, ACADEMIC y ACCOUNTING usan la clave "Director"; TASK y EXAM usan "Dirección". El token conserva el valor de role procedente del registro de usuario. getDynamicPermissionsForRole indexa matrix[role] literalmente y validateRolePermission recurre a ROLE_PERMISSIONS[userRole], sin normalizador/alias común visible en estos bloques. Esto puede provocar permisos divergentes según el valor persistido del rol.

La revisión no tuvo acceso a los valores reales de la hoja Usuarios ni a la matriz dinámica desplegada. Se registra como brecha de consistencia a reconciliar con TAREA-F4-P1-03/TAREA-F4-P1-04 y TASK-488; no se crea un ID nuevo en este checkpoint para evitar duplicar el alcance de normalización de roles antes de auditar esas tareas.

## 7. Reconciliación de hallazgos

- **AUD-NG-001:** sigue vigente. El token se emite, pero auth.js lo descarta y api.js no lo transmite. Se amplía la lista de servicios afectados a USER, ACADEMIC, ACCOUNTING, TASK y EXAM.
- **AUD-NG-002:** sigue vigente y se amplía a operaciones sensibles públicas en USER y ACADEMIC: logoutUser/revokeUserSession y saveAdmissionDraft/getAdmissionDraft, además de las consultas TASK/EXAM ya documentadas.
- **AUD-NG-003:** sigue vigente en los cinco servicios; se amplía su lista de archivos a ACADEMIC y ACCOUNTING.
- **AUD-NG-004:** sigue vigente en los cinco servicios; ya cubre la derivación predecible del secreto.
- **AUD-NG-005:** mantiene su alcance de invalidación coherente de cachés y sesiones entre servicios. La autorización del caller de logoutUser se conserva bajo AUD-NG-002; no se duplica.
- **TAREA-F4-P0-02:** cubrirá el alcance más amplio de IDOR y aislamiento de datos; se referencia sin absorberlo.
- **TAREA-F4-P0-03 / AUD-NG-005:** cubre revocación y propagación; se mantiene separado del bypass de autorización de logoutUser.
- **TAREA-F4-P0-04:** cubre registro de intentos y fuerza bruta; no sustituye la autorización de logoutUser.
- **TAREA-F4-P1-03/TAREA-F4-P1-04 y TASK-488:** relacionadas con matriz y normalización de roles; la inconsistencia de nombres queda anotada para su auditoría específica.

No se crean nuevos IDs AUD-NG ni TASK en esta revisión. Se amplían AUD-NG-001, AUD-NG-002 y AUD-NG-003 existentes.

## 8. Pruebas y límites

Inspección estática/manual de los siete archivos declarados, los cinco validadores de microservicio, PUBLIC_ACTIONS, ROLE_PERMISSIONS, loginUser, logoutUser, revokeUserSession, saveAdmissionDraft y getAdmissionDraft. Se cotejaron los hallazgos AUD-NG-001..005 y el backlog actual.

No se ejecutaron llamadas HTTP contra deployments, pruebas de token firmado, pruebas de expiración, acceso multiusuario, revocación real, consulta de Script Properties, validación de secretos, pruebas de roles con datos reales ni suites automatizadas. El árbol de tests solo muestra academic-grading-suite.js y modular-dashboard-suite.js; no se encontró una suite dedicada de autenticación/autorización en tests/regression.

## 9. Estado

- Dictamen: **NO CUMPLE**.
- Progreso de la lista maestra: 69/183 identificadores auditados; 114 pendientes.
- TAREA-F4-P0-01 sigue marcada [X] en completadas.md, pero su implementación no satisface los hallazgos críticos relacionados.
- Próxima tarea oficial: TAREA-F4-P0-02 - Corregir las vulnerabilidades IDOR y garantizar el aislamiento de datos personales.
- Código fuente: sin modificaciones.
- Documentación/backlog: se amplían AUD-NG-001, AUD-NG-002 y AUD-NG-003; no se crean IDs nuevos.
- El informe original de la Auditoría Fase 4 citado en completadas.md no aparece en el árbol actual; esta limitación queda registrada.

================================================================


## Errata C1.74 - clasificación de logoutUser y revocación
La sección 4.1 y la reconciliación de la sección 7 asociaron en C1.72 la ruta logoutUser/revokeUserSession a AUD-NG-002. Esa atribución fue duplicada: el repositorio ya contiene AUD-NG-159, que cubre específicamente el bypass de autenticación y la revocación arbitraria de sesiones, y lo relaciona con TAREA-F4-P0-03. La clasificación correcta es AUD-NG-159/AUD-NG-005; AUD-NG-002 conserva el alcance de consultas TASK/EXAM y borradores de admisión ACADEMIC. El código citado en C1.72 sigue siendo evidencia válida; se corrige únicamente su asignación al hallazgo.
