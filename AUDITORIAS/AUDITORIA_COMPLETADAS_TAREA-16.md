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
