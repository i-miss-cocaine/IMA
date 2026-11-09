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



## 5. Tareas ejecutables derivadas de los hallazgos

Esta sección formaliza las tareas que deben ejecutarse para resolver los hallazgos de esta auditoría. Los identificadores ya existen; se amplía su alcance sin crear IDs nuevos ni trasladar las tareas a un registro externo.

### 5.1. Tarea existente ampliada: AUD-NG-145 — Bitácora central, contratos, filtros, sanitización y paginación

- **Referencia exacta a hallazgos:** 3.1 (DTO de BitacoraEventos incompatible), 3.2 (nombre de hoja de trazabilidad incompatible), 3.3 (lectura y ordenamiento global antes de paginar) y 3.4 (dashboard Developer desconectado y filtros incompatibles).
- **Severidad:** ALTO (P1), conforme a la clasificación histórica de AUD-NG-145.
- **Objetivo:** conseguir que la consulta de auditoría represente fielmente los registros persistidos, consulte las fuentes canónicas y pagine sin cargar el histórico completo para cada solicitud.
- **Acciones ejecutables:**
  1. Definir y documentar un contrato/DTO canónico para BitacoraEventos a partir de su esquema real (EventID, TipoEvento, ServicioOrigen, RequestIDOrigen, DestinatarioID, DatosJSON, Estado, Intentos, UltimoIntentoFecha y ErrorDetalle). Mapear cada campo explícitamente; no inferir fecha, usuario, rol, acción ni correlación desde columnas de otro significado.
  2. Alinear el lector de trazabilidad con la hoja realmente escrita, BitacoraTrazabilidad, y validar encabezados/esquema antes de consumir filas. Si se requiere compatibilidad con datos históricos, implementarla mediante una migración o adaptador explícito y verificable, no mediante nombres alternativos silenciosos.
  3. Diseñar paginación de origen con límites máximos, orden determinista y filtros aplicados antes de materializar el conjunto completo. Evitar getDataRange().getValues() más ordenamiento global por cada página; justificar y probar cualquier estrategia de lectura por ventanas/índices que respete el orden y los filtros.
  4. Integrar js/developer.js con getPaginatedAuditLogReport y unificar nombres/tipos de parámetros (severidad/servicio/limit frente a severity/startDate/endDate/page/pageSize). La interfaz debe consumir metadatos reales de paginación y presentar estados de carga, vacío y error sin sustituir fallos por resultados aparentes.
  5. Revisar sanitización, permisos y exposición de datos de bitácora dentro del alcance original de AUD-NG-145; no exponer PII, secretos ni datos financieros no necesarios en filtros, DTO, logs o interfaz.
- **Archivos/módulos afectados:** backend/user-service/Code.gs (getPaginatedAuditLogReport, registro/lectura de BitacoraEventos y BitacoraTrazabilidad, sanitización y autorización); js/developer.js (loadStructuredLogs/renderizado y filtros); contratos o utilidades compartidas que se incorporen para el DTO; hojas BitacoraEventos y BitacoraTrazabilidad como fuentes persistidas.
- **Dependencias:** contrato real de escritura de registerAndDispatchEvent y recordTraceabilityLog; permisos del dashboard Developer; estructura histórica de ambas hojas; AUD-NG-161 para pruebas conductuales.
- **Alcance técnico:** corrección de esquema y mapeo, consulta de fuentes, filtrado, paginación eficiente, integración UI, sanitización y autorización. No incluye rediseñar el motor de eventos/outbox ni cambiar el significado de los eventos productores.
- **Criterios de aceptación verificables:**
  - Cada columna del DTO se corresponde con el encabezado/campo persistido correcto y pruebas prueban cada índice/campo, incluyendo valores nulos y registros históricos.
  - El lector consulta la hoja canónica BitacoraTrazabilidad y falla de forma explícita/observable ante ausencia o esquema incompatible, sin devolver un éxito vacío engañoso.
  - La página N devuelve resultados correctos, sin duplicados ni omisiones entre páginas, con orden estable y filtros combinados; el trabajo de lectura no crece linealmente con todo el histórico en cada petición, y se documentan mediciones con volúmenes representativos.
  - El dashboard utiliza el endpoint paginado, envía parámetros compatibles y refleja página, tamaño, total/continuación y filtros; carga/error/vacío se distinguen.
  - Pruebas de autorización y sanitización demuestran que los roles no autorizados no consultan el reporte y que PII/secretos/datos financieros restringidos no se filtran.
  - Los fallos de lectura, esquema y paginación se informan sin datos ficticios ni respuestas que aparenten éxito.
- **Prioridad:** ALTO (P1).
- **Estado:** Pendiente. La presente normalización no implementa la corrección.

### 5.2. Tarea existente ampliada: AUD-NG-161 — Pruebas conductuales, regresión y aislamiento de producción

- **Referencia exacta a hallazgos:** 3.5, y cobertura de regresión necesaria para 3.1-3.4.
- **Severidad:** ALTO (P1), como tarea transversal de pruebas según su alcance histórico; la ausencia de pruebas específicas deja sin verificación los contratos, la paginación y la integración.
- **Objetivo:** demostrar mediante pruebas conductuales que la bitácora y el dashboard cumplen el contrato, la integridad de resultados, la seguridad y el rendimiento esperado, sin tocar datos ni servicios productivos.
- **Acciones ejecutables:**
  1. Añadir fixtures aislados para BitacoraEventos y BitacoraTrazabilidad con encabezados reales, varios tipos de evento, fechas, servicios, destinatarios, correlaciones, errores, campos opcionales y datos sensibles sintéticos.
  2. Probar el mapeo de todos los campos del DTO, filtros individuales y combinados, rangos de fechas, paginación en límites (primera/última página, página vacía, tamaño mínimo/máximo), orden estable, empates, registros añadidos entre páginas y hojas ausentes/esquema inválido.
  3. Probar la integración del dashboard: endpoint llamado, parámetros serializados con nombres correctos, navegación entre páginas, actualización de filtros y estados de carga/error/vacío.
  4. Probar controles de autorización y sanitización con identidades/roles sintéticos; comprobar que los datos sensibles no aparecen en respuestas ni renderizado.
  5. Añadir pruebas de volumen/medición reproducibles para detectar lecturas completas y regresiones de complejidad; mantener los datos y dobles de prueba fuera de las hojas productivas.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js, tests/regression/modular-dashboard-suite.js y cualquier fixture/helper aislado; backend/user-service/Code.gs y js/developer.js solo como unidades bajo prueba.
- **Dependencias:** implementación y contrato de AUD-NG-145; entorno de pruebas aislado; fixtures que reproduzcan el esquema real sin usar datos productivos.
- **Alcance técnico:** pruebas unitarias/conductuales, integración UI/API simulada, regresión de filtros/paginación, seguridad/sanitización y mediciones controladas. No ejecutar las suites contra hojas reales ni enviar notificaciones.
- **Criterios de aceptación verificables:**
  - Existen casos específicos identificables para getPaginatedAuditLogReport, BitacoraEventos, BitacoraTrazabilidad y loadStructuredLogs/dashboard.
  - Las pruebas fallan ante los defectos documentados (índices desplazados, nombre de hoja incorrecto, filtros incompatibles, paginación posterior a lectura total) y pasan únicamente tras corregirlos.
  - La suite valida resultados y metadatos de paginación, filtros combinados, estabilidad entre páginas, límites y errores.
  - Las pruebas verifican autorización y redacción de datos sensibles.
  - El entorno de pruebas demuestra aislamiento: ningún fixture, escritura, limpieza o llamada de notificación alcanza hojas, despliegues o servicios productivos.
  - Se registra el comando/entorno ejecutado y el resultado reproducible; no se declara cobertura por búsqueda textual ni por respuestas PASS constantes.
- **Prioridad:** ALTO (P1), dependiente de AUD-NG-145.
- **Estado:** Pendiente. Esta normalización no implementa ni ejecuta las pruebas.

### 5.3. Trazabilidad y control de duplicados

- **Tareas existentes ampliadas:** AUD-NG-145 y AUD-NG-161.
- **Tareas nuevas:** ninguna.
- **Hallazgos cubiertos:** 3.1-3.4 quedan asignados a AUD-NG-145; 3.5 queda asignado a AUD-NG-161, que además verifica conductualmente los criterios de aceptación de AUD-NG-145.
- **No duplicar:** AUD-NG-145 mantiene su alcance general de bitácora central, DTO, filtros, sanitización y trazabilidad; AUD-NG-161 mantiene su alcance transversal de pruebas reales, aislamiento y regresión. Esta ampliación no crea un segundo identificador para paginación ni para la integración del dashboard.
- **Estado global:** NO CUMPLE hasta que ambas tareas se implementen, prueben y revisen de forma independiente.

## 6. Pruebas y límites

**Ejecutado:** inspección estática de escritores/lectores, cotejo de índices y nombres de hojas, revisión del dashboard Developer y búsqueda dirigida en ambos archivos regression.

**No ejecutado:** lectura de hojas productivas, consulta con datos reales, prueba HTTP, navegador, medición de rendimiento con volumen, ni suites automatizadas. No se modificó código ni pruebas.

## 7. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 88/183 identificadores auditados; 95 pendientes.
- **Última tarea auditada:** C1.91 / TAREA-F4-P3-02.
- **Siguiente tarea exacta:** TAREA-F4-P3-03 - Establecer un sistema de detección y reconciliación de inconsistencias de identidad.
- **Archivos modificados en la normalización C1.192:** este informe y AUDITORIAS/Contexto_personal.txt.
- **Archivos preservados:** código fuente, pruebas, Pendientes.md, completadas.md, ChangesLogs.txt, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.
