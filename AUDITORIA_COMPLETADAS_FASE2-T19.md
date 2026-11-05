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
