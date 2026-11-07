# AUDITORÍA TÉCNICA - TAREA-F5-019: herramientas de seguimiento operativo y análisis de admisiones

- Repositorio: i-miss-cocaine/IMA
- Rama auditada: NG_beta_0.0.0.1_work
- Rama base protegida: NG_beta_0.0.0.1
- Checkpoint válido de inicio: C1.215; HEAD 3d9b1fefc3f78630cea73272bad04ab4a392502a; árbol cea8bd314a917eec982b2b264e7ff315049423b4.
- HEAD de la rama base verificado: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Divergencia previa: 283 commits adelante y 0 detrás.
- Checkpoint de cierre preparado: C1.216.
- Sesión operativa: IMA-AUDIT-20261107-1844Z (identificador operativo, no ID nativo de ChatGPT).
- Fecha: 2026-11-07.
- Dictamen técnico: **NO CUMPLE**.

## 1. Continuidad, fuentes y antecedentes

El checkpoint C1.215 identifica como siguiente elemento TAREA-F5-019. La rama de trabajo está en el commit 3d9b1fefc3f78630cea73272bad04ab4a392502a, cuyo mensaje cierra F5-018/C1.215. La rama base NG_beta_0.0.0.1 permanece en 44d9891132332e692dbe2ba8602b41f50a508a59; la comparación GitHub confirma 283 commits adelante y 0 detrás.

El árbol recursivo de NG_beta_0.0.0.1_work no contiene AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-019.md. La consulta del historial de commits de esa ruta devuelve una lista vacía. Se crea este informe desde cero; no se asume cumplimiento por los comentarios identificativos de implementación.

**Requisitos administrativos:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2414-2437. La tarea está marcada [X] Completada y contiene siete requisitos funcionales y cinco criterios [x]. La marca administrativa no constituye evidencia de cumplimiento.

**Registro de cambios declarado:** ChangesLogs.txt, SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1925-1932. Declara el endpoint getAdmissionAnalyticsReport, permisos para Dirección/Administrador, un modal con indicadores/embudo/motivos y controladores para cargar y exportar CSV. La inspección confirma la existencia de esos elementos, pero identifica fallos funcionales, de autenticación, cálculo, filtrado, salida segura y cobertura.

**Origen citado por la tarea:** Auditoria.txt / HALLAZGOS F5-P3-01 y AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md, Subcapacidad 5.15. El informe de fase citado no aparece en el árbol actual; tampoco se localizó el marcador literal HALLAZGOS-F5-P3-01 en Auditoria.txt. La redacción original del hallazgo de fase no puede verificarse con las fuentes disponibles. Se auditan los siete requisitos y cinco criterios preservados en completadas.md.

**Pendientes.md:** la lectura convencional de la ruta devuelve 0 caracteres; se recuperó el blob de la misma rama identificado por SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.782.094 caracteres, 20.182 líneas y cero caracteres U+FFFD. La consulta histórica no encuentra una entrada directa F5-019. Se identifican referencias preexistentes para no duplicar trabajo: AUD-NG-001 (propagación del token), TASK-237 (exportación estructurada y anti-inyección CSV), AUD-NG-145 (PII/sanitización), AUD-NG-161 (pruebas conductuales). AUD-NG-235 ya está documentado en Auditoria.txt para XSS en flujos de admisión y se amplía por referencia. El blob no se modifica.

## 2. Evidencia técnica y respaldos

| Archivo | SHA | Secciones/rangos inspeccionados |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | TAREA-F5-019, líneas 2414-2437; siete requisitos/cinco criterios. |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Declaración F5-019, líneas 1925-1932. |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | getOrCreateSheet (84+); esquema SolicitudesAdmision (119); PUBLIC_ACTIONS (265); ROLE_PERMISSIONS (168+); validateRolePermission (524+); doPost/dispatcher (671+, 859); createAdmissionRequest (984-1110); getAdmissionRequests (1113-1159); updateAdmissionStatus (1928+); getAdmissionAnalyticsReport (11693-11817). |
| dashboard-direccion.html | fefaa3bf7884288aef563cfb8aaf244e6cea8b7c | Botón de analítica (36); modal/filtros/métricas/embudo/rechazos (82-171); carga de teacher.js y enlace del botón (173+). |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 | Controladores globales openAdmissionAnalyticsModal/loadAdmissionAnalyticsData/exportAdmissionAnalyticsCSV (5-115). |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi (11-181), construcción del payload (46-57), POST JSON. |
| js/auth.js | 8444dd085a3186106d2db7005b61ef934d3c22d8 | login handler y persistencia currentUser (aprox. 146-159). |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | Archivo completo (412 líneas); no contiene F5-019 ni referencias a getAdmissionAnalyticsReport. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo (61 líneas); no contiene F5-019 ni referencias a getAdmissionAnalyticsReport. |
| AUDITORIAS/Auditoria.txt | 89a7cac672db290fd0f55d8f82e6d35965d3f2aa | Hallazgos de admisión, AUD-NG-001, AUD-NG-235 y registros previos. |
| AUDITORIAS/MapaDependencias.md | 2fca5144d371b201dc1e638b9603317dc8644979 | Mapa de auth/fetchApi, exportación, admisiones y renderizado DOM. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 2e1689a8eb3d7c4f5a8b4d1fe54e52dbc20f7d9c | Último registro C1.215; se agrega C1.216. |
| AUDITORIAS/Contexto_personal.txt | 88d777a4231277ab86695e96ec367725ac50ca21 | Reglas prioritarias y checkpoint C1.215; se agrega C1.216. |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Auditoría manual, respaldo SHA, tareas derivadas en el informe, prohibición de modificar código, commit único y checkpoint. |

## 3. Matriz de requisitos

| Requisito | Resultado | Evaluación |
|---|---|---|
| Panel de métricas en Dirección | **PARCIAL** | Existen botón, modal, tarjetas, desglose de estados, embudo y muestra de rechazos. La consulta no funciona desde la interfaz mientras no se resuelva la propagación de token; además, dos métricas principales son incorrectas. |
| Métricas exactas, tasa de conversión, tiempo promedio y embudo por grado/nivel | **NO CUMPLE** | La tasa usa total de solicitudes como denominador; el esquema predeterminado no contiene fecha de decisión/actualización; el embudo solo agrupa por grado y no incluye nivel. |
| Filtros por año, periodo, nivel y departamento | **NO CUMPLE** | El modal solo permite seleccionar 2025/2026. El backend solo recibe anolectivo; no aplica filtros por periodo, nivel, departamento ni grado. |
| Detección de embotellamientos por documentos/citas | **NO CUMPLE** | Cuenta solicitudes Recibida/En_Revision con más de siete días desde la recepción, sin consultar última actividad, documentos pendientes o citas. |
| Motivos de rechazo y abandono | **PARCIAL** | Muestra hasta diez registros Rechazada, toma Observaciones genéricas y no analiza Retirada/abandono ni agrupa motivos. |
| Exportación CSV/PDF | **NO CUMPLE** | Solo existe descarga CSV; no hay generación PDF. El CSV no escapa comillas ni neutraliza prefijos de fórmula. |
| Consulta sin modificar estados/datos | **PARCIAL** | El cálculo no escribe en filas de solicitudes, pero usa getOrCreateSheet, que inserta la hoja y encabezados si falta la tabla. No se ejecutaron pruebas productivas. |
| Criterio: métricas exactas desde SolicitudesAdmision | **NO CUMPLE** | El conteo general y estados se leen de la hoja, pero conversión, tiempo, embotellamientos y motivos no representan con precisión lo requerido. |
| Criterio: filtrar año lectivo y grado | **NO CUMPLE** | Hay selector de año; grado solo se agrupa en el embudo, no existe filtro por grado. |
| Criterio: tiempo y conversión precisos | **NO CUMPLE** | Denominador de conversión incorrecto y ausencia de fecha de decisión/actualización en el esquema base. |
| Criterio: exportación sanitizada sin secretos | **PARCIAL** | El CSV no incluye columnas de credenciales, pero los valores de grado no se neutralizan contra CSV Injection ni se escapan correctamente. |
| Criterio: no degradar operaciones ordinarias | **NO VERIFICADO** | La función carga y recorre todas las filas en cada solicitud; no hay paginación, caché, límites ni prueba de carga que acredite el criterio. |

## 4. Hallazgos técnicos

### H1 - ALTO/P1: la consulta de analítica llega sin token y el servidor rechaza la llamada

En js/auth.js (aprox. 146-159), el objeto currentUser persistido contiene userId, nombre, email, rol y datos de perfil, pero no copia el sessionToken devuelto por loginUser. En js/api.js, fetchApi (11-181) enriquece el payload con requesterUserId/requesterRole, pero no transmite sessionToken, authToken ni token. El controlador de teacher.js (18) llama fetchApi("ACADEMIC", "getAdmissionAnalyticsReport", { anolectivo: targetAno }) y no agrega credencial alguna. No se encontró una redefinición de fetchApi en los scripts cargados por dashboard-direccion.html.

El endpoint no pertenece a PUBLIC_ACTIONS (ACADEMIC:265). validateRolePermission (524+) exige token y devuelve no autorizado cuando no existe. El endpoint sí está enrutado por doPost (859) y concedido estáticamente a Director; Administrador tiene wildcard. Por tanto, el control del servidor existe, pero la llamada real del panel no puede superar la autenticación y es rechazada antes de ejecutar getAdmissionAnalyticsReport.

**Impacto:** la función analítica no está operativa desde su interfaz en el flujo actual. Este caso es una manifestación adicional del defecto transversal AUD-NG-001; no crear un hallazgo global duplicado.

### H2 - ALTO/P1: tasa de conversión calculada con denominador incorrecto

getAdmissionAnalyticsReport (11693-11817) calcula tasaConversionPct como totalConvertidos / totalSolicitudes. El requisito define la tasa como la proporción de admitidos que completan matrícula, no la proporción de todas las solicitudes. Las solicitudes rechazadas, retiradas, recibidas o aún en revisión no deben formar parte del denominador de conversión de admitidos.

Además, Admitida y Convertida son estados mutuamente excluyentes en el desglose actual. Para calcular una cohorte consistente se debe contar el total de decisiones de admisión (Admitida + Convertida) o reconstruir el conjunto de admitidos desde un historial de transiciones inmutable. Dividir solo entre Admitida actual también excluiría a los ya convertidos.

**Impacto:** el porcentaje mostrado no representa la tasa solicitada y puede subestimar o distorsionar el rendimiento real de matrícula.

### H3 - ALTO/P1: el promedio de tramitación no tiene una fecha de decisión disponible en el esquema predeterminado

El esquema creado para SolicitudesAdmision (ACADEMIC:119) contiene SolicitudID, FechaSolicitud, AnoLectivo, GradoSolicitado, datos del aspirante, EstadoSolicitud, CanalIngreso, Observaciones y ExpedienteID. No contiene FechaActualizacion, FechaModificacion ni FechaDecision. createAdmissionRequest (984-1110) escribe esos quince campos. updateAdmissionStatus (1928+) modifica EstadoSolicitud y Observaciones, pero no registra una fecha de decisión ni una fecha de última actividad en la fila.

getAdmissionAnalyticsReport busca fechaactualizacion o fechamodificacion; si no encuentra encabezado, idxFechaMod queda en -1. En el esquema predeterminado, fMod nunca obtiene valor y atencionCount permanece en cero; el resultado de tiempoPromedioAtencionDias es 0. Incluso si se agregara una fecha genérica de actualización, esta no demostraría por sí sola la fecha de decisión final requerida.

**Impacto:** el promedio no es calculable con el esquema y flujo de escritura actuales; el panel puede presentar 0 días como si fuera un dato válido.

### H4 - ALTO/P1: filtros declarados incompletos y embudo sin dimensión de nivel

El modal (dashboard-direccion.html:82-171) contiene únicamente un select de año lectivo con opciones fijas 2025 y 2026. loadAdmissionAnalyticsData solo envía anolectivo. getAdmissionAnalyticsReport solo desestructura anolectivo; no acepta ni aplica periodo, nivel, departamento o grado. El grado se utiliza como clave de agrupación, no como filtro. El embudo no contiene dimensión de nivel académico.

**Impacto:** no se cumple el filtrado solicitado en la descripción ni el criterio que exige seleccionar dinámicamente año y grado. Las opciones de año quedan obsoletas cuando se incorporen nuevos periodos lectivos.

### H5 - ALTO/P1: el contador de solicitudes estancadas no identifica embotellamientos operativos

El backend incrementa solicitudesEstancadas cuando el estado es Recibida o En_Revision y han transcurrido más de siete días desde FechaSolicitud. No consulta DocumentosEstudiante, EntrevistasAdmision, citas pendientes, última actualización ni historial de transición. Una solicitud trabajada ayer puede contarse como estancada por su antigüedad; una solicitud con documentación o entrevista bloqueada en otro estado puede no contarse.

La descripción exige identificar solicitudes estancadas por falta de documentos o citas de evaluación. El cálculo actual mide edad de la solicitud, no bloqueo operativo ni inactividad desde la última acción.

**Impacto:** el indicador puede generar falsos positivos y omitir cuellos de botella reales, por lo que no permite priorizar acciones operativas fiables.

### H6 - ALTO/P1: datos persistidos de aspirantes se interpolan en innerHTML sin escape contextual

teacher.js (60-90) construye el embudo y la muestra de rechazos mediante cadenas HTML e inserta g.grado, m.nombreAspirante, m.solicitudId y m.motivo en innerHTML. Esos valores proceden de SolicitudesAdmision. createAdmissionRequest (984-1110) admite nombres y grado desde el payload público; Observaciones también puede contener texto enviado o registrado durante el flujo de admisión. El backend devuelve los valores sin codificación contextual.

Un aspirante puede controlar al menos nombres y grado de la solicitud. Si un valor persistido contiene marcado, se inserta en el DOM del panel de Dirección cuando se carga la analítica. No se ejecutó prueba XSS en navegador; el flujo de interpolación insegura sí está demostrado estáticamente.

**Impacto:** riesgo de XSS almacenado en una interfaz administrativa privilegiada. Ampliar AUD-NG-235, que ya documenta renderizado inseguro en flujos de admisión, y AUD-NG-145 para minimización/redacción de datos.

### H7 - MEDIO/P2: la muestra de rechazo usa Observaciones genéricas y expone datos identificativos innecesarios

El índice de motivo se resuelve buscando primero el encabezado observaciones y solo después motivorechazo. El esquema predeterminado contiene Observaciones, por lo que la función siempre selecciona esa columna aunque exista una columna específica de motivo en otro esquema. updateAdmissionStatus agrega justificaciones y texto de transición a Observaciones, pero no define un campo estructurado exclusivo para motivo de rechazo. El backend devuelve nombre completo, solicitudId y texto de observaciones para hasta diez rechazos.

La tarea también exige analizar abandono; la función solo recopila estado Rechazada y no incluye Retirada ni agrupa razones. La exposición de nombre e ID puede ser mayor que la necesaria para un resumen ejecutivo.

**Impacto:** motivos no necesariamente atribuibles al rechazo, análisis de abandono incompleto y tratamiento de PII no minimizado.

### H8 - ALTO/P1: exportación CSV incompleta y susceptible a CSV Injection

El único botón de exportación del modal descarga CSV. No existe opción PDF ni generación de informe imprimible. El backend construye el CSV concatenando directamente g.grado entre comillas dobles; no duplica comillas internas, no neutraliza saltos de línea ni prefijos =, +, - o @. GradoSolicitado se origina en el payload de creación de solicitudes, por lo que no debe tratarse como dato confiable al exportar.

El BOM UTF-8 mejora compatibilidad, pero no neutraliza fórmulas. La tarea universal TASK-237 ya exige CSV/XLSX con protección anti-inyección y preservación de filtros; se amplía por referencia, sin crear un ID global paralelo.

**Impacto:** archivos CSV pueden contener valores interpretables como fórmulas al abrirse en hojas de cálculo; además, falta el formato PDF expresamente requerido por F5-019.

### H9 - MEDIO/P2: lectura completa no acotada y posible efecto lateral de inicialización

getAdmissionAnalyticsReport ejecuta getDataRange().getValues() sobre toda SolicitudesAdmision y procesa todas las filas en memoria en cada apertura/cambio de año. No aplica paginación, límites, agregación previa ni caché; tampoco mide duración. No hay prueba de carga que demuestre ausencia de impacto sobre operaciones ordinarias.

La consulta usa getOrCreateSheet (84+), que inserta una hoja y escribe encabezados si SolicitudesAdmision no existe. Aunque no actualiza las filas existentes, una consulta analítica puede mutar la estructura del Spreadsheet ante una configuración incompleta, en vez de fallar de forma explícita.

**Impacto:** el criterio de rendimiento no está demostrado y el endpoint no es estrictamente de solo lectura ante ausencia de la hoja.

### H10 - ALTO/P1: no existe cobertura de regresión específica para F5-019

Los dos archivos de tests/regression presentes en el árbol son academic-grading-suite.js y modular-dashboard-suite.js. Ninguno contiene F5-019, getAdmissionAnalyticsReport, métricas de admisión, filtros, CSV, PDF ni casos de autenticación de este panel. No se encontró suite dedicada de admisiones.

**Impacto:** no hay pruebas que detecten la llamada sin token, el denominador incorrecto, el promedio en cero, los filtros ausentes, la clasificación de estancadas, la inyección DOM/CSV o la ausencia de PDF. Ampliar AUD-NG-161; no crear un hallazgo global paralelo de pruebas.

## 5. Dictamen

**TAREA-F5-019 NO CUMPLE.**

El panel y los controladores existen, y el endpoint tiene enrutamiento y permisos de servidor. Sin embargo, el flujo de interfaz no envía token y el servidor rechaza la consulta; la tasa de conversión y el tiempo promedio no cumplen sus definiciones; faltan filtros y dimensiones; el contador de estancamiento no detecta las causas requeridas; los motivos de rechazo se extraen de una columna genérica; el renderizado permite interpolación de datos persistidos sin escape; la exportación carece de PDF y no neutraliza CSV Injection; y no hay pruebas específicas ni evidencia de rendimiento.

No se modificó código, configuración ni pruebas durante la auditoría.

## 6. Pruebas ejecutadas y limitaciones

**Ejecutadas:**
- Inspección manual del alcance F5-019 en completadas.md y ChangesLogs.txt.
- Verificación del árbol e historial de la ruta del informe individual.
- Inspección de ROLE_PERMISSIONS, PUBLIC_ACTIONS, validateRolePermission, doPost y dispatcher del endpoint.
- Inspección del flujo login -> currentUser -> fetchApi -> endpoint ACADEMIC.
- Inspección de esquema de SolicitudesAdmision, createAdmissionRequest, getAdmissionRequests y updateAdmissionStatus.
- Inspección de getAdmissionAnalyticsReport, modal, filtros, controladores y exportación.
- Inspección de los dos archivos bajo tests/regression.
- Revisión de dependencias y reconciliación con AUD-NG-001, TASK-237, AUD-NG-145, AUD-NG-161 y AUD-NG-235.
- Verificación de SHA de respaldo de cada archivo inspeccionado, HEAD de rama de trabajo/base y divergencia Git.
- Recuperación íntegra del blob histórico Pendientes.md: 1.782.094 caracteres, 20.182 líneas, cero U+FFFD.

**No ejecutadas:**
- No se invocó Apps Script ni el endpoint HTTP en un despliegue.
- No se consultó Spreadsheet productivo ni se verificaron volúmenes reales.
- No se ejecutó prueba de carga ni benchmark.
- No se ejecutó navegador, payload XSS ni apertura real de CSV con Excel/LibreOffice.
- No se generó PDF porque no existe controlador/función de exportación PDF en el panel inspeccionado.
- No se ejecutaron suites automatizadas; no hay casos F5-019 en los dos archivos existentes.
- No se verificaron permisos dinámicos productivos de MatrizPermisosRoles ni datos reales de rechazo/abandono.

## 7. Tareas ejecutables derivadas de los hallazgos

Las siguientes tareas son locales a TAREA-F5-019. Las causas transversales existentes se amplían por referencia; no se crean IDs globales duplicados. Todas quedan Pendientes.

### F5-019-A01 - Restablecer autenticación del panel de analítica de admisiones

- **Hallazgos de origen:** H1.
- **Severidad:** Alto.
- **Objetivo:** permitir que el controlador de analítica ejecute la consulta bajo una sesión autenticada y un rol autorizado.
- **Acción ejecutable:** integrar la propagación de token conforme al contrato de sesión; conservar la credencial devuelta por loginUser y transmitirla desde fetchApi sin permitir que el payload suplante la identidad; verificar que getAdmissionAnalyticsReport reciba claims válidos.
- **Archivos/módulos afectados:** js/auth.js, js/api.js, js/teacher.js, backend/academic-service/Code.gs.
- **Dependencias y riesgos:** ampliar AUD-NG-001; mantener validateRolePermission y la lista no pública del endpoint; no abrir la acción para evitar el fallo de token.
- **Alcance:** resolver la integración común del token y comprobar específicamente el panel F5-019; no debilitar RBAC ni confiar en requesterRole/requesterUserId aportados por cliente.
- **Criterios de aceptación:** login conserva sessionToken; fetchApi lo transmite a la llamada ACADEMIC; llamada válida de Director/Administrador ejecuta el reporte; llamada sin token, token vencido y rol no autorizado son rechazados; el endpoint sigue fuera de PUBLIC_ACTIONS.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-019-A02 - Corregir la definición y el cálculo de métricas de conversión y tramitación

- **Hallazgos de origen:** H2 y H3.
- **Severidad:** Alto.
- **Objetivo:** producir indicadores reproducibles que correspondan a las definiciones de negocio.
- **Acción ejecutable:** calcular conversión sobre la cohorte admitida (Admitida + Convertida o historial de decisiones); incorporar fecha de decisión y última actividad mediante un esquema versionado y escritores coherentes; calcular tiempo desde recepción hasta decisión final con fechas válidas; diferenciar cero real de métrica no calculable.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; esquema SolicitudesAdmision; updateAdmissionStatus; getAdmissionAnalyticsReport; dashboard-direccion.html; js/teacher.js.
- **Dependencias y riesgos:** historial de transiciones de admisión; AUD-NG-145 para trazabilidad de cambios; compatibilidad con solicitudes históricas sin timestamp.
- **Alcance:** no inferir fecha de decisión desde cualquier modificación; no presentar 0 cuando faltan fechas; conservar solicitudes antiguas y documentar la política de datos incompletos.
- **Criterios de aceptación:** fixtures con admitidas, convertidas, rechazadas, retiradas y pendientes producen tasas correctas; los casos sin fecha final quedan excluidos o identificados como no calculables; fechas de decisión coinciden con transición final; promedio se valida con casos conocidos y zona horaria definida.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-019-A03 - Implementar filtros y detección real de embotellamientos operativos

- **Hallazgos de origen:** H4 y H5.
- **Severidad:** Alto.
- **Objetivo:** permitir análisis por las dimensiones solicitadas y detectar causas reales de retraso.
- **Acción ejecutable:** implementar filtros por año, periodo, nivel, departamento y grado; agregar dimensión de nivel al embudo; medir inactividad desde la última transición/actividad; consultar documentos pendientes/rechazados y entrevistas/citas pendientes; distinguir solicitudes rechazadas y retiradas/abandonadas.
- **Archivos/módulos afectados:** dashboard-direccion.html, js/teacher.js, backend/academic-service/Code.gs, DocumentosEstudiante, EntrevistasAdmision y fuentes de catálogo académico.
- **Dependencias y riesgos:** contratos de getAdmissionRequests, getStudentDocuments y getAdmissionInterviews; no exponer datos personales en agregados; normalizar estados y periodos.
- **Alcance:** filtros de servidor deben aplicarse antes de agregar/exportar; no confundir antigüedad total con inactividad; no contar como estancada una solicitud con actividad reciente solo por ser antigua.
- **Criterios de aceptación:** cada filtro cambia el conjunto de datos; grado y nivel aparecen diferenciados; solicitudes con documento/cita pendiente se clasifican por causa; inactividad usa timestamp verificable; el análisis incluye motivos de rechazo y abandono sin duplicar registros.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-019-A04 - Eliminar XSS y minimizar datos personales en el panel de analítica

- **Hallazgos de origen:** H6 y H7.
- **Severidad:** Alto.
- **Objetivo:** impedir que datos de solicitudes se interpreten como marcado y limitar la exposición de PII.
- **Acción ejecutable:** reemplazar interpolación de datos en innerHTML por creación de nodos y textContent o codificación contextual probada; devolver DTO agregado/minimizado; separar motivo estructurado de observaciones generales; limitar identificadores y nombres a los casos autorizados que realmente los requieran.
- **Archivos/módulos afectados:** js/teacher.js, backend/academic-service/Code.gs, dashboard-direccion.html.
- **Dependencias y riesgos:** ampliar AUD-NG-235 para XSS en flujos de admisión y AUD-NG-145 para PII/minimización; no confiar en sanitización de una sola capa.
- **Alcance:** cubrir grado, nombre, solicitudId, motivo, estado y cualquier campo persistido que llegue al DOM; no introducir HTML enriquecido no sanitizado.
- **Criterios de aceptación:** payloads con etiquetas, atributos, comillas y URLs no ejecutan código; todos los campos se presentan como texto; la respuesta del endpoint no devuelve identificadores/nombres innecesarios; pruebas incluyen datos maliciosos almacenados y datos vacíos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-019-A05 - Completar exportación PDF y proteger la exportación CSV

- **Hallazgos de origen:** H8.
- **Severidad:** Alto.
- **Objetivo:** entregar reportes reutilizables que correspondan a la consulta autorizada y no ejecuten fórmulas inyectadas.
- **Acción ejecutable:** implementar PDF además de CSV; aplicar escape CSV correcto para comillas, delimitadores y saltos de línea; neutralizar prefijos =, +, - y @ en campos de texto; conservar filtros, periodo, agrupaciones y totales; incluir metadatos de generación y permisos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, js/teacher.js, dashboard-direccion.html y servicio reutilizable de exportación.
- **Dependencias y riesgos:** ampliar TASK-237; mantener control de acceso servidor y no exportar datos fuera del ámbito autorizado.
- **Alcance:** no considerar BOM como sanitización; no exportar un dataset distinto del que se muestra; no incluir PII/secrets innecesarios.
- **Criterios de aceptación:** CSV abre sin fórmulas ejecutables en Excel/LibreOffice; comillas y saltos se conservan como texto; PDF refleja los filtros y totales; CSV/PDF contienen mismos agregados visibles; llamada directa sin permiso es rechazada.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-019-A06 - Acotar el coste de consulta y mantener la analítica sin efectos laterales

- **Hallazgos de origen:** H9.
- **Severidad:** Medio.
- **Objetivo:** evitar lecturas completas innecesarias y garantizar que una consulta no inicialice ni modifique recursos de negocio.
- **Acción ejecutable:** evitar getOrCreateSheet en lectura analítica; comprobar existencia/esquema y devolver error controlado si falta la tabla; definir límites/consulta agregada eficiente; instrumentar duración, volumen y tiempo de ejecución; validar el coste bajo volúmenes representativos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; SolicitudesAdmision; getAdmissionAnalyticsReport.
- **Dependencias y riesgos:** integración con filtros; no cachear datos que deban reflejar cambios recientes sin política de invalidación; coordinar optimización con TAREA-F5-020.
- **Alcance:** no alterar estados, filas, expedientes ni crear hojas al consultar; no afirmar rendimiento sin medición.
- **Criterios de aceptación:** fuente ausente produce error controlado sin insertar hojas; consultas no escriben; mediciones cubren volúmenes crecientes y concurrencia; umbrales acordados se cumplen sin bloquear operaciones ordinarias.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-019-A07 - Crear pruebas de regresión conductuales para analítica de admisiones

- **Hallazgos de origen:** H1-H10.
- **Severidad:** Alto.
- **Objetivo:** detectar regresiones de autenticación, métricas, filtros, exportación, DOM y rendimiento.
- **Acción ejecutable:** crear suite dedicada con fixtures aislados; probar tokens/roles, fórmulas de conversión, timestamps ausentes/invalidos, filtros combinados, estancamiento por documentos/citas, abandono, XSS, CSV Injection, PDF, fuente ausente y carga.
- **Archivos/módulos afectados:** tests/regression/ (nueva suite de admisiones); backend/academic-service/Code.gs; js/api.js; js/teacher.js; dashboard-direccion.html.
- **Dependencias y riesgos:** ampliar AUD-NG-161; no utilizar hojas ni datos productivos; pruebas de navegador para DOM/exportación y pruebas de integración para router.
- **Alcance:** cada caso debe ejecutar comportamiento y verificar resultados, no limitarse a includes de texto o presencia de funciones.
- **Criterios de aceptación:** pruebas negativas de token/rol; tasas y promedios con resultados conocidos; filtros por todas las dimensiones; no ejecución XSS/CSV Injection; PDF válido; ausencia de efectos de escritura; medición de rendimiento y reporte de fallos reales.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### Reconciliación de tareas existentes (sin crear IDs globales duplicados)

- AUD-NG-001: ampliar el flujo de token a la llamada de analítica de F5-019; el defecto de login/fetchApi es transversal.
- AUD-NG-235: ampliar XSS almacenado a nombres/grado/motivos que llegan al panel de analítica.
- AUD-NG-145: ampliar minimización de PII, DTO de analítica y tratamiento de datos sensibles.
- TASK-237: integrar el reporte F5-019 al exportador institucional; añadir PDF y neutralización CSV Injection en los campos de grado.
- AUD-NG-161: añadir pruebas conductuales de autenticación, métricas, filtros, exportación y DOM.
- TAREA-F5-020: coordinar la optimización de consultas y paginación; no trasladar a F5-020 los defectos funcionales de cálculo/filtros de F5-019.
- No se crean nuevos IDs globales. F5-019-A01..A07 son tareas locales de este informe.

## 8. Cierre

- Resultado: auditoría TAREA-F5-019 finalizada; dictamen **NO CUMPLE**.
- Hallazgos: H1-H10.
- Tareas locales: F5-019-A01..A07, todas Pendientes; no se implementaron.
- Archivos documentales modificados: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-019.md (nuevo); AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- Archivos no modificados: backend/academic-service/Code.gs; dashboard-direccion.html; js/teacher.js; js/api.js; js/auth.js; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; AUDITORIAS/README.md; rama base.
- Proceso: auditoría/documentación exclusivamente; no se implementó código. Un único commit consolidado contiene los cinco documentos. El SHA del commit de cierre se confirma externamente tras publicar; no se incluye su SHA dentro del propio checkpoint.
- Siguiente tarea exacta: TAREA-F5-020 - optimizar consultas, sincronización y capacidad de respuesta del proceso de admisión. Verificar primero informe individual e historial; después auditar paginación, caché, invalidación, concurrencia, límites/rate limiting y pruebas.
