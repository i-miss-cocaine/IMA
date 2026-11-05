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
- `js/api.js` incorpora `sessionToken` en las peticiones a los microservicios.
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
