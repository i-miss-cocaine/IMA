# Informe de auditoría - Lote F1

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`

## Alcance

Se revisaron REQ-EXP-013 a REQ-EXP-015, considerando módulos posteriores de compras, transferencias, inventario físico y mantenimiento. Revisión estática; no se modificó código ni se accedió a datos productivos.

## REQ-EXP-013 - Caja, bancos, compras y cuentas por pagar
**Estado: Cumple parcialmente.** Existen movimientos de caja/banco, cierres, conciliación, órdenes de compra, recepciones parciales, three-way match, cuentas por pagar, pagos a proveedores y notas de crédito. Sin embargo, `closeCashSession` vuelve a sumar movimientos históricos porque no delimita una sesión ni marca movimientos cerrados; mezcla entradas/salidas de banco y efectivo. `performBankReconciliation` compara solo referencia e importe, sin cuenta/fecha/estado único. `recordAccountsPayableExpense` permite omitir la conciliación mediante payload y `verifyThreeWayMatch` usa `authRole` enviado por el cliente. `generatePurchaseOrderPDF` devuelve una URL nominal sin crear PDF. Hallazgos AUD-NG-138 y AUD-NG-139.

## REQ-EXP-014 - Nómina, asistencia y autoservicio
**Estado: Cumple parcialmente.** Hay cálculo por periodo, contratos, asistencia, horas extra, ausencias, deducciones y consulta de autoservicio. Pero las funciones de empleado confían en `authRole`, `authUserId` y `empleadoId` del payload, sin fijarlos a la identidad verificada; un empleado puede consultar o registrar datos de terceros. El recibo de nómina genera una URL nominal, no un PDF real.

Además, el cálculo legal está desactualizado frente a las fuentes oficiales revisadas:

- El código usa IHSS trabajador 3.5%, patrono 7.2% y techo L 10,317.38. El comunicado oficial IHSS revisado establece para 2025 5% trabajador, 8.7% patrono y techo L 11,903.13. [Comunicado IHSS](https://portalunico.iaip.gob.hn/ver_archivo/MjQyMDU5Ng%3D%3D)
- El código usa límites ISR de L 199,539.96 / 304,324.78 / 707,729.04; la tabla progresiva oficial SAR 2026 publica exento hasta L 228,324.32, 15% hasta L 348,154.10, 20% hasta L 809,660.75 y 25% en adelante. [SAR 2026](https://www.sar.gob.hn/2026/01/actualizacion-de-la-tabla-progresiva-2026/)
- El RAP informa 1.5% sobre el techo afectado y techos diferenciados por tipo de empresa. [RAP](https://www.rap.hn/planes-individuales-obligatorios/)
- No se encontró en el código el aporte patronal de 4% al Fondo de Reserva Laboral establecido en el artículo 4 del Decreto 47-2024. [La Gaceta, Decreto 47-2024](https://leyes.hn/gaceta/36545)

Hallazgos AUD-NG-140 y AUD-NG-141.

## REQ-EXP-015 - Inventario, activos y mantenimiento
**Estado: Cumple parcialmente.** Hay Kardex, ubicaciones, transferencias con confirmación física, requisiciones, conteos, mantenimiento, custodia y bajas. Se encontraron fallos en las transiciones: recepción de transferencia puede superar lo despachado; requisición puede entregarse sin aprobación; conciliación física puede repetirse y volver a ajustar stock; una orden de mantenimiento completada puede descontar repuestos otra vez; tipo de movimiento desconocido puede resetear saldo; baja patrimonial no es idempotente. Hallazgo AUD-NG-142.

## Tareas derivadas

- AUD-NG-138: corregir cierres de caja y conciliación bancaria por sesión/cuenta.
- AUD-NG-139: impedir bypass de autorización en cuentas por pagar y three-way match.
- AUD-NG-140: vincular autoservicio, asistencia y recibos de nómina a identidad verificada.
- AUD-NG-141: actualizar cálculo de nómina a parámetros legales hondureños vigentes y versionados.
- AUD-NG-142: hacer transaccionales y auditables movimientos de inventario, requisiciones y mantenimiento.

## Pruebas y límites

No se ejecutaron pruebas de caja, conciliación, nómina, inventario ni concurrencia. Las tasas se contrastaron con el comunicado IHSS disponible para 2025, la tabla SAR 2026, la página oficial RAP consultada y el Decreto 47-2024. No se encontró una actualización IHSS 2026 separada durante esta revisión; validar los parámetros anuales con contabilidad antes de producción.

## Continuidad

- REQ-EXP-013 a REQ-EXP-015 inspeccionadas.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- Siguiente sublote: F2 (REQ-EXP-016 en adelante).
