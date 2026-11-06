# Auditoría de tareas completadas - FASE2-T06

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 18ab0be6ab4890bf8ee2fce351e583654ec578db  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59; sin modificaciones)  
**Tarea auditada:** FASE2-T06 - Corregir y formalizar la concurrencia y la consistencia entre servicios  
**Estado histórico:** completadas.md conserva [X]; esta auditoría contrasta el estado real del código y no altera el registro histórico.

## Dictamen

**CUMPLE PARCIALMENTE; no satisface los criterios de aceptación.**

Hay bloqueos locales en varias operaciones y se incorporó un helper `withConcurrencyLock`, pero este helper no está integrado en las operaciones de negocio: sus únicas apariciones son la definición y su invocación desde `runConcurrencyAndConsistencySuite`. Las suites existentes no ejecutan operaciones simultáneas ni verifican invariantes de persistencia. Además, hay rutas que permiten omitir bloqueos mediante una bandera controlada por el payload, operaciones que continúan después de no adquirir el lock y procesos multihoja que pueden quedar parcialmente persistidos sin idempotencia ni recuperación.

La limitación de `LockService.getScriptLock()` entre proyectos Apps Script independientes, las rutas de matrícula/pagos sin bloqueo y las pruebas nominales ya están registradas en AUD-NG-161, AUD-NG-129, AUD-NG-133, AUD-NG-049 y TASK-118. No se duplican. Se identifican dos brechas adicionales: el fallo de adquisición del lock se ignora en la comprobación de cupos y en la actualización presupuestaria; y la recepción de compras puede aplicar movimientos de inventario antes de persistir la recepción, sin clave idempotente ni recuperación.

## Fuentes y respaldos

- `completadas.md`: SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; FASE2-T06 está marcada [X] y contiene nueve requisitos y ocho criterios de aceptación.
- `Pendientes.md`: la lectura convencional devolvió 0 caracteres. Se recuperó el blob actual del HEAD de NG_beta_0.0.0.1_work: SHA `529615b34cb68477c3b04858fa4365c56bf25902`, 1,613,270 caracteres y 19,165 líneas. El árbol del commit actual contiene ese blob. El padre inmediato conservaba el blob `4bddbc2f2198d6e144c46674b79589207f624c21` (1,609,995 caracteres y 19,154 líneas); se seleccionó el blob más reciente del HEAD, no el histórico anterior ni una copia legacy.
- Inventario previo a esta auditoría: 476 IDs TASK únicos (TASK-001 a TASK-476), 173 IDs AUD-NG únicos (AUD-NG-001 a AUD-NG-178, con cuatro referencias sin encabezado según C1.40), total 649 IDs únicos. No se encontraron AUD-NG-179, AUD-NG-180, TASK-477 ni TASK-478.
- `backend/academic-service/Code.gs`: SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`.
- `backend/accounting-service/Code.gs`: SHA `38b979d41596b85e888b4a7060b37bbac0840a28`.
- `Auditoria.txt`: SHA `4a54eee2d7e269a38c3a83645a9d929bd471fab6`.
- `MapaDependencias.md`: SHA `92b87b161caa4adb93fa925d6c1d08052f8a02d1`.
- `AUDITORIA_COMPLETADAS_PLAN.md`: SHA `3245302ad931d949184e55f7cfc0c78a438bf2bb`.
- `Contexto_personal.txt`: SHA `2c140959e624bb82623c2afa8a42474522b58400`.
- `METODOLOGIA_DESARROLLO.md`: SHA `214e8221bd076c4e89012636c105bffd5ca36467`.
- Auditoría de continuidad: `AUDITORIA_COMPLETADAS_FASE2-05.md`, SHA `2e1e6f666dbdddfd5d1b448108822f73e6dddd33`.

## Reconciliación obligatoria con C1.33 y AUD-NG-161

C1.33/FASE2-05 ya había identificado que:
- `runCriticalProcessConcurrencySuite` adquiere un solo lock, cuenta filas y declara PASS sin ejecutar dos operaciones concurrentes.
- `runConcurrencyAndConsistencySuite` ejecuta una sola función local mediante `withConcurrencyLock`, no comprueba persistencia y devuelve `status: "success"` aunque `todasPruebasPasaron` sea falso.
- `withConcurrencyLock` no estaba integrado en handlers de negocio.
- Los ScriptLock de proyectos separados no constituyen un lock distribuido.
- `createStudentEnrollment` admite el bypass `skipLock/isInternalCall`; `registerStudentEnrollment` no tiene lock y puede interrumpirse entre matrícula y cargos.

AUD-NG-161 ya incluye las pruebas conductuales que faltan para locks, concurrencia, pérdida de respuesta, idempotencia, reintentos, matrículas, planillas y recuperación. AUD-NG-129 cubre la ruta de matrícula legacy y sus escrituras parciales; AUD-NG-133 cubre pagos de estudiantes; AUD-NG-049 cubre la atomicidad de pagos y notas de crédito a proveedores; TASK-118 conserva la unificación de generadores y eliminación de bypasses. Esos defectos se consideran relacionados y no se vuelven a registrar como hallazgos nuevos.

## Inventario funcional y técnico

### Academic

- `doPost` (aprox. 670-977) valida permisos y despacha acciones. Antes de la autorización elimina `skipLock` únicamente cuando `isInternalCall` es falso; ambos campos llegan en el payload y no se observa que `isInternalCall` se derive de un sobre interservicio verificado.
- `createAdmissionRequest` (984-1100 aprox.) usa lock local y comprobación de duplicados; llama al generador con `skipLock: true` dentro de la sección crítica. La omisión externa se relaciona con TASK-118/AUD-NG-161.
- `convertAdmissionToStudent` (2156-2380 aprox.) adquiere lock y coordina escrituras en expediente, relaciones familiares, invitaciones, documentos y matrícula. El lock es local al proyecto Academic y no constituye una transacción multihoja ni una garantía frente a escritores de otros servicios.
- `createStudentEnrollment` (11141-11221) adquiere lock con espera de 10 segundos, salvo que se acepte `skipLock`; consulta capacidad, verifica matrícula activa, inserta matrícula y puede reactivar expediente. El bypass está reconciliado con AUD-NG-161/TASK-118.
- `registerStudentEnrollment` (12670 en adelante) no adquiere lock ni reserva idempotencia; actualiza/inserta `Matriculas` y después agrega cargos en `CargosEstudiante`. La instantánea `existingCargos` no se actualiza dentro del bucle. Está cubierto por AUD-NG-129.
- `checkEnrollmentCapacity` (11026-11115) intenta adquirir lock con `tryLock(5000)`, pero no comprueba el resultado. Si no lo obtiene, continúa leyendo `OfertaAcademica`, `Matriculas` y `SolicitudesAdmision`, y devuelve `status: "success"` como si el cálculo hubiera seguido su política normal. Este comportamiento se registra como AUD-NG-179.

### Accounting

- `doPost` (572-970 aprox.) hace consulta de idempotencia en caché antes de ejecutar la acción y guarda el resultado después; no reserva la clave durante la ejecución. La reserva check-then-save ya está cubierta por AUD-NG-006/AUD-NG-161.
- `recordStudentPayment` (3891-3968) no adquiere lock y solo deduplica si el cliente proporciona una clave opcional. Está cubierto por AUD-NG-133.
- `recordInventoryMovement` (6050 en adelante) adquiere ScriptLock y agrega movimientos a `InventariosKardex`.
- `recordPurchaseReceipt` (6972-7140 aprox.) adquiere ScriptLock, calcula cantidades recibidas, llama a `recordInventoryMovement` por cada artículo conforme, actualiza `OrdenesCompra` y finalmente agrega la fila en `RecepcionesCompra`. No recibe/reserva clave de idempotencia, no persiste un estado intermedio recuperable y no compensa movimientos de inventario previos si falla una escritura posterior. Un reintento puede volver a ingresar existencias ya aplicadas. Se registra como AUD-NG-180.
- `recordAccountsPayableExpense` (7557-7687) agrega primero la obligación en `CuentasPorPagarGastos`; después intenta adquirir lock para transferir montos entre comprometido y ejecutado en `PresupuestosInstitucionales`. Si `tryLock(10000)` devuelve falso, omite el bloque presupuestario y continúa devolviendo éxito con `ejecucionPresupuestaria: null`. No hay estado pendiente ni recuperación que reconcilie la obligación con el presupuesto. Se registra dentro de AUD-NG-179.
- `recordSupplierPayment` y `applySupplierCreditNote` usan lock, pero las escrituras parciales y la confirmación de éxito sin asiento contable ya están registradas en AUD-NG-049; no se duplica.
- `runCriticalProcessConcurrencySuite` (10505-10550) adquiere un lock y cuenta filas de tablas, sin ejecutar operaciones concurrentes ni verificar unicidad de efectos; la diferencia entre `TransaccionesCobro` y `PagosAbonos` está cubierta por AUD-NG-161.

## Contraste de los nueve requisitos

1. **Inventario de operaciones concurrentes y recursos compartidos:** parcial. Se identifican matrículas, admisiones, secuencias, pagos, compras, inventario, obligaciones y presupuestos; no existe un inventario operativo exhaustivo con propietarios, invariantes y política de concurrencia por operación.
2. **Ámbito real de los bloqueos:** no cumple. `getScriptLock()` coordina ejecuciones del mismo proyecto, no crea exclusión mutua entre los deployments independientes Academic y Accounting que comparten hojas.
3. **Operaciones que necesitan exclusión, versión, estado o deduplicación:** parcial. Hay locks locales en algunas escrituras; otras rutas están sin lock o dependen de idempotencia opcional. Los casos ya registrados se mantienen en AUD-NG-129, AUD-NG-133 y AUD-NG-049.
4. **Impedir bypass externo de `skipLock`:** no cumple. `isInternalCall` se toma del payload y permite conservar `skipLock`; no se acredita una identidad interna autenticada en ese punto. Mantener TASK-118/AUD-NG-161.
5. **Política de adquisición, espera y liberación:** parcial. Coexisten `tryLock(5000)`, `tryLock(10000)` y `waitLock(15000)`; algunas rutas fallan controladamente, pero `checkEnrollmentCapacity` y el bloque presupuestario de `recordAccountsPayableExpense` ignoran el fallo de adquisición.
6. **Sección crítica frente a transacción multihoja:** no cumple integralmente. Un lock serializa parte de la ejecución, pero no revierte ni recupera automáticamente escrituras ya persistidas en otras hojas. AUD-NG-049 cubre pagos de proveedor; AUD-NG-180 cubre recepción e inventario.
7. **Operaciones parcialmente completadas y recuperación:** no cumple integralmente. La recepción puede aplicar movimientos antes de escribir el comprobante; no hay estado de operación ni reanudación idempotente. Otras rutas están cubiertas por AUD-NG-129/AUD-NG-133/AUD-NG-049.
8. **Regla explícita de resolución de conflictos:** parcial/no demostrada. Los bloques revisados dependen de snapshots de filas y locks locales; no se encontró una estrategia transversal de versión esperada, rechazo de escritura obsoleta o reconciliación durable entre servicios.
9. **Consistencia de identificadores y relaciones bajo competencia:** no cumple integralmente. Se mantienen generadores y referencias heterogéneas; la unificación y eliminación de bypasses se encuentra en TASK-118, y las pruebas conductuales en AUD-NG-161.

## Criterios de aceptación

| Criterio | Resultado | Evidencia |
|---|---|---|
| Dos operaciones concurrentes no crean recursos lógicos duplicados | No demostrado | Las suites no ejecutan concurrencia real; rutas y deduplicación están cubiertas por AUD-NG-161/129/133. |
| Los locks se liberan tras éxito y error | Parcial | `withConcurrencyLock` y varias funciones usan `finally`; no todas las rutas verifican adquisición antes de continuar. |
| El timeout de lock produce error controlado | No cumple | `checkEnrollmentCapacity` y `recordAccountsPayableExpense` continúan tras un resultado falso de `tryLock`. |
| Una solicitud externa no puede activar omisión de lock | No cumple | `isInternalCall` procede del payload; AUD-NG-161/TASK-118. |
| Lock de un servicio no se presenta como distribuido | No cumple | ScriptLock es local al proyecto; no hay mecanismo común demostrado entre servicios. |
| Interrupción entre escrituras produce estado detectable y recuperación | No cumple | `recordPurchaseReceipt` no tiene estado intermedio, idempotencia ni compensación. |
| Pruebas concurrentes no muestran pérdidas ni relaciones inválidas | No demostrado | Las suites son nominales; no se ejecutaron pruebas concurrentes reales. |
| Procesos recuperados conservan integridad | No demostrado | No existe recuperación idempotente demostrada para la recepción multihoja. |

## Calidad de implementación

- `withConcurrencyLock` encapsula correctamente adquisición con timeout y liberación en `finally`, pero no está integrado en operaciones de negocio; su existencia no refuerza por sí sola la concurrencia del sistema.
- `runConcurrencyAndConsistencySuite` ejecuta una sola función local y puede devolver `status: "success"` aun con `todasPruebasPasaron: false`.
- `runCriticalProcessConcurrencySuite` convierte la obtención de un lock y el conteo de filas en PASS; no comprueba el comportamiento concurrente ni el resultado de negocio.
- El tratamiento de timeouts es inconsistente: unas rutas lanzan error, otras siguen sin lock y otras continúan con éxito después de omitir una escritura presupuestaria.
- Los locks locales no equivalen a una transacción distribuida ni a atomicidad entre hojas.
- En `recordPurchaseReceipt`, el llamado a `recordInventoryMovement` ocurre mientras la recepción ya mantiene un ScriptLock; se requiere una prueba aislada para determinar el comportamiento de adquisición anidada. No se afirma deadlock sin evidencia de ejecución.
- La inspección no demuestra comportamiento productivo; los riesgos de concurrencia y recuperación requieren pruebas en un entorno aislado.

## Nuevos hallazgos y tareas derivadas

- **AUD-NG-179 (Alto/P1):** no ocultar fallos de adquisición de LockService ni confirmar operaciones parcialmente ejecutadas. Se convierte en **TASK-477**.
- **AUD-NG-180 (Alto/P1):** hacer idempotente y recuperable la recepción de compras y sus movimientos de inventario. Se convierte en **TASK-478**.
- Se mantienen sin duplicación AUD-NG-006, AUD-NG-023, AUD-NG-049, AUD-NG-129, AUD-NG-133, AUD-NG-161 y TASK-118.

## Pruebas y limitaciones

Inspección estática/manual de los archivos y rangos citados. No se ejecutaron Apps Script, solicitudes HTTP, pruebas de concurrencia real, pruebas de pérdida de respuesta, suites automatizadas, escrituras ni consultas sobre hojas productivas. No se validó el comportamiento de LockService bajo contención real ni la adquisición anidada en un deployment GAS. No se modificó código fuente.

## Progreso

- Identificadores auditados: **42/183**; 141 pendientes.
- Última tarea auditada: FASE2-T06.
- Siguiente tarea: **FASE2-T07 - Fortalecer el motor de eventos y la ejecución de procesos automáticos**.
- No repetir los alcances ya documentados en AUD-NG-006/AUD-NG-049/AUD-NG-129/AUD-NG-133/AUD-NG-161, salvo que cambios posteriores o regresiones lo justifiquen.


### Revalidación C1.96 / TAREA-F5-001
- Se revalida AUD-NG-129: montoMatriculaBase usa fallback 1500 si la configuración falta o resulta cero (ACADEMIC 2331-2340); registerStudentEnrollment está expuesta a varios roles y no realiza control de cupos, además de escribir matrícula y cargos por separado.
- Se revalida AUD-NG-161: no hay pruebas específicas para conversión, fallo parcial, overrides, documentos obligatorios, verificación de tutor ni recuperación.
- checkEnrollmentCapacity (ACADEMIC 11026-11115) usa capacidad 35/estado Activa si no existe oferta y continúa si tryLock no se adquiere; se relaciona con AUD-NG-179.
- Evidencia actual: ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; tests 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.
- No se crean IDs duplicados.

## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-179 / TASK-477] Hacer fail-closed la adquisición de locks y recuperar operaciones presupuestarias
- **Hallazgo de origen:** FASE2-T06, apartados 3 y 4; hallazgo nuevo.
- **Severidad:** Alto.
- **Objetivo:** impedir que operaciones sensibles confirmen éxito después de no adquirir exclusión mutua o dejar escrituras incompletas.
- **Acción ejecutable:** comprobar explícitamente el resultado de tryLock en checkEnrollmentCapacity y recordAccountsPayableExpense; abortar con error controlado si no se adquiere; registrar estados de operación para conciliar obligaciones y presupuesto; impedir respuestas success con ejecuciónPresupuestaria null.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, backend/accounting-service/Code.gs.
- **Dependencias y riesgos:** AUD-NG-129, AUD-NG-133, AUD-NG-049, AUD-NG-006 y AUD-NG-161; no duplicar sus causas raíz.
- **Alcance:** lock timeout y consistencia entre obligación y presupuesto.
- **Criterios de aceptación:** lock no adquirido impide mutación o confirma estado recuperable explícito; obligación y presupuesto terminan conciliados; fallo posterior se detecta y puede recuperarse; nunca se informa éxito ambiguo.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de timeout, fallo entre escrituras y conciliación.

### [AUD-NG-180 / TASK-478] Hacer idempotente y recuperable la recepción de compras
- **Hallazgo de origen:** FASE2-T06, apartado 3; hallazgo nuevo.
- **Severidad:** Alto.
- **Objetivo:** impedir que un reintento vuelva a ingresar existencias ya aplicadas.
- **Acción ejecutable:** reservar una clave idempotente de recepción; persistir estado intermedio antes de aplicar movimientos; relacionar cada movimiento de inventario con la recepción; completar comprobante y orden de compra como una operación recuperable; compensar o reanudar de forma segura ante fallo.
- **Archivos/módulos afectados:** backend/accounting-service/Code.gs; RecepcionesCompra, OrdenesCompra, Kardex/movimientos de inventario.
- **Dependencias y riesgos:** AUD-NG-006 y AUD-NG-161; mantener integridad de cantidades parciales y orden recibida.
- **Alcance:** recordPurchaseReceipt y sus movimientos.
- **Criterios de aceptación:** repetir la misma recepción no duplica stock; fallo después de un movimiento se detecta y reanuda/compensa; cantidad recibida nunca excede lo despachado; estado final y comprobante coinciden.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de recepción parcial, repetición y fallo inyectado.

### [AUD-NG-161] Ampliar pruebas conductuales de bloqueos y recuperación
- **Hallazgo de origen:** FASE2-T06; ampliación del hallazgo de pruebas existente.
- **Severidad:** Alto.
- **Objetivo:** demostrar que los controles de exclusión y recuperación funcionan en escenarios concurrentes.
- **Acción ejecutable:** añadir escenarios de lock timeout, dos recepciones simultáneas, fallo entre movimiento y comprobante, y conciliación presupuestaria.
- **Archivos/módulos afectados:** suites de regresión de Academic y Accounting.
- **Dependencias y riesgos:** TASK-477, TASK-478, AUD-NG-049, AUD-NG-129 y AUD-NG-133.
- **Alcance:** pruebas aisladas con datos sintéticos.
- **Criterios de aceptación:** cada prueba fuerza la condición de carrera/fallo y verifica saldo, stock, estado y ausencia de duplicados; no opera sobre hojas productivas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** reporte reproducible por escenario.
