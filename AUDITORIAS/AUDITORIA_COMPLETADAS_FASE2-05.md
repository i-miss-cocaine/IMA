AUDITORÍA DE TAREAS COMPLETADAS - FASE2-05
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 95a23f76e2e03b2d673bd50825859708ba34a135
ARCHIVOS: backend/accounting-service/Code.gs; backend/academic-service/Code.gs; js/api.js
================================================================
DICTAMEN: CUMPLE PARCIALMENTE.

FASE2-05 aparece completada en completadas.md con título, origen, severidad y dos archivos. La especificación más detallada se reconstruyó mediante FASE2-T02 (idempotencia) y FASE2-T06 (concurrencia/consistencia), posteriores y también marcadas completadas.

1. IDEMPOTENCIA
- Accounting y Academic mantienen checkAndRegisterIdempotencyKey / saveIdempotentResult. El primero consulta CacheService; ante cache miss devuelve null sin reservar clave ni estado en curso. El segundo solo almacena resultado exitoso después de ejecutar el handler, con TTL de 21600 segundos.
- doPost realiza el chequeo antes del switch y el guardado después. Dos solicitudes simultáneas con la misma clave pueden ejecutar ambas; una operación parcialmente persistida que devuelve error/excepción no guarda resultado para recuperación.
- fetchApi no genera idempotencyKey/idempotencyToken. Ante fallos de red reintenta hasta dos veces con el mismo payload; una respuesta perdida después de persistir puede duplicar escrituras.

2. OPERACIONES DE ESCRITURA
- recordStudentPayment no usa LockService; la clave es opcional. Si no hay idempotencyKey, tokenTransaccion o referencia, omite deduplicación y persiste. La lectura previa de PagosAbonos y appendRow no son atómicos.
- createStudentEnrollment sí usa lock, pero permite skipLock. doPost solo elimina skipLock si isInternalCall es falso; no se acredita autenticación servidor-servidor de esa bandera.
- registerStudentEnrollment no usa lock ni idempotencia. Actualiza/crea Matriculas y luego agrega cargos en otra hoja; una interrupción puede dejar matrícula sin cargos. existingCargos es una instantánea que no se actualiza dentro del bucle.
- Existen otras operaciones contables/académicas con LockService y finally; el dictamen refleja cobertura irregular, no ausencia total de bloqueos.

3. PRUEBAS
- runCriticalProcessConcurrencySuite en Accounting adquiere un lock y marca PASSED verificaciones que solo cuentan filas, sin ejecutar dos operaciones concurrentes ni verificar unicidad.
- withConcurrencyLock en Academic libera el lock en finally, pero solo lo utiliza runConcurrencyAndConsistencySuite. Esta suite ejecuta una única función local y devuelve status success aun si todasPruebasPasaron fuera falso.
- Los locks getScriptLock de proyectos distintos no forman por sí solos un bloqueo distribuido entre Accounting y Academic.

4. RECONCILIACIÓN
- AUD-NG-006: claves estables en cliente y reserva atómica en backend.
- AUD-NG-129: unificar matrícula/rematrícula, atomicidad y relación con cargos.
- AUD-NG-133: idempotencia atómica, bloqueo y validación de pagos.
- AUD-NG-161: pruebas conductuales reales de concurrencia, reintentos, fallos parciales y recuperación.
- FASE2-T02 y FASE2-T06 figuran completadas, pero el código no satisface sus criterios completos. No se crea un nuevo AUD-NG.

5. PRUEBAS Y LÍMITES
Inspección estática/manual de los archivos y rangos citados. No se ejecutaron HTTP, Apps Script, concurrencia real, pruebas de pérdida de respuesta ni operaciones productivas. No se modificó código fuente ni completadas.md.
================================================================
FIN DEL INFORME
