# AUDITORÍA TAREA-F7-IMP-11
## Fortalecer la coherencia y actualización de los portales relacionados

- **Fecha:** 2026-11-08.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** 0c75acd298e7b94dcb80cdbe53d0d5a6699f9ef6 (C1.242).
- **Checkpoint inicial:** C1.242. **Checkpoint de cierre:** C1.243.
- **ID de sesión operativo:** IMA-AUDIT-20261108-0044Z (identificador documental, no ID nativo de ChatGPT).
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica [X] de completadas.md.
- **Severidad global:** ALTA/P1.

## 1. Alcance y criterios

Se contrastaron CA-F7-69..74 con fuente de datos HorariosClase/OfertaAcademica, getClassSchedules, getStudentSchedule, RBAC/contextual access, fetchApi, portales Docente/Estudiante-Familia/Secretaría, caché, estados de publicación/cancelación, concurrencia de respuestas y preservación de registros históricos de asistencia/evaluación.

## 2. Integridad documental y fuentes

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: tarea [X] y criterios CA-F7-69..74. No se modifica.
- El informe individual AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-11.md no existía; se crea.
- El origen citado AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md no existe en raíz ni en AUDITORIAS. Se omite ese documento, no la auditoría.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, entrada del 2026-10-26: afirma que getStudentSchedule agrega lastSyncTime/freshnessToken/totalActiveSlots y que el portal muestra sincronización y botón de actualización. La implementación parcial existe en backend/JS, pero faltan los nodos HTML que el controlador requiere.
- METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee: se aplica inspección manual y tareas derivadas dentro del informe. Pendientes.md queda fuera del flujo operativo y no se consulta ni modifica.
- Se verificó que AUD-NG-246 y TASK-584..TASK-589 no aparecen en los registros de auditoría consultados antes de esta iteración.

## 3. Evidencia técnica

### 3.1 Interfaces desconectadas del DOM
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71 carga js/teacher.js (línea 1466), pero no contiene schedules-table-body, schedule-builder-form, btn-load-schedules-list ni sch-matrix-mode. js/teacher.js loadMasterSchedules (664-682) retorna si no existe schedules-table-body; el listener de carga (1908) no encuentra botón.
- student-dashboard.html SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1 carga js/student.js (línea 398), pero no contiene student-schedule-container, btn-refresh-student-schedule ni family-student-switcher-container. initFamilyStudentSwitcher (184-260) y fetchAndRenderStudentSchedule (884-954) retornan al faltar esos nodos.
- dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8 carga js/secretary.js, pero no contiene una vista de horario; js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c no consume getClassSchedules/getStudentSchedule. Se registra como brecha de alcance, sin presumir una vista de Secretaría si no está definida.
- El árbol de la rama solo contiene estos tres HTML de portal y los tres módulos JS correspondientes; no se encontró otra página de horario que supla los nodos ausentes.

### 3.2 Contrato de HorariosClase y estados
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; getOrCreateSheet declara HorariosClase con ocho columnas (114). createClassSchedule (6900-6990) escribe nueve valores, agregando UltimaModificacion; otras rutas de plantillas usan estructuras de once columnas con grado/sección/estado en posiciones diferentes.
- getClassSchedules (6718-6770) interpreta grado/sección/estado como r[7]/r[8]/r[9]. En filas canónicas de nueve columnas, r[7] es Estado y r[8] es UltimaModificacion; la UI docente presenta el estado como grado, la fecha como sección y usa Activo por defecto.
- getClassSchedules filtra Cancelado en r[9]/r[10], no excluye el estado canónico r[7] === Inactivo ni exige Activo/Publicado.
- getStudentSchedule (7985-8082) excluye únicamente r[7] === Inactivo; no exige Activo/Publicado y puede incluir Borrador. En filas heredadas de once columnas tampoco inspecciona el estado ubicado en r[9].

### 3.3 Caché, frescura y concurrencia
- getClassSchedules genera una clave de seis segmentos schedules_<año>_<grado>_<sección>_<docente>_<oferta>_<aula> y TTL de 600 segundos (6720-6729, 6762-6769).
- createClassSchedule, deleteClassSchedule y publishClassSchedules no llaman invalidateScheduleCache. El listado docente puede permanecer obsoleto hasta diez minutos.
- invalidateScheduleCache (13813-13833) elimina patrones de cuatro segmentos que no coinciden con la clave de seis segmentos; aunque se invoca en otros flujos, no corrige la ausencia de invalidación en las operaciones principales.
- getStudentSchedule genera lastSyncTime/freshnessToken a partir de la hora de consulta (8068-8080), no de una revisión de fuente. js/student.js muestra lastSyncTime, pero no consume freshnessToken ni compara versiones; con cero horarios retorna antes de mostrar metadatos.
- fetchAndRenderStudentSchedule no secuencia ni cancela solicitudes y no valida que currentUser siga siendo el mismo al recibir la respuesta. Al cambiar estudiante (student.js:240-253), una respuesta tardía puede pintar el horario anterior. loadMasterSchedules tampoco descarta respuestas fuera de orden.

### 3.4 Autorización y credenciales
- validateRolePermission (524-583) exige sessionToken/authToken/token. js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, fetchApi (39-58), solo agrega requesterUserId/requesterRole y no transmite esos tokens. Las llamadas a getClassSchedules/getStudentSchedule no los incluyen y son rechazadas antes del dispatcher.
- ROLE_PERMISSIONS permite getStudentSchedule a Estudiante/Alumno y Padre/Tutor/Responsable; getClassSchedules también está permitido a varios de esos roles.
- validateContextualAccess (465-521) ata userId propio solo para Estudiante/Alumno. No valida relación activa Padre/Tutor/Responsable-estudiante. getStudentSchedule acepta userId/grado/seccion del payload y no deriva siempre el ámbito desde matrícula verificada.
- Para Estudiante/Alumno se comprueba userId, pero no se impide grado/seccion arbitrarios. getClassSchedules no ata docenteUserId/oferta/grado/sección al ámbito verificado. Una llamada directa autenticada puede consultar recursos fuera de su ámbito.
- TASK-567/AUD-NG-001 se amplía para credenciales; la autorización contextual se separa en TASK-586.

### 3.5 Errores e historial
- fetchApi (142-190) convierte fallos de red de acciones GET en {status: success, data: [], isFallback: true}. loadMasterSchedules trata cualquier success como respuesta válida y puede mostrar un error de red como horario vacío.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683 no contienen TAREA-F7-IMP-11, getStudentSchedule, freshnessToken ni CA-F7-69..74.
- runAcademicPlanningRegressionSuite (14108-14173) solo contiene TC-F7-01..07 sobre conflictos, carga docente, restricciones, capacidad, sustituciones, plantillas y logs; no prueba sincronización, filtros, caché, respuestas concurrentes, estados ni permisos.
- createClassSchedule/deleteClassSchedule/publishClassSchedules inspeccionados no escriben directamente en registros históricos de asistencia/evaluación. Sin pruebas conductuales que verifiquen vínculos históricos durante reprogramaciones, CA-F7-74 queda parcial.

## 4. Resultado por criterio

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-69 | NO CUMPLE | Faltan nodos HTML; controladores retornan sin renderizar; falta token y no se invalida caché tras mutaciones. |
| CA-F7-70 | PARCIAL | fetchApi convierte fallos GET de red en success/data[]; el portal docente puede mostrar lista vacía. Estudiante muestra error genérico en algunas respuestas. |
| CA-F7-71 | NO CUMPLE | No hay control de orden; freshnessToken se ignora; caché de 600 s puede quedar obsoleta. |
| CA-F7-72 | NO CUMPLE | Falta token; no se verifica vínculo de tutor ni ámbito de docente/oferta/grado/sección. |
| CA-F7-73 | NO CUMPLE | getStudentSchedule incluye Borrador; getClassSchedules interpreta columnas incompatibles y no filtra estados canónicos. |
| CA-F7-74 | PARCIAL | Los writes inspeccionados no mutan directamente asistencia/evaluación, pero no hay pruebas de preservación histórica. |

## 5. Hallazgo nuevo

- **AUD-NG-246 (ALTO/P1):** sincronización multiportal incompleta e insegura por ausencia de nodos de interfaz, contratos de fila incompatibles, publicación de borradores, invalidación de caché defectuosa, respuestas fuera de orden y autorización contextual insuficiente.
- Relaciones: AUD-NG-001, AUD-NG-236, AUD-NG-237, AUD-NG-243, AUD-NG-244 y AUD-NG-245.

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

**TASK-584 - Conectar las interfaces reales de horarios en los portales**
- Hallazgo: AUD-NG-246, sección 3.1. Severidad: ALTO/P1.
- Objetivo/acción: agregar y conectar nodos, controles y estados de carga/vacío/error para Docente y Estudiante/Familia; definir explícitamente si Secretaría requiere vista propia.
- Archivos: teacher-dashboard.html; student-dashboard.html; dashboard-secretaria.html si aplica; js/teacher.js; js/student.js; js/secretary.js.
- Dependencias: TASK-585, TASK-586, TASK-588.
- Alcance: no duplicar vistas aprobadas; asegurar que cada controlador encuentre sus nodos y que los controles ejecuten consultas reales.
- Aceptación: todos los IDs usados existen en el HTML servido; carga/actualización/estado vacío/error funcionan; cada portal incluido muestra solo el horario pertinente.
- Prioridad: P1. Estado: Pendiente.

**TASK-585 - Unificar el contrato HorariosClase y filtrar solo asignaciones publicadas**
- Hallazgo: AUD-NG-246, sección 3.2. Severidad: ALTO/P1.
- Objetivo/acción: definir esquema único versionado y DTO explícito; normalizar filas heredadas; filtrar Activo/Publicado y excluir Borrador/Inactivo/Cancelado.
- Archivos: backend/academic-service/Code.gs; esquema/migración HorariosClase; js/teacher.js; js/student.js.
- Dependencias: AUD-NG-244, TASK-584.
- Aceptación: filas canónicas/heredadas producen el mismo DTO; borradores y cancelados nunca se presentan como vigentes; filtros año/grado/sección coinciden con OfertaAcademica; migración idempotente conserva IDs y timestamps.
- Prioridad: P1. Estado: Pendiente.

**TASK-586 - Aplicar autorización contextual a consultas de horarios**
- Hallazgo: AUD-NG-246, sección 3.4. Severidad: ALTO/P1.
- Objetivo/acción: limitar consultas al estudiante, responsable, docente y oferta realmente autorizados.
- Archivos: backend/academic-service/Code.gs; backend/user-service/Code.gs si se requieren relaciones; js/api.js.
- Dependencias: TASK-567 ampliada, TASK-584.
- Alcance: validar relación activa Padre/Tutor/Responsable-estudiante; derivar grado/sección desde matrícula verificada; limitar docentes a asignaciones propias; rechazar filtros arbitrarios y llamadas directas fuera de ámbito.
- Aceptación: estudiante no consulta otro userId ni sección ajena; responsable solo consulta estudiantes vinculados; docente solo sus asignaciones; llamadas sin token o con identidad ajena se rechazan; pruebas negativas cubren IDOR.
- Prioridad: P1. Estado: Pendiente.

**TASK-587 - Corregir invalidación de caché y control de frescura/respuestas concurrentes**
- Hallazgo: AUD-NG-246, sección 3.3. Severidad: ALTO/P1.
- Objetivo/acción: alinear constructor de claves/invalidador, invalidar tras crear/editar/desactivar/publicar/reprogramar, usar revisión persistente y descartar respuestas antiguas.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; js/student.js; js/api.js.
- Dependencias: TASK-585.
- Aceptación: cambios confirmados aparecen en la siguiente consulta sin esperar TTL; invalidación elimina claves reales; respuesta tardía se descarta; cambiar estudiante no muestra datos previos; token cambia solo cuando cambia la fuente.
- Prioridad: P1. Estado: Pendiente.

**TASK-588 - Diferenciar fallos de consulta, datos vacíos y datos obsoletos**
- Hallazgo: AUD-NG-246, sección 3.5. Severidad: ALTO/P1.
- Objetivo/acción: impedir que errores de red/autorización se presenten como consultas exitosas vacías y conservar el último dato válido con etiqueta obsoleta cuando aplique.
- Archivos: js/api.js; js/teacher.js; js/student.js; teacher-dashboard.html; student-dashboard.html.
- Dependencias: TASK-584, TASK-587.
- Aceptación: fallos HTTP/red/RBAC nunca se interpretan como horario vacío; vacío solo se muestra tras respuesta válida; UI diferencia error y dato obsoleto e incluye reintento.
- Prioridad: P1. Estado: Pendiente.

**TASK-589 - Crear regresión conductual para CA-F7-69..74**
- Hallazgo: AUD-NG-246. Severidad: ALTO/P1.
- Objetivo/acción: probar portales, autorización, estados, caché, respuestas fuera de orden e historial.
- Archivos: tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js; suites aisladas ACADEMIC/USER.
- Dependencias: TASK-584..TASK-588.
- Aceptación: pruebas positivas/negativas por criterio; borrador/cancelación/inactivación; invalidación; concurrencia/cambio de estudiante; IDOR; error de red; invariancia de asistencia/evaluación; entorno aislado sin Sheets productivas.
- Prioridad: P1. Estado: Pendiente.

### Tarea existente ampliada
- **TASK-567 (AUD-NG-001):** incluir sessionToken/authToken/token desde fetchApi para getClassSchedules/getStudentSchedule y usar _verifiedUserId/_verifiedRole en backend. La autorización contextual de recursos queda en TASK-586; no se duplica autenticación.

## 7. Pruebas y límites

- Ejecutadas: inspección estática manual focalizada de contratos, funciones, roles, filtros, HTML/DOM, API, caché, consumidores, suites, SHAs y estado Git.
- No ejecutadas: Apps Script runtime, HTTP/OAuth, navegador/DOM real, CacheService, Sheets productivas, concurrencia E2E, reprogramación con registros históricos ni suites Node.
- No se modificó código, UI, pruebas, datos productivos, completadas.md, ChangesLogs.txt ni Pendientes.md.

## 8. Archivos y respaldos

- Nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-11.md.
- Actualizados: AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- Sin cambios: backend/academic-service/Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; js/student.js e2888cea60322e49a40b89adadb8010489605dcc; js/secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; student-dashboard.html 6379ea0ed39d71b89747a0280bb925fdf12202c1; dashboard-secretaria.html fa0d8c23aace24a6acab2d4956398a7f5e1309b8; tests/regression/academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; tests/regression/modular-dashboard-suite.js 0495e1d526a872c33310935a003a83d924d34683; completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; METODOLOGIA_DESARROLLO.md cf796728bb384a32537392df2f9c72a339fa03ee.
- No se modificó la rama base.

## 9. Continuidad

Siguiente tarea: TAREA-F7-IMP-12, reportes de carga docente, ocupación y calidad de planificación (CA-F7-75..80). Verificar informe individual y origen; auditar getTeachingHoursSummary, getCurricularAnalyticsReport, getTeacherTeachingLoad, getPlanningQualityAndOccupancyReport, filtros, permisos, exportaciones y pruebas.
