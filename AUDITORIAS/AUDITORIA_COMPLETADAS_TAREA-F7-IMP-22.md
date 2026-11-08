# AUDITORÍA FUNCIONAL Y TÉCNICA — TAREA-F7-IMP-22
## Plantillas y reutilización controlada de horarios

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-1928Z (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.254.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** 56d2dcf44eff48e397f6a8ba0bd52c090a5a2e57.
- **Tree SHA de partida:** ad5af8300454835652199da0377acecb02e666c7.
- **Rama base protegida:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; 323 commits adelante, 0 detrás.
- **Estado en completadas.md:** [X] histórico; no equivale a certificación funcional.
- **Prioridad declarada:** P2.
- **Dictamen:** **NO CUMPLE**.
- **Fuente primaria:** completadas.md, bloque TAREA-F7-IMP-22, líneas 4625-4664, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Fuente secundaria declarada:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, no localizada en la rama.
- **Informe individual esperado:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-22.md, no localizado. Se ejecutó la auditoría directamente desde completadas.md; no se omitió la tarea.

---

## 1. Alcance y criterios de aceptación

La tarea exige guardar estructuras semanales como plantillas, permitir seleccionar qué componentes reutilizar, evitar copiar automáticamente docentes/aulas/asignaciones que deban revalidarse, detectar referencias inexistentes en destino, validar y previsualizar la propuesta, detectar conflictos de docentes y recursos, permitir ajustes antes de confirmar, registrar el origen y la operación, y preservar la plantilla original.

Criterios auditados:

- **CA-F7-133:** aplicar una plantilla no modifica su versión original.
- **CA-F7-134:** las referencias inexistentes se identifican antes de confirmar.
- **CA-F7-135:** las asignaciones se validan contra la disponibilidad del período de destino.
- **CA-F7-136:** el sistema no publica automáticamente un horario generado sin revisión.
- **CA-F7-137:** los cambios aplicados quedan registrados y pueden identificarse posteriormente.

## 2. Procedimiento y fuentes

1. Verificar repositorio, rama, HEAD, árbol, checkpoint C1.254 y rama base.
2. Consultar completadas.md, Pendientes.md, ChangesLogs.txt, el informe individual y la fuente de Fase 7.
3. Recuperar Pendientes.md directamente desde su blob cuando la lectura ordinaria devuelva cero caracteres.
4. Inspeccionar manualmente los escritores/lectores de HorariosClase, las funciones de plantilla, el motor de conflictos, el dispatcher, PUBLIC_ACTIONS, RBAC, los controladores de teacher.js, el HTML completo y las pruebas.
5. Contrastar los diez requisitos funcionales y los cinco criterios de aceptación.
6. Reconciliar los defectos con AUD-NG-168, AUD-NG-236, AUD-NG-241, AUD-NG-224, AUD-NG-145 y las tareas existentes; evitar duplicar causas raíz ya registradas.
7. Registrar los hallazgos y las tareas ejecutables derivadas en este informe y en los registros de auditoría relacionados. No modificar código durante la auditoría.

### Integridad documental

- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TAREA-F7-IMP-22 aparece marcada [X] en líneas 4625-4664.
- **Informe individual IMP-22:** NOT_FOUND.
- **Fuente de Fase 7:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, NOT_FOUND.
- **Pendientes.md:** la lectura convencional de la ruta devuelve 0 caracteres; el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c se recuperó íntegramente desde Git. Contenido: 1.782.094 caracteres, 20.182 líneas, 0 caracteres U+FFFD. Inventario verificable de identificadores TASK: 797 apariciones, 511 IDs únicos, TASK-001..TASK-511. No se detectó TASK-622..625 en el registro recuperado. El blob actual ya está referenciado por la rama; no requiere restauración ni transferencia. No se modificó.
- **ChangesLogs.txt:** líneas 2586 y siguientes afirman que se agregaron las tres funciones backend, previsualización/prevalidación, botón, modal y controladores UI. La inspección del HTML vigente contradice la afirmación del botón/modal: el archivo completo no contiene ninguno de los IDs de plantilla.
- **Normalización:** este informe incluye la sección obligatoria “Tareas ejecutables derivadas de los hallazgos”. Los hallazgos relacionados se anexan también a Auditoria.txt, MapaDependencias.md y AUDITORIA_COMPLETADAS_PLAN.md.
- **Fuentes inexistentes:** no se encontraron el informe individual IMP-22 ni el documento de origen de Fase 7; por ello se auditó directamente el bloque completo de completadas.md.

## 3. Inspección técnica y evidencia

### 3.1 Exposición pública de operaciones de plantilla

**backend/academic-service/Code.gs, SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.**

- PUBLIC_ACTIONS, línea 249, incluye explícitamente saveScheduleTemplate, getScheduleTemplates y applyScheduleTemplate.
- validateRolePermission, líneas 524-543, devuelve autorizado inmediatamente cuando la acción está en PUBLIC_ACTIONS, antes de extraer o verificar sessionToken/authToken/token. Por tanto, las tres acciones no exigen una sesión válida ni pasan por el control RBAC normal.
- doPost, desde línea 671, valida permisos y despacha las tres acciones a saveScheduleTemplate, getScheduleTemplates y applyScheduleTemplate.
- saveScheduleTemplate, línea 13895, escribe en PlantillasHorarios; getScheduleTemplates, línea 13961, devuelve el catálogo y estructura JSON; applyScheduleTemplate, línea 14000, inserta filas en HorariosClase.
- getScheduleTemplates devuelve estructuraJson, usuarioCreacion, IDs de docentes y códigos de aulas. Al ser pública, la consulta permite obtener metadatos de planificación sin sesión.
- saveScheduleTemplate acepta payload.userId/payload.usuario como autor y aplica “Sistema” como valor alternativo; no obtiene el actor de claims verificados. applyScheduleTemplate tampoco valida identidad/actor por sí misma.
- La consecuencia no se limita a una interfaz oculta: una solicitud directa al endpoint puede invocar las operaciones porque el bypass ocurre en la puerta de autorización del servidor.

### 3.2 Captura de plantilla y esquema de HorariosClase

- createClassSchedule, líneas 6900-6990, escribe el esquema de nueve columnas: HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado y UltimaModificacion. El estado queda en row[7] y la marca temporal en row[8].
- getClassSchedules, líneas 6718-6770, también intenta interpretar grado/sección/estado en columnas 7/8/9, mostrando que conviven contratos de columnas incompatibles. Este defecto general de esquema ya está registrado en AUD-NG-168, AUD-NG-236 y AUD-NG-241.
- saveScheduleTemplate, líneas 13895-13960, obtiene grado desde rowH[7] o rowH[8], sección desde rowH[8] o rowH[9], y estado desde rowH[9] o rowH[10]. Para filas escritas por createClassSchedule, rowH[7] contiene “Activo”/“Borrador” y rowH[8] la fecha, no grado/sección. Por ello no selecciona de forma fiable los horarios de la sección solicitada; puede guardar una plantilla vacía y aun así retornar status success con bloquesContados igual a 0.
- El capturador no exige que el bloque pertenezca al período solicitado mediante una relación canónica de OfertaAcademica/OfertaID. Tampoco valida que las referencias fuente existan o estén activas.
- El esquema PlantillasHorarios guarda nombre, grado, sección, año base y EstructuraJSON. No define una estructura versionada de componentes seleccionables ni metadatos canónicos de destino.
- La plantilla almacena materia, aulaCodigo y docenteUserId automáticamente. No hay opción para excluir docentes/aulas o seleccionar únicamente distribución semanal, períodos, asignaturas, estructura de secciones o preferencias.

### 3.3 Aplicación, referencias y conflictos

- applyScheduleTemplate, líneas 14000-14099, comprueba plantillaId, targetGrado y targetSeccion, busca la plantilla por ID y parsea EstructuraJSON. No verifica que la plantilla siga activa ni resuelve referencias de asignaturas, aulas o docentes contra catálogos vigentes del período destino.
- El validador checkScheduleConflict, líneas 7493-7691, recibe diaSemana, horaInicio, horaFin, aulaCodigo, docenteUserId, ofertaId y excludeHorarioId. No recibe ni usa grado, sección o materia como claves de destino.
- applyScheduleTemplate llama checkScheduleConflict pasando grado, sección y materia, pero omite ofertaId y no entrega una oferta/período de destino. Por tanto, el motor no puede comprobar la colisión de la misma oferta/sección mediante su clave canónica.
- Si confCheck.hasConflict es verdadero, la función agrega un elemento a conflictos, pero después sigue construyendo bloquesClonados. El bloque detalles usa confCheck.conflictos, aunque el validador devuelve reason y no un arreglo conflictos.
- No existe una condición que aborte la escritura cuando conflictos.length > 0. Con previsualizar=false, los bloques se insertan de todas formas, incluso si el validador detectó conflictos de aula/docente.
- La vista previa solo retorna cuando payload.previsualizar es true. promptApplyScheduleTemplate en js/teacher.js envía explícitamente previsualizar:false, por lo que el flujo UI actual evita la vista previa y ejecuta la escritura inmediatamente.
- La función inserta filas de once columnas: ID, materia, día, inicio, fin, aula, docente, grado, sección, estado y timestamp. El escritor ordinario createClassSchedule usa nueve columnas y OfertaID en la segunda columna; el aplicador coloca materia en esa posición y grado en row[7]. Esta mezcla de contratos amplía AUD-NG-168/AUD-NG-236/AUD-NG-241 y puede contaminar consultas, carga docente y detección de conflictos.
- La aplicación conserva el registro de PlantillasHorarios sin escribir sobre su fila original. No se encontró una mutación de la plantilla durante applyScheduleTemplate.

### 3.4 Interfaz y flujo de confirmación

**js/teacher.js, SHA c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html, SHA cbb9e6a272a7d8ad33f99727303305d950533e71.**

- teacher.js, líneas 1297-1368, define openScheduleTemplatesModal, loadScheduleTemplatesList, handleSaveScheduleTemplateSubmit y promptApplyScheduleTemplate.
- El controlador espera modal-schedule-templates, schedule-templates-list-container, form-save-schedule-template, tpl-name, tpl-grado y tpl-seccion.
- La inspección completa de teacher-dashboard.html no encuentra ninguno de esos identificadores, ni botón “Plantillas”, ni modal, ni formulario. Tampoco contiene llamadas a openScheduleTemplatesModal.
- El controlador de aplicación pide grado/sección con prompt y envía previsualizar:false. No muestra los bloques resultantes, referencias faltantes ni conflictos, y no permite ajustar la propuesta antes de confirmar.
- El formulario JavaScript envía nombre, grado, sección y un anolectivo fijo “2026”; no envía selección de componentes ni identifica una oferta/período fuente real.
- ChangesLogs.txt declara que el botón y el modal se incorporaron, pero la versión actual del HTML no los contiene. La afirmación histórica no coincide con el código vigente.

### 3.5 Registro de operaciones y pruebas

- applyScheduleTemplate no invoca logStructuredEvent ni recordEntityChangeLog. Las filas insertadas no conservan plantillaId de origen, usuario verificado, correlationId ni un evento de aplicación consultable.
- El requisito de trazabilidad de CA-F7-137 debe integrarse con TASK-620/AUD-NG-261 y los defectos generales de historial AUD-NG-224/TASK-504 y LogsSistema AUD-NG-145; no se crea una tarea duplicada para el motor general de bitácoras.
- runAcademicPlanningRegressionSuite, líneas 14109-14165, incluye TC-F7-06, que solo comprueba status success y que plantillas sea un arreglo al llamar getScheduleTemplates. No prueba guardar, recuperar contenido correcto, preservar la plantilla, previsualizar, resolver referencias, conflictos, borradores ni trazabilidad.
- tests/regression/academic-grading-suite.js, SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6, no contiene casos específicos para saveScheduleTemplate/applyScheduleTemplate ni CA-F7-133..137.

## 4. Hallazgos

### AUD-NG-265 — CRÍTICO/P0: las operaciones de plantillas están declaradas públicas y omiten autenticación

**Evidencia:** Code.gs PUBLIC_ACTIONS línea 249; validateRolePermission 524-543; doPost 671-681 y dispatcher de las tres acciones; funciones 13895-14100.

**Descripción:** saveScheduleTemplate, getScheduleTemplates y applyScheduleTemplate están incluidas en PUBLIC_ACTIONS. validateRolePermission concede estas acciones antes de comprobar un token de sesión. El endpoint público permite consultar estructuras que incluyen IDs de docentes/aulas, crear plantillas y aplicar plantillas para insertar registros en HorariosClase. El autor puede ser enviado por el propio payload.

**Impacto:** un usuario sin sesión puede leer datos de planificación y ejecutar mutaciones sobre horarios. Es una exposición de autorización de servidor, no solamente una interfaz ausente. La operación de aplicación crea borradores, no los publica como Activo, pero la escritura no autorizada sigue siendo posible.

**Reconciliación:** hallazgo nuevo. Requiere corregir el bypass de las tres acciones y verificar roles/contexto de destino en servidor; no basta con ocultar controles en la UI.

### AUD-NG-266 — ALTO/P1: captura de plantillas incompatible con el esquema real de HorariosClase

**Evidencia:** Code.gs createClassSchedule 6900-6990; getClassSchedules 6718-6770; saveScheduleTemplate 13895-13960; applyScheduleTemplate 14000-14099.

**Descripción:** el capturador interpreta índices 7-10 como grado/sección/estado aunque el escritor ordinario de horarios usa índice 7 para Estado e índice 8 para UltimaModificacion. Puede guardar plantillas vacías con respuesta de éxito. A su vez, el aplicador escribe materia en la columna OfertaID y usa un esquema de once columnas diferente del escritor ordinario.

**Impacto:** las plantillas no representan de forma fiable el horario de origen y los bloques aplicados pueden ser leídos como ofertas/estados incorrectos por otras funciones. La causa raíz de contrato de HorariosClase ya existe en AUD-NG-168/AUD-NG-236/AUD-NG-241; se amplía allí y no se duplica.

### AUD-NG-267 — ALTO/P1: la aplicación no bloquea conflictos ni valida referencias del período destino

**Evidencia:** Code.gs applyScheduleTemplate 14000-14099; checkScheduleConflict 7493-7691.

**Descripción:** el aplicador omite ofertaId y pasa grado/sección/materia que el validador no consume. No resuelve referencias inexistentes de docentes, aulas o asignaturas. Aunque detecte conflictos de docente/aula, los agrega al resultado y continúa con la escritura; no existe un bloqueo cuando hay conflictos. El detalle esperado apunta a confCheck.conflictos, pero el motor devuelve reason.

**Impacto:** pueden insertarse borradores con recursos ocupados, referencias inválidas o colisiones de sección/oferta no detectadas. No se satisface la revalidación contra el período destino.

### AUD-NG-268 — MEDIO/P2: faltan selección de componentes, previsualización efectiva y UI de ajustes

**Evidencia:** teacher.js 1297-1368; teacher-dashboard.html completo; Code.gs 13895-14099; ChangesLogs.txt 2586 y siguientes.

**Descripción:** el backend captura todos los campos disponibles sin selección de componentes y copia docentes/aulas automáticamente. La interfaz vigente carece de botón, modal, formulario y contenedor. El controlador existente aplica con previsualizar:false y solo pregunta grado/sección; no presenta la propuesta, referencias faltantes o conflictos ni permite ajustar antes de confirmar. El año lectivo se envía como valor fijo “2026”.

**Impacto:** los requisitos de reutilización selectiva, previsualización y ajuste no están disponibles para el usuario. El ChangesLogs histórico afirma que la UI fue agregada, pero el HTML actual no contiene los nodos declarados.

### AUD-NG-269 — MEDIO/P2: la aplicación no registra su origen y la suite no verifica el ciclo de vida de plantillas

**Evidencia:** Code.gs applyScheduleTemplate 14000-14099 y runAcademicPlanningRegressionSuite 14109-14165; tests/regression/academic-grading-suite.js completo.

**Descripción:** la aplicación no genera evento durable ni guarda plantillaId de origen, actor verificado, período destino, correlationId y resultado. TC-F7-06 solo prueba que el catálogo devuelve un arreglo; no prueba la operación de guardar/aplicar ni CA-F7-133..137.

**Impacto:** no se puede identificar posteriormente qué plantilla originó un horario, quién lo aplicó, a qué destino ni si se aplicó con conflictos. La suite puede pasar sin que la reutilización funcione.

**Reconciliación:** ampliar TASK-620/AUD-NG-261 para el evento de aplicación de plantilla; ampliar TASK-504/AUD-NG-224 y AUD-NG-145 para el contrato de historial/bitácora. TASK-625 incorporará pruebas conductuales específicas, coordinadas con AUD-NG-161.

## 5. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-133 | CUMPLE | applyScheduleTemplate lee la fila original de PlantillasHorarios y no la actualiza; solo escribe filas en HorariosClase. |
| CA-F7-134 | NO CUMPLE | No existe resolución/validación de referencias inexistentes antes de confirmar. |
| CA-F7-135 | NO CUMPLE | La llamada al motor omite ofertaId; grado/sección/materia no son consumidos por checkScheduleConflict; los conflictos detectados no bloquean la escritura. |
| CA-F7-136 | CUMPLE | Los bloques se insertan con estado Borrador, no Activo; la función no publica automáticamente. La ausencia de previsualización se registra en AUD-NG-268 y no convierte un borrador en publicación. |
| CA-F7-137 | NO CUMPLE | No se persiste evento ni vínculo plantilla-origen/actor/destino/correlationId. |

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

#### TASK-622 — Cerrar el bypass de autenticación de operaciones de plantillas
- **Hallazgo de origen:** AUD-NG-265.
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Objetivo y acción:** retirar saveScheduleTemplate, getScheduleTemplates y applyScheduleTemplate de PUBLIC_ACTIONS; exigir token vigente y autorización RBAC/ABAC en servidor; obtener actor/rol exclusivamente de claims verificados; limitar lectura, creación y aplicación a roles/ámbitos autorizados y validar el período institucional.
- **Archivos/módulos:** backend/academic-service/Code.gs, PUBLIC_ACTIONS, validateRolePermission, doPost y pruebas de autorización.
- **Dependencias:** sesión institucional, ROLE_PERMISSIONS, validación contextual y actor verificado.
- **Criterios verificables:** solicitudes anónimas a las tres acciones son rechazadas; token inválido/caducado se rechaza; roles sin permiso no pueden leer ni mutar; los roles autorizados pueden operar en su ámbito; el autor no puede falsificarse desde payload.
- **Estado:** Pendiente.

#### TASK-623 — Normalizar el contrato de plantillas y la selección de componentes reutilizables
- **Hallazgo de origen:** AUD-NG-266.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** definir el esquema canónico de HorariosClase y una estructura versionada de plantilla; resolver período/oferta fuente; corregir la extracción de filas; permitir seleccionar distribución semanal, períodos, asignaturas, secciones y preferencias; excluir docentes/aulas/asignaciones por defecto cuando deban revalidarse; impedir guardar una plantilla vacía como éxito.
- **Archivos/módulos:** backend/academic-service/Code.gs, PlantillasHorarios, HorariosClase y contratos de consulta.
- **Dependencias:** AUD-NG-168, AUD-NG-236, AUD-NG-241 y sus tareas de esquema/relaciones canónicas.
- **Criterios verificables:** filas de origen se recuperan con el esquema canónico; la plantilla contiene solo componentes seleccionados; docente/aula no se heredan sin decisión explícita y validación; referencias fuente/período son identificables; una plantilla vacía o incompatible produce error explícito; aplicar no modifica su versión original.
- **Estado:** Pendiente.

#### TASK-624 — Implementar validación, previsualización y confirmación segura de plantillas
- **Hallazgo de origen:** AUD-NG-267.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** resolver referencias contra catálogos del período destino; comprobar oferta, asignatura, docente, aula, disponibilidad y colisiones de sección; pasar claves canónicas al validador; bloquear la aplicación ante conflictos o referencias faltantes; mostrar propuesta y permitir ajustes antes de confirmar; crear únicamente borradores y mantener publicación como acción separada.
- **Archivos/módulos:** backend/academic-service/Code.gs, checkScheduleConflict, applyScheduleTemplate y controladores UI.
- **Dependencias:** TASK-623, AUD-NG-236, AUD-NG-168, F7-IMP-01/F7-IMP-02.
- **Criterios verificables:** cada referencia faltante se presenta antes de confirmar; conflictos de aula/docente/oferta bloquean la escritura; el resultado de validación contiene detalles reales; el modo preview no muta hojas; ajustes vuelven a validar; confirmar crea borradores con esquema canónico y nunca publica automáticamente.
- **Estado:** Pendiente.

#### TASK-625 — Conectar la UI de plantillas y añadir pruebas conductuales
- **Hallazgo de origen:** AUD-NG-268 y AUD-NG-269.
- **Severidad/Prioridad:** MEDIO/P2.
- **Objetivo y acción:** incorporar botón, modal, formulario, catálogo y contenedor en teacher-dashboard.html; conectar los controladores; mostrar componentes seleccionables, preview, conflictos y referencias faltantes; permitir ajustes y confirmación; reemplazar TC-F7-06 de humo por pruebas de guardar/listar/preview/aplicar, inmutabilidad, permisos y ausencia de publicación.
- **Archivos/módulos:** teacher-dashboard.html, js/teacher.js, backend/academic-service/Code.gs, tests/regression/academic-grading-suite.js.
- **Dependencias:** TASK-622, TASK-623, TASK-624 y AUD-NG-161.
- **Criterios verificables:** el botón abre el modal real; formulario y lista tienen nodos existentes; la UI envía token y destino correcto; el preview se muestra antes de confirmar; los conflictos impiden la confirmación; los tests verifican contenido y efectos, no solo status/array.
- **Estado:** Pendiente.

### Ampliaciones de tareas y hallazgos existentes

- **AUD-NG-168:** ampliar el contrato canónico de HorariosClase y las relaciones de oferta/sección para lectura, guardado y aplicación de plantillas.
- **AUD-NG-236:** ampliar la validación de conflictos para que applyScheduleTemplate suministre oferta/período y no pueda continuar cuando el motor devuelve conflicto.
- **AUD-NG-241:** ampliar la revisión de mapeos de HorariosClase y consultas de capacidad/ocupación que consumen las filas generadas.
- **AUD-NG-261 / TASK-620:** añadir evento durable de aplicación de plantilla con plantillaId origen, actor verificado, destino, cantidad de bloques, conflictos, resultado y correlationId.
- **AUD-NG-224 / TASK-504 y AUD-NG-145:** extender historial/bitácora para el evento de aplicación y sus lectores; mantener sus defectos generales de esquema, DTO, fuentes, sanitización y persistencia sin duplicarlos.
- **AUD-NG-161:** coordinar regresión e integración; TASK-625 conserva los escenarios propios de CA-F7-133..137.
- **Control de duplicidad:** TASK-234, TASK-252 y TASK-429 cubren rendimiento, telemetría y paginación general; no sustituyen las tareas funcionales de plantillas y no se crean duplicados de esos alcances.

## 7. Pruebas y límites

- **Ejecutadas:** inspección manual de PUBLIC_ACTIONS, validateRolePermission, doPost, escritores/lectores de HorariosClase, saveScheduleTemplate, getScheduleTemplates, applyScheduleTemplate, checkScheduleConflict, controladores JavaScript, HTML completo, TC-F7-06 y suite externa; contraste de ChangesLogs.txt; recuperación y validación del blob de Pendientes.md; verificación de rama, HEAD, árbol y rama base.
- **No ejecutadas:** Apps Script runtime, Google Sheets productivas, HTTP/OAuth real, solicitudes anónimas reales, navegador/DOM, pruebas de roles productivos, concurrencia, mutaciones reales, ejecución de TC-F7-06, Node ni E2E.
- No se afirma que las funciones hayan sido ejecutadas contra datos productivos ni que se haya probado una explotación HTTP real; el bypass se acredita por el flujo de autorización y dispatcher inspeccionado.
- No se modificó código, UI, pruebas, datos productivos, completadas.md, Pendientes.md, ChangesLogs.txt, metodología ni rama base.

## 8. Cierre

- **TAREA-F7-IMP-22:** NO CUMPLE; se conserva la marca histórica [X] en completadas.md.
- **Hallazgos nuevos:** AUD-NG-265 (bypass público P0), AUD-NG-266 (esquema/captura), AUD-NG-267 (validación/conflictos), AUD-NG-268 (UI/preview) y AUD-NG-269 (trazabilidad/pruebas).
- **Hallazgos ampliados:** AUD-NG-168, AUD-NG-236, AUD-NG-241, AUD-NG-224 y AUD-NG-145; ampliar AUD-NG-261/TASK-620 para aplicación de plantillas.
- **Tareas nuevas:** TASK-622, TASK-623, TASK-624 y TASK-625.
- **Archivo nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-22.md.
- **Archivos de auditoría actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Archivos sin cambios:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html; tests/regression/academic-grading-suite.js; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.
- **Siguiente tarea exacta:** TAREA-F7-IMP-23, herramientas de impresión y distribución de horarios.
