# AUDITORÍA TAREA-F7-IMP-15
## Incorporar control de concurrencia y protección de operaciones críticas

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-1016CST (identificador documental; no es un ID nativo de ChatGPT).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **Rama base protegida:** NG_beta_0.0.0.1.
- **HEAD de partida verificado:** f63f3c8aee5596d55f2a56eb332f261c12c4ed6e (C1.246).
- **HEAD de rama base:** 44d9891132332e692dbe2ba8602b41f50a508a59.
- **Tarea auditada:** TAREA-F7-IMP-15, marcada [X] en completadas.md.
- **Dictamen:** **NO CUMPLE**.
- **Severidad global:** **ALTA/P1**. La protección de concurrencia es parcial y no cubre todos los escritores del mismo conjunto de datos; el versionado optimista no está integrado de extremo a extremo y varias operaciones multi-registro pueden dejar cambios parciales.
- **Criterios:** CA-F7-93 NO CUMPLE; CA-F7-94 NO CUMPLE; CA-F7-95 NO CUMPLE; CA-F7-96 CUMPLE PARCIAL; CA-F7-97 NO CUMPLE; CA-F7-98 NO CUMPLE.

## 1. Alcance y fuentes

Se contrastaron los diez requisitos funcionales y los seis criterios CA-F7-93..98 con el código vigente, las rutas de escritura relacionadas, los consumidores de UI, las pruebas y los informes de auditoría anteriores.

Fuentes inspeccionadas:
- `backend/academic-service/Code.gs`:
  - `withConcurrencyLock` y `runConcurrencyAndConsistencySuite` (3277-3325).
  - `importBulkClassSchedules` (3430-3525).
  - `generateAutoSchedules` (6335-6458).
  - `getClassSchedules` (6718-6768).
  - `getTeacherTeachingLoad` (6773-6841).
  - `saveTeacherWorkLoadPreferences` (6842-6875).
  - `createClassSchedule` (6900-6991).
  - `deleteClassSchedule` (6992-7007).
  - `publishClassSchedules` (7008-7118).
  - `restoreScheduleVersion` (7224-7317).
  - `copyClassSchedules` (7317-7492).
  - `checkScheduleConflict` (7493-7693).
  - `saveClassroomResource` (7752-7796).
  - `saveClassroomMaintenance` (7797-7836).
  - `applyScheduleTemplate` (14000-14080).
  - `runAcademicPlanningRegressionSuite` (14080-14173).
  - `doPost` y su manejo de autorización/errores (671-975).
- `js/teacher.js`: invocaciones de `createClassSchedule` (738-747 y 769-782), importación masiva (936-989), publicación masiva (1051-1068), mantenimiento de aulas (2605-2625) y guardado de recursos (2654-2675).
- `tests/regression/academic-grading-suite.js` (412 líneas) y `tests/regression/modular-dashboard-suite.js`.
- `completadas.md`, `Pendientes.md` recuperado por blob, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`, `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/Contexto_personal.txt` e informes IMP-13 e IMP-14.

La inspección fue manual y estática. No se modificó código fuente ni se ejecutaron operaciones contra hojas productivas.

## 2. Integridad documental y estado histórico

- **completadas.md:** SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`. TAREA-F7-IMP-15 aparece marcada [X] en las líneas 4382 en adelante; sus diez requisitos y CA-F7-93..98 se conservaron como fuente de alcance. La marca histórica no se considera evidencia de funcionamiento.
- **Pendientes.md:** la lectura convencional de la ruta devolvió 0 caracteres tanto en UTF-8 como en base64, pero el blob Git `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` se recuperó íntegramente desde el objeto Git de la rama. Validación: 1.782.094 caracteres, 20.182 líneas, 0 caracteres U+FFFD y 511 IDs TASK únicos (TASK-001..TASK-511). El blob coincide con el SHA de la ruta; no se restaura ni sobrescribe porque el objeto íntegro ya está presente en la rama. No contiene el identificador TAREA-F7-IMP-15.
- **Informe individual:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-15.md` no existía (404); se realiza esta auditoría directamente.
- **Documento fuente declarado por completadas.md:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` no existe en la rama (404). No se reconstruye ni se inventa; se utilizan los requisitos completos de completadas.md.
- **Informes anteriores:** IMP-13 e IMP-14 sí contienen la sección exacta `Tareas ejecutables derivadas de los hallazgos`. Se conserva esa estructura en este informe.
- **IDs derivados existentes:** el plan de auditoría llega hasta TASK-604. Las nuevas tareas de este informe comienzan en TASK-605 y TASK-606 para evitar duplicados.
- **Relaciones previas:** AUD-NG-248 amplió TAREA-F7-IMP-15 para atomicidad de importación; AUD-NG-249 la amplió para atomicidad de publicación. Esas ampliaciones se conservan y se extienden, sin crear otra tarea genérica de atomicidad.

## 3. Evidencia técnica

### 3.1 El bloqueo no cubre todos los escritores del mismo recurso

**`createClassSchedule` (6900-6991).**
- Adquiere `LockService.getScriptLock()` con `tryLock(10000)`, vuelve a leer `HorariosClase`, ejecuta `checkScheduleConflict` y escribe el horario dentro de la sección protegida.
- `publishClassSchedules` (7008-7118) e `importBulkClassSchedules` (3430-3525) también adquieren el bloqueo de script.
- `saveClassroomResource` (7752-7796) y `saveClassroomMaintenance` (7797-7836) utilizan bloqueos de script con espera máxima de 8 segundos.
- Sin embargo, otros escritores de las mismas entidades no adquieren ese bloqueo:
  - `deleteClassSchedule` (6992-7007) lee y cambia el estado sin LockService.
  - `generateAutoSchedules` (6335-6458) valida y agrega múltiples borradores sin bloqueo.
  - `copyClassSchedules` (7317-7492) lee la matriz, valida y agrega filas sin bloqueo.
  - `restoreScheduleVersion` (7224-7317) valida y modifica varias filas sin bloqueo.
  - `applyScheduleTemplate` (14000-14080) agrega múltiples horarios sin bloqueo.
  - `saveTeacherWorkLoadPreferences` (6842-6875) modifica las restricciones horarias del docente sin bloqueo.
- Estos escritores pueden intercalarse con operaciones protegidas. El bloqueo de `createClassSchedule` no excluye a un escritor que no lo solicita; por tanto, no garantiza que la validación y la escritura sean una sección crítica común para todos los cambios sobre docentes, aulas y horarios.
- `checkScheduleConflict` (7493-7693) no adquiere un bloqueo propio; depende de que el llamador lo proteja. No todos los llamadores lo hacen.
- `withConcurrencyLock` (3277-3291) centraliza una adquisición y liberación en `finally`, pero las funciones de planificación revisadas implementan bloqueos separados o no usan ninguno. La mera existencia del helper no prueba su aplicación universal.

**Conclusión:** hay exclusión mutua parcial, pero no se cumple CA-F7-93 porque una operación sin bloqueo común puede confirmar una asignación incompatible durante la validación/escritura de otra operación.

### 3.2 El versionado optimista no está conectado de extremo a extremo

**Backend: `createClassSchedule` (6900-6991).**
- Recibe `lastUpdated` y solo ejecuta la comparación cuando también existen `horarioId`, `lastUpdated` y filas de datos.
- Rechaza si `existingRow[8]` es posterior al timestamp recibido. Si el cliente omite `lastUpdated`, no existe rechazo por edición obsoleta.
- La comprobación no exige una versión esperada ni compara un token obligatorio; tampoco produce un código estable de conflicto de actualización.
- `getClassSchedules` (6718-6768) no devuelve `lastUpdated` ni un número de revisión en el DTO que entrega al cliente.

**Frontend: `js/teacher.js`.**
- Las invocaciones inspeccionadas de `createClassSchedule` (738-747 y 769-782) envían oferta, día, hora, aula y docente; no envían `horarioId` ni `lastUpdated`.
- Por tanto, la comparación opcional implementada en backend no queda alimentada por el flujo de UI inspeccionado.
- `saveClassroomResource` (2654-2675) envía los campos del aula sin timestamp ni versión esperada. El backend actualiza los campos existentes sin detectar si el registro cambió desde que fue consultado.

**Conclusión:** CA-F7-94 y CA-F7-95 NO CUMPLEN. Existe una comprobación condicional aislada, pero no un contrato obligatorio de lectura-versión-edición-confirmación.

### 3.3 Revalidación de disponibilidad y consistencia de estado

- `createClassSchedule` ejecuta `checkScheduleConflict` después de adquirir su bloqueo. `publishClassSchedules` también revalida los borradores mientras mantiene el bloqueo.
- `checkScheduleConflict` consulta carga docente, jornada laboral, calendario, matrícula/capacidad, restricciones curriculares, horarios persistidos y mantenimiento de aulas. Esto aporta controles reales de disponibilidad.
- No obstante, las rutas sin bloqueo descritas en 3.1 pueden cambiar los datos que esas comprobaciones consultan.
- `getTeacherTeachingLoad` (6773-6841) excluye únicamente filas cuyo estado en r[7] sea `Inactivo`; puede sumar Borrador y Cancelado como carga del docente. La semántica de estados ya está relacionada con AUD-NG-247/TASK-591.
- El bloque de restricciones curriculares de `checkScheduleConflict` captura excepciones y solo las escribe en Logger; la ejecución puede continuar sin transformar el fallo de validación en un error que bloquee la operación.
- La disponibilidad se vuelve a consultar en ciertos flujos, pero no existe una garantía global porque algunos escritores no comparten el bloqueo y los estados no están normalizados.

### 3.4 Operaciones multi-registro sin atomicidad ni recuperación completa

- **Importación masiva** (`importBulkClassSchedules`, 3430-3525): utiliza LockService, pero escribe cada fila con `setValues` o `appendRow`; no implementa rollback ni estado durable por lote. Un error después de varias filas puede dejar cambios parciales. Relación directa con AUD-NG-248.
- **Publicación** (`publishClassSchedules`, 7008-7118): cambia el estado fila por fila. No hay staging, rollback ni reconciliación por lote. La instantánea de versión se guarda después; su fallo se captura como WARN y el flujo puede devolver success. Relación directa con AUD-NG-249.
- **Restauración** (`restoreScheduleVersion`, 7224-7317): modifica o agrega filas una por una y registra la nueva versión después; no utiliza LockService ni rollback.
- **Copia** (`copyClassSchedules`, 7317-7492): agrega borradores individualmente sin bloqueo ni rollback.
- **Generación automática** (`generateAutoSchedules`, 6335-6458): agrega horarios mientras recorre ofertas; no existe una fase de staging ni reversión del lote.
- **Mantenimiento de aula** (`saveClassroomMaintenance`, 7797-7836): primero agrega el registro de mantenimiento y luego cambia el estado del aula en otra hoja. Si falla la segunda escritura, el mantenimiento queda registrado sin que el estado del recurso se actualice.
- Estas rutas no proporcionan un identificador durable de operación, estado por registro, rollback o reconciliación uniforme. LockService por sí solo no convierte múltiples escrituras de Google Sheets en una transacción.

**Conclusión:** CA-F7-97 NO CUMPLE. Se amplía la misma TAREA-F7-IMP-15 para cubrir todas las operaciones multi-registro relacionadas, además de las ampliaciones previas de importación y publicación.

### 3.5 Errores de concurrencia y trazabilidad

- Los tiempos de adquisición observados son 8, 10 o 15 segundos según la función. Algunos mensajes piden reintentar y el error de timestamp identifica `horarioId`; los conflictos de planificación también incluyen razones y, en algunas rutas, IDs de fila.
- No hay un contrato uniforme de códigos para distinguir conflicto de planificación, versión obsoleta, contención/timeout del bloqueo y fallo parcial de persistencia.
- `checkScheduleConflict` devuelve `hasConflict` y `reason`; la comparación de timestamp lanza un Error genérico.
- `doPost` captura excepciones y registra `UNHANDLED_EXCEPTION` con el payload, pero los resultados que regresan directamente como `status: "error"` no pasan por ese catch. No se observa un registro estructurado específico por entidad/fila para cada rechazo o fallo de concurrencia.
- El sistema puede comunicar algunos errores, pero no garantiza que todos permitan identificar inequívocamente el registro y el tipo de conflicto.

**Conclusión:** CA-F7-96 CUMPLE PARCIAL. Hay mensajes y algunos identificadores, pero faltan códigos estables, clasificación y trazabilidad consistente.

### 3.6 Duración y alcance del bloqueo

- Las funciones protegidas usan `getScriptLock()`, que serializa ejecuciones del proyecto Apps Script, no solamente las operaciones sobre una fila o aula concreta.
- `createClassSchedule` mantiene el bloqueo durante lectura, comprobación de conflictos, escritura, registro y creación best-effort de notificación.
- `publishClassSchedules` mantiene el bloqueo mientras recorre borradores, vuelve a consultar datos de conflicto por bloque, escribe estados y trata de guardar una instantánea.
- `importBulkClassSchedules` mantiene el bloqueo durante validación de cada fila y escrituras.
- No se registran duración efectiva, espera acumulada ni métricas para demostrar que el bloqueo no permanece ocupado durante periodos excesivos. Los límites de espera evitan espera indefinida para adquirirlo, pero no acreditan que la sección crítica sea corta.
- Los escritores que no toman el mismo bloqueo impiden que la serialización parcial se convierta en protección integral.

### 3.7 Pruebas de concurrencia y regresión

- `runConcurrencyAndConsistencySuite` (3293-3325) ejecuta una sola llamada a `withConcurrencyLock` y comprueba que el callback retorne `executed`. No crea dos ejecuciones concurrentes, no fuerza una carrera y no prueba exclusión entre escritores distintos.
- `runAcademicPlanningRegressionSuite` (14080-14173) cubre TC-F7-01..07 con comprobaciones de forma/retorno para conflictos, carga, restricciones, capacidad, sustituciones, plantillas y logs. No prueba CA-F7-93..98.
- `tests/regression/academic-grading-suite.js` (412 líneas) no contiene pruebas específicas de TAREA-F7-IMP-15 ni escenarios de concurrencia de horarios. `tests/regression/modular-dashboard-suite.js` tampoco aporta evidencia de dos escrituras simultáneas sobre la misma asignación.
- No se ejecutaron pruebas de integración en Apps Script ni pruebas con dos sesiones/usuarios; tampoco se inyectaron fallos en escrituras de Sheets.

**Conclusión:** CA-F7-98 NO CUMPLE. La existencia de una prueba unitaria de adquisición/liberación no demuestra la integridad frente a concurrencia real.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-93 | NO CUMPLE | No todos los escritores de HorariosClase/recursos usan el mismo bloqueo; hay rutas sin LockService que pueden intercalarse con validación y escritura. |
| CA-F7-94 | NO CUMPLE | El timestamp es opcional; la lectura no lo devuelve y la UI no lo envía. |
| CA-F7-95 | NO CUMPLE | No existe versión esperada obligatoria; recursos y varias rutas de horario sobrescriben sin compare-and-set. |
| CA-F7-96 | PARCIAL | Algunos errores incluyen horarioId/razón, pero faltan códigos uniformes y registro por entidad; errores devueltos como status:error no se registran en el catch de doPost. |
| CA-F7-97 | NO CUMPLE | Importación, publicación, restauración, copia, generación y mantenimiento realizan escrituras secuenciales sin rollback/reconciliación uniforme. |
| CA-F7-98 | NO CUMPLE | Las suites comprueban un lock aislado o la forma de una respuesta; no simulan concurrencia real ni fallos parciales. |

## 5. Hallazgo nuevo

### AUD-NG-250 (ALTO/P1) - Protección de concurrencia incompleta y ausencia de versionado obligatorio en planificación de horarios

- **Archivos afectados:** `backend/academic-service/Code.gs`, `js/teacher.js`, `tests/regression/academic-grading-suite.js`, `tests/regression/modular-dashboard-suite.js`.
- **Ubicación:** funciones y rangos enumerados en la sección 1.
- **Descripción:** el uso parcial de ScriptLock no cubre todas las mutaciones sobre horarios, docentes y aulas; la protección de versiones depende de un timestamp opcional que no se transporta por la interfaz; operaciones multi-registro carecen de atomicidad y recuperación; las pruebas no ejercitan carreras reales.
- **Impacto:** asignaciones incompatibles, sobrescritura de cambios recientes, divergencia entre estado de mantenimiento y disponibilidad del aula, matrices parcialmente aplicadas y resultados de error sin identificación consistente.
- **Dependencias:** LockService, HorariosClase, SedesAulas, MantenimientoAulas, HorariosLaborales, VersionesHorarios, `checkScheduleConflict`, `getTeacherTeachingLoad`, `getClassSchedules`, `createClassSchedule`, `publishClassSchedules`, importación/restauración/copia/plantillas y sus suites.
- **Relaciones:** AUD-NG-248, AUD-NG-249, AUD-NG-247, TASK-587, TASK-591, TASK-598, TASK-602 y TAREA-F7-IMP-15.

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

#### [TASK-605] Unificar la exclusión mutua de todas las mutaciones de horarios y recursos
- **Hallazgo de origen:** AUD-NG-250, secciones 3.1 y 3.6.
- **Severidad:** Alto.
- **Objetivo:** impedir que cualquier escritor relacionado cambie horarios, disponibilidad docente o recursos mientras otra operación está validando y confirmando una asignación incompatible.
- **Acción ejecutable:** centralizar la adquisición/liberación del bloqueo y aplicarla de forma consistente a creación, edición, eliminación, importación, publicación, generación automática, copia, restauración, plantillas, preferencias laborales, recursos y mantenimiento. Evitar rutas públicas que omitan la exclusión; reducir el trabajo dentro de la sección crítica y medir la espera/duración.
- **Archivos/módulos afectados:** `backend/academic-service/Code.gs`; pruebas de regresión relacionadas.
- **Dependencias y riesgos:** LockService, `checkScheduleConflict`, HorariosClase, SedesAulas, HorariosLaborales, MantenimientoAulas, TASK-587, TASK-598 y TAREA-F7-IMP-15. Un bloqueo global excesivo puede afectar operaciones no relacionadas; evaluar alcance y duración sin dejar escritores sin protección.
- **Alcance:** operaciones de planificación de horarios y recursos vinculados; no rediseñar otros servicios fuera de esta tarea.
- **Criterios de aceptación:** todos los escritores del conjunto usan un mecanismo común; dos operaciones concurrentes incompatibles no pueden confirmar ambas; el bloqueo se libera en éxito/error/timeout; el timeout tiene código estable y permite reintentar; se mide duración y no se introducen bloqueos anidados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

#### [TASK-606] Hacer obligatorio el versionado optimista en la edición de horarios y recursos
- **Hallazgo de origen:** AUD-NG-250, secciones 3.2 y 3.5.
- **Severidad:** Alto.
- **Objetivo:** impedir que una edición basada en datos obsoletos sobrescriba cambios confirmados por otro usuario.
- **Acción ejecutable:** devolver `lastUpdated` o una revisión monotónica en las consultas; exigir la versión esperada en cada actualización; comparar y escribir bajo el bloqueo; incrementar la versión al guardar; aplicar el mismo contrato a recursos de aula; devolver un error estructurado `STALE_VERSION` con entidad/ID y permitir recargar/reconciliar en la UI.
- **Archivos/módulos afectados:** `backend/academic-service/Code.gs`, `js/teacher.js`, componentes de consulta/edición de horarios y recursos en `teacher-dashboard.html`, pruebas.
- **Dependencias y riesgos:** TASK-605, TASK-587, `getClassSchedules`, `createClassSchedule`, `saveClassroomResource`, `saveTeacherWorkLoadPreferences` y el contrato de API. La versión debe conservar compatibilidad de lectura histórica sin aceptar escrituras sin token.
- **Alcance:** control de versiones de horarios y recursos incluidos en TAREA-F7-IMP-15; no introducir una migración de almacenamiento no justificada.
- **Criterios de aceptación:** una actualización sin versión esperada se rechaza; una versión coincidente se acepta; una versión obsoleta se rechaza con código y entidad identificables; el token cambia después de guardar; dos ediciones simultáneas no sobrescriben silenciosamente; la UI ofrece recargar y reconciliar.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

### Tareas existentes ampliadas (sin duplicar IDs)

- **TAREA-F7-IMP-15:** ampliar su alcance de atomicidad y consistencia multi-registro a `restoreScheduleVersion`, `copyClassSchedules`, `generateAutoSchedules`, `applyScheduleTemplate` y `saveClassroomMaintenance`, además de las ampliaciones ya registradas para `importBulkClassSchedules` y `publishClassSchedules`. Exigir prevalidación, staging/operación identificable, all-or-none o recuperación/reconciliación verificable, estado por fila y liberación garantizada del bloqueo.
- **TASK-602:** ampliar la suite de regresión para CA-F7-93..98: dos escritores simultáneos sobre docente/aula/horario; escritor protegido frente a ruta sin bloqueo; token ausente/igual/obsoleto; timeout y reintento; fallo inyectado en cada etapa de lote; rollback/reconciliación; mantenimiento multi-hoja; verificación de logs/códigos y liberación de locks.
- **TASK-587:** ampliar la invalidación de caché y frescura de horarios para que todas las rutas de mutación invaliden las claves pertinentes y la UI descarte respuestas/versiones obsoletas después de cambios concurrentes.
- **TASK-591:** asegurar que las validaciones de carga y conflictos excluyan los estados no vigentes según un contrato canónico, sin contabilizar Borrador/Cancelado como carga activa cuando no corresponda.
- **TASK-598:** integrar los candidatos del mismo lote en la detección de conflictos bajo el mismo protocolo de exclusión, sin duplicar el trabajo de TASK-605.

### Tareas ya cubiertas por otro ID
- No crear otra tarea genérica de atomicidad: las operaciones multi-registro permanecen dentro de TAREA-F7-IMP-15.
- No crear otra suite paralela de regresión: ampliar TASK-602.
- No duplicar la invalidación/frescura de horarios: ampliar TASK-587.
- No duplicar la semántica de estados/carga: ampliar TASK-591.

## 7. Pruebas y límites

- **Ejecutadas:** inspección estática/manual de las funciones de bloqueo, creación, edición, eliminación, publicación, importación, restauración, copia, generación automática, recursos, mantenimiento, consulta y pruebas; lectura de requisitos y registros; verificación de SHAs, rama y comparación Git; recuperación del blob íntegro de Pendientes.md.
- **No ejecutadas:** runtime de Apps Script; pruebas reales con dos sesiones; concurrencia sobre Google Sheets; inyección de fallos de escritura; validación de tiempos productivos; pruebas Node; navegador/DOM; E2E.
- **Datos productivos:** no consultados ni modificados.
- **Código y pruebas:** sin cambios.
- **Estado histórico:** la marca [X] en completadas.md se preserva; el dictamen técnico es NO CUMPLE.

## 8. Archivos y SHAs de respaldo

- `backend/academic-service/Code.gs`: `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`.
- `js/teacher.js`: `c475fce5afcd28fca23e7b64398ad32b17773746`.
- `tests/regression/academic-grading-suite.js`: `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`.
- `tests/regression/modular-dashboard-suite.js`: `0495e1d526a872c33310935a003a83d924d34683`.
- `completadas.md`: `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- `Pendientes.md`: blob `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`.
- `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`: `a8e62c516db0b6362df89ff444c866c1380c510b`.
- `AUDITORIAS/Auditoria.txt`: `e24269c3c9105e8361f67e9d504d3210a5072a6a`.
- `AUDITORIAS/MapaDependencias.md`: `b908bde5f097a1e37f0efa5af9ea8e9078346ef5`.
- `AUDITORIAS/Contexto_personal.txt`: `7b5a7b6d1f35b0476682b8ac120e68d13d0af09f`.
- `METODOLOGIA_DESARROLLO.md`: SHA verificado en C1.246 `cf796728bb384a32537392df2f9c72a339fa03ee`.
- **Informe nuevo:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-15.md`.
- **Documentos actualizados:** `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`, `AUDITORIAS/Contexto_personal.txt`.
- **Sin cambios:** código, JS, HTML, pruebas, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, metodología y rama base.

## 9. Continuidad

- **Última tarea completamente auditada:** TAREA-F7-IMP-15, dictamen NO CUMPLE.
- **Tarea en curso al cierre:** ninguna.
- **Siguiente tarea exacta:** TAREA-F7-IMP-16, gestión de sustituciones y reasignación de clases afectadas. Antes de auditarla, buscar su informe individual y origen; si falta cualquiera, revisar los requisitos completos de completadas.md y auditar directamente el código vigente.
