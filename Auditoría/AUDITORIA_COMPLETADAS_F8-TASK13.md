# Auditoría F8-Task13 / TAREA-MOD-02 — Estructura modular de carpetas

- Fecha: 2026-11-08.
- ID de sesión operativo: IMA-AUDIT-20261108-2330Z-02 (identificador documental; no ID nativo de ChatGPT).
- Checkpoint inicial: C1.272.
- Checkpoint de cierre previsto: C1.273.
- Repositorio: i-miss-cocaine/IMA.
- Rama: NG_beta_0.0.0.1_work.
- HEAD de partida verificado: 83f671ad81501061f4cc76ade672a27441f17b4d.
- Árbol de partida: 4a3e2c9a91b100bbc5cc71c9a1952c2239390eca.
- Comparación con rama base protegida indicada en C1.271 (44d9891132332e692dbe2ba8602b41f50a508a59): 341 commits adelante, 0 detrás.
- Tarea auditada: F8-Task13 / TAREA-MOD-02, marcada [X] en completadas.md, líneas 5071–5093.
- Informe individual previo: no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK13.md; se ejecutó la auditoría directamente.
- Dictamen global: **NO CUMPLE**.
- CA-MOD-103: NO CUMPLE.
- CA-MOD-104: PARCIAL / NO ACREDITADO EN RUNTIME.

## 1. Objetivo y criterios

Verificar la organización física del frontend y backend bajo app/ y backend/, la conservación del punto de entrada en raíz, la resolución de rutas/recursos, la compatibilidad con despliegue (clasp u otro mecanismo) y la prevención de exposición de credenciales/archivos sensibles.

- CA-MOD-103: los archivos se agrupan por función y responsabilidad dentro de app/ y backend/.
- CA-MOD-104: index.htm permanece en la raíz y la plataforma carga correctamente sus recursos.

## 2. Fuentes e integridad del backlog

| Fuente | SHA / Estado | Observación |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task13 [X], líneas 5071–5093 |
| Pendientes.md | blob 676a3f798715f0cdd7d4bc75768472545b8465ee | Recuperado desde Git; 1.786.011 caracteres, 20.224 líneas, 515 TASK IDs únicos, máximo TASK-636; sin U+FFFD |
| docs/architecture/folder-structure.md | ca44aea0abaf80bab58adb4b7bf51935f404bf96 | Estructura propuesta |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | Validador de estructura, mapa y migración por etapas |
| index.html | cd742047cdc4948259dd721119429b04f78330ca | Punto de entrada actual |
| app/html/dashboards/dynamic-dashboard.html | 765a45e5666c24c430e841cb70c3d71d03cf9074 | Única plantilla app/html inspeccionada |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Suite estática de regresión |
| README.md | 1d76341a6a286ebd0115e319f77b8c33b727dbba | Documenta frontend en raíz y /js |
| docs/architecture/repository-inventory.md | eeed10fd8da0db3cd119c5a9778e9cb8b2233808 | Inventario aún describe vistas y módulos en raíz |
| docs/architecture/routing-and-paths.md | c64e6a952c1ce12a47cb00a2d324f39cd6581a47 | Rutas aún apuntan a raíz, js/, css/ e imagenes/ |

Pendientes.md se consultó mediante el blob íntegro de la rama; no se modificó. No se detectaron TASK-673, TASK-674 ni TASK-675 en el backlog actual. Los TASK-671 y TASK-672 permanecen definidos en el informe F8-Task11 y en el plan de auditoría; no se recrean.

## 3. Evidencia técnica

### 3.1 La estructura frontend no se migró físicamente a app/

**Estructura documentada**
- folder-structure.md, líneas 7–34, declara app/html, app/js, app/css y app/assets, además de backend, tests y docs.
- La nota de la línea 3 afirma que la estructura es recomendable, no obligatoria; esto contradice el objetivo y CA-MOD-103 de la tarea actual.

**Estado real comprobado**
- Existe app/html/dashboards/dynamic-dashboard.html.
- No existen los archivos declarados por el manifiesto estático app/js/ui-common.js, app/css/style.css y app/assets/logo.png.
- Tampoco existen app/js/config.js, app/js/api.js, app/css/main.css, app/assets/new-generation-logo.png, app/html/dashboard-coordinacion.html ni app/html/dashboard-direccion.html.
- Los equivalentes siguen en raíz o en carpetas heredadas: js/config.js, js/api.js, js/ui-common.js, css/style.css, imagenes/ y dashboards HTML como dashboard-coordinacion.html y dashboard-direccion.html.
- README.md, líneas 47–54, describe expresamente el frontend como directorio raíz y /js.
- repository-inventory.md, secciones 1, 2 y 4, lista las vistas en raíz, controladores en js/, estilos en css/ y recursos en imagenes/.
- routing-and-paths.md, secciones 1 y 2, conserva las mismas rutas heredadas.
- index.html, líneas 20, 33 y 427–433, carga css/style.css, imagenes/new-generation-logo.png y scripts desde js/.
- app/html/dashboards/dynamic-dashboard.html, líneas 8, 14 y 37–40, también resuelve estilos, logo y scripts mediante rutas ../../../css, ../../../imagenes y ../../../js, no desde app/css, app/assets o app/js.

**Conclusión:** backend/, tests/ y docs/ sí tienen agrupación funcional, pero el frontend sigue distribuido en raíz, js/, css/ e imagenes/. La presencia de una sola plantilla en app/html no acredita la migración del resto. CA-MOD-103 NO CUMPLE.

### 3.2 El validador de estructura produce falsos positivos

**backend/developer-service/Code.gs, líneas 1747–1795**
- getArchitectureAndDependencyMapReport devuelve defaultArchitectureDocs como una lista literal de rutas esperadas.
- La lista incluye app/js/ui-common.js, app/css/style.css y app/assets/logo.png aunque esos archivos no existen en la rama.
- mapValid se calcula a partir de que architectureDocs.length sea mayor que cero, no de una inspección del árbol real.

**backend/developer-service/Code.gs, líneas 1895–1964**
- validateModularFolderStructure define requiredFolderPaths.
- Si no recibe repositoryPaths/fileManifest, usa architectureDocs del mapa estático.
- Verifica cada carpeta mediante una coincidencia de subcadena en esa lista, no consultando el árbol Git ni el sistema de archivos.
- rootFiles, cuando no se proporciona, se inicializa con index.htm e index.html; por tanto indexHtmPreserved resulta true aunque index.htm no exista.
- publicExposingRisk, cuando no se proporciona, se inicializa false; no hay escaneo de archivos sensibles ni cálculo del riesgo.
- El resultado structureValid puede ser success aunque las carpetas/archivos reales falten.

**backend/developer-service/Code.gs, líneas 1966–1999**
- validateStagedMigrationProgress invoca validateModularFolderStructure({}) y marca STAGE-3-FOLDER-STRUCTURE como COMPLETED cuando el validador devuelve success.
- Por la fuente estática y los valores por defecto anteriores, la etapa puede declararse completada sin comprobar la estructura real.

**Conclusión:** la verificación que respalda la finalización de F8-Task13 no es una prueba del árbol real y puede aprobar una estructura inexistente. Hallazgo de alta prioridad.

### 3.3 La suite de regresión no verifica la estructura completa

**tests/regression/modular-dashboard-suite.js, líneas 22–50**
- Comprueba la existencia de app/html/dashboards/dynamic-dashboard.html y dashboard-coordinacion.html en raíz.
- Comprueba documentación y presencia de cadenas/funciones en developer-service.
- Lee js/config.js desde la raíz.
- No comprueba app/js, app/css, app/assets, la ubicación de los dashboards, index.htm, rutas relativas reales, configuración clasp ni exclusión de secretos.
- La aserción MapaDependencias.md usa la ruta raíz, aunque el mapa de auditoría está bajo AUDITORIAS/; este problema ya fue registrado en AUD-NG-324 y no se duplica aquí.

**Conclusión:** la suite verifica presencia parcial y nombres de funciones, no el cumplimiento físico de CA-MOD-103/104.

### 3.4 El punto de entrada real es index.html, no index.htm

- index.htm no existe en la raíz (respuesta 404 del path).
- index.html sí existe y es el punto de entrada documentado por README.md y routing-and-paths.md.
- folder-structure.md, línea 39, acepta expresamente index.html o index.htm; sin embargo, completadas.md, líneas 5084 y 5090, exige literalmente index.htm.
- index.html carga rutas de raíz js/, css/ e imagenes/. Los archivos de referencia inspeccionados existen en esas ubicaciones.
- No se ejecutó navegador ni HTTP para confirmar ausencia de 404 o equivalencia funcional en el hosting.

**Conclusión:** el punto de entrada raíz está preservado mediante index.html, pero el nombre literal index.htm exigido por la tarea no existe. CA-MOD-104 queda PARCIAL / NO ACREDITADO EN RUNTIME hasta reconciliar la especificación y probar las rutas.

### 3.5 No hay configuración versionada de despliegue ni exclusión de secretos verificable

- El repositorio es público (visibilidad reportada por GitHub: public).
- No se encontraron en la raíz .clasp.json, .claspignore, appsscript.json ni .gitignore.
- folder-structure.md, línea 41, exige que clasp reconozca/sincronice subcarpetas y que no exponga credenciales/archivos sensibles, pero no hay configuración versionada que permita verificar esos controles.
- validateModularFolderStructure no examina credenciales ni archivos sensibles; publicExposingRisk se asume false salvo que el cliente envíe el booleano true.
- No se confirmó un secreto literal expuesto en esta inspección; el hallazgo es la ausencia de controles y evidencia verificable en un repositorio público, no una afirmación de filtración de credenciales.

**Conclusión:** la compatibilidad con clasp y la exclusión de archivos sensibles no están demostradas.

## 4. Hallazgos

### AUD-NG-329 — Migración modular del frontend incompleta
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-MOD-103.
- Evidencia: folder-structure.md:7–34; README.md:47–54; repository-inventory.md:1–4; routing-and-paths.md:1–2; index.html:20, 33, 427–433; dynamic-dashboard.html:8, 14, 37–40.
- Descripción: la mayoría de las vistas, controladores, estilos y assets permanecen en raíz, js/, css/ e imagenes/. Los archivos esperados app/js/ui-common.js, app/css/style.css y app/assets/logo.png no existen.
- Impacto: la estructura declarada no coincide con la estructura física; se mantienen dependencias heredadas y no se ha completado la separación funcional.
- Tarea derivada: TASK-673.

### AUD-NG-330 — validateModularFolderStructure certifica carpetas por manifiesto estático y valores por defecto
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-MOD-103 y CA-MOD-104.
- Evidencia: developer-service Code.gs:1747–1795, 1895–1964 y 1966–1999.
- Descripción: el validador compara strings de una lista hardcodeada en lugar de inspeccionar el árbol real; da por preservado index.htm porque lo incluye en rootFiles por defecto; asume publicExposingRisk=false sin escaneo.
- Impacto: STAGE-3 puede declararse COMPLETED aunque falten app/js, app/css, app/assets e index.htm, y aunque no se haya comprobado exposición de archivos.
- Tarea derivada: TASK-674.

### AUD-NG-331 — Despliegue y exclusión de archivos sensibles sin configuración verificable
- Severidad/Prioridad: MEDIO/P2.
- Criterio: requisito funcional 3 y requisito funcional 4 de F8-Task13.
- Evidencia: repo público; ausencia confirmada de .clasp.json, .claspignore, appsscript.json y .gitignore; folder-structure.md:37–41; developer-service Code.gs:1922–1925.
- Descripción: no hay configuración local versionada de clasp ni reglas de exclusión; el validador no inspecciona archivos sensibles y asume riesgo falso por defecto.
- Impacto: no se puede reproducir/verificar qué carpetas se despliegan ni acreditar que secretos/archivos sensibles se excluyen del contenido público.
- Límite: no se confirmó una credencial filtrada concreta.
- Tarea derivada: TASK-675.

### AUD-NG-332 — Divergencia entre index.htm exigido e index.html existente
- Severidad/Prioridad: MEDIO/P2.
- Criterio: CA-MOD-104.
- Evidencia: completadas.md:5084–5090; folder-structure.md:11 y 39; index.html existe; index.htm devuelve 404.
- Descripción: la tarea y su criterio nombran index.htm, mientras la documentación de arquitectura permite index.html o index.htm y la plataforma mantiene index.html como punto de entrada.
- Impacto: el estado del criterio es ambiguo y el validador no detecta la ausencia literal de index.htm. No se debe crear un alias a ciegas que altere el enrutamiento; debe definirse un nombre canónico y probarse en hosting.
- Tarea derivada: TASK-673/TASK-674.

## 5. Matriz de aceptación

| Requisito / criterio | Dictamen | Justificación |
|---|---|---|
| Backend agrupado en backend/ | CUMPLE PARCIALMENTE | Los microservicios se encuentran bajo backend/. |
| Pruebas y documentación agrupadas | CUMPLE | tests/ y docs/ existen. |
| HTML, JS, CSS y assets organizados en app/ | NO CUMPLE | La mayor parte permanece en raíz/js/css/imagenes; faltan los archivos de app/js, app/css y app/assets definidos en el manifiesto. |
| CA-MOD-103 | NO CUMPLE | La estructura física no corresponde a la separación requerida. |
| index.htm literal en raíz | NO CUMPLE | No existe; el archivo presente es index.html. |
| Punto de entrada alternativo index.html | CUMPLE PARCIALMENTE | Está en raíz y conserva referencias a recursos existentes, pero no hubo prueba HTTP/browser. |
| CA-MOD-104 | PARCIAL / NO ACREDITADO | La documentación acepta index.html, pero la tarea/criterio exige index.htm y el comportamiento no se ejecutó en hosting. |
| clasp reconoce subcarpetas | NO ACREDITADO | No hay .clasp.json, .claspignore ni manifest versionado. |
| Exclusión de secretos | NO ACREDITADO | No hay reglas ni escaneo; no se confirmó una filtración concreta. |
| Validador programático | NO CUMPLE | Se basa en manifiesto estático y defaults que producen falsos positivos. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se consultaron Pendientes.md (blob íntegro actual) y completadas.md. El backlog llega a TASK-636; TASK-671 y TASK-672 ya están definidos en el informe F8-Task11 y en el plan. No se encontraron TASK-673, TASK-674 ni TASK-675. Se crean tres tareas nuevas consecutivas, sin duplicar TASK-665 (suite de regresión), TASK-488 (rutas/dashboards dinámicos) ni TASK-636 (seguridad de identidad/autorización).

### TASK-673 — Completar la migración física del frontend a app/ y reconciliar el punto de entrada
- Origen: AUD-NG-329 y AUD-NG-332.
- Prioridad: P1.
- Objetivo: mover o encapsular de forma controlada páginas, scripts, CSS y recursos estáticos bajo app/html, app/js, app/css y app/assets, conservando el punto de entrada público.
- Acción ejecutable: inventariar todos los consumidores; migrar páginas y recursos por etapas; actualizar rutas relativas, links, imports y MODULE_ROUTING_DICTIONARY; mantener compatibilidad de rutas durante la migración; actualizar README, repository-inventory y routing-and-paths; definir explícitamente si index.html es el nombre canónico o si index.htm debe existir como alias compatible.
- Criterios: los archivos fuente del frontend están agrupados en app/; no hay referencias rotas; index.html/index.htm canónico se carga en hosting; recursos, dashboards, PWA y enlaces existentes funcionan; no quedan copias divergentes de la misma fuente.

### TASK-674 — Sustituir el validador declarativo por verificación real del árbol Git y pruebas de estructura
- Origen: AUD-NG-330 y AUD-NG-332.
- Prioridad: P1.
- Objetivo: hacer que validateModularFolderStructure compruebe rutas reales de un manifiesto confiable obtenido del árbol Git/deployment, no una lista hardcodeada ni flags del cliente.
- Acción ejecutable: obtener el manifiesto real; comprobar existencia, tipo, mayúsculas/minúsculas y ubicación de cada carpeta/archivo; validar punto de entrada real; calcular el riesgo de exposición mediante reglas verificables; rechazar rutas traversal; hacer que validateStagedMigrationProgress consuma el resultado real.
- Criterios: si falta app/js, app/css, app/assets o el punto de entrada configurado, el validador devuelve error; no puede marcar Stage 3 como completada por defaults; los resultados se reproducen desde el árbol de la rama; tests negativos comprueban carpetas ausentes, archivos movidos, nombres erróneos y manifiestos falsificados.

### TASK-675 — Configurar despliegue reproducible y exclusión de credenciales/archivos sensibles
- Origen: AUD-NG-331.
- Prioridad: P2.
- Objetivo: documentar y versionar el mecanismo real de despliegue de los servicios GAS y los controles de exclusión de archivos locales/sensibles.
- Acción ejecutable: definir rootDir/proyectos por servicio para clasp o documentar el mecanismo alternativo; agregar configuración y reglas de exclusión adecuadas (.claspignore y .gitignore, y manifest appsscript.json cuando corresponda); separar archivos locales/credenciales de los directorios públicos; validar el contenido del paquete antes de publicar sin incluir secretos.
- Criterios: despliegue reproducible por servicio; carpetas correctas sincronizadas; docs/tests/archivos locales no deseados excluidos; escaneo automatizado bloquea secretos y credenciales; pruebas de paquete demuestran que ningún secreto o archivo sensible llega a GitHub Pages o al bundle GAS.

### Tareas existentes relacionadas; no duplicar
- TASK-665: ampliar la suite con comprobaciones conductuales de rutas, árbol físico, punto de entrada, despliegue y exclusión.
- TASK-488: actualizar las rutas reales de dashboards dinámicos cuando se complete la migración.
- TASK-636: mantener la protección de identidad y no versionar credenciales/tokens.
- TASK-671/TASK-672: conservar adaptadores y aislamiento de fallos; no son sustitutos de la migración de carpetas.
- AUD-NG-324: la aserción de MapaDependencias.md apunta a una ruta raíz incorrecta; se mantiene como hallazgo previo, no se crea duplicado.

## 7. Pruebas y límites

- Inspección manual: completadas.md:5071–5093; folder-structure.md:1–41; developer-service Code.gs:1747–1795, 1895–1999; index.html:15–40 y 420–435; dynamic-dashboard.html:1–49; tests/regression/modular-dashboard-suite.js:1–60; README.md:47–54; repository-inventory.md; routing-and-paths.md.
- Comprobaciones de existencia por rutas exactas: index.htm; app/js/ui-common.js; app/css/style.css; app/assets/logo.png; app/html/dashboard-coordinacion.html; app/html/dashboard-direccion.html; .clasp.json; .claspignore; appsscript.json; .gitignore. Todos devuelven NOT_FOUND. index.html, app/html/dashboards/dynamic-dashboard.html, backend/developer-service/Code.gs y tests/regression/modular-dashboard-suite.js sí existen.
- Repo metadata: visibilidad public; rama de trabajo confirmada.
- No ejecutados: Node, Apps Script runtime, clasp push/status, HTTP, GitHub Pages, navegador/DOM, scan de secretos sobre el árbol completo, ni pruebas de paquete/deployment.
- No se afirma que exista una credencial filtrada; se constata que no hay controles verificables de exclusión.
- Código fuente: sin modificaciones.
- completadas.md y Pendientes.md: sin modificaciones.
- Rama base: sin modificaciones.

## 8. Continuidad

- Última tarea auditada: F8-Task13 / TAREA-MOD-02.
- Checkpoint inicial: C1.272.
- Checkpoint de cierre previsto: C1.273.
- Siguiente tarea exacta: F8-Task14 — modularizar archivos grandes sin eliminar ni duplicar funciones, marcada [X] en completadas.md desde línea 5097.
- Próxima acción: verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK14.md; si falta, auditar directamente docs/architecture/monolith-decomposition-plan.md y backend/developer-service/Code.gs contra CA-MOD-105/106, verificando contratos públicos, duplicados/colisiones, consumidores y compatibilidad.
- Commit de cierre: se confirmará consultando HEAD después de publicar el único commit que contiene este informe y el checkpoint.
