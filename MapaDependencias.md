undefined

## Auditoría FASE2-06 - Motor de eventos intermodulares y despacho multicanal (C1.34)
- Archivo principal: backend/user-service/Code.gs (SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f).
- registerAndDispatchEvent (4618-4699): valida solo presencia de eventType/originService; deduplica por tipo + requestId opcional y solo cuando el evento previo ya está PROCESADO; ejecuta notificación antes de appendRow; no reserva atómicamente ni usa LockService; maxRetries no se utiliza.
- retryFailedEventsQueue (4700-4759): límite fijo de tres intentos, sin nextAttemptAt/backoff ni reclamación exclusiva; reintenta sin clave estable; GLOBAL se omite y se marca procesado; status success no representa el resultado real de cada evento.
- doPost (1351-1453): valida permiso de acción y expone registerAndDispatchEvent/retryFailedEventsQueue; el switch no demuestra productores integrados en los otros servicios.
- runInterdepartmentalIntegrationTestSuite (218-310): invoca la cola real, solo valida status success en INT-03, espera DTOs incompatibles en INT-04/INT-05 y devuelve status success aunque existan pruebas fallidas.
- Academic, Accounting, Task y Exam (SHAs daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc, 38b979d41596b85e888b4a7060b37bbac0840a28, 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe, 1d93296628fae31f680004f637897e2b1314a64c): no se encontraron llamadas a registerAndDispatchEvent; los helpers locales purgeSecurityCaches no son productores del bus general.
- sendMultiChannelNotification (4818-4932) solo persiste inbox y utiliza MailApp; no consume canal ni configuración de proveedores. configureNotificationChannel/getNotificationChannelConfigs (7526-7612) guardan y devuelven configuración, pero no están conectados al despachador. sendChannelNotificationTest simula respuesta del proveedor.
- Hallazgos: AUD-NG-176 (cola durable, integración, idempotencia y pruebas); AUD-NG-177 (secretos de proveedores y contenido HTML). Tareas: TASK-474 y TASK-475. AUD-NG-006 y AUD-NG-161 conservan sus alcances transversales y se amplían por referencia.
- Calidad: separación insuficiente entre registro, despacho y recuperación; estados y DTO implícitos; no existe prueba aislada que acredite el ciclo de vida del evento.
