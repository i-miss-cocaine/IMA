# Informe de auditoría - Lote E2B

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`

## Alcance

Se revisaron REQ-EXP-011 y REQ-EXP-012, y se contrastó la identidad institucional del recibo generado con el branding revisado en E1. Revisión estática, sin pruebas de producción.

## REQ-EXP-011 - Portal de pagos y recibos PDF
**Estado: Cumple parcialmente.** El backend tiene `uploadPaymentVoucher`, `getPaymentVouchers`, `reviewPaymentVoucher` y `generatePaymentReceiptPDF`. Pero el portal estudiantil no conecta el flujo: `student-dashboard.html` contiene `tab-financial` y `voucher-modal`, pero `student.js` no implementa handlers para ellos; solo conecta actividades y progreso. `js/accounting.js` no se carga desde las páginas HTML actuales. El upload backend comparte el archivo con `ANYONE_WITH_LINK`; el recibo usa un ID aleatorio de seis dígitos y `generatePaymentReceiptPDF` devuelve JSON, no un PDF ni un enlace descargable. Hallazgos AUD-NG-134 y AUD-NG-136.

## REQ-EXP-012 - Facturación fiscal hondureña
**Estado: Cumple parcialmente.** Existe separación entre `PagosAbonos` (recibos internos) y `FacturasFiscales` (documentos fiscales), con `AutorizacionesCAI` y un vínculo opcional `reciboCajaId`. Sin embargo, la configuración del CAI no valida rangos/solapamientos; la emisión acepta CAI inactivo si se envía explícitamente, permite sobrescribir rango, vencimiento y número desde el cliente, no verifica que el número sea el siguiente correlativo ni que el recibo asociado sea un pago confirmado no facturado. `getFiscalInvoices` permite devolver todas las facturas o buscar por facturaId sin validar titular. Hallazgos AUD-NG-135 y AUD-NG-136.

## Nota de identidad institucional

Las páginas principales revisadas usan New Generation Bilingual School and Institute, pero `generatePaymentReceiptPDF` devuelve `institucion: "New Generation Christian Academy"`. Se registró AUD-NG-137 para centralizar la marca en documentos.

## Hallazgos derivados

- AUD-NG-134: conectar el portal financiero estudiantil y generar recibos PDF correlativos.
- AUD-NG-135: endurecer CAI, rango y correlativo de facturación fiscal hondureña.
- AUD-NG-136: restringir estados de cuenta, comprobantes, recibos y facturas a la familia autorizada.
- AUD-NG-137: unificar el nombre institucional en recibos y documentos financieros.

Además, el hallazgo AUD-NG-127 se amplía al microservicio ACCOUNTING: comparte fallback predecible de AUTH_TOKEN_SECRET y DEBUG_MODE está habilitado.

## Pruebas y límites

No se ejecutaron pruebas de emisión fiscal, concurrencia, PDF, carga de comprobantes ni control de acceso. No se accedió a datos productivos ni a la configuración real de CAI/SAR. La revisión confirma la separación de estructuras de datos, no certifica cumplimiento tributario ante SAR.

## Continuidad

- REQ-EXP-011 y REQ-EXP-012 inspeccionadas.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- Siguiente lote: F (REQ-EXP-013 en adelante).
