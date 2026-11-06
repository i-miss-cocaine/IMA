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