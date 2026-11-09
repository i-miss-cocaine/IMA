# Auditoría F8-Task15 / TAREA-MOD-05 — Mapa de dependencias y documentación arquitectónica

- Fecha: 2026-11-08.
- ID de sesión operativo: IMA-AUDIT-20261108-2330Z-04 (identificador documental; no ID nativo de ChatGPT).
- Checkpoint inicial: C1.274.
- Checkpoint de cierre previsto: C1.275.
- Repositorio: i-miss-cocaine/IMA.
- Rama: NG_beta_0.0.0.1_work.
- HEAD de partida verificado: 570c458563c06e33d65e843d840b73357d7cf119.
- Árbol de partida: e928bb0c76f789559cab4270c059788c2e9ba0f6.
- Comparación con rama base protegida indicada en C1.271 (44d9891132332e692dbe2ba8602b41f50a508a59): 343 commits adelante, 0 detrás.
- Tarea auditada: F8-Task15 / TAREA-MOD-05, marcada [X] en completadas.md, líneas 5121–5140.
- Informe individual previo: no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK15.md; se ejecutó la auditoría directamente.
- Dictamen global: **NO CUMPLE**.
- CA-MOD-109: NO CUMPLE.

## 1. Objetivo y criterio

Comprobar que el mapa de dependencias y la documentación arquitectónica representan fielmente la estructura y comportamiento reales del repositorio: dependencias directas/indirectas entre HTML, JS, CSS, microservicios y fuentes de datos; contratos reutilizables; orden de carga/inicialización; y procesos de compilación/incorporación de archivos.

- CA-MOD-109: MapaDependencias.md y documentación de arquitectura corresponden con exactitud a la estructura del código.

## 2. Fuentes e integridad del backlog

| Fuente | SHA | Observación |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task15 [X], líneas 5121–5140 |
| Pendientes.md | blob 676a3f798715f0cdd7d4bc75768472545b8465ee | Recuperado desde Git; 1.786.011 caracteres, 20.224 líneas, 515 IDs TASK únicos, máximo TASK-636 |
| docs/architecture/repository-inventory.md | eeed10fd8da0db3cd119c5a9778e9cb8b2233808 | Inventario de páginas, scripts, servicios y assets |
| docs/architecture/routing-and-paths.md | c64e6a952c1ce12a47cb00a2d324f39cd6581a47 | Rutas y referencias |
| docs/architecture/staged-migration-procedure.md | 2b46af3095596fcd7a9744e4cc500b50b38a34f0 | Etapas de migración y rollback |
| docs/architecture/spreadsheets-schema.md | 0c8d5c4c2976d4b64949c693e66395896ce16246 | Esquemas de datos; fecha documental 2025-05-24 |
| AUDITORIAS/MapaDependencias.md | 17564f9af34f77c0bb30cbf9461300c46dacdd03 | Mapa bajo AUDITORIAS/, encabezado v7.6.1 y entradas históricas |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | Generador estático del mapa e inventario de contratos |
| index.html | cd742047cdc4948259dd721119429b04f78330ca | Orden real de scripts de la página raíz |
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | Catálogos y rutas |
| js/persistence.js | 94ac26feb4f7f31f1f3f2a238e164d23be565d94 | Persistencia IndexedDB |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | Cliente de microservicios |
| js/games-adapter.js | 4f43a67aa98a14e8d381c29ac585bf5952013a85 | Adaptador de minijuegos |
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | UI común |
| js/data.js | 6b3d5d654f56af320a8bf2acd6a4b77c0c6fd713 | Datos del portal index |
| js/index-ui.js | c637535e8cc84f02aa18631bc964ff7ef545722e | Controlador de index |
| js/presentation-engine.js | 049ce26a0d8a13cabb1900e2a0b44c5972c4ebd4 | Motor de presentaciones |
| js/security-minigames.js | ab0b0bd0228438e93190848b76c5d0e99907dc63 | Perímetro de minijuegos |
| js/auth.js | 8444dd085a3186106d2db7005b61ef934d3c22d8 | Autenticación frontend |

Pendientes.md se consultó desde el blob íntegro actual. No se modificó. TASK-671/672 y TASK-673–677 permanecen en sus informes/plan previos; se evita recrearlos. No existe TASK-678 en el backlog consultado.

## 3. Evidencia técnica

### 3.1 El inventario y el diccionario de rutas no contienen el mapa completo de dependencias

**docs/architecture/repository-inventory.md**
- Enumera páginas principales, algunos controladores JS, cinco microservicios y la hoja CSS/imagenes.
- Omite módulos existentes que participan en la carga de index.html: js/persistence.js, js/games-adapter.js, js/data.js y js/index-ui.js.
- Omite también js/index-ui.js, js/presentation-engine.js, js/security-minigames.js y js/games-adapter.js en el inventario de módulos de control.
- No documenta relaciones directas/indirectas entre cada HTML, sus scripts, estilos, servicios backend y tablas/fuentes de datos.

**docs/architecture/routing-and-paths.md**
- Enumera rutas de páginas y un conjunto parcial de scripts/estilos.
- No documenta el orden de carga por página, dependencias indirectas, endpoints consumidos por cada módulo ni sus fuentes de datos.
- La afirmación de que todos los HTML cargan scripts/estilos sin HTTP 404 no incluye resultados de ejecución, fecha, lista de rutas comprobadas ni evidencia reproducible.

**docs/architecture/spreadsheets-schema.md**
- Documenta hojas y columnas, pero su fecha declarada es 2025-05-24.
- No relaciona cada módulo frontend/backend con las tablas que consulta o modifica ni ofrece una matriz de dependencias de datos versionada a la fecha de auditoría.

**AUDITORIAS/MapaDependencias.md**
- El encabezado es “Mapa de Dependencias Académicas (v7.6.1)”, mientras el developer-service declara v8.4.0.
- Sus primeras secciones contienen relaciones puntuales (ui-common → teacher, presentation-engine → ui-common, persistence → api, etc.), pero no cubren todas las páginas, controladores, estilos, microservicios, endpoints y fuentes de datos.
- El archivo también acumula extensos registros de auditoría y snapshots históricos; no está separado claramente un mapa arquitectónico vigente de la bitácora de hallazgos.
- El único archivo existente está en AUDITORIAS/MapaDependencias.md; la ruta raíz MapaDependencias.md no existe.

**Conclusión:** hay inventarios y relaciones parciales, pero no un mapa completo, versionado y verificable de dependencias directas/indirectas y datos. CA-MOD-109 NO CUMPLE.

### 3.2 El reporte programático no genera ni valida un mapa de dependencias real

**backend/developer-service/Code.gs, líneas 1747–1795**
- getArchitectureAndDependencyMapReport devuelve defaultArchitectureDocs, una lista literal de rutas.
- La lista contiene rutas ausentes en el árbol actual: app/js/ui-common.js, app/css/style.css, app/assets/logo.png y MapaDependencias.md en raíz.
- La lista omite módulos reales cargados por index.html: js/persistence.js, js/games-adapter.js, js/data.js, js/index-ui.js y otros.
- initializationOrder es un arreglo estático y genérico; no representa el orden por página ni las dependencias efectivas.
- mapValid solo comprueba architectureDocs.length > 0. Una lista arbitraria/no vacía se declara válida.
- El resultado no incluye nodos/edges de dependencias, dependencias de datos, llamadas/consumidores, referencias CSS, contratos por módulo ni reglas de build.

**Orden real de index.html, líneas 427–433**
1. js/config.js
2. js/persistence.js
3. js/api.js
4. js/games-adapter.js
5. js/ui-common.js
6. js/data.js
7. js/index-ui.js

El initializationOrder predeterminado del generador omite persistence.js, games-adapter.js, data.js e index-ui.js; incluye auth.js/controladores sin distinguir que index.html no carga auth.js en ese bloque. No hay matriz por página que explique las variaciones.

**Rutas y ubicación**
- El generador y tests/regression/modular-dashboard-suite.js:30 esperan MapaDependencias.md en raíz.
- La ruta raíz no existe; el mapa está en AUDITORIAS/MapaDependencias.md.
- Esta discrepancia ya está registrada en AUD-NG-324 y se reconfirma sin duplicar el hallazgo.

**Conclusión:** el generador produce un inventario declarativo, no un grafo real ni una validación de exactitud. Reconfirma AUD-NG-330 y amplía el alcance del problema al mapa arquitectónico.

### 3.3 No se documenta un proceso reproducible de build ni reglas de incorporación de nuevos archivos

**docs/architecture/staged-migration-procedure.md**
- Define cinco etapas y un procedimiento de rollback.
- No especifica comandos concretos para construir/verificar el frontend, configuración de bundler, compilación, artefactos, sincronización por servicio ni una lista de pasos para registrar un nuevo archivo.
- La etapa 5 menciona la suite Node y una suite Apps Script, pero no define el comando de ejecución, entorno, dependencias, configuración o evidencia del resultado.
- La etapa 3 habla de clasp, pero no existe .clasp.json/.claspignore/appsscript.json en la raíz (ya documentado en AUD-NG-331).
- No se presenta una política verificable para añadir páginas, scripts, CSS, assets, servicios, contratos o fuentes de datos al inventario/mapa.

**Archivos de build/configuración consultados**
- package.json: no existe.
- Makefile: no existe.
- vite.config.js / webpack.config.js: no existen.
- scripts/build.js: no existe.
- .clasp.json / .claspignore / appsscript.json: no existen.

**Conclusión:** el documento describe etapas conceptuales, pero no un proceso de construcción e incorporación de archivos que otro desarrollador pueda reproducir.

## 4. Hallazgos

### AUD-NG-336 — La documentación arquitectónica no cubre el grafo real de dependencias ni las fuentes de datos
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-MOD-109.
- Evidencia: repository-inventory.md; routing-and-paths.md; spreadsheets-schema.md; AUDITORIAS/MapaDependencias.md.
- Descripción: los documentos enumeran subconjuntos de páginas, scripts y servicios, pero no trazan las dependencias directas/indirectas de cada página hasta sus módulos, endpoints y tablas. El esquema de spreadsheets data de 2025-05-24 y no está vinculado a consumidores; el mapa conserva encabezado v7.6.1 y mezcla grafo con bitácora histórica.
- Impacto: un cambio en un módulo o fuente de datos no permite identificar de forma fiable todos sus consumidores ni el impacto indirecto.
- Tarea derivada: TASK-678.

### AUD-NG-337 — getArchitectureAndDependencyMapReport declara válido un manifiesto estático incompleto
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-MOD-109.
- Evidencia: developer-service Code.gs:1747–1795; index.html:427–433; rutas exactas comprobadas.
- Descripción: el reporte entrega rutas hardcodeadas y un orden genérico; mapValid depende solo de que la lista no esté vacía. Incluye rutas inexistentes, omite módulos reales y no representa aristas ni datos. El orden no coincide con la carga real de index.html.
- Impacto: la plataforma puede declarar válido un mapa incompleto o desactualizado y los desarrolladores pueden depender de un orden de inicialización incorrecto.
- Reconciliación: amplía AUD-NG-330 (manifiesto estático/validación de árbol), AUD-NG-324 (ruta del mapa) y TASK-674/TASK-665; no se duplican.

### AUD-NG-338 — No existe procedimiento reproducible de build e incorporación de archivos
- Severidad/Prioridad: MEDIO/P2.
- Criterio: requisito funcional 3 de F8-Task15.
- Evidencia: staged-migration-procedure.md; ausencia de package.json, Makefile, Vite/Webpack, scripts/build.js y configuración clasp.
- Descripción: el procedimiento enumera etapas, pero no define comandos, entorno, artefactos, pasos de registro de nuevos módulos/rutas/contratos/datos ni evidencia de ejecución.
- Impacto: la incorporación de archivos y el despliegue dependen de conocimiento informal; el inventario y el mapa pueden quedar desactualizados.
- Reconciliación: amplía TASK-675 (despliegue/build) y TASK-665 (validación automatizada).

## 5. Matriz de aceptación

| Requisito | Dictamen | Justificación |
|---|---|---|
| Dependencias directas HTML/JS/CSS | PARCIAL | Hay rutas generales, pero faltan relaciones por página y carga real. |
| Dependencias indirectas hacia microservicios | NO CUMPLE | No hay matriz completa de llamadas/consumidores por módulo. |
| Dependencias hacia fuentes de datos | NO CUMPLE | El esquema lista tablas, pero no relaciona consumidores y tablas; fecha 2025-05-24. |
| Contratos de módulos reutilizables | PARCIAL | Hay catálogo de acciones y nombres, no contratos completos ligados a firmas y consumidores. |
| Orden de carga/inicialización | NO CUMPLE | Orden genérico estático no coincide con el orden real de index.html. |
| Build y reglas para incorporar archivos | NO CUMPLE | No hay proceso reproducible, comandos ni checklist. |
| Ubicación/canonicalización del mapa | NO CUMPLE | MapaDependencias.md raíz no existe; el único está en AUDITORIAS/ y código/tests esperan raíz. |
| CA-MOD-109 | NO CUMPLE | La documentación y el reporte programático no corresponden exactamente al código y sus dependencias. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se consultaron Pendientes.md (blob actual íntegro), completadas.md, mapa, plan y documentación. No existe TASK-678. Se crea una tarea nueva; se amplían TASK-674, TASK-675, TASK-665 y TASK-677. No se duplican AUD-NG-324, AUD-NG-330 ni AUD-NG-331.

### TASK-678 — Construir un mapa arquitectónico canónico, completo y verificable
- Origen: AUD-NG-336 y AUD-NG-337.
- Prioridad: P1.
- Objetivo: documentar el grafo real de dependencias directas/indirectas entre HTML, JS, CSS, servicios, endpoints, contratos y fuentes de datos.
- Acción ejecutable: elegir una ruta canónica para MapaDependencias.md; separar el grafo vigente de la bitácora histórica; inventariar cada página/controlador/estilo/asset; documentar dependencias y consumidores; mapear cada acción a servicio/dispatcher/permiso y tablas; documentar el orden de carga por página y el orden de inicialización; vincular cada entrada a la versión/commit inspeccionado; actualizar repository-inventory, routing-and-paths y spreadsheets-schema.
- Criterios: cada dependencia tiene origen/destino verificable; no hay rutas inexistentes; cada página lista scripts/CSS y orden; cada operación lista servicio/acción/contrato y datos; las fuentes de datos tienen consumidores identificados; el mapa puede reproducirse desde el árbol y se valida en CI.

### Tareas existentes ampliadas
- TASK-674: comprobar que todas las rutas documentadas existen en el árbol real y que el mapa/generador no acepta manifiestos incompletos.
- TASK-675: documentar comandos, entorno, build/deploy, rootDir/clasp y pasos para registrar archivos nuevos; mantener exclusión de secretos.
- TASK-665: probar que inventario, rutas, dependencias y contratos corresponden con archivos y consumidores reales; detectar enlaces rotos.
- TASK-677: aportar firmas/contratos públicos reales al mapa y al validador.
- TASK-662: mantener contratos y endpoints sincronizados con los dispatchers y permisos reales.
- AUD-NG-324: ruta raíz incorrecta de MapaDependencias.md en la suite, ya registrada; no duplicar.
- AUD-NG-330: mapa/estructura basados en manifiesto estático, ya registrado; ampliar.
- AUD-NG-331: despliegue/exclusión no verificables, ya registrado; ampliar TASK-675.

## 7. Pruebas y límites

- Inspección manual: completadas.md:5121–5140; repository-inventory.md; routing-and-paths.md; staged-migration-procedure.md; spreadsheets-schema.md; AUDITORIAS/MapaDependencias.md:1–180 y secciones recientes; developer-service Code.gs:1747–1795 y 2261–2283; index.html:427–433; módulos JS y suite de regresión.
- Comparación de orden real: index.html carga config, persistence, api, games-adapter, ui-common, data e index-ui; se contrastó con initializationOrder estático.
- Verificación de existencia: MapaDependencias.md raíz, package.json, Makefile, Vite/Webpack config, scripts/build.js y configuración clasp; no existen.
- No ejecutados: Node, HTTP, navegador, GitHub Pages, Apps Script runtime, compilación, clasp, escaneo automático de enlaces ni consultas a hojas productivas.
- No se certifica que todos los enlaces estén libres de 404; la documentación lo afirma sin evidencia runtime.
- Código fuente: sin modificaciones.
- completadas.md y Pendientes.md: sin modificaciones.
- Rama base: sin modificaciones.

## 8. Continuidad

- Última tarea auditada: F8-Task15 / TAREA-MOD-05.
- Checkpoint inicial: C1.274.
- Checkpoint de cierre previsto: C1.275.
- Siguiente tarea exacta: F8-Task16 — implementar principios de independencia funcional y comunicación entre roles, marcada [X] en completadas.md desde línea 5144.
- Próxima acción: verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK16.md; si falta, auditar directamente backend/developer-service/Code.gs, backend/user-service/Code.gs y backend/academic-service/Code.gs contra separación de fuentes maestras, hojas funcionales por rol, vistas/proyecciones derivadas, contratos de comunicación y ausencia de copias inconsistentes.
- Commit de cierre: se confirmará consultando HEAD después de publicar el único commit que contiene este informe y el checkpoint.
