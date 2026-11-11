# AUDITORÍA FUNCIONAL Y TÉCNICA — TAREA-F7-IMP-25
## Batería automatizada de regresión, integración y calidad de planificación académica

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-2032Z-01 (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial de continuidad:** C1.254, último checkpoint válido designado expresamente por el usuario. No se adopta C1.255 como checkpoint válido.
- **HEAD real auditado:** fe8b1d5c6c475f40129ef287356775193007b58e; **Tree SHA:** 063d1cfdd77d99aa91daefb3fb0e1ccd862b67af.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **Rama base protegida:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; comparación: 328 commits adelante, 0 detrás. La rama base no se modifica.
- **Estado en completadas.md:** [X] histórico; no equivale a certificación funcional.
- **Prioridad:** P1.
- **Dictamen global:** **NO CUMPLE**.
- **Fuente primaria:** completadas.md, TAREA-F7-IMP-25, líneas 4726-4755 aprox., SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Informe individual esperado:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-25.md; no existía, se ejecutó esta auditoría directamente.
- **Plan de Fase 7 esperado:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md; no localizado ni en raíz ni en AUDITORIAS/. Se usó el alcance íntegro de completadas.md y la evidencia de código.

---

## 1. Alcance y criterios de aceptación

La tarea requiere una batería automatizada reproducible para creación/actualización de horarios; conflictos docentes, de aulas y secciones; disponibilidad laboral y carga docente; excepciones de calendario; programación de evaluaciones; sustituciones; publicación/cancelación; notificaciones y deduplicación; permisos; integración con asistencia y portales; casos límite, entradas inválidas y errores de persistencia; atomicidad ante fallos; concurrencia; correspondencia entre datos persistidos y vistas; separación de pruebas unitarias, integración y extremo a extremo; datos controlados sin modificar información real; registro de resultados y repetibilidad.

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-148 | NO CUMPLE | Los siete casos TC-F7-01..07 no cubren los requisitos críticos ni son pruebas conductuales reproducibles. |
| CA-F7-149 | NO CUMPLE | TC-F7-01 solo verifica que checkScheduleConflict devuelva un objeto; no afirma conflicto ni causa esperada. |
| CA-F7-150 | NO CUMPLE | No hay escenario positivo de asignación válida ni verificación de persistencia. |
| CA-F7-151 | NO CUMPLE | No hay pruebas de denegación por rol, ámbito ni acción restringida. |
| CA-F7-152 | NO CUMPLE | No se simulan errores de escritura, rollback ni consistencia tras fallos. |
| CA-F7-153 | NO CUMPLE | No hay integración comprobada entre planificación, asistencia, portales, notificaciones y almacenamiento. |
| CA-F7-154 | PARCIAL | La suite devuelve resultados por caso y registra el evento; si una prueba lanza excepción, el catch devuelve solo error y pierde los resultados parciales/no ejecutados. |

## 2. Procedimiento e integridad documental

Se verificaron rama de trabajo, HEAD, árbol, rama base y comparación; se consultó completadas.md y Pendientes.md; se buscó el informe individual y el plan de Fase 7; se inspeccionaron manualmente las suites, funciones de planificación, control de acceso, helpers de persistencia y funciones invocadas por los casos; y se revisó el historial ChangesLogs.

### Integridad documental
- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TAREA-F7-IMP-25 marcada [X] con 10 requisitos y CA-F7-148..154.
- **Informe individual IMP-25:** NOT_FOUND antes de esta auditoría.
- **Plan de Fase 7:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, NOT_FOUND en raíz y AUDITORIAS.
- **Pendientes.md:** blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado directamente después de la lectura convencional vacía; 1.782.094 caracteres y 20.182 líneas, sin U+FFFD. El contenido histórico no incluye IMP-25 ni TASK-633..635. No se modificó.
- **ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; no contiene un registro de implementación verificable para IMP-25. Los registros de Fase 7 documentan tareas anteriores, pero no acreditan que la batería requerida se haya construido y ejecutado.
- **Normalización:** este informe incorpora la sección obligatoria «Tareas ejecutables derivadas de los hallazgos». No se crea un registro maestro separado.

## 3. Evidencia técnica

### 3.1 Suite principal — AUD-NG-277
**backend/academic-service/Code.gs**, SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
- `runAcademicPlanningRegressionSuite(payload)`, líneas 14109-14173, declara siete casos TC-F7-01..07.
- **TC-F7-01**, líneas 14123-14133: invoca `checkScheduleConflict` con docente/aula de prueba, pero solo comprueba `tc1 !== null && typeof tc1 === "object"`. No verifica `hasConflict`, tipo de conflicto, motivo ni rechazo de solapamiento.
- **TC-F7-02**, líneas 14135-14136: solo verifica que `getTeacherTeachingLoad` devuelva un objeto; no compara horas, límite, distribución, exclusión del horario editado ni exceso.
- **TC-F7-03..07**, líneas 14138-14151: verifican únicamente status/forma de arreglos para restricciones, capacidad, sustituciones, plantillas y logs. Un resultado vacío puede superar la prueba.
- No se prueban creación/actualización/publicación/cancelación de horarios, excepciones, programación de evaluaciones, disponibilidad laboral, notificaciones/deduplicación, permisos, asistencia, vistas de portales, entradas inválidas, persistencia fallida ni rollback.
- El `try/catch` envuelve la batería completa. Una excepción detiene los casos restantes; la rama catch devuelve `status: "error"` y `message`, sin `testResults`, conteo ni identificación de casos no ejecutados.
- La respuesta normal devuelve `status: "success"` aun cuando `allPassed` sea false; el consumidor debe interpretar el booleano y no solo status.

### 3.2 Conflictos y carga — pruebas insuficientes
- `checkScheduleConflict`, líneas 7493-7720 aprox., contiene lógica para límites de carga, calendario no lectivo, disponibilidad, capacidad, mantenimiento y solapamientos de aula/docente/oferta. Sin embargo, TC-F7-01 no verifica ninguna de esas reglas ni escenarios positivos/negativos.
- `getTeacherTeachingLoad`, líneas 6773-6840, lee HorariosLaborales y HorariosClase, calcula minutos/horas y límite. TC-F7-02 no valida ningún valor calculado.
- La existencia de lógica de negocio no demuestra que la suite la pruebe.

### 3.3 Concurrencia — AUD-NG-279
- `withConcurrencyLock`, líneas 3278-3294, adquiere un ScriptLock, ejecuta una única función y libera el lock.
- `runConcurrencyAndConsistencySuite`, líneas 3296-3327, realiza una sola adquisición/liberación con callback síncrono que devuelve un objeto de éxito. No lanza dos o más operaciones simultáneas ni compite por los mismos recursos; no verifica duplicados, carreras de publicación, pérdida de actualizaciones, orden ni consistencia posterior.
- La suite no prueba concurrencia en publicación de horarios ni operaciones críticas de Fase 7. Su resultado solo demuestra que una adquisición aislada pudo ejecutarse.
- La función está en el backend académico y se enruta desde doPost; no existe un coordinador F7 equivalente en backend/developer-service.

### 3.4 Aislamiento y efectos laterales — AUD-NG-278
- `runAcademicPlanningRegressionSuite` abre indirectamente el Spreadsheet configurado mediante las funciones de negocio reales; no inyecta repositorio, adaptador, Spreadsheet de prueba ni fixture.
- `getOrCreateSheet`, líneas 84-88, inserta una hoja cuando no existe.
- `getCurricularConstraints`, líneas 13509-13522, crea `RestriccionesCurriculares` y escribe encabezados si falta.
- `getTeacherSubstitutions`, líneas 6570-6575, usa `getOrCreateSheet` para `AsignacionesDocentes`; `getTeacherTeachingLoad`, líneas 6777-6786, hace lo mismo con `HorariosLaborales` y `HorariosClase`; `checkScheduleConflict` usa helpers de hojas operativas.
- `logStructuredEvent`, líneas 52-77, abre el Spreadsheet configurado y agrega una fila en `LogsSistema`; crea esa hoja si no existe.
- No se identificó setup/teardown, borrado seguro de fixtures, restauración del estado inicial ni garantía de que las llamadas no alteren hojas reales. Ejecutar la suite en producción puede crear hojas/encabezados y registros de log. No se ejecutó por este riesgo.

### 3.5 Developer service y suite Node
- **backend/developer-service/Code.gs**, SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412, 2.901 líneas: contiene suites de otras fases y una suite genérica de arquitectura; no se localizó una suite específica F7/IMP-25 ni TC-F7. La suite genérica no sustituye los escenarios funcionales de planificación.
- **tests/regression/academic-grading-suite.js**, SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6, 412 líneas: no contiene referencias a F7-IMP-25, TC-F7 ni `runAcademicPlanningRegressionSuite`. Sus verificaciones relacionadas con tareas posteriores usan principalmente `includes()` sobre el texto de los fuentes, no invocan los flujos de planificación ni verifican sus efectos.
- No se halló separación explícita de pruebas unitarias, integración y E2E para Fase 7.

## 4. Dictamen de requisitos

| Requisito | Dictamen | Motivo |
|---|---|---|
| 1. Identificar pruebas Fase 7 existentes | PARCIAL | Se identifican dos funciones en backend académico; el inventario no está convertido en cobertura trazable. |
| 2. Cubrir los 12 grupos funcionales solicitados | NO CUMPLE | Solo siete smoke checks; varios dominios críticos ausentes. |
| 3. Casos límite, datos inválidos y errores de persistencia | NO CUMPLE | No hay escenarios de entradas inválidas ni fallos simulados. |
| 4. Evitar cambios parciales ante fallos | NO CUMPLE | No se prueban rollback/atomicidad. |
| 5. Concurrencia en operaciones críticas | NO CUMPLE | Solo lock aislado, sin competencia concurrente. |
| 6. Relación entre datos persistidos y vistas | NO CUMPLE | No hay integración de persistencia con portales/asistencia. |
| 7. Separar unitarias, integración y E2E | NO CUMPLE | No existe esa estructura para Fase 7. |
| 8. Datos controlados sin modificar información real | NO CUMPLE | Las funciones usan el Spreadsheet configurado y pueden crear hojas/escribir logs. |
| 9. Registrar resultados | PARCIAL | Se devuelven resultados y se llama a logStructuredEvent; los fallos globales pierden el detalle parcial. |
| 10. Repetibilidad tras correcciones | NO CUMPLE | No hay fixtures, aislamiento ni limpieza que aseguren repetición sin contaminación. |

**Dictamen global: NO CUMPLE.** Se conserva la marca [X] histórica en completadas.md; no se altera el registro maestro.

## 5. Hallazgos nuevos

### AUD-NG-277 — ALTO/P1: pruebas de planificación con aserciones superficiales
La batería TC-F7-01..07 valida existencia/forma de respuestas y no resultados de negocio. No demuestra detección de conflictos, asignaciones válidas, permisos, integridad ni cumplimiento de CA-F7-148..153. Un backend que devuelve objetos/arreglos vacíos o incorrectos puede superar varios casos.

### AUD-NG-278 — ALTO/P1: suite acoplada al Spreadsheet institucional y sin aislamiento
Los casos invocan funciones conectadas a SPREADSHEET_ID real. Helpers crean hojas/encabezados si faltan y el logger agrega registros. No existen fixtures aislados ni restauración. La suite no cumple el requisito de evitar modificar información real y su ejecución puede contaminar el entorno institucional.

### AUD-NG-279 — ALTO/P1: ausencia de pruebas reales de concurrencia e integración
La prueba de LockService es secuencial y de una sola operación; no simula carreras ni verifica consistencia. No hay cobertura de publicación concurrente, notificaciones/deduplicación, asistencia, portales, vistas ni separación unit/integration/E2E.

## 6. Hallazgos existentes ampliados, sin duplicación
- **AUD-NG-161 / TASK-612:** ampliar la estrategia de regresión y exigir pruebas conductuales con criterios verificables, resultados parciales y trazabilidad.
- **AUD-NG-252 / TASK-611:** incorporar pruebas negativas de permisos y ámbito para las operaciones de planificación.
- **AUD-NG-236 / TASK-554:** probar contratos y relaciones persistidas entre servicios/portales.
- **AUD-NG-253 / TASK-610:** incluir publicación, cancelación, excepciones y notificaciones en el ciclo de vida.
- **AUD-NG-246 / TASK-562:** verificar consistencia de proyecciones/consultas tras cambios de horario.
No se crean IDs duplicados para esos problemas preexistentes.

## 7. Tareas ejecutables derivadas de los hallazgos

### TASK-633 — Aislar el entorno de pruebas de planificación
- **Hallazgo:** AUD-NG-278.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** ejecutar pruebas sin abrir ni alterar hojas productivas.
- **Acción:** introducir adaptadores/repositorios inyectables o Spreadsheet de pruebas dedicado; fixtures deterministas; setup/teardown; limpieza/restauración; bloquear explícitamente el uso de SPREADSHEET_ID productivo desde el runner.
- **Archivos:** backend/academic-service/Code.gs, backend/developer-service/Code.gs y nuevo soporte de pruebas.
- **Dependencias:** AUD-NG-161/TASK-612.
- **Criterios:** pruebas repetidas no alteran hojas reales; todas las escrituras se dirigen a almacenamiento aislado; fixtures se limpian incluso ante excepción; el runner aborta si detecta configuración productiva.
- **Estado:** Pendiente.

### TASK-634 — Implementar pruebas conductuales trazadas a CA-F7-148..153
- **Hallazgo:** AUD-NG-277.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** demostrar resultados correctos para cada regla crítica de planificación.
- **Acción:** cubrir creación/actualización; conflictos de docente/aula/sección; disponibilidad y carga; excepciones; evaluaciones; sustituciones; publicación/cancelación; notificaciones/deduplicación; permisos/ámbito; asistencia/portales; entradas inválidas y fallos de persistencia; verificar estado previo/posterior y asignaciones válidas.
- **Archivos:** backend/academic-service/Code.gs, backend/developer-service/Code.gs y tests/regression/.
- **Dependencias:** TASK-633; AUD-NG-236/TASK-554; AUD-NG-252/TASK-611; AUD-NG-253/TASK-610.
- **Criterios:** cada CA tiene escenarios positivos/negativos; las pruebas comprueban valores/efectos y no solo tipos; las operaciones inválidas se rechazan sin mutación; cada test es repetible y aislado.
- **Estado:** Pendiente.

### TASK-635 — Añadir concurrencia, integración y reporte reproducible
- **Hallazgo:** AUD-NG-279.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** validar las operaciones críticas bajo concurrencia y la coherencia entre módulos.
- **Acción:** ejecutar operaciones paralelas controladas sobre los mismos recursos; probar publicación/cancelación y deduplicación; verificar integración con asistencia y portales; separar suites unitarias, integración y E2E; registrar runId, versión, casos PASS/FAIL/BLOCKED, duración y errores incluso si el runner aborta.
- **Archivos:** backend/academic-service/Code.gs, backend/developer-service/Code.gs y tests/regression/.
- **Dependencias:** TASK-633 y TASK-634; AUD-NG-161/TASK-612.
- **Criterios:** escenarios concurrentes reproducibles; sin duplicados ni estados parciales; vistas coinciden con almacenamiento; resultados identifican ejecutados/fallidos/no completados; ejecución repetible sin datos productivos.
- **Estado:** Pendiente.

## 8. Pruebas y límites
- **Ejecutadas:** inspección estática manual de las funciones y dependencias citadas; verificación documental; consulta GitHub de rama/HEAD/tree y comparación con base; búsqueda de informe y plan faltantes; recuperación del blob de Pendientes.md.
- **No ejecutadas:** Apps Script runtime, Node suite, HTTP/API, navegador/DOM, Google Sheets productivo, pruebas de rol real, carga/concurrencia real, E2E y operaciones de publicación/cancelación. No se ejecutaron por falta de entorno aislado y por riesgo de escritura en Spreadsheet institucional.
- No se afirma que se haya reproducido una carrera ni una corrupción real; los hallazgos derivan del diseño y de las aserciones observadas.

## 9. Archivos y SHAs de respaldo
- backend/academic-service/Code.gs: df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/developer-service/Code.gs: 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- tests/regression/academic-grading-suite.js: a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- completadas.md: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- Pendientes.md: 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt: 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- METODOLOGIA_DESARROLLO.md: cf796728bb384a32537392df2f9c72a339fa03ee.
- AUDITORIAS/Auditoria.txt: 34b0250136573ab57f1aa20e30b91adac917c1e0.
- AUDITORIAS/MapaDependencias.md: 32ac0efbe82562a1efff384579c418b9b75e466a.
- AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md: ec57009c6982352e2615e7687530dfb25e5e49a9.
- AUDITORIAS/Contexto_personal.txt: b1c266636084f4a45fe71efe6fbdfeb6eeef6116.
- HEAD auditado: fe8b1d5c6c475f40129ef287356775193007b58e; tree: 063d1cfdd77d99aa91daefb3fb0e1ccd862b67af. Rama base: 44d9891132332e692dbe2ba8602b41f50a508a59.

## 10. Cierre
- **TAREA-F7-IMP-25:** NO CUMPLE; se conserva [X] histórica.
- **Hallazgos:** AUD-NG-277, AUD-NG-278 y AUD-NG-279.
- **Tareas derivadas:** TASK-633, TASK-634 y TASK-635.
- **Archivos de auditoría actualizados en esta iteración:** informe individual IMP-25, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Sin cambios:** código backend, JS, HTML, CSS, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Siguiente tarea cronológica:** F8-Task01, «Centralizar y verificar la autorización efectiva de cada operación»; revisar si existe informe individual y auditar directamente si falta.
