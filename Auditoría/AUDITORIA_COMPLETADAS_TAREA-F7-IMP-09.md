# AUDITORÍA TAREA-F7-IMP-09
## Desarrollar versiones de horarios, comparación y restauración controlada

- **Fecha:** 2026-11-08.
- **Repositorio:** `i-miss-cocaine/IMA`.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD auditado:** `c5adab367178ac3bb0a7b1393b61e4b15c5b12a5` (C1.240).
- **Checkpoint inicial:** C1.240.
- **Checkpoint de cierre:** C1.241.
- **ID de sesión:** `IMA-AUDIT-20261108-0018Z` (identificador operativo, no ID nativo de ChatGPT).
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica `[X]` de `completadas.md`.
- **Severidad:** CRÍTICO/P0 para aislamiento de borradores, integridad de restauración y concurrencia; ALTO/P1 para historial, trazabilidad, autenticación e interfaz; MEDIO/P2 para cobertura de pruebas.

## 1. Alcance y requisitos

La tarea figura como completada en `completadas.md`, con criterios CA-F7-57..62. Se verificó contra los requisitos funcionales registrados:

1. Registrar versiones relevantes de horarios publicados.
2. Identificar autor y fecha de cada cambio.
3. Comparar dos versiones y mostrar sus diferencias.
4. Distinguir asignaciones nuevas, modificadas, canceladas y restauradas.
5. Conservar el motivo cuando el flujo lo requiera.
6. Guardar borradores sin modificar la versión publicada.
7. Comparar borrador con horario vigente.
8. Restaurar una versión anterior mediante operación controlada.
9. Revalidar conflictos antes de restaurar o publicar.
10. Conservar versiones anteriores.
11. Registrar los cambios aplicados al restaurar.
12. Evitar perder cambios posteriores ajenos a la restauración.

## 2. Fuentes, integridad y estado documental

- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`: TAREA-F7-IMP-09 está marcada [X] y contiene CA-F7-57..62. Se preserva su estado histórico.
- `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-09.md`: no existía; este informe la crea.
- El origen citado por `completadas.md`, `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md`, no existe ni en la raíz ni en `AUDITORIAS/`. Se omite exclusivamente ese documento ausente; no se detiene la auditoría de la tarea, que se contrasta con el alcance de completadas.md, ChangesLogs y la implementación real.
- `Pendientes.md`: lectura ordinaria vacía. El blob Git `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` fue consultado únicamente por la instrucción previa de continuidad para comprobar referencias históricas; contiene 1.782.094 caracteres y no incluye TAREA-F7-IMP-09 ni TASK-569..TASK-576. No se modifica ni se usa como fuente de verdad operativa, de acuerdo con la metodología vigente.
- `AUDITORIAS/Auditoria.txt` SHA previo `542b0885bc06ca5bf6c04203e65005cab3b2516f`: último hallazgo AUD-NG-243; AUD-NG-244 no existía.
- `AUDITORIAS/MapaDependencias.md` SHA previo `a0435ef6d561679844dcfa7eb4c5d7b05b34754e`; `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md` SHA previo `8e002c7132f8f28a80c39af439686e3bb7a4dbc0`; `AUDITORIAS/Contexto_personal.txt` SHA previo `c4ba0e4a7008b2390ec7e5f9c3314f47a089fecd`.
- TASK-569..TASK-576 y AUD-NG-244 se verificaron ausentes en Auditoria.txt, MapaDependencias.md, Plan, Contexto, completadas.md, ChangesLogs.txt y el blob consultado de Pendientes.md.
- `METODOLOGIA_DESARROLLO.md` SHA `cf796728bb384a32537392df2f9c72a339fa03ee`: se respetó inspección manual, separación de auditoría/desarrollo, registro acumulativo y commit único por iteración.

## 3. Evidencia técnica inspeccionada

### Backend académico

- `backend/academic-service/Code.gs` SHA `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`.
- `getOrCreateSheet` (84-155): inicializa `HorariosClase` y otras hojas, pero no declara cabecera para `VersionesHorarios`. La primera llamada a `publishClassSchedules` crea la hoja vacía y `appendRow` coloca la primera versión en la fila 1. Sin embargo, `getScheduleVersions`, `compareScheduleVersions` y `restoreScheduleVersion` consumen `data.slice(1)`; por tanto, descartan esa primera versión como si fuera cabecera. Con una sola versión, `getScheduleVersions` devuelve lista vacía por `data.length <= 1`.
- `ROLE_PERMISSIONS` (168-265): `getScheduleVersions`, `compareScheduleVersions` y `restoreScheduleVersion` están habilitadas para Administrador y Director. Otros roles no tienen permiso explícito. La restauración sí está restringida por rol en servidor, pero la identidad solo se valida si llega un token.
- `verifySessionToken` (401-460 aprox.) y `validateRolePermission` (524-585 aprox.): el validador exige `sessionToken`, `authToken` o `token`; sin credencial devuelve `Sin Credenciales de Sesión`. `doPost` (671 en adelante) valida autorización antes de despachar la acción.
- Dispatcher `doPost` (aprox. 780-830): registra `getScheduleVersions`, `compareScheduleVersions` y `restoreScheduleVersion`; el enrutamiento existe.
- `createClassSchedule` (6900-6990): guarda borradores y horarios activos en la misma hoja y fila de `HorariosClase`. Cuando se recibe un `horarioId` existente, sobrescribe columnas 2-9 y cambia estado a `Borrador` si `borrador=true`. Por ello, editar un horario publicado como borrador modifica el registro publicado (incluido su estado y campos) en lugar de crear una copia aislada. La operación tampoco crea una versión histórica.
- `deleteClassSchedule` (6992-7005): cambia estado a `Inactivo` directamente, sin generar versión ni guardar motivo/diff.
- `publishClassSchedules` (7008-7117): adquiere LockService y valida los borradores antes de activar; después intenta crear una instantánea. La instantánea toma todos los registros con estado Activo, sin filtrar el conjunto por `anoLectivo` ni por `ofertaIds`, y guarda el metadato `anoLectivo || "2026"`. Puede etiquetar con un año una matriz que contiene bloques activos de otros años. Si falla la escritura de versión, el `catch` registra WARN y la publicación sigue devolviendo `status: success`, aunque el historial no se haya guardado. Los cambios activos hechos por `createClassSchedule` o `deleteClassSchedule` no generan versión.
- `getScheduleVersions` (7119-7144): presupone fila de encabezado, lista solo metadatos y filtra por el índice 1. El primer snapshot queda excluido si la hoja fue creada por el flujo actual.
- `compareScheduleVersions` (7145-7223): admite `versionIdA` y `versionIdB`, pero si se solicita un `versionIdB` inexistente deja `blocksB=[]` y devuelve un diff válido aparente, en vez de rechazar la referencia. JSON inválido se convierte silenciosamente en lista vacía. Si no se envía B compara contra registros actuales que no estén Inactivo, incluyendo Borrador. La comparación se basa en `JSON.stringify` de cada objeto completo y no genera cambios por campo normalizados.
- `restoreScheduleVersion` (7224-7305 aprox.): exige código literal de confirmación y ejecuta `checkScheduleConflict` por bloque. No adquiere LockService ni usa control de versión/timestamp antes de escribir. Carga `horData` una sola vez y actualiza/agrega únicamente los bloques de la versión seleccionada; no construye ni valida una matriz final completa. Los registros actuales ausentes en la versión histórica permanecen activos; los registros que comparten ID se sobrescriben con valores históricos, pudiendo descartar cambios posteriores hechos sobre ese mismo horario. No existe selección de cambios ni conciliación de conflictos de versión.
- La restauración escribe solo ocho columnas de `HorariosClase`, no actualiza `UltimaModificacion` (columna 9) y las filas nuevas se agregan sin timestamp. El nuevo snapshot que registra la restauración contiene solo `blocksToRestore`, no el estado final real de toda la matriz después de la operación.
- La restauración registra un único evento `SCHEDULE_VERSION_RESTORED` con `versionId`, `newVersionId` y `restoredCount`; no registra cada bloque/campo anterior y nuevo ni el conjunto de cambios realmente aplicado. `restoredBy` se toma de `payload.authUserId || "ADMIN"`, no de `_verifiedUserId` que el validador obtiene del token.
- `checkScheduleConflict` (7493-7585+): valida contra los horarios vigentes en el momento de cada consulta; no se integra con un lock mantenido durante la validación y escritura de restauración.

### Frontend, API y permisos

- `js/teacher.js` SHA `c475fce5afcd28fca23e7b64398ad32b17773746`, líneas 1598-1688: `openScheduleVersionsModal` busca `#modal-schedule-versions` y `#schedule-versions-list-container`; su controlador de comparación envía solo `versionIdA` y muestra un `alert` con contadores, sin desplegar asignaciones/campos modificados. No ofrece selector para comparar dos versiones históricas. El controlador de restauración envía el código fijo de confirmación y muestra mensaje de éxito.
- `teacher-dashboard.html` SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`: no contiene `openScheduleVersionsModal`, `btn-schedule-versions`, `modal-schedule-versions` ni `schedule-versions-list-container`. No hay botón, modal ni contenedor de versiones; el controlador JavaScript queda sin interfaz conectada. La búsqueda se contrastó en el documento completo y en las secciones de menú/modal.
- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`, líneas 11-60: `fetchApi` solo enriquece `requesterUserId` y `requesterRole`; no envía `sessionToken`, `authToken` ni `token`. Como `validateRolePermission` exige uno de ellos, las llamadas de UI a listar/comparar/restaurar son rechazadas por el backend antes del dispatcher. Se amplía AUD-NG-001 y la tarea existente TASK-567, sin duplicar una tarea de autenticación.
- `tests/regression/academic-grading-suite.js` SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`: no contiene referencias a las tres funciones de versión, TAREA-F7-IMP-09 ni CA-F7-57..62.
- `backend/developer-service/Code.gs` SHA `8aa4bac67cfe5c8c54da51a0784a56fef633e412`: no contiene pruebas o referencias a las funciones de versión.
- `runAcademicPlanningRegressionSuite` en `backend/academic-service/Code.gs` (14109 en adelante) ejecuta TC-F7-01..07 para colisiones, carga, restricciones, capacidad, sustituciones, plantillas y logs; no cubre versiones, diff, borradores ni restauración. `runConcurrencyAndConsistencySuite` (3296 en adelante) solo prueba adquisición/liberación genérica de LockService; no prueba restauración ni concurrencia sobre `VersionesHorarios`.

### Historial de cambios

- `ChangesLogs.txt` SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`, entrada TAREA-F7-IMP-09 alrededor de la línea 2343: afirma que se incorporó botón, modal y funciones de UI en `teacher-dashboard.html` y `js/teacher.js`. El HTML actual no contiene ninguno de los nodos o referencias indicados. El registro histórico no coincide con el estado auditado.
- El mismo registro indica que la publicación genera instantánea y que la restauración exige confirmación; la inspección confirma que esas partes existen parcialmente, con las limitaciones documentadas arriba.

## 4. Evaluación de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-57 | PARCIAL | El backend calcula arrays de agregados/modificados/eliminados, pero la UI solo muestra contadores, no permite elegir dos versiones históricas y el backend no rechaza un segundo ID inexistente. |
| CA-F7-58 | NO CUMPLE | Un borrador que usa un horarioId existente sobrescribe la misma fila publicada y cambia su estado a Borrador. |
| CA-F7-59 | PARCIAL | Hay RBAC para Administrador/Director, código de confirmación y chequeo de conflictos; no hay token enviado por la UI, lock durante restauración ni validación integral de la matriz final. |
| CA-F7-60 | PARCIAL | Se anexan snapshots en publicación/restauración, pero falta cabecera y la primera versión queda excluida; los cambios activos directos no generan versión y el guardado puede fallar sin invalidar publicación. |
| CA-F7-61 | NO CUMPLE | Restaurar sobrescribe silenciosamente datos posteriores para IDs coincidentes; no hay comparación de concurrencia, selección de cambios ni conciliación de versiones. |
| CA-F7-62 | PARCIAL | Se registra un evento resumen y se anexa un snapshot parcial; no se persiste el detalle de cada cambio aplicado ni el estado final completo. |

**Dictamen general: NO CUMPLE.** Hay funciones backend parciales, pero el flujo de versionado no protege borradores, no garantiza historial completo, no muestra el diff al usuario y la restauración puede sobrescribir modificaciones posteriores sin una conciliación explícita.

## 5. Hallazgo y reconciliación

### Hallazgo nuevo

**AUD-NG-244 - Control de versiones de horarios incompleto: persistencia sin esquema, borradores que alteran la versión publicada, comparación sin presentación funcional y restauración no atómica que puede sobrescribir cambios posteriores.**

Se relaciona con:
- **AUD-NG-001:** la UI no envía token y el validador rechaza las acciones privadas. La atribución del actor usa `authUserId` suministrado en payload o un valor genérico, en vez de identidad verificada.
- **AUD-NG-236:** validación de conflictos/calendario; la restauración no mantiene un bloqueo entre validación y escritura ni valida la matriz final consolidada.
- **AUD-NG-237:** interfaz docente; existe controlador JS sin nodos HTML ni invocador.
- **AUD-NG-243:** integridad de horarios y excepciones; la restauración debe respetar el historial de cambios posteriores y no pisar el estado vigente de manera opaca.

### Tareas ejecutables derivadas de los hallazgos

#### Tareas nuevas

**TASK-569 - Normalizar el esquema y la captura de versiones de horarios**
- Hallazgo: AUD-NG-244.
- Severidad: ALTO/P1.
- Objetivo/acción: definir cabecera/versionado de `VersionesHorarios`, migrar registros existentes sin perder snapshots y guardar versiones completas por año/oferta con actor verificado, timestamp, motivo y estado.
- Archivos/módulos: `backend/academic-service/Code.gs`; hoja `VersionesHorarios`; contratos de persistencia.
- Dependencias: AUD-NG-236; TASK-517 (contratos de calendario/horarios, si permanece vigente).
- Alcance: inicialización idempotente, migración segura, filtro correcto por año/oferta y tratamiento explícito de fallos de persistencia.
- Aceptación: la primera y todas las versiones son consultables; snapshots no mezclan años/ofertas; una falla de registro no se reporta como publicación completamente versionada; migración repetida no duplica ni pierde datos.
- Prioridad: P1. Estado: Pendiente.

**TASK-570 - Aislar borradores de la matriz publicada**
- Hallazgo: AUD-NG-244.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: separar el modelo de borrador de los registros publicados y evitar que guardar/editar un borrador con ID de un horario activo cambie la fila publicada.
- Archivos/módulos: `backend/academic-service/Code.gs`; `HorariosClase`; almacenamiento de borradores.
- Dependencias: TASK-569.
- Alcance: identidad propia de borrador, referencia al horario base, publicación explícita y comparación del borrador contra la versión vigente.
- Aceptación: guardar/editar/eliminar borrador no cambia filas activas ni la versión publicada; publicar aplica solo el borrador confirmado y registra snapshot completo; cancelar borrador no afecta la matriz vigente.
- Prioridad: P0. Estado: Pendiente.

**TASK-571 - Completar el motor de comparación de versiones**
- Hallazgo: AUD-NG-244.
- Severidad: ALTO/P1.
- Objetivo/acción: validar ambos IDs, rechazar versiones inexistentes o JSON inválido y comparar campos normalizados para clasificar asignaciones agregadas, modificadas, canceladas y restauradas.
- Archivos/módulos: `backend/academic-service/Code.gs`; contratos de diff.
- Dependencias: TASK-569.
- Alcance: comparación entre dos snapshots históricos o snapshot y borrador/vigente; diferencias por oferta, día, hora, aula, docente y estado.
- Aceptación: dos versiones válidas producen diferencias detalladas por campo; IDs inválidos/corruptos devuelven error explícito; resultados no dependen del orden de propiedades JSON.
- Prioridad: P1. Estado: Pendiente.

**TASK-572 - Implementar restauración con conciliación de cambios posteriores**
- Hallazgo: AUD-NG-244.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: construir vista previa del diff y permitir restaurar cambios seleccionados sin sobrescribir cambios posteriores ajenos a la operación.
- Archivos/módulos: `backend/academic-service/Code.gs`; `VersionesHorarios`; `HorariosClase`.
- Dependencias: TASK-569, TASK-570, TASK-571.
- Alcance: comparación de base histórica contra estado actual, detección de conflictos por ID/campo, selección explícita de cambios, validación de la matriz final y preservación de elementos no seleccionados.
- Aceptación: no se sobrescribe un cambio posterior sin advertencia y confirmación específica; los cambios ajenos permanecen intactos; la matriz final no contiene duplicados ni conflictos; la operación aborta completa si no puede conciliarse.
- Prioridad: P0. Estado: Pendiente.

**TASK-573 - Hacer la restauración atómica y segura ante concurrencia**
- Hallazgo: AUD-NG-244.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: mantener lock durante lectura, revalidación y escritura; aplicar control optimista de versión; actualizar timestamps; impedir persistencia parcial y registrar el snapshot real resultante.
- Archivos/módulos: `backend/academic-service/Code.gs`; `HorariosClase`; `VersionesHorarios`.
- Dependencias: TASK-569, TASK-572.
- Alcance: LockService, comparación de `UltimaModificacion`, rollback/compensación segura, snapshot de estado final y respuesta de conflicto concurrente.
- Aceptación: dos restauraciones concurrentes no se pisan; una modificación ocurrida después de la vista previa invalida la operación; no quedan filas parcialmente actualizadas; nueva versión refleja exactamente la matriz final y cada fila actualizada tiene timestamp.
- Prioridad: P0. Estado: Pendiente.

**TASK-574 - Implementar interfaz funcional para historial, diff y restauración**
- Hallazgo: AUD-NG-244.
- Severidad: ALTO/P1.
- Objetivo/acción: incorporar botón, modal y contenedores reales; permitir elegir dos versiones, comparar borrador/vigente, mostrar diferencias por asignación/campo y seleccionar cambios de restauración.
- Archivos/módulos: `teacher-dashboard.html`; `js/teacher.js`.
- Dependencias: TASK-571, TASK-572, TASK-575, TASK-567.
- Alcance: UI conectada a los endpoints; control de permisos; confirmación contextual; estados de carga/error y actualización posterior.
- Aceptación: todos los nodos DOM existen y tienen invocador visible según rol; el diff muestra detalle de agregados/modificados/cancelados/restaurados; se comparan dos versiones seleccionadas; la UI no muestra éxito si el servidor no confirma.
- Prioridad: P1. Estado: Pendiente.

**TASK-575 - Registrar procedencia y detalle de cambios de versión/restauración**
- Hallazgo: AUD-NG-244.
- Severidad: ALTO/P1.
- Objetivo/acción: guardar actor derivado de claims verificados, fecha, motivo, versión origen/destino y detalle anterior/nuevo de cada asignación aplicada.
- Archivos/módulos: `backend/academic-service/Code.gs`; `HistorialCambiosEntidad`; `VersionesHorarios`.
- Dependencias: TASK-569, TASK-572, TASK-573, TASK-567.
- Alcance: bitácora append-only, trazabilidad de cambios individuales y consulta histórica.
- Aceptación: cada operación registra identidad verificada, motivo y conjunto de cambios; el detalle permite reconstruir qué se aplicó; no se acepta actor enviado libremente por el cliente como identidad probatoria.
- Prioridad: P1. Estado: Pendiente.

**TASK-576 - Añadir regresión conductual de CA-F7-57..62**
- Hallazgo: AUD-NG-244.
- Severidad: ALTO/P1.
- Objetivo/acción: cubrir primera versión, migración, año/oferta, aislamiento de borradores, comparación, restauración, conflictos, concurrencia, preservación de cambios posteriores, trazabilidad y permisos.
- Archivos/módulos: `tests/regression/academic-grading-suite.js`; `backend/academic-service/Code.gs`; suite de planificación.
- Dependencias: TASK-569..TASK-575.
- Alcance: pruebas aisladas de contratos y comportamiento; sin tocar hojas productivas.
- Aceptación: casos positivos/negativos por cada CA; reintentos y concurrencia reproducibles; la suite detecta el bug de primera versión sin encabezado y la sobrescritura de cambios posteriores; ejecución repetida sin efectos colaterales.
- Prioridad: P1. Estado: Pendiente.

#### Tarea existente ampliada
- **TASK-567 (AUD-NG-243 / AUD-NG-001):** ampliar su alcance para incluir las rutas `getScheduleVersions`, `compareScheduleVersions` y `restoreScheduleVersion`; `fetchApi` debe transmitir el token y el backend debe usar `_verifiedUserId`/`_verifiedRole` para atribución y autorización. No se crea otra tarea duplicada de autenticación.

## 6. Pruebas y límites

- **Ejecutadas:** inspección estática/manual de esquema, funciones de creación/edición/publicación, versiones, comparación, restauración, conflictos, permisos, verificación de token, dispatcher, API, controladores UI, HTML, ChangesLogs y suites de regresión; contraste de SHAs y referencias Git.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth real, navegador, Google Sheets/Drive productivas, concurrencia real, restauración con datos reales, rollback, pruebas E2E ni suite Node. No se dispone en esta auditoría de un entorno aislado autorizado para ejecutar operaciones sobre datos.
- No se modificó código, UI, pruebas, datos productivos, `completadas.md`, `Pendientes.md` ni `ChangesLogs.txt`.
- No se cambió la marca histórica [X]; la aprobación no se infiere del estado registrado.

## 7. Archivos y respaldos

- **Nuevo:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-09.md`.
- **Actualizados:** `AUDITORIAS/Auditoria.txt`; `AUDITORIAS/MapaDependencias.md`; `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`; `AUDITORIAS/Contexto_personal.txt`.
- **Sin cambios:** `backend/academic-service/Code.gs` SHA `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`; `teacher-dashboard.html` SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`; `js/teacher.js` SHA `c475fce5afcd28fca23e7b64398ad32b17773746`; `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`; `tests/regression/academic-grading-suite.js` SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`; `backend/developer-service/Code.gs` SHA `8aa4bac67cfe5c8c54da51a0784a56fef633e412`; `ChangesLogs.txt` SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`; `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; `Pendientes.md` blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`; `METODOLOGIA_DESARROLLO.md` SHA `cf796728bb384a32537392df2f9c72a339fa03ee`; rama base.
- Los archivos de código inspeccionados conservaron los SHAs de respaldo anteriores a la auditoría; no hubo cambios en ellos.

## 8. Próxima acción

Abrir `completadas.md` en **TAREA-F7-IMP-10**, comprobar si existe su informe individual y auditar la trazabilidad y deduplicación de notificaciones de cambios académicos. Revisar destinatarios/roles, estado de entrega, reintentos, idempotencia, aislamiento de errores, datos sensibles y ruta completa `frontend -> API -> backend/user-service -> BitacoraNotificaciones`. No implementar durante la fase de auditoría.
