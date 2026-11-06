# AUDITORÍA DE TAREA COMPLETADA - TAREA-F4-P0-03
FECHA: 2026-11-06
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 59475ca2d340ea3e9f5a964942ac49bccf72411c
RAMA BASE: NG_beta_0.0.0.1
HEAD DE LA RAMA BASE: 44d9891132332e692dbe2ba8602b41f50a508a59
TAREA: TAREA-F4-P0-03 - Garantizar la revocación efectiva de sesiones y la actualización inmediata de privilegios
ESTADO EN completadas.md: [X] Completada
CHECKPOINT: C1.74
ID OPERATIVO DE SESIÓN: IMA-AUDIT-20261106-1138Z
INICIO DE SESIÓN: C1.71 (sesión abierta)
================================================================

## 1. Alcance y trazabilidad

completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676) marca la tarea como [X] y enumera los cinco microservicios USER, ACADEMIC, ACCOUNTING, EXAM y TASK, además de js/auth.js, js/api.js y js/ui-common.js. El informe de origen AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no aparece en el árbol actual; el alcance se reconstruye desde el registro maestro y los hallazgos pendientes AUD-NG-005, AUD-NG-159 y AUD-NG-160.

## 2. Dictamen

**NO CUMPLE.** La revocación de sesión se escribe en el ScriptCache de USER y no se demuestra su propagación a los demás microservicios; los manejadores remotos eliminan la marca revoked_session en vez de establecerla; el dispatcher de seguridad no tiene implementación local encontrada en el código versionado; la invalidación de estado y privilegios es incompleta; y el cierre de sesión del frontend solo limpia almacenamiento local.

## 3. Revocación de sesión

### 3.1 Escritura local en USER

**backend/user-service/Code.gs**, SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:

- revokeUserSession, líneas 2318-2330, escribe revoked_session_<sessionId> y revoked_user_<userId> mediante CacheService.getScriptCache() con TTL de 21600 segundos.
- La función invalida claves locales mediante invalidateUserRoleCache, pero no hace una llamada explícita a ACADEMIC, ACCOUNTING, EXAM o TASK.
- La marca se escribe en el ScriptCache del proyecto USER; los otros servicios leen sus propios ScriptCache. El código versionado no muestra un almacén compartido ni una propagación efectiva de esa marca.

### 3.2 Manejadores remotos defectuosos

Los cuatro servicios secundarios sí definen purgeSecurityCaches:

- ACADEMIC, SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc, desde línea 3702.
- ACCOUNTING, SHA 38b979d41596b85e888b4a7060b37bbac0840a28, desde línea 10200.
- EXAM, SHA 1d93296628fae31f680004f637897e2b1314a64c, desde línea 948.
- TASK, SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe, desde línea 1919.

Los cuatro repiten el mismo comportamiento:
- Si payload.sessionId existe, ejecutan cache.remove("revoked_session_" + sessionId), no cache.put. Un evento SESSION_REVOKED elimina la marca en lugar de establecerla.
- Para SESSION_REVOKED sin payload.accountState, no se establece revoked_user_<targetUserId>.
- Solo se establece revoked_user_<targetUserId> cuando llega un accountState distinto de Activa.
- El manejador devuelve status success incluso cuando la rama SESSION_REVOKED no bloquea la sesión solicitada.

### 3.3 Falta de despacho desde USER

En USER, doPost contiene casos para dispatchSecurityEvent, processSecurityEventQueue, getSecurityEventsQueue y purgeSecurityCaches, pero no se encontraron definiciones locales de esas funciones en el código versionado del servicio ni en los otros cuatro servicios. manageAccountState (líneas 2342-2380) modifica la hoja y después llama dispatchSecurityEvent; no llama directamente a invalidateUserRoleCache. No se encontró una definición versionada de dispatchSecurityEvent que permita verificar llamadas a los cuatro servicios secundarios.

registerAndDispatchEvent es un mecanismo separado de notificaciones y no demuestra propagación de eventos de seguridad. No se afirma que no exista una biblioteca externa en los deployments; no hay declaración de esa dependencia en el árbol actual y no puede verificarse desde el repositorio.

## 4. Estado de cuenta y reactivación

- verifySessionToken en los cinco servicios mantiene acct_state_<userId> en caché durante 60 segundos.
- manageAccountState cambia el estado en la hoja, pero no invalida directamente la caché local; la llamada posterior a dispatchSecurityEvent no puede verificarse desde el código versionado.
- registerUser(forceUpdate), en USER alrededor de líneas 2393-2440, puede reactivar una cuenta existente como Activa sin llamar a invalidateUserRoleCache ni demostrar invalidación en los otros servicios.
- manageInstitutionalDataCache con acción FLUSH_GLOBAL solo registra/loguea la purga; no elimina las claves globales que consumen los validadores.
- AUD-NG-005 sigue pendiente y se amplía con estos casos.

## 5. Actualización de privilegios

- generateSessionToken emite el claim role; verifySessionToken valida firma y estado, pero no compara el rol del token con el rol vigente de Usuarios ni una versión de privilegios.
- getDynamicPermissionsForRole en USER, ACADEMIC, ACCOUNTING, EXAM y TASK usa la clave global dynamic_permissions_matrix con TTL de 600 segundos.
- savePermissionMatrix invalida esa clave en el ScriptCache de USER, pero no hay una invalidación demostrada en los otros cuatro proyectos.
- purgeSecurityCaches en ACADEMIC/ACCOUNTING/EXAM/TASK intenta eliminar perm_matrix_<role> y dynamic_perms_<role>, claves que no coinciden con dynamic_permissions_matrix. La matriz que realmente consulta el validador puede permanecer caliente.
- AUD-NG-160 sigue pendiente: un token emitido con un rol anterior puede conservar el claim hasta su expiración, y los cambios de matriz no se propagan de forma inmediata.

## 6. Cierre de sesión en frontend

- js/ui-common.js, SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, handleLogout (líneas 224-238) elimina currentUser/sessionToken de localStorage/sessionStorage y redirige; no invoca logoutUser ni espera confirmación del backend.
- handleSessionExpired (líneas 238-260) también limpia estado local y redirige.
- js/auth.js, SHA 8444dd085a3186106d2db7005b61ef934d3c22d8, no persiste sessionToken, conforme a AUD-NG-001.
- js/api.js, SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, no transmite el token ni invoca handleSessionExpired ante AUTH_PERMISSION_DENIED o sesión revocada.
- AUD-NG-159 se amplía para incluir el cierre local sin revocación remota.

## 7. Errata de C1.72 y reconciliación

- En C1.72 se atribuyó logoutUser/revokeUserSession a AUD-NG-002. Esa asignación duplicaba AUD-NG-159, que ya cubre la revocación arbitraria y se relaciona con TAREA-F4-P0-03.
- Se añade errata al informe AUDITORIA_COMPLETADAS_TAREA-F4-P0-01.md y se corrige Pendientes.md: AUD-NG-002 conserva consultas TASK/EXAM y borradores ACADEMIC; logoutUser/revokeUserSession queda en AUD-NG-159 y la propagación de revocación en AUD-NG-005.
- **AUD-NG-005:** revalidado y ampliado por falta de propagación, ScriptCache local, ausencia de dispatcher verificable y purgeSecurityCaches incorrecto.
- **AUD-NG-159:** revalidado y ampliado por cierre local-only de UI, sin llamada a logoutUser.
- **AUD-NG-160:** revalidado y ampliado por claim role no revalidado, TTL de matriz y claves de purga que no coinciden.
- No se crean nuevos IDs AUD-NG ni TASK en esta revisión.

## 8. Pruebas y límites

Inspección estática/manual de los cinco servicios y los tres archivos frontend; se revisaron verifySessionToken, revokeUserSession, invalidateUserRoleCache, manageAccountState, registerUser(forceUpdate), savePermissionMatrix, getDynamicPermissionsForRole, purgeSecurityCaches, handleLogout, handleSessionExpired y el manejo de errores de fetchApi.

No se ejecutaron peticiones HTTP contra deployments, pruebas reales de revocación, caché caliente/fría, cambios de rol en producción, invalidación interproyecto, consulta de Script Properties ni suites automatizadas. No se afirma el comportamiento de una biblioteca externa que no esté declarada en el repositorio.

## 9. Estado

- Dictamen: **NO CUMPLE**.
- Progreso de la lista maestra: 71/183 identificadores auditados; 112 pendientes.
- TAREA-F4-P0-03 sigue marcada [X] en completadas.md, pero la revocación y actualización inmediata de privilegios no están demostradas.
- Hallazgos revalidados: AUD-NG-005, AUD-NG-159 y AUD-NG-160.
- Corrección documental: la atribución de logoutUser a AUD-NG-002 en C1.72 se corrige; corresponde a AUD-NG-159.
- Código fuente: sin modificaciones.
- Próxima tarea oficial: TAREA-F4-P0-04 - Registrar los intentos fallidos de autenticación y reforzar la protección contra ataques.

================================================================
