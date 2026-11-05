AUDITORÍA DE TAREAS COMPLETADAS - FASE2-06
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 627e857a9ec574e0f1f2446d9efa9ff2e9e75a66
ARCHIVO PRINCIPAL: backend/user-service/Code.gs
SHA: 12079dd410aa6d8afbce55a4bc62a79dea605f9f
================================================================
DICTAMEN: NO CUMPLE INTEGRALMENTE.

La entrada de completadas.md solo conserva título, origen, severidad y archivo involucrado. El informe original AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md no está disponible en la rama. El alcance se reconstruyó mediante FASE2-T07, FASE2-T14 y las implementaciones posteriores de notificaciones y canales.

1. MOTOR DE EVENTOS
- registerAndDispatchEvent (4618-4699) valida solo que eventType y originService existan; no valida catálogo, contrato, servicio emisor ni destinatarios.
- originRequestId es opcional. La deduplicación usa solo eventType + originRequestId, omite originService y solo reconoce registros PROCESADO.
- No existe reserva atómica ni LockService. El efecto secundario se ejecuta antes de appendRow, lo que deja una ventana de pérdida de trazabilidad y duplicación.
- eventId se genera con Math.random(); maxRetries se recibe pero no se utiliza.
- La selección de despacho depende de coincidencias sensibles a mayúsculas con NOTIF, ALERT o COMUNICADO. Otros tipos pueden marcarse procesados sin acción real.
- GLOBAL se trata como userId literal, no como una audiencia que se expande a destinatarios.

2. REINTENTOS
- retryFailedEventsQueue (4700-4759) usa un máximo fijo de tres intentos; no hay nextAttemptAt ni backoff.
- La cola no reclama filas de forma exclusiva. Ejecuciones concurrentes pueden procesar el mismo evento.
- El reintento no utiliza deduplicationKey estable ni referencia idempotente del evento.
- Si el destinatario es GLOBAL, el reintento omite el envío y marca el evento PROCESADO.
- El método devuelve status success aunque queden eventos fallidos o no se haya procesado ninguno.
- No se encontró trigger temporal para ejecutar automáticamente esta cola.

3. INTEGRACIÓN INTERSERVICIO
No se encontraron llamadas a registerAndDispatchEvent en backend/academic-service/Code.gs, backend/accounting-service/Code.gs, backend/task-service/Code.gs ni backend/exam-service/Code.gs. Los helpers locales purgeSecurityCaches no son integración del bus general. El endpoint existe en el switch de doPost, pero no se acredita conexión sistemática con los productores interdepartamentales.

4. DESPACHO MULTICANAL
- sendMultiChannelNotification (4818-4932) registra inbox y usa MailApp si existe correo. No hay adaptadores ejecutados para SMS, WhatsApp o Messenger.
- El parámetro canal no se usa y el despachador no consulta CanalesProveedoresConfig ni preferencias para decidir canales.
- configureNotificationChannel/getNotificationChannelConfigs almacenan y consultan configuración, pero el despachador no la consume.
- sendChannelNotificationTest simula una respuesta de proveedor; no demuestra conexión ni entrega real.
- retryFailedNotificationsQueue (4761-4817) no conserva contador persistente de intentos ni backoff.

5. PRUEBAS
- runInterdepartmentalIntegrationTestSuite (218-310) llama a retryFailedEventsQueue sobre el Spreadsheet real y puede enviar notificaciones de producción.
- INT-03 solo comprueba status success, aunque la cola devuelve éxito aun con eventos fallidos; además espera eventosReintentados, propiedad que no devuelve el método.
- INT-04 espera capacidadOperativa, pero el método devuelve capacidadEstado, resumenGeneral y desgloseServicios.
- INT-05 espera logs, pero getTraceabilityCorrelationLogs devuelve registros.
- La suite devuelve status success incluso si pruebas individuales fallan.
- INT-02 compara firmas equivalentes y no prueba idempotencia real, concurrencia ni persistencia.
- No se encontró una suite conductual aislada del motor de eventos.

6. SEGURIDAD DE CANALES
- configureNotificationChannel (7526-7577) guarda configuracionJSON directamente y asigna el literal HASH_CONFIG_PROTECTED a CredencialesEncriptadasHash.
- getNotificationChannelConfigs (7578-7612) devuelve configuracion completa sin redacción de posibles credenciales.
- sendMultiChannelNotification inserta titulo, mensaje y enlaceAccion directamente en htmlBody sin escape HTML ni validación explícita del enlace.

7. RECONCILIACIÓN
- AUD-NG-176 / TASK-474: outbox durable, reserva idempotente, integración de productores, recuperación programada, estados por canal y pruebas aisladas.
- AUD-NG-177 / TASK-475: protección de secretos, redacción de configuración y saneamiento de plantillas/enlaces.
- AUD-NG-006 y AUD-NG-161 se amplían por referencia; no duplicar su alcance transversal.

8. CALIDAD Y LÍMITES
La implementación mezcla registro, ejecución y recuperación; carece de reserva durable, contrato estricto, programación de reintentos y pruebas seguras. Los DTO de la suite no coinciden con los endpoints y el estado global de la suite oculta fallos individuales.
Inspección estática/manual. No se ejecutaron Apps Script, HTTP real, triggers, concurrencia, envío de correos, llamadas a proveedores ni operaciones productivas. No se modificó código fuente, completadas.md, completadas_legacy.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md.
================================================================
FIN DEL INFORME