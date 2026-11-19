# AUDITORÍA TÉCNICA - TAREA-F5-013: integración de cobros, pagos y becas de admisión

- **Repositorio:** `i-miss-cocaine/IMA`
- **Rama auditada:** `NG_beta_0.0.0.1_work`
- **HEAD de partida:** `6e87f008e26091d94bc1138b07849201b91851a2`
- **Árbol de partida:** `9a49928e57b8e2b7755370f9c629f0ec25394137`
- **Rama base protegida:** `NG_beta_0.0.0.1`, SHA `44d9891132332e692dbe2ba8602b41f50a508a59`
- **Checkpoint de inicio:** C1.208
- **Checkpoint de cierre:** C1.209
- **ID operativo de sesión:** `IMA-AUDIT-20261107-1518Z` (identificador operativo de auditoría, no ID nativo de ChatGPT)
- **Fecha:** 2026-11-07
- **Dictamen:** **NO CUMPLE**

## 1. Búsqueda documental, continuidad y fuentes

Se comprobó la ruta `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-013.md` en la rama de trabajo; la consulta devuelve NOT_FOUND. La búsqueda de contenido por el identificador F5-013 no encontró un informe individual y la búsqueda de commits por ese identificador no devolvió resultados. No se encontró una variante de nombre del informe. Por tanto, se realizó la auditoría desde cero. El registro de fase citado por la tarea tampoco se consideró evidencia suficiente de cumplimiento sin inspección del código.

**Fuente de requisitos:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, entrada `[TAREA-F5-013]` (14 puntos de alcance y 8 criterios de aceptación, todos marcados [x], estado [X] Completada). La marca administrativa se conserva; esta auditoría no altera `completadas.md`.

**Fuente histórica adicional:** `ChangesLogs.txt`, SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`, líneas 1878-1883. El registro declara implementados `getAdmissionFinancialStatus`, `createAdmissionCharge`, permisos familiares y el panel de consulta financiera. Esa declaración se contrastó con los archivos vigentes y no acredita los flujos completos descritos por la tarea.

**Pendientes.md:** la lectura ordinaria devuelve 0 caracteres. Se recuperó el blob directamente por SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`. Validación: 1.782.094 caracteres, 20.182 líneas, 0 caracteres U+FFFD; 509 IDs TASK únicos y 184 IDs AUD-NG únicos (693 en total), sin duplicados en los encabezados inventariados; último TASK `TASK-511`, último AUD-NG `AUD-NG-231`. No existe una entrada directa TAREA-F5-013. Se conserva el blob sin restaurar ni modificar el archivo. La metodología §3.4 excluye Pendientes.md, pero la instrucción específica actual del usuario ordena consultarlo y prevalece para esta auditoría.

**Rama y continuidad:** HEAD de trabajo verificado en `edde10f41e00ea2d266a508605b8454606caa378`; HEAD de rama base verificado en `44d9891132332e692dbe2ba8602b41f50a508a59`. La rama base no se modifica.

## 2. Evidencia técnica examinada

| Archivo | SHA | Secciones/rangos examinados |
|---|---|---|
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | `getOrCreateSheet` y esquemas de hojas (120-155); ROLE_PERMISSIONS (198-210); `doPost` y dispatcher (572-640); `applyApprovedScholarshipsToCharges` y aprobación (1030-1110); `getAdmissionFinancialStatus` (2339-2397); `createAdmissionCharge` (2398-2420 y 2760-2780); funciones de pagos (3891-3965); carga/revisión de comprobantes (4100-4220). |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | `doPost`, idempotencia y dispatcher (1300-1475); `getFamilyConsolidatedSummary` (3629-3705); `submitJointFamilyPayment` (3700-3765); `getFamilyScholarships` y `submitFamilyScholarshipApplication` (3767-3810). |
| `backend/academic-service/Code.gs` | `df87a2eea9f0ef79d0b966d03fd5bbe432003df5` | `convertAdmissionToStudent` (2157-2382), incluyendo la creación de matrícula/cargo inicial y movimiento de ingreso. |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` | Renderizado del panel de aspirantes y estado financiero (aprox. 280-390); resumen familiar, pago conjunto y solicitud de beca (aprox. 430-745). |
| `student-dashboard.html` | `6379ea0ed39d71b89747a0280bb925fdf12202c1` | Modal de comprobante genérico de estudiante (225-275); no contiene un formulario específico de pago de admisión. |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` | Registro de microservicios y responsabilidades (245-310). |
| `tests/regression/academic-grading-suite.js` | `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6` | Archivo completo (412 líneas), búsqueda de endpoints/casos F5-013. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Archivo completo (61 líneas), búsqueda de endpoints/casos F5-013. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Entrada TAREA-F5-013 y criterios. |
| `Pendientes.md` (blob) | `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` | Contenido íntegro; inventario y reconciliación de tareas. |
| `ChangesLogs.txt` | `5b5cff1926b73a05d1b92087a7bf4b2db75326ff` | Líneas 1878-1883. |

## 3. Hallazgos

### H1 - CRÍTICO/P0: endpoints financieros familiares sin autorización a nivel de solicitud

ACCOUNTING ROLE_PERMISSIONS (198-210) permite a Padre, Tutor y Responsable ejecutar `getAdmissionFinancialStatus` y también `createAdmissionCharge`. `getAdmissionFinancialStatus` (2339-2397) recibe cualquier `solicitudId` y filtra directamente las hojas por ese identificador; no valida una relación familiar activa, invitación aceptada, titularidad ni autorización sobre la solicitud consultada. `createAdmissionCharge` (2398-2420, 2760-2780) acepta desde el payload `solicitudId`, concepto, monto y descuento, sin comprobar que el actor tenga una función administrativa autorizada ni que el importe/concepto provenga de una configuración aprobada.

La validación de rol del dispatcher no sustituye una autorización de objeto. Un usuario familiar con sesión válida puede intentar consultar cargos de solicitudes ajenas y la matriz también le concede una operación de creación de cargos. Es un riesgo de IDOR e integridad financiera verificable en el código; no se ejecutaron llamadas HTTP.

### H2 - CRÍTICO/P0: esquema de cargos de admisión incompatible con el esquema canónico y conceptos no parametrizados

`getOrCreateSheet` define `CargosEstudiante` con columnas `CargoID, Fecha, UserId, Concepto, MontoBase, Descuento, MontoFinal, Estado, FechaVencimiento, Observaciones, ClaveUnicaDedupe, BatchId` (aprox. líneas 138-140). `createAdmissionCharge` escribe solo diez columnas y coloca `solicitudId` en la columna 3 (`UserId`) y nuevamente en la columna 9 (`FechaVencimiento`), sin un campo independiente `SolicitudID` ni discriminador `TipoEntidad`. El lector de estado también interpreta la columna 9 como una posible referencia de solicitud (2339-2370). La reutilización de `UserId` para una solicitud sin usuario puede confundir los lectores del estado de cuenta y no permite una separación de entidades robusta.

La función utiliza un monto predeterminado de 500, recibe monto/descuento libremente y no lee una configuración financiera por nivel, fecha de vencimiento, exención ni vigencia. No se encontró una hoja/servicio `ConfiguracionFinanciera` ni catálogo específico de Derecho de Admisión, Examen de Ingreso y Reserva de Plaza en los módulos inspeccionados.

### H3 - CRÍTICO/P0: deduplicación de cargos no es atómica ni durable

`createAdmissionCharge` realiza una lectura y búsqueda por `solicitudId + concepto`, excluye cargos anulados y luego hace `appendRow`. No adquiere LockService ni persiste una clave idempotente única para esa combinación. El mecanismo genérico de caché de `doPost` solo opera si el cliente envía token/clave; no sustituye una restricción transaccional y puede no existir en reintentos que no incluyan la clave. Dos solicitudes concurrentes pueden superar la lectura de duplicados antes de que cualquiera escriba. La comprobación evita algunos duplicados secuenciales, pero no satisface la garantía de idempotencia concurrente.

### H4 - CRÍTICO/P0: comprobantes y aprobación contable no están vinculados de extremo a extremo con la admisión

El endpoint genérico `uploadPaymentVoucher` (4100-4150) espera `userId` y `cargoId`, guarda el comprobante en `ComprobantesPago` y marca `En Revisión`; no ofrece un contrato explícito `solicitudId` ni una comprobación de relación del responsable con la solicitud. La función `reviewPaymentVoucher` (4183-4220) cambia primero el estado del comprobante y, si recibe Aprobado/Confirmado, invoca `recordStudentPayment`. Este proceso genérico opera por `userId` y cargo, no implementa una transacción específica de admisión ni verifica una transición permitida, conciliación exacta de monto o estado obligatorio del cargo. La actualización del comprobante y el registro del pago no forman una operación atómica.

USER `submitJointFamilyPayment` (3700-3765) registra un comprobante familiar con `userIdResponsable`, cargo genérico `CARGO-CONJUNTO` y distribuciones para estudiantes vinculados; no recibe `solicitudId` ni distribuye entre aspirantes. La UI construye distribuciones de colegiatura para estudiantes matriculados. No hay un flujo de carga de comprobante de admisión en el panel financiero de aspirantes. Por tanto, el criterio de reutilización del pago conjunto para aspirantes no está implementado.

### H5 - ALTO/P1: estados financieros de admisión incompletos y bloqueo de avance incorrecto

`getAdmissionFinancialStatus` suma como pendientes únicamente estados `Pendiente` y `Vencido`; no normaliza los estados requeridos `Pendiente`, `Pagado`, `En_Revision`, `Exento` y `Anulado`. Los comprobantes se consultan por el tercer campo, pero no se integran como pagos conciliados en el cálculo del saldo. Un cargo en estado `Rechazado` no activa `tieneObligatorioPendiente`, por lo que puede resultar `esSolvente=true` aunque la tarea exige bloquear la confirmación si hay cargos obligatorios rechazados. La UI solo presenta un distintivo de solvente/pendiente y lista cargos; no ofrece un flujo completo de decisión ni aplica el bloqueo.

### H6 - ALTO/P1: las becas familiares de admisión están desconectadas del motor contable y no prueban aprobación de Dirección

USER `submitFamilyScholarshipApplication` (3767-3810) escribe en `BecasYDescuentosFamiliares`, con estados Pendiente y campos generales de familia. No vincula la solicitud a `solicitudId`, cargo, concepto de admisión ni beneficiario aspirante de forma obligatoria. ACCOUNTING `approveDiscountScholarshipRequest` y `applyApprovedScholarshipsToCharges` (aprox. 1030-1110) trabajan con `SolicitudesDescuentoBeca` y `DescuentosBecas`, otra estructura; el primer flujo no crea la solicitud que consume el segundo. La función de aprobación escribe `payload.authRole || "Dirección"` como aprobador sin comprobar dentro de la operación la identidad/rol verificados ni limitar las transiciones a estados válidos. La UI de beca familiar no se conecta al contexto del aspirante.

### H7 - ALTO/P1: la conversión a matrícula no transfiere el historial financiero de admisión

ACADEMIC `convertAdmissionToStudent` (2157-2382) crea expediente, vínculo, invitación y matrícula inicial; llama a `registerStudentEnrollment` con un cargo de matrícula ordinaria y registra un movimiento de ingreso. En el bloque inspeccionado no consulta ni migra `CargosEstudiante`, `PagosAbonos`, `ComprobantesPago` o el historial de becas de admisión al expediente contable del nuevo estudiante. Tampoco se observa una clave de transferencia que impida duplicar importes o conservar referencias al origen. No cumple el requisito de migración de historial.

### H8 - ALTO/P1: el resumen familiar no consolida cobros por aspirante ni distingue ambas entidades

USER `getFamilyConsolidatedSummary` (3629-3705) parte de `getGuardianStudents` y agrega información de estudiantes vinculados. No incorpora solicitudes de admisión. La UI `loadApplicantFinancialStatus` (js/student.js, aprox. 340-390) consulta una solicitud individual y la presenta dentro del panel de aspirantes, pero no existe un desglose consolidado por aspirante en el resumen familiar ni una clasificación explícita que separe cargos de admisión de cargos de alumnos matriculados.

### H9 - ALTO/P1: trazabilidad contable parcial y errores sin atomicidad

`createAdmissionCharge` genera un `logStructuredEvent`, pero no se evidencia en ese flujo un asiento contable de ingresos de admisión, clasificación separada frente a colegiaturas, `correlationId` interservicio ni bitácora transaccional de cambios de estado/pagos/becas. En la revisión de comprobantes se cambia el estado antes de procesar el pago; si falla la segunda operación, el comprobante puede quedar aprobado sin que el pago y el saldo se hayan actualizado de forma coherente. No hay rollback/compensación verificable para esa secuencia.

### H10 - ALTO/P1: ausencia de pruebas de regresión específicas para F5-013

`tests/regression/academic-grading-suite.js` (412 líneas) y `tests/regression/modular-dashboard-suite.js` (61 líneas) no contienen referencias a F5-013, `getAdmissionFinancialStatus`, `createAdmissionCharge`, `submitJointFamilyPayment` en contexto de aspirantes, aprobación de comprobantes de admisión, becas de admisión o migración de pagos durante conversión. No se demuestra aislamiento entre familias, idempotencia concurrente, estados, rechazo, exención, migración ni separación del resumen. No se ejecutaron suites automatizadas.

### H11 - MEDIO/P2: trazabilidad documental de origen incompleta

El informe individual F5-013 no existe en la ruta consultada ni se recuperó en las búsquedas realizadas. La tarea cita `Auditoria.txt` (HALLAZGOS-F5-P1-01) y el informe de fase, pero la entrada histórica de ChangesLogs no sustituye un informe de hallazgos con evidencia y tareas. Se limita la trazabilidad del origen; no invalida el análisis del código vigente.

## 4. Matriz de los 14 puntos de alcance

| # | Requisito | Resultado | Evidencia resumida |
|---:|---|---|---|
| 1 | Configurar conceptos de admisión en ConfiguracionFinanciera | NO | No se encontró catálogo/configuración específica; no hay configuración de los tres conceptos solicitados. |
| 2 | Montos, vencimientos, exenciones y reglas por nivel | NO | Monto por defecto 500; sin reglas por grado, vencimiento o exención. |
| 3 | Asociar cargos a solicitudId antes de userId | PARCIAL | Se usa solicitudId en columna UserId y también en FechaVencimiento; no existe campo separado ni tipo de entidad. |
| 4 | Separar ingresos de admisión de colegiaturas/matrículas | NO | Mismo CargosEstudiante sin clasificación contable de admisión ni asiento diferenciado. |
| 5 | Estados Pendiente/Pagado/En_Revision/Exento/Anulado | NO | Lector solo trata Pendiente/Vencido como saldo pendiente; estados y comprobantes no se normalizan. |
| 6 | Reutilizar submitJointFamilyPayment para pagos de aspirantes | NO | USER solo distribuye pagos entre estudiantes matriculados; no recibe solicitudId. |
| 7 | Revisión contable; comprobante no confirma pago automáticamente | PARCIAL | Existe upload/review genérico, pero no flujo scoped a solicitud ni operación atómica. |
| 8 | Evitar duplicados con idempotencia | NO | Detección check-then-append sin lock ni clave persistente atómica. |
| 9 | Registro contable auditado de transacciones | PARCIAL | Log estructurado de creación, sin trazabilidad/contabilidad completa del ciclo de pago y beca. |
| 10 | Becas/exenciones con aprobación de Dirección | NO | Solicitud familiar y motor contable usan hojas distintas; aprobación no prueba rol verificado. |
| 11 | Postulación familiar a beca durante admisión | PARCIAL | Existe formulario general, pero no se vincula al aspirante ni a su solicitud/cargos. |
| 12 | Transferir historial de pagos al expediente contable al convertir | NO | convertAdmissionToStudent no migra cargos, pagos, comprobantes ni becas de admisión. |
| 13 | Desglose por aspirante en resumen familiar | NO | Resumen familiar solo obtiene estudiantes vinculados; estado de aspirante se muestra por solicitud individual. |
| 14 | Bloquear confirmación con cargos obligatorios pendientes/rechazados | NO | No se observa gate en conversión; el lector no considera Rechazado como pendiente. |

## 5. Criterios de aceptación

| # | Criterio | Resultado |
|---:|---|---|
| 1 | Cargos automáticos asociados a solicitudId | PARCIAL |
| 2 | Sin cargos duplicados al consultar/reintentar | NO |
| 3 | Comprobantes permanecen En_Revision hasta aprobación | PARCIAL |
| 4 | Aprobación actualiza saldo y habilita siguiente fase | NO |
| 5 | Exenciones con autorización auditada y motivo | NO |
| 6 | Conversión migra pagos sin duplicarlos | NO |
| 7 | Resumen familiar distingue admisión de matrícula | NO |
| 8 | Operaciones fallidas no marcan cargos como pagados y devuelven error claro | NO |

## 6. Pruebas, limitaciones y dictamen

**Ejecutado:** verificación de HEAD y rama base; búsqueda del informe individual en la ruta actual y búsquedas de repositorio/historial; lectura de completadas.md; recuperación y validación del blob completo de Pendientes.md; inspección manual de esquema, dispatcher, RBAC, funciones de cobro, comprobantes, pagos, becas, conversión, UI y suites; reconciliación con TASK-001/F15-Task01, TASK-002/F15-Task02, TASK-003/F15-Task03, AUD-NG-145 y AUD-NG-161.

**No ejecutado:** Apps Script runtime; llamadas HTTP; Google Sheets/Drive productivos; revisión real de comprobantes; navegador; pruebas con familias reales; triggers; concurrencia real; suites automatizadas; conciliación contable en ambiente institucional. No se afirma que se haya producido una fuga, duplicación o pago real.

**Dictamen final: TAREA-F5-013 NO CUMPLE.** Hay componentes parciales de lectura de cargos, generación, carga genérica de comprobantes y formulario de becas, pero no integran un ciclo financiero de admisión seguro, parametrizable, auditable y conciliado. Los criterios marcados [x] en completadas.md no cuentan con evidencia técnica suficiente en el código actual.

**Alcance de esta iteración:** auditoría y documentación exclusivamente. No se modificaron código, pruebas, registros de tareas ni configuración productiva.

## 7. Tareas ejecutables derivadas de los hallazgos

Todas las subtareas son locales a TAREA-F5-013 y quedan **Pendientes**. Se amplían IDs globales existentes cuando cubren parte de la causa; no se crean duplicados.

### F5-013-A01 - Aplicar autorización de objeto a consultas y operaciones de cargos de admisión

- **Hallazgo:** H1.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** retirar la capacidad de crear cargos de los roles familiares; derivar actor y rol desde claims verificados; validar vínculo familiar activo y alcance de `solicitudId` para cada lectura/carga/revisión; reservar la creación y aprobación de cargos a roles institucionales autorizados.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`; contrato interservicio USER/ACADEMIC si se requiere verificar relación.
- **Dependencias:** AUD-NG-036, AUD-NG-222, F5-009-A03/A06, F5-012-A02/A03.
- **Alcance:** no confiar en `authRole`, `userId` ni `solicitudId` proporcionados por el cliente como prueba de propiedad.
- **Criterios verificables:** tutor vinculado solo consulta solicitudes autorizadas; tutor ajeno recibe denegación; rol familiar no crea cargos ni cambia montos; llamadas directas al backend conservan el mismo control.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-013-A02 - Definir esquema canónico y configuración de conceptos de admisión

- **Hallazgo:** H2.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** crear/ajustar configuración financiera para Derecho de Admisión, Examen de Ingreso y Reserva de Plaza; parametrizar monto, nivel, vigencia, vencimiento, obligatoriedad y exención; separar `SolicitudID` y `UserID` con tipo de entidad explícito; mantener compatibilidad/migración de filas existentes sin reinterpretar fechas.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `js/config.js`, UI de configuración contable y esquema de `CargosEstudiante`.
- **Dependencias:** TASK-001/F15-Task01 (clasificación/configuración de conceptos), TASK-002/F15-Task02 (generación de cargos).
- **Criterios verificables:** conceptos configurables sin editar código; cargo pre-matrícula vinculado solo a solicitud; cargo post-conversión vinculado a userId; fechas y montos no se sobrescriben; los lectores identifican cada entidad sin heurísticas.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-013-A03 - Hacer atómica e idempotente la generación de cargos de admisión

- **Hallazgo:** H3.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** usar clave persistente única por solicitud/concepto/versión de obligación; adquirir LockService y comprobar la clave dentro del bloqueo; rechazar reutilización de clave con payload incompatible; registrar resultado/reintento durable y manejar fallos parciales.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `CargosEstudiante`, pruebas de concurrencia.
- **Dependencias:** TASK-002/F15-Task02; AUD-NG-161.
- **Criterios verificables:** solicitudes simultáneas con misma clave crean un cargo; reintentos devuelven el mismo ID; cambios de monto/concepto con la misma clave se rechazan; fallos no dejan cargos parciales.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-013-A04 - Integrar comprobantes de pago por solicitud y aprobación contable transaccional

- **Hallazgo:** H4 y H5.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** extender el contrato de comprobantes con `solicitudId`, cargo, actor responsable, monto y referencia; validar el vínculo familiar y el cargo; mantener En_Revision hasta decisión contable; aprobar/rechazar con actor verificado, transición permitida, conciliación de monto y aplicación atómica del pago/saldo.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `js/student.js`, `student-dashboard.html`.
- **Dependencias:** F5-009-A03/A06; F5-012-A02/A03; TASK-003/F15-Task03 para reversión/regularización; AUD-NG-145.
- **Criterios verificables:** comprobante de aspirante no se confunde con usuario matriculado; carga no marca pagado; aprobación actualiza pago/cargo una sola vez; rechazo no reduce saldo; error intermedio deja estado consistente y recuperable.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-013-A05 - Unificar estados, saldo y bloqueo de admisión

- **Hallazgo:** H5 y H7.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** normalizar Pendiente, Pagado, En_Revision, Exento, Anulado y Rechazado; calcular saldo considerando pagos aprobados y exenciones autorizadas; exponer una decisión de elegibilidad financiera que el backend de admisiones compruebe antes de confirmar/converter.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/academic-service/Code.gs`, `js/student.js`.
- **Dependencias:** F5-012-A07; TASK-003/F15-Task03.
- **Criterios verificables:** Pendiente o Rechazado obligatorio bloquea conversión; En_Revision no se trata como pagado; Exento solo se libera con autorización; Anulado no suma saldo; la interfaz no puede omitir el gate del servidor.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-013-A06 - Integrar becas familiares y exenciones de admisión con aprobación de Dirección

- **Hallazgo:** H6.
- **Severidad:** Alto/P1.
- **Objetivo/acción:** vincular postulación familiar a `solicitudId` y cargos del aspirante; unificar `BecasYDescuentosFamiliares` con el flujo contable o establecer un contrato transaccional; validar rol/identidad de Dirección en backend, motivo, alcance, importe, estado y auditoría antes de aplicar beneficio.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `js/student.js`.
- **Dependencias:** TASK-001/F15-Task01; AUD-NG-036; AUD-NG-145; F5-012-A02/A03.
- **Criterios verificables:** postulación queda asociada a aspirante/cargo; ningún beneficio se aplica antes de aprobación; no se puede falsificar aprobador desde payload; porcentaje/importe respeta límites y se registra motivo.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-013-A07 - Migrar el historial financiero de admisión al expediente del estudiante sin duplicación

- **Hallazgo:** H7.
- **Severidad:** Alto/P1.
- **Objetivo/acción:** ampliar la conversión académica para transferir referencias de cargos, comprobantes, pagos aprobados, becas y exenciones al expediente contable del estudiante, conservando origen, IDs y estado; hacer la transferencia reanudable e idempotente.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`.
- **Dependencias:** F5-013-A02/A04/A06; F5-012-A07; TASK-002 y TASK-003.
- **Criterios verificables:** conversión conserva historial completo; cada transacción aparece una sola vez; los pagos previos reducen el saldo del estudiante; el vínculo con solicitud original permanece auditable.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-013-A08 - Incorporar cobros de aspirantes al resumen familiar y a su UI de pago/beca

- **Hallazgo:** H4, H6 y H8.
- **Severidad:** Alto/P1.
- **Objetivo/acción:** permitir distribuir pagos conjuntos entre cargos de aspirantes y estudiantes matriculados; presentar desglose por solicitud, concepto, monto, estado, comprobantes y beneficios; vincular el formulario de beca con el aspirante seleccionado; distinguir visualmente cargos de admisión y obligaciones ordinarias.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `js/student.js`, `student-dashboard.html` o ruta familiar autorizada.
- **Dependencias:** F5-013-A01/A02/A04/A06; F5-012-A01/A02/A06.
- **Criterios verificables:** resumen incluye todos los aspirantes vinculados; las distribuciones apuntan a cargos reales; no se asigna deuda de admisión a otro estudiante; el usuario ve estados de revisión y errores sin falsos éxitos.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-013-A09 - Registrar trazabilidad contable y clasificación separada de ingresos de admisión

- **Hallazgo:** H2 y H9.
- **Severidad:** Alto/P1.
- **Objetivo/acción:** registrar creación, comprobante, revisión, pago, rechazo, exención, anulación y migración con actor verificado, timestamp, motivo, valores previos/nuevos y correlationId; clasificar ingresos de admisión separados de matrícula/colegiatura y generar asiento contable según reglas institucionales.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, bitácoras y plan de cuentas.
- **Dependencias:** AUD-NG-145; TASK-001/F15-Task01; TASK-003/F15-Task03.
- **Criterios verificables:** cada cambio tiene actor y referencia correlacionada; no se exponen datos sensibles en logs; asiento y movimiento son conciliables; la auditoría permite reconstruir la vida financiera de la solicitud.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-013-A10 - Crear pruebas de regresión de extremo a extremo para F5-013

- **Hallazgo:** H10.
- **Severidad:** Alto/P1.
- **Objetivo/acción:** agregar pruebas aisladas de RBAC/IDOR, conceptos por nivel, creación concurrente, idempotencia, carga/revisión/rechazo de comprobantes, estados, becas/exenciones, bloqueo de conversión, migración y resumen familiar.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, nueva suite de finanzas/admisiones y harness de servicios.
- **Dependencias:** F5-013-A01..A09; AUD-NG-161.
- **Criterios verificables:** pruebas reproducibles con fixtures; dos familias aisladas; concurrencia no duplica cargos/pagos; ningún fallo marca pagado; conversión conserva saldo e historial; todos los criterios de F5-013 tienen evidencia trazable.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Reconciliación de IDs existentes

- Ampliar TASK-001/F15-Task01 con conceptos específicos de admisión y su clasificación tributaria configurable.
- Ampliar TASK-002/F15-Task02 con atomicidad/idempotencia de cargos de admisión y su convivencia con cargos de matrícula.
- Ampliar TASK-003/F15-Task03 con reversión/regularización de pagos de admisión.
- Ampliar AUD-NG-036/AUD-NG-222 para autorización por relación y solicitud; AUD-NG-145 para trazabilidad financiera; AUD-NG-161 para pruebas.
- Coordinar F5-012-A01/A02/A03/A07 para portal, relación familiar, estados y conversión. No crear IDs globales duplicados.

## 8. Cierre

- **Resultado:** auditoría finalizada; TAREA-F5-013 NO CUMPLE.
- **Subtareas:** F5-013-A01..A10, todas Pendientes; ninguna se implementó.
- **Archivos modificados en esta iteración:** informe F5-013 nuevo; `AUDITORIAS/Auditoria.txt`; `AUDITORIAS/MapaDependencias.md`; `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`; `AUDITORIAS/Contexto_personal.txt`.
- **Archivos no modificados:** backend/*; js/*; HTML; tests/*; `completadas.md`; `Pendientes.md`; `ChangesLogs.txt`; `METODOLOGIA_DESARROLLO.md`; rama base.
- **Siguiente tarea:** TAREA-F5-014 - trazabilidad de admisiones y notificaciones de auditoría. Antes de auditar, comprobar informe individual e historial.
