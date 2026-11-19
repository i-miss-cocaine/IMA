# AUDITORÍA TASK-638 — C1.289
**Tarea:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo  
**Sesión:** IMA-EXEC-20261109-0407Z-01  
**Fecha:** 2026-11-09 UTC  
**Fase:** PM-00 — inventario, triage y resolución de dependencias  
**Repositorio/rama:** i-miss-cocaine/IMA — `NG_beta_0.0.0.1_work`  
**HEAD auditado:** `0afe7fd3a9b9df974afc557063d40b787a7e1c30`  
**Checkpoint anterior:** C1.288  
**Estado del trabajo:** auditoría preimplementación en curso; no se declara TASK-638 completada.

## 1. Requisito y alcance
Se abrió el requisito íntegro de TASK-638 en `pendientes/Contabilidad/Pendientes.md`. Exige documentar por archivo las dependencias HTML script/link, CSS, imágenes, fuentes, imports, referencias dinámicas, rutas, endpoints, acciones backend, contratos y servicios externos; distinguir dependencias comprobadas de inferidas e identificar consumidores/proveedores. Los criterios exigen origen/destino exactos, sensibilidad a mayúsculas y rutas relativas, contratos dinámicos documentados y no declarar funcionalidad sin evidencia.

Dependencia previa: TASK-637. C1.288 declara TASK-637 Completada; el HEAD actual coincide con el commit de cierre, por lo que se considera satisfecho el prerrequisito. Conforme a la instrucción expresa de inicio del Plan Maestro, esta iteración no reaudita TASK-637. No se alteran rutas, contratos ni código durante esta auditoría.

## 2. Integridad y universo del repositorio
- Git tree recursivo del HEAD: `5302f8869dfcc6ce472f78e445537488a3d924b1`; `truncated=false`.
- 1.079 entradas de árbol; 1.013 blobs versionados.
- Distribución relevante: 100 HTML, 1 HTM, 24 JS, 6 CSS, 6 GS y 27 JSON; además 359 PNG, 125 JPG, 6 GIF, 3 SVG, 2 WEBP, 65 PDF, 6 DOCX, 3 XLS/XLSX y 19 TXT.
- `docs/architecture/repository-inventory.md` (SHA `d5fdf1a621481d453a7a5779d2b82615901716b3`) declara 1.013 rutas únicas y snapshot C1.288. El conteo coincide con el tree actual.
- `Auditoría/MapaDependencias.md` (SHA `aef3b8c2f7f8d85a83eeda938e80f25bffbb1b85`) tiene 4.191 líneas y 425.086 caracteres. El encabezado sigue indicando v7.6.1; el contenido mezcla resúmenes generales y bloques históricos de auditorías. Su existencia y tamaño no acreditan por sí solos una matriz vigente por archivo.

## 3. Trazas verificadas en esta pasada

### 3.1 Punto de entrada principal
`index.html` (SHA `cd742047cdc4948259dd721119429b04f78330ca`) carga al final del documento, en este orden:
1. `js/config.js?v=22`
2. `js/persistence.js?v=22`
3. `js/api.js?v=22`
4. `js/games-adapter.js?v=22`
5. `js/ui-common.js?v=22`
6. `js/data.js?v=22`
7. `js/index-ui.js?v=22`

El orden anterior es una dependencia de inicialización explícita del HTML; no equivale a demostrar que cada archivo dependa funcionalmente del anterior en todos sus caminos. El mismo HTML referencia `css/style.css?v=21`, icono/imagen bajo `imagenes/`, manifest y bibliotecas externas Tailwind, Google Fonts, Font Awesome y Chart.js.

### 3.2 Dependencias dinámicas frontend
- `js/config.js` (SHA `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc`) define globals como `SERVICE_URLS`, `SERVICE_REGISTRY`, `MODULE_ROUTING_DICTIONARY` y `DYNAMIC_DASHBOARD_MODULE_CONTRACTS`; `syncAcademicScope` llama `fetchApi('ACADEMIC','getAcademicConfig',...)`, actualiza `GLOBAL_SCOPE` y emite `academic-scope-updated`.
- `js/api.js` (SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`) define `fetchApi(service,action,payload,...)`. Consume `SERVICE_URLS`, consulta `currentUser` en localStorage/sessionStorage, envía POST JSON con `{action,payload}`, y opcionalmente delega caché/reconciliación en `window.PersistenceManager`. Depende además de `fetch`, AbortController, DOM y temporizadores.
- El camino de error de `fetchApi` puede devolver `status: success` con `data: []` para acciones `get*`; por ello una respuesta vacía de fallback no demuestra que el proveedor remoto haya respondido correctamente. Este comportamiento ya se relaciona con AUD-NG-322; no se duplica.
- `app/html/dashboards/dynamic-dashboard.html` (SHA `765a45e5666c24c430e841cb70c3d71d03cf9074`) carga rutas relativas `../../../css/style.css`, `../../../js/config.js`, `persistence.js`, `api.js` y `ui-common.js`; al evento DOMContentLoaded invoca `window.loadDynamicDashboard()` si existe. No carga `games-adapter.js`, `data.js` ni `index-ui.js`. Es una cadena de inicialización distinta a la del punto de entrada principal.
- `MODULES_CATALOG` registra 13 módulos, mientras `DYNAMIC_DASHBOARD_MODULE_CONTRACTS` contiene 6 contratos. Esta brecha ya está documentada en AUD-NG-321/TASK-671; se referencia sin crear duplicado.

### 3.3 Frontera frontend/backend
- `SERVICE_URLS` y `SERVICE_REGISTRY` residen en `js/config.js`; `fetchApi` los usa como proveedor de destino y transporta el nombre de acción.
- Se identifican seis claves: USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER. Las cadenas de ACCOUNTING y DEVELOPER son marcadores de posición, mientras el registro les asigna metadatos declarativos ACTIVE/v8.4.0 y recursos con IDs ficticios. El repositorio no demuestra que esos dos endpoints estén desplegados ni que sus metadatos coincidan con los deployments. La anomalía de ACCOUNTING ya está registrada en AUD-NG-323; se amplía su evidencia, no se duplica.
- En los servicios GAS revisados, el punto de entrada HTTP `doPost` procesa `{action,payload}`, ejecuta validación de permisos y despacha por nombre de acción. Ejemplos inspeccionados: USER (`Code.gs`, doPost alrededor de 1351), TASK (PUBLIC_ACTIONS/ROLE_PERMISSIONS desde el bloque inicial), EXAM (PUBLIC_ACTIONS/ROLE_PERMISSIONS desde el bloque inicial). Cada servicio mantiene su propio catálogo de acciones/permisos y sus propios handlers.
- La existencia de un nombre en un catálogo o dispatcher no demuestra que el frontend lo consuma, que el endpoint esté desplegado o que el contrato sea compatible. Esos enlaces requieren trazabilidad individual por acción y evidencia de deployment.

## 4. Hallazgo de auditoría

### AUD-NG-350 — ALTO/P1 — El mapa no acredita trazabilidad estática/dinámica completa por archivo
**Evidencia:** el inventario confirma 1.013 blobs y 164 archivos de markup/configuración/código relevantes (HTML/HTM/JS/CSS/GS/JSON), pero el mapa actual no contiene una matriz verificable de cada origen y destino ni un grafo de consumidores/proveedores para todas las páginas, scripts, hojas de estilo, recursos, servicios y referencias dinámicas. La cabecera v7.6.1 y la mezcla de resúmenes históricos tampoco identifican inequívocamente una versión vigente. En esta pasada solo se verificaron directamente `index.html`, el dashboard dinámico, los módulos frontend comunes y las fronteras iniciales de servicios.
**Impacto:** no se puede afirmar que cada dependencia explícita esté documentada ni que todas las rutas/contratos dinámicos sean funcionales. Un traslado o cambio de contrato podría romper consumidores no identificados.
**Causa:** el mapa existente evolucionó mediante bloques históricos, sin matriz canónica por archivo, clasificación de evidencia ni reconciliación completa con el inventario C1.288.
**Acción:** completar el mapa canónico por archivo, registrar origen, destino, tipo, evidencia/rango, sensibilidad de ruta, consumidor/proveedor y condición (estática, dinámica confirmada o inferida); enlazar cada contrato con acción/handler y endpoint. Mantener separadas las relaciones no verificadas.
**Tarea derivada:** ampliar TASK-678 existente (no crear ID duplicado), y coordinar TASK-674/TASK-665 para validación de rutas y cobertura de evidencia.

## 5. Dictamen de aceptación
- **Criterio de cobertura por archivo:** NO CUMPLE en esta pasada; el inventario está completo, pero la traza de dependencias no.
- **Referencias HTML/CSS/assets:** PARCIAL; se comprobó el punto de entrada principal y el dashboard dinámico, no los 101 HTML/HTM ni todos los recursos.
- **Imports, rutas dinámicas, endpoints y acciones backend:** PARCIAL; se verificaron globals, el transporte común y la estructura de dispatch de servicios, no cada llamada/handler.
- **Contratos consumidor/proveedor:** NO CUMPLE; faltan contratos por acción y evidencia de despliegue para destinos configurados.
- **No se declara ninguna ruta dinámica como funcional sin evidencia.**

## 6. Pruebas y límites
Inspección estática manual de blobs Git, tree recursivo, inventario, páginas y módulos señalados. No se ejecutaron Node, navegador, HTTP, Apps Script, hojas reales, Drive ni E2E. No se inspeccionaron todos los 1.013 blobs; no se infieren ciclos ni duplicados confirmados. La identificación exhaustiva de símbolos globales, duplicaciones y ciclos pertenece también a TASK-639 y no se declara completada aquí.

## 7. Tareas derivadas de los hallazgos de la auditoría
- **TASK-678 (ampliación del ID existente):** matriz canónica de dependencias por archivo, con origen/destino, tipo, evidencia, sensibilidad de ruta, consumidor/proveedor y estado de verificación.
- **TASK-674 (ampliación referencial):** contrastar rutas declaradas con destinos reales del árbol, incluyendo rutas relativas y mayúsculas/minúsculas.
- **TASK-665 (ampliación referencial):** pruebas de cobertura y validación que no confundan presencia textual con resolución/ejecución real.
- **TASK-662/TASK-671 (referencia):** reconciliar catálogos, contratos, acciones y dispatchers de servicios sin duplicar los hallazgos ya registrados AUD-NG-321/AUD-NG-323.

## 8. Estado y siguiente paso
TASK-638 permanece **En ejecución**. La auditoría preimplementación identificó la brecha principal, pero no se considera completado el mapeo solicitado. Siguiente acción exacta: continuar la inspección manual de los 100 HTML y 1 HTM restantes por grupos, registrar por página sus script/link/img/font/manifest/service-worker, y después trazar cada JS/CSS/GS/JSON y cada llamada de acción hasta su handler y persistencia. No mover archivos ni cambiar contratos hasta cerrar la matriz y sus dependencias.
