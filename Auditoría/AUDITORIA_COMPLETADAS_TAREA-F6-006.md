# AUDITORÍA TÉCNICA - TAREA-F6-006: Plantilla de microservicio académico reutilizable

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.222  
**Checkpoint de cierre:** C1.223  
**Sesión:** IMA-AUDIT-20261107-2045Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría también cubre TAREA-F6-031, que repite el mismo título y amplía los criterios de TAREA-F6-006. Ambos registros están marcados [X] y no tenían informe individual. Se crean informes por ID, pero comparten el bloque canónico F6-006-A01..A06 para evitar tareas duplicadas.

## 1. Continuidad y fuentes

- HEAD inicial: 4271c00e2eeb47143a91ebeaca5e45ea0421972b (C1.222), rama NG_beta_0.0.0.1_work.
- Comparación anterior con NG_beta_0.0.0.1: 290 commits adelante, 0 detrás. La rama base no se modifica.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676:
  - TAREA-F6-006 [X], líneas 2658-2696; requisitos R1-R6 y CA-037..CA-041.
  - TAREA-F6-031 [X], líneas 3517-3588; mismo título, alcance ampliado y CA-061..CA-070/CA-151..CA-153.
- Pendientes.md se recuperó desde blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene F6-006/F6-031; sí contiene AUD-NG-002, AUD-NG-011, AUD-NG-158 y AUD-NG-164 y sus tareas derivadas. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1967-1970 afirma que getAcademicAreaTemplateCatalog y getAcademicAreaCoordinationScope son una plantilla parametrizada para siete áreas sin hardcodeo. El código sí contiene defaultAreas con nombres/IDs fijos.
- No existían AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md ni AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-031.md; se crean ambos.
- Se revisaron antecedentes existentes: AUD-NG-002 (consultas públicas), AUD-NG-011 (instancias/aislamiento), AUD-NG-158 (ABAC docente/coordinación), AUD-NG-164 (catálogo de áreas), AUD-NG-149 (tareas), AUD-NG-165 (comentarios/versiones), AUD-NG-167 (calificaciones), AUD-NG-168 (ofertas), AUD-NG-124 (propiedad/historial). Se amplían, no se duplican.

## 2. Archivos y evidencia inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, 14.449 líneas:
  - ROLE_PERMISSIONS:165-240.
  - registerCurricularAreaExtension/runCurricularAreaServiceTests:4080-4205.
  - getAcademicAreaCoordinationScope:4321-4355.
  - getAcademicAreaTemplateCatalog:4281-4320.
  - deployAcademicMicroserviceInstance:4494-4575.
  - createSubjectCatalogItem/createStudyPlan:6011-6065.
  - createAcademicOffer/getTeacherAssignments:6180-6248.
  - getStudentFile:2510-2600.
  - assignTeacherToAcademicArea:14180-14315.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe, 2.411 líneas:
  - PUBLIC_ACTIONS/ROLE_PERMISSIONS:80-125.
  - validateRolePermission/doPost:200-435.
  - createTask:447-495.
  - getStudentTasks:613-675.
  - submitAssignment:892-945.
  - getAllTasks:1177-1210.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c, 2.097 líneas:
  - PUBLIC_ACTIONS/ROLE_PERMISSIONS:55-120.
  - validateRolePermission/doPost:205-410.
  - createExam:506-545.
  - getAllExams/getExamQuestions:609-675.
  - submitExam/getStudentExams:996-1110.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: token de rol único, asignaciones de ámbito y catálogo de roles.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc, 965 líneas.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, 353 líneas.
- Los servicios ACADEMIC, TASK y EXAM usan el mismo SPREADSHEET_ID. TASK tiene un DRIVE_FOLDER_ID fijo; no se define un recurso por área/instancia.

## 3. Hallazgos

### H1 - ALTO/P1: catálogo de áreas hardcodeado y divergente entre backend y frontend
- getAcademicAreaTemplateCatalog (academic-service:4281-4320) contiene defaultAreas con siete nombres, IDs, códigos y departamentos escritos directamente en el código; cuando la hoja está vacía, los inserta con estado Activo, serviceUrl vacío y tools vacío.
- js/config.js mantiene un catálogo de doce áreas, doce servicios curriculares y ocho departamentos. No existe reconciliación automática con las siete áreas del backend; los IDs y códigos no forman un único catálogo canónico.
- registerCurricularAreaExtension permite registrar una extensión, pero recibe areaId/code desde payload, no acredita unicidad global de IDs/códigos/serviceKey y actualiza la fila existente sin versionado/historial.
- createSubjectCatalogItem genera ASIG-Date.now y guarda areaAcademica como texto libre; no valida que el área exista o esté activa ni evita colisiones/códigos duplicados.
- createStudyPlan genera PLAN-Date.now y conserva grado como texto. No hay entidades GradoID/SeccionID ni CRUD específico de grados/secciones; createAcademicOffer almacena grado y seccion como cadenas.
**Impacto:** la plantilla no es plenamente declarativa; backend y frontend pueden ofrecer áreas distintas y las entidades no comparten identificadores canónicos. CA-037/CA-038 se cumplen parcialmente; AUD-NG-164 se mantiene abierto.

### H2 - CRÍTICO/P0: el despliegue de instancias es un registro de metadatos, no un despliegue real
- deployAcademicMicroserviceInstance (4494-4575) no crea ni copia un proyecto Apps Script, no publica una versión ni crea Spreadsheet/Drive folder. Solo escribe una fila en InstanciasMicroserviciosAcademicos.
- scriptId y driveFolderId son opcionales y se guardan como cadena vacía cuando faltan.
- spreadsheetId usa SPREADSHEET_ID compartido como fallback, por lo que varias áreas pueden apuntar a la misma base.
- diagnostics.connectivityCheck se fija literalmente en PASS; spreadsheetBinding/driveFolderBinding solo indican si el cliente envió IDs, no verifican acceso, aislamiento ni conectividad.
- finalState se fija en Activo aunque scriptId y driveFolderId estén vacíos.
- La función llama registerCurricularAreaExtension con serviceUrl vacío. No existe endpoint propio por área ni enrutamiento dinámico en js/api.js; fetchApi usa SERVICE_URLS estáticos.
**Impacto:** la tabla puede mostrar instancias activas que no existen y que comparten almacenamiento. CA-039/CA-068 no se cumplen. Se amplía AUD-NG-011 y se deja el despliegue real para la tarea siguiente F6-007/F6-032.

### H3 - ALTO/P1: las relaciones académicas no se conservan mediante IDs inmutables y versionados
- createAcademicOffer genera OFE-Date.now, guarda asignaturaId, pero grado/seccion son texto; no registra areaId ni una referencia inequívoca a instancia curricular.
- createTask y createExam guardan asignatura, grado, sección y profesor como valores de texto/identificadores suministrados; no persisten de forma consistente areaId, instanceId, ofertaId, asignacionId y periodoId.
- Los IDs de asignaturas, planes, ofertas, tareas y exámenes se construyen con Date.now sin comprobación de unicidad; las operaciones concurrentes pueden colisionar.
- assignTeacherToAcademicArea identifica una asignación por docenteId+areaId y actualiza la misma fila activa; no crea una versión histórica inmutable. La coordinación se actualiza por área/docente y el JSON contiene areaId, tipo y fechas, pero no subjectId/gradeId/sectionId/periodId.
- registerCurricularAreaExtension actualiza una fila existente y reemplaza metadatos; toggleCurricularAreaStatus no versiona el catálogo ni reconcilia ofertas, tareas, exámenes o calificaciones históricas.
- Las tareas/exámenes no quedan enlazados a la oferta académica/periodo/asignación que les dio origen; cambiar docente, sección o año puede romper consultas y reconstrucción histórica.
**Impacto:** no se acredita la cadena Grado -> Sección -> Asignatura -> Docente/Periodo -> Tarea/Examen -> Entrega/Calificación con IDs estables y snapshots. CA-039/CA-040/CA-063/CA-064 no se cumplen.

### H4 - CRÍTICO/P0: consultas de tareas y exámenes eluden la autenticación y el aislamiento
- task-service declara getStudentTasks y getAllTasks en PUBLIC_ACTIONS; exam-service declara getStudentExams y getAllExams en PUBLIC_ACTIONS.
- validateRolePermission permite las acciones públicas sin comprobar sesión/rol; doPost despacha luego los handlers.
- getStudentTasks/getStudentExams usan _verifiedUserId cuando existe, pero al ser públicas aceptan userId del payload; además aceptan grado/seccion del cliente sin comprobar la matrícula u oferta real.
- getAllTasks/getAllExams no requieren profesorId y pueden devolver el conjunto general de registros. Las consultas no filtran por areaId ni instanceId.
- getExamQuestions está permitido a estudiantes/padres/tutores y no comprueba que el examId corresponda a una oferta/curso matriculado.
- getTeacherAssignments recibe docenteUserId del payload y no lo vincula al usuario verificado ni al ámbito asignado.
- AUD-NG-002 ya documenta este bypass en las mismas funciones; el código actual conserva la brecha. No se crea un ID duplicado.
**Impacto:** consulta no autenticada de tareas y metadatos de exámenes; enumeración por userId/grado/sección; lectura fuera del curso/área asignada. CA-065/CA-066/CA-070 no se cumplen.

### H5 - ALTO/P1: el ámbito de coordinación existe como registro, pero no limita las operaciones
- getAcademicAreaCoordinationScope (4321-4355) filtra por areaId/userId solo si esos parámetros llegan; si no llegan, devuelve todas las coordinaciones activas.
- La consulta no deriva userId del token ni valida que el coordinador tenga asignada esa área.
- ambitoSupervision se persiste con areaId, tipoCoordinacion y fechas; no representa materia, grado, sección ni período.
- assignTeacherToAcademicArea valida que el docente no esté inactivo, pero no comprueba que areaId exista/esté activa; actualiza la asignación existente in-place y utiliza authorizedBy del payload para la auditoría.
- Las funciones getAcademicOffers/getTeacherAssignments y los servicios TASK/EXAM no aplican este ámbito al leer o escribir.
- user-service tiene assignRoleScope/getInternalRoleAssignments, pero esas asignaciones no se integran con los claims ni con la autorización de ACADEMIC/TASK/EXAM.
**Impacto:** un coordinador no queda limitado de forma demostrable a su área/subject/grade/section/period; CA-041/CA-067/CA-151/CA-152/CA-153 son parciales o incumplidos. Se amplía AUD-NG-158.

### H6 - ALTO/P1: la configuración de frontend y backend no enruta por instancia
- js/config.js declara catálogos estáticos y URLs de servicios; js/api.js recibe el nombre del servicio y consulta SERVICE_URLS, sin resolver areaId/instanceId/serviceKey.
- task-service, exam-service y academic-service usan el mismo Spreadsheet ID; las filas de tareas/exámenes no contienen instanceId/areaId de manera consistente.
- El catálogo del backend devuelve serviceUrl/tools, pero las áreas semilla tienen serviceUrl vacío y tools []; getInstitutionalCatalog no devuelve todos esos campos ni filtra necesariamente áreas inactivas.
**Impacto:** aunque se registre un área adicional, el frontend no puede dirigir sus operaciones a un proyecto/base/Drive independiente. CA-068/CA-069 no se cumplen.

### H7 - ALTO/P1: las pruebas de área y el estado Activo son simulados
- runCurricularAreaServiceTests (4147-4202) construye cuatro resultados PASS constantes: conectividad, RBAC, integridad histórica y esquema de herramientas. No ejecuta llamadas a otra instancia, pruebas de permisos, comparación de datos ni validaciones de almacenamiento.
- Si los valores constantes son PASS, cambia automáticamente el estado Inactivo_PendientePruebas a Activo.
- deployAcademicMicroserviceInstance también fija connectivityCheck en PASS y EstadoDespliegue en Activo.
**Impacto:** una instancia no desplegada o no aislada puede aparecer como activa y probada. No se puede usar ese estado como evidencia de cumplimiento. CA-070 no se acredita.

## 4. Matriz de requisitos

### TAREA-F6-006 (R1-R6, CA-037..CA-041)
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 plantilla reutilizable para siete áreas | Parcial | hay catálogo seed, pero está hardcodeado y no coincide con el frontend de doce áreas. |
| R2 áreas/asignaturas/grados/secciones configurables | Parcial | hay registro de áreas, asignaturas y ofertas; faltan catálogos relacionales de grado/sección y validación. |
| R3 relaciones mediante IDs inmutables | No cumple | tareas/exámenes usan nombres y no enlazan área/instancia/oferta/periodo; IDs Date.now sin unicidad. |
| R4 preservar historial ante cambios | No cumple | asignaciones y catálogo se actualizan in-place; falta versionado/snapshot. |
| R5 docentes/estudiantes/coordinadores con alcance específico | No cumple | consultas públicas y filtros de cliente; no se aplica ámbito de coordinador. |
| R6 instancias independientes por área | No cumple | registro de metadatos sin despliegue real; Spreadsheet compartido y URLs estáticas. |
| CA-037 | No cumple | defaultAreas está codificado y diverge del frontend. |
| CA-038 | Parcial | APIs para extensiones/asignaturas/ofertas, pero no CRUD completo ni validación de relaciones. |
| CA-039 | No cumple | IDs/relaciones no son completos ni inmutables. |
| CA-040 | No cumple | no hay historial versionado de asignaciones y relaciones. |
| CA-041 | No cumple | alcance de coordinación no se aplica en consultas/operaciones. |

### TAREA-F6-031 (alcance ampliado, CA-061..CA-070 y CA-151..CA-153)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-061 siete áreas y materias configurables | Parcial | siete seeds hardcodeados; no sincronizados con frontend ni catálogo de materias por área. |
| CA-062 crear áreas, materias, grados, secciones y asignaciones sin código | Parcial | APIs parciales; grados/secciones son texto, no entidades administrables. |
| CA-063 relaciones por IDs inmutables | No cumple | falta areaId/instanceId/ofertaId/periodoId en tareas/exámenes. |
| CA-064 preservar calificaciones históricas | No cumple | asignaciones y catálogo mutables; sin snapshots/versiones. |
| CA-065 estudiante solo consulta materias matriculadas | No cumple | acciones públicas y grado/sección del payload sin matrícula verificada. |
| CA-066 docente solo consulta grupos asignados | No cumple | getAllTasks/getAllExams públicos y getTeacherAssignments confía en docenteUserId. |
| CA-067 coordinador solo supervisa ámbito asignado | No cumple | scope opcional y no aplicado en servicios. |
| CA-068 instancia propia de Apps Script/Spreadsheet/Drive/config | No cumple | despliegue simulado, IDs opcionales y fallback a Spreadsheet compartido. |
| CA-069 múltiples roles sin duplicar cuenta ni heredar privilegios | Parcial | existen ámbitos, pero no roles activos integrados al token/validación. |
| CA-070 funciones y módulos siguen operativos por área | No cumple | no hay routing por instancia ni pruebas reales; las consultas pueden mezclar áreas. |
| CA-151 coordinador con ámbito configurable | Parcial | solo areaId/tipo/fechas; faltan subject/grade/section/period y enforcement. |
| CA-152 coordinación enlazada a relaciones/periodos | No cumple | el JSON de coordinación no conserva esos IDs. |
| CA-153 coordinador con otros roles sin ampliar privilegios | No cumple | token usa un solo rol y no hay intersección de permisos por ámbito. |

## 5. Reconciliación con auditorías existentes

No se crean IDs globales AUD-NG nuevos:
- AUD-NG-002: acciones públicas TASK/EXAM y consultas por userId/grado/sección; confirmado nuevamente.
- AUD-NG-011: despliegue/aislamiento de instancias académicas; se amplía con la implementación actual de deployAcademicMicroserviceInstance.
- AUD-NG-158: ABAC de docentes/coordinadores y asignaciones por área.
- AUD-NG-164: catálogo de áreas, IDs, sincronización y configuración.
- AUD-NG-149: validación/estructura de tareas.
- AUD-NG-165: privacidad y propiedad de comentarios/versiones.
- AUD-NG-167: calificaciones e historial.
- AUD-NG-168: ofertas académicas y planificación.
- AUD-NG-124: propiedad e invariancia de registros históricos.
- TAREA-F6-031: expansión del mismo título y alcance de F6-006; se conserva el ID y se crea informe individual que referencia el bloque canónico de tareas.

## 6. Tareas ejecutables derivadas de los hallazgos

Los siguientes IDs son locales a esta auditoría. TAREA-F6-031 referencia este mismo bloque.

### F6-006-A01 - Consolidar el catálogo curricular y los IDs canónicos
- **Origen:** H1.
- **Prioridad:** P1 / Alto.
- **Acción:** establecer un catálogo único para áreas, departamentos, asignaturas, grados, secciones y periodos; sincronizar frontend/backend; eliminar defaultAreas de la lógica; validar unicidad y estado.
- **Criterios:** misma cantidad/IDs/códigos en frontend y backend; creación/edición/desactivación por configuración; no hay nombres duplicados ni áreas inexistentes; cada materia pertenece a un areaId válido.
- **Referencias:** AUD-NG-164 y AUD-NG-011.
- **Estado:** Pendiente.

### F6-006-A02 - Implementar despliegue real e aislamiento por instancia
- **Origen:** H2 y H6.
- **Prioridad:** P0 / Crítico.
- **Acción:** crear/publicar proyecto Apps Script por instancia; provisionar Spreadsheet, Drive folder y configuración propios; verificar IDs/propiedad/conectividad; registrar deployment/version reales; generar serviceUrl y routing dinámico por areaId/instanceId.
- **Criterios:** ningún fallback a la base compartida; instancia no pasa a Activo sin recursos y pruebas reales; despliegue idempotente con rollback; frontend enruta al endpoint correcto.
- **Referencias:** AUD-NG-011; TAREA-F6-007/TAREA-F6-032.
- **Estado:** Pendiente.

### F6-006-A03 - Modelar relaciones académicas y preservar historial
- **Origen:** H3.
- **Prioridad:** P1 / Alto.
- **Acción:** incorporar areaId, instanceId, subjectId, gradeId, sectionId, offerId, assignmentId y periodId en entidades; sustituir IDs Date.now por IDs únicos; crear snapshots/versiones append-only de asignaciones, ofertas y cambios de catálogo.
- **Criterios:** tareas/exámenes/entregas/calificaciones apuntan a entidades por ID; cambiar docente/sección/año no reescribe el historial; IDs únicos y referencias validadas.
- **Referencias:** AUD-NG-164, AUD-NG-167, AUD-NG-168 y AUD-NG-124.
- **Estado:** Pendiente.

### F6-006-A04 - Aplicar ABAC para docentes, estudiantes y coordinadores
- **Origen:** H5.
- **Prioridad:** P0 / Crítico.
- **Acción:** integrar roles/ámbitos verificados en token o resolverlos server-side; validar area/subject/grade/section/period en cada lectura/escritura; derivar docenteUserId y coordinatorId de identidad verificada; validar matrícula real del estudiante.
- **Criterios:** coordinador solo accede a su ámbito; docente solo a ofertas/grupos asignados; estudiante solo a materias matriculadas; ningún filtro de cliente amplía permisos.
- **Referencias:** AUD-NG-158, AUD-NG-124 y AUD-NG-002.
- **Estado:** Pendiente.

### F6-006-A05 - Retirar consultas públicas sensibles y aislar TASK/EXAM por instancia
- **Origen:** H4 y H6.
- **Prioridad:** P0 / Crítico.
- **Acción:** sacar getStudentTasks/getAllTasks/getStudentExams/getAllExams de PUBLIC_ACTIONS; exigir token y autorización contextual; filtrar por areaId/instanceId/oferta/propietario; proteger getExamQuestions por matrícula; validar docente asignado.
- **Criterios:** sin token se rechazan consultas sensibles; userId/grade/section del cliente no sustituyen identidad/matrícula; no se enumeran registros de otras áreas; el docente no consulta otros grupos.
- **Referencias:** AUD-NG-002, AUD-NG-149 y AUD-NG-165.
- **Estado:** Pendiente.

### F6-006-A06 - Sustituir pruebas simuladas por pruebas E2E y de aislamiento
- **Origen:** H2, H4 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** implementar pruebas reales de conectividad, RBAC, integridad histórica, almacenamiento y routing; probar siete áreas, multirol, coordinación, concurrencia, cambios de docente/sección/año y caída de una instancia.
- **Criterios:** no hay PASS constante; pruebas verifican recursos reales en entorno aislado; estado Activo solo después de pasar todas; resultados con evidencias reproducibles.
- **Referencias:** TAREA-F6-003-A09, AUD-NG-011 y AUD-NG-158.
- **Estado:** Pendiente.

## 7. Cierre
- TAREA-F6-006: NO CUMPLE.
- TAREA-F6-031: NO CUMPLE; mismo título con criterios ampliados.
- Ambos estados [X] de completadas.md se conservan como registro histórico.
- Pendientes.md se recuperó desde el blob íntegro y no se modificó.
- Se crean informes individuales para ambos IDs, con un único bloque canónico F6-006-A01..A06.
- No se modificó código, configuración, tests ni datos productivos.
- No se ejecutaron endpoints, Apps Script, despliegues, Drive, Sheets productivas ni pruebas E2E.
- Siguiente tarea secuencial: TAREA-F6-007 y su registro ampliado TAREA-F6-032, ambos relacionados con el despliegue configurable de instancias académicas. Buscar informes e historial antes de auditar.

## 8. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2658-2696 y 3517-3588.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1967-1970.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
