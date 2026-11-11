# Auditoría TAREA-12

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Alcance y evidencia revisada

Requisito [TAREA-12] de completadas.md: unificar tareas, exámenes y proyectos con criterios institucionales; ponderaciones configurables por asignatura/periodo; rúbricas analíticas con niveles y comentarios; estados pendientes/provisionales/publicadas/rectificadas/cerradas; inalterabilidad de periodos cerrados e historial de rectificación; recuperación/nivelación/reevaluación; compatibilidad SACE y cuadro de honor.

Archivos inspeccionados:
- backend/academic-service/Code.gs (SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc).
- backend/exam-service/Code.gs (SHA 1d93296628fae31f680004f637897e2b1314a64c).
- js/teacher.js (SHA c475fce5afcd28fca23e7b64398ad32b17773746).
- js/student.js (SHA e2888cea60322e49a40b89adadb8010489605dcc).
- teacher-dashboard.html (SHA cbb9e6a272a7d8ad33f99727303305d950533e71).
- ChangesLogs.txt (SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9).

Los cinco archivos de código/UI inspeccionados tienen el mismo SHA en NG_beta_0.0.0.1 y NG_beta_0.0.0.1_work; no hay correcciones posteriores de estos módulos en la rama de trabajo.

## Evidencia de cumplimiento parcial

- backend/academic-service/Code.gs contiene calculateUnifiedAcademicGrade y previewAcademicGradeCalculation con métodos PromedioPonderado, PromedioAritmetico y PuntosObtenidos; reconoce actividades pendientes/exentas/ausencias justificadas y devuelve equivalencias genéricas SACE/cuadro de honor.
- backend/exam-service/Code.gs contiene categorías de evaluación, CRUD básico de rúbricas, registros de evaluación por competencias, recuperaciones, revisión/cierre/publicación y rectificación con una tabla HistorialRectificacionesNotas.
- El flujo de rectificación conserva nota anterior/nueva, motivo, actor declarado y fecha en HistorialRectificacionesNotas.
- La interfaz del libro de calificaciones presenta categorías y permite guardar notas, solicitar recuperación y cerrar/publicar un parcial.

## Incumplimientos y defectos

1. **Libro de calificaciones sin clave contextual suficiente.** saveGradebookGrades identifica una nota por evaluacionId + userId, sin periodo, año lectivo, asignatura, grado ni sección. Una misma categoría (por ejemplo CAT-1) puede sobrescribirse entre periodos o asignaturas. getGradebookData carga calificaciones por IDs de estudiantes y no filtra sus filas por asignatura/parcial; profesorId tampoco se utiliza para restringir el conjunto consultado.
2. **Ponderaciones no son una configuración institucional efectiva.** getEvaluationCategories devuelve categorías Global predeterminadas 35/40/15/10. saveEvaluationCategory no valida porcentajes, suma del 100%, ámbitos o escala; al actualizar solo cambia nombre y porcentaje. La UI muestra los cuatro porcentajes en un alert estático y renderGradebookTable vuelve a calcularlos con constantes locales, sin usar las ponderaciones recibidas del backend ni calculateUnifiedAcademicGrade. La nota visible puede diferir del cálculo unificado.
3. **Guardado de notas sin validación robusta ni estado coherente.** saveGradebookGrades no valida que cada nota sea numérica y esté en rango, usa notaObtenida || 0 y puntajePonderado || 0 (convierte valores falsy a cero), y no comprueba que la categoría/estudiante pertenezcan al contexto de la solicitud. La UI envía esBorrador:false y esPublicada:true directamente. El flujo no implementa de forma consistente estados pendientes, provisionales, revisión, publicación y cierre por cada registro.
4. **Cálculo unificado con supuestos inseguros.** calculateUnifiedAcademicGrade confía en esAnoHistoricoAnterior y periodoCerrado suministrados en payload, en lugar de resolver esos estados desde registros institucionales. Si no hay actividades devuelve notaFinal 0 con status success. Ignora actividades pendientes y luego normaliza con el peso de las evaluadas, pero no rechaza pesos negativos/fuera de rango ni exige una configuración válida; puede retornar success con ponderacionInvalida. En PuntosObtenidos suma notaObtenida como puntos obtenidos aunque el denominador use puntosPosibles, lo que mezcla escalas si la nota ya es porcentaje.
5. **Rúbricas y competencias no alcanzan el modelo analítico solicitado.** saveRubric serializa cualquier criterios sin validar estructura, criterios, niveles, descriptores, ponderaciones o escala; getRubrics solo hace JSON.parse. saveCompetencyEvaluation valida únicamente competenciaId, userId y nivelDesempeno no vacío, permite referencias genéricas y no valida que el nivel pertenezca a la rúbrica ni a un catálogo de competencias/indicadores. js/teacher.js no contiene consumidores de getRubrics/saveRubric/saveCompetencyEvaluation/getCompetencyEvaluations ni de calculateUnifiedAcademicGrade; la interfaz inspeccionada no integra el flujo de rúbrica analítica.
6. **Cierre/publicación no aplica el contexto ni la transición institucional completa.** closePeriodGradebook inserta inmediatamente un cierre como Cerrado y publica registros en lugar de exigir revisión/aprobación previa. publishGradebookForContext filtra estudiantes por grado/sección, pero no por asignatura ni periodo; puede publicar borradores ajenos al parcial que se pretende cerrar. reviewPeriodGradebook no valida rol revisor, estado previo ni transición permitida y no persiste observaciones en el registro de cierre. El flujo de UI llama cierre directo.
7. **Inalterabilidad y rectificación no están protegidas de extremo a extremo.** La UI saveGradebookGrades no envía periodoId ni authRole; por ello la comprobación de periodo cerrado en saveGradebookGrades queda condicionada a un periodo que el cliente no transmite. ROLE_PERMISSIONS incluye para Profesor closePeriodGradebook, reopenPeriodGradebook, reviewPeriodGradebook y rectifyStudentGrade. Las funciones de cierre, reapertura, revisión y rectificación no verifican internamente la autorización específica ni la asignación docente; rectifyStudentGrade acepta autorizadoPor del payload. Aunque registra historial, la actualización de la nota y el append del historial no se protegen con bloqueo/operación atómica.
8. **Recuperación global sin vinculación fiable.** quickRecoveryPrompt envía evaluacionId CAT-GLOBAL, notaOriginal calculada en el cliente, estudiante y autorizadoPor del cliente; no envía periodo/asignatura. saveStudentRecovery permite cualquier método no reconocido como sustitución por defecto y su control de periodo cerrado solo opera si periodoId está presente. No se comprueba la nota original contra la calificación almacenada ni la asignación docente.
9. **Boletines y compatibilidad SACE desconectados del modelo consolidado.** generateStudentReportCard lee Calificaciones o Notas, no CalificacionesEstudiantes; calcula promedio aritmético simple y considera oficial cualquier solicitud que incluya periodoId, sin consultar que el periodo esté cerrado/publicado. La equivalencia SACE de calculateUnifiedAcademicGrade es una etiqueta genérica y no acredita correspondencia con catálogo/escalas oficiales, exportación SACE ni cuadro de honor derivado de notas consolidadas. getStudentAcademicReport tampoco aplica anoId y su filtro incluye filas no borrador aunque no estén publicadas; la validación del estudiante objetivo debe coordinarse con AUD-NG-002.

## Hallazgo nuevo

**AUD-NG-167 - Unificar la integridad del libro de calificaciones y el ciclo institucional de evaluación.** Alto (P1). Alcance: clave contextual de calificación por estudiante/actividad/asignatura/periodo/año; configuración validada de ponderaciones; cálculo único desde datos persistidos; distinción entre pendiente y cero; rúbricas analíticas y competencias vinculadas a catálogos/criterios; transición verificable de revisión, publicación, cierre y rectificación; recuperación vinculada a calificación/periodo; boletines oficiales derivados de notas consolidadas y correspondencia SACE verificable. Los controles de identidad, autorización contextual y consultas de datos personales deben resolverse coordinadamente con tareas transversales existentes, no duplicarse.

## Ampliaciones de tareas existentes (sin duplicar)

- **AUD-NG-002:** derivar el estudiante objetivo de claims verificados o validar relación familiar; getStudentAcademicReport debe devolver únicamente notas publicadas y del ámbito autorizado.
- **AUD-NG-158:** aplicar ABAC a operaciones de libro de calificaciones, rúbricas, competencias, recuperación, cierre, revisión, reapertura y rectificación; derivar actor del token y no aceptar profesorId/autorizadoPor del cliente como autoridad.
- **AUD-NG-124:** mantener el historial de calificación de entregas de tareas/exámenes en su alcance original; AUD-NG-167 cubre el libro académico consolidado y la rectificación de notas institucionales.

## Calidad y límites

Calidad insuficiente: hay piezas funcionales aisladas, pero persisten múltiples fuentes de verdad, cálculos duplicados, categorías globales, claves de persistencia insuficientes, rúbricas no integradas y transiciones de periodo sin garantías de contexto/autoridad. Revisión estática/manual; no se ejecutaron pruebas de navegador, Apps Script, datos reales, concurrencia, permisos, integración SACE ni despliegue productivo. No se modificó código fuente, completadas.md, completadas_legacy.md ni ChangesLogs.txt.

## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-167 - Integridad del libro de calificaciones y ciclo institucional de evaluación (P1)
- Definir una clave contextual única para cada calificación que incluya estudiante, actividad/categoría, asignatura, grado/sección, periodo y año lectivo. Evitar que un mismo `evaluacionId + userId` sobrescriba notas de asignaturas o periodos distintos.
- Hacer que `getGradebookData` y las consultas relacionadas filtren por el mismo contexto completo y por la asignación docente autorizada. No cargar filas de otros periodos/asignaturas por coincidencia de IDs de estudiantes.
- Convertir las ponderaciones en configuración institucional persistida por asignatura/periodo. Validar porcentajes, escala, suma requerida y ámbito; no usar categorías Global como sustituto silencioso de una configuración contextual.
- Unificar el cálculo de notas en una sola ruta de backend. La interfaz debe consumir el cálculo y las ponderaciones persistidas, no recalcular con constantes locales ni presentar un resultado distinto al cálculo oficial.
- Validar en servidor que notas, puntos obtenidos y puntos posibles sean numéricos y estén dentro de sus rangos. Mantener escalas coherentes y rechazar ponderaciones negativas, superiores al límite o incompletas.
- Distinguir explícitamente actividad pendiente, exenta, ausente justificada, no evaluada y nota cero. La ausencia de datos no debe convertirse en cero ni generar un porcentaje artificial; si no hay actividades calificables, devolver un estado sin calificación en vez de `success` con nota 0.
- Resolver desde registros institucionales si el periodo es histórico, está cerrado o está publicado. No confiar en flags como `esAnoHistoricoAnterior` o `periodoCerrado` enviados por el cliente.
- Definir rúbricas analíticas con esquema validado: criterios, niveles, descriptores, ponderaciones y escala. Vincular evaluaciones por competencia con catálogos vigentes y verificar que el nivel seleccionado pertenezca a la rúbrica/competencia aplicable.
- Integrar los endpoints de rúbricas, competencias y cálculo unificado con la interfaz docente; la existencia de funciones backend no demuestra que el flujo institucional las utilice.
- Implementar transiciones verificables para pendiente, provisional, revisión, publicada, cerrada y rectificada. Cerrar un periodo debe exigir revisión/aprobación previa y filtrar por asignatura, periodo y contexto exactos; no publicar borradores ajenos al cierre solicitado.
- Proteger la inalterabilidad de periodos cerrados. Reapertura y rectificación deben requerir autorización contextual, motivo y trazabilidad, con actualización de nota e historial en una operación atómica o protegida contra concurrencia.
- Vincular las recuperaciones/nivelaciones a la calificación original persistida, estudiante, asignatura y periodo. Verificar la nota original en servidor; no aceptar `CAT-GLOBAL`, `notaOriginal` ni `autorizadoPor` como autoridad o referencia suficiente desde el cliente.
- Generar boletines desde el libro consolidado y solo presentar resultados oficiales cuando el periodo esté realmente cerrado/publicado. No marcar un boletín como oficial por la mera presencia de `periodoId`.
- Verificar la correspondencia SACE con catálogos y escalas oficiales, reglas de equivalencia, exportación y cuadro de honor derivado de notas consolidadas. Las etiquetas genéricas no acreditan compatibilidad institucional.

### AUD-NG-002 - Identidad del estudiante y consultas académicas autorizadas
- Derivar el estudiante objetivo desde los claims verificados para consultas del propio estudiante; para padres/tutores, validar la relación familiar autorizada.
- Restringir `getStudentAcademicReport` a notas publicadas y al ámbito que la identidad/relación solicitante puede consultar.
- No permitir que `userId`, `estudianteId`, `periodoId` ni otros filtros enviados por el cliente sustituyan la comprobación de identidad, relación familiar, publicación y alcance institucional.

### AUD-NG-158 - ABAC y autoridad en el ciclo de calificaciones
- Aplicar validación contextual de asignación docente y ámbito académico a guardado de notas, rúbricas, competencias, recuperaciones, revisión, publicación, cierre, reapertura y rectificación.
- Derivar el actor de `_verifiedUserId`/claims de sesión y validar el rol autorizado para cada transición. No aceptar `profesorId`, `autorizadoPor` o `authRole` declarados por el cliente como prueba de autoridad.
- Comprobar la propiedad del periodo/asignatura/grupo antes de modificar datos o cerrar/publicar un conjunto de notas.
- Mantener este alcance como control transversal de autorización; AUD-NG-167 conserva el modelo y la integridad del libro académico.

### AUD-NG-124 - Separación del historial de calificación de tareas/exámenes
- Mantener AUD-NG-124 en su alcance original: propiedad y trazabilidad de calificaciones de entregas de tareas/exámenes, incluyendo valor anterior/nuevo, actor y motivo.
- No trasladar ni duplicar en AUD-NG-124 el libro académico consolidado, las ponderaciones institucionales, el cierre de periodos o los boletines; esas responsabilidades pertenecen a AUD-NG-167.
- Mantener la coordinación entre ambos flujos sin asumir que el historial de una entrega sustituye el historial institucional de calificaciones.

**Reconciliación y límites:** AUD-NG-167 concentra la integridad funcional del libro consolidado, cálculo, ponderaciones, rúbricas/competencias, estados, periodos, recuperaciones y reportes oficiales. AUD-NG-002 conserva identidad/relación y consultas autorizadas; AUD-NG-158 conserva ABAC/autoridad de operaciones; AUD-NG-124 conserva el historial de calificaciones de entregas de tareas/exámenes. No se crean IDs adicionales ni se duplican los controles transversales.

**Evidencia requerida:** pruebas de aislamiento por contexto; ponderaciones válidas e inválidas; tratamiento de pendientes/exentas/ceros; cálculo reproducible; validación de rúbricas/competencias; transiciones de revisión/publicación/cierre/reapertura/rectificación; concurrencia e historial atómico; recuperación contextual; boletines oficiales y exportación SACE verificable. La auditoría actual es estática y no acredita estos comportamientos.

