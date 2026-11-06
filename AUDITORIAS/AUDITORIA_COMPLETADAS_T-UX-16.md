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
