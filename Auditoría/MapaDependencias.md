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


## Motor de workflows e idempotencia HTTP (TASK-044 y TASK-045 / F23-Task01 y F23-Task02, auditoría 2026-11-04)

### Respaldo de código inspeccionado en NG_beta
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- js/api.js: SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- tests/regression/academic-grading-suite.js: SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.

### Motor de decisiones (TASK-044)
- doPost (backend/user-service/Code.gs:1351-1608) -> validateRolePermission -> checkAndRegisterIdempotencyKey (si existe token) -> processWorkflowDecision -> saveIdempotentResult (si hay token y éxito).
- validateRolePermission (1253-1308 aprox.) comprueba permiso general de acción y contexto básico; no sustituye la autorización del revisor sobre una etapa concreta.
- processWorkflowDecision (6757-6870 aprox.) -> SolicitudesTramites y RevisionesDecisionesTramite; usa LockService.getScriptLock, detecta algunas etapas aprobadas/rechazadas previamente y calcula estados fijos.
- La función recibe revisorId y etapaNombre desde payload antes que identidad/etapa verificadas; callerRole se lee pero no se usa. No consulta FlujosAprobacion para determinar etapa activa o siguiente aprobador.
- accionDecision desconocida cae en una rama por defecto que conserva estado En Revisión y registra la decisión en vez de rechazarla.
- appendRow del historial precede a varias escrituras setValue sobre la solicitud; el lock no garantiza atomicidad ni rollback entre esas escrituras.

### Idempotencia (TASK-045)
- getIdempotencyPayloadSignature (209-216 aprox.) normaliza claves de payload excluyendo los campos de idempotencia y contexto autenticado.
- checkAndRegisterIdempotencyKey (1310-1336 aprox.) consulta CacheService; si no encuentra la clave retorna null.
- saveIdempotentResult (1337-1350 aprox.) almacena solo resultados exitosos en CacheService por 21600 segundos (6 horas); errores de escritura solo generan console.warn.
- doPost ejecuta la operación entre la consulta y la escritura de caché; no reserva la clave de forma atómica ni mantiene registro durable.
- js/api.js fetchApi (11-181 aprox.) envía POST con {action,payload}, no genera ni propaga idempotencyToken/idempotencyKey y reintenta hasta dos veces en ciertos errores de red.
- tests/regression/academic-grading-suite.js (363-370 aprox.) comprueba presencia de nombres/códigos mediante includes; no prueba concurrencia, autorización por etapa ni repetición de POST.

### Hallazgos y estado
- AUD-NG-066 a AUD-NG-072: autorización por etapa incompleta, transiciones no gobernadas por el workflow, escrituras no atómicas, reintentos sin clave, caché temporal opcional, ausencia de reserva concurrente y pruebas no funcionales.
- Revisión estática; no se ejecutaron llamadas HTTP ni pruebas contra hojas operativas.


## Enrutamiento distribuido y catálogo de servicios (TASK-046 y TASK-047 / F23-Task03 y F23-Task04, auditoría 2026-11-04)

### Respaldos de código inspeccionado en NG_beta
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs: SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/accounting-service/Code.gs: SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/developer-service/Code.gs: SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- tests/regression/academic-grading-suite.js: SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.

### Router de fuentes (TASK-046)
- user-service: registerSpreadsheetSource (7293-7338 aprox.), resolveSpreadsheetSource (7339-7380 aprox.).
- academic-service: registerSpreadsheetSource (11453-11498 aprox.), resolveSpreadsheetSource (11499-11540 aprox.).
- accounting-service: registerSpreadsheetSource (14598-14650 aprox.), resolveSpreadsheetSource (14651-14692 aprox.).
- Cada servicio abre su propio SPREADSHEET_ID para leer/escribir CatalogoSpreadsheets; los catálogos no están centralizados.
- Los tres resolvers comparan solo dominioArea + anoLectivo; departamento/servicio se reciben pero no se utilizan.
- Ante ausencia de coincidencia, devuelven success y el SPREADSHEET_ID principal como fallback sin política contextual visible.
- Los resolvers aparecen como endpoint despachado y función declarada, sin llamadas localizadas desde operaciones de negocio; los consumidores siguen usando SPREADSHEET_ID.
- No se observa verificación de existencia/permisos del Spreadsheet destino ni comparación efectiva de schemaVersion/estructura.

### Catálogo de servicios (TASK-047)
- backend/developer-service/Code.gs: getCentralServiceRegistry (2417-2470 aprox.) devuelve CatalogoServicios si contiene filas; si está vacío o ocurre una excepción, retorna defaultServices hardcodeados con correos de ejemplo y el mismo SPREADSHEET_ID.
- registerServiceInstance (2473-2528 aprox.) valida serviceId/name, detecta duplicado solo por serviceId y almacena metadatos opcionales. Si permisosConcedidos no es arreglo, persiste ["*"].
- updateServiceStatus (2531-2572 aprox.) actualiza estado y después anexa HistorialServiciosDistribuidos; acepta updatedBy desde payload. No registra modificaciones de propietario, endpoint, Spreadsheet o permisos.
- No se inspeccionó acceso real a cuentas Google externas ni despliegues Apps Script de terceros; el código auditado solo guarda los valores declarados.

### Pruebas y hallazgos
- tests/regression/academic-grading-suite.js (372-378 aprox.) verifica cadenas mediante includes; no prueba resolución efectiva, aislamiento, multicuenta ni privilegios.
- AUD-NG-073 a AUD-NG-081: router no integrado, catálogos locales divergentes, dimensiones ignoradas, fallback silencioso, falta de validación/historial de fuentes, wildcard de permisos, fallback de catálogo hardcodeado, bitácora incompleta y pruebas estructurales.
- Revisión estática; no se conectaron cuentas externas ni se ejecutaron operaciones sobre fuentes reales.


## Protocolo interservicio HMAC y auditoría criptográfica de decisiones (TASK-048 y TASK-049 / F23-Task05 y F23-Task06, auditoría 2026-11-04)

### Respaldos de código inspeccionado en NG_beta
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs: SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/accounting-service/Code.gs: SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/developer-service/Code.gs: SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- tests/regression/academic-grading-suite.js: SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.

### Protocolo interservicio (TASK-048)
- Los cuatro servicios declaran createInterServiceEnvelope, verifyInterServiceEnvelope, computeHmacSignature y getAuthTokenSecret; no se localizaron llamadas a create/verify fuera de sus declaraciones.
- getAuthTokenSecret usa PropertiesService, pero genera un fallback determinista a partir de SPREADSHEET_ID + sufijo constante si falta AUTH_TOKEN_SECRET.
- verifyInterServiceEnvelope comprueba target y ventana de cinco minutos, reserva REPLAY_REQ_ en CacheService durante 300 segundos antes de comparar HMAC y no consulta CatalogoServicios para autorizar sourceService/action.
- backend/developer-service/Code.gs: ROLE_PERMISSIONS (27-33) asigna ["*"] a Administrador; doPost (145 en adelante) acepta payload.authRole si no recibe token, lo que permite declarar el rol en vez de derivarlo de una sesión verificada.
- No se observó rotación, revocación selectiva ni claves por relación emisor/receptor.

### Cadena de decisiones (TASK-049)
- processWorkflowDecision (backend/user-service/Code.gs:6757-6870 aprox.) calcula hashActual a partir de metadatos limitados y hashPrevio.
- verifyWorkflowDecisionAuditChain (7403-7465 aprox.) recalcula el hash individual, pero no valida continuidad hashPrevio -> hashActual del evento anterior y omite filas sin hashActual.
- El filtro opcional por solicitudId se aplica antes de la verificación, sin reconstruir el enlace global.
- recordWorkflowDecisionCorrection (7467-7525 aprox.) toma revisorId del payload, no comprueba que solicitudId coincida con la decisión original, no valida nuevaAccionDecision y no usa LockService.
- Los hashes no incluyen observaciones/IP ni el motivo/decisionIdOriginal de correcciones.

### Pruebas y estado
- tests/regression/academic-grading-suite.js (380-386 aprox.) verifica presencia de nombres y códigos con includes; no prueba comunicación real, replay, manipulación de filas o correcciones.
- AUD-NG-082 a AUD-NG-090: suplantación de rol en plano de control, helpers HMAC no integrados, secretos predecibles, anti-replay antes de autenticar, ausencia de autorización granular, verificación de cadena incompleta, campos probatorios fuera del hash, correcciones no autorizadas/inconsistentes y pruebas estructurales.
- Revisión estática. No se enviaron peticiones ni se modificaron registros operativos.


## Catálogo centralizado de informes institucionales (TASK-050 / F24-Task01, auditoría 2026-11-04)

### Respaldos de código inspeccionado en NG_beta
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs: SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- js/ui-common.js: SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- tests/regression/academic-grading-suite.js: SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.

### Catálogo y generación
- backend/user-service/Code.gs: getInstitutionalReportCatalog (8396-8621) construye un catálogo maestro de 14 entradas con ID, categoría, área, servicio, descripción, formatos, filtros, indicadores, roles y estado.
- backend/user-service/Code.gs: generateInstitutionalReport (8624-8752) no enruta por cada ID; agrupa por category y utiliza solo dos ramas funcionales (REP-CONT-01 y REP-ACAD-01). Otros IDs de esas categorías comparten esos resultados; las demás categorías llegan a un resultado genérico de muestra.
- El generador no consulta el campo service ni aplica filters/supportedFormats del catálogo.
- js/ui-common.js: renderReportsCenterUI (aprox. 2960-3000) presenta parte de los metadatos; triggerReportGeneration (aprox. 3008-3035) envía reportId y category, sin filtros ni formato.
- backend/academic-service/Code.gs: doPost (714) despacha generateInstitutionalReport, pero no existe una declaración local de esa función; getAcademicInstitutionalReportCatalog (11353-11452) mantiene un catálogo académico separado de cinco entradas.
- getAcademicInstitutionalReportCatalog obtiene el rol de requesterRole/authRole antes de _verifiedRole, aunque validateRolePermission asigna _verifiedRole desde el token verificado.
- ROLE_PERMISSIONS en user-service (926-982) y academic-service (168-260) no concede estáticamente las acciones de catálogo/generación a varios perfiles anunciados; getDynamicPermissionsForRole puede modificar la decisión con MatrizPermisosRoles externa, no versionada en este repositorio.

### Interfaz, pruebas y hallazgos
- tests/regression/academic-grading-suite.js (389-390) contiene dos aserciones de presencia textual para TASK-050; no comprueba comportamiento por ID, rol, filtro, formato o servicio.
- AUD-NG-091: generación no resuelta individualmente por ID/servicio.
- AUD-NG-092: despacho académico hacia función no declarada.
- AUD-NG-093: catálogo académico prioriza roles aportados por cliente.
- AUD-NG-094: discrepancia entre perfiles del catálogo y permisos estáticos; la matriz dinámica externa no fue verificable.
- AUD-NG-095: cobertura de pruebas únicamente estructural.
- AUD-NG-096: encabezado y campo Estado de TASK-050 contradictorios.
- Revisión estática manual; no se ejecutaron operaciones sobre datos institucionales ni se modificó código fuente.
- Última tarea auditada: TASK-050 / F24-Task01. Siguiente tarea secuencial: TASK-051 / F24-Task02.


### Ampliación de evidencia de TASK-050 (AUD-NG-097 a AUD-NG-100)
- backend/accounting-service/Code.gs: getComparativeFinancialSummary (14398-14493 aprox.) existe como generador financiero multianual, pero no está conectado desde generateInstitutionalReport del user-service.
- backend/user-service/Code.gs: generateInstitutionalReport (8624-8752) no valida rolesPermitidos ni estado Activo por reportId antes de devolver datos; la validación general de acción del despachador no reemplaza el permiso por recurso.
- La misma función introduce TRX-1001 por L. 2,500.00, alumnos EST-001/EST-002 y métricas académicas constantes cuando no hay registros fuente; también devuelve INF-001 en la rama genérica.
- Los parámetros anoLectivo, grado, seccion, fechaInicio, fechaFin y estado se extraen del payload, pero no filtran las iteraciones reales de ComprobantesPago/PagosAbonos ni CalificacionesEstudiantes.
- js/ui-common.js: renderReportsCenterUI (aprox. 2955-3024) no contiene controles de búsqueda o filtrado; el backend no incorpora area en la búsqueda textual.
- AUD-NG-097 se vincula con la tarea AUD-NG-094; AUD-NG-099 se vincula con AUD-NG-091; las nuevas tareas AUD-NG-098 y AUD-NG-100 se agregan al final de Pendientes.md.


## Relaciones verificadas durante auditoría de continuidad - Lote B (2026-11-04)

> Este bloque registra únicamente relaciones inspeccionadas en el snapshot NG_beta_0.0.0.1 (commit 44d9891132332e692dbe2ba8602b41f50a508a59). No certifica el grafo completo ni sustituye los apartados heredados de este mapa.

### Transporte HTTP y configuración académica
- `js/api.js` / `fetchApi` (líneas 15-190 aprox.) -> `window.SERVICE_URLS` de `js/config.js`; envía POST con `Content-Type: text/plain` y cuerpo JSON; utiliza `window.PersistenceManager.get/reconcile` cuando se configura caché.
- `js/config.js` / `window.syncAcademicScope` (líneas 391-480) -> `fetchApi('ACADEMIC', 'getAcademicConfig', ...)`; normaliza respuesta y actualiza `window.GLOBAL_SCOPE` / `window.PARCIAL_ACTUAL`; cuando cambia el alcance emite `academic-scope-updated`.
- `js/student.js` (líneas 2658-2667) escucha `academic-scope-updated`; si no existe una carga activa invalida caché y vuelve a invocar `fetchAllActivities`.

### Dashboard estudiantil y persistencia local
- `js/student.js` / `fetchAllActivities` (líneas 1165-1346) -> `PersistenceManager.get`, `syncAcademicScope`, `fetchApi('TASK','getStudentTasks')`, `fetchApi('EXAM','getStudentExams')`, `renderStudentExpediente` y `renderSubjectNavigation`.
- `js/student.js` / `renderSubjectNavigation` (desde línea 1608) -> `window.GLOBAL_SCOPE.GranularConfig`, `academicHistory`, `window.isContentAuthorized` y el contenedor HTML `#tasks-list`; construye tarjetas por asignatura y la vista expandida.
- `js/persistence.js` / `PersistenceManager.get` (línea 77) -> `init` (IndexedDB, línea 20); `init` solo crea los almacenes enumerados en `STORES` (línea 10) y puede rechazar si falla `indexedDB.open`.

### Persistencia académica tabular
- `backend/academic-service/Code.gs` / `getOrCreateSheet` (líneas 84-92) crea `ConfiguracionAcademica` con 9 columnas y `HistorialAcademico` con 8 columnas cuando la hoja no existe.
- `getAcademicConfig` (línea 12388) lee índices de la tabla de 9 columnas; `updateAcademicConfig` (línea 12404) reconstruye filas granulares y escribe con el ancho de encabezados existente; `saveToAcademicHistory` (línea 12515) genera filas de 8 columnas.
- La consulta de configuración del frontend se dirige al microservicio ACADEMIC; el código actual de `backend/user-service/Code.gs` ya no contiene las funciones `getAcademicConfig` ni `updateAcademicConfig`.


## Relaciones verificadas durante auditoría de continuidad - Lote C (2026-11-04)

> Relaciones acotadas a los archivos y funciones inspeccionados en el commit de referencia 44d9891132332e692dbe2ba8602b41f50a508a59.

### Configuración y persistencia académica
- `backend/academic-service/Code.gs` / `getAcademicConfig` (líneas 12388-12402) consulta `ConfiguracionAcademica` por profesor o grado/sección y devuelve `GradoActual`, `SeccionActual`, `AsignaturaActual` y `GranularConfig` a partir de las filas relevantes.
- `updateAcademicConfig` (líneas 12404-12513) escribe la tabla `ConfiguracionAcademica`, separa `ParcialActual` y `UnidadActual`, valida conflictos entre docentes y llama a `saveToAcademicHistory` antes de liberar el ScriptLock.
- `saveToAcademicHistory` (líneas 12515-12584) lee y escribe `HistorialAcademico`; construye una clave de deduplicación con parcial, grado, sección, asignatura y profesor.
- La tabla `PeriodosAcademicos` se crea en `getOrCreateSheet`; en la ruta auditada no se observó llamada desde `updateAcademicConfig` ni desde `saveToAcademicHistory`.

### Navegación docente
- `js/teacher.js` / `renderGrados` (línea 3786) consume `window.GLOBAL_SCOPE.GradoActual`.
- `renderSecciones` (línea 3836) consume `window.GLOBAL_SCOPE.GranularConfig` y filtra por grado.
- `renderAsignaturas` (línea 3871) consume `window.GLOBAL_SCOPE.GranularConfig` y filtra por parcial activo, grado y sección.

### Dashboard estudiantil
- `js/student.js` / `renderStudentHeader` (líneas 80-120) consume `currentUser.email` y `currentUser.telefono`; construye el enlace `wa.me/504`.
- `student-dashboard.html` (líneas 152-166) presenta selector de parcial e instrucción para seleccionar asignatura.
- `js/student.js` / `renderSubjectNavigation` (líneas 1608-1670) utiliza `GLOBAL_SCOPE.GranularConfig`, selector de parcial y la variable local `matchParcial` para filtrar asignaturas.


## Relaciones verificadas durante auditoría de continuidad - Lote D1 (2026-11-04)

- `METODOLOGIA_DESARROLLO.md`: define los archivos maestros `Auditoria.txt`, `ChangesLogs.txt`, `Pendientes.md`, `MapaDependencias.md` y el flujo de ocho fases Fase 0-Fase 7 (secciones 3-4).
- `backend/Spreadsheet/AREA DE INFORMATICA IMA.xlsx`: archivo de referencia versionado (blob SHA `d013d4d3b35252b62327ef210829d6855c107f47`, 904,629 bytes); el contenido no pudo inspeccionarse en esta sesión.
- `backend/academic-service/Code.gs` / `updateAcademicConfig`: recibe `fullScope.hierarchicalAssignments`, valida conflictos por parcial/grado/sección/asignatura y persiste filas en `ConfiguracionAcademica`.
- `js/teacher.js` / `initAssignmentBuilder`: construye asignaciones y llama a `fetchApi('ACADEMIC','updateAcademicConfig')`; usa `window.GLOBAL_SCOPE` y `confirmedAssignments`.
- `js/teacher.js` / `pushNav` y `renderCurrentLevel`: mantienen `navStack` y despachan los niveles Grados, Secciones, Asignaturas, Alumnos y Detalles a sus funciones de renderizado.
- `renderGrados`, `renderSecciones` y `renderAsignaturas`: consumen `GLOBAL_SCOPE`; el filtrado por parcial se aplica explícitamente en `renderAsignaturas`, no en los dos niveles anteriores (hallazgo AUD-NG-115).


## Relaciones verificadas durante auditoría de continuidad - Lote D2 (2026-11-04)

### Tareas, entregas y evaluaciones
- `backend/task-service/Code.gs` / `submitAssignment` (líneas 892-972) -> `Tareas`, `Entregas` y `EntregasVersiones`; detecta estado `EntregadaTarde` y conserva versiones de entregas.
- `gradeSubmission` (líneas 1064-1087) actualiza calificación/estado/comentario en `Entregas`; no escribe una rectificación en `EntregasVersiones`.
- `backend/exam-service/Code.gs` / `getTeacherExamActivity` y `gradeExamSubmission` (líneas 1180-1250) -> `Examenes` y `EntregasExamen`; la calificación se actualiza en la fila existente.
- `js/teacher.js` / `fetchTeacherActivity` y `saveGradeBtn.onclick` unen actividad de TASK/EXAM y despachan la calificación al microservicio correspondiente.

### Cierre de año
- `teacher-dashboard.html` / modal de cierre -> `js/teacher.js` / botón `btnCloseYear` -> `fetchApi('TASK','closeAcademicYear')`.
- `closeAcademicYear` (task-service, líneas 524-612) -> `Tareas`, `Entregas`, `ConfiguracionAcademica`, `Log_Cierres` y DriveApp; no se observó integración con las hojas `Examenes`, `PreguntasExamen` o `EntregasExamen`.

### Asistencia y privacidad
- `js/teacher.js` / `initAttendanceModule` y `loadAttendanceSheet` (líneas 5450-5530) -> USER/getStudentsByGradoSeccion y ACADEMIC/getDailyAttendance.
- `backend/academic-service/Code.gs` / `openAttendanceSession`, `saveClassAttendance`, `getClassAttendance`, `saveDailyAttendance`, `getDailyAttendance`, `getStudentAttendanceSummary` -> `SesionesAsistencia` y `RegistrosAsistencia`.
- `js/student.js` / `fetchAndRenderStudentAttendanceSummary` (línea 1046) -> ACADEMIC/getStudentAttendanceSummary.
- ROLE_PERMISSIONS otorga acciones de consulta de asistencia a Padre/Tutor/Responsable y Profesor; validateContextualAccess no aplica vínculo familiar ni asignación docente a estos endpoints en la ruta inspeccionada.

### Dashboard y recursos estudiantiles
- `js/student.js` / `renderSubjectNavigation` (líneas 1608-1775) -> `GLOBAL_SCOPE.GranularConfig`, `academicHistory`, tareas/exámenes; ordena pendientes por fecha límite ascendente para la tarjeta.
- `expandSubject` (líneas 1745-1760) -> `renderActivitiesIntoContainer`; vuelve a ordenar las actividades en sentido descendente.
- `js/index-ui.js` / `renderDownloadSubjects` y `renderDownloadTopics` (líneas 220-335) -> `GLOBAL_SCOPE.UnidadActual` para filtrar recursos por unidad activa.


## Relaciones verificadas durante auditoría de continuidad - Lote E1 (2026-11-04)

### Marca institucional y PWA
- `index.html`, `login.html`, `register.html`, `student-dashboard.html` y `teacher-dashboard.html` enlazan `manifest.json` y `imagenes/new-generation-logo.png`; los títulos principales usan New Generation Bilingual School and Institute.
- `manifest.json` define `name`, `short_name`, `start_url`, `display` e iconos del recurso `new-generation-logo.png`.

### Autenticación y RBAC
- Corrección C1.297: `js/auth.js` recibe `sessionToken` de USER/loginUser pero no lo conserva en `currentUser`; `js/api.js` fetchApi solo añade requesterUserId/requesterRole y no transmite token. AUD-NG-001 sigue abierto.
- `backend/user-service/Code.gs` / `doPost` -> `validateRolePermission` -> `getUserVerifiedRole` -> `verifySessionToken` -> `getAuthTokenSecret`; el rol y userId verificados se colocan en `payload._verifiedRole` y `payload._verifiedUserId`.
- `validateRolePermission` -> `validateContextualAccess` -> `getGuardianStudents` para restricciones de estudiante y vínculo familiar; un allowlist de acciones especiales retorna antes de esta validación.
- `generateSessionToken` y `verifySessionToken` firman/verifican con HMAC-SHA256; el fallback de `getAuthTokenSecret` deriva una clave de SPREADSHEET_ID.
- `getProblemTickets`, `replyProblemTicket` y `submitProblemTicket` consumen identificadores de usuario del payload; `getAutomationRules` lee reglas sin comprobar rol dentro de la función.


## Relaciones verificadas durante auditoría de continuidad - Lote E2A (2026-11-04)

### Matrícula y cargos
- `js/secretary.js` / conversión de admisión -> ACADEMIC/`convertAdmissionToStudent` -> `registerStudentEnrollment` -> hojas `Matriculas` y `CargosEstudiante`.
- ACADEMIC/`createStudentEnrollment` y `renewStudentEnrollment` -> `Matriculas`; el flujo nuevo no invoca el generador de cargos.
- ACADEMIC/`getStudentEnrollmentHistory` -> `Matriculas` + `CargosEstudiante`; `js/student.js` lo usa para actualizar `student-enrollment-badge`.

### Contabilidad
- `js/config.js` / `SERVICE_URLS.ACCOUNTING` y `SERVICE_REGISTRY.ACCOUNTING.endpointUrl` -> `fetchApi` en `js/api.js`; el valor actual es un placeholder.
- ACCOUNTING/`previewBatchMonthlyCharges` -> `Matriculas`, tarifas/conceptos y cargos existentes; ACCOUNTING/`generateBatchMonthlyCharges` -> `CargosEstudiante` y aplica beneficios aprobados.
- ACCOUNTING/`getStudentAccountStatement` -> `CargosEstudiante` + `PagosAbonos`; actualmente llama a `applyApprovedScholarshipsToCharges` durante la consulta.
- ACCOUNTING/`recordStudentPayment` -> `PagosAbonos` + actualización de `CargosEstudiante`; el control de propiedad de cargo y saldo debe reforzarse.
- `js/accounting.js` contiene funciones de UI, pero no se carga desde las páginas HTML actuales.


## Relaciones verificadas durante auditoría de continuidad - Lote E2B (2026-11-04)

### Portal de pagos y recibos
- `student-dashboard.html` define `tab-financial` y `voucher-modal`; `js/student.js` no conecta esos elementos y solo activa pestañas de actividades/progreso.
- `backend/accounting-service/Code.gs` / `uploadPaymentVoucher` -> `ComprobantesPago` y DriveApp; el archivo queda compartido ANYONE_WITH_LINK.
- `recordStudentPayment` -> `PagosAbonos` con reciboId aleatorio; `generatePaymentReceiptPDF` consulta el pago y retorna un objeto JSON, sin generar archivo PDF.
- `js/accounting.js` no está cargado por las páginas HTML actuales.

### Facturación fiscal
- `configureSARAuthorizedCAI` -> `AutorizacionesCAI`.
- `createFiscalInvoice` -> `FacturasFiscales` y actualiza `AutorizacionesCAI.UltimoCorrelativo`; recibe opcionalmente `reciboCajaId` para relacionar un recibo interno.
- `getFiscalInvoices` consulta `FacturasFiscales`; actualmente permite consulta sin filtros y por facturaId sin validar titular.
- `PagosAbonos` (recibo interno) y `FacturasFiscales` (documento fiscal) son hojas separadas, pero la vinculación recibo-factura no valida pago confirmado ni unicidad.

### Identidad institucional
- El portal usa New Generation Bilingual School and Institute; los datos de recibo en ACCOUNTING declaran New Generation Christian Academy.


## Relaciones verificadas durante auditoría de continuidad - Lote F1 (2026-11-04)

### Caja, bancos y cuentas por pagar
- `recordCashBankMovement` -> `MovimientosCajaBancos`; `closeCashSession` -> `CierresCaja`; `performBankReconciliation` compara movimientos y partidas importadas.
- `recordAccountsPayableExpense` -> `verifyThreeWayMatch` -> `OrdenesCompra` + `RecepcionesCompra` + factura proveedor -> `CuentasPorPagarGastos`.
- `recordSupplierPayment` -> `PagosProveedores` + salida de caja/banco + asiento; `applySupplierCreditNote` actualiza saldo de proveedor.

### Nómina y RRHH
- `calculatePayrollPeriod` -> `ExpedientesLaborales`, contratos, asistencia, horas extra, incapacidades y `Nomina`; calcula IHSS/RAP/ISR con parámetros hardcodeados.
- `recordStaffCheckIn` y `getStaffAttendanceLogs` -> `AsistenciaPersonal`; `getEmployeeSelfServicePortal` consulta expediente/contrato/recibos.
- `generatePayrollReceiptPDF` devuelve una URL nominal, no un archivo generado.

### Inventario y activos
- `recordInventoryMovement` -> `InventariosKardex`; `transferInventoryStock` -> salida en origen + `TransferenciasInventario`; `confirmTransferReceipt` -> entrada en destino.
- `createMaterialRequisition` -> `MaterialesSolicitudes`; `deliverMaterialRequisition` -> salida de Kardex.
- `createPhysicalInventoryCount`/`reconcilePhysicalCount` -> `InventariosConteosFisicos` + ajustes Kardex.
- `manageMaintenanceOrder` -> `MantenimientoOrdenes` + repuestos en Kardex; `manageAssetItem`, `assignAssetCustody`, `returnAssetCustody` y `registerAssetDisposal` -> activos, asignaciones y bajas.


## Relaciones verificadas durante auditoría de continuidad - Lote F2 (2026-11-04)

### Noticias
- `js/teacher.js` -> USER/`createNews`, USER/`getNews`, USER/`updateNewsStatus`; el DTO de respuesta de la última declaración `getNews` no coincide con el que espera la UI.
- `js/index-ui.js` -> USER/`getNews` sin audiencia; renderizador espera `data`, estado `Activo` y campo `fechaExpiracion`.

### Salud de microservicios
- `js/api.js` / `checkAllMicroservicesHealth` -> USER/ACADEMIC/TASK/EXAM mediante acción `ping`.
- USER y ACADEMIC implementan ping; TASK/EXAM no. DEVELOPER ofrece `getServiceHealthDiagnostics` con PASS fijo; ACCOUNTING tiene ping pero no está en la lista monitorizada.

### Logs
- USER/ACADEMIC/`logStructuredEvent` -> hoja compartida `LogsSistema` con sanitización limitada a credenciales.
- USER/`getStructuredLogs` -> `js/developer.js` viewer; campos y filtros no coinciden.
- DEVELOPER/`getCentralizedLogs` devuelve sampleLogs hardcodeados y no persiste resolución.

### Respaldos
- ACADEMIC/`createSystemBackup` -> Drive `New Generation/Respaldos`; `listSystemBackups` lista archivos; `verifyBackupIntegrity` calcula hash y `restoreSystemBackup` restaura hojas.
- `js/teacher.js` llama a ACADEMIC directamente, pero manda confirmationCode en vez de confirmCode y omite confirmed.
- `js/developer.js` usa wrappers API antiguos que llaman acciones USER no implementadas y fallback mock.
- No se encontró trigger programado ni política de retención.


## Relaciones verificadas durante auditoría de continuidad - Lote G1 (2026-11-04)

### Guías de estudio (REQ-DOC-001)
- teacher-dashboard.html (form-guia-estudio) -> no se encontraron listeners en js/teacher.js para crear/editar/consultar/desactivar.
- student-dashboard.html (view-guias) -> no se encontraron listeners en js/student.js para cargar la vista dedicada.
- js/api.js (saveStudyGuide/getStudyGuides/toggleStudyGuideStatus) -> acciones ACADEMIC createOrUpdateStudyGuide/getStudyGuides/toggleStudyGuideStatus; no se encontraron en el router/funciones de backend/academic-service/Code.gs.
- js/student.js (fetchAndRenderVirtualClassroom) -> TASK/getStudyMaterials -> backend/task-service/Code.gs -> hoja MaterialesEducativos. El endpoint público no aplica grado/asignatura/sección aunque el cliente envía algunos de esos filtros.
- TASK/createStudyMaterial -> MaterialesEducativos; TASK/deleteStudyMaterial marca estado Eliminado. No se encontró operación de actualización/sustitución.

### Contenido de clase y presentaciones (REQ-DOC-002)
- js/config.js (PRESENTATION_INDEX) -> cuatro asociaciones estáticas tema/asignatura/grado/archivo; no se encontró consumidor en js/teacher.js ni js/student.js.
- js/teacher.js (virtual-classroom-publisher-form) -> TASK/createPost o TASK/createStudyMaterial; el formulario referenciado no existe en teacher-dashboard.html y la ruta de material usa unidad/tema genéricos.
- js/data.js -> catálogo estático de temas y rutas HTML locales; no se verificó relación persistente con Drive, fecha de clase ni tareas asociadas.

### Creación de tareas (REQ-DOC-003)
- teacher-dashboard.html (create-assignment-form) -> js/teacher.js (Quill y submit handler) -> TASK/createTask -> hoja Tareas.
- createTask almacena los campos recibidos, pero no valida título, descripción, fecha límite ni modalidad en servidor.
- El formulario ofrece Tarea/Crédito Extra y un único editor; no se observó selección de modalidad documental o ejercicios.


## Relaciones verificadas durante auditoría de continuidad - Lote G2 (2026-11-04)

### Guías informativas y tareas evaluables (REQ-DOC-004)
- backend/task-service/Code.gs/getStudentTasks -> DTO con tipoRecurso, pero sin archivoUrl -> js/student.js/getActivityHtml espera archivoUrl para la descarga de guías.
- js/student.js/getActivityHtml -> rama visual GuiaEstudio/MaterialApoyo sin botón de entrega.
- js/student.js/submit modal -> TASK/submitAssignment -> Entregas; submitAssignment no valida tipoRecurso.
- TASK/gradeSubmission -> hoja Entregas; no consulta el tipo de recurso de la tarea relacionada.
- TASK/createTask -> hoja Tareas con tipoRecurso; el formulario docente no expone un selector para guía/material de apoyo/ejercicios.

### Fecha impartida y fecha límite (REQ-DOC-005)
- teacher-dashboard.html/fechaClase + fechaLimite -> js/teacher.js/FormData -> TASK/createTask.
- El formulario envía fechaClase, pero createTask no la recibe ni la persiste; no se encontró cálculo fechaClase + 1 ni validación cruzada.
- TASK/createTask/updateTask -> hoja Tareas almacena fechaLimite, no fechaClase.

### Hora de disponibilidad (REQ-DOC-006)
- teacher-dashboard.html/horaDisponible (HH:MM) -> FormData de js/teacher.js sin conversión -> TASK/createTask espera fechaDisponible.
- TASK/getStudentTasks devuelve fechaDisponible ISO -> js/student.js/getActivityHtml consulta horaDisponible.
- TASK/submitAssignment consulta fechaLimite para marcar tardanza, pero no aplica fechaDisponible; no existe enforcement de disponibilidad en el endpoint.
- TASK/createTask guarda estado inicial Activa; getStudentTasks no expone la máquina de estados descrita en la tarea.


## Relaciones verificadas durante auditoría de continuidad - Lote H1 (2026-11-04)

### Dashboard estudiantil (REQ-DOC-007)
- TASK/getStudentTasks -> DTO de tareas (sin tema ni archivoUrl) -> js/student.js/allActivitiesData -> renderSubjectNavigation -> tarjetas por asignatura.
- EXAM/getStudentExams -> allActivitiesData; getStudyMaterials se carga por un flujo de aula virtual separado y no se integra en esas tarjetas.
- renderSubjectNavigation/pendingActivities -> cuenta cualquier actividad sin entrega, incluidas filas GuiaEstudio/MaterialApoyo.
- getActivityHtml -> guía informativa visual, estados de entrega y etiqueta de vencimiento; el cálculo de vencimiento no excluye guías.

### Carpetas y carga Drive (REQ-DOC-008)
- js/student.js/startAutomatedUpload -> uploadFile para carga directa -> DRIVE_FOLDER_ID/grado/sección/alumno/parcial/asignatura/tarea.
- getOrCreateFolder -> getFoldersByName exacto -> createFolder; solo trim y bloqueo no verificado, sin normalización canónica.
- js/student.js (>9.5 MB) -> js/ui-common.js/uploadResumableFile -> sendApiRequest(initiateResumableUpload) -> backend TASK; la acción no está autorizada ni despachada en doPost.
- TASK/initiateResumableUpload -> .temp_resumable_uploads/sessionKey; reconstructFileParts crea archivo final en esa carpeta temporal y no registra metadatos ni mueve a la jerarquía institucional.

### Metadatos documentales (REQ-DOC-009)
- TASK/uploadFile -> logFileMetadata -> hoja MetadatosArchivos (19 columnas).
- uploadFile solo envía un subconjunto de los campos; logFileMetadata completa título/tipo/tema/año/ruta con valores por defecto o fileUrl.
- reconstructFileParts no invoca logFileMetadata; la ruta reanudable no deja registro documental.


## Relaciones verificadas durante auditoría de continuidad - Lote H2 (2026-11-04)

### Panel de desarrollador (REQ-DOC-010)
- developer-dashboard.html/export controls -> js/developer.js -> window.exportSchoolYearArchive -> js/api.js/exportSchoolYearArchive -> ACADEMIC action ausente.
- TASK/doPost incluye case generateAcademicArchiveZip, pero no existe implementación de la función ni Utilities.zip; relacionado con AUD-NG-120.
- Health checks/logs/backups -> AUD-NG-144/AUD-NG-145/AUD-NG-146.
- No existe configuración de horaPublicacion/intervaloPostClase en developer-dashboard, js/developer, js/api o ACADEMIC; nueva dependencia AUD-NG-156, complementaria a AUD-NG-152.

### Analítica y asistencia (REQ-DOC-011)
- TASK/getStudentTasks + EXAM/getStudentExams -> js/student.js/allActivitiesData -> renderStudentProgress; no incorpora proyectos.
- renderStudentProgress -> gradeSum/calificacion||0, deliveryRate y punctualityRate; ausencia de actividades puede producir compositeProgress 20%.
- ACADEMIC/getStudentAttendanceSummary -> porcentajeAsistencia 100.0 cuando no hay filas -> dashboard muestra asistencia perfecta sin registros.
- Penalización tardía del 50% -> AUD-NG-121; no duplicar.

### Autorización de escrituras y trazabilidad (REQ-DOC-012)
- TASK/validateRolePermission -> validateContextualAccess; el control contextual solo restringe roles estudiantiles/familiares, no valida asignación de Profesor.
- TASK/createTask/createStudyMaterial -> profesorId/autorId del payload -> hojas Tareas/MaterialesEducativos; no compara con _verifiedUserId ni AsignacionesDocentes.
- TASK/updateTask -> sobrescribe fechaLimite en Tareas; no registra valor anterior/nuevo ni historial append-only.
- Sesión/HMAC -> AUD-NG-001/AUD-NG-004; lectura contextual -> AUD-NG-002; config/cierre/asistencia/calificaciones -> AUD-NG-108/AUD-NG-119/AUD-NG-122/AUD-NG-124; privacidad Drive -> TASK-085/TASK-142.


## Auditoría del registro completadas.md - inventario inicial (2026-11-04)
- Fuente: completadas.md (5,963 líneas; 231 declaraciones; 183 identificadores únicos).
- SHA de referencia: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- Plan de auditoría: AUDITORIA_COMPLETADAS_PLAN.md.
- La auditoría de completadas_legacy.md no cubre este registro; se abre un proceso separado por lotes C0-C6.
- Criterio: no inferir cumplimiento a partir de [X]; contrastar cada requisito con su flujo real y considerar versiones repetidas/actualizadas de identificadores.
- Primer punto de inspección: AUDIT-CR-01; todavía no se ha dictaminado ninguna tarea de completadas.md.


## Lote C0 - componentes de Code Review verificados (2026-11-04)
- backend/user-service/Code.gs/normalizeString (839-843) -> parseGrade; normalización NFD, minúsculas, eliminación de diacríticos y trim.
- js/ui-common.js/toggleRoleMenuAccordionSection (4709-4720) -> controles de acordeón del menú móvil y selección de sección inicial.
- js/ui-common.js/openMobileHamburgerDrawer (4758-4847) -> botón hamburguesa; crea el drawer una vez y agrega el nodo a document.body; las aperturas siguientes reutilizan el nodo.
- js/ui-common.js/openGlobalOmniboxModal (4935-5000) -> input Omnibox y listener input/debounce; focus/select se ejecuta al abrir el modal, no al escribir.

## Lote C1.1 - seguridad de identidad y sesiones (2026-11-04)
- js/auth.js/login handler (140-165) -> recibe loginUser; construye currentUser sin conservar sessionToken.
- js/api.js/fetchApi (45-57) -> añade requesterUserId/requesterRole desde localStorage/sessionStorage; body no transmite sessionToken.
- USER/loginUser (2479-2537) -> emite sessionToken firmado y lo devuelve; USER/getUserVerifiedRole verifica claims.
- USER/PUBLIC_ACTIONS (920-924) -> incluye logoutUser como acción pública.
- USER/logoutUser (2456-2475) -> acepta userId/sessionId del payload y llama revokeUserSession sin exigir que los valores pertenezcan al token.
- USER/revokeUserSession (2318-2332) -> escribe marcas revoked_user_/revoked_session_ durante 21,600 segundos; verifySessionToken rechaza revoked_user_ y loginUser no limpia esa marca.
- TASK/PUBLIC_ACTIONS (75-90) y EXAM/PUBLIC_ACTIONS (60-80) -> consultas académicas quedan fuera del control de token; relacionadas con AUD-NG-002.
- AUTH común en los cinco servicios -> fallback HMAC derivado de SPREADSHEET_ID y validación de exp opcional en varios verificadores; AUD-NG-003/AUD-NG-004.
- Hallazgo nuevo AUD-NG-159: revocación de sesiones ajenas desde logoutUser público.

## Lote C1.2 - autorización institucional FASE2-T01 (2026-11-04)
- USER/generateSessionToken -> incluye role en claims y exp de 24 horas.
- USER/verifySessionToken -> valida firma, expiración condicional, revocación y estado de cuenta; no revalida el rol vigente del usuario.
- ACADEMIC/ACCOUNTING/TASK/EXAM/validateRolePermission -> usa claims.role como userRole.
- USER/getUserVerifiedRole -> no implementa caché de decisión por usuario; el estado de cuenta sí se cachea por userId. La matriz dinámica es global por rol/acción.
- Cambio de rol -> no se identificó invalidación automática de tokens ni versión de rol; nuevo AUD-NG-160.


## Lote C1.3 - idempotencia y reintentos HTTP FASE2-T02 (2026-11-04)
- js/api.js/fetchApi (10-14, 25-69, 143-151) -> construye solicitudes POST para todas las acciones; reintenta errores de red hasta dos veces sin clasificar lecturas/escrituras ni generar una clave idempotente.
- ACADEMIC/doPost (router y despacho) -> validateRolePermission -> checkAndRegisterIdempotencyKey -> handler -> saveIdempotentResult.
- ACCOUNTING/doPost (572-604 y final del despacho) -> validateRolePermission -> checkAndRegisterIdempotencyKey -> handler -> saveIdempotentResult.
- ACADEMIC/ACCOUNTING/checkAndRegisterIdempotencyKey (268-312 / 220-264) -> CacheService con clave IDEM_<action>_<token>; lectura y escritura de resultado separadas, sin reserva atómica, TTL de 21,600 segundos.
- ACCOUNTING/recordStudentPayment (3890-3955) -> deduplicación local en PagosAbonos por idempotencyKey/tokenTransaccion/referencia; no hay bloqueo alrededor de consulta e inserción. Alcance transaccional existente: AUD-NG-133.
- ACADEMIC/createAdmissionRequest (985-1055) -> chequeo de clave, LockService y deduplicación natural por identidad; el resultado se guarda después de la escritura.
- ACADEMIC/createStudentEnrollment (11140-11220) -> LockService y detección de matrícula activa por estudiante/año; no vincula una clave idempotente con el resultado.
- ACCOUNTING/runCriticalProcessConcurrencySuite (10505-10550) -> comprueba adquisición de un único lock y conteos de filas; marca PASSED sin verificar unicidad ni concurrencia real. Consulta TransaccionesCobro, mientras recordStudentPayment escribe PagosAbonos.
- Hallazgos relacionados: AUD-NG-006 (idempotencia por operación desde el cliente), AUD-NG-133 (idempotencia atómica de pagos). Hallazgo nuevo AUD-NG-161: suite de concurrencia con falsos positivos.
- Respaldo de código: js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; ACADEMIC daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING 38b979d41596b85e888b4a7060b37bbac0840a28.


## Seguridad de sesión y experiencia de expiración (T-UX-01 / AUD-NG-162, auditoría 2026-11-04)
- backend/user-service/Code.gs: getUserVerifiedRole -> verifySessionToken; doPost devuelve actualmente AUTH_PERMISSION_DENIED ante rechazo de autenticación, pero el mismo código se utiliza para denegaciones normales de rol/permisos.
- js/api.js: fetchApi detecta AUTH_PERMISSION_DENIED y muestra toast; no conecta con handleSessionExpired ni limpia credenciales.
- js/ui-common.js: setupCommonUI define handleSessionExpired, que limpia currentUser, usuario_actual, usuario_sesion y sessionToken de localStorage/sessionStorage y redirige a login.html?session_expired=....
- login.html / js/auth.js: no interpretan session_expired ni muestran aviso de sesión expirada.
- js/ui-common.js: runUXSuiteTests / UX-01 verifica solo la existencia de handleSessionExpired, no el flujo conductual.
- Dependencia requerida: el contrato backend debe separar autenticación inválida/expirada/revocada de autorización insuficiente antes de que fetchApi invoque el manejador; un rechazo RBAC no debe cerrar una sesión válida.

 
## Auditoría de completadas.md - TAREA-02 (2026-11-05)

- **Dictamen:** Cumple parcialmente; no existe actualmente una matriz maestra unificada de requisitos, dependencias y pruebas.
- **Evidencia:** MapaDependencias.md contiene relaciones técnicas parciales y anexos de auditoría, pero no la sección de matriz maestra que ChangesLogs.txt atribuye a TAREA-02. README.md ofrece una descripción arquitectónica general sin IDs de requisitos, criterios, pruebas, evidencias, prioridades ni tareas de resolución.
- **Trazabilidad:** ChangesLogs.txt registra históricamente la supuesta adición de la matriz, pero el artefacto actual no la contiene. La versión actual del mapa tampoco permite detectar de forma sistemática requisitos sin implementación, pruebas huérfanas o componentes sin responsable.
- **Hallazgo existente:** AUD-NG-010 cubre la insuficiencia del inventario y la trazabilidad; su alcance se amplía en Pendientes.md. AUD-NG-011 permanece relacionado con la evidencia de aislamiento curricular.
- **No duplicar:** No se crea un nuevo AUD-NG para esta causa.
- **Calidad:** el mapa mezcla relaciones puntuales y anexos de distintas auditorías sin un esquema uniforme ni control integral de cobertura.


## Auditoría de completadas.md - TAREA-03 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE.
- **Trazabilidad de evidencia:** ChangesLogs.txt afirma que js/api.js implementó OPERATIONAL_HEALTH_METRICS, getServiceHealthMetrics, contadores y detección de cuota/backoff; esos símbolos no existen en el archivo vigente.
- **USER:** getOperationalCapacityMetrics agrega BitacoraTrazabilidad y calcula latencia/error/cuota por texto; getServiceHealthReport agrega LogsSistema y utiliza versiones/umbrales fijos. No se demuestra cobertura de los cinco servicios ni alertas reales.
- **ACADEMIC:** getStorageQuotaMetricsReport asigna capacityUsagePct = 15.5, por lo que los umbrales no representan uso real.
- **TASK:** getDriveStorageQuotaMetricsReport consulta Drive de forma puntual; no mide otras cuotas ni capacidad general.
- **EXAM:** getGradingPerformanceAndPersistenceMetrics mide filas y latencia de lectura de hojas; no mide cuota ni errores operativos.
- **Cliente/persistencia:** fetchApi mantiene reintentos lineales de 1 y 2 segundos y sin clasificación estructurada de cuotas. js/persistence.js implementa IndexedDB/cache, no checkpoints de trabajos masivos.
- **Hallazgo nuevo:** AUD-NG-163 para telemetría real de cuotas/capacidad, alertas preventivas y checkpoints generales.
- **Hallazgos relacionados:** AUD-NG-144 (health checks), AUD-NG-145 (bitácora), AUD-NG-006/AUD-NG-069 (reintentos/idempotencia), AUD-NG-133 (pagos) y AUD-NG-161 (pruebas de concurrencia/recuperación).
- **No duplicar:** AUD-NG-163 se limita a cuotas, capacidad, alertas y checkpoints; no sustituye los hallazgos relacionados.


## Reconciliación AUD-NG-163 (2026-11-05)
- AUD-NG-163 se conserva como rastro histórico, marcado como duplicado y no ejecutable independientemente.
- Tareas existentes que cubren el alcance: TASK-064; AUD-NG-144/AUD-NG-145; AUD-NG-006/AUD-NG-069/AUD-NG-133/AUD-NG-161; TASK-154/TASK-227/TASK-265.
- Dictamen TAREA-03: CUMPLE PARCIALMENTE.


## Auditoría de completadas.md - TAREA-05 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE.
- SERVICE_VERSIONS y DEPARTMENT_SERVICES_MAP existen, pero son mapas estáticos; getDepartmentalDependencyMap y CURRICULAR_SPECIALIZED_SERVICES también están codificados en js/config.js.
- SERVICE_REGISTRY declara seis servicios ACTIVE/v8.4.0 con recursos placeholder; SERVICE_VERSIONS declara cinco servicios en 1.0.0. ACCOUNTING/DEVELOPER tienen endpoints placeholder.
- Los cinco Code.gs backend usan el mismo SPREADSHEET_ID; no se demuestran identidades de ejecución ni ACL por recurso. resolveSpreadsheetSource ignora departamento/servicio y usa fallback al Spreadsheet principal.
- deployAcademicMicroserviceInstance registra metadatos, marca PASS/Activo y no crea ni verifica un deployment.
- Los sobres interservicio son definiciones no invocadas en USER/ACADEMIC/ACCOUNTING; TASK/EXAM carecen de ellas.
- Hallazgos existentes: AUD-NG-075/076/077, AUD-NG-078/079/080/081/082, AUD-NG-083/084/085/086, AUD-NG-131/AUD-NG-144 y TASK-064.
- No se crea AUD-NG nuevo; se amplían criterios existentes para identidad de ejecución, recuperación de cuentas, Shared Drives/delegación y onboarding departamental.


## Auditoría de completadas.md - TAREA-06 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE.
- TASK/USER agregan helpers con tryLock, pero no comprueban si el lock fue adquirido. ACCOUNTING no usa bloqueo y ACADEMIC tiene helpers locales sin bloqueo; EXAM no presenta helper equivalente.
- ScriptLock no coordina proyectos Apps Script distintos. Las carpetas se buscan por nombre exacto, sin catálogo común de IDs estables.
- USER/ACCOUNTING/TASK tienen usos de ANYONE_WITH_LINK; TASK hace pública la carpeta de entregas. USER/ACCOUNTING recurren silenciosamente a la raíz de Drive cuando PARENT_FOLDER_ID falta o falla.
- Hallazgos existentes: AUD-NG-154/155, AUD-NG-058, TASK-139/140/143/295/345/346 y TASK-149/150/456.
- No se crea AUD-NG nuevo; se amplían criterios de las tareas existentes.


## Auditoría de completadas.md - TAREA-07 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE.
- createSystemBackup guarda hojas JSON, no archivos binarios. getBackupFolder utiliza la raíz de la cuenta ejecutora; no se acredita Shared Drive ni programación automática.
- computeSimpleHash es un hash de 32 bits; verifyBackupIntegrity acepta cualquier checksum no vacío; restoreSystemBackup no verifica la copia antes de escribir y limpia hojas completas.
- La retención de expedientes/finanzas solo incrementa un contador, sin archivar realmente.
- No se acreditan alertas de almacenamiento ni RPO/RTO reales.
- Hallazgos existentes: AUD-NG-146, TASK-151/152, TASK-087/251, TASK-079, TASK-149/150, TASK-064 y TASK-345.
- No se crea AUD-NG nuevo; se amplían criterios existentes.


## Auditoría de completadas.md - TAREA-08 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. js/config.js declara 12 áreas/8 departamentos estáticos; backend inicializa 7 áreas con IDs/departamentos distintos.
- USER usa CatalogoDepartamentos; ACADEMIC usa DepartamentosAcademicos; no se demuestra fuente única.
- Asignaturas/planes/ofertas carecen de metadatos y validaciones; teacher.js/teacher-dashboard.html no consumen el catálogo para administración.
- Hallazgo nuevo: AUD-NG-164. Tareas relacionadas: TASK-005, AUD-NG-011/018/093/108/111/113/115/117 y TASK-153.


## Auditoría de completadas.md - TAREA-09 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. CURRICULAR_SPECIALIZED_SERVICES solo declara 12 claves/herramientas; no define proyectos, deployment IDs, endpoints, propietarios, fuentes ni permisos.
- fetchApi resuelve solo SERVICE_URLS genéricos; no usa el mapa especializado. deployAcademicMicroserviceInstance registra metadatos y marca PASS/Activo sin deployment real; runCurricularAreaServiceTests devuelve PASS constante.
- createTask y createExam no persisten areaId. No se demuestra aislamiento operativo por área.
- Hallazgos existentes: AUD-NG-011, AUD-NG-078/079/083/084/086/131/144 y AUD-NG-164. No se crea uno nuevo.


## Corrección de integridad - Pendientes.md (2026-11-05)
Se restauró el contenido íntegro previo a TAREA-09 (1,515,247 caracteres) tras detectar que la primera actualización había guardado solo 478 caracteres. Se conservaron todos los registros y se añadió la ampliación de AUD-NG-011.


## Auditoría de completadas.md - TAREA-10 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. Existen borradores/versiones/comentarios/rúbricas básicas; faltan tareas grupales/recurrentes, intentos, recibo persistido/idempotencia y revisión parcial.
- getSubmissionComments devuelve comentarios privados sin filtrar; getSubmissionVersions permite consulta por entregaId sin validar propiedad. addSubmissionComment confía en autor/rol/privacidad enviados por el cliente.
- Hallazgo nuevo: AUD-NG-165. Se amplían AUD-NG-149/121/152/124/158/002.


## Auditoría de completadas.md - TAREA-11 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. BancoPreguntas tiene CRUD/consulta básica y filtros, pero manageQuestionBank/getQuestionBank no validan esquema ni referencias; createExam omite campos declarados en los esquemas de Examenes y PreguntasExamen.
- exam.js soporta cinco familias; faltan modalidades abiertas, numéricas, ordenación y adjuntos. submitExam califica por igualdad/cantidad, ignora puntos y no aplica intentos/fechas/duración ni idempotencia.
- getExamQuestions oculta la respuesta correcta; localStorage solo ofrece recuperación local. No se acredita analítica psicométrica real.
- Hallazgo nuevo: AUD-NG-166. Se amplían AUD-NG-121/124/006/011/002/158 sin duplicar.


## TAREA-12 - Evaluación académica unificada, rúbricas y calificaciones

- backend/academic-service/Code.gs: calculateUnifiedAcademicGrade, previewAcademicGradeCalculation, auditAcademicGradesIntegrity, generateStudentReportCard y validateAcademicResponsibilityAndScopeAccess.
- backend/exam-service/Code.gs: getGradebookData, saveGradebookGrades, getEvaluationCategories, saveEvaluationCategory, getRubrics, saveRubric, saveCompetencyEvaluation, getCompetencyEvaluations, saveStudentRecovery, closePeriodGradebook, publishGradebookForContext, reviewPeriodGradebook, reopenPeriodGradebook, rectifyStudentGrade y getStudentAcademicReport.
- js/teacher.js: fetchGradebookData, renderGradebookTable, quickRecoveryPrompt, btn-gb-save-all y btn-gb-close-period.
- teacher-dashboard.html: interfaz de libro de calificaciones y modal de notas.
- js/student.js: consumo/resumen de desempeño del estudiante.
- Dependencias: CategoriasEvaluacion, CalificacionesEstudiantes, CierresPeriodos, RubricasEvaluacion, EvaluacionesCompetencias, RecuperacionesEstudiante, HistorialRectificacionesNotas, Matriculas, Calificaciones / Notas.
- Hallazgo AUD-NG-167: claves de calificación no contextuales; ponderaciones duplicadas; cálculo, rúbricas y estados no unificados; boletines/SACE no conectados a fuente consolidada.
- Controles relacionados: AUD-NG-002 (consultas de resultados), AUD-NG-158 (ABAC docente), AUD-NG-124 (historial de calificación de entregas).


## TAREA-13 - Planificación y asignación de carga académica

- backend/academic-service/Code.gs: getDepartmentAcademicPlanning, assignDepartmentHead, getAcademicOffers, createAcademicOffer, getTeacherAssignments, assignTeacherToClass, createTeacherSubstitution, getTeacherSubstitutions, getTeacherTeachingLoad, saveTeacherWorkLoadPreferences, getClassSchedules, createClassSchedule, checkScheduleConflict, getPlanningQualityAndOccupancyReport, assignTeacherToAcademicArea, getTeachersByAcademicArea, getAcademicAreasByTeacher y removeTeacherFromAcademicArea.
- js/teacher.js: loadMasterSchedules, deleteScheduleBlock, schedule-builder-form, openTeacherWorkLoadPreferencesModal, createTeacherSubstitution, refreshAcademicPlanningData y assignDepartmentHead.
- teacher-dashboard.html: formulario de horarios, matriz de planificación, preferencias/carga docente, sustituciones y panel departamental.
- Dependencias: OfertaAcademica, OfertasAcademicas (divergencia detectada), AsignacionesDocentes, DocentesAreasAcademicas, CoordinacionesArea, HorariosClase, HorariosLaborales, SedesAulas, MantenimientoAulas, CalendarioAcademico y EscenariosHorarios.
- Hallazgo AUD-NG-168: fuentes de oferta incompatibles, esquema de horarios interpretado con índices incorrectos, sustituciones no verificables, estados/años mezclados en carga y ocupación, e interfaz de área incompleta.
- Controles relacionados: AUD-NG-164 (fuente curricular canónica) y AUD-NG-158 (ABAC docente).


## TAREA-14 - Experiencia de usuario de docentes y estudiantes

- student-dashboard.html / js/student.js: fetchAllActivities, renderSubjectNavigation, expandSubject, renderActivitiesIntoContainer, getActivityHtml y renderActivities.
- teacher-dashboard.html / js/teacher.js: fetchEntregasRecientes (bandeja no conectada), fetchTeacherActivity, renderCurrentLevel, renderGrados, renderSecciones, renderAsignaturas, renderAlumnos, renderManagementTable y updateCreateTaskUIState.
- js/ui-common.js: updateOnlineBadge, queueOfflineAction, syncOfflineQueue, processQueueItems, openConflictResolutionModal y resolveConflictChoice.
- Dependencias: js/api.js (fetchApi y fallback de red), js/persistence.js (PersistenceManager y clave activa por userId), IndexedDB sync_queue, GLOBAL_SCOPE.GranularConfig.
- Hallazgo AUD-NG-169: bandeja docente no integrada; filtros no derivados del ámbito docente verificado; controles clicables sin semántica/teclado; formulario no adaptado por área; modo offline y resolución de conflictos incompletos.
- Tareas relacionadas: AUD-NG-126 (orden tarjeta/expandido), AUD-NG-158 (ámbito docente), TASK-065 (cola offline), TASK-129/TASK-130 (ayudas contextuales).


## Auditoría TAREA-15 - salud operativa y trazabilidad (2026-11-05)

### Backend USER
- `getServiceHealthReport` (73-140) -> LogsSistema; controla rol Administrador/Desarrollador/Director; devuelve versiones fijas 1.0.0, conteos globales y categoría heurística. No agrupa por servicio/ventana ni informa latencia/última falla.
- `getOperationalCapacityMetrics` (4080-4148) -> BitacoraTrazabilidad; calcula llamadas, latencia media, errores y cuota por servicio a partir de registros existentes.
- `recordTraceabilityLog` (4548-4573) -> BitacoraTrazabilidad; acepta correlationId, origin/target/action/status/duration/error; no contiene requestId.
- `getStructuredLogs` (353-392) -> LogsSistema; devuelve payload almacenado; sanitizer actual solo enmascara credenciales.
- `createInterServiceEnvelope`/`verifyInterServiceEnvelope` (1009-1063) -> crean/validan requestId y correlationId, pero no tienen call sites encontrados.

### Clientes y paneles
- `js/api.js` / `fetchApi` (11-60) envía action+payload sin requestId/correlationId; timeout fijo 60s (26-37).
- `checkMicroserviceHealth` (207-239) usa acción ping y pide timeout 6s; `checkAllMicroservicesHealth` (245-251) lista USER/ACADEMIC/TASK/EXAM.
- Ping presente en USER (1552), ACADEMIC (964), ACCOUNTING (834); TASK/EXAM sin ping. Los ping existentes retornan dbConnected:true literal.
- `js/developer.js` / `executeDevHealthChecks` (90-180) llama checkAll al cargar la consola.
- `js/ui-common.js` / `openInstitutionalHealthDashboardModal` (1938-1996) lee getServiceHealthMetrics (no definido en los scripts), usa valores vacíos por defecto y no consume getServiceHealthReport ni checkAllMicroservicesHealth.

### Dependencias de corrección
- AUD-NG-131/AUD-NG-144: deployment/versiones y health checks reales.
- AUD-NG-145: bitácora central, sanitización PII y DTO/filtros.
- AUD-NG-083: sobre HMAC y requestId/correlationId interservicio.
- TASK-064: cuotas, métricas, umbrales y alertas preventivas.
- AUD-NG-161: pruebas aisladas de recuperación/concurrencia.
- AUD-NG-163: duplicada, no ejecutar independientemente.


## Auditoría TAREA-16 - concurrencia, idempotencia y carga (2026-11-05)

- Accounting: recordStudentPayment (3891) escribe PagosAbonos sin ScriptLock y omite deduplicación cuando falta clave; doPost (572) consulta y guarda resultado en CacheService en pasos separados. runCriticalProcessConcurrencySuite (10505) marca pagos/CUV PASSED por conteo y consulta TransaccionesCobro, no PagosAbonos. generateSchoolDocument (15040) sí bloquea, pero su fallback CUV no revalida unicidad.
- Academic: createStudentEnrollment (11141) sí bloquea; registerStudentEnrollment (12670) no. generateInstitutionalId (2107) permite skipLock; doPost (671) confía en isInternalCall del payload para conservarlo. runConcurrencyAndConsistencySuite (3296) solo prueba una adquisición/liberación.
- Task: submitAssignment (892) modifica Entregas y EntregasVersiones sin lock/idempotencia; versionNum deriva de conteo previo.
- Exam: submitExam (996) inserta EntregasExamen con Date.now() sin lock/deduplicación.
- Cache: verifySessionToken y hasActiveDelegationForAction usan claves por userId; no hay pruebas de aislamiento por rol/cuenta.
- Tests: academic-grading-suite.js usa includes() y presencia textual; no prueba concurrencia real. No se encontró harness HTTP de carga en los archivos de prueba examinados.
- Tareas relacionadas: AUD-NG-006 (idempotencia atómica y lock no evadible), AUD-NG-009 (pruebas conductuales), AUD-NG-133 (pagos), AUD-NG-161 (suite real con fixtures, HTTP y caché).

No se crea AUD-NG nuevo; se amplían tareas existentes.


## Auditoría TAREA-17 - analítica académica y alertas (2026-11-05)

### Fuente de calificaciones y agregación
- exam-service/Code.gs, esquema CalificacionesEstudiantes (36): ID, EvaluacionID, UserID, NotaObtenida, PuntajePonderado, EsBorrador, EsPublicada, Observaciones, FechaRegistro.
- academic-service/Code.gs, getCurricularAnalyticsReport (2927): calcula promedio y bandas sobre todas las filas; excluye borradores/no publicadas, pero no une evaluación/usuario/matrícula/oferta ni aplica area/asignatura/grado/programa/periodo. Los filtros solo se reflejan como etiquetas. No recibe sección, idioma ni año lectivo.
- El valor alertasAcompanamiento cuenta notas <70, no alertas persistidas ni estudiantes únicos.

### Alertas tempranas
- evaluateAndDispatchEarlyWarningAlerts (9264) calcula asistencia desde RegistrosAsistencia sin limitar año/período. Reprobaciones y tareas pendientes se leen de mockFailingSubjects/mockMissingTasks del payload (9424-9429). La deduplicationKey no contiene anolectivo; NotificadoA es un texto, no prueba notificación enviada. Solo crea caso de seguimiento para riesgo Alto/Crítico.

### Interfaz y autorización
- teacher.js (2275-2306) define controlador y llama getCurricularAnalyticsReport con {}. teacher-dashboard.html no contiene modal-academic-analytics ni IDs analytics; no hay interfaz integrada.
- ROLE_PERMISSIONS: acción autorizada para Director/Admin, no Coordinador ni Profesor; el controlador está en teacher.js.
- Reporte tradicional teacher.js (2940-3045): entregas ausentes como 0, suma puntos heterogéneos, tareas filtradas por PARCIAL_ACTUAL en vez de report-parcial y exámenes sin filtro de parcial.

### Catálogo y exportación
- user-service/Code.gs: catálogo REP-ACAD-01 (8396+) declara filtros/roles; generateInstitutionalReport (8624; rama académica 8687) usa índices incompatibles con el esquema CalificacionesEstudiantes (r[6] es EsPublicada, no nota), no aplica filtros y agrega EST-001/EST-002 ficticios si no hay datos. REP-ACAD-02 no tiene generador independiente.
- teacher.js export-excel-btn (4585+) exporta tareas/exámenes, no la analítica por área/programa, y conserva defectos de parcial/ceros.

### Tareas relacionadas
- TASK-050: catalogar informes académicos analíticos y permisos/formatos reales.
- TASK-051: diccionario semántico, fuentes y dimensiones; encabezado [X] pero Estado interno [ ] Pendiente.
- TASK-052: filtros temporales y estructurales, añadir programa/idioma y validar combinaciones.
- TASK-054: pruebas conductuales de fuente, filtros, RBAC, alertas y exportaciones.
- TASK-235: tendencias históricas por parcial y dimensiones académicas.
- TASK-237: exportación CSV/XLSX consistente con filtros y pantalla.
- AUD-NG-167: fuente única y reglas de calificaciones publicadas.
- AUD-NG-158: acceso por ámbito curricular verificado.
- F11-Task08: métricas reales de notas/tareas, filtrado anual y deduplicación de alertas por ciclo.

No se crea AUD-NG nuevo; las brechas se incorporan a tareas existentes.


## Auditoría TAREA-18 - recursos reutilizables (2026-11-05)
- ACADEMIC/Code.gs: RecursosEducativosReutilizables (145) no tiene ACL ni historial de versiones; ProyectosInterdisciplinarios (146) no contiene relación a recursos.
- getReusableResourceCatalog (2989) aplica área/asignatura/grado/idioma, pero ignora tema/categoría y no filtra proyectos por año/área/usuario.
- manageReusableResource (3046) siempre inserta; recursoId no actualiza; Version es texto libre; proyecto usa año 2026 y departamentos como texto; autorId y URL provienen del cliente.
- teacher.js (2314-2425) espera modal ausente en teacher-dashboard.html. El formulario no envía grado/idioma/version/recursos asociados; tabla inserta campos sin escape contextual y URL sin allowlist.
- Permisos globales para Profesor/Director/Subdirector/Secretaría, sin ABAC por área/autor/recurso; Coordinador no tiene acciones.
- Hallazgo AUD-NG-171: catálogo, versionado append-only, relación proyecto-recurso-version, UI y pruebas. Relacionar con AUD-NG-164, AUD-NG-158 y TASK-296.


## Auditoría TAREA-19 - migración curricular (2026-11-05)
- CatalogoAsignaturas/PlanesEstudio/PlanAsignaturas (academic-service, 108-110): la estructura relacional existe, pero getCurricularEquivalences (3093) solo lee CatalogoAsignaturas y asigna cada materia a sí misma como equivalencia exacta. Ignora planOrigenId/planDestinoId y PlanAsignaturas.
- executeCurricularMigration (3130) recibe equivalenciasMap pero no la utiliza; lee HistorialAcademico/CalificacionesEstudiantes, solo detecta celdas vacías, no cuenta duplicados/huérfanos, no modifica filas y devuelve success incluso en modo REAL. No hay snapshot, comparación antes/después ni rollback curricular.
- teacher.js (2192-2273) define modal y formulario ausentes en teacher-dashboard.html; el formulario no envía equivalenciasMap. ROLE_PERMISSIONS limita la acción a Director/Admin, no Profesor.
- Pruebas de regresión revisadas no contienen pruebas de equivalencias/migración.
- Nuevo AUD-NG-172: migración transaccional, prevalidación, preservación histórica y rollback. Relacionar con AUD-NG-164, AUD-NG-167, TASK-078, AUD-NG-158 y TASK-296.


## Auditoría TAREA-20 - ciclo de vida de áreas y servicios curriculares (2026-11-05)

### Componentes y relaciones observadas
- backend/academic-service/Code.gs: registerCurricularAreaExtension (4084) escribe AreasCurricularesExtensiones; runCurricularAreaServiceTests (4147) simula PASS y activa; toggleCurricularAreaStatus (4206) cambia estado; getAcademicAreaTemplateCatalog (4281) siembra siete áreas predeterminadas; deployAcademicMicroserviceInstance (4494) escribe InstanciasMicroserviciosAcademicos y luego registra área; getInstitutionalCatalog (3824) consulta el catálogo; getAcademicAreaCoordinationScope (4321) consulta CoordinacionesArea; assignTeacherToAcademicArea (14048) crea asignaciones docentes.
- js/config.js: CURRICULAR_AREAS_CATALOG (171), ACADEMIC_DEPARTMENTS_CATALOG, CURRICULAR_SPECIALIZED_SERVICES (198), SERVICE_URLS (224) y SERVICE_REGISTRY son mapas estáticos no sincronizados con el registro backend de extensiones.
- js/api.js: fetchApi (11) resuelve endpoints solo con SERVICE_URLS[service]; no resuelve una instancia por areaId ni serviceKey.

### Riesgos de consistencia
- registerCurricularAreaExtension sobrescribe la fila completa al actualizar un areaId, no bloquea concurrencia ni versiona cambios.
- runCurricularAreaServiceTests declara PASS fijo y puede activar el área sin pruebas reales.
- toggleCurricularAreaStatus permite activación directa; deployAcademicMicroserviceInstance marca instancia Activo y connectivityCheck PASS sin despliegue real. Su llamada posterior a registerCurricularAreaExtension deja el área PendientePruebas.
- getAcademicAreaTemplateCatalog siembra siete áreas como Activo y usa IDs distintos a AREA-01…AREA-12 del cliente.
- getInstitutionalCatalog no entrega serviceUrl/tools ni filtra inactivos. assignTeacherToAcademicArea no valida área activa; getAcademicAreaCoordinationScope no une el estado del área.
- La baja lógica conserva la fila, pero no sincroniza deployments, asignaciones, coordinaciones, endpoints ni políticas de consulta histórica.

### Tareas relacionadas
- AUD-NG-011: deployment real, endpoint por área, pruebas integradas no simuladas y estados coordinados.
- AUD-NG-164: fuente canónica de áreas/departamentos/servicios, IDs estables, versionado y desactivación histórica segura.
- AUD-NG-158: ABAC para asignaciones y coordinaciones, validando área activa y ámbito del actor.

No se crea AUD-NG nuevo.


## Auditoría FASE2-T17 - versionado de configuraciones compartidas (2026-11-05)

### Componentes y relaciones observadas
- js/config.js: SERVICE_VERSIONS (76), getSharedConfigVersion (93), validateServiceVersionCompatibility (97), SERVICE_REGISTRY (245). SERVICE_VERSIONS enumera cinco servicios 1.0.0; SERVICE_REGISTRY enumera seis servicios, incluidos DEVELOPER, todos v8.4.0.
- backend/user-service/Code.gs: getServiceHealthReport (73) y getSharedConfigurationsCatalog (185) devuelven versiones fijas; manageInstitutionalDataCache (156) gestiona invalidación; runInterdepartmentalIntegrationTestSuite (221) no incluye pruebas de versión; registerSpreadsheetSource (7293)/resolveSpreadsheetSource (7339) transportan schemaVersion; getSystemConfigurations (7743)/saveSystemConfiguration (7787) leen/escriben ConfiguracionSistema.
- js/api.js fetchApi (11) enruta por SERVICE_URLS, sin handshake de versión, consulta del catálogo compartido o bloqueo de consumidor obsoleto.

### Riesgos de consistencia
- validateServiceVersionCompatibility ignora patch, acepta 1.0.0 frente a mínimo 1.0.1 y asigna 1.0.0 a servicios desconocidos/versiones inválidas.
- SERVICE_REGISTRY, SERVICE_VERSIONS, getServiceHealthReport y getSharedConfigurationsCatalog declaran versiones distintas y duplicadas; no hay fuente única ni DEVELOPER en SERVICE_VERSIONS.
- getSharedConfigurationsCatalog devuelve política y rollback en texto fijo, no historial ni compatibilidad persistida.
- saveSystemConfiguration sobrescribe fila, fija versión 1.0 y no conserva histórico ni control de concurrencia; getSystemConfigurations omite versión/fecha/actor.
- FLUSH_GLOBAL solo registra evento; no ejecuta purga global. saveSystemConfiguration no dispara invalidación ni entrega nueva versión.
- schemaVersion se guarda y devuelve sin comparación de contrato ni historial de evolución.

### Tareas relacionadas
- TASK-062: versionado incremental, handshake, invalidación real, concurrencia, historial y rollback de configuración.
- AUD-NG-077: validación de compatibilidad e historial de schemaVersion de fuentes.
- AUD-NG-078: coherencia de versión de contrato con deployment/endpoint real.

No se crea AUD-NG nuevo.


## Auditoría FASE2-T18 - tablero de salud e interoperabilidad (2026-11-05)

### Componentes y flujo revisados
- ui-common.js openInstitutionalHealthDashboardModal (1939) llama getServiceHealthMetrics; en los scripts revisados no hay definición. Si no se carga externamente, usa métricas cero y pinta OPERATIVO/SALUDABLE.
- api.js fetchApi (11) aplica timeout fijo 60000 ms; checkMicroserviceHealth (207) envía ping y mide round-trip; checkAllMicroservicesHealth (245) consulta solo USER/ACADEMIC/TASK/EXAM.
- developer.js executeDevHealthChecks (90) consume el mismo monitor; clasifica status=success como ONLINE aunque state sea Degradado.
- user-service: getServiceHealthReport (73), getOperationalCapacityMetrics (4080), recordTraceabilityLog (4548), getTraceabilityCorrelationLogs (4575), retryFailedEventsQueue (4700).
- academic-service: getServiceHealthDiagnostics (4451) y ping (964); el diagnóstico se incluye en PUBLIC_ACTIONS (265).
- Backend ping: USER (1552), ACADEMIC (964), ACCOUNTING (834); TASK/EXAM no tienen acción ping; DEVELOPER ping delega a doGet (developer-service, 152).

### Brechas de interoperabilidad y datos
- El modal no llama a checkAllMicroservicesHealth ni a métricas backend; no presenta latencia, cola, dependencias, filtros ni links de diagnóstico. Su hora es local al render.
- checkAllMicroservicesHealth excluye ACCOUNTING/DEVELOPER y consulta TASK/EXAM sin acción ping. USER/ACADEMIC devuelven dbConnected fijo; DEVELOPER devuelve controlPlaneConnected fijo.
- fetchApi ignora options.timeout y usa 60 segundos; la llamada de salud declara 6 segundos.
- getOperationalCapacityMetrics lee BitacoraTrazabilidad sin ventana temporal/cola, y devuelve OPTIMO sin eventos. El DTO no coincide con el esperado por ui-common; INT-04 también espera capacidadOperativa que no existe.
- getServiceHealthDiagnostics deja connectivity/permissions en PASS fijo y está expuesto en PUBLIC_ACTIONS. getServiceHealthReport aplica umbral acumulado sin periodo ni desglose real por servicio.
- getTraceabilityCorrelationLogs no filtra por periodo/tipo y devuelve errorDetails sin redacción. retryFailedEventsQueue no se integra al panel.

### Tareas relacionadas
- AUD-NG-144: ping real, cobertura completa y estado del tablero.
- AUD-NG-145: filtros, DTO y sanitización de bitácora.
- AUD-NG-007: timeout por llamada.
- AUD-NG-008: fallback/ausencia de telemetría no debe convertirse en éxito.
- TASK-064: métricas, cuotas, colas, frescura, dependencias y alertas.
- AUD-NG-163 sigue duplicada y consolidada; no ejecutar independientemente.

No se crea AUD-NG nuevo.


### Auditoría FASE2-T19 - Mapa de cachés y dependencias (C1.26)

| Clave / almacén | TTL observado | Ámbito | Fuente / consumidor | Invalidación observada | Brecha |
|---|---:|---|---|---|---|
| `acct_state_<userId>` | 60 s | Usuario | USER / verifySessionToken | invalidateUserRoleCache | No todos los cambios de estado la invocan; lockout/reactivación no purgan. |
| `revoked_user_<userId>`, `revoked_session_<sessionId>` | 21600 s | Usuario / sesión | USER / verifySessionToken | revokeUserSession | Revocación temporal; coherencia interservicio pendiente. |
| `active_delegations_<userId>` | 300 s | Usuario | USER / hasActiveDelegationForAction | Crear y revocar delegación | Expiración automática no invalida; hit no revalida fechas. |
| `dynamic_permissions_matrix` | 600 s | Global por rol | USER / getDynamicPermissionsForRole | savePermissionMatrix | Error de fuente se confunde con ausencia y cae a permisos estáticos. |
| `IDEM_USER_<action>_<token>` | 21600 s | ScriptCache compartida; firma incluye identidad | USER / doPost | Expiración | Temporal; persistencia durable y aislamiento deben cubrir todos los flujos. |
| `REPLAY_REQ_<requestId>` | 300 s | Global por requestId | USER / verifyInterServiceEnvelope | Expiración | Se registra antes de validar firma; relacionado con AUD-NG-085. |
| `COMM_REQ_<idempotencyKey>` | 600 s | Global, sin identidad en clave | USER / createInstitutionalServiceRequest | Expiración | Puede devolver a otra cuenta el resultado cacheado del primer solicitante. |
| IndexedDB `academic_stats/config_<userId>` | Sin TTL | Usuario en syncAcademicScope | js/config.js, js/api.js, js/persistence.js | Reconciliación con respuesta servidor | No verifica antigüedad ni expone estado obsoleto. |

- CACHE_POLICIES en js/config.js declara TTL/ámbitos, pero no se conecta con CacheService ni PersistenceManager.
- manageInstitutionalDataCache(FLUSH_GLOBAL) registra el evento, no ejecuta purga. INVALIDATE_USER no propaga el fallo de invalidación.
- purgeSecurityCaches y dispatchSecurityEvent se invocan/enrutan, pero no tienen definición local en el único archivo backend/user-service/Code.gs.
- Dependencias de remediación: AUD-NG-005, AUD-NG-160, AUD-NG-070, TASK-062, TASK-234 y TASK-400.


### T-UX-26 - Vista de actividad reciente contextual (C1.27)
| Componente | Estado observado | Brecha |
|---|---|---|
| `recordRecentActivity` | Implementado en `js/ui-common.js` | No se encontraron productores de eventos en los dashboards principales revisados. |
| `getRecentActivity` | Filtra por rol y ordena por timestamp | Clave global sin `authUserId`/`institucionId`; ADMIN/DIRECCION ven todo el contenido local. |
| `renderContextualRecentActivity` | Renderiza etiquetas informativa/pendiente | No se encontró llamada desde los dashboards revisados; título/descripción se insertan con `innerHTML`. |
| Navegación | Llama a `switchActiveView` con `targetId` | El router solo muestra la vista; no procesa el ID para abrir el registro concreto. |
| Pruebas | Suite modular revisada | Sin pruebas identificables de T-UX-26/actividad reciente. |

- Hallazgo AUD-NG-173: integrar la vista, conectar productores reales, asegurar navegación al registro y añadir pruebas.
- TASK-067: ampliar aislamiento local por usuario/institución para `INSTITUTIONAL_RECENT_ACTIVITY_LOG_V1`.
- TASK-221: mantener la bandeja unificada como fuente de verdad para tareas pendientes; el historial reciente solo enlaza a ella.


### T-UX-27 - Rendimiento percibido y respuesta de interfaces (C1.28)
| Capacidad | Estado observado | Brecha |
|---|---|---|
| Medición de operaciones UI | Solo ping medido con Date.now | Sin telemetría de apertura de vistas, filtros, tablas, modales ni formularios. |
| Skeleton de carga | Helper definido en ui-common.js | Sin consumidores encontrados en JS ni dashboards principales. |
| Debounce | Omnibox a 300 ms | No hay política común para filtros ni deduplicación de lecturas concurrentes. |
| fetchApi timeout | 60000 ms fijo | Ignora options.timeout; checkMicroserviceHealth solicita 6000 ms sin efecto. |
| Pruebas de rendimiento | Sin pruebas T-UX-27 identificables | No hay benchmarks ni escenarios móviles/escritorio. |

- TASK-252: ampliar medición de rendimiento percibido del cliente.
- TASK-429: integrar skeleton, debounce y deduplicación segura de lecturas.
- AUD-NG-007: corregir timeout configurable de fetchApi.


### FASE2-01 - Protocolo de interoperabilidad y aislamiento departamental (C1.29)
- USER/ACCOUNTING/ACADEMIC/DEVELOPER definen helpers HMAC sin consumidores; TASK/EXAM carecen de ellos. Ningún doPost verifica sobre interservicio.
- USER→TASK envía JSON plano por UrlFetchApp; no hay firma ni autenticación del servicio emisor.
- USER, ACCOUNTING, ACADEMIC, TASK y EXAM usan el mismo SPREADSHEET_ID; la mayoría de funciones abre esa hoja directamente. El resolver dinámico tiene uso puntual y no está implementado en TASK/EXAM.
- El fallback AUTH_TOKEN_SECRET deriva de SPREADSHEET_ID; no es secreto aleatorio por servicio.
- SERVICE_REGISTRY contiene IDs de hojas de ejemplo; ACCOUNTING/DEVELOPER tienen endpoints marcadores.
- Ampliaciones: AUD-NG-083, AUD-NG-084, AUD-NG-086 y TASK-046. TASK-048 mantiene su estado histórico, pero sus checks [X] no quedan acreditados por el tráfico real.


### FASE2-02 - Normalización de contratos API y manejo controlado de errores (C1.30)
- Academic/Accounting añaden status, timestamp y code genérico; no hay envelope común completo ni validación de esquema en fetchApi.
- Las lecturas fallidas pueden retornar status:success/data:[] con isFallback; la suite de Academic acepta status:error como PASS y no prueba HTTP; Accounting carece de suite equivalente.
- Los catch de doPost exponen error.message y el toast de autorización inserta parsed.message con innerHTML.
- Hallazgo AUD-NG-174: contrato versionado de éxito/error, validación en cliente, distinción vacío/fallback, pruebas reales y render seguro.
- AUD-NG-007 cubre el timeout configurable; no duplicar.


## Auditoría FASE2-03 - Fuentes de datos y catálogos institucionales (C1.31)
- `js/config.js`
  - `CURRICULAR_AREAS_CATALOG`, `ACADEMIC_DEPARTMENTS_CATALOG`, `CURRICULAR_SPECIALIZED_SERVICES`: catálogos locales estáticos consumidos por la interfaz.
  - `fetchInstitutionalCatalog`: consulta `ACADEMIC/getInstitutionalCatalog`; recibe `areasCurriculares` y las incorpora mediante `registerNewCurricularAreaServiceConfig`; mantiene fallback local ante fallo o respuesta inválida.
  - `registerNewCurricularAreaServiceConfig`: modifica `CURRICULAR_AREAS_CATALOG` y `CURRICULAR_SPECIALIZED_SERVICES`; no sincroniza actualización/inactividad de entradas ya existentes.
- `backend/academic-service/Code.gs`
  - `getOrCreateSheet`: inicializa encabezados de `CatalogoAsignaturas` con columnas `AsignaturaID, NombreOficial, Codigo, AreaAcademica, CargaHorariaRef, Estado`; no define encabezados para `CatalogoSpreadsheets`.
  - `getInstitutionalCatalog`: lee `CatalogoAsignaturas` y `AreasCurricularesExtensiones`; mapea el estado de asignaturas desde el índice incorrecto y no filtra registros inactivos.
  - `validateCatalogReference`: depende de `getInstitutionalCatalog`; no aplica estado activo.
  - `registerSpreadsheetSource`, `resolveSpreadsheetSource`, `getSpreadsheetCatalog`: dependen de `CatalogoSpreadsheets` y del `SPREADSHEET_ID` principal; su insuficiente resolución y falta de integración quedan ampliadas en TASK-046, sin duplicar AUD-NG-083/084/086.


## Auditoría FASE2-04 - Identificadores documentales, CUV y trazabilidad (C1.32)
- `backend/accounting-service/Code.gs`: `getOrCreateSheet` crea DocumentosEscolaresEmitidos con ocho encabezados; `generateSchoolDocument` persiste quince campos; `verifySchoolDocumentByCUV` lee hasta el índice 14.
- `generateSchoolDocument`: LockService, PlantillasEscolares, docId temporal basado en Date.now(), correlativo, CUV, hash de metadatos y persistencia documental.
- `PUBLIC_ACTIONS -> validateRolePermission -> doPost -> verifySchoolDocumentByCUV`: acción pública sin token; el handler proyecta campos internos del documento y de FirmasConformidades.
- `user-service/Code.gs:1706-1740` y `academic-service/Code.gs:2100-2160` mantienen generadores institucionales duplicados; Accounting no los integra en la emisión documental.
- Reconciliación: TASK-118 (motor central y IDs ad-hoc), TASK-351 (verificación CUV y privacidad), AUD-NG-059 (hash binario), AUD-NG-061 (certificado) y AUD-NG-161 (pruebas de unicidad/concurrencia).


## Auditoría FASE2-05 - Sincronización atómica, LockService e idempotencia (C1.33)
- `js/api.js:11-205`: `fetchApi` reintenta fallos de red sin generar clave idempotente por mutación.
- `accounting-service/Code.gs:232-273` y `academic-service/Code.gs:279-320`: helpers basados en CacheService, consulta previa y guardado posterior; no reservan clave atómicamente.
- `accounting-service/Code.gs:3891`: `recordStudentPayment` carece de lock propio y admite ausencia de clave.
- `academic-service/Code.gs:11141`: `createStudentEnrollment` tiene lock opcional controlado por `skipLock`; `isInternalCall` procede del payload.
- `academic-service/Code.gs:12670`: `registerStudentEnrollment` modifica Matriculas y CargosEstudiante en escrituras separadas sin lock.
- `academic-service/Code.gs:3278-3320`: `withConcurrencyLock` solo se usa en `runConcurrencyAndConsistencySuite`, que no prueba concurrencia real.
- `accounting-service/Code.gs:10505-10550`: suite contable marca PASS por conteo de filas y una adquisición de lock.
- Reconciliación: AUD-NG-006, AUD-NG-129, AUD-NG-133 y AUD-NG-161; sin nuevo ID de hallazgo.
## Auditoría FASE2-06 - Motor de eventos intermodulares y despacho multicanal (C1.34)
- Archivo principal: backend/user-service/Code.gs (SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f).
- registerAndDispatchEvent (4618-4699): valida solo presencia de eventType/originService; deduplica por tipo + requestId opcional y solo cuando el evento previo ya está PROCESADO; ejecuta notificación antes de appendRow; no reserva atómicamente ni usa LockService; maxRetries no se utiliza.
- retryFailedEventsQueue (4700-4759): límite fijo de tres intentos, sin nextAttemptAt/backoff ni reclamación exclusiva; reintenta sin clave estable; GLOBAL se omite y se marca procesado; status success no representa el resultado real de cada evento.
- doPost (1351-1453): valida permiso de acción y expone registerAndDispatchEvent/retryFailedEventsQueue; el switch no demuestra productores integrados en los otros servicios.
- runInterdepartmentalIntegrationTestSuite (218-310): invoca la cola real, solo valida status success en INT-03, espera DTOs incompatibles en INT-04/INT-05 y devuelve status success aunque existan pruebas fallidas.
- Academic, Accounting, Task y Exam (SHAs daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc, 38b979d41596b85e888b4a7060b37bbac0840a28, 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe, 1d93296628fae31f680004f637897e2b1314a64c): no se encontraron llamadas a registerAndDispatchEvent; los helpers locales purgeSecurityCaches no son productores del bus general.
- sendMultiChannelNotification (4818-4932) solo persiste inbox y utiliza MailApp; no consume canal ni configuración de proveedores. configureNotificationChannel/getNotificationChannelConfigs (7526-7612) guardan y devuelven configuración, pero no están conectados al despachador. sendChannelNotificationTest simula respuesta del proveedor.
- Hallazgos: AUD-NG-176 (cola durable, integración, idempotencia y pruebas); AUD-NG-177 (secretos de proveedores y contenido HTML). Tareas: TASK-474 y TASK-475. AUD-NG-006 y AUD-NG-161 conservan sus alcances transversales y se amplían por referencia.
- Calidad: separación insuficiente entre registro, despacho y recuperación; estados y DTO implícitos; no existe prueba aislada que acredite el ciclo de vida del evento.


## FASE2-07 - Auditoría de dependencias (2026-11-05)
- USER/getOperationalCapacityMetrics depende de BitacoraTrazabilidad, sin productores transversales localizados; ampliar TASK-064 y AUD-NG-144/AUD-NG-145.
- ui-common.renderPaginatedTable no tiene consumidores localizados y su callback remoto no está integrado; los endpoints Academic/Accounting leen las hojas completas; ampliar TASK-429.
- Academic/Accounting duplican evaluateTransactionalStorageMigrationNeed con umbrales fijos y sin plan de migración; hallazgo AUD-NG-178.
- AUD-NG-163 permanece duplicada; no reabrir.


## FASE2-T03 - Contratos API y compatibilidad (C1.36)
- `js/api.js:11-181` (`fetchApi`): envía POST JSON {action,payload}; enriquece payload con requesterUserId/requesterRole del almacenamiento del navegador; no valida esquema de entrada/salida ni versión; ante fallos devuelve status success/data vacía/isFallback para lecturas.
- `backend/academic-service/Code.gs:20-25` y `backend/accounting-service/Code.gs:20-25`: `textResponse` asigna success si falta status, agrega timestamp y código genérico solo para errores; no fija envelope/version/correlationId ni mensaje público normalizado.
- `backend/academic-service/Code.gs:3915-3965`: `validateApiContractsTestSuite` cubre cuatro acciones locales; ping es sintético y PASS acepta status success o error. La suite devuelve status success aunque todasPruebasPasaron sea falso.
- `backend/user-service/Code.gs:1351-1620`: dispatcher por acción y autorización; catch devuelve err.message. No se encontró catálogo formal de contratos por operación.
- `backend/accounting-service/Code.gs:572-785`: dispatcher por acción con autorización e idempotencia opcional; no se identificó suite contractual equivalente.
- Reconciliación: ampliar AUD-NG-174 con catálogo de endpoints/consumidores, tipos, validación, efectos secundarios, idempotencia/repetición y compatibilidad versionada. No duplicar AUD-NG-007/AUD-NG-006/AUD-NG-161.


## FASE2-T04 - Fuente de verdad institucional para catálogos y configuraciones (C1.37)
- js/config.js:2-74: catálogos locales de capacidades, módulos y responsabilidades; getters devuelven esos arrays estáticos.
- js/config.js:76-114: SERVICE_VERSIONS, CACHE_POLICIES y validación de versión. CACHE_POLICIES.INSTITUTIONAL_CATALOGS declara 43,200 s, pero no se consume en fetchInstitutionalCatalog; versionado/invalidez se mantiene en TASK-062.
- js/config.js:171-200: CURRICULAR_AREAS_CATALOG y ACADEMIC_DEPARTMENTS_CATALOG son copias locales; no se sincroniza departamento.
- js/config.js:808-825: fetchInstitutionalCatalog llama ACADEMIC/getInstitutionalCatalog; solo agrega áreas y devuelve success con catálogo estático ante ausencia de API, respuesta no válida o error.
- js/config.js:943-965: registerNewCurricularAreaServiceConfig inserta solo IDs nuevos; no actualiza metadatos/estado de existentes.
- backend/academic-service/Code.gs:108: CatalogoAsignaturas se define como ID, Nombre, Código, Área, CargaHorariaRef, Estado; el estado está en índice 5.
- backend/academic-service/Code.gs:3824-3883: getInstitutionalCatalog mapea estado de asignaturas desde índice 4 y no filtra inactivos; respuesta ALL usa objeto y tipos específicos arrays; no incluye departmentId.
- backend/academic-service/Code.gs:3885-3915: validateCatalogReference no verifica estado y solo admite data array; no se encontró llamado desde las mutaciones inspeccionadas.
- backend/academic-service/Code.gs:4084-4145, 4206-4235: registro/actualización de áreas sobrescribe fila, fuerza estado pendiente y cambio de estado muta el registro actual.
- backend/academic-service/Code.gs:5995-6027: getSubjectCatalog repite índice de estado incorrecto; createSubjectCatalogItem admite área por defecto General y genera ID basado en timestamp.
- backend/user-service/Code.gs:185-200: getSharedConfigurationsCatalog publica versiones estáticas, no fuente persistente de catálogos.
- Reconciliación: ampliar AUD-NG-175; no duplicar TASK-062 (versionado/invalidez), TASK-046/AUD-NG-083/084/086 (enrutamiento) ni AUD-NG-158 (estado/ámbito de áreas).


## FASE2-T05 - Identidad institucional, secuencias y relaciones entre servicios (auditoría C1.40)

### Fuente de numeración
- USER: generateInstitutionalId (1706-1743) utiliza la hoja compartida SecuenciasIDs y un ScriptLock local.
- ACADEMIC: generateInstitutionalId (2107-2154) implementa la misma lógica, también sobre SecuenciasIDs y con ScriptLock local.
- La hoja compartida no equivale a un lock compartido: no se acredita exclusión mutua entre los proyectos de microservicio. ACADEMIC acepta skipLock y varias funciones lo usan sin lock exterior visible.
- ACCOUNTING no utiliza el generador canónico para el documento escolar; generateSchoolDocument asigna DOC-EM-año-timestamp y un CUV separado.

### Identidad de personas y cuentas
- USER.Personas.PersonaID (columna A) y USER.Usuarios.UserId (A)/PersonaID (J) son claves diferentes. createPerson genera PER-timestamp; generateInstitutionalId puede generar PER-secuencia. linkPersonAccount escribe PersonaID sin validar que exista en Personas ni que el vínculo sea único.
- ACADEMIC.ExpedientesEstudiantes.ExpedienteID (A)/PersonaID (B) enlaza con la identidad de Persona por convención, pero convertAdmissionToStudent genera el PersonaID sin crear el registro maestro Personas. Si no recibe UserId, genera USR- y lo usa en matrícula sin crear/comprobar la cuenta Usuarios. Ante respuesta sin generatedId, el flujo contempla constantes fijas por entidad (EXP/STU/PER/USR/REL/INV/MAT/MOV-000001), sin reserva ni validación de unicidad. La detección de duplicado busca la identificación mediante includes en Observaciones, no en un campo de identidad dedicado.
- Matriculas.UserId, DocumentosEstudiante.ExpedienteID y DocumentosEscolaresEmitidos.targetEntityId dependen de estas claves, pero no existe un validador referencial transversal que compruebe existencia, tipo, estado y pertenencia antes de persistir.

### Validadores, auditoría y CUV
- generateInstitutionalUUID usa Math.random y no persiste ni comprueba colisiones.
- validateInstitutionalIdentifier identifica prefijos, pero siempre devuelve isValidFormat=true y no comprueba existencia/estado.
- auditInstitutionalIdentifierCollisions solo inspecciona cuatro tablas académicas, primera columna; no cubre personas, cuentas, expedientes, matrículas, documentos, contabilidad ni referencias cruzadas.
- ACCOUNTING.DocumentosEscolaresEmitidos tiene desalineación de esquema (8 encabezados frente a 15 valores); docId/correlativo/CUV no se vinculan con un contrato íntegro. La consulta CUV pública expone datos internos y no valida vigencia.

### Dependencias y reconciliación
- TASK-118: generador canónico, unicidad, prefijos, identidad interna y relaciones.
- TASK-351 / AUD-NG-059 / AUD-NG-061: CUV, integridad binaria y certificado.
- AUD-NG-161: exclusión mutua, bypass skipLock, colisiones y pruebas conductuales.
- No crear un hallazgo duplicado; las relaciones descritas son dependencias lógicas observadas, no claves foráneas ya garantizadas.


## Concurrencia y consistencia de operaciones (FASE2-T06, auditoría 2026-11-05)

### Academic
- `doPost` -> `validateRolePermission` -> `checkAndRegisterIdempotencyKey` -> dispatch de acciones; la sanitización de `skipLock` depende de `payload.isInternalCall`.
- `withConcurrencyLock` (3278-3294) -> `LockService.getScriptLock`; único consumidor observado: `runConcurrencyAndConsistencySuite` (3296-3327). No se encontró conexión con handlers de negocio.
- `createAdmissionRequest` (984-1100) -> `SolicitudesAdmision`, `SecuenciasIDs`; lock local y generador con skipLock dentro de sección crítica.
- `convertAdmissionToStudent` (2156-2380) -> `SolicitudesAdmision`, `ExpedientesEstudiantes`, `Usuarios`, `RelacionesFamiliares`, `InvitacionesVinculacion`, `DocumentosEstudiante`, `Matriculas`, `CargosEstudiante`; varias escrituras bajo lock local, sin transacción multihoja.
- `checkEnrollmentCapacity` (11026-11115) -> `OfertaAcademica`, `Matriculas`, `SolicitudesAdmision`; tryLock sin rama de error ante timeout (AUD-NG-179).
- `createStudentEnrollment` (11141-11221) -> `ExpedientesEstudiantes`, `Matriculas`, `OfertaAcademica`; lock local salvo bypass skipLock (AUD-NG-161/TASK-118).
- `registerStudentEnrollment` (12670+) -> `Matriculas` y `CargosEstudiante`; sin lock propio, reconciliado con AUD-NG-129.

### Accounting
- `doPost` -> validación de rol -> lectura de clave de idempotencia en CacheService -> ejecución -> guardado posterior del resultado; no hay reserva atómica (AUD-NG-006/AUD-NG-161).
- `recordStudentPayment` (3891-3968) -> `PagosAbonos` y `CargosEstudiante`; sin lock propio, reconciliado con AUD-NG-133.
- `recordInventoryMovement` (6050+) -> `InventariosKardex`; lock local de Accounting.
- `recordPurchaseReceipt` (6972-7140 aprox.) -> `OrdenesCompra`, `RecepcionesCompra`, `recordInventoryMovement` -> `InventariosKardex`; lock local, escritura multihoja sin idempotencia/recuperación (AUD-NG-180).
- `recordAccountsPayableExpense` (7557-7687) -> `CuentasPorPagarGastos` y `PresupuestosInstitucionales`; el lock presupuestario puede fallar después de insertar la obligación y el handler devuelve éxito (AUD-NG-179).
- `recordSupplierPayment` / `applySupplierCreditNote` -> `CuentasPorPagarGastos`, `MovimientosCajaBancos`, `AsientosContables`; atomicidad parcial ya documentada en AUD-NG-049.

### Ámbito de concurrencia
- `LockService.getScriptLock()` protege el proyecto Apps Script correspondiente; no coordina automáticamente deployments independientes Academic y Accounting aunque compartan el mismo Spreadsheet.
- Las operaciones multihoja necesitan estado durable de operación, idempotencia y estrategia de recuperación; un lock local solo serializa la sección crítica dentro de su proyecto.
- Reconciliar las brechas con AUD-NG-006, AUD-NG-023, AUD-NG-049, AUD-NG-129, AUD-NG-133, AUD-NG-161 y TASK-118; evitar registrar duplicados.


## Motor de eventos, notificaciones y automatización (FASE2-T07 / C1.42, 2026-11-05)

### User Service
- `doPost` (1351-1558) -> `validateRolePermission` -> `checkAndRegisterIdempotencyKey` -> dispatch. Expone `registerAndDispatchEvent`, `retryFailedEventsQueue`, `sendMultiChannelNotification`, `retryFailedNotificationsQueue`, `configureNotificationChannel`, `getNotificationChannelConfigs`, `configureAutomationRules`, `getAutomationRules`.
- `registerAndDispatchEvent` (4618-4699) -> `BitacoraEventos` y `sendMultiChannelNotification`; persiste después del efecto secundario; deduplica solo por tipo + originRequestId cuando el registro ya está PROCESADO; originService no está autenticado. AUD-NG-176/TASK-474.
- `retryFailedEventsQueue` (4700-4760) -> `BitacoraEventos`; no reserva filas, no aplica nextAttemptAt/backoff y trata GLOBAL como no-op que termina PROCESADO. AUD-NG-176/TASK-474.
- `retryFailedNotificationsQueue` (4761-4817) -> `BandejaNotificaciones` y `MailApp`; reintenta Pendiente_Reintento sin máximo/contador/backoff. Ampliación TASK-474.
- `sendMultiChannelNotification` (4818-4935) -> `BandejaNotificaciones`, `MailApp`; no consume CanalesProveedoresConfig ni PreferenciasNotificacion; estado de email pendiente puede retornar status success. AUD-NG-176/177, TASK-422/474/475.
- `getNotificationPreferences` (4973-4984) devuelve valores fijos; `getUserSettings`/`saveUserSettings` (aprox. 7645-7715) consultan y persisten PreferenciasNotificacion, sin integración visible en el despachador. TASK-422.
- `configureAutomationRules`/`getAutomationRules` (6551-6604) -> `ReglasAutomatizacionAlertas`; guardan y leen reglas, pero el evaluador académico revisado no consume esa hoja. AUD-NG-039.
- `configureNotificationChannel`/`getNotificationChannelConfigs` (7526-7612) -> `CanalesProveedoresConfig`; configuración y credenciales no tienen separación segura. AUD-NG-177/TASK-475.
- `runInterdepartmentalIntegrationTestSuite` (218-310) llama a la cola real; no es un fixture aislado y devuelve status success aunque haya pruebas fallidas. AUD-NG-161/TASK-474.

### Academic Service
- `evaluateAndDispatchEarlyWarningAlerts` (9264-9535) -> `RegistrosAsistencia`, `Matriculas`, `AlertasTempranas`, `CasosSeguimiento`; no filtra por año lectivo/período, acepta mocks del payload para notas/tareas, no consume reglas configuradas en User y registra destinatarios como texto. AUD-NG-039.
- `getEarlyWarningAlerts` (9537+) consulta AlertasTempranas; el alcance de usuario debe derivarse de identidad/ámbito verificado, no solo de filtros del payload. AUD-NG-039.

### Accounting Service
- `configureLateFeeRule` (1148-1198) y `getLateFeeRules` (1196-1222) -> `RecargosMoras`.
- `calculateLateFeesForAccount` (1223-1278) -> `getStudentAccountStatement` y `RecargosMoras`; calcula importes y devuelve DTO, sin persistir alerta ni emitir evento/notificación. TASK-404.

### Dependencias y reconciliación
- `BitacoraEventos` -> productor `registerAndDispatchEvent` -> `BandejaNotificaciones`/`MailApp`; el efecto precede al registro durable.
- `CanalesProveedoresConfig` no está conectado al despachador multicanal.
- `PreferenciasNotificacion` se persiste, pero no se aplica desde `sendMultiChannelNotification`.
- `ReglasAutomatizacionAlertas` se persiste, pero no es consumida por el evaluador de alertas académicas.
- Reconciliar con AUD-NG-006, AUD-NG-039, AUD-NG-161, AUD-NG-176/177, TASK-404, TASK-422 y TASK-474/475. No crear hallazgos duplicados.



## Trazabilidad y correlación de operaciones (FASE2-T08 / C1.43, 2026-11-05)

### Cliente y despacho
- js/api.js:fetchApi (11+) -> USER doPost (1351-1620): no se genera ni propaga requestId/correlationId. Los reintentos POST no tienen identidad estable.
- USER doPost -> logStructuredEvent (326-350) -> LogsSistema: esquema sin correlationId/requestId, dependencia ni duración; la redacción cubre solo claves de credenciales.
- js/api.js:window.logStructuredEvent (257+) -> acción recordStructuredLog: el dispatcher USER no contiene esa acción.
- USER:delegateToTaskService (7946-7964) -> TASK_SERVICE_URL: transmite JSON plano, no sobre HMAC; ante excepción retorna status success local. Reconciliar AUD-NG-083/AUD-NG-174.

### Trazabilidad
- USER:recordTraceabilityLog (4548-4573) -> BitacoraTrazabilidad. Solo se invoca mediante el dispatcher; no hay llamadas desde operaciones de negocio. errorDetails no se sanitiza.
- USER:getTraceabilityCorrelationLogs (4575-4616) -> BitacoraTrazabilidad. Filtros actuales: correlationId, estado y servicio; sin acción, intervalo temporal ni paginación segura.
- USER:getPaginatedAuditLogReport (4243-4364) -> BitacoraEventos + BitacoraTraceability. El segundo nombre no coincide con BitacoraTrazabilidad; el DTO de BitacoraEventos tampoco coincide con el encabezado real del productor registerAndDispatchEvent.
- createInterServiceEnvelope/verifyInterServiceEnvelope (1009-1055) están declaradas sin consumidores; el tráfico interservicio no queda correlacionado ni autenticado por ese helper.

### Conservación y permisos
- getRetentionPolicies (2120+) define AUDIT_LOGS=365 días; executeDataRetentionPolicyCheck (2203-2254) consulta BitacoraEventos con índices de fecha/severidad incompatibles y no aplica a LogsSistema/BitacoraTrazabilidad.
- purgeStructuredLogs (7967-7990) elimina todo LogsSistema sin retención por antigüedad ni preservación legal.
- ROLE_PERMISSIONS (926+) permite las rutas de trazabilidad a Administrador/Desarrollador y Director; getStructuredLogs no figura en permisos de Director. La autorización de escritura no valida identidad del servicio emisor.

### Reconciliación
- AUD-NG-145: bitácora, filtros, redacción y retención.
- TASK-278: correlationId/sagaId, visor unificado, reconstrucción cronológica, RBAC y paginación.
- AUD-NG-174: envelope API, correlación, errores y fallback.
- AUD-NG-083: integración HMAC en tráfico real.
- TASK-474: correlación/causation de eventos y productores autenticados.

 
## T-UX-02 / AUD-NG-181 - ciclo de vida de modales y foco (C1.44, 2026-11-05)

- `js/ui-common.js:87-143`: `trackModalFocus` mantiene una sola referencia global; Escape oculta IDs predefinidos y nodos con role=dialog/.modal/[data-modal], cierra todos los encontrados y restaura solo esa referencia.
- Captura de foco disponible en seis abridores: profile (157), dashboard settings (1630), omnibox (4938), shared detail (5315), administración de usuarios (5469) y seguridad (5618). Abridores como document reader (2628), contextual help (3086), report issue (3748), tickets (3889/4074), analytics chart (4604) y mobile drawer (aprox. 4755) no registran activador.
- Cobertura ausente: `index.html:391` / `js/index-ui.js:868-895` (`news-detail-modal`); `dashboard-direccion.html:421-455` / `js/secretary.js:462-465,808-813` (modal de responsabilidades y analíticas). Son overlays `.fixed.inset-0` sin role=dialog, .modal ni data-modal y no figuran en activeModals.
- Registro duplicado: auto-init ui-common.js:3490-3493 más llamadas DOMContentLoaded desde js/index-ui.js:11, teacher-dashboard.html:1469 y student-dashboard.html:401; falta guard de listener único.
- Prueba UX-02 (1846-1867) solo valida existencia de trackModalFocus, no comportamiento.
- Hallazgo AUD-NG-181; ampliar TASK-258. No crear TASK-479. AUD-NG-169 permanece como accesibilidad general de paneles.


## Protección contra pérdida de cambios no guardados (T-UX-03 / T-UX-17 / C1.45)

### Frontend compartido
- `js/ui-common.js:5371-5430` -> `window.setupUnsavedChangesProtection(containerIdOrElement, options)`.
- Entrada: ID o elemento contenedor y `options.message`.
- Estado local: `isDirty`; operaciones: `markDirty`, `markClean`; binding: `bindInputs`.
- Controles enlazados: descendientes `input, textarea, select`, eventos `input/change`.
- Formularios: eventos `submit/reset` enlazados al formulario contenedor o a los formularios descendientes existentes al inicializar.
- Campos dinámicos: `MutationObserver` observa `childList/subtree` y vuelve a enlazar controles.
- Salida: objeto con `markClean`, `markDirty`, `isDirty` y `resetProtection`.
- Protección de navegación: cada invocación registra un listener independiente en `window.beforeunload`.

### Prueba UX
- `js/ui-common.js:1869-1875` -> caso UX-03 en `window.runUXSuiteTests`; actualmente comprueba solo la existencia de `setupUnsavedChangesProtection`, no el comportamiento.
- Reconciliar la mejora pendiente con AUD-NG-182/TASK-479. T-UX-17 y T-UX-10 figuran completadas, pero su cumplimiento funcional no queda demostrado por el código y la prueba existente.

### Relaciones y riesgos
- `submit` -> `markClean` inmediato, sin confirmación de persistencia; puede ocultar un guardado cancelado/fallido.
- `reset` -> `markClean` inmediato, sin comprobar cancelación.
- `MutationObserver` re-enlaza inputs, pero no agrega handlers submit/reset a subformularios insertados después de inicializar.
- No existe snapshot del estado inicial; revertir manualmente un valor no restaura clean.
- No existe teardown para el listener global ni para MutationObserver; una instancia retirada puede conservar estado y listener.
- Dependencias externas: DOM Form/Input/Textarea/Select, eventos DOM, MutationObserver, beforeunload y flujos de guardado de los formularios consumidores.


## Indicador de frescura de datos y actualización manual (T-UX-04 / T-UX-21 / C1.46)

### Componente compartido
- `js/ui-common.js:5438-5789` -> `window.renderDataFreshnessBadge(containerIdOrElement, lastUpdatedTimestamp, onRefreshCallback)`.
- Inserta `.data-freshness-badge-element` en el contenedor recibido; muestra antigüedad relativa y hora local.
- El botón `.btn-refresh-badge` solo recibe listener cuando se proporciona `onRefreshCallback`.
- El timestamp ausente se sustituye por `new Date()`; la confirmación del callback se considera fallida solo si `success === false`.
- La función exterior no se cierra hasta la línea 5789.

### Dependencias y consumidores
- `runUXSuiteTests` / UX-04: `js/ui-common.js:1879-1885`; solo comprueba que exista la función.
- `window.openUserManagementAdministrationModal` se declara en `js/ui-common.js:5468-5614`, dentro del renderer.
- `window.openSecurityAndComplianceDashboardModal` se declara en `js/ui-common.js:5617-5765`, dentro del renderer.
- Consumidores: `dashboard-direccion.html:188-198` y `dashboard-secretaria.html:330-331`; los botones omiten la acción cuando los helpers no están definidos.
- No se localizaron llamadas externas a `renderDataFreshnessBadge` en los 21 archivos JavaScript ni en los 13 HTML principales de dashboards revisados.

### Riesgos y reconciliación
- No hay integración del badge en las vistas revisadas ni callback de actualización conectado a operaciones reales.
- Sin timestamp se presenta la hora actual como si fuera una sincronización; timestamp inválido puede producir `Invalid Date`.
- Sin callback, el botón queda visible pero inerte; un callback ambiguo puede tratarse como éxito y renovar timestamp sin confirmación explícita.
- Los estados actualizado/desactualizado/pendiente/error de T-UX-21 no están modelados integralmente.
- El anidamiento de los helpers administrativos es una regresión colateral del límite incorrecto de `renderDataFreshnessBadge`.
- AUD-NG-183/TASK-480 concentra la corrección del renderer, integración, contrato de refresh, estados, pruebas y restauración de helpers.

 
## Normalización diacrítica frontend y búsqueda global (T-UX-05 / T-UX-06 / T-UX-14 / T-UX-15, C1.47)

### Normalizador frontend
- js/ui-common.js:2202-2212 -> window.normalizeSearchString(str).
- Convierte a string, minúsculas, NFD, elimina marcas U+0300-U+036F, sustituye signos no alfanuméricos por espacios, colapsa espacios y recorta.
- Consumidor de búsqueda: renderAdminTicketsUI (4094-4112), que normaliza consulta, ticketId, nombreUsuario, areaFuncion y descripcion antes de usar indexOf. El input admin-ticket-search-input ejecuta el render al escribir.
- Consumidor de filtros: setupAdvancedTableFilters (2137-2150), que normaliza cada valor de filtro y campo del registro antes de comparar.
- Prueba UX-05: runUXSuiteTests (1885-1892), verifica la salida del normalizador.

### Normalización en backend y tareas posteriores
- backend/user-service/Code.gs:841-844 -> normalizeString(str), con lowercase + NFD + eliminación de U+0300-U+036F + trim.
- searchGlobalOmnibox (aprox. 7990-8142) normaliza la consulta al inicio y normaliza campos de expedientes, usuarios, noticias y trámites antes de buscar.
- T-UX-06 y T-UX-14 dependen del normalizador backend; no sustituyen el helper frontend.
- T-UX-15 utiliza normalizeSearchString desde el administrador de filtros avanzados.
- T-UX-10 incorpora el caso UX-05, pero el test valida la transformación de texto, no el flujo de búsqueda completo.

### Calidad y límites
- El criterio «matematica» encuentra «Matemáticas» por normalización simétrica y comparación indexOf.
- La regex \w es ASCII; algunos caracteres Unicode que no se descomponen a ASCII pueden perderse.
- La ñ se reduce a n y la puntuación se convierte en espacios; son decisiones más amplias que la aceptación mínima y pueden afectar búsquedas con nombres/identificadores especiales.
- Otros módulos mantienen normalizadores NFD locales para casos específicos; no existe centralización total de todos los usos de texto.
- Estado T-UX-05: CUMPLE; sin nuevo AUD-NG ni TASK.


## Omnibox multi-entidad, autorización y renderizado (T-UX-06, C1.48)

### Frontend
- `js/ui-common.js:4937-5009` -> `window.openGlobalOmniboxModal` / `window.closeGlobalOmniboxModal`: creación/reutilización del modal, input, debounce, foco y restauración.
- `js/ui-common.js:5011-5059` -> `window.executeOmniboxSearch`: llamada a `fetchApi('USER','searchGlobalOmnibox', payload)`, renderizado de resultados en `#omnibox-results-container`.
- `js/ui-common.js:5061-5070` -> `window.handleOmniboxResultClick`: abre expediente para `user/student_file`; otras entidades solo muestran toast.
- `js/ui-common.js:5072-5082` -> listener global Ctrl+K/Cmd+K/Escape.
- Riesgo: datos title/category/subtitle/icon/type/id se interpolan en HTML/atributos sin escape contextual. La descripción de una solicitud puede proceder de un usuario final. Depuración y corrección: TASK-482/AUD-NG-185.

### Backend y dependencias
- `backend/user-service/Code.gs:7992-8142` -> `searchGlobalOmnibox(payload)`; entidades: ExpedientesEstudiantes, Matriculas, Usuarios, NoticiasPortal y SolicitudesTramites.
- `backend/user-service/Code.gs:841-844` -> `normalizeString(str)`; normalización NFD en el servidor.
- `backend/user-service/Code.gs:1146-1164` -> `getUserVerifiedRole(payload)`; verifica token firmado y expone claims verificados en payload interno.
- `backend/user-service/Code.gs:1253-1264` -> `validateRolePermission(action,payload)`; la acción omnibox está autorizada para todo rol autenticado; la política por entidad debe imponerse dentro del buscador.
- `backend/user-service/Code.gs:1351-1365` -> `doPost(e)`; ejecuta validación de rol antes del dispatch.
- `backend/user-service/Code.gs:3116-3148` -> `getNews(payload)`; filtra noticias activas, vigencia y audiencia de grado/sección.
- `backend/user-service/Code.gs:5036-5069` -> `getAdministrativeRequests(payload)`; filtra por UserId/EstudianteID y fuerza claims para estudiantes.
- `backend/user-service/Code.gs:5134-5166` -> `submitAdministrativeRequest(payload)`; almacena descripción aportada por usuario en SolicitudesTramites.
- Dependencias de datos: encabezado de SolicitudesTramites en Code.gs:890 (SolicitudID, UserId, EstudianteID, TipoTramite, Descripcion, AdjuntoUrl, Estado, AsignadoA, ObservacionesAdmin, FechaSolicitud, FechaResolucion); NoticiasPortal en Code.gs:876 (incluye GradoAudiencia, SeccionAudiencia, FechaInicio, FechaFin y Estado).
- Brechas: búsqueda global no aplica aislamiento de solicitudes ni filtros de audiencia/vigencia a noticias. TASK-481/AUD-NG-184.
- Brecha XSS: salida del omnibox sin codificación contextual. TASK-482/AUD-NG-185.

### Pruebas y reconciliación
- UX-06 de `runUXSuiteTests` (ui-common.js:1896-1904) comprueba presencia de función, no atajo ni búsqueda funcional.
- T-UX-14 añade requisitos de no interceptar campos editables, navegación directa y consultas vacías/especiales; quedan para su auditoría dedicada.
- T-UX-10 amplía las pruebas de flujo; se revisará en su turno.


## Navegación lateral por rol y drawer móvil (T-UX-09 / T-UX-13 / T-UX-20, C1.49)

### Componentes compartidos
- `js/ui-common.js:4710-4721` -> `toggleRoleMenuAccordionSection(sectionId,containerId)`; alterna `hidden` y cierra las secciones hermanas.
- `js/ui-common.js:4723-4755` -> `initRoleNavigationMenu()`; lee `currentUser.rol` desde almacenamiento cliente, intenta enlazar `btn-desktop-sidebar-toggle` con `desktop-sidebar-container` y agrega botón hamburguesa a `#main-header nav` o `#main-header .container`.
- `js/ui-common.js:4757-4890` -> `openMobileHamburgerDrawer()`; genera un drawer con tres grupos estáticos (Académico, Gestión, Servicios). El rol solo determina cuál grupo abrir inicialmente; no filtra enlaces ni construye un menú por rol.
- `js/ui-common.js:4917-4924` -> inicialización diferida en DOMContentLoaded.
- `js/ui-common.js:1918-1926` -> UX-09 prueba solo presencia de funciones.
- `css/style.css:175-190` -> `.mobile-menu-backdrop` tiene transición, pero el drawer no usa esa clase.
- `css/style.css:195-201` -> existen `.animate-fade-in-up` y `.animate-fade-in-left`, no una regla para `.animate-fade-in`; el panel del drawer tampoco declara transición.

### Dashboards
- `dashboard-cafeteria.html`, `dashboard-contabilidad.html`, `dashboard-direccion.html`, `dashboard-recursos-humanos.html`, `dashboard-secretaria.html`, `dashboard-tienda.html`, `student-dashboard.html`, `teacher-dashboard.html` y `dashboard-coordinacion.html` cargan `js/ui-common.js` y tienen `#main-header`; Coordinación carece de nav y recibe el botón por el contenedor.
- `developer-dashboard.html` no carga `js/ui-common.js` y no contiene `#main-header`, nav, aside ni botón hamburguesa compartido.
- `app/html/dashboards/dynamic-dashboard.html` carga `ui-common.js`, pero su header no tiene `id=main-header`, por lo que el selector de inserción no encuentra destino.
- En los 11 dashboards inspeccionados no aparecen `btn-desktop-sidebar-toggle` ni `desktop-sidebar-container`; la rama de colapso desktop no tiene elementos conectados.
- El drawer móvil omite destinos propios como dashboard-coordinacion.html, dashboard-direccion.html, dashboard-secretaria.html y developer-dashboard.html.

### Reconciliación y corrección
- T-UX-13 requiere opciones comunes/exclusivas por panel, rutas reales, sección activa, teclado/táctil y drawer móvil; T-UX-20 amplía la adaptación responsive. Ambas se revisarán formalmente después.
- TASK-253 contempla un drawer responsive/accesibilidad y TASK-430 coherencia visual del sidebar; no cubren la matriz de autorización/rutas observada.
- AUD-NG-186 / TASK-483 registra la brecha concreta para corregir la navegación por rol, el desktop sidebar y las transiciones.


## Suite de pruebas de experiencia de usuario T-UX-10 (C1.50)

### Contrato de prueba existente
- `js/ui-common.js:1846-1937` -> `window.runUXSuiteTests()`; produce nueve entradas UX-01..UX-09, con `addResult(id,name,success,detail)`, estado binario PASS/FAIL y resumen total/passed/failed/results.
- UX-01 -> `handleSessionExpired`; UX-02 -> `trackModalFocus`; UX-03 -> `setupUnsavedChangesProtection`; UX-04 -> `renderDataFreshnessBadge`; UX-05 -> `normalizeSearchString`; UX-06 -> `openGlobalOmniboxModal`; UX-07 -> `#online-status-badge` o `navigator.onLine`; UX-08 -> `openReportIssueModal`; UX-09 -> `openMobileHamburgerDrawer` y `toggleRoleMenuAccordionSection`.
- UX-01, UX-02, UX-03, UX-04, UX-06, UX-08 y UX-09 solo comprueban existencia de función; UX-05 una entrada fija; UX-07 usa un OR que acepta la propiedad navigator.onLine aunque no exista badge.
- La suite no modela SKIPPED/BLOCKED, no produce cobertura por escenario y no demuestra que los flujos se ejecuten en los paneles.

### Dependencias y componentes relacionados
- `js/ui-common.js:34-57` -> `updateOnlineBadge` y listeners online/offline.
- `js/ui-common.js:88-143` -> `trackModalFocus` y listener Escape (reconciliar AUD-NG-181).
- `js/ui-common.js:2202-2212` -> `normalizeSearchString`.
- `js/ui-common.js:3748-3836` -> `openReportIssueModal` y `submitProblemReportForm`.
- `js/ui-common.js:4937-5082` -> Omnibox (reconciliar TASK-481/TASK-482).
- `js/ui-common.js:5371-5430` -> protección de cambios no guardados (TASK-479).
- `js/ui-common.js:5438-5789` -> badge de frescura (TASK-480).
- `js/ui-common.js:4710-4924` -> navegación por rol (TASK-483).
- `tests/regression/academic-grading-suite.js` SHA 3433b707edd4a2f35c68368a3172932adc2a3b32: suite Node con fs.existsSync/includes; sin pruebas UX.
- `tests/regression/modular-dashboard-suite.js` SHA 0495e1d526a872c33310935a003a83d924d34683: verificaciones de archivos/contratos; sin pruebas UX.
- Dashboards revisados: `dashboard-direccion.html`, `dashboard-recursos-humanos.html`, `dashboard-contabilidad.html`, `student-dashboard.html`, `teacher-dashboard.html`. Cargan ui-common.js, sin invocación explícita encontrada para runUXSuiteTests.
- Módulos revisados: `js/student.js`, `js/teacher.js`, `js/accounting.js`; no contienen referencias directas a runUXSuiteTests ni a los helpers UX indicados.

### Hallazgo y reconciliación
- AUD-NG-187 / TASK-484: hacer que los nueve casos ejecuten flujos conductuales, incorporen fixtures aislados y reporten PASS/FAIL/SKIPPED/BLOCKED; cubrir cinco contextos de panel.
- AUD-NG-009 es la regla general de pruebas funcionales en regresión, no sustituye el trabajo específico UX.
- AUD-NG-162, AUD-NG-181, TASK-479, TASK-480, TASK-481, TASK-482 y TASK-483 conservan sus alcances funcionales y deben convertirse en dependencias de prueba, no duplicarse.
- T-UX-13/T-UX-20, T-UX-14, T-UX-17, T-UX-21, T-UX-22 y T-UX-23 son ampliaciones posteriores a incluir en la matriz de regresión.


## Navegación contextual e historial de vistas (T-UX-11, C1.51)

### Mecanismo compartido
- `js/ui-common.js:281-385` -> `handlePopState` dentro de `setupCommonUI`; procesa estados `dashboard-section`, `hierarchical-nav`, modales y estados de índice, pero no procesa `event.state.view`.
- `js/ui-common.js:4864-4902` -> `VIEW_STATES_CACHE` y `switchActiveView(viewId,pushHistory,stateParams)`; guarda scroll y parámetros del destino dentro del registro de la vista saliente; al restaurar solo lee scrollTop.
- `js/ui-common.js:4904-4917` -> `initNoLoopHistoryManager`; declara listener popstate para `state.view`, pero no se encontró invocación en módulos ni dashboards revisados.
- `switchActiveView` agrega `#viewId` al historial, pero no se encontró resolución inicial de `location.hash`; el ID inexistente termina en return silencioso.

### Navegación por panel
- `js/teacher.js:215-245` -> `window.navigateTo`, estado `dashboard-section`.
- `js/teacher.js:3220-3275` -> `pushNav`, `popNav`, `syncNavWithState`, stack jerárquico.
- `js/teacher.js:5997-6008` -> `history.replaceState` para el estado inicial del Docente.
- `js/student.js` SHA e2888cea60322e49a40b89adadb8010489605dcc: sin referencias a switchActiveView/VIEW_STATES_CACHE/history.pushState/replaceState/popstate.
- `js/accounting.js` SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7: sin referencias a los mecanismos de estado contextual indicados.
- Dashboards revisados: Dirección, RH, Contabilidad, Estudiante, Docente, Secretaría y Coordinación; no se encontró invocación de initNoLoopHistoryManager ni integración general del mecanismo switchActiveView.

### Hallazgos y relaciones
- AUD-NG-188 / TASK-485: inicializar y unificar router/historial; resolver URL directa, atrás/adelante, permisos y rutas inválidas.
- AUD-NG-189 / TASK-486: corregir snapshot y restaurar filtros, búsqueda, orden, página, selección y scroll; integrar stack de Docente.
- AUD-NG-162 mantiene el alcance de expiración; T-UX-13/TASK-483 cubre menú y rutas visibles; T-UX-15 cubre filtros/paginación, no la preservación contextual.


## Paneles de control por rol y departamento (T-UX-12, C1.52)

### Estudiante
- `js/student.js:5-19` -> `consolidateStudentDashboardSummary`; helper declarado sin consumidor.
- El helper cuenta pendientes mediante `!actividad.entregado`; el modelo de actividades procesado por el módulo utiliza `actividad.entrega.estado`. La integración requiere normalizar el contrato y separar tareas de exámenes.
- `student-dashboard.html` -> actividades, progreso, finanzas y guías; no se encontró componente que invoque el consolidado.

### Docente
- `js/teacher.js:117-134` -> `consolidateTeacherDashboardSummary`; helper declarado sin consumidor.
- `teacher-dashboard.html:127-172` -> panel principal de control de entregas con filtros y tabla; no presenta los indicadores calculados por el helper.
- `js/teacher.js` obtiene estudiantes, tareas, exámenes y entregas para reportes, pero no pasa esos datos al helper de resumen.

### Contabilidad
- `js/accounting.js:10-24` -> `consolidateAccountingDashboardSummary`; helper declarado sin consumidor.
- `js/accounting.js:1802-1811` -> `renderResumenModule` es texto estático, sin consulta ni render de indicadores.
- `dashboard-contabilidad.html:90-99` -> contenedor de módulo; no hay KPIs financieros reales en el resumen.
- El helper transforma objeto ausente/campos no numéricos en L 0.00 y cero facturas; debe distinguir no disponible de cero confirmado.

### Dirección
- `dashboard-direccion.html:62-73` -> `pending-approvals-count` inicial en cero y bandeja con texto estático.
- No se encontró consumidor de esos IDs en `js/secretary.js` ni `js/teacher.js`.
- `backend/accounting-service/Code.gs:999-1027` -> existe `getDiscountScholarshipRequests`, pero no está conectado a la bandeja cargada por Dirección.

### Coordinación
- `js/secretary.js:522-570` -> `loadCoordinatorDashboardData` consulta `getCoordinatorOverview`, pero fija el indicador de sílabos en `0 Pendientes` y el mensaje de lista en “Todas las jornalizaciones y sílabos están al día”.
- `backend/academic-service/Code.gs:6200-6224` -> `getCoordinatorOverview` solo devuelve ofertas, asignaciones y horarios; no expone el estado de sílabos/jornalizaciones.
- El contador de docentes, ofertas y vacantes sin asignación sí se calcula desde los datos devueltos; no se extiende el hallazgo a esos indicadores.

### Dashboard dinámico y responsabilidades
- `js/ui-common.js:5819-5863` -> `loadDynamicDashboard` genera tarjetas de módulos; “Acceder” es un span sin enlace/listener.
- `backend/user-service/Code.gs:9254-9293` -> `getUserDynamicDashboardConfig` usa mapa fijo de seis roles y fallback `mod_mis_clases`/`mod_mis_horarios` para roles no incluidos.
- `F8-Task12` (antes TAREA-AD-07) proporciona consola de roles/responsabilidades, pero la configuración devuelta no demuestra integración de módulos dinámicos ni accesos reales para todos los roles.
- T-UX-13/TASK-483 resuelve navegación lateral; no sustituye el destino funcional de cada módulo dinámico.

### Recursos Humanos: contrato de respuesta
- `dashboard-recursos-humanos.html:2360-2415` -> `loadHRDashboardData` espera `resLeaves.data`, `tipoSolicitud`, `userId` y estado `Pendiente`.
- `backend/accounting-service/Code.gs:8578-8606` -> `getVacationRequests` devuelve `solicitudes`, `tipo`, `expedienteId`; la creación registra `PendienteAprobacion`.
- Resultado: contador/lista no procesan la respuesta real y dejan valores iniciales.

### Recursos Humanos: autorización y aislamiento
- `backend/accounting-service/Code.gs:198-205` -> el rol `Empleado` tiene permiso de acción para `getEmployeeRecords` y `getLeaveVacationRequests`.
- `backend/accounting-service/Code.gs:420-432` -> `validateContextualAccess` aplica aislamiento a Estudiante/Alumno, no a Empleado.
- `backend/accounting-service/Code.gs:8152-8189` -> `getEmployeeRecords` solo filtra por IDs opcionales; sin filtros devuelve todos los expedientes.
- `backend/accounting-service/Code.gs:8578-8606` -> `getVacationRequests` solo filtra por expediente/estado opcionales; sin filtro devuelve todas las solicitudes.
- Los endpoints deben resolver titularidad desde `_verifiedUserId`; los parámetros de cliente no prueban identidad.

### Hallazgos y tareas
- AUD-NG-190 / TASK-487 -> integrar resúmenes reales de Estudiante, Docente y Contabilidad; alinear modelos y distinguir cero/no disponible.
- AUD-NG-191 / TASK-488 -> conectar Dirección, obtener pendientes reales de Coordinación y completar mapa/accesos del dashboard dinámico.
- AUD-NG-192 / TASK-489 -> alinear contrato de solicitudes de vacaciones entre RR. HH. y accounting-service.
- AUD-NG-193 / TASK-490 -> aplicar aislamiento por empleado en servidor para expedientes y solicitudes laborales.
- T-UX-16, F8-Task12, T-UX-13, T-UX-20 y TAREA-04 se conservan como dependencias relacionadas, no como sustitutos de las correcciones anteriores.


## Menú lateral por panel/rol y rutas (T-UX-13, C1.53)

### Inicialización compartida: js/ui-common.js
- Blob SHA: `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- `toggleRoleMenuAccordionSection(sectionId, containerId)`, líneas 4710-4721: alterna `hidden` en la sección elegida y oculta hermanas; no actualiza atributos ARIA.
- `initRoleNavigationMenu()`, líneas 4723-4755: obtiene `currentUser.rol` de localStorage/sessionStorage; fallback Estudiante. Busca `#btn-desktop-sidebar-toggle` y `#desktop-sidebar-container`, pero no existen en los 11 dashboards revisados. Inserta disparador en `#main-header nav` si existe o en `#main-header .container` como fallback.
- El disparador generado usa `md:hidden`. En ocho dashboards el nav padre usa `hidden md:flex`, por lo que el botón es invisible en móvil por el padre y en escritorio por su propia clase. Coordinación no tiene nav y el fallback lo inserta en el contenedor.
- `openMobileHamburgerDrawer()`, líneas 4757-4890: construye tres grupos estáticos y enlaces idénticos para todos los roles; el rol solo decide el grupo inicial. No consulta permisos ni la configuración dinámica del usuario.
- `DOMContentLoaded`, líneas 4917-4924: invoca el inicializador con demora de 600 ms.

### Dashboards y encabezados
- Dirección: `dashboard-direccion.html`, SHA `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c`, líneas 15-34; nav `hidden md:flex`.
- Recursos Humanos: `dashboard-recursos-humanos.html`, SHA `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee`, líneas 15-38; nav `hidden md:flex`.
- Contabilidad: `dashboard-contabilidad.html`, SHA `b7653b3bff71829f0f67cf47cb894413c56a444a`, líneas 15-39; nav `hidden md:flex`.
- Estudiante: `student-dashboard.html`, SHA `6379ea0ed39d71b89747a0280bb925fdf12202c1`, encabezado `#main-header`, nav `hidden md:flex`.
- Docente: `teacher-dashboard.html`, SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`, encabezado `#main-header`, nav `hidden md:flex`.
- Secretaría: `dashboard-secretaria.html`, SHA `fa0d8c23aace24a6acab2d4956398a7f5e1309b8`, líneas 15-38; nav `hidden md:flex`.
- Coordinación: `dashboard-coordinacion.html`, SHA `08de8e4eb150ee9f6aad536ca08e8f76f2e0e896`, líneas 16-37; no tiene nav, usa fallback al contenedor.
- Cafetería: `dashboard-cafeteria.html`, SHA `12f8c828dd1f8f2c3be34e14d8c9478944c64d04`, líneas 15-38; nav `hidden md:flex`.
- Tienda: `dashboard-tienda.html`, SHA `60fb5c399b527f7d3a6e764332d8496e17643d5c`, líneas 15-38; nav `hidden md:flex`.
- Developer: `developer-dashboard.html`, SHA `2b69f1bf7ffbbe4902e81de14d6315cedb035a1e`; no carga `js/ui-common.js` ni tiene `#main-header`.
- Dashboard dinámico: `app/html/dashboards/dynamic-dashboard.html`, SHA `765a45e5666c24c430e841cb70c3d71d03cf9074`; carga `ui-common.js`, pero su header no tiene `id="main-header"`.

### Estilos y accesibilidad
- `css/style.css`, SHA `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`, líneas 175-201: backdrop/transiciones y clases `animate-fade-in-up`/`animate-fade-in-left`; el drawer solicita `animate-fade-in`, clase no definida.
- `css/style.css:1053-1063`: existe regla global `prefers-reduced-motion`; no compensa que el drawer/acordeón no tengan transición efectiva.
- Drawer sin `aria-current` para la ruta activa; acordeones sin `aria-expanded`/`aria-controls`; sin gestión de Escape, foco inicial, foco atrapado/restaurado ni `aria-modal`.
- “Gráficas de Rendimiento” abre modal desde un enlace `javascript:void(0)`; es una acción y debe ser botón.
- Los menús horizontales estáticos de algunos dashboards no sustituyen el sidebar común ni filtran opciones según permisos efectivos.

### Hallazgos y tareas
- AUD-NG-186 / TASK-483: hallazgo original T-UX-09 de menú genérico, rutas incompletas y desktop no funcional.
- AUD-NG-194 / TASK-483: ampliación T-UX-13 por disparador móvil oculto debido al anidamiento en `nav.hidden.md:flex`, falta de estado activo accesible y mezcla de acción inmediata como enlace. No se crea tarea duplicada.
- T-UX-19 cubre accesibilidad general; T-UX-20 adaptación móvil; T-UX-11/TASK-485/486 historial/contexto. Se mantienen relacionados, no sustituyen la matriz de menú/rutas por rol.


===============================================================================
MAPA DE DEPENDENCIAS - AUDITORÍA T-UX-14
===============================================================================
Archivo: js/ui-common.js
SHA: 986938b8a311a41ed4cb3d135b66b6aaea4bed67
- openGlobalOmniboxModal (4937-4993): crea/reutiliza modal; registra input/debounce; depende de document, setTimeout y executeOmniboxSearch.
- closeGlobalOmniboxModal (4995-5009): oculta modal y restaura foco a omniboxActiveTrigger.
- executeOmniboxSearch (5011-5059): construye payload, invoca fetchApi(USER, searchGlobalOmnibox), procesa respuesta y escribe resultados en #omnibox-results-container mediante innerHTML.
- handleOmniboxResultClick (5062-5070): consume type/id; solo abre StudentFileModal para user/student_file; news/request solo producen toast.
- listener window keydown (5072-5082): consume Ctrl+K/Cmd+K/Escape; no filtra controles editables ni composición IME.
Dependencias salientes:
- fetchApi (js/api.js), showToast, openStudentFileModal, document/window, #modal-global-omnibox, #omnibox-search-input, #omnibox-results-container.
- TASK-482 debe resolver el sink de HTML/onclick y la consulta reflejada; TASK-491 debe resolver rutas, atajo contextual, orden y concurrencia.

Archivo: backend/user-service/Code.gs
SHA: 12079dd410aa6d8afbce55a4bc62a79dea605f9f
- normalizeString (841-844): normaliza minúsculas, NFD, marcas diacríticas y espacios externos.
- getUserVerifiedRole (1146-1164): deriva rol/identidad desde la sesión verificada.
- validateRolePermission (1253-1264): autoriza searchGlobalOmnibox para cualquier rol autenticado y delega alcance a la función.
- searchGlobalOmnibox (7992-8144): consulta ExpedientesEstudiantes, Matriculas, Usuarios, NoticiasPortal y SolicitudesTramites; filtra expediente por campos académicos, pero no aplica autorización contextual por registro a todas las entidades; agrega entidades por bloques y aplica límite global de 20.
Dependencias salientes:
- SpreadsheetApp/Spreadsheet ID, hojas de expediente/matrícula/usuarios/noticias/trámites, normalizeString, getUserVerifiedRole.
- getNews (3116-3148) y getAdministrativeRequests (5036-5069) contienen reglas de audiencia/titularidad que deben reconciliarse con la búsqueda.
Relaciones:
- TASK-481: autorización contextual por entidad y semántica de filtros.
- TASK-482: salida DOM segura y prevención XSS en consumidor.
- TASK-491: navegación real, atajos y resiliencia asíncrona.
- TASK-484: pruebas conductuales UX-01..UX-09.
===============================================================================


## Filtros avanzados, vistas guardadas y paginación coherente (T-UX-15, C1.55)

### js/ui-common.js
- SHA de respaldo: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `renderPaginatedTable`, líneas 1999-2067:
  - Entrada: containerId, data, options.pageSize/currentPage, options.fetchRemotePage, options.remotePagination, options.headers y options.renderRow.
  - Paginación local: calcula total sobre data y usa slice(startIndex, startIndex + pageSize).
  - Paginación remota: se activa por fetchRemotePage; data se trata como página recibida y total proviene de remotePagination.
  - Eventos: botones anterior/siguiente vuelven a renderizar localmente o llaman fetchRemotePage(targetPage, pageSize).
  - No recibe ni propaga filtros/ordenamiento como estado de consulta; no gestiona loading/error/retry ni corrige páginas fuera de rango.
- `SAVED_TABLE_VIEWS_CACHE`, línea 2075: objeto global, escrito por saveView; no se encontró consumidor en los cuatro módulos principales revisados.
- `setupAdvancedTableFilters`, líneas 2128-2195:
  - Entradas: config.data, config.filterFields, config.onFilterChange.
  - Dependencias: normalizeSearchString (líneas 2198-2208), localStorage y SAVED_TABLE_VIEWS_CACHE.
  - `filterFields` se declara, pero no participa en applyFilters ni valida campos.
  - applyFilters recorre currentFilters y combina condiciones mediante AND; compara valores como texto normalizado y subcadena.
  - setFilter usa condición falsy para eliminar valores; item[field] || '' pierde 0 y false.
  - API pública: setFilter, removeFilter, clearAllFilters, saveView, loadSavedView, getActiveFilters. No genera UI de etiquetas/chips ni implementa ordenamiento.
  - saveView/loadSavedView guarda solo filtros en localStorage con clave saved_views_{containerId}; no incorpora identidad/rol/ámbito ni comparte vistas.
- Relación de navegación: TASK-486 conserva/restaura snapshots al navegar; T-UX-15/TASK-429 debe exponer un estado de lista serializable y coordinar su uso, sin duplicar el router/snapshot.
- Relación de reportes: TASK-249 gestiona vistas analíticas del visor de reportes; no cubre las vistas reutilizables de tablas operativas.
- Relación de bandejas: TASK-453 implementa filtros/paginación de bandejas documentales en backend; no sustituye el componente común.

### Módulos consumidores inspeccionados
- `js/teacher.js`: SHA c475fce5afcd28fca23e7b64398ad32b17773746; no se localizaron referencias directas a los helpers.
- `js/student.js`: SHA e2888cea60322e49a40b89adadb8010489605dcc; no se localizaron referencias directas.
- `js/accounting.js`: SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7; no se localizaron referencias directas.
- `js/secretary.js`: SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; no se localizaron referencias directas.

### Hallazgos
- AUD-NG-201 / TASK-429: filtro genérico incompleto y sin integración efectiva con paginación/tablas.
- AUD-NG-202 / TASK-429: persistencia de vistas de tabla sin aislamiento de usuario/rol/ámbito ni modelo de compartición.
- FASE2-07 ya documentó ausencia de consumidores de renderPaginatedTable y modo remoto no integrado; se conserva el antecedente sin duplicarlo.

## Bandeja unificada de notificaciones, tareas y aprobaciones (T-UX-16, C1.56)

### Frontend
- `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 2081-2114: `consolidatePendingApprovalsAndNotifications(rawItems)` solo normaliza un array recibido; no agrega fuentes ni obtiene datos.
- El helper espera `id/codigo`, `fecha/timestamp` y `modulo/targetModule`; backend usa `notificacionId`, `fechaRegistro` y `enlaceAccion`. La transformación pierde identidad/fecha/destino y asigna valores sustitutos.
- No modela de forma completa origen, contexto, entidad relacionada, vencimiento ni acción requerida. `markAsRead` cambia estado local sin persistencia; `!!item.leido` trata `"false"` como verdadero.
- No se localizaron consumidores directos del helper en api.js, student.js, teacher.js, secretary.js ni accounting.js.

### Backend y persistencia
- `backend/user-service/Code.gs` SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- `getUnifiedNotifications` (4033-4072) usa categoria/leido/userId sin declaración local; `getUserNotifications` delega en ella.
- `BandejaNotificaciones` se crea con nueve columnas (892); `createUserNotification` escribe nueve (5007-5030), pero `sendMultiChannelNotification` escribe doce en otro orden (4818-4885). Contrato de escritura/lectura incompatible.
- La deduplicación lectura+append no es atómica; `createUserNotification` no persiste una clave dedup. No se encontró `getUserWorkInbox`.

### Seguridad y dependencias
- `markNotificationAsRead` (4993-5005) no comprueba propietario.
- `getDepartmentalWorkInbox` (3916-3939) confía en departamento/rol del payload y la rama direccion/administrador incluye todas las solicitudes.
- `getAuthorizationRequests` (6036-6098) conserva bypass por `tutorUserId` (AUD-NG-036); `processWorkflowDecision` (6757-6818) prioriza `revisorId` del cliente sobre identidad verificada (AUD-NG-024).
- Dependencias: TASK-221 bandeja unificada; TASK-227 eventos de workflow; TASK-316 multicanal/deduplicación; TASK-318 bandeja personal/SLA; TASK-045 idempotencia. No crear tareas paralelas.

### Hallazgos vinculados
- AUD-NG-203 (ALTO/P1) -> TASK-227/TASK-316: consulta backend rota y esquema 9/12 incompatible.
- AUD-NG-204 (CRÍTICO/P0) -> TASK-221/TASK-318: falta de aislamiento por propietario/departamento.
- AUD-NG-205 (ALTO/P1) -> TASK-221/TASK-318: normalizador desconectado e inexistencia de agregador personal.
- AUD-NG-206 (ALTO/P1) -> TASK-227/TASK-316/TASK-045: deduplicación no atómica y clave no persistida.
- Auditoría estática/manual; no se ejecutaron Apps Script, Sheets, navegador, roles reales, concurrencia, correo ni mutaciones persistentes. Dictamen: NO CUMPLE.


## Protección de cambios no guardados (T-UX-17, C1.60)

### Implementación compartida
- `js/ui-common.js` SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`, líneas 5371-5430: `window.setupUnsavedChangesProtection(containerIdOrElement, options)`.
- Entrada: ID o elemento contenedor; `options.message` personaliza el texto de advertencia.
- Estado local: booleano `isDirty`; `markDirty` fija true y `markClean` fija false. No existe snapshot de valores iniciales ni comparación de estado.
- Controles: `input, textarea, select`; eventos `input/change`. No incluye contenteditable ni controles personalizados.
- Formularios: `submit/reset` se enlazan al formulario contenedor o a formularios descendientes existentes durante la inicialización; ambos limpian inmediatamente.
- Dinamismo: `MutationObserver(childList/subtree)` vuelve a ejecutar `bindInputs`; no registra submit/reset de subformularios añadidos posteriormente.
- Navegación: cada instancia agrega listener anónimo a `window.beforeunload`; no intercepta explícitamente transiciones SPA.
- API devuelta: `markClean`, `markDirty`, `isDirty`, `resetProtection`. No expone teardown ni desconexión del observer/listener.

### Pruebas y consumidores
- `runUXSuiteTests`, `js/ui-common.js:1869-1875`: UX-03 solo comprueba existencia de la función; no prueba comportamiento.
- Consumidores revisados: `js/api.js`, `js/student.js`, `js/teacher.js`, `js/secretary.js`, `js/accounting.js`; no se localizaron llamadas directas al helper. student.js conserva un beforeunload separado para cargas de archivos.

### Reconciliación
- T-UX-03 es el requisito inicial; T-UX-17 amplía la protección y está marcada [X] en completadas.md.
- AUD-NG-182/TASK-479 ya documenta la falta de snapshot, limpieza prematura, gestión dinámica, teardown y pruebas conductuales. Se revalidó TASK-479 en Pendientes.md y no se crea un duplicado.
- Dictamen T-UX-17: NO CUMPLE. Inspección estática/manual; no se ejecutaron navegador, DOM, guardado asíncrono, eventos cancelables ni suites.


## Componentes compartidos de formularios, tablas y detalle (T-UX-18, C1.61)

### Formularios
- `css/style.css` SHA `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`: tokens de color globales en líneas 1-34; estilos de controles `select` en 749-809; foco global en 996-1010. No hay clases comunes de campos, etiquetas, controles input/textarea ni errores de validación.
- Consumidores con estilos divergentes: `student-dashboard.html` SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1 (form profile 82-105, p-3); `teacher-dashboard.html` SHA cbb9e6a272a7d8ad33f99727303305d950533e71 (form tareas 219-278, p-3/font-medium); `js/accounting.js` SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7 (form kardex 124-158, p-2/text-xs); `dashboard-recursos-humanos.html` SHA 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee (form incidencias 190-258, p-2.5); `dashboard-secretaria.html` SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8 (form eventos 367-423, px-3 py-2/text-sm).
- Dependencias de mejora: `js/ui-common.js` para contrato/helper de campo; `css/style.css` para tokens/estados; consumidores HTML/JS de cada rol. T-UX-19 cubre semántica accesible; TASK-130 ayuda contextual; TASK-307 reglas de negocio de validación; TASK-430 sistema visual general.

### Tablas
- `window.renderPaginatedTable(containerId,data,options)`, `js/ui-common.js:1998-2069`: render local/remoto, `options.renderRow(item,index)`, fila vacía fija; sin API para loading/error/retry ni contrato de ID/acción. Callback remoto solo recibe página/tamaño.
- `window.setupAdvancedTableFilters(containerId,config)`, `js/ui-common.js:2129-2199`: filtros locales y persistencia de filtros guardados. Defectos adicionales ya asignados a AUD-NG-201/AUD-NG-202 y TASK-429.
- `window.renderUIProgressSkeleton`, `js/ui-common.js:5147-5165`; CSS skeleton `603-639`: mecanismo genérico separado, no conectado a estados del paginador.
- `css/style.css:413-436`: solo estilos base de contenedor/encabezados/celdas `.table-ima`.
- TASK-429 conserva el alcance de integración, estados, reintento, paginación, filtros y orden. TASK-486 mantiene snapshots/restauración de listas al navegar.

### Modal compartido de detalle
- `window.renderSharedDetailViewModal(config)`, `js/ui-common.js:5303-5365`: contrato actual `modalId/title/subtitle/badgeText/badgeColor/fields`; no procesa acciones ni callbacks. El comentario menciona acciones por fila, pero no hay implementación.
- Renderiza `title/subtitle/badgeText/badgeColor/fields.label/fields.value/modalId` mediante concatenación y `innerHTML` sin escape/allowlist. Riesgo latente de inyección si recibe valores no confiables.
- Llama `trackModalFocus()` (definida en 88-91), pero no mueve foco al diálogo ni restaura el foco al cerrar por botón/fondo. Cierre por Escape depende del listener global en 92-145.
- No se localizaron consumidores en los 20 módulos JS distintos de ui-common ni en las 13 páginas HTML de panel/entrada revisadas.
- Reconciliación: TASK-493 cubre implementación segura, acciones por registro, integración y pruebas; TASK-482 se limita a salida segura del Omnibox; TASK-486 a snapshot/restauración; T-UX-19 accesibilidad; TASK-484 framework de pruebas UX.

### Pruebas
- `runUXSuiteTests`, `js/ui-common.js:1843-1936`, cubre UX-01..UX-09; no tiene caso de T-UX-18.
- Suites `tests/regression/academic-grading-suite.js` y `tests/regression/modular-dashboard-suite.js` no referencian los componentes revisados.
- Inspección estática/manual; no se ejecutaron navegador/DOM, pruebas de foco, XSS ni validación de estados reales.


## Accesibilidad, teclado y semántica de controles (T-UX-19, C1.62)

### Núcleo compartido
- `js/ui-common.js` SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`:
  - `window.trackModalFocus` y listener Escape, líneas 87-143: referencia global única; los defectos de cobertura, pila de modales y restauración ya están en AUD-NG-181/TASK-258.
  - `window.runUXSuiteTests`, líneas 1843-1936: UX-02 solo comprueba existencia de trackModalFocus; no prueba teclado/foco ni conformidad WCAG.
  - `window.auditAndFixAccessibility`, líneas 5240-5299: recorre botones y enlaces role=button, asigna etiquetas heurísticas; no asocia labels/errors, no crea live announcer ni implementa focus trap. La lectura de icon.className.indexOf puede fallar cuando el icono es SVG (SVGAnimatedString). El fallback “Acción de interfaz” no identifica la acción concreta.
  - `window.renderSharedDetailViewModal`, líneas 5303-5365: role=dialog/aria-modal sin aria-labelledby, foco inicial ni confinamiento; su corrección está trazada en TASK-493.
- No se confirmó una invocación automática de auditAndFixAccessibility dentro de ui-common.js; no se certifica que el helper se ejecute en los flujos reales.

### CSS
- `css/style.css` SHA `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`, líneas 970-1050: existe estilo .skip-link, :focus-visible de 3 px, objetivos móviles de 44 px para un subconjunto de controles, estilos para [aria-live], media prefers-contrast:high y prefers-reduced-motion:reduce.
- No se encontró scroll-margin en la hoja; no se garantiza que el foco quede fuera de la cabecera fija.
- La regla de contraste usa `high`, no el valor `more` solicitado en TASK-258. No hay mediciones de contraste por tema ni pruebas con los colores reales.
- Los estilos [aria-live] no crean por sí mismos el contenedor persistente aria-live-announcer exigido por TASK-258.

### Vistas representativas y consumidores
- `index.html` SHA `cd742047cdc4948259dd721119429b04f78330ca`, líneas 25-60: Cursos/Contenido dependen de group-hover; aria-expanded permanece false en el marcado y no se observa apertura por foco. No hay skip link antes del header en el inicio del body.
- `student-dashboard.html` SHA `6379ea0ed39d71b89747a0280bb925fdf12202c1`, líneas 25-105: mismo menú dependiente de hover; botón close-profile-modal contiene SVG sin nombre accesible; labels del perfil no usan for ni envuelven los controles.
- `teacher-dashboard.html` SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`, líneas 25-60 y 219-278: menú equivalente dependiente de hover; formularios representativos no acreditan asociación label/control uniforme.
- `dashboard-recursos-humanos.html` SHA `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee`, líneas 185-230: varios controles de incidencia comienzan sin label visible asociado y dependen de placeholder/tipo; los labels de controles hermanos no usan for.
- `dashboard-secretaria.html` SHA `fa0d8c23aace24a6acab2d4956398a7f5e1309b8`: consultado como vista departamental adicional; no se ejecutó el flujo en navegador.

### Reconciliación
- AUD-NG-210 y AUD-NG-211 son hallazgos de T-UX-19.
- TASK-258 es la tarea correctiva transversal pendiente para foco, teclado, modales, ARIA live y preferencias de contraste/movimiento.
- AUD-NG-181 ya cubre Escape/restauración de foco; AUD-NG-169 cubre accesibilidad funcional de paneles académicos.
- TASK-492 cubre campos y coordina asociación semántica; TASK-493 cubre el modal de detalle; TASK-130 cubre ayudas/descripciones; TASK-484 cubre pruebas conductuales UX-01..UX-09.
- No crear una tarea nueva ni duplicar esos alcances. T-UX-19 no se considera satisfecha mientras TASK-258 y las dependencias pertinentes sigan sin evidencia de aceptación.

### Límites de verificación
- Inspección estática/manual de archivos y fragmentos citados.
- No se ejecutaron navegador/DOM, Tab/Shift+Tab, lectores de pantalla, pruebas de contraste, zoom ni pruebas de formularios/errores en ejecución.
- La cobertura de páginas fue representativa, no exhaustiva.

## Adaptación móvil y overlays responsivos (T-UX-20, C1.63)
- Especificación: T-UX-20 exige paneles sin superposiciones/desbordamientos críticos, menú lateral táctil y tablas con datos/acciones accesibles.
- js/ui-common.js (SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67):
  - initRoleNavigationMenu (4723-4755) inserta el botón móvil dentro del primer #main-header nav si existe. En nav.hidden.md:flex el disparador queda oculto por el padre en móvil; AUD-NG-194/TASK-483 ya lo cubren.
  - openMobileHamburgerDrawer (4760-4890) crea un overlay fixed/inset con panel w-80 y overflow-y-auto; no se establece un max-width relativo al viewport estrecho.
  - El inicializador se ejecuta diferido desde DOMContentLoaded (4917-4921).
- css/style.css (SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6):
  - .table-ima-container (413-436) ofrece scroll horizontal; no existe transformación compartida a tarjetas. TASK-429 ya lo exige.
  - .mobile-bottom-nav (443-459) es fixed, aparece en <=767px y tiene z-index:2100.
  - body usa overflow-x:hidden (67-78), lo que puede ocultar un desbordamiento en vez de resolver su causa.
  - La regla de 44px (1013-1021) solo alcanza botones, a.btn, input button/submit y select; no todos los enlaces/controles.
- Modales:
  - index.html SHA cd742047cdc4948259dd721119429b04f78330ca: profile-modal z-[70] (217-260); mobile-bottom-nav (301-324); news-detail-modal max-h-[90vh] y scroll interno (391-425).
  - student-dashboard.html SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1: profile-modal z-[60] (74-115), voucher-modal z-[70] (240-275), submission-modal z-[60] con max-h-[90vh]/overflow-y-auto (281-310), mobile-bottom-nav (327+).
  - La capa 2100 de la barra inferior supera los z-index 60/70/80 de varios diálogos. Los formularios profile/voucher no tienen límite de altura ni scroll interno; submission/news sí implementan un patrón de contención.
- Calendario: js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746 (1220-1249) solo persiste filtros de categorías; js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c (590-642) abre y envía un modal de evento. La revisión estática no acredita una interfaz calendario responsiva de extremo a extremo.
- Hallazgos nuevos: AUD-NG-212 (barra inferior por encima de modales) y AUD-NG-213 (modales largos sin max-height/scroll interno). TASK-494 cubre capas, scroll interno y pruebas en viewports; no duplica TASK-483/429/492/493/258/484.
- Límite: revisión estática/manual; no se ejecutaron pruebas reales de navegador, viewport, orientación, táctiles, stacking o scroll.

## Frescura de datos y estados de sincronización (T-UX-21, C1.64)
- T-UX-21 amplía T-UX-04 y queda cubierta por AUD-NG-183/TASK-480, que continúa pendiente.
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: renderDataFreshnessBadge abre en 5438 y cierra hasta 5789; las funciones openUserManagementAdministrationModal (5468) y openSecurityAndComplianceDashboardModal (5617) quedan anidadas en su cuerpo.
- El timestamp falsy se sustituye por la hora actual; fechas inválidas/futuras no se validan. El botón manual aparece aunque no haya callback; el callback trata solo success===false como fallo y puede aceptar undefined, usando la hora actual si no entrega timestamp. No se implementan claramente los cuatro estados ni timeout/exception robustos.
- Búsqueda estática de referencias: 15 archivos JS y 12 vistas HTML representativas; no se encontraron invocaciones externas del badge. Dirección (dashboard-direccion.html 188-198) y Secretaría (dashboard-secretaria.html 330-331) dependen de helpers globales que no se registran hasta invocar el badge.
- UX-04 (ui-common.js 1879-1885) es una comprobación nominal typeof, no una prueba conductual.
- No se crea tarea duplicada: TASK-480 ya cubre todas las correcciones y pruebas adicionales. No se modifica Pendientes.md.
- Verificación estática únicamente; no se ejecutaron navegador/DOM, red, Apps Script, sincronización real ni suites automatizadas.

## Indicador de conectividad y estado de servicios (T-UX-22, C1.65)
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: setupCommonUI (5+) crea/actualiza #online-status-badge en eventos online/offline (35-61); auto-inicialización (3490-3494). navigator.onLine true produce “Conexión Estable”; false produce “Sin Conexión (Modo Local)”. La primera afirmación excede lo que mide la API; la segunda debe diferenciar conectividad de capacidad offline real.
- El evento online dispara syncOfflineQueue, pero no confirma la sincronización ni prueba disponibilidad del backend.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: checkMicroserviceHealth (207-237) ejecuta ping por servicio; checkAllMicroservicesHealth (245-252) solo enumera USER/ACADEMIC/TASK/EXAM. El badge no consume estos resultados.
- UX-07 (ui-common.js 1902-1907) aprueba si existe el elemento O navigator.onLine es booleano; no simula eventos ni comprueba texto/estado. AUD-NG-187/TASK-484 ya cubre las pruebas conductuales.
- AUD-NG-144 cubre la integridad y cobertura del health check; TASK-484 pruebas; TASK-494 capas de overlays. Se crea AUD-NG-214/TASK-495 solo para semántica y separación de estados, sin duplicar.
- La presencia de usuario no se deriva de conectividad; no se encontró señal de presencia en el indicador. No mostrarla sin heartbeat/sesión verificable.
- Inspección estática; no se ejecutaron navegador, eventos reales ni health checks.

## Flujo de reportes y tickets de soporte (T-UX-23, C1.66)
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: initProblemReportingUI (3583+) crea el acceso global y los modales; openReportIssueModal abre form-report-issue; submitProblemReportForm (3768+) valida descripción/resultado esperado con trim y mínimo 20 caracteres y llama fetchApi('USER','submitProblemTicket',payload).
- El payload de envío no incluye sessionToken/authToken/token.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, fetchApi 39-58 solo agrega requesterUserId/requesterRole; no transmite credencial de sesión.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: validateRolePermission 1253-1294 llama getUserVerifiedRole y exige token antes de autorizar submitProblemTicket/getProblemTickets/replyProblemTicket; sin token, doPost rechaza antes de persistir.
- submitProblemTicket (400-468) tiene validación mínima y append a TicketsReporteProblemas/HistorialMensajesTickets, pero el flujo frontend no alcanza el handler por falta de token.
- AUD-NG-001 cubre propagación del token; AUD-NG-128 cubre identidad verificada/IDOR de tickets; TASK-484 cubre pruebas conductuales UX-08. No crear duplicados.
- UX-08 actual (ui-common.js 1912-1915) solo comprueba existencia de openReportIssueModal, no envío/persistencia.
- Inspección estática; no se ejecutaron navegador, Apps Script, HTTP ni escrituras productivas.

## Jerarquía de acciones y estados visuales (T-UX-24, C1.67)
- css/style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6 declara tokens semánticos primary/success/warning/danger/info y variantes .btn-ima-primary/cancel/danger/ghost (2-25, 284-348), pero el inventario de 12 vistas encuentra uso de btn-ima-* solo en student-dashboard.html y teacher-dashboard.html. Las otras vistas emplean clases Tailwind locales en botones equivalentes.
- No se encontraron clases compartidas alert/status/loading/empty; ui-common.js mezcla alert(), Swal.fire() y HTML/Tailwind ad hoc.
- Los estados de tickets no son homogéneos: renderMyTicketsList 3918-3923 y renderAdminTicketsUI 4121-4126 dan distinto tratamiento a “Información recibida” y “Se necesita información”.
- TASK-430 ya cubre el sistema visual general; se amplía con AUD-NG-215/T-UX-24. TASK-492 conserva estados de campos; TASK-493 modales de detalle; TASK-494 overlays; TASK-495 conectividad. No se crea una tarea duplicada.
- Inspección estática; no se ejecutaron capturas/navegador ni pruebas de contraste.

## Preferencias personales y personalización controlada (T-UX-25, C1.68)
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: loadUserSettingsInModal (1674-1700) carga solo notificaciones; renderRoleSettingsInModal (2214+) crea controles hardcodeados por rol sin persistencia; saveDashboardSettingsModal (2439-2498) guarda solo categorías/canal/frecuencia. No existe reset individual ni guardado de tema/layout/idioma/formato.
- El tab de identidad visual propone una paleta global sujeta a Dirección; no es preferencia individual.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: getUserSettings/saveUserSettings (7649-7735) persisten únicamente PreferenciasNotificacion; uiTheme se devuelve por defecto y no se lee/escribe. ROLE_PERMISSIONS (920-990) restringe get/save settings a Administrador/Desarrollador/Director, pese a que el modal ofrece la pestaña personal a otros roles.
- fetchApi no adjunta token (AUD-NG-001), por lo que el flujo de carga/guardado falla antes de llegar al handler hasta resolver esa dependencia.
- AUD-NG-202/TASK-429 ya cubre vistas guardadas de tablas con localStorage no aislado y configuración incompleta. TASK-422 cubre preferencias personales/herencia/reset; se amplía con AUD-NG-216. TASK-430 cubre identidad visual general.
- Inspección estática; no se ejecutaron sesiones multirol, persistencia en Sheets ni restauración entre dispositivos.

## Revalidación de actividad reciente contextual (T-UX-26, C1.69)
- El informe AUDITORIA_COMPLETADAS_T-UX-26.md ya existía; se revalida sin crear duplicados.
- js/ui-common.js mantiene SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, igual al del informe histórico. recordRecentActivity/getRecentActivity conservan una clave localStorage global sin authUserId/institucionId; getRecentActivity filtra por role/GLOBAL y exceptúa ADMIN/DIRECCION.
- renderContextualRecentActivity sigue insertando title/description con innerHTML; pasa targetId a switchActiveView, pero switchActiveView (4864-4902) no lo consume.
- AUD-NG-173 sigue pendiente. TASK-067 cubre aislamiento multiusuario; TASK-221 es la fuente de verdad para pendientes accionables. No crear tarea nueva.
- Revalidación estática; no se ejecutaron pruebas runtime.

## Revalidación de rendimiento percibido (T-UX-27, C1.70)
- js/ui-common.js y js/api.js conservan los mismos SHAs del informe histórico. renderUIProgressSkeleton permanece definido en ui-common.js:5147 sin consumidores; no hay métricas generales de operaciones UI.
- fetchApi mantiene timeout fijo 60 s e ignora options.timeout; no existe deduplicación concurrente general. PersistenceManager proporciona caché opcional, no coalescencia de peticiones en vuelo. Omnibox aplica debounce 300 ms.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683 no cubre T-UX-27.
- TASK-252 telemetría UI, TASK-429 skeleton/deduplicación segura y AUD-NG-007 timeout siguen pendientes. No crear duplicados.


## Revalidación de navegación y retorno entre vistas (C1.71)
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67:
  - handlePopState (281-385) procesa tipos específicos de estado, pero no {view,params}.
  - VIEW_STATES_CACHE/switchActiveView (4864-4902) guarda params del destino dentro de la vista saliente; solo restaura scrollTop y no consume cached.params.
  - initNoLoopHistoryManager (4904-4917) está definido, pero la evidencia histórica y los SHA sin cambios no acreditan inicialización ni resolución de hash directo.
  - Un viewId inexistente provoca retorno silencioso.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: pushNav/popNav limpian studentSearchInput; navStack/history.state no conservan snapshot explícito de búsqueda/filtros/orden/página/selección/scroll. El nivel Alumnos incorpora data.students a data y luego al estado de historial.
- student.js, accounting.js, secretary.js y los siete dashboards cotejados mantienen los SHA de T-UX-11; la navegación común no muestra integración nueva.
- Dependencias: AUD-NG-188/TASK-485 (router e historial), AUD-NG-189/TASK-486 (snapshot/restauración), TASK-429/T-UX-15 (estado de filtros/paginación), TASK-493 (detalle), AUD-NG-173 (targetId). No crear tareas duplicadas.
- La revisión es estática; no se ejecutaron pruebas de navegador, recarga, eventos reales ni sesiones multiusuario.


## Autenticación y autorización de los cinco microservicios (TAREA-F4-P0-01, C1.72)
- USER loginUser emite sessionToken, pero js/auth.js (SHA 8444dd085a3186106d2db7005b61ef934d3c22d8) no lo conserva y js/api.js (SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9) no lo transmite.
- Los cinco validateRolePermission consultan el token, pero aceptan cualquier acción declarada en PUBLIC_ACTIONS antes de verificarlo.
- USER: logoutUser público confía en userId/sessionId del payload y llama revokeUserSession sin autenticar el objetivo; posible revocación arbitraria. ACADEMIC: saveAdmissionDraft/getAdmissionDraft públicos seleccionan por emailResponsable/draftKey y permiten leer/modificar borradores sin prueba de propiedad. TASK/EXAM mantienen las consultas sensibles públicas cubiertas por AUD-NG-002.
- verifySessionToken no exige claims.exp presente/numérico en USER, ACADEMIC, ACCOUNTING, EXAM y TASK; AUD-NG-003 se amplía a todos.
- getAuthTokenSecret mantiene fallback derivado de SPREADSHEET_ID + cadena fija en los cinco servicios; AUD-NG-004 sigue vigente.
- Los nombres de rol no están normalizados en los validadores: USER/ACADEMIC/ACCOUNTING usan Director; TASK/EXAM usan Dirección; getDynamicPermissionsForRole usa matrix[role] literal. Reconciliar con TAREA-F4-P1-03/P1-04 y TASK-488.
- AUD-NG-001/002/003 existentes se amplían; AUD-NG-005 conserva el alcance de propagación de revocaciones. No crear IDs duplicados.
- Sin pruebas runtime ni acceso a deployments/Script Properties; revisión estática/manual.


## Aislamiento IDOR/ABAC de datos personales (TAREA-F4-P0-02, C1.73)
- USER: ROLE_PERMISSIONS Profesor permite getUserInfo, getGuardianStudents, getAdministrativeRequests y submitAdministrativeRequest; validateContextualAccess no valida asignaciones docentes. Los handlers aceptan IDs del payload, exponiendo perfiles, vínculos familiares y trámites fuera del ámbito del profesor. Nuevo AUD-NG-217/TASK-496.
- ACADEMIC: validateContextualAccess no valida vínculos Padre/Tutor/Responsable ni asignaciones Profesor; getAcademicHistory y getStudentEnrollmentHistory confían en estudianteId/userId del payload. Reutilizar AUD-NG-105 y ampliar AUD-NG-136.
- ACCOUNTING: validateContextualAccess solo restringe estudiantes; getStudentAccountStatement y getPaymentVouchers carecen de relación familiar, y la consulta sin userId puede devolver todos los comprobantes. AUD-NG-136.
- EXAM/TASK: getStudentExams/getStudentTasks permanecen en PUBLIC_ACTIONS y consumen userId/grado/sección del payload; AUD-NG-002.
- Dependencias comunes: claims verificados, ROLE_PERMISSIONS, validateContextualAccess, relaciones familiares activas, asignaciones docentes vigentes, matrículas y ámbito por grado/sección.
- Reconciliación: AUD-NG-002, 105, 106, 108, 128, 130 y 136; nuevo AUD-NG-217/TASK-496. TASK-105 conserva ciclo de vida de justificaciones.
- Sin pruebas runtime ni acceso a datos reales; revisión estática/manual.


## Revocación de sesiones y actualización de privilegios (TAREA-F4-P0-03, C1.74)
- USER revokeUserSession escribe revoked_user_/revoked_session_ solo en su ScriptCache. manageAccountState llama dispatchSecurityEvent sin implementación local encontrada; no hay propagación verificable.
- ACADEMIC/ACCOUNTING/EXAM/TASK implementan purgeSecurityCaches, pero la rama sessionId elimina revoked_session_ en vez de establecerla; SESSION_REVOKED sin accountState no crea revoked_user_.
- verifySessionToken conserva acct_state_ 60s. registerUser(forceUpdate) puede reactivar sin purgar. manageInstitutionalDataCache(FLUSH_GLOBAL) no elimina las claves globales.
- La matriz dynamic_permissions_matrix se cachea 600s en los cinco servicios; savePermissionMatrix invalida solo USER y los purgeSecurityCaches remotos eliminan claves diferentes. verifySessionToken no revalida el claim role vigente.
- handleLogout en ui-common.js solo limpia estado local; no llama logoutUser. handleSessionExpired no está conectado desde api.js; auth.js/api.js tampoco conservan/transmiten sessionToken.
- Hallazgos: AUD-NG-005, AUD-NG-159 y AUD-NG-160. Errata C1.72: logoutUser pertenece a AUD-NG-159, no a AUD-NG-002. No se crean IDs nuevos.

## Registro de dependencias - TAREA-F4-P0-04 (C1.75)
- backend/user-service/Code.gs:loginUser (2479-2554) -> Usuarios (columnas 11-13); valida estado, compara SHA-256, reinicia contador en éxito, incrementa contador por contraseña incorrecta y marca Bloqueada al llegar a cinco.
- USER:loginUser -> logStructuredEvent (327-352) -> LogsSistema. No se encontró llamada a recordTraceabilityLog ni registerAndDispatchEvent desde loginUser.
- USER:getSecurityAndComplianceDashboardData (4453-4545) -> BitacoraEventos; lee LOGIN_FAILED/LOGIN_SUCCESS desde row[2], por lo que no consume el registro LOGIN_FAILED/LOGIN_SUCCESS almacenado en LogsSistema por loginUser.
- USER:recordTraceabilityLog (4548-4573) -> BitacoraTrazabilidad; sin llamada desde loginUser. getPaginatedAuditLogReport (4243-4364) consulta BitacoraTraceability y usa un DTO distinto del productor registerAndDispatchEvent (4618-4698).
- USER:sanitizePayloadForLog (50-70) -> redacta claves de credenciales, pero no identifier/email/userId; logStructuredEvent (327-352) captura y suprime errores de escritura.
- USER:loginUser (2536-2545) -> contador por cuenta sin LockService; bloqueo directo en Usuarios!K al quinto intento. No se encontró ventana temporal, espera progresiva ni rate limit por origen confiable.
- Reconciliación: AUD-NG-145 (bitácoras, sanitización y trazabilidad); AUD-NG-005 (invalidación/propagación del bloqueo automático); AUD-NG-159 (logout/revocación). Nuevo AUD-NG-218/TASK-497 para atomicidad y antiabuso.
- Inspección estática/manual; sin pruebas runtime, concurrencia, HTTP ni persistencia real de Sheets.

## Registro de dependencias - TAREA-F4-P1-01 (C1.76)
- USER:createSecurityDelegation (1746-1800) -> DelegacionesSeguridad; persiste delegante, delegado, accionesAutorizadas, ambito, fechas y estado. Valida campos/rango, no autoridad por acción, usuario destino ni ámbito.
- USER:getSecurityDelegations (1803-1859) -> DelegacionesSeguridad; filtra por delegante/delegado/estado, marca Expirada al consultar; no invalida active_delegations_ y muestra fecha futura como Activa.
- USER:revokeSecurityDelegation (2276-2315) -> cambia estado y elimina active_delegations_<userId> solo del ScriptCache USER.
- USER:hasActiveDelegationForAction (1165-1210), ACADEMIC (624-669), ACCOUNTING (525-570) -> DelegacionesSeguridad; comparan userId + action + estado + fechas en cache miss; ignoran ambito; cache TTL 300s sin fechas para revalidar.
- USER/ACADEMIC/ACCOUNTING:validateRolePermission -> evalúa hasActiveDelegationForAction después de matriz dinámica; una delegación puede autorizar tras dynamicCheck=false.
- Cachés: create/revoke solo invalidan USER; ACADEMIC y ACCOUNTING mantienen ScriptCache independiente. Ampliar AUD-NG-160.
- js/ui-common.js (5467-5614, 5616-5750) -> modal de usuarios solo cambia estado; panel de seguridad muestra contador; sin llamadas a createSecurityDelegation/getSecurityDelegations/revokeSecurityDelegation.
- Reconciliación: AUD-NG-160 (vigencia/cachés); AUD-NG-217 y TAREA-F4-P1-04 (IDOR/ABAC); TASK-228/TASK-282/TASK-311 (delegaciones de workflow, distinto alcance). Nuevo AUD-NG-219/TASK-498.
- Observación diferida a TAREA-F4-P1-09: el panel envía statusFilter pero getSecurityDelegations espera estado; activeDelegationsCount puede incluir registros no activos.
- Inspección estática/manual; no pruebas runtime ni despliegues.

## Registro de dependencias - TAREA-F4-P1-02 (C1.77)
- USER:getRetentionPolicies (2120-2150) -> PoliticasRetencionDatos; crea AUDIT_LOGS, USER_SESSIONS, STUDENT_EXPEDIENTS, FINANCIAL_RECORDS, INACTIVE_USERS.
- USER:saveRetentionPolicy (2153-2200) -> PoliticasRetencionDatos; valida acción, no valida días enteros positivos ni restringe categorías.
- USER:executeDataRetentionPolicyCheck (2203-2273) -> BitacoraEventos y Usuarios. AUDIT_LOGS lee columnas incompatibles; USER_SESSIONS sin handler; STUDENT_EXPEDIENTS/FINANCIAL_RECORDS solo incrementan métricas; INACTIVE_USERS actualiza tres campos y usa failedAttempts como fecha fallback.
- USER:purgeStructuredLogs (7967-7989) -> LogsSistema; elimina todas las filas sin fecha de corte ni preservación legal (AUD-NG-145).
- ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc: sin motor ni invocación; versionado documental no es retención por política.
- ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28: sin motor ni invocación; archivado de plantillas no es retención financiera.
- Triggers: no se encontraron ScriptApp.newTrigger/timeBased en USER, ACADEMIC ni ACCOUNTING.
- Reconciliación: AUD-NG-145 (logs), AUD-NG-146/TASK-499 (retención/archivo), AUD-NG-220/TASK-500 (anonimización productiva), TASK-081 (datos de prueba), TASK-398/TASK-456 (archivo trámites/documentos).


## Dependencias TAREA-F4-P1-03 C1.78
- USER:getPermissionMatrix (1902-1932) y savePermissionMatrix (1934-1985) -> MatrizPermisosRoles; upsert por rol+acción, aunque guarda modulo/ambito.
- USER/ACADEMIC/ACCOUNTING/TASK/EXAM:getDynamicPermissionsForRole -> cache dynamic_permissions_matrix TTL 600; usa columnas rol/acción/permitido, ignora modulo/ambito.
- purgeSecurityCaches de servicios no USER elimina perm_matrix_<role>/dynamic_perms_<role>, no dynamic_permissions_matrix (AUD-NG-160).
- ui-common.js, developer.js y 11 dashboards revisados sin editor/llamadas de matriz.
- AUD-NG-221/TASK-501: dimensiones y UI; AUD-NG-160: cache; TASK-139: permisos documentales; AUD-NG-094: informes; P1-04: RBAC/ABAC general.

## Registro de dependencias - TAREA-F4-P1-04 (C1.79)
- USER: validateRolePermission (1253-1295) llama validateContextualAccess (1213-1250), que solo cubre estudiante propio y familiar si targetStudentId viene en payload; no valida ámbito docente. validateRoleScopeAccess (9222-9248) es una acción aislada y no está integrada en el validador central. getGuardianStudents (3480-3580) usa permisos predeterminados true si falta el JSON de permisos.
- ACADEMIC: validateRolePermission (524-583) llama validateContextualAccess (465-521). La consulta a AsignacionesAmbitosRoles depende de scopeType+requestedValue aportados por cliente; ausencia de hoja/datos y errores capturados no producen denegación. La comprobación de Coordinador compara areaId, no ambitoSupervision (getAcademicAreaCoordinationScope 4321-4349).
- ACCOUNTING: validateRolePermission (434-483) llama validateContextualAccess (418-431), sin vínculo familiar ni asignación docente; los handlers de estado de cuenta/comprobantes confían en userId del payload para otros roles.
- TASK: validateRolePermission (225-280) llama validateContextualAccess (209-223), sin reglas familiares/docentes/ámbito; getStudentTasks (613-690) además permanece dentro del alcance de AUD-NG-002 por PUBLIC_ACTIONS.
- EXAM: validateRolePermission (207-256) llama validateContextualAccess (191-205), sin reglas familiares/docentes/ámbito; getStudentExams (1057-1104) permanece dentro de AUD-NG-002 por PUBLIC_ACTIONS.
- No hay motor común ni política fail-closed transversal. Reconciliar con AUD-NG-105/106/108/128/130/136/217 y AUD-NG-002; nuevo AUD-NG-222/TASK-502 para la brecha sistémica sin duplicar las exposiciones concretas.

## Registro de dependencias - TAREA-F4-P1-05 (C1.80)
- USER: doPost (1351-1405) -> validateRolePermission (1253-1295) -> submitPrivacyRightsRequest (1986-2025), getPrivacyRightsRequests (2028-2072), updatePrivacyRightsRequestStatus (2075-2117). Los dos primeros están en la lista de autorización temprana de validateRolePermission (1259); sus handlers revalidan sesión con getUserVerifiedRole (1146-1162). El tercero exige Administrador/Desarrollador en handler.
- SolicitudesDerechosPrivacidad almacena solicitudId, userId, tipoDerecho, motivo, detalles, estado, respuestaAdmin, atendidoPor, fechaSolicitud y fechaRespuesta. No modela titular representado, evidencia, plazo, responsable, decisión motivada, datos afectados ni resultado ejecutado.
- updatePrivacyRightsRequestStatus actualiza estado y metadatos; no ejecuta la operación ARCO ni valida una máquina de estados/transición.
- js/ui-common.js (SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67) y los scripts/páginas de dashboards revisados no contienen llamadas ni UI ARCO. politica-de-privacidad.html (SHA 8854bae3021e1cdde288709e3fa411b3d6da20c7) solo registra aceptación de DOC-PRIV mediante ACCOUNTING; no conecta el módulo de derechos.
- La afirmación de retención automatizada en la política se reconcilia con AUD-NG-146/TASK-499 y AUD-NG-220/TASK-500; no duplicar. Nuevo AUD-NG-223/TASK-503 para ausencia de panel y ejecución end-to-end de derechos ARCO.


## Registro de dependencias - TAREA-F4-P1-06 (C1.81)
- USER: doPost -> validateRolePermission -> getEntityAuditHistory (2745-2798); recordEntityChangeLog (2715-2742) persiste HistorialCambiosEntidad con esquema USER de nueve columnas.
- ACADEMIC: recordEntityChangeLog (1568-1592) persiste la misma hoja con orden distinto; updateAdmissionStatus/reopenAdmissionRequest (2022-2024, 2094-2096), movimientos de expediente (11211, 11729, 11798, 11850, 11999, 12059) lo invocan. resolveAdmissionDuplicate, unmergeStudentFiles y getStudentFileAdministrativeReports realizan escrituras directas de ocho columnas (10138-10149, 10286-10297, 10399-10410).
- USER/getEntityAuditHistory interpreta row[1]/row[2] como entityType/entityId; ACADEMIC escribe fecha/tipo en esas posiciones. js/secretary.js/loadAdmissionAuditTrail (1185-1225) solicita SolicitudAdmision y no puede reconstruir filas del esquema ACADEMIC.
- ACADEMIC/getAcademicPlanningAuditLogs (13705-13735) también usa índices incompatibles. No hay contrato/versión de esquema compartido ni migración de filas antiguas.
- Ambos recordEntityChangeLog silencian fallos de escritura; USER redacciona solo claves de credenciales y ACADEMIC no sanitiza. Ampliar AUD-NG-145 por exposición de PII; no duplicar.
- HistorialCambiosEntidad carece de secuencia/hash/verificación general. verifyWorkflowDecisionAuditChain solo cubre RevisionesDecisionesTramite (TASK-049).
- getEntityAuditHistory no tiene paginación por cursor ni máximo validado; además, su handler permite Secretaría/Director pero esos roles no tienen permiso estático para la acción, que depende de una concesión dinámica no verificada.
- BitacoraEventos y BitacoraTrazabilidad conservan los defectos de instrumentación, esquema y DTO ya registrados en AUD-NG-145; no duplicar.
- Nuevo AUD-NG-224/TASK-504: unificar esquema y escritor, migrar datos históricos, registrar actor/correlationId verificados, integrar versionado e integridad verificable, fallar explícitamente ante errores de auditoría, sanitizar PII, asegurar permisos/paginación y probar USER/ACADEMIC/UI.


## Registro de dependencias - TAREA-F4-P1-07 (C1.82)

### USER: estructura organizativa, adscripciones y responsabilidades
- `doPost` (1351-1420) -> `validateRolePermission` (1253-1295) -> `manageDepartmentPositions` (2801-2894) / `getUserInstitutionalAffiliations` (2894-2934).
- `manageDepartmentPositions` -> `CatalogoDepartamentos`, `CatalogoCargos`, `Usuarios`, `HistorialAdscripciones`, `generateInstitutionalId` (1706-1746), `invalidateUserRoleCache` (143-156), `recordEntityChangeLog`, `logStructuredEvent`.
- `getUserInstitutionalAffiliations` -> `HistorialAdscripciones`; lee todas las filas y proyecta historial por userId.
- `manageInternalRoleCatalog` (9631-9728) / `getInternalRoleCatalog` (9730-9765) -> `CatalogoRolesInternos`.
- `assignRoleScope` (9117-9181) -> `AsignacionesAmbitosRoles`; recibe roleId/rolId, scopeType, scopeValues, fechas y suplencia. No valida FK contra CatalogoRolesInternos; upsert por userId+scopeType.
- `getUserScopeConfig` (9183-9220), `validateRoleScopeAccess` (9222-9251) y `getInternalRoleAssignments` (9767-9807) -> `AsignacionesAmbitosRoles`; filtros temporales no son uniformes.
- `getDynamicPermissionsForRole` (1863-1898) -> `MatrizPermisosRoles`; la ruta de autorización es `getUserVerifiedRole` (1146-1162) -> `validateRolePermission`. La ausencia de acciones en ROLE_PERMISSIONS y la dependencia de la matriz dinámica se reconcilian con AUD-NG-221/222.
- `getUserDynamicDashboardConfig` (9254-9304) -> `Usuarios`; lee el índice 3 como rol aunque el encabezado de Usuarios define Rol en índice 6. `js/ui-common.js:5818-5863` lo consume y genera tarjetas cuyo “Acceder” no tiene destino/listener.

### ACADEMIC: jefaturas y estructura académica
- `assignDepartmentHead` (7282-7306) -> `DepartamentosAcademicos`; `getDepartmentAcademicPlanning` (7308-7355) consume la misma hoja y relaciona ofertas/asignaciones docentes.
- `DepartamentosAcademicos` es un modelo separado de `CatalogoDepartamentos`; no se encontró un identificador de enlace entre ambos.
- `assignTeacherToAcademicArea` (14048-14193) -> `DocentesAreasAcademicas` y `CoordinacionesArea`; las consultas/bajas relacionadas están en 14195-14316. Esta asignación académica se mantiene separada de la adscripción laboral y de los hallazgos de historial AUD-NG-018.

### UI y pruebas
- `dashboard-recursos-humanos.html:981-1013` crea expediente mediante ACCOUNTING y solicita puesto/departamento como texto libre; no invoca USER/manageDepartmentPositions ni getUserInstitutionalAffiliations.
- Dashboards de Dirección, Coordinación y Secretaría revisados no contienen llamadas a esos endpoints ni a assignRoleScope.
- `tests/regression/academic-grading-suite.js:119-124` valida existencia de símbolos de TASK-004; no prueba integridad, vigencias, concurrencia ni persistencia.

### Reconciliación de dependencias
- AUD-NG-225/TASK-505: vínculo CatalogoRolesInternos -> AsignacionesAmbitosRoles, vigencias y administración UI.
- AUD-NG-226/TASK-506: integridad referencial/atomicidad de CatalogoDepartamentos, CatalogoCargos y HistorialAdscripciones.
- No duplicar TASK-171 (ciclos jerárquicos), TASK-365 (organigrama visual), TASK-006/AUD-NG-017 (offboarding), AUD-NG-018 (historial de asignaciones docentes), AUD-NG-221/222 (matriz y ABAC), AUD-NG-145/224 (bitácoras/versionado).


## Registro de dependencias - TAREA-F4-P1-08 (C1.83)

### USER: productor y router de cambios de seguridad
- `doPost` (1351-1620) enruta `purgeSecurityCaches`, `dispatchSecurityEvent`, `processSecurityEventQueue` y `getSecurityEventsQueue` (1463-1466); no se localizaron definiciones locales de esos handlers en USER.
- `manageAccountState` (2342-2386) -> `Usuarios` columna 11 -> `recordEntityChangeLog` -> llamada a `dispatchSecurityEvent` (2373-2379). La llamada ocurre después de persistir; la referencia no resuelta cae en el catch de `doPost` (1606-1617), sin rollback.
- `revokeUserSession` (2318-2330) -> ScriptCache USER: `revoked_user_<id>`, `revoked_session_<id>`; no se encontró despacho interservicio.
- `loginUser` (2470-2546) escribe bloqueo automático en Usuarios!K al quinto intento (2542-2545), sin llamar a `manageAccountState` ni a un evento de seguridad.
- `invalidateUserRoleCache` (143-153) elimina `user_role_<id>` y `acct_state_<id>` solo en el ScriptCache local.
- `manageInstitutionalDataCache` (155-180): INVALIDATE_USER actúa localmente; FLUSH_GLOBAL solo registra el pedido y responde success, no elimina claves.
- `savePermissionMatrix` (1934-1980) elimina `dynamic_permissions_matrix` solo en USER; `revokeSecurityDelegation` (2276-2315) elimina `active_delegations_<id>` solo en USER.

### ACADEMIC / ACCOUNTING / TASK / EXAM: consumidores y purgadores locales
- Los cinco validadores funcionales (USER/ACADEMIC/ACCOUNTING/TASK/EXAM) consultan `revoked_user_<id>`, `revoked_session_<id>` y `acct_state_<id>` en sus ScriptCache independientes. SHAs: USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING 38b979d41596b85e888b4a7060b37bbac0840a28; TASK 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM 1d93296628fae31f680004f637897e2b1314a64c.
- `purgeSecurityCaches` existe solo en ACADEMIC (3702-3743), ACCOUNTING (10200-10241), TASK (1919-1959) y EXAM (948-987); cada implementación opera sobre el ScriptCache local.
- Los cuatro purgadores eliminan `revoked_session_<id>` en lugar de establecer la marca; el validador lee esa misma clave para rechazar la sesión. Con `SESSION_REVOKED` y sessionId pueden borrar la revocación.
- Los cuatro purgadores eliminan `delegations_<id>`, pero los validadores consultan `active_delegations_<id>`. Eliminan `perm_matrix_<role>` y `dynamic_perms_<role>`, pero los cinco validadores consumen `dynamic_permissions_matrix`.
- No se encontró llamada interna desde los servicios a un dispatcher central ni productor de evento de seguridad; la existencia de un handler local no demuestra fan-out ni acuse de recibo.

### DEVELOPER: plano de control
- `backend/developer-service/Code.gs` SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: `verifySessionToken` (115-147) verifica firma y expiración, pero no consulta marcadores de revocación ni estado de cuenta; no tiene `purgeSecurityCaches`, dispatcher ni consumidor de eventos de seguridad.
- Su `doPost` (153-210) valida permisos locales por rol, pero no participa en la propagación/confirmación de cambios de estado o revocación.

### Cola general frente a cola de seguridad
- USER `registerAndDispatchEvent` (4618-4694) y `retryFailedEventsQueue` (4700-4759) procesan eventos de notificación; no implementan `dispatchSecurityEvent`, `processSecurityEventQueue` ni `getSecurityEventsQueue`.
- AUD-NG-176/TASK-474 mantiene la cola general, persistencia, idempotencia y reintentos de notificaciones. AUD-NG-005 mantiene la propagación/revocación de seguridad. No fusionar ni duplicar alcances.

### Reconciliación
- AUD-NG-005: se amplía por handlers ausentes, estado parcial, revocación no propagada, purgadores que borran marcas y cobertura del servicio DEVELOPER.
- AUD-NG-160: se amplía por claves de caché incompatibles y falta de invalidación de matriz/delegaciones entre servicios.
- AUD-NG-219/TASK-498: autoridad, ámbito y cadenas de delegación; AUD-NG-221/TASK-501: dimensiones de matriz; AUD-NG-222/TASK-502: ABAC común; AUD-NG-176/TASK-474: cola general de notificaciones. No se crean IDs nuevos.


## Registro de dependencias - TAREA-F4-P1-09 (C1.84)

### Dashboard de Dirección y punto de entrada
- `dashboard-direccion.html:46` declara `btn-security-compliance-dashboard`; el bloque de integración (aprox. 175-205) llama `window.openSecurityAndComplianceDashboardModal`.
- `js/ui-common.js:5616-5760` crea el modal, filtros de fecha/usuario/tipo, cuatro tarjetas KPI y tabla de eventos.
- La UI solo invoca `fetchApi("getSecurityAndComplianceDashboardData", ...)` (5715-5720); no consume `generatePrivilegeAndAccountAuditReport` ni `getPaginatedAuditLogReport`.

### USER: contratos y datos del panel
- `getSecurityAndComplianceDashboardData` (4454-4540) lee `BitacoraEventos`, construye eventsList filtrado y limita la respuesta a 200 eventos.
- Los contadores failedLogins/successfulLogins/revokedSessions se incrementan fuera del filtro de fecha/usuario/tipo; las tarjetas no reflejan el subconjunto de la tabla.
- El backend retorna `activeDelegations` y `healthReport`, pero la UI no los representa.
- La llamada interna `getSecurityDelegations({statusFilter:"ACTIVA"})` no reenvía el token. `getSecurityDelegations` exige `sessionToken/authToken/token`, deriva callerId de `_verifiedUserId` y lee `estado`; por ello la consulta interna no hereda la identidad de Director y no filtra por el parámetro esperado.
- `generatePrivilegeAndAccountAuditReport` (4372-4453) produce resumen y listas de cuentas privilegiadas/inactivas; el panel no lo solicita.
- `getPaginatedAuditLogReport` (4243-4369) existe y está en el router, pero el panel no lo solicita ni ofrece paginación.
- `getOperationalCapacityMetrics` se llama desde el endpoint y su resultado se devuelve como healthReport, pero la UI lo ignora.

### Fuentes de logs y trazabilidad (reconciliación)
- `logStructuredEvent` (329-352) escribe en `LogsSistema`; `loginUser` (aprox. 2470-2555) registra LOGIN_FAILED/LOGIN_SUCCESS mediante ese helper.
- `getSecurityAndComplianceDashboardData` lee `BitacoraEventos`; la desconexión de fuentes y los contadores de login ya están documentados en AUD-NG-145 (ampliación C1.75).
- `registerAndDispatchEvent` (4618-4694) escribe BitacoraEventos con esquema EventID/TipoEvento/ServicioOrigen/RequestIDOrigen/DestinatarioID/DatosJSON/Estado/Intentos/UltimoIntentoFecha/ErrorDetalle; el lector del panel/reportes interpreta otras posiciones. AUD-NG-145 conserva este desajuste.
- `recordTraceabilityLog` escribe `BitacoraTrazabilidad`; `getPaginatedAuditLogReport` consulta `BitacoraTraceability`. AUD-NG-145 conserva el nombre y DTO incompatibles.
- El modal interpola datos de eventos y err.message en `innerHTML` (aprox. 5740-5755). AUD-NG-145 se amplía por el renderizado sin escape contextual.

### Reconciliación de hallazgos
- AUD-NG-145: fuentes, esquema, DTO, sanitización y renderizado seguro de bitácoras.
- AUD-NG-219/TASK-498: autoridad, ámbito y ciclo de vida de delegaciones; se amplía por el contexto autenticado perdido en el contador.
- AUD-NG-160: cachés de permisos/delegaciones; no se duplica.
- AUD-NG-227/TASK-507: consistencia de KPI, paginación visible, integración de reportes y salud, y composición del panel. No reimplementa los contratos de log ni el motor de delegaciones.


## Registro de dependencias - TAREA-F4-P2-01 (C1.85)

### Identificador de usuario en USER
- \`registerUser\` (backend/user-service/Code.gs 2393-2450) genera el UserId mediante \`generateInstitutionalId({entityType:"Usuario",prefix:"USR-"})\`; si no recibe generatedId, lanza error y no utiliza timestamp.
- \`generateInstitutionalId\` (USER 1706-1746) actualiza SecuenciasIDs bajo ScriptLock del proyecto USER. La creación inicial de la hoja ocurre antes del lock.
- \`createPerson\` (USER 1663-1687) genera PER-ID con timestamp; representa PersonaID, no UserId, y queda fuera del alcance.

### Generación de UserId desde ACADEMIC
- \`convertAdmissionToStudent\` (ACADEMIC 2156-2390) adquiere un lock exterior y genera UserId en 2238-2239 llamando a su propia copia de \`generateInstitutionalId\` con \`skipLock:true\`.
- El flujo de conversión mantiene el lock exterior de ACADEMIC; sin embargo, ese lock no coordina con el ScriptLock independiente del proyecto USER.
- ACADEMIC utiliza fallback constante \`USR-000001\` si no se proporciona userId y el generador no devuelve generatedId.
- Los generadores USER y ACADEMIC escriben en SecuenciasIDs, pero los ScriptLock pertenecen a proyectos Apps Script distintos; no constituyen un lock distribuido.

### Reconciliación
- AUD-NG-161 conserva generadores duplicados, alcance local de locks, bypasses y necesidad de pruebas conductuales de colisión/concurrencia.
- TASK-118 conserva el seguimiento histórico del modelo institucional de identificadores.
- TAREA-F4-P2-01 cumple parcialmente: el fallback temporal se eliminó de registerUser, pero no se certifica unicidad global ni pruebas runtime.
- No duplicar AUD-NG-161 ni crear IDs nuevos.


## C1.86 — TAREA-F4-P2-02: ciclo de vida de cuentas y sesiones

- USER/loginUser emite sessionToken (24h), pero js/auth.js no conserva data.sessionToken y js/api.js no lo adjunta al cuerpo de fetchApi. AUD-NG-001.
- USER/logoutUser permanece en PUBLIC_ACTIONS; acepta userId/sessionId del payload y no fuerza que coincidan con claims verificados. ui-common.js/handleLogout solo limpia almacenamiento local y redirige, sin logout remoto. AUD-NG-159.
- USER/revokeUserSession escribe revoked_user_*/revoked_session_* con TTL 21600s (6h), inferior a la expiración de 24h del token. Si el marcador expira y la cuenta sigue Activa, el token puede seguir vigente. AUD-NG-005.
- loginUser permite autenticación de cuentas Pendiente/InvitacionEnviada, pero verifySessionToken exige estado Activa. AUD-NG-005.
- manageAccountState escribe Usuarios!K y registra el cambio antes de invocar dispatchSecurityEvent; no se encontró definición local en el único archivo backend/user-service/Code.gs versionado. La propagación no queda confirmada tras la mutación. AUD-NG-005.
- Reconciliación: AUD-NG-001, AUD-NG-005 y AUD-NG-159; no crear IDs duplicados. AUD-NG-160 (rol/cachés) y AUD-NG-006 (reintentos/idempotencia) conservan límites separados.
- Evidencia C1.86: USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; auth.js 8444dd085a3186106d2db7005b61ef934d3c22d8; api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; ui-common.js 986938b8a311a41ed4cb3d135b66b6aaea4bed67. Sin cambios de código.


## C1.87 — TAREA-F4-P2-03: interfaz administrativa de usuarios, permisos y delegaciones

- `window.openUserManagementAdministrationModal` permanece anidada dentro de `window.renderDataFreshnessBadge` (ui-common.js 5438-5789). Los dashboards Dirección (39, 185-190) y Secretaría (35, 327-332) no invocan el badge; sus botones no encuentran el helper en la carga normal. Ya cubierto por TASK-480/AUD-NG-183.
- Las llamadas del modal `fetchApi("getStudents", payload, "USER")` y `fetchApi("manageAccountState", payload, "USER")` invierten la firma `fetchApi(service, action, payload)`. SERVICE_URLS solo define claves de servicio (USER, ACADEMIC, TASK, EXAM, etc.); el helper devuelve error de configuración antes de llamar al backend. Nuevo AUD-NG-228/TASK-508.
- USER/getStudents (2556-2558) ignora filtros y devuelve solo userId/nombre/numeroLista para estudiantes no desactivados; no devuelve correo/rol/estadoCuenta. La UI presenta defaults y no puede representar ni administrar el universo de cuentas declarado.
- La vista no contiene flujos de consulta/edición de permisos efectivos ni de creación/listado/revocación de delegaciones. Reconciliar con AUD-NG-221/TASK-501 y AUD-NG-219/TASK-498; no crear duplicados.
- `tbody.innerHTML` interpola nombre/ID sin escape contextual. Riesgo condicional; requiere DOM seguro y pruebas, sin afirmar explotación demostrada.
- Evidencia: ui-common.js 986938b8a311a41ed4cb3d135b66b6aaea4bed67; api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; config.js 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc; USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; dashboard-direccion fefaa3bf7884288aef563cfb8aaf244e6cea8b7c; dashboard-secretaria fa0d8c23aace24a6acab2d4956398a7f5e1309b8.


## C1.88 — TAREA-F4-P2-04: concurrencia y consistencia de identidad

- El changelog afirma LockService en cuatro operaciones USER. Código: createSecurityDelegation (1761-1798) y manageAccountState (2349-2386) sí adquieren ScriptLock; revokeSecurityDelegation (2276-2314) y updateUserProfile (2654-2695) no.
- updateUserProfile lee una fila completa de Usuarios, modifica copia y reescribe con setValues sin lock/versionado: dos actualizaciones paralelas pueden sobrescribirse. Nuevo AUD-NG-229/TASK-509.
- getSecurityDelegations (1803-1859) cambia estado Activa a Expirada con setValue sin lock; revokeSecurityDelegation tampoco bloquea. Reconciliar AUD-NG-219/TASK-498.
- createSecurityDelegation mantiene ScriptLock y llama generateInstitutionalId, que adquiere ScriptLock. manageAccountState mantiene ScriptLock y llama recordEntityChangeLog, que también llama generateInstitutionalId. Posible adquisición anidada, sin confirmar runtime; ampliar TASK-118.
- generateInstitutionalId inicializa hoja/encabezados SecuenciasIDs antes de adquirir lock. TASK-118.
- registerUser mantiene check-email y append fuera de una sección crítica única; ya cubierto por TASK-118. loginUser counter sin lock cubierto por AUD-NG-218. Tests reales de concurrencia cubiertos por AUD-NG-161.
- Evidencia: USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; tests 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.


## C1.89 — TAREA-F4-P2-05: documentación institucional de privacidad

- La política de privacidad declara 180 días de AUDIT_LOGS, 30 días de USER_SESSIONS, anonimización tras 730 días, y conservación permanente de expedientes académicos/financieros. La política de uso repite 6 meses para logs y permanencia de expedientes/finanzas; política financiera también afirma permanencia.
- USER defaults: AUDIT_LOGS 365 días; USER_SESSIONS 90; STUDENT_EXPEDIENTS 3650 (10 años); FINANCIAL_RECORDS 2555 (7 años); INACTIVE_USERS 730. La hoja productiva PoliticasRetencionDatos no está disponible en el repo.
- executeDataRetentionPolicyCheck no procesa USER_SESSIONS; los expedientes/finanzas solo incrementan itemsArchived sin archivar. No se encontraron triggers time-based en USER/ACADEMIC/ACCOUNTING. AUD-NG-146/TASK-499.
- La purga AUDIT_LOGS usa columnas incompatibles con BitacoraEventos y purgeStructuredLogs borra todas las filas LogsSistema sin aplicar plazos/preservación. AUD-NG-145.
- INACTIVE_USERS usa failedAttempts como fallback de lastAccess; solo cambia nombre/email/teléfono, conserva IDs/relaciones y no aplica legal hold. AUD-NG-220/TASK-500.
- La política promete módulo ARCO, pero USER solo registra solicitudes/actualiza estado; no hay UI ni ejecución efectiva. AUD-NG-223/TASK-503.
- RBAC/ABAC se afirma como riguroso, pero los validadores siguen divergentes/fail-open. AUD-NG-222/TASK-502.
- No se crean IDs nuevos. Evidencia: privacy 8854bae3021e1cdde288709e3fa411b3d6da20c7; usage ca252904e9f7ad7301d1793ed07585a92a4c060f; financial bb75dc6b72098b825a18025781346b4252fe33cf; USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f.


## C1.90 — TAREA-F4-P3-01: informes periódicos de privilegios y cuentas

- USER.generatePrivilegeAndAccountAuditReport (4372-4440) calcula cuentas privilegiadas, inactivas/estancadas y delegaciones, registra un evento y devuelve JSON. No persiste el informe ni registra revisión/decisión.
- No se encontraron triggers ScriptApp.newTrigger/timeBased ni llamadas frontend en developer.js, ui-common.js, dashboard-direccion o dashboard-secretaria. No hay periodicidad demostrada.
- La función llama getSecurityDelegations({statusFilter:"ACTIVA"}) sin token/_verifiedUserId; el handler requiere identidad verificada y espera el campo estado. El conteo de delegaciones vigentes resulta 0. AUD-NG-219.
- La acción no es pública: Director; Administrador/Desarrollador por wildcard; doPost valida permisos. 
- No hay pruebas específicas del reporte ni de su automatización. AUD-NG-161.
- Nuevo AUD-NG-230/TASK-510 para scheduler, persistencia/entrega, evidencia de revisión y conteo correcto.
- Evidencia USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; developer.js 6fa4c4bd9be580c974b1fbede4f0cf79485dc331; ui-common 986938b8a311a41ed4cb3d135b66b6aaea4bed67; dashboards fefaa3bf7884288aef563cfb8aaf244e6cea8b7c/fa0d8c23aace24a6acab2d4956398a7f5e1309b8.


## C1.91 — TAREA-F4-P3-02: informes de auditoría y diagnóstico

- getPaginatedAuditLogReport (USER 4243-4364) mapea BitacoraEventos con índices incompatibles con registerAndDispatchEvent (4618-4690): row[1] se trata como fecha aunque es TipoEvento, row[2] como tipo aunque es ServicioOrigen, row[9] como correlación aunque es ErrorDetalle. AUD-NG-145.
- El lector consulta BitacoraTraceability, pero recordTraceabilityLog escribe BitacoraTrazabilidad (4548-4573). AUD-NG-145.
- La paginación carga ambas hojas completas y ordena allLogs antes de slice. El dashboard Developer llama getStructuredLogs, no getPaginatedAuditLogReport; además envía severidad/servicio/limit, mientras backend espera severity/startDate/endDate, no filtra servicio y devuelve fijo hasta 500. AUD-NG-145.
- Sin pruebas específicas en tests/regression. AUD-NG-161.
- No se crean IDs nuevos. Evidencia USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; developer.js 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.


## C1.92 — TAREA-F4-P3-03: reconciliación de inconsistencias de identidad

- auditAndReconcileIdentityInconsistencies (USER 4151-4235) construye validUserIds vacío si Usuarios falta o solo tiene encabezado. Con autoFix truthy, marca todas las delegaciones y adscripciones activas como huérfanas y las cambia a Revocada/Inactiva. No exige autoFix === true.
- No adquiere LockService, no prevalida todo el lote ni tiene rollback; registra solo issuesCount/fixedCount, no cada ID/estado anterior/nuevo/actor/motivo.
- La revocación directa de DelegacionesSeguridad no invalida active_delegations_<delegadoId>; se amplía AUD-NG-219.
- Adscripciones: solo valida userId; no verifica deptId/cargoId contra CatalogoDepartamentos/CatalogoCargos.
- Nuevo AUD-NG-231/TASK-511 para autoFix fail-safe/atómico/auditable. AUD-NG-161 para pruebas.
- Evidencia USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; tests 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.


## C1.96 — TAREA-F5-001: conversión de aspirantes y expediente

- createAdmissionRequest es pública (Academic PUBLIC_ACTIONS 265). convertAdmissionToStudent vincula por email y crea relación Verificada sin token; getGuardianStudents confía en ese estado. La ruta createLinkInvitation/acceptLinkInvitation se evita para cuenta existente; invitación de cuenta nueva se guarda sin notificación. AUD-NG-036.
- Solicitud se marca Convertida antes de matrícula/cargos/movimiento; sin rollback, recuperación ni estado por etapa; errores de migración documental son warning y success. Nuevo AUD-NG-232/TASK-512.
- allowIncompleteOverride/forceCapacityOverride provienen del payload y usan truthiness; "false" activa bypass. No hay directiva ALLOW_INCOMPLETE_ADMISSION_CONVERSION; documentos ausentes pasan; sin OfertaAcademica se inventa capacidad 35/Activa; lock timeout no aborta. Nuevo AUD-NG-233/TASK-513.
- PersonaID/UserId no se crean/validan en Personas/Usuarios; fallbacks constantes y IDs MAT/CRG timestamp/aleatorios; TASK-118.
- Monto de matrícula fallback 1500; registerStudentEnrollment expuesta a Contador y otros roles sin check de cupos, y writes de matrícula/cargos separados; AUD-NG-129.
- Sin pruebas específicas de conversión/recuperación/overrides/tutor/capacidad; AUD-NG-161. checkEnrollmentCapacity lock timeout AUD-NG-179.
- Evidencia ACADEMIC daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACCOUNTING 38b979d41596b85e888b4a7060b37bbac0840a28; tests 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.


## C1.196 — Trazabilidad de máquina de estados e idempotencia de admisiones

**Informe fuente:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-002.md`, SHA `e96e9ccc3f8ce56ba58709e57654707a2029b4dd`.  
**Fuente técnica:** `backend/academic-service/Code.gs`, SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`.

- `checkAndRegisterIdempotencyKey` y `saveIdempotentResult` (279-318): el middleware consulta clave y existe helper de persistencia, pero updateAdmissionStatus/reopenAdmissionRequest no guardan resultado durable.
- `validateRolePermission` (524-583) y `doPost` (671-690): revisar privilegio de reapertura y procedencia server-side de isInternalCall/skipLock.
- `ALLOWED_ADMISSION_STATE_TRANSITIONS` (1556-1568): matriz declarada; no es aplicada de forma uniforme por los handlers.
- `updateAdmissionStatus` (1928-2059): ruta ordinaria que permite Reabierta y puede omitir lock por skipLock.
- `reopenAdmissionRequest` (2061-2105): ruta privilegiada sin validación del origen/destino ni lock.

**Tareas vinculadas:** AUD-NG-234/TASK-514 (transiciones y reapertura); AUD-NG-006 (idempotencia durable); AUD-NG-145 (historial/correlationId); AUD-NG-233/TASK-513 (guardas fail-closed); AUD-NG-161 (pruebas conductuales). Coordinar con AUD-NG-232/TASK-512 y AUD-NG-179 sin duplicar sus alcances.


## C1.197 — TAREA-F5-003: identificadores, concurrencia e idempotencia en admisiones

**Informe:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-003.md`.  
**Código:** ACADEMIC `Code.gs`, SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`.

- `createAdmissionRequest` (983-1110): verifica cache antes de lock; skipLock proviene del payload; detecta duplicados por identificación o nombre+fecha, no por email; genera ADM sin año; guarda caché tras append.
- `generateInstitutionalId` (2107-2153): SecuenciasIDs se inicializa antes del lock; `skipLock` permite read-modify-write sin exclusión; no reconcilia contador con IDs existentes.
- `doPost` (671-690, 967-974): PUBLIC_ACTIONS incluye createAdmissionRequest; conserva skipLock si isInternalCall truthy; consulta idempotencia antes de dispatcher y guarda después de éxito. Esto no es reserva atómica.
- `convertAdmissionToStudent` (2156-2392): lock exterior obligatorio; genera MAT secuencial, pero el valor no se pasa a registerStudentEnrollment.
- `registerStudentEnrollment` (12670-12730): no adquiere lock propio; genera MAT con Date.now y cargos con timestamp+aleatorio.
- `sanitizePayloadForLog` (29-49) solo enmascara claves de credenciales; `doPost` catch entrega postData completo y el mensaje de duplicidad puede contener nombre.

**Reconciliación:** TASK-118 (generador/IDs); AUD-NG-006 (reserva/idempotencia durable); AUD-NG-234/TASK-514 (locks no eludibles); AUD-NG-129 (matrícula/cargos); AUD-NG-145 (PII/correlationId); AUD-NG-161 (pruebas); AUD-NG-232/TASK-512 (recuperación de conversión). No crear ID nuevo.

### Corrección cruzada C1.197 de F5-002
`doPost` guarda globalmente el resultado exitoso de acciones no-get (967-968). Por ello, updateAdmissionStatus/reopenAdmissionRequest sí reciben saveIdempotentResult cuando se llaman por endpoint. El problema real es que el helper solo usa CacheService, no reserva clave, el chequeo ocurre antes del lock y la caché expira/falla. Se corrigió el informe F5-002; SHA actualizado: `b1809a57c8ff285b3e1abe983a7a1fd207e54186`.


## C1.198 — TAREA-F5-004: portal público de admisión

**Informe:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-004.md`.  
**Archivos principales:** `admision.html` SHA 45b84c80d22d2e8dab75852e65847bae6425db44; `js/student.js` SHA e2888cea60322e49a40b89adadb8010489605dcc; `js/api.js` SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; ACADEMIC `Code.gs` SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.

- `PUBLIC_ACTIONS` (265) incluye saveAdmissionDraft/getAdmissionDraft/getPublicAdmissionStatus.
- `saveAdmissionDraft` (1433) recibe JSON de formulario; `getAdmissionDraft` (1482) devuelve draftData íntegro con lookup por email/draftKey sin verificar titular.
- `getPublicAdmissionStatus` (1510-1543) acepta código o DNI, devuelve nombres y expedienteId; no hay segundo factor ni rate limit en la función.
- `admision.html` autosave (671-715) persiste en localStorage y en backend antes de consentimiento (paso 4, 261-274).
- `fetchAcademicOffers` (741-758) llama getAcademicOffers para año 2026 fijo; la acción no está en PUBLIC_ACTIONS; no actualiza al cambiar año y no filtra ofertas activas. El selector solo conserva grado, no ofertaId/sección.
- `handleAdmissionSubmit` (541-580) omite parentesco y consentimiento en payload; `submitPublicAdmissionRequest` (student.js 3148-3184) tampoco los incluye y no es el handler usado por la página.
- `handleTrackStatus` (598-640) y `fetchAcademicOffers` (741-753) usan innerHTML con datos no escapados.
- `createAdmissionRequest` (984-1110) no repite validaciones completas en servidor.
- `index.html` y `login.html` no contienen enlace directo a admision.html, pese al changelog.

**Nuevo hallazgo AUD-NG-235:** acceso público inseguro a borradores/seguimiento, exposición de PII y XSS.  
**Tareas existentes:** AUD-NG-006 (reintentos/idempotencia); TASK-118 (IDs); AUD-NG-145 (PII/logs); AUD-NG-161 (pruebas); T-UX-19 (WCAG); T-UX-20 (responsive); AUD-NG-036 (relación/identidad). No crear IDs duplicados.


## C1.199 — TAREA-F5-005: consola administrativa de admisiones

**Informe:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-005.md`.  
**Código:** `dashboard-secretaria.html` SHA `fa0d8c23aace24a6acab2d4956398a7f5e1309b8`; `js/secretary.js` SHA `08a81266957b4c18cc25f8ba6749eac30a8f2c2c`; ACADEMIC `Code.gs` SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`.

- `loadAdmissionRequestsList` (secretary.js 1-25) llama `getAdmissionRequests` sin token ni parámetros de página.
- `getAdmissionRequests` (Code.gs 1113-1159) soporta page/pageSize, pero sin page devuelve todos los registros y no aplica departamento.
- `filterAdmissionRequestsLocal` (58-137) filtra año/grado/estado/texto, no fecha ni requisitos pendientes.
- `validateContextualAccess` (465-523) exige scopeType+requestedValue en payload; el listado envía `{}` y las mutaciones tampoco incluyen ámbito. Reabrir TAREA-AD-03.
- `js/auth.js` (138-159) omite sessionToken de currentUser; `js/api.js` (47-50) solo añade requesterUserId/requesterRole. AUD-NG-001.
- `openAdmissionDetailModal` (137-246) crea transiciones solo por estado; Reabierta llama updateAdmissionStatus, no reopenAdmissionRequest. AUD-NG-234/TASK-514.
- `updateAdmissionStatus` (2014-2044) guarda justificación en observaciones y la incluye en notificación a familia; no es nota interna confidencial.
- `convertAdmissionToStudentAction` (277-296) muestra IDs en alert y recarga lista, sin navegar al expediente.
- `filterAdmissionRequestsLocal`, `openAdmissionDetailModal`, documentos, entrevistas y evaluaciones insertan datos en innerHTML; extender AUD-NG-235.
- Modal invoca documentos, entrevistas, evaluaciones, lista de espera, tutores, capacidad, notificaciones, audit trail y duplicados.
- `setupAdvancedTableFilters` (ui-common.js 2129) y `renderUIProgressSkeleton` (5147) existen, pero no tienen callsite en la consola.

**Tareas existentes:** AUD-NG-001 (token); TAREA-AD-03 (ABAC); AUD-NG-234/TASK-514 (transiciones/concurrencia); AUD-NG-235 (XSS); AUD-NG-145 (notas/PII); AUD-NG-006 (idempotencia); AUD-NG-161 (pruebas); T-UX-19 (accesibilidad); AUD-NG-233/TASK-513 (guardas de documentos/capacidad). No crear IDs nuevos.


## C1.200 — TAREA-F5-006: gestión documental de aspirantes antes de matrícula

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-006.md.  
**HEAD auditado:** 5b2747201c2dd542b85cf84ec6786d4b9f6a0248.  
**Dictamen:** NO CUMPLE.  
**Fuente de requisitos:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 1986-2021.

### Backend documental
- uploadStudentDocument (Code.gs 10572-10707) acepta solicitudId/expedienteId, comprueba 10 MB y 0 bytes, crea Drive file y registra DocumentosEstudiante. Confía en MIME de data URL o asigna PDF por defecto; no valida Magic Bytes ni extensión; permite WEBP.
- getStudentDocuments (10708-10785) filtra por IDs sin validar pertenencia; si faltan ambos IDs devuelve todos los documentos; devuelve driveFileId y driveUrl.
- updateDocumentStatus (10836-10854) cambia estado por documentoId sin validación de transición, pertenencia ni log estructurado.
- getPendingDocumentsReport (10855-10922) usa cuatro requisitos fijos, no año/grado y no es invocado por los consumidores inspeccionados.
- checkAndNotifyExpiringStudentDocuments (10923-10985) envía alertas de vencimiento, pero no sustituye un panel de pendientes/rechazados para familia y Dirección.

### Interfaz y permisos
- admision.html updateDocumentRequirementsList (519-538) presenta listas estáticas por grado; no contiene file input/carga.
- js/student.js no tiene referencias a uploadStudentDocument/getStudentDocuments/getSecureDocumentStream.
- js/secretary.js loadAdmissionApplicantDocuments (297-337) consulta y muestra documentos; updateApplicantDocumentStatusAction (339-356) ofrece solo Aceptado/Rechazado. El enlace usa driveUrl directo.
- ROLE_PERMISSIONS concede uploadStudentDocument a perfiles administrativos; Estudiante/Alumno no tiene ese permiso.
- getSecureDocumentStream (Code.gs 2485-2508) no tiene case en doPost; assertRecordOwnership (2399-2413) confía en role/IDs del payload y autoriza cualquier rol no vacío que no sea estudiante con ID distinto.

### Conversión y consistencia
- convertAdmissionToStudent (2156-2392) actualiza expedienteId en documentos asociados a solicitudId, sin duplicar el archivo físico, pero silencia errores de migración y continúa tras marcar Convertida.
- El bloqueo revisa solo estados Pendiente/Rechazado; no comprueba requisitos faltantes, EnRevision, Requiere_Sustitucion ni vencimiento. allowIncompleteOverride se acepta desde payload.
- uploadStudentDocument intenta versionado, pero silencia error al escribir historial y puede reemplazar el registro vigente sin versión histórica persistida.

### Reconciliación de tareas
TASK-038 (Magic Bytes); TASK-134/TASK-144 (SHA-256/deduplicación/integridad); TASK-135 (custodia/versionado); TASK-140 (sensibilidad); TASK-142 (streaming autenticado); TASK-146 (bitácora forense); TASK-153 (ABAC); AUD-NG-232/TASK-512 (recuperación de conversión); AUD-NG-233/TASK-513 (bloqueo fail-closed); AUD-NG-145 (logs); AUD-NG-161 (pruebas); TASK-118 (IDs). No se crean IDs globales nuevos.

**Pruebas:** inspección estática/manual. No se ejecutaron runtime, Drive, HTTP, concurrencia ni suites.


## TAREA-F5-007 — entrevistas y evaluaciones de admisión (C1.201)

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-007.md.  
**HEAD auditado:** f481f6950f9d8e9ff51322ce158a4b5e7741db58.  
**Código:** ACADEMIC Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8.

### Flujo y dependencias
- dashboard-secretaria.html (268-296) -> modal de expediente -> secretary.js/openAdmissionDetailModal (176-180) -> loadAdmissionInterviews/loadAdmissionEvaluations.
- secretary.js (367, 419-420, 446, 1466, 1505) -> fetchApi -> ACADEMIC endpoints getAdmissionInterviews, scheduleAdmissionInterview, recordInterviewOutcome, getAdmissionEvaluations y saveAdmissionEvaluation.
- ACADEMIC doPost (847-852) -> endpoints Code.gs 1594-1747.
- getOrCreateSheet (148-150) -> EntrevistasAdmision y EvaluacionesAdmision; ambas enlazan solicitudId con SolicitudesAdmision por referencia textual, sin validación referencial al programar/guardar.
- scheduleAdmissionInterview -> EntrevistasAdmision; consulta conflictos por evaluador/fecha y appendRow. No adquiere LockService; genera ID con skipLock=true (1622; generador 2107-2145).
- getAdmissionInterviews -> filtro opcional por solicitudId/evaluadorUserId del payload; sin comparación con _verifiedUserId.
- recordInterviewOutcome -> cambia estado/observaciones en fila existente; sin máquina de estados, lock, evento de auditoría ni verificación de evaluador asignado.
- saveAdmissionEvaluation -> appendRow en EvaluacionesAdmision; captura _verifiedUserId como evaluador, pero no verifica asignación ni valida rúbrica/escala/dictamen.
- getAdmissionEvaluations -> filtra solo por solicitudId; devuelve todos los evaluadores de esa solicitud.
- updateAdmissionStatus (1996-2003) -> consulta evaluaciones existentes y bloquea Pendiente/Reprobado; no verifica faltantes del catálogo obligatorio por grado.
- js/api.js/auth.js -> sessionToken no se conserva ni transmite; ampliar AUD-NG-001.
- Renderizadores secretary.js (369-390; 1468-1483) -> innerHTML con campos persistidos sin escape; ampliar AUD-NG-235.

### Hallazgos y controles relacionados
- AUD-NG-001: autenticación de las cinco acciones protegidas.
- AUD-NG-234/TASK-514: lock, conflicto concurrente, estados y transiciones.
- AUD-NG-145: actor verificado y registro inmutable de cada cambio.
- AUD-NG-235: XSS por interpolación en innerHTML.
- AUD-NG-161: ausencia de pruebas conductuales.
- TAREA-AD-03/AUD-NG-153: aislamiento por asignación/ámbito del evaluador.
- AUD-NG-233/TASK-513: guardia fail-closed ante evaluaciones obligatorias ausentes.

**Resultado:** existen las tablas, cinco endpoints y paneles de consulta, pero no hay grupos, reprogramación/cancelación/notificaciones, autorización por evaluador, políticas por grado, excepción firmada ni bitácora completa. El bloqueo de admisión falla abierto cuando no existe fila de evaluación requerida. Dictamen NO CUMPLE.

**Tareas derivadas:** F5-007-A01 programación/estados/concurrencia; A02 ABAC por evaluador y sesión; A03 políticas por grado y bloqueo fail-closed; A04 rúbricas/escala/excepciones; A05 bitácora y renderizado seguro; A06 pruebas. Ver criterios de aceptación en el informe.


## C1.202 - TAREA-F5-008: listas de espera y prelación

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-008.md.  
**HEAD auditado:** 81f3c565fadc9114372cb993bb00c51082e8b56f.  
**Dictamen:** NO CUMPLE.  
**Fuente de requisitos:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2057-2089 (12 requisitos, 10 criterios).

### Flujo de datos y dependencias
- dashboard-secretaria.html (253-266) -> modal de solicitud -> secretary.js/openAdmissionDetailModal (176-188) -> loadAdmissionWaitlistStatus(solicitudId).
- secretary.js 1521-1562 -> ACADEMIC/getWaitlist({}) -> backend/academic-service/Code.gs 1813-1847 -> ListaEsperaAdmision + SolicitudesAdmision; backend devuelve aspiranteNombre e identificacion de cada registro, cliente filtra por solicitudId.
- secretary.js 1564-1592 -> addToWaitlist -> Code.gs 1750-1811 -> SolicitudesAdmision + ListaEsperaAdmision + SecuenciasIDs. Puntaje fijo por criterios del payload; posición por conteo de filas En_Espera; escribe En_Espera directamente.
- secretary.js 1594-1612 -> offerWaitlistSlot -> Code.gs 1876-1899 -> actualiza EstadoOferta y FechaExpiracionOferta; no consulta OfertaAcademica/checkEnrollmentCapacity ni identifica VacanteID.
- secretary.js 1614-1638 -> reorderWaitlist -> Code.gs 1849-1874 -> cambia solo una posición y justificación; no reindexa grupo.
- ACADEMIC/respondToWaitlistSlot (1901-1925) -> cambia estado; si Aceptar llama updateAdmissionStatus(Admitida) después de escribir Oferta_Aceptada. No hay lock/rollback; rechazo no libera ni promueve.
- getOrCreateSheet (152-153) crea ListaEsperaAdmision con 12 columnas; no incluye OfertaID/VacanteID, actor de cambios ni historial append-only.
- ACADEMIC ROLE_PERMISSIONS (168-260): Director/Secretaría/Secretaria/Administrador tienen operaciones; Padre/Tutor/Responsable no tienen getWaitlist ni respondToWaitlistSlot.
- validateRolePermission (524-544) exige token; js/api.js/auth.js no lo conservan/transmiten, ampliar AUD-NG-001.
- checkEnrollmentCapacity (11025-11114) cuenta Matriculas y Solicitudes Admitida, no Plaza_Ofrecida; tryLock false no aborta, ampliar AUD-NG-179/TAREA-F5-010.
- generateInstitutionalId (2107-2148) permite skipLock; addToWaitlist lo llama skipLock=true, ampliar AUD-NG-234/TASK-514.
- USER/sendMultiChannelNotification (4818-4893) existe, pero no se invoca desde oferta/rechazo/expiración waitlist; ampliar TAREA-F5-011.
- student.js 264-345 muestra estado/cronología En_Espera, no posición ni botones de oferta/respuesta; ampliar TAREA-F5-012.

### Hallazgos y controles relacionados
- AUD-NG-001: propagación de sessionToken.
- AUD-NG-179 y TAREA-F5-010: lock timeout y capacidad/cupos.
- AUD-NG-234/TASK-514: skipLock, exclusión mutua y transiciones.
- AUD-NG-145: actorUserId e historial durable de movimientos.
- AUD-NG-161: pruebas de regresión.
- AUD-NG-233/TASK-513: política fail-closed de cupos.
- TAREA-F5-011: notificaciones de oferta/liberación.
- TAREA-F5-012: posición/aceptación/rechazo familiar y aislamiento IDOR.

**Resultado:** la tabla/endpoints existen, pero la posición no usa prelación, las ofertas no reservan vacantes, no hay lock ni expiración, rechazo no avanza al siguiente, familia no puede consultar/responder y la bitácora no conserva todos los movimientos. Dictamen NO CUMPLE.

**Tareas derivadas:** F5-008-A01 elegibilidad y prelación; A02 reserva atómica/capacidad; A03 estados/expiración/promoción; A04 consulta/respuesta familiar; A05 notificaciones/trazabilidad; A06 vista administrativa; A07 pruebas. Ver criterios en el informe.


## Fase 5 - Vinculación familiar y permisos por tutor (TAREA-F5-009, C1.203)

- USER: createLinkInvitation/acceptLinkInvitation -> InvitacionesVinculacion/RelacionesFamiliares; validateContextualAccess llama getGuardianStudents sin sessionToken; revokeFamilyLink/updateFamilyLinkPermissions; getGuardianApplicants filtra por email/substring.
- ACADEMIC: validateContextualAccess no valida relación familiar; getStudentFile/getStudentDocuments/getStudentAttendanceSummary/getStudentTimeline no verifican vínculo por recurso; validador aislado usa tablas legacy; convertAdmissionToStudent/saveStudentGuardian mantienen rutas sin aceptación.
- Datos: RelacionesFamiliares/RelacionesEstudianteTutor/RelacionesTutores/TutoresEstudiantes no forman fuente canónica; encabezados no coinciden con columnas escritas.
- Ampliar sin duplicar: AUD-NG-001/036/105/123/136/145/161/232/TASK-512/233/TASK-513/234/TASK-514. Coordinar TAREA-F5-011 y F5-012.
- Dictamen: F5-009 NO CUMPLE. Informe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-009.md.
- Subtareas: F5-009-A01 modelo canónico; A02 invitación segura/atómica; A03 autorización transversal; A04 permisos granulares; A05 administración UI/RBAC; A06 interfaz/entrega; A07 trazabilidad; A08 pruebas.


## Fase 5 - Capacidad, reservas y matrículas (TAREA-F5-010, C1.204)

- OfertaAcademica: esquema canónico de 11 columnas; createAcademicOffer escribe 7 valores con índices incompatibles y no persiste CapacidadMax.
- Capacidad: checkEnrollmentCapacity no aborta si tryLock falla; reservas Admitida se filtran por año/grado, no sección; fallback de sección/capacidad abierto.
- Rutas: registerStudentEnrollment no usa lock ni checkEnrollmentCapacity; createStudentEnrollment acepta skipLock/isInternalCall; conversión/estado/lista de espera dependen de control incompleto.
- Reservas: expiración solo excluye del conteo, no persiste estado ni evento; falta historial completo de reserva/liberación.
- Sobrecupo: forceCapacityOverride booleano no verifica identidad/rol/firma de Dirección; evento de log no prueba autorización.
- Reporte: getEnrollmentCapacityReport existe pero no tiene dispatch/RBAC; UI consulta año/grado y omite sección.
- Dependencias: ampliar TASK-477/AUD-NG-179 (timeout LockService), AUD-NG-234/TASK-514 (bypass/atomicidad), AUD-NG-145 (bitácora), AUD-NG-161 (pruebas); coordinar TAREA-F5-008 (lista de espera), F5-011 (notificaciones) y F5-012 (portal familiar).
- Dictamen: F5-010 NO CUMPLE. Informe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-010.md.
- Subtareas locales F5-010-A01..A08: esquema; conteo por sección; atomicidad; ciclo de reserva; override firmado; reporte/UI; bitácora/reconciliación; pruebas.


### TAREA-F5-010-A01 (C1.205) - Adaptador de esquema OfertaAcademica

- `getAcademicOfferColumnMap(sheet, ensureOptionalColumns)` identifica OfertaID/AnoID/SedeID/Grado/Seccion/AsignaturaID/PlanID/Modalidad/CapacidadMax/Estado/CodigoClase por encabezado y conserva lectura de hojas legacy de siete columnas.
- `createAcademicOffer` escribe por mapa, valida capacidad y estado, agrega solo columnas opcionales faltantes y versiona la caché.
- Lectores actualizados: `getAcademicOffers`, `getCoordinatorOverview`, `generateAutoSchedules`, `getStudentSchedule`, `checkEnrollmentCapacity`, `getEnrollmentCapacityReport`, `getSectionCapacityAnalyticsReport`.
- Suite estática ampliada en `tests/regression/academic-grading-suite.js`. Prueba local mock del adaptador: 12 aserciones PASS; no equivale a persistencia real de Apps Script/Sheets.
- Backup inmutable del archivo anterior: blob Git SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc. Nuevo blob Code.gs: df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- Estado A01: En ejecución, pendiente round-trip real y revisión externa.


## Fase 5 - Notificaciones automáticas y seguimiento de admisión (TAREA-F5-011, C1.206)

- ACADEMIC/createAdmissionRequest (984-1109) y updateAdmissionStatus (1928-2059) invocan sendMultiChannelNotification como global protegido por typeof; ACADEMIC no define esa función. La única definición está en USER/sendMultiChannelNotification (4818-4893), otro microservicio; no se encontró productor interservicio autenticado. Las llamadas pueden omitirse silenciosamente.
- No hay productores de notificación en scheduleAdmissionInterview/recordInterviewOutcome (1595-1689), addToWaitlist/offerWaitlistSlot/respondToWaitlistSlot (1750-1925) ni convertAdmissionToStudent (2156-2392), incluida la creación de InvitacionesVinculacion.
- BandejaNotificaciones: inicialización legacy de 9 columnas (USER 889), escritura de 12 columnas en otro orden (4868-4882), lector getPendingReminders usa índices legacy (6521-6545); getAdmissionNotificationLogs asume esquema de 12 campos (4937-4971).
- retryFailedNotificationsQueue (4761-4815) es síncrono; sin trigger programado localizado, maxRetries, nextAttemptAt ni backoff; fallos no incrementan intentos/estado. No figura en ROLE_PERMISSIONS de Secretaría/Director/Subdirector.
- getNotificationPreferences devuelve valores fijos y no lee PreferenciasNotificacion; sendMultiChannelNotification no consulta getUserSettings ni preferencias.
- El sender marca Entregado por defecto, no acredita recibo del proveedor y no registra transiciones en BitacoraTraceability; solo appendRow y logStructuredEvent. La deduplicación check-then-append no es atómica.
- secretary.js 191, 1357-1402 y dashboard-secretaria.html 198-205 permiten consultar historial; no hay reenvío manual individual. Plantilla solo HTML, sin body texto plano, escape contextual ni validación de enlace.
- Dictamen F5-011 NO CUMPLE. Informe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-011.md; subtareas locales A01-A09.
- Dependencias: ampliar AUD-NG-083 (interservicio HMAC), AUD-NG-145 (trazabilidad/PII), AUD-NG-161 (pruebas), AUD-NG-176/TASK-474 (outbox/cola), AUD-NG-177/TASK-475 (HTML/secretos) y TASK-422 (preferencias). Coordinar F5-007-A05, F5-008-A05, F5-009-A06 y F5-012. No crear IDs globales duplicados.


## Fase 5 - Revalidación de notificaciones de admisión (TAREA-F5-011, C1.207)

- Se confirma la separación de despliegues USER y ACADEMIC en `js/config.js` (216-241): URLs distintas y directriz de un proyecto Apps Script por carpeta backend. La llamada global de ACADEMIC a `sendMultiChannelNotification` no constituye integración interservicio autenticada.
- Flujo adicional H10: USER/`sendMultiChannelNotification` guarda `targetUser/targetEmail` en `BandejaNotificaciones`; USER/`getAdmissionNotificationLogs` devuelve `usuarioDestino/emailDestino`; `js/secretary.js` los interpola en `container.innerHTML` sin escape en el destino (1384) y estado (1386). Riesgo estático de XSS almacenado.
- Tarea derivada local F5-011-A10: renderizado seguro del historial de notificaciones en Secretaría; ampliar AUD-NG-177/TASK-475 y AUD-NG-145. Criterios en el informe individual.
- Dictamen F5-011 revalidado: NO CUMPLE. A01-A10 permanecen pendientes; no se modificó código ni pruebas.


## C1.208 - TAREA-F5-012: seguimiento de aspirantes en Portal Familiar

### Rutas y contratos inspeccionados
- `student-dashboard.html` SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1: contiene el dashboard de Estudiante, pero no declara los nodos `family-student-switcher-container`, `family-student-switcher`, `family-applicant-tracking-container` ni `family-consolidated-summary-container`.
- `js/student.js` SHA e2888cea60322e49a40b89adadb8010489605dcc: DOMContentLoaded limita student-dashboard a Estudiante/Alumno (27-35); `initFamilyStudentSwitcher` (184-250) exige nodos inexistentes, llama USER/getGuardianStudents y USER/getGuardianApplicants, y transforma errores a `{data:[]}`; invocación en 745. `renderApplicantTrackingPanel` (252-350) consulta lista familiar y luego usa ACADEMIC/getPublicAdmissionStatus como fallback público.
- USER `getGuardianApplicants` SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f, 3583-3622: actor verificado para Padre/Tutor/Responsable; filtra por email y por subcadena de UID en nombreResponsable; devuelve campos personales y observaciones sin clasificación pública. No consulta relación familiar activa.
- ACADEMIC `PUBLIC_ACTIONS` (265) permite getPublicAdmissionStatus/getAdmissionDraft sin token. getPublicAdmissionStatus (1510-1545) acepta código/DNI y devuelve nombre/estado/expedienteId. getAdmissionDraft (1482-1508) selecciona por emailResponsable/draftKey y devuelve draftData.
- ACADEMIC `validateContextualAccess` (465-523) no incluye solicitudId/expedienteId en targetStudentId; `getStudentDocuments` (10829-10890) filtra por IDs arbitrarios y devuelve Drive URLs/IDs; roles familiares tienen permiso estático para getStudentDocuments, pero no para uploadStudentDocument/getAdmissionInterviews.
- ACADEMIC `getAdmissionInterviews` (1645-1667) no tiene llamada desde js/student.js; no hay lectura familiar scoped de entrevistas/evaluaciones.
- USER `getFamilyConsolidatedSummary` (3629-3695) suma cargos por userId de estudiantes vinculados; ACCOUNTING `getAdmissionFinancialStatus` SHA 38b979d41596b85e888b4a7060b37bbac0840a28, 2339-2397 filtra por solicitudId. Ambos usan CargosEstudiante sin discriminador explícito; se considera separación parcial, no fuga probada.
- Suites revisadas: academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; sin pruebas F5-012.
### Dependencias existentes (sin duplicar)
- F5-009-A01/A03/A06/A08; AUD-NG-036 y AUD-NG-222 para vínculo/ABAC.
- AUD-NG-002 para PUBLIC_ACTIONS y borradores; AUD-NG-145 para bitácora/PII; AUD-NG-161 para pruebas.
- F5-006-A01/A03, TASK-140/TASK-142/TASK-146/TASK-153 para documentos y acceso.
- F5-007-A02/A05 para entrevistas, autorización y renderizado.
- F5-008-A04/A05 para consulta y respuesta familiar a ofertas; esta cobertura no se duplica.
### Dictamen
TAREA-F5-012 NO CUMPLE. Subtareas locales F5-012-A01..A08 pendientes. Hallazgos H1-H11 y matriz detallada en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-012.md.


## Fase 5 - Integración financiera de admisiones (TAREA-F5-013, C1.209)

### Rutas y contratos inspeccionados
- ACCOUNTING `getAdmissionFinancialStatus` (2339-2397) consulta `CargosEstudiante` y `ComprobantesPago` por solicitudId; no verifica relación familiar. ROLE_PERMISSIONS (198-210) permite la acción a Padre/Tutor/Responsable.
- ACCOUNTING `createAdmissionCharge` (2398-2420, 2760-2780) permite monto/concepto/descuento del payload; usa columna UserId para solicitudId y columna FechaVencimiento para repetirlo; deduplicación no atómica. El permiso también se concede a roles familiares.
- ACCOUNTING `uploadPaymentVoucher`/`reviewPaymentVoucher` (4100-4220) es genérico; la revisión cambia estado antes de registrar pago. `recordStudentPayment` (3891-3965) no es un flujo transaccional específico de admisión.
- USER `submitJointFamilyPayment` (3700-3765) crea comprobante de pago conjunto para estudiantes; no acepta solicitudId. `submitFamilyScholarshipApplication` (3767-3810) escribe `BecasYDescuentosFamiliares`; ACCOUNTING aplica descuentos desde `SolicitudesDescuentoBeca`.
- USER `getFamilyConsolidatedSummary` (3629-3705) agrega estudiantes vinculados, no aspirantes. UI `loadApplicantFinancialStatus` (js/student.js 340-390) muestra consulta individual; no hay formulario de pago/beca asociado al aspirante.
- ACADEMIC `convertAdmissionToStudent` (2157-2382) crea expediente y matrícula/cargo inicial, pero no migra pagos, comprobantes ni becas de admisión.
- `tests/regression/academic-grading-suite.js` y `modular-dashboard-suite.js` no contienen cobertura F5-013.
### Dependencias existentes (sin duplicar)
- TASK-001/F15-Task01: ampliar configuración/clasificación de conceptos con conceptos de admisión.
- TASK-002/F15-Task02: ampliar atomicidad/idempotencia y convivencia de cargos de admisión y matrícula.
- TASK-003/F15-Task03: ampliar reversión/regularización de pagos de admisión.
- AUD-NG-036/AUD-NG-222 para vínculo/ABAC; AUD-NG-145 para trazabilidad financiera; AUD-NG-161 para pruebas.
- Coordinar F5-012-A01/A02/A03/A07. No crear IDs globales duplicados.
### Dictamen
TAREA-F5-013 NO CUMPLE. Subtareas locales F5-013-A01..A10 pendientes. Hallazgos H1-H11 y matriz de 14 requisitos/8 criterios en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-013.md.


## TAREA-F5-014 - trazabilidad de admisiones y notificaciones de auditoría (C1.210)

### Ruta de escritura y lectura de HistorialCambiosEntidad
- ACADEMIC/createAdmissionRequest -> LogsSistema (ADMISSION_CREATED); no llama recordEntityChangeLog.
- ACADEMIC/updateAdmissionStatus -> recordEntityChangeLog + logStructuredEvent; ACADEMIC/reopenAdmissionRequest -> ambos.
- ACADEMIC/convertAdmissionToStudent -> LogsSistema (ADMISSION_CONVERTED); no llama recordEntityChangeLog.
- ACADEMIC/uploadStudentDocument -> LogsSistema (DOCUMENT_UPLOADED); updateDocumentStatus/getStudentDocuments/getSecureDocumentStream no generan evento de auditoría de acceso.
- USER/recordEntityChangeLog (2715-2744) y USER/getEntityAuditHistory (2745-2795) esperan columnas [cambioId, entityType, entityId, accion, valoresAnteriores, valoresNuevos, ejecutadoPor, fechaCambio, correlationId].
- ACADEMIC/recordEntityChangeLog (1568-1595) escribe [HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable, CorrelationID]. USER/ACADEMIC comparten SPREADSHEET_ID; el lector interpreta las columnas académicas desplazadas y no encuentra solicitudId.
- Acción correctiva local: F5-014-A01. Unificar esquema y migrar sin perder filas.

### Correlación y bitácora distribuida
- USER/recordTraceabilityLog (4548-4573) -> BitacoraTraceability; USER/getTraceabilityCorrelationLogs (4575-4615) consulta por correlationId/estado/servicio.
- El endpoint está en dispatcher, pero no se localizaron productores automáticos en ACADEMIC, ACCOUNTING, TASK o EXAM.
- js/api.js/fetchApi (1-181) no crea ni propaga correlationId.
- ACADEMIC status/reopen llaman recordEntityChangeLog sin correlationId compartido; el helper genera un CORR local.
- Acciones: F5-014-A03/A04; ampliar AUD-NG-145 y coordinar AUD-NG-083.

### Privacidad, integridad y consulta
- USER/sanitizeValueForAudit (2698-2713) y ACADEMIC/ACCOUNTING sanitizePayloadForLog solo cubren claves de credenciales; no DNI/identificación, email, teléfono o fecha de nacimiento.
- ACADEMIC recordEntityChangeLog no llama sanitizador.
- HistorialCambiosEntidad y BitacoraTraceability usan appendRow, sin protección de hoja/rango ni cadena hash verificable; ACL productiva no inspeccionada.
- USER/getEntityAuditHistory no está en ROLE_PERMISSIONS estática de Secretaría/Dirección; MatrizPermisosRoles externa puede modificar el resultado.
- getEntityAuditHistory usa limit, sin page/cursor; getPaginatedAuditLogReport solo lee BitacoraEventos/BitacoraTraceability, no HistorialCambiosEntidad.
- Acciones: F5-014-A05/A06/A08/A09; ampliar AUD-NG-145 y AUD-NG-222/TASK-502.

### UI y pruebas
- dashboard-secretaria.html carga config.js, persistence.js, api.js, ui-common.js y secretary.js. Ninguno define window.escapeHtml.
- secretary.js/loadAdmissionAuditTrail (1187-1225) interpola ejecutadoPor sin escape y deja fallback sin escape para accion/valoresNuevos.
- Las suites academic-grading-suite.js y modular-dashboard-suite.js no contienen F5-014 ni pruebas de esquema, diff, PII, RBAC, paginación, correlación, inmutabilidad o acceso documental.
- Acciones: F5-014-A10/A11; ampliar AUD-NG-161 y coordinar F5-011-A10/AUD-NG-145.

### Reconciliación
- F5-011-A07 (trazabilidad append-only) y F5-011-A10 (XSS del historial de notificaciones) se amplían por referencia, sin duplicar sus objetivos.
- F5-012-A07 cubre semántica del timeline y errores del Portal Familiar.
- F5-013-A09 cubre trazabilidad/contabilidad financiera.
- TASK-474/TASK-475 mantienen outbox/notificaciones y plantillas/PII; no sustituyen el registro de auditoría.
- AUD-NG-145 y AUD-NG-161 conservan sus causas transversales; AUD-NG-222/TASK-502 mantiene el motor ABAC.


## TAREA-F5-015 - guardado automático de borradores y recuperación de solicitudes (C1.211)

### Persistencia y recuperación
- admision.html/triggerAdmissionAutoSave (683-715) usa debounce de 3 s y solo entonces escribe localStorage; no cumple copia local inmediata ni debounce requerido de 5 s para sincronización.
- admision.html/restoreAdmissionDraftOnLoad (717-739) toma keys[0], no consulta ACADEMIC/getAdmissionDraft y no vincula el borrador a identidad autenticada. No hay recuperación nube en la interfaz.
- El fallback draft_local es común; las claves incluyen email o DNI; el formulario serializado incluye datos personales y no hay limpieza/expiración del prefijo.
- El helper setupUnsavedChangesProtection existe en ui-common.js, pero admision.html no lo inicializa.

### Seguridad y API
- ACADEMIC PUBLIC_ACTIONS (265) contiene saveAdmissionDraft/getAdmissionDraft; validateRolePermission (524-525) retorna autorizado antes de verificar token.
- saveAdmissionDraft (1433-1479) y getAdmissionDraft (1482-1506) confían en draftKey/emailResponsable; el lector devuelve draftData íntegro y el escritor puede actualizar una fila sin probar titularidad.
- AUD-NG-002 ya cubre la retirada de estas operaciones de PUBLIC_ACTIONS, la identidad por claims y la propiedad/capacidad opaca. Ampliar por referencia; no crear ID global duplicado.

### Sincronización, concurrencia y ciclo de vida
- js/api.js/fetchApi (11-181) reintenta hasta dos veces determinados errores de red, pero no mantiene cola durable ni reintenta al recuperar conexión. Devuelve JSON status:error como resultado ordinario.
- admision.html marca “Borrador guardado en nube” sin comprobar res.status.
- ACADEMIC/saveAdmissionDraft lee/encuentra y actualiza o appendRow sin LockService ni versión; dos altas simultáneas pueden duplicar y las ediciones concurrentes pueden sobrescribirse.
- ACADEMIC/createAdmissionRequest marca Consumido el borrador remoto (1090-1101); el submit del HTML no elimina la copia local. La restauración posterior puede revivir datos ya enviados.
- La UI no presenta guardado manual ni fecha/hora; la restauración solo asigna input.value para valores truthy y no restaura checked en checkbox/radio.

### Pruebas y acciones
- academic-grading-suite.js y modular-dashboard-suite.js no contienen F5-015 ni tests de save/get/BorradoresAdmision.
- Acciones locales: F5-015-A01 recuperación cloud autorizada; A02 persistencia inmediata/debounce; A03 privacidad y aislamiento local; A04 cola/reintentos y respuesta veraz; A05 guardado manual/indicador; A06 upsert atómico/conflictos; A07 limpieza del ciclo de vida; A08 serialización/restauración; A09 pruebas conductuales.
- Reconciliar seguridad con AUD-NG-002, pruebas con AUD-NG-161 y protección de formularios con T-UX-03/T-UX-17/T-UX-10. No duplicar IDs globales.

### Dictamen
TAREA-F5-015 NO CUMPLE. Hallazgos H1-H12 y nueve subtareas locales pendientes en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-015.md.


## TAREA-F5-016 - accesibilidad WCAG 2.2 AA y adaptación móvil de admisiones (C1.212)

### Flujo de interfaz y stepper
- admision.html: stepper step-node-1..4 (71-97); form-step-1..4 (102-294). La especificación de completadas.md exige seis pasos; faltan requisitos documentales y confirmación/comprobante como pasos independientes.
- goToStep (453-509) valida solo el paso actual si avanza, enfoca el primer control del destino, establece aria-current después de navegar y calcula progressPct para cuatro pasos. Los nodos no se marcan con error/incompleto; la barra carece de role=progressbar y valores ARIA.
- updateSummaryCard (511-517) presenta cinco datos al entrar al paso 4. Los controles conservan valores al ocultar/mostrar sus secciones.
- handleAdmissionSubmit (539-585) deshabilita el botón y muestra spinner durante fetch; el estado se restablece en finally.

### Validación, semántica y lector de pantalla
- validateStep (414-450) solo implementa validación personalizada para pasos 1 y 2. No hay validación personalizada del paso 3. Los spans err-* no se vinculan con aria-describedby y los controles no reciben aria-invalid; el primer error no recibe foco.
- El stepper es un div genérico con aria-label; la barra no anuncia avance. aria-current no se inicializa en la carga. No hay región aria-live para cambios de paso/errores.
- El modal modal-confirm-admission se abre/cierra mediante clases (647-655). El helper puede añadir role=dialog/aria-modal tras goToStep, pero no define nombre accesible, foco inicial, confinamiento ni retorno al disparador.
- js/ui-common.js/auditAndFixAccessibility (5248-5300) inspecciona botones/enlaces role=button, ciertos diálogos y campos de modal-student-file; no verifica contraste, labels/errores, stepper, progreso, aria-live ni conformidad WCAG. admision.html solo lo llama dentro de goToStep (505-508), no al render inicial ni desde switchTab.

### Contraste y responsividad
- admision.html usa text-gray-400 y text-red-500 en texto pequeño. Con paleta Tailwind predeterminada: #9ca3af sobre blanco ≈2.54:1; #ef4444 sobre blanco ≈3.76:1. Ambos no alcanzan 4.5:1 para texto normal.
- Hay viewport meta, grids responsive y breakpoints globales en css/style.css; body usa overflow-x:hidden (67-78), que puede ocultar overflow sin corregir la causa. No se ejecutaron viewports 320px, orientación ni zoom.
- css/style.css ofrece :focus-visible y prefers-reduced-motion; existe prefers-contrast:high, pero la vista no demuestra el contraste efectivo de todos sus textos/estados ni el requisito TASK-258 de prefers-contrast:more.

### Pruebas y dependencias
- tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen casos F5-016 ni pruebas conductuales del formulario.
- AUD-NG-211 ya cubre el helper incompleto, errores sin asociación y falta de live announcer; ampliarlo con el caso de admisiones, sin nuevo AUD-NG.
- TASK-258 cubre accesibilidad transversal; TASK-484 cubre pruebas conductuales; TASK-492 campos; TASK-493 modal compartido; TASK-130 ayudas; AUD-NG-181 Escape/retorno de foco; T-UX-20 y TASK-494 adaptación móvil/overlays. No duplicar sus alcances.
- Acciones locales F5-016-A01..A06: stepper de seis pasos; validación y estado de error; teclado/anuncios/modal; contraste y auditoría efectiva; pruebas responsive desde 320px; pruebas conductuales. Detalle y criterios verificables en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-016.md.

### Dictamen
TAREA-F5-016 NO CUMPLE. La navegación anterior, resumen y estado de carga están implementados estáticamente; el stepper, validación, semántica, contraste, gestión de foco, auditoría WCAG y pruebas no satisfacen el alcance completo.


## TAREA-F5-017 - detección de duplicados, validación y calidad de datos de aspirantes (C1.213)

### Flujo de detección
- dashboard-secretaria.html (222-237) -> modal de detalle -> secretary.js/openAdmissionDetailModal (197) -> checkAdmissionDuplicates(solicitudId).
- secretary.js/checkAdmissionDuplicates (1228-1315) -> ACADEMIC/findDuplicateStudents -> Code.gs (10107-10195) -> SolicitudesAdmision, ExpedientesEstudiantes y Usuarios.
- findDuplicateStudents: el join de Usuarios[0] con ExpedientesEstudiantes[1] trata PersonaID como UserId; el esquema declara FechaNacimiento en índice 3, pero el comparador usa índice 7 (EstadoExpediente). La coincidencia alta contra expedientes no es fiable.
- Clasificación media: el handler usa email coincidente O teléfono coincidente, sin comprobar nombres similares ni exigir ambos datos. La comparación telefónica usa sufijo de ocho dígitos y no es simétrica.
- normalizeString (Code.gs:79-82) quita diacríticos y espacios externos, pero no puntuación/caracteres especiales ni espacios internos redundantes. createAdmissionRequest (984-1100) solo valida presencia de nombres/apellidos/grado; no valida formatos de identidad, email, teléfono ni fecha.
- createAdmissionRequest está en PUBLIC_ACTIONS (265); el bloqueo compara DNI textual únicamente entre solicitudes activas del mismo año lectivo y no consulta ExpedientesEstudiantes. El mensaje de error incluye el ID de la solicitud existente y refleja el nombre enviado en el payload (no lee el nombre desde la fila duplicada).
- convertAdmissionToStudent (2156-2380, aprox. 2240-2255) puede seleccionar un expediente por coincidencia de identificación dentro de Observaciones y reutilizarlo sin resolución manual previa.

### Resolución, permisos y privacidad
- ROLE_PERMISSIONS (168-260): findDuplicateStudents está permitido a Director/Subdirector/Secretaría/Secretaria/Administrador; resolveAdmissionDuplicate no está concedido a Secretaria sin tilde. Desarrollador tampoco tiene los endpoints, aunque dashboard-secretaria.html lo admite en su guard de entrada.
- resolveAdmissionDuplicate (10218-10281) valida solicitud, tipo de resolución y motivo mínimo, pero lee authUserId/authRole del payload en vez de _verifiedUserId/_verifiedRole; el flujo de UI no envía esos campos.
- candidates devuelve email sin enmascarar aunque el panel no lo presenta. secretary.js interpola nombreCompleto, código, DNI y motivo dentro de innerHTML sin escape contextual.
- El panel ofrece consulta y resolución manual, pero la discrepancia de roles puede hacer que algunos usuarios vean acciones que el servidor rechaza.

### Bitácora, corrección y pruebas
- resolveAdmissionDuplicate escribe ocho valores en HistorialCambiosEntidad con orden distinto al escritor canónico ACADEMIC de nueve columnas (recordEntityChangeLog, 1568-1595); catch vacío y logStructuredEvent silencian fallos. Reconciliar con AUD-NG-224/TASK-504 y AUD-NG-145; no duplicar.
- No se encontró endpoint ni UI para corregir datos de SolicitudesAdmision con historial de valor anterior/nuevo.
- TC-04-DUPLICATE_SEARCH_INTEGRITY (aprox. Code.gs:4008) pasa {nombre,dni} y espera coincidencias, pero findDuplicateStudents consume nombres/apellidos/identificacion y devuelve candidates; el caso no valida el contrato real.
- tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen pruebas específicas de F5-017. Reconciliar con AUD-NG-161 y coordinar F5-007-A05/F5-012 H8 para salida segura.
- Acciones locales: F5-017-A01 validación/normalización; A02 detección y bloqueo exacto; A03 revisión manual y conversión; A04 privacidad/permisos/renderizado; A05 bitácora con actor verificado; A06 corrección trazable; A07 pruebas conductuales. Detalle y criterios en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md.

### Dictamen
TAREA-F5-017 NO CUMPLE. La búsqueda, panel y decisiones manuales existen parcialmente; los defectos de validación, relación/índices, niveles de coincidencia, vinculación automática, privacidad, autorización, bitácora y pruebas impiden aceptar la tarea.


## TAREA-F5-017 - Detección de duplicados, validación y calidad de datos (C1.214)

### Contrato y flujo backend
- `createAdmissionRequest` (backend/academic-service/Code.gs:984-1100) se expone en `PUBLIC_ACTIONS` (265). Valida presencia de nombres/apellidos/grado, compara solicitudes del mismo año y escribe en `SolicitudesAdmision`; no llama a `findDuplicateStudents` ni consulta `ExpedientesEstudiantes`.
- `normalizeString` (79-82) es dependencia transversal: minúsculas + NFD/eliminación de diacríticos + trim; no normaliza puntuación ni espacios internos.
- Esquema definido para `ExpedientesEstudiantes`: [ExpedienteID, PersonaID, CodigoInstitucional, FechaNacimiento, Nacionalidad, DireccionResidencia, FotografiaUrl, EstadoExpediente, FechaCreacion, FechaActualizacion, Observaciones]. `findDuplicateStudents` (10107-10217) cruza `Usuarios[0]` con `ExpedientesEstudiantes[1]` (PersonaID), y lee fecha de nacimiento desde índice 7 (EstadoExpediente) en vez del índice 3.
- `findDuplicateStudents` lee `SolicitudesAdmision`, `ExpedientesEstudiantes` y `Usuarios`; clasifica exacta/alta/media y devuelve `candidates`. Coincidencia media usa email O teléfono, no ambos más similitud nominal. Solo excluye Rechazada/Retirada, por lo que estados no activos como Convertida pueden seguir apareciendo.
- `resolveAdmissionDuplicate` (10218-10281) actualiza estado/observaciones/ExpedienteID y registra historial. No valida destino referencial, actor confiable ni lock/idempotencia; su append de historial no usa el contrato canónico.
- `convertAdmissionToStudent` (2156-2380) crea/recupera expediente; busca coincidencia por `Observaciones.includes(identificacion)` y reutiliza ese expediente sin resolución explícita. Esta ruta conecta admisión, expediente, tutor, matrícula y documentos.
- `recordEntityChangeLog` (1568-1595) establece el contrato académico de nueve columnas para `HistorialCambiosEntidad`; el escritor ad hoc de resolución añade ocho columnas con orden incompatible. Relación global existente: AUD-NG-224/TASK-504.

### Seguridad y UI
- RBAC: `validateRolePermission` (524-583) valida token y puede aplicar `getDynamicPermissionsForRole`; `ROLE_PERMISSIONS` diferencia `Secretaría` y `Secretaria`. El estado de la matriz dinámica productiva no se inspeccionó.
- `js/secretary.js` (1228-1355) llama endpoints y renderiza candidatos; campos de nombres, IDs, identificación y motivo se interpolan en `innerHTML` sin escape contextual. `dashboard-secretaria.html` (222-237) contiene el panel; su guard de roles permite también Desarrollador, cuya autorización estática no concede estas acciones.
- `createAdmissionRequest` público devuelve ID de una solicitud preexistente al detectar duplicado; `findDuplicateStudents` devuelve email completo a roles autenticados autorizados, dato que la UI no necesita.
- `checkAdmissionDuplicates` contiene el renderizado; ChangesLogs menciona `renderAdmissionDuplicatesSection`, función no localizada.

### Pruebas y tareas
- `TC-04-DUPLICATE_SEARCH_INTEGRITY` (Code.gs: aprox. 4008) envía `{nombre,dni}` y espera `coincidencias`, incompatible con el contrato `{nombres,apellidos,identificacion}` / `candidates`.
- `tests/regression/academic-grading-suite.js` y `modular-dashboard-suite.js` no contienen referencias a F5-017 ni a sus endpoints.
- Tareas locales F5-017-A01..A07: validación/normalización; matching/bloqueo; revisión manual y destino válido; privacidad/RBAC/render seguro; actor y bitácora; corrección trazable; pruebas conductuales/TC-04. Todas Pendientes; detalles en `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md`.
- Dependencias transversales: AUD-NG-145 (PII/logs), AUD-NG-224/TASK-504 (historial canónico) y AUD-NG-161 (concurrencia/idempotencia de pruebas).
- Dictamen: TAREA-F5-017 NO CUMPLE.


## TAREA-F5-018 - Experiencia multiestudiante y resumen familiar (C1.215)

### Contexto y rutas
- `student-dashboard.html` (SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1) no contiene `family-student-switcher-container`, `family-student-switcher`, `family-consolidated-summary-container` ni `family-applicant-tracking-container`.
- `js/student.js` (SHA e2888cea60322e49a40b89adadb8010489605dcc): guard de rol 25-31; initFamilyStudentSwitcher 184-250; renderFamilyConsolidatedSummary 408-510; openJointPaymentModal/submitJointFamilyPaymentForm 512-657; llamada init 745. El guard solo permite Estudiante/Alumno. El selector sustituye currentUser y localStorage por el DTO del hijo, sin token.
- `js/api.js` (SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9) fetchApi 11-65 solo añade requesterUserId/requesterRole; no añade sessionToken. USER/getUserVerifiedRole exige sessionToken/authToken/token.
- USER ROLE_PERMISSIONS 926-982 no autoriza getFamilyConsolidatedSummary ni submitJointFamilyPayment a Padre/Tutor/Responsable; dispatcher sí contiene los casos 1431-1432. USER/getFamilyConsolidatedSummary 3629-3704 llama getGuardianStudents sin token.
- USER/getGuardianStudents 3480-3578; getOrCreateSheet/RelacionesFamiliares 874 define ocho columnas, updateFamilyLinkPermissions 3463-3478 escribe columna 9, y getGuardianStudents lee r[8] con fallback de todos los permisos true.
- USER/revokeFamilyLink 3442-3461 actualiza la hoja, pero el selector solo consulta al cargar; no hay refresco/invalidez de estado en la UI.

### Integración financiera
- ACCOUNTING `CargosEstudiante` (SHA 38b979d41596b85e888b4a7060b37bbac0840a28, línea 131): CargoID, Fecha, UserId, Concepto, MontoBase, Descuento, MontoFinal, Estado, FechaVencimiento, Observaciones, ClaveUnicaDedupe, BatchId. USER/getFamilyConsolidatedSummary 3664-3668 compara c[1] con UserId, c[6] con Estado y suma c[4]; índices incompatibles. Omite Parcial y no concilia pagos confirmados.
- ACCOUNTING `ComprobantesPago` (línea 134): ComprobanteID, Fecha, UserId, Alumno, CargoID, MontoReportado, MetodoPago, Referencia, ComprobanteUrl, Estado, Observaciones.
- USER/submitJointFamilyPayment 3705-3757 escribe un comprobante a nombre de userIdResponsable y filas en DistribucionPagosConjuntos; no valida propiedad, relación, permiso, cargo ni montos; no exige lock/idempotencia. El resumen no consume DistribucionPagosConjuntos.
- ACCOUNTING/reviewPaymentVoucher 4183-4210 pasa row[2], row[4] y row[5] a recordStudentPayment; para un pago conjunto aplica el total al responsable y al cargo genérico CARGO-CONJUNTO, no a cada hijo.
- USER/getFamilyConsolidatedSummary no agrega calificaciones/tareas/asistencia/avisos; tareasPendientesCount siempre 0. La UI convierte datos ausentes/errores RBAC en ausencia de estudiantes o importes cero.

### Persistencia y seguridad de interfaz
- `js/persistence.js` (SHA 94ac26feb4f7f31f1f3f2a238e164d23be565d94): STORES 10-12 declara nombres fijos; get(store,key) 77-93 recibe el store en primer argumento.
- `js/student.js`: fetchAllActivities 1165-1352 y caché perfil 2671-2700 pasan nombres dinámicos cache_estudiante_dashboard_<userId>/cache_estudiante_profile_<userId> como store, no como key. La primera lectura de dashboard queda fuera del try/finally.
- Selector, resumen y modal de pago interpolan nombres/IDs en innerHTML/atributos sin escape contextual.
- Tests disponibles: academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; sin cobertura F5-018.

### Dependencias/tareas sin duplicación
- F5-018-A01..A05: contexto multiestudiante; resumen/estados; permisos/revocación; pago conjunto; pruebas.
- Ampliar F5-012-A01/A06/A07/A08; F5-009-A03/A04/A05/A08; F5-013-A01/A03/A04/A08/A09/A10.
- Ampliar AUD-NG-036 (relación), AUD-NG-222/TASK-502 (ABAC fail-closed), AUD-NG-133 (idempotencia de pagos), AUD-NG-145 (PII/trazabilidad) y AUD-NG-161 (pruebas de concurrencia). No crear IDs globales paralelos.
- Dictamen F5-018: NO CUMPLE. Cinco tareas locales Pendientes; detalle y criterios en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-018.md.


## C1.216 — TAREA-F5-019: analítica y seguimiento operativo de admisiones

### Ruta de ejecución y autenticación
- dashboard-direccion.html (botón #btn-admission-analytics, línea 36; modal #modal-admission-analytics, líneas 82-171; enlace DOMContentLoaded, líneas 173+) -> js/teacher.js/openAdmissionAnalyticsModal (6-12) -> loadAdmissionAnalyticsData (14-101) -> fetchApi("ACADEMIC", "getAdmissionAnalyticsReport", {anolectivo}) -> js/api.js/fetchApi (11-181) -> POST al microservicio ACADEMIC.
- js/auth.js login handler (146-159) persiste currentUser sin sessionToken; js/api.js (46-57) agrega requesterUserId/requesterRole pero no token. El request F5-019 no incluye token explícito.
- ACADEMIC doPost (671+; case getAdmissionAnalyticsReport en 859) -> validateRolePermission (524+) -> verifySessionToken. getAdmissionAnalyticsReport no está en PUBLIC_ACTIONS (265); ROLE_PERMISSIONS (168+) lo concede a Director y Administrador wildcard. Sin token la consulta se rechaza antes del handler. Ampliar AUD-NG-001.

### Datos y métricas
- ACADEMIC/getOrCreateSheet (84+) inicializa SolicitudesAdmision; esquema (119): SolicitudID, FechaSolicitud, AnoLectivo, GradoSolicitado, NombresAspirante, ApellidosAspirante, Identificacion, FechaNacimiento, NombreResponsable, TelefonoContacto, EmailContacto, EstadoSolicitud, CanalIngreso, Observaciones, ExpedienteID. No incluye FechaActualizacion ni FechaDecision.
- ACADEMIC/createAdmissionRequest (984-1110) persiste los quince campos; updateAdmissionStatus (1928+) cambia EstadoSolicitud y Observaciones sin fecha de decisión/actividad en la fila.
- ACADEMIC/getAdmissionRequests (1113-1159) filtra estado/año/grado y mapea solicitudes; getAdmissionAnalyticsReport (11693-11817) lee toda la hoja y aplica solo anolectivo.
- getAdmissionAnalyticsReport calcula tasaConversionPct = Convertida / totalSolicitudes; debe usar cohorte admitida (Admitida + Convertida) o historial de decisiones. idxFechaMod busca FechaActualizacion/FechaModificacion, pero el esquema default no tiene ninguno; atencionCount queda en cero y el promedio es 0. solicitudesEstancadas usa antigüedad desde FechaSolicitud para Recibida/En_Revision; no consulta documentos, citas ni última actividad.
- El embudo se agrupa solo por GradoSolicitado; no hay dimensión nivel. El UI solo ofrece años 2025/2026; no hay filtros por periodo, nivel, departamento ni grado.

### DOM y exportación
- js/teacher.js 60-90 arma statusGrid/funnelBody/rejectionsList con innerHTML e interpola datos de SolicitudesAdmision (grado, nombre, solicitudId, observaciones). Riesgo de XSS almacenado; ampliar AUD-NG-235 y AUD-NG-145.
- Motivos de rechazo: idxMotivo prioriza Observaciones sobre MotivoRechazo; el esquema predeterminado contiene Observaciones. Solo devuelve Rechazada; no analiza Retirada/abandono y devuelve nombre/ID completos.
- Exportación: getAdmissionAnalyticsReport concatena g.grado en CSV entre comillas sin escape de comillas ni neutralización de prefijos =,+,-,@. UI añade BOM UTF-8 y descarga CSV; no implementa PDF. Ampliar TASK-237.

### Coste y pruebas
- getAdmissionAnalyticsReport ejecuta getDataRange().getValues() y recorre todas las solicitudes en cada llamada; no usa paginación/caché ni mide latencia. getOrCreateSheet puede crear la hoja y encabezados si falta SolicitudesAdmision. No hay evidencia de benchmark ni prueba de solo lectura.
- tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen F5-019/getAdmissionAnalyticsReport. Ampliar AUD-NG-161.
- Dependencias: createAdmissionRequest, updateAdmissionStatus, getAdmissionRequests, getStudentDocuments, getAdmissionInterviews, SolicitudesAdmision, fetchApi, verifySessionToken, ROLE_PERMISSIONS.
- Dictamen: NO CUMPLE. Informe individual: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-019.md. Tareas locales F5-019-A01..A07; reconciliar AUD-NG-001, AUD-NG-235, AUD-NG-145, TASK-237, AUD-NG-161 y TAREA-F5-020. No crear IDs globales duplicados.


## C1.217 — TAREA-F5-020: optimización de consultas, sincronización y capacidad de respuesta

### Admisiones: lectura y paginación
- ACADEMIC getAdmissionRequests (Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, líneas 1113-1175): desestructura estado/anolectivo/grado/solicitudId/page/pageSize/fetchAll; ejecuta getOrCreateSheet("SolicitudesAdmision").getDataRange().getValues().slice(1); filtra toda la colección; aplica slice solo si !fetchAll y page !== undefined; no valida page/pageSize ni limita pageSize.
- SECRETARY js/secretary.js (SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c, líneas 8-25): loadAdmissionRequestsList llama fetchApi('ACADEMIC','getAdmissionRequests',{}) sin page/pageSize; conserva todas las solicitudes en window.allAdmissionRequests y filtra localmente.
- ACADEMIC updateAdmissionStatus (Code.gs:1928-2050): LockService, valida transiciones, actualiza EstadoSolicitud y Observaciones, registra historial y notificación; no llama invalidación de caché.

### Catálogo y caché
- ACADEMIC getAcademicOffers (Code.gs:6132-6177): CacheService ScriptCache con clave offers_v2_{anoId}_{grado}_{seccion}, TTL 600s; si hay cache devuelve _cached:true; al crear se invalida clave exacta y global, además de legacy keys.
- createAcademicOffer (Code.gs:6180-6218): agrega fila OfertaAcademica y elimina solo clave de filtro exacta y clave global. No invalida combinaciones parciales de filtros (año sin grado, año+grado sin sección, etc.).
- ACADEMIC purgeSecurityCaches (Code.gs:3702-3745): elimina user_role_, acct_state_, delegations_, perm_matrix_, dynamic_perms_ y revoked_session_; no elimina offers_v2 ni claves de catálogo.
- USER manageInstitutionalDataCache (Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f, líneas 146-185): INVALIDATE_USER llama invalidateUserRoleCache; FLUSH_GLOBAL solo registra CACHE_FLUSHED y devuelve success; cachePolicies declara CATALOGS_TTL 43200s (12h), FINANCIAL_TTL 0s. No es gestor funcional de caché de catálogos con TTL de 10 minutos.

### Portal familiar y seguridad de entrada
- USER getGuardianStudents (Code.gs:3480-3580): lee getDataRange de ExpedientesEstudiantes, Usuarios y RelacionesFamiliares y filtra/mapea en memoria.
- USER getGuardianApplicants (Code.gs:3583-3627): lee Usuarios y SolicitudesAdmision completos antes de filtrar por responsable.
- USER revokeFamilyLink (Code.gs:3442-3462): actualiza estado y observaciones y registra evento; no llama purgeSecurityCaches.
- student.js (SHA e2888cea60322e49a40b89adadb8010489605dcc, líneas 184-215): Promise.all para getGuardianStudents y getGuardianApplicants; el paralelismo existe, pero no reduce las lecturas completas del backend.
- ACADEMIC doPost (Code.gs:671-700) y USER doPost (Code.gs:1351-1375): comprueban cuerpo presente y parsean JSON; no aplican máximo de bytes ni rate limiting de aplicación antes del despacho.
- js/api.js (SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 11-190): timeout fijo 60.000 ms; no consume options.timeout aunque checkMicroserviceHealth lo proporciona.

### Observabilidad y pruebas
- ACADEMIC getAdmissionRequests registra LATENCY_THRESHOLD_EXCEEDED si duración >2.000 ms. No se observó instrumentación equivalente para USER/getGuardianStudents o USER/getGuardianApplicants.
- tests/regression/academic-grading-suite.js (SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6) incluye assert textual de offers_v2_ y cache.remove, no prueba comportamiento; modular-dashboard-suite.js (SHA 0495e1d526a872c33310935a003a83d924d34683) no tiene F5-020.
- Dictamen: NO CUMPLE. Informe: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-020.md. Tareas locales F5-020-A01..A07; sin IDs globales duplicados.
- Dependencias: SolicitudesAdmision, OfertaAcademica, ExpedientesEstudiantes, Usuarios, RelacionesFamiliares, CacheService, LockService, logStructuredEvent, fetchApi, loadAdmissionRequestsList, initFamilyStudentSwitcher, getAdmissionRequests, getAcademicOffers, updateAdmissionStatus, revokeFamilyLink y purgeSecurityCaches.


## C1.218 - TAREA-F6-001: permisos de controles de expedientes duplicados

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-001.md  
**Dictamen:** NO CUMPLE. **HEAD auditado:** ae5dea9f7d342df58a5db393e66691d8249f892e.

### Ruta frontend
- teacher-dashboard.html (SHA cbb9e6a272a7d8ad33f99727303305d950533e71, líneas 1464-1466) carga ui-common.js y teacher.js, pero no declara #modal-student-file ni #tab-stfile-duplicates.
- js/teacher.js (SHA c475fce5afcd28fca23e7b64398ad32b17773746, líneas 7877-7880): openStudentFileModal retorna si falta el modal.
- js/teacher.js:135-145: RoleCapabilities es allowlist local; currentUser se captura una vez.
- js/teacher.js:7922-7935: gate visual; :7999-8020 switchStudentFileTab sin autorización.
- js/teacher.js:8295-8350: handlers scan/merge sin revalidación individual.
- js/auth.js (SHA 8444dd085a3186106d2db7005b61ef934d3c22d8, líneas 146-157) descarta sessionToken; js/api.js (SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 39-58) no lo transmite.

### Ruta backend
- backend/academic-service/Code.gs (SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, líneas 168-243): ROLE_PERMISSIONS; Administrador *, Director detección+fusión, Secretaria/Subdirector detección sin fusión, Coordinador/Desarrollador/Profesor sin ambas acciones en matriz estática.
- Code.gs:524-620: validateRolePermission/getDynamicPermissionsForRole; matriz dinámica y delegaciones pueden cambiar permisos, pero la UI no las consulta y la hoja productiva no se verificó.
- Code.gs:671-681 y 866-867: doPost valida antes de despachar findDuplicateStudents/mergeStudentFiles.
- Code.gs:10107-10208: findDuplicateStudents recibe nombres/apellidos y devuelve candidates con id/coincidencia.
- Code.gs:10282-10330: mergeStudentFiles exige targetExpedienteId/sourceExpedienteId.

### Contratos y autenticación
- js/teacher.js:8304-8325 espera res.data/studentId/userId/motivoCoincidencia; backend entrega candidates/id/coincidencia/nivelCoincidencia.
- js/teacher.js:8336-8339 envía targetStudentId/sourceStudentId; backend exige targetExpedienteId/sourceExpedienteId.
- USER loginUser emite sessionToken; auth.js lo omite y api.js no lo transmite. Se amplía AUD-NG-001.
- Se amplían AUD-NG-160 y AUD-NG-221/TASK-501; contratos coordinados con TAREA-F5-017 y TAREA-F6-019.

### Pruebas y estado
- academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: sin pruebas específicas F6-001.
- Runtime/browser/Apps Script y matriz productiva no ejecutados.
- Tareas locales F6-001-A01..A06 pendientes.
- Código, tests, completadas.md, Pendientes.md y ChangesLogs.txt sin cambios.


## C1.219 - TAREA-F6-002: ciclo de vida y consistencia de matrículas

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-002.md  
**Dictamen:** NO CUMPLE. **HEAD auditado:** 8c492238f99f7902c7468b06676aab819f9eab35.

### Backend ACADEMIC
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS:1546-1553; updateStudentLifecycleStatus:12157-12196 aplica matriz, pero transfer/withdrawal/reentry/promotion/graduation la omiten.
- checkAndRegisterIdempotencyKey/saveIdempotentResult:279-318; token opcional, caché 6h, sin reserva atómica previa.
- checkEnrollmentCapacity:11147-11243; tryLock fallido no detiene lectura.
- createStudentEnrollment:11271-11351; valida duplicado estudiante/año, pero permite matrícula sin expediente y no valida periodo destino.
- renewStudentEnrollment:11381-11395.
- changeStudentSection:11403-11480; bloquea terminales seleccionados, pero no Inactivo/Suspendido; muta fila de matrícula antes de anexar movimiento.
- recordStudentTransfer:11819-11885; marca Trasladado aun con estadoTramite Solicitado; no exige matrícula/expediente existente.
- recordStudentWithdrawal:11888-11954; Temporal/Definitivo reciben misma transición.
- processStudentReentry:11957-12019; expediente Activo antes de crear matrícula; movimientos repetibles.
- processStudentPromotion:12022-12082; anoLectivoCerrado no utilizado; no consulta resultados; no comprueba status de createStudentEnrollment.
- processStudentGraduation:12085-12154; no verifica requisitos configurados; actualiza matrículas activas de todos los años.
- reconcileStudentLifecycleState:12199-12248; sin lock y solo corrige terminales con matrículas activas.

### UI y acceso histórico
- js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html fa0d8c23aace24a6acab2d4956398a7f5e1309b8: no se encontraron llamadas/controles de las operaciones de ciclo de vida declaradas.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71: no se encontraron llamadas a los endpoints de ciclo de vida.
- getStudentFile:2510-2614 devuelve expediente, matrículas y movimientos sin excluir estado Graduado; acceso histórico parece conservarse estáticamente.

### Pruebas
- runStudentLifecycleRegressionSuite:3965-4081; TC-07 solo acepta success/error y no mide duplicados ni concurrencia; TC-06 valida forma de respuesta, no inmutabilidad.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: sin casos F6-002.
- No se ejecutaron Apps Script, navegador, Google Sheets, concurrencia ni fallos simulados.

### Tareas derivadas
- F6-002-A01..A10 pendientes; ver informe individual.
- TAREA-F6-003 queda como dependencia de suite general; no se duplica ID.


## C1.220 - TAREA-F6-003: batería automatizada de regresión del ciclo de vida del estudiante

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-003.md  
**Dictamen:** NO CUMPLE. **HEAD auditado:** e1de4306ab4ddeb7de91494f96c17e695f5e8b69.

### Backend académico y seguridad
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- SPREADSHEET_ID fijo:5; ROLE_PERMISSIONS:168; PUBLIC_ACTIONS:265; validateRolePermission:524; despacho suite:892.
- runStudentLifecycleRegressionSuite: línea 3964; siete casos TC-01..TC-07.
- TC-04 usa {nombre,dni}, pero findDuplicateStudents:10107 espera nombres/apellidos/identificacion/fechaNacimiento/email/telefono/solicitudId.
- TC-07 llama createStudentEnrollment:11271 con userId sintético y skipLock:true, una sola vez; admite success/error y no verifica conteos.
- Suite registra LogsSistema por logStructuredEvent; no hay entorno de prueba ni aislamiento de SpreadsheetApp.
- runConcurrencyAndConsistencySuite:3296 solo adquiere/libera un lock una vez; no crea contención.
- validateApiContractsTestSuite aprox. 3900 valida cuatro contratos simples.
- runCurricularAreaServiceTests:4147 construye resultados PASS constantes.
- findDuplicateStudents:10107; mergeStudentFiles:10282; getStudentGuardians:10553; uploadStudentDocument:10693; checkEnrollmentCapacity:11147; createStudentEnrollment:11271; getStudentFile:2510; reconcileStudentLifecycleState:12199.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28; backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.

### Scripts y cobertura
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6: 412 líneas; no contiene F6-003 ni casos de ciclo de vida.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: no cubre ciclo de vida.
- Árbol completo 985 entradas; solo dos scripts en tests/regression; no package.json, runner de pruebas ni CI identificado.
- RF1-RF7: cobertura insuficiente; CA-016..CA-021 no cumplen; CA-022 parcial.
- No se ejecutó suite por riesgo de escritura productiva. Ver informe individual.

### Tareas derivadas
- F6-003-A01..A09 pendientes: entorno aislado; corregir pruebas existentes; concurrencia/idempotencia; expediente/fusión/tutores/documentos; matrículas/movimientos; autorización directa; fallos/reintentos; reporte completo; runner/CI.


## C1.221 - TAREA-F6-004: reestructuración en microservicios independientes

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-004.md  
**Dictamen:** NO CUMPLE. **HEAD inicial:** 18d42543774e7c289126cb2f06f9145e20d5d841.

### Configuración y almacenamiento
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc, líneas 224-345: SERVICE_URLS contiene URLs marcadoras para ACCOUNTING/DEVELOPER; SERVICE_REGISTRY usa IDs de Spreadsheet/Drive ficticios, healthStatus ACTIVE y versión v8.4.0 para todos.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28; backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c: los cinco declaran el mismo SPREADSHEET_ID 1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: SPREADSHEET_ID es 1DEVELOPER-CONTROL-PLANE-SPREADSHEET-ID, marcador.
- TASK-046 ya documenta resolver parcial y fuente compartida; ampliar TASK-046/F23-Task02, no duplicar.

### Registro y contratos
- getCentralServiceRegistry:2415-2470; registerServiceInstance:2473-2527; no se exige projectId ni endpoint y el registro por defecto carece de endpoint real.
- validateServiceConfigDependencies:2286-2305; Boolean(spreadsheetId || true) y Boolean(driveFolderId || true) siempre son true.
- getCentralConfigAndContractCatalog:2262-2285 solo enumera actions/version; validateMonolithDecompositionContracts:1799-1885 acepta validContracts desde payload sin comparar dispatchers.
- getServiceVersionChangelog:2308-2322 devuelve v8.4.0/v2.1 para cualquier serviceId.
- TASK-047/F23-Task10 y AUD-NG-078..082 se amplían; sin nuevo ID global.

### API, autenticación y salud
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi:11-24 usa SERVICE_URLS; checkAllMicroservicesHealth:240-250 solo incluye USER/ACADEMIC/TASK/EXAM; fallback get*:145-205 puede retornar status success con isFallback.
- ChangesLogs.txt:1949-1951 afirma resolución dinámica vía SERVICE_REGISTRY, pero el código no lo hace.
- developer-service doPost:145-175 confía authRole sin token (AUD-NG-082); HMAC helpers no integrados (AUD-NG-083); fallback de secreto determinista (AUD-NG-084); autorización interservicio incompleta (AUD-NG-086).
- getServiceHealthDiagnostics:2599-2618 devuelve PASS/HEALTHY sin probar conectividad ni permisos. auditServiceBackendIsolationAndDriveSecurity:1353-1382 declara aislamientos hardcodeados.
- runFullArchitectureIntegrationAndPerformanceSuite:2132-2206 y runModularAndDynamicDashboardsRegressionSuite:2040-2114 solo verifican catálogos/diagnóstico local, no deployments reales.

### Tareas derivadas
- F6-004-A01..A06 pendientes; ver informe individual.
- Se amplían TASK-046, TASK-047, TASK-048, F23-Task02/07/10, AUD-NG-082..086, AUD-NG-174, TAREA-F6-009 y TAREA-F6-003-A09. No duplicar IDs globales.
- No se ejecutaron llamadas HTTP, Apps Script, pruebas multi-cuenta ni pruebas contra datos productivos.


## C1.222 - TAREA-F6-005 / TAREA-F6-030: servicios administrativos y financieros

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-030.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** c578aecb7503cdfe7e942a1e927b2416dcb0d739.

### Dependencias administrativas y académicas
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - getStudentFile:2510-2600 devuelve matrículas, tutores, documentos y movimientos, no cargos/pagos/facturas.
  - registerStudentEnrollment:12800-12875 escribe directamente CargosEstudiante, fuera del flujo contable.
  - initializeDirectionSecretaryDriveStructure:4246-4278 crea Direccion/Secretaria/Compartido, pero no aplica ACL ni usa lock.
  - doPost:871 enruta initializeDirectionSecretaryDriveStructure; la acción no aparece en ROLE_PERMISSIONS, contradiciendo ChangesLogs:2130-2136.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - roles Director/Secretaría:926-982; generateSessionToken:1065-1085 contiene un único role.
  - assignRoleScope/getInternalRoleAssignments guardan ámbitos, pero no se integran en el claim/validación contable.
  - getUserDynamicDashboardConfig:9270-9305 utiliza rol principal.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: manageUserMultiRolePermissions:2585-2596 solo devuelve roles/áreas recibidos.

### Servicio contable y Drive
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28, 17.740 líneas.
- createAdmissionCharge:2398-2421 no cierra función ni crea cargo nuevo; processPaymentReceipt no existe.
- recordStudentPayment:3891-3965 conserva brechas AUD-NG-133.
- reviewPaymentVoucher/generatePaymentReceiptPDF:4183-4260 cambia estado antes de pago y devuelve JSON, no PDF.
- createFiscalInvoice:4357-4575 guarda reciboCajaId opcional sin validar relación.
- getParentDriveFolder/getOrCreateFolder:101-113 puede usar Drive root; initializeFinancialDriveStructure:10147-10197 crea subcarpetas sin ACL.
- uploadPaymentVoucher:4110-4122 y uploadEmployeeDocument:5946-5957 almacenan fuera de la jerarquía y aplican ANYONE_WITH_LINK.
- ROLE_PERMISSIONS:196-215 no incluye Secretaría; validateRolePermission:434-484 usa claims.role único.

### Hallazgos y tareas
- H1 P0: sintaxis y creación de cargos.
- H2 P0: integridad cargo/pago/factura/recibo y PDF.
- H3 P0: privacidad/ACL de Drive.
- H4 P1: multirol y contexto de autorización.
- H5 P1: módulos/subáreas hardcodeados y sin aislamiento.
- H6 P1: carpetas Dirección/Secretaría sin permisos; acción no autorizada en ROLE_PERMISSIONS.
- H7 P1: trazabilidad de transacciones incompleta.
- H8 P1: pruebas E2E no acreditadas.
- Se amplían F5-013, AUD-NG-132..135 y AUD-NG-055..065. No se crean IDs globales duplicados.
- Tareas canónicas F6-005-A01..A06 pendientes; F6-030 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron Apps Script, HTTP, Drive/Sheets productivos, facturación SAR, pruebas multirol, concurrencia ni E2E.


## C1.223 - TAREA-F6-006 / TAREA-F6-031: plantilla académica multiárea

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-031.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** 4271c00e2eeb47143a91ebeaca5e45ea0421972b.

### Catálogo, configuración e instancias
- academic-service Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - getAcademicAreaTemplateCatalog:4281-4320 define siete defaultAreas con nombres/IDs/códigos hardcodeados; serviceUrl vacío y tools [].
  - registerCurricularAreaExtension:4080-4146 permite extensiones, pero sin unicidad/versionado suficiente.
  - runCurricularAreaServiceTests:4147-4202 devuelve cuatro PASS constantes y activa el área.
  - deployAcademicMicroserviceInstance:4494-4575 solo registra metadatos; scriptId/driveFolderId vacíos permitidos, spreadsheetId usa el ID compartido, connectivityCheck PASS constante, Estado Activo.
  - getAcademicAreaCoordinationScope:4321-4355 puede devolver todas las coordinaciones si no se filtra; scope solo área/tipo/fechas.
  - createSubjectCatalogItem:6011-6065 usa ASIG-Date.now y areaAcademica texto libre.
  - createAcademicOffer:6180-6235 usa OFE-Date.now, grado/sección como texto y no enlaza areaId/instanceId.
  - assignTeacherToAcademicArea:14180-14315 actualiza asignación activa in-place y scope sin materia/grado/sección/periodo.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc contiene doce áreas y ocho departamentos; no coincide con el seed backend de siete.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 usa SERVICE_URLS estáticos; no enruta por areaId/instanceId.

### Tareas, exámenes y autorización
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe: getStudentTasks/getAllTasks son PUBLIC_ACTIONS; getStudentTasks acepta userId/grado/sección del payload; getAllTasks no exige profesorId.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c: getStudentExams/getAllExams son PUBLIC_ACTIONS; filtros individuales del cliente; getAllExams no exige profesorId.
- ACADEMIC/TASK/EXAM comparten el mismo SPREADSHEET_ID; no se observa aislamiento por área/instancia.
- AUD-NG-002, AUD-NG-011, AUD-NG-158, AUD-NG-164, AUD-NG-149, AUD-NG-165, AUD-NG-167, AUD-NG-168 y AUD-NG-124 se amplían; no se crean IDs globales duplicados.

### Hallazgos y tareas
- H1 P1: catálogo hardcodeado y divergente.
- H2 P0: despliegue de metadatos, sin proyectos/recursos reales.
- H3 P1: relaciones incompletas e historial mutable.
- H4 P0: consultas públicas TASK/EXAM y falta de aislamiento.
- H5 P1: coordinación sin enforcement por ámbito.
- H6 P1: frontend/backend sin routing por instancia.
- H7 P1: pruebas PASS simuladas.
- H8 P1: falta de E2E.
- Tareas canónicas F6-006-A01..A06 pendientes; F6-031 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron Apps Script, HTTP, despliegues, Drive/Sheets productivas, matrículas reales, concurrencia ni E2E.


## C1.224 - TAREA-F6-007 / TAREA-F6-032: despliegue de microservicios académicos

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-007.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-032.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** 510ddbe23393771e74e5652d52fab0fd40099e3d.

### Despliegue y configuración
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - deployAcademicMicroserviceInstance:4494-4575 solo actualiza InstanciasMicroserviciosAcademicos; scriptId/driveFolderId vacíos permitidos; spreadsheetId usa base compartida; connectivityCheck PASS y Estado Activo constantes.
  - getAcademicMicroserviceDeployments:4650-4685 solo lee metadatos, sin deploymentId/URL ni historial.
  - configureAcademicLevelsAndDynamicStorage:4576-4649 crea carpetas por rol/usuario y niveles en hoja global; no ACL, no recursos por instancia; responsibilities sin uso; areaId/coordinationType solo log.
  - runCurricularAreaServiceTests:4147-4202 devuelve PASS constantes y activa el área.
  - toggleCurricularAreaStatus:4206-4245 permite Activo/Inactivo sin puerta de pruebas.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e y js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331 no contienen formulario/handlers de despliegue.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: líneas 214-215 mantienen procedimiento manual de crear Apps Script y copiar Code.gs.
- No se encontró aprovisionamiento real por Apps Script API ni deploymentId/endpoint URL en los componentes inspeccionados.

### Hallazgos y tareas
- H1 P0: registro de metadatos presentado como despliegue real.
- H2 P0: dashboard sin flujo de despliegue.
- H3 P1: sin estados, reanudación, rollback ni OAuth.
- H4 P1: almacenamiento por rol/usuario sin ACL ni aislamiento de instancia.
- H5 P1: sin historial/versionado.
- H6 P1: actor y rol enviados por payload, no verificados.
- H7 P1: coordinaciones/responsabilidades no configuradas realmente.
- Se amplían AUD-NG-011, AUD-NG-164 y AUD-NG-158; no se crean IDs globales duplicados.
- Tareas canónicas F6-007-A01..A06 pendientes; F6-032 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron Apps Script API, OAuth, creación de proyectos, deployments, Drive/Sheets productivas, concurrencia ni E2E.


## C1.225 - TAREA-F6-008 / TAREA-F6-033: plano de control central y registro de servicios

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-008.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-033.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** df861afda6dea6b063a8b2702e466a0b838ea0ae.

### Registro central
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - getCentralServiceRegistry:2415-2472 devuelve seis servicios hardcodeados Activos si el catálogo está vacío o falla; defaults comparten Spreadsheet y omiten endpoint/Drive/dependencias/lastContact.
  - registerServiceInstance:2473-2530 permite endpoint vacío, Spreadsheet compartido y permisos ["*"] por defecto.
  - updateServiceStatus:2531-2574 guarda historial, pero solo una columna state y updatedBy del payload.
  - auditInterServiceCalls:2575-2584 retorna auditLogs vacío.
  - manageUserMultiRolePermissions:2585-2600 devuelve roles/áreas recibidos sin persistir.
  - executeOperationalCommand:2387-2415 usa allowlist, pero devuelve resultado sintético.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: recordTraceabilityLog:4548-4615 persiste una fila, pero no se invoca automáticamente.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: validateApiContractsTestSuite:3915-3985 prueba funciones locales y permite status:error como PASS.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: timeout 60s, dos reintentos, SERVICE_URLS estáticos; sin correlationId/idempotencyKey.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e y js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331 no contienen UI/handlers del registro.

### Contrato y dependencias
- createInterServiceEnvelope/verifyInterServiceEnvelope existen en developer/user/academic, pero no hay llamadas desde fetchApi/doPost.
- Servicios operativos usan SERVICE_URLS directos; no se identificó dependencia obligatoria de getCentralServiceRegistry.
- AUD-NG-078, 082, 083, 084, 086, 007 y 158 se amplían; no se crean IDs globales duplicados.

### Hallazgos y tareas
- H1 P1: registro central incompleto y falsos Activos.
- H2 P0: correlationId/HMAC no integrados.
- H3 P1: retries sin idempotencia.
- H4 P0: multirol no persistido ni aplicado.
- H5 P1: dashboard sin administración del registro.
- H6 P1: trazabilidad y pruebas de contrato no verifican interoperabilidad.
- H7 P2: comandos allowlist seguros pero simulados.
- H8 P1: independencia arquitectónica sin prueba de caída.
- Tareas canónicas F6-008-A01..A06 pendientes; F6-033 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron llamadas interservicio, pruebas HTTP, caída del control plane, OAuth, idempotencia ni E2E.


## C1.226 - TAREA-F6-009 / TAREA-F6-034: salud, diagnóstico, métricas y errores

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-009.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-034.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** d44b7131773aac442a74e66549563a408122850a.

### Salud y cobertura
- USER/ACADEMIC/ACCOUNTING tienen ping, pero devuelven dbConnected:true constante.
- TASK/EXAM no tienen ping; DEVELOPER tampoco.
- Solo ACADEMIC/DEVELOPER exponen getServiceHealthDiagnostics; DEVELOPER devuelve PASS constante y ACADEMIC fija connectivity/permissions y solo comprueba Spreadsheet y Drive root.
- USER/getServiceHealthReport usa LogsSistema, versiones fijas y errores acumulados.
- checkAllMicroservicesHealth cubre USER/ACADEMIC/TASK/EXAM; TASK/EXAM carecen de ping y ACCOUNTING/DEVELOPER no se monitorizan.
- js/teacher.js incluye ACCOUNTING, pero TASK/EXAM no responden ping y DEVELOPER se omite.
- fetchApi usa 60s fijos; options.timeout=6000 no se aplica.

### Métricas y logs
- USER/getOperationalCapacityMetrics agrega BitacoraTrazabilidad sin cobertura automática de cada solicitud; no mide todas las cuotas/GAS.
- ACADEMIC capacityUsagePct=15.5 fijo; TASK hace consulta puntual de Drive; EXAM mide filas/lectura.
- USER/ACADEMIC/ACCOUNTING tienen logger estructurado; TASK/EXAM no presentan el mismo logger.
- recordStructuredLog no existe en dispatcher USER aunque js/api.js lo llama.
- getStructuredLogs devuelve DTO inglés y filtros severity/startDate/endDate; UI envía severidad/servicio/limit y espera campos españoles.
- sanitizePayloadForLog solo oculta algunas claves de credenciales; no PII/finanzas ni message.
- developer.js muestra fallbackLogs; getCentralizedLogs devuelve sampleLogs y resolveLogId no persiste.
- No hay mapa común de endpoints/contratos/dependencias.

### Hallazgos y tareas
- H1 P0: contrato de salud ausente en todos los servicios.
- H2 P1: diagnósticos parciales o PASS constantes.
- H3 P1: monitor incompleto y timeout no aplicado.
- H4 P1: métricas incompletas y valores fijos.
- H5 P0: logs estructurados no uniformes.
- H6 P0: sanitización insuficiente.
- H7 P1: DTO/filtros rotos y datos simulados.
- H8 P1: falta mapa de dependencias y diagnóstico de causa.
- Se amplían AUD-NG-144, AUD-NG-145, AUD-NG-163, AUD-NG-086, AUD-NG-083, AUD-NG-007 y AUD-NG-084; no se crean IDs globales duplicados.
- Tareas canónicas F6-009-A01..A06 pendientes; F6-034 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron HTTP, Apps Script runtime, cuotas reales, Drive/Sheets productivas, E2E ni pruebas de indisponibilidad.


## C1.227 - TAREA-F6-010 / TAREA-F6-035: administración segura de logs y comandos

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-010.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-035.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** d28540e54020f7a7a0faee89db8e8466cd562d8d.

### Logs y retención
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - getCentralizedLogs:2363-2385 devuelve dos sampleLogs y resolveLogId solo simula resolución.
  - executeOperationalCommand:2388-2415 valida allowlist, pero no ejecuta handlers ni persiste resultados.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - purgeStructuredLogs:7967-7990 elimina todas las filas de LogsSistema sin corte/confirmación/protección.
  - getRetentionPolicies/saveRetentionPolicy/executeDataRetentionPolicyCheck:2120-2270; el motor purga BitacoraEventos de forma parcial y contabiliza archivo legal sin archivarlo; purgeStructuredLogs ignora las políticas.
  - runSystemMaintenance no existe aunque js/api.js y js/developer.js lo invocan.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331: consulta USER/getStructuredLogs; no tiene resolución persistente ni cola de comandos.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e: filtros y botón de mantenimiento, sin confirmación de purga ni estados de cola.

### Hallazgos y tareas
- H1 P0: logs centrales simulados y resolución no persistente.
- H2 P0: purga total de LogsSistema, sin protección ni confirmación.
- H3 P1: catálogo cerrado, pero handlers simulados.
- H4 P0: no existe cola, cancelación, estados ni runSystemMaintenance.
- H5 P0: no hay idempotencia ni permisos por comando.
- H6 P1: no hay auditoría persistente de ejecución.
- H7 P1: dashboard incompleto.
- Se amplían AUD-NG-145, AUD-NG-082, AUD-NG-086 y AUD-NG-083; no se crean IDs globales duplicados.
- Tareas canónicas F6-010-A01..A06 pendientes; F6-035 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron purgas, cambios de políticas, mantenimiento, comandos ni pruebas productivas.


## C1.228 - TAREA-F6-011 / TAREA-F6-036: respaldos y recuperación por área

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-011.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-036.md  
**Dictamen:** NO CUMPLE en ambas. **HEAD inicial:** 8c5ac21347def05c729a9eb498f90152fe1ec968.

### Ruta de backup/restore
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - dispatcher:690-715 registra createSystemBackup/listSystemBackups/verifyBackupIntegrity/restoreSystemBackup/reconcileRestoredDataIntegrity.
  - previewBackupRestoreImpact:3174-3220 verifica checksum y cuenta filas; no simula en entorno aislado.
  - computeSimpleHash:12254-12262 es hash aritmético 32-bit; getBackupFolder:12265-12270 usa raíz Drive global.
  - createSystemBackup:12274-12320 exporta todas las hojas del SPREADSHEET_ID ACADEMIC, sin serviceId/areaId.
  - listSystemBackups:12321-12346 enumera archivos y omite checksum/servicio/alcance/estado.
  - verifyBackupIntegrity:12347-12405 acepta cualquier checksum no vacío y no invalida enlaces Drive rotos.
  - restoreSystemBackup:12406-12462 no invoca verify/preview, limpia hojas y escribe sin lock/rollback.
  - reconcileRestoredDataIntegrity:12463-12504 solo inspecciona CalificacionesEstudiantes e HistorialAcademico y no bloquea.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: no implementa createSpreadsheetBackup/getBackupsList/restoreSpreadsheetBackup.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412 y backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28: no implementan backup/restore por servicio.
- No se encontraron ScriptApp.newTrigger/timeBased en ACADEMIC/USER/DEVELOPER/ACCOUNTING.

### Frontend
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: previewAndVerifyBackupRestore:2170-2190; gestor:2680-2800. Restore envía confirmationCode, no confirmed/confirmCode; preview no es obligatorio.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: wrappers createBackup/getBackupsList/restoreBackup/runMaintenance:285-310 llaman acciones USER inexistentes o createSpreadsheetBackup no implementada.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331: loadBackupsList:306-334 muestra backup mock EXITOSO; render/handlers 336-480 esperan DTO distinto al backend.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e: selector 330-365 solo USER/ACADEMIC.

### Hallazgos y trazabilidad
- H1 P0: checksum no criptográfico y bypass Boolean(storedChecksum).
- H2 P0: restore destructivo sin verificación previa/compatibilidad, clear() de hojas y sin lock/rollback.
- H3 P0: backup global ACADEMIC, sin serviceId/areaId, ACL ni storage aislado.
- H4 P1: no hay catálogo central de backup con checksum/estado/alcance.
- H5 P1: no hay programación, retención, rotación ni capacidad.
- H6 P1: preview no simula ni bloquea referencias rotas.
- H7 P1: contrato frontend/backend incompatible y mocks.
- H8 P1: reconciliación referencial incompleta y no obligatoria.
- H9 P2: sin pruebas específicas ni runbook.
- Se amplían AUD-NG-146, AUD-NG-011 y AUD-NG-086; no se crean IDs globales duplicados.
- Tareas canónicas F6-011-A01..A06 pendientes; F6-036 referencia el mismo bloque.

### Estado de pruebas
Inspección estática/manual. No se ejecutaron Apps Script runtime, HTTP, triggers, Drive/Sheets productivas, restauraciones, concurrencia, E2E ni simulación aislada.


## Auditoría F6-012 / F6-037 - Seguridad, aislamiento y permisos (2026-11-07)

**Sesión:** IMA-AUDIT-20261107-2055Z-01 | **HEAD inspeccionado:** 813feb3285747cd73ed6f159e9125559ec45ce0e | **Dictamen:** NO CUMPLE.

### Identidad y sesión
- USER generateSessionToken (1065-1083) emite un solo claim role; loginUser (2479-2535) usa Usuarios[6]. auth.js (146-159, 227-239) omite sessionToken y api.js (11-48) no lo transmite.
- USER PUBLIC_ACTIONS (922-928) contiene logoutUser; logoutUser (2456-2474) acepta userId/sessionId del payload y llama revokeUserSession (2318-2333), que escribe marcadores sin verificar propiedad.
- DEVELOPER doPost (145-175) acepta authRole sin token; ROLE_PERMISSIONS (27) da wildcard a Administrador. verifySessionToken (115-143) no exige exp ni comprueba revocación/estado. getAuthTokenSecret (41-51) tiene fallback derivado de constante versionada.
- DEVELOPER manageUserMultiRolePermissions (2585-2596) solo devuelve roles/áreas recibidos, sin persistencia ni enforcement.

### Microservicios e IDOR
- TASK PUBLIC_ACTIONS (85-89) contiene getStudentTasks/getAllTasks; getStudentTasks (613-690) acepta userId/grado/seccion de payload sin claim; getAllTasks (1177-1203) lista globalmente.
- EXAM PUBLIC_ACTIONS (75-78) contiene getStudentExams/getAllExams; getStudentExams (1057-1103) depende de identidad/curso del payload; getAllExams (609-632) lista globalmente.
- EXAM getExamResult (1105-1170) recupera por entregaExamenId y devuelve respuestas correctas/calificación sin ownership check; el rol Estudiante tiene permiso estático.
- ACADEMIC validateContextualAccess (465-523) aplica scopes solo si llegan scopeType/requestedValue; catches vacíos permiten continuar. Coordinador solo se verifica si llega areaId. ACCOUNTING/TASK/EXAM comprueban campos de identidad limitados y no scopes universales.

### Multirol, ámbitos, revocación y comandos
- USER assignRoleScope (9117-9181) guarda ámbitos, no múltiples roles efectivos; no valida roleId contra CatalogoRolesInternos. getUserScopeConfig/validateRoleScopeAccess (9183-9251) no son guard transversal; getInternalRoleAssignments (9767-9807) no integra claims.
- USER createPerson/linkPersonAccount (1663-1705) no demuestra restricción de unicidad Persona-Cuenta.
- USER revokeUserSession (2318-2333) y savePermissionMatrix (1934-1978) invalidan cachés solo en USER. Otros servicios tienen CacheService de script propio. ACADEMIC purgeSecurityCaches (3702-3740) elimina revoked_session_ al recibir sessionId. DEVELOPER no verifica revocación.
- DEVELOPER executeOperationalCommand (2388-2414) valida allowlist pero no permiso por comando/ámbito/recurso; respuesta sintética. USER tiene logger que enmascara claves sensibles en payload, pero la atribución de actor no deriva siempre de claims.

### Pruebas y reconciliación
- Suites: academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; no incluyen escenarios auth/IDOR/RBAC/ABAC/revocación/F6-012/F6-037.
- No se encontraron archivos dedicados a seguridad/auth/permissions/IDOR en tests.
- Registros ampliados: AUD-NG-001, AUD-NG-002, AUD-NG-086, AUD-NG-145, AUD-NG-221/TASK-501, AUD-NG-222/TASK-502 y AUD-NG-225/TASK-505.
- Tareas canónicas: F6-012-A01..A07; F6-037 amplía los mismos IDs con CA-113..CA-120 y CA-161..CA-165. Ver informe F6-012.


## Versionado, migraciones y rollback - auditoría C1.230 (2026-11-07)

**Tareas:** F6-013 y ampliación F6-038. **Dictamen:** NO CUMPLE. **HEAD inspeccionado:** 27ad5d7e6f6b1f3c8bcf774cb6c93a7eea5fc2c9. **Sesión:** IMA-AUDIT-20261107-2111Z-01.

### Plano de control DEVELOPER
- ROLE_PERMISSIONS/doPost:23-207 expone acciones getServiceVersionChangelog, executeServiceVersionRollback y migrateSpreadsheetSchema, pero su presencia en dispatcher no demuestra su operación.
- recordProvisioningHistory:1286-1302 genera un objeto de historial en memoria; no persiste.
- provisionRoleSpreadsheet:1304-1348 genera un ID sintético 1SP_* y no crea un Spreadsheet real.
- migrateSpreadsheetSchema:1430-1474 solo inserta hojas inexistentes; no valida versión/headers, no lleva ledger, omite error de openById y puede devolver success sin cambios.
- validateMonolithDecompositionContracts:1799-1885 acepta contratos aportados en payload.
- validateStagedMigrationProgress:1967-2037 declara rollbackProcedureReady=true sin comprobarlo y marca etapas por respuestas superficiales.
- runModularAndDynamicDashboardsRegressionSuite:2040-2114 y runFullArchitectureIntegrationAndPerformanceSuite:2132-2206 no despliegan servicios ni prueban migraciones/rollback reales.
- getCentralConfigAndContractCatalog:2262-2285 solo lista acciones y asigna v8.4.0 estático a todos.
- validateServiceConfigDependencies:2286-2305 fuerza PASS mediante expresiones Boolean(... || true).
- getServiceVersionChangelog:2308-2322 devuelve v8.4.0/v2.1 y v8.3.0/v2.0 para cualquier serviceId.
- executeServiceVersionRollback:2325-2350 solo valida campos y confirmación; devuelve codeRestored/schemaRestored/dataIntegrityVerified=true sin ejecutar restauración.
- getCentralServiceRegistry:2415-2477 devuelve defaults v8.4.0/Activo y fallback success; registerServiceInstance:2479-2527 acepta endpoint vacío, Spreadsheet compartido y wildcard; updateServiceStatus:2531-2585 solo registra cambio de estado.

### Servicios y datos
- Versiones de cabecera: USER Code.gs:1-4 v8.2.0; ACADEMIC:1-4 v8.4.0; ACCOUNTING:1-4 v8.0.0; DEVELOPER:1-4 v8.4.0; TASK/EXAM sin versión declarada. Los doGet de servicios no exponen versión de código/esquema/configuración.
- js/config.js:213-242 contiene instrucciones manuales y SERVICE_URLS; 245-315 declara todos los servicios v8.4.0/ACTIVE con recursos ficticios. js/api.js:11-48 resuelve por SERVICE_URLS y no hace handshake de versión.
- ACADEMIC deployAcademicMicroserviceInstance:4494-4560 solo guarda metadatos; scriptId/driveFolderId opcionales, Spreadsheet compartido, PASS y Activo constantes. getAcademicMicroserviceDeployments:4650-4680 solo lee el registro.
- ACADEMIC executeCurricularMigration:3130-3165 no usa equivalenciasMap ni modifica datos; devuelve success en modo real con modificacionesEfectuadas=0.
- ACADEMIC reconcileRestoredDataIntegrity:12463-12512 solo revisa CalificacionesEstudiantes e HistorialAcademico, fija reconciliacionCompletada=true y no se invoca desde restoreSystemBackup. verifyBackupIntegrity:12347-12395 acepta cualquier checksum no vacío. F6-011-A01/A04 ya cubren el arreglo del checksum y la reconciliación referencial; se mantienen como dependencias de rollback/migración.
- ACADEMIC validateApiContractsTestSuite:3915-3958 solo prueba cuatro acciones locales y cuenta status:error como PASS.
- ACCOUNTING evaluateTransactionalStorageMigrationNeed:10304-10350 solo recomienda migración según métricas; no ejecuta migración.
- developer-dashboard.html y js/developer.js no contienen UI/handlers de changelog, versionado, migración ni rollback.

### Dependencias, documentos y pruebas
- docs/architecture/staged-migration-procedure.md SHA 2b46af3095596fcd7a9744e4cc500b50b38a34f0 describe un procedimiento manual que llama al rollback, no una implementación ejecutable.
- docs/architecture/spreadsheets-schema.md SHA 0c8d5c4c2976d4b64949c693e66395896ce16246 está fechado 2025-05-24 y documenta estructuras, no migraciones/versiones operativas.
- manifest.json SHA 0caa5febfbd7fdbb88e9d174fa6623fb7daebb4e es PWA. No hay appsscript.json, .clasp.json ni workflows CI/CD en el árbol.
- tests/regression contiene solo academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; no cubren F6-013/F6-038.
- Se amplían AUD-NG-011/077/078/081/174. Las tareas locales canónicas F6-013-A01..A07 están en el informe F6-013; F6-038 las referencia y amplía criterios.


## C1.231 - TAREA-F6-014 / TAREA-F6-039: configuración central y dependencias

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-014.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-039.md.  
**Dictamen:** ambas NO CUMPLEN; las marcas [X] históricas se conservan.  
**HEAD auditado:** 201373cd3b859eb1cc523eda920ab8a91e4af4ce.

### Registro, configuración y dependencias
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: getCentralConfigAndContractCatalog (2262-2285) es estático y parcial; validateServiceConfigDependencies (2286-2305) siempre declara PASS; getCentralServiceRegistry (2415-2472) usa defaults ficticios; registerServiceInstance (2473-2530) permite endpoint/recurso opcional y wildcard; updateServiceStatus (2531-2585) solo cambia estado e historial.
- getCentralSpreadsheetConfigRegistry (223+) consulta únicamente registros de Spreadsheet del control plane y admite datos desde payload cuando no encuentra filas; no resuelve configuración completa por servicio ni dependencias Drive/endpoint/contrato.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc, líneas 224-335: SERVICE_URLS y SERVICE_REGISTRY hardcodeados; URLs marcadoras en ACCOUNTING/DEVELOPER; IDs Spreadsheet/Drive de ejemplo; versión v8.4.0 y ACTIVE fijos.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 11-24: fetchApi usa SERVICE_URLS, no consulta SERVICE_REGISTRY ni getServiceDescriptor.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e y js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331: no se localizó UI conectada al catálogo de configuración/dependencias.
- Los servicios conservan matrices ROLE_PERMISSIONS distribuidas; no se demuestra propagación de cambios de rol/área/coordinación desde una fuente central.

### Dictamen de criterios
- F6-014 CA-070..CA-073: NO CUMPLE.
- F6-039 CA-129, CA-130, CA-131, CA-133, CA-135 y CA-169: NO CUMPLE.
- F6-039 CA-132, CA-134 y CA-168: PARCIAL; existe historial de estado, bandera isFallback y catálogo de acciones, pero no historial/configuración/contratos completos ni consumo obligatorio.

### Reconciliación
- Se amplían AUD-NG-011/077/078/081/158/174. No se crean IDs globales duplicados.
- Tareas canónicas ampliadas: F6-004-A01/A02/A04/A05/A06; F6-007-A05; F6-008-A04/A05; F6-009-A02/A06. F6-039 comparte el bloque de F6-014.
- No se modificó código, configuración, tests, completadas.md, Pendientes.md, ChangesLogs.txt ni rama base.
- Pruebas estáticas/manuales ejecutadas; Apps Script, HTTP, OAuth, navegador, Drive/Sheets productivas y E2E no ejecutadas.



## C1.232 - TAREA-F6-015 / TAREA-F6-040: rendimiento, capacidad, resiliencia y recuperación

**Informes:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-015.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-040.md.  
**Dictamen:** ambas NO CUMPLEN; marcas [X] históricas preservadas. **HEAD auditado:** 585a6a797c781fbbb1b22cca8a52a6fa07e02ae9.

### Evidencia
- DEVELOPER runFullArchitectureIntegrationAndPerformanceSuite: cinco casos secuenciales; no genera carga ni concurrencia, y su duración total no es benchmark reproducible.
- PERF-03 invoca getServiceHealthDiagnostics, cuyos checks connectivity/spreadsheetAccess/permissions son PASS constantes y healthStatus HEALTHY; no se inyecta fallo.
- ACADEMIC runConcurrencyAndConsistencySuite solo adquiere y libera un ScriptLock; no crea contención real.
- USER getOperationalCapacityMetrics lee BitacoraTrazabilidad completa y calcula promedios/tasas; no percentiles, throughput ni cuotas efectivas.
- ACADEMIC getPaginatedAcademicHistory lee getDataRange().getValues() completo antes de filtrar/paginar.
- ACADEMIC verifyBackupIntegrity acepta cualquier checksum no vacío; restoreSystemBackup no demuestra transacción/rollback; reconcileRestoredDataIntegrity solo revisa CalificacionesEstudiantes e HistorialAcademico y conserva success aun con hallazgos.
- js/api.js fetchApi reintenta POST sin clave idempotente estable. ACCOUNTING tiene dedupe/locks puntuales, no garantía uniforme ni prueba de carrera/respuesta perdida.
- Tests regression no cubren F6-015/F6-040, carga, fallos, recuperación, multirol E2E ni regresión post-migración.

### Criterios
- F6-015 CA-074/075/077 NO CUMPLE; CA-076 PARCIAL.
- F6-040 CA-136/137/140/141/142/143/144/170/171/172/173 NO CUMPLE; CA-138/139 PARCIAL.

### Tareas existentes ampliadas
- F6-003-A01..A09: entorno aislado, pruebas conductuales, carga/concurrencia/idempotencia, flujos multi-servicio, fallos/reintentos, runner y reporte reproducible.
- F6-009-A03/A06: telemetría real, percentiles, throughput, cuotas, límites y pruebas de degradación/fallos.
- F6-011-A01..A06: integridad criptográfica, restore aislado/transaccional, reconciliación bloqueante, capacidad/retención y runbook.
- F6-013-A05/A07: evaluación de impacto y regresión post-despliegue/migración.
- F6-012-A01..A07: identidad única y permisos multirol efectivos.
- AUD-NG-006/133/161: idempotencia atómica frente a reintentos y concurrencia.
No se crean IDs duplicados; todas las tareas siguen Pendientes.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script runtime, benchmark, carga, concurrencia real, HTTP, OAuth, navegador, deployments, fallos inyectados, restore productivo, Drive/Sheets productivas ni E2E. Sin cambios en código/datos productivos.


## C1.233 - TAREA-F7-IMP-01: validación integral de horarios y asignaciones

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-01.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** eadc2c57ea7905cf34d14d9c745df4a5ced50c4c.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: getOrCreateSheet, getUnifiedInstitutionalCalendar, getAcademicCalendar, createCalendarEvent, getTeacherTeachingLoad, createClassSchedule, checkScheduleConflict, validateRolePermission, PUBLIC_ACTIONS y runAcademicPlanningRegressionSuite.
- js/teacher.js: listener schedule-builder-form, alta de horario y flujo de excepción.
- teacher-dashboard.html: ausencia del formulario y campos referenciados por el controlador.
- js/api.js: fetchApi y enriquecimiento de payload.
- tests/regression/academic-grading-suite.js: ausencia de casos funcionales de F7-IMP-01.

### Relaciones y hallazgos
- UI: js/teacher.js espera schedule-builder-form y sch-*; el HTML auditado no contiene esos IDs, por lo que el listener opcional no se conecta.
- API/RBAC: createClassSchedule no es PUBLIC_ACTION; validateRolePermission exige token y establece _verifiedRole; fetchApi solo añade requesterUserId/requesterRole; el controlador no envía token. Relación con AUD-NG-001.
- Motor: createClassSchedule omite fechaEspecifica/anoId/período; checkScheduleConflict solo dispone de validación de calendario cuando recibe fechaEspecifica. getTeacherTeachingLoad agrega registros de varios años y estados salvo Inactivo.
- Excepciones: el atajo de excepcionJustificacion inserta primero en ExcepcionesHorarios y retorna sin evaluar las demás reglas; el rol consultado es authRole/userRole, no _verifiedRole. La escritura del horario es posterior y no hay rollback conjunto.
- Calendario: inicializador de 9 columnas, writer/lector principal de 13 campos y consumidor unificado con índices antiguos; se amplía AUD-NG-168.
- Pruebas: TC-F7-01 comprueba solo tipo objeto; no hay aserciones conductuales para CA-F7-01..08.

### Criterios
CA-F7-01/02/07/08 NO CUMPLE; CA-F7-03/04/05/06 PARCIAL.

### Tareas ejecutables derivadas
- TASK-515: conectar formulario y controlador en teacher-dashboard.html/js/teacher.js.
- TASK-516: integrar identidad y rol verificado en la ruta privada y excepciones; amplía AUD-NG-001.
- TASK-517: normalizar calendario, fecha efectiva, año y período; amplía AUD-NG-168.
- TASK-518: hacer las excepciones acotadas, autorizadas y atómicas.
- TASK-519: crear pruebas conductuales reproducibles para los ocho criterios.
Todas Pendientes. No se crean duplicados.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script, HTTP/OAuth, navegador, Sheets/Drive productivas, concurrencia, rollback ni E2E. Sin cambios en código o datos productivos.


## C1.234 - TAREA-F7-IMP-02: matriz visual de planificación y disponibilidad

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-02.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** d13b3d902d973c4263dc6cbad479863b1dd48513.

### Dependencias inspeccionadas
- js/teacher.js: renderSchedulePlanningMatrix (592), filterScheduleMatrix (660), loadMasterSchedules (668), deleteScheduleBlock y llamadas de recarga tras mutaciones.
- teacher-dashboard.html: no contiene contenedor ni filtros de matriz referenciados por el controlador.
- backend/academic-service/Code.gs: getPlanningQualityAndOccupancyReport, getTeacherAssignments, getClassSchedules, getClassroomResources, getTeacherTeachingLoad, invalidateScheduleCache, createClassSchedule, deleteClassSchedule y publishClassSchedules.
- js/api.js: fetchApi; autenticación de consultas privadas relacionada con AUD-NG-001.
- tests/regression: no hay pruebas de la matriz.

### Relaciones y hallazgos
- La vista no se monta: faltan schedules-table-body, schedule-count-badge y sch-matrix-* en teacher-dashboard.html; loadMasterSchedules retorna antes de llamar API.
- Solo cuatro perspectivas (institucional/docente/sección/aula), solo estado/búsqueda, sin año/período/jornada/sede/grado/sección combinados; carga solo currentUser.userId.
- getClassSchedules interpreta r[7]/r[8]/r[9] como grado/sección/estado cuando la escritura almacena Estado en r[7] y UltimaModificacion en r[8]; estados cancelados/inactivos no se representan correctamente. Se amplía AUD-NG-168.
- getPlanningQualityAndOccupancyReport no filtra anoLectivo, agrega horas y usa 40h fijas por aula; getClassroomResources no calcula intervalos de recursos.
- CacheService 600s sin invalidación desde create/delete/publish; el bypass de cliente no tiene setter. El invalidator usa claves incompletas.
- La UI distingue Borrador/Publicado y solo muestra acción Eliminar; no detalle, recurso, disponibilidad, impresión ni exportación de vista.
- No hay tests F7-IMP-02; las suites no cubren filtros, estado, permisos, cache, grandes volúmenes ni responsive.

### Criterios
CA-F7-09/10/11/12/13/16 NO CUMPLE; CA-F7-14/15 PARCIAL.

### Tareas ejecutables derivadas
- TASK-520: integrar matriz y seis perspectivas en dashboard.
- TASK-521: normalizar esquema y DTO de horarios (amplía AUD-NG-168).
- TASK-522: disponibilidad por intervalos y filtros temporales/organizativos.
- TASK-523: permisos y ámbitos de vistas/acciones (amplía AUD-NG-001/AUD-NG-169).
- TASK-524: invalidar caché tras todas las mutaciones.
- TASK-525: pruebas funcionales, permisos, volumen, responsive y exportación.
Todas Pendientes. No se crean IDs duplicados.

### Límites
Inspección estática/manual. No se ejecutaron navegador, Apps Script, HTTP/OAuth, Sheets/Drive productivas, carga, responsive real, permisos E2E ni exportación real. Sin cambios en código o datos productivos.


## C1.235 - TAREA-F7-IMP-03: resolución asistida de conflictos

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-03.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** 7fb4669d48e9e745e9cbe1d406f1602c9cc13d65.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: checkScheduleConflict (7493), createClassSchedule (6900), getClassroomResources (7694), getScheduleConflictResolutionAlternatives (8085), dispatcher y PUBLIC_ACTIONS.
- js/teacher.js: openAssistedConflictResolutionModal (~800), botones de alternativas y applyConflictAlternative (1886).
- teacher-dashboard.html: ausencia de modal-schedule-conflict-resolution/conflict-resolution-content.
- js/api.js: fetchApi; autenticación privada relacionada con AUD-NG-001.
- tests/regression: ausencia de escenarios F7-IMP-03.

### Relaciones y hallazgos
- El generador solo propone aulas distintas y ocho bloques horarios fijos del mismo día; no propone sustitutos, recursos, cambio de día ni reprogramación, tampoco agrupa todos los registros participantes.
- Cada candidato se evalúa con checkScheduleConflict sin fecha/año/período/recursos; hereda las brechas de AUD-NG-236/AUD-NG-168.
- El modal no existe en teacher-dashboard; el controlador retorna silenciosamente si faltan modal o contenedor.
- getScheduleConflictResolutionAlternatives es privada y fetchApi no transmite token; relación con AUD-NG-001.
- getClassroomResources puede crear seis aulas predeterminadas durante la consulta; la previsualización no es completamente de solo lectura.
- applyConflictAlternative invoca createClassSchedule sin horarioId/lastUpdated; crea un nuevo bloque y deja vigente el original.
- No se comparan consecuencias, no hay confirmación contextual ni log específico de resolución. Revalidación al guardar es parcial; no hay rollback ni pruebas.
 
### Criterios
CA-F7-17/21/22 NO CUMPLE; CA-F7-18/19/20/23 PARCIAL.

### Tareas ejecutables derivadas
- TASK-526: integrar modal y rutas autenticadas.
- TASK-527: agrupación de conflictos y generación de candidatos completos.
- TASK-528: vista previa comparativa de solo lectura.
- TASK-529: aplicar cambios sobre registros originales seleccionados.
- TASK-530: atomicidad, rollback, idempotencia y bitácora de resolución.
- TASK-531: regresión conductual para CA-F7-17..23.
Todas Pendientes. No se crean IDs duplicados.

### Límites
Inspección estática/manual. No se ejecutaron navegador, Apps Script, HTTP/OAuth, Sheets/Drive productivas, concurrencia, cambios simultáneos, rollback ni E2E. Sin cambios de código o datos productivos.


## C1.236 - TAREA-F7-IMP-04: planificación masiva y optimización de horarios

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** ee2861653d31e185bd934bc1e1f063ab225e0bbf.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: generateAutoSchedules (6335), saveScheduleScenario (6459), getScheduleScenarios (6472), previewPublishImpact (3351), publishClassSchedules (7008), checkScheduleConflict (7493).
- js/teacher.js: listener btn-open-auto-scheduler (321), preview/publicación (~1005), openScheduleScenarioModal (1862).
- teacher-dashboard.html: ausencia de botón, modal y controles de escenario/publicación.
- js/api.js: autenticación privada relacionada con AUD-NG-001.
- tests/regression: ausencia de pruebas F7-IMP-04.

### Relaciones y hallazgos
- generateAutoSchedules escribe propuestas directamente en HorariosClase como Borrador; después guarda solo un registro resumen en EscenariosHorarios. No vincula bloques a escenarioId ni permite reanudar datos estructurados.
- saveScheduleScenario almacena logs en detallesJSON; getScheduleScenarios devuelve solo metadatos; no hay apply/resume scenario.
- Generador first-fit con primer docente/aula y bloques fijos; duración/hora inicial recibidas no se usan; sin preferencias ni asignaciones bloqueadas.
- Pendientes genéricas, sin explicar restricciones; preview solo cuenta borradores/docentes/aulas/conflictos, no compara carga ni uso antes/después.
- publishClassSchedules no filtra por escenarioId; sin filtros publica todos los borradores. año se compara con OfertaID y las filas no guardan año.
- Publicación secuencial sin rollback; generación sin lock/idempotencia; error intermedio deja borradores parciales.
- UI de escenario/preview ausente en HTML; el resumen JS espera propiedades distintas a las que devuelve el backend; acciones privadas sin token.

### Criterios
CA-F7-24/26/28/29/30 NO CUMPLE; CA-F7-25/27/31 PARCIAL.

### Tareas ejecutables derivadas
- TASK-532: aislar escenarios y persistir propuestas recuperables.
- TASK-533: optimizador con restricciones obligatorias, preferencias y bloqueos.
- TASK-534: causas de pendientes y comparación antes/después.
- TASK-535: publicación solo del escenario confirmado.
- TASK-536: atomicidad, rollback, idempotencia y concurrencia.
- TASK-537: UI, autenticación y pruebas del ciclo completo.
Todas Pendientes. No se crean IDs duplicados.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script, HTTP/OAuth, navegador, Sheets/Drive productivas, generación masiva, concurrencia, fallos inyectados, rollback ni E2E. Sin cambios en código o datos productivos.


## C1.237 - TAREA-F7-IMP-05: control de carga laboral y preferencias docentes

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-05.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** 125d58d2b7bc2e3745926d5946a825a326fa4638.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: getOrCreateSheet (84), ROLE_PERMISSIONS (158+), PUBLIC_ACTIONS, doPost (800+), getTeacherTeachingLoad (6773), saveTeacherWorkLoadPreferences (6842), checkScheduleConflict (7493), runAcademicPlanningRegressionSuite (14109).
- js/teacher.js: openTeacherWorkLoadPreferencesModal (1830) y solicitud saveTeacherWorkLoadPreferences (1842).
- teacher-dashboard.html: ausencia del botón/control/formulario para el modal.
- js/api.js: fetchApi y enriquecimiento del payload; brecha relacionada con AUD-NG-001.
- tests/regression/academic-grading-suite.js: TC-F7-02 solo valida tipo objeto; sin escenarios CA-F7-32..38.

### Relaciones y hallazgos
- Política: getTeacherTeachingLoad y saveTeacherWorkLoadPreferences aplican 40h por defecto; no hay resolución por contrato/jornada ni estado explícito “sin política”.
- Cálculo: anoId se recibe pero no se aplica; se cuentan filas salvo Inactivo, incluyendo borradores/otros estados y períodos mezclados.
- Reglas laborales: no se modelan frecuencia, límites diarios, sesiones consecutivas, descansos ni actividades adicionales.
- Preferencias: solo se guardan hora de entrada/salida y días fijos lunes-viernes; no son preferencias flexibles ni se consumen por generateAutoSchedules. Se amplía AUD-NG-239.
- Integración: el modal JS no tiene botón/trigger HTML; el guardado es privado y fetchApi/controlador no envían token. Se amplía AUD-NG-001.
- Datos: HorariosLaborales carece de inicializador de cabecera; si se crea vacía, la primera fila insertada puede ser descartada por slice(1). Escrituras parciales sin lock/rollback/versionado.
- Pruebas: TC-F7-02 es estructural, sin aserciones de cálculo; no hay regresión F7-IMP-05.

### Criterios
CA-F7-32/34/37/38 NO CUMPLE; CA-F7-33/35/36 PARCIAL.

### Tareas ejecutables derivadas
- TASK-538: políticas de carga por contrato/jornada, sin valores arbitrarios.
- TASK-539: cálculo lectivo por período, estado y frecuencia.
- TASK-540: límites diarios, consecutividad, descansos y actividades adicionales.
- TASK-541: preferencias docentes autorizadas e integración con optimizador.
- TASK-542: UI, API autenticada y permisos por ámbito.
- TASK-543: explicación de excesos, política/versiones y actualización de la vista.
- TASK-544: regresión conductual CA-F7-32..38.
Todas Pendientes. AUD-NG-240 nuevo; AUD-NG-001/236/239 ampliados.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, cálculos con contratos reales, concurrencia, fallos de escritura, rollback ni E2E. Sin cambios en código o datos productivos.


## C1.238 - TAREA-F7-IMP-06: disponibilidad, equipamiento y capacidad de espacios

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** f5aad53e90626b54e5549595530795437c6ea828.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: getOrCreateSheet (84), ROLE_PERMISSIONS (158+), PUBLIC_ACTIONS, doPost (800+), checkScheduleConflict (7493), getClassroomResources (7694), saveClassroomResource (7752), saveClassroomMaintenance (7797), getScheduleConflictResolutionAlternatives (8085), getSectionCapacityAnalyticsReport (13657), runAcademicPlanningRegressionSuite (14109).
- js/teacher.js: openClassroomManagerModal (2534), loadClassroomResourcesTable, openClassroomMaintenanceModal y formulario saveClassroomResource.
- teacher-dashboard.html: no contiene modal-classroom-manager, form-classroom-resource ni tbl-classroom-resources-body.
- js/api.js: fetchApi (11, 46-57); brecha de token relacionada con AUD-NG-001.
- tests/regression/academic-grading-suite.js: sin pruebas F7-IMP-06; TC-F7-04 solo comprueba la forma del reporte.

### Relaciones de datos y flujo
- SedesAulas -> getClassroomResources/saveClassroomResource; esquema declarado de 7 columnas frente al uso de columna 8 para equipamiento.
- MantenimientoAulas -> saveClassroomMaintenance/getClassroomResources/checkScheduleConflict; falta inicializador de cabecera y el lector descarta la primera fila mediante slice(1).
- Matriculas/OfertaAcademica/HorariosClase -> checkScheduleConflict; conteo de matrícula compara índices incompatibles con el esquema canónico.
- getClassroomResources -> getScheduleConflictResolutionAlternatives -> checkScheduleConflict; la alternativa no verifica equipamiento ni intervalo temporal.
- RecursosEducativosReutilizables no representa un catálogo de equipamiento físico compartido.

### Hallazgos y criterios
- AUD-NG-241 nuevo; amplía AUD-NG-001 (autenticación), AUD-NG-236 (conflictos) y AUD-NG-238 (alternativas).
- Interfaz HTML ausente; esquema de mantenimiento incompleto; lectura con siembra de aulas ficticias; indisponibilidad no temporal; equipamiento en texto libre; matrícula vinculada incorrectamente; sin ocupación/impacto futuro; regresión insuficiente.
- CA-F7-39/40/41/44 NO CUMPLE; CA-F7-42/43 PARCIAL.

### Tareas ejecutables derivadas
- TASK-545: normalizar esquema de espacios/mantenimiento, encabezados y lecturas sin efectos secundarios.
- TASK-546: implementar ciclo de vida y evaluación temporal de mantenimiento.
- TASK-547: modelar equipamiento y recursos compartidos/exclusivos.
- TASK-548: corregir matrícula efectiva y capacidad.
- TASK-549: consultar ocupación, clases afectadas y alternativas compatibles.
- TASK-550: conectar UI/API autenticada, permisos y renderizado seguro.
- TASK-551: regresión conductual CA-F7-39..44.
Todas Pendientes. No se duplican TASK-538..544 ni la tarea de concurrencia TAREA-F7-IMP-15.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, concurrencia real, rollback ni E2E. Sin cambios de código o datos productivos.


## C1.239 - TAREA-F7-IMP-07: programación de evaluaciones y prevención de sobrecargas

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** eacd5cdc8b8c8c078516f2acb98d17b9f9e1c980.

### Dependencias inspeccionadas
- backend/exam-service/Code.gs: getOrCreateSheet (26), PUBLIC_ACTIONS/ROLE_PERMISSIONS (75-101), validateRolePermission (207-251), doPost (345-408), createExam (506), updateExam (555), deleteExam (578), getAllExams (609), checkExamSchedulingConflict (875), simulateExamReschedule (910), submitExam (996), getStudentExams (1057), getExamResult (1106), gradeExamSubmission (1236), saveGradebookGrades (1533), saveStudentRecovery (1722).
- backend/academic-service/Code.gs: getOrCreateSheet (84-155), ROLE_PERMISSIONS (168-265), getAcademicCalendar (6616), createCalendarEvent (6651), getScheduleCalendarConflicts (6876), checkScheduleConflict (7493), getAcademicRules (8164), saveAcademicRule (8181).
- teacher-dashboard.html: sección de exámenes (179-205), formulario (286-323); no contiene modal/form de simulación.
- js/teacher.js: controlador openExamScheduleValidationModal (1757), gestión (3286-3354), edición (3441-3476), alta createExamForm.onsubmit (4764-4800).
- js/api.js: fetchApi (11-60), sin propagación de token de sesión.
- tests/regression/academic-grading-suite.js y backend/developer-service/Code.gs: sin pruebas/referencias a F7-IMP-07.

### Relaciones de datos y flujo
- teacher-dashboard.html#create-exam-form -> js/teacher.js#createExamForm.onsubmit -> fetchApi(EXAM, createExam) -> backend/exam-service/Code.gs#doPost/createExam -> hoja Examenes.
- Examenes -> getAllExams/getStudentExams -> vistas docente/estudiante; fecha expuesta como fechaLimite, no como fecha de aplicación independiente.
- checkExamSchedulingConflict y simulateExamReschedule son rutas separadas; no se invocan desde createExam/updateExam y la simulación no tiene operación de confirmación.
- EntregasExamen referencia ExamenID; CalificacionesEstudiantes y RecuperacionesEstudiante guardan EvaluacionID; deleteExam solo comprueba EntregasExamen.
- CalendarioAcademico: esquema declarado de 9 columnas; writer/readers esperan 13 o índices desplazados. EXAM no consume la validación de días no lectivos.
- ReglasAcademicas tiene getAcademicRules/saveAcademicRule genéricos, pero el motor EXAM no consulta configuración institucional.
- fetchApi añade requesterUserId/requesterRole; validateRolePermission de EXAM requiere sessionToken/authToken/token.

### Hallazgos y criterios
- AUD-NG-242 nuevo; amplía AUD-NG-001, AUD-NG-236, AUD-NG-237 y AUD-NG-238.
- Creación/edición sin prevalidación; límite 2 rígido; agrupación de sección/grado defectuosa; sin intervalo de separación ni tipo evaluativo; sin docente/aula/recurso; fecha límite confundida con fecha de aplicación; calendario no lectivo con contrato/índices incorrectos; modal ausente; simulación sin confirmación; API sin token; regresión insuficiente.
- CA-F7-45/46/49/50 NO CUMPLE; CA-F7-47/48 PARCIAL.

### Tareas ejecutables derivadas
- TASK-552: normalizar modelo de programación y reglas institucionales.
- TASK-553: motor configurable de carga, coincidencia, separación y afectados.
- TASK-554: corregir contrato CalendarioAcademico e integrar días no lectivos.
- TASK-555: detectar conflictos de docentes, aulas y recursos.
- TASK-556: simulación/confirmación segura, idempotente y con preservación histórica.
- TASK-557: interfaz docente de programación y simulación.
- TASK-558: autenticación y permisos del flujo privado EXAM.
- TASK-559: regresión conductual CA-F7-45..50.
Todas Pendientes. Se conectan con AUD-NG-001/236/237/238 y TASK-545..TASK-551; no duplican TASK-515..TASK-537 ni TASK-545..TASK-551.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, persistencia, concurrencia, rollback ni E2E. No se modificó código ni datos productivos.

## C1.240 - TAREA-F7-IMP-08: excepciones del calendario y gestión de sesiones

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-08.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** 7500762b480a9a6c36c6afefde706954cb5d6146.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: getOrCreateSheet (84-155), ROLE_PERMISSIONS (168-265), dispatcher (796-826), rescheduleCancelledSession (2615-2689), createSessionException (2692-2725), getPendingSessionRecoveries (2728-2756), recordClassSessionOutcome (2759-2795), getTeachingHoursSummary (2798+), getAcademicCalendar (6616-6644), createCalendarEvent (6651-6715), getClassSchedules (6718-6770), checkScheduleConflict (7493-7585+), getIndividualCalendar (7925-7983), getStudentSchedule (7986-8082).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: modal/formulario/invocador de excepción ausentes.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: openSessionExceptionModal (1707-1754), depende de nodos inexistentes.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (11-60), no transmite token; relación con AUD-NG-001.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6: sin cobertura de CA-F7-51..56.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff: entrada histórica declara UI implementada, pero el HTML actual no contiene los nodos.

### Relaciones y hallazgos
- HorariosClase (regla recurrente) -> createSessionException -> ExcepcionesSesiones: la función solo inserta una fila; no hay esquema/cabecera, consulta, validación de ocurrencia ni proyección sobre horarios.
- SesionesClaseImpartidas -> rescheduleCancelledSession: actualiza la fila original y agrega REC, pero omite hora/aula en la fila de recuperación y no registra vínculo relacional con el original.
- getClassSchedules/getStudentSchedule/getIndividualCalendar/getAcademicCalendar no consumen ExcepcionesSesiones; getIndividualCalendar tampoco aplica filtros de fechas y espera res.data aunque getStudentSchedule devuelve schedules.
- Cancelación/reprogramación no libera ni reserva recursos; no hay idempotencia ni clave lógica de ocurrencia.
- El controlador UI carece de nodos HTML; la ruta privada no transporta token y RBAC restringe createSessionException a Administrador/Director.
- CalendarioAcademico conserva divergencia de esquema ya vinculada a AUD-NG-236; las lecturas de horarios presentan índices divergentes relacionados con AUD-NG-237/AUD-NG-168.

### Hallazgos y criterios
- AUD-NG-243 nuevo; amplía AUD-NG-001, AUD-NG-236, AUD-NG-237 y AUD-NG-238.
- CA-F7-51/52/53/55/56 NO CUMPLE; CA-F7-54 PARCIAL.
- El código existente registra parcialmente una excepción y una recuperación, pero no realiza el ciclo completo sobre una ocurrencia recurrente ni actualiza calendario/recursos.

### Tareas ejecutables derivadas
Las tareas completas TASK-560..TASK-568, con hallazgo, severidad, módulos, dependencias, alcance y criterios verificables, se encuentran exclusivamente en el informe individual. Todas Pendientes; no se duplican TASK-515..TASK-559.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, concurrencia real, rollback ni E2E. Sin cambios de código o datos productivos.

## C1.241 - TAREA-F7-IMP-09: versiones de horarios, comparación y restauración

**Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-09.md.  
**Dictamen:** NO CUMPLE; marca [X] histórica preservada. **HEAD auditado:** c5adab367178ac3bb0a7b1393b61e4b15c5b12a5.

### Dependencias inspeccionadas
- backend/academic-service/Code.gs: getOrCreateSheet (84-155), ROLE_PERMISSIONS (168-265), verifySessionToken (401-460 aprox.), validateRolePermission (524-585 aprox.), doPost (671+), createClassSchedule (6900-6990), deleteClassSchedule (6992-7005), publishClassSchedules (7008-7117), getScheduleVersions (7119-7144), compareScheduleVersions (7145-7223), restoreScheduleVersion (7224-7305 aprox.), checkScheduleConflict (7493-7585+), runConcurrencyAndConsistencySuite (3296+), runAcademicPlanningRegressionSuite (14109+).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: no contiene btn-schedule-versions, modal-schedule-versions ni schedule-versions-list-container.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: openScheduleVersionsModal y acciones diff/restauración (1598-1688); compara versión seleccionada contra vigente y muestra solo contadores.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (11-60), no envía token de sesión.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: sin cobertura de F7-IMP-09.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, entrada alrededor de línea 2343: afirma UI integrada; la estructura HTML está ausente.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: tarea marcada [X], criterios CA-F7-57..62. Informe individual y auditoría de origen no existen; el informe individual se crea.

### Relaciones y hallazgos
- createClassSchedule -> HorariosClase: borradores y activos comparten fila/identificador; edición como borrador puede modificar el horario publicado.
- publishClassSchedules -> VersionesHorarios: snapshot post-publicación, hoja sin cabecera, primera versión descartada por lectores; captura activos de distintos años y fallo de snapshot no impide respuesta success.
- createClassSchedule/deleteClassSchedule: modificaciones activas y desactivaciones no registran versiones.
- getScheduleVersions -> VersionesHorarios: lectura con slice(1), primera versión invisible.
- compareScheduleVersions -> VersionesHorarios/HorariosClase: diff backend parcial; ID B inválido y JSON corrupto se tratan como estado vacío; UI no expone detalles ni comparación entre dos snapshots históricos.
- restoreScheduleVersion -> checkScheduleConflict -> HorariosClase: no hay lock/OCC; sobrescribe IDs coincidentes, no concilia cambios posteriores, no actualiza timestamp y guarda snapshot incompleto del resultado.
- js/teacher.js -> fetchApi -> doPost/validateRolePermission: la UI no envía token, por lo que el servidor rechaza acciones privadas; identidad de auditoría usa authUserId de payload o fallback, no claims verificados.
- runAcademicPlanningRegressionSuite y runConcurrencyAndConsistencySuite no cubren versionado/restauración.

### Hallazgos y criterios
- AUD-NG-244 nuevo; relacionado con AUD-NG-001, AUD-NG-236, AUD-NG-237 y AUD-NG-243.
- CA-F7-57 PARCIAL; CA-F7-58 NO CUMPLE; CA-F7-59 PARCIAL; CA-F7-60 PARCIAL; CA-F7-61 NO CUMPLE; CA-F7-62 PARCIAL.
- La implementación contiene funciones de backend, pero no un control de versiones completo ni una interfaz conectada y segura.

### Tareas ejecutables derivadas
TASK-569..TASK-576 se detallan en el informe individual con hallazgo, severidad, módulos, dependencias, alcance y criterios verificables. Todas Pendientes. TASK-567 existente se amplía para token y actor verificado; no se duplica.

### Límites
Inspección estática/manual. No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, concurrencia real, restauración con datos, rollback, E2E ni suite Node. No se modificó código, UI, pruebas ni datos productivos.


## Notificaciones y trazabilidad de cambios académicos (TAREA-F7-IMP-10 / AUD-NG-245)

### Flujo académico y eventos
- backend/academic-service/Code.gs: createClassSchedule (6900-6990) persiste el horario y escribe directamente en BandejaNotificaciones; no invoca el dispatcher USER.
- deleteClassSchedule (6992-7005) y publishClassSchedules (7008+) no generan notificación académica ni un registro detallado por cambio.
- backend/user-service/Code.gs: dispatchScheduleChangeNotifications (8858-8896) se enruta desde doPost, pero no tiene invocación desde el flujo académico; solo considera docenteUserId y no resuelve oferta/matrícula/familias.
- El dispatcher debe depender de un evento durable posterior a la confirmación académica, con snapshot anterior/nuevo, actor verificado, motivo y correlationId.

### Persistencia y trazabilidad
- USER y ACADEMIC comparten SPREADSHEET_ID.
- USER getOrCreateSheet inicializa BandejaNotificaciones con 9 columnas; sendMultiChannelNotification escribe 12. El helper ACADEMIC no inicializa cabecera para esa hoja. La consulta de logs usa data.slice(1), por lo que una primera fila de datos sin cabecera puede perderse.
- BitacoraNotificaciones no existe en el código inspeccionado. El almacenamiento efectivo es BandejaNotificaciones.
- USER y ACADEMIC implementan recordEntityChangeLog con órdenes incompatibles para las columnas de HistorialCambiosEntidad, pese a compartir la misma hoja. Los cambios de horario no invocan ese registro.
- sendMultiChannelNotification usa comprobación de duplicado por lectura+append sin lock; retryFailedNotificationsQueue carece de lock, contador de intentos y backoff; estado Entregado no se sustenta en recibo verificable.

### Seguridad e interfaz
- ROLE_PERMISSIONS de USER permite consulta/despacho a Director, pero Secretaría carece de getScheduleChangeNotificationLogs/dispatchScheduleChangeNotifications.
- js/secretary.js define loadScheduleChangeNotificationLogs sin invocador; dashboard-secretaria.html solo carga el script, sin control visible conectado.
- js/api.js fetchApi no envía token de sesión; ampliar TASK-567/AUD-NG-001, no duplicar autenticación.
- Historial debe filtrar por evento, oferta, rol y relaciones; minimizar destinatarios/correos y contenido visible.

### Tareas derivadas
- TASK-577: conectar eventos de cambios académicos a outbox durable.
- TASK-578: resolver destinatarios y aplicar privacidad por audiencia.
- TASK-579: unificar esquemas de BandejaNotificaciones, BitacoraNotificaciones e HistorialCambiosEntidad.
- TASK-580: deduplicación atómica y cola de reintentos segura.
- TASK-581: estados de notificación basados en evidencia y preferencias de canal.
- TASK-582: integrar historial en UI y restringir consultas por ámbito.
- TASK-583: regresión conductual CA-F7-63..68.
- TASK-567 ampliada: token y actor verificado en consultas de historial de notificaciones.


## Sincronización multiportal de horarios (TAREA-F7-IMP-11 / AUD-NG-246)

### Interfaz y consumidores
- teacher-dashboard.html carga js/teacher.js pero carece de schedules-table-body, schedule-builder-form, btn-load-schedules-list y sch-matrix-mode; loadMasterSchedules (664-682) retorna sin contenedor.
- student-dashboard.html carga js/student.js pero carece de student-schedule-container, btn-refresh-student-schedule y family-student-switcher-container; fetchAndRenderStudentSchedule (884-954) e initFamilyStudentSwitcher (184-260) retornan sin nodos.
- dashboard-secretaria.html carga js/secretary.js, pero no existe consumidor de getClassSchedules/getStudentSchedule. Se deja como brecha de alcance a definir.
- Los portales Docente y Estudiante sí cargan js/api.js.

### Contrato y estados
- HorariosClase se declara con 8 columnas; createClassSchedule agrega 9 valores y otras rutas heredadas 11. getClassSchedules interpreta r[7]/r[8]/r[9] como grado/sección/estado; para filas canónicas son Estado/UltimaModificacion/undefined.
- getStudentSchedule filtra solo Inactivo y puede devolver Borrador. getClassSchedules filtra Cancelado en índices 9/10 y no filtra estados canónicos.
- La fuente del horario estudiantil relaciona OfertaAcademica -> OfertaID -> HorariosClase; la fila debe estar publicada y activa.

### Caché y concurrencia
- getClassSchedules genera clave schedules_<año>_<grado>_<sección>_<docente>_<oferta>_<aula> y TTL 600 segundos.
- invalidateScheduleCache elimina patrones de cuatro segmentos que no coinciden con la clave de seis; createClassSchedule/deleteClassSchedule/publishClassSchedules no la invocan.
- getStudentSchedule genera lastSyncTime/freshnessToken por hora de consulta; UI no compara token ni descarta respuestas tardías.
- fetchApi transforma errores de red GET en success/data[].

### Seguridad
- validateRolePermission exige token; fetchApi no envía sessionToken/authToken/token.
- validateContextualAccess solo restringe userId propio para Estudiante/Alumno. No verifica vínculo activo de Padre/Tutor/Responsable ni ámbito docente/oferta/grado/sección.
- TASK-567/AUD-NG-001 se amplía para credenciales; TASK-586 cubre autorización contextual.

### Hallazgo y tareas
- AUD-NG-246 nuevo; relacionado con AUD-NG-001, AUD-NG-236, AUD-NG-237, AUD-NG-243, AUD-NG-244 y AUD-NG-245.
- CA-F7-69 NO CUMPLE; CA-F7-70 PARCIAL; CA-F7-71 NO CUMPLE; CA-F7-72 NO CUMPLE; CA-F7-73 NO CUMPLE; CA-F7-74 PARCIAL.
- TASK-584: conectar nodos y controles de horario.
- TASK-585: unificar esquema y filtros de estado.
- TASK-586: autorización contextual; TASK-567 se amplía para token.
- TASK-587: invalidación, revisión persistente y descarte de respuestas obsoletas.
- TASK-588: separar error, vacío y obsoleto.
- TASK-589: regresión conductual CA-F7-69..74.
- Todas Pendientes; criterios completos en el informe individual.


## Reportes de carga docente, ocupación y calidad de planificación (TAREA-F7-IMP-12 / AUD-NG-247)

### Funciones y datos fuente
- getTeachingHoursSummary (Code.gs:2798-2857) cuenta sesiones impartidas/canceladas/reprogramadas; no calcula carga planificada por día/semana/período/año.
- getTeacherTeachingLoad (Code.gs:6773-6837) suma bloques del docente, ignora anoId y excluye solo Inactivo; incluye Borrador/Cancelado.
- getCurricularAnalyticsReport (Code.gs:2927-2986) devuelve promedios de CalificacionesEstudiantes; area/asignatura/grado/programa/periodo no filtran los datos.
- getPlanningQualityAndOccupancyReport (Code.gs:3525-3596) no filtra anoLectivo; usa aulas activas * 40 horas como capacidad; incluye cancelados/borradores en ocupación; no calcula unión de intervalos ni disponibilidad efectiva.
- El reporte no integra huecos, conflictos pendientes, asignaciones para revisión ni evaluaciones/actividades por sección/período.

### Seguridad e interfaz
- ROLE_PERMISSIONS: Profesor puede getTeachingHoursSummary/getTeacherTeachingLoad, pero no getPlanningQualityAndOccupancyReport ni getCurricularAnalyticsReport; Director/Administrador sí tienen el reporte de calidad.
- validateContextualAccess no ata docenteUserId a _verifiedUserId para Profesor. getTeachingHoursSummary sin docenteUserId devuelve sesiones de todos los docentes.
- js/teacher.js define openPlanningQualityReportModal (1079-1139), pero teacher-dashboard.html no contiene modal-planning-quality-report, tbl-planning-quality-body, btn-open-planning-quality-report ni btn-export-planning-quality-csv. No existe invocador DOM.

### Hallazgo, criterios y tareas derivadas
- AUD-NG-247 (ALTO/P1), relacionado con AUD-NG-001, AUD-NG-244, AUD-NG-245 y AUD-NG-246.
- CA-F7-75, CA-F7-76, CA-F7-77, CA-F7-78, CA-F7-79 y CA-F7-80: NO CUMPLE.
- TASK-590: carga docente planificada/ejecutada por día, semana, período y año.
- TASK-591: estados canónicos y separación de vigentes, borradores, cancelados e históricos.
- TASK-592: ocupación real por intervalos efectivos y disponibilidad configurada.
- TASK-593: filtros combinados y métricas de calidad/actividades por ámbito.
- TASK-594: autorización contextual por identidad, rol, asignaciones y delegaciones.
- TASK-595: conectar reporte completo en el portal docente.
- TASK-596: regresión conductual y consistencia de exportaciones CA-F7-75..80.
- Detalle de dependencias, archivos y aceptación: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-12.md.
- Pendientes.md se conserva; el blob íntegro de la ruta se verificó por SHA y la lectura ordinaria vacía fue un problema de lectura, no ausencia del objeto.


## Importación/exportación masiva de horarios (TAREA-F7-IMP-13 / AUD-NG-248)

### Flujo y contratos
- exportBulkClassSchedules (Code.gs:3403-3427): exporta CSV de ocho columnas, no filtra anoLectivo, no escapa comillas internas y omite UltimaModificacion. Devuelve schedules como JSON en la respuesta, pero la UI no descarga JSON.
- importBulkClassSchedules (Code.gs:3430-3517): requiere array no vacío; valida solo día/hora requeridos; aplica defaults a oferta, aula, ID y estado; no valida catálogos/referencias ni formato de horas.
- Contrato no unificado: createClassSchedule escribe Estado en índice 7 y UltimaModificacion en 8; import/export también usan Estado en 7 y solo ocho columnas; getClassSchedules (6718-6764) interpreta índices 7/8/9 como grado/sección/estado.
- checkScheduleConflict (7493-7700) revisa la hoja persistida, no el lote candidato; solo excluye Inactivo, y por eso Borrador/Cancelado participan. Invoca getTeacherTeachingLoad, relacionado con AUD-NG-247.

### Duplicados, atomicidad y registro
- existingMap no se actualiza al iterar filas entrantes; no detecta IDs repetidos dentro del mismo lote.
- Duplicados existentes se reportan pero permanecen en validos; se actualizan automáticamente. No hay operación explícita crear/actualizar/omitir.
- LockService.tryLock(15000) protege concurrencia, pero las escrituras se realizan mediante setValues/appendRow por fila sin rollback.
- La rama previsualizar retorna antes de escribir HorariosClase; la confirmación vuelve a ejecutar el endpoint y valida otra vez.
- Éxito registra BULK_SCHEDULE_IMPORTED; fallo cae en UNHANDLED_EXCEPTION genérico de doPost, sin estado de lote/fila ni reconciliación.

### Interfaz, permisos y pruebas
- js/teacher.js openBulkScheduleImportExportModal (864-989) define exportación CSV, parseo CSV/JSON, preview y confirmación.
- teacher-dashboard.html no contiene modal-bulk-schedule-import-export, btn-export-bulk-schedules-csv, btn-preview-bulk-schedule, btn-confirm-bulk-schedule-import, input-bulk-schedule-file ni bulk-import-result-box. No contiene invocador de openBulkScheduleImportExportModal.
- Parser CSV usa split(',') y elimina comillas; no maneja RFC 4180/campos quoted con coma o newline; no valida cabeceras.
- ROLE_PERMISSIONS estático: Administrador "*" y Director import/export; dynamic permission matrix puede sobrescribir, su configuración productiva no fue consultada.
- runAcademicPlanningRegressionSuite TC-F7-01..07 no cubre import/export; los dos archivos tests/regression tampoco.
- AUD-NG-248 (ALTO/P1), relacionado con AUD-NG-247, TAREA-F7-IMP-15 y TAREA-F7-IMP-01/02.
- Tareas derivadas: TASK-597 contrato/validación; TASK-598 conflictos intra-lote; TASK-599 duplicados/operaciones; TAREA-F7-IMP-15 ampliada para rollback; TASK-600 round-trip; TASK-601 UI; TASK-602 pruebas.
- Detalle y aceptación: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-13.md.


## Publicación y control de cambios masivos (TAREA-F7-IMP-14 / AUD-NG-249)

### Estados y previsualización
- getClassSchedules (Code.gs:6718-6764) lee estado desde r[9] || "Activo" y no excluye Borrador en r[7]; el contrato de createClassSchedule coloca Estado en r[7]. Borradores pueden aparecer vigentes. Relación: AUD-NG-246/247, TASK-585 y TASK-591.
- previewPublishImpact (3351-3400) solo cuenta borradores, docentes, aulas y conflictos; no compara contra VersionesHorarios ni produce deltas nuevos/modificados/cancelados, ni detalle por grupo/sección/asignatura/recurso.
- getScheduleVersions/compareScheduleVersions (7119-7221) existen en backend, pero la UI de versiones no está presente en teacher-dashboard.html.

### Alcance, validación y persistencia
- openPublishImpactPreviewModal (js/teacher.js:992-1076) confirma con payload {modo, notificarCambios}; no transmite IDs, año/ofertas, versión ni token de preview.
- publishClassSchedules (Code.gs:7007-7116) filtra por ofertaIds o anoLectivo si se reciben; si faltan ambos publica todos los Borrador. No almacena ni filtra por propietario. Los borradores añadidos después del preview también pueden entrar.
- Revalida bajo LockService con checkScheduleConflict (7493-7691) y detiene conflictos detectados; excluye solo Inactivo y el bloque de restricciones curriculares silencia excepciones. Se relaciona con TASK-598/AUD-NG-248.
- Cambia estados con setValue por fila, sin rollback, staging ni ID de operación. La instantánea VersionesHorarios se intenta después; fallo se registra como WARN y la respuesta puede seguir siendo success. TAREA-F7-IMP-15 debe cubrir atomicidad y recuperación de publicación.
- publishClassSchedules no llama recordEntityChangeLog/HistorialCambiosEntidad; publisher procede de payload.authUserId y no se deriva explícitamente de _verifiedUserId.

### UI, permisos, notificaciones y pruebas
- teacher-dashboard.html (1-1475) no contiene modal-publish-impact-preview ni botón/invocador; js/teacher.js define la función pero no tiene llamada externa. Tampoco existe modal de consulta de versiones.
- ROLE_PERMISSIONS estático: previewPublishImpact para Administrador/Director; publishClassSchedules también en Subdirector/Secretaría/Secretaria/Profesor, sin permiso estático equivalente para preview. Matriz dinámica no inspeccionada.
- No existe llamada desde ACADEMIC a USER dispatchScheduleChangeNotifications/sendMultiChannelNotification. El UI anuncia notificaciones multicanal que no se producen en este flujo. Relación: TASK-577..TASK-583/AUD-NG-245.
- runAcademicPlanningRegressionSuite TC-F7-01..07 y suites regression no cubren CA-F7-87..92. TASK-602 se amplía.
- AUD-NG-249 (ALTO/P1), relacionado con AUD-NG-245..248 y TAREA-F7-IMP-15.
- Nuevas tareas: TASK-603 (diff real de impacto); TASK-604 (lote de publicación inmutable, propiedad/alcance y actor verificado).
- Ampliaciones: TASK-577..583, TASK-585/TASK-591, TASK-598, TASK-601, TASK-602, TASK-567 y TAREA-F7-IMP-15.
- Detalle y criterios verificables: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-14.md.


## Control de concurrencia y operaciones críticas (TAREA-F7-IMP-15 / AUD-NG-250)

### Mapa de escritores y bloqueos
- createClassSchedule (6900-6991), importBulkClassSchedules (3430-3525), publishClassSchedules (7008-7118), saveClassroomResource (7752-7796) y saveClassroomMaintenance (7797-7836) adquieren ScriptLock.
- deleteClassSchedule (6992-7007), generateAutoSchedules (6335-6458), copyClassSchedules (7317-7492), restoreScheduleVersion (7224-7317), applyScheduleTemplate (14000-14080) y saveTeacherWorkLoadPreferences (6842-6875) no comparten ese bloqueo.
- checkScheduleConflict (7493-7693) no bloquea por sí mismo; su seguridad depende del llamador. withConcurrencyLock (3277-3291) existe, pero no se aplica uniformemente a los escritores de planificación.
- getClassSchedules (6718-6768) no devuelve lastUpdated/revisión. createClassSchedule compara existingRow[8] únicamente si el cliente envía lastUpdated; js/teacher.js (738-747, 769-782) no lo envía.
- saveClassroomResource actualiza campos individuales sin versión esperada. saveClassroomMaintenance escribe MantenimientoAulas y SedesAulas en pasos separados sin rollback.
- publish/import/restore/copy/generate/template aplican escrituras múltiples secuenciales; no existe transacción/rollback/reconciliación uniforme.

### Dependencias, estado y errores
- createClassSchedule y publishClassSchedules validan disponibilidad dentro de ScriptLock, pero escritores sin lock pueden modificar los mismos datos durante esas operaciones.
- getTeacherTeachingLoad (6773-6841) excluye solo Inactivo; Borrador/Cancelado pueden afectar la carga. Relación: AUD-NG-247/TASK-591.
- runConcurrencyAndConsistencySuite (3293-3325) prueba solo adquisición/liberación; runAcademicPlanningRegressionSuite (14080-14173) TC-F7-01..07 no cubre CA-F7-93..98.
- doPost registra excepciones como UNHANDLED_EXCEPTION, pero no clasifica de forma uniforme conflictos de planificación, versiones obsoletas, lock timeout y fallos parciales.
- AUD-NG-250 (ALTO/P1), relacionado con AUD-NG-247..249 y TAREA-F7-IMP-15.
- Nuevas tareas: TASK-605 (cobertura uniforme de bloqueo) y TASK-606 (versionado optimista obligatorio).
- Ampliaciones: TAREA-F7-IMP-15 (atomicidad/restauración/copia/generación/mantenimiento); TASK-602 (regresión CA-F7-93..98); TASK-587 (invalidación/frescura); TASK-591 (estado/carga); TASK-598 (conflictos dentro del lote).
- Detalle y aceptación verificable: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-15.md.


## Sustituciones docentes y reasignación de bloques (TAREA-F7-IMP-16)

### Modelo y esquema
- `HorariosClase` se declara con ocho columnas: HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado (índices 0..7). `createTeacherSubstitution` (6501-6568) usa r[8] como estado y desplaza los índices al invocar `checkScheduleConflict`; debe utilizar r[2]/r[3]/r[4], r[5] como aula y r[7] como estado.
- `AsignacionesDocentes` se inicializa con Motivo en índice 8, pero `assignTeacherToClass` puede inicializar SeccionKey en el mismo índice. Normalizar contrato/DTO.
- createTeacherSubstitution escribe Estado=Activa; getStudentSchedule/getIndividualCalendar/syncAcademicScheduleIntegrity esperan Temporal; getCoordinatorOverview espera Activo. Se requiere resolver un estado canónico.
- getTeacherSubstitutions (6570-6616) devuelve data, no sustituciones; calcula Vencida solo en respuesta, no filtra fecha de inicio ni persiste expiración.

### Flujo y consumidores
- createTeacherSubstitution acepta un único ofertaId/sustitutoUserId y devuelve solo clasesAfectadasCount; no vincula cada HorarioID ni permite preview/aplicación multibloque.
- getStudentSchedule (7986-8085) selecciona la primera sustitución Temporal por oferta sin fecha de vigencia; getIndividualCalendar (7925-7980) lista Temporal sin resolver período; syncAcademicScheduleIntegrity (7879-7924) ignora Activa.
- js/teacher.js (1908-1944, 2077-2157) busca botón/modal/campos ausentes en teacher-dashboard.html; si no encuentra oferta, intenta crear una oferta general como efecto lateral; motivo del prompt no se transmite.
- No hay llamada a dispatcher de notificaciones ni consumidor de getTeacherSubstitutions/historial en la UI.
- ROLE_PERMISSIONS permite create/get a Profesor; getTeacherSubstitutions sin filtros devuelve todas las sustituciones; autorizadoPor/forzarSustitucion proceden del payload sin guardia de autorización elevada.

### Hallazgos y dependencias
- AUD-NG-168 ampliado: índices/estados/esquema de sustituciones y conflictos.
- AUD-NG-251 nuevo: autorización contextual, actor y bypass no confiables.
- AUD-NG-245 ampliado: notificaciones de alta/cancelación/vencimiento.
- AUD-NG-246 ampliado: DOM y resolución del docente efectivo por período.
- AUD-NG-250 ampliado: bloqueo/atomicidad para mutaciones de sustitución.
- TASK-607 ciclo de vida y resolución efectiva por fecha; TASK-608 planificación y aplicación multibloque; TASK-609 autorización y atribución verificable.
- Ampliar TASK-584 (UI), TASK-585 (contrato/estados), TASK-586 (ABAC), TASK-567 (actor), TASK-577..583 (notificaciones), TASK-587 (caché), TASK-591 (carga/estado), TASK-598 (conflictos), TASK-602 (CA-F7-99..105), TASK-605/606 (lock/versiones), TASK-173 (jornada/turnos/ausencias).
- Detalle y aceptación verificable: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md.



## TAREA-F7-IMP-17 - Eventos institucionales, participantes y recursos
- CalendarioAcademico: inicializador 9 columnas; writer/reader 13 columnas sin SedeID. Ampliar AUD-NG-236/TASK-554.
- MantenimientoAulas: saveClassroomMaintenance escribe inicio r[2], fin r[3], motivo r[4], estado r[5], actor r[6]; createCalendarEvent usa r[6] como estado y r[3]/r[4] como fechas; slice(1) descarta primera fila sin cabecera. Ampliar AUD-NG-241/TASK-545/546.
- recursosReservados y gruposAfectados son texto libre, sin IDs ni relaciones verificables; disponibilidad no cubre aulas, capacidad, eventos, horarios y recursos compartidos. Ampliar TASK-549/555.
- js/secretary.js envía responsableUserId desde currentUser del cliente. dashboard-secretaria contiene botón/modal; dashboard-direccion tiene modal sin invocador. teacher UI no expone gestión de eventos.
- js/api.js fetchApi no envía token; validateRolePermission exige token. Ampliar AUD-NG-001/TASK-567.
- getAcademicCalendar confía en visibilidadRol del payload; omitirlo devuelve todos, Director/Administrador elimina filtro y no hay aislamiento de participantes. Nuevo AUD-NG-252/TASK-611.
- Sin update/cancel/delete, recurrencia, liberación, diff/historial ni dispatcher. Nuevo AUD-NG-253/TASK-610; ampliar AUD-NG-245/TASK-577..583.
- Suite no cubre CA-F7-106..111. TASK-612.
- Ampliar TASK-554/562, TASK-545/546/549, TASK-555, TASK-567; coordinar TASK-563.
- Detalle: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-17.md.


## Restricciones curriculares y dependencias entre asignaturas (TAREA-F7-IMP-18 / AUD-NG-254/255)

- Almacenamiento: RestriccionesCurriculares con columnas RestriccionID, TipoRestriccion, AsignaturaOrigenID, AsignaturaDestinoID, Ambito, Grado, Seccion, Regimen, Estado, FechaRegistro y UsuarioRegistro. No contiene AnoID, PeriodoID, PlanID, TipoActividad ni recursos vinculados.
- CRUD: getCurricularConstraints (Code.gs:13509-13560) devuelve todos los registros e ignora anoId; saveCurricularConstraint (13562-13650) valida campos mínimos/pares y siempre appendRow. No hay actualización, desactivación, historial de cambios ni preview.
- Motor: checkScheduleConflict (7493-7693) lee RestriccionesCurriculares solo dentro de if(aulaCodigo). Toma la asignatura de params.asignaturaId/materia/asignatura, pero createClassSchedule, generateAutoSchedules y publishClassSchedules pasan OfertaID y no resuelven AsignaturaID/grado/sección. El lector usa rowH[1] como asignatura, rowH[7]/[8] como grado/sección y [9]/[10] como estado, incompatibles con el esquema estándar de HorariosClase.
- Defecto de salida: conflictos.push se ejecuta sin declarar conflictos en su ámbito; catch registra el error y continúa. El arreglo nunca se devuelve y el resultado final es hasConflict:false. No es una validación bloqueante.
- Tipos: solo hay ramas para CoRequisitoSimultaneo y ExclusividadHoraria. MallaCurricularDist almacena RequiereBloqueConsecutivo, pero el motor no lo consulta; tampoco se observan implementaciones para secuencia temporal, compartir recursos o separación obligatoria.
- Alcance/permisos: solo se comparan Ambito=Seccion/Grado; ámbitos no reconocidos no filtran. ROLE_PERMISSIONS permite get/save a Profesor. validateContextualAccess solo comprueba ámbito con scopeType/requestedValue, que la UI no envía. UsuarioRegistro procede de payload.userId/usuario, no de _verifiedUserId.
- Interfaz: js/teacher.js (1512-1595) define handlers; teacher-dashboard.html no contiene botón, modal, formulario ni IDs curr-constraint-*. fetchApi (js/api.js:1-100) no transmite token y los endpoints son privados. AUD-NG-246/AUD-NG-001.
- Pruebas: TC-F7-03 comprueba solo status y forma de array; tests/regression/academic-grading-suite.js no contiene casos curriculares ni CA-F7-112..116.
- Hallazgos: AUD-NG-254 (motor no efectivo) y AUD-NG-255 (modelo/ámbito/ciclo de vida); ampliar AUD-NG-001, AUD-NG-168, AUD-NG-236, AUD-NG-239, AUD-NG-246, AUD-NG-248 y AUD-NG-250.
- Tareas: TASK-613 modelo/ciclo de vida; TASK-614 motor integrado; TASK-615 UI conectada. Ampliar TASK-516, TASK-519, TASK-533, TASK-567, TASK-598, TASK-605 y TASK-606.
- Detalle, criterios CA-F7-112..116 y tareas ejecutables: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-18.md.


## Capacidad y distribución de estudiantes por sección (TAREA-F7-IMP-19 / AUD-NG-256)

- **Esquemas canónicos:** Matriculas (Code.gs:94) = MatriculaID, Fecha, UserId, Alumno, Grado, Seccion, Periodo, Tipo, Estado...; SedesAulas (105) = SedeID, NombreSede, AulaCodigo, NombreAula, Capacidad, TipoEspacio, Estado; HorariosClase (114) = HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado. createClassSchedule añade UltimaModificacion como novena columna.
- **Reporte defectuoso:** getSectionCapacityAnalyticsReport (13657-13810) lee Matriculas con [4]/[5]/[2]/[3] como año/estado/grado/sección; no filtra ofertas por AnoID; lee SedesAulas [1]/[3] como código/capacidad; lee HorariosClase [7]/[8]/[9] como grado/sección/estado y no hace join OfertaID -> OfertaAcademica. Defaults 35/30 y status success ocultan datos ausentes.
- **Validador:** checkScheduleConflict (7493-7691) cuenta matrícula comparando m[5] o m[0] contra OfertaID; no filtra año/grado/sección/estado y acepta estudiantesCount enviado por cliente. La lectura física de SedesAulas [2]/[4] es correcta, pero no se ejecuta si el conteo es 0/incorrecto.
- **Publicación:** createClassSchedule (6900-6990) pasa estudiantesCount del payload; publishClassSchedules (7008-7116) llama al validador sin conteo. La publicación no comprueba estado/AnoID de OfertaAcademica; el filtro anoLectivo usa substring sobre OfertaID.
- **Cupo administrativo:** checkEnrollmentCapacity (11147-11243) sí filtra Matriculas por Periodo/Grado/Seccion/Estado, pero usa capacidad 35 por defecto si no hay oferta/capacidad; reservas se agrupan por año/grado, no sección. createAcademicOffer (6180-6223) también aplica 35 cuando no se proporciona CapacidadMax.
- **Mutaciones:** createStudentEnrollment (11270-11351) y changeStudentSection (11403-11480) validan solo cupo administrativo y no revalidan aula/horario existentes. Reingreso/promoción reutilizan createStudentEnrollment; retiro/traslado cambian estado sin recalcular impacto. Nuevo AUD-NG-256.
- **Override:** forceCapacityOverride truthy evita checkEnrollmentCapacity en alta/cambio de sección, sin autorización específica adicional en las funciones. Ampliar AUD-NG-233/TASK-513 y AUD-NG-234/TASK-514.
- **UI/API:** js/teacher.js (1434-1495) define handlers y fija año 2026; teacher-dashboard.html no contiene botón, modal ni contenedor; fetchApi (js/api.js:11-60) no transmite token. Ampliar AUD-NG-246/AUD-NG-001.
- **Regresión:** TC-F7-04 solo exige status success y arreglo reportes; tests/regression/academic-grading-suite.js no contiene casos de capacidad por sección. Ampliar TASK-551.
- **Tareas:** TASK-616 revalidación posterior a mutaciones; ampliar TASK-548 (cálculo canónico), TASK-549 (alternativas compatibles), TASK-550 (UI), TASK-551 (CA-F7-117..121), TASK-513/514 (override/concurrencia).
- **Dictamen:** CA-F7-117..121 NO CUMPLE. Detalle y tareas ejecutables: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-19.md.


---

## TAREA-F7-IMP-20 — Rendimiento y escalabilidad de consultas de planificación (C1.252)

### Funciones y dependencias inspeccionadas
- `backend/academic-service/Code.gs:getClassSchedules` (6718-6770): lee HorariosClase completo; CacheService con clave por año/grado/sección/docente/oferta/aula y TTL 600 s; filtros aplicados en memoria; el año no restringe filas. Consumidor: `js/teacher.js:loadMasterSchedules` (664-682).
- `backend/academic-service/Code.gs:getStudentSchedule` (7986-8082): consulta HorariosClase, OfertaAcademica, CatalogoAsignaturas, AsignacionesDocentes y Usuarios completas; Matriculas completa cuando no llegan grado/sección. Consumidor: `js/student.js:fetchAndRenderStudentSchedule` (884-955); el parámetro bypassCache no es consumido.
- `backend/academic-service/Code.gs:getClassroomResources` (7694-7749): lee SedesAulas/MantenimientoAulas completas y vuelve a filtrar mantenimientos por cada aula. Consumidor: `js/teacher.js:loadClassroomResourcesTable` (2528-2548).
- `invalidateScheduleCache` (13814-13833): patrones eliminados no corresponden a la clave real de seis dimensiones. No se invoca desde createClassSchedule, deleteClassSchedule ni publishClassSchedules.
- Informes: getPlanningQualityAndOccupancyReport (3525-3595) y getSectionCapacityAnalyticsReport (13657-13810) leen hojas completas; el primero no aplica anoLectivo a HorariosClase.
- Suite interna runAcademicPlanningRegressionSuite (14109-14165): TC-F7-01..07 no miden rendimiento, paginación o caché.

### Hallazgos y relaciones
- AUD-NG-257: lectura completa y filtrado en memoria; complejidad adicional por recorrido de mantenimientos por aula. Relacionado con AUD-NG-168/236/241 y TASK-234.
- AUD-NG-258: invalidación de caché con claves incompatibles y sin invocación en mutaciones ordinarias. Relacionado con TASK-234.
- AUD-NG-259: ausencia de paginación, límites y rangos temporales. Relacionado con TASK-234/TASK-429.
- AUD-NG-260: ausencia de métricas y pruebas comparativas. Relacionado con TASK-234/TASK-252.

### Tareas ejecutables derivadas
- TASK-617: filtros de origen, lectura selectiva, intervalo temporal y paginación para consultas de planificación.
- TASK-618: contrato de caché e invalidación automática después de escrituras.
- TASK-619: telemetría, pruebas de volumen y comparativas de rendimiento antes/después.
- Ampliar TASK-234, TASK-252 y TASK-429; mantener separación respecto de las correcciones de esquema/semántica ya asignadas a AUD-NG-168/236/241.


---

## TAREA-F7-IMP-21 — Auditoría operativa y trazabilidad de planificación (C1.253)

### Dependencias y flujo inspeccionado
- `backend/academic-service/Code.gs:logStructuredEvent` (52-77) -> `LogsSistema`; el catch suprime fallos de escritura.
- `recordEntityChangeLog` (1568-1590) -> `HistorialCambiosEntidad` con nueve columnas. Sus llamadas actuales están en admisión/ciclo de vida, no en las mutaciones de horarios auditadas.
- Mutaciones: `createClassSchedule` (6900-6990), `deleteClassSchedule` (6992-7005), `publishClassSchedules` (7008-7116), `restoreScheduleVersion` (7224-7314), `copyClassSchedules` (7317-7395), `applyScheduleTemplate` (14000-14100), recursos/mantenimiento (7752-7838).
- `getAcademicPlanningAuditLogs` (13837-13890) lee solo HistorialCambiosEntidad; interpreta row[1] como entityType cuando el escritor ACADEMIC lo coloca en row[2]. No consume LogsSistema ni BitacoraTraceability/BitacoraTrazabilidad.
- `getAcademicAuditLogs` (7841-7869) es otro endpoint y consulta BitacoraAuditoriaEstructurada; no sustituye al lector de planificación.
- RBAC: getAcademicPlanningAuditLogs aparece en Profesor y Administrador wildcard; Director/Secretaría tienen getAcademicAuditLogs, no el endpoint de planificación. PUBLIC_ACTIONS no lo declara público; validateRolePermission exige token.
- `js/api.js:fetchApi` (39-57) solo añade requesterUserId/requesterRole; no envía token. `js/teacher.js` llama el endpoint con {}.
- UI: teacher.js 1390-1432 contiene controlador/loader; teacher-dashboard.html completo no tiene botón, modal ni contenedor. ChangesLogs 2547-2568 afirma lo contrario.
- Regresión: TC-F7-07 (14150-14151) solo valida status success y arreglo; una lista vacía puede pasar.

### Hallazgos y reconciliación
- AUD-NG-261: cobertura incompleta de eventos operativos, fallos, conflictos, notificaciones y correlación. Extiende AUD-NG-224/TASK-504 y AUD-NG-145.
- AUD-NG-262: consola no presente en HTML y filtros ausentes; extender TASK-504 y crear TASK-621 para UI de planificación.
- AUD-NG-263: token no propagado y roles no alineados; incluir en TASK-621/TASK-504.
- AUD-NG-264: TC-F7-07 es prueba de humo; coordinar AUD-NG-161 y TASK-621.
- AUD-NG-224 ya contiene el esquema incompatible de HistorialCambiosEntidad, el actor/correlationId, integridad y UI; no crear duplicado.
- AUD-NG-145 ya contiene los problemas generales de LogsSistema, BitacoraEventos, BitacoraTraceability/BitacoraTrazabilidad, DTO, sanitización y productores; no crear duplicado.

### Tareas ejecutables derivadas
- TASK-620: conectar el ciclo de vida de horarios y recursos con historial durable, actor verificado, snapshots, correlationId, estados, conflictos, errores y notificaciones.
- TASK-621: completar consola, filtros, autenticación/RBAC, paginación, renderizado seguro, read-only y pruebas conductuales CA-F7-128..132.
- Ampliar TASK-504 y AUD-NG-224 para el esquema/lector de planificación; ampliar AUD-NG-145 para las fuentes y correlación; coordinar AUD-NG-161 para regresión.


---

## TAREA-F7-IMP-22 — Plantillas y reutilización controlada de horarios (C1.255)

### Dependencias y flujo inspeccionado
- PUBLIC_ACTIONS (Code.gs:249) incluye saveScheduleTemplate, getScheduleTemplates y applyScheduleTemplate. validateRolePermission (524-543) concede estas acciones antes de verificar token.
- doPost (671-681 y dispatcher) conecta las tres acciones a sus funciones de escritura/consulta.
- createClassSchedule (6900-6990) escribe HorariosClase con Estado en row[7] y UltimaModificacion en row[8].
- getClassSchedules (6718-6770) interpreta columnas de grado/sección/estado bajo otro contrato.
- saveScheduleTemplate (13895-13960) intenta extraer grado/sección desde row[7..9], lo que no coincide con el escritor ordinario.
- getScheduleTemplates (13961-13999) expone estructura JSON, creador y metadatos de plantillas.
- applyScheduleTemplate (14000-14099) invoca checkScheduleConflict sin ofertaId; no bloquea la escritura cuando conflictos no está vacío y agrega filas con un esquema de once columnas.
- checkScheduleConflict (7493-7691) usa ofertaId y recursos; no consume grado/sección/materia.
- teacher.js (1297-1368) contiene controladores huérfanos; teacher-dashboard.html completo no tiene modal, formulario, botón ni contenedor de plantillas.
- TC-F7-06 (runAcademicPlanningRegressionSuite, 14109-14165) solo comprueba éxito y arreglo; no verifica guardar/aplicar/preview ni CA-F7-133..137.

### Hallazgos y reconciliación
- AUD-NG-265: bypass de autenticación para consulta y mutación de plantillas; CRÍTICO/P0.
- AUD-NG-266: extracción y escritura incompatibles con HorariosClase; ALTO/P1; ampliar AUD-NG-168/AUD-NG-236/AUD-NG-241.
- AUD-NG-267: referencias y conflictos del destino no validados/bloqueados; ALTO/P1; ampliar AUD-NG-236.
- AUD-NG-268: UI de plantillas ausente, sin selección, preview ni ajuste; MEDIO/P2.
- AUD-NG-269: aplicación sin evento durable ni pruebas conductuales; MEDIO/P2; ampliar AUD-NG-261/TASK-620, AUD-NG-224/TASK-504 y AUD-NG-145.
- TASK-234/TASK-252/TASK-429 mantienen sus alcances de rendimiento, telemetría y paginación general; no sustituyen el flujo funcional de plantillas.

### Tareas ejecutables derivadas de los hallazgos
- TASK-622: cerrar el bypass público, exigir token y autorización contextual para guardar/listar/aplicar plantillas.
- TASK-623: normalizar el esquema, corregir la captura de origen y permitir selección explícita de componentes reutilizables.
- TASK-624: validar referencias y disponibilidad del período destino, bloquear conflictos y aplicar mediante preview/ajuste/confirmación.
- TASK-625: integrar UI real y pruebas conductuales de todo el ciclo de vida de plantillas.
- Ampliar TASK-620 para evento de aplicación con plantillaId, actor, destino, resultado y correlationId; ampliar TASK-504/AUD-NG-224 y AUD-NG-145 para historial/bitácora; ampliar AUD-NG-168/236/241 para esquema y motor de conflictos.


---

## TAREA-F7-IMP-23 — Impresión y distribución de horarios (C1.256)

### Dependencias y flujo inspeccionado
- teacher-dashboard.html (1-1475) no contiene modal-print-schedule, print-schedule-preview-area, schedule-matrix-container ni schedules-table-body.
- student-dashboard.html (1-412) no contiene modal-student-print-schedule ni student-schedule-container.
- teacher.js (1251-1294) define openPrintScheduleModal/executePrintSchedule; el controlador fija “DOCUMENTO OFICIAL PUBLICADO” y período 2026, copia un nodo ausente y cae a window.print().
- student.js (874-882) define el controlador de impresión, pero solo llama window.print(); no crea .printable-schedule-area.
- style.css (946-971) oculta body * y muestra únicamente .printable-schedule-area; la ruta estudiante no crea ese nodo y la ruta docente no lo crea cuando falta previewContainer.
- Code.gs getStudentSchedule (7986-8070) usa grado/sección del payload si ambos vienen; AUD-NG-246 ya registra falta de validación de matrícula/ámbito.
- Code.gs exportBulkClassSchedules (3403-3427) ignora anoLectivo en el filtro y exporta DocenteUserId; los defectos de exportación masiva ya están en AUD-NG-248/TASK-597..602.

### Hallazgos y reconciliación
- AUD-NG-270: flujo de impresión docente desconectado de HTML/preview; ALTO/P1.
- AUD-NG-271: metadatos docente falsos (estado publicado y período 2026 constantes); ALTO/P1.
- AUD-NG-272: impresión estudiante sin área imprimible; ALTO/P1.
- AUD-NG-273: paginación insuficiente y numeración fija; MEDIO/P2.
- AUD-NG-246/TASK-584..589: ampliar nodos y ámbito autorizado al flujo de impresión; no duplicar el defecto de identidad/matrícula.
- AUD-NG-247: ampliar filtros de período/alcance para documentos imprimibles.
- AUD-NG-248/TASK-597..602: reutilizar tareas existentes para CSV/JSON y filtros; no crear duplicados.
- AUD-NG-161: coordinar pruebas de impresión, permisos y datos restringidos.

### Tareas ejecutables derivadas de los hallazgos
- TASK-626: integrar UI docente, filtros por docente/sección/aula/período/fechas y preview con dataset autorizado.
- TASK-627: integrar impresión estudiante con área imprimible y matrícula/ámbito verificados en servidor.
- TASK-628: generar snapshot con metadatos reales de período, filtros, fecha y versión/estado; preservar documentos generados y no etiquetar borradores como oficiales.
- TASK-629: completar paginación, saltos, encabezados/pies y legibilidad multipágina.


---

## Fe de erratas C1.258 — TAREA-F7-IMP-22
- Code.gs:249 es ROLE_PERMISSIONS["Profesor"]; PUBLIC_ACTIONS se declara en línea 265 y no contiene acciones de plantillas.
- AUD-NG-265 queda invalidado; TASK-622 queda retirada/no ejecutable. No reutilizar el ID.

## Ampliación C1.258 — TAREA-F7-IMP-23 / CA-F7-140
- ROLE_PERMISSIONS permite getClassSchedules a Estudiante y Alumno (Code.gs:261).
- getClassSchedules acepta filtros opcionales y puede retornar todos los horarios cuando se omiten; validateContextualAccess no ata los filtros a la identidad verificada si el payload no incluye scopeType/requestedValue.
- Ampliar AUD-NG-246/TASK-586 y TASK-626/TASK-627. No duplicar el hallazgo de ámbito.
- El último checkpoint válido de continuidad es C1.254; C1.255 no es válido. Los registros C1.256/C1.257 se conservan como historia, no como punto inicial de continuidad.


## Preferencias de calendario y personalización de vistas (TAREA-F7-IMP-24 / AUD-NG-274..276)

### UI y consumidores
- teacher-dashboard.html (1475 líneas) no contiene .cal-cat-checkbox, data-category, contenedor, leyenda, navegación ni detalle; las dos coincidencias de calendar son iconos no relacionados.
- student-dashboard.html (412 líneas) no contiene calendario ni controles.
- js/teacher.js 1221-1250 y js/student.js 844-875 solo definen toggles/reset; no existe consumidor de getAcademicCalendar/getUnifiedInstitutionalCalendar en módulos JS.
- No hay vista día/semana/período, filtros por asignatura/sección/estado, detalle ni composición responsive.

### Preferencias y eventos críticos
- calendar_view_prefs y student_cal_view_prefs son claves globales por portal/origen; no incluyen identidad autenticada. Cuentas distintas en el mismo navegador comparten preferencias.
- No hay hidratación inicial ni reaplicación tras render/refresh. Los reset handlers dependen de checkboxes ausentes.
- Los toggles ocultan cualquier data-category; no hay allowlist ni protección de cancelaciones/cambios críticos.

### Contratos, visibilidad y datos
- getAcademicCalendar (Code.gs 6616-6644) filtra solo anoId y visibilidadRol recibido del cliente; omitir visibilidad no filtra y Director/Administrador permite todo.
- getUnifiedInstitutionalCalendar (5008-5065; doPost 839) autoriza cualquier sesión válida por bypass de validateRolePermission 545-550; no aplica visibilidad/ámbito. Su lectura de CalendarioAcademico usa índices anteriores al contrato de 13 columnas (AUD-NG-236/TASK-554).
- getIndividualCalendar (7925-7983) acepta fechaInicio/fechaFin pero no los aplica; getUnifiedInstitutionalCalendar no integra clases/evaluaciones y asigna fecha actual a actividades extracurriculares.
- fetchApi (js/api.js 11-60) no transmite token; ampliar AUD-NG-001/TASK-567.
- Ciclo de vida/refresh incompleto; ampliar AUD-NG-253/TASK-610 y TASK-562.

### Hallazgos y criterios
- AUD-NG-274 ALTO/P1: falta calendario integrado, controles, datos y navegación en ambos portales.
- AUD-NG-275 MEDIO/P2: preferencias compartidas por navegador y no rehidratadas.
- AUD-NG-276 ALTO/P1: categorías críticas ocultables sin protección.
- CA-F7-143 PARCIAL; CA-F7-144/145/146/147 NO CUMPLE.

### Tareas ejecutables derivadas
- TASK-630: integrar calendario en portales docente/estudiante, DTO, categorías, filtros, detalles, navegación, ámbito y móvil.
- TASK-631: preferencias por usuario, hidratación/reaplicación/reset y protección de eventos críticos.
- TASK-632: regresión CA-F7-143..147 para filtros, RBAC, preferencias, eventos críticos, refresh y móvil.

### Dependencias existentes ampliadas
- AUD-NG-252/TASK-611: autorización/visibilidad de lecturas.
- AUD-NG-236/TASK-554: contrato y mapeo.
- AUD-NG-001/TASK-567: token en fetchApi.
- AUD-NG-243/TASK-561 y AUD-NG-253/TASK-610: excepciones/ciclo de vida.
- AUD-NG-246/TASK-562: filtros temporales y refresh.
- AUD-NG-161/TASK-612: regresión.


---

## Auditoría TAREA-F7-IMP-25 — pruebas automatizadas de planificación (2026-11-08)

### Evidencia
- ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: runAcademicPlanningRegressionSuite 14109-14173 contiene siete casos TC-F7-01..07 con comprobaciones de forma/estructura; checkScheduleConflict 7493-7720 y getTeacherTeachingLoad 6773-6840 no se validan por resultados esperados.
- runConcurrencyAndConsistencySuite 3296-3327 solo realiza una adquisición/liberación de ScriptLock; no crea contención ni prueba publicación concurrente.
- getOrCreateSheet 84-88 y logStructuredEvent 52-77 crean hojas/agregan filas en el Spreadsheet configurado; el runner llama funciones que consultan/crean hojas y no dispone de fixtures aislados.
- getCurricularConstraints 13509-13522 crea RestriccionesCurriculares si falta; getTeacherSubstitutions 6570-6575 y getTeacherTeachingLoad 6777-6786 usan getOrCreateSheet.
- DEVELOPER Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412 sin suite F7 específica. academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6, 412 líneas, sin TC-F7 ni IMP-25.

### Hallazgos y criterios
- AUD-NG-277 ALTO/P1: aserciones superficiales; no prueban resultados de negocio ni CA-F7-148..153.
- AUD-NG-278 ALTO/P1: suite acoplada al Spreadsheet institucional; riesgo de crear hojas/filas y contaminación de datos.
- AUD-NG-279 ALTO/P1: sin concurrencia real, integración entre módulos ni separación unit/integration/E2E.
- CA-F7-148..153 NO CUMPLE; CA-F7-154 PARCIAL.

### Tareas ejecutables derivadas
- TASK-633: aislar suite con Spreadsheet/repositorios de prueba, fixtures y teardown; bloquear el uso de datos productivos.
- TASK-634: cubrir conductualmente cada regla de planificación, permisos, errores, rollback, notificaciones y vistas.
- TASK-635: concurrencia controlada, integración/E2E y reporte reproducible con resultados parciales.

### Dependencias existentes ampliadas
- AUD-NG-161/TASK-612: estrategia y cobertura de regresión.
- AUD-NG-252/TASK-611: autorización y ámbito.
- AUD-NG-236/TASK-554: contratos entre módulos.
- AUD-NG-253/TASK-610: ciclo de vida de horarios.
- AUD-NG-246/TASK-562: consistencia de proyecciones.


---

## F8-Task01 / TAREA-AD-06 — autorización efectiva en USER, ACADEMIC y TASK (2026-11-08)

### Dictamen y evidencia actual
- F8-Task01 figura [X] en completadas.md, pero CA-AD-114 y CA-AD-115 NO CUMPLEN. Informe individual no existía; se auditó directamente.
- USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: PUBLIC_ACTIONS 922-924; validateRolePermission 1253-1295; getAutomationRules 6584-6605; verifySessionToken 1083-1143; revokeUserSession 2318-2333; savePermissionMatrix 1934-1978.
- ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: PUBLIC_ACTIONS 265; validateContextualAccess 465-521; validateRolePermission 524-583; verifySessionToken 401-459; purgeSecurityCaches 3702-3745.
- TASK Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe: PUBLIC_ACTIONS 85-90; validateRolePermission 225-280; getStudentTasks 613-690; getTeacherActivity 1119-1168; getAllTasks 1177-1203; listProjects 1296-1335; loadProject 1371-1404; getAllStudentProjects 1407-1450; getVirtualClassrooms 1476-1505; getPosts 1526-1560; getStudyMaterials 1632-1663; purgeSecurityCaches 1919-1959.

### Exposiciones confirmadas
- TASK PUBLIC_ACTIONS omite autenticación para consultas de tareas, proyectos, aulas, posts y materiales. getAllTasks devuelve todo si se omite profesorId; getAllStudentProjects enumera fileIds y datos de estudiantes; loadProject usa DriveApp.getFileById(fileId) como fallback sin validar propiedad.
- TASK getPosts toma authRole del payload para habilitar borradores; un rol de cliente falsificado altera el resultado.
- TASK getTeacherActivity permite omitir o manipular profesorId; no lo liga a _verifiedUserId.
- USER validateRolePermission tiene allowlist autenticada que evita RBAC/contexto; getAutomationRules no aplica guardia interna y devuelve todas las reglas.
- ACADEMIC validateRolePermission omite RBAC/contexto para getSchoolYearConfigs, getAcademicJornadas, getCurricularDistribution, getInstitutionalActivities, getExtracurricularActivities y getUnifiedInstitutionalCalendar.
- USER/ACADEMIC validadores ABAC condicionan el scope a campos opcionales del payload; ausencia de hoja/datos o excepción puede dejar continuar. TASK solo restringe studentId/userId si llega.
- verifySessionToken no exige exp/userId y no revalida el rol actual; AUTH_TOKEN_SECRET tiene fallback determinista desde SPREADSHEET_ID.
- USER revoca en su ScriptCache; no se verificó fan-out. ACADEMIC/TASK purgadores remotos borran revoked_session_ y claves de caché que no coinciden con las consumidas.
- TASK registra denegaciones solo con Logger.log; no existe bitácora estructurada equivalente. tests/regression contiene solo dos suites, sin pruebas auth/IDOR/RBAC/ABAC.

### Hallazgo nuevo
- AUD-NG-280 ALTO/P1: getAutomationRules queda autorizado a cualquier sesión válida por allowlist de USER y no valida rol dentro del handler.

### Reconciliación, sin duplicar IDs
- AUD-NG-002 se amplía con las rutas públicas TASK y el uso de authRole/client fileId.
- AUD-NG-217/TASK-496 y AUD-NG-222/TASK-502 se amplían con el ámbito docente de TASK y los scopes opcionales/fail-open.
- AUD-NG-003/AUD-NG-004: claims obligatorios y secreto HMAC.
- AUD-NG-005/AUD-NG-160: propagación de revocación, cambio de rol y cachés.
- AUD-NG-145: persistencia de intentos rechazados y escaladas.
- AUD-NG-159: logoutUser público con userId/sessionId de cliente.
- AUD-NG-221/TASK-501: matriz dinámica ignora módulo/ámbito.

### Tareas ejecutables derivadas
- TASK-636 (P0): retirar acciones sensibles de bypasses públicos/allowlists; vincular identidad/rol a claims; validar propiedad de tareas, profesor, aula, borradores y archivos; restringir getAutomationRules.
- TASK-496 (P0), TASK-501 (P1) y TASK-502 (P1) siguen pendientes y se amplían; no crear duplicados.
- AUD-NG-003/004/005/145/159/160 mantienen sus alcances de expiración, secreto, revocación, bitácora, logout y rol vigente.
- TASK-633, TASK-634 y TASK-635 derivados de IMP-25 se incorporan al backlog.

### Límites
Inspección estática/manual y Git/blob; no se ejecutaron requests HTTP, Apps Script, Script Properties, cuentas reales ni recursos productivos. No se puede confirmar desde el repositorio si AUTH_TOKEN_SECRET está configurado en cada deployment.


---

## F8-Task02 / TAREA-MOD-01 — Inventario y dependencias del repositorio (C1.262)

### Evidencia estructural
- Árbol Git de `NG_beta_0.0.0.1_work`: 974 archivos versionados; 100 HTML, 1 HTM, 24 JS, 6 CSS, 6 GS, 27 JSON, 359 PNG, 125 JPG y 65 PDF.
- `docs/architecture/repository-inventory.md` (40 líneas) enumera solo un subconjunto de páginas, módulos JS, servicios y recursos.
- Rutas existentes omitidas como elementos concretos del inventario: `III_BTP_A/dw_II/DOM.html` y `II_BTP_A/Informatica_Aplicada_I/estilos.css`.
- `docs/architecture/routing-and-paths.md` declara que todos los HTML cargan scripts/CSS sin 404, pero no adjunta matriz de rutas ni evidencia por archivo.
- `tests/regression/modular-dashboard-suite.js` (61 líneas) comprueba un conjunto fijo de archivos y cadenas; no acredita cobertura de todos los HTML/recursos ni ausencia de ciclos/globales.

### Hallazgos
- AUD-NG-281: inventario incompleto (ALTO/P1).
- AUD-NG-282: mapa y afirmaciones de rutas sin cobertura integral verificable (ALTO/P1).
- AUD-NG-283: falta de evidencia de análisis integral de duplicaciones, globales y ciclos (MEDIO/P2; no implica que se haya confirmado un ciclo).

### Tareas ejecutables derivadas
- TASK-637 (P1): completar el inventario de todos los archivos versionados.
- TASK-638 (P1): trazar dependencias estáticas/dinámicas y contratos por archivo.
- TASK-639 (P2): revisar manualmente duplicaciones, símbolos globales, ciclos y acoplamientos.

### Punto de entrada y límites
- Existe `index.html` en la raíz; `index.htm` no existe. No se renombró ni modificó el punto de entrada.
- Dictamen: CA-MOD-101 NO CUMPLE; CA-MOD-102 PARCIAL. La auditoría no declara descartados duplicados/ciclos; TASK-639 queda pendiente.


---

## F8-Task03 / TAREA-MOD-04 — Auditoría de rutas y dependencias (C1.263)

### Rutas/recursos con destino ausente
- `developer-dashboard.html:9` → `css/custom.css` (no existe en árbol).
- `pseudocode.html:10–11` → `IMA-Logo.png` (no existe en raíz ni como `imagenes/IMA-Logo.png`).
- `sw.js:11` → `./css/styles.css` (no existe; existe `css/style.css`). `cache.addAll(ASSETS)` en línea 26 consume la lista completa.
- `js/teacher.js:2831` → `migrated_questions.json`; línea 2883 → `migration_stats.json`. Ambos faltan en la raíz del árbol. El botón de migración está en `teacher-dashboard.html`.

### Mapa y documentación
- `js/config.js:734–746`: MODULE_ROUTING_DICTIONARY define diez rutas de home/login/dashboards; no representa todas las páginas y destinos existentes.
- `docs/architecture/routing-and-paths.md:25–28`: afirma ausencia de 404 en todos los HTML sin aportar evidencia HTTP/consola por página.
- `tests/regression/modular-dashboard-suite.js:1–61`: comprueba existencia de archivos y presencia de cadenas/funciones, no resolución real de todas las rutas ni instalación del Service Worker.

### Hallazgos y tareas ejecutables derivadas
- AUD-NG-284 (MEDIO): referencias a CSS/iconos inexistentes → TASK-640.
- AUD-NG-285 (ALTO): precache PWA con ruta CSS inexistente → TASK-641.
- AUD-NG-286 (ALTO): JSON del flujo de migración ausentes → TASK-642.
- AUD-NG-287 (MEDIO): diccionario/documentación de rutas sin cobertura integral → TASK-643.
- AUD-NG-288 (ALTO): falta evidencia de verificación de producción → TASK-644.

### Dictamen
- CA-MOD-107: NO CUMPLE.
- CA-MOD-108: NO CUMPLE.
- No se declaran respuestas HTTP 404 observadas ni pruebas runtime ejecutadas; las rutas se verificaron contra el árbol Git y los criterios de producción permanecen sin evidencia.


---

## F8-Task04 / TAREA-MOD-06 — Regresión modular y dashboards (C1.264)

### Dependencias y flujo inspeccionados
- `tests/regression/modular-dashboard-suite.js` (61 líneas): fs/path; ocho rutas, cadenas en config y nombres de funciones. No invoca la suite backend. `../../MapaDependencias.md` apunta a raíz y no existe; mapa real: `AUDITORIAS/MapaDependencias.md`.
- `backend/developer-service/Code.gs:24`: ROLE_PERMISSIONS, Administrador -> comodín.
- `backend/developer-service/Code.gs:115–142`: verifySessionToken sin revocación de usuario/sesión ni estado de cuenta.
- `backend/developer-service/Code.gs:145–174`: doPost acepta payload.authRole si no hay token y autoriza con ROLE_PERMISSIONS.
- `backend/developer-service/Code.gs:1638–1728`: configuración de espacios admite payload.spaceConfig y solo compara DIRECT_UNCONTROLLED_WRITE.
- `backend/developer-service/Code.gs:2040–2100`: cinco pruebas REG-01..REG-05; no prueban login, navegación, RBAC, IDOR, revocación, scopes ni procesos académicos.
- `backend/developer-service/Code.gs:2599–2615`: getServiceHealthDiagnostics retorna PASS constante.
- `backend/user-service/Code.gs:1083–1143`: sí comprueba revoked_user_, revoked_session_ y estado de cuenta.
- `js/api.js` y `js/auth.js`: dependencias frontend revisadas como contexto; no se prueban browser/DOM.

### Hallazgos y tareas derivadas
- AUD-NG-289 CRÍTICO: bypass RBAC por authRole → TASK-645.
- AUD-NG-290 ALTO: sesiones revocadas/inactivas aceptadas en DEVELOPER → TASK-646.
- AUD-NG-291 ALTO: no hay pruebas efectivas RBAC/IDOR/scopes/revocaciones → TASK-647.
- AUD-NG-292 ALTO: dashboard/ámbitos solo validan catálogo → TASK-647 y TASK-649.
- AUD-NG-293 ALTO: diagnóstico genérico en lugar de procesos académicos → TASK-648.
- AUD-NG-294 MEDIO: suite Node estática y ruta del mapa incorrecta → TASK-650.
- AUD-NG-295 MEDIO: status success incondicional → TASK-651.
- AUD-NG-296 ALTO: sin evidencia de ejecución integral → TASK-648 y TASK-649.

### Dictamen
- CA-MOD-110: NO CUMPLE.
- CA-MOD-111: NO CUMPLE.
- No se ejecutó Node/Apps Script/browser/HTTP; la ruta incorrecta se comprobó contra el árbol Git. El bypass se identificó por inspección, no por ataque en producción.


---

## F8-Task05 / TAREA-MOD-07 — Reorganización por etapas verificables (C1.265)

### Componentes y flujo inspeccionados
- docs/architecture/staged-migration-procedure.md: cinco etapas declaradas; no incluye etapa separada de módulos compartidos.
- backend/developer-service/Code.gs:1748–1796 getArchitectureAndDependencyMapReport usa una lista predeterminada de documentos y mapValid depende de que no esté vacía.
- backend/developer-service/Code.gs:1896–1964 validateModularFolderStructure compara cadenas de rutas con manifiesto; no consulta el árbol Git real.
- backend/developer-service/Code.gs:1967–2037 validateStagedMigrationProgress mapea el registro de servicios, catálogo documental, estructura declarativa, contratos y suite a estados de etapa.
- backend/developer-service/Code.gs:2325–2349 executeServiceVersionRollback valida parámetros/confirmación y devuelve flags de restauración true sin ejecutar operaciones de restauración.
- backend/developer-service/Code.gs:2415–2469 getCentralServiceRegistry retorna servicios predeterminados también ante hoja vacía o excepción.
- tests/regression/modular-dashboard-suite.js: aserciones estáticas de existencia de documento y presencia de nombre de función; no ejecuta migración/rollback.
- ChangesLogs.txt: entrada F8-Task05 del 2026-10-28 registra creación del documento, función y aserciones, no evidencia de ejecución.

### Hallazgos y tareas derivadas
- AUD-NG-297 ALTO: baseline/tag/checksums no verificados → TASK-652.
- AUD-NG-298 ALTO: verificación de etapas basada en catálogos/manifest estáticos → TASK-653.
- AUD-NG-299 CRÍTICO: rollback declarativo sin restauración → TASK-654.
- AUD-NG-300 ALTO: falta etapa de módulos compartidos y trazabilidad por hito → TASK-655 (ampliar TASK-650/TASK-651).

### Dictamen
- CA-MOD-112: NO CUMPLE.
- CA-MOD-113: NO CUMPLE.
- Referencia v8.4.0-baseline no encontrada; no se ejecutaron migración ni rollback; no se afirma verificación de producción.


---

## F8-Task06 / TAREA-F8-MANT-01 — Cuotas y almacenamiento Drive (C1.266)

### Componentes y relaciones inspeccionados
- backend/task-service/Code.gs:5–6 define SPREADSHEET_ID y DRIVE_FOLDER_ID.
- backend/task-service/Code.gs:29–62 logFileMetadata registra fileId/URL en MetadatosArchivos; RutaDrive recibe URL, no ruta verificable.
- backend/task-service/Code.gs:704–789 uploadFile crea archivos bajo DRIVE_FOLDER_ID/grado/sección/alumno/parcial/asignatura/tarea.
- backend/task-service/Code.gs:795–889 contiene la carga fragmentada antigua y su reconstrucción.
- backend/task-service/Code.gs:892–998 submitAssignment y saveSubmissionDraft registran entregas/versiones; guard de cuota solo en 99.5% y fail-open en error; no valida el archivo final.
- backend/task-service/Code.gs:1231–1247 getStudentFolder; 1249–1293 saveProject/Proyectos_PSeInt.
- backend/task-service/Code.gs:1455–1472 getOrCreateFolder.
- backend/task-service/Code.gs:1665–1695 createStudyMaterial registra URL/driveId sin validar archivo; teacher.js:1978–1987 puede enviar URL genérica.
- backend/task-service/Code.gs:1819–1916 initiateResumableUpload crea .temp_resumable_uploads.
- backend/task-service/Code.gs:1967–2060 uploadChunk efectiva; marca COMPLETED y devuelve success sin comprobar error de reconstructFileParts.
- backend/task-service/Code.gs:2062–2118 progreso/cancelación; 2120–2185 reconstrucción.
- backend/task-service/Code.gs:2299–2363 getDriveStorageQuotaMetricsReport; PUBLIC_ACTIONS:85–89 incluye la acción.
- js/student.js:2355–2410 carga segmentada; 2500–2585 confirma entrega según status success.
- js/teacher.js:1978–1994 publica material; js/api.js no contiene llamada específica al reporte de cuota.
- Árbol Git: 978 archivos; no appsscript.json ni documento AUDITORIA_FASE_8_AULA_VIRTUAL_APRENDIZAJE.md.

### Hallazgos y tareas derivadas
- AUD-NG-301 ALTO: métricas inexactas/fail-open → TASK-656.
- AUD-NG-302 ALTO: sin trigger periódico, histórico ni tendencia → TASK-657.
- AUD-NG-303 ALTO: umbrales hard-coded y sin alertas/eventos persistentes → TASK-658.
- AUD-NG-304 CRÍTICO: carga reanudable reporta éxito sin reconstrucción; posible pérdida de sesión anterior → TASK-659.
- AUD-NG-305 ALTO: temporales y partes huérfanas sin reconciliación → TASK-660.
- AUD-NG-306 MEDIO: endpoint público de métricas → ampliar TASK-636.

### Dictamen
- CA-F8-010: NO CUMPLE.
- CA-F8-011: NO CUMPLE.
- CA-F8-012: NO CUMPLE.
- No se ejecutaron triggers, Drive API, carga real ni pruebas de producción; no se modificó código ni se tocaron archivos Drive productivos.


---

## F8-Task07 / TAREA-AD-01 — Dashboards dinámicos por roles configurables (C1.267)

### Componentes y relaciones inspeccionados
- `app/html/dashboards/dynamic-dashboard.html` SHA 765a45e5666c24c430e841cb70c3d71d03cf9074: 50 líneas; estructura, grid y scripts; sin UI de alta/edición de roles ni rutas de módulos.
- `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: 5810–5872; loadDynamicDashboard solo consulta por userId y pinta tarjetas; “Acceder” es span sin destino.
- `backend/user-service/Code.gs` SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: 1146–1162 token obligatorio; 1253–1295 RBAC; 1863–1898 matriz rol+acción; 8968–9180 catálogos/responsabilidades/asignaciones; 9253–9304 dashboard de seis roles con fallback docente; 9631–9808 roles internos/asignaciones.
- `js/config.js` SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: catálogos estáticos de capacidades, módulos y responsabilidades; contratos/rutas.
- `js/api.js` SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: 45–59 propaga requesterUserId/requesterRole, no token de sesión.
- `tests/regression/modular-dashboard-suite.js` SHA 0495e1d526a872c33310935a003a83d924d34683: 61 líneas, aserciones de presencia y cadenas, sin pruebas de comportamiento.
- Pendientes.md blob actual recuperado: 676a3f798715f0cdd7d4bc75768472545b8465ee, 1.786.011 caracteres, 20.224 líneas, 0 U+FFFD.

### Hallazgos y tareas derivadas
- AUD-NG-191 ALTO: mapa rígido, fallback de Profesor y accesos decorativos → ampliar TASK-488.
- AUD-NG-225 ALTO: falta de UI de gestión integrada y dashboard desconectado de responsabilidades/asignaciones → ampliar TASK-505.
- AUD-NG-221 ALTO: matriz no aplica módulo/ámbito → ampliar TASK-501.
- AUD-NG-003 / TASK-636: falta propagación de token en la consulta dinámica → ampliar TASK-636.
- No se crean IDs nuevos para evitar duplicar causas ya registradas.

### Dictamen
- CA-AD-101: NO CUMPLE.
- CA-AD-102: NO CUMPLE.
- CA-AD-103: NO CUMPLE.
- No se ejecutaron pruebas runtime ni se modificó código fuente.


---

## F8-Task08 / TAREA-AD-02 — Catálogo central (C1.268)

### Dependencias inspeccionadas
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: catálogos estáticos de capacidades, módulos y responsabilidades (1–72); contratos dinámicos (aprox. 755–803).
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: getCentralCapabilitiesCatalog (8928–8966), getInstitutionalResponsibilitiesCatalog (8968–9032), saveInstitutionalResponsibility (9034–9114), assignRoleScope (9116–9180), manageInternalRoleCatalog/getInternalRoleCatalog/getInternalRoleAssignments (9631–9808).
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: getCentralCapabilitiesCatalog (2224–2259), getCentralConfigAndContractCatalog (2262–2283), manageUserMultiRolePermissions (2584–2596).
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: 1–61; aserciones estáticas.
- USER/DEVELOPER duplican ocho capacidades y trece módulos; config.js vuelve a declarar los catálogos; la lista de responsabilidades del cliente tiene cinco entradas y el fallback backend tres.
- RESP_CONSULTA_ESTUDIANTIL referencia cuatro moduleId no definidos en MODULES_CATALOG; el mapa DYNAMIC_DASHBOARD_MODULE_CONTRACTS tiene seis contratos frente a trece módulos catalogados.
- La persistencia actual guarda módulos/capacidades como JSON dentro de cada fila de ResponsabilidadesInstitucionales, sin validación de referencias ni tablas de relaciones efectivas.
- manageUserMultiRolePermissions devuelve roles/áreas recibidos sin escritura; assignRoleScope no enlaza responsibilityId/capacities y upsert usa userId+scopeType.
- Historial anterior de saveInstitutionalResponsibility solo incluye name; rama activar/desactivar de manageInternalRoleCatalog actualiza estado y fecha, sin evento de auditoría.
- getInstitutionalResponsibilitiesCatalog devuelve tres defaults activos cuando no encuentra filas activas.
### Hallazgos y tareas
- AUD-NG-307 catálogo duplicado → TASK-661.
- AUD-NG-308 referencias huérfanas y validación ausente → TASK-662.
- AUD-NG-309 falta de relaciones persistentes e independencia de permisos → TASK-663.
- AUD-NG-310 trazabilidad parcial → TASK-664.
- AUD-NG-311 fallback de responsabilidades tras desactivación total → TASK-661/TASK-662; no crear tarea separada.
- Dependencias: TASK-488, TASK-501, TASK-505 y TASK-636.
### Dictamen
- CA-AD-104: NO CUMPLE.
- CA-AD-105: NO CUMPLE.
- CA-AD-106: NO CUMPLE.


---

## F8-Task09 / TAREA-AD-03 — Gestión del ámbito de actuación de los roles (C1.269)

### Componentes y relaciones inspeccionados
- USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: validateContextualAccess 1213–1251 no aplica ámbitos a roles generales; assignRoleScope 9116–9181 escribe 12 valores con 8 encabezados y actualiza por userId+scopeType; getUserScopeConfig 9183–9220 ignora roleId y vigencia; validateRoleScopeAccess 9222–9252 no se integra como guard transversal.
- ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: validateContextualAccess 465–522 solo valida scopeType+requestedValue opcionales y absorbe errores; validateAcademicResponsibilityAndScopeAccess 13244–13420 es una acción independiente, confía en userId/role de payload y no protege transversalmente las operaciones.
- ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: 5790–5820; filterDataByScope permite registros sin atributo de ámbito y validateUserScopeContext depende de configuración cliente.
- api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: 45–59 no propaga token de sesión; dependencia TASK-636.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: 1–61, pruebas estáticas sin casos de aislamiento contextual.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task09, líneas 4970–4990 [X].
- Pendientes.md: blob actual 676a3f798715f0cdd7d4bc75768472545b8465ee (1.786.011 caracteres, 20.224 líneas, 515 IDs únicos, máximo TASK-636); blob histórico 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c (1.782.094 caracteres, 20.182 líneas, 511 IDs únicos, máximo TASK-511). Ambos recuperados desde commits alcanzables de la rama; no se restauró la versión histórica.

### Hallazgos y tareas derivadas
- AUD-NG-312 CRÍTICO/P0: enforcement backend opcional/fail-open → TASK-666; ampliar TASK-501 y TASK-636.
- AUD-NG-313 CRÍTICO/P0: esquema y upsert colisionan entre roles → TASK-667; ampliar TASK-663/TASK-664.
- AUD-NG-314 ALTO/P1: falta resolver rol, vigencia y jerarquía → TASK-668; ampliar TASK-663.
- AUD-NG-315 ALTO/P1: filtro frontend admite atributo ausente → TASK-669; ampliar TASK-665.
- TASK-665 incorpora pruebas de alcance, fechas, jerarquía, roles múltiples, omisiones y fallos de fuente de autorización.

### Dictamen
- CA-AD-107: NO CUMPLE.
- CA-AD-108: NO CUMPLE.
- No se ejecutaron pruebas runtime ni se modificó código fuente.


---

## F8-Task10 / TAREA-AD-04 — Dashboard de coordinador académico (C1.270)

### Componentes y dependencias inspeccionados
- dashboard-coordinacion.html SHA 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896: ámbito general estático, filtros de nivel/departamento sin evidencia de conexión, cuatro métricas y dos listas; carga secretary.js, no teacher.js.
- js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c: initCoordinatorDashboard/loadCoordinatorDashboardData 517–583; invoca getCoordinatorOverview con payload vacío, fija pendientes a cero, interpreta offers.length como secciones y no utiliza horarios ni filtros.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: capacidades y navegación 133–220; no contiene initCoordinatorDashboard.
- ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - ROLE_PERMISSIONS 222–223; getCoordinatorOverview no está en la lista estática de Coordinador, aunque existe en dispatcher 741. Una concesión dinámica de MatrizPermisosRoles no pudo verificarse.
  - validateContextualAccess 465–522: el control de área solo se ejecuta si payload.areaId está presente.
  - getAcademicAreaTemplateCatalog/getAcademicAreaCoordinationScope 4280–4355: modelo por areaId y AmbitoJSON; no contrato tipado nivel/departamento/carrera ni evaluación de vigencia.
  - savePedagogicalPlanning/getPedagogicalPlannings/submitPlanningForReview/reviewPedagogicalPlanning/getPlanningReviewHistory 5445–5840.
  - getCoordinatorOverview 6301–6332: retorna todas las ofertas, asignaciones y horarios sin filtrar por ámbito.
  - assignTeacherToAcademicArea 14186–14315: registra actor desde authorizedBy de payload o Sistema.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task10 [X], líneas 4995–5017.
- Pendientes.md blob 676a3f798715f0cdd7d4bc75768472545b8465ee: recuperado (1.786.011 caracteres, 20.224 líneas, 0 U+FFFD, 515 IDs hasta TASK-636); lectura normal 0 caracteres; sin F8-Task10 ni TASK-670.
- Reconciliación histórica: AUD-NG-191/TASK-488 (dashboard estático); AUD-NG-225/TASK-505 (catálogo/asignaciones no integrados); AUD-NG-221/TASK-501 (matriz rol/acción); AUD-NG-312/TASK-666 y AUD-NG-314/TASK-668 (ABAC y vigencia); AUD-NG-145/AUD-NG-224/TASK-664 (auditoría y trazabilidad).

### Hallazgos y tareas derivadas
- AUD-NG-316 ALTO/P1: overview global sin filtro por ámbito → TASK-670 y ampliación TASK-501/TASK-666/TASK-668.
- AUD-NG-317 ALTO/P1: indicadores falsos/placeholder y módulos ausentes → TASK-670; ampliar TASK-488.
- AUD-NG-318 ALTO/P1: asignación centrada en areaId, no nivel/departamento/carrera → ampliar TASK-505/TASK-663/TASK-667/TASK-668.
- AUD-NG-319 ALTO/P1: trazabilidad parcial, revisión no integrada y actor no verificado en asignación → TASK-670; ampliar TASK-664/TASK-665.

### Dictamen
- CA-AD-109: NO CUMPLE.
- CA-AD-110: NO CUMPLE.
- CA-AD-111: NO CUMPLE (hay registro parcial en reviewPedagogicalPlanning, insuficiente para todo el flujo requerido).


---

## F8-Task11 / TAREA-AD-05 — Integración de dashboards dinámicos (C1.271)

### Componentes y dependencias inspeccionados
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi 11–199 añade requesterUserId/requesterRole desde localStorage pero no propaga token; el fallback 142–198 convierte errores de consultas get en status success/data[]; checkAllMicroservicesHealth 245–250 omite ACCOUNTING.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: 13 módulos (13–27), endpoints/registro (224–315), 6 contratos (747–803).
- app/html/dashboards/dynamic-dashboard.html SHA 765a45e5666c24c430e841cb70c3d71d03cf9074: carga config/persistence/api/ui-common; no incluye executor de módulos.
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: loadDynamicDashboard 5818–5871 obtiene una configuración global y renderiza tarjetas sin acciones, navegación o ejecución de contratos.
- USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: PUBLIC_ACTIONS 922 aprox.; getUserVerifiedRole 1145–1158 requiere token; validateRolePermission 1253–1295; getUserDynamicDashboardConfig 9254–9300 usa userId de payload y módulos hardcodeados por rol.
- ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; TASK Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c; ACCOUNTING Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28: comparación de acciones del contrato contra dispatchers.
- developer-service Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: suite REG-01..05 2040–2100 aprox.; REG-05 solo verifica objeto contracts.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: presencia de archivos/cadenas, sin prueba conductual; aserción de MapaDependencias apunta a raíz, pero archivo está en AUDITORIAS/.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task11 [X], líneas 5021–5042.
- Pendientes.md blob SHA 676a3f798715f0cdd7d4bc75768472545b8465ee: 1.786.011 caracteres, 20.224 líneas, 0 U+FFFD, 515 IDs únicos hasta TASK-636; lectura normal 0 caracteres.
- Dependencias previas: AUD-NG-191/TASK-488; AUD-NG-221/TASK-501; AUD-NG-307..311/TASK-661..665; AUD-NG-312/TASK-666; AUD-NG-316..319/TASK-670.

### Hallazgos y tareas derivadas
- AUD-NG-320 ALTO/P1: token no propagado por fetchApi; endpoint protegido no recibe credencial → ampliar TASK-636/TASK-501/TASK-666.
- AUD-NG-321 ALTO/P1: 6 contratos para 13 módulos, no executor, tarjetas inertes, acción EXAM incorrecta → TASK-671; ampliar TASK-488/TASK-662/TASK-663/TASK-670.
- AUD-NG-322 ALTO/P1: sin aislamiento por módulo; fallback de get aparenta éxito vacío y errores no se persisten → TASK-672; ampliar TASK-665/TASK-664/TASK-488/TASK-670.
- AUD-NG-323 MEDIO/P2: URL ACCOUNTING con apariencia de placeholder y health check agregado la omite → ampliar TASK-662/TASK-665.
- AUD-NG-324 ALTO/P1: pruebas validan metadatos, no ejecución; ruta de mapa en test incorrecta → ampliar TASK-665/TASK-662.

### Dictamen
- CA-AD-112: NO CUMPLE.
- CA-AD-113: NO CUMPLE.


---

## F8-Task12 / TAREA-AD-07 — Consola administrativa de roles y responsabilidades (C1.272)

### Componentes y dependencias inspeccionados
- dashboard-direccion.html SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c: botón btn-role-config-admin 45–55; modal-role-responsibility-config 420–439, con contenedor vacío de carga y sin formulario/preview.
- dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8: encabezado 28–40 y scripts/modales; no contiene botón ni modal de configuración de roles.
- js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c: listener y controlador 455–515; obtiene catálogos y presenta listas, no ejecuta mutaciones ni vista previa.
- USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - getCentralCapabilitiesCatalog y getInstitutionalResponsibilitiesCatalog 8850–9032; el segundo devuelve tres defaults activos si no hay responsabilidades activas.
  - saveInstitutionalResponsibility 9034–9114: valida solo nombre; acepta módulos/capacidades vacíos o arbitrarios y estado no restringido; al editar reemplaza la misma fila.
  - assignRoleScope 9116–9160: operación separada; upsert no incluye roleId en la clave userId+scopeType.
  - getUserDynamicDashboardConfig 9254–9300 mantiene módulos hardcodeados por rol.
  - doPost/validateRolePermission 1351–1373 valida autorización antes del dispatcher; la validación de negocio de configuración sigue incompleta.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task12 [X], líneas 5046–5067.
- Pendientes.md blob actual 676a3f798715f0cdd7d4bc75768472545b8465ee: 1.786.011 caracteres, 20.224 líneas, 515 IDs únicos hasta TASK-636; blob histórico 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.782.094 caracteres, 20.182 líneas, 511 IDs únicos. Lectura convencional 0; se conserva el blob actual.
- Reconciliación: AUD-NG-309/TASK-663 (relación rol-responsabilidad); AUD-NG-311/TASK-661 (fallback de defaults); AUD-NG-313/TASK-667 (colisión de ámbitos); AUD-NG-321/TASK-662/TASK-663 (contratos no consumidos).

### Hallazgos y tareas derivadas
- AUD-NG-325 ALTO/P1: UI solo lectura, sin CRUD ni asignación; amplía TASK-505/TASK-663/TASK-665.
- AUD-NG-326 ALTO/P1: falta vista previa aislada; amplía TASK-505/TASK-488/TASK-665.
- AUD-NG-327 ALTO/P1: validación server-side insuficiente antes de guardar como Activa; amplía TASK-662/TASK-661/TASK-665.
- AUD-NG-328 ALTO/P1: edición destructiva, sin versionado/rollback; amplía TASK-505/TASK-661/TASK-664/TASK-665.
- No se crean TASK-NNN nuevos; se amplían TASK-505, TASK-661, TASK-662, TASK-663, TASK-664, TASK-667, TASK-668, TASK-665, TASK-501, TASK-666, TASK-636 y TASK-488.

### Dictamen
- CA-AD-116: NO CUMPLE.
- CA-AD-117: NO CUMPLE.
- No se ejecutaron pruebas runtime ni se modificó código fuente.


---

## F8-Task13 / TAREA-MOD-02 — Estructura modular de carpetas (C1.273)

### Estructura y dependencias comprobadas
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task13 [X], líneas 5071–5093.
- folder-structure.md SHA ca44aea0abaf80bab58adb4b7bf51935f404bf96: declara app/html, app/js, app/css, app/assets, backend, tests y docs; nota que la estructura es recomendada, no obligatoria.
- app/html/dashboards/dynamic-dashboard.html SHA 765a45e5666c24c430e841cb70c3d71d03cf9074: único dashboard modular inspeccionado; sigue cargando ../../../css, ../../../imagenes y ../../../js.
- Archivos core aún en raíz: index.html cd742047cdc4948259dd721119429b04f78330ca; js/config.js 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc; css/style.css f1ff84312ce70949a58eaa099b2aad0ff0a59cb6; dashboards HTML raíz, incluyendo dashboard-coordinacion.html 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896.
- No existen app/js/ui-common.js, app/css/style.css, app/assets/logo.png, app/html/dashboard-coordinacion.html ni app/html/dashboard-direccion.html.
- README.md SHA 1d76341a6a286ebd0115e319f77b8c33b727dbba, repository-inventory.md SHA eeed10fd8da0db3cd119c5a9778e9cb8b2233808 y routing-and-paths.md SHA c64e6a952c1ce12a47cb00a2d324f39cd6581a47 siguen documentando root/js/css/imagenes.
- index.htm no existe; index.html existe en raíz. El HTML referencia CSS/JS/assets en rutas raíz.
- No existen .clasp.json, .claspignore, appsscript.json ni .gitignore en la raíz. El repo tiene visibilidad public.
- developer-service Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - getArchitectureAndDependencyMapReport 1747–1795 devuelve una lista de rutas estática.
  - validateModularFolderStructure 1895–1964 compara subcadenas contra esa lista, agrega index.htm/index.html en rootFiles por defecto y establece publicExposingRisk=false por defecto.
  - validateStagedMigrationProgress 1966–1999 usa esa respuesta para marcar STAGE-3-FOLDER-STRUCTURE.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683, líneas 22–50, comprueba presencia parcial y cadenas; no valida app/js, app/css, app/assets, index.htm, clasp o secretos.

### Hallazgos y tareas derivadas
- AUD-NG-329 ALTO/P1: migración física frontend incompleta. CA-MOD-103 NO CUMPLE. TASK-673.
- AUD-NG-330 ALTO/P1: validador programático falso positivo por manifiesto/defaults; Stage 3 puede aprobar sin árbol real. TASK-674.
- AUD-NG-331 MEDIO/P2: despliegue y exclusión de secretos sin configuración verificable en repo público; no se confirmó secreto filtrado. TASK-675.
- AUD-NG-332 MEDIO/P2: index.htm ausente, index.html presente; contradicción entre criterio y documento. CA-MOD-104 PARCIAL/NO ACREDITADO.
- CA-MOD-103: NO CUMPLE. CA-MOD-104: PARCIAL/NO ACREDITADO.
- Tareas derivadas: TASK-673 (migración frontend y punto de entrada), TASK-674 (verificación real y regresión), TASK-675 (despliegue y exclusión de secretos).
- Reconciliación: TASK-665, TASK-488 y TASK-636 se amplían; AUD-NG-324 no se duplica.

### Dictamen
La estructura backend/tests/docs existe, pero el frontend continúa mayoritariamente en raíz/js/css/imagenes. El validador usa un manifiesto estático y defaults que producen falsos positivos. No hay configuración clasp ni exclusión verificable. No se ejecutaron pruebas runtime ni se modificó código fuente.


---

## F8-Task14 / TAREA-MOD-03 — Descomposición de archivos monolíticos (C1.274)

### Fuentes y componentes inspeccionados
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task14 [X], líneas 5097–5117.
- monolith-decomposition-plan.md SHA 388eda1feee9826f7be85665e56b35a566b8a5be, 21 líneas: enumera js/ui-common.js, secretary.js, teacher.js, student.js y academic-service Code.gs; omite backend/developer-service/Code.gs y no define módulos destino ni adaptadores.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: 125.944 caracteres, 2.901 líneas; permanece como unidad con transporte/autenticación, registro, comandos, logs, contratos, validación, regresión y diagnóstico.
- validateMonolithDecompositionContracts, líneas 1798–1893: obtiene acciones del catálogo estático; activeGlobalFunctions solo se alimenta desde payload; no analiza fuentes ni firmas; seenInBatch usa solo el nombre de acción y cuenta repetición entre servicios como duplicado.
- getCentralConfigAndContractCatalog, líneas 2261–2283: declara ping en USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683, líneas 38–50: comprueba presencia de la cadena validateMonolithDecompositionContracts, no su ejecución ni comportamiento.
- Pendientes.md blob 676a3f798715f0cdd7d4bc75768472545b8465ee: 1.786.011 caracteres, 20.224 líneas, 515 IDs TASK únicos, máximo TASK-636; no contiene TASK-676/677.

### Hallazgos y tareas derivadas
- AUD-NG-333 ALTO/P1: no hay descomposición física del archivo objetivo y el plan omite developer-service. CA-MOD-105 parcial/no acreditado. TASK-676.
- AUD-NG-334 ALTO/P1: validador no inspecciona funciones/firmas y cuenta nombres repetidos entre servicios como colisiones globales. TASK-677.
- AUD-NG-335 ALTO/P1: suite solo verifica presencia textual, no compatibilidad ni duplicados reales. TASK-677/TASK-665.
- Tareas nuevas: TASK-676 (descomposición funcional con wrappers/adaptadores); TASK-677 (validador real de contratos/firmas y colisiones por namespace).
- Tareas existentes ampliadas: TASK-665, TASK-662 y TASK-636; no duplicar TASK-671/672 ni TASK-673/674/675.
- CA-MOD-105: PARCIAL/NO ACREDITADO. CA-MOD-106: NO ACREDITADO. No se certifica que existan duplicados reales en producción; el validador no demuestra su ausencia.

### Dictamen
La descomposición no está demostrada. El archivo developer-service sigue siendo monolítico y el validador es autorreferencial y confunde acciones de servicios separados. No se ejecutaron pruebas runtime ni se modificó código fuente.


---

## F8-Task15 / TAREA-MOD-05 — Mapa de dependencias y documentación arquitectónica (C1.275)

### Documentación y dependencias inspeccionadas
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F8-Task15 [X], líneas 5121–5140.
- repository-inventory.md SHA eeed10fd8da0db3cd119c5a9778e9cb8b2233808: enumera páginas, algunos JS, servicios, CSS/assets; omite persistence.js, games-adapter.js, data.js, index-ui.js, presentation-engine.js y security-minigames.js.
- routing-and-paths.md SHA c64e6a952c1ce12a47cb00a2d324f39cd6581a47: rutas y assets parciales; no detalla orden por página, llamadas/consumidores ni fuentes de datos.
- staged-migration-procedure.md SHA 2b46af3095596fcd7a9744e4cc500b50b38a34f0: cinco etapas y rollback; no define comandos de build ni checklist para nuevos archivos.
- spreadsheets-schema.md SHA 0c8d5c4c2976d4b64949c693e66395896ce16246: fecha documental 2025-05-24; describe tablas/columnas, no su relación con consumidores.
- AUDITORIAS/MapaDependencias.md SHA 17564f9af34f77c0bb30cbf9461300c46dacdd03: encabezado v7.6.1, relaciones parciales y bitácora histórica mezcladas; no es un grafo completo vigente.
- No existe MapaDependencias.md en raíz; el único archivo está en AUDITORIAS/. tests y developer-service esperan la ruta raíz (AUD-NG-324).
- developer-service Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - getArchitectureAndDependencyMapReport 1747–1795 devuelve rutas hardcodeadas y un initializationOrder estático; mapValid solo exige lista no vacía.
  - getCentralConfigAndContractCatalog 2261–2283 declara acciones por servicio, no un grafo de dependencias ni firmas.
- index.html SHA cd742047cdc4948259dd721119429b04f78330ca: carga config.js, persistence.js, api.js, games-adapter.js, ui-common.js, data.js e index-ui.js (427–433); el orden estático del reporte omite varios y no es específico por página.
- js/config.js 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc; persistence.js 94ac26feb4f7f31f1f3f2a238e164d23be565d94; api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; games-adapter.js 4f43a67aa98a14e8d381c29ac585bf5952013a85; ui-common.js 986938b8a311a41ed4cb3d135b66b6aaea4bed67; data.js 6b3d5d654f56af320a8bf2acd6a4b77c0c6fd713; index-ui.js c637535e8cc84f02aa18631bc964ff7ef545722e.
- No existen package.json, Makefile, Vite/Webpack config, scripts/build.js, .clasp.json, .claspignore ni appsscript.json.

### Hallazgos y tareas derivadas
- AUD-NG-336 ALTO/P1: documentación incompleta de dependencias, consumidores y fuentes de datos. TASK-678.
- AUD-NG-337 ALTO/P1: generador estático y trivial; no representa el árbol ni orden real. Reconfirma AUD-NG-330/AUD-NG-324; amplía TASK-674/TASK-665.
- AUD-NG-338 MEDIO/P2: build y alta de nuevos archivos no reproducibles/documentados. Reconfirma AUD-NG-331; amplía TASK-675/TASK-665.
- Tarea nueva: TASK-678 — mapa arquitectónico canónico, completo y verificable.
- Tareas existentes ampliadas: TASK-674 (rutas reales), TASK-675 (build/deploy/alta de archivos), TASK-665 (validación), TASK-677 (firmas/contratos), TASK-662 (catálogo/dispatchers).
- CA-MOD-109: NO CUMPLE.

### Dictamen
La documentación contiene inventarios y rutas parciales, pero no representa con exactitud el grafo real ni los consumidores de datos. El generador devuelve un manifiesto estático y el proceso de build/incorporación no es reproducible. No se ejecutaron pruebas runtime ni se modificó código fuente.


---

## F8-Task16 / TAREA-ARQ-01 — Independencia funcional y comunicación entre roles (C1.276)

### Resultado de auditoría del código
- developer-service Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - getCentralSpreadsheetConfigRegistry (223–291) enumera tablas y lee RegistroSpreadsheets, pero el ID del control plane es placeholder y el fallback acepta registros del payload.
  - provisionRoleSpreadsheet (1303–1348) genera IDs sintéticos y no crea recursos Drive ni persiste registro.
  - recordProvisioningHistory (1286–1301) no escribe HistorialProvisionamiento.
  - getRoleFunctionalSpaceConfig (1638–1670) informa un permiso declarativo; auditRoleIndependenceAndMasterDataIntegrity (1673–1745) puede informar éxito sin inspección real.
- user-service Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - sesión/token usa role singular (1065–1080; 1146–1162); assignRoleScope (9117–9181) identifica por userId+scopeType e ignora roleId en la clave.
  - createInstitutionalServiceRequest (9481–9536) y updateInstitutionalServiceRequestStatus (9538–9575) devuelven objetos sin persistir Solicitudes/HistorialSolicitudes.
  - registerAndDispatchEvent (4618–4698) registra BitacoraEventos y notificaciones, pero no entrega a servicios destino; retryFailedEventsQueue (4700–4745) solo reintenta notificaciones.
  - Personas y Usuarios contienen atributos personales repetidos; createPerson (1619–1687) y registerUser (2393–2452).
- academic-service Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - comparte el mismo Spreadsheet ID que USER (línea 5 frente a user-service línea 6).
  - convertAdmissionToStudent (2155–2385) modifica ExpedientesEstudiantes, Usuarios, RelacionesFamiliares, Matriculas y MovimientosEstudiante.
  - registerStudentEnrollment (12800–12873) escribe directamente Matriculas/CargosEstudiante.
- Hallazgos AUD-NG-339 a AUD-NG-342; CA-ARQ-101/102 NO CUMPLEN.
- Tareas derivadas: TASK-679 propiedad única de escritura/fuente de verdad; TASK-680 aprovisionamiento real; TASK-681 comunicaciones persistentes/eventos entregables; TASK-682 multirol/ámbitos independientes.
- Se amplían F8-Task19/20/21/22/23 sin duplicar sus IDs.

### Dictamen
Los espacios funcionales y el aprovisionamiento se simulan; el aislamiento no se hace cumplir. USER y ACADEMIC comparten el mismo archivo y realizan escrituras cruzadas; el modelo de sesión solo contiene un rol; solicitudes no se persisten y eventos no se entregan a otros servicios. No se ejecutaron pruebas runtime ni se modificó código.


---

## C1.289 — TASK-638: traza inicial de dependencias estáticas y dinámicas

**Estado:** avance parcial; auditoría preimplementación en curso. **HEAD:** `0afe7fd3a9b9df974afc557063d40b787a7e1c30`. **Informe:** `Auditoría/AUDITORIA_TASK-638_C1.289.md`.

### Snapshot y alcance
- Tree recursivo: 1.079 entradas, 1.013 blobs, no truncado; inventario TASK-637: 1.013 rutas únicas, coincidente con el tree.
- Archivos relevantes: 100 HTML, 1 HTM, 24 JS, 6 CSS, 6 GS y 27 JSON.
- El mapa conserva encabezado v7.6.1, 4.191 líneas y 425.086 caracteres; contiene relaciones generales e informes históricos, pero no matriz verificable de todas las dependencias por archivo.

### Cadena estática verificada — index.html
`index.html` (SHA `cd742047cdc4948259dd721119429b04f78330ca`, scripts líneas 427–433) carga en orden: `js/config.js` → `js/persistence.js` → `js/api.js` → `js/games-adapter.js` → `js/ui-common.js` → `js/data.js` → `js/index-ui.js`. También referencia `css/style.css`, `imagenes/new-generation-logo.png`, `manifest.json`, Tailwind CDN, Google Fonts, Font Awesome y Chart.js.

### Dependencias dinámicas confirmadas por código
- `js/config.js` SHA `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc`: globals SERVICE_URLS, SERVICE_REGISTRY, MODULE_ROUTING_DICTIONARY y DYNAMIC_DASHBOARD_MODULE_CONTRACTS; `syncAcademicScope` llama ACADEMIC/getAcademicConfig, actualiza GLOBAL_SCOPE y emite `academic-scope-updated`.
- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`: `fetchApi` consume SERVICE_URLS, localStorage/sessionStorage, fetch y PersistenceManager; envía POST `{action,payload}` y realiza fallback para acciones get*. AUD-NG-322 ya cubre la semántica de fallback que aparenta éxito vacío.
- `app/html/dashboards/dynamic-dashboard.html` SHA `765a45e5666c24c430e841cb70c3d71d03cf9074`: carga config/persistence/api/ui-common desde ../../../ y llama `window.loadDynamicDashboard()` en DOMContentLoaded; su cadena difiere de index.html.
- La configuración declara seis servicios; ACCOUNTING y DEVELOPER tienen endpoints con apariencia de placeholder y metadatos declarativos no verificados. AUD-NG-323 cubre la anomalía de ACCOUNTING.
- MODULES_CATALOG tiene 13 módulos y DYNAMIC_DASHBOARD_MODULE_CONTRACTS seis; ya registrado en AUD-NG-321.

### Hallazgo y tareas derivadas
- AUD-NG-350 ALTO/P1: no existe cobertura canónica verificable de dependencias estáticas/dinámicas por archivo; ampliar TASK-678 y coordinar TASK-674/TASK-665. Evidencia completa en el informe C1.289.
- No se crean IDs duplicados para AUD-NG-321/323 ni para TASK-674/665/662/671.

### Límites
La pasada es parcial: no se inspeccionaron todos los HTML/HTM, JS, CSS, GS, JSON ni recursos; no se ejecutaron Node, navegador, HTTP, Apps Script, Drive o E2E. No se declaran rutas funcionales, ciclos ni duplicados sin evidencia. TASK-638 sigue En ejecución.


---

## C1.290 — TASK-638: páginas de aplicación, portales y dependencias de juegos

**Cobertura de esta pasada:** 26 páginas HTML/HTM; informe `Auditoría/AUDITORIA_TASK-638_C1.290.md`; HEAD de partida `57643c473df081aa57cdd8e5def542281f500000`.

### Páginas y cadenas trazadas
- Admisión (`admision.html` SHA `45b84c80d22d2e8dab75852e65847bae6425db44`): ui-common/data/config/persistence/api/student; ACADEMIC createAdmissionRequest, saveAdmissionDraft, getAcademicOffers y helper getPublicAdmissionStatus.
- Dashboards: Cafetería `12f8c828dd1f8f2c3be34e14d8c9478944c64d04` y Tienda `60fb5c399b527f7d3a6e764332d8496e17643d5c` cargan config/api/ui-common sin controlador ni llamadas API explícitas en HTML; queda como estado por confirmar. Contabilidad `b7653b3bff71829f0f67cf47cb894413c56a444a` carga accounting.js; Coordinación `08de8e4eb150ee9f6aad536ca08e8f76f2e0e896` carga secretary.js e invoca initCoordinatorDashboard; Dirección `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` carga secretary.js/teacher.js; Secretaría `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` carga persistence/api/ui-common/secretary; RRHH `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee` tiene controlador inline y 25 llamadas ACCOUNTING.
- Consola de desarrollador `developer-dashboard.html` SHA `2b69f1bf7ffbbe4902e81de14d6315cedb035a1e`: config/api/developer.js; USER getStructuredLogs.
- Evaluación: exam.html `ca6a7e880c0c63e4d7fe18991612560734a39dcd` → exam.js → EXAM getExamQuestions/submitExam y USER recordAnalytics; results.html `a8dc15e9aec091eb3d6490b9b073ace48fcc72c5` → results.js → EXAM getExamResult.
- Identidad: login.html `3b2e1e8d12a90552ac7b7d584294463a3e8e8f15` y register.html `e4ed1b11ac434a2e5badcd73363b10fa1438a6ff` cargan auth.js → USER loginUser/registerUser; forgot-password.html `23076c8ef1d90edf43da2c57e9829125aca908d3` → USER requestPasswordRecovery; reset-password.html `bf3a0554747611e518ba1eed9ca012a0f2a1de72` → USER resetPassword.
- Políticas: privacidad `8854bae3021e1cdde288709e3fa411b3d6da20c7` y financiera `bb75dc6b72098b825a18025781346b4252fe33cf` → ACCOUNTING getPolicyAcceptances/recordPolicyAcceptance; uso `ca252904e9f7ad7301d1793ed07585a92a4c060f` → ACCOUNTING getPolicyAcceptances y USER acceptLegalDocument.
- Pseudocode `9b882d70755dc89b000390990852a03407c6973a` → USER getStudents y TASK saveProject/listProjects/loadProject/deleteProject; identidad local en localStorage.
- Portales: student-dashboard `6379ea0ed39d71b89747a0280bb925fdf12202c1` → student.js y librerías PDF/Chart; teacher-dashboard `cbb9e6a272a7d8ad33f99727303305d950533e71` → teacher.js, SheetJS, Quill y Chart.
- Interactivo `56df0513897983217a1a5b6883e5fdafcfd4e4ed`: JS inline sin llamadas fetchApi identificadas en esta pasada.

### Cargador dinámico de juegos
- `js/index-ui.js` SHA `c637535e8cc84f02aa18631bc964ff7ef545722e`: triageGameLaunch líneas 358–398; loadGame líneas 400–453; loaders Periféricos/WebMaster líneas 455–456.
- Flujo observado: fetch(htmlPath) → respuesta.text() → overlay.innerHTML → append explícito de `js/security-minigames.js` → append de controlador JS → initFn.
- `js/data.js` SHA `6b3d5d654f56af320a8bf2acd6a4b77c0c6fd713` registra actividades por acciones load-peripherals-game, load-webmaster-quiz y load-dexterity-game, y ruta directa de QuizPro.
- Los fragmentos `juegos/perifericos.html` y `juegos/webmaster_quiz.html` no son páginas autónomas en este flujo; rutas relativas se resuelven respecto del documento anfitrión y el script de seguridad lo agrega el cargador. Las sospechas iniciales de rutas rotas se descartan.

### Hallazgo
- **AUD-NG-351 MEDIO/P2:** `developer-dashboard.html:9` referencia `css/custom.css`; el árbol recursivo de 1.080 entradas no contiene esa ruta ni otro archivo custom.css. Sí existen `css/style.css` y `js/developer.js`. Impacto: hoja local declarada no resoluble; no se afirma que toda la consola carezca de estilos.
- Ampliar TASK-674 (detección de rutas ausentes con contexto anfitrión) y TASK-678 (matriz canónica). No crear tareas duplicadas.

### Huecos y límites
- Cafetería/Tienda: placeholders y ausencia de controlador/API explícito en HTML; no se declara defecto sin confirmar el diseño esperado.
- ACCOUNTING en RRHH y políticas permanece sujeto a AUD-NG-323; no se acredita deployment operativo.
- 26/101 páginas inspeccionadas; quedan 75 HTML/HTM y la traza exhaustiva de JS/CSS/GS/JSON/assets.
- No se ejecutaron Node, navegador, HTTP, Apps Script, Drive, Sheets ni E2E. TASK-638 sigue En ejecución.


---

## C1.291 — TASK-638: cobertura HTML/HTM completa

**Cobertura:** 101/101 documentos (100 HTML y 1 HTM), todos versionados en el tree auditado. Se inspeccionaron y contrastaron las referencias locales de recursos, navegación, formularios y scripts contra el tree con resolución de rutas relativas desde el documento anfitrión. Informe: `Auditoría/AUDITORIA_TASK-638_C1.291.md`.

### Distribución de cobertura
- 28 páginas de aplicación/portales/dashboards/entrada y juegos (index.html, dynamic-dashboard y C1.289/C1.290).
- 21 páginas III_BTP_A.
- 8 páginas II_BTP_A/Informatica_Aplicada_I.
- 10 páginas II_BTP_A/Ofimatica_I.
- 14 páginas II_BTP_A/Programacion.
- 7 páginas II_BTP_A/analisis_diseno.
- 13 páginas Informatica_I.

### Hallazgos confirmados de rutas
- AUD-NG-351 MEDIO/P2: `developer-dashboard.html:9` referencia `css/custom.css`, inexistente en tree.
- AUD-NG-352 MEDIO/P2: `II_BTP_A/Ofimatica_I/hojas_calculo.html:378` referencia `../../imagenes/ordenamiento-y-filtrado.png`; existe `imagenes/ordenamiento-y-filtrado.PNG`, extensión con caso distinto.
- AUD-NG-353 MEDIO/P2: `pseudocode.html:10–11` referencia `IMA-Logo.png` para favicon y apple-touch-icon; archivo inexistente en raíz/tree.
- Las expresiones de plantilla son dinámicas; no se evalúan como archivos estáticos. Los fragmentos `juegos/perifericos.html` y `juegos/webmaster_quiz.html` se cargan por index-ui.js y resuelven recursos con el documento anfitrión; sus falsos positivos relativos se descartan.

### Estado de TASK-638
La capa HTML/HTM queda revisada estáticamente al 100%; no equivale a la auditoría global completa. Quedan 24 JS, 6 CSS, 6 GS, 27 JSON, recursos independientes y trazabilidad exhaustiva de endpoints, dispatchers, handlers, permisos y persistencia. No se ejecutaron pruebas runtime ni E2E. TASK-638 sigue En ejecución.

### Tareas derivadas
Ampliar TASK-674 para validar rutas ausentes, extensiones/caso y contexto de fragmentos; ampliar TASK-678 para integrar cobertura 101/101 y AUD-NG-351/352/353. No crear IDs duplicados.


---

## C1.292 — TASK-638: inventario JavaScript y dependencias runtime

**Cobertura:** 24/24 archivos JS del tree (21 scripts en js/, sw.js y dos suites tests/regression). Informe `Auditoría/AUDITORIA_TASK-638_C1.292.md`.

### Integración global
- No se detectaron declaraciones import/export. Los scripts clásicos exponen globals y propiedades window; el orden de carga y la existencia de globals son contratos implícitos.
- Cadena común: config.js (SERVICE_URLS, SERVICE_REGISTRY, GLOBAL_SCOPE, sanitizarHTMLTecnico) → persistence.js (PersistenceManager/IndexedDB v4) → api.js (fetchApi) → ui-common.js (UI/sesión/historial/Service Worker) → index-ui.js (navegación/recursos/juegos).
- Controladores: accounting.js (ACCOUNTING), secretary.js (ACADEMIC/USER), student.js (ACADEMIC/USER/ACCOUNTING/EXAM/TASK), teacher.js (ACADEMIC/ACCOUNTING/EXAM/TASK/USER), exam.js/results.js (EXAM y USER), auth.js/developer.js (USER), quizpro.js/games-adapter.js (USER).
- Juegos periféricos, destreza y webmaster no llaman fetchApi directamente; consumen globals/DOM/almacenamiento local. QuizPro carga el banco JSON dinámicamente desde js/Banco_Preguntas según grado/asignatura/nivel; la estructura está presente en tree.

### Service Worker
- ui-common.js:19 registra ./sw.js.
- sw.js:13 declara ./css/styles.css; tree solo contiene css/style.css.
- sw.js:28 ejecuta cache.addAll(ASSETS), por lo que la referencia 404 impide completar la precarga/instalación.
- **AUD-NG-354 MEDIO/P2:** ruta de caché CSS inexistente. Derivar TASK-674/TASK-678.

### Contrato de timeout
- api.js:209 checkMicroserviceHealth pasa {timeout:6000} a fetchApi.
- api.js:36 fija abort a 60.000 ms; fetchApi no lee options.timeout.
- **AUD-NG-355 MEDIO/P2:** timeout solicitado ignorado. Derivar TASK-678 y traza de contratos/monitoreo.

### Corrección de mapa histórico
La nota antigua que presenta presentation-engine.js como dependiente de ui-common.js para sanitización/seguridad no coincide con el fuente actual. presentation-engine implementa setupSecurity propio; ui-common consulta opcionalmente window.PresentationEngine.showSlide durante popstate. sanitizarHTMLTecnico está definido en config.js. Se registra la dirección correcta sin reescribir la historia previa.

### Configuración de servicios
SERVICE_URLS declara USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER. Se identifican llamadas frontend literales a los primeros cinco; no se encontró llamada literal fetchApi dirigida a DEVELOPER. ACCOUNTING y DEVELOPER conservan endpoints placeholder, con ACCOUNTING ya relacionado a AUD-NG-323. No se acreditan deployments.

### Tareas derivadas
Ampliar TASK-674/TASK-678 con AUD-NG-354 y la matriz JS; ampliar TASK-678 con AUD-NG-355 y el contrato timeout. No crear IDs duplicados. La traza de acciones a dispatcher/handler/permisos/persistencia sigue pendiente.


---

## C1.293 — TASK-638: CSS, Apps Script, JSON y contratos
**Cobertura:** CSS 6/6, GS 6/6 estructural, JSON 27/27 parseados; informe Auditoría/AUDITORIA_TASK-638_C1.293.md.

### CSS y recursos
- Se leyeron las seis hojas CSS. Las URLs absolutas /imagenes/fondo_xp.jpg y /imagenes/windows_logo.png resuelven a la raíz y existen. manifest.json usa imagenes/new-generation-logo.png, también existente.
- Se mantiene AUD-NG-354: sw.js precarga css/styles.css, pero el recurso versionado es css/style.css; cache.addAll depende de esa ruta.
- No se detectaron nuevos recursos locales ausentes en las hojas CSS revisadas.

### Apps Script y acciones
- Casos de dispatcher: USER 182; ACADEMIC 241; TASK 44; EXAM 38; ACCOUNTING 240; DEVELOPER 39.
- 211 llamadas fetchApi literales de los controladores de cinco servicios coinciden con los casos de despacho encontrados. No se detectó llamada literal al servicio DEVELOPER desde los controladores.
- js/developer.js invoca cuatro acciones que no existen en los dispatchers: USER:getBackupsList, USER:restoreSpreadsheetBackup, USER:runSystemMaintenance y ACADEMIC:exportSchoolYearArchive (AUD-NG-358).
- USER despacha cuatro nombres sin handler declarado: purgeSecurityCaches, dispatchSecurityEvent, processSecurityEventQueue y getSecurityEventsQueue. ACADEMIC despacha generateInstitutionalReport sin handler; TASK despacha generateAcademicArchiveZip sin handler (AUD-NG-359).
- USER:manageAccountState escribe el estado de cuenta antes de invocar dispatchSecurityEvent, que no está definido; el error posterior puede dejar persistencia con respuesta de error.
- Cinco servicios comparten SPREADSHEET_ID literal; DEVELOPER conserva un ID placeholder. No se verificaron Script Properties ni deployments.
- Se confirman antecedentes AUD-NG-082 (authRole cliente en DEVELOPER), AUD-NG-084 (fallback HMAC derivado de SPREADSHEET_ID) y AUD-NG-083 (delegateToTaskService envía JSON plano, sin sobre HMAC).
- TASK conserva consultas sensibles en PUBLIC_ACTIONS; getStudentTasks usa userId del payload, loadProject hace fallback a DriveApp.getFileById sin comprobar propietario, getAllStudentProjects enumera nombres/fileIds y getPosts confía en authRole (ampliación AUD-NG-002).
- EXAM publica getStudentExams/getAllExams antes de verificar token; getStudentExams devuelve calificación/comentario de la entrega usando userId del payload (AUD-NG-356).
- ACADEMIC publica saveAdmissionDraft/getAdmissionDraft; la clave es email/identificación y permite leer o sobrescribir el borrador (AUD-NG-357).

### JSON y QuizPro
- Los 27 archivos JSON parsean correctamente: 24 bancos locales, questions-bank.json, manifest.json y test-results/.last-run.json.
- Siete bancos locales están vacíos; QuizPro muestra alerta y recarga la página cuando no hay preguntas.
- Diez bancos poblados suman 791 preguntas sin ID estable. config.js:872 y quizpro.js:678 generan un ID aleatorio; el mecanismo seen_questions/refuerzo y la analítica dependen de ese ID (AUD-NG-360).
- questions-bank.json tiene 771 entradas sin ID, pero no se encontró referencia directa en los 21 JS ni en los documentos HTML revisados; queda clasificado como recurso legado/sin consumidor identificado.

### Hallazgos y tareas derivadas
- AUD-NG-356..361 y tareas TASK-685..TASK-690 se documentan en el informe C1.293 y tareas_auditoria.txt.
- Ampliar AUD-NG-002, AUD-NG-082 y AUD-NG-084 existentes; no duplicar sus IDs.
- TASK-638 continúa En ejecución: falta el análisis exhaustivo de handlers, autorización contextual y persistencia por acción, además de verificar deployments reales. No se ejecutaron pruebas runtime/E2E.

 
===============================================================================
## C1.296 — TASK-638: contratos frontend/backend, autorización y persistencia (continuación)
**HEAD auditado:** `0edce6ae2721b1d839ef259dad7ea77962fe8ab3`; rama `NG_beta_0.0.0.1_work`; tree de partida recursivo. **TASK-637:** Completada y verificada en commit A `0edce6ae2721b1d839ef259dad7ea77962fe8ab3`. **TASK-638:** En ejecución; no cerrar todavía.

### 1. Universo frontend y reconciliación de cobertura
- 24 archivos JavaScript del repositorio revisados (21 bajo js/, más sw.js y dos suites de regresión; estos tres adicionales no contienen llamadas fetchApi); **262 llamadas literales** a `fetchApi(service, action, ...)`.
- Distribución JS: USER 70; ACADEMIC 120; TASK 23; EXAM 19; ACCOUNTING 30; DEVELOPER 0.
- Además, `dashboard-recursos-humanos.html` (SHA `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee`) contiene **25 llamadas inline** a ACCOUNTING. Cobertura identificada: al menos **287 callsites** (262 JS + 25 HTML).
- La cifra de 211 consignada en C1.293 no representa el universo completo; la diferencia frente al conjunto aquí identificado es 76 callsites. C1.293 no explicitó el denominador ni incorporó todos los consumidores auxiliares/inline.
- Consumidores omitidos en el subtotal anterior: `js/api.js` (9 wrappers), `js/config.js` (2), `js/index-ui.js` (1), `js/ui-common.js` (19) y el panel HTML de Recursos Humanos (25). Se conserva la evidencia previa y se corrige aditivamente.

### 2. Servicios, dispatchers y controladores
| Servicio | Code.gs SHA | Casos doPost | PUBLIC_ACTIONS | Referencias a handler inexistente | Hojas literales | openById | DriveApp |
|---|---|---:|---:|---:|---:|---:|---:|
| USER | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | 182 | 9 | 4 | 20 | 160 | 6 |
| ACADEMIC | `df87a2eea9f0ef79d0b966d03fd5bbe432003df5` | 241 | 6 | 1 | 25 | 221 | 13 |
| TASK | `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe` | 44 | 9 | 1 | 5 | 38 | 25 |
| EXAM | `1d93296628fae31f680004f637897e2b1314a64c` | 38 | 4 | 0 | 3 | 42 | 0 |
| ACCOUNTING | `38b979d41596b85e888b4a7060b37bbac0840a28` | 240 | 3 | 0 | 10 | 225 | 6 |
| DEVELOPER | `8aa4bac67cfe5c8c54da51a0784a56fef633e412` | 39 | 0 | 0 | 3 | 10 | 0 |

Las llamadas de escritura literales (appendRow/setValues/setValue) por servicio son: USER 134/19/97; ACADEMIC 178/20/203; TASK 20/6/15; EXAM 33/7/16; ACCOUNTING 184/45/314; DEVELOPER 4/0/1. Son conteos estáticos de ocurrencias, no pruebas de transacciones exitosas ni conteos de hojas completas.

### 3. Autorización y exposición pública
- USER, ACADEMIC, TASK, EXAM y ACCOUNTING ejecutan `validateRolePermission` antes del switch; el bypass de `PUBLIC_ACTIONS` retorna autorizado sin claims/contexto.
- USER publica 9 acciones; ACADEMIC 6; TASK 9; EXAM 4; ACCOUNTING 3.
- ACADEMIC incluye `saveAdmissionDraft` y `getAdmissionDraft` como públicas; ambas usan `BorradoresAdmision` y una clave basada en draftKey/email, sin vincular la operación a identidad verificada: AUD-NG-357.
- TASK publica `getStudentTasks`, `loadProject`, `getAllStudentProjects`, entre otras. `getStudentTasks` usa userId del payload cuando no hay claims; `loadProject` tiene fallback a DriveApp.getFileById sin validar propietario: ampliar AUD-NG-002.
- EXAM publica `getStudentExams` y `getAllExams`; `getStudentExams` lee `Examenes` y `EntregasExamen`, usando userId del payload si no hay claims y devolviendo calificación/comentario: AUD-NG-356.
- USER mantiene como públicas acciones de registro/login/recuperación, ping, noticias/anuncios y paleta; las rutas sensibles de recuperación se relacionan con AUD-NG-361.
- DEVELOPER no tiene PUBLIC_ACTIONS, pero `doPost` acepta `payload.authRole` cuando falta token; el rol Desarrollador dispone de wildcard. El helper de HMAC no corrige esta ruta de confianza: AUD-NG-082/083/084/086.

### 4. Dispatchers y handlers incompletos
- USER: `purgeSecurityCaches`, `dispatchSecurityEvent`, `processSecurityEventQueue`, `getSecurityEventsQueue` están en el switch, sin función declarada.
- ACADEMIC: `generateInstitutionalReport` está en el switch, sin función declarada.
- TASK: `generateAcademicArchiveZip` está en el switch, sin función declarada.
- USER `manageAccountState` escribe el estado en `Usuarios` y registra el cambio antes de llamar `dispatchSecurityEvent`; el error posterior puede producir persistencia con respuesta de error. AUD-NG-359/TASK-688.
- En `js/api.js` se declaran cuatro wrappers sin dispatcher: USER `getBackupsList`, `restoreSpreadsheetBackup`, `runSystemMaintenance`; ACADEMIC `exportSchoolYearArchive`. En `js/developer.js` se localizaron llamadas a `getBackupsList` y `exportSchoolYearArchive`; no se localizaron callers para los otros dos wrappers en `developer.js` ni en `developer-dashboard.html`. Mantener AUD-NG-358/TASK-687 y ajustar el alcance a caller real frente a wrapper huérfano.

### 5. Enrutamiento y persistencia interservicio
- USER `delegateToTaskService` (Code.gs:7946) envía JSON plano mediante UrlFetchApp a TASK_SERVICE_URL; no utiliza `createInterServiceEnvelope`. Ante excepción devuelve `status: success` con una sessionKey local, aunque la operación delegada no haya ocurrido. TASK no contiene `verifyInterServiceEnvelope`. Ampliar AUD-NG-083/AUD-NG-174; no crear ID duplicado.
- `createInterServiceEnvelope`/`verifyInterServiceEnvelope` existen en USER pero no se consumen en la ruta de delegación auditada.
- USER, ACADEMIC, TASK, EXAM y ACCOUNTING comparten el mismo literal SPREADSHEET_ID. DEVELOPER conserva `1DEVELOPER-CONTROL-PLANE-SPREADSHEET-ID`, marcador no sustituido. El aislamiento por servicio no se acredita por los nombres separados de los proyectos; el control de concurrencia Apps Script tampoco coordina deployments distintos.
- `js/config.js`: USER/ACADEMIC/TASK/EXAM tienen URLs con forma de deployment; ACCOUNTING y DEVELOPER mantienen placeholders. ACCOUNTING acumula 55 llamadas identificadas (30 JS + 25 HTML); DEVELOPER no tiene llamadas fetchApi literales en los 21 JS revisados. No se verificaron deployments, Script Properties ni permisos de Drive.
- El registro de DEVELOPER declara servicios Activos de forma hardcodeada; `getServiceHealthDiagnostics` y las suites de arquitectura no prueban conectividad real. Conservar las limitaciones ya registradas en AUD-NG-323 y AUD-NG-082..086.

### 6. Hallazgo nuevo de cobertura documental
**AUD-NG-363 — MEDIO/P2 — Conteo y matriz de consumidores API incompletos.**
Evidencia: 211 callsites informados en C1.293 frente a 262 en los 21 JS y al menos 25 inline en dashboard-recursos-humanos.html. Impacto: el denominador incompleto deja consumidores y contratos fuera de la matriz. Causa: subtotal parcial sin enumeración de todos los archivos consumidores. Acción: ampliar TASK-678 existente, sin duplicar ID.

### 7. Límites y siguiente bloque
La inspección es estática. No se ejecutaron llamadas HTTP, Apps Script, Drive, Sheets, navegador, pruebas multi-cuenta ni E2E; no se verificaron deployments ni Script Properties. La matriz por acción debe completarse con la relación individual handler → helpers → hoja/archivo persistido para cada callsite, incluidos los consumidores dinámicos, y con evidencia de los destinos desplegados. TASK-638 permanece En ejecución.
===============================================================================


===============================================================================
## C1.297 — Trazabilidad USER/ACADEMIC, identidad y acciones públicas

### Identidad y sesión
- `js/auth.js:138-160` recibe USER/loginUser y construye currentUser sin conservar sessionToken.
- `js/api.js:39-58` solo agrega requesterUserId/requesterRole; el body JSON no incluye sessionToken/authToken/token.
- USER `validateRolePermission:1253-1261` verifica rol autenticado antes del bypass de acciones especiales; ACADEMIC `validateRolePermission:524+` requiere token para acciones no públicas.
- **Corrección de mapa:** la afirmación general «js/api.js incorpora sessionToken» es incorrecta para el HEAD C1.296. AUD-NG-001 sigue abierto y se amplía; no afirmar propagación efectiva.

### USER — tickets
- `PUBLIC_ACTIONS:922-924` incluye nueve acciones públicas. La lista de bypass autenticado en `validateRolePermission:1259-1261` incluye submitProblemTicket/getProblemTickets/replyProblemTicket y evita RBAC/contexto después de verificar sesión.
- `submitProblemTicket:400+` persiste userId/nombre/rol del payload, no claims.
- `getProblemTickets:470+` filtra por currentUserId solo si está presente; omitir userId permite obtener todos los tickets (las notas internas se filtran para no administradores).
- `replyProblemTicket:603+` comprueba propiedad solo si currentUserId existe; omitirlo permite responder a ticket ajeno. El autor también se toma del payload.
- Consumidores: `js/ui-common.js:3806-3823` crear; `3901-3911` listar; `3985-4003` responder; `4096` panel administrativo con payload vacío.
- **AUD-NG-364 ALTO/P1:** controles de propietario fail-open e impersonación en tickets. Ampliar TASK-636 existente; no crear ID de tarea duplicado.

### USER — contenido público
- `PUBLIC_ACTIONS` permite getNews y getInstitutionalAnnouncements sin token.
- `getNews:3116-3152` acepta includeInactive/grado/seccion del cliente; includeInactive omite estado/vigencia.
- `getInstitutionalAnnouncements:3817-3845` filtra por rol/audiencia aportados por el cliente, sin identidad verificada.
- **AUD-NG-365 MEDIO/P2:** filtros públicos de audiencia/vigencia manipulables; la sensibilidad de datos reales no se verificó. Ampliar TASK-636.

### ACADEMIC — rutas públicas y hallazgos previos
- `PUBLIC_ACTIONS:265`: ping, createAdmissionRequest, getPublicAdmissionStatus, saveAdmissionDraft, getAdmissionDraft y getServiceHealthDiagnostics.
- `js/student.js:278,3179,3189` consume seguimiento público y creación/consulta de admisión.
- saveAdmissionDraft/getAdmissionDraft siguen cubiertos por AUD-NG-002/AUD-NG-357; getPublicAdmissionStatus por F5-004/AUD-NG-002; no duplicar.
- getServiceHealthDiagnostics fija connectivity/permissions en PASS y solo prueba Drive con fullCheck; conservar AUD-NG-323.

### Reconciliación
- AUD-NG-001 ampliado; AUD-NG-280 conservado para getAutomationRules; AUD-NG-002/AUD-NG-357 y AUD-NG-323 sin duplicar.
- AUD-NG-364 y AUD-NG-365 nuevos.
- TASK-636 (backlog Otros) se amplía con tickets y filtros públicos; TASK-678 se amplía con trazabilidad por acción/claims.
- TASK-638 sigue En ejecución. No se modificó código ni se probaron HTTP, Apps Script, Drive, Sheets, navegador o deployments.
===============================================================================


===============================================================================
## C1.298 — TASK-638: traza TASK/EXAM y persistencia de categorías

### TASK — consumidores y persistencia
| Acción | Origen / consumidor | Handler | Datos / dependencias | Estado de traza |
|---|---|---|---|---|
| getStudentTasks | js/student.js:1228 | TASK Code.gs:613 | Tareas, Entregas, isInTeacherList; payload userId/grado/seccion | Público; AUD-NG-002/TASK-636; trazado parcial |
| getAllTasks | js/teacher.js:3015,3315,3627,4594 | TASK Code.gs:1177 | Tareas; filtro profesorId del cliente | Público; AUD-NG-002/TASK-636 |
| listProjects | Sin caller JS localizado en la revisión citada | TASK Code.gs:1296 | pseudocode; fallback getStudentFolder/Drive | Protegido por token/contexto; AUD-NG-001 afecta token frontend |
| loadProject | js/teacher.js:4870 | TASK Code.gs:1371 | pseudocode; fallback DriveApp.getFileById(fileId) | Público; sin comprobación de propietario en fallback; AUD-NG-002/TASK-636 |
| getAllStudentProjects | js/teacher.js:4827 | TASK Code.gs:1407 | DriveApp, DRIVE_FOLDER_ID, carpetas grado/sección/alumno, fileId | Público; AUD-NG-002/TASK-636 |
| getVirtualClassrooms | Matriz de consumidores previa TASK | TASK Code.gs:1476 | AulasVirtuales; filtros de cliente | Público; AUD-NG-002/TASK-636 |
| getPosts | js/student.js:769; consumidores de publicaciones docentes | TASK Code.gs:1526 | PublicacionesAnuncios; authRole/includeDrafts del payload | Público; spoofing de authRole; AUD-NG-002/TASK-636 |
| getStudyMaterials | js/student.js:807 | TASK Code.gs:1632 | MaterialesEducativos; archivoUrl/driveId | Público; AUD-NG-002/TASK-636 |

PUBLIC_ACTIONS de TASK incluye nueve acciones. El dispatcher aplica validateRolePermission antes del switch, pero el bypass de PUBLIC_ACTIONS retorna autorizado sin token/claims/contexto. getDriveStorageQuotaMetricsReport conserva AUD-NG-003; no duplicar.

### EXAM — consumidores y persistencia
| Acción | Origen / consumidor | Handler | Datos / dependencias | Estado de traza |
|---|---|---|---|---|
| getAllExams | js/teacher.js:3016,3316,3628,4595 | EXAM Code.gs:609 | Examenes; profesorId opcional de cliente | Público; AUD-NG-356/TASK-685 |
| getStudentExams | js/student.js:1241 | EXAM Code.gs:1057 | Examenes, EntregasExamen; devuelve nota/comentario | Público; userId de payload; AUD-NG-356/TASK-685 |
| getEvaluationCategories | Sin caller JS directo localizado en la revisión | EXAM Code.gs:1278 | CategoriasEvaluacion; getOrCreateSheet | Público; hallazgos AUD-NG-366/367 |
| getRubrics | Sin caller JS directo localizado en la revisión | EXAM Code.gs:1340 | RubricasEvaluacion; criterios JSON | Público; traza de consumidor pendiente |

### AUD-NG-366 — MEDIO/P2 — Inicialización de categorías duplica encabezado
- EXAM getOrCreateSheet (helper desde línea 26) crea CategoriasEvaluacion y agrega encabezado; getEvaluationCategories (1278–1292) vuelve a agregar encabezado cuando data.length <= 1.
- La fila duplicada queda incluida en data.slice(1) y se presenta como categoría espuria. Endpoint en PUBLIC_ACTIONS.
- Derivación: ampliar F9-TASK03; no crear ID duplicado.

### AUD-NG-367 — MEDIO/P2 — El ámbito solicitado no se aplica
- getEvaluationCategories recibe ambito, pero no lo usa; devuelve todas las filas de CategoriasEvaluacion aunque exista columna Ambito.
- Derivación: ampliar F9-TASK03 para filtrar por ámbito y probar categorías globales/específicas.

TASK-638 continúa En ejecución; el mapa es parcial y no declara cerrada la traza de todos los callsites.
===============================================================================


===============================================================================
## C1.299 — TASK-638: autorización contextual y persistencia TASK/EXAM

### TASK — operaciones, consumidores y persistencia
| Acción | Consumidor | Handler | Persistencia / efecto | Control observado |
|---|---|---|---|---|
| closeAcademicYear | js/teacher.js:2915 | TASK Code.gs:524 | Entregas, Drive, Tareas, ConfiguracionAcademica, Log_Cierres | Profesor permitido; borra todas las Entregas/archivos aunque payload incluya profesorId; backupId no es respaldo creado. AUD-NG-369. |
| deleteFile | js/student.js:2057,2504 | TASK Code.gs:1049 | DriveApp.getFileById().setTrashed(true) | Estudiante/Alumno permitidos; no valida propietario. AUD-NG-370. |
| getTeacherActivity | js/teacher.js:3017,3525,3610,4596 | TASK Code.gs:1119 | Usuarios, Tareas, Entregas | profesorId opcional del payload; sin él devuelve todos; no verifica ámbito docente por claims. AUD-NG-371. |
| getSubmissionDocumentPreviewUrl | js/teacher.js:1207 | TASK Code.gs:2367 | Drive metadatos, URL preview/download | Caller no envía token; handler espera claims.valid aunque verifySessionToken retorna claims sin valid. AUD-NG-368; token propagation se relaciona con AUD-NG-001/TASK-636. |

### EXAM — libro de calificaciones y persistencia
| Acción | Consumidor | Handler | Persistencia / efecto | Control observado |
|---|---|---|---|---|
| getTeacherExamActivity | js/teacher.js:3018,3618,4597 | EXAM Code.gs:1176 | Usuarios, Examenes, EntregasExamen | profesorId opcional del payload; sin él devuelve todos; no verifica asignación. AUD-NG-371. |
| getGradebookData | js/teacher.js:5237 | EXAM Code.gs:1458 | Usuarios, CalificacionesEstudiantes, RecuperacionesEstudiante, CategoriasEvaluacion, CierresPeriodos | profesorId se recibe pero no se usa; devuelve estudiantes/notas de grado/sección arbitrarios. AUD-NG-372. |
| saveGradebookGrades | js/teacher.js:5385 | EXAM Code.gs:1533 | CalificacionesEstudiantes | IDs de estudiantes y authRole del payload; sin scope docente; authRole controla bypass de cierre. AUD-NG-372/373. |
| saveStudentRecovery | js/teacher.js:5343 | EXAM Code.gs:1722 | RecuperacionesEstudiante | userId/autorizadoPor del cliente; sin relación docente-estudiante. AUD-NG-372. |
| closePeriodGradebook | js/teacher.js:5417 | EXAM Code.gs:1832 | CierresPeriodos y publishGradebookForContext | Profesor puede indicar cualquier grado/sección/asignatura/período. AUD-NG-372. |
| getStudentAcademicReport | js/teacher.js:2992 | EXAM Code.gs:2043 | Matriculas, CalificacionesEstudiantes, RecuperacionesEstudiante, CategoriasEvaluacion | userId libre para Padre/Tutor/Responsable/Profesor; no valida vínculo/ámbito. AUD-NG-372. |
| getStudentRecoveries | Sin caller directo localizado en esta pasada | EXAM Code.gs:1769 | RecuperacionesEstudiante | Roles Padre/Tutor/Responsable permitidos; userId opcional sin comprobar vínculo. AUD-NG-372. |
| getExamGradeDistributionAnalytics | js/teacher.js:4388 | EXAM Code.gs:733 | Examenes, EntregasExamen | No verifica que examenId pertenezca al docente. AUD-NG-372. |

### Hallazgos nuevos
- AUD-NG-368 MEDIO/P2: preview handler espera `sessionCheck.valid`, pero verifySessionToken retorna claims; además el caller omite token, antecedente AUD-NG-001/TASK-636.
- AUD-NG-369 CRÍTICO/P0: closeAcademicYear borra globalmente Entregas y archivos Drive aunque se envíe profesorId; el handler no crea el backup que aparenta registrar.
- AUD-NG-370 ALTO/P1: deleteFile permite a Estudiante/Alumno mandar a papelera fileId sin validar propietario.
- AUD-NG-371 ALTO/P1: getTeacherActivity/getTeacherExamActivity aplican profesorId solo si el cliente lo envía; sin ámbito derivado de claims.
- AUD-NG-372 ALTO/P1: handlers EXAM carecen de scope docente y relación tutor-estudiante en consultas y mutaciones.
- AUD-NG-373 ALTO/P1: saveGradebookGrades confía en authRole del payload para permitir escritura en período cerrado.

### Tareas derivadas
- Ampliar TASK-636 existente (PM-01/P0) con AUD-NG-368/369/370/371-TASK/373: token/claims, propiedad de archivos, ámbito docente, cierre granular y backup real verificable. Sin ID nuevo.
- Ampliar TASK-685 existente con AUD-NG-371-EXAM/372/373: ABAC de docente/guardianes, protección de consultas y mutaciones, actor de claims y bypass de cierre. Sin ID nuevo.
- TASK-638 sigue En ejecución; no se declara cerrada la matriz global.
===============================================================================


===============================================================================
## C1.301 — cierre de trazabilidad TASK-638: contratos, consumidores y persistencia

### 1. Alcance, evidencia heredada y regla de no repetición
- Se reutilizan sin repetir los inventarios verificados en C1.289–C1.293: 1.024 blobs del árbol; 101/101 HTML/HTM; 24/24 JavaScript; 6/6 CSS; 6/6 archivos Apps Script; 27/27 JSON; inventario de archivos reconciliado con el tree. No se reauditaron esas capas.
- Se reutilizan C1.296–C1.299 para identidad, token, rutas públicas, TASK/EXAM, USER/ACADEMIC y hallazgos. Se amplía únicamente el tramo pendiente: consumidor → servicio → dispatcher → handler → hojas/Drive/cache/locks → respuesta; además wrappers dinámicos y endpoints.
- Conteo reconciliado del snapshot: 262 llamadas fetchApi literales en 24 archivos JavaScript (USER 70, ACADEMIC 120, TASK 23, EXAM 19, ACCOUNTING 30) y 25 llamadas inline en dashboard-recursos-humanos.html (ACCOUNTING); total 287. Los casos repetidos por distintos consumidores se conservan como callsites separados. Los 5 servicios registran 745 cases en sus dispatchers (TASK 44, EXAM 38, ACADEMIC 241, USER 182, ACCOUNTING 240); conteo estructural, no prueba de disponibilidad.
- Fuentes backend y SHA del snapshot: TASK 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM 1d93296628fae31f680004f637897e2b1314a64c; ACADEMIC df87a2eea9f0ef79d0b966d03fd5bbe432003df5; USER 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACCOUNTING 38b979d41596b85e888b4a7060b37bbac0840a28.
- Consumidores revisados en este complemento: js/student.js e2888cea60322e49a40b89adadb8010489605dcc; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; js/accounting.js a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7; js/secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c. Las demás llamadas de auth.js, config.js, developer.js, exam.js, games-adapter.js, index-ui.js, quizpro.js, results.js y ui-common.js se reconcilian abajo.

### 2. Matriz por acción: consumidores, dispatcher, handler y persistencia
Las hojas literales se extraen de la función handler; «helper/dinámica» significa que la hoja/archivo se resuelve por helper, payload o configuración y no se presenta como literal comprobado. Los métodos de persistencia son observaciones estáticas, no pruebas de escritura real.
### TASK
| Acción | Consumidor/callsite | Dispatcher (línea) | Handler (línea) | Hojas literales | Persistencia/efectos observados |
|---|---|---:|---|---|---|
| `closeAcademicYear` | js/teacher.js:2915 | 412 | closeAcademicYear (524) | Tareas,Entregas,Log_Cierres | SpreadsheetApp,getSheetOrThrow,getSheetByName,getOrCreateSheet,getDataRange,DriveApp,setTrashed,deleteRow,appendRow |
| `createPost` | js/teacher.js:1962 | 416 | createPost (1563) | PublicacionesAnuncios | SpreadsheetApp,getOrCreateSheet,appendRow |
| `createStudyMaterial` | js/teacher.js:1978 | 420 | createStudyMaterial (1665) | MaterialesEducativos | SpreadsheetApp,getOrCreateSheet,appendRow |
| `createTask` | js/teacher.js:4740 | 385 | createTask (447) | Tareas | SpreadsheetApp,getSheetOrThrow,appendRow |
| `deleteFile` | js/student.js:2057<br>js/student.js:2504 | 396 | deleteFile (1049) | helper/dinámica | DriveApp,setTrashed |
| `getAllStudentProjects` | js/teacher.js:4827 | 410 | getAllStudentProjects (1407) | helper/dinámica | DriveApp |
| `getAllTasks` | js/teacher.js:3015<br>js/teacher.js:3315<br>js/teacher.js:3627<br>js/teacher.js:4594 | 402 | getAllTasks (1177) | Tareas | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `getPosts` | js/student.js:769 | 415 | getPosts (1526) | PublicacionesAnuncios | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentTasks` | js/student.js:1228 | 392 | getStudentTasks (613) | Tareas,Entregas | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `getStudyMaterials` | js/student.js:807 | 419 | getStudyMaterials (1632) | MaterialesEducativos | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getSubmissionDocumentPreviewUrl` | js/teacher.js:1207 | 386 | getSubmissionDocumentPreviewUrl (2367) | helper/dinámica | DriveApp |
| `getTeacherActivity` | js/teacher.js:3017<br>js/teacher.js:3525<br>js/teacher.js:3610<br>js/teacher.js:4596 | 401 | getTeacherActivity (1119) | Usuarios,Tareas,Entregas | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `loadProject` | js/teacher.js:4870 | 409 | loadProject (1371) | pseudocode | SpreadsheetApp,getSheetOrThrow,getDataRange,DriveApp |
| `submitAssignment` | js/student.js:2572 | 397 | submitAssignment (892) | Entregas,EntregasVersiones,Tareas | SpreadsheetApp,getSheetOrThrow,getOrCreateSheet,appendRow,getDataRange,setValues |
| `uploadFile` | js/student.js:2361<br>js/student.js:2388 | 393 | uploadFile (704) | Usuarios,Tareas | SpreadsheetApp,getSheetOrThrow,getDataRange,DriveApp,createFile |

### EXAM
| Acción | Consumidor/callsite | Dispatcher (línea) | Handler (línea) | Hojas literales | Persistencia/efectos observados |
|---|---|---:|---|---|---|
| `closePeriodGradebook` | js/teacher.js:5417 | 385 | closePeriodGradebook (1832) | CierresPeriodos | SpreadsheetApp,getOrCreateSheet,appendRow |
| `createExam` | js/teacher.js:4789 | 361 | createExam (506) | Examenes,PreguntasExamen | SpreadsheetApp,getSheetOrThrow,appendRow,setValues |
| `getAllExams` | js/teacher.js:3016<br>js/teacher.js:3316<br>js/teacher.js:3628<br>js/teacher.js:4595 | 365 | getAllExams (609) | Examenes | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `getExamGradeDistributionAnalytics` | js/teacher.js:4388 | 396 | getExamGradeDistributionAnalytics (733) | Examenes,EntregasExamen | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `getGradebookData` | js/teacher.js:5237 | 373 | getGradebookData (1458) | Usuarios,CalificacionesEstudiantes,RecuperacionesEstudiante,CierresPeriodos | SpreadsheetApp,getSheetOrThrow,getDataRange,getOrCreateSheet |
| `getStudentAcademicReport` | js/student.js:2992 | 391 | getStudentAcademicReport (2043) | Matriculas,CalificacionesEstudiantes,RecuperacionesEstudiante | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentExams` | js/student.js:1241 | 368 | getStudentExams (1057) | Examenes,EntregasExamen | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `getTeacherExamActivity` | js/teacher.js:3018<br>js/teacher.js:3618<br>js/teacher.js:4597 | 366 | getTeacherExamActivity (1176) | Usuarios,Examenes,EntregasExamen | SpreadsheetApp,getSheetOrThrow,getDataRange |
| `saveGradebookGrades` | js/teacher.js:5385 | 374 | saveGradebookGrades (1533) | CierresPeriodos,CalificacionesEstudiantes | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow,setValues |
| `saveStudentRecovery` | js/teacher.js:5343 | 383 | saveStudentRecovery (1722) | CierresPeriodos,RecuperacionesEstudiante | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `simulateExamReschedule` | js/teacher.js:1778 | 395 | simulateExamReschedule (910) | Examenes | SpreadsheetApp,getSheetOrThrow,getDataRange |

### ACADEMIC
| Acción | Consumidor/callsite | Dispatcher (línea) | Handler (línea) | Hojas literales | Persistencia/efectos observados |
|---|---|---:|---|---|---|
| `addCaseFollowUpNote` | js/teacher.js:5855 | 925 | addCaseFollowUpNote (8649) | CasosSeguimiento | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `addToWaitlist` | js/secretary.js:1579 | 853 | addToWaitlist (1750) | SolicitudesAdmision,ListaEsperaAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow,setValue |
| `applyScheduleTemplate` | js/teacher.js:1371 | 760 | applyScheduleTemplate (14000) | helper/dinámica | SpreadsheetApp,getSheetByName,getDataRange,insertSheet,appendRow |
| `assignDepartmentHead` | js/teacher.js:2499 | 779 | assignDepartmentHead (7398) | DepartamentosAcademicos | SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValue |
| `bulkApplyAttendanceStatus` | js/teacher.js:2066 | 913 | bulkApplyAttendanceStatus (8339) | RegistrosAsistencia | LockService,SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValues |
| `checkEnrollmentCapacity` | js/secretary.js:1412 | 883 | checkEnrollmentCapacity (11147) | OfertaAcademica,Matriculas,SolicitudesAdmision | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange |
| `compareScheduleVersions` | js/teacher.js:1661 | 816 | compareScheduleVersions (7145) | VersionesHorarios,HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `configureAcademicJornada` | js/teacher.js:7678 | 831 | configureAcademicJornada (4717) | JornadasAcademicas | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `configureSchoolYear` | js/teacher.js:7586 | 829 | configureSchoolYear (2861) | AnosLectivos | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `convertAdmissionToStudent` | js/secretary.js:283 | 861 | convertAdmissionToStudent (2156) | SolicitudesAdmision,ExpedientesEstudiantes,Usuarios,RelacionesFamiliares,InvitacionesVinculacion,DocumentosEstudiante,MovimientosEstudiante | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow,setValue |
| `createAcademicOffer` | js/teacher.js:723<br>js/teacher.js:1928 | 740 | createAcademicOffer (6180) | OfertaAcademica | SpreadsheetApp,getOrCreateSheet,appendRow,CacheService |
| `createAdmissionRequest` | js/student.js:3179 | 842 | createAdmissionRequest (984) | SolicitudesAdmision,BorradoresAdmision | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow,setValue |
| `createCalendarEvent` | js/secretary.js:622 | 797 | createCalendarEvent (6651) | MantenimientoAulas,CalendarioAcademico | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `createClassSchedule` | js/teacher.js:738<br>js/teacher.js:769<br>js/teacher.js:1888 | 799 | createClassSchedule (6900) | HorariosClase,BandejaNotificaciones | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow,setValues |
| `createSessionException` | js/teacher.js:1728 | 814 | createSessionException (2692) | ExcepcionesSesiones | SpreadsheetApp,getOrCreateSheet,appendRow |
| `createSystemBackup` | js/teacher.js:2769 | 706 | createSystemBackup (12274) | helper/dinámica | SpreadsheetApp,getDataRange,createFile |
| `createTeacherSubstitution` | js/teacher.js:2114<br>js/teacher.js:2131 | 748 | createTeacherSubstitution (6501) | HorariosClase,AsignacionesDocentes | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `createTeacherSupervision` | js/teacher.js:5933 | 949 | createTeacherSupervision (5078) | SupervisionesDocentes | SpreadsheetApp,getOrCreateSheet,appendRow |
| `deleteClassSchedule` | js/teacher.js:687 | 800 | deleteClassSchedule (6992) | HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `executeCurricularMigration` | js/teacher.js:2248 | 784 | executeCurricularMigration (3130) | HistorialAcademico,CalificacionesEstudiantes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `exportBulkClassSchedules` | js/teacher.js:874 | 819 | exportBulkClassSchedules (3403) | HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `findDuplicateStudents` | js/teacher.js:8304 | 866 | findDuplicateStudents (10107) | SolicitudesAdmision,ExpedientesEstudiantes | SpreadsheetApp,getOrCreateSheet,getDataRange,getSheetByName |
| `generateAutoSchedules` | js/teacher.js:1870 | 743 | generateAutoSchedules (6335) | OfertaAcademica,AsignacionesDocentes,SedesAulas,HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `generateMigrationReport` | js/teacher.js:2886 | 703 | generateMigrationReport (12793) | MigrationLogs | getOrCreateSheet,SpreadsheetApp,appendRow |
| `getAcademicConfig` | js/teacher.js:368<br>js/teacher.js:3629 | 694 | getAcademicConfig (12518) | ConfiguracionAcademica | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAcademicHistory` | js/student.js:1151 | 696 | getAcademicHistory (12718) | helper/dinámica | SpreadsheetApp,getSheetByName,getDataRange |
| `getAcademicOffers` | js/teacher.js:716<br>js/teacher.js:1921 | 739 | getAcademicOffers (6132) | OfertaAcademica | CacheService,SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAcademicPlanningAuditLogs` | js/teacher.js:1403 | 763 | getAcademicPlanningAuditLogs (13837) | HistorialCambiosEntidad | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAdmissionAnalyticsReport` | js/teacher.js:18 | 859 | getAdmissionAnalyticsReport (11693) | SolicitudesAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAdmissionEvaluations` | js/secretary.js:1466 | 852 | getAdmissionEvaluations (1724) | EvaluacionesAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAdmissionInterviews` | js/secretary.js:367 | 849 | getAdmissionInterviews (1645) | EntrevistasAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAdmissionRequests` | js/secretary.js:16 | 843 | getAdmissionRequests (1113) | SolicitudesAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAttendanceFollowupCases` | js/teacher.js:5784 | 923 | getAttendanceFollowupCases (8815) | CasosSeguimiento | SpreadsheetApp,getSheetByName,getDataRange,getOrCreateSheet |
| `getAttendanceIncidents` | js/teacher.js:5557 | 920 | getAttendanceIncidents (8695) | IncidenciasAsistencia | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getClassroomResources` | js/teacher.js:2534<br>js/secretary.js:670 | 801 | getClassroomResources (7694) | SedesAulas,MantenimientoAulas | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `getClassSchedules` | js/teacher.js:672 | 798 | getClassSchedules (6718) | HorariosClase | CacheService,SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getCoordinatorOverview` | js/secretary.js:535 | 741 | getCoordinatorOverview (6301) | OfertaAcademica,AsignacionesDocentes,HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getCurricularAnalyticsReport` | js/teacher.js:2294<br>js/secretary.js:821 | 780 | getCurricularAnalyticsReport (2927) | CalificacionesEstudiantes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getCurricularConstraints` | js/teacher.js:1525 | 773 | getCurricularConstraints (13509) | TipoRestriccion | SpreadsheetApp,getSheetByName,insertSheet,appendRow,getDataRange |
| `getCurricularEquivalences` | js/teacher.js:2217 | 783 | getCurricularEquivalences (3093) | CatalogoAsignaturas | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getDailyAttendance` | js/teacher.js:5502 | 916 | getDailyAttendance (8526) | RegistrosAsistencia | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getDepartmentAcademicPlanning` | js/teacher.js:2461<br>js/secretary.js:780 | 750 | getDepartmentAcademicPlanning (7424) | DepartamentosAcademicos,OfertasAcademicas,AsignacionesDocentes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getMergePreviewComparison` | js/secretary.js:912 | 868 | getMergePreviewComparison (10334) | helper/dinámica | — |
| `getPlanningQualityAndOccupancyReport` | js/teacher.js:1088 | 818 | getPlanningQualityAndOccupancyReport (3525) | HorariosClase,SedesAulas | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getPublicAdmissionStatus` | js/student.js:278<br>js/student.js:3189 | 846 | getPublicAdmissionStatus (1510) | SolicitudesAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getReusableResourceCatalog` | js/teacher.js:2344 | 781 | getReusableResourceCatalog (2989) | RecursosEducativosReutilizables,ProyectosInterdisciplinarios | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getScheduleConflictResolutionAlternatives` | js/teacher.js:807 | 805 | getScheduleConflictResolutionAlternatives (8085) | helper/dinámica | SpreadsheetApp |
| `getScheduleTemplates` | js/teacher.js:1309 | 754 | getScheduleTemplates (13961) | helper/dinámica | SpreadsheetApp,getSheetByName,getDataRange |
| `getScheduleVersions` | js/teacher.js:1607 | 815 | getScheduleVersions (7119) | VersionesHorarios | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getSectionCapacityAnalyticsReport` | js/teacher.js:1447 | 770 | getSectionCapacityAnalyticsReport (13657) | helper/dinámica | SpreadsheetApp,getSheetByName,getDataRange |
| `getStudentAttendanceSummary` | js/student.js:1051 | 940 | getStudentAttendanceSummary (9759) | RegistrosAsistencia | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentDocuments` | js/teacher.js:8181<br>js/secretary.js:304 | 876 | getStudentDocuments (10829) | DocumentosEstudiante,HistorialVersionesDocumentos | SpreadsheetApp,getOrCreateSheet,getDataRange,DriveApp |
| `getStudentEnrollmentHistory` | js/student.js:143 | 705 | getStudentEnrollmentHistory (12877) | Matriculas,CargosEstudiante | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentFile` | js/teacher.js:7884 | 862 | getStudentFile (2510) | ExpedientesEstudiantes,Matriculas,RelacionesEstudianteTutor,ResponsablesTutores,DocumentosEstudiante,MovimientosEstudiante | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentFileAdministrativeReports` | js/secretary.js:853<br>js/secretary.js:871 | 870 | getStudentFileAdministrativeReports (10431) | ExpedientesEstudiantes,Matriculas,MovimientosEstudiante,DocumentosEstudiante,HistorialCambiosEntidad | SpreadsheetApp,getOrCreateSheet,getDataRange,getSheetByName,appendRow |
| `getStudentGuardians` | js/teacher.js:8078 | 872 | getStudentGuardians (10553) | RelacionesEstudianteTutor,ResponsablesTutores | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentSchedule` | js/student.js:891 | 804 | getStudentSchedule (7986) | Matriculas,HorariosClase,OfertaAcademica,CatalogoAsignaturas,AsignacionesDocentes | SpreadsheetApp,getOrCreateSheet,getDataRange,getSheetByName |
| `getStudentTimeline` | js/teacher.js:8267 | 865 | getStudentTimeline (9964) | HistorialCambiosEntidad,FusionesExpedientes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getTeacherSupervisions` | js/teacher.js:5883 | 950 | getTeacherSupervisions (5108) | SupervisionesDocentes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getWaitlist` | js/secretary.js:1528 | 854 | getWaitlist (1813) | ListaEsperaAdmision,SolicitudesAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getWhatsAppLink` | js/student.js:1566<br>js/student.js:2610<br>js/teacher.js:3945 | 700 | getWhatsAppLink (12768) | Clases | getOrCreateSheet,SpreadsheetApp,getDataRange |
| `importBulkClassSchedules` | js/teacher.js:936<br>js/teacher.js:970 | 820 | importBulkClassSchedules (3430) | HorariosClase | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValues,appendRow |
| `listSystemBackups` | js/teacher.js:2735 | 708 | listSystemBackups (12321) | helper/dinámica | — |
| `manageReusableResource` | js/teacher.js:2403 | 782 | manageReusableResource (3046) | ProyectosInterdisciplinarios,RecursosEducativosReutilizables | SpreadsheetApp,getOrCreateSheet,appendRow |
| `mergeStudentFiles` | js/teacher.js:8336 | 867 | mergeStudentFiles (10282) | ExpedientesEstudiantes,DocumentosEstudiante,MovimientosEstudiante,FusionesExpedientes | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `offerWaitlistSlot` | js/secretary.js:1599 | 856 | offerWaitlistSlot (1876) | ListaEsperaAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `openAttendanceSession` | js/teacher.js:565 | 911 | openAttendanceSession (8206) | SesionesAsistencia | SpreadsheetApp,getOrCreateSheet,appendRow |
| `previewBackupRestoreImpact` | js/teacher.js:2170 | 903 | previewBackupRestoreImpact (3174) | helper/dinámica | DriveApp,SpreadsheetApp,getSheetByName |
| `previewPublishImpact` | js/teacher.js:1005 | 821 | previewPublishImpact (3351) | HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `publishClassSchedules` | js/teacher.js:1051 | 823 | publishClassSchedules (7008) | HorariosClase,VersionesHorarios | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `recordInterviewOutcome` | js/secretary.js:439 | 850 | recordInterviewOutcome (1671) | EntrevistasAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `reorderWaitlist` | js/secretary.js:1625 | 855 | reorderWaitlist (1849) | ListaEsperaAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `restoreScheduleVersion` | js/teacher.js:1688 | 817 | restoreScheduleVersion (7224) | VersionesHorarios,HorariosClase | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues,appendRow |
| `restoreSystemBackup` | js/teacher.js:2793 | 710 | restoreSystemBackup (12406) | helper/dinámica | DriveApp,SpreadsheetApp,getSheetByName,insertSheet,getDataRange,setValues |
| `saveAdmissionEvaluation` | js/secretary.js:1505 | 851 | saveAdmissionEvaluation (1691) | EvaluacionesAdmision | SpreadsheetApp,getOrCreateSheet,appendRow |
| `saveAttendanceFollowupCase` | js/teacher.js:5834 | 924 | saveAttendanceFollowupCase (8881) | CasosSeguimiento | SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValue |
| `saveAttendanceIncident` | js/teacher.js:5639 | 921 | saveAttendanceIncident (8719) | IncidenciasAsistencia | SpreadsheetApp,getOrCreateSheet,appendRow |
| `saveClassroomMaintenance` | js/teacher.js:2605<br>js/secretary.js:740 | 803 | saveClassroomMaintenance (7797) | MantenimientoAulas,SedesAulas | LockService,SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValue |
| `saveClassroomResource` | js/teacher.js:2654 | 802 | saveClassroomResource (7752) | SedesAulas | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `saveCurricularConstraint` | js/teacher.js:1573 | 776 | saveCurricularConstraint (13562) | TipoRestriccion | SpreadsheetApp,getSheetByName,insertSheet,appendRow,getDataRange |
| `saveDailyAttendance` | js/teacher.js:5607 | 915 | saveDailyAttendance (8452) | RegistrosAsistencia | LockService,SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValues |
| `saveInstitutionalActivity` | js/teacher.js:7772 | 835 | saveInstitutionalActivity (4876) | ActividadesInstitucionales | SpreadsheetApp,getOrCreateSheet,appendRow |
| `saveQuestion` | js/teacher.js:2866 | 702 | saveQuestion (12781) | BancoPreguntas | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues,appendRow |
| `saveScheduleTemplate` | js/teacher.js:1350 | 751 | saveScheduleTemplate (13895) | NombrePlantilla | SpreadsheetApp,getSheetByName,insertSheet,appendRow,getDataRange |
| `saveStudentGuardian` | js/teacher.js:8150 | 873 | saveStudentGuardian (10589) | ResponsablesTutores,RelacionesEstudianteTutor | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues,appendRow |
| `saveSupervisionObservation` | js/teacher.js:5970 | 952 | saveSupervisionObservation (5297) | ObservacionesSupervision,SupervisionesDocentes | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `saveTeacherWorkLoadPreferences` | js/teacher.js:1842 | 810 | saveTeacherWorkLoadPreferences (6842) | HorariosLaborales | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `saveWhatsAppLink` | js/teacher.js:3968 | 699 | saveWhatsAppLink (12758) | Clases | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `scheduleAdmissionInterview` | js/secretary.js:419 | 848 | scheduleAdmissionInterview (1595) | EntrevistasAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `unlinkStudentGuardian` | js/teacher.js:8115 | 874 | unlinkStudentGuardian (10673) | RelacionesEstudianteTutor | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `unmergeStudentFiles` | js/secretary.js:952 | 869 | unmergeStudentFiles (10387) | ExpedientesEstudiantes,HistorialCambiosEntidad | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `updateAcademicConfig` | js/teacher.js:531 | 695 | updateAcademicConfig (12534) | ConfiguracionAcademica | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValues |
| `updateAdmissionStatus` | js/secretary.js:264 | 847 | updateAdmissionStatus (1928) | SolicitudesAdmision | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `updateDocumentStatus` | js/secretary.js:342 | 877 | updateDocumentStatus (10957) | DocumentosEstudiante | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `updateStudentFile` | js/teacher.js:8052 | 864 | updateStudentFile (9940) | ExpedientesEstudiantes | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `uploadStudentDocument` | js/teacher.js:8232 | 875 | uploadStudentDocument (10693) | DocumentosEstudiante,HistorialVersionesDocumentos | DriveApp,createFile,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow,setValue |

### USER
| Acción | Consumidor/callsite | Dispatcher (línea) | Handler (línea) | Hojas literales | Persistencia/efectos observados |
|---|---|---:|---|---|---|
| `createInstitutionalAnnouncement` | js/teacher.js:5712 | 1436 | createInstitutionalAnnouncement (3848) | ComunicadosInstitucionales | SpreadsheetApp,getOrCreateSheet,appendRow |
| `createLinkInvitation` | js/secretary.js:1170 | 1423 | createLinkInvitation (3334) | InvitacionesVinculacion | SpreadsheetApp,getOrCreateSheet,appendRow |
| `createNews` | js/teacher.js:5037 | 1409 | createNews (5645) | NoticiasPortal | getOrCreateSheet,SpreadsheetApp,appendRow |
| `getAdministrativeRequests` | js/student.js:1007 | 1478 | getAdministrativeRequests (5036) | SolicitudesTramites | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAdmissionNotificationLogs` | js/secretary.js:1365 | 1453 | getAdmissionNotificationLogs (4938) | BandejaNotificaciones | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getCentralCapabilitiesCatalog` | js/secretary.js:474 | 1556 | getCentralCapabilitiesCatalog (8928) | helper/dinámica | — |
| `getEntityAuditHistory` | js/secretary.js:1194 | 1399 | getEntityAuditHistory (2745) | helper/dinámica | SpreadsheetApp,getSheetByName,getDataRange |
| `getFamilyConsolidatedSummary` | js/student.js:414 | 1431 | getFamilyConsolidatedSummary (3629) | ComprobantesPago,CargosEstudiante | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getFormativeEvaluations` | js/student.js:1087 | 1416 | getFormativeEvaluations (3232) | EvaluacionesFormativas | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getGameStats` | js/teacher.js:4936 | 1403 | getGameStats (3009) | Logros,QuizProAnalytics,LearningProfile | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getGuardianApplicants` | js/student.js:191<br>js/student.js:271 | 1430 | getGuardianApplicants (3583) | Usuarios,SolicitudesAdmision | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getGuardianStudents` | js/student.js:190 | 1429 | getGuardianStudents (3480) | ExpedientesEstudiantes,Usuarios,RelacionesFamiliares,RelacionesEstudianteTutor | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getInstitutionalAnnouncements` | js/student.js:3055<br>js/teacher.js:5665 | 1435 | getInstitutionalAnnouncements (3817) | ComunicadosInstitucionales | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getInstitutionalResponsibilitiesCatalog` | js/secretary.js:475 | 1559 | getInstitutionalResponsibilitiesCatalog (8968) | ResponsabilidadesInstitucionales | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getLearningProfile` | js/student.js:2681<br>js/teacher.js:4078 | 1406 | getLearningProfile (3090) | LearningProfile | getOrCreateSheet,SpreadsheetApp,getDataRange |
| `getNews` | js/teacher.js:4977 | 1408 | getNews (3116) | NoticiasPortal | getOrCreateSheet,SpreadsheetApp,getDataRange |
| `getScheduleChangeNotificationLogs` | js/secretary.js:1078 | 1452 | getScheduleChangeNotificationLogs (8897) | BandejaNotificaciones | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentGuardianConsolidatedList` | js/secretary.js:1103 | 1427 | getStudentGuardianConsolidatedList (8811) | RelacionesFamiliares,RestriccionesCustodiaLegal | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getStudentProcedureNotificationLogs` | js/secretary.js:975 | 1454 | getStudentProcedureNotificationLogs (4896) | helper/dinámica | SpreadsheetApp,getSheetByName,getDataRange |
| `getStudentsByGradoSeccion` | js/teacher.js:3014<br>js/teacher.js:3232<br>js/teacher.js:4593<br>js/teacher.js:5501 | 1378 | getStudentsByGradoSeccion (2561) | Usuarios | getSheetOrThrow,SpreadsheetApp,getDataRange |
| `getUserInfo` | js/student.js:1550 | 1379 | getUserInfo (2572) | Usuarios | getSheetOrThrow,SpreadsheetApp,getDataRange |
| `registerLegalCustodyRestriction` | js/secretary.js:1145 | 1426 | registerLegalCustodyRestriction (8757) | RestriccionesCustodiaLegal,RelacionesFamiliares | SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValue |
| `submitAdministrativeRequest` | js/student.js:987 | 1483 | submitAdministrativeRequest (5134) | SolicitudesTramites | SpreadsheetApp,getOrCreateSheet,appendRow |
| `submitAnnouncementReceiptConfirmation` | js/student.js:3092 | 1437 | submitAnnouncementReceiptConfirmation (3873) | ConfirmacionesLecturaComunicados | SpreadsheetApp,getOrCreateSheet,appendRow |
| `submitFamilyScholarshipApplication` | js/student.js:725 | 1434 | submitFamilyScholarshipApplication (3786) | BecasYDescuentosFamiliares | SpreadsheetApp,getOrCreateSheet,appendRow |
| `submitJointFamilyPayment` | js/student.js:635 | 1432 | submitJointFamilyPayment (3705) | ComprobantesPago,DistribucionPagosConjuntos | SpreadsheetApp,getOrCreateSheet,appendRow |
| `submitStudentAbsenceJustification` | js/student.js:963 | 1479 | submitStudentAbsenceJustification (5076) | SolicitudesTramites | SpreadsheetApp,getOrCreateSheet,appendRow |
| `uploadNewsImage` | js/teacher.js:5020 | 1410 | uploadNewsImage (6642) | helper/dinámica | createFile,DriveApp |

### ACCOUNTING
| Acción | Consumidor/callsite | Dispatcher (línea) | Handler (línea) | Hojas literales | Persistencia/efectos observados |
|---|---|---:|---|---|---|
| `assignAssetCustody` | js/accounting.js:604 | 772 | assignAssetCustody (9885) | ActivosPatrimoniales,AsignacionesActivos | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `confirmTransferReceipt` | js/accounting.js:2032 | 693 | confirmTransferReceipt (13286) | TransferenciasInventario | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `deliverMaterialRequisition` | js/accounting.js:472 | 697 | deliverMaterialRequisition (13503) | MaterialesSolicitudes | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `getAdmissionFinancialStatus` | js/student.js:353 | 639 | getAdmissionFinancialStatus (2339) | CargosEstudiante,ComprobantesPago | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAssetDisposals` | js/accounting.js:811 | 704 | getAssetDisposals (13840) | BajasBienes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getAssetItems` | js/accounting.js:537 | 771 | getAssetItems (9847) | ActivosPatrimoniales | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues |
| `getBibliographicWorks` | js/accounting.js:1422 | 759 | getBibliographicWorks (9063) | BibliotecaCatalogoObras,BibliotecaEjemplares | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues |
| `getDigitalResources` | js/accounting.js:1728 | 769 | getDigitalResources (9749) | RecursosDigitalesBiblioteca | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues |
| `getInventoryKardex` | js/accounting.js:188 | 675 | getInventoryKardex (6164) | InventariosKardex | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getInventoryTransfers` | js/accounting.js:1944 | 694 | getInventoryTransfers (13405) | TransferenciasInventario | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getLibraryIncidents` | js/accounting.js:1668 | 767 | getLibraryIncidents (9659) | BibliotecaIncidencias | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getLibraryLoans` | js/accounting.js:1534 | 763 | getLibraryLoans (9429) | BibliotecaPrestamos | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getLibraryReservations` | js/accounting.js:1610 | 765 | getLibraryReservations (9550) | BibliotecaReservas | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getMaintenanceOrders` | js/accounting.js:703 | 702 | getMaintenanceOrders (13758) | MantenimientoOrdenes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getMaterialRequisitions` | js/accounting.js:425 | 696 | getMaterialRequisitions (13475) | MaterialesSolicitudes | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getOvertimeRequests` | js/teacher.js:7827 | 670 | getOvertimeRequests (13035) | AprobacionHorasExtras | SpreadsheetApp,getOrCreateSheet,getDataRange |
| `getWarehouseLocations` | js/accounting.js:347 | 691 | getWarehouseLocations (13109) | AlmacenesUbicaciones | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues |
| `manageAssetItem` | js/accounting.js:591 | 770 | manageAssetItem (9793) | ActivosPatrimoniales | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues,appendRow |
| `manageLibraryBook` | js/accounting.js:1483 | 760 | manageLibraryBook (9150) | BibliotecaEjemplares,BibliotecaCatalogoObras | SpreadsheetApp,getOrCreateSheet,getDataRange,setValues,appendRow |
| `manageMaintenanceOrder` | js/accounting.js:751 | 701 | manageMaintenanceOrder (13667) | MantenimientoOrdenes,TransporteVehiculos | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `manageWarehouseLocation` | js/accounting.js:395 | 690 | manageWarehouseLocation (13072) | AlmacenesUbicaciones | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `processLibraryLoan` | js/accounting.js:1496<br>js/accounting.js:1583 | 762 | processLibraryLoan (9296) | BibliotecaEjemplares,BibliotecaPrestamos | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue,appendRow |
| `recordInventoryMovement` | js/accounting.js:285 | 674 | recordInventoryMovement (6050) | InventariosKardex | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `registerAssetDisposal` | js/accounting.js:861 | 703 | registerAssetDisposal (13790) | BajasBienes,ActivosPatrimoniales | SpreadsheetApp,getOrCreateSheet,appendRow,getDataRange,setValue |
| `reserveLibraryBook` | js/accounting.js:1508 | 764 | reserveLibraryBook (9461) | BibliotecaEjemplares,BibliotecaReservas | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |
| `returnAssetCustody` | js/accounting.js:624 | 773 | returnAssetCustody (9961) | ActivosPatrimoniales,AsignacionesActivos | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `reviewOvertimeRequest` | js/teacher.js:7861 | 669 | reviewOvertimeRequest (12988) | AprobacionHorasExtras | SpreadsheetApp,getOrCreateSheet,getDataRange,setValue |
| `transferInventoryStock` | js/accounting.js:2007 | 692 | transferInventoryStock (13140) | InventariosKardex,TransferenciasInventario | LockService,SpreadsheetApp,getOrCreateSheet,getDataRange,appendRow |

### 3. Consumidores adicionales y llamadas no incluidas en los cuatro controladores principales
- js/auth.js: USER getGameStats, mergeGuestData, loginUser, registerUser (dos callsites); js/config.js: ACADEMIC getAcademicConfig/getInstitutionalCatalog; js/developer.js: USER getStructuredLogs; js/exam.js: EXAM getExamQuestions/submitExam y USER recordAnalytics; js/games-adapter.js y js/quizpro.js: USER recordAnalytics/saveGameResult/getGlobalTop/getGameStats; js/index-ui.js: USER getNews; js/results.js: EXAM getExamResult.
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: 19 callsites; 18 USER (updateUserProfile, getUserSettings, getProviderIntegrations, sendChannelNotificationTest, saveUserSettings, saveVisualPaletteProposal, approveVisualPaletteProposal, getActiveVisualPalette, submitProblemTicket, getProblemTickets [dos], replyProblemTicket, updateTicketStatus [dos], acceptLegalDocument, searchGlobalOmnibox, getUserDynamicDashboardConfig) y 1 ACCOUNTING getPolicyAcceptances (línea 4301). Estos 19 callsites están incluidos en el total 262.
- dashboard-recursos-humanos.html SHA 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee: 25 callsites ACCOUNTING; createEmployeeRecord:993; manageInterviewSchedule:1028; calculatePayrollPeriod:1062; managePerformancePeriod:1136; managePerformanceCriteria:1169; managePerformanceEvaluation:1212; manageTrainingCourse:1309; manageTrainingEnrollment:1348; manageProfessionalDevelopmentPlan:1386; manageLaborIncident:1476; manageDisciplinaryMeasure:1517; manageStaffingNeeds:1603; manageWorkShiftAndSubstitution:1687/1726; getPerformanceEvaluations:1848; getEmployeeTrainingHistory:1921; getLaborIncidentsHistory:1994; getStaffingNeedsPlanning:2049; getWorkShiftsAndSubstitutionsHistory:2101; getEmployeeSelfServicePortal:2160; runHRIntegrationAndRegressionTests:2250; verifyLaborAndTaxInformation:2297; getEmployeeRecords:2363; getEmployeeContractAlerts:2393; getLeaveVacationRequests:2400.

### 4. Wrappers dinámicos, delegación y contratos sin ruta
- js/api.js fetchApi(service, action, payload) es el transporte común; los parámetros service/action pueden ser dinámicos. checkAllMicroservicesHealth usa ping contra SERVICE_REGISTRY; logStructuredEvent usa service variable con action recordStructuredLog; createBackup elige USER o ACADEMIC y envía createSpreadsheetBackup.
- Contratos de desarrollador activos: js/developer.js llama getBackupsList (api.js:299), createBackup/createSpreadsheetBackup (api.js:289–295), restoreSpreadsheetBackup (api.js:302–306), runSystemMaintenance (api.js:309–311) y exportSchoolYearArchive (api.js:334–341). Los dispatchers actuales no exponen esos nombres; ACADEMIC sí tiene createSystemBackup/listSystemBackups/restoreSystemBackup, pero no son alias demostrados de createSpreadsheetBackup/getBackupsList/restoreSpreadsheetBackup. No se declara equivalencia funcional.
- Otros wrappers ACADEMIC sin dispatcher/handler comprobado: createOrUpdateStudyGuide, getStudyGuides, toggleStudyGuideStatus y recordStudentAttendance; no se encontraron consumidores directos en los controladores inspeccionados. getStudentAttendanceSummary sí tiene handler y dispatcher. exportSchoolYearArchive sí tiene consumidor en js/developer.js:523, pero carece de ruta ACADEMIC.
- recordStructuredLog es un wrapper genérico sin dispatcher identificado y sin caller frontend activo localizado; queda catalogado como wrapper huérfano/no verificado, no como endpoint operativo.
- USER recibe initiateResumableUpload, getUploadProgress, cancelUploadSession, readLegacyDocument y getMultiPartFolderFiles y los delega a TASK mediante delegateToTaskService. TASK dispone de handlers de carga/lectura; la delegación usa JSON plano por UrlFetchApp, no envelope firmado; TASK no verifica InterServiceEnvelope. Conservar AUD-NG-083/AUD-NG-174; no duplicar.
- ACADEMIC getInstitutionalReportCatalog se despacha a getAcademicInstitutionalReportCatalog (handler existente). En cambio generateInstitutionalReport se despacha a una función inexistente en ACADEMIC; existe una función homónima en USER, pero no hay delegación documentada desde ACADEMIC.

### 5. Dispatchers sin handler y hallazgos vinculados
- AUD-NG-359 / TASK-688: USER despacha purgeSecurityCaches, dispatchSecurityEvent, processSecurityEventQueue y getSecurityEventsQueue sin definiciones locales; ACADEMIC despacha generateInstitutionalReport sin handler local; TASK despacha generateAcademicArchiveZip sin handler. En USER, dispatchSecurityEvent también es invocado por manageAccountState después de persistir, por lo que el fallo puede producir respuesta de error tras mutación. TASK-688 conserva ID y alcance, se amplía con la lista confirmada.
- AUD-NG-358 / TASK-687: ampliar el contrato sin dispatcher para incluir createSpreadsheetBackup (USER/ACADEMIC), getBackupsList, restoreSpreadsheetBackup y runSystemMaintenance (USER), exportSchoolYearArchive, createOrUpdateStudyGuide, getStudyGuides, toggleStudyGuideStatus y recordStudentAttendance (ACADEMIC). Distinguir wrappers con consumidor activo de wrappers declarados sin consumidor; no implementar ni retirar durante TASK-638.
- Hallazgos de autorización y persistencia AUD-NG-368..373 permanecen en TASK-636/TASK-685; esta matriz no los duplica ni intenta corregirlos. Se mantienen AUD-NG-356/357/358/359 y AUD-NG-001/002/083/174/323/354/355 según sus expedientes.

### 6. Endpoints, configuración y evidencia externa
- SERVICE_URLS declara URLs con forma de deployment para USER, ACADEMIC, TASK y EXAM; ACCOUNTING y DEVELOPER conservan valores placeholder. La configuración es evidencia de texto versionado, no prueba de deployment, autorización, Script Properties ni disponibilidad. DEVELOPER no tiene llamadas fetchApi literales detectadas.
- USER, ACADEMIC y ACCOUNTING tienen respuesta ping inline en doPost; TASK/EXAM exponen doGet de salud, pero no se presume que el health-check genérico por POST sea equivalente para todos los servicios. El health check que omite ACCOUNTING permanece vinculado a AUD-NG-323.
- No se accedió a consolas Apps Script, Script Properties, permisos Drive, despliegues ni datos productivos. No se declara funcional ningún endpoint por el mero hecho de existir URL/case/handler. El mapa etiqueta como «estático», «delegado», «sin dispatcher», «handler ausente», «placeholder» o «deployment no verificado» según corresponda.

### 7. Dictamen TASK-638 frente a criterios originales
- Cada clase de dependencia explícita solicitada (HTML script/link, CSS, recursos, JS, JSON, Apps Script, rutas, llamadas, contratos, consumidores/proveedores, persistencia y servicios externos) tiene inventario previo y/o matriz actualizada con origen y destino identificables.
- Rutas dinámicas y wrappers se documentan con su destino exacto o se marcan expresamente sin dispatcher/no verificados; las referencias relativas y sensibles a mayúsculas se mantienen en las tablas de inventario C1.289–C1.293. Ninguna URL declarativa se presenta como deployment probado.
- Hallazgos accionables se vinculan a tareas existentes TASK-636, TASK-685, TASK-687 y TASK-688; no se crearon IDs duplicados. Las anomalías documentales se registran como limitaciones, no como auditorías recursivas.
- **Dictamen:** se satisface el alcance de documentación y trazabilidad estática de TASK-638. Puede pasar a Completada como tarea de inventario/documentación; ello no cierra TASK-636/685/687/688, no corrige defectos de producto y no certifica despliegues ni pruebas runtime/beta.
- Pruebas ejecutadas: lectura estática de callsites, dispatchers, handlers, helpers, hojas/Drive, rutas, wrappers, árbol e inventario; verificación de SHA de los servicios/controladores indicados. No ejecutadas: Node, navegador, HTTP, Apps Script, Drive/Sheets productivos, pruebas multiusuario, integración/E2E y verificación de deployments/Script Properties.
===============================================================================


## C1.302 — Propiedad de símbolos, redefiniciones y ciclos (TASK-639)

### Cobertura
Se inspeccionaron estáticamente los 24 archivos JS y los 6 Code.gs del inventario C1.301. El inventario de dependencias de HTML/script y los dispatchers de C1.301 se reutilizan como evidencia vigente; no se repitió TASK-638.

### Frontend — símbolos compartidos y propietarios
| Símbolo | Propietarios observados | Consumidor/colisión | Resultado |
|---|---|---|---|
| openClassroomManagerModal | js/secretary.js:657; js/teacher.js:2521 | ambos módulos asignan window.*; dashboards con ambos scripts quedan con la última asignación | colisión confirmada |
| openAcademicLoadPlanningModal | js/secretary.js:766; js/teacher.js:2436 | dashboards Secretaría/Dirección | colisión confirmada |
| refreshAcademicPlanningData | js/secretary.js:774; js/teacher.js:2455 | dashboard-secretaria.html:540; dashboard-direccion.html:397 | colisión confirmada |
| openAcademicAnalyticsModal | js/secretary.js:808; js/teacher.js:2279 | consumidor HTML directo no localizado en dashboards muestreados | colisión confirmada; consumidor adicional no verificado |
| GamesAdapter | fallback js/config.js; implementación js/games-adapter.js | index.html carga config antes del adaptador principal | fallback intencional, no hallazgo |

### Backend — redefiniciones globales confirmadas
| Servicio/archivo | Símbolo | Líneas | Consumidor |
|---|---|---:|---|
| TASK | normalizeString | 9, 1209 | handlers TASK |
| TASK | uploadChunk | 795, 1967 | doPost:394 |
| ACCOUNTING | manageTransportRoute | 15699, 16744 | doPost:775 |
| USER | getIdempotencyPayloadSignature | 209, 1299 | checkAndRegisterIdempotencyKey / doPost |
| USER | getNews | 3116, 5574 | doPost:1408 |
| USER | getInstitutionalAnnouncements | 3817, 5684 | doPost:1435 |
| USER | createInstitutionalAnnouncement | 3848, 5784 | doPost:1436 |
| USER | submitAnnouncementReceiptConfirmation | 3873, 5901 | doPost:1437 |
| USER | getAnnouncementReadReport | 3895, 5934 | doPost:1438 |

No se cuentan como colisiones globales parseSafeDate y recordTest, porque las declaraciones detectadas están anidadas en funciones/suites distintas.

### Helpers repetidos entre servicios aislados
Se registran como contratos compartidos con propietario por proyecto: normalizeString, getOrCreateSheet, logStructuredEvent, computeHmacSignature, getAuthTokenSecret, verifySessionToken, validateContextualAccess, validateRolePermission, getDynamicPermissionsForRole, hasActiveDelegationForAction, getIdempotencyPayloadSignature, checkAndRegisterIdempotencyKey, saveIdempotentResult, createInterServiceEnvelope y verifyInterServiceEnvelope. No hay colisión de runtime entre deployments independientes; existe riesgo de deriva contractual. Hallazgo AUD-NG-376 / TASK-693.

### Grafo interservicio y ciclos
- Frontend: js/api.js consume SERVICE_URLS/SERVICE_REGISTRY de js/config.js; los dashboards usan scripts clásicos y dependen del orden de carga.
- Backend: única llamada UrlFetchApp.fetch detectada en USER, delegateToTaskService (línea 7955), hacia TASK. No se encontraron llamadas inversas TASK → USER ni otras llamadas UrlFetchApp.fetch en los otros cinco servicios inspeccionados.
- Grafo estático observado: USER → TASK; no hay ciclo en este grafo. Los ciclos dinámicos/runtime quedan no verificables.

### Dictamen TASK-639
Alcance estático satisfecho; sin cambios de código. Hallazgos AUD-NG-374..376 derivados a TASK-691..693. No se ejecutaron pruebas runtime, navegador, Apps Script, HTTP ni E2E.


## TASK-636 — avance Task-Service C1.306 (PM-01/P0)
- Estado: En ejecución; no Completada.
- Task-Service PUBLIC_ACTIONS vacío; consultas de tareas/actividad derivan profesorId/estudianteId de claims; proyectos propios, aulas por perfil/vínculo, publicaciones/materiales por contexto, preview y deleteFile con propiedad.
- getDriveStorageQuotaMetricsReport limitado a Administrador/Desarrollador.
- closeAcademicYear falla de forma cerrada con BACKUP_REQUIRED; AUD-NG-369 permanece abierto hasta implementar respaldo/restauración real.
- Pendiente: mutaciones de recursos, reconciliar AsignacionesDocentes, archivos no entregados, ACADEMIC público y pruebas por rol.
- Informe principal: Auditoría/AUDITORIA_TASK-636_C1.305.md; checkpoint C1.306 en Checkpoints_Parte_0002.txt.


## TASK-636 — C1.307: mutaciones Task-Service y asignaciones docentes
- Mutaciones de tareas, aulas, posts y materiales ligadas a claims/propietario; docentes deben tener asignación activa por OfertaID en AsignacionesDocentes y correspondencia con AulasVirtuales.
- Se bloquea publicación docente en General; autor/propietario se deriva del actor verificado.
- Evidencia: blob Task-Service 2df5dbdd08cc41fe400ac489d24eaac399418f56; verificaciones estáticas de llaves, claims, propietario y asignaciones.
- No ejecutadas: runtime Apps Script, Sheets/Drive, HTTP, pruebas por rol ni E2E.
- Pendiente: archivos no entregados/sesiones, ACADEMIC PUBLIC_ACTIONS y backup/restore. TASK-636 sigue En ejecución.


## TASK-636 — C1.308: propiedad de archivos y sesiones reanudables
- uploadFile/submitAssignment/saveSubmissionDraft requieren claims, ámbito de tarea y metadatos de propiedad. MetadatosArchivos amplía al final PropietarioUserId y DriveFolderId; no se infiere propiedad histórica.
- Se elimina ANYONE_WITH_LINK. deleteFile valida archivos propios no entregados; deleteSubmission exige profesor propietario o administración.
- Sesiones de carga asociadas a usuario/tarea con SessionKey UUID, controles de propiedad, finalización idempotente y fileId real entregado al frontend.
- Evidencia: Task-Service blob 07a7dc5720274622f17813104c037c7a63dda9c2; js/ui-common.js blob 68e9fe25b96b92735045bf3f699f9437494531d9; js/student.js blob b3bf2fac774d20f5eeb412e42f75452645080811.
- Verificación estática únicamente. Registros históricos sin propietario, runtime y pruebas por rol pendientes. AUD-NG-370 parcial; AUD-NG-369 abierto; cierre académico sigue bloqueado.

## TASK-636 — C1.309: capacidades públicas ACADEMIC y ciclo de vida de archivos
- Academic-Service mantiene públicas solo ping, creación de solicitud y endpoints de seguimiento/borrador que validan capacidad opaca en cada handler.
- PublicAccessTokenHash se añade al final de SolicitudesAdmision; AccessTokenHash al final de BorradoresAdmision. Se deriva un token de 64 hex de dos UUID y se persiste solo SHA-256.
- getPublicAdmissionStatus ya no acepta DNI/ID secuencial y devuelve solicitud, fecha, año, grado y estado; no devuelve nombres ni expediente.
- saveAdmissionDraft/getAdmissionDraft requieren draftAccessToken; emailResponsable es dato de contacto, no credencial. Las filas históricas sin hash no se migran por inferencia.
- createAdmissionRequest siempre adquiere LockService; skipLock del payload no controla el candado. getServiceHealthDiagnostics exige claims Administrador/Desarrollador.
- Task-Service deleteFile comprueba Entregas y EntregasVersiones antes de DriveApp.setTrashed.
- Frontend no solicita ni muestra estado financiero cuando la consulta proviene de una capacidad pública.
- Evidencia: backend/academic-service/Code.gs; backend/task-service/Code.gs; js/student.js.
- TASK-636 En ejecución; AUD-NG-357/AUD-NG-370 parcialmente abiertos; AUD-NG-369 abierto. Runtime/Sheets/Drive/HTTP/navegador/pruebas por rol no ejecutadas.

## TASK-636 — C1.310: integración de capacidades en el formulario de admisión
- admision.html ya no envía draftKey/email como autorización: obtiene, conserva y reutiliza draftAccessToken devuelto por saveAdmissionDraft.
- El envío formal adjunta draftAccessToken para que createAdmissionRequest consuma el borrador correspondiente; tras éxito elimina el token local de borrador.
- La confirmación presenta la credencial privada de seguimiento, permite copiarla y la conserva localmente; el correo de confirmación sigue siendo el canal de recuperación fuera del navegador.
- handleTrackStatus usa getPublicAdmissionStatus con token y solo representa código interno, estado, grado/año y fecha; no representa PII ni estado financiero.
- El endpoint getAdmissionDraft está protegido, pero no se encontró consumidor frontend; el formulario mantiene su recuperación local. No se afirma recuperación cloud UI.
- Estado TASK-636 En ejecución; AUD-NG-357/AUD-NG-370 parcialmente abiertos; AUD-NG-369 abierto. Pruebas de navegador/runtime/HTTP/E2E no ejecutadas.


## TASK-636 — C1.311: AUD-NG-369 y cierre académico fail-closed
- Código histórico de Task-Service (commit 191ad227c481db62b759d544d8782e8f17c29f45; blob 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe): closeAcademicYear borraba globalmente Entregas y enviaba a papelera los activos Drive referenciados; Tareas/ConfiguracionAcademica se filtraban por profesorId cuando se suministraba y se borraban globalmente si faltaba. El backupId era sintético.
- Código actual mantiene guard de claims Administrador/Desarrollador y BACKUP_REQUIRED. C1.311 detecta que ROLE_PERMISSIONS aún incluía Profesor y el botón js/teacher.js llamaba el cierre con profesorId; se retira el permiso y se deshabilita el botón.
- Academic-Service createSystemBackup/verifyBackupIntegrity/restoreSystemBackup no satisface AUD-NG-369: checksum 32-bit con bypass Boolean(checksum), restore sin verificación previa/lock/rollback y clear de hojas completas. No reutilizar.
- Alcance histórico confirmado: Tareas, Entregas, ConfiguracionAcademica, Log_Cierres y activos Drive referenciados por Entregas. No se observó cierre de Examenes/PreguntasExamen/EntregasExamen.
- Cierre sigue fail-closed. Próximo: protocolo dedicado con manifiesto SHA-256, prevalidación, lock, rollback y restauración verificada de hojas y activos Drive; no ejecutar sobre producción.
- Checkpoint C1.311: Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.311; índice Auditoría/INDICE_CHECKPOINTS.md — fila C1.311.


## TASK-636 — C1.312: protocolo dedicado de respaldo/restauración

- backend/task-service/Code.gs incorpora tres acciones administrativas para crear, verificar y restaurar el respaldo académico; el acceso se vuelve a restringir por claims de Administrador/Desarrollador en cada handler.
- Las hojas incluidas son Tareas, Entregas y ConfiguracionAcademica; se capturan además Log_Cierres (solo verificación append-only), EntregasVersiones y MetadatosArchivos cuando existen.
- Los activos Drive se capturan recursivamente desde Entregas/EntregasVersiones, incluyendo hash SHA-256, tamaño, jerarquía y permisos. La restauración remapea IDs cuando debe recrear archivos.
- Prevalidación de manifiesto/activos, LockService, verificación post-restore y rollback compensatorio en memoria. La terminación abrupta aún no tiene recuperación durable.
- closeAcademicYear permanece BACKUP_REQUIRED; no hay ruta de borrado habilitada. Runtime y restauración aislada pendientes.


## TASK-636 — C1.313: recuperación durable de restauraciones interrumpidas

- Task-Service genera un respaldo compensatorio antes de mutar y registra en ScriptProperties el manifiesto de rollback, el manifiesto objetivo y el estado de la operación.
- El handler recoverTaskServiceAcademicYearRestore restaura el estado previo si el runtime se interrumpe; mientras exista un journal pendiente se bloquean nuevas restauraciones.
- Los errores capturados mantienen el journal si la compensación no se completa. El journal se elimina tras finalización o recuperación satisfactoria.
- Implementación estática; falta validar con interrupción forzada y entorno Apps Script/Sheets/Drive aislado. closeAcademicYear continúa BACKUP_REQUIRED.


## TASK-636 — C1.314: confirmación explícita para recuperación

- recoverTaskServiceAcademicYearRestore requiere claims Administrador/Desarrollador y confirmación explícita confirmed=true con código RECOVER-TASK-SERVICE-RESTORE.
- Se evita que una llamada administrativa accidental restaure el respaldo compensatorio sin confirmación adicional.
- Verificación estática; ejecución Node/runtime y pruebas aisladas pendientes. closeAcademicYear continúa BACKUP_REQUIRED.


## TASK-636 — C1.315: lock exclusivo y estado idempotente de restauración
- recoverTaskServiceAcademicYearRestore adquiere ScriptLock antes de leer/escribir el journal; taskServiceRestoreAcademicYearBackup_ admite lockAlreadyHeld para evitar doble adquisición.
- taskServiceCreateRestoreState_, taskServiceReadRestoreState_ y taskServicePersistRestoreState_ mantienen restoreId e idMap en un archivo Drive del respaldo compensatorio.
- taskServiceRestoreMarkerName_ y taskServiceFindRestoreMarker_ localizan copias creadas antes de que el runtime se interrumpa; los activos mapeados se validan por hash/tamaño, padre y nombre antes de reutilizarse.
- Dependencias de plataforma verificadas documentalmente: Drive File.setContent y Folder.getFilesByName/getFoldersByName. Apps Script runtime sigue pendiente.
- Contrato estático ampliado; 42/42 comprobaciones equivalentes pasaron. AUD-NG-369 abierto y closeAcademicYear continúa BACKUP_REQUIRED.


## TASK-636 — C1.316: contrato Node en CI y bloqueo de integración
- Workflow .github/workflows/task-service-backup-restore-contract.yml ejecuta el contrato en push a NG_beta_0.0.0.1_work con permisos contents:read y Node 24.
- Runs 42659818881 y 42659961195: completed/success; el segundo ejecuta Node 24 con actions v7 y elimina la advertencia de deprecación observada en el primer run.
- Dependencia pendiente para certificación: proyecto Apps Script aislado, Spreadsheet de prueba y árbol Drive de prueba con credenciales/deployment autorizados. No existen appsscript.json ni .clasp.json en el repo.
- No se deben ejecutar cierres/restores destructivos sobre datos reales. AUD-NG-369 abierto; closeAcademicYear sigue BACKUP_REQUIRED.


## C1.318 — TASK-068 / correspondencia central de identidades
- HEAD 5adf18921f8dd59e05e7f5af6210c48370273af7; PM-01/P0/orden local 1; requisito pendientes/Dirección/Pendientes.md — TASK-068.
- User-Service findPersonMatches compara identificación/email/nombre; createPerson y linkPersonAccount no conservan IDs legados ni historial de decisiones.
- Accounting-Service importDataWithColumnMapping (15360–15414) solo valida identificador, cuenta filas y registra AuditoriaMigraciones; no persiste entidades ni usa correspondencias.
- Ausentes: hoja CorrespondenciaIdentificadores, resolvers bidireccionales, resolveUserByLegacyId, resolveCrossReferenceIdentifier y pruebas específicas.
- IndexedDB v4 no contiene store de correspondencias; no debe ser fuente de verdad.
- Hallazgos AUD-NG-377/378/379 dentro de TASK-068; no se crean tareas derivadas. Expediente único Auditoría/AUDITORIA_TASK-068_C1.318.md.


## C1.319 — TASK-068: arquitectura implementada parcialmente
- Fuente de verdad: CorrespondenciaIdentificadores en Spreadsheet maestro, 13 columnas; unicidad lógica por sistemaOrigen/tipoEntidad/idOriginalLegado/institucionId.
- HistorialDecisionesIdentidad append-only; altas PENDIENTE_REVISION; solo Secretaría/Administrador con token verificado pueden confirmar/rechazar con motivo.
- User-Service expone registerLegacyIdentifierMapping, resolveInternalIdFromLegacy, resolveLegacyIdFromInternal, resolveUserByLegacyId, reviewLegacyIdentifierMapping y getIdentityDecisionHistory. Resolución solo CONFIRMADA y ámbito IMA_INSTITUTION_ID.
- Accounting-Service resuelve referencias confirmadas; importDataWithColumnMapping se bloquea con DESTINATION_WRITER_NOT_CONFIGURED porque no existe contrato de escritura destino verificado.
- Requiere configurar IMA_INSTITUTION_ID idéntico en ambos Apps Script. IndexedDB no es fuente de verdad. Runtime y pruebas de dos fuentes pendientes.


## TASK-068 — C1.320, cliente de correspondencias
- IndexedDB v5 incorpora identity_mapping_cache; clave compuesta institucional/origen/tipo/ID legado y persistencia exclusiva de mapeos confirmados.
- js/api.js expone wrappers de alta, resoluciones, revisión e historial. El cliente no concede permisos ni convierte la caché en fuente de verdad.
- Pendiente verificar upgrade real, aislamiento y runtime; importación destino continúa bloqueada de forma segura.


## TASK-068 — C1.321, controles de lectura y confirmación
- Resolución/lectura no crea hojas; creación separada para escritura bajo ScriptLock.
- La revisión humana solo confirma persona/usuario cuando existe el ID en hoja y columna canónicas verificadas; tipos no soportados fallan cerrado.
- Motivo de bitácora sanitizado y limitado; hash de origen calculado en backend. Pruebas runtime pendientes.


## TASK-068 — C1.322, destinos permitidos para revisión
- Validadores versionados: Personas.PersonaID, Usuarios.UserId, ExpedientesEstudiantes.ExpedienteID, ResponsablesTutores.ResponsableID, CatalogoAsignaturas.AsignaturaID, Matriculas.MatriculaID y DocumentosEstudiante.DocumentoID.
- Empleado/curso/otros fallan cerrado hasta identificar contratos reales. USER/ACADEMIC comparten SPREADSHEET_ID en código versionado; instancia real no probada.


## TASK-068 — C1.323: límite de integración
- ACCOUNTING no contiene UrlFetchApp.fetch; no se acredita delegación hacia handlers ACADEMIC/USER.
- convertAdmissionToStudent y createStudentEnrollment conservan invariantes de dominio y no satisfacen contrato genérico de importación. registerStudentEnrollment no tiene lock observado y tampoco crea expediente/persona.
- No se habilita writer por inferencia; mantener DESTINATION_WRITER_NOT_CONFIGURED hasta definir contrato explícito por entidad.


## C1.327 — Dependencias de transporte para TASK-068
- `ACCOUNTING.importDataWithColumnMapping` requiere un adaptador de importación autenticado hacia el servicio propietario de cada entidad; no hay transporte saliente implementado en ACCOUNTING (`UrlFetchApp.fetch` ausente).
- Dependencia propuesta aún no habilitada: ACCOUNTING → USER para correspondencia/persona/cuenta; los destinos académicos requieren endpoint y contrato de escritura en ACADEMIC. No se presume que la propiedad esté delegada ni se escriben hojas de otro servicio.
- USER `doPost` actualmente enruta `{action,payload}` con `validateRolePermission`; no consume `verifyInterServiceEnvelope`. Los helpers HMAC no representan por sí solos un endpoint autenticado.
- Configuración requerida fuera de Git: `USER_SERVICE_URL` en ACCOUNTING; secreto aleatorio `IMA_INTERSERVICE_HMAC_SECRET` en Script Properties de los servicios participantes; `IMA_INSTITUTION_ID` en los proyectos aislados; deployments de prueba y Spreadsheet fixtures.
- El fallback de `getAuthTokenSecret` basado en ID de spreadsheet + constante no se acepta como secreto de servicio. Los locks de proyectos independientes no coordinan escrituras concurrentes sobre una hoja compartida.
- Hasta aprobar este contrato, la importación permanece fail-closed y `DESTINATION_WRITER_NOT_CONFIGURED`; AUD-NG-378 abierto. C1.327 documenta dependencia/configuración, no cambia el grafo de dependencias de tareas PM.


## C1.400 — Corrección de clasificación TASK-682 y auditoría de propiedad estudiantil

- TASK-682 existe en el backlog canónico de Otros desde el baseline lógico C1.316: blob 35cbd51f1e0b2f91f18b46c94d38223338d5ccdf, líneas 8891–8902. La fuente vigente es blob 24347c3776521c930391f89e0430910554bf233b, línea 8909.
- Se reclasifica TASK-682 de PM-00 a PM-01/P1; su alcance es identidad, seguridad, roles múltiples y ámbitos independientes. No se crea tarea duplicada; permanece Pendiente.
- El requisito TASK-153 no declara TASK-682 como prerrequisito obligatorio. TASK-153 conserva P0 y estado En ejecución.
- ExpedientesEstudiantes, DocumentosEstudiante, SolicitudesAdmision y Matriculas no declaran DepartamentoID en sus esquemas vigentes. La asignación de ámbitos representa el ámbito del actor, no la propiedad del recurso.
- USER mantiene CatalogoDepartamentos y ACADEMIC DepartamentosAcademicos sin fuente única demostrada. No inferir el propietario desde grado/sección ni desde el rol del actor. Los validadores existentes continúan fallando cerrado cuando no se resuelve el propietario.
- AUD-NG-382: defecto documental de clasificación/exclusión de TASK-682. Checkpoint C1.400.

## C1.401 — Dependencias derivadas y revalidación focalizada F11

### Propiedad departamental
- TASK-153 es prerrequisito de TASK-139 para autorizar la dimensión departamental de los permisos documentales: el rol/ámbito del actor no demuestra quién es propietario del expediente o documento.
- TASK-153 es prerrequisito de TASK-123 para resolver el departamento propietario de cada entidad y destino. CatalogoSpreadsheets existe en USER/ACADEMIC/ACCOUNTING, pero los resolvers observados no utilizan departamento/servicio para establecer propiedad y recurren a fallback; no se acredita un mapeo institucional autoritativo.
- Estas aristas son dependencias derivadas de los requisitos originales y de los esquemas observados. No sustituyen ni reescriben esos requisitos.
- TASK-682 continúa P1; no se incorpora una arista obligatoria TASK-682 → TASK-153.

### F11-TASK01 — confidencialidad de bienestar
- Hallazgo AUD-NG-383: getAttendanceFollowupCases confía en authRole del payload antes de _verifiedRole; la acción está permitida a Secretaría. saveAttendanceFollowupCase y addCaseFollowUpNote no aplican autorización por expediente/ámbito. getGuidanceAppointments entrega notas confidenciales sin comprobar asignación del caso. El reporte consolidado confía en rolSolicitante.
- El rol Docente no aparece actualmente autorizado en ROLE_PERMISSIONS para getAttendanceFollowupCases; no se declara una ruta pública demostrada para Docente.
- No se encontró la hoja RegistrosOrientacion en los Code.gs del backend. CitasOrientacion sí aparece y almacena NotasConfidenciales; CasosSeguimiento almacena acciones/notas en JSON.
- AUD-NG-383 se vincula al F11-TASK01 existente. No se crea una tarea ni un informe duplicado; se agrega una adenda al informe FASE 11 existente.
- La revisión es focalizada y no cierra F11-TASK01. No se modificó código ni se ejecutaron pruebas de producto.


## C1.402 — TASK-153: descomposición PM-01 de propiedad departamental

- Se registra la especificación funcional de propiedad departamental y autorización contextual en PLAN_MAESTRO_IMPLEMENTACION.md §10.77.
- Se crean claves subordinadas de seguimiento T153-S01…T153-S08 (no son IDs globales del backlog): catálogo canónico; roles/responsabilidades/ámbitos; propiedad de recursos estudiantiles; migración histórica; policy por recurso; filtros masivos; delegación/cambio de propietario; pruebas y auditoría.
- Patrones SIS/LMS: PowerSchool (scope y jerarquía), Moodle (roles contextuales), Google Classroom/Workspace (OU y propiedad documental), Califik y Edboox/Edubox (flujos académicos). Patrones ERP/SoD: Holded, QuickBooks, Odoo, Zoho Books, Sage 50, Quipu, Visionwin, GnuCash, ContaSol y Xero. Se limita TASK-153 a seguridad/propiedad de recursos estudiantiles; no se abre implementación financiera.
- T153-S01 es la siguiente unidad. Reconciliar CatalogoDepartamentos y DepartamentosAcademicos antes de asignar propietario o migrar registros. No inferir desde actor, grado, sección, rol o módulo.
- Dependencias derivadas TASK-153 → TASK-139 y TASK-153 → TASK-123 se mantienen. La rama base no se modifica.
- No hay cambios de código, datos ni pruebas de producto en C1.402.


## C1.403 — T153-S01: evidencia de catálogos departamentales

- **USER:** `manageDepartmentPositions` crea `CatalogoDepartamentos` con `deptId/nombre/jefaturaUserId/estado/fechaCreacion`; la escritura admite ID del cliente o ID generado. En los servicios y controladores principales inspeccionados no se encontró consumidor del catálogo. No se observó relación con el modelo académico, FK ni jerarquía.
- **ACADEMIC:** `assignDepartmentHead` crea/actualiza `DepartamentosAcademicos` con `DepartamentoID/Nombre/JefeUserId/Estado/FechaActualizacion/AutorizadoPor`, sin validar el ID contra USER ni comprobar jefatura activa. `getDepartmentAcademicPlanning` devuelve las filas sin filtrar departamentos inactivos. Sus consumidores incluyen teacher.js y secretary.js.
- **ACCOUNTING:** `resolveEmployeeDepartmentId_` consulta DepartamentosAcademicos por ID/nombre y conserva el valor textual como fallback; aplica a ExpedientesLaborales, no a propiedad estudiantil.
- **Ámbitos:** AsignacionesAmbitosRoles almacena valores DEPARTAMENTO sin FK contra un catálogo canónico; el ámbito del actor no define la propiedad del recurso.
- **Propiedad estudiantil:** se mantiene vigente la evidencia C1.400 sobre ausencia de DepartamentoID en ExpedientesEstudiantes, DocumentosEstudiante, SolicitudesAdmision y Matriculas y el fallo cerrado de los helpers. No se reaudita ese alcance ni se relaja.
- **Tareas relacionadas:** AUD-NG-226 / TASK-506 cubren validación referencial, estados y relación explícita/separación de los catálogos. TASK-506 es PM-02/P1 y su ruta canónica es `pendientes/Dirección/Pendientes.md`; no se crea una tarea ni una arista duplicada. FASE2-T04 documenta el déficit general de autoridad de catálogos.
- **Resultado:** no se demuestra fuente institucional aprobada, relación formal ni propietario de recursos estudiantiles. T153-S01 queda bloqueada para migración/escritura hasta recibir decisión institucional verificable. TASK-153 permanece PM-01 / En ejecución; TASK-139 y TASK-123 siguen dependientes de su resolución.
- **Límites:** evidencia estática de código y documentos; sin acceso a filas productivas de Sheets/Drive y sin pruebas nuevas.


## C1.404 — Arquitectura universal multiinstitucional (TASK-694)
- Separar plataforma, tenant, grupo/consorcio, institución, sedes y unidades.
- Separar organización administrativa, estructura académica, enseñanza y ubicaciones.
- Dominios lógicos: Tenant/Institution Registry, Organization/Membership, Identity/Access, Academic Core, Learner Records, Learning/Assessment, Early Years, Student Services, Finance, Integration Hub, Configuration/Policy y Reporting.
- Seguridad: tenant/institución + identidad + membresía/rol/capacidad + ámbito + operación + propietario + clasificación. Actor y propietario son dimensiones separadas; denegar por defecto.
- Configuración por política de clave; límites de seguridad no sobrescribibles. Perfiles EarlyYears/K12/TVET/HigherEducation/AdultLearning combinables.
- CEDS P-20W, Ed-Fi, OneRoster, Edu-API, LTI, CASE, QTI, CLR, Open Badges y Caliper mediante adaptadores.
- Tareas reutilizadas: TASK-153, TASK-060, F26-TASK01, TASK-506, TASK-171, TASK-668, AUD-NG-164, TASK-005, F8-TASK09, FASE2-T04 y F29-TASK17.
- Subplan UNI-S01…UNI-S10; sin implementación en C1.404. TASK-153 conserva bloqueo C1.403.


## TASK-695 — PLAN-IMA-001: dependencias de unidades universales

- TASK-694 → TASK-695; TASK-695 → UNI-U01…UNI-U24 (IDs locales).
- U01 → U02/U03/U04/U05/U06/U13/U16/U23; U02 → U06/U08/U16/U17/U23.
- U03 → U05/U06/U20; U05 → U06/U07/U09/U10/U11/U12/U13/U15/U18/U19/U20/U21/U22/U24.
- U06 → U07/U08/U09/U10/U11/U18/U21/U22; U07 → U08/U10/U11/U21/U22.
- U08 → U09/U10/U11/U19; U09 → U12/U14/U21; U10 ↔ U11 por contrato de entregas/calificaciones; U11 → U21.
- U13 → U04/U09/U12/U14/U19; U14 → U04/U13/U19/U20; U15 → U17/U21; U16 → U08/U17; U17 → U20/U21.
- U18 → U20/U21; U19 → U15/U21; U20 → U22/U24; U22 depende de U01/U05/U06/U10/U11/U15; U23 depende de U01/U02/U06/U07; U24 depende de U01–U23.
- Reutilización: TASK-506/171/668 → U02; AUD-NG-164/TASK-005 → U06/U07; F9-TASK y AUD-NG-165…167 → U11; F10/F11 → U09/U12/U14; biblioteca → U18; F21/TASK-029…036 → U19; F22/F31/F33/F40 → U20; TASK-051/235/285/397/406/408 → U21; FASE2-T04/F25/F29/F35 → U22; TASK-060/F26-TASK01 → U23; F29/TASK-077/275/276 → U24.
- Gate PM-01: TASK-153/T153-S01 bloquea cambios de ownership, ámbitos y migración de expedientes; ningún paquete relaja fail-closed.
- Las aristas son dependencias de planificación, no evidencia de implementación ni autorización para alterar el orden PM.


## C1.406 — UNI-U01: registro y aislamiento runtime de tenants
- TASK-694 → TASK-695 → UNI-U01 (requisito local) → AUD-NG-384 → TASK-696.
- TASK-696 depende de TASK-153/T153-S01 (PM-01, bloqueada por decisión institucional), F29-TASK17 (P0, Pendiente) y F37-TASK10 (P1, Pendiente); TASK-694/TASK-695 son diseño/planificación completados.
- F29-TASK17 cubre migración de roles/relaciones; F37-TASK10 cubre pruebas interdepartamentales con sedes/departamentos. No sustituyen la frontera runtime tenant.
- TASK-696 bloquea la implementación de UNI-U01 y, por dependencia, U02/U03/U04/U05/U06/U13/U16/U23 y los paquetes consumidores señalados en PLAN-IMA-001. No se modifica ownership ni se migran datos mientras TASK-153/T153-S01 siga bloqueada.
- Estado: TASK-696 Bloqueada / no elegible. Evidencia principal: `Auditoría/AUDITORIA_UNI-U01_TENANT_RUNTIME_C1.406.md`.


## C1.408 — PM-00: ciclo de dependencias F29 y continuidad PM-01
- F29-TASK05 (PM-01/P0, `pendientes/Otros/Pendientes.md`) → F29-TASK17, además de AUD-NG-001 y AUD-NG-127.
- F29-TASK17 (PM-01/P0, `pendientes/Dirección/Pendientes.md`) → F29-TASK05 y F29-Task13, además de AUD-NG-001/002/036/105/106/108/128/130/136/158.
- **Ciclo:** F29-TASK05 ↔ F29-TASK17. Los requisitos originales permanecen intactos; no se elimina ninguna arista ni se declara satisfecha una dependencia. Ambas tareas siguen Pendientes/no elegibles hasta resolución formal PM-00.
- TASK-153/T153-S01 permanece Bloqueada por falta de autoridad institucional verificable para CatalogoDepartamentos/DepartamentosAcademicos y propiedad departamental. No inferir, fusionar catálogos ni migrar recursos.
- TASK-696 permanece Bloqueada por TASK-153/T153-S01, F29-TASK17 y F37-TASK10; no adelantar PM-02.
- La selección §6.1 se detiene en esta iteración para resolver el ciclo y el bloqueo externo. No se crea tarea global ni expediente duplicado.


===============================================================================
## C1.414 — Orden topológico de idempotencia (AUD-NG-071 / AUD-NG-069 / AUD-NG-006)

- **Clasificación:** AUD-NG-071 y AUD-NG-069 se asignan a PM-03 (Integración, procesos y eventos), de acuerdo con el alcance PM-03 ya descrito en el Plan Maestro. AUD-NG-006 permanece en PM-08 como requisito transversal de calidad/resiliencia.
- **AUD-NG-071:** reserva atómica server-side. El código actual en `backend/user-service/Code.gs` contiene `checkAndRegisterIdempotencyKey` y `saveIdempotentResult`, pero la consulta/registro observado usa `CacheService`; no hay reserva atómica bajo `LockService` antes de ejecutar la operación. Requisito sigue Pendiente.
- **AUD-NG-069:** generación y propagación de clave por solicitud lógica en `fetchApi`, con reintentos seguros. El código actual `js/api.js` no crea ni propaga clave de idempotencia y reintenta errores de red hasta dos veces. Requisito sigue Pendiente.
- **Arista nueva:** AUD-NG-071 → AUD-NG-069. La reserva atómica del servidor debe existir antes de permitir reintentos automáticos de mutaciones desde el cliente; evita la carrera en la que dos solicitudes con la misma clave ejecutan la escritura antes de persistir el resultado.
- **Relación con AUD-NG-006:** AUD-NG-006 conserva el alcance amplio de idempotencia por operación y se verifica una vez que las dos piezas anteriores estén integradas. La implementación de la reserva y la propagación no se repetirá como trabajo separado dentro de AUD-NG-006.
- **Límites:** no se eliminan requisitos originales ni se cambian estados; no se crea una auditoría duplicada; no se modificó código ni se ejecutaron pruebas de producto.
- **Fuentes vigentes:** `js/api.js` SHA `c54d23ad1fc84add9e204a0233d824a2bfcc8ed3`; `backend/user-service/Code.gs` SHA `85d12dad06826fdc37660f47d92e6976ff28bfe7`; backlog Otros blob SHA `24347c3776521c930391f89e0430910554bf233b`; auditoría previa reutilizada: AUD-NG-006 en el propio backlog.
===============================================================================


===============================================================================
## C1.415 — Clasificación de TASK-641 / AUD-NG-285

- TASK-641 se reclasifica de PM-00 provisional a PM-08 (Pruebas integrales, resiliencia y observabilidad); su alcance es el precache y ciclo de vida del Service Worker.
- Se reutiliza el expediente principal `Auditoría/AUDITORIA_COMPLETADAS_F8-TASK03.md`, sección 4, AUD-NG-285. No se crea una auditoría duplicada.
- Vigencia verificada por igualdad de SHA: `sw.js` = `b031e9d0fdee0686f9bda54ba13b751122de827b`; `css/style.css` = `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`; `manifest.json` = `0caa5febfbd7fdbb88e9d174fa6623fb7daebb4e`. El Service Worker continúa solicitando `./css/styles.css`, no existente en el árbol; el archivo disponible es `css/style.css`.
- TASK-641 permanece Pendiente. No se cambió código ni se ejecutaron pruebas de navegador, instalación, activación u offline.
===============================================================================


===============================================================================
## C1.416 — Clasificación y precedencia de AUD-NG-007

- AUD-NG-007 se reclasifica de PM-00 provisional a PM-03 (Integración, procesos y eventos).
- La fase se determina por su rol como capacidad transversal de timeout/abort en `fetchApi`, no como una prueba final PM-08.
- **Dependencia de planificación existente:** TASK-429 (PM-05) consume AUD-NG-007; por tanto, AUD-NG-007 debe quedar antes de TASK-429 para respetar la secuencia PM.
- Evidencia actual: `js/api.js` SHA `c54d23ad1fc84add9e204a0233d824a2bfcc8ed3`. El parámetro `options.timeout` no se aplica; el timer se fija en 60000 ms y el `catch` no lo limpia antes de reintentar.
- Estado AUD-NG-007: Pendiente. Sin cambios de código, sin pruebas ejecutadas y sin auditoría duplicada.
===============================================================================

===============================================================================
## C1.417 — Resolución AUD-NG-096: estado histórico de TASK-050
- AUD-NG-096 se cierra como tarea documental PM-00; TASK-050 no cambia de estado.
- Commit histórico `40c9e15f85224f716d0ddfa597b72e1142ed0191`, blob Dirección `bd6b1e573e3eda36e34af2a8c83f0483673026a0`: encabezado TASK-050 `[X]`, estado interno `[ ] Pendiente`.
- HEAD previo `b055ecf685ad7a6a2d18bd11323767dd772bbe76`, blob Dirección `0f82e33a8c62a4bb31b9b1280d10d0838f213c94`: encabezado `[ ]`, estado `[ ] Pendiente`; ocho criterios permanecen sin marcar.
- Se añade nota aditiva al bloque TASK-050; preservado el histórico. AUD-NG-091…096 siguen vinculadas. Solo AUD-NG-096 se marca Completada.
- Sin cambios funcionales ni auditoría duplicada.
===============================================================================

===============================================================================
## C1.418 — Reconciliación de TASK-637 / inventario integral
- Tree de partida HEAD `9ad4b2ed33ea07fa0f63e5fe90f1d01cee8d9be1`, no truncado, 1.051 blobs.
- Inventario C1.299: 1024 filas parseables; 27 rutas omitidas; 31 rutas con tamaño/SHA obsoletos.
- Inventario C1.418: 1.051 rutas únicas; 0 omitidas; 0 extras; 0 discrepancias de SHA/tamaño en los 1.050 archivos externos al inventario; SELF con tamaño UTF-8 exacto.
- `index.html` conserva SHA `cd742047cdc4948259dd721119429b04f78330ca`. Resumen funcional por área recalculado.
- TASK-637 queda Completada; los snapshots C1.299 se conservan como historial. No se modificó código, rutas fuente ni datos productivos.
===============================================================================

===============================================================================
## C1.419 — Triage PM-00 y orden topológico

- TASK-279 → PM-03; dependencia de autorización: AUD-NG-128 PM-01; no iniciar TASK-279 hasta verificarla.
- TASK-680 → PM-04; depende de F8-TASK19/20 PM-02 y F8-TASK22 PM-04. Espacios/roles configurables por institución; no se requiere organigrama/documentación institucional para motor genérico y pruebas sintéticas (§10.83).
- TASK-681 permanece PM-03 con F8-TASK21 PM-02 y F8-TASK23 PM-01.
- TAREA-10/13 son agregados: AUD-NG-165 PM-01 y AUD-NG-168 PM-05 tienen clasificación propia.
- Veintidós IDs solo contienen encabezados, sin objetivo/dependencias/criterios; excluidos de cola ejecutable conforme §6.1, no completados.
- PM-00 queda sin trabajo ejecutable; PM-01 habilitada.
===============================================================================

===============================================================================
## C1.420 — AUD-NG-128: bypass de tickets y reglas de automatización

- Fuente actual backend/user-service/Code.gs blob 85d12dad06826fdc37660f47d92e6976ff28bfe7.
- validateRolePermission autorizaba incondicionalmente submitProblemTicket/getProblemTickets/replyProblemTicket/configureAutomationRules. Los handlers de tickets ya usan _verifiedUserId y filtran propiedad; configure/getAutomationRules ya tenían guardias internas de roles. Se precisa el hallazgo sin afirmar que esos controles internos faltaban.
- Política explícita: cuenta activa autenticada crea/lee/responde sus propios tickets; atención de tickets ajenos y reglas de automatización solo para Administrador/Desarrollador/Director.
- Se centraliza TICKET_ADMIN_ROLES_; se retiran las acciones del bypass incondicional. Otros bypasses no incluidos en AUD-NG-128 quedan fuera de alcance.
- Prueba contractual añadida en tests/security/problem-ticket-authorization.test.js. Pendiente ejecución/CI y Code Review.
===============================================================================
===============================================================================
## C1.421 — Cierre AUD-NG-128

- La política de autorización central se valida: cuenta activa con sesión verificada puede gestionar sus propios tickets; identidad de autor/lector/respondedor procede de claims; ticket ajeno requiere rol administrativo; reglas de automatización solo Administrador/Desarrollador/Director.
- Pruebas dinámicas con hojas simuladas: listado propio, ocultación de nota interna, acceso administrativo, rechazo de respuesta cruzada sin escritura, respuesta del titular, respuesta administrativa y submit con userId falsificado conservando el ID verificado.
- Pruebas de autorización central: sesión ausente/inactiva denegada; rol estudiante/docente no puede leer/configurar reglas; Director sí.
- Sintaxis de Code.gs y test aprobada. El test contractual ejecutado en entorno JS aislado con shim compatible; no se reportaron checks CI.
- AUD-NG-128 Completada en el alcance local/contractual; no se certifica Apps Script desplegado ni datos productivos.
===============================================================================
===============================================================================
## C1.422 — AUD-NG-001: transporte de identidad desde sesión persistida

- Se verificó que js/auth.js ya conserva result.data.sessionToken/result.sessionToken en currentUser.
- Brecha vigente en js/api.js: el token persistido solo se inyectaba si el payload no incluía sessionToken/authToken/token; requesterUserId/requesterRole también podían ser aportados por el consumidor.
- Se corrige para que, en acciones protegidas, el token y requester* procedan de currentUser y se eliminen credenciales alternativas; sin sesión local se eliminan todos esos campos.
- loginUser/registerUser/requestPasswordRecovery/resetPassword quedan excluidas para preservar el flujo de autenticación y el token de recuperación.
- Se añade prueba dinámica de prioridad de sesión, eliminación de suplantación, no mutación del payload y preservación del token de recuperación.
- AUD-NG-001 permanece En ejecución hasta prueba/revisión.
===============================================================================
===============================================================================
## C1.423 — Cierre AUD-NG-001

- login persiste el token firmado; fetchApi siempre reemplaza las credenciales de payload por la sesión persistida en acciones no-bootstrap, y elimina credenciales/requester* si no hay sesión local.
- requesterUserId/requesterRole se derivan de currentUser; el payload original no se muta.
- resetPassword conserva el token de recuperación y no recibe la sesión anterior.
- Test dinámico: token persistido prevalece sobre sessionToken/authToken/token falsos; requester* falsificados reemplazados; sin sesión se eliminan credenciales; resetPassword conserva capability.
- Flujo doPost USER probado con getUserVerifiedRole/validateRolePermission reales y verifySessionToken simulado: operación protegida con token válido deriva U-REAL; sin token o token inválido devuelve AUTH_PERMISSION_DENIED.
- Cinco servicios backend inspeccionados: verificación de token firmado y respuesta AUTH_PERMISSION_DENIED ante autorización fallida.
- Todas las aserciones pasaron en entorno JS aislado con shim compatible. GitHub no reportó checks CI; no se ejecutó Apps Script productivo. AUD-NG-001 Completada en alcance local/contractual.
===============================================================================
===============================================================================
## C1.424 — Cierre AUD-NG-003: expiración de sesiones

- Revalidación de verifySessionToken en USER, ACADEMIC, ACCOUNTING, TASK y EXAM.
- Los cinco servicios exigen iat/exp como enteros seguros, exp > iat, expiración futura, lifetime <= 86400 segundos, tolerancia acotada de iat futuro y claims userId/role/sessionId completos.
- USER genera iat/exp numéricos con lifetime exacto de 86400 segundos.
- Prueba tests/security/session-token-expiry.test.js: diez escenarios por servicio (50) más generación; todas las aserciones pasaron en entorno JS aislado con shim compatible.
- Firma HMAC y datos de usuario simulados; sin Apps Script productivo ni checks CI reportados. AUD-NG-003 Completada en alcance local/contractual.
===============================================================================
===============================================================================
## C1.425 — Reparación de integridad documental

- Se detectó que el commit C1.424 desplazó contenido entre pendientes/Otros/Pendientes.md, Plan Maestro, MapaDependencias, changueslogs y Checkpoints.
- Los blobs autoritativos se restauraron desde el padre C1.423: backlog 86565f2af67bc55f74637cadc300797c8f9d6366; Plan Maestro 0ad235951fec2ddb14f83a153ba5c7fc89f0a483; Mapa b3d2e732728d81a1fca378040644da145fbad21e; changueslogs eb0fba4bf7c57c9d9dc962fa5f933e343b9f0299; checkpoint 915534b05136b30549301e3ba55754694e92c5de; índice e1e641700e677defe9421e460cc7fb3f5f163de6.
- Se reaplicó C1.424 en las rutas correctas: AUD-NG-003 cerrada, prueba de expiración añadida, mapa/log/checkpoint/índice actualizados.
- C1.425 es el registro correctivo autoritativo; no se modificó código ni la rama base.
===============================================================================
===============================================================================
## C1.426 — Cierre AUD-NG-004: secreto HMAC y rotación

- USER/ACADEMIC/ACCOUNTING/TASK/EXAM obtienen AUTH_TOKEN_SECRET de Script Properties; longitud mínima 32; error de lectura o propiedad ausente/corta produce fallo cerrado.
- No existe derivación desde SPREADSHEET_ID en getAuthTokenSecret.
- Test hmac-secret-config.test.js: configuración válida, ausente, corta, error de propiedades, aceptación clave activa, rechazo de firma antigua después de rotar y aceptación de firma nueva en cinco servicios; generación USER cambia firma.
- Runbook Auditoría/PROTOCOLO_ROTACION_AUTH_TOKEN_SECRET.md documenta generación CSPRNG, Script Properties por servicio, rotación coordinada e invalidación de sesiones/envelopes.
- Pruebas ejecutadas en entorno JS aislado con shim compatible; HMAC/Script Properties simulados. No se verificaron valores productivos ni checks CI.
- AUD-NG-004 Completada en alcance de código/documentación/pruebas locales.
===============================================================================
===============================================================================
## C1.427 — TASK-153: motor genérico de propiedad departamental

- T153-S01 se limita a datos institucionales reales; no bloquea el motor genérico.
- USER incorpora ResourceOwnership, registerResourceOwnership protegido por permiso dinámico MatrizPermisosRoles y assertRecordOwnership fail-closed.
- InstitutionID se deriva del contexto verificado, no del payload. DepartmentID se valida contra ámbitos activos; institutionWide solo aplica dentro de la misma institución.
- No se codifican nombres de departamentos ni cargos.
- Pruebas sintéticas cubren ámbito propio, acceso institucional global, aislamiento entre instituciones, payload spoof, permiso dinámico, registro fuera de ámbito, propiedad ausente y duplicada.
- TASK-153 sigue En ejecución: falta integración transversal y referencias compartidas interdepartamentales.
===============================================================================


## Seguimiento TASK-153 — C1.428
- PM-01 / P0 continúa en ejecución. El registro USER `ResourceOwnership` se consume ahora desde ACADEMIC y ACCOUNTING para expedientes estudiantiles, documentos/solicitudes vinculadas, expedientes laborales y comprobantes de pago.
- Los endpoints preservan autoservicio autenticado de estudiante/tutor/empleado; el acceso de personal, incluido alcance institucional global, exige propiedad activa única y DepartmentID no vacío.
- La restauración de versiones académicas queda protegida por identidad, propiedad del documento y correspondencia documento-versión.
- No se añade dependencia nueva ni se altera la posición de TASK-153. T153-S01 no bloquea el motor genérico.
- Siguiente tramo de implementación: `backend/task-service/Code.gs` y `backend/exam-service/Code.gs`, con sus contratos de seguridad; después auditar DEVELOPER y los recursos institucionales/solicitudes de firma. Reutilizar AUD-NG-002 y los informes existentes, sin duplicar hallazgos.
- Referencias compartidas, operación granular, normalización de errores/listados, importaciones y E2E permanecen pendientes.
