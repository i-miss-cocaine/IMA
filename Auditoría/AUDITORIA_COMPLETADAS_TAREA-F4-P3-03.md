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

## 7. Tareas ejecutables derivadas de los hallazgos

### Tarea nueva — AUD-NG-231 / TASK-511
- **Referencia:** hallazgo 3.1 y 3.2; autoFix destructivo ante fuente maestra ausente/vacía, coerción truthy, escrituras no serializadas y ausencia de trazabilidad por registro.
- **Severidad/prioridad:** ALTO / P1.
- **Objetivo:** hacer que la reconciliación sea fail-safe, explícita, serializada, recuperable y auditable; ninguna anomalía de disponibilidad o integridad de la fuente maestra debe producir revocaciones/desactivaciones masivas.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`, función `auditAndReconcileIdentityInconsistencies`; contratos del endpoint/router; bitácora de cambios de entidades y pruebas aisladas.
- **Dependencias:** esquema canónico de `Usuarios`, `DelegacionesSeguridad` y `HistorialAdscripciones`; servicio de IDs; LockService; mecanismo de bitácora/auditoría; AUD-NG-219 para revocación de delegaciones.
- **Acciones ejecutables:**
  1. Validar antes de comparar que `Usuarios` exista, sea legible, tenga encabezados/esquema esperado y una fuente maestra válida. Diferenciar explícitamente hoja ausente, error de lectura, esquema inválido y conjunto legítimamente vacío. Ante ausencia, error, esquema inválido o fuente no confirmada, abortar sin mutaciones y devolver diagnóstico no ambiguo.
  2. Hacer que el modo de corrección sea opt-in estricto: solo el booleano literal `true` habilita cambios; `"false"`, `1`, objetos, valores truthy o campos omitidos nunca deben activar autoFix. El modo predeterminado debe ser diagnóstico sin escrituras.
  3. Adquirir un lock antes de releer fuentes y candidatos; volver a validar dentro de la sección crítica las referencias y estados actuales para evitar decisiones basadas en snapshots obsoletos. Liberar el lock en `finally`.
  4. Prevalidar el lote completo antes de mutar. Definir una estrategia de aplicación recuperable para Google Sheets (escritura por lotes cuando proceda, registro durable de operación y compensación/rollback ante fallo); no informar éxito parcial como corrección completa.
  5. Para cada cambio persistir identificador de entidad, tipo, hoja/fila o clave estable, estado anterior/nuevo, actor autenticado, motivo/regla, fecha, correlación y resultado. Evitar incluir secretos o PII innecesaria. El resumen agregado no sustituye la trazabilidad individual.
  6. Verificar después de escribir que cada registro conserva su identidad y alcanzó el estado esperado; reflejar por separado detectados, propuestos, aplicados, fallidos y revertidos.
  7. Incorporar comprobaciones de integridad referencial para los identificadores de usuario y, coordinadamente con la tarea de adscripciones, para departamento/cargo y su estado. No desactivar automáticamente referencias dudosas.
- **Alcance explícito:** corrección del motor de reconciliación y sus contratos de ejecución; no autoriza cambios destructivos en hojas productivas ni una migración de datos sin respaldo y aprobación operativa.
- **Criterios de aceptación verificables:**
  - Hoja Usuarios ausente, ilegible, sin encabezados o con esquema incorrecto: cero escrituras en delegaciones/adscripciones.
  - Fuente maestra vacía: diagnóstico diferenciado y cero mutaciones automáticas salvo política explícita, documentada y aprobada para ese caso.
  - `autoFix: "false"`, `1`, `"true"`, `null` y campo omitido: cero escrituras; únicamente `autoFix: true` habilita el modo de corrección.
  - Dos reconciliaciones concurrentes no pueden aplicar decisiones sobre estados obsoletos ni duplicar auditorías/correcciones.
  - Fallo inyectado en cualquier etapa deja un resultado recuperable y trazable; no quedan cambios parciales sin registrar ni se informa éxito integral.
  - Cada modificación puede reconstruirse por entidad con actor, motivo, estado anterior/nuevo y correlación; la invalidación de caché queda confirmada.
  - Pruebas de regresión demuestran que registros válidos nunca se revocan/desactivan por indisponibilidad de Usuarios.
- **Estado:** Pendiente. No implementada ni ejecutada en esta iteración.

### Tarea existente ampliada — AUD-NG-219 / TASK-498
- **Referencia:** hallazgo 3.3; revocación directa de delegaciones huérfanas sin invalidación de `active_delegations_<delegadoId>`.
- **Severidad/prioridad:** ALTO / P1 (conservar clasificación vigente de la tarea matriz).
- **Objetivo:** garantizar que toda revocación, incluida la originada por reconciliación, siga una única ruta de dominio que controle autoridad, estado, concurrencia, auditoría e invalidación de caché.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`, `revokeSecurityDelegation`, `auditAndReconcileIdentityInconsistencies`, validación de permisos y caché de delegaciones.
- **Dependencias:** AUD-NG-231/TASK-511 para el motor seguro de autoFix; AUD-NG-160 para vigencia e invalidación de cachés.
- **Acciones ejecutables:** sustituir la escritura directa en la columna H por una operación de dominio reutilizable; verificar identidad/autoridad y transición de estado; serializar la revocación; registrar actor, motivo, delegación y resultado; invalidar `active_delegations_<delegadoId>` tras la persistencia confirmada; manejar explícitamente errores de invalidación y reintento sin declarar revocación efectiva mientras la autorización cacheada pueda seguir vigente.
- **Alcance explícito:** ampliar la ruta existente de delegaciones; no crear un segundo motor ni duplicar el ciclo de vida ya cubierto por TASK-498.
- **Criterios de aceptación verificables:** la revocación manual y la reconciliación usan el mismo servicio; el permiso deja de ser efectivo inmediatamente tras la revocación confirmada; concurrencia/reintentos son idempotentes; cada cambio registra actor y motivo; pruebas cubren fallo de persistencia, fallo de caché y estado ya revocado.
- **Estado:** Pendiente. Ampliación documentada; no implementada ni ejecutada.

### Tarea existente ampliada — AUD-NG-161
- **Referencia:** hallazgo 3.5 y criterios de verificación de los hallazgos 3.1-3.4; ausencia de pruebas conductuales específicas.
- **Severidad/prioridad:** conservar clasificación vigente de AUD-NG-161.
- **Objetivo:** incorporar una suite de regresión aislada que pruebe la detección y reconciliación de identidad sin depender de hojas productivas ni limitarse a buscar nombres de funciones.
- **Archivos/módulos afectados:** `tests/regression/academic-grading-suite.js`, `tests/regression/modular-dashboard-suite.js` o una suite específica de identidad en `tests/regression/`; fixtures del servicio USER.
- **Dependencias:** contrato final de AUD-NG-231/TASK-511; servicio de revocación de AUD-NG-219/TASK-498; esquemas de Usuarios, DelegacionesSeguridad, HistorialAdscripciones, CatalogoDepartamentos y CatalogoCargos.
- **Acciones ejecutables:** crear fixtures aislados; probar hoja maestra ausente/vacía/ilegible/esquema inválido; booleanos estrictos; delegante/delegado inexistentes; adscripciones con usuario/departamento/cargo inexistente o inactivo; concurrencia; fallo parcial y recuperación; auditoría por registro; invalidación de caché; permisos por rol y ejecución de diagnóstico sin mutación.
- **Alcance explícito:** pruebas conductuales y de regresión del servicio USER; no sustituye pruebas de integración real de Apps Script/Sheets ni validación de despliegue.
- **Criterios de aceptación verificables:** cada caso comprueba resultado, escrituras efectivas, estado anterior/nuevo, auditoría y caché; fixtures se limpian incluso ante fallo; ninguna prueba toca hojas productivas; la suite falla ante cualquier regresión de seguridad o integridad y su salida identifica el caso concreto.
- **Estado:** Pendiente. Ampliación documentada; las suites no se ejecutaron en esta iteración.

### Cobertura y control de duplicados
- Hallazgo 3.1 y la parte de atomicidad/trazabilidad de 3.2 → AUD-NG-231/TASK-511 (tarea nueva ya identificada en el registro histórico; esta sección formaliza sus criterios, no crea otro ID).
- Hallazgo 3.3 → AUD-NG-219/TASK-498 (ampliación del motor de delegaciones; no duplicar).
- Hallazgos 3.4 y 3.5 → AUD-NG-231/TASK-511 para validación referencial y AUD-NG-161 para pruebas conductuales. La comprobación de catálogos no se duplica como tarea independiente: queda dentro del alcance de reconciliación.
- AUD-NG-229 conserva la concurrencia de actualización de perfiles; AUD-NG-005 conserva la propagación de estado de cuenta. Ninguno sustituye las correcciones específicas descritas aquí.
- **Tareas nuevas creadas en esta normalización:** ninguna. Se formaliza el ID ya registrado AUD-NG-231/TASK-511 y se amplían AUD-NG-219/TASK-498 y AUD-NG-161.
- **Resultado de implementación:** exclusivamente documental. No se modificó código ni pruebas y no se declara resuelto ningún hallazgo.

