# AUDITORÍA TÉCNICA - TAREA-F7-IMP-05: Ampliar el control de carga laboral y las preferencias docentes

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2224Z-01 (no es ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.236  
**Checkpoint de cierre:** C1.237  
**HEAD auditado:** 125d58d2b7bc2e3745926d5946a825a326fa4638  
**Árbol auditado:** bc7d5ff715284c046a685afa08488d96be158e7c  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- Rama base NG_beta_0.0.0.1: HEAD 44d9891132332e692dbe2ba8602b41f50a508a59. Rama de trabajo NG_beta_0.0.0.1_work: 304 commits adelante y 0 atrás al inicio; HEAD 125d58d2b7bc2e3745926d5946a825a326fa4638, padre ee2861653d31e185bd934bc1e1f063ab225e0bbf, commit C1.236.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F7-IMP-05 aparece [X], con CA-F7-32..CA-F7-38. La marca histórica se preserva y no constituye prueba de cumplimiento.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-05.md ni se localizó el archivo de origen AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md. Se omite el informe previo inexistente y se audita directamente el alcance y criterios de completadas.md.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff contiene una entrada del 2026-10-26 que afirma que se añadió un botón “Preferencias Carga” en teacher-dashboard.html y un controlador en js/teacher.js. El estado actual del HTML no contiene ese botón ni una referencia a openTeacherWorkLoadPreferencesModal; el controlador JS sí existe, pero no está conectado a un elemento visible. El registro histórico no prevalece sobre el código actual.
- Pendientes.md no se utiliza en esta auditoría: METODOLOGIA_DESARROLLO.md, sección 3.4, lo excluye expresamente del flujo operativo y prohíbe consultarlo o administrarlo para crear/gestionar tareas.
- Alcance: políticas por contrato/jornada, horas lectivas y actividades adicionales, frecuencia, límites diarios, sesiones consecutivas, descansos, disponibilidad, preferencias autorizadas, cálculo de carga, visualización, actualización tras cambios, historial de reglas, autenticación, permisos y regresión.

## 2. Archivos y respaldos inmutables inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - getOrCreateSheet (línea 84).
  - ROLE_PERMISSIONS (líneas 158-260 aprox.) y PUBLIC_ACTIONS.
  - doPost dispatcher (líneas 800-815).
  - getTeacherTeachingLoad (línea 6773).
  - saveTeacherWorkLoadPreferences (línea 6842).
  - checkScheduleConflict (línea 7493).
  - runAcademicPlanningRegressionSuite (línea 14109; TC-F7-02 en línea 14135).
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: openTeacherWorkLoadPreferencesModal (línea 1830; llamada a saveTeacherWorkLoadPreferences en línea 1842).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: no contiene openTeacherWorkLoadPreferencesModal, “Preferencias Carga”, controles de carga laboral ni formulario equivalente.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (línea 11; enriquecimiento de payload en líneas 46-57).
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6: único archivo de pruebas localizado en el árbol para academic/planning/schedule; no contiene casos específicos F7-IMP-05.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- Auditoria.txt SHA fb5d0874a40b581817a19ba4281b89908041a39d; MapaDependencias.md SHA d3dcc8ce284231851981dcc8966b983771398ce9; AUDITORIA_COMPLETADAS_PLAN.md SHA 588c1eba6729122fec232b338364ff80a547d776.
- El árbol recursivo de HEAD no está truncado. No se modificaron archivos de código ni pruebas.

## 3. Hallazgos

### H1 - CRÍTICO/P0: interfaz inexistente y flujo de preferencias desconectado
js/teacher.js define window.openTeacherWorkLoadPreferencesModal (1830), pero el HTML actual no contiene el botón ni un control que invoque esa función. La búsqueda del identificador y del texto “Preferencias Carga” en teacher-dashboard.html no devuelve coincidencias. Tampoco hay una llamada frontend a getTeacherTeachingLoad: el cálculo solo aparece como dependencia interna de checkScheduleConflict y en la suite de regresión. Por tanto, el docente/administrador no dispone de una vista funcional para consultar y administrar la carga desde el panel.

### H2 - CRÍTICO/P0: la operación de guardado no cumple el contrato de sesión del dispatcher
saveTeacherWorkLoadPreferences es una acción privada (no pertenece a PUBLIC_ACTIONS). validateRolePermission exige sessionToken/authToken/token y verifica los claims. fetchApi únicamente agrega requesterUserId y requesterRole al payload; no transmite token de sesión. El controlador openTeacherWorkLoadPreferencesModal tampoco envía token. La llamada normal desde ese controlador no satisface el contrato de autenticación. Se amplía AUD-NG-001, sin crear un mecanismo paralelo de autenticación.

### H3 - ALTO/P1: límites arbitrarios y ausencia de políticas por contrato/jornada
getTeacherTeachingLoad usa customMaxHours cuando la columna 6 tiene un valor positivo; si no, utiliza maxHorasSemanales del payload o 40. saveTeacherWorkLoadPreferences también persiste maxHorasSemanales || 40 y el controlador JS convierte una entrada vacía/no numérica en 40. No se demuestra configuración efectiva por tipo de contrato, jornada o política institucional ni una distinción entre “sin política definida” y “40 horas autorizadas”. Esto contradice CA-F7-32 y CA-F7-38.

### H4 - ALTO/P1: cálculo semanal ignora año y estado efectivo de los bloques
getTeacherTeachingLoad recibe anoId, pero nunca lo usa. Filtra HorariosClase solo por docente, excluye el ID editado y descarta únicamente filas cuyo estado sea “Inactivo”. En consecuencia, puede sumar borradores y otros estados no vigentes, además de horarios pertenecientes a distintos años/períodos. No se aplica una definición explícita de qué estados cuentan como carga lectiva oficial. El resultado puede sobreestimar o mezclar la carga real.

### H5 - ALTO/P1: no se modelan frecuencia, límites diarios, sesiones consecutivas, descansos ni responsabilidades adicionales
El cálculo suma la duración de cada fila semanal de HorariosClase. No existe tratamiento de frecuencia real de una sesión, número de sesiones, límites diarios, bloques consecutivos, descansos mínimos ni actividades adicionales. La estructura de HorariosLaborales utilizada solo aporta hora de entrada, hora de salida, límite semanal y días laborales; no representa contrato, jornada diferenciada, actividad no lectiva ni reglas de descanso. Tampoco hay separación entre horas lectivas y otras responsabilidades. La duración de cada bloque se calcula aritméticamente, sin reglas institucionales adicionales.

### H6 - ALTO/P1: disponibilidad laboral no equivale a preferencias docentes y no alimenta el optimizador
saveTeacherWorkLoadPreferences solo guarda horaEntrada, horaSalida, maxHorasSemanales y diasLaboralesJSON. El controlador fija los días de lunes a viernes y usa prompts simples, sin capturar preferencias por franjas, días preferidos, restricciones voluntarias ni autorización de esas preferencias. No hay una consulta de preferencias para la planificación ni integración con generateAutoSchedules. La auditoría previa F7-IMP-04 ya constató que el generador no aplica preferencias; este resultado amplía AUD-NG-239. Una jornada disponible no debe interpretarse como preferencia.

### H7 - ALTO/P1: posible pérdida del primer registro por falta de cabecera y escritura no atómica
getOrCreateSheet no inicializa una cabecera para HorariosLaborales. saveTeacherWorkLoadPreferences, al crear una hoja sin registros, inserta directamente el primer docente en la primera fila. getTeacherTeachingLoad lee getDataRange().getValues().slice(1), por lo que, en ese escenario, trataría ese primer registro como cabecera y lo excluiría del cálculo. Si la hoja ya tiene una cabecera creada externamente, este caso no se produce; el repositorio no acredita ese aprovisionamiento. Además, la actualización existente ejecuta setValue por columna en operaciones separadas, sin LockService, escritura batch, rollback ni historial versionado de la política anterior. La bitácora registra un evento genérico, no una instantánea reproducible de las reglas aplicadas.

### H8 - ALTO/P1: pruebas estructurales insuficientes
runAcademicPlanningRegressionSuite TC-F7-02 llama getTeacherTeachingLoad y solo verifica que el resultado sea un objeto; no comprueba horas, límite efectivo, distribución diaria, exclusión de borradores, filtro por año ni cambios de política. No hay casos para saveTeacherWorkLoadPreferences ni CA-F7-32..38 en tests/regression/academic-grading-suite.js. La suite existente no demuestra comportamiento correcto ni persistencia. No se ejecutaron pruebas de Apps Script runtime, navegador, HTTP/OAuth ni datos reales.

## 4. Evaluación de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-32 | NO CUMPLE | Límite de 40 horas por defecto; sin política efectiva por contrato/jornada. |
| CA-F7-33 | PARCIAL | La proyección se vuelve a calcular al validar una asignación, pero no existe actualización/visualización post-guardado y el conjunto de filas puede incluir estados/años incorrectos. |
| CA-F7-34 | NO CUMPLE | No se modela ni aplica frecuencia real de sesiones. |
| CA-F7-35 | PARCIAL | Suma duración de bloques y no cuenta explícitamente intervalos libres, pero incluye estados no vigentes y no separa actividades adicionales. |
| CA-F7-36 | PARCIAL | Devuelve excedeLimite y lista bloques, pero no identifica de forma fiable las asignaciones marginales responsables bajo un cálculo filtrado y trazable. |
| CA-F7-37 | NO CUMPLE | No existe catálogo de preferencias autorizado ni integración con la planificación; por tanto, no se acredita que se respeten las restricciones obligatorias. |
| CA-F7-38 | NO CUMPLE | La ausencia de configuración se sustituye por 40 horas, en lugar de declarar que no hay política definida. |

## 5. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

### [TASK-538] Definir políticas de carga docente por contrato y jornada
- **Hallazgo de origen:** AUD-NG-240 / H3-H7.
- **Severidad:** Alto.
- **Objetivo:** resolver límites efectivos por docente sin inventar valores institucionales.
- **Acción ejecutable:** modelar contrato, jornada, vigencia, política institucional, límites semanales y separación de horas lectivas/adicionales; distinguir ausencia de política de límite explícito; versionar la regla aplicada.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; esquema institucional de políticas.
- **Dependencias y riesgos:** Usuarios, expedientes laborales, HorariosLaborales, AnosLectivos y reportes de carga.
- **Criterios de aceptación:** cada docente resuelve una política vigente trazable; sin política aplicable no se aplica un límite inventado; los cambios conservan vigencia e historial.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-539] Corregir el cálculo de carga lectiva por período y estado
- **Hallazgo de origen:** AUD-NG-240 / H4-H5.
- **Severidad:** Alto.
- **Objetivo:** calcular carga semanal solo con asignaciones lectivas vigentes y aplicables.
- **Acción ejecutable:** aplicar anoId/período; definir estados computables; excluir borradores, cancelados e inactivos; resolver frecuencia de sesiones y duplicados; conservar exclusión del bloque editado.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs.
- **Dependencias y riesgos:** HorariosClase, OfertaAcademica, AnosLectivos, PeriodosAcademicos y versiones de horario.
- **Criterios de aceptación:** cambios de año/período no se mezclan; borradores/cancelados no inflan carga oficial; la frecuencia genera minutos semanales reproducibles.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-540] Implementar reglas de jornada, descansos y actividades adicionales
- **Hallazgo de origen:** AUD-NG-240 / H5.
- **Severidad:** Alto.
- **Objetivo:** evaluar carga laboral integral sin confundir horas lectivas y responsabilidades adicionales.
- **Acción ejecutable:** modelar límites diarios, número de sesiones, períodos consecutivos, descansos mínimos, disponibilidad parcial y actividades adicionales; aplicar solo reglas configuradas y vigentes.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; modelo de políticas y actividades.
- **Dependencias y riesgos:** HorariosLaborales, HorariosClase, calendario, jornada/contrato y responsabilidades institucionales.
- **Criterios de aceptación:** cada regla devuelve el cálculo y causa; descansos/tiempos libres no se contabilizan como docencia; responsabilidades adicionales se muestran separadas; sin política no se inventa una regla.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-541] Registrar preferencias docentes autorizadas e integrarlas a la planificación
- **Hallazgo de origen:** AUD-NG-240 / H6; amplía AUD-NG-239.
- **Severidad:** Alto.
- **Objetivo:** distinguir preferencias flexibles de disponibilidad y restricciones obligatorias.
- **Acción ejecutable:** definir preferencias por docente, día/franja, prioridad, vigencia y autorización; conectarlas al generador/optimizador como criterio flexible, sin permitir que prevalezcan sobre restricciones obligatorias.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** generador de escenarios F7-IMP-04, HorariosLaborales, RBAC y políticas institucionales.
- **Criterios de aceptación:** preferencias persistidas y consultables; el optimizador las aplica como preferencias y reporta cuándo no puede satisfacerlas; nunca vulnera límites obligatorios.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-542] Conectar interfaz de carga laboral con API y permisos
- **Hallazgo de origen:** AUD-NG-240 / H1-H2.
- **Severidad:** Crítico.
- **Objetivo:** permitir consulta/administración real de carga con autenticación y ámbito autorizados.
- **Acción ejecutable:** incorporar controles HTML accesibles; conectar consulta/edición a la API; transmitir token mediante el mecanismo canónico; aplicar permisos por rol y ámbito del docente; mostrar carga, límite, distribución y errores.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** AUD-NG-001, RBAC, identidad institucional y ámbito docente.
- **Criterios de aceptación:** los controles existen y funcionan; solicitudes privadas autenticadas; un usuario no administra docentes fuera de su ámbito; datos y errores se reflejan sin simulación.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### [TASK-543] Hacer trazables los excesos y actualizar la vista tras cambios
- **Hallazgo de origen:** AUD-NG-240 / H3-H7.
- **Severidad:** Alto.
- **Objetivo:** explicar la carga aplicada y las asignaciones que originan cada exceso.
- **Acción ejecutable:** devolver contribución por bloque/día, política y versión usadas, diferencias antes/después y causas del exceso; invalidar/refrescar la consulta después de crear, editar, cancelar o sustituir horarios.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** TASK-538..TASK-542, caché de horarios y VersionesHorarios.
- **Criterios de aceptación:** cada exceso señala bloques y regla; la carga mostrada coincide con el estado vigente después de cada mutación; la consulta es reproducible por año/período.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### [TASK-544] Crear regresión conductual para CA-F7-32..CA-F7-38
- **Hallazgo de origen:** AUD-NG-240 / H8.
- **Severidad:** Alto.
- **Objetivo:** verificar cálculos, políticas, preferencias y persistencia con escenarios reproducibles.
- **Acción ejecutable:** añadir fixtures aislados para políticas explícitas/ausentes, contratos y jornadas, años/períodos, estados de horarios, frecuencia, descansos, actividades adicionales, preferencias compatibles/incompatibles, exceso explicado y actualización tras modificación.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** APIs Apps Script, esquema de hojas, permisos y aislamiento de datos de prueba.
- **Criterios de aceptación:** cada CA-F7-32..38 tiene casos positivos/negativos; se validan valores y estado persistido; ninguna prueba modifica datos productivos; se documenta ejecución real.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Registros existentes ampliados
- **AUD-NG-001:** autenticación/token de acciones privadas; el controlador de preferencias no transmite credencial de sesión.
- **AUD-NG-236:** cálculo de carga utilizado por validación de horarios, períodos y consistencia de la política.
- **AUD-NG-239:** el generador de escenarios no consume preferencias docentes.
- No se crean IDs duplicados. AUD-NG-240 es el nuevo hallazgo específico de carga laboral/preferencias.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual de getOrCreateSheet, ROLE_PERMISSIONS, PUBLIC_ACTIONS, dispatcher, getTeacherTeachingLoad, saveTeacherWorkLoadPreferences, checkScheduleConflict, fetchApi, controlador JS, DOM HTML, suite de regresión, ChangesLogs, criterios y referencias Git.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, cálculos con contratos reales, concurrencia, fallos de escritura, rollback ni E2E.
- El análisis de la hoja HorariosLaborales identifica un riesgo condicional: si se crea mediante getOrCreateSheet sin cabecera, la primera fila guardada se pierde para el lector que aplica slice(1). No se inspeccionó una hoja productiva para determinar su estado real.
- No se modificó código, tests, HTML, configuración, despliegues ni datos productivos.
- Se preserva la marca histórica [X] de completadas.md. Pendientes.md no se consultó ni modificó por exclusión expresa de la metodología.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-05: **NO CUMPLE**.
- Nuevo hallazgo AUD-NG-240; se amplían AUD-NG-001, AUD-NG-236 y AUD-NG-239.
- Tareas derivadas TASK-538..TASK-544: Pendientes.
- **Siguiente tarea cronológica:** TAREA-F7-IMP-06, “Ampliar la gestión de disponibilidad, equipamiento y capacidad de espacios”.
