# Informe de auditoría - Lote G1

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base:** NG_beta_0.0.0.1  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD inspeccionado:** 5d5f3a48859dd22943d152823eac7a47818391eb  
**Tarea principal:** AUD-NG-101 (En Ejecución)

## Alcance y método

Se auditaron individualmente las tareas históricas REQ-DOC-001, REQ-DOC-002 y REQ-DOC-003 de completadas_legacy.md. La revisión contrastó sus alcances y criterios de aceptación con las interfaces, los controladores JavaScript, los despachadores de microservicios y las funciones de persistencia vigentes en la rama de trabajo. Se consideraron los componentes genéricos existentes para distinguir implementaciones parciales de funcionalidades que solo aparecen en la interfaz o en comentarios.

La inspección fue estática y manual. No se modificó código fuente, no se ejecutaron pruebas automatizadas ni manuales de comportamiento, y no se accedió a Google Sheets, Drive o servicios productivos. Las conclusiones se limitan al código versionado inspeccionado.

## REQ-DOC-001 - Gestión de guías de estudio por asignatura y parcial

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-147.

### Evidencia

- teacher-dashboard.html:422 y siguientes contiene una sección dedicada de guías, con formulario, campos de asignatura, grado, sección, parcial, título, descripción y URL de archivo. Sin embargo, en js/teacher.js no se encontraron manejadores para los identificadores del formulario, sus botones ni la tabla de guías. El formulario visible no está conectado a un flujo de creación, edición, consulta o desactivación.
- student-dashboard.html:209-230 contiene una pestaña y una vista separada para guías, pero js/student.js no referencia los identificadores tab-guias, view-guias, student-guia-parcial, btn-student-reload-guias ni student-guias-list. La vista dedicada no está conectada al controlador estudiantil.
- js/api.js:313-329 declara saveStudyGuide, getStudyGuides y toggleStudyGuideStatus, que envían las acciones createOrUpdateStudyGuide, getStudyGuides y toggleStudyGuideStatus al servicio ACADEMIC. No se encontraron esas acciones en el despachador doPost ni funciones correspondientes en backend/academic-service/Code.gs (revisión del despachador desde la línea 671).
- Existe un flujo alternativo genérico en TASK. PUBLIC_ACTIONS incluye getStudyMaterials (backend/task-service/Code.gs:85-89), y validateRolePermission permite esas acciones antes de verificar un token de sesión (líneas 225-226). Por tanto, la consulta genérica no exige autenticación.
- getStudyMaterials (backend/task-service/Code.gs:1632-1662) recibe grado y asignatura, pero no los aplica en el filtro; tampoco recibe sección. Solo filtra por aulaId, parcial, unidad y tema. La interfaz js/student.js:807-811 envía grado, parcial y asignatura, pero el backend ignora grado y asignatura. Cuando no se proporciona aulaId, el endpoint devuelve todos los materiales activos que coincidan con los filtros restantes.
- createStudyMaterial (backend/task-service/Code.gs:1665-1695) exige únicamente título y URL. No valida MIME, no realiza carga documental ni sanitiza título/descripción/URL. El esquema MaterialesEducativos no registra grado, sección ni asignatura como campos independientes. deleteStudyMaterial permite marcar un registro como Eliminado, pero no se encontró una operación de actualización o sustitución.
- js/student.js:819-830 construye el contenido con innerHTML e interpola directamente tipoRecurso, parcial, título, descripción y archivoUrl. No se observa escape o sanitización en este punto, por lo que el contenido almacenado puede introducir HTML/atributos no confiables en la vista estudiantil.

### Evaluación de calidad e impacto

Hay una funcionalidad genérica de materiales educativos que permite crear, consultar y eliminar registros, pero no satisface el contrato específico de guías por asignatura, grado, sección y parcial. La interfaz dedicada está desconectada, el contrato API apunta a acciones inexistentes en ACADEMIC y el flujo alternativo TASK omite filtros de audiencia y autenticación en la lectura. La interpolación directa de campos en HTML añade un riesgo de XSS almacenado. No puede certificarse que las guías se publiquen solo para alumnos autorizados ni que la sustitución y sanitización funcionen.

## REQ-DOC-002 - Registro de contenido de clases y presentaciones por tema

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-148.

### Evidencia

- js/config.js:351-367 define GLOBAL_SCOPE con TemaActual y un PRESENTATION_INDEX estático de cuatro elementos. El índice contiene nombres de tema, asignatura, grado y archivo local; no se encontró un flujo que lo actualice desde contenido persistido ni consumidores del índice en js/teacher.js o js/student.js.
- js/teacher.js:523 inicializa TemaActual como ["General"] en el flujo de construcción de alcance. backend/academic-service/Code.gs:12393-12402 obtiene temas desde ConfiguracionAcademica, pero esa configuración no constituye un registro de clases con fecha impartida, contenido enriquecido, presentación Drive, documentos complementarios y tareas relacionadas.
- js/teacher.js:1947-1994 contiene un manejador para virtual-classroom-publisher-form, pero teacher-dashboard.html no contiene ese formulario ni sus identificadores. El manejador alternativo de materiales envía a TASK/createStudyMaterial título, descripción, tipo, parcial, unidad fija "Unidad 1", tema fijo "Tema General", URL y autor. No envía fecha de clase, grado, sección, asignatura, presentación Drive estructurada ni tareas relacionadas.
- js/data.js mantiene una estructura estática de temas y rutas HTML locales. No acredita creación/edición por docente ni persistencia de asociaciones entre tema, contenido, presentación y recursos complementarios.

### Evaluación de calidad e impacto

Existen catálogos estáticos de temas/presentaciones y un publicador genérico de anuncios/materiales, pero no se encontró un flujo funcional que permita administrar el contenido de una clase como entidad persistente vinculada a su tema y contexto académico. La relación entre fecha de clase, editor enriquecido, presentación en Drive, documentos complementarios y tareas asociadas no está implementada de forma verificable. El índice estático no demuestra persistencia ni actualización tras recargar.

## REQ-DOC-003 - Creación de tareas polimórficas y validación de contenido obligatorio

**Estado: Cumple parcialmente.**  
**Hallazgo:** AUD-NG-149.

### Evidencia

- teacher-dashboard.html:219-274 ofrece un formulario de tarea con un editor Quill, pero el selector solo contiene "Tarea" y "Crédito Extra". No presenta las tres modalidades requeridas (editor enriquecido, documento adjunto y ejercicios a desarrollar) ni un campo de carga documental para la creación.
- js/teacher.js:3069-3136 inicializa Quill y alterna el estado visual del editor según el tipo Tarea/Crédito Extra. No implementa una selección de modalidad documental o de ejercicios.
- El submit handler js/teacher.js:4738-4748 obtiene FormData, copia quillTask.root.innerHTML a descripcion y envía createTask. No valida que el HTML contenga texto o contenido real antes de enviar.
- El campo descripcion es un input hidden sin required; la fechaLimite sí tiene required en el HTML, pero esa restricción solo protege el formulario del navegador y no constituye validación de servidor.
- createTask (backend/task-service/Code.gs:447-471) extrae los campos y ejecuta appendRow sin comprobar título, descripción, fecha límite, tipo de contenido o consistencia de la modalidad. El endpoint acepta peticiones directas con descripción o fecha límite vacías. Aunque el backend admite archivoUrl, el formulario inspeccionado no proporciona una ruta de carga o asociación de documento al crear la tarea.

### Evaluación de calidad e impacto

La creación estándar con editor enriquecido está parcialmente implementada y se persiste en la hoja Tareas, pero no existe el contrato polimórfico de tres modalidades y la validación crítica depende del cliente. Una petición directa al backend puede almacenar tareas sin contenido o fecha límite. Esto permite registros incompletos y no satisface los criterios de aceptación.

## Resumen del sublote

| Tarea | Resultado | Hallazgo |
|---|---|---|
| REQ-DOC-001 | Cumple parcialmente | AUD-NG-147 |
| REQ-DOC-002 | Cumple parcialmente | AUD-NG-148 |
| REQ-DOC-003 | Cumple parcialmente | AUD-NG-149 |

## Pruebas y límites

- No se ejecutaron pruebas de interfaz, pruebas de endpoints ni pruebas de persistencia.
- No se accedió a hojas de cálculo o carpetas Drive productivas.
- No se verificó el despliegue de los microservicios Apps Script.
- La revisión se limita a la versión de código versionada en la rama NG_beta_0.0.0.1_work.

## Continuidad

- Última tarea histórica auditada: REQ-DOC-003.
- Próximo sublote: G2, comenzando por REQ-DOC-004 y continuando con REQ-DOC-005 y REQ-DOC-006.
- No se modificó completadas_legacy.md ni ChangesLogs.txt.
- No se modificó código fuente.
