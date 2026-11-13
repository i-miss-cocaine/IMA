# Auditoría TAREA-17: analítica académica por área, asignatura y programa

**Fecha:** 2026-11-05  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 4868aa20f934f20579ebcea8d2623d00509a9322  
**Dictamen:** CUMPLE PARCIALMENTE; analítica contextual y exportación institucional no acreditadas.

## Alcance
Distribución de notas, tendencias por parcial, alertas de acompañamiento, comparativas homogéneas por grado/sección/programa/idioma, exclusión de pendientes, exportación para Dirección/Coordinación, correspondencia con fuente y permisos.

## Archivos inspeccionados

| Archivo | SHA |
|---|---|
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 |
| teacher-dashboard.html | cbb9e6a272a7d8ad33f99727303305d950533e71 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f |
| tests/regression/academic-grading-suite.js | 3433b707edd4a2f35c68368a3172932adc2a3b32 |

## Hallazgos

### 1. Analítica sin dimensiones ni filtros reales
getCurricularAnalyticsReport (academic-service, 2927-2978) recibe area/asignatura/grado/programa/periodo, pero lee todas las filas de CalificacionesEstudiantes y no aplica filtros ni agrupaciones. Los parámetros se devuelven como etiquetas; no hay sección, idioma ni año lectivo. Calcula un promedio y una distribución global. Sí excluye borradores, no publicadas y notas no numéricas del promedio, lo que cumple parcialmente el criterio de pendientes.

El esquema real de CalificacionesEstudiantes (exam-service, línea 36) es ID, EvaluacionID, UserID, NotaObtenida, PuntajePonderado, EsBorrador, EsPublicada, Observaciones y FechaRegistro. No contiene por sí solo área, asignatura, grado, sección, programa ni idioma; el endpoint no enlaza EvaluacionID/UserID con Evaluaciones, Matrículas u OfertaAcademica. Por tanto no puede atribuir correctamente cada nota a las dimensiones solicitadas.

alertasAcompanamiento es simplemente el conteo de notas inferiores a 70, no el número de alertas activas ni estudiantes únicos.

### 2. Alertas tempranas con métricas simuladas
evaluateAndDispatchEarlyWarningAlerts (academic-service, 9264-9535) calcula asistencia desde RegistrosAsistencia sin filtrar por año lectivo o período. failingSubjectsCount y missingTasksCount se obtienen de mockFailingSubjects/mockMissingTasks enviados en payload (9424-9429), no de notas y entregas persistidas. anolectivo se recibe pero no interviene en el cálculo. La clave de deduplicación no incluye año lectivo, por lo que una alerta activa de un ciclo puede suprimir otra del siguiente. NotificadoA se almacena como texto; no se encontró envío efectivo a canales de notificación. Sí se registran filas en AlertasTempranas y se intenta crear CasosSeguimiento para riesgos Alto/Crítico.

F11-Task08 está marcada completada, pero el flujo no acredita los indicadores reales de reprobación e incumplimiento de tareas que exige su alcance.

### 3. Interfaz y RBAC desconectados
teacher.js (2275-2306) define el controlador TAREA-17 y llama getCurricularAnalyticsReport con payload vacío. teacher-dashboard.html no contiene modal-academic-analytics, btn-close-academic-analytics ni IDs analytics; no hay interfaz visible que el controlador pueda abrir.

ROLE_PERMISSIONS incluye getCurricularAnalyticsReport para Director (línea 170) y Administrador wildcard, pero no para Coordinador (222) ni Profesor (242), aunque el controlador está en teacher.js. La acción no está disponible para los perfiles requeridos de Coordinación ni para el contexto docente que intenta llamarla.

### 4. Reporte y exportación no equivalentes a analítica
El reporte tradicional de teacher.js (2940-3045) convierte entregas ausentes en cero (2979), suma puntos de tareas/exámenes heterogéneos y determina aprobación con total >=70 (2991). El filtro de tareas (3022) usa PARCIAL_ACTUAL, no el valor seleccionado en report-parcial; los exámenes (3023) no filtran por parcial. La exportación export-excel-btn (4585-4627) vuelve a exportar tareas/exámenes, no el resultado de getCurricularAnalyticsReport, y también asigna cero a entregas ausentes.

El catálogo REP-ACAD-01 en user-service (8396+) declara filtros año/grado/sección/período y roles que incluyen Coordinador. Sin embargo, generateInstitutionalReport (8624; rama académica 8687) interpreta la hoja con índices incompatibles: usa r[0] como ID estudiante, r[1] como nombre, r[2] como grado, r[3] como sección y r[6] como nota (8701), aunque el esquema real define r[6] como EsPublicada. Tampoco aplica los filtros declarados y agrega EST-001/EST-002 ficticios cuando no hay filas (8720). REP-ACAD-02 no tiene generador propio y cae en la misma rama genérica category=ACADEMICA.

### 5. Pruebas
tests/regression/academic-grading-suite.js no contiene referencias a getCurricularAnalyticsReport ni a runPhase24ReportsAndAnalyticsRegressionSuite. No se acreditan pruebas funcionales de filtros, agrupaciones, comparativas, alertas reales, permisos ni igualdad entre pantalla y exportación.

## Dictamen por criterio

- Distribución global de notas: **Parcial**.
- Tendencias por parcial: **No cumple**.
- Comparativas grado/sección/programa/idioma: **No cumple**.
- Exclusión de borradores/no publicadas del promedio del endpoint: **Cumple parcialmente**; el reporte/exportación docente convierte ausencias en cero.
- Alertas pedagógicas basadas en notas/tareas reales: **No cumple**.
- Exportación analítica para Dirección/Coordinadores: **No cumple**.
- Correspondencia con fuente académica: **No cumple**.
- Permisos y ámbito: **No cumple** para Coordinador/Profesor en el endpoint analítico.

## Reconciliación

No se crea AUD-NG nuevo. Ampliar TASK-050 (catálogo), TASK-051 (diccionario), TASK-052 (filtros), TASK-054 (regresión), TASK-235 (series), TASK-237 (exportación), AUD-NG-167 (fuente única de calificaciones), AUD-NG-158 (RBAC/ABAC) y F11-Task08 (alertas tempranas marcadas completadas con métricas mock). TASK-051 presenta inconsistencia: encabezado [X] y Estado interno [ ] Pendiente; no se modifica su estado en esta auditoría.

## Pruebas y límites
Inspección estática/manual. No se ejecutaron endpoints, cálculos con fixtures, pruebas de roles, exportaciones ni notificaciones. No se utilizaron datos productivos ni se modificó código fuente. La planificación AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md citada por TAREA-17 no está disponible en esta rama; se utilizó el alcance explícito de completadas.md.


## Tareas ejecutables derivadas de los hallazgos

**Control de duplicados:** no crear AUD-NG nuevo. Se amplían TASK-050/051/052/054/235/237, AUD-NG-167, AUD-NG-158 y F11-Task08. La discrepancia interna de estado de TASK-051 se conserva para conciliación posterior; este bloque no cambia su estado ni lo declara completado.

### AUD-NG-167 - Fuente única y atribución contextual de calificaciones
- Exponer una consulta analítica que derive cada nota desde la fuente consolidada del libro académico y enlace `EvaluacionID/UserID` con evaluaciones, matrículas y ofertas curriculares vigentes.
- Resolver área, asignatura, grado, sección, programa, idioma, año lectivo y periodo desde relaciones persistidas y validadas; no aceptar los parámetros recibidos como etiquetas que aparenten filtros aplicados.
- Aplicar filtros en backend antes de agrupar/calcular. Cada resultado debe indicar el contexto efectivo y rechazar dimensiones inexistentes o incompatibles.
- Alinear las dimensiones analíticas con la clave contextual de calificaciones establecida en AUD-NG-167; no inferir asignatura/programa a partir del estudiante sin validar matrícula y oferta vigentes.
- Mantener la exclusión de borradores y notas no publicadas en promedios e indicadores oficiales. Diferenciar pendiente, exenta, ausente y cero; ninguna ausencia debe convertirse automáticamente en nota cero.
- Calcular tendencias por parcial/periodo y comparativas solo entre cohortes homogéneas (mismo grado, sección o programa, escala, año/periodo y reglas de evaluación). Indicar cuando no existan datos suficientes o las escalas no sean comparables.
- Contar alertas activas y estudiantes únicos desde registros de alertas persistidos, no usar el conteo de notas inferiores a un umbral como sustituto de alertas activas.

### TASK-050 - Catálogo institucional de informes
- Incorporar los informes analíticos académicos requeridos para Dirección y Coordinación con metadatos explícitos: dimensiones, filtros obligatorios, fuente, periodicidad, formato, alcance y roles autorizados.
- Mantener una definición única de cada informe entre user-service y academic-service; no declarar un informe disponible si carece de generador funcional o de permisos consistentes.
- Definir REP-ACAD-01 y REP-ACAD-02 con generadores y contratos específicos, evitando que REP-ACAD-02 caiga silenciosamente en una rama genérica de categoría académica.
- Alinear el catálogo visible con la funcionalidad real y los parámetros aceptados por cada endpoint.

### TASK-051 - Diccionario semántico de indicadores
- Resolver la inconsistencia de estado registrada en el propio artefacto (encabezado [X] frente a estado interno Pendiente) mediante revisión explícita y evidencia; no cambiar el estado por esta normalización documental.
- Definir para cada indicador fórmula, unidad, población, granularidad, periodicidad, fuente primaria, filtros válidos, tratamiento de pendientes/ausentes y versión de la definición.
- Definir indicadores de rendimiento y acompañamiento sin ambigüedad: promedio, distribución, reprobación, tareas pendientes, asistencia, alertas activas y estudiantes únicos.
- Evitar que dos servicios calculen el mismo indicador con fórmulas o escalas distintas; las consultas y exportaciones deben consumir el diccionario versionado.

### TASK-052 - Filtros y dimensiones efectivas
- Implementar filtros de área, asignatura, grado, sección, programa, idioma, año lectivo y periodo sobre las relaciones académicas persistidas.
- Validar combinaciones de dimensiones y permisos en servidor; ignorar o rechazar filtros incompatibles en lugar de devolver un agregado global con etiquetas solicitadas por el cliente.
- Aplicar el filtro seleccionado de parcial de forma consistente a tareas, exámenes y notas, sin usar constantes como `PARCIAL_ACTUAL` ni omitirlo en una de las fuentes.
- Mostrar en cada resultado los filtros realmente aplicados y la población incluida/excluida para que el usuario pueda verificar el alcance.

### TASK-054 - Regresión conductual de analítica y alertas
- Añadir pruebas ejecutables con fixtures que validen filtros, agrupaciones, tendencias, comparativas homogéneas y exclusión de borradores/no publicadas.
- Verificar casos sin datos, notas pendientes/exentas, escalas distintas, matrículas vencidas y asignaciones curriculares incompatibles.
- Probar alertas con datos persistidos de asistencia, notas y entregas; incluir deduplicación, cambio de periodo/año y transiciones de estado.
- Comparar resultados entre endpoint, pantalla y exportación para asegurar que todos usan la misma fuente y cálculo.
- Probar autorización de Director, Coordinador y Profesor en sus respectivos ámbitos, incluidos intentos de consultar grupos/asignaturas ajenos.

### TASK-235 - Series temporales y comparativas
- Construir series por parcial, periodo y año lectivo desde calificaciones publicadas y atribuidas a dimensiones verificadas.
- Mantener comparabilidad de cohortes, escalas y planes curriculares; registrar cambios de fórmula o catálogo que afecten una serie.
- No rellenar puntos ausentes con cero ni conectar periodos no comparables; indicar huecos y tamaños de muestra.
- Habilitar comparativas por grado/sección/programa/idioma solo cuando el catálogo y las relaciones acrediten equivalencia.

### TASK-237 - Exportación institucional coherente
- Exportar el mismo conjunto de datos, filtros, agrupaciones y métricas que entrega la consulta analítica; no reconstruir el reporte sumando tareas/exámenes heterogéneos en el navegador.
- Corregir el mapeo de columnas de `CalificacionesEstudiantes` usando encabezados/esquema real, no índices incompatibles (en particular, no interpretar `EsPublicada` como nota).
- Eliminar filas ficticias de estudiantes cuando la fuente no devuelve registros. Un reporte vacío debe informar ausencia de datos.
- Respetar permisos y ámbito también al generar/descargar; validar nuevamente el contexto del reporte y registrar actor, filtros, fecha y versión de definición.
- Generar REP-ACAD-01 y REP-ACAD-02 con reglas propias y comprobar que la exportación coincide con pantalla y endpoint.

### AUD-NG-158 - RBAC/ABAC para analítica académica
- Definir permisos explícitos para Director, Coordinador y Profesor en `getCurricularAnalyticsReport`, coherentes con el propósito y la responsabilidad institucional de cada perfil.
- Para Profesor, limitar las consultas a asignaturas/grupos con asignación vigente; para Coordinador, limitar al área/departamento autorizado; para Director, aplicar el alcance institucional aprobado.
- Derivar actor desde sesión verificada y validar el contexto de cada dimensión en backend; no confiar en `profesorId`, `areaId`, `gradoId` o filtros enviados por el cliente.
- Aplicar las mismas reglas a pantalla, endpoint, exportación y detalle de alertas. Ocultar un botón no sustituye autorización del servidor.

### F11-Task08 - Alertas tempranas basadas en métricas académicas reales
- Sustituir `mockFailingSubjects` y `mockMissingTasks` del payload por consultas verificadas de notas publicadas y entregas persistidas, atribuidas al estudiante, asignatura, año lectivo y periodo correctos.
- Calcular asistencia, materias reprobadas y tareas pendientes en backend con reglas institucionales versionadas; ignorar métricas proporcionadas por el cliente.
- Incluir año lectivo/periodo en la clave de deduplicación para que una alerta de un ciclo no suprima una alerta nueva del siguiente.
- Mantener estados Activa/EnAtencion/Descartada/Resuelta y deduplicación por estudiante/contexto; contar estudiantes únicos y alertas activas desde registros reales.
- Persistir y ejecutar la notificación por los canales institucionales configurados. `NotificadoA` debe reflejar un envío comprobado, con fecha, canal y resultado; no basta con guardar texto.
- Vincular alertas de riesgo alto/crítico con casos de seguimiento, garantizando que el caso y la alerta compartan estudiante, contexto, periodo y trazabilidad.
- Revisar F11-Task08 aunque figure completada: no cambiar su estado aquí, pero exigir evidencia funcional antes de aceptar su cierre.

**Reconciliación y límites:** AUD-NG-167 conserva el libro académico como fuente única; TASK-050/051 definen catálogo y semántica; TASK-052 aplica filtros; TASK-054 valida conducta; TASK-235 gestiona series; TASK-237 exporta; AUD-NG-158 protege el ámbito; F11-Task08 mantiene la lógica de alertas tempranas. No se crea AUD-NG nuevo. No se altera el estado de TASK-051 ni F11-Task08 en este cambio.

**Evidencia requerida:** filtros reales y agrupaciones por dimensión; atribución mediante relaciones curriculares; tendencias por parcial/año; métricas de alertas desde datos persistidos y deduplicación contextual; permisos por perfil/ámbito; exportación idéntica a la consulta y sin filas ficticias; REP-ACAD-01/02 con generadores funcionales; pruebas con fixtures y resultados reproducibles. La auditoría actual es estática y no acredita esos comportamientos.

