# AUDITORÍA DE REVALIDACIÓN - T-UX-28
FECHA: 2026-11-06
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 05537390bb31fd8045fd2e13258ff898b011e010
RAMA BASE: NG_beta_0.0.0.1
HEAD DE LA RAMA BASE: 44d9891132332e692dbe2ba8602b41f50a508a59
CHECKPOINT: C1.71
ID OPERATIVO DE SESIÓN: IMA-AUDIT-20261106-1138Z
INICIO DE SESIÓN: C1.71 (sesión abierta; no es un ID nativo de ChatGPT)
================================================================

## Nota de trazabilidad

El checkpoint C1.70 indicó como siguiente elemento "T-UX-28 - Mejorar el comportamiento de navegación y retorno entre vistas". Sin embargo, el archivo maestro completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676) no contiene un identificador T-UX-28. Para no inventar requisitos ni alterar la secuencia maestra, esta revisión se documenta como revalidación complementaria del alcance de navegación y retorno, tomando como fuente verificable T-UX-11 y las tareas vigentes TASK-485/AUD-NG-188 y TASK-486/AUD-NG-189. No se crea una nueva tarea ni un nuevo hallazgo.

## Dictamen

**NO CUMPLE.** Las brechas históricas de navegación contextual y restauración de estado siguen presentes. Los archivos centrales conservan los mismos SHA documentados en la auditoría T-UX-11; por tanto, no hay evidencia de corrección del router común ni del snapshot de listas. El stack particular de Docente también continúa separado y pierde el texto de búsqueda al avanzar o retroceder.

## 1. Evidencia del router común

**Archivo:** js/ui-common.js  
**SHA:** 986938b8a311a41ed4cb3d135b66b6aaea4bed67

- Líneas 281-385: el manejador handlePopState procesa estados como dashboard-section, hierarchical-nav, academic-menu y modal-close, pero no procesa el contrato {view, params} emitido por switchActiveView.
- Líneas 4864-4902: VIEW_STATES_CACHE es un objeto global en memoria. switchActiveView identifica la vista visible, almacena scrollTop y params: stateParams en el caché de la vista saliente, aunque stateParams corresponde al destino solicitado. El snapshot queda asociado a la vista incorrecta y no representa el estado que se abandona.
- La función agrega {view, params} a history.state y escribe #viewId en la URL. Al volver, solo lee cached.scrollTop; no consume cached.params ni restaura filtros, búsqueda, orden, página, pestaña o selección.
- Si viewId no existe, la función retorna silenciosamente antes de cambiar la vista; no ofrece error, fallback ni destino alternativo.
- Líneas 4904-4917: initNoLoopHistoryManager está definida, pero el informe histórico no encontró inicialización en los módulos y dashboards revisados. El SHA del archivo no ha cambiado, así que no existe evidencia de que se haya corregido esa omisión.
- No se encontró un resolvedor del hash inicial que convierta una URL directa o una recarga en la vista solicitada. Escribir el hash mediante pushState no demuestra que el destino pueda recuperarse al cargar la página.

## 2. Evidencia del stack de Docente

**Archivo:** js/teacher.js  
**SHA:** c475fce5afcd28fca23e7b64398ad32b17773746

- Líneas 3220-3275: pushNav limpia studentSearchInput antes de añadir un nivel. Cuando el nivel es Alumnos, consulta getStudentsByGradoSeccion y asigna res.data a data.students.
- pushNav añade {level, data} a navStack y escribe una copia superficial del array en history.state. No se captura un snapshot explícito de búsqueda, filtros, orden, página, selección o scroll.
- popNav vuelve a limpiar studentSearchInput antes de llamar history.back(); por tanto, el texto de búsqueda no se conserva al regresar.
- syncNavWithState reemplaza navStack por una copia superficial de state.stack y ejecuta renderCurrentLevel('pop'). No restaura el texto de búsqueda ni un contrato completo de estado de lista.
- La navegación jerárquica del Docente sigue usando navigateTo/pushNav/popNav/syncNavWithState, separada del contrato {view, params} de switchActiveView. La inclusión de data.students en el objeto de historial también requiere revisar minimización de datos y evitar snapshots con información personal innecesaria.

## 3. Cobertura de los demás paneles

Los SHA actuales coinciden con los del informe histórico T-UX-11:

- js/student.js: e2888cea60322e49a40b89adadb8010489605dcc.
- js/accounting.js: a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7.
- js/secretary.js: 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- dashboard-direccion.html: fefaa3bf7884288aef563cfb8aaf244e6cea8b7c.
- dashboard-recursos-humanos.html: 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee.
- dashboard-contabilidad.html: b7653b3bff71829f0f67cf47cb894413c56a444a.
- student-dashboard.html: 6379ea0ed39d71b89747a0280bb925fdf12202c1.
- teacher-dashboard.html: cbb9e6a272a7d8ad33f99727303305d950533e71.
- dashboard-secretaria.html: fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- dashboard-coordinacion.html: 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896.

La auditoría T-UX-11 ya documentó que Estudiante y Contabilidad no consumen switchActiveView ni VIEW_STATES_CACHE, y que no se encontró un contrato común equivalente en los dashboards revisados. La igualdad de SHA confirma que esos archivos no han cambiado desde aquella evidencia. Esta conclusión queda limitada a los módulos y dashboards identificados; no afirma una prueba dinámica exhaustiva de toda la aplicación.

## 4. Reconciliación de backlog y hallazgos

- Pendientes.md, blob SHA 3d01a8a4cffd0d28de2c2b21ee0732e7631f2b3a: TASK-485 y TASK-486 siguen marcadas [ ] Pendiente.
- TASK-485 / AUD-NG-188 cubre el router único, inicialización idempotente, hash/rutas directas, atrás/adelante, rutas inválidas, permisos e integración de los distintos dashboards.
- TASK-486 / AUD-NG-189 cubre snapshot/restauración de filtros, consulta, orden, página, pestaña, selección y scroll; regreso desde detalle, carga directa y aislamiento por usuario/rol.
- T-UX-15 / TASK-429 conserva su alcance de filtros, vistas guardadas y paginación; debe exponer estado restaurable, pero no sustituye TASK-486.
- TASK-493 cubre el modal compartido de detalle y delega la restauración de la lista a TASK-486.
- AUD-NG-173 ya documenta que targetId se pasa desde actividad reciente pero no se consume en switchActiveView. No se duplica ese hallazgo.
- No se crea AUD-NG ni TASK adicional. Se amplía la evidencia de AUD-NG-188/189 y de TASK-485/486.

## 5. Pruebas y límites

Inspección estática/manual de ui-common.js, teacher.js, student.js, accounting.js, secretary.js, siete dashboards, Pendientes.md, completadas.md y los informes T-UX-11/T-UX-15. Se compararon los SHA actuales con la evidencia histórica.

No se ejecutaron navegador/DOM, carga directa, recarga, eventos popstate reales, atrás/adelante, pruebas multiusuario/rol, filtros, paginación, selección, consultas de red ni suites automatizadas. No se afirma que el comportamiento haya sido validado en runtime.

## 6. Cambios de esta iteración

- Código fuente: sin modificaciones.
- Pendientes.md: sin modificaciones; TASK-485/486 ya existen y permanecen pendientes.
- completadas.md: sin modificaciones.
- ChangesLogs.txt: sin modificaciones.
- METODOLOGIA_DESARROLLO.md: sin modificaciones; se aplica la regla existente de ID operativo por sesión.
- Documentación: se registra esta revalidación en Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.

## 7. Estado y continuidad

- Progreso de la lista maestra: 68/183 identificadores; 115 pendientes. No se incrementa el contador porque T-UX-28 no figura como identificador en completadas.md.
- Dictamen: NO CUMPLE.
- Hallazgos/tareas responsables: AUD-NG-188/TASK-485 y AUD-NG-189/TASK-486, ambos pendientes.
- Siguiente acción: reconciliar la secuencia y seleccionar el siguiente identificador oficial aún no auditado directamente desde completadas.md; no asumir T-UX-29 sin fuente.
- Próxima inspección reproducible: revisar el registro de tareas UX en completadas.md y después continuar con el siguiente identificador pendiente, conservando las dependencias de TASK-485/486 y sin duplicar hallazgos.

================================================================

## Tareas ejecutables derivadas de los hallazgos

**No se crean hallazgos ni tareas nuevas en esta revalidación.** Las brechas continúan cubiertas por tareas existentes.

### [TASK-485] Router único y navegación entre vistas (AUD-NG-188)
- **Tipo:** tarea existente ya responsable; no duplicar.
- **Hallazgo:** AUD-NG-188, contrato común de navegación, history.state/hash y resolución de rutas incompletos.
- **Objetivo/acción:** implementar router común idempotente; procesar {view, params}; resolver carga directa/hash, recarga, atrás/adelante y rutas inválidas; integrar dashboards y validar permisos.
- **Archivos:** js/ui-common.js, módulos de navegación por rol y dashboards incluidos.
- **Dependencias:** autenticación/permisos y contratos de navegación jerárquica.
- **Alcance:** selección/cambio de vista; no sustituye restauración completa de listas.
- **Criterios:** URL directa/recarga recuperan destino autorizado; atrás/adelante funcionan; rutas inválidas tienen fallback; dashboards usan contrato común; no hay acceso a rutas no autorizadas.
- **Prioridad/estado:** conservar valores oficiales de TASK-485.
- **Evidencia:** pendiente; revalidación estática.

### [TASK-486] Snapshot y restauración de estado contextual de listas (AUD-NG-189)
- **Tipo:** tarea existente ya responsable; no duplicar.
- **Hallazgo:** AUD-NG-189, snapshots incompletos o asociados a vista incorrecta; no se restauran consulta, filtros, orden, página, pestaña, selección y scroll.
- **Objetivo/acción:** capturar estado de vista saliente; restaurar consulta, filtros, orden, página, pestaña, selección y scroll; validar registro/permisos; minimizar datos personales serializados.
- **Archivos:** js/ui-common.js, js/teacher.js, js/student.js, js/accounting.js, js/secretary.js y dashboards integrados.
- **Dependencias:** TASK-485 (router), TASK-493 (modal delega restauración), TASK-429 (filtros/paginación).
- **Alcance:** snapshot/restauración contextual; no sustituye router ni bandeja TASK-221.
- **Criterios:** snapshot pertenece a vista saliente; todos los campos se restauran; registro/permisos se revalidan; carga directa/recarga coordinadas con TASK-485; no se serializan datos innecesarios; pruebas atrás/adelante y regreso desde detalle.
- **Prioridad/estado:** conservar valores oficiales de TASK-486.
- **Evidencia:** pendiente; no se ejecutaron pruebas runtime.

### Tareas relacionadas ya cubiertas
- **AUD-NG-173 / TASK-DOC-C1.114-TUX26-01:** targetId no consumido y navegación al registro concreto; el desarrollo está en el informe T-UX-26, sin duplicarlo aquí.
- **TASK-429:** filtros, vistas guardadas y paginación; coordinar con TASK-486.
- **TASK-493:** modal compartido de detalle; delega restauración de lista a TASK-486.

