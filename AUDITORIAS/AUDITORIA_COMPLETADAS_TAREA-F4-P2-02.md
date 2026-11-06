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
