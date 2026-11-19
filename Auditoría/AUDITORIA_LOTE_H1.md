# Informe de auditoría - Lote H1

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD inspeccionado:** 9ddc1280eaf3ddb8586d454859c6b040be12993c  
**Tareas:** REQ-DOC-007, REQ-DOC-008 y REQ-DOC-009

## Alcance y método

Se revisaron el flujo de carga y composición de actividades del dashboard estudiantil, los renderizadores por asignatura, los DTO de tareas, las funciones de creación de carpetas y carga a Drive, el helper de carga reanudable y el registro de metadatos documentales.

La revisión fue estática y manual. No se modificó código fuente, no se ejecutaron pruebas de interfaz/endpoints y no se accedió a Google Drive o Sheets productivos.

## REQ-DOC-007 - Visualización de tareas y recursos en el dashboard estudiantil

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-153.

### Evidencia

- student-dashboard.html:145-188 contiene la vista de actividades, el selector de parcial, subject-info-container y tasks-list.
- js/student.js:1257-1304 construye allActivitiesData combinando la respuesta de TASK/getStudentTasks y EXAM/getStudentExams. No incorpora los materiales de getStudyMaterials en esa colección; esos recursos se cargan por separado en el flujo del aula virtual.
- js/student.js:1608-1750 implementa renderSubjectNavigation, crea tarjetas expandibles por asignatura y permite explorar las actividades de un parcial. Esta parte está implementada.
- renderSubjectNavigation (js/student.js:1697 y siguientes) construye pendingActivities considerando pendiente cualquier actividad sin entrega, sin excluir tipoRecurso GuiaEstudio o MaterialApoyo. Por ello una guía representada como actividad de Tareas se cuenta como pendiente y puede aparecer como prioridad de entrega.
- getActivityHtml (js/student.js:1816-1975) muestra título, asignatura, fecha límite, descripción y algunos estados de entrega. No presenta el tema. El DTO getStudentTasks (backend/task-service/Code.gs:613-685) tampoco devuelve tema, por lo que no existe dato para mostrarlo.
- El DTO sí devuelve parcial y fecha límite; el parcial se utiliza para filtrar y se muestra en el selector global, pero no se presenta como dato de cada tarjeta.
- getActivityHtml muestra estados de entregas registradas y calcula etiquetas Vencida/Por Vencer/A tiempo. La etiqueta Vencida (-50% Pts) se calcula para cualquier actividad sin entrega, incluso si tipoRecurso es GuiaEstudio/MaterialApoyo. No hay una etiqueta explícita Pendiente para una actividad no entregada.
- La rama visual de guías en js/student.js:1820-1823 no genera botón de entrega, pero getStudentTasks no devuelve archivoUrl, aunque el renderer lo consulta para crear el enlace. La guía representada como fila de Tareas aparece como "Sin archivo adjunto".
- Los materiales educativos del aula virtual no se incorporan a las tarjetas de asignatura; se cargan por otro flujo. La vista dedicada de guías tampoco quedó conectada según la revisión de REQ-DOC-001.

### Evaluación de calidad e impacto

El agrupamiento por asignatura, expansión y visualización básica de título/asignatura/fecha están implementados. Sin embargo, el requisito de tema no puede cumplirse porque el DTO no lo entrega; los materiales educativos no se integran en las tarjetas y las guías marcadas como actividades pueden contarse como pendientes y recibir una etiqueta de vencimiento/penalización visual. La separación visual no es consistente en el resumen de asignaturas.

## REQ-DOC-008 - Estructura jerárquica de carpetas en Google Drive y nomenclatura

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-154.

### Evidencia

- uploadFile (backend/task-service/Code.gs:704-779) crea carpetas bajo DRIVE_FOLDER_ID en este orden: grado, sección, alumno, parcial, asignatura y carpeta de tarea/alumno. Esta estructura no coincide con la ruta requerida Área/New Generation/Docentes/Asignaturas/[Nombre]/[Año]/Parcial I..IV/[Tipo].
- getOrCreateFolder (backend/task-service/Code.gs:1455-1472) solo aplica trim al nombre y usa getFoldersByName con coincidencia exacta. No normaliza mayúsculas/minúsculas, acentos ni variaciones de espacios, y no sanitiza el nombre. El resultado puede crear carpetas duplicadas ante variaciones triviales. Además, no comprueba el booleano devuelto por tryLock antes de continuar.
- En ACADEMIC se encontró initializeDirectionSecretaryDriveStructure (backend/academic-service/Code.gs:4246-4265), que prepara New Generation/Direccion/Secretaria/Compartido_Direccion_Secretaria; no implementa la jerarquía documental de Docentes/Asignaturas/Año/Parcial/Tipo.
- Para archivos de 9.5 MB o más, js/student.js:2210-2216 y 2301-2315 selecciona window.uploadResumableFile. El helper js/ui-common.js:2732-2775 llama initiateResumableUpload.
- backend/task-service/Code.gs define initiateResumableUpload en 1819-1900, pero la acción no está en ROLE_PERMISSIONS de Estudiante/Alumno (líneas 109-118) ni aparece como case en el router doPost (líneas 375-415). El flujo de carga reanudable no puede iniciar desde el dashboard estudiantil.
- Si esa ruta se habilitara sin completar el diseño, initiateResumableUpload crea sesiones bajo .temp_resumable_uploads y reconstructFileParts (2120 y siguientes) guarda el archivo final en esa carpeta de sesión, sin moverlo a la jerarquía institucional requerida.
- El helper de ui-common devuelve únicamente sessionKey en onSuccess (línea 2775); js/student.js lo asigna como fileId/folderId (línea 2315), aunque el backend de uploadChunk/reconstructFileParts maneja un Drive fileId real. El identificador persistido en la entrega no sería el ID real del archivo/carpeta.

### Evaluación de calidad e impacto

Existe una función de creación de carpetas y un flujo de carga directa para entregas, pero la jerarquía no corresponde a la especificación y la normalización no evita duplicados por variaciones triviales. El flujo reanudable para archivos grandes está desconectado del router/permisos y contiene además una discrepancia de identificadores. No puede considerarse implementada la estructura estandarizada para los archivos requeridos.

## REQ-DOC-009 - Registro de metadatos documentales en Spreadsheet

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-155.

### Evidencia

- logFileMetadata (backend/task-service/Code.gs:29-60) crea la hoja MetadatosArchivos con 19 columnas y genera un ID META. No almacena datos binarios en las celdas, lo que sí cumple parte del criterio.
- uploadFile llama a logFileMetadata (backend/task-service/Code.gs:766-778) y envía fileName, fileId, fileUrl, mimeType, sizeBytes, tareaId, asignatura, parcial, grado, sección y profesorId.
- La función completa algunos campos con valores genéricos: Titulo usa fileName; NombreOriginal y NombreFisico reciben ambos fileName; TipoRecurso queda por defecto en Entrega; Anio se obtiene del año calendario del servidor; Tema queda por defecto en General; RutaDrive recibe fileUrl, no la ruta jerárquica de carpetas. El llamador no entrega titulo, tipoRecurso, tema, anio ni rutaDrive.
- Por lo anterior, aunque la tabla tiene columnas para los metadatos solicitados, las filas no distinguen nombre original/físico ni conservan tipo de recurso, año lectivo, tema y ruta real de forma fiable.
- reconstructFileParts (backend/task-service/Code.gs:2120 y siguientes) crea el archivo final y registra un log técnico, pero no llama a logFileMetadata. La ruta reanudable no registra una fila de metadatos. Además, el flujo de carga reanudable no puede iniciar por la falta de despacho/permisos señalada en DOC-008.
- logFileMetadata captura errores y solo llama a logDebug (líneas 58-60); el fallo de escritura de metadatos no se propaga como error al proceso de carga.

### Evaluación de calidad e impacto

La hoja y el logger existen y registran metadatos parciales para el flujo uploadFile. No obstante, los valores por defecto ocultan datos que deberían ser reales, la ruta no corresponde al árbol de Drive y las cargas reanudables no tienen registro de metadatos. El criterio de registro completo por archivo no está satisfecho.

## Resumen del sublote

| Tarea | Resultado | Hallazgo |
|---|---|---|
| REQ-DOC-007 | Cumple parcialmente | AUD-NG-153 |
| REQ-DOC-008 | Cumple parcialmente | AUD-NG-154 |
| REQ-DOC-009 | Cumple parcialmente | AUD-NG-155 |

## Pruebas y límites

- No se ejecutaron pruebas de interfaz, de carga ni de endpoints.
- No se verificó el contenido real de carpetas Drive ni de la hoja MetadatosArchivos.
- No se comprobó el despliegue de Apps Script.
- No se modificó código fuente ni completadas_legacy.md.

## Continuidad

- Última tarea histórica auditada: REQ-DOC-009.
- Próximo sublote: H2, comenzando por REQ-DOC-010 y continuando con REQ-DOC-011 y REQ-DOC-012.
