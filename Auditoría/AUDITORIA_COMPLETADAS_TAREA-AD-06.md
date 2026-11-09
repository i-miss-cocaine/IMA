# AUDITORÍA FUNCIONAL Y DE SEGURIDAD — F8-Task01 / TAREA-AD-06
## Centralizar y verificar la autorización efectiva de cada operación

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-2032Z-02 (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial de continuidad:** C1.254, último checkpoint válido indicado por el usuario. C1.255 no se adopta como válido.
- **Último cierre documental:** C1.260 (auditoría IMP-25).
- **HEAD real auditado:** c35560067eaa838a681c4cab397ec22797d71a2d; **Tree SHA:** 70312df5f19a3bf587a849f611545e263df29037.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **Rama base:** NG_beta_0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; comparación previa a esta iteración: 329 commits adelante, 0 detrás.
- **Estado en completadas.md:** [X] histórico. La marca no acredita cumplimiento.
- **Prioridad declarada:** P1; **severidad observada:** CRÍTICA en rutas públicas con acceso a datos y archivos.
- **Dictamen global:** **NO CUMPLE**.
- **Fuente primaria:** completadas.md, F8-Task01 / TAREA-AD-06, líneas 4760-4798 aprox., SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Informe individual esperado:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-AD-06.md; no existía. Se realizó la auditoría directamente.
- **Plan de Fase 8:** no se localizó un plan de auditoría individual para F8-Task01.

---

## 1. Alcance y criterios de aceptación

La tarea exige que cada solicitud HTTP protegida valide identidad, rol, responsabilidad, acción y ámbito en el servidor; que los IDs/contextos del cliente se contrasten con datos autoritativos; que la autorización falle de forma cerrada; que cambios de responsabilidades/permisos se apliquen inmediatamente; y que los intentos no autorizados y escaladas se registren.

| Criterio | Dictamen | Evidencia |
|---|---|---|
| Requisito 1: identidad, permisos y ámbito en cada solicitud | NO CUMPLE | PUBLIC_ACTIONS y listas de autorización temprana omiten autenticación/RBAC/ABAC para operaciones que acceden a datos; validadores distintos por servicio. |
| Requisito 2: no confiar en IDs/parámetros del cliente | NO CUMPLE | Task acepta IDs y filtros arbitrarios; getPosts confía en authRole del payload; getTeacherActivity no ata profesorId al claim. |
| Requisito 3: denegación por defecto ante configuración no verificable | NO CUMPLE | Validadores ABAC permiten continuar si faltan campos, hoja o lectura; la ausencia/error de matriz dinámica cae a ROLE_PERMISSIONS estático. |
| Requisito 4: invalidación inmediata al cambiar responsabilidades/permisos | NO CUMPLE | Rol del token no se revalida; cachés ScriptCache independientes; purgadores remotos eliminan claves distintas o borran la marca de revocación. |
| Requisito 5: registrar intentos no autorizados y escaladas | PARCIAL | USER y ACADEMIC registran denegaciones estructuradas; TASK solo usa Logger.log y los bypasses autorizados no generan denegación. No hay registro específico verificable de escalada. |
| CA-AD-114: llamadas directas sin autorización rechazadas | NO CUMPLE | TASK acepta acciones sensibles antes de comprobar token; USER permite getAutomationRules a cualquier sesión válida; ACADEMIC omite RBAC/ABAC para seis acciones. |
| CA-AD-115: manipulación de parámetros no amplía el ámbito | NO CUMPLE | IDs de profesor/alumno/archivo y authRole controlados por el cliente afectan el resultado; scopes dependen de campos opcionales. |

## 2. Procedimiento e integridad documental

Se consultaron completadas.md y Pendientes.md; se comprobó que el informe individual no existía; se inspeccionaron manualmente los tres servicios incluidos en el alcance, sus validadores, listas de acciones, handlers, funciones de token, cachés y purgadores; se contrastaron los hallazgos con MapaDependencias.md y tareas ya pendientes; y se revisó la carpeta de pruebas.

### Integridad documental
- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; F8-Task01 aparece [X].
- **Informe individual TAREA-AD-06:** NOT_FOUND antes de esta auditoría.
- **Pendientes.md:** blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado directamente; 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. TASK-496, TASK-501 y TASK-502 siguen pendientes; TASK-633..636 no existían y se incorporan al final del backlog.
- **Pruebas:** tests/regression contiene solo academic-grading-suite.js y modular-dashboard-suite.js; no existe suite específica de autenticación, RBAC, ABAC, IDOR, revocación o F8-Task01.
- **Hallazgos previos:** MapaDependencias.md ya documenta AUD-NG-002, AUD-NG-003, AUD-NG-004, AUD-NG-005, AUD-NG-145, AUD-NG-159, AUD-NG-160, AUD-NG-217, AUD-NG-221 y AUD-NG-222. Se amplían sus evidencias y tareas; no se duplican sus IDs.

## 3. Evidencia técnica

### 3.1 Bypass de autenticación en Task Service — ampliación de AUD-NG-002

**backend/task-service/Code.gs**, SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe:
- PUBLIC_ACTIONS, líneas 85-90, incluye getStudentTasks, getAllTasks, listProjects, loadProject, getAllStudentProjects, getVirtualClassrooms, getPosts y getStudyMaterials, además de métricas de cuota.
- validateRolePermission, líneas 225-280, retorna `{authorized:true}` inmediatamente para PUBLIC_ACTIONS, antes de verificar token, rol, usuario o ámbito.
- **getAllTasks**, líneas 1177-1203 aprox., devuelve todas las tareas si no se envía profesorId; el filtro por profesor es opcional y controlado por el cliente.
- **getStudentTasks**, líneas 613-690, toma userId/grado/seccion del payload cuando no existe _verifiedUserId. En la ruta pública no se construyen claims verificados.
- **getAllStudentProjects**, líneas 1407-1450, recorre el Drive institucional y devuelve nombres de alumnos, grado, sección, nombre de proyecto y fileId sin identidad autenticada ni propiedad comprobada.
- **loadProject**, líneas 1371-1404, busca primero por userId/fileId; si no encuentra coincidencia, ejecuta DriveApp.getFileById(fileId) y devuelve el contenido sin comprobar propiedad del archivo o pertenencia a la carpeta del usuario.
- **listProjects**, líneas 1296-1335, acepta userId del cliente y lista los proyectos asociados a ese ID sin derivarlo de claims.
- **getPosts**, líneas 1526-1560, es público y calcula isTeacherOrAdmin con payload.authRole. Enviar authRole="Administrador" e includeDrafts=true habilita la ruta que incluye borradores, sin rol firmado.
- **getVirtualClassrooms**, líneas 1476-1505, y **getStudyMaterials**, líneas 1632-1663, permiten consultas sin filtro de aula/grado y devuelven el conjunto disponible.
- **getTeacherActivity**, líneas 1119-1168, aunque exige una sesión y está en ROLE_PERMISSIONS de Profesor, filtra por profesorId solo si el cliente lo envía. No fuerza profesorId=_verifiedUserId; omitirlo o manipularlo amplía la consulta a entregas de otros docentes.

La combinación getAllStudentProjects -> loadProject permite enumerar metadatos/fileId y después solicitar contenido de archivos sin una verificación de propiedad.

### 3.2 Bypass RBAC con sesión válida — nuevo AUD-NG-280

**backend/user-service/Code.gs**, SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
- validateRolePermission, líneas 1253-1295, autoriza de forma anticipada una lista de acciones para cualquier rol con token válido, antes de validar contextual access, matriz dinámica o ROLE_PERMISSIONS.
- La lista incluye getAutomationRules.
- **getAutomationRules**, líneas 6584-6605, lee y devuelve todas las reglas/umbrales de automatización sin llamar getUserVerifiedRole ni comprobar un rol administrativo. A diferencia de configureAutomationRules, que sí comprueba Administrador/Desarrollador/Director, la consulta no tiene una guardia equivalente.
- getProblemTickets, getPrivacyRightsRequests, getNotificationAuditLogs, getServiceHealthReport y configureAutomationRules tienen controles internos adicionales observables; esos controles no corrigen la omisión de getAutomationRules.

**backend/academic-service/Code.gs**, SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
- validateRolePermission, líneas 524-583, después de verificar token autoriza anticipadamente getSchoolYearConfigs, getAcademicJornadas, getCurricularDistribution, getInstitutionalActivities, getExtracurricularActivities y getUnifiedInstitutionalCalendar.
- Esa lista evita ROLE_PERMISSIONS y validateContextualAccess. El hallazgo de visibilidad del calendario se conserva en AUD-NG-252; la brecha sistémica se amplía en AUD-NG-222.
- PUBLIC_ACTIONS (línea 265) incluye rutas públicas de admisión y diagnóstico; deben conservarse solo las que tengan un contrato público/capacidad de acceso seguro.

### 3.3 Validación contextual no universal — ampliación AUD-NG-217/TASK-496 y AUD-NG-222/TASK-502

- USER validateContextualAccess, líneas 1213-1250: el aislamiento del estudiante solo compara IDs cuando targetStudentId viene en el payload; el control familiar solo consulta vínculo cuando se envía ese ID. No valida ámbito docente en el validador central.
- ACADEMIC validateContextualAccess, líneas 465-521: la comprobación de ámbito solo corre si el cliente aporta scopeType y requestedValue. Si falta la hoja o está vacía, no deniega; el catch ignora errores y continúa. El control de Coordinador también depende de areaId y captura errores sin denegar.
- TASK validateContextualAccess, líneas 209-223: solo compara un ID de estudiante si llega en el payload; no valida vínculo de Padre/Tutor/Responsable ni asignación/ámbito de Profesor.
- TASK getTeacherActivity demuestra que profesorId no está ligado al usuario autenticado. createTask/createStudyMaterial también reciben profesorId/autorId del payload según el inventario de dependencias ya registrado.
- getDynamicPermissionsForRole, USER 1863+, ACADEMIC 586+ y TASK 283+, devuelve null cuando no existe matriz o falla la lectura; validateRolePermission cae entonces a ROLE_PERMISSIONS estático. No es una denegación cerrada cuando la fuente de permisos no puede verificarse.
- La matriz se interpreta por rol/acción; las dimensiones módulo/ámbito se ignoran, según AUD-NG-221/TASK-501.

### 3.4 Token, rol vigente y secreto — ampliación AUD-NG-003/AUD-NG-004/AUD-NG-160

- Los tres servicios contienen SPREADSHEET_ID literal igual: `1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww`.
- getAuthTokenSecret (USER, ACADEMIC y TASK) usa AUTH_TOKEN_SECRET de Script Properties, pero si falta deriva un valor determinista con SHA-256 de SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET". La propiedad real del deployment no es visible desde el repositorio; no se puede afirmar si el fallback está activo, pero el código permite su uso y no falla cerrado.
- verifySessionToken, USER líneas 1083-1143, ACADEMIC 401-459 y TASK 155-207, solo comprueba expiración si claims.exp es truthy; no exige exp numérico/presente ni exige userId. La consulta de revocación/estado solo corre si claims.userId existe.
- El validador toma claims.role como rol efectivo; no compara el claim con el rol/versión vigente de Usuarios en cada petición. Un cambio de rol no invalida por sí solo un token aún vigente.
- AUD-NG-003 y AUD-NG-004 ya cubren claims incompletos y fallback determinista; AUD-NG-160 cubre la falta de revalidación del rol.

### 3.5 Revocación e invalidación de cachés — ampliación AUD-NG-005/AUD-NG-160

- USER revokeUserSession, líneas 2318-2333, escribe revoked_user_/revoked_session_ solo en ScriptCache del proyecto USER; no se encontró productor/llamada de propagación interservicio.
- El directorio versionado de USER contiene solo Code.gs. doPost enruta dispatchSecurityEvent y purgeSecurityCaches, pero no se localizó definición local de esos handlers. manageAccountState persiste el nuevo estado y luego invoca dispatchSecurityEvent; la referencia no resuelta puede provocar respuesta de error después de la mutación.
- ACADEMIC purgeSecurityCaches, líneas 3702-3745, y TASK purgeSecurityCaches, líneas 1919-1959, operan solo sobre su ScriptCache local.
- Los purgadores remotos eliminan revoked_session_<id> en vez de establecer una marca de revocación; eliminan delegations_<id> aunque los validadores usan active_delegations_<id>; eliminan perm_matrix_<role>/dynamic_perms_<role> aunque getDynamicPermissionsForRole consume dynamic_permissions_matrix.
- USER savePermissionMatrix invalida dynamic_permissions_matrix solo en USER. Los proyectos ACADEMIC/TASK mantienen sus propios ScriptCache; no hay confirmación de invalidación remota.
- USER hasActiveDelegationForAction y los validadores de otros servicios mantienen caché local; la revocación en USER no elimina automáticamente las entradas remotas.

### 3.6 Registro de intentos — ampliación AUD-NG-145

- USER y ACADEMIC registran denegaciones con logStructuredEvent.
- TASK validateRolePermission, líneas 225-280, solo llama Logger.log; doPost devuelve AUTH_PERMISSION_DENIED pero no crea un registro estructurado persistente equivalente.
- Las solicitudes aceptadas por PUBLIC_ACTIONS y las listas de autorización temprana no generan evento de intento no autorizado, aunque permitan acciones que deberían estar protegidas.
- No se identificó un evento específico de escalada de privilegios ni una correlación que conecte intento, actor verificado, recurso objetivo y decisión.

## 4. Dictamen por requisito

| Requisito | Dictamen | Hallazgo principal |
|---|---|---|
| 1. Validación en cada solicitud | NO CUMPLE | TASK PUBLIC_ACTIONS; bypass autenticado en USER/ACADEMIC. |
| 2. Identidad/IDs verificados en base de datos | NO CUMPLE | IDs de usuario/profesor/archivo y authRole del cliente afectan resultados. |
| 3. Denegación por defecto | NO CUMPLE | Scopes opcionales, errores silenciados, fallback estático y rutas públicas sensibles. |
| 4. Invalidación inmediata de permisos | NO CUMPLE | Token no revalida rol; caches aisladas y purgadores con claves erróneas. |
| 5. Auditoría de denegaciones/escaladas | PARCIAL | TASK solo Logger.log; no hay evento persistente uniforme ni registro específico de escalada. |
| CA-AD-114 | NO CUMPLE | Llamadas directas a varias acciones sensibles no requieren token. |
| CA-AD-115 | NO CUMPLE | Manipular userId, profesorId, fileId, authRole, aula/grado/sección o retirar campos de scope puede ampliar acceso. |

**Dictamen global: NO CUMPLE.** La marca [X] de completadas.md se conserva como histórica y no se modifica.

## 5. Hallazgos nuevos y ampliaciones sin duplicación

### AUD-NG-280 — ALTO/P1: lista de autorización temprana permite leer reglas de automatización sin RBAC
USER validateRolePermission autoriza getAutomationRules a cualquier sesión válida y el handler devuelve todas las reglas sin control interno de rol. Es distinto de las rutas públicas sin token ya cubiertas por AUD-NG-002 y requiere guardia explícita.

### Ampliaciones de hallazgos existentes
- **AUD-NG-002:** ampliar el inventario TASK con getPosts, loadProject, getAllStudentProjects, listProjects, getVirtualClassrooms y getStudyMaterials; getPosts confía en authRole del cliente y loadProject devuelve contenido de Drive por fileId sin propiedad. Mantener la exposición de getStudentTasks/getAllTasks y las rutas de admisión ya registradas.
- **AUD-NG-217 / TASK-496:** ampliar la validación de asignación docente a handlers USER y a operaciones equivalentes; TASK-502 cubre el contrato común.
- **AUD-NG-222 / TASK-502:** ampliar con getTeacherActivity, ausencia de controles familiares/docentes en TASK y bypasses de contexto en ACADEMIC.
- **AUD-NG-003:** mantener exigencia de claims completos y expiración obligatoria.
- **AUD-NG-004:** mantener secreto aleatorio de alta entropía, externo al código, con fallo cerrado.
- **AUD-NG-005:** ampliar revocación local, handlers ausentes y purgadores que borran la marca.
- **AUD-NG-145:** ampliar persistencia de intentos rechazados y eventos de escalada en TASK.
- **AUD-NG-159:** conservar logoutUser público y revocación arbitraria de IDs del payload; no crear duplicado.
- **AUD-NG-160:** ampliar rol obsoleto en token y claves de invalidación de caché.
- **AUD-NG-221 / TASK-501:** conservar dimensión módulo/ámbito ignorada por la matriz.

## 6. Tareas ejecutables derivadas de los hallazgos

### TASK-636 — Cerrar bypasses de autorización y proteger las operaciones de tareas/proyectos
- **Origen:** AUD-NG-002 ampliado y AUD-NG-280.
- **Prioridad:** P0 (Crítica).
- **Componentes:** backend/task-service/Code.gs; backend/user-service/Code.gs; backend/academic-service/Code.gs.
- **Acción:** clasificar explícitamente acciones públicas; retirar consultas/modificaciones sensibles de PUBLIC_ACTIONS; exigir token y RBAC para getAllTasks, getStudentTasks, listProjects, loadProject, getAllStudentProjects, getVirtualClassrooms, getPosts y getStudyMaterials; restringir getAutomationRules a roles administrativos; eliminar autorización basada en authRole del payload; derivar userId/profesorId desde claims y verificar propiedad de cada archivo/recurso; mantener solo excepciones públicas documentadas y con capacidades opacas de alta entropía.
- **Criterios:** solicitudes sin token a recursos sensibles fallan; rol de cliente manipulado no cambia respuesta; un docente solo consulta su asignación; un alumno no lista proyectos ajenos; loadProject rechaza fileId ajeno; getPosts no expone borradores por authRole; getAutomationRules rechaza roles no administrativos; tests positivos/negativos de cada ruta.
- **Estado:** Pendiente.

### Tareas existentes que se amplían, sin crear duplicados
- **TASK-496 / AUD-NG-217:** vincular perfiles, tutores y trámites al ámbito docente autenticado.
- **TASK-502 / AUD-NG-222:** centralizar autorización contextual RBAC/ABAC y denegar ante contexto ausente, hoja vacía o error.
- **TASK-501 / AUD-NG-221:** aplicar módulo/acción/ámbito y control administrativo de matriz en los cinco servicios.
- **AUD-NG-003:** exigir exp numérico/presente y claims mínimos.
- **AUD-NG-004:** eliminar secreto HMAC derivado de identificador público.
- **AUD-NG-005:** propagar revocación y estado a todos los servicios con confirmación.
- **AUD-NG-145:** registrar de forma estructurada y persistente intentos y escaladas.
- **AUD-NG-160:** revalidar rol/versión vigente e invalidar cachés coordinadamente.
- **AUD-NG-159:** autenticar propiedad de userId/sessionId en logoutUser.

### Tareas añadidas al backlog en esta iteración
Se incorporan también TASK-633, TASK-634 y TASK-635 derivadas de IMP-25, que estaban documentadas en su informe pero aún no estaban agregadas a Pendientes.md.

## 7. Pruebas y límites
- **Ejecutadas:** inspección estática/manual de los tres servicios, sus rutas, validadores, token, permisos, handlers y purgadores; verificación de SHAs, branch/HEAD/tree; lectura de completadas.md y recuperación íntegra del blob Pendientes.md; búsqueda de informe individual y suites.
- **No ejecutadas:** solicitudes HTTP contra deployments, ejecución de Apps Script, acceso a Script Properties, Drive/Sheets productivos, pruebas con cuentas/roles reales, pruebas de revocación en caliente ni explotación activa. No se accedió a datos personales ni se modificaron recursos productivos.
- **Limitación:** no es posible verificar desde el repositorio si AUTH_TOKEN_SECRET está configurado en Script Properties. El informe distingue el riesgo del fallback en código de su uso efectivo en producción.
- **Pruebas disponibles:** tests/regression/academic-grading-suite.js y modular-dashboard-suite.js; no contienen pruebas específicas de autenticación/autorización/IDOR/F8-Task01.

## 8. Archivos y SHAs de respaldo
- backend/user-service/Code.gs: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs: df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/task-service/Code.gs: 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- tests/regression/academic-grading-suite.js: a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- tests/regression/modular-dashboard-suite.js: 0495e1d526a872c33310935a003a83d924d34683.
- completadas.md: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- Pendientes.md: 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- AUDITORIAS/MapaDependencias.md al inicio: 7a765ebcfc0f5ca961d5daa56e102324496e3a50.
- AUDITORIAS/Auditoria.txt al inicio: 30762d895411d861b8914d65617eef78a0098b42.
- AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md al inicio: 090c8c258d5f4d6036f74e881319d79da7ba4651.
- AUDITORIAS/Contexto_personal.txt al inicio: 96de2c9e593a42dbce95d801cf36ab1f24f35925.
- METODOLOGIA_DESARROLLO.md: cf796728bb384a32537392df2f9c72a339fa03ee.
- HEAD auditado: c35560067eaa838a681c4cab397ec22797d71a2d; tree: 70312df5f19a3bf587a849f611545e263df29037. Rama base: 44d9891132332e692dbe2ba8602b41f50a508a59.

## 9. Cierre
- **F8-Task01 / TAREA-AD-06:** NO CUMPLE; se conserva [X] histórica.
- **Hallazgo nuevo:** AUD-NG-280.
- **Hallazgos ampliados:** AUD-NG-002, 003, 004, 005, 145, 159, 160, 217, 221 y 222.
- **Tarea nueva:** TASK-636.
- **Tareas anteriores incorporadas al backlog:** TASK-633, TASK-634 y TASK-635.
- **Archivos actualizados:** informe individual, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y Pendientes.md.
- **Sin cambios:** código backend, frontend, tests, completadas.md, ChangesLogs.txt, metodología y rama base.
- **Siguiente tarea cronológica:** F8-Task02, «Auditar los archivos existentes y elaborar un inventario de dependencias»; buscar informe individual y auditar directamente si falta.
