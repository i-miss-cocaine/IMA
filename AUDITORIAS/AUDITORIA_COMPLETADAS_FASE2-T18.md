# Auditoría FASE2-T18: tablero de salud e interoperabilidad institucional

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** f0979d2d4b95ea6b00905455b8a70364d633a8e5  
**Dictamen:** CUMPLE PARCIALMENTE. Existen comprobaciones ping y métricas de capacidad separadas, pero el tablero institucional no las integra y puede presentar un estado saludable sin evidencia operativa.

## Alcance

Se auditó FASE2-T18: disponibilidad, latencia, errores, cuotas, procesos pendientes, eventos fallidos, fecha de actualización, atribución de dependencias, filtros, control de acceso, protección de datos y enlaces a diagnóstico/recuperación. La especificación AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md no está disponible en la rama; se utilizó el alcance explícito de completadas.md.

## Archivos inspeccionados

| Archivo | SHA | Elementos revisados |
|---|---|---|
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | openInstitutionalHealthDashboardModal (1939); lectura getServiceHealthMetrics (1944) |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi (11); timeout fijo (36); checkMicroserviceHealth (207); checkAllMicroservicesHealth (245) |
| js/developer.js (consumidor relacionado) | 6fa4c4bd9be580c974b1fbede4f0cf79485dc331 | executeDevHealthChecks (90); lista de servicios (99) |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | getServiceHealthReport (73); getOperationalCapacityMetrics (4080); recordTraceabilityLog (4548); getTraceabilityCorrelationLogs (4575); retryFailedEventsQueue (4700) |
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc | PUBLIC_ACTIONS (265); ping (964); getServiceHealthDiagnostics (4451) |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | doGet (75); PUBLIC_ACTIONS (85); no se encontró acción ping |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c | doGet (64); PUBLIC_ACTIONS (75); no se encontró acción ping |
| backend/accounting-service/Code.gs | 38b979d41596b85e888b4a7060b37bbac0840a28 | ping (834); PUBLIC_ACTIONS (218) |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | doGet (9); ping delega a doGet (152) |

## Evidencia

### 1. Tablero institucional sin conexión con métricas reales

openInstitutionalHealthDashboardModal (ui-common.js, 1939) solicita window.getServiceHealthMetrics. Si esa función no está disponible, usa un objeto de métricas en cero. No se encontró una definición de getServiceHealthMetrics en ui-common.js, api.js ni developer.js. El tablero no llama a checkAllMicroservicesHealth, getOperationalCapacityMetrics, getServiceHealthReport, getServiceHealthDiagnostics ni getTraceabilityCorrelationLogs.

Con métricas cero, la tasa de error global queda en 0%; las cinco tarjetas (USER, ACADEMIC, ACCOUNTING, TASK, EXAM) quedan con total=0 y error=0, por lo que el código las etiqueta OPERATIVO y el estado global SALUDABLE. No distingue ausencia de telemetría de una medición real sin errores. La actualización vuelve a abrir el mismo modal; no dispara una consulta de salud. “Última actualización” se genera con el reloj local al renderizar, no con la fecha de la última medición.

El modal no presenta latencia, procesos pendientes, eventos fallidos, dependencias degradadas, incidencias, filtros por servicio/periodo/tipo ni enlaces a diagnóstico/recuperación. La función tampoco contiene una comprobación de rol propia; la protección dependería de su invocador.

### 2. Health checks parciales y no integrados

checkMicroserviceHealth (api.js, 207) realiza un ping y mide round-trip. checkAllMicroservicesHealth (245) solo consulta USER, ACADEMIC, TASK y EXAM; omite ACCOUNTING y DEVELOPER. Sin embargo, la arquitectura y SERVICE_URLS contemplan más servicios.

En los archivos backend revisados, USER (ping en 1552) y ACADEMIC (964) devuelven dbConnected=true fijo; no abren ni prueban la base de datos en esa acción. ACCOUNTING sí implementa ping (834), pero el monitor no lo incluye. TASK y EXAM no tienen acción ping, aunque checkAllMicroservicesHealth los consulta; una respuesta de acción desconocida puede confundirse con caída del servicio. DEVELOPER acepta ping delegando a doGet (152), cuyo controlPlaneConnected=true no prueba acceso real a recursos críticos.

js/developer.js (90) sí consume checkAllMicroservicesHealth, pero repite la lista de cuatro servicios. Clasifica una respuesta como exitosa si status=success, aunque state sea Degradado por latencia; por ello puede mostrar ONLINE ante una respuesta lenta que checkMicroserviceHealth ya clasificó como Degradado.

### 3. Timeout y manejo de disponibilidad

checkMicroserviceHealth pasa timeout:6000 a fetchApi. fetchApi (api.js, 36) ignora options.timeout y fija AbortController a 60000 ms. El control de salud puede tardar hasta el límite general de 60 segundos, no los 6 segundos declarados por el llamador. Esta brecha ya corresponde a AUD-NG-007.

### 4. Métricas backend no integradas y contratos incompatibles

getOperationalCapacityMetrics (user-service, 4080) calcula operaciones, latencia promedio, errores y errores de cuota a partir de BitacoraTrazabilidad. No filtra por periodo, no cuenta la cola BitacoraEventos ni los procesos pendientes/fallidos, y no calcula disponibilidad por ping. Si no hay registros, totalEvents=0, errorRate=0 y quotaEvents=0, por lo que devuelve capacidadEstado=OPTIMO. Su timestamp es el momento de la consulta, no la fecha del dato más reciente. Los umbrales son fijos (>10% de error y >5 errores de cuota).

El endpoint devuelve resumenGeneral y desgloseServicios (peticionesProcesadas, latenciaPromedioMs, erroresTotales, erroresCuota y tasaErrorPorcentaje). El modal espera totalCalls, successCalls, failedCalls, quotaErrors y serviceMetrics. No existe un adaptador que una ambos contratos.

La suite runInterdepartmentalIntegrationTestSuite (user-service, 221) espera metricsRes.capacidadOperativa y metricsRes.capacidadOperativa.estadoSalud, propiedades que getOperationalCapacityMetrics no devuelve. La prueba INT-04 falla por incompatibilidad de DTO, aunque la suite exterior devuelve status=success y reporta el detalle de casos fallidos.

getServiceHealthReport (73) cuenta errores/advertencias de LogsSistema y declara DEGRADADO solo cuando erroresCount>50; no aplica ventana temporal ni desglose real por servicio y usa versiones estáticas. No mide latencia, cola, procesos pendientes o dependencia afectada. Ninguno de estos endpoints está conectado al modal.

### 5. Dependencias, eventos y filtros

recordTraceabilityLog (4548) almacena origen, destino, acción, estado, duración y errorDetails. getTraceabilityCorrelationLogs (4575) permite filtrar correlationId, status y service, pero no periodo ni tipo de incidencia; devuelve errorDetails sin redacción adicional. getOperationalCapacityMetrics agrupa por servicio de origen, sin identificar qué dependencia destino causó el error ni agregar relaciones causales.

retryFailedEventsQueue (4700) procesa eventos pendientes/fallidos, pero el tablero no consulta BitacoraEventos ni muestra cantidades de pendientes, reintentando o fallidos permanentes. La presencia de un proceso pendiente o una cola fallida no modifica el estado global del tablero.

### 6. Diagnóstico y permisos

getServiceHealthDiagnostics (academic-service, 4451) comprueba acceso a Spreadsheet y, con fullCheck, Drive; pero connectivity y permissions empiezan en PASS fijo. El resultado de salud depende de esos valores y de spreadsheetAccess/driveAccess; no verifica endpoints de otros servicios ni dependencias externas. Además, getServiceHealthDiagnostics está incluido en PUBLIC_ACTIONS (265), por lo que su diagnóstico puede consultarse sin la autorización administrativa que el criterio del tablero requiere.

getServiceHealthReport aplica control interno a Administrador/Desarrollador/Director. Las métricas de capacidad y trazabilidad están en permisos de personal directivo. Sin embargo, el modal no utiliza esos endpoints protegidos ni contiene autorización propia. Los logs de trazabilidad exponen errorDetails tal como se registró, hasta 500 caracteres; el saneamiento por esquema de datos sensibles debe quedar cubierto por AUD-NG-145.

## Dictamen por criterio

| Criterio | Dictamen |
|---|---|
| Estado operativo real de cada servicio | No cumple |
| Disponibilidad y latencia | Parcial; ping limitado, no integrado y cobertura incompleta |
| Tasa de error y cuotas | Parcial; existe cálculo de backend, pero no lo consume el tablero |
| Procesos pendientes y eventos fallidos | No cumple |
| Fecha real de última medición | No cumple |
| Identificación de dependencias causantes | No cumple |
| Filtros por servicio, periodo y tipo | No cumple |
| Acceso restringido a personal autorizado | Parcial; el modal no se protege y el diagnóstico académico es público |
| Protección de PII/credenciales/finanzas | No demostrado; errorDetails se devuelve sin redacción específica |
| Enlaces a diagnóstico y recuperación | No cumple |
| No declarar salud completa ante telemetría ausente/fallos críticos | No cumple |

## Reconciliación

No se crea un AUD-NG nuevo. Las brechas están cubiertas por tareas pendientes existentes:

- **AUD-NG-144:** completar ping real y autenticado en todos los servicios, monitorizar el registro completo, integrar los resultados al tablero y distinguir online/degradado/offline.
- **AUD-NG-145:** conectar bitácora central, filtros y sanitización de errorDetails/PII.
- **AUD-NG-007:** aplicar timeout configurado por llamada en fetchApi.
- **AUD-NG-008:** no convertir ausencia de datos o fallback en una respuesta de salud exitosa.
- **TASK-064:** integrar métricas reales de capacidad/cuotas, periodos, colas, frescura, umbrales, dependencias y alertas en el panel; no declarar OPTIMO cuando no hay telemetría.

AUD-NG-163 permanece duplicada y no debe reabrirse independientemente; conservar la consolidación ya registrada en AUD-NG-131/144/145, TASK-064 y AUD-NG-161.

## Límites

Inspección estática/manual. No se ejecutaron pings en despliegues, simulaciones de caída, pruebas de latencia, consultas de cuotas, filtros, roles ni fallos de colas. No se usaron datos productivos ni se modificó código fuente.


---

## Tareas ejecutables derivadas de los hallazgos

> La reconciliación identifica tareas y hallazgos existentes. TASK-064 es la tarea integradora del tablero de salud/capacidad; AUD-NG-144/145 y AUD-NG-007/008 conservan requisitos específicos que deben satisfacerse dentro de esa integración, sin crear IDs duplicados.

### [TASK-064] Integrar observabilidad real, salud, capacidad y recuperación en el tablero institucional
- **Hallazgo de origen:** brechas del tablero y health checks; AUD-NG-144, AUD-NG-145, AUD-NG-007 y AUD-NG-008.
- **Severidad:** Alta. **Objetivo:** mostrar estado operativo real y reciente de todos los servicios y dependencias, métricas de capacidad, colas, errores y enlaces de diagnóstico, sin declarar SALUDABLE/ÓPTIMO ante ausencia de telemetría.
- **Acción ejecutable:** conectar `openInstitutionalHealthDashboardModal` con health checks y métricas backend; incluir USER/ACADEMIC/ACCOUNTING/TASK/EXAM/DEVELOPER; implementar ping real y autenticado para cada servicio y comprobar recursos críticos; corregir contratos DTO entre modal, monitor y métricas; mostrar latencia, errores/cuotas, procesos pendientes, eventos fallidos, frescura de datos y dependencias causantes; agregar filtros por servicio/periodo/tipo y enlaces autorizados a diagnóstico/recuperación; aplicar sanitización de `errorDetails`; hacer que ausencia de datos, timeout o fallback produzcan estado desconocido/degradado, nunca éxito automático.
- **Archivos/módulos:** `js/ui-common.js` (`openInstitutionalHealthDashboardModal`); `js/api.js` (`fetchApi`, `checkMicroserviceHealth`, `checkAllMicroservicesHealth`); `js/developer.js`; `backend/user-service/Code.gs` (`getServiceHealthReport`, `getOperationalCapacityMetrics`, `getTraceabilityCorrelationLogs`, `retryFailedEventsQueue`); ping/diagnóstico en USER, ACADEMIC, ACCOUNTING, TASK, EXAM y DEVELOPER.
- **Dependencias/riesgos:** AUD-NG-144 (ping real/cobertura completa); AUD-NG-145 (filtros/DTO/sanitización); AUD-NG-007 (timeout por llamada); AUD-NG-008 (fallback no equivale a salud); TASK-062 (versiones/contratos); AUD-NG-163 permanece consolidada y no se reabre. Riesgo de falsos positivos, endpoints públicos de diagnóstico, exposición de PII y latencias no representativas.
- **Alcance:** tablero de observabilidad y salud institucional de extremo a extremo; mantener segregados endpoints de diagnóstico privilegiado y datos sensibles.
- **Criterios de aceptación:** los seis servicios se consultan mediante ping real; cada respuesta distingue ONLINE/DEGRADED/OFFLINE/UNKNOWN; timeout configurado por llamada se respeta; base de datos/Drive/dependencias se comprueban realmente; métricas incluyen ventana temporal y fecha de última medición; colas pendientes/fallidas alteran el estado; DTO coincide con consumidores; filtros funcionan; errores se redactan; acceso restringido a roles autorizados; sin telemetría el tablero nunca muestra SALUDABLE/ÓPTIMO; pruebas de timeout, caída, latencia, cuotas, cola fallida, permisos y ausencia de datos.
- **Prioridad:** conservar la prioridad vigente de TASK-064 (no reespecificada en este informe). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el modal usa métricas cero y las interpreta como saludable, no consulta métricas reales, omite servicios, y existen contratos incompatibles y diagnósticos incompletos/públicos.

### Reconciliación y límites
- **AUD-NG-144:** conserva ping real, cobertura completa y estado del tablero; se valida dentro de TASK-064.
- **AUD-NG-145:** conserva filtros, DTO y sanitización de bitácora; se valida dentro de TASK-064.
- **AUD-NG-007:** conserva timeout configurable por llamada en fetchApi.
- **AUD-NG-008:** conserva la regla fail-closed ante ausencia de telemetría/fallback.
- **AUD-NG-163:** sigue duplicada/consolidada; no reabrir independientemente.
- **Pruebas:** inspección estática/manual; no se ejecutaron pings en deployments, simulaciones de caída, latencia, cuotas, filtros, roles ni recuperación de colas.
- **Estado:** FASE2-T18 cumple parcialmente; esta normalización no demuestra operación real ni cierra los hallazgos.
