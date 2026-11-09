AUDITORÍA DE TAREAS COMPLETADAS - FASE2-T19
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 5493985322278be08607a613ef5b0b9c7860330b
================================================================

DICTAMEN: CUMPLE PARCIALMENTE. La implementación contiene varias cachés operativas y algunas invalidaciones correctas, pero no satisface la política integral de vigencia, aislamiento, coherencia y medición exigida por FASE2-T19. No se considera completada funcionalmente hasta resolver las tareas relacionadas y aportar pruebas reproducibles.

ALCANCE Y EVIDENCIA REVISADA
- backend/user-service/Code.gs (SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f).
- js/config.js (SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc).
- js/api.js (SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9).
- js/persistence.js (SHA 94ac26feb4f7f31f1f3f2a238e164d23be565d94).
- La revisión de dependencias frontend se limita a las rutas de caché consumidas por syncAcademicScope/fetchApi/PersistenceManager; no se afirma cobertura de todos los almacenes de todos los módulos.

1. INVENTARIO OBSERVADO EN USER
- acct_state_<userId>: estado de cuenta por usuario, TTL 60 s en verifySessionToken.
- revoked_user_<userId> y revoked_session_<sessionId>: marcas de revocación, TTL 21600 s en revokeUserSession.
- active_delegations_<userId>: delegaciones activas por usuario, TTL 300 s en hasActiveDelegationForAction.
- dynamic_permissions_matrix: matriz de permisos por rol, clave global, TTL 600 s en getDynamicPermissionsForRole.
- IDEM_USER_<action>_<token>: resultado idempotente, TTL 21600 s en saveIdempotentResult.
- REPLAY_REQ_<requestId>: protección anti-replay, TTL 300 s en verifyInterServiceEnvelope.
- COMM_REQ_<idempotencyKey>: resultado de solicitud institucional, TTL 600 s en createInstitutionalServiceRequest.
- invalidateUserRoleCache elimina user_role_<userId> y acct_state_<userId>; no se encontró escritura de user_role_ en el archivo revisado.
- savePermissionMatrix invalida dynamic_permissions_matrix. createSecurityDelegation y revokeSecurityDelegation invalidan active_delegations_<userId>; la expiración automática no invalida la clave.

2. POLÍTICAS DECLARADAS FRENTE A COMPORTAMIENTO REAL
- js/config.js declara USER_ROLES=21600 s/USER_SPECIFIC, INSTITUTIONAL_CATALOGS=43200 s/GLOBAL, SESSION_PERMISSIONS=3600 s/USER_SPECIFIC y FINANCIAL_STATEMENTS=0 s/NO_CACHE.
- No se observó consumo de CACHE_POLICIES desde fetchApi/PersistenceManager ni integración con CacheService.
- La política de roles no coincide con el código: no se escribe user_role_, mientras acct_state_ usa 60 s y el rol permanece en el claim del token firmado (vigencia del token: 24 h).
- SESSION_PERMISSIONS no coincide con dynamic_permissions_matrix (600 s, global por rol); la caché de delegaciones (300 s) y las claves idempotentes/replay tampoco figuran en el catálogo.
- manageInstitutionalDataCache(FLUSH_GLOBAL) solo registra un evento; no elimina las entradas. INVALIDATE_USER no comprueba el resultado booleano de invalidateUserRoleCache y puede devolver success tras un fallo. purgeSecurityCaches aparece en permisos y switch, pero no tiene definición local en el único Code.gs de USER.
- saveSystemConfiguration actualiza la hoja sin un flujo visible de invalidación/versionado de la caché local.

3. COHERENCIA DE AUTORIZACIÓN Y VIGENCIA
- verifySessionToken acepta acct_state_ cacheado hasta 60 s; la invalidez de cuenta puede persistir mientras la entrada esté caliente si no se ejecuta invalidación.
- manageAccountState escribe el nuevo estado y luego invoca dispatchSecurityEvent; esa función no tiene definición local en backend/user-service/Code.gs. No se observa llamada directa a invalidateUserRoleCache en este flujo.
- loginUser cambia el estado a Bloqueada al alcanzar cinco fallos sin invalidar acct_state_; registerUser(forceUpdate) puede volver a Activa sin invalidar la misma clave.
- hasActiveDelegationForAction devuelve la lista cacheada sin revalidar fechaInicio/fechaFin en cada hit. Crear/revocar invalida; la expiración automática en getSecurityDelegations actualiza la hoja pero no elimina active_delegations_, por lo que una autorización puede sobrevivir hasta el TTL restante (máximo 300 s).
- getDynamicPermissionsForRole devuelve null si la lectura de Spreadsheet falla con caché fría. validateRolePermission no distingue error de fuente de ausencia de regla y recurre a ROLE_PERMISSIONS; una denegación dinámica puede quedar sustituida por un permiso estático.
- La clave COMM_REQ_<idempotencyKey> no contiene identidad ni firma de payload. En un hit se devuelve directamente el resultado anterior, que incluye solicitante, rol y asunto. Como ScriptCache es compartida por el proyecto, la reutilización de una clave entre cuentas puede exponer datos de otra identidad.
- IDEM_USER sí incorpora la identidad verificada en la firma del payload; continúa siendo temporal y su persistencia durable está cubierta por AUD-NG-070.

4. CACHÉ LOCAL FRONTEND
- CACHE_POLICIES es una declaración en config.js; no gobierna PersistenceManager.
- syncAcademicScope usa academic_stats con clave config_<userId>, lo cual separa esa entrada por usuario.
- PersistenceManager.get devuelve la entrada IndexedDB sin verificar antigüedad; set conserva updated_at, pero no hay TTL/estado stale. fetchApi emite la caché inmediatamente y luego solicita el servidor; no se expone al consumidor una marca fiable de obsolescencia.
- Ante error de red, fetchApi devuelve fallbacks de éxito para algunas lecturas. En syncAcademicScope, el fallback de getAcademicConfig puede aplicar valores predeterminados después de haber mostrado la entrada local. No hay una señal coherente que distinga datos locales antiguos, fallback y confirmación vigente.

5. CRITERIOS DE FASE2-T19
1) Inventario y política por caché: PARCIAL.
2) Diferenciación de datos estáticos y sensibles al tiempo: PARCIAL; faltan políticas operativas.
3) TTL documentado y aplicado: NO CUMPLE.
4) Invalidación ante mutaciones: PARCIAL; algunas claves se invalidan y otras no.
5) Prevención de sobrescritura/uso de datos obsoletos: PARCIAL; no hay control de antigüedad en IndexedDB y delegaciones.
6) Comportamiento ante indisponibilidad de fuente: PARCIAL; algunos caminos fallan cerrados, otros recurren a permisos estáticos o mantienen datos locales.
7) Medición de latencia, cuotas y consistencia: NO CUMPLE; no hay métricas de hit/miss ni comparación caché/no caché.
8) Aislamiento de datos sensibles por identidad: NO CUMPLE en COMM_REQ_<idempotencyKey>.

RECONCILIACIÓN CON EL BACKLOG
- Ampliar AUD-NG-005: invalidación de estado de cuenta, bloqueos/reactivaciones y propagación.
- Ampliar AUD-NG-160: vigencia de matriz dinámica y delegaciones, expiración e indisponibilidad de fuente.
- Ampliar AUD-NG-070: aislamiento por identidad de todas las cachés idempotentes, incluida COMM_REQ_.
- Ampliar TASK-062: consumo real de CACHE_POLICIES, invalidación/versionado de configuración, operación de purga y frescura IndexedDB.
- Ampliar TASK-234: métricas de caché y comparación con/sin caché.
- Ampliar TASK-400: uso exclusivo para consistencia eventual admisible y manejo explícito de datos obsoletos.
No se crea un identificador AUD-NG nuevo porque los hallazgos quedan cubiertos por tareas existentes.

CALIDAD DE IMPLEMENTACIÓN
La solución muestra decisiones parciales correctas: claves de delegación por usuario, invalidación al crear/revocar delegaciones, invalidación de matriz tras savePermissionMatrix, y separación de la clave config_<userId>. Sin embargo, el contrato de caché es declarativo y no está conectado al runtime; existen TTL sin política, purgas que no purgan, fallback de permisos sin distinguir error de fuente, vencimiento de delegaciones no revalidado y una clave de idempotencia de comunicaciones sin identidad. La calidad global de FASE2-T19 es parcial y no permite afirmar cumplimiento seguro.

PRUEBAS Y LIMITACIONES
Inspección estática/manual de los archivos indicados. No se ejecutaron pruebas en Apps Script, pruebas concurrentes, simulaciones de fuente caída, latencia, cuotas, expiración ni solicitudes de dos usuarios. No se usaron datos productivos y no se modificó código fuente.
================================================================


---

## Tareas ejecutables derivadas de los hallazgos

> Se preservan los seis alcances existentes en la reconciliación. No se crean IDs nuevos: cada bloque formaliza una tarea ya registrada y evita duplicar el inventario de cachés.

### [AUD-NG-005] Garantizar invalidación inmediata del estado de cuenta y propagación entre servicios
- **Hallazgo de origen:** secciones 1 y 3; caché `acct_state_<userId>` y mutaciones de estado.
- **Severidad:** Alta. **Objetivo:** impedir que una cuenta bloqueada, desactivada o reactivada conserve un estado de autorización obsoleto.
- **Acción ejecutable:** invocar invalidación comprobable después de cada cambio de estado; corregir `manageAccountState`, `loginUser` y `registerUser(forceUpdate)`; implementar y verificar el despacho de eventos de seguridad; propagar invalidación a los servicios que consumen el estado; fallar de forma explícita si la invalidación no se completa.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `verifySessionToken`; `manageAccountState`; `loginUser`; `registerUser`; cachés `acct_state_` y `user_role_`.
- **Dependencias/riesgos:** AUD-NG-160 (vigencia de roles/delegaciones); riesgo de mantener permisos hasta el TTL de 60 s o de afirmar éxito cuando falla el evento.
- **Alcance:** invalidación de estado de cuenta y sesiones entre servicios; no sustituye revocación de sesión/token.
- **Criterios de aceptación:** bloqueo/reactivación invalida la caché inmediatamente; fallo de invalidación se devuelve y audita como fallo; ningún servicio autoriza con estado anterior; pruebas de bloqueo por intentos, cambio administrativo, reactivación y caída del dispatcher.
- **Prioridad:** conservar la prioridad registrada para AUD-NG-005. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; la auditoría detecta flujos sin invalidación y `dispatchSecurityEvent` sin definición local.

### [AUD-NG-160] Asegurar vigencia, aislamiento y fallo cerrado de roles, permisos y delegaciones
- **Hallazgo de origen:** secciones 1 y 3; `dynamic_permissions_matrix` y `active_delegations_<userId>`.
- **Severidad:** Alta. **Objetivo:** evitar que permisos o delegaciones vencidos, revocados o no verificables continúen autorizando operaciones.
- **Acción ejecutable:** revalidar fechas de delegación en cada hit o usar vencimiento efectivo; invalidar caché al expirar; comprobar resultado real de purga; distinguir error de lectura de matriz de ausencia de regla; no sustituir error de fuente por ROLE_PERMISSIONS estático; alinear TTL/ámbito con política declarada y propagar cambios entre servicios.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `verifySessionToken`; `hasActiveDelegationForAction`; `getSecurityDelegations`; `getDynamicPermissionsForRole`; `validateRolePermission`; `savePermissionMatrix`; `active_delegations_`; `dynamic_permissions_matrix`.
- **Dependencias/riesgos:** AUD-NG-005; TASK-062; riesgo de autorización tras expiración, caché global cruzada y fallback permisivo ante error.
- **Alcance:** vigencia de permisos/delegaciones y comportamiento fail-closed; no duplicar la matriz RBAC/ABAC general.
- **Criterios de aceptación:** delegación vencida no autoriza aunque exista caché caliente; revocación/expiración purga o invalida entradas; error de Spreadsheet no se interpreta como permiso ausente ni activa fallback permisivo; TTL coincide con política documentada; pruebas de expiración, revocación, fuente caída y cambios de rol.
- **Prioridad:** conservar la prioridad registrada para AUD-NG-160. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; hit de caché no revalida fechas y errores de lectura pueden activar permisos estáticos.

### [AUD-NG-070] Aislar por identidad las claves idempotentes y de replay
- **Hallazgo de origen:** sección 3; clave `COMM_REQ_<idempotencyKey>` sin identidad ni firma de payload.
- **Severidad:** Crítica. **Objetivo:** impedir que una cuenta reciba resultados cacheados de solicitudes creadas por otra identidad.
- **Acción ejecutable:** incluir identidad autenticada y firma canónica del payload en la clave/registro de idempotencia; validar propietario antes de devolver resultado; separar claves de comunicación por tenant/usuario/acción; revisar claves replay e idempotencia temporal y definir persistencia durable donde corresponda.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `createInstitutionalServiceRequest`; `COMM_REQ_`; `IDEM_USER_`; `REPLAY_REQ_`; verificación de identidad y firma de payload.
- **Dependencias/riesgos:** AUD-NG-006/AUD-NG-085 y controles de identidad; riesgo de exposición de datos entre cuentas y reutilización de claves.
- **Alcance:** aislamiento y propiedad de resultados idempotentes/replay; no cambiar semántica de negocio de las solicitudes.
- **Criterios de aceptación:** dos usuarios con la misma clave no comparten resultado; payload distinto con misma clave se rechaza; hit requiere identidad/acción/firma coincidentes; replay se registra después de validar integridad del sobre; pruebas cruzadas entre cuentas y reintentos legítimos.
- **Prioridad:** conservar la prioridad registrada para AUD-NG-070. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; `COMM_REQ_` es global y no incorpora identidad ni firma del payload.

### [TASK-062] Conectar las políticas declaradas de caché con el runtime y la configuración
- **Hallazgo de origen:** secciones 2 y 4; políticas declaradas sin aplicación; purga global nominal y configuración sin invalidación.
- **Severidad:** Alta. **Objetivo:** convertir CACHE_POLICIES en reglas efectivas de TTL, ámbito, frescura e invalidación para cachés backend/frontend.
- **Acción ejecutable:** conectar políticas con CacheService/PersistenceManager; inventariar claves/ámbitos/TTL reales; corregir `FLUSH_GLOBAL` para purgar realmente; propagar y comprobar `INVALIDATE_USER`; invalidar tras `saveSystemConfiguration`; versionar política y registrar actor/fecha; evitar éxito si la operación de invalidación falla.
- **Archivos/módulos:** `js/config.js` (`CACHE_POLICIES`); `js/persistence.js` (`PersistenceManager`); `js/api.js`; `backend/user-service/Code.gs` (`manageInstitutionalDataCache`, `saveSystemConfiguration`).
- **Dependencias/riesgos:** TASK-234 para métricas y TASK-400 para uso de datos stale; riesgo de declarar TTL no aplicado o invalidación ficticia.
- **Alcance:** política operativa de caché y configuración; mantener separadas las claves sensibles por usuario.
- **Criterios de aceptación:** cada política se aplica en el almacén correspondiente; TTL y ámbito medibles; FLUSH_GLOBAL elimina entradas; INVALIDATE_USER devuelve resultado real; cambios de configuración invalidan cachés afectadas; fallos se propagan; pruebas de expiración, purga global, usuario y mutación de configuración.
- **Prioridad:** conservar la prioridad vigente de TASK-062. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; CACHE_POLICIES no gobierna los almacenes observados y FLUSH_GLOBAL solo registra un evento.

### [TASK-234] Medir hit/miss, latencia, cuotas y consistencia de caché
- **Hallazgo de origen:** criterio 7; falta de medición comparativa con/sin caché.
- **Severidad:** Media. **Objetivo:** disponer de métricas reproducibles para decidir TTL y demostrar el efecto de las cachés.
- **Acción ejecutable:** instrumentar hit/miss, edad, expiración, latencia, errores, cuotas e invalidaciones por clave/almacén; comparar rutas con y sin caché; exponer agregados por servicio y periodo sin registrar datos sensibles.
- **Archivos/módulos:** `js/persistence.js`; `js/api.js`; `backend/user-service/Code.gs`; bitácora de métricas/observabilidad.
- **Dependencias/riesgos:** TASK-062 para políticas efectivas; TASK-064 para panel de observabilidad; riesgo de métricas sin ventana temporal o con PII.
- **Alcance:** telemetría de caché; no usar mediciones sintéticas como prueba de consistencia.
- **Criterios de aceptación:** hit/miss y latencia por almacén/operación; frescura y expiración medibles; comparación con/sin caché reproducible; cuotas y fallos visibles; datos agregados y saneados; pruebas de exactitud de métricas.
- **Prioridad:** conservar la prioridad vigente de TASK-234. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe indica que no existen métricas de hit/miss ni comparación con/sin caché.

### [TASK-400] Definir consistencia eventual y tratamiento explícito de datos obsoletos
- **Hallazgo de origen:** secciones 2 y 4; IndexedDB y fallback de fetchApi.
- **Severidad:** Alta. **Objetivo:** evitar que datos locales antiguos o fallbacks se presenten como información vigente confirmada.
- **Acción ejecutable:** incorporar TTL/edad/versión a entradas IndexedDB; marcar estados fresh/stale/loading/error; definir por dominio cuándo se permite servir stale; no sustituir indiscriminadamente fallos de red por respuestas exitosas; exponer al consumidor si el dato procede de caché, fallback o servidor; reconciliar con versión de servidor.
- **Archivos/módulos:** `js/persistence.js` (`PersistenceManager.get/set`); `js/api.js` (`fetchApi`); `js/config.js` (`CACHE_POLICIES`); `syncAcademicScope`.
- **Dependencias/riesgos:** TASK-062 y TASK-234; riesgo de ocultar indisponibilidad o aplicar valores predeterminados sobre datos locales más recientes.
- **Alcance:** consistencia eventual permitida por dominio y presentación de frescura; no prohibir toda caché local.
- **Criterios de aceptación:** cada entrada tiene timestamp/versión/TTL; expiradas se marcan stale; consumidor distingue caché/fallback/servidor; fallbacks no se confunden con confirmación vigente; reglas por dominio documentadas; pruebas de datos vencidos, offline, recuperación y reconciliación.
- **Prioridad:** conservar la prioridad vigente de TASK-400. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; PersistenceManager devuelve IndexedDB sin comprobar antigüedad y fetchApi puede responder con fallbacks de éxito.

### Reconciliación y límites
- **AUD-NG-005/AUD-NG-160/AUD-NG-070:** conservan invalidación de cuenta, vigencia de permisos/delegaciones y aislamiento de claves idempotentes, respectivamente.
- **TASK-062/TASK-234/TASK-400:** conservan política/runtime, métricas y consistencia eventual, sin duplicar sus alcances.
- **Pruebas:** inspección estática/manual; no se ejecutaron Apps Script, concurrencia, fuente caída, latencia, cuotas, expiración ni pruebas entre dos usuarios.
- **Estado:** FASE2-T19 cumple parcialmente; no se declara cumplimiento integral hasta aportar pruebas reproducibles.
