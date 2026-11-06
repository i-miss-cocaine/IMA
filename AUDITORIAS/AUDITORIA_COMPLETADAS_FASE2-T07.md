# Auditoría de tareas completadas - FASE2-T07

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** dfdcb1ec6f9b3884308b422a168e4ca9ddd8c21a  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** FASE2-T07 - Fortalecer el motor de eventos y la ejecución de procesos automáticos

## Dictamen

**NO CUMPLE INTEGRALMENTE.** La tarea está marcada [X] en `completadas.md`, pero el motor de eventos, las notificaciones, la automatización de reglas y las alertas académicas/financieras no satisfacen varios requisitos funcionales ni criterios de aceptación.

La auditoría C1.34/FASE2-06 ya había examinado el núcleo de eventos y creó AUD-NG-176/TASK-474 y AUD-NG-177/TASK-475. Se verificó que los SHAs de User, Academic, Accounting y Task siguen siendo exactamente los mismos de aquella auditoría; por tanto, los defectos documentados persisten y no se crean IDs duplicados. Esta revisión amplía el contraste al alcance completo de FASE2-T07 (12 requisitos y 10 criterios), especialmente preferencias, reglas automáticas, separación de estados y alertas de mora.

## Fuentes y respaldo

- `completadas.md`: SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; FASE2-T07 figura [X].
- `METODOLOGIA_DESARROLLO.md`: SHA `214e8221bd076c4e89012636c105bffd5ca36467`.
- `backend/user-service/Code.gs`: SHA `12079dd410aa6d8afbce55a4bc62a79dea605f9f`.
- `backend/academic-service/Code.gs`: SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`.
- `backend/accounting-service/Code.gs`: SHA `38b979d41596b85e888b4a7060b37bbac0840a28`.
- `backend/task-service/Code.gs`: SHA `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe`.
- `AUDITORIA_COMPLETADAS_FASE2-06.md` (C1.34): SHA `d5588887a3fc77b1f24c1c9846549e2fe6b4cd43`.
- `Pendientes.md` fuente recuperada del HEAD anterior: blob SHA `fb62c27bf00ab5b0e923170cd549643210e5a7eb`; 1,619,187 caracteres y 19,219 líneas.
- Rama de trabajo al inicio: `dfdcb1ec6f9b3884308b422a168e4ca9ddd8c21a`; rama base: `44d9891132332e692dbe2ba8602b41f50a508a59`.

## Reconciliación de hallazgos existentes

No se crean hallazgos nuevos porque las brechas observadas ya tienen tareas activas con alcance suficiente:

- **AUD-NG-176 / TASK-474:** contrato y catálogo de eventos, autenticación del emisor, outbox durable, reserva idempotente, productores interservicio, estados, recuperación, reintentos, destinatarios GLOBAL, causationId, métricas y pruebas aisladas.
- **AUD-NG-177 / TASK-475:** protección de secretos, redacción de configuraciones, escape HTML, validación de enlaces y saneamiento de logs.
- **AUD-NG-039:** alertas académicas basadas en datos persistidos, período/año lectivo, umbrales configurables, destinatarios y entrega verificable.
- **TASK-422:** preferencias individuales y jerarquía de configuración institucional.
- **TASK-404:** alertas financieras y operativas, incluida la cobertura de mora.
- **AUD-NG-006 / AUD-NG-161:** reserva idempotente, concurrencia y pruebas conductuales transversales.

Se ampliaron las notas de evidencia de estas tareas existentes en `Pendientes.md`; no se cambió su estado ni se generaron IDs nuevos.

## Evidencia técnica adicional y persistencia de brechas

### 1. Motor de eventos y autorización

- `registerAndDispatchEvent` (User, 4618-4699) solo exige presencia de `eventType` y `originService`; no valida catálogo de tipos, contrato, emisor autenticado, destinatario ni relación obligatoria con la operación. `originRequestId` es opcional.
- La deduplicación compara `originRequestId + eventType`, omite el emisor y solo devuelve duplicado cuando encuentra estado `PROCESADO`; no reserva la clave para eventos pendientes/en ejecución ni usa exclusión mutua.
- Genera `eventId` con `Math.random()`. Ejecuta `sendMultiChannelNotification` antes de agregar la fila a `BitacoraEventos`; una interrupción entre ambos pasos puede dejar un efecto secundario sin evento persistido.
- El parámetro `maxRetries` se recibe, pero no gobierna el procesamiento.
- `doPost` (1351-1558) valida permiso de acción y expone el endpoint, pero la función no verifica un sobre HMAC del servicio emisor. La presencia de un `originService` en el payload no demuestra identidad interservicio.
- La revisión C1.34 verificó que no existen llamadas a `registerAndDispatchEvent` en Academic, Accounting, Task ni Exam; sus SHAs siguen sin cambios. No se demuestra integración de productores reales.

### 2. Estados, reintentos, recuperación y orden

- `retryFailedEventsQueue` (4700-4760) recorre una instantánea completa de la hoja y procesa estados PENDIENTE/FALLIDO/REINTENTANDO con un máximo fijo de tres intentos. No reserva cada fila de forma exclusiva, no usa `nextAttemptAt`, no implementa backoff/jitter y no consume `maxRetries`.
- No existe un estado persistido EN_PROCESO con lease/expiración que permita distinguir un evento atascado de uno que otro worker está ejecutando. No se encontró trigger temporal en el código del servicio que programe la recuperación; no se puede verificar desde el repositorio si existen triggers configurados manualmente en el proyecto desplegado.
- El reintento omite el despacho cuando el destinatario es GLOBAL y aun así marca el evento PROCESADO.
- `retryFailedNotificationsQueue` (4761-4817) reintenta todos los correos `Pendiente_Reintento` sin contador persistente, máximo, programación ni backoff.
- `registerAndDispatchEvent` considera PROCESADO un evento si `sendMultiChannelNotification` retorna `status: success`, aunque su respuesta contenga `estadoEntrega: "Pendiente_Reintento"`. El estado del evento no refleja la entrega real por canal/destinatario.
- No hay `causationId`, límite de profundidad ni política de orden por entidad. No se acredita prevención de ciclos o manejo de eventos retrasados.

### 3. Canales, preferencias y seguridad

- `sendMultiChannelNotification` (4818-4935) registra inbox y usa `MailApp` cuando hay correo; no implementa despacho real SMS/WhatsApp/Messenger ni consume `CanalesProveedoresConfig`. El parámetro `canal` no determina el adaptador.
- `getNotificationPreferences` (4973-4984) devuelve valores fijos. `getUserSettings`/`saveUserSettings` (aprox. 7645-7715) sí leen y persisten preferencias, pero el despachador no las consulta ni aplica categorías/canales/frecuencia. No se demuestra una política para que preferencias opcionales no supriman comunicaciones institucionales obligatorias. Reconciliar con TASK-422.
- `configureNotificationChannel`/`getNotificationChannelConfigs` (7526-7612) continúan guardando configuración JSON en texto y devolviendo su contenido; `CredencialesEncriptadasHash` recibe el literal `HASH_CONFIG_PROTECTED`. La plantilla de correo inserta título, mensaje y enlace sin escape/validación. Mantener AUD-NG-177/TASK-475.
- `runInterdepartmentalIntegrationTestSuite` (218-310) llama a la cola real; puede modificar datos o reintentar comunicaciones. Verifica solo `status` en INT-03, espera campos incompatibles en INT-03/04/05 y devuelve `status: success` aunque haya pruebas fallidas. Mantener AUD-NG-161/TASK-474.

### 4. Reglas automáticas y alertas académicas/financieras

- `configureAutomationRules` (6551-6582) agrega una fila nueva en `ReglasAutomatizacionAlertas`; `getAutomationRules` (6584+) solo lee las filas. El evaluador académico revisado no consume esa hoja, por lo que guardar una regla no acredita que se aplique al proceso.
- `evaluateAndDispatchEarlyWarningAlerts` (Academic, 9264-9535) extrae `anolectivo` pero no lo usa para filtrar registros de asistencia/matrícula; agrega asistencia de todos los períodos/años. Los conteos de materias reprobadas y tareas pendientes proceden de `mockFailingSubjects` y `mockMissingTasks` del payload. La clave de deduplicación no incluye año lectivo; `notificadoA` es una cadena fija, no un comprobante por destinatario. Mantener AUD-NG-039.
- `getEarlyWarningAlerts` (Academic, 9537+) filtra por `userId` aportado en payload cuando se especifica, pero el alcance por identidad/ámbito debe validarse con la identidad autenticada, no depender del filtro solicitado. Reconciliar con AUD-NG-039.
- `calculateLateFeesForAccount` (Accounting, 1223-1278) consulta reglas `RecargosMoras` y calcula importes, pero devuelve los resultados en la respuesta; no persiste una alerta, no genera evento y no registra notificación a responsables. La alerta financiera por mora sigue dentro del alcance pendiente de TASK-404. No se afirma que el cálculo del recargo sea incorrecto; el incumplimiento es la falta de un flujo de alerta automática verificable.

## Contraste de los 12 requisitos

| Requisito | Resultado | Reconciliación |
|---|---|---|
| 1. Inventario de eventos interdepartamentales | No cumple | No existe catálogo/registro de productores y consumidores integrado. TASK-474. |
| 2. Origen, destinatarios, datos, efectos y autorización | No cumple | Contrato no validado ni emisor autenticado. TASK-474. |
| 3. ID único y referencia de operación | Parcial | eventId aleatorio; originRequestId opcional. TASK-474/AUD-NG-006. |
| 4. Estados de ciclo de vida y recuperación | No cumple | Estados incompletos; sin reclamación durable/lease. TASK-474. |
| 5. Reintentos y espera progresiva | No cumple | Máximo fijo; sin backoff, jitter ni nextAttemptAt. TASK-474. |
| 6. No duplicar efectos | No cumple | Deduplicación no atómica y solo sobre PROCESADO. TASK-474/AUD-NG-006. |
| 7. Orden y eventos retrasados | No cumple | No hay secuenciación ni programación por entidad. TASK-474. |
| 8. Detección de procesos atascados/fallos reiterados | No cumple | Sin estado EN_PROCESO/lease ni métricas reales de cola. TASK-474. |
| 9. Canales y preferencias sin bloquear avisos obligatorios | Parcial | Preferencias persistidas en una ruta, pero no aplicadas por el despachador; configuración de canal no consumida. TASK-422/TASK-475. |
| 10. Separar operación principal de notificación secundaria | No cumple | Evento puede marcarse procesado con correo pendiente; no hay estado por canal. TASK-474. |
| 11. Prevenir ciclos/recursión | No cumple | No hay causationId ni límite de profundidad. TASK-474. |
| 12. Logs sanitizados | Parcial/no demostrado | Se registra errorDetails sin política de redacción verificable. TASK-475/TASK-474. |

## Contraste de los 10 criterios de aceptación

1. Evento válido produce resultado esperado: **no demostrado**, faltan productores integrados y contrato de destino.
2. Evento repetido no duplica efectos: **no cumple**, la reserva no es atómica y los pendientes pueden competir.
3. Fallo del destinatario queda registrado: **parcial**, hay FALLIDO/ErrorDetalle, pero los fallos de correo pueden ocultarse bajo PROCESADO.
4. Recuperación no repite acciones completadas: **no cumple**, no existe clave estable por efecto/canal.
5. Eventos inválidos/no autorizados no ejecutan acciones protegidas: **no cumple**, se comprueba presencia de campos, no catálogo ni autenticación del emisor.
6. Estados pendiente/procesado/fallido distinguibles: **parcial**, estados nominales existen, pero GLOBAL puede quedar PROCESADO sin despacho y el estado no refleja el canal.
7. Canal de notificación indisponible no altera estado principal: **no demostrado**, no hay separación durable entre operación y entrega secundaria.
8. Procesos automáticos no crean ciclos ilimitados: **no cumple**, no hay causationId ni profundidad máxima.
9. Alertas académicas/inasistencia/mora conservan reglas y umbrales verificables: **no cumple**, datos mock y filtros académicos incompletos; cálculo de mora no crea alerta/evento. AUD-NG-039/TASK-404.
10. Fallos reiterados detectables sin inspección manual: **no cumple**, no hay métricas fiables de cola/atascos ni política programada demostrada. TASK-474.

## Calidad de implementación

- El motor mezcla registro, ejecución del efecto y actualización de estado en una única función; persiste el evento después del efecto.
- Se usan índices posicionales de hoja sin contrato versionado ni validación de esquema.
- La deduplicación consulta toda la hoja y no protege carreras; el identificador aleatorio no sustituye una clave de operación estable.
- Las colas de eventos y correo no comparten política de reintento ni resultado por destinatario/canal.
- La suite de integración no está aislada y sus DTO esperados no corresponden con las respuestas reales.
- Las reglas de automatización se almacenan, pero no están conectadas al evaluador de alertas.
- Las alertas mezclan datos persistidos y datos de prueba enviados por cliente; el registro de destinatarios no acredita notificación.
- Las funciones revisadas no acreditan ejecución programada. La inspección del código no permite afirmar qué triggers externos están instalados en producción.

## Pruebas y límites

Inspección estática/manual de los rangos indicados y reutilización de evidencia C1.34 cuando el SHA del archivo sigue idéntico. No se ejecutaron Apps Script, HTTP, triggers, proveedores, correos, pruebas concurrentes, pérdida de respuesta ni operaciones productivas. No se ejecutó la suite de integración porque invoca la cola real y podría producir efectos secundarios. No se modificó código fuente.

## Progreso y continuidad

- Identificadores auditados: **43/183**; 140 pendientes.
- Última tarea auditada: FASE2-T07.
- Próxima tarea: **FASE2-T08 - Implementar trazabilidad y correlación de operaciones entre servicios**.
- Reconciliar antes de esa auditoría los hallazgos previos de correlationId/sagaId y logs estructurados; no repetir AUD-NG-176/177 ni los alcances de TASK-474/475.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-474] Ampliar el motor de eventos con reglas, destinatarios y separación por canal
- **Hallazgo de origen:** FASE2-T07; ampliación de AUD-NG-176/TASK-474.
- **Severidad:** Alto.
- **Objetivo:** asegurar que las notificaciones reflejen eventos válidos, destinatarios autorizados y entregas reales.
- **Acción ejecutable:** completar catálogo de productores/consumidores; autenticar emisor; propagar correlationId/causationId; implementar estados por canal, lease y nextAttemptAt con backoff/jitter; expandir GLOBAL a destinatarios autorizados; evitar ciclos; separar resultado de operación principal de entrega secundaria; medir cola y atascos.
- **Archivos/módulos afectados:** backend/user-service/Code.gs y productores/consumidores de servicios; triggers y métricas.
- **Dependencias y riesgos:** AUD-NG-006/AUD-NG-161; AUD-NG-176 ya creado, no generar ID nuevo.
- **Alcance:** ampliación de TASK-474.
- **Criterios de aceptación:** eventos tienen origen/destinatarios/contrato; procesamiento concurrente no duplica; fallos se recuperan según política; notificación pendiente no marca evento como entregado; métricas identifican cola y atascos; pruebas aisladas no envían comunicaciones reales.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas del ciclo completo y métricas verificables.

### [TASK-475] Proteger configuración, secretos y contenido multicanal
- **Hallazgo de origen:** FASE2-T07; ampliación de AUD-NG-177/TASK-475.
- **Severidad:** Alto.
- **Objetivo:** proteger credenciales y evitar contenido inseguro en notificaciones/logs.
- **Acción ejecutable:** separar secretos de configuración funcional; redacted fields al consultar; escapar HTML y validar enlaces; sanear errorDetails y payloads de logs.
- **Archivos/módulos afectados:** backend/user-service/Code.gs; configuración de proveedores, plantillas y visor de logs.
- **Dependencias y riesgos:** permisos de canales; no exponer secretos a usuarios con permiso de consulta.
- **Alcance:** ampliación de TASK-475.
- **Criterios de aceptación:** ninguna respuesta incluye secretos; HTML se trata como texto; enlaces no permitidos se rechazan; logs no contienen PII/credenciales fuera de allowlist.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de redacción, sanitización y acceso.

### [AUD-NG-039] Calcular alertas académicas desde datos persistidos y contexto vigente
- **Hallazgo de origen:** FASE2-T07, apartado de alertas académicas.
- **Severidad:** Alto.
- **Objetivo:** eliminar métricas mock y asegurar que alertas correspondan al período/año y destinatarios reales.
- **Acción ejecutable:** derivar indicadores de notas/entregas persistidas; filtrar por anolectivo y período; incluir año en clave de deduplicación; consultar reglas configuradas; validar ámbito del usuario autenticado y registrar comprobante de entrega por destinatario.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; AlertasTempranas, ReglasAutomatizacionAlertas y servicio de notificaciones.
- **Dependencias y riesgos:** TASK-474 y TASK-422; no usar conteos del payload como fuente autoritativa.
- **Alcance:** alertas académicas/inasistencia.
- **Criterios de aceptación:** resultados reproducibles desde registros reales; datos de otro año/período no contaminan el cálculo; no se aceptan métricas mock; cada destinatario tiene estado verificable.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas por año/período y entrega simulada.

### [TASK-422] Aplicar preferencias individuales sin suprimir comunicaciones obligatorias
- **Hallazgo de origen:** FASE2-T07, sección de preferencias.
- **Severidad:** Medio.
- **Objetivo:** hacer que las preferencias persistidas gobiernen categorías, canales y frecuencia de notificación.
- **Acción ejecutable:** reemplazar valores fijos de getNotificationPreferences por la configuración del usuario; hacer que el despachador consulte preferencias y canales; definir excepciones para avisos institucionales obligatorios.
- **Archivos/módulos afectados:** backend/user-service/Code.gs y despachador de notificaciones.
- **Dependencias y riesgos:** TASK-474 y TASK-475.
- **Alcance:** preferencias y jerarquía de configuración.
- **Criterios de aceptación:** preferencias guardadas se aplican por usuario; avisos obligatorios siguen entregándose; cambios de preferencia se reflejan en el siguiente despacho.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas por categoría, canal y excepción.

### [TASK-404] Persistir y despachar alertas financieras de mora
- **Hallazgo de origen:** FASE2-T07, sección de alertas financieras.
- **Severidad:** Alto.
- **Objetivo:** convertir el cálculo de mora en una alerta operativa verificable.
- **Acción ejecutable:** persistir alerta/evento cuando una cuenta cumpla reglas; asociar responsables autorizados; despachar notificación y conservar estado/fecha/resultado; deduplicar por cuenta, período y regla.
- **Archivos/módulos afectados:** backend/accounting-service/Code.gs; reglas de mora, eventos y notificaciones.
- **Dependencias y riesgos:** TASK-474 y TASK-422.
- **Alcance:** alertas financieras/operativas; no modificar aquí la fórmula de recargos.
- **Criterios de aceptación:** cálculo genera alerta persistente con clave única; destinatarios y entrega son verificables; consulta no altera cargos; repetición no duplica alertas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de mora, deduplicación y despacho.
