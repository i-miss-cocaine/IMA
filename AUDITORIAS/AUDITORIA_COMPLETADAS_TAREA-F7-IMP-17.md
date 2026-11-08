# AUDITORÍA TAREA-F7-IMP-17
## Gestión de eventos y actividades con participantes y recursos

- Fecha: 2026-11-08.
- Sesión operativa: IMA-AUDIT-20261108-1633Z (ID documental, no ID nativo de ChatGPT).
- Checkpoint inicial C1.248; cierre C1.249.
- Repositorio i-miss-cocaine/IMA; rama NG_beta_0.0.0.1_work; HEAD inicial 7a3650c6e44c52ae4932adb43c738b0e00dd061a.
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
- Informe individual y fuente AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md: 404; auditoría directa desde completadas.md.
- Lectura ordinaria de Pendientes.md: 0 caracteres. Blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado: 1.782.094 caracteres, 20.182 líneas, cero U+FFFD. Consultado por instrucción expresa del usuario, sin modificar. No contiene TAREA-F7-IMP-17 ni TASK-610..612.
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
- Hallazgo: AUD-NG-253. Severidad/prioridad: ALTO/P1.
- Objetivo: crear, consultar, editar, reprogramar, cancelar y gestionar recurrencias sin perder historial ni dejar reservas huérfanas.
- Acción: contrato canónico/migración; endpoints update/cancel; estados/transiciones; series/ocurrencias; liberar recursos al cancelar; revalidar al reprogramar; diff con actor/fecha/motivo; listado/controles UI; propagar cambios a calendarios/notificaciones.
- Archivos: Code.gs; js/secretary.js; dashboard-secretaria.html; dashboard-direccion.html; consumidores.
- Dependencias: AUD-NG-236/241/243/245; TASK-554/562/545/546/555/563/577..583.
- Aceptación: CRUD/transiciones válidas; IDs de serie/ocurrencia; cancelación libera solo reservas vinculadas; reprogramación valida antes de confirmar; rollback/reconciliación; historial inmutable; vista actualizada; notificaciones deduplicadas.
- Estado: Pendiente.

#### [TASK-611] Aplicar autorización contextual y privacidad por evento/grupo/participante
- Hallazgo: AUD-NG-252. Severidad/prioridad: ALTO/P1.
- Objetivo: cada usuario consulta solo eventos visibles por rol/ámbito; autoría desde sesión validada.
- Acción: eliminar visibilidadRol como autoridad del cliente; usar _verifiedRole/_verifiedUserId; filtrar visibilidad/destinatarios; relaciones de participantes por IDs; derivar responsable desde claims; permisos por acción/ámbito en create/get/update/cancel.
- Archivos: Code.gs, ROLE_PERMISSIONS, validateRolePermission/validateContextualAccess, js/api.js, js/secretary.js y pruebas.
- Dependencias: AUD-NG-001/252; TASK-567/554.
- Aceptación: alterar payload no revela eventos; omitir filtro no amplía acceso; actor coincide con claims; participantes solo consultan eventos propios; consultas globales limitadas a roles autorizados; pruebas positivas/negativas.
- Estado: Pendiente.

#### [TASK-612] Añadir regresión conductual integral de CA-F7-106..111
- Hallazgos: AUD-NG-236/241/252/253. Severidad/prioridad: ALTO/P1.
- Objetivo: probar reservas, privacidad, calendario, cancelación e historial.
- Acción: pruebas aisladas de contrato/migración; solapamiento aula/recursos; primer registro mantenimiento; evento informativo sin recursos; fechas; recurrencia; edición/cancelación/liberación; visibilidad/participantes; actor verificado; notificaciones; idempotencia/rollback.
- Archivos: tests/regression/academic-grading-suite.js; backend/developer-service/Code.gs si la suite se expone desde el servicio.
- Dependencias: TASK-545/546/554/555/562/567/577..583/610/611.
- Aceptación: casos positivos/negativos por CA; defectos de índices/esquema reproducidos; sin Sheets productivas; repetición sin efectos colaterales; resultados identificables.
- Estado: Pendiente.

### Existentes ampliadas
- TASK-554: migración no destructiva del contrato CalendarioAcademico, incluidos sede, recursos y participantes.
- TASK-562: proyección por fecha/estado/visibilidad/participantes y refresco tras cambios.
- TASK-545: esquemas SedesAulas/MantenimientoAulas, cabeceras, primera fila e índices.
- TASK-546: vigencia completa y transiciones de mantenimiento.
- TASK-549: catálogo de recursos con IDs/cantidades/compatibilidad, no texto libre.
- TASK-555: conflictos entre eventos, horarios, aulas, capacidad/equipos e intervalos.
- TASK-567: token/permisos de endpoints privados; actor/rol desde claims.
- TASK-577..583/AUD-NG-245: notificaciones de alta/cambio/cancelación y destinatarios/deduplicación.
- TASK-563: mantener alcance de liberar recursos de ocurrencias de clase; coordinar reservas sin duplicar.
Control: no duplicar contrato calendario (TASK-554), mantenimiento/recursos (545/546/549), conflictos (555), autenticación (AUD-NG-001/567) ni dispatcher (245/577..583). TASK-610 cubre eventos institucionales; TASK-561/AUD-NG-243 cubren excepciones de sesiones.

## 8. Pruebas y límites
- Ejecutadas: inspección estática/manual de requisitos, esquemas, índices, RBAC, API, formularios, páginas, pruebas, ChangesLogs, antecedentes y SHAs.
- No ejecutadas: Apps Script runtime, HTTP/OAuth real, navegador/DOM, Sheets productivas, reservas reales, concurrencia, rollback, notificaciones reales, Node ni E2E.
- Datos productivos: no consultados ni modificados. Código/UI/tests: sin cambios.
- La denegación por token se infiere del contrato estático; no se afirma haber observado HTTP.

## 9. SHAs y archivos
- Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html fa0d8c23aace24a6acab2d4956398a7f5e1309b8; dashboard-direccion.html fefaa3bf7884288aef563cfb8aaf244e6cea8b7c; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; metodología cf796728bb384a32537392df2f9c72a339fa03ee.
- Contexto previo 8f1ab2e04dddcdf5d405daf76ec65845cf90b117; plan 25d6a0093301ff91d303bfa7f9692be5d0975dc9; Auditoria.txt cab93361f7c69335d4f913b6a4f020874c7dde0e; MapaDependencias.md 529e0334410d2ba169c052cfd1a9d10c05115bb0.
- Antecedentes IMP-01 1743620a58cdc813f093bfb14db4651681481591; IMP-06 2d353d7cc700e31af9cf776f6da55b90f5d9e2e5; IMP-08 9e2a0526433f8db56214856da563d6fa10f9e420; IMP-15 08fd8a623a689e344c23ecd3cb625e0ac5cabf9c.
- Nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-17.md.
- Actualizados: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt.
- Sin cambios: código, JS, HTML, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.

## 10. Continuidad
Última tarea auditada: TAREA-F7-IMP-17, NO CUMPLE. Siguiente: TAREA-F7-IMP-18, restricciones curriculares y dependencias entre asignaturas.
