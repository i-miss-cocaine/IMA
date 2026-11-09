# Auditoría TAREA-11

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Alcance y evidencia revisada

Requisito [TAREA-11] de completadas.md: motor de exámenes; nueve modalidades; banco por área/asignatura/grado/tema/dificultad; etiquetas/objetivos/criterios; reutilización de reactivos; duración/fechas/intentos/aleatoriedad; confidencialidad de respuestas; resiliencia/idempotencia; corrección manual parcial y analítica psicométrica.

Archivos inspeccionados:
- backend/exam-service/Code.gs (SHA 1d93296628fae31f680004f637897e2b1314a64c).
- js/exam.js (SHA 5189976e4bbbbda7eaa92d89a4ccd500a8604eb0).
- js/quizpro.js (SHA da261befd776729ad1e3674e04ad76900f2f0e36).
- exam.html (SHA ca6a7e880c0c63e4d7fe18991612560734a39dcd).
- results.html (SHA a8dc15e9aec091eb3d6490b9b073ace48fcc72c5).
- ChangesLogs.txt (SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9).

El SHA de backend/exam-service/Code.gs es idéntico en NG_beta_0.0.0.1 y NG_beta_0.0.0.1_work: no existe una corrección posterior de ese módulo en la rama de trabajo.

## Evidencia de cumplimiento parcial

- Existe BancoPreguntas y las funciones manageQuestionBank/getQuestionBank. El esquema declara área, asignatura, grado, tema, dificultad, tipo, texto, opciones, respuesta correcta, etiquetas, puntos y estado. La consulta filtra por área/asignatura/grado/tema/dificultad.
- getExamQuestions omite respuestaCorrecta al entregar preguntas al cliente.
- js/exam.js renderiza opción múltiple, verdadero/falso, completación/respuesta breve y términos pareados; usa localStorage para conservar progreso local y baraja definiciones con Fisher-Yates.
- doPost expone las acciones del banco y ROLE_PERMISSIONS concede esas acciones al rol Profesor.

## Incumplimientos y defectos

1. **Persistencia incompleta.** createExam guarda solo diez columnas de Examenes, aunque el esquema declara catorce (omite AreaCurricular, DuracionMinutos, IntentosPermitidos y EsAleatorio). Las preguntas se guardan solo en seis columnas aunque PreguntasExamen declara diez (omite Puntos, AreaCurricular, Dificultad y BancoPreguntaID). No se conserva vínculo verificable ni reutilización de reactivos.
2. **Validación débil del banco.** manageQuestionBank acepta campos sin validar tipo permitido, campos obligatorios, área/asignatura/grado existentes, dificultad, puntos positivos, estructura de opciones, respuesta válida ni etiquetas/objetivos/criterios. Un ID recibido puede sobrescribir una fila existente. JSON malformado puede guardarse y luego romper getQuestionBank en JSON.parse.
3. **Cobertura incompleta de modalidades.** La interfaz cubre cinco familias; no se evidencia selección múltiple real, respuesta extensa, numérica, ordenación ni preguntas con archivos/imágenes. submitExam no implementa validadores/calificadores para esos formatos.
4. **Calificación incorrecta/incompleta.** submitExam calcula aciertos sobre cantidad de preguntas, ignora puntos configurables y no ofrece puntuación parcial general ni flujo de corrección manual por pregunta con progreso persistido.
5. **Configuración no aplicada.** El esquema declara duración, intentos y aleatoriedad, pero createExam no los persiste y updateExam no los actualiza. submitExam no aplica fecha de apertura/cierre, duración ni máximo de intentos. Un temporizador cliente no sustituye enforcement servidor.
6. **Resiliencia e idempotencia insuficientes.** localStorage solo recupera en el mismo navegador/dispositivo. submitExam genera ID con Date.now y agrega una fila sin clave idempotente, bloqueo ni deduplicación; reintentos tras pérdida de respuesta pueden duplicar entregas.
7. **Analítica psicométrica no acreditada.** Hay distribución de calificaciones y métricas operativas, pero no análisis reproducible por reactivo/tema/asignatura/grupo (dificultad, discriminación, distractores, consistencia) ni trazabilidad de versión del reactivo.
8. **Ámbito contextual del banco/resultados.** Las funciones manageQuestionBank/getQuestionBank no verifican asignación docente ni ámbito curricular en su lógica. getExamResult busca por entregaExamenId sin comprobar allí que la entrega pertenezca al solicitante. Coordinar con controles transversales existentes sin duplicarlos.

## Hallazgo nuevo

**AUD-NG-166 - Completar el modelo verificable de reactivos y la integridad del motor de exámenes.** Alto (P1). Alcance: validación de esquema y referencias del banco; persistencia/versionado de metadatos y vínculo de reactivos; soporte de modalidades faltantes y sus validadores/calificadores; snapshot inmutable de preguntas utilizadas en exámenes ya realizados; analítica psicométrica sustentada en respuestas y versiones reales. No absorbe las tareas existentes de intentos, duración, idempotencia, ABAC ni calificación académica.

## Ampliaciones de tareas existentes (sin duplicar)

- **AUD-NG-121:** aplicar en servidor fechas, duración y máximo de intentos por estudiante.
- **AUD-NG-124:** rúbricas para preguntas abiertas, puntuación parcial, revisión manual y conservación de progreso/historial.
- **AUD-NG-006:** clave idempotente/reserva atómica y recuperación de entrega tras pérdida de respuesta HTTP.
- **AUD-NG-011:** persistir/validar areaId y ámbito curricular y enrutar el flujo al servicio autorizado.
- **AUD-NG-002:** verificar propiedad de la entrega antes de devolver resultados y controlar exposición de respuestas correctas.
- **AUD-NG-158:** limitar gestión/consulta de bancos y exámenes al ámbito curricular y asignaciones docentes verificadas.

## Calidad y límites

Calidad insuficiente: esquemas y escrituras desalineados, validación débil, modalidades incompletas, puntuación que ignora puntos y restricciones declaradas solo en columnas o cliente. Revisión estática/manual; no se ejecutaron pruebas de navegador, Apps Script, permisos, concurrencia, conectividad ni despliegue productivo. No se modificó código fuente, completadas.md, completadas_legacy.md ni ChangesLogs.txt.


## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-166 - Integridad del banco de preguntas y del motor de exámenes (P1)
- Alinear el esquema declarado con las columnas realmente persistidas en `Examenes` y `PreguntasExamen`. Guardar y recuperar todos los campos curriculares y de configuración requeridos, incluidos área, duración, intentos, aleatoriedad, puntos, dificultad y vínculo al reactivo del banco.
- Validar en servidor el esquema de cada reactivo antes de crear o actualizar: tipo permitido, campos obligatorios, área/asignatura/grado/tema existentes, dificultad válida, puntos positivos, opciones con estructura válida, respuesta compatible con el tipo, etiquetas/objetivos/criterios y referencias existentes.
- Rechazar JSON malformado o estructuras que no puedan analizarse; no persistir contenido que posteriormente provoque errores en `getQuestionBank`. Validar también los IDs recibidos y evitar sobrescrituras de reactivos ajenos o no autorizadas.
- Implementar modalidades faltantes (selección múltiple real, respuesta extensa, numérica, ordenación y reactivos con archivos/imágenes) con representación, validación y calificador adecuados para cada modalidad. No basta con mostrar el tipo en la interfaz si el backend no puede validarlo y procesarlo.
- Mantener un vínculo verificable entre cada pregunta de un examen y el reactivo de origen. Al publicar/iniciar un examen, conservar un snapshot inmutable de texto, opciones, respuesta esperada, puntos, dificultad, rúbrica y versión del reactivo utilizado, de modo que cambios posteriores en el banco no alteren exámenes ya realizados.
- Calcular resultados a partir de los puntos configurados y de las reglas de cada pregunta, no de una simple proporción de respuestas correctas sobre cantidad de preguntas. Soportar puntuación parcial y derivar las preguntas que requieren corrección manual hacia el flujo de revisión de AUD-NG-124.
- Producir analítica psicométrica reproducible por reactivo, tema, asignatura y grupo, sustentada en respuestas reales y en la versión de cada reactivo. Incluir como mínimo dificultad, discriminación, análisis de distractores y consistencia cuando el volumen de datos permita calcularlos; indicar insuficiencia de muestra en lugar de inventar métricas.
- Mantener confidencial la respuesta correcta y los metadatos de calificación: las consultas destinadas al estudiante solo deben devolver los campos necesarios para responder, nunca la clave correcta, rúbricas privadas o datos de evaluación no autorizados.
- Conservar evidencia de validación de esquemas, integridad de referencias, snapshot, calificación por puntos y resultados psicométricos. La mera existencia de funciones o columnas declaradas no acredita que el flujo las persista ni las aplique.

### AUD-NG-121 - Fechas, duración y máximo de intentos
- Aplicar en servidor fechas de apertura/cierre, duración efectiva y máximo de intentos por estudiante para los exámenes.
- Rechazar inicios y envíos fuera de la ventana autorizada y controlar el tiempo desde un registro persistido en backend; un temporizador del navegador no constituye enforcement.
- Mantener coherencia entre intentos consumidos, borradores, reanudaciones y envíos válidos. La idempotencia de una misma solicitud no debe consumir un intento adicional.

### AUD-NG-124 - Corrección manual, puntuación parcial y trazabilidad de evaluación
- Extender rúbricas y criterios a preguntas abiertas y modalidades que no admiten corrección automática.
- Permitir corrección parcial/manual por pregunta y guardar el progreso de revisión antes de publicar el resultado final.
- Conservar rúbrica/version, puntuaciones por criterio, actor, fecha y rectificaciones; no sobrescribir una evaluación previa sin historial.
- Mantener la separación entre motor de puntuación y control de propiedad/ámbito docente, que se conserva en AUD-NG-158.

### AUD-NG-006 - Idempotencia y recuperación de envíos
- Aplicar una clave idempotente estable a la entrega del examen, con reserva atómica y deduplicación en backend.
- Si la respuesta HTTP se pierde después de persistir el envío, permitir recuperar el resultado asociado a la misma clave sin crear una segunda entrega ni duplicar efectos.
- Coordinar la protección con reintentos de cliente y escrituras del servidor; no depender de `Date.now()` como identificador único.

### AUD-NG-011 - Área curricular y routing del flujo de exámenes
- Persistir y validar el `areaId` canónico en la configuración del examen y en sus relaciones curriculares.
- Enrutar el flujo al servicio/ámbito autorizado por área, evitando que una referencia enviada por el cliente permita cambiar el ámbito de consulta o escritura.
- Mantener este alcance dentro del aislamiento curricular; no duplicar la validación de asignación docente específica que corresponde a AUD-NG-158.

### AUD-NG-002 - Autenticación de resultados y confidencialidad de respuestas
- Verificar la identidad y la propiedad de la entrega antes de devolver resultados de examen.
- Impedir que el estudiante obtenga respuestas correctas, claves, datos de corrección o resultados de terceros mediante endpoints de consulta.
- Aplicar autenticación y autorización antes de leer; filtros o IDs enviados por el cliente no sustituyen la comprobación de identidad/propiedad.

### AUD-NG-158 - Ámbito docente para banco y exámenes
- Restringir la gestión y consulta del banco de preguntas al docente con asignación vigente al área/asignatura/grado correspondiente o a un rol institucional expresamente autorizado.
- Validar el ámbito en backend para cada lectura, creación, modificación y asociación de reactivos/exámenes; no confiar en `profesorId`, `areaId` ni otros atributos de contexto enviados por el cliente.
- Verificar que el docente solo consulte resultados y entregas de exámenes dentro de sus asignaciones autorizadas. La validación de identidad/propiedad del estudiante se mantiene en AUD-NG-002.

**Reconciliación y límites:** AUD-NG-166 se limita al modelo, validación y versionado de reactivos, modalidades, snapshot, puntuación y analítica. AUD-NG-121 conserva fechas/duración/intentos; AUD-NG-124 la revisión y el historial de calificación; AUD-NG-006 idempotencia/recuperación; AUD-NG-011 el ámbito curricular por área; AUD-NG-002 autenticación/propiedad de resultados y confidencialidad; AUD-NG-158 ABAC docente. No se crean IDs nuevos ni se duplican estos controles.

**Evidencia requerida:** pruebas de esquema y referencias válidas/inválidas; persistencia/lectura completa de columnas; snapshot inmutable; renderizado y validación por modalidad; puntuación por puntos y parcial; protección de respuestas; intentos/duración; idempotencia bajo pérdida de respuesta; pruebas ABAC; y cálculos psicométricos reproducibles con datos suficientes. La auditoría actual es estática y no acredita estos resultados.

