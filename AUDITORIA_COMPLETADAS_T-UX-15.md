# Auditoría de tareas completadas - T-UX-15

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**HEAD de partida de esta auditoría:** c7028852ec21673f0ee4156a01ccceb115c47602  
**Dictamen:** NO CUMPLE

## 1. Especificación auditada

Fuente: `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`. T-UX-15 aparece dos veces en el archivo, con el mismo título y alcance. Se auditaron los seis requisitos funcionales y cuatro criterios de aceptación:

1. Filtrar por campos pertinentes a cada módulo.
2. Combinar filtros con resultados predecibles.
3. Mostrar filtros activos y permitir eliminarlos.
4. Mantener filtros durante paginación y navegación al detalle.
5. Guardar vistas reutilizables cuando exista una necesidad real.
6. Diferenciar vistas personales y compartidas.

## 2. Evidencia de código

### 2.1 Paginación: `js/ui-common.js:1999-2067`

`window.renderPaginatedTable(containerId, data, options)` implementa dos caminos:

- Local: calcula el total a partir de `data.length` y aplica `slice` según `currentPage` y `pageSize`.
- Remoto: se activa cuando `options.fetchRemotePage` es una función; el conjunto recibido se trata como página actual y el total depende de `options.remotePagination`.

Los botones anterior/siguiente llaman al callback remoto con solo `targetPage` y `pageSize`. No hay un contrato común para transmitir filtros y ordenamiento. El componente tampoco gestiona estados de carga, error/reintento ni normaliza una página actual que haya quedado fuera del nuevo total. El modo remoto depende de que el consumidor implemente y mantenga el estado externo.

La falta de consumidores localizados de `renderPaginatedTable` y la dependencia de un callback externo ya fue documentada en la auditoría FASE2-07; no se crea un segundo hallazgo para esa misma ausencia. Se conserva la ampliación previa de TASK-429.

### 2.2 Motor de filtros: `js/ui-common.js:2128-2195`

`setupAdvancedTableFilters(containerId, config)` recibe `data`, `filterFields` y `onFilterChange`.

Defectos comprobables:

- `filterFields` se asigna, pero no se consulta en ninguna operación posterior. No restringe ni valida los campos que pueden filtrarse.
- `applyFilters` convierte los valores a texto mediante `normalizeSearchString` y solo compara subcadenas. No hay operadores ni tratamiento específico de números, booleanos, fechas, rangos o valores nulos.
- Los filtros se combinan implícitamente con AND. La semántica no se documenta ni permite configuración por módulo.
- `setFilter` utiliza `if (!value)`; por tanto, los valores numéricos `0` y booleanos `false` eliminan el filtro en lugar de aplicarlo.
- `item[field] || ''` transforma también `0` y `false` en cadena vacía, impidiendo su búsqueda correcta.
- El helper expone `removeFilter`, `clearAllFilters` y `getActiveFilters`, pero no genera controles visibles, etiquetas/chips, contadores ni acciones accesibles para que el usuario gestione los filtros.
- No implementa ordenamiento.
- No se integra con `renderPaginatedTable`; el callback de filtrado entrega los registros filtrados a un consumidor externo, sin sincronizar página, orden o consulta remota.

Se revisaron referencias en `js/teacher.js`, `js/student.js`, `js/accounting.js` y `js/secretary.js`; no se localizaron llamadas directas a los helpers. La búsqueda indexada tampoco devolvió referencias. Este resultado no se presenta como barrido exhaustivo de todos los archivos del repositorio.

### 2.3 Vistas guardadas: `js/ui-common.js:2170-2195`

`saveView` y `loadSavedView` persisten únicamente `currentFilters`:

- La clave de almacenamiento es `saved_views_` + `containerId`.
- No incluye `userId`, rol ni ámbito departamental.
- Dos identidades que utilicen el mismo navegador y el mismo contenedor comparten el mismo catálogo local.
- No hay distinción de vistas personales, compartidas o institucionales.
- No existen operaciones completas para listar, renombrar, duplicar, eliminar, compartir o revocar.
- No se conservan criterios de ordenamiento, paginación, tamaño de página ni otros parámetros de la vista.
- La lectura de JSON corrupto se ignora silenciosamente; la escritura `localStorage.setItem` no tiene manejo de excepción.

El mecanismo es un almacenamiento local de filtros, no un sistema de vistas reutilizables multiusuario.

## 3. Reconciliación de tareas

| Tarea | Alcance existente | Decisión |
|---|---|---|
| FASE2-T10 | Paginación eficiente y consultas escalables | Antecedente histórico; FASE2-07 ya auditó el modo remoto |
| TAREA-04 | Optimización de tablas extensas | Antecedente histórico; no crear tarea paralela |
| TASK-429 | Tablas, filtros, ordenamiento, paginación y rendimiento | Ampliar con hallazgos T-UX-15 |
| TASK-249 | Vistas personalizadas de reportes institucionales y RBAC | Mantener separado; no cubre tablas operativas genéricas |
| TASK-486 | Snapshot/restauración de estado al navegar a detalle | Mantener separado; TASK-429 debe exponer estado restaurable |
| TASK-453 | Filtros/paginación de bandejas documentales | Mantener su alcance específico |
| T-UX-25 / TASK-422 | Preferencias generales de usuario | No sustituye ciclo de vida de vistas de tabla |

La auditoría FASE2-07 registró previamente que `renderPaginatedTable` no tenía consumidores localizados y que el modo remoto dependía de callback externo no integrado. Ese hallazgo se conserva sin duplicación. Los hallazgos nuevos de T-UX-15 se agregan a TASK-429.

## 4. Hallazgos

### AUD-NG-201 - ALTO/P1
**Motor de filtros incompleto y sin integración con tablas/paginación.**

El helper no aplica la allowlist declarada, no interpreta tipos de datos, pierde los valores 0/false, no implementa ordenamiento ni presentación de filtros activos y no sincroniza criterios con paginación local/remota.

**Remediación:** ampliar TASK-429.

### AUD-NG-202 - MEDIO/P2
**Vistas guardadas de tablas sin aislamiento de identidad ni compartición.**

El almacenamiento local usa únicamente containerId y guarda solo filtros. No distingue usuario, rol, ámbito ni vistas personales/compartidas, y no ofrece gestión completa.

**Remediación:** ampliar TASK-429. Mantener separado TASK-249, específico del visor de reportes.

## 5. Calidad y riesgos

- La separación de filtros y paginación impide garantizar que el conjunto visible, el contador y la página correspondan a los mismos criterios.
- El uso de filtros locales sobre arrays completos no es escalable para tablas grandes.
- Los valores numéricos cero y booleanos falsos no se pueden filtrar correctamente.
- Las vistas guardadas pueden mezclarse entre identidades que comparten navegador.
- No hay evidencia de compartir vistas con validación de permisos.
- La ausencia de UI conectada impide considerar que las APIs internas satisfacen los criterios de aceptación visibles.

## 6. Pruebas y límites

Inspección estática/manual de código y reconciliación documental. No se ejecutaron navegador/DOM, pruebas de filtros, paginación local/remota, almacenamiento multiusuario, compartición, permisos activos, mediciones de rendimiento ni suites automatizadas. No se modificó código fuente.

## 7. Archivos y SHAs

- `js/ui-common.js`: `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- `js/teacher.js`: `c475fce5afcd28fca23e7b64398ad32b17773746`.
- `js/student.js`: `e2888cea60322e49a40b89adadb8010489605dcc`.
- `js/accounting.js`: `a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7`.
- `js/secretary.js`: `08a81266957b4c18cc25f8ba6749eac30a8f2c2c`.
- `completadas.md`: `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- `Pendientes.md` antes de la ampliación: `4039a6dc496848c5cf6b112bc41b681d80488bb7`.
- `Pendientes.md` después de la ampliación: `2309c594e96cec5f35563776bcd0752d83882f21`.

## 8. Cierre

T-UX-15 queda auditada con dictamen **NO CUMPLE**. TASK-429 fue ampliada con AUD-NG-201 y AUD-NG-202. No se creó un TASK nuevo. La siguiente tarea de la secuencia es T-UX-16.
