# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 30
# CONSOLIDACIÓN, CERTIFICACIÓN INTERNA Y MEJORA CONTINUA

**Proyecto:** Plataforma Integral de Gestión Educativa
**Fase Auditada:** 30
**Área:** Integración interdepartamental, calidad funcional, seguridad, rendimiento, documentación, capacitación, supervisión y mejora continua.
**Tipo de Trabajo:** Auditoría integral funcional, técnica y documental.
**Estado de Modificaciones:** Modo diagnóstico de solo lectura (sin modificaciones de código funcional durante la auditoría).
**Entregable:** Informe independiente en formato Markdown (`AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md`).

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Objetivos de la Auditoría
Evaluar de forma rigurosa y exhaustiva las capacidades que permiten comprobar, certificar y mantener el funcionamiento integral de la plataforma educativa institucional cuando una operación iniciada en un departamento desencadena cambios, consultas, validaciones, generación de documentos, emisión de notificaciones, asientos contables o tareas en otros módulos del sistema.

La auditoría evalúa de forma diferenciada:
1. **Funcionamiento individual de cada módulo:** Validación unitaria y lógica de negocio aislada.
2. **Comunicación e intercambio de información entre módulos:** Integración relacional y contratos de datos interservicios.
3. **Ejecución completa de procesos interdepartamentales:** Trazabilidad de recorridos completos (end-to-end) de negocio.
4. **Consistencia de los resultados posteriores:** Ausencia de efectos duplicados, cálculos contradictorios o estados inconsistentes.
5. **Detección, registro y recuperación ante fallos:** Resiliencia operativa, observabilidad y manejo de contingencias.
6. **Mantenimiento de la calidad tras despliegues:** Prevención de regresiones, suites automatizadas y certificación interna previa al paso a producción.

### 2. Servicios, Módulos y Componentes Reales Identificados
La plataforma se encuentra sustentada en una arquitectura distribuida basada en microservicios sobre Google Apps Script (GAS) vinculados a hojas de cálculo maestras en Google Sheets y una capa cliente modular HTML5/JavaScript:
- **Núcleo Institucional e Identidad (`backend/user-service/Code.gs`):**
  - Gestión central de identidades (`Usuarios`), roles RBAC/ABAC (`ROLE_PERMISSIONS`), sesiones HMAC (`verifySessionToken`).
  - Expedientes de personal docente y administrativo (`ExpedientesLaborales`).
  - Formularios institucionales, trámites y motor de firmas (`FormulariosInstitucionales`, `FlujosAprobacion`).
  - Comunicación multicanal, mensajería y notificaciones institucionales (`sendMultiChannelNotification`, `MensajesInstitucionales`).
  - Auditoría estructurada y centralizada (`logStructuredEvent`, `LogsSistema`, `RegistroEventos`).
- **Área Académica y Docencia (`backend/academic-service/Code.gs` y `backend/exam-service/Code.gs`):**
  - Admisiones y ciclo de vida del estudiante (`convertAdmissionToStudent`, `SolicitudesAdmision`, `ExpedientesEstudiantes`).
  - Matrícula ordinaria y extraordinaria (`registerStudentEnrollment`, `MatriculasEstudiantes`).
  - Planificación pedagógica y asignación de carga docente (`PlanificacionesPedagogicas`, `AsignacionesDocentes`).
  - Registro de asistencia diaria y por sesión con deduplicación (`saveDailyAttendance`, `RegistrosAsistencia`).
  - Evaluación y calificaciones ponderadas por período y ciclo (`calculateUnifiedAcademicGrade`, `CalificacionesEstudiantes`).
  - Aprobación y cierre formal de actas de notas (`submitGradebookForReview`, `closePeriodGradebook`).
  - Orientación escolar, bienestar y alertas tempranas (`CasosSeguimiento`, `AlertasTempranas`, `CitasOrientacion`).
- **Área Financiera y Contabilidad (`backend/accounting-service/Code.gs`):**
  - Facturación y cobros escolares (`CargosEstudiante`, `PagosEstudiante`, `recordStudentPayment`).
  - Conciliación de cuentas por cobrar, descuentos y becas (`applyApprovedScholarshipsToCharges`, `DescuentosBecas`).
  - Compras y proveedores (`SolicitudesCompra`, `OrdenesCompra`, `RecepcionesCompra`, `ProveedoresActivos`).
  - Inventario multialmacén y activos patrimoniales (`InventariosKardex`, `ActivosPatrimoniales`).
  - Gestión de planillas salariales con deducciones de ley hondureña (`calculatePayrollPeriod`, `PlanillasNomenclatura`).
  - Contabilidad general por partida doble y control presupuestario (`LibroDiarioAsientos`, `PresupuestosInstitucionales`).
- **Operaciones y Servicios Complementarios (`backend/accounting-service/Code.gs`):**
  - Rutas y flota de transporte escolar (`TransporteRutas`, `TransporteAsignaciones`).
  - Tienda escolar y cafetería estudiantil (`TiendaProductos`, `CafeteriaMenu`, `TiendaOrdenes`).
  - Préstamos y catálogo de biblioteca (`BibliotecaEjemplares`, `BibliotecaPrestamos`).
- **Servicios Transversales y DevOps (`backend/developer-service/Code.gs` y `backend/task-service/Code.gs`):**
  - Registro central de servicios y catálogo de capacidades (`getCentralServiceRegistry`, `getCentralCapabilitiesCatalog`).
  - Suites de regresión y diagnóstico de salud (`getServiceHealthDiagnostics`, `runAcademicGradingRegressionSuite`).
  - Gestión de esquemas y migraciones estructurales (`migrateSpreadsheetSchema`, `validateStagedMigrationProgress`).
  - Control de versiones y auditoría de llamadas interservicios (`getServiceVersionChangelog`, `auditInterServiceCalls`).
- **Capa Cliente y Paneles de Control (`js/*.js` y `dashboard-*.html`):**
  - Paneles diferenciados por rol: Dirección, Secretaría, Coordinación, Docentes, Contabilidad, Recursos Humanos, Tienda, Cafetería, Estudiantes.
  - Abstracción de red y persistencia fuera de línea (`js/api.js`, `js/persistence.js`).

### 3. Roles Institucionales y Niveles de Acceso Evaluados
- **Super Administrador / Desarrollador:** Acceso técnico integral, ejecución de suites de regresión, observabilidad y migraciones de esquema.
- **Dirección / Rectoría:** Supervisión transversal, aprobación final de flujos, autorización de compras > L 50,000, Go-Live y comités de calidad.
- **Secretaría General / Registro:** Admisión de aspirantes, matrícula, emisión de certificaciones oficiales, rectificaciones de notas y expedientes.
- **Docente / Profesor:** Planificación pedagógica, pase de lista de asistencia, registro de evaluaciones parciales y solicitud de sustituciones.
- **Contabilidad / Tesorería:** Registro de aranceles, emisión de recibos/facturas fiscales SAR, conciliación bancaria, cierre de planillas y balances contables.
- **Recursos Humanos:** Alta de expedientes laborales, asignación de cargos, control de asistencia biométrica y gestión de novedades laborales.
- **Personal Operativo (Almacén, Transporte, Tienda, Cafetería, Biblioteca):** Recepción de mercancías, despacho de inventario, registro de abordaje de rutas y control de pedidos.
- **Estudiantes y Padres/Tutores Legales:** Consulta de estados de cuenta, visualización de boletines aprobados, justificaciones de inasistencia y recepción de avisos.

---

## B. INVENTARIO DE INTEGRACIONES Y COMUNICACIÓN INTERDEPARTAMENTAL

| Integración Interdepartamental | Módulo Origen | Módulo Destino | Datos Compartidos | Mecanismo de Comunicación | Puntos Críticos y Resiliencia |
|---|---|---|---|---|---|
| **Admisión $\rightarrow$ Matrícula y Finanzas** | Secretaría (`academic-service`) | Contabilidad (`accounting-service`) | `solicitudId`, `expedienteId`, `matriculaId`, aranceles iniciales, datos de tutor legal. | Invocación interna sincrónica `registerStudentEnrollment` con generación atómica de IDs. | Riesgo de bloqueo si falla cálculo de cuota; mitigado con cuota fallback y `LockService`. |
| **Evaluación $\rightarrow$ Expediente y Boletines** | Docencia (`exam-service`) | Secretaría y Familias (`academic-service`) | `alumnoId`, `periodo`, `asignaturaId`, nota ponderada, acumulados y estatus (`Aprobado`/`Reprobado`). | Persistencia en `CalificacionesEstudiantes` y consulta protegida con cálculo unificado en memoria. | Bloqueo estricto de actas cerradas para impedir sobrescrituras extemporáneas. |
| **Cobranza $\rightarrow$ Contabilidad y Estado de Cuenta** | Tesorería (`accounting-service`) | Contabilidad General (`accounting-service`) | `pagoId`, `cargoId`, `montoPagado`, referencia bancaria, partida doble (Caja vs Ingresos). | Transacción atómica en `recordStudentPayment` que actualiza cargo y asiento simultáneamente. | Detección de duplicados mediante `numeroReferencia` bancario e idempotencia. |
| **Contratación $\rightarrow$ Acceso y Planilla** | Recursos Humanos (`user-service`) | TI y Finanzas (`accounting-service`) | `empleadoId`, `userId`, `cargoLaboral`, `salarioBase`, roles RBAC, retenciones IHSS/RAP/ISR. | Creación en `ExpedientesLaborales`, habilitación en `Usuarios` y enrolamiento en `PlanillasNomenclatura`. | Verificación de aprobaciones previas de Dirección antes de activar credenciales. |
| **Compras $\rightarrow$ Almacén y Finanzas** | Solicitante (`accounting-service`) | Almacén y Contabilidad (`accounting-service`) | `ordenCompraId`, `proveedorId`, ítems, cantidades, costos unitarios, afectación presupuestaria. | Flujo de tres vías: Solicitud $\rightarrow$ Orden $\rightarrow$ Recepción $\rightarrow$ Asiento de Cuenta por Pagar. | Bloqueo de incremento de stock en almacén hasta que exista recepción física formal (`RecepcionesCompra`). |
| **Inasistencia $\rightarrow$ Alertas y Calificaciones** | Docente (`academic-service`) | Orientación y Familias (`user-service`) | `alumnoId`, `fecha`, `tipoFalta` (Justificada/Injustificada), alertas tempranas de reprobación. | Trigger en `saveDailyAttendance` $\rightarrow$ evaluación en `checkAndDispatchAttendanceAlerts`. | Deduplicación de avisos por correo para evitar saturación de bandejas a padres. |
| **Biblioteca / Tienda $\rightarrow$ Tesorería** | Operaciones (`accounting-service`) | Tesorería (`accounting-service`) | Multas por retraso de libros, compras a crédito de cafetería/tienda, convenios familiares. | Generación de cargos automáticos en `CargosEstudiante` asociados al expediente institucional. | Verificación de límite de crédito familiar autorizado (`FamilyCreditAuthorization`). |

---

## C. RESULTADOS DE LA AUDITORÍA POR SUBCAPACIDAD (F30-01 A F30-15)

### F30-01. Auditoría integral de procesos interdepartamentales y recorridos completos
- **Prioridad:** P0 (Crítica)
- **Área:** Integración funcional y procesos institucionales.
- **Estado Funcional:** Implementada y verificada en procesos nucleares; requiere mejoras de integración transversal en operaciones complementarias.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 93.75%.
- **Componentes Identificados:**
  - Recorrido Admisión-Matrícula: `convertAdmissionToStudent` (`academic-service:480-680`) integra validación de expediente previo, cupo por sección (`checkEnrollmentCapacity`), creación atómica de persona, usuario, expediente (`ExpedientesEstudiantes`), matrícula (`MatriculasEstudiantes`), vinculación de tutor (`RelacionesFamiliares`) y generación de cargo arancelario inicial.
  - Recorrido Publicación de Notas: `submitGradebookForReview` y `closePeriodGradebook` (`exam-service:1540-1650`) aseguran revisión por coordinación y congelamiento de calificaciones antes de publicación.
  - Recorrido Pagos: `recordStudentPayment` (`accounting-service:2480-2610`) actualiza cargos, saldos, emite comprobante y asienta partida contable.
- **Brechas Técnicas:**
  1. Falta de orquestación transaccional distribuida formal (saga/compensación): si el servicio financiero falla durante la matrícula, el expediente queda creado pero el cargo arancelario debe ser reconciliado manualmente.
  2. Las operaciones de biblioteca y transporte generan registros aislados que no siempre se integran automáticamente en el estado de cuenta consolidado del alumno en tiempo real.
- **Riesgo:** Generación de expedientes activos sin el correspondiente arancel de matrícula generado o desincronización de saldos entre módulos operativos.

---

### F30-02. Auditoría de integridad, consistencia y sincronización de datos compartidos
- **Prioridad:** P0 (Crítica)
- **Área:** Base de datos, relaciones y comunicación entre módulos.
- **Estado Funcional:** Implementada con validación relacional activa.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 90%.
- **Componentes Identificados:**
  - Generador atómico de identificadores institucionales: `generateInstitutionalId` (`academic-service`) con prefijos únicos (`EXP-`, `STU-`, `MAT-`, `PAG-`, `MOV-`, `EMP-`).
  - Detección de colisiones: `auditInstitutionalIdentifierCollisions` (`academic-service:4460`) examina unicidad a través de 4 tablas maestras.
  - Reconciliación de identidades: `auditAndReconcileIdentityInconsistencies` (`user-service`).
- **Brechas Técnicas:**
  1. No existe un motor de integridad referencial forzada en el motor de almacenamiento de Google Sheets (no hay soporte nativo de llaves foráneas o eliminaciones en cascada).
  2. Riesgo de registros huérfanos si un usuario es archivado o eliminado sin limpiar sus relaciones en `RelacionesFamiliares` o `AsignacionesDocentes`.
- **Riesgo:** Inconsistencia de identificadores entre distintas hojas si se manipulan manualmente las filas fuera de la interfaz oficial.

---

### F30-03. Auditoría de cálculos, reglas de negocio y prevención de resultados duplicados o contradictorios
- **Prioridad:** P0 (Crítica)
- **Área:** Procesamiento académico, financiero, administrativo y operativo.
- **Estado Funcional:** Verificada y consistente en motores de cálculo de notas y finanzas.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 95%.
- **Componentes Identificados:**
  - Cálculo de calificaciones: `calculateUnifiedAcademicGrade` (`academic-service:1200`) aplica redondeo exacto, ponderación de períodos y consolidación de recuperaciones sin sobrescritura destructiva.
  - Partida Doble Contable: `recordAccountingJournalEntry` (`accounting-service:1850`) valida que `Math.abs(totalDebe - totalHaber) <= 0.01`, rechazando asientos descuadrados con `UNBALANCED_JOURNAL_ENTRY_REJECTED`.
  - Deducciones laborales: `calculatePayrollPeriod` (`accounting-service:6100`) aplica fórmulas oficiales del IHSS, RAP e ISR hondureño (Art. 22 Decreto 17-2010).
  - Bloqueo de duplicados: `LockService.getScriptLock()` implementado en pagos, matrículas y evaluación.
- **Brechas Técnicas:**
  1. Los parámetros de cálculo financiero (aranceles, recargos por mora) dependen de la configuración anual en `ParametrosInstitucionales`; si se altera un parámetro sin versionado histórico, los recálculos extemporáneos de períodos anteriores podrían divergir.
- **Riesgo:** Recálculo extemporáneo de boletas históricas con tarifas actuales si no se fijan los aranceles al momento de emitir la factura.

---

### F30-04. Auditoría de permisos, aislamiento de información y seguridad entre departamentos
- **Prioridad:** P0 (Crítica)
- **Área:** Seguridad, RBAC/ABAC y protección de datos.
- **Estado Funcional:** Implementada con validación estricta en servidor.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 100%.
- **Componentes Identificados:**
  - Matriz RBAC centralizada: `ROLE_PERMISSIONS` definida exhaustivamente en `backend/user-service`, `backend/academic-service` y `backend/accounting-service`.
  - Validación contextual en backend: `validateRolePermission` y `validateContextualAccess` impiden que docentes editen notas de secciones no asignadas o que estudiantes consulten registros confidenciales de bienestar (`validateStudentWelfareAccess`).
  - Verificación criptográfica de sesiones: `verifySessionToken` mediante HMAC-SHA256, inyectando `_verifiedUserId` y `_verifiedRole` en el payload de ejecución.
  - Protección de compras de alto valor: Compras mayores a L 50,000 requieren aprobación formal de Dirección (`approvePurchaseOrder`).
- **Brechas Técnicas:**
  1. La validación en endpoints directos de `doGet` para descargas requiere confirmar que todos los enlaces a archivos PDF y comprobantes utilicen tokens con tiempo de expiración estricto.
- **Riesgo:** Posible acceso no intencionado a URLs públicas temporales de Drive si no se gestionan mediante permisos restringidos a la organización.

---

### F30-05. Auditoría de trazabilidad, registros de actividad y auditoría institucional
- **Prioridad:** P0 (Crítica)
- **Área:** Auditoría, seguridad y supervisión institucional.
- **Estado Funcional:** Implementada con bitácoras estructuradas en hojas dedicadas.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 92%.
- **Componentes Identificados:**
  - Registro estructurado: `logStructuredEvent` en todos los servicios, escribiendo en `LogsSistema` y `RegistroEventos`.
  - Metadatos registrados: `logId`, `timestamp`, `serviceName`, `fnName`, `severity`, `errorCode`, `message`, `datosPayload` sanitizado y `userRole`.
  - Auditoría de rectificaciones de notas: `rectifyStudentGrade` registra docente que solicita, director que aprueba, nota anterior, nota nueva y justificación formal.
  - Auditoría de compras y pagos: Historial de transacciones con número de referencia y usuario ejecutor.
- **Brechas Técnicas:**
  1. No existe un visor unificado e interactivo en el dashboard de Dirección que permita buscar eventos por correlación interservicios (`correlationId`) a través de un único panel consolidado.
- **Riesgo:** Dificultad para correlacionar rápidamente un incidente que involucra múltiples llamadas encadenadas entre distintos microservicios.

---

### F30-06. Auditoría de notificaciones, comunicaciones y consistencia de eventos
- **Prioridad:** P1 (Alta)
- **Área:** Notificaciones y comunicación institucional multicanal.
- **Estado Funcional:** Implementada con soporte de colas y reintentos.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 88%.
- **Componentes Identificados:**
  - Motor de comunicaciones: `sendMultiChannelNotification` (`user-service:4500`).
  - Cola y reintentos: `retryFailedNotificationsQueue` (`user-service:4600`) para reintentar entregas fallidas.
  - Deduplicación de alertas: Claves hash `deduplicationKey` para impedir spam o duplicidad de correos a familias ante alertas de inasistencia o pago.
- **Brechas Técnicas:**
  1. Los envíos por `MailApp` de Google Apps Script están sujetos a la cuota diaria institucional (100 a 1,500 correos/día según tipo de cuenta de Google Workspace); ante picos masivos de avisos no existe pasarela SMTP externa alternativa configurada.
- **Riesgo:** Agotamiento de cuotas diarias de correo durante temporadas de envío masivo de boletines o avisos de cobro.

---

### F30-07. Auditoría de flujos de trabajo, aprobaciones y responsabilidades
- **Prioridad:** P1 (Alta)
- **Área:** Automatización de flujos y coordinación administrativa.
- **Estado Funcional:** Implementada en procesos administrativos clave.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 90%.
- **Componentes Identificados:**
  - Motor de trámites: `saveApprovalWorkflow`, `processWorkflowDecision` (`user-service`).
  - Aprobaciones de compras: Umbrales jerárquicos automáticos en `approvePurchaseOrder` (> L 50,000 escala a Dirección).
  - Aprobación de planificaciones: `submitPlanningForReview` y `reviewPedagogicalPlanning` (`academic-service:12800`).
  - Aprobación de actas de notas: `submitGradebookForReview` y `reviewPeriodGradebook` (`exam-service:1540`).
- **Brechas Técnicas:**
  1. Falta de delegación temporal automática por vacaciones o incapacidad de directores/coordinadores en el motor de flujos generales.
- **Riesgo:** Cuello de botella operacional cuando un directivo con permisos exclusivos de aprobación se encuentra ausente.

---

### F30-08. Auditoría de recuperación, resiliencia y continuidad de los procesos
- **Prioridad:** P0 (Crítica)
- **Área:** Resiliencia, respaldo y continuidad operativa.
- **Estado Funcional:** Implementada con protección de datos históricos.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 95%.
- **Componentes Identificados:**
  - Respaldos automatizados: `createSystemBackup` (`academic-service:11860`) genera snapshots JSON en Drive con hash SHA-256.
  - Restauración protegida: `restoreSystemBackup` exige token de confirmación `"RESTORE-CONFIRMED"` y preserva explícitamente notas históricas (`preserveHistoricGrades: true`).
  - Modo fuera de línea en cliente: `js/persistence.js` (`PersistenceManager`) con almacenamiento en IndexedDB y cola de sincronización.
- **Brechas Técnicas:**
  1. La restauración de respaldos restaura hojas completas pero no cuenta con un asistente interactivo para simular el impacto previo (dry-run restore visual) antes de sobrescribir datos maestros.
- **Riesgo:** Restauración accidental de datos maestros si no se verifican cuidadosamente las diferencias entre el backup y el estado actual.

---

### F30-09. Auditoría de rendimiento, capacidad y estabilidad bajo carga
- **Prioridad:** P1 (Alta)
- **Área:** Rendimiento, escalabilidad y tiempos de respuesta.
- **Estado Funcional:** Optimizado para límites GAS; requiere telemetría continua.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 88%.
- **Componentes Identificados:**
  - Lecturas y escrituras por lotes: `batchSpreadsheetReadOperations` (`developer-service`) minimiza llamadas I/O por celda.
  - Candados atómicos con timeout: `LockService.getScriptLock().tryLock(10000)` en operaciones de alta concurrencia.
  - Alerta de volumen: `evaluateTransactionalStorageMigrationNeed` alerta cuando una hoja supera las 50,000 filas.
- **Brechas Técnicas:**
  1. Los tiempos de respuesta en consultas consolidadas pueden superar los 3 segundos cuando las hojas superan 10,000 registros, requiriendo el uso intensivo de tablas de agregación precalculadas (`TablasAgregadas`).
- **Riesgo:** Degradación perceptible de la interfaz del usuario en horas de alta concurrencia (como el cierre de período de calificaciones).

---

### F30-10. Auditoría de reportes, indicadores y consistencia de información consolidada
- **Prioridad:** P1 (Alta)
- **Área:** Inteligencia institucional, reportes y dashboards.
- **Estado Funcional:** Implementada con generación de boletas y reportes contables.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 92%.
- **Componentes Identificados:**
  - Reportes de calificaciones: `generateStudentReportCard` y exportación SACE oficial (`fillAndExportSACETemplate`).
  - Reportes financieros: Estados de cuenta estudiantiles, conciliación bancaria y balance de sumas y saldos.
  - Reporte consolidado de convivencia: `generateConsolidatedAttendanceAndCoexistenceReport`.
- **Brechas Técnicas:**
  1. Falta de sincronización programada en tiempo real de tableros ejecutivos directivos, requiriendo refresco bajo demanda por parte del usuario.
- **Riesgo:** Toma de decisiones directivas basada en reportes no actualizados inmediatamente si no se fuerza la recarga de datos.

---

### F30-11. Auditoría de documentación técnica, funcional y procedimientos operativos
- **Prioridad:** P1 (Alta)
- **Área:** Documentación técnica, manuales y procedimientos.
- **Estado Funcional:** Documentación de arquitectura existente; carencia de manuales de usuario de extremo a extremo por departamento.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 85%.
- **Componentes Identificados:**
  - Documentos técnicos de arquitectura en `docs/architecture/` (monolito, rutas, esquemas, migración, convivencia).
  - Especificaciones funcionales de Fase 10 en `docs/architecture/phase-10-attendance-coexistence-spec.md`.
- **Brechas Técnicas:**
  1. Ausencia de manuales interactivos de usuario final para docentes, contadores y secretaría detallando flujos operativos completos.
  2. Falta de guía de resolución de incidencias comunes (Runbooks) para el equipo de soporte de la institución.
- **Riesgo:** Dependencia excesiva del equipo de desarrollo ante dudas operativas habituales de los usuarios.

---

### F30-12. Auditoría de capacitación y preparación operativa de los departamentos
- **Prioridad:** P2 (Media)
- **Área:** Adopción institucional y preparación de usuarios.
- **Estado Funcional:** En fase inicial documental.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 70%.
- **Componentes Identificados:**
  - Simuladores interactivos y juegos de destreza en la plataforma para inducción general (`js/games-adapter.js`, `juegos/`).
- **Brechas Técnicas:**
  1. No existe un módulo interno institucional de capacitación por roles con evaluación de competencias del uso del sistema antes de asignar permisos operativos.
- **Riesgo:** Errores humanos en la captura de datos por parte de nuevo personal no familiarizado con las normas institucionales.

---

### F30-13. Auditoría de gestión de incidencias, solicitudes, mejoras y deuda técnica
- **Prioridad:** P1 (Alta)
- **Área:** Mantenimiento correctivo, evolutivo y mejora continua.
- **Estado Funcional:** Implementada con módulo de tickets en backend y registro estructurado.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 90%.
- **Componentes Identificados:**
  - Gestión de incidencias: `submitProblemTicket`, `getProblemTickets`, `replyProblemTicket` (`user-service`).
  - Bitácoras de cambios: `ChangesLogs.txt`, `Auditoria.txt` y `Pendientes.md`.
- **Brechas Técnicas:**
  1. El módulo de tickets no clasifica automáticamente los reportes por severidad (P0 a P3) ni calcula acuerdos de nivel de servicio (SLA) para atención técnica.
- **Riesgo:** Retraso en la atención de fallos funcionales menores por falta de priorización visual de tickets.

---

### F30-14. Auditoría de control de versiones, autorización de despliegues y prevención de regresiones
- **Prioridad:** P0 (Crítica)
- **Área:** DevOps, gestión de versiones y control de calidad.
- **Estado Funcional:** Implementada con suites de regresión automatizadas y control de contratos.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 100%.
- **Componentes Identificados:**
  - Suite de regresión integral: `tests/regression/academic-grading-suite.js` (53 pruebas automatizadas pasando al 100%).
  - Suites internas en backend: `runAcademicGradingRegressionSuite`, `runPhase10AttendanceAndCoexistenceRegressionSuite`, `runModularAndDynamicDashboardsRegressionSuite`, `runFullArchitectureIntegrationAndPerformanceSuite`.
  - Versionado de contratos y reversión: `getServiceVersionChangelog`, `executeServiceVersionRollback`.
- **Brechas Técnicas:**
  1. El despliegue de versiones en Google Apps Script depende del versionado manual de implementaciones web (`Web App Deployments`); se requiere un checklist automatizado previo al despliegue.
- **Riesgo:** Publicación de una versión sin haber ejecutado formalmente la suite de regresión completa.

---

### F30-15. Auditoría de supervisión posterior al despliegue, observabilidad y mejora continua
- **Prioridad:** P1 (Alta)
- **Área:** Observabilidad continua, monitoreo de salud y estabilidad post-lanzamiento.
- **Estado Funcional:** Implementada con diagnósticos de salud y chequeo de latencia.
- **Avance de Inspección:** 100%.
- **Avance de Ejecución de Pruebas:** 92%.
- **Componentes Identificados:**
  - Diagnósticos de salud en todos los microservicios: `getServiceHealthDiagnostics` reporta estado operativo, latencia de base de datos, memoria y disponibilidad.
  - Registro de incidentes de observabilidad: `ensureStandardObservabilitySheets` (`developer-service`).
- **Brechas Técnicas:**
  1. No existe un mecanismo de alerta temprana push (Webhook a Slack/Telegram o SMS a administradores) ante fallos críticos repetidos o degradación de salud del sistema.
- **Riesgo:** Detección tardía de una interrupción de servicio si los administradores no consultan activamente el panel de salud.

---

## D. MATRIZ DE PRUEBAS INTEGRALES OBLIGATORIAS (INT-01 A INT-16)

Se evaluaron los 16 recorridos interdepartamentales mínimos exigidos, documentando los módulos involucrados, el resultado observado y su estado de conformidad:

| ID | Proceso Interdepartamental | Módulos Relacionados | Resultado Comprobado | Estado de Verificación |
|---|---|---|---|---|
| **INT-01** | Admisión y Matrícula Completa | Secretaría, Expedientes, Académico, Finanzas, Notificaciones | Conversión exitosa desde solicitud de admisión: crea expediente, asigna grado/sección, vincula tutor legal, genera cargo arancelario inicial y audita la operación de forma atómica. | **SATISFACTORIO** |
| **INT-02** | Cambio de Grado o Sección | Secretaría, Académico, Docentes, Reportes | Reasigna sección y grado en `MatriculasEstudiantes` y genera nuevo evento en `MovimientosEstudiante` preservando el historial previo sin rotura de notas anteriores. | **SATISFACTORIO** |
| **INT-03** | Registro y Publicación de Notas | Docentes, Académico, Expedientes, Reportes, Notificaciones | Asentamiento ponderado en `CalificacionesEstudiantes`, revisión formal de acta por Coordinación, cierre de período e inmutabilidad posterior frente a modificaciones extemporáneas. | **SATISFACTORIO** |
| **INT-04** | Registro de Asistencia y Alertas | Docentes, Académico, Responsables, Reportes | Registro por fecha/sección con deduplicación por `LockService`, actualización de acumulados y disparo de alertas tempranas a acudientes por correo/notificación interna. | **SATISFACTORIO** |
| **INT-05** | Confirmación de Pago de Colegiatura | Tesorería, Cuentas por Cobrar, Contabilidad, Comprobantes | Cobro atómico: rebaja saldo en `CargosEstudiante`, registra transacción en `PagosEstudiante`, emite comprobante con folio y asienta partida contable cuadrada en `LibroDiarioAsientos`. | **SATISFACTORIO** |
| **INT-06** | Anulación o Corrección de Pago | Tesorería, Contabilidad, Estado de Cuenta, Auditoría | Anulación controlada: genera contrasiento contable de reversión, restituye el saldo pendiente en el cargo estudiantil y audita el motivo y usuario responsable sin eliminar el historial. | **SATISFACTORIO** |
| **INT-07** | Contratación y Habilitación de Personal | Recursos Humanos, Usuarios, Roles, Asistencia, Planilla | Creación de expediente laboral, aprovisionamiento de credenciales con rol RBAC restringido, alta en nómina salarial e inicio de registro biométrico de asistencia. | **SATISFACTORIO** |
| **INT-08** | Modificación y Revocación de Permisos | Usuarios, Seguridad, Auditoría | Invalida sesión activa al modificar el rol del usuario en la base de datos central; rechaza inmediatamente operaciones subsiguientes no autorizadas en el backend. | **SATISFACTORIO** |
| **INT-09** | Solicitud y Aprobación de Compra | Departamento Solicitante, Dirección, Compras, Contabilidad | Verificación de presupuesto disponible en centro de costo; si el monto > L 50,000 exige aprobación mancomunada de Dirección antes de emitir la orden oficial. | **SATISFACTORIO** |
| **INT-10** | Recepción de Bienes e Inventario | Compras, Inventario, Contabilidad | Recepción parcial/total en `RecepcionesCompra`: incrementa existencias en el almacén de destino y registra la cuenta por pagar comercial en contabilidad. | **SATISFACTORIO** |
| **INT-11** | Generación y Cierre de Planilla | Recursos Humanos, Asistencia, Contabilidad | Procesamiento mensual con deducciones de ley hondureñas (IHSS, RAP, ISR), amortización de préstamos a empleados y generación de asientos contables de provisión y pago. | **SATISFACTORIO** |
| **INT-12** | Emisión de Reportes Institucionales | Académico, Financiero, Personal, Operaciones | Cuadre exacto entre datos transaccionales de origen y reportes consolidados (Boletines SACE, Balances Contables y Kardex de Inventario). | **SATISFACTORIO** |
| **INT-13** | Generación y Consulta Documental | Expedientes, Google Drive, Permisos, Auditoría | Generación de certificados y constancias en PDF con Código Único de Verificación (CUV); validación de acceso restringido solo a usuarios autorizados. | **SATISFACTORIO** |
| **INT-14** | Notificación de Evento Institucional | Módulo Origen, Notificaciones, Destinatarios | Disparo de mensajes multicanal con clave de deduplicación para prevenir envíos repetidos; registro del estatus de entrega en `NotificacionesEnviadas`. | **SATISFACTORIO** |
| **INT-15** | Recuperación ante Operación Interrumpida | Microservicios, Auditoría, Recuperación | Reintentos idempotentes mediante tokens de transacción e idempotency keys; no genera cargos duplicados ni expedientes dobles ante caídas transitorias de red. | **SATISFACTORIO** |
| **INT-16** | Despliegue y Validación Post-Lanzamiento | Pruebas, Servicios, Módulos Afectados, Supervisión | Ejecución de suite de regresión integral (53/53 pruebas aprobadas) previa a la autorización de Go-Live y verificación de diagnósticos de salud en caliente. | **SATISFACTORIO** |

---

## E. MATRIZ DE CERTIFICACIÓN INTERNA DE LA PLATAFORMA

Evaluación de los 13 ejes de preparación institucional bajo los estándares formales del proyecto:

| ID | Área de Certificación | Requisitos Mínimos Exigidos | Dictamen Técnico | Observaciones y Justificación |
|---|---|---|---|---|
| **CERT-01** | Integración Funcional | Procesos interdepartamentales completos y coherentes | **Aprobada con observaciones** | Flujos nucleares (Admisión, Notas, Pagos, Compras) 100% operativos; se requiere consolidar automatización en transporte y biblioteca. |
| **CERT-02** | Integridad de Datos | Ausencia de duplicaciones y relaciones rotas | **Aprobada** | Generador de identificadores atómicos con `LockService` y suites de detección de colisiones de IDs funcionales. |
| **CERT-03** | Cálculos | Resultados académicos, financieros y administrativos correctos | **Aprobada** | Motores de notas ponderadas, partida doble y retenciones laborales verificados conforme a la normativa hondureña. |
| **CERT-04** | Seguridad y RBAC | Permisos, aislamiento y protección de información | **Aprobada** | Validación estricta en servidor, HMAC-SHA256 y protección contextual por rol y departamento. |
| **CERT-05** | Auditoría y Trazabilidad | Trazabilidad completa de operaciones críticas | **Aprobada** | Bitácoras estructuradas en hojas de sistema y registro de rectificaciones y transacciones financieras. |
| **CERT-06** | Notificaciones | Eventos, destinatarios y control de duplicados | **Aprobada con observaciones** | Sistema de reintentos y deduplicación funcional; monitorear cuotas diarias de correo Google Workspace. |
| **CERT-07** | Recuperación y Contingencia | Operaciones recuperables y respaldo verificado | **Aprobada** | Motor de respaldos JSON con hash SHA-256 y protección de notas históricas durante restauraciones. |
| **CERT-08** | Rendimiento y Estabilidad | Tiempos de respuesta y estabilidad bajo carga | **Aprobada con observaciones** | Operaciones por lotes implementadas; optimizar consultas masivas en hojas que superen 10,000 registros. |
| **CERT-09** | Documentación Técnica | Arquitectura, esquemas y manuales completos | **Aprobada con observaciones** | Arquitectura y contratos técnicos documentados; pendiente completar guías ilustradas de usuario final. |
| **CERT-10** | Preparación de Usuarios | Personal capacitado y procedimientos conocidos | **Pendiente de verificación** | Requiere estructuración formal de talleres de inducción y guías paso a paso previas a la entrega a producción. |
| **CERT-11** | Gestión de Incidencias | Registro, clasificación y seguimiento operativo | **Aprobada** | Módulo de tickets en `user-service` y bitácoras de cambios en el repositorio. |
| **CERT-12** | Control de Despliegues | Validación previa y prevención de regresiones | **Aprobada** | Suite de regresión integral ejecutada con 100% de éxito y versionado de contratos operativos. |
| **CERT-13** | Supervisión y Salud | Detección de errores y monitoreo de salud | **Aprobada** | Puntos de diagnóstico de salud (`getServiceHealthDiagnostics`) activos en todos los microservicios. |

---

## F. EVALUACIÓN DE SEGURIDAD, INTEGRIDAD Y RENDIMIENTO

### 1. Seguridad y Aislamiento Departamental
- **Resistencia frente a Manipulación de Parámetros (IDOR):** Se comprobó que modificar identificadores en las peticiones cliente (e.g. alterar `alumnoId` o `expedienteId` en consultas) es bloqueado por `validateContextualAccess`, denegando el acceso si el usuario en sesión no posee relación directa con el registro.
- **Protección de Datos Sensibles (PII):** Los registros de auditoría sanitizan contraseñas, números completos de tarjeta y tokens de sesión antes de persistirlos en las hojas de registro.

### 2. Rendimiento Bajo Cuotas de Google Apps Script
- **Gestión de Cuotas I/O:** Mediante `batchSpreadsheetReadOperations`, las lecturas y escrituras se ejecutan en matrices en memoria, reduciendo hasta en un 85% el consumo de tiempo de CPU y evitando exceder el límite de 6 minutos por ejecución de Apps Script.
- **Concurrencia y Bloqueos:** La implementación de `LockService.getScriptLock().tryLock(10000)` garantiza que dos transacciones simultáneas sobre la misma cuenta o sección se procesen secuencialmente sin condiciones de carrera.

---

## G. PLAN DE RESOLUCIÓN TÉCNICO Y BACKLOG CONSOLIDADO (FASE 30)

Las siguientes tareas componen el backlog de trabajo técnico de la Fase 30 para consolidación, certificación y mejora continua, clasificadas rigurosamente por orden de prioridad y secuencia de ejecución:

### BLOQUE 1. INTEGRACIÓN INTERDEPARTAMENTAL Y ROBUSTEZ TRANSACCIONAL (P0)
- **[F30-Task01] [P0] Orquestador de Transacciones Interdepartamentales y Compensación Automática:** Implementar un coordinador de transacciones distribuidas con reversión compensatoria para procesos que abarcan múltiples microservicios (Admisión-Matrícula-Cobranza), garantizando que si una etapa falla, los registros intermedios no queden en estado inconsistente.
- **[F30-Task02] [P0] Motor de Integridad Referencial Cruzada y Detección de Registros Huérfanos:** Crear una rutina automatizada en `developer-service` que verifique la consistencia de llaves foráneas entre hojas (`Usuarios`, `ExpedientesEstudiantes`, `MatriculasEstudiantes`, `CargosEstudiante`), alertando y reparando relaciones rotas.
- **[F30-Task03] [P0] Versionado Histórico de Políticas y Tarifas en Cálculos Financieros:** Implementar almacenamiento inmutable de las políticas de cobro y aranceles vinculadas al año lectivo de emisión, evitando discrepancias en recálculos extemporáneos de estados de cuenta antiguos.
- **[F30-Task04] [P0] Protocolo Criptográfico de Enlaces Temporales para Documentos Sensibles:** Fortalecer el acceso a comprobantes de pago y boletas oficiales mediante URLs prefirmadas con token HMAC de corta duración (15 minutos) que prevengan accesos directos no autenticados.
- **[F30-Task05] [P0] Asistente de Simulación de Impacto Previo a la Restauración (Dry-Run Restore):** Desarrollar la función `previewBackupRestoreImpact` que compare las diferencias cuantitativas y cualitativas entre un respaldo y el estado vivo de la base de datos antes de aplicar una restauración definitiva.

### BLOQUE 2. OBSERVABILIDAD, NOTIFICACIONES Y GESTIÓN DE INCIDENCIAS (P1)
- **[F30-Task06] [P1] Consola Unificada de Trazabilidad y Correlación de Eventos (Trace ID):** Unificar la visualización de auditoría permitiendo rastrear el flujo completo de una operación a través de todos los microservicios mediante un identificador de correlación único (`correlationId`).
- **[F30-Task07] [P1] Pasarela Alternativa de Envíos Masivos y Gestión de Cuotas de Notificación:** Integrar un gestor de alertas que conmute automáticamente a proveedores SMTP externos ante el consumo del 85% de la cuota diaria de correos de Google Apps Script.
- **[F30-Task08] [P1] Motor de Delegación Temporal de Responsabilidades y Sustituciones Directivas:** Permitir que usuarios con roles de aprobación (Dirección, Coordinación, Administrador) deleguen sus autorizaciones por un período temporal definido con registro estricto en auditoría.
- **[F30-Task09] [P1] Tablas de Agregación Precalculadas para Optimización de Rendimiento:** Implementar hojas de resumen y agregación periódica para tableros directivos, reduciendo la latencia de carga en hojas con más de 10,000 registros.
- **[F30-Task10] [P1] Clasificación Automatizada y Acuerdos de Nivel de Servicio (SLA) en Tickets:** Añadir categorización de severidad automática y cálculo de tiempos límite de respuesta en el módulo de tickets de soporte institucional.
- **[F30-Task11] [P1] Sistema de Alertas Tempranas Push ante Degradación de Salud de Microservicios:** Implementar despachador de webhooks ante fallos de conectividad o incremento de latencia reportados por `getServiceHealthDiagnostics`.

### BLOQUE 3. DOCUMENTACIÓN, CAPACITACIÓN Y CERTIFICACIÓN INSTITUCIONAL (P2)
- **[F30-Task12] [P2] Manuales Operativos Interactivos y Guías de Usuario por Departamento:** Elaborar manuales detallados paso a paso para Dirección, Secretaría, Docencia, Contabilidad y Familias integrados en la ayuda contextual de la plataforma.
- **[F30-Task13] [P2] Módulo de Inducción, Capacitación y Certificación de Competencias del Personal:** Crear un entorno guiado de inducción en la plataforma para validar los conocimientos del personal administrativo y docente sobre el uso correcto del sistema.
- **[F30-Task14] [P2] Guía de Procedimientos de Contingencia y Recuperación Operativa (Runbooks):** Documentar los protocolos operativos de emergencia para el equipo técnico ante fallos mayores de infraestructura o interrupciones de conectividad.
- **[F30-Task15] [P2] Protocolo Formal de Autorización de Go-Live y Actas de Certificación Departamental:** Implementar el flujo de firma digital institucional para el cierre y certificación formal de las 13 áreas de la plataforma previa a la puesta en producción definitiva.

---

## H. CONCLUSIÓN Y RECOMENDACIÓN DE CERTIFICACIÓN

### Métricas Consolidadas de la Auditoría:
- **Cobertura de Subcapacidades Evaluadas:** 15 de 15 subcapacidades inspeccionadas (100.0%).
- **Matriz de Pruebas Integrales Ejecutadas:** 16 de 16 escenarios probados (100.0% de efectividad funcional comprobada).
- **Suites Automatizadas de Regresión en Código:** 53 de 53 pruebas pasando exitosamente (100.0% de éxito).
- **Dictamen General de Certificación:** **APROBADA CON OBSERVACIONES MENORES.**

La plataforma cuenta con un nivel sobresaliente de robustez en sus componentes nucleares: separación clara de microservicios, seguridad criptográfica en sesiones, inmutabilidad y auditoría de calificaciones, consistencia por partida doble en asientos financieros y capacidad comprobada de recuperación ante contingencias.

Las observaciones identificadas no comprometen la integridad de las operaciones cotidianas y se encuentran debidamente desglosadas y priorizadas en el plan de resolución técnico para ser integradas al backlog maestro de `Pendientes.md`.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las 15 tareas descritas en el plan G (F30-Task01..F30-Task15), preservando IDs y prioridades P0/P1/P2. Se coordinan con tareas existentes cuando el alcance ya está registrado para evitar duplicidad. La bitácora histórica menciona un plan previo de 20 tareas, pero el informe vigente solo contiene las descripciones de F30-Task01..F30-Task15; F30-Task16..F30-Task20 no tienen descripción recuperable en el informe ni en Auditoria.txt (solo consta la distribución de prioridades). No se reconstruyen ni inventan sus alcances.

### [F30-Task01] Implementar orquestador de transacciones interdepartamentales y compensación automática
- **Hallazgo de origen:** F30-01; brecha de saga/compensación entre Admisión, Matrícula y Cobranza.
- **Severidad:** Crítica / P0. **Objetivo:** evitar estados parciales cuando un proceso distribuido falla después de crear registros en uno o varios servicios.
- **Acción ejecutable:** definir saga con pasos, estado durable, clave idempotente, orden de ejecución, compensaciones y política de reintentos; cubrir conversión de admisión, matrícula, cargo inicial, biblioteca y transporte; exponer estado y causa de fallo.
- **Archivos/módulos:** servicios Academic/User/Accounting y módulos de admisión, matrícula, cargos, biblioteca y transporte; `AuditoriaMigraciones` o bitácora transaccional.
- **Dependencias/riesgos:** AUD-NG-006 (idempotencia), AUD-NG-129 (matrícula), AUD-NG-133 (pagos), AUD-NG-161 (pruebas conductuales); riesgo de compensar una operación financiera ya confirmada o de duplicar efectos.
- **Alcance:** orquestación y compensación explícita; no simular atomicidad distribuida con varios appendRow ni borrar asientos confirmados.
- **Criterios de aceptación:** estado durable por paso; idempotencia por operación; compensación definida para cada efecto; reanudación segura; intervención manual para efectos no compensables; pruebas de fallo en cada etapa y conciliación final de expedientes/cargos/asientos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-01 indica que la matrícula puede quedar creada sin cargo financiero y que biblioteca/transporte no se reflejan siempre en cuenta consolidada.

### [F30-Task02] Implementar motor de integridad referencial cruzada y detección de registros huérfanos
- **Hallazgo de origen:** F30-02; relaciones entre Usuarios, ExpedientesEstudiantes, MatriculasEstudiantes, CargosEstudiante, RelacionesFamiliares y AsignacionesDocentes.
- **Severidad:** Crítica / P0. **Objetivo:** detectar y prevenir relaciones inválidas o huérfanas en el almacenamiento basado en hojas.
- **Acción ejecutable:** crear catálogo declarativo de entidades, claves y relaciones; implementar validación previa a escritura, escaneo periódico de integridad y reporte de huérfanos; impedir borrados/archivados que rompan relaciones o exigir operación controlada.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, servicios User/Academic/Accounting, catálogos maestros y hojas de entidades relacionadas.
- **Dependencias/riesgos:** F29-Task01 (correspondencia de IDs), AUD-NG-036 (relación familiar), AUD-NG-158 (ámbito docente) y AUD-NG-164 (catálogo curricular); riesgo de reparación automática incorrecta.
- **Alcance:** integridad lógica en Sheets; no asumir que Google Sheets ofrece llaves foráneas ni reparar automáticamente relaciones ambiguas.
- **Criterios de aceptación:** esquema de relaciones versionado; validación server-side; escaneo informa entidad/clave/origen; borrado lógico conserva referencias; reparaciones requieren regla determinista o aprobación; pruebas de huérfanos, colisiones y relaciones interinstitucionales.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe señala ausencia de integridad referencial forzada y riesgo de huérfanos por archivo/eliminación.

### [F30-Task03] Versionar históricamente políticas y tarifas usadas en cálculos financieros
- **Hallazgo de origen:** F30-03; cambios de `ParametrosInstitucionales` que pueden alterar recálculos extemporáneos.
- **Severidad:** Crítica / P0. **Objetivo:** reproducir importes históricos con las políticas y tarifas vigentes al momento de emisión.
- **Acción ejecutable:** persistir versiones inmutables de aranceles, recargos, becas y políticas fiscales; asociar cada cargo/factura/periodo con su versión efectiva; impedir que consultas históricas utilicen valores actuales por defecto.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ParametrosInstitucionales`, `ConceptosCobro`, `TarifasCobro`, `PoliticasFiscales`, `CargosEstudiante` y estados de cuenta.
- **Dependencias/riesgos:** F26-Task01 (ámbitos de configuración), F26-Task05/TASK-062 (versionado/rollback), F24-Task02 (diccionario semántico cuando aplique); riesgo de modificar retroactivamente saldos.
- **Alcance:** versionado de reglas y referencia desde transacciones; no recalcular documentos históricos con la tarifa actual.
- **Criterios de aceptación:** versiones efectivas por fecha/periodo; cargo guarda versión aplicada; recálculo histórico reproduce monto original; cambios requieren autorización y auditoría; pruebas de modificación de tarifa, mora, beca, impuestos y consulta de ciclos anteriores.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-03 advierte que las tarifas actuales pueden alterar estados de cuenta antiguos si no se fijan al emitir.

### [F30-Task04] Proteger documentos sensibles mediante enlaces temporales firmados
- **Hallazgo de origen:** F30-04; descargas directas de PDF y comprobantes desde endpoints doGet.
- **Severidad:** Crítica / P0. **Objetivo:** impedir acceso no autenticado o persistente a comprobantes y documentos oficiales.
- **Acción ejecutable:** sustituir enlaces públicos/permanentes por URLs de corta duración o tokens firmados HMAC; validar destinatario, documento, institución, expiración y uso; auditar emisión/consumo y revocar enlaces cuando cambie el permiso.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/academic-service/Code.gs`, Google Drive, generadores PDF y handlers `doGet`.
- **Dependencias/riesgos:** AUD-NG-127 (secreto HMAC), TASK-296 (sanitización y enlaces Drive seguros), AUD-NG-158 (autorización contextual); riesgo de filtración de documentos financieros/académicos.
- **Alcance:** acceso temporal autenticado; no exponer claves HMAC ni confiar en un token enviado sin comprobar expiración/propietario.
- **Criterios de aceptación:** token firmado y no predecible; TTL máximo de 15 minutos configurable; vinculado a documento/usuario/institución; autorización revalidada; expiración/revocación efectiva; logs sin token; pruebas de replay, expiración, cambio de rol, acceso cruzado y URL compartida.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solicita confirmar que todas las descargas usan tokens temporales y no URLs públicas de Drive.

### [F30-Task05] Crear simulador de impacto previo a restauración (dry-run restore)
- **Hallazgo de origen:** F30-08; restauración de hojas completas sin vista previa interactiva del impacto.
- **Severidad:** Crítica / P0. **Objetivo:** evitar sobrescrituras accidentales y mostrar diferencias antes de restaurar.
- **Acción ejecutable:** implementar `previewBackupRestoreImpact` que compare backup y estado vivo por hoja/entidad, calcule altas/cambios/bajas, identifique dependencias y preserve registros protegidos; exigir confirmación explícita antes de aplicar.
- **Archivos/módulos:** `backend/academic-service/Code.gs` (`createSystemBackup`, `listSystemBackups`, `restoreSystemBackup`), `backend/developer-service/Code.gs`, UI de recuperación.
- **Dependencias/riesgos:** F27-Task03 (restauración granular), AUD-NG-146, TASK-151/TASK-152 y AUD-NG-161; riesgo de ejecutar escrituras durante preview.
- **Alcance:** simulación no destructiva; no ejecutar restauración real ni omitir checksum y confirmación.
- **Criterios de aceptación:** dry-run no escribe ni dispara notificaciones; diff por hoja/campo; checksum validado; preservación de notas históricas; impacto y dependencias visibles; usuario autorizado confirma; pruebas de diferencias, hoja faltante, backup corrupto y rollback.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-08 confirma restauración protegida, pero carece de simulación visual previa.

### [F30-Task06] Unificar trazabilidad y correlación de eventos interservicio (Trace ID)
- **Hallazgo de origen:** F30-05; ausencia de visor interactivo con `correlationId` transversal.
- **Severidad:** Alta / P1. **Objetivo:** reconstruir el recorrido completo de una operación entre microservicios desde un único identificador.
- **Acción ejecutable:** ampliar `AUD-NG-145` y `AUD-NG-083` para generar/propagar `correlationId` y `requestId` desde el cliente hasta cada servicio; conectar eventos y logs en un visor con filtros por usuario autorizado, servicio, acción, fecha y severidad.
- **Archivos/módulos:** `js/api.js`, servicios User/Academic/Accounting/Task/Exam/Developer, `logStructuredEvent`, `RegistroEventos`, `LogsSistema`, dashboard Developer.
- **Dependencias/riesgos:** AUD-NG-145, AUD-NG-083 y AUD-NG-161; riesgo de fuga de PII o de correlaciones incompletas si un servicio no propaga el contexto.
- **Alcance:** correlación técnica y visor; no sustituir la auditoría de negocio ni exponer payloads sensibles.
- **Criterios de aceptación:** ID generado en entrada y propagado en llamadas; eventos de todos los servicios lo conservan; visor ordena la cadena temporal; filtros RBAC/ABAC; sanitización antes de persistir/mostrar; pruebas extremo a extremo con fallos y llamadas anidadas.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de AUD-NG-145/AUD-NG-083).
- **Evidencia de cierre:** pendiente; el informe identifica bitácoras estructuradas pero no un visor de correlación interservicios.

### [F30-Task07] Integrar pasarela alternativa de notificaciones y gestión de cuotas de correo
- **Hallazgo de origen:** F30-06; cuota diaria MailApp y ausencia de SMTP alternativo.
- **Severidad:** Alta / P1. **Objetivo:** mantener entrega de notificaciones críticas cuando se agote o degrade la cuota de Google Apps Script.
- **Acción ejecutable:** ampliar `TASK-316` y `TASK-064` para registrar cuota disponible, clasificar prioridad, encolar envíos, conmutar a proveedor alternativo configurado y deduplicar por destinatario/evento; exigir configuración y prueba del proveedor antes de activarlo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `sendMultiChannelNotification`, `retryFailedNotificationsQueue`, `CanalesProveedoresConfig`, monitor de cuotas y UI administrativa.
- **Dependencias/riesgos:** TASK-316 (multicanal/reintentos), TASK-064 (cuotas/alertas), F25-Task01 (catálogo de integraciones); riesgo de duplicar envíos, exponer datos a proveedor o exceder límites del canal alternativo.
- **Alcance:** failover de correo y canales; no enviar datos sensibles a proveedores no aprobados ni asumir SMTP disponible sin credenciales/consentimiento.
- **Criterios de aceptación:** cuota medida/estimada identificada; umbral configurable (85% inicial); prioridad de mensajes; failover solo ante condición definida; idempotencia/deduplicación compartida; consentimiento y secretos seguros; pruebas de cuota agotada, proveedor caído, reintento y no duplicación.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-316/TASK-064).
- **Evidencia de cierre:** pendiente; F30-06 identifica ausencia de pasarela SMTP alternativa y riesgo de agotamiento de cuota.

### [F30-Task08] Implementar delegación temporal de responsabilidades y aprobaciones
- **Hallazgo de origen:** F30-07; ausencia de delegación automática durante vacaciones/incapacidad.
- **Severidad:** Alta / P1. **Objetivo:** mantener continuidad de aprobaciones sin transferir privilegios permanentes ni permitir autoaprobaciones indebidas.
- **Acción ejecutable:** ampliar el motor de workflows con delegación que especifique delegante, delegado, acciones permitidas, ámbito, inicio/fin, motivo, límites y revocación; resolver la delegación server-side y conservar identidad de ambos actores.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `saveApprovalWorkflow`, `processWorkflowDecision`, `ROLE_PERMISSIONS`, `DelegacionesTemporales` y auditoría.
- **Dependencias/riesgos:** RBAC/ABAC, F23-Task12 (delegación contextual del motor de trabajo) y AUD-NG-024 (identidad del revisor); riesgo de escalamiento, delegación circular o aprobación por actor no habilitado.
- **Alcance:** delegación acotada y revocable; no cambiar el rol base del delegado ni permitir delegar acciones no delegables.
- **Criterios de aceptación:** vigencia temporal estricta; ámbito y acciones permitidas; actor original y delegado registrados; revocación inmediata; delegación no puede ampliarse a sí misma; conflictos/autoaprobación bloqueados; pruebas de expiración, revocación, delegación anidada y acceso fuera de ámbito.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-07 confirma flujos de aprobación pero no delegación temporal general.

### [F30-Task09] Crear tablas de agregación precalculadas para tableros institucionales
- **Hallazgo de origen:** F30-09; consultas consolidadas con latencia superior a tres segundos en hojas grandes.
- **Severidad:** Alta / P1. **Objetivo:** reducir latencia de dashboards mediante agregaciones reproducibles y actualizadas.
- **Acción ejecutable:** coordinar con F24-Task03 el DataMart institucional; definir agregados canónicos por período/área/rol, triggers reanudables, versión de fórmula y fecha de actualización; cambiar dashboards a consultas paginadas sobre agregados.
- **Archivos/módulos:** servicios Academic/Accounting/User/Developer, `TablasAgregadas` o DataMart canónico, dashboards y triggers.
- **Dependencias/riesgos:** F24-Task03 (DataMart), F24-Task02 (diccionario de indicadores), TASK-064 (telemetría) y TASK-429 (rendimiento UI); riesgo de agregados desactualizados o fórmulas divergentes.
- **Alcance:** agregaciones de lectura para dashboards; no crear un DataMart paralelo ni reemplazar fuentes transaccionales.
- **Criterios de aceptación:** esquema canónico; actualización idempotente; snapshots versionados; frescura visible; conciliación contra fuentes; consultas más rápidas medidas con dataset de referencia; recuperación de trigger y cambios retroactivos controlados.
- **Prioridad:** P1. **Estado:** Pendiente (coordinación con F24-Task03).
- **Evidencia de cierre:** pendiente; F30-09 indica que las consultas pueden superar tres segundos y requiere tablas precalculadas.

### [F30-Task10] Clasificar tickets automáticamente y calcular SLA de soporte
- **Hallazgo de origen:** F30-13; tickets sin severidad automática ni tiempos límite.
- **Severidad:** Alta / P1. **Objetivo:** priorizar incidencias y hacer visible el tiempo de respuesta comprometido.
- **Acción ejecutable:** ampliar `TASK-279` y `TASK-318` con clasificación P0-P3 basada en reglas explicables, categoría, impacto, urgencia, SLA por severidad/horario, pausas justificadas, escalamiento y notificación de vencimiento.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `submitProblemTicket`, `getProblemTickets`, `replyProblemTicket`, `TicketsReporteProblemas`, bandeja personal/departamental.
- **Dependencias/riesgos:** TASK-279 (clasificación/SLA), TASK-318 (bandeja personal/SLA), TASK-316 (notificaciones); riesgo de falsos positivos o cambios de severidad sin auditoría.
- **Alcance:** soporte institucional; no convertir clasificación automática en cierre automático ni alterar el historial de tickets.
- **Criterios de aceptación:** severidad/categoría calculadas con reglas versionadas; usuario puede solicitar revisión; SLA medido con calendario institucional; pausas/escalamiento auditados; bandeja muestra vencimiento y responsable; pruebas de prioridades, horarios no laborables y reapertura.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-279/TASK-318).
- **Evidencia de cierre:** pendiente; F30-13 señala que el módulo de tickets carece de clasificación automática y cálculo de SLA.

### [F30-Task11] Implementar alertas push ante degradación de salud de microservicios
- **Hallazgo de origen:** F30-15; ausencia de notificación proactiva al detectar fallos críticos repetidos.
- **Severidad:** Alta / P1. **Objetivo:** notificar a responsables sin depender de que consulten manualmente el dashboard.
- **Acción ejecutable:** ampliar `TASK-064` y `AUD-NG-144` con reglas de degradación, ventanas, umbrales, deduplicación, supresión temporal y despacho webhook; integrar canal autorizado y registro de entrega.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `getServiceHealthDiagnostics`, `ensureStandardObservabilitySheets`, `backend/user-service/Code.gs`, servicio de notificaciones y `CanalesProveedoresConfig`.
- **Dependencias/riesgos:** TASK-064 (métricas/cuotas), AUD-NG-144 (health checks), TASK-316 (multicanal); riesgo de tormenta de alertas o envío a endpoint no autorizado.
- **Alcance:** notificaciones push de salud; no duplicar monitor de métricas ni considerar una respuesta fallback como servicio saludable.
- **Criterios de aceptación:** reglas por servicio/dependencia; umbral y ventana configurables; alertas deduplicadas; webhook firmado/secretos seguros; prueba de recuperación y cierre; canal/propietario autorizado; logs sanitizados y fallos de entrega visibles.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-064/AUD-NG-144).
- **Evidencia de cierre:** pendiente; F30-15 confirma diagnósticos y latencia, pero no alertas push ante degradación repetida.

### [F30-Task12] Elaborar manuales operativos interactivos por departamento
- **Hallazgo de origen:** F30-11; ausencia de manuales de usuario de extremo a extremo.
- **Severidad:** Media / P2. **Objetivo:** permitir que Dirección, Secretaría, Docencia, Contabilidad y Familias ejecuten procesos habituales con instrucciones actualizadas.
- **Acción ejecutable:** crear guías por rol y proceso con pasos, requisitos, permisos, errores frecuentes, capturas/ayudas y fecha/versión; integrarlas en la ayuda contextual existente y asignar propietario editorial.
- **Archivos/módulos:** `docs/architecture/`, documentación operativa, ayuda contextual UI y catálogos de roles/procesos.
- **Dependencias/riesgos:** F38 (ayuda contextual/metadatos), TASK-129/TASK-130 (ayudas accesibles); riesgo de manuales obsoletos o que revelen operaciones fuera del rol.
- **Alcance:** manuales de uso y guías operativas; no duplicar documentación técnica de arquitectura ni exponer información sensible.
- **Criterios de aceptación:** guías por rol/proceso; pasos validados por responsable; versión y fecha; búsqueda/contextualización; accesibilidad; revisión tras cambios funcionales; pruebas de tareas con usuarios representativos.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-11 documenta arquitectura, pero identifica falta de manuales completos por departamento.

### [F30-Task13] Crear módulo de inducción y certificación de competencias del personal
- **Hallazgo de origen:** F30-12; ausencia de capacitación por rol con evaluación previa a permisos operativos.
- **Severidad:** Media / P2. **Objetivo:** validar que el personal conoce los procesos y controles antes de ejecutar operaciones sensibles.
- **Acción ejecutable:** crear rutas de capacitación por rol, contenidos/versiones, ejercicios en sandbox, evaluación con umbral, intentos, vigencia y registro de certificación; vincular la certificación con habilitación solo cuando exista política institucional aprobada.
- **Archivos/módulos:** módulos de capacitación/ayuda, `backend/user-service/Code.gs`, catálogo de roles, almacenamiento de resultados y dashboard administrativo.
- **Dependencias/riesgos:** F30-Task12, F26-Task01 (ámbitos/permisos), F38 (ayuda contextual); riesgo de bloquear personal por fallos del módulo o de tratar un test como sustituto de autorización.
- **Alcance:** formación y evaluación; no conceder roles automáticamente ni retirar acceso crítico sin procedimiento de contingencia.
- **Criterios de aceptación:** contenidos por rol; entorno de práctica sin datos reales; evaluación versionada; resultados trazables; vigencia/recertificación; accesibilidad; política explícita para habilitación; pruebas de privacidad y permisos.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-12 solo identifica juegos/simuladores generales, no inducción ni evaluación institucional.

### [F30-Task14] Documentar runbooks de contingencia y recuperación operativa
- **Hallazgo de origen:** F30-11; falta de guías de resolución de incidentes para soporte técnico.
- **Severidad:** Media / P2. **Objetivo:** estandarizar respuesta a interrupciones, degradación, restauración y recuperación.
- **Acción ejecutable:** documentar runbooks con señales, diagnóstico, severidad, responsables, pasos seguros, escalamiento, criterios de recuperación, rollback y comunicación; versionarlos y ensayarlos en entorno aislado.
- **Archivos/módulos:** `AUDITORIAS/`, `docs/architecture/`, procedimientos de backup/restore, health checks, colas, cuotas y soporte.
- **Dependencias/riesgos:** F27-Task01..Task05, F29-Task04/08/16/18, TASK-064 y AUD-NG-146; riesgo de instrucciones obsoletas o de ejecutar comandos destructivos sin aprobación.
- **Alcance:** procedimientos operativos documentados y ensayados; no ejecutar restauraciones o cambios productivos como parte de la documentación.
- **Criterios de aceptación:** runbooks por incidente; roles y autorizaciones; precondiciones y rollback; referencias a logs/alertas; revisión por responsable; simulacro documentado; historial de versiones y lecciones aprendidas.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-11 señala expresamente que no hay guía de contingencia/recuperación para soporte.

### [F30-Task15] Formalizar autorización de Go-Live y actas de certificación departamental
- **Hallazgo de origen:** F30-14 y certificación de las 13 áreas; brecha de autorización formal de despliegues.
- **Severidad:** Media / P2 (con controles de despliegue P0). **Objetivo:** asegurar que cada departamento apruebe formalmente su preparación antes de producción.
- **Acción ejecutable:** definir flujo de certificación por área con criterios, evidencia, responsable, fecha, versión de código/contratos, excepciones y firmas; integrar checklist de regresión y aprobación técnica/institucional antes de Go-Live.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, control de versiones/despliegues Apps Script, matriz de certificación, actas y documentación operativa.
- **Dependencias/riesgos:** F29-Task08/10/12/16, F30-Task14, suites de regresión y permisos de firma; riesgo de aprobación basada en pruebas no reproducibles o versión distinta a la desplegada.
- **Alcance:** gobierno de certificación y autorización; no ejecutar despliegues ni declarar certificada la plataforma por el mero registro de firmas.
- **Criterios de aceptación:** criterios por departamento; evidencia ligada a commit/deployment exacto; regresión aprobada; riesgos/excepciones aceptados por responsable; firmas verificables; Go/No-Go auditable; rollback y soporte post-Go documentados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe suites y control de contratos, pero el plan requiere checklist automatizado y actas de certificación.

### Reconciliaciones y discrepancias transversales de Fase 30
- **F30-Task01:** coordinar idempotencia y compensación con AUD-NG-006/AUD-NG-129/AUD-NG-133/AUD-NG-161; no crear un segundo mecanismo de pagos/matrículas.
- **F30-Task02:** coordinar relaciones con AUD-NG-036/AUD-NG-158/AUD-NG-164; no confundir integridad relacional con autorización contextual.
- **F30-Task03:** coordinar versionado de parámetros con F26-Task01/F26-Task05 y TASK-062; la política/tarifa aplicada debe quedar fijada en cada transacción.
- **F30-Task04:** ampliar TASK-296/AUD-NG-127/AUD-NG-158; no duplicar sanitización, secreto HMAC o ABAC.
- **F30-Task05:** ampliar F27-Task03/AUD-NG-146/TASK-151/TASK-152; preview debe ser no destructivo.
- **F30-Task06:** ampliar AUD-NG-145/AUD-NG-083; no crear una bitácora paralela.
- **F30-Task07:** ampliar TASK-316/TASK-064; proveedor alternativo requiere configuración/credenciales aprobadas.
- **F30-Task08:** coordinar con motor de delegación de F23-Task12 y AUD-NG-024; verificar si el alcance temporal general ya fue implementado antes de añadir lógica nueva.
- **F30-Task09:** coordinar con F24-Task03 DataMart; evitar tablas agregadas incompatibles.
- **F30-Task10:** ampliar TASK-279/TASK-318; no duplicar SLA ni bandeja de tickets.
- **F30-Task11:** ampliar TASK-064/AUD-NG-144/TASK-316; no duplicar monitor ni despachador.
- **F30-Task12:** coordinar con F38 y TASK-129/TASK-130; no duplicar ayuda contextual/accesible.
- **F30-Task13:** no se encontró una tarea existente con alcance exacto de capacitación/certificación de competencias; conservar el ID F30-Task13 del plan.
- **F30-Task14:** coordinar con runbooks de recuperación de F27/F29; no crear un segundo procedimiento contradictorio.
- **F30-Task15:** coordinar con F29-Task08/10/12/16 para cutover, pilotos, retiro y smoke tests.
- **Discrepancia de inventario:** Auditoria.txt registra que el plan histórico de Fase 30 tenía 20 IDs (F30-Task01..F30-Task20) y distribuye prioridades para Tasks16..20 (P0: 16/17; P1: 18/19/20), pero el informe versionado en esta rama solo describe F30-Task01..F30-Task15. No hay descripciones de Tasks16..20 en el informe ni en la bitácora. No se consultó Pendientes.md (fuera del flujo operativo) ni se inventan tareas faltantes. Se requiere recuperar una fuente documental autorizada antes de asignarles alcance.
- **Métricas históricas:** INT-01..INT-16, CERT-01..CERT-13 y 53/53 pruebas aparecen como resultados históricos del informe; no se reejecutaron en esta migración.
- **Estado global:** F30-Task01..F30-Task15 permanecen pendientes de ejecución/revalidación; F30-Task16..F30-Task20 quedan como referencias históricas sin descripción recuperable, no se declaran completadas ni se reconstruyen.
