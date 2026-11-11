# Informe de auditoría - Lote H2 y cierre de auditoría histórica

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD inspeccionado:** 5070c5341254943686be40007559774acde6e5e0  
**Tareas:** REQ-DOC-010, REQ-DOC-011 y REQ-DOC-012

## Alcance y método

Se revisaron el panel de desarrollador, el contrato de exportación, la configuración de horarios, el cálculo de desempeño estudiantil, el índice de asistencia, la autorización contextual del microservicio TASK y la trazabilidad de cambios de fecha límite.

También se contrastaron los defectos con hallazgos ya registrados para no crear tareas duplicadas. Se mantuvieron como referencias existentes AUD-NG-001, AUD-NG-002, AUD-NG-004, AUD-NG-108, AUD-NG-119, AUD-NG-120, AUD-NG-121, AUD-NG-122, AUD-NG-124, AUD-NG-144 a AUD-NG-146, AUD-NG-152, TASK-085 y TASK-142.

La revisión fue estática y manual. No se modificó código fuente ni se ejecutaron pruebas en servicios productivos.

## REQ-DOC-010 - Panel administrativo del desarrollador, consola técnica y exportación RAR/ZIP

**Estado: Cumple parcialmente.**  
**Hallazgo nuevo:** AUD-NG-156 (solo configuración de horarios; los demás defectos ya están cubiertos por tareas existentes).

### Evidencia

- developer-dashboard.html contiene panel de salud, visor de logs, herramientas de respaldo y controles de exportación por año/parcial. js/developer.js tiene un manejador asíncrono para el botón de exportación; la interfaz no queda bloqueada durante la espera.
- El manejador de js/developer.js invoca window.exportSchoolYearArchive. js/api.js define ese wrapper enviando la acción exportSchoolYearArchive al servicio ACADEMIC. No se encontró esa acción en el router ni una función exportSchoolYearArchive en backend/academic-service/Code.gs.
- backend/task-service/Code.gs contiene un case generateAcademicArchiveZip en el router, pero no existe una definición de función generateAcademicArchiveZip en el archivo/proyecto inspeccionado. Tampoco se encontró Utilities.zip. Por tanto, el botón no produce un archivo ZIP real ni una descarga verificable.
- La desalineación del exportador y la ausencia de generación real de ZIP ya están registradas en AUD-NG-120; no se crea una tarea duplicada.
- La salud de microservicios, el visor de logs y los respaldos tienen defectos ya registrados en AUD-NG-144, AUD-NG-145 y AUD-NG-146, respectivamente.
- No se encontraron campos, handlers, wrappers ni propiedades de backend para configurar hora de publicación o intervalo post-clase en developer-dashboard.html, js/developer.js, js/api.js o backend/academic-service/Code.gs.
- La configuración horaria de publicación es una dependencia de REQ-DOC-006 y AUD-NG-152, pero la interfaz administrativa que debería definir la fuente de configuración no está implementada.

### Evaluación de calidad e impacto

La consola tiene elementos visuales y handlers para salud/logs/exportación, pero varios de esos componentes ya tienen hallazgos activos. El exportador no tiene una implementación backend alcanzable y la configuración de horarios no existe. Se registra una tarea nueva únicamente para la configuración administrativa de publicación/intervalo, evitando duplicar AUD-NG-120 y AUD-NG-144 a AUD-NG-146.

## REQ-DOC-011 - Análisis de desempeño estudiantil e índice de asistencia

**Estado: Cumple parcialmente.**  
**Hallazgo nuevo:** AUD-NG-157.  
**Hallazgo existente relacionado:** AUD-NG-121 (penalización del 50% por entrega tardía).

### Evidencia

- js/student.js:1257-1304 construye allActivitiesData con tareas y exámenes. No incorpora proyectos en el conjunto utilizado por el cálculo de desempeño.
- js/student.js:1370-1460 calcula deliveryRate, academicPerformance, punctualityRate y compositeProgress. Cuando no hay actividades asignadas, deliveryRate y academicPerformance se convierten en 0, pero punctualityRate se establece en 1; el resultado compuesto puede mostrar 20% aun sin datos.
- El cálculo suma a gradeSum la expresión calificacion || 0, por lo que una entrega pendiente de calificación o sin nota se trata como cero y reduce el rendimiento académico.
- El cálculo de desempeño no aplica una reducción del 50% a las entregas tardías. submitAssignment marca EntregadaTarde y gradeSubmission/gradeSubmissionWithRubric guardan la calificación sin aplicar ese factor. Este incumplimiento ya está registrado en AUD-NG-121; no se duplica.
- La asistencia se muestra en un bloque separado mediante fetchAndRenderStudentAttendanceSummary (js/student.js:1046-1082), lo cual cumple parcialmente la separación visual.
- getStudentAttendanceSummary (backend/academic-service/Code.gs:9638-9680) devuelve porcentajeAsistencia = 100.0 cuando total de registros es 0. La ausencia de datos se presenta como asistencia perfecta en vez de "Sin registros"/no disponible.
- La gráfica de perfil utiliza ICR y Mastery, pero no calcula un GP independiente. El tercer valor se deriva como 100 - avgIA, donde avgIA = 100 - avgICR; por tanto, el tercer eje vuelve a ser matemáticamente igual a avgICR y no aporta una métrica independiente.

### Evaluación de calidad e impacto

Existe un indicador compuesto y un resumen separado de asistencia, pero el cálculo omite proyectos, trata calificaciones ausentes como cero, genera un 20% con ausencia de actividades y muestra 100% de asistencia cuando no existen registros. Las métricas ICR/GP/Mastery tampoco están diferenciadas de forma verificable. El reporte puede inducir conclusiones académicas incorrectas.

## REQ-DOC-012 - Seguridad en servidor, permisos y trazabilidad de contenidos

**Estado: Cumple parcialmente.**  
**Hallazgo nuevo:** AUD-NG-158.  
**Hallazgos existentes relacionados:** AUD-NG-001, AUD-NG-002, AUD-NG-004, AUD-NG-108, AUD-NG-119, AUD-NG-122, AUD-NG-124, TASK-085 y TASK-142.

### Evidencia

- backend/task-service/Code.gs:85-119 concede al rol Profesor acciones como createTask, updateTask, createStudyMaterial y otras operaciones de escritura.
- validateContextualAccess (backend/task-service/Code.gs:236-258) aplica comprobaciones contextuales a Estudiante/Alumno/Padre/Tutor; para los demás roles retorna permitido. No verifica que un Profesor tenga asignada la asignatura, grado o sección objetivo.
- getDynamicPermissionsForRole (backend/task-service/Code.gs:283-335) resuelve permisos por rol/acción, no por asignación docente concreta.
- createTask (backend/task-service/Code.gs:447-471) acepta profesorId, asignatura, grado y sección desde el payload y los persiste sin compararlos con _verifiedUserId ni consultar AsignacionesDocentes.
- createStudyMaterial (backend/task-service/Code.gs:1665-1695) recibe autorId y contexto académico desde el payload sin comprobar la asignación docente. updateTask (474-495) actualiza por tareaId sin comprobar que la tarea pertenezca al docente autenticado.
- backend/academic-service/Code.gs contiene una validación contextual más amplia para acciones ACADEMIC, pero el microservicio TASK utiliza su propia validateContextualAccess y no invoca la validación de asignación docente de ACADEMIC.
- updateTask sobrescribe fechaLimite en la fila de Tareas. No se encontró un historial append-only con fecha anterior/nueva, actor, timestamp y motivo; tampoco se encontró una hoja HistorialTareas ni un logger invocado por createTask/updateTask para registrar cambios de fecha límite.
- La integración del token de sesión en fetchApi ya está registrada en AUD-NG-001; el fallback predecible de AUTH_TOKEN_SECRET está registrado en AUD-NG-004; el acceso contextual de lecturas está en AUD-NG-002; y los problemas de alcance en configuración, cierre de año, asistencia y calificaciones están en AUD-NG-108, AUD-NG-119, AUD-NG-122 y AUD-NG-124. No se duplican.
- En los archivos inspeccionados no se encontró una clave privada OAuth/refresh token de Drive embebida; se usa DriveApp con autorización de Apps Script. DRIVE_FOLDER_ID y SPREADSHEET_ID son identificadores de recursos, no credenciales. Los riesgos de enlaces públicos de Drive están relacionados con TASK-085/TASK-142; task-service también contiene una ruta de carga con ANYONE_WITH_LINK, por lo que debe quedar incluida al ejecutar esa tarea de seguridad.

### Evaluación de calidad e impacto

El backend comprueba el rol, pero no el ámbito de asignación docente para crear materiales/tareas ni la propiedad de la tarea al actualizarla. Un docente autenticado puede dirigir una escritura a una asignatura/grado/sección que no le corresponde si envía esos valores en el payload. La fecha límite vigente se guarda, pero sus modificaciones no son trazables. Los controles de token y privacidad documental ya tienen tareas existentes; el nuevo trabajo se limita a autorización contextual de escrituras académicas y auditoría de cambios de fecha.

## Resumen del sublote H2

| Tarea | Resultado | Hallazgo nuevo / referencias |
|---|---|---|
| REQ-DOC-010 | Cumple parcialmente | AUD-NG-156; relacionados AUD-NG-120, AUD-NG-144 a AUD-NG-146 y AUD-NG-152 |
| REQ-DOC-011 | Cumple parcialmente | AUD-NG-157; relacionado AUD-NG-121 |
| REQ-DOC-012 | Cumple parcialmente | AUD-NG-158; relacionados AUD-NG-001, 002, 004, 108, 119, 122, 124, TASK-085 y TASK-142 |

## Cierre de auditoría histórica

- Tareas históricas identificadas en completadas_legacy.md: 49.
- Tareas revisadas hasta Lote F2: 37.
- Lotes G1, G2, H1 y H2 revisados: 12.
- **Total revisado: 49 de 49. No quedan tareas históricas DOC/EXP pendientes de auditoría.**
- Hallazgos nuevos de los lotes G1 a H2: AUD-NG-147 a AUD-NG-158. AUD-NG-156 a AUD-NG-158 quedan registrados en Pendientes.md; los hallazgos repetidos se vinculan a tareas existentes para evitar duplicados.
- Los identificadores históricos y sus estados en completadas_legacy.md no se modificaron.

## Pruebas y límites

- No se ejecutaron pruebas de interfaz, endpoints, carga, analítica ni persistencia.
- No se accedió a Google Drive/Sheets productivos ni se verificó el despliegue de Apps Script.
- La auditoría contrasta el código versionado; no certifica el estado de servicios desplegados.

## Continuidad

- Última tarea histórica auditada: REQ-DOC-012.
- No quedan tareas históricas sin revisar en completadas_legacy.md.
- Próximo trabajo requiere priorización/autorización de implementación de los hallazgos pendientes.
