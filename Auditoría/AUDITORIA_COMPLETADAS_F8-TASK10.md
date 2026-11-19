# Auditoría F8-Task10 / TAREA-AD-04 — Dashboard de coordinador académico como implementación de referencia

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2212Z-01 (identificador documental; no es ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.269.
- **Checkpoint de cierre:** C1.270.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama de trabajo:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** fcfbb67d90774c561a24b7b1af0b045d9d1ecf02; árbol Git ab2ca5b38b5c326098e3939573eda73b4550899f.
- **Rama base protegida:** NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; comparación inicial: 338 commits adelante, 0 detrás.
- **Tarea auditada:** F8-Task10 / TAREA-AD-04, marcada [X] en completadas.md, líneas 4995–5017.
- **Informe individual previo:** no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK10.md en el árbol de la rama; se ejecutó la auditoría directamente.
- **Dictamen:** **NO CUMPLE**. CA-AD-109 y CA-AD-110 NO CUMPLEN. CA-AD-111 NO CUMPLE (existe trazabilidad parcial en un flujo backend, pero no cubre todas las revisiones ni está integrado al dashboard).

## 1. Objetivo y criterios de aceptación

Comprobar que el dashboard de coordinación académica funciona como caso de referencia completo para responsabilidades múltiples y ámbitos variables, que presenta indicadores reales, supervisa docentes/cargas/vacantes, permite revisar y dictaminar jornalizaciones y sílabos, y ofrece seguimiento de documentación, eventos, horarios y reportes.

- **CA-AD-109:** el dashboard se adapta dinámicamente a las responsabilidades y ámbitos configurados para el coordinador.
- **CA-AD-110:** es posible crear coordinadores por nivel, departamento o carrera sin duplicar código.
- **CA-AD-111:** todas las aprobaciones y revisiones conservan trazabilidad institucional.

## 2. Fuentes, continuidad y recuperación de Pendientes.md

| Fuente | SHA | Inspección |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task10, líneas 4995–5017; requisitos y criterios completos |
| Pendientes.md actual | 676a3f798715f0cdd7d4bc75768472545b8465ee | blob recuperado directamente; lectura convencional devuelve 0 caracteres |
| dashboard-coordinacion.html | 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896 | HTML completo, 162 líneas |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | controlador de coordinación, líneas 517–583 |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 | inicialización/capacidades y navegación, líneas 133–220 |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | permisos, dispatcher, overview, coordinaciones y flujo de revisión |
| AUDITORIAS/Auditoria.txt | c2ca338c093f012f98c854494a3833dac832dba5 | reconciliación de hallazgos previos AUD-NG-191, 225 y 221; máximo actual AUD-NG-315 |
| AUDITORIAS/MapaDependencias.md | 69cf44762f1d79e632faae42b069375da3b25f99 | relaciones previas de RBAC, ABAC, asignaciones y trazabilidad |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 2bbd0f5503a29fdd603a628f73be67af15145012 | historial y continuidad F8-Task07 a F8-Task09 |
| AUDITORIAS/Contexto_personal.txt | 446e9e84a27c6eeb5c5fb04ed62871071da4ff67 | reglas de continuidad y checkpoint C1.269 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | metodología, inspección manual, tareas derivadas, commit único y checkpoint |

### Recuperación e inventario de Pendientes.md

La lectura convencional devolvió 0 caracteres. Se recuperó el blob actual directamente desde GitHub y se verificó que coincide con el blob del HEAD de la rama:

- Blob SHA: 676a3f798715f0cdd7d4bc75768472545b8465ee.
- Tamaño Git previamente verificado: 1.807.629 bytes.
- Contenido recuperado en esta auditoría: 1.786.011 caracteres; 20.224 líneas; 0 caracteres U+FFFD.
- Inventario textual: 515 identificadores TASK-NNN únicos; máximo TASK-636.
- No se encontró F8-Task10 en el registro recuperado ni TASK-670 en Pendientes.md o en el plan vigente.
- TASK-666 a TASK-669 ya están documentadas como tareas derivadas de F8-Task09 en su informe individual, aunque no forman parte del blob de Pendientes.md.

**Decisión:** no se modificó ni restauró Pendientes.md. La metodología vigente excluye este registro del flujo operativo, pero la instrucción expresa de la tarea actual exigía consultarlo; se cumplió recuperando el blob y contrastándolo con completadas.md. Las tareas derivadas nuevas permanecen en el informe de auditoría, conforme a la metodología que establece ese informe como fuente de verdad de las tareas originadas por auditoría.

## 3. Evidencia técnica por componente

### 3.1 dashboard-coordinacion.html — interfaz estática e incompleta

- Líneas 30 y 40–61: el badge inicial presenta literalmente «Ámbito: General». Existen selectores para nivel y departamento, pero no hay selector de carrera.
- Líneas 74–110: se muestran cuatro tarjetas. El HTML no incorpora métricas de eventos, documentación académica, tareas pendientes ni cumplimiento.
- Líneas 115–141: la interfaz contiene únicamente la lista de docentes/cargas y el bloque de revisión de jornalizaciones/sílabos. No incluye vistas para eventos, documentos, horarios ni reportes.
- Líneas 151–160: carga config.js, api.js, ui-common.js y secretary.js; no carga teacher.js. El inicializador invocado es initCoordinatorDashboard.
- Los selectores de nivel y departamento no están conectados a un flujo de filtrado visible. La única acción registrada por el controlador es el botón de actualización.

### 3.2 js/secretary.js — initCoordinatorDashboard y loadCoordinatorDashboardData

**Líneas 518–531 — inicializador**
- Lee currentUser desde localStorage/sessionStorage y presenta nombre/rol.
- No solicita responsabilidades, asignaciones de ámbito ni configuración efectiva del usuario.
- No consulta getAcademicAreaCoordinationScope ni una configuración de roles/responsabilidades.
- Solo enlaza el botón de actualizar a loadCoordinatorDashboardData.

**Líneas 533–583 — carga de datos**
- Llama fetchApi('ACADEMIC', 'getCoordinatorOverview', {}) sin parámetros de ámbito, nivel, departamento, carrera, responsabilidad o período.
- Calcula docentes como el número de docenteUserId únicos en todas las asignaciones recibidas.
- La tarjeta «Jornalizaciones & Sílabos» se establece literalmente en «0 Pendientes»; no deriva el valor de datos del backend.
- La tarjeta «Secciones Asignadas» utiliza offers.length, que representa cantidad de ofertas devueltas, no una cuenta demostrada de secciones únicas.
- Calcula vacantes comparando ofertaId con las asignaciones recibidas; no distingue estado, vigencia, año lectivo ni ámbito del coordinador.
- Muestra solo los primeros diez registros de asignaciones y presenta docenteUserId, rol y ofertaId; no muestra nombre, departamento, carrera, nivel ni sección resuelta.
- Aunque recibe schedules, la variable no se usa para renderizar horarios ni métricas.
- El bloque de revisiones se sustituye siempre por «Todas las jornalizaciones y sílabos están al día»; no consulta planificaciones ni muestra acciones para observar, solicitar correcciones, aprobar o rechazar.
- Ante una respuesta de error o datos ausentes no presenta un estado de error visible en los contenedores; el catch solo escribe console.error.

### 3.3 js/teacher.js — controlador no integrado al dashboard de referencia

- Líneas 133–143: define capacidades estáticas por rol y lee currentUser desde almacenamiento local.
- Líneas 153–220: obtiene elementos de navegación del dashboard docente y organiza sus secciones.
- No se encontró initCoordinatorDashboard ni una llamada a getCoordinatorOverview en el controlador inspeccionado.
- dashboard-coordinacion.html no carga este archivo. Por tanto, teacher.js no aporta lógica a la página de referencia, pese a figurar como archivo involucrado en la tarea.
- La capacidad canManageExams incluye al rol Coordinador, pero es una comprobación frontend estática y no configura responsabilidades ni ámbitos.

### 3.4 backend/academic-service/Code.gs — autorización y overview

**ROLE_PERMISSIONS, líneas 222–223**
- La lista estática de Coordinador incluye getAcademicAreaCoordinationScope, assignTeacherToAcademicArea, consultas de planificación, submitPlanningForReview, reviewPedagogicalPlanning y getPlanningReviewHistory.
- No incluye getCoordinatorOverview.
- El dispatcher sí expone getCoordinatorOverview en la línea 741.
- validateRolePermission consulta primero getDynamicPermissionsForRole. Si la matriz dinámica contiene una concesión explícita puede permitir la acción; si no hay entrada, la lista estática actúa como fallback. No se tuvo acceso a la hoja productiva MatrizPermisosRoles para comprobar si existe una concesión activa. Por ello, el permiso del endpoint no se puede certificar desde el código versionado.

**validateContextualAccess, líneas 465–522**
- El control de ámbito depende de que el cliente envíe scopeType y requestedValue.
- Para Coordinador, la comprobación de área solo se ejecuta si payload.areaId está presente.
- getCoordinatorOverview se llama con payload vacío; por tanto, la función no activa el control contextual de área.
- La ausencia de contexto no provoca rechazo y los errores del control contextual se absorben, conforme a la dependencia AUD-NG-312/AUD-NG-314 ya registrada en F8-Task09.

**getCoordinatorOverview, líneas 6301–6332**
- Lee todas las filas de OfertaAcademica, AsignacionesDocentes y HorariosClase.
- Devuelve ofertas, asignaciones y horarios completos, además de sus totales.
- No utiliza payload, _verifiedUserId, _verifiedRole, responsabilidades, ámbito, departamento, carrera, nivel, año lectivo o vigencia para restringir los resultados.
- La autorización de acción del dispatcher no sustituye el aislamiento por registro. Un coordinador con permiso para invocar el endpoint puede recibir datos que no están filtrados por su asignación institucional.

### 3.5 backend/academic-service/Code.gs — modelo de coordinaciones por área

**getAcademicAreaTemplateCatalog, líneas 4280–4323**
- El catálogo de áreas incluye areaId, nombre, código, departmentId y estado.
- Los departamentos se representan como relación de las áreas curriculares de plantilla; no se observa un modelo equivalente de coordinación por nivel educativo o carrera.

**getAcademicAreaCoordinationScope, líneas 4326–4355**
- La hoja CoordinacionesArea tiene columnas CoordinacionID, AreaID, UserId, NombreCoordinador, AmbitoJSON, Estado y FechaAsignacion.
- La consulta filtra por estado activo y opcionalmente areaId/userId.
- No resuelve expresamente scopeType para nivel, departamento o carrera.
- No comprueba fechas de vigencia dentro de AmbitoJSON; esto también se relaciona con AUD-NG-314 de F8-Task09.

**assignTeacherToAcademicArea, líneas 14186–14315**
- La asignación exige docenteId y areaId.
- El tipo de vinculación puede ser «Coordinador de área», y permite titular/suplente, fechaInicio y fechaFin.
- La clave de búsqueda se construye por docenteId+areaId; el registro de coordinación se sincroniza por areaId+docenteId.
- AmbitoJSON contiene areaId, tipoCoordinacion y fechas, pero no modela de forma tipada nivel, departamento y carrera como dimensiones de coordinación.
- El evento TEACHER_AREA_ASSIGNED usa authorizedBy del payload o «Sistema» como actor. No deriva el actor de _verifiedUserId en la función; la trazabilidad del autor no queda garantizada por este handler.

### 3.6 backend/academic-service/Code.gs — planificación, revisión y trazabilidad

**savePedagogicalPlanning, líneas 5445–5560**
- Crea/actualiza PlanificacionesPedagogicas y registra eventos estructurados de creación/actualización.
- Para roles distintos de Profesor, effectiveDocente puede tomar el valor genérico DOCENTE-TITULAR cuando no se envía docenteUserId.
- No comprueba que el actor coordinador tenga asignación sobre el grado, sección o asignatura de la planificación.

**getPedagogicalPlannings, líneas 5562–5640**
- Los coordinadores pueden consultar las planificaciones.
- Solo aplica restricción de propiedad al rol Profesor; no aplica ámbito por coordinación a los resultados del rol Coordinador.

**submitPlanningForReview, líneas 5642–5715**
- Comprueba rol y que el Profesor solo entregue su propia planificación.
- Actualiza estado y agrega una fila en RevisionesPlanificacion con ID, versión, decisión/estado, observación, actor, rol y fecha.
- No comprueba asignación del coordinador porque esta acción corresponde al envío por el docente; no hay integración con el dashboard de referencia.

**reviewPedagogicalPlanning, líneas 5717–5785**
- Registra revisión con revisionId, planificacionId, versión, decisión, observaciones, callerId, verifiedRole y timestamp; además llama logStructuredEvent.
- Es evidencia de trazabilidad parcial para este flujo.
- No comprueba que el Coordinador esté asignado al ámbito académico de la planificación. Cualquier Coordinador que supere el permiso de acción puede dictaminar una planificación identificada por planificacionId, sin restricción por departamento/carrera/nivel.
- No se encontró un control de versión concurrente que impida dictaminar una versión que haya cambiado entre lectura y escritura.

**getPlanningReviewHistory, líneas 5790–5840**
- Devuelve las revisiones por planificacionId y limita por rol permitido.
- No valida propiedad del Profesor ni ámbito de Coordinador sobre esa planificación.
- La consulta no demuestra una trazabilidad integral para todos los tipos de revisión requeridos por F8-Task10.

No se encontró en el dispatcher ni en el conjunto de funciones inspeccionado un flujo independiente de revisión de sílabos conectado a la interfaz. El flujo existente corresponde a planificación pedagógica/jornalizaciones; la etiqueta «sílabos» de la página no acredita que exista integración funcional.

## 4. Hallazgos

### AUD-NG-316 — Overview de coordinación devuelve conjuntos globales sin filtrar por ámbito
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-109; dependencia de CA-AD-110.
- **Evidencia:** ACADEMIC Code.gs:465–522, 6301–6332 y dispatcher 741; secretary.js:533–540.
- **Descripción:** getCoordinatorOverview recibe payload vacío desde el frontend y devuelve todas las ofertas, asignaciones y horarios. No filtra por identidad verificada, ámbito, responsabilidad, departamento, carrera, nivel o vigencia. validateContextualAccess no ejecuta la comprobación de área si payload.areaId no existe.
- **Impacto:** los resultados del dashboard pueden mezclar datos de áreas o responsabilidades ajenas al coordinador. La autorización de acción no equivale a autorización de cada registro.
- **Reconciliación:** amplía AUD-NG-312/AUD-NG-314 y TASK-666/TASK-668; no duplica la brecha transversal de ABAC.

### AUD-NG-317 — Indicadores y módulos del dashboard son placeholders o cálculos incompletos
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-109 y requisitos funcionales 1, 2 y 4.
- **Evidencia:** dashboard-coordinacion.html:40–141; secretary.js:533–583; ACADEMIC Code.gs:6301–6332.
- **Descripción:** el indicador de jornalizaciones/sílabos está hardcodeado a cero; secciones usa offers.length; horarios se consulta pero no se representa; los filtros de nivel/departamento no se aplican; no hay filtros de carrera; faltan documentación, eventos, tareas pendientes, reportes y vistas de revisión completas. El mensaje de «todo al día» se muestra sin consultar las revisiones.
- **Impacto:** la interfaz comunica un estado operativo no respaldado por datos reales y no cumple el caso de referencia funcional.
- **Reconciliación:** amplía AUD-NG-191/TASK-488 (dashboards con datos reales y navegación funcional); no se crea otra tarea genérica de composición dinámica.

### AUD-NG-318 — El modelo de coordinaciones no representa de forma completa nivel, departamento y carrera
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-110.
- **Evidencia:** ACADEMIC Code.gs:4280–4355 y 14186–14315.
- **Descripción:** el catálogo y la asignación están centrados en areaId; el registro CoordinacionesArea usa AreaID y AmbitoJSON genérico. La relación de área incluye departmentId, pero no existe en este flujo un contrato tipado y verificable para coordinaciones por nivel educativo, departamento y carrera. Las fechas se guardan en JSON, pero getAcademicAreaCoordinationScope no las evalúa.
- **Impacto:** no se acredita que un administrador pueda crear coordinadores por cada dimensión solicitada sin acoplar la lógica a áreas curriculares o duplicar implementaciones.
- **Reconciliación:** amplía AUD-NG-225/TASK-505, AUD-NG-309/TASK-663 y AUD-NG-314/TASK-668; no duplica la normalización general de asignaciones.

### AUD-NG-319 — La trazabilidad de revisión existe solo parcialmente y no está integrada al dashboard
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-111; requisito funcional 3.
- **Evidencia:** secretary.js:575–578; ACADEMIC Code.gs:5717–5840 y 14186–14315.
- **Descripción:** reviewPedagogicalPlanning conserva ID de revisión, versión, decisión, observación, actor, rol y fecha, además de emitir evento estructurado. Sin embargo, el dashboard no carga solicitudes ni ofrece controles de revisión/aprobación; el bloque muestra un mensaje estático. El flujo de revisión no valida el ámbito del coordinador. getPlanningReviewHistory tampoco restringe la consulta por propiedad o ámbito. En la asignación de área, authorizedBy puede provenir del payload y no se deriva en el handler de la identidad verificada.
- **Impacto:** existe evidencia de trazabilidad para una operación concreta, pero no para todas las aprobaciones/revisiones del alcance; no puede asegurarse que el actor esté autorizado para revisar ese registro ni que la acción sea ejecutable desde el dashboard.
- **Reconciliación:** amplía AUD-NG-145/AUD-NG-224/TASK-664 por integridad del actor y registro; TASK-501/TASK-666/TASK-668 por autorización contextual; no duplica la tarea transversal de auditoría.

## 5. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-AD-109 | **NO CUMPLE** | No carga responsabilidades ni ámbitos; el endpoint devuelve datos globales y los filtros de nivel/departamento no afectan las consultas. |
| CA-AD-110 | **NO CUMPLE** | La asignación se basa en área curricular y no acredita coordinación tipada por nivel, departamento y carrera. |
| CA-AD-111 | **NO CUMPLE (parcial)** | El backend registra revisiones de planificación, pero no hay flujo integrado de revisión en el dashboard, el ámbito del revisor no se valida y la trazabilidad del actor no es uniforme. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se consultaron completadas.md, Pendientes.md recuperado desde blob, el plan de auditoría y los informes previos. TASK-670 no aparece en Pendientes.md ni en el plan vigente. Se crea una tarea nueva específica para el dashboard de coordinación. Las causas de RBAC, ámbitos, asignaciones y trazabilidad que ya tienen tareas se amplían por referencia, sin duplicarlas.

### Tarea nueva

#### TASK-670 — Completar el dashboard de coordinación académica como referencia funcional
- **Hallazgos de origen:** AUD-NG-316, AUD-NG-317 y AUD-NG-319.
- **Severidad:** Alto.
- **Objetivo:** entregar un dashboard operativo con datos reales, filtros funcionales, módulos de supervisión y flujos de revisión conectados a servicios existentes.
- **Acción ejecutable:** implementar contrato de overview que reciba identidad/ámbito derivados del backend; calcular indicadores reales de docentes, cargas, vacantes, jornalizaciones, sílabos, eventos y pendientes; aplicar filtros de nivel/departamento/carrera/período; incorporar revisión, observaciones, solicitud de corrección, aprobación/rechazo e historial; añadir estados de error/vacío y navegación a documentación, horarios y reportes.
- **Archivos/módulos afectados:** dashboard-coordinacion.html; js/secretary.js; js/teacher.js solo si se justifica reutilización explícita; backend/academic-service/Code.gs; pruebas de regresión del módulo académico.
- **Dependencias y riesgos:** TASK-488, TASK-501, TASK-505, TASK-636, TASK-666, TASK-668, TASK-664 y TASK-665. Riesgo de exposición interdepartamental si el endpoint entrega registros globales o el cliente controla el ámbito.
- **Alcance:** no duplicar servicios de planificación, calendario, horarios o reportes existentes; reutilizar sus contratos, normalizar adaptadores y no introducir datos ficticios ni indicadores hardcodeados.
- **Criterios de aceptación:** todos los indicadores se derivan de fuentes reales y documentadas; filtros cambian los resultados y el backend aplica el mismo ámbito; un coordinador solo consulta/revisa registros autorizados; los módulos requeridos son accesibles; el estado de revisión corresponde a los datos reales; se cubren errores y resultados vacíos; pruebas verifican los escenarios de nivel/departamento/carrera y roles múltiples.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión externa.

### Tareas existentes ampliadas

- **TASK-488:** incluir el dashboard de coordinación como caso real de composición dinámica; eliminar placeholders, tarjetas sin fuente, filtros visuales no conectados y estados de éxito no respaldados.
- **TASK-505:** ampliar la consola administrativa para asignar coordinadores mediante modelo reutilizable de nivel, departamento y carrera; validar vigencias y ciclo de vida.
- **TASK-501:** exigir autorización por rol, módulo, acción, responsabilidad y ámbito para getCoordinatorOverview, getPedagogicalPlannings, reviewPedagogicalPlanning y getPlanningReviewHistory.
- **TASK-636:** garantizar propagación de token e identidad verificada en todas las llamadas de coordinación; no derivar actor desde localStorage ni campos autorizados por el cliente.
- **TASK-663 / TASK-667:** normalizar relación usuario–rol–responsabilidad–ámbito, incluyendo dimensiones académicas y coordinaciones por área/departamento/carrera/nivel.
- **TASK-668:** validar jerarquía y vigencia de la coordinación al consultar overview, listar planificaciones, revisar y recuperar historial.
- **TASK-664:** registrar actor verificado, responsabilidad, ámbito, recurso, versión, decisión, observaciones, fecha y correlación; impedir que authorizedBy del payload sea la fuente de identidad.
- **TASK-665:** ampliar pruebas de regresión para filtros, indicadores reales, acceso cruzado, coordinadores por nivel/departamento/carrera, aprobaciones, revisión de sílabos y trazabilidad.

### Tareas ya cubiertas por otros IDs

- No se crea otra tarea genérica de RBAC/ABAC: TASK-501 y TASK-666 cubren enforcement contextual.
- No se crea otra tarea de token: TASK-636 cubre propagación e identidad.
- No se crea otra tarea de esquema de asignaciones: TASK-663/TASK-667 cubren relación y clave.
- No se crea otra tarea de vigencia/jerarquía: TASK-668 cubre resolución temporal y jerárquica.
- No se crea otra tarea genérica de auditoría: TASK-664 cubre trazabilidad.
- No se crea otra tarea genérica de pruebas: TASK-665 cubre regresión funcional.

## 7. Pruebas y límites

- **Inspección manual realizada:** completadas.md:4995–5017; dashboard-coordinacion.html completo (162 líneas); secretary.js:517–583; teacher.js:133–220; ACADEMIC Code.gs:222–223, 465–522, dispatcher 741, 4280–4355, 5445–5840, 6301–6332 y 14186–14315; Pendientes.md blob actual; plan, auditoría histórica, mapa, metodología y checkpoint.
- **Pruebas ejecutadas:** recuperación del blob Pendientes.md; verificación de SHA, caracteres, líneas y U+FFFD; inspección manual de funciones, dispatcher, contrato de datos, roles, asignaciones, filtros y revisión; comprobación de inexistencia del informe individual; comparación de ramas.
- **No ejecutadas:** Node, Apps Script runtime, HTTP, navegador/DOM, hojas productivas, pruebas multiusuario/multirrol, revisión real de documentos, escritura de Sheets, E2E o pruebas de permisos con MatrizPermisosRoles productiva.
- **Limitaciones:** no hay acceso a despliegue Apps Script ni a hojas productivas; no se puede verificar si MatrizPermisosRoles contiene una concesión dinámica para getCoordinatorOverview, ni el contenido real de asignaciones de coordinación.
- **Código fuente:** sin modificaciones.
- **Registros maestros:** completadas.md y Pendientes.md sin modificaciones.
- **Rama base:** sin modificaciones.

## 8. Continuidad

- **Última tarea auditada:** F8-Task10 / TAREA-AD-04.
- **Checkpoint inicial:** C1.269.
- **Checkpoint de cierre:** C1.270.
- **Siguiente tarea exacta:** F8-Task11 — integrar los dashboards dinámicos con los módulos y servicios existentes.
- **Próxima acción:** verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK11.md; si falta, auditar directamente js/api.js, js/config.js, backend USER/ACADEMIC/TASK/EXAM/ACCOUNTING y adaptadores de dashboard contra CA-AD-112/113, comprobando contratos, reutilización de endpoints, aislamiento de errores y trazabilidad.
- **Commit de cierre:** se confirmará consultando HEAD después de publicar el único commit que contiene este informe y el checkpoint.
