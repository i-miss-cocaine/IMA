# AUDITORÍA FUNCIONAL Y TÉCNICA — TAREA-F7-IMP-20
## Optimizar el rendimiento y la escalabilidad de las consultas de planificación

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-1842Z (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.251.
- **Repositorio:** `i-miss-cocaine/IMA`.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `cf9484585ee3cb658c01b90c9c545379957d4f8f`.
- **Rama base protegida:** `NG_beta_0.0.0.1`, HEAD `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Estado de la tarea en completadas.md:** [X] histórica, preservada; no equivale a certificación funcional.
- **Prioridad declarada:** P2.
- **Dictamen:** **NO CUMPLE**.
- **Fuente primaria:** bloque completo de TAREA-F7-IMP-20 en `completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`).
- **Fuente secundaria declarada:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md`, no localizada en la rama.
- **Informe individual esperado:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-20.md`, no localizado; por tanto, se ejecutó esta auditoría directamente y no se omitió la tarea.

---

## 1. Alcance y requisitos

La tarea exige optimizar `getClassSchedules`, `getStudentSchedule` y `getClassroomResources`, reduciendo lecturas repetitivas, filtrando en el origen, acotando consultas extensas, evitando cargar períodos/historial innecesarios, manteniendo coherencia de caché, evitando que analítica pesada interfiera con escrituras críticas, proporcionando estados de carga y detectando límites/cuotas.

Criterios de aceptación:

- **CA-F7-122:** una consulta semanal no debe cargar innecesariamente todo el historial académico.
- **CA-F7-123:** los filtros deben reducir el conjunto de datos procesados cuando corresponda.
- **CA-F7-124:** una modificación confirmada no debe dejar indefinidamente datos obsoletos en caché.
- **CA-F7-125:** la optimización no debe alterar el significado de los resultados.
- **CA-F7-126:** informes y vistas deben conservar coherencia con los datos de origen.
- **CA-F7-127:** pruebas con volúmenes representativos deben medir el rendimiento antes y después.

## 2. Plan de auditoría y respaldo

1. Verificar el estado Git y la continuidad del checkpoint C1.251.
2. Consultar `completadas.md`, `Pendientes.md`, la existencia del informe individual y de la fuente de fase.
3. Inspeccionar manualmente, por función y flujo, las consultas backend, sus consumidores UI, las escrituras que deberían invalidar caché, los informes relacionados y las pruebas.
4. Contrastar filtros, rangos, caché, estados de carga, manejo de errores y evidencia de rendimiento.
5. Registrar hallazgos, criterios y tareas derivadas sin alterar código durante la auditoría.

**Recuperación de Pendientes.md:** la lectura ordinaria de `Pendientes.md` en la rama devuelve 0 caracteres, aunque Git reporta el blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`. Se recuperó el contenido directamente con `fetch_blob` desde ese SHA: 1.782.094 caracteres, 20.182 líneas, 0 caracteres U+FFFD, encabezado y cierre coherentes. El SHA del archivo en el HEAD de la rama coincide con ese mismo blob; por tanto, el archivo ya está presente en la rama y no se requiere restauración ni transferencia. No se sobrescribió.

**Reconciliación del backlog:** `Pendientes.md` no contiene TAREA-F7-IMP-20 ni los IDs derivados propuestos en este informe. Se identificaron tareas vigentes relacionadas para evitar duplicación: TASK-234 (consultas, paginación, caché, métricas y límites), TASK-252 (telemetría continua) y TASK-429 (tablas/listados, estados UI y paginación). Se amplían sus alcances; las tareas nuevas se limitan a los contratos específicos de planificación.

## 3. Archivos, funciones y evidencia inspeccionados

### 3.1 `backend/academic-service/Code.gs`

SHA: `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`.

- **`getClassSchedules(payload)`, líneas 6718-6770.** Construye una clave con año, grado, sección, docente, oferta y aula; consulta CacheService; ante cache miss ejecuta `getDataRange().getValues()` sobre toda `HorariosClase` y aplica los filtros posteriormente en memoria. `anolectivo` forma parte de la clave, pero no se utiliza en el filtro de filas. Devuelve el conjunto completo coincidente, sin paginación ni rango temporal. TTL de caché: 600 segundos.
- **`getStudentSchedule(payload)`, líneas 7986-8082.** Si faltan grado/sección, lee toda `Matriculas`; en todos los casos lee el rango completo de `HorariosClase`, `OfertaAcademica`, `CatalogoAsignaturas`, `AsignacionesDocentes` y, si existe, `Usuarios`. Filtra ofertas y horarios después de cargar las matrices completas. No recibe año/período ni intervalo semanal/fecha. Devuelve todos los bloques coincidentes, sin paginación. No implementa caché ni consume `bypassCache`.
- **`getClassroomResources(payload)`, líneas 7694-7749.** Lee completas `SedesAulas` y `MantenimientoAulas`; aplica `sedeId` en memoria. Para cada aula recorre de nuevo `maintData` para buscar mantenimientos, multiplicando el trabajo por aula y registro de mantenimiento. No usa caché ni paginación.
- **`invalidateScheduleCache(...)`, líneas 13814-13833.** Intenta borrar claves fijas con cuatro segmentos de filtros. Las claves reales de `getClassSchedules` incluyen seis valores de filtro después del prefijo; las cadenas eliminadas no coinciden con el formato completo generado.
- **Escrituras de horarios:** `createClassSchedule` (6900-6990), `deleteClassSchedule` (6992-7005) y `publishClassSchedules` (7008-7116) no llaman a `invalidateScheduleCache`. Las llamadas encontradas están en el enrutador de invalidación manual (767), `saveCurricularConstraint` (13640) y `applyScheduleTemplate` (14093), no en las mutaciones ordinarias de horarios.
- **`getPlanningQualityAndOccupancyReport`, líneas 3525-3595.** Lee completas `HorariosClase` y `SedesAulas`; el parámetro `anoLectivo` se utiliza en el registro y en el DTO de salida, pero no restringe las filas analizadas.
- **`getSectionCapacityAnalyticsReport`, líneas 13657-13810.** Lee completas `Matriculas`, `OfertaAcademica`, `HorariosClase` y `SedesAulas`; el año se aplica al conteo de matrícula, pero no se demuestra un filtrado temporal equivalente de ofertas y horarios. Las divergencias de esquema/índices ya documentadas en AUD-NG-241 se mantienen como antecedente y no se duplican aquí.
- **`runAcademicPlanningRegressionSuite`, líneas 14109-14165.** Contiene siete comprobaciones TC-F7-01..07 de forma/resultado general; no mide latencia, volumen leído, memoria, caché fría/caliente, invalidación ni equivalencia antes/después para CA-F7-122..127.

### 3.2 `js/teacher.js`

SHA: `c475fce5afcd28fca23e7b64398ad32b17773746`.

- **`loadMasterSchedules`, líneas 664-682.** Muestra un indicador de carga y un mensaje de error; invoca `getClassSchedules` con `docenteUserId` y `bypassCache`, pero no transmite año, período o intervalo temporal. Si falta `schedules-table-body`, retorna antes de consultar.
- **`loadClassroomResourcesTable`, líneas 2528-2548.** Muestra estado de carga y consume `getClassroomResources({})`, sin filtro de sede ni paginación desde este consumidor.
- Los estados de carga actuales no miden duración ni distinguen una consulta lenta de una consulta normal; no se observó un umbral de demora asociado a estas acciones.

### 3.3 `js/student.js`

SHA: `e2888cea60322e49a40b89adadb8010489605dcc`.

- **`fetchAndRenderStudentSchedule`, líneas 884-955.** Muestra “Cargando horario semanal”, consulta `getStudentSchedule` con usuario/grado/sección y envía `bypassCache`; el backend no consume ese parámetro. La UI muestra la hora de sincronización y un botón de actualización, además de mensajes de vacío/error. No existe selección de año/período/intervalo ni paginación o advertencia por demora prolongada.

### 3.4 Pruebas

- `tests/regression/academic-grading-suite.js`, SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`, 412 líneas: no contiene cobertura específica de rendimiento de las tres consultas ni mediciones comparativas de CA-F7-122..127.
- La suite interna TC-F7-01..07 tampoco incorpora pruebas de volumen, paginación, latencia, hit/miss, invalidación o consistencia de caché.

## 4. Hallazgos

### AUD-NG-257 — MEDIO/P2: consultas de planificación cargan matrices completas y filtran después

**Archivos/rangos:** `backend/academic-service/Code.gs` 3525-3595, 6718-6770, 7694-7749, 7986-8082 y 13657-13810.

**Descripción:** los tres endpoints principales ejecutan lecturas completas con `getDataRange().getValues()`. Los filtros se aplican después de transferir las matrices al entorno de Apps Script. `getStudentSchedule` combina varias hojas completas para devolver una vista semanal; `getClassroomResources` vuelve a recorrer todos los mantenimientos por cada aula. Los informes relacionados también leen conjuntos completos; en el reporte de calidad, el año solicitado no limita los horarios analizados.

**Impacto:** mayor latencia, memoria y consumo de lecturas de Sheets conforme crece el histórico; riesgo de acercarse a límites de ejecución/cuotas y de devolver vistas/reportes con ámbitos temporales distintos.

**Relaciones:** AUD-NG-168, AUD-NG-236 y AUD-NG-241 (contrato/semántica de horarios y reportes); TASK-234.

### AUD-NG-258 — MEDIO/P2: invalidación de caché incompatible con las claves reales y ausente en mutaciones ordinarias

**Archivos/rangos:** `backend/academic-service/Code.gs` 6718-6770, 6900-7005, 7008-7116, 13814-13833; enrutador 766-769, llamada 13640 y llamada 14093.

**Descripción:** `getClassSchedules` almacena resultados por 600 segundos con una clave que incluye seis dimensiones. `invalidateScheduleCache` elimina claves con menos segmentos y no puede alcanzar las entradas reales. Además, alta/edición, desactivación y publicación de horarios no invocan el invalidator. La acción manual de invalidación no sustituye la invalidación automática posterior a cada escritura. `getStudentSchedule` no tiene caché y el parámetro `bypassCache` enviado por la UI no se utiliza.

**Impacto:** después de una escritura confirmada, la vista docente puede conservar resultados anteriores hasta que venza el TTL; el estado de caché no es coherente con el dato fuente en el momento de confirmación.

**Relaciones:** ampliar TASK-234 y coordinar AUD-NG-168/AUD-NG-236; no duplicar la política general de caché fuera del módulo académico.

### AUD-NG-259 — MEDIO/P2: ausencia de paginación y de límites temporales en consultas de planificación

**Archivos/rangos:** `backend/academic-service/Code.gs` 6718-6770, 7694-7749, 7986-8082; `js/teacher.js` 664-682 y 2528-2548; `js/student.js` 884-955.

**Descripción:** los endpoints no aceptan `page`, `pageSize`, cursor, límite de resultados ni intervalo de fechas/período. La consulta estudiantil representa una semana en UI, pero el backend no restringe la lectura a un intervalo semanal ni a un año/período; recibe y procesa todos los bloques activos de las ofertas seleccionadas.

**Impacto:** la interfaz solicita un subconjunto pequeño, pero el backend procesa y devuelve matrices completas; no hay forma de controlar el tamaño de respuesta ni continuar consultas extensas de forma acotada.

**Relaciones:** ampliar TASK-234 y TASK-429; TASK-617.

### AUD-NG-260 — MEDIO/P2: no hay medición ni pruebas comparativas de rendimiento para las consultas auditadas

**Archivos/rangos:** `backend/academic-service/Code.gs` 14109-14165; `js/teacher.js` 664-682 y 2528-2548; `js/student.js` 884-955; `tests/regression/academic-grading-suite.js` completo (412 líneas).

**Descripción:** las pruebas disponibles verifican respuestas estructurales, no el tiempo, volumen de filas/columnas leídas, número de llamadas a Sheets, consumo de cuotas, hit/miss o invalidación. Los consumidores muestran spinners y errores, pero no miden tiempo ni presentan advertencias de consulta lenta. No existe evidencia comparativa con caché fría/caliente ni de equivalencia semántica antes/después.

**Impacto:** no se puede demostrar que la tarea haya mejorado rendimiento, que conserve los resultados ni que escale con volúmenes representativos; tampoco se detectan preventivamente endpoints que se aproximen a límites del servicio.

**Relaciones:** ampliar TASK-234 y TASK-252; coordinar TASK-429 para estados UI y TASK-551 solo en cuanto a la estrategia de regresión compartida, sin duplicar su cobertura de capacidad.

## 5. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-122 | NO CUMPLE | La consulta semanal lee matrices completas; no restringe por intervalo/año/período en backend. |
| CA-F7-123 | NO CUMPLE | Los filtros principales se aplican después de `getDataRange().getValues()`; no reducen la lectura del origen. |
| CA-F7-124 | PARCIAL | Existe TTL de 600 s, por lo que la obsolescencia no es indefinida; la invalidación inmediata falla por claves incompatibles y falta de llamadas desde las mutaciones. |
| CA-F7-125 | NO CUMPLE | No hay comparación antes/después ni pruebas de equivalencia; las consultas existentes conservan divergencias de esquema previamente documentadas. |
| CA-F7-126 | NO CUMPLE | El reporte de calidad no aplica el año al conjunto de horarios; los resultados cacheados pueden quedar obsoletos y otros reportes usan ámbitos temporales no equivalentes. |
| CA-F7-127 | NO CUMPLE | No hay pruebas con volúmenes representativos ni mediciones comparativas. |

**Dictamen global: NO CUMPLE.**

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

#### [TASK-617] Optimizar consultas de horarios y recursos con filtros de origen y resultados acotados
- **Hallazgos de origen:** AUD-NG-257 y AUD-NG-259.
- **Prioridad:** P2.
- **Objetivo:** reducir filas/columnas transferidas y procesadas por las consultas de planificación, manteniendo el contrato semántico.
- **Acciones:** definir filtros canónicos por año/período, docente, oferta, sede y rango semanal; aplicarlos en la lectura de origen cuando sea viable; leer únicamente columnas necesarias; eliminar recorridos anidados evitables de mantenimientos; incorporar paginación/cursor estable y límites configurables en consultas extensas; alinear informes y vistas con el mismo ámbito temporal.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `js/student.js`; hojas HorariosClase, OfertaAcademica, Matriculas, SedesAulas y MantenimientoAulas.
- **Criterios:** una consulta semanal no procesa historial ajeno al año/período; los filtros reducen el conjunto leído; paginar todas las páginas no omite ni duplica filas; el orden es estable; informes y vistas usan el mismo filtro; resultados equivalen funcionalmente al contrato correcto anterior.
- **Dependencias:** TASK-234; AUD-NG-168/236/241. No duplicar correcciones de esquema ni índices ya asignadas a esas auditorías.
- **Estado:** Pendiente.

#### [TASK-618] Corregir el contrato de caché e invalidación de horarios después de cada escritura
- **Hallazgo de origen:** AUD-NG-258.
- **Prioridad:** P2.
- **Objetivo:** asegurar que una escritura confirmada no deje vistas de planificación mostrando datos obsoletos.
- **Acciones:** normalizar la generación de claves con todas las dimensiones de consulta; centralizar invalidación/versionado; invocar invalidación después de crear/editar, desactivar, publicar, restaurar y aplicar plantillas; definir comportamiento para fallos de caché y evitar devolver éxito si la invalidación requerida no se pudo confirmar; documentar por separado la política de caché de consultas estudiantiles y recursos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `js/student.js`.
- **Criterios:** cada mutación invalida o actualiza todas las claves afectadas; una lectura posterior devuelve la versión confirmada; claves de filtros distintos no colisionan; pruebas cubren hit, miss, bypass, expiración y mutaciones concurrentes.
- **Dependencias:** TASK-234; AUD-NG-168/236. No duplicar políticas generales de caché de otros servicios.
- **Estado:** Pendiente.

#### [TASK-619] Incorporar pruebas comparativas y telemetría de rendimiento para planificación
- **Hallazgo de origen:** AUD-NG-260.
- **Prioridad:** P2.
- **Objetivo:** medir y demostrar el rendimiento, el comportamiento de caché y la equivalencia de resultados de las consultas de planificación.
- **Acciones:** instrumentar duración, filas/columnas leídas, tamaño de respuesta, llamadas a Sheets, cache hit/miss e invalidaciones; crear fixtures aislados de volúmenes representativos; comparar caché fría/caliente/desactivada y consulta completa frente a consulta filtrada/paginada; medir antes/después; verificar límites, errores de cuota, resultados y estados de carga UI; registrar umbrales de advertencia para operaciones lentas.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `js/student.js`, `tests/regression/academic-grading-suite.js`.
- **Criterios:** informe reproducible con latencia y volumen antes/después; equivalencia de resultados demostrada; cobertura de invalidación y paginación; errores de cuota diferenciados; sin escrituras en datos productivos.
- **Dependencias:** TASK-234 y TASK-252; coordinar TASK-429 para progreso/paginación UI.
- **Estado:** Pendiente.

### Tareas existentes que deben ampliarse

- **TASK-234:** incluir explícitamente `getClassSchedules`, `getStudentSchedule`, `getClassroomResources`, `getPlanningQualityAndOccupancyReport` y `getSectionCapacityAnalyticsReport); exigir filtros de origen por año/período/rango, lectura selectiva, paginación/cursor, invalidación posterior a mutaciones y pruebas comparativas específicas de planificación.
- **TASK-252:** instrumentar duración, volumen de datos, llamadas de Sheets, tamaño de respuesta y métricas de caché para los endpoints de planificación; umbrales de consulta lenta y correlación sin PII.
- **TASK-429:** extender estados de carga/progreso, paginación remota y tratamiento de consultas prolongadas a las vistas de horarios/recursos, sin sustituir estados de error/vacío ni mostrar datos cacheados obsoletos como confirmados.
- **Control de duplicidad:** TASK-617 cubre filtrado/paginación específica de planificación; TASK-618 cubre invalidación de su caché; TASK-619 cubre medición y regresión. TASK-234 conserva la política transversal de consultas y cuotas; TASK-252 la telemetría; TASK-429 la experiencia UI.

## 7. Pruebas y límites

- **Ejecutadas:** inspección manual de requisitos y criterios; lectura de funciones y consumidores; revisión de llamadas de invalidación y contratos de caché; lectura de informes y suite; recuperación directa del blob de Pendientes.md; verificación de rama, HEAD, SHAs y comparación con rama base.
- **No ejecutadas:** Apps Script runtime; Google Sheets productivas; navegador/DOM; HTTP/OAuth; mediciones de latencia; pruebas de carga; pruebas de CacheService real; concurrencia; consumo real de cuotas; suite Node/E2E.
- No se afirma una mejora cuantitativa ni un resultado de ejecución que no se haya medido.
- No se modificó código, UI, pruebas, datos productivos, despliegues, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, metodología ni rama base.

## 8. Cierre

- **TAREA-F7-IMP-20:** NO CUMPLE; se conserva su marca histórica [X] en `completadas.md`.
- **Hallazgos nuevos:** AUD-NG-257, AUD-NG-258, AUD-NG-259 y AUD-NG-260 (MEDIO/P2).
- **Tareas nuevas:** TASK-617, TASK-618 y TASK-619.
- **Tareas ampliadas:** TASK-234, TASK-252 y TASK-429.
- **Archivo nuevo:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-20.md`.
- **Archivos actualizados:** `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`, `AUDITORIAS/Contexto_personal.txt`.
- **Siguiente tarea:** TAREA-F7-IMP-21, auditoría operativa y trazabilidad de la planificación.
