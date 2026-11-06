# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P3-01

**Checkpoint:** C1.90  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `9d89ce03c8d39b1100989a5ff1269c2d17be99b8`  
**Tree SHA de partida:** `da798b49fc05d65291e8b83ecd9863f1f726a765`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 152 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; C1.87-C1.90 intermedios; sesión abierta; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE.** Existe una función de generación bajo invocación del endpoint USER, pero no hay programación periódica, persistencia del informe, entrega a responsables ni evidencia de revisión. El conteo de delegaciones vigentes se calcula incorrectamente.

## 1. Alcance y fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1801-1805) marca TAREA-F4-P3-01 como [X], severidad Bajo, archivos USER Code.gs.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1771-1774) afirma que `generatePrivilegeAndAccountAuditReport` realiza análisis automatizado y periódico de cuentas privilegiadas, cuentas inactivas/estancadas con más de 90 días sin iniciar sesión y delegaciones vigentes.

## 2. Evidencia

| Archivo | SHA | Inspección |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | ROLE_PERMISSIONS 940-968; PUBLIC_ACTIONS 922-926; validateRolePermission 1253-1289; getUserVerifiedRole 1146-1159; router 1348-1380/1468; generatePrivilegeAndAccountAuditReport 4372-4440; getSecurityDelegations 1803-1859. |
| `js/developer.js` | `6fa4c4bd9be580c974b1fbede4f0cf79485dc331` | Búsqueda de llamada al reporte. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | Búsqueda de llamada al reporte. |
| `dashboard-direccion.html` | `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` | Búsqueda de llamada al reporte. |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | Búsqueda de llamada al reporte. |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | Búsqueda de activadores temporales. |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | Búsqueda de activadores temporales. |
| `backend/task-service/Code.gs` | `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe` | Búsqueda de activadores temporales. |
| `backend/exam-service/Code.gs` | `1d93296628fae31f680004f637897e2b1314a64c` | Búsqueda de activadores temporales. |
| `backend/developer-service/Code.gs` | `8aa4bac67cfe5c8c54da51a0784a56fef633e412` | Búsqueda de activadores temporales. |
| Tests regression | `3433b707edd4a2f35c68368a3172932adc2a3b32`, `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida; sin casos específicos. |

## 3. Hallazgos

### 3.1. La función no se ejecuta periódicamente ni deja un informe auditable

`generatePrivilegeAndAccountAuditReport` (4372-4440) lee Usuarios, arma arrays y métricas, escribe un evento de log y devuelve un objeto JSON. No crea una hoja/archivo de informe, no envía correo, no registra revisión/decisión de un responsable y no implementa un activador.

No se encontraron `ScriptApp.newTrigger` ni `timeBased()` en los seis microservicios USER, ACADEMIC, ACCOUNTING, TASK, EXAM y DEVELOPER. Tampoco se encontraron llamadas a la función en `js/developer.js`, `js/ui-common.js`, `dashboard-direccion.html` ni `dashboard-secretaria.html`. El router expone el handler, pero solo se ejecuta cuando un cliente autorizado lo invoca.

### 3.2. El conteo de delegaciones vigentes queda en cero

En 4417-4419 se invoca `getSecurityDelegations({ statusFilter: "ACTIVA" })`. El handler `getSecurityDelegations` (1803-1859):
- exige contexto de sesión mediante `getUserVerifiedRole(payload)`;
- obtiene `callerId` desde `payload._verifiedUserId`;
- espera el filtro `estado`, no `statusFilter`.

La llamada interna crea un objeto nuevo sin `sessionToken`, `authToken` ni `_verifiedUserId`; getUserVerifiedRole devuelve NO_ACCESS y callerId queda undefined. Para usuarios ordinarios, el filtro de titular/delegado elimina todas las filas. Resultado: el reporte informa cero delegaciones. Incluso si se preservara el contexto, `statusFilter` sería ignorado y el conteo incluiría estados distintos de Activa.

Se amplía AUD-NG-219, sin duplicar el motor de delegaciones.

### 3.3. La función sí tiene autorización de servidor; no es acción pública

`generatePrivilegeAndAccountAuditReport` no aparece en `PUBLIC_ACTIONS` (922-926). Está incluida en ROLE_PERMISSIONS de Director y queda disponible a Administrador/Desarrollador por wildcard. `doPost` llama a `validateRolePermission` antes del router (1351-1357), y `getUserVerifiedRole` valida el token firmado (1146-1159). No se clasifica como endpoint público ni se afirma una exposición anónima.

### 3.4. No hay pruebas específicas

No se encontraron pruebas para la generación del informe, periodicidad, persistencia/entrega ni el conteo de delegaciones. Se amplía AUD-NG-161 por falta de pruebas conductuales, sin duplicar.

## 4. Reconciliación

- **AUD-NG-219:** consulta interna de delegaciones sin contexto autenticado y con filtro incompatible.
- **AUD-NG-161:** falta de pruebas de periodicidad, persistencia, entrega y datos de reporte.
- **AUD-NG-160:** conserva vigencia de roles/cachés; no se amplía.
- **AUD-NG-220:** conserva semántica de inactividad/anonimización; la fecha de la función usa el campo de último acceso existente.
- **Nuevo AUD-NG-230/TASK-510:** ausencia de ejecución periódica verificable, persistencia/entrega y revisión formal del informe. No duplica los anteriores.

## 5. Pruebas y límites

**Ejecutado:** inspección estática del router, lista de acciones públicas y permisos, función de reporte, función de delegaciones, búsqueda de invocaciones frontend, búsqueda de activadores en seis microservicios y búsqueda dirigida en ambos archivos regression.

**No ejecutado:** Apps Script runtime, instalación de activadores, ejecución programada, entrega por correo, lectura de hojas productivas, verificación de delegaciones reales, ni suites automatizadas. No se modificó código ni pruebas.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 87/183 identificadores auditados; 96 pendientes.
- **Última tarea auditada:** C1.90 / TAREA-F4-P3-01.
- **Siguiente tarea exacta:** TAREA-F4-P3-02 - Optimizar los informes de auditoría y el diagnóstico de incidencias.
- **Archivos documentales previstos para C1.90:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.
