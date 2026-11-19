# AUDITORÍA TASK-638 — C1.298: trazabilidad TASK/EXAM y persistencia de categorías

- **Sesión:** `IMA-AUDIT-20261109-1222Z-01`; checkpoint inicial C1.297; cierre de esta iteración C1.298.
- **Repositorio/rama:** `i-miss-cocaine/IMA` / `NG_beta_0.0.0.1_work`.
- **HEAD de partida verificado:** `103c02dc0ba31c0d3ceb2e5c5a39c1a747cc67f9`; tree `ef7ec3fd8ca0d24cc75aeb2e0f5777a8192f8345`, 1.023 blobs, no truncado.
- **Rama base:** `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`; comparación: 370 commits adelante, 0 detrás.
- **Tarea vigente:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo; PM-00; estado En ejecución.
- **Requisito íntegro:** `pendientes/Contabilidad/Pendientes.md`, TASK-638. Exige mapear dependencias por archivo (HTML, CSS, imágenes, fuentes, imports, rutas, endpoints, acciones backend, contratos y servicios externos), documentar origen/destino exactos, distinguir referencias verificadas/inferidas, registrar consumidores/proveedores y no declarar funcionalidad sin evidencia.
- **Fuentes principales:** `backend/task-service/Code.gs` SHA `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe`; `backend/exam-service/Code.gs` SHA `1d93296628fae31f680004f637897e2b1314a64c`; `js/student.js` SHA `e2888cea60322e49a40b89adadb8010489605dcc`; `js/teacher.js` SHA `c475fce5afcd28fca23e7b64398ad32b17773746`; `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`.

## 1. Continuidad y auditoría de la iteración anterior (C1.297)

- HEAD actual coincide exactamente con el commit que contiene C1.297: `103c02dc0ba31c0d3ceb2e5c5a39c1a747cc67f9`; padre `5bf51a6b0c12fd62edc42385c55976789d00a423`.
- El commit C1.297 contiene los ocho archivos que enumera su informe: Auditoria.txt, informe C1.297, checkpoint Parte_0002, índice, mapa, changelog, inventario y tareas_auditoria.txt. No contiene código ni cambios de los backlogs departamentales.
- El tree actual contiene 1.023 blobs. El inventario C1.297 declara 1.023 rutas y contiene el informe C1.297; no se detectó discrepancia de conteo ni omisión en esta verificación de continuidad.
- TASK-638 permanece En ejecución y la auditoría C1.297 no la declara cerrada. TASK-637 se conserva como prerrequisito completado; no se encontró evidencia nueva que justifique reabrirla.
- **Corrección de trazabilidad no destructiva:** en el checkpoint C1.297 aparece una errata en el nombre de la rama base (`NG_beta_0.0.1`); el nombre correcto es `NG_beta_0.0.0.1`. El SHA registrado, `44d9891132332e692dbe2ba8602b41f50a508a59`, sí corresponde a la rama base verificada. Se conserva el checkpoint histórico y se deja esta aclaración en C1.298.
- La ampliación de TASK-636 por AUD-NG-364/365 está documentada en `tareas_auditoria.txt`; el backlog original de Otros conserva su ID y estado Pendiente. No se crea un ID duplicado.

## 2. TASK — rutas, autorización, consumidores y persistencia

El servicio declara nueve acciones en `PUBLIC_ACTIONS` (Code.gs, bloque inicial): `getStudentTasks`, `getDriveStorageQuotaMetricsReport`, `getAllTasks`, `listProjects`, `loadProject`, `getAllStudentProjects`, `getVirtualClassrooms`, `getPosts` y `getStudyMaterials`. El dispatcher `doPost` llama a `validateRolePermission` antes de ejecutar el handler. Para las acciones públicas, el validador retorna autorizado antes de exigir token, claims o control contextual.

| Acción / handler | Consumidor identificado | Persistencia / dependencia | Dictamen de autorización |
|---|---|---|---|
| `getStudentTasks` (línea 613) | `js/student.js:1228` | Hojas `Tareas` y `Entregas`; helper `isInTeacherList`; devuelve datos de tarea y entrega | La acción pública permite que `userId`, grado y sección procedan del payload; el handler usa el ID recibido cuando no hay claims. AUD-NG-002/TASK-636. |
| `getAllTasks` (1177) | `js/teacher.js:3015,3315,3627,4594` | Hoja `Tareas`; filtro opcional `profesorId` del cliente | Sin filtro devuelve todas las tareas; al ser pública, no exige identidad docente. AUD-NG-002/TASK-636. |
| `listProjects` (1296) | No se encontró callsite en los consumidores JS revisados en C1.296/C1.298 | Hoja `pseudocode`; fallback a carpeta del estudiante mediante Drive | No está en PUBLIC_ACTIONS; exige token y control contextual, pero la propagación frontend del token sigue afectada por AUD-NG-001. |
| `loadProject` (1371) | `js/teacher.js:4870` | Hoja `pseudocode`; fallback `DriveApp.getFileById(fileId)` | Pública; el fallback lee por fileId sin comprobar propietario. AUD-NG-002/TASK-636. |
| `getAllStudentProjects` (1407) | `js/teacher.js:4827` | Drive: búsqueda recursiva desde `DRIVE_FOLDER_ID`, carpetas de grado/sección/alumno y archivos `.psc` | Pública; grado/sección son filtros aportados por el cliente y la respuesta incluye fileId y metadatos de alumnos. AUD-NG-002/TASK-636. |
| `getVirtualClassrooms` (1476) | Matriz de consumidores previa TASK | Hoja `AulasVirtuales` | Pública; filtros de profesor/grado/sección no se derivan de claims. AUD-NG-002/TASK-636. |
| `getPosts` (1526) | `js/student.js:769`; consumidores de publicaciones docentes | Hoja `PublicacionesAnuncios` | Pública; `authRole` e `includeDrafts` son controlados por el payload. Un valor `authRole=Administrador` hace que el handler trate al llamante como docente/administrador para incluir borradores y publicaciones programadas. AUD-NG-002/TASK-636. |
| `getStudyMaterials` (1632) | `js/student.js:807` | Hoja `MaterialesEducativos`; devuelve `archivoUrl` y `driveId` | Pública; no deriva ámbito/propiedad de claims y devuelve recursos según filtros opcionales del cliente. AUD-NG-002/TASK-636. |
| `getDriveStorageQuotaMetricsReport` | No se reaudita su lógica aquí | Drive y métricas de almacenamiento | Su exposición pública ya está registrada en AUD-NG-003/TASK-636; no duplicar. |

Los callsites adicionales TASK de escritura/entrega identificados en `js/student.js` y `js/teacher.js` se mantienen pendientes de trazar individualmente hasta cada handler, helper, permiso y hoja/archivo. Este bloque no declara cobertura total de los 287+ callsites.

## 3. EXAM — rutas públicas, handlers y persistencia

`backend/exam-service/Code.gs` declara cuatro acciones públicas: `getStudentExams`, `getAllExams`, `getEvaluationCategories` y `getRubrics` (PUBLIC_ACTIONS, línea 75). El dispatcher `doPost` enruta las cuatro; `getEvaluationCategories` y `getRubrics` aparecen en los casos de dispatcher (líneas 377 y 379).

| Acción / handler | Consumidor identificado | Persistencia / respuesta | Dictamen |
|---|---|---|---|
| `getAllExams` (609) | `js/teacher.js:3016,3316,3628,4595` | Hoja `Examenes`; filtro opcional por `profesorId` enviado por el cliente | Pública; sin filtro retorna todos los exámenes y metadatos. AUD-NG-356/TASK-685. |
| `getStudentExams` (1057) | `js/student.js:1241` | Hojas `Examenes` y `EntregasExamen`; devuelve calificación y comentario de entrega | Pública; usa `userId` del payload cuando no hay claims. AUD-NG-356/TASK-685. |
| `getEvaluationCategories` (1278) | No se identificó un callsite directo en los JS consultados; endpoint sigue siendo invocable por el dispatcher | Hoja `CategoriasEvaluacion`; helper `getOrCreateSheet` | Pública; recibe `ambito`, pero no lo aplica al filtrar la respuesta. Hallazgo AUD-NG-367. |
| `getRubrics` (1340) | No se identificó un callsite directo en los JS consultados; endpoint sigue siendo invocable por el dispatcher | Hoja `RubricasEvaluacion`; devuelve criterios JSON y filtra opcionalmente por asignatura | Pública; no se documentó un control de ámbito en esta ruta. |

### AUD-NG-366 — MEDIO/P2 — Inicialización de categorías duplica la fila de encabezado

Evidencia estática:
- `getOrCreateSheet` (helper desde línea 26) crea `CategoriasEvaluacion` cuando falta y agrega inmediatamente la fila de encabezados.
- `getEvaluationCategories` (1278; bloque de inicialización 1281–1292) llama al helper, lee el rango y, cuando `data.length <= 1`, vuelve a agregar la misma fila de encabezados antes de insertar cuatro categorías predeterminadas.
- Por tanto, en una hoja recién creada o que solo contiene encabezado, la inicialización agrega un segundo encabezado como si fuera un registro. Las consultas posteriores incluyen esa fila en `data.slice(1)` y la convierten en una categoría con ID/nombre de encabezado y porcentaje 0.
- La acción está en PUBLIC_ACTIONS, por lo que el endpoint no exige sesión para alcanzar esta inicialización.

**Impacto:** datos de configuración inconsistentes y una categoría espuria visible en consultas posteriores; la condición puede activarse en primera inicialización o cuando la hoja solo tiene encabezado. No se ejecutó Apps Script para confirmar el resultado en una hoja real.

**Tarea derivada:** ampliar F9-TASK03 existente en `pendientes/Docente/Pendientes.md`; no crear un ID duplicado.

### AUD-NG-367 — MEDIO/P2 — El filtro de ámbito de categorías se recibe pero no se aplica

Evidencia estática:
- `getEvaluationCategories(payload)` desestructura `ambito`, pero no vuelve a referenciar esa variable.
- La respuesta recorre todas las filas de `CategoriasEvaluacion` sin filtrar por ámbito; el esquema contiene una columna `Ambito`.
- F9-TASK03 exige configuración de métodos y ponderaciones por nivel educativo, grado, asignatura y período. El handler actual no acredita aislamiento ni selección por ámbito solicitado.

**Impacto:** una llamada que solicita un ámbito puede recibir categorías de otros ámbitos; no se afirma que existan registros reales de varios ámbitos porque no se inspeccionó la hoja productiva.

**Tarea derivada:** ampliar F9-TASK03 existente; no crear un ID duplicado.

## 4. Reconciliación de hallazgos y tareas

- AUD-NG-002/TASK-636 conserva las rutas públicas TASK, controles por payload, propiedad de proyectos y confianza en `authRole`; no se crea duplicado.
- AUD-NG-356/TASK-685 conserva la exposición de EXAM y los datos de entrega; no se crea duplicado.
- AUD-NG-366 y AUD-NG-367 son hallazgos nuevos de integridad/contrato de categorías.
- F9-TASK03 se amplía con inicialización idempotente sin encabezados duplicados, concurrencia segura, filtro por ámbito y pruebas para hoja inexistente, vacía, solo encabezado, poblada y llamadas concurrentes.
- TASK-638 permanece En ejecución. No se implementó código ni se cambió ningún endpoint o contrato.

## 5. Pruebas y límites

**Ejecutadas:** verificación de HEAD/rama/base; árbol recursivo 1.023 blobs; lectura íntegra del requisito TASK-638; auditoría del commit/informe C1.297; inspección estática de TASK y EXAM; cruce de dispatchers, PUBLIC_ACTIONS, handlers, hojas, helpers y callsites seleccionados; lectura del requisito F9-TASK03 y reconciliación de IDs.

**No ejecutadas:** Node, navegador, HTTP, Apps Script runtime, Drive, Sheets, concurrencia, multiusuario, pruebas de regresión, integración o E2E; no se verificaron deployments ni Script Properties. No se inspeccionaron datos productivos de categorías, rúbricas, exámenes, entregas ni proyectos.

## 6. Archivos y estado

- **Modificados en esta iteración:** informe C1.298; Auditoria.txt; Auditoría/MapaDependencias.md; tareas_auditoria.txt; changueslogs.txt; pendientes/Docente/Pendientes.md; Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md; Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt; Auditoría/INDICE_CHECKPOINTS.md; docs/architecture/repository-inventory.md.
- **Revisados sin modificación:** pendientes/Contabilidad/Pendientes.md; pendientes/Otros/Pendientes.md; METODOLOGIA_DESARROLLO.md; Auditoría/Contexto_personal.txt; Auditoría/AUDITORIA_TASK-638_C1.297.md; backend/task-service/Code.gs; backend/exam-service/Code.gs; js/student.js; js/teacher.js; js/api.js; index.html.
- **Código fuente:** sin modificaciones.
- **Estado real:** TASK-638 sigue En ejecución; su criterio de traza exhaustiva por callsite/handler/persistencia y verificación de deployments no está satisfecho.

## 7. Siguiente acción reproducible

Continuar TASK-638 con los callsites restantes de TASK/EXAM y completar la matriz acción por acción hasta helpers, claims/contexto, hojas/Drive, mutaciones, respuestas y errores; después cerrar las trazas pendientes de USER/ACADEMIC/ACCOUNTING y verificar endpoints/deployments mediante evidencia autorizada. No iniciar TASK-639 ni PM-01 mientras TASK-638 y la puerta PM-00 sigan abiertas.

**Siguiente tarea después de cerrar TASK-638:** TASK-639 — Verificar duplicaciones, símbolos globales y ciclos; requisito en `pendientes/Secretaria/Pendientes.md`; depende de TASK-637 y TASK-638 verificadas.
