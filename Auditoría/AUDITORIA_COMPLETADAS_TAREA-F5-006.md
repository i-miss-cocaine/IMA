# AUDITORÍA TÉCNICA — TAREA-F5-006
## Gestión documental de aspirantes antes de la matrícula

- **Repositorio:** i-miss-cocaine/IMA
- **Rama auditada:** NG_beta_0.0.0.1_work
- **HEAD auditado:** 5b2747201c2dd542b85cf84ec6786d4b9f6a0248
- **Tree SHA:** 45ac6391db467ba0bc33fe836ad4a9994bdf36bd
- **Rama base protegida:** NG_beta_0.0.0.1 — 44d9891132332e692dbe2ba8602b41f50a508a59
- **Checkpoint válido anterior:** C1.199 — TAREA-F5-005
- **Checkpoint de esta auditoría:** C1.200
- **ID operativo de sesión/chat:** IMA-AUDIT-20261107-0238Z (identificador operativo, no ID nativo de ChatGPT)
- **Fuente de requisitos:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 1986-2021.
- **Estado administrativo encontrado:** [X] Completada, con once criterios [x].
- **Dictamen técnico:** **NO CUMPLE**.
- **Informe anterior:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-006.md no existe en el árbol de C1.199; la consulta del historial por esa ruta no devolvió commits. El informe C1.200 anterior fue retirado al restaurar la rama al último checkpoint válido y no se reutiliza como evidencia.

## 1. Control de continuidad y fuentes

C1.199 es el último checkpoint válido. La rama de trabajo fue restaurada mediante actualización protegida del ref desde el HEAD posterior C1.203 al commit 5b2747201c2dd542b85cf84ec6786d4b9f6a0248, que contiene C1.199. La rama base no fue modificada.

Se comprobó la ausencia del informe específico en el árbol y en el historial Git consultado. Se buscó TAREA-F5-006 y F5-006 en Auditoria.txt y no se encontró un informe o hallazgo específico previo. ChangesLogs.txt sí contiene una declaración histórica de implementación, pero esa declaración no constituye evidencia de cumplimiento.

### Fuentes de tareas consultadas

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 1986-2021: tarea, alcance y once criterios marcados [x].
- Pendientes.md: lectura recuperada directamente del blob Git SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene TAREA-F5-006 ni F5-006. Sí contiene tareas transversales relacionadas que se reconcilian abajo: TASK-038, TASK-134, TASK-135, TASK-140, TASK-142, TASK-144, TASK-145, TASK-146 y TASK-153.
- ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9: declara uploadStudentDocument, migración, panel de Secretaría y actualización de estados. Las declaraciones se cotejaron contra el código actual.
- AUDITORIAS/Auditoria.txt SHA 880c9c3562cc6b4e950b1851b66bb90d061a6dab: se localizaron antecedentes transversales AUD-NG-232/TASK-512, AUD-NG-233/TASK-513, AUD-NG-161, AUD-NG-145 y TASK-118.
- AUDITORIAS/MapaDependencias.md SHA 784d5b2fb1864ebcfd5c9868ee6fd63504081364: se revisaron las relaciones previas de admisiones, conversión, documentos, autenticación y almacenamiento.

La regla de la metodología que excluye Pendientes.md del flujo operativo entra en conflicto con la instrucción actual, que exige consultarlo. Se aplicó la instrucción actual únicamente para consultar y reconciliar IDs existentes. No se modificó ni se usó Pendientes.md como sustituto de evidencia técnica.

## 2. Evidencia técnica inspeccionada

| Archivo | SHA | Secciones revisadas |
|---|---|---|
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc | doPost 671-690; dispatcher 875-879; ROLE_PERMISSIONS 179-217; PUBLIC_ACTIONS 265; validateRolePermission 534-583; convertAdmissionToStudent 2156-2392; assertRecordOwnership 2399-2413; getSecureDocumentStream 2485-2508; uploadStudentDocument 10572-10707; getStudentDocuments 10708-10785; updateDocumentStatus 10836-10854; getPendingDocumentsReport 10855-10922; checkAndNotifyExpiringStudentDocuments 10923-10985. |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | loadAdmissionApplicantDocuments 297-337; updateApplicantDocumentStatusAction 339-356; llamadas y renderizado del modal documental. |
| dashboard-secretaria.html | fa0d8c23aace24a6acab2d4956398a7f5e1309b8 | sección modal-adm-docs-container, alrededor de líneas 190-205. |
| admision.html | 45b84c80d22d2e8dab75852e65847bae6425db44 | selector de año/grado y lista informativa; updateDocumentRequirementsList 519-538. |
| js/student.js | e2888cea60322e49a40b89adadb8010489605dcc | búsqueda de flujo de carga/consulta documental: no hay referencias a uploadStudentDocument, getStudentDocuments ni getSecureDocumentStream. |
| tests/regression/academic-grading-suite.js | 3433b707edd4a2f35c68368a3172932adc2a3b32 | sin referencias a uploadStudentDocument, getStudentDocuments o updateDocumentStatus. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | sin referencias a uploadStudentDocument, getStudentDocuments o updateDocumentStatus. |

Las copias de respaldo de los archivos auditados son sus blobs Git identificados por los SHA anteriores. No se modificó código durante la inspección.

## 3. Hallazgos

### H1. No existe un flujo de carga documental accesible para el aspirante antes de matricularse
**Severidad: CRÍTICO / P0. Criterio afectado: 1.**

uploadStudentDocument existe en el backend, pero el árbol de la rama no contiene un formulario de carga documental en admision.html. js/student.js no llama uploadStudentDocument ni getStudentDocuments. js/secretary.js solo consulta documentos y actualiza su estado; no implementa carga ni sustitución. El único panel documental de dashboard-secretaria.html es de revisión administrativa.

Además, ROLE_PERMISSIONS concede uploadStudentDocument a Administrador, Director, Secretaría y Secretaria, pero no a Estudiante/Alumno. Por tanto, el backend no ofrece al aspirante una ruta autorizada para aportar el documento durante la fase pre-matrícula. El código servidor aislado no satisface el criterio de carga por el aspirante.

### H2. La validación del tipo de archivo confía en el MIME declarado y no inspecciona la firma binaria
**Severidad: CRÍTICO / P0. Criterios afectados: 3 y 8.**

uploadStudentDocument (10572-10612) extrae el MIME desde la cabecera de una data URL. Si recibe Base64 sin data URL, asigna application/pdf por defecto. La lista permitida incluye application/webp, aunque la tarea F5-006 solo autoriza PDF, JPG y PNG. No se valida la extensión del nombre original ni se comprueba Magic Bytes. Utilities.base64Decode convierte el contenido, pero no acredita que los bytes correspondan a un PDF/JPEG/PNG íntegro.

Un ejecutable u otro contenido puede enviarse con cabecera application/pdf y ser almacenado como blob de ese MIME. La comprobación de 0 bytes y el límite de 10 MB sí existen, pero no sustituyen la validación binaria. La función tampoco valida que el archivo sea estructuralmente legible o no esté truncado.

### H3. No existe catálogo documental configurable por año lectivo y grado
**Severidad: ALTO / P1. Criterios afectados: 2 y 3 de alcance.**

admision.html, función updateDocumentRequirementsList (519-538), muestra listas estáticas según grado y no consulta un catálogo institucional. La lista no depende del año lectivo y no administra fecha límite, obligatoriedad, tipo MIME ni tamaño por requisito. getPendingDocumentsReport (10855-10922) contiene otra lista fija de cuatro tipos documentales, sin parametrización por año o grado y distinta de la lista visible en admision.html.

El sistema mantiene dos fuentes estáticas divergentes en vez de un catálogo único y versionado.

### H4. Los estados documentales no forman la máquina de estados solicitada
**Severidad: ALTO / P1. Criterios afectados: 4, 5 y 6.**

uploadStudentDocument guarda el estado inicial EnRevision, que no coincide con En_Revision. updateDocumentStatus (10836-10854) acepta cualquier nuevoEstado sin validar el conjunto permitido ni transiciones. La interfaz de Secretaría solo ofrece Aceptado y Rechazado; no ofrece Recibido ni Requiere_Sustitucion como acciones explícitas. El informe getPendingDocumentsReport reconoce Pendiente, Aprobado/Aceptado y Rechazado, pero no normaliza EnRevision, En_Revision ni Requiere_Sustitucion.

La divergencia de etiquetas y la ausencia de validación permiten estados arbitrarios e inconsistentes entre carga, revisión, reporte y conversión.

### H5. Los fallos intermedios de almacenamiento pueden dejar archivos huérfanos y perder el historial de versión
**Severidad: CRÍTICO / P0. Criterios afectados: 4 y 7.**

uploadStudentDocument crea primero el archivo en Drive (aprox. 10615-10639) y después escribe/actualiza DocumentosEstudiante. Si la escritura de la hoja falla tras crear el archivo, no existe una compensación que elimine o marque el archivo huérfano. La actualización de una versión existente intenta escribir HistorialVersionesDocumentos, pero captura y silencia cualquier error; aun si falla el archivo de historial, continúa sobrescribiendo los metadatos del documento vigente.

La conservación de versión es parcial: hay intención de archivar la versión anterior, pero no se garantiza que la referencia histórica se haya persistido antes de reemplazar la versión vigente.

### H6. La consulta y revisión documental no aplican autorización por recurso y la descarga evita el proxy previsto
**Severidad: CRÍTICO / P0. Criterios afectados: 7 y 13.**

getStudentDocuments (10708-10785) filtra por expedienteId o solicitudId, pero no comprueba pertenencia del registro al usuario autenticado ni el ámbito de la solicitud. Si se omiten ambos identificadores, devuelve todos los documentos. updateDocumentStatus localiza por documentoId y modifica el estado sin comprobar expediente/solicitud ni pertenencia.

La respuesta de getStudentDocuments expone driveFileId y driveUrl; secretary.js inserta d.driveUrl como enlace directo a Drive. No utiliza getSecureDocumentStream. La función getSecureDocumentStream existe (2485-2508), pero no tiene case en el dispatcher doPost del servicio ACADEMIC. Además, su autorización toma userRole, authenticatedUserId y userId del payload y llama assertRecordOwnership; esa función permite cualquier rol no vacío distinto de Estudiante/Alumno y no verifica que el archivo físico pertenezca al expediente objetivo. El supuesto proxy devuelve getDownloadUrl, no un flujo binario servido por el backend.

No se acredita una respuesta 403 ante IDs ajenos ni una descarga autenticada por documento y expediente.

### H7. La sustitución y comunicación de rechazo no completan el ciclo exigido
**Severidad: ALTO / P1. Criterios afectados: 5, 6 y 7.**

La consola muestra observaciones del documento y solicita un texto al cambiar el estado, pero solo presenta botones Aceptado y Rechazado. No hay acción para Requiere_Sustitucion ni un control para que el aspirante cargue el reemplazo. La conservación de la versión anterior depende de uploadStudentDocument y puede fallar silenciosamente (H5). No hay flujo familiar que presente el motivo y habilite la sustitución.

### H8. La conversión migra referencias, pero no garantiza una migración documental íntegra
**Severidad: CRÍTICO / P0. Criterio afectado: 9. Ampliación de AUD-NG-232/TASK-512.**

convertAdmissionToStudent (2156-2392) recorre DocumentosEstudiante y asigna expedienteId a filas cuyo solicitudId coincide y cuyo expedienteId está vacío. No duplica físicamente el archivo en Drive, lo cual es correcto como intención. Sin embargo, el bloque de migración está dentro de try/catch que solo escribe console.warn; si falla, la conversión continúa y devuelve success. La solicitud se marca Convertida y recibe expedienteId antes de completar la migración documental. No se verifica la cantidad de documentos migrados ni se ejecuta reconciliación o compensación ante fallo.

La operación no satisface una garantía de migración completa, aunque la actualización de la referencia evita duplicar el binario cuando tiene éxito.

### H9. La conversión no bloquea todos los documentos obligatorios faltantes, pendientes o no válidos
**Severidad: CRÍTICO / P0. Criterio afectado: 10. Ampliación de AUD-NG-233/TASK-513.**

convertAdmissionToStudent filtra únicamente documentos cuyo estado sea exactamente Pendiente o Rechazado. No consulta getPendingDocumentsReport. Por ello:
- Si no existe ningún documento, pendingDocs queda vacío y la conversión puede continuar.
- Los documentos cargados quedan inicialmente EnRevision, estado que no bloquea.
- Requiere_Sustitucion, En_Revision y EnRevision no se incluyen en el bloqueo.
- No se comprueba fechaVencimiento.
- No se exige que cada requisito obligatorio del grado/año tenga un documento aceptado o una exención válida.

Además, allowIncompleteOverride procede directamente del payload y se combina con la constante global ALLOW_INCOMPLETE_ADMISSION_CONVERSION. La función no verifica una autorización especial para ese override. El control no falla cerrado ante la ausencia de requisitos o estados no reconocidos.

### H10. Las alertas documentales no cubren el portal familiar ni el panel de Dirección
**Severidad: ALTO / P1. Criterio afectado: 14.**

getPendingDocumentsReport existe, pero no se encontraron consumidores en js/student.js ni js/secretary.js. La función checkAndNotifyExpiringStudentDocuments (10923-10985) genera notificaciones de vencimiento, pero no constituye un panel de alertas integrado para familia y Dirección; además excluye explícitamente estado Rechazado. No hay integración del resumen de documentos vencidos/rechazados en un panel familiar o de Dirección acreditada por los archivos inspeccionados.

### H11. La revisión de estados no genera una bitácora documental completa
**Severidad: ALTO / P1. Criterio afectado: 11. Ampliación de AUD-NG-145 y TASK-146.**

uploadStudentDocument invoca logStructuredEvent en altas y sustituciones. updateDocumentStatus modifica estado, usuario y observaciones, pero no registra evento estructurado ni conserva estado anterior/nuevo, actor verificado, motivo y fecha en un historial dedicado. El actor se toma de payload.userId o del literal Secretaría, no de payload._verifiedUserId. La migración documental solo queda incluida indirectamente en el evento general ADMISSION_CONVERTED, sin resultado por documento.

### H12. No hay pruebas de regresión específicas del flujo documental de admisión
**Severidad: ALTO / P1. Ampliación de AUD-NG-161.**

Las suites tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen referencias a uploadStudentDocument, getStudentDocuments ni updateDocumentStatus. No se acreditan pruebas de MIME falso, Magic Bytes, archivos corruptos, límite de 10 MB, fallos parciales Drive/Sheets, autorización por documento, sustitución, estados, migración, bloqueo por requisitos ausentes ni auditoría de eventos.

## 4. Elementos que sí existen parcialmente

- uploadStudentDocument acepta solicitudId y expedienteId, guarda solicitudId y comprueba tamaño máximo de 10 MB.
- Rechaza el contenido decodificado de 0 bytes.
- Crea archivo en Drive y registra metadatos en DocumentosEstudiante.
- Intenta conservar versiones anteriores en HistorialVersionesDocumentos.
- getStudentDocuments consulta documentos por solicitudId o expedienteId y comprueba si el archivo existe/no está en papelera.
- dashboard-secretaria.html presenta un contenedor documental y secretary.js permite consultar documentos, aprobar o rechazar con observaciones.
- convertAdmissionToStudent actualiza expedienteId en registros documentales asociados a solicitudId sin crear un segundo archivo físico.
- uploadStudentDocument genera un evento estructurado; el límite y la verificación de cero bytes son controles presentes, aunque insuficientes.

Estos elementos no compensan los incumplimientos de los criterios completos.

## 5. Reconciliación de tareas existentes

No se crean identificadores globales nuevos. Se amplían tareas ya registradas:

- **TASK-038 / F22-Task01:** validación binaria, Magic Bytes, coherencia extensión/MIME/contenido, rechazo de ejecutables y archivos corruptos. El estado visible en Pendientes.md es Pendiente; el encabezado incluye una marca [X] que no concuerda con ese estado y requiere reconciliación documental.
- **TASK-142 / F40-Task04:** streaming autenticado, autorización por documento y eliminación de enlaces directos de Drive.
- **TASK-153 / F41-Task03:** ABAC y propiedad del documento/expediente derivadas de identidad autenticada.
- **TASK-135 / F39-Task05:** custodia de originales, versionado y procedencia.
- **TASK-134 / F39-Task04 y TASK-144 / F40-Task06:** huella SHA-256, integridad y deduplicación de documentos/versiones.
- **TASK-146 / F40-Task08:** bitácora forense de consultas, vistas, descargas, modificaciones e intentos denegados.
- **TASK-140 / F40-Task02:** clasificación documental y protección por sensibilidad.
- **AUD-NG-232 / TASK-512:** recuperación/compensación del proceso de conversión multi-etapa; ampliar para la migración documental.
- **AUD-NG-233 / TASK-513:** validación fail-closed de requisitos documentales, bloqueo de conversión y controles de override.
- **AUD-NG-145:** trazabilidad y sanitización de logs; ampliar para revisión de documentos y actor verificado.
- **AUD-NG-161:** pruebas conductuales reales de seguridad documental, fallos parciales y concurrencia.
- **TASK-118:** generación y unicidad de IDs; uploadStudentDocument llama generateInstitutionalId con skipLock=true sin lock exterior visible.

## 6. Tareas ejecutables derivadas de los hallazgos

Las tareas siguientes permanecen dentro de este informe. Las referencias a IDs globales existentes son ampliaciones, no duplicados.

### F5-006-A01 — Implementar carga documental real para aspirantes pre-matriculados
- **Hallazgo:** H1.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** permitir que el aspirante adjunte cada requisito a solicitudId antes de matricularse.
- **Archivos/módulos:** admision.html, js/student.js, backend/academic-service/Code.gs, ROLE_PERMISSIONS y doPost.
- **Dependencias:** sesión/identidad de aspirante, solicitud vigente, DocumentosEstudiante, DriveApp.
- **Alcance:** crear controles de selección y carga; transmitir solicitudId; permitir al aspirante únicamente su propia solicitud; validar la autorización en servidor; conservar el vínculo durante admisión.
- **Criterios de aceptación:** un aspirante autenticado o con mecanismo de posesión de solicitud autorizado carga un archivo a su solicitud; otro aspirante no puede usar ese solicitudId; el backend deniega identidad ausente o no coincidente; la carga queda visible en Secretaría.
- **Estado:** Pendiente.

### TASK-038 — Ampliación de validación binaria para el módulo de admisiones
- **Hallazgos:** H2.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** validar el contenido real antes de crear archivos en Drive.
- **Archivos/módulos:** backend/academic-service/Code.gs, uploadStudentDocument y validador binario compartido.
- **Dependencias:** Magic Bytes, Utilities.base64Decode, DriveApp, límites configurables.
- **Alcance:** aceptar solo formatos autorizados para F5-006; verificar firma binaria, extensión y MIME; detectar PDF/imagen corruptos o truncados; mantener máximo 10 MB; rechazar sin crear archivo ni fila; registrar motivo.
- **Criterios de aceptación:** ejecutable con MIME PDF se rechaza; MIME falso se detecta; PDF/JPEG/PNG válidos se aceptan; archivos corruptos, truncados, vacíos, WEBP si no está autorizado por el catálogo F5-006 y mayores de 10 MB se rechazan antes de Drive; ningún rechazo crea registro huérfano.
- **Estado:** Pendiente (ampliación de TASK-038).

### F5-006-A02 — Crear catálogo documental por año, grado y requisito
- **Hallazgo:** H3.
- **Severidad/Prioridad:** ALTO / P1.
- **Objetivo:** sustituir listas estáticas divergentes por una fuente institucional configurable.
- **Archivos/módulos:** backend/academic-service/Code.gs, admision.html, dashboard-secretaria.html, js/secretary.js.
- **Dependencias:** hoja de catálogo documental, año lectivo, grado, tipo documental.
- **Alcance:** administrar obligatoriedad, fecha límite, formatos permitidos, tamaño máximo, vigencia del requisito y descripción visible; consumir el mismo catálogo desde formulario, Secretaría y validación de conversión.
- **Criterios de aceptación:** cambiar año/grado devuelve los requisitos vigentes correctos; un cambio de catálogo no altera solicitudes históricas; servidor y UI muestran el mismo conjunto; los requisitos obligatorios faltantes se identifican individualmente.
- **Estado:** Pendiente.

### F5-006-A03 — Normalizar estados y transiciones documentales
- **Hallazgo:** H4.
- **Severidad/Prioridad:** ALTO / P1.
- **Objetivo:** implementar la máquina de estados definida por F5-006.
- **Archivos/módulos:** backend/academic-service/Code.gs, js/secretary.js, dashboard-secretaria.html y portal del aspirante.
- **Dependencias:** catálogo documental, historial de estados y observaciones.
- **Alcance:** normalizar Pendiente, Recibido, En_Revision, Aceptado, Rechazado y Requiere_Sustitucion; validar transiciones en servidor; eliminar variantes EnRevision/Aprobado no normalizadas o migrarlas explícitamente.
- **Criterios de aceptación:** solo transiciones permitidas se guardan; estado inválido se rechaza; el estado devuelto coincide en familia, Secretaría y reporte; Requiere_Sustitucion habilita una nueva carga vinculada al mismo documento lógico.
- **Estado:** Pendiente.

### TASK-135 — Ampliación de versionado transaccional y custodia de documentos de admisión
- **Hallazgo:** H5 y H7.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** impedir que una carga fallida deje archivos huérfanos o destruya la referencia histórica.
- **Archivos/módulos:** backend/academic-service/Code.gs, uploadStudentDocument, HistorialVersionesDocumentos y DriveApp.
- **Dependencias:** TASK-134/TASK-144 para hashes; TASK-118 para IDs; operación compensatoria Drive/Sheets.
- **Alcance:** persistir y verificar el historial antes de sustituir la referencia vigente; compensar/eliminar o poner en cuarentena el archivo físico si falla la escritura tabular; registrar estado de operación y permitir reconciliación.
- **Criterios de aceptación:** fallo de Drive no crea fila; fallo de Sheets tras crear Drive no deja archivo huérfano sin registro de compensación; fallo al guardar versión histórica impide sobrescribir la vigente; cada versión conserva su propio ID, archivo, fecha, usuario y hash.
- **Estado:** Pendiente (ampliación de TASK-135).

### TASK-142 / TASK-153 — Ampliación de acceso seguro y autorización por documento
- **Hallazgo:** H6.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** impedir consulta, modificación o descarga de documentos de expedientes ajenos.
- **Archivos/módulos:** backend/academic-service/Code.gs, getStudentDocuments, updateDocumentStatus, getSecureDocumentStream, assertRecordOwnership, doPost; js/secretary.js.
- **Dependencias:** claims de sesión verificados, relación solicitud-expediente, permisos por operación.
- **Alcance:** derivar userId/role de claims; comprobar pertenencia y ámbito en cada acción; no devolver driveUrl ni enlaces directos; registrar y exponer un proxy autenticado realmente despachado; eliminar confianza en userRole/userId enviados por cliente.
- **Criterios de aceptación:** IDs ajenos devuelven 403 sin metadatos; consulta sin expedienteId/solicitudId se rechaza; el proxy comprueba documento, versión, usuario y permiso; las respuestas no contienen URLs directas de Drive; cambiar el ID del documento no permite acceder a otro archivo.
- **Estado:** Pendiente (ampliación de TASK-142 y TASK-153).

### AUD-NG-232 / TASK-512 y AUD-NG-233 / TASK-513 — Ampliación del bloqueo y recuperación de conversión
- **Hallazgos:** H8 y H9.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** convertir solo cuando todos los requisitos obligatorios estén aceptados o formalmente exentos y la migración documental haya terminado.
- **Archivos/módulos:** backend/academic-service/Code.gs, convertAdmissionToStudent, getPendingDocumentsReport, DocumentosEstudiante.
- **Dependencias:** F5-006-A02, F5-006-A03, TASK-135, TASK-142.
- **Alcance:** usar un único reporte de requisitos; bloquear faltantes, pendientes, En_Revision, Rechazado, Requiere_Sustitucion y vencidos; validar exenciones; retirar bypass controlable por payload o exigir autorización privilegiada verificable; migrar documentos antes de marcar Convertida; verificar cantidad y referencias; compensar o dejar estado recuperable si falla.
- **Criterios de aceptación:** sin documentos obligatorios no se convierte; estados no aceptados o vencidos bloquean; override no autorizado devuelve 403; una migración incompleta no devuelve success ni deja solicitud Convertida; reintentar no duplica archivos ni registros.
- **Estado:** Pendiente (ampliación de AUD-NG-232/TASK-512 y AUD-NG-233/TASK-513).

### TASK-146 / AUD-NG-145 — Ampliación de bitácora documental
- **Hallazgo:** H11.
- **Severidad/Prioridad:** ALTO / P1.
- **Objetivo:** reconstruir el ciclo documental con actor y resultado verificables.
- **Archivos/módulos:** backend/academic-service/Code.gs, uploadStudentDocument, updateDocumentStatus, migración, getStudentDocuments y getSecureDocumentStream.
- **Dependencias:** logStructuredEvent, claims verificados, AUD-NG-145.
- **Alcance:** registrar carga, validación, rechazo, consulta, vista, descarga, sustitución, aprobación, rechazo, migración y denegación; actor derivado de claims; estado anterior/nuevo, motivo, documento, solicitud/expediente, versión y correlationId; no registrar tokens ni contenido sensible.
- **Criterios de aceptación:** cada operación produce un evento persistido; el actor no puede falsificarse desde payload; una consulta o descarga denegada también queda registrada; los logs no exponen PII innecesaria.
- **Estado:** Pendiente (ampliación de TASK-146 y AUD-NG-145).

### AUD-NG-161 — Ampliación de pruebas conductuales de gestión documental
- **Hallazgos:** H1-H12.
- **Severidad/Prioridad:** ALTO / P1.
- **Objetivo:** demostrar el flujo completo en condiciones normales, inválidas, concurrentes y de fallo.
- **Archivos/módulos:** tests/regression y backend/academic-service/Code.gs; interfaz admision.html y dashboard-secretaria.html.
- **Dependencias:** tareas F5-006-A01 a A03, TASK-038, TASK-135, TASK-142, TASK-146 y AUD-NG-232/233.
- **Alcance:** pruebas de carga pre-matrícula, MIME falso/Magic Bytes, límite, 0 bytes, corrupción, fallo tras Drive, historial de sustitución, IDOR, 403, estados, requisitos faltantes, vencimiento, migración, reintentos y bitácora.
- **Criterios de aceptación:** las pruebas ejercitan funciones reales con datos aislados; cada caso verifica persistencia y efectos colaterales; fallos inyectados no dejan archivos/filas huérfanos; la suite no marca PASS incondicionalmente.
- **Estado:** Pendiente (ampliación de AUD-NG-161).

### F5-006-A04 — Integrar alertas documentales para familia y Dirección
- **Hallazgo:** H10.
- **Severidad/Prioridad:** ALTO / P1.
- **Objetivo:** mostrar requisitos pendientes, rechazados, vencidos y que requieren sustitución en los paneles correspondientes.
- **Archivos/módulos:** backend/academic-service/Code.gs, js/student.js, js/secretary.js, dashboard-secretaria.html, dashboard-direccion.html y panel familiar disponible.
- **Dependencias:** catálogo, getPendingDocumentsReport, estados normalizados y notificaciones.
- **Alcance:** conectar el reporte de requisitos a los paneles; separar alerta de vencimiento de alerta de rechazo; permitir al aspirante conocer el motivo y cargar sustitución.
- **Criterios de aceptación:** familia y Dirección ven estados actuales por solicitud/expediente; vencidos y rechazados no se omiten; una actualización de estado refresca los paneles; el fallo de red no se presenta como ausencia de documentos.
- **Estado:** Pendiente.

## 7. Pruebas, límites y dictamen

**Ejecutado:** inspección manual de los bloques y funciones indicados; cotejo de cada requisito y criterio con backend, UI, permisos y conversión; búsqueda de referencias en student.js, secretary.js, admision.html y suites; consulta de completadas.md, Pendientes.md por blob, Auditoria.txt, ChangesLogs.txt, MapaDependencias.md y plan; verificación de ausencia del informe y de su historial.

**No ejecutado:** no se desplegó Apps Script, no se subieron archivos reales a Drive, no se ejecutaron peticiones HTTP, no se simularon fallos de red/Drive/Sheets, no se probó concurrencia, no se verificó acceso anónimo a URLs reales, no se ejecutó navegador, no se probaron usuarios con roles distintos y no se ejecutaron suites automatizadas. Por ello, los hallazgos de código estático no se presentan como resultados de runtime.

**Dictamen:** TAREA-F5-006 **NO CUMPLE**. Hay una función backend parcial de carga y una vista administrativa de consulta/revisión, pero no existe carga pre-matrícula desde el aspirante; el MIME se confía al cliente; falta catálogo anual/por grado; los estados no están normalizados; la sustitución puede perder historial; no se acredita autorización por documento ni proxy efectivo; la migración puede fallar silenciosamente; el bloqueo de conversión omite documentos ausentes y estados relevantes; las alertas familiares/directivas no están integradas y la revisión no registra bitácora completa. La marca histórica [X] de completadas.md se conserva sin alteración, pero no está respaldada por el código auditado.

## 8. Continuidad

- **Última tarea auditada:** TAREA-F5-006.
- **Siguiente tarea:** TAREA-F5-007 — módulo de entrevistas y evaluaciones de admisión. Verificar primero existencia del informe y su historial.
- **Archivos documentales de esta iteración:** este informe, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **No modificados:** código fuente, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md y rama base.
- **Publicación:** un único commit consolidado con padre 5b2747201c2dd542b85cf84ec6786d4b9f6a0248; diff total revisado, expected_sha en update_ref y verificación posterior de HEAD, árbol y archivos incluidos.
