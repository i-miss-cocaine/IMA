# AUDITORÍA TÉCNICA - TAREA-F7-IMP-06: disponibilidad, equipamiento y capacidad de espacios

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2251Z-01 (identificador operativo, no ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.237  
**Checkpoint de cierre:** C1.238  
**HEAD auditado:** f5aad53e90626b54e5549595530795437c6ea828  
**Árbol de partida:** reconstruido desde el árbol del padre de C1.237 (bc7d5ff715284c046a685afa08488d96be158e7c) y el diff íntegro de C1.237 (cinco archivos).  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- La rama base protegida es `NG_beta_0.0.0.1`, HEAD verificado `44d9891132332e692dbe2ba8602b41f50a508a59`. La rama de trabajo `NG_beta_0.0.0.1_work` está 305 commits adelante y 0 atrás. El HEAD de trabajo `f5aad53e90626b54e5549595530795437c6ea828` corresponde al commit C1.237: `audit: verify F7-IMP-05 teacher workload and preferences (C1.237)`.
- El checkpoint C1.237 identifica como siguiente tarea `TAREA-F7-IMP-06`. El informe individual `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md` no existía; se audita directamente la especificación de `completadas.md`.
- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, 5,963 líneas. `TAREA-F7-IMP-06` aparece en la línea aproximada 4057 con marca [X] y criterios CA-F7-39..CA-F7-44. La marca se conserva como registro histórico, no como evidencia de cumplimiento.
- El archivo de origen `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` no existe en esta rama. No se reconstruye ni se sustituye con una copia externa.
- `Pendientes.md` existe en esta rama con el blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`. La lectura convencional UTF-8 devolvió cero caracteres; la recuperación directa por blob devolvió el contenido íntegro: 1,803,672 bytes, 1,782,094 caracteres, 20,182 líneas y ningún carácter U+FFFD. Inventario de IDs únicos: 945 (511 TASK-XXX, 424 Fxx-Taskxx, 10 TAREA-...); máximo TASK-511. No contiene TAREA-F7-IMP-06 ni TASK-538..TASK-544. El blob actual de la rama coincide con el SHA indicado, por lo que no se restaura ni reescribe el archivo.
- Aunque la sección 3.4 de la metodología excluye Pendientes.md del flujo operativo, la instrucción expresa de esta iteración pidió consultarlo; se recuperó solo para comprobar el registro y evitar duplicados. No se utiliza para cambiar estados ni administrar tareas.
- El alcance auditado comprende catálogo de espacios, capacidad, equipamiento, recursos compartidos/exclusivos, mantenimiento e indisponibilidad temporal, reservas, ocupación, impacto en horarios futuros, alternativas, estados, preservación histórica, validación de horarios, autenticación, permisos y pruebas.

## 2. Archivos y respaldos inspeccionados

- `backend/academic-service/Code.gs` SHA `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`:
  - `getOrCreateSheet` (línea 84; esquema `SedesAulas` y `Matriculas`).
  - `ROLE_PERMISSIONS` (líneas 158-260 aprox.) y `PUBLIC_ACTIONS`.
  - Dispatcher `doPost` (líneas 800-860).
  - `checkScheduleConflict` (línea 7493).
  - `getClassroomResources` (línea 7694).
  - `saveClassroomResource` (línea 7752).
  - `saveClassroomMaintenance` (línea 7797).
  - `getScheduleConflictResolutionAlternatives` (línea 8085).
  - `getSectionCapacityAnalyticsReport` (línea 13657).
  - `runAcademicPlanningRegressionSuite` (línea 14109; TC-F7-04).
- `js/teacher.js` SHA `c475fce5afcd28fca23e7b64398ad32b17773746`: `openClassroomManagerModal` (línea 2534), `loadClassroomResourcesTable` (aprox. 2541), `openClassroomMaintenanceModal` (aprox. 2605) y formulario `form-classroom-resource` (aprox. 2654).
- `teacher-dashboard.html` SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`: no contiene `modal-classroom-manager`, `form-classroom-resource`, `tbl-classroom-resources-body`, `openClassroomManagerModal` ni controles equivalentes.
- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`: `fetchApi` (líneas 11 y 46-57).
- `tests/regression/academic-grading-suite.js` SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`: no contiene casos ni referencias a Classroom, SedesAulas, MantenimientoAulas o CA-F7-39..44.
- `ChangesLogs.txt` SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`: entrada del 2026-10-26, línea aproximada 2303, afirma que se añadieron el campo de equipamiento y la función de mantenimiento a `teacher-dashboard.html` y `js/teacher.js`, y que se actualizó el estado de la tarea. La inspección del HTML actual contradice esa afirmación histórica.
- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; `Pendientes.md` blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`.
- No se modificaron archivos de código, pruebas, datos productivos ni despliegues.

## 3. Hallazgos

### H1 - CRÍTICO/P0: el administrador de espacios no tiene interfaz HTML conectada

`js/teacher.js` define `window.openClassroomManagerModal` y controladores que esperan `modal-classroom-manager`, `tbl-classroom-resources-body`, `form-classroom-resource`, `clsr-codigo`, `clsr-capacidad` y otros nodos. Sin embargo, ninguno de esos identificadores ni el texto/controles de gestión de aulas aparece en el `teacher-dashboard.html` actual. La función pública `openClassroomManagerModal` aparece una sola vez en el JS y no existe un botón HTML que la invoque. El controlador de mantenimiento usa `prompt` y fija `fechaInicio` y `fechaFin` al día actual, por lo que no permite definir un intervalo real. La UI tampoco presenta la lista `mantenimientos` que devuelve el backend. La entrada histórica de ChangesLogs del 2026-10-26 no demuestra que los controles sigan presentes.

### H2 - ALTO/P1: esquema incompleto, primera fila de mantenimiento vulnerable y lectura con efectos secundarios

`getOrCreateSheet` crea `SedesAulas` con siete encabezados (SedeID, NombreSede, AulaCodigo, NombreAula, Capacidad, TipoEspacio, Estado), pero `getClassroomResources` y `saveClassroomResource` leen/escriben una octava columna para equipamiento sin añadir su encabezado. `MantenimientoAulas` no tiene inicializador de encabezados en `getOrCreateSheet`. Si la hoja se crea mediante `saveClassroomMaintenance`, el primer registro se agrega en la fila 1; después, `getClassroomResources` y `checkScheduleConflict` aplican `slice(1)`, interpretando ese primer registro como encabezado y omitiéndolo. El riesgo depende de que la hoja no haya sido aprovisionada manualmente con una cabecera externa, algo que el repositorio no acredita.

Además, una consulta a `getClassroomResources` no es de solo lectura: cuando `SedesAulas` contiene únicamente encabezados, inserta seis espacios predeterminados con capacidades y equipamiento arbitrarios (35, 35, 30, 25, 150 y 100). `saveClassroomResource` también asigna capacidad 30 y equipamiento “Básico” si no se envían valores. Esto introduce datos ficticios y puede alterar decisiones de planificación sin una fuente institucional verificada.

### H3 - ALTO/P1: la indisponibilidad se guarda por fechas, pero el motor no evalúa el intervalo

`saveClassroomMaintenance` guarda `fechaInicio` y `fechaFin`, pero no valida que ambas fechas existan, sean válidas o estén ordenadas. La UI actual envía el mismo día para inicio y fin. `checkScheduleConflict` busca cualquier mantenimiento de la misma aula con estado `Programado` o `EnProceso`, sin comparar el intervalo con la fecha de la clase; una restricción activa puede bloquear asignaciones fuera de su vigencia. A la inversa, la primera fila de mantenimiento puede no ser considerada por el problema de encabezado descrito en H2. La función marca el aula como `Indisponible`, pero el validador no consulta ese estado; tampoco hay una operación visible para completar/cancelar mantenimiento y restablecer coherentemente el estado del espacio. `getClassroomResources` devuelve mantenimientos por estado, no por vigencia temporal.

### H4 - ALTO/P1: equipamiento en texto libre, sin requisitos ni control de recursos compartidos

El equipamiento se almacena como una cadena libre en la columna 8 de `SedesAulas`. `checkScheduleConflict` no recibe ni compara requisitos de equipamiento de la actividad, y `getScheduleConflictResolutionAlternatives` no filtra las aulas por compatibilidad de recursos. No hay un catálogo físico de equipos con identificadores, cantidades, reservas, disponibilidad o reglas de uso simultáneo/exclusivo. La hoja `RecursosEducativosReutilizables` existente modela recursos didácticos, no equipamiento físico compartido. Por tanto, un aula puede aparecer como alternativa aunque carezca del equipamiento requerido, y el sistema no puede impedir que dos actividades reserven simultáneamente un recurso exclusivo.

### H5 - ALTO/P1: el conteo de matrícula usado para validar capacidad no corresponde al esquema real

El esquema de `Matriculas` definido en `getOrCreateSheet` es `MatriculaID, Fecha, UserId, Alumno, Grado, Seccion, Periodo, Tipo, Estado...`. Sin embargo, cuando no se envía `estudiantesCount`, `checkScheduleConflict` compara `m[5]` (Seccion) o `m[0]` (MatriculaID) con `ofertaId`, sin resolver la relación OfertaAcademica -> grado/sección/año/período. Si se envía `estudiantesCount`, el cálculo confía en ese valor del payload en vez de derivarlo de una fuente autorizada. `saveClassroomResource` acepta capacidad no validada y usa 30 como valor implícito. La rutina `getSectionCapacityAnalyticsReport` también interpreta columnas de `Matriculas` como año/estado/grado/sección en posiciones que no corresponden al encabezado declarado. En consecuencia, no se acredita una comparación fiable entre capacidad física del aula y matrícula efectiva de la sección.

### H6 - ALTO/P1: no se calcula ocupación, impacto futuro ni alternativas que satisfagan todas las restricciones

`getClassroomResources` devuelve datos del espacio y algunos mantenimientos, pero no permite consultar reservas/ocupación por día, semana, período académico o recurso. `saveClassroomMaintenance` no consulta `HorariosClase` para enumerar las clases futuras afectadas. `getScheduleConflictResolutionAlternatives` propone aulas alternativas mediante `checkScheduleConflict`, pero no pasa `fechaEspecifica`, requisitos de equipamiento ni una política de recursos compartidos; las alternativas horarias proceden de una lista fija de bloques. La desactivación no elimina las filas históricas, pero `getClassroomResources` excluye los espacios `Inactivo`, por lo que la consulta de su historial queda oculta desde esta ruta. La interfaz actual tampoco expone una consulta de reservas ni muestra los intervalos de mantenimiento.

### H7 - CRÍTICO/P0: llamadas privadas del controlador no transmiten la credencial exigida

`getClassroomResources`, `saveClassroomResource` y `saveClassroomMaintenance` no forman parte de `PUBLIC_ACTIONS`; son acciones sujetas al control RBAC del dispatcher. El `fetchApi` actual añade `requesterUserId` y `requesterRole`, pero no transmite `sessionToken`, `authToken` ni `token`. Por tanto, el controlador de aula no satisface el contrato de autenticación verificado previamente para las acciones privadas; se amplía el hallazgo existente AUD-NG-001, sin crear un mecanismo paralelo. La matriz permite consultar recursos a Profesor, pero no guardar; `saveClassroomMaintenance` está autorizado solo para Administrador/Director, mientras el controlador genera el botón de mantenimiento sin filtrar por rol. La UI no informa de esa diferencia ni ofrece estados de autorización.

### H8 - MEDIO/P2: renderizado con innerHTML de campos persistidos sin escape

`loadClassroomResourcesTable` interpola directamente `aulaCodigo`, `nombreAula`, `tipoEspacio`, `capacidad`, `equipamiento` y `estado` en cadenas asignadas a `innerHTML` y atributos `data-*`. `saveClassroomResource` no aplica escape HTML a esos campos. Si un valor persistido contiene marcado o atributos ejecutables, el renderizado puede introducir XSS almacenado cuando el controlador se invoque. La exposición de la interfaz actual está limitada porque el modal HTML falta, pero el patrón del controlador debe corregirse antes de conectarlo.

### H9 - ALTO/P1: la regresión existente no prueba disponibilidad ni recursos físicos

`runAcademicPlanningRegressionSuite` incluye TC-F7-04, que solo comprueba que `getSectionCapacityAnalyticsReport` devuelva `status === success` y un arreglo `reportes`; no valida capacidad de aula, intervalos de mantenimiento, equipamiento, reservas o clases afectadas. `tests/regression/academic-grading-suite.js` no contiene casos F7-IMP-06. No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, concurrencia, fallos inyectados ni E2E.

## 4. Evaluación de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-39 | NO CUMPLE | El validador no compara la fecha de la clase con el intervalo de mantenimiento; además, la primera fila puede omitirse. |
| CA-F7-40 | NO CUMPLE | El equipamiento es texto libre y no se contrasta con los requisitos de la actividad. |
| CA-F7-41 | NO CUMPLE | Al registrar mantenimiento no se identifican ni devuelven las clases futuras afectadas. |
| CA-F7-42 | PARCIAL | Se guardan y devuelven fechas de algunos mantenimientos, pero no hay consulta de reservas/ocupación por día, semana, período y recurso; la UI no muestra los intervalos. |
| CA-F7-43 | PARCIAL | No hay borrado de horarios al desactivar un aula, pero la consulta filtra los espacios Inactivo y oculta su historial desde esta ruta. |
| CA-F7-44 | NO CUMPLE | El conteo usa columnas incompatibles con Matriculas y el guardado/seed aplica capacidades implícitas sin política o fuente validada. |

## 5. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

### [TASK-545] Normalizar el esquema persistente de espacios y mantenimiento
- **Hallazgo de origen:** AUD-NG-241 / H2.
- **Severidad:** Alta.
- **Objetivo:** disponer de esquemas explícitos y compatibles para sedes, espacios, equipamiento y mantenimiento.
- **Acción concreta:** definir encabezados completos y versionados para SedesAulas y MantenimientoAulas; migrar la columna de equipamiento sin desplazar datos; evitar que una lectura cree registros ficticios; preservar la primera fila de datos y validar la estructura antes de leer/escribir.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; hojas SedesAulas y MantenimientoAulas.
- **Dependencias:** getOrCreateSheet, getClassroomResources, saveClassroomResource, saveClassroomMaintenance y datos existentes.
- **Alcance técnico:** migración no destructiva, lectura sin efectos secundarios, identificadores estables y compatibilidad temporal con registros previos.
- **Criterios de aceptación:** una hoja nueva recibe todos sus encabezados; no se insertan aulas ficticias al consultar; el primer mantenimiento se lee correctamente; equipamiento dispone de campo explícito; los datos previos se conservan.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-546] Aplicar el ciclo de vida y la vigencia temporal del mantenimiento
- **Hallazgo de origen:** AUD-NG-241 / H2-H3.
- **Severidad:** Alta.
- **Objetivo:** impedir asignaciones únicamente durante intervalos reales de indisponibilidad.
- **Acción concreta:** validar fechas y orden del intervalo; definir estados Programado, EnProceso, Completado y Cancelado; comparar fecha/intervalo de clase con mantenimiento; sincronizar estado del espacio sin bloqueos permanentes; conservar historial y actor de cada transición.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; SedesAulas; MantenimientoAulas.
- **Dependencias:** checkScheduleConflict, saveClassroomMaintenance, getClassroomResources, HorariosClase y calendario.
- **Alcance técnico:** intersección de intervalos, zona horaria institucional, validación de solapamientos y transición segura de estados.
- **Criterios de aceptación:** una asignación dentro del intervalo se rechaza; una asignación fuera del intervalo se permite; los intervalos inválidos se rechazan; completar/cancelar mantenimiento restablece la disponibilidad efectiva sin borrar historial.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-547] Modelar equipamiento y recursos compartidos o exclusivos
- **Hallazgo de origen:** AUD-NG-241 / H4.
- **Severidad:** Alta.
- **Objetivo:** validar que el espacio y los recursos físicos satisfagan las necesidades de cada actividad.
- **Acción concreta:** sustituir el texto libre como única fuente por catálogo de recursos, cantidades, requisitos de actividad, compatibilidad y política de simultaneidad/exclusividad; integrar reservas y disponibilidad al validador.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; modelo de SedesAulas y catálogo físico de recursos; js/teacher.js.
- **Dependencias:** checkScheduleConflict, getScheduleConflictResolutionAlternatives, HorariosClase y catálogo institucional.
- **Alcance técnico:** relaciones espacio-recurso, requisitos por actividad, unidades disponibles y exclusividad por intervalo.
- **Criterios de aceptación:** un espacio incompatible se rechaza; un recurso exclusivo no se asigna a dos actividades simultáneas; recursos compartibles respetan cantidad disponible; las alternativas cumplen los mismos requisitos.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-548] Corregir la comparación entre capacidad física y matrícula efectiva
- **Hallazgo de origen:** AUD-NG-241 / H5.
- **Severidad:** Alta.
- **Objetivo:** comparar la capacidad real del espacio con estudiantes activos de la oferta y período correctos.
- **Acción concreta:** resolver la relación OfertaAcademica -> grado/sección/año/período; contar matrículas activas desde columnas canónicas; no confiar en un conteo arbitrario enviado por el cliente; retirar valores predeterminados de capacidad sin respaldo institucional.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; Matriculas; OfertaAcademica; SedesAulas; HorariosClase.
- **Dependencias:** getAcademicOfferColumnMap, isAcademicOfferActive, checkScheduleConflict y getSectionCapacityAnalyticsReport.
- **Alcance técnico:** mapeo de columnas por encabezado, ámbito temporal, estados de matrícula y política explícita de capacidad.
- **Criterios de aceptación:** el conteo corresponde a la sección/oferta/año/período solicitado; estudiantes inactivos/retirados no cuentan; la capacidad se compara solo con datos válidos y política explícita; no se inventa un cupo.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-549] Consultar ocupación, clases afectadas y alternativas compatibles
- **Hallazgo de origen:** AUD-NG-241 / H3-H4-H6.
- **Severidad:** Alta.
- **Objetivo:** mostrar la utilización real de espacios y permitir resolver indisponibilidades antes de confirmar cambios.
- **Acción concreta:** consultar reservas por día, semana, período y recurso; al crear/reprogramar mantenimiento, enumerar clases futuras afectadas; generar alternativas que validen fecha, capacidad, equipamiento, disponibilidad y exclusividad.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias:** HorariosClase, MantenimientoAulas, SedesAulas, checkScheduleConflict y getScheduleConflictResolutionAlternatives.
- **Alcance técnico:** consultas temporales, impacto antes/después y alternativas explicables sin mutaciones durante la vista previa.
- **Criterios de aceptación:** la ocupación coincide con reservas vigentes; las clases afectadas se identifican antes de confirmar; ninguna alternativa viola capacidad, equipamiento, mantenimiento o exclusividad.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-550] Conectar la interfaz de espacios con API autenticada y renderizado seguro
- **Hallazgo de origen:** AUD-NG-241 / H1-H7-H8.
- **Severidad:** Crítica.
- **Objetivo:** habilitar la gestión de espacios y mantenimiento mediante controles accesibles y permisos efectivos.
- **Acción concreta:** incorporar el modal y controles ausentes; permitir fechas/intervalos, estados, equipamiento, ocupación e impacto; transmitir la credencial mediante el mecanismo canónico; ocultar/denegar acciones según rol y ámbito; renderizar datos mediante nodos/textContent o escape contextual.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/academic-service/Code.gs.
- **Dependencias:** AUD-NG-001, ROLE_PERMISSIONS, PUBLIC_ACTIONS, getClassroomResources, saveClassroomResource y saveClassroomMaintenance.
- **Alcance técnico:** integración HTML/JS/API, autenticación de acciones privadas, controles por rol y prevención de XSS.
- **Criterios de aceptación:** los controles existen y abren el flujo; cada acción privada autentica al actor; solo roles autorizados pueden modificar; la UI presenta errores y estados reales; campos persistidos no se interpretan como HTML ejecutable.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### [TASK-551] Crear regresión conductual para CA-F7-39..CA-F7-44
- **Hallazgo de origen:** AUD-NG-241 / H9.
- **Severidad:** Alta.
- **Objetivo:** verificar el ciclo completo de espacios, equipamiento, mantenimiento, capacidad y ocupación.
- **Acción concreta:** añadir fixtures aislados para esquema/encabezados, primera fila, intervalos activos/futuros/vencidos, transiciones de estado, requisitos de equipo, recursos exclusivos/compartidos, conteo de matrícula, capacidad, historial, alternativas, permisos y renderizado seguro.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js; backend/academic-service/Code.gs; teacher-dashboard.html; js/teacher.js.
- **Dependencias:** TASK-545..TASK-550; APIs Apps Script y fixtures de hojas.
- **Alcance técnico:** pruebas positivas/negativas sin datos productivos, resultados esperados explícitos y evidencia de ejecución real.
- **Criterios de aceptación:** cada CA-F7-39..44 dispone de pruebas conductuales; se detectan regresiones de primera fila, intervalos, capacidad y recursos; las pruebas no alteran datos productivos; la ejecución queda documentada.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Registros existentes ampliados y límites de duplicidad

- **AUD-NG-001:** ampliar la brecha de token para las acciones privadas de gestión de espacios.
- **AUD-NG-236:** ampliar la validación de conflictos con disponibilidad temporal, equipamiento y capacidad fiable.
- **AUD-NG-238:** ampliar la generación de alternativas para exigir compatibilidad de espacio/recursos y vigencia.
- **TAREA-F7-IMP-15:** la concurrencia de operaciones críticas permanece en su alcance separado; no se duplica aquí una tarea de LockService/versionado.
- **Nuevo hallazgo:** AUD-NG-241. **Tareas nuevas:** TASK-545..TASK-551, todas Pendientes. No se reutilizan TASK-538..TASK-544 ni se cambia el registro de tareas completadas.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual de esquema, columnas, funciones, estados, validación de horarios, consulta de recursos, guardado de recursos/mantenimiento, alternativas, permisos, dispatcher, API, controladores, HTML, ChangesLogs, suite, criterios, historial y SHAs.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, concurrencia real, pruebas de escritura/rollback, pruebas de carga ni E2E.
- No se inspeccionó la hoja productiva `MantenimientoAulas`; el riesgo de pérdida de primera fila es condicional a que la hoja se cree sin cabecera externa.
- No se ejecutó `runAcademicPlanningRegressionSuite`: usa el almacenamiento de Apps Script y registra eventos; no se dispone de un entorno aislado de datos productivos en esta auditoría.
- Se preservan la marca [X] de `completadas.md` y el blob de `Pendientes.md`. No se modificaron código, pruebas, HTML, datos productivos, `ChangesLogs.txt`, `completadas.md` ni `Pendientes.md`.

## 7. Cierre y siguiente tarea

- `TAREA-F7-IMP-06`: **NO CUMPLE**; marca histórica [X] preservada.
- Hallazgo nuevo: AUD-NG-241. Se amplían AUD-NG-001, AUD-NG-236 y AUD-NG-238.
- Tareas derivadas TASK-545..TASK-551: Pendientes.
- **Siguiente tarea cronológica:** `TAREA-F7-IMP-07`, “Fortalecer la programación de evaluaciones y la prevención de sobrecargas”.
