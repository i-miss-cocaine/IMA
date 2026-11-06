# Informe de auditoría - Lote E2A

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`

## Alcance

Se revisaron REQ-EXP-009 y REQ-EXP-010, incluyendo los cambios posteriores en ACADEMIC y ACCOUNTING. La revisión fue estática; no se modificó código ni se accedió a datos productivos.

## REQ-EXP-009 - Matrícula, rematrícula y cargos
**Estado: Cumple parcialmente.** La conversión de admisión llama a `registerStudentEnrollment`, que crea la matrícula y puede generar el cargo inicial. Existe un flujo más reciente `createStudentEnrollment`/`renewStudentEnrollment` con LockService y prevención de duplicados por estudiante/año, pero no crea ni vincula cargos financieros. Hay dos rutas con comportamiento distinto. `getStudentEnrollmentHistory` devuelve matrículas y cargos, pero no valida `tienePermisoFinanciero`; `js/student.js` usa esos datos para mostrar un saldo en el badge. La aplicación de becas/descuentos no está limitada al periodo de vigencia y `getStudentAccountStatement` modifica cargos al consultarse. Hallazgos AUD-NG-129 y AUD-NG-130.

## REQ-EXP-010 - Contabilidad institucional
**Estado: Cumple parcialmente.** ACCOUNTING contiene conceptos, tarifas, generación por lote, estados de cuenta, pagos parciales, reversos y anulaciones con motivo. No obstante, `SERVICE_URLS.ACCOUNTING` usa un endpoint placeholder y el registro lo marca ACTIVE; no se observó página HTML que cargue `js/accounting.js`. El preview de cargos lee mal las columnas de Matriculas, usa claves de duplicado sin periodo y aplica 1200 como tarifa por defecto. `recordStudentPayment` no verifica que el cargo pertenezca al pagador, no limita sobrepagos y la idempotencia CacheService no reserva la clave atómicamente. Hallazgos AUD-NG-131 a AUD-NG-133.

## Hallazgos técnicos principales

- **Matrícula:** el flujo nuevo de rematrícula no genera cargos; el flujo de conversión sí. Consolidar ambos con una clave estudiante+periodo+concepto.
- **Permiso financiero:** el historial de matrícula devuelve cargos sin validar el permiso; el estado de cuenta ejecuta una mutación al aplicar becas.
- **Lotes mensuales:** el esquema de Matriculas es de 11 columnas; el preview interpreta índices como si el año/ciclo estuviera en r[4] y la exoneración en r[11]. La tarifa 1200 no debe ser un fallback silencioso.
- **Pagos:** validar propiedad del cargo, saldo pendiente y claves idempotentes atómicas.
- **Integración:** el endpoint ACCOUNTING configurado es un placeholder; el código de backend no equivale a un servicio desplegado y conectado.

## Tareas derivadas

- AUD-NG-129: unificar matrícula y rematrícula con cargos financieros por periodo.
- AUD-NG-130: respetar permisos financieros y aplicar beneficios por periodo sin mutar consultas.
- AUD-NG-131: configurar y verificar el endpoint real del microservicio ACCOUNTING.
- AUD-NG-132: corregir el motor de cargos mensuales y su deduplicación por periodo.
- AUD-NG-133: asegurar integridad e idempotencia atómica de pagos y abonos.

## Continuidad

- REQ-EXP-009 y REQ-EXP-010 inspeccionadas.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- No se ejecutaron pruebas ni se accedió a datos productivos.
- Siguiente sublote: E2B (REQ-EXP-011 a REQ-EXP-012).
