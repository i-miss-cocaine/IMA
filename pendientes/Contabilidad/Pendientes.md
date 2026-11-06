# Pendientes del departamento: Contabilidad

> Migración íntegra desde `Pendientes.md` (raíz del repositorio). Fuente consultada en la rama `NG_beta_0.0.0.1_work`, blob SHA `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`. Los bloques de tareas se conservaron completos, incluidos identificadores, descripciones, criterios, severidad y estados. No editar la fuente para mantener esta distribución: los cambios futuros de tareas se registran en los archivos departamentales.

**Responsabilidad de clasificación:** Cobros, pagos, facturación, tesorería, planillas, inventarios, activos y proveedores.

**Tareas migradas:** 6

---

### [REQ-EXP-010] Módulo Contable y Financiero - Conceptos, Mensualidades y Cobros (Sección 9.1 - 9.3)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 9.1 - 9.3).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `js/config.js`
- **Dependencias Expuestas:** Cuentas por cobrar, importes por nivel/grado, pagos parciales.
- **Descripción del Alcance:** Configurar conceptos de cobro (mensualidades, matrícula, libros, transporte), generar estados de cuenta y registrar pagos por múltiples métodos.
- **Criterios de Aceptación:** Control de saldos pendientes, registro de abonos y trazabilidad de ajustes.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-011] Portal Estudiantil de Pagos y Recibos Únicos en PDF (Sección 9.4 - 9.5)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 9.4 - 9.5).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `student-dashboard.html`, `js/student.js`, `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Comprobantes adjuntos, numeración correlativa de recibos.
- **Descripción del Alcance:** Permitir consulta de vencimientos, carga de comprobantes de transferencia y generación/descarga de recibos PDF únicos correlativos.
- **Criterios de Aceptación:** Emisión de PDF de recibo con numeración correlativa no duplicable para pagos confirmados.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-012] Módulo de Facturación Fiscal Hondureña (Sección 9.6 / 10.3)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 9.6 / 10.3).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Módulo fiscal independiente separado del recibo interno.
- **Descripción del Alcance:** Incorporar gestión de documentos fiscales tributarios aplicables en Honduras, con trazabilidad hacia cargos y cobros sin confundir el recibo interno con la factura fiscal.
- **Criterios de Aceptación:** Separación arquitectónica estricta entre control financiero interno y facturación fiscal.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-013] Gestión de Caja, Bancos, Ingresos y Egresos (Sección 9.7 / 10.1 - 10.2)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 9.7 / 10.1 - 10.2).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Apertura/cierre de caja, conciliaciones bancarias, cuentas por pagar/cobrar.
- **Descripción del Alcance:** Registrar movimientos de caja chica, depósitos bancarios, proveedores, egresos e informes de conciliación periódica.
- **Criterios de Aceptación:** Cierres de caja cuadrados con trazabilidad completa de ingresos y gastos.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-014] Módulo de Planillas, Deducciones y Asistencia de Personal (Sección 11)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 11).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Expedientes laborales, salarios, deducciones de ley en Honduras (IHSS, RAP, ISR).
- **Descripción del Alcance:** Generar planillas periódicas, calcular horas extras, bonificaciones, deducciones, control de asistencia (entradas/salidas/tardanzas) e informes de costos laborales.
- **Criterios de Aceptación:** Comprobantes de pago de planilla generados y acceso restricted estrictamente por rol.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-015] Módulo de Inventarios, Activos y Control de Proveedores (Sección 12)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 12).
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Productos, materiales, mobiliario, existencias mínimas.
- **Descripción del Alcance:** Controlar entradas, salidas, préstamos, devoluciones, bajas y conteos físicos de consumibles y activos fijos de la institución.
- **Criterios de Aceptación:** Kardex de inventario actualizado y alertas de stock mínimo.
- **Estado:** [ ] Pendiente
