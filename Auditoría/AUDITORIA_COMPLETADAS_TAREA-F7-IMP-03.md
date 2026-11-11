# AUDITORÍA TÉCNICA - TAREA-F7-IMP-03: Desarrollar una herramienta de resolución asistida de conflictos

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**Sesión operativa:** IMA-AUDIT-20261107-2200Z-01 (no es ID nativo de ChatGPT)  
**Checkpoint inicial:** C1.234  
**Checkpoint de cierre:** C1.235  
**HEAD auditado:** 7fb4669d48e9e745e9cbe1d406f1602c9cc13d65  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

- Rama base NG_beta_0.0.0.1: HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; rama de trabajo 302 commits adelante y 0 atrás. El HEAD de trabajo coincide con el commit C1.234 7fb4669d48e9e745e9cbe1d406f1602c9cc13d65; árbol de partida 04ba118e168f7106aec0d194cc02686df171e2fd.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F7-IMP-03 aparece [X], línea aproximada 3947; criterios CA-F7-17..CA-F7-23. La marca histórica se conserva y no se toma como evidencia funcional.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-03.md en el HEAD de trabajo. Se omite el informe previo inexistente y se audita directamente el alcance maestro de completadas.md.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff registra que se incorporaron getScheduleConflictResolutionAlternatives, el modal y applyConflictAlternative. El HTML actual no contiene el modal y la aplicación no modifica el horario que originó el conflicto.
- Pendientes.md mantiene blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; lectura convencional 0 caracteres. El inventario de continuidad está documentado en C1.233; no se modifica.
- Alcance: agrupación de conflictos, identificación de asignaciones afectadas, explicación de reglas/intervalos, alternativas de aula/docente/recurso/horario/reprogramación, evaluación de restricciones, comparación de consecuencias, vista previa, confirmación, revalidación, persistencia atómica, trazabilidad y descarte.

## 2. Archivos y respaldos inmutables inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: checkScheduleConflict (7493), createClassSchedule (6900), getClassroomResources (7694), getScheduleConflictResolutionAlternatives (8085), dispatcher de ACADEMIC y PUBLIC_ACTIONS (265).
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746: openAssistedConflictResolutionModal (aprox. 800), generación de opciones y botones (807+), applyConflictAlternative (1886).
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71: 1.475 líneas; no contiene modal-schedule-conflict-resolution ni conflict-resolution-content.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (11), contrato de sesión relacionado con AUD-NG-001.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6: no contiene getScheduleConflictResolutionAlternatives, applyConflictAlternative, F7-IMP-03 ni TC-F7-17..23.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- No se modificaron los archivos de código inspeccionados.

## 3. Hallazgos

### H1 - CRÍTICO/P0: modal inexistente y ruta de consulta no autenticada/inaccesible

openAssistedConflictResolutionModal busca modal-schedule-conflict-resolution y conflict-resolution-content y retorna inmediatamente si falta cualquiera. teacher-dashboard.html no contiene esos elementos. Incluso si se incorporara el modal, getScheduleConflictResolutionAlternatives es una acción privada (no está en PUBLIC_ACTIONS) y fetchApi no transmite sessionToken/authToken/token en la llamada. El dispatcher exige token para acciones privadas; la ruta de consulta no alcanza la función en el flujo normal del navegador. La acción de aplicación createClassSchedule tiene el mismo bloqueo de sesión, ya registrado en AUD-NG-001.

### H2 - ALTO/P1: generador de alternativas limitado a dos tipos y bloques prefijados

getScheduleConflictResolutionAlternatives solo propone:
- Aulas distintas para el mismo día/hora, recorriendo getClassroomResources.
- Ocho bloques horarios prefijados (07:00-07:45, 07:45-08:30, 08:50-09:35, 09:35-10:20, 10:40-11:25, 11:25-12:10, 13:00-13:45 y 13:45-14:30) en el mismo día/aula.

No propone docente sustituto, cambio de día, reasignación de recursos, reprogramación de actividad ni alternativas por sección/grupo. No agrupa conflictos ni identifica todas las asignaciones participantes. No devuelve alternativas inválidas con la regla que las bloqueó. Esto no satisface el alcance de resolución multi-recurso.

### H3 - ALTO/P1: validación de alternativas hereda las limitaciones del motor de conflictos

Cada candidato se valida con checkScheduleConflict, pero el payload no contiene fecha efectiva, año, período, grupo ni recursos reservados. El motor tampoco obtiene un contexto completo de las asignaciones relacionadas y conserva los defectos documentados en AUD-NG-236/AUD-NG-168 (excepción anticipada, filtros temporales/estados y esquema de horarios). Por tanto, que testConflict.hasConflict sea falso no demuestra que la alternativa respete todas las restricciones obligatorias. El filtro solo conserva candidatos que no producen conflicto según ese subconjunto de reglas.

### H4 - CRÍTICO/P0: aplicar una alternativa crea un nuevo horario y no corrige el horario original

window.applyConflictAlternative llama createClassSchedule con oferta, día, hora, aula y docente, pero no pasa horarioId ni lastUpdated. createClassSchedule genera un nuevo HOR-... y agrega una fila cuando no recibe horarioId. No modifica ni desactiva la asignación que produjo el conflicto. El resultado puede ser un segundo bloque mientras el original sigue activo; no se está resolviendo la colisión original ni aplicando únicamente el cambio seleccionado sobre el registro afectado.

### H5 - ALTO/P1: no existe comparación de impacto ni vista previa completamente de solo lectura

La interfaz muestra un texto con la razón inicial y listas de aulas/bloques; no muestra las asignaciones que cambiarían, consecuencias para docente/sección/recurso, carga antes/después ni una comparación entre escenarios. Además, getScheduleConflictResolutionAlternatives invoca getClassroomResources({}); cuando SedesAulas está vacía o solo tiene encabezado, getClassroomResources inserta seis aulas predeterminadas. Así, la generación de propuestas puede modificar el catálogo de recursos durante una operación que debería ser una evaluación previa sin cambios oficiales.

### H6 - ALTO/P1: la selección no exige confirmación contextual ni registra la resolución

Los botones Aplicar invocan directamente applyConflictAlternative. No hay una confirmación adicional que resuma asignaciones afectadas, datos anteriores/nuevos o impacto. La función no registra un evento específico de resolución (conflicto original, alternativa elegida, actor, asignaciones afectadas y diferencias); createClassSchedule solo registra un horario nuevo. No existe una acción de descarte con comparación/estado de propuesta porque las alternativas no se guardan como escenario temporal.

### H7 - ALTO/P1: revalidación y atomicidad solo parciales/no demostradas

createClassSchedule sí vuelve a llamar checkScheduleConflict antes de escribir, lo que constituye una revalidación parcial al momento de aplicar. Sin embargo, utiliza el mismo motor incompleto y no valida el estado/versionado del horario original porque no recibe horarioId/lastUpdated. No hay transacción que aplique un conjunto de cambios relacionados, rollback ni pruebas de que un fallo no deje modificaciones parciales. El flujo no puede garantizar que solo se apliquen los cambios de la alternativa seleccionada.

### H8 - ALTO/P1: ausencia de pruebas funcionales de resolución asistida

Las suites de regresión inspeccionadas no contienen escenarios F7-IMP-03. No hay pruebas de conflicto agrupado, candidatos válidos/inválidos, sustitutos, recursos, cambio de día, comparación sin escritura, cambios concurrentes, revalidación, actualización del horario original, descarte, rollback ni caso sin solución. No se ejecutaron pruebas de navegador o Apps Script.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-17: ante conflicto docente mostrar intervalos alternativos válidos | NO CUMPLE | Solo bloques prefijados y aulas; modal ausente y consulta privada sin token. |
| CA-F7-18: descartar/identificar alternativas con conflictos obligatorios | PARCIAL | Se filtran candidatos con checkScheduleConflict, pero no usa contexto completo ni explica cada descarte. |
| CA-F7-19: propuesta no modifica datos oficiales antes de confirmación | PARCIAL | No escribe HorariosClase al listar, pero getClassroomResources puede sembrar aulas durante la vista previa; no hay comparación de impacto. |
| CA-F7-20: revalidar si los datos cambian durante la evaluación | PARCIAL | createClassSchedule reejecuta checkScheduleConflict, pero no compara versión del horario original ni evalúa todas las restricciones. |
| CA-F7-21: confirmación aplica únicamente cambios seleccionados | NO CUMPLE | applyConflictAlternative crea un horario nuevo y deja vigente el original. |
| CA-F7-22: operación fallida no deja modificaciones parciales | NO CUMPLE | No hay transacción/rollback ni pruebas de persistencia atómica. |
| CA-F7-23: sin alternativa válida, explicar por qué | PARCIAL | Mensaje genérico indica que no hay alternativas y sugiere cambiar docente/día manualmente; no detalla reglas ni restricciones. |

**Dictamen global: TAREA-F7-IMP-03 NO CUMPLE.** La marca [X] histórica se conserva en completadas.md.

## 5. Registros relacionados y tareas ejecutables derivadas de los hallazgos

**Hallazgo nuevo:** AUD-NG-238 (P1, con brechas críticas), resolución asistida incompleta, no conectada y que no modifica el horario conflictivo.

**Registros existentes ampliados, sin duplicar alcance:**
- AUD-NG-236: validación de horarios, excepción y persistencia.
- AUD-NG-237: matriz de horarios y DTO de planificación.
- AUD-NG-168: modelo de horarios, períodos y asignaciones.
- AUD-NG-001: autenticación de acciones privadas.

### [TASK-526] Integrar modal y rutas privadas de resolución asistida
- **Hallazgo de origen:** AUD-NG-238 / H1.
- **Severidad:** Crítico.
- **Objetivo:** hacer accesible la herramienta desde el dashboard publicado.
- **Acción ejecutable:** incorporar modal y contenedor reales; conectar el disparador de conflicto; corregir propagación del token mediante AUD-NG-001; presentar estados de carga/error/vacío.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** sesión, RBAC, matriz F7-IMP-02 y motor F7-IMP-01.
- **Alcance:** conexión UI/API del asistente; no rediseñar la matriz.
- **Criterios de aceptación:** modal visible; consulta privada autenticada; usuarios no autorizados no acceden; mensajes accesibles y estados claros.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-527] Ampliar generación de candidatos y agrupación de conflictos
- **Hallazgo de origen:** AUD-NG-238 / H2-H3.
- **Severidad:** Alto.
- **Objetivo:** evaluar alternativas de docente, aula, horario, día, recurso y reprogramación.
- **Acción ejecutable:** obtener todos los registros participantes; agrupar por docente/aula/sección/recurso/actividad; generar candidatos dinámicos según jornada y disponibilidad; validar cada candidato contra todas las restricciones obligatorias y devolver motivos de rechazo.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** checkScheduleConflict, getClassSchedules, getTeacherTeachingLoad, getClassroomResources, asignaciones, calendario y recursos.
- **Alcance:** propuestas de resolución; la aplicación persistente queda en TASK-529/530.
- **Criterios de aceptación:** alternativas cubren sustituto/aula/horario/recurso/reprogramación; se identifican todas las asignaciones; candidatos inválidos incluyen regla e intervalo; no se presenta una opción incompleta como válida.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-528] Implementar vista previa comparativa sin efectos secundarios
- **Hallazgo de origen:** AUD-NG-238 / H5-H6.
- **Severidad:** Alto.
- **Objetivo:** comparar escenarios sin alterar horarios ni catálogos oficiales.
- **Acción ejecutable:** construir DTO de propuesta con cambios anteriores/nuevos, entidades afectadas, carga y ocupación; impedir escrituras de siembra durante consultas; añadir comparación y descarte explícito.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** catálogo SedesAulas, CacheService, escenarios y permisos.
- **Alcance:** solo vista previa/descartar; no aplicar cambios oficiales.
- **Criterios de aceptación:** consulta no escribe en HorariosClase/SedesAulas ni otros catálogos; cada opción muestra impacto; descartar no cambia datos oficiales; se puede comparar al menos dos propuestas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-529] Aplicar alternativas sobre los registros originales seleccionados
- **Hallazgo de origen:** AUD-NG-238 / H4/H6.
- **Severidad:** Crítico.
- **Objetivo:** que la alternativa resuelva el conflicto existente en vez de crear otro bloque duplicado.
- **Acción ejecutable:** transportar horarioId, lastUpdated y conjunto explícito de cambios; actualizar solo registros seleccionados; exigir confirmación contextual; volver a validar contra versión/estado vigente justo antes de aplicar.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** optimistic concurrency, F7-IMP-01, matriz F7-IMP-02 y permisos.
- **Alcance:** cambios de horarios seleccionados; no permitir sustituciones/reasignaciones fuera de la propuesta confirmada.
- **Criterios de aceptación:** el original queda actualizado/cancelado según la alternativa; no aparece un duplicado; cambios concurrentes fuerzan nueva revisión; solo se modifican IDs seleccionados.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-530] Garantizar aplicación atómica y trazabilidad de la resolución
- **Hallazgo de origen:** AUD-NG-238 / H6-H7.
- **Severidad:** Crítico.
- **Objetivo:** evitar estados parciales y dejar evidencia auditable de la decisión.
- **Acción ejecutable:** implementar persistencia transaccional o compensación verificable con rollback; registrar conflicto, actor verificado, alternativa, reglas, registros antes/después y resultado; usar idempotencia ante reintentos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; bitácora académica; js/api.js.
- **Dependencias y riesgos:** LockService, idempotencia, historial/versiones de horarios y logs.
- **Alcance:** transacción de resolución y auditoría; no modificar otros módulos ajenos.
- **Criterios de aceptación:** fallo en cualquier paso revierte/compensa todos los cambios; repetición no duplica; el log permite reconstruir qué se cambió, por quién y por qué.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### [TASK-531] Crear regresión conductual para CA-F7-17..CA-F7-23
- **Hallazgo de origen:** AUD-NG-238 / H8.
- **Severidad:** Alto.
- **Objetivo:** verificar propuestas, selección, revalidación, descarte y recuperación.
- **Acción ejecutable:** crear fixtures para conflictos simultáneos de docente/aula/sección/recurso; probar alternativas válidas/no válidas, sin solución, cambios concurrentes, aplicación, duplicados y rollback.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js; tests/regression; backend/academic-service/Code.gs; teacher-dashboard.html; js/teacher.js.
- **Dependencias y riesgos:** entorno aislado, mocks de Apps Script, identidad/roles y datos temporales.
- **Alcance:** pruebas funcionales del asistente F7-IMP-03; no declarar E2E si no se ejecuta en navegador.
- **Criterios de aceptación:** cada CA-F7-17..23 tiene prueba verificable; un conflicto con varios participantes identifica todos; una alternativa inválida no se aplica; fallo no deja cambios; descarte conserva el estado.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, ejecución y revisión.

## 6. Pruebas y límites de auditoría

- **Ejecutadas:** inspección estática/manual del generador de alternativas, motor de conflictos, UI, modal, aplicación, autenticación, catálogo de aulas, dispatcher, permisos, suites e historial.
- **No ejecutadas:** navegador, Apps Script runtime, HTTP/OAuth, Sheets/Drive productivas, concurrencia, pruebas de cambios simultáneos, rollback ni E2E.
- **No se modificó código, tests, HTML, datos productivos, configuración ni despliegues.**
- Se preserva la marca histórica [X] de completadas.md y el blob de Pendientes.md.

## 7. Cierre y siguiente tarea

- TAREA-F7-IMP-03: **NO CUMPLE**.
- Nuevo hallazgo AUD-NG-238; se amplían AUD-NG-236, AUD-NG-237, AUD-NG-168 y AUD-NG-001.
- Tareas derivadas TASK-526..TASK-531: Pendientes.
- **Siguiente tarea cronológica:** TAREA-F7-IMP-04, “Incorporar planificación masiva y optimización de horarios”.
