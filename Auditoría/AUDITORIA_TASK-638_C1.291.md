# AUDITORÍA TASK-638 — C1.291
**Tarea:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo  
**Sesión:** IMA-EXEC-20261109-0420Z-01  
**Fecha:** 2026-11-09 UTC  
**Fase:** PM-00 — inventario, triage y resolución de dependencias  
**Repositorio/rama:** i-miss-cocaine/IMA — `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `26aafb7cccc412d237c4cbd8391cf773024ac00e`  
**Checkpoint anterior:** C1.290  
**Estado:** auditoría estática de HTML/HTM completada; TASK-638 global continúa En ejecución.

## 1. Alcance y continuidad
Se verificó el HEAD de la rama autorizada y la rama base antes de esta iteración. No se reaudita TASK-637. Se completó la inspección estática de los **101 documentos HTML/HTM** versionados: 100 HTML y 1 HTM. El conjunto se organizó en:
- 28 documentos de aplicación, portales, dashboards, entrada y fragmentos de juego (incluye el trabajo C1.289/C1.290).
- 21 páginas de III_BTP_A.
- 8 páginas de II_BTP_A/Informatica_Aplicada_I.
- 10 páginas de II_BTP_A/Ofimatica_I.
- 14 páginas de II_BTP_A/Programacion.
- 7 páginas de II_BTP_A/analisis_diseno.
- 13 páginas de Informatica_I.

Se contrastaron rutas locales extraídas de etiquetas script, link, img, a, source, video, audio, iframe y form contra el árbol Git, resolviendo rutas relativas desde el documento anfitrión. Las expresiones de plantilla interpoladas se clasificaron como dinámicas, no como rutas estáticas. Los fragmentos Periféricos/WebMaster se resolvieron según su consumidor index.html, no como documentos autónomos.

## 2. Hallazgos de rutas confirmados

### AUD-NG-351 — MEDIO/P2 — CSS local ausente en consola de desarrollador
- **Origen:** `developer-dashboard.html`, línea 9; SHA `2b69f1bf7ffbbe4902e81de14d6315cedb035a1e`.
- **Referencia:** `css/custom.css`.
- **Destino resuelto:** `css/custom.css`; no existe en el tree ni hay otro archivo `custom.css`.
- **Control cruzado:** `css/style.css` y `js/developer.js` sí existen.
- **Impacto:** la hoja específica declarada no se puede cargar; no se afirma que toda la consola carezca de estilos.
- **Derivación:** ampliar TASK-674 y TASK-678.

### AUD-NG-352 — MEDIO/P2 — Extensión con mayúsculas/minúsculas incompatible en imagen de hoja de cálculo
- **Origen:** `II_BTP_A/Ofimatica_I/hojas_calculo.html`, línea 378; SHA `82ae2dff10b84d41db2eb7ab80b9ed3639525a4d`.
- **Referencia:** `../../imagenes/ordenamiento-y-filtrado.png`, que desde la página resuelve a `imagenes/ordenamiento-y-filtrado.png`.
- **Destino real:** no existe con extensión `.png`; sí existe `imagenes/ordenamiento-y-filtrado.PNG` (y una copia en `II_BTP_A/Ofimatica_I/imagenes/ordenamiento-y-filtrado.PNG`).
- **Impacto:** la imagen no se resuelve en servidores/sistemas sensibles a mayúsculas y minúsculas.
- **Derivación:** ampliar TASK-674 y TASK-678.

### AUD-NG-353 — MEDIO/P2 — Iconos PWA apuntan a imagen inexistente en pseudocode
- **Origen:** `pseudocode.html`, líneas 10–11; SHA `9b882d70755dc89b000390990852a03407c6973a`.
- **Referencias:** `IMA-Logo.png` para `rel=icon` y `rel=apple-touch-icon`.
- **Destino:** `IMA-Logo.png` en la raíz; no existe en el tree ni hay coincidencia de nombre/caso. Hay otros logos (`new-generation-logo.png`, `imagenes/new-generation-logo.png`, `imagenes/logo.png`), pero no se presume que sean intercambiables sin validar la identidad visual prevista.
- **Impacto:** favicon e icono de pantalla de inicio declarados no se resuelven.
- **Derivación:** ampliar TASK-674 y TASK-678.

## 3. Reconciliación de falsos positivos y rutas dinámicas
- `juegos/perifericos.html` y `juegos/webmaster_quiz.html` contienen rutas que, resueltas desde su carpeta, parecerían rotas. Sin embargo, `js/index-ui.js` las descarga como fragmentos, las inserta en el documento anfitrión con `innerHTML` y agrega explícitamente `js/security-minigames.js` y el controlador del juego. No se registran como fallos de ruta en ese flujo.
- En `dashboard-recursos-humanos.html`, los valores de enlaces interpolados son plantillas de URLs dinámicas, no archivos estáticos; requieren trazabilidad de datos en el módulo/servicio, no una búsqueda literal en Git.
- Las URLs externas CDN (Tailwind, Google Fonts, Font Awesome, Chart.js, PDF-lib, Quill, SheetJS) no se validaron por HTTP ni disponibilidad de proveedor.
- No se modificó el nombre ni la ubicación de `index.html` o `index.htm`; no se movieron páginas ni recursos.

## 4. Observaciones arquitectónicas conservadas
- Cafetería y Tienda siguen sin controlador departamental ni llamada API explícita en sus HTML; se conserva como hueco de trazabilidad por confirmar, no como defecto funcional probado.
- RRHH y documentos legales consumen acciones ACCOUNTING; la condición placeholder del endpoint sigue enlazada a AUD-NG-323 y no se afirma que el servicio esté desplegado.
- Las páginas de login/registro delegan a `js/auth.js`; evaluación/resultados a `js/exam.js` y `js/results.js`; admisión a ACADEMIC; pseudocode a USER/TASK; teacher/student dashboards a sus controladores.
- La traza por acción hasta dispatcher, handler, permisos y persistencia no está completa para todos los servicios.

## 5. Dictamen de cobertura
- **HTML/HTM:** 101/101 inspeccionados estáticamente.
- **Rutas locales estáticas:** verificadas contra el tree con resolución relativa; tres referencias ausentes/incompatibles confirmadas (AUD-NG-351/352/353).
- **Rutas dinámicas:** clasificadas por contexto y consumidor donde la evidencia está disponible; no se afirma ejecución.
- **JS/CSS/GS/JSON/assets como universo independiente:** su análisis exhaustivo continúa pendiente.
- **Contratos API/backend y persistencia:** traza parcial; falta relacionar exhaustivamente frontend → URL → dispatcher → handler → permisos → Sheets/Drive.
- **Pruebas runtime:** no ejecutadas; no se ejecutaron navegador, HTTP, Node, Apps Script, Drive, Sheets ni E2E.
- **TASK-638:** permanece En ejecución; el cumplimiento global NO está acreditado hasta completar las capas restantes.

## 6. Tareas derivadas de la auditoría
- **TASK-674 (ampliación):** ampliar la validación de rutas para detectar archivos inexistentes, diferencias de caso/extensión, referencias PWA y rutas resueltas según documento anfitrión o fragmento inyectado.
- **TASK-678 (ampliación):** incorporar la matriz 101/101, los hallazgos AUD-NG-351/352/353, referencias dinámicas y su estado de verificación.
- No se crean identificadores duplicados. TASK-665/TASK-662/TASK-671 continúan como dependencias para pruebas de cobertura, contratos y dispatchers.

## 7. Siguiente acción exacta
Cerrar el inventario de los 24 JS, 6 CSS, 6 GS y 27 JSON y recursos relacionados; identificar globals, imports, funciones exportadas, eventos, consumidores, endpoints y acciones. Después trazar cada acción hasta dispatcher, handler, autorización y persistencia, distinguiendo contratos declarados de deployments comprobados. TASK-638 no debe cerrarse solo por haber completado la capa HTML.
