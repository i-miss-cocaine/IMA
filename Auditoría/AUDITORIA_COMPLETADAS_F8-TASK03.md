# Auditoría F8-Task03 / TAREA-MOD-04 — Actualización de rutas y dependencias

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2123Z-01 (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial válido:** C1.262.
- **Checkpoint de cierre previsto:** C1.263.
- **Repositorio:** `i-miss-cocaine/IMA`.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `268beddf3573bd9293d4563c3b0bc289a5d1badf`; árbol Git `268beddf3573bd9293d4563c3b0bc289a5d1badf`.
- **Rama base protegida:** `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Tarea de origen:** F8-Task03 / TAREA-MOD-04, marcada [X] en `completadas.md`, línea 4814.
- **Informe individual previo:** no existe `AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK03.md` ni otro informe con identificador F8-Task03/MOD-04 en el directorio de auditorías; se ejecuta la auditoría directamente.
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica [X] sin considerarla certificación técnica.

## 1. Objetivo y criterios de aceptación

Comprobar que, después de la reorganización, las rutas de scripts, CSS, imágenes, fuentes, importaciones, plantillas, navegación y endpoints se actualizaron y resuelven en el contexto de producción.

- **CA-MOD-107:** no existen errores HTTP 404 ni cargas fallidas de scripts o assets en consola.
- **CA-MOD-108:** todos los módulos estáticos y dinámicos se resuelven correctamente en producción.

## 2. Fuentes consultadas y respaldo

| Archivo | SHA de blob | Sección inspeccionada |
|---|---|---|
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | F8-Task03, línea 4814 y bloque siguiente |
| `Pendientes.md` | `676a3f798715f0cdd7d4bc75768472545b8465ee` | Blob íntegro recuperado; búsqueda de F8-Task03/TAREA-MOD-04 |
| `docs/architecture/routing-and-paths.md` | `c64e6a952c1ce12a47cb00a2d324f39cd6581a47` | Líneas 1–28 |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` | Líneas 734–746, diccionario MODULE_ROUTING_DICTIONARY |
| `developer-dashboard.html` | `2b69f1bf7ffbbe4902e81de14d6315cedb035a1e` | Líneas 1–15 |
| `pseudocode.html` | `9b882d70755dc89b000390990852a03407c6973a` | Líneas 1–25 |
| `sw.js` | `b031e9d0fdee0686f9bda54ba13b751122de827b` | Líneas 1–72 |
| `js/teacher.js` | `c475fce5afcd28fca23e7b64398ad32b17773746` | Líneas 2824–2890, flujo de migración |
| `teacher-dashboard.html` | `cbb9e6a272a7d8ad33f99727303305d950533e71` | Botón `btn-migrate-questions` y carga de scripts |
| `css/style.css` | `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6` | Confirmación de hoja existente |
| `manifest.json` | `0caa5febfbd7fdbb88e9d174fa6623fb7daebb4e` | Start URL e iconos PWA |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Líneas 1–61 |

La lectura ordinaria de `Pendientes.md` devolvió 0 caracteres. Se recuperó el blob del HEAD de la rama: 1.786.011 caracteres, 20.224 líneas y 0 caracteres U+FFFD. SHA: `676a3f798715f0cdd7d4bc75768472545b8465ee`. El contenido recuperado no contiene las cadenas F8-Task03, TAREA-MOD-04 ni TASK-640..TASK-644. No se modificó ni restauró una versión histórica anterior. La tarea y su estado se contrastan con `completadas.md`, que la marca [X].

## 3. Inspección de rutas y dependencias

### 3.1 Recursos de la consola de desarrollador

En `developer-dashboard.html`, línea 9, el documento solicita:

- `css/custom.css`

La ruta exacta no existe en el árbol Git. Sí existe `css/style.css`, pero no se asume que sea un reemplazo visualmente equivalente; esa decisión corresponde a la tarea correctiva.

**Resultado:** recurso estático sin destino versionado.

### 3.2 Iconos PWA del simulador de pseudocódigo

En `pseudocode.html`, líneas 10–11, se solicitan:

- `IMA-Logo.png` como favicon.
- `IMA-Logo.png` como apple-touch-icon.

El archivo no existe en la raíz ni en `imagenes/IMA-Logo.png`. El árbol contiene `new-generation-logo.png`, pero no se sustituye automáticamente porque la identidad visual y el recurso correcto deben confirmarse en la corrección.

**Resultado:** dos referencias a un recurso inexistente.

### 3.3 Precarga del Service Worker

En `sw.js`, línea 11, la lista `ASSETS` incluye `./css/styles.css`. En la línea 26 se entrega esa lista a `cache.addAll(ASSETS)`.

El árbol contiene `css/style.css` (singular), no `css/styles.css` (plural). `Cache.addAll` rechaza la operación si un recurso de la lista falla; por tanto, la ruta errónea puede impedir que se complete la instalación del Service Worker y dejar sin efecto la estrategia de caché offline.

**Resultado:** dependencia crítica no resuelta en el precache PWA.

### 3.4 Flujo de migración del banco de preguntas

En `js/teacher.js`:

- Línea 2831: se ejecuta `fetch('migrated_questions.json')`.
- Línea 2883: después de procesar y guardar las preguntas, se ejecuta `fetch('migration_stats.json')`.

Ambos archivos faltan en la raíz del árbol Git. El botón `btn-migrate-questions` existe en `teacher-dashboard.html` y conecta con este flujo en `js/teacher.js`.

El primer archivo ausente bloquea el inicio de la migración desde el repositorio tal como está versionado. Si se aporta externamente el primer JSON, el segundo sigue siendo una dependencia posterior no resuelta y puede provocar que el flujo termine en el bloque `catch` después de haber enviado escrituras al backend, aunque no se ejecutó el flujo real para medir ese efecto.

**Resultado:** dependencias dinámicas no disponibles en el repositorio y sin evidencia de generación/despliegue en la ruta esperada.

### 3.5 Diccionario de rutas y documentación

En `js/config.js`, líneas 734–746, `MODULE_ROUTING_DICTIONARY` define diez destinos: inicio, login, dashboards de estudiante/docente/coordinación/dirección/secretaría/RR. HH./contabilidad y dashboard dinámico. No contiene rutas para varias páginas del árbol, como la consola de desarrollador, tienda, cafetería, admisiones, examen, resultados y pseudocódigo. El bloque inspeccionado es una declaración de objeto; no aporta por sí solo una verificación de existencia o de resolución en runtime.

`docs/architecture/routing-and-paths.md`, líneas 1–28, documenta el catálogo principal y afirma en su sección 3 que todos los HTML cargan scripts y CSS sin 404. No aporta una matriz de comprobación por archivo, resultados de solicitudes HTTP ni capturas/logs de consola que sostengan esa afirmación. La lista de rutas documentadas tampoco incorpora todos los destinos del repositorio.

### 3.6 Cobertura de pruebas existente

`tests/regression/modular-dashboard-suite.js` comprueba existencia de archivos seleccionados, presencia de cadenas en `js/config.js` y existencia de funciones en el servicio de desarrollador. No verifica que cada ruta declarada en HTML/CSS/JS resuelva contra un recurso real, que el Service Worker instale, que el flujo de migración encuentre sus JSON ni que los recursos se carguen en producción.

## 4. Hallazgos y dictamen por criterio

### AUD-NG-284 — Referencias a recursos estáticos inexistentes

- **Severidad:** MEDIO.
- **Archivos:** `developer-dashboard.html:9`; `pseudocode.html:10–11`.
- **Evidencia:** `css/custom.css` y `IMA-Logo.png` no existen en sus rutas solicitadas.
- **Impacto:** carga fallida de hoja de estilos e iconos de aplicación.
- **Criterio:** CA-MOD-107 — **NO CUMPLE**.

### AUD-NG-285 — El precache del Service Worker contiene una ruta inexistente

- **Severidad:** ALTO.
- **Archivo:** `sw.js:11, 21–28`.
- **Evidencia:** `./css/styles.css` no existe; el archivo versionado es `css/style.css`. La lista se pasa a `cache.addAll(ASSETS)`.
- **Impacto:** rechazo de la precarga y posible fallo de instalación del Service Worker; la aplicación pierde la activación esperada del mecanismo offline.
- **Criterios:** CA-MOD-107 y CA-MOD-108 — **NO CUMPLEN** para el flujo PWA afectado.

### AUD-NG-286 — Artefactos JSON de migración no disponibles

- **Severidad:** ALTO.
- **Archivos:** `js/teacher.js:2831, 2883`; botón en `teacher-dashboard.html`.
- **Evidencia:** `migrated_questions.json` y `migration_stats.json` no existen en la raíz del árbol versionado.
- **Impacto:** el botón de migración no puede completar el flujo con los artefactos disponibles en el repositorio; la segunda dependencia puede fallar después de las escrituras si solo se aporta la primera.
- **Criterio:** CA-MOD-108 — **NO CUMPLE**.

### AUD-NG-287 — Diccionario y documentación de rutas sin cobertura integral

- **Severidad:** MEDIO.
- **Archivos:** `js/config.js:734–746`; `docs/architecture/routing-and-paths.md:1–28`.
- **Evidencia:** el diccionario registra diez rutas de entrada/dashboard y no cubre varias páginas existentes; no hay verificador asociado en el bloque inspeccionado. El documento declara que todos los HTML resuelven sin 404, pero no aporta evidencia por archivo.
- **Impacto:** la configuración no sirve como fuente completa de rutas ni demuestra que navegación, plantillas y recursos dinámicos estén alineados.
- **Criterios:** CA-MOD-107 y CA-MOD-108 — **NO CUMPLEN**.

### AUD-NG-288 — No existe evidencia de validación en producción

- **Severidad:** ALTO.
- **Archivos:** `docs/architecture/routing-and-paths.md:25–28`; `tests/regression/modular-dashboard-suite.js:1–61`.
- **Evidencia:** la afirmación de ausencia de 404 no está acompañada de solicitudes HTTP, resultados de consola, prueba de instalación PWA o verificación del despliegue. La suite cubre presencia de archivos/cadenas, no resolución real de todas las dependencias.
- **Impacto:** no puede sostenerse el requisito de que todos los módulos estáticos y dinámicos funcionen en producción.
- **Criterios:** CA-MOD-107 y CA-MOD-108 — **NO CUMPLEN**.
- **Límite:** no se declara que se haya observado una respuesta HTTP 404 real ni se inventan resultados de consola; los destinos ausentes se verificaron contra el árbol Git.

## 5. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-MOD-107 | **NO CUMPLE** | Hay referencias a recursos no versionados y no existe evidencia HTTP/consola de cobertura global. |
| CA-MOD-108 | **NO CUMPLE** | Faltan dependencias estáticas y JSON dinámicos; la resolución en producción no está demostrada. |

## 6. Tareas ejecutables derivadas de los hallazgos

### TASK-640 — Corregir referencias a recursos estáticos de páginas auxiliares

- **Hallazgo de origen:** AUD-NG-284.
- **Severidad:** Medio.
- **Objetivo:** eliminar las referencias a CSS e iconos inexistentes sin introducir cambios visuales no solicitados.
- **Acción ejecutable:** determinar el recurso correcto para `developer-dashboard.html` y el icono de `pseudocode.html`; actualizar la ruta o incorporar el recurso legítimo en la ubicación prevista.
- **Archivos/módulos afectados:** `developer-dashboard.html`, `pseudocode.html`, `css/`, `imagenes/`.
- **Dependencias y riesgos:** identidad visual, hoja de estilos y recursos PWA; no sustituir assets sin verificar su equivalencia.
- **Alcance:** rutas de recursos, no rediseño.
- **Criterios de aceptación:** cada referencia resuelve a un archivo existente con capitalización exacta; comprobación manual de carga de CSS, favicon y apple-touch-icon.
- **Prioridad:** P2.
- **Estado:** Pendiente.

### TASK-641 — Reparar y verificar el precache del Service Worker

- **Hallazgo de origen:** AUD-NG-285.
- **Severidad:** Alto.
- **Objetivo:** garantizar que todos los recursos precargados existen y que la instalación del Service Worker termina correctamente.
- **Acción ejecutable:** alinear la ruta CSS con el archivo real o definir el asset correcto; revisar cada elemento de `ASSETS` individualmente y verificar el ciclo install/activate/offline en navegador.
- **Archivos/módulos afectados:** `sw.js`, `css/style.css`, `manifest.json` y recursos enumerados en `ASSETS`.
- **Dependencias y riesgos:** caché offline, actualización de versión de caché y disponibilidad de recursos críticos.
- **Alcance:** precache y ciclo de vida del Service Worker; no reescribir la estrategia de caché fuera de lo necesario.
- **Criterios de aceptación:** cada URL de `ASSETS` responde correctamente; `cache.addAll` completa; el Service Worker instala, activa y sirve recursos offline sin errores de consola.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-642 — Resolver dependencias JSON del flujo de migración

- **Hallazgo de origen:** AUD-NG-286.
- **Severidad:** Alto.
- **Objetivo:** hacer que la migración utilice una fuente de datos y estadísticas disponible, versionada o generada de forma reproducible.
- **Acción ejecutable:** identificar el proceso legítimo que genera `migrated_questions.json` y `migration_stats.json`; documentar y asegurar sus rutas o sustituir la dependencia por una fuente explícita. Validar que la ausencia de estadísticas no deje al usuario con un resultado ambiguo después de escrituras exitosas.
- **Archivos/módulos afectados:** `js/teacher.js`, `teacher-dashboard.html`, proceso de generación de JSON y servicio ACADEMIC.
- **Dependencias y riesgos:** guardado de preguntas, duplicados en reintentos, reporte de migración y mensajes de estado.
- **Alcance:** resolución de entrada/estadísticas y consistencia del flujo; no ejecutar migraciones sobre datos productivos durante la corrección.
- **Criterios de aceptación:** fuente y ruta disponibles; migración completa con reporte; errores anteriores a escrituras claramente separados de errores posteriores; reintento seguro y verificable.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-643 — Completar la trazabilidad de rutas y navegación

- **Hallazgo de origen:** AUD-NG-287.
- **Severidad:** Medio.
- **Objetivo:** disponer de una referencia consistente de rutas para páginas principales, auxiliares y módulos dinámicos.
- **Acción ejecutable:** contrastar el diccionario `MODULE_ROUTING_DICTIONARY` con las páginas y destinos realmente soportados; incorporar únicamente rutas válidas y documentar los consumidores, navegación y resolución de rutas relativas. No forzar que páginas independientes se conviertan en dashboards.
- **Archivos/módulos afectados:** `js/config.js`, `docs/architecture/routing-and-paths.md`, HTML de navegación y módulos que consumen el diccionario.
- **Dependencias y riesgos:** navegación, deep links, rutas relativas, módulos dinámicos y despliegue bajo subruta.
- **Alcance:** catálogo y trazabilidad de rutas; no renombrar el punto de entrada `index.html`.
- **Criterios de aceptación:** rutas registradas corresponden a destinos existentes; consumidores y parámetros quedan documentados; rutas relativas funcionan tanto en raíz como en páginas anidadas; excepciones se documentan.
- **Prioridad:** P2.
- **Estado:** Pendiente.

### TASK-644 — Verificar manualmente las rutas en el entorno de producción

- **Hallazgo de origen:** AUD-NG-288.
- **Severidad:** Alto.
- **Objetivo:** aportar evidencia empírica para CA-MOD-107 y CA-MOD-108.
- **Acción ejecutable:** ejecutar una revisión manual por página y flujo dinámico en el despliegue real; inspeccionar solicitudes HTTP, consola, carga de scripts/CSS/assets, navegación, imports y endpoints; registrar URL probada, resultado y evidencia reproducible. No sustituir la inspección manual exigida por la metodología con escáneres automáticos.
- **Archivos/módulos afectados:** páginas HTML, `js/`, `css/`, `imagenes/`, `app/html/dashboards/`, `sw.js`, configuración de servicios y `docs/architecture/routing-and-paths.md`.
- **Dependencias y riesgos:** acceso al entorno desplegado, permisos, servicios GAS y configuración de hosting.
- **Alcance:** verificación de rutas y dependencias; no realizar cambios de código durante la auditoría.
- **Criterios de aceptación:** todas las páginas/flows incluidos en el alcance tienen registro de verificación; no hay 404 ni errores de carga; Service Worker instala; módulos dinámicos y endpoints resuelven; cualquier excepción queda documentada y bloquea la aprobación.
- **Prioridad:** P1.
- **Estado:** Pendiente.

## 7. Pruebas, límites y archivos

- **Inspección manual realizada:** tarea marcada en `completadas.md`; rutas declaradas en `routing-and-paths.md`; diccionario de `js/config.js`; cabeceras y referencias de `developer-dashboard.html` y `pseudocode.html`; precache y ciclo de vida de `sw.js`; flujo de migración en `js/teacher.js` y su botón en `teacher-dashboard.html`; suite de regresión y existencia de destinos en el árbol Git.
- **Verificación Git:** rama y HEAD de trabajo; rama base; existencia exacta de rutas y archivos; SHA de fuentes.
- **No ejecutadas:** navegador, HTTP real, consola de producción, despliegue GitHub Pages, Service Worker en runtime, APIs GAS, migración contra Sheets, Node y suite completa.
- **No modificados:** código fuente, HTML, JS, CSS, Service Worker, manifest, pruebas, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, metodología y rama base.
- **Conclusión:** la marca [X] en `completadas.md` es histórica. La evidencia estática contradice la afirmación de actualización completa de rutas. F8-Task03 **NO CUMPLE** CA-MOD-107 ni CA-MOD-108.

## 8. Continuidad

- **Última tarea auditada:** F8-Task03 / TAREA-MOD-04.
- **Tarea en curso al cierre:** ninguna.
- **Siguiente tarea cronológica:** F8-Task04 — crear y ejecutar pruebas de regresión para la modularización y dashboards dinámicos.
- **Próxima acción:** comprobar si existe informe individual F8-Task04; si falta, auditar directamente la tarea marcada en `completadas.md`, revisar `tests/regression/modular-dashboard-suite.js` y `backend/developer-service/Code.gs`, contrastar CA-MOD-110/111 y verificar si las pruebas cubren comportamiento real, seguridad, ámbitos, cargas de módulos y rutas.
