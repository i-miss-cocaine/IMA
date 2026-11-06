# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P1-08

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `8dc2ee9d8c25c6b694ddbbba916e438976164840`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**ID operativo de sesión:** `IMA-AUDIT-20261106-1429Z` (inicia y cierra en C1.83; no es un ID nativo de ChatGPT).

**Dictamen: NO CUMPLE**

## 1. Alcance y límite de fuente

`completadas.md` marca TAREA-F4-P1-08 como completada, con severidad Alto y archivos `backend/*/Code.gs`, pero solo conserva título, origen y clasificación. La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no aparece en el árbol actual. Por ello, no se inventan criterios detallados: se contrasta el objetivo declarado con las rutas de propagación, invalidación, revocación y recuperación que el propio código identifica como TAREA-F4-P1-08 y con los hallazgos previos.

Se revisaron los seis archivos de backend: USER, ACADEMIC, ACCOUNTING, TASK, EXAM y DEVELOPER. DEVELOPER se trata como plano de control separado de los cinco servicios funcionales.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques revisados |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | 143-180; 1098-1134; 1351-1620; 1863-1892; 1934-1980; 2276-2386; 2470-2546; 4618-4759. |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | 400-445; 580-669; 3702-3743; router 707. |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | 350-400; 480-570; 10200-10241; router 594. |
| `backend/task-service/Code.gs` | `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe` | 140-190; 280-366; 1919-1959; router 384. |
| `backend/exam-service/Code.gs` | `1d93296628fae31f680004f637897e2b1314a64c` | 125-170; 260-340; 948-987; router 360. |
| `backend/developer-service/Code.gs` | `8aa4bac67cfe5c8c54da51a0784a56fef633e412` | 115-147; doPost 153-210. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | TAREA-F4-P1-08, bloque 1751-1754. |
| `Pendientes.md` | `d1b15640c875940c2cc726c790668428e3bdb716` | AUD-NG-005, AUD-NG-160 y reconciliación con AUD-NG-176/219/221/222. |

## 3. Hallazgos

### AUD-NG-005 — Propagación de estado y revocación entre servicios

<badge color="warning">Alto · P1 · Ampliado</badge>

1. USER enruta `dispatchSecurityEvent`, `processSecurityEventQueue`, `getSecurityEventsQueue` y `purgeSecurityCaches` (1463-1466), pero no se localizaron definiciones de esos handlers en USER. La búsqueda dirigida en los seis archivos backend tampoco encontró definiciones de `dispatchSecurityEvent`, `processSecurityEventQueue` o `getSecurityEventsQueue`; `purgeSecurityCaches` solo está implementada en ACADEMIC, ACCOUNTING, TASK y EXAM.
2. `manageAccountState` persiste el estado en `Usuarios` y registra historial antes de llamar a `dispatchSecurityEvent` (2342-2386; llamada 2373-2379). La referencia no resuelta provoca excepción después de la mutación. El catch de `doPost` responde error (1606-1617), pero no revierte la escritura ni demuestra propagación.
3. `revokeUserSession` (2318-2330) escribe `revoked_user_` y `revoked_session_` solo en ScriptCache USER. No hay publicación/acuse de los demás servicios. `loginUser` escribe el bloqueo automático en la hoja al quinto fallo (2542-2545) sin pasar por un flujo común de propagación.
4. Los purgadores de ACADEMIC, ACCOUNTING, TASK y EXAM eliminan `revoked_session_<id>` (respectivamente 3720, 10218, 1937 y 966), aunque sus validadores consultan esa clave para rechazar la sesión (431, 384, 175 y 157). Una operación etiquetada como `SESSION_REVOKED` puede borrar la marca que debería conservar. Si solo se envía sessionId, tampoco se establece `revoked_user_`.
5. DEVELOPER verifica firma y expiración del token (115-147), pero no comprueba `revoked_user_`, `revoked_session_` ni estado vigente de la cuenta. Tampoco tiene consumidor ni purgador de seguridad, por lo que queda fuera de la propagación.
6. `manageInstitutionalDataCache(FLUSH_GLOBAL)` registra el pedido y devuelve éxito sin eliminar claves (USER 155-180).
7. `registerAndDispatchEvent`/`retryFailedEventsQueue` (4618-4759) son el bus general orientado a notificaciones, no la cola de seguridad ausente. Los defectos de esa cola se mantienen en AUD-NG-176/TASK-474.

**Impacto:** cambios de estado y revocaciones no se aplican uniformemente; una operación puede persistir y reportar error; un purgador remoto puede borrar una marca de revocación. No existe confirmación de todos los consumidores ni recuperación verificable de estados parciales.

**Reconciliación:** se amplía AUD-NG-005 para cubrir handlers ausentes, purgadores contradictorios y DEVELOPER. No se crea un hallazgo duplicado.

### AUD-NG-160 — Vigencia de roles, matriz dinámica y cachés de privilegios

<badge color="warning">Alto · P1 · Ampliado</badge>

1. USER, ACADEMIC, ACCOUNTING, TASK y EXAM consumen la matriz dinámica desde `dynamic_permissions_matrix` (USER 1866; ACADEMIC 589; ACCOUNTING 490; TASK 286; EXAM 263), con TTL de 600 segundos.
2. Los cuatro purgadores remotos eliminan `perm_matrix_<role>` y `dynamic_perms_<role>`, claves que no corresponden a la matriz consumida. La purga por rol no invalida `dynamic_permissions_matrix`.
3. Los validadores de delegaciones consumen `active_delegations_<userId>` (USER 1168; ACADEMIC 627; ACCOUNTING 528; TASK 324; EXAM 301), pero los purgadores eliminan `delegations_<userId>`; la entrada real permanece caliente.
4. `savePermissionMatrix` invalida la matriz solo en USER (1977); `revokeSecurityDelegation` elimina la caché solo en USER (2308). No se encontró invalidación coordinada de las cachés independientes.

**Impacto:** una modificación de matriz o delegación puede continuar autorizando con datos obsoletos hasta que expire el TTL; la respuesta de purga no demuestra que se haya eliminado la clave consumida.

**Reconciliación:** se amplía AUD-NG-160. AUD-NG-219/TASK-498 conserva autoridad y ámbito de delegaciones; AUD-NG-221/TASK-501 conserva dimensiones/editor de matriz; AUD-NG-222/TASK-502 conserva autorización contextual. No se crean IDs duplicados.

## 4. Pruebas y limitaciones

**Ejecutado:** inspección estática/manual de funciones, variables, routers, validadores, claves de caché y purgadores; búsqueda dirigida de referencias/definiciones en los seis archivos backend; cotejo con hallazgos y tareas previas; verificación de SHA.

**No ejecutado:** ejecución de Apps Script, peticiones HTTP interservicio, acceso a ScriptCache/Script Properties reales, cachés calientes/frías, simulación de fallos, reintentos reales, concurrencia, multiusuario, deployments ni suites automatizadas.

No se modificó código fuente. No se afirma que el comportamiento haya sido probado en producción.

## 5. Cierre documental

Se amplían AUD-NG-005 y AUD-NG-160 en `Auditoria.txt` y en sus tareas existentes en `Pendientes.md`; se actualizan `MapaDependencias.md`, `AUDITORIA_COMPLETADAS_PLAN.md` y el checkpoint C1.83 en `Contexto_personal.txt`. No se crean IDs nuevos. `completadas.md`, `ChangesLogs.txt`, `METODOLOGIA_DESARROLLO.md` y el código fuente permanecen intactos.
