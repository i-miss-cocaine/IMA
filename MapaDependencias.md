# Mapa de Dependencias Académicas (v7.6.1)

## Módulo de Tareas (Teacher/Student)
- Entidad: Tarea (Regular) -> Impacta Progreso Base.
- Entidad: Crédito Extra -> Impacta Recuperación (No afecta Base).
- Relación: Crédito Extra [1] <-> [1] Tarea Rechazada.

## Módulo de Navegación
- ui-common.js (Garante de historial) -> teacher.js (Vistas de dashboard).
- ui-common.js (Garante de historial) -> index-ui.js (Navegación de recursos Index).
- presentation-engine.js -> Depende de ui-common.js para sanitización y seguridad.

## Módulo de Seguridad
- security-minigames.js (NUEVO) -> games-adapter.js (Coordinación).
- minigames (juegos/*.html) -> Dependen de security-minigames.js.

## Módulo de Persistencia y Caché
- persistence.js (DB v4) -> api.js (Silent Reconciliation).
- api.js -> dashboard-modules (teacher.js, student.js, index-ui.js).
- Stores: news, teacher_projects, logros_data, academic_reports, student_profiles.
## Microservicios Modularizados (v7.9.3)
- USER: Autenticación, Perfil, Noticias, Analítica y Logros.
- ACADEMIC: Configuración Académica, Historial, Clases (WhatsApp) y Banco de Preguntas.
- TASK: Gestión de Tareas y Proyectos.
- EXAM: Gestión de Exámenes.

## Módulo Académico (v7.9.3)
- academic-service/Code.gs -> Gestión atómica de ConfiguracionAcademica e HistorialAcademico.
- student.js (renderSubjectNavigation) -> Filtrado estricto por GranularConfig (Grado, Sección, Parcial).


## Compras y órdenes de compra (TASK-015 / F18-Task04, auditoría 2026-11-04)

### Despacho y seguridad
- doPost (backend/accounting-service/Code.gs:572-690) -> validateRolePermission -> verifySessionToken -> validateContextualAccess / getDynamicPermissionsForRole -> despacho por action.
- validateRolePermission agrega _verifiedUserId y _verifiedRole al payload autenticado.
- approvePurchaseOrder recibe ese contexto; en la implementación inspeccionada, el actor de aprobación se lee de authenticatedUserId/userId/actorId del payload y el rol de _verifiedRole o authRole.

### Persistencia
- Hoja OrdenesCompra (esquema en Code.gs:157): OrdenCompraID, SolicitudID, CotizacionID, ProveedorID, FechaEmision, FechaEntregaEstimada, DetalleItemsJSON, MontoTotal, CentroCosto, EstadoOrden, AprobadoPor, Observaciones, SolicitanteUserId, VersionDocumental, ArchivoPdfUrl.
- Hoja ProveedoresActivos: ProveedorID, FechaRegistro, NombreProveedor, RTN, Telefono, Email, RubroServicio, Estado, Observaciones.
- Hoja RecepcionesCompra: RecepcionID, OrdenCompraID, FechaRecepcion, ReceptorUserId, DetalleRecibidoJSON, EstadoConformidad, RegistradoEnInventario, AsientoID, Observaciones.
- Hoja PresupuestosInstitucionales: PresupuestoID, AnoID, CentroCosto, PartidaCodigo, MontoAprobado, MontoComprometido, MontoEjecutado, Estado.

### Funciones y relaciones
- createPurchaseOrder (6565-6594) -> escribe una orden en OrdenesCompra con estado inicial Borrador y versión 1.0.
- approvePurchaseOrder (6596-6740) -> lee/escribe OrdenesCompra; usa LockService; consulta y actualiza PresupuestosInstitucionales; registra el estado y observaciones.
- modifyPurchaseOrderAmount (6748-6853) -> modifica MontoTotal y DetalleItemsJSON; puede ajustar PresupuestosInstitucionales; afecta órdenes aprobadas, emitidas, enviadas, aceptadas y parcialmente recibidas.
- generatePurchaseOrderPDF (6861-6943) -> lee OrdenesCompra y ProveedoresActivos; actualiza VersionDocumental y ArchivoPdfUrl; devuelve documentData al llamador.
- getPurchaseOrders (6947-6974 aprox.) -> consulta OrdenesCompra y filtra por proveedor/estado.
- recordPurchaseReceipt (6978-7145) -> lee OrdenesCompra y RecepcionesCompra; puede llamar recordInventoryMovement; actualiza EstadoOrden según recepción acumulada.
- verifyThreeWayMatch (desde 7386) -> relaciona OrdenesCompra, RecepcionesCompra y CuentasPorPagarGastos.

### Flujo funcional observado
- doPost -> validateRolePermission -> createPurchaseOrder / approvePurchaseOrder / modifyPurchaseOrderAmount / generatePurchaseOrderPDF / getPurchaseOrders / recordPurchaseReceipt.
- approvePurchaseOrder y recordPurchaseReceipt modifican EstadoOrden desde rutas distintas; no se observó una bitácora única de transiciones.
- generatePurchaseOrderPDF actualiza los campos únicos VersionDocumental y ArchivoPdfUrl; en la inspección de TASK-015 no se encontró creación efectiva de un archivo PDF dentro de esa función.
- Dependencias y rangos corresponden a la versión de backend/accounting-service/Code.gs auditada en NG_beta (blob SHA 38b979d41596b85e888b4a7060b37bbac0840a28). No se ejecutaron pruebas funcionales.
