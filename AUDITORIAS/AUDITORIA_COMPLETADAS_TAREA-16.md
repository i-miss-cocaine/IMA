# Auditoría TAREA-16: pruebas de carga, concurrencia e integridad

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 5757c0d9a710eeb0d4cee4dfe8155d42da69a808  
**Dictamen:** CUMPLE PARCIALMENTE; calidad insuficiente para aceptación integral.

## Alcance

TAREA-16 exige concurrencia e integridad en cobros, matrículas, CUV, entregas y exámenes; LockService e idempotencia; estrés HTTP; aislamiento de caché por rol/cuenta; pruebas reproducibles y datos aislados.

## Evidencia

| Archivo | SHA | Funciones / líneas |
|---|---|---|
| backend/accounting-service/Code.gs | 38b979d41596b85e888b4a7060b37bbac0840a28 | doPost 572; recordStudentPayment 3891; runCriticalProcessConcurrencySuite 10505; generateSchoolDocument 15040 |
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc | doPost 671; runConcurrencyAndConsistencySuite 3296; generateInstitutionalId 2107; createStudentEnrollment 11141; registerStudentEnrollment 12670 |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | submitAssignment 892 |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c | submitExam 996 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | verifySessionToken 1083; hasActiveDelegationForAction 1165 |
| tests/regression/academic-grading-suite.js | 3433b707edd4a2f35c68368a3172932adc2a3b32 | assert 12 |

### Cobros
recordStudentPayment no usa LockService. La clave idempotente es opcional; si falta, se omite la búsqueda de duplicados y se inserta el pago. doPost consulta CacheService antes de la acción y guarda el resultado después, sin reserva atómica. La suite runCriticalProcessConcurrencySuite consulta TransaccionesCobro, aunque recordStudentPayment escribe PagosAbonos.

### Matrículas
createStudentEnrollment usa LockService y comprueba matrícula activa dentro de la sección crítica. registerStudentEnrollment realiza lectura y escritura sin lock. convertAdmissionToStudent tiene bloqueo exterior y reconoce solicitudes ya convertidas, pero escribe varias hojas secuencialmente sin rollback acreditado. generateInstitutionalId permite skipLock; doPost elimina skipLock solo si isInternalCall es falso, y esa bandera procede del payload sin verificación de origen interno.

### CUV
generateSchoolDocument usa LockService. Sin embargo, el fallback CUV posterior a 100 intentos usa Date.now() sin revalidar unicidad; no se encontró idempotencia por solicitud para recuperar el documento ante respuesta perdida.

### Entregas y exámenes
submitAssignment consulta y actualiza Entregas, calcula versionNum por conteo y agrega EntregasVersiones sin lock/idempotencia; las escrituras separadas pueden quedar desincronizadas. submitExam inserta EntregasExamen con ID Date.now(), sin lock, deduplicación ni reintento idempotente.

### Suites
runCriticalProcessConcurrencySuite adquiere un lock y marca PASSED pagos/CUV por conteo de filas; no comprueba duplicados ni resultados de negocio. runConcurrencyAndConsistencySuite prueba una única adquisición/liberación, sin contención. academic-grading-suite.js usa includes() para presencia textual y no ejecuta procesos concurrentes. No se encontró harness HTTP de carga en los archivos de prueba examinados.

### Caché
verifySessionToken y hasActiveDelegationForAction usan claves por userId, lo que es positivo para esos helpers. No se encontraron pruebas conductuales de caché caliente/fría alternando cuentas/roles, revocación y purga parcial. No se afirma filtración efectiva; el aislamiento queda no demostrado.

## Dictamen por criterio

- Cobros: **No cumple**.
- Matrículas: **Parcial**.
- CUV: **Parcial**.
- Entregas de tareas: **No cumple**.
- Exámenes: **No cumple**.
- LockService/idempotencia: **Parcial**.
- Estrés HTTP: **No demostrado**.
- Aislamiento de caché: **No demostrado**.
- Reproducibilidad y datos aislados: **No cumple**.

## Reconciliación

No se crea AUD-NG nuevo. Se amplían:
- **AUD-NG-006:** reserva idempotente atómica, claves estables y bloqueo no evadible por isInternalCall/skipLock del cliente.
- **AUD-NG-133:** bloqueo/idempotencia atómica y consistencia de pagos.
- **AUD-NG-161:** pruebas conductuales reales sobre PagosAbonos, CUV, matrículas, planillas, entregas, exámenes, HTTP y caché aislada.
- **AUD-NG-009:** no aceptar includes() como evidencia funcional.

## Pruebas y límites

Inspección estática/manual. No se ejecutaron pruebas HTTP, Apps Script, concurrencia real, pérdida de respuesta, caché caliente/fría, fixtures de integración ni despliegues. No se utilizaron datos productivos ni se modificó código fuente.


## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-006 - Reserva idempotente atómica y reintentos seguros
- Clasificar las acciones de `fetchApi` por semántica (lectura, escritura idempotente y escritura no idempotente). No reintentar automáticamente una escritura no idempotente si no existe una clave estable y protección idempotente en el servidor.
- Generar o exigir una clave idempotente estable por operación lógica y conservarla en todos los reintentos; no crear una clave distinta en cada intento ni depender de `Date.now()` como identificador.
- Implementar en backend una reserva atómica de la clave antes de ejecutar efectos secundarios. La reserva debe distinguir en curso, completada y fallida recuperable, y evitar que dos solicitudes concurrentes ejecuten simultáneamente la misma operación.
- Vincular la clave con actor, acción, recurso y huella del payload. Rechazar reutilización de la misma clave con otro actor, acción o contenido incompatible.
- Persistir el resultado final y permitir recuperar la respuesta de una operación ya completada cuando se perdió la respuesta HTTP. Definir recuperación segura si el proceso falla después de reservar o después de persistir parcialmente.
- No usar `isInternalCall`, `skipLock` ni banderas del payload como autorización para omitir locks. Los caminos internos deben derivar su identidad de un mecanismo verificable del servidor y tener un contrato separado del input público.
- Aplicar el contrato común a cobros, matrículas, CUV, entregas y exámenes, manteniendo las validaciones de dominio específicas en cada servicio.

### AUD-NG-133 - Integridad transaccional de pagos
- Proteger `recordStudentPayment` con una sección crítica propia que cubra validación del cargo/saldo, reserva idempotente y persistencia del abono; el lock exterior de un wrapper no sustituye el control de la función de dominio si existen otras rutas de entrada.
- Hacer obligatoria la clave idempotente para operaciones de pago y vincularla al pagador, cargo y payload. Eliminar referencias genéricas como `SIN-REF` que puedan colisionar entre pagos distintos.
- Dentro de la sección crítica, volver a leer el cargo y verificar que pertenece al estudiante/pagador autenticado, que está vigente y que el monto es positivo y no excede el saldo pendiente.
- Persistir el abono y actualizar el saldo/estado del cargo de forma atómica o mediante un mecanismo de transacción compensable con recuperación demostrable. No permitir que escrituras parciales dejen el saldo y el historial divergentes.
- Hacer que la respuesta recuperada por una misma clave corresponda al pago realmente persistido; no marcar como completada una operación cuyo efecto financiero no se confirmó.
- Alinear las pruebas y reportes con la hoja real `PagosAbonos`; no validar integridad de pagos contando filas de `TransaccionesCobro` si esa no es la fuente que escribe la operación.

### AUD-NG-161 - Pruebas conductuales de concurrencia, integridad y recuperación
- Sustituir los casos que asignan `PASSED` por conteo de filas o adquisición aislada de LockService por escenarios que ejecuten operaciones reales concurrentes y verifiquen sus invariantes de negocio.
- Probar dos o más solicitudes simultáneas con la misma clave: debe existir un solo efecto persistido y todas las respuestas deben corresponder al mismo resultado. Probar también claves diferentes y reutilización incompatible de una clave.
- Simular pérdida de respuesta después de persistir, timeout, reintento, fallo entre escrituras y recuperación posterior. Verificar ausencia de duplicados y consistencia entre estado, historial y respuesta.
- Ejecutar escenarios sobre `PagosAbonos`, CUV, matrículas, planillas, entregas y exámenes, comprobando IDs/códigos únicos, propiedad, saldos, versiones y relaciones; usar las tablas/hojas que realmente escriben cada flujo.
- Probar `createStudentEnrollment` y `registerStudentEnrollment` bajo contención; comprobar también la conversión de admisión con fallo parcial y rollback/compensación.
- Verificar CUV ante colisión del generador, incluidos los fallbacks, y comprobar unicidad después de generar; no asumir que un contador de filas prueba unicidad.
- Crear un harness HTTP de carga que ejercite los endpoints desplegados con concurrencia, latencia, timeout, errores y pérdida de respuesta controlados. Registrar tasa de error, duplicados, consistencia y tiempos; no reportar estrés HTTP como probado sin ejecutar el harness.
- Probar aislamiento de caché alternando cuentas y roles con caché caliente/fría, revocación de sesión/delegación y purga parcial. Confirmar que una respuesta cacheada no cruza identidades ni permisos.
- Preparar fixtures/datos sintéticos aislados y limpieza reproducible. Las pruebas deben identificar ambiente, versión/deployment, datos sembrados y evidencia; nunca utilizar datos productivos.
- Hacer que los resultados PASS/FAIL dependan de aserciones sobre efectos persistidos y reglas de negocio, con diagnóstico y evidencia por escenario. Una función que devuelve `success`, un lock adquirido una sola vez o una cadena presente en el código no demuestra concurrencia ni integridad.

### AUD-NG-009 - Suites de regresión basadas en comportamiento
- Sustituir aserciones basadas únicamente en `includes()`, existencia de archivos o nombres de funciones por pruebas que ejecuten las rutas y validen entradas, salidas, persistencia, autorización y errores.
- Mantener comprobaciones estáticas como lint/estructura separadas de las pruebas funcionales; no presentarlas como cobertura conductual.
- Incorporar escenarios negativos (IDs ajenos, datos inválidos, duplicados, falta de permisos, estado cerrado, timeout) y comprobar que el sistema rechaza sin efectos secundarios.
- Exigir que cada suite documente precondiciones, fixtures, acciones ejecutadas, resultados esperados/observados y limpieza; evitar PASS incondicional o basado en conteos no vinculados al flujo probado.
- Alinear los porcentajes de cobertura con pruebas realmente ejecutadas y criterios de aceptación verificables.

**Reconciliación y límites:** AUD-NG-006 mantiene el contrato transversal de reintentos/reserva idempotente; AUD-NG-133 concreta la integridad de pagos y su persistencia; AUD-NG-161 valida conductualmente los procesos y sus invariantes; AUD-NG-009 corrige la calidad de las suites y de la evidencia. No se crea un ID nuevo ni se duplica la corrección de dominio de pagos dentro de la suite de pruebas.

**Evidencia requerida:** concurrencia real con claves iguales/diferentes; recuperación tras pérdida de respuesta; prueba de propiedad y saldo en pagos; consistencia de las hojas efectivamente escritas; unicidad CUV; doble alta concurrente; entregas/exámenes sin duplicados; caché aislada por identidad/rol; carga HTTP reproducible; y suites con aserciones conductuales. La auditoría actual es estática y no acredita esos resultados.

