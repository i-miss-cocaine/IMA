# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P2-02

**Checkpoint:** C1.86  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `0ccbc15d3337f79128eff3618b322782910c21dc`  
**Tree SHA de partida:** `84999959dce28e4f6ef720813f3c337760491893`  
**Rama base protegida:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia de ramas:** 148 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; estado abierta; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE.** La tarea aparece marcada [X] en `completadas.md`, pero la implementación actual no completa el ciclo de vida de cuentas y sesiones. El cambio descrito en `ChangesLogs.txt` acredita la creación de una máquina de estados y la llamada a un dispatcher, no el funcionamiento integral del flujo. Se revalidan hallazgos existentes; no se crean IDs nuevos.

## 1. Alcance y limitaciones de la fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1773-1778) marca TAREA-F4-P2-02 como completada, severidad Medio, categoría Identidad/Administración, con archivos `backend/user-service/Code.gs`, `js/auth.js` y `js/ui-common.js`. No contiene criterios de aceptación detallados.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1748-1752) describe la constante `ALLOWED_ACCOUNT_STATE_TRANSITIONS` y la modificación de `manageAccountState` para validar transiciones, registrar diffs y llamar a `dispatchSecurityEvent`. La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no existe en el árbol de esta rama; no se inventan sus criterios ausentes.

## 2. Evidencia inspeccionada

| Archivo | SHA | Inspección |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | PUBLIC_ACTIONS 922-925; generateSessionToken 1065-1080; verifySessionToken 1083-1140; doPost 1351-1438; revokeUserSession 2318-2330; ALLOWED_ACCOUNT_STATE_TRANSITIONS/manageAccountState 2332-2386; logoutUser 2456-2475; loginUser 2479-2547. |
| `js/auth.js` | `8444dd085a3186106d2db7005b61ef934d3c22d8` | Login 138-160 y registro/login automático 211-240. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | Construcción de contexto y cuerpo fetchApi 40-57. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | handleLogout 225-235 y handleSessionExpired 238-249. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de funciones y estados de cuenta/sesión; sin casos específicos coincidentes. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida; sin casos específicos coincidentes. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Estado maestro y archivos involucrados. |
| `ChangesLogs.txt` | `d57cf4bd861b5c3720e60cf83241ed804ff645d9` | Cambio declarado de máquina de estados. |
| `METODOLOGIA_DESARROLLO.md` | `1eb36a2aa31bb407d35b37059e29478c17959c9a` | Regla 16.9 de ID operativo de sesión; ya está registrada. |

El árbol recursivo de HEAD contiene un único archivo versionado bajo `backend/user-service/`: `Code.gs`. Se buscó una definición local de `dispatchSecurityEvent`, `processSecurityEventQueue`, `getSecurityEventsQueue` y `purgeSecurityCaches`; no se encontraron definiciones en ese archivo.

## 3. Hallazgos

### 3.1. El frontend descarta el token de sesión (AUD-NG-001)

USER/loginUser devuelve `sessionToken` tanto en el objeto superior como en `data.sessionToken` (USER 2479-2547). En el handler de login, `js/auth.js` construye `userData` con userId, nombre, email, rol y otros atributos, pero omite `result.data.sessionToken` antes de persistir `currentUser` (138-160). En `js/api.js`, fetchApi agrega únicamente `requesterUserId` y `requesterRole` (48-49); el cuerpo JSON contiene action y payload, sin token (51-57).

**Efecto:** el flujo de autenticación no conserva ni transmite la credencial que el backend emite. Se reconcilia con AUD-NG-001, sin duplicar.

### 3.2. El cierre de sesión no revoca en servidor (AUD-NG-159)

`handleLogout` (ui-common.js 225-235) elimina currentUser y claves locales de sesión y redirige a login.html. No llama a USER/logoutUser ni espera confirmación remota.

En USER, `logoutUser` está incluido en `PUBLIC_ACTIONS` (922-925). La función acepta `userId` y `sessionId` del payload; cuando existe un token válido, los claims solo rellenan los campos que faltan, no sustituyen valores aportados por el cliente (2456-2475). Después llama a `revokeUserSession` (2318-2330), que escribe marcadores de revocación sin validar la propiedad de la sesión.

**Efecto:** sigue siendo posible invocar el cierre sin autenticación y apuntar a identificadores ajenos. Se reconcilia con AUD-NG-159, sin duplicar.

### 3.3. La revocación caduca antes que el token (AUD-NG-005)

`generateSessionToken` emite tokens con expiración de 24 horas (1065-1080). `revokeUserSession` guarda `revoked_session_*` y `revoked_user_*` durante 21.600 segundos (6 horas) (2318-2330). Si el marcador desaparece al expirar su TTL y la cuenta permanece Activa, el token puede seguir siendo válido durante el resto de su ventana de 24 horas.

**Efecto:** la revocación basada exclusivamente en estos marcadores de caché no cubre toda la vigencia del token. Se amplía AUD-NG-005; no se crea ID nuevo.

### 3.4. Login y verificación discrepan en estados no activos (AUD-NG-005)

La máquina de estados define Pendiente, InvitacionEnviada, Activa, Suspendida, Bloqueada y Desactivada (2332-2340). `loginUser` solo rechaza explícitamente Suspendida, Desactivada y Bloqueada (2479-2500); por tanto, una cuenta Pendiente o InvitacionEnviada con contraseña correcta puede recibir una respuesta de login exitoso y un token (2501-2537). En cambio, `verifySessionToken` exige que el estado vigente leído de Usuarios sea exactamente Activa (1083-1140).

**Efecto:** puede completarse el login con éxito y fallar inmediatamente la primera llamada protegida. Se amplía AUD-NG-005 por inconsistencia de ciclo de vida; no se crea ID nuevo.

### 3.5. El cambio de estado persiste antes de un dispatcher no definido localmente (AUD-NG-005)

`manageAccountState` escribe el nuevo estado en Usuarios, registra el cambio y después invoca `dispatchSecurityEvent` (2342-2386). No hay definición local de esa función en el único archivo versionado del servicio USER. La llamada ocurre después de persistir el estado, por lo que un error en ese punto puede dejar la mutación guardada sin propagación confirmada ni rollback.

Este defecto ya fue documentado en C1.83 y permanece dentro de AUD-NG-005. Se revalida, no se duplica.

## 4. Reconciliación

- **AUD-NG-001:** persistencia y transmisión del token desde login hacia fetchApi.
- **AUD-NG-005:** propagación de estado/revocación, coherencia de TTL, aceptación de estados no activos y dispatcher ausente.
- **AUD-NG-159:** logout público, confianza en IDs del payload y ausencia de revocación remota desde la UI.
- **AUD-NG-160:** mantiene su alcance separado de vigencia de roles y cachés de privilegios; no se amplía en este checkpoint.
- **AUD-NG-006:** no se amplía; corresponde a semántica de reintentos/idempotencia de fetchApi, fuera del alcance específico de ciclo de vida de cuentas y sesiones.
- No se crea ningún AUD-NG ni TASK nuevo.

## 5. Pruebas y límites

**Ejecutado:** inspección estática/manual de los archivos, revisión del router y permisos, búsqueda de definiciones del dispatcher, búsqueda dirigida en ambos archivos de pruebas, cotejo con Pendientes.md/Auditoria.txt/MapaDependencias.md y verificación de SHA.

**No ejecutado:** Apps Script runtime, llamadas HTTP, Google Sheets productivo, CacheService real, pruebas de revocación tras TTL, login de cuentas Pendiente/InvitacionEnviada, logout multiusuario, navegador/DOM, fallos parciales, concurrencia ni suites automatizadas. No se modificó código fuente ni se ejecutaron mutaciones de datos.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 83/183 identificadores auditados; 100 pendientes.
- **Última tarea auditada:** C1.86 / TAREA-F4-P2-02.
- **Siguiente tarea exacta:** TAREA-F4-P2-03 - Mejorar la experiencia administrativa de gestión de usuarios, permisos y delegaciones.
- **Archivos documentales de esta iteración:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.


## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-001] Completar el transporte autenticado del token de sesión desde el login hasta los servicios protegidos

- **Hallazgo de origen:** sección 3.1 y evidencia de `AUDITORIAS/Auditoria.txt`, hallazgo AUD-NG-001. `loginUser` devuelve `sessionToken`, pero `js/auth.js` no incorpora `result.data.sessionToken` al contexto de sesión y `js/api.js/fetchApi` solo transmite `requesterUserId` y `requesterRole`, sin adjuntar la credencial esperada por los validadores.
- **Severidad:** Crítico. La autenticación queda desconectada del transporte de las operaciones protegidas y la identidad declarada por el cliente no sustituye una credencial verificable.
- **Objetivo:** establecer un contrato único y verificable para conservar el token emitido por USER y transmitirlo en cada solicitud que requiera autenticación, de modo que los servicios validen la sesión y deriven la identidad de los claims firmados.
- **Acción ejecutable:**
  1. Ajustar el handler de login en `js/auth.js` para extraer el token de la respuesta canónica de `loginUser`, validarlo como valor no vacío y entregarlo al gestor de sesión sin perderlo al construir `currentUser`.
  2. Definir un único mecanismo de almacenamiento/lectura del token durante la sesión. Evitar duplicar fuentes de verdad o aceptar un token alternativo procedente de campos de perfil, parámetros de URL o datos no verificados.
  3. Modificar `js/api.js/fetchApi` para adjuntar `sessionToken` al cuerpo de las solicitudes autenticadas, manteniendo intacta la firma pública `fetchApi(service, action, payload)` y sin sobrescribir el payload de negocio.
  4. Comprobar que los contratos de recepción de USER, ACADEMIC, ACCOUNTING, TASK y EXAM acepten el mismo campo y que la validación derive userId/rol de los claims; no confiar en `requesterUserId` ni `requesterRole` como prueba de identidad.
  5. Definir el comportamiento para token ausente, malformado, vencido o rechazado: no degradar silenciosamente a una identidad aportada por el cliente ni presentar una operación protegida como exitosa.
  6. Mantener separados los endpoints declarados públicos por otros hallazgos (AUD-NG-002); esta tarea no certifica ni corrige por sí sola sus permisos.
- **Archivos/módulos afectados:** `js/auth.js`; `js/api.js`; gestor/contexto de sesión utilizado por el frontend; `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs` y `backend/exam-service/Code.gs` en lo relativo al contrato común de recepción/verificación.
- **Dependencias y riesgos:** AUD-NG-003 conserva la validación estricta de expiración; AUD-NG-005 conserva estado y revocación; AUD-NG-159 conserva la autorización del logout. Riesgos: exponer tokens en almacenamiento accesible a scripts, desincronizar el contexto de sesión, romper llamadas interservicio o introducir compatibilidad parcial entre validadores. La implementación debe evitar que el cambio de transporte convierta los campos de identidad del cliente en autoridad.
- **Alcance:** emisión, conservación durante la sesión y transporte del token desde login hasta las solicitudes protegidas. No incluye la revisión general de PUBLIC_ACTIONS, la política de expiración del token ni la revocación arbitraria de sesiones, que tienen hallazgos propios.
- **Criterios de aceptación:**
  1. Un login exitoso conserva exactamente el token emitido por USER y no fabrica uno alternativo ni lo sustituye por datos del perfil.
  2. Una solicitud protegida de cada servicio aplicable transmite el token mediante el contrato acordado y el backend obtiene userId/rol de claims verificados.
  3. Las solicitudes sin token, con token alterado o vencido son rechazadas explícitamente; no se autorizan por requesterUserId/requesterRole.
  4. El cierre de sesión y la expiración limpian el token del almacenamiento/contexto conforme al contrato de sesión.
  5. Las llamadas existentes mantienen la firma y el orden de argumentos de fetchApi; se prueban lecturas y escrituras representativas sin alterar sus payloads funcionales.
  6. Las pruebas distinguen PASS, FAIL, SKIP y NOT RUN; no se declara integración completa si algún servicio no fue ejercitado.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Adjuntar commit de implementación, pruebas de login/transporte por servicio, rechazos de credenciales inválidas y revisión de seguridad del almacenamiento del token.

### [AUD-NG-005] Unificar la vigencia del estado de cuenta y la propagación efectiva de revocaciones entre servicios

- **Hallazgo de origen:** secciones 3.3, 3.4 y 3.5; hallazgo preexistente AUD-NG-005 en `AUDITORIAS/Auditoria.txt` y ampliaciones de C1.86. El estado de cuenta se cachea por 60 segundos sin invalidación coordinada demostrada; las marcas de revocación duran 6 horas frente a tokens de 24 horas; login acepta estados Pendiente/InvitacionEnviada aunque verifySessionToken exige Activa; y manageAccountState persiste antes de llamar a un dispatcher cuya definición local no se encontró.
- **Severidad:** Alto. Una cuenta suspendida/desactivada puede conservar acceso durante ventanas de caché, y los distintos puntos de autenticación pueden discrepar sobre si una cuenta está habilitada.
- **Objetivo:** garantizar que los cambios de estado y las revocaciones se apliquen de forma coherente, verificable y recuperable en todos los servicios, durante toda la vigencia de las credenciales afectadas.
- **Acción ejecutable:**
  1. Establecer una única política de estados permitidos para autenticación y verificación de sesión. El login debe rechazar cualquier estado que no sea Activa, con respuestas de dominio consistentes con verifySessionToken.
  2. Sustituir la dependencia de marcadores de CacheService de 6 horas como única fuente de revocación por un mecanismo cuya vigencia cubra la expiración máxima de los tokens o por una versión/registro persistente de sesión que permita invalidación inmediata y comprobable.
  3. Definir el contrato de invalidación de `acct_state_<userId>` y de las marcas de revocación para USER, ACADEMIC, ACCOUNTING, TASK y EXAM; asegurar que todos los servicios consulten la misma autoridad y que las cachés locales no prolonguen permisos tras una revocación.
  4. Implementar o integrar el dispatcher de eventos de seguridad que actualmente se invoca desde manageAccountState. Si la propagación falla después de persistir el cambio, dejar una operación recuperable (por ejemplo, outbox/cola durable con reintento e idempotencia) y no declarar propagación confirmada sin acuse verificable.
  5. Ordenar la mutación del estado, el registro de auditoría y la propagación para evitar que una excepción posterior deje un cambio parcialmente aplicado sin trazabilidad ni mecanismo de recuperación.
  6. Mantener separado el control de vigencia de roles/privilegios de AUD-NG-160 y el cierre autenticado/revocación arbitraria de AUD-NG-159. No trasladar sus responsabilidades a esta tarea.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`; `backend/academic-service/Code.gs`; `backend/accounting-service/Code.gs`; `backend/task-service/Code.gs`; `backend/exam-service/Code.gs`; contratos/colas de eventos de seguridad; pruebas de integración y fixtures aislados.
- **Dependencias y riesgos:** AUD-NG-001 aporta el transporte de la credencial; AUD-NG-159 aporta el logout autenticado; AUD-NG-160 conserva la vigencia de roles. Riesgos: cachés independientes por proyecto Apps Script, fallos parciales entre escritura y despacho, pérdida de eventos, reintentos duplicados y divergencia temporal de estado. No asumir que ScriptCache de USER invalida cachés de otros proyectos.
- **Alcance:** estados de cuenta, vigencia de sesiones, revocación por estado y propagación de eventos de seguridad entre los cinco servicios. No incluye cambios de rol/matriz de privilegios, autorización del logout ni la idempotencia general de fetchApi.
- **Criterios de aceptación:**
  1. Login y verifySessionToken aplican exactamente la misma regla de estado; Pendiente, InvitacionEnviada, Suspendida, Bloqueada y Desactivada no reciben una sesión utilizable.
  2. Una revocación permanece efectiva durante toda la ventana de validez del token o se verifica contra un estado persistente/versionado; la expiración de una entrada de caché no reactiva credenciales.
  3. Una prueba aislada demuestra que un cambio de estado invalida o bloquea la sesión en USER, ACADEMIC, ACCOUNTING, TASK y EXAM dentro del límite temporal documentado.
  4. El dispatcher tiene una definición y contrato verificables; los fallos de publicación quedan persistidos para recuperación y los reintentos no duplican ni pierden eventos.
  5. La actualización de estado y la bitácora conservan actor, entidad, estado anterior/nuevo, timestamp, resultado de propagación y correlación de recuperación.
  6. Los errores de lectura/escritura, timeout y caída del dispatcher producen resultados explícitos y no una respuesta de éxito engañosa.
  7. Las pruebas de TTL, cambio de estado, recuperación y concurrencia usan fixtures aislados; no se ejecutan contra hojas productivas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Adjuntar commit, pruebas multi-servicio de revocación/estados, escenarios de expiración y recuperación del dispatcher, además de revisión de integridad de auditoría.

### [AUD-NG-159] Asegurar el cierre autenticado de la sesión propia y bloquear la revocación arbitraria de cuentas

- **Hallazgo de origen:** sección 3.2 y hallazgo preexistente AUD-NG-159 en `AUDITORIAS/Auditoria.txt`. logoutUser permanece en PUBLIC_ACTIONS, acepta userId/sessionId suministrados por payload y permite invocar revokeUserSession sin comprobar que los identificadores correspondan a los claims de una sesión autenticada; handleLogout solo limpia el almacenamiento local y no solicita revocación remota.
- **Severidad:** Crítico. El endpoint permite que un cliente no autenticado provoque la revocación de sesiones de terceros y que una interfaz informe un cierre local sin invalidar la sesión del servidor.
- **Objetivo:** limitar el logout ordinario a la sesión autenticada que lo invoca y garantizar que la interfaz solicite la revocación al servidor sin aceptar identidades arbitrarias del cliente.
- **Acción ejecutable:**
  1. Retirar logoutUser de PUBLIC_ACTIONS y exigir un sessionToken válido antes de ejecutar cualquier operación de cierre o revocación.
  2. Derivar userId y sessionId exclusivamente de los claims verificados. Rechazar o ignorar de forma segura cualquier identificador de sesión/usuario enviado en el payload que no coincida con esos claims.
  3. Restringir el logout ordinario a la sesión autenticada actual. Cualquier revocación administrativa de sesiones ajenas debe usar una acción separada, con autorización explícita, alcance limitado y registro de auditoría.
  4. Actualizar handleLogout en js/ui-common.js para invocar USER/logoutUser con el token de sesión, procesar la respuesta y limpiar las credenciales locales de forma segura incluso ante pérdida de conectividad; no mostrar confirmación de revocación remota si el servidor no la confirmó.
  5. Hacer que revokeUserSession solo pueda ser invocada desde rutas que hayan completado la autorización correspondiente y registrar actor, sesión objetivo, motivo y resultado.
  6. Coordinar el contrato con AUD-NG-001 (transporte del token) y AUD-NG-005 (vigencia/propagación de revocación), sin absorber la corrección de TTL ni la invalidación interservicio.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs` (PUBLIC_ACTIONS, doPost, logoutUser, revokeUserSession, verifySessionToken); `js/ui-common.js` (handleLogout); `js/auth.js` y `js/api.js` para integración del token.
- **Dependencias y riesgos:** AUD-NG-001 debe proporcionar el token en el cliente; AUD-NG-005 debe garantizar que la revocación permanezca efectiva entre servicios y durante la vida del token. Riesgos: dejar una ruta alternativa pública, permitir IDOR por campos del payload, borrar la credencial local antes de intentar la operación remota sin registrar el resultado o revocar accidentalmente sesiones adicionales.
- **Alcance:** logout de la sesión propia y control de autorización de revokeUserSession. No incluye la política global de expiración/TTL, el bloqueo por estado de cuenta ni la actualización de roles, que permanecen en AUD-NG-005/AUD-NG-160.
- **Criterios de aceptación:**
  1. logoutUser no aparece en PUBLIC_ACTIONS y rechaza solicitudes sin token válido.
  2. El servidor obtiene userId/sessionId de claims verificados; payloads con IDs ajenos, ausentes o alterados no pueden revocar sesiones de terceros.
  3. El logout de una sesión propia revoca exactamente esa sesión y deja evidencia auditable; no revoca todas las sesiones del usuario salvo que exista una operación administrativa distinta y autorizada.
  4. La interfaz llama al backend y diferencia confirmación remota, fallo remoto y limpieza local; nunca presenta una revocación no confirmada como exitosa.
  5. Una sesión ajena no puede revocarse por invocación anónima ni por manipulación del payload.
  6. Se prueban logout propio, token ausente/alterado, IDs ajenos, repetición del logout y fallo de red con fixtures aislados.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Adjuntar commit de implementación, pruebas de autorización negativa/positiva, evidencia de revocación de la sesión propia y revisión de la ruta UI/API.
