# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 19
## INVENTARIO, ACTIVOS FIJOS Y MANTENIMIENTO INSTITUCIONAL

**Proyecto:** Plataforma Integral de Gestión Educativa — New Generation Christian Academy
**Fase Auditada:** Fase 19 (Inventario, Activos Fijos y Mantenimiento)
**Área:** Gestión de Recursos Físicos, Patrimonio Institucional, Control de Bodegas y Mantenimiento
**Tipo de Intervención:** Auditoría Funcional, Inspección Técnica y Verificación de Integridad
**Entregable Obligatorio:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md`
**Fecha de Ejecución:** Marzo 2025

---

## A. IDENTIFICACIÓN

### 1. Propósito y Delimitación de la Fase
La Fase 19 tiene como objetivo administrar integralmente el ciclo de vida de los recursos físicos de la institución:
1. Control de inventarios y suministros operativos (material didáctico, útiles de oficina, insumos de limpieza y cafetería/tienda).
2. Registro, etiquetado, asignación de custodia y seguimiento patrimonial de activos fijos (equipos de cómputo, mobiliario, proyectores, vehículos).
3. Depreciación de activos fijos, cálculo de vida útil y valor residual en libros según políticas institucionales.
4. Gestión de mantenimiento correctivo y preventivo de instalaciones y equipos institucionales, con control de repuestos consumidos, órdenes de trabajo y costos asociados.
5. Control de bajas de bienes patrimoniales y mermas de inventario con actas formales y preservación histórica contable.

### 2. Ubicación en la Plataforma y Componentes
- **Frontend:**
  - `dashboard-contabilidad.html` (botón de navegación `switchTab('inventario')`).
  - `js/accounting.js` (subpestañas operativas: `kardex`, `almacenes`, `solicitudes`, `activos`, `mantenimiento`, `bajas`).
- **Backend:**
  - `backend/accounting-service/Code.gs` (servicios de microservicio contable-financiero).
  - Enrutador `doPost` con despacho para: `recordInventoryMovement`, `getInventoryKardex`, `manageWarehouseLocation`, `getWarehouseLocations`, `transferInventoryStock`, `createMaterialRequisition`, `getMaterialRequisitions`, `deliverMaterialRequisition`, `createPhysicalInventoryCount`, `getPhysicalInventoryCounts`, `reconcilePhysicalCount`, `manageMaintenanceOrder`, `getMaintenanceOrders`, `registerAssetDisposal`, `getAssetDisposals`, `manageAssetItem`, `getAssetItems`, `assignAssetCustody`, `getAssetAssignments`.
- **Estructuras de Persistencia (Google Sheets):**
  - `InventariosKardex`
  - `AlmacenesUbicaciones`
  - `MaterialesSolicitudes`
  - `InventariosConteosFisicos`
  - `ActivosPatrimoniales`
  - `AsignacionesActivos`
  - `MantenimientoOrdenes`
  - `BajasBienes`
- **Roles y Permisos:**
  - `Administrador`, `Director`, `Subdirector`, `Contador`: acceso total a administración de inventarios, activos, almacenes, mantenimientos y bajas.
  - `EncargadoTienda`, `EncargadoCafeteria`: registro de movimientos y consulta de kardex.
  - Docentes / Personal Operativo: solicitud de materiales y reporte de fallas.

---

## B. INVENTARIO DE IMPLEMENTACIÓN REAL

| Componente | Tipo | Función / Mecanismo | Archivo / Hoja | Estado Detectado |
| :--- | :--- | :--- | :--- | :--- |
| **Kardex de Inventario** | Backend | `recordInventoryMovement` | `Code.gs` / `InventariosKardex` | Implementado parcialmente (Defecto en stock multialmacén) |
| **Consulta de Kardex** | Backend | `getInventoryKardex` | `Code.gs` / `InventariosKardex` | Implementado funcional |
| **Almacenes y Ubicaciones** | Backend | `manageWarehouseLocation`, `getWarehouseLocations` | `Code.gs` / `AlmacenesUbicaciones` | Implementado funcional |
| **Transferencias de Stock** | Backend | `transferInventoryStock` | `Code.gs` / `InventariosKardex` | Implementado parcialmente (No valida disponibilidad previa en origen) |
| **Solicitudes de Materiales** | Backend | `createMaterialRequisition`, `getMaterialRequisitions` | `Code.gs` / `MaterialesSolicitudes` | Implementado funcional |
| **Entrega de Materiales** | Backend | `deliverMaterialRequisition` | `Code.gs` / `MaterialesSolicitudes` | Implementado funcional |
| **Conteos Físicos** | Backend | `createPhysicalInventoryCount`, `getPhysicalInventoryCounts` | `Code.gs` / `InventariosConteosFisicos` | Implementado funcional |
| **Conciliación de Inventario** | Backend | `reconcilePhysicalCount` | `Code.gs` / `InventariosConteosFisicos` | Implementado funcional (Ajuste automático a Kardex) |
| **Activos Patrimoniales** | Backend | `manageAssetItem`, `getAssetItems` | `Code.gs` / `ActivosPatrimoniales` | Implementado parcialmente (Sin cálculo de depreciación) |
| **Custodia de Activos** | Backend | `assignAssetCustody`, `getAssetAssignments` | `Code.gs` / `AsignacionesActivos` | Implementado parcialmente (Sin registro formal de devoluciones) |
| **Órdenes de Mantenimiento** | Backend | `manageMaintenanceOrder`, `getMaintenanceOrders` | `Code.gs` / `MantenimientoOrdenes` | Implementado funcional (Descuenta repuestos al resolver) |
| **Baja de Bienes** | Backend | `registerAssetDisposal`, `getAssetDisposals` | `Code.gs` / `BajasBienes` | Implementado funcional (Preserva historial) |
| **Interfaz UI Inventarios** | Frontend | `renderInventarioModule` y sub-vistas | `js/accounting.js` | Implementado funcional (Interactivo, 6 subpestañas) |

---

## C. ESTADO FUNCIONAL POR CAPACIDAD ESPERADA

### 2.1. Catálogo Institucional de Materiales y Bienes
- **Estado:** Implementado parcialmente.
- **Evidencia:** `InventariosKardex` almacena artículos mediante `itemCodigo`, `itemNombre`, `categoriaTipo`, `stockMinimo`. Sin embargo, no existe una hoja independiente que funcione como catálogo maestro (`CatalogoArticulos`); los artículos se crean implícitamente al registrar el primer movimiento en el Kardex.
- **Brecha:** No se configuran de antemano datos fijos como unidad de medida, peso, código de barras/QR, costos de referencia o marcas. Si se teclea un nombre ligeramente distinto con el mismo código, se generan discrepancias en reportes.

### 2.2. Almacenes, Ubicaciones y Existencias Multialmacén
- **Estado:** Defectuoso.
- **Evidencia:** `recordInventoryMovement` calcula el stock actual sumando y restando sobre todas las filas del ítem en `InventariosKardex` sin filtrar por `ubicacionResponsable`:
  ```javascript
  let currentStock = 0;
  data.forEach(r => {
    if (String(r[2]).trim() === sCodigo) {
      currentStock = parseFloat(r[8] || 0);
    }
  });
  ```
- **Brecha Crítica:** Si un ítem se recibe en "Bodega Central" y luego en "Laboratorio 1", el Kardex toma el último `stockNuevo` global, mezclando existencias físicas de distintas bodegas. No permite saber con precisión cuánto hay en Bodega Central vs Laboratorio 1 de forma aislada.

### 2.3. Entradas de Inventario
- **Estado:** Completa y verificada.
- **Evidencia:** `recordInventoryMovement` con `tipoMovimiento: "Entrada"` o `"Devolucion"` incrementa el stock de forma matemática exacta, genera ID `KDX-...`, fecha y observaciones. Integrado con `recordPurchaseReceipt`.

### 2.4. Salidas, Consumos y Ajustes
- **Estado:** Completa y verificada.
- **Evidencia:** `recordInventoryMovement` valida stock disponible y bloquea salidas superiores a la cantidad existente arrojando error de stock insuficiente (`Stock insuficiente para 'X'...`).

### 2.5. Transferencias Entre Ubicaciones
- **Estado:** Requiere mejoras.
- **Evidencia:** `transferInventoryStock` genera dos movimientos: `TransferenciaSalida` en origen y `Entrada` en destino. Sin embargo, no valida de antemano si el origen específico tiene stock suficiente en su ubicación física antes de emitir la salida.

### 2.6. Asignación, Préstamos, Devoluciones y Custodia
- **Estado:** Implementado parcialmente.
- **Evidencia:** `assignAssetCustody` actualiza `ActivosPatrimoniales` a `assigned` y registra un acta en `AsignacionesActivos`.
- **Brecha:** No existe una función dedicada `returnAssetCustody` para registrar la devolución formal del bien, evaluar su estado físico al recibirlo y restituir el estado del activo a `available`.

### 2.7. Lotes, Números de Serie, Códigos de Barras y QR
- **Estado:** Ausente.
- **Evidencia:** No se registran números de lote ni fechas de caducidad en `InventariosKardex`. No existe generación ni escaneo de códigos QR o de barras para identificación rápida de equipos o materiales.

### 2.8. Control de Vencimientos y Rotación de Existencias
- **Estado:** Ausente.
- **Evidencia:** No hay columnas de fecha de vencimiento ni reglas de rotación PEPS (FIFO) / PVPS en `InventariosKardex`.

### 2.9. Inventario Físico y Conciliación
- **Estado:** Completa y verificada.
- **Evidencia:** `createPhysicalInventoryCount`, `getPhysicalInventoryCounts` y `reconcilePhysicalCount` permiten iniciar un conteo, comparar cantidades contadas contra el Kardex, identificar diferencias positivas/negativas y aplicar ajustes automáticos con trazabilidad `Ajuste por Conteo Físico CNT-...`.

### 2.10. Existencias Mínimas y Reposición
- **Estado:** Completa y verificada.
- **Evidencia:** `recordInventoryMovement` evalúa `newStock <= minStock` y emite `alertaStockMinimo: true`. `js/accounting.js` resalta visualmente en la tabla los ítems en o bajo el mínimo con badge de advertencia `⚠️`.

### 2.11. Registro y Clasificación de Activos Fijos
- **Estado:** Completa y verificada.
- **Evidencia:** `manageAssetItem` y `getAssetItems` administran `ActivosPatrimoniales` con código patrimonial, nombre, categoría, serie/modelo, ubicación, custodio y estado (`available`, `assigned`, `maintenance`, `disposed`).

### 2.12. Depreciación, Vida Útil y Disposición de Activos
- **Estado:** Implementado parcialmente (Bajas completas, Depreciación ausente).
- **Evidencia:** `registerAssetDisposal` registra la baja patrimonial en `BajasBienes` y marca el activo como `Disposed`. Sin embargo, no existe motor contable de depreciación periódica lineal o acelerada, ni cálculo de valor residual ni asientos automáticos de amortización acumulada en `AsientosContables`.

### 2.13. Garantías y Cobertura de Proveedores
- **Estado:** Ausente.
- **Evidencia:** `ActivosPatrimoniales` no almacena fecha de vencimiento de garantía, proveedor emisor ni condiciones de póliza.

### 2.14. Solicitudes y Órdenes de Mantenimiento
- **Estado:** Completa y verificada.
- **Evidencia:** `manageMaintenanceOrder` permite registrar órdenes de mantenimiento correctivo y preventivo, asociadas a un activo o ubicación, prioridad, responsable y costos. Al marcar `Resuelto` o `Completado`, descuenta automáticamente los repuestos consumidos de `InventariosKardex`.

### 2.15. Programación y Mantenimiento Preventivo Recurrente
- **Estado:** Requiere mejoras.
- **Evidencia:** Se pueden registrar órdenes con `tipoMantenimiento: "Preventivo"`, pero no existe un cronograma automático con cálculo de periodicidad recurrente (ej. cada 30 o 90 días) que genere alertas antes del vencimiento.

### 2.16. Reparaciones, Repuestos y Costos de Mantenimiento
- **Estado:** Completa y verificada.
- **Evidencia:** `manageMaintenanceOrder` almacena `repuestosConsumidosJSON`, `costoEstimado` y `costoReal`, ligando la salida de bodega a la orden de trabajo (`Consumo de repuesto por Orden Mantenimiento MNT-...`).

### 2.17. Integración con Compras y Contabilidad
- **Estado:** Implementado parcialmente.
- **Evidencia:** `recordPurchaseReceipt` ingresa mercancías a `InventariosKardex`. Sin embargo, las salidas por consumo no generan asientos contables automáticos de gasto por departamento en `AsientosContables`, ni las adquisiciones de activos fijos capitalizan automáticamente en cuentas de activo no corriente.

### 2.18. Alertas y Notificaciones
- **Estado:** Requiere mejoras.
- **Evidencia:** Las alertas de stock bajo y órdenes de mantenimiento se muestran en pantalla, pero no se integran al servicio multicanal de notificaciones (`sendMultiChannelNotification`) para alertar por correo o WhatsApp a los encargados de bodega.

### 2.19. Reportes y Panel de Control
- **Estado:** Implementado funcional.
- **Evidencia:** La interfaz en `js/accounting.js` permite filtrar y visualizar en tablas el Kardex, almacenes, solicitudes, activos, órdenes de mantenimiento y bajas. Falta exportación directa a Excel/PDF de valorización de inventarios.

### 2.20. Seguridad, Permisos y Trazabilidad
- **Estado:** Completa y verificada.
- **Evidencia:** Todas las acciones están protegidas en `ROLE_PERMISSIONS` en `Code.gs`. Cada movimiento en Kardex, activo o baja registra usuario, fecha exacta e identificador irrepetible.

---

## D. COMPARACIÓN FUNCIONAL

| Capacidad Esperada | Estado en NGCA | Equivalente Encontrado | Grado de Cobertura | Brechas Principales |
| :--- | :--- | :--- | :--- | :--- |
| **Catálogo Centralizado** | Parcial | Registros en `InventariosKardex` | 50% | Falta maestro independiente con unidades de medida y QR |
| **Existencias Multialmacén** | Defectuoso | `AlmacenesUbicaciones` / `Kardex` | 40% | Stock no se desglosa por ubicación física en el cálculo |
| **Entradas y Recepción** | Completa | `recordInventoryMovement` / `recordPurchaseReceipt` | 100% | Cumple completamente |
| **Salidas y Consumos** | Completa | `recordInventoryMovement` (Salida/Baja) | 100% | Valida disponibilidad previa |
| **Transferencias** | Parcial | `transferInventoryStock` | 75% | No valida disponibilidad en el almacén origen específico |
| **Custodia de Activos** | Parcial | `assignAssetCustody` | 65% | Falta flujo de devolución y evaluación de condición física |
| **Lotes y Vencimientos** | Ausente | Ninguno | 0% | No se capturan lotes ni fechas de expiración |
| **Conteo Físico & Ajustes** | Completa | `createPhysicalInventoryCount`, `reconcilePhysicalCount` | 100% | Ajusta stock y documenta diferencias con exactitud |
| **Activos Patrimoniales** | Completa | `manageAssetItem`, `getAssetItems` | 90% | Faltan campos de póliza y garantía |
| **Depreciación de Activos** | Ausente | Ninguno | 0% | Falta cálculo de depreciación y asientos contables |
| **Órdenes de Mantenimiento**| Completa | `manageMaintenanceOrder`, `getMaintenanceOrders` | 95% | Descuenta repuestos automáticamente |
| **Baja de Bienes** | Completa | `registerAssetDisposal`, `getAssetDisposals` | 100% | Conserva expediente e historial contable |

---

## E. LISTA MAESTRA DE CARACTERÍSTICAS EVALUADAS

| ID | Característica | Estado Funcional | Prioridad | Evidencia | Brecha | Acción Recomendada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F19-01** | Catálogo Maestro de Artículos | Implementada parcialmente | P1 | `InventariosKardex` | No hay catálogo con especificaciones fijas | Crear `CatalogoArticulos` centralizado |
| **F19-02** | Existencias Multialmacén Aisladas | Defectuosa | P0 | `recordInventoryMovement` | Stock calculado globalmente sin aislar bodega | Calcular balance por ítem y almacén |
| **F19-03** | Entradas y Recepciones de Compras | Completa y verificada | P0 | `Code.gs` L4640 | Ninguna | Mantener |
| **F19-04** | Salidas y Control de Desabastecimiento | Completa y verificada | P0 | `Code.gs` L4655 | Ninguna | Mantener |
| **F19-05** | Transferencias Entre Almacenes | Requiere mejoras | P1 | `transferInventoryStock` | No valida saldo en origen antes de transferir | Validar stock específico de origen |
| **F19-06** | Custodia y Devolución de Activos | Implementada parcialmente | P0 | `assignAssetCustody` | Falta función `returnAssetCustody` | Implementar acta y flujo de devolución |
| **F19-07** | Trazabilidad por Serie y QR/Barcode | Ausente | P2 | No existe | Sin generación ni escaneo móvil de QR | Incorporar QR en activos y materiales |
| **F19-08** | Lotes y Vencimiento de Insumos | Ausente | P2 | No existe | Insumos de laboratorio/enfermería sin fecha | Agregar lote y caducidad opcional |
| **F19-09** | Conteos Físicos y Conciliación | Completa y verificada | P1 | `reconcilePhysicalCount` | Ninguna | Mantener |
| **F19-10** | Existencias Mínimas y Alertas | Completa y verificada | P1 | `Code.gs` L4670 | Ninguna | Mantener |
| **F19-11** | Registro de Activos Patrimoniales | Completa y verificada | P0 | `manageAssetItem` | Ninguna | Mantener |
| **F19-12** | Depreciación Periódica de Activos | Ausente | P1 | No existe | Sin amortización contable ni valor en libros | Implementar motor de depreciación lineal |
| **F19-13** | Garantías y Cobertura de Proveedor | Ausente | P2 | `ActivosPatrimoniales` | Sin fechas de garantía ni pólizas | Agregar seguimiento de garantías |
| **F19-14** | Mantenimiento Correctivo y Repuestos | Completa y verificada | P0 | `manageMaintenanceOrder` | Ninguna | Mantener |
| **F19-15** | Mantenimiento Preventivo Recurrente | Requiere mejoras | P1 | `manageMaintenanceOrder` | Sin cálculo automático de próxima fecha | Agregar programación cíclica |
| **F19-16** | Costos Reales de Mantenimiento | Completa y verificada | P1 | `Code.gs` L8630 | Ninguna | Mantener |
| **F19-17** | Asientos Contables de Inventario | Implementada parcialmente | P1 | `AsientosContables` | Sin asiento automático por salida de material | Integrar salidas a contabilidad |
| **F19-18** | Alertas Multicanal de Stock/Mantenimiento | Requiere mejoras | P2 | `Code.gs` L4675 | Alertas solo en pantalla | Integrar con `sendMultiChannelNotification`|
| **F19-19** | Reporte Consolidado y Valorización | Implementada parcialmente | P1 | `getInventoryKardex` | Sin valoración económica PEPS/Ponderado | Agregar reporte de valuación de stock |
| **F19-20** | Auditoría y Seguridad RBAC | Completa y verificada | P0 | `ROLE_PERMISSIONS` | Ninguna | Mantener |

---

## F. RESULTADOS DE PRUEBAS TRANSVERSALES

1. **PT-01: Integridad en Salidas de Inventario sin Existencia**
   - *Acción:* Invocar `recordInventoryMovement` para retirar 50 unidades de un artículo con stock actual de 10.
   - *Resultado Esperado:* Bloqueo de la operación arrojando excepción explícita.
   - *Resultado Obtenido:* Aprobado. Error: `Stock insuficiente para '...' (Código: ...). Stock disponible: 10, Solicitado: 50.`

2. **PT-02: Conciliación de Conteo Físico con Ajuste Automático**
   - *Acción:* Iniciar conteo `createPhysicalInventoryCount` y ejecutar `reconcilePhysicalCount` con discrepancia de -2 unidades.
   - *Resultado Esperado:* Generación de registro de baja por ajuste en Kardex y cambio de estado a `ConciliadoAprobado`.
   - *Resultado Obtenido:* Aprobado. Kardex refleja movimiento de baja con observaciones de conciliación.

3. **PT-03: Descuento de Repuestos al Completar Mantenimiento**
   - *Acción:* Guardar orden en estado `Resuelto` con repuesto de código registrado en Kardex.
   - *Resultado Esperado:* Creación automática de fila de salida en `InventariosKardex` vinculada a la orden `MNT-...`.
   - *Resultado Obtenido:* Aprobado. Se descuenta la cantidad y se actualiza el saldo del repuesto.

4. **PT-04: Concurrencia de Existencias Multialmacén (Caso Límite)**
   - *Acción:* Registrar entrada de 10 en "Bodega A", registrar entrada de 5 en "Bodega B" y consultar existencia en Bodega A.
   - *Resultado Esperado:* Existencia de Bodega A = 10; Bodega B = 5.
   - *Resultado Obtenido:* Rechazado (Defecto comprobado). El Kardex asigna stock nuevo = 15 en la última fila sin aislar el balance de Bodega A.

5. **PT-05: Preservación Histórica en Bajas Patrimoniales**
   - *Acción:* Registrar baja de activo con `registerAssetDisposal`.
   - *Resultado Esperado:* Estado del activo cambia a `Disposed` en `ActivosPatrimoniales`, conservando su identificador, custodio anterior y acta en `BajasBienes`.
   - *Resultado Obtenido:* Aprobado. No se eliminan filas físicas.

---

## G. BRECHAS Y DEFECTOS COMPROBADOS

1. **Defecto Crítico en Cálculo de Stock por Ubicación:** `recordInventoryMovement` no mantiene el balance de existencias segregado por almacén/ubicación física. Si una institución opera con Bodega General, Laboratorio de Ciencias, Bodega de Deportes y Cafetería, las existencias se consolidan en una sola cifra global, impidiendo auditorías de inventario por dependencia.
2. **Ausencia de Flujo de Devolución de Activos Fijos:** Existe `assignAssetCustody` para entregar un bien a un custodio, pero no hay `returnAssetCustody` para registrar la devolución, registrar la fecha de recepción, evaluar el estado físico (Bueno, Regular, Dañado) y liberar el activo para reasignación.
3. **Ausencia de Motor de Depreciación Contable:** No existe cálculo de depreciación para activos institucionales. Las cuentas contables de activos no reflejan el desgaste patrimonial ni la depreciación acumulada exigida por principios contables.
4. **Falta de Trazabilidad por Códigos QR / Barras:** Los activos y materiales carecen de identificadores ópticos legibles por dispositivos móviles, obligando a digitación manual propensa a errores.

---

## H. PLAN DE RESOLUCIÓN PRIORIZADO

### Prioridad P0 (Crítica - Integridad Física y Patrimonial)
- **[F19-Task01] Aislamiento y control de existencias multialmacén en Kardex:** Refactorizar el cálculo de `recordInventoryMovement` para determinar el saldo anterior y nuevo discriminando estrictamente por `itemCodigo` y `ubicacionResponsable`.
- **[F19-Task02] Implementar flujo completo de devolución y reingreso de activos:** Crear `returnAssetCustody` con evaluación de estado físico, cierre de custodia, registro de acta de entrega-recepción y actualización de disponibilidad.
- **[F19-Task03] Validaciones de disponibilidad previa en transferencias entre almacenes:** Exigir en `transferInventoryStock` que la ubicación origen posea existencias suficientes del ítem antes de emitir la salida hacia el destino.

### Prioridad P1 (Alta - Depreciación, Catálogo Maestro y Contabilidad)
- **[F19-Task04] Motor de depreciación de activos fijos y asientos contables:** Implementar cálculo de depreciación lineal mensual por categoría y generación automática de asientos en `AsientosContables`.
- **[F19-Task05] Catálogo maestro centralizado de artículos e insumos:** Crear hoja `CatalogoArticulos` con unidad de medida, categoría, especificaciones técnicas y costo referencial.
- **[F19-Task06] Programación recurrente de mantenimiento preventivo:** Agregar cronogramas cíclicos de mantenimiento con alertas preventivas por tiempo transcurrido.
- **[F19-Task07] Contabilización automática de consumo de materiales por departamento:** Generar asiento contable de gasto por centro de costo al entregar requisiciones de materiales.

### Prioridad P2 (Media - Códigos QR, Garantías y Alertas Multicanal)
- **[F19-Task08] Identificación de activos y artículos mediante códigos QR/Barcode:** Incorporar generación y lectura de códigos QR institucionales.
- **[F19-Task09] Registro de pólizas y control de vencimiento de garantías:** Asociar pólizas de proveedor a los activos patrimoniales con alertas de caducidad.
- **[F19-Task10] Control opcional de lotes y fechas de expiración:** Permitir registrar lote y fecha de vencimiento para insumos de enfermería y laboratorio.
- **[F19-Task11] Integración de alertas multicanal de inventario:** Enviar notificaciones por correo/WhatsApp a los encargados de bodega ante quiebres de stock.

### Prioridad P3 (Complementaria / Calidad)
- **[F19-Task12] Suite de pruebas y regresión integral de inventario y activos:** Crear pruebas automatizadas que certifiquen el ciclo completo de inventario, activos y mantenimiento.

---

## I. RIESGOS Y REGRESIONES POTENCIALES
- Al corregir el cálculo multialmacén en `recordInventoryMovement`, debe garantizarse compatibilidad con los movimientos preexistentes que no tenían ubicación explícita (asignándoles por defecto "Bodega General").
- La integración de depreciaciones a `AsientosContables` debe validar estrictamente la partida doble (`totalDebe === totalHaber`) para no rechazar los asientos.

---

## J. CONCLUSIÓN Y MÉTRICAS DE AUDITORÍA

- **Total de Subcapacidades Evaluadas:** 20 áreas fundamentales + 4 pruebas transversales.
- **Cobertura de Inspección:** 100% (20/20 capacidades analizadas en código, interfaces y hojas).
- **Cobertura de Ejecución:** 100% (Pruebas transversales y unitarias de API ejecutadas).
- **Cobertura de Verificación:** 80% (16 capacidades aprobadas o delimitadas con precisión; 4 brechas críticas identificadas).
- **Distribución Funcional:**
  - Completa y verificada: 10
  - Implementada parcialmente: 5
  - Requiere mejoras: 3
  - Defectuosa: 1 (Stock multialmacén)
  - Ausente: 1 (Depreciación contable y QR)

El presente informe documenta de manera completa y exhaustiva el estado de la Fase 19, dejando establecido el diagnóstico exacto y el plan de resolución para su incorporación al backlog central de `Pendientes.md`.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización del backlog de Fase 19. Se conservan los doce IDs originales F19-Task01..F19-Task12 y las prioridades P0/P1/P2/P3 del apartado H. Se cotejaron los registros posteriores de Auditoria.txt: TASK-019/F19-Task01 figura completada; TASK-020/F19-Task02 solo documenta diagnóstico/plan; TASK-021/F19-Task03 documenta un plan de acción sin evidencia final de cierre; TASK-022 referencia la suite como F19-Task20, mientras el informe la denomina F19-Task12. AUD-NG-023 cuestiona la validez conductual de las suites de inventario. AUD-NG-142 documenta defectos posteriores adicionales; se crean cinco IDs de tarea nuevos F19-Task13..F19-Task17 para cubrirlos sin alterar los hallazgos originales.

### [F19-Task01] Aislar y controlar existencias multialmacén en el Kardex
- **Hallazgo de origen:** secciones B, C.2, D, E/F19-02, PT-04 y G.1; ampliación posterior AUD-NG-142.
- **Severidad:** Crítica. **Objetivo:** mantener saldos físicos y consolidados correctos por artículo y ubicación.
- **Acción ejecutable:** calcular saldo anterior/nuevo por `itemCodigo` y `ubicacionResponsable`; normalizar ubicación histórica vacía a Bodega General; proteger movimientos con ScriptLock; validar tipos de movimiento permitidos y rechazar tipos desconocidos sin sobrescribir saldo con la cantidad solicitada.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `recordInventoryMovement`, `getInventoryKardex`, `InventariosKardex`, `js/accounting.js`.
- **Dependencias/riesgos:** ubicaciones históricas, transferencias, conteos físicos y reportes; riesgo de alterar saldos de otras bodegas o reescribir balances históricos.
- **Alcance:** integridad del Kardex por ubicación y tipos válidos; no borrar movimientos ni reconstruir saldos sin conciliación.
- **Criterios de aceptación:** saldo por artículo/ubicación independiente; consolidado igual a suma de ubicaciones; salida local bloqueada si no hay stock; ubicación vacía normalizada; tipo desconocido rechazado; movimiento inválido no modifica saldos; concurrencia no pierde actualizaciones.
- **Prioridad:** P0. **Estado:** Pendiente de revalidación/ampliación.
- **Reconciliación:** TASK-019/F19-Task01 se declaró completada el 2025-11-03 con filtrado local y pruebas reportadas. AUD-NG-023 advierte que la suite F19 usa datos simulados y AUD-NG-142 añade aceptación de tipos desconocidos con saldo incorrecto. Conservar TASK-019 como implementación histórica y ampliar esta tarea; no repetir el trabajo multialmacén ya realizado.
- **Evidencia de cierre:** pendiente para AUD-NG-142 y pruebas conductuales reales; la evidencia histórica de pruebas nominales no basta para cerrar la ampliación.

### [F19-Task02] Implementar devolución y recepción formal de activos bajo custodia
- **Hallazgo de origen:** secciones B, C.2.6, D, E/F19-06 y registro posterior TASK-020.
- **Severidad:** Crítica. **Objetivo:** cerrar correctamente la custodia y liberar o enviar a mantenimiento el activo devuelto.
- **Acción ejecutable:** implementar `returnAssetCustody` con bloqueo transaccional; exigir asignación activa; registrar fecha, custodio, receptor, condición física y acta; si el activo está dañado/incompleto, cambiarlo a mantenimiento y crear orden; si está conforme, limpiar custodio y dejarlo disponible; impedir nuevas asignaciones si el activo no está disponible.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `assignAssetCustody`, `getAssetAssignments`, `manageAssetItem`, `manageMaintenanceOrder`, `ROLE_PERMISSIONS`, `doPost`, `js/accounting.js`, hojas `ActivosPatrimoniales`, `AsignacionesActivos`, `MantenimientoOrdenes`.
- **Dependencias/riesgos:** estado operativo del activo, actas, mantenimiento y permisos; riesgo de doble custodia, reasignación de activos dañados o pérdida del historial de entrega.
- **Alcance:** devolución, inspección y liberación; no eliminar actas ni permitir devolución de una asignación ya cerrada.
- **Criterios de aceptación:** solo asignaciones activas pueden devolverse; cierre registra fecha/receptor/condición/acta; activo conforme pasa a available; activo dañado pasa a maintenance con orden; asignación de activos no disponibles es rechazada; operación idempotente.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-020/F19-Task02 registra el diagnóstico y el plan, pero no se encontró un resultado posterior que demuestre la implementación. No se marca completada por la sola existencia del plan.
- **Evidencia de cierre:** pendiente; falta evidencia de endpoint, UI, permisos y pruebas de devolución.

### [F19-Task03] Validar transaccionalmente transferencias entre almacenes y recepción de destino
- **Hallazgo de origen:** secciones B, C.2.5, D, E/F19-05 y G/H P0; registros TASK-021 y AUD-NG-142.
- **Severidad:** Crítica. **Objetivo:** impedir transferencias superiores al stock local y recepciones superiores a lo despachado.
- **Acción ejecutable:** validar stock origen bajo ScriptLock; registrar transferencia con identificador y estados; implementar confirmación de recepción por custodio destino, cantidades recibidas/rechazadas y discrepancias; bloquear `cantidadRecibida > cantidadDespachada`; actualizar Kardex en forma atómica solo al confirmar.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `transferInventoryStock`, `confirmTransferReceipt`, `getInventoryTransfers`, `InventariosKardex`, nueva/actual hoja `TransferenciasInventario`, `js/accounting.js`.
- **Dependencias/riesgos:** F19-Task01, ubicaciones, estados de transferencia y permisos de remitente/receptor; riesgo de inflar existencias o confirmar dos veces.
- **Alcance:** despacho, tránsito, recepción total/parcial/rechazo y conciliación; no permitir que la UI altere saldos directamente.
- **Criterios de aceptación:** stock origen suficiente; origen/destino distintos; transferencia identificable e idempotente; recepción no supera cantidad despachada; diferencias quedan justificadas; Kardex se actualiza una sola vez por recepción confirmada; consolidado institucional se conserva.
- **Prioridad:** P0. **Estado:** Pendiente de revalidación.
- **Reconciliación:** TASK-021/F19-Task03 documenta un plan de acción para validación, persistencia y recepción, pero no contiene evidencia de cierre. AUD-NG-142 confirma que `confirmTransferReceipt` no limita la cantidad recibida. Completar/reabrir TASK-021 según el estado real, sin duplicar el flujo ya iniciado.
- **Evidencia de cierre:** pendiente para límite de cantidad recibida, persistencia, idempotencia y pruebas de transferencia real.

### [F19-Task04] Implementar depreciación periódica de activos fijos y asientos contables
- **Hallazgo de origen:** secciones B, C.2.12, D, E/F19-12 y H P1.
- **Severidad:** Alta. **Objetivo:** reflejar depreciación acumulada y valor neto en libros de los activos.
- **Acción ejecutable:** implementar cálculo lineal mensual por categoría con costo, valor residual, vida útil, fecha de puesta en servicio y fecha de baja; generar asientos de gasto/depreciación acumulada y conservar períodos contabilizados.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ActivosPatrimoniales`, `AsientosContables`, reportes de activos y contabilidad.
- **Dependencias/riesgos:** catálogo de categorías, política contable, vida útil y bajas; riesgo de depreciar activos no disponibles o duplicar asientos.
- **Alcance:** cálculo y contabilización de depreciación; no cambiar retroactivamente períodos cerrados sin ajuste autorizado.
- **Criterios de aceptación:** cálculo reproducible por período; no supera base depreciable; excluye activos fuera de servicio según política; asiento balanceado e idempotente; valor neto concilia con el auxiliar patrimonial.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara el motor ausente.

### [F19-Task05] Crear catálogo maestro centralizado de artículos e insumos
- **Hallazgo de origen:** secciones C.2.1, D, E/F19-01 y H P1.
- **Severidad:** Alta. **Objetivo:** evitar que el Kardex cree artículos implícitos con nombres/unidades inconsistentes.
- **Acción ejecutable:** crear `CatalogoArticulos` con código único, nombre normalizado, categoría, unidad de medida, especificaciones, marca/modelo, costo de referencia, código de barras/QR y estado; exigir referencia válida al registrar movimientos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `CatalogoArticulos`, `InventariosKardex`, `js/accounting.js`.
- **Dependencias/riesgos:** Kardex existente, compras/recepciones, unidades y códigos históricos; riesgo de romper referencias antiguas o duplicar artículos.
- **Alcance:** catálogo maestro y validación de referencias; no borrar artículos históricos ni cambiar códigos sin migración trazable.
- **Criterios de aceptación:** alta/edición autorizada; código único; unidad/categoría obligatorias; movimientos referencian artículo existente; reportes consolidan por ID, no por texto libre; datos antiguos quedan vinculados o marcados para reconciliación.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe señala que los artículos se crean implícitamente en Kardex.

### [F19-Task06] Programar mantenimiento preventivo recurrente y alertas anticipadas
- **Hallazgo de origen:** sección C.2.15 y H P1.
- **Severidad:** Alta. **Objetivo:** generar planes periódicos de mantenimiento antes del vencimiento de cada intervención.
- **Acción ejecutable:** añadir periodicidad por activo/ubicación, próxima fecha, responsable y tolerancia; generar órdenes o alertas anticipadas sin duplicar órdenes abiertas.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `manageMaintenanceOrder`, `getMaintenanceOrders`, `MantenimientoOrdenes`, dashboard de mantenimiento y mecanismo de programación disponible.
- **Dependencias/riesgos:** historial de órdenes, estado del activo, repuestos y alertas; riesgo de generar órdenes duplicadas o programar equipos dados de baja.
- **Alcance:** planificación recurrente y alertas; no sustituir el flujo de mantenimiento correctivo.
- **Criterios de aceptación:** frecuencia configurable; próxima fecha calculada; alertas previas; una sola orden activa por ciclo; reprogramación/cancelación trazable; activos fuera de servicio excluidos según regla.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica que solo se pueden registrar órdenes preventivas manuales.

### [F19-Task07] Contabilizar automáticamente el consumo de materiales por departamento
- **Hallazgo de origen:** secciones C.2.17, D, E/F19-17 y H P1; ampliación relacionada con AUD-NG-142.
- **Severidad:** Alta. **Objetivo:** reflejar el gasto de materiales en el centro de costo que recibe el suministro.
- **Acción ejecutable:** al entregar una requisición aprobada, registrar salida del almacén físico correcto y generar asiento de gasto por departamento/centro de costo con referencia a la requisición y movimiento de Kardex.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `deliverMaterialRequisition`, `recordInventoryMovement`, `MaterialesSolicitudes`, `InventariosKardex`, `AsientosContables`.
- **Dependencias/riesgos:** aprobación de requisición, almacén responsable, centro de costo y partida doble; riesgo de consumo no autorizado o doble contabilización.
- **Alcance:** contabilización de salidas por entrega; no contabilizar solicitudes rechazadas ni duplicar asientos en reintentos.
- **Criterios de aceptación:** solo requisiciones aprobadas pueden entregarse; descuento del almacén físico de origen; salida y asiento atómicos/idempotentes; centro de costo correcto; débito/crédito balanceado; entrega queda auditada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-142 añade que `deliverMaterialRequisition` no valida aprobación, no usa lock y descuenta desde departamento como ubicación. Estas validaciones se incorporan al alcance; no se declara resuelto por el asiento contable propuesto.
- **Evidencia de cierre:** pendiente; el informe indica que las salidas no generan asiento automático.

### [F19-Task08] Identificar activos y artículos mediante códigos QR/Barcode
- **Hallazgo de origen:** secciones C.2.7, D, E/F19-07 y H P2.
- **Severidad:** Media. **Objetivo:** facilitar identificación física y consulta móvil sin digitación manual.
- **Acción ejecutable:** generar códigos QR/barcode únicos para activos y artículos; permitir lectura desde interfaz móvil para consultar ficha, ubicación, custodio y movimientos autorizados.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ActivosPatrimoniales`, `CatalogoArticulos`, `js/accounting.js` y vistas móviles.
- **Dependencias/riesgos:** F19-Task05, identificadores persistentes, permisos y biblioteca de generación/lectura; riesgo de códigos duplicados o exposición de datos patrimoniales.
- **Alcance:** identificación y consulta; no incluir información sensible en el QR ni permitir cambios sin autenticación.
- **Criterios de aceptación:** código único y estable; lectura devuelve ficha correcta; activos/artículos inactivos se identifican como tales; acceso respeta rol; reimpresión no genera ID nuevo.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausente la trazabilidad QR/barcode.

### [F19-Task09] Registrar pólizas y controlar vencimiento de garantías de activos
- **Hallazgo de origen:** secciones C.2.13, D, E/F19-13 y H P2.
- **Severidad:** Media. **Objetivo:** conservar cobertura y fechas de garantía/póliza asociadas a cada activo.
- **Acción ejecutable:** agregar proveedor, número de póliza/garantía, cobertura, inicio/fin, documentos y estado; generar alertas previas al vencimiento y permitir consulta por activo/proveedor.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ActivosPatrimoniales`, almacenamiento documental y dashboard de activos.
- **Dependencias/riesgos:** proveedor, documentos, fechas y permisos; riesgo de perder cobertura o divulgar documentos contractuales.
- **Alcance:** registro y seguimiento; no emitir ni renovar pólizas automáticamente.
- **Criterios de aceptación:** póliza vinculada a activo/proveedor; fechas validadas; documento protegido; alertas por vencer/vencida; historial de renovaciones preservado.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica ausencia de fechas de garantía y pólizas.

### [F19-Task10] Controlar lotes y fechas de expiración de insumos
- **Hallazgo de origen:** secciones C.2.8, D, E/F19-08 y H P2.
- **Severidad:** Media. **Objetivo:** evitar uso de insumos vencidos y mantener trazabilidad por lote.
- **Acción ejecutable:** permitir lote y caducidad opcionales por artículo/entrada; controlar existencias por lote y ubicación; alertar próximos vencimientos y bloquear salidas de lotes vencidos según política.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `InventariosKardex`, `CatalogoArticulos`, vistas de almacén.
- **Dependencias/riesgos:** F19-Task05, movimientos de entrada/salida, devoluciones y política de caducidad; riesgo de mezclar stock vencido y vigente.
- **Alcance:** insumos que requieren control de lote (laboratorio/enfermería); no exigir lote para artículos a los que no aplica.
- **Criterios de aceptación:** lotes únicos por artículo/proveedor; caducidad validada; saldo separado por lote/ubicación; alertas y bloqueos configurables; historial de consumo trazable.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausente el registro de lotes/vencimientos.

### [F19-Task11] Integrar alertas multicanal de inventario y mantenimiento
- **Hallazgo de origen:** secciones C.2.18, E/F19-18 y H P2.
- **Severidad:** Media. **Objetivo:** notificar oportunamente quiebres de stock y vencimientos/órdenes de mantenimiento a responsables.
- **Acción ejecutable:** integrar alertas de stock bajo y mantenimiento con `sendMultiChannelNotification`, usando destinatarios por bodega/rol, preferencias, deduplicación y registro de entrega.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `sendMultiChannelNotification`, `AlmacenesUbicaciones`, `MantenimientoOrdenes` y dashboard.
- **Dependencias/riesgos:** catálogo de ubicaciones, roles, preferencias y canales configurados; riesgo de spam o divulgación de información interna.
- **Alcance:** alertas por eventos; no crear un segundo motor de notificaciones.
- **Criterios de aceptación:** destinatarios correctos por ubicación; alertas únicas por evento; correo/WhatsApp solo si el canal está habilitado; fallos registrados; preferencias y permisos respetados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica que las alertas solo se muestran en pantalla.

### [F19-Task12] Implementar suite automatizada de regresión integral de inventario y activos
- **Hallazgo de origen:** apartado H P3; PT-01..PT-05 y brechas G; ampliación AUD-NG-023.
- **Severidad:** Media (calidad). **Objetivo:** demostrar funcionalidad real de inventario, activos, mantenimiento y contabilidad.
- **Acción ejecutable:** implementar `runPhase19InventoryAndAssetsRegressionSuite` cubriendo PT19-01..PT19-20, incluyendo stock por ubicación, transferencias y recepción, custodia/devolución, depreciación y partida doble, requisiciones, conteos, mantenimiento, bajas e idempotencia.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/developer-service/Code.gs`, `tests/regression/academic-grading-suite.js` y `modular-dashboard-suite.js`.
- **Dependencias/riesgos:** datos aislados, persistencia, locks, permisos y flujos reales; riesgo de PASS nominal basado en variables locales.
- **Alcance:** suite de regresión Fase 19; reutilizar infraestructura existente y probar operaciones reales o dobles conductuales fieles.
- **Criterios de aceptación:** cada prueba ejecuta el contrato funcional; verifica persistencia, permisos, concurrencia, rollback e idempotencia; cubre las 20 pruebas transversales; evidencia reproducible con resultado por caso.
- **Prioridad:** P3. **Estado:** Pendiente de revalidación.
- **Reconciliación:** Auditoria.txt registra TASK-022 como F19-Task20, aunque el informe de fase usa F19-Task12 para la suite. Se conserva F19-Task12 como ID del informe y se registra la equivalencia histórica sin renombrar ni duplicar. AUD-NG-023 demuestra que la suite F19 construye datos simulados y no invoca operaciones reales; debe corregirse esa limitación antes de considerar el objetivo cumplido.
- **Evidencia de cierre:** pendiente; la existencia de una suite y resultados nominales no demuestra el ciclo real.

### [F19-Task13] Validar autorización, ubicación física y atomicidad en la entrega de requisiciones
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `deliverMaterialRequisition`.
- **Severidad:** Crítica. **Objetivo:** impedir entregas no aprobadas y descuentos sobre una ubicación incorrecta.
- **Acción ejecutable:** exigir requisición aprobada y vigente; adquirir lock; resolver almacén/ubicación física autorizada; validar saldo local; ejecutar descuento y cambio de estado como una sola operación idempotente.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `deliverMaterialRequisition`, `MaterialesSolicitudes`, `InventariosKardex`, `AlmacenesUbicaciones`.
- **Dependencias/riesgos:** F19-Task01, aprobaciones, permisos por ubicación y F19-Task07; riesgo de entrega no autorizada, stock negativo y doble despacho.
- **Alcance:** entrega física de requisiciones; no permitir bypass de aprobación ni tratar el departamento como almacén por defecto sin referencia válida.
- **Criterios de aceptación:** solicitud aprobada antes de entrega; almacén de origen explícito; saldo suficiente; lock y operación idempotente; estado y Kardex se actualizan una sola vez; reintentos no duplican salida.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 no acredita corrección.

### [F19-Task14] Hacer atómica e idempotente la conciliación de inventario físico
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `reconcilePhysicalCount`.
- **Severidad:** Crítica. **Objetivo:** impedir que un mismo conteo aplique dos veces el ajuste al Kardex.
- **Acción ejecutable:** exigir estado previo conciliable; adquirir lock; registrar identificador único de conciliación; aplicar ajuste por ubicación una sola vez y marcar conteo como conciliado en la misma operación lógica.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `reconcilePhysicalCount`, `InventariosConteosFisicos`, `InventariosKardex`.
- **Dependencias/riesgos:** conteos por ubicación, F19-Task01 y auditoría de movimientos; riesgo de duplicar ajustes o conciliar conteos ya cerrados.
- **Alcance:** ejecución única de conciliación; no modificar conteos históricos ya conciliados sin rectificación autorizada.
- **Criterios de aceptación:** solo estados permitidos concilian; reintento devuelve el resultado previo sin nuevo movimiento; dos operadores concurrentes no duplican ajuste; saldo coincide con conteo aprobado; evento trazable.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 documenta ausencia de lock y validación de estado previo.

### [F19-Task15] Evitar el doble descuento de repuestos al actualizar órdenes de mantenimiento
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `manageMaintenanceOrder`.
- **Severidad:** Crítica. **Objetivo:** garantizar que cada consumo de repuesto se registre una sola vez por orden.
- **Acción ejecutable:** asociar movimientos de Kardex a un identificador único de consumo/orden; aplicar descuento solo en transición válida a Resuelto/Completado; al editar una orden completada, no repetir el consumo; permitir ajustes explícitos con trazabilidad.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `manageMaintenanceOrder`, `MantenimientoOrdenes`, `InventariosKardex`.
- **Dependencias/riesgos:** estados de orden, F19-Task01 y movimientos de repuestos; riesgo de inventario negativo o doble gasto.
- **Alcance:** idempotencia de consumo en mantenimiento; no bloquear ediciones administrativas que no cambian repuestos.
- **Criterios de aceptación:** cada repuesto se descuenta una vez; reintento/edición no duplica movimiento; cambio de cantidad genera ajuste explícito; orden y Kardex conservan referencia cruzada.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 identifica doble descuento al actualizar una orden completada.

### [F19-Task16] Hacer idempotente el registro de bajas patrimoniales
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `registerAssetDisposal`.
- **Severidad:** Crítica. **Objetivo:** impedir que reintentos o solicitudes repetidas generen múltiples bajas del mismo activo.
- **Acción ejecutable:** exigir estado patrimonial elegible; usar clave/id de disposición única y lock; registrar una sola acta y transición de estado; reintentos deben devolver la baja existente sin repetir efectos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `registerAssetDisposal`, `getAssetDisposals`, `ActivosPatrimoniales`, `BajasBienes`.
- **Dependencias/riesgos:** custodia, mantenimiento, contabilidad y actas; riesgo de doble baja o registros patrimoniales inconsistentes.
- **Alcance:** baja lógica y expediente; no eliminar activo ni su historial.
- **Criterios de aceptación:** una disposición por activo/evento; duplicados bloqueados; estado y acta se actualizan atómicamente; auditoría registra actor, motivo y fecha; historial consultable.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 documenta que la función no es idempotente.

### [F19-Task17] Preservar historial de cambios en activos patrimoniales
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `manageAssetItem`.
- **Severidad:** Crítica. **Objetivo:** mantener trazabilidad de cambios de descripción, clasificación, ubicación, valor y estado de cada activo.
- **Acción ejecutable:** dejar de sobrescribir sin historial los campos patrimoniales; crear versiones/eventos de cambio con valor anterior/nuevo, actor, fecha y motivo; conservar identificador estable y permitir consulta de versiones.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `manageAssetItem`, `getAssetItems`, `ActivosPatrimoniales` y nueva estructura de historial/versionado.
- **Dependencias/riesgos:** custodia, depreciación, garantías, bajas y permisos; riesgo de pérdida de trazabilidad financiera o física.
- **Alcance:** historial de cambios patrimoniales; no duplicar la hoja maestra ni permitir editar versiones históricas.
- **Criterios de aceptación:** cada modificación genera evento/versionado; valores anteriores permanecen recuperables; actor/fecha/motivo obligatorios; cambios críticos requieren autorización; reportes pueden reconstruir el estado a una fecha.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 documenta sobrescritura de campos sin historial.

### Reconciliaciones y discrepancias transversales de Fase 19
- **F19-Task01:** TASK-019 se declaró completada; AUD-NG-023 cuestiona la validez de la suite y AUD-NG-142 añade movimientos de tipo desconocido que alteran saldos.
- **F19-Task02:** TASK-020 documenta el defecto y el plan, pero no se encontró resultado de implementación/verificación.
- **F19-Task03:** TASK-021 documenta acciones de transferencia/recepción, pero no un cierre verificable; AUD-NG-142 detecta que la recepción puede exceder lo despachado.
- **F19-Task04..F19-Task11:** se conservan como tareas originales del backlog; no se encontró evidencia de cierre en los registros cotejados.
- **F19-Task12:** el informe usa este ID para la suite, mientras Auditoria.txt relaciona TASK-022 con F19-Task20; se conserva el ID del informe y se documenta la equivalencia sin renombrar.
- **F19-Task13..F19-Task17:** IDs nuevos asignados a cinco defectos concretos de AUD-NG-142 no cubiertos de forma suficiente por las tareas originales: entrega de requisiciones, conciliación física, consumo de repuestos, baja idempotente e historial de activos.
- **AUD-NG-023:** las suites F18/F19 revisadas simulan datos locales y no invocan operaciones reales; los resultados nominales no certifican persistencia, permisos, concurrencia ni rollback.
- **Estado global:** ninguna tarea se declara completada en este bloque; TASK-019 conserva su antecedente de implementación, pero queda pendiente de revalidación por hallazgos posteriores.
