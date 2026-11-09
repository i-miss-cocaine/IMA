# AUDITORÍA TAREA-F7-IMP-14
## Fortalecer la publicación y el control de cambios masivos

- **Fecha:** 2026-11-08 (UTC).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** 348c9d139314233dc1482e99707ef965ed07d027 (checkpoint C1.245).
- **Rama base protegida:** NG_beta_0.0.0.1; HEAD 44d9891132332e692dbe2ba8602b41f50a508a59.
- **Estado Git inicial:** la rama de trabajo coincide exactamente con 348c9d139314233dc1482e99707ef965ed07d027; comparación con la rama base: 313 commits adelante, 0 detrás.
- **Checkpoint de cierre:** C1.246.
- **ID de sesión operativo:** IMA-AUDIT-20261108-0430Z (identificador documental, no ID nativo de ChatGPT).
- **Tarea auditada:** TAREA-F7-IMP-14, marcada [X] en completadas.md.
- **Dictamen:** **NO CUMPLE**.
- **Severidad global:** **ALTA/P1**. El flujo puede publicar borradores ajenos al conjunto revisado, exponer borradores como horarios vigentes y dejar publicaciones parcialmente aplicadas; además, no ejecuta las notificaciones prometidas.
- **Criterios:** CA-F7-87 NO CUMPLE; CA-F7-88 PARCIAL; CA-F7-89 PARCIAL; CA-F7-90 NO CUMPLE; CA-F7-91 NO CUMPLE; CA-F7-92 NO CUMPLE.

## 1. Alcance y fuentes

Se contrastaron los doce requisitos funcionales de la tarea (separación de borradores/publicados; revisión previa; detalle de nuevas, modificadas y canceladas; validación del conjunto; identificación de afectados; confirmación; revalidación; tratamiento de fallos parciales; atribución de actor/fecha; notificaciones; historial; aislamiento de borradores de otros usuarios) y CA-F7-87..92.

Archivos y componentes examinados:
- backend/academic-service/Code.gs: ROLE_PERMISSIONS (168-260), validateRolePermission (524-583), doPost/dispatcher (671-975; previewPublishImpact 821 y publishClassSchedules 823), recordEntityChangeLog (1568-1595), previewPublishImpact (3351-3400), getClassSchedules (6718-6764), publishClassSchedules (7007-7116), getScheduleVersions (7119-7142), compareScheduleVersions (7144-7221), checkScheduleConflict (7493-7691) y runAcademicPlanningRegressionSuite (14109-14173).
- js/teacher.js: openPublishImpactPreviewModal (992-1076).
- teacher-dashboard.html: documento completo, 1.475 líneas.
- backend/user-service/Code.gs: dispatchScheduleChangeNotifications (8858-8894).
- tests/regression/academic-grading-suite.js y tests/regression/modular-dashboard-suite.js.
- completadas.md, Pendientes.md recuperado por blob, ChangesLogs.txt, informes previos IMP-10..13, MapaDependencias.md, Auditoria.txt y checkpoint C1.245.

La inspección fue manual y estática. No se modificó código ni se ejecutó una publicación real.

## 2. Integridad documental y estado histórico

- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TAREA-F7-IMP-14 está en la línea 4346, marcada [X], con los doce requisitos y CA-F7-87..92. Se conserva el estado histórico, sin asumir que la marca demuestra funcionamiento.
- **Pendientes.md:** la lectura convencional de la ruta devuelve cero caracteres. Se recuperó el blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.782.094 caracteres, 20.182 líneas, cero U+FFFD; 511 identificadores TASK únicos, desde TASK-001 hasta TASK-511. No contiene TAREA-F7-IMP-14. El blob recuperado coincide con el SHA de la ruta; no se restaura ni modifica. Se consultó por la instrucción expresa del usuario como contraste histórico.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-14.md no existía (404); esta auditoría se realiza desde cero.
- **Documento de origen:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md no existe en la raíz de la rama (404). No se reconstruye ni se inventa; se usan los requisitos completos de completadas.md.
- **ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2394-2404, fecha 2026-10-27. Afirma que se añadió botón y modal en teacher-dashboard.html y que el controlador está conectado. El HTML actual no contiene modal, IDs ni referencia a openPublishImpactPreviewModal. La afirmación histórica no prevalece sobre los archivos vigentes.
- **Dependencias de auditorías anteriores:** AUD-NG-245/TASK-577..583 (notificaciones y trazabilidad); AUD-NG-246/TASK-585 y AUD-NG-001/TASK-567 (estados, consultas e identidad); AUD-NG-247/TASK-591 (semántica de estados); AUD-NG-248/TASK-598, TASK-601 y TASK-602 (conflictos, UI y pruebas); TAREA-F7-IMP-15 (concurrencia e integridad multi-registro). Se amplían las tareas existentes donde la causa raíz ya está cubierta.

## 3. Evidencia técnica

### 3.1 Los borradores no están aislados de la vista vigente

**backend/academic-service/Code.gs, getClassSchedules (6718-6764).**
- El filtro excluye Cancelado si aparece en r[9] o r[10], pero no exige que el estado canónico sea Activo/Publicado ni excluye Borrador en r[7].
- El DTO asigna estado desde r[9] || "Activo". En el contrato que createClassSchedule persiste (Estado en r[7], UltimaModificacion en r[8]), el estado Borrador queda ignorado y la consulta lo presenta como Activo por fallback.
- La inconsistencia de columnas y estados ya está documentada en AUD-NG-246 y AUD-NG-247. Para esta tarea tiene un efecto directo: el borrador puede aparecer como horario vigente antes de la publicación.
- previewPublishImpact y publishClassSchedules, en cambio, leen el estado desde r[7]. Las rutas de lectura y publicación no aplican un único contrato de estado.

### 3.2 La previsualización no muestra el impacto requerido

**previewPublishImpact (3351-3400).**
- Lee HorariosClase y selecciona filas cuyo r[7] sea Borrador; el filtro opcional anoLectivo compara el texto con r[1] (OfertaID), no con una relación de año lectivo verificada.
- Calcula únicamente cantidad de borradores, docentes distintos, aulas distintas y conflictos. No construye diferencias contra la última versión publicada.
- No clasifica asignaciones nuevas, modificadas y canceladas; no entrega filas antes/después; no identifica grupos/secciones, asignaturas ni todos los recursos afectados.
- No utiliza getScheduleVersions ni compareScheduleVersions para calcular el delta.
- El controlador JS renderiza cuatro métricas y un texto estático sobre notificaciones/sincronización. La confirmación solo muestra el total de bloques; no presenta el conjunto concreto que se va a publicar.
- Por tanto, existe una previsualización cuantitativa básica, pero no la revisión de impacto funcional exigida.

### 3.3 Revalidación de conflictos: existe, pero es incompleta

**publishClassSchedules (7007-7116) y checkScheduleConflict (7493-7691).**
- La publicación adquiere LockService.getScriptLock() con tryLock(15000), vuelve a recorrer los borradores y ejecuta checkScheduleConflict antes de modificar estados. Si la función devuelve conflictos, la publicación se detiene y devuelve publishedCount: 0. Es un control real y evita algunas publicaciones con solapamientos detectados.
- checkScheduleConflict compara contra las filas persistidas, incluidas otras filas Borrador, por lo que puede detectar varios conflictos entre borradores presentes en la hoja. No obstante, excluye únicamente Inactivo; Cancelado y estados no vigentes también pueden bloquear la publicación.
- La semántica de columnas/estados no está normalizada entre lectores y escritores. Las restricciones curriculares se inspeccionan dentro de un try/catch que solo escribe Logger.log si falla, y el flujo continúa como si esa comprobación no hubiera producido un conflicto.
- El cálculo de carga docente depende de getTeacherTeachingLoad, cuyo tratamiento de Borrador/Cancelado ya está relacionado con AUD-NG-247.
- No se acredita una validación exhaustiva de cada regla obligatoria para todas las variantes de fila. Se considera cumplimiento parcial, no ausencia total de control.

### 3.4 La confirmación no queda vinculada al conjunto revisado

**js/teacher.js (992-1076) y publishClassSchedules (7017-7081).**
- La UI invoca previewPublishImpact con payload vacío.
- Al confirmar, envía { modo: "masivo", notificarCambios: true }, pero no envía IDs de horarios, ofertaIds, anoLectivo, identificador de previsualización, versión de origen ni token de revisión.
- El backend solo filtra por ofertaIds si se recibe un arreglo no vacío; si no, filtra por anoLectivo cuando existe. Si no recibe ninguno (caso de la UI actual), selecciona todos los registros cuyo r[7] sea Borrador.
- No existe propiedad de autor/propietario del borrador en el contrato de fila que permita separar borradores por usuario. La función no usa _verifiedUserId para limitar el conjunto.
- La confirmación puede incluir borradores creados después de la previsualización o pertenecientes a otros usuarios. La operación real no está acotada al conjunto revisado.
- El campo modo y notificarCambios enviado por la UI no se consume en publishClassSchedules.

### 3.5 Escrituras, atribución e historial

- Una vez superada la validación, publishClassSchedules ejecuta setValue("Activo") fila por fila (7076-7081). No existe staging, transacción, rollback ni reconciliación por lote.
- Si una escritura posterior falla, las anteriores pueden quedar activas. doPost captura la excepción externa, pero no registra un ID de operación con filas confirmadas/fallidas ni permite reanudar de forma idempotente.
- Tras cambiar estados, el código intenta guardar una instantánea en VersionesHorarios. El bloque catch registra VERSION_SNAPSHOT_FAILED, pero el endpoint continúa y devuelve status success. La publicación puede declararse exitosa sin que exista su versión histórica.
- getScheduleVersions y compareScheduleVersions existen en backend (7119-7221), pero teacher-dashboard.html no contiene modal-schedule-versions ni openScheduleVersionsModal; js/teacher.js solo define la función, sin conexión en el HTML actual.
- La tarea cita HistorialCambiosEntidad, pero publishClassSchedules no llama recordEntityChangeLog ni escribe en esa hoja. Solo llama logStructuredEvent después de completar las escrituras.
- El dato publisher se obtiene de payload.authUserId o del literal "Administración". validateRolePermission agrega _verifiedUserId al payload, pero no se observa que el dispatcher derive/reemplace authUserId con esa identidad verificada. Por tanto, la atribución persistida no se considera confiable sin corregir ese vínculo.
- La instantánea, cuando se logra crear, almacena usuario/fecha y una lista de bloques activos; no registra un resultado por fila ni garantiza atomicidad entre cambio de estado y versión.

### 3.6 No se generan las notificaciones post-publicación

- La UI muestra texto que afirma que se enviarán notificaciones multicanal a docentes y que se actualizará el token del portal familiar.
- publishClassSchedules no invoca dispatchScheduleChangeNotifications ni sendMultiChannelNotification; el bloque de la función no escribe en HistorialCambiosEntidad.
- En backend/user-service/Code.gs existe dispatchScheduleChangeNotifications (8858-8894), pero no se encontró una llamada desde el flujo académico. El contador de llamadas en backend/academic-service/Code.gs es cero; su existencia en otro servicio no integra automáticamente la publicación.
- La función de notificaciones USER solo contempla docenteUserId como destinatario directo y tiene defectos previos de destinatarios, deduplicación y estados, documentados en AUD-NG-245. Debe reutilizarse y ampliarse la tarea existente, no crear otra tarea duplicada.
- No hay secuencia durable publicación confirmada -> evento/outbox -> destinatarios -> intentos -> resultados. Por tanto, las notificaciones no se generan a partir de los cambios realmente publicados.

### 3.7 Interfaz, permisos y disponibilidad

- js/teacher.js define window.openPublishImpactPreviewModal en líneas 992-1076. En el archivo aparece una sola referencia (la definición).
- teacher-dashboard.html tiene 1.475 líneas y no contiene modal-publish-impact-preview, publish-impact-summary-box, publish-impact-details, btn-confirm-publish-schedules ni el nombre openPublishImpactPreviewModal. No hay botón ni invocador.
- El mismo HTML tampoco contiene modal-schedule-versions ni openScheduleVersionsModal. La consulta/comparación de versiones no tiene una interfaz conectada en este portal.
- ROLE_PERMISSIONS incluye previewPublishImpact para Administrador y Director en la matriz estática. Subdirector, Secretaría, Secretaria y Profesor tienen publishClassSchedules en sus listas estáticas, pero no previewPublishImpact. La matriz dinámica MatrizPermisosRoles puede alterar el resultado; no se inspeccionó su configuración productiva. En la configuración estática existe una asimetría: perfiles con permiso de publicar no necesariamente pueden ejecutar la previsualización.
- El dispatcher sí registra ambas acciones (previewPublishImpact y publishClassSchedules) y validateRolePermission aplica token/RBAC antes de despachar. Esto es un control parcial de backend, pero no compensa la UI ausente ni la diferencia de permisos.

### 3.8 Pruebas

- runAcademicPlanningRegressionSuite (14109-14173) contiene TC-F7-01..07 para conflicto/carga, restricciones, capacidad, sustituciones, plantillas y logs. No prueba previewPublishImpact ni publishClassSchedules.
- tests/regression/academic-grading-suite.js (412 líneas) no contiene casos para CA-F7-87..92.
- tests/regression/modular-dashboard-suite.js (61 líneas) tampoco contiene pruebas del flujo de publicación masiva.
- No existen casos conductuales de borrador no visible, diff antes/después, selección exacta del lote, borradores de otros usuarios, fallo en una escritura intermedia, snapshot fallido, reintento idempotente ni notificación por cambios efectivamente confirmados.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-87 | NO CUMPLE | getClassSchedules ignora el estado canónico r[7] y usa r[9] || "Activo"; los borradores pueden aparecer vigentes. |
| CA-F7-88 | PARCIAL | La previsualización cuenta borradores/docentes/aulas/conflictos, pero no muestra altas, modificaciones, cancelaciones ni detalle de afectados. |
| CA-F7-89 | PARCIAL | Hay revalidación bajo lock y bloqueo ante conflictos devueltos; la semántica de estados y algunas restricciones no se verifican de forma exhaustiva. |
| CA-F7-90 | NO CUMPLE | La confirmación no envía IDs ni token de preview; el backend publica todos los borradores cuando no recibe filtros y no aísla autores. |
| CA-F7-91 | NO CUMPLE | Escrituras secuenciales sin rollback/estado por lote; fallo de snapshot se oculta y la publicación se devuelve como exitosa. |
| CA-F7-92 | NO CUMPLE | No hay invocación del dispatcher de notificaciones desde la publicación; el mensaje de UI promete un envío inexistente. |

## 5. Hallazgo

### AUD-NG-249 (ALTO/P1)
**Publicación masiva no vinculada al impacto revisado, con exposición de borradores, alcance de publicación excesivo, persistencia no recuperable y notificaciones post-publicación desconectadas.**

Relaciones: AUD-NG-245 (notificaciones/trazabilidad), AUD-NG-246 (contrato y visibilidad de estados), AUD-NG-247 (semántica de estados/carga), AUD-NG-248 (conflictos/atomicidad de lotes), TAREA-F7-IMP-15 y TAREA-F7-IMP-01/02.

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

**TASK-603 - Construir una previsualización de impacto comparada con la versión publicada**
- Hallazgo: AUD-NG-249, secciones 3.2 y 3.5. Severidad: ALTO/P1. Estado: Pendiente.
- Objetivo: comparar el conjunto candidato con la última versión publicada y generar un delta explícito de asignaciones nuevas, modificadas y canceladas, con valores anteriores/nuevos.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- Dependencias: getScheduleVersions, compareScheduleVersions, TASK-585/TASK-591 y TASK-601.
- Aceptación: cada cambio incluye horario, oferta, grado/sección, asignatura, docente, aula, intervalo y tipo de cambio; el resumen identifica todas las clases/personas/recursos afectados; el usuario ve el delta antes de confirmar; no se confunden métricas agregadas con una revisión completa.

**TASK-604 - Vincular la confirmación a un lote inmutable y al actor autorizado**
- Hallazgo: AUD-NG-249, sección 3.4. Severidad: ALTO/P1. Estado: Pendiente.
- Objetivo: emitir un identificador/token de previsualización que fije IDs, versión de origen, actor, alcance y hash del conjunto revisado; publicar exclusivamente esos registros tras comprobar que siguen sin cambios y que el actor mantiene autorización.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html; almacenamiento de operaciones/lotes.
- Dependencias: TASK-603, TASK-567, TAREA-F7-IMP-15.
- Aceptación: la confirmación solo afecta los IDs revisados; un borrador agregado/modificado después obliga a previsualizar de nuevo; un usuario no publica borradores ajenos sin autorización explícita; el actor procede de _verifiedUserId, no de un campo de identidad controlado por el cliente; los filtros de año/oferta usan relaciones canónicas.

### Tareas existentes que deben ampliarse (no crear IDs duplicados)

- **TAREA-F7-IMP-15:** ampliar el control de concurrencia para cubrir la publicación masiva, no solo la adquisición de LockService. Exigir staging o estrategia all-or-none/commit recuperable, ID de operación, estados por fila, snapshot coherente, rollback/reconciliación, idempotencia y reintento seguro. Un fallo inducido en cualquier punto no debe dejar un estado parcial sin identificar.
- **TASK-577..TASK-583 (AUD-NG-245):** integrar la publicación confirmada con un outbox/evento durable; resolver docentes y demás destinatarios afectados (TASK-578); registrar cambios y correlación (TASK-579); deduplicar y reintentar (TASK-580); persistir estados basados en evidencia (TASK-581); exponer historial/estado en UI (TASK-582); probar notificación solo para cambios confirmados y realmente aplicados (TASK-583).
- **TASK-585 y TASK-591 (AUD-NG-246/247):** unificar el contrato de HorariosClase y la semántica de estados; CA-F7-87 debe cubrir explícitamente que Borrador no se exponga como Activo/Publicado en getClassSchedules ni en vistas dependientes.
- **TASK-598 (AUD-NG-248):** ampliar la revalidación de publicación para usar el conjunto completo, estados normalizados y reglas obligatorias; identificar ambos registros en conflicto y no silenciar fallos de validación curricular.
- **TASK-601 (AUD-NG-248):** ampliar la integración UI a la publicación: HTML real con botón/modal/invocador, detalle de impacto, selección de lote, confirmación exacta, estado de operación y consulta de versiones. Ajustar permisos para que los roles autorizados puedan previsualizar y publicar de forma coherente.
- **TASK-602 (AUD-NG-248):** ampliar la suite para CA-F7-87..92, con pruebas positivas/negativas de visibilidad, diff, conflictos, aislamiento, concurrencia, fallo parcial, snapshot, reintento, actor y notificaciones.
- **TASK-567 (AUD-NG-001):** extender el uso de identidad verificada al registro de quién publica y al ámbito de borradores; no confiar en payload.authUserId.

## 7. Pruebas y límites

- **Ejecutadas:** inspección estática manual de funciones, estados, filtros, RBAC, dispatcher, UI, historial, notificaciones, pruebas, ChangesLogs y registros; verificación Git de rama/HEAD/base y SHAs; recuperación y validación del blob Pendientes.md.
- **No ejecutadas:** Apps Script runtime; HTTP/OAuth; navegador/DOM real; Google Sheets productivas; publicación real; fallo inducido de escritura; concurrencia; envío de correo/notificaciones; suites Node; E2E.
- **Datos productivos:** no consultados ni modificados.
- **Código, UI y pruebas:** sin cambios.
- **Marca [X]:** preservada en completadas.md; el dictamen NO CUMPLE no cambia el registro histórico de aprobación.

## 8. Archivos y SHAs de respaldo

- backend/academic-service/Code.gs: df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- js/teacher.js: c475fce5afcd28fca23e7b64398ad32b17773746.
- teacher-dashboard.html: cbb9e6a272a7d8ad33f99727303305d950533e71.
- backend/user-service/Code.gs: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- tests/regression/academic-grading-suite.js: a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- tests/regression/modular-dashboard-suite.js: 0495e1d526a872c33310935a003a83d924d34683.
- completadas.md: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- Pendientes.md: 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt: 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- METODOLOGIA_DESARROLLO.md: cf796728bb384a32537392df2f9c72a339fa03ee.
- **Archivos de auditoría actualizados:** Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Archivo nuevo:** AUDITORIA_COMPLETADAS_TAREA-F7-IMP-14.md.
- **Sin cambios:** código, HTML, JS, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt y rama base.

## 9. Continuidad

- Última tarea completamente auditada: TAREA-F7-IMP-14 (C1.246), dictamen NO CUMPLE.
- Tarea en curso al cierre: ninguna.
- Siguiente tarea exacta: **TAREA-F7-IMP-15**, control de concurrencia y protección de operaciones críticas (CA-F7-93..98). Debe auditarse desde sus requisitos completos, verificar informe/origen y comprobar el código vigente; incluir las ampliaciones de atomicidad ya registradas para importación y publicación masivas.
