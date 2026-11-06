# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P1-08

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `56367be8c5dfc731931a4f3a2f8317841f0303aa`  
**Árbol de partida:** `0e6d5dd25d30dfeab4f68ce4d4f4a262d367f24c`  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-2335Z` (identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE**

## 1. Alcance y recuperación histórica

La tarea TAREA-F4-P1-08 figura en `completadas.md`, líneas 1749-1753, como completada [X], con título “Implementar un mecanismo central de propagación y recuperación de cambios de seguridad”, severidad Alto y archivos afectados `backend/*/Code.gs`. El registro no aporta criterios de aceptación detallados.

No existe `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P1-08.md` en el árbol del HEAD auditado. La consulta de historial por esa ruta devolvió cero commits en la rama de trabajo, en `main` y en la referencia predeterminada consultada. Tampoco se encontró un commit por los términos F4-P1-08 o “propagación recuperación cambios seguridad”. El documento de origen citado por `completadas.md`, `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md`, tampoco está presente en el árbol actual.

Por tanto, este informe se crea como auditoría propia a partir del objetivo explícito de la tarea, del código vigente y de la evidencia de dependencias conservada en `MapaDependencias.md`, registro C1.83. No se reconstruyen criterios ausentes ni se atribuye al informe inexistente contenido no recuperado. El estado [X] de `completadas.md` se conserva como dato histórico, pero no constituye evidencia de cumplimiento.

## 2. Fuentes y evidencia inspeccionadas

| Archivo | Blob SHA | Alcance inspeccionado |
|---|---|---|
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | TAREA-F4-P1-08, líneas 1749-1753 |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | ROLE_PERMISSIONS/router; doPost 1351-1620; invalidación 143-180; verifySessionToken 1083-1145; savePermissionMatrix 1934-1980; revocación/delegación 2276-2330; manageAccountState 2342-2386; loginUser 2470-2546 |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | verifySessionToken 401-459; router de purgeSecurityCaches 707; purgador 3702-3745 |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | verifySessionToken 354-412; router 594; purgador 10200-10245 |
| `backend/task-service/Code.gs` | `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe` | verifySessionToken 145-202; router 384; purgador 1919-1963 |
| `backend/exam-service/Code.gs` | `1d93296628fae31f680004f637897e2b1314a64c` | verifySessionToken 127-184; router 360; purgador 948-990 |
| `backend/developer-service/Code.gs` | `8aa4bac67cfe5c8c54da51a0784a56fef633e412` | verifySessionToken 115-147; doPost 153-210 |
| `AUDITORIAS/Auditoria.txt` | `284b7a94b51c8ed99dbfcf734694bc5361f9f111` | AUD-NG-005, AUD-NG-160 y AUD-NG-176 |
| `AUDITORIAS/MapaDependencias.md` | `4f68d56f910c6a4e87c20ecac82daeb3a615bcaa` | Registro de dependencias TAREA-F4-P1-08 (C1.83), cachés y motor de eventos |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P1-09.md` | `c579e65e84f7cd274f5416c552479b5f92a4371c` | Reconciliación posterior de AUD-NG-005, AUD-NG-160 y TASK-474 |
| `AUDITORIAS/AUDITORIA_REGLA_REGISTRO_HALLAZGOS_TAREAS_C1.112.md` | `e70acbef40f069a2372fae5e1e2c3f7f3aaa9f48` | Protocolo de registro de hallazgos y tareas dentro del informe |

## 3. Hallazgos y resultados

### 3.1. El servicio USER enruta hacia un mecanismo central que no está implementado

En `backend/user-service/Code.gs`, ROLE_PERMISSIONS enumera `purgeSecurityCaches`, `dispatchSecurityEvent`, `processSecurityEventQueue` y `getSecurityEventsQueue`; el switch de `doPost` también intenta invocar esas cuatro acciones (líneas 1463-1466). Sin embargo, el archivo no contiene definiciones de ninguna de esas funciones. La búsqueda de declaraciones en los seis servicios confirma que tampoco existe una definición de `dispatchSecurityEvent`, `processSecurityEventQueue` o `getSecurityEventsQueue` en otro microservicio.

La función `manageAccountState` persiste el nuevo estado de la cuenta y registra el cambio de entidad; después invoca `dispatchSecurityEvent` (2342-2386). Como el handler no está definido, la llamada no puede completar el despacho. El error se propaga al catch de `doPost`; la escritura previa en la hoja Usuarios no se revierte. El resultado puede ser una respuesta de error pese a que el estado ya cambió, sin evento durable que permita recuperar la propagación.

**Impacto:** el componente central anunciado por la tarea no existe como flujo ejecutable; las operaciones que dependen de él pueden quedar parcialmente aplicadas y sin recuperación demostrable.

**Registro existente relacionado:** AUD-NG-005. Se amplía su evidencia; no se crea un hallazgo duplicado.

### 3.2. Los cambios de cuenta y revocaciones no producen propagación coordinada

- `revokeUserSession` (USER 2318-2330) escribe `revoked_session_<sessionId>` y/o `revoked_user_<userId>` únicamente en el ScriptCache del proyecto USER. No emite un evento de seguridad ni confirma invalidación en los demás proyectos Apps Script.
- `loginUser` (USER 2470-2546) cambia directamente Usuarios!K a `Bloqueada` al quinto intento fallido. No pasa por `manageAccountState`, no invalida las cachés y no despacha un evento.
- `manageAccountState` cambia la hoja antes de invocar el dispatcher inexistente. No hay outbox de seguridad ni estado de propagación recuperable que vincule la escritura con los consumidores.
- `invalidateUserRoleCache` (USER 143-153) elimina `user_role_<userId>` y `acct_state_<userId> únicamente en la caché local. `manageInstitutionalDataCache` (155-180) informa éxito sin comprobar el resultado de invalidación; `FLUSH_GLOBAL` solo registra la solicitud y no ejecuta una purga global.
- Los validadores de USER, ACADEMIC, ACCOUNTING, TASK y EXAM consultan sus propias cachés de proyecto para `revoked_user_<userId>`, `revoked_session_<sessionId>` y `acct_state_<userId>`. La coincidencia de nombres no convierte los ScriptCache independientes en una caché compartida.

**Impacto:** suspensiones, bloqueos y revocaciones pueden surtir efecto en USER y permanecer obsoletos en otros servicios. No existe confirmación de entrega, detección de consumidores pendientes ni recuperación verificable.

**Registro existente relacionado:** AUD-NG-005 (revocación de cuenta y coherencia entre servicios).

### 3.3. Los cuatro purgadores locales pueden borrar una revocación y no invalidan las claves consumidas

Se localizaron definiciones y rutas locales de `purgeSecurityCaches` en ACADEMIC (3702-3745; router 707), ACCOUNTING (10200-10245; router 594), TASK (1919-1963; router 384) y EXAM (948-990; router 360). USER declara la acción en su router, pero no tiene una definición local.

Los cuatro purgadores comparten estos defectos:

1. Cuando reciben `sessionId`, ejecutan `cache.remove("revoked_session_" + sessionId)`. El validador consulta esa misma clave para rechazar la sesión. El purgador elimina la marca de revocación en vez de establecerla o conservarla.
2. Para un evento `SESSION_REVOKED` sin `accountState`, no se establece `revoked_user_<userId>`; la rama que escribe esa marca solo se ejecuta si el tipo es `SESSION_REVOKED` o `ACCOUNT_STATE_CHANGED` y el estado recibido no es `Activa`.
3. Intentan invalidar `delegations_<userId>`, pero los validadores consultan `active_delegations_<userId>. La invalidación no alcanza la clave de consumo.
4. Intentan invalidar `perm_matrix_<role>` y `dynamic_perms_<role>`, pero la matriz dinámica observada por los validadores se consulta bajo `dynamic_permissions_matrix`. La purga por rol no coincide con la clave consumida.
5. Aunque eliminan `acct_state_<userId>`, no hay una señal durable que obligue a todos los servicios a releer el estado ni un acuse de que cada caché fue actualizada.

**Impacto:** una solicitud de purga puede dejar intactas cachés obsoletas y, en el caso de una sesión, borrar precisamente el marcador que impedía reutilizar el token revocado. El retorno `status: success` de cada handler solo acredita que la función local terminó, no que la política de seguridad se haya propagado correctamente.

**Registro existente relacionado:** AUD-NG-005 para revocación; AUD-NG-160 para vigencia de permisos y cachés. La dimensión de delegaciones se mantiene en AUD-NG-219/TASK-498.

### 3.4. DEVELOPER queda fuera de la verificación de revocación y estado de cuenta

En `backend/developer-service/Code.gs`, `verifySessionToken` (115-147) comprueba firma HMAC y expiración, y devuelve los claims. No consulta `revoked_user_<userId>, `revoked_session_<sessionId> ni el estado vigente de la cuenta. El archivo tampoco define `purgeSecurityCaches`, dispatcher o consumidor de eventos de seguridad. Su `doPost` (153-210) autoriza según el rol contenido en el token y la tabla local ROLE_PERMISSIONS.

Por tanto, incluso si USER propaga correctamente una revocación a los cuatro servicios funcionales, DEVELOPER no tiene el mismo control de revocación. Un token firmado aún vigente puede conservar acceso al plano de control hasta su expiración, salvo que otra capa externa no visible en este repositorio lo impida. Esa eventual capa externa no se presume ni se da por demostrada.

**Impacto:** la cobertura de seguridad no es uniforme entre servicios y el plano de control puede aceptar credenciales que los otros validadores rechazarían.

**Registro existente relacionado:** AUD-NG-005 para estado/revocación interservicio y AUD-NG-160 para vigencia de rol. Se amplían los alcances existentes; no se crea un ID nuevo.

### 3.5. Los cambios de matriz y rol tampoco invalidan de forma coherente los permisos en todos los servicios

`generateSessionToken` (USER) incorpora el rol en claims y una expiración de 24 horas. Los validadores funcionales verifican la firma, expiración, marcadores de revocación y estado de cuenta, pero no comparan el rol firmado con el rol vigente ni con una versión actual de permisos. En consecuencia, una degradación de rol puede dejar permisos antiguos en un token ya emitido.

`savePermissionMatrix` (USER 1934-1980) elimina `dynamic_permissions_matrix solo en el ScriptCache USER. No se observa un mecanismo de invalidación coordinada en ACADEMIC, ACCOUNTING, TASK y EXAM. Los purgadores locales no resuelven la brecha porque eliminan claves distintas a la consumida por la matriz dinámica.

**Impacto:** un cambio de rol o de regla puede tardar en reflejarse fuera de USER, mientras los tokens anteriores continúan firmados con el rol previo. No hay versión de seguridad común ni confirmación de convergencia.

**Registro existente relacionado:** AUD-NG-160 (los tokens conservan el rol antiguo después de un cambio de privilegios). AUD-NG-221/TASK-501 conserva la matriz dinámica como modelo de administración y AUD-NG-222/TASK-502 conserva la autorización contextual; no se duplican esos objetivos.

## 4. Reconciliación y límites entre tareas

- **AUD-NG-005:** se amplía con la ausencia del dispatcher central, la falta de propagación/recuperación, la revocación local, el bloqueo automático sin evento, el purgador que borra marcas y la exclusión de DEVELOPER.
- **AUD-NG-160:** se amplía con la falta de versión vigente de rol/permisos, invalidación parcial de la matriz y claves de caché incompatibles.
- **AUD-NG-176/TASK-474:** conserva el motor general de eventos/notificaciones (outbox, reserva idempotente, productores, recuperación y pruebas). No equivale al mecanismo de seguridad: no establece el significado de revocación, el fan-out de cachés de autenticación ni la validación de marcadores en cada servicio. La futura solución de seguridad puede reutilizar infraestructura genérica de entrega de TASK-474, pero no debe duplicar su motor ni trasladarle la responsabilidad de autorización.
- **AUD-NG-219/TASK-498:** conserva autoridad, ámbito y ciclo de vida de delegaciones. Este informe solo señala que los purgadores usan un nombre de clave distinto al que consumen los validadores.
- **AUD-NG-221/TASK-501** y **AUD-NG-222/TASK-502:** conservan respectivamente la matriz dinámica y la política contextual; el presente alcance es la propagación de cambios y la vigencia efectiva de esos permisos entre servicios.
- No se crean IDs AUD-NG/TASK nuevos: las causas están cubiertas por AUD-NG-005 y AUD-NG-160. Este informe desarrolla las tareas existentes con el protocolo C1.112.

## 5. Dictamen

**NO CUMPLE.** El repositorio contiene cuatro purgadores locales, validadores de sesión distribuidos y referencias a un dispatcher central, pero no implementa el mecanismo central de eventos de seguridad ni su cola de recuperación. USER invoca funciones no definidas; las revocaciones no se confirman en todos los servicios; los purgadores pueden borrar marcas de sesión y utilizan claves incompatibles; DEVELOPER no participa en la verificación de revocación; y los cambios de rol/matriz no se invalidan de forma coherente.

La tarea no puede considerarse funcionalmente completada por la presencia de nombres, rutas de router o handlers parciales. Se conserva el estado histórico [X] de `completadas.md`, sin convertirlo en evidencia.

## 6. Pruebas y limitaciones

**Ejecutado:** inspección estática/manual de las funciones, declaraciones, referencias, rutas de router, claves de caché y validadores en los seis servicios; cotejo de los SHAs de cada archivo; consulta del historial Git de la ruta del informe; contraste con AUD-NG-005, AUD-NG-160, AUD-NG-176/TASK-474 y el registro de dependencias C1.83.

**No ejecutado:** ejecución de Apps Script, llamadas HTTP, acceso a ScriptCache de proyectos desplegados, cambios de estado reales, revocación multi-servicio, concurrencia, pérdida de conectividad, reintentos, recuperación de cola, pruebas con reloj controlado, validación del despliegue DEVELOPER ni pruebas automatizadas. No se afirma explotación productiva ni se presume configuración externa no visible.

**Código y pruebas:** sin modificaciones. La auditoría no implementa ni corrige las brechas.

## 7. Archivos y límites de cierre

- Nuevo: `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P1-08.md`.
- Actualizado: `AUDITORIAS/Contexto_personal.txt`.
- No se modifica `completadas.md, por lo que se conserva su estado histórico [X].
- No se modifica `Pendientes.md; las tareas quedan desarrolladas dentro de este informe, según la regla C1.112.
- No se modifica `Auditoria.txt ni `MapaDependencias.md): AUD-NG-005/AUD-NG-160 ya están registrados y el mapa ya conserva el análisis de dependencias C1.83; este informe amplía y formaliza sus tareas sin crear registros duplicados.
- No se modifica código fuente, pruebas, `ChangesLogs.txt, metodología, datos productivos ni rama base.

## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-005] Restablecer la propagación central, revocación y recuperación de cambios de estado de seguridad

- **Hallazgo de origen:** AUD-NG-005, secciones 3.1 a 3.4 de este informe. El dispatcher de seguridad está declarado en el router USER pero no tiene definición; las operaciones de cuenta/revocación no completan una propagación coordinada; los purgadores locales pueden eliminar marcas de revocación y DEVELOPER no valida el estado de cuenta ni participa en el mecanismo.
- **Severidad:** Alto (P1), conservando la clasificación histórica del hallazgo.
- **Objetivo:** garantizar que cada cambio de estado de cuenta o revocación de sesión se registre de forma durable, se propague a todos los servicios que aceptan sesiones y pueda recuperarse ante fallos parciales sin reactivar credenciales revocadas.
- **Acción ejecutable:**
  1. Definir un contrato versionado de evento de seguridad con eventId estable, eventType, usuario/sesión objetivo, estado deseado, actor autenticado, servicio emisor autenticado, fecha, versión de seguridad y correlación. Validar esquema, origen y autorización en servidor.
  2. Implementar las funciones centrales faltantes dispatchSecurityEvent, processSecurityEventQueue y getSecurityEventsQueue en USER, con estados explícitos, registro durable/outbox, reserva idempotente, acuse por consumidor, máximo de intentos, nextAttemptAt, backoff, detección de eventos atascados y recuperación/replay controlado.
  3. Reutilizar la infraestructura genérica de entrega/outbox que se resuelva en TASK-474 cuando corresponda, sin duplicar su motor de notificaciones ni asumir que una notificación equivale a una revocación de seguridad.
  4. Integrar el registro del evento con manageAccountState y revokeUserSession para que el cambio de estado y la obligación durable de propagarlo formen una operación lógica recuperable. No responder éxito si no se ha persistido el evento; definir reconciliación para fallos entre escritura institucional y entrega.
  5. Integrar el bloqueo automático de loginUser (quinto intento) al mismo flujo, evitando una ruta paralela que cambie Usuarios!K sin invalidar estado ni producir evento.
  6. Corregir los cuatro purgadores locales: una revocación debe establecer o conservar revoked_session_<sessionId>, nunca eliminarla; una reactivación debe retirar solo la marca de usuario correspondiente después de validar el estado vigente. Aplicar exactamente las claves que consumen los validadores y distinguir INVALIDATE_CACHE de REVOKE_SESSION.
  7. Propagar y confirmar el evento en USER, ACADEMIC, ACCOUNTING, TASK, EXAM y DEVELOPER. Incorporar en DEVELOPER verificación de estado de cuenta y marcadores de revocación, o documentar y aplicar un control equivalente explícito del plano de control.
  8. Hacer que manageInstitutionalDataCache devuelva resultados por servicio y falle de forma explícita ante invalidación parcial; FLUSH_GLOBAL debe ejecutar una operación real y verificable o responder que no está soportada, nunca success por solo registrar la solicitud.
  9. Incorporar un reconciliador que compare el estado institucional vigente con el estado de revocación aplicado por cada servicio; permitir reintentos seguros, alertar divergencias y preservar evidencia de quién solicitó, aplicó y confirmó cada cambio.
  10. Crear pruebas aisladas para revocación de sesión/usuario, suspensión, bloqueo, desactivación, reactivación, duplicados, eventos fuera de orden, consumidor caído, fallo parcial, recuperación, expiración, idempotencia y convergencia de los seis servicios. No ejecutar suites contra hojas ni colas productivas.
- **Archivos/módulos afectados:** backend/user-service/Code.gs (doPost, manageAccountState, revokeUserSession, loginUser, dispatchSecurityEvent, processSecurityEventQueue, getSecurityEventsQueue, invalidateUserRoleCache, manageInstitutionalDataCache); backend/academic-service/Code.gs; backend/accounting-service/Code.gs; backend/task-service/Code.gs; backend/exam-service/Code.gs; backend/developer-service/Code.gs; configuración y pruebas aisladas de integración de seguridad.
- **Dependencias y riesgos:** TASK-474/AUD-NG-176 para infraestructura genérica de outbox/entrega, sin duplicar notificaciones; AUD-NG-005 para estado y revocación; AUD-NG-160 para vigencia de rol; AUD-NG-145 para trazabilidad y sanitización; AUD-NG-083 para autenticación interservicio; AUD-NG-161 para pruebas conductuales; AUD-NG-219/TASK-498 para ciclo de vida de delegaciones. Riesgos: revocación borrada por purga incorrecta, eventos duplicados o fuera de orden, éxito parcial, reactivación prematura, emisores falsificados, expiración de marcadores y servicios desconectados.
- **Alcance:** propagación y recuperación de cambios de estado de cuenta y revocación de sesión, con confirmación por servicio y control de coherencia de cachés de autenticación. No incluye el motor general de notificaciones, la administración de delegaciones ni la definición de la matriz de permisos.
- **Criterios de aceptación:**
  1. Las tres funciones centrales existen, están conectadas al router y tienen contratos validados; ninguna acción registrada apunta a un handler indefinido.
  2. Cada cambio de cuenta/revocación genera un evento durable e idempotente antes de reportar éxito; una caída posterior puede recuperarse sin perder el evento.
  3. El bloqueo automático del quinto intento produce la misma propagación que una suspensión administrativa.
  4. Ningún purgador elimina revoked_session para un evento de revocación; una prueba demuestra que el token revocado sigue rechazado en cada servicio.
  5. Las claves invalidada(s) coinciden exactamente con las leídas por validadores y consumidores; no quedan alias incompatibles sin migración.
  6. USER, ACADEMIC, ACCOUNTING, TASK, EXAM y DEVELOPER confirman la aplicación del cambio o quedan identificados como pendientes/degradados; no se declara convergencia total con confirmaciones faltantes.
  7. DEVELOPER rechaza una cuenta/sesión revocada o aplica un mecanismo equivalente documentado y probado.
  8. La cola admite reintentos limitados, backoff, reserva exclusiva, deduplicación, recuperación de atascos y replay autorizado; los eventos fallidos no se marcan procesados.
  9. La reconciliación detecta divergencias entre el estado institucional y el estado aplicado por servicio, y puede corregirlas sin reactivar accesos revocados.
  10. Pruebas automatizadas aisladas cubren escenarios positivos, negativos, fallos parciales, concurrencia, reintentos, orden, idempotencia y recuperación sin tocar datos productivos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Registrar SHAs de implementación, contratos versionados, pruebas aisladas, evidencia de acuse por servicio y resultado de reconciliación antes de cambiar el estado.

### [AUD-NG-160] Hacer efectiva y uniforme la vigencia de roles y permisos ante cambios institucionales

- **Hallazgo de origen:** AUD-NG-160, sección 3.5 de este informe. Los tokens incluyen un rol con vigencia de 24 horas y los validadores no lo comparan con el rol/versión vigente; savePermissionMatrix invalida solo USER y los purgadores locales usan claves que no coinciden con la matriz consumida.
- **Severidad:** Alto (P1), conservando la clasificación histórica del hallazgo.
- **Objetivo:** impedir que un token conserve privilegios antiguos después de una degradación de rol o modificación de permisos y asegurar que todos los servicios apliquen la misma versión efectiva de seguridad.
- **Acción ejecutable:**
  1. Definir una versión monotónica de seguridad por usuario y una versión de matriz/política por ámbito o rol, con fuente de verdad institucional y reglas de incremento ante cada cambio relevante.
  2. Incorporar los identificadores de versión pertinentes en los claims emitidos por generateSessionToken y comprobarlos en cada validación. Una versión obsoleta debe provocar rechazo o revalidación segura del rol vigente; no debe confiarse únicamente en el rol firmado al emitir el token.
  3. Integrar savePermissionMatrix y las operaciones reales de cambio de rol con el evento de seguridad definido en AUD-NG-005, incluyendo invalidación de permisos en todos los servicios consumidores.
  4. Normalizar las claves de caché: los escritores, invalidadores y lectores deben compartir nombres, granularidad, ámbito y TTL. Sustituir las claves por rol que no consumen los validadores o migrar los validadores a un contrato versionado coherente.
  5. Hacer que la autorización consulte una versión vigente o un mecanismo equivalente de invalidación inmediata, con comportamiento fail-closed cuando no pueda comprobarse la versión y sin recurrir silenciosamente a permisos estáticos obsoletos.
  6. Mantener separadas la matriz de permisos (AUD-NG-221/TASK-501), la evaluación contextual (AUD-NG-222/TASK-502) y el ciclo de vida de delegaciones (AUD-NG-219/TASK-498); consumir sus resultados vigentes sin reimplementar sus modelos.
  7. Añadir pruebas para degradación/promoción de rol, cambio de matriz, token anterior, token nuevo, caché caliente/fría, servicio fuera de línea, propagación parcial y recuperación de versión.
- **Archivos/módulos afectados:** backend/user-service/Code.gs (generateSessionToken, verifySessionToken, savePermissionMatrix y operaciones de cambio de rol); backend/academic-service/Code.gs; backend/accounting-service/Code.gs; backend/task-service/Code.gs; backend/exam-service/Code.gs; backend/developer-service/Code.gs; contratos de caché y pruebas aisladas de autorización.
- **Dependencias y riesgos:** AUD-NG-005 para distribución y confirmación de eventos; AUD-NG-221/TASK-501 para administración de la matriz; AUD-NG-222/TASK-502 para autorización contextual; AUD-NG-219/TASK-498 para delegaciones; AUD-NG-145 para trazabilidad; AUD-NG-161 para pruebas conductuales. Riesgos: invalidación incompleta, versiones divergentes, revocación accidental de sesiones válidas, fallback a permisos estáticos y desalineación entre claims y datos institucionales.
- **Alcance:** vigencia de rol y matriz dinámica en tokens, validadores y cachés de los servicios. No redefine las reglas de negocio de la matriz, ABAC ni delegaciones; exige que los cambios de esos modelos se propaguen y sean efectivos.
- **Criterios de aceptación:**
  1. Cada token contiene una versión verificable de seguridad y no conserva privilegios tras una degradación confirmada.
  2. Cada servicio compara o revalida la versión vigente antes de autorizar; no basta con verificar firma y expiración.
  3. Un cambio de matriz incrementa su versión y se refleja en todos los servicios participantes sin esperar al TTL anterior.
  4. Las claves de caché utilizadas para leer e invalidar permisos coinciden exactamente y están documentadas con ámbito/TTL.
  5. Ante falta de fuente de versión o inconsistencia no se concede acceso usando una matriz estática obsoleta.
  6. La promoción de rol solo concede permisos después de validar la nueva asignación vigente; la degradación los retira antes de confirmar convergencia.
  7. La integración reutiliza AUD-NG-005 para distribución, sin duplicar la cola general de TASK-474 ni los modelos de AUD-NG-221/222/219.
  8. Pruebas aisladas demuestran rechazo de tokens obsoletos, convergencia multi-servicio, comportamiento ante cachés calientes/frías y recuperación tras fallos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Registrar SHAs de implementación, evidencia de versiones antes/después, resultados de pruebas multi-servicio y pruebas negativas de tokens obsoletos.

