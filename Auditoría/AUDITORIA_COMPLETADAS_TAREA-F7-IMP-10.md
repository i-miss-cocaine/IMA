# AUDITORÍA TAREA-F7-IMP-10
## Fortalecer las notificaciones y la trazabilidad de cambios académicos

- **Fecha:** 2026-11-08.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida auditado:** f1f55f3b3bc89cc15d32ae3d9eac3fddc1511a21 (C1.241).
- **Checkpoint inicial:** C1.241. **Checkpoint de cierre:** C1.242.
- **ID de sesión operativo:** IMA-AUDIT-20261108-0037Z (no es un ID nativo de ChatGPT).
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica [X] de completadas.md.
- **Severidad global:** ALTA/P1. Riesgo elevado en entrega falsa, destinatarios incompletos, trazabilidad inconsistente y ausencia de conexión entre eventos académicos y despacho. Los problemas de autenticación se relacionan con la causa transversal ya registrada en AUD-NG-001.

## 1. Alcance y criterios

TAREA-F7-IMP-10 figura como completada en completadas.md y contiene CA-F7-63..68. Se verificaron los requisitos de identificación de destinatarios, diferenciación por audiencia, cobertura de cambios de fecha/hora/aula/docente/cancelación/reprogramación, información anterior/nueva, consulta histórica, estados de entrega, deduplicación, reintentos, aislamiento de errores, privacidad y configuración de canales.

## 2. Integridad documental y fuentes

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F7-IMP-10 marcada [X], criterios CA-F7-63..68. No se modifica.
- El informe individual AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-10.md no existía; se crea en esta iteración.
- El origen citado AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md no existe en raíz ni en AUDITORIAS. Se omite únicamente el documento ausente y se audita contra el alcance de completadas.md, ChangesLogs y la implementación real.
- Pendientes.md devolvió 0 caracteres en la lectura ordinaria. Se recuperó el blob del HEAD de trabajo, SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, con 1.782.094 caracteres y 20.182 líneas. Se verificó que TASK-577..TASK-583 y AUD-NG-245 no existen allí. Se usa solo para comprobar colisiones históricas, no como fuente operativa ni se modifica.
- Se comprobó que AUD-NG-245 y TASK-577..TASK-583 no existían en Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt, completadas.md ni el blob consultado de Pendientes.md.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, entrada de TAREA-F7-IMP-10 alrededor de la línea 2353: afirma despacho estandarizado, deduplicación, seguimiento y controlador UI de historial. La inspección confirma que hay funciones parciales, pero no un flujo integrado ni una UI invocada.
- METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee; se aplicó inspección manual y separación entre auditoría e implementación.

## 3. Evidencia técnica

### 3.1 Despacho y conexión con los cambios académicos

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- createClassSchedule (líneas 6900-6990) guarda el horario y luego escribe directamente una fila en BandejaNotificaciones. No invoca dispatchScheduleChangeNotifications ni sendMultiChannelNotification. La fila incluye solo docenteUserId, un texto genérico y una clave NOTIF_SCHED_<horarioId>_<diaSemana>; no incluye actor, oferta completa, valores anteriores, valores nuevos, correlación ni confirmación de canal.
- La escritura directa marca estadoEntrega = Entregado sin efectuar un envío ni comprobar que el usuario haya recibido/abierto el aviso. La fila se añade dentro de un try/catch que registra WARN, por lo que el fallo de notificación no revierte el horario ya guardado. Esto sí aporta aislamiento parcial del error de comunicación.
- deleteClassSchedule (líneas 6992-7005) cambia el estado a Inactivo sin notificación ni registro de cambio detallado.
- publishClassSchedules (líneas 7008 en adelante) activa borradores y genera logs/snapshot, pero no invoca el dispatcher de notificaciones.
- En el backend académico no se encontró conexión de los eventos de edición, publicación, cancelación o reprogramación con el dispatcher del servicio USER. El código de dispatchScheduleChangeNotifications aparece en USER solo en su definición y en el case del dispatcher doPost; no hay invocación desde el flujo académico.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; dispatchScheduleChangeNotifications (líneas 8858-8896) solo agrega docenteUserId a recipients. ofertaId se recibe pero no se utiliza para resolver estudiantes, responsables, familias o responsables institucionales. Si no hay docenteUserId, recipients queda vacío y la función aun así devuelve status success con cero despachos.
- El mensaje del dispatcher no incluye valores anteriores ni un diff verificable. tipoCambio y motivo son texto de entrada, sin un contrato de evento vinculado al cambio confirmado.
- La clave del dispatcher usa horarioId, diaSemana, horaInicio y destinatario. No incorpora ID/version del evento, tipo de cambio, valores anterior/nuevo ni una secuencia de modificación; puede bloquear una notificación legítima posterior para el mismo bloque/horario. La clave escrita directamente por createClassSchedule es aún menos específica y no se somete a la función de deduplicación.
- La función dispatchScheduleChangeNotifications captura fallos por destinatario, pero devuelve status success incluso si fallan todos; solo informa despachadas. No devuelve estado individual completo ni persistencia de intento por destinatario.

### 3.2 Esquema compartido y registro de notificaciones

- Ambos microservicios declaran el mismo SPREADSHEET_ID: 1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww.
- backend/user-service/Code.gs, getOrCreateSheet (línea 889), crea BandejaNotificaciones con nueve columnas: NotificacionID, UserId, Titulo, Mensaje, Tipo, Categoria, Leido, EnlaceAccion y FechaRegistro.
- sendMultiChannelNotification (líneas 4818 en adelante) escribe doce columnas y las interpreta como ID, destinatario, tipo, título, mensaje, fecha, leído, categoría, enlace, clave de deduplicación, estado de entrega y correo destino. El contrato de cabecera no coincide con el contrato real de escritura/lectura.
- El helper getOrCreateSheet del servicio académico no declara una cabecera específica para BandejaNotificaciones. Si el servicio académico crea primero la hoja, la primera notificación se inserta en fila 1 sin cabecera; getScheduleChangeNotificationLogs usa data.slice(1), por lo que esa primera fila puede quedar excluida. Si USER crea primero, queda una cabecera de nueve columnas para registros de doce.
- No se encontró una hoja ni implementación llamada BitacoraNotificaciones, pese a que esa es la dependencia nombrada en la tarea. El flujo real usa BandejaNotificaciones.
- getScheduleChangeNotificationLogs (USER, líneas 8897 en adelante) filtra tipo en índice 2 y horarioId buscando dentro del texto de índice 4; devuelve destinatario, mensaje, fecha, leído, clave y estado. Sin horarioId devuelve todos los registros de ese tipo, no pagina ni aplica ámbito por oferta/usuario. Depende del esquema de doce columnas, que contradice la cabecera creada por USER.
- La implementación no conserva un identificador formal de evento académico ni un vínculo fuerte con HistorialCambiosEntidad; el texto del mensaje es usado como mecanismo de asociación al horario.

### 3.3 Estados, canales, deduplicación y reintentos

- sendMultiChannelNotification (USER, líneas 4818-4895 aprox.) revisa duplicados leyendo toda la hoja y después hace appendRow, sin LockService ni restricción atómica. Dos solicitudes concurrentes pueden pasar ambas la comprobación y duplicar el aviso.
- La clave no se valida como obligatoria; si no se proporciona, no hay deduplicación. Para los cambios de horario, la clave tampoco identifica una versión/evento único.
- La función inicializa deliveryStatus como Entregado. Si MailApp no existe y no se proporciona correo, persiste la notificación interna con Entregado; si MailApp.sendEmail no lanza excepción, también marca Entregado. No hay recibo del proveedor ni confirmación de lectura en ese paso. Un envío aceptado por MailApp no demuestra entrega final al buzón.
- El parámetro canal se desestructura, pero no se usa para seleccionar un canal. No se verifica la preferencia del usuario ni el estado/configuración del canal antes de enviar. No se implementa el estado Preparado ni una transición explícita Enviado -> Entregado; leido es un booleano separado.
- retryFailedNotificationsQueue (USER, líneas 4761-4817 aprox.) reintenta solo filas Pendiente_Reintento que tienen correo destino. No procesa notificaciones internas sin email; no mantiene lock, contador de intentos, fecha del último intento, error persistido ni límite/backoff. Si el envío externo ocurre y el proceso falla antes de actualizar la hoja, el próximo intento puede enviar de nuevo.
- El reintento actualiza a Entregado al no lanzar MailApp una excepción, sin confirmación de entrega real. El fallo de reintento solo genera log estructurado; no hay estado individual completo consultable.
- La clave deduplicación del envío general se busca en toda la hoja, sin acotar tipo/tenant/evento/destinatario por campos separados. La operación de buscar y luego append no es atómica.

### 3.4 Trazabilidad de cambios académicos

- En backend/academic-service/Code.gs existe recordEntityChangeLog (línea 1568), con cabecera de nueve columnas en orden: HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable y CorrelationID.
- En backend/user-service/Code.gs existe otra función recordEntityChangeLog (línea 2715), que usa el mismo nombre de hoja y el mismo SPREADSHEET_ID, pero define nueve columnas en orden distinto: cambioId, entityType, entityId, accion, valoresAnteriores, valoresNuevos, ejecutadoPor, fechaCambio y correlationId.
- Debido a que ambas funciones solo agregan cabecera cuando getLastRow() === 0, el esquema de la hoja compartida depende del microservicio que la inicialice primero. Después ambos servicios anexan filas con orden diferente; la lectura e interpretación cruzada no es confiable.
- createClassSchedule y deleteClassSchedule no llaman recordEntityChangeLog. publishClassSchedules registra un evento resumido en LogsSistema, pero no registra por cada asignación valores anteriores/nuevos, actor verificado, destinatarios y correlación con el envío.
- La tarea cita HistorialCambiosEntidad y BitacoraNotificaciones como dependencias, pero no existe una relación transaccional entre ambos registros ni una consulta que reconstruya la secuencia cambio -> evento -> destinatario -> intento -> resultado.
- No se encontró evidencia de que el actor de cambios de horario se persista con identidad derivada de _verifiedUserId en un historial por asignación.

### 3.5 API, permisos e interfaz

- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 11-60: fetchApi agrega requesterUserId/requesterRole, pero no transmite sessionToken, authToken ni token. USER.validateRolePermission llama getUserVerifiedRole, que exige una credencial de sesión. La consulta de historial desde UI no completa la autenticación; se amplía la tarea existente TASK-567 y AUD-NG-001, sin crear duplicado.
- En backend/user-service/Code.gs ROLE_PERMISSIONS (líneas 926-1000 aprox.), Director tiene dispatchScheduleChangeNotifications y getScheduleChangeNotificationLogs; Secretaría tiene sendMultiChannelNotification, pero no tiene permiso explícito para dispatchScheduleChangeNotifications ni getScheduleChangeNotificationLogs. El controlador de consulta está escrito en js/secretary.js, por lo que una sesión Secretaría es rechazada por RBAC incluso si se corrige el token.
- dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8 incluye js/secretary.js (línea 317), pero no contiene llamada ni control visible que invoque loadScheduleChangeNotificationLogs.
- js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c define loadScheduleChangeNotificationLogs (línea 1075) una sola vez; solo muestra un alert con hasta cinco entradas. No se encontró invocador en el dashboard ni integración con una actividad seleccionada.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746 y teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71 no contienen el controlador ni una interfaz de historial de notificaciones de horarios.
- La consulta USER permite omitir horarioId y devolver todas las notificaciones CambioHorarioAcademico. No aplica filtro por oferta, rol destinatario, relación académica ni ámbito institucional. La información del mensaje y correo destino se devuelve sin minimización por audiencia.

### 3.6 Pruebas

- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 contiene una aserción estática en línea 77 sobre la existencia de sendMultiChannelNotification y retryFailedNotificationsQueue de F10-Task12. No prueba comportamiento de TAREA-F7-IMP-10 ni CA-F7-63..68.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683 no contiene pruebas de notificaciones de cambios de horario.
- No se encontraron pruebas conductuales para resolución de destinatarios, eventos de cambio/cancelación, estados, deduplicación concurrente, reintentos, aislamiento de fallos o privacidad de mensajes.

## 4. Evaluación de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-63 | NO CUMPLE | El dispatcher no está conectado al ciclo académico; createClassSchedule solo escribe una fila directa y solo para el docente. No cubre cancelación, publicación, reprogramación ni estudiantes/familias. |
| CA-F7-64 | PARCIAL | createClassSchedule captura fallos de registro y no revierte el horario guardado. No existe un outbox/estado durable que permita garantizar despacho posterior y recuperación. |
| CA-F7-65 | NO CUMPLE | La comprobación de duplicados no es atómica; la clave no identifica cada evento y el reintento puede duplicar envíos tras una interrupción. |
| CA-F7-66 | PARCIAL | Hay filas y consulta de historial, pero el esquema compartido es inconsistente, el evento no tiene correlación formal y no se registra el resultado por destinatario de forma confiable. |
| CA-F7-67 | NO CUMPLE | El sistema marca Entregado sin recibo de entrega del canal; no distingue de forma fiable preparado, enviado, entregado y leído. |
| CA-F7-68 | NO CUMPLE | No hay resolución/autorización de destinatarios por relación académica ni minimización del contenido; la consulta puede devolver todos los registros y datos de destinatario. |

**Dictamen general: NO CUMPLE.** Existen componentes parciales de bandeja, envío por correo, deduplicación y consulta, pero no constituyen un flujo de notificación académico integrado, confiable, auditable y limitado por destinatario.

## 5. Hallazgo y reconciliación

### AUD-NG-245

**Notificaciones académicas desconectadas del ciclo de cambios, con destinatarios incompletos, estados de entrega no probados, deduplicación/reintentos no atómicos y esquemas incompatibles de trazabilidad entre microservicios.**

Relaciones:
- AUD-NG-001: autenticación de llamadas frontend y atribución por identidad verificada; se amplía TASK-567.
- AUD-NG-236: integridad del calendario y del ciclo de vida de horarios.
- AUD-NG-237: interfaz docente y ausencia de conexión visible.
- AUD-NG-243: excepciones, cancelación y reprogramación.
- AUD-NG-244: historial/versiones y trazabilidad de cambios de horario.

### Tareas derivadas

**TASK-577 - Conectar el ciclo de cambios académicos con un registro durable de eventos de notificación**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: emitir eventos después de confirmar creación, edición, publicación, cancelación y reprogramación de horarios, conservando valores anteriores/nuevos, actor verificado, motivo, horario/oferta y correlationId.
- Archivos/módulos: backend/academic-service/Code.gs; backend/user-service/Code.gs; almacenamiento de eventos/outbox.
- Dependencias: AUD-NG-236, AUD-NG-243, AUD-NG-244; TASK-569 y TASK-575.
- Aceptación: cada cambio confirmado produce un evento durable una sola vez; un fallo del proveedor no revierte el cambio académico y deja el evento recuperable; eventos no confirmados no se notifican.

**TASK-578 - Resolver destinatarios académicos y aplicar privacidad por audiencia**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: resolver docentes, estudiantes, familias/tutores y responsables institucionales a partir de oferta, matrícula, relaciones familiares y roles vigentes; filtrar por permisos y preferencias.
- Archivos/módulos: backend/academic-service/Code.gs; backend/user-service/Code.gs; contratos de matrícula/oferta/relaciones.
- Dependencias: TASK-577; AUD-NG-001.
- Aceptación: los destinatarios coinciden con las relaciones vigentes; cada audiencia recibe solo campos autorizados; usuarios desvinculados, inactivos o sin permiso quedan excluidos y auditados.

**TASK-579 - Unificar los esquemas de BandejaNotificaciones, BitacoraNotificaciones e HistorialCambiosEntidad**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: definir un contrato único versionado para eventos, notificaciones y cambios; migrar encabezados/filas existentes sin pérdida y evitar que servicios compartan hojas con orden incompatible.
- Archivos/módulos: backend/user-service/Code.gs; backend/academic-service/Code.gs; hojas BandejaNotificaciones, BitacoraNotificaciones e HistorialCambiosEntidad.
- Dependencias: TASK-577.
- Aceptación: ambos servicios escriben/leen el mismo esquema documentado; la primera fila nunca se confunde con datos ni se omite; migraciones son idempotentes y conservan procedencia y correlación.

**TASK-580 - Hacer atómica la deduplicación y robustecer la cola de reintentos**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: deduplicar por evento, versión y destinatario bajo lock/transacción; registrar intentos, tiempos, errores, backoff y resultado; prevenir duplicados por fallos entre envío y confirmación local.
- Archivos/módulos: backend/user-service/Code.gs; almacenamiento de cola y proveedor.
- Dependencias: TASK-577, TASK-579.
- Aceptación: solicitudes concurrentes con la misma clave generan una sola entrega lógica; eventos diferentes no se suprimen; reintentos solo procesan pendientes y registran cada intento; hay límite y política de recuperación verificables.

**TASK-581 - Implementar estados de notificación basados en evidencia y preferencias de canal**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: modelar Preparado, Enviado, Entregado, Fallido y Leído como transiciones diferenciadas; usar confirmaciones reales del canal y aplicar configuración/preferencias.
- Archivos/módulos: backend/user-service/Code.gs; RegistroEnviosExternos; CanalesProveedoresConfig; preferencias de notificación.
- Dependencias: TASK-579, TASK-580.
- Aceptación: ningún canal se marca Entregado o Leído sin evidencia específica; fallos y estados desconocidos permanecen diferenciados; la selección de canal respeta preferencias y políticas institucionales.

**TASK-582 - Integrar el historial de notificaciones en las interfaces y restringir consultas por ámbito**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: conectar el historial a una actividad/horario, permitir consulta por evento, paginar resultados y autorizar a Secretaría/Dirección/docente según alcance; minimizar datos visibles.
- Archivos/módulos: js/secretary.js; dashboard-secretaria.html; js/teacher.js; teacher-dashboard.html; backend/user-service/Code.gs; js/api.js.
- Dependencias: TASK-577, TASK-579, TASK-567.
- Aceptación: controles visibles invocan la consulta; roles autorizados consultan solo su ámbito; respuestas no exponen destinatarios/correos ajenos; la UI muestra estados y errores reales, sin alert genérico ni éxito falso.

**TASK-583 - Añadir regresión conductual para CA-F7-63..68**
- Hallazgo: AUD-NG-245.
- Severidad: ALTO/P1.
- Objetivo: probar ciclo de eventos, destinatarios, privacidad, estados, deduplicación concurrente, reintentos, fallos aislados, consulta histórica y permisos.
- Archivos/módulos: tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js; suites aisladas de USER y ACADEMIC.
- Dependencias: TASK-577..TASK-582.
- Aceptación: cada CA tiene casos positivos y negativos; se reproducen concurrencia y fallos entre envío/registro; no se accede a Sheets productivas; la suite detecta estados Entregado falsos, destinatarios incompletos y mezcla de esquemas.

### Tarea existente ampliada

- **TASK-567 (AUD-NG-001):** incluir la llamada getScheduleChangeNotificationLogs desde Secretaría y las futuras consultas de historial de notificaciones; transmitir credencial válida en fetchApi y usar _verifiedUserId/_verifiedRole en backend. No se crea una tarea duplicada de autenticación.

## 6. Pruebas y límites

- **Ejecutadas:** inspección estática/manual de roles, autenticación, dispatcher, funciones de notificación, esquema de hojas compartidas, ciclo de creación/edición/publicación/cancelación de horarios, historial, interfaz, API, ChangesLogs, suites y referencias Git; verificación de SHA de respaldo y comparación de ramas.
- **No ejecutadas:** Apps Script runtime, envío real MailApp/proveedores, HTTP/OAuth, navegador, Sheets productivas, concurrencia real, fallos inyectados, reintentos E2E ni suite Node. No se declara prueba dinámica.
- No se modificó código, interfaz, pruebas, hojas productivas, completadas.md, Pendientes.md ni ChangesLogs.txt.
- La marca histórica [X] se conserva sin atribuirle valor probatorio.

## 7. Archivos y respaldos

- **Nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-10.md.
- **Actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin cambios:** backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746; js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc; dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8; teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71; tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee.
- **Documentos de auditoría antes de esta iteración:** Auditoria.txt SHA bfc4ca52cd7770985b944bd3175fc055c53e5f9d; MapaDependencias.md SHA 8bb80346b689c734ec258cb826cc71ac0b124f51; AUDITORIA_COMPLETADAS_PLAN.md SHA 6340c06f2a2abd1b76c50ff72cc44da6d5e81855; Contexto_personal.txt SHA 42afdc03b02af03e25b420a349b395fbb82a7b74.
- Los archivos de código y UI inspeccionados conservaron los SHAs registrados; no se modificaron durante la auditoría.

## 8. Continuidad

Siguiente tarea cronológica: TAREA-F7-IMP-11, Fortalecer la coherencia y actualización de los portales relacionados. Antes de iniciarla, verificar el HEAD de C1.242, consultar completadas.md, buscar informe individual y origen, y auditar CA-F7-69..74. No implementar durante la auditoría.
