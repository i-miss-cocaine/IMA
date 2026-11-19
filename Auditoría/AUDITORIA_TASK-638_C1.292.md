# AUDITORÍA TASK-638 — C1.292
**Tarea:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo  
**Sesión:** IMA-EXEC-20261109-0430Z-01  
**Fecha:** 2026-11-09 UTC  
**Fase:** PM-00 — inventario, triage y resolución de dependencias  
**Repositorio/rama:** i-miss-cocaine/IMA — `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `3694b763b78a1d400a4564dddcb6ebd3c0108ce9`  
**Checkpoint anterior:** C1.291  
**Estado:** inventario estático de JavaScript inspeccionado; TASK-638 global continúa En ejecución.

## 1. Alcance
Se inspeccionaron los 24 archivos con extensión JS del tree:
- 21 scripts de aplicación en `js/`.
- `sw.js` (Service Worker).
- 2 scripts de pruebas de regresión bajo `tests/regression/`.

No se encontraron declaraciones ES module `import`/`export` en los 24 archivos. La integración usa scripts clásicos, declaraciones globales y propiedades de `window`; por tanto, el orden de carga HTML y la disponibilidad de globals constituyen contratos implícitos. Se identificaron llamadas API literales en USER, ACADEMIC, TASK, EXAM y ACCOUNTING. No se encontró una llamada frontend literal dirigida a DEVELOPER, aunque el servicio sí está declarado en la configuración.

## 2. Inventario de JavaScript

| Archivo | SHA | Rol / dependencia principal observada |
|---|---|---|
| `js/accounting.js` | `a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7` | Dashboard de contabilidad; 26 llamadas ACCOUNTING; publica funciones globales para inventario, almacén, activos, biblioteca y mantenimiento. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | Transporte central `fetchApi`; consume SERVICE_URLS, sesión local, fetch/AbortController y opcionalmente PersistenceManager; expone health checks y wrappers. |
| `js/auth.js` | `8444dd085a3186106d2db7005b61ef934d3c22d8` | Login/registro; USER loginUser/registerUser/getGameStats/mergeGuestData; sesión y migración de datos invitados en localStorage. |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` | SERVICE_URLS, SERVICE_REGISTRY, catálogos, GLOBAL_SCOPE, sanitizador técnico y syncAcademicScope. |
| `js/data.js` | `6b3d5d654f56af320a8bf2acd6a4b77c0c6fd713` | Catálogos y recursos globales; no tiene llamadas fetchApi. |
| `js/destreza_teclado.js` | `69b7cc5ba93e75583bdbc53f875be24a3741048c` | Controlador de juego; DOM, eventos, sesión local y funciones globales de inicialización. |
| `js/developer.js` | `6fa4c4bd9be580c974b1fbede4f0cf79485dc331` | Consola de desarrollador; consulta USER/getStructuredLogs y usa health check, backups y mantenimiento expuestos por api.js. |
| `js/exam.js` | `5189976e4bbbbda7eaa92d89a4ccd500a8604eb0` | Evaluación; EXAM/getExamQuestions y submitExam; USER/recordAnalytics; progreso en localStorage. |
| `js/games-adapter.js` | `4f43a67aa98a14e8d381c29ac585bf5952013a85` | Adaptador de juegos; USER/recordAnalytics, saveGameResult, getGlobalTop, getGameStats; datos invitados/locales. |
| `js/index-ui.js` | `c637535e8cc84f02aa18631bc964ff7ef545722e` | Navegación de recursos, rutas e intención de juego; USER/getNews; carga HTML de juegos y añade scripts/controladores. |
| `js/perifericos_juego.js` | `464deb17403e9aa93e2b126a47f302928ebd8348` | Juego de periféricos; eventos y estado local; no llama fetchApi directamente. |
| `js/persistence.js` | `94ac26feb4f7f31f1f3f2a238e164d23be565d94` | `window.PersistenceManager`; IndexedDB DB v4, stores por módulo, get/reconcile; no red propia. |
| `js/presentation-engine.js` | `049ce26a0d8a13cabb1900e2a0b44c5972c4ebd4` | Motor autónomo de diapositivas/quiz; DOM, history, eventos y `window.PresentationEngine`. |
| `js/quizpro.js` | `da261befd776729ad1e3674e04ad76900f2f0e36` | Quiz adaptativo; USER/getGameStats, getGlobalTop, saveGameResult; carga banco JSON con fetch. |
| `js/results.js` | `07f5595202bf2ab5172e3761715e0855c14f71b3` | Consulta EXAM/getExamResult. |
| `js/secretary.js` | `08a81266957b4c18cc25f8ba6749eac30a8f2c2c` | Secretaría/Coordinación; 34 llamadas ACADEMIC/USER y funciones globales de admisión, eventos, permisos y coordinación. |
| `js/security-minigames.js` | `ab0b0bd0228438e93190848b76c5d0e99907dc63` | Bloqueos de eventos de contexto/selección; se agrega dinámicamente en la carga de juegos. |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` | Portal estudiante/familia; 35 llamadas USER/ACADEMIC/ACCOUNTING/EXAM/TASK; perfil, expedientes, tareas, pagos y comunicaciones. |
| `js/teacher.js` | `c475fce5afcd28fca23e7b64398ad32b17773746` | Portal docente; 125 llamadas fetchApi detectadas; ACADEMIC/ACCOUNTING/EXAM/TASK/USER; planificación, asistencia, tareas, exámenes y administración. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | Funciones comunes globales; 22 llamadas fetchApi; sesión, perfil, modales, historial, navegación y registro del Service Worker. |
| `js/webmaster_quiz_juego.js` | `50c18968c2e192311b332300a5f4508b8635be1f` | Controlador WebMaster Quiz; eventos y funciones globales; no llama fetchApi directamente. |
| `sw.js` | `b031e9d0fdee0686f9bda54ba13b751122de827b` | Service Worker; precarga crítica, cache-first/network fallback y exclusión de Google Scripts. |
| `tests/regression/academic-grading-suite.js` | `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6` | Suite de regresión académica; no se ejecutó en esta auditoría. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Suite de regresión del dashboard modular; no se ejecutó. |

## 3. Grafo de dependencias principales
1. `config.js` publica SERVICE_URLS/SERVICE_REGISTRY, catálogos, GLOBAL_SCOPE y `sanitizarHTMLTecnico`.
2. `persistence.js` publica PersistenceManager sobre IndexedDB.
3. `api.js` define `fetchApi`; depende de SERVICE_URLS, fetch, AbortController, localStorage/sessionStorage y usa PersistenceManager de forma opcional.
4. `ui-common.js` publica UI/sesión/historial y registra `./sw.js` en el evento load.
5. `index-ui.js` consume los globals de navegación y juegos; descarga fragmentos y agrega los scripts de seguridad/controlador.
6. `games-adapter.js` conecta juegos con USER y almacenamiento local.
7. `auth.js`, `developer.js`, `accounting.js`, `secretary.js`, `student.js`, `teacher.js`, `exam.js`, `results.js` y `quizpro.js` consumen fetchApi con sus servicios/acciones declarados.

### Corrección de dirección de dependencia en el mapa
La afirmación histórica `presentation-engine.js -> depende de ui-common.js para sanitización y seguridad` no se confirma en los fuentes actuales: presentation-engine.js no llama a ui-common ni a sanitizarHTMLTecnico; implementa su propio setupSecurity. La referencia observable es opcional y en sentido inverso: ui-common.js consulta `window.PresentationEngine.showSlide` al restaurar un estado presentation-slide en navegación popstate. El sanitizador `sanitizarHTMLTecnico` está definido en config.js. Se documenta la corrección sin reescribir el historial previo.

### Banco de preguntas de QuizPro
`quizpro.js` construye una ruta dinámica `js/Banco_Preguntas/<grado>/<asignatura>/<nivel>.json`, con prefijo `../` cuando se ejecuta bajo `/juegos/`. El tree contiene las carpetas Decimo, Undecimo y Duodecimo, asignaturas y niveles basico/intermedio/avanzado. La existencia de la estructura se comprobó; la resolución para cada combinación de grado/asignatura no se certifica hasta trazar los valores dinámicos y ejecutar las solicitudes.

## 4. Hallazgos nuevos

### AUD-NG-354 — MEDIO/P2 — Service Worker precarga una hoja CSS inexistente
- `js/ui-common.js:19` registra `./sw.js`.
- `sw.js:13` incluye `./css/styles.css` en ASSETS.
- `sw.js:28` ejecuta `cache.addAll(ASSETS)` durante install.
- El tree contiene `css/style.css`, no `css/styles.css`.
- **Impacto:** al fallar una URL de addAll, la promesa de precarga rechaza y el Service Worker no completa su instalación; el funcionamiento offline queda inhabilitado para este registro.
- **Acción:** corregir el asset declarado o proporcionar el recurso correcto; probar instalación limpia y actualización de caché en navegador.
- **Derivación:** ampliar TASK-674/TASK-678.

### AUD-NG-355 — MEDIO/P2 — fetchApi ignora el timeout solicitado por health check
- `js/api.js:209` llama `fetchApi(service, 'ping', {}, 0, { timeout: 6000 })`.
- `js/api.js:36` fija AbortController a 60.000 ms.
- No hay lectura de `options.timeout` en fetchApi.
- **Impacto:** el chequeo de salud puede esperar hasta 60 segundos en vez de los 6 segundos solicitados; puede retrasar el diagnóstico y la respuesta del panel de desarrollador.
- **Acción:** hacer que fetchApi consuma el timeout de options o retirar el parámetro y alinear el contrato del llamador; validar el comportamiento con pruebas.
- **Derivación:** ampliar TASK-678 y coordinar con la tarea existente de contratos/monitoreo; no crear ID duplicado.

## 5. Configuración de servicios y límites
- SERVICE_URLS define USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER. ACCOUNTING y DEVELOPER siguen con URL de apariencia placeholder; ACCOUNTING ya enlaza con AUD-NG-323.
- En los 21 scripts de aplicación se identificaron llamadas literales a USER, ACADEMIC, TASK, EXAM y ACCOUNTING. No se identificó una llamada literal fetchApi a DEVELOPER; developer.js consulta USER/getStructuredLogs.
- No se verificaron deployments, credenciales, permisos efectivos, respuestas HTTP ni handlers de backend.
- El inventario de acciones es parcial hasta relacionar cada llamada con dispatcher, handler, permisos y persistencia en cada Code.gs.

## 6. Dictamen y pruebas
- 24/24 archivos JS inspeccionados estáticamente.
- 0 declaraciones import/export detectadas; integración basada en globals y orden de scripts.
- Se verificaron los principales consumidores/proveedores, el uso de IndexedDB, el cargador de juegos, el banco JSON y el Service Worker.
- No se ejecutaron Node, navegador, HTTP, Apps Script, Drive, Sheets ni E2E. Las suites de regresión no se ejecutaron.
- No se modificó código ni configuración; TASK-638 permanece En ejecución.

## 7. Tareas derivadas
- Ampliar TASK-674/TASK-678 con AUD-NG-354 (ruta de caché ausente) y la trazabilidad de archivos JS.
- Ampliar TASK-678 con AUD-NG-355 (contrato de timeout entre health check y fetchApi).
- Corregir la relación documental de PresentationEngine: ui-common es consumidor opcional, no dependencia directa del motor.
- No crear IDs duplicados.

## 8. Siguiente acción exacta
Inspeccionar los 6 CSS, 6 GS y 27 JSON; después contrastar las acciones frontend contra los dispatchers y handlers de USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER, incluyendo permisos y persistencia en Sheets/Drive. TASK-638 no se cierra hasta terminar ese recorrido.
