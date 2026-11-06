# Migración histórica de tareas: Contabilidad

> Fuente íntegra: `RECUPERACION/Pendientes_RECUPERADO.md`  
> Blob de origen: `ef47d232db3ed46317dc14f22b1cdf8f938e8405` (1.443.391 bytes; 17.884 líneas).  
> Registros asignados a este departamento: **89**.  
> Los bloques se reproducen sin reescritura; cada uno conserva encabezado, identificador, estado, descripción y criterios originales. Los comentarios indican su rango de origen.

**Criterio de asignación:** responsabilidad funcional principal. Si el alcance funcional es compartido, se aplica la jerarquía Dirección → Secretaria → Contabilidad → Docente → Estudiante → Otros. La infraestructura técnica transversal y las pruebas compartidas se asignan a Otros.

**Alcance:** archivo histórico de migración. Las tareas `AUD-NG` derivadas de auditoría no se duplican aquí; permanecen en sus informes conforme a `METODOLOGIA_DESARROLLO.md`, sección 3.4.

## Histórico completado F10/F11

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 64-78; clave F11-Task02; asignación única: Contabilidad -->
### [X] [F11-Task02] Garantizar la integridad de los registros contables y el flujo de autorizaciones financieras
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área IV (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad contable, prevención de fraude)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** AsientosContables, OrdenesCompra, ComprobantesEgresos
- **Descripción del Alcance:**
  Asegurar el principio de partida doble, validar el equilibrio entre débitos y créditos en cada asiento contable e implementar autorizaciones financieras multinivel según límites de monto antes de la afectación presupuestaria.
- **Criterios de Aceptación:**
  - Todo asiento desequilibrado es rechazado y las compras mayores al umbral requieren aprobación formal de Dirección.
- **Estado:** [X] Completado

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 234-248; clave F11-Task13; asignación única: Contabilidad -->
### [X] [F11-Task13] Desarrollar la conciliación bancaria asistida y pareo automático de extractos
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área IV (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Control de tesorería)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** ConciliacionBancaria
- **Descripción del Alcance:**
  Permitir importar movimientos bancarios y compararlos contra ingresos/egresos internos, identificando partidas concilidadas y diferencias pendientes.
- **Criterios de Aceptación:**
  - El sistema marca los movimientos pareados y genera la hoja de trabajo de conciliación del mes.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 249-263; clave F11-Task14; asignación única: Contabilidad -->
### [X] [F11-Task14] Desarrollar el control presupuestario y alertas de sobregiro por centro de costo
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área IV (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión presupuestaria)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** PresupuestosInstitucionales
- **Descripción del Alcance:**
  Comparar montos presupuestados vs ejecutados por departamento/centro de costo, emitiendo alertas cuando un gasto comprometa la partida asignada.
- **Criterios de Aceptación:**
  - Se genera una advertencia o bloqueo presupuestario cuando una solicitud excede el presupuesto disponible.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 264-278; clave F11-Task15; asignación única: Contabilidad -->
### [X] [F11-Task15] Integrar la gestión de becas y exoneraciones con los estados de cuenta estudiantiles
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área IV (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Finanzas estudiantiles)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** BecasDescuentos, CuentasPorCobrar
- **Descripción del Alcance:**
  Aplicar reglas automáticas de becas y descuentos aprobados sobre los cobros periódicos de colegiatura en los estados de cuenta de los estudiantes.
- **Criterios de Aceptación:**
  - La mensualidad refleja de forma transparente el arancel base, el descuento/beca aplicado y el saldo neto a pagar.
- **Estado:** [X] Completado

---


## Backlog histórico TASK

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 572-627; clave TASK-001; asignación única: Contabilidad -->
### [TASK-001] [X] [F15-Task01] Corrección del motor de facturación fiscal SAR, clasificación tributaria y control de CAI
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.2) y Sección J (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Cumplimiento fiscal tributario SAR, prevención de sanciones legales e integridad documental)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `FacturasFiscales`
  - `ConceptosCobro`
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `ConceptosCobro`, `FacturasFiscales`, `ROLE_PERMISSIONS`, motor de emisión documental CUV
- **Descripción del Alcance:**
  El motor `createFiscalInvoice` aplica actualmente un cálculo genérico del 15% de ISV sin diferenciar adecuadamente la naturaleza tributaria de cada concepto. Además, no dispone de controles suficientes para impedir la emisión de documentos con un CAI vencido, agotado o fuera de su rango autorizado.
  Requerimientos Funcionales Detallados:
  1. Clasificación tributaria de conceptos:
     - Incorporar a `ConceptosCobro` los siguientes atributos obligatorios: `TipoTributario` (Exento, Gravado, No Sujeto), `TasaISV` (porcentaje aplicable), `CodigoTributario` (clasificación interna), `FechaVigenciaTributaria`, y `RequiereValidacionFiscal`.
     - Permitir configurar el tratamiento tributario individualmente para cada concepto desde la plataforma. Si existen disputas o cambios en la normativa tributaria sobre el tratamiento de un concepto, este debe ser 100% configurable sin alterar código duro.
     - Clasificar matrícula y colegiaturas conforme al tratamiento fiscal aplicable a los servicios educativos (Artículo 15 de la Ley del ISV de Honduras).
     - Permitir clasificar uniformes, materiales, transporte y servicios extracurriculares según su tratamiento tributario correspondiente.
     - No asumir que todos los conceptos educativos o relacionados con el colegio comparten automáticamente la misma condición fiscal.
  2. Cálculo tributario desglosado:
     - Calcular separadamente subtotal exento, subtotal gravado, ISV y total general.
     - Aplicar la tasa correspondiente a cada concepto de forma atómica.
     - Evitar que un concepto exento genere impuestos por defecto.
     - Permitir facturas mixtas que contengan simultáneamente conceptos exentos y gravados.
     - Conservar el desglose tributario original inmutable en la factura emitida.
  3. Administración de autorizaciones CAI:
     - Registrar CAI, rango inicial, rango final, fecha de autorización y fecha límite de emisión.
     - Controlar el número correlativo siguiente protegiéndolo con candados atómicos `LockService`.
     - Impedir emisiones cuando el CAI esté vencido o el rango autorizado esté agotado.
     - Alertar visual y programáticamente cuando el rango disponible esté próximo a agotarse (umbral configurable, ej. últimos 50 números).
     - Permitir administrar diferentes rangos autorizados y sus respectivos estados (`Activo`, `Agotado`, `Vencido`, `Inactivo`).
     - Mantener el historial de autorizaciones anteriores sin sobrescribirlas.
  4. Separación de documentos:
     - Diferenciar recibos internos de caja y facturas fiscales; no considerarlos equivalentes.
     - Mantener correlativos independientes para recibos y facturas fiscales.
     - Evitar que la generación de un recibo interno consuma un número del rango fiscal del SAR.
     - Vincular ambos documentos al mismo pago cuando corresponda.
  5. Validaciones fiscales:
     - No permitir modificar retrospectivamente la clasificación tributaria de una factura emitida.
     - Exigir un proceso de corrección fiscal documentado.
     - Validar RTN (14 dígitos en Honduras), datos del receptor y campos fiscales obligatorios.
     - Mantener la información histórica de las tasas y reglas aplicadas al momento exacto de la emisión.
- **Criterios de Aceptación:**
  - Una colegiatura clasificada como exenta no genera ISV bajo ninguna circunstancia.
  - Un concepto gravado aplica la tasa configurada exactamente.
  - Una factura mixta presenta correctamente los importes exentos y gravados desglosados.
  - Una factura no puede emitirse con CAI vencido (lanza error `CAI_EXPIRED`).
  - Una factura no puede superar el rango autorizado (lanza error `CAI_RANGE_EXHAUSTED`).
  - Dos usuarios que intenten emitir simultáneamente no pueden recibir el mismo correlativo.
  - Los recibos internos y las facturas fiscales mantienen numeraciones independientes garantizadas.
  - Una factura emitida conserva su desglose tributario original aunque posteriormente cambie la configuración del concepto en la base de datos.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 628-686; clave TASK-002; asignación única: Contabilidad -->
### [TASK-002] [X] [F15-Task02] Motor de generación masiva, programada y recurrente de mensualidades escolares
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.1) y Sección J (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Ciclo de cobranza institucional, prevención de omisiones e integridad financiera)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `CargosEstudiante`
  - `TarifasPlanPago`
  - `DescuentosBecas`
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `TarifasPlanPago`, `CargosEstudiante`, `Matriculas`, `Usuarios`, `DescuentosBecas`, `LockService`
- **Descripción del Alcance:**
  Actualmente los cargos se generan principalmente durante la admisión o matrícula individual. No existe un proceso integral para generar las mensualidades de todos los estudiantes activos de un período académico de forma recurrente y masiva.
  Requerimientos Funcionales Detallados:
  1. Configuración del ciclo de cobros:
     - Permitir configurar un calendario de cobros por año lectivo (cantidades de cuotas, fechas de generación, fechas de vencimiento y períodos de gracia).
     - Permitir diferentes calendarios por nivel, grado, sección o modalidad educativa parametrizables desde la plataforma.
     - Admitir mensualidades con importes diferentes según el período (ej. meses con arancel diferenciado o cuotas extraordinarias).
     - Permitir suspender o modificar futuras generaciones sin alterar cargos históricos ya asentados.
  2. Generación masiva:
     - Crear la función `generateBatchMonthlyCharges` en `backend/accounting-service/Code.gs`.
     - Permitir seleccionar: Año lectivo, mes o período de cobro, nivel educativo, grado, sección, estudiantes individuales o grupos completos, y fecha de vencimiento.
     - Obtener las tarifas correspondientes desde `TarifasPlanPago`.
     - Identificar automáticamente los estudiantes matriculados y activos en el período.
     - Excluir estudiantes retirados, trasladados o con matrícula cancelada a la fecha efectiva.
     - Aplicar becas y descuentos aprobados (`applyApprovedScholarshipsToCharges`).
     - Crear los cargos con identificadores individuales únicos (`CRG-...`).
     - Vincular cada cargo al estudiante, año lectivo, tarifa y período correspondiente.
  3. Simulación previa:
     - Antes de generar cargos, presentar una vista previa interactiva que muestre cantidad de estudiantes afectados, desglose por concepto, descuentos aplicables, estudiantes sin tarifa configurada, estudiantes con cargos ya generados, importe total a cargar y posibilidad de excluir estudiantes antes de confirmar.
  4. Protección contra duplicados y consistencia:
     - Crear una clave única lógica basada en estudiante, concepto, período y año lectivo (`studentId_concepto_periodo_anoLectivo`).
     - No depender exclusivamente del nombre del concepto para identificar duplicados.
     - Impedir que dos ejecuciones simultáneas creen el mismo cargo mediante candado de script.
     - Registrar el identificador de la ejecución masiva (`BATCH-CRG-...`).
     - Permitir reanudar procesos interrumpidos sin repetir cargos previamente creados.
     - Generar un informe de registros creados, omitidos y fallidos.
  5. Automatización periódica:
     - Permitir programar generaciones mediante activadores basados en tiempo de Apps Script (cron mensual).
     - Modo dual: generación manual asistida y modo desatendido programado.
     - Permitir desactivar temporalmente la automatización desde la plataforma.
     - Evitar que una ejecución automática genere cargos fuera del calendario configurado.
  6. Control administrativo:
     - Registrar quién autorizó la generación, fecha, hora, período y parámetros utilizados, guardando el historial de ejecuciones.
- **Criterios de Aceptación:**
  - Se pueden generar mensualidades para toda una cohorte con una sola operación atómica.
  - Se pueden generar cargos segmentados por grado, sección o estudiante.
  - Se aplican correctamente las tarifas y beneficios vigentes de cada alumno.
  - No se generan cargos duplicados al reintentar la operación.
  - Una interrupción de red o de cuota no obliga a repetir el proceso completo ni duplica los cargos creados.
  - Se puede consultar el resultado y métricas de cada lote de ejecución masiva.
  - Un estudiante retirado no recibe mensualidades posteriores a la fecha efectiva de retiro.
  - Los cargos históricos permanecen intactos cuando se modifica una tarifa futura.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 687-753; clave TASK-003; asignación única: Contabilidad -->
### [TASK-003] [X] [F15-Task03] Sistema integral de anulaciones, reversión de pagos, notas de crédito y reembolsos
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.3) y Sección J (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad contable, reversión de pagos, control tributario SAR y prevención de fraude)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `FacturasFiscales`
  - `PagosAbonos`
  - `CargosEstudiante`
  - `MovimientosCajaBancos`
  - `AsientosContables`
  - `NotasCreditoFiscales`
- **Dependencias Expuestas:** `FacturasFiscales`, `PagosAbonos`, `CargosEstudiante`, `MovimientosCajaBancos`, `AsientosContables`, `NotasCreditoFiscales`
- **Descripción del Alcance:**
  No existe un flujo completo para revertir operaciones financieras, devolver dinero, corregir documentos fiscales o anular cargos con trazabilidad inmutable.
  Requerimientos Funcionales Detallados:
  1. Anulación de cargos:
     - Implementar `voidCharge` en `backend/accounting-service/Code.gs`.
     - Permitir anular cargos pendientes exigiendo motivo obligatorio (mínimo 10 caracteres) y observaciones.
     - Registrar usuario, fecha, hora y autorización inmutable.
     - Impedir la eliminación física de la fila (borrado lógico: `estado = 'Anulado'`).
     - Bloquear la anulación directa de cargos con pagos asociados en `PagosAbonos`.
     - Exigir un procedimiento de reversión o regularización previa cuando existan abonos.
  2. Reversión de pagos:
     - Implementar `reversePayment`.
     - Identificar el pago original y todos los cargos afectados.
     - Revertir sus aplicaciones sin eliminar el movimiento histórico.
     - Restituir los saldos pendientes correspondientes en `CargosEstudiante`.
     - Registrar la operación inversa en caja y contabilidad.
     - Evitar que una reversión se ejecute más de una vez mediante control de estado.
     - Permitir reversión total y reversión parcial documentada.
  3. Notas de crédito fiscales SAR:
     - Crear la estructura y hoja `NotasCreditoFiscales` en `getOrCreateSheet`.
     - Implementar `issueFiscalCreditNote`.
     - Vincular cada nota de crédito obligatoriamente con la factura original autorizada.
     - Registrar motivo, importe, fecha, receptor y referencia fiscal SAR.
     - Incorporar los datos de autorización fiscal exigidos: CAI propio de notas de crédito, rango autorizado y fecha límite.
     - Permitir notas de crédito totales y parciales.
     - Conservar el documento original y el documento correctivo intactos.
     - Impedir emitir notas que excedan el saldo fiscal susceptible de acreditación.
  4. Devoluciones monetarias y reembolsos:
     - Implementar `processPaymentRefund`.
     - Permitir devoluciones totales y parciales registrando método de devolución, cuenta bancaria o caja de egreso y responsable autorizador.
     - Generar un documento interno de egreso en `MovimientosCajaBancos`.
     - Vincular el reembolso al pago y, cuando corresponda, a la nota de crédito emitida.
     - Diferenciar con total claridad una devolución real de dinero de una simple acreditación de saldo a favor.
  5. Tratamiento de casos especiales:
     - Pago recibido y devuelto; pago aplicado a estudiante equivocado; cargo generado por error; matrícula cancelada pos-pago; pago duplicado; pago parcial que requiere devolución; factura emitida con importe incorrecto; pago que debe reasignarse a otra obligación.
  6. Control contable:
     - Generar asientos inversos en `AsientosContables` respetando el principio de partida doble.
     - Actualizar saldos afectados sin sobrescribir los asientos originales.
     - Registrar los egresos en `MovimientosCajaBancos`.
     - Evitar que una nota de crédito genere automáticamente una salida de efectivo cuando no existe devolución monetaria física.
- **Criterios de Aceptación:**
  - No se puede anular físicamente un pago o cargo (trazabilidad permanente).
  - Una reversión restituye exactamente los importes pendientes de los cargos afectados.
  - Una reversión duplicada es rechazada con código de error.
  - Un reembolso parcial no puede superar el importe efectivamente pagado no reembolsado.
  - Toda nota de crédito queda unívocamente vinculada a su factura fiscal original.
  - La nota de crédito no se confunde con un egreso de caja si no hubo salida monetaria.
  - Los movimientos inversos se reflejan en los reportes contables y en el libro diario.
  - Todas las operaciones requieren justificación y rol administrativo autorizado (`Contador`, `Director`, `Administrador`).
  - Los saldos individuales y familiares coinciden matemáticamente después de cada operación.
- **Estado:** [X] Completado

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 915-953; clave TASK-007; asignación única: Contabilidad -->
### [TASK-007] [X] [F17-Task01] Eliminar el salario fijo y calcular la remuneración según el contrato vigente de cada empleado
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección E (Brecha E.1) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad financiera, legalidad de pagos y cálculo salarial contractual exacto)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`calculatePayrollPeriod`)
  - Hoja `ContratosLaborales`
  - Hoja `ExpedientesLaborales`
  - Estructuras de planilla y comprobantes de pago
- **Dependencias Expuestas:** `ContratosLaborales`, `ExpedientesLaborales`, `PlanillasNomenclatura`, `BoletasPago`
- **Descripción del Alcance:**
  `calculatePayrollPeriod` utiliza actualmente un salario fijo hardcodeado de L 22,000.00 (`const salarioBase = 22000;`) en lugar de consultar el salario contractual de cada empleado. Esto provoca que trabajadores con condiciones salariales diferentes (docentes, directivos, personal administrativo o de servicio) reciban cálculos idénticos en la nómina.
  Requerimientos Funcionales Detallados:
  1. Consulta dinámica y vinculación de contratos laborales:
     - Obtener el contrato correspondiente a cada empleado mediante su identificador de expediente (`expedienteId`).
     - Seleccionar el contrato cuya vigencia incluya el período de planilla procesado (`fechaInicio` <= fin de período y (`fechaFin` >= inicio de período o vacía/indefinida)).
     - Obtener el salario base, jornada laboral, modalidad de pago y demás condiciones económicas aplicables directamente desde el registro contractual.
     - Admitir empleados con salarios diferentes sin depender de valores predeterminados o constantes fijas en el código.
  2. Proporcionalidad y modificaciones en el período:
     - Determinar el salario proporcional exacto cuando el empleado ingresa, finaliza su relación laboral o cambia de condiciones salariales durante el transcurso del período.
     - Si existen varios contratos o modificaciones salariales dentro de un mismo período, aplicar las condiciones correspondientes a cada intervalo de vigencia de forma ponderada.
     - Mantener separados los valores contractuales históricos de los valores vigentes.
  3. Detección y gestión de incidencias contractuales:
     - Identificar contratos vencidos, futuros, suspendidos, incompletos o superpuestos.
     - Prohibir taxativamente sustituir silenciosamente un salario contractual inexistente por un valor predeterminado (ej. L 22,000.00).
     - Si un empleado no tiene contrato vigente válido, debe identificarse como una incidencia que requiere resolución previa antes de incorporarse a la nómina calculada.
     - Conservar el salario y las condiciones efectivamente utilizadas en el cálculo histórico, de manera que una modificación posterior del contrato no altere retroactivamente una planilla ya calculada o cerrada.
- **Criterios de Aceptación:**
  - Al procesar tres empleados con salarios contractuales diferentes, cada uno recibe su cálculo correspondiente de forma individualizada.
  - Al procesar un empleado que ingresa a mitad del período se calcula el salario proporcional a los días laborados.
  - Al procesar un empleado cuya fecha de salida ocurre dentro del período se liquida únicamente el tiempo devengado.
  - Un cambio salarial con vigencia intermedia en el mes aplica ambas condiciones salariales en sus respectivos intervalos.
  - Intentar procesar un empleado sin contrato vigente genera una incidencia clara y bloquea su inclusión sin asignar salarios arbitrarios.
  - Los contratos superpuestos o ambiguos impiden un cálculo silenciosamente incorrecto.
  - Modificar un contrato no altera los resultados de planillas históricas previamente calculadas o cerradas.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 954-994; clave TASK-008; asignación única: Contabilidad -->
### [TASK-008] [X] [F17-Task02] Integrar automáticamente las novedades aprobadas en el cálculo de planilla
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección E (Brecha E.2) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Remuneración integral, compensación de horas extras y deducción de ausencias)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`calculatePayrollPeriod`)
  - `AprobacionHorasExtras`
  - `DeduccionesAsistencia`
  - `SolicitudesVacaciones`
  - `IncapacidadesMedicas`
  - `ContratosLaborales`
  - `PlanillasNomenclatura`
- **Dependencias Expuestas:** `AprobacionHorasExtras`, `DeduccionesAsistencia`, `SolicitudesVacaciones`, `IncapacidadesMedicas`, `F17-Task01`
- **Descripción del Alcance:**
  El motor `calculatePayrollPeriod` inicializa en cero las horas extras, sus importes, las bonificaciones y otras deducciones (`horasExtras = 0; montoHorasExtras = 0; bonificaciones = 0; otrasDed = 0;`), sin incorporar los registros aprobados existentes. Asimismo, las tardanzas y ausencias registradas en `DeduccionesAsistencia` no se trasladan a la planilla.
  Requerimientos Funcionales Detallados:
  1. Recopilación e integración de novedades del período:
     - Consultar las novedades correspondientes a cada empleado y al rango de fechas del período de planilla procesado.
     - Incorporar únicamente novedades que cuenten con estado formal de aprobación y que no hayan sido procesadas previamente en otra nómina.
     - Diferenciar nítidamente los tipos de novedad: horas extras aprobadas, tardanzas acumuladas, ausencias injustificadas, permisos remunerados, permisos sin goce de sueldo, incapacidades médicas y bonificaciones autorizadas.
  2. Trazabilidad e idempotencia de novedades:
     - Conservar la referencia del registro de origen (`origenRefId`) para cada valor monetario incorporado.
     - Evitar que una misma novedad se procese más de una vez mediante el marcado de estado a `ProcesadaEnNomina` vinculado al `planillaId`.
     - Diferenciar novedades pendientes, aprobadas, rechazadas, anuladas y ya incorporadas.
     - Identificar novedades registradas con posterioridad al cálculo de una planilla pero que corresponden a dicho período.
     - Evitar que la modificación de una novedad ya incorporada altere silenciosamente una planilla aprobada o cerrada; en su defecto, exigir un ajuste de período o recálculo controlado.
     - Presentar incidencias cuando existan registros incompletos, duplicados, contradictorios o pendientes de autorización.
     - Diferenciar ingresos adicionales y deducciones sin agruparlos indiscriminadamente en campos genéricos.
- **Criterios de Aceptación:**
  - Las horas extras aprobadas se incorporan exactamente una sola vez en el período correspondiente.
  - Las tardanzas y ausencias injustificadas se descuentan conforme a las horas/días reales según la política institucional configurada.
  - Un permiso sin goce de sueldo aprobado se descuenta proporcionalmente al salario diario del trabajador.
  - Un permiso remunerado o vacación aprobada no genera descuentos indebidos en el salario base.
  - Una incapacidad médica aceptada por el IHSS se procesa con su subsidio legal y no se califica como ausencia injustificada.
  - Ejecutar dos veces el cálculo no duplica novedades ni importes devengados o deducidos.
  - Una novedad rechazada o pendiente no afecta el resultado económico de la planilla.
  - El detalle de cada concepto permite rastrear el identificador del registro de asistencia u horas extras de origen.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 995-1033; clave TASK-009; asignación única: Contabilidad -->
### [TASK-009] [X] [F17-Task03] Implementar las aportaciones patronales y separar los costos institucionales de las deducciones del empleado
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección C (C.1), Sección E (Brecha E.3) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Costos laborales institucionales, cumplimiento de seguridad social y exactitud contable)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `PlanillasNomenclatura`
  - `PoliticasFiscales`
  - `AsientosContables`
  - `recordAccountingJournalEntry`
- **Dependencias Expuestas:** `PoliticasFiscales`, `PlanillasNomenclatura`, `AsientosContables`, `F17-Task07`, `F17-Task08`
- **Descripción del Alcance:**
  El cálculo contempla actualmente determinadas retenciones del trabajador (IHSS 3.5% y RAP 1.5%), pero omite por completo las aportaciones patronales obligatorias en Honduras: IHSS patronal (~7.2%), RAP patronal (1.5%) e INFOP (1.0%). Esto impide determinar el costo laboral institucional real y registrar todas las obligaciones patronales por pagar en la contabilidad.
  Requerimientos Funcionales Detallados:
  1. Separación de conceptos obrero vs patronal:
     - Incorporar conceptos independientes para las aportaciones del empleado y las aportaciones a cargo del empleador.
     - Configurar bases de cálculo, porcentajes, techos, exclusiones, condiciones y vigencias para cada aportación.
     - Implementar los cálculos patronales del IHSS (Régimen de Salud y Maternidad + IVM), RAP e INFOP conforme a las disposiciones legales aplicables al período.
     - Mantener estrictamente separados: Salario bruto devengado, Deducciones del empleado, Salario neto a pagar, Aportaciones patronales, Costo laboral institucional total y Obligaciones pendientes de pago.
  2. Protección del salario del trabajador:
     - Prohibir taxativamente que las aportaciones patronales reduzcan el salario neto del trabajador.
     - Identificar los conceptos que integran la base de cada aportación patronal, sin asumir que todas utilizan la misma base imponible.
     - Permitir actualizar porcentajes, techos y reglas mediante parámetros con fecha de vigencia documentada en `PoliticasFiscales`.
     - Conservar los parámetros aplicados en cada planilla histórica.
  3. Integración en reportes y contabilidad:
     - Incorporar los importes patronales en los reportes de costo laboral institucional y en el asiento contable automático.
     - Desglosar las obligaciones patronales por empleado, departamento y período.
- **Criterios de Aceptación:**
  - La aportación patronal se calcula de forma independiente y separada de la deducción obrera.
  - El salario neto del empleado no disminuye por la incorporación de aportaciones patronales.
  - Los techos y porcentajes utilizados corresponden a la configuración vigente del período procesado.
  - Los reportes institucionales muestran por separado el costo salarial, las aportaciones patronales y las deducciones obreras.
  - Los asientos contables automáticos por partida doble incorporan el gasto patronal (Debe) y las cuentas de pasivo por pagar (Haber) manteniendo equilibrio exacto (`Math.abs(totalDebe - totalHaber) <= 0.01`).
  - Las aportaciones patronales no se duplican al recalcular o reintentar el procesamiento de la nómina.
  - Las modificaciones de parámetros normativos no alteran planillas de períodos cerrados.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1034-1070; clave TASK-010; asignación única: Contabilidad -->
### [TASK-010] [X] [F17-Task04] Sustituir el cálculo simplificado del ISR por un motor de retención progresiva y anualizada
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección C (C.1), Sección E (Brecha E.3) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Cumplimiento tributario con el SAR, retención progresiva y prevención de multas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`calculatePayrollPeriod`)
  - `PoliticasFiscales`
  - `configureFiscalPolicy`
  - `getFiscalPolicies`
- **Dependencias Expuestas:** `PoliticasFiscales`, `PlanillasNomenclatura`, `F17-Task07`, `F17-Task08`
- **Descripción del Alcance:**
  El cálculo actual aplica un 15% fijo sobre el excedente de L 20,000.00 (`salarioBase > 20000 ? (salarioBase - 20000) * 0.15 : 0`), lo cual viola la legislación del Impuesto Sobre la Renta de Honduras (Art. 22). No reproduce el cálculo progresivo anualizado ni contempla deducciones médicas de ley, tramos gravables progresivos, exenciones ni ajustes fiscales.
  Requerimientos Funcionales Detallados:
  1. Motor de retención progresiva anualizada:
     - Implementar el cálculo de retención en la fuente del ISR basado en los tramos oficiales y parámetros fiscales vigentes para cada ejercicio fiscal (ej. escala progresiva del SAR: tramo exento, 15%, 20%, 25%).
     - Proyectar los ingresos gravables anuales del empleado considerando los meses restantes del año fiscal.
     - Deducir los gastos médicos de ley que correspondan (deducción automática legalmente autorizada) y aportaciones a la seguridad social deducibles.
     - Determinar el impuesto anual proyectado aplicando las alícuotas correspondientes a cada tramo gravable progresivo.
     - Deducir las retenciones ya efectuadas en meses anteriores del ejercicio y dividir el saldo entre los meses restantes del año.
  2. Tratamiento de incidencias y cambios salariales:
     - Diferenciar conceptos gravables (sueldos, horas extras, comisiones) de no gravables (13º y 14º mes hasta los topes legales de exención).
     - Recalcular la proyección ante aumentos salariales, bonificaciones extraordinarias o ingresos a mitad de año fiscal.
     - Conservar el detalle de la base gravable proyectada, tramo aplicado, impuesto anual estimado y retención mensual del período.
     - Mantener las tablas fiscales parametrizadas por ejercicio fiscal y fecha de vigencia en `PoliticasFiscales` sin modificar código duro.
- **Criterios de Aceptación:**
  - Se valida el cálculo exacto de ingresos anuales ubicados en cada uno de los tramos de la tabla progresiva vigente del SAR.
  - No se aplica un porcentaje único plano sobre toda la base imponible cuando corresponda tarifa progresiva.
  - Se aplica correctamente el tratamiento de deducciones personales acreditables conforme a ley.
  - Al registrar un aumento salarial a mitad del ejercicio, el sistema recalcula la proyección y ajusta la retención mensual proporcionalmente.
  - Un empleado que ingresa a mitad del año fiscal recibe una proyección basada en los meses efectivos a laborar.
  - Los resultados se contrastan y coinciden con cálculos independientes basados en los parámetros oficiales del ejercicio del SAR.
  - La retención de un período no sobrescribe las retenciones históricas de meses anteriores.
  - La actualización de la tabla tributaria para un nuevo año fiscal no altera los cálculos de planillas cerradas.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1071-1111; clave TASK-011; asignación única: Contabilidad -->
### [TASK-011] [X] [F17-Task05] Crear el cálculo y procesamiento independiente del décimo tercer y décimo cuarto mes
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección C (C.1), Sección E (Brecha E.4) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Beneficios sociales obligatorios en Honduras: Aguinaldo y Décimo Cuarto Mes Decreto 135-94)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `PlanillasNomenclatura`
  - `ContratosLaborales`
  - `ExpedientesLaborales`
  - `BoletasPago`
  - `AsientosContables`
- **Dependencias Expuestas:** `ContratosLaborales`, `PlanillasNomenclatura`, `BoletasPago`, `AsientosContables`, `F17-Task01`, `F17-Task03`
- **Descripción del Alcance:**
  No existe un motor para calcular y procesar las remuneraciones extraordinarias del Décimo Tercer Mes (Aguinaldo, pagadero en diciembre) y Décimo Cuarto Mes de Compensación Social (pagadero en junio conforme al Decreto 135-94). La plataforma no permite gestionar sus períodos de acumulación, proporcionalidad por tiempo laborado, anticipos ni su liquidación al cese laboral.
  Requerimientos Funcionales Detallados:
  1. Motor de remuneraciones extraordinarias independientes:
     - Incorporar el Décimo Tercer y Décimo Cuarto Mes como procesos de planilla extraordinaria diferenciados de la nómina ordinaria mensual.
     - Administrar por separado los períodos legales de acumulación: 13º mes (1 de diciembre al 30 de noviembre) y 14º mes (1 de julio al 30 de junio).
     - Calcular el valor completo (un mes de salario ordinario devengado) cuando se cumpla el período de 12 meses completos.
     - Calcular el valor proporcional matemático en días/meses cuando el empleado tenga menor tiempo de servicio en el período de cómputo.
  2. Salarios base, anticipos y retenciones:
     - Utilizar el promedio de salarios ordinarios devengados o el salario vigente conforme a la normativa y jurisprudencia aplicable.
     - Registrar anticipos previamente otorgados sobre estos beneficios y deducirlos del saldo neto a pagar para evitar duplicaciones.
     - Aplicar la exención tributaria y de seguridad social correspondiente a estos beneficios conforme a las leyes de Honduras.
     - Calcular el beneficio proporcional correspondiente en caso de terminación laboral (finiquito).
  3. Cierre, boletas y contabilidad:
     - Generar planillas extraordinarias independientes con su propio ciclo de aprobación, cierre y boleta de pago en PDF.
     - Registrar los asientos contables automáticos en cuentas diferenciadas de pasivo y gasto.
     - Conservar el historial inmutable de cada beneficio para impedir pagos duplicados.
- **Criterios de Aceptación:**
  - Se calcula el beneficio completo para empleados con el período de acumulación completo.
  - Se calcula el beneficio proporcional exacto para colaboradores con ingresos recientes o períodos fraccionados.
  - Los anticipos otorgados previamente se descuentan del total del beneficio sin errores de saldo.
  - Al procesar una desvinculación laboral se liquida el proporcional de 13º y 14º mes devengado a la fecha de salida.
  - Un beneficio extraordinario ya pagado y cerrado no puede volver a incluirse en otra planilla.
  - Cada beneficio genera su boleta de pago individual y su asiento contable específico.
  - Las reglas y períodos históricos se conservan sin alteración tras actualizar parámetros legales futuros.
- **Estado:** [X] Completado

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1116-1159; clave TASK-012; asignación única: Contabilidad -->
### [TASK-012] [X] [F18-Task01] Corregir el control de recepciones parciales y entregas escalonadas
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección E (Brecha E.1) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad en recepción física de compras, control de inventario y prevención de pérdidas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`recordPurchaseReceipt`)
  - `OrdenesCompra`
  - `RecepcionesCompra`
  - `InventariosKardex`
- **Dependencias Expuestas:** `OrdenesCompra`, `RecepcionesCompra`, `InventariosKardex`, `recordInventoryMovement`
- **Descripción del Alcance:**
  Actualmente, `recordPurchaseReceipt` cambia incondicionalmente el estado de la orden a `RecibidaTotal` después de registrar la primera recepción, sin comprobar si se recibió la totalidad de las cantidades autorizadas (`ordSheet.getRange(oIdx + 1, 10).setValue("RecibidaTotal");`). Esto impide registrar entregas posteriores y provoca que desaparezcan del seguimiento las cantidades pendientes de recibir.
  Requerimientos Funcionales Detallados:
  1. Recepciones múltiples y cálculo acumulado:
     - Permitir registrar varias recepciones asociadas a una misma orden de compra.
     - Mantener el detalle de las cantidades solicitadas, recibidas, rechazadas, devueltas y pendientes por cada partida.
     - Calcular las cantidades acumuladas recibidas considerando todas las recepciones válidas registradas para la orden.
     - Determinar el estado de recepción de cada partida individual y de la orden completa.
     - Admitir entregas parciales de diferentes artículos en fechas distintas.
     - Registrar cada recepción como un documento independiente en `RecepcionesCompra`, con identificador único (`REC-CMP-...`), fecha, responsable, observaciones y documentos adjuntos.
  2. Gestión de incidencias físicas y devoluciones:
     - Permitir registrar productos faltantes, sobrantes, dañados, incorrectos o rechazados sin contabilizarlos como unidades conformes.
     - Permitir registrar devoluciones posteriores a una recepción, conservando el historial y ajustando las existencias disponibles en `InventariosKardex`.
     - Mantener las cantidades pendientes abiertas aunque la orden tenga varias recepciones previas.
     - Evitar que una recepción repetida por doble clic, reintento o interrupción de conexión incremente dos veces las existencias físicas.
     - Conservar la relación entre cada recepción, la orden de compra original y sus movimientos de inventario en Kardex.
     - Permitir consultar todas las recepciones asociadas a una orden y el detalle de cada una.
  3. Estados del ciclo de recepción de órdenes:
     - `PendienteRecepcion`, `RecibidaParcial`, `RecibidaTotal`, `EnDisputa`, `Cancelada`.
     - La orden solo debe pasar a `RecibidaTotal` cuando todas sus partidas estén completamente recibidas y conformes, o cuando las cantidades restantes hayan sido formalmente canceladas o resueltas mediante una operación autorizada.
- **Criterios de Aceptación:**
  - Registrar una recepción de 5 unidades para una orden de 10 y comprobar que la orden pasa a `RecibidaParcial` manteniendo 5 pendientes.
  - Registrar una segunda recepción de 3 unidades y comprobar que quedan 2 pendientes.
  - Registrar las 2 unidades restantes y comprobar que la orden pasa a `RecibidaTotal`.
  - Recibir diferentes partidas en fechas distintas sin cerrar prematuramente la orden de compra.
  - Registrar unidades dañadas y verificar que no se contabilizan como recepción conforme.
  - Registrar una devolución y comprobar que se conserva el historial y se ajustan las cantidades en Kardex.
  - Intentar recibir cantidades superiores a las autorizadas genera una restricción o exige una autorización excepcional documentada.
  - Repetir una operación de recepción no duplica los movimientos de inventario.
  - Cada recepción conserva su identificador único y su vínculo persistente con la orden original.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1160-1208; clave TASK-013; asignación única: Contabilidad -->
### [TASK-013] [X] [F18-Task02] Implementar conciliación documental de tres vías entre orden, recepción y factura
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección E (Brecha E.2) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Prevención de fraudes, sobreprecios, control de egresos y conciliación de tres documentos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`recordAccountsPayableExpense`, nueva función `verifyThreeWayMatch`)
  - `OrdenesCompra`
  - `RecepcionesCompra`
  - `CuentasPorPagarGastos`
- **Dependencias Expuestas:** `OrdenesCompra`, `RecepcionesCompra`, `CuentasPorPagarGastos`, `F18-Task01`
- **Descripción del Alcance:**
  Actualmente, las facturas pueden registrarse sin comparar los importes autorizados en la orden de compra con las cantidades realmente recibidas. Esto permite que se tramiten obligaciones por productos no entregados o por precios diferentes a los aprobados. También se genera una obligación identificada como `FCT-REC-...` al registrar la recepción física, confundiendo el albarán de entrega con la factura fiscal del proveedor.
  Requerimientos Funcionales Detallados:
  1. Motor de conciliación de tres vías (Three-Way Matching):
     - Implementar la función `verifyThreeWayMatch` que compare:
       * Orden de compra: cantidades, precios unitarios y condiciones autorizadas.
       * Recepción: cantidades efectivamente recibidas y aceptadas en bodega.
       * Factura del proveedor: cantidades, precios, impuestos y cargos facturados.
     - Comparar cada partida mediante identificador de producto/servicio, descripción, unidad de medida y relación con la orden.
     - Comparar cantidades pedidas, recibidas, aceptadas y facturadas.
     - Comparar precios unitarios, descuentos, impuestos, transporte y otros cargos, calculando diferencias monetarias y porcentuales.
     - Configurar tolerancias autorizadas parametrizables por concepto (ej. +/- 0.05 Lempiras por redondeo), sin permitir que una tolerancia oculte cantidades no recibidas.
  2. Detección de discrepancias y bloqueos:
     - Detectar facturación de artículos que no aparecen en la orden de compra.
     - Detectar cantidades facturadas superiores a las recibidas y aceptadas en `RecepcionesCompra`.
     - Detectar precios unitarios superiores a los formalmente aprobados en la orden.
     - Detectar diferencias en impuestos, descuentos y cargos adicionales.
     - Permitir facturación parcial cuando corresponda a cantidades realmente recibidas y conformes.
     - Permitir facturas relacionadas con varias recepciones de una misma orden.
     - Bloquear el avance automático al pago cuando existan diferencias no justificadas.
     - Permitir que un responsable autorizado (Director / Administrador) revise y resuelva diferencias mediante aprobación documentada (`DiferenciaAutorizada`).
  3. Desacoplamiento de recepción y factura fiscal:
     - Separar completamente el registro de recepción física del registro de factura fiscal del proveedor.
     - Eliminar la generación automática de facturas ficticias (`FCT-REC-...`) al registrar recepciones; la recepción debe producir su propio documento y movimiento de inventario, sin simular una factura fiscal.
  4. Estados de conciliación:
     - `PendienteConciliacion`, `Conciliada`, `ConDiferencias`, `EnDisputa`, `DiferenciaAutorizada`, `Rechazada`.
- **Criterios de Aceptación:**
  - Registrar una orden de 10 unidades, una recepción de 8 y una factura de 10; el sistema detecta la discrepancia de 2 unidades no recibidas.
  - Registrar una factura por una cantidad superior a la recibida y comprobar que se bloquea su aprobación automática para pago.
  - Registrar un precio unitario superior al autorizado y comprobar que se identifica la diferencia porcentual y absoluta.
  - Registrar una factura parcial que coincide con las cantidades recibidas y verificar que se concilia satisfactoriamente.
  - Registrar una factura con impuestos o cargos diferentes y comprobar que se presenta el desglose detallado de diferencias.
  - La autorización de una discrepancia exige rol directivo autorizado registrando usuario, fecha y justificación.
  - Una recepción de bodega física no crea automáticamente facturas fiscales en `CuentasPorPagarGastos`.
  - Reprocesar la conciliación no duplica obligaciones contables ni asientos en el libro diario.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1209-1249; clave TASK-014; asignación única: Contabilidad -->
### [TASK-014] [X] [F18-Task03] Desarrollar la interfaz operativa completa del módulo de compras
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección E (Brecha E.3) y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Operatividad del usuario, eliminación de dependencia de Sheets y productividad administrativa)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `js/accounting.js` (`renderComprasModule`)
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** `dashboard-contabilidad.html`, `js/accounting.js`, Servicios de compras del backend, `F18-Task01`, `F18-Task02`
- **Descripción del Alcance:**
  La pestaña `compras` en `dashboard-contabilidad.html` presenta únicamente un mensaje de texto estático y no permite operar las funciones de compras desde la plataforma. Las capacidades existentes en el backend no están disponibles mediante una interfaz funcional para los usuarios finales.
  Requerimientos Funcionales Detallados:
  1. Panel principal con indicadores en tiempo real:
     - Solicitudes pendientes y en revisión, cotizaciones en espera, órdenes pendientes de aprobación, órdenes pendientes de entrega, recepciones parciales, facturas pendientes de conciliación, facturas pendientes de pago, cuentas por pagar por vencer, facturas vencidas y contratos por expirar.
  2. Secciones operativas interactivas:
     - Solicitudes de compra (creación, detalle, aprobaciones).
     - Cotizaciones (carga de ofertas, visualización de adjuntos).
     - Comparación y adjudicación de ofertas.
     - Órdenes de compra (emisión, seguimiento de estados, descarga PDF).
     - Recepciones de mercancía (registro de entregas totales y parciales).
     - Directorio de proveedores y contratos.
     - Facturas de proveedores y cuentas por pagar.
     - Seguimiento presupuestario por centro de costo.
  3. Búsqueda, filtros y usabilidad:
     - Búsqueda por identificador, descripción, proveedor, departamento y período.
     - Ordenamiento por fecha, monto y estado.
     - Modales de formulario interactivos con validación de campos obligatorios, mensajes descriptivos de error y confirmación de acciones irreversibles.
     - Deshabilitado preventivo de botones durante llamadas asíncronas para evitar dobles envíos.
     - Adaptación responsiva para pantallas de escritorio, tabletas y móviles.
- **Criterios de Aceptación:**
  - La pestaña `compras` deja de ser estática y renderiza las secciones operativas completas con datos del backend.
  - Un usuario autorizado puede crear, consultar y aprobar solicitudes de compra desde la interfaz.
  - Se pueden registrar cotizaciones, comparar ofertas y adjudicar proveedores visualmente.
  - El responsable de almacén o compras puede registrar recepciones totales y parciales desde la pantalla.
  - Contabilidad puede revisar facturas de proveedores y el resultado de la conciliación de tres vías.
  - Los usuarios sin permisos no pueden ejecutar operaciones mediante llamadas directas.
  - Las operaciones repetidas no generan registros duplicados en el backend.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1250-1280; clave TASK-015; asignación única: Contabilidad -->
### [TASK-015] [X] [F18-Task04] Implementar documentos PDF oficiales para órdenes de compra y ampliar su ciclo de estados
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.3), Sección E y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Formalización contractual de adquisiciones y emisión documental oficial)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`createPurchaseOrder`, `approvePurchaseOrder`, nueva función `generatePurchaseOrderPDF`)
  - `OrdenesCompra`
  - Almacenamiento documental en Google Drive
- **Dependencias Expuestas:** `OrdenesCompra`, Google Drive API, `createPurchaseOrder`, `approvePurchaseOrder`
- **Descripción del Alcance:**
  Las órdenes de compra se almacenan como registros planos en la hoja `OrdenesCompra`, pero no cuentan con un documento oficial descargable en PDF para formalizar y comunicar la adquisición al proveedor. Además, su ciclo de estados es rígido y no representa adecuadamente el envío, aceptación y recepción parcial.
  Requerimientos Funcionales Detallados:
  1. Generación de PDF oficial de Orden de Compra:
     - Implementar la función `generatePurchaseOrderPDF` en `backend/accounting-service/Code.gs`.
     - Estructura formal del documento: membrete y logotipo institucional de New Generation Christian Academy, número correlativo único (`ORD-CMP-...`), fecha de emisión, datos del proveedor (razón social, RTN, dirección, contacto), departamento y solicitante de origen, referencia a la solicitud y cotización aprobadas, tabla detallada de partidas (código, descripción, cantidad, unidad, precio unitario, subtotal), descuentos, desglose de impuestos (ISV 15% cuando aplique / exento), transporte, total general en Lempiras y letras, moneda, condiciones comerciales de pago, dirección y fecha estimada de entrega, y firmas de aprobación de Dirección/Contabilidad.
     - Versionado documental: si se modifica una orden emitida, generar una nueva versión identificable sin sobrescribir el archivo histórico anterior.
  2. Ampliación del ciclo de vida de estados de la orden:
     - Transiciones permitidas: `Borrador` -> `PendienteAprobacion` -> `Aprobada` -> `Emitida` -> `EnviadaProveedor` -> `AceptadaProveedor` / `RechazadaProveedor` -> `PendienteRecepcion` -> `RecibidaParcial` -> `RecibidaTotal` -> `EnDisputa` -> `Cerrada` -> `Cancelada`.
     - Validar que una orden no pueda enviarse al proveedor antes de contar con aprobación formal.
     - Registrar fecha y responsable de cada transición de estado en la bitácora de la orden.
- **Criterios de Aceptación:**
  - Se genera un documento PDF oficial con diseño profesional para toda orden de compra aprobada.
  - Los importes, impuestos y subtotales del PDF coinciden exactamente con los registros de la base de datos.
  - Una modificación de una orden aprobada genera una nueva versión conservando el archivo previo.
  - Se impide enviar al proveedor o emitir una orden que no haya sido formalmente aprobada.
  - Se pueden registrar la aceptación o rechazo formal del proveedor con fecha y motivo.
  - Una orden parcialmente recibida refleja con exactitud el estado `RecibidaParcial`.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1281-1322; clave TASK-016; asignación única: Contabilidad -->
### [TASK-016] [X] [F18-Task06] Ampliar la gestión de cuentas por pagar con abonos, vencimientos y notas de crédito
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.5), Sección E y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Control de tesorería, prevención de pagos duplicados y gestión de notas de crédito)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`recordAccountsPayableExpense`, nuevas funciones `recordSupplierPayment`, `applySupplierCreditNote`)
  - `CuentasPorPagarGastos`
  - `AsientosContables`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `CuentasPorPagarGastos`, `AsientosContables`, `F18-Task02`, `recordAccountingJournalEntry`
- **Descripción del Alcance:**
  El sistema registra obligaciones en `CuentasPorPagarGastos`, pero no dispone de un control suficiente para administrar pagos parciales, saldos pendientes, notas de crédito comerciales de proveedores y programación de vencimientos. Esto dificulta el control de tesorería y aumenta el riesgo de sobrepagos o pagos duplicados.
  Requerimientos Funcionales Detallados:
  1. Registro estructurado de facturas y obligaciones:
     - Almacenar proveedor, número de factura oficial, fecha de emisión, fecha de recepción, fecha de vencimiento, importe original, impuestos, descuentos, total, moneda, saldo pendiente, estado de aprobación, estado de pago, relación con orden y recepción, y documento PDF adjunto.
  2. Pagos parciales y abonos a proveedores:
     - Permitir múltiples pagos asociados a una misma factura en diferentes fechas.
     - Registrar importe, fecha, medio de pago, cuenta bancaria de egreso, número de referencia bancaria y comprobante adjunto.
     - Calcular automáticamente el total pagado y el saldo pendiente de la obligación.
     - Bloquear cualquier intento de registrar un pago superior al saldo pendiente no liquidado.
     - Evitar pagos duplicados por reintentos o referencias bancarias ya utilizadas.
  3. Gestión de notas de crédito comerciales:
     - Registrar notas de crédito emitidas por proveedores por devoluciones de productos, descuentos por pronto pago o correcciones.
     - Asociar la nota de crédito a la factura correspondiente, reduciendo el saldo pendiente de pago.
     - Generar el asiento contable inverso correspondiente por partida doble en `AsientosContables`.
     - Impedir aplicar dos veces la misma nota de crédito.
  4. Programación de vencimientos y estados:
     - Consultar obligaciones por fecha de vencimiento, identificando facturas vencidas, próximas a vencer (7, 15, 30 días) y corrientes.
     - Estados de la obligación: `PendienteRevision`, `PendienteAprobacion`, `AprobadaParaPago`, `PagoParcial`, `Pagada`, `Vencida`, `EnDisputa`, `Anulada`.
     - Bloquear la emisión de pagos para facturas que no hayan superado la conciliación de tres vías (`F18-Task02`).
- **Criterios de Aceptación:**
  - Registrar una factura de proveedor y comprobar que su saldo inicial coincide con el monto total.
  - Aplicar dos pagos parciales consecutivos y verificar que el saldo pendiente disminuye exactamente por los montos pagados.
  - Al completar el 100% del saldo, la factura pasa automáticamente a estado `Pagada`.
  - Aplicar una nota de crédito comercial reduce el saldo pendiente y asienta el ajuste contable.
  - Se bloquea cualquier intento de pagar un monto superior al saldo pendiente de la factura.
  - Las facturas con discrepancias o en disputa quedan bloqueadas para pagos automáticos.
  - Anular un pago revierte el saldo pendiente y el asiento contable sin eliminar el historial.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1323-1355; clave TASK-017; asignación única: Contabilidad -->
### [TASK-017] [X] [F18-Task07] Implementar el compromiso presupuestario formal al aprobar órdenes de compra
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.6), Sección E y Sección G (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Control preventivo del gasto, protección presupuestaria y concurrencia)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`approvePurchaseOrder`, `checkBudgetAvailability`)
  - `PresupuestosInstitucionales`
  - `OrdenesCompra`
- **Dependencias Expuestas:** `PresupuestosInstitucionales`, `OrdenesCompra`, `checkBudgetAvailability`, `LockService`
- **Descripción del Alcance:**
  La disponibilidad presupuestaria se consulta mediante `checkBudgetAvailability`, pero la aprobación de una orden de compra no reserva formalmente el importe correspondiente en el presupuesto. Esto permite que múltiples órdenes concurrentes consuman la misma disponibilidad sin que el sistema detecte el sobregiro en tiempo real.
  Requerimientos Funcionales Detallados:
  1. Reserva atómica del compromiso presupuestario:
     - Al formalizar la aprobación de una orden de compra en `approvePurchaseOrder`, adquirir un candado de script (`LockService.getScriptLock()`) y verificar la disponibilidad presupuestaria real.
     - Si hay disponibilidad, incrementar automáticamente el campo `montoComprometido` en `PresupuestosInstitucionales` para la partida y centro de costo correspondientes.
     - Saldo disponible recalculado: `saldoDisponible = montoAprobado - montoComprometido - montoEjecutado`.
     - Impedir que dos órdenes concurrentes reserven fondos sobre el mismo saldo disponible simultáneamente.
  2. Ciclo de vida y liberación de compromisos:
     - Distinguir claramente: Presupuesto asignado, Importe comprometido (por órdenes aprobadas), Importe ejecutado (por facturas recibidas) e Importe disponible.
     - Al facturar o liquidar la orden, transferir el monto desde `montoComprometido` hacia `montoEjecutado`.
     - Si una orden de compra se cancela o reduce su importe mediante modificación autorizada, liberar inmediatamente el compromiso presupuestario no ejecutado.
     - Permitir autorizaciones extraordinarias de sobregiro presupuestario exclusivamente al rol `Director` o `Administrador`, emitiendo el log estructurado `BUDGET_OVERRUN_ALERT` con justificación obligatoria.
- **Criterios de Aceptación:**
  - Aprobar una orden de compra incrementa de inmediato el `montoComprometido` de la partida presupuestaria.
  - Una segunda orden procesada inmediatamente después consulta el saldo disponible ya descontado.
  - Se bloquea la aprobación de órdenes concurrentes que conjuntamente superen el presupuesto disponible.
  - La cancelación formal de una orden de compra libera el compromiso devolviendo los fondos a disponibilidad.
  - Reducir el importe de una orden ajusta la diferencia en el compromiso de forma trazable.
  - Las autorizaciones de sobregiro quedan auditadas con usuario directivo responsable y motivo.
- **Estado:** [X] Completado

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1400-1460; clave TASK-019; asignación única: Contabilidad -->
### [TASK-019] [X] [F19-Task01] Corrección integral del control de existencias multialmacén
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-02), Sección G (Defecto 1) y Plan de Trabajo F19-01
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad física de inventarios, auditoría por bodega, prevención de saldos inconsistentes y desabastecimiento)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`recordInventoryMovement`, `getInventoryKardex`, `transferInventoryStock`)
  - `InventariosKardex`
  - `AlmacenesUbicaciones`
  - `js/accounting.js`
- **Dependencias Expuestas:** `InventariosKardex`, `AlmacenesUbicaciones`, `recordPurchaseReceipt`. Es la base para las tareas posteriores de transferencias, lotes, valorización y consumo de materiales.
- **Descripción del Alcance:**
  El Kardex calcula el saldo de un artículo considerando los movimientos de todas las ubicaciones indistintamente, sin separar las existencias correspondientes a cada almacén. Esto ocasiona que el saldo de una bodega se mezcle con el de otras, generando información incorrecta sobre las existencias reales en cada instalación.
  Requerimientos Funcionales Detallados:
  1. Cálculo de existencias independiente y multidimensional:
     - Implementar un mecanismo de cálculo de existencias independiente por combinación estricta de:
       * Código del artículo (`itemCodigo`).
       * Almacén (`almacenId` / `sedeCod`).
       * Ubicación física (`ubicacionResponsable` / `ubicacionId`).
       * Lote, cuando corresponda.
       * Número de serie, cuando corresponda.
     - Cada movimiento debe actualizar exclusivamente el saldo de la ubicación física afectada.
  2. Saldos y estados simultáneos de inventario:
     - El sistema debe calcular y mantener simultáneamente en tiempo real:
       * Existencia por ubicación física.
       * Existencia consolidada por almacén.
       * Existencia total institucional.
       * Cantidad reservada (por solicitudes aprobadas no entregadas).
       * Cantidad disponible para consumo (`disponible = existenciaFisica - reservada`).
       * Cantidad en tránsito entre almacenes.
  3. Consultas y filtrado en Kardex:
     - Permitir filtrar por almacén, ubicación, artículo, categoría y período de fechas.
     - Cada fila de movimiento debe conservar: saldo anterior de la ubicación, cantidad del movimiento, saldo posterior de la ubicación, usuario responsable, fecha y hora exacta, documento de origen y referencia del movimiento relacionado (cuando exista).
     - Las ubicaciones deben funcionar como entidades independientes; queda terminantemente prohibido utilizar el último saldo global del artículo como saldo de referencia local.
  4. Bloqueo transaccional y prevención de concurrencia:
     - Incorporar un mecanismo de bloqueo transaccional (`LockService.getScriptLock()`) para evitar que dos operaciones simultáneas consuman las mismas existencias o generen saldos negativos.
  5. Migración y compatibilidad de registros históricos:
     - Los movimientos históricos sin ubicación explícita deben conservarse y asignarse mediante una migración controlada a `Bodega General`, sin duplicar cantidades ni alterar los totales históricos.
  6. Detección automática de inconsistencias:
     - Detectar discrepancias entre el saldo calculado a partir de la suma acumulada de movimientos y el saldo registrado en la última fila del Kardex, permitiendo identificar y auditar los artículos y ubicaciones afectados.
- **Comportamiento Esperado:**
  Si existen 10 unidades de un artículo en Bodega A y 5 en Bodega B, el sistema debe mostrar:
  * Bodega A: 10
  * Bodega B: 5
  * Total institucional: 15
  Si se consumen 3 unidades de Bodega A, el resultado debe ser:
  * Bodega A: 7
  * Bodega B: 5
  * Total institucional: 12 (el movimiento no altera el saldo de Bodega B).
- **Criterios de Aceptación:**
  - Las existencias se calculan independientemente por ubicación física.
  - El consolidado institucional coincide exactamente con la suma matemática de sus ubicaciones.
  - Los consumos en una bodega no afectan los saldos de otras bodegas.
  - Los movimientos simultáneos bajo concurrencia no producen saldos negativos ni duplicaciones.
  - Las transferencias conservan la integridad estricta de las existencias.
  - Los registros históricos mantienen su trazabilidad y cantidades intactas.
  - Los conteos físicos y conciliaciones operan bajo el nuevo modelo por almacén.
  - Los reportes muestran correctamente los saldos individuales por ubicación y el consolidado institucional.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1461-1501; clave TASK-020; asignación única: Contabilidad -->
### [TASK-020] [X] [F19-Task02] Implementación del flujo completo de devolución y recepción de activos bajo custodia
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-06), Sección G (Defecto 2) y Plan de Trabajo F19-02
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Control patrimonial, cierre formal de responsabilidades de custodios, actas de devolución y reasignación de bienes)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`assignAssetCustody`, nueva función `returnAssetCustody`, `getAssetAssignments`)
  - `ActivosPatrimoniales`
  - `AsignacionesActivos`
  - `MantenimientoOrdenes`
  - `js/accounting.js`
- **Dependencias Expuestas:** `ActivosPatrimoniales`, `AsignacionesActivos`, `ROLE_PERMISSIONS`. Requiere el registro de activos y asignaciones de custodia existentes.
- **Descripción del Alcance:**
  La plataforma permite asignar activos a custodios, pero no dispone de un procedimiento formal para registrar su devolución. No existe un historial completo de entrega, recepción, evaluación física, generación de actas de finiquito y liberación del activo para una nueva asignación.
  Requerimientos Funcionales Detallados:
  1. Devolución formal e independiente:
     - Implementar la función `returnAssetCustody` vinculada obligatoriamente a una asignación de custodia activa (`AsignacionesActivos`).
     - Registrar obligatoriamente: activo devuelto, custodio que realiza la entrega, responsable que recibe el activo, fecha y hora de entrega/recepción, ubicación de recepción, estado físico al momento de la devolución, accesorios y componentes entregados, observaciones y evidencias fotográficas o actas adjuntas.
  2. Estados de condición física al reingreso:
     - Registrar estados normalizados: `Nuevo`, `Bueno`, `Regular`, `Dañado`, `Incompleto`, `RequiereReparacion`.
     - Permitir comparar el estado físico registrado durante la asignación inicial con el estado observado durante la devolución.
  3. Gestión de incidencias y mantenimiento automático:
     - Si el activo presenta daños, faltantes o requiere reparación, registrar la incidencia y generar automáticamente la orden de mantenimiento en `MantenimientoOrdenes`.
     - El activo no debe quedar disponible para reasignación mientras se encuentre pendiente de inspección o en mantenimiento.
  4. Preservación histórica y generación de actas:
     - Mantener el historial inmutable de todas las custodias anteriores sin sobrescribir los registros de asignación previos.
     - Generar el acta formal de entrega-recepción que pueda consultarse, imprimirse y exportarse a PDF con identificadores únicos y firmas.
     - Permitir que un activo sea reasignado únicamente cuando su devolución haya sido aceptada formalmente y su estado operativo sea `available`.
- **Comportamiento Esperado:**
  Al seleccionar un activo asignado, el administrador inicia su devolución, inspecciona sus condiciones y registra observaciones. Si el activo está en buen estado, cambia a `available` y queda libre de custodio; si está dañado, cambia a `maintenance` y queda relacionado con su orden de trabajo técnica.
- **Criterios de Aceptación:**
  - Es imposible devolver un activo que no posea una asignación activa previa.
  - Cada devolución queda vinculada persistentemente a su asignación original.
  - Se conserva el historial completo e inalterado de custodios anteriores.
  - Se registra el estado físico de recepción y se documentan faltantes o averías.
  - Los activos dañados no pueden reasignarse como disponibles.
  - Se genera un acta verificable de entrega-recepción descargable en PDF.
  - Se rechazan devoluciones duplicadas de una misma asignación.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1502-1541; clave TASK-021; asignación única: Contabilidad -->
### [TASK-021] [X] [F19-Task03] Validación transaccional de transferencias entre almacenes
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-05), Sección F (PT-04) y Plan de Trabajo F19-03
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Consistencia de traslados físicos, prevención de existencias negativas, atocimidad y control de tránsito)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`transferInventoryStock`, `recordInventoryMovement`)
  - `InventariosKardex`
  - `AlmacenesUbicaciones`
  - Hoja `TransferenciasInventario`
  - `js/accounting.js`
- **Dependencias Expuestas:** `InventariosKardex`, `AlmacenesUbicaciones`, `F19-Task01`
- **Descripción del Alcance:**
  `transferInventoryStock` genera los movimientos de salida y entrada, pero no verifica previamente de forma atómica que el almacén de origen tenga suficientes unidades del artículo solicitado en su ubicación específica.
  Requerimientos Funcionales Detallados:
  1. Validaciones previas indispensables:
     - Validar la existencia disponible en el almacén y ubicación de origen antes de autorizar cualquier movimiento.
     - Comprobar que: el artículo exista en el catálogo, el almacén de origen esté activo, el almacén de destino esté activo, la ubicación de origen corresponda al almacén indicado, la cantidad solicitada sea estrictamente mayor a cero, exista suficiente stock disponible no reservado, el artículo y su unidad de medida sean compatibles con la operación, y que origen y destino no sean idénticos.
  2. Identificador único y correlación documental:
     - Generar un identificador único de transferencia (`TRF-...`) que relacione los movimientos de salida del origen y entrada al destino.
  3. Ciclo de vida y estados de transferencia:
     - `Borrador`, `PendienteAprobacion`, `EnTransito`, `RecibidaTotal`, `RecibidaParcial`, `Rechazada`, `Cancelada`.
     - Para transferencias que requieran confirmación de recepción física, las existencias deben colocarse en estado `EnTransito` y no figurar como disponibles en el destino hasta la confirmación de recepción por el custodio receptor.
  4. Discrepancias en recepción y atomicidad:
     - Permitir registrar diferencias justificadas entre la cantidad despachada y la cantidad efectivamente recibida.
     - Control transaccional y reversión lógica de operaciones fallidas para impedir movimientos huérfanos.
     - Control de concurrencia para evitar transferencias simultáneas que superen las existencias locales disponibles.
- **Comportamiento Esperado:**
  Una transferencia de 10 unidades desde una bodega con 8 unidades disponibles debe ser rechazada inmediatamente antes de registrar cualquier movimiento. Una transferencia válida conserva la trazabilidad desde el despacho en origen hasta la recepción conforme en destino.
- **Criterios de Aceptación:**
  - Se valida el saldo específico de la ubicación de origen antes de operar.
  - No se producen salidas parciales ni saldos negativos por errores de validación.
  - Se registran correctamente las existencias en tránsito entre dependencias.
  - Se confirma la recepción física y se documentan discrepancias.
  - Salida y entrada comparten identificador de transferencia y trazabilidad.
  - No existen movimientos huérfanos bajo fallos o interrupciones de red.
  - Se garantiza integridad y bloqueo transaccional bajo solicitudes concurrentes.
- **Estado:** [X] Completado

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3601-3637; clave TASK-072; asignación única: Contabilidad -->
### [TASK-072] [F29-Task06] [P0] Modelo de Corte Contable y Migración de Saldos Iniciales sin Duplicación
- **Orden de Ejecución:** 6
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importFinancialInitialBalances`, `getStudentAccountStatement`, `reconcileInconsistentDataAndOperations`)
  - Hojas: `SaldosInicialesCorte`, `EstadoCuentaEstudiantes`, `PagosAbonos`
- **Subcapacidades Relacionadas:** F29-04, F29-07, F29-12.
- **Estado de Partida:** Defectuosa.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03].
- **Problema Detectado y Riesgos:**
  La plataforma no diferencia formalmente los saldos iniciales provenientes de un corte contable de las obligaciones históricas que los originaron. Si se importan facturas pendientes y un saldo inicial que ya las representa, el sistema duplica la deuda exigible a las familias (ej. un saldo de L 5,000 se convierte en L 10,000), provocando reclamos y distorsión en los estados financieros.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Entidad formal `SaldosInicialesCorte`:*
     - Columnas: `[saldoCorteId, estudianteId, responsableId, fechaHoraCorte, cuentaContable, concepto, montoDeudor, montoAcreedor, moneda, documentoSoporteRef, usuarioResponsable, estadoAprobacion, conciliadoConMayor]`
  2. *Diferenciación conceptual y política de corte:*
     - Diferenciar estrictamente:
       a) Movimientos históricos importados para consulta archivada.
       b) Obligaciones pendientes reconocidas al momento del corte (`SaldosInicialesCorte`).
       c) Movimientos financieros nuevos generados tras el corte.
     - **Opción Configurable en Plataforma (Política Financiera de Migración):**
       - Modo A (Corte Limpio): El estado de cuenta operativo arranca con el saldo inicial de corte; facturas previas se marcan como `HISTORICO_CERRADO` y no suman pasivo.
       - Modo B (Reconstrucción Completa): Se importan todas las transacciones históricas desde el origen y se calcula el saldo sin generar fila en saldos de corte.
     - Prohibición estricta de computar simultáneamente el saldo consolidado y las facturas históricas abiertas.
  3. *Conciliación con balance contable:*
     - La suma de saldos de corte debe alcanzar una diferencia de L 0.00 respecto a la cuenta de Cuentas por Cobrar del balance de apertura.
  4. *Tratamiento de nómina y obligaciones laborales:*
     - Importar saldos históricos de salarios, deducciones y prestaciones sin generar pagos operativos nuevos.
- **Criterios de Aceptación:**
  - [ ] Un saldo pendiente de L 5,000 no se convierte en L 10,000 al importar también facturas históricas.
  - [ ] Los documentos históricos pueden consultarse sin alterar el saldo operativo vigente.
  - [ ] Los saldos iniciales se aplican una sola vez por cuenta y estudiante.
  - [ ] Los estados de cuenta distinguen claramente movimientos anteriores y posteriores al corte.
  - [ ] La conciliación de saldos iniciales alcanza diferencia de L 0.00 con la contabilidad oficial.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4132-4169; clave TASK-088; asignación única: Contabilidad -->
### [TASK-088] [F30-Task16] [P0] Integración Financiera de Biblioteca, Transporte, Tienda y Cafetería
- **Orden de Ejecución:** 6
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`integrateComplementaryServiceCharge`, `reconcileComplementaryChargesWithLedger`, `validateFamilyCreditLimitExceeded`)
  - Hojas: `CargosEstudiante`, `CreditoFamiliarLimites`, `BibliotecaIncidencias`, `TransporteAsignaciones`, `TiendaOrdenes`, `CafeteriaOrdenes`
- **Subcapacidades Relacionadas:** F30-01, F30-02, F30-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-01) y Sección G.
- **Problema Detectado y Riesgos:**
  Las operaciones de biblioteca (multas por retraso o extravío), transporte (rutas y mensualidades), cafetería y tienda escolar generan registros en sus propios módulos que en ocasiones no se sincronizan automáticamente con el estado de cuenta consolidado del estudiante o apoderado, causando cobros omitidos o conciliaciones contables manuales.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Integración automática con cuentas por cobrar centralizadas:*
     - Toda obligación financiera originada en servicios complementarios debe generar un cargo trazable en `CargosEstudiante`.
     - Metadatos obligatorios: identificador de operación de origen (`origenId`), estudiante/apoderado responsable, concepto detallado, monto, fecha, usuario/proceso originador, estado de autorización y estado de cobranza.
  2. *Servicios cubiertos y reglas de negocio:*
     - Multas de biblioteca por atraso, deterioro o pérdida de ejemplares físicos.
     - Contratación de servicio de transporte escolar ordinario o salidas extracurriculares.
     - Consumos autorizados de cafetería y compras en tienda escolar.
     - Convenios familiares de crédito escolar (`FamilyCreditAuthorization`).
     - Si hay disputa sobre la obligatoriedad de autorización previa del apoderado para consumos menores, permitir configurar el umbral (`MONTO_MAXIMO_CONSUMO_SIN_AUTORIZACION_PREVIA`).
  3. *Control de límites de crédito e idempotencia:*
     - Comprobar saldo disponible del límite de crédito familiar antes de autorizar ventas a crédito.
     - Mecanismos de idempotencia para impedir duplicar cargos ante reintentos de conexión.
     - Capacidad de anular o rectificar cargos generando notas de crédito o reversiones sin borrar el historial.
     - Segregación estricta entre registros operativos y asientos contables para evitar doble contabilización.
     - Herramienta de conciliación periódica entre módulos complementarios y el libro contable de Tesorería.
- **Criterios de Aceptación:**
  - [ ] Una multa registrada en biblioteca genera su cargo financiero correspondiente en el estado de cuenta.
  - [ ] Las contrataciones de transporte generan los cargos periódicos estipulados en la configuración.
  - [ ] Un consumo a crédito que exceda el límite autorizado es bloqueado por el servidor.
  - [ ] Los reintentos de red no duplican cargos ni comprobantes.
  - [ ] Las anulaciones generan contrasientos y actualizan el saldo conservando el historial.
  - [ ] Tesorería puede auditar el origen exacto y detalle de cada cargo complementario.
  - [ ] Los reportes financieros concilian al 100% con los balances operativos de los servicios complementarios.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6686-6721; clave TASK-157; asignación única: Contabilidad -->
### [TASK-157] [ ] [F15-Task04] Sistema de billetera familiar, anticipos y créditos a favor
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.4) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Experiencia de usuario, gestión de anticipos y trazabilidad familiar)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `BilleteraSaldoFavor`
  - `CreditoFamiliarMovimientos`
  - `CargosEstudiante`
  - `PagosAbonos`
  - `js/student.js`
- **Dependencias Expuestas:** `BilleteraSaldoFavor`, `CreditoFamiliarMovimientos`, `CargosEstudiante`, `PagosAbonos`, Portal Familiar
- **Descripción del Alcance:**
  Los excedentes de pagos, anticipos y créditos derivados de devoluciones no cuentan con un sistema de almacenamiento y aplicación estructurado.
  Requerimientos Funcionales Detallados:
  1. Crear la entidad y hoja `BilleteraSaldoFavor` con: `WalletID`, `FamilyID`, `UserIdResponsable`, `SaldoDisponible`, `SaldoReservado`, `Moneda`, `Estado`, `FechaCreacion`, `UltimaActualizacion`.
  2. Crear el libro de movimientos independiente `BilleteraMovimientos` con: `MovimientoID`, `WalletID`, `TipoMovimiento` (`Credito`, `Debito`, `Reserva`, `Reverso`), `Monto`, `SaldoAnterior`, `SaldoNuevo`, `PagoOrigenID`, `CargoDestinoID`, `ReembolsoID`, `Fecha`, `UsuarioResponsable`, `Observaciones`.
  3. Implementar las funciones: `creditFamilyWallet`, `getFamilyWalletBalance`, `getFamilyWalletStatement`, `applyWalletBalanceToCharges`, y `reverseWalletMovement`.
  4. Permitir generar saldo a favor mediante: Sobrepagos, pagos anticipados, devoluciones convertidas en crédito, reasignaciones autorizadas y ajustes administrativos justificados.
  5. Permitir aplicar el crédito: A un hijo específico, a varios hijos de la misma familia, a mensualidades futuras, a cargos extraordinarios o a obligaciones seleccionadas manualmente.
  6. Incorporar preferencias parametrizables para aplicación automática: Aplicar primero a cargos vencidos; aplicar primero a la mensualidad más antigua; aplicar a todos los hijos o al beneficiario seleccionado; exigir autorización antes de utilizar créditos en determinados conceptos.
  7. Mantener un historial completo de aplicaciones y reversos inmutable.
  8. Mostrar el saldo disponible en el portal familiar (`student.js`), diferenciándolo visualmente de los saldos pendientes.
- **Criterios de Aceptación:**
  - Un sobrepago genera crédito en la billetera por el excedente exacto.
  - El saldo disponible de la billetera nunca puede ser negativo.
  - Una aplicación reduce simultáneamente el crédito disponible y la deuda del cargo correspondiente.
  - No se puede consumir dos veces el mismo crédito (protección de concurrencia).
  - Se pueden aplicar fondos a diferentes hijos de la misma familia con autorización válida.
  - Una reversión restituye el saldo original de la billetera.
  - El estado de cuenta familiar refleja con transparencia los movimientos y saldo actual de la billetera.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6722-6759; clave TASK-158; asignación única: Contabilidad -->
### [TASK-158] [ ] [F15-Task05] Liquidación atómica y distribución inteligente de pagos conjuntos multihijo
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.5) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Integridad de saldos entre hermanos y recaudación unificada)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `DistribucionPagosConjuntos`
  - `PagosAbonos`
  - `CargosEstudiante`
  - `MovimientosCajaBancos`
  - `js/student.js`
  - `js/accounting.js`
- **Dependencias Expuestas:** `DistribucionPagosConjuntos`, `PagosAbonos`, `CargosEstudiante`, `ComprobantesPago`, `MovimientosCajaBancos`
- **Descripción del Alcance:**
  El backend permite registrar distribuciones familiares mediante `submitJointFamilyPayment`, pero falta completar el proceso de aprobación y liquidación de todas las obligaciones involucradas como una operación financiera atómica y consistente.
  Requerimientos Funcionales Detallados:
  1. Completar la integración bidireccional entre `submitJointFamilyPayment` y `reviewPaymentVoucher`.
  2. Permitir registrar un único pago familiar que cubra: varios hijos, varios cargos de un mismo hijo, mensualidades de diferentes períodos, cargos extraordinarios y diferentes conceptos de cobro.
  3. Crear una vista de distribución que muestre importe total recibido, asignación por hijo, cargos seleccionados, saldos anteriores, importe aplicado, saldos restantes y excedentes.
  4. Incorporar distribución automática con criterios configurables: primero obligaciones vencidas, cargos más antiguos, prioridad por estudiante o distribución proporcional.
  5. Permitir distribución manual y modificación por el contador previa a la aprobación.
  6. Ejecutar la aprobación de manera atómica: validar distribuciones, verificar estado pendiente de cargos, confirmar coincidencia de importes (+/- 0.01), registrar abonos individuales en `PagosAbonos`, actualizar estado de cargos en `CargosEstudiante`, asentar el movimiento único en `MovimientosCajaBancos` y marcar comprobante como `Aprobado`.
  7. Resiliencia y compensación: si falla alguna operación en una hoja, aplicar compensación idempotente para no dejar pagos a medias.
  8. Permitir transferir excedentes no asignados a la billetera familiar (`BilleteraSaldoFavor`).
  9. Asignar identificador único global de la operación familiar (`PAGO-FAM-...`).
- **Criterios de Aceptación:**
  - Un comprobante familiar puede liquidar cargos de tres o más hijos en una sola acción.
  - Cada abono generado queda vinculado al estudiante y cargo correspondiente en `PagosAbonos`.
  - La suma de los abonos coincide exactamente con el importe distribuido.
  - No se puede aprobar dos veces el mismo comprobante conjunto.
  - Un fallo durante el proceso no deja pagos contabilizados parcialmente.
  - El libro de caja registra una única recepción de dinero por el importe total.
  - La distribución puede consultarse y auditarse en el portal familiar y en el panel contable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6760-6794; clave TASK-159; asignación única: Contabilidad -->
### [TASK-159] [ ] [F15-Task06] Materialización automática de recargos por mora y administración de morosidad
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.3) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Recaudación, incentivo de pronto pago y gestión de morosidad)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `RecargosMoras`
  - `CargosEstudiante`
  - `TarifasPlanPago`
  - `js/accounting.js`
- **Dependencias Expuestas:** `RecargosMoras`, `CargosEstudiante`, `getStudentAccountStatement`
- **Descripción del Alcance:**
  `calculateLateFeesForAccount` calcula recargos proyectados en memoria, pero no los materializa automáticamente como cargos exigibles en `CargosEstudiante`.
  Requerimientos Funcionales Detallados:
  1. Implementar `applyLateFeesBatch` en `backend/accounting-service/Code.gs`.
  2. Permitir configurar reglas por concepto, nivel educativo, grado, año lectivo, días de gracia, porcentaje o cantidad fija, límite máximo y frecuencia de aplicación.
  3. Admitir modalidades parametrizables: recargo único tras vencimiento, porcentual, fijo, periódico o escalonado por antigüedad de deuda.
  4. Crear cargos individuales de mora (`CRG-MORA-...`) vinculados al cargo original.
  5. Registrar fecha de vencimiento original, días de atraso, regla aplicada, base de cálculo, porcentaje e importe generado.
  6. Impedir la duplicación de recargos para un mismo período o mes de cálculo.
  7. Permitir suspender, exonerar o revertir recargos mediante autorización documentada de Dirección.
  8. Incorporar una vista de simulación previa antes de materializar recargos masivos.
  9. Mostrar por separado capital original, recargos acumulados y total adeudado.
  10. Integrar los recargos con los estados de cuenta, reportes de morosidad y distribución de pagos.
- **Criterios de Aceptación:**
  - Un cargo vencido genera el recargo correspondiente una vez agotados los días de gracia.
  - Un cargo pagado dentro del período de gracia no genera recargo por mora.
  - La ejecución repetida no duplica recargos sobre el mismo cargo y período.
  - Los recargos quedan asentados permanentemente en `CargosEstudiante`.
  - Los pagos pueden aplicarse a capital y mora según la política de amortización configurada.
  - Las exoneraciones de mora conservan el historial del importe original y el usuario autorizador.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6795-6828; clave TASK-160; asignación única: Contabilidad -->
### [TASK-160] [ ] [F15-Task07] Desarrollo de la consola administrativa de cobranza, caja y revisión de comprobantes
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.5) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Operatividad de la tesorería escolar y productividad contable)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
  - `backend/accounting-service/Code.gs`
  - `ComprobantesPago`
  - `CargosEstudiante`
  - `PagosAbonos`
- **Dependencias Expuestas:** `dashboard-contabilidad.html`, `js/accounting.js`, `ComprobantesPago`, `reviewPaymentVoucher`
- **Descripción del Alcance:**
  Las secciones `cobrar` y `comprobantes` carecen de una interfaz administrativa completa en `dashboard-contabilidad.html`. La funcionalidad de backend no está aprovechada mediante una consola interactiva.
  Requerimientos Funcionales Detallados:
  1. Panel principal de cobranza con indicadores actualizados: total facturado, total recaudado, total pendiente, total vencido, total en revisión, total de pagos parciales, saldos a favor y cantidad de estudiantes morosos.
  2. Bandeja de comprobantes: listar comprobantes pendientes mostrando estudiante, tutor, fecha, importe, método, banco, referencia, desglose multihijo y estados `Pendiente`, `Aprobado`, `Rechazado`.
  3. Filtros avanzados: por estudiante, tutor, grado, sección, fecha, importe, banco, referencia, estado y año lectivo.
  4. Revisión documental: visor integrado con ampliación y rotación, datos del pago junto al documento, controles de aprobación/rechazo, motivo obligatorio de rechazo y detección de referencias repetidas.
  5. Flujo de aprobación: ejecutar `reviewPaymentVoucher`, mostrar liquidación, generar recibo oficial, actualizar estado de cuenta, notificar al tutor y bloquear doble aprobación.
  6. Gestión de cobranza directa: búsqueda de cuentas, registro de pagos en ventanilla, aplicación de abonos parciales, distribución entre cargos y aplicación de créditos de billetera.
  7. Historial y auditoría: registro de usuario revisor, fecha, motivo y trazabilidad de operaciones.
  8. Usabilidad: interfaz moderna con tablas responsivas, paginación, filtros dinámicos y carga sin refrescar toda la pantalla.
- **Criterios de Aceptación:**
  - El contador puede revisar todos los comprobantes pendientes desde una sola consola sin acceder a Google Sheets.
  - Puede previsualizar la foto o PDF del voucher directamente en la vista.
  - La acción de rechazo exige obligatoriamente un motivo de al menos 10 caracteres.
  - Los pagos conjuntos reflejan a todos los hijos y cargos destinatarios.
  - Los indicadores numéricos del panel coinciden exactamente con los registros del backend.
  - Los usuarios sin rol financiero autorizado no pueden acceder a los controles de aprobación.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6829-6858; clave TASK-161; asignación única: Contabilidad -->
### [TASK-161] [ ] [F15-Task08] Interfaz de configuración de conceptos, tarifas, aranceles y planes de pago
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.1) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Parametrización administrativa y consistencia de tarifas)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
  - `backend/accounting-service/Code.gs`
  - `ConceptosCobro`
  - `TarifasPlanPago`
- **Dependencias Expuestas:** `ConceptosCobro`, `TarifasPlanPago`, `configurePaymentConcept`, `configurePaymentTariff`
- **Descripción del Alcance:**
  Las funciones `configurePaymentConcept` y `configurePaymentTariff` existen en el backend pero carecen de una interfaz gráfica administrativa para gestionar conceptos, tarifas y cuotas.
  Requerimientos Funcionales Detallados:
  1. Administración de conceptos: crear, consultar, modificar y desactivar conceptos definiendo nombre, categoría, tipo de obligación, tratamiento tributario SAR, admisión de becas, pagos parciales, recargos por mora y vigencia.
  2. Administración de tarifas: configurar aranceles por año lectivo, nivel, grado y modalidad; definir importe total, cantidad de cuotas, montos individuales, calendarios de vencimiento y clonación entre años lectivos.
  3. Planes alternativos y convenios: permitir planes de contado vs fraccionados, planes especiales por estudiante o familia y convenios de pago autorizados vinculados a su expediente.
  4. Validaciones de integridad: bloquear montos negativos, cuotas inválidas, tarifas incompletas y vigencias superpuestas contradictorias; impedir modificaciones que alteren cargos históricos ya generados.
  5. Versionado y auditoría: conservar historial de tarifas anteriores, usuario modificador, fecha y justificación.
  6. Interfaz: tablas interactivas, modales de edición, filtros por nivel y vista previa del plan de pago antes de confirmar.
- **Criterios de Aceptación:**
  - Se pueden crear y editar conceptos y tarifas desde el dashboard sin tocar Sheets.
  - Se pueden definir calendarios masivos de cuotas diferenciadas por grado.
  - Se rechazan importes negativos o parámetros inconsistentes.
  - Las modificaciones de tarifas futuras no alteran las obligaciones anteriores ya asentadas.
  - Un plan de pago puede duplicarse hacia un nuevo año lectivo conservando consistencia de IDs.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6859-6893; clave TASK-162; asignación única: Contabilidad -->
### [TASK-162] [ ] [F15-Task09] Integración real de pasarelas de pago y procesamiento de notificaciones externas
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.8) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Automatización de recaudación, pasarelas digitales y seguridad criptográfica)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `IntegracionesPasarelas`
  - `PagosAbonos`
  - `MovimientosCajaBancos`
  - `FacturasFiscales`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `IntegracionesPasarelas`, `handlePaymentGatewayWebhook`, `recordStudentPayment`, HMAC-SHA256
- **Descripción del Alcance:**
  La integración actual dispone de configuraciones y pruebas simuladas de ping, pero no procesa transacciones reales mediante notificaciones asíncronas de pasarelas de pago.
  Requerimientos Funcionales Detallados:
  1. Crear la función `handlePaymentGatewayWebhook` en `backend/accounting-service/Code.gs`.
  2. Arquitectura modular de adaptadores para proveedores bancarios y de pago: BAC Credomatic, Banco Ficohsa (cuando esté disponible), Stripe, PayPal y pasarelas locales compatibles.
  3. Validación de notificaciones externas: identificar proveedor, ID de transacción, autenticidad, importe, moneda, referencia y estado de la operación.
  4. Verificación criptográfica: validar firmas HMAC-SHA256 o tokens del proveedor, timestamps y protección contra repetición de webhooks.
  5. Máquina de estados de transacción: `Iniciada`, `Pendiente`, `Autorizada`, `Aprobada`, `Rechazada`, `Cancelada`, `Reembolsada`, `EnDisputa`.
  6. Procesamiento idempotente: registro de webhook por identificador de evento único para garantizar que una transacción nunca se liquide dos veces y eventos desordenados no corrompan estados definitivos.
  7. Conciliación de comisiones: desglose entre importe bruto pagado por la familia, comisión deducida por la pasarela e importe neto liquidado en banco.
  8. Almacenamiento seguro: credenciales API exclusivamente en variables de script / backend, nunca en el cliente.
  9. Consola administrativa de pasarelas: activación/desactivación, prueba de conexión, log de eventos recibidos y reprocesamiento seguro de fallos.
- **Criterios de Aceptación:**
  - Una transacción aprobada por la pasarela genera automáticamente el pago en `PagosAbonos` y actualiza el saldo.
  - Una transacción rechazada no liquida ninguna obligación.
  - Una notificación sin firma criptográfica válida es rechazada con código de seguridad.
  - Los webhooks repetidos por el proveedor no generan pagos duplicados.
  - Las comisiones se registran por separado del importe bruto pagado.
  - Las credenciales y claves secretas permanecen invisibles en el código del navegador.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6894-6925; clave TASK-163; asignación única: Contabilidad -->
### [TASK-163] [ ] [F15-Task10] Automatización de notificaciones de cargos, vencimientos, pagos y obligaciones familiares
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.9) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comunicación institucional familiar y reducción de morosidad)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `BandejaNotificaciones`
  - `js/student.js`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `BandejaNotificaciones`, `RelacionesFamiliares`, `permisoFinanciero`
- **Descripción del Alcance:**
  No todos los eventos financieros generan comunicaciones automáticas. En particular, la creación de nuevos cargos y vencimientos próximos no están conectados completamente con avisos multicanal a las familias.
  Requerimientos Funcionales Detallados:
  1. Notificaciones automáticas para eventos financieros clave: generación de mensualidad, cargo extraordinario, aviso preventivo de vencimiento, vencimiento acaecido, inicio de mora, recargo aplicado, recepción de comprobante, aprobación de pago, rechazo con motivo, recibo CUV disponible, factura fiscal emitida, acreditación a billetera y reembolsos.
  2. Recordatorios preventivos configurables: disparar avisos automáticos a los 5, 3 y 1 día antes de la fecha límite de pago.
  3. Enrutamiento por permisos: validar `permisoFinanciero` en `RelacionesFamiliares` para que solo los responsables autorizados reciban información financiera de sus hijos.
  4. Canales de comunicación: bandeja interna, correo electrónico y notificaciones push/PWA.
  5. Plantillas y contenido: nombre del estudiante, concepto, período, importe, fecha de vencimiento, saldo pendiente, enlace autenticado y pasos para reportar pago.
  6. Deduplicación y resiliencia: registrar clave de deduplicación (`deduplicationKey`), reintentos seguros y garantía de que una falla en el servidor de correo nunca revierta la transacción financiera.
  7. Preferencias familiares: permitir al tutor definir canales preferidos y consultar el buzón histórico.
- **Criterios de Aceptación:**
  - La generación de una mensualidad genera la notificación al tutor legal con permiso financiero.
  - Los recordatorios preventivos se despachan conforme al cronograma configurado.
  - Un apoderado sin permiso financiero no recibe alertas con montos de saldos.
  - La aprobación o rechazo de un comprobante notifica de inmediato al tutor.
  - Un error temporal de correo no afecta la persistencia del pago registrado en el backend.
  - Los reintentos de notificación no producen mensajes duplicados a la familia.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6926-6958; clave TASK-164; asignación única: Contabilidad -->
### [TASK-164] [ ] [F15-Task11] Sistema analítico de morosidad, antigüedad de saldos y proyección de recaudación
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.7) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Inteligencia financiera, gestión de tesorería y toma de decisiones)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `js/accounting.js`
  - `dashboard-contabilidad.html`
  - `CargosEstudiante`
  - `PagosAbonos`
  - `RecargosMoras`
- **Dependencias Expuestas:** `getAgingAccountsReceivableReport`, `CargosEstudiante`, `PagosAbonos`
- **Descripción del Alcance:**
  No existe un módulo analítico especializado que clasifique la antigüedad de las cuentas por cobrar, compare la morosidad y proyecte el flujo de caja escolar.
  Requerimientos Funcionales Detallados:
  1. Implementar la función `getAgingAccountsReceivableReport` en `backend/accounting-service/Code.gs`.
  2. Clasificación de deuda por antigüedad: No vencida (corriente), 1 a 30 días, 31 a 60 días, 61 a 90 días, y más de 90 días de mora.
  3. Filtros multidimensionales: por año lectivo, nivel educativo, grado, sección, estudiante, responsable, concepto y estado.
  4. Indicadores clave: cartera total por cobrar, monto vencido, no vencido, recargos devengados, porcentaje de morosidad, promedio de días de mora y tasa de recuperación de cartera.
  5. Análisis temporal comparativo: recaudación mensual real vs esperada, evolución intermensual de la morosidad y estacionalidad de cobros.
  6. Proyecciones financieras: flujo de ingresos futuros según calendario de cuotas y modelos de cobranza.
  7. Identificación de riesgos: top de familias con mayor morosidad acumulada, grados con menor tasa de pago y conceptos con mayor rezago.
  8. Exportación estructurada de métricas en pantalla a formatos de reporte gerencial.
- **Criterios de Aceptación:**
  - Los totales de la cartera coinciden con la suma de los estados de cuenta individuales y familiares.
  - La clasificación de antigüedad se calcula exactamente según las fechas de vencimiento de cada cargo.
  - Los pagos parciales reducen de forma transparente los saldos en sus respectivas franjas de antigüedad.
  - Los recargos se desglosan por separado del capital original.
  - La aplicación de filtros no altera los cálculos matemáticos de origen.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6959-6989; clave TASK-165; asignación única: Contabilidad -->
### [TASK-165] [ ] [F15-Task12] Visor avanzado de comprobantes y documentos financieros
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección J (P2)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comodidad operativa, usabilidad y validación de transferencias)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
  - Google Drive
  - `ComprobantesPago`
  - `FacturasFiscales`
- **Dependencias Expuestas:** `ComprobantesPago`, `dashboard-contabilidad.html`, Google Drive API
- **Descripción del Alcance:**
  El sistema almacena los comprobantes en Drive, pero la experiencia de revisión en interfaz carece de herramientas para inspeccionar vouchers con claridad (fotos tomadas con móvil en ángulos difíciles o de baja luz).
  Requerimientos Funcionales Detallados:
  1. Crear un visor modal interactivo integrado en `dashboard-contabilidad.html`.
  2. Soporte nativo para formatos de imagen (PNG, JPG, WEBP) y archivos PDF.
  3. Controles interactivos: zoom in/out, rotación horaria y antihoraria de 90°, ajuste al ancho de pantalla, arrastre/panning, navegación multipágina en PDFs y modo pantalla completa.
  4. Panel lateral contextual: visualizar simultáneamente la imagen del voucher y los metadatos declarados por el apoderado (monto, banco, referencia, fecha, cargos e hijos asociados).
  5. Navegación fluida entre comprobantes pendientes sin cerrar el visor modal.
  6. Preservar intacto el archivo original en Drive (las transformaciones visuales son en el canvas cliente).
  7. Control de permisos y manejo elegante de archivos no disponibles o enlaces rotos.
- **Criterios de Aceptación:**
  - El usuario puede rotar y ampliar imágenes de depósitos bancarios dentro de la misma pantalla.
  - Los comprobantes en formato PDF se visualizan sin necesidad de descargarlos al equipo local.
  - La rotación y ampliación en pantalla no altera el archivo binario almacenado en Drive.
  - El visor opera de manera responsiva en escritorios, tabletas y teléfonos móviles.
  - Un archivo no disponible muestra un mensaje de aviso claro en lugar de una pantalla en blanco.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6990-7021; clave TASK-166; asignación única: Contabilidad -->
### [TASK-166] [ ] [F15-Task13] Ajustes administrativos de cargos, modificaciones de obligaciones y control de retiros
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.2) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Integridad de cargos, sincronización académica y gestión de bajas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `CargosEstudiante`
  - `Matriculas`
  - `DescuentosBecas`
- **Dependencias Expuestas:** `CargosEstudiante`, `Matriculas`, `adjustPendingCharge`
- **Descripción del Alcance:**
  El sistema crea cargos de matrícula pero necesita completar los procedimientos administrativos para ajustar obligaciones pendientes y sincronizar bajas o traslados académicos con las finanzas.
  Requerimientos Funcionales Detallados:
  1. Implementar la función `adjustPendingCharge` en `backend/accounting-service/Code.gs`.
  2. Permitir modificar cargos pendientes: monto base, fecha de vencimiento, concepto y observaciones, conservando su identidad histórica.
  3. Registrar valor anterior, nuevo valor, usuario responsable, fecha y justificación obligatoria.
  4. Bloquear la modificación directa de cargos que ya tengan pagos asociados en `PagosAbonos`.
  5. Sincronización académica ante eventos del alumno: retiro definitivo, traslado, cancelación de matrícula, suspensión y reingreso.
  6. Gestión de retiro: identificar mensualidades futuras no devengadas, bloquear la generación de cargos posteriores a la fecha efectiva de baja y someter a revisión cargos ya emitidos no pagados.
  7. Políticas de liquidación configurables: definir si la mensualidad del mes en curso se cobra completa, proporcional o se exime según la fecha de retiro.
  8. Preservar las obligaciones históricas de períodos anteriores cursados.
- **Criterios de Aceptación:**
  - Un cargo pendiente puede ajustarse registrando el historial completo del cambio.
  - Un cargo pagado o con abonos no puede ser modificado de forma destructiva.
  - El retiro de un estudiante impide la generación de mensualidades posteriores a su fecha efectiva de retiro.
  - Las obligaciones devengadas antes del retiro permanecen registradas en el estado de cuenta.
  - El reingreso del estudiante no duplica las obligaciones previas ni corrompe su saldo histórico.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7022-7051; clave TASK-167; asignación única: Contabilidad -->
### [TASK-167] [ ] [F15-Task14] Administración de becas, descuentos temporales y vencimiento automático de beneficios
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.3) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Control de beneficios económicos y vigencia de becas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `DescuentosBecas`
  - `SolicitudesDescuentoBeca`
  - `CargosEstudiante`
  - `js/accounting.js`
- **Dependencias Expuestas:** `DescuentosBecas`, `SolicitudesDescuentoBeca`, `applyApprovedScholarshipsToCharges`
- **Descripción del Alcance:**
  El motor de becas está implementado en sus funciones principales, pero los beneficios temporales no disponen de un ciclo completo de expiración, renovación y regularización automática de cobros.
  Requerimientos Funcionales Detallados:
  1. Catálogo completo de beneficios: becas completas (100%), parciales, porcentuales, de monto fijo, por mérito, condición socioeconómica, convenio institucional y descuento por hermanos.
  2. Gestión de vigencia: definir fecha de inicio, fecha de expiración y año lectivo de aplicación.
  3. Vencimiento automático: al expirar la vigencia de una beca, suspender su aplicación a nuevos cargos generados sin alterar cargos históricos ni pagos contabilizados.
  4. Renovaciones autorizadas: permitir prorrogar o renovar becas evaluando cumplimiento de condiciones (promedio académico, conducta).
  5. Incompatibilidad de beneficios: validar reglas de no acumulación de descuentos no autorizados.
  6. Reportes institucionales de becas: consolidar total de beneficiarios, monto subsidiado, distribución por grado e impacto en el presupuesto escolar.
- **Criterios de Aceptación:**
  - Las becas vencidas dejan de aplicarse automáticamente a los nuevos cargos generados.
  - Las renovaciones conservan el histórico del beneficio original.
  - Se bloquea la asignación simultánea de becas incompatibles sobre un mismo estudiante.
  - Los importes subsidiados coinciden exactamente con los descuentos aplicados en los cargos.
  - Una beca del 100% deja el arancel neto en 0.00 Lempiras sin generar saldos deudores artificiales.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7052-7081; clave TASK-168; asignación única: Contabilidad -->
### [TASK-168] [ ] [F15-Task15] Reasignación administrativa de pagos y corrección de distribuciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.5) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Flexibilidad operativa y resolución de pagos mal aplicados)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `PagosAbonos`
  - `CargosEstudiante`
  - `DistribucionPagosConjuntos`
  - `BilleteraSaldoFavor`
- **Dependencias Expuestas:** `reassignPaymentAllocation`, `PagosAbonos`, `CargosEstudiante`
- **Descripción del Alcance:**
  El sistema permite registrar pagos, pero no dispone de un procedimiento administrativo controlado para reasignar abonos aplicados al cargo o al estudiante equivocado.
  Requerimientos Funcionales Detallados:
  1. Implementar la función `reassignPaymentAllocation` en `backend/accounting-service/Code.gs`.
  2. Permitir seleccionar: pago original, cargo de origen, cargo de destino, monto a reasignar, justificación obligatoria y usuario autorizador.
  3. Validaciones de seguridad: verificar que el abono exista y esté aplicado; comprobar que el monto no exceda el disponible; validar que el cargo destino exista y pertenezca al mismo estudiante o a un hermano con relación familiar autorizada.
  4. Reversión y reasignación limpia: actualizar el cargo de origen (restituyendo el saldo pendiente) y aplicar al cargo destino sin duplicar el movimiento de ingreso de efectivo en el libro de caja ni alterar el recibo global.
  5. Posibilidad de transferir saldos no reasignados directamente a la billetera familiar.
  6. Auditoría inmutable de la reasignación con registro de diffs contables.
- **Criterios de Aceptación:**
  - Una reasignación de pago no duplica los ingresos en caja ni en reportes contables.
  - El cargo de origen recupera exactamente su saldo pendiente no cubierto.
  - El cargo de destino recibe el abono correspondiente actualizando su estado a `Parcial` o `Pagado`.
  - Se rechaza cualquier intento de reasignar más dinero del efectivamente liquidado en el pago.
  - La operación queda registrada con trazabilidad completa de origen y destino.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7276-7313; clave TASK-174; asignación única: Contabilidad -->
### [TASK-174] [ ] [F17-Task06] Automatizar la deducción de anticipos y préstamos y actualizar su amortización al cerrar la planilla
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección B (B.5), Sección E (Brecha E.5) y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Recuperación de cuentas por cobrar a empleados y consistencia de amortizaciones)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `requestEmployeeLoanAdvance`
  - `approveEmployeeLoanAdvance`
  - `getLoanAmortizationSchedule`
  - `AnticiposPrestamosEmpleado`
  - `calculatePayrollPeriod`
  - `updatePayrollPeriodStatus`
- **Dependencias Expuestas:** `AnticiposPrestamosEmpleado`, `PlanillasNomenclatura`, `F17-Task02`, `F17-Task07`
- **Descripción del Alcance:**
  La plataforma registra anticipos y préstamos, genera tablas de amortización y calcula cuotas, pero no integra automáticamente esas cuotas en la planilla ni actualiza el saldo pendiente en `AnticiposPrestamosEmpleado` después del cierre formal.
  Requerimientos Funcionales Detallados:
  1. Integración automática de cuotas en nómina:
     - Recuperar las obligaciones aprobadas y vigentes de cada empleado en `AnticiposPrestamosEmpleado`.
     - Identificar la cuota correspondiente al período de la planilla e incorporarla automáticamente en `otrasDeducciones` sin captura manual.
     - Distinguir entre anticipos de salario (recuperables en 1 cuota) y préstamos institucionales (amortizables en N cuotas).
     - Validar que el descuento de la cuota nunca exceda el `SaldoPendiente` de la obligación ni deje un salario neto negativo.
  2. Actualización de saldos al cierre:
     - Actualizar la amortización (reducir `SaldoPendiente` e incrementar cuotas pagadas) única y exclusivamente cuando la planilla alcance el estado `Cerrada` o `Aprobada`.
     - Un cálculo preliminar (`Calculada`) no debe reducir el saldo de la obligación.
     - Si una planilla se anula o revierte, restituir automáticamente el saldo pendiente o registrar el reverso compensatorio.
     - Evitar que un mismo préstamo genere dos descuentos dentro del mismo período de pago.
     - Permitir suspender, renegociar o liquidar anticipadamente una obligación mediante autorización documentada.
- **Criterios de Aceptación:**
  - La cuota aprobada de un préstamo se incorpora automáticamente en la nómina del empleado.
  - El saldo del préstamo en `AnticiposPrestamosEmpleado` permanece intacto mientras la planilla esté en estado preliminar `Calculada`.
  - Al cerrar la planilla, el saldo pendiente disminuye exactamente por el valor de la cuota y se actualiza el número de cuotas restantes.
  - La última cuota de amortización ajusta el saldo restante a exactamente 0.00 marcando el préstamo como `Liquidado`.
  - Reintentar o recalcular la planilla no genera deducciones dobles del mismo préstamo.
  - La anulación de una planilla restituye el saldo del préstamo con auditoría inmutable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7314-7350; clave TASK-175; asignación única: Contabilidad -->
### [TASK-175] [ ] [F17-Task07] Implementar un catálogo dinámico de conceptos salariales, reglas de cálculo y ajustes
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección B (B.2) y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Flexibilidad salarial, parametrización de ingresos/deducciones y reglas de negocio)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `PlanillasNomenclatura`
  - `PoliticasFiscales`
  - `dashboard-recursos-humanos.html`
  - `dashboard-contabilidad.html`
  - Nueva hoja `CatalogoConceptosPlanilla`
- **Dependencias Expuestas:** `PlanillasNomenclatura`, `PoliticasFiscales`, `AsientosContables`, `F17-Task01`, `F17-Task03`, `F17-Task04`
- **Descripción del Alcance:**
  `PlanillasNomenclatura` contiene conceptos salariales definidos mediante columnas fijas rígidas. No permite administrar adecuadamente conceptos nuevos, bonificaciones personalizadas, comisiones, deducciones voluntarias ni reglas de cálculo dinámicas.
  Requerimientos Funcionales Detallados:
  1. Catálogo administrable de conceptos de nómina:
     - Crear la entidad y hoja `CatalogoConceptosPlanilla` para crear, editar, activar y desactivar conceptos salariales.
     - Clasificación por categorías: Ingresos ordinarios, Horas extras, Bonificaciones fijas/variables, Comisiones, Incentivos, Deducciones legales, Deducciones voluntarias, Aportaciones patronales, Beneficios y Ajustes extraordinarios.
     - Atributos por concepto: código único, nombre, descripción, naturaleza contable (Debe/Haber), tipo de cálculo (Fijo, Porcentaje, Proporcional, Fórmula), base de cálculo, frecuencia, vigencia, tratamiento tributario ISR (gravado/exento), tratamiento seguridad social IHSS/RAP (cotizable/no cotizable), cuenta contable asociada y visibilidad en boleta de pago.
  2. Secuenciación y reglas de cálculo:
     - Permitir conceptos recurrentes y conceptos de aplicación única.
     - Asignación por empleado individual, por departamento, por cargo o por estructura salarial.
     - Establecer orden o prioridad de cálculo cuando un concepto dependa del resultado de otro.
     - Validar que no existan fórmulas circulares ni referencias a conceptos inexistentes.
     - Conservar el histórico de reglas y evitar que una modificación futura altere planillas históricas cerradas.
- **Criterios de Aceptación:**
  - Se pueden crear y administrar conceptos salariales dinámicos desde la interfaz sin alterar la estructura fija de Sheets.
  - Una bonificación configurada se aplica únicamente a los colaboradores que cumplan las condiciones de elegibilidad.
  - Un concepto configurado como costo patronal se incorpora al asiento contable sin reducir el salario neto del empleado.
  - Los conceptos marcados como no visibles en boleta se procesan para contabilidad sin exponerse al trabajador.
  - Se vincula cada concepto con su respectiva cuenta contable para el asiento automático.
  - Se bloquean fórmulas con dependencias circulares o parámetros incompletos.
  - Desactivar un concepto no altera los registros de planillas cerradas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7384-7420; clave TASK-177; asignación única: Contabilidad -->
### [TASK-177] [ ] [F17-Task09] Implementar la generación masiva y distribución segura de comprobantes de pago
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección B (B.6) y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Entrega de comprobantes de pago, privacidad salarial y comunicación al personal)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`generatePayrollReceiptPDF`, `getStaffPayrollReceipt`)
  - `BoletasPago`
  - `PlanillasNomenclatura`
  - `backend/user-service/Code.gs`
  - Portal de autoservicio del empleado
- **Dependencias Expuestas:** `generatePayrollReceiptPDF`, `BoletasPago`, `sendMultiChannelNotification`, Google Drive
- **Descripción del Alcance:**
  La generación individual de boletas PDF está implementada y verificada, pero no existe un flujo de distribución masiva que permita generar y enviar las boletas de pago a toda la planilla de colaboradores de forma controlada y segura.
  Requerimientos Funcionales Detallados:
  1. Generación y distribución en lote:
     - Seleccionar una planilla en estado `Cerrada` y generar en lote todas las boletas de pago en PDF membretado.
     - Enviar los comprobantes por correo electrónico a la dirección institucional de cada empleado registrado en `Usuarios`.
     - Mostrar vista previa de cantidad de boletas, empleados con correo válido e incidencias por correos faltantes antes del envío masivo.
     - Envío individualizado estricto: garantizar que ningún colaborador reciba la boleta de otro empleado.
  2. Seguridad y privacidad del contenido:
     - Prohibir incluir salarios o datos financieros sensibles en el asunto o cuerpo abierto del correo electrónico.
     - Enlace seguro protegido por token de sesión o archivo PDF adjunto con clave.
     - Registrar estado de distribución de cada comprobante: `Pendiente`, `Enviado`, `Fallido`, `Reintentable`.
     - Permitir reintentar únicamente los envíos que hayan fallado sin duplicar los correos ya entregados exitosamente.
     - Mantener la disponibilidad permanente de descarga histórica de la boleta desde el portal de autoservicio (`getEmployeeSelfServicePortal`).
     - Bloquear la distribución masiva si la planilla no ha sido aprobada y cerrada formalmente.
- **Criterios de Aceptación:**
  - Se pueden generar y despachar todas las boletas de una planilla cerrada con una sola acción administrativa.
  - Cada colaborador recibe exclusivamente su propia boleta de pago.
  - Los empleados sin correo institucional válido quedan listados como incidencias a resolver.
  - Un fallo de conexión en el servidor de correo permite reintentar solo los envíos pendientes sin duplicados.
  - El sistema impide despachar boletas de planillas que permanezcan en estado preliminar `Calculada`.
  - La boleta continúa accesible y descargable desde el portal de autoservicio del empleado.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7421-7456; clave TASK-178; asignación única: Contabilidad -->
### [TASK-178] [ ] [F17-Task10] Incorporar exportación bancaria para dispersión masiva de salarios
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección G y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Eficiencia en tesorería escolar, pagos ACH y automatización bancaria)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `PlanillasNomenclatura`
  - `ContratosLaborales`
  - `ExpedientesLaborales`
  - `AsientosContables`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `PlanillasNomenclatura`, `ExpedientesLaborales`, Datos bancarios de empleados
- **Descripción del Alcance:**
  No existe una función de exportación bancaria que permita preparar y generar archivos estructurados de pago masivo (formato ACH o transferencias interbancarias de Honduras) a partir de una planilla aprobada y cerrada.
  Requerimientos Funcionales Detallados:
  1. Generador de archivos de dispersión de fondos:
     - Seleccionar una planilla en estado `Cerrada` y preparar el archivo de dispersión bancaria para su carga en banca corporativa.
     - Recuperar los salarios netos aprobados y los datos bancarios validados del empleado (banco destino, número de cuenta, tipo de cuenta, DNI/RTN).
     - Formatos estructurados configurables según el banco receptor (ej. BAC Credomatic, Banco Ficohsa, Banco Atlántida o formato estándar ACH).
     - Validación previa: identificar y separar empleados con cuentas bancarias incompletas o inválidas antes de generar el archivo.
  2. Control de tesorería y seguridad:
     - Resumen previo: cantidad de transferencias, importe total a dispersar y empleados excluidos.
     - Evitar que una misma planilla genere archivos de pago duplicados sin una advertencia explícita al operador.
     - Auditoría estricta: registrar quién generó el archivo, timestamp y hash del contenido para conciliar con el extracto bancario.
     - Protección de datos bancarios: limitar la exportación y visualización a roles autorizados (`Contador`, `Director`, `Administrador`).
     - Diferenciar claramente la generación del archivo plano de la confirmación efectiva de las transferencias.
- **Criterios de Aceptación:**
  - La sumatoria de las transferencias del archivo bancario generado coincide exactamente con el total neto de la planilla cerrada.
  - Los colaboradores con datos de cuenta bancaria incompletos se excluyen y se presentan en un reporte de incidencias.
  - El archivo generado respeta las especificaciones técnicas del formato bancario seleccionado.
  - Se bloquea la generación duplicada accidental del mismo lote de pago bancario.
  - Los datos bancarios y salarios netos permanecen estrictamente protegidos bajo permisos RBAC.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7457-7488; clave TASK-179; asignación única: Contabilidad -->
### [TASK-179] [ ] [F17-Task11] Integrar correctamente las obligaciones patronales con la contabilidad por partida doble
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección B (B.7), Sección E y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Consistencia contable, balance por partida doble y provisiones laborales)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`updatePayrollPeriodStatus`, `recordAccountingJournalEntry`)
  - `AsientosContables`
  - `PlanillasNomenclatura`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `recordAccountingJournalEntry`, `AsientosContables`, `PlanillasNomenclatura`, `F17-Task03`, `F17-Task07`
- **Descripción del Alcance:**
  La integración contable actual asienta únicamente salarios brutos (5101), deducciones obreras (2101) y neto por pagar (1101). Al incorporar aportaciones patronales de ley (IHSS, RAP, INFOP) y nuevos conceptos salariales, la integración debe ampliarse para contabilizar el costo patronal institucional completo sin desbalancear la partida doble.
  Requerimientos Funcionales Detallados:
  1. Asiento contable integral de nómina:
     - Conservar el asiento equilibrado existente ampliándolo con líneas contables para aportaciones patronales.
     - Cuentas de Gasto (Debe): Salarios ordinarios (5101), Horas extras y recargos (5102), Aportaciones patronales IHSS (5103), Aportaciones patronales RAP (5104), Aporte patronal INFOP (5105).
     - Cuentas de Pasivo por Pagar (Haber): Retenciones obreras IHSS por pagar (2101), Retenciones obreras RAP por pagar (2102), Retenciones ISR por pagar (2103), Obligaciones patronales IHSS por pagar (2104), Obligaciones patronales RAP por pagar (2105), INFOP por pagar (2106), Préstamos y anticipos por cobrar (1105 - acreditación de saldo), y Sueldos netos por pagar / Bancos (1101).
  2. Verificación de balance y trazabilidad:
     - Validar que la sumatoria total del Debe sea idéntica a la sumatoria del Haber (`Math.abs(totalDebe - totalHaber) <= 0.01`).
     - Vincular el identificador del asiento contable generado (`AST-...`) con el `planillaId` en `PlanillasNomenclatura`.
     - Evitar generar asientos contables duplicados ante reintentos o consultas de estado de la planilla.
     - Manejo de correcciones: si una planilla cerrada se rectifica, generar un asiento de ajuste contable compensatorio documentado sin alterar el asiento original.
- **Criterios de Aceptación:**
  - El asiento contable generado refleja el gasto laboral completo (salarios brutos + aportes patronales) equilibrado contra pasivos y bancos.
  - La sumatoria de débitos y créditos coincide con una tolerancia máxima de 0.01 Lempiras.
  - Las obligaciones patronales incrementan el gasto institucional y no reducen el salario neto de los colaboradores.
  - Reintentar la operación de cierre de planilla no genera un asiento contable duplicado.
  - Los totales contables coinciden exactamente con el resumen de nómina presentado a Recursos Humanos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7489-7520; clave TASK-180; asignación única: Contabilidad -->
### [TASK-180] [ ] [F17-Task12] Mejorar el procesamiento de planillas por lotes y la revisión comparativa de resultados
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección B (B.3) y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Productividad en Recursos Humanos, detección de variaciones y auditoría previa al cierre)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`calculatePayrollPeriod`, `getPayrollPeriodSummary`)
  - `PlanillasNomenclatura`
  - `dashboard-recursos-humanos.html`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `calculatePayrollPeriod`, `getPayrollPeriodSummary`, `F17-Task01`, `F17-Task02`, `F17-Task07`
- **Descripción del Alcance:**
  El ciclo de planilla existe y funciona en su flujo básico, pero carece de capacidades para procesar por lotes segmentados (departamentos, tipos de contrato, frecuencias de pago) y para comparar variaciones atípicas de nómina respecto a meses anteriores antes de la aprobación definitiva.
  Requerimientos Funcionales Detallados:
  1. Procesamiento y segmentación por lotes:
     - Permitir preparar y calcular la planilla filtrando por departamento, cargo, tipo de contrato o modalidad de pago.
     - Visualizar el resumen consolidado de nómina con navegación inmediata hacia el detalle individual de cada colaborador.
     - Contadores de estado: cantidad de empleados incluidos, procesados satisfactoriamente, excluidos por incidencias y pendientes de validación.
  2. Análisis comparativo intermensual de variaciones:
     - Identificar colaboradores con variaciones salariales significativas respecto al mes anterior (ej. variación > 10% en ingresos o deducciones).
     - Mostrar las causas de las variaciones: nuevas horas extras, inicio de amortización de préstamos, cambio salarial de contrato o ausencias.
     - Permitir recalcular únicamente los colaboradores corregidos sin necesidad de procesar nuevamente a toda la plantilla.
     - Comparar dos períodos fiscales cualesquiera mostrando diferencias absolutas y porcentuales por rubro.
- **Criterios de Aceptación:**
  - Se puede calcular y consultar la nómina segmentando por departamentos o categorías de empleados.
  - El sistema detecta y resalta visualmente variaciones atípicas de sueldo neto respecto al mes previo.
  - Se puede consultar el desglose de causas que originaron la diferencia salarial de un colaborador.
  - Los totales individuales suman con exactitud milimétrica el consolidado general de la planilla.
  - La interfaz permite buscar y filtrar colaboradores por nombre, puesto o estado de cálculo sin recargar la pantalla.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7525-7559; clave TASK-181; asignación única: Contabilidad -->
### [TASK-181] [ ] [F18-Task05] Crear una matriz comparativa de cotizaciones y adjudicación por partidas
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.2) y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Optimización de costos, transparencia en compras y adjudicaciones divididas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`submitPurchaseQuotation`, `getPurchaseQuotations`, nueva función `adjudicatePurchaseQuotations`)
  - `CotizacionesCompra`
  - `SolicitudesCompra`
  - `js/accounting.js`
- **Dependencias Expuestas:** `CotizacionesCompra`, `SolicitudesCompra`, `OrdenesCompra`, `F18-Task03`
- **Descripción del Alcance:**
  El sistema permite registrar cotizaciones aisladas, pero no ofrece una comparación estructurada que facilite evaluar simultáneamente las ofertas de varios proveedores. Tampoco existe un mecanismo formal para adjudicar partidas a diferentes proveedores dentro de una misma solicitud.
  Requerimientos Funcionales Detallados:
  1. Matriz comparativa de cotizaciones:
     - Crear una vista comparativa tabular que agrupe todas las cotizaciones vinculadas a una misma solicitud de compra.
     - Comparar simultáneamente hasta 5 proveedores lado a lado (columnas: proveedores; filas: partidas solicitadas).
     - Parámetros comparables: precio unitario, cantidad cotizada, subtotal, descuentos, impuestos, fletes/transporte, total general, tiempo de entrega, condiciones de pago, garantías y cumplimiento de especificaciones técnicas.
     - Identificar visualmente partidas no cotizadas o cotizadas parcialmente por un proveedor.
  2. Adjudicación por partidas y dictamen:
     - Permitir adjudicar toda la compra a un solo proveedor o distribuir partidas entre diferentes proveedores según las mejores condiciones de precio, calidad o disponibilidad.
     - Registrar la justificación de la decisión cuando no se seleccione la oferta de menor precio (criterios técnicos, plazos de entrega urgentes, garantías superiores).
     - Registrar ofertas descartadas y motivos de rechazo.
     - Generar el acta de adjudicación formal con responsables de la evaluación y montos adjudicados.
     - Generar automáticamente las órdenes de compra individuales resultantes para cada proveedor seleccionado sin duplicar solicitudes.
- **Criterios de Aceptación:**
  - Se pueden comparar tres o más cotizaciones de una misma solicitud en una vista consolidada.
  - El sistema detecta y resalta partidas cotizadas parcialmente o no ofertadas por un proveedor.
  - Se pueden adjudicar diferentes partidas de una misma solicitud a proveedores distintos.
  - Las órdenes de compra resultantes conservan los importes, partidas y condiciones adjudicadas.
  - La decisión de adjudicación registra el responsable, fecha y justificación técnica.
  - Una cotización modificada con posterioridad no altera silenciosamente una adjudicación ya aprobada.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7560-7593; clave TASK-182; asignación única: Contabilidad -->
### [TASK-182] [ ] [F18-Task08] Integrar la recepción de compras con el registro de activos fijos
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.4), Sección D y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Control patrimonial institucional, capitalización de bienes y prevención de extravíos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`recordPurchaseReceipt`, `manageAssetItem`, `assignAssetCustody`)
  - `ActivosPatrimoniales`
  - `RecepcionesCompra`
  - `OrdenesCompra`
- **Dependencias Expuestas:** `ActivosPatrimoniales`, `RecepcionesCompra`, `OrdenesCompra`, `F18-Task01`
- **Descripción del Alcance:**
  Existe un registro de activos patrimoniales (`ActivosPatrimoniales`), pero la recepción de una compra de bienes duraderos (computadoras, proyectores, mobiliario, vehículos) no permite completar directamente el registro patrimonial del bien adquirido. Esto obliga a recapturar información manualmente y rompe la trazabilidad entre el activo y su factura/orden de origen.
  Requerimientos Funcionales Detallados:
  1. Identificación y capitalización desde la recepción:
     - Identificar partidas clasificadas como "Bienes Capitalizables / Activos Fijos" en la orden de compra.
     - Permitir iniciar el registro del activo directamente desde la recepción conforme en `RecepcionesCompra`.
     - Precargar automáticamente los datos de la compra: descripción del bien, proveedor, fecha de recepción, costo de adquisición, número de factura y orden de compra.
  2. Registro individualizado de bienes patrimoniales:
     - Registrar categoría patrimonial, marca, modelo, número de serie, ubicación física inicial y custodio asignado (`CustodioUserId`).
     - Si la partida comprende múltiples unidades (ej. 10 computadoras), permitir generar los 10 registros patrimoniales individuales con números de serie independientes.
     - Validar que no existan números de serie duplicados en `ActivosPatrimoniales`.
     - Diferenciar claramente entre bienes capitalizables (activos), consumibles de oficina y materiales inventariables.
     - Prohibir la capitalización de bienes que hayan sido rechazados o devueltos en la recepción.
- **Criterios de Aceptación:**
  - Recibir una compra de bienes capitalizables permite crear los registros en `ActivosPatrimoniales` con un flujo guiado.
  - Cada activo generado conserva su vínculo con la orden de compra, proveedor, recepción y factura.
  - Se pueden ingresar números de serie individuales para compras de múltiples unidades.
  - Se detecta y rechaza el registro de activos con números de serie previamente existentes.
  - Las compras de materiales consumibles no generan activos patrimoniales automáticamente.
  - La consulta del activo permite navegar directamente hacia su expediente de adquisición original.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7594-7631; clave TASK-183; asignación única: Contabilidad -->
### [TASK-183] [ ] [F18-Task09] Ampliar el catálogo de proveedores con contactos múltiples y datos comerciales protegidos
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.1) y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión de proveedores, seguridad de información bancaria y control de pagos ACH)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`registerSupplier`, `manageSupplierContract`)
  - `ProveedoresActivos`
  - `ContratosProveedores`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `ProveedoresActivos`, `ContratosProveedores`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  El catálogo actual almacena únicamente información básica del proveedor (nombre, RTN, teléfono, email, rubro). No contempla múltiples contactos, direcciones diferenciadas ni información bancaria protegida requerida para la dispersión segura de pagos.
  Requerimientos Funcionales Detallados:
  1. Contactos múltiples y direcciones:
     - Permitir registrar varios contactos por proveedor con nombre, cargo, teléfono, correo y área (ventas, cobranzas, soporte, entregas).
     - Identificar un contacto principal y mantener el histórico de contactos reemplazados.
     - Registrar direcciones diferenciadas para facturación fiscal, entrega de mercancía y correspondencia.
  2. Condiciones comerciales:
     - Registrar plazos de crédito (contado, 15, 30, 60 días), moneda comercial, descuentos por pronto pago y tiempos habituales de entrega.
  3. Datos bancarios protegidos (Seguridad financiera):
     - Permitir registrar banco receptor, tipo de cuenta, número de cuenta y beneficiario para pagos por transferencia/ACH.
     - Enmascarar números de cuenta bancaria en listados generales (ej. `****-****-1234`).
     - Restringir la consulta de cuentas completas y su modificación exclusivamente a roles autorizados (`Contador`, `Director`, `Administrador`).
     - Todo cambio en las cuentas bancarias de un proveedor exige autorización documentada y emite un log de auditoría `SUPPLIER_BANK_ACCOUNT_MODIFIED`.
  4. Estados de proveedor y documentos:
     - Estados: `Activo`, `Inactivo`, `Suspendido`, `EnEvaluacion`.
     - Impedir emitir órdenes de compra a proveedores en estado `Suspendido` o `Inactivo`.
- **Criterios de Aceptación:**
  - Se pueden registrar y editar múltiples contactos para un mismo proveedor.
  - Se almacenan direcciones separadas de facturación y entrega física.
  - Los datos bancarios del proveedor están enmascarados y restringidos bajo permisos RBAC estrictos.
  - Modificar una cuenta bancaria genera una entrada de auditoría con usuario, fecha y valor anterior.
  - Se detectan posibles proveedores duplicados al validar el número de RTN (14 dígitos).
  - Un proveedor suspendido queda bloqueado para la emisión de nuevas órdenes de compra.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7632-7666; clave TASK-184; asignación única: Contabilidad -->
### [TASK-184] [ ] [F18-Task10] Implementar el expediente digital unificado de adquisiciones
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.5), Sección D y Sección G (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Trazabilidad 360°, auditoría interna y archivo documental de compras)
- **Archivos Involucrados:**
  - `js/accounting.js`
  - `dashboard-contabilidad.html`
  - `SolicitudesCompra`
  - `CotizacionesCompra`
  - `OrdenesCompra`
  - `RecepcionesCompra`
  - `CuentasPorPagarGastos`
  - `AsientosContables`
- **Dependencias Expuestas:** Vistas de compras, Google Drive, AsientosContables, `F18-Task01`, `F18-Task02`, `F18-Task04`
- **Descripción del Alcance:**
  Los documentos de cada compra se encuentran dispersos en hojas independientes (`SolicitudesCompra`, `CotizacionesCompra`, `OrdenesCompra`, `RecepcionesCompra`, `CuentasPorPagarGastos`). No existe una vista centralizada que permita a los auditores y directores reconstruir la secuencia completa de una adquisición.
  Requerimientos Funcionales Detallados:
  1. Vista centralizada del expediente digital (Trazabilidad 360°):
     - Visualizar en una sola pantalla interactiva la cadena documental completa: Solicitud de compra -> Cotizaciones recibidas -> Matriz comparativa y adjudicación -> Aprobaciones directivas -> Orden de compra PDF -> Confirmación del proveedor -> Recepciones de bodega -> Facturas fiscales -> Conciliación Three-Way -> Pagos aplicados -> Asientos contables automáticos.
  2. Métricas y accesos directos del expediente:
     - Mostrar línea de tiempo con fechas, usuarios responsables y estados de cada etapa.
     - Contadores de control: cantidades pedidas, recibidas, facturadas y pendientes; importes autorizados, facturados y pagados.
     - Enlaces directos para abrir o descargar cada documento probatorio adjunto en Drive.
     - Búsqueda ágil de expedientes por número de solicitud, orden, número de factura o nombre del proveedor.
     - Preservar permanentemente el expediente documental aun cuando la orden haya sido cerrada o cancelada.
- **Criterios de Aceptación:**
  - Al ingresar el número de orden o solicitud se despliega la secuencia completa de documentos relacionados.
  - Se puede navegar fluidamente entre la factura, su recepción de bodega y la orden de compra original.
  - Los totales de cantidades e importes del expediente coinciden exactamente con los documentos individuales.
  - Las órdenes con entregas o facturaciones parciales reflejan con claridad los saldos pendientes.
  - El expediente mantiene protegidos los documentos confidenciales conforme al rol del usuario que consulta.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7671-7723; clave TASK-185; asignación única: Contabilidad -->
### [TASK-185] [ ] [F19-Task04] Motor integral de depreciación y gestión contable de activos fijos
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-12), Sección G (Defecto 3) y Plan de Trabajo F19-04
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Cumplimiento contable institucional, cálculo de vida útil, amortización acumulada y balance patrimonial)
- **Archivos Involucrados:**
  - `ActivosPatrimoniales`
  - `AsientosContables`
  - `backend/accounting-service/Code.gs` (`manageAssetItem`, `getAssetItems`, `registerAssetDisposal`, nuevas funciones `calculateAssetDepreciation`, `getAssetDepreciationSchedule`)
  - Hoja `DepreciacionesActivos`
  - `js/accounting.js`
- **Dependencias Expuestas:** `ActivosPatrimoniales`, `AsientosContables`, `recordAccountingJournalEntry`, Plan de cuentas institucional
- **Descripción del Alcance:**
  Los activos patrimoniales están registrados, pero la plataforma no calcula su depreciación, vida útil restante, depreciación acumulada ni valor neto en libros, ni genera los asientos contables correspondientes en el libro diario.
  Requerimientos Funcionales Detallados:
  1. Ficha financiera completa de activos:
     - Código patrimonial, descripción, categoría contable, fecha de adquisición, fecha de puesta en funcionamiento, costo de adquisición, costos adicionales capitalizables, valor de adquisición total, valor residual estimado, vida útil en años/meses, método de depreciación, fecha de inicio, cuenta contable de activo, cuenta de depreciación acumulada, cuenta de gasto por depreciación, centro de costo o departamento responsable y moneda de registro.
  2. Métodos de depreciación configurables por categoría:
     - Línea Recta: distribución uniforme del importe depreciable durante la vida útil:
       `Importe Depreciable = Costo Capitalizado - Valor Residual`
       `Depreciación Mensual = Importe Depreciable / Vida Útil en Meses`
     - Saldo Decreciente: depreciación calculada sobre el valor en libros pendiente.
     - Unidades de Producción o Utilización: en función del desgaste o uso medible.
     - Políticas configurables por categoría de activo sin forzar un método universal.
  3. Calendario automático de depreciación:
     - Consultar depreciación mensual, anual, acumulada, valor neto en libros, vida útil transcurrida/restante y fecha estimada de finalización.
     - Registro de activos históricos de apertura con depreciación acumulada inicial y valor neto de apertura.
     - Evitar que un activo se deprecie por debajo de su valor residual configurado.
     - Suspender la depreciación en activos retirados, dados de baja o totalmente depreciados.
  4. Generación de asientos contables automáticos por partida doble:
     - Generar el asiento periódico:
       * Débito: Gasto por Depreciación (Centro de costo correspondiente).
       * Crédito: Depreciación Acumulada de Activo Fijo.
     - Validar estrictamente la partida doble (`Math.abs(totalDebe - totalHaber) <= 0.01`).
     - Protección contra contabilización duplicada del mismo período para el mismo activo.
     - Procedimiento de ajuste/reversión que preserve el asiento original en la auditoría.
     - Integración con bajas patrimoniales: al disponer de un activo, calcular su valor neto en libros a la fecha efectiva de baja y reconocer la ganancia o pérdida contable correspondiente.
  5. Reportes patrimoniales y conciliación:
     - Cuadro de depreciación por activo, acumulada por categoría, valor neto patrimonial, activos totalmente depreciados y conciliación entre el inventario patrimonial y el libro mayor.
- **Criterios de Aceptación:**
  - Se calculan correctamente los métodos configurados (línea recta, saldo decreciente, unidades).
  - Las políticas de depreciación son configurables por categoría de activo.
  - Se respeta estrictamente el valor residual como tope mínimo de valor en libros.
  - Se generan calendarios individuales y consolidados en pantalla.
  - Todos los asientos contables generados cumplen estricta partida doble.
  - Se bloquea la contabilización duplicada de un período ya procesado.
  - Se admiten activos adquiridos con anterioridad con saldo inicial de depreciación.
  - Las mejoras capitalizables actualizan la base de cálculo de forma trazable.
  - Las bajas reconocen el valor neto en libros a la fecha de disposición.
  - Los reportes patrimoniales coinciden exactamente con las cuentas contables de balance.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7724-7761; clave TASK-186; asignación única: Contabilidad -->
### [TASK-186] [ ] [F19-Task05] Creación de un catálogo maestro institucional de artículos, materiales y suministros
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-01), Sección G y Plan de Trabajo F19-05
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Estandarización de materiales, prevención de duplicados tipográficos, normalización de unidades de medida y control de adquisiciones)
- **Archivos Involucrados:**
  - Hoja `CatalogoArticulos`
  - `InventariosKardex`
  - `AlmacenesUbicaciones`
  - `MaterialesSolicitudes`
  - `backend/accounting-service/Code.gs` (nuevas funciones `manageCatalogItem`, `getCatalogItems`)
  - `js/accounting.js`
- **Dependencias Expuestas:** `InventariosKardex`, `MaterialesSolicitudes`, `OrdenesCompra`, `F19-Task01`
- **Descripción del Alcance:**
  Los artículos se crean actualmente al vuelo en `InventariosKardex`. Esto provoca que si se ingresa un nombre con pequeñas variaciones tipográficas bajo el mismo código (o códigos distintos para el mismo producto), se originen discrepancias en los reportes de inventario y compras.
  Requerimientos Funcionales Detallados:
  1. Catálogo maestro independiente:
     - Ficha individual de artículo con: `ItemCodigo` (único institucional), `ItemNombre` (normalizado), `Descripcion`, `Categoria`, `Subcategoria`, `UnidadMedida`, `Marca`, `Modelo/Referencia`, `ImagenUrl`, `CodigoBarras`, `CodigoQR`, `EspecificacionesTecnicas`, `ProveedorHabitualId`, `CostoReferencial`, `CostoUltimaAdquisicion`, `CostoPromedio`, `StockMinimo`, `StockMaximo`, `PuntoReposicion`, `Estado` (`Activo`, `Inactivo`), `Observaciones`.
  2. Categorización dinámica y unidades de medida:
     - Categorías configurables sin alterar código: Material didáctico, Útiles escolares, Papelería y oficina, Equipos tecnológicos, Mobiliario, Material de laboratorio, Insumos de enfermería, Productos de limpieza, Cafetería y tienda, Herramientas, Repuestos, entre otros.
     - Unidades de medida configurables (unidad, paquete, caja, litro, galón, kilogramo, gramo, metro, rollo, resma).
     - Conversiones entre unidades compatibles (ej. una caja de 12 unidades se recibe como caja y se distribuye como 12 unidades individuales).
  3. Normalización y prevención de duplicados:
     - Normalización de nombres y códigos, evitando duplicados por diferencias de mayúsculas, tildes o espacios.
     - Búsqueda y sugerencias de artículos similares antes de registrar uno nuevo.
     - Importación y exportación a Excel con validación previa de códigos y unidades.
     - Desactivación lógica de artículos sin eliminar su historial de movimientos.
     - Relación clara con activos fijos cuando proceda, sin confundir consumibles con bienes patrimoniales.
- **Criterios de Aceptación:**
  - Existe el catálogo maestro `CatalogoArticulos` independiente del Kardex.
  - Cada artículo posee un código institucional único no repetible.
  - Las unidades de medida y factores de conversión son configurables.
  - Se detectan y alertan posibles duplicados antes de guardar.
  - Todas las operaciones de Kardex y solicitudes exigen la selección de artículos del catálogo.
  - Los artículos desactivados conservan su historial pero quedan bloqueados para nuevas operaciones.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7762-7802; clave TASK-187; asignación única: Contabilidad -->
### [TASK-187] [ ] [F19-Task06] Programación automática y administración del mantenimiento preventivo recurrente
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-15), Sección C (2.15) y Plan de Trabajo F19-06
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Preservación de infraestructura, continuidad operativa, planificación de intervenciones y prevención de fallas mayores)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`manageMaintenanceOrder`, `getMaintenanceOrders`, nuevas funciones `schedulePreventiveMaintenancePlan`, `getPreventiveMaintenanceAlerts`)
  - Hoja `MantenimientoPlanes`
  - `MantenimientoOrdenes`
  - `ActivosPatrimoniales`
  - `InventariosKardex`
  - `js/accounting.js`
- **Dependencias Expuestas:** `MantenimientoOrdenes`, `ActivosPatrimoniales`, `InventariosKardex`, `F19-Task01`, `F19-Task05`
- **Descripción del Alcance:**
  La plataforma permite crear órdenes preventivas aisladas, pero no administra automáticamente los calendarios de mantenimiento ni calcula cuándo debe ejecutarse la siguiente intervención periódica en base a frecuencias preestablecidas.
  Requerimientos Funcionales Detallados:
  1. Planes de mantenimiento preventivo:
     - Asociar planes a: un activo específico, categoría de activos, instalación, ubicación física o conjunto de equipos.
     - Frecuencias configurables: diaria, semanal, quincenal, mensual, trimestral, semestral, anual, intervalo en días o unidades de uso/horas.
     - Registrar: fecha del último mantenimiento, fecha del próximo mantenimiento, frecuencia, responsable técnico, procedimiento, lista de actividades/checklist, repuestos necesarios, duración estimada, costo presupuestado y tiempo de inactividad previsto.
  2. Generación automática y alertas de vencimiento:
     - Generar automáticamente órdenes de trabajo en `MantenimientoOrdenes` al aproximarse la fecha programada.
     - Alertas preventivas escalonadas (30, 15, 7 y 1 día antes).
     - Al completar la intervención, actualizar la fecha del último mantenimiento y proyectar la nueva fecha según la frecuencia configurada.
     - Posponer intervenciones con justificación obligatoria conservando el historial.
     - Impedir órdenes duplicadas para un mismo ciclo de mantenimiento.
  3. Plantillas de mantenimiento e indicadores:
     - Plantillas estándar por tipo de activo (computadoras, aires acondicionados, vehículos, instalaciones eléctricas, laboratorios).
     - Descuento de repuestos consumidos en Kardex al resolver la orden.
     - Indicadores de cumplimiento: mantenimientos programados vs ejecutados, porcentaje de cumplimiento, costos acumulados y tiempo promedio de resolución.
- **Criterios de Aceptación:**
  - Se pueden configurar planes de mantenimiento con diferentes periodicidades.
  - Las órdenes se generan automáticamente según el cronograma.
  - No se duplican órdenes para un mismo ciclo preventivo.
  - Las fechas se recalculan automáticamente al completar la intervención.
  - Se identifican mantenimientos atrasados con alertas destacadas.
  - Los repuestos utilizados se descuentan de forma exacta en Kardex.
  - Se consultan indicadores de cumplimiento y costos acumulados por activo.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7803-7840; clave TASK-188; asignación única: Contabilidad -->
### [TASK-188] [ ] [F19-Task07] Integración contable de consumos, entregas y movimientos de inventario
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-17), Sección C (2.17) y Plan de Trabajo F19-07
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Control de costos departamentales, exactitud contable en consumo de suministros y seguimiento presupuestario)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`recordInventoryMovement`, `deliverMaterialRequisition`, `createMaterialRequisition`)
  - `AsientosContables`
  - `MaterialesSolicitudes`
  - `InventariosKardex`
  - `js/accounting.js`
- **Dependencias Expuestas:** `MaterialesSolicitudes`, `AsientosContables`, `recordAccountingJournalEntry`, `F19-Task01`, `F19-Task05`
- **Descripción del Alcance:**
  Las entradas de compras están integradas con el inventario, pero los consumos de materiales y las entregas por departamento no generan automáticamente el reconocimiento contable correspondiente en el libro diario.
  Requerimientos Funcionales Detallados:
  1. Centros de costo y destino de consumo:
     - Incorporar departamento responsable y centro de costo en las requisiciones: Dirección, Secretaría, Administración, Docencia, Laboratorio, Biblioteca, Enfermería, Cafetería, Mantenimiento, Deportes, entre otros.
  2. Reglas de contabilización de consumo:
     - Al entregar materiales de bodega mediante `deliverMaterialRequisition`, generar el asiento contable:
       * Débito: Gasto Operativo / Materiales y Suministros (Centro de costo del departamento).
       * Crédito: Inventario de Suministros (Activo Circulante).
     - Diferenciar consumos reales de transferencias internas entre almacenes (las transferencias entre bodegas no generan gastos institucionales).
     - Opción configurable: reconocimiento inmediato como gasto al entregar vs material en tránsito/asignado hasta su consumo efectivo.
  3. Devoluciones, repuestos y prevención de duplicados:
     - Contemplar devoluciones de materiales al almacén con reversión contable por partida doble.
     - Imputar los repuestos de órdenes de mantenimiento al departamento solicitante.
     - Evitar asientos duplicados bajo reintentos o reprocesos de solicitudes.
- **Criterios de Aceptación:**
  - Toda entrega de materiales cuenta con departamento y centro de costo asignado.
  - Se genera el asiento contable balanceado en `AsientosContables` al confirmar la entrega.
  - Las transferencias entre almacenes no originan asientos de gasto.
  - Las devoluciones de insumos revierten el gasto e incrementan el inventario contable.
  - Los asientos cumplen estricta partida doble (`totalDebe === totalHaber`).
  - No se generan contabilizaciones duplicadas por reintentos.
  - Se concilia el consumo físico en Kardex con el saldo de las cuentas de mayor contable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7841-7879; clave TASK-189; asignación única: Contabilidad -->
### [TASK-189] [ ] [F19-Task08] Implementación de un sistema integral de valoración económica del inventario
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-19) y Plan de Trabajo F19-08
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Valuación de existencias, estados financieros precisos, métodos PEPS/Promedio y auditoría contable)
- **Archivos Involucrados:**
  - `InventariosKardex`
  - `CatalogoArticulos`
  - `AsientosContables`
  - `backend/accounting-service/Code.gs` (`getInventoryKardex`, `recordInventoryMovement`, nueva función `getValuatedInventoryReport`)
  - `js/accounting.js`
- **Dependencias Expuestas:** `InventariosKardex`, `CatalogoArticulos`, `AsientosContables`, `F19-Task01`, `F19-Task05`
- **Descripción del Alcance:**
  La plataforma permite consultar existencias físicas en unidades, pero no dispone de un sistema completo para determinar el valor monetario del inventario ni generar informes de valoración financiera por almacén, artículo y categoría contable.
  Requerimientos Funcionales Detallados:
  1. Métodos de valoración configurables:
     - PEPS (FIFO): identificar capas de adquisición y consumir primero las existencias de mayor antigüedad.
     - Costo Promedio Ponderado: recalcular el costo medio unitario tras cada entrada de compra valorizada.
     - Permitir asignar el método de valoración por categoría de artículo según las políticas institucionales.
  2. Trazabilidad de costos y transferencias:
     - Registrar el costo unitario de cada entrada vinculado a su orden de compra o factura.
     - Los traslados entre bodegas deben conservar el costo contable del inventario transferido.
     - Los ajustes por conteo físico deben reconocer el efecto económico monetario de sobrantes o faltantes.
  3. Informes y conciliación económica:
     - Consultar a cualquier fecha de corte: cantidad disponible, costo unitario, valor total por artículo, por almacén, por categoría y total institucional.
     - Conciliación entre el auxiliar valorizado de inventario y las cuentas de activo realizable del libro mayor.
     - Exportación a Excel y PDF con sumatorias matemáticas verificadas.
     - Prohibir alteraciones retroactivas de costos históricos sin procedimiento de ajuste trazable.
- **Criterios de Aceptación:**
  - Se encuentran operativos los métodos PEPS y costo promedio ponderado.
  - Las salidas de almacén reconocen el costo exacto según el método asignado.
  - Las transferencias entre almacenes conservan el valor contable de los bienes.
  - Los ajustes por conteo físico reflejan con precisión su impacto económico.
  - Se generan reportes de inventario valorizado a fechas históricas de corte.
  - Los totales valorizados coinciden con los balances contables de inventario.
  - Se exportan informes estructurados a Excel y PDF sin discrepancias.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7880-7915; clave TASK-190; asignación única: Contabilidad -->
### [TASK-190] [ ] [F19-Task09] Implementación de reservas, disponibilidad y reposición inteligente de materiales
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-04, F19-10) y Plan de Trabajo F19-09
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Continuidad operativa, abastecimiento oportuno, prevención de sobrecompras y gestión de compromisos)
- **Archivos Involucrados:**
  - `CatalogoArticulos`
  - `MaterialesSolicitudes`
  - `InventariosKardex`
  - `backend/accounting-service/Code.gs` (`createMaterialRequisition`, `deliverMaterialRequisition`, `createPurchaseRequest`, nueva función `getInventoryReplenishmentSuggestions`)
  - `js/accounting.js`
- **Dependencias Expuestas:** `CatalogoArticulos`, `MaterialesSolicitudes`, `InventariosKardex`, `F19-Task01`, `F19-Task05`
- **Descripción del Alcance:**
  Aunque existen existencias mínimas y alertas de stock bajo, el sistema no diferencia las cantidades físicas de las comprometidas mediante solicitudes pendientes, ni dispone de un motor de planificación y reposición de compras.
  Requerimientos Funcionales Detallados:
  1. Segregación de estados de existencias:
     - Mantener en tiempo real: Existencia física, Existencia reservada, Existencia disponible, Existencia pendiente de recepción (órdenes de compra emitidas) y Existencia en tránsito.
     - Al aprobar una solicitud de material, reservar las unidades sin descontarlas físicamente del Kardex hasta su entrega real.
     - Liberar automáticamente las reservas al cancelar, rechazar o modificar la requisición.
     - Bloquear solicitudes que pretendan comprometer más unidades de las disponibles.
  2. Motor inteligente de reposición:
     - Puntos de reposición configurables por artículo y almacén (`StockMinimo`, `StockMaximo`, `StockObjetivo`).
     - Cálculo de la cantidad sugerida considerando: disponible, reservada, consumo promedio histórico, tiempo de entrega de proveedores y pedidos en tránsito.
     - Convertir sugerencias de reposición en solicitudes internas de compra (`createPurchaseRequest`) con un solo clic.
     - Indicadores de rotación de existencias, consumo promedio y días de cobertura estimados.
     - Evitar generar sugerencias duplicadas si ya existe una orden de compra en trámite que cubra la necesidad.
- **Criterios de Aceptación:**
  - Las reservas de material no alteran las existencias físicas hasta la entrega en almacén.
  - El sistema impide comprometer más unidades de las existencias disponibles reales.
  - La cancelación de solicitudes aprobadas restituye inmediatamente las existencias a disponibilidad.
  - Las sugerencias de reposición descuentan las compras en tránsito evitando sobrecompras.
  - Las sugerencias pueden convertirse en solicitudes de compra internas sin alterar órdenes aprobadas.
  - Se identifican oportunamente artículos con exceso de existencias y artículos con riesgo de quiebre.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8172-8198; clave TASK-200; asignación única: Contabilidad -->
### [TASK-200] [ ] [F21-Task13] Facturación automática de servicios y cargos recurrentes en estados de cuenta
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-44), Sección C (1.16) y Plan de Implementación TAREA 12
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Automatización de cobros mensuales, integridad financiera y conciliación de servicios)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`assignStudentTransport`, nueva función `generateTransportMonthlyCharges`)
  - `TransporteAsignaciones`
  - `CargosEstudiante`
  - `ConceptosCobro`
- **Dependencias Expuestas:** `TransporteAsignaciones`, `CargosEstudiante`, `ConceptosCobro`, `F21-Task01`
- **Descripción del Alcance:**
  La contratación de transporte no está vinculada con la generación automática de cargos en los estados de cuenta estudiantiles.
  Requerimientos Funcionales Detallados:
  1. Tarifas y cargos recurrentes:
     - Asociar a cada ruta su tarifa mensual según modalidad (completa ida/vuelta vs media tarifa).
     - Generar automáticamente los cargos mensuales en `CargosEstudiante` para las asignaciones activas.
     - Prorrateo automático en altas o cancelaciones a mitad de mes.
     - Prevención estricta de cargos duplicados mediante clave idempotente (`TRN-MES-AÑO-ESTUDIANTE`).
     - Al cancelar el servicio, detener la facturación de los períodos posteriores.
- **Criterios de Aceptación:**
  - Asignar transporte genera el cargo correspondiente en el estado de cuenta mensual.
  - Reprocesar la facturación no duplica cargos del mismo mes.
  - Cancelar el servicio detiene los cobros futuros de manera transparente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8300-8322; clave TASK-205; asignación única: Contabilidad -->
### [TASK-205] [ ] [F21-Task18] Administración centralizada de tarifas, contratos y condiciones de servicios
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.16) y Plan de Implementación TAREA 17
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Políticas tarifarias configurables, vigencias contractuales y descuentos institucionales)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - Hoja `ServiciosTarifas`
  - `CargosEstudiante`
- **Dependencias Expuestas:** `ConceptosCobro`, `CargosEstudiante`, `F21-Task13`
- **Descripción del Alcance:**
  Las tarifas de transporte y servicios están dispersas en código sin un catálogo maestro configurable con fechas de vigencia y condiciones comerciales.
  Requerimientos Funcionales Detallados:
  1. Catálogo maestro de tarifas:
     - Definir tarifas por servicio, modalidad, ruta, período y vigencias de fecha.
     - Configurar descuentos por hermanos, becas y reglas de cobro por alta o baja a mitad de período.
     - Un cambio de tarifa para un ciclo futuro nunca debe modificar cargos de períodos ya cerrados.
- **Criterios de Aceptación:**
  - Se administran tarifas con vigencia desde el panel contable.
  - Los cargos históricos permanecen inalterables ante cambios de tarifas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8425-8450; clave TASK-210; asignación única: Contabilidad -->
### [TASK-210] [ ] [F21-Task31] Consolidación de cafetería y tienda con estados de cuenta familiares
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección C (1.14) y Plan de Implementación TAREA 30
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Consolidación financiera, prevención de doble cobro y conciliación de consumos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processFamilyCreditPurchase`, `createCafeteriaOrder`, `createStoreOrder`)
  - `CafeteriaPedidos`
  - `TiendaOrdenes`
  - `CargosEstudiante`
- **Dependencias Expuestas:** `CafeteriaPedidos`, `TiendaOrdenes`, `CargosEstudiante`, `F15-Task01`
- **Descripción del Alcance:**
  La cafetería, tienda y crédito familiar operan correctamente pero falta consolidar sus consumos con la facturación institucional para evitar discrepancias o dobles cobros.
  Requerimientos Funcionales Detallados:
  1. Consolidación financiera de consumos:
     - Conservar las reglas de crédito familiar autorizadas por PIN de tutores.
     - Vincular cada consumo con el estudiante y responsable financiero.
     - Consolidar los cargos en el estado de cuenta escolar impidiendo que una compra ya deducida del crédito familiar vuelva a generar un cargo manual en colegiatura.
     - Gestionar anulaciones y devoluciones con reversión del saldo de crédito familiar.
- **Criterios de Aceptación:**
  - Toda compra autorizada se asienta una sola vez en el estado de cuenta o crédito familiar.
  - Se impiden cobros duplicados por el mismo consumo.
  - Los reportes de ventas coinciden exactamente con los movimientos registrados.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9572-9642; clave TASK-245; asignación única: Contabilidad -->
### [TASK-245] [F25-Task04] [P1] [Pasarelas de Pago - Recepción Autenticada de Webhooks de Pasarelas de Pago]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - Hojas `IntegracionesPasarelas`, `EventosWebhooksPasarelas`, `MovimientosCajaBancos`, `CargosEstudiante`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** Configuración de pasarelas existente (`configureGatewayIntegration`), seguridad HMAC, contratos API y modelo de cuentas por cobrar.
- **Capacidades Relacionadas:** F25-011, F25-015, F25-016.
- **Problema que Resuelve:**
  La plataforma permite configurar pasarelas y realizar pruebas sintéticas de conexión, pero no dispone de un mecanismo completo para recibir y procesar notificaciones asíncronas de los proveedores. Sin esta capacidad, una transacción puede completarse en el proveedor externo sin que la plataforma reciba y procese automáticamente su resultado.
- **Requisitos Funcionales:**
  1. Implementar un receptor de eventos externos (`handlePaymentGatewayWebhook`) para procesar notificaciones de las pasarelas configuradas.
  2. Adaptador específico por proveedor (tarjetas, transferencias bancarias, pasarelas locales e internacionales).
  3. Recepción de eventos:
     - Recibir solicitudes HTTP POST del proveedor externo.
     - Identificar la pasarela de origen mediante endpoint o payload.
     - Identificar el tipo de evento (`payment.succeeded`, `payment.failed`, `charge.refunded`).
     - Identificar la transacción externa única.
     - Validar la autenticidad del mensaje.
     - Interpretar su contenido y registrar la recepción.
     - Determinar si el evento ya fue procesado previamente.
     - Enviar el evento a procesamiento financiero seguro.
  4. Validación de autenticidad:
     - Verificar firmas criptográficas (HMAC-SHA256 / RSA) según especificación del proveedor.
     - Validar secretos o tokens de autenticación compartidos.
     - Comprobar los encabezados requeridos (Timestamp, Signature).
     - Validar la integridad del contenido recibido.
     - Verificar correspondencia con la integración registrada en `IntegracionesPasarelas`.
     - No utilizar una simple comparación de parámetros del cliente como confirmación de pago.
  5. Idempotencia obligatoria:
     - Cada evento debe tener una referencia externa única o clave de idempotencia.
     - Evitar doble registro de pago, doble aplicación a cuentas por cobrar, doble actualización de saldo, doble notificación o doble asiento contable.
  6. Procesamiento financiero:
     - Relacionar transacción externa con referencia de pago interna y estudiante/responsable.
     - Validar importe, moneda y fecha efectiva.
     - Distinguir estados: `Pendiente`, `Confirmado`, `Rechazado`, `Cancelado`, `Reembolsado`, `En disputa`, `Pendiente de conciliación`.
     - No considerar pago confirmado hasta superar validaciones de autenticidad, importe y estado.
  7. Reintentos y eventos fuera de orden:
     - Manejar reenvíos del proveedor sin duplicar operaciones.
     - Manejar eventos recibidos fuera de orden o incompletos.
     - Conservar todos los eventos recibidos en `EventosWebhooksPasarelas` para auditoría y recuperación.
- **Cambios Necesarios:**
  1. Incorporar la recepción de webhooks en `doPost` de `accounting-service`.
  2. Implementar un adaptador para cada proveedor soportado.
  3. Incorporar verificación de firmas criptográficas.
  4. Crear hoja `EventosWebhooksPasarelas` para persistir eventos crudos.
  5. Implementar control de idempotencia estricto por `transaccionExternaId`.
  6. Relacionar eventos con cargos en `CargosEstudiante`.
  7. Incorporar validación de importe, moneda y referencia antes de liquidar.
  8. Registrar movimientos financieros confirmados en `MovimientosCajaBancos`.
  9. Incorporar estados de procesamiento y cola de recuperación.
  10. Integrar el resultado con las herramientas de conciliación bancaria existentes.
- **Comportamiento Esperado:**
  Cuando una pasarela confirme una transacción, la plataforma debe recibir el evento, verificarlo, identificar la operación interna y actualizar su estado de manera controlada.
  Si la notificación no puede verificarse o no coincide con la transacción esperada, debe quedar pendiente de revisión y no modificar los saldos financieros.
- **Criterios de Aceptación:**
  - [ ] Recibir un evento válido desde un entorno de pruebas de pasarela y procesarlo exitosamente.
  - [ ] Rechazar inmediatamente peticiones con firma inválida o adulterada (401/403).
  - [ ] Rechazar eventos correspondientes a una integración desconocida o deshabilitada.
  - [ ] Repetir el mismo evento y comprobar que no se duplica el pago ni la liquidación de saldos.
  - [ ] Probar importes y monedas diferentes a los registrados y verificar marcación como conflicto.
  - [ ] Probar referencias inexistentes y comprobar encolamiento para revisión manual.
  - [ ] Probar eventos de pago rechazado, cancelado y reembolsado actualizando el estado correspondiente.
  - [ ] Probar eventos recibidos fuera de orden sin corromper la máquina de estados financiera.
  - [ ] Interrumpir el procesamiento y verificar que el evento puede recuperarse desde la bitácora.
  - [ ] Comprobar que la recepción no modifica saldos antes de validar íntegramente la transacción.
  - [ ] Verificar que cada evento queda asociado a su transacción interna y comprobante.
  - [ ] Comprobar que las operaciones financieras resultantes mantienen su trazabilidad contable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10450-10475; clave TASK-270; asignación única: Contabilidad -->
### [TASK-270] [F29-Task18] [P1] Migración Histórica de Contabilidad, Cuentas por Cobrar y Obligaciones Administrativas
- **Orden de Ejecución:** 18
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importAccountingHistoricalLedger`)
  - Hojas: `PlanCuentasContables`, `MovimientosCajaBancos`, `SaldosInicialesCorte`
- **Subcapacidades Relacionadas:** F29-07, F29-18.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03], [F29-Task06], [F29-Task13].
- **Problema Detectado y Riesgos:**
  La migración contable carece de homologación del plan de cuentas y de trazabilidad entre facturas históricas, abonos parciales y el balance de apertura.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Homologación de cuentas contables y terceros:*
     - Mapear plan de cuentas legado con el catálogo estándar de la institución.
     - Conservar números originales de facturas, recibos y referencias bancarias.
  2. *Integración con el modelo de corte:*
     - Importar saldos de cuentas por cobrar y por pagar integrados con `SaldosInicialesCorte`.
     - Los movimientos históricos pueden consultarse sin duplicar saldos operativos.
- **Criterios de Aceptación:**
  - [ ] Los saldos iniciales contables coinciden con el balance de apertura aprobado.
  - [ ] Las facturas y pagos históricos conservan sus referencias y archivos de soporte asociados.
  - [ ] Se previene cualquier duplicación de obligaciones activas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12291-12322; clave TASK-332; asignación única: Contabilidad -->
### [TASK-332] [F38-Task08] [P1] Guía interactiva especializada para conciliación bancaria
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 8 (Orientación guiada en procesos contables de alta complejidad)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getHelpGuidesCatalog`)
  - `js/ui-common.js`, `js/accounting.js`
  - Dashboard: `dashboard-contabilidad.html`
- **Subcapacidades Relacionadas:** F38-12, F38-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-12), Matriz CAR-F38-12 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La conciliación bancaria asistida es una operación crítica que requiere comprender la correspondencia entre extractos bancarios externos y asientos contables internos (`MovimientosCajaBancos`). La falta de una guía paso a paso incrementa el riesgo de conciliaciones erróneas, duplicación de movimientos o cuadres forzados.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura secuencial de la guía (`GUIDE-ACCOUNTING-RECONCILIATION`):*
     - *Paso 1: Preparación:* Selección de cuenta bancaria, período, identificación de saldos iniciales/finales y fecha de corte.
     - *Paso 2: Comprensión de Movimientos:* Diferenciar cargos, abonos, referencias, fechas e importes.
     - *Paso 3: Coincidencias:* Explicar coincidencia exacta vs sugerida por referencia y monto (dentro de tolerancia 0.01).
     - *Paso 4: Movimientos sin Coincidencia:* Procedimiento ante comisiones bancarias o transferencias no registradas en libros.
     - *Paso 5: Duplicados y Diferencias:* Identificación del saldo pendiente de conciliar y advertencias ante discrepancias no resueltas.
     - *Paso 6: Finalización y Consecuencias:* Explicar el impacto de cerrar la conciliación en el libro banco y advertir que modificar movimientos conciliados afecta saldos históricos.
  2. *Integración con el catálogo y permisos:*
     - Registrar la guía en `getHelpGuidesCatalog` restringida a los roles `Contador`, `Subdirector` y `Director`.
- **Criterios de Aceptación:**
  - [ ] La guía de conciliación está disponible directamente desde el módulo bancario de Contabilidad.
  - [ ] Cada paso corresponde a los controles reales del panel financiero.
  - [ ] El usuario distingue con claridad entre asociar un movimiento y crear un asiento de ajuste.
  - [ ] Se advierten las consecuencias contables antes de cerrar una conciliación oficial.
  - [ ] La guía no permite ejecutar operaciones fuera de los permisos del rol activo.
- **Dependencias:** F38-Task02, F38-Task06.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13032-13046; clave TASK-356; asignación única: Contabilidad -->
### [TASK-356] [ ] [F11-Task16] Ampliar los reportes contables, balance de comprobación y estado de resultados
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área IV (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Informes financieros)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** LibroMayor, ReportesFinancieros
- **Descripción del Alcance:**
  Generar estados financieros consolidados (Balance General, Estado de Resultados, Libro Diario, Libro Mayor) filtrados por período y ejercicio fiscal.
- **Criterios de Aceptación:**
  - Los reportes financieros concuerdan exactamente con las sumas de los asientos contables registrados.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13082-13111; clave TASK-359; asignación única: Contabilidad -->
### [TASK-359] [ ] [F15-Task16] Fortalecimiento de idempotencia, concurrencia y consistencia de operaciones financieras
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección H (H.2, H.3) y Sección J (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media-alta (Integridad financiera, prevención de condiciones de carrera y persistencia de idempotencia)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `PagosAbonos`
  - `ComprobantesPago`
  - `FacturasFiscales`
  - `MovimientosCajaBancos`
  - `BancosConciliaciones`
- **Dependencias Expuestas:** `CacheService`, `LockService`, `checkAndRegisterIdempotencyKey`
- **Descripción del Alcance:**
  La plataforma cuenta con mecanismos de idempotencia en memoria de 300 segundos (`CacheService`) y candados de script, pero requiere controles persistentes adicionales para evitar aprobaciones duplicadas ante concurrencia extrema o inconsistencias entre hojas relacionadas.
  Requerimientos Funcionales Detallados:
  1. Aprobación única en `reviewPaymentVoucher`: si el comprobante ya está `Aprobado`, rechazar explícitamente con mensaje amigable; si está `Rechazado`, exigir reapertura formal; si está siendo procesado por otro usuario, bloquear la concurrencia.
  2. Idempotencia persistente: complementar el caché de 300s registrando las claves de idempotencia financieras en una estructura persistente para operaciones críticas.
  3. Protección atómica integral: proteger con candado la asignación de números de recibo CUV, correlativos de facturación SAR, saldos de billetera y liquidación de cargos multihijo.
  4. Verificador de consistencia referencial: escáner para detectar pagos sin cargo asociado, cargos pagados con saldo pendiente o movimientos de caja desalineados.
  5. Registro estructurado de intentos duplicados y conflictos de concurrencia en `EventosSistema`.
- **Criterios de Aceptación:**
  - Una solicitud de aprobación enviada simultáneamente por dos contadores se procesa exactamente una sola vez.
  - La reutilización de una clave de idempotencia con parámetros distintos es rechazada inmediatamente.
  - Una caída de conexión durante una liquidación compuesta recupera el estado consistente sin duplicar abonos.
  - Las consultas administrativas permiten detectar cualquier inconsistencia en la correspondencia de saldos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13112-13138; clave TASK-360; asignación única: Contabilidad -->
### [TASK-360] [ ] [F15-Task17] Correcciones fiscales, notas de corrección y trazabilidad documental
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.6) y Sección J (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Trazabilidad fiscal, cumplimiento SAR y corrección de documentos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `FacturasFiscales`
  - `NotasCreditoFiscales`
  - `ComprobantesPago`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `FacturasFiscales`, `NotasCreditoFiscales`, `createFiscalInvoice`
- **Descripción del Alcance:**
  La plataforma genera facturas y recibos, pero no dispone de un flujo completo de corrección documental que permita enmendar errores sin alterar los documentos fiscales originales.
  Requerimientos Funcionales Detallados:
  1. Flujo de corrección documental: diferenciar correcciones administrativas (dirección, teléfono, nombre comercial) de correcciones fiscales (RTN, montos, conceptos exentos/gravados).
  2. Impedir modificaciones directas o silenciosas sobre facturas ya emitidas en `FacturasFiscales`.
  3. Solicitudes de corrección: registrar documento original, motivo, descripción del error, datos enmendados, solicitante y autorizador.
  4. Generación de documentos vinculados: emitir la correspondiente Nota de Crédito o documento de sustitución fiscal de acuerdo con las normativas del SAR.
  5. Historial documental y auditoría accesible desde el dashboard de contabilidad.
- **Criterios de Aceptación:**
  - Ninguna factura emitida puede editarse directamente en la base de datos sin un expediente de corrección.
  - Todo cambio documental conserva la versión original del comprobante.
  - Se vincula formalmente el documento rectificativo con la factura original.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13139-13166; clave TASK-361; asignación única: Contabilidad -->
### [TASK-361] [ ] [F15-Task18] Exportación avanzada de estados de cuenta, recibos y reportes financieros
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.4) y Sección J (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Presentación institucional, descarga documental y reportería)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `js/accounting.js`
  - `js/student.js`
  - `js/ui-common.js`
  - Google Drive
- **Dependencias Expuestas:** Generadores de PDF/Excel, Google Drive, `getStudentAccountStatement`
- **Descripción del Alcance:**
  La plataforma cuenta con información financiera consultable en pantalla, pero necesita ampliar las opciones de descarga oficial en PDF y Excel estructurado con membrete del colegio.
  Requerimientos Funcionales Detallados:
  1. Generación de estados de cuenta individuales y familiares en formato PDF con membrete institucional, logotipo, fecha, desglose de cargos, pagos, descuentos, recargos y saldo neto.
  2. Emisión de constancias de solvencia económica estudiantil con código CUV descargables para trámites externos.
  3. Exportación a Excel de reportes de cartera vencida, recaudación por período y desglose por grado con sumatorias matemáticas exactas.
  4. Generación de paquetes documentales en lote por grado y sección para tesorería.
  5. Almacenamiento organizado de copias oficiales en Google Drive organizadas por año lectivo y expediente estudiantil.
- **Criterios de Aceptación:**
  - El archivo PDF descargado coincide exactamente con las cifras visibles en la plataforma.
  - Las constancias de solvencia incorporan su código CUV para verificación pública.
  - Los archivos de Excel generados mantienen los tipos de datos numéricos y de fecha correctos.
  - Las descargas masivas respetan los filtros de ámbito y permisos de usuario.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13167-13193; clave TASK-362; asignación única: Contabilidad -->
### [TASK-362] [ ] [F15-Task19] Incorporación de comisiones bancarias y liquidación neta de pasarelas en contabilidad
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.8) y Sección J (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Exactitud contable y conciliación de pasarelas digitales)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `MovimientosCajaBancos`
  - `AsientosContables`
  - `IntegracionesPasarelas`
  - `BancosConciliaciones`
- **Dependencias Expuestas:** `MovimientosCajaBancos`, `AsientosContables`, `IntegracionesPasarelas`
- **Descripción del Alcance:**
  Los pagos recibidos a través de pasarelas de pago o tarjetas de crédito generan comisiones y retenciones bancarias que causan discrepancias entre el ingreso bruto pagado por los padres y el depósito neto recibido en la cuenta bancaria del colegio.
  Requerimientos Funcionales Detallados:
  1. Incorporar campos para importe bruto, comisión porcentual, comisión fija, ISV sobre comisión e importe neto depositado.
  2. Configurar tablas de tarifas de comisión por proveedor de pasarela.
  3. Contabilización automática separada: registrar el ingreso bruto en la cuenta del estudiante y asentar la comisión bancaria como gasto financiero deducible en `AsientosContables`.
  4. Registro en el libro de bancos del importe neto liquidado.
  5. Reportes analíticos de costos por intermediación financiera y comisiones bancarias por período.
- **Criterios de Aceptación:**
  - El arancel del alumno se acredita por el 100% de lo pagado sin transferirle la comisión bancaria a menos que esté parametrizado.
  - La comisión deducida por la pasarela se asienta como gasto financiero en la contabilidad.
  - El monto conciliado en la cuenta de banco coincide con el depósito neto del procesador.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13194-13221; clave TASK-363; asignación única: Contabilidad -->
### [TASK-363] [ ] [F15-Task20] Ampliación de la conciliación bancaria asistida y gestión de excepciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.9) y Sección J (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Control de tesorería, conciliación bancaria y automatización de extractos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `BancosConciliaciones`
  - `MovimientosCajaBancos`
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `performBankReconciliation`, `BancosConciliaciones`, `MovimientosCajaBancos`
- **Descripción del Alcance:**
  La conciliación actual (`performBankReconciliation`) compara partidas por referencia y monto (+/- 0.01), pero puede ampliarse para procesar extractos en formatos estructurados y gestionar excepciones complejas.
  Requerimientos Funcionales Detallados:
  1. Módulo de importación de extractos bancarios en formatos CSV y Excel con mapeo dinámico de columnas (fecha, referencia, concepto, débito, crédito).
  2. Algoritmo de coincidencia asistida por niveles de confianza: coincidencia exacta (referencia y monto idénticos), coincidencia probable (mismo monto y fecha cercana con referencia parcial) y discrepancias.
  3. Gestión de partidas agrupadas: conciliar un único depósito bancario que agrupa múltiples pagos de caja del día.
  4. Reglas automáticas reutilizables para transacciones bancarias recurrentes (intereses ganados, comisiones de mantenimiento, débitos automáticos).
  5. Generación de la hoja de trabajo mensual de conciliación con saldos de libros vs extractos y partidas pendientes.
- **Criterios de Aceptación:**
  - Se pueden importar extractos bancarios estructurados sin formateos manuales previos.
  - El sistema clasifica las partidas con sugerencias automáticas de coincidencia por nivel de confianza.
  - Permite agrupar varios pagos de caja contra un depósito bancario único sin descuadres.
  - Las partidas ya conciliadas no pueden re-utilizarse en conciliaciones posteriores.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13448-13477; clave TASK-370; asignación única: Contabilidad -->
### [TASK-370] [ ] [F18-Task11] Implementar seguimiento de entregas y alertas de retrasos
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.3) y Sección G (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Seguimiento operativo, cumplimiento de proveedores y gestión de alertas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `OrdenesCompra`
  - `RecepcionesCompra`
  - `backend/user-service/Code.gs` (servicio de notificaciones)
- **Dependencias Expuestas:** `OrdenesCompra`, `RecepcionesCompra`, `sendMultiChannelNotification`, `F18-Task01`
- **Descripción del Alcance:**
  El sistema no alerta automáticamente cuando la fecha estimada de entrega de una orden de compra ha vencido y todavía existen cantidades pendientes de recibir en bodega.
  Requerimientos Funcionales Detallados:
  1. Monitoreo de plazos y detección de demoras:
     - Comparar diariamente `fechaEntregaEstimada` de las órdenes en estado `Emitida`, `EnviadaProveedor` o `RecibidaParcial` contra la fecha actual.
     - Identificar órdenes con entrega vencida que mantengan cantidades pendientes de recibir.
     - Calcular los días de retraso acumulados por orden y por partida.
  2. Alertas y gestión de incidencias:
     - Disparar alertas automáticas al encargado de compras y al solicitante departamental.
     - Permitir registrar observaciones o compromisos de entrega reprogramados informados por el proveedor, conservando el historial de fechas anteriores.
     - Evitar notificaciones duplicadas por la misma incidencia de retraso mediante clave de deduplicación.
- **Criterios de Aceptación:**
  - Una orden con fecha de entrega superada y saldo pendiente genera una alerta visible en el panel de compras.
  - Las órdenes parcialmente recibidas mantienen la alerta de entrega demorada sobre los artículos faltantes.
  - Al completarse la recepción total, la alerta se desactiva automáticamente.
  - Las reprogramaciones de fecha de entrega conservan la fecha original para medir el índice de puntualidad.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13478-13506; clave TASK-371; asignación única: Contabilidad -->
### [TASK-371] [ ] [F18-Task12] Implementar control de consumo y disponibilidad de contratos marco
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.1) y Sección G (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Gestión de suministros recurrentes y control de topes contractuales)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`manageSupplierContract`, `getSupplierContractAlerts`)
  - `ContratosProveedores`
  - `OrdenesCompra`
- **Dependencias Expuestas:** `ContratosProveedores`, `OrdenesCompra`, `F18-Task07`
- **Descripción del Alcance:**
  Existe gestión básica de contratos de proveedores y alertas de vencimiento, pero no se controla cuánto se ha consumido de un contrato marco de suministro recurrente (ej. papelería, internet, mantenimiento de fotocopiadoras, combustible) ni cuánto saldo disponible permanece.
  Requerimientos Funcionales Detallados:
  1. Contratos marco con límite económico y cantidades:
     - Permitir registrar contratos marco con proveedor, vigencia, importe máximo autorizado y condiciones comerciales pactadas.
     - Vincular las órdenes de compra emitidas con el contrato marco correspondiente.
     - Calcular en tiempo real: monto total contratado, monto consumido acumulado por órdenes emitidas y saldo disponible restante del contrato.
  2. Control de topes y alertas:
     - Bloquear o advertir la emisión de órdenes de compra que excedan el límite económico disponible del contrato.
     - Alertas preventivas al alcanzar el 80% y 95% del consumo del contrato marco.
     - La cancelación de órdenes de compra restituye el saldo disponible del contrato de forma automática.
- **Criterios de Aceptación:**
  - Asociar múltiples órdenes de compra a un contrato marco acumula correctamente el consumo económico.
  - Se genera una advertencia o restricción si una orden supera el saldo disponible del contrato marco.
  - Cancelar una orden de compra libera el monto comprometido en el contrato marco.
  - El panel de contratos permite consultar el saldo disponible y el historial de compras de cada acuerdo.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13507-13535; clave TASK-372; asignación única: Contabilidad -->
### [TASK-372] [ ] [F18-Task13] Implementar sugerencias de compra basadas en existencias y niveles mínimos
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.4) y Sección G (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Continuidad operativa, abastecimiento oportuno y prevención de quiebres de stock)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`createPurchaseRequest`)
  - `InventariosKardex`
  - `SolicitudesCompra`
- **Dependencias Expuestas:** `InventariosKardex`, `SolicitudesCompra`, Módulo de Inventario
- **Descripción del Alcance:**
  El inventario registra movimientos en `InventariosKardex`, pero no genera sugerencias de compra automáticas cuando las existencias de materiales caen por debajo del stock mínimo institucional.
  Requerimientos Funcionales Detallados:
  1. Motor de sugerencias de reposición de inventario:
     - Monitorear las existencias disponibles por artículo y almacén contrastándolas con el `stockMinimo` configurado.
     - Considerar cantidades en tránsito (órdenes de compra emitidas pendientes de recibir) para no sobrecomprar.
     - Calcular la cantidad sugerida de compra: `cantidadSugerida = stockMaximo - stockDisponible - stockEnTransito`.
  2. Generación asistida de solicitudes:
     - Presentar bandeja de sugerencias de reposición agrupadas por categoría o proveedor habitual.
     - Permitir convertir una sugerencia en solicitud de compra interna (`createPurchaseRequest`) con un solo clic, sin generar órdenes de compra directas sin previa aprobación.
     - Evitar generar sugerencias duplicadas para artículos que ya cuenten con una solicitud de compra en trámite.
- **Criterios de Aceptación:**
  - Una salida de inventario que reduzca el stock por debajo del mínimo genera la sugerencia de reposición.
  - El cálculo considera los pedidos en tránsito pendientes de entrega evitando compras redundantes.
  - La sugerencia puede convertirse en solicitud de compra interna conservando la justificación de stock crítico.
  - El proceso respeta la aprobación de compras y no genera órdenes emitidas automáticamente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13536-13565; clave TASK-373; asignación única: Contabilidad -->
### [TASK-373] [ ] [F18-Task14] Implementar evaluación histórica del desempeño de proveedores
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.1) y Sección G (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Calidad en las adquisiciones, scoring de proveedores y evaluación de servicio)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `ProveedoresActivos`
  - `RecepcionesCompra`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `ProveedoresActivos`, `RecepcionesCompra`, `F18-Task09`
- **Descripción del Alcance:**
  El catálogo de proveedores no cuenta con un historial estructurado de calidad, puntualidad y cumplimiento. La selección de ofertas se realiza sin métricas históricas de desempeño del proveedor.
  Requerimientos Funcionales Detallados:
  1. Registro de evaluaciones de servicio y producto:
     - Registrar evaluaciones vinculadas a compras y recepciones reales en una escala de 1 a 5 estrellas.
     - Criterios evaluables: puntualidad en la entrega, calidad del producto entregado, cumplimiento de especificaciones técnicas, atención a reclamaciones y cumplimiento de condiciones comerciales.
     - Registrar observaciones, incidencias, devoluciones y usuario evaluador.
  2. Scoring e integración con cotizaciones:
     - Calcular el índice promedio de desempeño del proveedor (Score de Proveedor).
     - Mostrar el score histórico del proveedor en la matriz comparativa de cotizaciones (`F18-Task05`) como criterio de apoyo en la adjudicación.
     - Identificar proveedores con calificaciones deficientes recurrentes para someterlos a revisión o suspensión.
- **Criterios de Aceptación:**
  - Se puede registrar la evaluación de desempeño al confirmar una recepción de compras.
  - El perfil del proveedor muestra su calificación promedio histórica y el total de evaluaciones recibidas.
  - El score del proveedor es visible al comparar cotizaciones para respaldar la decisión de adjudicación.
  - Solo los roles autorizados de compras y almacén pueden registrar evaluaciones de proveedores.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13566-13594; clave TASK-374; asignación única: Contabilidad -->
### [TASK-374] [ ] [F18-Task15] Incorporar un procedimiento formal para compras urgentes y excepcionales
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección G y Sección H (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Gestión de emergencias institucionales, trazabilidad de excepciones y control financiero)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`createPurchaseRequest`, `createPurchaseOrder`)
  - `SolicitudesCompra`
  - `OrdenesCompra`
- **Dependencias Expuestas:** `SolicitudesCompra`, `OrdenesCompra`, Flujos de aprobación directiva
- **Descripción del Alcance:**
  Las solicitudes actuales no contemplan una clasificación para compras de emergencia o imprevistos graves (ej. reparación urgente de bomba de agua, falla de servidores centrales), obligando a eludir los controles del sistema o a realizar compras no documentadas.
  Requerimientos Funcionales Detallados:
  1. Clasificación formal de compra urgente:
     - Incorporar bandera de tipo de compra: `Ordinaria` o `Urgente / Emergencia`.
     - Exigir justificación detallada de la urgencia y el impacto institucional de no ejecutar la compra de inmediato.
     - Flujo de aprobación expedito: enrutar directamente a la Dirección General para autorización de vía rápida.
  2. Regularización y control:
     - Permitir emitir la orden de compra con una sola cotización justificada cuando la urgencia lo amerite.
     - Exigir regularización documental posterior (carga de facturas, actas y fotos) sin eludir la verificación Three-Way Matching ni los controles presupuestarios.
     - Emitir registro de auditoría `EMERGENCY_PURCHASE_AUTHORIZED`.
- **Criterios de Aceptación:**
  - Una solicitud marcada como urgente exige obligatoriamente justificación y descripción de impacto.
  - Se enruta de inmediato a aprobación directiva con notificación prioritaria.
  - La excepción de cotización múltiple queda asentada formalmente con la firma del autorizador.
  - La compra urgente mantiene intactos los controles de recepción física y conciliación contable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13595-13626; clave TASK-375; asignación única: Contabilidad -->
### [TASK-375] [ ] [F18-Task16] Desarrollar reportes consolidados de compras, compromisos y cuentas por pagar
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (B.5), Sección D y Sección G (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Reportería gerencial, control de compromisos y auditoría contable)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`getAccountsReceivablePayableSummary`, `getPurchaseOrders`)
  - `CuentasPorPagarGastos`
  - `OrdenesCompra`
  - `PresupuestosInstitucionales`
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `CuentasPorPagarGastos`, `OrdenesCompra`, `PresupuestosInstitucionales`
- **Descripción del Alcance:**
  Las consultas actuales no proporcionan una visión consolidada suficiente de la cartera de compras, compromisos presupuestarios abiertos, entregas demoradas y saldos vencidos de cuentas por pagar a proveedores.
  Requerimientos Funcionales Detallados:
  1. Reportes consolidados de adquisiciones:
     - Compras por departamento, por centro de costo, por categoría de insumos y por proveedor.
     - Reporte de compromisos presupuestarios abiertos vs facturas ejecutadas.
     - Reporte de órdenes de compra con entregas parciales y saldos pendientes de recibir.
  2. Reporte de antigüedad de cuentas por pagar a proveedores:
     - Cartera vencida y corriente clasificada en franjas: Corriente (no vencida), 1-30 días, 31-60 días, 61-90 días y más de 90 días de mora con proveedores.
     - Desglose de notas de crédito aplicadas y facturas en disputa o bloqueadas.
     - Exportación de reportes a formatos Excel y PDF membretado con sumatorias matemáticas coincidentes.
- **Criterios de Aceptación:**
  - Los reportes de compras totalizan exactamente las sumas de las órdenes de compra emitidas.
  - El reporte de cuentas por pagar coincide con el balance de pasivos registrado en la contabilidad.
  - La clasificación de antigüedad de facturas se calcula exactamente según sus fechas de vencimiento.
  - Las exportaciones a Excel conservan el formateo numérico y los filtros aplicados en pantalla.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13631-13669; clave TASK-376; asignación única: Contabilidad -->
### [TASK-376] [ ] [F19-Task10] Identificación institucional de activos y materiales mediante códigos QR y códigos de barras
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-07), Sección C (2.7) y Plan de Trabajo F19-10
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Productividad en campo, toma ágil de inventarios, reducción de errores de digitación y escaneo móvil)
- **Archivos Involucrados:**
  - `CatalogoArticulos`
  - `ActivosPatrimoniales`
  - `AsignacionesActivos`
  - `InventariosKardex`
  - `backend/accounting-service/Code.gs` (nuevas funciones `generateItemQRCode`, `resolveItemByBarcode`)
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `CatalogoArticulos`, `ActivosPatrimoniales`, `F19-Task05`
- **Descripción del Alcance:**
  Los activos y materiales no disponen de mecanismos ópticos de identificación rápida. Las auditorías e inspecciones en bodegas o aulas dependen de búsquedas manuales o digitación propensa a errores.
  Requerimientos Funcionales Detallados:
  1. Generación de códigos QR y de barras:
     - Generar automáticamente identificadores QR para activos patrimoniales, insumos de catálogo, lotes y equipos bajo custodia.
     - Generar códigos de barras para artículos con identificación logística.
     - El código debe contener un identificador institucional seguro sin exponer datos confidenciales ni credenciales.
  2. Escaneo móvil y consulta rápida:
     - Herramienta de escaneo con cámara móvil o lectores ópticos externos.
     - Al escanear un activo, mostrar de inmediato: código patrimonial, descripción, categoría, marca, serie, estado operativo, ubicación, custodio actual, historial, garantías y mantenimientos.
     - Al escanear un material, mostrar: código, nombre, categoría, unidad, existencias por almacén, lotes y vencimientos.
     - Habilitar acciones según rol: consultar, registrar entrada/salida, transferir, inventario físico, asignar custodia, reportar daños.
  3. Impresión y reposición de etiquetas:
     - Generación de etiquetas imprimibles individuales o en lote con membrete institucional.
     - Configuración de formato y tamaños de etiquetas.
     - Reposición de etiquetas dañadas conservando el código original sin alterar identificadores.
- **Criterios de Aceptación:**
  - Cada activo y material puede disponer de su código QR institucional único.
  - El escaneo desde dispositivos móviles o lectores ópticos abre directamente la ficha del bien.
  - La consulta respeta estrictamente los permisos RBAC del usuario autenticado.
  - Se generan plantillas de impresión de etiquetas individuales y masivas.
  - Los códigos QR no exponen información privada ni datos sensibles en texto plano.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13670-13707; clave TASK-377; asignación única: Contabilidad -->
### [TASK-377] [ ] [F19-Task11] Control de lotes, números de serie y fechas de vencimiento
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-08, F19-10) y Plan de Trabajo F19-11
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Control sanitario, trazabilidad de insumos perecederos de cafetería, reactivos de ciencias y medicamentos de enfermería)
- **Archivos Involucrados:**
  - `CatalogoArticulos`
  - `InventariosKardex`
  - Hoja `InventariosLotes`
  - Hoja `InventariosSeries`
  - `backend/accounting-service/Code.gs` (`recordInventoryMovement`, `getInventoryKardex`, nueva función `getExpiringInventoryAlerts`)
  - `js/accounting.js`
- **Dependencias Expuestas:** `CatalogoArticulos`, `InventariosKardex`, `F19-Task01`, `F19-Task05`, `F19-Task10`
- **Descripción del Alcance:**
  El inventario no discrimina lotes de adquisición, números de serie individuales ni fechas de vencimiento. Esto limita la trazabilidad y el control de calidad de insumos perecederos o reactivos de laboratorio.
  Requerimientos Funcionales Detallados:
  1. Modalidades de seguimiento por artículo:
     - Sin seguimiento individual, Seguimiento por lote o Seguimiento por número de serie.
     - Lotes: número de lote, proveedor, fecha de recepción, fabricación, vencimiento, cantidad recibida/disponible, ubicación y costo.
     - Números de serie: identidad individual única por unidad, impidiendo que el mismo número de serie exista simultáneamente en dos ubicaciones o custodias distintas.
  2. Estrategias de rotación y consumo:
     - Selección automática según PVPS/FEFO (First Expired, First Out) para insumos con caducidad.
     - Sugerir prioritariamente el lote con fecha de expiración más próxima utilizable.
     - Excepciones justificadas con autorización documentada para despachar lotes distintos.
  3. Alertas de caducidad y bloqueo de lotes:
     - Alertas preventivas configurables (30, 60 días antes del vencimiento).
     - Bloqueo automático para consumo de lotes vencidos o retirados por el proveedor.
     - Registro documentado de bajas por vencimiento o deterioro.
- **Criterios de Aceptación:**
  - Los artículos pueden configurarse con control por lote, serie o estándar.
  - Los números de serie son estrictamente únicos en la base de datos.
  - El motor de entrega selecciona automáticamente el lote más próximo a vencer (FEFO).
  - Se bloquea la entrega o consumo de lotes cuya fecha de vencimiento haya expirado.
  - Se reportan oportunamente los lotes en riesgo de caducidad.
  - Se mantiene la trazabilidad del destino de cada lote consumido o transferido.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13708-13739; clave TASK-378; asignación única: Contabilidad -->
### [TASK-378] [ ] [F19-Task12] Gestión de garantías, pólizas y cobertura de activos patrimoniales
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-13), Sección C (2.13) y Plan de Trabajo F19-12
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Ahorro en reparaciones, soporte de proveedores, trazabilidad de siniestros y reclamos comerciales)
- **Archivos Involucrados:**
  - `ActivosPatrimoniales`
  - Hoja `ActivosGarantias`
  - `MantenimientoOrdenes`
  - `backend/accounting-service/Code.gs` (`manageAssetItem`, `getAssetItems`, nueva función `getAssetWarrantyAlerts`)
  - `js/accounting.js`
- **Dependencias Expuestas:** `ActivosPatrimoniales`, `MantenimientoOrdenes`, `ProveedoresActivos`, `F19-Task06`
- **Descripción del Alcance:**
  La ficha de activos no almacena información de pólizas ni fechas de cobertura de garantías de proveedores. Cuando un equipo falla, se corre el riesgo de incurrir en gastos de reparación que podrían tramitarse sin costo ante el fabricante o aseguradora.
  Requerimientos Funcionales Detallados:
  1. Ficha de garantías y pólizas de activos:
     - Proveedor o fabricante, número de garantía, póliza, fecha de adquisición, fecha de inicio y vencimiento de cobertura, tipo de cobertura, condiciones, exclusiones, costo de póliza, contacto de soporte y documentos adjuntos.
     - Múltiples coberturas simultáneas por bien (ej. garantía de fábrica y seguro contra robo o accidentes).
  2. Alertas e integración con órdenes de mantenimiento:
     - Alertas de garantías próximas a vencer en los siguientes 30 y 60 días.
     - Al reportar una falla en `MantenimientoOrdenes`, informar inmediatamente si el equipo cuenta con cobertura vigente y mostrar los contactos para tramitar el reclamo.
     - Registro de reclamos: fecha, falla, número de caso, respuesta del proveedor, resultado y costos cubiertos vs no cubiertos.
     - Evitar contabilizar como gasto de la institución los costos asumidos íntegramente por la garantía.
- **Criterios de Aceptación:**
  - Cada activo puede registrar múltiples pólizas o garantías con fechas y condiciones.
  - Se generan alertas destacadas ante garantías próximas a expirar.
  - Al abrir una orden de reparación se despliega la vigencia de garantía del equipo.
  - Las reparaciones cubiertas por garantía diferencian el importe cubierto del costo asumido institucionalmente.
  - Se conserva el expediente de reclamos de garantía y resultados obtenidos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13740-13773; clave TASK-379; asignación única: Contabilidad -->
### [TASK-379] [ ] [F19-Task13] Sistema centralizado de alertas y notificaciones multicanal
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-18), Sección C (2.18) y Plan de Trabajo F19-13
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Comunicación oportuna, abastecimiento ágil, atención prioritaria de fallas y alertas preventivas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs` (`sendMultiChannelNotification`, `retryFailedNotificationsQueue`)
  - `InventariosKardex`
  - `MaterialesSolicitudes`
  - `MantenimientoOrdenes`
  - `ActivosPatrimoniales`
  - `js/accounting.js`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `InventariosKardex`, `MantenimientoOrdenes`, `F19-Task06`, `F19-Task11`
- **Descripción del Alcance:**
  Las alertas de inventario bajo mínimos y asignación de órdenes de mantenimiento solo son visibles al ingresar a la pantalla contable. No existe una comunicación automatizada multicanal hacia los responsables operativos.
  Requerimientos Funcionales Detallados:
  1. Catálogo de eventos de notificación:
     - Inventario: stock mínimo alcanzado, stock agotado, existencias negativas detectadas, solicitud pendiente de aprobación, solicitud aprobada, material listo para entrega, transferencias pendientes de recibir, discrepancias en conteos físicos.
     - Activos: nueva asignación de custodia, devolución vencida o pendiente, activo reportado dañado, garantía próxima a vencer.
     - Mantenimiento: mantenimiento preventivo próximo o atrasado, orden urgente asignada a técnico, repuestos insuficientes, orden completada.
  2. Despacho multicanal y preferencias:
     - Canales: notificaciones internas de plataforma, correo electrónico institucional y WhatsApp (cuando esté habilitado).
     - Configuración de destinatarios por rol, usuario, departamento y tipo de evento.
     - Niveles de prioridad (informativo, advertencia, crítico) y prevención de notificaciones repetitivas mediante claves de deduplicación.
     - Centro de notificaciones interno con estados de leído/pendiente y registro de reintentos fallidos.
- **Criterios de Aceptación:**
  - Un quiebre de stock mínimo dispara automáticamente el aviso a los encargados configurados.
  - La asignación de órdenes de trabajo urgentes notifica de inmediato al personal técnico.
  - Se controlan duplicados mediante deduplicación diaria.
  - Los errores en el servicio de notificación no bloquean las transacciones contables o de inventario.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13774-13807; clave TASK-380; asignación única: Contabilidad -->
### [TASK-380] [ ] [F19-Task14] Gestión documental, expedientes y actas de inventario y patrimonio
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E (F19-14), Sección C y Plan de Trabajo F19-14
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Respaldo probatorio, expedientes patrimoniales 360°, actas digitales y archivo seguro en Drive)
- **Archivos Involucrados:**
  - `InventariosKardex`
  - `ActivosPatrimoniales`
  - `AsignacionesActivos`
  - `BajasBienes`
  - `MantenimientoOrdenes`
  - Google Drive API
  - `js/accounting.js`
- **Dependencias Expuestas:** Google Drive API, `F19-Task02`, `F19-Task04`, `F19-Task06`, `F19-Task12`
- **Descripción del Alcance:**
  La plataforma registra movimientos y custodias, pero carece de un repositorio documental estructurado para archivar y vincular comprobantes de compra, pólizas, actas de custodia firmadas, fotografías de daños y actas de disposición patrimonial.
  Requerimientos Funcionales Detallados:
  1. Tipología documental y expedientes unificados:
     - Facturas de compra, comprobantes, garantías, manuales, fotografías de estado físico, actas de asignación, actas de devolución, actas de baja, reportes de mantenimiento y certificados de calibración.
     - Expediente patrimonial 360° por cada activo consultable desde su ficha técnica.
  2. Generación automática de actas PDF institucionales:
     - Acta de entrega de activos bajo custodia, acta de devolución y finiquito, acta de transferencia entre almacenes, acta de baja patrimonial y órdenes de mantenimiento.
     - Incluir identificador único, fecha, datos del responsable, firmas institucionales y evidencias fotográficas de antes/después.
     - Almacenamiento organizado en Google Drive bajo carpetas institucionales con referencias persistentes.
     - Preservar permanentemente los expedientes documentales de bienes dados de baja.
- **Criterios de Aceptación:**
  - Cada activo e insumo cuenta con acceso directo a su expediente documental.
  - Las asignaciones, devoluciones y bajas generan sus actas en PDF descargables.
  - Los archivos adjuntos se organizan automáticamente en carpetas estructuradas de Drive.
  - Los activos dados de baja conservan intacto su expediente probatorio histórico.
  - Se controlan los permisos de visualización documental de acuerdo con el rol del usuario.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13812-13834; clave TASK-381; asignación única: Contabilidad -->
### [TASK-381] [ ] [F20-Task11] Integración de colecciones bibliográficas con el inventario patrimonial
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.13) y Plan de Trabajo P2
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Control de activos institucionales, capitalización de colecciones valiosas y trazabilidad de bajas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `BibliotecaEjemplares`
  - `ActivosPatrimoniales`
  - `BajasBienes`
- **Dependencias Expuestas:** `ActivosPatrimoniales`, `BibliotecaEjemplares`, `F19-Task08`
- **Descripción del Alcance:**
  Existe duplicidad conceptual entre los bienes de biblioteca y el inventario general. Las enciclopedias costosas, colecciones históricas o dispositivos de lectura digital (kindles/tablets) deben integrarse con el inventario patrimonial sin crear dos sistemas independientes de control.
  Requerimientos Funcionales Detallados:
  1. Vinculación opcional con código patrimonial:
     - Permitir que un ejemplar de biblioteca almacene un campo `ActivoPatrimonialID` cuando corresponda a un bien capitalizable institucional.
     - Las bajas por pérdida o daño irreparable en biblioteca deben actualizar de forma coordinada el estado en `ActivosPatrimoniales` y registrar el acta en `BajasBienes`.
- **Criterios de Aceptación:**
  - Un ejemplar marcado como activo patrimonial conserva su vínculo con la ficha de activos.
  - La baja formal en biblioteca actualiza el registro patrimonial sin generar inconsistencias contables.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13858-13880; clave TASK-383; asignación única: Contabilidad -->
### [TASK-383] [ ] [F20-Task13] Solicitudes de adquisición bibliográfica y sugerencias de compra escolar
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.12) y Plan de Trabajo P2
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Desarrollo de colecciones, detección de necesidades pedagógicas e integración con compras)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `submitBookPurchaseSuggestion`, `getPurchaseSuggestions`)
  - Hoja `BibliotecaSugerenciasCompra`
  - `SolicitudesCompra`
- **Dependencias Expuestas:** `SolicitudesCompra`, `F18-Task03`
- **Descripción del Alcance:**
  No existe un canal para que docentes o bibliotecarios registren sugerencias formales de adquisición de libros agotados o títulos necesarios para nuevos cursos, ni su integración con las solicitudes de compra institucionales.
  Requerimientos Funcionales Detallados:
  1. Buzón digital de sugerencias bibliográficas:
     - Formulario para registrar: título, autor, editorial, ISBN referencial, cantidad solicitada, justificación pedagógica y docente solicitante.
     - Verificar si el libro ya existe en el catálogo y su demanda histórica antes de autorizar.
     - Al ser aprobada por Dirección, permitir convertir la sugerencia en una solicitud interna de compra (`createPurchaseRequest`) de la Fase 18.
- **Criterios de Aceptación:**
  - Los profesores pueden enviar sugerencias de libros justificando la necesidad para su clase.
  - Dirección puede aprobar o rechazar la solicitud, y las aprobadas se enlazan con el módulo de compras.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13934-13956; clave TASK-386; asignación única: Contabilidad -->
### [TASK-386] [ ] [F21-Task25] Gestión de proveedores externos y servicios de transporte contratados
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (3.11) y Plan de Implementación TAREA 24
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Microbuses subcontratados, control de proveedores y homologación de requisitos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `ProveedoresActivos`
  - `TransporteVehiculos`
  - `TransporteConductores`
- **Dependencias Expuestas:** `ProveedoresActivos`, `TransporteVehiculos`, `F18-Task09`
- **Descripción del Alcance:**
  Cuando la institución subcontrata microbuses o camionetas externas, no se controlan bajo los mismos estándares de seguridad que las unidades propias.
  Requerimientos Funcionales Detallados:
  1. Proveedores y unidades externas:
     - Vincular vehículos y conductores externos con su respectivo proveedor en `ProveedoresActivos`.
     - Exigir los mismos controles de seguro obligatorio, revisión mecánica y licencias de chofer antes de habilitarlos para transportar alumnos.
- **Criterios de Aceptación:**
  - Las unidades externas se sujetan a las mismas validaciones de seguridad que las propias.
  - Se auditan pólizas y contratos de proveedores de transporte.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13957-13980; clave TASK-387; asignación única: Contabilidad -->
### [TASK-387] [ ] [F21-Task26] Control de combustible, kilometraje y costos operativos de la flota
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.1, 1.21) y Plan de Implementación TAREA 25
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Eficiencia energética, bitácora de consumo de combustible y costos por kilómetro)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `recordFuelLog`, `getFleetOperatingCosts`)
  - Hoja `TransporteCombustible`
  - `TransporteVehiculos`
- **Dependencias Expuestas:** `TransporteVehiculos`, `MantenimientoOrdenes`, `CuentasPorPagarGastos`
- **Descripción del Alcance:**
  No existe una bitácora para registrar kilometrajes y compras de combustible por unidad escolar para medir el rendimiento de la flota.
  Requerimientos Funcionales Detallados:
  1. Bitácora de combustible y kilometraje:
     - Registrar cargas de combustible (galones, costo total, fecha, kilometraje actual del odómetro, factura y vehículo).
     - Calcular rendimiento promedio (km por galón) y alertar ante consumos anómalos o lecturas de odómetro inconsistentes.
     - Reportar costos operativos de combustible y mantenimiento por unidad vehicular.
- **Criterios de Aceptación:**
  - Se registran cargas de combustible vinculadas al vehículo y factura.
  - Se detectan inconsistencias en lecturas de kilometraje.
  - Se generan reportes de costo operativo por unidad y por ruta.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13981-14007; clave TASK-388; asignación única: Contabilidad -->
### [TASK-388] [ ] [F21-Task27] Reportes operativos, administrativos y financieros de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.19) y Plan de Implementación TAREA 26
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Reportería consolidada, auditoría de puntualidad, ocupación de flota y cobranza)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `getTransportOperationalReports`)
  - `TransporteRutas`
  - `TransporteAsignaciones`
  - `TransporteViajes`
  - `js/accounting.js`
- **Dependencias Expuestas:** `TransporteRutas`, `TransporteAsignaciones`, `F21-Task01`, `F21-Task13`
- **Descripción del Alcance:**
  Existen contadores aislados pero no una suite de reportes consolidados para evaluar la operación de transporte.
  Requerimientos Funcionales Detallados:
  1. Suite de reportes de movilidad escolar:
     - Reporte de ocupación y cupos por ruta y unidad vehicular.
     - Reporte de puntualidad y retrasos comparando horario planificado vs horario real de viaje.
     - Reporte de asistencia y estudiantes que no abordaron.
     - Reporte de recaudación y saldos pendientes por concepto de transporte.
     - Exportación estructurada a formatos Excel y PDF.
- **Criterios de Aceptación:**
  - Los reportes totalizan con exactitud los datos del padrón y de los viajes.
  - Se exportan archivos con formateo legible y filtros por período y ruta.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14730-14777; clave TASK-409; asignación única: Contabilidad -->
### [TASK-409] [F24-Task19] [P2] [Control Presupuestario - Seguimiento de Objetivos Presupuestarios y Desviaciones Financieras]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** Diccionario (`F24-Task02`), metas (`F24-Task12`), alertas (`F24-Task14`), fuentes normalizadas (`F24-Task04`).
- **Capacidades Relacionadas:** F24-A05, F24-006.
- **Problema Detectado:**
  La auditoría confirma que ya existen mecanismos de disponibilidad presupuestaria y ejecución presupuestaria. Sin embargo, estas capacidades deben integrarse con el sistema general de indicadores, metas y paneles para facilitar el seguimiento de desviaciones.
- **Requisitos Funcionales:**
  1. Reutilizar e integrar los mecanismos presupuestarios existentes en el marco analítico institucional.
  2. Integrar en un cuadro comparativo unificado:
     - Presupuesto institucional aprobado por partida y centro de costo.
     - Presupuesto comprometido en órdenes de compra y contratos vigentes.
     - Presupuesto ejecutado y devengado en asientos contables.
     - Saldo disponible real en tiempo real.
     - Ingresos proyectados según tarifas de cobro y matrícula.
     - Ingresos efectivamente confirmados en caja y bancos.
     - Gastos proyectados versus gastos reales devengados.
  3. Permitir analizar las desviaciones financieras por:
     - Período o ejercicio fiscal.
     - Código de cuenta contable.
     - Categoría de gasto o ingreso.
     - Departamento institucional.
     - Proyecto o unidad operativa, cuando exista.
  4. Calcular automáticamente variaciones absolutas y porcentuales entre lo presupuestado y lo ejecutado.
  5. Identificar y clasificar situaciones de sobreejecución y subejecución presupuestaria.
  6. Incorporar alertas configurables ante desviaciones que superen los márgenes de tolerancia institucionales.
  7. Permitir la consulta interactiva de los movimientos contables individuales que originaron una desviación.
  8. Conservar de forma histórica e inalterable los períodos fiscales anteriores cerrados.
- **Cambios Necesarios:**
  - Integrar los informes presupuestarios existentes (`getBudgetExecutionReport`, `checkBudgetAvailability`) con el diccionario de indicadores.
  - Incorporar componentes visuales de seguimiento presupuestario (gráficos de ejecución vs presupuesto).
  - Integrar las metas financieras en los paneles de administración y contabilidad.
  - Extender el sistema de alertas tempranas hacia las desviaciones presupuestarias no justificadas.
  - Reutilizar las reglas contables existentes de doble partida sin duplicar cálculos de saldos.
- **Comportamiento Esperado:**
  Contabilidad y dirección podrán conocer cuánto se ha presupuestado, comprometido y ejecutado, así como identificar diferencias y consultar sus movimientos de origen.
- **Criterios de Aceptación:**
  - [ ] Los valores consolidados coinciden exactamente con los informes presupuestarios y contables existentes.
  - [ ] Los montos comprometidos no se confunden ni se suman erróneamente a los gastos efectivamente ejecutados.
  - [ ] Los saldos disponibles se calculan con exactitud (`Aprobado - Comprometido - Ejecutado`).
  - [ ] Las desviaciones reflejan fidedignamente sus valores absolutos y porcentuales.
  - [ ] La suma de los movimientos de detalle coincide al 100% con el total de la partida presupuestaria.
  - [ ] Los ejercicios fiscales anteriores conservan sus resultados históricos inalterables.
  - [ ] Los usuarios sin permisos contables no pueden consultar información presupuestaria restringida.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15664-15687; clave TASK-432; asignación única: Contabilidad -->
### [TASK-432] [F29-Task19] [P2] Migración Histórica de Nómina, Empleados y Obligaciones Laborales
- **Orden de Ejecución:** 19
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importPayrollHistoricalRecords`)
  - Hojas: `BoletasPago`, `PlanillasNomenclatura`
- **Subcapacidades Relacionadas:** F29-07, F29-09.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03], [F29-Task06].
- **Problema Detectado y Riesgos:**
  No existe una utilidad para importar boletas de pago anteriores ni para conservar el historial de deducciones de IHSS y RAP de ciclos pasados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Importación de boletas y acumulados de nómina:*
     - Asociar boletas históricas al empleado mediante identidad o No. de afiliación IHSS.
     - Homologar conceptos salariales, deducciones y aportaciones patronales.
     - Evitar que los registros históricos generen pagos o deducciones operativas nuevas.
- **Criterios de Aceptación:**
  - [ ] Se importan boletas históricas quedando vinculadas al expediente del empleado.
  - [ ] Los acumulados concilian con los reportes de planillas de la fuente.
  - [ ] Los registros históricos no generan pagos operativos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16535-16561; clave TASK-462; asignación única: Contabilidad -->
### [TASK-462] [ ] [F18-Task17] Implementar portal de proveedores para operaciones externas
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (F18-A01) y Sección G (P3)
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Capacidad complementaria de autoservicio para proveedores externos)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `ProveedoresActivos`
  - `OrdenesCompra`
  - `CuentasPorPagarGastos`
- **Dependencias Expuestas:** `ProveedoresActivos`, `OrdenesCompra`, Control de acceso externo
- **Descripción del Alcance:**
  Habilitar un espacio web restringido para proveedores formalmente registrados donde puedan consultar las órdenes de compra emitidas a su nombre, confirmar o rechazar pedidos, adjuntar facturas digitales y verificar el estado de sus pagos.
  Requerimientos Funcionales Detallados:
  1. Acceso seguro y aislamiento de datos:
     - Crear credenciales de acceso restringido para proveedores validados.
     - Garantizar aislamiento estricto ABAC: un proveedor solo puede ver sus propias órdenes y facturas.
     - Permitir al proveedor cargar sus facturas en PDF y comprobantes de entrega, las cuales ingresan a la bandeja de revisión institucional sin contabilizarse automáticamente.
     - Permitir revocar el acceso externo en cualquier momento sin alterar el historial comercial.
- **Criterios de Aceptación:**
  - Un proveedor autenticado solo visualiza las órdenes de compra emitidas a su empresa.
  - Se bloquea cualquier intento de acceder a información de otros proveedores.
  - Las facturas cargadas por el proveedor quedan en estado `PendienteRevision` para validación interna.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16562-16586; clave TASK-463; asignación única: Contabilidad -->
### [TASK-463] [ ] [F18-Task18] Incorporar procesos competitivos y licitaciones para adquisiciones de mayor cuantía
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (F18-A04) y Sección G (P3)
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Capacidad complementaria para proyectos mayores de infraestructura o equipamiento)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `SolicitudesCompra`
  - `CotizacionesCompra`
  - Hoja `ProcesosLicitacion`
- **Dependencias Expuestas:** `SolicitudesCompra`, `CotizacionesCompra`, `F18-Task05`
- **Descripción del Alcance:**
  Para proyectos de alta cuantía (ej. construcción de pabellón, renovación completa de laboratorios), implementar un módulo de licitaciones públicas o privadas con bases técnicas, cronograma de apertura de pliegos y evaluación formal por comité evaluador.
  Requerimientos Funcionales Detallados:
  1. Convocatoria y evaluación por comités:
     - Publicar pliego de condiciones, requisitos técnicos y fechas límite de postulación.
     - Registrar apertura de pliegos de ofertas con separación de evaluación técnica y económica.
     - Emitir acta formal de adjudicación con ponderaciones y firmas del comité directivo.
- **Criterios de Aceptación:**
  - Se puede estructurar un proceso de licitación con fechas y requisitos obligatorios.
  - Se ponderan ofertas técnicas y económicas de acuerdo con las bases registradas.
  - La adjudicación genera automáticamente la orden de compra y el contrato correspondiente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16587-16610; clave TASK-464; asignación única: Contabilidad -->
### [TASK-464] [ ] [F18-Task19] Incorporar captura asistida de datos de facturas mediante OCR
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección B (F18-A05) y Sección G (P3)
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Capacidad complementaria de productividad en digitalización)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `CuentasPorPagarGastos`
  - Servicios de procesamiento de imágenes / Drive
- **Dependencias Expuestas:** `CuentasPorPagarGastos`, `F18-Task02`
- **Descripción del Alcance:**
  Evaluar la incorporación de un motor de reconocimiento óptico de caracteres (OCR) para precargar automáticamente datos de facturas físicas escaneadas o PDFs de proveedores (número de factura, RTN, subtotal, ISV, total), facilitando la captura manual y reduciendo errores tipográficos antes del Three-Way Matching.
  Requerimientos Funcionales Detallados:
  1. Extracción y revisión supervisada:
     - Cargar PDF o foto de la factura y extraer datos fiscales clave.
     - Presentar los datos extraídos en un formulario de revisión humana para su validación previa.
     - Prohibir taxativamente que un documento procesado por OCR se apruebe o contabilice automáticamente sin la confirmación de un operador contable autorizado.
- **Criterios de Aceptación:**
  - Se extraen de forma asistida los datos de facturas nítidas en PDF.
  - Los campos dudosos se resaltan para verificación manual obligatoria.
  - Ninguna factura se asienta en contabilidad sin la aprobación explícita del usuario.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16615-16645; clave TASK-465; asignación única: Contabilidad -->
### [TASK-465] [ ] [F19-Task15] Panel de control gerencial de inventarios, activos y mantenimiento
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E y Plan de Trabajo F19-15
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Analítica gerencial, toma de decisiones estratégicas, indicadores en tiempo real y reportería ejecutiva)
- **Archivos Involucrados:**
  - `js/accounting.js`
  - `dashboard-contabilidad.html`
  - `backend/accounting-service/Code.gs` (nueva función `getInventoryAssetsExecutiveDashboard`)
  - `InventariosKardex`
  - `ActivosPatrimoniales`
  - `MantenimientoOrdenes`
- **Dependencias Expuestas:** `F19-Task04`, `F19-Task07`, `F19-Task08`, `F19-Task13`
- **Descripción del Alcance:**
  La interfaz ofrece listados tabulares operativos pero carece de un panel consolidado de control directivo con métricas gráficas e indicadores financieros del patrimonio y suministros institucionales.
  Requerimientos Funcionales Detallados:
  1. Indicadores ejecutivos consolidados:
     - Inventario: valor total del inventario, artículos activos, existencias por almacén, artículos bajo mínimo, agotados, sin rotación, con sobrestock, próximos a vencer, consumo mensual y rotación.
     - Activos: total de activos registrados, valor de adquisición, valor neto en libros, depreciación acumulada, asignados, disponibles, en mantenimiento, dados de baja y garantías por expirar.
     - Mantenimiento: órdenes abiertas, pendientes, vencidas, completadas, ratio preventivo vs correctivo, costos reales vs estimados, gastos por departamento y equipos con mayor tasa de falla.
  2. Filtros interactivos y exportación:
     - Filtros cruzados por período, almacén, departamento, categoría, tipo de activo y custodio.
     - Gráficos de evolución mensual y exportación a Excel y PDF con fecha de corte y actualización de datos visible.
- **Criterios de Aceptación:**
  - Los indicadores concuerdan exactamente con las cifras del Kardex y del registro de activos.
  - Los filtros interactivos actualizan las tarjetas y gráficos simultáneamente.
  - Se permite navegar desde cualquier indicador hasta los registros detallados de origen.
  - Se exportan reportes ejecutivos en formatos PDF y Excel.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16646-16677; clave TASK-466; asignación única: Contabilidad -->
### [TASK-466] [ ] [F19-Task16] Gestión presupuestaria y análisis de costos de suministros y mantenimiento por departamento
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E y Plan de Trabajo F19-16
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Control del gasto departamental, comparativa planificado vs real y límites de consumo)
- **Archivos Involucrados:**
  - `MaterialesSolicitudes`
  - `MantenimientoOrdenes`
  - `AsientosContables`
  - `PresupuestosInstitucionales`
  - `backend/accounting-service/Code.gs` (`checkBudgetAvailability`, nueva función `getDepartmentalMaterialCostAnalysis`)
  - `js/accounting.js`
- **Dependencias Expuestas:** `PresupuestosInstitucionales`, `MaterialesSolicitudes`, `F19-Task07`, `F19-Task15`
- **Descripción del Alcance:**
  Los consumos y reparaciones se registran operativamente pero no se contrastan contra los techos presupuestarios aprobados para cada área departamental de la academia.
  Requerimientos Funcionales Detallados:
  1. Techos presupuestarios por departamento:
     - Asignar presupuestos de suministros y mantenimiento por departamento y período (mensual, trimestral, anual).
     - Calcular automáticamente: Presupuesto aprobado, Gasto comprometido, Gasto ejecutado, Saldo disponible y Porcentaje de ejecución.
  2. Control previo y alertas de sobrecosto:
     - Al aprobar requisiciones de materiales u órdenes de reparación, contrastar contra el presupuesto disponible del centro de costo.
     - Alertas al alcanzar el 80% y 95% del presupuesto asignado.
     - Exigir autorización especial de Dirección/Administración cuando una solicitud supere el saldo presupuestario disponible.
     - Comparativas de variación presupuestaria y departamentos con sobrecostos recurrentes.
- **Criterios de Aceptación:**
  - Los gastos de materiales y reparaciones se imputan al presupuesto del departamento solicitante.
  - Se calculan los montos comprometidos y ejecutados en tiempo real.
  - Se alerta y exige autorización directiva ante solicitudes que excedan el presupuesto disponible.
  - Los reportes presupuestarios concuerdan con los asientos del libro diario contable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16678-16708; clave TASK-467; asignación única: Contabilidad -->
### [TASK-467] [ ] [F19-Task17] Optimización del ciclo de requisiciones internas y distribución de materiales
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E y Plan de Trabajo F19-17
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Productividad operativa, solicitudes multirrenglón, entregas parciales y confirmación de recepción)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`createMaterialRequisition`, `getMaterialRequisitions`, `deliverMaterialRequisition`)
  - `MaterialesSolicitudes`
  - `CatalogoArticulos`
  - `InventariosKardex`
  - `js/accounting.js`
- **Dependencias Expuestas:** `MaterialesSolicitudes`, `CatalogoArticulos`, `F19-Task05`, `F19-Task09`
- **Descripción del Alcance:**
  La entrega de materiales actual es un proceso directo de un solo paso que no contempla aprobaciones parciales, entregas diferidas por renglón ni confirmación formal de recepción por parte del docente solicitante.
  Requerimientos Funcionales Detallados:
  1. Ciclo de estados ampliado de solicitudes:
     - `Borrador`, `Enviada`, `PendienteAprobacion`, `AprobadaTotal`, `AprobadaParcial`, `EnPreparacion`, `EntregadaParcial`, `EntregadaTotal`, `Rechazada`, `Cancelada`.
     - Solicitudes multirrenglón con cantidades solicitadas, aprobadas y entregadas por cada artículo.
  2. Aprobaciones y entregas parciales:
     - Justificación de cantidades reducidas o partidas rechazadas.
     - Entregas escalonadas registrando entregas parciales y saldo pendiente de despacho.
     - Comprobante de entrega con firma o confirmación digital del solicitante.
     - Interfaz simplificada y amigable para docentes y personal escolar con historial de pedidos.
- **Criterios de Aceptación:**
  - Se admiten solicitudes con múltiples artículos en un solo envío.
  - Se pueden aprobar o entregar cantidades parciales conservando el remanente en seguimiento.
  - El solicitante puede confirmar la recepción física de sus materiales.
  - Las reservas de inventario se ajustan exactamente a las cantidades pendientes de entrega.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16709-16740; clave TASK-468; asignación única: Contabilidad -->
### [TASK-468] [ ] [F19-Task18] Optimización del inventario físico y conciliaciones periódicas por ubicación
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E, Sección F y Plan de Trabajo F19-18
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Auditoría continua, conteos cíclicos sin detener operaciones, conteos ciegos y precisión de inventario)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`createPhysicalInventoryCount`, `getPhysicalInventoryCounts`, `reconcilePhysicalCount`)
  - `InventariosConteosFisicos`
  - `InventariosKardex`
  - `js/accounting.js`
- **Dependencias Expuestas:** `InventariosConteosFisicos`, `InventariosKardex`, `F19-Task01`, `F19-Task05`, `F19-Task08`, `F19-Task11`
- **Descripción del Alcance:**
  La conciliación de conteo físico está implementada pero opera de forma general, sin soportar conteos cíclicos por estantería/bodega, hojas de conteo ciego ni doble verificación en discrepancias significativas.
  Requerimientos Funcionales Detallados:
  1. Conteos cíclicos y programados:
     - Programar conteos por almacén, ubicación física, categoría o muestra rotativa sin paralizar la operación institucional.
     - Modalidad de "Conteo Ciego" (la hoja de captura no revela las cantidades teóricas al operador para evitar sesgos).
     - Registro de doble conteo independiente ante discrepancias mayores al 5%.
  2. Flujo de aprobación y registro de diferencias:
     - Desglose de faltantes, sobrantes, artículos desubicados y lotes vencidos.
     - Justificación obligatoria para la aplicación de ajustes y autorización según permisos RBAC.
     - Generación automática de ajustes en Kardex y contabilidad valorizada únicamente tras la aprobación formal.
     - Indicadores de precisión de inventario (Exactitud de Registro de Inventario - ERI) por almacén.
- **Criterios de Aceptación:**
  - Se pueden programar conteos cíclicos aislados por almacén o categoría.
  - Las hojas de conteo ciego ocultan el saldo teórico al capturista.
  - Las discrepancias requieren justificación y aprobación directiva antes de ajustar existencias.
  - Se impide conciliar dos veces el mismo proceso de conteo físico.
  - Se generan indicadores de exactitud de inventario en reportes periódicos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16741-16773; clave TASK-469; asignación única: Contabilidad -->
### [TASK-469] [ ] [F19-Task19] Gestión integral de bajas patrimoniales, disposición y recuperación de valor
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección E, Sección G y Plan de Trabajo F19-19
- **Prioridad:** P3
- **Severidad/Clasificación:** Baja (Disposición final de bienes, cálculo de ganancia/pérdida contable, venta, donación o chatarrización)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`registerAssetDisposal`, `getAssetDisposals`)
  - `ActivosPatrimoniales`
  - `BajasBienes`
  - `AsientosContables`
  - `js/accounting.js`
- **Dependencias Expuestas:** `ActivosPatrimoniales`, `BajasBienes`, `AsientosContables`, `F19-Task04`, `F19-Task14`
- **Descripción del Alcance:**
  El registro actual de bajas asienta el acta en `BajasBienes` y marca `Disposed`, pero carece de un flujo estructurado de dictamen técnico previo, cálculo automático del valor en libros a la fecha de baja y reconocimiento contable de la ganancia o pérdida patrimonial resultante.
  Requerimientos Funcionales Detallados:
  1. Causas de baja y dictamen técnico:
     - Causas estructuradas: Obsolescencia, Daño irreparable, Pérdida/Extravío, Robo/Siniestro, Donación institucional, Venta de desecho, Destrucción autorizada.
     - Dictamen técnico previo con firmas de evaluación y reporte fotográfico obligatorio.
  2. Modalidad de disposición y efecto económico:
     - Registrar destino: donación, venta, reciclaje, destrucción o compensación de aseguradora.
     - En venta: registrar comprador, valor de rescate/venta, factura y medio de pago.
     - Integración con depreciación acumulada para determinar el valor neto en libros a la fecha efectiva de disposición.
     - Generar el asiento contable de baja por partida doble eliminando el costo de adquisición, cancelando la depreciación acumulada y reconociendo el ingreso por venta o la pérdida extraordinaria.
     - Bloquear definitivamente el activo dispuesto para impedir que vuelva a asignarse o a depreciarse.
- **Criterios de Aceptación:**
  - Toda baja patrimonial exige dictamen técnico y aprobación de Dirección.
  - Se calcula automáticamente el valor neto contable a la fecha exacta de disposición.
  - Se generan asientos contables por partida doble reconociendo pérdidas o recuperaciones.
  - Los bienes dados de baja quedan blindados contra reasignaciones o depreciaciones futuras.
  - El expediente histórico del bien permanece permanentemente accesible en los archivos de auditoría.
- **Estado:** [ ] Pendiente

---

