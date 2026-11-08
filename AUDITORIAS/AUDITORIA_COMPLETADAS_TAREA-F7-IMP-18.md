# AUDITORÍA TÉCNICA - TAREA-F7-IMP-18: Restricciones curriculares y dependencias entre asignaturas

**Fecha:** 2026-11-08
**Repositorio:** i-miss-cocaine/IMA
**Rama auditada:** NG_beta_0.0.0.1_work
**Sesión operativa:** IMA-AUDIT-20261108-1814Z (ID documental, no ID nativo de ChatGPT)
**Checkpoint inicial válido:** C1.249
**HEAD auditado:** ae26055ea27c87adfeb473a45e31bff8d5da43b1
**Dictamen:** **NO CUMPLE**
**Estado histórico en completadas.md:** [X] (se conserva; no acredita cumplimiento).

## 1. Continuidad, fuentes y alcance

- La rama NG_beta_0.0.0.1_work se verificó en HEAD ae26055ea27c87adfeb473a45e31bff8d5da43b1, coincidente con C1.249. La rama base NG_beta_0.0.0.1 permanece en 44d9891132332e692dbe2ba8602b41f50a508a59; comparación: 318 commits adelante, 0 detrás.
- TAREA-F7-IMP-18 aparece [X] en completadas.md, líneas 4487-4521. Se contrastaron los diez requisitos y CA-F7-112..116.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-18.md ni la fuente declarada AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md. Se auditó directamente el bloque de completadas.md.
- ChangesLogs.txt (2471-2495) afirma que se implementaron CoRequisitoSimultaneo, BloqueConsecutivo y ExclusividadHoraria, y que se agregó un botón/modal en teacher-dashboard.html. La inspección del código/HTML no corrobora esas afirmaciones.
- Pendientes.md devuelve 0 caracteres por lectura convencional. Se recuperó el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.782.094 caracteres, 20.182 líneas, 0 U+FFFD, 511 IDs TASK únicos TASK-001..TASK-511. No contiene TAREA-F7-IMP-18 ni TASK-613..615. Se consultó por continuidad de la instrucción previa; no se modificó ni restauró. La metodología 3.4 sitúa las tareas derivadas en cada informe de auditoría.
- Antecedentes relacionados: AUDITORIA_COMPLETADAS_TAREA-F7-IMP-01.md (NO CUMPLE; TASK-515..519) y AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md (NO CUMPLE; TASK-532..537). Se amplían tareas existentes sin duplicar el motor general, autenticación o pruebas.

## 2. Plan de inspección y respaldos inmutables

Inspección manual de esquema, permisos, dispatcher, CRUD, motor, consumidores de planificación, interfaz y regresión; sin modificar código ni datos.

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: getOrCreateSheet (84-155); ROLE_PERMISSIONS/dispatcher (168-265, 671-830); validateContextualAccess/validateRolePermission (465-585); saveCurricularDistribution/getCurricularDistribution (4816-4880); generateAutoSchedules (6335-6458); createClassSchedule (6900-7008); publishClassSchedules (7008-7120); checkScheduleConflict (7493-7693); getCurricularConstraints (13509-13560); saveCurricularConstraint (13562-13650); applyScheduleTemplate (14000-14080); runAcademicPlanningRegressionSuite (14080-14173).
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 (1-100); js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746 (1512-1595); teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71 (archivo completo, 1.475 líneas); tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 (412 líneas).
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee.
- Auditoria.txt SHA 55ba6c87aaba5914b34f63dbb5d77b093c1a8c37; MapaDependencias.md SHA 5f6968222094c7233ed9ee291d03286a9e708837; AUDITORIA_COMPLETADAS_PLAN.md SHA 92994fcfdb8a75cb129c730f9a3c33b44ada3d07; Contexto_personal.txt SHA a19e9dac60ae80f08abfd61b20fe902bf59a5839.
- Antecedentes IMP-01 SHA 1743620a58cdc813f093bfb14db4651681481591; IMP-04 SHA 657c4657b353728da525b071e803d8b80925ce4d.

## 3. Hallazgos

### H1 - AUD-NG-254 NUEVO - ALTO/P1: el motor curricular no aplica ni devuelve conflictos de forma efectiva

- El bloque curricular de checkScheduleConflict está dentro de if (aulaCodigo); una asignación sin aula omite reglas que no dependen de reservar un aula.
- El validador obtiene la asignatura de asignaturaId/materia/asignatura, pero createClassSchedule, generateAutoSchedules y publishClassSchedules le pasan ofertaId, sin resolver AsignaturaID/grado/sección. Las rutas de importación/copia/restauración no garantizan ese contexto. applyScheduleTemplate envía materia como texto, no un ID curricular canónico.
- getOrCreateSheet define HorariosClase con ocho columnas: HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado. createClassSchedule añade UltimaModificacion en el índice 8. El validador interpreta rowH[1] como asignatura (es OfertaID), rowH[7]/[8] como grado/sección (son Estado/UltimaModificacion en el contrato estándar) y [9]/[10] como estado. No existe un contrato uniforme que transporte asignatura, grado, sección, año y período.
- Cuando una regla coincide, el código ejecuta conflictos.push(...), pero conflictos no está declarado en el ámbito de checkScheduleConflict. El ReferenceError queda capturado por catch (errRest), que solo registra Logger.log. El arreglo no se devuelve y la función termina con {hasConflict:false}; la restricción puede ignorarse silenciosamente.
- Solo hay ramas para ExclusividadHoraria y CoRequisitoSimultaneo. No se implementan secuencia temporal, recursos compartidos ni separación obligatoria. ExclusividadHoraria compara día e inicio exactos, no intervalos. MallaCurricularDist almacena RequiereBloqueConsecutivo, pero el motor no lo consulta.
- generateAutoSchedules y publishClassSchedules llaman al mismo validador con ofertaId y sin contexto curricular; no se acredita cumplimiento al generar o publicar.
- Se amplía AUD-NG-236 (motor de conflictos) y AUD-NG-168 (contrato/índices de HorariosClase); relacionado con AUD-NG-239 y AUD-NG-248.

### H2 - AUD-NG-255 NUEVO - ALTO/P1: modelo de reglas incompleto, sin ámbito temporal ni ciclo de vida auditable

- RestriccionesCurriculares almacena RestriccionID, TipoRestriccion, AsignaturaOrigenID, AsignaturaDestinoID, Ambito, Grado, Seccion, Regimen, Estado, FechaRegistro y UsuarioRegistro. No incluye AnoID, PeriodoID, PlanID, TipoActividad ni vínculos estructurados a recursos. getCurricularConstraints ignora anoId y devuelve todos los registros.
- saveCurricularConstraint acepta tipos y ámbitos como texto libre; no valida IDs contra CatalogoAsignaturas/PlanAsignaturas. El motor solo filtra literalmente Seccion o Grado; un ámbito desconocido no restringe el alcance.
- La contradicción se limita a la oposición CoRequisitoSimultaneo/ExclusividadHoraria para una pareja; no compara ámbito, grado, sección, año, período ni régimen, ni detecta ciclos/secuencias contradictorias. No cubre los demás tipos. La lectura y append no están protegidos por LockService.
- Aunque recibe restriccionId, saveCurricularConstraint siempre hace appendRow. No hay edición, desactivación, versionado, historial de cambios ni preview de consecuencias. FechaRegistro/UsuarioRegistro solo describen el alta.
- UsuarioRegistro se toma de payload.userId/payload.usuario o se fija en Sistema, no de _verifiedUserId. ROLE_PERMISSIONS permite get/save a Profesor. validateContextualAccess solo comprueba ámbito si recibe scopeType y requestedValue, campos que el controlador no envía; no hay aislamiento por asignaturas/ofertas asignadas.
- Se amplía AUD-NG-001/AUD-NG-168 y se relaciona con AUD-NG-236, AUD-NG-239 y AUD-NG-250.

### H3 - AUD-NG-246 AMPLIADO y AUD-NG-001 AMPLIADO: interfaz desconectada y llamadas privadas sin credencial

- js/teacher.js define openCurricularConstraintsModal, loadCurricularConstraintsList y handleSaveCurricularConstraintSubmit (1512-1595), pero teacher-dashboard.html no contiene modal-curricular-constraints, curricular-constraints-container, form-save-curricular-constraint, campos curr-constraint-* ni botón invocador. No hay listener que conecte el submit; la función de apertura solo está definida.
- El render muestra estado Activo como constante e ignora c.estado. El controlador envía anoId=2026, pero el backend no lo persiste ni filtra por él.
- fetchApi solo añade requesterUserId/requesterRole; no transmite sessionToken/authToken/token. Los dos endpoints son privados y validateRolePermission rechaza solicitudes sin token. Se amplía AUD-NG-001/TASK-516, sin duplicar autenticación.
- ChangesLogs afirma que el botón/modal se añadieron al HTML, pero el archivo completo no contiene esos elementos.

### H4 - cobertura de regresión insuficiente

- runAcademicPlanningRegressionSuite TC-F7-03 declara PASS si getCurricularConstraints devuelve status success y un array. No prueba reglas, ámbitos, contradicciones, publicación, mensajes, historial ni preview.
- tests/regression/academic-grading-suite.js no contiene casos de TAREA-F7-IMP-18, RestriccionesCurriculares ni CA-F7-112..116. Se amplía TASK-519 con pruebas conductuales.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-112: aplicar solo dentro del ámbito | NO CUMPLE | Sin año/período/tipo de actividad; ámbito libre; no llega contexto canónico. |
| CA-F7-113: respetar reglas al validar/publicar | NO CUMPLE | Motor no retorna conflictos; índices y claves incompatibles; rutas sin contexto curricular. |
| CA-F7-114: detectar contradicciones antes de escenario | PARCIAL | save detecta solo una oposición de dos tipos por pareja; ignora ámbitos y el generador no consume la validación. |
| CA-F7-115: explicar dependencia bloqueante | NO CUMPLE | ReferenceError capturado y sin motivo estructurado devuelto. |
| CA-F7-116: preservar historia al cambiar reglas | PARCIAL | El alta append-only conserva filas, pero no hay edición/desactivación/versionado ni historial de cambios. |

**Dictamen global: NO CUMPLE.**

## 5. Tareas ejecutables derivadas de los hallazgos

### Nuevas

#### [TASK-613] Definir el modelo canónico y ciclo de vida de las restricciones curriculares
- **Hallazgo de origen:** AUD-NG-255, H2.
- **Severidad:** Alto.
- **Objetivo:** persistir relaciones con tipo, ámbito, vigencia, actor y versiones inequívocas.
- **Acción ejecutable:** definir esquema versionado con asignaturas/plan, tipo, año/período, grado/sección y tipo de actividad/recursos; validar IDs/tipos; implementar alta, edición, desactivación y consulta filtrada; registrar historial inmutable con _verifiedUserId, fecha y motivo; agregar bloqueo/idempotencia y preview.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; ROLE_PERMISSIONS; validateRolePermission/validateContextualAccess; RestriccionesCurriculares e historial; tests/regression.
- **Dependencias y riesgos:** AUD-NG-001/168/255; TASK-516/567/605/606; CatalogoAsignaturas, PlanAsignaturas, MallaCurricularDist, AnosLectivos y PeriodosAcademicos. Migrar reglas antiguas sin perder su ámbito.
- **Alcance:** contrato y ciclo de vida; no implementar el motor ni la UI completa.
- **Criterios de aceptación:** esquema con vigencia/ámbito; IDs/tipos validados; edición/desactivación autorizadas; historial inmutable y atribuible; contradicciones comparadas en el mismo ámbito; preview sin persistir.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas de migración/concurrencia/historial y revisión independiente.

#### [TASK-614] Integrar el motor de dependencias curriculares en todas las rutas de planificación
- **Hallazgo de origen:** AUD-NG-254, H1.
- **Severidad:** Alto.
- **Objetivo:** aplicar las cinco clases de relaciones antes de crear, reorganizar, importar, restaurar o publicar horarios.
- **Acción ejecutable:** resolver OfertaID a AsignaturaID/plan/grado/sección/año/período; normalizar HorariosClase; implementar coincidencia, no coincidencia, secuencia, recursos compartidos y separación; evaluar intervalos/ámbitos; ejecutar independientemente de aulaCodigo; devolver bloqueos/advertencias estructurados con ID de regla y explicación; integrar create/edit, generación, importación, copia, plantilla, restore, preview y publicación; fallar de forma cerrada ante errores de configuración.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; checkScheduleConflict y consumidores de planificación; tests/regression.
- **Dependencias y riesgos:** TASK-613; TASK-519/533/598; AUD-NG-168/236/239/248; F7-IMP-01/04. Evitar confundir ID de oferta con ID de asignatura.
- **Alcance:** motor e integración; no duplicar CRUD ni catálogo.
- **Criterios de aceptación:** casos positivos/negativos por tipo; reglas solo afectan ámbito; publicación revalida; razones identifican regla/asignaturas/horario; ningún error se ignora.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de pruebas del motor, rutas y revisión independiente.

#### [TASK-615] Conectar la administración de restricciones curriculares en la interfaz
- **Hallazgo de origen:** AUD-NG-246 y AUD-NG-001 ampliados, H3.
- **Severidad:** Alto.
- **Objetivo:** habilitar una UI real para consultar, crear, previsualizar, modificar y desactivar reglas con autorización.
- **Acción ejecutable:** incorporar botón/modal/formulario en teacher-dashboard.html; enlazar handlers de js/teacher.js; cargar catálogos y ámbitos; mostrar estado real; ofrecer preview y edición/desactivación; transmitir credencial mediante el contrato canónico de fetchApi; mostrar errores.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/academic-service/Code.gs; tests/regression.
- **Dependencias y riesgos:** TASK-613/614; TASK-516/567; AUD-NG-001/246. Un controlador global no equivale a UI conectada.
- **Alcance:** administración de reglas; no reconstruir la matriz general.
- **Criterios de aceptación:** botón/modal existen en DOM; handlers conectados; llamadas autenticadas; rol/ámbito no ampliables desde cliente; edición/desactivación/impacto visibles; estado UI coincide con backend.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de verificación DOM/navegador, API y permisos.

### Tareas existentes ampliadas

- **TASK-516:** incluir endpoints curriculares y actor verificado en la propagación de token/rol.
- **TASK-519:** ampliar regresión de CA-F7-01..08 para CA-F7-112..116, tipos, ámbitos, contradicciones, mensajes, publicación e historial.
- **TASK-533:** optimizador debe consumir las cinco relaciones, distinguir restricciones obligatorias/preferencias y explicar ofertas no ubicadas.
- **TASK-567:** atribuir UsuarioRegistro y permisos solo desde claims/contexto verificados.
- **TASK-598:** validar relaciones curriculares entre candidatos del mismo lote/escenario, no solo contra filas persistidas.
- **TASK-605/TASK-606:** incluir alta/edición/desactivación en bloqueo uniforme y versionado/prevención de escrituras obsoletas.
- **Control de duplicidad:** TASK-613 modelo/CRUD/historial; TASK-614 motor; TASK-615 UI. TASK-516/567 identidad; TASK-519 regresión; TASK-533/598 planificación masiva. No duplicar autenticación ni motor general.

## 6. Pruebas y límites

- **Ejecutadas:** inspección estática/manual de requisitos, esquema, RBAC, dispatcher, validación contextual, CRUD, motor, consumidores, handlers, HTML, API, suites, ChangesLogs, auditorías IMP-01/04 y SHAs; recuperación del blob Pendientes; comparación Git.
- **No ejecutadas:** Apps Script runtime; HTTP/OAuth real; navegador/DOM en ejecución; Sheets productivas; generación/publicación real; concurrencia; fallos inducidos/rollback; Node; E2E.
- No se modificó código, UI, pruebas, datos productivos, despliegues, completadas.md, Pendientes.md, ChangesLogs.txt ni metodología.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-18: **NO CUMPLE**; se conserva [X] histórico.
- Hallazgos nuevos AUD-NG-254/255 (ALTO/P1); ampliar AUD-NG-001/168/236/239/246/248/250.
- Tareas nuevas TASK-613/614/615; ampliar TASK-516/519/533/567/598/605/606.
- Archivo nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-18.md.
- Archivos actualizados: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- Sin cambios: código, UI, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Siguiente tarea:** TAREA-F7-IMP-19, capacidad y distribución de estudiantes por sección (CA-F7-117..121).
