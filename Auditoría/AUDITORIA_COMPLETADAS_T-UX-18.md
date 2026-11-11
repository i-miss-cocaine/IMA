# Auditoría de tareas completadas: T-UX-18

- **Fecha:** 2026-11-06.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `79127202e3407e8d1b3ea37c2745f945a4c43e90` (checkpoint C1.60 / cierre T-UX-17).
- **Rama base protegida:** `NG_beta_0.0.0.1`, HEAD `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Especificación:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- **Código:** `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`; `css/style.css`, SHA `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`.

## Dictamen

**T-UX-18: NO CUMPLE.** La tarea aparece marcada [X], pero no existe un sistema común completo de campos de formulario, la tabla compartida no implementa estados de carga/error, y el modal de detalle compartido está incompleto, sin consumidores y con renderizado inseguro. No se acreditó que las acciones por fila operen correctamente sobre el registro esperado.

## Requisitos contrastados

La entrada [X] T-UX-18 en `completadas.md` (bloque de T-UX-17 a T-UX-20) exige:

1. Normalizar los estados visuales y funcionales de formularios.
2. Mantener coherencia entre etiquetas, validaciones y mensajes de error.
3. Unificar los estados de carga, éxito, error y ausencia de datos.
4. Mantener un comportamiento consistente de tablas y acciones por fila.

Criterios de aceptación: formularios equivalentes con etiquetas/validaciones/mensajes coherentes; tablas con carga/vacío/error; acciones por fila sobre el registro correcto.

## Evidencia técnica

### 1. No existe un contrato compartido de campos de formulario

- En `css/style.css:749-809` hay reglas generales para `select` y algunos selectores concretos, pero no un conjunto común de estilos/estados para `input`, `textarea`, `label`, ayudas y mensajes de error. Las reglas globales de foco están en `996-1010`; no constituyen un contrato de campo ni representan estados de validación.
- No se encontraron clases comunes del tipo `.form-field`, `.form-label`, `.form-control`, `.form-error` ni un helper de renderizado de campos en `js/ui-common.js`.
- Se verificó variación entre consumidores: `student-dashboard.html:82-105` utiliza, por ejemplo, `p-3` y `rounded-xl`; `teacher-dashboard.html:219-278` usa un patrón `p-3` y etiquetas `font-medium`; `js/accounting.js:124-158` utiliza `p-2`, `text-xs` y `font-bold`; `dashboard-recursos-humanos.html:190-258` usa `p-2.5`; `dashboard-secretaria.html:367-423` combina `px-3 py-2`, `text-sm` y variantes de color. Las diferencias son visibles en controles equivalentes.
- En los formularios representativos revisados no se encontraron atributos `aria-invalid` ni `aria-describedby` para asociar errores. Parte de las etiquetas tampoco utiliza `for`/ID de control. La asociación semántica de etiquetas/errores se solapa con T-UX-19 y debe resolverse coordinadamente, sin duplicar su alcance.

**Impacto:** la presentación y retroalimentación depende de clases definidas en cada vista; los estados inválido/éxito/deshabilitado y los mensajes no tienen una representación común verificable. El criterio de coherencia interdepartamental no está demostrado.

### 2. La tabla compartida solo cubre renderizado básico y vacío

En `js/ui-common.js:1998-2069`, `window.renderPaginatedTable(containerId, data, options)`:

- Calcula paginación local o recibe metadatos remotos.
- Exige `options.renderRow`; genera cabeceras y filas mediante concatenación HTML.
- Cuando `pageData.length === 0`, presenta únicamente “No se encontraron registros”.
- No define API ni renderizado para carga, éxito, error de consulta, reintento o respuesta inválida.
- En modo remoto llama a `fetchRemotePage(targetPage, pageSize)`; no transmite filtros/orden ni estado de consulta.
- Delegación de acciones: `renderRow(item, startIndex + idx)`. El helper no define un contrato de acción/ID de registro ni verifica qué identificador usa el callback. No se puede acreditar el criterio de acción por fila con esta implementación aislada.

La hoja de estilos `css/style.css:413-436` solo define contenedor, encabezados y celdas de `.table-ima`. Existen estilos genéricos de skeleton en `603-639`, y `renderUIProgressSkeleton` en `js/ui-common.js:5147-5165`, pero no forman un ciclo completo de estados de tabla ni están conectados por este paginador.

### 3. Reconciliación de tabla con tareas existentes

- La falta de consumidores de `renderPaginatedTable`, la integración remota, filtros/orden, estados y reintento ya están registrados en **AUD-NG-201/AUD-NG-202 y TASK-429** (incluye ampliación C1.55). La especificación vigente de TASK-429 contempla expresamente estados diferenciados de carga/error/vacío y reintento, además de integrar el motor de filtros y la paginación.
- **No se crea una tarea duplicada.** Se registra AUD-NG-207 como evidencia específica de T-UX-18 y se vincula a TASK-429.
- TAREA-04 y FASE2-T10 son antecedentes; TASK-486 conserva el alcance de snapshot/restauración de listas al navegar a detalle. TASK-453 se limita a bandejas documentales.

### 4. Modal compartido de detalle incompleto, no integrado e inseguro

En `js/ui-common.js:5303-5365`, `window.renderSharedDetailViewModal(config)`:

- El contrato solo lee `modalId`, `title`, `subtitle`, `badgeText`, `badgeColor` y `fields`. No procesa `config.actions`, no define callbacks ni expone un ID de registro para acciones.
- El comentario de cabecera promete “acciones por fila”, pero no hay código que construya o conecte acciones.
- `title`, `subtitle`, `badgeText`, `badgeColor`, `f.label`, `f.value` y `modalId` se concatenan en HTML/atributos/handlers sin escape ni allowlist. `modal.innerHTML` recibe esas cadenas. Si algún consumidor entrega contenido no confiable, puede producir inyección HTML/atributos o XSS. No se demuestra explotación en ejecución porque el helper no tiene consumidores encontrados; se registra como riesgo latente de integración.
- El botón de cerrar y el cierre por fondo solo agregan `hidden`; no restauran explícitamente el foco. `trackModalFocus()` conserva el elemento activo, pero el helper no enfoca el diálogo ni define ciclo de foco. El cierre por Escape depende del listener global.
- Al reutilizar un modal existente se elimina `hidden`, pero no hay gestión de estado de carga/error/ausencia de campos ni contrato de cierre/teardown.

### 5. Falta de integración y pruebas conductuales

- Se consultaron los 20 módulos JavaScript distintos de `ui-common.js` en el árbol del repositorio, incluidos `api.js`, `student.js`, `teacher.js`, `secretary.js`, `accounting.js` y los demás módulos. No se encontró ninguna llamada a `renderSharedDetailViewModal`, `renderPaginatedTable` ni `setupAdvancedTableFilters`.
- Se revisaron 13 páginas HTML de panel/entrada (Estudiante, Docente, dashboards departamentales, dashboard dinámico, desarrollador, admisión e inicio). No se encontraron llamadas a esos helpers.
- `runUXSuiteTests` en `js/ui-common.js:1843-1936` solo cubre UX-01 a UX-09; no existe un caso T-UX-18 que ejercite formularios, tabla o modal de detalle.
- Las suites `tests/regression/academic-grading-suite.js` y `tests/regression/modular-dashboard-suite.js` no contienen referencias a los componentes T-UX-18 revisados.

## Hallazgos y tareas

- **AUD-NG-207 (MEDIO/P2):** el paginador compartido no tiene estados de carga/error/reintento ni contrato de acción por registro; no está integrado en los consumidores revisados. Se vincula a **TASK-429**, que ya contiene el alcance correctivo; no se duplica.
- **AUD-NG-208 (MEDIO/P2):** ausencia de contrato compartido de campos/estados de formulario y variación de estilos entre dashboards. Se crea **TASK-492** para normalización frontend, sin duplicar validaciones de negocio de TASK-307, ayudas contextuales de TASK-130 ni el sistema de diseño general de TASK-430.
- **AUD-NG-209 (ALTO/P1):** modal de detalle compartido sin acciones reales ni consumidores, con concatenación insegura de datos y manejo de foco incompleto. Se crea **TASK-493**. Se coordina con TASK-482 (patrón seguro específico del Omnibox), TASK-486 (restauración de contexto al navegar), T-UX-19 y TASK-484, sin duplicar esos alcances.

## Pruebas y límites

- **Realizadas:** inspección estática/manual de la especificación, funciones compartidas, estilos CSS, páginas y módulos consumidores seleccionados/identificados en el árbol; búsqueda de llamadas y reconciliación con tareas existentes.
- **No ejecutadas:** navegador/DOM real, pruebas visuales por viewport, validación de formularios en ejecución, flujos de carga/error de tabla, callbacks de acciones por fila, pruebas XSS en navegador, foco/teclado real ni suites automatizadas.
- **Código fuente:** sin modificaciones.
- **completadas.md / METODOLOGIA_DESARROLLO.md / ChangesLogs.txt:** sin modificaciones.
- **Pendientes.md:** se agregan TASK-492 y TASK-493; TASK-429 conserva la cobertura de la tabla.

## Cierre

- **Resultado:** T-UX-18 NO CUMPLE.
- **Hallazgos:** AUD-NG-207..209.
- **Tareas:** TASK-429 (existente), TASK-492 y TASK-493 (nuevas).
- **Progreso:** 59/183 identificadores auditados; 124 pendientes.
- **Siguiente tarea:** T-UX-19 - Verificar la accesibilidad y corregir las barreras detectadas.


---

## Tareas ejecutables derivadas de los hallazgos

> Se formalizan las tres líneas correctivas identificadas en esta auditoría. TASK-429 ya cubre la tabla compartida; TASK-492 y TASK-493 son los registros creados para campos y modal. Se conservan sus IDs y no se crea una tarea funcional paralela.

### [TASK-429] Completar e integrar el motor compartido de tablas
- **Hallazgo de origen:** AUD-NG-207 (MEDIO/P2).
- **Severidad:** Media. **Objetivo:** proporcionar tablas consistentes con estados de consulta y acciones por registro verificables en los consumidores.
- **Acción ejecutable:** ampliar `renderPaginatedTable` con estados de carga, vacío, error, reintento y respuesta inválida; definir contrato de acciones que transporte el ID estable del registro; integrar filtros/orden/paginación remota y conectar consumidores reales; evitar concatenar datos no confiables en HTML sin escape.
- **Archivos/módulos:** `js/ui-common.js` (`renderPaginatedTable`, `setupAdvancedTableFilters`); `css/style.css`; dashboards y módulos consumidores; callbacks de consulta remota.
- **Dependencias/riesgos:** coordinar con TASK-486 para restauración de contexto y TASK-453 para bandejas documentales; riesgo de acciones sobre índice visual en vez de ID persistente y estados que quedan obsoletos.
- **Alcance:** motor de tablas compartido e integración; no duplicar filtros, paginación ni navegación de detalle existentes.
- **Criterios de aceptación:** cada consulta muestra loading/success/empty/error y permite retry; filtros y orden se reflejan en consulta remota; cada acción opera sobre ID correcto; consumidores usan el helper; errores y contenido de fila se renderizan de forma segura; pruebas de paginación, cambio de página, error, vacío y callbacks.
- **Prioridad:** P2 (hallazgo AUD-NG-207). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el helper solo cubre renderizado/paginación básica y vacío, sin ciclo de estados ni consumidores localizados.

### [TASK-492] Normalizar contrato visual y semántico de campos de formulario
- **Hallazgo de origen:** AUD-NG-208 (MEDIO/P2); coordinación con AUD-NG-211 de T-UX-19.
- **Severidad:** Media. **Objetivo:** mantener coherencia de etiquetas, controles, ayudas, validación y mensajes entre formularios de todos los dashboards.
- **Acción ejecutable:** definir clases y/o helper común para campo, label, control, ayuda, error, éxito, disabled y required; normalizar espaciado, tipografía y estados visuales; asociar cada control con label e instrucciones/errores mediante IDs, `for`, `aria-describedby` y `aria-invalid`; migrar formularios representativos sin duplicar validaciones de negocio.
- **Archivos/módulos:** `js/ui-common.js`; `css/style.css`; formularios en `student-dashboard.html`, `teacher-dashboard.html`, `dashboard-recursos-humanos.html`, `dashboard-secretaria.html` y vistas adicionales verificadas.
- **Dependencias/riesgos:** TASK-307 (validaciones de negocio), TASK-130 (ayudas), TASK-258 (accesibilidad) y TASK-430 (sistema de diseño); riesgo de romper estilos locales y duplicar mensajes.
- **Alcance:** contrato de presentación y semántica de campos; no sustituye reglas de validación de dominio ni sistema de diseño general.
- **Criterios de aceptación:** controles equivalentes comparten patrón visual; labels se asocian al control; errores y ayudas se anuncian y vinculan semánticamente; estados inválido/deshabilitado/éxito son consistentes; pruebas en formularios de varios roles, teclado y lector de pantalla.
- **Prioridad:** P2 (hallazgo AUD-NG-208). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; no se encontró contrato común de campos y se observaron patrones divergentes entre vistas.

### [TASK-493] Completar y asegurar el modal compartido de detalle
- **Hallazgo de origen:** AUD-NG-209 (ALTO/P1); coordinación con T-UX-19/AUD-NG-211.
- **Severidad:** Alta. **Objetivo:** ofrecer un modal reutilizable, seguro, accesible e integrado que permita consultar detalles y ejecutar acciones sobre el registro correcto.
- **Acción ejecutable:** definir contrato explícito para acciones/callbacks e ID del registro; escapar texto y atributos o construir DOM mediante APIs seguras; aplicar allowlist para atributos/clases; implementar foco inicial, confinamiento, cierre Escape, restauración de foco y teardown; conectar consumidores reales y estados de carga/error.
- **Archivos/módulos:** `js/ui-common.js` (`renderSharedDetailViewModal`, `trackModalFocus`); `css/style.css`; consumidores de dashboards y navegación.
- **Dependencias/riesgos:** TASK-482 (patrón seguro Omnibox), TASK-486 (restauración de contexto), TASK-258 (accesibilidad), TASK-484 (pruebas UX); riesgo de XSS, pérdida de foco, callbacks huérfanos y acción sobre registro equivocado.
- **Alcance:** componente de detalle compartido; no duplicar seguridad específica del Omnibox ni navegación de retorno ya cubierta por TASK-486.
- **Criterios de aceptación:** no se inserta HTML no confiable; acciones declaradas se ejecutan sobre ID persistente; modal anuncia título y descripción; foco entra, permanece y retorna correctamente; Escape/cierre operan; listeners se desmontan; consumidores integrados; pruebas de XSS, teclado, foco, acciones y estados.
- **Prioridad:** P1 (hallazgo AUD-NG-209). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; helper sin acciones ni consumidores detectados, con concatenación insegura y gestión de foco incompleta.

### Reconciliación y límites
- **TASK-429:** mantiene tabla, estados, filtros, paginación e integración; TASK-486/TASK-453 conservan sus alcances específicos.
- **TASK-492:** normalización de campos; coordina sin duplicar TASK-307, TASK-130 y TASK-430.
- **TASK-493:** modal compartido; coordina sin duplicar TASK-482, TASK-486, TASK-258 y TASK-484.
- **Pruebas:** inspección estática/manual; no se ejecutaron navegador/DOM, pruebas visuales, callbacks, XSS en runtime, foco/teclado ni suites automatizadas.
- **Estado:** T-UX-18 permanece NO CUMPLE hasta que se demuestre implementación e integración de los tres componentes.
