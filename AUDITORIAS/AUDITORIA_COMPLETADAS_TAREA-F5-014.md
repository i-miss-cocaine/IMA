# AUDITORÍA TÉCNICA - TAREA-F5-014: trazabilidad de admisiones y notificaciones de auditoría

- **Repositorio:** i-miss-cocaine/IMA
- **Rama auditada:** NG_beta_0.0.0.1_work
- **HEAD de partida:** 94529f5af626bd0c3f5e1fb784cead61d727f40f
- **Árbol de partida:** f33f779c8f71ec46645f51b6f1e78ab78c366ea2
- **Rama base protegida:** NG_beta_0.0.0.1
- **HEAD de rama base:** 44d9891132332e692dbe2ba8602b41f50a508a59
- **Checkpoint de inicio:** C1.209
- **Checkpoint de cierre:** C1.210
- **Sesión operativa:** IMA-AUDIT-20261107-1537Z (identificador operativo de auditoría, no ID nativo de ChatGPT)
- **Fecha:** 2026-11-07
- **Dictamen técnico:** **NO CUMPLE**

## 1. Búsqueda documental, fuente y continuidad

Se consultó la ruta AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-014.md en la rama de trabajo y devolvió NOT_FOUND. La consulta del historial de commits limitada a esa ruta y a NG_beta_0.0.0.1_work devolvió una lista vacía. No existe informe individual recuperable en el árbol ni en el historial alcanzable de la rama; por tanto, esta auditoría se realizó desde cero.

**Fuente de requisitos:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2260-2289. TAREA-F5-014 contiene 12 requisitos y 7 criterios de aceptación, todos marcados [x], con estado administrativo [X] Completada. La marca se conserva y no se considera evidencia de implementación.

**Origen citado por la tarea:** Auditoria.txt (HALLAZGOS F5: HALLAZGOS-F5-P1-01) y AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md, Subcapacidad 5.15. El informe de fase citado no se encontró en la rama durante las auditorías anteriores; la evidencia vigente se obtuvo del registro de tarea, ChangesLogs.txt y código actual. El identificador de hallazgo de origen no sustituye la verificación de los 12 requisitos.

**ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1878-1891. Declara que USER actualizó getEntityAuditHistory para Secretaría y Dirección y que se añadió el contenedor HTML y loadAdmissionAuditTrail. Esas modificaciones existen, pero el changelog no demuestra que la bitácora tenga un contrato común, que los productores estén conectados ni que la consulta reciba los eventos de ACADEMIC.

**Pendientes.md:** la lectura ordinaria devuelve 0 caracteres y conserva el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c. Ese mismo blob fue recuperado y validado íntegramente en el checkpoint C1.209 (1.782.094 caracteres, 20.182 líneas, sin U+FFFD). En esta iteración no se sobrescribió ni restauró el archivo. Se usaron los antecedentes de ese inventario y las relaciones ya documentadas en Auditoria.txt, MapaDependencias.md y los informes F5-011 a F5-013. La metodología vigente §3.4 mantiene las tareas derivadas dentro del informe individual; no se altera Pendientes.md.

**Ramas:** HEAD de trabajo confirmado en 94529f5af626bd0c3f5e1fb784cead61d727f40f; HEAD de base NG_beta_0.0.0.1 confirmado en 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación previa: 277 commits adelante y 0 detrás. No se modificó la rama base.

## 2. Evidencia técnica y respaldos

Los SHA se registraron antes de inspeccionar cada archivo. Los archivos fuente permanecieron sin modificaciones.

| Archivo | SHA de respaldo | Secciones/rangos examinados |
|---|---|---|
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | Sanitización/logStructuredEvent (29-60); dispatcher y catch (680-985); createAdmissionRequest (984-1115); updateAdmissionStatus/reopenAdmissionRequest (1928-2125); convertAdmissionToStudent (2156-2385); getSecureDocumentStream (2489-2515); recordEntityChangeLog (1568-1595); uploadStudentDocument (10693-10827); getStudentDocuments (10829-10903); updateDocumentStatus/restoreDocumentVersion (10905-10975). |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | ROLE_PERMISSIONS (920-995); validateRolePermission y permisos dinámicos (aprox. 1190-1310); doPost/dispatcher (1320-1465); sanitizeValueForAudit/recordEntityChangeLog/getEntityAuditHistory (2698-2795); recordTraceabilityLog/getTraceabilityCorrelationLogs (4548-4615); getPaginatedAuditLogReport (4242-4350). |
| backend/accounting-service/Code.gs | 38b979d41596b85e888b4a7060b37bbac0840a28 | SPREADSHEET_ID (1-7); sanitizePayloadForLog/logStructuredEvent (52-95); handlers de pagos y revisión de comprobantes (aprox. 3891-4220). |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | SPREADSHEET_ID (1-8); revisión dirigida de presencia de productores/consumidores de correlación y auditoría. |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c | SPREADSHEET_ID (1-8); revisión dirigida de presencia de productores/consumidores de correlación y auditoría. |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi (1-181), construcción del payload y reintentos. |
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | SERVICE_URLS/SERVICE_REGISTRY (216-310). |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | openAdmissionDetailModal (aprox. 180-235); loadAdmissionAuditTrail (1187-1225); loadAdmissionNotificationLogs (1358-1410). |
| dashboard-secretaria.html | fa0d8c23aace24a6acab2d4956398a7f5e1309b8 | Modal de admisión y contenedores de notificaciones/bitácora (200-220); scripts cargados al final del documento. |
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | Búsqueda de helper global escapeHtml; no existe definición. |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | Archivo completo; no contiene F5-014 ni pruebas de los contratos de auditoría descritos. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo; no contiene F5-014 ni pruebas de los contratos de auditoría descritos. |
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | TAREA-F5-014, líneas 2260-2289. |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Declaración F5-014, líneas 1878-1891. |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Reglas de auditoría manual, tareas derivadas, checkpoints y publicación única. |
| AUDITORIAS/Contexto_personal.txt | 0deec49f893d47480111364695d90696b2786adf | Checkpoint C1.209, cierre previo y reglas prioritarias. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | fb67e3db5f9d630cc6552eef143a6fbcd4d2d6a6 | Checkpoint C1.209 y secuencia F5. |
| AUDITORIAS/Auditoria.txt | f2b4284f04f86817aade2d80796aadb06ee532a0 | AUD-NG-145, AUD-NG-161 y hallazgos de trazabilidad relacionados. |
| AUDITORIAS/MapaDependencias.md | 51bdbc65e1423b634c8c09e79a50ece5e6ba48fe | Relaciones de AUD-NG-145/161/222, TASK-474/TASK-475 y F5-011 a F5-013. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-011.md | 397b3cd116734f589649145492873b1531111b45 | Hallazgos de notificaciones, persistencia y sanitización. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-012.md | 1edc05b589fb4a921d80c492e37c9533ebf7046b | Timeline familiar, aislamiento y semántica de errores. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-013.md | b30e2049a57065ca0c1e171be464e045ba70993a | H9 y F5-013-A09, trazabilidad contable. |

Los cinco servicios USER, ACADEMIC, ACCOUNTING, TASK y EXAM apuntan en el código revisado al mismo SPREADSHEET_ID. Por tanto, la incompatibilidad de esquema de HistorialCambiosEntidad no puede explicarse por bases de datos separadas: los escritores y el lector operan sobre la misma hoja compartida.

## 3. Hallazgos

### H1 - CRÍTICO/P0: contrato de columnas incompatible entre el escritor académico y el lector de auditoría

ACADEMIC recordEntityChangeLog (aprox. 1568-1595) inicializa y escribe HistorialCambiosEntidad con este orden: HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable, CorrelationID.

USER recordEntityChangeLog (aprox. 2715-2744) y getEntityAuditHistory (2745-2795) esperan otro orden: cambioId, entityType, entityId, accion, valoresAnteriores, valoresNuevos, ejecutadoPor, fechaCambio, correlationId.

Ambos servicios usan el mismo SPREADSHEET_ID. El lector USER interpreta row[1] de una fila ACADEMIC como entityType (pero contiene una fecha), row[2] como entityId (pero contiene SolicitudAdmision, no el solicitudId), row[3] como accion (pero contiene el ID de solicitud), y row[7] como fechaCambio (pero contiene el actor). En consecuencia, los registros de actualización de admisión no coinciden con la consulta de Secretaría y, si alguna fila llegara a coincidir accidentalmente, la conversión de row[7] a ISO puede fallar. No hay validación de encabezados ni versión de esquema antes de escribir/leer.

**Impacto:** la UI puede mostrar una bitácora vacía aunque ACADEMIC haya anexado filas. No se puede reconstruir de forma fiable el expediente ni validar los criterios 1, 3, 5 y 11.

### H2 - CRÍTICO/P0: las operaciones críticas de admisión no generan un diff homogéneo en la bitácora

La creación createAdmissionRequest (984-1115) registra ADMISSION_CREATED en LogsSistema mediante logStructuredEvent, pero no llama recordEntityChangeLog. updateAdmissionStatus (1928-2060) y reopenAdmissionRequest (2062-2125) sí intentan escribir HistorialCambiosEntidad y LogsSistema. convertAdmissionToStudent (2156-2385) registra ADMISSION_CONVERTED en LogsSistema, pero no crea el diff de conversión en HistorialCambiosEntidad. uploadStudentDocument (10693-10827) escribe un evento DOCUMENT_UPLOADED en LogsSistema, pero no registra diff sanitizado en HistorialCambiosEntidad. updateDocumentStatus (10957-10974) cambia estado y responsable sin registrar evento de auditoría. getStudentDocuments (10829-10903) y getSecureDocumentStream (aprox. 2489-2515) leen/entregan datos de documentos sin producir un evento de acceso.

**Impacto:** no se registra la cadena completa recepción -> cambios de datos -> documentos -> decisión -> conversión. El criterio de diff para conversión está marcado como cumplido, pero el flujo actual no lo acredita.

### H3 - ALTO/P1: BitacoraTraceability no tiene productores automáticos desde los flujos de admisión

USER declara y despacha recordTraceabilityLog (4548-4573; dispatcher aprox. 1457) y getTraceabilityCorrelationLogs (4575-4615). La búsqueda dirigida de callsites no localizó invocaciones de recordTraceabilityLog desde ACADEMIC, ACCOUNTING, TASK o EXAM. En ACADEMIC no existe esa función ni un productor equivalente. js/api.js/fetchApi (1-181) no genera ni propaga correlationId. updateAdmissionStatus y reopenAdmissionRequest llaman recordEntityChangeLog sin el séptimo argumento correlationId, por lo que el helper produce un identificador sintético local en vez de compartir una correlación de la operación.

El helper de USER almacena servicio origen/destino, acción, estado, duración, error y fecha, pero no hay un productor interservicio conectado a los eventos de admisión. El hecho de que exista el endpoint no demuestra correlación entre cinco microservicios.

**Impacto:** no puede reconstruirse una operación distribuida ni asociar un fallo parcial entre USER, ACADEMIC y ACCOUNTING. Incumple el criterio 7 y los requisitos 11-12.

### H4 - ALTO/P1: faltan actor verificado, IP/sesión y contexto probatorio suficiente

El esquema de HistorialCambiosEntidad de ACADEMIC no contiene IP ni identificador de sesión. BitacoraTraceability tampoco almacena usuario/actor, IP o sesión. LogsSistema guarda rol, función y payload, pero no tiene campos separados para identidad autenticada, sesión, IP ni correlationId.

En updateAdmissionStatus, actorUserId prioriza _verifiedUserId, pero admite actorId/adminId del payload y termina con el literal Secretaría como fallback. Los eventos logStructuredEvent de creación, actualización y conversión reciben payload.authRole, no un actor verificado separado. createAdmissionRequest y convertAdmissionToStudent no incluyen el actor autenticado en el payload del evento. El evento de negocio y el log técnico no contienen un DTO probatorio uniforme.

**Impacto:** no se puede atribuir de forma inequívoca cada cambio a un usuario autenticado ni reconstruir quién ejecutó una operación, desde qué sesión/IP y con qué resultado. Incumple el requisito 2.

### H5 - ALTO/P1: la sanitización no protege DNI ni el resto de datos personales y ACADEMIC omite el sanitizador de auditoría

USER sanitizeValueForAudit (2698-2713) enmascara claves que contienen pass, token, secret o clave; no incluye DNI, identificacion, email, teléfono, fecha de nacimiento ni otros datos personales. ACADEMIC sanitizePayloadForLog (29-50) enmascara password, clave, token, secret, credencial y authorization, pero tampoco DNI/PII. Más grave: ACADEMIC recordEntityChangeLog serializa previousValue y newValue directamente con JSON.stringify, sin llamar sanitizeValueForAudit. getEntityAuditHistory devuelve valores anteriores/nuevos al consumidor y getPaginatedAuditLogReport agrega detalles de BitacoraEventos/BitacoraTraceability sin una política general de seudonimización.

El catch global de ACADEMIC doPost entrega e.postData a logStructuredEvent; el sanitizador actual no reconoce claves como identificacion o DNI.

**Impacto:** credenciales pueden quedar parcialmente protegidas, pero identificadores y datos personales de menores/responsables pueden persistir en logs o exponerse en consultas/exportaciones. Incumple requisitos 8-9 y criterio 3.

### H6 - ALTO/P1: no se acredita inmutabilidad ni protección de solo lectura de las bitácoras

Los helpers escriben con appendRow, pero no configuran protección de hoja/rangos, permisos de solo lectura, hash encadenado ni verificación de integridad de HistorialCambiosEntidad o BitacoraTraceability. getEntityAuditHistory es un lector de aplicación, no una protección del recurso subyacente. La inspección del repositorio no permite confirmar ACL efectivas del Spreadsheet ni demostrar que un editor con acceso a la hoja no pueda alterar o borrar filas.

**Impacto:** append-only es una convención del código, no una garantía de inmutabilidad. No se demuestra que los intentos de modificación no autorizados sean bloqueados. Incumple requisito 4 y criterio 2.

### H7 - ALTO/P1: los accesos y descargas de documentos de menores no quedan auditados

getStudentDocuments (10829-10903) consulta documentos y DriveApp para verificar accesibilidad, pero no registra usuario, fecha, documento consultado ni resultado. getSecureDocumentStream (aprox. 2489-2515) devuelve downloadUrl sin registrar descarga/acceso. uploadStudentDocument genera un evento estructurado de carga, pero no un diff completo en HistorialCambiosEntidad; updateDocumentStatus modifica estado/responsable sin log. restoreDocumentVersion registra un evento estructurado, pero tampoco un diff homogéneo en HistorialCambiosEntidad.

**Impacto:** no existe evidencia cronológica de quién consultó o descargó documentos sensibles de menores. Incumple requisito 7 y criterio 6.

### H8 - ALTO/P1: la ruta de consulta de auditoría no está concedida estáticamente a los roles que utiliza la UI

js/secretary.js/loadAdmissionAuditTrail (1187-1225) llama USER/getEntityAuditHistory desde el panel de Secretaría. El handler getEntityAuditHistory acepta Administrador, Desarrollador, Secretaría/Secretaria y Director; sin embargo, getEntityAuditHistory no aparece en las listas estáticas ROLE_PERMISSIONS de Secretaría ni Director. validateRolePermission permite que MatrizPermisosRoles dinámica sustituya la matriz estática, por lo que una fila externa podría habilitar la acción; esa configuración no está versionada ni fue verificable desde el repositorio. Sin una concesión dinámica explícita, el dispatcher rechaza la llamada antes de ejecutar el handler.

**Impacto:** el panel de Secretaría/Dirección depende de una configuración externa no demostrada. La aceptación de roles dentro del handler no garantiza que el dispatcher permita llegar a él.

### H9 - ALTO/P1: la consulta por aspirante no implementa paginación real

getEntityAuditHistory acepta limit, lee la hoja completa y recorre filas hacia atrás hasta reunir ese máximo. No recibe page, cursor ni offset y no devuelve metadatos de paginación. loadAdmissionAuditTrail solicita limit: 15 y presenta un contenedor con scroll, sin controles para avanzar páginas. getPaginatedAuditLogReport sí pagina, pero sus fuentes son BitacoraEventos y BitacoraTraceability; no incluye HistorialCambiosEntidad.

**Impacto:** no se puede consultar de forma paginada el historial de un aspirante cuando crece. La UI solo muestra una ventana limitada de filas y no permite recorrer el expediente completo. Incumple requisito 10.

### H10 - ALTO/P1: los fallos de auditoría se silencian y algunas operaciones fallidas no generan eventos

ACADEMIC recordEntityChangeLog captura errores y solo escribe console.warn; logStructuredEvent captura errores y solo escribe console.error. Ambos permiten que la operación de negocio continúe aunque no se haya persistido el evento. USER recordEntityChangeLog también captura y oculta errores de escritura. En el flujo convertAdmissionToStudent, el retorno SECTION_FULL es una respuesta de error directa y no genera un evento de fallo en LogsSistema. El catch de doPost registra excepciones no controladas como UNHANDLED_EXCEPTION, pero las funciones que devuelven objetos status:error sin lanzar excepción no pasan por ese catch.

**Impacto:** la auditoría puede faltar sin que el usuario/operador lo detecte; no se distingue de forma uniforme una denegación de negocio, un fallo de persistencia de la bitácora y una excepción técnica. Incumple requisito 6 y criterio 4.

### H11 - ALTO/P1: la interfaz de trazabilidad permite insertar valores sin escape

loadAdmissionAuditTrail (1187-1225) inserta chg.ejecutadoPor directamente dentro de innerHTML. Para chg.accion y JSON de valoresNuevos utiliza window.escapeHtml solo si existe, pero en el conjunto de scripts cargados por dashboard-secretaria.html (config.js, persistence.js, api.js, ui-common.js y secretary.js) no existe definición de window.escapeHtml; por tanto, se ejecuta el fallback sin escape. Los valores auditados pueden incluir texto controlado por formularios/usuarios, como motivos u observaciones.

**Impacto:** riesgo estático de XSS almacenado en la consola de Secretaría al mostrar valores de auditoría. No se ejecutó prueba dinámica en navegador. Relacionado con F5-011-A10 y AUD-NG-145.

### H12 - ALTO/P1: no existe cobertura de regresión conductual para F5-014

academic-grading-suite.js y modular-dashboard-suite.js no contienen F5-014, getEntityAuditHistory, recordTraceabilityLog ni HistorialCambiosEntidad. No hay pruebas que comprueben el esquema compartido entre ACADEMIC/USER, que la creación/conversión/documentos produzcan eventos, que los cinco servicios compartan correlationId, que el sanitizador enmascare DNI, que la bitácora esté protegida, que la consulta pagine o que los fallos de auditoría sean detectables. Las aserciones existentes de otras fases son principalmente estructurales y no validan estos contratos.

**Impacto:** no hay evidencia automatizada de los criterios de aceptación. Se amplía AUD-NG-161 sin duplicar su causa general.

## 4. Dictamen por criterios de aceptación

| Criterio | Resultado | Evidencia |
|---|---|---|
| Actualización de estado y conversión generan diff en HistorialCambiosEntidad | **No cumple** | updateAdmissionStatus/reopen registran con esquema ACADEMIC incompatible; convertAdmissionToStudent no llama recordEntityChangeLog. |
| Modificación no autorizada de bitácora bloqueada | **No verificable / No cumple como garantía** | No hay protección de hoja, hash o ACL verificable; appendRow no acredita inmutabilidad. |
| Sanitización de contraseñas, tokens e información confidencial | **No cumple** | Faltan DNI/PII; el logger ACADEMIC de entidad no sanitiza. |
| Operaciones fallidas registradas como ERROR/WARN con excepción | **Cumple parcialmente** | catch global y algunos logs existen; retornos status:error y fallos de persistencia pueden quedar sin evento. |
| Reconstrucción cronológica desde recepción hasta matrícula | **No cumple** | Creación y conversión no producen diff; incompatibilidad de esquema impide que el lector recupere los cambios ACADEMIC. |
| Descargas de documentos de menores registradas | **No cumple** | getStudentDocuments/getSecureDocumentStream no registran acceso/descarga. |
| correlationId rastrea una transacción por cinco microservicios | **No cumple** | No hay productores automáticos en los servicios; fetchApi no propaga correlationId. |

## 5. Calidad, alcance y límites de verificación

La implementación tiene piezas aisladas (LogsSistema, HistorialCambiosEntidad, BitacoraTraceability y un panel de consulta), pero no un contrato transversal único. El principal defecto no es la ausencia total de funciones, sino la falta de interoperabilidad entre escritores/lectores, la cobertura incompleta del ciclo de vida y la inexistencia de productores automáticos de correlación. La UI está conectada a un endpoint, pero el endpoint no reconstruye correctamente las filas que ACADEMIC escribe.

**Pruebas ejecutadas:** inspección estática/manual de funciones, esquemas, dispatch, ROLE_PERMISSIONS, permisos dinámicos, llamadas, payloads, sanitizadores, hojas, UI, configuración de servicios, suites y dependencias; consulta de HEAD/base; consulta de árbol Git recursivo (sin truncamiento); verificación de ausencia del informe en árbol e historial; consulta de blob Pendientes.md y comparación con el respaldo íntegro documentado en C1.209.

**No ejecutadas:** Apps Script runtime, HTTP real, lectura/escritura en Google Sheets productivo, ACL efectivas del Spreadsheet, descarga real de documentos, navegador/XSS dinámico, concurrencia, prueba de correlación distribuida, pruebas con usuarios/roles reales y suites automatizadas.

## 6. Reconciliación de dependencias y tareas existentes

- **AUD-NG-145:** ampliar el alcance de logging estructurado, sanitización PII, DTO/consulta y datos exportables; no crear otro ID global para la misma causa.
- **AUD-NG-161:** ampliar cobertura conductual de integridad, concurrencia y pruebas reales; no crear otro hallazgo general de pruebas.
- **AUD-NG-222 / TASK-502:** coordinar permisos contextuales y autorización por entidad; no duplicar el motor ABAC transversal.
- **F5-011-A07:** ampliar la trazabilidad append-only de notificaciones al flujo de admisión.
- **F5-011-A10:** coordinar el renderizado seguro de historiales en Secretaría; el nuevo panel de auditoría reproduce el patrón de fallback sin escape.
- **F5-012-A07:** coordinar únicamente la continuidad de conversión y la separación financiera de aspirantes; su alcance no sustituye la auditoría de trazabilidad.
- **F5-013-A09:** coordinar trazabilidad/contabilidad de operaciones financieras de admisión.
- **TASK-474/TASK-475:** conservar sus alcances de outbox/notificaciones y plantillas/PII; no tratarlos como sustitutos de la bitácora de auditoría.

No se crea ningún ID global nuevo en esta auditoría. Las tareas F5-014-A01..A11 siguientes son subtareas locales de este informe y permanecen Pendientes.

## 7. Tareas ejecutables derivadas de los hallazgos

### F5-014-A01 - Unificar el esquema canónico de HistorialCambiosEntidad
- **Hallazgo:** H1.
- **Severidad/prioridad:** Crítico / P0.
- **Objetivo y acción:** definir un único esquema versionado para todos los servicios; adaptar escritores y lectores a nombres de columna canónicos, validar encabezados y migrar/reconciliar filas históricas sin perder evidencia.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; utilidades de esquema compartido.
- **Dependencias:** AUD-NG-145; F5-012-A07.
- **Alcance técnico:** contrato de 9+ columnas estable, schemaVersion, lectura por encabezado, detección de legacy, migración idempotente y rechazo fail-closed ante esquema desconocido.
- **Criterios verificables:** ACADEMIC y USER escriben el mismo orden semántico; una fila de admisión puede leerse por solicitudId; el lector no interpreta fecha como entidad; la migración preserva filas y permite comparar conteos/hash.
- **Estado:** Pendiente.

### F5-014-A02 - Completar los eventos y diffs del ciclo de vida de admisión
- **Hallazgo:** H2.
- **Severidad/prioridad:** Crítico / P0.
- **Objetivo y acción:** instrumentar creación, cambios de datos, documentos, decisiones, reaperturas, conversión y fallos parciales en las tres bitácoras con diffs anteriores/nuevos.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs.
- **Dependencias:** F5-014-A01; F5-013-A09; F5-006; F5-007; F5-011.
- **Alcance técnico:** catálogo de eventos de negocio, DTO canónico y correlación por solicitud; separar eventos de negocio de logs técnicos.
- **Criterios verificables:** crear solicitud, modificar datos, sustituir documento, decidir, reabrir y convertir producen eventos únicos con diff; cada evento tiene solicitudId, actor, timestamp y resultado; se puede reconstruir el orden.
- **Estado:** Pendiente.

### F5-014-A03 - Propagar correlationId de extremo a extremo
- **Hallazgo:** H3.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** generar correlationId en la entrada del flujo y propagarlo sin regenerarlo por js/api.js, USER, ACADEMIC, ACCOUNTING, TASK y EXAM cuando participen.
- **Archivos/módulos:** js/api.js; backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; backend/task-service/Code.gs; backend/exam-service/Code.gs.
- **Dependencias:** AUD-NG-145.
- **Alcance técnico:** contrato de correlación, validación de formato, propagación en llamadas interservicio y registro automático en BitacoraTraceability.
- **Criterios verificables:** una operación conserva el mismo correlationId en todos los eventos; el lector reconstruye el recorrido y los errores por correlación; las pruebas rechazan correlaciones ausentes o alteradas.
- **Estado:** Pendiente.

### F5-014-A04 - Registrar identidad verificada y contexto de ejecución
- **Hallazgo:** H4.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** persistir actor autenticado, rol verificado, servicio, IP disponible, sesión pseudonimizada, timestamp UTC, motivo, resultado y origen de la petición; eliminar fallbacks a identidades declaradas por el cliente.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs; js/api.js.
- **Dependencias:** AUD-NG-001; AUD-NG-145; AUD-NG-222.
- **Alcance técnico:** DTO de actor basado en claims verificados, captura de contexto confiable y separación de metadatos opcionales/no disponibles.
- **Criterios verificables:** ningún actor se toma de actorId/adminId/authRole del cliente; cada evento identifica al sujeto autenticado; los campos no disponibles quedan explícitamente nulos, no inventados.
- **Estado:** Pendiente.

### F5-014-A05 - Aplicar sanitización y seudonimización de PII en todos los logs
- **Hallazgo:** H5.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** ampliar sanitización recursiva para DNI/identificación, datos de menores, email, teléfono, fecha de nacimiento, tokens, secretos y credenciales; aplicar antes de toda persistencia y exportación.
- **Archivos/módulos:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; funciones de exportación de auditoría.
- **Dependencias:** AUD-NG-145; F5-011-A10.
- **Alcance técnico:** lista central de claves sensibles, allowlist de campos de negocio, pseudónimos estables no reversibles para exportaciones y pruebas de estructuras anidadas/arrays.
- **Criterios verificables:** pruebas con payloads anidados demuestran que DNI, email, teléfono, fechaNacimiento, password, token y secret no aparecen en texto claro en LogsSistema, HistorialCambiosEntidad ni exportaciones.
- **Estado:** Pendiente.

### F5-014-A06 - Hacer inalterables las bitácoras de auditoría
- **Hallazgo:** H6.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** establecer controles de solo lectura, protección de hojas/rangos, separación de escritores/lectores y verificación criptográfica encadenada; registrar intentos de modificación.
- **Archivos/módulos:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/developer-service/Code.gs; configuración y ACL del Spreadsheet.
- **Dependencias:** AUD-NG-145.
- **Alcance técnico:** append-only real, protección de hoja, hashPrevio/hashActual por evento, verificación de continuidad y procedimiento de exportación verificable.
- **Criterios verificables:** roles no autorizados no pueden modificar ni borrar filas; cualquier alteración manual o programática rompe la verificación de cadena; existe evidencia de ACL efectiva.
- **Estado:** Pendiente.

### F5-014-A07 - Auditar accesos y descargas de documentos de menores
- **Hallazgo:** H7.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** emitir eventos de acceso, consulta, preview, descarga, carga, sustitución, revisión y restauración documental con usuario, documento, solicitud/expediente, fecha y resultado.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; rutas Drive y proxy de documentos.
- **Dependencias:** F5-006-A01/A03; F5-014-A02/A04/A05.
- **Alcance técnico:** eventos sin guardar URLs/tokens sensibles, correlación con solicitudId y registro de accesos denegados.
- **Criterios verificables:** cada lectura/descarga registra un evento; el evento identifica al actor y documento sin exponer enlaces privados; intentos denegados también quedan registrados.
- **Estado:** Pendiente.

### F5-014-A08 - Corregir permisos y habilitar consulta paginada por aspirante
- **Hallazgo:** H8 y H9.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** incluir la acción en permisos estáticos adecuados, conservar la validación contextual por entidad y agregar paginación real para HistorialCambiosEntidad.
- **Archivos/módulos:** backend/user-service/Code.gs; js/secretary.js; dashboard-secretaria.html.
- **Dependencias:** AUD-NG-222/TASK-502; AUD-NG-145.
- **Alcance técnico:** page/pageSize o cursor estable, límites máximos, filtros por solicitudId/tipo de entidad y metadatos total/hasNext; no depender de una matriz dinámica no versionada para una función esencial.
- **Criterios verificables:** Secretaría/Dirección autorizadas consultan por solicitud; roles no autorizados reciben denegación; las páginas no duplican ni omiten eventos bajo orden estable.
- **Estado:** Pendiente.

### F5-014-A09 - Garantizar registro y alerta de fallos de auditoría
- **Hallazgo:** H10.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** diferenciar errores de negocio, denegaciones, excepciones y fallos del propio logger; evitar que un fallo de persistencia quede reducido a console.warn/error.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs.
- **Dependencias:** AUD-NG-145; F5-014-A01/A02.
- **Alcance técnico:** contrato de resultados de auditoría, retry/outbox o alerta durable, códigos y severidades consistentes y política de transacción cuando no pueda persistirse una evidencia obligatoria.
- **Criterios verificables:** los errores devueltos y las excepciones producen eventos diferenciados; el fallo del logger queda visible y recuperable; ningún proceso crítico declara éxito sin cumplir la política de auditoría.
- **Estado:** Pendiente.

### F5-014-A10 - Renderizar la bitácora sin XSS
- **Hallazgo:** H11.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** eliminar interpolación no escapada en loadAdmissionAuditTrail y utilizar una función de escape contextual obligatoria, sin fallback inseguro.
- **Archivos/módulos:** js/secretary.js; js/ui-common.js; dashboard-secretaria.html.
- **Dependencias:** F5-011-A10; AUD-NG-145/TASK-475.
- **Alcance técnico:** escapar texto y atributos, construir nodos DOM seguros y limitar campos visibles.
- **Criterios verificables:** payloads con HTML/script en actor, acción, motivo y valores nuevos se muestran como texto; no existe ruta de fallback que inserte contenido crudo.
- **Estado:** Pendiente.

### F5-014-A11 - Crear pruebas conductuales de auditoría y correlación
- **Hallazgo:** H12.
- **Severidad/prioridad:** Alto / P1.
- **Objetivo y acción:** incorporar pruebas aisladas de esquema, ciclo de vida, permisos, PII, inmutabilidad, documentos, paginación, fallos y correlación entre servicios.
- **Archivos/módulos:** tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js; suites de USER/ACADEMIC/ACCOUNTING.
- **Dependencias:** AUD-NG-161; F5-014-A01..A10.
- **Alcance técnico:** mocks de Spreadsheet/Drive, pruebas de contrato entre servicios, inyección de fallos, manipulación de filas y verificación de resultados reales de cada aserción.
- **Criterios verificables:** cada requisito de F5-014 tiene casos PASS/FAIL que comprueban comportamiento, no solo presencia de nombres; las pruebas no escriben en datos productivos y detectan regresiones de esquema/correlación.
- **Estado:** Pendiente.

## 8. Archivos modificados y no modificados

**Documentación modificada en esta iteración:**
- AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-014.md (nuevo).
- AUDITORIAS/Auditoria.txt.
- AUDITORIAS/MapaDependencias.md.
- AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md.
- AUDITORIAS/Contexto_personal.txt (checkpoint C1.210).

**Sin modificar:**
- backend/*; js/*; HTML; tests/*.
- completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md.
- Rama base NG_beta_0.0.0.1.
- Informes previos F5-011, F5-012 y F5-013.

La iteración es exclusivamente de auditoría/documentación. No se ejecutaron las tareas derivadas ni se modificó código fuente.

## 9. Continuidad

- Última tarea completamente auditada: TAREA-F5-014.
- Dictamen: NO CUMPLE.
- Tareas locales derivadas: F5-014-A01..A11, todas Pendientes.
- Siguiente tarea: TAREA-F5-015 - guardado automático de borradores y recuperación de solicitudes. Verificar primero informe individual e historial en la rama de trabajo; si falta, auditar desde cero.
