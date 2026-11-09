# AUDITORÍA TASK-638 — C1.299: autorización contextual, archivos y mutaciones TASK/EXAM

- **Sesión:** `IMA-AUDIT-20261109-1232Z-01`; checkpoint inicial C1.298; checkpoint de cierre C1.299; sesión cerrada.
- **Repositorio/rama:** `i-miss-cocaine/IMA` / `NG_beta_0.0.0.1_work`.
- **HEAD de partida verificado:** `7520d0b8471d8bb508fe808191a5d55bb2b126bd`; tree `3ed927303b3550f223cb96adc5f741be2825160b`; 1.024 blobs; árbol recursivo no truncado.
- **Rama base protegida:** `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`; 371 commits adelante, 0 detrás.
- **Tarea:** TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo; PM-00; En ejecución.
- **Requisito íntegro:** `pendientes/Contabilidad/Pendientes.md`, TASK-638. Exige documentar dependencias por archivo, rutas, endpoints, acciones backend, contratos, consumidores/proveedores y evidencia; no cambiar rutas ni contratos durante la auditoría.
- **Continuidad C1.298:** HEAD coincide con el commit C1.298. El commit anterior contiene 10 archivos documentales, sin cambios de código. Se revisaron requisito original, informe C1.298, mapa y checkpoint.
- **Recuperación de TASK-636:** `pendientes/Otros/Pendientes.md` tiene blob SHA `e9637ecc6f88b2aa0aec75909538e072509bf507`, tamaño Git 1.647.413 bytes. `fetch_file` devolvió 0 caracteres para ese archivo grande, pero el blob directo se recuperó con 1.627.709 caracteres y contiene el bloque completo TASK-636. No está vacío ni corrupto; no restaurar ni modificar.
- **Fuentes:** TASK Code.gs `1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe`; EXAM Code.gs `1d93296628fae31f680004f637897e2b1314a64c`; teacher.js `c475fce5afcd28fca23e7b64398ad32b17773746`; student.js `e2888cea60322e49a40b89adadb8010489605dcc`; api.js `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`.

## 1. Continuidad y requisito

- La rama de trabajo y el HEAD verificado coinciden con el checkpoint C1.298. La comparación con la rama base confirma 371 commits adelante y 0 detrás; no se modificó la base.
- El checkpoint C1.298 y su commit fueron contrastados: los diez archivos incluidos coinciden con el informe; no se incluyó código fuente.
- Se leyó el requisito íntegro TASK-638 en `pendientes/Contabilidad/Pendientes.md`. TASK-637 sigue verificada y Completada; TASK-638 sigue En ejecución.
- Se recuperó el requisito original TASK-636 desde el blob versionado. La lectura vacía del wrapper no es evidencia de archivo vacío; no se registró como corrupción ni se realizó restauración.
- El análisis continúa limitado a auditoría/documentación. No se modifican handlers, contratos, rutas ni datos.

## 2. TASK — trazas de autorización, consumidor y persistencia

| Acción | Consumidor / llamada | Handler y persistencia | Autorización/ámbito observado |
|---|---|---|---|
| `closeAcademicYear` | `js/teacher.js:2915`; envía `profesorId=currentUser.userId` y `format` | `backend/task-service/Code.gs:524`; borra filas de `Entregas`, manda a papelera archivos/carpetas Drive, borra filas `Tareas` y `ConfiguracionAcademica`, registra `Log_Cierres` | Profesor está autorizado en ROLE_PERMISSIONS. El filtro profesorId no se aplica al bucle de Entregas ni a sus archivos. |
| `deleteFile` | `js/student.js:2057,2504`; envía solo `fileId` | TASK Code.gs:1049; `DriveApp.getFileById(fileId).setTrashed(true)` | Estudiante/Alumno están autorizados. No comprueba propietario, tarea, entrega ni relación del archivo con el usuario. |
| `getTeacherActivity` | `js/teacher.js:3017,3525,3610,4596` | TASK Code.gs:1119; lee `Usuarios`, `Tareas`, `Entregas` | El filtro profesorId solo se aplica si el cliente lo envía; no se deriva de claims. Sin filtro puede devolver toda la actividad. |
| `getSubmissionDocumentPreviewUrl` | `js/teacher.js:1207`; envía solo `fileId` | TASK Code.gs:2367; DriveApp obtiene metadatos y construye preview/download URL | Requiere token en validateRolePermission y vuelve a verificar token en handler; el consumidor no lo envía por fetchApi. Además, el handler espera una propiedad `valid` que verifySessionToken no crea. |

### AUD-NG-368 — MEDIO/P2 — Previsualización documental rechaza tokens válidos por contrato incompatible

- `verifySessionToken` (TASK Code.gs:145) retorna el objeto `claims` cuando la firma, expiración y estado de cuenta son válidos; no agrega una propiedad booleana `valid`.
- `getSubmissionDocumentPreviewUrl` (TASK Code.gs:2367) verifica `!sessionCheck || !sessionCheck.valid`. Por tanto, incluso si recibe un token válido, `sessionCheck.valid` es undefined y la función rechaza la sesión.
- El consumidor `js/teacher.js:1207` llama con `{ fileId }`; `fetchApi` (js/api.js:11+) solo agrega requesterUserId/requesterRole y no inyecta sessionToken/authToken/token. El rechazo previo por ausencia de token está relacionado con AUD-NG-001/TASK-636 y no se duplica; la comprobación `.valid` es una incompatibilidad adicional.
- **Impacto:** la previsualización no puede completar su flujo aun con credencial válida; no se afirma que se haya ejecutado contra deployment.
- **Derivación:** ampliar TASK-636 para unificar contrato de claims, propagación de token y autorización de propiedad antes de emitir URL.

### AUD-NG-369 — CRÍTICO/P0 — Cierre de año elimina globalmente entregas y archivos sin respaldo verificable

- `closeAcademicYear` (TASK Code.gs:524) está permitido para el rol Profesor en ROLE_PERMISSIONS (línea 91+); el consumidor docente lo invoca con su propio profesorId (`js/teacher.js:2915`).
- El bucle de Entregas recorre todas las filas desde el final, manda a papelera cada fileId/carpeta y ejecuta `deleteRow` en todas las filas. No consulta el profesorId ni comprueba la tarea propietaria antes de borrar.
- El filtro profesorId se aplica después únicamente al borrado de filas de `Tareas` y a filas de `ConfiguracionAcademica`; por ello el borrado de entregas y archivos es global incluso cuando se envía profesorId.
- `backupId` se genera como cadena `BACKUP-${timestamp}` y se registra en `Log_Cierres`, pero el handler no crea ni verifica una copia de seguridad antes de borrar. El UI confirma al usuario que se archivará un respaldo.
- **Impacto:** un profesor autorizado puede provocar pérdida global de entregas y recursos Drive de otros docentes; no existe evidencia en el handler de respaldo restaurable previo. Es un riesgo de pérdida de datos crítico.
- **Derivación:** ampliar TASK-636; separar cierre granular de profesor y reset global administrativo; exigir respaldo real verificado, ámbito derivado de claims, confirmación administrativa y rollback antes de cualquier borrado.

### AUD-NG-370 — ALTO/P1 — deleteFile permite a estudiantes mandar a papelera archivos ajenos

- ROLE_PERMISSIONS de TASK incluye `deleteFile` para Estudiante y Alumno.
- `deleteFile` (TASK Code.gs:1049) recibe solo `fileId`, obtiene el objeto por DriveApp y ejecuta `setTrashed(true)`; no valida usuario propietario, carpeta, tarea o entrega.
- Los consumidores de student.js:2057 y 2504 envían únicamente el ID del archivo.
- **Impacto:** cualquier estudiante autenticado con permiso de acción puede intentar borrar cualquier recurso accesible por la identidad de ejecución del Apps Script, no solo sus archivos.
- **Derivación:** ampliar TASK-636; validar propietario/relación servidor-side y denegar por defecto los IDs ajenos.

### AUD-NG-371 — ALTO/P1 — Actividad de docente TASK/EXAM se filtra por un profesor opcional del cliente

- TASK `getTeacherActivity` (Code.gs:1119) y EXAM `getTeacherExamActivity` (Code.gs:1176) aceptan `profesorId`, `grado` y `seccion` del payload.
- Ambos comparan profesorId únicamente si el campo tiene valor. Si se omite, el filtro de profesor no se aplica; si se suplanta, se puede consultar actividad de otro profesor.
- `validateContextualAccess` de ambos servicios solo restringe self-ID para Estudiante/Alumno; no vincula Profesor con su identidad ni grupos asignados.
- Consumidores: teacher.js TASK:3017,3525,3610,4596; EXAM:3018,3618,4597.
- **Impacto:** exposición potencial de entregas, nombres, emails, grados, secciones, notas y comentarios de grupos ajenos.
- **Derivación:** ampliar TASK-636 para TASK y TASK-685 para EXAM; derivar profesorId de claims y comprobar asignaciones/grupos en servidor; los filtros cliente solo pueden estrechar el ámbito ya autorizado.

## 3. EXAM — trazas de libro de calificaciones y autorización contextual

| Acción | Consumidor / handler | Persistencia / respuesta | Control observado |
|---|---|---|---|
| `getGradebookData` | teacher.js:5237; EXAM Code.gs:1458 | Lee `Usuarios`, `CalificacionesEstudiantes`, `RecuperacionesEstudiante`, `CategoriasEvaluacion`, `CierresPeriodos`; devuelve alumnos, notas, recuperaciones y estado | Acepta grado/seccion/profesorId del payload; profesorId se desestructura pero no se usa; no comprueba asignación docente. |
| `saveGradebookGrades` | teacher.js:5385; EXAM Code.gs:1533 | Inserta/actualiza `CalificacionesEstudiantes` | Acepta lista de userId/evaluacionId y authRole del payload; no comprueba que los estudiantes pertenezcan al ámbito del docente. |
| `saveStudentRecovery` | teacher.js:5343; EXAM Code.gs:1722 | Inserta `RecuperacionesEstudiante` | Acepta userId y autorizadoPor del cliente; no verifica relación docente-estudiante. |
| `closePeriodGradebook` | teacher.js:5417; EXAM Code.gs:1832 | Inserta cierre en `CierresPeriodos` y llama `publishGradebookForContext` | Profesor puede enviar cualquier grado/sección/asignatura/período; no se comprueba asignación. |
| `getStudentAcademicReport` | teacher.js:2992; EXAM Code.gs:2043 | Lee `Matriculas`, `CalificacionesEstudiantes`, `RecuperacionesEstudiante`, categorías | Padre/Tutor/Responsable/Profesor están autorizados; acepta userId libre. Solo el rol Estudiante/Alumno recibe comparación self-ID en validateContextualAccess; no se verifica vínculo de tutor ni ámbito docente. |
| `getStudentRecoveries` | EXAM Code.gs:1769 | Lee `RecuperacionesEstudiante` y filtra opcionalmente por userId/evaluacionId | Roles Padre/Tutor/Responsable permitidos; no comprueba vínculo con el estudiante. |
| `getExamGradeDistributionAnalytics` | teacher.js:4388; EXAM Code.gs:733 | Lee `Examenes` y `EntregasExamen` por examenId | No comprueba que el examen pertenezca al docente autenticado. |

### AUD-NG-372 — ALTO/P1 — Handlers EXAM omiten el ámbito docente y la relación tutor-estudiante

- EXAM ROLE_PERMISSIONS autoriza Profesor para libro de calificaciones, recuperaciones, cierres, analítica y reporte académico; Padre/Tutor/Responsable pueden consultar reporte y recuperaciones.
- `validateContextualAccess` (EXAM Code.gs:191) solo compara el target ID con el verifiedUserId para Estudiante/Alumno; no comprueba relación vigente Padre/Tutor/Responsable-estudiante ni asignación docente.
- `getGradebookData` (1458) acepta grado/seccion y profesorId pero no utiliza profesorId para limitar alumnos/notas.
- `getStudentAcademicReport` (2043) y `getStudentRecoveries` (1769) consultan por userId recibido; la relación tutor/estudiante no se verifica.
- `saveStudentRecovery` (1722), `saveGradebookGrades` (1533) y `closePeriodGradebook` (1832) mutan datos/estado con IDs y contexto del cliente, sin comprobar asignación del profesor. `getExamGradeDistributionAnalytics` (733) consulta por examenId sin validar propiedad docente.
- **Impacto:** acceso o mutación fuera del ámbito académico autorizado; la inspección es estática y no prueba que existan datos reales de otros grupos.
- **Derivación:** ampliar TASK-685; aplicar ABAC servidor-side para docentes y guardianes, derivar identidad/actor de claims, comprobar relaciones vigentes y scope por grupo/asignatura/período antes de leer o mutar.

### AUD-NG-373 — ALTO/P1 — saveGradebookGrades confía en authRole del payload para modificar períodos cerrados

- `saveGradebookGrades` (EXAM Code.gs:1533) desestructura `authRole` desde payload y permite guardar sobre un período cerrado cuando `authRole` es `Secretaría`, `Administrador` o `Director`.
- ROLE_PERMISSIONS autoriza Profesor a llamar `saveGradebookGrades`; `validateRolePermission` verifica token y añade `_verifiedRole`, pero el handler no usa esa identidad verificada para el control de período.
- Un usuario con rol Profesor puede modificar el payload y enviar `authRole: "Secretaría"` o `"Administrador"` para superar la condición, aunque sus claims no tengan ese rol.
- **Impacto:** bypass de la protección de cierre y modificación no autorizada de calificaciones de períodos cerrados.
- **Derivación:** ampliar TASK-685 y TASK-636; el handler debe usar exclusivamente rol/actor derivado de claims verificados y una autorización explícita de reapertura/rectificación; ignorar campos de rol del cliente.

## 4. Reconciliación de tareas derivadas

- **TASK-636 existente (PM-01, P0):** ampliar con AUD-NG-368, AUD-NG-369, AUD-NG-370, AUD-NG-371 (parte TASK) y AUD-NG-373. Mantener su ID e historial. Requisitos originales recuperados íntegramente del blob de `pendientes/Otros/Pendientes.md`; el blob actual es válido y no debe reconstruirse.
- **TASK-685 existente:** ampliar con AUD-NG-371 (parte EXAM), AUD-NG-372 y AUD-NG-373. Mantener su ID e historial; no crear IDs duplicados.
- **Dependencias:** estas correcciones de seguridad pertenecen a PM-01; no se implementan durante TASK-638/PM-00. TASK-638 sigue en auditoría; TASK-639 permanece no elegible hasta cerrar TASK-638.
- **Criterios añadidos a TASK-636:** (1) cierre de año por profesor solo elimina recursos de tareas que le pertenecen y nunca borra entregas globales; (2) ningún borrado irreversible ocurre sin respaldo real y restaurable verificado; (3) deleteFile deniega fileId sin propiedad comprobada; (4) actividad y preview usan claims/contexto y token vigente; (5) un campo requesterRole/authRole del cliente nunca concede permisos.
- **Criterios añadidos a TASK-685:** (1) profesor solo consulta/muta alumnos, evaluaciones y períodos de grupos/asignaturas asignados; (2) Padre/Tutor/Responsable solo accede a estudiantes con vínculo vigente; (3) getStudentAcademicReport/getStudentRecoveries no aceptan userId ajeno; (4) operaciones de notas/recuperación/cierre derivan actor de claims; (5) authRole del payload no puede anular cierre de período; (6) pruebas negativas/positivas para cada rol y scope.
- No se generaron IDs de tarea nuevos ni se cambió el estado de tareas de producto.

## 5. Pruebas y límites

**Ejecutadas:** verificación de rama/HEAD/base/tree; lectura íntegra de TASK-638 y recuperación del bloque TASK-636; revisión del commit/informe/checkpoint C1.298; inspección estática de dispatchers, PUBLIC_ACTIONS, ROLE_PERMISSIONS, validateContextualAccess, verifySessionToken, handlers y callsites de TASK/EXAM; cruce de persistencia Sheets/Drive; comparación de contratos de token.

**No ejecutadas:** Node, navegador, HTTP, Apps Script runtime, Drive, Sheets, pruebas con cuentas/roles, concurrencia, integración, regresión o E2E. No se inspeccionaron datos productivos ni se verificaron deployments/Script Properties. No se realizaron operaciones destructivas ni cambios de código.

## 6. Archivos y estado

- **Modificados:** informe C1.299; Auditoria.txt; Auditoría/MapaDependencias.md; tareas_auditoria.txt; changueslogs.txt; Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md; Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt; Auditoría/INDICE_CHECKPOINTS.md; docs/architecture/repository-inventory.md.
- **Revisados sin modificación:** METODOLOGIA_DESARROLLO.md; pendientes/Contabilidad/Pendientes.md; pendientes/Otros/Pendientes.md (blob recuperado íntegro); backend/task-service/Code.gs; backend/exam-service/Code.gs; js/student.js; js/teacher.js; js/api.js; Auditoría/Contexto_personal.txt; Auditoría/AUDITORIA_TASK-638_C1.298.md.
- **Código fuente:** sin modificaciones.

## 7. Dictamen y siguiente acción reproducible

**TASK-638 continúa En ejecución; no cumple aún el cierre global.** Se completó otra unidad de trazabilidad de TASK/EXAM: archivos, entregas, cierres, actividad docente, libro de calificaciones, recuperación y reporte académico. Los hallazgos 368–373 se registraron y se asociaron a TASK-636/TASK-685.

Siguiente acción: continuar `Auditoría/MapaDependencias.md`, sección C1.299; completar las acciones TASK/EXAM restantes no cubiertas en la matriz, revisar las dependencias de helpers y respuestas, y continuar USER/ACADEMIC/ACCOUNTING hasta cerrar cada callsite → dispatcher → handler → claims/contexto → persistencia → respuesta/error. Después verificar endpoints/deployments con evidencia autorizada. No implementar correcciones durante PM-00.

**Siguiente tarea tras cerrar TASK-638:** TASK-639 — Verificar duplicaciones, símbolos globales y ciclos; requisito en `pendientes/Secretaria/Pendientes.md`; depende de TASK-637 y TASK-638 verificadas.
