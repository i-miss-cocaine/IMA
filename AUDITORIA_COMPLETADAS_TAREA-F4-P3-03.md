# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P3-03

**Checkpoint:** C1.92  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `bf8b6dcf5377e3ea86eb5e63a9c601c9c82b316b`  
**Tree SHA de partida:** `35f575ed77376c5d1b580e272f745f30abf60551`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 154 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; C1.87-C1.92 intermedios; sesión abierta).

**Dictamen: NO CUMPLE.** El escáner tiene modo diagnóstico por defecto y está protegido por permisos de servidor, pero el modo autoFix no es fail-safe: puede revocar/desactivar todos los registros activos si la hoja Usuarios falta o está vacía, y cualquier valor truthy activa las mutaciones. Las correcciones no están serializadas ni registradas por registro.

## 1. Alcance y fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1813-1817) marca TAREA-F4-P3-03 como [X], severidad Bajo, archivo USER Code.gs.

`ChangesLogs.txt` describe detección de inconsistencias referenciales, delegaciones huérfanas y adscripciones obsoletas, con auto-reconciliación supuestamente segura mediante `autoFix: true`.

La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no está en el árbol.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | ROLE_PERMISSIONS 940-970; validateRolePermission 1253-1289; router 1351-1385 y acción 1470; manageDepartmentPositions 2800-2890; getUserInstitutionalAffiliations 2893-2925; create/get/revoke delegation 1746-1860/2276-2315; auditAndReconcileIdentityInconsistencies 4151-4235. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de reconciliación/autoFix. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida de reconciliación/autoFix. |

## 3. Hallazgos

### 3.1. AutoFix puede ejecutar una revocación/desactivación masiva ante una fuente maestra ausente o vacía (AUD-NG-231)

La función establece `usersData = usersSheet ? usersSheet.getDataRange().getValues() : []`. Si Usuarios no existe o solo contiene encabezados, `validUserIds` queda vacío. No hay validación de esquema ni abort por fuente maestra no disponible.

Con `autoFix` truthy, cada fila activa de DelegacionesSeguridad cuyo delegante/delegado no aparezca en el set se cambia a Revocada; cada adscripción activa con userId no encontrado se cambia a Inactiva (4151-4220). Por tanto, si Usuarios falta/está vacía y las otras hojas sí contienen datos, todas las delegaciones y adscripciones activas se tratan como huérfanas.

Además, el código usa `if (autoFix)`, no `autoFix === true`; el string JSON `"false"` es truthy y activa las escrituras. El endpoint está protegido por validateRolePermission para Director y wildcard de Administrador/Desarrollador; el riesgo no depende de acceso anónimo, sino de una ejecución administrativa mal formada o de una lectura incompleta de la fuente maestra.

### 3.2. Las correcciones no son atómicas ni trazables por registro

La función no adquiere LockService. Lee snapshots de Usuarios, DelegacionesSeguridad e HistorialAdscripciones y luego escribe estados por fila. Una creación/revocación/asignación concurrente puede cambiar el estado entre lectura y escritura.

No hay prevalidación de todos los candidatos ni rollback. Si una escritura posterior falla, las anteriores pueden haber quedado aplicadas sin resultado completo. El único log persistente es un evento resumen con issuesCount/fixedCount/autoFix; no incluye IDs, estado anterior/nuevo, actor y motivo por cada corrección. No se llama a recordEntityChangeLog por fila.

### 3.3. La revocación directa no invalida caché y omite la ruta de dominio (AUD-NG-219)

Para delegaciones huérfanas, el código escribe directamente `DelegacionesSeguridad!H = "Revocada"`. A diferencia de `revokeSecurityDelegation`, no elimina `active_delegations_<delegadoId>`. Si la autorización se encuentra cacheada, el permiso delegado puede persistir hasta que expire la entrada. Tampoco usa la ruta de revocación que registra actor/motivo.

Se amplía AUD-NG-219, sin duplicar el motor de delegaciones.

### 3.4. La detección de adscripciones es parcial

La función solo comprueba que el userId exista en Usuarios. No verifica que deptId y cargoId existan o estén activos en CatalogoDepartamentos/CatalogoCargos, aunque el escritor de adscripciones guarda esos IDs (USER 2848-2887). Tampoco valida el estado del usuario, duplicados ni otras referencias persona-cuenta. La descripción de reconciliación es más amplia que el alcance implementado.

### 3.5. No hay pruebas específicas

No se encontraron pruebas de autoFix, ausencia/vacío de Usuarios, valores truthy, fallos parciales, concurrencia, invalidación de caché ni auditoría por registro en los dos archivos tests/regression. Se amplía AUD-NG-161.

## 4. Reconciliación

- **Nuevo AUD-NG-231/TASK-511:** precondiciones fail-safe, booleano estricto, atomicidad, trazabilidad y caché del autoFix.
- **AUD-NG-219:** revocación de delegación por ruta directa sin invalidación de caché.
- **AUD-NG-161:** ausencia de pruebas conductuales de reconciliación.
- **AUD-NG-229:** conserva actualización concurrente de perfiles; no se duplica.
- **AUD-NG-005:** conserva propagación de estado de cuenta; no se duplica.

## 5. Pruebas y límites

**Ejecutado:** inspección estática de fuente maestra, condición autoFix, filas y columnas de ambas tablas, ruta de permisos, escrituras directas, invalidación de caché en funciones de dominio y búsqueda dirigida en tests.

**No ejecutado:** Apps Script runtime, ausencia real de hoja Usuarios, lectura productiva, ejecución autoFix, concurrencia, fallos parciales, caché real, ni suites automatizadas. No se modificó código ni pruebas.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 89/183 identificadores auditados; 94 pendientes.
- **Última tarea auditada:** C1.92 / TAREA-F4-P3-03.
- **Siguiente tarea exacta:** TAREA-F5-001 - Corregir la conversión de aspirantes y garantizar la integridad del expediente.
- **Archivos documentales previstos para C1.92:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.
