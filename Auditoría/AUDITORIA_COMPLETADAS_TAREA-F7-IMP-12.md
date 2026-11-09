# AUDITORÍA TAREA-F7-IMP-12
## Ampliar los reportes de carga docente, ocupación y calidad de planificación

- **Fecha de auditoría:** 2026-11-08 (UTC).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** e28ff4a5529d4194702f2b796b67d19ee7b61a60 (C1.243).
- **Árbol de partida:** e6f48e68dd995326d01d4600a055f84fe529fc93.
- **Checkpoint inicial:** C1.243. **Checkpoint de cierre:** C1.244.
- **ID de sesión operativo:** IMA-AUDIT-20261108-0054Z (identificador documental, no ID nativo de ChatGPT).
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica [X] de completadas.md.
- **Severidad global del hallazgo:** ALTA/P1, por exposición de consultas de carga fuera del ámbito del docente y ausencia de controles funcionales de reporte.
- **Tarea de origen:** TAREA-F7-IMP-12 (P2, Analítica de Horarios).
- **Criterios:** CA-F7-75..80, todos NO CUMPLE.

## 1. Alcance y criterios

Se contrastaron los doce requisitos funcionales de TAREA-F7-IMP-12 con:
- getTeachingHoursSummary, getCurricularAnalyticsReport, getTeacherTeachingLoad y getPlanningQualityAndOccupancyReport.
- ROLE_PERMISSIONS, validateContextualAccess, validateRolePermission y dispatcher doPost del servicio académico.
- teacher-dashboard.html y el controlador openPlanningQualityReportModal de js/teacher.js.
- runAcademicPlanningRegressionSuite y la suite de regresión académica.
- ChangesLogs.txt, completadas.md, Pendientes.md, el informe individual y el documento de origen citado.

La inspección fue manual y focalizada por función, bloque, parámetro, estado, permiso y consumidor. No se modificó código ni se ejecutaron operaciones sobre hojas productivas.

## 2. Integridad documental y fuentes

- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TAREA-F7-IMP-12 aparece marcada [X] y contiene los doce requisitos y CA-F7-75..80. La marca se conserva sin alteración.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-12.md no existía en la rama; se crea este informe.
- **Documento de origen:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md no existe ni en la raíz ni en AUDITORIAS. Se registra la ausencia y se audita usando los requisitos explícitos conservados en completadas.md; no se inventa ni sustituye la fuente.
- **Pendientes.md:** el fetch ordinario de la ruta devuelve cero caracteres, pero el árbol completo de C1.243 confirma que el blob de la ruta es exactamente 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c. Se recuperó por SHA directamente: 1.782.094 caracteres, 20.182 líneas, cero caracteres U+FFFD, 509 identificadores TASK únicos desde TASK-001 hasta TASK-511. El blob recuperado es el mismo que ya referencia la rama; no hace falta restaurarlo ni transferirlo. No contiene TAREA-F7-IMP-12 ni TASK-590..TASK-596. No se modifica Pendientes.md.
- **ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; la entrada del 2026-10-26 (líneas 2377-2378) afirma que se creó getPlanningQualityAndOccupancyReport, se integró en ROLE_PERMISSIONS/dispatcher y se agregó modal/controlador en teacher-dashboard.html/js/teacher.js. El backend y el controlador existen parcialmente; la página HTML actual no contiene el modal ni sus nodos.
- **Origen y trazabilidad:** la entrada histórica no demuestra cumplimiento funcional; se contrasta con el código vigente y el HTML real de la rama.
- **Identificadores:** AUD-NG-247 y TASK-590..TASK-596 no existían en los registros auditados antes de esta iteración.

## 3. Evidencia técnica

### 3.1 Resumen de sesiones y carga docente

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- getTeachingHoursSummary (líneas 2798-2857) consulta SesionesClaseImpartidas y filtra opcionalmente por docenteUserId, ofertaId, fechaInicio y fechaFin. Cuenta sesiones Impartida/Recuperada, Cancelada, Reprogramada y pendientes, y devuelve el detalle de sesiones.
- Esta función no suma horas docentes, no agrupa por día/semana/período/año lectivo, no recibe anoId ni calcula la carga planificada a partir de bloques horarios. Es un recuento de sesiones realizadas/registradas, no satisface por sí solo el reporte de carga.
- getTeacherTeachingLoad (líneas 6773-6837) calcula minutos/horas semanales por docente y compara contra un límite personalizado o 40 horas. Sin embargo, aunque destructura anoId, no lo usa para filtrar; suma todas las filas que coinciden con docenteUserId. El filtro de estado solo excluye r[7] === "Inactivo", por lo que también suma Borrador, Cancelado y cualquier estado no inactivo. No separa planificación vigente de registros históricos ni consolida por períodos/año.
- La carga depende del docenteUserId enviado en el payload. La función no comprueba que coincida con _verifiedUserId ni deriva el docente desde las asignaciones autorizadas. Se documenta junto al hallazgo de autorización de la sección 3.4.

### 3.2 Analítica curricular no aplicada a la planificación

- getCurricularAnalyticsReport (líneas 2927-2986) acepta area, asignatura, grado, programa y periodo, pero recorre todas las filas de CalificacionesEstudiantes sin aplicar esos filtros.
- Los valores recibidos se devuelven como etiquetas declarativas, no como filtros efectivos sobre el conjunto de datos.
- La función calcula promedios/distribuciones de notas, no un resumen de evaluaciones y actividades programadas por sección y período dentro de la planificación horaria.
- Por ello, su existencia y su ruta no acreditan los requisitos de analítica de planificación de TAREA-F7-IMP-12.

### 3.3 Ocupación y calidad de planificación

- getPlanningQualityAndOccupancyReport (líneas 3525-3596) destructura anoLectivo, pero no usa ese valor para filtrar HorariosClase ni SedesAulas.
- activeHorarios excluye únicamente filas cuyo r[7] sea Inactivo. Las filas Borrador y Cancelado permanecen en el conjunto usado para totalBloques y para sumar horas de ocupación. Cancelado se cuenta además en totalCancelados, pero no se excluye del cómputo de ocupación.
- El denominador global se fija en número de aulas activas multiplicado por 40 horas. No deriva la disponibilidad efectiva de cada aula/laboratorio, jornada, período, día ni intervalo de apertura.
- Las horas ocupadas se suman por duración de cada bloque; no se calcula la unión de intervalos ni se evita el doble conteo de bloques solapados. El porcentaje por aula se limita a 100, mientras el total global no representa necesariamente la ocupación real disponible.
- El reporte no detecta huecos horarios, conflictos pendientes, asignaciones que requieren revisión, franjas de alta/baja utilización ni ocupación diferenciada por jornada/sede/recursos con disponibilidad real.
- No agrega evaluaciones ni actividades programadas por sección/período. El resultado se limita a indicadores globales y una lista de aulas con bloques, horas y porcentaje.
- El CSV se genera exclusivamente desde aulaOccupancyMap. No exporta carga docente, conflictos, filtros aplicados, resúmenes de actividades/evaluaciones ni todos los indicadores ejecutivos requeridos.

### 3.4 Autorización y ámbito de datos

- ROLE_PERMISSIONS (líneas 168-263): getPlanningQualityAndOccupancyReport y getCurricularAnalyticsReport figuran para Director (además de Administrador por permiso comodín), pero no para Profesor. El controlador de reporte se encuentra en js/teacher.js, por lo que el rol docente no puede ejecutar el endpoint de calidad mediante el permiso estático actual.
- Profesor sí tiene permiso para getTeacherTeachingLoad y getTeachingHoursSummary. validateRolePermission (líneas 524-583) verifica token y permiso por rol y llama validateContextualAccess; esta última no limita docenteUserId para Profesor.
- getTeachingHoursSummary acepta docenteUserId opcional; cuando se omite, no aplica filtro por docente y devuelve sesiones de todos los docentes. getTeacherTeachingLoad permite consultar el identificador indicado en el payload. No se comprueba que el usuario autenticado sea titular de ese docenteUserId ni que tenga delegación/ámbito explícito para consultarlo.
- Por tanto, la autorización por rol no satisface el requisito de limitar datos al ámbito permitido. Se requiere una comprobación contextual explícita y pruebas negativas para consultas cruzadas.
- No se concluye que todo el servicio carezca de autenticación: doPost sí invoca validateRolePermission y exige token. El defecto acreditado es la insuficiencia del alcance contextual y la discrepancia de permisos para el reporte.

### 3.5 Interfaz y exportación

- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746; openPlanningQualityReportModal (líneas 1079-1139) existe una sola vez. Llama getPlanningQualityAndOccupancyReport y busca modal-planning-quality-report, tbl-planning-quality-body, qual-metric-* y btn-export-planning-quality-csv.
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71 tiene 1.475 líneas y no contiene modal-planning-quality-report, tbl-planning-quality-body, btn-open-planning-quality-report ni btn-export-planning-quality-csv. El controlador retorna si no encuentra tbody. No hay control HTML que invoque openPlanningQualityReportModal.
- El controlador implementa una descarga CSV si encuentra el botón y recibe csvData, pero en el HTML servido no existe el modal ni el botón; el flujo no es alcanzable desde la interfaz actual.
- Aun conectado, el CSV solo incluye la ocupación de aulas calculada por el backend y no un conjunto completo de reportes ejecutivos, filtros, carga docente, conflictos y actividades/evaluaciones.

### 3.6 Pruebas y cobertura

- runAcademicPlanningRegressionSuite (líneas 14108-14173) contiene TC-F7-01..07. TC-F7-02 invoca getTeacherTeachingLoad, pero solo verifica que el resultado sea un objeto; no comprueba totales, período, límite, estados ni identidad del docente.
- La suite no invoca getTeachingHoursSummary, getCurricularAnalyticsReport ni getPlanningQualityAndOccupancyReport. No contiene pruebas específicas de CA-F7-75..80.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 no contiene cobertura identificada para TAREA-F7-IMP-12/CA-F7-75..80.
- No se ejecutaron Apps Script runtime, HTTP/OAuth, navegador/DOM real, hojas productivas ni suite Node. Los resultados son de inspección estática manual y verificación Git.

## 4. Resultado por criterio de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-75 | NO CUMPLE | getTeacherTeachingLoad ignora anoId y suma Borrador/Cancelado; getTeachingHoursSummary cuenta sesiones, no carga planificada por períodos. |
| CA-F7-76 | NO CUMPLE | Cancelado se cuenta por separado, pero permanece dentro de activeHorarios y suma ocupación/totalBloques; no hay definición coherente por indicador. |
| CA-F7-77 | NO CUMPLE | Denominador fijo de 40 h por aula; no hay disponibilidad efectiva ni unión de intervalos/prevención de solapamientos. |
| CA-F7-78 | NO CUMPLE | anoLectivo no filtra; getCurricularAnalyticsReport solo refleja filtros como etiquetas; no hay filtros combinados de sede/jornada/grado/sección/docente/aula/período. |
| CA-F7-79 | NO CUMPLE | Reporte de calidad no está permitido a Profesor; los endpoints de carga aceptan docenteUserId sin restricción contextual suficiente. |
| CA-F7-80 | NO CUMPLE | HTML carece del modal/nodos/botón; exportación solo cubre aulas y no un reporte completo con resultados/filtros coherentes. |

## 5. Hallazgo nuevo

- **AUD-NG-247 (ALTO/P1):** reportes de carga docente, ocupación y calidad de planificación incompletos, con filtros/estados incorrectos, cálculo de ocupación basado en capacidad fija y controles de ámbito insuficientes; el controlador de reporte no está conectado al HTML servido.
- **Relaciones:** AUD-NG-001 (identidad/ámbito), AUD-NG-244 (versiones/planificación), AUD-NG-245 (notificaciones/estado de cambios) y AUD-NG-246 (sincronización de portales). La relación indica impacto funcional, no duplicación de hallazgos previos.

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

**TASK-590 - Consolidar carga docente planificada y ejecutada por período**
- Hallazgo: AUD-NG-247, secciones 3.1 y 3.2. Severidad: ALTO/P1.
- Objetivo: calcular carga por docente, día, semana, período y año lectivo; diferenciar carga planificada de sesiones realmente impartidas.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- Dependencias: TASK-591, TASK-594.
- Aceptación: anoId/período y fechas filtran realmente; los totales coinciden con asignaciones válidas del período; los límites personalizados se comparan con la carga vigente; sesiones canceladas/reprogramadas no se confunden con bloques programados; se muestran distribuciones diaria/semanal/período/anual.

**TASK-591 - Normalizar estados y separar planificación vigente, borradores y cancelaciones**
- Hallazgo: AUD-NG-247, secciones 3.1 y 3.3. Severidad: ALTO/P1.
- Objetivo: definir estados canónicos y reglas por indicador para Activo/Publicado, Borrador, Cancelado e Inactivo; mantener histórico separado.
- Archivos: backend/academic-service/Code.gs; esquema/contrato HorariosClase; js/teacher.js.
- Dependencias: TASK-585 (contrato HorariosClase).
- Aceptación: cada indicador documenta estados incluidos/excluidos; cancelados no consumen ocupación vigente; borradores aparecen como pendientes de publicación, no como carga oficial; datos históricos no se mezclan con planificación actual; las filas heredadas se normalizan sin pérdida.

**TASK-592 - Calcular ocupación de aulas y recursos mediante intervalos efectivos**
- Hallazgo: AUD-NG-247, sección 3.3. Severidad: ALTO/P1.
- Objetivo: calcular capacidad disponible y ocupación real por aula/recurso, jornada, día y período, usando intervalos efectivos y sin doble conteo.
- Archivos: backend/academic-service/Code.gs; fuentes de disponibilidad de SedesAulas/recursos; pruebas de planificación.
- Dependencias: TASK-591.
- Aceptación: denominador proviene de disponibilidad configurada; intervalos solapados se cuentan una sola vez; se excluyen cancelados/inactivos y borradores de ocupación vigente; se identifican franjas de alta/baja utilización; casos límite de intervalos se prueban.

**TASK-593 - Aplicar filtros combinados y métricas de calidad por ámbito académico**
- Hallazgo: AUD-NG-247, secciones 3.2 y 3.3. Severidad: ALTO/P1.
- Objetivo: aplicar filtros de sede, jornada, grado, sección, docente, aula/recurso, asignatura y período según el tipo de reporte; integrar conflictos pendientes, asignaciones por revisar y actividades/evaluaciones programadas.
- Archivos: backend/academic-service/Code.gs; teacher-dashboard.html; js/teacher.js.
- Dependencias: TASK-590, TASK-591, TASK-592.
- Aceptación: cada filtro modifica el conjunto de datos y sus totales; combinaciones producen intersecciones coherentes; reportes de sección/período incluyen actividades y evaluaciones programadas; conflictos y asignaciones que requieren revisión se identifican; se muestra fecha/hora de actualización cuando corresponde.

**TASK-594 - Restringir carga y analítica docente mediante autorización contextual**
- Hallazgo: AUD-NG-247, sección 3.4. Severidad: ALTO/P1.
- Objetivo: limitar cada consulta al ámbito derivado de la identidad verificada, el rol, las asignaciones y delegaciones activas.
- Archivos: backend/academic-service/Code.gs; backend/user-service/Code.gs si la fuente de delegaciones lo requiere; js/api.js.
- Dependencias: TASK-567 ampliada; TASK-590.
- Aceptación: Profesor solo consulta su propia carga salvo delegación explícita; getTeachingHoursSummary sin docenteUserId no devuelve todos los docentes a un Profesor; Director/Administrador consultan ámbitos amplios conforme a política; el endpoint de calidad tiene permisos consistentes con el portal; llamadas cruzadas se rechazan y quedan auditadas.

**TASK-595 - Conectar el reporte ejecutivo completo en el portal docente**
- Hallazgo: AUD-NG-247, sección 3.5. Severidad: ALTO/P1.
- Objetivo: integrar modal, filtros, indicadores, tabla de ocupación, carga docente, conflictos, actividades y estados de carga/vacío/error; conectar el controlador con controles HTML reales.
- Archivos: teacher-dashboard.html; js/teacher.js; backend/academic-service/Code.gs.
- Dependencias: TASK-590..TASK-594.
- Aceptación: todos los IDs usados por el controlador existen; existe un invocador visible autorizado; filtros visibles se transmiten al backend; la interfaz diferencia error/vacío; fecha de actualización se muestra; la vista coincide con el contrato de respuesta.

**TASK-596 - Crear regresión funcional y verificar exportaciones CA-F7-75..80**
- Hallazgo: AUD-NG-247. Severidad: ALTO/P1.
- Objetivo: cubrir cálculos, estados, intervalos, filtros, autorización, UI y exportación en un entorno aislado.
- Archivos: tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js; backend/academic-service/Code.gs (suite aislada de planificación).
- Dependencias: TASK-590..TASK-595.
- Aceptación: pruebas positivas/negativas por cada criterio; se prueban límites horarios, solapamientos, cambios de período, borradores/cancelados, consultas cruzadas y roles; exportación CSV/formatos admitidos coincide con filtros, filas, métricas y valores de pantalla; sin acceso a Sheets productivas durante pruebas.

### Relaciones con tareas previas
- TASK-567/AUD-NG-001: reutilizar la línea de trabajo de identidad/token verificado; no duplicar autenticación.
- TASK-585/AUD-NG-246: reutilizar el contrato canónico de HorariosClase; la nueva tarea cubre la semántica de los indicadores.
- TASK-590..TASK-596 quedan documentadas como tareas derivadas en este informe y los registros de auditoría. No se altera Pendientes.md, cuya lectura por blob ya se verificó.

## 7. Pruebas y límites

- **Ejecutadas:** inspección estática manual de completadas.md, Pendientes.md por blob, funciones backend, permisos, dispatcher, controlador UI, HTML servido, registro ChangesLogs y suite de regresión; verificación de rama/HEAD/árbol.
- **No ejecutadas:** Apps Script runtime; llamadas HTTP/OAuth con tokens; DOM/navegador real; cálculos con datos de Sheets productivas; concurrencia; exportaciones descargadas; suite Node; pruebas E2E.
- **No se modificó:** código, UI, pruebas, datos productivos, completadas.md, Pendientes.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md ni rama base.

## 8. Archivos y respaldos

- **Nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-12.md.
- **Actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin cambios, SHAs de respaldo:** backend/academic-service/Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; tests/regression/academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; METODOLOGIA_DESARROLLO.md cf796728bb384a32537392df2f9c72a339fa03ee.
- **No se alteró** la rama base NG_beta_0.0.0.1 ni los archivos de código/UI.

## 9. Continuidad

Siguiente tarea: **TAREA-F7-IMP-13**, incorporar importación, exportación y validación masiva de horarios; CA-F7-81..86. Verificar primero la marca de completada, el informe individual y el documento de origen; después auditar backend, UI, validación CSV/JSON, previsualización, atomicidad, duplicados, permisos y pruebas.
