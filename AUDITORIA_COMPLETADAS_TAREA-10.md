# Auditoría TAREA-10

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Evidencia

- ChangesLogs.txt atribuye a TAREA-10 solo un comentario identificativo en backend/task-service/Code.gs; no registra cambios funcionales en los módulos de tareas/entregas ni en los clientes.
- createTask admite tarea, tipo, asignatura, grado/sección, fecha límite y fecha disponible, pero no modela asignación grupal, recurrencia, fecha de publicación/cierre ni límites de intentos. updateTask modifica la fila actual sin historial de versiones de la definición.
- submitAssignment crea borradores y conserva versiones en EntregasVersiones. Sin embargo, versionNum se calcula contando filas sin bloqueo/idempotencia; el token de recepción se genera y devuelve, pero no se almacena para verificación posterior. No se aplica el límite de intentos; solo se marca EntregadaTarde.
- saveSubmissionDraft reutiliza submitAssignment. No se demuestra un flujo de revisión parcial con progreso de evaluación guardado.
- gradeSubmissionWithRubric almacena el JSON recibido y la nota, sin validación estructurada de criterios, ponderaciones, total o versión de rúbrica. gradeSubmission actualiza la nota/estado/comentario en la fila principal.
- returnSubmissionForRevision cambia el estado y comentario en la fila principal; no registra un evento de revisión versionado y usa profesorId del payload para identificar al autor del comentario.
- getSubmissionComments devuelve todos los comentarios coincidentes, incluidos los marcados esPrivado=true. ROLE_PERMISSIONS permite consultar esa acción a Estudiante/Alumno, Padre, Tutor y Responsable; no se comprueba relación con la entrega ni se filtran comentarios privados.
- addSubmissionComment confía en autorId, rolAutor y esPrivado enviados por el cliente; un cliente puede declarar otro autor/rol o marcar el comentario como privado.
- getSubmissionVersions permite consultar por entregaId sin comprobar que la entrega pertenezca al usuario o al ámbito docente. La rama de filtro por entregaId no requiere userId.
- deleteSubmission elimina la fila principal y envía el archivo a la papelera, pero no elimina ni marca de forma coherente las filas asociadas en EntregasVersiones y ComentariosEntregas.
- getStudentTasks y getAllTasks figuran en PUBLIC_ACTIONS; su exposición sin token ya está cubierta por AUD-NG-002. La propiedad docente de tareas/calificaciones está cubierta por AUD-NG-158/AUD-NG-124.

## Hallazgo nuevo

**AUD-NG-165 - Proteger la privacidad y el acceso contextual a comentarios y versiones de entregas.** Alto (P1). Debe filtrar comentarios privados por rol y relación; derivar autor/rol de claims verificados; limitar consulta de versiones al estudiante propietario o docente asignado incluso cuando se use entregaId; validar devoluciones; y conservar la relación histórica al eliminar entregas.

## Tareas existentes ampliadas

- AUD-NG-149: tareas grupales/recurrentes, comprobante persistido, idempotencia y validación del ciclo de vida.
- AUD-NG-121: límites de intentos y reglas de reentrega, además de penalización tardía.
- AUD-NG-152: estados de publicación/apertura/vencimiento/cierre.
- AUD-NG-124: historial de rúbricas, revisiones parciales y rectificaciones.
- AUD-NG-158: autoría derivada de sesión y ámbito docente en comentarios/devoluciones.
- AUD-NG-002: consultas sensibles no públicas.

No se duplica el alcance de AUD-NG-002 (consultas públicas), AUD-NG-124 (propiedad/calificaciones) ni AUD-NG-158 (ABAC de escrituras docentes).

## Calidad y límites

Calidad insuficiente por exposición de comentarios privados, consulta de versiones sin ámbito, autoría controlada por payload y falta de idempotencia/flujo completo. Auditoría estática; no se ejecutaron pruebas de roles, acceso cruzado, concurrencia, idempotencia o privacidad. No se modificó código fuente, completadas.md ni ChangesLogs.txt.
