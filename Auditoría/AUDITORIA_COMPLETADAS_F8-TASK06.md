# Auditoría F8-Task06 / TAREA-F8-MANT-01 — Supervisión preventiva de almacenamiento en Google Drive

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2154Z-01 (identificador documental; no es un ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.265.
- **Checkpoint de cierre:** C1.266.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama de trabajo:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** 3a321c0cb406a70bfdfe11349b41adfa21b88ce9; árbol Git 19cb9730013531f829da0b0df7acc717d33b8620.
- **Rama base protegida:** NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación al inicio: 334 commits adelante, 0 detrás; la rama base permanece intacta.
- **Tarea auditada:** F8-Task06 / TAREA-F8-MANT-01, marcada [X] en completadas.md, línea 4888.
- **Informe individual previo:** no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK06.md (404) ni resultado de búsqueda por F8-Task06; se realizó la auditoría directamente.
- **Dictamen:** **NO CUMPLE**. CA-F8-010, CA-F8-011 y CA-F8-012 NO CUMPLEN. La marca histórica [X] se conserva, pero no acredita el cumplimiento técnico.

## 1. Objetivo y criterios de aceptación

Comprobar la identificación y supervisión de ubicaciones Drive, medición periódica de cuota y tendencia, umbrales configurables, alertas administrativas, seguridad de las cargas y prevención de archivos huérfanos.

- **CA-F8-010:** se identifican y monitorean las ubicaciones de almacenamiento utilizadas por el aula virtual.
- **CA-F8-011:** la simulación de cuota cercana al límite genera alertas preventivas para administradores.
- **CA-F8-012:** las cargas fallidas por espacio no se confirman como entregas registradas exitosamente.

## 2. Fuentes consultadas y respaldo

| Archivo | SHA | Secciones inspeccionadas |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task06, línea 4888; alcance, seis requisitos y tres criterios |
| Pendientes.md | 676a3f798715f0cdd7d4bc75768472545b8465ee | Blob completo recuperado; búsqueda de F8-Task06, F8-MANT-01 y TASK-656..TASK-660 |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | doPost, PUBLIC_ACTIONS, uploadFile, uploadChunk (dos declaraciones), finishChunkedUpload, submitAssignment, saveSubmissionDraft, getStudentFolder, getOrCreateFolder, createStudyMaterial, initiateResumableUpload, getUploadProgress, cancelUploadSession, reconstructFileParts y getDriveStorageQuotaMetricsReport |
| js/student.js | e2888cea60322e49a40b89adadb8010489605dcc | flujo de carga segmentada, reintentos, selección de folderId/fileId y submitAssignment |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 | publicación de materiales y health checks |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | cliente común de llamadas API; no se encontró invocación del reporte de cuota |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | líneas 2673–2680: registro de creación de backlog F8; no se encontró evidencia de implementación/prueba de F8-MANT-01 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | reglas de auditoría manual, tareas derivadas, commits y checkpoints |
| AUDITORIAS/Contexto_personal.txt | a89a589c5a463eb1ce2e9414fe7062556a70f6b7 | reglas prioritarias y checkpoint C1.265 |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | ac3ba6451bbfdfc5e306502b2cbaf709e8ecb83e | continuidad después de F8-Task05 |

La consulta del árbol Git identificó 978 archivos versionados. No se encontró appsscript.json ni el documento fuente AUDITORIA_FASE_8_AULA_VIRTUAL_APRENDIZAJE.md. El manifest.json presente es el manifiesto de la PWA, no el manifiesto de un proyecto Apps Script; por ello no se puede confirmar desde este repositorio la habilitación del servicio avanzado Drive.

### Recuperación de Pendientes.md

La lectura del blob actual se realizó mediante fetch_blob después de las lecturas convencionales sin contenido en sesiones anteriores. Resultado comprobado en esta sesión:

- SHA actual: 676a3f798715f0cdd7d4bc75768472545b8465ee.
- 1.786.011 caracteres; 20.224 líneas; 0 caracteres U+FFFD.
- No contiene F8-Task06, F8-MANT-01 ni TASK-656..TASK-660.
- Último ID numérico de tarea encontrado: TASK-636.
- El árbol del HEAD confirma que este blob es el contenido actual de Pendientes.md en la rama de trabajo. No requiere restauración y no se modificó.

La auditoría conserva las tareas derivadas en este informe, de acuerdo con la estructura de auditoría vigente. No se modifica el registro histórico de tareas completadas.

## 3. Inventario de ubicaciones Drive

### 3.1 Ubicaciones identificadas en código

- **Raíz institucional de tareas:** constante DRIVE_FOLDER_ID en backend/task-service/Code.gs:5–6.
- **Entregas individuales:** uploadFile, líneas 704–789, crea la jerarquía DRIVE_FOLDER_ID / grado / sección / alumno / parcial / asignatura / tarea_usuario.
- **Carpeta de alumno:** getStudentFolder, líneas 1231–1247, utiliza DRIVE_FOLDER_ID / grado / sección / alumno.
- **Proyectos PSeInt:** saveProject, líneas 1249–1293, crea Proyectos_PSeInt dentro de la carpeta del alumno.
- **Carga fragmentada antigua:** uploadChunk (primera declaración, líneas 795–816) crea .temp_uploads en DriveApp.getRootFolder(), fuera de DRIVE_FOLDER_ID; finishChunkedUpload (822–889) reconstruye y trata de eliminar la carpeta temporal.
- **Carga reanudable:** initiateResumableUpload, líneas 1819–1916, crea DRIVE_FOLDER_ID / .temp_resumable_uploads / sessionKey.
- **Materiales educativos:** createStudyMaterial, líneas 1665–1695, registra URL y driveId en MaterialesEducativos, pero no crea ni valida el archivo ni su carpeta. teacher.js:1978–1987 permite enviar la URL genérica https://drive.google.com cuando no se proporciona URL.
- **Metadatos:** logFileMetadata, líneas 29–62, registra el fileId y la URL en MetadatosArchivos; el campo RutaDrive recibe meta.fileUrl, no una ruta de carpetas verificable.
- **Versiones de entregas:** submitAssignment, líneas 909–979, registra referencias fileId/URL y versiones en EntregasVersiones; no define un repositorio o carpeta de versiones separado.

El inventario anterior permite reconocer rutas principales, pero no existe un catálogo central de ubicaciones con ID, propósito, propietario, estado y métricas por ubicación. Los materiales se registran como referencias externas y las versiones se registran en Sheets, sin validación del destino real.

### 3.2 Medición no vinculada a esas ubicaciones

getDriveStorageQuotaMetricsReport consulta la cuota global de Drive (o una muestra de archivos de DriveApp.getFiles()); no recorre DRIVE_FOLDER_ID ni las carpetas de materiales, tareas, entregas, versiones y temporales. Por tanto, no produce medición por ubicación ni permite identificar qué carpeta causa el crecimiento.

**Resultado de CA-F8-010: NO CUMPLE.**

## 4. Medición de cuota, periodicidad y tendencia

backend/task-service/Code.gs:2299–2363, getDriveStorageQuotaMetricsReport:

1. Inicializa bytesUsed en 0 y bytesTotal en 15 GiB codificados.
2. Si existe Drive.About.get, intenta leer quotaBytesUsed y quotaBytesTotal.
3. Si el servicio avanzado no está disponible, suma el tamaño de como máximo los primeros 100 archivos devueltos por DriveApp.getFiles(); no recorre todo Drive ni la raíz institucional.
4. Si la consulta de Drive falla, solo escribe Logger.log y continúa con los valores iniciales.
5. Calcula bytes libres y porcentaje a partir de esos valores; puede devolver status success y nivel NORMAL con 0 bytes utilizados aunque la consulta real haya fallado.
6. No persiste muestras, no calcula tasa de crecimiento ni conserva una serie temporal.

La acción getDriveStorageQuotaMetricsReport se enruta en doPost, líneas 368–444, como una consulta invocable bajo demanda. En el código de task-service no se encontró un mecanismo de activador temporal, scheduler, almacenamiento histórico de mediciones ni tarea periódica de supervisión. El repositorio no contiene appsscript.json para revisar configuración de triggers/servicios avanzados. No se afirma que no existan triggers configurados fuera del repositorio; simplemente no hay evidencia versionada que permita verificarlos.

**Resultado:** medición parcial/no confiable, sin periodicidad ni tendencia. CA-F8-010 y CA-F8-011 NO CUMPLEN.

## 5. Umbrales, alertas y registro de eventos

En getDriveStorageQuotaMetricsReport, líneas 2328–2354:

- 80 % produce ADVERTENCIA.
- 90 % produce RIESGO_ELEVADO.
- 95 % produce CRITICO.
- Los valores están escritos directamente en la función; no se leen de configuración administrativa ni de propiedades.
- La función devuelve mensaje y métricas al llamador; no se observa envío de correo, notificación, evento a un panel administrativo ni creación de incidencia.
- No se registra un evento persistente por estado NORMAL, ADVERTENCIA, RIESGO_ELEVADO o error confirmado. Las excepciones de consulta se envían a Logger.log y el flujo puede continuar como si el almacenamiento estuviera normal.

El endpoint también figura en PUBLIC_ACTIONS, backend/task-service/Code.gs:85–89. validateRolePermission, línea 225 y siguientes, autoriza directamente las acciones de esa lista antes de validar credenciales. Por tanto, la consulta de cuota no está limitada a administradores. Se registra este riesgo como ampliación de la tarea de seguridad existente TASK-636, no como una tarea duplicada.

**Resultado de CA-F8-011: NO CUMPLE.**

## 6. Integridad de cargas y confirmación de entregas

### 6.1 Carga directa

uploadFile, líneas 704–789, crea el archivo con taskDeliveryFolder.createFile(blob) antes de devolver success. Esto es correcto en el camino simple cuando Drive crea el archivo. Sin embargo, la función no integra la operación con la posterior confirmación de la entrega ni dispone de una compensación segura para archivos parciales.

js/student.js:2355–2410 divide archivos grandes en partes y llama uploadFile por cada parte. Si una parte posterior falla después de que otras se hayan creado, el frontend detiene el proceso, pero no elimina ni registra para limpieza las partes ya subidas. Esas partes pueden quedar en la carpeta de entrega sin un registro de entrega consolidado.

### 6.2 Carga reanudable y reconstrucción

Hay dos declaraciones globales de uploadChunk:
- Primera declaración, líneas 795–816, marcada como antigua.
- Segunda declaración, líneas 1967–2060, que es la implementación efectiva llamada por doPost.

En la implementación efectiva:
- Se crea el archivo de fragmento en Drive.
- Se actualizan los fragmentos confirmados.
- Cuando se alcanza el total, el estado de sesión se cambia a COMPLETED antes de comprobar que la reconstrucción haya terminado correctamente.
- Se invoca reconstructFileParts, líneas 2120–2185.
- reconstructFileParts captura errores y puede devolver {status: "error"}.
- uploadChunk no comprueba reconstructedResult.status y aun así devuelve {status: "success"} con sessionCompleted true.
- En el mismo flujo se intenta eliminar la carpeta de una sesión anterior marcada como reemplazada, sin comprobar primero que la reconstrucción nueva haya producido un archivo final válido.

Esto permite comunicar éxito y marcar una sesión completa aunque la creación del archivo consolidado haya fallado por cuota o por otro error. También puede eliminar la versión anterior antes de tener confirmación de la nueva.

### 6.3 Confirmación de entrega

submitAssignment, líneas 892–994:
- Reconsulta la cuota, pero bloquea solo cuando porcentajeUso es >= 99.5 %, no cuando se alcanzan los umbrales preventivos 80/90/95.
- Si la consulta de cuota falla o devuelve datos incompletos, captura el error y continúa con la persistencia.
- No verifica que un fileId recibido exista realmente en Drive ni que sea el archivo final ensamblado.
- Registra la entrega y su versión en Sheets y devuelve status success.

saveSubmissionDraft, líneas 996–998, reutiliza el mismo flujo.

El flujo frontend js/student.js:2500–2585 envía fileId/mimeType a submitAssignment y presenta el mensaje de entrega exitosa si recibe status success. Por lo tanto, la combinación de respuesta success falsa en carga reanudable y la ausencia de verificación del archivo en submitAssignment permite confirmar una entrega sin un archivo final correctamente almacenado.

**Resultado de CA-F8-012: NO CUMPLE.**

## 7. Prevención de archivos huérfanos y conservación de archivos válidos

- uploadFile crea partes directamente en la carpeta final; si una parte posterior falla, las anteriores quedan sin consolidación ni limpieza coordinada.
- La ruta antigua .temp_uploads está en la raíz de Drive y finishChunkedUpload solo la elimina tras reconstrucción exitosa; los errores dejan archivos temporales.
- La ruta reanudable .temp_resumable_uploads tiene cancelUploadSession para una cancelación explícita, pero no se observa una rutina periódica que detecte sesiones abandonadas, huérfanos o temporales vencidos.
- La sustitución de sesión puede poner en papelera la carpeta de la sesión anterior aunque la nueva reconstrucción haya fallado.
- logFileMetadata ignora fallos al registrar metadatos y uploadFile puede devolver éxito con el archivo creado aunque no exista registro de metadatos.
- No se encontró una política de limpieza con verificación de propiedad, edad, vínculo a una entrega y exclusión de archivos académicos válidos.

**Resultado:** no se acredita la prevención de huérfanos ni la conservación segura de archivos académicos. La eliminación automática de la carpeta anterior antes de validar la nueva carga representa un riesgo de pérdida de datos.

## 8. Hallazgos

### AUD-NG-301 — Métricas de cuota inexactas y comportamiento fail-open
- **Severidad:** ALTO/P1.
- **Archivo:** backend/task-service/Code.gs:2299–2363.
- **Evidencia:** 15 GiB codificados; fallback limitado a 100 archivos globales; excepción de Drive silenciada y cálculo posterior con 0 bytes usados; respuesta success puede indicar NORMAL sin lectura válida.
- **Impacto:** los administradores y los procesos de entrega pueden recibir una imagen falsa de disponibilidad.
- **Criterios:** CA-F8-010 y CA-F8-011.
- **Tarea derivada:** TASK-656.

### AUD-NG-302 — No existe supervisión periódica ni tendencia persistida
- **Severidad:** ALTO/P1.
- **Archivos:** backend/task-service/Code.gs:368–444 y 2299–2363; árbol Git del proyecto.
- **Evidencia:** el reporte solo se ejecuta cuando se invoca la acción POST; no se encontró scheduler, trigger versionado, historial de muestras ni cálculo de tendencia. No existe appsscript.json en el árbol.
- **Impacto:** no hay detección preventiva entre consultas manuales ni pronóstico de agotamiento.
- **Criterios:** CA-F8-010 y CA-F8-011.
- **Tarea derivada:** TASK-657.

### AUD-NG-303 — Umbrales no configurables y alertas/eventos no entregados a administración
- **Severidad:** ALTO/P1.
- **Archivo:** backend/task-service/Code.gs:2328–2354.
- **Evidencia:** 80/90/95 codificados; el mensaje solo forma parte de la respuesta; no hay canal de notificación administrativa ni registro persistente de los cuatro estados.
- **Impacto:** no se pueden adaptar umbrales ni garantizar que administración reciba y pueda auditar las alertas.
- **Criterio:** CA-F8-011.
- **Tarea derivada:** TASK-658.

### AUD-NG-304 — Carga reanudable puede reportar éxito sin archivo final y destruir la versión anterior
- **Severidad:** CRÍTICO/P0.
- **Archivos:** backend/task-service/Code.gs:1967–2060, 2120–2185 y 892–994.
- **Evidencia:** la sesión se marca COMPLETED antes de la reconstrucción; el resultado de reconstructFileParts no se valida; uploadChunk devuelve success incluso si la reconstrucción retorna error; se limpia la carpeta anterior sin validar la nueva; submitAssignment falla abierto ante error de cuota y no verifica el fileId.
- **Impacto:** una entrega puede confirmarse sin archivo consolidado y una versión anterior válida puede enviarse a papelera cuando la nueva carga falla.
- **Criterio:** CA-F8-012.
- **Tarea derivada:** TASK-659.

### AUD-NG-305 — Cargas parciales y sesiones temporales pueden dejar archivos huérfanos
- **Severidad:** ALTO/P1.
- **Archivos:** backend/task-service/Code.gs:704–889, 1819–1916, 2062–2185; js/student.js:2355–2410.
- **Evidencia:** cargas segmentadas directas pueden fallar después de crear partes; .temp_uploads no tiene limpieza periódica; cancelUploadSession solo limpia cancelaciones explícitas; no hay rutina de expiración/reconciliación de temporales.
- **Impacto:** acumulación de almacenamiento no contabilizado por entrega, aumento de cuota y dificultad para identificar archivos válidos frente a huérfanos.
- **Criterios:** CA-F8-010 y CA-F8-012.
- **Tarea derivada:** TASK-660.

### AUD-NG-306 — Endpoint de métricas de cuota expuesto en allowlist pública
- **Severidad:** MEDIO/P2.
- **Archivo:** backend/task-service/Code.gs:85–89, 225 y 389–391.
- **Evidencia:** getDriveStorageQuotaMetricsReport está en PUBLIC_ACTIONS y validateRolePermission permite esas acciones sin credenciales.
- **Impacto:** cualquier llamador puede consultar capacidad, uso, disponibilidad y porcentaje del almacenamiento institucional.
- **Tarea derivada:** ampliar TASK-636 de F8-Task01, que ya cubre cierre de bypasses en allowlists públicas; no crear una tarea duplicada.

## 9. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-F8-010 | NO CUMPLE | Se identifican algunas carpetas, pero el reporte no mide por ubicación ni valida todos los destinos de materiales/entregas/versiones. |
| CA-F8-011 | NO CUMPLE | Medición no confiable, sin ejecución periódica, tendencia, umbrales configurables ni notificación administrativa persistente. |
| CA-F8-012 | NO CUMPLE | El flujo reanudable puede reportar success sin archivo final; submitAssignment no valida el archivo y permite continuar si falla la consulta de cuota. |

## 10. Tareas ejecutables derivadas de los hallazgos

### TASK-656 — Implementar medición autoritativa y fail-closed de cuota Drive
- **Hallazgo:** AUD-NG-301.
- **Severidad:** ALTO/P1.
- **Objetivo:** obtener bytes totales, utilizados y disponibles desde una fuente real y validar su integridad antes de informar NORMAL.
- **Acción:** configurar y verificar explícitamente la fuente oficial de cuota; eliminar el límite arbitrario de 100 archivos como sustituto de la cuota; diferenciar cero real, dato ausente y error; devolver estado UNKNOWN/ERROR si la medición no es confiable; no permitir que el sistema interprete errores como disponibilidad.
- **Archivos/módulos:** backend/task-service/Code.gs; configuración Apps Script versionada y documentación operativa.
- **Dependencias:** permisos Drive, servicio avanzado y modelo de almacenamiento de la cuenta.
- **Alcance:** medición de cuota y validación de datos; no crear aún alertas ni tareas programadas.
- **Criterios de aceptación:** pruebas de cuota real, cuota cero, campos ausentes, API no habilitada, excepción y respuesta parcial; ninguna falla de consulta puede devolver NORMAL; métricas con unidad y fecha.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-657 — Programar supervisión periódica y conservar tendencia histórica
- **Hallazgo:** AUD-NG-302.
- **Severidad:** ALTO/P1.
- **Objetivo:** detectar preventivamente el crecimiento de almacenamiento sin depender de una consulta manual.
- **Acción:** crear un trigger de tiempo documentado y gestionado de forma idempotente; guardar muestras con fecha, bytes usados/totales/libres, porcentaje, fuente y estado; calcular variación por período y tendencia; registrar fallos de ejecución.
- **Archivos/módulos:** backend/task-service/Code.gs; appsscript.json y documentación de despliegue/operación, una vez incorporados al repositorio.
- **Dependencias:** TASK-656, cuotas de ejecución Apps Script y permisos de almacenamiento.
- **Alcance:** supervisión automática e historial; sin modificar archivos académicos.
- **Criterios de aceptación:** trigger verificable; no duplicación de triggers; muestras persistidas; tendencia reproducible; error de lectura registrado sin falso NORMAL; prueba aislada con datos simulados.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-658 — Configurar umbrales y entregar alertas administrativas auditables
- **Hallazgo:** AUD-NG-303.
- **Severidad:** ALTO/P1.
- **Objetivo:** permitir que administración configure límites y reciba alertas confiables.
- **Acción:** mover umbrales a configuración validada; distinguir NORMAL, ADVERTENCIA, RIESGO_ELEVADO, CRITICO y ERROR_CONFIRMADO; emitir notificación por canal administrativo definido; registrar transición, fecha, valor, umbral, destinatario y resultado de envío; evitar spam con deduplicación/escalamiento.
- **Archivos/módulos:** backend/task-service/Code.gs; panel administrativo/configuración y mecanismo de notificaciones.
- **Dependencias:** TASK-656 y TASK-657.
- **Alcance:** configuración, entrega de alertas y auditoría; no eliminar automáticamente contenido.
- **Criterios de aceptación:** umbrales configurables y validados; simulación en 80/90/95 o valores configurados genera el estado correcto; destinatarios reciben la alerta; fallos de notificación se registran; cada estado queda persistido.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TASK-659 — Hacer transaccional la finalización de cargas y la confirmación de entregas
- **Hallazgo:** AUD-NG-304.
- **Severidad:** CRÍTICO/P0.
- **Objetivo:** impedir success/COMPLETED hasta que el archivo final exista y su integridad esté verificada.
- **Acción:** reconstruir en estado provisional; validar todos los fragmentos esperados, hash/tamaño y existencia del archivo final; verificar fileId y propiedad/relación con la sesión antes de registrar entrega; devolver error si reconstructFileParts falla; persistir COMPLETED solo después de verificar el resultado; conservar la versión anterior hasta que la nueva se haya confirmado; separar borrador de entrega definitiva; definir compensación segura ante fallo entre Drive y Sheets.
- **Archivos/módulos:** backend/task-service/Code.gs; js/student.js; pruebas de carga y entrega.
- **Dependencias:** TASK-656; almacenamiento Drive; modelo de sesiones y versiones.
- **Alcance:** flujos directos, fragmentados y reanudables; no ejecutar pruebas destructivas con archivos académicos reales.
- **Criterios de aceptación:** fallos de cuota/API/reconstrucción nunca devuelven success ni COMPLETED; fileId inexistente/recurso incorrecto se rechaza; el registro Entregas solo se confirma después de verificar el archivo final; la versión anterior se conserva hasta confirmación de la nueva; pruebas de duplicado, fragmento faltante y reintento.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### TASK-660 — Inventariar ubicaciones y limpiar temporales huérfanos de forma segura
- **Hallazgo:** AUD-NG-305.
- **Severidad:** ALTO/P1.
- **Objetivo:** identificar los destinos de materiales, entregas, versiones, proyectos y cargas temporales y evitar acumulación de residuos.
- **Acción:** definir catálogo de carpetas con ID/propósito/propietario; registrar la ubicación real y relación de cada archivo con su entrega/material/versión; implementar reconciliación de sesiones expiradas y temporales sin referencia; exigir antigüedad, estado terminal y ausencia de vínculo antes de limpiar; poner en cuarentena y generar reporte antes de eliminar; nunca enviar a papelera archivos académicos válidos automáticamente.
- **Archivos/módulos:** backend/task-service/Code.gs; js/student.js; administración de almacenamiento; documentación de carpetas.
- **Dependencias:** TASK-656 y TASK-659.
- **Alcance:** inventario, reconciliación y limpieza controlada de temporales; no purgar archivos productivos en la primera fase.
- **Criterios de aceptación:** todas las rutas utilizadas aparecen en catálogo; archivos válidos se conservan; huérfanos se identifican con evidencia; temporales vencidos se ponen en cuarentena; toda limpieza es auditable y reversible; pruebas con fixtures.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Ampliación de tarea existente — TASK-636
- **Hallazgo:** AUD-NG-306.
- **Tarea existente:** TASK-636, originada en F8-Task01, cierre de bypasses en allowlists públicas y validación de identidad/propiedad.
- **Ampliación:** retirar getDriveStorageQuotaMetricsReport de PUBLIC_ACTIONS y exigir autorización administrativa explícita; añadir pruebas de acceso anónimo, estudiante, docente y administrador.
- **No se crea un ID nuevo** para evitar duplicar el alcance de seguridad ya registrado.
- **Estado:** Pendiente de integrar en TASK-636.

## 11. Pruebas, límites y archivos

- **Inspección manual realizada:** definición F8-Task06 y criterios; backend/task-service/Code.gs en los rangos señalados; funciones de cuota, subida, reconstrucción, metadatos, carpetas, entrega y enrutamiento; js/student.js en los flujos de subida y confirmación; js/teacher.js en publicación de materiales; js/api.js; ChangesLogs; árbol Git; blob de Pendientes.md; metodología, plan y contexto.
- **Verificación Git:** HEAD de trabajo 3a321c0cb406a70bfdfe11349b41adfa21b88ce9; árbol 19cb9730013531f829da0b0df7acc717d33b8620; rama base 44d9891132332e692dbe2ba8602b41f50a508a59; comparación 334 commits adelante y 0 detrás.
- **Pruebas ejecutadas:** inspección manual de código y documentos; consulta de existencia del informe; revisión de árbol Git; recuperación y búsqueda en blob de Pendientes.md; comparación de ramas.
- **Pruebas no ejecutadas:** Apps Script runtime; Drive API real; triggers; envío de alertas; simulación real de cuota; cargas con Drive lleno; reconstrucción de fragmentos; persistencia en Sheets; navegador; Node; E2E; pruebas con cuentas/archivos productivos.
- **Limitaciones:** no se accedió al proyecto Apps Script desplegado ni a sus triggers externos; no se modificó ni eliminó ningún archivo de Drive; no se alteraron registros académicos.
- **Archivos nuevos:** AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK06.md.
- **Archivos actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin cambios:** backend/task-service/Code.gs; js/student.js; js/teacher.js; js/api.js; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.
- **Dictamen final:** NO CUMPLE; se conserva [X] histórica en completadas.md sin certificar los criterios.

## 12. Continuidad

- **Última tarea auditada:** F8-Task06 / TAREA-F8-MANT-01.
- **Checkpoint inicial:** C1.265.
- **Checkpoint de cierre:** C1.266.
- **Estado de la tarea:** auditoría terminada; correcciones pendientes como tareas derivadas.
- **Siguiente tarea:** F8-Task07 — arquitectura de dashboards dinámicos para roles configurables, criterios CA-AD-101, CA-AD-102 y CA-AD-103.
- **Informe individual F8-Task07:** no se encontró AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK07.md en el árbol actual; verificarlo nuevamente al iniciar la próxima auditoría y, si sigue faltando, auditar directamente.
- **Próxima acción concreta:** abrir completadas.md desde F8-Task07 (después de F8-Task06, línea aproximada 4910); localizar dashboard dinámico, catálogo de roles, resolución de módulos, permisos efectivos y fallback de roles desconocidos; contrastar HTML, js/ui-common.js, backend/user-service/Code.gs y los informes de F8-Task08/09 si afectan dependencias.
- **Commit de cierre:** el commit único que contiene este informe, bitácora, mapa, plan y checkpoint; SHA final se confirma después de publicar.
