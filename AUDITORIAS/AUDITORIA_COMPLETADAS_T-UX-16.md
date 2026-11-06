# Auditoría de completadas.md - T-UX-16

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** T-UX-16 - Unificar los estados de notificaciones, tareas pendientes y aprobaciones  
**Dictamen:** NO CUMPLE  
**Alcance:** auditoría estática del contrato frontend/backend, persistencia, autorización, integración y reconciliación del backlog. No se modificó código fuente.

## 1. Especificación y criterio de evaluación

Fuente histórica: `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, T-UX-16 marcada [X]. La especificación requiere una experiencia unificada de notificaciones, tareas pendientes y aprobaciones, con tipo/origen/fecha/contexto, distinción entre avisos informativos y acciones pendientes, navegación al registro relacionado, estados leído/no leído, deduplicación y presentación contextual por rol.

La marca histórica [X] no demuestra por sí sola el cumplimiento actual del contrato integrado. La revisión se contrastó con el código vigente y con las tareas existentes.

## 2. Frontend

**Archivo:** `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`, líneas 2081-2114.

- `consolidatePendingApprovalsAndNotifications(rawItems)` transforma un array que ya recibió; no consulta ni agrega por sí mismo las fuentes de notificaciones, tareas y aprobaciones.
- Busca propiedades `id/codigo`, `fecha/timestamp` y `modulo/targetModule`, mientras el backend de notificaciones usa `notificacionId`, `fechaRegistro` y `enlaceAccion`. La normalización pierde la correspondencia con el contrato real y recurre a identificadores aleatorios, fecha actual y destino genérico `dashboard`.
- No conserva un modelo suficiente de origen, contexto, entidad/registro relacionado, vencimiento ni requisito de acción.
- `markAsRead` solo modifica el estado local; no acredita persistencia en backend ni sincroniza el contador de pendientes.
- La conversión `!!item.leido` interpreta la cadena `"false"` como verdadera.
- No se localizaron llamadas directas al helper en `js/api.js`, `js/student.js`, `js/teacher.js`, `js/secretary.js` ni `js/accounting.js`. Por tanto, su presencia no demuestra integración funcional en los paneles revisados.

## 3. Backend y persistencia

**Archivo:** `backend/user-service/Code.gs`, SHA `12079dd410aa6d8afbce55a4bc62a79dea605f9f`.

- `getUnifiedNotifications`, líneas 4033-4072, utiliza `categoria`, `leido` y `userId` sin declararlos localmente. `getUserNotifications` delega en esta función; con filas existentes, las referencias pueden producir `ReferenceError`.
- `getOrCreateSheet`, línea 892, establece una cabecera de nueve columnas para `BandejaNotificaciones`. `createUserNotification`, líneas 5007-5030, escribe nueve columnas; en cambio, `sendMultiChannelNotification`, líneas 4818-4885, escribe doce columnas y en un orden distinto. El lector conserva el esquema anterior, por lo que los campos pueden quedar desplazados o interpretados incorrectamente.
- La deduplicación de `sendMultiChannelNotification` realiza lectura y posterior append sin una reserva atómica que evite carreras concurrentes.
- `createUserNotification` no recibe ni persiste una clave de deduplicación equivalente.
- No se encontró un agregador backend `getUserWorkInbox` que entregue una bandeja personal unificada de tareas y notificaciones con contrato estable.

## 4. Autorización y aislamiento

- `markNotificationAsRead`, líneas 4993-5005, actualiza por identificador sin comprobar que la notificación pertenezca al usuario autenticado.
- `getDepartmentalWorkInbox`, líneas 3916-3939, recibe departamento/rol desde el payload. La rama para `direccion` o `administrador` incluye todas las solicitudes; el método no acredita por sí mismo que esos valores correspondan a la identidad y ámbito efectivos del solicitante.
- `getAuthorizationRequests`, líneas 6036-6098, mantiene un bypass asociado a `tutorUserId` suministrado por el cliente, ya cubierto por AUD-NG-036.
- `processWorkflowDecision`, líneas 6757-6818, permite que `revisorId` del cliente prevalezca sobre `_verifiedUserId`, ya cubierto por AUD-NG-024.

## 5. Hallazgos y reconciliación

- **AUD-NG-203 (ALTO/P1):** consulta de notificaciones rota y esquemas incompatibles de nueve/doce columnas. Se vincula a TASK-227 y TASK-316.
- **AUD-NG-204 (CRÍTICO/P0):** falta de comprobación de propietario en lectura y confianza en departamento/rol enviados por el cliente. Se vincula a TASK-221 y TASK-318.
- **AUD-NG-205 (ALTO/P1):** normalizador frontend incompleto y desconectado; falta agregador personal de tareas/notificaciones. Se vincula a TASK-221 y TASK-318.
- **AUD-NG-206 (ALTO/P1):** deduplicación no atómica y ausencia de clave persistida en `createUserNotification`. Se vincula a TASK-227 y TASK-316, coordinando TASK-045.

La reconciliación amplía tareas existentes: TASK-221 (bandeja unificada), TASK-227 (eventos de workflow), TASK-316 (multicanal, preferencias y reintentos) y TASK-318 (bandeja personal y SLA). AUD-NG-036 se amplía con el bypass de `tutorUserId`; AUD-NG-024 con la identidad de revisor suministrada por el cliente. F10-Task12 y F11-Task03 aparecen históricamente [X], pero esa marca no acredita el contrato único ni la integración de todos los productores. No se crea una tarea funcional paralela.

Dependencias principales: `getUnifiedNotifications` -> `getUserVerifiedRole` y `BandejaNotificaciones`; `markNotificationAsRead` -> RBAC, ID y propietario; `getDepartmentalWorkInbox` -> solicitudes, departamento y permisos efectivos; productores multicanal -> esquema, correo e idempotencia; helper frontend -> productores y estado persistido; decisiones de workflow -> identidad verificada y expediente.

## 6. Evidencia y pruebas

Consumidores consultados:
- `js/api.js`: SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`.
- `js/student.js`: SHA `e2888cea60322e49a40b89adadb8010489605dcc`.
- `js/teacher.js`: SHA `c475fce5afcd28fca23e7b64398ad32b17773746`.
- `js/secretary.js`: SHA `08a81266957b4c18cc25f8ba6749eac30a8f2c2c`.
- `js/accounting.js`: SHA `a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7`.

No se encontró `js/principal.js` en la ruta raíz. La ruta raíz `AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md` devolvió 404; el dictamen se apoya en la especificación histórica disponible y en el código citado.

**Ejecutado:** inspección estática/manual de funciones, contratos, esquemas, consumidores y tareas relacionadas.  
**No ejecutado:** Apps Script, Google Sheets, navegador/DOM, sesiones y roles reales, concurrencia, correo, mutaciones persistentes ni suites automatizadas. No se afirma validación runtime.

## 7. Resultado

T-UX-16 **NO CUMPLE**. La existencia de un helper frontend y de endpoints de notificación no constituye una bandeja unificada, persistente y autorizada. Hay incompatibilidades de esquema, una consulta backend potencialmente rota, falta de integración visible, control de propiedad insuficiente y deduplicación vulnerable a concurrencia.

- Código fuente: sin modificaciones.
- `Pendientes.md`: conserva AUD-NG-203..206 y las ampliaciones de TASK-221/227/316/318, AUD-NG-036 y AUD-NG-024.
- No se modificaron `completadas.md` ni `ChangesLogs.txt`.
- Siguiente tarea: T-UX-17 - Corregir y completar la protección de cambios no guardados.


---

## Tareas ejecutables derivadas de los hallazgos

> Esta auditoría no crea tareas funcionales paralelas. Los cuatro hallazgos AUD-NG-203..AUD-NG-206 se formalizan dentro de sus tareas existentes, preservando sus IDs, prioridades y relaciones. Las marcas históricas [X] de F10-Task12/F11-Task03 no acreditan por sí solas el contrato integrado descrito aquí.

### [TASK-227] Corregir consulta, contrato y eventos de notificaciones
- **Hallazgo de origen:** AUD-NG-203 (ALTO/P1); parte de AUD-NG-206 (ALTO/P1).
- **Severidad:** Alta. **Objetivo:** restablecer la lectura de notificaciones con un contrato único, consistente y compatible con todos los productores.
- **Acción ejecutable:** declarar y validar explícitamente los filtros de `getUnifiedNotifications`; corregir la consulta que hoy puede producir `ReferenceError`; unificar el esquema de `BandejaNotificaciones` y el orden/tipo de sus columnas para `createUserNotification` y `sendMultiChannelNotification`; añadir migración/validación de registros históricos sin desplazar campos.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `getUnifiedNotifications`; `getUserNotifications`; `getOrCreateSheet`; `createUserNotification`; `sendMultiChannelNotification`; hoja `BandejaNotificaciones`.
- **Dependencias/riesgos:** coordinar con TASK-316 y TASK-045; riesgo de interpretar campos desplazados como destinatario, fecha, estado o destino de acción.
- **Alcance:** contrato backend y persistencia de notificaciones; no asumir que la existencia de endpoints demuestra integración con paneles.
- **Criterios de aceptación:** lectura sin excepciones con hoja vacía y con datos; esquema único versionado; ambos productores escriben el mismo orden y tipos; filtros por usuario/categoría/estado funcionan; registros antiguos migrados o rechazados de forma explícita; pruebas de compatibilidad y regresión.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe documenta variables no declaradas y escrituras incompatibles de nueve y doce columnas.

### [TASK-221] Aplicar autorización por propietario y ámbito en la bandeja unificada
- **Hallazgo de origen:** AUD-NG-204 (CRÍTICO/P0); coordinación con AUD-NG-036 y AUD-NG-024.
- **Severidad:** Crítica. **Objetivo:** asegurar que cada usuario solo lea y modifique notificaciones, tareas y aprobaciones dentro de su identidad y ámbito autorizado.
- **Acción ejecutable:** hacer que `markNotificationAsRead` valide en backend la identidad autenticada y la propiedad del registro antes de mutar; derivar rol/departamento desde contexto verificado y no desde payload; eliminar confianza en IDs de usuario, tutor, revisor o departamento suministrados por el cliente, conservando los alcances específicos de AUD-NG-036/AUD-NG-024.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `markNotificationAsRead`; `getDepartmentalWorkInbox`; `getAuthorizationRequests`; `processWorkflowDecision`; validadores RBAC/ABAC.
- **Dependencias/riesgos:** TASK-318; AUD-NG-036; AUD-NG-024; matriz de permisos institucional. Riesgo de IDOR, lectura cruzada y decisiones atribuidas a otra identidad.
- **Alcance:** controles server-side por usuario, recurso y departamento; no limitarse a ocultar botones en frontend.
- **Criterios de aceptación:** lectura/marcado de notificación ajena denegados; departamento y rol se derivan de identidad verificada; payload manipulado no altera la autoridad efectiva; pruebas negativas con ID ajeno, departamento falso, tutor falso y revisor falso; cada denegación queda trazada.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe detectó actualización por ID sin comprobación de propietario y confianza en departamento/rol del payload.

### [TASK-318] Completar la bandeja personal integrada de tareas, notificaciones y aprobaciones
- **Hallazgo de origen:** AUD-NG-205 (ALTO/P1); parte de AUD-NG-204 (CRÍTICO/P0).
- **Severidad:** Alta. **Objetivo:** entregar una vista unificada real, contextual y autorizada, no solo un helper que transforma un array ya recibido.
- **Acción ejecutable:** implementar agregador personal backend con contrato estable para notificaciones, tareas y aprobaciones; mapear `notificacionId`, `fechaRegistro`, `enlaceAccion` y los campos reales de cada fuente al modelo canónico; preservar origen, contexto, entidad, vencimiento y acción requerida; conectar consumidores frontend y sincronizar leído/no leído con persistencia y contador.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `getUserWorkInbox` (a implementar); `getUnifiedNotifications`; `js/ui-common.js`; `js/api.js`; paneles Student, Teacher, Secretary, Accounting y Dirección.
- **Dependencias/riesgos:** TASK-221 y TASK-227; integración con fuentes de workflow; riesgo de destino genérico, IDs aleatorios, fecha actual sustitutiva y acciones sin contexto.
- **Alcance:** agregación e integración de la bandeja por usuario/rol; no duplicar motores de aprobación ni productores de notificaciones.
- **Criterios de aceptación:** cada elemento conserva tipo, origen, fecha, contexto, registro relacionado, vencimiento y acción; helper recibe datos de fuentes reales; paneles consumen el contrato; marcar leído persiste y actualiza contador; roles ven solo elementos autorizados; pruebas por rol, fuente, navegación y estados.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el helper actual no consulta fuentes, usa nombres de propiedades incompatibles y no se localizaron consumidores conectados.

### [TASK-316] Hacer atómica e idempotente la deduplicación multicanal
- **Hallazgo de origen:** AUD-NG-206 (ALTO/P1); coordinación con AUD-NG-203.
- **Severidad:** Alta. **Objetivo:** evitar notificaciones duplicadas ante concurrencia y reintentos, con clave persistida y verificable.
- **Acción ejecutable:** incorporar clave de deduplicación estable a `createUserNotification` y productores multicanal; reservar la clave de forma atómica antes de insertar; proteger la operación con mecanismo de concurrencia apropiado; hacer idempotentes los reintentos y registrar el resultado de cada canal.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `createUserNotification`; `sendMultiChannelNotification`; `BandejaNotificaciones`; coordinación con TASK-045.
- **Dependencias/riesgos:** TASK-227; TASK-045; esquema canónico de notificaciones. Riesgo de carrera entre lectura y append, claves no estables y divergencia entre canales.
- **Alcance:** deduplicación persistente y segura para productores; no asumir que una consulta previa seguida de append evita duplicados.
- **Criterios de aceptación:** dos solicitudes concurrentes con la misma clave producen un único registro lógico; reintento devuelve el resultado previo sin duplicar; claves distintas permiten eventos distintos; productor y lector comparten esquema; pruebas de concurrencia, timeout y reintento multicanal.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe encontró lectura seguida de append sin reserva atómica y ausencia de clave equivalente en `createUserNotification`.

### Reconciliación y límites
- **AUD-NG-203:** se conserva en TASK-227 y TASK-316; no crear una tarea duplicada.
- **AUD-NG-204:** se conserva en TASK-221/TASK-318 y mantiene relación con AUD-NG-036/AUD-NG-024; no duplicar los hallazgos de identidad existentes.
- **AUD-NG-205:** se conserva en TASK-318; no crear una segunda bandeja personal.
- **AUD-NG-206:** se conserva en TASK-227/TASK-316 y coordina TASK-045.
- **F10-Task12/F11-Task03:** las marcas históricas [X] no sustituyen la validación del contrato actual ni demuestran integración end-to-end.
- **Pruebas y estado:** solo se realizó inspección estática/manual; no se ejecutaron Apps Script, navegador, roles reales, concurrencia, correo ni mutaciones persistentes. Los hallazgos siguen abiertos hasta aportar evidencia de cierre.
