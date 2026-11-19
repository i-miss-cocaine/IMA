# AUDITORÍA TASK-638 — C1.290
**Tarea:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo  
**Sesión:** IMA-EXEC-20261109-0413Z-01  
**Fecha:** 2026-11-09 UTC  
**Fase:** PM-00 — inventario, triage y resolución de dependencias  
**Repositorio/rama:** i-miss-cocaine/IMA — `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `57643c473df081aa57cdd8e5def542281f500000`  
**Checkpoint anterior:** C1.289  
**Estado:** auditoría preimplementación parcial; TASK-638 continúa En ejecución.

## 1. Continuidad y alcance
Se verificó HEAD de la rama autorizada contra C1.289. No se reaudita TASK-637. Se amplía la inspección de páginas de aplicación, portales, dashboards, autenticación, políticas, evaluación y juegos. Esta pasada cubre 26 documentos HTML/HTM seleccionados de los 101 detectados en el inventario; no representa el 100% de las páginas ni del repositorio.

Se corrigió la estructura del índice central: la fila C1.289 estaba fuera de la tabla, después de las reglas de mantenimiento. Se reubicó dentro de la tabla de checkpoints y se fijó su SHA de commit publicado.

## 2. Páginas y dependencias inspeccionadas

| Página | SHA del blob | Dependencias locales / controladores y flujo identificado |
|---|---|---|
| `admision.html` | `45b84c80d22d2e8dab75852e65847bae6425db44` | `css/style.css`; `ui-common.js`, `data.js`, `config.js`, `persistence.js`, `api.js`, `student.js`. Llamadas ACADEMIC: `createAdmissionRequest`, `saveAdmissionDraft`, `getAcademicOffers`; estado público vía `getPublicAdmissionStatus`. Borradores locales en localStorage. |
| `dashboard-cafeteria.html` | `12f8c828dd1f8f2c3be34e14d8c9478944c64d04` | `css/style.css`, `config.js`, `api.js`, `ui-common.js`; no se encontró controlador departamental, llamada API ni script inline de carga en el documento. Los contenedores de menú/cocina muestran placeholders. Pendiente confirmar si es vista deliberadamente estática o integración incompleta. |
| `dashboard-contabilidad.html` | `b7653b3bff71829f0f67cf47cb894413c56a444a` | `config.js`, `api.js`, `ui-common.js`, `accounting.js`; navegación a Dirección, Tienda y Cafetería. |
| `dashboard-coordinacion.html` | `08de8e4eb150ee9f6aad536ca08e8f76f2e0e896` | `config.js`, `api.js`, `ui-common.js`, `secretary.js`; DOMContentLoaded llama `window.initCoordinatorDashboard()` si está disponible. |
| `dashboard-direccion.html` | `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` | `config.js`, `api.js`, `ui-common.js`, `secretary.js`, `teacher.js`; enlaces entre Dirección, Contabilidad, Secretaría, Tienda y Cafetería. |
| `dashboard-recursos-humanos.html` | `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee` | `config.js`, `api.js`, `ui-common.js` e inicialización inline. Se identificaron 25 invocaciones ACCOUNTING en el HTML, entre ellas `createEmployeeRecord`, `manageInterviewSchedule`, `calculatePayrollPeriod`, `managePerformanceEvaluation`, `manageTrainingCourse`, `manageLaborIncident`, `getEmployeeRecords` y consultas de historial. Depende del endpoint ACCOUNTING declarado en config, cuya condición placeholder ya está en AUD-NG-323; no se afirma que el destino esté desplegado. |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | `config.js`, `persistence.js`, `api.js`, `ui-common.js`, `secretary.js`; control de sesión en localStorage/sessionStorage, redirección a `login.html`, carga de lista de admisiones. |
| `dashboard-tienda.html` | `60fb5c399b527f7d3a6e764332d8496e17643d5c` | `css/style.css`, `config.js`, `api.js`, `ui-common.js`; no se encontró controlador departamental, llamada API ni script inline de carga en el documento. Los contenedores de catálogo/stock muestran placeholders. Pendiente confirmar su estado funcional. |
| `developer-dashboard.html` | `2b69f1bf7ffbbe4902e81de14d6315cedb035a1e` | `js/config.js`, `js/api.js`, `js/developer.js`; `developer.js` invoca USER/`getStructuredLogs`. Declara `css/custom.css`, ruta que no existe en el árbol Git. |
| `exam.html` | `ca6a7e880c0c63e4d7fe18991612560734a39dcd` | `config.js`, `persistence.js`, `api.js`, `games-adapter.js`, `ui-common.js`, `exam.js`; EXAM/`getExamQuestions` y `submitExam`, además de USER/`recordAnalytics`. |
| `forgot-password.html` | `23076c8ef1d90edf43da2c57e9829125aca908d3` | `config.js`, `persistence.js`, `api.js`, `ui-common.js`; USER/`requestPasswordRecovery`. |
| `login.html` | `3b2e1e8d12a90552ac7b7d584294463a3e8e8f15` | `config.js`, `persistence.js`, `api.js`, `games-adapter.js`, `ui-common.js`, `data.js`, `auth.js`; `auth.js` consume USER/`loginUser`, `getGameStats`, `mergeGuestData`. |
| `politica-de-privacidad.html` | `8854bae3021e1cdde288709e3fa411b3d6da20c7` | `config.js`, `api.js`; sesión en localStorage/sessionStorage; ACCOUNTING/`getPolicyAcceptances` y `recordPolicyAcceptance`. |
| `politica-de-uso.html` | `ca252904e9f7ad7301d1793ed07585a92a4c060f` | `config.js`, `api.js`; ACCOUNTING/`getPolicyAcceptances` y USER/`acceptLegalDocument`. |
| `politica-financiera.html` | `bb75dc6b72098b825a18025781346b4252fe33cf` | `config.js`, `api.js`; ACCOUNTING/`getPolicyAcceptances` y `recordPolicyAcceptance`. |
| `pseudocode.html` | `9b882d70755dc89b000390990852a03407c6973a` | `config.js`, `persistence.js`, `api.js`; USER/`getStudents`; TASK/`saveProject`, `listProjects`, `loadProject`, `deleteProject`; sesión/identidad en localStorage. |
| `register.html` | `e4ed1b11ac434a2e5badcd73363b10fa1438a6ff` | `ui-common.js`, `data.js`, `config.js`, `persistence.js`, `api.js`, `auth.js`; el controlador delega USER/`registerUser`. |
| `reset-password.html` | `bf3a0554747611e518ba1eed9ca012a0f2a1de72` | `config.js`, `persistence.js`, `api.js`; token de query string; USER/`resetPassword`; redirección a login. |
| `results.html` | `a8dc15e9aec091eb3d6490b9b073ace48fcc72c5` | `persistence.js`, `api.js`, `config.js`, `ui-common.js`, `results.js`; EXAM/`getExamResult`. |
| `student-dashboard.html` | `6379ea0ed39d71b89747a0280bb925fdf12202c1` | PDF-lib CDN, Chart.js CDN, `config.js`, `persistence.js`, `api.js`, `games-adapter.js`, `ui-common.js`, `data.js`, `student.js`; perfil, voucher y entregas en formularios. |
| `teacher-dashboard.html` | `cbb9e6a272a7d8ad33f99727303305d950533e71` | SheetJS, Quill, Chart.js y Tailwind CDN; `css/style.css`; `config.js`, `persistence.js`, `api.js`, `games-adapter.js`, `ui-common.js`, `data.js`, `teacher.js). Formularios de tareas, exámenes, caja, parámetros, inventario, proveedores y noticias. |
| `interactivo.html` | `56df0513897983217a1a5b6883e5fdafcfd4e4ed` | `css/style.css`, Tailwind, Google Fonts y Font Awesome CDN; lógica de teclado/ejercicios inline; no se identificaron llamadas fetchApi en la pasada. |
| `juegos/destreza_teclado.html` | `226ab2076523f4f451be970ce3a8ed59c93e6f13` | Rutas relativas correctas desde `juegos/`: `../js/config.js`, `persistence.js`, `api.js`, `security-minigames.js`, `games-adapter.js`, `destreza_teclado.js`. |
| `juegos/perifericos.html` | `be5b685051c6ffc65896573a3564e5e2e3a98fad` | Fragmento HTML consumido por el cargador de juegos; no es una página autónoma. |
| `juegos/quizpro.html` | `461458681e194911024be020905c37df87efcf8a` | Tailwind browser CDN, Google Fonts, Font Awesome, Chart.js; rutas `../js/config.js`, `persistence.js`, `api.js`, `security-minigames.js`, `games-adapter.js`, `ui-common.js`, `data.js`, `quizpro.js`. También se usa en el cargador dinámico de juegos. |
| `juegos/webmaster_quiz.html` | `57dc7caae2080da1187da70bc238b970b026dbf` | Fragmento HTML consumido por el cargador de juegos; no es una página autónoma. |

## 3. Flujos dinámicos de juegos y aclaración de rutas relativas
`js/index-ui.js` SHA `c637535e8cc84f02aa18631bc964ff7ef545722e`:
- `triageGameLaunch`: líneas 358–398; consulta currentUser, conserva la intención de juego en localStorage y redirige a `login.html` si corresponde.
- `loadGame`: líneas 400–453; usa `fetch(htmlPath)`, inyecta la respuesta en `#dedicated-game-overlay` mediante `innerHTML`, agrega explícitamente `js/security-minigames.js` y luego `js/<controlador>`; al cargar el controlador llama a la función de inicialización.
- `loadPeripheralsGame` y `loadWebMasterQuiz`: líneas 455–456, definen los pares HTML/controlador.
- `js/data.js` registra las acciones `load-peripherals-game`, `load-webmaster-quiz`, `load-dexterity-game` y la ruta de QuizPro.

La referencia `js/security-minigames.js` dentro de los fragmentos Periféricos/WebMaster no debe clasificarse automáticamente como ruta rota relativa a `juegos/`: estos documentos se recuperan como texto y se insertan en un documento anfitrión de raíz; el cargador agrega el script de seguridad desde la raíz. La ruta `login.html` del fragmento WebMaster también se interpreta en el contexto del documento anfitrión. Por tanto, esas dos sospechas iniciales se descartan como falsos positivos en este modo de carga. La apertura directa de los fragmentos no se considera un flujo soportado.

## 4. Hallazgo confirmado

### AUD-NG-351 — MEDIO/P2 — Hoja de estilos local declarada inexistente en consola de desarrollador
**Evidencia:** `developer-dashboard.html`, línea 9, declara `<link rel="stylesheet" href="css/custom.css">`. El árbol Git recursivo contiene 1.080 entradas y no contiene `css/custom.css` ni otro archivo `custom.css`. Sí existen `css/style.css` y `js/developer.js`; la hoja declarada no está presente.
**Impacto:** el navegador no puede resolver esa hoja de estilos local; los estilos específicos que dependan de ella no se aplicarán. No se afirma que toda la consola quede sin estilos porque Tailwind CDN y Font Awesome siguen referenciados.
**Causa observable:** referencia local sin destino versionado en el repositorio.
**Acción:** decidir si se crea la hoja, se corrige la ruta hacia una hoja existente o se elimina la referencia si es obsoleta; actualizar pruebas de rutas para detectar este caso.
**Tareas derivadas:** ampliar TASK-674 (validación de rutas reales) y TASK-678 (registro de dependencias y consumidores). No crear una tarea duplicada.

## 5. Observaciones de trazabilidad sin hallazgo confirmado
- `dashboard-cafeteria.html` y `dashboard-tienda.html` cargan solo config/api/ui-common; no declaran controlador propio ni llamadas API y conservan placeholders de datos. Se documenta como hueco de trazabilidad/estado por confirmar, no como defecto funcional confirmado.
- `dashboard-recursos-humanos.html` llama numerosas acciones del servicio ACCOUNTING; la URL configurada tiene condición placeholder documentada por AUD-NG-323. No se afirma que sus acciones alcancen un deployment operativo.
- Los documentos legales consultan ACCOUNTING y algunos registran aceptación en USER. Es necesario conciliar estas acciones con dispatchers y permisos reales en la siguiente etapa de trazado.
- Las páginas de autenticación delegan buena parte del comportamiento a `js/auth.js`; esta pasada identificó llamadas principales, pero no cerró el contrato por campo, validación, handler y persistencia.
- La inspección de HTML por grupos no valida resolución HTTP real, MIME, CSP, carga CDN ni comportamiento del DOM.

## 6. Dictamen y pruebas
- Páginas inspeccionadas en esta pasada: 26.
- Referencia local inexistente confirmada: 1 (`css/custom.css`).
- Sospechas de rutas de los fragmentos de juegos: descartadas como falsos positivos por el mecanismo de inyección y carga explícita.
- Huecos de trazabilidad sin fallo probado: dashboards Cafetería/Tienda y contratos legales/HR ACCOUNTING.
- No se inspeccionaron individualmente los 75 HTML/HTM restantes ni se cerró el inventario completo de JS/CSS/GS/JSON/assets.
- No se ejecutaron Node, navegador, HTTP, Apps Script, Drive, Sheets ni E2E. No se alteró código, rutas ni contratos.
- TASK-638 continúa En ejecución; aceptación global todavía NO CUMPLE.

## 7. Tareas derivadas de los hallazgos de auditoría
- **TASK-674 (ampliación):** incorporar detección de rutas locales declaradas pero ausentes, con resolución desde el documento anfitrión real (incluyendo fragmentos inyectados), y sensibilidad a mayúsculas.
- **TASK-678 (ampliación):** incorporar matriz de las 26 páginas inspeccionadas, cadena de juegos por inyección, dependencias de autenticación/portales/dashboards y AUD-NG-351.
- **Referencias existentes:** AUD-NG-321/322/323 y TASK-665/TASK-662/TASK-671 se mantienen como dependencias; no se duplican.

## 8. Siguiente acción exacta
Continuar inspección por grupos de las páginas HTML/HTM restantes, manteniendo una lista de cobertura con SHA y referencias de cada documento. Después, trazar los módulos JS y hojas CSS hacia funciones compartidas, globals, eventos, API y persistencia; para cada servicio, relacionar acción frontend → endpoint configurado → dispatcher → handler → hoja/Drive y permisos. No iniciar movimientos de archivos ni cambios de contratos hasta cerrar esta matriz.
