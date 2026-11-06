# Auditoría de completadas.md - TAREA-03

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Tarea:** TAREA-03 - Implementar supervisión operativa y prevención de agotamiento de cuotas  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676  
**HEAD de referencia:** e13cf1c7eba0e0124ac067cf5a62299d4f4ab965

## Dictamen

**CUMPLE PARCIALMENTE.** Hay mecanismos aislados de registro, consultas de salud, medición de latencia/volumen y reintentos limitados, pero no existe una supervisión operativa coherente y verificable que cubra los cinco microservicios y el cliente. No se acredita la medición real y diferenciada de las cuotas relevantes, alertas preventivas, clasificación uniforme de errores, ni un mecanismo general de checkpoint/reanudación y control de concurrencia para trabajos masivos. El cambio específico atribuido a TAREA-03 en el changelog tampoco está presente en la versión actual de `js/api.js`.

## Alcance y evidencias

### 1. Registro de métricas en el cliente

- `js/api.js`, SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`: el archivo comienza con el helper `fetchApi`; no contiene `OPERATIONAL_HEALTH_METRICS`, `getServiceHealthMetrics` ni los incrementos de llamadas exitosas/errores que ChangesLogs.txt atribuye a TAREA-03.
- `fetchApi` aplica hasta dos reintentos, pero usa esperas lineales de 1 y 2 segundos (`1000 * (retryCount + 1)`) y filtra errores por fragmentos de texto de red. No clasifica de manera estructurada errores de cuota, autorización, validación o fallos permanentes; tampoco registra métricas por intento, servicio, acción, duración o volumen.
- `js/persistence.js` implementa almacenamiento local IndexedDB y reconciliación de caché; no constituye un registro de trabajos masivos con checkpoint confirmado, estado reanudable, exclusión mutua ni recuperación de operaciones.

### 2. Métricas y registros en los servicios

- `backend/user-service/Code.gs`: existen `getServiceHealthReport` y `getOperationalCapacityMetrics`. El primero agrega registros de `LogsSistema`, usa versiones de servicio codificadas de forma fija y clasifica cuotas mediante palabras del código/mensaje. El segundo calcula latencia media, errores y coincidencias de cuota leyendo `BitacoraTrazabilidad`; no acredita que todas las solicitudes de los cinco servicios se escriban allí ni mide cuotas disponibles/consumidas por usuario, ejecución o servicio integrado. El estado degradado depende de umbrales globales fijos.
- `backend/user-service/Code.gs` y `backend/accounting-service/Code.gs` tienen `logStructuredEvent` que persiste en `LogsSistema`; también hay registro estructurado en ACADEMIC. En TASK y EXAM predominan `Logger.log`, `console.log` y capturas locales. No se verificó un contrato uniforme de eventos operativos que permita consolidar tiempos, errores, reintentos y volumen de todos los servicios.
- `backend/academic-service/Code.gs`: `getStorageQuotaMetricsReport` calcula tamaño documental a partir de filas de `DocumentosEstudiante`, pero asigna `capacityUsagePct: 15.5` como valor fijo. Por tanto, sus umbrales no se basan en el uso real de la cuota de Drive.
- `backend/task-service/Code.gs`: `getDriveStorageQuotaMetricsReport` intenta consultar `Drive.About.get()` y tiene una ruta alternativa de estimación; es una medición puntual de almacenamiento Drive, no un monitor de cuotas diarias/de ejecución de Apps Script, Sheets, notificaciones o servicios externos.
- `backend/exam-service/Code.gs`: `getGradingPerformanceAndPersistenceMetrics` cuenta filas de seis hojas y mide el tiempo de esa lectura puntual. Los umbrales son heurísticos y no aportan medición de cuotas, tasa de error, reintentos, volumen de solicitudes ni alertas.
- Los routers `doPost` no comparten un clasificador de excepciones de cuota. USER registra excepciones no controladas como `UNHANDLED_EXCEPTION`; TASK y EXAM retornan errores genéricos y escriben en el log de ejecución; las respuestas no distinguen de forma uniforme error temporal, permanente, cuota, autorización o validación.

### 3. Health checks, alertas y continuidad

- `js/api.js` incluye `checkMicroserviceHealth` y `checkAllMicroservicesHealth`, pero el segundo solo consulta USER, ACADEMIC, TASK y EXAM. El alcance incompleto y los pings/diagnósticos no fiables ya están registrados en AUD-NG-144; no se duplica esa causa.
- Los defectos de integración y privacidad de la bitácora central ya están registrados en AUD-NG-145. El hallazgo actual se limita a la ausencia de métricas reales y alertas de cuotas/capacidad, no vuelve a abrir el contrato de logs.
- No se encontró un mecanismo general que persista el último lote/registro confirmado de cualquier trabajo masivo y permita reanudarlo de forma segura. Hay cargas de archivos por partes, pero no equivalen a un coordinador de trabajos masivos de todos los servicios.
- Hay usos puntuales de `LockService`, `CacheService` y colas de eventos/notificaciones. No constituyen una política institucional de límites de concurrencia por servicio ni garantizan que los procesos extensos cedan recursos sin bloquear otras operaciones.
- No se encontró una rutina de alertas preventivas de cuotas que calcule umbrales reales y notifique de forma deduplicada a administradores. Un campo de estado o recomendación devuelto por una consulta no demuestra que una alerta haya sido emitida.
- No se ejecutaron pruebas de carga, agotamiento de cuota, fallos inducidos, reanudación de lotes ni pruebas de concurrencia contra un entorno aislado. No se accedió a datos productivos ni a los despliegues de Apps Script.

## Contraste con ChangesLogs.txt

La entrada histórica de TAREA-03 afirma que `js/api.js` recibió `OPERATIONAL_HEALTH_METRICS`, `getServiceHealthMetrics`, contadores de llamadas y errores, detección de `quotaExceeded` y backoff exponencial. Ninguno de esos símbolos ni cambios está presente en el archivo actual. El changelog también atribuye modificaciones a `Pendientes.md`, `Auditoria.txt` y `ChangesLogs.txt`, pero esos registros históricos no demuestran por sí solos el comportamiento en el código vigente. No se modificó ChangesLogs.txt durante esta auditoría.

## Hallazgos y control de duplicados

- **Hallazgo nuevo AUD-NG-163:** instrumentación real y consolidada de cuotas/capacidad, alertas preventivas y control reanudable de trabajos masivos. Se añade a Pendientes.md.
- **AUD-NG-144:** health checks y cobertura de todos los servicios.
- **AUD-NG-145:** bitácora central, DTO, filtros y sanitización.
- **AUD-NG-006 / AUD-NG-069:** clasificación de reintentos, claves idempotentes y prevención de efectos duplicados.
- **AUD-NG-133:** idempotencia transaccional de pagos.
- **AUD-NG-161:** pruebas conductuales de concurrencia, pérdida de respuesta y recuperación.
- No se duplican esas tareas: AUD-NG-163 se centra en telemetría de consumo de recursos/cuotas, umbrales y alertas reales, y checkpoints generales de procesos.

## Calidad de implementación

La calidad es **insuficiente para declarar la tarea completada**. La implementación está fragmentada entre servicios, combina registros persistentes con logs de ejecución, utiliza valores codificados o estimados, no tiene un contrato de métricas común y el changelog describe código de cliente que ya no existe. Los datos disponibles no permiten identificar de forma fiable qué servicio/usuario/operación consume cuotas ni anticipar su agotamiento.

## Límites de verificación

La auditoría fue estática y documental sobre los archivos del repositorio en la rama indicada. No se probaron los límites reales de Apps Script/Google Workspace, la configuración de triggers, permisos de despliegue, comportamiento bajo carga ni datos de producción. Esos puntos quedan expresamente sin verificar.

## Archivos y restricciones

- Se modifican solo registros/documentos de auditoría y el backlog autorizado.
- No se modifica código fuente, `completadas.md`, `ChangesLogs.txt` ni `METODOLOGIA_DESARROLLO.md`.
- La tarea se cerrará en un solo commit con todos los archivos de esta iteración.
- La rama base `NG_beta_0.0.0.1` no se modifica y no se hace merge.


## Addendum de control de duplicados (2026-11-05)
En revisión posterior se identificó que AUD-NG-163 se solapa con tareas preexistentes. Se conserva el registro histórico, pero queda marcado como duplicado y no debe ejecutarse por separado: TASK-064 (cuotas/capacidad/alertas); AUD-NG-144/AUD-NG-145 (health checks/bitácora); AUD-NG-006/AUD-NG-069/AUD-NG-133/AUD-NG-161 (reintentos/idempotencia/pruebas); TASK-154/TASK-227/TASK-265 (checkpoints y reanudación). El dictamen de TAREA-03 permanece CUMPLE PARCIALMENTE.


---

## Tareas ejecutables derivadas de los hallazgos

> Control de duplicados posterior a la auditoría: AUD-NG-163 se conserva como rastro histórico, pero está marcado como duplicado y NO debe ejecutarse por separado. La cobertura se distribuye entre tareas existentes. Este bloque documenta esa asignación y evita reabrir el hallazgo duplicado.

### [TASK-064] Integrar observabilidad real de salud, capacidad, cuotas y alertas
- **Hallazgo de origen:** TAREA-03; AUD-NG-163 (registro histórico consolidado/duplicado); relación con las brechas de observabilidad y capacidad descritas en FASE2-T18.
- **Objetivo:** proporcionar métricas reales y recientes por servicio/operación, identificar consumo y riesgo de agotamiento de cuotas, y emitir alertas preventivas verificables sin confundir ausencia de datos con estado saludable.
- **Acción ejecutable dentro de la tarea existente:** integrar las métricas reales de cuotas/capacidad en la observabilidad institucional; cubrir los servicios y recursos aplicables; retirar porcentajes fijos y estimaciones presentadas como medición real; identificar la fuente, ventana temporal y última actualización de cada métrica; clasificar errores de cuota, autorización, validación y fallos permanentes; definir umbrales sustentados en mediciones y alertas preventivas deduplicadas; reflejar degradación o estado desconocido cuando falte telemetría. Mantener la integración del tablero y sus contratos en el alcance ya definido para TASK-064.
- **Archivos/módulos relacionados:** backend/user-service/Code.gs, backend/academic-service/Code.gs, backend/accounting-service/Code.gs, backend/task-service/Code.gs, backend/exam-service/Code.gs, js/api.js, js/persistence.js y tablero institucional; los archivos exactos se conservan según el inventario de TASK-064.
- **Dependencias y riesgos:** AUD-NG-144 mantiene health checks y cobertura de servicios; AUD-NG-145 mantiene contrato, filtros y sanitización de bitácora; AUD-NG-006/AUD-NG-069/AUD-NG-133/AUD-NG-161 mantienen reintentos, idempotencia y pruebas. No duplicar esos mecanismos. Riesgo de falsos positivos por métricas fijas, eventos incompletos o alertas que solo se representen como campos de respuesta.
- **Alcance:** telemetría real de consumo/capacidad/cuotas y alertas preventivas integrada en la observabilidad existente. No crea una segunda implementación paralela de health checks o bitácora.
- **Criterios de aceptación:** métricas trazables a servicio/operación y periodo; valores derivados de fuentes reales, nunca constantes presentadas como consumo; clasificación de cuota y error verificable; umbrales justificados; alertas emitidas y deduplicadas; ausencia/antigüedad de datos produce UNKNOWN o DEGRADED, nunca SALUDABLE; pruebas aisladas cubren cuota cercana al límite, cuota agotada, fuente ausente, alerta repetida y recuperación.
- **Prioridad y estado:** conservar los vigentes en TASK-064; no se reespecifican en este informe.
- **Evidencia de cierre:** pendiente; TAREA-03 fue auditada estáticamente y no se probaron cuotas reales, cargas ni alertas en despliegues.

### [TASK-154 / TASK-227 / TASK-265] Conservar la cobertura existente de checkpoints y reanudación
- **Hallazgo de origen:** TAREA-03, continuidad de trabajos masivos y recuperación; consolidación expresa en el addendum de control de duplicados.
- **Acción ejecutable:** atender checkpoints, persistencia de progreso, recuperación y reanudación dentro de las tareas ya existentes TASK-154, TASK-227 y TASK-265. No crear un coordinador paralelo ni asignar a AUD-NG-163 una ejecución independiente.
- **Criterios de aceptación:** utilizar los criterios y estados vigentes de esas tareas; demostrar que el progreso confirmado se conserva y que la reanudación no duplica efectos, en coordinación con AUD-NG-006 y AUD-NG-161.
- **Estado:** conservar el vigente en cada tarea referenciada; este informe no las modifica ni las declara cerradas.

### Reconciliación de hallazgos relacionados
- **AUD-NG-163:** duplicado/consolidado; se conserva por trazabilidad histórica y no debe ejecutarse independientemente.
- **AUD-NG-144 / AUD-NG-145:** mantienen respectivamente health checks/cobertura y bitácora/contratos/sanitización; no se absorben ni duplican.
- **AUD-NG-006 / AUD-NG-069 / AUD-NG-133 / AUD-NG-161:** mantienen sus ámbitos de reintentos, idempotencia transaccional y pruebas conductuales; TAREA-03 no crea tareas nuevas para esos mecanismos.
- **Dictamen y límites:** TAREA-03 permanece en CUMPLE PARCIALMENTE. La formalización no prueba cuotas reales, alertas, carga, reanudación ni despliegues; la auditoría fue estática/manual.
