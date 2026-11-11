# Auditoría de completadas.md - FASE2-T02

**Fecha:** 2026-11-04  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** FASE2-T02 - Garantizar la idempotencia de las operaciones y evitar duplicaciones por reintentos HTTP  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676

## Dictamen

**CUMPLE PARCIALMENTE.** Existen mecanismos reales de reintento, claves idempotentes, caché de resultados, bloqueos y deduplicación de negocio en algunas rutas. No obstante, el cliente reintenta escrituras POST sin generar ni exigir una clave estable; los mecanismos backend son opcionales, temporales y no reservan claves atómicamente. Las protecciones específicas de pagos y matrículas cubren escenarios limitados, pero no constituyen una garantía uniforme para todas las operaciones con efectos secundarios.

## Evidencia por criterio

### 1. Clasificación de operaciones y política de reintentos
- `js/api.js:10-14` define `MAX_RETRIES = 2`, pero `fetchApi` no clasifica acciones como lectura, escritura idempotente o no idempotente.
- `js/api.js:58-69` construye todas las solicitudes con método POST. El cuerpo contiene `action` y `payload`; no añade `idempotencyToken` ni `idempotencyKey`.
- `js/api.js:143-151` reintenta hasta dos veces cuando el mensaje de error contiene `fetch`, `Network` o `Failed`, sin distinguir si la acción ya produjo efectos secundarios.
- Una pérdida de respuesta después de que el servidor persista una escritura puede provocar que el mismo POST vuelva a ejecutarse. Si el payload no trae una clave idempotente, los mecanismos backend no pueden reconocer ese reintento.
- No se reintentan de forma consistente todos los fallos temporales: los errores HTTP se convierten en mensajes `Error HTTP: ...`, y los errores de aborto por timeout no coinciden necesariamente con los tres textos comprobados.
- `js/api.js:25-35` fija el timeout en 60 segundos; la opción `options.timeout` no se aplica. Esto afecta, entre otros, a la llamada de health check que solicita un límite distinto. Se registra como observación relacionada con la política de reintentos, sin crear un hallazgo duplicado.

### 2. Mecanismo genérico de idempotencia en ACADEMIC y ACCOUNTING
- `backend/academic-service/Code.gs:268-312` y `backend/accounting-service/Code.gs:220-264` implementan `getIdempotencyPayloadSignature`, `checkAndRegisterIdempotencyKey` y `saveIdempotentResult`.
- La clave es opcional: solo se activa cuando el payload contiene `idempotencyToken` o `idempotencyKey`.
- La clave de caché es `IDEM_<action>_<token>`; no existe una reserva previa del identificador ni un estado de operación en curso.
- La comprobación mediante `cache.get` y el almacenamiento posterior mediante `cache.put` son pasos separados. Dos solicitudes concurrentes pueden comprobar la misma clave antes de que alguna guarde el resultado.
- El resultado solo se guarda cuando el handler termina con `status === "success"`, después de ejecutar la operación. Un fallo posterior a una escritura pero anterior al almacenamiento del resultado deja la clave sin resultado recuperable.
- El almacenamiento usa `CacheService.getScriptCache()` durante 21,600 segundos (seis horas). No es un registro durable ni ofrece por sí solo recuperación después de expiración, expulsión o fallo de caché. El error de `cache.put` se captura y solo se registra en consola.
- La firma compara el payload serializado, excluyendo token, requestId, timestamp y authRole. Detecta incompatibilidad únicamente cuando ya existe una entrada de caché legible; no sustituye la reserva atómica.
- Ambos routers aplican el chequeo antes de despachar y guardan el resultado después de ejecutar el handler. La lógica está duplicada en dos microservicios y no hay una política común que obligue a todas las escrituras a participar.

### 3. Operaciones de ACCOUNTING
- `backend/accounting-service/Code.gs:572-604` valida permisos, consulta la clave idempotente antes del despacho y ejecuta `recordStudentPayment` entre otras acciones. El resultado se almacena al final del router solo si la acción no comienza por `get` y la respuesta es exitosa.
- `recordStudentPayment` (`Code.gs:3890-3955`) tiene una deduplicación adicional por `idempotencyKey`, `tokenTransaccion` o `referencia`, consultando la hoja `PagosAbonos`.
- Esa ruta no contiene un `LockService` propio alrededor de la lectura de duplicados y el `appendRow`. Dos pagos concurrentes con la misma clave pueden superar la consulta inicial antes de insertar. La comprobación local tampoco compara una firma del contenido asociado a la referencia.
- El alcance de atomicidad, validación del cargo y colisiones de referencias ya está registrado en **AUD-NG-133**; no se duplica ese defecto.

### 4. Operaciones de ACADEMIC
- `createAdmissionRequest` (`Code.gs:985-1055`) comprueba la clave, adquiere un bloqueo y realiza una deduplicación de negocio por identificación o combinación de nombre/fecha/año. El resultado idempotente se guarda después de insertar la solicitud.
- La consulta de caché ocurre antes de la reserva del bloqueo y no hay una reserva atómica de la clave. La deduplicación natural puede evitar una segunda solicitud, pero ante una repetición puede devolver un error de duplicado en vez del resultado original.
- `createStudentEnrollment` (`Code.gs:11140-11220`) utiliza `LockService` y comprueba si ya existe una matrícula activa/confirmada para el mismo estudiante y año lectivo. Devuelve la matrícula existente, lo que ofrece protección de negocio para ese caso, pero no asocia una clave de idempotencia con el resultado ni cubre las demás operaciones de escritura.
- `updateAcademicConfig` también utiliza un bloqueo y una lógica de actualización de estado; esto no acredita una política común para escrituras no naturalmente idempotentes.

### 5. Calidad de las pruebas de concurrencia e idempotencia
- `backend/accounting-service/Code.gs:10505-10550`, función `runCriticalProcessConcurrencySuite`, no ejecuta dos solicitudes concurrentes ni simula pérdida de respuesta, repetición de clave, payload incompatible o fallo posterior a persistencia.
- La prueba de LockService solo intenta adquirir y liberar un candado; no provoca contención ni verifica exclusión entre dos operaciones.
- La prueba denominada `Integridad de Transacciones de Cobro` lee la hoja `TransaccionesCobro`, cuenta filas y asigna `PASSED` incondicionalmente. La función `recordStudentPayment` inspeccionada escribe en `PagosAbonos`; por tanto, esa comprobación no valida los pagos de esa ruta ni la unicidad de sus claves.
- La prueba de CUV cuenta filas de `DocumentosEscolaresEmitidos` y asigna `PASSED` sin comparar los códigos para comprobar unicidad.
- La suite no contiene casos de matrícula ni planilla, aunque esos procesos forman parte de los criterios de aceptación de FASE2-T02.
- El contador `passed` puede reportar éxito aunque las invariantes de duplicación nunca hayan sido comprobadas.

## Hallazgo nuevo

**AUD-NG-161 (ALTO, P1): la suite de concurrencia reporta resultados positivos sin probar idempotencia ni concurrencia real.**

La función `runCriticalProcessConcurrencySuite` genera estados `PASSED` a partir de la adquisición de un único lock y del conteo de filas. No comprueba la unicidad de tokens ni CUV, consulta una hoja distinta de la que usa `recordStudentPayment` y omite matrícula y planilla. Esto produce una señal de calidad engañosa y no puede respaldar la afirmación de que FASE2-T02 superó pruebas de concurrencia e idempotencia.

**Tarea derivada:** AUD-NG-161, registrada en `Auditoria.txt` y `Pendientes.md`.

## Hallazgos existentes relacionados (sin duplicación)

- **AUD-NG-006:** ya exige clasificar operaciones, enviar claves estables desde `fetchApi` y reservarlas atómicamente en backend; cubre el defecto general de reintentos sin idempotencia.
- **AUD-NG-133:** ya exige idempotencia atómica y bloqueo en pagos/abonos, además de validar propiedad del cargo y evitar colisiones.
- La presente auditoría amplía la evidencia de esas tareas y añade AUD-NG-161 únicamente para la suite que declara pruebas superadas sin comprobar las invariantes.

## Evaluación de calidad

La implementación tiene buenas piezas parciales (comparación de payload, replay de resultado, bloqueo en admisiones/matrículas y deduplicación específica de pagos), pero la arquitectura es incompleta: el cliente no controla la semántica del reintento, la clave no se reserva antes del efecto de negocio, el almacenamiento es efímero y las pruebas no ejercitan los escenarios que dicen validar. La duplicación de helpers entre ACADEMIC y ACCOUNTING aumenta el riesgo de divergencia. La calidad global de esta capacidad es **insuficiente para operaciones financieras o administrativas críticas**.

## Pruebas y límites

- Auditoría estática y manual sobre el código versionado.
- No se ejecutaron solicitudes concurrentes, pruebas de navegador, pruebas de pérdida de respuesta ni escrituras contra Google Sheets productivo.
- No se verificó el comportamiento de despliegues Apps Script ni la retención real de CacheService.
- No se modificó código fuente, `completadas.md` ni `ChangesLogs.txt`.

## Resumen

- FASE2-T02: cumple parcialmente.
- Hallazgo nuevo: AUD-NG-161.
- Hallazgos existentes vinculados: AUD-NG-006 y AUD-NG-133.
- Archivos inspeccionados: `js/api.js`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`.
- SHA de respaldo: js/api.js `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`; ACADEMIC `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`; ACCOUNTING `38b979d41596b85e888b4a7060b37bbac0840a28`.
- Progreso: 7/183 identificadores únicos auditados; 176 pendientes.
- Siguiente tarea: `T-UX-01`, inmediatamente después de FASE2-T02 en `completadas.md`.

---

## Tareas ejecutables derivadas de los hallazgos

> Se formaliza AUD-NG-161 como tarea específica de calidad de pruebas. AUD-NG-006 conserva la corrección general de idempotencia del cliente/backend y AUD-NG-133 conserva la atomicidad transaccional de pagos; este informe no duplica esos mecanismos.

### [AUD-NG-161] Sustituir las pruebas nominales por pruebas conductuales de idempotencia y concurrencia
- **Hallazgo de origen:** criterio 5; función `runCriticalProcessConcurrencySuite` en `backend/accounting-service/Code.gs`; pruebas de LockService, integridad de pagos y unicidad de CUV que reportan `PASSED` sin ejercitar ni comprobar las invariantes correspondientes.
- **Severidad:** Alta. **Objetivo:** impedir falsos positivos en la suite y obtener evidencia reproducible de que los flujos críticos resisten concurrencia, reintentos, pérdida de respuesta y claves incompatibles.
- **Acción ejecutable:** reemplazar las comprobaciones nominales por escenarios conductuales que ejecuten dos o más operaciones coordinadas y verifiquen exclusión mutua y resultados persistidos; comprobar duplicados directamente en `PagosAbonos` para la ruta `recordStudentPayment`; comparar CUV reales para demostrar unicidad; añadir casos de matrícula y planilla; simular reintento con la misma clave, reutilización de clave con payload distinto, pérdida de respuesta y fallo después de persistir pero antes de devolver/guardar el resultado; hacer que cada caso derive su estado PASSED/FAILED de aserciones sobre invariantes observables y falle si la preparación o lectura de evidencia no puede completarse.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, función `runCriticalProcessConcurrencySuite`; `recordStudentPayment`; hoja `PagosAbonos`; hoja `DocumentosEscolaresEmitidos`; flujos de matrícula y planilla; archivos de pruebas de regresión que se incorporen al alcance tras su inventario.
- **Dependencias y riesgos:** AUD-NG-006 conserva la clasificación de operaciones, claves estables y reserva idempotente; AUD-NG-133 conserva la atomicidad, bloqueo y validación de pagos. La suite debe probar esos contratos sin reimplementar sus mecanismos. Riesgo de falsos positivos si se simula concurrencia secuencial, se consulta una hoja distinta de la escritura real o se asigna PASSED sin aserciones.
- **Alcance:** calidad y cobertura conductual de pruebas para idempotencia, concurrencia y unicidad de las operaciones indicadas. No sustituye ni duplica la implementación de idempotencia general (AUD-NG-006) ni la corrección transaccional de pagos (AUD-NG-133).
- **Criterios de aceptación:** la suite demuestra contención real entre operaciones simultáneas; la repetición de una misma clave no crea efectos duplicados y devuelve un resultado coherente; una clave reutilizada con payload distinto se rechaza; la pérdida de respuesta y el fallo posterior a persistencia se recuperan sin duplicar; los pagos se verifican en `PagosAbonos`; los CUV se comparan para comprobar unicidad; matrícula y planilla tienen casos de prueba; cualquier falta de datos, error de lectura o aserción fallida produce FAILED y nunca PASSED; los resultados incluyen evidencia identificable y reproducible.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; esta auditoría fue estática/manual y no ejecutó la suite ni operaciones concurrentes reales.

### Reconciliación de hallazgos relacionados
- **AUD-NG-006:** conserva la política general de reintentos, clasificación de operaciones, generación/transmisión de claves y reserva atómica; FASE2-T02 amplía su evidencia, sin duplicar su implementación.
- **AUD-NG-133:** conserva la idempotencia transaccional de pagos/abonos, bloqueo, validación de cargo y prevención de colisiones; AUD-NG-161 prueba esas invariantes, no las reemplaza.
- **Pruebas y límites:** inspección estática/manual del informe y reconciliación de IDs. No se ejecutaron solicitudes concurrentes, navegador, pérdida de respuesta, Apps Script ni escrituras contra Google Sheets productivo.
- **Dictamen:** FASE2-T02 continúa en CUMPLE PARCIALMENTE; la formalización de AUD-NG-161 no certifica la idempotencia ni la concurrencia funcional.

