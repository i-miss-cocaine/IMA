# AUDITORÍA TÉCNICA - TAREA-F7-IMP-01: Ampliar la validación integral de horarios y asignaciones

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2144Z-01 (no es ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.232  
**Checkpoint de cierre:** C1.233  
**HEAD auditado:** eadc2c57ea7905cf34d14d9c745df4a5ced50c4c  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- Rama base NG_beta_0.0.0.1: HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; rama de trabajo 300 commits adelante y 0 atrás. El HEAD de trabajo coincide con el commit C1.232 eadc2c57ea7905cf34d14d9c745df4a5ced50c4c; árbol de partida 03cfcb4e70ba065bf6ca13e1e61b9e3f86754421.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F7-IMP-01 aparece [X], línea aproximada 3861; criterios CA-F7-01..CA-F7-08. La marca histórica se conserva y no se toma como evidencia funcional.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-01.md en el HEAD de trabajo. Tampoco se localizó AUDITORIAS/AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md. Se omite el informe previo inexistente y se audita directamente el alcance maestro de completadas.md.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff registra cambios del 2026-10-26 para excepciones justificadas en checkScheduleConflict/createClassSchedule y su controlador de teacher.js. El registro describe cambios, pero no demuestra que la ruta esté conectada ni que los criterios se cumplan.
- Pendientes.md devuelve 0 caracteres por lectura convencional. Se recuperó el blob de la misma ruta/continuidad SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, UTF-8 sin U+FFFD. Inventario: 695 encabezados con ID y 695 IDs distintos en encabezados; 749 IDs distintos entre todos los tokens entre corchetes (incluye referencias cruzadas), con 511 TASK, 190 AUD-NG, 10 TAREA, 24 F31, 10 F28 y 4 otros. Máximos observados: TASK-511 y AUD-NG-231. No contiene TAREA-F7-IMP-01 ni TASK-515..TASK-519. Los estados globales completado/pendiente no se contabilizan porque el formato mixto no permite un conteo fiable sin clasificar cada bloque. No se modifica el archivo.
- Alcance: reglas de conflicto, fechas efectivas y períodos, calendario, disponibilidad docente/aula/recursos, excepciones justificadas, actualización de horarios, integridad de escritura, UI y regresión.

## 2. Archivos y respaldos inmutables inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: getOrCreateSheet (línea 84), getUnifiedInstitutionalCalendar (5008), getAcademicCalendar (6616), createCalendarEvent (6651), getTeacherTeachingLoad (6773), createClassSchedule (6900), checkScheduleConflict (7493), runAcademicPlanningRegressionSuite (14109), validateRolePermission (524), PUBLIC_ACTIONS (265).
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: listener schedule-builder-form (línea 699) y flujo de creación/excepción (líneas 737-790 aprox.).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: no contiene schedule-builder-form ni los campos sch-dia, sch-hora-inicio, sch-hora-fin o sch-aula.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (línea 11), enriquecimiento de payload (líneas 46-57).
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- No se modificaron los archivos de código inspeccionados.

## 3. Hallazgos

### H1 - CRÍTICO/P0: formulario de planificación ausente y controlador desconectado

js/teacher.js registra el submit mediante document.getElementById('schedule-builder-form')?.addEventListener y consulta sch-dia, sch-hora-inicio, sch-hora-fin, sch-aula, sch-grado, sch-seccion y sch-docente-id. Ninguno de esos identificadores aparece en teacher-dashboard.html. La llamada usa optional chaining, por lo que la ausencia del formulario no genera un error visible: simplemente no registra el controlador. En el HTML auditado no existe evidencia de una ruta de interfaz que permita activar el flujo de creación descrito por el log.

### H2 - CRÍTICO/P0: ruta de escritura rechazada por el contrato de autenticación actual

createClassSchedule no está incluido en PUBLIC_ACTIONS (Code.gs:265). validateRolePermission exige sessionToken/authToken/token para las acciones privadas (línea 524 y siguientes), y escribe la identidad/rol verificados en _verifiedUserId/_verifiedRole. Sin embargo, fetchApi solo añade requesterUserId y requesterRole al payload (api.js:46-57), no transmite token de sesión. El controlador de teacher.js tampoco envía token. En consecuencia, la solicitud observada no satisface el contrato de autenticación del dispatcher y no alcanza createClassSchedule en la ruta normal del navegador. Este hallazgo amplía AUD-NG-001, no crea un duplicado de la brecha global de sesión.

### H3 - ALTO/P1: autorización de excepción no utiliza el rol verificado

createClassSchedule obtiene authRole desde payload.authRole y lo pasa a checkScheduleConflict. validateRolePermission establece _verifiedRole, pero no asigna authRole. El controlador de teacher.js envía excepcionJustificacion sin authRole. checkScheduleConflict comprueba params.authRole/params.userRole para decidir si puede autorizar, por lo que la excepción no queda vinculada de forma demostrable al rol validado por el servidor. No debe confiarse en un rol arbitrario enviado por el cliente.

### H4 - CRÍTICO/P0: excepción anticipada omite el motor de validación y deja escritura no atómica

checkScheduleConflict procesa excepcionJustificacion al inicio: crea/usa ExcepcionesHorarios, inserta una fila y retorna hasConflict:false antes de comprobar carga docente, calendario, disponibilidad, capacidad de aula, mantenimiento y solapamientos. La excepción no se limita a un conflicto concreto ni distingue reglas obligatorias de advertencias autorizables. Después createClassSchedule escribe el horario en otra operación. Si esa escritura falla, la excepción queda registrada sin asignación correspondiente; no hay rollback transaccional acreditado. Esto incumple el tratamiento controlado de excepciones y la consistencia ante fallos.

### H5 - ALTO/P1: fecha efectiva y período no llegan a la validación

checkScheduleConflict admite fechaEspecifica, pero createClassSchedule no la extrae del payload ni la pasa al validador. El formulario de teacher.js tampoco recoge fecha efectiva, año o período. La comprobación de calendario queda inalcanzable desde el flujo normal de guardado. getTeacherTeachingLoad acepta anoId, pero checkScheduleConflict no lo proporciona y el cálculo agrega horarios de todos los años/estados salvo Inactivo; puede sumar borradores y períodos distintos. El modelo semanal actual compara día/hora, pero no representa vigencia de una asignación ni excepciones por fecha/período.

### H6 - ALTO/P1: esquema de calendario divergente entre inicialización y consumidores

getOrCreateSheet inicializa CalendarioAcademico con una cabecera histórica de 9 columnas. createCalendarEvent escribe registros de 13 campos y getAcademicCalendar interpreta el esquema de 13 campos. getUnifiedInstitutionalCalendar conserva una interpretación anterior (nombre/tipo/fechas en otros índices). checkScheduleConflict lee el esquema de 13 campos que escribe createCalendarEvent; por tanto, no se atribuye el defecto a esos índices aislados, sino a la coexistencia de contratos incompatibles entre inicializador y lectores. La falta de fechaEspecifica en createClassSchedule impide que el validador use el registro de calendario en el flujo auditado.

### H7 - ALTO/P1: pruebas de regresión verifican estructura, no comportamiento

runAcademicPlanningRegressionSuite ejecuta TC-F7-01 llamando checkScheduleConflict, pero el resultado se declara PASS si el retorno es simplemente un objeto no nulo. No verifica que una colisión real sea rechazada. Los demás casos consultan carga, restricciones, capacidad, sustituciones, plantillas y logs, sin comprobar CA-F7-01..CA-F7-08. tests/regression/academic-grading-suite.js no contiene escenarios específicos de TAREA-F7-IMP-01. No hay evidencia de pruebas funcionales para intervalos exactos/parciales, horarios consecutivos, excepciones, calendario, actualización excluyendo el registro propio ni rollback.

### H8 - MEDIO/P2: controles correctos parciales sin evidencia suficiente

La fórmula de solapamiento (horaInicio < exEnd && horaFin > exStart) detecta intersecciones exactas/parciales y permite intervalos consecutivos cuando las horas llegan en formato canónico HH:mm. checkScheduleConflict excluye excludeHorarioId y createClassSchedule tiene una comprobación optimistic de lastUpdated. Los mensajes de conflicto identifican aula, docente u oferta en varios casos. Sin embargo, la ruta de interfaz/API está desconectada, no hay validación robusta del formato horario, el alcance temporal no está modelado y no existen pruebas conductuales que acrediten estos comportamientos.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-01: restricción obligatoria impide confirmar | NO CUMPLE | Ruta UI ausente y API privada sin token; excepciones además saltan controles. |
| CA-F7-02: excepción explícita se acepta con justificación y registro | NO CUMPLE | Rol no deriva de _verifiedRole; atajo omite otras validaciones y no es atómico. |
| CA-F7-03: detectar intervalos parcialmente superpuestos | PARCIAL | Fórmula de solapamiento correcta para HH:mm/día; no está probada ni integrada en ruta activa. |
| CA-F7-04: aceptar intervalos consecutivos | PARCIAL | Desigualdades estrictas permiten adyacencia; falta prueba conductual y formato robusto. |
| CA-F7-05: actualización compara estado anterior/nuevo sin conflicto propio | PARCIAL | excludeHorarioId y lastUpdated existen en backend; UI no acredita flujo de edición y faltan pruebas. |
| CA-F7-06: error identifica recursos/docente/grupo/actividad | PARCIAL | Mensajes nombran aula/docente/oferta, pero no DTO estructurado ni todas las entidades relacionadas. |
| CA-F7-07: operación fallida no deja datos parciales | NO CUMPLE | Excepción y horario se escriben por separado; no hay rollback. |
| CA-F7-08: reglas existentes mantienen regresión | NO CUMPLE | TC-F7-01 solo comprueba objeto no nulo; no hay batería funcional para los criterios. |

**Dictamen global: TAREA-F7-IMP-01 NO CUMPLE.** La marca [X] histórica se conserva en completadas.md.

## 5. Registros relacionados y tareas ejecutables derivadas de los hallazgos

**Hallazgo nuevo:** AUD-NG-236 (P0/P1), desconexión del flujo de planificación y validación incompleta/no atómica de horarios y excepciones.

**Registros existentes ampliados, sin duplicar alcance:**
- AUD-NG-001: propagación de token/identidad de sesión desde fetchApi y validación de acciones privadas.
- AUD-NG-168: coherencia del modelo HorariosClase, calendario, año/período, asignaciones y consumidores.

### [TASK-515] Conectar el formulario real de planificación con el controlador de horarios
- **Hallazgo de origen:** AUD-NG-236 / H1.
- **Severidad:** Crítico.
- **Objetivo:** que el usuario autorizado pueda iniciar el flujo de creación/edición desde la interfaz publicada.
- **Acción ejecutable:** incorporar o corregir el formulario y los campos requeridos en teacher-dashboard.html, o reubicar el controlador al componente real; asegurar IDs/contratos consistentes y estados de error.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js.
- **Dependencias y riesgos:** API ACADEMIC, formularios dinámicos, permisos de edición y actualización de matriz.
- **Alcance:** conexión de interfaz; no ampliar capacidades de planificación visual fuera de F7-IMP-01.
- **Criterios de aceptación:** el formulario existe en el DOM cuando se registra el listener; todos los campos consultados existen; crear y editar producen solicitudes observables; errores se muestran sin falsos éxitos.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-516] Aplicar identidad/rol verificado al flujo de excepciones
- **Hallazgo de origen:** AUD-NG-236 / H2-H3; amplía AUD-NG-001.
- **Severidad:** Crítico.
- **Objetivo:** que las acciones privadas y las excepciones se autoricen con identidad validada en servidor.
- **Acción ejecutable:** corregir la propagación del token de sesión por el contrato API existente; derivar la capacidad de autorizar excepciones exclusivamente de _verifiedRole/claims verificados; rechazar roles enviados por el cliente como autoridad.
- **Archivos/módulos afectados:** js/api.js; backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** autenticación transversal, RBAC, delegaciones y dispatchers de microservicios.
- **Alcance:** integrar el flujo de horarios con la solución canónica de AUD-NG-001, sin crear un segundo mecanismo de sesión.
- **Criterios de aceptación:** createClassSchedule llega con token válido; token ausente/caducado se rechaza; usuario sin rol autorizado no registra excepciones; alterar authRole en el navegador no eleva privilegios.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-517] Unificar calendario y contexto temporal de las asignaciones
- **Hallazgo de origen:** AUD-NG-236 / H5-H6; amplía AUD-NG-168.
- **Severidad:** Alto.
- **Objetivo:** validar asignaciones dentro de su año, período y fechas efectivas con un esquema de calendario único.
- **Acción ejecutable:** definir contrato canónico de CalendarioAcademico; actualizar inicializador/lectores; transmitir anoId, período y fecha efectiva hasta checkScheduleConflict; filtrar carga docente por período y estados pertinentes.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; teacher-dashboard.html; js/teacher.js.
- **Dependencias y riesgos:** CalendarioAcademico, HorariosClase, HorariosLaborales, PeriodosAcademicos, AnosLectivos y reportes consumidores.
- **Alcance:** validación de fechas y períodos de la asignación; no rediseñar el calendario institucional.
- **Criterios de aceptación:** todos los consumidores comparten el mismo esquema; una fecha no lectiva activa bloquea asignaciones ordinarias; una fecha/período distinto no genera conflicto artificial; la carga docente solo suma asignaciones vigentes aplicables.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-518] Corregir semántica y atomicidad de las excepciones de horario
- **Hallazgo de origen:** AUD-NG-236 / H4.
- **Severidad:** Crítico.
- **Objetivo:** permitir únicamente excepciones explícitas y legítimas sin omitir restricciones obligatorias ni dejar registros huérfanos.
- **Acción ejecutable:** evaluar primero todos los conflictos; clasificar bloqueos/advertencias/excepciones autorizables; vincular la excepción a la regla y al horario concreto; persistir excepción y horario mediante operación recuperable/atómica con rollback o compensación verificable.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** LockService, ExcepcionesHorarios, HorariosClase, bitácora y reintentos/idempotencia.
- **Alcance:** escritura y autorización de excepción en creación/edición; no permitir excepciones a reglas institucionales no dispensables.
- **Criterios de aceptación:** ninguna excepción salta validaciones obligatorias; justificación/actor/regla quedan registrados; fallo de escritura no deja excepción huérfana; repetición de solicitud no duplica registros.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-519] Implementar regresión conductual para CA-F7-01..CA-F7-08
- **Hallazgo de origen:** AUD-NG-236 / H7-H8.
- **Severidad:** Alto.
- **Objetivo:** demostrar los resultados del motor con escenarios reproducibles.
- **Acción ejecutable:** reemplazar aserciones estructurales por fixtures y pruebas que verifiquen colisión exacta/parcial, adyacencia, calendario, disponibilidad, capacidad, excepción autorizada/no autorizada, edición excluyendo su propio ID y rollback.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; tests/regression/academic-grading-suite.js; tests/regression (suite académica dedicada).
- **Dependencias y riesgos:** aislamiento de datos de prueba, APIs Apps Script, permisos y esquema de hojas.
- **Alcance:** pruebas funcionales de F7-IMP-01; no declarar E2E o ejecución productiva si no se ejecuta.
- **Criterios de aceptación:** cada CA-F7-01..08 tiene al menos un caso positivo y uno negativo donde aplique; los resultados validan valores esperados y estado persistido; los fallos no alteran datos productivos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, ejecución y revisión.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual de funciones, payloads, dispatcher, permisos, formulario, contratos de calendario, cálculos de carga, lógica de solapamiento, manejo de excepciones, suite, historial, SHAs y referencias Git.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth, navegador, llamadas reales a Sheets/Drive, pruebas de concurrencia, inyección de fallos, rollback ni E2E.
- **No se modificó código, tests, HTML, datos productivos, configuración ni despliegues.**
- Se preservan las marcas históricas de completadas.md y el blob de Pendientes.md.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-01: **NO CUMPLE**.
- Nuevo hallazgo AUD-NG-236; se amplían AUD-NG-001 y AUD-NG-168.
- Tareas derivadas TASK-515..TASK-519: Pendientes.
- **Siguiente tarea cronológica:** TAREA-F7-IMP-02, “Implementar una matriz visual de planificación y disponibilidad”.
