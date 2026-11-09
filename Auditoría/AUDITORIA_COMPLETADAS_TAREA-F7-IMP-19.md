# AUDITORÍA TÉCNICA - TAREA-F7-IMP-19: Capacidad y distribución de estudiantes por sección

**Fecha:** 2026-11-08
**Repositorio:** i-miss-cocaine/IMA
**Rama auditada:** NG_beta_0.0.0.1_work
**Sesión operativa:** IMA-AUDIT-20261108-1830Z (ID documental, no ID nativo de ChatGPT)
**Checkpoint inicial válido:** C1.250
**HEAD auditado:** 980d7670c58c330dffcc5fa09079f9f6d72aba8b
**Dictamen:** **NO CUMPLE**
**Estado histórico en completadas.md:** [X] (se conserva; no acredita cumplimiento).

## 1. Continuidad, fuentes y alcance

- La rama NG_beta_0.0.0.1_work se verificó en HEAD 980d7670c58c330dffcc5fa09079f9f6d72aba8b, coincidente con C1.250. La rama base NG_beta_0.0.0.1 permanece en 44d9891132332e692dbe2ba8602b41f50a508a59; comparación: 319 commits adelante, 0 detrás.
- TAREA-F7-IMP-19 aparece [X] en completadas.md, líneas 4525-4554. Se contrastaron los diez requisitos funcionales y CA-F7-117..121.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-19.md ni la fuente declarada AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md. La auditoría se realizó directamente desde el bloque completo de completadas.md.
- ChangesLogs.txt (2498-2521) afirma que el reporte de capacidad, botón y modal fueron implementados. El backend y handlers existen parcialmente, pero teacher-dashboard.html completo no contiene botón, modal ni contenedor declarados.
- Pendientes.md devuelve 0 caracteres por lectura convencional. Se conserva como referencia el blob verificado SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.782.094 caracteres, 20.182 líneas, 0 U+FFFD y 511 IDs TASK únicos TASK-001..TASK-511. No contiene IMP-19 ni TASK-616. No se modificó ni restauró.
- Antecedente directo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md (SHA 2d353d7cc700e31af9cf776f6da55b90f5d9e2e5), que ya registró AUD-NG-241, TASK-548 (conteo/capacidad), TASK-549 (ocupación/alternativas), TASK-550 (UI/API) y TASK-551 (regresión). Esas tareas se amplían; no se duplica el alcance.
- Antecedentes transversales: AUD-NG-236 (motor de conflictos), AUD-NG-246 (interfaz desconectada), AUD-NG-001 (token/API), AUD-NG-233/TASK-513 y AUD-NG-234/TASK-514 (validaciones/overrides y concurrencia).

## 2. Plan de inspección y respaldos inmutables

Inspección estática/manual de los contratos de hojas, funciones de capacidad, matrícula y cambio de sección, motor de conflictos, alta/publicación de horarios, permisos, UI, API, registros históricos y pruebas. No se realizaron escrituras ni pruebas contra datos productivos.

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: getOrCreateSheet (84-115); ROLE_PERMISSIONS (168-265); dispatcher (671-830); getAcademicOfferColumnMap/getAcademicOfferValue/isAcademicOfferActive (6061-6129); createAcademicOffer (6180-6223); createClassSchedule (6900-6990); publishClassSchedules (7008-7116); checkScheduleConflict (7493-7691); checkEnrollmentCapacity (11147-11243); createStudentEnrollment (11270-11351); getStudentEnrollments (11353-11377); changeStudentSection (11403-11480); recordStudentTransfer (11819-11885); getSectionCapacityAnalyticsReport (13657-13810); runAcademicPlanningRegressionSuite (14109-14155).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71 (1.475 líneas); js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746 (1434-1495); js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 (11-60); tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 (412 líneas).
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee.
- AUDITORIAS/Auditoria.txt SHA 4ab5653d720aa87b85f3f79d2dffc7bb06170419; MapaDependencias.md SHA a0238a59aa5aa65e4656b93cdb3b5c5301bf3fbe; AUDITORIA_COMPLETADAS_PLAN.md SHA 4b22b7d7f33b9016e81c8eeb0ebdc70c8770e489; Contexto_personal.txt SHA 7a845756a2477dcc69f84db5840b05b54325ac5c.
- Antecedentes IMP-01 SHA 1743620a58cdc813f093bfb14db4651681481591; IMP-04 SHA 657c4657b353728da525b071e803d8b80925ce4d; IMP-06 SHA 2d353d7cc700e31af9cf776f6da55b90f5d9e2e5; IMP-18 SHA 7d78a59b4e645f7d4df820ca1ec0d1a4ca3d2276.

## 3. Hallazgos

### H1 - AUD-NG-241 AMPLIADO / ALTO-P1: el reporte de capacidad lee columnas incompatibles y genera métricas falsas

- getOrCreateSheet define Matriculas como MatriculaID, Fecha, UserId, Alumno, Grado, Seccion, Periodo, Tipo, Estado, BecaDescuento, Observaciones (Code.gs:94). Sin embargo, getSectionCapacityAnalyticsReport (13662-13677) interpreta rM[4] como año, rM[5] como estado, rM[2] como grado y rM[3] como sección. En el contrato real, esos campos son Grado, Seccion, UserId y Alumno; el estado está en [8] y el año/período en [6]. El conteo queda normalmente en cero y no corresponde a matrícula activa por sección/año.
- El mismo reporte no filtra OfertaAcademica por anoId aunque recibe anolectivo; recorre todas las ofertas activas. Por tanto, puede mezclar ofertas de distintos años/períodos.
- SedesAulas se inicializa con SedeID, NombreSede, AulaCodigo, NombreAula, Capacidad, TipoEspacio, Estado (línea 105). El reporte usa rA[1] como código de aula y rA[3] como capacidad, cuando corresponden [2] y [4]. parseInt sobre NombreAula puede producir NaN y el código cae a un aforo artificial de 30.
- HorariosClase se inicializa con ocho columnas: HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado (línea 114); createClassSchedule escribe UltimaModificacion como novena columna (6955/6959). El reporte busca grado/sección/estado en [7]/[8]/[9], que son Estado/UltimaModificacion/undefined. No resuelve OfertaID contra OfertaAcademica para obtener grado/sección/año; no asocia de forma fiable aulas a secciones.
- El resultado puede informar matriculaActiva=0, capacidadFisicaAula=30 y estado normal aunque existan alumnos y un aula con aforo distinto. Las aulas alternativas también heredan el mapeo incorrecto; además, su filtro solo compara capacidad y no sede, tipo de espacio, equipamiento, disponibilidad, mantenimiento ni solapamiento.
- Se amplía AUD-NG-241/H5 y TASK-548; TASK-549 conserva el alcance de alternativas compatibles. No se crea un segundo motor de espacios.

### H2 - AUD-NG-236 AMPLIADO / ALTO-P1: la validación previa a guardar/publicar horarios no deriva la matrícula real

- checkScheduleConflict (7564-7581) solo evalúa capacidad física cuando existe aulaCodigo. Si estudiantesCount no llega, compara m[5] (Seccion) o m[0] (MatriculaID) contra ofertaId. Ninguno es un vínculo OfertaID; no resuelve OfertaAcademica ni filtra por año/grado/sección/estado canónico. Si el conteo es cero, vacío o no coincide, no hay conflicto de capacidad.
- createClassSchedule pasa estudiantesCount desde payload (6909, 6927-6929), permitiendo que el cliente aporte un conteo en vez de derivarlo del servidor. La publicación (7045-7053) llama al validador sin estudiantesCount, por lo que depende del join defectuoso.
- publishClassSchedules sí recorre los borradores y consulta checkScheduleConflict antes de activar (7042-7073), pero el chequeo de aforo no es fiable. Tampoco valida que OfertaID exista, esté activa y pertenezca al año/período publicado. El filtro por anoLectivo usa una búsqueda de texto dentro de OfertaID (7032-7034), no el campo AnoID de OfertaAcademica.
- El motor puede validar la capacidad de SedesAulas por encabezado/índice correcto [2]/[4] (7575-7580), pero solo después de obtener un conteo efectivo positivo; el defecto del join hace que la guarda no se ejecute en el flujo normal.
- Se amplía AUD-NG-236 y TASK-548; coordinar TASK-555/236 y TASK-549 para que alternativas y validación compartan el mismo contrato.

### H3 - AUD-NG-256 NUEVO / ALTO-P1: cambios de matrícula no revalidan las asignaciones ya existentes

- createStudentEnrollment consulta checkEnrollmentCapacity para el cupo administrativo (11301-11307), no compara el aula física asignada ni busca horarios activos afectados.
- changeStudentSection comprueba el cupo administrativo de la sección destino (11443-11449) y cambia Matriculas.Seccion (11451-11452), pero no revalida HorariosClase ni el aforo físico de las aulas ya asignadas. El movimiento se registra en MovimientosEstudiante, sin evento de impacto de planificación.
- Reingreso/promoción usan createStudentEnrollment; retiro/traslado actualizan el estado de matrícula (11842-11848 y 11911-11917). Ninguna de estas rutas invoca getSectionCapacityAnalyticsReport ni una rutina que marque horarios afectados y requiera reubicación/confirmación.
- Una modificación puede dejar una sección con más estudiantes que el aula asignada sin alerta posterior. La validación de alta/movimiento y la validación de horario son flujos separados y no se reconcilian.
- Hallazgo nuevo porque el impacto posterior de mutaciones de matrícula sobre horarios ya existentes no está cubierto por el hallazgo de conteo de AUD-NG-241. Se relaciona con AUD-NG-236/241 y TASK-548/549.

### H4 - AUD-NG-233/TASK-513 AMPLIADO y AUD-NG-234/TASK-514 AMPLIADO: override de capacidad controlado por payload

- createStudentEnrollment omite por completo checkEnrollmentCapacity cuando payload.forceCapacityOverride es truthy (11301-11307). changeStudentSection hace lo mismo (11443-11449). No hay dentro de esas funciones una validación adicional de _verifiedRole, permiso específico, autorización firmada, motivo obligatorio ni registro de quién autorizó el sobrecupo.
- La autorización general para invocar la acción no equivale a autorización específica para exceder cupo. Un booleano aportado por el cliente no constituye una excepción institucional verificable.
- checkEnrollmentCapacity usa correctamente Periodo/Grado/Seccion/Estado en Matriculas (11177-11179), pero asume capacidad 35 cuando falta la oferta o CapacidadMax (11172-11175), considera la sección abierta por defecto y devuelve success sin advertir que la política no pudo verificarse. Las plazas reservadas se agrupan por año/grado y no por sección (11186-11209).
- createAcademicOffer permite guardar CapacidadMax, pero si no se proporciona aplica 35 (6184-6187); getAcademicOffers y el reporte mantienen fallback 35. La existencia de un campo de capacidad es parcial, no una política institucional completa.
- Se amplían AUD-NG-233/TASK-513 (guardas/overrides) y AUD-NG-234/TASK-514 (operaciones críticas/consistencia); TASK-548 debe retirar defaults sin fuente institucional.

### H5 - AUD-NG-246 AMPLIADO / ALTO-P1 y AUD-NG-001 AMPLIADO: panel de capacidad no conectado

- js/teacher.js define openSectionCapacityControlModal y loadSectionCapacityControlData (1434-1495), pero teacher-dashboard.html completo no contiene modal-section-capacity-control, section-capacity-control-container, texto/botón Capacidad Secciones ni otro invocador. El handler no puede abrir un nodo inexistente y el contenedor no puede renderizar el reporte.
- El controlador fija anolectivo='2026'; no permite seleccionar año/período efectivo ni actualizar el ámbito de consulta.
- fetchApi (js/api.js:11-60) solo incorpora requesterUserId/requesterRole y no transmite sessionToken/authToken/token. getSectionCapacityAnalyticsReport es una acción privada (ROLE_PERMISSIONS, línea 246; dispatcher 770-771), por lo que el flujo de UI no acredita una llamada autenticada aceptada por validateRolePermission.
- ChangesLogs.txt afirma que el botón/modal están en el HTML (2515-2517), pero no aparecen en el archivo inspeccionado. Se amplía AUD-NG-246/AUD-NG-001 y TASK-550; no se duplica el trabajo de autenticación.

### H6 - TASK-551 AMPLIADO: regresión de capacidad meramente estructural

- runAcademicPlanningRegressionSuite TC-F7-04 (14141-14142) considera suficiente status==='success' y Array.isArray(reportes). No comprueba conteo, filtros de período, correspondencia de columnas, sobrecupo, aforo de aula, alternativas, cambios de matrícula ni falta de datos.
- tests/regression/academic-grading-suite.js no contiene referencias a getSectionCapacityAnalyticsReport, checkEnrollmentCapacity, Matriculas u HorariosClase para esta tarea. La suite no acredita CA-F7-117..121.

## 4. Matriz de requisitos y criterios de aceptación

| Requisito / criterio | Dictamen | Evidencia |
|---|---|---|
| RF1 / CA-F7-117: matrícula efectiva por sección/período y límite obligatorio | NO CUMPLE | Reporte lee columnas equivocadas; validador compara Seccion/MatriculaID con OfertaID; override cliente omite el límite. |
| RF2: configurar capacidad máxima de sección | PARCIAL | OfertaAcademica.CapacidadMax existe y createAcademicOffer lo persiste, pero usa 35 como valor implícito y no acredita política/vigencia institucional. |
| RF3 / CA-F7-118: comparar matrícula con aula antes de publicar | NO CUMPLE | publish llama al validador, pero no obtiene conteo real; el join por oferta es incorrecto. |
| RF4: diferenciar aforo físico y límite administrativo | PARCIAL | El reporte expone campos separados, pero sus lecturas de matrícula/aula no son fiables y usa defaults. |
| RF5: identificar secciones que exceden límites | NO CUMPLE | El conteo puede quedar en cero y el reporte puede devolver estado normal falso. |
| RF6 / CA-F7-119: detectar impacto de cambios de matrícula | NO CUMPLE | Alta, cambio de sección, retiro y traslado no revalidan asignaciones/aforo de horarios existentes. |
| RF7: consultar aulas alternativas compatibles | PARCIAL | Solo intenta comparar aforo; los índices de capacidad son erróneos y no valida sede, tipo, equipo, mantenimiento ni horario. |
| RF8: conservar relación estudiante-sección-período | CUMPLE | Matriculas persiste Grado/Seccion/Periodo; getStudentEnrollments los devuelve y changeStudentSection registra movimiento. |
| RF9 / CA-F7-120: impedir secciones inactivas o de otro período en planificación | NO CUMPLE | createClassSchedule/checkScheduleConflict no resuelven estado/AnoID de OfertaAcademica; publish filtra por texto en OfertaID. |
| RF10 / CA-F7-121: advertir cuando faltan datos | NO CUMPLE | Fallback 35/30 y status success ante hojas/campos ausentes; no existe estado de validación incompleta. |

**Criterios de aceptación:** CA-F7-117 NO CUMPLE; CA-F7-118 NO CUMPLE; CA-F7-119 NO CUMPLE; CA-F7-120 NO CUMPLE; CA-F7-121 NO CUMPLE.

**Dictamen global: NO CUMPLE.**

## 5. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

#### [TASK-616] Revalidar horarios afectados después de cada mutación de matrícula
- **Hallazgo de origen:** AUD-NG-256, H3.
- **Severidad:** Alto.
- **Objetivo:** evitar que una modificación de matrícula deje horarios existentes por encima de límites físicos o administrativos sin detección.
- **Acción ejecutable:** crear servicio de impacto que resuelva matrícula/oferta/año/período/sección y horarios/aulas vinculados; invocarlo después de alta, reingreso, promoción, cambio de sección, retiro y traslado; comparar conteo anterior/nuevo con límites efectivos; generar alertas accionables y bloqueos según política; exigir revisión/reubicación antes de publicar o confirmar operaciones que violen límites; persistir actor, motivo, correlación y estado de resolución.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; Matriculas; OfertaAcademica; HorariosClase; MovimientosEstudiante; bitácora/notificaciones; tests/regression.
- **Dependencias y riesgos:** TASK-548/549/551; AUD-NG-236/241/256; TASK-513/514. Evitar que los triggers de mutación creen ciclos recursivos o dupliquen conteos.
- **Alcance:** impacto de cambios en matrícula sobre asignaciones existentes; no sustituye el cálculo canónico de capacidad (TASK-548) ni el motor de recursos (TASK-549).
- **Criterios de aceptación:** cada mutación cubierta identifica horarios afectados; antes/después reproducible; exceso detectado con aula y límite; no se publica silenciosamente; las alertas se pueden resolver y auditar; no hay datos productivos modificados por pruebas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de pruebas conductuales para alta, movimiento, baja, reingreso, promoción y traslado, más revisión independiente.

### Tareas existentes ampliadas

- **TASK-548:** corregir los índices de Matriculas/SedesAulas/HorariosClase; resolver OfertaID a sección/año/período; filtrar ofertas por vigencia; eliminar conteos del cliente y defaults 35/30 sin política; integrar el mismo cálculo en reporte, createClassSchedule y publishClassSchedules.
- **TASK-549:** generar alternativas solo con aulas activas y compatibles por sede, tipo, capacidad física, equipamiento, mantenimiento, disponibilidad temporal y ausencia de solapamientos; usar el conteo canónico.
- **TASK-550:** añadir el panel/modal section-capacity-control al HTML real, botón e invocador; seleccionar año/período, mostrar datos faltantes y errores; usar API autenticada y renderizado seguro.
- **TASK-551:** añadir fixtures aislados para CA-F7-117..121: esquema real, estados de matrícula, períodos, oferta activa/inactiva, aforo, cupo administrativo, publicación, mutaciones, overrides, alternativas y ausencia de datos.
- **TASK-513 / AUD-NG-233:** validar override de cupo con identidad/rol verificados, permiso específico, motivo y bitácora; nunca confiar en booleano del cliente.
- **TASK-514 / AUD-NG-234:** conservar serialización e idempotencia en mutaciones y consultas críticas de cupo; no continuar sin lock cuando la operación dependa de exclusión mutua.
- **AUD-NG-236:** integrar el cálculo canónico de capacidad en todas las rutas de creación/publicación/edición y validar oferta activa/año/período.
- **AUD-NG-246 / AUD-NG-001:** corregir el DOM ausente y la propagación de token para la interfaz de capacidad.
- **Control de duplicidad:** TASK-548 es el cálculo canónico; TASK-549 las aulas alternativas; TASK-550 UI de espacios/capacidad; TASK-551 regresión; TASK-616 impacto posterior de mutaciones. AUD-NG-233/234 cubren override y concurrencia; AUD-NG-236 cubre el motor de planificación.

## 6. Pruebas y límites

- **Ejecutadas:** inspección estática/manual de requisitos, esquemas, índices, alta/cambio/transferencia de matrícula, validación de cupo, creación/publicación de horarios, motor de conflictos, RBAC/dispatcher, API, handlers, HTML completo, suite, ChangesLogs, antecedentes IMP-01/04/06/18 y verificación Git.
- **No ejecutadas:** Apps Script runtime; HTTP/OAuth real; navegador/DOM en ejecución; Sheets productivas; alta/movimiento/retirada real de matrícula; publicación real; concurrencia; rollback; Node; E2E.
- TC-F7-04 fue inspeccionado estáticamente, no ejecutado. La suite completa no se ejecutó porque depende de Apps Script y almacenamiento institucional; no se dispone de entorno aislado productivo.
- No se modificó código, UI, pruebas, datos productivos, despliegues, completadas.md, Pendientes.md, ChangesLogs.txt, metodología ni rama base.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-19: **NO CUMPLE**; se conserva [X] histórico.
- Hallazgo nuevo AUD-NG-256 (ALTO/P1); ampliar AUD-NG-001, AUD-NG-236, AUD-NG-241, AUD-NG-246, AUD-NG-233 y AUD-NG-234.
- Tareas nuevas: TASK-616; ampliar TASK-548, TASK-549, TASK-550, TASK-551 y TASK-513/514.
- Archivo nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-19.md.
- Archivos actualizados: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- Sin cambios: código, UI, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Siguiente tarea:** TAREA-F7-IMP-20, optimización del rendimiento y escalabilidad de consultas de planificación (CA-F7-122..127).
