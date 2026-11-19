# AUDITORÍA TASK-638 — C1.293
Fecha: 2026-11-09 UTC
Sesión: IMA-EXEC-20261109-1108Z-01
Rama: NG_beta_0.0.0.1_work
HEAD auditado de partida: 32b8f5884dd24dbeaf1a3bf028eb7635ada592df
Tree de partida: c9f71078e20b8fc97bd68d6f47a5f06e41a9a2e0
Tarea: TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo.
Fase: PM-00 — inventario, triage y resolución de dependencias.

## Alcance y cobertura
- CSS: 6/6 archivos leídos y referencias locales contrastadas contra el tree.
- Apps Script: 6/6 archivos leídos estructuralmente; inventariados dispatchers, permisos, secretos, llamadas entre servicios y principales accesos a persistencia.
- JSON: 27/27 archivos parseados; 24 bancos locales de QuizPro, un banco legado adicional, manifest y metadatos de pruebas.
- Se cruzaron 211 llamadas literales fetchApi de los controladores de cinco servicios con sus dispatchers. Las acciones literales encontradas tienen caso de despacho; los wrappers de js/api.js se verificaron por separado y revelaron rutas sin implementación.
- No se inspeccionaron exhaustivamente todos los cuerpos de los cientos de handlers GS ni se verificaron deployments externos. La cobertura de esta iteración es estructural y estática, no certificación de funcionamiento.

## 1. CSS — 6/6
Archivos:
- II_BTP_A/Informatica_Aplicada_I/estilos.css — SHA acca4ccb48272371c00a021e6a6b9a1b7cc80e91.
- II_BTP_A/analisis_diseno/estilos.css — SHA e683cce78aea4db4af5041c841ab50e734349a5c.
- Informatica_I/estilos1.css — SHA 80641860eefef80aa3124a2acfac8f694b5268b3.
- Informatica_I/fullscreen_styles.css — SHA b2a9107d9949a4502f0c9dfc303cf527e3269571.
- Informatica_I/presentacion_estilos.css — SHA 7f283f9d3fb5537a0ba00f6f0099f69c7da0cf93.
- css/style.css — SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6.

Las referencias CSS absolutas /imagenes/fondo_xp.jpg y /imagenes/windows_logo.png resuelven desde la raíz del sitio y ambos destinos existen. Los estilos de análisis/diseño no contienen recursos locales. No se encontró un nuevo destino CSS roto en esta pasada. La discrepancia de Service Worker ya registrada como AUD-NG-354 permanece: sw.js:13 precarga css/styles.css, mientras el archivo versionado es css/style.css. manifest.json apunta a imagenes/new-generation-logo.png, recurso existente.

## 2. Apps Script — dispatchers, permisos y persistencia
Inventario de casos de despacho:
- USER: 182 casos.
- ACADEMIC: 241 casos.
- TASK: 44 casos.
- EXAM: 38 casos.
- ACCOUNTING: 240 casos.
- DEVELOPER: 39 casos.

El cruce de llamadas literales de los controladores con USER, ACADEMIC, TASK, EXAM y ACCOUNTING no encontró nombres de acción inexistentes. No se encontró una llamada literal fetchApi dirigida a DEVELOPER; js/developer.js utiliza USER para logs/respaldos/mantenimiento y ACADEMIC para exportación.

### Contratos frontend sin dispatcher
AUD-NG-358 — MEDIO/P2:
- js/developer.js:311 invoca getBackupsList; js/api.js:298 dirige a USER:getBackupsList.
- js/developer.js:414 invoca restoreBackup; js/api.js:303 dirige a USER:restoreSpreadsheetBackup.
- js/developer.js:478 invoca runMaintenance; js/api.js:310 dirige a USER:runSystemMaintenance.
- js/developer.js:523 invoca exportSchoolYearArchive; js/api.js:336 dirige a ACADEMIC:exportSchoolYearArchive.
- Ninguna de esas cuatro acciones tiene caso en el dispatcher correspondiente. Los defaults USER:1601 y ACADEMIC:965 responden acción no reconocida; el panel no puede completar esos flujos con el contrato actual.
- Otros wrappers declarados en js/api.js sin dispatcher encontrado: recordStructuredLog, createSpreadsheetBackup, createOrUpdateStudyGuide, getStudyGuides, toggleStudyGuideStatus y recordStudentAttendance. No se encontró consumidor directo de todos ellos en los controladores examinados; distinguirlos de las cuatro rutas activas del panel.

### Casos que invocan handlers inexistentes
AUD-NG-359 — ALTO/P1:
- USER:1463–1466 despacha purgeSecurityCaches, dispatchSecurityEvent, processSecurityEventQueue y getSecurityEventsQueue, pero no existe declaración de esos handlers en el archivo.
- manageAccountState (USER:2350 aprox.) escribe el nuevo estado en Usuarios y registra el cambio; después llama dispatchSecurityEvent (USER:2377). Al no existir el handler, la llamada lanza ReferenceError después de la escritura y el doPost puede devolver error aunque el cambio ya haya persistido. Riesgo de resultado ambiguo y reintentos.
- ACADEMIC:714 despacha generateInstitutionalReport sin función declarada.
- TASK:411 despacha generateAcademicArchiveZip sin función declarada.
- Los otros casos de los dispatchers revisados sí tienen una función declarada bajo el patrón function name(...); la revisión no sustituye pruebas de ejecución.

### Permisos y fronteras
- Se confirma AUD-NG-082 en DEVELOPER: doPost:145–180 usa payload.authRole cuando no hay token. ROLE_PERMISSIONS asigna Administrador:["*"]; por tanto authRole:"Administrador" satisface el control de permisos sin una sesión verificada. El riesgo es de código; no se verificó deployment activo.
- Se confirma AUD-NG-084: getAuthTokenSecret deriva un fallback determinista de SHA-256(SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET") cuando falta AUTH_TOKEN_SECRET. La fórmula aparece en USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER. Los cinco primeros comparten el mismo SPREADSHEET_ID literal; DEVELOPER usa un identificador placeholder. No se puede leer Script Properties desde este análisis, así que no se afirma que la clave esté ausente en producción.
- Se confirma AUD-NG-002 y se amplía: TASK:85 declara públicas consultas sensibles; validateRolePermission retorna autorizado antes de verificar token. getStudentTasks acepta payload.userId y devuelve estado, calificación, comentario, fileId y mimeType de la entrega; getAllStudentProjects enumera alumnoNombre y fileId; loadProject hace fallback a DriveApp.getFileById(fileId) sin comprobar propiedad; getPosts confía en authRole del payload para mostrar borradores y publicaciones programadas.
- USER, ACADEMIC, TASK, EXAM y ACCOUNTING declaran el mismo Spreadsheet ID literal. DEVELOPER mantiene SPREADSHEET_ID placeholder y SERVICE_URLS conserva un endpoint placeholder. La separación efectiva de despliegues/cuentas no queda acreditada.
- La única salida server-to-server detectada es USER:delegateToTaskService (línea 7946); envía JSON plano {action,payload} mediante UrlFetchApp, sin sobre HMAC. Se mantiene el alcance de AUD-NG-083.

### AUD-NG-356 — ALTO/P1 — Lectura de evaluaciones de cualquier estudiante sin sesión verificada
EXAM:75 incluye getStudentExams y getAllExams en PUBLIC_ACTIONS. validateRolePermission (EXAM:207) autoriza esas acciones antes de verificar token. getStudentExams (EXAM:1057–1095) toma userId del payload cuando no hay _verifiedUserId y devuelve datos de la entrega, incluida calificación y comentario. La consulta puede dirigirse a otro estudiante. Deployment no verificado; riesgo condicionado a que el Web App esté accesible.

### AUD-NG-357 — ALTO/P1 — Borradores de admisión públicos y modificables por clave basada en email
ACADEMIC:265 incluye saveAdmissionDraft y getAdmissionDraft en PUBLIC_ACTIONS. saveAdmissionDraft (1433) usa draftKey/emailResponsable como userKey y sobrescribe la fila coincidente; getAdmissionDraft (1482) devuelve draftData por la misma clave, sin identidad autenticada. admision.html:689 deriva draftKey del email o identificación y :702 lo envía. Un tercero que conozca/guessée la clave puede consultar o sobrescribir el borrador. No se encontró un consumidor frontend de getAdmissionDraft, pero el endpoint está despachado y es público.

## 3. JSON y QuizPro — 27/27
Los 27 JSON son sintácticamente válidos. De ellos, 24 corresponden a bancos por grado/asignatura/nivel:
- Siete bancos están vacíos ([]): Duodecimo/Diseno_Web/intermedio; Undecimo/Analisis_Diseno/avanzado y basico; Undecimo/Informatica_Aplicada/avanzado; Undecimo/Ofimatica/avanzado y basico; Undecimo/Programacion/avanzado.
- Diez bancos poblados contienen 791 preguntas sin id/ID/PreguntaID: Decimo/Informatica/basico (139/149), Decimo/Informatica/intermedio (50/50), Duodecimo/Diseno_Web/avanzado (215/215) y basico (10/10), Undecimo/Analisis_Diseno/intermedio (60/60), Undecimo/Informatica_Aplicada/basico (42/42) e intermedio (30/30), Undecimo/Ofimatica/intermedio (80/80), Undecimo/Programacion/basico (10/10) e intermedio (155/155).
- AUD-NG-360 — MEDIO/P2: config.js:872 genera un id aleatorio bank_... cuando falta identificador. quizpro.js:678 conserva ese fallback; las claves generadas cambian entre cargas y afectan quizpro_seen_questions, quizpro_reinforcement y el campo preguntaId enviado a analítica (quizpro.js:1049–1055, 1087, 1111–1131). La trazabilidad y el refuerzo no conservan una identidad estable.
- QuizPro carga el banco local según grado/asignatura/nivel (quizpro.js:601–642). Si el array está vacío, startQuiz muestra “No hay preguntas disponibles para estos criterios” y recarga la página (quizpro.js:478–482); no hay fallback a otro banco.
- js/questions-bank.json contiene 771 registros sin ID estable, pero no se encontró referencia directa a ese archivo en los 21 JS ni en los documentos HTML revisados; se clasifica como recurso legado/sin consumidor identificado, no se suma a los 791 bancos locales.
- manifest.json es válido y su icono existe; test-results/.last-run.json es metadato de pruebas.

## 4. Seguridad de recuperación de contraseña
AUD-NG-361 — CRÍTICO/P0 condicionado a configuración:
- USER:9 define SECRET_KEY como Script Property o el literal conocido IMA-PORTAL-DEVELOPMENT-KEY-UNSECURE.
- requestPasswordRecovery (USER:2620) firma el token de recuperación con SECRET_KEY; resetPassword (USER:2634) valida esa misma firma y actualiza la contraseña.
- Ambas acciones están en PUBLIC_ACTIONS. Si SECRET_KEY no está configurada en Script Properties, el valor de fallback permite fabricar tokens de recuperación para un userId arbitrario dentro de la ventana de expiración. No se pudo consultar Script Properties ni probar el deployment; no se afirma explotación activa.
- Requiere eliminar el fallback, fallar cerrado si falta secreto, rotar la clave y revisar/inutilizar tokens emitidos con el valor conocido.

## Tareas derivadas
- Ampliar AUD-NG-002 existente con el bypass de TASK y sus datos/archivos expuestos; no duplicar.
- Ampliar AUD-NG-082 y AUD-NG-084 existentes con la evidencia actual de DEVELOPER y la fórmula de fallback de los seis servicios.
- TASK-685: proteger lecturas de evaluaciones por identidad/relación verificada (AUD-NG-356).
- TASK-686: proteger lectura/escritura de borradores de admisión (AUD-NG-357).
- TASK-687: reparar los cuatro contratos activos de respaldo/mantenimiento/exportación sin dispatcher (AUD-NG-358).
- TASK-688: implementar o retirar de forma coherente los seis handlers inexistentes y asegurar atomicidad de manageAccountState (AUD-NG-359).
- TASK-689: asignar IDs estables y resolver los siete bancos vacíos (AUD-NG-360).
- TASK-690: eliminar la clave de fallback de recuperación de contraseña y endurecer el ciclo de tokens (AUD-NG-361).
- Ampliar TASK-678 con la matriz de CSS/GS/JSON, dispatchers, permisos, persistencia y límites de deployment.

## Dictamen y límites
TASK-638 permanece En ejecución. Se completó la primera pasada estructural de CSS/GS/JSON y el cruce de acciones literales, pero falta inspección exhaustiva de handlers, trazado por acción hasta cada hoja/archivo persistido, autorización contextual y verificación de deployments reales. No se modificó código, configuración, endpoints ni datos. No se ejecutaron pruebas runtime, Apps Script, HTTP, Drive, Sheets, navegador ni E2E.