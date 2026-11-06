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
