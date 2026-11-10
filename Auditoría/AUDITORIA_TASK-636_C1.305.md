# Auditoría de continuidad e implementación parcial — TASK-636 / C1.305

- Sesión: IMA-EXEC-20261109-1435Z-01
- Checkpoint inicial: C1.304
- Repositorio/rama: i-miss-cocaine/IMA / NG_beta_0.0.0.1_work
- HEAD de partida: 0bbe85a6e2c0afd4ed08637e3cbb08a41f2ba14f
- Tarea: TASK-636 — PM-01 — P0.
- Requisito original: `pendientes/Otros/Pendientes.md`, blob `e9637ecc6f88b2aa0aec75909538e072509bf507`; recuperado íntegramente (1.627.709 caracteres; 16.484 líneas).

## Fuentes de auditoría reutilizadas

- `Auditoría/AUDITORIA_COMPLETADAS_TAREA-AD-06.md` — SHA `53edb3bc645cb79b8da9b0a44dcc48a538ca06fb`.
- `Auditoría/AUDITORIA_COMPLETADAS_F8-TASK06.md` — SHA `3ad808dba045c3841a1ef631f90a0e425f55a3b1`.
- `Auditoría/AUDITORIA_COMPLETADAS_F8-TASK07.md` — SHA `956cd7ba9c69c897244ba60b034736ff801cfe4f`.

Los SHA de los principales archivos de código coinciden con los registrados en esos informes. Se reutiliza evidencia vigente; no se repiten auditorías ni se crean IDs de hallazgo duplicados.

## Dictamen por alcance

TASK-636 permanece **EN EJECUCIÓN — NO COMPLETADA**.

- AUD-NG-280: corregido parcialmente en código en esta iteración; pendiente prueba.
- AUD-NG-364: controles de identidad/propiedad de tickets corregidos en código; pendiente prueba.
- AUD-NG-365: audiencia/vigencia de noticias y comunicados corregida en código; pendiente prueba.
- AUD-NG-001/002, AUD-NG-306, AUD-NG-368/369/370/371: permanecen abiertos para Task-Service/Academic-Service.
- AUD-NG-373: pertenece a TASK-685 (EXAM), fuera del alcance de TASK-636.

## Implementación C1.305

1. `js/auth.js`: persiste el `sessionToken` firmado que devuelve loginUser.
2. `js/api.js`: clona el payload y propaga el token en llamadas autenticadas; requesterUserId/requesterRole quedan como metadatos no confiables.
3. `backend/user-service/Code.gs`:
   - tickets: autor, lector y respondedor derivados de claims y del registro Usuarios; las consultas y respuestas de usuarios se limitan a sus propios tickets.
   - `getAutomationRules`: requiere rol administrativo y se elimina de la autorización temprana.
   - noticias/comunicados: audiencia, grado, sección, estado y vigencia se validan en servidor; los anónimos solo reciben contenido general publicado/activo y vigente; no se usa `payload.authRole`.

## Verificaciones y límites

- Ejecutadas: sustituciones únicas; balance estático de llaves en los tres archivos modificados; comprobaciones estáticas de propagación del token, identidad de tickets, guardia administrativa y ausencia de filtros de audiencia confiados al cliente.
- No ejecutadas: Apps Script runtime, Sheets/Drive reales, navegador, HTTP, E2E ni pruebas con cuentas por rol. No se declaran satisfactorias.
- Task-Service y excepciones públicas de Academic-Service aún no están protegidos; TASK-636 no puede cerrarse.

## Archivos de código modificados

- `js/auth.js`
- `js/api.js`
- `backend/user-service/Code.gs`

## Tareas derivadas de los hallazgos de la auditoría

No se crean IDs nuevos: se conservan TASK-636, TASK-496/AUD-NG-217 (ámbito contextual), TASK-501/AUD-NG-221 (matriz dinámica), TASK-502/AUD-NG-222 (RBAC/ABAC) y TASK-685/AUD-NG-373 (EXAM, fuera de esta tarea). El respaldo restaurable de `closeAcademicYear` permanece como criterio pendiente de TASK-636.

## Siguiente acción exacta

Continuar TASK-636 en `backend/task-service/Code.gs`: eliminar bypasses de `PUBLIC_ACTIONS`, derivar docente/estudiante desde claims, validar propiedad de tareas/proyectos/archivos, filtrar aulas/posts/materiales, corregir preview y bloquear cualquier cierre destructivo hasta verificar un respaldo restaurable. Después abordar las excepciones públicas de ACADEMIC y ejecutar pruebas por rol.

Checkpoint: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt` — sección C1.305; índice central — fila C1.305.


## C1.306 — Implementación de controles de Task-Service

- **HEAD de partida:** 2621b1482c8a1b606b6a5840ac9400d8fd527de4; **blob nuevo de backend/task-service/Code.gs:** `68e585c8abb865e05a0151c91907f5d8b9e7a5b3`.
- Se elimina la lista de acciones públicas de Task-Service (`PUBLIC_ACTIONS = []`).
- `getStudentTasks` deriva el estudiante de claims; para Padre/Tutor/Responsable verifica vínculo y permiso académico; para Profesor limita a tareas asignadas al actor.
- `getAllTasks` y `getTeacherActivity` derivan profesorId del actor autenticado; el filtro de administración es explícito.
- `getAllStudentProjects`, `saveProject`, `listProjects`, `deleteProject` y `loadProject` quedan ligados a la identidad estudiante; se elimina fallback de Drive que podía saltar la comprobación de propiedad.
- `getVirtualClassrooms`, `getPosts` y `getStudyMaterials` se filtran por aulas del usuario/estudiantes vinculados; los posts no confían en `authRole` del cliente.
- `getSubmissionDocumentPreviewUrl` valida claims y comprueba la propiedad de la entrega/tarea; se corrige el contrato incorrecto `sessionCheck.valid`.
- `deleteFile` solo elimina archivos asociados a entregas propias verificadas.
- `getDriveStorageQuotaMetricsReport` queda limitado a Administrador/Desarrollador.
- `closeAcademicYear` se bloquea con `BACKUP_REQUIRED` hasta implementar y verificar un respaldo restaurable; no realiza borrados.

### Estado de hallazgos tras C1.306
- AUD-NG-001/002: bypass de Task-Service corregido en código; excepciones públicas de Academic-Service y pruebas pendientes.
- AUD-NG-306: guardia administrativa y retirada de PUBLIC_ACTIONS implementadas; pruebas pendientes.
- AUD-NG-368: token/propiedad de preview corregidos en código; pruebas pendientes.
- AUD-NG-369: borrado global bloqueado de forma segura, pero respaldo restaurable no implementado; hallazgo sigue abierto.
- AUD-NG-370: propiedad de archivos vinculados a entregas comprobada; archivos subidos aún no entregados y escenarios Drive deben probarse.
- AUD-NG-371: actividad docente filtrada por claims; subalcance EXAM permanece en TASK-685.

### Límites de verificación
- Verificación estática sobre el blob: llaves balanceadas; PUBLIC_ACTIONS vacío; claims presentes en consultas; enumeración de proyectos propia; fallback Drive eliminado; preview sin `sessionCheck.valid`; cierre fail-closed; métricas Drive con guardia administrativa.
- No ejecutadas: Apps Script runtime, Sheets/Drive reales, HTTP, navegador, E2E ni pruebas con cuentas por rol.
- La pertenencia docente a aulas usa el profesorId registrado en AulasVirtuales; la reconciliación con AsignacionesDocentes y las mutaciones de tareas/posts/materiales requieren revisión adicional.
- TASK-636 sigue EN EJECUCIÓN, NO COMPLETADA.


## C1.307 — Mutaciones de Task-Service y asignaciones docentes

- HEAD de partida: `7c43d5389d8d806ff81628a962af3ce4f792d118`; blob preparado de `backend/task-service/Code.gs`: `2df5dbdd08cc41fe400ac489d24eaac399418f56`.
- Se identificó que el dispatcher ya inyecta claims verificados, pero las mutaciones de tareas, aulas, posts y materiales no validaban propietario/ámbito.
- Se añadieron controles de propietario para create/update/delete de tareas, update/delete de posts y delete de materiales; los creadores derivan el autor/propietario de claims.
- La autorización docente de aulas se concilia con `AsignacionesDocentes` por OfertaID, docente, estado Activo y fechas de vigencia, además del ProfesorID en AulasVirtuales.
- createVirtualClassroom exige asignación activa y evita duplicar oferta/grado/sección/asignatura. Docentes no pueden publicar posts/materiales en aula General.
- Verificaciones estáticas: llaves balanceadas; PUBLIC_ACTIONS vacío; claims/propiedad/autor presentes; asignaciones activas y filtro de aulas docente. No se ejecutó runtime, Sheets/Drive, HTTP, navegador ni pruebas por rol.
- El alcance de archivos subidos/no entregados, sesiones de carga, excepciones públicas ACADEMIC y backup/restore sigue pendiente. TASK-636 permanece EN EJECUCIÓN, NO COMPLETADA.

### Tareas derivadas de los hallazgos de la auditoría
No se crean IDs nuevos. Se mantienen AUD-NG-002/AUD-NG-306, AUD-NG-368..371 y sus relaciones con TASK-636. AUD-NG-369 sigue abierto por falta de respaldo/restauración real; AUD-NG-370 sigue abierto por archivos temporales/no entregados. AUD-NG-373 permanece en TASK-685.

### Siguiente acción exacta
Auditar y proteger los flujos de archivos/sesiones indicados en C1.307; después resolver excepciones públicas ACADEMIC y el respaldo/restauración de closeAcademicYear.


## C1.308 — Propiedad de archivos, entregas y cargas reanudables

- **HEAD de partida:** e7cdbf2875c382cf3b2f8300bf7bccd190c058fc; **rama base:** 44d9891132332e692dbe2ba8602b41f50a508a59.
- Task-Service: uploadFile/submitAssignment/saveSubmissionDraft derivan identidad de claims; el archivo debe tener metadatos activos con el mismo propietario y TareaID. Se retira ANYONE_WITH_LINK.
- MetadatosArchivos amplía columnas 20/21 (PropietarioUserId/DriveFolderId), append-only. Los registros históricos sin propietario quedan bloqueados por controles fail-closed; no se infiere propietario por carpeta.
- deleteFile permite limpiar archivos propios no entregados con metadatos; deleteSubmission exige docente propietario o administración.
- Carga reanudable: sesión UUID asociada a actor y tarea; uploadChunk/progreso/cancelación/reconstrucción validan propietario; se guarda fileId real y el frontend deja de confundirlo con sessionKey. La ruta legacy uploadId/finishChunkedUpload queda deshabilitada.
- Verificación estática: sin ANYONE_WITH_LINK, PUBLIC_ACTIONS vacío, claims/propiedad/tarea/sesión y contrato frontend comprobados. No se ejecutaron runtime Apps Script/Node, Sheets/Drive, HTTP, navegador, E2E ni pruebas por rol.
- **AUD-NG-370 parcialmente corregido, no cerrado** por falta de migración de metadatos históricos y pruebas dinámicas. **AUD-NG-369 abierto**; closeAcademicYear continúa bloqueado con BACKUP_REQUIRED. Excepciones públicas ACADEMIC siguen pendientes.

### Tareas derivadas de los hallazgos de la auditoría
No se crean IDs nuevos. Se mantienen TASK-636/AUD-NG-370, TASK-496/AUD-NG-217, TASK-501/AUD-NG-221, TASK-502/AUD-NG-222 y TASK-685/AUD-NG-373 en sus ámbitos existentes. La migración histórica de metadatos y pruebas dinámicas quedan dentro de AUD-NG-370/TASK-636.

### Siguiente acción exacta
Endurecer las excepciones públicas de backend/academic-service/Code.gs mediante tokens opacos de alta entropía y minimizar los datos públicos; luego implementar y demostrar restauración aislada antes de habilitar closeAcademicYear.

## Revisión focalizada C1.309 — continuidad C1.308 y protección de excepciones públicas
- Sesión: IMA-EXEC-20261109-1533Z-01; checkpoint inicial C1.308; HEAD auditado 9f5f15952c30cb1207904fd53d5a1de6e1248139.
- Revisión anterior: Task-Service uploadFile, submitAssignment, saveSubmissionDraft, deleteFile, deleteSubmission y sesiones reanudables; frontend js/student.js/js/ui-common.js.
- AUD-NG-370 ampliado: deleteFile comprobaba propietario y metadato activo, pero no referencias en Entregas ni EntregasVersiones. Podía borrar un archivo ya usado en una entrega/versionado. Se corrige comprobando ambas hojas antes de DriveApp.setTrashed. Sigue abierto por metadatos históricos sin propietario, migración y pruebas dinámicas.
- AUD-NG-357 ampliado: borradores por email/draftKey; estado de admisión por DNI/ID secuencial devolvía PII; createAdmissionRequest confiaba en skipLock; getServiceHealthDiagnostics era público. Se reutiliza el ID existente.
- Correcciones: capacidades opacas derivadas de dos UUID, hash SHA-256 persistido; getPublicAdmissionStatus exige accessToken y devuelve datos mínimos; saveAdmissionDraft/getAdmissionDraft exigen draftAccessToken; LockService obligatorio; diagnóstico solo Administrador/Desarrollador verificados; frontend conserva token y no envía DNI/ID secuencial. El panel de seguimiento por token no invoca ni muestra estado financiero.
- Compatibilidad: registros históricos sin hash no reciben token por inferencia de correo/DNI/ID. La ruta pública falla de forma cerrada; no se reemplaza el acceso autenticado de tutores.
- Estado: TASK-636 En ejecución, no Completada. AUD-NG-357/AUD-NG-370 parcialmente abiertos; AUD-NG-369 abierto y closeAcademicYear sigue bloqueado con BACKUP_REQUIRED.
- Verificación estática y Code Review focalizado. No ejecutados Apps Script runtime, Sheets/Drive reales, HTTP, navegador, E2E, concurrencia ni pruebas por rol.

## Integración frontend C1.310 — seguimiento y borradores de admisión
- Revisión posterior del commit C1.309 detectó que admision.html seguía enviando draftKey/email como credencial y no consumía el token emitido; el formulario también esperaba nombres/expediente en el estado público y mostraba DNI como alternativa.
- Corrección: autosave reutiliza draftAccessToken y persiste la capacidad por borrador en almacenamiento local; el envío final adjunta la capacidad para consumir el borrador. La clave local derivada de email/DNI solo identifica el registro del navegador y no se envía como autorización.
- La confirmación muestra el token privado de seguimiento y permite copiarlo; el formulario lo conserva localmente y el backend lo entrega por correo.
- handleTrackStatus consulta mediante window.getPublicAdmissionStatus(token) y muestra solo código interno, estado, grado/año y fecha; se eliminan nombres, responsable, canal y observaciones de la respuesta pública.
- El panel de seguimiento público no invoca el endpoint financiero. Las solicitudes autenticadas de tutores mantienen su panel financiero existente.
- Estado: TASK-636 continúa En ejecución. No se ejecutaron navegador, Apps Script runtime ni pruebas E2E; verificación estática de contrato y referencias únicamente.


## Revisión focalizada C1.311 — AUD-NG-369 / cierre académico
- El cierre histórico borraba globalmente Entregas/recursos Drive; Tareas y ConfiguracionAcademica se filtraban por profesorId cuando se suministraba. backupId era sintético, sin respaldo real.
- El código actual permanece fail-closed con BACKUP_REQUIRED. C1.311 retira closeAcademicYear de ROLE_PERMISSIONS.Profesor y deshabilita el botón de js/teacher.js; el endpoint conserva guard Administrador/Desarrollador.
- El backup genérico ACADEMIC no satisface AUD-NG-369: hash 32-bit, bypass de checksum no vacío, restore sin verificación previa/lock/rollback y limpieza de hojas completas. No se reutiliza.
- Próximo: protocolo dedicado, aislado y restaurable para Tareas, Entregas, ConfiguracionAcademica y activos Drive. Mantener BACKUP_REQUIRED hasta prueba real de restauración/rollback.
- Verificación estática únicamente; runtime Apps Script, Sheets/Drive reales, navegador, HTTP, E2E y pruebas por rol no ejecutados. AUD-NG-369 abierto; TASK-636 En ejecución.
- Checkpoint C1.311: Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.311; índice Auditoría/INDICE_CHECKPOINTS.md — fila C1.311.


## Revisión focalizada C1.312 — protocolo dedicado de backup/restore para AUD-NG-369

- Requisito rector: TASK-636, P0, PM-01; fuente original recuperada del blob pendientes/Otros/Pendientes.md. El alcance del cierre histórico incluye Tareas, Entregas, ConfiguracionAcademica, Log_Cierres y activos Drive referenciados por Entregas.
- Auditoría única: se reutiliza este expediente principal. C1.311 ya había documentado el defecto del backup genérico ACADEMIC; no se crea otro informe completo ni se reauditan hallazgos no afectados.
- Implementación C1.312: Task-Service incorpora handlers administrativos createTaskServiceAcademicYearBackup, verifyTaskServiceAcademicYearBackup y restoreTaskServiceAcademicYearBackup. Cada handler vuelve a comprobar claims de Administrador/Desarrollador; no se agregan acciones públicas.
- El manifiesto versionado contiene snapshots de Tareas, Entregas y ConfiguracionAcademica; incluye Log_Cierres, EntregasVersiones y MetadatosArchivos cuando existen. Log_Cierres se verifica como historial append-only y no se sobrescribe durante una restauración.
- Se respaldan recursivamente los archivos/carpetas Drive referenciados por Entregas y EntregasVersiones; se registra tamaño, SHA-256, jerarquía, MIME y permisos de acceso/editores/lectores. Los activos públicos o no verificables hacen fallar el respaldo.
- La verificación recalcula SHA-256 del manifiesto y de cada archivo copiado; no acepta checksums vacíos ni sustitutos débiles. La restauración valida manifiesto y activos antes de mutar, usa LockService, conserva IDs originales cuando los activos siguen íntegros, recrea copias cuando faltan y actualiza referencias en las hojas. Verifica datos, fórmulas, activos y permisos después de restaurar.
- Los errores capturados disparan rollback compensatorio de hojas y activos creados/destrashed, con resultado explícito RESTORE_FAILED_ROLLED_BACK o RESTORE_FAILED_ROLLBACK_INCOMPLETE. Limitación conocida: el journal de compensación es en memoria; una terminación abrupta del runtime puede impedir ejecutarlo. Se requiere journal durable y prueba de interrupción antes de considerar satisfecho el criterio de rollback.
- closeAcademicYear permanece fail-closed con BACKUP_REQUIRED. No se habilita ningún borrado ni se declara el backup/restore certificado.
- Se añade tests/security/task-service-backup-restore-contract.test.js como contrato estático. Se ejecutaron inspecciones estáticas de las invariantes del código; el script Node no se ejecutó en este entorno.
- No ejecutadas: parser/runtime Apps Script, Sheets/Drive reales, restauración aislada repetible, rollback ante interrupción, HTTP, navegador, E2E ni pruebas por rol. No se declaran PASS dinámicos.
- Desviación de publicación: la actualización inicial de backend/task-service/Code.gs mediante la operación de archivo produjo automáticamente el commit cad69a6476f58eaa50d39848a020d17c7db8a588 antes de completar el expediente y checkpoint. No se reescribe historia ni se usa force-push; esta consolidación deja registrada la desviación y el estado reproducible.
- Estado: TASK-636 continúa En ejecución. AUD-NG-369 permanece abierto hasta journal durable, pruebas aisladas de restauración/rollback y revisión interna final.


## Revisión focalizada C1.313 — journal durable y recuperación de restauraciones interrumpidas

- Se atiende la limitación identificada en C1.312: antes de restaurar, Task-Service genera un respaldo compensatorio completo y persiste en ScriptProperties el estado de la operación, el manifiesto objetivo y el manifiesto de rollback.
- La restauración rechaza nuevas operaciones si existe un journal pendiente. Si la ejecución termina abruptamente, el handler administrativo recoverTaskServiceAcademicYearRestore usa el respaldo compensatorio para recuperar las hojas y activos anteriores; el journal solo se elimina tras una recuperación satisfactoria.
- Una restauración normal registra estado COMPLETED antes de limpiar el journal. Los errores capturados intentan compensación inmediata; si esta queda incompleta, el journal durable permanece en estado RECOVERY_REQUIRED.
- Se amplía el contrato estático para comprobar la presencia del journal durable y del handler de recuperación.
- No se ha ejecutado una interrupción forzada real ni Apps Script/Sheets/Drive aislados; por tanto, el mecanismo está implementado estáticamente, pero no certificado operacionalmente. AUD-NG-369 permanece abierto y closeAcademicYear continúa BACKUP_REQUIRED.


## Revisión focalizada C1.314 — confirmación explícita de recuperación administrativa

- Code Review detecta que recoverTaskServiceAcademicYearRestore, aunque restringido a Administrador/Desarrollador y condicionado a un journal durable, podía iniciar una restauración compensatoria sin un segundo gesto de confirmación.
- Se añade confirmación explícita confirmed=true y confirmCode=RECOVER-TASK-SERVICE-RESTORE antes de ejecutar la recuperación; la operación normal de restore ya exigía su propio código de confirmación.
- Se amplía el contrato estático para verificar este control.
- Verificación estática de presencia del guard y del código de confirmación; el script Node y el runtime Apps Script no se ejecutaron. AUD-NG-369 permanece abierto y closeAcademicYear continúa BACKUP_REQUIRED.


## Revisión focalizada C1.315 — recuperación serializada e idempotencia de activos Drive

- Code Review detectó dos riesgos dentro de AUD-NG-369: recuperaciones administrativas concurrentes podían competir por el mismo journal; una interrupción tras crear copias Drive podía duplicarlas al reintentar porque el ID recreado solo existía en memoria.
- Se serializa recoverTaskServiceAcademicYearRestore con LockService y el restaurador interno reutiliza el lock ya adquirido, evitando adquisición anidada. Se valida el estado del journal y se conserva RECOVERY_REQUIRED con error acotado cuando una recuperación falla.
- Se añade un archivo de estado durable en Drive dentro del respaldo compensatorio, con restoreId e idMap. Los archivos/carpetas recreados usan marcadores deterministas hasta persistir su ID; al reintentar se localiza la copia existente, se valida hash/tamaño, nombre y carpeta padre y se reutiliza en lugar de duplicarla.
- Los IDs recuperados se verifican antes de modificar nombre/permisos. Las búsquedas de marcadores rechazan duplicados ambiguos. Los detalles de rollback almacenados en ScriptProperties se limitan para evitar exceder el tamaño permitido por propiedad.
- Se amplía tests/security/task-service-backup-restore-contract.test.js para cubrir estado durable, marcadores, lock exclusivo, recuperación reintentable, estados inválidos, validación de padre/nombre/hash y persistencia Drive.
- Se ejecutaron 42 comprobaciones estáticas equivalentes en el runtime JavaScript de la sesión sobre los blobs preparados; 42/42 pasaron y los delimitadores del bloque modificado quedaron balanceados. No es ejecución del archivo Node.
- Se verificó en documentación oficial de Apps Script que Drive File.setContent y Folder.getFilesByName/getFoldersByName existen; no se ejecutó Apps Script real.
- Pendiente: Node, Apps Script runtime, Sheets/Drive aislados, interrupciones forzadas y repetibilidad real. AUD-NG-369 sigue abierto; closeAcademicYear permanece BACKUP_REQUIRED.


## Revisión focalizada C1.316 — ejecución Node en CI y preparación de pruebas de integración
- Se incorpora el workflow .github/workflows/task-service-backup-restore-contract.yml, limitado a push en NG_beta_0.0.0.1_work y a cambios del contrato/código; permisos mínimos contents:read.
- Primera ejecución: run 42659818881, commit 4ebe03b79c168c0afc3d7df1ece46fe48132901a, Node 22, completed/success; el log confirmó “Task-Service backup/restore static contract checks passed.” Se observó advertencia deprecación del runtime Node20 en actions/checkout@v4 y setup-node@v4.
- Se actualizan las acciones a actions/checkout@v7 y actions/setup-node@v7, Node 24 y package-manager-cache:false.
- Segunda ejecución: run 42659961195, commit f5359a3668519b1c4a1bbad155f0d123fc09914d, completed/success; job “Run Node static contract” y paso “Execute backup and restore contract” concluyeron success. Log confirma “Task-Service backup/restore static contract checks passed.” sin advertencia de deprecación Node20.
- Inspección del árbol Git: no existen appsscript.json ni .clasp.json, ni otra configuración de clasp/deployment; no hay proyecto de Apps Script ni entorno aislado de Sheets/Drive referenciado en el repositorio. No se puede ejecutar todavía el runtime de Google Apps Script ni pruebas destructivas/forzadas en un entorno aislado.
- TASK-636 sigue En ejecución; AUD-NG-369 abierto; closeAcademicYear continúa BACKUP_REQUIRED hasta certificación de integración.


## Revisión focalizada C1.366 — aislamiento del estado de recuperación compensatoria

- **Baseline lógico:** C1.316, commit `31262d5ccbfc46a5f87a5d0fc9c363b177283d9a`. Los checkpoints C1.317–C1.365 se preservan, pero no se aceptan como evidencia de continuidad ni de cierre por instrucción expresa del usuario.
- **HEAD físico auditado para preparar la corrección:** `739b0e6dc11f5598abdcdc2837b63b4480746bc6`. La lógica y el contrato se vuelven a verificar independientemente.
- **Hallazgo existente ampliado:** AUD-NG-369. El restaurador compensatorio reutilizaba `restoreStateFileId/restoreId` del intento original. El archivo de progreso contiene `idMap` de los activos restaurados hacia el estado objetivo; al restaurar el respaldo compensatorio, un mismo originalId podía apuntar a una copia con hash distinto y provocar el rechazo del rollback.
- **Corrección:** la recuperación crea un archivo de progreso independiente dentro de la carpeta del manifiesto compensatorio y persiste `recoveryRestoreStateFileId`/`recoveryRestoreId` en el journal antes de iniciar. Los reintentos reutilizan exclusivamente ese estado; un journal parcial o sin estado de recuperación se rechaza sin fallback al mapa del intento original.
- **Pruebas locales añadidas:** fixture Node del selector de progreso; comprueba separación de fileId/restoreId y rechazo fail-closed cuando falta el estado de recuperación. El contrato comprueba la persistencia del estado independiente y su ubicación junto al respaldo compensatorio.
- **Pendiente:** ejecución CI del contrato tras publicar este commit. No se declara PASS antes de consultar el run y sus logs.
- **Beta diferida:** BETA-FUNC-010 cubre interrupción durante restauración y recuperación, repetición de recuperación, integridad de hojas/activos, referencias e idMap en Apps Script/Sheets/Drive aislados. No bloquea la implementación local por requerir servicios desplegados.
- **Estado:** TASK-636 continúa En ejecución; AUD-NG-369 sigue abierto hasta resolver y verificar los demás criterios locales. `closeAcademicYear` permanece fail-closed con `BACKUP_REQUIRED`.


## Revisión focalizada C1.367 — referencias de versiones y compensación de borrado

- **Hallazgo existente:** AUD-NG-370. La revisión de `deleteFile` encontró que solo se comprobaba `EntregasVersiones.FileID` (columna índice 6). Una versión que conservara el ID únicamente en `ArchivoUrl` (índice 5) podía no ser reconocida y quedar expuesta a borrado.
- **Corrección:** se resuelven los índices por encabezado `FileID`/`ArchivoUrl`, con fallback legado 6/5, y se comprueban ambas referencias mediante `extractTaskServiceFileId`. El handler rechaza archivos ya en papelera.
- **Integridad:** si falla la actualización de Estado en `MetadatosArchivos` después de enviar el archivo a papelera, intenta restaurarlo. Si la compensación también falla, devuelve `DELETE_FILE_ROLLBACK_FAILED`; nunca reporta éxito.
- **Pruebas locales añadidas:** fixtures Node con archivo referenciado solo por URL, solo por FileID, borrado permitido y fallo simulado de escritura de metadatos con compensación Drive.
- **CI anterior C1.366:** security local contracts run 42723140739 completed/success; backup/restore contract run 42723140736 completed/success. Sus logs muestran ejecución Node 22.23.4 y aprobación de los contratos correspondientes.
- **CI C1.367:** pendiente de ejecución tras publicar; no se declara PASS anticipadamente.
- **Beta:** BETA-FUNC-011 cubre las referencias de versiones en un Drive/Sheets aislado. No bloquea implementación local.
- **Estado:** AUD-NG-370 permanece en revalidación hasta CI C1.367. TASK-636 sigue En ejecución; no se crea un ID de hallazgo nuevo ni un informe paralelo.


## Revisión focalizada C1.368 — excepciones públicas USER y audiencias de contenido

- **Hallazgos existentes reabiertos/ampliados:** AUD-NG-365 y AUD-NG-002. No se crean IDs nuevos.
- **Discrepancia comprobada:** `getNews` aceptaba `grado`, `seccion` e `includeInactive` del cliente sin derivar ámbito de claims; un visitante podía solicitar contenido de otros grados o inactivo. `getInstitutionalAnnouncements` utilizaba `rol/audiencia` del payload, excluía solo Retirado y podía devolver borradores/futuros o audiencias ajenas.
- **Corrección:** ambos handlers llaman `getUserVerifiedRole(payload)`. `getNews` deriva grado/sección desde Usuarios para usuarios autenticados; anónimos reciben solo noticias generales activas y vigentes; includeInactive se reserva a roles privilegiados verificados. `getInstitutionalAnnouncements` deriva la audiencia desde claims, limita todos los resultados a Publicado/Activa y fecha no futura, entrega solo general a anónimos y omite autorId/audiencia de la respuesta pública.
- **Pruebas locales añadidas:** fixtures de noticias general/por grado/inactiva/futura; comunicados general/Estudiante/Secretaría/borrador/futuro/retirado; spoof de rol, grado, sección y audiencia; respuesta pública sin metadatos internos. Se agregan comprobaciones de persistencia/propagación del token y de capacidades opacas de ACADEMIC.
- **Workflow:** se amplía el filtro de rutas para ejecutar el contrato cuando cambie `backend/user-service/Code.gs`.
- **CI C1.367:** security local contracts run 42723634980 completed/success; log confirma FileID/ArchivoUrl, borrado permitido y compensación por fallo de metadatos. Backup/restore run 42723635060 debe consultarse por separado.
- **CI C1.368:** pendiente tras publicar; no se declara PASS anticipadamente.
- **Beta:** BETA-FUNC-012 cubre contenido público/autenticado con Apps Script/Sheets aislados; no bloquea la implementación local.
- **Estado:** TASK-636 sigue En ejecución. AUD-NG-365 se reabre por discrepancia del HEAD auditado; AUD-NG-002 continúa en revalidación. No se cierra el alcance global.


## Revisión focalizada C1.369 — normalización de borradores en getPosts

- **Hallazgo existente ampliado:** AUD-NG-002. El filtro de borradores en `getPosts` comprobaba únicamente el booleano `row[7] === true`. Si Sheets entregaba el valor como texto `"true"` y el estado era `Publicado`, un estudiante podía recibir el borrador; el campo `authRole` no era necesario para explotar la inconsistencia, pero el cliente también podía enviar `authRole: "Administrador"` sin que eso deba alterar permisos.
- **Corrección:** se normaliza el indicador de borrador aceptando boolean true y string true antes de aplicar las reglas de visibilidad. El rol continúa derivándose de `_verifiedRole` verificado; el borrador solo se muestra a Profesor/Administración cuando `includeDrafts` está explícitamente habilitado y la clase pertenece al ámbito autorizado.
- **Pruebas locales añadidas:** fixtures con borrador boolean true, string "true", publicación normal, aula ajena y fecha programada futura. Se verifica que un Estudiante no obtiene borradores aunque envíe `authRole: "Administrador"` y `includeDrafts: true`; el Profesor ve borradores únicamente al solicitarlos en su aula autorizada.
- **CI C1.368:** Task-Service security local contracts run 42724379224 completed/success; log confirma contratos de metadatos, deleteFile y USER public news/announcements. Identity mapping/transport run 42724379276 completed/success.
- **CI C1.367 backup/restore:** run 42723635060 completed/success.
- **CI C1.369:** pendiente tras publicar; no se declara PASS anticipadamente.
- **Beta:** BETA-FUNC-013 cubre representación de booleanos y visibilidad de borradores en Sheets/Apps Script aislados; no bloquea implementación local.
- **Estado:** AUD-NG-002 sigue en revalidación; TASK-636 permanece En ejecución.


## C1.370 — ajuste del fixture de visibilidad de publicaciones programadas

- Durante Code Review del contrato C1.369 se detectó que el fixture esperaba que Profesor no recibiera publicaciones con fecha programada futura. El comportamiento autorizado de getPosts permite al personal docente revisar publicaciones programadas en su aula; la restricción de fecha futura corresponde a usuarios no privilegiados.
- Se ajustan únicamente las expectativas del fixture: Profesor sin includeDrafts ve publicaciones normales y programadas; con includeDrafts ve además borradores de su aula. Estudiante sigue sin ver borradores ni publicaciones futuras.
- No cambia la implementación de autorización ni se amplía el acceso del estudiante. Se conserva el hallazgo AUD-NG-002 y el expediente único.
- CI C1.369 queda pendiente; C1.370 ejecutará el contrato actualizado.


## Revisión focalizada C1.371 — eliminación segura de proyectos propios

- **Hallazgo existente ampliado:** AUD-NG-002 (propiedad de proyectos). `deleteProject` podía coincidir con cualquier URL propia cuando `fileId` estaba vacío porque `indexOf("")` devuelve 0; además, capturaba errores de Sheets/Drive y devolvía success aunque no hubiera eliminado el proyecto o el archivo.
- **Corrección:** la búsqueda exige propietario autenticado; compara el ID y/o nombre aportados, y cuando ambos se envían exige que ambos correspondan al mismo registro. Se elimina el fallback por substring vacío.
- **Consistencia Drive/Sheets:** el archivo se envía a papelera antes de borrar la fila; si falla Drive, la fila permanece; si falla el borrado de la fila, se intenta restaurar el archivo. Errores de compensación se reportan explícitamente; no se devuelve success por errores absorbidos.
- **Pruebas locales añadidas:** nombre incorrecto sin fileId, proyecto de otro usuario, identificadores discordantes, eliminación propia, fallo Drive y fallo Sheets con rollback.
- **CI C1.370:** security local contracts run 42724840584 completed/success; log confirma reconciliación de metadatos, deleteFile, USER public news/announcements y getPosts.
- **CI C1.369:** backup/restore run 42724684967 completed/success; security run 42724685285 falló solo por expectativa incorrecta del fixture docente P5; C1.370 corrige la expectativa y pasa.
- **CI C1.371:** pendiente tras publicar.
- **Beta:** BETA-FUNC-014 cubre operación Drive/Sheets real aislada; no bloquea implementación local.
- **Estado:** AUD-NG-002 continúa en revalidación; TASK-636 permanece En ejecución.


## Revisión focalizada C1.372 — alcance docente en consultas y previsualización

- **Hallazgo existente ampliado:** AUD-NG-371. `getStudentTasks`, `getAllTasks`, `getTeacherActivity` y la previsualización de entregas comprobaban que la tarea perteneciera al profesor creador, pero no verificaban en todos los caminos que su oferta/aula continuara asignada y activa.
- **Riesgo:** un docente podía conservar lectura de tareas, entregas y documentos tras expirar/desactivar su asignación; el control activo ya existía para mutaciones, pero no se aplicaba consistentemente a consultas.
- **Corrección:** se introduce `isTaskServiceTeacherTaskAuthorized_`, que cruza propietario, grado, sección, asignatura, aula activa y clases devueltas por `getTaskServiceAuthorizedClassrooms` (que ya filtra ofertas activas y vigentes). Se aplica a las tres consultas y a la previsualización; `assertTaskServiceTeacherCanManageTask` reutiliza el mismo control.
- **Normalización:** estado de aula desactivada se compara sin distinguir mayúsculas/minúsculas; estado de asignación se recorta antes de comparar.
- **Pruebas locales añadidas:** ofertas activas, vencidas e inactivas; aulas desactivadas en capitalización mixta; tarea propia/asignada, tarea fuera de sección/oferta y propietario distinto; checks estáticos de los handlers de lectura y preview.
- **CI C1.371:** pendiente al iniciar esta revisión; runs 42725331670 (security) y 42725331631 (backup/restore) se consultan en el siguiente control.
- **CI C1.372:** pendiente tras publicar.
- **Beta:** BETA-FUNC-015 cubre expiración/desactivación real de asignaciones y acceso a entregas en Apps Script/Sheets/Drive aislados.
- **Estado:** AUD-NG-371 continúa en revalidación; TASK-636 sigue En ejecución.


## Revisión focalizada C1.373 — fecha/estado de publicación de contenidos

- **Hallazgo existente ampliado:** AUD-NG-002. `getStudyMaterials` filtraba estado, pero no verificaba `FechaPublicacion`; un material Activo con fecha futura podía aparecer a estudiantes antes de publicarse. Además, el estado se comparaba literalmente, y un registro con `eliminado` en minúsculas podía permanecer visible para personal. `getPosts` también comparaba `Eliminado` con sensibilidad a mayúsculas/minúsculas, permitiendo que personal recibiera registros eliminados con otra capitalización.
- **Corrección:** `getStudyMaterials` normaliza estado; estudiantes/familia solo reciben estado explícito Activo/Publicado y fecha válida no futura. Registros Eliminado se excluyen para todos. `getPosts` normaliza estado, excluye Eliminado para todos y exige Publicado a usuarios no privilegiados.
- **Pruebas locales añadidas:** fixtures de material general/aula, futuro, borrador, eliminado con minúsculas, aula ajena y estado vacío; posts con estado eliminado en minúsculas. Personal conserva acceso de revisión a borradores/programados en aulas autorizadas.
- **CI C1.371:** security run 42725331670 completed/success; backup/restore run 42725331631 completed/success.
- **CI C1.372:** security run 42725726339 completed/success; backup/restore run 42725726361 completed/success. Log de security confirma contratos de asignación docente activa.
- **CI C1.373:** pendiente tras publicar.
- **Beta:** BETA-FUNC-016 cubre publicación futura, estado y visibilidad en Sheets aislados; no bloquea implementación local.
- **Estado:** AUD-NG-002 continúa en revalidación; TASK-636 sigue En ejecución.


## C1.374 — ajuste de dependencia del fixture getPosts

- Code Review del contrato C1.373 detectó que getPosts ahora invoca normalizeString para normalizar el estado, pero el contexto VM del fixture no incluía esa función.
- Se incorpora la función normalizeString real extraída del mismo USER/TASK source al contexto del test. No se altera código productivo ni el alcance de autorización.
- CI C1.373 permanece pendiente de lectura; C1.374 ejecutará el fixture corregido.


## C1.375 — corrección de orden esperado en fixture getStudyMaterials

- El CI C1.374 ejecutó correctamente los contratos anteriores y la lógica de getStudyMaterials; falló únicamente por el orden lexicográfico esperado en el array del test de personal.
- Se ordena el resultado esperado para que coincida con el `.sort()` aplicado al resultado real. No cambia código productivo ni criterios de acceso.
- CI C1.375 pendiente tras publicar.


## Revisión focalizada C1.376 — claims de sesión obligatorios en USER/ACADEMIC/TASK

- **Hallazgo existente:** AUD-NG-001/002, sesión institucional y validación fail-closed. Se confirma que los tres verificadores `verifySessionToken` aceptaban claims firmados sin `exp`, sin `userId` y sin `sessionId`; la comprobación anterior `if (claims.exp && now > claims.exp)` trataba la ausencia de expiración como válida. El verificador solo consultaba revocación/estado de cuenta cuando existía userId.
- **Compatibilidad comprobada en código:** `generateSessionToken` de USER emite `userId`, `role`, `sessionId`, `iat` y `exp` con vigencia de 24 horas. Los servicios USER, ACADEMIC y TASK comparten el contrato de claims.
- **Corrección transversal:** los tres verificadores ahora exigen objeto claims, userId/role/sessionId no vacíos, iat/exp enteros seguros, iat no más de 60 segundos en el futuro, exp estrictamente posterior al momento actual y a iat, y duración máxima de 24 horas. La lógica existente de revocación y estado activo permanece.
- **Pruebas locales añadidas:** contrato ejecutable en VM sobre los tres verificadores: token completo válido; ausencia de exp/iat/userId/role/sessionId; token expirado; emisión futura; vigencia superior a 24 horas.
- **CI C1.375:** security run 42726782516 completed/success; jobs local-security-contracts success. Logs confirman los contratos anteriores y el test de getStudyMaterials.
- **CI C1.376:** pendiente tras publicar.
- **Beta:** BETA-FUNC-017 propone verificación de sesión real con login, expiración, revocación y estado de cuenta en los tres servicios aislados; no se declara ejecutada.
- **Estado:** AUD-NG-001/002 permanecen en revalidación; TASK-636 En ejecución, no completada.


## Revisión focalizada C1.377 — eliminación de clave HMAC derivada de identificador público

- **Hallazgo existente:** AUD-NG-001/002, integridad de sesión HMAC. USER, ACADEMIC, TASK, ACCOUNTING, EXAM y DEVELOPER derivaban `AUTH_TOKEN_SECRET` de SHA-256(`SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET"`) cuando la propiedad no estaba configurada. Los IDs de hoja y el código fuente están en el repositorio; por tanto, el fallback no constituye un secreto privado y permite construir firmas conocidas en entornos sin propiedad provisionada.
- **Corrección transversal:** los seis servicios dejan de derivar/guardar claves deterministas. `getAuthTokenSecret` exige `AUTH_TOKEN_SECRET` en Script Properties con al menos 32 caracteres; si falta, no puede leerse o es débil, falla con error explícito y no firma ni verifica tokens.
- **Compatibilidad operativa:** los despliegues existentes que ya persistieron la propiedad conservan su valor; los despliegues nuevos/limpios requieren provisionar el mismo secreto aleatorio compartido en todos los servicios que verifican los mismos tokens. No se inspeccionaron Script Properties de despliegues ni se realizó rotación.
- **Pruebas locales añadidas:** en los seis servicios se prueba lectura de secreto provisionado, rechazo de propiedad ausente y rechazo de secreto corto. C1.376 ya verifica claims estrictos en USER/ACADEMIC/TASK.
- **CI C1.376:** Task-Service security run 42728633783 success; backup/restore run 42728633788 success; identity mapping run 42728633992 failure en el paso TASK-030 (actual `['EXP-02','STU-02']`, esperado `[]`), mientras el paso TASK-068 fue success. No corresponde a los archivos de clave HMAC modificados; se conserva como incidencia independiente.
- **CI C1.377:** pendiente tras publicar.
- **Beta:** BETA-FUNC-018 requiere confirmar provisionamiento idéntico y privado de Script Properties en los seis despliegues, login y verificación cruzada; Pendiente beta.
- **Estado:** AUD-NG-001/002 continúan abiertos hasta verificar configuración real y ejecución; TASK-636 En ejecución.


## Revisión focalizada C1.378 — frontera pública de ACADEMIC, métricas globales y cierre académico

- Se audita la allowlist pública de ACADEMIC: solo `ping`, `createAdmissionRequest`, `getPublicAdmissionStatus`, `saveAdmissionDraft` y `getAdmissionDraft`.
- Las tres capacidades de admisión consultadas usan token opaco de 64 caracteres hexadecimales; el almacenamiento conserva SHA-256 y la consulta de estado devuelve una proyección mínima (solicitud, fecha, año, grado y estado), sin identificación, responsable, teléfono, correo u observaciones.
- `getDriveStorageQuotaMetricsReport` en TASK exige rol verificado Administrador/Desarrollador antes de acceder a Drive; no confía en `payload.authRole`.
- `closeAcademicYear` permanece fail-closed con `BACKUP_REQUIRED` y sin efectos destructivos; no se habilita mientras no exista certificación aislada de backup/restore/rollback.
- **Pruebas añadidas:** contrato local verifica allowlist exacta, exclusión de acciones sensibles, capability y minimización de datos, hash de borradores, guardia de métricas y cierre no destructivo.
- **CI C1.377:** Task-Service security run 42729179413 success; backup/restore run 42729179412 success. Identity mapping run 42729179521 failure en TASK-030: actual `['EXP-02','STU-02']`, esperado `[]`; se mantiene como incidencia independiente.
- **CI C1.378:** pendiente tras publicar.
- **Estado:** AUD-NG-002/306 y AUD-NG-369 se mantienen en revalidación; TASK-636 sigue En ejecución.
