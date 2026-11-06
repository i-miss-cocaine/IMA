# Auditoría de tareas completadas - T-UX-11

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 05eb016f4ba1e149111091b47ed72ad97520e37d  
**Árbol de partida:** 7511da6a2db0efc225f3cd9c3b680f6c7fa6616d  
**Tarea:** T-UX-11 - Unificar la navegación contextual y conservar el estado de las vistas  
**Estado histórico:** [X] Completada (aparece dos veces en completadas.md, con el mismo alcance funcional).

## Dictamen

**NO CUMPLE.** El mecanismo genérico de navegación de vistas está incompleto y no está integrado de forma consistente. `initNoLoopHistoryManager` define un listener para estados `{view, params}`, pero no se encontró una llamada que lo inicialice en los módulos/páginas inspeccionados. El listener central de `setupCommonUI` no procesa esos estados. Tampoco se resuelve la ruta/hash inicial al cargar directamente ni se comunica un destino inválido: `switchActiveView` retorna silenciosamente cuando no encuentra el elemento.

La conservación del contexto también es defectuosa: `switchActiveView` guarda `stateParams` del destino dentro del caché de la vista saliente, y después solo restaura `scrollTop`; nunca restaura `cached.params`. El Docente mantiene una navegación propia (`navigateTo` y `navStack`) mientras los módulos Estudiante y Contabilidad no consumen el mecanismo común inspeccionado. No se demuestra un contrato compartido entre los cinco paneles.

## Evidencia del mecanismo común

**Archivo:** `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.

- **Líneas 281-385:** `handlePopState` dentro de `setupCommonUI`. Procesa estados `dashboard-section`, `hierarchical-nav`, modales y otros tipos explícitos, pero no procesa `event.state.view`.
- **Líneas 4864-4902:** `VIEW_STATES_CACHE` y `switchActiveView`.
  - Comprueba `viewId` y obtiene `targetEl`; si no existe, hace `return` sin mostrar error ni fallback.
  - Busca la vista actual y almacena `scrollTop` junto con `params: stateParams`; ese argumento representa los parámetros de la vista destino, no el snapshot de la vista actual.
  - Oculta vistas hermanas y muestra el destino.
  - Escribe `{view, params}` en history.state y agrega `#viewId` a la URL.
  - Al volver, solo utiliza `cached.scrollTop`; no lee `cached.params` ni restaura filtros, consulta, orden o paginación.
- **Líneas 4904-4917:** `initNoLoopHistoryManager` define un listener `popstate` que invoca `switchActiveView` para estados `view`, pero no se encontró llamada a `initNoLoopHistoryManager()` en `ui-common.js`, `student.js`, `teacher.js`, `accounting.js` ni en los dashboards revisados.
- El único uso adicional encontrado de `switchActiveView` dentro de `ui-common.js` es el callback de una actividad en torno a la línea 1827. No se encontró uso directo en los módulos de Estudiante, Docente o Contabilidad ni en los dashboards examinados.
- No se encontró un lector de `location.hash` que resuelva la vista inicial en los archivos revisados. Por tanto, escribir `#viewId` mediante pushState no demuestra que una carga directa o recarga restaure esa vista.

## Navegación divergente en Docente

**Archivo:** `js/teacher.js`, SHA `c475fce5afcd28fca23e7b64398ad32b17773746`.

- **Líneas 215-245:** define `window.navigateTo` y cambia secciones del panel, actualiza clases de navegación y escribe estados `{type:'dashboard-section', sectionId, navId}`.
- **Líneas 3220-3275:** `pushNav`, `popNav` y `syncNavWithState` mantienen un `navStack` propio y escriben estados `hierarchical-nav`.
- **Líneas 5997-6008:** sustituye el estado inicial con `history.replaceState`, navega a la sección académica y carga actividad.
- El listener central de `ui-common.js` sí conoce `dashboard-section` y `hierarchical-nav`, lo que permite una integración parcial para Docente. No convierte ese modelo en un contrato común para los otros paneles ni procesa el estado `view` de `switchActiveView`.

## Cobertura en paneles

- `js/student.js`, SHA `e2888cea60322e49a40b89adadb8010489605dcc`: no se encontraron referencias a `switchActiveView`, `VIEW_STATES_CACHE`, `history.pushState`, `history.replaceState` o `popstate`. La lógica de acceso/rol redirige al login en su inicialización, pero no implementa el estado contextual de listas/detalle revisado.
- `js/accounting.js`, SHA `a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7`: no se encontraron referencias a los mecanismos de estado de vistas/historial indicados.
- `dashboard-direccion.html`, SHA `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c`: la navegación visible del encabezado utiliza enlaces de página; no declara un mecanismo contextual común para listas/detalles.
- `dashboard-recursos-humanos.html`, SHA `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee`; `dashboard-contabilidad.html`, SHA `b7653b3bff71829f0f67cf47cb894413c56a444a`; `student-dashboard.html`, SHA `6379ea0ed39d71b89747a0280bb925fdf12202c1`; `teacher-dashboard.html`, SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`; `dashboard-secretaria.html`, SHA `fa0d8c23aace24a6acab2d4956398a7f5e1309b8`; `dashboard-coordinacion.html`, SHA `08de8e4eb150ee9f6aad536ca08e8f76f2e0e896`: se revisaron referencias de navegación/historial; no se encontró invocación del gestor `initNoLoopHistoryManager` ni un consumo general de `switchActiveView` en los módulos indicados.
- La navegación de Docente conserva un stack jerárquico específico; no hay evidencia equivalente en Estudiante, Contabilidad, Dirección y RH.

## Reconciliación con tareas relacionadas

- **AUD-NG-162:** cubre expiración/revocación de sesión y diferenciación frente a permisos insuficientes. No se crea otro hallazgo para esa causa; TASK-485 exige integración correcta del contrato al navegar.
- **T-UX-13 / TASK-483:** cubre menú lateral y rutas visibles por rol; no sustituye el enrutador, el historial ni el snapshot de vistas.
- **T-UX-14 / TASK-481 / TASK-482:** búsqueda global, autorización y renderizado de resultados. Se relacionan con la navegación al registro, pero no resuelven la restauración de contexto de listas.
- **T-UX-15:** filtros, vistas guardadas y paginación; no cubre por sí sola preservar los filtros al abrir/cerrar detalle.
- No se encontraron tareas existentes en Pendientes.md que cubran específicamente el gestor no inicializado, la resolución de hash directo y el almacenamiento incorrecto de parámetros de vista.
- Se crean **AUD-NG-188 / TASK-485** para el enrutador/historial/rutas directas y **AUD-NG-189 / TASK-486** para snapshot/restauración del estado de listas. Son causas separadas y verificables.

## Hallazgos

- **AUD-NG-188 (ALTO/P1):** el gestor de historial de `{view, params}` no se inicializa; el listener común no procesa ese estado; no se resuelven rutas hash directas y los destinos inválidos fallan silenciosamente.
- **AUD-NG-189 (ALTO/P1):** el caché guarda parámetros del destino en la vista saliente y no los restaura; el mecanismo solo recupera scroll y la navegación está fragmentada entre paneles.
- **TASK-485:** activar un enrutador contextual único con soporte de historial y rutas directas.
- **TASK-486:** preservar y restaurar el estado real de listas y vistas de detalle al navegar.

## Calidad y pruebas

- El código valida la existencia de `targetEl` antes de ocultar la vista actual, lo que evita ocultar contenido si el destino no existe, pero el fallo es silencioso.
- El caché global es volátil y solo conserva scroll; no constituye persistencia del contexto de lista.
- Los múltiples tipos de `history.state` y listeners requieren un contrato único para evitar que un tipo de estado sea ignorado.
- Inspección estática/manual de funciones, referencias y dashboards. No se ejecutaron navegador, DOM real, recarga, eventos popstate, navegación táctil/teclado, servicios ni pruebas automatizadas.
- No se modificó código fuente ni completadas.md.

## SHAs de respaldo

- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `js/teacher.js`: c475fce5afcd28fca23e7b64398ad32b17773746.
- `js/student.js`: e2888cea60322e49a40b89adadb8010489605dcc.
- `js/accounting.js`: a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7.
- `dashboard-direccion.html`: fefaa3bf7884288aef563cfb8aaf244e6cea8b7c.
- `dashboard-recursos-humanos.html`: 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee.
- `dashboard-contabilidad.html`: b7653b3bff71829f0f67cf47cb894413c56a444a.
- `student-dashboard.html`: 6379ea0ed39d71b89747a0280bb925fdf12202c1.
- `teacher-dashboard.html`: cbb9e6a272a7d8ad33f99727303305d950533e71.
- `dashboard-secretaria.html`: fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- `dashboard-coordinacion.html`: 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896.
- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `METODOLOGIA_DESARROLLO.md`: 214e8221bd076c4e89012636c105bffd5ca36467.
- `Pendientes.md` origen: 4d2f3cd3bbe391a716f085f77864b82b53d920a2.
- `Auditoria.txt` origen: 0f6950eced2a60f9d6aacf3c63d18f18a1d729ce.
- `MapaDependencias.md` origen: 1fe3250ecd4f5035e0f8a07f98188d9c4d97d08a.
- `AUDITORIA_COMPLETADAS_PLAN.md` origen: 4595bdbabefedfbc5d7b281d4f8c923cf0c8eaf2.
- `Contexto_personal.txt` origen: 01badf6fd4b3e79d1bd69493fa2cf66745a4fda9.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-485] Activar un enrutador contextual único con historial y rutas directas
- **Hallazgo de origen:** AUD-NG-188; T-UX-11.
- **Severidad:** Alto.
- **Objetivo:** hacer que navegación, URL y estado de vista representen el mismo destino.
- **Acción ejecutable:** inicializar initNoLoopHistoryManager en la carga común; procesar estados {view, params} desde el listener central; resolver hash/ruta inicial al cargar; validar destinos y mostrar error controlado cuando no existan; normalizar navegación entre paneles.
- **Archivos/módulos afectados:** js/ui-common.js, módulos de dashboard y handlers de navegación.
- **Dependencias y riesgos:** AUD-NG-162 para diferenciar sesión expirada de permiso insuficiente; TASK-483 para visibilidad de rutas.
- **Alcance:** router, historial del navegador y navegación directa.
- **Criterios de aceptación:** abrir URL directa muestra vista correcta; atrás/adelante restaura destino; vista inválida produce estado/error explícito; listener se inicializa una sola vez; navegación no crea bucles.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de carga directa, pushState/popstate y destinos inválidos.

### [TASK-486] Preservar y restaurar el estado real de listas y vistas de detalle
- **Hallazgo de origen:** AUD-NG-189; T-UX-11.
- **Severidad:** Alto.
- **Objetivo:** conservar filtros, búsqueda, orden, página y contexto al entrar a detalle y regresar.
- **Acción ejecutable:** definir snapshot por vista/lista; capturar parámetros de la vista saliente antes de navegar; restaurar snapshot al regresar; evitar almacenar parámetros del destino bajo la vista incorrecta; unificar comportamiento entre paneles.
- **Archivos/módulos afectados:** js/ui-common.js y consumidores de listas/detalles en dashboards.
- **Dependencias y riesgos:** TASK-485 para router/historial; TASK-429 para paginación restaurable.
- **Alcance:** estado de listas, filtros y vistas de detalle.
- **Criterios de aceptación:** entrar a detalle y regresar conserva búsqueda, filtros, orden, página y scroll; cambios de datos se reconcilian sin perder contexto; snapshot está aislado por vista/usuario; pruebas cubren paneles distintos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de navegación ida/vuelta en dashboards.
