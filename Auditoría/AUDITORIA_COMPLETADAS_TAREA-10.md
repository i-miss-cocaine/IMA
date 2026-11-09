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


## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-165 - Privacidad de comentarios y acceso contextual a versiones de entregas (P1)
- Filtrar `getSubmissionComments` por identidad autenticada, propiedad de la entrega y relación autorizada con el estudiante/tarea. Los comentarios privados no deben aparecer en consultas de estudiantes, padres, tutores o responsables salvo que una regla institucional explícita y verificable lo autorice.
- Aplicar la misma autorización tanto si la consulta usa `entregaId` como `tareaId`; no permitir que un identificador conocido sustituya la comprobación de relación.
- En `getSubmissionVersions`, comprobar que la entrega pertenece al estudiante solicitante o que el docente tiene asignación/ámbito vigente sobre ella. Denegar consultas por `entregaId` arbitrario y no devolver archivos/versiones de terceros.
- Derivar autor e identidad de rol desde los claims verificados de la sesión. No confiar en `autorId`, `rolAutor` ni en declaraciones del cliente para establecer quién escribe un comentario.
- Validar en servidor la opción `esPrivado`, quién puede crear comentarios privados y quién puede leerlos. El cliente no debe poder elevar su rol, suplantar al autor ni decidir por sí solo la visibilidad efectiva.
- Validar que una devolución para revisión sea realizada por un docente autorizado para esa entrega y que el actor se derive de la sesión, no de `profesorId` enviado en el payload.
- Al eliminar una entrega, conservar la trazabilidad de sus versiones y comentarios. Aplicar baja lógica/archivo coherente o una operación transaccional que preserve el vínculo histórico; no dejar registros huérfanos ni eliminar evidencia sin una política explícita.
- Registrar y probar los intentos de acceso denegados, sin filtrar contenido privado en mensajes de error, logs visibles al usuario o respuestas parciales.

### AUD-NG-149 - Modalidades de tarea y robustez del ciclo de entrega
- Ampliar el modelo de tareas para soportar asignaciones grupales y recurrencia, con reglas explícitas de participantes, periodicidad y ciclo de vida.
- Persistir el comprobante/token de recepción y verificarlo posteriormente contra la entrega almacenada; generar el token sin persistirlo no acredita recepción verificable.
- Aplicar idempotencia y control de concurrencia al crear versiones/entregas para impedir duplicados y colisiones en el cálculo de `versionNum`.
- Validar en servidor modalidad, contenido, fechas y transiciones permitidas del ciclo de vida, sin depender de controles HTML o del navegador.

### AUD-NG-121 - Límites de intentos, reentregas y penalización tardía
- Aplicar en backend el máximo de intentos y las reglas de reentrega configuradas para la tarea; rechazar nuevas entregas cuando se agote el límite.
- Definir cómo se cuentan intentos frente a borradores, reintentos idempotentes y versiones válidas, sin permitir que un mismo envío se cuente varias veces.
- Mantener la regla de penalización tardía ya asociada a este ID y aplicarla en servidor al calcular la nota, sin confiar en una calificación final enviada por el cliente.

### AUD-NG-152 - Estados de publicación y disponibilidad de tareas
- Modelar y validar por separado publicación, apertura, vencimiento y cierre de una tarea.
- Impedir entregas antes de la apertura y después del cierre, aplicando la política de excepciones autorizadas cuando corresponda.
- Mantener coherencia entre estado visible, fechas programadas y reglas de recepción en backend; la UI no puede ser la única barrera.

### AUD-NG-124 - Rúbricas, revisión parcial e historial de rectificaciones
- Validar estructuralmente la rúbrica en servidor: criterios, ponderaciones, suma de pesos, valores permitidos y versión aplicable a la entrega.
- Conservar la versión de rúbrica usada para cada evaluación, evitando que una modificación posterior altere retrospectivamente una nota ya emitida.
- Permitir guardar progreso de revisión parcial sin publicar una calificación final incompleta.
- Registrar las rectificaciones y cambios de nota como eventos/versiones con valor anterior, valor nuevo, actor, fecha y motivo; no sobrescribir la única fila de calificación.
- Validar la transición entre estados de entrega, revisión, devolución y calificación para preservar el historial evaluativo.

### AUD-NG-158 - Autoría verificada y ámbito docente en comentarios/devoluciones
- Extender la validación de asignación docente al flujo de comentarios, devoluciones y revisión de entregas.
- Derivar el docente actor desde `_verifiedUserId` y verificar su asignación vigente a la asignatura/grado/sección de la entrega antes de escribir o cambiar su estado.
- Rechazar `profesorId` y otros datos de autoría enviados por el cliente cuando no coincidan con la identidad y el ámbito verificados.
- Conservar actor, fecha, ámbito y motivo de cada devolución/cambio, sin sustituir la responsabilidad de AUD-NG-165 sobre privacidad y lecturas.

### AUD-NG-002 - Autenticación obligatoria para consultas sensibles
- Asegurar que `getSubmissionComments` y `getSubmissionVersions` no se expongan como acciones públicas ni puedan ejecutarse sin identidad de sesión verificada.
- Aplicar autorización antes de consultar o devolver datos; los filtros aportados por el cliente no sustituyen autenticación ni control de acceso.
- Mantener el alcance transversal de AUD-NG-002 sobre consultas sensibles públicas. La autorización contextual, privacidad de comentarios y propiedad de versiones para estas dos operaciones se especifica en AUD-NG-165.

**Reconciliación:** AUD-NG-165 queda limitado a privacidad/propiedad de comentarios y versiones; AUD-NG-002 conserva autenticación de consultas sensibles; AUD-NG-124 conserva calificaciones/rúbricas/historial; AUD-NG-158 conserva autoría y ámbito docente de escrituras. AUD-NG-149/121/152/124 cubren modalidades, intentos, ciclo de vida y revisión. No se crean identificadores adicionales ni se absorben los alcances de esas tareas.

**Evidencia requerida:** pruebas con roles y relaciones válidas/no válidas, acceso cruzado por IDs, comentarios privados, suplantación de autor, consulta de versiones, eliminación con historial preservado, concurrencia/idempotencia, límites de intentos, estados de publicación y revisión parcial/rectificación. La auditoría actual fue estática y no acredita estos comportamientos.

