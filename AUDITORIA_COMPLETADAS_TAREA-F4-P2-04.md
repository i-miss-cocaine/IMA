# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P2-04

**Checkpoint:** C1.88  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `05987b81b1361d8605829b90dab0b3f5014f17e3`  
**Tree SHA de partida:** `427f03e570c6a0b2d0d778027442d286dbfb8a74`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 150 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; C1.87 y C1.88 intermedios; sesión abierta; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE.** El cambio log declara locks para cuatro operaciones de USER, pero el código actual solo adquiere LockService en dos de ellas. Además, hay rutas de delegación que modifican el mismo registro sin coordinarse con ese lock, y updateUserProfile hace una escritura de fila completa sin exclusión mutua.

## 1. Alcance y fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1785-1789) marca TAREA-F4-P2-04 como [X], severidad Medio, backend/*/Code.gs. No contiene criterios detallados.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1759-1761) declara que `createSecurityDelegation`, `revokeSecurityDelegation`, `updateUserProfile` y `manageAccountState` usan `LockService.getScriptLock()`, espera de 10.000 ms y `try...finally { lock.releaseLock(); }`.

La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no está en el árbol; el contraste se limita a la declaración del changelog y a la implementación actual.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | generateInstitutionalId 1706-1743; createSecurityDelegation 1746-1801; getSecurityDelegations 1803-1859; revokeSecurityDelegation 2276-2314; manageAccountState 2342-2386; registerUser 2393-2452; updateUserProfile 2654-2695; recordEntityChangeLog 2714-2745. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de las cuatro operaciones y pruebas de LockService. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida; sin casos coincidentes. |
| `Pendientes.md` | `83e885f4b8f860aba200ed5ae739b794c7c02dc8` | AUD-NG-161, AUD-NG-218, AUD-NG-219 y TASK-118. |

## 3. Contraste de las cuatro funciones declaradas

| Función | Lock en código | Resultado |
|---|---|---|
| createSecurityDelegation | Sí, waitLock(10000), finally releaseLock (1761-1798). | Tiene lock, pero llama a generateInstitutionalId dentro del lock; el generador intenta adquirir ScriptLock de nuevo. Requiere prueba runtime para determinar efecto. |
| revokeSecurityDelegation | No. | Lee, valida y escribe Revocada sin lock (2276-2314). |
| updateUserProfile | No. | Lee fila, modifica copia y escribe fila completa con setValues sin lock (2654-2695). |
| manageAccountState | Sí, waitLock(10000), finally releaseLock (2349-2386). | Tiene lock, pero dentro llama a recordEntityChangeLog, que llama a generateInstitutionalId y vuelve a adquirir ScriptLock. Requiere prueba runtime. |

Por tanto, la afirmación del changelog de que las cuatro funciones están protegidas no coincide con el código: solo dos muestran adquisición explícita.

## 4. Hallazgos y reconciliación

### 4.1. Pérdida de actualizaciones concurrentes de perfil (nuevo AUD-NG-229 / TASK-509)

`updateUserProfile` (2654-2695) lee la fila completa de Usuarios, actualiza campos en una copia y reescribe toda la fila sin lock ni versión. Dos peticiones concurrentes pueden leer la misma versión inicial y la última escritura sobrescribir campos actualizados por la primera.

Se crea AUD-NG-229/TASK-509 para este alcance específico.

### 4.2. Revocación y expiración de delegaciones sin coordinación mutua (AUD-NG-219)

`revokeSecurityDelegation` (2276-2314) no adquiere lock para leer/validar/escribir. `getSecurityDelegations` (1803-1859) cambia Activa a Expirada con setValue durante una consulta y tampoco adquiere lock. Ambas rutas pueden competir entre sí y no se coordinan con el lock de `createSecurityDelegation`.

Se amplía AUD-NG-219/TASK-498; no se crea ID duplicado.

### 4.3. Inicialización y adquisición anidada del generador (TASK-118)

`generateInstitutionalId` (1706-1743) crea la hoja `SecuenciasIDs` y escribe encabezados antes de adquirir ScriptLock, dejando sin protección la inicialización inicial.

`createSecurityDelegation` mantiene ScriptLock y llama al generador, que también adquiere ScriptLock. `manageAccountState` mantiene ScriptLock y llama a `recordEntityChangeLog`, que a su vez llama al generador. Esto plantea una posible adquisición anidada del mismo recurso; no se afirma que haya timeout reproducido porque no se ejecutó Apps Script runtime. Debe resolverse el contrato de lock (por ejemplo, operación interna que no reacquiera) y probarse.

`registerUser` mantiene la comprobación de email y el append fuera de una sección crítica única; ya está documentado en TASK-118/C1.40 y no se duplica.

### 4.4. Contador de intentos y pruebas de concurrencia (AUD-NG-218 / AUD-NG-161)

El contador de login sin lock permanece bajo AUD-NG-218. La búsqueda dirigida no encontró pruebas para las cuatro funciones de esta tarea en los dos archivos regression inspeccionados. La suite académica contiene asserts de locks de otras operaciones; la suite modular no aporta casos de estas funciones. AUD-NG-161 ya cubre reemplazar las pruebas nominales por concurrencia conductual real.

## 5. Límites de verificación

**Ejecutado:** inspección estática/manual de locks, bloques try/finally, lecturas/escrituras de hojas, llamadas anidadas al generador y búsqueda dirigida en pruebas; cotejo con Pendientes.md y ChangesLogs.txt.

**No ejecutado:** Apps Script runtime, ejecuciones concurrentes reales, pruebas de reentrada/timeout de LockService, fallos de SpreadsheetApp, colisiones de creación inicial de SecuenciasIDs, carreras de revocación/expiración, dos actualizaciones paralelas de perfil ni suites automatizadas. No se modificó código ni pruebas.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 85/183 identificadores auditados; 98 pendientes.
- **Última tarea auditada:** C1.88 / TAREA-F4-P2-04.
- **Siguiente tarea exacta:** TAREA-F4-P2-05 - Consolidar la documentación institucional de privacidad y tratamiento de datos.
- **Archivos documentales previstos para C1.88:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.
