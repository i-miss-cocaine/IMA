# Auditoría técnica - TAREA-F5-011: notificaciones automáticas y seguimiento del proceso de admisión

**Checkpoint:** C1.206  
**Sesión operativa:** IMA-AUDIT-20261107-1359Z (identificador operativo, no ID nativo de ChatGPT)  
**Inicio de sesión:** C1.206 | **Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work | **HEAD auditado:** 1ad36af1fc3b3b544df46b974acbd3c7f314a2d7  
**Rama base protegida:** NG_beta_0.0.0.1 | **SHA:** 44d9891132332e692dbe2ba8602b41f50a508a59 (sin escritura)  
**Dictamen:** **NO CUMPLE**

## 1. Búsqueda documental y fuentes

Se buscó el informe individual AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-011.md y la variante AUDITORIAS/AUDITORIA_TAREA-F5-011.md en el árbol de la rama y en el historial de GitHub. No existe ninguno. También se consultó AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md, citada como origen de la tarea: no está en el árbol ni tiene historial recuperable. La búsqueda de HALLAZGOS-F5-P1-03 en Auditoria.txt tampoco encontró el identificador. Por ello, la fuente de origen indicada en completadas.md no puede validarse independientemente en el estado actual del repositorio.

**Requisitos:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2158-2193. La tarea está marcada [X] Completada, contiene 12 puntos de alcance y 8 criterios de aceptación. Se contrastaron con los flujos y funciones disponibles.

**Historial de cambios:** ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1855-1864, describe la función de envío, los dos productores de admisión y la interfaz de historial. Es una declaración histórica, no evidencia de ejecución funcional ni de entrega efectiva.

**Pendientes.md:** se leyó el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c (1.782.094 caracteres; 20.182 líneas). No contiene una entrada directa TAREA-F5-011. Sí contiene dependencias existentes: AUD-NG-145, AUD-NG-161, TASK-474/AUD-NG-176, TASK-475/AUD-NG-177 y TASK-422. No se modificó.

**Reconciliación previa:** AUDITORIAS/Auditoria.txt SHA c3f705b54949228e1adeec8e14bf359028a6065a, líneas 7213-7217, ya relaciona la falta de notificaciones de oferta/respuesta de lista de espera con TAREA-F5-011 y AUD-NG-145. AUDITORIAS/MapaDependencias.md SHA 7594272ed7df83083e678e0e93364ce563af3149, líneas 943-952, registra AUD-NG-176/TASK-474 (cola durable, integración, idempotencia y pruebas) y AUD-NG-177/TASK-475 (secretos y contenido HTML). No se crean identificadores globales duplicados.

## 2. Evidencia inspeccionada

| Archivo | SHA | Funciones / rangos inspeccionados |
|---|---|---|
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | dispatcher doPost 900-977; createAdmissionRequest 984-1109; scheduleAdmissionInterview 1595-1643; recordInterviewOutcome 1671-1689; addToWaitlist 1750-1811; offerWaitlistSlot 1876-1898; respondToWaitlistSlot 1901-1925; updateAdmissionStatus 1928-2059; convertAdmissionToStudent 2156-2392 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | getOrCreateSheet 863-905; ROLE_PERMISSIONS 922-982; doPost y autorización 1351-1470; retryFailedNotificationsQueue 4761-4815; sendMultiChannelNotification 4817-4893; getAdmissionNotificationLogs 4937-4971; getNotificationPreferences 4973-4987; getUserSettings/saveUserSettings 7649-7740 |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | openAdmissionDetailModal y llamada de historial 191; loadAdmissionNotificationLogs 1357-1402 |
| dashboard-secretaria.html | fa0d8c23aace24a6acab2d4956398a7f5e1309b8 | sección modal de avisos 198-205 |
| js/config.js | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` | SERVICE_URLS USER/ACADEMIC y directriz de crear un proyecto Apps Script por cada carpeta backend (216-241). |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | comprobación genérica de presencia del motor de notificaciones 76-77; sin casos F5-011 |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | inspección de la suite completa; sin casos F5-011 |
| AUDITORIAS/MapaDependencias.md | 7594272ed7df83083e678e0e93364ce563af3149 | FASE2-06 943-952; hallazgos de lista de espera y coordinación F5-011 2084-2099 |
| AUDITORIAS/Auditoria.txt | c3f705b54949228e1adeec8e14bf359028a6065a | hallazgo previo de oferta/respuesta sin notificación 7213-7217 |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | declaración de implementación F5-011 1855-1864 |

La revisión fue estática y manual. No se ejecutaron Apps Script, HTTP, correo real, Google Sheets productivo, navegador, triggers ni suites automatizadas.

## 3. Hallazgos

### H1 - CRÍTICO/P0: el productor académico no tiene una integración interservicio real con el motor USER

ACADEMIC invoca sendMultiChannelNotification desde createAdmissionRequest (1073-1088) y updateAdmissionStatus (2026-2044), pero el archivo backend/academic-service/Code.gs no define esa función. La única definición inspeccionada está en backend/user-service/Code.gs (4817-4893), que corresponde a otro microservicio y tiene su propio doPost/dispatcher (1351-1470). En ACADEMIC, la llamada se protege con typeof sendMultiChannelNotification === "function"; si la función no existe en ese proyecto, el bloque se omite sin enviar la notificación ni registrar el fallo. No se encontró una llamada UrlFetchApp/fetch ni un productor de eventos autenticado que reenvíe la operación a USER. Por tanto, los dos puntos de integración descritos en ChangesLogs no acreditan una conexión entre despliegues.

**Impacto:** los criterios de confirmación inicial y notificación de cambios de estado no quedan demostrados y, en la arquitectura de microservicios del repositorio, el código actual puede omitirlos silenciosamente. Ampliar AUD-NG-083 y AUD-NG-176/TASK-474; no crear un ID duplicado.

### H2 - ALTO/P1: faltan productores para los eventos principales del ciclo de admisión

La inspección de los handlers confirma que scheduleAdmissionInterview (1595-1643) solo registra la cita; recordInterviewOutcome (1671-1689) solo cambia estado/observaciones; addToWaitlist (1750-1811), offerWaitlistSlot (1876-1898) y respondToWaitlistSlot (1901-1925) actualizan hojas y registran eventos académicos, pero no despachan notificaciones. En convertAdmissionToStudent (2156-2392) se crea la invitación de vinculación cuando el tutor no tiene cuenta (2295-2311), se marca la solicitud Convertida y se registra la matrícula, pero no se envía confirmación ni invitación. No se localizó un productor de notificación de admisión para solicitudes de documentos pendientes/rechazados ni para reprogramaciones/cancelaciones de entrevistas.

**Impacto:** se incumplen los eventos de entrevista/evaluación, lista de espera, invitación del tutor y conversión a matrícula. El hallazgo de lista de espera ya aparece en Auditoria.txt 7213 y MapaDependencias.md 2084-2095. Coordinar F5-007-A05, F5-008-A05 y F5-009-A06; ampliar TAREA-F5-011 sin duplicar el alcance.

### H3 - ALTO/P1: esquema de BandejaNotificaciones incompatible entre inicialización, escritura y lectores

getOrCreateSheet inicializa BandejaNotificaciones con nueve columnas en el orden NotificacionID, UserId, Titulo, Mensaje, Tipo, Categoria, Leido, EnlaceAccion y FechaRegistro (USER 889). sendMultiChannelNotification escribe doce valores con otro orden: ID, usuario, tipo, título, mensaje, fecha, leído, categoría, enlace, clave de deduplicación, estado y correo (4868-4882). Los lectores antiguos no están alineados: getPendingReminders (6521-6545) interpreta índices 2/3/5/8 como título/mensaje/categoría/fecha; para filas nuevas esos índices contienen tipo/título/fecha/enlace. getAdmissionNotificationLogs usa el esquema nuevo de doce campos (4937-4971), sin adaptación de filas históricas de nueve columnas.

**Impacto:** el historial puede mostrar correctamente filas nuevas a través del endpoint específico, pero el inbox/recordatorios genéricos y los datos históricos pueden interpretarse con campos equivocados. Requiere contrato canónico, migración o lector compatible; coordinar TASK-474 y AUD-NG-145.

### H4 - ALTO/P1: la cola de reintentos no acredita ejecución asíncrona ni recuperación acotada

retryFailedNotificationsQueue (4761-4815) recorre la hoja de forma síncrona y reenvía los registros Pendiente_Reintento. No se encontró creación de trigger temporal ni planificación automática en el código versionado. El endpoint aparece en el switch de doPost, pero no está incluido en las listas de permisos ordinarios examinadas para Secretaría/Director/Subdirector; solo los roles con permiso global pueden invocarlo por esa vía. En caso de fallo, la función registra un evento, pero no incrementa intentos ni cambia el estado; el registro queda Pendiente_Reintento para futuros intentos sin límite. No implementa maxRetries, nextAttemptAt ni backoff. Si MailApp no está disponible, no se actualiza el registro ni se informa un fallo de entrega.

**Impacto:** no se acredita reintento automático/asíncrono, ni recuperación con límite y estado terminal. Ampliar AUD-NG-176/TASK-474 y AUD-NG-006.

### H5 - ALTO/P1: preferencias de notificación no se aplican al despacho

getNotificationPreferences (4973-4987) devuelve categorías habilitadas y canal preferido hardcodeados; no lee PreferenciasNotificacion. USER dispone de getUserSettings/saveUserSettings (7649-7740) para leer/escribir preferencias, pero sendMultiChannelNotification no consulta esas preferencias antes de insertar la notificación ni enviar el correo. No hay excepción documentada para avisos institucionales obligatorios frente a avisos opcionales.

**Impacto:** el punto 10 del alcance no está implementado. Ampliar TASK-422 y definir política explícita de preferencias/canales.

### H6 - ALTO/P1: los estados no reflejan el ciclo de entrega y falta trazabilidad por mensaje

sendMultiChannelNotification inicializa deliveryStatus como Entregado (4836-4839), incluso cuando no se proporciona correo o MailApp no está disponible. Si MailApp.sendEmail retorna sin error, se marca Entregado aunque no existe confirmación del proveedor sobre entrega efectiva. Si falla, se usa Pendiente_Reintento; no se registran los estados requeridos Pendiente, Enviado, Fallido y Reintentado como transiciones diferenciadas. El registro se añade a BandejaNotificaciones y se llama logStructuredEvent, pero la función no escribe en BitacoraTraceability ni llama a recordTraceabilityLog. Los cambios posteriores del estado se sobrescriben en la misma fila, sin historial append-only, actor verificado ni correlationId.

**Impacto:** no se satisface el criterio de registrar el estado en BitacoraTraceability ni se distingue aceptación por MailApp de entrega final. Ampliar AUD-NG-145 y TASK-474.

### H7 - MEDIO/P2: la consola de Secretaría solo consulta historial y no permite reenvío manual

dashboard-secretaria.html contiene un panel de historial (198-205). secretary.js carga los diez registros más recientes por solicitud mediante USER/getAdmissionNotificationLogs (191 y 1357-1402), muestra fecha, título, mensaje, destino y estado. No se encontró botón ni acción de reenvío manual. El endpoint de consulta sí está incluido en los permisos de Secretaría y el filtro por solicitud se envía desde el cliente; sin embargo, retryFailedNotificationsQueue es una operación global de cola, no un reenvío manual por notificación y no está autorizada para Secretaría en ROLE_PERMISSIONS.

**Impacto:** el historial administrativo es parcial y el criterio de reenvío manual no está cubierto.

### H8 - ALTO/P1: plantilla única sin texto plano ni saneamiento contextual

sendMultiChannelNotification construye una plantilla HTML genérica (4846-4858) con interpolación directa de titulo, mensaje y enlaceAccion. No envía body de texto plano, no selecciona plantillas específicas por evento ni incluye instrucciones diferenciadas para admisión, rechazo, evaluación o pago. El contenido y href no se escapan ni validan en esa función. Los logs de error incluyen targetEmail y los mensajes pueden contener nombre completo del aspirante.

**Impacto:** incumplimiento del punto de plantillas personalizables y riesgo de inyección HTML/enlaces no confiables y exposición innecesaria de datos personales. Ampliar AUD-NG-177/TASK-475 y AUD-NG-145; no duplicar.

### H9 - ALTO/P1: deduplicación no es atómica y no hay pruebas conductuales específicas

sendMultiChannelNotification consulta la clave de deduplicación y luego inserta la fila sin LockService ni reserva durable (4826-4834 y 4868-4882). Dos llamadas concurrentes pueden observar que la clave aún no existe y guardar/enviar dos correos. Además, createAdmissionRequest tiene una clave NOTIF_RECV_<solicitudId> y updateAdmissionStatus usa NOTIF_STATUS_<solicitudId>_<estado>, pero no se acredita una clave estable para cada evento restante ni la coordinación con la cola. Los dos archivos existentes bajo tests/regression no contienen casos específicos de F5-011; academic-grading-suite solo comprueba la presencia de sendMultiChannelNotification y retryFailedNotificationsQueue como símbolos de F10-Task12 (76-77).

**Impacto:** los criterios de no duplicación y recuperación no están probados. Ampliar AUD-NG-006, AUD-NG-161 y TASK-474/TASK-475.

### H10 - ALTO/P1: el historial de Secretaría inserta el destino de notificación en HTML sin escape

USER/getAdmissionNotificationLogs (4937-4971) devuelve `usuarioDestino` desde la columna 2 y `emailDestino` desde la columna 12 de `BandejaNotificaciones`. USER/sendMultiChannelNotification persiste `targetUser` y `targetEmail` procedentes del payload. En `js/secretary.js`, `loadAdmissionNotificationLogs` (1357-1402) construye el historial mediante `container.innerHTML`: título y mensaje se escapan solo si existe `window.escapeHtml`, pero el destino se interpola directamente en `<strong>` (línea 1384) y el estado también se inserta como texto HTML (línea 1386) sin escape. El destino deriva de datos de entrada persistidos; por tanto, una cadena HTML maliciosa puede alcanzar el DOM cuando Secretaría abre el historial. No se ejecutó prueba en navegador, así que se registra como riesgo estático de XSS almacenado, no como explotación dinámica confirmada.

**Impacto:** posible ejecución de marcado/script en el contexto autenticado del dashboard de Secretaría y exposición de una sesión privilegiada. Ampliar AUD-NG-177/TASK-475 y AUD-NG-145; no crear identificador global duplicado.

## 4. Matriz de los 12 puntos de alcance

| # | Requisito | Resultado |
|---:|---|---|
| 1 | Conectar createAdmissionRequest, updateAdmissionStatus y convertAdmissionToStudent con el motor | NO |
| 2 | Notificar todos los eventos de admisión, documentos, entrevistas, estados, lista de espera, invitación y matrícula | NO |
| 3 | Plantillas HTML y texto plano personalizables por evento | NO |
| 4 | Enlaces, códigos de seguimiento e instrucciones sin exponer datos privados | PARCIAL |
| 5 | Correo y avisos internos por canales autorizados | PARCIAL |
| 6 | Desacoplar fallos de notificación de la transacción principal | PARCIAL |
| 7 | Estados Pendiente, Enviado, Entregado, Fallido y Reintentado | NO |
| 8 | Cola asíncrona con reintentos recuperables | NO |
| 9 | Deduplicación frente a reintentos de peticiones | PARCIAL |
| 10 | Respeto a preferencias familiares y excepciones obligatorias | NO |
| 11 | Correos individuales sin revelar destinatarios de otros aspirantes | PARCIAL |
| 12 | Consola de Secretaría con historial y reenvío manual | PARCIAL |

## 5. Matriz de los 8 criterios de aceptación

| # | Criterio | Resultado |
|---:|---|---|
| 1 | Registro envía correo con código de seguimiento | NO |
| 2 | Cambios de estado disparan correo automático | NO |
| 3 | Rechazo no envía plantilla de aceptación | PARCIAL (solo hay plantilla genérica; no se acreditan plantillas específicas) |
| 4 | Fallos de correo activan reintento asíncrono sin cancelar transacción | NO |
| 5 | Reintentos no duplican correos | PARCIAL (hay clave, pero consulta e inserción no son atómicas) |
| 6 | Estado de entrega registrado en BitacoraTraceability | NO |
| 7 | Mensajes individuales sin exponer otros destinatarios | PARCIAL (MailApp usa un solo campo to; no se encontró envío masivo, pero falta validación integral de privacidad) |
| 8 | Secretaría consulta historial por aspirante | PARCIAL (consulta visible; reenvío manual ausente) |

## 6. Tareas ejecutables derivadas de los hallazgos

Subtareas locales a TAREA-F5-011; no crear identificadores globales duplicados. Todas quedan **Pendientes** y no se ejecutan durante esta auditoría.

### F5-011-A01 - Integración interservicio autenticada del ciclo de admisión
- **Hallazgo de origen:** H1.
- **Severidad:** Crítico/P0.
- **Objetivo y acción:** sustituir la referencia directa a una función que no existe en el proyecto ACADEMIC por un productor interservicio autenticado y un contrato versionado; persistir el evento antes del efecto secundario.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; js/api.js o capa de transporte interservicio; pruebas aisladas.
- **Dependencias:** AUD-NG-083; AUD-NG-176/TASK-474; AUD-NG-006.
- **Criterios de aceptación:** llamadas ACADEMIC→USER usan autenticación de servicio; el evento queda persistido antes del envío; errores de transporte son recuperables; ninguna función inexistente se omite silenciosamente.

### F5-011-A02 - Cobertura de eventos de admisión
- **Hallazgo de origen:** H2.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** integrar eventos de documentos, entrevistas/evaluaciones, cambios de estado, ofertas/rechazos/expiraciones de lista de espera, invitaciones de tutor y conversión a matrícula; incluir el código de seguimiento y enlace/instrucción aplicable.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs.
- **Dependencias:** F5-007-A05; F5-008-A05; F5-009-A06; AUD-NG-176/TASK-474.
- **Criterios de aceptación:** cada transición definida genera exactamente un evento con destinatario verificado, tipo, solicitudId, actor y correlationId; rechazo, cancelación y reprogramación producen el mensaje correcto; una invitación no se considera entregada solo por crear su fila.

### F5-011-A03 - Contrato canónico y migración de BandejaNotificaciones
- **Hallazgo de origen:** H3.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** definir un esquema único con columnas explícitas y adaptar/migrar filas históricas de nueve y doce campos; alinear getPendingReminders, getUnifiedNotifications y getAdmissionNotificationLogs.
- **Archivos/módulos:** backend/user-service/Code.gs; hojas BandejaNotificaciones; pruebas de compatibilidad.
- **Dependencias:** AUD-NG-145; AUD-NG-176/TASK-474.
- **Criterios de aceptación:** lectores y escritores comparten el mismo mapa de columnas; datos históricos conservan su significado; títulos, mensajes, fechas, enlaces, destinatarios y estados se leen correctamente en todos los consumidores.

### F5-011-A04 - Cola durable y ciclo de vida real de entrega
- **Hallazgo de origen:** H4 y H6.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** separar estado del evento, estado del canal y estado del destinatario; incorporar contador persistente, maxRetries, nextAttemptAt, backoff, reclamación exclusiva, estados terminales y trigger/worker verificable.
- **Archivos/módulos:** backend/user-service/Code.gs; hojas de cola/outbox; configuración de triggers; métricas.
- **Dependencias:** AUD-NG-176/TASK-474; AUD-NG-006; AUD-NG-145.
- **Criterios de aceptación:** reintentos automáticos y acotados; fallo terminal visible; worker recupera registros atascados; un fallo de correo no revierte la operación principal; Entregado solo se usa con evidencia de entrega del proveedor, no por ausencia de excepción.

### F5-011-A05 - Aplicación de preferencias y política de canales
- **Hallazgo de origen:** H5.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** conectar preferencias persistidas con el despacho, definir valores heredados y distinguir avisos opcionales de avisos institucionales obligatorios.
- **Archivos/módulos:** backend/user-service/Code.gs; PreferenciasNotificacion; configuración de canales.
- **Dependencias:** TASK-422; TASK-475.
- **Criterios de aceptación:** se respetan categorías, canal y frecuencia; avisos obligatorios siguen la política institucional; la consulta devuelve preferencias persistidas y no valores hardcodeados; las pruebas cubren cada combinación autorizada.

### F5-011-A06 - Plantillas seguras y privacidad de mensajes
- **Hallazgo de origen:** H8.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** crear plantillas HTML y texto plano por evento, escapar contenido dinámico, validar protocolos/destinos de enlaces y minimizar PII en cuerpo y logs.
- **Archivos/módulos:** backend/user-service/Code.gs; tests/regression/user-notification-security-suite.js.
- **Dependencias:** AUD-NG-177/TASK-475; AUD-NG-145.
- **Criterios de aceptación:** cadenas HTML no alteran el documento; enlaces no permitidos se rechazan; se envía alternativa de texto plano; logs no exponen correos ni datos personales completos sin necesidad; pruebas de seguridad con datos sintéticos.

### F5-011-A07 - Trazabilidad append-only de cada notificación
- **Hallazgo de origen:** H6.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** registrar creación, despacho, aceptación del proveedor, entrega, fallo, reintento y acción manual con actor verificado, destinatario, tipo, clave idempotente, correlationId y fecha; conservar transiciones sin sobrescribir el historial.
- **Archivos/módulos:** backend/user-service/Code.gs; BitacoraTraceability/BitacoraTrazabilidad; consultas de auditoría.
- **Dependencias:** AUD-NG-145; AUD-NG-176/TASK-474.
- **Criterios de aceptación:** cada transición genera un registro durable y correlacionado; no se confunde log estructurado general con recibo de entrega; fallos de escritura no se silencian ni producen éxito falso.

### F5-011-A08 - Consola de Secretaría y reenvío individual seguro
- **Hallazgo de origen:** H7.
- **Severidad:** Medio/P2.
- **Objetivo y acción:** completar historial paginado y filtros por solicitud/estado/canal; añadir acción de reenvío individual con permiso, confirmación y deduplicación; mostrar estado real por canal.
- **Archivos/módulos:** dashboard-secretaria.html; js/secretary.js; backend/user-service/Code.gs.
- **Dependencias:** AUD-NG-145; AUD-NG-176/TASK-474; F5-012.
- **Criterios de aceptación:** Secretaría consulta solo registros autorizados; el reenvío no crea duplicados ni expone otros destinatarios; actor, motivo y resultado quedan auditados; la UI distingue pendiente, enviado, entregado y fallo.

### F5-011-A09 - Suite conductual de notificaciones de admisión
- **Hallazgo de origen:** H1-H8.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** crear suite aislada que pruebe productores, integración interservicio, eventos, deduplicación concurrente, preferencias, estados, reintentos, privacidad, plantillas, bitácora, consola y reenvío.
- **Archivos/módulos:** tests/regression/user-notification-security-suite.js; nueva suite de integración F5-011; backend USER/ACADEMIC.
- **Dependencias:** AUD-NG-006; AUD-NG-161; TASK-474; TASK-475.
- **Criterios de aceptación:** fixtures aislados; prueba de dos solicitudes concurrentes con la misma clave; fallo y recuperación después de persistir; no procesa colas ni envía correos productivos; la suite falla si falta un productor o una transición de estado.

### F5-011-A10 - Renderizado seguro del historial de notificaciones en Secretaría
- **Hallazgo de origen:** H10.
- **Severidad:** Alto/P1.
- **Objetivo y acción:** eliminar la interpolación HTML no escapada de destinatario y estado en el historial; renderizar todos los campos dinámicos como texto o aplicar escape contextual obligatorio sin fallback inseguro.
- **Archivos/módulos:** `js/secretary.js`; `backend/user-service/Code.gs` (contrato de `getAdmissionNotificationLogs`); suite aislada de seguridad UI.
- **Dependencias:** AUD-NG-177/TASK-475; AUD-NG-145.
- **Criterios de aceptación:** los campos destinatario, correo, título, mensaje y estado se muestran como texto; payloads con etiquetas, atributos de evento y URLs maliciosas no crean nodos ni ejecutan código; la ausencia de `window.escapeHtml` nunca provoca inserción cruda; prueba de navegador con datos sintéticos confirma el bloqueo.

## 7. Pruebas y limitaciones

**Ejecutado:** lectura de completadas.md y Pendientes.md por blob; búsqueda del informe individual y del informe de fase en árbol/historial; inspección manual de funciones y callsites ACADEMIC/USER; revisión de RBAC y dispatch; revisión de esquema de hoja y lectores; revisión de UI y suites; reconciliación con AUD-NG-083/145/161/176/177, TASK-422/474/475 y hallazgos F5-008.

**No ejecutado:** Apps Script runtime, HTTP entre servicios, MailApp real, recepción efectiva del proveedor, Google Sheets productivo, triggers configurados en consola, navegador, pruebas concurrentes ni suites automatizadas. No se afirma entrega real ni reproducción dinámica.

**Alcance de esta iteración:** auditoría y documentación exclusivamente. No se implementaron tareas derivadas ni se modificaron código, pruebas, completadas.md, Pendientes.md o ChangesLogs.txt. El commit previo C1.205 permanece intacto por instrucción del usuario; no se considera evidencia de cierre de F5-011 ni autorización para continuar implementaciones.

## 8. Dictamen

**TAREA-F5-011: NO CUMPLE.** Hay un motor USER de notificaciones, una vista de historial y dos llamadas intentadas desde ACADEMIC, pero no existe una integración interservicio demostrada; faltan la mayoría de los productores del ciclo de admisión; el esquema de la bandeja es incompatible con lectores legacy; la cola no tiene programación ni límites verificables; las preferencias no se aplican; los estados no acreditan entrega; la bitácora exigida no se escribe; no hay reenvío manual ni pruebas conductuales específicas. La marca [X] de completada.md no queda respaldada por la implementación inspeccionada.


## 9. Revalidación independiente C1.207 (continuidad desde C1.204)

- Se retoma la secuencia desde el último checkpoint señalado como válido por el usuario: C1.204. Se verificó el estado publicado de la rama sin reescribir ni revertir los commits posteriores.
- HEAD de partida de esta revalidación: `d412880c57308251a7c046a9ba9adb6b055fd389` (C1.206); padre `1ad36af1fc3b3b544df46b974acbd3c7f314a2d7`. El commit C1.206 solo añadió documentación de auditoría; los SHA de código examinados permanecen: ACADEMIC `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`, USER `12079dd410aa6d8afbce55a4bc62a79dea605f9f`, secretary.js `08a81266957b4c18cc25f8ba6749eac30a8f2c2c`, config.js `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc`.
- H1 se confirma adicionalmente con `js/config.js` (216-241): el repositorio instruye crear un proyecto Apps Script independiente por cada carpeta backend y define URLs distintas para USER y ACADEMIC. Por tanto, la referencia global directa de ACADEMIC a `sendMultiChannelNotification` no constituye una llamada entre proyectos; el bloque `typeof` puede omitirse silenciosamente.
- H10 se incorpora tras revisar el flujo de datos USER → `getAdmissionNotificationLogs` → `js/secretary.js` → `container.innerHTML`. Es un riesgo estático de XSS almacenado pendiente de verificación en navegador.
- `completadas.md` mantiene TAREA-F5-011 marcada [X], con 12 requisitos y 8 criterios; el código no los satisface integralmente. `Pendientes.md` se leyó directamente desde el blob `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` (1.782.094 caracteres/20.182 líneas, sin U+FFFD); no existe tarea directa F5-011, pero sí dependencias AUD-NG-083/145/161/176/177 y TASK-422/474/475.
- Dictamen revalidado: **TAREA-F5-011 NO CUMPLE**. Se conserva el bloque F5-011-A01..A09 y se añade F5-011-A10; todas las tareas derivadas siguen pendientes, sin implementación.
- La inspección de código y documentación fue manual. No se ejecutaron Apps Script, HTTP, MailApp, Sheets productivo, triggers, navegador ni suites automatizadas. No se afirma explotación XSS ni entrega de correo reproducida.
