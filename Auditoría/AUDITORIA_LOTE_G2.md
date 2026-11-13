# Informe de auditoría - Lote G2

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD inspeccionado:** ad37d841ba669eb78ff847ada304f1d54ed9ec57  
**Tareas:** REQ-DOC-004, REQ-DOC-005 y REQ-DOC-006

## Alcance y método

Se contrastaron las tres tareas históricas con el flujo actual de creación, consulta y entrega de tareas. La revisión incluyó el formulario docente, el submit handler, el contrato de persistencia TASK, la serialización de tareas para el estudiante, el renderizado de recursos y los endpoints de entrega/calificación.

Inspección estática y manual. No se modificó código fuente ni se ejecutaron pruebas de interfaz, endpoints o persistencia productiva.

## REQ-DOC-004 - Desacoplamiento de guías de estudio y tareas evaluables

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-150.

### Evidencia

- js/student.js:1820-1823 diferencia visualmente GuiaEstudio/MaterialApoyo: presenta un enlace de descarga y un aviso de que no requiere entrega evaluable. En esa rama no se construye botón de entrega.
- backend/task-service/Code.gs:684-685 devuelve tipoRecurso desde la columna 16 de Tareas, por lo que el discriminador puede llegar al cliente.
- Sin embargo, getStudentTasks no devuelve archivoUrl, aunque getActivityHtml lo consulta en js/student.js:1821. Una guía almacenada como fila de Tareas no recibe su enlace y se renderiza como "Sin archivo adjunto".
- createTask acepta tipoRecurso y lo persiste (backend/task-service/Code.gs:447-471), pero el formulario docente solo ofrece Tarea y Crédito Extra (teacher-dashboard.html:219-226); no permite seleccionar los tipos GuiaEstudio/MaterialApoyo/ejercicios.
- submitAssignment (backend/task-service/Code.gs:892-990) valida userId y tareaId, crea/actualiza una fila en Entregas y calcula tardanza únicamente con fecha límite. No consulta el tipoRecurso de la tarea ni rechaza una guía o material de apoyo.
- gradeSubmission (backend/task-service/Code.gs:1064-1090) actualiza la entrega por entregaId sin comprobar si la tarea relacionada es evaluable.
- El flujo MaterialesEducativos/getStudyMaterials es separado del flujo Tareas/Entregas y su tarjeta estudiantil no solicita entrega; esa separación parcial existe, pero no corrige la falta de invariantes en el backend para filas de Tareas clasificadas como guías.

### Evaluación de calidad e impacto

La distinción visual del cliente está implementada, pero la separación lógica no está protegida por el servidor. Una llamada directa a submitAssignment puede crear una entrega para una tarea marcada como GuiaEstudio/MaterialApoyo y gradeSubmission no comprueba el tipo. Además, el renderer no recibe archivoUrl desde getStudentTasks, por lo que la descarga falla para ese camino. La implementación no garantiza que las guías estén libres de entregas/calificaciones ante solicitudes directas.

## REQ-DOC-005 - Fecha límite predeterminada posterior a la clase

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-151.

### Evidencia

- teacher-dashboard.html:270 contiene fechaClase y teacher-dashboard.html:274 contiene fechaLimite requerida.
- En js/teacher.js no se encontraron referencias a create-task-class-date, create-task-due-date ni fechaClase. El submit handler (4738-4748) recoge FormData, pero no calcula ni asigna una fecha límite a partir de la fecha de clase.
- createTask (backend/task-service/Code.gs:447-471) no recibe ni persiste fechaClase; solo almacena fechaLimite. El campo de fecha de clase enviado por FormData se descarta al no estar en el contrato destructurado.
- No se observó validación de servidor que impida una fecha límite anterior a la fecha de clase. El atributo required de fechaLimite solo obliga al formulario del navegador a enviar algún valor.

### Evaluación de calidad e impacto

Los campos visuales existen, pero la regla principal no está implementada: no se sugiere automáticamente el día siguiente, no se persiste la fecha de clase y no se valida la relación entre ambas fechas. El formulario obliga a introducir una fecha manual, sin garantía de coherencia.

## REQ-DOC-006 - Hora de disponibilidad independiente de la fecha límite

**Estado: Cumple parcialmente (la lógica visual está desconectada del contrato de datos).**  
**Hallazgo:** AUD-NG-152.

### Evidencia

- teacher-dashboard.html:278 declara un input de tipo time con name="horaDisponible".
- js/teacher.js:4738-4748 envía FormData directamente a TASK/createTask; no se encontró conversión de horaDisponible a un timestamp ni asignación a fechaDisponible.
- createTask (backend/task-service/Code.gs:448-469) espera la propiedad fechaDisponible y la almacena en la columna 15. No lee horaDisponible; por tanto, el valor del formulario no se persiste.
- getStudentTasks (backend/task-service/Code.gs:684) devuelve fechaDisponible como ISO 8601, no horaDisponible.
- getActivityHtml (js/student.js:1872-1887) consulta activity.horaDisponible. La propiedad no coincide con la devuelta por el backend, por lo que la condición isScheduledFuture no se activa con el objeto real.
- submitAssignment (backend/task-service/Code.gs:892-990) no valida fechaDisponible. Solo compara la fecha actual con fecha límite para marcar EntregadaTarde; una llamada directa puede crear una entrega antes de la disponibilidad.
- createTask guarda el estado inicial "Activa" (línea 465) y getStudentTasks no devuelve una máquina de estados programada/publicada/disponible/vencida/cerrada.

### Evaluación de calidad e impacto

El control de interfaz existe de forma aislada, pero el nombre del campo, su formato y la propiedad de respuesta no coinciden. Además, el backend no impone la disponibilidad, por lo que ocultar el botón no constituye una protección. La fecha límite y la hora de disponibilidad no están desacopladas de forma efectiva ni hay una máquina de estados verificable.

## Resumen del sublote

| Tarea | Resultado | Hallazgo |
|---|---|---|
| REQ-DOC-004 | Cumple parcialmente | AUD-NG-150 |
| REQ-DOC-005 | Cumple parcialmente | AUD-NG-151 |
| REQ-DOC-006 | Cumple parcialmente | AUD-NG-152 |

## Pruebas y límites

- No se ejecutaron pruebas de interfaz ni llamadas directas a los endpoints.
- No se accedió a hojas de cálculo ni datos productivos.
- No se verificó el despliegue de Apps Script.
- No se modificó código fuente ni completadas_legacy.md.

## Continuidad

- Última tarea histórica auditada: REQ-DOC-006.
- Próximo sublote: Lote H, comenzando por REQ-DOC-007.
