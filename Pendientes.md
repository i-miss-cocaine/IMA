

---

## TAREAS DERIVADAS DE AUDITORÍA — TASK-038 A TASK-042 / FASE 22 (2026-11-04)

### [AUD-NG-055] Completar la validación binaria y estructural de todos los formatos autorizados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-055 (TASK-038 / F22-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs; componente compartido de validación de archivos
- **Dependencias Expuestas:** validateFileBinaryIntegrity, Magic Bytes, MIME, PDF, JPEG, PNG, WEBP, ZIP/OOXML, uploadPaymentVoucher y submitInstitutionalFormRequest.
- **Descripción del Alcance:** Reforzar la detección de formato con firmas completas y reglas de correspondencia entre extensión, MIME y bytes reales. Exigir %PDF- completo; validar la estructura interna PDF/imagen y comprobar la integridad de paquetes DOCX/XLSX (ZIP y partes OpenXML requeridas), rechazando ZIP genérico, cabeceras truncadas, contenido desconocido y formatos incompatibles. No devolver valid:true para detectedFormat unknown. Mantener límites configurables y mensajes de rechazo específicos.
- **Criterios de Aceptación:** Un PDF sin el quinto byte esperado se rechaza; un archivo con cabecera parcial o contenido truncado se rechaza; un ZIP genérico no se acepta como DOCX/XLSX; WEBP/DOCX/XLSX deben coincidir con extensión y estructura; MIME falso no cambia la detección; los formatos no autorizados y desconocidos son rechazados.
- **Estado:** [ ] Pendiente

### [AUD-NG-056] Unificar la política de validación de adjuntos entre microservicios
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-056 (TASK-038 / F22-Task01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs; arquitectura de servicios compartidos
- **Dependencias Expuestas:** validateFileBinaryIntegrity, uploadPaymentVoucher, submitInstitutionalFormRequest y política institucional de adjuntos.
- **Descripción del Alcance:** Definir un componente o contrato compartido de validación para todos los servicios que reciben archivos, evitando copias independientes. Asegurar que límites, extensiones, firmas, estructura, mensajes y versiones de política sean iguales y trazables en cada integración.
- **Criterios de Aceptación:** Los servicios consumen la misma política/versionado de validación; una batería común de archivos válidos e inválidos produce resultados idénticos; ningún endpoint conserva una implementación divergente o bypass no documentado.
- **Estado:** [ ] Pendiente

### [AUD-NG-057] Impedir adjuntos no validados y evitar respuestas exitosas tras fallos de Drive
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-057 (TASK-038 / F22-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs
- **Dependencias Expuestas:** uploadPaymentVoucher, submitInstitutionalFormRequest, DriveApp, ComprobantesPago y SolicitudesTramites.
- **Descripción del Alcance:** Validar obligatoriamente todo archivo recibido, tanto Base64 como referencias externas, recuperando el contenido desde una fuente confiable antes de asociarlo al expediente. Rechazar cargas parciales (datos sin nombre o nombre sin datos), URL/ID no verificadas y fallos de almacenamiento. Diseñar persistencia consistente para que el registro no se confirme si el archivo no existe y es accesible; si una etapa posterior falla, limpiar o registrar de forma recuperable el archivo huérfano.
- **Criterios de Aceptación:** No se registra un comprobante/solicitud con adjunto inválido o no persistido; cada respuesta success contiene una referencia verificada; un fallo de Drive devuelve error y no crea un registro incompleto; los archivos huérfanos se evitan o quedan en cola de recuperación auditable.
- **Estado:** [ ] Pendiente

### [AUD-NG-058] Restringir los adjuntos institucionales a acceso privado autorizado
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-058 (TASK-038 / F22-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs; políticas de Google Drive y servicio de entrega de archivos
- **Dependencias Expuestas:** DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW, ComprobantesPago, SolicitudesTramites y RBAC/ABAC.
- **Descripción del Alcance:** Sustituir la compartición pública por enlace por almacenamiento privado y entrega mediada por un endpoint que verifique sesión, rol, vínculo con expediente y autorización contextual antes de emitir o servir el archivo. Revisar también los enlaces existentes conforme a una política de migración aprobada, sin eliminar evidencia histórica.
- **Criterios de Aceptación:** Un usuario no autenticado o sin relación autorizada no puede abrir el archivo; los permisos se comprueban en cada descarga; no se generan nuevos enlaces ANYONE_WITH_LINK; se conserva trazabilidad de acceso y migración.
- **Estado:** [ ] Pendiente

### [AUD-NG-059] Calcular y verificar el hash SHA-256 sobre el PDF definitivo almacenado
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-059 (TASK-039 / F22-Task02)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs; Google Drive; DocumentosEscolaresEmitidos
- **Dependencias Expuestas:** generateSchoolDocument, verifySchoolDocumentByCUV, computeDocumentSHA256, DriveApp y DocumentosEscolaresEmitidos.
- **Descripción del Alcance:** Generar el archivo PDF definitivo y recuperar sus bytes reales antes de calcular SHA-256. Persistir ID de archivo, versión y hash vinculados; al verificar por CUV, recuperar el archivo y recalcular su huella actual. Si el documento cambia, marcar discrepancia y exigir nueva versión/firma; no presentar una cadena de metadatos como hash del archivo.
- **Criterios de Aceptación:** El hash guardado coincide con los bytes descargados del PDF; modificar un byte hace fallar la verificación; la URL/ID apunta a un archivo real; cada versión conserva su hash independiente y las firmas no se heredan.
- **Estado:** [ ] Pendiente

### [AUD-NG-060] Vincular cada firma a identidad verificada, documento existente y versión inmutable
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-060 (TASK-039 / F22-Task02)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/accounting-service/Code.gs; FirmasConformidades; DocumentosEscolaresEmitidos
- **Dependencias Expuestas:** registerDocumentSignature, validateRolePermission, _verifiedUserId, documentoHash, signatureHash y control de versiones.
- **Descripción del Alcance:** Derivar al firmante de la sesión autenticada, no de identificadores arbitrarios del cliente; recuperar el documento y versión vigentes en servidor; recalcular/verificar su hash antes de aceptar la firma; persistir la versión exacta, método de autenticación y transacción. Impedir firmas sobre documentos inexistentes, hashes suministrados sin verificación y duplicados por reintentos.
- **Criterios de Aceptación:** La firma queda vinculada a un documento/versión existente y hash recalculado; cambiar el documento invalida el intento; identidad e IP provienen de contexto confiable; la repetición de la misma operación no crea firmas duplicadas; una versión nueva exige nueva firma.
- **Estado:** [ ] Pendiente

### [AUD-NG-061] Persistir y emitir certificados probatorios solo para procesos de firma completados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-061 (TASK-040 / F22-Task03)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/accounting-service/Code.gs; FirmasConformidades; DocumentosEscolaresEmitidos; Google Drive
- **Dependencias Expuestas:** generateSignatureAuditCertificate, registerDocumentSignature, checkAdvancedSignatureStatus y verifySchoolDocumentByCUV.
- **Descripción del Alcance:** Definir estados terminales y transiciones válidas; generar automáticamente el certificado al completar todas las firmas requeridas; persistirlo como artefacto independiente y vincularlo al documento/versión y expediente. Incluir solo firmantes y eventos confirmados, ordenar por timestamp/orden de flujo, incorporar CUV y hash real del PDF, y conservar hash del certificado para verificación posterior. No etiquetar Pendiente, Cancelada, Rechazada o Expirada como completada.
- **Criterios de Aceptación:** Solo una transacción efectivamente completada genera certificado; el archivo persiste y puede recuperarse; su hash se verifica; estados cancelados/rechazados/vencidos no aparecen como completados; la pista coincide con el historial real y conserva el orden de firma.
- **Estado:** [ ] Pendiente

### [AUD-NG-062] Implementar comunicación real y verificación criptográfica de proveedores PSC
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-062 (TASK-041 / F22-Task04)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; integración PSC; TransaccionesFirmaAvanzada; ConfiguracionFirmaAvanzada
- **Dependencias Expuestas:** createAdvancedSignatureRequest, checkAdvancedSignatureStatus, UrlFetchApp, HMAC/firma del proveedor, certificados X.509 y sellado de tiempo.
- **Descripción del Alcance:** Implementar adaptadores reales por proveedor para crear, consultar y recuperar transacciones/documentos. Autenticar callbacks o respuestas mediante el mecanismo oficial del PSC; validar emisor, firma, cadena de certificados, vigencia, revocación, sellado de tiempo y hash del documento. Rechazar cualquier cambio de estado originado por datos de cliente no autenticados y aplicar idempotencia/transiciones terminales.
- **Criterios de Aceptación:** No se crea una transacción como enviada sin confirmación del proveedor; un callback manipulado es rechazado; una firma solo se marca completada tras validar evidencia del PSC y hash coincidente; reintentos no duplican operaciones; se conservan respuestas/certificados verificables.
- **Estado:** [ ] Pendiente

### [AUD-NG-063] Proteger secretos y credenciales de proveedores de firma
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-063 (TASK-041 / F22-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/user-service/Code.gs; ConfiguracionFirmaAvanzada; almacenamiento seguro de configuración
- **Dependencias Expuestas:** configureAdvancedSignatureProvider, getAdvancedSignatureProviderConfig, apiKey y permisos de acceso a hojas.
- **Descripción del Alcance:** Retirar credenciales en texto claro de hojas accesibles a operadores; almacenar secretos en un gestor de secretos o propiedades restringidas, con cifrado/rotación según capacidades del entorno. Exponer únicamente metadatos no sensibles y estado de configuración; registrar quién rota o revoca credenciales sin revelar el valor.
- **Criterios de Aceptación:** Ninguna consulta ordinaria devuelve ni permite leer el secreto; las hojas operativas no contienen API keys en claro; las credenciales pueden rotarse/revocarse; los logs no registran valores secretos.
- **Estado:** [ ] Pendiente

### [AUD-NG-064] Sustituir pruebas superficiales de Fase 22 por pruebas funcionales verificables
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-064 (TASK-042 / F22-Task13)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/developer-service/Code.gs; tests/regression/academic-grading-suite.js; tests/regression/
- **Dependencias Expuestas:** PT22-01 a PT22-12, PT22-DEV-01 a PT22-DEV-03, generateSchoolDocument, validateFileBinaryIntegrity, registerDocumentSignature, generateSignatureAuditCertificate y checkAdvancedSignatureStatus.
- **Descripción del Alcance:** Implementar pruebas que invoquen operaciones reales en entorno aislado y verifiquen bytes, archivos, persistencia, estados, permisos, hashes, certificados y respuestas PSC. Reemplazar casos que solo calculan un hash local o verifican la longitud/cadena por aserciones sobre resultados y datos persistidos. Eliminar resultados hardcodeados pass:true y validaciones de presencia como sustituto de pruebas.
- **Criterios de Aceptación:** Cada criterio de TASK-038 a TASK-041 tiene al menos una prueba funcional reproducible; se prueban archivos falsificados/corruptos, cambios de bytes, duplicados, estados no terminales, callback falsificado y permisos; los casos fallidos producen FAIL; no hay expected/actual constantes que se aprueben sin ejecutar la comprobación.
- **Estado:** [ ] Pendiente

### [AUD-NG-065] Aislar los datos de prueba y corregir la referencia de plantilla de PT22-02
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-065 (TASK-042 / F22-Task13)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; tests/regression/academic-grading-suite.js; entorno de pruebas de Google Sheets/Drive
- **Dependencias Expuestas:** runPhase22DocumentManagementAndSACERegressionSuite, configureSchoolDocumentTemplate, generateSchoolDocument, PlantillasEscolares y DocumentosEscolaresEmitidos.
- **Descripción del Alcance:** Crear un entorno de prueba desechable o dobles de persistencia; generar IDs de plantilla una sola vez y reutilizar exactamente el mismo ID en los casos dependientes; limpiar los artefactos de prueba al finalizar sin tocar datos institucionales. Separar las pruebas de integración de cualquier Spreadsheet configurado para producción.
- **Criterios de Aceptación:** PT22-02 usa el ID creado por PT22-01; ejecutar la suite repetidamente produce resultados deterministas; las hojas y Drive institucionales no reciben registros de prueba; los fallos limpian o aíslan los artefactos; se conserva evidencia de entorno y resultados.
- **Estado:** [ ] Pendiente

---
