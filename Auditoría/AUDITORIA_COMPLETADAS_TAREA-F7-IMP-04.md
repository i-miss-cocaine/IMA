# AUDITORÍA TÉCNICA - TAREA-F7-IMP-04: Incorporar planificación masiva y optimización de horarios

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2210Z-01 (no es ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.235  
**Checkpoint de cierre:** C1.236  
**HEAD auditado:** ee2861653d31e185bd934bc1e1f063ab225e0bbf  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- Rama base NG_beta_0.0.0.1: HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; rama de trabajo 303 commits adelante y 0 atrás. El HEAD de trabajo coincide con el commit C1.235 ee2861653d31e185bd934bc1e1f063ab225e0bbf; árbol de partida fb70804f5b3df2659c0fc54c91107af88052334e.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F7-IMP-04 aparece [X], línea aproximada 3984; criterios CA-F7-24..CA-F7-31. La marca histórica se conserva y no se toma como evidencia funcional.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md en el HEAD de trabajo. Se omite el informe previo inexistente y se audita directamente el alcance maestro de completadas.md.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff registra la generación automática, persistencia de escenarios y vista previa de publicación. El código actual demuestra que los bloques se escriben en HorariosClase antes de guardar la ficha de escenario y que la ficha solo conserva logs.
- Pendientes.md mantiene blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; lectura convencional 0 caracteres. El inventario de continuidad está documentado en C1.233; no se modifica.
- Alcance: escenarios aislados, selección de ofertas, restricciones obligatorias, preferencias, carga docente, recursos/jornadas, asignaciones bloqueadas, comparación antes/después, pendientes y motivos, persistencia/reanudación, publicación confirmada, rollback y trazabilidad.

## 2. Archivos y respaldos inmutables inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: previewPublishImpact (3351), generateAutoSchedules (6335), saveScheduleScenario (6459), getScheduleScenarios (6472), publishClassSchedules (7008), checkScheduleConflict (7493), getScheduleTemplates (13961), applyScheduleTemplate (14000).
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: listener btn-open-auto-scheduler (321), preview/publicación (aprox. 1005-1060), openScheduleScenarioModal (1862).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: 1.475 líneas; no contiene btn-open-auto-scheduler, modal de escenarios ni controles de preview/publicación.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi y autenticación privada relacionada con AUD-NG-001.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6: no contiene generateAutoSchedules, saveScheduleScenario, getScheduleScenarios, publishClassSchedules ni CA-F7-24..31.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- No se modificaron los archivos de código inspeccionados.

## 3. Hallazgos

### H1 - CRÍTICO/P0: el generador modifica HorariosClase antes de guardar el escenario

generateAutoSchedules agrega cada asignación directamente a HorariosClase con estado Borrador. Solo después del bucle crea un ESC-... en EscenariosHorarios. No utiliza un almacén aislado de propuestas ni vincula cada fila generada con escenarioId. Por tanto, la generación modifica la tabla canónica de horarios, mezcla borradores de distintas ejecuciones y no permite distinguir con seguridad qué filas pertenecen a cada escenario. Si el proceso falla a mitad del bucle, las filas ya agregadas permanecen y la ficha del escenario puede no llegar a guardarse.

### H2 - ALTO/P1: el escenario guarda logs, no la propuesta recuperable

saveScheduleScenario almacena nombre, año, contadores y detallesJSON, pero generateAutoSchedules envía JSON.stringify(logs), no el conjunto estructurado de asignaciones, restricciones o parámetros. getScheduleScenarios devuelve solo metadatos y no expone detallesJSON ni los bloques asociados. No existe applyScheduleScenario ni resumeScheduleScenario en el backend. No se puede recuperar, editar, comparar o retomar el escenario real; solo se lista una ficha de resumen.

### H3 - ALTO/P1: generador greedy y parámetros ignorados, no optimización

generateAutoSchedules toma el primer docente asignado y la primera aula activa, y busca la primera franja libre dentro de una lista fija de ocho horas/días (en el código auditado, siete bloques por día). Asigna como máximo un bloque por oferta. unidadMin y startHourStr se calculan pero no se utilizan; la duración y hora de inicio solicitadas no cambian la generación. No se calculan frecuencia de clases, múltiples sesiones por oferta, distribución de carga, períodos libres, preferencias docentes, uso eficiente de recursos ni una función objetivo. No hay algoritmo de optimización; es una asignación greedy de primera opción.

### H4 - CRÍTICO/P0: no se separan restricciones obligatorias, preferencias ni asignaciones bloqueadas

El generador solo invoca checkScheduleConflict para día/hora/aula/docente/oferta. No construye una política de restricciones obligatorias frente a preferencias optimizables, no consume un catálogo de preferencias y no identifica asignaciones bloqueadas. Tampoco incorpora disponibilidad completa de secciones, jornadas, recursos compartidos, período y reglas académicas en el payload. Hereda las limitaciones de AUD-NG-236/AUD-NG-168. Las ofertas que no encuentran franja reciben el mensaje genérico “debido a restricciones”, sin indicar cuál regla impidió ubicarlas.

### H5 - ALTO/P1: comparación antes/después insuficiente

previewPublishImpact calcula cantidad de borradores, docentes, aulas y conflictos. No calcula ni compara carga docente, utilización de aulas/recursos, períodos libres, concentración diaria ni diferencias por asignación entre el horario vigente y el escenario propuesto. Además, analiza todos los borradores elegibles en HorariosClase, no un escenario identificado. No satisface la comparación cuantitativa y cualitativa requerida.

### H6 - CRÍTICO/P0: publicación no está aislada por escenario y puede abarcar todos los borradores

publishClassSchedules acepta anoLectivo y ofertaIds, pero no escenarioId. La UI invoca publishClassSchedules con modo/notificarCambios y no envía año, ofertas ni escenario. Si no se envían filtros, se seleccionan todos los registros con Estado Borrador en HorariosClase. Cuando recibe anoLectivo, lo compara con r[1] (OfertaID), no con un campo de año lectivo; las filas generadas ni siquiera guardan anoLectivo. No hay forma fiable de publicar exclusivamente el escenario revisado.

### H7 - CRÍTICO/P0: publicación secuencial sin rollback

publishClassSchedules valida los borradores antes de modificar estados, lo cual es un control parcial útil. Sin embargo, después cambia cada fila con setValue en un bucle, sin operación atómica ni compensación. Si una escritura falla a mitad, pueden quedar algunos bloques Activo y otros Borrador. La instantánea VersionesHorarios se guarda después; si falla, se registra WARN pero la operación sigue devolviendo éxito. El lock evita concurrencia durante la publicación, pero no garantiza rollback ni atomicidad.

### H8 - ALTO/P1: interfaz desconectada y resumen de generación incorrecto

teacher-dashboard.html no contiene btn-open-auto-scheduler ni controles de escenarios/publicación. El listener de js/teacher.js queda sin elemento que lo active; openScheduleScenarioModal solo está definido y no tiene llamada desde el HTML. La alternativa usa fetchApi para generateAutoSchedules, acción privada no incluida en PUBLIC_ACTIONS, y fetchApi no transmite token (AUD-NG-001). Además, la UI lee resumen.programadas y resumen.pendientes, mientras el backend devuelve bloquesBorradorCreados y ofertasPendientes; mostraría 0 aunque el generador hubiera creado bloques. El modal de vista previa/publicación también carece de contenedor en el HTML auditado.

### H9 - ALTO/P1: generación no es idempotente ni está protegida contra ejecuciones concurrentes

generateAutoSchedules no usa LockService, no recibe una clave idempotente y siempre genera IDs nuevos/añade filas. Dos ejecuciones simultáneas pueden leer la misma disponibilidad y seleccionar el mismo bloque antes de escribir. Repetir la operación agrega nuevos borradores sin reconocer o reutilizar el escenario anterior. No hay compensación si saveScheduleScenario falla después de que se hayan insertado filas.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-24: generar escenario sin modificar horario oficial | NO CUMPLE | generateAutoSchedules escribe filas Borrador directamente en HorariosClase. |
| CA-F7-25: impedir publicación con conflictos obligatorios | PARCIAL | publishClassSchedules valida antes de activar, pero usa motor incompleto y no filtra por escenario. |
| CA-F7-26: conservar asignaciones bloqueadas | NO CUMPLE | No hay modelo/flag ni lógica de bloqueo en el generador. |
| CA-F7-27: identificar restricciones imposibles | PARCIAL | Cuenta ofertas pendientes y registra motivo genérico, no identifica reglas concretas. |
| CA-F7-28: preferencias no sustituyen restricciones obligatorias | NO CUMPLE | No existe modelo de preferencias ni distinción formal hard/soft. |
| CA-F7-29: comparar carga y uso de recursos antes/después | NO CUMPLE | Preview solo cuenta borradores/docentes/aulas/conflictos. |
| CA-F7-30: fallo no destruye escenario previo ni horario oficial | NO CUMPLE | Inserciones parciales y publicación secuencial sin rollback; sin escenario aislado. |
| CA-F7-31: confirmación explícita y validación final antes de publicar | PARCIAL | Backend revalida conflictos y JS contempla preview/confirmación, pero los controles no existen en HTML; la publicación no está acotada al escenario. |

**Dictamen global: TAREA-F7-IMP-04 NO CUMPLE.** La marca [X] histórica se conserva en completadas.md.

## 5. Registros relacionados y tareas ejecutables derivadas de los hallazgos

**Hallazgo nuevo:** AUD-NG-239 (P1, con brechas críticas), escenarios masivos mezclados con horarios canónicos y publicación no aislada/no atómica.

**Registros existentes ampliados, sin duplicar alcance:**
- AUD-NG-236: motor de conflictos, integridad y rollback.
- AUD-NG-237: matriz y filtros de planificación.
- AUD-NG-238: resolución asistida.
- AUD-NG-168: modelo de horarios, año/período y estados.
- AUD-NG-001: token/identidad para acciones privadas.

### [TASK-532] Aislar escenarios de planificación del horario oficial
- **Hallazgo de origen:** AUD-NG-239 / H1-H2.
- **Severidad:** Crítico.
- **Objetivo:** almacenar propuestas completas en un espacio independiente hasta que se publiquen.
- **Acción ejecutable:** crear esquema de escenario con escenarioId, año/período, creador, estado, parámetros, asignaciones, restricciones y logs; asociar cada bloque al escenario; no insertar filas en HorariosClase durante generación; permitir recuperar/retomar/descartar.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; almacenamiento académico; js/teacher.js.
- **Dependencias y riesgos:** HorariosClase, EscenariosHorarios, VersionesHorarios, permisos y migración de borradores existentes.
- **Alcance:** ciclo de vida de escenarios; no cambiar el motor de optimización.
- **Criterios de aceptación:** generar/editar/descartar no cambia HorariosClase; escenario recuperado reproduce parámetros y asignaciones; cada fila de propuesta tiene vínculo único a escenarioId.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-533] Implementar asignación masiva basada en restricciones y preferencias
- **Hallazgo de origen:** AUD-NG-239 / H3-H4.
- **Severidad:** Alto.
- **Objetivo:** generar soluciones que consideren frecuencia, duración, disponibilidad, recursos, jornadas y preferencias autorizadas.
- **Acción ejecutable:** reemplazar primera opción greedy por motor de planificación; aplicar restricciones obligatorias primero; optimizar preferencias después; considerar varias sesiones por oferta, duración real, docentes/aulas/recursos compatibles y asignaciones bloqueadas.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs.
- **Dependencias y riesgos:** F7-IMP-01/02/03, disponibilidad docente, secciones, aulas, recursos, períodos y reglas académicas.
- **Alcance:** generación de escenarios; mantener separación entre hard constraints y soft preferences.
- **Criterios de aceptación:** ninguna solución viola restricciones obligatorias; preferencias nunca anulan bloqueos; parámetros de duración/hora son efectivos; asignaciones bloqueadas permanecen intactas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-534] Explicar restricciones imposibles y comparar impacto antes/después
- **Hallazgo de origen:** AUD-NG-239 / H5.
- **Severidad:** Alto.
- **Objetivo:** permitir decidir con información completa antes de aplicar un escenario.
- **Acción ejecutable:** guardar causas por oferta/asignación no ubicada; calcular carga docente, utilización de aulas/recursos y períodos libres en horario actual/propuesto; producir diferencias y consecuencias.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** DTO de horarios, reportes de carga, recursos y filtros de matriz.
- **Alcance:** diagnóstico y comparación; no publicar ni alterar el escenario.
- **Criterios de aceptación:** cada pendiente indica restricciones concretas; comparación antes/después por docente/aula/recurso y período; datos reproducibles por escenarioId.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-535] Publicar exclusivamente el escenario confirmado
- **Hallazgo de origen:** AUD-NG-239 / H6-H7.
- **Severidad:** Crítico.
- **Objetivo:** que una confirmación solo afecte los bloques del escenario revisado.
- **Acción ejecutable:** exigir escenarioId y versión; validar año/período/estado; revisar conflictos y bloqueos; no usar todos los borradores globales como fallback; registrar el conjunto exacto de IDs seleccionados.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** TASK-532/533/534, F7-IMP-01, VersionesHorarios y RBAC.
- **Alcance:** publicación de escenario; no publicar otros borradores ajenos.
- **Criterios de aceptación:** sin escenarioId válido no se publica; solo IDs del escenario confirmado cambian de estado; año/período se filtran por campos explícitos; cambios concurrentes requieren nueva validación.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-536] Hacer atómica la generación y publicación masiva
- **Hallazgo de origen:** AUD-NG-239 / H1/H7/H9; amplía AUD-NG-236.
- **Severidad:** Crítico.
- **Objetivo:** impedir escenarios incompletos y publicaciones parciales.
- **Acción ejecutable:** implementar bloqueo/idempotencia en generación; usar escritura batch validada; snapshot previo; rollback/compensación ante fallo; confirmar snapshot final antes de responder éxito.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; VersionesHorarios; logs.
- **Dependencias y riesgos:** LockService, CacheService, reintentos, APIs de Sheets y versionado.
- **Alcance:** generación/publicación masiva de escenarios.
- **Criterios de aceptación:** doble ejecución no duplica; fallo en cualquier lote restaura estado anterior; publicación o se completa íntegramente o no cambia el horario oficial; la versión corresponde al escenario publicado.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-537] Conectar UI, autenticación y regresión del ciclo de escenarios
- **Hallazgo de origen:** AUD-NG-239 / H8-H9; amplía AUD-NG-001/AUD-NG-237.
- **Severidad:** Alto.
- **Objetivo:** habilitar generación, recuperación, comparación, confirmación y publicación desde la interfaz real.
- **Acción ejecutable:** incorporar controles/modal en teacher-dashboard; conectar botones y rutas autenticadas; corregir propiedades del resumen; crear pruebas de CA-F7-24..31 y concurrencia.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/academic-service/Code.gs; tests/regression.
- **Dependencias y riesgos:** sesión/RBAC, matriz F7-IMP-02, escenario aislado y publicación.
- **Alcance:** interfaz y pruebas del flujo completo; no duplicar la autenticación canónica.
- **Criterios de aceptación:** UI conectada; conteos coinciden con respuesta; usuario compara antes de confirmar; acciones privadas autenticadas; pruebas de generación, reanudación, descarte, publicación, rollback y doble ejecución.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, ejecución y revisión.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual del generador, almacenamiento de escenarios, consulta de escenarios, preview, publicación, UI, controles DOM, autenticación, restricciones, bloqueo, historial y suites.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth, navegador, Sheets/Drive productivas, generación masiva real, concurrencia, fallos inyectados, rollback ni E2E.
- **No se modificó código, tests, HTML, datos productivos, configuración ni despliegues.**
- Se preserva la marca histórica [X] de completadas.md y el blob de Pendientes.md.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-04: **NO CUMPLE**.
- Nuevo hallazgo AUD-NG-239; se amplían AUD-NG-236, AUD-NG-237, AUD-NG-238, AUD-NG-168 y AUD-NG-001.
- Tareas derivadas TASK-532..TASK-537: Pendientes.
- **Siguiente tarea cronológica:** TAREA-F7-IMP-05, “Ampliar el control de carga laboral y las preferencias docentes”.
