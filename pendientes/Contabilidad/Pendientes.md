# Backlog consolidado — Contabilidad

**Estado operativo del Plan Maestro (reinicio global):** todas las tareas de este backlog quedan en estado `Pendiente` al inicio de la ejecución. Ninguna tarea se considera `Completada`; marcas, etiquetas o declaraciones históricas de cierre son únicamente antecedentes y no acreditan estado vigente. Una tarea solo podrá cambiar de estado tras su implementación y verificación conforme al Plan Maestro.

**Fuentes integradas:** informes de auditoría de `AUDITORIAS/`, `Pendientes.md`, `completadas.md` y los archivos departamentales preexistentes. Los registros con el mismo identificador se reúnen en una sola tarea.

**Integridad:** se conservan los requisitos originales sin resumen ni paráfrasis. Se eliminan líneas exactamente repetidas tras normalizar espacios/capitalización. Los títulos alternativos se conservan como referencia. Las fuentes originales se mantienen sin alteración para trazabilidad.

---

<!-- ID: F11-TASK02 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [F11-TASK02] Asegurar la integridad de los asientos contables y las autorizaciones multinivel

**Otros títulos originales:**
- Garantizar la integridad de los registros contables y el flujo de autorizaciones financieras
- **Hallazgo de origen:** sección 4.C.1 (partida doble declarada completa) y sección 5.8-9 (riesgo P0 de integridad contable y autorizaciones financieras).
- **Severidad:** Crítica. **Objetivo:** garantizar que los asientos estén equilibrados y que las operaciones financieras sensibles respeten las autorizaciones requeridas.
- **Acción ejecutable:** verificar validaciones de débito/crédito, atomicidad del registro, segregación de funciones, niveles de aprobación, rechazo de operaciones incompletas y trazabilidad de cada decisión; corregir las brechas demostradas.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AsientosContables`, `ApprovalWorkflows` o el flujo financiero equivalente documentado.
- **Dependencias/riesgos:** catálogo contable, identidad/roles, concurrencia y persistencia transaccional; riesgo de asientos desbalanceados o autorizaciones indebidas.
- **Alcance:** integridad del asiento y autorización multinivel; no modificar el historial de pagos/recibos sin migración y respaldo verificables.
- **Criterios de aceptación:** se rechazan asientos no balanceados; no hay escrituras parciales ante error; cada aprobación corresponde a un rol autorizado y queda trazada; pruebas de concurrencia y rechazo cubren los casos críticos.
- **Prioridad:** P0. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** la sección 4.C.1 afirma que la partida doble está completa y verificada, pero la conclusión mantiene un riesgo P0. No se toma la afirmación general como evidencia suficiente de autorizaciones multinivel.
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 234-248; clave F11-Task13; asignación única: Contabilidad -->

---

<!-- ID: F17-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK03] Calcular aportaciones patronales legales (IHSS, RAP e INFOP) y contabilizarlas
- **Severidad:** Crítica (Costos laborales institucionales y cumplimiento con la seguridad social)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `PlanillasNomenclatura`, `AsientosContables`.
- **Problema:** Solo se calculan las retenciones obreras (3.5% IHSS y 1.5% RAP), omitiendo el costo patronal obligatorio: IHSS Patronal (~7.2%), RAP Patronal (1.5%) e INFOP (1.0%).
- **Solución Propuesta:** Calcular los aportes patronales sobre las bases legales vigentes e incorporarlos en el asiento contable de planilla como pasivos por pagar y gastos operativos sin deducirlos del salario neto del trabajador.
- **Hallazgo de origen:** secciones C, E.3, F.1/G y H.2 (P0); subcapacidad F17-13 de D.
- **Severidad:** Crítica. **Objetivo:** reflejar el costo patronal real y sus obligaciones por pagar sin reducir el salario neto del trabajador.
- **Acción ejecutable:** calcular IHSS patronal, RAP patronal e INFOP sobre las bases y parámetros oficiales vigentes para el período; separar aportes del trabajador y del patrono; versionar parámetros fiscales por vigencia; incorporar gastos y pasivos patronales al asiento contable y a los reportes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `calculatePayrollPeriod`, `updatePayrollPeriodStatus`, `getPayrollPeriodSummary`, `PoliticasFiscales`, `PlanillasNomenclatura`, `AsientosContables`, `recordAccountingJournalEntry`.
- **Dependencias/riesgos:** parámetros oficiales por ejercicio, bases de cotización, cuentas contables y períodos cerrados; riesgo de subestimar obligaciones y costo institucional.
- **Alcance:** aportes patronales ordinarios de planilla; no deducirlos del salario neto ni asumir tasas históricas como vigentes sin verificación oficial.
- **Criterios de aceptación:** parámetros versionados y efectivos por período; importes separados de deducciones obreras; asiento balanceado con cuentas diferenciadas de gasto/pasivo patronal; resumen muestra costo laboral total; auditoría reproduce cálculos.
- **Prioridad:** P0. **Estado:** Pendiente (reapertura/ampliación).
- **Reconciliación:** TASK-009/F17-Task03 fue declarada completada el 2026-11-02. AUD-NG-022 detecta parámetros hardcodeados sin vigencia y falta de evidencia del asiento patronal en el flujo inspeccionado; AUD-NG-141 advierte que los parámetros legales usados quedaron desactualizados. Ampliar TASK-009 con ambos hallazgos y verificar tasas oficiales vigentes antes de cerrar.
- **Evidencia de cierre:** pendiente para versionado normativo, contabilización verificable y reconciliación de AUD-NG-022/AUD-NG-141.

---

<!-- ID: F17-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK04] Implementar la tabla progresiva oficial del ISR para personas naturales
- **Severidad:** Crítica (Cumplimiento tributario con el SAR)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `PoliticasFiscales`.
- **Problema:** El ISR aplica un 15% fijo sobre el excedente de L 20,000.00 en lugar de aplicar la tabla progresiva anual del Art. 22 de la Ley del ISR de Honduras.
- **Solución Propuesta:** Implementar el algoritmo de proyección anual de sueldos con deducción médica automática de L 40,000.00 y aplicación de tramos gravables progresivos (Exento, 15%, 20%, 25%), dividiendo la retención anual estimada entre los meses restantes del año fiscal.
- **Hallazgo de origen:** secciones C, E.3, F.1/G y H.2 (P0); subcapacidad F17-04 de D.
- **Severidad:** Crítica. **Objetivo:** calcular la retención anualizada conforme a la normativa fiscal vigente y al historial real de ingresos/retenciones del empleado.
- **Acción ejecutable:** parametrizar tramos, deducciones y vigencias fiscales por ejercicio; proyectar ingresos según los meses restantes, deducir conceptos permitidos, consultar retenciones acumuladas y calcular el saldo anual pendiente para distribuirlo en los períodos restantes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `calculatePayrollPeriod`, `configureFiscalPolicy`, `getFiscalPolicies`, `PoliticasFiscales`, `PlanillasNomenclatura` e historial de retenciones ISR.
- **Dependencias/riesgos:** tabla oficial SAR por ejercicio, contratos, ingresos variables, IHSS/RAP, retenciones previas y cambios de salario; riesgo de retención insuficiente/excesiva o parámetros fiscales obsoletos.
- **Alcance:** retención ISR de planillas ordinarias; no fijar permanentemente umbrales o deducciones médicas en código.
- **Criterios de aceptación:** tramos y deducciones configurables/versionados; cálculo considera ingresos proyectados, meses restantes y retenciones previas; cambios de salario recalculan saldo anual; cada período conserva la versión fiscal aplicada; resultados conciliables.
- **Prioridad:** P0. **Estado:** Pendiente (reapertura/ampliación).
- **Reconciliación:** TASK-010/F17-Task04 fue declarada completada el 2026-11-02. AUD-NG-021 detecta que el cálculo divide el impuesto anual entre 12 y no descuenta retenciones previas ni proyecta según los meses restantes; AUD-NG-141 registra parámetros fiscales desactualizados. Ampliar TASK-010 con estos hallazgos; no duplicar el motor progresivo inicial.
- **Evidencia de cierre:** pendiente para el recálculo anual dinámico, retenciones previas y parámetros oficiales vigentes.

---

<!-- ID: F17-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK05] Desarrollar el motor de liquidación del Décimo Tercer Mes y Décimo Cuarto Mes
- **Severidad:** Crítica (Beneficios laborales obligatorios en Honduras)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `PlanillasNomenclatura`.
- **Problema:** No existe capacidad para procesar planillas extraordinarias de 13º mes (diciembre) y 14º mes de compensación social (junio Decreto 135-94).
- **Solución Propuesta:** Crear la función `calculateExtraordinaryPayrollPeriod` que calcule el salario ordinario completo o proporcional a los meses trabajados durante el período fiscal de acumulación.

- **Hallazgo de origen:** secciones C, E.4, G (P0) y H.2; subcapacidad F17-14 de D.
- **Severidad:** Crítica. **Objetivo:** calcular y procesar beneficios extraordinarios completos o proporcionales, con tratamiento contable y documental correcto.
- **Acción ejecutable:** completar `calculateExtraordinaryPayroll` considerando todos los contratos y cambios salariales vigentes durante cada período de acumulación; calcular salario ordinario/promedio según corresponda; generar boleta individual real y asiento contable en cuentas diferenciadas; impedir que el ciclo genérico aplique aportaciones patronales ordinarias a filas extraordinarias cuando no correspondan.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `calculateExtraordinaryPayroll`, `updatePayrollPeriodStatus`, `generatePayrollReceiptPDF`, `ContratosLaborales`, `PlanillasNomenclatura`, `AnticiposPrestamosEmpleado`, `BoletasPago`, `AsientosContables`.
- **Dependencias/riesgos:** períodos legales de acumulación, historial contractual, anticipos de beneficios, impuestos/exenciones y cuentas contables; riesgo de cálculo erróneo, doble pago o asiento incorrecto.
- **Alcance:** planillas extraordinarias 13º/14º; no usar sin validación el contrato más reciente para todo el período ni reutilizar sin ajustes el ciclo ordinario.
- **Criterios de aceptación:** cálculo por intervalos contractuales; proporcionalidad reproducible; anticipos deducidos una sola vez; aportes/retenciones aplicados conforme a la política legal vigente; boleta PDF realmente generada y vinculada al planillaId; asiento diferenciado balanceado; no se activan fallbacks patronales ordinarios.
- **Prioridad:** P0. **Estado:** Pendiente (reapertura/ampliación).
- **Reconciliación:** TASK-011/F17-Task05 fue declarada completada el 2026-11-02, pero AUD-NG-028 documenta selección del último contrato sin vigencia por intervalos, falta de boleta/archivo PDF real, asiento genérico y posible aplicación indebida de aportaciones patronales por fallback en `updatePayrollPeriodStatus`. Ampliar TASK-011 con AUD-NG-028; no duplicar la función inicial.
- **Evidencia de cierre:** pendiente para todos los defectos concretos de AUD-NG-028.

---

<!-- ID: F18-TASK01 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK01] Implementar el control de recepciones parciales, entregas escalonadas y saldos pendientes
- **Severidad:** Crítica (Integridad en la recepción física de compras y control de inventario)
- **Componentes Afectados:** `backend/accounting-service/Code.gs` (`recordPurchaseReceipt`), `OrdenesCompra`, `RecepcionesCompra`.
- **Problema:** Al registrar la primera recepción, la orden se marca incondicionalmente como `RecibidaTotal`, impidiendo recepciones posteriores de los artículos faltantes.
- **Solución Propuesta:** Calcular la suma de cantidades recibidas por partida vs cantidades autorizadas en la orden. Si quedan ítems pendientes, establecer el estado de la orden en `RecibidaParcial` y registrar las cantidades pendientes de recibir.
- **Criterios de Aceptación:** Se pueden registrar múltiples recepciones sobre una misma orden de compra hasta completar el 100% de los artículos; solo al completar todas las partidas la orden pasa a `RecibidaTotal`.
- **Hallazgo de origen:** Brecha E.1; cierre prematuro de órdenes como `RecibidaTotal` sin conciliar cantidades.
- **Severidad:** Crítica. **Objetivo:** conservar la integridad de cantidades autorizadas, recibidas y pendientes.
- **Acción ejecutable:** acumular recepciones por partida; comparar contra cantidades autorizadas; mantener `RecibidaParcial` mientras existan saldos y cerrar solo al completar todas las partidas.
- **Archivos/módulos:** `backend/accounting-service/Code.gs` (`recordPurchaseReceipt`), `OrdenesCompra`, `RecepcionesCompra`.
- **Dependencias/riesgos:** consistencia transaccional de recepciones e inventario; riesgo de pérdida de saldos o cierre prematuro.
- **Alcance:** recepción parcial y cálculo de saldo por partida; no incluye conciliación de facturas (F18-Task02).
- **Criterios de aceptación:** permitir varias recepciones por orden; no superar cantidades autorizadas; saldo pendiente correcto; estado total únicamente al completar el 100%.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe documenta inspección estática, no implementación correctiva.

---

<!-- ID: F18-TASK02 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK02] Desarrollar el motor de validación documental y conciliación de tres vías
- **Severidad:** Crítica (Prevención de fraudes, sobreprecios y pagos indebidos a proveedores)
- **Componentes Afectados:** `backend/accounting-service/Code.gs` (`verifyThreeWayMatch`), `CuentasPorPagarGastos`.
- **Problema:** Las facturas se registran sin comparar los precios unitarios de la Orden de Compra ni las cantidades efectivamente ingresadas en la Recepción de Bodega.
- **Solución Propuesta:** Crear la función `verifyThreeWayMatch` que compare: 1) Ítems y precios en `OrdenesCompra`, 2) Cantidades conformes en `RecepcionesCompra`, y 3) Montos en la factura del proveedor. Si existe discrepancia de precio (> 0%) o cantidad no recibida, la factura se bloquea en estado `EnDisputa` o `RequiereAprobacionDiferencia`.
- **Criterios de Aceptación:** Ninguna factura de compra puede pasar a estado `Aprobada para Pago` si los precios o cantidades difieren de la orden y recepción sin una justificación autorizada.
- **Hallazgo de origen:** Brecha E.2; facturas sin conciliación entre orden, recepción y cobro.
- **Severidad:** Crítica. **Objetivo:** impedir aprobaciones de pago con diferencias no autorizadas.
- **Acción ejecutable:** implementar `verifyThreeWayMatch`; comparar partidas/precios de la orden, cantidades conformes recibidas y montos de factura; bloquear discrepancias para revisión autorizada.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `CuentasPorPagarGastos`, `OrdenesCompra`, `RecepcionesCompra`.
- **Dependencias/riesgos:** F18-Task01 y contratos de factura/recepción; riesgo de sobreprecio o pago por mercancía no recibida.
- **Alcance:** conciliación documental previa a aprobación; no sustituye autorización de pagos ni conciliación bancaria.
- **Criterios de aceptación:** ninguna factura con diferencia no justificada pasa a aprobada para pago; discrepancias quedan identificadas y sujetas a aprobación autorizada; coincidencias verificables permiten continuar el flujo.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita ejecución correctiva.

---

<!-- ID: F18-TASK03 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK03] Construir la consola interactiva de compras y proveedores
- **Severidad:** Crítica (Operatividad de la gestión de compras y eliminación de carga en Sheets)
- **Componentes Afectados:** `js/accounting.js` (`renderComprasModule`), `dashboard-contabilidad.html`.
- **Problema:** La pestaña `compras` es actualmente un texto estático sin controles interactivos.
- **Solución Propuesta:** Desarrollar en `js/accounting.js` la interfaz completa con subpestañas: Solicitudes de Compra, Cotizaciones, Órdenes de Compra, Recepciones de Mercancía y Directorio de Proveedores, con tablas dinámicas y modales de acción.
- **Criterios de Aceptación:** El encargado de compras y el contador pueden gestionar el ciclo completo de adquisición sin salir de la plataforma.
- **Hallazgo de origen:** Brecha E.3; pestaña de compras sin vistas operativas.
- **Severidad:** Crítica. **Objetivo:** permitir la gestión del ciclo de adquisición desde la plataforma.
- **Acción ejecutable:** sustituir la vista estática por submódulos de solicitudes, cotizaciones, órdenes, recepciones y proveedores, con tablas y modales conectados a operaciones autorizadas.
- **Archivos/módulos:** `js/accounting.js` (`renderComprasModule`), `dashboard-contabilidad.html`, servicios backend de contabilidad.
- **Dependencias/riesgos:** contratos backend, permisos por rol y tareas F18-Task01/02; riesgo de exponer operaciones sin autorización.
- **Alcance:** interfaz de gestión de compras; no duplicar reglas de negocio en el cliente.
- **Criterios de aceptación:** usuarios autorizados pueden consultar y ejecutar las operaciones habilitadas; errores y estados se reflejan desde respuestas backend; no se habilitan acciones fuera del rol.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe la pestaña como estática.

---

<!-- ID: F18-TASK04 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK04] Generar órdenes de compra oficiales en PDF y ciclo de estados
- **Severidad:** Crítica (Formalización contractual y envío formal a proveedores)
- **Componentes Afectados:** `backend/accounting-service/Code.gs` (`generatePurchaseOrderPDF`), `OrdenesCompra`.
- **Problema:** Las órdenes solo existen como registros en la hoja de cálculo, sin documento descargable para enviar al proveedor.
- **Solución Propuesta:** Implementar `generatePurchaseOrderPDF` con membrete institucional, correlativo único, datos fiscales del proveedor, detalle de partidas, impuestos y firmas de autorización.

- **Hallazgo de origen:** backlog de la sección G, vinculado a formalización documental de órdenes; no se asigna una brecha E adicional no documentada.
- **Severidad:** Crítica. **Objetivo:** emitir un documento oficial, identificable y autorizable para el proveedor.
- **Acción ejecutable:** implementar `generatePurchaseOrderPDF` con membrete, correlativo único, datos fiscales, partidas, impuestos y firmas; vincular el documento al estado de la orden.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `OrdenesCompra`.
- **Dependencias/riesgos:** datos completos de proveedor/orden y flujo de autorizaciones; riesgo de emitir documentos inconsistentes o duplicados.
- **Alcance:** generación y trazabilidad del PDF; no sustituye aprobación multinivel.
- **Criterios de aceptación:** PDF descargable con los campos indicados, correlativo no duplicado y datos coincidentes con la orden autorizada.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe no aporta prueba de generación operativa.

---

<!-- ID: F19-TASK14 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK14] Hacer atómica e idempotente la conciliación de inventario físico
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `reconcilePhysicalCount`.
- **Severidad:** Crítica. **Objetivo:** impedir que un mismo conteo aplique dos veces el ajuste al Kardex.
- **Acción ejecutable:** exigir estado previo conciliable; adquirir lock; registrar identificador único de conciliación; aplicar ajuste por ubicación una sola vez y marcar conteo como conciliado en la misma operación lógica.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `reconcilePhysicalCount`, `InventariosConteosFisicos`, `InventariosKardex`.
- **Dependencias/riesgos:** conteos por ubicación, F19-Task01 y auditoría de movimientos; riesgo de duplicar ajustes o conciliar conteos ya cerrados.
- **Alcance:** ejecución única de conciliación; no modificar conteos históricos ya conciliados sin rectificación autorizada.
- **Criterios de aceptación:** solo estados permitidos concilian; reintento devuelve el resultado previo sin nuevo movimiento; dos operadores concurrentes no duplican ajuste; saldo coincide con conteo aprobado; evento trazable.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 documenta ausencia de lock y validación de estado previo.

---

<!-- ID: F20-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK02] Conectar y activar el módulo de Biblioteca en la navegación institucional
- **Hallazgo de origen:** secciones A.2, B, E.2, F (PT-20-44) y G P0.
- **Severidad:** Crítica. **Objetivo:** hacer accesible el módulo bibliotecario desde el dashboard institucional.
- **Acción ejecutable:** agregar botón de Biblioteca en `dashboard-contabilidad.html` y conectar `tab === 'biblioteca'` con `renderBibliotecaModule(container)` en `window.switchTab`; comprobar acceso de roles bibliotecarios autorizados.
- **Archivos/módulos:** `dashboard-contabilidad.html`, `js/accounting.js`, navegación del dashboard y permisos.
- **Dependencias/riesgos:** F20-Task01, inicialización de UI y RBAC; riesgo de vista huérfana o acceso no autorizado.
- **Alcance:** navegación y activación de las cinco subpestañas; no duplicar la vista ya desarrollada.
- **Criterios de aceptación:** botón visible a roles autorizados; selección abre la vista correcta; las cinco subpestañas funcionan; navegación de retorno y permisos se mantienen; usuarios sin acceso no pueden invocar acciones.
- **Prioridad:** P0. **Estado:** Pendiente de revalidación.
- **Reconciliación:** TASK-024/F20-Task02 registra el plan de acción ejecutado, pero no un cierre/verificación explícito. Confirmar conexión real y no duplicar el código de vista existente.
- **Evidencia de cierre:** pendiente; no se certifica el cierre por la sola anotación del plan ejecutado.

---

<!-- ID: F21-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md -->
### [ ] [F21-TASK01] Control estricto de cupos y prevención de sobrecupo en rutas
- **Hallazgo de origen:** secciones B, C.1.6/C.1.7, E/F21-07 y F21-31, G.1 y H P0.
- **Severidad:** Crítica. **Objetivo:** impedir asignaciones que excedan la capacidad oficial y colisiones de horario.
- **Acción ejecutable:** validar capacidad real del vehículo desde el catálogo maestro al crear/editar asignaciones; usar lock y revalidación atómica de cupos; bloquear duplicados por estudiante/ruta/período y colisiones horarias.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `assignStudentTransport`, `manageTransportRoute`, `TransporteVehiculos`, `TransporteAsignaciones`.
- **Dependencias/riesgos:** F21-Task05, rutas, turnos y asignaciones vigentes; riesgo crítico de sobrecupo físico.
- **Alcance:** cupos y disponibilidad; no aceptar capacidad ingresada libremente desde el cliente.
- **Criterios de aceptación:** capacidad proviene del vehículo activo; operaciones concurrentes no superan cupo; duplicados y colisiones se rechazan; cambios de capacidad revalidan asignaciones existentes.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-029/F21-Task01 registra ScriptLock, validación de cupos, duplicados y colisiones con códigos `TRANSPORT_CAPACITY_EXCEEDED`, `DUPLICATE_TRANSPORT_ASSIGNMENT` y `TRANSPORT_SCHEDULE_CONFLICT`. Se conserva la implementación histórica; no se reejecutaron pruebas en esta normalización.
- **Evidencia de cierre:** registro TASK-029 y resultados reportados de 207/207 pruebas; no reejecutados aquí.

---

<!-- ID: F23-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_23_MOTOR_INSTITUCIONAL_FLUJOS_TRABAJO.md -->
### [ ] [F23-TASK07] Integrar protocolo HMAC interservicio real con secretos rotables
- **Hallazgo de origen:** F23-010, F23-025 y F23-029; TASK-048 y AUD-NG-083..086.
- **Severidad:** Crítica. **Objetivo:** autenticar cada llamada entre servicios, impedir replay y autorizar emisor/receptor/acción.
- **Acción ejecutable:** conectar `createInterServiceEnvelope` a llamadas salientes y `verifyInterServiceEnvelope` antes del dispatcher; usar secretos aleatorios por par de servicios con rotación/revocación; validar HMAC antes de reservar requestId; autorizar sourceService/acción; incluir versión y correlationId.
- **Archivos/módulos:** servicios User/Academic/Accounting/Developer, `createInterServiceEnvelope`, `verifyInterServiceEnvelope`, `getAuthTokenSecret`.
- **Dependencias/riesgos:** F23-Task10, gestor de secretos y catálogo; riesgo de spoofing, replay o privilegios excesivos.
- **Alcance:** protocolo entre servicios; helpers declarados no equivalen a integración.
- **Criterios de aceptación:** llamadas reales firman/verifican; secreto ausente falla cerrado; HMAC antes de reservar nonce; replay concurrente bloqueado; emisor activo/autorizado; target, TTL, versión y esquema validados; correlationId propagado.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-048 está etiquetada F23-Task05, pero su alcance es HMAC, no SLA. AUD-NG-083 helpers no conectados; AUD-NG-084 fallback predecible; AUD-NG-085 reserva nonce antes de verificar firma; AUD-NG-086 no autoriza emisor/acción ni valida versión/esquema. Se asigna F23-Task07.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.

---

<!-- ID: F29-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK02] Separar saldos iniciales de facturas y movimientos históricos
- **Hallazgo de origen:** BR-29-02; F29-07; secciones C.7, E y G.
- **Severidad:** Crítica / P0. **Objetivo:** impedir que documentos históricos ya representados en el saldo inicial vuelvan a generar deudas vivas.
- **Acción ejecutable:** crear `SaldosInicialesCorte` por institución, cuenta, titular, moneda y fecha de corte; conciliar facturas/movimientos anteriores y posteriores al corte; bloquear contabilización duplicada; mantener referencias a documentos históricos sin reabrirlos como cargos pendientes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `PagosAbonos`, cuentas por cobrar/pagar, `SaldosInicialesCorte`, `AuditoriaMigraciones`.
- **Dependencias/riesgos:** F29-Task07 (conciliación), F29-Task08 (cutover), TASK-133/AUD-NG-133 para integridad/idempotencia de pagos; riesgo de doble cobro o pérdida de saldos legítimos.
- **Alcance:** saldos y movimientos contables del corte; no alterar documentos históricos ni confundir saldo inicial con factura emitida en el sistema nuevo.
- **Criterios de aceptación:** corte fechado y aprobado; cada saldo enlaza a fuente y titular; facturas históricas excluidas de cargos vivos cuando ya están incluidas en saldo; conciliación monetaria exacta por moneda/cuenta; diferencias bloquean Go-Live; pruebas de migración repetida, abonos parciales, notas de crédito y documentos posteriores al corte.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz H califica la información financiera como defectuosa por falta de corte de saldo inicial.

---

<!-- ID: F30-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md -->
### [ ] [F30-TASK03] Versionar históricamente políticas y tarifas usadas en cálculos financieros
- **Hallazgo de origen:** F30-03; cambios de `ParametrosInstitucionales` que pueden alterar recálculos extemporáneos.
- **Severidad:** Crítica / P0. **Objetivo:** reproducir importes históricos con las políticas y tarifas vigentes al momento de emisión.
- **Acción ejecutable:** persistir versiones inmutables de aranceles, recargos, becas y políticas fiscales; asociar cada cargo/factura/periodo con su versión efectiva; impedir que consultas históricas utilicen valores actuales por defecto.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ParametrosInstitucionales`, `ConceptosCobro`, `TarifasCobro`, `PoliticasFiscales`, `CargosEstudiante` y estados de cuenta.
- **Dependencias/riesgos:** F26-Task01 (ámbitos de configuración), F26-Task05/TASK-062 (versionado/rollback), F24-Task02 (diccionario semántico cuando aplique); riesgo de modificar retroactivamente saldos.
- **Alcance:** versionado de reglas y referencia desde transacciones; no recalcular documentos históricos con la tarifa actual.
- **Criterios de aceptación:** versiones efectivas por fecha/periodo; cargo guarda versión aplicada; recálculo histórico reproduce monto original; cambios requieren autorización y auditoría; pruebas de modificación de tarifa, mora, beca, impuestos y consulta de ciclos anteriores.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-03 advierte que las tarifas actuales pueden alterar estados de cuenta antiguos si no se fijan al emitir.

---

<!-- ID: F37-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md -->
### [ ] [F37-TASK02] Crear catálogo de proyecciones y máscaras mínimas de atributos interdepartamentales
- **Hallazgo de origen:** F37-02/F37-04/F37-08; PT-F37-09/25; CAR-F37-02/CAR-F37-04/CAR-F37-08.
- **Severidad:** Crítica / P0. **Objetivo:** compartir solo los atributos necesarios para la operación del departamento receptor.
- **Acción ejecutable:** crear `CatalogoRelacionesInterdepartamentales` con entidad origen/destino, campos permitidos, propósito, rol, ámbito y vigencia; aplicar proyección server-side en consultas; bloquear retornos de filas completas cuando exista máscara.
- **Archivos/módulos:** servicios User/Academic/Accounting/Developer, `CatalogoRelacionesInterdepartamentales`, consultas de estudiantes, expedientes y pagos.
- **Dependencias/riesgos:** F30-Task02 (integridad relacional), AUD-NG-158 (ABAC), F29-Task17 (privacidad); riesgo de exposición de teléfonos, tutores secundarios, bienestar u observaciones no pertinentes.
- **Alcance:** minimización de campos y relaciones autorizadas; no sustituir RBAC ni asumir que ocultar columnas en frontend protege datos.
- **Criterios de aceptación:** proyecciones versionadas por propósito/departamento; campos se filtran en backend; Contabilidad recibe solo datos mínimos de matrícula; campos sensibles excluidos por defecto; pruebas de endpoints directos, cambio de rol y manipulación de filtros.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-09/25 detectan acceso a expediente completo y retorno de objetos sin máscara.

---

<!-- ID: TASK-001 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-001] Corrección del motor de facturación fiscal SAR, clasificación tributaria y control de CAI
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 628-686; clave TASK-002; asignación única: Contabilidad -->

---

<!-- ID: TASK-002 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-002] Motor de generación masiva, programada y recurrente de mensualidades escolares
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 687-753; clave TASK-003; asignación única: Contabilidad -->

---

<!-- ID: TASK-003 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-003] Sistema integral de anulaciones, reversión de pagos, notas de crédito y reembolsos
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 915-953; clave TASK-007; asignación única: Contabilidad -->

---

<!-- ID: TASK-007 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-007] Eliminar el salario fijo y calcular la remuneración según el contrato vigente de cada empleado
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 954-994; clave TASK-008; asignación única: Contabilidad -->

---

<!-- ID: TASK-008 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-008] Integrar automáticamente las novedades aprobadas en el cálculo de planilla
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 995-1033; clave TASK-009; asignación única: Contabilidad -->

---

<!-- ID: TASK-009 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-009] Implementar las aportaciones patronales y separar los costos institucionales de las deducciones del empleado
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1034-1070; clave TASK-010; asignación única: Contabilidad -->

---

<!-- ID: TASK-010 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-010] Sustituir el cálculo simplificado del ISR por un motor de retención progresiva y anualizada
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1071-1111; clave TASK-011; asignación única: Contabilidad -->

---

<!-- ID: TASK-011 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-011] Crear el cálculo y procesamiento independiente del décimo tercer y décimo cuarto mes
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1116-1159; clave TASK-012; asignación única: Contabilidad -->

---

<!-- ID: TASK-012 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-012] Corregir el control de recepciones parciales y entregas escalonadas
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1160-1208; clave TASK-013; asignación única: Contabilidad -->

---

<!-- ID: TASK-013 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-013] Implementar conciliación documental de tres vías entre orden, recepción y factura
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1209-1249; clave TASK-014; asignación única: Contabilidad -->

---

<!-- ID: TASK-014 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-014] Desarrollar la interfaz operativa completa del módulo de compras
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1250-1280; clave TASK-015; asignación única: Contabilidad -->

---

<!-- ID: TASK-015 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-015] Implementar documentos PDF oficiales para órdenes de compra y ampliar su ciclo de estados
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1281-1322; clave TASK-016; asignación única: Contabilidad -->

---

<!-- ID: TASK-016 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-016] TAREAS DERIVADAS DE AUDITORÍA — TASK-016 / F18-Task06 (2026-11-04)

**Otros títulos originales:**
- Ampliar la gestión de cuentas por pagar con abonos, vencimientos y notas de crédito
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
- **Estado:** Pendiente

### [AUD-NG-046] Exigir conciliación de tres vías satisfactoria antes de habilitar cualquier pago a proveedores
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-046 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** doPost, validateRolePermission, recordAccountsPayableExpense, verifyThreeWayMatch, recordSupplierPayment, CuentasPorPagarGastos.EstadoAprobacion y Observaciones.
- **Descripción del Alcance:** Hacer obligatoria la conciliación entre orden aprobada, recepción física conforme y factura para toda obligación vinculada a compras. Eliminar la posibilidad de dejar una obligación pagable por ausencia de orden/partidas o por un bypass no autorizado. Persistir el resultado de conciliación y exigir evidencia verificable de resultado satisfactorio antes de aceptar recordSupplierPayment. Los casos legítimamente exentos deberán tener una política explícita, permiso verificado y motivo persistido, sin aceptar flags de autorización arbitrarios del cliente.
- **Criterios de Aceptación:** Una factura vinculada a compra no puede quedar Aprobada ni recibir pagos si no existe resultado satisfactorio de Three-Way Match; omitir orden o partidas no evita el control; una discrepancia bloquea pagos; un bypass no autorizado es rechazado; el resultado y actor autorizado quedan persistidos y son consultables.
- **Estado:** [ ] Pendiente

### [AUD-NG-047] Crear un registro estructurado e inmutable del detalle de cada pago parcial a proveedores
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-047 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; almacenamiento contable; dashboard-contabilidad.html; js/accounting.js
- **Dependencias Expuestas:** CuentasPorPagarGastos, recordSupplierPayment, recordCashBankMovement, MovimientosCajaBancos, cuentaBancariaId, comprobanteUrl y AsientosContables.
- **Descripción del Alcance:** Definir una entidad persistente de pagos de proveedores con identificador único, obligación, proveedor, factura, importe, fecha, método, cuenta bancaria, referencia, URL de comprobante, actor autenticado, estado, movimiento de caja asociado y asiento contable relacionado. Cada abono debe conservarse como registro individual sin depender de texto libre en Observaciones. Persistir los campos cuentaBancariaId y comprobanteUrl y relacionarlos con el movimiento y la obligación.
- **Criterios de Aceptación:** Dos abonos de una misma factura generan dos registros independientes; cada registro conserva todos los metadatos; el historial permite reconstruir fecha, importe, cuenta, referencia y comprobante; recargar consultas conserva los datos; ningún abono previo se sobrescribe al registrar otro.

### [AUD-NG-048] Rechazar cualquier pago o nota de crédito que exceda el saldo exacto de la obligación
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-048 (TASK-016 / F18-Task06)
- **Dependencias Expuestas:** recordSupplierPayment, applySupplierCreditNote, TotalMonto, SaldoPendiente y TotalAbonado.
- **Descripción del Alcance:** Sustituir la tolerancia que permite exceder el saldo por una validación monetaria estricta basada en importes normalizados a dos decimales. El pago y la nota de crédito nunca podrán exceder el saldo disponible. Definir explícitamente el tratamiento de redondeos sin permitir que el agregado de abonos supere el total liquidable. Mantener invariantes verificables entre total, saldo, pagos y créditos.
- **Criterios de Aceptación:** Un saldo de L 100.00 rechaza L 100.01 y cualquier importe superior; L 100.00 exactos liquidan el saldo; después de cualquier operación SaldoPendiente nunca es negativo y TotalAbonado nunca supera el total pagadero; las pruebas cubren límites de centavos y errores de redondeo.

### [AUD-NG-049] Garantizar consistencia atómica entre pagos, movimientos de caja y asientos contables
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-049 (TASK-016 / F18-Task06)
- **Dependencias Expuestas:** LockService, recordSupplierPayment, applySupplierCreditNote, recordCashBankMovement, recordAccountingJournalEntry, CuentasPorPagarGastos, MovimientosCajaBancos y AsientosContables.
- **Descripción del Alcance:** Rediseñar la secuencia de persistencia para que la obligación, el movimiento financiero y el asiento contable formen una operación consistente. No devolver éxito si falta cualquiera de los registros obligatorios. Implementar control de estado de operación, recuperación/reconciliación idempotente o compensación documentada ante fallos parciales, evitando que una excepción posterior deje saldos modificados sin contrapartida.
- **Criterios de Aceptación:** Si falla la escritura de movimiento o asiento, la operación no se reporta como exitosa ni deja saldo final divergente; cada pago aceptado tiene exactamente un movimiento y un asiento balanceado; las notas de crédito aceptadas tienen su asiento correspondiente; reintentos no duplican ninguno de los registros; se prueban fallos inducidos en cada punto de persistencia.

### [AUD-NG-050] Hacer obligatoria la idempotencia y validar la unicidad de referencias bancarias de pagos
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-050 (TASK-016 / F18-Task06)
- **Dependencias Expuestas:** doPost, checkAndRegisterIdempotencyKey, saveIdempotentResult, recordSupplierPayment, referenciaBancaria y entidad de pagos de proveedores.
- **Descripción del Alcance:** Exigir clave de idempotencia para registrar pagos o generar una clave de operación segura en servidor; persistir la relación entre clave, firma del payload y resultado. Validar unicidad de la referencia bancaria según banco/cuenta/proveedor y período definido, con normalización y control de concurrencia. Evitar depender exclusivamente del caché temporal.
- **Criterios de Aceptación:** Un reintento idéntico devuelve el resultado original sin crear otro pago; reutilizar la misma clave con payload distinto se rechaza; una referencia bancaria ya aplicada no puede crear un segundo egreso; la unicidad persiste tras expirar caché y recargar el servicio.

### [AUD-NG-051] Implementar registro central de notas de crédito y deduplicación global por proveedor
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-051 (TASK-016 / F18-Task06)
- **Dependencias Expuestas:** applySupplierCreditNote, CuentasPorPagarGastos, Observaciones, numeroNotaCredito, proveedorId, factura y AsientosContables.
- **Descripción del Alcance:** Crear un registro independiente de notas de crédito comerciales con número, proveedor emisor, factura relacionada, importe, fecha, motivo, documento soporte, obligación, actor, estado de aplicación y asiento contable. Aplicar una restricción de unicidad por emisor/proveedor y número de documento, con control concurrente. Registrar el importe aplicado y su relación con el saldo sin utilizar Observaciones como fuente de verdad.
- **Criterios de Aceptación:** Una nota no puede aplicarse dos veces a la misma obligación ni a obligaciones distintas; una nota de otro proveedor con igual numeración se evalúa conforme a la clave compuesta; cada aplicación conserva evidencia y asiento; el saldo no se reduce si la nota no queda registrada íntegramente.

### [AUD-NG-052] Persistir estados de vencimiento y validar fechas de las obligaciones
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-052 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Medio
- **Dependencias Expuestas:** getSupplierAccountsPayableSummary, FechaVencimiento, EstadoPago, EstadoAprobacion y CuentasPorPagarGastos.
- **Descripción del Alcance:** Validar formato y obligatoriedad de fecha de vencimiento según política; distinguir fecha ausente/inválida de una obligación corriente; persistir o derivar de forma consistente el estado Vencida sin confundirlo con EstadoPago; exponer listas y conteos por rangos de 7, 15 y 30 días, con reglas de inclusión documentadas.
- **Criterios de Aceptación:** Una fecha inválida no se clasifica como Corriente; una obligación con saldo positivo y fecha pasada se identifica como Vencida en consultas y reportes; una obligación pagada no aparece como vencida; las listas y conteos por período coinciden; los estados se reconstruyen correctamente tras recargar.

### [AUD-NG-053] Implementar la interfaz operativa de cuentas por pagar, pagos y notas de crédito
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-053 (TASK-016 / F18-Task06)
- **Archivos Involucrados:** dashboard-contabilidad.html; js/accounting.js; backend/accounting-service/Code.gs
- **Dependencias Expuestas:** fetchApi, recordAccountsPayableExpense, recordSupplierPayment, applySupplierCreditNote y getSupplierAccountsPayableSummary.
- **Descripción del Alcance:** Incorporar una sección de cuentas por pagar en el dashboard contable con listado y filtros por proveedor, factura, estado y vencimiento; detalle de obligación e historial de pagos; formulario para registrar abonos con cuenta, referencia y comprobante; formulario para aplicar notas de crédito; consulta de vencimientos y saldos. Respetar RBAC, validación de formularios, bloqueo de doble envío y actualización del estado tras persistencia.
- **Criterios de Aceptación:** Un usuario autorizado consulta obligaciones y vencimientos; registra abonos parciales y observa el historial; aplica notas de crédito únicas; usuarios sin permisos no ven ni ejecutan acciones; los datos sobreviven a recarga y coinciden con backend; los controles impiden doble envío.

### [AUD-NG-054] Sustituir pruebas simuladas de cuentas por pagar por pruebas funcionales sobre operaciones reales
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-054 (TASK-016 / F18-Task06)
- **Archivos Involucrados:** backend/accounting-service/Code.gs; tests/regression/academic-grading-suite.js; tests/regression/
- **Dependencias Expuestas:** runPhase18PurchasingAndSuppliersRegressionSuite, recordAccountsPayableExpense, recordSupplierPayment, applySupplierCreditNote, getSupplierAccountsPayableSummary, SpreadsheetApp y AsientosContables.
- **Descripción del Alcance:** Reemplazar o complementar REG-F18-06 y REG-F18-08 con pruebas aisladas que invoquen las funciones reales mediante dobles controlados de persistencia o un Spreadsheet de prueba. Verificar sobrepagos en límites de centavos, duplicidad de referencias, aplicación global de notas, bloqueo por conciliación, fallos de persistencia, asientos balanceados, vencimientos y recuperación de estado. No considerar aserciones de presencia de cadenas como evidencia funcional.
- **Criterios de Aceptación:** Las pruebas ejecutan las funciones de negocio reales; verifican valores persistidos y relaciones entre hojas; incluyen fallos inducidos y reintentos; prueban permisos y casos límite; la suite demuestra que ningún pago aceptado carece de movimiento o asiento; se documentan resultados reproducibles y cobertura por requisito.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1323-1355; clave TASK-017; asignación única: Contabilidad -->

---

<!-- ID: TASK-017 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-017] Implementar el compromiso presupuestario formal al aprobar órdenes de compra
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1400-1460; clave TASK-019; asignación única: Contabilidad -->

---

<!-- ID: TASK-019 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-019] Corrección integral del control de existencias multialmacén
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1461-1501; clave TASK-020; asignación única: Contabilidad -->

---

<!-- ID: TASK-020 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-020] Implementación del flujo completo de devolución y recepción de activos bajo custodia
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1502-1541; clave TASK-021; asignación única: Contabilidad -->

---

<!-- ID: TASK-021 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-021] Validación transaccional de transferencias entre almacenes
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3601-3637; clave TASK-072; asignación única: Contabilidad -->

---

<!-- ID: TASK-072 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-072] [P0] Modelo de Corte Contable y Migración de Saldos Iniciales sin Duplicación
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4132-4169; clave TASK-088; asignación única: Contabilidad -->

---

<!-- ID: TASK-088 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-088] [P0] Integración Financiera de Biblioteca, Transporte, Tienda y Cafetería
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6686-6721; clave TASK-157; asignación única: Contabilidad -->

---

<!-- ID: TASK-535 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md -->
### [ ] [TASK-535] Publicar exclusivamente el escenario confirmado
- **Hallazgo de origen:** AUD-NG-239 / H6-H7.
- **Severidad:** Crítico.
- **Objetivo:** que una confirmación solo afecte los bloques del escenario revisado.
- **Acción ejecutable:** exigir escenarioId y versión; validar año/período/estado; revisar conflictos y bloqueos; no usar todos los borradores globales como fallback; registrar el conjunto exacto de IDs seleccionados.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** TASK-532/533/534, F7-IMP-01, VersionesHorarios y RBAC.
- **Alcance:** publicación de escenario; no publicar otros borradores ajenos.
- **Criterios de aceptación:** sin escenarioId válido no se publica; solo IDs del escenario confirmado cambian de estado; año/período se filtran por campos explícitos; cambios concurrentes requieren nueva validación.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-667 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK09.md -->
### [ ] [TASK-667] Normalizar el esquema y la clave de las asignaciones de ámbito
- **Hallazgo:** AUD-NG-313.
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Objetivo:** persistir cada ámbito de forma independiente por usuario, rol y responsabilidad.
- **Archivos/componentes:** backend/user-service/Code.gs; esquema de AsignacionesAmbitosRoles; migración y validadores.
- **Dependencias:** TASK-663 y TASK-664.
- **Alcance:** definir encabezados completos y estables; migrar las filas existentes sin pérdida; normalizar roleId, responsibilityId, scopeType, scopeValues, estado, fechas y suplencias; usar clave compuesta que no colapse roles/responsabilidades; actualizar todos los campos en operaciones de edición; validar tipos/valores; proteger escrituras concurrentes y verificar persistencia antes de devolver success.
- **Criterios de aceptación:** dos roles del mismo usuario pueden tener el mismo scopeType con valores distintos; actualizar uno no modifica el otro; todas las columnas tienen encabezado y se recuperan sin desplazamiento; fechas y suplencias sobreviven a actualización; escrituras incompletas o inválidas no devuelven éxito.

---

<!-- ID: F8-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [F8-TASK02] / TAREA-MOD-01 — Inventario y dependencias (C1.262)
- **Dictamen:** NO CUMPLE; se conserva la marca histórica [ ] en completadas.md.
- **Criterios:** CA-MOD-101 NO CUMPLE; CA-MOD-102 PARCIAL.
- **Hallazgos:** AUD-NG-281 inventario parcial; AUD-NG-282 mapa/rutas sin cobertura integral; AUD-NG-283 falta de evidencia de duplicaciones/globales/ciclos.
- **Tareas ejecutables derivadas:** TASK-637 inventario completo; TASK-638 trazabilidad de dependencias y contratos; TASK-639 revisión manual de duplicaciones, globales, ciclos y acoplamientos.
- **Evidencia:** árbol Git 974 archivos; repository-inventory.md 40 líneas; routing-and-paths.md 28 líneas; modular-dashboard-suite.js 61 líneas; MapaDependencias.md 3.757 líneas. Los documentos existentes no demuestran cobertura de todos los archivos.
- **Pendientes.md:** lectura convencional 0 caracteres; blob actual 676a3f798715f0cdd7d4bc75768472545b8465ee recuperado (1.786.011 caracteres, 20.224 líneas, 0 U+FFFD, 515 IDs TASK numéricos únicos TASK-001..TASK-636); blob histórico 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c también recuperado. Se conserva el blob actual del HEAD; no se restauró el histórico ni se modificó el archivo.
- **Pruebas:** inspección manual/documental y Git. No ejecutados Node, navegador, HTTP, Apps Script ni E2E.
- **Siguiente tarea exacta:** F8-Task03, actualizar y verificar las rutas y dependencias después de reorganizar el repositorio.

- **ID Anterior:** `[TAREA-MOD-01]`
- **Origen del Hallazgo:** Anexo de Tareas: Modularización / Tarea MOD-01 (P1 · Inventario de Dependencias)
- **Prioridad:** P1
- **Severidad/Clasificación:** Crítica (Análisis de dependencias)
- **Archivos Involucrados:**
  - Todo el repositorio (`app/`, `backend/`, `js/`, `css/`, `index.htm`)
- **Dependencias Expuestas:** Todas las referencias cruzadas de scripts, links, importaciones y endpoints
- **Descripción del Alcance:**
  Auditar minuciosamente todos los archivos del repositorio (respetando `index.htm`) y mapear dependencias directas e indirectas, referencias de scripts, llamadas API y funciones compartidas.

  Requisitos Funcionales:
  1. Inventariar todos los archivos HTML, JS, CSS, motores, servicios, plantillas y assets.
  2. Identificar funciones duplicadas, dependencias circulares, variables globales y acoplamientos.
  3. Mapear referencias en etiquetas script, link, importaciones, llamadas backend y rutas.
  4. Documentar contratos de comunicación y puntos de entrada sin alterar el nombre de `index.htm`.
- **Criterios de Aceptación:**
  - CA-MOD-101: El inventario cubre el 100% de los archivos del repositorio y sus dependencias explícitas.
  - CA-MOD-102: Se genera el mapa de dependencias formal antes de iniciar traslados de archivos.
- **Estado:** Pendiente

---

<!-- ID: F11-TASK13 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [F11-TASK13] Completar conciliación bancaria asistida y pareo de extractos

**Otros títulos originales:**
- Desarrollar la conciliación bancaria asistida y pareo automático de extractos
- **Hallazgo de origen:** sección 4.C.5; existe conciliación manual, pero falta pareo automático de movimientos de extractos.
- **Severidad:** Alta. **Objetivo:** reducir errores manuales y hacer trazable la correspondencia entre extractos y registros contables.
- **Acción ejecutable:** incorporar importación controlada de extractos, normalización de fecha/referencia/monto, reglas de coincidencia, cola de excepciones y confirmación humana antes de contabilizar ajustes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `performBankReconciliation`, `ConciliacionBancaria`.
- **Dependencias/riesgos:** formatos bancarios, catálogo de cuentas, idempotencia y permisos financieros; riesgo de conciliaciones falsas o duplicación de movimientos.
- **Alcance:** asistencia al pareo y gestión de excepciones; no ejecutar ajustes irreversibles sin autorización.
- **Criterios de aceptación:** coincidencias sugeridas muestran evidencia y nivel/regla de correspondencia; movimientos no pareados quedan en excepción; no se contabiliza dos veces; usuario autorizado confirma los ajustes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara disponible solo la conciliación manual.
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 249-263; clave F11-Task14; asignación única: Contabilidad -->

---

<!-- ID: F11-TASK14 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [F11-TASK14] Implementar control presupuestario y alertas de sobregiro por centro de costo

**Otros títulos originales:**
- Desarrollar el control presupuestario y alertas de sobregiro por centro de costo
- **Hallazgo de origen:** sección 4.C.2 y sección 5.10-15; se mide ejecución presupuestaria, pero falta alerta de sobregiro por centro de costo.
- **Severidad:** Alta. **Objetivo:** anticipar y prevenir compromisos que excedan el presupuesto autorizado.
- **Acción ejecutable:** calcular presupuesto aprobado, ejecutado y comprometido por centro de costo/partida; definir umbrales y emitir alertas antes de aprobar gastos u órdenes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `getBudgets`, `saveBudgetPlan`, `getBudgetExecutionReport`, `PresupuestosInstitucionales`.
- **Dependencias/riesgos:** F11-Task02 y registros de compras/pagos; riesgo de datos desactualizados, doble compromiso o sobregiro concurrente.
- **Alcance:** control y alertas por centro de costo; no alterar registros históricos ni sustituir autorizaciones.
- **Criterios de aceptación:** los saldos reflejan aprobado/ejecutado/comprometido; alertas se disparan en umbrales configurados; operaciones concurrentes no exceden disponibilidad; cada bloqueo/aviso queda trazado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la ejecución se mide, pero el informe identifica la alerta como faltante.
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
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 264-278; clave F11-Task15; asignación única: Contabilidad -->

---

<!-- ID: F11-TASK15 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [F11-TASK15] Integrar becas y exoneraciones en los estados de cuenta

**Otros títulos originales:**
- Integrar la gestión de becas y exoneraciones con los estados de cuenta estudiantiles
- **Hallazgo de origen:** sección 4.C.6; se gestionan solicitudes de becas, pero falta integración directa y automatizada en estados de cuenta.
- **Severidad:** Alta. **Objetivo:** reflejar beneficios autorizados de manera consistente en los saldos de cada estudiante.
- **Acción ejecutable:** vincular reglas/solicitudes aprobadas con cargos y estados de cuenta; aplicar vigencias, porcentajes/montos, conceptos y topes; mantener historial de aplicación y reversión.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `configureDiscountScholarshipRule`, `submitDiscountScholarshipRequest`, `getStudentAccountStatement`.
- **Dependencias/riesgos:** autorización de becas, matrícula, periodos de cobro e idempotencia; riesgo de aplicar descuentos duplicados o fuera de vigencia.
- **Alcance:** integración de beneficios autorizados al estado de cuenta; no conceder becas automáticamente.
- **Criterios de aceptación:** solo beneficios aprobados y vigentes afectan saldos; aplicación única y trazable; cambios/revocaciones recalculan según reglas sin borrar movimientos históricos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica la integración como parcial.
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
- **Estado:** Pendiente

---

<!-- ID: F17-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK07] Crear catálogo dinámico de conceptos salariales, bonificaciones y deducciones voluntarias
- **Severidad:** Alta (Flexibilidad administrativa)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`.
- **Solución Propuesta:** Crear la hoja `CatalogoConceptosPlanilla` permitiendo definir bonificaciones fijas/variables y deducciones voluntarias con código contable y tratamiento tributario.
- **Hallazgo de origen:** secciones B.2, F.1 y tabla D/F17-03; backlog G.2.
- **Severidad:** Alta. **Objetivo:** administrar conceptos de remuneración y deducción sin fijarlos como columnas rígidas.
- **Acción ejecutable:** crear `CatalogoConceptosPlanilla` con código, nombre, tipo, fórmula/base, recurrencia, vigencia, tratamiento tributario, cuenta contable, obligatoriedad y estado; permitir configuración autorizada de bonificaciones y deducciones voluntarias.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, `PlanillasNomenclatura`, nueva hoja `CatalogoConceptosPlanilla`.
- **Dependencias/riesgos:** políticas fiscales, catálogo contable, roles RR. HH./contabilidad e historial de períodos; riesgo de conceptos mal clasificados o aplicados retroactivamente.
- **Alcance:** parametrización de conceptos de planilla; no permitir que la UI altere fórmulas legales protegidas sin autorización y versionado.
- **Criterios de aceptación:** conceptos configurables con código único y vigencia; tratamiento contable/fiscal explícito; conceptos aplicados quedan versionados por período; cambios no alteran planillas cerradas; permisos y auditoría activos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica que los conceptos continúan fijados en columnas de la hoja.

---

<!-- ID: F18-TASK05 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK05] Implementar matriz comparativa de cotizaciones y adjudicación por partidas
- **Severidad:** Alta (Optimización de costos y transparencia en adjudicaciones)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `js/accounting.js`, `CotizacionesCompra`.
- **Solución Propuesta:** Vista comparativa que evalúe simultáneamente hasta 5 cotizaciones por precio unitario, plazo, impuestos y condiciones, permitiendo adjudicar partidas a diferentes proveedores.
- **Hallazgo de origen:** sección G, recomendación de transparencia y comparación de cotizaciones.
- **Severidad:** Alta. **Objetivo:** permitir comparar ofertas bajo criterios homogéneos y justificar adjudicaciones.
- **Acción ejecutable:** comparar hasta cinco cotizaciones por precio unitario, plazo, impuestos y condiciones; permitir adjudicación por partida y conservar el resultado.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `js/accounting.js`, `CotizacionesCompra`.
- **Dependencias/riesgos:** cotizaciones vinculadas a una misma solicitud y permisos de adjudicación; riesgo de comparar ofertas no equivalentes.
- **Alcance:** comparación y adjudicación; no reemplaza aprobación de la orden.
- **Criterios de aceptación:** ofertas comparables aparecen lado a lado; criterios y adjudicación por partida quedan trazables; solo roles autorizados adjudican.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se aportan pruebas de esta capacidad.

---

<!-- ID: F18-TASK06 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK06] Completar gestión de cuentas por pagar
- **Severidad:** Alta (Tesorería institucional y control de flujo de caja)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `CuentasPorPagarGastos`.
- **Solución Propuesta:** Permitir registrar abonos parciales a facturas de proveedores, registrar notas de crédito por devoluciones y consultar la cartera por fecha de vencimiento.
- **Hallazgo de origen:** Brecha E.4; ausencia de abonos parciales, programación por vencimiento y notas de crédito.
- **Severidad:** Alta. **Objetivo:** controlar saldos, vencimientos y ajustes de obligaciones con proveedores.
- **Acción ejecutable:** registrar abonos parciales, notas de crédito por devoluciones y consultas de cartera por vencimiento, manteniendo saldo y trazabilidad.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `CuentasPorPagarGastos`.
- **Dependencias/riesgos:** facturas conciliadas (F18-Task02), permisos financieros y consistencia de saldos; riesgo de pagos duplicados o flujo de caja incorrecto.
- **Alcance:** ciclo de cuentas por pagar; no incluye conciliación bancaria.
- **Criterios de aceptación:** abonos reducen saldo sin excederlo; notas de crédito se aplican una sola vez; vencimientos y saldos pendientes se consultan correctamente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita prueba funcional.

---

<!-- ID: F18-TASK07 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK07] Registrar compromisos presupuestarios al emitir órdenes de compra
- **Severidad:** Alta (Control presupuestario preventivo)
- **Componentes Afectados:** `backend/accounting-service/Code.gs` (`checkBudgetAvailability`), `PresupuestosInstitucionales`.
- **Solución Propuesta:** Al aprobar una orden de compra, incrementar automáticamente el `montoComprometido` en la partida presupuestaria del centro de costo para bloquear sobregiros antes de la facturación.
- **Hallazgo de origen:** Brecha E.5; la consulta presupuestaria no registra el compromiso al emitir la orden.
- **Severidad:** Alta. **Objetivo:** prevenir sobregiros por órdenes concurrentes.
- **Acción ejecutable:** al aprobar/emitar una orden, reservar el monto en `montoComprometido` de la partida y centro de costo; impedir duplicación de reservas y definir liberación ante cancelación.
- **Archivos/módulos:** `backend/accounting-service/Code.gs` (`checkBudgetAvailability`), `PresupuestosInstitucionales`, `OrdenesCompra`.
- **Dependencias/riesgos:** autorización de órdenes y consistencia concurrente; riesgo de sobregiro o doble compromiso.
- **Alcance:** reserva presupuestaria vinculada a la orden; no sustituye el registro contable del gasto.
- **Criterios de aceptación:** aprobación actualiza el compromiso una sola vez; órdenes concurrentes no exceden el disponible; cancelación libera la reserva según estado y reglas auditables.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita prueba de concurrencia.

---

<!-- ID: F19-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK04] Implementar depreciación periódica de activos fijos y asientos contables
- **Hallazgo de origen:** secciones B, C.2.12, D, E/F19-12 y H P1.
- **Severidad:** Alta. **Objetivo:** reflejar depreciación acumulada y valor neto en libros de los activos.
- **Acción ejecutable:** implementar cálculo lineal mensual por categoría con costo, valor residual, vida útil, fecha de puesta en servicio y fecha de baja; generar asientos de gasto/depreciación acumulada y conservar períodos contabilizados.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ActivosPatrimoniales`, `AsientosContables`, reportes de activos y contabilidad.
- **Dependencias/riesgos:** catálogo de categorías, política contable, vida útil y bajas; riesgo de depreciar activos no disponibles o duplicar asientos.
- **Alcance:** cálculo y contabilización de depreciación; no cambiar retroactivamente períodos cerrados sin ajuste autorizado.
- **Criterios de aceptación:** cálculo reproducible por período; no supera base depreciable; excluye activos fuera de servicio según política; asiento balanceado e idempotente; valor neto concilia con el auxiliar patrimonial.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara el motor ausente.

---

<!-- ID: F19-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK05] Crear catálogo maestro centralizado de artículos e insumos
- **Hallazgo de origen:** secciones C.2.1, D, E/F19-01 y H P1.
- **Severidad:** Alta. **Objetivo:** evitar que el Kardex cree artículos implícitos con nombres/unidades inconsistentes.
- **Acción ejecutable:** crear `CatalogoArticulos` con código único, nombre normalizado, categoría, unidad de medida, especificaciones, marca/modelo, costo de referencia, código de barras/QR y estado; exigir referencia válida al registrar movimientos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `CatalogoArticulos`, `InventariosKardex`, `js/accounting.js`.
- **Dependencias/riesgos:** Kardex existente, compras/recepciones, unidades y códigos históricos; riesgo de romper referencias antiguas o duplicar artículos.
- **Alcance:** catálogo maestro y validación de referencias; no borrar artículos históricos ni cambiar códigos sin migración trazable.
- **Criterios de aceptación:** alta/edición autorizada; código único; unidad/categoría obligatorias; movimientos referencian artículo existente; reportes consolidan por ID, no por texto libre; datos antiguos quedan vinculados o marcados para reconciliación.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe señala que los artículos se crean implícitamente en Kardex.

---

<!-- ID: F20-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK06] Implementar devolución con inspección física y derivación a incidencias
- **Hallazgo de origen:** secciones B, D/F20-19, F (PT-20-21), E.5 y G P1.
- **Severidad:** Alta. **Objetivo:** evitar que un ejemplar dañado se libere automáticamente como disponible.
- **Acción ejecutable:** extender la devolución para capturar condición física (Bueno, Deteriorado, Incompleto, DañadoIrreparable); actualizar disponibilidad; crear incidencia y estado maintenance cuando corresponda; derivar reposición si la pérdida es irreparable.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `processLibraryLoan`, `recordLibraryIncident`, `BibliotecaPrestamos`, `BibliotecaIncidencias`, `BibliotecaEjemplares`.
- **Dependencias/riesgos:** F20-Task01, incidencias, inventario patrimonial y permisos; riesgo de prestar de nuevo ejemplares dañados.
- **Alcance:** inspección y estado del ejemplar al devolver; no borrar el préstamo histórico.
- **Criterios de aceptación:** condición obligatoria al devolver; ejemplar dañado/incompleto no queda available; incidencia vinculada a préstamo/ejemplar; devolución idempotente; historial y responsable preservados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-20-21 fue rechazada porque la devolución marcaba available incondicionalmente.

---

<!-- ID: F20-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK09] Integrar notificaciones multicanal de vencimientos y disponibilidad de reservas
- **Hallazgo de origen:** secciones A.1, D/F20-31..F20-35 y G P1.
- **Severidad:** Alta. **Objetivo:** avisar vencimientos próximos y disponibilidad de ejemplares reservados.
- **Acción ejecutable:** integrar biblioteca con `sendMultiChannelNotification`; programar aviso 24 horas antes del vencimiento y aviso de reserva disponible; deduplicar por evento/usuario y respetar preferencias.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, servicio multicanal, `BibliotecaPrestamos`, `BibliotecaReservas` y preferencias de usuario.
- **Dependencias/riesgos:** F20-Task01, estados de préstamo/reserva, zona horaria y canales habilitados; riesgo de spam o notificación a destinatario incorrecto.
- **Alcance:** avisos transaccionales; no crear un segundo sistema de notificaciones.
- **Criterios de aceptación:** evento válido genera un aviso por usuario; vencimiento usa fecha local; reserva notifica solo cuando el ejemplar está disponible; fallos quedan registrados; preferencias/consentimientos respetados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita integración multicanal en el inventario fuente.

---

<!-- ID: F21-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md -->
### [ ] [F21-TASK06] Configurar rutas asimétricas de ida/regreso y días específicos
- **Hallazgo de origen:** secciones C.1.3-C.1.5, D, F/F21-03..F21-06 y H P1.
- **Severidad:** Alta. **Objetivo:** modelar rutas diferentes por jornada, días lectivos y eventos.
- **Acción ejecutable:** permitir segmentos de ida/regreso independientes, paradas ordenadas, horarios por día de semana, rutas especiales y vigencias; validar consistencia con vehículo, conductor y asignaciones.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `manageTransportRoute`, `getTransportRoutes`, `TransporteRutas`, `js/accounting.js`.
- **Dependencias/riesgos:** F21-Task05, calendario lectivo, paradas georreferenciadas y asignaciones; riesgo de rutas ambiguas o asignaciones en horarios incompatibles.
- **Alcance:** configuración de recorridos; no confundir ida y regreso como una sola secuencia.
- **Criterios de aceptación:** ida/regreso con paradas/horarios propios; días lectivos configurables; eventos/vigencias; validación de conflictos; rutas publicadas se reflejan en portal familiar y manifiestos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** TASK-034 aparece etiquetada F21-Task06, pero su contenido corresponde al cierre seguro del viaje; no se considera implementación de rutas asimétricas.
- **Evidencia de cierre:** pendiente; no se encontró evidencia de rutas asimétricas por día/jornada.

---

<!-- ID: F21-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md -->
### [ ] [F21-TASK09] Integrar cobros recurrentes de transporte con cuentas estudiantiles
- **Hallazgo de origen:** secciones A.1.9, C.1.14-C.1.17, D/F21-25/F21-26 y H P1.
- **Severidad:** Alta. **Objetivo:** reflejar tarifas y servicios contratados en el estado de cuenta del estudiante.
- **Acción ejecutable:** configurar tarifa por ruta/servicio/período; crear cargos mensuales idempotentes vinculados a estudiante, contrato y período; gestionar altas, bajas, cambios y prorrateos; conciliar con pagos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `CargosEstudiante`, `PagosAbonos`, `TransporteAsignaciones`, módulo de servicios.
- **Dependencias/riesgos:** inscripción, tarifas, cuentas por cobrar y ciclo escolar; riesgo de cargos duplicados o cobros después de una baja.
- **Alcance:** facturación de transporte; no ejecutar cobros bancarios ni crear cargos sin contrato/servicio vigente.
- **Criterios de aceptación:** tarifa versionada; cargo único por estudiante/servicio/período; prorrateo y cancelación auditables; conciliación con pagos; reintentos idempotentes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica facturación parcial y ausencia de cargo automático recurrente completo.

---

<!-- ID: F21-TASK15 | Fuentes: AUDITORIAS/AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md -->
### [ ] [F21-TASK15] Auditar y migrar datos históricos de transporte al modelo maestro
- **Hallazgo de origen:** registro TASK-036 de Auditoria.txt (etiquetado allí como F21-Task08, pero su alcance real es auditoría/migración, no GPS).
- **Severidad:** Alta. **Objetivo:** corregir rutas sin vehículo maestro, paradas JSON no estructuradas y asignaciones huérfanas sin crear entidades ficticias.
- **Acción ejecutable:** implementar/ejecutar `auditAndMigrateTransportData` con diagnóstico previo, reporte de discrepancias, vinculación de vehículos reales, normalización de paradas JSON y resolución de asignaciones huérfanas; autoaprovisionar solo cuando exista evidencia de una unidad real.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `auditAndMigrateTransportData`, `TransporteRutas`, `TransporteVehiculos`, `TransporteAsignaciones`.
- **Dependencias/riesgos:** F21-Task05/F21-Task06, identificadores maestros y relaciones de estudiantes; riesgo de inventar vehículos o reasignar estudiantes incorrectamente.
- **Alcance:** migración y reconciliación de datos existentes; no generar unidades ficticias ni borrar asignaciones sin resolución.
- **Criterios de aceptación:** informe antes/después; cada ruta refiere vehículo maestro válido o queda bloqueada para revisión; paradas usan esquema JSON validado; asignaciones huérfanas resueltas con evidencia; operación idempotente y auditable.
- **Prioridad:** P1 (asignada por impacto de integridad de datos; el registro TASK-036 no declara prioridad).
- **Estado:** Pendiente de revalidación (TASK-036 registra implementación, pero no evidencia suficiente de migración productiva).
- **Reconciliación:** TASK-036 está etiquetada F21-Task08 en Auditoria.txt, pero el contenido corresponde a migración de datos. Se crea F21-Task15 para preservar la tarea de migración sin apropiarse del ID F21-Task08 reservado en el informe para GPS.
- **Evidencia de cierre:** pendiente; el registro describe autoaprovisionamiento correctivo, pero no adjunta inventario de migración antes/después ni evidencia productiva.

---

<!-- ID: F25-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_25_INTEGRACIONES_EXTERNAS.md -->
### [ ] [F25-TASK04] Crear endpoint autenticado de webhooks para confirmaciones de pasarelas de pago
- **Hallazgo de origen:** F25-011, sección F.1 y G.4.
- **Severidad:** Alta. **Objetivo:** recibir confirmaciones asíncronas de pago y conciliarlas con transacciones institucionales.
- **Acción ejecutable:** implementar `handlePaymentGatewayWebhook`; validar firma HMAC sobre el cuerpo original, timestamp, nonce/eventId y proveedor configurado; comprobar importe/moneda/referencia; reservar evento idempotentemente y actualizar estado de pago solo después de validar.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `configureGatewayIntegration`, `IntegracionesPasarelas`, `TransaccionesPasarela`, `PagosAbonos`, `AuditoriaMigraciones`.
- **Dependencias/riesgos:** catálogo de integraciones F25-Task01, secretos seguros, conciliación y pagos; riesgo de falsificación, replay o acreditar pagos inexistentes.
- **Alcance:** recepción y conciliación; no confiar en la URL/importe/estado del cliente ni considerar la prueba sintética como webhook real.
- **Criterios de aceptación:** firma HMAC verificada; timestamp/nonce/eventId anti-replay; proveedor y endpoint autorizados; importe/moneda/referencia concilian; evento idempotente; discrepancias quedan en revisión; errores no acreditan pago.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara que las pasarelas se prueban sintéticamente y no existe endpoint autenticado de webhooks.

---

<!-- ID: F25-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_25_INTEGRACIONES_EXTERNAS.md -->
### [ ] [F25-TASK05] Procesar importaciones masivas en lotes reanudables
- **Hallazgo de origen:** F25-019, sección F.3 y G.5.
- **Severidad:** Alta. **Objetivo:** procesar archivos de más de 1,000 registros sin exceder el límite de ejecución de Apps Script.
- **Acción ejecutable:** particionar importaciones en bloques configurables (200 filas iniciales); persistir ejecuciónId, cursor, total, estado, errores y próximo lote; reanudar por trigger/worker; validar cada lote y evitar duplicados al reintentar.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `importDataWithColumnMapping`, `validateImportPreview`, `AuditoriaMigraciones`, cola de trabajos y triggers.
- **Dependencias/riesgos:** F25-Task02/03, cuotas GAS y consistencia de destino; riesgo de duplicación o lote parcialmente aplicado.
- **Alcance:** importación fraccionada; no mantener una sola ejecución síncrona para todo el archivo.
- **Criterios de aceptación:** chunk size configurable y validado; checkpoint durable; reanudación desde cursor; progreso visible; errores por fila/lote; rollback/compensación documentados; reintentos idempotentes; importación final concilia total leído/escrito/rechazado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe advierte que archivos mayores a 1,000 filas pueden exceder seis minutos.

---

<!-- ID: F29-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK09] Procesar migraciones por lotes paginados y reanudables bajo límites GAS
- **Hallazgo de origen:** BR-29-05; F29-11 y F29-20; secciones C.11/C.20, G e I.
- **Severidad:** Alta / P1. **Objetivo:** completar migraciones grandes sin exceder tiempo/cuotas y sin duplicar filas al reanudar.
- **Acción ejecutable:** particionar lotes (100 iniciales, configurables), persistir executionId/cursor/estado en PropertiesService o cola durable, controlar tiempo restante, checkpoints, backoff y reanudación; registrar fallos por fila y compensaciones.
- **Archivos/módulos:** servicios Academic/Accounting/Developer, `AuditoriaMigraciones`, `importDataWithColumnMapping`, triggers/colas y `PropertiesService`.
- **Dependencias/riesgos:** F29-Task01/06/07, F25-Task05 y TASK-154/TASK-227/TASK-265; riesgo de duplicación, cursor perdido o reintentos tras escritura parcial.
- **Alcance:** ejecución masiva y reanudación; no mantener un único proceso síncrono ni usar offsets inestables sin orden canónico.
- **Criterios de aceptación:** chunk size validado; cursor/checkpoint durable; idempotencia por registro/lote; pausa antes del límite; reanudación desde último commit; errores exportables; progreso reconciliable; pruebas con timeout, reinicio, lote parcialmente escrito y replay.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe señala riesgo de abortos por límite de seis minutos y falta de puntero persistente general.

---

<!-- ID: F29-TASK13 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK13] Completar inventario, extracción y mapeo declarativo de fuentes legadas
- **Hallazgo de origen:** F29-01/F29-02/F29-03; secciones B, C.1-C.3 y H.
- **Severidad:** Alta / P1. **Objetivo:** asegurar que cada fuente y estructura origen tenga un destino y una transformación documentados antes de migrar.
- **Acción ejecutable:** inventariar sistemas, bases, archivos, entidades, responsables, volumen, calidad y dependencias; crear conectores de extracción de solo lectura; versionar perfiles de mapeo origen-destino, transformaciones y reglas de normalización; conservar muestras/checksums.
- **Archivos/módulos:** servicios Academic/Accounting/Developer, `AuditoriaMigraciones`, `validateImportPreview`, F25-Task02 (perfiles de mapeo) y F25-Task01 (catálogo de integraciones).
- **Dependencias/riesgos:** acceso autorizado a fuentes legadas, F29-Task01/06 y F25-Task02; riesgo de extraer datos incompletos o mapear campos incompatibles.
- **Alcance:** inventario, extracción y transformación reproducible; no conectar fuentes sin autorización ni modificar los sistemas origen.
- **Criterios de aceptación:** catálogo de fuentes con propietario y fecha; extracción reproducible/solo lectura; perfiles versionados; campos sin correspondencia quedan identificados; conteos/checksums de origen; pruebas con formatos, codificaciones y columnas variables.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz H califica inventario, extracción y mapeo como parciales.

---

<!-- ID: F30-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md -->
### [ ] [F30-TASK07] Integrar pasarela alternativa de notificaciones y gestión de cuotas de correo
- **Hallazgo de origen:** F30-06; cuota diaria MailApp y ausencia de SMTP alternativo.
- **Severidad:** Alta / P1. **Objetivo:** mantener entrega de notificaciones críticas cuando se agote o degrade la cuota de Google Apps Script.
- **Acción ejecutable:** ampliar `TASK-316` y `TASK-064` para registrar cuota disponible, clasificar prioridad, encolar envíos, conmutar a proveedor alternativo configurado y deduplicar por destinatario/evento; exigir configuración y prueba del proveedor antes de activarlo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `sendMultiChannelNotification`, `retryFailedNotificationsQueue`, `CanalesProveedoresConfig`, monitor de cuotas y UI administrativa.
- **Dependencias/riesgos:** TASK-316 (multicanal/reintentos), TASK-064 (cuotas/alertas), F25-Task01 (catálogo de integraciones); riesgo de duplicar envíos, exponer datos a proveedor o exceder límites del canal alternativo.
- **Alcance:** failover de correo y canales; no enviar datos sensibles a proveedores no aprobados ni asumir SMTP disponible sin credenciales/consentimiento.
- **Criterios de aceptación:** cuota medida/estimada identificada; umbral configurable (85% inicial); prioridad de mensajes; failover solo ante condición definida; idempotencia/deduplicación compartida; consentimiento y secretos seguros; pruebas de cuota agotada, proveedor caído, reintento y no duplicación.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-316/TASK-064).
- **Evidencia de cierre:** pendiente; F30-06 identifica ausencia de pasarela SMTP alternativa y riesgo de agotamiento de cuota.

---

<!-- ID: F35-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md -->
### [ ] [F35-TASK06] Persistir perfiles de mapeo reutilizables por formato y origen
- **Hallazgo de origen:** F35-14; CAR-F35-14.
- **Severidad:** Alta / P1 en la matriz E. **Objetivo:** reutilizar correspondencias de columnas para proveedores y archivos recurrentes.
- **Acción ejecutable:** ampliar F25-Task02 con perfiles de importador que guarden origen/proveedor, entidad destino, encabezados, mapeo, reglas, locale y versión; validar compatibilidad antes de aplicar.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `PerfilesMapeoImportacion`, `importDataWithColumnMapping`, UI de mapeo.
- **Dependencias/riesgos:** F25-Task02, F35-Task01/02/17; riesgo de reutilizar perfiles obsoletos o de otro módulo.
- **Alcance:** perfil reusable de importación; no crear un segundo repositorio incompatible con `PerfilesMapeoColumnas` de Fase 25.
- **Criterios de aceptación:** perfil versionado por origen/entidad; mapping validado; compatibilidad de encabezados; usuario autorizado puede guardar/duplicar/retirar; previsualización obligatoria; pruebas de perfil obsoleto, cambio de columnas y ámbito.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de F25-Task02).
- **Evidencia de cierre:** pendiente; no existe tabla ni interfaz para guardar perfiles por proveedor/formato.

---

<!-- ID: F35-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md -->
### [ ] [F35-TASK07] Generar CSV descargable de errores y filas observadas
- **Hallazgo de origen:** F35-13; CAR-F35-13.
- **Severidad:** Alta / P1. **Objetivo:** entregar al usuario un reporte accionable de cada fila rechazada y su causa.
- **Acción ejecutable:** generar CSV UTF-8 con número de fila, columna, valor sanitizado, código de error, descripción y acción recomendada; permitir descargar solo registros autorizados y limitar exposición de PII.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AuditoriaMigraciones`, `validateImportPreview`, UI de resultados.
- **Dependencias/riesgos:** F35-Task04, F35-Task15/16 y F29-Task18; riesgo de exportar datos sensibles o truncar errores por límite fijo de 20.
- **Alcance:** reporte de errores/resultados; no exportar credenciales, datos financieros completos o payloads sin sanitizar.
- **Criterios de aceptación:** CSV completo/paginado; UTF-8 y escape correcto; error asociado a fila/columna; sin límite arbitrario de 20; permisos verificados; totales coinciden con preview; pruebas de caracteres especiales, PII y lotes grandes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; errores se almacenan en JSON con máximo 20 y no existe descarga CSV.

---

<!-- ID: F38-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md -->
### [ ] [F38-TASK07] Ampliar guías especializadas para procesos administrativos y financieros
- **Hallazgo de origen:** F38-12; CAR-F38-12.
- **Severidad:** Alta / P1. **Objetivo:** orientar tareas complejas que requieren secuencias y controles específicos.
- **Acción ejecutable:** crear guías para conciliación bancaria, importador Excel/CSV, emisión de documentos CUV, cierre de año lectivo y procesos administrativos; vincularlas a controles/contexto de cada módulo.
- **Archivos/módulos:** `js/ui-common.js`, catálogo de guías `getHelpGuidesCatalog`, dashboards Contabilidad/Dirección/Docencia y documentación operativa.
- **Dependencias/riesgos:** F30-Task12 (manuales), F35-Task09 (asistente importador), F31-Task01/07 (documentos); riesgo de guías obsoletas o instrucciones incompatibles con permisos.
- **Alcance:** guías paso a paso; no sustituir manuales completos ni habilitar acciones fuera del rol.
- **Criterios de aceptación:** guías por rol/módulo; pasos probados por responsable; versión/fecha; links contextuales; errores frecuentes y recuperación; pruebas con usuarios representativos y cambios de interfaz.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe guía para diseñador de plantillas, pero faltan conciliación bancaria, cierre de año e importaciones masivas.

---

<!-- ID: F39-TASK20 | Fuentes: AUDITORIAS/AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md -->
### [ ] [F39-TASK20] Detectar documentos similares con revisión humana
- **Hallazgo de origen:** P12 y CAR-F39-04/CAR-F39-14; ausencia de comparación de similitud documental.
- **Severidad:** Media / P1. **Objetivo:** detectar copias renombradas, versiones parecidas o documentos casi duplicados sin confundirlos con duplicados exactos.
- **Acción ejecutable:** complementar SHA-256 con comparación de metadatos y similitud de texto/estructura; generar candidatos con score y evidencia; requerir decisión humana para fusionar, marcar versión o mantener ambos.
- **Archivos/módulos:** servicio de integridad documental, `InventarioDocumentalLegado`, `DocumentosEstudiante`, índice de búsqueda.
- **Dependencias/riesgos:** F39-Task02/04/19, OCR y F29-Task11; riesgo de falsos positivos en documentos oficiales similares.
- **Alcance:** detección de similitud asistida; no eliminar ni fusionar documentos automáticamente.
- **Criterios de aceptación:** score configurable y explicable; hash exacto separado de similitud aproximada; revisión humana obligatoria; historial de decisión; pruebas de copias renombradas, versiones oficiales, formularios similares y escaneos de distinta calidad.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; P12 confirma que no existe comparación de documentos similares.

---

<!-- ID: F40-TASK24 | Fuentes: AUDITORIAS/AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md -->
### [ ] [F40-TASK24] Revisar y revocar permisos heredados u obsoletos automáticamente
- **Hallazgo de origen:** F40-18; accesos residuales tras egreso o desvinculación laboral.
- **Severidad:** Alta / P1. **Objetivo:** retirar accesos que ya no corresponden a la relación laboral, académica o familiar vigente.
- **Acción ejecutable:** programar revisión de ACL por recurso y ámbito; comparar con estado de usuario/relación; proponer revocación de permisos directos/heredados y registrar excepciones aprobadas.
- **Archivos/módulos:** servicios User/Developer, Google Drive ACL, `ROLE_PERMISSIONS`, `Usuarios`, matrículas, contratos y relaciones familiares.
- **Dependencias/riesgos:** TASK-502/AUD-NG-222 (ABAC), F29-Task17 (roles/privacidad), F40-Task01/06; riesgo de revocar acceso legítimo por datos de RRHH/egreso desactualizados.
- **Alcance:** auditoría y revocación controlada; no revocar Shared Drive/propiedad sin validar custodio y política.
- **Criterios de aceptación:** barrido programado; fuentes de estado canónicas; permisos residuales reportados; revocación con aprobación según categoría; excepciones con vencimiento; pruebas de empleado egresado, estudiante graduado, tutor y permiso heredado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F40-18 se encuentra ausente y no hay barrido automatizado de ACL residuales.

---

<!-- ID: F41-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md -->
### [ ] [F41-TASK05] Servicio OCR con corrección humana asistida
- **Hallazgo de origen:** F41-05; CAR-F41-06; E2E-41-06.
- **Severidad:** Alta. **Objetivo:** extraer texto de documentos escaneados y validar/corregir resultados antes de persistirlos.
- **Acción ejecutable:** integrar OCR para español; procesar PDF escaneado e imágenes; devolver texto, coordenadas y confianza por campo; crear interfaz comparativa que marque baja confianza y exija revisión humana.
- **Archivos/módulos:** servicio OCR/adaptador backend, almacenamiento temporal, frontend de digitalización y flujo de formularios.
- **Dependencias/riesgos:** definir proveedor, costo, privacidad, retención y límites; riesgo de errores OCR y exposición de datos sensibles.
- **Alcance:** extracción asistida con revisión humana obligatoria; no persistir como dato validado automáticamente.
- **Criterios de aceptación:** PDF escaneado produce texto/campos con confianza; valores dudosos resaltados; corrección humana registrada; confirmación requerida antes de persistir; pruebas con baja resolución, inclinación, tablas y caracteres españoles.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se localizaron funciones OCR y E2E-41-06 quedó bloqueada.

---

<!-- ID: TAREA-F5-013 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-013] Integrar los cobros de admisión, los pagos y las becas con el expediente del aspirante
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P1-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.13, Brecha P1-01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs` (l. 3330-3420), `js/student.js`
- **Dependencias Expuestas:** Hojas `CargosEstudiante`, `ComprobantesPago`, `SolicitudesDescuentoBeca`
- **Descripción del Alcance:**
  1. Configurar conceptos financieros específicos para admisiones en `ConfiguracionFinanciera`: "Derecho de Admisión", "Examen de Ingreso", "Reserva de Plaza".
  2. Permitir definir montos, fechas de vencimiento, exenciones y reglas de cobro por nivel académico.
  3. Vincular los cargos de admisión a la `solicitudId` del aspirante antes de la asignación de un `userId` de estudiante.
  4. Diferenciar en la contabilidad los ingresos por trámites de admisión de las colegiaturas y matrículas ordinarias.
  5. Permitir consultar el estado financiero de la admisión: `Pendiente`, `Pagado`, `En_Revision`, `Exento`, `Anulado`.
  6. Reutilizar el módulo de carga de comprobantes de pago (`submitJointFamilyPayment`) permitiendo adjuntar transferencias para cobros de admisión.
  7. Permitir la revisión y validación de comprobantes por el departamento de Contabilidad. La carga del recibo no constituye confirmación de pago automática.
  8. Prevenir cargos duplicados mediante claves de idempotencia en la generación de cobros.
  9. Registro contable auditado de todas las transacciones financieras de admisión.
  10. Permitir otorgar becas de admisión o exenciones de pago con aprobación registrada de Dirección.
  11. Habilitar la postulación a becas familiares (`submitFamilyScholarshipApplication`) durante el proceso de admisión.
  12. Transferir el historial de pagos de admisión al expediente contable definitivo del estudiante tras la conversión a matrícula.
  13. Desglosar claramente los cobros por aspirante en el resumen consolidado de la familia.
  14. Bloquear la confirmación de la admisión si existen cargos obligatorios de admisión en estado pendiente o rechazado.
- **Criterios de Aceptación:**
  - [ ] Cargos de admisión se generan automáticamente asociados a la `solicitudId`.
  - [ ] No se duplican cargos al consultar o reintentar peticiones.
  - [ ] Comprobantes de pago subidos quedan en estado `En_Revision` hasta la aprobación contable.
  - [ ] La aprobación del pago actualiza el saldo del aspirante y habilita la siguiente fase del trámite.
  - [ ] Exenciones financieras requieren autorización auditada y motivo justificado.
  - [ ] La conversión a matrícula migra el historial de pagos de admisión sin duplicar cobros.
  - [ ] El resumen familiar distingue los cobros de admisión de los cargos de estudiantes matriculados.
  - [ ] Operaciones financieras fallidas devuelven errores claros sin marcar los cargos como pagados.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F5-018 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-018] Completar la experiencia multiestudiante y el resumen familiar consolidado
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P1-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.9, Brecha P1-01)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `js/student.js` (l. 182-350), `backend/user-service/Code.gs` (l. 3261-3320)
- **Dependencias Expuestas:** `getGuardianStudents`, `getFamilyConsolidatedSummary`, `consolidateStudentDashboardSummary`
- **Descripción del Alcance:**
  1. Optimizar el selector multiestudiante (`initFamilyStudentSwitcher`) y el resumen consolidado (`getFamilyConsolidatedSummary`).
  2. Garantizar una estricta separación de contexto al conmutar entre estudiantes vinculados, refrescando completamente calificaciones, tareas, asistencias, avisos y saldos contables.
  3. En la vista consolidada familiar, distinguir explícitamente entre:
     - Saldo confirmado L 0.00 (Solvente).
     - Información pendiente o no cargada por el docente.
     - Fallo de conexión o respuesta del servidor.
     - Falta de permisos de consulta para el tutor.
  4. Garantizar que el cálculo de saldos consolidados sume correctamente los cargos pendientes de todos los hijos autorizados sin duplicar pagos en revisión.
  5. Mantener desglosados los cobros de admisión de los cargos de colegiatura y matrícula.
  6. Aplicar la matriz de permisos individuales por relación (Tutor Académico vs Tutor Financiero).
  7. Permitir la realización de pagos conjuntos multihijo (`submitJointFamilyPayment`) desglosando los montos aplicados a cada estudiante con comprobante único.
  8. Asegurar que un error de red en la consulta de un estudiante no altere ni ponga a cero los datos de los demás hijos.
  9. Si se revoca la relación familiar de un estudiante, removerlo inmediatamente del selector y de los totales consolidados.
- **Criterios de Aceptación:**
  - [ ] Al seleccionar otro estudiante, todo el panel refresca su información académica y contable sin mezclar datos del estudiante anterior.
  - [ ] Un saldo de L 0.00 se diferencia visualmente de un error de carga del servidor.
  - [ ] El pago conjunto multihijo registra la transacción contable desglosando los abonos para cada estudiante.
  - [ ] Tutores sin permisos financieros no pueden ver ni operar los saldos consolidados de la familia.
  - [ ] La revocación de un vínculo actualiza en tiempo real el selector multiestudiante.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-005 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md ; completadas.md -->
### [ ] [TAREA-F6-005] Crear los microservicios administrativos y financieros con separación por responsabilidades
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 Dirección/Secretaría comparten microservicio y Spreadsheet cuando corresponda, con Drive y permisos separados | Parcial | academic-service y roles existen; carpetas creadas sin ACL ni política efectiva. |
| R2 microservicio financiero con módulos internos | Parcial | existe ACCOUNTING con funciones de varios dominios, pero un único archivo/dispatcher y almacenamiento compartido. |
| R3 vínculo cobro-factura-recibo sin duplicación | No cumple | createAdmissionCharge incompleta; processPaymentReceipt ausente; receipt PDF no se genera; referencias no verificadas. |
| R4 jerarquía Drive automática | Parcial | initializer crea subcarpetas, pero uploads no las usan y no se configuran permisos. |
| R5 múltiples roles desde una cuenta | No cumple | token y enforcement consumen un único role; helper multirol solo devuelve payload. |
| R6 Secretaría cobra y factura en ventanilla | No acreditado | ROLE_PERMISSIONS contable no incluye Secretaría; no hay prueba de matriz dinámica. |
| R7 auditar contexto de cada transacción | No cumple | pagos no guardan actor/rol/contexto verificado. |
| R8 nuevas subáreas mediante configuración | No cumple | módulos, carpetas y actions están codificados en objetos/switch. |
| CA-031 | Parcial | carpeta separada sin ACL. |
| CA-032 | Parcial | funciones agrupadas, sin independencia interna y con documentos públicos. |
| CA-033 | Parcial | getOrCreateFolder encuentra primera coincidencia, pero no controla concurrencia ni duplica preexistente. |
| CA-034 | No cumple | referencias cargo/pago/factura/recibo no son transaccionales ni validadas. |
| CA-035 | No cumple | multirol no llega al token ni a la autorización contable. |
| CA-036 | No cumple | un único servicio/archivo y sin pruebas de aislamiento de fallos. |
- **Origen del Hallazgo:** Reestructuración Arquitectónica / F6-008 (P1 · Reestructuración de Servicios)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Microservicios administrativos y financieros)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - Estructura de carpetas en Google Drive (`Administracion_Financiera/`)
- **Dependencias Expuestas:** `getStudentFile`, `registerStudentEnrollment`, `createAdmissionCharge`, `processPaymentReceipt`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  Dividir y estructurar formalmente las responsabilidades entre el microservicio compartido de Dirección y Secretaría y el microservicio financiero-administrativo (Contabilidad, Cobros, Facturación, Recibos, Inventarios, Recursos Humanos, Planillas).

  Requisitos Funcionales:
  1. Dirección y Secretaría comparten microservicio y Spreadsheet cuando corresponda, pero con carpetas de Drive separadas y permisos estrictos por rol.
  2. Crear el microservicio financiero-administrativo con módulos internos independientes (Contabilidad, Cobros, Facturación, Recibos, Cuentas por Pagar, Inventarios, Bancos, RRHH, Planillas, Contratos, Evaluaciones).
  3. Permitir vinculación legítima entre transacciones (cobro -> factura -> recibo) sin duplicar datos de forma inconsistente.
  4. Mantener la estructura jerárquica de Drive (`Administracion_Financiera/Contabilidad/...` y `Administracion_Financiera/Recursos_Humanos/...`) generada de forma automática.
  5. Permitir que un usuario con múltiples roles (ej. Docente + Contador + Encargado Cafetería) ejecute operaciones autorizadas desde una sola cuenta de usuario.
  6. Permitir que personal de Secretaría realice cobros autorizados y emita facturas en ventanilla sin crear segundas cuentas.
  7. Auditar el contexto de autorización de cada transacción.
  8. Permitir incorporar nuevas subáreas mediante configuración sin reconstruir el microservicio.
- **Criterios de Aceptación:**
  - CA-031: Dirección y Secretaría operan mediante microservicio compartido con permisos y carpetas diferenciados.
  - CA-032: Los módulos financieros y de RRHH funcionan con separación interna de responsabilidades y carpetas aisladas.
  - CA-033: La estructura de carpetas en Drive se inicializa automáticamente sin duplicar carpetas existentes.
  - CA-034: Facturas, cobros y recibos mantienen referencias consistentes en todo momento.
  - CA-035: Un usuario con múltiples roles ejecuta operaciones en distintas áreas sin ampliar permisos indebidamente en otras.
  - CA-036: La indisponibilidad de un módulo no bloquea las operaciones independientes de los demás.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-030 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md ; completadas.md -->
### [ ] [TAREA-F6-030] Crear los microservicios administrativos y financieros con separación por responsabilidades
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-053 Dirección/Secretaría compartido, permisos diferenciados y sin duplicar entidades | Parcial | servicio/roles/carpeta existen; no hay ACL y la acción de inicialización no está autorizada en ROLE_PERMISSIONS. |
| CA-054 módulos financieros con separación interna | Parcial | funciones por dominio, pero un Code.gs, un dispatcher y una fuente de datos común. |
| CA-055 carpetas sin duplicados | Parcial | comprobación getFoldersByName; sin lock ni reconciliación de duplicados existentes. |
| CA-056 documentos asociados a área/subárea | No cumple | cargas de comprobantes y RRHH se guardan en carpetas genéricas fuera de la jerarquía. |
| CA-057 acceso restringido | No cumple | ANYONE_WITH_LINK y ausencia de ACL por carpeta/rol. |
| CA-058 referencias factura/cobro/recibo | No cumple | reciboCajaId opcional sin validación y recibo no generado como PDF. |
| CA-059 nuevas subáreas configurables | No cumple | carpetas/roles/actions hardcodeados. |
| CA-060 indisponibilidad de un módulo no bloquea otros | No cumple | un único servicio y ejecución; sin aislamiento ni pruebas de fallos. |
| CA-148 múltiples roles desde una identidad | Parcial | hay catálogo/ámbitos, pero no se convierten en roles activos de sesión. |
| CA-149 permisos de subárea no se extienden | No cumple | la autorización contable no evalúa roles/subáreas activas independientes. |
| CA-150 trazabilidad con responsabilidades múltiples | No cumple | pagos/facturas no registran actor/rol/contexto verificados. |
- **Origen del Hallazgo:** F6-008 / Reestructuración de servicios
- **Prioridad:** P1
- **Estado:** Pendiente
- **Severidad/Clasificación:** Alta (Reestructuración de servicios)
- **Archivos Involucrados:** Dirección, Secretaría, Contabilidad, Cobros, Facturación, Recibos, Inventarios, Recursos Humanos, Planillas y módulos administrativos relacionados.
- **Descripción del Alcance:**
  A. Microservicio compartido de Dirección y Secretaría:
  Dirección y Secretaría podrán compartir un mismo microservicio y spreadsheet cuando las operaciones y los datos institucionales sean comunes, sin que esto implique conceder a ambos roles los mismos permisos.

  Requisitos funcionales:
  - Mantener un microservicio compartido para las funciones de Dirección y Secretaría.
  - Permitir que ambos roles utilicen el mismo spreadsheet cuando corresponda.
  - Crear carpetas de Drive separadas para Dirección y Secretaría.
  - Crear carpetas compartidas únicamente para documentos que deban ser accesibles a ambos roles.
  - Aplicar permisos por usuario, rol, área, módulo y operación.
  - Mantener las funciones institucionales de gestión de estudiantes, expedientes, matrículas, traslados, retiros, reingresos, graduaciones y demás procesos administrativos.
  - Evitar duplicar estudiantes, expedientes o matrículas por el hecho de que diferentes usuarios consulten o actualicen los mismos datos.
  - Permitir que una persona autorizada desempeñe simultáneamente funciones de Secretaría, Dirección u otras áreas, sin duplicar su identidad institucional.
  - Permitir que las operaciones autorizadas de Secretaría se extiendan a otras áreas, como Cobros o Facturación, cuando el usuario tenga asignadas las responsabilidades correspondientes.
  - Mantener registros de auditoría que permitan identificar al usuario, el rol o contexto operativo utilizado y la operación ejecutada.

  B. Microservicio financiero-administrativo:
  Contabilidad, Cobros, Facturación, Recibos, Inventarios, Recursos Humanos y Planillas podrán compartir un mismo microservicio, con módulos internos independientes y permisos específicos.

  1. Crear un microservicio financiero-administrativo que pueda gestionar: Contabilidad, Cobros y cuentas por cobrar, Facturación, Recibos, Cuentas por pagar, Inventarios, Bancos y conciliaciones, Recursos Humanos, Planillas y nómina, Acciones de personal, Contratos, permisos, ausencias y evaluaciones laborales, y Nuevas subáreas que se incorporen posteriormente.
  2. Organizar los módulos mediante componentes independientes, cada uno con sus operaciones, validaciones, permisos y registros.
  3. Permitir el intercambio de información cuando exista una relación funcional legítima. Por ejemplo, un cobro debe poder asociarse con su factura y recibo sin generar copias independientes e inconsistentes de la misma transacción.
  4. Mantener controles de acceso específicos por rol, área, módulo y operación. Tener acceso al microservicio no debe conceder automáticamente acceso a toda la información financiera o laboral.
  5. Separar los documentos de Recursos Humanos de los documentos contables y financieros.
  6. Evitar que los documentos laborales, las planillas y los datos financieros queden expuestos mediante carpetas raíz o permisos excesivamente amplios.
  7. Permitir que un usuario tenga responsabilidades en varias subáreas. Por ejemplo, una persona puede ser docente, contador y encargado de cafetería, con permisos diferenciados para cada función.
  8. Permitir que una secretaria autorizada realice cobros en efectivo y emita facturas sin tener que crear una segunda cuenta de usuario.
  9. Registrar cada operación con el usuario y el contexto de autorización correspondiente, sin asumir que todas las operaciones realizadas por una misma persona pertenecen a su rol principal.
  10. Permitir incorporar nuevas subáreas mediante configuración, sin reconstruir el microservicio.

  Estructura inicial de Google Drive:
  - `Administracion_Financiera/`
    - `Contabilidad/`
      - `Facturacion/`
      - `Cuentas_por_Cobrar/`
      - `Cuentas_por_Pagar/`
      - `Recibos/`
      - `Inventarios/`
      - `Bancos_y_Conciliaciones/`
      - `Reportes/`
      - `Otros_Modulos/`
    - `Recursos_Humanos/`
      - `Expedientes_Laborales/`
      - `Planillas/`
      - `Acciones_de_Personal/`
      - `Contratos/`
      - `Permisos_y_Ausencias/`
      - `Evaluaciones/`

  La estructura deberá generarse automáticamente al inicializar el servicio. Las nuevas subáreas se incorporarán mediante configuración, sin duplicar carpetas existentes ni reconstruir las que ya contienen documentos.
- **Criterios de Aceptación:**
  - CA-053: Dirección y Secretaría operan mediante el microservicio compartido, con permisos diferenciados y sin duplicación de entidades.
  - CA-054: Los módulos financieros y administrativos funcionan dentro del microservicio compartido con separación interna de responsabilidades.
  - CA-055: La estructura de carpetas se crea sin duplicar carpetas existentes.
  - CA-056: Cada documento queda asociado con su área y subárea.
  - CA-057: Un usuario sin autorización no puede consultar ni modificar información restringida.
  - CA-058: Facturas, cobros y recibos mantienen referencias consistentes.
  - CA-059: Las nuevas subáreas pueden incorporarse mediante configuración.
  - CA-060: La indisponibilidad de un módulo no bloquea las operaciones independientes de los demás.
  - CA-148: Un usuario con varios roles puede ejecutar operaciones autorizadas en distintas áreas desde una sola identidad institucional.
  - CA-149: Los permisos de una subárea no se extienden automáticamente a las demás.
  - CA-150: Los documentos y las transacciones conservan su trazabilidad al ser utilizados por usuarios con distintas responsabilidades.

---

<!-- ID: TASK-159 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-159] Materialización automática de recargos por mora y administración de morosidad
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6795-6828; clave TASK-160; asignación única: Contabilidad -->

---

<!-- ID: TASK-160 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-160] Desarrollo de la consola administrativa de cobranza, caja y revisión de comprobantes
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6829-6858; clave TASK-161; asignación única: Contabilidad -->

---

<!-- ID: TASK-161 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-161] Interfaz de configuración de conceptos, tarifas, aranceles y planes de pago
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6859-6893; clave TASK-162; asignación única: Contabilidad -->

---

<!-- ID: TASK-162 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-162] Integración real de pasarelas de pago y procesamiento de notificaciones externas
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6894-6925; clave TASK-163; asignación única: Contabilidad -->

---

<!-- ID: TASK-164 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-164] Sistema analítico de morosidad, antigüedad de saldos y proyección de recaudación
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6959-6989; clave TASK-165; asignación única: Contabilidad -->

---

<!-- ID: TASK-166 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-166] Ajustes administrativos de cargos, modificaciones de obligaciones y control de retiros
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7022-7051; clave TASK-167; asignación única: Contabilidad -->

---

<!-- ID: TASK-167 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-167] Administración de becas, descuentos temporales y vencimiento automático de beneficios
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7052-7081; clave TASK-168; asignación única: Contabilidad -->

---

<!-- ID: TASK-174 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-174] Automatizar la deducción de anticipos y préstamos y actualizar su amortización al cerrar la planilla
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7314-7350; clave TASK-175; asignación única: Contabilidad -->

---

<!-- ID: TASK-175 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-175] Implementar un catálogo dinámico de conceptos salariales, reglas de cálculo y ajustes
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7384-7420; clave TASK-177; asignación única: Contabilidad -->

---

<!-- ID: TASK-177 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-177] Implementar la generación masiva y distribución segura de comprobantes de pago
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7421-7456; clave TASK-178; asignación única: Contabilidad -->

---

<!-- ID: TASK-178 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-178] Incorporar exportación bancaria para dispersión masiva de salarios
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7457-7488; clave TASK-179; asignación única: Contabilidad -->

---

<!-- ID: TASK-179 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-179] Integrar correctamente las obligaciones patronales con la contabilidad por partida doble
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7489-7520; clave TASK-180; asignación única: Contabilidad -->

---

<!-- ID: TASK-180 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-180] Mejorar el procesamiento de planillas por lotes y la revisión comparativa de resultados
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7525-7559; clave TASK-181; asignación única: Contabilidad -->

---

<!-- ID: TASK-181 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-181] Crear una matriz comparativa de cotizaciones y adjudicación por partidas
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7560-7593; clave TASK-182; asignación única: Contabilidad -->

---

<!-- ID: TASK-182 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-182] Integrar la recepción de compras con el registro de activos fijos
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7594-7631; clave TASK-183; asignación única: Contabilidad -->

---

<!-- ID: TASK-183 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-183] Ampliar el catálogo de proveedores con contactos múltiples y datos comerciales protegidos
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7632-7666; clave TASK-184; asignación única: Contabilidad -->

---

<!-- ID: TASK-184 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-184] Implementar el expediente digital unificado de adquisiciones
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7671-7723; clave TASK-185; asignación única: Contabilidad -->

---

<!-- ID: TASK-185 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-185] Motor integral de depreciación y gestión contable de activos fijos
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7724-7761; clave TASK-186; asignación única: Contabilidad -->

---

<!-- ID: TASK-186 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-186] Creación de un catálogo maestro institucional de artículos, materiales y suministros
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7762-7802; clave TASK-187; asignación única: Contabilidad -->

---

<!-- ID: TASK-187 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-187] Programación automática y administración del mantenimiento preventivo recurrente
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7803-7840; clave TASK-188; asignación única: Contabilidad -->

---

<!-- ID: TASK-188 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-188] Integración contable de consumos, entregas y movimientos de inventario
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7841-7879; clave TASK-189; asignación única: Contabilidad -->

---

<!-- ID: TASK-189 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-189] Implementación de un sistema integral de valoración económica del inventario
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7880-7915; clave TASK-190; asignación única: Contabilidad -->

---

<!-- ID: TASK-190 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-190] Implementación de reservas, disponibilidad y reposición inteligente de materiales
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8172-8198; clave TASK-200; asignación única: Contabilidad -->

---

<!-- ID: TASK-200 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-200] Facturación automática de servicios y cargos recurrentes en estados de cuenta
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8300-8322; clave TASK-205; asignación única: Contabilidad -->

---

<!-- ID: TASK-205 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-205] Administración centralizada de tarifas, contratos y condiciones de servicios
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8425-8450; clave TASK-210; asignación única: Contabilidad -->

---

<!-- ID: TASK-270 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-270] [P1] Migración Histórica de Contabilidad, Cuentas por Cobrar y Obligaciones Administrativas
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12291-12322; clave TASK-332; asignación única: Contabilidad -->

---

<!-- ID: TASK-332 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-332] [P1] Guía interactiva especializada para conciliación bancaria
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13032-13046; clave TASK-356; asignación única: Contabilidad -->

---

<!-- ID: TASK-485 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-11.md ; Pendientes.md -->
### [ ] [TASK-485] Activar un enrutador contextual único con soporte de historial y rutas directas
- **Hallazgo de origen:** AUD-NG-188; T-UX-11.
- **Severidad:** Alto.
- **Objetivo:** hacer que navegación, URL y estado de vista representen el mismo destino.
- **Acción ejecutable:** inicializar initNoLoopHistoryManager en la carga común; procesar estados {view, params} desde el listener central; resolver hash/ruta inicial al cargar; validar destinos y mostrar error controlado cuando no existan; normalizar navegación entre paneles.
- **Archivos/módulos afectados:** js/ui-common.js, módulos de dashboard y handlers de navegación.
- **Dependencias y riesgos:** AUD-NG-162 para diferenciar sesión expirada de permiso insuficiente; TASK-483 para visibilidad de rutas.
- **Alcance:** router, historial del navegador y navegación directa.
- **Criterios de aceptación:** abrir URL directa muestra vista correcta; atrás/adelante restaura destino; vista inválida produce estado/error explícito; listener se inicializa una sola vez; navegación no crea bucles.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de carga directa, pushState/popstate y destinos inválidos.
- **Origen del Hallazgo:** AUD-NG-188 en Auditoria.txt (T-UX-11, navegación contextual).
- **Severidad/Clasificación:** Alto / P1.
- **Archivos Involucrados:** `js/ui-common.js`, `js/teacher.js`, dashboards HTML y módulos de navegación relacionados.
- **Dependencias Expuestas:** `switchActiveView`, `initNoLoopHistoryManager`, `handlePopState`, `window.navigateTo`, `pushNav`, `popNav`, `syncNavWithState`, `history.pushState`, `history.replaceState`, `popstate`, URL/hash, sesión y permisos efectivos.
- **Descripción del Alcance:**
  1. Definir un contrato único de rutas/estados para vistas, secciones de dashboard, navegación jerárquica y overlays; evitar gestores paralelos que no procesen los mismos tipos de estado.
  2. Garantizar que el consumidor de estados `{view, params}` se inicialice una sola vez antes de aceptar navegación. Actualmente `initNoLoopHistoryManager` está definido, pero no se encontró una invocación en los módulos y páginas inspeccionados.
  3. Resolver la ruta inicial desde URL/hash al cargar o recargar, además de procesar `popstate`; no depender de que el usuario haya llegado desde otra vista.
  4. Validar rutas contra un registro de vistas existentes y contra el rol/permisos efectivos. Una ruta inexistente o no autorizada debe mostrar una salida comprensible y no dejar la interfaz en estado ambiguo.
  5. Unificar o integrar explícitamente la navegación propia de `js/teacher.js` (`navigateTo`, `pushNav`, `popNav`, `syncNavWithState`) con el contrato compartido, sin romper el historial de modales ni crear ciclos de pushState/popstate.
  6. Integrar las páginas de Dirección, RH, Contabilidad, Estudiante, Docente y los demás dashboards cubiertos por el contrato.
  7. Reutilizar la diferenciación entre sesión vencida/revocada y permiso insuficiente de AUD-NG-162; la navegación no debe confirmar ni simular una operación guardada ante expiración.
- **Criterios de Aceptación:**
  - La inicialización del gestor es explícita, idempotente y ocurre en todos los dashboards que lo requieren.
  - Abrir una vista y pulsar atrás/adelante restaura la vista correcta; no se ignoran los estados `view` ni se producen bucles de historial.
  - Una URL directa con ruta/hash válido abre la vista correspondiente tras carga y recarga, sin navegación previa.
  - Un hash/ruta inexistente o no autorizado produce una vista de error/retorno controlado; nunca un retorno silencioso que mantenga contenido incorrecto.
  - Los estados de modal, sección, vista y navegación jerárquica no se pisan ni cierran vistas ajenas.
  - Los paneles de Estudiante, Docente, Dirección, RH y Contabilidad usan el contrato común o un adaptador documentado que garantiza el mismo comportamiento.
  - Una sesión expirada durante una operación no muestra confirmación de guardado; los errores de permiso conservan la sesión válida.
  - Pruebas reproducibles cubren carga directa, recarga, atrás/adelante, ruta inválida, acceso denegado, sesión vencida y coexistencia con modales.
- **Relaciones y límites:** AUD-NG-162 cubre el contrato de expiración; T-UX-13/TASK-483 cubren menú/rutas visibles por rol. TASK-485 se limita al enrutamiento y ciclo de vida del historial, sin duplicar esas correcciones.
- **Estado:** [ ] Pendiente.

---

<!-- ID: TASK-486 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-11.md ; Pendientes.md -->
### [ ] [TASK-486] Preservar y restaurar el estado real de listas y vistas de detalle al navegar
- **Hallazgo de origen:** AUD-NG-189; T-UX-11.
- **Severidad:** Alto.
- **Objetivo:** conservar filtros, búsqueda, orden, página y contexto al entrar a detalle y regresar.
- **Acción ejecutable:** definir snapshot por vista/lista; capturar parámetros de la vista saliente antes de navegar; restaurar snapshot al regresar; evitar almacenar parámetros del destino bajo la vista incorrecta; unificar comportamiento entre paneles.
- **Archivos/módulos afectados:** js/ui-common.js y consumidores de listas/detalles en dashboards.
- **Dependencias y riesgos:** TASK-485 para router/historial; TASK-429 para paginación restaurable.
- **Alcance:** estado de listas, filtros y vistas de detalle.
- **Criterios de aceptación:** entrar a detalle y regresar conserva búsqueda, filtros, orden, página y scroll; cambios de datos se reconcilian sin perder contexto; snapshot está aislado por vista/usuario; pruebas cubren paneles distintos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de navegación ida/vuelta en dashboards.
- **Origen del Hallazgo:** AUD-NG-189 en Auditoria.txt (T-UX-11, conservación de contexto).
- **Severidad/Clasificación:** Alto / P1.
- **Archivos Involucrados:** `js/ui-common.js`, `js/teacher.js`, `js/student.js`, `js/accounting.js` y dashboards HTML.
- **Dependencias Expuestas:** `VIEW_STATES_CACHE`, `switchActiveView`, `stateParams`, `history.state`, filtros, búsqueda, ordenamiento, paginación, selección, scroll, vistas de detalle y `navStack`.
- **Descripción del Alcance:**
  1. Capturar el estado de la vista que se abandona (filtros, consulta, orden, página, pestaña, selección y scroll cuando aplique) antes de cambiar de destino.
  2. Corregir el contrato de `switchActiveView`: actualmente asigna al caché de la vista saliente el `stateParams` recibido para el destino y, al volver, solo restaura scroll; no consume `cached.params`.
  3. Restaurar el snapshot al volver desde detalle o mediante atrás/adelante, sin reconstruir la lista con valores por defecto ni ejecutar consultas innecesarias.
  4. Mantener el estado al abrir una vista de detalle desde una URL directa y al regresar; el flujo no debe depender de una navegación previa.
  5. Integrar el stack jerárquico de Docente y los estados de listas de Estudiante, Contabilidad, Dirección y RH con el contrato común, o documentar adaptadores con equivalencia comprobable.
  6. Aislar los snapshots por usuario, rol y vista; evitar persistir datos personales sensibles en URL o almacenamiento no apropiado.
- **Criterios de Aceptación:**
  - Desde una lista filtrada y paginada, abrir un registro y regresar conserva exactamente filtros, búsqueda, orden, página, selección y scroll que correspondan.
  - El snapshot guardado pertenece a la vista saliente y no contiene parámetros del destino.
  - Al restaurar, se consumen los parámetros almacenados y el contenido coincide con el estado visual.
  - Abrir un registro directamente y volver conduce a una lista/ubicación de retorno válida o a un fallback explícito.
  - Los estados de un usuario/rol no se reutilizan para otro usuario/rol.
  - Pruebas reproducibles cubren cambios de filtros, página, orden, detalle, recarga, atrás/adelante y datos ausentes.
- **Relaciones y límites:** TASK-485 proporciona el enrutador/historial; TASK-486 implementa snapshot/restauración del contexto de vistas. T-UX-15 cubre filtros/paginación como funcionalidad propia, pero no sustituye la preservación de su estado durante navegación.
- **Estado:** [ ] Pendiente.

---

<!-- ID: TASK-487 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-12.md ; Pendientes.md -->
### [ ] [TASK-487] Integrar indicadores operativos reales en los paneles de Estudiante, Docente y Contabilidad
- **Hallazgo de origen:** AUD-NG-190; T-UX-12.
- **Severidad:** Alto.
- **Objetivo:** que los resúmenes de cada panel se alimenten de datos reales y tengan accesos útiles.
- **Acción ejecutable:** conectar consolidadores a los dashboards; corregir el campo incompatible del resumen estudiantil; sustituir el resumen contable estático/cero por consulta real; distinguir ausencia de datos de fallo; enlazar indicadores a las vistas correspondientes.
- **Archivos/módulos afectados:** js/student.js, js/teacher.js, js/accounting.js y sus dashboards.
- **Dependencias y riesgos:** TASK-483 para navegación; no mostrar métricas ficticias ni valores cero por indisponibilidad.
- **Alcance:** indicadores de los tres roles.
- **Criterios de aceptación:** cada KPI deriva de fuente real y documentada; ausencia/indisponibilidad tiene estado diferenciado; accesos abren la vista filtrada correcta; pruebas por rol y datasets vacíos/no vacíos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de datos y navegación por dashboard.
- **Origen del Hallazgo:** AUD-NG-190 en Auditoria.txt (T-UX-12; consolidación y calidad de los resúmenes por rol).
- **Severidad/Clasificación:** Alto / P1.
- **Archivos Involucrados:** `js/student.js`, `student-dashboard.html`, `js/teacher.js`, `teacher-dashboard.html`, `js/accounting.js`, `dashboard-contabilidad.html` y los servicios backend que suministran las métricas académicas, de tareas y financieras.
- **Dependencias Expuestas:** `consolidateStudentDashboardSummary`, `consolidateTeacherDashboardSummary`, `consolidateAccountingDashboardSummary`, `renderResumenModule`, datos de actividades/entregas, asignaciones docentes, estudiantes, ingresos, egresos, cuentas pendientes y contexto de usuario/período.
- **Descripción del Alcance:**
  1. Integrar los tres consolidadores con sus dashboards y fuentes de datos autorizadas. Actualmente cada helper solo aparece declarado en su módulo; no se encontró consumidor que lo invoque ni elementos del HTML que presenten sus resultados.
  2. Estudiante: construir el resumen desde el modelo real de actividades. El módulo procesa entregas mediante `actividad.entrega.estado`, mientras el helper cuenta pendientes con `!actividad.entregado`; alinear el contrato y diferenciar tareas de exámenes para que el total no mezcle categorías ni clasifique como pendientes actividades ya entregadas/revisadas.
  3. Docente: obtener y consolidar clases/asignaciones vigentes, estudiantes y entregas que realmente requieren revisión; enlazar cada indicador con la lista o acción correspondiente y respetar las asignaciones del docente autenticado.
  4. Contabilidad: sustituir el contenido estático de `renderResumenModule` por indicadores alimentados por servicios financieros reales. Integrar el helper contable con las respuestas efectivas de ingresos, egresos, saldo y facturas/cuentas pendientes, sin asumir nombres de campos que el backend no entregue.
  5. Separar visual y semánticamente indicadores de resumen, avisos, tareas que requieren atención y listas operativas; evitar duplicar en las tarjetas los registros completos de las tablas.
  6. Distinguir explícitamente valor cero, dato no disponible, carga pendiente y error. No convertir objetos ausentes, respuestas incompletas ni fallos de servicio en métricas de cero.
  7. Aplicar contexto de usuario, rol, asignación académica, período lectivo/financiero y frescura de los datos; no reutilizar resultados de otro usuario ni de otro período.
  8. Proporcionar accesos directos funcionales a las tareas prioritarias y verificar que cada destino y acción esté autorizado en servidor.
- **Criterios de Aceptación:**
  - Los tres helpers se invocan desde los flujos reales de sus dashboards y sus resultados se muestran en componentes visibles.
  - El resumen estudiantil distingue tareas, exámenes, pendientes y entregas según los estados reales del modelo; no depende de una propiedad inexistente o desactualizada.
  - El resumen docente coincide con las clases, estudiantes y entregas que corresponden al docente autenticado y al período activo.
  - El resumen contable presenta importes y pendientes reconciliables con las respuestas del servicio financiero; no conserva el placeholder textual como panel principal.
  - Una respuesta vacía válida muestra cero solo cuando el servicio confirma que no existen registros; un error o dato ausente se representa como no disponible.
  - Los accesos directos conducen a registros/operaciones reales y no a controles decorativos o vistas sin acción.
  - Pruebas reproducibles cubren usuario sin asignaciones, período sin registros, respuestas parciales, error de servicio, datos obsoletos y valores positivos/cero.
- **Relaciones y límites:** T-UX-16 cubre el centro de notificaciones y la diferenciación de avisos/tareas/aprobaciones; TAREA-04 cubre optimización de paneles analíticos y tablas extensas. Se reutilizan sus contratos sin duplicar su alcance. TASK-487 se limita a integrar y hacer correctos los resúmenes de Estudiante, Docente y Contabilidad.
- **Estado:** [ ] Pendiente.

---

<!-- ID: TASK-637 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK02.md -->
### [X] [TASK-637] Completar el inventario integral de archivos
- **Referencia:** AUD-NG-281.
- **Severidad:** ALTO.
- **Prioridad:** P1.
- **Estado:** Completada (implementación documental, verificaciones internas, autoauditoría y Code Review aprobados en C1.287).
- **Objetivo y acción:** generar y mantener un inventario exhaustivo de los 974 archivos versionados, con ruta exacta, tipo, tamaño, SHA, área funcional, propósito y condición de uso; reconciliarlo con el árbol Git vigente y contemplar contenido académico, assets, datos, documentación, pruebas, configuración y backend.
- **Archivos/módulos afectados:** `docs/architecture/repository-inventory.md`, `AUDITORIAS/MapaDependencias.md`, árbol completo del repositorio.
- **Dependencias:** árbol Git de la rama de trabajo, documentación vigente, punto de entrada `index.html`.
- **Criterios de aceptación:** 100 % de las rutas versionadas presentes una sola vez; ningún archivo omitido o inventado; clasificación verificable; diferencias de árbol registradas; no renombrar el punto de entrada.
- **Alcance:** documentación e inventario, sin mover ni alterar archivos fuente.

- **Ampliación por auditoría AUD-NG-344:** el requisito original conserva la cifra histórica de 974; el árbol Git del HEAD auditado contiene 999 blobs versionados. La cobertura se ajusta a los 999 archivos reales, sin borrar el dato original.
- **Aclaración de ruta AUD-NG-346:** la ubicación vigente del mapa es `Auditoría/MapaDependencias.md`; la referencia histórica `AUDITORIAS/MapaDependencias.md` no debe usarse como ruta activa.
- **Evidencia de cierre:** inventario `docs/architecture/repository-inventory.md`, blob SHA `41f8e122eb7171c9f59a0552c9ad13ac4c90f9b0`; Git tree `b0042a7edd424ebf8efab7bcd1aace3641f08b23`; 999 rutas únicas con tamaño y SHA.
- **Pruebas:** 999/999 rutas; unicidad; tamaño/SHA; clasificación; punto de entrada `index.html` sin cambios.
- **Seguimiento C1.283 / AUD-NG-347:** la reauditoría posterior detectó dos informes creados en el commit anterior que no estaban en el snapshot de 999. Se amplía la cobertura a 1.002 rutas, incluyendo el informe de seguimiento C1.283.
- **Estado operativo tras el reinicio global:** Pendiente; la reauditoría histórica se conserva como antecedente y no acredita cierre del Plan Maestro.
- **Evidencia adicional:** tree C1.282 `e052e8781270a0a23aedd2d90177b601d8df063a`; informe `Auditoría/AUDITORIA_TASK-637_C1.283.md` blob `af96fa04c573dbacdb6c3637aeed35dea9462cad`.
- **Seguimiento C1.287 / AUD-NG-348:** el tree de partida `bdce474c52cfc4d85614dcdf6960189748f85ccc` contiene 1.010 blobs (no truncado); la tabla anterior tenía 1.001 filas, omitía 9 rutas y 12 metadatos estaban desactualizados. Se amplía TASK-637 sin duplicar el ID.
- **Evidencia de implementación:** inventario actualizado a 1.011 rutas únicas, incluyendo el informe C1.287 creado en la misma iteración; tamaños y SHA contrastados con Git tree/blob, autorreferencia SELF con tamaño exacto. `index.html` conserva SHA `cd742047cdc4948259dd721119429b04f78330ca`.
- **Estado al cierre C1.287:** implementación documental validada; el estado Completada se confirma en C1.288 conforme a la definición normativa: cierre de implementación y controles internos, sin esperar aprobación del usuario ni certificación beta.

---

<!-- ID: TASK-638 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK02.md -->
### [ ] [TASK-638] Trazar dependencias estáticas y dinámicas de extremo a extremo
- **Referencia:** AUD-NG-282.
- **Severidad:** ALTO.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Objetivo y acción:** documentar por archivo las dependencias HTML `script/link`, CSS, imágenes, fuentes, imports, referencias dinámicas, rutas, endpoints, acciones backend, contratos y servicios externos; distinguir referencias comprobadas de inferidas y registrar consumidores/proveedores.
- **Archivos/módulos afectados:** HTML, JS, CSS, JSON, GAS, configuración, documentación y recursos del repositorio; `AUDITORIAS/MapaDependencias.md`.
- **Dependencias:** TASK-637, catálogo completo de archivos.
- **Criterios de aceptación:** cada dependencia explícita tiene origen y destino exactos; referencias relativas y sensibles a mayúsculas quedan identificadas; rutas dinámicas y endpoints tienen contrato documentado; no se declaran rutas funcionales sin evidencia verificable.
- **Alcance:** auditoría y documentación; no cambiar rutas ni contratos durante la auditoría.

---

<!-- ID: TASK-660 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK06.md -->
### [ ] [TASK-660] Inventariar ubicaciones y limpiar temporales huérfanos de forma segura
- **Hallazgo:** AUD-NG-305.
- **Severidad:** ALTO/P1.
- **Objetivo:** identificar los destinos de materiales, entregas, versiones, proyectos y cargas temporales y evitar acumulación de residuos.
- **Acción:** definir catálogo de carpetas con ID/propósito/propietario; registrar la ubicación real y relación de cada archivo con su entrega/material/versión; implementar reconciliación de sesiones expiradas y temporales sin referencia; exigir antigüedad, estado terminal y ausencia de vínculo antes de limpiar; poner en cuarentena y generar reporte antes de eliminar; nunca enviar a papelera archivos académicos válidos automáticamente.
- **Archivos/módulos:** backend/task-service/Code.gs; js/student.js; administración de almacenamiento; documentación de carpetas.
- **Dependencias:** TASK-656 y TASK-659.
- **Alcance:** inventario, reconciliación y limpieza controlada de temporales; no purgar archivos productivos en la primera fase.
- **Criterios de aceptación:** todas las rutas utilizadas aparecen en catálogo; archivos válidos se conservan; huérfanos se identifican con evidencia; temporales vencidos se ponen en cuarentena; toda limpieza es auditable y reversible; pruebas con fixtures.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: AUD-NG-173 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-173] Integrar y completar la vista de actividad reciente contextual
- **Origen del Hallazgo:** Auditoría de tareas completadas, T-UX-26; evidencia en `js/ui-common.js` y `ChangesLogs.txt` (octubre de 2026).
- **Severidad/Clasificación:** Medio (P2; integración funcional, navegación y privacidad de actividad).
- **Archivos Involucrados:** `js/ui-common.js`, paneles de control por rol, módulos que generan actividad, pruebas de regresión; relacionado con TASK-067 y TASK-221.
- **Problema Detectado:** T-UX-26 implementó `recordRecentActivity`, `getRecentActivity` y `renderContextualRecentActivity`, pero la auditoría no encontró llamadas a esas funciones ni integración del renderizador en los paneles principales revisados (Dirección, Coordinación, Secretaría, Contabilidad, Docente, Estudiante y Desarrollador). Por tanto, el bloque de código existe, pero no se demuestra una vista visible ni un flujo real de registro. El almacenamiento utiliza una clave global de localStorage sin identidad de usuario/institución; el filtrado solo por rol no aísla cuentas. La navegación solo llama a `switchActiveView`; no se demuestra que `targetId` abra o restaure el registro concreto. El renderizado concatena `title` y `description` en `innerHTML` sin escape contextual.
- **Alcance y requisitos:**
  1. Integrar el panel en los dashboards pertinentes por rol y conectar eventos reales de módulos, sin inventar actividad ni registrar datos sensibles.
  2. Asegurar aislamiento por `authUserId` e `institucionId`, coordinado con TASK-067; las reglas de visibilidad deben basarse en permisos vigentes, no solo en valores de rol almacenados localmente.
  3. Distinguir claramente entradas informativas de tareas pendientes y enlazar las tareas accionables con la bandeja institucional TASK-221, evitando duplicar su fuente de verdad.
  4. Hacer que el destino valide la existencia y autorización del registro; el `targetId` debe ser consumido por el módulo destino para abrir el elemento concreto, o mostrar una alternativa clara si ya no está disponible.
  5. Insertar títulos/descripciones como texto seguro (por ejemplo, `textContent`/nodos DOM) y validar timestamps, límites y estructura de cada entrada.
  6. Definir retención, límite y limpieza de actividad, incluyendo cambio de cuenta, cierre de sesión y datos obsoletos.
  7. Añadir pruebas automatizadas y de navegador para registrar, filtrar, ordenar, renderizar, navegar, cambiar de usuario y manejar destinos inexistentes.
- **Criterios de aceptación:**
  - La vista aparece en cada dashboard que corresponda y muestra solo actividad real y autorizada.
  - El registro de actividad está conectado a eventos reales; el feed no permanece vacío por falta de productores.
  - Dos usuarios/instituciones que compartan navegador no pueden ver ni sobrescribir actividad ajena.
  - Los elementos informativos y pendientes se distinguen y los pendientes remiten a la fuente de verdad.
  - Abrir un elemento navega al registro exacto autorizado; un registro eliminado o inaccesible se maneja sin error ni fuga.
  - Contenido de texto malicioso no se interpreta como HTML ejecutable.
  - Las pruebas cubren orden temporal, roles, permisos, cambio de cuenta y navegación.
- **Estado:** [ ] Pendiente

---

<!-- ID: F11-TASK16 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md -->
### [ ] [F11-TASK16] Ampliar reportes contables y balance de comprobación
- **Hallazgo de origen:** sección 16 (backlog unificado); no se documenta una brecha técnica individual adicional en las secciones 1-4.
- **Severidad:** Media. **Objetivo:** ofrecer reportes contables consolidados y verificables para control financiero.
- **Acción ejecutable:** especificar y desarrollar reportes requeridos y balance de comprobación a partir de asientos contabilizados, con filtros por periodo/cuenta/centro de costo y conciliación de totales.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AsientosContables`, `getChartOfAccounts` y reportes financieros.
- **Dependencias/riesgos:** integridad de F11-Task02, catálogo de cuentas y periodos cerrados; riesgo de reportes que no concilien con el libro contable.
- **Alcance:** reportes y balance de comprobación; no crear datos contables derivados que sustituyan los asientos fuente.
- **Criterios de aceptación:** débitos y créditos cuadran por periodo; filtros y saldos son reproducibles; totales concilian con asientos fuente; se preservan periodos cerrados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo registra esta mejora en el backlog.

---

<!-- ID: F17-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK09] Crear interfaz gráfica de administración de políticas fiscales y techos salariales
- **Severidad:** Media (Parametrización contable)
- **Componentes Afectados:** `dashboard-recursos-humanos.html`, `dashboard-contabilidad.html`.
- **Solución Propuesta:** Panel interactivo para actualizar techos del IHSS y tramos del ISR sin editar la base de datos.
- **Hallazgo de origen:** backlog G.3; tabla D/F17-04 y sección C describen parámetros fiscales que requieren actualización por ejercicio.
- **Severidad:** Media. **Objetivo:** permitir que roles autorizados administren políticas fiscales con vigencia y trazabilidad.
- **Acción ejecutable:** crear panel en RR. HH./Contabilidad para consultar, versionar y actualizar techos IHSS, tramos ISR y parámetros relacionados; validar rangos, fechas efectivas y usuario aprobador.
- **Archivos/módulos:** `dashboard-recursos-humanos.html`, `dashboard-contabilidad.html`, `backend/accounting-service/Code.gs`, `configureFiscalPolicy`, `getFiscalPolicies`, `PoliticasFiscales`.
- **Dependencias/riesgos:** fuentes oficiales, permisos financieros, versionado y períodos cerrados; riesgo de cambios fiscales no autorizados o aplicados retroactivamente.
- **Alcance:** interfaz de configuración de políticas; no sustituye la validación normativa ni altera planillas ya cerradas.
- **Criterios de aceptación:** roles autorizados pueden crear nueva versión con vigencia; valores se validan; cada cálculo conserva versión usada; cambios auditados y no retroactivos.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe endpoints de política, pero no una interfaz gráfica de administración.

---

<!-- ID: F17-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK10] Exportar nóminas para acreditación bancaria en formato ACH
- **Severidad:** Media (Tesorería institucional)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`.
- **Solución Propuesta:** Generar archivo de dispersión bancaria para pagos masivos de nómina en bancos locales.
- **Hallazgo de origen:** backlog G.3; no aparece una brecha específica en E, por lo que se conserva como requerimiento de backlog sin inventar hallazgo adicional.
- **Severidad:** Media. **Objetivo:** generar archivos de dispersión bancaria correctos y autorizados para pagos masivos.
- **Acción ejecutable:** implementar exportador ACH configurable por banco local, con cuenta destino validada, identificación del empleado, monto neto, referencia de planilla y controles de totales antes de permitir descarga.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `PlanillasNomenclatura`, `BoletasPago` y módulo de tesorería/exportación.
- **Dependencias/riesgos:** especificaciones bancarias, datos de cuenta protegidos, autorización de planilla y conciliación; riesgo de transferencias erróneas o duplicadas.
- **Alcance:** archivo de dispersión; no ejecutar transferencias ni almacenar credenciales bancarias.
- **Criterios de aceptación:** formato cumple especificación bancaria seleccionada; suma de registros concilia con netos aprobados; cuentas inválidas se bloquean; archivo se genera solo desde planilla autorizada y queda auditado.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no hay evidencia de exportador ACH en el informe.

---

<!-- ID: F18-TASK09 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK09] Evaluar y calificar el desempeño de proveedores
- **Severidad:** Media (Gestión de la calidad del servicio de proveedores)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `ProveedoresActivos`.
- **Solución Propuesta:** Registrar calificaciones por puntualidad, calidad del producto y soporte, generando un score histórico por proveedor.
- **Hallazgo de origen:** sección G, mejora de control de calidad de proveedores.
- **Severidad:** Media. **Objetivo:** disponer de historial verificable de desempeño por proveedor.
- **Acción ejecutable:** registrar evaluaciones de puntualidad, calidad y soporte y calcular un score histórico consultable.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ProveedoresActivos`.
- **Dependencias/riesgos:** datos de órdenes, recepciones e incidencias; riesgo de puntuaciones sin evidencia o criterios consistentes.
- **Alcance:** evaluación histórica; no automatiza suspensión ni contratación del proveedor.
- **Criterios de aceptación:** cada evaluación identifica proveedor, periodo, criterios y evidencia; el score puede reconstruirse desde evaluaciones almacenadas.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita implementación.

---

<!-- ID: F18-TASK10 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK10] Crear visor consolidado del expediente digital de adquisición
- **Severidad:** Media (Auditoría interna y archivo documental)
- **Componentes Afectados:** `js/accounting.js`, `dashboard-contabilidad.html`.
- **Solución Propuesta:** Vista donde, ingresando el número de solicitud o de orden, se desplieguen todos los documentos vinculados (solicitud, cotizaciones, orden, recepción, factura, asiento y pago).
- **Hallazgo de origen:** sección G, necesidad de trazabilidad documental integral.
- **Severidad:** Media. **Objetivo:** consultar el ciclo documental de una adquisición desde una referencia única.
- **Acción ejecutable:** permitir búsqueda por solicitud u orden y desplegar documentos vinculados: solicitud, cotizaciones, orden, recepción, factura, asiento y pago.
- **Archivos/módulos:** `js/accounting.js`, `dashboard-contabilidad.html` y servicios de contabilidad.
- **Dependencias/riesgos:** relaciones e identificadores consistentes entre documentos y permisos por rol; riesgo de mostrar expedientes de otra unidad.
- **Alcance:** consulta consolidada y navegación documental; no modifica documentos fuente.
- **Criterios de aceptación:** una solicitud/orden válida muestra sus documentos asociados; documentos ausentes se identifican sin inventarlos; acceso respeta permisos.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita prueba del visor.

---

<!-- ID: F18-TASK11 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK11] Generar alertas de retrasos en entregas de compras
- **Severidad:** Media (Seguimiento operativo)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `OrdenesCompra`.
- **Solución Propuesta:** Alertar a compras cuando la fecha actual supere `fechaEntregaEstimada` de una orden pendiente.
- **Hallazgo de origen:** sección G, seguimiento de fechas estimadas de entrega.
- **Severidad:** Media. **Objetivo:** advertir oportunamente órdenes pendientes cuya fecha estimada ya venció.
- **Acción ejecutable:** comparar fecha actual con `fechaEntregaEstimada` de órdenes no completadas y notificar al área de compras, evitando alertas repetidas sin cambio de estado.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `OrdenesCompra`.
- **Dependencias/riesgos:** fechas válidas, estados de recepción y mecanismo institucional de notificación; riesgo de falsos positivos por órdenes cerradas o fechas incompletas.
- **Alcance:** alertas de retraso; no modifica automáticamente órdenes ni penaliza proveedores.
- **Criterios de aceptación:** solo órdenes pendientes vencidas generan alerta; órdenes recibidas/canceladas quedan excluidas; alerta conserva orden, fecha y estado que la originó.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita ejecución de alertas.

---

<!-- ID: F18-TASK12 | Fuentes: AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md -->
### [ ] [F18-TASK12] Implementar suite automatizada de pruebas y regresión de compras
- **Severidad:** Media-alta (Aseguramiento de Calidad)
- **Componentes Afectados:** `tests/regression/academic-grading-suite.js`, `backend/developer-service/Code.gs`.
- **Solución Propuesta:** Implementar `runPhase18PurchasingAndSuppliersRegressionSuite` para validar el flujo completo desde la solicitud hasta el pago y asiento contable.

- **Hallazgo de origen:** sección G, necesidad de asegurar el flujo integral de compras.
- **Severidad:** Media-alta. **Objetivo:** verificar regresivamente el ciclo desde solicitud hasta pago y asiento contable.
- **Acción ejecutable:** implementar `runPhase18PurchasingAndSuppliersRegressionSuite` con escenarios de solicitud, cotización, autorización, orden, recepción parcial/total, factura, conciliación, pago y asiento.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, `backend/developer-service/Code.gs` y servicios de contabilidad cubiertos.
- **Dependencias/riesgos:** contratos y datos de prueba aislados; riesgo de falsos positivos si las pruebas solo verifican presencia de funciones.
- **Alcance:** pruebas automatizadas del flujo de compras; no sustituye pruebas manuales de aceptación ni pruebas de producción.
- **Criterios de aceptación:** suite ejecutable y repetible; cubre éxito, rechazo, diferencias, recepción parcial, pagos parciales y permisos; reporta fallos con evidencia y no altera datos reales.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica la suite como pendiente.

---

<!-- ID: F19-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK09] Registrar pólizas y controlar vencimiento de garantías de activos
- **Hallazgo de origen:** secciones C.2.13, D, E/F19-13 y H P2.
- **Severidad:** Media. **Objetivo:** conservar cobertura y fechas de garantía/póliza asociadas a cada activo.
- **Acción ejecutable:** agregar proveedor, número de póliza/garantía, cobertura, inicio/fin, documentos y estado; generar alertas previas al vencimiento y permitir consulta por activo/proveedor.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ActivosPatrimoniales`, almacenamiento documental y dashboard de activos.
- **Dependencias/riesgos:** proveedor, documentos, fechas y permisos; riesgo de perder cobertura o divulgar documentos contractuales.
- **Alcance:** registro y seguimiento; no emitir ni renovar pólizas automáticamente.
- **Criterios de aceptación:** póliza vinculada a activo/proveedor; fechas validadas; documento protegido; alertas por vencer/vencida; historial de renovaciones preservado.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica ausencia de fechas de garantía y pólizas.

---

<!-- ID: F19-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK10] Controlar lotes y fechas de expiración de insumos
- **Hallazgo de origen:** secciones C.2.8, D, E/F19-08 y H P2.
- **Severidad:** Media. **Objetivo:** evitar uso de insumos vencidos y mantener trazabilidad por lote.
- **Acción ejecutable:** permitir lote y caducidad opcionales por artículo/entrada; controlar existencias por lote y ubicación; alertar próximos vencimientos y bloquear salidas de lotes vencidos según política.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `InventariosKardex`, `CatalogoArticulos`, vistas de almacén.
- **Dependencias/riesgos:** F19-Task05, movimientos de entrada/salida, devoluciones y política de caducidad; riesgo de mezclar stock vencido y vigente.
- **Alcance:** insumos que requieren control de lote (laboratorio/enfermería); no exigir lote para artículos a los que no aplica.
- **Criterios de aceptación:** lotes únicos por artículo/proveedor; caducidad validada; saldo separado por lote/ubicación; alertas y bloqueos configurables; historial de consumo trazable.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausente el registro de lotes/vencimientos.

---

<!-- ID: F19-TASK11 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK11] Integrar alertas multicanal de inventario y mantenimiento
- **Hallazgo de origen:** secciones C.2.18, E/F19-18 y H P2.
- **Severidad:** Media. **Objetivo:** notificar oportunamente quiebres de stock y vencimientos/órdenes de mantenimiento a responsables.
- **Acción ejecutable:** integrar alertas de stock bajo y mantenimiento con `sendMultiChannelNotification`, usando destinatarios por bodega/rol, preferencias, deduplicación y registro de entrega.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `sendMultiChannelNotification`, `AlmacenesUbicaciones`, `MantenimientoOrdenes` y dashboard.
- **Dependencias/riesgos:** catálogo de ubicaciones, roles, preferencias y canales configurados; riesgo de spam o divulgación de información interna.
- **Alcance:** alertas por eventos; no crear un segundo motor de notificaciones.
- **Criterios de aceptación:** destinatarios correctos por ubicación; alertas únicas por evento; correo/WhatsApp solo si el canal está habilitado; fallos registrados; preferencias y permisos respetados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica que las alertas solo se muestran en pantalla.

---

<!-- ID: F20-TASK11 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK11] Integrar colecciones bibliográficas valiosas con inventario patrimonial
- **Hallazgo de origen:** secciones B, D/F20-41..F20-45 y G P2.
- **Severidad:** Media. **Objetivo:** controlar colecciones de valor patrimonial sin duplicar registros físicos.
- **Acción ejecutable:** permitir que ejemplares/colecciones designados se vinculen a `ActivosPatrimoniales` mediante referencia estable; reflejar custodio, ubicación, condición y baja sin crear una segunda ficha patrimonial.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `BibliotecaEjemplares`, `BibliotecaCatalogoObras`, `ActivosPatrimoniales`, `js/accounting.js`.
- **Dependencias/riesgos:** inventario patrimonial, QR, custodios y bajas; riesgo de doble contabilización o divergencia de ubicación/estado.
- **Alcance:** vínculo de ejemplares/colecciones seleccionadas; no capitalizar automáticamente cada libro de consumo.
- **Criterios de aceptación:** referencia patrimonial única; cambios de custodia/estado coherentes; bajas conservan historia; no se crean activos duplicados; permisos contables respetados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausente la integración patrimonial.

---

<!-- ID: F20-TASK13 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK13] Implementar solicitudes de adquisición bibliográfica y sugerencias de compra
- **Hallazgo de origen:** secciones D/F20-46..F20-50 y G P2.
- **Severidad:** Media. **Objetivo:** canalizar necesidades bibliográficas de docentes/estudiantes hacia compras institucionales.
- **Acción ejecutable:** permitir sugerencias con título, autor, ISBN, motivo y asignatura; someterlas a revisión/aprobación; convertir solicitudes aprobadas en requisición del módulo de compras sin duplicar catálogo ni orden.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `MaterialesSolicitudes` o entidad específica de adquisiciones bibliográficas, módulo de compras y portal de usuarios.
- **Dependencias/riesgos:** F20-Task03, catálogo de proveedores/compras, presupuesto y permisos; riesgo de duplicados o solicitudes no autorizadas.
- **Alcance:** solicitud y aprobación de adquisición; no emitir órdenes de compra automáticamente sin revisión.
- **Criterios de aceptación:** solicitud identifica solicitante y obra; duplicados se detectan; aprobación queda auditada; solo aprobadas se convierten a requisición; estado de compra es consultable.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe no acredita flujo de sugerencias/adquisiciones.

---

<!-- ID: TASK-165 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-165] Visor avanzado de comprobantes y documentos financieros
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6990-7021; clave TASK-166; asignación única: Contabilidad -->

---

<!-- ID: TASK-356 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-356] Ampliar los reportes contables, balance de comprobación y estado de resultados
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13082-13111; clave TASK-359; asignación única: Contabilidad -->

---

<!-- ID: TASK-359 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-359] Fortalecimiento de idempotencia, concurrencia y consistencia de operaciones financieras
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13112-13138; clave TASK-360; asignación única: Contabilidad -->

---

<!-- ID: TASK-360 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-360] Correcciones fiscales, notas de corrección y trazabilidad documental
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13139-13166; clave TASK-361; asignación única: Contabilidad -->

---

<!-- ID: TASK-361 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-361] Exportación avanzada de estados de cuenta, recibos y reportes financieros
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13167-13193; clave TASK-362; asignación única: Contabilidad -->

---

<!-- ID: TASK-362 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-362] Incorporación de comisiones bancarias y liquidación neta de pasarelas en contabilidad
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13194-13221; clave TASK-363; asignación única: Contabilidad -->

---

<!-- ID: TASK-363 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-363] Ampliación de la conciliación bancaria asistida y gestión de excepciones
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13448-13477; clave TASK-370; asignación única: Contabilidad -->

---

<!-- ID: TASK-370 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-370] Implementar seguimiento de entregas y alertas de retrasos
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13478-13506; clave TASK-371; asignación única: Contabilidad -->

---

<!-- ID: TASK-371 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-371] Implementar control de consumo y disponibilidad de contratos marco
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13507-13535; clave TASK-372; asignación única: Contabilidad -->

---

<!-- ID: TASK-372 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-372] Implementar sugerencias de compra basadas en existencias y niveles mínimos
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13536-13565; clave TASK-373; asignación única: Contabilidad -->

---

<!-- ID: TASK-373 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-373] Implementar evaluación histórica del desempeño de proveedores
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13566-13594; clave TASK-374; asignación única: Contabilidad -->

---

<!-- ID: TASK-374 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-374] Incorporar un procedimiento formal para compras urgentes y excepcionales
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13595-13626; clave TASK-375; asignación única: Contabilidad -->

---

<!-- ID: TASK-375 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-375] Desarrollar reportes consolidados de compras, compromisos y cuentas por pagar
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13631-13669; clave TASK-376; asignación única: Contabilidad -->

---

<!-- ID: TASK-376 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-376] Identificación institucional de activos y materiales mediante códigos QR y códigos de barras
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13670-13707; clave TASK-377; asignación única: Contabilidad -->

---

<!-- ID: TASK-377 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-377] Control de lotes, números de serie y fechas de vencimiento
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13708-13739; clave TASK-378; asignación única: Contabilidad -->

---

<!-- ID: TASK-378 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-378] Gestión de garantías, pólizas y cobertura de activos patrimoniales
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13740-13773; clave TASK-379; asignación única: Contabilidad -->

---

<!-- ID: TASK-379 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-379] Sistema centralizado de alertas y notificaciones multicanal
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13774-13807; clave TASK-380; asignación única: Contabilidad -->

---

<!-- ID: TASK-380 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-380] Gestión documental, expedientes y actas de inventario y patrimonio
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13812-13834; clave TASK-381; asignación única: Contabilidad -->

---

<!-- ID: TASK-381 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-381] Integración de colecciones bibliográficas con el inventario patrimonial
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13858-13880; clave TASK-383; asignación única: Contabilidad -->

---

<!-- ID: TASK-383 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-383] Solicitudes de adquisición bibliográfica y sugerencias de compra escolar
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13934-13956; clave TASK-386; asignación única: Contabilidad -->

---

<!-- ID: TASK-386 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-386] Gestión de proveedores externos y servicios de transporte contratados
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13957-13980; clave TASK-387; asignación única: Contabilidad -->

---

<!-- ID: TASK-387 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-387] Control de combustible, kilometraje y costos operativos de la flota
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13981-14007; clave TASK-388; asignación única: Contabilidad -->

---

<!-- ID: TASK-388 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-388] Reportes operativos, administrativos y financieros de transporte
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14730-14777; clave TASK-409; asignación única: Contabilidad -->

---

<!-- ID: TASK-432 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-432] [P2] Migración Histórica de Nómina, Empleados y Obligaciones Laborales
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16535-16561; clave TASK-462; asignación única: Contabilidad -->

---

<!-- ID: TASK-462 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-462] Implementar portal de proveedores para operaciones externas
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16562-16586; clave TASK-463; asignación única: Contabilidad -->

---

<!-- ID: TASK-463 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-463] Incorporar procesos competitivos y licitaciones para adquisiciones de mayor cuantía
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16587-16610; clave TASK-464; asignación única: Contabilidad -->

---

<!-- ID: TASK-464 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-464] Incorporar captura asistida de datos de facturas mediante OCR
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16615-16645; clave TASK-465; asignación única: Contabilidad -->

---

<!-- ID: TASK-465 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-465] Panel de control gerencial de inventarios, activos y mantenimiento
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16646-16677; clave TASK-466; asignación única: Contabilidad -->

---

<!-- ID: TASK-466 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-466] Gestión presupuestaria y análisis de costos de suministros y mantenimiento por departamento
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16678-16708; clave TASK-467; asignación única: Contabilidad -->

---

<!-- ID: TASK-467 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-467] Optimización del ciclo de requisiciones internas y distribución de materiales
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16709-16740; clave TASK-468; asignación única: Contabilidad -->

---

<!-- ID: TASK-468 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-468] Optimización del inventario físico y conciliaciones periódicas por ubicación
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16741-16773; clave TASK-469; asignación única: Contabilidad -->

---

<!-- ID: TASK-469 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-469] Gestión integral de bajas patrimoniales, disposición y recuperación de valor
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

<!-- ID: AUD-NG-014 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-014] Validar estado, prefijo y rango completo del CAI antes de emitir facturas
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-014
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** createFiscalInvoice, AutorizacionesCAI, FacturasFiscales, LockService
- **Descripción del Alcance:** Rechazar CAI inactivos, vencidos o agotados incluso cuando se envíen explícitamente. Validar que el número propuesto respete prefijo, rango inicial/final y correlativo siguiente; no aceptar correlativos arbitrarios del cliente.
- **Criterios de Aceptación:** CAI inactivo o vencido siempre se rechaza; números fuera de prefijo/rango se rechazan; dos emisiones concurrentes reciben correlativos únicos y consecutivos; recibos internos no consumen correlativos fiscales.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-016 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-016] Corregir reversión parcial y validación de elegibilidad de reembolsos
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-016
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** reversePayment, processPaymentRefund, PagosAbonos, CargosEstudiante, MovimientosCajaBancos, AsientosContables
- **Descripción del Alcance:** Modelar reversión parcial sin marcar el pago completo como revertido cuando conserva saldo aplicado. Calcular el saldo del cargo con importes netos reales y rechazar reembolsos de pagos anulados, revertidos o no confirmados.
- **Criterios de Aceptación:** Reversiones parciales sucesivas suman sin exceder el pago; el remanente permanece aplicado; el cargo refleja el saldo exacto; pagos no elegibles no admiten reembolso; los contra-asientos cuadran por importe.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-017 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-017] Corregir la variable de motivo y garantizar la continuidad del offboarding
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-017
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** processEmployeeOffboarding, Usuarios, ExpedientesLaborales, HistorialAdscripciones, AsignacionesAmbitosRoles, DocentesAreasAcademicas, CoordinacionesArea
- **Descripción del Alcance:** Sustituir las referencias no definidas motivoBaja por el dato validado motivoSalida. Añadir estado por etapa y reanudación idempotente para que un fallo posterior a desactivar la cuenta no deje una desvinculación incompleta sin trazabilidad.
- **Criterios de Aceptación:** La función no produce ReferenceError; cada etapa registra resultado; fallos parciales pueden reanudarse; la cuenta permanece desactivada; todas las adscripciones y responsabilidades se cierran; la operación repetida no duplica ni revierte pasos.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-021 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-021] Completar el cálculo anualizado del ISR con saldo pendiente y parámetros por ejercicio
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-021
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** calculatePayrollPeriod, PoliticasFiscales, PlanillasNomenclatura, retenciones ISR históricas
- **Descripción del Alcance:** Proyectar ingresos conforme a meses efectivos restantes, restar retenciones acumuladas y distribuir el saldo anual pendiente. Leer tramos, deducciones y vigencias desde parámetros fiscales versionados, sin constantes anuales hardcodeadas.
- **Criterios de Aceptación:** Casos de ingreso a mitad de año, aumento salarial y retenciones previas coinciden con cálculo independiente basado en tabla oficial del ejercicio; planillas históricas conservan los parámetros aplicados.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-022 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-022] Parametrizar aportaciones patronales y demostrar su contabilización
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-022
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** calculatePayrollPeriod, PoliticasFiscales, PlanillasNomenclatura, AsientosContables
- **Descripción del Alcance:** Obtener porcentajes, techos, bases y vigencias patronales desde políticas versionadas. Integrar el gasto y pasivo patronal al asiento contable automático sin afectar el salario neto del trabajador.
- **Criterios de Aceptación:** Cada período usa parámetros vigentes; se preservan versiones históricas; el asiento patronal cuadra por partida doble y no se duplica ante reintentos.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-023 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-023] Sustituir pruebas simuladas de compras e inventario por pruebas de comportamiento
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-023
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs, tests/regression/
- **Dependencias Expuestas:** runPhase18PurchasingAndSuppliersRegressionSuite, runPhase19InventoryAndAssetsRegressionSuite, persistencia, Kardex, compras y activos
- **Descripción del Alcance:** Hacer que las pruebas ejerciten funciones de producción mediante dependencias aisladas, datos controlados y verificaciones de persistencia, permisos, concurrencia y rollback. Mantener separadas las pruebas de lógica pura y las de integración.
- **Criterios de Aceptación:** Cada criterio de aceptación de F18/F19 tiene una prueba que invoca el flujo real; las pruebas detectan errores de persistencia y no solo resultados calculados en variables locales.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-028 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-028] Completar el cálculo, cierre, boletas y contabilización de beneficios extraordinarios
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-028
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** calculateExtraordinaryPayroll, updatePayrollPeriodStatus, generatePayrollReceiptPDF, ContratosLaborales, ExpedientesLaborales, PlanillasNomenclatura, AnticiposPrestamosEmpleado, BoletasPago, AsientosContables, recordAccountingJournalEntry
- **Descripción del Alcance:** Ajustar el motor de décimo tercer y décimo cuarto mes para calcular el beneficio considerando la vigencia de cada contrato y los cambios salariales dentro del período de acumulación, conforme a la regla salarial aplicable. Corregir el cálculo de aportaciones patronales del cierre genérico para que los valores cero explícitos de beneficios extraordinarios no activen tasas de respaldo. Implementar la emisión y persistencia de una boleta PDF individual vinculada inequívocamente a planillaId y empleadoId. Generar asientos contables específicos y diferenciados para el pasivo y gasto de cada beneficio, conservando el ciclo de aprobación/cierre y evitando contabilizaciones duplicadas.
- **Criterios de Aceptación:** Los períodos con más de un contrato o cambio salarial se calculan por tramos y con base salarial verificable; los beneficios extraordinarios con aportaciones patronales en cero conservan esos ceros al aprobarse/cerrarse; cada empleado obtiene un PDF real almacenado y vinculado a la planilla y al beneficio correctos; cada planilla extraordinaria genera un asiento equilibrado con cuentas diferenciadas; la misma planilla no puede generar boletas o asientos duplicados; las pruebas cubren períodos completos, ingresos/salidas parciales, cambios contractuales, anticipos, aprobación y cierre.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-033 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-033] Validar importes contables y vincular las aprobaciones de compra con la identidad verificada
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-033 (F11-Task02)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** recordAccountingJournalEntry, verifyAccountingIntegrity, approvePurchaseOrder, createPurchaseOrder, validateRolePermission, AsientosContables, OrdenesCompra
- **Descripción del Alcance:** Rechazar importes no numéricos, NaN e infinitos antes de calcular el equilibrio. Unificar los campos débito/crédito entre registro y verificación. Obtener al aprobador exclusivamente de _verifiedUserId y derivar al solicitante de la sesión verificada; impedir que userId, actorId, authenticatedUserId o solicitanteUserId del payload suplanten a los actores reales.
- **Criterios de Aceptación:** Un asiento con texto no numérico o valores no finitos es rechazado y nunca queda Asentado; el verificador detecta desequilibrios con los campos persistidos; el aprobador coincide con _verifiedUserId; no se puede crear o aprobar una orden atribuyéndola a otra persona; se prueban importes válidos, inválidos, desequilibrios y suplantación.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-041 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-041] Completar los datos oficiales de la orden y validar partidas, impuestos y total antes de generar el PDF
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-041 (TASK-015 / F18-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; esquema de datos de ProveedoresActivos y OrdenesCompra
- **Dependencias Expuestas:** createPurchaseOrder, generatePurchaseOrderPDF, ProveedoresActivos, OrdenesCompra, detalleItems, solicitudId, cotizacionId, reglas fiscales ISV
- **Descripción del Alcance:** Completar los datos faltantes del proveedor y de entrega (incluyendo dirección y contacto), identificar correctamente departamento y solicitante, incorporar referencias a solicitud y cotización aprobadas, condiciones de pago, transporte, descuentos, exención y desglose fiscal, y total en letras. Validar estructura y valores de cada partida; no continuar con partidas vacías cuando el JSON sea inválido. Calcular o contrastar subtotal, impuestos y total con reglas fiscales aplicables y rechazar discrepancias en lugar de usar silenciosamente el monto almacenado.
- **Criterios de Aceptación:** El PDF contiene todos los campos documentales definidos en TASK-015; el departamento no se sustituye por centro de costo; el ISV solo se aplica cuando corresponde y admite exención; la suma de partidas, descuentos, transporte e impuestos coincide con el total persistido; JSON inválido, cantidades/precios inválidos o diferencias bloquean la emisión y producen un error identificable.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-042 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-042] Conservar un historial inmutable de versiones documentales de cada orden de compra
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-042 (TASK-015 / F18-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; almacenamiento documental en Google Drive; estructura de historial de órdenes
- **Dependencias Expuestas:** generatePurchaseOrderPDF, modifyPurchaseOrderAmount, OrdenesCompra.VersionDocumental, OrdenesCompra.ArchivoPdfUrl, historial documental, LockService
- **Descripción del Alcance:** Implementar un registro histórico por versión que conserve número, fecha, actor verificado, motivo, identificador/URL del archivo y estado de la versión. Cada nueva emisión o revisión debe crear un archivo distinto sin sobrescribir ni perder la referencia anterior. Serializar la asignación de versiones para evitar colisiones concurrentes y definir un esquema de numeración inequívoco.
- **Criterios de Aceptación:** Cada versión apunta a un archivo real e independiente; las versiones anteriores siguen accesibles y no se alteran; se puede consultar la secuencia completa de versiones y sus metadatos; solicitudes concurrentes no generan números duplicados ni sobrescriben archivos; el motivo de versión queda persistido.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-043 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-043] Implementar una máquina de estados con transiciones permitidas y bitácora completa
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-043 (TASK-015 / F18-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; estructura de OrdenesCompra y bitácora de estados
- **Dependencias Expuestas:** approvePurchaseOrder, recordPurchaseReceipt, OrdenesCompra.EstadoOrden, RecepcionesCompra, LockService, reglas de transición
- **Descripción del Alcance:** Definir una matriz explícita de transiciones origen-destino y precondiciones por transición. Rechazar saltos de estado, retrocesos y cambios desde estados terminales salvo flujo formal de reapertura. Centralizar los cambios de estado de aprobación y recepción en una operación que registre estado anterior/nuevo, fecha, motivo y referencia de evidencia.
- **Criterios de Aceptación:** Solo se ejecutan transiciones expresamente permitidas; no se puede pasar de Borrador directamente a recepción o cierre; envío requiere aprobación; aceptación/rechazo del proveedor y recepción requieren sus evidencias; estados terminales bloquean cambios no autorizados; cada transición conserva actor, fecha, motivo y estado previo sin sobrescribir historial.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-044 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-044] Atribuir aprobaciones y transiciones a la identidad autenticada del usuario
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-044 (TASK-015 / F18-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** validateRolePermission, doPost, _verifiedUserId, _verifiedRole, approvePurchaseOrder, OrdenesCompra.AprobadoPor, bitácora de estados
- **Descripción del Alcance:** Derivar el actor exclusivamente de _verifiedUserId y el rol de _verifiedRole establecidos por validateRolePermission. No aceptar authenticatedUserId, userId, actorId ni authRole del cliente como identidad o autoridad. Usar la identidad verificada para la regla de no autoaprobación y guardar el identificador real del aprobador en el registro y la bitácora.
- **Criterios de Aceptación:** Manipular IDs o roles del payload no altera la identidad ni permisos; la aprobación queda atribuida al usuario autenticado; la autoaprobación se bloquea comparando identidades verificadas; la bitácora conserva actor y rol verificados para cada transición.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-045 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-045] Exigir revisión, re-aprobación y nueva versión al modificar órdenes ya aprobadas o enviadas
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-045 (TASK-015 / F18-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; almacenamiento documental e historial de órdenes
- **Dependencias Expuestas:** modifyPurchaseOrderAmount, approvePurchaseOrder, generatePurchaseOrderPDF, OrdenesCompra.DetalleItemsJSON, MontoTotal, EstadoOrden, VersionDocumental, ArchivoPdfUrl
- **Descripción del Alcance:** Impedir cambios directos de partidas o importes en órdenes aprobadas, emitidas, enviadas, aceptadas o parcialmente recibidas. Implementar una revisión formal que conserve la versión anterior, registre motivo y actor verificado, vuelva a someter los cambios a aprobación y, cuando corresponda, requiera aceptación del proveedor antes de continuar la recepción.
- **Criterios de Aceptación:** Una orden en curso no cambia silenciosamente de importe o partidas; la revisión crea una versión nueva y conserva la anterior; los cambios requieren re-aprobación según los umbrales; una orden enviada o aceptada no continúa con condiciones modificadas sin evidencia de comunicación/aceptación; el presupuesto se ajusta una sola vez y de forma trazable.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-046 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-046] Exigir conciliación de tres vías satisfactoria antes de habilitar cualquier pago a proveedores
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-046 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** doPost, validateRolePermission, recordAccountsPayableExpense, verifyThreeWayMatch, recordSupplierPayment, CuentasPorPagarGastos.EstadoAprobacion y Observaciones.
- **Descripción del Alcance:** Hacer obligatoria la conciliación entre orden aprobada, recepción física conforme y factura para toda obligación vinculada a compras. Eliminar la posibilidad de dejar una obligación pagable por ausencia de orden/partidas o por un bypass no autorizado. Persistir el resultado de conciliación y exigir evidencia verificable de resultado satisfactorio antes de aceptar recordSupplierPayment. Los casos legítimamente exentos deberán tener una política explícita, permiso verificado y motivo persistido, sin aceptar flags de autorización arbitrarios del cliente.
- **Criterios de Aceptación:** Una factura vinculada a compra no puede quedar Aprobada ni recibir pagos si no existe resultado satisfactorio de Three-Way Match; omitir orden o partidas no evita el control; una discrepancia bloquea pagos; un bypass no autorizado es rechazado; el resultado y actor autorizado quedan persistidos y son consultables.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-047 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-047] Crear un registro estructurado e inmutable del detalle de cada pago parcial a proveedores
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-047 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; almacenamiento contable; dashboard-contabilidad.html; js/accounting.js
- **Dependencias Expuestas:** CuentasPorPagarGastos, recordSupplierPayment, recordCashBankMovement, MovimientosCajaBancos, cuentaBancariaId, comprobanteUrl y AsientosContables.
- **Descripción del Alcance:** Definir una entidad persistente de pagos de proveedores con identificador único, obligación, proveedor, factura, importe, fecha, método, cuenta bancaria, referencia, URL de comprobante, actor autenticado, estado, movimiento de caja asociado y asiento contable relacionado. Cada abono debe conservarse como registro individual sin depender de texto libre en Observaciones. Persistir los campos cuentaBancariaId y comprobanteUrl y relacionarlos con el movimiento y la obligación.
- **Criterios de Aceptación:** Dos abonos de una misma factura generan dos registros independientes; cada registro conserva todos los metadatos; el historial permite reconstruir fecha, importe, cuenta, referencia y comprobante; recargar consultas conserva los datos; ningún abono previo se sobrescribe al registrar otro.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-048 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-048] Rechazar cualquier pago o nota de crédito que exceda el saldo exacto de la obligación
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-048 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** recordSupplierPayment, applySupplierCreditNote, TotalMonto, SaldoPendiente y TotalAbonado.
- **Descripción del Alcance:** Sustituir la tolerancia que permite exceder el saldo por una validación monetaria estricta basada en importes normalizados a dos decimales. El pago y la nota de crédito nunca podrán exceder el saldo disponible. Definir explícitamente el tratamiento de redondeos sin permitir que el agregado de abonos supere el total liquidable. Mantener invariantes verificables entre total, saldo, pagos y créditos.
- **Criterios de Aceptación:** Un saldo de L 100.00 rechaza L 100.01 y cualquier importe superior; L 100.00 exactos liquidan el saldo; después de cualquier operación SaldoPendiente nunca es negativo y TotalAbonado nunca supera el total pagadero; las pruebas cubren límites de centavos y errores de redondeo.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-049 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-049] Garantizar consistencia atómica entre pagos, movimientos de caja y asientos contables
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-049 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** LockService, recordSupplierPayment, applySupplierCreditNote, recordCashBankMovement, recordAccountingJournalEntry, CuentasPorPagarGastos, MovimientosCajaBancos y AsientosContables.
- **Descripción del Alcance:** Rediseñar la secuencia de persistencia para que la obligación, el movimiento financiero y el asiento contable formen una operación consistente. No devolver éxito si falta cualquiera de los registros obligatorios. Implementar control de estado de operación, recuperación/reconciliación idempotente o compensación documentada ante fallos parciales, evitando que una excepción posterior deje saldos modificados sin contrapartida.
- **Criterios de Aceptación:** Si falla la escritura de movimiento o asiento, la operación no se reporta como exitosa ni deja saldo final divergente; cada pago aceptado tiene exactamente un movimiento y un asiento balanceado; las notas de crédito aceptadas tienen su asiento correspondiente; reintentos no duplican ninguno de los registros; se prueban fallos inducidos en cada punto de persistencia.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-050 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-050] Hacer obligatoria la idempotencia y validar la unicidad de referencias bancarias de pagos
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-050 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** doPost, checkAndRegisterIdempotencyKey, saveIdempotentResult, recordSupplierPayment, referenciaBancaria y entidad de pagos de proveedores.
- **Descripción del Alcance:** Exigir clave de idempotencia para registrar pagos o generar una clave de operación segura en servidor; persistir la relación entre clave, firma del payload y resultado. Validar unicidad de la referencia bancaria según banco/cuenta/proveedor y período definido, con normalización y control de concurrencia. Evitar depender exclusivamente del caché temporal.
- **Criterios de Aceptación:** Un reintento idéntico devuelve el resultado original sin crear otro pago; reutilizar la misma clave con payload distinto se rechaza; una referencia bancaria ya aplicada no puede crear un segundo egreso; la unicidad persiste tras expirar caché y recargar el servicio.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-051 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-051] Implementar registro central de notas de crédito y deduplicación global por proveedor
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-051 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; almacenamiento contable; dashboard-contabilidad.html; js/accounting.js
- **Dependencias Expuestas:** applySupplierCreditNote, CuentasPorPagarGastos, Observaciones, numeroNotaCredito, proveedorId, factura y AsientosContables.
- **Descripción del Alcance:** Crear un registro independiente de notas de crédito comerciales con número, proveedor emisor, factura relacionada, importe, fecha, motivo, documento soporte, obligación, actor, estado de aplicación y asiento contable. Aplicar una restricción de unicidad por emisor/proveedor y número de documento, con control concurrente. Registrar el importe aplicado y su relación con el saldo sin utilizar Observaciones como fuente de verdad.
- **Criterios de Aceptación:** Una nota no puede aplicarse dos veces a la misma obligación ni a obligaciones distintas; una nota de otro proveedor con igual numeración se evalúa conforme a la clave compuesta; cada aplicación conserva evidencia y asiento; el saldo no se reduce si la nota no queda registrada íntegramente.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-052 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-052] Persistir estados de vencimiento y validar fechas de las obligaciones
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-052 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** backend/accounting-service/Code.gs; almacenamiento contable; dashboard-contabilidad.html; js/accounting.js
- **Dependencias Expuestas:** getSupplierAccountsPayableSummary, FechaVencimiento, EstadoPago, EstadoAprobacion y CuentasPorPagarGastos.
- **Descripción del Alcance:** Validar formato y obligatoriedad de fecha de vencimiento según política; distinguir fecha ausente/inválida de una obligación corriente; persistir o derivar de forma consistente el estado Vencida sin confundirlo con EstadoPago; exponer listas y conteos por rangos de 7, 15 y 30 días, con reglas de inclusión documentadas.
- **Criterios de Aceptación:** Una fecha inválida no se clasifica como Corriente; una obligación con saldo positivo y fecha pasada se identifica como Vencida en consultas y reportes; una obligación pagada no aparece como vencida; las listas y conteos por período coinciden; los estados se reconstruyen correctamente tras recargar.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-053 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-053] Implementar la interfaz operativa de cuentas por pagar, pagos y notas de crédito
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-053 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** dashboard-contabilidad.html; js/accounting.js; backend/accounting-service/Code.gs
- **Dependencias Expuestas:** fetchApi, recordAccountsPayableExpense, recordSupplierPayment, applySupplierCreditNote y getSupplierAccountsPayableSummary.
- **Descripción del Alcance:** Incorporar una sección de cuentas por pagar en el dashboard contable con listado y filtros por proveedor, factura, estado y vencimiento; detalle de obligación e historial de pagos; formulario para registrar abonos con cuenta, referencia y comprobante; formulario para aplicar notas de crédito; consulta de vencimientos y saldos. Respetar RBAC, validación de formularios, bloqueo de doble envío y actualización del estado tras persistencia.
- **Criterios de Aceptación:** Un usuario autorizado consulta obligaciones y vencimientos; registra abonos parciales y observa el historial; aplica notas de crédito únicas; usuarios sin permisos no ven ni ejecutan acciones; los datos sobreviven a recarga y coinciden con backend; los controles impiden doble envío.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-054 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-054] Sustituir pruebas simuladas de cuentas por pagar por pruebas funcionales sobre operaciones reales
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-054 (TASK-016 / F18-Task06)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; tests/regression/academic-grading-suite.js; tests/regression/
- **Dependencias Expuestas:** runPhase18PurchasingAndSuppliersRegressionSuite, recordAccountsPayableExpense, recordSupplierPayment, applySupplierCreditNote, getSupplierAccountsPayableSummary, SpreadsheetApp y AsientosContables.
- **Descripción del Alcance:** Reemplazar o complementar REG-F18-06 y REG-F18-08 con pruebas aisladas que invoquen las funciones reales mediante dobles controlados de persistencia o un Spreadsheet de prueba. Verificar sobrepagos en límites de centavos, duplicidad de referencias, aplicación global de notas, bloqueo por conciliación, fallos de persistencia, asientos balanceados, vencimientos y recuperación de estado. No considerar aserciones de presencia de cadenas como evidencia funcional.
- **Criterios de Aceptación:** Las pruebas ejecutan las funciones de negocio reales; verifican valores persistidos y relaciones entre hojas; incluyen fallos inducidos y reintentos; prueban permisos y casos límite; la suite demuestra que ningún pago aceptado carece de movimiento o asiento; se documentan resultados reproducibles y cobertura por requisito.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-079 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-079] Evitar que el catálogo devuelva servicios de ejemplo o éxito ante errores de lectura
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-079 (TASK-047 / F23-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/developer-service/Code.gs
- **Dependencias Expuestas:** getCentralServiceRegistry, CatalogoServicios, defaultServices y JSON.parse.
- **Descripción del Alcance:** Separar explícitamente datos de demostración de datos institucionales. Cuando el catálogo esté vacío, devolver una colección vacía o un estado de inicialización; ante errores de lectura/parseo, devolver error observable y registrar incidente sin presentar el fallback como inventario real.
- **Criterios de Aceptación:** Un catálogo vacío devuelve cero servicios reales; un error de lectura no se convierte en status success con datos de ejemplo; ningún propietario/Spreadsheet ficticio se presenta como registrado; las respuestas distinguen demo, vacío y error.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-096 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-096] Rectificar de forma aditiva el estado contradictorio de TASK-050
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-096 (TASK-050 / F24-Task01)
- **Severidad/Clasificación:** Observación
- **Archivos Involucrados:** Pendientes.md; ChangesLogs.txt; Auditoria.txt
- **Dependencias Expuestas:** Encabezado [ ] de TASK-050, campo Estado [ ] Pendiente, criterios de aceptación y registro histórico de ChangesLogs.txt.
- **Descripción del Alcance:** Determinar el estado administrativo de TASK-050 a partir de la verificación funcional y la revisión correspondiente. Documentar la rectificación mediante una anotación aditiva y trazable, sin borrar ni reescribir el registro histórico original. No declarar cumplimiento mientras existan criterios de aceptación no satisfechos.
- **Criterios de Aceptación:** El inventario permite identificar inequívocamente el estado de TASK-050; la rectificación conserva el encabezado y contenido históricos; la decisión se apoya en evidencias y revisión formal; las tareas derivadas permanecen vinculadas a AUD-NG-091 a AUD-NG-096.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-098 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-098] Eliminar datos ficticios de los resultados institucionales
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-098 (TASK-050 / F24-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; generadores académicos y financieros
- **Dependencias Expuestas:** generateInstitutionalReport, ComprobantesPago, PagosAbonos, CalificacionesEstudiantes, rows y summary.
- **Descripción del Alcance:** Retirar filas, importes, nombres, promedios y porcentajes codificados como datos de muestra de las respuestas productivas. Cuando no existan datos, devolver colección vacía y métricas con semántica explícita de ausencia; los datos demostrativos deberán permanecer aislados del entorno productivo y claramente etiquetados.
- **Criterios de Aceptación:** Una fuente vacía nunca devuelve transacciones o alumnos ficticios; cada total se calcula exclusivamente con registros reales válidos; no aparecen constantes de muestra como resultados institucionales.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-130 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-130] Respetar permisos financieros y aplicar beneficios por periodo sin mutar consultas
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-130 (REQ-EXP-009).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`; `backend/accounting-service/Code.gs`; `js/student.js`; `student-dashboard.html`.
- **Dependencias Expuestas:** `getStudentEnrollmentHistory`, `getStudentAccountStatement`, `applyApprovedScholarshipsToCharges`, `tienePermisoFinanciero`, `tab-financial`.
- **Descripción del Alcance:** `getStudentEnrollmentHistory` devuelve cargos al estudiante sin validar `tienePermisoFinanciero`, y el dashboard muestra el saldo pendiente en el badge sin comprobar el permiso. `getStudentAccountStatement` aplica becas/descuentos modificando cargos durante una consulta de lectura; la función de aplicación no restringe los cargos al periodo de vigencia de la solicitud. Separar lectura y escritura, aplicar permisos financieros en servidor y limitar beneficios a cargos elegibles del periodo correspondiente.
- **Criterios de Aceptación:** Sin permiso financiero, el estudiante conserva acceso académico, pero no recibe saldos/cargos/comprobantes por UI ni API; las consultas no modifican hojas; los beneficios se aplican solo por una acción autorizada, al periodo/conceptos elegibles, con registro de quién/cuándo; pruebas de permiso habilitado/deshabilitado y periodos anteriores.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-133 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-133] Asegurar integridad e idempotencia atómica de pagos y abonos
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-133 (REQ-EXP-010).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`.
- **Dependencias Expuestas:** `recordStudentPayment`, `checkAndRegisterIdempotencyKey`, `saveIdempotentResult`, `CargosEstudiante`, `PagosAbonos`.
- **Descripción del Alcance:** `recordStudentPayment` no verifica que cargoId pertenezca al userId pagador, permite abonos superiores al saldo y no usa bloqueo transaccional propio. La idempotencia consulta CacheService y guarda el resultado después de ejecutar, sin reservar atómicamente la clave. El fallback de referencia `SIN-REF` puede convertir pagos distintos sin referencia en falsos duplicados. Validar propiedad y saldo, y hacer la reserva idempotente atómica.
- **Criterios de Aceptación:** El cargo pertenece al estudiante pagador; no se acepta sobrepago salvo que se registre explícitamente como crédito; cada pago tiene clave única no reutilizable; reintentos/concurrencia no duplican pagos; referencias vacías no colisionan; se conserva trazabilidad de pagos parciales, reversos y ajustes; pruebas concurrentes y de pago cruzado.

- **Ampliación C1.33 / FASE2-05 (2026-11-05):** Se confirma en `recordStudentPayment` (Accounting, 3891) que el flujo no adquiere LockService. La clave es opcional (`idempotencyKey || tokenTransaccion || referencia`); si no se proporciona, se omite la búsqueda de duplicados y se persiste igualmente. La búsqueda previa en `PagosAbonos` y el `appendRow` no forman una sección crítica, por lo que dos solicitudes simultáneas pueden superar la comprobación y registrar dos abonos. El wrapper de doPost tampoco resuelve la carrera: consulta CacheService antes del handler y guarda el resultado después.
- **Pruebas adicionales:** dos pagos simultáneos con la misma clave y sin clave; reintento tras respuesta perdida; error después de appendRow; cargo ajeno; sobrepago; referencias vacías y repetidas. Debe comprobarse un solo efecto observable en `PagosAbonos` y el estado/saldo del cargo.

- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-134 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-134] Conectar el portal financiero estudiantil y generar recibos PDF correlativos
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-134 (REQ-EXP-011).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `student-dashboard.html`; `js/student.js`; `js/accounting.js`; `backend/accounting-service/Code.gs`; `js/config.js`.
- **Dependencias Expuestas:** `tab-financial`, `voucher-modal`, `uploadPaymentVoucher`, `generatePaymentReceiptPDF`, `PagosAbonos`, `ComprobantesPago`.
- **Descripción del Alcance:** El portal contiene pestaña financiera y modal de comprobante, pero `student.js` solo conecta las pestañas de actividades/progreso y no registra handlers para `tab-financial` ni `voucher-modal`; `js/accounting.js` no se carga en las páginas actuales. El backend sube comprobantes, pero comparte los archivos con ANYONE_WITH_LINK. `generatePaymentReceiptPDF` devuelve un objeto JSON, no un archivo PDF; el recibo usa un número aleatorio de seis dígitos, no correlativo.
- **Criterios de Aceptación:** El estudiante consulta cargos/vencimientos, sube comprobantes desde el portal y descarga un PDF real; los archivos de comprobantes permanecen privados y se sirven solo tras autorización; el recibo tiene correlativo secuencial único con bloqueo; la UI maneja estados de revisión/aprobación/rechazo; pruebas end-to-end.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-135 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-135] Endurecer CAI, rango y correlativo de facturación fiscal hondureña
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-135 (REQ-EXP-012).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`.
- **Dependencias Expuestas:** `configureSARAuthorizedCAI`, `createFiscalInvoice`, `AutorizacionesCAI`, `FacturasFiscales`, `PagosAbonos`.
- **Descripción del Alcance:** `configureSARAuthorizedCAI` registra rangos sin validar formato, inicio/fin, solapamientos o vencimiento. `createFiscalInvoice` acepta CAI inactivo si el cliente lo especifica, permite sobrescribir rangos/fecha/numeroFactura desde payload, no exige que el número coincida con el siguiente correlativo ni comprueba unicidad; tampoco verifica que reciboCajaId corresponda a un pago confirmado y no facturado. La tasa ISV también puede venir del cliente. La separación de hojas entre recibos internos y FacturasFiscales sí existe, pero el control fiscal debe ser autoritativo en servidor.
- **Criterios de Aceptación:** Solo se emite con CAI activo y vigente; rango autorizado proviene de la hoja y no del payload; el correlativo siguiente se genera en servidor y queda dentro del rango; no se permiten duplicados ni saltos no autorizados; el pago asociado existe, está confirmado y no tiene factura previa; tasas tributarias provienen de política configurada; pruebas de expiración, rango agotado, CAI inactivo y concurrencia.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-136 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-136] Restringir estados de cuenta, comprobantes, recibos y facturas a la familia autorizada
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-136 (REQ-EXP-011/012).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`, `backend/academic-service/Code.gs`; módulo de relaciones familiares.
- **Dependencias Expuestas:** `validateContextualAccess`, `getStudentAccountStatement`, `getPaymentVouchers`, `generatePaymentReceiptPDF`, `getFiscalInvoices`, `uploadPaymentVoucher`, `getStudentEnrollmentHistory`, `RelacionesFamiliares`.
- **Descripción del Alcance:** Padre/Tutor/Responsable tienen permisos para consultar estados de cuenta, comprobantes, recibos y facturas, pero en ACCOUNTING validateContextualAccess solo restringe al Estudiante cuando se envía userId; no verifica vínculos familiares. getFiscalInvoices devuelve todas las facturas si no hay filtros y permite buscar cualquier facturaId; generatePaymentReceiptPDF busca cualquier reciboId/pagoId; getPaymentVouchers puede devolver todos los comprobantes si el familiar no envía userId. Además, ACADEMIC permite getStudentEnrollmentHistory a Padre/Tutor/Responsable; la función acepta userId del payload y solo lo sustituye para Estudiante/Alumno, mientras validateContextualAccess no valida relación familiar.
- **Criterios de Aceptación:** Estudiante solo accede a su cuenta/recibos/facturas/matrícula; Padre/Tutor/Responsable solo a hijos o representados vinculados activamente y con los permisos financieros aplicables; los identificadores de recibo/factura/matrícula no permiten IDOR; consultas sin filtros no devuelven información global; pruebas cruzadas entre familias y estudiantes.
- **Ampliación C1.73:** getStudentEnrollmentHistory (ACADEMIC) devuelve matrículas y cargos del userId indicado; los roles Padre/Tutor/Responsable están autorizados, pero no existe comprobación de vínculo familiar en el validador académico. Se incorpora al alcance de aislamiento financiero/familiar ya existente.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-137 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-137] Unificar el nombre institucional en recibos y documentos financieros
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-137 (REQ-EXP-007).
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`; configuración central de marca y plantillas documentales.
- **Dependencias Expuestas:** `generatePaymentReceiptPDF`, datos de institución, `manifest.json` y marca New Generation.
- **Descripción del Alcance:** Los encabezados de las páginas principales usan New Generation Bilingual School and Institute, pero los datos de recibo generados por el backend declaran `New Generation Christian Academy`. Centralizar el nombre oficial y consumirlo desde todos los documentos y vistas.
- **Criterios de Aceptación:** Recibos, facturas y documentos institucionales usan exactamente la marca oficial configurada; no quedan nombres alternativos o anteriores en los documentos generados; prueba de renderizado.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-138 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-138] Corregir cierres de caja y conciliación bancaria por sesión/cuenta
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-138 (REQ-EXP-013).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`.
- **Dependencias Expuestas:** `recordCashBankMovement`, `closeCashSession`, `getCashBankSummary`, `performBankReconciliation`, `MovimientosCajaBancos`, `CierresCaja`.
- **Descripción del Alcance:** `closeCashSession` suma todos los movimientos con estado Registrado sin filtrar por sesión/fecha ni distinguir efectivo de banco y no marca movimientos como cerrados; cierres posteriores vuelven a sumar movimientos históricos. `performBankReconciliation` concilia por referencia e importe sin cuenta, fecha ni estado de conciliación y no evita reutilizar una partida. `recordCashBankMovement` no usa bloqueo ni clave única.
- **Criterios de Aceptación:** Apertura/cierre con identificador y periodo; arqueo solo de movimientos de efectivo de la sesión; movimientos cerrados no vuelven a entrar en otro cierre; conciliación por cuenta, fecha, importe y referencia con estado único; bloqueo/idempotencia; pruebas de cierres consecutivos y partidas duplicadas.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-139 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-139] Impedir bypass de autorización en cuentas por pagar y three-way match
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-139 (REQ-EXP-013).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`.
- **Dependencias Expuestas:** `recordAccountsPayableExpense`, `verifyThreeWayMatch`, `recordPurchaseReceipt`, `modifyPurchaseOrderAmount`, `generatePurchaseOrderPDF`.
- **Descripción del Alcance:** `verifyThreeWayMatch` utiliza `authRole` del payload para autorizar diferencias; `recordAccountsPayableExpense` acepta `bypassConciliacion` sin validar autorización de servidor y deja aprobada una obligación si no se envía orden/partidas. No se verifica factura duplicada por proveedor. `generatePurchaseOrderPDF` devuelve una URL fija de dominio sin crear un archivo PDF real.
- **Criterios de Aceptación:** Usar exclusivamente `_verifiedRole`; el bypass requiere permiso explícito y motivo auditado; compras con orden exigen recepción y factura coincidentes; gastos sin orden usan flujo de aprobación independiente; factura de proveedor única; PDF real con URL verificada; pruebas de rol falsificado y bypass.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-141 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-141] Actualizar cálculo de nómina a parámetros legales hondureños vigentes y versionados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-141 (REQ-EXP-014).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`; tabla de políticas de nómina.
- **Dependencias Expuestas:** `calculatePayrollPeriod`, deducciones IHSS/RAP/ISR, horas extras y aportaciones patronales.
- **Descripción del Alcance:** El cálculo usa IHSS trabajador 3.5%, patrono 7.2% y techo L 10,317.38; el último comunicado oficial IHSS revisado establece para 2025 5% trabajador, 8.7% patrono y techo L 11,903.13. El ISR usa tramos anteriores a la tabla progresiva SAR 2026. RAP se calcula con un techo fijo 10,317.38 sin distinguir los techos publicados por RAP y no se encontró el aporte patronal del 4% al Fondo de Reserva Laboral creado por Decreto 47-2024. Las horas extras se multiplican por 1.25 sin diferenciar jornada diurna/nocturna/feriado.
- **Criterios de Aceptación:** Tasas y techos configurables/versionados por ejercicio, régimen y tipo de empresa; actualizar tabla ISR SAR 2026; IHSS/RAP/Reserva Laboral conforme a normativa vigente y excepciones aplicables; reglas diferenciadas de horas extras; trazabilidad de fuente/fecha de cada política; pruebas unitarias con casos oficiales y validación por responsable contable/legal.
- **Estado:** [ ] Pendiente

---

<!-- ID: T-UX-11 | Fuentes: completadas.md -->
### [ ] [T-UX-11] Unificar la navegación contextual y conservar el estado de las vistas
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 1)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/ui-common.js`, Dashboards HTML
- **Dependencias Expuestas:** Encabezados institucionales, menú principal, menú lateral de sección, rutas de navegación, listas, vistas de detalle y manejo de sesión.
- **Descripción del Alcance:**
  1. Mantener una estructura de navegación consistente entre los paneles de control.
  2. Mostrar la ubicación actual dentro de la plataforma.
  3. Conservar el contexto de las listas al abrir y cerrar vistas de detalle.
  4. Permitir volver a la sección anterior sin perder innecesariamente el trabajo.
  5. Gestionar las rutas directas, los enlaces inválidos y las sesiones vencidas.
  6. Adaptar las opciones de navegación al rol y a los permisos efectivos.
- **Criterios de Aceptación:**
  - Al abrir un registro desde una lista filtrada, regresar conserva los filtros y la página anterior.
  - Si el registro se abre mediante una ruta directa, la vista funciona sin depender de una navegación previa.
  - Los enlaces y controles de regreso conducen al destino correcto.
  - Una sesión vencida no produce una falsa confirmación de guardado.
  - Las rutas inválidas muestran una salida comprensible.
- **Estado:** Pendiente

---

<!-- ID: T-UX-16 | Fuentes: completadas.md -->
### [ ] [T-UX-16] Unificar los estados de notificaciones, tareas pendientes y aprobaciones
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 11 & 12)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/ui-common.js`, `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Centro de notificaciones, tareas pendientes, aprobaciones, actividad reciente y servicios de origen.
- **Descripción del Alcance:**
  1. Identificar el tipo, el origen, la fecha y el contexto de cada aviso.
  2. Diferenciar notificaciones informativas de tareas que requieren acción.
  3. Proporcionar acceso directo al registro correspondiente.
  4. Mantener estados coherentes de leído y no leído.
  5. Evitar duplicados innecesarios.
  6. Presentar tareas pendientes y aprobaciones según el rol.
- **Criterios de Aceptación:**
  - Cada notificación contiene contexto suficiente para reconocer el evento.
  - Los enlaces conducen al destino correcto.
  - Los avisos de elementos inaccesibles no revelan información sensible.
  - Las notificaciones leídas y no leídas se mantienen correctamente.
- **Estado:** Pendiente

---

<!-- ID: T-UX-17 | Fuentes: completadas.md -->
### [ ] [T-UX-17] Corregir y completar la protección de cambios no guardados
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 6)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/ui-common.js`
- **Dependencias Expuestas:** `window.setupUnsavedChangesProtection`, formularios y navegación compartida.
- **Descripción del Alcance:**
  1. Detectar modificaciones reales respecto al estado inicial del formulario.
  2. Diferenciar formularios modificados de aquellos que ya fueron guardados.
  3. Advertir antes de abandonar una vista con cambios pendientes.
  4. Evitar advertencias innecesarias después de guardar correctamente.
  5. Gestionar formularios dinámicos y campos añadidos o eliminados.
- **Criterios de Aceptación:**
  - Modificar un campo y abandonar la vista genera una advertencia.
  - Cancelar la navegación mantiene los datos introducidos.
  - Guardar correctamente elimina la advertencia pendiente.
- **Estado:** Pendiente

---

<!-- ID: T-UX-26 | Fuentes: completadas.md -->
### [ ] [T-UX-26] Incorporar una vista de actividad reciente contextual
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 13)
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `js/ui-common.js`
- **Dependencias Expuestas:** Paneles de control, centro de notificaciones y registros de actividad disponibles.
- **Descripción del Alcance:**
  1. Identificar si ya existe una función equivalente.
  2. Mostrar elementos recientes pertinentes para cada rol.
  3. Distinguir actividad informativa de tareas pendientes.
  4. Permitir regresar a registros consultados recientemente cuando continúen disponibles.
- **Criterios de Aceptación:**
  - Los elementos mostrados corresponden a actividad real.
  - El orden temporal es correcto.
- **Estado:** Pendiente

---

<!-- ID: TASK-245 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-245] [P1] [Pasarelas de Pago - Recepción Autenticada de Webhooks de Pasarelas de Pago]
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10450-10475; clave TASK-270; asignación única: Contabilidad -->

---

<!-- ID: TASK-409 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-409] [P2] [Control Presupuestario - Seguimiento de Objetivos Presupuestarios y Desviaciones Financieras]
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

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15664-15687; clave TASK-432; asignación única: Contabilidad -->

- **Cierre operativo C1.288:** TASK-637 pasa a **Completada**. La implementación, autoauditoría, verificación de inventario y Code Review interno están documentados en C1.287. La campaña funcional beta del portal queda separada y se registrará en `docs/testing/PRUEBAS_FUNCIONALES_BETA.md`; no es condición pendiente de esta tarea documental.
