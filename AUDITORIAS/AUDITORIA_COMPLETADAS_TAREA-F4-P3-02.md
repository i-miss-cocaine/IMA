# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P3-02

**Checkpoint:** C1.91  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `ab8ba188f37f43137ac07a66a4dc6a0f57551251`  
**Tree SHA de partida:** `16fb62d588a39b5b58a67b959c616564434bbc24`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 153 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; C1.87-C1.91 intermedios; sesión abierta).

**Dictamen: NO CUMPLE.** La función de paginación no mapea el esquema real de BitacoraEventos, consulta un nombre de hoja de trazabilidad distinto al usado por el escritor y carga todos los registros antes de paginar. El dashboard Developer continúa usando getStructuredLogs con filtros incompatibles y sin paginación real.

## 1. Alcance y fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`) marca TAREA-F4-P3-02 como completada. `ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1775-1779) declara un informe paginado sobre BitacoraEventos y BitacoraTraceability, con búsqueda por fecha/usuario/acción/tipo y metadatos de paginación.

La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no está en el árbol. Se contrasta el changelog con los escritores y lectores reales.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | getStructuredLogs 353-394; getPaginatedAuditLogReport 4243-4364; recordTraceabilityLog 4548-4573; getTraceabilityCorrelationLogs 4575-4616; registerAndDispatchEvent 4618-4690. |
| `js/developer.js` | `6fa4c4bd9be580c974b1fbede4f0cf79485dc331` | loadStructuredLogs 195-225. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de función/esquemas. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida de función/esquemas. |

## 3. Hallazgos

### 3.1. BitacoraEventos se interpreta con un DTO distinto al que se escribe (AUD-NG-145)

`registerAndDispatchEvent` crea BitacoraEventos con columnas:
0 EventID, 1 TipoEvento, 2 ServicioOrigen, 3 RequestIDOrigen, 4 DestinatarioID, 5 DatosJSON, 6 Estado, 7 Intentos, 8 UltimoIntentoFecha, 9 ErrorDetalle (USER 4624-4629).

`getPaginatedAuditLogReport` interpreta:
- row[1] como fecha, aunque es TipoEvento;
- row[2] como eventType, aunque es ServicioOrigen;
- row[3] como userId, aunque es RequestIDOrigen;
- row[4] como role, aunque es DestinatarioID;
- row[5] como módulo, aunque es DatosJSON;
- row[6] como acción, aunque es Estado;
- row[7] como resultado, aunque es Intentos;
- row[8] como detalles, aunque es UltimoIntentoFecha;
- row[9] como correlationId, aunque es ErrorDetalle.

El filtro convierte TipoEvento a fecha; los valores normales (LOGIN, etc.) no producen una fecha válida y los registros reales quedan excluidos o mal representados. Se revalida AUD-NG-145.

### 3.2. La consulta de trazabilidad usa un nombre de hoja inexistente

`recordTraceabilityLog` escribe en `BitacoraTrazabilidad` (4548-4573). `getPaginatedAuditLogReport` busca `BitacoraTraceability` (4303-4306). Por tanto, el reporte no consulta la hoja que el escritor mantiene. AUD-NG-145.

### 3.3. La paginación ocurre después de cargar y ordenar todos los registros

La función ejecuta `getDataRange().getValues()` para cada fuente, acumula todos los registros en `allLogs`, ordena el arreglo completo y solo entonces aplica `slice` para la página solicitada (4259-4260, 4306-4307, 4340-4350). El límite de 100 restringe la respuesta, no la lectura ni el consumo de memoria. No es paginación eficiente de origen y escala con el tamaño total de las hojas.

### 3.4. El dashboard no consume el nuevo endpoint

`js/developer.js` llama `fetchApi('USER', 'getStructuredLogs', payload)` (211), no `getPaginatedAuditLogReport`. El payload contiene `severidad`, `servicio` y `limit`; `getStructuredLogs` espera `severity`, `startDate` y `endDate`, no aplica filtro de servicio y devuelve `logs.reverse().slice(0, 500)` fijo (353-394). La interfaz no recibe la paginación nueva ni aplica correctamente los filtros declarados.

### 3.5. No existen pruebas específicas

Los dos archivos tests/regression revisados no contienen referencias a getPaginatedAuditLogReport, BitacoraTraceability o BitacoraTrazabilidad. Se amplía AUD-NG-161.

## 4. Reconciliación

- **AUD-NG-145:** esquema/hojas de bitácora, filtros, sanitización y lectura/paginación.
- **AUD-NG-161:** ausencia de pruebas conductuales para consulta/paginación y fuentes.
- No se crea ningún AUD-NG ni TASK nuevo.

## 5. Pruebas y límites

**Ejecutado:** inspección estática de escritores/lectores, cotejo de índices y nombres de hojas, revisión del dashboard Developer y búsqueda dirigida en ambos archivos regression.

**No ejecutado:** lectura de hojas productivas, consulta con datos reales, prueba HTTP, navegador, medición de rendimiento con volumen, ni suites automatizadas. No se modificó código ni pruebas.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 88/183 identificadores auditados; 95 pendientes.
- **Última tarea auditada:** C1.91 / TAREA-F4-P3-02.
- **Siguiente tarea exacta:** TAREA-F4-P3-03 - Establecer un sistema de detección y reconciliación de inconsistencias de identidad.
- **Archivos documentales previstos para C1.91:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.
