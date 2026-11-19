# AUDITORÍA TAREA-F7-IMP-08
## Ampliar las excepciones del calendario y la gestión de sesiones

- **Fecha:** 2026-11-08.
- **Repositorio:** `i-miss-cocaine/IMA`.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD auditado:** `7500762b480a9a6c36c6afefde706954cb5d6146` (C1.239).
- **Checkpoint de inicio:** C1.239.
- **Checkpoint de cierre previsto:** C1.240.
- **ID de sesión operativo:** `IMA-AUDIT-20261108-0012Z-01` (identificador documental, no ID nativo de ChatGPT).
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica `[X]` de `completadas.md`; el estado histórico no se reescribe.
- **Severidad:** CRÍTICO/P0 para integridad de calendario, duplicación y autorización; ALTO/P1 para ausencia de UI, historial consultable e integración; MEDIO/P2 para cobertura de pruebas.

## 1. Alcance y requisitos

Se contrastó la tarea marcada como completada en `completadas.md` con su alcance funcional y los seis criterios CA-F7-51..56:

1. Diferenciar eventos institucionales, académicos, sesiones de clase y excepciones de una sesión.
2. Cancelar/reprogramar una sesión individual sin alterar el resto de una serie recurrente.
3. Modificar una serie completa solo cuando el usuario lo seleccione expresamente.
4. Identificar sesiones afectadas por vacaciones, suspensiones y cambios del calendario.
5. Diferenciar un día no lectivo de la cancelación de una actividad concreta.
6. Registrar reprogramaciones con referencia a la sesión original.
7. Evitar duplicaciones al recalcular sesiones recurrentes.
8. Consultar sesiones originales y excepciones.
9. Actualizar disponibilidad de aulas y docentes al cancelar/reprogramar.
10. Conservar asistencia y evaluación de sesiones pasadas.

## 2. Fuentes, integridad y estado documental

- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; TAREA-F7-IMP-08 figura [X] con CA-F7-51..56. La marca se preserva, pero no prueba el cumplimiento.
- `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-08.md`: no existía en la rama al iniciar la auditoría; este informe lo crea.
- `Pendientes.md`: lectura ordinaria vacía. Por instrucción expresa de esta tarea se recuperó el blob Git `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas y sin U+FFFD. Coincide con el SHA suministrado. Se consultó únicamente para verificar IDs históricos; no se modifica ni se usa como fuente de verdad operativa, de acuerdo con la prioridad de la instrucción actual sobre la exclusión general de la metodología.
- No se requiere restaurar ni transferir `Pendientes.md`; el blob está presente e íntegro.
- IDs TASK-560..TASK-568 y AUD-NG-243: verificados ausentes en Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt, completadas.md y blob de Pendientes.md antes de su asignación.

## 3. Evidencia técnica inspeccionada

### Backend académico
- `backend/academic-service/Code.gs` SHA `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`.
- `getOrCreateSheet` (84-155): inicializa `HorariosClase` y `CalendarioAcademico`, pero no define cabecera para `ExcepcionesSesiones`. Al primer uso, `createSessionException` agrega el registro como primera fila; cualquier lector que aplique `slice(1)` lo descartaría como si fuera encabezado.
- `ROLE_PERMISSIONS` (168-265): `createSessionException` solo aparece para Administrador (comodín) y Director. No está habilitada para Subdirector, Secretaría/Secretaria ni Profesor, aunque estos roles sí disponen de operaciones de gestión/consulta/reprogramación de sesiones.
- Dispatcher `doPost` (796-826): enruta `createSessionException`, `recordClassSessionOutcome`, `rescheduleCancelledSession`, `getPendingSessionRecoveries` y `getIndividualCalendar`; no existe una acción lectora específica para `ExcepcionesSesiones`.
- `rescheduleCancelledSession` (2615-2689): valida la sesión original y el conflicto de fecha/hora, marca la fila original como Reprogramada y agrega una fila REC. Sin embargo, la nueva fila no persiste `horaInicio`, `horaFin` ni `aulaCodigo`; solo quedan parcialmente en el mensaje/resultado. No hay vínculo relacional dedicado `sesionOriginalId` en la fila de recuperación, lock ni clave de idempotencia.
- `createSessionException` (2692-2725): valida únicamente horarioId/fechaAfectada/tipoExcepcion; no valida catálogo de tipos, horario existente, rango/fecha efectiva, ámbito individual/serie, conflicto, duplicidad ni recursos. Siempre inserta una nueva fila con ID aleatorio, sin aplicar la excepción al horario ni al calendario.
- `getPendingSessionRecoveries` (2728-2756) consulta cancelaciones de `SesionesClaseImpartidas`, no excepciones.
- `recordClassSessionOutcome` (2759-2795) conserva el registro de sesión y actualiza estado/observaciones; no sincroniza excepciones ni evita registros equivalentes concurrentes.
- `getTeachingHoursSummary` (2798-2838+) calcula estados desde `SesionesClaseImpartidas`, sin reconciliar las excepciones.
- `getAcademicCalendar` (6616-6644) devuelve eventos de `CalendarioAcademico`, no excepciones/sesiones efectivas. El esquema inicializado en getOrCreateSheet (113) declara 9 columnas con SedeID, mientras createCalendarEvent (6651-6715) escribe 13 columnas sin SedeID y el lector interpreta índices de 13 columnas. Es una divergencia relacionada ya registrada en AUD-NG-236.
- `getClassSchedules` (6718-6770) devuelve el patrón de `HorariosClase`, no aplica excepciones. Además usa índices 9/10 para cancelación y estado aunque el esquema inicial declara 8 columnas y createClassSchedule escribe 9; mantiene caché de 600 segundos y createSessionException no la invalida.
- `getIndividualCalendar` (7925-7983) agrega eventos del calendario y resultados de `SesionesClaseImpartidas`, pero nunca lee `ExcepcionesSesiones`. Sus filtros fechaInicio/fechaFin no se aplican. Para estudiante/sección espera `res.data`, mientras getStudentSchedule devuelve `schedules`; por esa diferencia puede dejar vacío el bloque de horarios base.
- `getStudentSchedule` (7986-8082) devuelve horarios recurrentes de la oferta; no incorpora excepciones ni fecha efectiva.

### Validación de conflictos, datos y recursos
- `checkScheduleConflict` (7493-7585+): puede validar un día no lectivo cuando recibe fechaEspecifica, pero no consume las excepciones de sesión individual. La ruta de alta de excepción no invoca este validador.
- `createClassSchedule` (6900-6990) crea/actualiza la regla recurrente completa; no implementa selección de ocurrencias de una serie.
- `deleteClassSchedule` (6992-7005) desactiva el bloque de horario completo; no representa cancelación puntual.
- Las reservas de aula/docente están vinculadas al horario recurrente; el registro de excepción no modifica reservas ni disponibilidad para la fecha afectada.

### Frontend y pruebas
- `js/teacher.js` SHA `c475fce5afcd28fca23e7b64398ad32b17773746`: `openSessionExceptionModal` (1707-1754) busca `#modal-session-exception`, `#form-session-exception` y campos exc-*, y llama createSessionException. El controlador no puede funcionar sin esos nodos; además no recarga calendario/horarios después de guardar.
- `teacher-dashboard.html` SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`: no contiene `openSessionExceptionModal`, `modal-session-exception`, `form-session-exception` ni `ExcepcionesSesiones`; no hay formulario, modal ni invocador.
- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`: fetchApi (11-60) agrega requesterUserId/requesterRole, pero no sessionToken/authToken/token. La ruta privada no recibe el contrato de credenciales que exige el validador de permisos; se amplía AUD-NG-001.
- `tests/regression/academic-grading-suite.js` SHA `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`: no contiene createSessionException, getPendingSessionRecoveries, TAREA-F7-IMP-08 ni CA-F7-51..56. No hay pruebas conductuales específicas para cancelación puntual, edición de serie, liberación de recursos, idempotencia o fecha efectiva.
- `ChangesLogs.txt` SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`: la entrada histórica de TAREA-F7-IMP-08 afirma que se incorporaron botón, modal y formulario en teacher-dashboard.html. El HTML actual no contiene ninguno de esos elementos. El registro histórico no corresponde al estado auditado.

## 4. Evaluación de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-51 | NO CUMPLE | createSessionException solo inserta una fila no consumida; no cambia ni proyecta la ocurrencia individual. |
| CA-F7-52 | NO CUMPLE | No existe operación con ámbito explícito de serie ni confirmación de ocurrencias seleccionadas. |
| CA-F7-53 | NO CUMPLE | La excepción no libera reservas; rescheduleCancelledSession no actualiza reservas ni persiste la nueva aula/franja en la fila REC. |
| CA-F7-54 | PARCIAL | Se conserva la fila original y su ID al marcar Reprogramada, pero la recuperación solo referencia el original en texto libre; no existe relación formal ni salvaguarda integral de asistencia/evaluación. |
| CA-F7-55 | NO CUMPLE | No hay unicidad lógica ni idempotencia por horario/fecha; cada llamada crea otra excepción o recuperación. |
| CA-F7-56 | NO CUMPLE | Los lectores de calendarios/horarios no consumen ExcepcionesSesiones ni exponen fecha efectiva; filtros y contratos de datos presentan brechas adicionales. |

**Dictamen general: NO CUMPLE.** La existencia de un controlador JavaScript y una función backend con la etiqueta de la tarea no satisface el flujo funcional de punta a punta.

## 5. Hallazgo y reconciliación

### Hallazgo nuevo
**AUD-NG-243 - Excepciones de sesión almacenadas sin aplicación efectiva, gestión de alcance, protección de duplicados ni integración de calendario.**

Se amplían:
- **AUD-NG-001:** autenticación de rutas privadas; fetchApi no transmite token y createSessionException tiene un ámbito de roles más restrictivo/inconsistente que las operaciones relacionadas.
- **AUD-NG-236:** validación temporal y coherencia de CalendarioAcademico/horarios; la excepción no llega al motor de conflictos y los datos efectivos no son proyectados.
- **AUD-NG-237:** interfaz docente; el controlador existe pero no hay modal/formulario/acción en el HTML.
- **AUD-NG-238:** resolución de conflictos y reprogramación; no se actualizan reservas ni se aplica una operación idempotente a la ocurrencia original.

### Tareas ejecutables derivadas de los hallazgos

#### Tareas nuevas

**TASK-560 - Normalizar el modelo persistente de excepciones y sesiones**
- Hallazgo: AUD-NG-243.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: definir e inicializar cabeceras/versionado de ExcepcionesSesiones; formalizar tipo, alcance, horario/ocurrencia, fechas/horas originales y efectivas, motivo, actor, estado, recursos y relación con la sesión original; migrar sin reinterpretar la primera fila como encabezado.
- Archivos/módulos: backend/academic-service/Code.gs; esquema Sheets; contratos API.
- Dependencias: TASK-517, TASK-521, TASK-545, AUD-NG-236.
- Alcance: diseño de esquema, migración idempotente y lectores compatibles; no borrar registros históricos.
- Aceptación: hoja vacía se inicializa con cabecera correcta; hoja histórica se migra sin perder filas; todas las columnas se leen/escriben por contrato estable; pruebas de migración repetida.
- Prioridad: P0. Estado: Pendiente.

**TASK-561 - Implementar ciclo de vida y alcance explícito de excepciones**
- Hallazgo: AUD-NG-243.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: aplicar cancelación/reprogramación a una ocurrencia fechada sin alterar otras ocurrencias; soportar operación de serie solo con selección/confirmación expresa y registrar el conjunto exacto afectado.
- Archivos/módulos: backend/academic-service/Code.gs; HorariosClase; ExcepcionesSesiones.
- Dependencias: TASK-560, TASK-518, TASK-529.
- Alcance: validación de ocurrencia, fecha efectiva, alcance individual/serie, estados y transiciones permitidas.
- Aceptación: excepción individual no modifica la regla recurrente ni otras fechas; operación de serie afecta exclusivamente las ocurrencias confirmadas; día no lectivo y cancelación de actividad se representan como tipos distintos.
- Prioridad: P0. Estado: Pendiente.

**TASK-562 - Integrar excepciones en proyecciones de horario y calendario**
- Hallazgo: AUD-NG-243.
- Severidad: ALTO/P1.
- Objetivo/acción: crear consulta de excepciones y proyectar la ocurrencia efectiva en getClassSchedules, getStudentSchedule, getIndividualCalendar y vistas de calendario; filtrar por período/fecha y marcar original, cancelada o reprogramada.
- Archivos/módulos: backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html; consumidores de calendario.
- Dependencias: TASK-560, TASK-561, TASK-517, TASK-554.
- Alcance: DTO común y resolución de recurrencia/excepciones; invalidación de caché después de mutaciones.
- Aceptación: todos los calendarios afectados muestran fecha/hora efectiva; una cancelación no se muestra como sesión activa; una reprogramación identifica la fecha original; consultas por rango excluyen lo ajeno al rango.
- Prioridad: P1. Estado: Pendiente.

**TASK-563 - Liberar y reasignar recursos de sesiones afectadas**
- Hallazgo: AUD-NG-243.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: actualizar disponibilidad de docente, aula y recursos compartidos/exclusivos al cancelar o reprogramar una ocurrencia; validar conflictos sobre la fecha/franja efectiva.
- Archivos/módulos: backend/academic-service/Code.gs; HorariosClase; reservas de aulas/mantenimiento/recursos.
- Dependencias: TASK-561, TASK-549, TASK-555.
- Alcance: liberar la reserva de la ocurrencia cancelada y reservar la nueva ocurrencia con validación temporal.
- Aceptación: cancelación libera solo recursos de esa ocurrencia; reprogramación libera origen y reserva destino; la serie y reservas de otras fechas permanecen intactas; ante conflicto no se persiste cambio parcial.
- Prioridad: P0. Estado: Pendiente.

**TASK-564 - Preservar relación histórica de asistencia y evaluación**
- Hallazgo: AUD-NG-243.
- Severidad: ALTO/P1.
- Objetivo/acción: establecer vínculo formal entre sesión original, ocurrencia reprogramada y sesión recuperada; proteger sesiones pasadas y registros de asistencia/evaluación asociados.
- Archivos/módulos: backend/academic-service/Code.gs; SesionesClaseImpartidas; SesionesAsistencia; RegistrosAsistencia; módulos de evaluación.
- Dependencias: TASK-560, TASK-561, TASK-556.
- Alcance: referencias estables, auditoría de cambios y reglas de inmutabilidad histórica.
- Aceptación: el historial conserva IDs y fecha original; recuperación referencia por ID la sesión origen; asistencia/calificaciones pasadas no se reasignan ni sobrescriben; cambios futuros son auditables.
- Prioridad: P1. Estado: Pendiente.

**TASK-565 - Garantizar idempotencia y ausencia de ocurrencias duplicadas**
- Hallazgo: AUD-NG-243.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: impedir dos excepciones activas o sesiones efectivas para el mismo horario/ocurrencia y evitar dobles recuperaciones por reintentos o concurrencia.
- Archivos/módulos: backend/academic-service/Code.gs; ExcepcionesSesiones; SesionesClaseImpartidas; caché.
- Dependencias: TASK-560, TASK-561, TASK-563.
- Alcance: clave lógica de ocurrencia, idempotency key, LockService/versión y resolución de conflictos de escritura.
- Aceptación: reintento con misma clave devuelve resultado previo; operación concurrente no crea duplicados; una ocurrencia solo tiene una sesión activa efectiva; conflictos no dejan filas huérfanas.
- Prioridad: P0. Estado: Pendiente.

**TASK-566 - Conectar la interfaz de gestión de excepciones**
- Hallazgo: AUD-NG-243.
- Severidad: ALTO/P1.
- Objetivo/acción: incorporar modal/formulario/invocador real, selección de horario/fecha y alcance individual/serie, campos condicionales, confirmación y actualización de calendario.
- Archivos/módulos: teacher-dashboard.html; js/teacher.js.
- Dependencias: TASK-561, TASK-562, TASK-567.
- Alcance: UX accesible y validación de campos; estados de carga/error; no anunciar éxito si el backend no confirma.
- Aceptación: todos los nodos consultados por openSessionExceptionModal existen; acción visible según permiso; submit envía el contrato correcto; calendario se refresca tras guardar; errores conservan el formulario.
- Prioridad: P1. Estado: Pendiente.

**TASK-567 - Corregir autenticación y permisos del flujo de excepciones**
- Hallazgo: AUD-NG-243; ampliación AUD-NG-001.
- Severidad: CRÍTICO/P0.
- Objetivo/acción: transmitir credencial de sesión validada y definir roles/ámbitos explícitos para consultar, crear, cancelar, reprogramar y modificar series.
- Archivos/módulos: js/api.js; js/auth.js si corresponde; backend/academic-service/Code.gs ROLE_PERMISSIONS, validateRolePermission y dispatcher.
- Dependencias: AUD-NG-001; TASK-558.
- Alcance: identidad verificada desde token; evitar confiar en authUserId/authRole enviados por cliente; autorización por institución/oferta/horario.
- Aceptación: solicitudes protegidas validan token; actor proviene de claims; roles autorizados pueden operar según ámbito y los demás reciben denegación; tests negativos y positivos.
- Prioridad: P0. Estado: Pendiente.

**TASK-568 - Añadir regresión conductual integral de CA-F7-51..56**
- Hallazgo: AUD-NG-243.
- Severidad: ALTO/P1.
- Objetivo/acción: cubrir recurrencia, alcance de serie, recursos, historial, duplicados, calendario, permisos, migración y reintentos.
- Archivos/módulos: tests/regression/academic-grading-suite.js; backend/developer-service/Code.gs si la suite se expone desde el servicio.
- Dependencias: TASK-560..TASK-567.
- Alcance: pruebas unitarias/contrato e integración aislada; no tocar Sheets productivas.
- Aceptación: casos positivos/negativos reproducibles para cada CA; ejecución repetida sin efectos colaterales; informe de pruebas con resultados verificables.
- Prioridad: P1. Estado: Pendiente.

## 6. Límites y pruebas

- **Ejecutadas:** inspección estática/manual de código, funciones, contratos de hojas, índices, dispatcher, RBAC, API, referencias DOM/JS, consumidores de calendario, registros históricos, suite, ChangesLogs y SHAs Git.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth real, navegador, Google Sheets/Drive productivas, concurrencia real, inyección de fallos, rollback ni E2E. No se ejecutó la suite Node: no hay entorno aislado verificado en esta sesión.
- No se modificó código, pruebas, HTML, datos productivos, `completadas.md` ni `Pendientes.md`.
- No se desplegó ni se realizó commit durante el análisis; los documentos de auditoría y el checkpoint se publican juntos en un único commit.

## 7. Archivos

- **Nuevo:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-08.md`.
- **Actualizados:** `AUDITORIAS/Auditoria.txt`; `AUDITORIAS/MapaDependencias.md`; `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`; `AUDITORIAS/Contexto_personal.txt`.
- **Sin cambios:** `backend/academic-service/Code.gs`; `teacher-dashboard.html`; `js/teacher.js`; `js/api.js`; `tests/regression/academic-grading-suite.js`; `ChangesLogs.txt`; `completadas.md`; `Pendientes.md`; `METODOLOGIA_DESARROLLO.md`; rama base protegida.

## 8. Próxima acción

Abrir `completadas.md` en **TAREA-F7-IMP-09**, verificar si existe su informe individual y auditar el control de versiones, comparación y restauración de horarios. No implementar las tareas derivadas durante la fase de auditoría.
