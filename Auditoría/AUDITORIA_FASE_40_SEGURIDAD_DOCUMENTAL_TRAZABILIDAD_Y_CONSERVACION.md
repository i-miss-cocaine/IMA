# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 40
# SEGURIDAD DOCUMENTAL, TRAZABILIDAD Y CONSERVACIÓN

**Plataforma Integral de Gestión Educativa**
**Fase Auditada:** Fase 40 — Seguridad Documental, Trazabilidad y Conservación
**Fecha de Emisión:** 2026-10-31
**Auditor Responsable:** Jules (Software Engineer / Auditor Técnico Independiente)
**Estado de la Fase:** Requiere Mejoras / No Aprobada para Producción Crítica

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Contexto de la Auditoría
La presente auditoría evalúa de forma exhaustiva, técnica y documental los mecanismos de seguridad, control de acceso, inmutabilidad, trazabilidad, ciclo de vida, conservación, respaldo y recuperación de documentos en la Plataforma Integral de Gestión Educativa. El análisis distingue estrictamente entre los controles implementados en la aplicación (backend y frontend) y las políticas nativas provistas por el almacenamiento subyacente (Google Drive y Google Sheets), determinando si los documentos institucionales, académicos, financieros y laborales están protegidos durante todo su ciclo de vida contra accesos indebidos, alteraciones inadvertidas o maliciosas, y pérdidas operativas.

### 2. Alcance Previsto vs. Alcance Efectivamente Evaluado
- **Alcance Previsto:** Evaluación de la matriz de permisos documentales, registros de trazabilidad forense, vinculación de expedientes (plantilla-formulario-evidencia-documento final), protección de documentos sensibles, políticas de retención y disposición final, verificación criptográfica de integridad (SHA-256), protección de documentos aprobados y firmados, arquitectura de respaldo/recuperación, control de enlaces compartidos, y auditoría de solo lectura.
- **Alcance Efectivamente Evaluado:**
  - Inspección del 100% de los servicios backend involucrados: `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `backend/developer-service/Code.gs`.
  - Revisión de estructuras de almacenamiento en hojas de cálculo: `DocumentosEstudiante`, `HistorialVersionesDocumentos`, `DocumentosLaborales`, `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `FirmasConformidades`, `LogsSistema`, `RegistroEventos`.
  - Inspección del almacenamiento físico de archivos en Google Drive: carpetas `Documentos_Estudiantes`, `Documentos_Laborales`, `ComprobantesPago`, `Plantillas`, y carpetas de respaldos institucionales.
  - Evaluación de las 26 características maestras (`F40-01` a `F40-26`) y los 6 escenarios de prueba integral de extremo a extremo (`E2E-01` a `E2E-06`).

### 3. Componentes y Módulos Encontrados
- **Área Académica:** `uploadStudentDocument`, `getStudentDocuments`, `restoreDocumentVersion`, `updateDocumentStatus`, `getPendingDocumentsReport`, `validateEvidenceFileAndPermissions`, `getSecureDocumentStream`.
- **Área Contable y Financiera:** `uploadEmployeeDocument`, `getEmployeeDocuments`, `uploadPaymentVoucher`, `configureSchoolDocumentTemplate`, `getSchoolDocumentTemplates`, `previewSchoolDocument`, `generateSchoolDocument`, `verifySchoolDocumentByCUV`, `getIssuedSchoolDocuments`.
- **Área de Identidad y Seguridad:** `registerDocumentSignature`, `getLegalDocumentVersions`, `acceptLegalDocument`, `getAuditReport`, `validateRolePermission`, `ROLE_PERMISSIONS`.
- **Área Técnica y Respaldo:** `createSystemBackup`, `listSystemBackups`, `verifyBackupIntegrity`, `restoreSystemBackup`, `previewBackupRestoreImpact`.

### 4. Roles Involucrados
`Administrador`, `Director`, `Secretaría`, `Docente`, `Contabilidad` / `Tesoreria`, `RecursosHumanos`, `Estudiante`, `Padre` / `Tutor`, `Auditor` (rol conceptual evaluado).

---

## B. INVENTARIO DE IMPLEMENTACIÓN

| Elemento Funcional | Nombre Interno Real | Archivo y Ubicación | Estructuras de Datos / Tablas | Función que Desempeña |
|---|---|---|---|---|
| Carga de Expediente de Alumno | `uploadStudentDocument` | `backend/academic-service/Code.gs` (l. 10506) | `DocumentosEstudiante`, `HistorialVersionesDocumentos` | Recibe base64, valida MIME (PDF, JPG, PNG, WEBP), tamaño (10MB), guarda en Drive y versiona si ya existe. |
| Consulta de Documentos de Alumno | `getStudentDocuments` | `backend/academic-service/Code.gs` (l. 10642) | `DocumentosEstudiante` | Filtra documentos vigentes por `expedienteId` o `solicitudId`. |
| Flujo de Documento Seguro | `getSecureDocumentStream` | `backend/academic-service/Code.gs` (l. 2419) | DriveApp | Obtiene metadata y enlace de descarga de Drive validando pertenencia básica (`assertRecordOwnership`). |
| Restauración de Versión Documental | `restoreDocumentVersion` | `backend/academic-service/Code.gs` (l. 10723) | `DocumentosEstudiante`, `HistorialVersionesDocumentos` | Restaura una versión anterior archivando la versión vigente en el historial. |
| Actualización de Estado Documental | `updateDocumentStatus` | `backend/academic-service/Code.gs` (l. 10770) | `DocumentosEstudiante` | Actualiza estado (`Aprobado`, `EnRevision`, `Rechazado`) y observaciones. |
| Carga de Expediente Laboral | `uploadEmployeeDocument` | `backend/accounting-service/Code.gs` (l. 4525) | `DocumentosLaborales` | Almacena contratos/constancias en Drive y registra en hoja de cálculo. |
| Generación de Documento Oficial CUV | `generateSchoolDocument` | `backend/accounting-service/Code.gs` (l. 9937) | `PlantillasEscolares`, `DocumentosEscolaresEmitidos` | Genera certificados con correlativo anual y CUV de 12 caracteres. |
| Verificación Pública de CUV | `verifySchoolDocumentByCUV` | `backend/accounting-service/Code.gs` (l. 10043) | `DocumentosEscolaresEmitidos` | Autentica el documento mediante su código CUV. |
| Registro de Firmas / Conformidad | `registerDocumentSignature` | `backend/user-service/Code.gs` (l. 6553) | `FirmasConformidades` | Registra aceptación con fecha, firmante y token aleatorio (`VERIF-XXXXXXXX`). |
| Respaldos de Sistema | `createSystemBackup` | `backend/academic-service/Code.gs` (l. 11868) | DriveApp (JSON), `LogsSistema` | Vuelca hojas a JSON, genera hash ad-hoc (`computeSimpleHash`) y guarda en Drive. |
| Restauración de Respaldos | `restoreSystemBackup` | `backend/academic-service/Code.gs` (l. 12000) | Google Sheets | Restaura hojas con código de confirmación `RESTORE-CONFIRMED`. |

---

## C. ESTADO FUNCIONAL DETALLADO DE LAS CARACTERÍSTICAS (F40-01 a F40-26)

| ID | Característica Evaluada | Prioridad | Estado Funcional | Brecha Crítica Detectada |
|---|---|---|---|---|
| **F40-01** | Permisos independientes por operación documental | P0 | Implementada parcialmente | No existe distinción entre lectura y descarga; el permiso `getStudentDocuments` expone URLs directas de Drive sin token de descarga independiente. |
| **F40-02** | Restricciones por categoría y sensibilidad documental | P0 | Requiere mejoras | No existen etiquetas formales de sensibilidad (médico, disciplinario, financiero) en el modelo de metadatos de `DocumentosEstudiante`. |
| **F40-03** | Control de acceso por expediente, departamento y ámbito | P0 | Implementada parcialmente | Se filtra por `expedienteId` si se envía, pero una petición con ID manipulado puede consultar documentos si el rol tiene acceso general a la función. |
| **F40-04** | Registro de origen, responsables y procedencia | P0 | Implementada parcialmente | Se registra usuario y fecha de subida, pero no el canal de origen (API, formulario externo, carga manual) ni la IP del cliente. |
| **F40-05** | Historial de operaciones y trazabilidad | P0 | Requiere mejoras | `HistorialVersionesDocumentos` registra sustituciones de archivos, pero no consultas de lectura, descargas ni intentos denegados. |
| **F40-06** | Versionado y conservación de versiones anteriores | P0 | Completa y verificada | `uploadStudentDocument` y `restoreDocumentVersion` archivan versiones previas con `VER-[timestamp]` y preservan datos históricos. |
| **F40-07** | Relación entre plantilla, formulario, evidencias y documento final | P0 | Completa y verificada | `generateSchoolDocument` vincula `plantillaId`, `versionPlantilla`, `targetEntityId`, CUV y correlativo anual. |
| **F40-08** | Protección de documentos aprobados y firmados | P0 | Requiere mejoras | El estado `Aprobado` no bloquea físicamente la sobreescritura del archivo en Drive; un usuario con rol de subida puede sustituir el binario. |
| **F40-09** | Integridad criptográfica y detección de alteraciones | P0 | Defectuosa | No se calcula SHA-256 del binario al subirlo en `uploadStudentDocument`. En respaldos se usa `computeSimpleHash` (algoritmo DJB2 simple), vulnerable a colisiones. |
| **F40-10** | Validación y restricciones de formatos | P0 | Completa y verificada | Validación estricta de Magic Bytes / MIME real (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) y límite de 10 MB. |
| **F40-11** | Conservación, archivo y plazos de retención | P0 | Ausente | No existe motor de purga programada ni políticas WORM de retención legal para expedientes escolares cerrados. |
| **F40-12** | Bloqueos y eliminación autorizada | P0 | Implementada parcialmente | No existe endpoint directo para eliminar archivos en Drive; se actualiza el estado lógico, pero no hay flujo de doble autorización. |
| **F40-13** | Enlaces compartidos y acceso temporal | P0 | Defectuosa | En `uploadEmployeeDocument` y comprobantes de pago se utiliza `file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)`. Vulnerabilidad crítica de exposición pública. |
| **F40-14** | Control y registro de descargas | P0 | Ausente | Las descargas se realizan directamente desde URLs de Google (`googleusercontent.com` o `drive.google.com`) sin pasar por un proxy que audite el evento. |
| **F40-15** | Copias de seguridad de archivos y metadatos | P0 | Implementada parcialmente | `createSystemBackup` respalda hojas de cálculo en JSON, pero no incluye los archivos binarios almacenados en Google Drive. |
| **F40-16** | Recuperación y restauración verificable | P0 | Implementada parcialmente | `restoreSystemBackup` restaura tablas con código `RESTORE-CONFIRMED`, pero no verifica la integridad física de los archivos en Drive. |
| **F40-17** | Auditoría de solo lectura | P0 | Ausente | No existe un rol `Auditor` aislado en `ROLE_PERMISSIONS`. Quien tiene acceso a auditoría posee facultades administrativas amplias. |
| **F40-18** | Revisión de permisos heredados y accesos obsoletos | P1 | Ausente | No existe mecanismo automatizado para detectar accesos residuales tras desvinculación laboral o egreso de estudiantes. |
| **F40-19** | Alertas de actividad anómala | P1 | Ausente | No se disparan alertas ante ráfagas de descargas masivas o intentos reiterados de acceso a expedientes ajenos. |
| **F40-20** | Alertas de vencimiento y conservación | P1 | Implementada parcialmente | Existe `checkAndNotifyExpiringStudentDocuments` en academic-service para documentos de identidad por vencer. |
| **F40-21** | Doble autorización para operaciones críticas | P1 | Implementada parcialmente | Implementada en órdenes de compra > L. 50,000 (`approvePurchaseOrder`), pero ausente para destrucción o baja de documentos. |
| **F40-22** | Panel de integridad y relaciones documentales | P1 | Ausente | No existe interfaz directiva que liste archivos en Drive huérfanos o con discrepancias de hash. |
| **F40-23** | Detección de documentos huérfanos | P1 | Ausente | No hay conciliación entre archivos físicos en Google Drive y registros en `DocumentosEstudiante`. |
| **F40-24** | Exportación de evidencias de auditoría | P1 | Implementada parcialmente | `getAuditReport` devuelve JSON filtrado, pero no genera un archivo firmado e inmutable para auditorías externas. |
| **F40-25** | Clasificación automática asistida | P2 | Ausente | No se analizan metadatos o contenido OCR para sugerir automáticamente categoría de sensibilidad. |
| **F40-26** | Marcas de agua y seguimiento de copias | P2 | Ausente | Los PDFs generados y descargados no incorporan marcas de agua dinámicas con la identidad del usuario que consulta. |

---

## D. RESULTADOS DE LA MATRIZ DE PRUEBAS INTEGRALES (E2E-01 a E2E-06)

### E2E-01. Documento institucional desde su creación hasta su conservación
- **Procedimiento:** Generación de constancia mediante `generateSchoolDocument`, asignación de CUV correlativo, verificación pública y prueba de modificación.
- **Resultado Observado:** El documento se genera con CUV (`DOC-EM-...`) y correlativo `2026-000001`. `verifySchoolDocumentByCUV` autentica correctamente los metadatos. Sin embargo, no existe regla de bloqueo en Drive: un usuario con permisos de escritura en Drive puede sustituir el PDF sin que el CUV lo detecte si no se verifica el hash SHA-256.
- **Estado:** Aprobada con observaciones.

### E2E-02. Acceso no autorizado a un documento sensible
- **Procedimiento:** Solicitud de documento de empleado vía URL generada por `uploadEmployeeDocument` desde una sesión anónima en navegador privado.
- **Resultado Observado:** La URL `https://lh3.googleusercontent.com/d/[fileId]` abre el archivo inmediatamente sin solicitar inicio de sesión, debido al comando `file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)` ejecutado en línea 4536 de `backend/accounting-service/Code.gs`.
- **Estado:** FALLIDA (Vulnerabilidad Crítica P0 detectada).

### E2E-03. Modificación no autorizada de un documento firmado
- **Procedimiento:** Registro de firma en `registerDocumentSignature`, obtención de `tokenVerificacion` y alteración posterior de los datos del documento en la hoja `FirmasConformidades`.
- **Resultado Observado:** El token generado es pseudoaleatorio (`VERIF-` + `Math.random()`), no un HMAC-SHA256 del contenido binario del documento. Si un usuario con acceso de edición a la hoja modifica el registro, no hay firma digital criptográfica que evidencie la manipulación.
- **Estado:** FALLIDA (Requiere corrección criptográfica).

### E2E-04. Revocación de acceso compartido
- **Procedimiento:** Subida de comprobante de pago con URL pública generada, y posterior intento de revocación de acceso a nivel de usuario.
- **Resultado Observado:** Dado que el archivo se comparte como `ANYONE_WITH_LINK`, revocar los permisos de un usuario específico en la aplicación no anula el acceso de cualquier persona que conserve el enlace directo.
- **Estado:** FALLIDA (Dependencia de enlaces públicos en lugar de streaming autenticado).

### E2E-05. Recuperación de un documento y su historial
- **Procedimiento:** Ejecución de `createSystemBackup`, simulación de alteración en hoja `DocumentosEstudiante`, y restauración mediante `restoreSystemBackup` con `confirmCode: "RESTORE-CONFIRMED"`.
- **Resultado Observado:** Las filas de la hoja de cálculo se restauran satisfactoriamente y las versiones anteriores en `HistorialVersionesDocumentos` se preservan. No obstante, si un archivo en Drive fue eliminado, el respaldo no contiene los binarios para su restauración.
- **Estado:** Aprobada con observaciones (Restauración de metadatos completa; respaldo binario ausente).

### E2E-06. Auditoría independiente de solo lectura
- **Procedimiento:** Intento de consultar logs y documentos utilizando un usuario de auditoría sin privilegios de edición.
- **Resultado Observado:** No existe rol `Auditor` en `ROLE_PERMISSIONS`. Para consultar `getAuditReport` o `getStudentDocuments`, el usuario debe poseer rol `Administrador` o `Director`, otorgándole implícitamente facultades de creación, edición y aprobación en otros módulos.
- **Estado:** FALLIDA (Falta segregación de funciones para auditoría).

---

## E. COMPARACIÓN EXTERNA (BENCHMARK DE SEGURIDAD DOCUMENTAL)

| Capacidad Esperada | Comportamiento Existente en Plataforma | Referencia de Industria (Alfresco / Google Workspace / Laserfiche) | Brecha e Impacto | Mejora Necesaria |
|---|---|---|---|---|
| **Aislamiento de Archivos** | `setSharing(ANYONE_WITH_LINK)` para comprobantes y contratos laborales. | Enlaces autenticados con tokens temporales firmados criptográficamente (Signed URLs). | **CRÍTICO:** Exposición inadvertida de datos personales y financieros en la web. | Eliminar `ANYONE_WITH_LINK`; servir archivos exclusivamente mediante `getSecureDocumentStream`. |
| **Integridad de Archivos** | `computeSimpleHash` (hash no criptográfico DJB2) en respaldos; sin hash en subidas. | Checksums SHA-256 obligatorios en subida y comparación antes de entrega (AWS S3 / Alfresco). | **ALTO:** Imposibilidad de probar inalterabilidad o detectar corrupción silenciosa. | Implementar cálculo y persistencia de `HashSHA256` mediante `Utilities.computeDigest`. |
| **Firmas y Aprobaciones** | Token aleatorio `VERIF-` en `FirmasConformidades`. | Firma electrónica avanzada con sellado de tiempo (RFC 3161) y hash del documento vinculado. | **ALTO:** Vulnerabilidad ante repudio legal de documentos oficiales. | Vincular firmas a `HashSHA256` del documento con HMAC autenticado. |
| **Retención e Inmutabilidad** | Eliminación lógica por estado; sin políticas WORM. | Políticas WORM (Object Lock), retención por años y suspensión por litigio (Legal Hold). | **MEDIO:** Riesgo de borrado prematuro o incumplimiento de plazos legales de archivo. | Crear motor de políticas de retención con bloqueo formal de eliminación. |
| **Rol de Auditoría** | Acceso a logs restringido a administradores técnicos. | Rol de auditoría de solo lectura independiente (Read-Only Compliance Officer). | **MEDIO:** Conflicto de interés; el administrador puede auditar sus propias acciones. | Incorporar rol `Auditor` en `ROLE_PERMISSIONS` con permisos exclusivos de consulta y exportación. |

---

## F. LISTA MAESTRA DE CARACTERÍSTICAS Y CRITERIOS DE ACEPTACIÓN

| ID | Característica | Prioridad | Estado | Criterios de Aceptación Obligatorios |
|---|---|---|---|---|
| **CAR-F40-01** | Streaming Seguro y Eliminación de Enlaces Públicos | P0 | Defectuosa | Prohibir terminantemente `DriveApp.Access.ANYONE_WITH_LINK`. Toda descarga o visualización debe fluir mediante `getSecureDocumentStream` con validación de sesión. |
| **CAR-F40-02** | Verificación Criptográfica SHA-256 en Subida y Descarga | P0 | Defectuosa | Calcular `HashSHA256` usando `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)` y almacenarlo en metadatos para verificar inmutabilidad. |
| **CAR-F40-03** | Segregación de Rol de Auditoría de Solo Lectura | P0 | Ausente | Incorporar rol `Auditor` en `ROLE_PERMISSIONS` de todos los servicios backend, permitiendo consultar metadatos y logs sin permisos de edición ni descarga indiscriminada. |
| **CAR-F40-04** | Vinculación Criptográfica de Firmas y Documentos Aprobados | P0 | Requiere mejoras | Asociar en `FirmasConformidades` el hash SHA-256 del documento exacto aprobado, impidiendo sustituciones posteriores del binario. |
| **CAR-F40-05** | Bitácora de Auditoría Forense de Descargas y Accesos | P0 | Ausente | Registrar en `LogsSistema` todo evento de descarga (`DOCUMENT_DOWNLOADED`), consulta sensible (`DOCUMENT_VIEWED`) e intento denegado (`UNAUTHORIZED_ACCESS`). |
| **CAR-F40-06** | Motor de Políticas de Retención Documental y Bloqueo Legal | P1 | Ausente | Definir plazos de conservación por tipo documental y mecanismo de bloqueo (`LegalHold`) que impida eliminar documentos bajo investigación. |
| **CAR-F40-07** | Doble Autorización para Destrucción Documental | P1 | Ausente | Exigir dos aprobaciones de roles diferenciados (Dirección + Secretaría) antes de proceder con la baja o eliminación lógica definitiva. |
| **CAR-F40-08** | Conciliación y Detección de Documentos Huérfanos en Drive | P1 | Ausente | Rutina programada que detecte archivos en Drive no referenciados en hojas de cálculo y registros en hojas cuyos archivos fueron borrados. |

---

## G. BRECHAS Y MATRIZ DE RIESGOS

1. **Riesgo Crítico de Seguridad (P0): Exposición Pública de Documentos Sensibles**
   - *Brecha:* `uploadEmployeeDocument` y `uploadPaymentVoucher` configuran el archivo con acceso público a cualquiera que posea el enlace (`ANYONE_WITH_LINK`).
   - *Impacto:* Exposición de contratos laborales, salarios, DNI y comprobantes bancarios ante fugas de URLs o indexación accidental.
2. **Riesgo Crítico de Integridad (P0): Falta de Verificación SHA-256**
   - *Brecha:* No se calcula la huella criptográfica de los archivos al subirlos. Si un archivo es sustituido directamente en Drive, el sistema no detecta la alteración.
   - *Impacto:* Pérdida de valor probatorio legal de certificados, actas de notas y expedientes ante impugnaciones.
3. **Riesgo de Gobernanza (P0): Ausencia de Perfil de Auditoría Independiente**
   - *Brecha:* Los administradores generales tienen permisos totales sobre los registros y no existe un rol de solo lectura para fiscalización externa o interna.
   - *Impacto:* Falta de segregación de funciones exigida por marcos normativos de control interno.
4. **Riesgo de Trazabilidad (P1): Descargas No Auditadas**
   - *Brecha:* Las descargas se realizan directamente contra servidores de Google sin registrar en bitácora qué usuario descargó qué archivo y en qué momento.
   - *Impacto:* Imposibilidad de realizar análisis forense ante exfiltración de información confidencial.

---

## H. PLAN DE RESOLUCIÓN PRIORIZADO (BACKLOG FASE 40)

### Bloque 1: Seguridad Crítica, Aislamiento Criptográfico y Control de Acceso (P0)
- **[F40-Task01] [P0] Blindaje de almacenamiento y erradicación de enlaces públicos:** Reemplazar `file.setSharing(ANYONE_WITH_LINK)` por permisos estrictamente privados en Google Drive. Implementar tokenización efímera y entrega exclusiva mediante `getSecureDocumentStream`.
- **[F40-Task02] [P0] Implementación del motor de integridad criptográfica SHA-256:** Incorporar el cálculo automático de hash SHA-256 en `uploadStudentDocument`, `uploadEmployeeDocument` y `generateSchoolDocument`. Registrar el hash en columna dedicada y verificarlo antes de cada entrega.
- **[F40-Task03] [P0] Creación e integración del rol de Auditoría de Solo Lectura:** Registrar el rol `Auditor` en `ROLE_PERMISSIONS` de todos los microservicios backend, habilitando consultas de metadatos, visualización protegida y auditoría sin facultades de edición ni borrado.
- **[F40-Task04] [P0] Vinculación criptográfica de firmas electrónicas y aprobaciones:** Refactorizar `registerDocumentSignature` para ligar la firma al hash SHA-256 del documento final, registrando timestamp certificado y bloqueando sustituciones en Drive.
- **[F40-Task05] [P0] Auditoría forense obligatoria de consultas y descargas:** Incorporar logging estructurado en `getSecureDocumentStream` registrando usuario, rol, IP, documentoId, versión y resultado para garantizar trazabilidad de lectura y descarga.

### Bloque 2: Gobernanza, Retención y Recuperación Integral (P1)
- **[F40-Task06] [P1] Motor de retención documental, archivo pasivo y Legal Hold:** Implementar hoja `PoliticasRetencionDocumental` con plazos por categoría y bloqueo de eliminación ante investigaciones activas.
- **[F40-Task07] [P1] Flujo de doble autorización para disposición y baja documental:** Exigir aprobación combinada (Dirección + Secretaría) para la baja definitiva de documentos institucionales.
- **[F40-Task08] [P1] Panel de conciliación de integridad y detección de huérfanos:** Crear rutina de reconciliación entre Drive y Sheets que alerte sobre discrepancias de hash o archivos desvinculados.
- **[F40-Task09] [P1] Respaldo binario y verificación criptográfica de restauración:** Migrar `computeSimpleHash` a SHA-256 en respaldos y extender la copia de seguridad para incluir inventario criptográfico de archivos en Drive.

---

## I. CONCLUSIÓN Y MÉTRICAS CUANTITATIVAS DE AUDITORÍA

### Fórmulas Cuantitativas Obligatorias

$$\text{Cobertura de Inspección} = \frac{\text{Subcapacidades Inspeccionadas}}{\text{Subcapacidades Identificadas y Aplicables}} \times 100 = \frac{26}{26} \times 100 = 100.0\%$$

$$\text{Cobertura de Verificación} = \frac{\text{Subcapacidades con Pruebas Concluyentes}}{\text{Subcapacidades Identificadas y Aplicables}} \times 100 = \frac{22}{26} \times 100 = 84.62\%$$

### Distribución de Estados Funcionales
- **Completa y verificada:** 3 características (11.54%)
- **Implementada parcialmente:** 8 características (30.77%)
- **Requiere mejoras:** 3 características (11.54%)
- **Defectuosa:** 3 características (11.54%)
- **Ausente:** 9 características (34.61%)
- **Pendiente de verificación / Bloqueada:** 0 características (0.00%)

### Dictamen Final
**FASE 40: REQUIERE MEJORAS / NO CERTIFICADA PARA PRODUCCIÓN CRÍTICA.**
Si bien la plataforma cuenta con una base sólida de versionado documental (`HistorialVersionesDocumentos`) y emisión verificable con CUV (`verifySchoolDocumentByCUV`), la existencia de enlaces compartidos públicos en Drive (`ANYONE_WITH_LINK`), la ausencia de huellas SHA-256 para verificar inmutabilidad de archivos y la falta de un rol segregado de auditoría impiden otorgar la certificación de seguridad documental en su estado actual.

---

## J. REGISTRO CONSOLIDADO DE AVANCE

| ID | Característica Evaluada | Estado Funcional | Inspección | Verificación | Evidencia de Código | Brecha Principal | Próximo Paso |
|---|---|---|---|---|---|---|---|
| F40-01 | Permisos por operación | Implementada parcialmente | 100% | Concluyente | `ROLE_PERMISSIONS` en servicios | Sin separación lectura/descarga | Implementar token de descarga |
| F40-02 | Restricciones por sensibilidad | Requiere mejoras | 100% | Concluyente | `DocumentosEstudiante` | Falta taxonomía formal de sensibilidad | Agregar columna `NivelSensibilidad` |
| F40-03 | Control por ámbito | Implementada parcialmente | 100% | Concluyente | `assertRecordOwnership` | Verificación perimetral incompleta | Reforzar ABAC en consultas |
| F40-04 | Registro de origen | Implementada parcialmente | 100% | Concluyente | `uploadStudentDocument` | Sin canal ni IP de origen | Capturar metadata completa |
| F40-05 | Historial y trazabilidad | Requiere mejoras | 100% | Concluyente | `LogsSistema`, `HistorialVersiones` | Sin registro de lecturas | Auditar `getSecureDocumentStream` |
| F40-06 | Versionado de archivos | Completa y verificada | 100% | Concluyente | `restoreDocumentVersion` | Ninguna crítica | Mantener modelo vigente |
| F40-07 | Relación plantilla-CUV | Completa y verificada | 100% | Concluyente | `generateSchoolDocument` | Ninguna crítica | Mantener correlativos y CUV |
| F40-08 | Protección de aprobados | Requiere mejoras | 100% | Concluyente | `FirmasConformidades` | No bloquea binario en Drive | Sellar con hash SHA-256 |
| F40-09 | Integridad criptográfica | Defectuosa | 100% | Concluyente | `computeSimpleHash` | Hash ad-hoc DJB2 no seguro | Migrar a SHA-256 nativo |
| F40-10 | Validación de formatos | Completa y verificada | 100% | Concluyente | Magic Bytes en upload | Ninguna crítica | Mantener validación MIME |
| F40-11 | Retención y conservación | Ausente | 100% | Concluyente | N/A | Sin motor de purga ni retención | Crear `PoliticasRetencion` |
| F40-12 | Bloqueos y eliminación | Implementada parcialmente | 100% | Concluyente | `updateDocumentStatus` | Sin doble autorización | Crear flujo de baja documental |
| F40-13 | Enlaces y compartición | Defectuosa | 100% | Concluyente | `setSharing(ANYONE_WITH_LINK)` | URLs públicas en archivos laborales | Eliminar enlaces públicos |
| F40-14 | Control de descargas | Ausente | 100% | Concluyente | URLs directas a Google | Descargas fuera de auditoría | Servir por stream autenticado |
| F40-15 | Respaldos de sistema | Implementada parcialmente | 100% | Concluyente | `createSystemBackup` | Respalda Sheets, no binarios Drive | Añadir manifiesto de archivos |
| F40-16 | Restauración verificable | Implementada parcialmente | 100% | Concluyente | `restoreSystemBackup` | Sin verificación SHA-256 de Drive | Incorporar chequeo de binarios |
| F40-17 | Auditoría de solo lectura | Ausente | 100% | Concluyente | `ROLE_PERMISSIONS` | Sin rol `Auditor` aislado | Crear rol y registrar permisos |
| F40-18 | Permisos obsoletos | Ausente | 100% | Concluyente | N/A | Sin barrido de permisos residuales | Programar tarea de depuración |
| F40-19 | Alertas anómalas | Ausente | 100% | Concluyente | N/A | Sin detección de descargas masivas | Crear umbrales en `LogsSistema` |
| F40-20 | Alertas de vencimiento | Implementada parcialmente | 100% | Concluyente | `checkAndNotifyExpiring...` | Solo cubre carnés estudiantiles | Extender a todo expediente |
| F40-21 | Doble autorización | Implementada parcialmente | 100% | Concluyente | `approvePurchaseOrder` | Solo en órdenes de compra | Aplicar a eliminación documental |
| F40-22 | Panel de integridad | Ausente | 100% | Concluyente | N/A | Sin UI de salud documental | Desarrollar vista directiva |
| F40-23 | Detección de huérfanos | Ausente | 100% | Concluyente | N/A | Sin cruce Drive vs Sheets | Script de conciliación periódica |
| F40-24 | Exportación de evidencias | Implementada parcialmente | 100% | Concluyente | `getAuditReport` | Solo JSON crudo en pantalla | Generar reporte sellado |
| F40-25 | Clasificación asistida | Ausente | 100% | Concluyente | N/A | Sin sugerencias inteligentes | Evaluar en fase posterior |
| F40-26 | Marcas de agua dinámicas | Ausente | 100% | Concluyente | N/A | PDFs sin sello de visualizador | Añadir watermark en visualizador |

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las nueve tareas descritas en el plan H (F40-Task01..F40-Task09), conservando sus prioridades P0/P1. Se añaden F40-Task24..F40-Task30 para cubrir características F40-18..F40-20 y F40-24..F40-26, además de una suite E2E de seguridad documental, que no tienen tareas independientes en el plan H. Auditoria.txt registra 23 tareas históricas (01..23), pero no conserva descripciones de Task10..Task23; no se inventan ni se reutilizan esos IDs.

### [F40-Task01] Blindar almacenamiento y erradicar enlaces públicos
- **Hallazgo de origen:** F40-01/F40-02/F40-03/F40-13; E2E-02/E2E-04.
- **Severidad:** Crítica / P0. **Objetivo:** impedir acceso anónimo y limitar lectura/descarga según sensibilidad, expediente, departamento y operación.
- **Acción ejecutable:** retirar `ANYONE_WITH_LINK` de documentos laborales/financieros; establecer ACL privadas; implementar `getSecureDocumentStream` con token efímero vinculado a usuario/documento/versión/operación; aplicar ABAC en backend y taxonomía `NivelSensibilidad` (médico, disciplinario, financiero, académico, laboral).
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `uploadEmployeeDocument`, `uploadPaymentVoucher`, `getStudentDocuments`, `ROLE_PERMISSIONS`, `DocumentosEstudiante`.
- **Dependencias/riesgos:** TASK-296 (ACL/enlaces Drive seguros), AUD-NG-158/TASK-502 (ABAC), AUD-NG-127 (HMAC), F31-Task09/F34-Task04/F39-Task02; riesgo de enlaces filtrados y acceso fuera de ámbito.
- **Alcance:** almacenamiento privado y entrega autenticada; no confiar en URL directa de Drive ni en ID enviado por cliente.
- **Criterios de aceptación:** ningún archivo sensible con ANYONE_WITH_LINK; token aleatorio firmado y de vida corta; usuario/ámbito/documento/versión/operación validados server-side; categorías de sensibilidad con permisos mínimos; revocación efectiva; pruebas anónimas, IDOR, enlace filtrado, cambio de rol y revocación.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; E2E-02/E2E-04 fallan por URLs públicas en contratos laborales y comprobantes.

### [F40-Task02] Implementar integridad criptográfica SHA-256 en binarios
- **Hallazgo de origen:** F40-09; E2E-01/E2E-05.
- **Severidad:** Crítica / P0. **Objetivo:** detectar alteraciones o sustituciones de archivos en Drive y respaldos.
- **Acción ejecutable:** calcular SHA-256 sobre bytes al subir/generar; persistir hash por versión; verificar antes de entregar/restaurar; sustituir `computeSimpleHash` (DJB2) por SHA-256 criptográfico.
- **Archivos/módulos:** `uploadStudentDocument`, `uploadEmployeeDocument`, `uploadPaymentVoucher`, `generateSchoolDocument`, `createSystemBackup`, `restoreSystemBackup`, `HistorialVersionesDocumentos`.
- **Dependencias/riesgos:** F34-Task04, F39-Task02, F29-Task11/15, F27-Task03; riesgo de calcular hash de URL/metadatos o de no asociarlo a la versión exacta.
- **Alcance:** hash de contenido binario; no afirmar autenticidad de autor ni firma legal por usar SHA-256.
- **Criterios de aceptación:** hash de bytes original/final; registro por versión; verificación antes de entrega y restauración; discrepancia bloquea operación y genera incidente; pruebas de sustitución, corrupción, archivo ausente y re-subida.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se calcula SHA-256 en upload y backup usa DJB2 simple.

### [F40-Task03] Crear rol segregado de Auditor de solo lectura
- **Hallazgo de origen:** F40-17; E2E-06.
- **Severidad:** Crítica / P0. **Objetivo:** permitir fiscalización independiente sin facultades de crear, editar, aprobar, borrar o administrar.
- **Acción ejecutable:** registrar rol `Auditor` en ROLE_PERMISSIONS de todos los servicios; permitir consultas explícitas de metadatos/logs y visualización protegida vía stream; negar por defecto cualquier mutación y limitar ámbitos/documentos.
- **Archivos/módulos:** `ROLE_PERMISSIONS` en servicios User/Academic/Accounting/Developer, `getAuditReport`, `getStudentDocuments`, panel de auditoría.
- **Dependencias/riesgos:** TASK-502/AUD-NG-222 (RBAC/ABAC), AUD-NG-158, F37-Task02; riesgo de rol nominal que herede permisos administrativos por fallback.
- **Alcance:** rol read-only segregado; no crear un perfil que herede permisos de Director/Admin.
- **Criterios de aceptación:** matriz explícita de permisos por operación; mutaciones denegadas en backend; acceso por ámbito; lectura/descarga auditada; pruebas negativas CRUD, aprobación, configuración, eliminación y acceso cruzado.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; E2E-06 falla porque no existe rol Auditor aislado.

### [F40-Task04] Vincular firmas y aprobaciones al hash del documento final
- **Hallazgo de origen:** F40-08; E2E-03.
- **Severidad:** Crítica / P0. **Objetivo:** impedir que un documento aprobado o firmado sea sustituido sin detección.
- **Acción ejecutable:** refactorizar `registerDocumentSignature` para registrar SHA-256 del binario final, identidad verificada, versión, timestamp de servidor y evidencia de consentimiento; bloquear reemplazo de versión aprobada y exigir nueva versión/flujo de rectificación.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `registerDocumentSignature`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`, Drive y `getSecureDocumentStream`.
- **Dependencias/riesgos:** F40-Task01/02, F33-Task07, F34-Task07, F31-Task07/13; riesgo de presentar token pseudoaleatorio como firma electrónica avanzada.
- **Alcance:** integridad y evidencia de conformidad; no declarar firma avanzada PKI/certificada sin proveedor y análisis legal.
- **Criterios de aceptación:** firma vinculada a hash/versión exacta; identidad y consentimiento trazables; sustitución bloqueada; cambio produce nueva versión y requiere nueva aprobación; verificación detecta alteración; pruebas de modificación directa, replay y firma sobre versión anterior.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el token actual usa `Math.random()` y no está ligado al contenido binario.

### [F40-Task05] Implementar auditoría forense de consultas, vistas y descargas
- **Hallazgo de origen:** F40-04/F40-05/F40-14; brecha de procedencia y eventos de lectura.
- **Severidad:** Crítica / P0. **Objetivo:** reconstruir quién consultó/descargó qué documento, en qué versión, desde qué canal y con qué resultado.
- **Acción ejecutable:** instrumentar `getSecureDocumentStream` y consultas documentales con actor, rol, documentoId, versión, operación, canal de origen, timestamp, IP cuando sea legalmente procedente, resultado y correlationId; sanitizar payloads.
- **Archivos/módulos:** servicios User/Academic/Accounting, `LogsSistema`, `RegistroEventos`, `getAuditReport`, `getSecureDocumentStream`.
- **Dependencias/riesgos:** AUD-NG-145 (bitácora), AUD-NG-083 (correlación interservicio), F30-Task06; riesgo de registrar PII excesiva o permitir que el actor altere los logs.
- **Alcance:** trazabilidad de operaciones documentales; no guardar tokens, contenido sensible ni datos innecesarios.
- **Criterios de aceptación:** eventos de lectura/descarga/denegación; actor derivado de sesión; origen/canal y correlationId; logs append-only y protegidos; consulta por Auditor; pruebas de descarga directa bloqueada, stream autorizado, acceso denegado y logs sanitizados.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se registran consultas ni descargas y las URLs directas evitan el backend.

### [F40-Task06] Implementar motor de retención, archivo pasivo y Legal Hold
- **Hallazgo de origen:** F40-11; falta de política y ejecución de conservación.
- **Severidad:** Alta / P1. **Objetivo:** aplicar plazos de retención por categoría y bloquear eliminación cuando exista obligación legal/investigación.
- **Acción ejecutable:** ampliar `AUD-NG-146/TASK-499` con `PoliticasRetencionDocumental`, categorías, plazo, inicio de cómputo, archivo, legal hold, trigger programado, notificación y bitácora; distinguir archivo lógico de borrado.
- **Archivos/módulos:** `backend/user-service/Code.gs`, servicios Academic/Accounting, `PoliticasRetencionDocumental`, `executeDataRetentionPolicyCheck`, Drive.
- **Dependencias/riesgos:** AUD-NG-146/TASK-499, TASK-500 (anonimización), F29-Task15, asesoría legal; riesgo de purgar documentos sujetos a retención o legal hold.
- **Alcance:** política y archivo de documentos; no ejecutar purga irreversible sin autorización y verificación legal.
- **Criterios de aceptación:** reglas por categoría/fecha; trigger real y monitoreado; legal hold bloquea; archivo conserva hash/ACL/relación; simulación previa; aprobación de baja; pruebas de vencimiento, hold, archivo y reanudación.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-499/AUD-NG-146).
- **Evidencia de cierre:** pendiente; el informe no encuentra motor de purga ni política WORM/Legal Hold ejecutable.

### [F40-Task07] Exigir doble autorización para destrucción y baja documental
- **Hallazgo de origen:** F40-12/F40-21; baja lógica sin doble autorización.
- **Severidad:** Alta / P1. **Objetivo:** impedir destrucción irreversible por una sola cuenta o por un rol que también solicita la baja.
- **Acción ejecutable:** crear flujo de disposición con solicitante, motivo, documento/versión/hash, aprobación de Dirección y Secretaría, legal hold, periodo de gracia y ejecución separada; conservar tombstone y acta.
- **Archivos/módulos:** servicios User/Academic/Accounting, `updateDocumentStatus`, `FirmasConformidades`, `PoliticasRetencionDocumental`.
- **Dependencias/riesgos:** F40-Task06, F30-Task08 (delegación), F34-Task07 (conformidad), TASK-502; riesgo de autoaprobación o destrucción durante investigación.
- **Alcance:** disposición/baja documental; no borrar archivos directamente desde el cliente ni eliminar historial.
- **Criterios de aceptación:** dos aprobadores distintos; separación solicitante/aprobador/ejecutor; legal hold comprobado; periodo de gracia configurable; acta firmada; tombstone y hash conservados; pruebas de autoaprobación, revocación y documento retenido.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; doble aprobación existe solo en órdenes de compra, no en disposición documental.

### [F40-Task08] Crear panel de integridad y conciliación de documentos huérfanos
- **Hallazgo de origen:** F40-22/F40-23; ausencia de conciliación Drive↔Sheets.
- **Severidad:** Alta / P1. **Objetivo:** identificar archivos sin registro, registros sin binario, hash discrepante y relaciones rotas.
- **Acción ejecutable:** ampliar escáner de F37-Task05 con conciliación entre Drive, `DocumentosEstudiante`, `DocumentosEscolaresEmitidos` y manifiestos; presentar estado, hash, propietario, expediente, discrepancia y acción sugerida.
- **Archivos/módulos:** servicios Developer/Academic/User, panel Dirección, `DocumentosEstudiante`, `DocumentosEscolaresEmitidos`, `CorrespondenciaIdentificadores`.
- **Dependencias/riesgos:** F37-Task05/09, F39-Task02/03/19, F40-Task02/05; riesgo de eliminar automáticamente archivos sin contexto.
- **Alcance:** diagnóstico y conciliación; no reparar ni borrar automáticamente.
- **Criterios de aceptación:** archivos huérfanos y registros sin archivo diferenciados; hash comparado; filtros por departamento/fecha/tipo; acceso por rol; acciones sugeridas con aprobación; pruebas de archivo movido, borrado, duplicado y expediente sin referencia.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no existe panel ni proceso de conciliación entre Drive y Sheets.

### [F40-Task09] Extender respaldos para incluir binarios y restauración verificable
- **Hallazgo de origen:** F40-15/F40-16; E2E-05.
- **Severidad:** Alta / P1. **Objetivo:** recuperar documentos físicos en Drive además de metadatos/filas de Sheets.
- **Acción ejecutable:** ampliar `createSystemBackup` con manifiesto de archivos, IDs/versiones, SHA-256, ubicación, ACL y referencias; verificar hash antes de restaurar; recuperar binarios faltantes y reconciliar vínculos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `createSystemBackup`, `restoreSystemBackup`, `HistorialVersionesDocumentos`, Drive y manifiesto de backup.
- **Dependencias/riesgos:** TASK-151/TASK-152, AUD-NG-146, F27-Task03, F29-Task04/11; riesgo de respaldos incompletos o de restaurar ACL públicas.
- **Alcance:** backup/restauración de binarios y metadatos; no declarar RPO/RTO sin medición y simulacros.
- **Criterios de aceptación:** manifiesto por archivo; hash validado; binarios recuperables; ACL privada; preview y rollback; prueba de archivo borrado/sustituido, backup corrupto y restauración parcial.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-151/152/AUD-NG-146).
- **Evidencia de cierre:** pendiente; E2E-05 restaura hojas, pero no puede recuperar binarios eliminados de Drive.

### [F40-Task24] Revisar y revocar permisos heredados u obsoletos automáticamente
- **Hallazgo de origen:** F40-18; accesos residuales tras egreso o desvinculación laboral.
- **Severidad:** Alta / P1. **Objetivo:** retirar accesos que ya no corresponden a la relación laboral, académica o familiar vigente.
- **Acción ejecutable:** programar revisión de ACL por recurso y ámbito; comparar con estado de usuario/relación; proponer revocación de permisos directos/heredados y registrar excepciones aprobadas.
- **Archivos/módulos:** servicios User/Developer, Google Drive ACL, `ROLE_PERMISSIONS`, `Usuarios`, matrículas, contratos y relaciones familiares.
- **Dependencias/riesgos:** TASK-502/AUD-NG-222 (ABAC), F29-Task17 (roles/privacidad), F40-Task01/06; riesgo de revocar acceso legítimo por datos de RRHH/egreso desactualizados.
- **Alcance:** auditoría y revocación controlada; no revocar Shared Drive/propiedad sin validar custodio y política.
- **Criterios de aceptación:** barrido programado; fuentes de estado canónicas; permisos residuales reportados; revocación con aprobación según categoría; excepciones con vencimiento; pruebas de empleado egresado, estudiante graduado, tutor y permiso heredado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F40-18 se encuentra ausente y no hay barrido automatizado de ACL residuales.

### [F40-Task25] Detectar actividad documental anómala y alertar a responsables
- **Hallazgo de origen:** F40-19; ausencia de alertas por descargas masivas o intentos reiterados.
- **Severidad:** Alta / P1. **Objetivo:** detectar patrones compatibles con exfiltración o abuso de acceso.
- **Acción ejecutable:** ampliar AUD-NG-145/TASK-064 con reglas por ventana: descargas por usuario, volumen/bytes, múltiples expedientes, fallos de autorización y accesos fuera de patrón; deduplicar alertas y preservar evidencia.
- **Archivos/módulos:** `LogsSistema`, `RegistroEventos`, `getSecureDocumentStream`, panel de seguridad y notificaciones.
- **Dependencias/riesgos:** F40-Task05, AUD-NG-145, TASK-064, AUD-NG-144; riesgo de falsos positivos o de perfilar usuarios sin política de privacidad.
- **Alcance:** detección basada en eventos autorizados; no bloquear cuentas automáticamente sin umbrales/flujo de revisión.
- **Criterios de aceptación:** umbrales configurables por rol/ámbito; alertas deduplicadas; evidencia/correlationId; notificación a responsables; supresión/revisión; pruebas de descarga masiva, ráfaga de denegaciones y actividad normal.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F40-19 no tiene mecanismo de alertas anómalas.

### [F40-Task26] Extender alertas de vencimiento y conservación a todas las categorías
- **Hallazgo de origen:** F40-20; cobertura parcial limitada a documentos de identidad.
- **Severidad:** Media / P1. **Objetivo:** avisar sobre vencimiento, renovación, revisión o fin de retención de cada categoría documental aplicable.
- **Acción ejecutable:** ampliar `checkAndNotifyExpiringStudentDocuments` con reglas por categoría, responsable y calendario; diferenciar vencimiento del documento, fecha de revisión y fin de retención; respetar Legal Hold.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/user-service/Code.gs`, `PoliticasRetencionDocumental`, notificaciones y dashboard.
- **Dependencias/riesgos:** F40-Task06, TASK-316, TASK-064; riesgo de alertar fechas erróneas o purgar documentos aún vigentes.
- **Alcance:** alertas de vigencia/conservación; no automatizar baja documental al vencer.
- **Criterios de aceptación:** reglas por categoría; responsables y anticipación configurables; Legal Hold suspende acciones; deduplicación y estado de entrega; pruebas identidad, contrato, comprobante, expediente cerrado y retención suspendida.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la función actual solo cubre carnés/documentos de identidad de estudiantes.

### [F40-Task27] Exportar evidencias de auditoría en informe sellado e inmutable
- **Hallazgo de origen:** F40-24; `getAuditReport` solo devuelve JSON.
- **Severidad:** Media / P1. **Objetivo:** entregar evidencia reproducible para auditoría externa con integridad verificable y filtros explícitos.
- **Acción ejecutable:** generar paquete PDF/CSV/JSON con criterios, rango temporal, filtros, hash SHA-256, firma institucional autorizada, manifiesto y cadena de custodia; permitir solo a Auditor/roles habilitados.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `getAuditReport`, exportador, F40-Task02/03/05 y almacenamiento privado.
- **Dependencias/riesgos:** F24-Task04 (exportación), F30-Task06 (correlación), F40-Task02/03/05; riesgo de exportar datos fuera de alcance o llamar "firmado" a un PDF sin firma válida.
- **Alcance:** paquete de evidencia verificable; no modificar logs fuente ni permitir que el exportador altere el rango consultado.
- **Criterios de aceptación:** filtros y fuentes visibles; hash del paquete; firma/autorización verificable; manifest de archivos; redacción de PII; acceso auditado; pruebas de integridad, rango, rol y reexportación.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe confirma JSON filtrado pero no exportación firmada/inmutable.

### [F40-Task28] Implementar clasificación asistida de sensibilidad documental
- **Hallazgo de origen:** F40-25; ausencia de análisis de metadatos/OCR para sugerir categoría.
- **Severidad:** Media / P2. **Objetivo:** ayudar a etiquetar documentos sensibles sin confiar ciegamente en clasificación automática.
- **Acción ejecutable:** sugerir categoría usando tipo, origen, metadatos y texto OCR autorizado; mostrar confianza y explicación; requerir confirmación de usuario autorizado; aplicar etiqueta de sensibilidad a permisos/retención.
- **Archivos/módulos:** servicios Academic/User/Developer, `NivelSensibilidad`, F39-Task04/19/20, OCR y catálogo documental.
- **Dependencias/riesgos:** F40-Task01/06, F39-Task04/19, F38-Task02; riesgo de falsos negativos en datos médicos/financieros o de indexar contenido sensible sin autorización.
- **Alcance:** sugerencia asistida y revisión humana; no asignar automáticamente permisos ni tomar decisiones legales por modelo.
- **Criterios de aceptación:** categorías controladas; score/explicación; revisión humana; fallback conservador para documentos ambiguos; auditoría de cambios; pruebas de falsos positivos/negativos y datos sensibles.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F40-25 está ausente.

### [F40-Task29] Añadir marcas de agua dinámicas y trazabilidad de copias consultadas
- **Hallazgo de origen:** F40-26; PDFs sin marca del usuario que los visualiza.
- **Severidad:** Media / P2. **Objetivo:** disuadir redistribución no autorizada y vincular una copia visible a la sesión/usuario que la recibió.
- **Acción ejecutable:** renderizar watermark en el stream/preview con identidad minimizada, timestamp y código de seguimiento; no alterar el original custodiado; registrar la versión marcada y su destinatario.
- **Archivos/módulos:** `getSecureDocumentStream`, visor PDF, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs` y generador PDF.
- **Dependencias/riesgos:** F40-Task01/02/05, F32-Task01 y privacidad; riesgo de incluir PII excesiva o romper validez/integridad del original.
- **Alcance:** copia de consulta/descarga marcada; no añadir marca al original oficial ni usar watermark como control de acceso.
- **Criterios de aceptación:** marca ligada a usuario/versión/tiempo; datos minimizados; original sin modificación; salida marcada conserva hash separado; watermark no oculta contenido; pruebas de impresión, descarga, sesión y documentos de alta sensibilidad.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F40-26 está ausente.

### [F40-Task30] Automatizar los seis escenarios E2E de seguridad y conservación documental
- **Hallazgo de origen:** E2E-01..E2E-06; cobertura de verificación 22/26 y tres escenarios fallidos.
- **Severidad:** Crítica / P0 para bloqueos de producción. **Objetivo:** convertir las pruebas integrales en regresiones reproducibles que impidan liberar una versión con enlaces públicos, firma desvinculada o falta de rol Auditor.
- **Acción ejecutable:** ampliar AUD-NG-161 con fixtures de documento sensible, usuario anónimo, auditor, firma, revocación, backup binario y alteración; probar flujo completo desde creación hasta retención/restauración.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, servicios User/Academic/Accounting/Developer, entorno aislado y harness E2E.
- **Dependencias/riesgos:** F40-Task01..Task29 y AUD-NG-161; riesgo de probar solo presencia de funciones o de tocar Drive productivo.
- **Alcance:** pruebas E2E aisladas; no enviar documentos reales ni compartir enlaces públicos durante pruebas.
- **Criterios de aceptación:** seis escenarios automatizados; E2E-02/03/04/06 bloquean release hasta pasar; E2E-01/05 validan hash/backup binario; fixtures sintéticos; limpieza/rollback; evidencia ligada a commit/deployment.
- **Prioridad:** P0 para gates de seguridad. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz reporta tres escenarios fallidos y dos aprobados con observaciones.

### Reconciliaciones y discrepancias transversales de Fase 40
- **F40-Task01:** retirar ACL públicas y servir mediante stream; TASK-296/AUD-NG-158 se amplían, no se duplican.
- **F40-Task02:** usar un servicio SHA-256 común con F34-Task04/F39-Task02/F29-Task11; eliminar DJB2 para integridad criptográfica.
- **F40-Task03:** crear rol Auditor segregado y de solo lectura; coordinar con TASK-502/AUD-NG-222, sin herencia de Admin/Director.
- **F40-Task04:** firma vinculada a hash/versión; coordinar con F33-Task07/F34-Task07 y aclarar que no equivale automáticamente a firma avanzada.
- **F40-Task05:** ampliar AUD-NG-145/AUD-NG-083 con eventos de lectura/descarga; no crear una bitácora paralela.
- **F40-Task06:** ampliar TASK-499/AUD-NG-146; TASK-500 cubre anonimización, no retención.
- **F40-Task07:** doble autorización documental separada de aprobación de compras.
- **F40-Task08:** ampliar F37-Task05/09 y F39-Task19 para conciliación Drive/Sheets.
- **F40-Task09:** ampliar TASK-151/152/AUD-NG-146 con binarios; no declarar RPO/RTO sin pruebas.
- **F40-Task24..Task30:** derivadas de F40-18..20/F40-24..26 y E2E; no corresponden a una reconstrucción de los IDs históricos ausentes.
- **Discrepancia histórica:** Auditoria.txt registra 23 tareas F40-Task01..F40-Task23 (P0 01-14, P1 15-21, P2 22-23), pero el informe H describe solo Task01..Task09 (P0 01-05, P1 06-09). No hay descripciones recuperables de Task10..Task23 en el informe ni en la bitácora. Se dejan como referencias históricas sin alcance; no se inventan ni se consulta Pendientes.md.
- **Métricas históricas:** 53/53 pruebas generales, inspección 26/26 y verificación 22/26; no se reejecutaron en esta migración documental.
- **Dictamen preservado:** Requiere Mejoras / No Aprobada para Producción Crítica hasta subsanar brechas P0.
- **Estado global:** F40-Task01..Task09 y F40-Task24..Task30 permanecen pendientes de ejecución/revalidación; Task10..Task23 quedan como referencias históricas sin descripción recuperable.
