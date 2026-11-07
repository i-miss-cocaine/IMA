# AUDITORÍA TÉCNICA - TAREA-F7-IMP-02: Implementar una matriz visual de planificación y disponibilidad

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2151Z-01 (no es ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.233  
**Checkpoint de cierre:** C1.234  
**HEAD auditado:** d13b3d902d973c4263dc6cbad479863b1dd48513  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- Rama base NG_beta_0.0.0.1: HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; rama de trabajo 301 commits adelante y 0 atrás. El HEAD de trabajo coincide con el commit C1.233 d13b3d902d973c4263dc6cbad479863b1dd48513; árbol de partida e767504d3819a30f0001e76646f3e13e61b98888.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F7-IMP-02 aparece [X], línea aproximada 3903; criterios CA-F7-09..CA-F7-16. La marca histórica se conserva y no se toma como evidencia funcional.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-02.md en el HEAD de trabajo. Se omite el informe previo inexistente y se audita directamente el alcance maestro de completadas.md.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff registra el 2026-10-26 la creación de renderSchedulePlanningMatrix/filterScheduleMatrix y afirma que se incorporó una barra de filtros a teacher-dashboard.html (líneas históricas 612-632). El archivo actual no contiene los IDs ni la tabla que el controlador necesita.
- Pendientes.md conserva SHA/blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c y su lectura convencional devuelve 0 caracteres; la recuperación e inventario se documentaron en C1.233. No se modifica.
- Alcance: perspectivas institucional/docente/sección/asignatura/aula/recurso; filtros combinados; ocupación y disponibilidad por intervalos; estados; detalle/acciones; permisos; actualización tras mutaciones; rendimiento, responsive y exportación.

## 2. Archivos y respaldos inmutables inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: getPlanningQualityAndOccupancyReport (línea 3525), getTeacherAssignments (6225), getClassSchedules (6718), getTeacherTeachingLoad (6773), getClassroomResources (7694), invalidateScheduleCache (13814), deleteClassSchedule (6992), publishClassSchedules (7008).
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: renderSchedulePlanningMatrix (592), filterScheduleMatrix (660), loadMasterSchedules (668), acciones de borrado y recarga.
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: 1.475 líneas; no contiene schedules-table-body, schedule-count-badge, sch-matrix-mode, sch-matrix-status, sch-matrix-search ni el formulario de planificación.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (11); se reutiliza el hallazgo de propagación de sesión AUD-NG-001.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6: no contiene TAREA-F7-IMP-02 ni pruebas de renderSchedulePlanningMatrix/filterScheduleMatrix.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683: sin casos de matriz de horarios.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- No se modificaron los archivos de código inspeccionados.

## 3. Hallazgos

### H1 - CRÍTICO/P0: la matriz no tiene contenedor ni controles en la interfaz publicada

renderSchedulePlanningMatrix busca schedules-table-body y schedule-count-badge; loadMasterSchedules busca schedules-table-body y retorna inmediatamente si no existe. teacher-dashboard.html no contiene esos IDs ni sch-matrix-mode, sch-matrix-status o sch-matrix-search. Por tanto, la función de renderizado no produce una vista en el dashboard auditado y loadMasterSchedules ni siquiera consulta getClassSchedules. La barra de filtros que describe ChangesLogs.txt no está presente en el archivo actual. El código JavaScript aislado no acredita una herramienta utilizable.

### H2 - ALTO/P1: perspectivas y filtros cubren solo una parte del alcance

renderSchedulePlanningMatrix ordena cuatro modos: institucional, docente, sección y aula. No implementa perspectivas por asignatura ni por recurso. Solo consulta un filtro de estado y búsqueda textual; no existen filtros combinables por año lectivo, período, jornada, sede, grado y sección. La búsqueda incluye día, oferta, grado, sección, aula y docente, pero no nombre de asignatura ni recursos. loadMasterSchedules solicita getClassSchedules con docenteUserId: currentUser.userId, limitando la consulta a la identidad actual y no a la matriz institucional/de coordinación requerida.

### H3 - CRÍTICO/P0: el DTO de horarios usa índices incompatibles con la escritura vigente

createClassSchedule escribe filas HorariosClase como [HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado, UltimaModificacion], por lo que Estado está en r[7] y UltimaModificacion en r[8]. getClassSchedules filtra cancelados en r[9]/r[10], interpreta r[7] como grado, r[8] como sección y r[9] como estado. En consecuencia, el estado real no se devuelve; grado puede mostrarse como "Activo"/"Borrador", sección como timestamp y el estado cae al valor por defecto "Activo". Los registros Inactivo/Cancelado no se excluyen correctamente. También asigna materia = ofertaId, no el nombre de la asignatura. Esto amplía AUD-NG-168.

### H4 - ALTO/P1: ocupación de aulas no responde a intervalos ni al año solicitado

getPlanningQualityAndOccupancyReport recibe anoLectivo, pero no filtra horarios por ese año. Calcula ocupación semanal agregada, no disponibilidad para un intervalo concreto; fija la capacidad como 40 horas por aula y suma bloques Cancelado si su estado está en r[7] y no es Inactivo. No proporciona huecos libres ni cruce simultáneo de docente/aula/grupo/recurso. getClassroomResources devuelve inventario, equipamiento y mantenimientos, pero no disponibilidad temporal por recurso. El CSV de ocupación no está conectado a la matriz del dashboard.

### H5 - ALTO/P1: asignaciones docentes y ámbitos temporales no alimentan filtros completos

getTeacherAssignments filtra por docenteUserId/ofertaId, devuelve fechas y estado, pero no acepta año, período, jornada, sede, grado o sección como filtros. getClassSchedules tiene algunos filtros por año/grado/sección/docente/oferta/aula, pero el controlador solo envía docenteUserId. No se acredita una consulta institucional que relacione ofertas, asignaciones docentes, secciones, aulas y recursos en el período seleccionado. El ámbito de consulta tampoco se prueba contra identidad/rol verificados.

### H6 - ALTO/P1: estados, detalle y acciones no cumplen la matriz requerida

La UI solo diferencia Borrador de cualquier otro estado, etiquetando todo lo demás como Publicado. No distingue Cancelado ni Conflicto pendiente. Cada fila ofrece únicamente un botón Eliminar; no hay selección de bloque para detalle completo ni acciones por estado/rol. El botón se renderiza sin comprobar permisos en el cliente. El backend mantiene RBAC para acciones privadas, pero la integración de token ya está afectada por AUD-NG-001 y no existe prueba de denegación/aceptación por rol en esta matriz.

### H7 - ALTO/P1: recarga posterior a mutaciones puede mostrar datos obsoletos

loadMasterSchedules vuelve a llamar getClassSchedules después de varias mutaciones, pero el backend almacena resultados en CacheService por 600 segundos. createClassSchedule, deleteClassSchedule y publishClassSchedules no llaman invalidateScheduleCache. El bypass depende de window.forceScheduleCacheBypass, que solo se consulta en loadMasterSchedules y no tiene otro escritor en js/teacher.js. Además, invalidateScheduleCache elimina claves fijas/incompletas que no reproducen el formato completo de cacheKey de getClassSchedules. La recarga no garantiza que la matriz refleje la última mutación.

### H8 - ALTO/P1: rendimiento, responsive y exportación no acreditados

getClassSchedules lee getDataRange().getValues() completo y renderSchedulePlanningMatrix genera todas las filas en una sola asignación innerHTML; no hay paginación, virtualización ni límite por ventana. La matriz no está presente en el HTML para verificar diseño responsive de escritorio/tablet/móvil. No hay controles de impresión/exportación de la matriz. Existe un CSV en getPlanningQualityAndOccupancyReport, pero es un reporte agregado separado y no una exportación de las perspectivas/filtros seleccionados.

### H9 - MEDIO/P2: falta de pruebas de integración y regresión de la matriz

Las suites inspeccionadas no contienen TAREA-F7-IMP-02, TC-F7-09..TC-F7-16 ni aserciones sobre DOM, perspectivas, filtros combinados, cancelaciones, permisos, invalidación de caché, grandes volúmenes o exportación. No se ejecutaron pruebas de navegador ni Apps Script.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-09: consultar ocupación de aula por intervalo | NO CUMPLE | Reporte agregado por horas semanales; no calcula disponibilidad de intervalo. |
| CA-F7-10: consultar horarios de docente y sección | NO CUMPLE | Vista no montada; carga solo docente actual y DTO interpreta columnas erróneas. |
| CA-F7-11: filtros combinados aplican todas las condiciones | NO CUMPLE | Solo modo, estado y búsqueda textual; faltan año/período/jornada/sede/grado/sección. |
| CA-F7-12: cancelados no aparecen como vigentes | NO CUMPLE | getClassSchedules lee estado de r[9], pero la escritura lo guarda en r[7]. |
| CA-F7-13: cambios se reflejan en todas las vistas | NO CUMPLE | DOM ausente, recarga retorna y caché no se invalida en mutaciones. |
| CA-F7-14: usuarios sin permiso no modifican | PARCIAL | Backend tiene RBAC, pero la UI muestra Eliminar sin control de rol y no hay pruebas integradas. |
| CA-F7-15: consultas respetan período/grupo/ámbito autorizado | PARCIAL | Hay filtros parciales y RBAC, pero el controlador solo pasa el docente actual; sin filtros temporales ni prueba de aislamiento. |
| CA-F7-16: horarios extensos no bloquean interacción | NO CUMPLE | Lectura completa y render masivo sin paginación/virtualización ni benchmark. |

**Dictamen global: TAREA-F7-IMP-02 NO CUMPLE.** La marca [X] histórica se conserva en completadas.md.

## 5. Registros relacionados y tareas ejecutables derivadas de los hallazgos

**Hallazgo nuevo:** AUD-NG-237 (P1), matriz de planificación no integrada, DTO de horarios inconsistente y disponibilidad/filtros incompletos.

**Registros existentes ampliados, sin duplicar alcance:**
- AUD-NG-168: esquema HorariosClase, consultas, asignaciones, años/estados y ocupación.
- AUD-NG-169: integración de interfaz, controles accesibles y responsive.
- AUD-NG-001: token/identidad para consultas y acciones privadas.

### [TASK-520] Integrar la matriz visual en el dashboard real
- **Hallazgo de origen:** AUD-NG-237 / H1-H2.
- **Severidad:** Crítico.
- **Objetivo:** ofrecer una matriz visible y operable desde el dashboard publicado.
- **Acción ejecutable:** incorporar contenedor, controles y tabla; conectar carga, renderizado, filtros, detalle y acciones; implementar seis perspectivas (institucional, docente, sección, asignatura, aula y recurso), estado vacío, responsive e impresión/exportación.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js.
- **Dependencias y riesgos:** navegación del dashboard, permisos, API ACADEMIC, responsive y accesibilidad.
- **Alcance:** vista de planificación F7-IMP-02; no sustituye el motor de conflictos F7-IMP-01.
- **Criterios de aceptación:** los IDs usados por el controlador existen; la matriz se monta y consulta datos; seis perspectivas funcionan; filtros y selección de detalle son utilizables; acciones dependen del rol; funciona en escritorio/tablet/móvil.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-521] Normalizar el DTO de horarios y su mapeo de columnas
- **Hallazgo de origen:** AUD-NG-237 / H3; amplía AUD-NG-168.
- **Severidad:** Crítico.
- **Objetivo:** representar fielmente estado, grado, sección, asignatura, docente, aula y fechas.
- **Acción ejecutable:** definir esquema canónico HorariosClase y mapear columnas por encabezado/índice centralizado; obtener asignatura/grupo desde OfertaAcademica; filtrar Cancelado/Inactivo con estado real; no inferir grado/sección desde Estado/timestamp.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** OfertaAcademica, AsignacionesDocentes, HorariosClase, CalendarioAcademico y reportes existentes.
- **Alcance:** consultas y DTO de la matriz; preservar compatibilidad de consumidores existentes mediante migración controlada.
- **Criterios de aceptación:** DTO devuelve valores reales; cancelados no se presentan vigentes; asignatura y sección corresponden a la oferta; filtros devuelven fixtures exactos.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-522] Implementar disponibilidad por intervalos y filtros temporales/organizativos
- **Hallazgo de origen:** AUD-NG-237 / H2/H4/H5; amplía AUD-NG-168.
- **Severidad:** Alto.
- **Objetivo:** calcular disponibilidad simultánea de docente, sección, aula y recursos en año/período/fecha concretos.
- **Acción ejecutable:** incorporar filtros año, período, jornada, sede, grado, sección y estado; calcular intervalos ocupados/libres por entidad; excluir estados no vigentes; relacionar mantenimientos y recursos; sustituir capacidad fija de 40h por disponibilidad configurable.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** AnosLectivos, PeriodosAcademicos, JornadasAcademicas, OfertaAcademica, AsignacionesDocentes, SedesAulas, MantenimientoAulas y catálogo de recursos.
- **Alcance:** consultas y visualización de disponibilidad; la validación final antes de guardar corresponde a F7-IMP-01.
- **Criterios de aceptación:** consulta por intervalo devuelve ocupación y huecos correctos; filtros combinados son acumulativos; no mezcla períodos/años; recursos simultáneos se validan con fixtures.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-523] Aplicar permisos y ámbitos a vistas y acciones de la matriz
- **Hallazgo de origen:** AUD-NG-237 / H5-H6; amplía AUD-NG-001 y AUD-NG-169.
- **Severidad:** Alto.
- **Objetivo:** que cada usuario vea y modifique solo lo autorizado.
- **Acción ejecutable:** propagar token/identidad verificada según AUD-NG-001; aplicar filtros de ámbito en servidor; mostrar/ocultar acciones por permiso y volver a validar toda mutación en backend.
- **Archivos/módulos afectados:** js/api.js; js/teacher.js; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** RBAC/ABAC, delegaciones, asignaciones docentes y privacidad institucional.
- **Alcance:** matriz y sus acciones; no crear una autenticación paralela.
- **Criterios de aceptación:** pruebas por rol/ámbito; usuario sin permiso no ejecuta mutaciones aunque invoque el endpoint directamente; docente no consulta períodos/grupos ajenos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-524] Invalidar correctamente la caché tras mutaciones de horarios
- **Hallazgo de origen:** AUD-NG-237 / H7.
- **Severidad:** Alto.
- **Objetivo:** que guardar, modificar, cancelar o publicar refleje datos actuales en todas las vistas.
- **Acción ejecutable:** unificar generación de cacheKey e invalidación; invocar invalidación desde todas las mutaciones; corregir claves incompletas o versionar la caché; evitar que el cliente dependa de un bypass global no configurado.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** CacheService, consultas por año/docente/oferta/aula y publicación de versiones.
- **Alcance:** caché de horarios y vistas derivadas; no purgar cachés ajenas al módulo.
- **Criterios de aceptación:** tras mutación, cada perspectiva devuelve inmediatamente el estado persistido; no se sirve resultado obsoleto por 600 segundos; pruebas cubren distintas combinaciones de filtros.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-525] Crear pruebas de matriz, permisos, rendimiento y exportación
- **Hallazgo de origen:** AUD-NG-237 / H8-H9.
- **Severidad:** Alto.
- **Objetivo:** demostrar los criterios CA-F7-09..CA-F7-16.
- **Acción ejecutable:** añadir fixtures y pruebas de perspectivas, filtros combinados, ocupación por intervalo, cancelación, actualización, permisos, caché, grandes volúmenes, responsive y exportación/impresión.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js; tests/regression; teacher-dashboard.html; js/teacher.js; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** entorno aislado, mocks de Apps Script, identidad/roles y dataset de horarios.
- **Alcance:** regresión funcional y de rendimiento de F7-IMP-02; no afirmar pruebas E2E si no se ejecutan en navegador.
- **Criterios de aceptación:** CA-F7-09..16 tienen pruebas verificables; se mide render con dataset grande; permisos se prueban por rol; exportación reproduce filtros; no se usan datos productivos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, ejecución y revisión.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual de DOM, controladores, perspectivas, filtros, DTO, esquema de HorariosClase, ocupación, recursos, asignaciones, caché, mutaciones, RBAC, historial y suites.
- **No ejecutadas:** navegador, Apps Script runtime, HTTP/OAuth, Sheets/Drive productivas, pruebas de carga, responsive en dispositivos, permisos E2E ni exportación real.
- **No se modificó código, tests, HTML, datos productivos, configuración ni despliegues.**
- Se preserva la marca histórica [X] de completadas.md y el blob de Pendientes.md.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-02: **NO CUMPLE**.
- Nuevo hallazgo AUD-NG-237; se amplían AUD-NG-168, AUD-NG-169 y AUD-NG-001.
- Tareas derivadas TASK-520..TASK-525: Pendientes.
- **Siguiente tarea cronológica:** TAREA-F7-IMP-03, “Desarrollar una herramienta de resolución asistida de conflictos”.
