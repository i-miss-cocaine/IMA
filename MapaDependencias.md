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


## Cuentas por pagar, pagos a proveedores y notas de crédito (TASK-016 / F18-Task06, auditoría 2026-11-04)

### Seguridad y despacho
- doPost (backend/accounting-service/Code.gs:572-635) -> validateRolePermission -> checkAndRegisterIdempotencyKey -> despacho de recordAccountsPayableExpense, recordSupplierPayment, applySupplierCreditNote y getSupplierAccountsPayableSummary.
- validateRolePermission (430-480) verifica token de sesión y agrega _verifiedUserId / _verifiedRole al payload; las operaciones CxP reciben adicionalmente authRole y referencias de actor aportadas por el payload.
- ROLE_PERMISSIONS (198-202 aprox.): Director y Contador tienen acceso a las operaciones de CxP; Subdirector no tiene recordSupplierPayment, applySupplierCreditNote ni getSupplierAccountsPayableSummary.
- checkAndRegisterIdempotencyKey / saveIdempotentResult (232-273): la clave de idempotencia es opcional (idempotencyToken/idempotencyKey); sin token no se activa el caché de deduplicación.

### Persistencia
- Hoja CuentasPorPagarGastos (esquema Code.gs:157 aprox.): ObligacionID, ProveedorID, NumeroFactura, Importe, Impuestos, FechaVencimiento, EstadoAprobacion, EstadoPago, AsientoID, Observaciones, TotalMonto, SaldoPendiente, TotalAbonado, FechaEmision y FechaRecepcion.
- No existe en el esquema inspeccionado una hoja dedicada de pagos de proveedores ni otra tabla independiente de notas de crédito aplicadas. recordSupplierPayment conserva un marcador de abono dentro de Observaciones y actualiza agregados de la obligación.
- MovimientosCajaBancos (Code.gs:4594-4620 aprox.) almacena movimiento, fecha, método, referencia, proveedor, responsable y observaciones; no contiene cuenta bancaria ni URL de comprobante.
- AsientosContables (Code.gs:8007-8045 aprox.) recibe los asientos creados por pagos y notas de crédito.

### Funciones y relaciones
- recordAccountsPayableExpense (Code.gs:7557-7690 aprox.) -> CuentasPorPagarGastos; invoca verifyThreeWayMatch (7374 en adelante) solo cuando hay ordenCompraId, partidasFacturadas como array y bypassConciliacion es falso; puede dejar la obligación en Aprobado sin conciliación.
- recordSupplierPayment (Code.gs:7692-7788 aprox.) -> actualiza EstadoPago, TotalMonto, SaldoPendiente, TotalAbonado y Observaciones; llama recordCashBankMovement y recordAccountingJournalEntry.
- applySupplierCreditNote (Code.gs:7790-7867 aprox.) -> reduce SaldoPendiente, cambia EstadoPago, concatena la nota en Observaciones y llama recordAccountingJournalEntry.
- getSupplierAccountsPayableSummary (Code.gs:7869-7935 aprox.) -> clasifica vencimientos en memoria y devuelve resumen y obligaciones; no persiste estado Vencida.
- recordCashBankMovement (Code.gs:4594-4620 aprox.) -> MovimientosCajaBancos.
- recordAccountingJournalEntry (Code.gs:8007-8045 aprox.) -> valida igualdad Debe/Haber y escribe AsientosContables.

### Interfaz y pruebas
- dashboard-contabilidad.html carga js/accounting.js como controlador del panel contable. En el archivo inspeccionado no se localizaron funciones, formularios ni llamadas API para recordSupplierPayment, applySupplierCreditNote o getSupplierAccountsPayableSummary.
- runPhase18PurchasingAndSuppliersRegressionSuite (Code.gs:10552 y bloque REG-F18-06) utiliza variables y objetos simulados para el flujo de CxP; no invoca recordSupplierPayment ni applySupplierCreditNote ni verifica persistencia en Sheets.
- tests/regression/academic-grading-suite.js (bloque TASK-016, aprox. líneas 204-208) comprueba principalmente presencia de cadenas y nombres de funciones, no comportamiento real.

### Respaldo e integridad de auditoría
- backend/accounting-service/Code.gs: blob SHA 38b979d41596b85e888b4a7060b37bbac0840a28 (respaldo Git inmutable consultado antes de documentar hallazgos).
- js/accounting.js: blob SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7 (respaldo Git inmutable consultado antes de documentar hallazgos).
- dashboard-contabilidad.html: blob SHA b7653b3bff71829f0f67cf47cb894413c56a444a.
- No se modificó código ni se ejecutaron operaciones contra hojas de cálculo o cuentas bancarias reales. La revisión es estática y no certifica comportamiento operativo.


## Gestión documental, adjuntos y firma electrónica (TASK-038 a TASK-042 / F22-Task01 a F22-Task13, auditoría 2026-11-04)

### Respaldo de código inspeccionado en NG_beta
- backend/accounting-service/Code.gs: SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/developer-service/Code.gs: SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- tests/regression/academic-grading-suite.js: SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.
- Los SHA son referencias inmutables del contenido revisado; no implican que el comportamiento desplegado haya sido probado.

### Validación y carga de archivos (TASK-038)
- backend/accounting-service/Code.gs: validateFileBinaryIntegrity (3975-4098 aprox.) -> uploadPaymentVoucher (4100-4165 aprox.) -> DriveApp / ComprobantesPago.
- backend/user-service/Code.gs: validateFileBinaryIntegrity (5313-5435 aprox.) -> submitInstitutionalFormRequest (5438-5525 aprox.) -> DriveApp / SolicitudesTramites.
- Ambas copias locales de validateFileBinaryIntegrity decodifican Base64, comprueban algunas cabeceras y devuelven detectedFormat/byteLength/MIME; no forman un componente compartido.
- Rutas de bypass observadas: adjuntoUrl/adjuntoFileId sin inspección del binario y carga sin ambos campos fileData/fileName. Los errores de creación en Drive se capturan sin impedir que el flujo continúe con el registro.
- Las dos rutas aplican DriveApp.Access.ANYONE_WITH_LINK y DriveApp.Permission.VIEW, exponiendo el acceso mediante URL.
- No se inspeccionaron permisos efectivos del Drive institucional ni archivos reales.

### Hash documental y registro de firmas (TASK-039)
- backend/accounting-service/Code.gs: computeDocumentSHA256 (4071-4098 aprox.) -> generateSchoolDocument (15040-15150 aprox.) -> DocumentosEscolaresEmitidos; verifySchoolDocumentByCUV (15151-15235 aprox.) consulta CUV y devuelve el hash almacenado.
- generateSchoolDocument calcula la huella de una cadena de metadatos y construye una referencia Drive sintética; el bloque no crea un PDF real ni recalcula bytes durante verifySchoolDocumentByCUV.
- backend/user-service/Code.gs: registerDocumentSignature (6935-6986 aprox.) -> FirmasConformidades. Recibe documentoHash desde payload y calcula signatureHash sobre metadatos de la firma; no se verificó vínculo con bytes/versionado del documento.

### Certificado de finalización (TASK-040)
- backend/user-service/Code.gs: generateSignatureAuditCertificate (6987-7085 aprox.) crea un objeto en memoria a partir de FirmasConformidades y SolicitudesTramites.
- La función no persiste un archivo/certificado independiente ni se observó invocación automática al completar una transacción.
- verifySchoolDocumentByCUV agrega información de firmas al resultado del CUV, sin acreditar por sí sola el estado final de una transacción.

### Proveedor de firma avanzada (TASK-041)
- backend/user-service/Code.gs: configureAdvancedSignatureProvider (7087-7148 aprox.) -> ConfiguracionFirmaAvanzada; getAdvancedSignatureProviderConfig (7149-7187 aprox.) enmascara apiKey en su respuesta, aunque la clave se almacena en texto claro.
- createAdvancedSignatureRequest (7188-7239 aprox.) registra una transacción local Pendiente; no se observó envío al endpoint PSC.
- checkAdvancedSignatureStatus (7240-7295 aprox.) acepta respuestaProveedor desde payload y cambia estado sin validación criptográfica/autenticación del proveedor; si recibe Completada llama registerDocumentSignature.

### Pruebas y orquestación (TASK-042)
- backend/accounting-service/Code.gs: runPhase22DocumentManagementAndSACERegressionSuite (11718-11940 aprox.) ejecuta 12 casos; varios solo comprueban forma/longitud de valores y PT22-01/02 usa IDs de plantilla incompatibles.
- backend/developer-service/Code.gs: runPhase22DocumentManagementAndSACERegressionSuite (1012-1070 aprox.) contiene tres casos que retornan pass:true con expected/actual constantes.
- tests/regression/academic-grading-suite.js (337-358 aprox.) verifica presencia de cadenas mediante includes para TASK-038 a TASK-042.
- La suite contable crea una plantilla y documento mediante funciones que escriben en el Spreadsheet configurado; no se observó aislamiento ni limpieza de esos registros.

### Hallazgos y estado
- AUD-NG-055 a AUD-NG-065: validación incompleta, duplicación, bypass y persistencia parcial, enlaces públicos, hash documental no verificable, firmas sin versión/identidad criptográfica, certificados no persistidos, PSC no autenticado, secretos en texto claro y pruebas insuficientes/no aisladas.
- Las relaciones anteriores corresponden al código estático revisado. No se ejecutaron suites ni se realizaron operaciones en Drive, hojas reales o proveedores externos.
