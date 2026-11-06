# Auditoría de tareas completadas - FASE2-07

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 99801144c1b7f373e49fde6bfefecb9821da9074  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** Supervisión de Cuotas Operativas, Paginación y Plan de Crecimiento

## Dictamen

**NO CUMPLE INTEGRALMENTE.** FASE2-T09, FASE2-T10 y FASE2-T12 contienen piezas implementadas, pero no satisfacen los criterios completos de supervisión real, paginación eficiente y evaluación de crecimiento.

El documento original AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md citado por completadas.md no está presente en la raíz. Se utilizaron los alcances y criterios de FASE2-T09, T10 y T12 registrados en completadas.md.

## 1. FASE2-T09 - Supervisión real de cuotas, errores y capacidad

- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`: no contiene `OPERATIONAL_HEALTH_METRICS` ni `getServiceHealthMetrics`, aunque ChangesLogs.txt atribuye esos contadores a T09. `fetchApi` mantiene reintentos lineales de 1/2 segundos condicionados a fragmentos textuales de errores de red; no instrumenta transversalmente solicitudes, resultados, latencia, acción, servicio, intento ni cuota. El timeout es fijo de 60 segundos y `options.timeout` no se aplica.
- `backend/user-service/Code.gs` SHA `12079dd410aa6d8afbce55a4bc62a79dea605f9`: `getOperationalCapacityMetrics` (línea 4080) agrega todas las filas de `BitacoraTrazabilidad`, calcula latencia media/tasa de error y clasifica cuotas por coincidencia textual en `ErrorDetalle`. No mide cuota disponible/consumida, límites oficiales, usuario, proyecto, ejecución ni ventana temporal. Usa umbrales genéricos `errorRate > 10%` y `quotaEvents > 5`.
- `recordTraceabilityLog` (línea 4548) es el único escritor localizado de `BitacoraTrazabilidad`. La acción existe en el dispatcher, pero no se localizaron productores en Academic, Accounting, Task o Exam ni instrumentación cliente que la invoque. La cobertura depende de registros manuales.
- `metricsClient` se devuelve sin validación como dato aportado por el cliente. La prueba INT-04 espera `capacidadOperativa`, propiedad que el endpoint no devuelve (retorna `capacidadEstado`, `resumenGeneral` y `desgloseServicios`). La prueba de trazabilidad espera `logs`, mientras el endpoint devuelve `registros`.
- `js/ui-common.js` SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`: `openInstitutionalHealthDashboardModal` (línea 1944) consume `window.getServiceHealthMetrics`, no definida en los módulos y paneles principales revisados. En ausencia de esa función usa métricas cero y representa los servicios como saludables; no consulta el endpoint de capacidad ni el health check real.
- `backend/academic-service/Code.gs` SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`: `getStorageQuotaMetricsReport` (línea 4352) fija `capacityUsagePct` en 15.5 e `incidentCount` en 0. La suma de tamaño lee `r[5]` de `DocumentosEstudiante`, cuya cabecera corresponde a `DriveFileId`, no a bytes. `driveAccessStatus` queda `OPERATIONAL` por defecto y no se comprueba acceso real a Drive.

**Criterios incumplidos:** métricas transversales de solicitudes; clasificación estructurada de errores de cuota; política específica de reintentos/backoff; umbrales basados en cuotas oficiales; alertas preventivas deduplicadas; salud no basada en valores cero; pruebas de telemetría controladas.

**Reconciliación:** ampliar TASK-064, AUD-NG-144/AUD-NG-145, AUD-NG-007/AUD-NG-008 y AUD-NG-161. AUD-NG-163 ya consta como duplicado/consolidado; no reabrirlo.

## 2. FASE2-T10 - Paginación eficiente y consultas escalables

- `js/ui-common.js`: `renderPaginatedTable` (línea 1999) pagina localmente con `slice`; el modo remoto depende de callback externo `fetchRemotePage`. El componente no invoca los endpoints ni crea el callback. No se encontraron consumidores en los módulos JS y paneles principales de las áreas académica/contable revisados.
- El componente no valida `pageSize`/`currentPage`, no limita el tamaño máximo, no presenta estados de carga/error ni controla reintentos del callback remoto. El callback solo recibe página y tamaño.
- Academic `getPaginatedAcademicHistory` (línea 3221) y Accounting `getPaginatedJournalEntries` (línea 13899) leen `getDataRange().getValues()` completo, luego filtran, transforman, ordenan y aplican `slice`.
- Ambos endpoints usan `parseInt(...) || default` sin validar enteros positivos ni máximo; aceptan páginas/tamaños negativos o arbitrariamente grandes. No hay clave secundaria única, cursor ni snapshot para preservar posiciones cuando se insertan/eliminan registros.
- No se localizaron pruebas específicas de estos endpoints/helper en `tests/regression/modular-dashboard-suite.js` ni `tests/regression/academic-grading-suite.js`.

**Criterios incumplidos:** la paginación reduce la respuesta, pero no las lecturas/procesamiento de la hoja completa; no hay límites máximos; no se acredita orden estable ni prevención de duplicados/omisiones; el helper remoto no está integrado; faltan estados de carga/error/reintento, mediciones y pruebas con conjuntos pequeños/grandes/vacíos/modificados.

**Reconciliación:** ampliar TASK-429 (rendimiento de tablas/UI) con integración real del componente, límites de página, orden estable, filtros, lecturas eficientes, errores y pruebas de rendimiento/regresión. Mantener separada TASK-064 y AUD-NG-007.

## 3. FASE2-T12 - Criterios medibles para almacenamiento transaccional

- Academic `evaluateTransactionalStorageMigrationNeed` (línea 13328) y Accounting (línea 10304) están duplicadas con el mismo diseño.
- La función enumera hojas, suma `getLastRow()` y mide únicamente el tiempo de esa llamada. No mide consultas representativas, lecturas/escrituras por operación, crecimiento histórico, concurrencia, errores, ejecución completa ni degradación por filtros/ordenación.
- Usa `UMBRAL_FILAS = 50000` y `UMBRAL_LATENCIA_MS = 2000` constantes. Recomienda migración SQL al superar cualquiera, sin evidencia reproducible ni validación de límites documentados. Esto contradice el criterio de no migrar solo por un número arbitrario.
- No inventaría entidades/operaciones críticas ni identifica actualizaciones multi-entidad; tampoco compara alternativas por transacciones, integridad referencial, capacidad, costes, mantenimiento y recuperación.
- No define preservación de IDs, relaciones, historial y permisos; sincronización gradual; validación de integridad; fuente de verdad; plan de reversión ni pruebas de aceptación.

**Dictamen T12: CUMPLE PARCIALMENTE.** Existe un inventario superficial de hojas/filas, pero no una evaluación reproducible de crecimiento ni un plan de migración transaccional.

### Hallazgo nuevo

**AUD-NG-178 - Evaluación de crecimiento y migración transaccional sin mediciones reproducibles ni plan verificable.** Severidad MEDIO (P2). Requiere inventario de entidades/operaciones, métricas longitudinales y por consulta, concurrencia, criterios de activación documentados, comparación de alternativas y plan de migración gradual con IDs, relaciones, historial, permisos, sincronización, integridad, fuente de verdad y reversión.

**Tarea propuesta para Pendientes.md:** establecer criterios reproducibles de escalabilidad y un plan de evolución del almacenamiento transaccional. El ID debe asignarse tras verificar el último identificador del backlog.

## 4. Control de duplicados y límites

- FASE2-T09: ampliar TASK-064, AUD-NG-144/AUD-NG-145, AUD-NG-007/AUD-NG-008 y AUD-NG-161; no reabrir AUD-NG-163.
- FASE2-T10: ampliar TASK-429; no crear tarea paralela de rendimiento UI.
- FASE2-T12: registrar AUD-NG-178 y convertirlo en tarea nueva tras comprobar el backlog.
- Pendientes.md (SHA `52a3215094b8bc28b494402c08c15186b5a3eef3`, aprox. 1.62 MB) devolvió contenido vacío en lectura completa y por rangos. No se sobrescribió ni reconstruyó parcialmente para evitar pérdida de historial. La tarea propuesta queda pendiente de incorporación segura.

## 5. Calidad, pruebas y restricciones

Calidad global insuficiente para aceptar FASE2-07 como completada. Auditoría estática/manual. No se ejecutaron Apps Script, HTTP, consultas sobre hojas reales, mediciones de cuotas, pruebas de carga, benchmarks, concurrencia, migraciones ni operaciones productivas. No se usaron datos productivos ni se modificó código fuente.

No se modificaron código fuente, completadas.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md ni la rama base. Pendientes.md permanece intacto. Un solo commit agrupa los documentos de auditoría.

## Progreso

- Identificadores auditados: 38/183; 145 pendientes.
- Última tarea auditada: FASE2-07.
- Siguiente paso: recuperar íntegramente Pendientes.md y registrar AUD-NG-178 tras verificar que no exista tarea equivalente; después determinar el siguiente identificador completado no auditado.
