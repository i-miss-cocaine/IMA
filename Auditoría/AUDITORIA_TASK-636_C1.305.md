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
