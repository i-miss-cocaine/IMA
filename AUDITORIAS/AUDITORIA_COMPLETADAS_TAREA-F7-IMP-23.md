# AUDITORÍA FUNCIONAL Y TÉCNICA — TAREA-F7-IMP-23
## Herramientas de impresión y distribución de horarios

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-1935Z-01 (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.255.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** f79551dc9a6e37e033ebc24c5ef287b1ae750320.
- **Tree SHA de partida reconstruido:** 27b254427ecfbde4b9e6aff09c2fd4ed8437b0c9 (árbol base de C1.255 reconstruido aplicando las cinco rutas exactas de su diff sobre el tree de C1.254).
- **Rama base protegida:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; comparación: 324 commits adelante, 0 detrás.
- **Estado en completadas.md:** [X] histórico; no equivale a certificación funcional.
- **Prioridad declarada:** P3.
- **Dictamen:** **NO CUMPLE**.
- **Fuente primaria:** completadas.md, TAREA-F7-IMP-23, líneas 4658-4688, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Fuente secundaria declarada:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, no localizada en la rama.
- **Informe individual esperado:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-23.md, no localizado. Se ejecutó la auditoría directamente desde el bloque completo de completadas.md; no se omitió la tarea.

---

## 1. Alcance y criterios de aceptación

La tarea exige preparar horarios imprimibles por docente, sección, aula y período; seleccionar intervalo de fechas y filtros; incluir información de identificación de cada clase; diferenciar horarios vigentes y borradores; respetar el ámbito autorizado; mantener legibilidad multipágina; exportar en formatos admitidos; mostrar fecha de generación y período; identificar la versión publicada; y evitar que cambios pendientes se presenten como oficiales.

Criterios auditados:

- **CA-F7-138:** el documento exportado coincide con los filtros y el horario seleccionado.
- **CA-F7-139:** la información se presenta de manera legible.
- **CA-F7-140:** los datos restringidos no se incluyen en la exportación.
- **CA-F7-141:** el documento permite identificar su período y estado.
- **CA-F7-142:** las modificaciones posteriores no alteran retroactivamente un documento ya generado.

**Resultado por criterio:**

| Criterio | Resultado | Evidencia resumida |
|---|---|---|
| CA-F7-138 | NO CUMPLE | No hay controles/modal de impresión en HTML; el controlador docente no recibe filtros y el CSV existente ignora anoLectivo. |
| CA-F7-139 | NO CUMPLE | La ruta estudiante imprime la página sin crear el área visible de impresión; la ruta docente no tiene contenedor conectado y el CSS no resuelve paginación. |
| CA-F7-140 | NO CUMPLE | AUD-NG-246 ya documenta que getStudentSchedule acepta grado/sección enviados por el cliente sin comprobar matrícula/ámbito contra la identidad verificada; la impresión hereda ese alcance manipulable. |
| CA-F7-141 | NO CUMPLE | El controlador docente fija el período en 2026 y etiqueta siempre el documento como publicado, sin leer el estado real. |
| CA-F7-142 | NO VERIFICABLE | No existe flujo funcional conectado que genere y conserve un snapshot identificable/versionado; no se pudo verificar un documento generado real. |

---

## 2. Procedimiento y fuentes

1. Verificar repositorio, rama, HEAD, árbol reconstruido, checkpoint C1.255 y rama base.
2. Consultar completadas.md, Pendientes.md, ChangesLogs.txt, el informe individual esperado y la fuente de Fase 7.
3. Recuperar Pendientes.md directamente desde el blob cuando la lectura ordinaria devuelva cero caracteres.
4. Inspeccionar manualmente los controladores de impresión, las vistas HTML completas, el CSS de impresión, los consumidores de horarios, el endpoint CSV y los contratos de lectura backend.
5. Contrastar los diez requisitos funcionales y los cinco criterios de aceptación.
6. Reconciliar con AUD-NG-246 (DOM/ámbito de horarios), AUD-NG-247 (filtros/alcance de reportes) y AUD-NG-248 (exportación CSV masiva), sin duplicar causas raíz ya registradas.
7. Registrar hallazgos y tareas ejecutables derivadas en este informe y en los registros de auditoría relacionados. No modificar código durante la auditoría.

### Integridad documental

- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TAREA-F7-IMP-23 aparece marcada [X] en líneas 4658-4688.
- **Informe individual IMP-23:** NOT_FOUND.
- **Fuente de Fase 7:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, NOT_FOUND.
- **Pendientes.md:** la lectura convencional de la ruta devuelve 0 caracteres; el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c se recuperó íntegramente mediante fetch_blob. Contenido: 1,782,094 caracteres, 20,182 líneas, 0 caracteres U+FFFD, 511 IDs TASK únicos. No contiene TAREA-F7-IMP-23 ni TASK-626..TASK-629. El blob íntegro ya está asociado a la ruta de la rama; no requiere restauración ni transferencia adicional. No se modificó.
- **ChangesLogs.txt:** el registro histórico “REGISTRO DE CAMBIOS - TAREA-F7-IMP-23” (2025-05-24) afirma que se agregaron botones “Imprimir Horario” y el modal #modal-print-schedule a ambos dashboards, además de controladores JS. La inspección actual de ambos HTML no encuentra esos nodos; la afirmación histórica no coincide con la rama vigente.
- **Informe de IMP-13:** AUD-NG-248 y TASK-597..TASK-602 ya cubren el endpoint CSV, el filtro de año, la falta de descarga JSON y la ausencia del modal/controles de importación-exportación. Esta auditoría los amplía como dependencia de distribución, sin duplicar tareas.
- **Informe de IMP-11:** AUD-NG-246 ya registra la ausencia de los contenedores de horario y la aceptación de grado/sección arbitrarios desde el cliente; se amplía para el flujo de impresión y su exposición de datos.
- **Normalización:** este informe incluye la sección obligatoria “Tareas ejecutables derivadas de los hallazgos”. Los hallazgos y las tareas se indexan también en Auditoria.txt, MapaDependencias.md y AUDITORIA_COMPLETADAS_PLAN.md.

---

## 3. Inspección técnica y evidencia

### 3.1 Interfaz docente y controlador de impresión

**teacher-dashboard.html, SHA cbb9e6a272a7d8ad33f99727303305d950533e71 (1.475 líneas).**

- La inspección completa no encuentra los identificadores modal-print-schedule, print-schedule-preview-area, schedule-matrix-container, schedules-table-body ni un botón que invoque openPrintScheduleModal.
- No existe una ruta HTML que permita abrir el modal o presentar la previsualización. El código JS asociado queda huérfano.
- js/teacher.js, líneas 592-658, renderSchedulePlanningMatrix retorna inmediatamente si no existe schedules-table-body.
- js/teacher.js, líneas 664-682, loadMasterSchedules intenta cargar getClassSchedules, pero la vista actual no proporciona el tbody que el renderizador necesita.

**js/teacher.js, SHA c475fce5afcd28fca23e7b64398ad32b17773746.**

- Líneas 1251-1255: openPrintScheduleModal solo intenta quitar la clase hidden de modal-print-schedule; no comprueba ni construye el modal.
- Líneas 1257-1261: executePrintSchedule llama window.print() si print-schedule-preview-area no existe. Como el HTML no contiene ese nodo, se activa el fallback de impresión de la página completa.
- Líneas 1264-1279: la etiqueta DOCUMENTO OFICIAL PUBLICADO está definida como constante; no se consulta el estado de la versión seleccionada. El subtítulo fija “Período Académico 2026”; no se deriva del horario ni del filtro.
- Líneas 1282-1284: el contenido se copia desde schedule-matrix-container.innerHTML, identificador ausente en teacher-dashboard.html. No se prepara un conjunto de datos derivado de los filtros de impresión.
- Líneas 1286-1289: el pie declara “Página 1 de 1” sin calcular paginación.
- Líneas 1291-1293: llama window.print() sin restaurar/limpiar la vista temporal ni gestionar el ciclo de impresión.
- Líneas 864-989: openBulkScheduleImportExportModal conecta el botón btn-export-bulk-schedules-csv si existe, pero el dashboard vigente no contiene ese botón ni el modal. El endpoint CSV ya está auditado bajo AUD-NG-248.

### 3.2 Interfaz estudiante y controlador de impresión

**student-dashboard.html, SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1 (412 líneas).**

- No contiene modal-student-print-schedule, student-schedule-container ni un botón que invoque openStudentPrintScheduleModal.
- La interfaz no contiene un área imprimible específica del horario.

**js/student.js, SHA e2888cea60322e49a40b89adadb8010489605dcc.**

- Líneas 874-878: openStudentPrintScheduleModal solo intenta mostrar modal-student-print-schedule, que no existe en el HTML.
- Líneas 880-882: executeStudentPrintSchedule llama directamente window.print(); no crea .printable-schedule-area ni una copia de los datos del horario.
- Líneas 885-890: fetchAndRenderStudentSchedule retorna si no existe student-schedule-container; el HTML actual carece de ese contenedor.
- Líneas 891-899 y 919-955: la consulta/renderizado utiliza el userId, grado y sección del currentUser del cliente y construye una vista semanal; no crea un snapshot específico de impresión ni metadatos de período/versión.

### 3.3 Estilos de impresión y paginación

**css/style.css, SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6, líneas 946-971.**

- Existe un bloque @media print que oculta body * y vuelve visible únicamente .printable-schedule-area y sus descendientes.
- La ruta docente solo crea esa clase si existe print-schedule-preview-area; el nodo no existe en HTML, por lo que el fallback window.print() no deja un área visible.
- La ruta estudiante no crea .printable-schedule-area; por tanto, con las reglas vigentes, oculta también el horario y el resto de la página. El resultado esperado de imprimir/PDF es una página vacía o sin contenido de horario.
- @page fija A4 landscape y margen de 1 cm. No se encontraron reglas break-before/break-after/break-inside, control de filas partidas, encabezados repetidos, pie dinámico ni gestión de desbordamiento para horarios extensos.
- El “Página 1 de 1” del controlador docente es texto fijo, no una numeración real.

### 3.4 Contratos backend, alcance y exportación

**backend/academic-service/Code.gs, SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.**

- getClassSchedules, líneas 6718-6770, admite filtros de oferta, docente, aula, año, grado y sección, pero la interfaz de impresión no construye ni transmite una selección de filtros propia. Además, los defectos de contrato/estado y ámbito ya están registrados en AUD-NG-246/AUD-NG-247 y los hallazgos de esquema asociados.
- getStudentSchedule, líneas 7986-8070, consume userId, grado y sección desde payload; busca matrícula solo cuando grado o sección faltan. Si el cliente proporciona ambos, el backend usa directamente esos valores para elegir ofertas activas. AUD-NG-246 ya registró que el estudiante puede indicar un grado/sección arbitrarios y que no existe una comprobación contextual suficiente de la matrícula/identidad. Esta auditoría amplía el impacto a la impresión/exportación, sin crear otro hallazgo para la misma causa raíz.
- exportBulkClassSchedules, líneas 3403-3427, solo excluye filas cuyo estado en índice 7 sea “Inactivo”; no aplica anoLectivo al filtro, aunque lo recibe y lo devuelve como etiqueta. Exporta DocenteUserId en el CSV. Su falta de controles/UI, el contrato de ocho columnas y las deficiencias de CSV/JSON ya se registran en AUD-NG-248 y TASK-597..TASK-602; se amplía su relación con CA-F7-138/140, sin duplicar la tarea de exportación masiva.
- El endpoint CSV no sustituye las vistas imprimibles por docente/sección/aula ni demuestra que la exportación coincida con los filtros seleccionados.

### 3.5 Reconciliación de cambios históricos y pruebas

- ChangesLogs.txt contiene el registro de TAREA-F7-IMP-23 fechado 2025-05-24: declara que ambos dashboards recibieron botones “Imprimir Horario” y el modal #modal-print-schedule. Los HTML vigentes no contienen esos nodos.
- La presencia de comentarios [TAREA-F7-IMP-23] en JS/CSS no prueba que el flujo esté conectado.
- No se encontraron pruebas conductuales específicas de CA-F7-138..142 en los segmentos de controladores y UI inspeccionados. No se ejecutó una descarga CSV/PDF ni una impresión real.
- No se atribuye un resultado visual de navegador porque no se ejecutó navegador ni entorno de impresión.

---

## 4. Hallazgos

### AUD-NG-270 — ALTO/P1: flujo de impresión docente desconectado de la interfaz y de los datos seleccionados

**Evidencia:** teacher-dashboard.html completo (1-1475); js/teacher.js 592-682 y 1251-1294; css/style.css 946-971.

**Descripción:** el HTML vigente no contiene botón, modal ni contenedores que requiere el controlador. openPrintScheduleModal no puede mostrar un modal inexistente; executePrintSchedule cae a window.print() cuando falta print-schedule-preview-area. También faltan los nodos schedule-matrix-container y schedules-table-body que alimentarían la matriz y el documento.

**Impacto:** no existe una ruta funcional desde el dashboard para preparar, previsualizar o imprimir horarios docentes, de secciones o aulas. La impresión de fallback queda sometida al CSS que oculta todo excepto el área imprimible inexistente.

**Reconciliación:** hallazgo nuevo para la ruta de impresión; amplía AUD-NG-246 respecto de los nodos de horario y controles ausentes, sin duplicar el hallazgo general de portales.

### AUD-NG-271 — ALTO/P1: el documento docente afirma falsamente que todo horario es oficial y del período 2026

**Evidencia:** js/teacher.js 1264-1284.

**Descripción:** stateBadge es una constante con el texto “DOCUMENTO OFICIAL PUBLICADO”; el subtítulo también fija “Período Académico 2026”. No se consulta el estado publicado/borrador, la versión seleccionada, el período real ni un identificador de horario. Tampoco se transmiten filtros de fecha, docente, sección o aula al generador del documento.

**Impacto:** si se conectara el modal sin corregir esta lógica, un borrador o una versión de otro período podría distribuirse con apariencia de documento oficial. No se satisfacen CA-F7-138, CA-F7-141 ni la prevención de distribución de cambios pendientes.

**Reconciliación:** hallazgo nuevo, relacionado con AUD-NG-246/AUD-NG-247 para el estado y ámbito de los horarios; no duplica los problemas de publicación ya registrados.

### AUD-NG-272 — ALTO/P1: la impresión del estudiante no crea el área que el CSS permite imprimir

**Evidencia:** js/student.js 874-882 y 885-955; student-dashboard.html completo (1-412); css/style.css 947-971.

**Descripción:** executeStudentPrintSchedule solo invoca window.print(). El CSS oculta todos los elementos del body y muestra únicamente .printable-schedule-area, pero el controlador estudiante no crea ni aplica esa clase. Además, el modal y el contenedor de horario no existen en student-dashboard.html.

**Impacto:** la salida impresa/PDF no contiene el horario del estudiante y puede quedar en blanco. No hay encabezado institucional, período, fecha de generación ni estado de versión en el documento estudiante.

**Reconciliación:** hallazgo nuevo específico del ciclo de impresión estudiante; amplía AUD-NG-246 para el portal y AUD-NG-161 para pruebas conductuales.

### AUD-NG-273 — MEDIO/P2: las reglas de impresión no soportan horarios multipágina ni paginación verificable

**Evidencia:** css/style.css 946-971; js/teacher.js 1286-1289.

**Descripción:** el CSS solo define A4 landscape, margen y visibilidad; no controla saltos de página, filas partidas, repetición de encabezados, desbordamiento ni pie dinámico. El controlador docente fija “Página 1 de 1”.

**Impacto:** horarios extensos pueden fragmentarse, cortarse o perder contexto entre páginas. La legibilidad no está garantizada para todas las vistas ni tamaños de horario.

**Reconciliación:** hallazgo nuevo de presentación impresa, no cubierto por las tareas generales de paginación de pantallas ni por el endpoint CSV.

---

## 5. Ampliaciones de hallazgos y tareas existentes

- **AUD-NG-246 / TASK-584..TASK-589:** ampliar la ausencia de nodos DOM/consumidores de horario a los controles de impresión; mantener la corrección de identidad, matrícula y ámbito de estudiante en servidor. El estudiante no debe poder seleccionar arbitrariamente otra sección modificando payload.
- **AUD-NG-247:** ampliar la necesidad de filtros reales por año/período y ámbito en los datos que alimentan documentos imprimibles.
- **AUD-NG-248 / TASK-597..TASK-602:** reutilizar el trabajo existente de exportación CSV/JSON; ampliar CA-F7-138/140 para exigir filtros, período real y autorización efectiva. No crear un segundo endpoint ni duplicar tareas de exportación masiva.
- **AUD-NG-161:** coordinar pruebas conductuales de navegador/impresión y permisos, sin sustituir los casos específicos de las tareas nuevas.

---

## 6. Tareas ejecutables derivadas de los hallazgos

### TASK-626 — Integrar el flujo de impresión docente con filtros y vista previa
- **Hallazgo de origen:** AUD-NG-270.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** incorporar en teacher-dashboard.html los controles, modal, vista previa y contenedores que requiere js/teacher.js; permitir seleccionar perspectiva docente/sección/aula, período e intervalo de fechas; cargar solo el conjunto filtrado y autorizado; conectar los eventos sin fallback a imprimir toda la página.
- **Archivos/módulos:** teacher-dashboard.html, js/teacher.js, backend/academic-service/Code.gs, css/style.css.
- **Dependencias:** AUD-NG-246, AUD-NG-247, TASK-584..TASK-589, AUD-NG-161.
- **Criterios verificables:** los nodos existen y están conectados; la selección modifica exactamente el dataset del preview; el documento no contiene filas fuera del filtro; los errores de carga se muestran y no se presentan como horarios vacíos; el control de rol/ámbito se valida en servidor.
- **Estado:** Pendiente.

### TASK-627 — Integrar impresión estudiante con alcance de matrícula verificado
- **Hallazgo de origen:** AUD-NG-272; ampliación de AUD-NG-246.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** crear un área imprimible específica del horario estudiante y conectar el botón/modal; derivar estudiante, matrícula, grado y sección desde identidad/relación verificada en servidor, no desde parámetros manipulables; mostrar únicamente los datos permitidos y preparar una salida de impresión que no oculte el contenido.
- **Archivos/módulos:** student-dashboard.html, js/student.js, backend/academic-service/Code.gs, css/style.css.
- **Dependencias:** AUD-NG-246, TASK-567, TASK-584..TASK-589, AUD-NG-161.
- **Criterios verificables:** el modal y el área imprimible existen; imprimir/PDF contiene el horario seleccionado y ningún elemento ajeno; cambiar userId/grado/sección en el payload no permite consultar otra matrícula; una respuesta fallida no produce un documento vacío con apariencia de éxito.
- **Estado:** Pendiente.

### TASK-628 — Generar documentos con metadatos reales y snapshot de versión
- **Hallazgo de origen:** AUD-NG-271.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** construir el documento desde una selección explícita y un snapshot de datos; incluir fecha/hora de generación, período real, filtros, versión/estado real y membrete; impedir que borradores o cambios pendientes se etiqueten como publicados; preservar el contenido del documento generado ante modificaciones posteriores.
- **Archivos/módulos:** js/teacher.js, js/student.js, backend/academic-service/Code.gs, teacher-dashboard.html, student-dashboard.html.
- **Dependencias:** TASK-626, TASK-627, AUD-NG-246, AUD-NG-247, AUD-NG-248.
- **Criterios verificables:** los metadatos coinciden con el registro/versión fuente; un borrador nunca se presenta como oficial; el documento coincide con los filtros; un cambio posterior genera un nuevo snapshot y no altera el anterior; la autorización se aplica antes de construir la salida.
- **Estado:** Pendiente.

### TASK-629 — Completar paginación y legibilidad multipágina de horarios
- **Hallazgo de origen:** AUD-NG-273.
- **Severidad/Prioridad:** MEDIO/P2.
- **Objetivo y acción:** añadir reglas de impresión para saltos de página, filas indivisibles, encabezados/pies repetidos, márgenes y desbordamiento; calcular la numeración real de páginas y comprobar matrices extensas.
- **Archivos/módulos:** css/style.css, js/teacher.js, js/student.js.
- **Dependencias:** TASK-626, TASK-627, TASK-628, AUD-NG-161.
- **Criterios verificables:** horarios de varias páginas conservan encabezados y columnas; ninguna fila se corta de forma ilegible; la numeración coincide con las páginas generadas; la vista previa y el PDF mantienen el mismo contenido.
- **Estado:** Pendiente.

---

## 7. Pruebas y límites

- **Ejecutadas:** inspección manual de los HTML completos, controladores de impresión y carga de horarios, CSS @media print, endpoint CSV y consulta estudiante; contraste de ChangesLogs.txt y auditorías IMP-11/12/13; recuperación y validación del blob Pendientes.md; verificación de rama, HEAD, árbol reconstruido y rama base.
- **No ejecutadas:** navegador/DOM, diálogo de impresión, guardado real a PDF, descarga CSV, Apps Script runtime, Google Sheets productivas, HTTP/OAuth real, pruebas de roles/matrículas reales, pruebas de paginación en distintos navegadores, Node ni E2E.
- No se afirma que se haya generado un PDF real ni que se haya probado un acceso indebido mediante HTTP. La falta de nodos y el flujo de autorización/consulta se acreditan por inspección estática manual.
- No se modificó código, UI, pruebas, datos productivos, completadas.md, Pendientes.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md.

## 8. Cierre

- **TAREA-F7-IMP-23:** NO CUMPLE; se conserva la marca histórica [X] en completadas.md.
- **Hallazgos nuevos:** AUD-NG-270 (flujo docente desconectado), AUD-NG-271 (estado/período docente falsos), AUD-NG-272 (impresión estudiante sin área imprimible) y AUD-NG-273 (paginación insuficiente).
- **Hallazgos ampliados:** AUD-NG-246 (DOM/ámbito de horarios), AUD-NG-247 (filtros y alcance), AUD-NG-248 (exportación CSV) y AUD-NG-161 (pruebas conductuales).
- **Tareas nuevas:** TASK-626, TASK-627, TASK-628 y TASK-629.
- **Archivo nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-23.md.
- **Archivos de auditoría actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Archivos sin cambios:** teacher-dashboard.html; student-dashboard.html; js/teacher.js; js/student.js; css/style.css; backend/academic-service/Code.gs; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.
- **Siguiente tarea exacta:** TAREA-F7-IMP-24, preferencias de calendario y personalización de vistas.
