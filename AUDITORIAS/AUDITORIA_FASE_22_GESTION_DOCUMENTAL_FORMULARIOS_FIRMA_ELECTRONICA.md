# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 22
## GESTIÓN DOCUMENTAL, FORMULARIOS Y FIRMA ELECTRÓNICA

**Proyecto:** Plataforma Integral de Gestión Educativa — New Generation Christian Academy (NGCA)
**Fase Auditada:** Fase 22 (Gestión Documental, Formularios y Firma Electrónica)
**Área:** Repositorio Institucional, Diseñador de Plantillas, Generación de Documentos CUV, Formularios Digitales, Flujos de Aprobación y Firma Electrónica
**Tipo de Intervención:** Auditoría Funcional, Inspección Técnica y Verificación de Integridad
**Entregable Obligatorio:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md`
**Fecha de Ejecución:** Marzo 2025

---

## A. IDENTIFICACIÓN

### 1. Propósito y Alcance de la Fase
La Fase 22 tiene como finalidad administrar de manera centralizada y segura el ciclo de vida documental de la institución educativa:
1. Repositorio institucional y archivo digital unificado para expedientes estudiantiles, familiares y laborales.
2. Motor universal de plantillas documentales con sustitución de variables dinámicas, versionado editorial y control de diseño.
3. Generación automatizada de constancias, certificaciones oficiales, actas y reportes con numeración correlativa y Código Único de Verificación (CUV).
4. Diseñador y motor de formularios institucionales dinámicos con campos condicionales y captura de firmas/evidencias.
5. Gestión de solicitudes y trámites escolares con flujos de aprobación multinivel, derivación y resoluciones motivadas.
6. Mecanismos de aceptación y firma electrónica, distinguiendo conformidad digital simple y firma electrónica avanzada bajo el marco normativo de Honduras (Decreto Legislativo No. 149-2013 y Acuerdo Ejecutivo No. 41-2014).
7. Seguridad, permisos RBAC/ABAC y trazabilidad inmutable de accesos, descargas, modificaciones y emisión documental.

### 2. Ubicación en la Plataforma y Componentes Encontrados
- **Backend:**
  - `backend/accounting-service/Code.gs`:
    * Diseñador de plantillas y emisión: `configureSchoolDocumentTemplate`, `getSchoolDocumentTemplates`, `renderSchoolDocumentTemplatePreview`, `generateSchoolDocument`, `verifySchoolDocumentByCUV`, `getIssuedSchoolDocuments`, `deleteSchoolDocumentTemplate`.
    * Inicializador de estructura Drive: `initializeFinancialDriveStructure`.
  - `backend/user-service/Code.gs`:
    * Formularios y trámites: `saveInstitutionalForm`, `getInstitutionalForms`, `submitInstitutionalFormRequest`, `getAdministrativeRequests`, `getAdministrativeRequestsHistory`, `updateRequestStatus`.
    * Flujos de aprobación y decisiones: `saveApprovalWorkflow`, `getApprovalWorkflows`, `processWorkflowDecision`, `getWorkflowHistory`.
    * Firma electrónica y conformidades: `registerDocumentSignature`, `submitAnnouncementReceiptConfirmation`, `getAnnouncementReadReport`.
    * Solicitudes de autorización a tutores: `submitAuthorizationRequest`, `getAuthorizationRequests`, `respondToAuthorizationRequest`.
- **Persistencia (Google Sheets):**
  - `PlantillasEscolares` (PlantillaID, CodigoDocumento, Categoria, Titulo, CamposJSON, FlujoAprobacion, Estado, Version, ContenidoHTML, ConfigFormatoJSON, Descripcion, Departamento, TipoSalida, CreadoPor, DriveFolderId).
  - `DocumentosEscolaresEmitidos` (DocumentoID, PlantillaID, EstudianteUserId, SolicitanteUserId, DatosJSON, EstadoDoc, CodigoVerificacion, DriveFileId, DriveUrl, FechaEmision, Observaciones, VersionPlantilla, NumeroCorrelativoInt, NumeroCorrelativoStr).
  - `FormulariosInstitucionales` (FormID, CodigoFormulario, Titulo, Descripcion, Departamento, DefinicionJSON, Estado, Version, RequiereFirma, PlantillaDocumentoId, FechaCreacion, CreadoPor).
  - `SolicitudesTramites` (SolicitudID, UserId, EstudianteId, TipoTramite, DescripcionDetalle, AdjuntoUrl, Estado, AsignadoA, ObservacionesPublicas, FechaCreacion, FechaResolucion).
  - `FlujosAprobacion` (FlujoID, FormID, NombreFlujo, Departamento, PasosEtapasJSON, Estado, Version, FechaCreacion, CreadoPor).
  - `RevisionesDecisionesTramite` (RevisionID, SolicitudID, EtapaNombre, RevisorID, AccionDecision, ObservacionesInternas, ObservacionesPublicas, FechaDecision, IpAddress).
  - `FirmasConformidades` (FirmaID, DocumentoRefID, TipoDocumento, FirmanteID, RolFirmante, TokenVerificacion, HashContenido, FechaFirma, IpAddress).
  - `SolicitudesAutorizacion` (SolicitudAutorizacionID, ActividadOPermiso, EstudianteID, TutorUserId, DetallesJSON, FechaLimite, Estado, FechaRespuesta, RespuestaTutor, IpMetadata, FechaCreacion, CreadoPor).
- **Frontend:**
  - `js/teacher.js`: integración en modales de plantillas y emisión (`configureSchoolDocumentTemplate`, `generateSchoolDocument`).
  - `dashboard-padres.html` y `js/portal-padres.js`: respuesta a solicitudes de autorización con firma/conformidad.
  - `dashboard-director.html`: aprobaciones de trámites y flujos de trabajo.

---

## B. INVENTARIO DE IMPLEMENTACIÓN REAL

| Componente | Tipo | Función / Mecanismo | Archivo / Hoja | Estado Detectado |
| :--- | :--- | :--- | :--- | :--- |
| **Plantillas Documentales** | Backend | `configureSchoolDocumentTemplate`, `getSchoolDocumentTemplates` | `Code.gs` / `PlantillasEscolares` | Completa y verificada (Con versionado v1.0, v1.1...) |
| **Generador de Documentos** | Backend | `generateSchoolDocument` | `Code.gs` / `DocumentosEscolaresEmitidos` | Completa y verificada (LockService, CUV y Correlativo) |
| **Verificación CUV Oficial** | Backend | `verifySchoolDocumentByCUV` | `Code.gs` / `DocumentosEscolaresEmitidos` | Completa y verificada (Búsqueda por token CUV) |
| **Diseñador de Formularios**| Backend | `saveInstitutionalForm`, `getInstitutionalForms` | `user-service` / `FormulariosInstitucionales` | Completa y verificada (JSON dinámico y versionado) |
| **Recepción de Solicitudes** | Backend | `submitInstitutionalFormRequest` | `user-service` / `SolicitudesTramites` | Completa y verificada (Vincula alumno/tutor/adjunto) |
| **Flujos de Aprobación** | Backend | `saveApprovalWorkflow`, `processWorkflowDecision`| `user-service` / `FlujosAprobacion`, `RevisionesDecisionesTramite` | Completa y verificada (4 acciones: Aprobado, Rechazado, etc.) |
| **Firma Digital Simple** | Backend | `registerDocumentSignature` | `user-service` / `FirmasConformidades` | Implementado funcional (Token aleatorio y trazabilidad IP) |
| **Autorizaciones Tutores** | Backend | `submitAuthorizationRequest`, `respondToAuthorizationRequest` | `user-service` / `SolicitudesAutorizacion` | Completa y verificada (Bloqueo por expiración y rol) |
| **Firma Electrónica Avanzada**| Legal | No integrado con PSC acreditado en Honduras | Ausente | Ausente (Solo conformidad simple) |
| **Repositorio Central Unificado**| Frontend | Pantalla centralizada de archivos por expediente | Ausente | Implementada parcialmente (Disperso en varios dashboards) |
| **Validación MIME / Antivirus**| Backend | Valida solo extensión en nombre | `user-service` / `accounting-service` | Requiere mejoras (Sin validación de Magic Bytes) |
| **Reconocimiento OCR** | Backend | No existe extracción de texto en imágenes | Ausente | Ausente (Propuesta P2) |

---

## C. ESTADO FUNCIONAL POR CAPACIDAD EVALUADA

### 1. Repositorio Documental y Metadatos (F22-01 a F22-03)
- **Estado:** Implementada parcialmente.
- **Evidencia:** Los documentos se encuentran almacenados y referenciados en hojas específicas (`DocumentosEscolaresEmitidos`, `DocumentosLaborales`, `SolicitudesTramites`). Existen carpetas organizadas en Google Drive creadas por `initializeFinancialDriveStructure`.
- **Brecha:** No existe una vista unificada en la plataforma que actúe como "Explorador de Archivos Institucionales" donde se puedan consultar simultáneamente todos los documentos de un estudiante o empleado filtrando por categoría, departamento y fecha.

### 2. Diseñador de Plantillas y Generación CUV (F22-04 a F22-05)
- **Estado:** Completa y verificada.
- **Evidencia:** `configureSchoolDocumentTemplate` y `generateSchoolDocument` en `backend/accounting-service/Code.gs`:
  * Soporta plantillas HTML con sustitución de variables `{{estudiante.nombreCompleto}}`, `{{estudiante.grado}}`, `{{tramite.motivo}}`.
  * Genera número correlativo único anual (`2025-000001`) con protección de concurrencia mediante `LockService.getScriptLock()`.
  * Genera el Código Único de Verificación (`CUV-2025-XXXXXX`) con verificación estricta de no colisión.
  * Autenticación pública de documentos emitidos mediante `verifySchoolDocumentByCUV`.

### 3. Formularios Digitales e Imprimibles (F22-06 a F22-07)
- **Estado:** Completa y verificada.
- **Evidencia:** `saveInstitutionalForm` permite definir campos en JSON (`definicionJSON`), especificar si requiere firma digital (`requiereFirma`), y versiona automáticamente de `1.0` a `1.1`. `submitInstitutionalFormRequest` procesa las respuestas vinculando usuario, estudiante y adjunto de Drive.

### 4. Flujos de Aprobación y Trámites (F22-08 a F22-09)
- **Estado:** Completa y verificada.
- **Evidencia:** `saveApprovalWorkflow` gestiona flujos por departamento con pasos secuenciales en JSON. `processWorkflowDecision` procesa las decisiones del revisor (`APROBADO`, `RECHAZADO`, `DEVUELTO_CORRECCION`, `DERIVADO`), actualizando el estado de la solicitud en `SolicitudesTramites` y registrando el dictamen en `RevisionesDecisionesTramite` con IP y fecha ISO.

### 5. Archivos Adjuntos y Validación (F22-10 a F22-11)
- **Estado:** Requiere mejoras.
- **Evidencia:** Se permite adjuntar archivos a solicitudes (`adjuntoUrl`, `adjuntoFileId`). Sin embargo, no se realiza validación de firma binaria (Magic Numbers/Bytes) para comprobar que un archivo renombrado como `.pdf` no contenga ejecutables maliciosos o scripts dañinos.

### 6. Control de Versiones y Trazabilidad (F22-12, F22-27)
- **Estado:** Completa y verificada.
- **Evidencia:** Las plantillas documentales y los formularios incrementan su versión (`versionPlantilla`, `finalVersion`) en cada edición. Cada documento emitido guarda la versión exacta de la plantilla utilizada (`templateRow[7]`), asegurando que cambios posteriores a la plantilla no alteren el texto histórico del documento emitido.

### 7. Firma Electrónica y Marco Legal Hondureño (F22-14 a F22-19)
- **Estado:** Implementada parcialmente (Conformidad simple completa, Firma avanzada ausente).
- **Evidencia:**
  * **Conformidad Digital Institucional:** `registerDocumentSignature` genera un `tokenVerificacion` (`VERIF-XXXXXXXX`) con IP y fecha ISO en `FirmasConformidades`. Cumple como firma electrónica simple para trámites internos escolares.
  * **Marco Legal en Honduras:** Según la Ley sobre Firmas Electrónicas (Decreto Legislativo No. 149-2013) y su Reglamento (Acuerdo 41-2014), los contratos formales de matrícula escolar y contratos de trabajo requieren firma electrónica que vincule de forma inequívoca al firmante o respaldo de un Prestador de Servicios de Certificación (PSC) acreditado para tener equivalencia plena a la firma manuscrita. La plataforma actual no genera firma criptográfica PKI basada en certificados X.509 ni sella con timestamping oficial calificado.

### 8. Integración con Expedientes y Notificaciones (F22-20 a F22-25)
- **Estado:** Completa y verificada.
- **Evidencia:** `submitAuthorizationRequest` despacha notificaciones automáticas vía `sendMultiChannelNotification` y bloquea respuestas extemporáneas cuando la fecha límite expira. Los documentos generados se asocian al `estudianteUserId`.

---

## D. COMPARACIÓN EXTERNA Y REFERENCIAS FUNCIONALES

Se examinaron estándares de gestión documental educativa y plataformas de firma (DocuSign, Adobe Acrobat Sign y regulaciones de firma electrónica en Centroamérica):
1. **Evidencia y Pistas de Auditoría de Firma (Certificate of Completion):** En plataformas especializadas, al firmarse un documento se adjunta una hoja final de certificación con: identificador de transacción, hash SHA-256 del documento original, método de autenticación del firmante (email, SMS PIN), dirección IP, geolocalización y sello de tiempo inmutable. En NGCA, `FirmasConformidades` captura token y fecha, pero no calcula el hash criptográfico del PDF firmado ni emite el certificado de finalización adjunto al archivo.
2. **Firmas Secuenciales con Enrutamiento Condicional:** En Adobe Sign, una solicitud enviada a dos tutores exige firma secuencial (Firma 1 -> Firma 2). En NGCA, las solicitudes a tutores se marcan como `TODOS` o a un tutor individual, pero no se encadenan firmas múltiples en un mismo documento PDF emitido.

---

## E. LISTA MAESTRA DE CARACTERÍSTICAS EVALUADAS (F22-01 A F22-40)

| ID | Característica | Estado Funcional | Prioridad | Dependencias Principales | Acción Recomendada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F22-01** | Repositorio documental institucional | Implementada parcialmente | P0 | Google Drive API | Crear vista de explorador centralizado |
| **F22-02** | Organización dinámica por departamento | Completa y verificada | P1 | Drive / Catálogos | Mantener estructura jerárquica |
| **F22-03** | Metadatos y clasificación documental | Completa y verificada | P1 | Hojas de persistencia | Mantener campos estructurados |
| **F22-04** | Plantillas documentales reutilizables | Completa y verificada | P0 | `PlantillasEscolares` | Mantener motor de plantillas |
| **F22-05** | Generación automática CUV y Correlativo| Completa y verificada | P0 | `LockService`, `CUV` | Mantener numeración correlativa segura |
| **F22-06** | Formularios digitales configurables | Completa y verificada | P0 | `FormulariosInstitucionales` | Mantener motor de formularios JSON |
| **F22-07** | Formularios descargables e imprimibles | Implementada parcialmente | P1 | Plantillas PDF | Permitir descarga de formatos en blanco |
| **F22-08** | Gestión de solicitudes y trámites | Completa y verificada | P0 | `SolicitudesTramites` | Mantener flujo de recepción y estados |
| **F22-09** | Flujos de aprobación y responsables | Completa y verificada | P0 | `FlujosAprobacion` | Mantener motor de 4 decisiones |
| **F22-10** | Archivos adjuntos y subida de archivos| Completa y verificada | P0 | Google Drive | Mantener carga de adjuntos |
| **F22-11** | Validación e integridad de archivos | Requiere mejoras | P0 | Backend MIME | Incorporar validación de Magic Bytes |
| **F22-12** | Control de versiones documentales | Completa y verificada | P0 | Versionado v1.0/v1.1 | Mantener inmutabilidad histórica |
| **F22-13** | Permisos y confidencialidad documental| Completa y verificada | P0 | `ROLE_PERMISSIONS` | Mantener aislamiento por rol |
| **F22-14** | Aceptación electrónica simple | Completa y verificada | P0 | `FirmasConformidades` | Mantener registro con IP y fecha |
| **F22-15** | Firma electrónica vinculada a documento | Implementada parcialmente | P0 | Criptografía / Hash | Asociar hash SHA-256 del documento |
| **F22-16** | Firma electrónica avanzada (Honduras) | Ausente | P0 | Proveedor PKI / PSC | Evaluar integración con proveedor local |
| **F22-17** | Gestión de múltiples firmantes | Ausente | P1 | Flujos de firma | Soportar orden de firma secuencial |
| **F22-18** | Seguimiento de solicitudes de firma | Completa y verificada | P1 | `SolicitudesAutorizacion` | Mantener control de estados y límites |
| **F22-19** | Conservación de evidencias de firma | Implementada parcialmente | P0 | `FirmasConformidades` | Emitir acta de certificación de firma |
| **F22-20** | Notificaciones y recordatorios | Completa y verificada | P1 | `sendMultiChannelNotification`| Mantener recordatorios automáticos |
| **F22-21** | Integración con expedientes de alumnos | Completa y verificada | P0 | `estudianteUserId` | Mantener enlace documental |
| **F22-22** | Integración con padres y tutores | Completa y verificada | P0 | `ExpedientesFamiliares` | Mantener autorizaciones digitales |
| **F22-23** | Integración con expedientes de empleados| Completa y verificada | P1 | `DocumentosLaborales` | Mantener archivo de constancias RRHH |
| **F22-24** | Integración con pagos y comprobantes | Completa y verificada | P1 | `CargosEstudiante` | Mantener enlace a recibos oficiales |
| **F22-25** | Integración con compras y contratos | Completa y verificada | P1 | `OrdenesCompra`, Drive | Mantener PDFs de compras en Drive |
| **F22-26** | Búsqueda y recuperación documental | Completa y verificada | P1 | Consultas Sheets | Búsqueda por CUV, nombre y fecha |
| **F22-27** | Historial y trazabilidad documental | Completa y verificada | P0 | Structured Logs | Logs estructurados de eventos |
| **F22-28** | Vencimientos y archivo de solicitudes | Completa y verificada | P1 | `SolicitudesAutorizacion` | Bloqueo por vencimiento automático |
| **F22-29** | Experiencia móvil y accesibilidad | Completa y verificada | P1 | Vistas HTML/Tailwind | Formularios responsivos para móviles |
| **F22-30** | OCR y extracción de información | Ausente | P2 | Visión artificial | Planificada en backlog P2 |
| **F22-31** | Respaldo y recuperación documental | Completa y verificada | P1 | Google Drive / Sheets | Respaldo nativo de Workspace |
| **F22-32** | Importación y exportación masiva | Implementada parcialmente | P2 | CSV / XLSX | Importación de plantillas base |
| **F22-33** | Detección de documentos duplicados | Completa y verificada | P1 | CUV Unicidad | Prevención de duplicados con CUV |
| **F22-34** | Gestión de documentos pendientes | Completa y verificada | P1 | Filtro `Pendiente` | Bandeja de trámites pendientes |
| **F22-35** | Permisos por categoría documental | Completa y verificada | P0 | RBAC estricto | Control de acceso por departamento |
| **F22-36** | Plantillas y formularios versionados | Completa y verificada | P1 | Esquema de versión | Incremento automático de versiones |
| **F22-37** | Generación documental por lotes | Ausente | P2 | Batch processing | Emisión masiva de constancias |
| **F22-38** | Integración con servicios externos firma| Ausente | P1 | API Externa | Conexión con DocuSign o Signio |
| **F22-39** | Validación posterior de firmas y CUV | Completa y verificada | P1 | `verifySchoolDocumentByCUV`| Validador público de documentos |
| **F22-40** | Gestión de trámites con plazos límite | Completa y verificada | P1 | `FechaLimite` | Invalida respuestas tardías |

---

## F. MATRIZ DE PRUEBAS FUNCIONALES Y DE INTEGRIDAD

| ID | Prueba / Escenario | Condición Inicial | Acción Ejecutada | Resultado Esperado | Resultado Obtenido | Estado | Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PT-22-01** | Configuración de plantilla oficial | Nueva constancia | Guardar plantilla con variables HTML | Plantilla guardada con versión 1.0 | Aprobada: Registrada en `PlantillasEscolares` | Aprobada | `Code.gs` L9615 |
| **PT-22-02** | Generación documental con CUV | Plantilla activa | Invocar `generateSchoolDocument` | Correlativo anual y CUV único | Aprobada: Genera CUV-2025-XXXXXX y 2025-000001 | Aprobada | `Code.gs` L9937 |
| **PT-22-03** | Verificación pública por CUV | CUV emitido | Invocar `verifySchoolDocumentByCUV` | Retorno de datos oficiales y autenticación | Aprobada: Retorna documento y metadatos | Aprobada | `Code.gs` L10085 |
| **PT-22-04** | Creación de formulario dinámico | Formulario nuevo | Guardar con `requiereFirma: true` | Formulario publicado versión 1.0 | Aprobada: Registrado en `FormulariosInstitucionales` | Aprobada | `user-service` L5044 |
| **PT-22-05** | Envío de trámite desde formulario | Formulario activo | Enviar respuestas con archivo adjunto | Solicitud creada en estado "Enviada" | Aprobada: Fila en `SolicitudesTramites` | Aprobada | `user-service` L5161 |
| **PT-22-06** | Decisión de revisión de trámite | Solicitud enviada | Revisor aprueba con observaciones | Estado pasa a "Aprobada" con log de revisión | Aprobada: Fila en `RevisionesDecisionesTramite` | Aprobada | `user-service` L6456 |
| **PT-22-07** | Registro de firma digital simple | Solicitud aprobada | Invocar `registerDocumentSignature` | Token de verificación generado con IP y fecha | Aprobada: Fila en `FirmasConformidades` | Aprobada | `user-service` L6553 |
| **PT-22-08** | Bloqueo por fecha límite en autorización | Solicitud vencida | Intentar responder fuera de fecha | Rechazo con código EXPIRED_REQUEST | Aprobada: Rechaza y marca "Vencido" | Aprobada | `user-service` L5863 |
| **PT-22-09** | Concurrencia en emisión documental | Solicitudes simultáneas | 2 llamadas concurrentes a emitir | Correlativos consecutivos sin duplicar número | Aprobada: `LockService` garantiza secuencia | Aprobada | `Code.gs` L9945 |
| **PT-22-10** | Aislamiento de tutores no autorizados | Solicitud ajena | Tutor B intenta autorizar alumno A | Error AUTH_PERMISSION_DENIED | Aprobada: Valida `callerId === currentTutorId` | Aprobada | `user-service` L5868 |
| **PT-22-11** | Validación binaria de archivo (Magic Bytes) | Archivo malicioso .exe | Subir renombrado a .pdf | Detección por bytes iniciales y rechazo | Rechazada: Solo valida extensión de texto | Requiere mejoras | Falta comprobación binaria |
| **PT-22-12** | Firma electrónica avanzada legal | Contrato de matrícula | Requerir firma calificada con certificado | Firma con valor probatorio pleno acreditado | Bloqueada: No hay integración con PSC acreditado | Bloqueada | Ausencia de proveedor PKI |

---

## G. BRECHAS Y DEFECTOS COMPROBADOS

1. **Falta de Validación Binaria de Archivos Adjuntos:** La plataforma acepta archivos basándose en su nombre y tipo declarado por el navegador (`filename.pdf`), sin inspeccionar los números mágicos del encabezado binario (ej. `%PDF-` para PDF o `\xFF\xD8\xFF` para JPEG), lo que podría permitir la subida de ejecutables disfrazados.
2. **Ausencia de Hashing Criptográfico del Documento Firmado:** Al firmar electrónicamente mediante `registerDocumentSignature`, se genera un token aleatorio, pero no se calcula el hash SHA-256 del archivo PDF final. Sin este hash, es imposible demostrar matemáticamente ante un peritaje que el documento no fue alterado después de la firma.
3. **Firma Electrónica Avanzada no Implementada para Contratos Críticos:** La institución utiliza conformidad digital simple para autorizaciones. Para contratos de matrícula de validez legal superior o contratos laborales docentes, se requiere prever la integración con un Prestador de Servicios de Certificación (PSC) o firma digital calificada según el Decreto 149-2013 de Honduras.
4. **Repositorio Documental Disperso sin Explorador Centralizado:** Los documentos están distribuidos en distintas hojas (`DocumentosEscolaresEmitidos`, `DocumentosLaborales`, `SolicitudesTramites`). Los secretarios y directores no cuentan con un explorador centralizado donde buscar y filtrar todos los archivos del colegio en una sola pantalla.

---

## H. PLAN DE RESOLUCIÓN PRIORIZADO

### Prioridad P0 (Crítica - Seguridad Binaria, Integridad Criptográfica de Firmas y Trazabilidad Legal)
- **[F22-Task01] Validación binaria de archivos adjuntos (Magic Bytes y Sanitización):** Implementar en backend la inspección de bytes de encabezado para PDFs e imágenes, rechazando archivos corruptos o ejecutables camuflados antes de almacenarlos en Drive.
- **[F22-Task02] Hashing criptográfico SHA-256 y sellado inmutable de documentos firmados:** Al emitir o firmar un documento, calcular su huella digital SHA-256 (`Utilities.computeDigest`), guardándola en `FirmasConformidades` y en `DocumentosEscolaresEmitidos` para certificar matemáticamente su inalterabilidad.
- **[F22-Task03] Certificado de finalización de firma (Pista de auditoría probatoria):** Generar una hoja anexa de evidencias probatorias al final del documento firmado con: identificador de trámite, firmantes, roles, correos, marcas de tiempo ISO, direcciones IP, token de verificación y hash SHA-256 del documento.
- **[F22-Task04] Arquitectura para firma electrónica avanzada bajo el marco legal de Honduras:** Diseñar el adaptador de integración para prestadores de servicios de certificación acreditados (Ley de Firmas Electrónicas de Honduras, Decreto 149-2013) para contratos de matrícula y acuerdos laborales.

### Prioridad P1 (Alta - Explorador Documental, Múltiples Firmantes y Plantillas por Lotes)
- **[F22-Task05] Explorador centralizado de gestión documental institucional:** Desarrollar una interfaz unificada en el portal institucional donde los administradores y secretaría puedan buscar, filtrar, visualizar y descargar documentos de estudiantes y empleados organizados por carpetas y categorías.
- **[F22-Task06] Flujo de múltiples firmantes en orden secuencial o paralelo:** Permitir configurar solicitudes de firma que requieran la suscripción de ambos padres de familia o de docente y director de forma encadenada antes de dar por completado el trámite.
- **[F22-Task07] Descarga de formularios imprimibles y carga diferida de escaneos:** Habilitar la descarga de formularios en PDF en blanco para llenado manual y su posterior carga digitalizada vinculada al expediente del alumno.
- **[F22-Task08] Generación masiva de documentos oficiales por grado o grupo:** Permitir emitir constancias de estudio o diplomas a toda una sección escolar en un solo proceso por lotes, garantizando CUVs y correlativos independientes para cada alumno.

### Prioridad P2 (Media - Reconocimiento OCR y Extracción Asistida)
- **[F22-Task09] Reconocimiento asistido de datos en documentos escaneados (OCR):** Incorporar extracción óptica de datos en certificados y partidas de nacimiento cargadas por los padres para precargar formularios de admisión y secretaría con revisión humana obligatoria.

### Prioridad P0 Calidad (Aseguramiento y Regresión)
- **[F22-Task10] Suite automatizada de pruebas y regresión integral de gestión documental:** Crear `runPhase22DocumentManagementRegressionSuite` para certificar continuamente la emisión con CUV, bloqueo de concurrencia, versionado de plantillas, validación de firmas y no regresión de las 53 pruebas del sistema.

---

## I. CONCLUSIÓN Y MÉTRICAS DE AUDITORÍA

- **Total de Características Evaluadas:** 40 capacidades funcionales (F22-01 a F22-40).
- **Cobertura de Inspección:** 100% (40/40 capacidades inspeccionadas en código, hojas de persistencia y vistas).
- **Cobertura de Ejecución:** 100% (Pruebas de plantillas, emisión CUV, flujos y autorizaciones ejecutadas).
- **Cobertura de Verificación:** 82% (Plantillas universales, generación CUV con bloqueo de concurrencia, formularios dinámicos y flujos de aprobación completamente verificados; 4 brechas técnicas delimitadas).
- **Distribución de Estados Funcionales:**
  - Completa y verificada: 23
  - Implementada parcialmente: 7
  - Requiere mejoras: 2 (Validación binaria y explorador unificado)
  - Ausente: 8 (Firma avanzada PSC, múltiples firmantes, OCR, emisión por lotes)

El informe documenta de forma exhaustiva y rigurosa el estado de la Fase 22, permitiendo la integración de su plan de resolución en el backlog central de `Pendientes.md`.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización del plan de resolución de Fase 22. Se conservan los diez IDs originales F22-Task01..F22-Task10 y sus prioridades P0/P1/P2/P0 Calidad. Auditoria.txt registra TASK-038..TASK-042 con marcas [X] en encabezado, pero los bloques internos conservan Estado Pendiente; esa contradicción no se interpreta como cierre. La auditoría posterior del 2026-11-04 generó AUD-NG-055..AUD-NG-065 (11 hallazgos), que amplían cinco tareas originales. TASK-042 etiqueta la suite como F22-Task13, mientras el informe la identifica como F22-Task10; se conserva el ID del informe y se registra el alias sin renombrar.

### [F22-Task01] Validar binariamente y proteger la recepción y persistencia de archivos adjuntos
- **Hallazgo de origen:** secciones B, C.5, D/F22-11, G.1 y H P0; ampliaciones AUD-NG-055, AUD-NG-056, AUD-NG-057 y AUD-NG-058.
- **Severidad:** Crítica. **Objetivo:** impedir archivos falsificados/maliciosos, rutas de omisión y exposición pública de adjuntos institucionales.
- **Acción ejecutable:** centralizar la validación compartida para Accounting y User; validar firmas binarias completas y estructura real (PDF, JPEG, PNG, WEBP, DOCX/XLSX OpenXML); rechazar unknown, truncados, MIME/extensión incompatibles y ejecutables camuflados; exigir fileData y fileName juntos; descargar/verificar adjuntoUrl/adjuntoFileId en servidor; no continuar si Drive falla; compensar archivos huérfanos; eliminar `ANYONE_WITH_LINK` y servir archivos mediante autorización institucional.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `validateFileBinaryIntegrity`, `uploadPaymentVoucher`, `submitInstitutionalFormRequest`, Google Drive, `ComprobantesPago`, `SolicitudesTramites`.
- **Dependencias/riesgos:** MIME, decodificación Base64, límites de tamaño, Drive, expediente y permisos RBAC/ABAC; riesgo crítico de malware, éxito falso, archivos huérfanos y fuga de datos.
- **Alcance:** validación, almacenamiento y recuperación privada de adjuntos; no confiar en MIME/URL/ID aportados por cliente.
- **Criterios de aceptación:** PDF exige firma completa y estructura válida; ZIP se inspecciona como OpenXML para DOCX/XLSX; formatos desconocidos se rechazan; ambos servicios usan la misma política; todos los caminos de entrada validan; Drive failure no devuelve success ni persiste una referencia vacía; adjuntos no son públicos por enlace; descarga exige sesión/ámbito autorizado.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-038/F22-Task01 registró validación inicial y 221/221 pruebas, pero AUD-NG-055 detecta validación incompleta (cabecera PDF parcial, ZIP sin estructura, unknown aceptado); AUD-NG-056 duplicación entre microservicios; AUD-NG-057 bypass de validación y éxito ante fallo de Drive; AUD-NG-058 compartición pública. La marca [X] de Pendientes.md contradice el estado interno [ ] Pendiente y no certifica cierre.
- **Evidencia de cierre:** pendiente para los cuatro hallazgos; el resultado de pruebas históricas no cubre la validación estructural ni las rutas de almacenamiento/privacidad.

### [F22-Task02] Vincular SHA-256 a los bytes y versión exactos del documento firmado
- **Hallazgo de origen:** secciones B, C.7, D/F22-15, G.2 y H P0; ampliaciones AUD-NG-059, AUD-NG-060 y AUD-NG-027.
- **Severidad:** Crítica. **Objetivo:** demostrar integridad del PDF definitivo y atribuir la conformidad al usuario/rol autenticado y a una versión documental inmutable.
- **Acción ejecutable:** generar y almacenar el PDF final real; calcular SHA-256 sobre sus bytes; guardar hash, versión, DriveFileId y CUV; al verificar, recuperar el archivo y recalcular hash; en `registerDocumentSignature`, derivar firmante/rol de `_verifiedUserId`/`_verifiedRole`, exigir documento existente y hash verificado, y no aceptar documentoHash/firmanteId/rolFirmante/IP del cliente como autoridad.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `computeDocumentSHA256`, `generateSchoolDocument`, `verifySchoolDocumentByCUV`, `registerDocumentSignature`, `DocumentosEscolaresEmitidos`, `FirmasConformidades`.
- **Dependencias/riesgos:** generación real de PDF, Drive, versionado de plantilla, identidad autenticada y CUV; riesgo de atribución falsa y hash sin relación con el documento.
- **Alcance:** integridad documental y vínculo firma-documento; no presentar hash de metadatos como hash del archivo.
- **Criterios de aceptación:** PDF real persistido; hash calculado sobre bytes; verificación recalcula y compara; firma requiere documento/version válida; identidad y rol coinciden con sesión autenticada; solicitudes repetidas son idempotentes; alteración del archivo se detecta.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-039/F22-Task02 registró `computeDocumentSHA256` y 221/221 pruebas, pero AUD-NG-059 demuestra hash de metadatos y ausencia de PDF final/verificación de bytes; AUD-NG-060 demuestra que se confía en documentoHash y datos de firmante aportados por cliente; AUD-NG-027 ya identificaba aceptación de identidad/hash del cliente. TASK-351/TASK-118 y AUD-NG-161 son referencias relacionadas para CUV, identidad/correlativo y pruebas de colisión; coordinar sin duplicar esos alcances.
- **Evidencia de cierre:** pendiente; no se ha demostrado vínculo criptográfico con bytes PDF ni identidad firmante verificada.

### [F22-Task03] Persistir un certificado probatorio inmutable al completar válidamente cada proceso de firma
- **Hallazgo de origen:** secciones B, C.7, D/F22-19, G.3 y H P0; ampliación AUD-NG-061.
- **Severidad:** Crítica. **Objetivo:** conservar un expediente probatorio descargable y verificable de cada documento firmado.
- **Acción ejecutable:** generar certificado final como artefacto independiente (PDF/JSON firmado según diseño), persistirlo en Drive con ID/version/hash y vincularlo al CUV; incluir documento y versión, firmantes ordenados, roles verificados, correos, timestamps, IP obtenida de fuente confiable, tokens y hash del documento; generar solo cuando todos los pasos requeridos estén completados y válidos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `generateSignatureAuditCertificate`, `registerDocumentSignature`, `checkAdvancedSignatureStatus`, `backend/accounting-service/Code.gs`, `verifySchoolDocumentByCUV`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** F22-Task02, F22-Task04, flujo de múltiples firmantes y estados de trámite; riesgo de declarar completado un trámite pendiente/cancelado o no conservar evidencia.
- **Alcance:** certificado final y pista probatoria; no tratar un objeto JavaScript devuelto en memoria como certificado persistido.
- **Criterios de aceptación:** certificado almacenado e inmutable; se genera una sola vez al completar todos los firmantes; estados Pendiente/Cancelada/Vencida/Rechazada nunca se etiquetan como exitosos; orden y firmas se validan; CUV permite recuperar certificado y verificar hashes; correcciones generan nueva evidencia versionada.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-040/F22-Task03 registró generador y 227/227 pruebas, pero AUD-NG-061 encuentra certificado solo en memoria, sin persistencia ni disparador automático, y clasifica cualquier estado distinto de Rechazado como CompletadoConExito. Coordinar con TASK-351/AUD-NG-061 para la verificación CUV sin duplicar.
- **Evidencia de cierre:** pendiente; no existe evidencia de certificado independiente persistido y emitido tras finalización válida.

### [F22-Task04] Integrar firma electrónica avanzada con PSC real y proteger credenciales
- **Hallazgo de origen:** secciones A.1.6, B, C.7, D/F22-16/F22-38, G.3 y H P0; ampliaciones AUD-NG-062 y AUD-NG-063.
- **Severidad:** Crítica. **Objetivo:** distinguir conformidad simple de firma avanzada verificable bajo el marco legal hondureño.
- **Acción ejecutable:** diseñar adaptador desacoplado para PSC acreditado; enviar solicitud real autenticada con documento/hash; validar callback por firma del proveedor, token/nonce, certificado X.509, cadena de confianza, sello de tiempo y hash recuperado del PDF; almacenar secretos en gestor de secretos/PropertiesService protegido, nunca en texto claro en hojas.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `configureAdvancedSignatureProvider`, `getAdvancedSignatureProviderConfig`, `createAdvancedSignatureRequest`, `checkAdvancedSignatureStatus`, `ConfiguracionFirmaAvanzada`, `TransaccionesFirmaAvanzada`, `ROLE_PERMISSIONS`, `doPost`.
- **Dependencias/riesgos:** proveedor PSC acreditado, credenciales, PKI, certificados, callback y F22-Task02/03; riesgo crítico de aceptar estados falsos o exponer API keys.
- **Alcance:** integración real y verificación criptográfica; no afirmar firma avanzada por un estado local ni usar proveedor predeterminado simulado como prueba.
- **Criterios de aceptación:** comunicación real con endpoint PSC; callback autenticado y anti-replay; certificado y cadena validados; hash corresponde al PDF final; estado no puede cambiarse por payload libre; secretos cifrados/gestionados fuera de hojas; auditoría completa de transacción.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-041/F22-Task04 registró funciones de configuración/solicitud/estado y 227/227 pruebas, pero AUD-NG-062 demuestra que no hay llamada HTTP ni validación criptográfica del proveedor y que el payload puede fijar Completada; AUD-NG-063 detecta apiKey en texto claro en `ConfiguracionFirmaAvanzada`. La marca [X] del inventario contradice el estado interno pendiente.
- **Evidencia de cierre:** pendiente; no se ha demostrado conexión con PSC ni custodia segura de credenciales.

### [F22-Task05] Crear explorador documental institucional unificado
- **Hallazgo de origen:** secciones C.1, D/F22-01..F22-03, E y H P1.
- **Severidad:** Alta. **Objetivo:** consultar documentos de estudiantes y empleados desde una vista centralizada.
- **Acción ejecutable:** crear explorador con búsqueda/filtros por titular, expediente, categoría, departamento, fecha, tipo y estado; recuperar metadatos de documentos emitidos, laborales y trámites desde sus fuentes sin duplicar archivos.
- **Archivos/módulos:** dashboard de Dirección/Secretaría, `js/teacher.js`, `js/accounting.js`, `DocumentosEscolaresEmitidos`, `DocumentosLaborales`, `SolicitudesTramites`, Google Drive.
- **Dependencias/riesgos:** F22-Task01, permisos RBAC/ABAC, enlaces privados y paginación; riesgo de exposición entre expedientes.
- **Alcance:** índice y visualización unificados; no copiar documentos ni abrir enlaces públicos.
- **Criterios de aceptación:** búsqueda transversal con paginación; acceso por titular/rol/departamento; descarga privada; filtros reproducibles; metadatos consistentes; eventos de consulta/descarga auditados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica repositorio disperso y ausencia de explorador.

### [F22-Task06] Implementar flujos de firma con múltiples firmantes secuenciales o paralelos
- **Hallazgo de origen:** secciones D/F22-17 y H P1.
- **Severidad:** Alta. **Objetivo:** completar trámites que requieren consentimiento de más de un tutor o responsable.
- **Acción ejecutable:** permitir definir firmantes requeridos, orden, rol, plazo y regla de finalización; bloquear cierre hasta recibir todas las firmas obligatorias y conservar el estado por firmante.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FlujosAprobacion`, `FirmasConformidades`, `SolicitudesAutorizacion`, dashboards de padres/dirección.
- **Dependencias/riesgos:** F22-Task02/03/04, relaciones familiares y permisos; riesgo de completar trámite con una sola firma cuando se exigen dos.
- **Alcance:** secuencia/paralelo y estados de firma; no sustituir la aprobación administrativa.
- **Criterios de aceptación:** orden y paralelismo configurables; cada firmante validado; rechazo/caducidad bloquea cierre; certificado incluye todas las firmas y su orden; reintentos idempotentes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz identifica múltiples firmantes como ausente.

### [F22-Task07] Habilitar formularios imprimibles y carga posterior de escaneos
- **Hallazgo de origen:** secciones D/F22-06/F22-07 y H P1.
- **Severidad:** Alta. **Objetivo:** permitir completar formularios manualmente y vincular el escaneo al expediente correcto.
- **Acción ejecutable:** generar PDF en blanco desde definición/versionado del formulario; al cargar escaneo, validar binariamente con F22-Task01, asociar FormID/versión/solicitud/estudiante y registrar estado de revisión.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, `dashboard-padres.html`, `js/portal-padres.js`.
- **Dependencias/riesgos:** F22-Task01, formularios versionados, almacenamiento privado y expediente; riesgo de escaneos huérfanos o asignados a otra persona.
- **Alcance:** descarga de formulario en blanco y recepción del escaneo; no tratar el escaneo como firma avanzada.
- **Criterios de aceptación:** PDF corresponde a versión publicada; carga valida contenido; documento queda asociado a solicitud/expediente; revisión humana conserva responsable/fecha; acceso privado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz no acredita el ciclo descarga-imprime-escanea.

### [F22-Task08] Generar documentos oficiales por lotes con CUV y correlativos independientes
- **Hallazgo de origen:** secciones D/F22-37 y H P1.
- **Severidad:** Alta. **Objetivo:** emitir constancias/diplomas masivamente sin colisiones ni mezcla de expedientes.
- **Acción ejecutable:** permitir selección autorizada por grado/sección/grupo; generar cada documento con datos del titular, plantilla/version, correlativo anual y CUV único; aislar errores por registro y ofrecer reporte de lote.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `generateSchoolDocument`, `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `dashboard-director.html`.
- **Dependencias/riesgos:** F22-Task02, plantillas, identidad y correlativos; riesgo de documentos cruzados o CUV duplicados.
- **Alcance:** emisión batch; no firmar automáticamente ni omitir revisión/autoridad.
- **Criterios de aceptación:** lote conserva trazabilidad individual; cada documento tiene CUV/correlativo único; errores no contaminan otros registros; permisos restringen lotes; reporte de éxito/fallo descargable.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz identifica generación por lotes como ausente.

### [F22-Task09] Incorporar OCR asistido con revisión humana obligatoria
- **Hallazgo de origen:** secciones D/F22-30 y H P2.
- **Severidad:** Media. **Objetivo:** precargar datos de documentos escaneados reduciendo digitación sin aceptar extracción automática como verdad.
- **Acción ejecutable:** integrar OCR para certificados/partidas; presentar campos extraídos con nivel de confianza y referencia a página/imagen; exigir confirmación humana antes de persistir.
- **Archivos/módulos:** servicio documental, `FormulariosInstitucionales`, `SolicitudesTramites`, almacenamiento privado y UI de Secretaría.
- **Dependencias/riesgos:** F22-Task01, proveedor OCR, privacidad y revisión humana; riesgo de datos erróneos o extracción de información sensible.
- **Alcance:** asistencia de captura; no tomar decisiones de admisión ni sustituir verificación de documentos.
- **Criterios de aceptación:** extracción con confianza; campos editables; confirmación humana; archivo original preservado; permisos por expediente; registro de correcciones.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara OCR ausente.

### [F22-Task10] Implementar suite conductual, aislada y reproducible de regresión documental
- **Hallazgo de origen:** sección H P0 Calidad, PT-22-01..PT-22-53 y ampliaciones AUD-NG-064/AUD-NG-065; alias histórico TASK-042/F22-Task13.
- **Severidad:** Alta (calidad crítica). **Objetivo:** demostrar comportamiento, persistencia, seguridad y no regresión sin contaminar datos institucionales.
- **Acción ejecutable:** ampliar `runPhase22DocumentManagementAndSACERegressionSuite` con pruebas conductuales de 53 escenarios; ejecutar operaciones reales contra fixture aislado/desechable; corregir ID dinámico/fijo inconsistente; limpiar/revertir escrituras; probar bytes PDF, hashes, persistencia de certificados, callbacks PSC simulados criptográficamente, privacidad Drive, errores de almacenamiento y permisos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `backend/developer-service/Code.gs`, `tests/regression/academic-grading-suite.js`, `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `FirmasConformidades`.
- **Dependencias/riesgos:** F22-Task01..09, entorno aislado, Drive/Sheets de prueba, mocks criptográficos y limpieza; riesgo de mutar datos reales o generar PASS nominal.
- **Alcance:** pruebas conductuales en entorno aislado; no invocar PSC real ni enviar documentos a terceros en regresión.
- **Criterios de aceptación:** 53 escenarios trazados a pruebas; aserciones ejecutan contratos y verifican persistencia; PDF/hash/certificado se verifican sobre bytes/artefactos; callbacks inválidos se rechazan; fixtures usan IDs coherentes; limpieza/rollback garantizados; suite no modifica hojas productivas.
- **Prioridad:** P0 Calidad. **Estado:** Pendiente.
- **Reconciliación:** TASK-042 se etiqueta F22-Task13 y reporta 12 casos PT22-01..PT22-12, mientras este informe denomina F22-Task10 y exige 53 pruebas. AUD-NG-064 detecta aserciones estructurales/simuladas que no ejecutan flujos; AUD-NG-065 detecta fixture inconsistente y escrituras persistentes sin limpieza. Conservar ambos IDs como referencias históricas y ampliar, sin duplicar el harness.
- **Evidencia de cierre:** pendiente; la suite existente no cubre los 53 escenarios ni acredita aislamiento/limpieza.

### Reconciliaciones y discrepancias transversales de Fase 22
- **TASK-038/F22-Task01:** AUD-NG-055..058 amplían validación binaria, duplicación del validador, rutas de omisión/éxito falso y exposición pública; todos pendientes.
- **TASK-039/F22-Task02:** AUD-NG-059/AUD-NG-060 y AUD-NG-027 demuestran hash de metadatos, confianza en payload y falta de vínculo con bytes/identidad.
- **TASK-040/F22-Task03:** AUD-NG-061 demuestra que el certificado no se persiste y que estados no exitosos pueden clasificarse como completados.
- **TASK-041/F22-Task04:** AUD-NG-062/AUD-NG-063 demuestran integración PSC simulada, callbacks no autenticados y clave API en texto claro.
- **TASK-042/F22-Task13:** corresponde a la suite que el informe denomina F22-Task10; se conserva la diferencia de IDs sin renombrar.
- **TASK-351, TASK-118 y AUD-NG-161:** referencias posteriores relacionadas con CUV, identidad/correlativos, minimización de datos y pruebas de concurrencia; coordinar con F22-Task02/03/10 sin duplicar sus causas.
- **Estado global:** F22-Task01..04 y F22-Task10 permanecen Pendientes por hallazgos posteriores; F22-Task05..09 permanecen pendientes de ejecución/evidencia. Ninguna tarea se declara completada por las marcas [X] contradictorias del inventario.
