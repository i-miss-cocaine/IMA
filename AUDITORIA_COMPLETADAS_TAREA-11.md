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
