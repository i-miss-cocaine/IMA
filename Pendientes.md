### [TASK-474] Reconstruir el motor de eventos intermodulares con persistencia durable, despacho y recuperación verificables
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-176; auditoría FASE2-06 y requisitos de FASE2-T07
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:**
  - backend/user-service/Code.gs
  - backend/academic-service/Code.gs
  - backend/accounting-service/Code.gs
  - backend/task-service/Code.gs
  - backend/exam-service/Code.gs
  - tests/regression/user-event-engine-suite.js
- **Dependencias Expuestas:** doPost, validateRolePermission, ROLE_PERMISSIONS, BitacoraEventos, sendMultiChannelNotification, retryFailedEventsQueue, productores de eventos interdepartamentales, contratos HMAC y AUD-NG-006/AUD-NG-161.
- **Descripción del Alcance:**
  1. Definir un contrato versionado de eventos con tipos permitidos, servicio emisor autenticado, destinatarios, datos validados, eventId, originRequestId, correlationId y causationId.
  2. Persistir primero el evento en una bandeja durable con estado PENDIENTE y reserva atómica de la clave de idempotencia; no ejecutar efectos secundarios antes de asegurar la persistencia.
  3. Evitar duplicados por combinación de servicio emisor, tipo de evento y referencia de operación, incluyendo estados pendientes, en ejecución, procesados y fallidos.
  4. Integrar los productores reales de Academic, Accounting, Task, Exam y User con el contrato autenticado, identificando qué operaciones generan eventos y qué efectos secundarios corresponden.
  5. Implementar consumidores que reclamen cada evento de forma exclusiva, registren transiciones de estado y separen el resultado de la operación principal del estado de entrega de cada canal.
  6. Aplicar maxRetries configurable, nextAttemptAt, espera progresiva, límite de intentos, estado terminal y recuperación de eventos atascados.
  7. Preservar la idempotencia de cada efecto secundario durante reintentos y recuperación; no reconstruir notificaciones sin una clave estable derivada del evento.
  8. Definir la distribución real para destinatarios individuales y globales, evitando tratar GLOBAL como una cuenta de usuario.
  9. Prevenir ciclos y recursión mediante causationId, límites de profundidad y reglas de orden por entidad cuando sean necesarias.
  10. Registrar errores sanitizados, correlación, intentos y resultados sin exponer información sensible.
- **Criterios de Aceptación:**
  - Un evento se encuentra persistido antes de ejecutar cualquier efecto secundario.
  - Dos solicitudes simultáneas con la misma identidad de evento producen una sola ejecución lógica.
  - Los productores autorizados publican eventos mediante autenticación interservicio y contrato validado.
  - Los estados pendiente, en ejecución, procesado, reintentable y fallo permanente representan el resultado real.
  - Los reintentos respetan maxRetries y nextAttemptAt, y no duplican efectos ya completados.
  - Los destinatarios GLOBAL se expanden a una audiencia definida y verificable, no a un usuario literal.
  - Un fallo de notificación secundaria no revierte ni falsea el estado de la operación principal.
  - Las pruebas usan fixtures/almacenamiento aislado y verifican persistencia, concurrencia, pérdida de respuesta, fallos parciales, recuperación, orden y ausencia de duplicados.
  - Ejecutar la suite no procesa colas ni envía comunicaciones de producción.
  - Las métricas distinguen eventos pendientes, atascados, procesados y fallidos por tipo y servicio.
- **Estado:** [ ] Pendiente

---

### [TASK-475] Proteger secretos de proveedores y sanear el contenido de notificaciones multicanal
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-177; auditoría FASE2-06 y revisión de la configuración posterior de canales
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:**
  - backend/user-service/Code.gs
  - tests/regression/user-notification-security-suite.js
- **Dependencias Expuestas:** CanalesProveedoresConfig, configureNotificationChannel, getNotificationChannelConfigs, sendMultiChannelNotification, MailApp, ROLE_PERMISSIONS y almacenamiento de secretos.
- **Descripción del Alcance:**
  1. Eliminar la persistencia de credenciales en texto claro dentro de configuracionJSON y sustituirla por referencias a secretos protegidos o cifrado real con gestión de claves fuera de la hoja.
  2. No utilizar marcadores constantes como HASH_CONFIG_PROTECTED para representar cifrado o protección inexistente.
  3. Hacer que getNotificationChannelConfigs devuelva únicamente metadatos y configuraciones no sensibles; los secretos nunca deben incluirse en respuestas API.
  4. Aplicar control de acceso por operación y ámbito a la consulta y modificación de canales, sin permitir que roles de lectura obtengan credenciales.
  5. Escapar HTML en titulo, mensaje y demás campos insertados en plantillas de correo.
  6. Validar enlaceAccion mediante una política explícita de protocolos y destinos permitidos antes de insertarlo en href.
  7. Evitar que credenciales, tokens, direcciones y datos personales innecesarios aparezcan en bitácoras y errores.
  8. Mantener pruebas que comprueben que secretos y contenido HTML no confiable no se exponen ni alteran la plantilla.
- **Criterios de Aceptación:**
  - La hoja de configuración no almacena credenciales en texto claro.
  - Las respuestas de consulta nunca contienen secretos, tokens ni referencias internas que permitan recuperarlos.
  - Las operaciones de configuración y lectura aplican permisos mínimos.
  - Las cadenas con etiquetas HTML, atributos, scripts o entidades no alteran la estructura del correo.
  - Los enlaces no permitidos se rechazan antes de generar o enviar el correo.
  - Los logs y errores no incluyen credenciales ni datos sensibles completos.
  - Las pruebas de seguridad usan datos sintéticos y verifican tanto las respuestas como los valores persistidos.
- **Estado:** [ ] Pendiente