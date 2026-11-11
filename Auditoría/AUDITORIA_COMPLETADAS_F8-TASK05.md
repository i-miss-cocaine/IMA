# Auditoría F8-Task05 / TAREA-MOD-07 — Reorganización por etapas verificables

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2149Z-01 (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial válido:** C1.264.
- **Checkpoint de cierre:** C1.265.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** e146e2a09feaf9dd6ea9a972c3613e70982551ea; árbol Git: 19cdca2f142579578c2e4e10a65ee21b978817d8.
- **Rama base protegida:** NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación al inicio: rama de trabajo 333 commits adelante y 0 detrás; la rama base permanece sin cambios.
- **Tarea auditada:** F8-Task05 / TAREA-MOD-07, marcada [X] en completadas.md, línea 4860.
- **Informe individual previo:** no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK05.md ni se encontró resultado de búsqueda para ese identificador; auditoría realizada directamente.
- **Dictamen:** **NO CUMPLE**. CA-MOD-112 y CA-MOD-113 NO CUMPLEN. La marca histórica [X] se conserva sin tratarla como certificación.

## 1. Objetivo y criterios de aceptación

Verificar que la reorganización se haya ejecutado por etapas aisladas y comprobables, con línea base reproducible, mapa de dependencias, estructura, módulos compartidos, rutas, regresión y reversión efectiva.

- **CA-MOD-112:** cada etapa de reorganización se ejecuta y verifica de forma aislada sin romper la aplicación.
- **CA-MOD-113:** existe trazabilidad completa y procedimiento de reversión validado.

## 2. Fuentes consultadas y respaldos

| Archivo | SHA de blob | Inspección |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task05, línea 4860 y criterios CA-MOD-112/113 |
| Pendientes.md actual | 676a3f798715f0cdd7d4bc75768472545b8465ee | Blob recuperado directamente; contenido completo y búsqueda de F8-Task05/CA-MOD-112/113 |
| Pendientes.md histórico solicitado | 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c | Blob histórico recuperado y comparado como respaldo |
| docs/architecture/staged-migration-procedure.md | 2b46af3095596fcd7a9744e4cc500b50b38a34f0 | Documento completo, cinco etapas y protocolo rollback |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | 2.901 líneas; funciones de inventario, validación de estructura, etapas, suite, changelog y rollback |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo; aserciones estáticas |
| docs/architecture/repository-inventory.md | eeed10fd8da0db3cd119c5a9778e9cb8b2233808 | Inventario arquitectónico |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Entrada F8-Task05 del 2026-10-28 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Reglas de auditoría, publicación y checkpoint |
| AUDITORIAS/Contexto_personal.txt | 07792a0606c192bbd3a013b06b53b7e38aeddba6 | C1.264 y continuidad |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 6806679efcdc0ebe1a101a9e378faf6f116e5e82 | Plan acumulativo hasta F8-Task04 |
| AUDITORIAS/Auditoria.txt | ac042ad6c844990f713a4c168145c2d07da66ef1 | Bitácora acumulativa hasta F8-Task04 |
| AUDITORIAS/MapaDependencias.md | 5da9582f14b6baa8c1cec653c6157064668714f7 | Mapa acumulativo hasta F8-Task04 |

### Recuperación de Pendientes.md

La lectura mediante fetch_file devolvió 0 caracteres tanto en UTF-8 como en base64. Se recuperó el contenido usando fetch_blob directamente.

- Blob actual: 1,786,011 caracteres; 20,224 líneas; 0 caracteres U+FFFD; SHA 676a3f798715f0cdd7d4bc75768472545b8465ee.
- Blob histórico solicitado: 1,782,094 caracteres; 20,182 líneas; 0 caracteres U+FFFD; SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- El blob actual está presente en la rama y contiene el registro posterior. No se restauró el histórico para evitar sustituir contenido vigente por una versión anterior.
- La búsqueda en el blob actual no encuentra F8-Task05, CA-MOD-112/113 ni TASK-652..TASK-655. El mayor ID TASK numérico encontrado en ese archivo es TASK-636.
- Se consultó completadas.md como fuente de estado de la tarea. No se modificaron ninguno de esos dos registros maestros.

## 3. Evidencia de la línea base

El procedimiento de migración documenta en la etapa STAGE-1-BASELINE:
- confirmar estado limpio del repositorio;
- etiquetar la versión base v8.4.0-baseline;
- registrar matriz de archivos y checksums.

La consulta de GitHub para la referencia v8.4.0-baseline devolvió 404 con el mensaje “No commit found for the ref v8.4.0-baseline”. No se encontró evidencia verificable del tag exigido. Tampoco se identificó un artefacto versionado que contenga el snapshot de archivos/checksums de esa línea base.

En backend/developer-service/Code.gs:1967–2037, STAGE-1-BASELINE se considera completada si getCentralServiceRegistry devuelve status success y un array registry. getCentralServiceRegistry (2415–2469) puede devolver servicios predeterminados codificados incluso cuando el Spreadsheet está vacío o se produce una excepción. Esto no comprueba el estado limpio de Git, la referencia base ni hashes de archivos.

**Resultado:** la condición de línea base no está implementada ni demostrada.

## 4. Evidencia de validación de etapas

### 4.1 Documento del procedimiento

docs/architecture/staged-migration-procedure.md enumera cinco etapas:
1. STAGE-1-BASELINE.
2. STAGE-2-DEPENDENCY-MAP.
3. STAGE-3-FOLDER-STRUCTURE.
4. STAGE-4-ROUTING-UPDATES.
5. STAGE-5-REGRESSION-SUITE.

La descripción de F8-Task05 en completadas.md requiere además separar la etapa de módulos compartidos entre estructura de carpetas y actualización de rutas. Esa etapa no aparece como etapa independiente en el procedimiento ni en la lista por defecto del verificador.

### 4.2 Verificador programático

backend/developer-service/Code.gs:1967–2037, validateStagedMigrationProgress, usa comprobaciones indirectas:

- STAGE-1-BASELINE: consulta el registro de servicios, no una etiqueta, commit o matriz de checksums.
- STAGE-2-DEPENDENCY-MAP: basta con que architectureDocs tenga longitud mayor que cero. getArchitectureAndDependencyMapReport (1748–1796) utiliza una lista predeterminada codificada y devuelve mapValid según que esa lista no esté vacía.
- STAGE-3-FOLDER-STRUCTURE: depende de validateModularFolderStructure (1896–1964). Esta función comprueba coincidencias de texto entre rutas de una lista y un manifiesto; no consulta el árbol Git ni confirma la existencia física de carpetas. Además, rootFiles trae por defecto index.htm e index.html, por lo que la comprobación de preservación del punto de entrada no constituye evidencia de lectura del repositorio.
- STAGE-4-ROUTING-UPDATES: basta con que getCentralConfigAndContractCatalog (2262–2283) devuelva un catálogo de contratos. El catálogo es estático y no valida resolución real de rutas, recursos ni endpoints.
- STAGE-5-REGRESSION-SUITE: depende de todasPruebasPasaron de la suite anterior. La auditoría C1.264 ya determinó que esa suite solo contiene pruebas superficiales, no ejecuta los flujos exigidos y carece de evidencia de ejecución integral.

El verificador no persiste resultados por etapa, no enlaza cada etapa con un commit/diff, no exige evidencia independiente ni impide avanzar con una etapa no demostrada. Para etapas desconocidas acepta completedStages suministrado en payload. Finalmente, devuelve rollbackProcedureReady: true sin comprobar el mecanismo de reversión.

### 4.3 Pruebas Node.js

tests/regression/modular-dashboard-suite.js comprueba existencia de documentos y presencia de nombres de funciones/cadenas. Las aserciones añadidas para F8-Task05 verifican que staged-migration-procedure.md exista y que Code.gs contenga validateStagedMigrationProgress. No ejecutan el proceso de migración, no verifican estados de etapa, no inspeccionan una línea base y no ejercitan el rollback.

La entrada de ChangesLogs.txt del 2026-10-28 registra la creación del documento, la función y esas aserciones; no contiene salida reproducible de una migración real ni de una reversión. No se afirma que la suite se haya ejecutado en esta auditoría.

## 5. Verificación del rollback

El documento describe una reversión a v8.4.0-baseline y presenta un protocolo con ROLLBACK-CONFIRMED.

Sin embargo, backend/developer-service/Code.gs:2325–2349, executeServiceVersionRollback:
- valida que existan serviceId y targetVersion;
- valida el texto de confirmación;
- genera un auditId y una fecha;
- devuelve status success y fija codeRestored, schemaRestored y dataIntegrityVerified en true.

No se observa invocación de un mecanismo que recupere código/versiones, restaure esquemas, restaure datos, compare hashes ni compruebe integridad posterior. Tampoco se valida que targetVersion exista o esté disponible. La referencia v8.4.0-baseline requerida por el documento no se encontró.

Por tanto, el resultado positivo de esta función es una declaración generada por el propio código, no evidencia de una reversión ejecutada.

## 6. Hallazgos

### AUD-NG-297 — Línea base v8.4.0-baseline inexistente o no demostrada
- **Severidad:** ALTO/P1.
- **Archivos:** docs/architecture/staged-migration-procedure.md; backend/developer-service/Code.gs:1967–1988.
- **Evidencia:** el procedimiento exige el tag y checksums; GitHub no encuentra la referencia; la etapa 1 se aprueba consultando el registro de servicios.
- **Impacto:** no hay punto de retorno verificable ni forma de comparar el estado inicial con cada etapa.
- **Criterio:** CA-MOD-113 NO CUMPLE.

### AUD-NG-298 — El verificador sustituye la ejecución real por catálogos estáticos
- **Severidad:** ALTO/P1.
- **Archivo:** backend/developer-service/Code.gs:1748–1796, 1896–2037 y 2262–2283.
- **Evidencia:** mapas, estructura y contratos se evalúan mediante listas predeterminadas, coincidencias de texto y respuestas de catálogos; no se comprueban árbol, archivos, rutas ni artefactos de etapa reales.
- **Impacto:** se puede informar avance sin demostrar que la etapa se ejecutó correctamente.
- **Criterio:** CA-MOD-112 NO CUMPLE.

### AUD-NG-299 — Rollback simulado que declara restauración sin ejecutarla
- **Severidad:** CRÍTICO/P0.
- **Archivo:** backend/developer-service/Code.gs:2325–2349.
- **Evidencia:** la función devuelve indicadores de restauración e integridad en true sin operaciones de restauración ni comprobaciones posteriores.
- **Impacto:** ante una regresión, el sistema puede declarar una recuperación inexistente y dejar código, esquema o datos en estado inconsistente.
- **Criterio:** CA-MOD-113 NO CUMPLE.

### AUD-NG-300 — Etapa de módulos compartidos ausente y sin trazabilidad por hito
- **Severidad:** ALTO/P1.
- **Archivos:** completadas.md:4860; docs/architecture/staged-migration-procedure.md; backend/developer-service/Code.gs:1967–2037; tests/regression/modular-dashboard-suite.js.
- **Evidencia:** la descripción de la tarea enumera módulos compartidos como fase separada, pero el procedimiento/verificador tiene cinco etapas y la omite. No hay estados persistidos, identificadores de commit por etapa, resultados aislados ni evidencia de gates entre etapas.
- **Impacto:** no se puede demostrar aislamiento de cambios estructurales/funcionales ni rastrear qué versión pasó cada validación.
- **Criterios:** CA-MOD-112 y CA-MOD-113 NO CUMPLEN.

## 7. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-MOD-112 | NO CUMPLE | No se acredita ejecución aislada; el verificador usa indicadores y catálogos estáticos, omite la etapa de módulos compartidos y no conserva evidencia por hito. |
| CA-MOD-113 | NO CUMPLE | No se acredita línea base verificable ni rollback real; la función de rollback declara éxito sin restaurar recursos. |

## 8. Tareas ejecutables derivadas de los hallazgos

### TASK-652 — Establecer y verificar una línea base reproducible
- **Hallazgo:** AUD-NG-297.
- **Severidad:** ALTO/P1.
- **Objetivo:** disponer de un punto inicial verificable antes de cualquier migración.
- **Acción:** confirmar estado limpio; crear o recuperar una referencia de versión válida; registrar commit, tree SHA, inventario de archivos, checksums y snapshot de esquema; hacer que el verificador compare esos artefactos y falle si faltan.
- **Archivos/módulos:** docs/architecture/staged-migration-procedure.md; backend/developer-service/Code.gs; documentación de versión y artefactos de baseline.
- **Dependencias/riesgos:** Git, despliegues GAS, esquemas Sheets y permisos de acceso; no crear ni sobrescribir etiquetas sin validar su historia.
- **Alcance:** preparación y verificación de baseline, sin modificar datos productivos.
- **Criterios de aceptación:** referencia de baseline existente y resoluble; commit/tree SHA y checksums registrados; repositorio limpio al capturar; cambios posteriores comparables y prueba negativa cuando falte un artefacto.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-653 — Implementar verificación real y secuencial de cada etapa
- **Hallazgo:** AUD-NG-298.
- **Severidad:** ALTO/P1.
- **Objetivo:** que cada etapa se considere completada solo con evidencia de su resultado real.
- **Acción:** sustituir catálogos estáticos por comprobaciones de archivos/árbol/rutas/contratos efectivos; registrar artefactos y resultado por etapa; bloquear etapas siguientes ante estados FAIL/BLOCKED; distinguir no ejecutada de aprobada.
- **Archivos/módulos:** backend/developer-service/Code.gs; docs/architecture/staged-migration-procedure.md; tests/regression/modular-dashboard-suite.js y fixtures aislados.
- **Dependencias/riesgos:** acceso de lectura al repositorio, fixtures y entorno de integración; evitar llamadas destructivas a servicios productivos.
- **Alcance:** verificación de las cinco etapas existentes y de sus evidencias, sin declarar ejecución productiva desde pruebas simuladas.
- **Criterios de aceptación:** cada etapa tiene resultado reproducible y evidencia; las verificaciones fallan cuando falta un archivo/recurso; una etapa posterior no puede aprobarse si una anterior está pendiente; las pruebas distinguen PASS, FAIL y BLOCKED.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-654 — Implementar rollback real y comprobar la integridad restaurada
- **Hallazgo:** AUD-NG-299.
- **Severidad:** CRÍTICO/P0.
- **Objetivo:** restaurar efectivamente una versión válida y verificar el resultado antes de reportar éxito.
- **Acción:** definir fuente versionada y resoluble del código/esquema; ejecutar restauración controlada; incorporar prevalidación, respaldo, protección ante concurrencia, comprobación de integridad posterior y registro del resultado real; rechazar targets inexistentes.
- **Archivos/módulos:** backend/developer-service/Code.gs; docs/architecture/staged-migration-procedure.md; pruebas de regresión de rollback.
- **Dependencias/riesgos:** despliegues Apps Script, esquemas Sheets, respaldos, permisos y consistencia de datos; nunca probar contra datos institucionales productivos sin autorización y aislamiento.
- **Alcance:** rollback verificable y no destructivo en entorno aislado; no ejecutar restauración productiva durante esta auditoría.
- **Criterios de aceptación:** target inexistente se rechaza; fallo de restauración no devuelve success; código/esquema restaurados coinciden con baseline; integridad se comprueba con evidencia independiente; rollback repetido o interrumpido tiene comportamiento definido.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### TASK-655 — Completar la etapa de módulos compartidos y la trazabilidad por hito
- **Hallazgo:** AUD-NG-300.
- **Severidad:** ALTO/P1.
- **Objetivo:** alinear el plan con todas las fases exigidas y demostrar aislamiento y trazabilidad.
- **Acción:** incorporar explícitamente la etapa de módulos compartidos; separar cambios estructurales de funcionales; registrar por etapa commit/diff, archivos, dependencias, pruebas, resultado, responsable lógico y artefactos; enlazar el gate de regresión y rollback con la evidencia de cada etapa.
- **Archivos/módulos:** docs/architecture/staged-migration-procedure.md; backend/developer-service/Code.gs; AUDITORIAS/MapaDependencias.md; tests/regression/modular-dashboard-suite.js.
- **Dependencias/riesgos:** tareas TASK-650 y TASK-651 de la auditoría F8-Task04; no duplicar su alcance, sino ampliarlas para cubrir las etapas y la propagación de estados.
- **Alcance:** documentación y trazabilidad del proceso; la implementación de pruebas conductuales queda coordinada con TASK-650/TASK-651.
- **Criterios de aceptación:** todas las fases requeridas están enumeradas; cada fase tiene entrada/salida y gate; los cambios funcionales no se mezclan silenciosamente con cambios estructurales; cada resultado es reproducible y trazable a commit/artefactos.
- **Prioridad:** P1.
- **Estado:** Pendiente.

## 9. Pruebas, límites y archivos

- **Inspección manual realizada:** tarea y criterios en completadas.md; procedimiento de migración completo; funciones getArchitectureAndDependencyMapReport, validateModularFolderStructure, validateStagedMigrationProgress, runModularAndDynamicDashboardsRegressionSuite, executeServiceVersionRollback, getCentralServiceRegistry y getServiceVersionChangelog; suite Node completa; entrada F8-Task05 en ChangesLogs; recuperación de blobs de Pendientes.md; comparación de ramas y referencias.
- **Verificación Git:** rama de trabajo y HEAD e146e2a09feaf9dd6ea9a972c3613e70982551ea; árbol 19cdca2f142579578c2e4e10a65ee21b978817d8; rama base 44d9891132332e692dbe2ba8602b41f50a508a59; 333 commits adelante, 0 detrás.
- **Pruebas no ejecutadas:** Node, Apps Script, endpoints HTTP, navegador, despliegues, Google Sheets/Drive, ejecución de migración, restauración de código/esquema y pruebas E2E. No se ejecutó rollback ni se tocó información productiva.
- **No se afirma:** que el tag exista, que las etapas se hayan ejecutado, que se haya realizado una restauración ni que el sistema haya pasado una prueba de producción.
- **Archivos nuevos:** AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK05.md.
- **Archivos actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin cambios:** código backend/frontend, tests, completadas.md, Pendientes.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md y rama base.

## 10. Continuidad

- **Última tarea auditada:** F8-Task05 / TAREA-MOD-07.
- **Dictamen:** NO CUMPLE; CA-MOD-112 y CA-MOD-113 NO CUMPLEN.
- **Tarea en curso al cierre:** ninguna.
- **Siguiente tarea:** consultar el orden vigente de completadas.md y el plan acumulativo; localizar la siguiente tarea sin informe individual y auditarla directamente si falta.
- **Tareas derivadas abiertas:** TASK-652, TASK-653, TASK-654 y TASK-655. TASK-650/TASK-651 de F8-Task04 permanecen relacionadas y deben ampliarse, no duplicarse.
