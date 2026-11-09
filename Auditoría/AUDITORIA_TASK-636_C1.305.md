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
