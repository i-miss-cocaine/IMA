# Migración histórica de tareas: Otros

> Fuente íntegra: `RECUPERACION/Pendientes_RECUPERADO.md`  
> Blob de origen: `ef47d232db3ed46317dc14f22b1cdf8f938e8405` (1.443.391 bytes; 17.884 líneas).  
> Registros asignados a este departamento: **113**.  
> Los bloques se reproducen sin reescritura; cada uno conserva encabezado, identificador, estado, descripción y criterios originales. Los comentarios indican su rango de origen.

**Criterio de asignación:** responsabilidad funcional principal. Si el alcance funcional es compartido, se aplica la jerarquía Dirección → Secretaria → Contabilidad → Docente → Estudiante → Otros. La infraestructura técnica transversal y las pruebas compartidas se asignan a Otros.

**Alcance:** archivo histórico de migración. Las tareas `AUD-NG` derivadas de auditoría no se duplican aquí; permanecen en sus informes conforme a `METODOLOGIA_DESARROLLO.md`, sección 3.4.

## Histórico completado F10/F11

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 283-299; clave F10-Task02; asignación única: Otros -->
### [X] [F10-Task02] Completar la verificación integral de los 86 criterios de aceptación de la Fase 10
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.18 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Calidad funcional, verificación y evidencias)
- **Archivos Involucrados:**
  - `tests/regression/academic-grading-suite.js`
  - `tests/regression/modular-dashboard-suite.js`
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Criterios AT-001 a AT-086 de la Fase 10
- **Descripción del Alcance:**
  Verificar que cada criterio declarado en la Fase 10 disponga de evidencia reproducible, diferenciando la existencia de código de la ejecución efectiva de pruebas.
- **Criterios de Aceptación:**
  - Los 86 criterios de la Fase 10 disponen de trazabilidad y evidencias reproducibles.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 473-488; clave F10-Task14; asignación única: Otros -->
### [X] [F10-Task14] Optimizar el rendimiento, la recuperación y la consistencia de los servicios
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.15 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Rendimiento, latencia y resiliencia)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/api.js`
- **Dependencias Expuestas:** Lotes de datos e idempotencia
- **Descripción del Alcance:**
  Optimizar consultas batch de asistencia, reducir operaciones repetitivas en Google Sheets y controlar la concurrencia en modificaciones simultáneas.
- **Criterios de Aceptación:**
  - Las operaciones masivas operan dentro de los umbrales de latencia establecidos.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 489-504; clave F10-Task15; asignación única: Otros -->
### [X] [F10-Task15] Ampliar las pruebas automatizadas y la cobertura de regresión de la Fase 10
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.16 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Calidad de código y suites de regresión)
- **Archivos Involucrados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** Suites de pruebas de la plataforma
- **Descripción del Alcance:**
  Incorporar pruebas automatizadas de integración y unitarias para los flujos de asistencia, justificantes, salidas anticipadas, incidencias, consejería, orientación y delegaciones.
- **Criterios de Aceptación:**
  - La suite de regresión valida automáticamente las reglas y contratos de la Fase 10.
- **Estado:** [X] Completado

---


## Backlog histórico TASK

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1360-1395; clave TASK-018; asignación única: Otros -->
### [TASK-018] [X] [F18-Task20] Implementar suite automatizada de pruebas y regresión integral de compras
- **Origen del Hallazgo:** `AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` / Sección G (P0) y Sección F
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Aseguramiento de calidad, prevención de regresiones e integridad en adquisiciones)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Suites de pruebas del ecosistema, contratos de API de compras, inventario y cuentas por pagar
- **Descripción del Alcance:**
  Implementar la suite integral automatizada `runPhase18PurchasingAndSuppliersRegressionSuite` que valide de manera continua el ciclo de compras completo, recepciones parciales, Three-Way Matching, compromisos presupuestarios y asientos contables por partida doble.
  Requerimientos Funcionales Detallados:
  1. Batería de pruebas automatizadas:
     - Proveedores: registro, validación de RTN, contactos y bloqueo de inactivos.
     - Solicitudes y cotizaciones: creación, aprobación multinivel y comparativa de ofertas.
     - Órdenes de compra: prevención de autoaprobaciones (`AUTO_APPROVAL_BLOCKED`), umbral de L 50,000 (`HIGH_VALUE_APPROVAL_REQUIRED`) y generación de PDF.
     - Recepciones e inventario: recepciones parciales escalonadas sin cierre prematuro de orden e incremento exacto en `InventariosKardex`.
     - Facturas y Three-Way Matching: detección de diferencias de precio, bloqueo por cantidades no recibidas y conciliación exitosa de partidas conformes.
     - Cuentas por pagar: pagos parciales, saldo pendiente exacto y aplicación de notas de crédito comerciales.
     - Presupuesto y contabilidad: reserva y liberación de compromisos presupuestarios y verificación de balance por partida doble en `AsientosContables` (`totalDebe === totalHaber`).
  2. Prueba de flujo integral E2E (End-to-End):
     - Ejecutar en una sola prueba el ciclo: Solicitud -> Cotización -> Orden -> Recepción parcial 1 -> Recepción parcial 2 -> Inventario -> Factura con Three-Way Matching -> Aprobación -> Pago parcial -> Pago final -> Asiento contable.
  3. Aislamiento y reporte de resultados:
     - Operar sobre datos de prueba aislados sin alterar registros de producción ni las 53 pruebas de regresión previas.
- **Criterios de Aceptación:**
  - La suite de regresión valida el ciclo de adquisiciones con el 100% de éxito en entorno controlado.
  - Se detecta y alerta automáticamente el cierre prematuro de órdenes de compra.
  - Se bloquean facturas que intenten cobrar cantidades no recibidas físicamente.
  - Los asientos contables generados se validan como perfectamente equilibrados.
  - No se produce ninguna regresión en las pruebas de las fases anteriores (Fases 9, 10, 11, 15, 16 y 17).
- **Estado:** [X] Completado

---

# PENDIENTES - FASE 19: INVENTARIO, ACTIVOS FIJOS Y MANTENIMIENTO INSTITUCIONAL


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1546-1591; clave TASK-022; asignación única: Otros -->
### [TASK-022] [X] [F19-Task20] Implementar suite automatizada de pruebas y regresión integral de inventario y activos
- **Origen del Hallazgo:** `AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md` / Sección G (P0), Sección F y Plan de Trabajo F19-20
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Aseguramiento continuo de integridad en recursos físicos, bodegas multialmacén y balances contables)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Todas las tareas de la Fase 19 (`F19-Task01` a `F19-Task19`), suites de pruebas del ecosistema institucional
- **Descripción del Alcance:**
  Implementar la suite integral automatizada `runPhase19InventoryAndAssetsRegressionSuite` que valide de manera continua el ciclo completo de inventarios multialmacén, transferencias, catálogo maestro, asignaciones y devoluciones de activos, planes preventivos, repuestos de mantenimiento, cálculo de depreciaciones, valoración económica y asientos contables por partida doble.
  Requerimientos Funcionales Detallados:
  1. Batería obligatoria de pruebas de aceptación (PT19-01 a PT19-20):
     * PT19-01: Entrada en dos almacenes -> Existencias calculadas independientemente sin mezclar saldos.
     * PT19-02: Salida superior al disponible en la bodega -> Operación bloqueada con excepción descriptiva.
     * PT19-03: Transferencia sin stock suficiente en origen -> Rechazo inmediato sin movimientos huérfanos.
     * PT19-04: Transferencia válida -> Salida en origen, entrada en destino y correlación documental idéntica.
     * PT19-05: Devolución de activo en buen estado -> Custodia cerrada y activo en estado `available`.
     * PT19-06: Devolución con daño físico -> Activo en estado `maintenance` y generación de orden técnica.
     * PT19-07: Depreciación mensual lineal -> Cálculo exacto y asiento contable balanceado por partida doble.
     * PT19-08: Intento de depreciación duplicada para el mismo período -> Bloqueo automático.
     * PT19-09: Consumo departamental de materiales -> Gasto imputado al centro de costo correspondiente.
     * PT19-10: Transferencia interna entre bodegas -> Movimiento de stock sin reconocimiento erróneo de gasto.
     * PT19-11: Despacho de lote vencido -> Bloqueo automático del consumo.
     * PT19-12: Despacho automático FEFO -> Selección prioritaria del lote con caducidad más cercana.
     * PT19-13: Consulta por código QR de activo -> Retorno exacto del expediente patrimonial y custodio.
     * PT19-14: Mantenimiento preventivo completado -> Proyección automática de la siguiente fecha del ciclo.
     * PT19-15: Repuestos utilizados en mantenimiento -> Descuento atómico y exacto en el Kardex.
     * PT19-16: Baja patrimonial de activo -> Expediente histórico preservado y asiento contable de baja asentado.
     * PT19-17: Conteo físico con discrepancia -> Conciliación y generación de ajuste trazable.
     * PT19-18: Solicitudes simultáneas concurrentes -> Control mediante `LockService` sin sobreasignación ni saldos negativos.
     * PT19-19: Matriz de permisos RBAC -> Operaciones administrativas bloqueadas para roles sin privilegios.
     * PT19-20: Reporte de inventario valorizado -> Conciliación monetaria matemática con el libro mayor.
  2. No regresión del ecosistema:
     - Garantizar que la ejecución de la suite no altere registros de producción ni las 53 pruebas de regresión previas de las Fases 9, 10, 11, 15, 16, 17 y 18.
- **Criterios de Aceptación:**
  - El 100% de las 20 pruebas transversales (PT19-01 a PT19-20) se ejecutan con resultado satisfactorio (`PASS`).
  - No existen desbalances contables (`totalDebe === totalHaber` en todos los asientos generados).
  - No se generan saldos negativos de inventario bajo ninguna circunstancia.
  - La suite de regresión previa (53/53 pruebas) se mantiene aprobada al 100%.
- **Estado:** [X] Completado

---

# PENDIENTES - FASE 20: BIBLIOTECA INSTITUCIONAL Y RECURSOS EDUCATIVOS


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1738-1768; clave TASK-028; asignación única: Otros -->
### [TASK-028] [X] [F20-Task14] Implementar suite automatizada de pruebas y regresión integral de biblioteca
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección G (P0), Sección F y Plan de Trabajo F20-14
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Aseguramiento continuo de integridad en catálogo bibliográfico, préstamos, reservas y no regresión)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Todas las tareas de la Fase 20 (`F20-Task01` a `F20-Task13`), suites de pruebas del ecosistema institucional
- **Descripción del Alcance:**
  Implementar la suite integral automatizada `runPhase20LibraryAndResourcesRegressionSuite` que valide de manera continua el catálogo de obras y ejemplares, circulación de préstamos, devoluciones con inspección física, reservas con lista de espera, control de morosidad, recursos digitales y no regresión de las fases previas.
  Requerimientos Funcionales Detallados:
  1. Batería obligatoria de pruebas de aceptación:
     - Catálogo: registro de obras, gestión de ejemplares individuales con IDs únicos, búsqueda y filtrado.
     - Circulación: emisión de préstamo, rechazo de préstamo sobre libro ya prestado, validación de límite máximo de libros por rol de usuario.
     - Devoluciones: cierre de préstamo, restitución a disponible en buen estado, derivación a mantenimiento ante daño físico.
     - Reservas: creación de reserva sobre libro prestado, bloqueo de renovación ante reserva activa en lista de espera.
     - Incidencias y digitales: registro de pérdida de ejemplar, consulta de recursos digitales con control de permisos RBAC.
     - Concurrencia: verificación de bloqueo mediante `LockService` ante solicitudes simultáneas de préstamo.
  2. No regresión del ecosistema:
     - Garantizar que la suite opere en entorno controlado sin alterar registros de producción ni las 53 pruebas de regresión previas de las Fases 9, 10, 11, 15, 16, 17, 18, 19 y 21.
- **Criterios de Aceptación:**
  - La suite de regresión ejecuta todas las pruebas de biblioteca y recursos educativos con el 100% de éxito (`PASS`).
  - Se valida el correcto funcionamiento de las 6 funciones previamente ausentes en backend.
  - Las suites de regresión previas (53/53 pruebas) se mantienen aprobadas al 100%.
- **Estado:** [X] Completada

---

# PENDIENTES - FASE 21: TRANSPORTE ESCOLAR, MOVILIDAD ESTUDIANTIL Y SERVICIOS COMPLEMENTARIOS


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2034-2066; clave TASK-037; asignación única: Otros -->
### [TASK-037] [X] [F21-Task34] Suite automatizada de pruebas y regresión integral de transporte y servicios complementarios
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección G (P0) y Plan de Implementación TAREA 33
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Aseguramiento continuo de integridad en movilidad escolar, cupos, seguridad infantil y cobros)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Todas las tareas de la Fase 21 (`F21-Task01` a `F21-Task33`), suites de pruebas del ecosistema institucional
- **Descripción del Alcance:**
  Implementar la suite integral automatizada `runPhase21TransportAndServicesRegressionSuite` que valide de manera continua el ciclo de transporte y servicios complementarios, certificando todas las operaciones críticas y la no regresión del sistema.
  Requerimientos Funcionales Detallados:
  1. Batería obligatoria de pruebas automatizadas:
     - Capacidad y cupos: rechazo estricto de asignación al superar el límite de asientos de la unidad.
     - Privacidad RBAC: verificación de que un rol Padre solo recibe datos de sus hijos y se bloquean accesos cruzados.
     - Abordaje y descenso: registro de eventos QR, prevención de abordajes duplicados y bloqueo de cierre de viaje con alumnos a bordo.
     - Entregas autorizadas: verificación de que solo adultos vigentes en expediente familiar son aceptados al entregar menores.
     - Habilitación de flota: bloqueo de autobuses con revisión mecánica o seguro caducado y choferes con licencia vencida.
     - Rutas asimétricas: asignación independiente mañana/tarde y control por días lectivos.
     - Facturación de transporte: generación del cargo en `CargosEstudiante` con tarifa adecuada y prevención de duplicados.
     - Cafetería, tienda y extracurriculares: cobros con crédito familiar, consolidación de consumos y asistencia a clubes.
  2. No regresión del ecosistema:
     - Garantizar que la suite opere en entorno controlado sin alterar registros de producción ni las 53 pruebas de regresión previas de las Fases 9, 10, 11, 15, 16, 17, 18, 19 y 20.
- **Criterios de Aceptación:**
  - La suite de regresión ejecuta todas las pruebas de transporte y servicios complementarios con el 100% de éxito (`PASS`).
  - Se valida el bloqueo efectivo de sobrecupos y la protección de datos de menores.
  - Las suites de regresión previas (53/53 pruebas) se mantienen aprobadas al 100%.
- **Estado:** [X] Completada

---

# PENDIENTES - FASE 22: GESTIÓN DOCUMENTAL, FORMULARIOS, FIRMA ELECTRÓNICA E INTEGRACIÓN CON CUADROS DE SACE


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2247-2278; clave TASK-042; asignación única: Otros -->
### [TASK-042] [X] [F22-Task13] Suite de pruebas automatizadas y regresión integral de la Fase 22
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección G (P0), Sección F y Plan de Trabajo TAREA 22-13
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Aseguramiento continuo de emisión CUV, correlativos seguros, firmas, compatibilidad SACE y no regresión)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Todas las tareas de la Fase 22 (`F22-Task01` a `F22-Task12`), suites de pruebas del ecosistema institucional.
- **Descripción del Alcance:**
  Implementar la suite integral automatizada `runPhase22DocumentManagementAndSACERegressionSuite` que valide de manera continua la generación documental con CUV, concurrencia, validación binaria, hash criptográfico de firmas, explorador documental, flujos de aprobación y procesamiento exacto de cuadros oficiales SACE sin regresión de las fases anteriores.
  Requerimientos Funcionales Detallados:
  1. Batería de pruebas automatizadas:
     - Documentos y almacenamiento: generación de documentos, correlativos anuales, CUV único, concurrencia con `LockService`, versionado de plantillas v1.0/v1.1, validación binaria de archivos (Magic Bytes) y recuperación documental.
     - Formularios y trámites: creación de formularios con definición JSON, envío de solicitudes, adjuntos en Drive, revisión y aprobación de trámites, rechazo justificado, vencimientos y trazabilidad.
     - Firmas: aceptación simple, cálculo de hash SHA-256, verificación de integridad, certificado de finalización de firma, múltiples firmantes secuenciales/paralelos y detección de documentos modificados.
     - Explorador documental: búsqueda por CUV/correlativo, filtros combinados, previsualización y aislamiento RBAC/ABAC entre expedientes.
     - Cuadros SACE: reconocimiento de plantillas oficiales en repositorio, validación de asignatura/grado/sección, correspondencia estricta de alumnos sin ceros automáticos, conservación absoluta de fórmulas, estilos y áreas de impresión, y descarga automática.
  2. No regresión del ecosistema:
     - Verificar que las nuevas implementaciones no alteren registros de producción ni deterioren las 53 pruebas de regresión previas de las Fases 9, 10, 11, 15, 16, 17, 18, 19, 20 y 21.
- **Criterios de Aceptación:**
  - [ ] Las pruebas de generación CUV y correlativos se ejecutan correctamente garantizando unicidad.
  - [ ] Las pruebas de integridad criptográfica detectan documentos alterados.
  - [ ] Las pruebas de permisos detectan y bloquean accesos no autorizados a expedientes.
  - [ ] Las pruebas de flujos verifican todos los estados y transiciones válidas.
  - [ ] Las pruebas SACE verifican las celdas y notas de cada alumno preservando el formato original del libro Excel.
  - [ ] Las funcionalidades previamente verificadas mantienen su comportamiento y las 53 pruebas previas se mantienen aprobadas al 100%.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2353-2396; clave TASK-046; asignación única: Otros -->
### [TASK-046] [X] [F23-Task03] [P0] [Arquitectura Distribuida - Enrutador Universal de Spreadsheets y Resolución Dinámica de Fuentes de Datos]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** `CatalogoSpreadsheets`, `F23-Task04`.
- **Capacidades Relacionadas:** F23-008, F23-009.
- **Problema Detectado:**
  Existe un catálogo de fuentes distribuidas en el servicio contable, pero la resolución de datos no está estandarizada en todos los servicios. Persisten referencias rígidas a `SPREADSHEET_ID`, especialmente en servicios académicos y de usuarios. Esto limita la distribución de información por cuentas, departamentos, dominios y ciclos lectivos.
- **Requisitos Funcionales:**
  1. Establecer un mecanismo común (`resolveSpreadsheetSource`) para resolver la fuente de datos que corresponde a cada operación.
  2. Utilizar el catálogo de fuentes existente como referencia arquitectónica, conservando su funcionalidad y ampliándolo cuando sea necesario.
  3. Permitir registrar múltiples Spreadsheets por:
     - Dominio institucional.
     - Departamento.
     - Área de responsabilidad.
     - Ciclo lectivo.
     - Tipo de información.
     - Cuenta propietaria.
     - Servicio responsable.
  4. Permitir definir una fuente predeterminada cuando no exista una partición específica.
  5. Resolver automáticamente la fuente adecuada según el contexto de la consulta.
  6. Evitar que cada servicio tenga que mantener una tabla independiente de identificadores de Spreadsheets.
  7. Incorporar validaciones de existencia, disponibilidad, autorización y compatibilidad de esquema.
  8. Permitir registrar versiones de esquema.
  9. Detectar fuentes inexistentes, deshabilitadas, duplicadas o incompatibles.
  10. Mantener referencias históricas a las fuentes utilizadas por registros y operaciones anteriores.
  11. Permitir agregar nuevas fuentes sin modificar manualmente todas las funciones que consultan información.
- **Comportamiento Esperado:**
  Cuando un módulo solicite información de un dominio y ciclo lectivo determinados, el enrutador deberá identificar la fuente correspondiente y proporcionar acceso únicamente si el servicio tiene autorización.
  La ausencia de una fuente no debe provocar una lectura silenciosa desde un Spreadsheet incorrecto.
- **Criterios de Aceptación:**
  - [X] Registrar fuentes de diferentes dominios y ciclos lectivos.
  - [X] Resolver fuentes desde los servicios académico, usuario y contable de manera transparente.
  - [X] Comprobar que un ciclo lectivo no consulte datos de otro ciclo sin autorización explícita.
  - [X] Intentar consultar una fuente inexistente y verificar el manejo seguro del error.
  - [X] Deshabilitar una fuente y comprobar que se rechaza su utilización.
  - [X] Registrar una nueva partición sin tener que modificar cada consumidor.
  - [X] Comprobar la compatibilidad de esquemas entre particiones.
  - [X] Verificar que las referencias históricas no cambian al registrar nuevas fuentes.
- **Estado:** [X] Completada

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2444-2485; clave TASK-048; asignación única: Otros -->
### [TASK-048] [X] [F23-Task05] [P0] [Seguridad y Red - Protocolo Universal de Comunicación Interservicio y Gestión de Credenciales]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task04`.
- **Capacidades Relacionadas:** F23-010, F23-023, F23-025, F23-029.
- **Problema Detectado:**
  Existe comunicación mediante HMAC-SHA256, pero la autenticación y autorización no están estandarizadas para todos los servicios. La utilización de claves estáticas compartidas aumenta el riesgo de exposición y dificulta la revocación selectiva.
- **Requisitos Funcionales:**
  1. Establecer un protocolo común de comunicación entre los servicios.
  2. Identificar de manera inequívoca al servicio emisor y receptor.
  3. Firmar las solicitudes utilizando HMAC-SHA256 cuando corresponda al mecanismo de autenticación adoptado.
  4. Incluir identificador de solicitud, fecha de emisión, identificador de correlación y protección contra repetición.
  5. Validar la firma antes de ejecutar operaciones.
  6. Implementar control de vigencia de solicitudes.
  7. Gestionar secretos fuera del código fuente y del navegador (`PropertiesService`).
  8. Incorporar rotación de claves sin interrumpir innecesariamente la comunicación.
  9. Permitir revocar credenciales de un servicio sin afectar a los demás.
  10. Establecer permisos por operación, no solamente por servicio.
  11. Separar consultas, modificaciones, operaciones administrativas y acciones sensibles.
  12. Mantener compatibilidad de versiones del protocolo.
  13. Evitar que una respuesta autenticada se interprete automáticamente como una autorización para modificar cualquier recurso.
  14. Validar el contenido y la estructura de cada solicitud y respuesta.
- **Comportamiento Esperado:**
  Un servicio debe poder comunicarse con otro servicio perteneciente a una cuenta diferente, siempre que exista una autorización explícita.
  Un servicio no debe poder suplantar a otro ni utilizar sus credenciales para acceder a operaciones ajenas.
- **Criterios de Aceptación:**
  - [X] Comunicación autenticada entre dos cuentas diferentes con verificación de firma HMAC.
  - [X] Rechazar solicitudes sin firma o con firma incorrecta.
  - [X] Rechazar solicitudes expiradas por tiempo de vigencia.
  - [X] Rechazar repetición de solicitudes (protección anti-replay).
  - [X] Ejecutar rotación de credenciales sin interrupción de servicio.
  - [X] Revocación individual de un servicio específico.
  - [X] Rechazar intento de ejecutar una operación no autorizada.
  - [X] Inspeccionar el frontend para comprobar que no contiene secretos ni claves de servicio.
  - [X] Verificar que los errores no exponen claves ni tokens en texto plano.
- **Estado:** [X] Completada

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2653-2712; clave TASK-052; asignación única: Otros -->
### [TASK-052] [F24-Task03] [P0] [Filtros y Dimensiones - Normalización de Filtros Temporales y Estructura Institucional]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Catálogo de informes (`F24-Task01`), diccionario de indicadores (`F24-Task02`), configuración académica e institucional existente.
- **Capacidades Relacionadas:** F24-003, F24-004.
- **Problema Detectado:**
  Los filtros actuales admiten fechas y años lectivos, pero necesitan validaciones más estrictas. Los filtros estructurales tampoco cuentan con una relación dependiente suficientemente completa entre grados y secciones.
- **Requisitos Funcionales:**
  1. Normalizar los parámetros temporales de los informes:
     - Fecha inicial (`fechaInicio`).
     - Fecha final (`fechaFin`).
     - Año lectivo (`anoLectivo`).
     - Período académico (`periodo`).
     - Período fiscal (`ejercicioFiscal`).
     - Intervalo personalizado.
  2. Validar rangos invertidos (`fechaInicio > fechaFin`), fechas inválidas y períodos incompatibles.
  3. Diferenciar períodos académicos, calendarios y fiscales sin solapamientos indebidos.
  4. Permitir filtros por:
     - Departamento.
     - Nivel educativo.
     - Grado.
     - Sección.
     - Asignatura.
     - Docente.
     - Estudiante.
     - Estado del registro.
     - Categorías financieras.
     - Otros criterios compatibles con cada informe.
  5. Implementar filtros dependientes en cascada:
     - Al seleccionar un nivel educativo, mostrar los grados correspondientes.
     - Al seleccionar un grado, mostrar únicamente sus secciones válidas.
     - Al seleccionar una sección, limitar los docentes y asignaturas a las relaciones correspondientes, cuando aplique.
  6. Permitir seleccionar varios valores (multiselect) cuando el informe lo admita.
  7. Incorporar una opción para limpiar filtros individuales y restablecer todos los filtros predeterminados.
  8. Conservar los filtros al navegar desde un panel hacia un informe detallado.
  9. Impedir que los filtros permitan consultar información fuera del ámbito autorizado del usuario.
- **Cambios Necesarios:**
  - Normalizar la validación de fechas y períodos en los servicios que reciben parámetros de consulta.
  - Incorporar las relaciones dependientes en los controles de selección de la interfaz gráfica.
  - Adaptar las consultas para utilizar los identificadores institucionales y no depender únicamente de nombres visibles.
  - Unificar el tratamiento de filtros entre los informes académicos, financieros y administrativos.
- **Comportamiento Esperado:**
  Los filtros deben funcionar como un conjunto coherente. Seleccionar un grado limitará las secciones disponibles y la consulta resultante. Cambiar el período actualizará todos los valores dependientes del informe.
  Los filtros no deben modificar ni ampliar los permisos del usuario.
- **Criterios de Aceptación:**
  - [ ] Un rango de fechas invertido se rechaza con un mensaje de validación claro.
  - [ ] Los períodos fiscales cruzados se procesan correctamente según las reglas del informe.
  - [ ] Al cambiar el grado, las secciones disponibles en la interfaz se actualizan automáticamente.
  - [ ] Una sección no perteneciente al grado seleccionado no puede enviarse como filtro válido.
  - [ ] Los filtros combinados devuelven únicamente los registros que cumplen todas las condiciones.
  - [ ] Los filtros no aplicables a un informe no se muestran en pantalla.
  - [ ] Los cambios de filtros actualizan los resultados y no conservan cifras de consultas anteriores.
  - [ ] Los usuarios no pueden ampliar su ámbito de consulta modificando los identificadores enviados al servidor.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2713-2770; clave TASK-053; asignación única: Otros -->
### [TASK-053] [F24-Task04] [P0] [Arquitectura Distribuida - Estandarización de Consultas entre Servicios y Fuentes Distribuidas]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Diccionario semántico (`F24-Task02`), filtros normalizados (`F24-Task03`), catálogo de fuentes existente y servicios de los diferentes módulos.
- **Capacidades Relacionadas:** F24-024, F24-025, F24-008.
- **Problema Detectado:**
  La resolución de fuentes de datos está parcialmente normalizada en el servicio financiero, pero no existe una estrategia universal para los informes que consultan datos distribuidos entre diferentes servicios y hojas de cálculo. Esto puede provocar diferencias, duplicaciones, resultados incompletos o dificultades para identificar el origen de la información.
- **Requisitos Funcionales:**
  1. Estandarizar la identificación de fuentes de datos de los informes institucionales.
  2. Permitir identificar para cada fuente:
     - Servicio responsable.
     - Identificador de origen (`fuenteId`).
     - Institución o ámbito al que pertenece.
     - Período o partición anual.
     - Versión del esquema.
     - Fecha de actualización.
     - Estado de disponibilidad (`active`, `degraded`, `disabled`).
  3. Normalizar las relaciones entre:
     - Estudiantes.
     - Usuarios.
     - Matrículas.
     - Grados y secciones.
     - Períodos académicos.
     - Operaciones financieras.
     - Departamentos.
     - Responsables.
  4. Evitar contabilizar dos veces una misma operación por encontrarse en fuentes diferentes.
  5. Identificar registros incompletos, duplicados o incompatibles.
  6. Permitir combinar fuentes cuando exista una relación válida entre ellas.
  7. Diferenciar los resultados completos de los parciales cuando una partición no esté disponible.
  8. Identificar qué fuentes participaron en la generación de cada informe.
  9. Mantener el aislamiento de permisos en las consultas distribuidas.
  10. Incorporar mecanismos de control cuando una fuente no responda o devuelva información desactualizada.
- **Cambios Necesarios:**
  - Extender la resolución de fuentes existente (`resolveSpreadsheetSource`) hacia los servicios que participan en informes institucionales.
  - Normalizar los identificadores y metadatos de las fuentes en catálogo central.
  - Incorporar validaciones de integridad referencial entre registros vinculados.
  - Adaptar las consultas consolidadas para que registren el origen de cada conjunto de datos.
  - Incorporar estados de disponibilidad y actualización en el informe resultante.
- **Comportamiento Esperado:**
  Un informe consolidado debe conocer qué fuentes utilizó y si todas respondieron correctamente.
  Si una fuente no está disponible, el sistema no debe presentar un resultado parcial como si fuera completo. Debe identificar la limitación y permitir distinguir los datos disponibles de los pendientes.
- **Criterios de Aceptación:**
  - [ ] Los informes identifican explícitamente sus fuentes de datos en la respuesta.
  - [ ] Los registros relacionados se vinculan mediante identificadores válidos sin pérdida de referencias.
  - [ ] Una misma operación no se contabiliza dos veces al consultar múltiples particiones.
  - [ ] Las fuentes no disponibles generan un estado identificable de advertencia.
  - [ ] Los informes parciales no se presentan como completos sin indicar fuentes faltantes.
  - [ ] Los datos históricos utilizan la partición correspondiente al ciclo analizado.
  - [ ] Los permisos se verifican también en las consultas distribuidas a través de HMAC.
  - [ ] Los resultados consolidados coinciden con los resultados de referencia calculados sobre los registros fuente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2771-2820; clave TASK-054; asignación única: Otros -->
### [TASK-054] [F24-Task21] [P0] [Validación y Regresión - Validación Integral y Pruebas de Regresión de Informes e Indicadores]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Todas las tareas anteriores de la Fase 24 (`F24-Task01` a `F24-Task20`).
- **Capacidades Relacionadas:** F24-001 a F24-025 y F24-A01 a F24-A08.
- **Problema Detectado:**
  La auditoría declara completas y verificadas varias capacidades fundamentales. Las nuevas implementaciones deben conservar sus resultados y evitar que la centralización, las agregaciones o las exportaciones alteren las reglas ya comprobadas.
- **Requisitos Funcionales:**
  1. Mantener inalterables los resultados de los informes y servicios analíticos existentes:
     - Informe financiero y cobranza confirmada (`REP-CONT-01`).
     - Rendimiento académico por grado y sección (`REP-ACAD-01`).
     - Indicadores curriculares de notas publicadas (`getCurricularAnalyticsReport`).
     - Resumen financiero de caja y bancos (`getFinancialSummary`).
     - Comparativo financiero multianual por cuentas (`getComparativeFinancialSummary`).
     - Proyección de flujo de caja semestral (`getCashFlowSixMonthProjection`).
     - Indicadores de ejecución y disponibilidad presupuestaria (`checkBudgetAvailability`, `getBudgetExecutionReport`).
  2. Conservar las exclusiones financieras estrictas: no contabilizar jamás operaciones pendientes, canceladas o rechazadas como ingresos efectivos.
  3. Conservar las reglas académicas estrictas: no contabilizar jamás borradores o notas no publicadas en promedios y reportes oficiales.
  4. Mantener los controles de permisos y aislamiento de ámbito por rol (RBAC/ABAC) existentes.
  5. Mantener la marca temporal ISO de generación en todos los reportes generados.
  6. Mantener los eventos de trazabilidad y auditoría estructurada (`REPORT_GENERATED`, `REPORT_FAILED`).
  7. Conservar el esquema de particiones históricas mediante `CatalogoSpreadsheets`.
  8. Comprobar la equivalencia matemática absoluta entre los cálculos originales y los centralizados en el diccionario semántico.
  9. Comprobar la equivalencia de resultados entre las consultas directas en tiempo real y las consultas sobre el DataMart de agregaciones.
  10. Verificar que los cuadros de mando, informes tabulares y exportaciones descargables produzcan resultados completamente consistentes entre sí.
- **Cambios Necesarios:**
  - Ampliar la suite de regresión del sistema (`runPhase24ReportsAndAnalyticsRegressionSuite`).
  - Incorporar conjuntos de datos de prueba de referencia con resultados matemáticos precalculados.
  - Añadir pruebas automatizadas para el catálogo central y el diccionario semántico.
  - Añadir pruebas de estrés y reconstrucción histórica en el DataMart.
  - Incorporar pruebas de integridad y neutralización de fórmulas en exportadores CSV/XLSX.
  - Incorporar pruebas de rechazo de accesos no autorizados en informes y paneles.
  - Verificar continuamente que los cambios no introduzcan regresiones sobre las 53 pruebas de regresión preexistentes.
- **Comportamiento Esperado:**
  Las nuevas implementaciones deberán contar con pruebas reproducibles que permitan comprobar que las capacidades existentes continúan funcionando y que las nuevas no introducen regresiones en el ecosistema analítico.
- **Criterios de Aceptación:**
  - [ ] La suite de regresión existente mantiene el 100% de sus 53 pruebas aprobadas.
  - [ ] Los informes financieros conservan sus exclusiones estrictas de transacciones no confirmadas.
  - [ ] Los informes académicos conservan sus reglas de exclusión de calificaciones en borrador.
  - [ ] Los indicadores del diccionario semántico centralizado producen resultados idénticos a los cálculos originales.
  - [ ] Los datos agregados del DataMart coinciden exactamente con los cálculos sobre registros transaccionales fuente.
  - [ ] Los archivos exportados coinciden en un 100% con los datos consultados en pantalla.
  - [ ] Los accesos directos o no autorizados continúan siendo rechazados con código de seguridad.
  - [ ] Las particiones históricas conservan íntegros sus resultados ante cambios en ciclos actuales.
  - [ ] Todos los eventos de generación y fallos continúan registrándose en la bitácora de auditoría.
  - [ ] Cualquier inconsistencia o regresión detectada bloquea la entrega hasta su resolución.
- **Estado:** [ ] Pendiente

---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2826-2902; clave TASK-056; asignación única: Otros -->
### [TASK-056] [F25-Task01] [P0] [Catálogo de Integraciones - Catálogo Unificado de Integraciones Externas]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - Hojas `IntegracionesPasarelas`, `CatalogoSpreadsheets`, `CatalogoIntegracionesExternas`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** Ninguna obligatoria para crear el catálogo. La incorporación de cada conector depende de su registro y configuración existentes.
- **Capacidades Relacionadas:** F25-001, F25-016, F25-018.
- **Problema que Resuelve:**
  La configuración de integraciones se encuentra distribuida en diferentes registros y servicios. No existe una vista centralizada que permita conocer todas las conexiones externas, sus responsables, permisos, dependencias, estado operativo y últimas ejecuciones.
- **Requisitos Funcionales:**
  1. Crear un catálogo unificado denominado `CatalogoIntegracionesExternas` que consolide las integraciones existentes sin duplicar sus configuraciones ni trasladar innecesariamente sus responsabilidades funcionales.
  2. Registrar para cada integración, como mínimo:
     - Identificador único de integración (`integracionId`).
     - Nombre visible y descripción funcional.
     - Categoría: archivos, hojas de cálculo, SACE, correo, calendario, pasarela de pago, API u otros conectores.
     - Proveedor o sistema externo.
     - Servicio interno que utiliza la integración.
     - Responsable funcional y responsable técnico.
     - Dirección del intercambio: entrada, salida o bidireccional.
     - Operaciones admitidas: consultar, importar, exportar, actualizar, sincronizar o recibir notificaciones.
     - Permisos requeridos (RBAC).
     - Dependencias internas y externas.
     - Referencia a la configuración específica del conector.
     - Versión del conector y del contrato aplicable.
     - Fecha de registro y última modificación.
     - Última conexión y última operación satisfactoria.
     - Estado de configuración y estado operativo.
     - Resultado de la última ejecución.
     - Indicador de disponibilidad de credenciales.
     - Documentación o instrucciones de configuración.
  3. Distinguir claramente estos estados de integración:
     - `No configurada`
     - `Pendiente de autorización`
     - `Configurada`
     - `Conectada`
     - `Activa`
     - `Suspendida`
     - `Desconectada`
     - `Con errores`
     - `Deshabilitada`
  4. No considerar una integración operativa únicamente porque exista un registro de configuración.
- **Administración y Permisos:**
  - Administrador del Sistema: administrar todas las integraciones.
  - Contabilidad: gestionar las conexiones financieras que tenga autorizadas.
  - Dirección: consultar el estado general y las operaciones institucionales.
  - Responsables técnicos: administrar las conexiones que tengan asignadas.
  - Otros perfiles: utilizar únicamente las operaciones habilitadas para su rol.
  - La autorización debe comprobarse en el servidor, no únicamente ocultando opciones en la interfaz.
- **Cambios Necesarios:**
  1. Crear el registro centralizado de integraciones en hoja `CatalogoIntegracionesExternas`.
  2. Incorporar las integraciones existentes de pasarelas, Google Sheets, correo y SACE mediante referencias a sus configuraciones actuales.
  3. Relacionar los registros del catálogo con los conectores y contratos correspondientes.
  4. Implementar consultas centralizadas del estado (`getIntegrationsCatalog`).
  5. Incorporar una interfaz administrativa para consultar, filtrar y administrar integraciones.
  6. Permitir activar, suspender o deshabilitar una integración sin eliminar su historial.
  7. Registrar cambios de responsables, permisos y configuración.
  8. Evitar que el catálogo mantenga copias independientes de credenciales o configuraciones que ya tienen un almacenamiento propio.
- **Comportamiento Esperado:**
  Al ingresar al área de integraciones, los usuarios autorizados deben poder consultar todas las conexiones disponibles y conocer cuáles funcionan, cuáles requieren autorización y cuáles presentan errores.
  Al seleccionar una integración, deben poder consultar sus operaciones, dependencias, responsables, historial y estado de conexión.
- **Criterios de Aceptación:**
  - [ ] Todas las integraciones identificadas en la auditoría aparecen en el catálogo.
  - [ ] Cada integración tiene un identificador único e inequívoco.
  - [ ] Las configuraciones existentes siguen funcionando después de incorporarse al catálogo.
  - [ ] El catálogo permite diferenciar configuración, autorización, conexión y operación satisfactoria.
  - [ ] Una integración deshabilitada no puede ejecutar operaciones ni peticiones.
  - [ ] Los cambios administrativos quedan registrados en auditoría.
  - [ ] Un usuario sin privilegios no puede modificar integraciones (rechazo 403 Forbidden).
  - [ ] La suspensión de una integración no elimina su configuración ni su historial.
  - [ ] Los errores de conexión se reflejan en el estado operativo sin exponer secretos.
  - [ ] No existen registros duplicados que representen la misma integración.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2903-2991; clave TASK-057; asignación única: Otros -->
### [TASK-057] [F25-Task02] [P0] [Mapeo de Columnas - Persistencia y Administración de Perfiles de Mapeo de Importación]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - Hojas `AuditoriaMigraciones`, `PerfilesMapeoColumnas`
  - `js/ui-common.js`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** F25-002 y F25-005. Reutiliza el importador (`importDataWithColumnMapping`) y la vista previa (`validateImportPreview`).
- **Capacidades Relacionadas:** F25-003, F25-002, F25-005.
- **Problema que Resuelve:**
  Actualmente, el mapeo de columnas se proporciona mediante un objeto JSON en cada operación. Aunque permite importar información con diferentes estructuras, obliga a configurar nuevamente las correspondencias para las importaciones recurrentes. Esto dificulta reutilizar configuraciones entre ciclos académicos, procesos de matrícula, migraciones y actualizaciones de expedientes.
- **Requisitos Funcionales:**
  1. Crear una estructura persistente denominada `PerfilesMapeoColumnas`.
  2. Registrar en cada perfil:
     - Identificador único (`perfilMapeoId`).
     - Nombre descriptivo.
     - Descripción funcional.
     - Tipo de importación (Matrícula, Calificaciones, Expedientes, Pagos).
     - Entidad interna de destino.
     - Formato de archivo compatible (CSV, XLSX).
     - Fuente de datos, cuando corresponda.
     - Configuración de columnas (JSON estructurado).
     - Campo interno asociado a cada columna externa.
     - Reglas de transformación aplicables.
     - Formatos de fecha y números esperados.
     - Campos obligatorios.
     - Valores predeterminados permitidos.
     - Reglas de normalización.
     - Identificador primario utilizado para reconocer registros.
     - Política de actualización de registros existentes.
     - Versión del perfil.
     - Responsable y permisos de utilización.
     - Fecha de creación y modificación.
     - Estado: activo, inactivo u obsoleto.
  3. Configuración individual de correspondencias:
     - Identidad → Identificador del estudiante (Normalización de espacios y separadores).
     - Nombres → Nombres (Texto).
     - Apellidos → Apellidos (Texto).
     - Fecha Nacimiento → Fecha de nacimiento (Conversión de formato).
     - Grado → Grado académico (Resolución contra catálogo institucional).
     - Sección → Sección académica (Resolución según grado).
     - Correo → Correo electrónico (Validación de formato).
  4. Transformaciones controladas admitidas:
     - Eliminar espacios innecesarios (trim).
     - Normalizar mayúsculas y minúsculas.
     - Convertir fechas a formato ISO.
     - Normalizar identificadores oficiales.
     - Convertir valores equivalentes.
     - Resolver valores externos contra catálogos internos.
     - Aplicar valores predeterminados cuando la regla lo permita.
     - No permitir transformaciones que alteren silenciosamente identificadores o información sensible.
  5. Reutilización y administración:
     - Permitir guardar un perfil desde el proceso de importación.
     - Permitir seleccionar un perfil guardado antes de cargar un archivo.
     - Permitir modificar correspondencias antes de confirmar.
     - Permitir duplicar un perfil para crear variantes.
     - Permitir desactivar perfiles obsoletos sin borrar historiales.
     - Permitir perfiles privados y compartidos por rol.
     - Detectar diferencias en encabezados y solicitar ajustes cuando no sea seguro aplicarlo.
  6. Compatibilidad de versiones:
     - El perfil debe conservar su versión y las estructuras internas para las que fue diseñado.
     - Si cambian los campos internos, marcar perfiles incompatibles y solicitar migración sin aplicarlos automáticamente.
- **Cambios Necesarios:**
  1. Crear hoja `PerfilesMapeoColumnas`.
  2. Implementar funciones en backend (`saveMappingProfile`, `getMappingProfiles`, `deleteMappingProfile`).
  3. Integrar la selección de perfiles en el flujo existente de importación en frontend.
  4. Incorporar detección automática de encabezados y sugerencias de correspondencia.
  5. Integrar las reglas de transformación con `validateImportPreview`.
  6. Registrar el perfil y su versión en `AuditoriaMigraciones`.
  7. Incorporar controles de permisos y propiedad sobre los perfiles.
- **Comportamiento Esperado:**
  Un usuario autorizado debe poder configurar una importación una sola vez, guardar el mapeo y reutilizarlo posteriormente.
  Cuando se cargue un archivo compatible, el sistema debe recuperar las correspondencias y mostrar una vista previa. Si detecta columnas nuevas, ausentes o incompatibles, debe advertirlo antes de permitir la confirmación.
- **Criterios de Aceptación:**
  - [ ] Crear y guardar un perfil de mapeo con todas sus reglas.
  - [ ] Cerrar el proceso y recuperar el perfil posteriormente desde el catálogo.
  - [ ] Aplicar el perfil a un archivo con la misma estructura y verificar carga exitosa.
  - [ ] Comprobar que las correspondencias se recuperan correctamente.
  - [ ] Probar un archivo con columnas en distinto orden y verificar mapeo exacto por nombre.
  - [ ] Probar un archivo con encabezados modificados y verificar advertencias.
  - [ ] Comprobar que las columnas obligatorias sin correspondencia bloquean la importación.
  - [ ] Verificar que las transformaciones se aplican antes de la validación definitiva.
  - [ ] Comprobar que un perfil incompatible no se utiliza silenciosamente.
  - [ ] Verificar que los cambios estructurales generan una nueva versión secuencial del perfil.
  - [ ] Comprobar que las importaciones anteriores conservan la versión de perfil utilizada.
  - [ ] Verificar que los usuarios no pueden modificar perfiles fuera de sus permisos autorizados.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2992-3062; clave TASK-058; asignación única: Otros -->
### [TASK-058] [F25-Task03] [P0] [Validación de Datos - Detección Avanzada de Duplicados e Integridad Referencial]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - Hojas `AuditoriaMigraciones`, `Matriculas`, `ExpedientesEstudiantes`, `Usuarios`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** F25-002, F25-003 y F25-005. Reutiliza el importador y la vista previa.
- **Capacidades Relacionadas:** F25-004, F25-002, F25-005.
- **Problema que Resuelve:**
  La validación actual comprueba la presencia de un identificador obligatorio, pero no ofrece una detección suficientemente completa de colisiones por identidad, correo y otras referencias. Una importación puede contener estudiantes ya registrados, registros repetidos dentro del propio archivo o referencias a entidades académicas inexistentes.
- **Requisitos Funcionales:**
  1. Ampliar el proceso de validación previa para identificar coincidencias y conflictos antes de escribir información.
  2. Criterios de identificación según entidad:
     - Para estudiantes: identificador institucional, número de identidad (DNI), identificador externo, correo electrónico y combinaciones de campos.
     - Para docentes y usuarios: identificador institucional/laboral, correo electrónico, identificador externo y claves únicas.
     - No utilizar únicamente nombres y apellidos para fusionar registros.
  3. Clasificación estricta de coincidencias:
     - `Nuevo`
     - `Coincidencia exacta con un registro existente`
     - `Posible duplicado`
     - `Duplicado dentro del archivo`
     - `Conflicto entre identificadores`
     - `Registro incompleto`
     - `Registro con referencias inválidas`
     - `Registro apto para actualización`
  4. Mostrar qué campos produjeron la coincidencia en la vista previa.
  5. Políticas de tratamiento configurables por tipo de importación:
     - Crear únicamente registros nuevos.
     - Omitir registros existentes.
     - Actualizar campos autorizados.
     - Reemplazar campos seleccionados.
     - Enviar coincidencias ambiguas a revisión manual.
     - Rechazar registros que presenten conflictos.
     - No sobrescribir datos existentes por campos vacíos en el archivo importado.
  6. Validación de integridad referencial:
     - Grado académico existente y activo.
     - Sección perteneciente al grado indicado.
     - Período lectivo válido.
     - Asignatura perteneciente a la estructura curricular correspondiente.
     - Docente registrado y habilitado.
     - Responsable vinculado al expediente correcto.
     - Identificar referencias no resueltas antes de confirmar la importación.
- **Cambios Necesarios:**
  1. Ampliar la validación previa (`validateImportPreview`) para detectar colisiones en registros internos.
  2. Incorporar búsqueda de colisiones por identificadores, DNI y correo electrónico.
  3. Normalizar valores antes de compararlos (eliminación de guiones, espacios, mayúsculas).
  4. Implementar reglas de coincidencia por entidad.
  5. Incorporar políticas de creación, omisión y actualización.
  6. Incorporar validaciones de referencias académicas y administrativas.
  7. Integrar los resultados con la vista previa tabular.
  8. Registrar las coincidencias y decisiones en `AuditoriaMigraciones`.
- **Comportamiento Esperado:**
  La vista previa debe informar cuántos registros son nuevos, cuántos coinciden con registros existentes, cuántos presentan posibles duplicados y cuántos contienen referencias inválidas.
  Los casos ambiguos deben requerir una decisión explícita. El sistema no debe fusionar automáticamente expedientes cuando no exista certeza suficiente.
- **Criterios de Aceptación:**
  - [ ] Importar un registro nuevo y comprobar que se clasifica correctamente como nuevo.
  - [ ] Importar nuevamente el mismo registro y comprobar que no se duplica en el sistema.
  - [ ] Probar dos registros con el mismo nombre y diferentes identificadores sin fusionarlos.
  - [ ] Probar dos registros con el mismo identificador y nombres diferentes detectando conflicto.
  - [ ] Probar coincidencias por correo electrónico.
  - [ ] Probar identificadores con espacios, guiones y diferencias de formato verificando normalización.
  - [ ] Detectar duplicados que ocurran dentro del mismo archivo cargado.
  - [ ] Probar referencias a grados, secciones y asignaturas inexistentes y comprobar bloqueo.
  - [ ] Comprobar que las coincidencias ambiguas requieren revisión manual obligatoria.
  - [ ] Verificar que los campos vacíos no eliminan información existente sin una regla expresa.
  - [ ] Comprobar que un registro rechazado no modifica el expediente original.
  - [ ] Verificar que todas las decisiones quedan registradas en `AuditoriaMigraciones`.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3139-3194; clave TASK-061; asignación única: Otros -->
### [TASK-061] [F26-Task02] [P0] [Localización Regional - Centralizar el Formateo Regional de Moneda, Fechas, Horas y Números]
- **Componentes Afectados:**
  - `js/config.js`
  - `js/ui-common.js`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Subcapacidad Relacionada:** F26-001.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** `ConfiguracionSistema`, motor de precedencia de `F26-Task01`, frontend común, servicios académicos y financieros, exportaciones y calendarios.
- **Problema Detectado:**
  La plataforma almacena parámetros regionales, incluyendo zona horaria y moneda, pero algunos componentes del frontend siguen construyendo formatos manualmente. Se identificó el uso de concatenaciones como `"L. " + monto`. Esto produce diferencias de presentación, errores de interpretación numérica y posibles inconsistencias entre tablas, formularios, documentos, reportes y operaciones financieras.
- **Requisitos Funcionales:**
  1. Formateador regional único y universal:
     - Implementar una capa común de formato en frontend (`RegionalFormatter`) que consulte la configuración institucional efectiva y permita formatear: moneda, números enteros, decimales, porcentajes, fechas, horas, instantes combinados y duraciones.
     - Configurar: código de moneda (HNL), símbolo monetario (`L.`), separador decimal (punto o coma según configuración), separador de miles, cantidad de decimales (2 por defecto en finanzas), formato de fecha (`DD/MM/YYYY`), formato de hora (12h/24h), idioma regional (`es-HN`) y zona horaria (`America/Tegucigalpa`, GMT-6).
     - Utilizar mecanismos regionales estándar (`Intl.NumberFormat`, `Intl.DateTimeFormat`) evitando concatenaciones manuales ad-hoc.
  2. Moneda institucional estandarizada:
     - Distinguir entre código ISO (`HNL`), símbolo de presentación (`L.`), precisión decimal y formato visual.
     - El símbolo no debe sustituir al código de moneda en los datos internos; los cálculos deben operar sobre valores numéricos (`float`) puros.
  3. Interpretación controlada de números (parsing seguro):
     - Interpretar entradas ambiguas de usuarios (`1,250.50` vs `1.250,50`) según la configuración regional activa.
     - Solicitar corrección explícita ante entradas numéricas que no puedan resolverse de forma segura.
  4. Fechas y horas:
     - Utilizar la zona horaria institucional como referencia común.
     - Distinguir fechas sin hora (fechas de nacimiento, fechas de matrícula) de marcas temporales con instante (timestamps de auditoría en UTC).
     - Evitar conversiones que desplacen un día por diferencias de huso horario en fechas sin hora.
  5. Integración con hojas de cálculo y exportaciones:
     - No confundir valores numéricos con cadenas formateadas en Google Sheets; persistir tipos nativos y asignar formatos de celda.
     - Evitar que una exportación a CSV/XLSX convierta importes en texto por añadir símbolos monetarios manualmente.
- **Cambios Necesarios:**
  - Crear el módulo `RegionalFormatter` en `js/ui-common.js` o `js/config.js`.
  - Eliminar progresivamente las concatenaciones manuales de símbolos monetarios (`"L. " + monto`) en `accounting.js`, `reports.js`, `teacher.js` y `student.js`.
  - Sustituir formateadores locales incompatibles.
  - Conectar la capa de formato con la configuración institucional y su resolución jerárquica.
  - Adaptar tablas, tarjetas, formularios, documentos, reportes y componentes financieros.
  - Incorporar funciones de interpretación y validación de entradas numéricas en formularios.
  - Revisar las conversiones de fechas entre frontend, backend y hojas de cálculo.
- **Comportamiento Esperado:**
  Los mismos valores deben mostrarse de forma coherente en toda la plataforma. Cambiar el formato regional debe modificar la presentación, sin alterar cantidades, fechas ni datos históricos.
- **Criterios de Aceptación:**
  - [ ] Mostrar un mismo importe en diferentes módulos y comprobar que utiliza exactamente el mismo formato.
  - [ ] Cambiar la moneda institucional y comprobar la actualización coherente de los componentes correspondientes.
  - [ ] Comprobar que el valor numérico original en base de datos no cambia al modificar el formato visual.
  - [ ] Introducir números con coma y punto y verificar su interpretación correcta según la configuración regional.
  - [ ] Rechazar entradas ambiguas cuando no exista una interpretación segura.
  - [ ] Comprobar importes positivos, negativos, cero y valores con más decimales de los permitidos.
  - [ ] Comprobar fechas en formatos diferentes sin alterar su valor real almacenado.
  - [ ] Verificar fechas cercanas a medianoche en la zona horaria institucional sin desfasaje de días.
  - [ ] Comprobar que las fechas de eventos se muestran correctamente tras consultar los registros.
  - [ ] Exportar importes y fechas a hojas de cálculo y verificar que se conservan como datos tipados y no como cadenas de texto.
  - [ ] Confirmar que no quedan componentes relevantes utilizando formatos manuales incompatibles.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3195-3248; clave TASK-062; asignación única: Otros -->
### [TASK-062] [F26-Task05] [P0] [Caché y Sincronización - Implementar Invalidación Reactiva y Sincronización de Caché de Configuraciones]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `js/ui-common.js`
  - `js/config.js`
  - `js/api.js`
  - Hojas `ConfiguracionSistema`, `RegistroEventos`
- **Subcapacidad Relacionada:** F26-013.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** `ConfiguracionSistema`, `manageInstitutionalDataCache`, motor de precedencia (`F26-Task01`), sesiones de usuario y componentes frontend consumidores de configuración.
- **Problema Detectado:**
  Después de modificar parámetros en `ConfiguracionSistema`, los clientes pueden conservar valores antiguos en memoria local hasta que se cierre la sesión o se recargue la página. Esto puede ocasionar comportamientos contradictorios entre módulos y usuarios que utilizan configuraciones diferentes durante un mismo período de operación.
- **Requisitos Funcionales:**
  1. Identificación y señalización de cambios:
     - Toda modificación de configuración debe generar una señal verificable de actualización con marca de versión incremental y timestamp ISO.
     - Registrar parámetro modificado, ámbito afectado, versión nueva, fecha, usuario responsable y módulos dependientes.
  2. Versionado y detección de obsolescencia:
     - Mecanismo para comprobar si la configuración local del cliente sigue vigente comparando su versión con la versión central (`configVersion`).
     - Determinar si el cambio requiere una recarga completa de sesión o solo actualizar el componente local.
  3. Invalidación reactiva:
     - Al guardar en backend (`saveSystemConfiguration`), purgar inmediatamente la caché en servidor (`CacheService`).
     - Emitir respuesta con la nueva versión para que el cliente invalide su caché local (`localStorage` / memoria).
     - Evitar que una configuración antigua sobrescriba una versión más reciente.
  4. Caché diferenciada por ámbito:
     - Respetar la jerarquía de precedencia: un cambio global invalida a todos los ámbitos que lo heredan; un cambio departamental solo invalida las sesiones de esa unidad; una preferencia personal solo afecta al usuario emisor.
  5. Resiliencia y fallos de sincronización:
     - Si el cliente pierde conexión, no declarar sincronización exitosa; registrar error y reintentar al reconectar.
     - Para operaciones críticas, el servidor debe validar la versión vigente de la configuración antes de autorizar la acción.
  6. Gestión de concurrencia:
     - Detectar colisiones si dos administradores modifican configuraciones simultáneamente e informar del conflicto sin sobrescrituras ciegas.
- **Cambios Necesarios:**
  - Incorporar versionado de configuraciones y marcas de tiempo en `ConfiguracionSistema`.
  - Adaptar `manageInstitutionalDataCache` para soportar purga selectiva por clave y ámbito.
  - Integrar la invalidación automática en `saveSystemConfiguration`.
  - Incorporar verificación de versión de configuración en las llamadas periódicas de `api.js` / `ui-common.js`.
  - Implementar validación de versión en operaciones críticas de backend.
- **Comportamiento Esperado:**
  Cuando un administrador modifica un parámetro, los usuarios afectados reciben la configuración vigente sin depender de cerrar sesión o recargar manualmente la aplicación. Los cambios se propagan únicamente a los ámbitos correspondientes.
- **Criterios de Aceptación:**
  - [ ] Abrir dos sesiones concurrentes con usuarios diferentes.
  - [ ] Modificar una configuración institucional desde una sesión y comprobar que la otra sesión detecta el cambio y actualiza el valor.
  - [ ] Modificar una configuración departamental y comprobar que solo afecta al ámbito correspondiente sin alterar otros departamentos.
  - [ ] Modificar una preferencia personal y comprobar que no invalida configuraciones ajenas.
  - [ ] Simular un fallo de red durante la actualización y comprobar que el cliente no declara una sincronización exitosa.
  - [ ] Recuperar la conexión y comprobar que se obtiene la versión vigente del servidor.
  - [ ] Modificar simultáneamente un parámetro desde dos sesiones y comprobar que se detecta el conflicto de concurrencia.
  - [ ] Comprobar que un cliente con una versión antigua no puede sobrescribir silenciosamente una configuración nueva.
  - [ ] Verificar que la invalidación de caché no elimina datos de negocio ajenos a la configuración.
  - [ ] Comprobar que las cachés de los servicios dependientes se actualizan correctamente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3252-3311; clave TASK-064; asignación única: Otros -->
### [TASK-064] [F27-Task01] [P0] [Observabilidad Preventiva - Monitor Preventivo de Cuotas, Límites de Ejecución y Capacidad de Servicios GAS]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - Hojas `MonitoreoCuotasLimites`, `RegistroEventos`
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F27-001, F27-005, F27-007.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Observabilidad existente (`getServiceHealthDiagnostics`, `logStructuredEvent`).
- **Problema Detectado:**
  La plataforma dispone de mecanismos para consultar el estado de los servicios, comprobar conectividad y registrar errores. Sin embargo, no cuenta con un sistema preventivo que permita detectar cuándo el consumo de cuotas, las ejecuciones o las llamadas a servicios externos se aproximan a sus límites operativos. Actualmente, el sistema detecta errores cuando ya se han producido, sin anticipación suficiente para evitar interrupciones por agotamiento de `UrlFetchApp`, cuotas de Sheets/Drive/Mail, exceso de ejecuciones o límites de concurrencia.
- **Requisitos Funcionales:**
  1. Inventario centralizado de límites y cuotas operativas:
     - Registrar límites aplicables a: `UrlFetchApp`, Google Sheets, Google Drive, Google Mail (`MailApp`), Google Calendar, servicios de almacenamiento, APIs externas, ejecuciones simultáneas, tiempo máximo de ejecución (6 min), activadores programados y límites por usuario/proyecto.
     - Registrar para cada cuota: servicio, identificador de cuota, unidad de medida, límite aplicable según tipo de cuenta Google Workspace, período de reinicio (diario/horario), fuente de información, fecha de actualización, umbral de advertencia (80%), umbral crítico y estado de disponibilidad.
     - Si un límite no puede consultarse por API, registrarlo como valor configurado documentado indicando procedencia y fecha.
  2. Medición activa del consumo:
     - Registrar por solicitud: cantidad de llamadas, servicio utilizado, timestamp, componente emisor, usuario/contexto, tipo de operación, resultado, duración, consumo estimado, errores asociados y reintentos.
     - Contabilizar tanto solicitudes exitosas como fallidas (que también consumen cuota).
     - Agrupar métricas por servicio, endpoint/acción, componente, día, ventana temporal y proceso.
  3. Umbrales preventivos configurables:
     - Estados: `Normal`, `Advertencia` (al 80%), `Crítico` (configurable), `Límite alcanzado`.
     - Identificar claramente en la UI si la métrica es oficial de Google o estimada por el sistema.
  4. Proyección analítica de agotamiento:
     - Estimar tiempo hasta el agotamiento según consumo acumulado, velocidad reciente, horarios pico y tiempo restante hasta el reinicio.
  5. Alertas automáticas desduplicadas:
     - Disparar alertas tempranas al alcanzar el 80% y umbral crítico, o ante tendencias de agotamiento anticipado.
     - Agrupar alertas repetitivas de un mismo incidente para evitar saturación de notificaciones.
  6. Panel de consumo y capacidad en UI:
     - Vista administrativa filtrable por servicio y período con porcentaje de utilización, procesos con mayor consumo y alertas activas.
  7. Protección preventiva no destructiva:
     - Posponer procesos no críticos, agrupar operaciones o limitar procesamiento simultáneo ante riesgo inminente de agotamiento, sin bloquear operaciones académicas o financieras esenciales basadas en estimaciones imprecisas.
- **Cambios Necesarios:**
  - Ampliar el sistema de observabilidad en `developer-service` (`checkGoogleApiQuotaUsage`, `recordResourceConsumption`).
  - Crear hoja `MonitoreoCuotasLimites` para inventario y agregados de consumo.
  - Integrar contadores de consumo en llamadas `UrlFetchApp`, `SpreadsheetApp` y `DriveApp`.
  - Incorporar motor de cálculo de proyecciones y umbrales preventivos.
  - Integrar alertas tempranas con `RegistroEventos` y centro de notificaciones.
  - Crear vista de capacidad en el panel de desarrollador/administrador.
- **Comportamiento Esperado:**
  El sistema detecta anticipadamente condiciones de consumo anormal y permite que los responsables actúen antes de que una cuota provoque una interrupción.
- **Criterios de Aceptación:**
  - [ ] Cada servicio supervisado tiene identificados sus límites aplicables o la condición por la que no pueden determinarse.
  - [ ] Las operaciones instrumentadas generan métricas de consumo en tiempo real.
  - [ ] El sistema calcula la utilización respecto al límite correspondiente de forma matemática exacta.
  - [ ] Al alcanzar el 80% del límite configurado, se genera una advertencia preventiva estructurada.
  - [ ] Al alcanzar el umbral crítico, se genera una alerta de alta prioridad hacia los administradores.
  - [ ] Las alertas repetidas de un mismo incidente se agrupan o actualizan, evitando duplicaciones.
  - [ ] El panel administrativo permite identificar con claridad los servicios y operaciones que consumen más recursos.
  - [ ] Una métrica sin datos suficientes se identifica como desconocida, no como consumo cero.
  - [ ] La propia medición no genera una cantidad de llamadas que contribuya significativamente al agotamiento de cuotas.
  - [ ] Los mecanismos de protección no bloquean operaciones críticas por estimaciones no verificadas.
  - [ ] Se comprueba la procedencia y fecha de cada límite registrado.
  - [ ] Las alertas y métricas continúan funcionando tras una interrupción y recuperación del servicio.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3312-3371; clave TASK-065; asignación única: Otros -->
### [TASK-065] [F27-Task02] [P0] [Resiliencia y Concurrencia - Cola Persistente de Procesamiento Asíncrono, Reintentos Controlados y Circuit Breaker]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - Hojas `ColaTareasAsincronas`, `CircuitBreakerEstados`
  - `js/api.js`
- **Subcapacidades Relacionadas:** F27-005, F27-006, F27-008.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Idempotencia, registro estructurado, concurrencia (`LockService`) y supervisión de servicios.
- **Problema Detectado:**
  La plataforma dispone de mecanismos de fallback en determinadas operaciones de delegación interservicios, pero los reintentos de llamadas externas pueden ejecutarse dentro del hilo sincrónico de la solicitud original. Esto provoca que una operación del usuario permanezca esperando mientras el sistema intenta comunicarse repetidamente con un servicio secundario, consumiendo tiempo de ejecución, arriesgando timeouts de 6 minutos y saturando servicios con fallos temporales.
- **Requisitos Funcionales:**
  1. Cola persistente de tareas en hoja `ColaTareasAsincronas`:
     - Registrar por tarea: `tareaId`, tipo de operación, servicio destino, fecha creación, fecha última ejecución, número de intentos, máx intentos, próxima ejecución, prioridad, estado (`Pendiente`, `EnProceso`, `Completada`, `Reintentable`, `Fallida`, `Suspendida`, `RequiereIntervencion`, `Cancelada`), `solicitudIdOriginal`, payload mínimo y resultado/error.
     - Almacenamiento persistente en base de datos independiente de variables en memoria o duración de ejecución.
  2. Clasificación formal de operaciones:
     - Sincrónicas obligatorias: validación de permisos, confirmación de matrícula, verificación de cobro, lectura de datos indispensables.
     - Asíncronas diferibles: notificaciones multicanal, envío de correos, generación de reportes secundarios, sincronizaciones externas no urgentes.
  3. Desacoplamiento de la solicitud original:
     - Validar la solicitud principal, persistir la tarea secundaria en cola, confirmar almacenamiento y retornar respuesta inmediata al usuario.
  4. Motor centralizado de reintentos con retroceso exponencial:
     - Diferenciar errores temporales (red, timeouts) de permanentes (403, 400).
     - Retroceso exponencial con variación aleatoria (`jitter`), límite máximo de intentos y de tiempo de permanencia.
     - No reintentar indefinidamente ni reintentar errores permanentes de datos o credenciales.
  5. Patrón Circuit Breaker por dependencia externa:
     - Estados: `Cerrado` (operación normal), `Abierto` (suspensión de llamadas no esenciales ante fallos recurrentes), `Semiabierto` (pruebas controladas de recuperación).
     - Configuración aislada por dependencia para que la caída de un proveedor no afecte a los demás.
  6. Control de concurrencia y prevención de duplicados:
     - Evitar que dos ejecutores procesen la misma tarea con `LockService`.
     - Detectar y recuperar tareas abandonadas por interrupción de Apps Script.
  7. Panel de administración y gestión manual:
     - Vista de tareas pendientes, fallidas, reintentos y estado de circuitos con opción de reintento manual idempotente.
- **Cambios Necesarios:**
  - Crear hojas `ColaTareasAsincronas` y `CircuitBreakerEstados`.
  - Implementar middleware en backend (`enqueueAsyncTask`, `processAsyncTaskQueue`, `executeWithCircuitBreaker`).
  - Separar acciones secundarias en `user-service`, `accounting-service` y `academic-service`.
  - Integrar activador programado (`Time-driven trigger`) para procesar la cola en segundo plano.
  - Conectar con firmas de idempotencia (`getIdempotencyPayloadSignature`).
- **Comportamiento Esperado:**
  Una falla de un servicio secundario deja una tarea pendiente y permite que la operación principal continúe cuando sea seguro. La plataforma procesa las tareas posteriormente, controla los reintentos y suspende temporalmente llamadas a servicios con fallos repetidos.
- **Criterios de Aceptación:**
  - [ ] Una tarea asíncrona permanece almacenada persistentemente después de finalizar la solicitud HTTP original.
  - [ ] La solicitud principal no espera innecesariamente a que se completen operaciones secundarias (respuesta < 2s).
  - [ ] Una tarea conserva su identificador y estado durante todo su ciclo de vida.
  - [ ] Los errores temporales generan reintentos conforme a la política de retroceso exponencial.
  - [ ] Los errores permanentes no generan ciclos de reintentos indefinidos.
  - [ ] Un servicio con fallos repetidos activa su Circuit Breaker pasando a estado Abierto.
  - [ ] El circuito semiabierto permite pruebas controladas de recuperación.
  - [ ] La recuperación del servicio restablece el procesamiento de tareas pendientes.
  - [ ] Una tarea no puede ejecutarse simultáneamente por dos trabajadores concurrentes.
  - [ ] Una interrupción abrupta de la ejecución no pierde la tarea en cola.
  - [ ] Una tarea con resultado incierto se verifica antes de repetirse.
  - [ ] Las operaciones secundarias fallidas no invalidan una operación principal ya completada con éxito.
  - [ ] El panel administrativo muestra los estados y resultados reales de la cola y permite reintentos seguros.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3375-3439; clave TASK-067; asignación única: Otros -->
### [TASK-067] [F28-T01] [P0] Aislamiento Multiusuario, Contexto Institucional y Protección Criptográfica de Borradores Locales
- **Tipo:** Corrección de Seguridad e Integridad de Datos.
- **Componentes Afectados:**
  - `js/ui-common.js` (funciones de auto-guardado en `auditAndFixAccessibility` y gestión de borradores)
  - `js/teacher.js`, `js/student.js`, `js/accounting.js`
  - Almacenamiento local del navegador (`localStorage` / `IndexedDB`)
  - Módulos de autenticación y cierre de sesión (`logoutUser`, refresco de sesión)
- **Subcapacidades Relacionadas:** B01, B02, B03, B04, S04.
- **Estado de Partida:** Implementada parcialmente (Vulnerabilidad B03 detectada: claves planas `draft_${inp.id}` sin identificar usuario ni contexto).
- **Dependencias:** Mecanismo de autenticación, identificación de usuarios (`authUserId`), contexto institucional (`institucionId`), motor de almacenamiento local/IndexedDB.
- **Problema Detectado y Riesgos:**
  El sistema de guardado automático utiliza actualmente claves planas con la estructura `draft_${inp.id}` en `localStorage`. Esto no identifica al propietario del borrador. Cuando diferentes usuarios (docentes, secretaría, estudiantes o administradores) utilizan el mismo navegador o dispositivo físico institucional compartido (ej. tablets de aula, terminales de sala de profesores), un usuario subsiguiente podría visualizar, restaurar indebidamente o sobrescribir información confidencial ingresada por el usuario anterior (ej. calificaciones preliminares, actas disciplinarias o reportes de orientación estudiantil), provocando fuga grave de información y contaminación cruzada de datos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Identificación inequívoca del propietario y contexto institucional:*
     - Formatear obligatoriamente las claves de borrador con estructura modular y única:
       `draft_${institucionId}_${authUserId}_${formId}_${recordId}_${inp.id}` (o esquema objeto indexado equivalente en IndexedDB store `local_drafts`).
     - Parámetros obligatorios de aislamiento: ID del usuario autenticado (`authUserId`), ID de la institución/contexto institucional (`institucionId`), identificador del formulario (`formId`), identificador del registro en creación/edición (`recordId`), e identificador de sesión/pestaña si aplica.
     - Prohibición estricta: No utilizar jamás nombres visibles, alias o correos electrónicos como sustitutos del identificador interno único del usuario.
     - Si no existe una sesión autenticada válida, deshabilitar por completo la persistencia de borradores en disco local.
  2. *Estructura de almacenamiento y metadatos completos del borrador:*
     - Cada borrador debe almacenar una entidad con metadatos exhaustivos:
       - `propietarioId`: Identificador del usuario propietario.
       - `institucionId`: Contexto institucional activo.
       - `formId`: Identificador del formulario origen.
       - `recordId`: Registro relacionado (o `'new'` para altas).
       - `timestampCreacion`: Marca temporal ISO de creación inicial.
       - `timestampModificacion`: Marca temporal ISO de última modificación.
       - `versionBorrador`: Número secuencial de versión del borrador local.
       - `estadoGuardado`: `'guardando'`, `'guardado'`, `'error'`.
       - `estadoSincronizacion`: `'local'`, `'sincronizado'`, `'conflicto'`.
       - `campos`: Mapa asociativo de valores `{ [inputId]: valor }`.
     - Evitar colisiones entre formularios diferentes o instancias múltiples.
  3. *Recuperación selectiva y validación contextual:*
     - Al cargar un formulario, buscar y restaurar exclusivamente borradores cuyos metadatos coincidan exactamente con el `authUserId` y el `institucionId` de la sesión activa.
     - Ignorar e impedir la lectura de datos pertenecientes a otros usuarios o contextos.
     - Validación de vigencia: Comprobar que el usuario conserve permisos activos para acceder al registro y evitar restaurar borradores correspondientes a registros que ya fueron confirmados en el servidor, consolidados o eliminados.
     - Presentar diálogo de restauración controlada: Permitir al usuario identificar borradores recuperables (con fecha y hora legible) o descartarlos limpiamente.
  4. *Gestión ante cambio de usuario y cierre de sesión:*
     - Al cerrar sesión (`logoutUser`) o por expiración de token de sesión:
       - **Opción Configurable en Plataforma:** Política de conservación de borradores locales configurable a nivel de sistema o perfil de usuario:
         a) *Modo Estricto / Dispositivo Compartido:* Purga inmediata y segura de todos los borradores locales asociados al `authUserId` que cierra sesión.
         b) *Modo Dispositivo Personal / Privado:* Conservación cifrada de borradores asociados al usuario, manteniéndolos estrictamente aislados y bloqueados para cualquier otra cuenta que inicie sesión en el navegador.
       - Si existen operaciones pendientes no sincronizadas en cola (`sync_queue`), advertir explícitamente al usuario antes del cierre para evitar pérdida de trabajo y ofrecer opción de forzar sincronización.
       - Evitar que una transición de cuenta durante eventos de escritura en segundo plano asigne datos al usuario entrante.
  5. *Protección y cifrado de información sensible:*
     - Prohibición absoluta de almacenar contraseñas, tokens de autenticación (JWT/Bearer), datos bancarios confidenciales o credenciales en borradores locales.
     - Implementar ofuscación/cifrado ligero del lado del cliente (ej. Web Crypto API con clave derivada de sesión) para campos marcados como confidenciales (`data-sensitive="true"`).
     - Entender que el cifrado en cliente no sustituye la autorización y validación del servidor.
     - Suprimir volcado de valores de borradores en registros de consola de depuración (`console.log`).
  6. *Indicador visual de estado de borrador:*
     - Mostrar etiqueta o tooltip discreto en la barra de herramientas o pie de formulario indicando: "Borrador guardado localmente para tu usuario" junto a la marca temporal formateada y estado de persistencia.
- **Criterios de Aceptación:**
  - [ ] Dos cuentas de usuario diferentes que utilicen el mismo equipo/navegador no comparten ni pueden visualizar los borradores del otro.
  - [ ] Dos formularios diferentes del mismo usuario conservan borradores aislados e independientes sin colisiones.
  - [ ] Dos registros diferentes dentro de una misma entidad no mezclan información de recuperación.
  - [ ] Al cambiar de usuario, la interfaz no presenta datos ni campos pre-rellenados de la sesión previa.
  - [ ] Los borradores pendientes legítimos no se eliminan silenciosamente sin confirmación o sin política de conservación documentada.
  - [ ] La manipulación manual de identificadores en el almacenamiento local del navegador (`localStorage`/`IndexedDB`) no permite vulnerar la seguridad ni restaurar datos sin sesión activa coincidente.
  - [ ] La restauración de un borrador no altera de forma automática los registros oficiales en la base de datos hasta que el usuario envíe formalmente el formulario.
  - [ ] Se verifica el comportamiento correcto en escenarios de pestañas múltiples y sesiones concurrentes.
  - [ ] Se mantiene total compatibilidad retroactiva con los formularios que ya invocan `auditAndFixAccessibility`.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3490-3535; clave TASK-069; asignación única: Otros -->
### [TASK-069] [F29-Task02] [P0] Motor de Validación Integral y Control de Calidad de Datos
- **Orden de Ejecución:** 2
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportPreview`, `validateStagedImportBatch`)
  - `backend/academic-service/Code.gs`
  - Hoja: `AuditoriaMigracionesDetalle`
  - `js/teacher.js`, `js/accounting.js` (UI de previsualización de errores)
- **Subcapacidades Relacionadas:** F29-02, F29-04, F29-11.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task01].
- **Problema Detectado y Riesgos:**
  La validación actual comprueba principalmente la presencia de identificadores y algunos requisitos estructurales básicos. No detecta de manera suficiente duplicados existentes en base institucional, inconsistencias entre entidades, valores fuera de rango (ej. notas > 100), relaciones inválidas ni incompatibilidades con las reglas académicas y administrativas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  Implementar tres niveles complementarios de validación antes de persistir cualquier registro:
  1. *Nivel A: Validación Estructural:*
     - Formato esperado (CSV, XLSX, JSON). Columnas obligatorias presentes, encabezados duplicados, nombres ambiguos.
     - Identificar filas vacías, registros incompletos, columnas inesperadas, tipos de datos, longitudes, rangos y caracteres ilegibles/codificación UTF-8.
     - Fechas imposibles, números mal formados y valores monetarios inválidos en Lempiras.
  2. *Nivel B: Validación de Identidad:*
     - Identificadores repetidos dentro del archivo. Comparación contra registros existentes en base institucional.
     - Consulta a `CorrespondenciaIdentificadores` para reconocer registros ya migrados. Detección de homónimos y conflictos entre fuentes.
     - Evitar sobreescrituras silenciosas de datos institucionales válidos.
  3. *Nivel C: Validación Relacional y de Reglas de Negocio:*
     - Matrículas asociadas a estudiantes existentes; compatibilidad de grado, curso, sección, modalidad y ciclo académico.
     - Asignaturas correspondientes al nivel y grado; calificaciones respetando la escala y reglas del período de origen.
     - Pagos asociados a estudiantes, responsables o cargos existentes; documentos vinculados a expediente real.
     - Relaciones de empleados, cargos, departamentos y nómina; consistencia de fechas (matrícula, traslado, retiro, promoción).
     - Detección de relaciones circulares, huérfanas o contradictorias.
  4. *Clasificación y exportación de incidencias:*
     - Clasificar incidencias por severidad: `ERROR_BLOQUEANTE`, `ADVERTENCIA_CORREGIBLE`, `DIFERENCIA_ACEPTABLE`.
     - Mostrar registro, campo, valor recibido y regla incumplida; sugerir correcciones seguras.
     - Exportar el detalle completo de incidencias para corrección externa y posterior reimportación.
- **Criterios de Aceptación:**
  - [ ] Detecta identificadores duplicados dentro del archivo y contra la base institucional.
  - [ ] Detecta calificaciones fuera de la escala correspondiente (0-100 o escala de origen).
  - [ ] Detecta asignaturas incompatibles con el grado o ciclo.
  - [ ] Detecta matrículas, pagos y documentos con referencias inexistentes.
  - [ ] Diferencia errores bloqueantes de advertencias.
  - [ ] Permite consultar y exportar el detalle completo de incidencias en CSV/Excel.
  - [ ] Una fila inválida no se incorpora silenciosamente a los registros definitivos.
  - [ ] Las reglas pueden aplicarse a distintas fuentes sin duplicar código.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3536-3567; clave TASK-070; asignación única: Otros -->
### [TASK-070] [F29-Task04] [P0] Área de Preparación de Datos (Staging) y Aislamiento de Importaciones
- **Orden de Ejecución:** 4
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`stageIncomingDataBatch`, `commitStagedBatch`, `discardStagedBatch`)
  - Hoja: `StagingMigracionRegistros`, `StagingMigracionLotes`
- **Subcapacidades Relacionadas:** F29-02, F29-04, F29-11.
- **Estado de Partida:** Defectuosa.
- **Dependencias Principales:** [F29-Task02], [F29-Task03].
- **Problema Detectado y Riesgos:**
  La recepción y procesamiento actual trabajan directamente con los datos recibidos en memoria o impactando hojas de producción, sin un área de preparación aislada. Esto genera riesgos graves de escrituras parciales ante caídas de conexión y dificulta revisar o corregir los datos antes de su confirmación definitiva.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Estructura independiente de Staging:*
     - Almacenar temporalmente los registros recibidos asignando un `ejecucionId` único (`MIG-STAGE-xxx`).
     - Registrar metadatos: fuente origen, archivo recibido, usuario responsable, fecha recepción, tipo entidad, perfil mapeo, versión reglas, estado validación (`PENDIENTE`, `VALIDADO_CON_ERRORES`, `LISTO_PARA_APROBACION`, `CONFIRMADO`, `DESCARTADO`).
  2. *Aislamiento absoluto respecto a producción:*
     - Mantener los registros preparados en tablas de staging separadas; una importación fallida o pendiente no toca tablas institucionales definitivas.
  3. *Operaciones sobre el área de preparación:*
     - Consultar, revisar, corregir y descartar lotes completos antes de confirmar.
     - Permitir reanudar importaciones interrumpidas sin duplicar registros confirmados.
     - Cancelar ejecuciones limpiamente sin dejar residuos en producción.
     - Controles de acceso RBAC estrictos para consultar o aprobar datos en staging.
- **Criterios de Aceptación:**
  - [ ] Una importación recibida en staging no altera registros institucionales antes de su confirmación.
  - [ ] Es posible auditar el conjunto completo de registros preparados en la hoja de staging.
  - [ ] Una ejecución interrumpida puede reanudarse sin duplicar registros.
  - [ ] Una ejecución cancelada no deja modificaciones parciales en producción.
  - [ ] Las importaciones de diferentes usuarios o fuentes permanecen aisladas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3674-3705; clave TASK-074; asignación única: Otros -->
### [TASK-074] [F29-Task10] [P0] Modo de Simulación Integral (Dry-Run) sin Escrituras en Producción
- **Orden de Ejecución:** 10
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`executeMigrationPipeline`)
  - `backend/academic-service/Code.gs`
  - Hoja: `AuditoriaMigraciones`
  - `js/teacher.js`, `js/accounting.js` (selector de simulación en interfaz)
- **Subcapacidades Relacionadas:** F29-02, F29-04, F29-11.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task02], [F29-Task03], [F29-Task04].
- **Problema Detectado y Riesgos:**
  No existe un modo de simulación que ejecute el pipeline completo de recepción, mapeo, transformación, validación y conciliación sin modificar las tablas institucionales definitivas, obligando a realizar pruebas que ensucian la base de datos de producción.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Parámetro global `dryRun: true`:*
     - Ejecutar el 100% de las transformaciones y validaciones sobre los datos en staging.
     - Simular correspondencias de identificadores, relaciones académicas, consecuencias financieras y cálculo de saldos.
  2. *Garantía de inmutabilidad en producción:*
     - Asegurar que la simulación no modifique hojas definitivas, calificaciones, saldos ni usuarios.
  3. *Informe pre-migración y comparabilidad:*
     - Generar matriz detallada: registros nuevos, actualizaciones, duplicados, conflictos y rechazos.
     - Permitir comparar diferentes configuraciones de mapeo sobre el mismo archivo.
     - La confirmación definitiva posterior debe utilizar exactamente el mismo conjunto de datos y versión de reglas validadas en la simulación; cualquier cambio en el archivo invalida la aprobación anterior.
- **Criterios de Aceptación:**
  - [ ] Una simulación completa no inserta ni modifica una sola fila en tablas de producción.
  - [ ] El informe de simulación detalla registros aceptados, rechazados, actualizaciones y conflictos.
  - [ ] La confirmación real solo se habilita tras una simulación exitosa sin errores bloqueantes.
  - [ ] Los resultados de la simulación son reproducibles con el mismo archivo y reglas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3706-3737; clave TASK-075; asignación única: Otros -->
### [TASK-075] [F29-Task13] [P0] Conciliación Integral Cuantitativa y Cualitativa entre Origen y Destino
- **Orden de Ejecución:** 13
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`executeComprehensiveMigrationReconciliation`, `generateReconciliationActPDF`)
  - `backend/academic-service/Code.gs`
  - Hoja: `ConciliacionesMigracion`
- **Subcapacidades Relacionadas:** F29-12, F29-19.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task05], [F29-Task06].
- **Problema Detectado y Riesgos:**
  Las funciones actuales concilian inconsistencias internas en Sheets, pero no comparan sistemáticamente los datos del archivo origen contra lo efectivamente insertado en destino, imposibilitando certificar la integridad de la migración ante directores y auditores.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Comparación cuantitativa y cualitativa:*
     - Comparar recuentos: filas originales, válidas, rechazadas, insertadas, actualizadas y omitidas.
     - Comparar sumatorias monetarias (débitos, créditos, saldos, cobros) por estudiante, responsable y cuenta.
     - Comparar promedios de calificaciones y recuentos de matrículas, asignaturas y documentos.
     - Detectar registros presentes en origen y ausentes en destino, y viceversa.
  2. *Clasificación de discrepancias y tolerancias:*
     - Diferenciar discrepancias explicadas de discrepancias no resueltas.
     - Exigir coincidencia matemática exacta (diferencia L 0.00 en saldos iniciales y 0% error en notas).
  3. *Acta formal de conciliación en PDF:*
     - Emitir acta descargable con resumen cuantitativo, lista de diferencias justificadas y firmas digitales de responsables.
- **Criterios de Aceptación:**
  - [ ] Los totales de origen y destino pueden compararse por entidad y categoría.
  - [ ] Las diferencias se desglosan hasta el nivel del registro individual afectado.
  - [ ] No se declara conciliada una migración con diferencias críticas sin resolver.
  - [ ] Se emite un acta descargable auditable y reproducible.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3738-3763; clave TASK-076; asignación única: Otros -->
### [TASK-076] [F29-Task14] [P0] Pruebas Automáticas de Integridad y Funcionamiento Posterior a la Migración (Smoke Tests)
- **Orden de Ejecución:** 14
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`runPostMigrationSmokeTests`)
  - Suite de regresión general
- **Subcapacidades Relacionadas:** F29-13.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task05], [F29-Task06], [F29-Task07], [F29-Task08], [F29-Task13].
- **Problema Detectado y Riesgos:**
  Una migración puede completar la inserción en tablas pero dejar registros con punteros nulos o formatos que hagan fallar los boletines, estados de cuenta o dashboards en las operaciones cotidianas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  Batería de pruebas automatizadas sobre una muestra aleatoria de registros migrados:
  1. *Integridad académica:* Consultar expedientes de alumnos migrados, emitir boletines de ciclos históricos, verificar que las notas históricas no se recalculen.
  2. *Integridad financiera:* Generar estados de cuenta, verificar saldos iniciales y confirmar ausencia de cargos duplicados.
  3. *Integridad documental y de cuentas:* Abrir documentos migrados en Drive, verificar permisos y validar activación de cuentas.
  4. *Operatividad general:* Confirmar que los procesos habituales no fallen por datos nulos o relaciones ausentes.
- **Criterios de Aceptación:**
  - [ ] La batería de pruebas posterior genera un informe detallado de resultados.
  - [ ] Cualquier fallo crítico en los tests de humo bloquea la aprobación de la migración.
  - [ ] Boletines y estados de cuenta se generan sin errores para los registros migrados.
  - [ ] La suite general existente continúa aprobando sus 53 pruebas al 100%.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3797-3827; clave TASK-078; asignación única: Otros -->
### [TASK-078] [F29-Task22] [P0] Rollback Operativo con Conservación y Exportación de Transacciones Posteriores al Corte
- **Orden de Ejecución:** 22
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`restoreSystemBackup`, `executeEmergencyCutoverRollback`)
  - `backend/accounting-service/Code.gs` (`exportPostCutoverDeltaTransactions`)
  - `backend/developer-service/Code.gs`
- **Subcapacidades Relacionadas:** F29-15, F29-16, F29-17.
- **Estado de Partida:** Defectuosa.
- **Dependencias Principales:** [F29-Task01], [F29-Task06], [F29-Task13], [F29-Task21].
- **Problema Detectado y Riesgos:**
  Restaurar una copia de seguridad tras varios días de operación productiva eliminaría todas las matrículas, cobros y calificaciones registradas en la nueva plataforma, perdiendo datos financieros y académicos irrecuperables.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Registro y extracción delta post-corte (`exportPostCutoverDeltaTransactions`):*
     - Rastrear todas las transacciones ocurridas con posterioridad a la fecha/hora de corte ($T_0$).
     - Generar paquete descargable en CSV/JSON con altas, modificaciones, pagos, abonos, matrículas y calificaciones.
  2. *Preservación de relaciones y dependencias:*
     - Exportar en orden causal respetando dependencias (ej. alumno creado antes de su matrícula o cobro).
     - Identificar operaciones que no tengan equivalencia en el sistema anterior para revisión manual.
     - Informe de impacto y consecuencias del rollback.
  3. *Protocolo formal de reversión:*
     - Poner plataforma nueva en solo lectura, generar exportación delta y emitir acta de reversión con causas y autorizaciones.
- **Criterios de Aceptación:**
  - [ ] Se exportan el 100% de las transacciones generadas tras el corte sin duplicados.
  - [ ] Los registros exportados conservan identificadores y relaciones íntegras.
  - [ ] Se emite un informe de operaciones no transferibles.
  - [ ] No se considera rollback operativo completo si no se rescatan las transacciones posteriores.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3828-3855; clave TASK-079; asignación única: Otros -->
### [TASK-079] [F29-Task23] [P0] Fortalecimiento de Respaldos, Recuperación y Medición de Métricas RPO/RTO
- **Orden de Ejecución:** 23
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`createSystemBackup`, `restoreSystemBackup`, `measureRecoveryMetrics`)
  - Google Drive / Carpeta de respaldos del sistema
- **Subcapacidades Relacionadas:** F29-16.
- **Estado de Partida:** Completa y verificada.
- **Dependencias Principales:** [F29-Task21], [F29-Task22].
- **Problema Detectado y Riesgos:**
  La creación y restauración de respaldos funciona, pero la recuperación requiere intervención manual con clave fija `"RESTORE-CONFIRMED"` y no existe medición automatizada de objetivos de recuperación (RPO y RTO).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Medición automatizada de RPO y RTO:*
     - RPO: Antigüedad de la información respaldada y volumen de pérdida potencial ante contingencia.
     - RTO: Medir el tiempo real de restauración desde el inicio del proceso hasta la validación de integridad.
  2. *Autorización contextual y verificación criptográfica:*
     - Sustituir clave fija por autorización contextual con firma del Administrador y token temporal.
     - Verificar hash de integridad antes de iniciar cualquier restauración.
     - Conservar la protección existente de inalterabilidad de notas históricas (`preserveHistoricGrades`).
- **Criterios de Aceptación:**
  - [ ] Se conserva la creación de respaldos íntegros con hash SHA-256.
  - [ ] Se calculan y registran los tiempos reales de RPO y RTO.
  - [ ] Se ejecutan pruebas de restauración en entorno controlado sin afectar producción.
  - [ ] Las restauraciones críticas exigen autorización contextual verificable.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3917-3974; clave TASK-083; asignación única: Otros -->
### [TASK-083] [F30-Task02] [P0] Motor de Integridad Referencial Cruzada y Gestión de Registros Huérfanos
- **Orden de Ejecución:** 1
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`auditCrossSheetReferentialIntegrity`, `repairOrphanedRecordRelationships`, `configureReferentialIntegrityRules`)
  - Hoja: `AuditoriaIntegridadReferencial`, `ConfiguracionIntegridad`
- **Subcapacidades Relacionadas:** F30-02, F30-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-02).
- **Problema Detectado y Riesgos:**
  Google Sheets no impone de forma nativa restricciones de claves foráneas ni reglas de eliminación en cascada. La integridad depende de validaciones implementadas en los servicios y de que las modificaciones se realicen mediante los procedimientos oficiales. Existe riesgo severo de registros huérfanos cuando una identidad, expediente o relación se archiva, modifica o elimina sin actualizar las referencias dependientes.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Motor centralizado de validación de integridad referencial:*
     - Comprobar relaciones obligatorias y opcionales entre entidades institucionales:
       - Usuarios y expedientes de estudiantes (`Usuarios` $\leftrightarrow$ `ExpedientesEstudiantes`).
       - Usuarios y expedientes laborales (`Usuarios` $\leftrightarrow$ `ExpedientesLaborales`).
       - Estudiantes y matrículas (`ExpedientesEstudiantes` $\leftrightarrow$ `MatriculasEstudiantes`).
       - Estudiantes y relaciones familiares (`ExpedientesEstudiantes` $\leftrightarrow$ `RelacionesFamiliares`).
       - Estudiantes y cargos financieros (`ExpedientesEstudiantes` $\leftrightarrow$ `CargosEstudiante`).
       - Docentes y asignaciones académicas (`Usuarios`/`Docentes` $\leftrightarrow$ `AsignacionesDocentes`).
       - Compras y órdenes de compra (`SolicitudesCompra` $\leftrightarrow$ `OrdenesCompra`).
       - Órdenes de compra y recepciones (`OrdenesCompra` $\leftrightarrow$ `RecepcionesCompra`).
       - Recepciones e inventario (`RecepcionesCompra` $\leftrightarrow$ `InventariosKardex`).
       - Pagos y cargos (`PagosEstudiante` $\leftrightarrow$ `CargosEstudiante`).
       - Movimientos contables y documentos de origen (`LibroDiarioAsientos` $\leftrightarrow$ `DocumentosOrigen`).
       - Préstamos de biblioteca y ejemplares (`BibliotecaPrestamos` $\leftrightarrow$ `BibliotecaEjemplares`).
       - Asignaciones de transporte y estudiantes (`TransporteAsignaciones` $\leftrightarrow$ `ExpedientesEstudiantes`).
  2. *Detección exhaustiva de anomalías:*
     - Referencias inexistentes o rotas.
     - Identificadores duplicados.
     - Relaciones incompletas.
     - Registros que apuntan a entidades archivadas indebidamente.
     - Entidades sin relaciones obligatorias.
     - Relaciones contradictorias entre hojas.
  3. *Reglas de integridad configurables por tipo de relación:*
     - Tipologías: Obligatoria, Opcional, Uno a uno (1:1), Uno a varios (1:N), Varios a varios (N:M).
     - Relación Histórica: Inmutable y conservada aunque cambie el estado operativo de la entidad relacionada.
     - Si surge discrepancia sobre la severidad de una relación, habilitar parámetro configurable en la plataforma (`ESTRICTA_BLOQUEANTE` vs `PERMISIVA_AUDITABLE`).
  4. *Modos de ejecución y reportes:*
     - Ejecución bajo demanda y revisiones programadas automáticas.
     - Informe estructurado: identificador del registro, entidad afectada, relación esperada, referencia encontrada y gravedad (`CRITICA`, `ADVERTENCIA`).
     - Las validaciones diagnósticas no modifican datos en modo lectura.
  5. *Mecanismos de corrección controlada:*
     - Proponer la relación correcta cuando exista evidencia identificable.
     - Permitir corrección autorizada por el usuario competente, registrando valor anterior y nuevo en bitácora.
     - Prohibir terminantemente reparaciones automáticas destructivas o ambiguas.
     - Impedir que la baja de una entidad con dependencias destruya información histórica: utilizar archivado, desactivación o baja lógica.
     - En operaciones masivas de modificación, comprobar previamente las dependencias y previsualizar los efectos colaterales.
- **Criterios de Aceptación:**
  - [ ] Se detectan referencias inexistentes y duplicadas en el 100% de las entidades evaluadas.
  - [ ] Se identifican correctamente los registros dependientes antes de archivar o desactivar una entidad.
  - [ ] Las validaciones no modifican datos durante una ejecución de diagnóstico.
  - [ ] Las reparaciones autorizadas dejan un registro de auditoría completo con valor previo y posterior.
  - [ ] Las relaciones históricas se conservan tras cambios de grado, sección, rol, estado laboral o situación administrativa.
  - [ ] Una ejecución repetida produce resultados consistentes y no introduce nuevas inconsistencias.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4097-4131; clave TASK-087; asignación única: Otros -->
### [TASK-087] [F30-Task05] [P0] Asistente de Simulación de Impacto Previo a la Restauración de Respaldos (Dry-Run)
- **Orden de Ejecución:** 5
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`previewBackupRestoreImpact`, `compareBackupDiffWithLiveSpreadsheet`, `executeSelectiveRestoreWithIntegrity`)
  - Hoja: `SimulacionesRestauracion`
- **Subcapacidades Relacionadas:** F30-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-08).
- **Problema Detectado y Riesgos:**
  El mecanismo actual restaura hojas completas directamente tras ingresar el token `"RESTORE-CONFIRMED"`, sin brindar una previsualización detallada del impacto. Una restauración accidental puede sobrescribir transacciones recientes, revertir calificaciones cerradas o desvincular relaciones operativas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Simulación de restauración (Dry-Run sin efectos secundarios):*
     - Comparar hoja por hoja el archivo de respaldo seleccionado contra la base viva de Google Sheets sin alterar datos.
     - Resumen cuantitativo y cualitativo: registros idénticos, registros existentes solo en el respaldo, registros existentes solo en el estado actual, registros modificados, colisiones de IDs y dependencias rotas.
  2. *Alcance del análisis de impacto:*
     - Evaluar efectos sobre: Matrículas, Calificaciones, Expedientes, Cargos, Pagos, Asientos Contables, Planillas, Inventario, Usuarios, Relaciones Familiares y Parámetros Institucionales.
     - Mostrar advertencias explícitas sobre datos que se perderían, recuperarían o sobrescribirían.
     - Comprobación de compatibilidad de esquemas entre el backup y la versión actual de la base de datos.
  3. *Restauración selectiva controlada y salvaguardas:*
     - Permitir restauración selectiva por conjunto de datos solo si no se vulnera la integridad referencial.
     - Parámetro configurable para la protección de notas históricas (`PRESERVAR_CALIFICACIONES_HISTORICAS_EN_RESTORE`).
     - Validación de integridad de archivo: hashes SHA-256, estructura JSON y metadatos del backup.
     - Requerir confirmación reforzada y crear obligatoriamente un respaldo del estado vivo inmediatamente antes de aplicar la restauración definitiva.
     - Ejecutar suite de integridad referencial posterior al proceso de recuperación.
- **Criterios de Aceptación:**
  - [ ] La simulación se ejecuta sin modificar ninguna celda o documento vivo.
  - [ ] Se identifican con precisión matemática registros agregados, eliminados y modificados.
  - [ ] Se detectan conflictos de identificadores y advertencias por sobrescritura de transacciones posteriores.
  - [ ] Se genera automáticamente un respaldo previo al inicio de cualquier restauración definitiva.
  - [ ] La restauración queda auditada y es seguida por chequeos de integridad referencial automáticos.
  - [ ] Se comprueba la respuesta controlada ante una restauración fallida y su protocolo de contingencia.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4170-4217; clave TASK-089; asignación única: Otros -->
### [TASK-089] [F30-Task17] [P0] Ampliación de Pruebas Automatizadas End-to-End y Cobertura de Fallos Interdepartamentales
- **Orden de Ejecución:** 7
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs` (`runEndToEndInterdepartmentalRegressionSuite`)
- **Subcapacidades Relacionadas:** F30-14, F30-01.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección D (INT-01 a INT-16) y Sección H.
- **Problema Detectado y Riesgos:**
  Aunque existen 53 pruebas pasando, la auditoría evidenció que las pruebas actuales se concentran en lógica unitaria de evaluación y asistencia, mientras que los recorridos completos interdepartamentales (INT-01 a INT-16) presentan una cobertura de fallo, recuperación y concurrencia que debe ser automatizada y sistematizada para evitar regresiones invisibles en producción.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Cobertura automatizada de los 16 recorridos interdepartamentales (INT-01 a INT-16):*
     - INT-01: Admisión y Matrícula Completa con generación de cargos arancelarios.
     - INT-02: Cambio de Grado/Sección con preservación de historial de calificaciones.
     - INT-03: Registro, revisión de actas, cierre y publicación de calificaciones ponderadas.
     - INT-04: Registro de asistencia, deduplicación atómica y despacho de alertas tempranas.
     - INT-05: Confirmación de pago, comprobante fiscal SAR y asiento contable por partida doble.
     - INT-06: Anulación de pago, reversión contable y reactivación de saldo en cargo.
     - INT-07: Contratación de personal, habilitación de usuario RBAC y alta en nómina salarial.
     - INT-08: Modificación de roles y revocación inmediata de sesiones activas.
     - INT-09: Solicitud, validación presupuestaria y aprobación jerárquica de compras (> L 50,000).
     - INT-10: Recepción de mercancía física, actualización de Kardex y cuenta por pagar.
     - INT-11: Procesamiento de planilla con deducciones hondureñas (IHSS/RAP/ISR) y pólizas contables.
     - INT-12: Emisión y cuadre de reportes institucionales contra fuentes transaccionales.
     - INT-13: Emisión de constancias con CUV y descarga autenticada con tokens firmados.
     - INT-14: Notificación multicanal con clave de deduplicación y control de entrega.
     - INT-15: Recuperación idempotente ante interrupciones de red sin duplicidad de datos.
     - INT-16: Despliegue seguro con validación previa de contratos y chequeos de salud.
  2. *Escenarios obligatorios de fallo, concurrencia y estrés:*
     - Fallo en etapa intermedia con verificación de compensación.
     - Reintentos con payloads idénticos para confirmar idempotencia.
     - Solicitudes concurrentes sobre el mismo estudiante o cuenta.
     - Pérdida de conexión tras confirmación en backend.
     - Permisos revocados en mitad de una transacción.
     - Ejecución sobre datos sintéticos aislados sin alterar tablas de producción.
  3. *Generación de reportes de ejecución:*
     - Detallar: prueba, resultado esperado, resultado observado, duración, versión evaluada y estado.
     - Prohibir que la suite reporte éxito si se omiten pruebas obligatorias.
- **Criterios de Aceptación:**
  - [ ] Los 16 recorridos integrales cuentan con pruebas automatizadas ejecutables en Node.js y Apps Script.
  - [ ] Cada proceso crítico cuenta con casos de prueba de fallo y compensación verificados.
  - [ ] Se verifica la ausencia de duplicados ante solicitudes repetidas.
  - [ ] Los resultados de las pruebas se vinculan formalmente al identificador de versión desplegada.
  - [ ] La suite se ejecuta en un entorno aislado sin corromper la base de datos real.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4942-4989; clave TASK-109; asignación única: Otros -->
### [TASK-109] [F35-Task01] [P0] Reconocimiento de archivos, detección de estructura y configuración de origen
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 1 (Lectura estructural de archivos base)
- **Componentes Afectados:**
  - `teacher-dashboard.html`: biblioteca SheetJS y modal `#modal-excel-importer`
  - `js/teacher.js`: controlador de carga y lectura mediante `FileReader`, `XLSX.read` y `sheet_to_json`
  - `backend/accounting-service/Code.gs` (`validateImportPreview`, `parseSpreadsheetMetadata`)
- **Subcapacidades Relacionadas:** F35-01, F35-02, F35-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-01, F35-02, F35-05), Matriz CAR-F35-01, CAR-F35-02 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El importador utiliza SheetJS para leer archivos, pero selecciona automáticamente la primera hoja y presupone rígidamente que los encabezados están en la primera fila. No permite elegir hojas, identificar encabezados desplazados ni delimitar las filas y columnas que deben procesarse. Tampoco existe una comprobación suficientemente estricta del archivo antes de analizarlo, generando columnas `__EMPTY` y datos desfasados ante archivos reales con membretes o notas institucionales.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Selección de hojas y análisis de metadatos:*
     - Ampliar la lectura para que el usuario pueda seleccionar la hoja que desea importar cuando el archivo contenga varias.
     - Mostrar los nombres de las hojas disponibles, su cantidad aproximada de filas y columnas y una pequeña muestra de contenido.
     - Detectar automáticamente la fila probable de encabezados mediante el análisis de valores y estructura, sin asumir que corresponde a la primera fila.
  2. *Delimitación y configuración manual de rangos:*
     - Permitir seleccionar manualmente:
       * Hoja de origen.
       * Fila de encabezados.
       * Primera fila de datos.
       * Última fila de datos.
       * Rango de columnas a procesar.
     - Reconocer archivos que contengan títulos institucionales, fechas de generación, nombres de empresas, subtítulos, notas y espacios antes de los encabezados.
     - Detectar filas vacías, columnas completamente vacías y encabezados repetidos dentro de los datos.
     - Permitir procesar archivos sin encabezados, presentando las columnas mediante identificadores temporales descriptivos (Columna A, Columna B, Columna C).
     - Permitir excluir columnas y filas sin modificar el archivo original.
  3. *Reconocimiento estricto de CSV y validación de integridad:*
     - Reconocer correctamente CSV con delimitadores coma (`,`), punto y coma (`;`) y tabulación (`	`), siempre que el formato sea admitido.
     - Detectar o permitir configurar la codificación del CSV (UTF-8, ISO-8859-1/Latin-1), conservando caracteres acentuados, eñes y símbolos.
     - Validar que el contenido real corresponda al formato declarado y no confiar exclusivamente en la extensión del archivo.
     - Detectar archivos dañados, vacíos, protegidos con contraseña o cifrados que no puedan procesarse y explicar claramente el motivo del rechazo.
     - Mantener XLSX y CSV como formatos obligatorios. El formato XLS solo debe ofrecerse si se comprueba que la biblioteca y el flujo completo lo procesan correctamente con sus limitaciones.
  4. *Parametrización configurable en plataforma:*
     - Configuración en `ConfiguracionInstitucional`: `LIMITE_MAXIMO_FILAS_IMPORTACION` (por defecto 2,500 filas) y `LIMITE_MAXIMO_TAMANO_ARCHIVO_MB` (por defecto 15 MB) para evitar procesamientos que excedan las cuotas disponibles.
- **Criterios de Aceptación:**
  - [ ] Un XLSX con varias hojas permite seleccionar cualquiera de ellas mostrando su cantidad de filas.
  - [ ] Un archivo con encabezados en la fila 4 permite detectar o seleccionar esa fila sin generar columnas `__EMPTY` como campos de destino.
  - [ ] Un archivo sin encabezados permite asignar manualmente sus columnas mediante etiquetas temporales.
  - [ ] Las filas y columnas excluidas no aparecen en la validación ni en la importación.
  - [ ] Un CSV separado por punto y coma se procesa correctamente sin mezclar columnas.
  - [ ] Los archivos con codificación incompatible, contenido corrupto o formato no admitido se rechazan sin iniciar importaciones parciales.
  - [ ] El archivo original permanece intacto en el dispositivo del usuario.
- **Dependencias:** Lectura base de archivos en frontend/backend.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4990-5045; clave TASK-110; asignación única: Otros -->
### [TASK-110] [F35-Task02] [P0] Motor de reconocimiento semántico y correspondencia interactiva de columnas
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 2 (Correspondencia semántica e independencia posicional)
- **Componentes Afectados:**
  - `js/teacher.js`: construcción de correspondencias y controlador UI
  - `#modal-excel-importer` en `teacher-dashboard.html`
  - `backend/accounting-service/Code.gs` (`suggestColumnMappings`, `validateImportPreview`)
  - Hoja de Cálculo: `CatalogoCamposImportacion`
- **Subcapacidades Relacionadas:** F35-03, F35-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-03, F35-04), Matriz CAR-F35-03, CAR-F35-04 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Actualmente se asigna la primera columna del archivo al identificador del registro. No existe reconocimiento semántico, diccionario de sinónimos ni una interfaz para confirmar correspondencias. Esto provoca desalineación de columnas, corrupción de expedientes y registros erróneos cuando los encabezados son diferentes o cuando las columnas cambian de orden.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Motor semántico multivariable:*
     - Implementar un mecanismo de reconocimiento de encabezados basado en:
       * Coincidencia exacta.
       * Normalización de mayúsculas, minúsculas, espacios y tildes.
       * Diccionario de sinónimos contextual por módulo (ej. `Alumno`, `Estudiante`, `Educando` -> `Estudiante Relacionado`; `No. Cuenta`, `Cta`, `Cuenta` -> `Cuenta Relacionada`; `Cantidad`, `Valor`, `Monto`, `Importe` -> `Importe de la Operación`; `Mes a cancelar`, `Periodo` -> `Período Cobrado`; `ID matrícula` -> `Matrícula Relacionada`).
       * Abreviaturas y variaciones frecuentes.
       * Coincidencia aproximada de texto (algoritmo de Levenshtein).
       * Tipo y contenido de los valores encontrados en las celdas.
       * Contexto del módulo y entidad de destino.
  2. *Niveles de confianza y desambiguación:*
     - Calcular un nivel de confianza para las sugerencias:
       * Coincidencia exacta (100%).
       * Coincidencia de alta confianza (>= 80%).
       * Coincidencia probable (60-79%).
       * Coincidencia ambigua (< 60%).
       * Sin correspondencia.
     - Prohibir terminantemente asignar automáticamente campos obligatorios cuando exista ambigüedad.
     - No utilizar la posición de la columna como criterio determinante de correspondencia.
     - Permitir asignación manual, modificación, eliminación y exclusión de correspondencias.
     - Identificar campos obligatorios del destino que todavía no tienen una columna asignada.
     - Detectar cuando dos columnas parecen representar el mismo campo y solicitar que el usuario determine cuál utilizar o si existe una regla de combinación válida (ej. combinar `Primer Nombre` y `Primer Apellido`).
  3. *Interfaz de correspondencias y nombres descriptivos:*
     - Crear una tabla interactiva de correspondencias:
       * Nombre de la columna de origen y ejemplos de valores encontrados.
       * Selector desplegable del campo descriptivo de destino.
       * Tipo de dato esperado (Texto, Fecha, Moneda, Referencia).
       * Estado visual de la correspondencia (Confirmado, Sugerido, Ambiguo, Sin Asignar).
     - Prohibir la exposición de nombres internos técnicos de la base de datos; utilizar descripciones claras y comprensibles.
  4. *Parametrización configurable en plataforma:*
     - Configuración en `ConfiguracionInstitucional`: `UMBRAL_CONFIANZA_MAPEADO_AUTOMATICO` (por defecto 80%) y `EXIGIR_CONFIRMACION_MANUAL_MAPEO` (Valores: `SIEMPRE` vs. `SOLO_SI_HAY_AMBIGUEDADES`).
- **Criterios de Aceptación:**
  - [ ] El ejemplo de pagos se corresponde correctamente aunque las columnas aparezcan en orden totalmente alterado.
  - [ ] El sistema reconoce sinónimos y variaciones ortográficas en español.
  - [ ] Los campos ambiguos se señalan visualmente y requieren confirmación obligatoria.
  - [ ] Las columnas desconocidas pueden excluirse sin bloquear el resto del archivo.
  - [ ] Los campos obligatorios sin correspondencia impiden avanzar al siguiente paso.
  - [ ] La interfaz permite modificar las sugerencias y actualiza la vista previa reactivamente.
  - [ ] Una correspondencia no confirmada no se convierte silenciosamente en una asignación definitiva.
- **Dependencias:** F35-Task01.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5046-5084; clave TASK-111; asignación única: Otros -->
### [TASK-111] [F35-Task03] [P0] Normalización regional, interpretación de tipos y conservación de valores originales
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 3 (Integridad de tipos y formatos regionales)
- **Componentes Afectados:**
  - `js/teacher.js`: lectura mediante `XLSX.read` y `sheet_to_json` con opciones de texto
  - `backend/accounting-service/Code.gs` (`normalizeImportValue`, `validateImportPreview`)
- **Subcapacidades Relacionadas:** F35-06, F35-07.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-06) y Matriz CAR-F35-06.
- **Problema Detectado y Riesgos:**
  El procesamiento actual pierde ceros iniciales de identificadores alfanuméricos (`00125` se convierte en `125`), trunca números largos (>15 dígitos) por notación científica o redondeo de punto flotante, y carece de reglas para interpretar fechas ambiguas (`01/02/2026`) e importes con diferentes formatos regionales (`1.250,50` vs `1,250.50`).
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Preservación de ceros a la izquierda y valores originales:*
     - Implementar una capa de interpretación y normalización que considere el tipo de dato esperado por el campo de destino.
     - Conservar el valor original de cada celda y separar ese valor de su representación normalizada.
     - No convertir identificadores a números cuando deban conservarse como texto: preservar ceros a la izquierda en matrículas, cuentas, códigos, teléfonos e identificadores personales.
     - Si Excel almacenó un identificador como número puro, recuperar la representación visible si el formato de celda lo indica; si no hay información suficiente, solicitar una regla explícita en lugar de inventar ceros.
     - Evitar que números largos se conviertan a notación científica o pierdan precisión.
  2. *Normalización regional de fechas e importes:*
     - Reconocer formatos regionales de fecha: `DD/MM/AAAA`, `MM/DD/AAAA`, `AAAA/MM/DD`, guiones, puntos y nombres de meses.
     - Cuando una fecha sea ambigua (ambos componentes <= 12), solicitar al usuario que indique el formato aplicable antes de validar los registros.
     - Permitir establecer una configuración regional para toda la importación y una configuración específica por columna.
     - Normalizar importes con coma o punto decimal, separadores de miles, signos negativos y formatos entre paréntesis, convirtiendo a valor numérico de 2 decimales sin pérdida de centavos.
     - Conservar correctamente acentos, eñes, símbolos monetarios y caracteres especiales.
     - Limpiar espacios invisibles y caracteres de control sin modificar el contenido significativo.
  3. *Parametrización configurable en plataforma:*
     - Configuración en `ConfiguracionInstitucional`: `FORMATO_FECHA_IMPORTACION_PREDETERMINADO` (`DD/MM/AAAA` vs `AAAA-MM-DD`) y `SEPARADOR_DECIMAL_IMPORTACION` (`PUNTO` vs `COMA` vs `AUTO_DETECTAR`).
- **Criterios de Aceptación:**
  - [ ] El código `00125` se conserva como texto `"00125"` cuando representa un identificador.
  - [ ] Los números largos de más de 15 dígitos mantienen su valor exacto sin notación científica.
  - [ ] Las cifras `1.250,50` y `1,250.50` se interpretan correctamente según la configuración seleccionada.
  - [ ] Una fecha ambigua no se convierte silenciosamente en una fecha incorrecta.
  - [ ] Los valores no interpretables se identifican con fila, columna y motivo.
  - [ ] El valor original permanece disponible para consulta e informes de error.
  - [ ] La normalización no altera el archivo original.
- **Dependencias:** F35-Task01, F35-Task02.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5085-5125; clave TASK-112; asignación única: Otros -->
### [TASK-112] [F35-Task04] [P0] Esquemas de importación, validaciones de negocio y comprobación de campos obligatorios
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 4 (Validación de reglas particulares por entidad)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportPreview`, `getImportSchemaByEntity`)
  - `#excel-target-module` en `teacher-dashboard.html`
  - Hoja de Cálculo: `EsquemasImportacionEntidades`
- **Subcapacidades Relacionadas:** F35-07, F35-20.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-07, F35-20) y Matriz CAR-F35-07, CAR-F35-20.
- **Problema Detectado y Riesgos:**
  `validateImportPreview(payload)` solamente comprueba la presencia del campo identificador. No valida los tipos de datos, campos obligatorios, longitudes máximas y mínimas, catálogos ni reglas particulares de cada entidad, arriesgando la inserción de registros truncados o corruptos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Esquemas estructurados por entidad:*
     - Definir las reglas de importación por entidad y tipo de información. Cada entidad importable debe disponer de una definición que especifique:
       * Nombre descriptivo.
       * Campos disponibles y campos obligatorios.
       * Tipos de datos y longitudes permitidas.
       * Valores admitidos y catálogos de referencia.
       * Identificadores únicos.
       * Relaciones obligatorias.
       * Restricciones de creación y actualización.
       * Permisos requeridos para operar.
     - Prohibir el uso de un único conjunto de validaciones genéricas para todos los módulos.
  2. *Validación exhaustiva registro por registro:*
     - Validar cada registro individualmente y comprobar la consistencia entre campos relacionados.
     - Identificar valores fuera de los catálogos permitidos.
     - Diferenciar errores bloqueantes de advertencias.
     - Mostrar el valor recibido, el campo de destino y la regla específica incumplida.
     - Mantener la validación del lado servidor como autoridad final, impidiendo que manipulaciones en cliente eludan las comprobaciones.
- **Criterios de Aceptación:**
  - [ ] Un registro sin un campo obligatorio se clasifica inmediatamente como inválido.
  - [ ] Una fecha, cantidad o código incompatible se rechaza con el motivo específico.
  - [ ] Las reglas particulares de una entidad no interfieren con las demás.
  - [ ] Los valores fuera de catálogo se identifican antes de cualquier persistencia.
  - [ ] La validación del frontend no permite omitir las comprobaciones del backend.
  - [ ] Un registro inválido no se presenta como listo para importar.
- **Dependencias:** F35-Task02, F35-Task03.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5126-5171; clave TASK-113; asignación única: Otros -->
### [TASK-113] [F35-Task05] [P0] Validación relacional, detección de duplicados y resolución de conflictos
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 5 (Consistencia relacional y prevención de colisiones)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportReferencesAndDuplicates`)
  - `backend/academic-service/Code.gs`, `backend/user-service/Code.gs`
  - Hojas de Cálculo: `Estudiantes`, `MatriculasEstudiantes`, `CatalogoCuentasContables`, `CargosEstudiante`
- **Subcapacidades Relacionadas:** F35-08, F35-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-08, F35-09) y Matriz CAR-F35-08, CAR-F35-09.
- **Problema Detectado y Riesgos:**
  El importador no comprueba si las referencias de los registros existen en la base de datos ni detecta duplicados dentro del archivo o frente a los registros existentes. Esto permite insertar transacciones huérfanas, pagos a estudiantes inexistentes y operaciones duplicadas masivas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Validación de referencias cruzadas y entidades relacionadas:*
     - Consultar las entidades relacionadas antes de permitir la importación:
       * Estudiantes (`estudianteId` en `Estudiantes`).
       * Matrículas (`matriculaId` en `MatriculasEstudiantes`).
       * Cuentas y responsables financieros en `CatalogoCuentasContables`.
     - Comprobar que las referencias no solo existan, sino que pertenezcan a la relación correcta (ej. que la cuenta bancaria corresponda al tutor del estudiante).
     - Detectar referencias inexistentes, inactivas, ambiguas o incompatibles, impidiendo la creación de relaciones huérfanas.
  2. *Detección de duplicados internos y externos:*
     - *Duplicados internos:* Detectar filas duplicadas dentro del archivo utilizando identificador principal, identificadores secundarios o combinaciones clave de campos.
     - *Duplicados externos:* Comparar los registros entrantes con los existentes en la plataforma, clasificando como:
       * `Crear`: Registro nuevo que no existe.
       * `Actualizar`: Registro existente que recibiría cambios en campos permitidos.
       * `Sin Cambios`: Registro existente con exactamente la misma información.
       * `Omitir`: Registro descartado por política.
       * `Revisión`: Ambigüedad que requiere intervención manual.
       * `Conflicto`: Inconsistencias o colisiones de datos.
       * `Error`: Datos inválidos.
     - No fusionar estudiantes, responsables o cuentas únicamente porque compartan un nombre común.
  3. *Resolución de conflictos y políticas configurables:*
     - Mostrar los valores actuales y los entrantes en caso de actualización.
     - Permitir resolver manualmente los conflictos antes de ejecutar la importación.
     - Parámetro en `ConfiguracionInstitucional`: `POLITICA_DUPLICADOS_IMPORTACION`: Valores `OMITIR_EXISTENTES` (por defecto) vs. `ACTUALIZAR_EXISTENTES` vs. `RECHAZAR_LOTE_COMPLETO`.
- **Criterios de Aceptación:**
  - [ ] Una matrícula o estudiante inexistente se identifica antes de guardar.
  - [ ] Una cuenta vinculada a un responsable diferente se marca como conflicto relacional.
  - [ ] Dos filas con el mismo identificador dentro del archivo se detectan como duplicadas.
  - [ ] Una operación ya registrada no vuelve a crearse como nueva.
  - [ ] Las actualizaciones muestran las diferencias entre los valores actuales y propuestos.
  - [ ] La validación relacional respeta estrictamente los permisos del usuario.
- **Dependencias:** F35-Task04.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5172-5208; clave TASK-114; asignación única: Otros -->
### [TASK-114] [F35-Task06] [P0] Vista previa integral, simulación y autorización obligatoria de importación
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 6 (Simulación completa sin persistencia previa)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportPreview`)
  - `#modal-excel-importer`, `#btn-submit-excel-import` en `teacher-dashboard.html`
  - `js/teacher.js`
- **Subcapacidades Relacionadas:** F35-10, F35-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-10, F35-11) y Matriz CAR-F35-10, CAR-F35-11.
- **Problema Detectado y Riesgos:**
  La vista previa actual solamente presenta el número total de filas. Además, el botón `#btn-submit-excel-import` envía directamente los datos a persistencia sin exigir una validación aprobada y una confirmación basada en los efectos reales simulados, arriesgando ejecuciones a ciegas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Simulación completa sin efectos persistentes:*
     - Convertir `validateImportPreview(payload)` en una simulación completa que ejecute correspondencias, normalizaciones, validaciones, relaciones y duplicados sin modificar ninguna celda de negocio.
     - Presentar un resumen cuantitativo: total analizados, nuevos a crear, existentes a actualizar, sin cambios, omitidos, pendientes de revisión y errores bloqueantes.
  2. *Inspección individual y filtros:*
     - Mostrar los registros individualmente con filtros por categoría.
     - Mostrar diferencias entre valores actuales y propuestos en actualizaciones.
     - Permitir excluir registros específicos antes de confirmar.
     - Permitir regresar al mapeo y corregir correspondencias, recalculando la simulación.
  3. *Puerta obligatoria de autorización:*
     - Bloquear terminantemente el botón de confirmación mientras existan errores bloqueantes.
     - No permitir que registros pendientes de revisión se incorporen silenciosamente.
     - Exigir confirmación explícita con resumen de operaciones a ejecutar.
     - Detectar si los datos de la base cambiaron entre la validación y la confirmación, forzando revalidación si hay discrepancias.
- **Criterios de Aceptación:**
  - [ ] Ejecutar la validación no crea ni actualiza registros de negocio.
  - [ ] Los totales de cada categoría coinciden exactamente con el detalle de registros.
  - [ ] Los errores bloqueantes impiden confirmar la importación.
  - [ ] Los registros excluidos no se procesan.
  - [ ] Las actualizaciones muestran claramente los valores anteriores y propuestos.
  - [ ] La ejecución final corresponde a la última simulación confirmada y no a un estado desactualizado.
- **Dependencias:** F35-Task01 a F35-Task05.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5209-5244; clave TASK-115; asignación única: Otros -->
### [TASK-115] [F35-Task07] [P0] Ejecución real de importaciones, procesamiento seguro e idempotencia
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 7 (Persistencia atómica y concurrencia controlada)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `executeAtomicImportBatch`)
  - Hojas de destino según entidad (`CargosEstudiante`, `Estudiantes`, etc.)
  - Hoja de Cálculo: `AuditoriaMigraciones`
- **Subcapacidades Relacionadas:** F35-12, F35-16, F35-18.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-12, F35-16) y Matriz CAR-F35-12.
- **Problema Detectado y Riesgos:**
  `importDataWithColumnMapping(payload)` registra información en `AuditoriaMigraciones`, pero no ejecuta inserciones reales en las tablas de destino. Tampoco existe protección contra ejecuciones concurrentes ni mecanismos de idempotencia, provocando colisiones y duplicaciones ante fallos o reintentos de red.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Inserción y actualización real en tablas de negocio:*
     - Implementar las operaciones efectivas de creación y actualización en las entidades de destino utilizando exclusivamente las decisiones de la última vista previa válida.
     - Asignar un identificador único de ejecución (`ejecucionId`) por lote.
     - Implementar claves de idempotencia para impedir que una misma importación genere registros duplicados ante reintentos de comunicación o respuestas perdidas.
  2. *Control de concurrencia y atomicidad con LockService:*
     - Proteger las secciones críticas de escritura con `LockService.getScriptLock()` (espera de hasta 30 segundos) para serializar importaciones concurrentes.
     - Verificar nuevamente identificadores y condiciones antes de escribir para evitar sobrescribir modificaciones concurrentes ocurridas tras la validación.
     - Mantener relación entre cada registro importado y su ejecución de origen.
     - Registrar detalladamente qué operaciones se completaron y cuáles fallaron ante interrupciones.
     - Respetar los permisos de `ROLE_PERMISSIONS` verificados para Director, Subdirector, Contador y Administrador.
  3. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `MODO_TRANSACCIONAL_IMPORTACION`: Valores `TODO_O_NADA` (rechaza el lote completo si una fila falla) vs. `IMPORTAR_VALIDOS_DESCARTAR_FALLIDOS`.
- **Criterios de Aceptación:**
  - [ ] Una importación aprobada crea y actualiza realmente los registros en las hojas de destino.
  - [ ] Los registros omitidos o sin cambios no se modifican.
  - [ ] Una misma clave de idempotencia no genera dos ejecuciones efectivas.
  - [ ] Dos importaciones concurrentes no generan duplicados ni sobrescrituras silenciosas.
  - [ ] Una interrupción deja un estado verificable y permite identificar las filas procesadas.
  - [ ] Los registros importados quedan vinculados a su ejecución de origen.
- **Dependencias:** F35-Task06.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5245-5278; clave TASK-116; asignación única: Otros -->
### [TASK-116] [F35-Task08] [P0] Historial detallado y reversión selectiva de importaciones
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 8 (Trazabilidad granular y reversión segura)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`revertImportBatch`, `getMigrationLogs`, `getImportBatchDetail`)
  - Hoja de Cálculo: `AuditoriaMigraciones`, `DetalleRegistrosImportados`
- **Subcapacidades Relacionadas:** F35-15, F35-16.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-15) y Matriz CAR-F35-15.
- **Problema Detectado y Riesgos:**
  Existe trazabilidad general mediante `AuditoriaMigraciones`, pero no hay mecanismo de reversión. Tampoco se conservan los valores anteriores a las actualizaciones, obligando a correcciones manuales riesgosas ante importaciones defectuosas que pueden destruir datos legítimos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Registro granular de operaciones efectuadas:*
     - Auto-crear la hoja `DetalleRegistrosImportados` (`EjecucionId`, `HojaDestino`, `RegistroId`, `TipoOperacion`, `ValoresPreviosJSON`, `ValoresNuevosJSON`, `FechaHora`, `EstadoReversion`).
     - Conservar una copia de los valores anteriores antes de ejecutar cualquier actualización.
  2. *Motor de reversión selectiva y segura:*
     - Implementar `revertImportBatch(payload)` con validaciones estrictas:
       * *Registros creados:* Permitir eliminación lógica o física solo si no existen dependencias o modificaciones posteriores que hagan insegura su eliminación (ej. un cargo no puede revertirse si ya tiene un pago aplicado).
       * *Registros actualizados:* Restaurar los valores anteriores únicamente si sus valores actuales coinciden con los introducidos por la importación.
     - Si un registro cambió posteriormente, bloquear su reversión automática y explicar el conflicto.
     - Permitir reversión parcial cuando algunos registros sean seguros de revertir y otros no.
     - No eliminar registros relacionados creados por otros procesos o usuarios.
     - Registrar cada intento de reversión con responsable, fecha y resultado, evitando que se ejecute dos veces.
- **Criterios de Aceptación:**
  - [ ] Cada importación genera un historial individual con detalle de registros afectados.
  - [ ] Las actualizaciones conservan los valores previos para auditoría y restauración.
  - [ ] Un registro creado puede revertirse solo cuando sea seguro y no tenga transacciones dependientes.
  - [ ] Un registro modificado posteriormente se protege contra restauraciones inseguras.
  - [ ] La reversión parcial conserva los registros que no pudieron revertirse explicando el motivo.
  - [ ] El historial original permanece inalterado tras la reversión.
- **Dependencias:** F35-Task07.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5279-5310; clave TASK-117; asignación única: Otros -->
### [TASK-117] [F35-Task09] [P0] Informe descargable de errores, advertencias y resultados de importación
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 9 (Autonomía de corrección para el usuario)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`generateImportErrorReportCSV`, `validateImportPreview`)
  - `#modal-excel-importer`, `js/teacher.js`
- **Subcapacidades Relacionadas:** F35-13, F35-17.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-13) y Matriz CAR-F35-13.
- **Problema Detectado y Riesgos:**
  Los errores se almacenan en JSON en `AuditoriaMigraciones` limitados rígidamente a los primeros 20 registros, sin permitir descargar los registros rechazados ni ofrecer un informe detallado para corregir archivos masivos y repetir la importación.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Generación de informes descargables en CSV:*
     - Generar informes de validación y de ejecución permitiendo descargar los registros observados en formato CSV.
     - Conservar las columnas y valores originales del archivo para facilitar su identificación.
     - Añadir columnas explicativas: `NumeroFilaOriginal`, `CampoDestino`, `ValorRecibido`, `TipoProblema`, `DescripcionError`, `AccionRecomendada` y `EstadoRegistro`.
  2. *Diagnóstico completo sin límites artificiales:*
     - Eliminar el límite de 20 errores: registrar y permitir consultar todos los errores encontrados.
     - Diferenciar claramente errores bloqueantes, advertencias, duplicados y conflictos.
     - Permitir descargar únicamente los registros fallidos o todos los registros observados.
     - El archivo descargado debe ser editable y utilizable directamente para corregir los datos y volver a intentar la importación.
     - Proteger la descarga según los permisos del usuario sin exponer datos no autorizados.
- **Criterios de Aceptación:**
  - [ ] Un archivo con más de 20 errores conserva y descarga la totalidad de las filas observadas.
  - [ ] Cada error identifica con precisión la fila, la columna y la regla incumplida.
  - [ ] El archivo CSV descargado conserva los datos originales facilitando su corrección.
  - [ ] Los informes se generan tanto para simulaciones sin guardar como para ejecuciones reales.
  - [ ] El archivo corregido puede subirse directamente sin pasos de conversión adicionales.
- **Dependencias:** F35-Task06, F35-Task07.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5311-5341; clave TASK-118; asignación única: Otros -->
### [TASK-118] [F35-ID-Task01] [P0] Consolidación del motor central de numeración y eliminación de generadores ad-hoc
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 1 (Infraestructura transversal de identidad)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`generateInstitutionalId`)
  - `backend/academic-service/Code.gs` (`generateInstitutionalId`)
  - `backend/accounting-service/Code.gs`
  - Hoja de Cálculo: `SecuenciasIDs`
- **Subcapacidades Relacionadas:** F35-ID-01, F35-ID-05, F35-ID-06, F35-ID-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección B, E y Matriz CAR-ID-01, CAR-ID-06, CAR-ID-09.
- **Problema Detectado y Riesgos:**
  Existe duplicación de código en la función `generateInstitutionalId` entre `user-service` y `academic-service`, mientras que más de 150 puntos en todos los servicios generan identificadores mediante timestamps crudos (`Date.now()`, `Math.random()`) en trámites (`TRAM-`), justificaciones (`JUST-`), decisiones (`DEC-`), firmas (`SIG-`) y pagos. Esto produce identificadores no correlativos, antiestéticos, no auditables e incapaces de soportar secuencias oficiales institucionales.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Unificación del motor central de asignación:*
     - Centralizar `generateInstitutionalId` como la única función canónica de asignación de secuencias, sincronizando o compartiendo su lógica para eliminar la duplicación de código entre servicios.
     - Implementar bloqueo atómico con `LockService.getScriptLock()` (espera de hasta 10 segundos) con lectura de la hoja `SecuenciasIDs` y actualización inmediata antes de liberar el candado.
  2. *Reemplazo progresivo de generadores ad-hoc:*
     - Migrar los puntos de creación de identificadores operativos para utilizar el motor central con prefijos configurados (`TRM-`, `JST-`, `DEC-`, `SIG-`, `MOV-`).
     - Preservar la clave técnica interna inmutable (`personaId` / `registroId`) separada del identificador oficial visible.
  3. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `FALLBACK_TIMESTAMP_SI_TIMEOUT_LOCK`: Valores `LANZAR_ERROR_Y_REINTENTAR` (estricto por defecto) vs. `GENERAR_TIMESTAMP_CON_FLAG_AUDITORIA`.
- **Criterios de Aceptación:**
  - [ ] El motor central genera secuencias consecutivas con relleno de ceros configurable sin colisiones.
  - [ ] Se elimina la duplicación de lógica entre los servicios de usuario y académico.
  - [ ] Las solicitudes concurrentes se serializan mediante `LockService` garantizando números estrictamente distintos.
  - [ ] La tabla `SecuenciasIDs` mantiene actualizado el `UltimoNumero` y fecha para cada tipo de entidad.
- **Dependencias:** Sistema base de persistencia y LockService.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5342-5375; clave TASK-119; asignación única: Otros -->
### [TASK-119] [F35-ID-Task02] [P0] Catálogo configurable de formatos oficiales y ámbitos institucionales de unicidad
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 2 (Formatos parametrizables y segmentación por sede)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`configureSequencePattern`, `generateInstitutionalId`)
  - `backend/accounting-service/Code.gs`
  - Hoja de Cálculo: `DefinicionesNumeracion`, `SecuenciasIDs`
- **Subcapacidades Relacionadas:** F35-ID-02, F35-ID-03, F35-ID-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección B, E y Matriz CAR-ID-02, CAR-ID-03.
- **Problema Detectado y Riesgos:**
  El motor actual utiliza un formato fijo e inalterable: `pfx + padStart(6, '0')`. No permite incorporar componentes variables como el año lectivo (`MAT-YYYY-#####`), sufijos, separadores configurables (`/`, `-`, `.`) ni segmentar la numeración por sede o institución independiente, forzando a todas las sedes a compartir la misma secuencia o colisionar.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura de definiciones de numeración:*
     - Auto-crear la hoja `DefinicionesNumeracion` (`DefinicionId`, `EntidadTipo`, `AmbitoInstitucional`, `Prefijo`, `Separador`, `ComponenteAno`, `LongitudDigitos`, `Sufijo`, `NumeroInicial`, `Incremento`, `PatronGenerado`, `Estado`, `FechaModificacion`, `ModificadoPor`).
     - Admitir patrones configurables como:
       * `EST-#####` -> `EST-00001`
       * `MAT-YYYY-#####` -> `MAT-2026-00001`
       * `EXP/###/YYYY` -> `EXP/001/2026`
       * `FAC-SSS-PPP-########` -> numeración tributaria fiscal autorizada
  2. *Ámbitos institucionales de unicidad:*
     - Permitir segmentar la secuencia por sede o institución (`GLOBAL`, `SEDE_CENTRAL`, `SEDE_NORTE`, etc.).
     - Dos entidades con el mismo prefijo pueden coexistir únicamente si sus ámbitos de unicidad están explícitamente separados y no comparten espacio de identificación.
  3. *Inmutabilidad de identificadores emitidos:*
     - La modificación del formato o prefijo de una serie afecta únicamente a las emisiones futuras; los registros previamente asignados conservan intacto su código sin modificaciones retroactivas.
- **Criterios de Aceptación:**
  - [ ] El administrador puede configurar el patrón oficial para cada entidad incluyendo año dinámico y longitud numérica.
  - [ ] Los identificadores se generan siguiendo con exactitud el patrón configurado.
  - [ ] La numeración por sede se mantiene en contadores independientes sin interferencias cruzadas.
  - [ ] Modificar una serie no altera los identificadores históricos ya asignados.
- **Dependencias:** F35-ID-Task01.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5376-5401; clave TASK-120; asignación única: Otros -->
### [TASK-120] [F35-ID-Task03] [P0] Validador de colisiones potenciales y solapamiento entre formatos
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 3 (Prevención de ambigüedades e inconsistencias)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`validateSequencePatternCompatibility`)
  - Hoja de Cálculo: `DefinicionesNumeracion`
- **Subcapacidades Relacionadas:** F35-ID-03, F35-ID-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección C, E y Matriz CAR-ID-04.
- **Problema Detectado y Riesgos:**
  No existe ninguna verificación al dar de alta una nueva serie de numeración. Si un usuario crea una serie con prefijo `EST-#####` y otro define `EST-000##` o `EST#####` en el mismo ámbito, se generarán colisiones inevitables y registros duplicados que romperán las relaciones relacionales de la plataforma.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Análisis sintáctico y de solapamiento de patrones:*
     - Al registrar o modificar una serie en `DefinicionesNumeracion`, analizar si el nuevo patrón produce expresiones regulares que intersecten con series existentes en el mismo ámbito institucional.
     - Detectar colisiones directas (`REG-#####` vs `REG-#####`) y solapamientos condicionales por año (`MAT-YYYY-#####` vs `MAT-2026-#####`).
     - Rechazar la activación de cualquier serie potencialmente ambigua explicando con precisión el conflicto detectado.
  2. *Normalización canónica de comparación:*
     - Comprobar que la validación de unicidad trate de manera normalizada mayúsculas/minúsculas y espacios invisibles para impedir que `EST-001` y `est-001` coexistan como registros distintos.
- **Criterios de Aceptación:**
  - [ ] El sistema bloquea el registro de dos series que produzcan el mismo patrón en el mismo ámbito.
  - [ ] Se detectan y alertan solapamientos condicionales por componentes de fecha o sede.
  - [ ] La validación se ejecuta en servidor impidiendo elusiones desde el navegador.
- **Dependencias:** F35-ID-Task02.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5402-5431; clave TASK-121; asignación única: Otros -->
### [TASK-121] [F35-ID-Task04] [P0] Integración del control de numeración en importaciones y gestión de los 5 casos (A-E)
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 4 (Convergencia con el importador inteligente de datos)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportPreview`, `importDataWithColumnMapping`)
  - `backend/user-service/Code.gs` (`resolveImportIdentifierPolicy`)
  - Hoja de Cálculo: `SecuenciasIDs`, `IdentificadoresHistoricosExternos`
- **Subcapacidades Relacionadas:** F35-ID-05, F35-ID-09, F35-ID-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección F y Matriz CAR-ID-07, CAR-ID-11, CAR-ID-12.
- **Problema Detectado y Riesgos:**
  El importador procesa identificadores de archivos externos sin coordinarse con `SecuenciasIDs`. Si se importa un lote con IDs superiores o desfasados, el contador no se actualiza (provocando futuras colisiones) o sobrescribe identificadores legítimos preexistentes.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Implementación de los 5 casos normativos de importación:*
     - *Caso A (Formato coincide y está libre):* Conservar el ID como oficial si la política lo permite y actualizar el contador si el número es superior.
     - *Caso B (Número superior al contador actual):* Conservar el ID, avanzar el contador hasta ese valor sin generar registros intermedios artificiales (sin rellenar huecos).
     - *Caso C (ID ocupado por otro registro):* Detectar el conflicto; si es una persona diferente, asignar un nuevo ID oficial libre y guardar el código de origen como referencia histórica.
     - *Caso D (IDs antiguos inferiores libres):* Conservarlos si están libres sin retroceder el contador general de la serie.
     - *Caso E (Formato no cumple el patrón oficial):* Asignar un ID oficial correlativo nuevo y almacenar el código del archivo como identificador externo/histórico.
  2. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `POLITICA_IMPORTACION_IDENTIFICADORES`: Valores `CONSERVAR_SI_ESTA_LIBRE` (por defecto) vs. `REASIGNAR_SIEMPRE_NUEVO_OFICIAL` vs. `RECHAZAR_SI_NO_COINCIDE_PATRON`.
- **Criterios de Aceptación:**
  - [ ] Importar un ID superior al contador (ej. 413 sobre 300) actualiza la secuencia a 414 sin crear registros intermedios ficticios.
  - [ ] Importar un ID ocupado no sobrescribe al titular actual y propone un ID libre preservando el código original en histórico.
  - [ ] Los códigos con formatos ajenos reciben un ID oficial válido y mantienen su código previo como referencia.
  - [ ] La simulación de importación presenta con claridad las decisiones de numeración antes de confirmar.
- **Dependencias:** F35-ID-Task02, F35-Task03 (importador).
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5432-5462; clave TASK-122; asignación única: Otros -->
### [TASK-122] [F35-ID-Task05] [P0] Conservación relacional de identificadores históricos y externos
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 5 (Identidad estable y trazabilidad de orígenes externos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`registerExternalIdentifier`, `resolveRecordByIdentifier`)
  - Hoja de Cálculo: `IdentificadoresHistoricosExternos`
- **Subcapacidades Relacionadas:** F35-ID-07, F35-ID-10, F35-ID-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección B, E y Matriz CAR-ID-10, CAR-ID-20.
- **Problema Detectado y Riesgos:**
  Cuando un estudiante o empleado proviene de otra institución o del sistema gubernamental SACE, su código anterior no se almacena de forma estructurada. Si se busca por su código previo o si un banco reporta pagos con referencias externas, la búsqueda falla al consultar únicamente el ID oficial visible.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura relacional de identificadores externos e históricos:*
     - Auto-crear la hoja `IdentificadoresHistoricosExternos` (`MapeoId`, `RegistroInternoId`, `EntidadTipo`, `IdentificadorOficialActual`, `CodigoExternoHistorico`, `SistemaOrigen`, `TipoReferencia`, `FechaVinculacion`, `EsActivo`, `NotasAuditoria`).
     - Distinguir entre:
       * `IDENTIFICADOR_ANTERIOR`: Código que tuvo en la misma institución antes de un cambio de serie.
       * `REFERENCIA_EXTERNA_SACE`: Código oficial del sistema gubernamental.
       * `REFERENCIA_EXTERNA_BANCARIA`: Código o cuenta de recaudación en banco.
       * `IDENTIFICADOR_SISTEMA_PREVIO`: Código en sistema legado migrado.
  2. *Búsqueda y resolución bidireccional:*
     - Implementar `resolveRecordByIdentifier(payload)` que busque primero por ID oficial y, si no encuentra, busque en `IdentificadoresHistoricosExternos` resolviendo al registro correcto.
     - Garantizar unicidad de referencias externas por combinación `SistemaOrigen + EntidadTipo + CodigoExterno`.
- **Criterios de Aceptación:**
  - [ ] Se puede localizar un expediente tanto por su identificador oficial actual como por su código SACE o histórico.
  - [ ] El sistema distingue el sistema de origen de cada referencia externa.
  - [ ] Intentar vincular la misma referencia externa de un mismo sistema a dos registros distintos es rechazado por duplicidad.
  - [ ] Modificar el código oficial no destruye ni altera sus referencias históricas asociadas.
- **Dependencias:** F35-ID-Task01.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5463-5511; clave TASK-123; asignación única: Otros -->
### [TASK-123] [F37-Task01] [P0] Enrutamiento declarativo central de destinos y validación de autorización departamental
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 1 (Aislamiento y resolución de destino en backend)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`resolveSpreadsheetSource`, `resolveDataDestination`, `importDataWithColumnMapping`)
  - `backend/user-service/Code.gs` (`getUserVerifiedRole`, `validateRolePermission`)
  - Hoja de Cálculo: `CatalogoSpreadsheets`, `ConfiguracionEnrutamientoDestinos`
- **Subcapacidades Relacionadas:** F37-01, F37-02, F37-06.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-01, F37-06), Matriz CAR-F37-01, CAR-F37-06 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El catálogo `CatalogoSpreadsheets` y el mecanismo `resolveSpreadsheetSource` ya permiten localizar fuentes de datos por dominio y año lectivo. Sin embargo, el importador `importDataWithColumnMapping` acepta `destinoModulo` enviado por el frontend sin comprobar estrictamente que ese destino corresponda a la entidad que se pretende importar y al departamento autorizado del usuario. La selección del destino no puede depender de un valor libre enviado por el cliente; debe determinarlo el backend mediante reglas institucionales verificables.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Consolidación de resolución declarativa en servidor:*
     - Consolidar la resolución de destinos en un mecanismo central del backend que reutilice el catálogo de fuentes existente (`CatalogoSpreadsheets`).
     - Cada tipo de entidad importable debe tener una asignación declarativa que determine:
       * Identidad de la entidad.
       * Departamento propietario.
       * Módulo responsable.
       * Fuente de almacenamiento (`spreadsheetId`, hoja o recurso receptor).
       * Ámbito institucional aplicable (sede, año lectivo).
       * Operaciones permitidas (crear, actualizar, consultar, archivar).
       * Roles y permisos efectivos que pueden operar sobre ella.
       * Estado activo o inactivo del destino.
     - La resolución debe utilizar el tipo de entidad real analizado en servidor, no únicamente el nombre de la hoja o los encabezados del archivo.
  2. *Validación de autorización y blindaje ante elusión:*
     - El backend debe obtener el rol verificado (`getUserVerifiedRole`) y validar permisos (`validateRolePermission`) sobre departamento, entidad y operación.
     - Tratar el parámetro `destinoModulo` del cliente únicamente como una solicitud, nunca como una autorización vinculante.
     - Si el cliente envía un destino incompatible con la entidad, el backend debe rechazar la operación con error 403.
     - Si no se envía un destino y existe una única asignación válida, resolverla automáticamente.
     - Si existen varios destinos válidos, solicitar selección explícita entre las opciones autorizadas.
     - Si no existe asignación válida, detener la operación antes de cualquier escritura.
     - Los destinos inactivos no deben aceptar nuevas escrituras, aunque conserven sus registros históricos.
     - Eliminar o renombrar una hoja física no debe provocar escrituras en otras hojas por coincidencia de nombres.
  3. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `MODO_ENRUTAMIENTO_DESTINO`: Valores `ESTRICTO_SERVERSIDE_ONLY` (por defecto) vs. `PERMITIR_SOLICITUD_CLIENTE_CON_VALIDACION_ROL`.
- **Criterios de Aceptación:**
  - [ ] Importar matrículas desde Secretaría se resuelve hacia el destino académico configurado.
  - [ ] Importar pagos desde Contabilidad se resuelve hacia el destino financiero configurado.
  - [ ] Enviar `destinoModulo: "Secretaría"` junto con una entidad financiera es rechazado por el backend.
  - [ ] Enviar un identificador de destino fuera del catálogo autorizado o inactivo es rechazado sin escribir.
  - [ ] Omitir el destino cuando existe una sola asignación válida se resuelve automáticamente.
  - [ ] Configurar dos destinos posibles sin regla de selección exige confirmación manual.
  - [ ] Renombrar una hoja física no provoca escrituras en otro destino por coincidencia de nombre.
  - [ ] Un usuario sin autorización departamental no puede importar aunque conozca el identificador de la fuente.
- **Dependencias:** Catálogo de fuentes `CatalogoSpreadsheets`, control RBAC de `user-service`.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5512-5543; clave TASK-124; asignación única: Otros -->
### [TASK-124] [F37-Task02] [P0] Validación semántica de importaciones y correspondencia entre entidad, estructura, departamento y destino
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 2 (Validación de congruencia entre datos y destino)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportPreview`, `importDataWithColumnMapping`)
  - `js/teacher.js`, `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** F37-01, F37-06.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-06), Matriz CAR-F37-06 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La importación actual puede recibir una estructura de archivo que se parezca a la de otra entidad y permitir que el usuario seleccione un módulo diferente. La validación de columnas obligatorias no garantiza que el contenido corresponda realmente al destino seleccionado. La coincidencia accidental de nombres genéricos como `nombre`, `codigo`, `fecha` o `estado` no debe permitir intercambiar destinos operativos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Definición de estructura y validación en dos capas:*
     - Cada entidad importable debe contar con una definición que especifique: campos admitidos, obligatorios, tipos de datos, formatos, reglas de validación, identificadores y referencias.
     - Diferenciar la validación estructural (columnas y formatos correctos) de la validación semántica (comprobación de que el contenido corresponde a la entidad y operación solicitadas).
     - No aceptar un archivo de matrículas como archivo de pagos simplemente porque coincidan algunas columnas genéricas.
     - Si un archivo contiene datos de varias entidades, evitar que todas las filas se escriban en un único destino indebido.
  2. *Previsualización obligatoria no destructiva:*
     - La previsualización debe mostrar: tipo de entidad detectado, departamento propietario, módulo de destino, fuente de almacenamiento, mapeo de columnas, conteo de registros válidos/erróneos y referencias pendientes.
     - La confirmación debe estar vinculada estrictamente a la previsualización validada; si se modifica el archivo, el mapeo, el destino o los permisos, la validación debe invalidarse y repetirse obligatoriamente.
     - La validación debe ejecutarse en el servidor como autoridad final.
- **Criterios de Aceptación:**
  - [ ] Un archivo financiero con encabezados similares a matrículas no puede importarse como matrícula.
  - [ ] Un archivo académico con un campo llamado `monto` no se clasifica automáticamente como financiero.
  - [ ] Archivos con campos obligatorios ausentes o formatos incompatibles son rechazados antes de escribir.
  - [ ] La previsualización no produce escrituras ni cambios de estado en la base de datos.
  - [ ] Modificar el archivo o destino tras previsualizar obliga a repetir la validación en backend.
  - [ ] El resumen final coincide exactamente con la cantidad de registros procesados.
- **Dependencias:** F37-Task01.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5577-5612; clave TASK-126; asignación única: Otros -->
### [TASK-126] [F37-Task04] [P0] Catálogo declarativo de relaciones interdepartamentales y validación estricta de referencias foráneas
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 4 (Consistencia relacional y prevención de registros huérfanos)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`recordStudentPayment`, `createFiscalInvoice`)
  - `backend/academic-service/Code.gs` (`saveStudentEnrollment`)
  - Hojas de Cálculo: `MatriculasEstudiantes`, `CargosEstudiante`, `Estudiantes`, `CatalogoRelacionesInterdepartamentales`
- **Subcapacidades Relacionadas:** F37-03, F37-04, F37-07.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-04, F37-07), Matriz CAR-F37-04, CAR-F37-07 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La plataforma utiliza identificadores estables (`personaId`, `estudianteId`, `matriculaId`, `pagoId`), pero no comprueba de manera suficiente la existencia, vigencia y autorización de las referencias antes de registrar datos dependientes. Se puede intentar registrar un pago con un código de matrícula arbitrario sin verificar que exista o que pertenezca al estudiante indicado, creando pagos huérfanos y distorsiones financieras.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Catálogo de relaciones interdepartamentales:*
     - Auto-crear la hoja `CatalogoRelacionesInterdepartamentales` (`RelacionId`, `EntidadOrigen`, `EntidadDestino`, `CampoClaveForanea`, `TipoRelacion`, `DepartamentoOrigen`, `DepartamentoDestino`, `CondicionVigencia`, `CamposPermitidosJSON`).
     - Toda creación o actualización de un registro dependiente debe validar sus referencias antes de escribir:
       * Existencia real del registro relacionado en su departamento propietario.
       * Identificador institucional correcto.
       * Estado activo o condición válida (ej. matrícula en estado `Activa` o `Aprobada`).
       * Ámbito institucional, sede y año lectivo compatibles.
       * Correspondencia biunívoca entre `estudianteId` y `matriculaId`.
  2. *Prohibición de entidades ficticias y manejo histórico:*
     - Distinguir entre referencia inexistente y referencia a la que no se tiene acceso (rechazar sin revelar datos).
     - Prohibir terminantemente crear automáticamente matrículas o estudiantes ficticios para forzar la transacción.
     - Conservar las referencias históricas aunque la entidad relacionada sea archivada o finalice su vigencia temporal.
- **Criterios de Aceptación:**
  - [ ] Crear un pago asociado a una matrícula válida y activa se acepta correctamente.
  - [ ] Crear un pago con matrícula inexistente se rechaza sin escribir registros.
  - [ ] Indicar un estudiante y una matrícula que pertenecen a personas distintas se rechaza de inmediato.
  - [ ] Utilizar una matrícula de otra sede sin autorización se rechaza con error 403.
  - [ ] Archivar una matrícula no elimina los pagos ni altera la trazabilidad histórica de cobros.
  - [ ] La validación se aplica tanto en importaciones como en operaciones individuales en backend.
- **Dependencias:** F37-Task01, F37-Task03.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5613-5645; clave TASK-127; asignación única: Otros -->
### [TASK-127] [F37-Task05] [P0] Idempotencia, integridad y recuperación de importaciones departamentales
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 5 (Atomicidad, prevención de duplicados y resiliencia transaccional)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `executeAtomicImportBatch`)
  - `backend/academic-service/Code.gs`
  - `LockService`
  - Hoja de Cálculo: `AuditoriaMigraciones`, `RegistroOperacionesImportacion`
- **Subcapacidades Relacionadas:** F37-09, F37-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-09, F37-10), Matriz CAR-F37-09 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  `LockService` serializa las importaciones simultáneas, pero el importador todavía genera duplicados cuando se repite una importación completada. Además, una interrupción durante una escritura puede dejar registros parciales o inconsistentes sin que exista un mecanismo de recuperación o compensación.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Claves de idempotencia compuestas y huella de archivo:*
     - Asignar a cada importación confirmada un identificador único de operación y una clave de idempotencia compuesta por: `departamento + entidad + operacionId + hashContenidoArchivo`.
     - Si se reintenta la misma operación con el mismo archivo, devolver el resultado previo sin repetir las escrituras.
     - Si se reutiliza la misma clave con contenido diferente, rechazar la operación por inconsistencia.
  2. *Registro persistente de estados y recuperación de parciales:*
     - Registrar en la hoja `RegistroOperacionesImportacion`: estado de la operación (`Preparada`, `Validada`, `En Ejecución`, `Completada`, `Completada Parcialmente`, `Fallida`, `Pendiente de Recuperación`).
     - Ante interrupciones de red o cuotas de tiempo, registrar con exactitud qué filas se guardaron y cuáles quedaron pendientes.
     - Permitir reanudar la importación completando únicamente los registros faltantes sin duplicar los ya confirmados.
     - Proteger secciones críticas con `LockService` delimitando con precisión la sección de escritura por lotes.
- **Criterios de Aceptación:**
  - [ ] Ejecutar dos veces una importación con la misma clave y contenido crea registros una sola vez.
  - [ ] Reutilizar una clave de importación con contenido modificado es rechazado.
  - [ ] Dos importaciones concurrentes del mismo archivo no generan duplicados.
  - [ ] Interrumpir la operación tras una escritura parcial deja el estado como "Pendiente de Recuperación".
  - [ ] Reintentar la operación interrumpida no duplica las filas confirmadas y completa el lote.
- **Dependencias:** F37-Task01, F37-Task02, F37-Task04.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5646-5683; clave TASK-128; asignación única: Otros -->
### [TASK-128] [F38-Task02] [P0] Creación del catálogo central de metadatos de interfaz y descripciones
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 1 (Infraestructura central de contenidos y claves estables)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getUIMetadataCatalog`, `saveUIMetadataItem`, `ROLE_PERMISSIONS`)
  - `js/ui-common.js`, `js/config.js`
  - Hoja de Cálculo: `MetadatosInterfaz`
- **Subcapacidades Relacionadas:** F38-04, F38-05, F38-06, F38-07.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-04, F38-05, F38-06, F38-07), Matriz CAR-F38-04, CAR-F38-05 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe una estructura central que identifique los campos, controles, acciones y funciones mediante claves estables. Los textos explicativos y placeholders están cableados directamente en el HTML y código JavaScript, provocando duplicación de descripciones, diferencias entre formularios, instrucciones obsoletas y contradicciones en formatos o límites entre distintos módulos de la plataforma.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura persistente y claves estables:*
     - Crear un catálogo central de metadatos consumido por los componentes de interfaz mediante el servicio de usuarios, utilizando como referencia la capacidad de consulta de guías ya implementada (`getHelpGuidesCatalog`).
     - Auto-crear la hoja `MetadatosInterfaz` (`ClaveMetadato`, `Modulo`, `FormularioId`, `CampoControlId`, `TipoElemento`, `EtiquetaVisible`, `DescripcionBreve`, `ExplicacionAmpliada`, `EjemploValido`, `FormatoEsperado`, `EsObligatorio`, `LongitudMinMax`, `RangoValores`, `TiposArchivosTamano`, `RestriccionesReglas`, `ConsecuenciasAccion`, `NivelImportancia`, `AudienciaRolJSON`, `VersionContenido`, `EstadoActivo`).
     - Cada elemento debe disponer de una clave estable, independiente de: su etiqueta visible, texto traducido, posición en el formulario o nombre de variable temporal (ej. `academic.enrollment.student_id`, `accounting.payment.amount`, `gradebook.recovery.score`).
  2. *Diferenciación funcional de tipos de ayuda:*
     - Los metadatos deben diferenciar: ayuda contextual breve (tooltip), instrucción permanente junto al campo, consejo de primera visita (onboarding), explicación de acción sensible, advertencia informativa y referencia a documentación ampliada.
     - Permitir reutilizar descripciones compartidas en varios formularios sin duplicar contenido (ej. campo DNI/Identidad o fecha de nacimiento).
     - Identificar y alertar en la resolución: claves inexistentes (manejo controlado sin romper el formulario), claves duplicadas, referencias a elementos eliminados y descripciones vacías.
  3. *Caché cliente y seguridad de consulta:*
     - En `js/ui-common.js`, recuperar los metadatos de forma agrupada por módulo o formulario y almacenarlos en caché cliente (`sessionStorage`) para evitar llamadas RPC individuales por cada control.
     - Respetar el rol verificado (`getUserVerifiedRole`) impidiendo que un usuario sin privilegios acceda a instrucciones restringidas o datos de configuración interna mediante parámetros manipulados.
  4. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `MODO_CACHE_METADATOS` (`SESSION_STORAGE` vs. `MEMORIA_VOLATIL`) y `RESOLUCION_FALLBACK_CLAVE_INEXISTENTE` (`OCULTAR_SILENCIOSO` vs. `MOSTRAR_PLACEHOLDER_DEV`).
- **Criterios de Aceptación:**
  - [ ] Dos formularios diferentes utilizan el mismo metadato mediante una clave compartida sin duplicar textos.
  - [ ] Renombrar una etiqueta visible en HTML no rompe la asociación con su ayuda contextual.
  - [ ] Una clave inexistente genera un resultado controlado con registro en bitácora sin romper la interfaz.
  - [ ] Los metadatos se consultan por bloques sin realizar solicitudes individuales al servidor por cada celda o input.
  - [ ] Los componentes pueden diferenciar visualmente una ayuda breve de una instrucción permanente.
  - [ ] Las instrucciones de formato, obligatoriedad y límites coinciden exactamente con las validaciones del backend.
  - [ ] La estructura admite incorporar nuevos módulos y entidades sin alterar las definiciones previas.
- **Dependencias:** Infraestructura de backend en `user-service` y catálogo en Google Sheets.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5684-5722; clave TASK-129; asignación única: Otros -->
### [TASK-129] [F38-Task01] [P0] Implementación del motor universal de tooltips contextuales accesibles y adaptativos
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 2 (Infraestructura de presentación contextual accesible)
- **Componentes Afectados:**
  - `js/ui-common.js` (`renderAccessibleTooltip`, `dismissTooltip`, `initContextualTooltips`)
  - Dashboards: `teacher-dashboard.html`, `student-dashboard.html`, `dashboard-direccion.html`, `dashboard-contabilidad.html`
- **Subcapacidades Relacionadas:** F38-01, F38-02, F38-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-01, F38-02, F38-03), Matriz CAR-F38-01, CAR-F38-02, CAR-F38-03 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La plataforma utiliza atributos HTML `title="..."` dispersos. Este mecanismo depende del navegador, no ofrece una experiencia consistente, no resuelve la interacción táctil en smartphones/tablets, no se activa mediante navegación por teclado (`Tab`), carece de asociación semántica para lectores de pantalla (`aria-describedby`) y se corta fuera de los bordes del viewport en resoluciones reducidas o paneles con scroll.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Activación y control multimodal:*
     - *Cursor:* Mostrar ayuda al colocar el cursor sobre el elemento con retardo configurable (300 ms) para evitar aperturas accidentales. Mantener visible la burbuja cuando el cursor se desplace desde el activador hacia ella (hoverable tooltip). Cerrar al abandonar ambos elementos.
     - *Teclado:* Mostrar la ayuda al recibir el foco (`focusin`), manteniendo el foco en el elemento activador. Cerrar con la tecla `Escape` o pérdida de foco (`focusout`) sin desviar el flujo de tabulación ni atrapar al usuario.
     - *Táctil:* En dispositivos táctiles, incorporar un mecanismo explícito mediante un icono informativo discreto (`fa-circle-info`) o control equivalente. Abrir y cerrar mediante toque sin activar la acción principal del botón o input. Cerrar al tocar fuera de la burbuja.
  2. *Posicionamiento adaptativo y prevención de colisiones:*
     - Calcular en tiempo real las coordenadas respecto al elemento activador y al viewport.
     - Posicionamiento inteligente: preferencia superior/inferior con giro automático a lateral si colisiona con los bordes de la pantalla, encabezados fijos o límites de modales (`overflow: auto`).
     - Recalcular posición automáticamente ante eventos de redimensionamiento de ventana o desplazamiento de scroll.
  3. *Accesibilidad universal WCAG 2.2 AA:*
     - Cumplir el criterio 1.4.13 (Contenido al recibir foco o puntero): descartable (Dismissible con Esc), persistente (Hoverable) y desplazable (Persistent).
     - Asociar semánticamente el activador con `aria-describedby="tooltip-[id]"` y asignar `role="tooltip"` al contenedor flotante.
     - Si una explicación requiere enlaces, botones, imágenes o interacción compleja, abrir un popover o panel accesible en lugar de forzar controles interactivos dentro de un tooltip no interactivo.
  4. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `TIEMPO_RETARDO_TOOLTIP_MS` (por defecto 300 ms) y `MODO_TOOLTIP_MOVIL` (Valores: `ICONO_INFO_TACTIL` vs. `PULSACION_LARGA`).
- **Criterios de Aceptación:**
  - [ ] Un campo con metadatos muestra la descripción correcta mediante cursor, teclado (`Tab`) y dispositivo táctil.
  - [ ] Presionar `Escape` cierra la ayuda sin perder el foco en el elemento activador.
  - [ ] El usuario puede mover el cursor hacia la burbuja sin que esta desaparezca accidentalmente.
  - [ ] La burbuja nunca se corta fuera de los bordes de la pantalla ni genera scrollbars accidentales.
  - [ ] La ayuda funciona dentro de modales, tablas, paneles desplazables y controles dinámicos.
  - [ ] Los lectores de pantalla anuncian la descripción asociada mediante `aria-describedby`.
  - [ ] Abrir la ayuda no altera valores ni ejecuta acciones secundarias.
  - [ ] Dos ayudas consecutivas no dejan burbujas superpuestas.
- **Dependencias:** F38-Task02 (catálogo de metadatos).
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5961-5993; clave TASK-137; asignación única: Otros -->
### [TASK-137] [F39-Task06] [P0] Optimización del importador Excel y conversión a registros institucionales
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 6 (Conversión tabular de datos tradicionales con integridad relacional)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `validateImportPreview`)
  - `js/teacher.js`, `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** 3.6.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.6), Matriz CAR-F39-06 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La importación tabular actual selecciona automáticamente la primera hoja de los libros Excel, no maneja adecuadamente encabezados desplazados en filas intermedias y puede sobrescribir datos existentes con celdas vacías al actualizar registros.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Exploración completa del libro Excel:*
     - Mostrar todas las hojas disponibles y permitir seleccionar cuáles importar, con vista previa independiente por hoja.
     - Detectar automáticamente la fila de encabezados o permitir fijarla manualmente (ej. encabezados en fila 5 tras títulos institucionales).
     - Identificar hojas ocultas, celdas combinadas, filas vacías intermedias y fórmulas no calculadas.
  2. *Mapeo interactivo y políticas de celdas vacías:*
     - Interfaz visual de mapeo con coincidencia semántica, selectores manuales y advertencia de obligatorios ausentes.
     - Política explícita de tratamiento de celdas vacías: ignorar valor vacío conservando el dato existente en la base de datos (política predeterminada) vs. vaciar campo únicamente con autorización expresa.
  3. *Actualización segura y reversibilidad:*
     - Comparar valores anteriores y nuevos antes de confirmar actualizaciones.
     - Permitir revertir una importación si no cuenta con transacciones dependientes posteriores.
     - Registrar bitácora completa con archivo fuente, usuario, registros creados, actualizados y rechazados.
- **Criterios de Aceptación:**
  - [ ] Permite seleccionar hojas específicas de un libro Excel con múltiples hojas.
  - [ ] Procesa correctamente archivos con encabezados desplazados en filas posteriores.
  - [ ] Los campos vacíos en el archivo no borran información preexistente en el sistema al actualizar.
  - [ ] Muestra comparativa visual de valores actuales vs. propuestos antes de confirmar.
  - [ ] La reversión de prueba restaura el estado original sin afectar operaciones no relacionadas.
- **Dependencias:** F39-Task03, F39-Task04.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6552-6593; clave TASK-154; asignación única: Otros -->
### [TASK-154] [F41-Task02] [P0] Reanudación idempotente y procesamiento por lotes de importaciones masivas
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 2 (Resiliencia operativa, checkpoints y prevención de duplicados)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `resumeFailedImportBatch`)
  - `backend/academic-service/Code.gs` (`generateInstitutionalId`, `SecuenciasIDs`)
  - Hojas de Cálculo: `AuditoriaMigraciones`, `DetalleRegistrosImportados`
- **Subcapacidades Relacionadas:** F41-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-09), E (E2E-41-10) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Las importaciones interrumpidas no pueden reanudarse de forma segura. Si un archivo de 500 filas falla después de procesar 249 por timeout de Apps Script o desconexión, volver a importarlo procesa todo el archivo desde el inicio, duplicando los registros que ya se guardaron o corrompiendo correlativos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Identificación única de lote y clave idempotente por fila:*
     - Cada importación debe poseer un `ejecucionId` único y permanente (`MIG-timestamp-hash`).
     - El identificador debe mantenerse a lo largo de todos los reintentos.
     - Asignar a cada fila una clave de idempotencia (`idempotencyKey` = hash de datos de la fila + `ejecucionId`).
     - Cuando exista un identificador institucional, utilizarlo para reconocer el registro; la misma fila no debe crear dos registros aunque se reintente múltiples veces.
  2. *Puntos de control (Checkpoints) y procesamiento por bloques:*
     - Registrar el estado individual de cada fila en `DetalleRegistrosImportados`: `pendiente`, `procesando`, `completada`, `omitida`, `rechazada`, `error_recuperable`.
     - Guardar el último punto de control confirmado en `AuditoriaMigraciones` (`ultimoBloqueIndice`).
     - Procesar archivos en bloques controlados (ej. 50-100 filas) confirmando el resultado de cada bloque.
     - Interrupciones en un bloque no invalidan los bloques previos ya confirmados.
  3. *Reintentos progresivos y reanudación selectiva:*
     - Reconocer errores transitorios aplicando reintentos progresivos limitados; no reintentar indefinidamente errores de validación definitivos.
     - Implementar `resumeFailedImportBatch(payload)` para continuar desde las filas pendientes sin reprocesar las completadas.
     - Permitir descargar los registros fallidos con indicación precisa de fila y error para corregirlos y reintentarlos.
  4. *Protección y consistencia de identificadores institucionales:*
     - Coordinar la asignación de identificadores con el bloqueo atómico existente de `LockService` en `generateInstitutionalId`.
     - Una fila reintentada no debe recibir un nuevo ID cada vez que se ejecute.
     - Una reserva de ID no se considera completada hasta que el registro correspondiente sea confirmado en la hoja de destino.
- **Criterios de Aceptación:**
  - [ ] Una importación de 500 filas interrumpida tras procesar 249 puede reanudarse procesando únicamente las filas pendientes.
  - [ ] Las primeras 249 filas no se duplican bajo ninguna circunstancia.
  - [ ] Los identificadores institucionales asignados a registros ya creados permanecen inalterados.
  - [ ] Peticiones repetidas con el mismo identificador de lote o clave de idempotencia devuelven el resultado existente sin duplicar inserciones.
  - [ ] Errores de validación en filas aisladas no bloquean el procesamiento de las filas válidas del lote.
  - [ ] El estado mostrado en pantalla coincide exactamente con los registros confirmados en la base de datos.
- **Dependencias:** F41-Task03, `LockService` y `SecuenciasIDs`.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6594-6636; clave TASK-155; asignación única: Otros -->
### [TASK-155] [F41-Task01] [P0] Motor de reversión selectiva de importaciones masivas (Rollback Seguro)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 3 (Integridad transaccional y reversión con detección de conflictos)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`revertDataImportBatch`, `validateImportRollbackFeasibility`, `previewImportRollbackImpact`)
  - Hojas de Cálculo: `AuditoriaMigraciones`, `DetalleRegistrosImportados`
- **Subcapacidades Relacionadas:** F41-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-10), E (E2E-41-11) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Existe un registro de importaciones en `AuditoriaMigraciones`, pero no hay un mecanismo para revertir los cambios realizados por un lote. Una importación defectuosa puede corromper datos sin forma segura de recuperar el estado anterior. Eliminar a ciegas todas las filas es inaceptable si los registros adquirieron transacciones hijas o modificaciones legítimas posteriores.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Captura previa de instantáneas (Snapshots) por fila:*
     - Antes de modificar cualquier registro en `importDataWithColumnMapping`, registrar en `DetalleRegistrosImportados`: `ejecucionId`, `registroId`, `tipoOperacion` (`INSERT`/`UPDATE`), `valoresAnterioresJSON`, `valoresNuevosJSON`, `camposModificadosJSON`, `fechaHora`, `usuarioResponsable`.
     - Guardar la identidad del registro mediante su identificador institucional estable, no por número de fila.
     - Conservar detalle suficiente para reconstruir el estado anterior sin depender del archivo Excel/CSV original.
  2. *Motor de reversión selectiva:*
     - Desarrollar `revertDataImportBatch(payload)`: Identificar todos los registros afectados por el lote.
     - Distinguir registros creados (INSERT) de registros preexistentes actualizados (UPDATE).
     - Eliminar registros creados por la importación únicamente cuando sea seguro y carezcan de dependencias posteriores.
     - Restaurar los valores anteriores de registros actualizados sin sobreescribir campos no tocados por la importación.
  3. *Detección de dependencias y modificaciones posteriores:*
     - Comparar el estado actual de cada registro con el estado que dejó la importación.
     - Detectar cambios posteriores realizados por usuarios, procesos automáticos o importaciones subsecuentes.
     - Detectar registros vinculados a matrículas, calificaciones, pagos, comprobantes o firmas.
     - Si existe modificación posterior en un campo que se pretende restaurar, generar un conflicto para resolución asistida.
     - Si las modificaciones posteriores afectan campos diferentes, permitir reversión selectiva de los campos sin conflicto.
  4. *Previsualización obligatoria y control de autorización:*
     - Desarrollar `previewImportRollbackImpact(payload)` mostrando: Total de registros a revertir, Registros a restaurar, Registros creados a eliminar, Registros con dependencias bloqueantes, Campos en conflicto y resultado previsto.
     - Restringir la reversión a roles autorizados (`Administrador`, `Director`), exigiendo motivo formal y confirmación explícita auditada.
     - No eliminar el registro original de `AuditoriaMigraciones`; registrar la reversión como un nuevo evento vinculado conservando la trazabilidad completa.
- **Criterios de Aceptación:**
  - [ ] Revertir una importación que solo creó registros los elimina exactamente, siempre que no tengan relaciones hijas posteriores.
  - [ ] Revertir una actualización restaura los valores anteriores exactos preservados en el snapshot.
  - [ ] Modificaciones posteriores sobre los registros son detectadas impidiendo la sobreescritura silenciosa de cambios legítimos.
  - [ ] Si un registro creado tiene una matrícula, nota o pago posterior, se bloquea su eliminación automática y se reporta el conflicto.
  - [ ] Revertir una importación previa no deshace los cambios de una importación posterior sobre el mismo registro.
  - [ ] Repetir una reversión completada no altera nuevamente los datos de la base de datos.
  - [ ] Una importación sin snapshot suficiente no puede revertirse mediante operaciones destructivas improvisadas.
- **Dependencias:** F41-Task02, `AuditoriaMigraciones`.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8114-8142; clave TASK-198; asignación única: Otros -->
### [TASK-198] [ ] [F21-Task11] Seguimiento GPS, visualización de vehículos y estimación de llegada (ETA)
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-26), Sección C (1.10) y Plan de Implementación TAREA 10
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Certidumbre familiar en paradas, telemetría y mapa en tiempo real protegido)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `updateTripLocation`, `getTripLiveLocation`, `reportTripDelay`)
  - Hoja `TransporteTelemetria`
  - `TransporteViajes`
- **Dependencias Expuestas:** `TransporteViajes`, Leaflet / Maps API, `F21-Task02`
- **Descripción del Alcance:**
  No existe captura de coordenadas GPS ni visualización de recorridos activos para las familias.
  Requerimientos Funcionales Detallados:
  1. Telemetría y posición del vehículo:
     - Transmisión periódica de coordenadas desde el dispositivo autorizado del conductor/unidad.
     - Mostrar la hora de la última actualización, diferenciando posiciones recientes, desactualizadas y sin conexión.
     - Visualización del vehículo y secuencia de paradas en un mapa interactivo para tutores autorizados.
  2. Estimación de llegada y retrasos:
     - Calcular tiempo estimado de llegada (ETA) a las paradas pendientes.
     - Botón para que el chofer reporte retrasos imprevistos (tráfico, desvío) con minutos estimados.
     - Finalizar el seguimiento inmediatamente al cerrar el recorrido protegiendo la privacidad vehicular.
- **Criterios de Aceptación:**
  - Se reciben y actualizan coordenadas GPS vinculadas al recorrido activo.
  - Una posición antigua se identifica claramente como desactualizada.
  - El acceso al mapa está estrictamente restringido a los tutores de los alumnos a bordo.
  - El seguimiento se desactiva al completarse el viaje.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8348-8371; clave TASK-207; asignación única: Otros -->
### [TASK-207] [ ] [F21-Task20] Funcionamiento con conectividad intermitente y sincronización de operaciones móviles
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-25), Sección C (1.9) y Plan de Implementación TAREA 19
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Continuidad operativa en ruta sin internet, caché local y sincronización idempotente)
- **Archivos Involucrados:**
  - `js/portal-padres.js` / Interfaz de Conductor
  - `backend/accounting-service/Code.gs` (`recordStudentBoarding`, `recordStudentAlighting`)
- **Dependencias Expuestas:** `F21-Task03`, IndexedDB / LocalStorage
- **Descripción del Alcance:**
  Si el dispositivo del chofer o acompañante pierde señal celular durante el recorrido, no se pueden registrar abordajes ni consultar pasajeros en parada.
  Requerimientos Funcionales Detallados:
  1. Operación offline y sincronización:
     - Descarga previa de la lista de pasajeros y paradas del viaje al iniciar la jornada.
     - Permitir registrar abordajes, descensos e incidencias sin conexión a internet guardándolos en almacenamiento local seguro (`IndexedDB`).
     - Al recuperar conectividad, sincronizar automáticamente los eventos pendientes enviando identificadores únicos idempotentes para evitar duplicaciones.
     - Mostrar en pantalla el indicador de eventos pendientes de sincronizar.
- **Criterios de Aceptación:**
  - Los abordajes y descensos se pueden registrar sin señal celular.
  - Al volver la conexión, los eventos se sincronizan sin duplicados en el servidor.
  - Se distingue visualmente entre eventos locales y confirmados en servidor.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8922-8959; clave TASK-224; asignación única: Otros -->
### [TASK-224] [F23-Task12] [P1] [Resiliencia - Sistema de Reintentos, Colas y Recuperación de Operaciones Interservicio]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task02`, `F23-Task05`, `F23-Task14`.
- **Capacidades Relacionadas:** F23-011, F23-025, F23-026.
- **Problema Detectado:**
  La comunicación actual dispone de un fallback local limitado, pero no existe una política general de reintentos y recuperación para todos los servicios distribuidos.
- **Requisitos Funcionales:**
  1. Incorporar una cola persistente de operaciones pendientes en Google Sheets.
  2. Registrar cada operación con identificador único y estado (`Pendiente`, `EnProceso`, `Fallido`, `Completado`).
  3. Diferenciar errores temporales (red, timeouts) de errores permanentes (403 Forbidden, 400 Bad Request).
  4. Implementar retroceso exponencial (`exponential backoff`) con variación aleatoria (`jitter`).
  5. Establecer un máximo de intentos configurables.
  6. Respetar los tiempos de espera de cada servicio.
  7. Evitar reintentos simultáneos excesivos que saturen las cuotas.
  8. Permitir reanudar operaciones después de una interrupción de ejecución.
  9. Identificar operaciones que requieren intervención administrativa (Dead Letter Queue).
  10. Permitir reintentos manuales autorizados desde panel administrativo.
  11. Evitar que una respuesta tardía genere duplicaciones de datos.
  12. Incorporar una bandeja de operaciones fallidas o pendientes de recuperación.
  13. Registrar el resultado de cada intento en la bitácora.
  14. Incorporar mecanismos de aislamiento temporal (Circuit Breaker) para servicios que presentan fallos repetidos.
  15. Permitir restablecer la comunicación cuando el servicio vuelva a estar disponible.
- **Comportamiento Esperado:**
  Cuando un servicio no responda, la operación deberá permanecer registrada como pendiente o fallida, según corresponda. El sistema podrá recuperarla sin volver a ejecutar acciones ya completadas.
- **Criterios de Aceptación:**
  - [ ] Simular timeout de red y verificar encolamiento en reintentos.
  - [ ] Simular error temporal y comprobar retroceso exponencial.
  - [ ] Simular error permanente y comprobar que no se reintenta indefinidamente.
  - [ ] Comprobar el número máximo de intentos configurados.
  - [ ] Restablecer el servicio caído y reprocesar la operación con éxito.
  - [ ] Comprobar que no se duplican los efectos de una operación completada.
  - [ ] Verificar que una operación irrecuperable queda marcada para intervención manual.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8960-8996; clave TASK-225; asignación única: Otros -->
### [TASK-225] [F23-Task13] [P1] [Observabilidad - Registro Estructurado y Trazabilidad Universal de Eventos con Correlation ID]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task05`.
- **Capacidades Relacionadas:** F23-003, F23-012, F23-025, F23-028.
- **Problema Detectado:**
  Existe registro de eventos y correlation ID, pero no se ha estandarizado su propagación ni su relación con todas las operaciones del motor.
- **Requisitos Funcionales:**
  1. Estandarizar la estructura de eventos de auditoría institucional.
  2. Incluir identificador de evento único.
  3. Incluir identificador de proceso o trámite.
  4. Incluir `correlationId` propagado universalmente en el payload.
  5. Identificar el servicio emisor y el servicio receptor.
  6. Identificar al usuario o proceso automatizado que originó el evento.
  7. Registrar fecha y hora precisa en formato ISO 8601.
  8. Registrar operación, resultado y severidad (`INFO`, `WARN`, `ERROR`, `SECURITY`).
  9. Registrar errores y trazas de excepción sanitizadas.
  10. Propagar el `correlationId` a todos los servicios involucrados en una transacción.
  11. Permitir consultar el recorrido completo de una operación distribuida a través de su identificador de correlación.
  12. Separar los eventos operativos de los datos de negocio sensibles.
  13. Evitar almacenar credenciales, contraseñas, secretos o información confidencial en los logs.
  14. Permitir filtrar eventos por proceso, servicio, usuario, severidad y rango de fechas.
- **Comportamiento Esperado:**
  Una operación que atraviese varios servicios debe poder reconstruirse íntegramente utilizando su identificador de correlación.
- **Criterios de Aceptación:**
  - [ ] Ejecutar una operación entre varios microservicios.
  - [ ] Consultar todos sus eventos y verificar que comparten el mismo `correlationId`.
  - [ ] Simular un error en un servicio secundario y verificar su registro correlacionado.
  - [ ] Comprobar que los logs no exponen credenciales ni secretos.
  - [ ] Consultar eventos filtrados por servicio, severidad y periodo.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8997-9029; clave TASK-226; asignación única: Otros -->
### [TASK-226] [F23-Task14] [P1] [Rendimiento - Procesamiento Asíncrono y Ejecución por Lotes de Operaciones Pesadas]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task12`, `F23-Task13`.
- **Capacidades Relacionadas:** F23-011, F23-025, F23-026.
- **Problema Detectado:**
  Las transiciones pueden ejecutar acciones pesadas dentro de la misma llamada `doPost`, aumentando el riesgo de superar los límites de ejecución de Apps Script (6 minutos).
- **Requisitos Funcionales:**
  1. Separar la confirmación de una transición de las acciones secundarias que pueden diferirse (notificaciones por correo, generación de reportes, emisión de asientos).
  2. Permitir registrar trabajos asíncronos en una cola de despacho.
  3. Dividir operaciones extensas en unidades pequeñas y recuperables.
  4. Incorporar procesamiento por lotes (`batch processing`).
  5. Guardar el avance y puntero de cada trabajo diferido.
  6. Permitir reanudar trabajos interrumpidos por límites de cuota de tiempo.
  7. Establecer límites de procesamiento por ejecución para mantenerse bajo los 6 minutos.
  8. Priorizar operaciones institucionales críticas sobre tareas accesorias.
  9. Evitar que tareas de larga duración bloqueen la respuesta al usuario en el navegador.
  10. Permitir consultar el estado de ejecución de los trabajos asíncronos.
  11. Gestionar errores y reintentos para tareas secundarias fallidas.
  12. Utilizar procesamiento síncrono solamente cuando sea indispensable para garantizar la consistencia inmediata de la operación.
- **Comportamiento Esperado:**
  La aprobación de un trámite debe poder confirmarse sin esperar a que terminen todas las operaciones secundarias, siempre que el contrato del proceso permita ese desacoplamiento.
  Las acciones posteriores deberán quedar registradas y ejecutarse de manera controlada.
- **Criterios de Aceptación:**
  - [ ] Aprobar una operación que genere varias acciones secundarias y comprobar que la respuesta HTTP es inmediata.
  - [ ] Interrumpir deliberadamente un trabajo en ejecución y verificar su reanudación correcta.
  - [ ] Verificar que no se repitan acciones secundarias ya completadas.
  - [ ] Simular una operación que exceda el tiempo de ejecución y comprobar que el estado general refleja el avance pendiente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9171-9230; clave TASK-233; asignación única: Otros -->
### [TASK-233] [F24-Task05] [P1] [Rendimiento y Almacenamiento - DataMart Institucional y Motor de Agregaciones Históricas]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** Diccionario semántico (`F24-Task02`), estandarización de fuentes (`F24-Task04`), límites y rendimiento (`F24-Task06`).
- **Capacidades Relacionadas:** F24-016, F24-017, F24-024.
- **Problema Detectado:**
  Los cálculos actuales recorren hojas transaccionales completas en tiempo real. Esto aumenta los tiempos de consulta y el consumo de cuotas de Google Apps Script. La auditoría identifica la necesidad de incorporar estructuras de agregación que permitan consultar indicadores históricos sin recalcular todos los registros en cada solicitud.
- **Requisitos Funcionales:**
  1. Crear una estructura de almacenamiento de agregados institucionales (`ResumenesIndicadoresHistoricos`).
  2. Incorporar agregaciones para:
     - Matrícula por día, período, grado y sección.
     - Rendimiento por período, asignatura, grado y sección.
     - Aprobación y reprobación.
     - Asistencia y ausentismo.
     - Ocupación de secciones.
     - Ingresos y egresos por período y categoría.
     - Cartera pendiente y recuperada.
     - Ejecución presupuestaria.
     - Indicadores administrativos y operativos.
  3. Incorporar agregaciones diarias y periódicas según la naturaleza del indicador.
  4. Permitir consultar acumulados mensuales, trimestrales, semestrales y anuales utilizando los datos agregados.
  5. Mantener relación entre cada agregado y:
     - Indicador.
     - Período.
     - Fuente.
     - Dimensiones.
     - Versión de fórmula.
     - Fecha de cálculo.
  6. Implementar actualización incremental cuando cambien los registros fuente.
  7. Permitir reconstruir los agregados de un período cuando se detecten inconsistencias (`rebuildAggregatedPeriodData`).
  8. Evitar duplicaciones al ejecutar varias veces un mismo proceso de agregación.
  9. Separar los agregados actuales de los históricos cerrados.
  10. Permitir consultar la fecha y el estado de actualización de cada agregado.
  11. Mantener la posibilidad de contrastar los resultados agregados con los registros originales para auditoría.
- **Cambios Necesarios:**
  - Incorporar las estructuras de almacenamiento para los indicadores agregados en hojas dedicadas.
  - Implementar procesos de consolidación programados mediante activadores Apps Script.
  - Integrar el diccionario de indicadores con el motor de agregación.
  - Incorporar mecanismos de actualización incremental ante eventos transaccionales.
  - Implementar controles de integridad y reconstrucción masiva.
  - Adaptar los informes para consultar agregados cuando sean adecuados y recurrir a datos transaccionales cuando necesiten detalle.
- **Comportamiento Esperado:**
  Los paneles y los informes históricos deben consultar preferentemente los datos agregados disponibles, evitando recorrer repetidamente todas las hojas transaccionales.
  Los informes detallados deben seguir permitiendo acceder a los registros originales cuando el usuario tenga autorización.
- **Criterios de Aceptación:**
  - [ ] Los agregados coinciden exactamente con los cálculos de referencia realizados sobre los registros fuente.
  - [ ] Ejecutar dos veces el mismo proceso de agregación no duplica valores.
  - [ ] Modificar un registro transaccional actualiza los agregados afectados según la estrategia definida.
  - [ ] Los períodos cerrados conservan inalterados sus resultados históricos agregados.
  - [ ] La reconstrucción de un período produce los mismos resultados que el cálculo original.
  - [ ] Cada agregado identifica su fecha de actualización y versión de fórmula.
  - [ ] Un agregado desactualizado no se presenta como vigente ante el usuario.
  - [ ] Los informes detallados siguen recuperando los registros individuales originales.
  - [ ] Las consultas habituales utilizan agregados cuando estos están disponibles y son compatibles con los filtros solicitados.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9231-9278; clave TASK-234; asignación única: Otros -->
### [TASK-234] [F24-Task06] [P1] [Rendimiento y Cuotas - Optimización de Consultas, Paginación y Control de Cuotas GAS]
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** DataMart (`F24-Task05`), catálogo de indicadores (`F24-Task02`), consultas de fuentes normalizadas (`F24-Task04`).
- **Capacidades Relacionadas:** F24-017, F24-002.
- **Problema Detectado:**
  Las consultas que recorren hojas con miles de filas pueden acercarse al límite de ejecución de Google Apps Script (6 minutos). La arquitectura necesita optimizar las operaciones y evitar que informes extensos bloqueen la generación de resultados.
- **Requisitos Funcionales:**
  1. Implementar paginación obligatoria para informes detallados extensos (`page`, `pageSize`, `totalPages`, `totalRecords`).
  2. Evitar recuperar columnas o registros que no sean necesarios para la consulta en memoria.
  3. Utilizar operaciones por lotes en lugar de lecturas celda por celda.
  4. Aprovechar los agregados precalculados del DataMart.
  5. Incorporar caché en memoria (`CacheService`) para consultas repetidas con parámetros equivalentes.
  6. Definir reglas estrictas de invalidación de caché cuando cambien los datos fuente subyacentes.
  7. Incorporar límites configurables para:
     - Registros por página.
     - Volumen máximo de exportación directa.
     - Duración de consultas en tiempo real.
     - Número de operaciones concurrentes con `LockService`.
  8. Identificar consultas pesadas que requieren procesamiento diferido o asíncrono.
  9. Registrar tiempos de respuesta y volumen de datos procesado en cada informe.
  10. Manejar fallos por cuotas o límites de ejecución sin entregar resultados incompletos como definitivos.
  11. Permitir que una consulta extensa pueda continuar mediante procesamiento por lotes cuando sea necesario.
- **Cambios Necesarios:**
  - Optimizar las consultas existentes de informes evitando llamadas redundantes a `getDataRange()`.
  - Incorporar paginación consistente en backend y controles de avance en la interfaz.
  - Integrar caché con el mecanismo de actualización de datos.
  - Utilizar procesamiento por lotes para grandes volúmenes.
  - Incorporar métricas de rendimiento por informe en bitácoras de auditoría.
  - Implementar control de errores y recuperación de consultas interrumpidas.
- **Comportamiento Esperado:**
  Los informes pequeños deben responder directamente. Los informes extensos deben utilizar paginación, agregación o procesamiento por lotes según su volumen.
  La interfaz debe mostrar claramente cuándo una consulta continúa procesándose y cuándo ha terminado.
- **Criterios de Aceptación:**
  - [ ] Recorrer todas las páginas devuelve todos los registros sin omisiones ni duplicaciones.
  - [ ] Los filtros aplicados se mantienen idénticos entre páginas consecutivas.
  - [ ] Las consultas repetidas con mismos parámetros reutilizan resultados válidos en caché.
  - [ ] Una modificación de los datos fuente invalida inmediatamente los resultados en caché.
  - [ ] Los informes extensos no dependen de una única ejecución que exceda los límites del servicio.
  - [ ] Los errores por cuotas se registran y presentan de manera controlada al usuario.
  - [ ] Se registran tiempos de respuesta y cantidades procesadas en los eventos de auditoría.
  - [ ] Las pruebas comparativas demuestran una mejora medible en tiempos de respuesta frente a las consultas originales.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9328-9389; clave TASK-237; asignación única: Otros -->
### [TASK-237] [F24-Task08] [P1] [Exportación Universal - Exportador Universal de Informes CSV y XLSX con Seguridad Anti-Inyección]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Catálogo de informes (`F24-Task01`), permisos existentes, consultas optimizadas (`F24-Task06`).
- **Capacidades Relacionadas:** F24-013, F24-010.
- **Problema Detectado:**
  La exportación actual depende principalmente de la impresión del navegador mediante `window.print()`. Esto no proporciona archivos estructurados adecuados para análisis, procesamiento y reutilización de datos.
- **Requisitos Funcionales:**
  1. Incorporar exportación directa desde el servicio de informes en backend.
  2. Implementar como mínimo:
     - CSV estructurado con codificación UTF-8 y BOM para compatibilidad con Excel.
     - XLSX nativo generado en servidor o binario compatible.
  3. Mantener la impresión o generación PDF existente como opción complementaria.
  4. Exportar los datos resultantes de la consulta autorizada, conservando:
     - Filtros aplicados.
     - Período de referencia.
     - Encabezados descriptivos.
     - Ordenamiento vigente en pantalla.
     - Agrupaciones y jerarquías.
     - Totales y subtotales calculados.
     - Unidades de medida asociadas.
  5. Incorporar nombres de archivo estandarizados y descriptivos (ej. `Informe_Rendimiento_7mo_2026_2026-05-10.csv`).
  6. Permitir exportar informes completos o filtrados según selección del usuario.
  7. Gestionar grandes volúmenes mediante generación por lotes para evitar timeouts.
  8. Incorporar metadatos de generación:
     - Nombre del informe.
     - Fecha y hora de generación ISO.
     - Período consultado.
     - Filtros aplicados.
     - Usuario generador y rol operativo.
  9. Mantener los formatos numéricos y las fechas en estándares internacionales.
  10. Proteger la exportación contra fórmulas maliciosas en archivos CSV y XLSX (sanitización de prefijos `=`, `+`, `-`, `@` para prevenir CSV Injection).
  11. Evitar que se incluyan campos restringidos o confidenciales no autorizados.
  12. Registrar las exportaciones relevantes en la bitácora de auditoría institucional.
- **Cambios Necesarios:**
  - Incorporar un servicio de exportación reutilizable (`exportInstitutionalReportToFile`).
  - Adaptar los informes existentes para producir una estructura de datos exportable normalizada.
  - Implementar generación CSV con escapado seguro y XLSX.
  - Integrar botones de descarga directa en el visor modal actual (`modal-report-viewer`).
  - Incorporar controles de autorización estrictos en el servidor antes de generar archivos.
  - Implementar manejo de archivos temporales y limpieza periódica en Google Drive cuando corresponda.
- **Comportamiento Esperado:**
  El usuario podrá consultar un informe y descargar sus resultados en un formato adecuado para su uso posterior, sin depender de copiar tablas desde el navegador.
  Los archivos deben representar exactamente los datos que el usuario está autorizado a consultar.
- **Criterios de Aceptación:**
  - [ ] Los archivos CSV y XLSX contienen exactamente los mismos registros que la consulta original en pantalla.
  - [ ] Los filtros aplicados en pantalla se conservan reflejados en el archivo exportado.
  - [ ] Los encabezados, totales y subtotales se exportan correctamente.
  - [ ] Los caracteres especiales (tildes, eñes) se conservan intactos en UTF-8.
  - [ ] Los valores numéricos no se convierten incorrectamente en fechas o cadenas corruptas.
  - [ ] Las fórmulas potencialmente peligrosas en campos de texto se neutralizan ante inyección CSV.
  - [ ] Un usuario sin permiso de exportación no puede generar el archivo mediante una petición directa al backend.
  - [ ] La exportación no incluye información fuera del ámbito autorizado del usuario.
  - [ ] Los archivos grandes se generan mediante procesamiento controlado sin timeouts.
  - [ ] Los archivos generados pueden abrirse correctamente con Excel, LibreOffice y herramientas compatibles.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9643-9717; clave TASK-246; asignación única: Otros -->
### [TASK-246] [F25-Task05] [P1] [Rendimiento y Volumen - Procesamiento Fraccionado de Importaciones Masivas]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - Hojas `AuditoriaMigraciones`, `BloquesImportacionLotes`
  - Servicios de Google Apps Script
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Expuestas:** F25-002, F25-003, F25-004, F25-005 y F25-015.
- **Capacidades Relacionadas:** F25-019, F25-002, F25-005.
- **Problema que Resuelve:**
  Las importaciones se ejecutan dentro de una solicitud `doPost`. Los archivos con más de 1,000 registros pueden acercarse al límite de tiempo de ejecución de Apps Script (6 minutos), provocar interrupciones y dejar operaciones incompletas. La solución no debe limitarse a reducir la cantidad de filas admitidas, sino permitir procesar grandes importaciones mediante bloques controlados, con persistencia del avance y recuperación.
- **Requisitos Funcionales:**
  1. Implementar un mecanismo de procesamiento por lotes (`batch processing`).
  2. Creación de la importación:
     - Generar un identificador único de importación (`importacionId`).
     - Registrar el archivo y su origen.
     - Guardar el perfil de mapeo utilizado.
     - Registrar la cantidad de registros detectados.
     - Ejecutar la validación previa.
     - Crear un resumen de registros válidos, inválidos y duplicados.
     - Preparar los bloques de procesamiento.
     - Conservar una referencia al archivo original o representación persistente para reanudar.
  3. Procesamiento por bloques:
     - Utilizar bloques configurables, con un tamaño inicial de referencia de 200 registros.
     - El tamaño debe poder ajustarse según el tiempo real de procesamiento y límites de cuota.
     - Cada bloque debe registrar: `importacionId`, número de bloque, rango de registros, cantidad procesada, cantidad correcta, cantidad fallida, fecha de inicio/fin, estado y último registro confirmado.
  4. Continuación y recuperación:
     - Si la ejecución termina por tiempo, cuota o fallo temporal, conservar el avance confirmado.
     - Identificar los bloques pendientes.
     - Reanudar desde el último punto seguro sin duplicar registros ya aplicados.
     - Registrar el motivo de la interrupción.
     - Permitir consultar el estado y avance de la importación.
     - Evitar que dos ejecuciones procesen simultáneamente el mismo bloque con `LockService`.
  5. Estados de importación:
     - `Preparada`
     - `Validando`
     - `Pendiente de procesamiento`
     - `En ejecución`
     - `Completada`
     - `Completada con errores`
     - `Interrumpida`
     - `Fallida`
     - `Cancelada`
- **Cambios Necesarios:**
  1. Separar la preparación de una importación de su procesamiento definitivo en el backend.
  2. Implementar almacenamiento persistente del estado de cada importación en `BloquesImportacionLotes`.
  3. Dividir los registros en bloques de tamaño configurable.
  4. Incorporar procesamiento reanudable mediante llamadas secuenciales o triggers.
  5. Implementar protección frente a ejecuciones simultáneas con candados atómicos.
  6. Incorporar control de idempotencia por registro individual.
  7. Integrar el avance con `AuditoriaMigraciones`.
  8. Incorporar endpoint de consulta de progreso (`getImportProgress`).
  9. Permitir identificar y recuperar bloques fallidos.
  10. Optimizar las operaciones de lectura y escritura para utilizar procesamiento por lotes.
- **Comportamiento Esperado:**
  Una importación grande debe poder continuar a través de varias ejecuciones sin exigir que todo el procesamiento termine dentro de una sola solicitud.
  El usuario debe poder consultar el progreso y conocer cuántos registros se han procesado, cuántos faltan y cuántos presentan errores.
  Una interrupción no debe provocar duplicación de registros ni pérdida del avance confirmado.
- **Criterios de Aceptación:**
  - [ ] Procesar exitosamente un archivo de 100 registros en un solo bloque.
  - [ ] Procesar exitosamente un archivo de 1,000 registros fraccionado en bloques de 200.
  - [ ] Procesar archivos de mayor volumen en un entorno controlado verificando estabilidad.
  - [ ] Comprobar que los bloques se ejecutan en el orden secuencial esperado.
  - [ ] Interrumpir deliberadamente una importación y verificar que puede reanudarse desde el último bloque completado.
  - [ ] Repetir una solicitud de continuación y comprobar que no duplica registros ya importados.
  - [ ] Intentar ejecutar dos procesos concurrentes sobre el mismo bloque y verificar la protección de exclusión mutua.
  - [ ] Comprobar que los bloques completados conservan su estado inalterado.
  - [ ] Verificar que los errores de un bloque no ocultan ni invalidan los resultados de los bloques exitosos.
  - [ ] Comprobar que la importación termina con un resumen coherente de totales.
  - [ ] Medir tiempos de ejecución y uso de cuotas confirmando márgenes de seguridad.
  - [ ] Verificar que las operaciones no exceden los límites de ejecución sin una estrategia de continuación.
  - [ ] Comprobar que una importación cancelada no continúa ejecutándose automáticamente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9718-9789; clave TASK-247; asignación única: Otros -->
### [TASK-247] [F25-Task06] [P1] [Sincronización - Sincronización y Reconciliación de Información entre Sistemas]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - Hojas `AuditoriaMigraciones`, `CatalogoSpreadsheets`, `SincronizacionFuentesLogs`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** F25-001, F25-004, F25-007 y F25-015.
- **Capacidades Relacionadas:** F25-014, F25-007, F25-015.
- **Problema que Resuelve:**
  La plataforma registra importaciones y operaciones, pero no dispone de un mecanismo completo de reconciliación bidireccional automática. La existencia de conexiones con fuentes externas no garantiza que los cambios realizados en ambos sistemas se mantengan consistentes.
- **Requisitos Funcionales:**
  1. Implementar un mecanismo de reconciliación que permita comparar los registros internos con los de una fuente externa autorizada.
  2. Identificación persistente de registros:
     - Identificador interno.
     - Identificador externo.
     - Fuente de origen.
     - Fecha de última sincronización.
     - Fecha de última modificación conocida.
     - Estado de sincronización.
     - Versión o referencia de la última operación.
     - No utilizar el nombre del estudiante o de otra entidad como única referencia.
  3. Comparación de datos:
     - Identificar registros nuevos en el origen.
     - Identificar registros nuevos en la plataforma.
     - Identificar registros modificados.
     - Identificar registros sin cambios.
     - Identificar registros eliminados externamente.
     - Identificar registros con conflictos.
     - Identificar registros que no pueden asociarse.
  4. Autoridad de los datos:
     - Definir qué sistema tiene autoridad sobre cada campo configurable por entidad y campo.
     - Ejemplo: la plataforma es fuente principal de expedientes; fuente externa es principal de cobros de banco; ciertos campos requieren actualización manual.
  5. Resolución de conflictos:
     - Detectar discrepancias e identificar el valor de cada fuente.
     - Aplicar la regla de autoridad definida.
     - Solicitar revisión manual cuando no exista una regla segura.
     - Registrar la decisión en bitácora.
     - La eliminación externa no debe borrar automáticamente un expediente interno; aplicar políticas de baja histórica y conservación.
  6. Ejecución y recuperación:
     - Permitir sincronización manual y programada autorizada.
     - Registrar el último punto sincronizado (timestamp/token).
     - Detectar cambios incrementales desde la última ejecución sin reprocesar registros sin cambios.
     - Permitir reanudar operaciones interrumpidas.
- **Cambios Necesarios:**
  1. Definir identificadores externos persistentes en los esquemas de datos.
  2. Incorporar hoja `SincronizacionFuentesLogs` para seguimiento de sincronizaciones.
  3. Implementar función de comparación y detección de diferencias (`reconcileExternalSourceData`).
  4. Incorporar reglas de autoridad por fuente y campo.
  5. Implementar resolución de conflictos con cola de revisión manual.
  6. Integrar los resultados con `AuditoriaMigraciones`.
  7. Incorporar consultas de diferencias pendientes en la interfaz administrativa.
  8. Incorporar mecanismos de sincronización incremental cuando el servicio externo los soporte.
- **Comportamiento Esperado:**
  La plataforma debe poder determinar qué información cambió, dónde cambió y qué acción corresponde ejecutar.
  No debe sobrescribir datos internos de manera indiscriminada ni asumir que la información externa siempre es más reciente o más confiable.
- **Criterios de Aceptación:**
  - [ ] Sincronizar registros nuevos desde una fuente externa de forma fluida.
  - [ ] Detectar modificaciones externas e incorporarlas según reglas de autoridad.
  - [ ] Detectar modificaciones internas y no sobrescribirlas por error.
  - [ ] Probar cambios simultáneos en ambos sistemas y verificar detección de conflicto.
  - [ ] Verificar que los conflictos se resuelven según las reglas de autoridad configuradas.
  - [ ] Probar registros eliminados externamente y verificar que se marcan para baja sin borrado físico.
  - [ ] Comprobar que una sincronización repetida no genera registros duplicados.
  - [ ] Interrumpir una sincronización y comprobar que puede reanudarse desde el último punto.
  - [ ] Verificar que cada cambio conserva su fuente, fecha y usuario en auditoría.
  - [ ] Comprobar que los registros pendientes de revisión se identifican y presentan en panel.
  - [ ] Verificar que todas las operaciones quedan registradas en la bitácora.
  - [ ] Comprobar que las fuentes sin permisos de escritura no reciben actualizaciones indebidas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9907-9965; clave TASK-251; asignación única: Otros -->
### [TASK-251] [F27-Task03] [P1] [Recuperación Granular - Centro de Restauración Granular por Hojas, Entidades y Conjuntos Relacionados]
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - Hojas de respaldo JSON en Drive, `RegistroEventos`, `HistorialRestauraciones`
- **Subcapacidades Relacionadas:** F27-003, F27-004.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Motor de respaldos, checksum SHA-256 y protección histórica de calificaciones (`preserveHistoricGrades`).
- **Problema que Resuelve:**
  El motor de respaldos y restauración ya permite crear copias JSON, calcular checksum SHA-256, consultar respaldos y ejecutar restauraciones protegidas mediante confirmación obligatoria `RESTORE-CONFIRMED`. También incorpora protección que conserva calificaciones oficiales. Sin embargo, la restauración opera sobre el conjunto completo de hojas del respaldo y no permite seleccionar de manera controlada una tabla o un grupo de entidades específico (`targetSheets`), limitando la recuperación puntual ante corrupciones aisladas sin sobrescribir información reciente de otras áreas.
- **Requisitos Funcionales:**
  1. Selección granular de restauración por parámetro `targetSheets`:
     - Permitir restaurar todas las hojas, una hoja específica (ej. `targetSheets: ["AsignacionesDocentes"]`), varias hojas seleccionadas o un conjunto lógico de entidades relacionadas.
     - Validar que los nombres de hoja existan en el respaldo y en la estructura actual.
     - Una selección vacía no debe interpretarse jamás como restauración total.
  2. Catálogo y previsualización de elementos recuperables:
     - Consultar contenido del respaldo: nombre de hoja, cantidad de filas, encabezados, versión, checksum y dependencias.
     - Vista previa antes de confirmar mostrando registros a recuperar, registros a conservar, posibles conflictos y diferencias de estructura.
  3. Estrategias de restauración configurables:
     - Reemplazo controlado (sustituir contenido de la hoja autorizada).
     - Fusión (`merge`) basada en identificadores estables sin depender de posición de filas.
     - Recuperación de registros eliminados.
  4. Análisis y advertencia de dependencias entre hojas:
     - Identificar dependencias relacionales (ej. Asignaciones relacionadas con Docentes y Asignaturas; Matrículas con Estudiantes).
     - Advertir si una restauración aislada dejará referencias huérfanas antes de confirmar.
  5. Preservación innegociable de calificaciones históricas oficiales:
     - Mantener `preserveHistoricGrades: true` sobre `CalificacionesEstudiantes` y `RecuperacionesEstudiante`, fusionando notas vivas con el respaldo para no perder calificaciones asentadas con posterioridad.
  6. Integridad criptográfica previa:
     - Validar checksum SHA-256 del archivo JSON antes de procesar; rechazar copias corruptas o adulteradas.
  7. Respaldo de seguridad previo obligatorio:
     - Antes de modificar datos, generar automáticamente una copia de seguridad de las hojas que serán afectadas; si falla la creación de la copia previa, abortar la restauración.
  8. Recuperación ante restauraciones interrumpidas y auditoría:
     - Registrar avance por hoja para permitir reanudar o revertir mediante el respaldo previo.
     - Registrar en `HistorialRestauraciones`: usuario, fecha, archivo respaldo, hojas restauradas, estrategia, registros recuperados/preservados y confirmación administrativa.
- **Cambios Necesarios:**
  - Ampliar `restoreSystemBackup` en `academic-service` para recibir y procesar `targetSheets` y `restoreStrategy`.
  - Incorporar validación de dependencias relacionales en `developer-service`.
  - Implementar generador de respaldo previo automático antes de aplicar cambios.
  - Incorporar vista previa estructurada en el centro de recuperación.
  - Mantener intactas las validaciones de checksum SHA-256 y el código `confirmCode: "RESTORE-CONFIRMED"`.
- **Comportamiento Esperado:**
  Un administrador autorizado puede seleccionar una o varias hojas y recuperar su información sin sobrescribir innecesariamente las demás fuentes. Antes de ejecutar, conoce el alcance real de la operación y cuenta con respaldo previo automático.
- **Criterios de Aceptación:**
  - [ ] Es posible seleccionar una hoja específica del respaldo (ej. `targetSheets: ["AsignacionesDocentes"]`) y restaurarla aisladamente.
  - [ ] Las hojas no seleccionadas en `targetSheets` permanecen 100% intactas sin modificación de datos.
  - [ ] Una selección de hojas inválida o vacía es rechazada antes de modificar cualquier información.
  - [ ] La vista previa identifica con exactitud los elementos y filas que serán modificados.
  - [ ] Las dependencias obligatorias se identifican y advierten antes de ejecutar la restauración.
  - [ ] El checksum SHA-256 del archivo de respaldo se valida obligatoriamente antes de abrirlo.
  - [ ] Un archivo de respaldo corrupto o modificado es rechazado inmediatamente.
  - [ ] La protección de calificaciones históricas oficiales se mantiene activa e inalterable.
  - [ ] Se genera un respaldo de seguridad previo automático de las hojas afectadas antes de escribir.
  - [ ] Si la creación del respaldo previo falla, la restauración se cancela automáticamente.
  - [ ] La operación queda completamente documentada en el historial de auditoría con cantidades de registros afectados.
  - [ ] Un usuario sin rol `Administrador` o `Desarrollador` no puede ejecutar restauraciones.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9966-10023; clave TASK-252; asignación única: Otros -->
### [TASK-252] [F27-Task04] [P1] [Telemetría y Rendimiento - Telemetría Continua y Panel Unificado de Rendimiento por Servicio y Endpoint]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - Hojas `MetricasRendimientoEndpoints`, `RegistroEventos`
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F27-007, F27-001, F27-002.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Registro estructurado (`logStructuredEvent`) y medición de consumo.
- **Problema Detectado:**
  La plataforma cuenta con mecanismos de observabilidad y suites sintéticas de concurrencia, pero el monitoreo del rendimiento depende de pruebas puntuales. Falta telemetría continua que permita identificar cómo se comportan los endpoints y operaciones durante el uso normal de la plataforma: cuáles acciones son más lentas, qué servicios presentan mayor latencia, qué consultas consumen más tiempo en Google Sheets y qué operaciones provocan cuellos de botella.
- **Requisitos Funcionales:**
  1. Instrumentación continua de solicitudes en backend:
     - Registrar por llamada relevante: servicio, acción/endpoint, timestamp, duración en ms, código de respuesta, `correlationId`, operaciones de lectura/escritura a Sheets, llamadas externas y tamaño de respuesta.
     - Sanitizar registros para no capturar contraseñas ni datos sensibles.
  2. Métricas estadísticas de latencia:
     - Calcular sobre ventanas de tiempo: promedio, mínimo, máximo, mediana, percentil 90 (p90), percentil 95 (p95) y percentil 99 (p99).
     - No utilizar únicamente promedios para no ocultar operaciones atípicas lentas.
  3. Métricas de tasas de error:
     - Porcentaje de error por endpoint y servicio diferenciando fallos técnicos de errores de validación funcional.
  4. Detección automática de operaciones lentas:
     - Umbrales configurables por tipo de operación (ej. consulta simple > 1500ms, reporte masivo > 8000ms).
     - Desglosar tiempo consumido en: procesamiento JS, Google Sheets I/O, llamadas HTTP externas.
  5. Trazabilidad de solicitudes distribuidas mediante `correlationId`:
     - Analizar la traza completa de llamadas entre frontend y microservicios con sus duraciones parciales.
  6. Cuadro de mando administrativo de rendimiento:
     - Vistas: resumen general de latencia y errores, rendimiento por servicio, rendimiento por acción, tiempos de acceso a almacenamiento y procesos programados.
     - Filtros por servicio, acción, fecha y rango de latencia.
  7. Detección de anomalías y tendencias:
     - Identificar incrementos repentinos de latencia o picos anormales de solicitudes.
  8. Eficiencia y retención de métricas:
     - Agregación periódica de métricas y depuración controlada para no saturar el almacenamiento de hojas.
- **Cambios Necesarios:**
  - Incorporar interceptores de tiempo en `doPost` de cada microservicio backend.
  - Crear hoja `MetricasRendimientoEndpoints` para almacenar muestras agregadas.
  - Implementar servicio de análisis estadístico en `developer-service` (`getEndpointPerformanceMetrics`).
  - Crear panel visual de telemetría en la interfaz de desarrollador/administrador.
  - Establecer activador diario de agregación y rotación de métricas.
- **Comportamiento Esperado:**
  La plataforma permite identificar qué operaciones presentan problemas de rendimiento y dónde se origina la degradación, distinguiendo si la demora proviene del código interno, de Sheets o de APIs externas.
- **Criterios de Aceptación:**
  - [ ] Las operaciones backend instrumentadas registran su duración exacta en milisegundos.
  - [ ] Las métricas pueden agruparse por servicio, endpoint y ventana temporal.
  - [ ] El sistema calcula mediana, p90 y p95 cuando existe volumen suficiente de datos.
  - [ ] Es posible identificar en el panel las 5 operaciones más lentas del sistema.
  - [ ] Es posible identificar los endpoints con mayor tasa de fallos técnicos.
  - [ ] Las solicitudes distribuidas conservan y propagan su identificador de correlación.
  - [ ] El panel permite filtrar métricas por servicio, acción y rango de fechas.
  - [ ] Es posible comparar el rendimiento antes y después de una actualización o despliegue.
  - [ ] Las operaciones que superan sus umbrales generan eventos de advertencia en observabilidad.
  - [ ] La telemetría no almacena credenciales, tokens ni datos personales sensibles.
  - [ ] El volumen de registros de telemetría se mantiene acotado mediante políticas de retención.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10076-10133; clave TASK-256; asignación única: Otros -->
### [TASK-256] [F28-T03] [P1] Sincronización en Segundo Plano (Background Sync) y Recuperación Automática de Operaciones Pendientes
- **Tipo:** Ampliación de Infraestructura y Resiliencia Offline.
- **Componentes Afectados:**
  - `sw.js` (manejador de eventos `sync` y `periodicsync`)
  - `js/ui-common.js` (`syncOfflineQueue`, `queueOfflineAction`, `processQueueItems`)
  - `js/api.js` (cliente HTTP e inyección de encabezados de idempotencia)
  - IndexedDB store `sync_queue`
- **Subcapacidades Relacionadas:** S01, S02, S03, S04, S05, O02.
- **Estado de Partida:** Implementada parcialmente (Sincronización dependiente de la pestaña abierta y evento `window.online`).
- **Dependencias:** [F28-T01], [F28-T02], IndexedDB, motor de idempotencia en backend.
- **Problema Detectado y Riesgos:**
  Actualmente, si un docente toma asistencia o asigna notas en un aula sin señal, guarda los datos en IndexedDB y cierra el navegador, las operaciones encoladas quedan estancadas hasta que el docente vuelva a abrir intencionalmente la aplicación en una zona con internet. Si el usuario olvida reabrir la app, los registros institucionales no se actualizan en el servidor.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Integración formal con Background Sync API:*
     - Al encolar cualquier acción en `sync_queue` de IndexedDB (`queueOfflineAction`), solicitar el registro de sincronización en segundo plano al Service Worker: `registration.sync.register('sync-institutional-queue')`.
     - En `sw.js`, capturar el evento `sync` correspondiente al tag `'sync-institutional-queue'`.
     - Abrir la base de datos IndexedDB desde el worker, consultar los elementos en estado `'PENDING'` o `'RETRY'` y despacharlos secuencialmente a través de `fetch`.
  2. *Matriz de Compatibilidad y Estrategias Fallback:*
     - Reconocer que la Background Sync API no está disponible en todos los navegadores (ej. Safari en iOS/macOS).
     - Mantener operativas y coordinadas las estrategias redundantes de sincronización:
       a) Evento nativo `window.addEventListener('online')`.
       b) Evento de visibilidad/foco (`visibilitychange` o `window.onfocus`) al volver a interactuar con la app.
       c) Verificación automática al inicio de cada sesión y navegación de ruta.
       d) Disparador de sincronización manual accesible por el usuario: botón "Sincronizar ahora" con spinner de progreso.
     - No asumir jamás que la sincronización en segundo plano está garantizada en entornos sin soporte.
  3. *Estructura Inmutable de la Cola y Ciclo de Vida de Transacciones:*
     - Cada elemento de la cola debe registrar en IndexedDB:
       - `id`: Identificador único UUIDv4 local.
       - `action`: Nombre del endpoint/acción (`saveDailyAttendance`, `saveClassGrade`, etc.).
       - `payload`: Datos de la operación.
       - `authUserId`: Usuario propietario que generó la acción.
       - `institucionId`: Contexto institucional.
       - `timestamp`: Marca temporal de creación en cliente.
       - `intentos`: Contador numérico de reintentos.
       - `maxIntentos`: Límite configurado (predeterminado: 5).
       - `estado`: `'PENDING'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'REQUIRES_INTERVENTION'`, `'FAILED_RECOVERABLE'`, `'FAILED_PERMANENT'`.
       - `ultimoError`: Descripción del error devuelto por la red o backend.
       - `ultimoIntento`: Marca temporal del último despacho.
       - `idempotencyKey`: Clave única para evitar duplicados en el servidor ante caídas de conexión durante la respuesta HTTP.
  4. *Algoritmo de Reintentos con Retroceso Exponencial (Exponential Backoff):*
     - Calcular el intervalo de espera: $espera = base 	imes 2^{intentos} + jitter$ (evitando sobrecarga sincronizada de peticiones).
     - Diferenciar errores transitorios (red caída, timeout 504, 503) de errores definitivos (401 no autorizado, 403 prohibido, 422 validación de negocio).
     - En caso de error definitivo, pausar el reintento automático y transicionar a `'REQUIRES_INTERVENTION'`.
  5. *Orden de Ejecución y Dependencias Causales:*
     - Procesar las transacciones respetando estrictamente el orden causal de creación (FIFO) para operaciones vinculadas al mismo registro o entidad (ej. creación de registro de matrícula previa a la asignación de cuota o cargo).
  6. *Interfaz y Feedback de Sincronización:*
     - Indicador flotante en cabecera: Mostrar badge con el número de operaciones pendientes.
     - Panel desplegable de estado de sincronización: Lista de operaciones en cola, hora de último intento, estado detallado y opción de resolución manual de conflictos o cancelación.
- **Criterios de Aceptación:**
  - [ ] En navegadores compatibles, al encolar una acción offline y cerrar la pestaña, el Service Worker ejecuta la sincronización en segundo plano al recuperar la conexión.
  - [ ] En navegadores sin Background Sync (iOS Safari), la cola se procesa automáticamente al recuperar red o reabrir la aplicación.
  - [ ] Las operaciones sincronizadas actualizan su estado a `COMPLETED` y no se duplican en el backend gracias a la clave de idempotencia.
  - [ ] Las operaciones con dependencias causales se procesan en el orden correcto.
  - [ ] Los fallos de validación o permisos pasan al estado `REQUIRES_INTERVENTION` sin bucles infinitos de reintentos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10134-10175; clave TASK-257; asignación única: Otros -->
### [TASK-257] [F28-T04] [P1] Gestión Inteligente de Almacenamiento Local, Cuotas y Conservación de Datos Pendientes
- **Tipo:** Ampliación de Infraestructura y Resiliencia Offline.
- **Componentes Afectados:**
  - `js/ui-common.js` (módulo de almacenamiento y monitoreo de cuotas)
  - IndexedDB stores (`documents`, `sync_queue`, `offline_cache`)
  - CacheStorage (`caches`)
- **Subcapacidades Relacionadas:** O01, O02, O03, S01, S05.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias:** [F28-T01], [F28-T02], [F28-T03], StorageManager API (`navigator.storage`).
- **Problema Detectado y Riesgos:**
  Los navegadores móviles imponen límites estrictos de cuota para IndexedDB y CacheStorage (que varían según el espacio libre del dispositivo, desde decenas de MB hasta unos pocos GB). Si el almacenamiento local se llena, las escrituras fallan con excepciones de tipo `QuotaExceededError`. Sin una gestión proactiva, podrían perderse borradores recientes o transacciones críticas de asistencia y notas que no alcanzaron a sincronizarse.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Supervisión Proactiva de Cuota con StorageManager API:*
     - Consultar periódicamente `navigator.storage.estimate()` para obtener el espacio utilizado (`usage`) y el límite disponible (`quota`).
     - Solicitar almacenamiento persistente mediante `navigator.storage.persist()` para evitar que el navegador purgue los datos de la aplicación automáticamente ante escasez de espacio en el disco.
  2. *Categorización y Segmentación de Datos Almacenados:*
     - Clasificar el consumo de almacenamiento en 6 categorías bien diferenciadas:
       a) *Cola de Sincronización (`sync_queue`):* Operaciones offline pendientes (Prioridad Máxima de Retención).
       b) *Borradores Locales Aislados:* Datos en edición no confirmados (Prioridad Alta de Retención).
       c) *Datos Institucionales Estructurados:* Catálogos maestros de estudiantes, cursos y asignaturas para consulta offline.
       d) *Documentos y PDF Descargados:* Comprobantes, boletas y circulares cacheadas.
       e) *Caché de Shell y Recursos Estáticos:* HTML, CSS, JS del Service Worker.
       f) *Archivos Temporales y Miniaturas:* Vistas previas de imágenes y blobs procesados.
  3. *Jerarquía y Políticas de Purga Segura ante Cuota Excedida:*
     - **Regla Inquebrantable:** Prohibido purgar o eliminar automáticamente la cola de sincronización (`sync_queue`) ni los borradores pendientes no sincronizados.
     - Ante alertas de cuota (> 80% o error de escritura):
       - Fase 1: Limpiar archivos temporales, blobs en desuso y miniaturas cacheadas.
       - Fase 2: Purgar documentos PDF antiguos descargados que puedan re-descargarse del servidor.
       - Fase 3: Purgar cachés de versiones antiguas de recursos estáticos del Service Worker.
       - Fase 4: Si la cuota continúa en nivel crítico (> 95%), emitir alerta modal al usuario: "Almacenamiento del dispositivo casi lleno. Por favor sincronice sus operaciones pendientes y libere espacio en su equipo".
  4. *Políticas de Caducidad y Limpieza Selectiva:*
     - Establecer expiración TTL (Time-To-Live) para datos institucionales cacheados (ej. refrescar catálogos si tienen más de 7 días).
     - La limpieza durante el cierre de sesión no debe borrar operaciones pendientes en cola ni afectar los datos de otros perfiles de usuario.
- **Criterios de Aceptación:**
  - [ ] El sistema consulta el uso y cuota de almacenamiento en navegadores que soportan `navigator.storage`.
  - [ ] Bajo ninguna circunstancia de limpieza automática se eliminan transacciones pendientes de `sync_queue` ni borradores activos.
  - [ ] El sistema maneja de forma controlada las excepciones `QuotaExceededError` sin provocar pantallazos blancos ni caídas de script.
  - [ ] Los usuarios reciben advertencias comprensibles antes de que el espacio del navegador se agote totalmente.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10232-10272; clave TASK-261; asignación única: Otros -->
### [TASK-261] [F29-Task03] [P1] Motor Declarativo de Mapeo, Transformación y Homologación de Datos
- **Orden de Ejecución:** 3
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `applyDataTransformations`)
  - Catálogos de configuración institucional en `backend/developer-service/Code.gs`
  - Hoja: `PerfilesMapeoMigracion`, `HomologacionCatalogos`
- **Subcapacidades Relacionadas:** F29-03, F29-16.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01], [F29-Task02].
- **Problema Detectado y Riesgos:**
  El mapeo actual permite relacionar columnas de origen con campos de destino, pero carece de un sistema completo de transformación de datos y homologación de catálogos, dificultando importar información de sistemas con formatos de fecha, monedas, nomenclaturas y escalas diferentes.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Perfiles de importación declarativos y versionados:*
     - Definir y guardar perfiles reutilizables por sistema de origen y tipo de entidad.
     - Versionar perfiles para rastrear con qué reglas se ejecutó cada migración histórica.
  2. *Transformaciones configurables de datos:*
     - Fechas y horas (conversión automática entre `DD/MM/YYYY`, `YYYY-MM-DD`, marcas epoch).
     - Monedas y números (separadores de miles/decimales en Lempiras `HNL` y Dólares `USD`).
     - Normalización de texto (nombres, apellidos, limpieza de espacios dobles, mayúsculas/minúsculas).
     - Teléfonos (formato +504), correos electrónicos, estados, valores booleanos y tratamiento de nulos/vacíos.
     - Separación de un campo en varios (ej. nombre completo a primer nombre, segundo nombre, apellidos) y combinación de campos.
  3. *Tablas de homologación de catálogos:*
     - Homologar nomenclaturas de grados, secciones, modalidades, carreras, asignaturas, períodos, tipos de matrícula y estados académicos mediante tablas administrables en hoja `HomologacionCatalogos`.
  4. *Trazabilidad de transformación:*
     - Almacenar el valor original y el valor transformado para fines de auditoría.
     - Vista previa interactiva del resultado transformado antes de confirmar la importación.
  5. *Interoperabilidad con plantillas SACE y formatos estándar:*
     - Completar compatibilidad SACE para importación y exportación bidireccional.
     - Compatibilidad con CSV, Excel (XLSX) y estructuras JSON.
- **Criterios de Aceptación:**
  - [ ] Se importan fechas en diferentes formatos sin alterar su valor cronológico real.
  - [ ] Los importes monetarios en Lempiras se interpretan con exactitud independientemente de separadores.
  - [ ] Nombres equivalentes de asignaturas y grados se homologan mediante catálogos sin alterar código.
  - [ ] Las transformaciones conservan el dato original y el transformado.
  - [ ] Un perfil guardado puede reutilizarse en sucesivas importaciones.
  - [ ] La vista previa muestra el resultado final exacto de las transformaciones.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10339-10367; clave TASK-265; asignación única: Otros -->
### [TASK-265] [F29-Task11] [P1] Motor de Procesamiento por Lotes Paginados y Reanudación de Migraciones
- **Orden de Ejecución:** 11
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`processMigrationChunkAsync`, `getMigrationChunkProgress`)
  - `backend/developer-service/Code.gs`
  - Propiedades del script (`PropertiesService.getScriptProperties()`)
- **Subcapacidades Relacionadas:** F29-02, F29-11, F29-20.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task04], [F29-Task10].
- **Problema Detectado y Riesgos:**
  Las ejecuciones de Apps Script tienen un límite estricto de 6 minutos (360 segundos). Archivos grandes de notas o transacciones abortan a mitad de camino, dejando datos incompletos y bloqueando la migración.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Lotes configurables y segmentación:*
     - Procesar archivos en lotes paginados con tamaño adaptable según la entidad (ej. 100 filas para notas, 50 para transacciones con documentos).
  2. *Persistencia de progreso y reanudación:*
     - Guardar en `PropertiesService` el estado y puntero: `{ ejecucionId, etapa, filaActual, totalFilas, estado }`.
     - Permitir pausar, reanudar y cancelar una migración. Reanudar sin duplicar filas ya confirmadas.
  3. *Control de concurrencia y optimización I/O:*
     - Utilizar `LockService` para evitar que dos ejecuciones simultáneas procesen el mismo lote.
     - Operaciones de lectura y escritura agrupadas por matrices para evitar cuotas de Sheets.
- **Criterios de Aceptación:**
  - [ ] Una migración de 10,000 filas se completa mediante ejecuciones encadenadas sin violar el límite de 6 minutos.
  - [ ] Una interrupción de red permite reanudar desde el último registro confirmado.
  - [ ] Las ejecuciones concurrentes no producen duplicados ni inconsistencias.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10368-10393; clave TASK-266; asignación única: Otros -->
### [TASK-266] [F29-Task12] [P1] Catálogo Maestro de Fuentes y Sistemas de Origen
- **Orden de Ejecución:** 12
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`manageMigrationSourceCatalog`, `getMigrationSources`)
  - Hoja: `CatalogoFuentesMigracion`
- **Subcapacidades Relacionadas:** F29-01, F29-19.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task03], [F29-Task04].
- **Problema Detectado y Riesgos:**
  La bitácora registra nombres de archivos planos, pero no existe un catálogo centralizado que describa las fuentes institucionales, responsables, restricciones de privacidad y condiciones de extracción.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Estructura del catálogo de fuentes:*
     - Columnas: `[fuenteId, nombreSistema, departamentoResponsable, custodioDatos, tipoInformacion, formatosDisponibles, identificadoresClave, volumenEstimado, periodoHistorico, fechaUltimoCorte, frecuenciaActualizacion, restriccionesPrivacidad, ubicacionArchivos, estadoFuente]`
  2. *Gestión del ciclo de vida de fuentes:*
     - Clasificar fuentes como: `Activa`, `Historica`, `Archivada`, `Retirada`.
     - Vincular cada ejecución de migración a una fuente del catálogo.
     - Conservar perfiles de mapeo asociados a cada fuente y trazabilidad de cambios en sus metadatos.
- **Criterios de Aceptación:**
  - [ ] Toda migración ejecutada queda ligada a una fuente formal del catálogo.
  - [ ] Se consulta quién es el custodio de la información y qué datos contiene.
  - [ ] Los metadatos de la fuente se conservan históricamente aunque los archivos cambien.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10394-10419; clave TASK-267; asignación única: Otros -->
### [TASK-267] [F29-Task15] [P1] Ampliación de la Bitácora y Gestión Detallada de Incidencias de Migración
- **Orden de Ejecución:** 15
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`getMigrationLogs`, `exportMigrationFailureSheet`)
  - Hoja: `AuditoriaMigraciones`, `AuditoriaMigracionesDetalle`
- **Subcapacidades Relacionadas:** F29-19.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task04], [F29-Task10], [F29-Task11].
- **Problema Detectado y Riesgos:**
  La bitácora actual almacena un JSON truncado con un máximo de 10 errores. Si un archivo de 2,000 filas tiene 150 errores, los últimos 140 se pierden y no se pueden exportar para su corrección.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Registro granular de incidencias:*
     - Almacenar cada falla en `AuditoriaMigracionesDetalle`: `[ejecucionId, filaNum, idOrigen, entidad, campoAfectado, valorOriginal, valorTransformado, reglaIncumplida, descripcionError, severidad, etapa, estadoResolucion]`.
  2. *Exportación de plantilla de corrección:*
     - Permitir descargar en Excel/CSV todos los registros fallidos conservando sus IDs originales para corrección externa y reimportación incremental.
  3. *Historial completo de intentos y comparativas:*
     - Sin límite de 10 errores; permitir comparar ejecuciones sucesivas de la misma fuente.
- **Criterios de Aceptación:**
  - [ ] Se almacena y consulta el 100% de las incidencias sin truncamiento.
  - [ ] Es posible descargar el listado de filas fallidas para corrección.
  - [ ] Reimportar el archivo corregido procesa únicamente los registros pendientes.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10482-10508; clave TASK-273; asignación única: Otros -->
### [TASK-273] [F29-Task26] [P1] Optimización de Almacenamiento, Métricas de Rendimiento y Escalabilidad
- **Orden de Ejecución:** 26
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`evaluateTransactionalStorageMigrationNeed`, `measureExecutionMetrics`)
  - `backend/accounting-service/Code.gs`
- **Subcapacidades Relacionadas:** F29-20.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01], [F29-Task04], [F29-Task11], [F29-Task13].
- **Problema Detectado y Riesgos:**
  La evaluación actual de migración de almacenamiento solo mide un umbral fijo de 50,000 filas. No considera métricas continuas de latencia de lectura/escritura, frecuencia de consultas ni sobrecarga de cuotas de Apps Script.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Telemetría de rendimiento y cuotas:*
     - Medir tiempos de lectura, escritura, validación y conciliación.
     - Monitorear cuotas de Apps Script y llamadas a servicios externos.
     - Umbrales configurables de advertencia y riesgo.
  2. *Optimización de operaciones masivas:*
     - Consultas paginadas y estructuras de índice eficientes para correspondencias de migración.
     - Criterios multidimensionales (no solo conteo de filas, sino concurrencia y latencia) para justificar la transición a almacenamiento externo (SQL) manteniendo los mismos contratos de servicio.
- **Criterios de Aceptación:**
  - [ ] Se identifican los procesos que consumen mayores recursos y tiempos.
  - [ ] Las consultas grandes operan paginadas sin saturar memoria.
  - [ ] Existe evidencia técnica fundamentada para evaluar transiciones de almacenamiento.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10605-10636; clave TASK-278; asignación única: Otros -->
### [TASK-278] [F30-Task06] [P1] Consola Unificada de Trazabilidad y Correlación de Eventos Interservicios (Trace ID)
- **Orden de Ejecución:** 8
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getCorrelatedTransactionAuditTrace`, `propagateCorrelationContext`)
  - `backend/developer-service/Code.gs`
  - `dashboards/dashboard-direccion.html`, `js/ui-common.js`
- **Subcapacidades Relacionadas:** F30-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-05).
- **Problema Detectado y Riesgos:**
  Los eventos de auditoría se registran en hojas independientes (`LogsSistema`, `RegistroEventos`, `AuditoriaMigraciones`). Rastrear un incidente que atraviesa múltiples microservicios exige cruzar manualmente marcas de tiempo entre distintas hojas, demorando el diagnóstico y la resolución de fallos críticos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Propagación obligatoria del identificador `correlationId`:*
     - Inyectar en cada transacción un identificador de correlación que viaje a través de todas las llamadas entre microservicios y tareas asíncronas.
     - Estructura del evento: `logId`, `correlationId`, `sagaId`, servicio, operación, usuario/proceso, fecha, estado, severidad, duración, código de error y punteros a eventos anterior/posterior.
  2. *Visor unificado de trazabilidad institucional:*
     - Búsqueda avanzada por: `correlationId`, `sagaId`, usuario ejecutor, estudiante/empleado afectado, microservicio, tipo de operación, rango de fechas, severidad y código de error.
     - Vista cronológica ordenada por operación, destacando etapas exitosas, fallidas, reintentadas y compensadas.
     - Identificación visual de operaciones pendientes o sin evento final de confirmación.
  3. *Seguridad de auditoría y paginación:*
     - Aislamiento RBAC: restringir acceso al visor únicamente a Dirección y Administradores de TI.
     - Sanitización obligatoria: prohibido registrar contraseñas, tokens completos o datos bancarios.
     - Soporte para paginación y exportación de reportes de auditoría en formatos estructurados.
- **Criterios de Aceptación:**
  - [ ] Una búsqueda por `correlationId` consolida cronológicamente la totalidad de llamadas interservicios.
  - [ ] Se identifican claramente las etapas fallidas o inconclusas de una transacción.
  - [ ] Los usuarios sin permisos de auditoría no pueden acceder al visor ni manipular parámetros de consulta.
  - [ ] Los filtros y paginación responden con estabilidad sobre volúmenes masivos de registros.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10671-10700; clave TASK-280; asignación única: Otros -->
### [TASK-280] [F30-Task11] [P1] Alertas Tempranas Push ante Degradación y Fallos de Microservicios
- **Orden de Ejecución:** 10
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`dispatchHealthAlertWebhook`, `monitorPlatformHealthThresholds`, `acknowledgeHealthAlert`)
  - Hoja: `AlertasSaludServicios`
- **Subcapacidades Relacionadas:** F30-15.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-15).
- **Problema Detectado y Riesgos:**
  Aunque existen diagnósticos de salud (`getServiceHealthDiagnostics`), no hay un mecanismo automatizado que notifique a los administradores de TI ante caídas o degradaciones de latencia persistentes, dependiendo de la revisión manual periódica del panel de control.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Monitor centralizado de umbrales operativos:*
     - Evaluar periódicamente: disponibilidad, latencia de base de datos, fallos de ejecución, errores de acceso a Google Sheets, bloqueos por concurrencia (`LockService`), cola de tareas pendientes y fallos de notificaciones.
     - Umbrales configurables por microservicio.
  2. *Prevención de tormentas de alertas y despacho multicanal:*
     - Ventanas de observación y filtros de persistencia para evitar alertas innecesarias ante fallos transitorios aislados (ej. exigir 3 fallos consecutivos).
     - Despacho mediante canales configurables: correo electrónico, webhook externo (Slack/Telegram) o mensajería interna, sin hacer obligatorio un proveedor externo privado.
  3. *Ciclo de atención y registro histórico:*
     - Opciones para reconocer, asignar y cerrar alertas.
     - Metadatos registrados: fecha, servicio afectado, indicador disparador, valor observado, umbral, responsable notificado, estado y duración total del incidente.
     - Si la pasarela de notificación externa falla, el incidente debe quedar registrado indefectiblemente en la hoja local de auditoría.
- **Criterios de Aceptación:**
  - [ ] Una degradación persistente genera de forma automática la alerta a los responsables designados.
  - [ ] Las fluctuaciones transitorias aisladas no saturan las bandejas con avisos duplicados.
  - [ ] Los administradores pueden reconocer, dar seguimiento y cerrar las alertas en el panel.
  - [ ] Se conserva el registro histórico completo y la duración de cada incidente de salud técnica.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10701-10731; clave TASK-281; asignación única: Otros -->
### [TASK-281] [F30-Task07] [P1] Gestión de Cuotas y Pasarela Alternativa para Notificaciones Masivas
- **Orden de Ejecución:** 11
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`checkEmailQuotaAvailability`, `sendMultiChannelNotificationWithFallback`, `manageNotificationQueuePriority`)
  - Hoja: `NotificacionesEnviadas`, `ColaNotificaciones`
- **Subcapacidades Relacionadas:** F30-06.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-06).
- **Problema Detectado y Riesgos:**
  Los envíos masivos institucionales (boletines de notas, recordatorios de cobro, comunicados generales) dependen de la cuota diaria de Google Apps Script. Su agotamiento puede paralizar alertas críticas de inasistencia o seguridad escolar.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Administrador centralizado de cuotas de despacho:*
     - Monitoreo continuo de `MailApp.getRemainingDailyEmails()`.
     - Umbral de alerta configurable: valor inicial del 85% de consumo de cuota, sin codificarlo como constante fija (`UMBRAL_ALERTA_CUOTA_CORREO_PORCENTAJE`).
  2. *Cola priorizada por categoría de mensaje:*
     - Niveles de prioridad: Críticas (seguridad/salud), Operativas (matrículas/cobros), Académicas (notas/tareas), Informativas y Masivas.
     - Priorizar envíos críticos impidiendo que los comunicados masivos bloqueen notificaciones urgentes.
  3. *Pasarela alternativa y conmutación segura:*
     - Habilitar pasarela alternativa mediante API SMTP externa como opción configurable cuando exista proveedor institucional autorizado.
     - Si no hay proveedor alternativo habilitado, pausar envíos masivos reteniendo los mensajes en cola segura sin pérdida de información.
     - Reintentos con retroceso exponencial (exponential backoff), control de tasa (rate limiting), deduplicación y reporte de entregas y rechazos.
     - Proteger credenciales de pasarelas externas en almacenamiento seguro del servidor (Script Properties).
- **Criterios de Aceptación:**
  - [ ] El sistema identifica el consumo elevado de cuota y emite advertencia preventiva.
  - [ ] Las notificaciones críticas se despachan prioritariamente frente a campañas masivas.
  - [ ] La conmutación entre canales no genera envíos duplicados ni pérdida de mensajes en cola.
  - [ ] Los administradores pueden pausar, inspeccionar y reanudar la cola de notificaciones.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10761-10791; clave TASK-283; asignación única: Otros -->
### [TASK-283] [F30-Task09] [P1] Tablas de Agregación Precalculadas y Optimización de Consultas Consolidadas
- **Orden de Ejecución:** 13
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`refreshAggregatedMetricsTables`, `getAggregatedDashboardData`)
  - `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`
  - Hojas: `TablasAgregadasAcademicas`, `TablasAgregadasFinancieras`, `TablasAgregadasOperativas`
- **Subcapacidades Relacionadas:** F30-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-09).
- **Problema Detectado y Riesgos:**
  Al superar las 10,000 filas en tablas transaccionales de calificaciones, asistencia o movimientos contables, las consultas consolidadas experimentan latencias de más de 3 segundos, arriesgando timeouts y afectando la experiencia en dashboards de gestión directiva.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Estructuras de agregación precalculadas:*
     - Consolidar indicadores clave por ciclo, grado, sección y departamento: matrícula acumulada, porcentaje de asistencia, rendimiento y reprobación, balance de caja, cuentas por cobrar, ejecución presupuestaria e inventario.
     - Mantener vinculación transparente entre el dato consolidado y las tablas transaccionales de origen.
  2. *Estrategias de actualización y consistencia:*
     - Actualización incremental por eventos, sincronización programada nocturna y reconstrucción completa bajo demanda.
     - Registrar fecha y hora de última agregación (`ultimaActualizacionTimestamp`); reflejar visualmente en pantalla si la información es en tiempo real o corresponde a un corte programado.
     - Mecanismos de detección de discrepancias entre los totales agregados y las transacciones fuente.
     - Optimización de paginación y lecturas por lotes en memoria.
     - Prohibir que los dashboards ejecuten cálculos independientes: deben consumir resultados oficiales de los motores centrales.
- **Criterios de Aceptación:**
  - [ ] Se documenta una reducción medible en los tiempos de respuesta de dashboards a menos de 1 segundo.
  - [ ] Los valores agregados coinciden al 100% con los datos transaccionales de origen.
  - [ ] Una modificación relevante actualiza o invalida los agregados correspondientes.
  - [ ] La reconstrucción de tablas agregadas no altera ni duplica transacciones históricas.
  - [ ] Pruebas ejecutadas con éxito sobre volúmenes representativos mayores a 10,000 filas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10792-10819; clave TASK-284; asignación única: Otros -->
### [TASK-284] [F30-Task18] [P1] Telemetría Sistemática de Rendimiento, Estabilidad y Capacidad Institucional
- **Orden de Ejecución:** 14
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`recordServicePerformanceMetric`, `getServicePerformanceTrendsReport`)
  - Hoja: `MetricasRendimientoServicios`
- **Subcapacidades Relacionadas:** F30-09, F30-15.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-09) y Sección F.
- **Problema Detectado y Riesgos:**
  Aunque existen optimizaciones en Google Apps Script, no se dispone de telemetría sistemática y continua para medir la evolución del rendimiento con el crecimiento del volumen de datos y la concurrencia simultánea, dificultando la detección proactiva de cuellos de botella.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Captura estructurada de telemetría por endpoint:*
     - Registrar por llamada: servicio, acción, tiempo de respuesta (latencia de red percibida), tiempo de ejecución en Apps Script, tasa de errores, reintentos, tiempo de espera en bloqueos (`LockService`), filas procesadas, tamaño del payload y consumo estimado de cuotas.
  2. *Indicadores de rendimiento en operaciones clave:*
     - Consultas individuales, reportes consolidados, matrículas masivas, cierre de actas de notas, generación de nóminas, conciliación bancaria y emisión de boletas.
     - Definir objetivos de rendimiento (SLO) basados en mediciones reales y no en estimaciones arbitrarias.
  3. *Tendencias históricas y comparación entre versiones:*
     - Reportes comparativos de rendimiento antes y después de cada despliegue de versión.
     - Identificación de degradaciones progresivas de tiempo de respuesta para alimentar el backlog de optimización técnica.
- **Criterios de Aceptación:**
  - [ ] Las operaciones críticas generan telemetría sistemática sin penalizar los tiempos de ejecución.
  - [ ] Se identifican con precisión las consultas con mayor latencia y cuellos de botella por concurrencia.
  - [ ] Es posible comparar el rendimiento cuantitativo entre distintas versiones del software.
  - [ ] Los umbrales y objetivos de rendimiento se encuentran debidamente documentados.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11224-11252; clave TASK-298; asignación única: Otros -->
### [TASK-298] [F31-T23] [P1] Banco de Pruebas Documentales y Validación de Fidelidad Multi-Formato
- **Orden de Ejecución:** 17
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs` (`runDocumentDesignerRegressionSuite`)
- **Subcapacidades Relacionadas:** F31-19, F31-20.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección E (DOC-01 a DOC-30) y Backlog de Implementación F31-T23.
- **Problema o Carencia:**
  La plataforma cuenta con 53 pruebas automáticas pasando, pero se necesita un banco de pruebas específico y exhaustivo para validar la fidelidad visual, importación DOCX/PDF, paginación, combinación de datos y generación masiva sin regresiones en actualizaciones futuras.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Banco de archivos de referencia y escenarios obligatorios:*
     - Archivos DOCX de prueba (Word 2013, 2016, 2017): documentos extensos, tablas complejas con celdas combinadas, imágenes ajustadas y encabezados diferenciados.
     - Archivos PDF de prueba: digitales con texto vectorial, escaneados (mapa de bits), páginas rotadas y formularios interactivos.
     - Formularios: validación de obligatoriedad, reglas condicionales AND/OR, campos calculados y recuperación de borradores.
     - Emisión: combinación con variables escalares, secciones repetibles (`{{#each}}`), generación masiva y reintentos ante fallos.
  2. *Automatización y comparación de fidelidad:*
     - Aserciones automatizadas en Node.js y Apps Script para validar contratos, hashes de integridad y consistencia relacional.
     - Verificación de ausencia de pérdidas de contenido, desbordamientos de márgenes y páginas en blanco inesperadas.
     - Registro de resultados vinculados a la versión evaluada.
- **Criterios de Aceptación:**
  - [ ] El banco de pruebas se ejecuta de forma automatizada y reproducible en el entorno de desarrollo y CI.
  - [ ] Cubre la totalidad de los 30 escenarios de la matriz de pruebas funcionales (DOC-01 a DOC-30).
  - [ ] Se detectan e informan regresiones de formato, pérdidas de texto o fallos de cálculo dinámico.
  - [ ] Las pruebas se ejecutan sobre datos sintéticos sin corromper la base de datos de producción.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11253-11280; clave TASK-299; asignación única: Otros -->
### [TASK-299] [F31-T24] [P1] Optimización del Rendimiento y Resiliencia del Procesamiento Documental
- **Orden de Ejecución:** 18
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`optimizeDocumentProcessingMemory`, `monitorDocumentGenerationQuotas`)
  - `backend/developer-service/Code.gs`
- **Subcapacidades Relacionadas:** F31-19.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-19) y Backlog de Implementación F31-T24.
- **Problema o Carencia:**
  El procesamiento de documentos pesados con imágenes de alta resolución o la generación simultánea de múltiples certificados puede provocar saturación de memoria en Google Apps Script o exceder los límites de tiempo de ejecución (6 minutos).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Gestión eficiente de recursos y memoria:*
     - Optimización de carga evitando almacenar documentos completos no utilizados en variables globales de Apps Script.
     - Procesamiento por bloques dimensionados según el consumo real medido de CPU y cuota de Drive.
     - Optimización y compresión ligera de imágenes en cliente antes del envío para previsualización.
     - Limpieza sistemática de archivos temporales generados durante conversiones o empaquetamientos ZIP.
  2. *Resiliencia operativa:*
     - Manejo de reintentos exponenciales ante fallos transitorios de red con Google Drive.
     - Liberación garantizada de bloqueos de concurrencia (`LockService.releaseLock()`) en bloques `finally`.
     - Evitar que la ejecución de un proceso documental masivo bloquee consultas concurrentes de otros usuarios.
- **Criterios de Aceptación:**
  - [ ] Se demuestra la generación estable de documentos con imágenes pesadas sin agotar la memoria de Apps Script.
  - [ ] Las operaciones interrumpidas no dejan bloqueos activos en `LockService` ni archivos temporales huérfanos.
  - [ ] Se documentan las métricas reales de tiempo y consumo de cuota por operación.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11441-11468; clave TASK-306; asignación única: Otros -->
### [TASK-306] [F32-Task11] [P1] Suite Automatizada de Pruebas de Fidelidad Geométrica, Compatibilidad y Regresión PDF
- **Orden de Ejecución:** 9
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs` (`runPdfOverlayFidelityRegressionSuite`)
- **Subcapacidades Relacionadas:** F32-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección F (PDF-01 a PDF-30), Sección G y Backlog F32-Task11.
- **Problema Detectado y Riesgos:**
  La fidelidad de posicionamiento e integridad del PDF no debe depender exclusivamente de revisiones visuales manuales. Se requiere una suite de regresión automatizada que certifique que las actualizaciones de código no introduzcan derivas en las coordenadas ni desalineaciones al generar documentos finales.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Aserciones geométricas y tipográficas automatizadas:*
     - Validar que las coordenadas deserializadas `(xRatio, yRatio, wRatio, hRatio)` mantengan precisión idéntica con tolerancia menor al 0.001%.
     - Validar que variaciones de zoom (0.5x, 1.0x, 2.5x) o de dimensiones de página conserven la posición matemática de los campos.
     - Validar el comportamiento del motor de auto-shrink tipográfico ante cadenas de prueba extensas.
     - Validar renderizado de caracteres españoles y acentos sin corrupción Unicode.
  2. *Verificación de los 30 escenarios obligatorios (PDF-01 a PDF-30):*
     - Carga de PDF válido, corrupto, multipágina, orientación horizontal/vertical, inserción, arrastre, eliminación, duplicación, alineación, autoguardado, obligatoriedad, formatos de fecha, multilínea, firmas, CUV, apertura en visores independientes y control de acceso.
  3. *Detección de regresiones visuales:*
     - Documentos de referencia para comparar coordenadas esperadas vs observadas con umbral de tolerancia estricto.
- **Criterios de Aceptación:**
  - [ ] La suite de pruebas se ejecuta de forma automatizada en Node.js y Apps Script pasando al 100%.
  - [ ] Detecta intencionalmente cualquier desplazamiento introducido en las coordenadas de prueba.
  - [ ] Certifica que los 30 escenarios funcionales de la auditoría se encuentran cubiertos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11503-11540; clave TASK-309; asignación única: Otros -->
### [TASK-309] [F33-Task10] [P1] Suite Automatizada de Pruebas del Ciclo de Vida de Trámites y Regresión
- **Orden de Ejecución:** 4
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs` (`runInstitutionalFormsLifecycleRegressionSuite`)
- **Subcapacidades Relacionadas:** F33-14, F33-16.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección F (F24-01 a F24-24) y Plan de Implementación F33-Task10.
- **Problema Detectado y Riesgos:**
  Las pruebas actuales no se encuentran consolidadas en una suite específica y automatizada que certifique de forma continua que las mejoras en borradores, subsanación granular, bandejas operativas y paquetes no provoquen regresiones en el ciclo de vida de los trámites.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Automatización integral de los 24 escenarios de la matriz F24-01 a F24-24:*
     - F24-01: Configuración de trámites y permisos.
     - F24-02/03: Inicio de trámites como estudiante y como apoderado legal.
     - F24-04: Persistencia y recuperación de borradores multi-dispositivo.
     - F24-05/06: Generación de formularios vacíos e imprimibles limpios.
     - F24-07: Carga y validación de adjuntos seguros.
     - F24-08: Envío oficial e identificador único atómico.
     - F24-09/10: Asignación a bandeja departamental y registro de observaciones internas/públicas.
     - F24-11/12: Subsanación dirigida y reenvío versionado.
     - F24-13/14: Aprobación/rechazo y firmas digitales por token.
     - F24-15: Emisión de PDF definitivo con CUV inmutable.
     - F24-16/17: Historial cronológico completo y archivo de expediente.
     - F24-18: Bloqueo de accesos no autorizados y manipulación de parámetros (IDOR).
     - F24-19/20: Resiliencia ante caídas de red y prevención de duplicados concurrentes.
     - F24-21/22: Modificación de plantillas y desactivación controlada sin alterar históricos.
     - F24-23/24: Consulta responsiva móvil y bandejas de filtrado operativo.
  2. *Pruebas negativas, de concurrencia y regresión:*
     - Validar rechazo ante usuarios sin permisos, tokens expirados, archivos corruptos y estados inválidos.
     - Ejecución sobre datos sintéticos aislados sin contaminar registros reales de producción.
- **Criterios de Aceptación:**
  - [ ] La suite se ejecuta de forma automatizada y reproducible pasando al 100% de aserciones.
  - [ ] Comprueba que los escenarios de inicio, revisión, corrección, aprobación y archivo operan de extremo a extremo.
  - [ ] Se detectan e informan regresiones en permisos RBAC o en la integridad del legajo documental.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11604-11633; clave TASK-312; asignación única: Otros -->
### [TASK-312] [F33-Task06] [P1] Validaciones Cruzadas Institucionales y Detección Inteligente de Trámites Duplicados
- **Orden de Ejecución:** 7
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`validateCrossInstitutionalRequestRules`, `detectDuplicateActiveRequests`)
  - `backend/academic-service/Code.gs`
  - Hoja: `SolicitudesTramites`, `ExpedientesEstudiantes`
- **Subcapacidades Relacionadas:** F33-05, F33-07.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-05, F33-07) y Plan de Implementación F33-Task06.
- **Problema Detectado y Riesgos:**
  Padres o estudiantes pueden enviar reiteradas veces la misma solicitud de constancia o excusa por desconocimiento del estado de su trámite anterior, saturando las colas con solicitudes idénticas activas o ingresando datos contradictorios con el expediente escolar.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Validación cruzada contra datos maestros institucionales:*
     - Contrastar respuestas contra `ExpedientesEstudiantes`, matrículas activas y parentesco registrado en `RelacionesFamiliares`.
     - Clasificar resultados: coincidencia, discrepancia informativa o inconsistencia bloqueante.
     - Comportamiento configurable por campo ante discrepancias (`BLOQUEAR_ENVIO`, `ADVERTIR_USUARIO`, `SOLICITAR_REVISION_ADMINISTRATIVA`).
  2. *Detección inteligente de trámites duplicados activos:*
     - Analizar titular, tipo de trámite, período académico y ventana temporal configurable.
     - Advertir al usuario si ya tiene una solicitud idéntica en estado `Enviada`, `En_Revision` o `Requiere_Informacion`, ofreciendo consultarla en vez de duplicarla.
     - Permitir al personal administrativo marcar un duplicado como legítimo, duplicado confirmado o cancelado con motivo justificado.
     - Concurrencia atómica para evitar que dos envíos simultáneos superen la validación por condición de carrera.
- **Criterios de Aceptación:**
  - [ ] Detecta inconsistencias con el expediente académico y aplica la regla configurada antes del envío.
  - [ ] Identifica solicitudes duplicadas activas y emite advertencia clara al usuario.
  - [ ] Dos envíos simultáneos no generan trámites duplicados no permitidos.
  - [ ] Las validaciones cruzadas no exponen datos privados de otros estudiantes en los mensajes de error.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11870-11899; clave TASK-319; asignación única: Otros -->
### [TASK-319] [F35-Task10] [P1] Perfiles de mapeo reutilizables y configuraciones por origen de datos
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 10 (Eficiencia en cargas recurrentes de fuentes estándar)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`saveImportMappingProfile`, `getImportMappingProfiles`, `deleteImportMappingProfile`)
  - `js/teacher.js`, `teacher-dashboard.html`
  - Hoja de Cálculo: `PerfilesMapeoImportacion`
- **Subcapacidades Relacionadas:** F35-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-14) y Matriz CAR-F35-14.
- **Problema Detectado y Riesgos:**
  No existe un mecanismo para guardar correspondencias y configuraciones. Los usuarios deben configurar repetitivamente las mismas columnas cada vez que reciben archivos periódicos de un banco, proveedor, departamento o fuente oficial (ej. SACE), aumentando la carga operativa y los errores por fatiga.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura persistente de perfiles de mapeo:*
     - Auto-crear la hoja `PerfilesMapeoImportacion` (`PerfilId`, `NombrePerfil`, `EntidadDestino`, `Modulo`, `MapeoColumnasJSON`, `ConfiguracionRegionalJSON`, `ReglasTransformacionJSON`, `Delimitador`, `Codificacion`, `CreadoPor`, `AmbitoUso`, `FechaModificacion`).
     - Permitir almacenar: nombre descriptivo, entidad, correspondencias confirmadas, tipos de datos, configuración regional, delimitador y reglas de duplicados.
  2. *Reutilización automática y detección de variaciones:*
     - Reconocer un perfil por la combinación de entidad, encabezados y estructura del archivo.
     - Aplicar automáticamente las correspondencias guardadas cuando el archivo entrante sea compatible.
     - Detectar cambios en columnas y solicitar confirmación únicamente para los campos modificados, sin invalidar todo el perfil.
     - Permitir perfiles personales y perfiles compartidos institucionalmente con control de permisos.
- **Criterios de Aceptación:**
  - [ ] Un usuario puede guardar un perfil de correspondencias confirmado.
  - [ ] Un archivo recurrente con estructura compatible recupera sus correspondencias automáticamente.
  - [ ] Los cambios en encabezados no provocan asignaciones erróneas y solicitan confirmación puntual.
  - [ ] Los permisos regulan quién puede crear, editar o eliminar perfiles compartidos.
- **Dependencias:** F35-Task02, F35-Task03.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11900-11929; clave TASK-320; asignación única: Otros -->
### [TASK-320] [F35-Task11] [P1] Procesamiento por bloques, control de volumen y recuperación de ejecuciones
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 11 (Escalabilidad y resiliencia ante cuotas de infraestructura GAS)
- **Componentes Afectados:**
  - `js/teacher.js`, `backend/accounting-service/Code.gs` (`processImportChunk`, `importDataWithColumnMapping`)
  - `AuditoriaMigraciones`
- **Subcapacidades Relacionadas:** F35-18, F35-19.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-18) y Matriz CAR-F35-18.
- **Problema Detectado y Riesgos:**
  El importador envía todo el contenido en una única solicitud JSON masiva. Archivos de más de 500 filas pueden agotar memoria o exceder el tiempo máximo de ejecución de Google Apps Script (360 segundos), provocando interrupciones abruptas y dejando lotes en estados inconsistentes.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Segmentación en bloques secuenciales (Chunking):*
     - Implementar procesamiento por bloques para archivos de gran volumen.
     - Utilizar inicialmente bloques de hasta 200 filas como referencia de diseño, ajustables según rendimiento del entorno.
     - Mantener un identificador de ejecución compartido por todos los bloques, registrando total de bloques, número de bloque actual y estado.
  2. *Idempotencia de bloque y reanudación controlada:*
     - Aplicar claves de idempotencia a nivel de bloque para evitar reprocesar lotes ya confirmados.
     - Permitir reanudar una ejecución interrumpida desde el último bloque consistente sin reiniciar desde cero.
     - Proporcionar barra de progreso visual fluida con porcentaje y tiempo estimado.
     - Definir limpieza automática de procesos abandonados y archivos temporales.
- **Criterios de Aceptación:**
  - [ ] Un archivo de más de 500 filas se procesa en bloques secuenciales sin exceder los límites de tiempo de GAS.
  - [ ] Una interrupción no duplica los registros de bloques completados previamente.
  - [ ] La ejecución puede reanudarse desde el último bloque confirmado.
  - [ ] El historial refleja con exactitud el estado y resultado de cada bloque.
- **Dependencias:** F35-Task07.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11930-11959; clave TASK-321; asignación única: Otros -->
### [TASK-321] [F35-Task12] [P1] Conservación del archivo original y evidencia documental de importaciones
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 12 (Auditoría forense y custodia documental en Drive)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`backupImportSourceFile`, `getImportSourceFile`)
  - Google Drive institucional (`Drive/Auditoria/Importaciones/`)
  - Hoja de Cálculo: `AuditoriaMigraciones`
- **Subcapacidades Relacionadas:** F35-19.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-19) y Matriz CAR-F35-19.
- **Problema Detectado y Riesgos:**
  No se conserva el archivo binario original en Google Drive. Ante auditorías contables, reclamos de padres o discrepancias de matrícula, la plataforma no puede comprobar cuál fue el contenido original suministrado, impidiendo deslindar responsabilidades.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Custodia segura en Google Drive y hash SHA-256:*
     - Almacenar una copia del archivo original recibido en una carpeta protegida y privada de Google Drive vinculada a la importación.
     - Registrar: nombre original, tipo MIME, tamaño en bytes, fecha/hora ISO, usuario responsable, ID del archivo en Drive y hash criptográfico SHA-256 del binario original.
     - Calcular el hash antes de cualquier transformación o normalización.
     - Prohibir terminantemente el acceso público al archivo almacenado; restringir su consulta y descarga exclusivamente a usuarios con rol auditor o administrador.
  2. *Políticas de retención y verificación:*
     - Permitir descargar el archivo original desde el historial y comprobar que coincide con el hash SHA-256 registrado.
     - Establecer políticas de retención y registrar formalmente cualquier eliminación autorizada.
- **Criterios de Aceptación:**
  - [ ] Cada importación ejecutada conserva el binario original en Google Drive vinculado a su `ejecucionId`.
  - [ ] El hash SHA-256 permite comprobar la integridad inalterada del archivo original.
  - [ ] Un usuario sin permisos no puede acceder al archivo respaldado.
  - [ ] La copia original se conserva de forma totalmente independiente de los datos normalizados.
- **Dependencias:** F35-Task07.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11960-11994; clave TASK-322; asignación única: Otros -->
### [TASK-322] [F35-Task13] [P1] Catálogo dinámico de entidades importables y reglas específicas por módulo
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 13 (Extensibilidad modular sin duplicación de código)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`registerImportableEntity`, `getImportableEntitiesCatalog`)
  - `#excel-target-module` en `teacher-dashboard.html`
  - Hoja de Cálculo: `CatalogoEntidadesImportables`
- **Subcapacidades Relacionadas:** F35-20.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-20) y Matriz CAR-F35-20.
- **Problema Detectado y Riesgos:**
  El selector de módulos contempla opciones estáticas (Docentes, Secretaría, Contabilidad), pero el backend carece de esquemas dinámicos para definir nuevas entidades importables. Incorporar una nueva entidad requiere programar funciones desde cero, arriesgando duplicación de lógica y brechas de seguridad.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Catálogo centralizado de entidades importables:*
     - Establecer una arquitectura basada en catálogo donde cada entidad importable define:
       * Nombre descriptivo y módulo propietario.
       * Entidad de destino y tabla/hoja receptora.
       * Campos disponibles, obligatorios y tipos de datos.
       * Reglas de validación, identificadores y relaciones obligatorias.
       * Operaciones permitidas (Crear, Actualizar, Omitir).
       * Permisos requeridos según `ROLE_PERMISSIONS`.
       * Condiciones y reglas de reversión segura.
  2. *Reutilización transversal del motor de importación:*
     - Permitir incorporar nuevas entidades (ej. biblioteca, inventario, transporte, notas de aula) aprovechando el mismo flujo de carga, correspondencia, simulación, ejecución e historial, especificando únicamente el esquema de la entidad.
     - Respetar los permisos y validaciones del módulo propietario como autoridad sobre las operaciones.
     - Evitar escrituras en hojas que no estén habilitadas explícitamente en el catálogo.
- **Criterios de Aceptación:**
  - [ ] La interfaz muestra dinámicamente las entidades importables según los permisos del usuario activo.
  - [ ] Cada entidad aplica sus propios campos y validaciones particulares de forma aislada.
  - [ ] Incorporar un nuevo tipo de importación no exige duplicar el asistente ni el motor de procesamiento.
  - [ ] No es posible escribir en entidades no autorizadas mediante manipulación de parámetros.
- **Dependencias:** F35-Task04, F35-Task05.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11995-12027; clave TASK-323; asignación única: Otros -->
### [TASK-323] [F35-Task14] [P1] Asistente guiado de importación y mejora integral de la experiencia de usuario
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 14 (Experiencia interactiva guiada y diseño responsivo móvil)
- **Componentes Afectados:**
  - `#modal-excel-importer` en `teacher-dashboard.html`
  - `js/teacher.js`
- **Subcapacidades Relacionadas:** F35-17.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md` / Sección C (F35-17), Matriz CAR-F35-17 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El modal actual es estático, presenta resúmenes crudos de texto y carece de un flujo guiado. Los usuarios no tienen claridad sobre en qué etapa se encuentran, cómo corregir errores o qué impacto real tendrán las operaciones en la base de datos, además de sufrir desbordamiento visual en dispositivos móviles.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Asistente estructurado en 4 etapas:*
     - Reestructurar el modal `#modal-excel-importer` en un asistente interactivo con barra de avance:
       * *Etapa 1. Archivo y Origen:* Selección de archivo, selector de hoja XLSX, delimitador/codificación CSV, delimitación de encabezados desplazados y muestra previa de filas.
       * *Etapa 2. Correspondencias:* Tabla visual de mapeo interactivo con sugerencias semánticas, ejemplos de celdas, nivel de confianza, exclusión de columnas y alerta de obligatorios pendientes.
       * *Etapa 3. Validación y Simulación:* Matriz de efectos cuantificados (Crear, Actualizar, Omitir, Errores), filtros por categoría, comparador de valores anteriores vs nuevos y opciones de corrección.
       * *Etapa 4. Ejecución y Resultados:* Confirmación explícita con resumen final, barra de progreso en tiempo real, estadísticas finales y descarga inmediata de informe de errores CSV.
  2. *Navegación contextual y diseño adaptable:*
     - Permitir regresar a etapas anteriores conservando íntegras las configuraciones y mapeos ya definidos.
     - Indicador visual claro del estado: Validando, Simulando, Importando o Procesando Resultados.
     - Adaptar tablas y controles a dispositivos móviles y pantallas menores a 768px sustituyendo filas anchas por tarjetas responsivas táctiles.
     - Prohibir que los botones de confirmación se habiliten si existen errores bloqueantes sin resolver.
- **Criterios de Aceptación:**
  - [ ] El usuario completa el flujo guiado de principio a fin sin requerir conocimientos técnicos de base de datos.
  - [ ] No es posible saltar etapas obligatorias sin cumplir sus condiciones de validación.
  - [ ] Regresar a una etapa anterior no borra las correspondencias ni configuraciones confirmadas.
  - [ ] Los errores identifican con claridad la fila y columna con instrucciones precisas de solución.
  - [ ] La interfaz funciona de forma fluida y accesible tanto en ordenadores de escritorio como en teléfonos móviles.
- **Dependencias:** Integración completa de las etapas anteriores (F35-Task01 a F35-Task13).
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12032-12057; clave TASK-324; asignación única: Otros -->
### [TASK-324] [F35-ID-Task06] [P1] Motor de reconstrucción, auditoría y corrección de secuencias
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 6 (Recuperación ante desastres y auditoría de integridad)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`recalculateSequenceCounters`, `auditSequenceIntegrity`)
  - Hoja de Cálculo: `SecuenciasIDs`, `AuditoriaSecuencias`
- **Subcapacidades Relacionadas:** F35-ID-11, F35-ID-15, F35-ID-17.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección E, G y Matriz CAR-ID-17.
- **Problema Detectado y Riesgos:**
  Al restaurar un respaldo antiguo de la hoja de cálculo o tras limpiezas de datos, el contador en `SecuenciasIDs` puede quedar por debajo del mayor identificador realmente emitido. El sistema comenzaría a generar números ya utilizados, provocando colisiones masivas en nuevas altas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Auditoría activa y detección de inconsistencias:*
     - Implementar `auditSequenceIntegrity(payload)` que compare el `UltimoNumero` registrado en `SecuenciasIDs` contra el máximo valor numérico real extraído de las tablas de datos (`Estudiantes`, `MatriculasEstudiantes`, etc.).
     - Alertar de inmediato si el contador almacenado es inferior al mayor emitido (`CONTADOR_DESFASADO_RIESGO_COLISION`).
  2. *Reconstrucción automática segura:*
     - Implementar `recalculateSequenceCounters(payload)` accesible únicamente para Administrador/Director que ajuste `UltimoNumero = max(numerosRealesEmitidos)`, garantizando que la siguiente emisión sea estrictamente superior a todos los códigos existentes.
     - Prohibir terminantemente que la reconstrucción cree registros intermedios o altere registros existentes.
- **Criterios de Aceptación:**
  - [ ] Si se detecta un contador inferior al mayor ID de la base, el sistema emite una alerta bloqueante.
  - [ ] La función de reconstrucción sitúa el contador por encima de todos los identificadores válidos existentes.
  - [ ] La operación de recálculo queda registrada en bitácora con usuario, fecha y valores anterior/nuevo.
- **Dependencias:** F35-ID-Task01, F35-ID-Task02.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12199-12228; clave TASK-329; asignación única: Otros -->
### [TASK-329] [F38-Task03] [P1] Versionado, traducciones y compatibilidad de metadatos
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 5 (Internacionalización, versionado y compatibilidad evolutiva)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getUIMetadataCatalog`)
  - `js/ui-common.js`, `js/config.js`
  - Hoja de Cálculo: `MetadatosInterfaz`
- **Subcapacidades Relacionadas:** F38-06, F38-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-06) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe versionado de textos de ayuda ni soporte estructurado de idiomas. Las descripciones están cableadas en español sin estrategia para actualizar instrucciones sin perder compatibilidad con las preferencias de los usuarios ni para admitir futuras traducciones institucionales.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Versionado semántico de contenidos:*
     - Asociar a cada metadato un número de versión (`versionContenido`) y tipo de cambio: corrección editorial (ortografía, redacción) vs. cambio sustancial (nueva regla, formato modificado, consecuencia crítica).
     - Una modificación editorial no debe reiniciar los consejos de primera visita ya descartados por los usuarios.
     - Un cambio sustancial debe permitir emitir una alerta u orientación específica dirigida exclusivamente a la función modificada.
  2. *Arquitectura de idiomas y reserva controlada:*
     - Separar las claves estables de los textos por idioma (`es_HN`, `en_US`, etc.).
     - Mantener el español como idioma predeterminado y de reserva (*fallback*).
     - Si falta una traducción en un idioma solicitado, resolver automáticamente en el idioma de reserva sin mostrar claves técnicas vacías.
- **Criterios de Aceptación:**
  - [ ] Un metadato puede disponer de descripciones en más de un idioma bajo la misma clave funcional.
  - [ ] La ausencia de una traducción utiliza el idioma de reserva definido sin dejar la ayuda vacía.
  - [ ] Actualizar la redacción de una ayuda no reinicia las preferencias de lectura del usuario.
  - [ ] Un cambio sustancial en una función permite presentar una orientación nueva específica de esa versión.
- **Dependencias:** F38-Task02.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12323-12350; clave TASK-333; asignación única: Otros -->
### [TASK-333] [F38-Task09] [P1] Guía especializada para importaciones masivas de Excel y CSV
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 9 (Orientación paso a paso en ingesta de archivos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getHelpGuidesCatalog`)
  - `js/ui-common.js`, `js/teacher.js`
  - Modal: `#modal-excel-importer`
- **Subcapacidades Relacionadas:** F38-12, F38-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-12), Matriz CAR-F38-12 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El importador masivo puede introducir registros duplicados, desfasar columnas o truncar identificadores si el usuario no comprende las reglas de formato, la asignación de columnas o el significado de la previsualización.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura secuencial de la guía (`GUIDE-EXCEL-IMPORTER`):*
     - *Paso 1: Preparación del Archivo:* Explicar formatos admitidos (XLSX, CSV), límites de tamaño/filas, estructura de encabezados y preservación de ceros a la izquierda.
     - *Paso 2: Carga y Detección:* Selección de hoja, delimitadores y advertencias ante archivos corruptos o protegidos.
     - *Paso 3: Asignación de Columnas:* Correspondencia semántica, identificación de obligatorios y exclusión de columnas irrelevantes.
     - *Paso 4: Validación y Simulación:* Diferenciar registros nuevos (`Crear`), modificados (`Actualizar`), omitidos y errores bloqueantes.
     - *Paso 5: Confirmación y Resultados:* Explicar la irreversibilidad de la inserción, el tratamiento ante interrupciones de red y la descarga del reporte de errores CSV.
- **Criterios de Aceptación:**
  - [ ] La guía está disponible de forma accesible dentro del modal del importador inteligente.
  - [ ] Los formatos y límites descritos coinciden con las validaciones reales del motor de ingesta.
  - [ ] El usuario aprende a distinguir errores bloqueantes de advertencias no críticas.
  - [ ] Se explica el procedimiento de reanudación y corrección ante importaciones interrumpidas.
- **Dependencias:** F38-Task02, F38-Task06.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12872-12910; clave TASK-352; asignación única: Otros -->
### [TASK-352] [F41-Task07] [P1] Normalización inteligente de encabezados y correspondencia de columnas
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 5 (Flexibilidad en la ingesta tabular y soporte multihoja)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateImportPreview`, `importDataWithColumnMapping`)
  - `js/teacher.js`, `teacher-dashboard.html`
  - Hoja de Cálculo: `CatalogoSinonimosEncabezados`
- **Subcapacidades Relacionadas:** F41-01.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-01), E (E2E-41-01) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El importador depende de un diccionario simple y es sensible a posiciones o nombres fijos. Variaciones menores de acentos, mayúsculas, espacios o sinónimos comunes exigen mapeo manual repetitivo. Además, no se gestionan archivos con múltiples hojas ni encabezados desplazados tras filas introductorias.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Normalización ortográfica y sintáctica:*
     - Normalizar encabezados convirtiendo a minúsculas, eliminando tildes, espacios redundantes, guiones y signos de puntuación.
  2. *Diccionario institucional de equivalencias y similitud textual:*
     - Mantener catálogo de equivalencias (`CatalogoSinonimosEncabezados`) para vocabulario de Secretaría, Contabilidad y RRHH (`identidad` = `dni`, `identificacion`, `cedula`, `codigo_estudiante`).
     - Utilizar similitud difusa (Fuzzy Matching) para sugerir mapeos con grado de confianza visible.
     - Diferenciar coincidencias exactas, normalizadas y sugeridas; no asignar automáticamente columnas ambiguas ni asignar dos columnas al mismo campo destino.
  3. *Soporte multihoja y detección de filas de encabezado:*
     - Detectar todas las hojas del libro Excel y permitir seleccionar cuál importar con vista previa independiente.
     - Detectar la fila real de encabezados aunque existan títulos o filas introductorias vacías.
     - Permitir fijar manualmente la fila de encabezados si la detección automática es dudosa.
     - Identificar hojas vacías sin interrumpir el procesamiento de hojas válidas.
  4. *Plantillas de correspondencia reutilizables y previsualización:*
     - Guardar mapeos aprobados como plantillas de importación versionadas para reutilización futura.
     - Previsualización clara: columna original, campo destino, tipo de coincidencia, validación y muestra de datos.
     - Permitir transformaciones controladas antes de importar (normalización de fechas, limpieza de espacios, conversión numérica) sin modificar el archivo fuente.
- **Criterios de Aceptación:**
  - [ ] Encabezados con diferencias de acentos, mayúsculas o espacios se reconocen automáticamente.
  - [ ] Sinónimos institucionales aprobados se mapean sin intervención manual repetitiva.
  - [ ] Columnas desconocidas o ambiguas requieren confirmación y no sobreescriben campos destino.
  - [ ] Permite seleccionar e importar hojas específicas de libros Excel con múltiples hojas.
  - [ ] Archivos con filas introductorias antes de los encabezados se procesan correctamente.
  - [ ] La previsualización refleja exactamente los datos y transformaciones que se aplicarán.
- **Dependencias:** F41-Task02, validación de esquemas de importación.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12990-13031; clave TASK-355; asignación única: Otros -->
### [TASK-355] [F41-Task08] [P1] Calibración del renderizado PDF e impresión multiformato
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 8 (Fidelidad visual, precisión de coordenadas y soporte multiformato)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`previewSchoolDocument`, `generateSchoolDocument`)
  - `js/teacher.js`, `teacher-dashboard.html`
  - Motor de generación PDF en Google Apps Script
- **Subcapacidades Relacionadas:** F41-06.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-06), E (E2E-41-07) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El editor visual utiliza coordenadas porcentuales (`xRatio`, `yRatio`), pero la impresión final y la descarga presentan desalineaciones tipográficas y desplazamientos al utilizar formatos de página distintos a Carta, especialmente en formato A4 u Oficio, o al variar la escala de zoom en el navegador.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Sistema de coordenadas normalizado e independiente de zoom:*
     - Definir sistema de coordenadas absoluto basado en las dimensiones reales de página del PDF de fondo (puntos tipográficos estándar).
     - Garantizar conversión biunívoca exacta entre el editor visual en navegador, la vista previa y el motor de generación PDF.
     - Evitar que variaciones de resolución de pantalla o zoom del usuario alteren las coordenadas guardadas.
  2. *Soporte integral multiformato de página:*
     - Soportar con fidelidad: `Carta (Letter)`, `A4`, `Oficio (Legal)`, tanto en orientación vertical como horizontal.
     - Márgenes configurables e identificación automática del tamaño de página del documento base.
  3. *Control tipográfico y desbordamiento:*
     - Conservar fuente, tamaño, peso, interlineado y alineación. Incrustar fuentes tipográficas seguras para evitar sustituciones arbitrarias.
     - Detectar textos que excedan el área asignada; aplicar auto-ajuste de tamaño de letra o alertar antes de generar el documento.
     - Evitar que campos queden divididos o cortados entre saltos de página.
  4. *Verificación de paridad:*
     - Garantizar que la previsualización en pantalla, el PDF descargado y la impresión física representen exactamente la misma disposición gráfica.
- **Criterios de Aceptación:**
  - [ ] Plantillas en formato Carta, A4 y Oficio conservan la posición exacta de los campos superpuestos.
  - [ ] Cambios de zoom en el navegador no alteran las coordenadas guardadas en la base de datos.
  - [ ] Textos largos no se cortan ni desbordan silenciosamente en los certificados oficiales emitidos.
  - [ ] El PDF descargado coincide visualmente al 100% con la vista previa aprobada por el usuario.
- **Dependencias:** F41-Task06, motor de generación PDF.
- **Estado:** [ ] Pendiente

---
---

# BLOQUE P2: TAREAS DE PRIORIDAD MEDIA, PANELES, INDICADORES Y REPORTES
*Prioridad:* P2 (Media prioridad / Cobertura y gobernanza)
*Total de tareas en este bloque:* 106 tareas.
*Alcance del Bloque:* Dashboards directivos, simulación de impacto de importaciones, reportes verificables con HMAC/SHA-256, centro de diagnóstico y catálogo de plantillas.

---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13062-13077; clave TASK-358; asignación única: Otros -->
### [TASK-358] [ ] [F11-Task18] Desarrollar la suite de pruebas de regresión e integración de la Fase 11
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Fase 11 (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Aseguramiento de calidad)
- **Archivos Involucrados:**
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Suites de pruebas del desarrollador
- **Descripción del Alcance:**
  Incorporar `runPhase11CommunicationWelfareSupervisionAndFinanceRegressionSuite` para verificar automáticamente los contratos y reglas de las 4 áreas de la Fase 11.
- **Criterios de Aceptación:**
  - La suite valida los 18 componentes funcionales de la Fase 11 con 100% de éxito.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13226-13263; clave TASK-364; asignación única: Otros -->
### [TASK-364] [ ] [F15-Task21] Suite integral de pruebas financieras, fiscales y de regresión de la Fase 15
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección J (P2) y Sección F (CA-01 a CA-95)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media-alta (Aseguramiento de calidad, prevención de regresiones e integridad tributaria)
- **Archivos Involucrados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Suites de pruebas del ecosistema, contratos de API de todos los servicios
- **Descripción del Alcance:**
  Implementar la suite integral automatizada `runPhase15FinancialAndBillingRegressionSuite` que valide exhaustivamente los 95 criterios de aceptación (CA-01 a CA-95) y los 10 escenarios integrales (A a J).
  Requerimientos Funcionales Detallados:
  1. Batería de pruebas automatizadas organizadas por áreas:
     - Configuración financiera (conceptos, tarifas, cuotas y validaciones).
     - Generación de cargos (matrículas, mensualidades masivas, duplicados y retiros).
     - Descuentos, becas y recargos por mora.
     - Estados de cuenta individuales y consolidados familiares.
     - Registro de pagos, pagos parciales y liquidación en cascada.
     - Comprobantes bancarios, almacenamiento en Drive y aprobación.
     - Pasarelas de pago y webhooks con idempotencia.
     - Facturación fiscal SAR, exención del 15% de ISV en colegiaturas, CAI y rangos.
     - Notas de crédito, reversión de pagos y reembolsos.
     - Billetera y saldos a favor familiares.
     - Conciliación bancaria, cierres de caja y asientos contables.
     - Notificaciones multicanal y seguridad RBAC/ABAC.
  2. Cobertura de escenarios complejos: simulación de concurrencia de pagos, doble click, cortes de conexión, pagos conjuntos familiares de tres o más estudiantes y retiros a mitad de año lectivo.
  3. Reporte estructurado con porcentaje de éxito, evidencias y detección de regresiones en las fases anteriores (F9, F10, F11).
- **Criterios de Aceptación:**
  - La suite de regresión valida los 95 criterios de aceptación y los contratos de la Fase 15 con el 100% de pruebas satisfactorias.
  - No introduce ninguna regresión en las pruebas de las Fases 9, 10 y 11 (53/53 pruebas actuales permanecen intactas).
- **Estado:** [ ] Pendiente

---

# PENDIENTES - FASE 16: RECURSOS HUMANOS Y ADMINISTRACIÓN DEL PERSONAL


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13374-13406; clave TASK-368; asignación única: Otros -->
### [TASK-368] [ ] [F16-Task12] Desarrollar una suite automatizada de pruebas funcionales, integridad, seguridad y concurrencia de la Fase 16
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección H (P2) y Sección G
- **Prioridad:** P2
- **Severidad/Clasificación:** Media-alta (Aseguramiento de calidad, prevención de regresiones e integridad laboral)
- **Archivos Involucrados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Suites de pruebas del sistema, endpoints de personal, contratos y permisos
- **Descripción del Alcance:**
  Incorporar una suite integral automatizada `runPhase16HumanResourcesRegressionSuite` que valide de manera continua los contratos, vacaciones del Art. 348, desvinculación en cascada, prevención de jerarquías circulares y seguridad ABAC de la Fase 16.
  Requerimientos Funcionales Detallados:
  1. Batería de pruebas por componentes:
     - Expedientes y contratos: creación, deduplicación, renovaciones y cálculo de días para vencer.
     - Estructura organizativa: departamentos, cargos y detección de grafos circulares en dependencias.
     - Roles internos y áreas académicas: asignación múltiple de áreas sin oferta lectiva y delimitación de coordinadores.
     - Onboarding y offboarding: checklist obligatorio y revocación en cascada de accesos/sesiones al desvincular.
     - Vacaciones y asistencia: cálculo de antigüedad por escala legal hondureña, proyección futura y deducción exacta.
     - Seguridad y ABAC: verificación de que roles no autorizados no puedan acceder a expedientes ajenos ni a diagnósticos médicos.
     - Concurrencia e integridad: pruebas de aprobación simultánea de permisos y llamadas repetidas con idempotencia.
  2. Reporte de resultados con desglose de pruebas ejecutadas, casos superados, fallos y tiempo de ejecución.
- **Criterios de Aceptación:**
  - La suite de regresión valida los contratos y reglas de la Fase 16 con el 100% de éxito en entorno controlado.
  - Las pruebas operan sobre datos aislados sin alterar los registros reales de empleados.
  - No se introduce ninguna regresión sobre las suites de pruebas de fases anteriores (Fases 9, 10, 11 y 15).
- **Estado:** [ ] Pendiente

---

# PENDIENTES - FASE 17: PLANILLAS, COMPENSACIONES Y OBLIGACIONES LABORALES


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13411-13443; clave TASK-369; asignación única: Otros -->
### [TASK-369] [ ] [F17-Task13] Implementar una suite automatizada de pruebas de cálculo, integración y regresión de planillas
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección G y Sección H (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media-alta (Aseguramiento de calidad, prevención de regresiones y precisión matemática salarial)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Suites de pruebas del sistema, endpoints de nómina, horas extras y contabilidad
- **Descripción del Alcance:**
  Incorporar una suite integral automatizada `runPhase17PayrollAndCompensationRegressionSuite` que valide de manera continua la exactitud matemática de las planillas, retenciones hondureñas, horas extras, amortización de préstamos y la integración contable.
  Requerimientos Funcionales Detallados:
  1. Batería de pruebas por áreas temáticas:
     - Salarios contractuales: salarios diferenciados por empleado, vigencias contractuales y proporcionalidad en ingresos/salidas intermedias.
     - Horas extras y novedades: recargos del Art. 330 (25% diurna, 50% nocturna), deducciones de tardanzas y permisos sin goce.
     - Deducciones de ley y aportes patronales: techos y alícuotas del IHSS (3.5% obrero / ~7.2% patronal), RAP (1.5% obrero / 1.5% patronal) e INFOP (1.0% patronal).
     - ISR progresivo: proyección anual, deducción médica de L 40,000.00 y aplicación de tramos del Art. 22 de la Ley del ISR.
     - Amortización de préstamos: deducción de cuota y actualización de saldo al cierre sin duplicaciones.
     - Décimo tercer y décimo cuarto mes: cálculo completo y proporcional con anticipos deducidos.
     - Integración contable: verificación de balance por partida doble en el asiento generado (`totalDebe === totalHaber`).
     - Boletas y autoservicio: generación de PDF y aislamiento estricto ABAC frente a accesos ajenos.
  2. Reporte de resultados con desglose de pruebas ejecutadas, métricas de cobertura y prevención de regresiones en las Fases 9, 10, 11, 15 y 16.
- **Criterios de Aceptación:**
  - La suite de regresión valida los cálculos de planilla con 100% de éxito en entorno controlado.
  - Se ejecutan pruebas de estrés con salarios extremos y empleados con múltiples novedades sin desbordamientos aritméticos.
  - Las pruebas operan sobre datos aislados sin alterar las planillas reales de producción.
  - La suite no produce regresiones en las 53 pruebas previas verificadas del sistema.
- **Estado:** [ ] Pendiente

---

# PENDIENTES - FASE 18: COMPRAS, PROVEEDORES Y CONTRATACIÓN DE SERVICIOS


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14008-14030; clave TASK-389; asignación única: Otros -->
### [TASK-389] [ ] [F21-Task28] Importación y exportación de datos de rutas, paradas y padrón de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.21) y Plan de Implementación TAREA 27
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Productividad administrativa, carga masiva de inicio de ciclo y migración segura)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `importTransportAssignmentsCSV`, `exportTransportRoster`)
  - `TransporteAsignaciones`
  - `TransporteParadas`
- **Dependencias Expuestas:** `TransporteAsignaciones`, `F21-Task01`
- **Descripción del Alcance:**
  No se pueden cargar ni descargar masivamente las asignaciones de transporte al inicio de ciclo, obligando a digitación manual individual.
  Requerimientos Funcionales Detallados:
  1. Importación estructurada por CSV/Excel:
     - Validar previamente identificadores de alumnos, rutas y cupos disponibles antes de procesar el archivo.
     - Mostrar vista previa con resumen de filas válidas y reporte de errores por fila.
     - Exportar el padrón oficial de pasajeros con datos de contacto y paradas.
- **Criterios de Aceptación:**
  - Se importan asignaciones masivas con validación previa de cupos.
  - Se reportan y bloquean filas con identificadores erróneos o rutas inexistentes.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14273-14304; clave TASK-399; asignación única: Otros -->
### [TASK-399] [F23-Task22] [P2] [Monitoreo y Salud - Supervisión de Disponibilidad y Salud de Servicios Distribuidos]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** `CatalogoServicios`, `F23-Task04`, `F23-Task05`.
- **Capacidades Relacionadas:** F23-024, F23-026.
- **Problema Detectado:**
  Existe una herramienta de supervisión parcial, pero no ofrece una visión completa de la disponibilidad de todas las cuentas y servicios registrados.
- **Requisitos Funcionales:**
  1. Consultar periódicamente la disponibilidad y latencia de cada microservicio registrado (Health Check).
  2. Verificar la comunicación bidireccional con cada endpoint Apps Script.
  3. Comprobar la validez de la autenticación HMAC y autorizaciones de acceso.
  4. Identificar fallos de acceso o errores de permisos hacia los Spreadsheets subyacentes.
  5. Registrar tiempos de respuesta y latencia de red.
  6. Clasificar el estado del servicio en: `Disponible`, `Degradado`, `Desconectado`, `ErrorAutenticacion`.
  7. Registrar fecha y hora de la última comunicación exitosa con cada nodo.
  8. Identificar patrones de fallos continuos o intermitentes.
  9. Notificar inmediatamente a los administradores ante caídas de servicios críticos.
  10. Mostrar un panel centralizado de salud de infraestructura distribuida en tiempo real.
  11. Permitir consultar el historial cronológico de incidentes por servicio.
  12. Detectar servicios que dejaron de responder tras un nuevo despliegue o rotación de credenciales.
- **Comportamiento Esperado:**
  El administrador podrá identificar qué servicios funcionan, cuáles tienen problemas de autorización y cuáles están completamente desconectados.
- **Criterios de Aceptación:**
  - [ ] Supervisar dos servicios pertenecientes a cuentas de Google diferentes.
  - [ ] Simular la desconexión de uno de ellos y verificar su detección y marcación como `Desconectado`.
  - [ ] Restablecer el servicio y verificar la actualización automática a `Disponible`.
  - [ ] Simular un error de clave HMAC y verificar que se distingue de una caída física de red.
  - [ ] Consultar el panel central de salud y el historial de eventos de disponibilidad.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14305-14339; clave TASK-400; asignación única: Otros -->
### [TASK-400] [F23-Task23] [P2] [Rendimiento y Cuotas - Optimización del Motor de Flujos y Consumo de Cuotas de Google Apps Script]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task03`, `F23-Task12`, `F23-Task14`.
- **Capacidades Relacionadas:** F23-011, F23-009, F23-014.
- **Problema Detectado:**
  Las operaciones sincrónicas, las consultas repetidas y el almacenamiento centralizado pueden generar contención, consumo elevado de cuotas y fallos por límites de ejecución.
- **Requisitos Funcionales:**
  1. Medir y supervisar el consumo de recursos por servicio y cuenta propietaria (llamadas `UrlFetchApp`, operaciones `SpreadsheetApp`, triggers).
  2. Registrar tiempos de ejecución de cada endpoint Apps Script.
  3. Reducir lecturas y escrituras redundantes utilizando arreglos en memoria y operaciones por lotes.
  4. Agrupar operaciones compatibles en una única llamada de almacenamiento.
  5. Utilizar caché en memoria (`CacheService`) exclusivamente para datos cuya consistencia eventual sea admisible.
  6. Implementar paginación obligatoria en consultas extensas de trámites y bandejas de trabajo.
  7. Evitar recuperar todas las filas de la hoja para renderizar vistas de pendientes.
  8. Procesar lotes con límites de tamaño adaptativos.
  9. Supervisar bloqueos de concurrencia y tiempos de espera en `LockService`.
  10. Distribuir la carga de I/O entre múltiples particiones de Spreadsheets según el catálogo institucional.
  11. Incorporar indicadores de consumo y alertas tempranas por proximidad al 80% de las cuotas diarias de Google.
  12. Permitir configurar umbrales de advertencia personalizados por servicio.
  13. Diferenciar límites por usuario, por proyecto Apps Script y por cuenta de Google Workspace.
  14. Evitar que la distribución de cuentas se utilice indebidamente para evadir políticas o restricciones de Google.
- **Comportamiento Esperado:**
  El sistema deberá mantener un rendimiento estable, identificar los servicios sobrecargados y distribuir operaciones cuando la arquitectura y las autorizaciones lo permitan.
- **Criterios de Aceptación:**
  - [ ] Ejecutar pruebas de carga sintéticas y medir tiempos de respuesta y llamadas a Google APIs.
  - [ ] Comprobar que las consultas paginadas reducen drásticamente la transferencia de datos innecesarios.
  - [ ] Simular límites de ejecución de 6 minutos y comprobar que los trabajos extensos se fraccionan de forma reanudable.
  - [ ] Comparar métricas de consumo de celdas y tiempo de ejecución antes y después de la optimización.
  - [ ] Verificar que el uso de caché no genera inconsistencias en estados de decisiones críticas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14778-14831; clave TASK-410; asignación única: Otros -->
### [TASK-410] [F24-Task20] [P2] [Interoperabilidad - API de Consulta y Exportación Estructurada de Indicadores Institucionales]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Diccionario (`F24-Task02`), catálogo (`F24-Task01`), filtros (`F24-Task03`), fuentes normalizadas (`F24-Task04`), paginación y rendimiento (`F24-Task06`).
- **Capacidades Relacionadas:** F24-A08, F24-008.
- **Problema Detectado:**
  Los servicios existentes devuelven estructuras JSON, pero no se ha identificado una capa institucional estandarizada para consumir indicadores e informes desde otras herramientas autorizadas.
- **Requisitos Funcionales:**
  1. Estandarizar la interfaz de programación y formato de respuestas JSON para consulta de indicadores analíticos.
  2. Permitir la consulta de métricas utilizando los identificadores semánticos definidos en el diccionario institucional.
  3. Incorporar parámetros de consulta universales y normalizados:
     - `periodo` / `anoLectivo`.
     - `filtros` (grado, seccion, departamento, cuenta).
     - `agrupacion` (porGrado, porMes, porDepartamento).
     - `paginacion` (`page`, `limit`).
     - `ordenamiento` (`campo`, `direccion`).
  4. Devolver en cada respuesta estructurada:
     - Identificador del indicador.
     - Valor cuantitativo o serie de datos.
     - Unidad de medida oficial.
     - Período evaluado.
     - Marca temporal de última actualización.
     - Fuente o servicio de datos participante.
     - Versión semántica de la definición aplicada.
  5. Incorporar validación estricta de permisos de acceso en base a tokens HMAC y roles RBAC autorizados.
  6. Registrar en bitácora de seguridad todas las consultas de la API analítica.
  7. Incorporar límites adaptativos de volumen y frecuencia de consulta (rate limiting) para proteger las cuotas de Google Apps Script.
  8. Permitir exportación estructurada en JSON schema estandarizado para sistemas externos autorizados.
  9. Versionar explícitamente los contratos de respuesta de la API para garantizar compatibilidad hacia atrás.
  10. Evitar estrictamente la exposición de identificadores internos sensibles, contraseñas o datos personales en las respuestas analíticas.
- **Cambios Necesarios:**
  - Crear una capa de despacho estructurada en el backend (`getInstitutionalIndicatorApi`).
  - Integrar el diccionario semántico con los contratos de la API.
  - Estandarizar las respuestas de error y códigos de estado (400, 401, 403, 404, 429, 500).
  - Incorporar middleware de validación de cuotas y permisos.
  - Documentar formalmente los endpoints analíticos en las especificaciones del sistema.
- **Comportamiento Esperado:**
  Los componentes autorizados podrán consultar indicadores institucionales mediante una estructura común, sin tener que conocer la implementación interna de cada servicio.
- **Criterios de Aceptación:**
  - [ ] Las respuestas de la API cumplen estrictamente con la especificación JSON documentada.
  - [ ] Los indicadores se consultan de forma fidedigna mediante sus identificadores institucionales oficiales.
  - [ ] Los parámetros de filtro y períodos se aplican correctamente sobre las consultas.
  - [ ] Los permisos institucionales se validan en el servidor antes de despachar información.
  - [ ] Las consultas de gran volumen respetan los límites de paginación y cuotas establecidos.
  - [ ] Los contratos de respuesta están debidamente versionados.
  - [ ] Las respuestas analíticas no exponen datos sensibles o no autorizados.
  - [ ] Los valores devueltos por la API coinciden exactamente con los informes que utilizan los mismos parámetros.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14892-14951; clave TASK-413; asignación única: Otros -->
### [TASK-413] [F25-Task08] [P2] [Arquitectura de Conectores - Arquitectura Común de Conectores Externos]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - Hojas `CatalogoContratos`, `CatalogoServicios`, `CatalogoIntegracionesExternas`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** F25-001, F25-015 y F25-016.
- **Capacidades Relacionadas:** F25-012, F25-013, F25-016.
- **Problema que Resuelve:**
  Las integraciones están implementadas mediante controladores independientes en diferentes servicios. Aunque esto permite que funcionen por separado, puede producir diferencias en la gestión de credenciales, estados, errores, registros, versiones y operaciones comunes.
- **Requisitos Funcionales:**
  1. Establecer una estructura común de conectores que permita incorporar servicios externos sin repetir la lógica transversal.
  2. Definir en cada conector:
     - Identificador del conector.
     - Proveedor y tipo de servicio.
     - Versión del conector.
     - Operaciones admitidas.
     - Métodos de autenticación y autorización.
     - Configuración necesaria y dependencias.
     - Estados posibles.
     - Formato de solicitudes y respuestas.
     - Tratamiento de errores y estrategia de reintentos.
     - Registro y trazabilidad de operaciones.
  3. Operaciones comunes estandarizadas:
     - Validar configuración.
     - Probar conexión (`testConnection`).
     - Consultar estado (`getStatus`).
     - Ejecutar operación (`executeOperation`).
     - Procesar respuesta y registrar resultado.
     - Deshabilitar conexión y revocar autorización.
  4. Separación de responsabilidades:
     - Separar configuración, autenticación, transporte de red, transformación de datos, validación y trazabilidad.
     - Los servicios funcionales deben seguir siendo responsables de sus reglas de negocio (ej. un conector de pago entrega una transacción validada, pero el servicio financiero aplica los asientos y saldos).
- **Cambios Necesarios:**
  1. Definir un contrato común para conectores en `developer-service`.
  2. Identificar y modularizar la lógica repetida en los servicios existentes.
  3. Separar la lógica transversal de la lógica específica de cada proveedor.
  4. Adaptar progresivamente las integraciones existentes hacia el contrato común.
  5. Relacionar conectores con `CatalogoIntegracionesExternas`.
  6. Relacionar versiones con `CatalogoContratos`.
  7. Centralizar el registro de operaciones y errores.
- **Comportamiento Esperado:**
  Los conectores deben operar con una estructura predecible y compartir los mecanismos comunes de configuración, seguridad, monitoreo y recuperación.
  La incorporación de un nuevo proveedor no debe exigir duplicar los mecanismos de autenticación, registro o administración que ya existen.
- **Criterios de Aceptación:**
  - [ ] Identificar y abstraer las operaciones comunes entre los conectores existentes.
  - [ ] Definir el contrato común de conectores en `CatalogoContratos`.
  - [ ] Adaptar al menos un conector existente (ej. pasarela de pago o SACE) como implementación de referencia.
  - [ ] Verificar que el conector adaptado conserva su comportamiento anterior sin regresiones.
  - [ ] Comprobar que el catálogo puede identificar dinámicamente las capacidades del conector.
  - [ ] Verificar que los errores se registran de manera uniforme en la bitácora central.
  - [ ] Comprobar que las credenciales permanecen protegidas y aisladas.
  - [ ] Verificar que un conector puede deshabilitarse sin afectar el funcionamiento de otros.
  - [ ] Comprobar que los servicios funcionales conservan la totalidad de sus reglas de negocio.
  - [ ] Verificar que agregar un nuevo conector no requiere duplicar la infraestructura transversal.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14952-15002; clave TASK-414; asignación única: Otros -->
### [TASK-414] [F25-Task09] [P2] [Optimización de E/S - Optimización de Lectura y Escritura por Lotes en Integraciones]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
  - Funciones `batchSpreadsheetReadOperations`, `importDataWithColumnMapping`
- **Estado de Partida:** Mejora complementaria sobre capacidades existentes.
- **Dependencias Expuestas:** F25-005, F25-007 y F25-019.
- **Capacidades Relacionadas:** F25-019, F25-007.
- **Problema que Resuelve:**
  Las operaciones de intercambio pueden generar múltiples lecturas y escrituras individuales. Esto incrementa el tiempo de ejecución, el consumo de cuotas y la probabilidad de fallos cuando se procesan grandes volúmenes.
- **Requisitos Funcionales:**
  1. Optimizar las operaciones de intercambio mediante:
     - Lectura de rangos estrictamente necesarios.
     - Escritura por bloques en memoria antes de persistir (`setValues` por lotes).
     - Agrupación de solicitudes compatibles.
     - Reducción de llamadas repetitivas a `SpreadsheetApp`.
     - Control estricto de concurrencia mediante `LockService`.
     - Control de tamaño de solicitudes y payloads.
     - Reintentos ante errores temporales con retroceso exponencial (`exponential backoff` con `jitter`).
     - Registro de operaciones fallidas con causa técnica.
     - Validación de resultados después de escribir en disco.
  2. Control de cuotas:
     - Reconocer errores temporales y límites de consumo de servicios externos y Google APIs.
     - Diferenciar límites de solicitudes, timeouts, servicio no disponible, errores de autorización y conflictos.
     - Reintentar errores temporales con límites definidos y detener reintentos ante errores permanentes.
- **Cambios Necesarios:**
  1. Identificar operaciones individuales repetitivas en importaciones y exportaciones.
  2. Agrupar lecturas y escrituras compatibles en matrices en memoria.
  3. Reducir el volumen de información recuperada en consultas.
  4. Implementar middleware de reintentos controlados con backoff.
  5. Incorporar límites de concurrencia y tiempos máximos de espera.
  6. Medir tiempos y cuotas antes y después de la optimización.
  7. Registrar métricas de rendimiento en bitácora de auditoría.
  8. Integrar las optimizaciones con el procesamiento fraccionado de importaciones.
- **Comportamiento Esperado:**
  Las operaciones deben procesar los mismos datos con menos llamadas innecesarias y con una recuperación más controlada ante límites o fallos temporales.
- **Criterios de Aceptación:**
  - [ ] Medir el rendimiento de una operación antes de optimizarla en tiempo y llamadas API.
  - [ ] Ejecutar la misma operación mediante procesamiento agrupado y comparar resultados.
  - [ ] Demostrar reducción en tiempos de ejecución y cantidad de llamadas `SpreadsheetApp`.
  - [ ] Comprobar que los datos obtenidos y persistidos son 100% equivalentes a la operación original.
  - [ ] Provocar un error temporal de cuota simulado y verificar el reintento exitoso con backoff.
  - [ ] Comprobar que los errores permanentes no generan ciclos infinitos de reintento.
  - [ ] Verificar que las operaciones agrupadas conservan la integridad absoluta de los datos.
  - [ ] Comprobar que la concurrencia no produce escrituras conflictivas ni pérdida de filas.
  - [ ] Registrar los resultados comparativos en las bitácoras de rendimiento.
  - [ ] Verificar que las mejoras no introducen efectos secundarios ni regresiones en servicios existentes.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15069-15118; clave TASK-416; asignación única: Otros -->
### [TASK-416] [F25-Task11] [P2] [Versionado - Administración de Versiones y Compatibilidad de Perfiles, Plantillas y Contratos]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - Hojas `PlantillasSACEVerificadas`, `CatalogoContratos`, `PerfilesMapeoColumnas`
- **Estado de Partida:** Implementación existente; ampliación de compatibilidad.
- **Dependencias Expuestas:** F25-001, F25-002 y F25-003.
- **Capacidades Relacionadas:** F25-017, F25-008, F25-013.
- **Problema que Resuelve:**
  La plataforma ya registra versiones de plantillas SACE y contratos API. Al incorporar perfiles reutilizables y nuevos conectores, debe garantizarse que los cambios de estructura no invaliden silenciosamente configuraciones anteriores.
- **Requisitos Funcionales:**
  1. Identificar en cada elemento versionado:
     - Tipo de recurso (Plantilla SACE, Perfil de Mapeo, Contrato API, Esquema de Intercambio).
     - Identificador del recurso.
     - Número o etiqueta semántica de versión (ej. `v1.0.0`, `SACE-2026-v2`).
     - Fecha de creación y fecha de vigencia.
     - Estado (`Borrador`, `Vigente`, `Obsoleto`, `Deprecado`).
     - Estructura de datos y campos obligatorios.
     - Compatibilidad con versiones de esquemas internos.
     - Registro de cambios (Changelog) respecto a la versión anterior.
     - Responsable de la versión.
     - Documentación técnica o normativa relacionada.
  2. Compatibilidad ante actualizaciones de formatos:
     - Identificar perfiles y conectores afectados ante cambios en estructuras externas.
     - Determinar qué campos cambiaron (agregados, eliminados, modificados).
     - Detectar incompatibilidades antes de la ejecución.
     - Evitar ejecutar operaciones con formatos obsoletos cuando exista riesgo de corrupción.
     - Conservar versiones anteriores para permitir consultas y reproducciones históricas.
     - Permitir migraciones controladas de perfiles de mapeo hacia nuevas versiones.
- **Cambios Necesarios:**
  1. Extender el registro de versiones en `CatalogoContratos` y tablas asociadas.
  2. Incorporar validador de compatibilidad de esquemas entre perfiles y entidades.
  3. Crear interfaz de visualización de versiones y changelogs.
  4. Incorporar marcas de advertencia cuando un perfil utilice una versión deprecada.
  5. Permitir la coexistencia de múltiples versiones de plantillas SACE según el año lectivo evaluado.
- **Comportamiento Esperado:**
  Los cambios en formatos externos o contratos no romperán silenciosamente las importaciones en curso. El sistema identificará qué componentes requieren actualización y preservará las versiones históricas.
- **Criterios de Aceptación:**
  - [ ] Consultar versiones de plantillas SACE y contratos API existentes en el sistema.
  - [ ] Crear una nueva versión de prueba de una plantilla y verificar su registro en el catálogo.
  - [ ] Comprobar que la versión anterior de la plantilla se conserva inalterada.
  - [ ] Identificar automáticamente los perfiles de mapeo afectados ante cambios de campos en una entidad.
  - [ ] Verificar que los perfiles incompatibles son marcados y no se ejecutan silenciosamente.
  - [ ] Comprobar que una operación histórica conserva la versión original del contrato utilizado.
  - [ ] Verificar que la actualización de una plantilla no altera registros ya procesados en el pasado.
  - [ ] Comprobar que la versión vigente y activa puede identificarse de manera unívoca.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15176-15234; clave TASK-418; asignación única: Otros -->
### [TASK-418] [F25-Task13] [P2] [Contratos API - Ampliación del Intercambio Estructurado mediante API Institucional]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - Hojas `CatalogoContratos`, `CatalogoServicios`
- **Estado de Partida:** Completa y verificada; ampliación de capacidades.
- **Dependencias Expuestas:** F25-001, F25-008 y F25-012.
- **Capacidades Relacionadas:** F25-013, F25-012, F25-016.
- **Problema que Resuelve:**
  La plataforma ya cuenta con endpoints y contratos documentados. La mejora consiste en asegurar que las operaciones de intercambio relacionadas con las nuevas integraciones mantengan contratos coherentes, versionados y reutilizables.
- **Requisitos Funcionales:**
  1. Definir formalmente en cada contrato API:
     - Identificador de operación.
     - Versión semántica del contrato.
     - Método de transporte (POST).
     - Estructura de solicitud (JSON Schema).
     - Estructura de respuesta exitosa.
     - Campos obligatorios y opcionales.
     - Tipos de datos e identificadores.
     - Reglas de validación de negocio.
     - Permisos requeridos (RBAC/HMAC).
     - Códigos de resultado y formato estándar de errores.
     - Límites de consulta y paginación.
  2. Operaciones relacionadas con integraciones externas:
     - Consultar integraciones disponibles (`getIntegrationsCatalog`).
     - Consultar estado de una conexión (`getIntegrationStatus`).
     - Iniciar una importación masiva (`startBulkImport`).
     - Consultar el progreso de una importación (`getImportProgress`).
     - Consultar resultados y errores de una ejecución.
     - Solicitar una exportación estructurada (`requestDataExport`).
     - Consultar el resultado de una exportación.
     - Consultar el estado de sincronización entre fuentes.
  3. Seguridad: las operaciones que modifican datos deben exigir autorización específica y controles de idempotencia cuando puedan repetirse.
- **Cambios Necesarios:**
  1. Incorporar los contratos necesarios para las nuevas operaciones de integración en `CatalogoContratos`.
  2. Mantener la estructura de los contratos existentes de los microservicios.
  3. Incorporar control de versiones ante modificaciones estructurales.
  4. Definir respuestas consistentes con metadatos de ejecución.
  5. Incorporar paginación universal para resultados extensos.
  6. Incorporar límites adaptativos de consulta (rate limits).
  7. Relacionar cada contrato con su conector en el catálogo.
  8. Documentar ejemplos de solicitudes y respuestas para desarrolladores autorizados.
- **Comportamiento Esperado:**
  Los sistemas externos autorizados podrán interoperar con la plataforma mediante contratos claros y predecibles, garantizando seguridad, consistencia de datos y compatibilidad entre versiones.
- **Criterios de Aceptación:**
  - [ ] Consultar los contratos existentes en `CatalogoContratos` y verificar su integridad.
  - [ ] Verificar que los nuevos contratos de integración están debidamente registrados.
  - [ ] Probar solicitudes válidas e inválidas comprobando validación de esquemas.
  - [ ] Verificar que las respuestas siguen estrictamente la estructura JSON documentada.
  - [ ] Comprobar que los permisos institucionales se validan en el servidor antes de responder.
  - [ ] Probar solicitudes repetidas de operaciones de escritura y comprobar la idempotencia.
  - [ ] Verificar que los cambios de versión no rompen contratos anteriores sin un procedimiento de deprecación.
  - [ ] Comprobar que los mensajes de error no revelan información interna de infraestructura.
  - [ ] Verificar que la documentación de contratos corresponde fielmente a la implementación real.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15534-15568; clave TASK-428; asignación única: Otros -->
### [TASK-428] [F28-T08] [P2] Compresión Inteligente de Imágenes, Optimización Multimedia y Carga Diferida (Lazy Loading)
- **Tipo:** Optimización Técnica y Reducción de Consumo de Datos.
- **Componentes Afectados:**
  - `js/ui-common.js` (procesador de medios en cliente)
  - `js/teacher.js`, `js/accounting.js` (módulos de carga de fotografías de expedientes y comprobantes bancarios)
  - Vistas con listados de alumnos y fotografías
- **Subcapacidades Relacionadas:** R01, R04, M03.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias:** [F28-T04], HTML5 Canvas API, File API.
- **Problema Detectado y Riesgos:**
  Al subir fotografías tomadas con teléfonos modernos para el expediente del alumno o comprobantes de transferencia bancaria, los archivos pueden pesar entre 4MB y 12MB. En conexiones móviles 3G/4G o en zonas con ancho de banda limitado, subir estos archivos satura la red, provoca timeouts en Apps Script y agota rápidamente las cuotas de almacenamiento en Google Drive.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Compresión en Cliente Antes de la Subida:*
     - Implementar función reutilizable `compressImageBeforeUpload(file, options)` utilizando HTML5 Canvas:
       - *Fotografías de Perfil / Carnet:* Redimensionar a máximo 800x800 píxeles, calidad JPEG/WebP 0.82 (reducción superior al 85% del peso original, < 250 KB).
       - *Comprobantes Bancarios y Documentos Escaneados:* Redimensionar a máximo 1600x1600 píxeles, calidad 0.85, aplicando filtros de nitidez para garantizar la absoluta legibilidad de montos, sellos, fechas y números de referencia bancaria.
       - *Protección de Integridad:* Prohibir la compresión destructiva en archivos PDF o documentos con firma digital o valor probatorio oficial.
     - Preservar la orientación correcta de la fotografía mediante la lectura de metadatos EXIF.
  2. *Generación Automática de Miniaturas (Thumbnails):*
     - Generar miniaturas ligeras (120x120 píxeles, < 25 KB) para vistas previas instantáneas en tablas y nóminas de alumnos.
  3. *Carga Diferida Estricta (`loading="lazy"`):*
     - Añadir atributo nativo `loading="lazy"` y `decoding="async"` en todas las etiquetas `<img>` de listados masivos.
     - Mostrar skeleton loader o placeholder neutro mientras la imagen se descarga.
  4. *Gestión de Conexiones Lentas y Resiliencia:*
     - Mostrar barra de progreso real durante la subida del archivo.
     - Permitir cancelar la subida en cualquier momento y reintentar si se interrumpe la conexión.
- **Criterios de Aceptación:**
  - [ ] Una fotografía de 6MB tomada desde un teléfono móvil se comprime en el cliente a menos de 300KB antes de transmitirse por red.
  - [ ] Los comprobantes bancarios comprimidos conservan nitidez y legibilidad total en referencias y cifras.
  - [ ] Las imágenes en tablas extensas no se descargan hasta que el usuario se desplaza cerca de ellas en pantalla.
  - [ ] Se comprueba una reducción mínima del 75% en el uso de ancho de banda en la carga de imágenes respecto a la línea base.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15569-15601; clave TASK-429; asignación única: Otros -->
### [TASK-429] [F28-T09] [P2] Optimización Avanzada de Tablas, Listados Masivos y Generación Eficiente de Reportes
- **Tipo:** Optimización Técnica y Escalabilidad.
- **Componentes Afectados:**
  - `js/ui-common.js` (componente reutilizable de tabla de datos y paginación)
  - `dashboards/` y vistas de gestión con grandes volúmenes de datos
  - Módulos de exportación (PDF, Excel, CSV)
- **Subcapacidades Relacionadas:** R01, R02, M03, M04.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias:** Componentes de tablas existentes, modal de reportes (`displayReportModal`), backend services.
- **Problema Detectado y Riesgos:**
  Al consultar matrículas institucionales completas, nóminas de miles de alumnos o historiales contables anuales, renderizar cientos de filas en el DOM bloquea el hilo principal de JavaScript en computadoras modestas o teléfonos móviles, generando congelamiento de interfaz (*UI freeze*) y desplazamientos toscos (*jank*).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Paginación Dinámica y Tamaño de Página Configurable:*
     - Paginación estandarizada con selector de registros por página: 10, 25, 50, 100 registros.
     - Mostrar indicador de estado claro: "Mostrando 1-25 de 480 registros".
     - Conservar la página activa y el estado de paginación al navegar a un detalle y regresar a la lista.
  2. *Filtrado y Búsqueda en Memoria / Servidor:*
     - Búsqueda en tiempo real con *debounce* (300ms) para evitar recalcular con cada pulsación de tecla.
     - Filtros combinados por grado, sección, estado y fecha.
     - Ordenamiento por columnas en orden ascendente y descendente con indicadores accesibles (`aria-sort`).
  3. *Modo Tarjetas Adaptable en Dispositivos Móviles:*
     - En pantallas con ancho menor a 768px, transformar automáticamente la visualización de tabla en un listado de tarjetas colapsables/expandibles con jerarquía clara de información, evitando el desplazamiento horizontal incómodo sin amputar datos relevantes.
  4. *Generación No Bloqueante de Reportes Extensos y Exportaciones:*
     - La exportación a CSV o PDF de listados extensos debe procesarse de manera asíncrona mediante Web Workers o fragmentación con `setTimeout`/`requestIdleCallback`, mostrando barra de progreso para no congelar la pantalla.
     - Validar que las exportaciones contengan la totalidad de los datos filtrados y mantengan encabezados institucionales, totales y formatos numéricos exactos.
- **Criterios de Aceptación:**
  - [ ] Las tablas con más de 1,000 registros cambian de página y filtran en menos de 100ms sin congelar la interfaz.
  - [ ] En pantallas móviles, las tablas se transforman en tarjetas legibles con acciones accesibles.
  - [ ] La exportación de datos a hojas de cálculo respeta los filtros aplicados y no trunca filas.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15638-15663; clave TASK-431; asignación única: Otros -->
### [TASK-431] [F29-Task17] [P2] Interoperabilidad con Bases de Datos Relacionales y Fuentes Externas
- **Orden de Ejecución:** 17
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`importStructuredRelationalDump`)
  - Especificaciones de esquemas de datos
- **Subcapacidades Relacionadas:** F29-01, F29-02.
- **Estado de Partida:** Ausente.
- **Dependencias Principales:** [F29-Task01], [F29-Task03], [F29-Task04], [F29-Task10].
- **Problema Detectado y Riesgos:**
  La migración desde sistemas con bases de datos MySQL/PostgreSQL depende de transformaciones manuales en hojas de cálculo, aumentando el tiempo y el riesgo de corromper claves foráneas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Intercambio estructurado multiformato:*
     - Admitir paquetes JSON/CSV relacionales respetando claves primarias y foráneas.
     - Mapear claves foráneas hacia las correspondencias internas resueltas.
  2. *Extracciones incrementales seguras:*
     - Soportar marcas de tiempo (*timestamps*) para extraer únicamente datos nuevos o modificados sin duplicar.
     - Prohibición de incluir credenciales o conexiones en bitácoras o exportaciones.
- **Criterios de Aceptación:**
  - [ ] Se importa un paquete de tablas relacionadas resolviendo correctamente las claves foráneas.
  - [ ] Las extracciones incrementales no duplican registros previamente procesados.
  - [ ] Ninguna credencial de conexión queda expuesta en logs.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15748-15783; clave TASK-436; asignación única: Otros -->
### [TASK-436] [F30-Task14] [P2] Runbooks y Procedimientos de Contingencia y Recuperación Operativa
- **Orden de Ejecución:** 18
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `docs/runbooks/` (`runbook-caida-servicio.md`, `runbook-indisponibilidad-sheets.md`, `runbook-fallo-autenticacion.md`, `runbook-concurrencia-bloqueos.md`, `runbook-recuperacion-pagos.md`, `runbook-contingencia-offline.md`, `runbook-cuotas-correo.md`, `runbook-restauracion-backup.md`, `runbook-rollback-despliegue.md`)
- **Subcapacidades Relacionadas:** F30-11, F30-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-11) y Sección F.
- **Problema Detectado y Riesgos:**
  Ante una falla crítica de infraestructura, agotamiento de cuotas en Google Apps Script o indisponibilidad de red, el personal técnico de guardia carece de protocolos estandarizados (Runbooks) para diagnosticar, mitigar y restablecer los servicios sin improvisaciones que puedan dañar datos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Runbooks técnicos de contingencia:*
     - Caída o latencia crítica de microservicios.
     - Indisponibilidad o errores de acceso a Google Sheets / Drive.
     - Fallos de autenticación o invalidación masiva de sesiones.
     - Bloqueos de concurrencia y contención en `LockService`.
     - Pagos o matrículas registradas sin confirmación completa.
     - Inconsistencias entre cargos arancelarios y pólizas contables.
     - Fallos de sincronización fuera de línea (`PersistenceManager`).
     - Agotamiento de cuotas de correo y Google APIs.
     - Restauración de copias de seguridad desde Drive.
     - Reversión o rollback técnico post-despliegue.
  2. *Estructura estandarizada por protocolo:*
     - Síntomas observables, posibles causas raíz, severidad, verificaciones iniciales, acciones autorizadas, acciones prohibidas, procedimiento paso a paso de recuperación, criterios de escalamiento y validaciones posteriores.
     - Preservación de evidencias forenses previa a cualquier reinicio o intervención.
     - Definición de responsables titulares y sustitutos.
     - Objetivos cuantitativos de recuperación: RTO (Recovery Time Objective) y RPO (Recovery Point Objective) por proceso.
     - Realización de simulacros controlados periódicos para validar la viabilidad práctica de los Runbooks.
- **Criterios de Aceptación:**
  - [ ] Los 9 Runbooks de contingencia se encuentran completamente redactados y validados.
  - [ ] Se definen roles de emergencia, responsables de sustitución y rutas de escalamiento técnico.
  - [ ] Los procedimientos de contingencia han sido puestos a prueba mediante simulaciones controladas.
  - [ ] Las instrucciones documentadas corresponden a las herramientas y capacidades reales de la plataforma.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16306-16334; clave TASK-455; asignación única: Otros -->
### [TASK-455] [F38-Task11] [P2] Herramienta de diagnóstico y control de calidad del catálogo de ayudas
- **Prioridad:** P2 (Media / Mejora)
- **Orden de Ejecución:** 11 (Mantenimiento, integridad y calidad del catálogo de metadatos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`diagnoseUIMetadataQuality`)
  - `dashboard-direccion.html`, `js/config.js`
  - Hoja de Cálculo: `AuditoriaCalidadMetadatos`
- **Subcapacidades Relacionadas:** F38-05, F38-06, F38-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección 8 (Mejoras Adicionales 8.3, 8.5) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  A medida que la plataforma incorpora nuevos módulos y formularios, pueden acumularse campos sin metadatos, claves duplicadas, descripciones obsoletas o contradicciones entre los textos de ayuda y las validaciones reales del backend.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Motor automatizado de diagnóstico de metadatos:*
     - Implementar `diagnoseUIMetadataQuality(payload)` en backend que analice `MetadatosInterfaz`:
       * Campos y controles relevantes sin metadatos asignados.
       * Claves duplicadas o referencias a elementos inexistentes en la interfaz.
       * Descripciones vacías, ejemplos que no cumplen las restricciones declaradas o textos técnicos incomprensibles.
       * Metadatos huérfanos que ya no son consumidos por ningún formulario activo.
  2. *Vista previa y control administrativo:*
     - Permitir a los administradores filtrar por módulo y previsualizar cómo se renderizan los tooltips y textos de ayuda antes de publicarlos oficialmente.
- **Criterios de Aceptación:**
  - [ ] El diagnóstico detecta claves duplicadas, inexistentes o incompletas en el catálogo.
  - [ ] Permite previsualizar el renderizado visual de los metadatos sin alterar registros de negocio.
  - [ ] La herramienta genera un reporte consolidado con indicadores de cobertura de ayuda por módulo.
- **Dependencias:** F38-Task02, F38-Task03.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16435-16465; clave TASK-459; asignación única: Otros -->
### [TASK-459] [F41-Task10] [P2] Validación previa avanzada y simulación de impacto de importaciones
- **Prioridad:** P2 (Media / Complementaria)
- **Orden de Ejecución:** 9 (Simulación de consecuencias y control de celdas vacías)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`simulateImportImpactPreview`)
  - `js/teacher.js`, `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** F41-01, F41-02.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-01), E (E2E-41-02) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La previsualización actual se limita a revisar encabezados y correspondencias básicas, pero no permite simular las consecuencias que la importación tendrá sobre la base de datos antes de escribir. Celdas vacías en el archivo importado pueden borrar silenciosamente información preexistente en registros actualizados.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Clasificación predictiva de filas antes de confirmar:*
     - Comparar registros del archivo contra la base de datos clasificando cada fila en: `Nueva (INSERT)`, `Actualización (UPDATE)`, `Sin cambios`, `Duplicada en archivo`, `Incompatible`, `Conflicto de integridad`.
     - Mostrar comparativa lado a lado: valor actual vs valor propuesto para campos modificados.
  2. *Política de tratamiento de celdas vacías:*
     - Identificar campos vacíos que sobreescribirían datos existentes.
     - Permitir configurar la regla: `IGNORAR_VACIOS_CONSERVAR_ACTUAL` (predeterminada) vs `SOBREESCRIBIR_VACIAR_CAMPO` (solo con autorización expresa).
  3. *Exclusión selectiva y resumen de impacto:*
     - Permitir al usuario desmarcar o excluir filas específicas antes de ejecutar la importación.
     - Advertir si la importación intenta alterar identificadores críticos o relaciones activas.
     - Mostrar resumen consolidado del impacto antes de solicitar confirmación final.
- **Criterios de Aceptación:**
  - [ ] Ningún cambio se asienta en la base de datos hasta que el usuario confirme la simulación.
  - [ ] Campos vacíos en el archivo no borran información existente a menos que se autorice explícitamente.
  - [ ] Filas conflictivas pueden excluirse individualmente manteniendo el resto de la importación.
  - [ ] El resumen de la simulación coincide con el resultado final de la operación.
- **Dependencias:** F41-Task07, F41-Task01, F41-Task02.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16466-16495; clave TASK-460; asignación única: Otros -->
### [TASK-460] [F41-Task09] [P2] Centro de control y diagnóstico de importaciones masivas
- **Prioridad:** P2 (Media / Complementaria)
- **Orden de Ejecución:** 10 (Consola de monitoreo, estadísticas y gestión de errores)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`getImportDiagnosticsDashboardData`)
  - `dashboard-direccion.html`, `js/config.js`
  - Hoja de Cálculo: `AuditoriaMigraciones`
- **Subcapacidades Relacionadas:** F41-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-10), E (E2E-41-12) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Las importaciones se registran en `AuditoriaMigraciones`, pero no existe una consola centralizada que permita a Secretaría y Dirección consultar el historial de lotes, tasas de error por departamento, descargar registros rechazados o supervisar reversiones sin inspeccionar manualmente las hojas de cálculo.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Consola unificada de historial y métricas:*
     - Mostrar listado de importaciones con: archivo, usuario, fecha, departamento, total filas, exitosas, fallidas y estado (`completada`, `parcial`, `fallida`, `revertida`).
     - Filtros por estado, tipo de importación, usuario y periodo.
     - Métricas de duración, rendimiento y tasa de rechazos.
  2. *Diagnóstico granular y descarga de errores:*
     - Inspeccionar el detalle fila por fila de cualquier lote identificando causa exacta del error.
     - Permitir descargar un archivo Excel con las filas rechazadas y el motivo de error para su rápida corrección.
     - Mostrar botones de acción contextuales: `Reanudar lote`, `Revertir lote` o `Descargar errores`, habilitados únicamente cuando la operación sea aplicable y segura.
- **Criterios de Aceptación:**
  - [ ] Usuarios autorizados pueden consultar sus lotes de importación con filtros multicriterio.
  - [ ] Los administradores visualizan el historial institucional consolidado respetando roles.
  - [ ] Permite descargar las filas fallidas con el mensaje de error correspondiente.
  - [ ] Las acciones de reanudación y reversión solo están disponibles cuando el lote cumple las condiciones técnicas.
- **Dependencias:** F41-Task01, F41-Task02, F41-Task07.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16832-16869; clave TASK-473; asignación única: Otros -->
### [TASK-473] [F23-Task27] [P3] [Calidad y Testing - Ampliación de Pruebas Automatizadas de Integración y Regresión]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `tests/regression/academic-grading-suite.js`
- **Dependencias Expuestas:** Todas las tareas implementadas de la Fase 23 (`F23-Task01` a `F23-Task26`).
- **Capacidades Relacionadas:** F23-032 y todas las subcapacidades de la Fase 23.
- **Problema Detectado:**
  La suite de pruebas existente está implementada parcialmente y no cubre suficientemente los escenarios de concurrencia, multicuenta, recuperación y ejecución distribuida.
- **Requisitos Funcionales:**
  1. Ampliar las pruebas automatizadas de definiciones, validación estructural y transiciones de flujos.
  2. Validar exhaustivamente permisos y roles RBAC/ABAC sobre cada etapa.
  3. Ejecutar pruebas de estrés con decisiones simultáneas concurrentes para validar `LockService`.
  4. Probar escenarios de solicitudes duplicadas para verificar el motor de idempotencia.
  5. Probar procesos paralelos con compuertas de bifurcación y convergencia AND/OR.
  6. Validar condiciones de enrutamiento basadas en reglas de negocio y montos.
  7. Probar temporizadores, vencimientos de SLA y escalamiento jerárquico automático.
  8. Probar delegaciones temporales de aprobación por ausencia.
  9. Probar comunicación autenticada entre microservicios de diferentes cuentas mediante HMAC.
  10. Probar revocación de credenciales y aislamiento de servicios no autorizados.
  11. Probar simulación de servicios caídos o desconectados.
  12. Validar colas de reintentos con retroceso exponencial.
  13. Probar recuperación y reanudación de trabajos extensos interrumpidos.
  14. Verificar la integridad de la cadena criptográfica de hash en el historial de auditoría.
  15. Probar compatibilidad hacia atrás entre diferentes versiones publicadas de un mismo workflow.
  16. Probar resolución dinámica de fuentes de datos mediante `resolveSpreadsheetSource`.
  17. Asegurar no regresión de todas las funcionalidades y suites previas (Fases 9, 10, 11, 15, 16, 17, 18, 19, 20, 21, 22).
- **Comportamiento Esperado:**
  Las nuevas implementaciones deberán contar con pruebas reproducibles que permitan comprobar que las capacidades existentes continúan funcionando y que las nuevas no introducen regresiones en el ecosistema.
- **Criterios de Aceptación:**
  - [ ] Ejecutar la suite completa y verificar resultados 100% reproducibles y exitosos.
  - [ ] Comprobar que los casos multicuenta se ejecutan en cuentas y servicios de prueba independientes.
  - [ ] Verificar que los escenarios de concurrencia e idempotencia se cubren y pasan satisfactoriamente.
  - [ ] Comprobar que cualquier regresión en funcionalidades previas bloquea la aprobación de la entrega.
  - [ ] Generar un reporte estructurado de resultados por subcapacidad y cobertura de pruebas.
  - [ ] Todas las pruebas de regresión previas (53/53) se mantienen aprobadas al 100%.
- **Estado:** [ ] Pendiente

---
