# AUDITORÍA TAREA-F7-IMP-17
## Gestión de eventos y actividades con participantes y recursos

- Fecha: 2026-11-08.
- Sesión operativa: IMA-AUDIT-20261108-1748Z (ID documental, no ID nativo de ChatGPT).
- Checkpoint inicial válido: C1.248; cierre de esta iteración: C1.249 (reemplaza el registro C1.249 anterior, inválido).
- Repositorio i-miss-cocaine/IMA; rama NG_beta_0.0.0.1_work; snapshot auditado C1.248: 7a3650c6e44c52ae4932adb43c738b0e00dd061a. HEAD de rama al iniciar: 0b29a46d5947db5ddb25a06ec0f1bcbe3b44672f (contenía el cierre documental C1.249 descartado); los ocho archivos de código/UI/pruebas comparados conservan exactamente los SHA del snapshot C1.248. HEAD base: 44d9891132332e692dbe2ba8602b41f50a508a59; 317 adelante, 0 detrás.
- TAREA-F7-IMP-17 marcada [X] en completadas.md, línea 4451.
- **Dictamen: NO CUMPLE. Severidad global ALTA/P1.**
- Criterios: CA-F7-106 PARCIAL; CA-F7-107 CUMPLE; CA-F7-108/109/110/111 NO CUMPLE.

## 1. Alcance y fuentes

Se contrastaron los doce requisitos con datos, endpoints, dispatcher, RBAC, autenticación, calendario, espacios/recursos, mantenimiento, interfaces, pruebas e historial.
- backend/academic-service/Code.gs: getOrCreateSheet/esquemas (84-155; SedesAulas 105, CalendarioAcademico 113); ROLE_PERMISSIONS (168-265); validateContextualAccess/validateRolePermission (465-585); doPost (671-735; rutas 796-815); getAcademicCalendar (6616-6644); createCalendarEvent (6651-6715); checkScheduleConflict (7493-7693); getClassroomResources/saveClassroomResource/saveClassroomMaintenance (7694-7834; mantenimiento 7797-7834); getIndividualCalendar (7925-7983).
- js/api.js fetchApi (11-60); js/secretary.js (589-650); dashboard-secretaria.html (botón 54, scripts 313-340, modal 349-430); dashboard-direccion.html (modal 206-284 y scripts).
- js/teacher.js completo (8360 líneas), teacher-dashboard.html completo (1475 líneas), tests/regression/academic-grading-suite.js (412 líneas), ChangesLogs.txt (2445-2468), completadas.md, Pendientes blob, metodología, contexto, plan, mapa e informes IMP-01/06/08/15.
Inspección estática/manual; sin cambios de código ni escrituras productivas.

## 2. Integridad documental

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; tarea [X]. La marca histórica no acredita comportamiento.
- En el snapshot C1.248, el informe individual y la fuente AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md no existían (404); se ejecutó la auditoría desde cero contra completadas.md. El informe que aparece en el HEAD posterior fue parte del cierre inválido descartado y se volvió a contrastar contra código sin confiar en ese dictamen.
- Pendientes.md: lectura ordinaria 0 caracteres; recuperación directa Git blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.782.094 caracteres, 20.182 líneas, cero U+FFFD, 511 TASK únicos TASK-001..TASK-511. No contiene TAREA-F7-IMP-17 ni TASK-610..612. Consultado por prioridad expresa de la tarea; no se modificó ni restauró porque el blob íntegro coincide con el SHA declarado.
- Metodología 3.4 sitúa tareas derivadas en informes AUDITORIAS y excluye Pendientes.md del flujo operativo.
- Antecedentes: AUD-NG-236 (esquema calendario), AUD-NG-241 (aulas/recursos/mantenimiento), AUD-NG-243 (excepciones de sesiones), AUD-NG-001 (token fetchApi), AUD-NG-245 (notificaciones). Se amplían, no se duplican.

## 3. Evidencia técnica

### 3.1 Esquema CalendarioAcademico — AUD-NG-236 ampliado
getOrCreateSheet (113) inicializa 9 columnas: EventoID, AnoID, SedeID, NombreEvento, TipoDia, FechaInicio, FechaFin, Visibilidad, Estado. createCalendarEvent (6651-6715) escribe 13 columnas sin SedeID; getAcademicCalendar (6616-6644) lee 13 campos. La condición `if (sheet.getLastRow() === 0)` no corrige la cabecera porque getOrCreateSheet ya crea la hoja y agrega el encabezado. Con el esquema inicial, el reader interpreta SedeID como nombre, NombreEvento como tipo, TipoDia como fechaInicio y FechaInicio como fechaFin. El consumidor alterno getUnifiedInstitutionalCalendar conserva otro contrato, ya relacionado con AUD-NG-236.

### 3.2 Mantenimiento con índices equivocados — AUD-NG-241 ampliado
saveClassroomMaintenance (7797-7834) escribe `[maintId,aulaCodigo,fechaInicio,fechaFin,motivo,estado,authUserId]`: inicio r[2], fin r[3], motivo r[4], estado r[5], usuario r[6].
createCalendarEvent (6651-6685) interpreta r[6] como estado, r[3] como inicio y r[4] como fin. Además usa maintData.slice(1), aunque getOrCreateSheet no inicializa cabecera para MantenimientoAulas y el primer mantenimiento se inserta como primera fila. Puede descartar el primer registro, leer columnas incorrectas o convertir el motivo como fecha. Solo compara fechaInicio del evento, no el intervalo completo. Ampliar AUD-NG-241/TASK-545/546.

### 3.3 Disponibilidad incompleta
createCalendarEvent no verifica aula activa/existente, sede, capacidad, solapamiento con otros eventos, HorariosClase ni recursos compartidos; no llama checkScheduleConflict. El formulario solo contiene fechas, no horas. recursosReservados y gruposAfectados son texto libre, no IDs/cantidades/relaciones. No hay LockService, versión esperada ni clave idempotente; CAL-Date.now no resuelve concurrencia. Ampliar TASK-545/546/549/555 y AUD-NG-236/241.

### 3.4 Ciclo de vida, historial y notificaciones — AUD-NG-253
Solo se encontraron createCalendarEvent/getAcademicCalendar; no hay updateCalendarEvent, cancelCalendarEvent ni deleteCalendarEvent. No hay transición de cancelación, liberación de reservas, recurrencia/ocurrencias, diff, historial de evento ni invocación a logStructuredEvent/HistorialCambiosEntidad. No se invoca dispatcher ni se resuelven destinatarios. Ampliar AUD-NG-245/TASK-577..583.

### 3.5 Visibilidad y atribución no confiables — AUD-NG-252
getAcademicCalendar recibe visibilidadRol del payload. Si se omite, no filtra y devuelve todos los eventos; si se envía Director o Administrador, el filtro permite todos. ROLE_PERMISSIONS permite getAcademicCalendar a Profesor, Asistente, Estudiante, Alumno, Padre, Tutor, Responsable, Consejeros y Orientación, además de roles administrativos. No deriva rol/usuario desde _verifiedRole/_verifiedUserId ni filtra participantes/grupos. responsableUserId es opcional y cliente-controlado; js/secretary.js envía currentUser.nombre || currentUser.userId. gruposAfectados es texto libre. Impacto: exposición de eventos privados y atribución falsificable. Nuevo AUD-NG-252 ALTO/P1.

### 3.6 Autenticación y UI — AUD-NG-001 ampliado
js/secretary.js llama fetchApi('ACADEMIC','createCalendarEvent') (622-638). js/api.js fetchApi (11-60) agrega requesterUserId/requesterRole, pero no sessionToken/authToken/token. validateRolePermission (524-585) exige token; createCalendarEvent no es PUBLIC_ACTION. El flujo normal de creación no satisface el contrato de autenticación si no existe otra capa de inyección. Conclusión estática, no respuesta HTTP observada.
dashboard-direccion.html contiene el modal pero no botón btn-open-event-manager; dashboard-secretaria.html sí. js/secretary.js invoca window.loadAcademicCalendar solo si existe; no se encontró esa función en el módulo ni páginas inspeccionadas. No se confirma refresco del calendario. teacher-dashboard.html/js/teacher.js no contienen UI de eventos; esto coincide con la retirada de herramientas administrativas documentada en ChangesLogs, pero no hace funcional el flujo administrativo actual.

### 3.7 Pruebas
academic-grading-suite.js no contiene referencias a endpoints/criterios. No hay pruebas conductuales de reservas, evento informativo, privacidad, cancelación/liberación, recurrencia, historial o notificaciones. Comentarios y ChangesLogs no prueban ejecución.

## 4. Requisitos funcionales

| Requisito | Dictamen | Evidencia |
|---|---|---|
| 1. Responsable y ámbito | PARCIAL | Responsable cliente-controlado; no valida identidad/ámbito. |
| 2. Participantes/grupos | PARCIAL | Texto libre, sin IDs/relaciones. |
| 3. Aulas/equipos/recursos | PARCIAL | Texto libre sin catálogo/disponibilidad. |
| 4. Validación de reservas | NO CUMPLE | Mantenimiento mal leído; no comprueba otros eventos/clases/recursos. |
| 5. Recurrencia | NO CUMPLE | Sin series/ocurrencias. |
| 6. Cancelaciones/cambios | NO CUMPLE | Sin endpoints ni liberación. |
| 7. Informativo vs reserva | PARCIAL | Recursos opcionales, sin tipo explícito informativo. |
| 8. Visibilidad por rol/destinatario | NO CUMPLE | Filtro controlado por cliente, sin aislamiento de participantes. |
| 9. Propagación a calendario | NO CUMPLE | Esquema incompatible y sin refresco de vista comprobado. |
| 10. No exigir aula/docente | CUMPLE | Solo requiere nombre/fechaInicio; aula, recursos y docente no son obligatorios. |
| 11. Historial | NO CUMPLE | Sin update/cancel/diff. |
| 12. Notificaciones | NO CUMPLE | Sin dispatcher ni destinatarios. |

## 5. Criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-106 | PARCIAL | Intenta validar mantenimiento con índices incorrectos; no cubre disponibilidad integral. |
| CA-F7-107 | CUMPLE | Nombre/fecha requeridos; aula y recursos opcionales. |
| CA-F7-108 | NO CUMPLE | Esquema desplaza campos; no hay refresh verificable. |
| CA-F7-109 | NO CUMPLE | Sin cancelación/liberación. |
| CA-F7-110 | NO CUMPLE | Visibilidad client-controlled; sin filtro de participantes. |
| CA-F7-111 | NO CUMPLE | Sin historial/diff. |

**Dictamen global: NO CUMPLE.** Se conserva [X] histórica en completadas.md.

## 6. Hallazgos
- **AUD-NG-236 ampliado (ALTO/P1):** CalendarioAcademico 9/13 columnas; writer/reader desplazan campos. Relación TASK-554/562.
- **AUD-NG-241 ampliado (ALTO/P1):** mantenimiento con índices erróneos, primera fila descartada, sin verificación de aula/capacidad/solapamientos/recursos. Relación TASK-545/546/549/555.
- **AUD-NG-001 ampliado (CRÍTICO/P0):** fetchApi no transmite token y endpoint privado lo exige. Relación TASK-567.
- **AUD-NG-245 ampliado (ALTO/P1):** eventos no notifican ni resuelven destinatarios. Relación TASK-577..583.
- **AUD-NG-252 nuevo (ALTO/P1):** visibilidad/participantes/actor controlados por cliente; roles de menor privilegio pueden consultar; omitir visibilidad devuelve todo; Director/Administrador evita filtro; responsable procede del payload. Relacionado AUD-NG-001/236/241/245/243.
- **AUD-NG-253 nuevo (ALTO/P1):** solo alta/consulta; faltan actualización, cancelación, recurrencia, liberación, historial y notificaciones. Relacionado AUD-NG-236/241/243/245.

## 7. Tareas ejecutables derivadas de los hallazgos

### Nuevas

#### [TASK-610] Completar ciclo de vida e historial de eventos institucionales
- **Hallazgo de origen:** AUD-NG-253, apartados 3.4 y 4-6; complementa AUD-NG-236/241/245.
- **Severidad:** Alto.
- **Objetivo:** gestionar el ciclo de vida completo de eventos y actividades sin dejar reservas huérfanas ni perder trazabilidad.
- **Acción ejecutable:** definir contrato canónico; implementar edición, reprogramación, cancelación y recurrencia; definir estados/transiciones; vincular reservas a evento/ocurrencia; liberar únicamente recursos asociados al cancelar; revalidar disponibilidad antes de confirmar cambios; registrar diff, actor verificado, fecha y motivo; propagar cambios al calendario y al dispatcher.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html; dashboard-direccion.html; consumidores de calendario y notificaciones.
- **Dependencias y riesgos:** AUD-NG-236/241/245; TASK-554/562/545/546/555/563/577..583. Riesgo de liberar reservas ajenas si no se vinculan por ID y ocurrencia.
- **Alcance:** eventos institucionales y extracurriculares; no sustituye el ciclo de vida de excepciones de sesiones de clase cubierto por AUD-NG-243/TASK-561.
- **Criterios de aceptación:** altas/ediciones/cancelaciones con transiciones válidas; series y ocurrencias identificables; cancelación libera solo reservas vinculadas; reprogramación valida antes de confirmar; historial inmutable; calendario y notificaciones se actualizan de forma deduplicada; recuperación ante fallo sin estado parcial.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** Pendiente; completar con commit, pruebas de ciclo de vida/rollback y revisión independiente.

#### [TASK-611] Aplicar autorización contextual y privacidad por evento, grupo y participante
- **Hallazgo de origen:** AUD-NG-252, apartados 3.5 y 4-6; complementa AUD-NG-001.
- **Severidad:** Alto.
- **Objetivo:** asegurar que cada usuario consulte y gestione exclusivamente eventos permitidos por rol, ámbito, sede, grupo y relación de participante.
- **Acción ejecutable:** eliminar visibilidadRol como autoridad del cliente; derivar usuario/rol desde _verifiedUserId/_verifiedRole; definir permisos por acción y ámbito; modelar participantes/grupos mediante IDs; filtrar en servidor; atribuir responsable desde sesión validada; proteger alta, consulta, edición y cancelación.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs (ROLE_PERMISSIONS, validateRolePermission, validateContextualAccess y endpoints de eventos); js/api.js; js/secretary.js; dashboards administrativos; tests/regression.
- **Dependencias y riesgos:** AUD-NG-001/252; TASK-567 y TASK-554. Riesgo de exposición de eventos privados y falsificación de autoría si se confía en payloads.
- **Alcance:** autorización de eventos institucionales y recursos; no duplicar el sistema transversal de autenticación ni el motor de permisos existente.
- **Criterios de aceptación:** manipular payload no amplía acceso; omitir visibilidad no devuelve eventos globales; actor coincide con claims verificados; participantes solo consultan eventos de su ámbito; acceso global limitado a roles autorizados; pruebas negativas por rol/ámbito.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** Pendiente; completar con commit, pruebas RBAC/ABAC y revisión independiente.

#### [TASK-612] Añadir regresión conductual integral para CA-F7-106..111
- **Hallazgo de origen:** AUD-NG-236/241/252/253, apartados 3-7.
- **Severidad:** Alto.
- **Objetivo:** demostrar con pruebas reproducibles la integridad de reservas, privacidad, propagación, cancelación e historial.
- **Acción ejecutable:** crear casos aislados para migración de esquema; primera fila de mantenimiento; solapamientos de aulas/recursos/horarios; evento informativo sin recursos; recurrencia; edición/cancelación/liberación; privacidad de participantes; actor verificado; notificaciones; idempotencia y recuperación ante fallo.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js; backend/academic-service/Code.gs; backend/developer-service/Code.gs si se expone la suite.
- **Dependencias y riesgos:** TASK-545/546/549/554/555/562/567/577..583/610/611. Las pruebas no deben depender de hojas productivas ni limitarse a buscar cadenas.
- **Alcance:** pruebas de contrato y comportamiento de los doce requisitos y seis criterios de TAREA-F7-IMP-17.
- **Criterios de aceptación:** casos positivos y negativos trazados a CA-F7-106..111; defectos de índices/esquema reproducidos; aislamiento de datos; cancelación libera solo reservas propias; resultados repetibles; ejecución sin efectos colaterales productivos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** Pendiente; completar con resultados de ejecución, commit y revisión independiente.

### Existentes ampliadas
- **TASK-554:** migración no destructiva del contrato CalendarioAcademico, incluidos sede, recursos y participantes.
- **TASK-562:** proyección por fecha/estado/visibilidad/participantes y refresco tras cambios.
- **TASK-545:** esquemas SedesAulas/MantenimientoAulas, cabeceras, primera fila e índices.
- **TASK-546:** vigencia completa y transiciones de mantenimiento.
- **TASK-549:** catálogo de recursos con IDs/cantidades/compatibilidad, no texto libre.
- **TASK-555:** conflictos entre eventos, horarios, aulas, capacidad/equipos e intervalos.
- **TASK-567:** token/permisos de endpoints privados; actor/rol desde claims.
- **TASK-577..583 / AUD-NG-245:** notificaciones de alta/cambio/cancelación y destinatarios/deduplicación.
- **TASK-563:** coordinar liberación de reservas sin duplicar el alcance de ocurrencias de clase.

**Control de duplicidad:** no crear otro contrato de calendario (TASK-554), mantenimiento/recursos (TASK-545/546/549), motor de conflictos (TASK-555), autenticación (AUD-NG-001/TASK-567) ni dispatcher (AUD-NG-245/TASK-577..583). TASK-610 cubre eventos institucionales; TASK-561/AUD-NG-243 cubren excepciones de sesiones.
 

## 8. Pruebas y límites
- Ejecutadas: inspección estática/manual de requisitos, esquemas, índices, RBAC, API, formularios, páginas, pruebas, ChangesLogs, antecedentes y SHAs.
- No ejecutadas: Apps Script runtime, HTTP/OAuth real, navegador/DOM, Sheets productivas, reservas reales, concurrencia, rollback, notificaciones reales, Node ni E2E.
- Datos productivos: no consultados ni modificados. Código/UI/tests: sin cambios.
- La denegación por token se infiere del contrato estático; no se afirma haber observado HTTP.

## 9. SHAs y archivos
- Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html fa0d8c23aace24a6acab2d4956398a7f5e1309b8; dashboard-direccion.html fefaa3bf7884288aef563cfb8aaf244e6cea8b7c; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; metodología cf796728bb384a32537392df2f9c72a339fa03ee.
- Contexto C1.248 8f1ab2e04dddcdf5d405daf76ec65845cf90b117; plan C1.248 25d6a0093301ff91d303bfa7f9692be5d0975dc9; Auditoria.txt C1.248 cab93361f7c69335d4f913b6a4f020874c7dde0e; MapaDependencias.md C1.248 529e0334410d2ba169c052cfd1a9d10c05115bb0.
- Antecedentes IMP-01 1743620a58cdc813f093bfb14db4651681481591; IMP-06 2d353d7cc700e31af9cf776f6da55b90f5d9e2e5; IMP-08 9e2a0526433f8db56214856da563d6fa10f9e420; IMP-15 08fd8a623a689e344c23ecd3cb625e0ac5cabf9c.
- Nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-17.md.
- Actualizados: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt.
- Sin cambios: código, JS, HTML, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.

## 10. Continuidad
Última tarea auditada: TAREA-F7-IMP-17, NO CUMPLE. Siguiente: TAREA-F7-IMP-18, restricciones curriculares y dependencias entre asignaturas.

## 11. Reconciliación del checkpoint
El C1.249 anterior no se considera válido ni se conserva su contenido documental. Esta auditoría vuelve a partir del contenido de C1.248, revalida los SHA de código/UI/pruebas y reemplaza el cierre anterior. No se modificó código, datos productivos, completadas.md, Pendientes.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md.
