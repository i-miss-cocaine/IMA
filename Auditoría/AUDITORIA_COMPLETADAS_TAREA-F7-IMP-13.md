# AUDITORÍA TAREA-F7-IMP-13
## Incorporar importación, exportación y validación masiva de horarios

- **Fecha:** 2026-11-08 (UTC).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** 73ca8960008d79d307fe44b1d86473e5a435b8f6 (C1.244).
- **Árbol de partida:** 8490dbd9e01cf354b8876ef7f8183146e8085d53.
- **Checkpoint de cierre:** C1.245.
- **ID de sesión operativo:** IMA-AUDIT-20261108-0300Z (identificador documental, no ID nativo de ChatGPT).
- **Tarea auditada:** TAREA-F7-IMP-13, marcada [X] en completadas.md.
- **Dictamen:** **NO CUMPLE** (implementación parcial, integración de interfaz ausente y defectos de integridad/validación).
- **Severidad global:** ALTA/P1 por riesgo de escrituras parciales, duplicación de identificadores, conflictos no detectados dentro del lote y discrepancia del contrato de datos.
- **Criterios:** CA-F7-81 NO CUMPLE; CA-F7-82 NO CUMPLE; CA-F7-83 CUMPLE PARCIAL; CA-F7-84 NO CUMPLE; CA-F7-85 NO CUMPLE; CA-F7-86 NO CUMPLE.

## 1. Alcance y fuentes

Se contrastaron los doce requisitos funcionales y seis criterios de aceptación de TAREA-F7-IMP-13 con:
- backend/academic-service/Code.gs: ROLE_PERMISSIONS, getDynamicPermissionsForRole, validateRolePermission, doPost, exportBulkClassSchedules, importBulkClassSchedules, createClassSchedule, getClassSchedules, getTeacherTeachingLoad y checkScheduleConflict.
- teacher-dashboard.html (documento servido completo).
- js/teacher.js: openBulkScheduleImportExportModal y flujo de importación/exportación.
- tests/regression/academic-grading-suite.js, tests/regression/modular-dashboard-suite.js y runAcademicPlanningRegressionSuite.
- completadas.md, Pendientes.md recuperado por blob, ChangesLogs.txt, MapaDependencias y registros de auditoría.
- Integridad Git: rama de trabajo, rama base, HEAD, árbol y SHA de cada fuente.

La inspección del código fue manual y focalizada por función y contrato. No se ejecutaron Apps Script runtime, navegador, llamadas HTTP/OAuth, hojas productivas ni pruebas E2E. No se modificó código ni se ejecutó importación/exportación contra datos reales.

## 2. Integridad documental y estado histórico

- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; líneas 4307-4345. TAREA-F7-IMP-13 aparece marcada [X] y contiene los doce requisitos y CA-F7-81..86. Se conserva la marca histórica, sin modificarla.
- **Pendientes.md:** la lectura ordinaria por ruta devuelve cero caracteres, pero el árbol de C1.244 referencia el blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c. Se recuperó directamente por SHA: 1.782.094 caracteres, 20.182 líneas, cero caracteres U+FFFD; no contiene TAREA-F7-IMP-13 ni el título de esta tarea. La ruta ya referencia el mismo blob, por lo que no se restaura ni modifica. Se consultó únicamente como contraste histórico por la instrucción expresa de esta tarea; no se usa para cambiar estados ni se modifica.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-13.md no existía (404); se crea este informe y se realiza la auditoría desde cero.
- **Documento de origen:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md no existe en la raíz ni en AUDITORIAS. La tarea se audita contra los requisitos explícitos de completadas.md; no se inventa ni se reconstruye el documento fuente.
- **ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; líneas 2381-2390, fecha 2026-10-26. El registro afirma que el modal y botón se incorporaron en teacher-dashboard.html, y que se completó validación estructural, duplicados y traslapes. El código vigente contradice esa afirmación en varios puntos: el HTML servido no contiene el modal ni los controles; el parser no valida la cabecera CSV; la importación no detecta todos los duplicados ni conflictos del lote; no existe reversión transaccional. El registro histórico no prevalece sobre el estado del código.
- **Auditorías previas:** existe informe individual para TAREA-F7-IMP-12, pero no para IMP-13. En los registros no existían AUD-NG-248 ni TASK-597..TASK-602 antes de esta auditoría.

## 3. Evidencia técnica

### 3.1 Backend: exportación

**Archivo:** backend/academic-service/Code.gs, SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.

**Función:** exportBulkClassSchedules (líneas 3403-3427).

- Recibe anoLectivo, pero no lo utiliza para filtrar las filas. Devuelve todos los registros cuyo índice r[7] no sea Inactivo, mezclando años/períodos si existen en la misma hoja.
- El nombre/valor anoLectivo devuelto es el parámetro recibido o el literal "2026"; no es derivado de las filas exportadas. La UI también utiliza ese valor como nombre de archivo.
- El CSV contiene únicamente ocho columnas: HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId y Estado. No incluye UltimaModificacion, que createClassSchedule escribe en la novena columna, ni otros atributos académicos que el contrato de lectura de getClassSchedules espera en las posiciones de grado/sección/estado.
- Los valores se rodean de comillas, pero no se escapan las comillas internas. Un valor que contenga comas, comillas o saltos de línea puede generar un CSV ambiguo o inválido.
- La respuesta del endpoint incluye un arreglo schedules serializable como JSON, pero el controlador de interfaz solo genera una descarga CSV. No existe descarga JSON ni selector de formato en la UI.
- No hay validación de que los registros exportados correspondan al año solicitado, ni una definición versionada del esquema de intercambio.

### 3.2 Backend: importación y validación estructural

**Función:** importBulkClassSchedules (líneas 3430-3517). Su comentario la identifica como [TAREA-F7-IMP-15], aunque la función es la importación de IMP-13 y el exportador sí está etiquetado IMP-13.

- Comprueba que filas sea un arreglo no vacío. No valida el esquema de cada fila ni que cada elemento sea un objeto. Un elemento nulo/incorrecto puede provocar una excepción al leer sus propiedades.
- Solo considera obligatorios diaSemana, horaInicio y horaFin. No valida formato HH:MM, rango horario, horaInicio anterior a horaFin, día dentro del catálogo, estado permitido ni tipos/tamaños de campos.
- Aplica valores por defecto que ocultan datos incompletos: ofertaId = "OFE-DEFAULT", aulaCodigo = "AULA-1", horarioId = "HOR-IMP-" + índice, estado = "Borrador"; docenteUserId puede quedar vacío.
- No valida la existencia de oferta/período, grado, sección, asignatura, docente ni aula referenciados. No consulta OfertaAcademica, AsignacionesDocentes ni catálogos para confirmar la integridad referencial del archivo.
- Los errores de campos mínimos se agregan a conflictos con filaIdx y reason, pero no se distinguen errores de estructura, advertencias y conflictos de planificación. No se devuelven códigos de validación por campo.
- No se valida el encabezado ni el orden de columnas del CSV en el servidor; el backend recibe filas ya transformadas por el cliente.

### 3.3 Conflictos y validación del lote

**Dependencia:** checkScheduleConflict (líneas 7493-7700).

- Cada fila importada llama checkScheduleConflict contra HorariosClase ya persistida. El conjunto validos acumulado del archivo no se agrega a la fuente de conflictos. Dos filas nuevas del mismo archivo que asignen el mismo docente/aula/oferta en intervalos solapados pueden pasar individualmente y ser guardadas juntas.
- El verificador excluye solo registros con r[7] === "Inactivo". Los estados Borrador y Cancelado no se excluyen del recorrido de solapamientos, por lo que pueden bloquear importaciones aunque no deban representar planificación vigente.
- checkScheduleConflict llama getTeacherTeachingLoad para validar carga. Esa función (líneas 6773-6837) excluye Inactivo, pero no separa Borrador/Cancelado; puede producir conflictos de carga por registros que no deberían computar como carga vigente. Este defecto ya se relaciona con AUD-NG-247.
- La validación de capacidad de aula solo compara matrícula cuando consigue un conteo positivo. No exige que el código de aula exista para todos los casos. Tampoco se exige que ofertaId/docenteUserId correspondan a registros existentes.
- Si existen conflictos, el endpoint devuelve una previsualización warning incluso cuando previsualizar es false, y no escribe filas. Esto impide el lote cuando hay conflictos detectados, pero no corrige los conflictos omitidos entre filas del propio archivo.
- No se comprueba una matriz de conflictos completa que incluya las filas nuevas y las filas existentes con estados normalizados.

### 3.4 Duplicados y operaciones

- existingMap se construye una sola vez a partir de las filas existentes. No se actualiza durante el recorrido del archivo, por lo que no detecta duplicados introducidos dentro del mismo lote.
- Si el ID ya existe en la hoja, el registro se agrega a duplicados, pero también se agrega a validos cuando no hay conflicto. La confirmación continúa y actualiza automáticamente la fila existente.
- No existe parámetro de operación para crear, actualizar u omitir. El comportamiento es upsert implícito por horarioId; el usuario no puede seleccionar qué hacer con duplicados.
- Si dos filas nuevas del mismo archivo comparten un horarioId que no existía en la hoja, ambas pueden considerarse válidas y se anexan dos veces con el mismo ID, porque existingMap no se actualiza.
- Si un horarioId ya existe, se sobrescribe sin una confirmación individual ni comparación de cambios. Los duplicados se muestran como contador en UI, pero la lista no se presenta al usuario.
- countInserted incrementa tanto para inserciones como para actualizaciones; el mensaje no distingue operaciones.

### 3.5 Atomicidad, concurrencia y registro

- importBulkClassSchedules adquiere LockService.getScriptLock() con tryLock(15000) y lo libera en finally. Esto protege contra dos importaciones concurrentes que utilicen el mismo script lock.
- La escritura no es transaccional: se ejecuta un setValues o appendRow por cada elemento, en un bucle. Si una escritura posterior falla, las anteriores permanecen aplicadas. No hay snapshot de reversión, staging separado, rollback ni recuperación de un lote parcialmente escrito.
- El lock no equivale a una transacción de Sheets y no revierte las escrituras previas.
- La previsualización retorna antes del bucle de escritura y no cambia las filas de HorariosClase. Sin embargo, getOrCreateSheet y las dependencias de checkScheduleConflict pueden crear hojas auxiliares faltantes; no se encontró escritura de horarios oficiales en la rama previsualizar.
- Tras completar el bucle se registra BULK_SCHEDULE_IMPORTED con totalRecibidos y countInserted. Si una escritura falla antes del registro, doPost captura la excepción y la registra como UNHANDLED_EXCEPTION, pero no existe un registro específico del lote con estado parcial, filas aplicadas, filas fallidas ni mecanismo de reconciliación.
- La función no crea un identificador de operación/lote que permita recuperar con certeza el resultado tras pérdida de respuesta o fallo de red.

### 3.6 Contrato de datos inconsistente con lectores existentes

- createClassSchedule (líneas 6900-6985) persiste nueve valores: HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado y UltimaModificacion. Estado queda en índice 7 y UltimaModificacion en índice 8.
- importBulkClassSchedules escribe ocho columnas y también pone Estado en índice 7.
- exportBulkClassSchedules exporta esos ocho campos e ignora el índice 8.
- getClassSchedules (líneas 6718-6764) interpreta r[7] como grado, r[8] como sección y r[9] como estado; además filtra Cancelado en índices 9/10. Esto no coincide con el esquema de nueve columnas que createClassSchedule escribe ni con el esquema de ocho columnas que importa/exporta IMP-13.
- En consecuencia, un registro importado con Estado=Borrador en r[7] puede ser interpretado por getClassSchedules como grado "Borrador", sección vacía y estado "Activo" por su fallback r[9] || "Activo". La importación/exportación no comparte un contrato de columnas coherente con el principal lector de horarios.
- La discrepancia es verificable en el código actual y puede causar que registros importados aparezcan con estado o atributos académicos incorrectos en consultas posteriores.

### 3.7 Interfaz y disponibilidad funcional

**Archivo:** js/teacher.js, SHA c475fce5afcd28fca23e7b64398ad32b17773746.

- openBulkScheduleImportExportModal (líneas 864-989) define los handlers de exportar, previsualizar y confirmar.
- La función busca modal-bulk-schedule-import-export, btn-export-bulk-schedules-csv, btn-preview-bulk-schedule, btn-confirm-bulk-schedule-import, input-bulk-schedule-file y bulk-import-result-box.
- **teacher-dashboard.html**, SHA cbb9e6a272a7d8ad33f99727303305d950533e71, tiene 1.475 líneas y no contiene ninguno de esos IDs, ni el nombre openBulkScheduleImportExportModal, ni un botón invocador de la función.
- En js/teacher.js la función aparece como definición, pero no existe otra referencia que la invoque. Por tanto, el modal no se puede abrir desde la página servida y el flujo de importación/exportación no está disponible para el usuario desde esa UI.
- El parser JSON usa file.name.endsWith('.json') sensible a mayúsculas/minúsculas. Cualquier otra extensión se interpreta como CSV.
- El parser CSV usa split('\n') y split(',') y elimina todas las comillas con replace(/"/g, ''). No respeta comas/saltos de línea dentro de campos entrecomillados ni comillas escapadas.
- No valida encabezados. Acepta filas con tres columnas como mínimo, aunque las columnas restantes falten; el backend completa defaults.
- La UI solo muestra conteos de válidos/conflictos/duplicados y lista conflictos. No renderiza detalle de duplicados ni operaciones propuestas. Si solo hay duplicados y cero conflictos, presenta "Previsualización Exitosa" y habilita confirmar, aunque el backend los actualizará automáticamente.
- El controlador no ofrece exportación JSON ni selección entre CSV y JSON.

### 3.8 Permisos y dispatcher

**Archivo:** backend/academic-service/Code.gs.

- ROLE_PERMISSIONS (líneas 168-260): Administrador tiene "*"; Director incluye exportBulkClassSchedules e importBulkClassSchedules. Los arrays estáticos de Subdirector, Secretaría, Secretaria y Profesor no incluyen esas dos acciones.
- getDynamicPermissionsForRole (líneas 593-637) puede sobrescribir la matriz estática mediante MatrizPermisosRoles. El contenido productivo de esa hoja no fue consultado, por lo que no se afirma el resultado efectivo para cada rol fuera de la configuración estática.
- validateRolePermission se ejecuta en doPost antes del dispatcher. El dispatcher registra ambas acciones en líneas 819-820. No se encontró una ruta pública directa que evite RBAC.
- El controlador vive en js/teacher.js, pero el HTML no presenta controles ni visibilidad por rol. No se pudo verificar un flujo de UI que corresponda a los permisos estáticos.
- Dictamen de permisos: existe control backend RBAC para Administrador/Director en la matriz estática; falta integración visible y no se certifica la configuración dinámica.

### 3.9 Pruebas

- runAcademicPlanningRegressionSuite (líneas 14080-14173) contiene TC-F7-01..07 y no invoca exportBulkClassSchedules ni importBulkClassSchedules.
- TC-F7-01 y TC-F7-02 cubren aspectos generales de conflicto/carga, no el intercambio masivo. No hay casos para CSV/JSON, referencias inválidas, conflictos entre filas del lote, duplicados, previsualización sin mutación, rollback ni round-trip.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 (412 líneas): no contiene cobertura de TAREA-F7-IMP-13, exportBulkClassSchedules ni importBulkClassSchedules.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683 (61 líneas): verifica modularización/dashboards, no el intercambio masivo de horarios.
- El directorio tests/regression contiene únicamente esos dos archivos.
- No se ejecutaron suites Node ni pruebas de Apps Script/runtime. La conclusión sobre ausencia de cobertura procede de inspección manual del contenido versionado.

## 4. Dictamen por criterio de aceptación

| Criterio | Resultado | Evidencia |
|---|---|---|
| CA-F7-81 | NO CUMPLE | Validación limitada a arreglo no vacío y día/hora requeridos; no hay validación completa de esquema, tipos, encabezados, formato horario ni referencias. |
| CA-F7-82 | NO CUMPLE | Detecta conflictos contra filas persistidas, pero no compara filas entre sí dentro del mismo lote; Borrador/Cancelado también intervienen como conflictos. |
| CA-F7-83 | CUMPLE PARCIAL | El backend retorna antes de escribir en HorariosClase cuando previsualizar=true; el flujo UI no está conectado y getOrCreateSheet puede crear hojas auxiliares. |
| CA-F7-84 | NO CUMPLE | Duplicados existentes se actualizan automáticamente; no hay selección crear/actualizar/omitir; duplicados internos al lote no se detectan. |
| CA-F7-85 | NO CUMPLE | LockService evita concurrencia entre importaciones, pero las escrituras fila a fila no tienen rollback; una excepción puede dejar cambios parciales. |
| CA-F7-86 | NO CUMPLE | CSV no es robusto ante comas/comillas/saltos de línea; no hay descarga JSON; se omite UltimaModificacion y no se respeta el contrato de getClassSchedules. |

## 5. Hallazgo nuevo

- **AUD-NG-248 (ALTO/P1):** intercambio masivo de horarios incompleto e inconsistente. Incluye validación estructural/referencial insuficiente, conflictos intra-lote no detectados, duplicados sin operación explícita, escrituras no transaccionales, exportación no filtrada ni lossless, contrato de columnas incompatible con getClassSchedules y UI no conectada.
- **Relaciones:** AUD-NG-247 (getTeacherTeachingLoad/semántica de estados consumida por checkScheduleConflict); TAREA-F7-IMP-15 (control de concurrencia y operaciones multi-registro); TAREA-F7-IMP-01/02 (motor de conflicto y reglas de planificación).
- **No se afirma** que la existencia de LockService certifique atomicidad. Son propiedades distintas.

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

**TASK-597 - Definir contrato canónico y validación estructural/referencial de importación**
- Hallazgo: AUD-NG-248, secciones 3.2 y 3.6. Prioridad P1. Estado: Pendiente.
- Objetivo: definir un esquema versionado único para CSV/JSON y validar cada fila/campo antes de consultar o escribir.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; pruebas de regresión.
- Dependencias: TAREA-F7-IMP-01, TAREA-F7-IMP-02.
- Aceptación: cabeceras/versión/formato validados; día y horas con catálogo/HH:MM y horaInicio<horaFin; estado enumerado; tipos y campos obligatorios validados; oferta/período/grado/sección/asignatura/docente/aula verificados contra fuentes canónicas; errores por fila y campo; ningún default silencioso sustituye una referencia académica ausente.

**TASK-598 - Detectar conflictos considerando el lote completo y estados normalizados**
- Hallazgo: AUD-NG-248, sección 3.3. Prioridad P1. Estado: Pendiente.
- Objetivo: evaluar cada fila contra horarios persistidos y contra todas las filas candidatas del mismo lote.
- Archivos: backend/academic-service/Code.gs; suite de planificación.
- Dependencias: TASK-597; TAREA-F7-IMP-01/02; ampliación coordinada con TAREA-F7-IMP-15.
- Aceptación: conflictos docente/aula/oferta y restricciones se detectan entre filas nuevas; exclusión por ID solo para la fila que se actualizará; estados Cancelado/Inactivo/Borrador se procesan conforme a reglas documentadas; errores identifican ambas filas y el recurso en conflicto.

**TASK-599 - Implementar resolución explícita de duplicados y operaciones**
- Hallazgo: AUD-NG-248, sección 3.4. Prioridad P1. Estado: Pendiente.
- Objetivo: permitir seleccionar crear, actualizar u omitir y detectar duplicados existentes y dentro del archivo.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- Dependencias: TASK-597.
- Aceptación: duplicados por ID y clave lógica se identifican; el usuario elige operación; omitir no escribe; actualizar requiere permiso y confirma el cambio; IDs repetidos dentro del mismo lote no se anexan; resumen distingue insertados/actualizados/omitidos/rechazados.

**TAREA-F7-IMP-15 (existente, ampliar alcance, no duplicar ID) - Atomicidad específica de importación masiva**
- Hallazgo: AUD-NG-248, sección 3.5. Prioridad P1. Estado: Ampliación requerida.
- Objetivo: completar la garantía de integridad multi-registro para importBulkClassSchedules. La presencia de LockService no reemplaza rollback.
- Archivos: backend/academic-service/Code.gs; almacenamiento/transacción de planificación; pruebas.
- Dependencias: TASK-598 y TASK-599.
- Aceptación: validar todo el lote antes de aplicar; operación all-or-none o staging/commit recuperable; fallo simulado en cualquier fila no deja escrituras parciales sin control; registrar lote, actor, estado, filas aplicadas/fallidas y permitir reconciliación; lock liberado en todos los casos.

**TASK-600 - Exportación CSV/JSON lossless y round-trip**
- Hallazgo: AUD-NG-248, secciones 3.1 y 3.6. Prioridad P2. Estado: Pendiente.
- Objetivo: exportar todos los campos esenciales y relaciones del contrato canónico, con filtros de año/período y formatos CSV/JSON descargables.
- Archivos: backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- Dependencias: TASK-597 y TASK-599.
- Aceptación: CSV cumple reglas de escape y UTF-8; JSON se descarga desde la UI; filtros aplicados corresponden a las filas; se preservan estado, timestamp y relaciones; exportar e importar un mismo archivo conserva los datos esenciales; el lector getClassSchedules consume el mismo esquema.

**TASK-601 - Conectar la herramienta en teacher-dashboard.html y controlar estados de UI**
- Hallazgo: AUD-NG-248, sección 3.7. Prioridad P2. Estado: Pendiente.
- Objetivo: incorporar modal, botón invocador, input de archivo, selector de formato, resumen detallado, revisión de operaciones y confirmación.
- Archivos: teacher-dashboard.html; js/teacher.js; backend/academic-service/Code.gs.
- Dependencias: TASK-597..TASK-600.
- Aceptación: todos los IDs usados existen una sola vez; botón invoca el controlador; roles autorizados ven y ejecutan la herramienta; errores/advertencias/duplicados se distinguen; previsualización no cambia horarios oficiales; confirmación vuelve a validar y muestra resultado del lote.

**TASK-602 - Crear regresión funcional para CA-F7-81..86**
- Hallazgo: AUD-NG-248, sección 3.9. Prioridad P1. Estado: Pendiente.
- Objetivo: cubrir validación, conflictos, previsualización, duplicados, atomicidad, permisos y round-trip.
- Archivos: tests/regression/academic-grading-suite.js o nueva suite específica; backend/academic-service/Code.gs; tests/regression.
- Dependencias: TASK-597..TASK-601 y ampliación de TAREA-F7-IMP-15.
- Aceptación: casos positivos/negativos por CA; filas inválidas y referencias inexistentes; dos filas del mismo lote en conflicto; duplicados internos/existentes por operación; fallo inducido a mitad de escritura sin parcialidad; previsualización sin cambios; exportar/importar CSV y JSON conserva datos; permisos probados por rol; pruebas aisladas sin Sheets productivas.

### Tareas existentes relacionadas/ampliadas
- TAREA-F7-IMP-15: ampliar la garantía de atomicidad de operaciones multi-registro para cubrir explícitamente importBulkClassSchedules. No crear una segunda tarea genérica de LockService.
- TAREA-F7-IMP-01/02: reutilizar checkScheduleConflict y las reglas académicas; corregir su integración para considerar estados y filas candidatas del lote.
- AUD-NG-247: corregir/aislar la dependencia de getTeacherTeachingLoad que puede contar Borrador/Cancelado durante la validación de conflictos.

## 7. Pruebas y límites

- **Ejecutadas:** inspección estática manual de funciones backend, permisos, dispatcher, contrato de lectura/escritura, controlador JS, HTML completo, suites versionadas, registro de cambios, completadas.md, Pendientes.md por blob y estructura Git.
- **No ejecutadas:** Apps Script runtime; HTTP/OAuth; navegador/DOM; importación/exportación real; lectura/escritura de Google Sheets; fallos inducidos de escritura; concurrencia; pruebas Node; E2E.
- **Datos productivos:** no consultados ni modificados.
- **Código:** no modificado.
- **Marca [X]:** preservada en completadas.md.

## 8. Archivos y SHAs de respaldo

- **Nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-13.md.
- **Actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin cambios:** backend/academic-service/Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js 0495e1d526a872c33310935a003a83d924d34683; completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; METODOLOGIA_DESARROLLO.md cf796728bb384a32537392df2f9c72a339fa03ee.
- **Rama base:** NG_beta_0.0.0.1, sin cambios.
- **ChangesLogs.txt:** no se modifica porque no hubo cambios de código ni producto; la auditoría queda registrada en los documentos de AUDITORIAS.

## 9. Continuidad

Siguiente tarea de auditoría: **TAREA-F7-IMP-14**, fortalecer publicación y control de cambios masivos (CA-F7-87..92). Antes de auditar, verificar el informe individual y la fuente de origen; si el informe falta, auditar la tarea directamente contra completadas.md y el código de la rama, sin saltarla.

