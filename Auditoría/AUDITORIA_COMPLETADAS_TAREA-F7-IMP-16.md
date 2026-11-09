# AUDITORÍA TAREA-F7-IMP-16
## Ampliar la gestión de sustituciones y la reasignación de clases afectadas

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-1023CST (identificador documental; no es un ID nativo de ChatGPT).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **Rama base protegida:** NG_beta_0.0.0.1.
- **HEAD de partida verificado:** a6d256858dfbf1c952811640b590d3c1c61431bd (C1.247).
- **Tarea auditada:** TAREA-F7-IMP-16, marcada [X] en completadas.md.
- **Dictamen:** **NO CUMPLE**.
- **Severidad global:** **ALTA/P1**. El registro de sustituciones no garantiza el docente efectivo dentro del intervalo, la comprobación de disponibilidad utiliza columnas incorrectas, la operación no reasigna varios bloques de manera verificable y la interfaz declarada no existe en el HTML servido. Además, el endpoint permite atribución y bypass de conflictos controlados desde el cliente.
- **Criterios:** CA-F7-99 NO CUMPLE; CA-F7-100 PARCIAL; CA-F7-101 NO CUMPLE; CA-F7-102 NO CUMPLE; CA-F7-103 NO CUMPLE; CA-F7-104 NO CUMPLE; CA-F7-105 NO CUMPLE.

## 1. Alcance y fuentes

Se verificaron los doce requisitos funcionales y los criterios CA-F7-99..105 contra el backend, la interfaz, el router, RBAC, los consumidores de horarios, el motor de conflictos, las pruebas, el historial documental y las dependencias previas. La auditoría se ejecutó directamente porque faltan el informe individual y el documento fuente citado.

Fuentes inspeccionadas:
- `backend/academic-service/Code.gs`:
  - Esquemas iniciales de `AsignacionesDocentes` y `HorariosClase` (líneas 110-120).
  - `ROLE_PERMISSIONS`, `validateContextualAccess`, `validateRolePermission` y `doPost` (168-260, 465-583, 671-755).
  - `getTeacherAssignments`, `assignTeacherToClass`, `assignTeacherToSection` (6228-6304).
  - `getCoordinatorOverview` (6305-6347).
  - `createTeacherSubstitution` y `getTeacherSubstitutions` (6501-6616).
  - `getTeacherTeachingLoad` (6773-6841).
  - `checkScheduleConflict` (7493-7693).
  - `syncAcademicScheduleIntegrity` (7879-7924).
  - `getIndividualCalendar` (7925-7980).
  - `getStudentSchedule` (7986-8085).
  - `runAcademicPlanningRegressionSuite` (14080-14173).
- `js/teacher.js`: invocador `btn-open-substitution-modal` (1908-1944), `openTeacherSubstitutionModal` y `handleCreateTeacherSubstitutionSubmit` (2077-2157).
- `teacher-dashboard.html`: HTML completo (1-1475); no contiene el botón, el modal ni los campos que el JS intenta consultar.
- `tests/regression/academic-grading-suite.js` (412 líneas), en particular la aserción estática de F11-Task12 en línea 102.
- `ChangesLogs.txt`: registro F11-Task12 (aprox. línea 3672).
- `completadas.md`, `Pendientes.md` recuperado desde blob Git, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`, `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/Contexto_personal.txt`, `METODOLOGIA_DESARROLLO.md` e informes IMP-10, IMP-11, IMP-13 e IMP-15.

La revisión técnica fue estática/manual. No se ejecutaron escrituras en hojas productivas ni se cambió código.

## 2. Integridad documental y estado histórico

- **completadas.md:** SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`. TAREA-F7-IMP-16 aparece marcada [X] en la línea 4414; se tomaron los doce requisitos y los siete criterios completos de ese bloque. La marca histórica no acredita comportamiento.
- **Pendientes.md:** la lectura convencional de la ruta devuelve 0 caracteres; el blob Git `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` se recuperó directamente. Validación del contenido: 1,782,094 caracteres, 20.182 líneas, cero caracteres U+FFFD. El blob incluye TASK-173 (línea 7274), que ya cubre colisiones entre jornada laboral, asignaciones docentes, sustituciones y permisos/vacaciones. No aparece el identificador TAREA-F7-IMP-16 en Pendientes.md. Se consultó por instrucción expresa del usuario y no se modifica el archivo.
- **Informe individual:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md` no existe (404).
- **Documento de origen declarado:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` no existe en la rama (404). No se reconstruye ni se inventa; se usa el bloque íntegro de completadas.md.
- **Antecedente directo:** AUD-NG-168 (TAREA-13, 2026-11-05) ya documentó índices incorrectos de `createTeacherSubstitution`, confusión de estados y comprobación de conflictos/carga no fiable. Se amplía AUD-NG-168 con evidencia de esta tarea; no se duplica la misma causa raíz.
- **Otros antecedentes:** AUD-NG-245 cubre el dispatcher/notificaciones; AUD-NG-246 cubre sincronización de portales/DOM/estados; AUD-NG-250 cubre bloqueo y atomicidad. Se amplían esos hallazgos y sus tareas relacionadas.
- **Antecedente de seguridad:** se registra AUD-NG-251 para la autorización contextual insuficiente, la identidad de autorizador controlada por el cliente y el bypass de conflictos sin autorización elevada.
- **Antecedente de pruebas:** ChangesLogs afirma que F11-Task12 expira sustituciones y añadió una prueba; el código solo calcula `Vencida` en una respuesta, sin persistir el cambio ni conectar ese estado con los consumidores. La prueba de `academic-grading-suite.js` solo busca nombres/comentarios de funciones y no prueba el comportamiento.

## 3. Evidencia técnica

### 3.1 Contrato de datos y columnas equivocadas en la comprobación

El esquema canónico inicial declarado en `getOrCreateSheet` (líneas 110-120) establece:
- `HorariosClase`: `HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado` (índices 0..7).
- `AsignacionesDocentes`: `AsignacionID, OfertaID, DocenteUserId, RolDocente, FechaInicio, FechaFin, Estado, AutorizadoPor, Motivo` (índices 0..8).

En `createTeacherSubstitution` (6501-6568):
- Busca horarios de la oferta con `String(r[8] || "Activo") === "Activo"`. El esquema canónico de HorariosClase solo llega a r[7]; por tanto, r[8] es undefined y el fallback "Activo" hace que pasen también filas Inactivas/Canceladas, en vez de filtrar el estado real r[7].
- Construye la llamada a `checkScheduleConflict` usando `diaSemana: sched[3]`, `horaInicio: sched[4]`, `horaFin: sched[5]` y `anoLectivo: sched[6]`. En el esquema real estos índices corresponden a HoraInicio, HoraFin, AulaCodigo y DocenteUserId. Los campos correctos de día/inicio/fin son r[2]/r[3]/r[4].
- No pasa `aulaCodigo`, `ofertaId`, `excludeHorarioId`, asignatura, grado ni sección al motor de conflictos. Tampoco transforma la carga del sustituto por período/intervalo.
- `checkScheduleConflict` devuelve los conflictos con propiedad `reason` (7493-7693), pero `createTeacherSubstitution` agrega `motivo: conflictCheck.message`; la explicación queda undefined en la respuesta de conflicto.
- El motor calcula carga semanal desde HorariosClase (getTeacherTeachingLoad, 6773-6841) y no recibe aquí intervalos válidos: horaInicio puede ser la hora de fin y horaFin puede ser un código de aula. El cálculo de duración puede resultar NaN y no bloquear el exceso. El motor tampoco recibe aulaCodigo para validar colisión de aula.
- No se comprueba compatibilidad del sustituto con la asignatura, grupo, nivel, sección o requisitos académicos del bloque afectado.

**Conclusión:** el mecanismo de validación citado en el comentario de la función no está integrado con el esquema de datos real. La verificación de horario/carga no demuestra que el sustituto esté disponible o sea compatible.

### 3.2 Intervalo de vigencia, estado efectivo y caducidad

- `createTeacherSubstitution` normaliza `fechaInicio` y `fechaFin` a fecha ISO, pero permite omitir fechaInicio (usa hoy), permite fechaFin vacía y no rechaza un intervalo invertido ni valida que ambas fechas sean fechas de calendario válidas.
- La escritura guarda el estado literal `Activa` en `AsignacionesDocentes` (columna 7, índice 6).
- `getTeacherSubstitutions` (6570-6616) calcula `Vencida` si `fechaFin < hoy`, pero solo modifica el DTO devuelto; no actualiza la fila persistida ni considera `fechaInicio` para determinar si una sustitución todavía no comenzó.
- `getStudentSchedule` (7986-8085) busca sustituciones con `RolDocente === "Sustituto"` y `Estado === "Temporal"`, sin comprobar fechaInicio/fechaFin. La creación guarda `Activa`, no `Temporal`; por ello no se aplica al horario. Si el estado se cambiara manualmente a Temporal, el consumidor seguiría usando al sustituto fuera de su intervalo porque no filtra fechas.
- `getIndividualCalendar` (7925-7980) también filtra únicamente `Estado === "Temporal"`, sin evaluar el período. `syncAcademicScheduleIntegrity` (7879-7924) cuenta únicamente registros Temporal y no ve la fila Activa creada por la función.
- `getCoordinatorOverview` (6305-6347) cuenta asignaciones solo con `Estado === "Activo"`; la sustitución escrita como Activa tampoco entra en ese resumen.
- `getTeacherSubstitutions` permite consultar vencidas y devuelve una lista, pero no implementa revocación automática, restauración efectiva del docente titular ni un estado canónico compartido por los consumidores.
- No existe diferenciación de sustitución temporal frente a cambio permanente: la fila solo almacena `RolDocente = Sustituto`; no hay tipo de movimiento ni flujo de reasignación permanente.

**Conclusión:** CA-F7-99 y CA-F7-105 NO CUMPLEN. La caducidad aparente en una respuesta no garantiza que las vistas resuelvan el docente correcto por fecha ni que las clases posteriores queden intactas.

### 3.3 No se implementa una reasignación multibloque verificable

- La firma de `createTeacherSubstitution` recibe un único `ofertaId` y un único `sustitutoUserId`; no acepta un conjunto de ofertas/bloques, fechas específicas por bloque ni identificadores de horarios afectados.
- La UI (1908-1944) busca ofertas por grado/sección y toma `offerRes.data[0].ofertaId`. Si no encuentra oferta, intenta crear una oferta académica nueva con `ASIG-GENERAL`/ `PLAN-2026` solo para continuar el flujo de sustitución. Esto introduce una mutación de catálogo no solicitada y puede asociar la sustitución a una oferta incorrecta.
- El backend calcula `offerSchedules.length` y devuelve solo `clasesAfectadasCount`; no devuelve IDs/bloques, no crea una relación sustitución-bloque, no conserva un snapshot por bloque y no actualiza la asignación efectiva de cada bloque.
- No hay previsualización de las clases y actividades afectadas, confirmación por lote ni resultado individual por horario. Tampoco hay operación coordinada para varias sustituciones relacionadas.
- La fila original del titular no se modifica: la función agrega una fila con RolDocente Sustituto. Esto conserva el registro existente en sentido limitado, pero no crea una relación histórica explícita entre titular, sustituto, intervalo y bloques afectados.

**Conclusión:** CA-F7-100 PARCIAL por conservarse la fila original sin sobrescritura; CA-F7-101/102 NO CUMPLEN porque no se reasignan ni validan correctamente todos los bloques y no existe una previsualización de conflictos.

### 3.4 Historial, autoría y seguridad de la operación

- `ROLE_PERMISSIONS` incluye `createTeacherSubstitution` y `getTeacherSubstitutions` para el rol Profesor (aprox. líneas 232-250); `validateRolePermission` verifica token y rol, pero `validateContextualAccess` solo limita ámbito cuando payload incluye `scopeType` y `requestedValue`. La llamada de sustitución no envía esos campos ni comprueba que la oferta o el sustituto pertenezcan al ámbito del usuario.
- `getTeacherSubstitutions` permite omitir `docenteUserId` y `ofertaId`; en ese caso devuelve todas las filas con RolDocente Sustituto. El endpoint también está permitido al rol Profesor y no aplica filtro contextual por docente/ámbito.
- El backend persiste `autorizadoPor` desde payload. La UI envía el nombre o userId de `currentUser`; la función no deriva el autor desde `payload._verifiedUserId` ni valida que el rol autenticado pueda autorizar esa sustitución.
- `forzarSustitucion` es un booleano de payload que evita el rechazo por conflictos. El backend no exige rol elevado, motivo formal de excepción ni autorización distinta. La confirmación `confirm()` del navegador no es un control de seguridad.
- La función no escribe evento de auditoría estructurado con identidad verificada, cambio, intervalo, oferta y bloque; tampoco invoca un registro de historial de sustituciones separado.
- `getTeacherSubstitutions` puede servir como consulta de filas, pero no hay controlador de consulta/historial en `js/teacher.js` y no existe un historial visible en `teacher-dashboard.html`.

**Hallazgo nuevo AUD-NG-251 (ALTO/P1):** autorización contextual y atribución de sustituciones controladas por el cliente, con consulta de registros sin aislamiento y bypass de conflictos sin permiso elevado.

### 3.5 Interfaz y propagación a vistas/notificaciones

- `teacher-dashboard.html` no contiene `btn-open-substitution-modal`, `modal-teacher-substitution`, `subst-oferta-id`, `subst-docente-id`, `subst-fecha-inicio`, `subst-fecha-fin`, `subst-motivo` ni `subst-conflict-alert`.
- `js/teacher.js` enlaza el listener a `btn-open-substitution-modal` con optional chaining (1908); al faltar el nodo, no registra listener. `openTeacherSubstitutionModal` retorna inmediatamente si no existe modal (2077-2097). El formulario/submit no tiene un elemento DOM asociado en el HTML auditado.
- El valor `motivo` solicitado por prompt en el invocador (aprox. 1937) no se pasa a `openTeacherSubstitutionModal` ni al backend; el controlador intenta leerlo después desde `subst-motivo`, nodo inexistente.
- No hay consumidor frontend de `getTeacherSubstitutions`; no hay vista de historial, ni actualización de los calendarios desde el controlador después del alta.
- `createTeacherSubstitution` solo agrega una fila y retorna; no llama a `dispatchScheduleChangeNotifications`, `sendMultiChannelNotification` ni a un dispatcher equivalente. No se identifican destinatarios por docente titular, sustituto, grupos o responsables.
- Los consumidores existentes no resuelven la sustitución por intervalo/estado debido a las diferencias descritas en 3.2.

**Conclusión:** CA-F7-103 y CA-F7-104 NO CUMPLEN. La función frontend está desconectada del DOM y el backend no propaga cambios a vistas ni notificaciones.

### 3.6 Pruebas y contradicción con el historial de cambios

- `runAcademicPlanningRegressionSuite` (14080-14173) ejecuta `getTeacherSubstitutions({ anoId: "2026" })`, pero `getTeacherSubstitutions` ignora `anoId` y retorna `{status:"success", data:[...]}`; TC-F7-05 comprueba `Array.isArray(tc5.sustituciones)`. Esa propiedad no existe, por lo que el caso falla cuando se ejecuta con una respuesta normal.
- `tests/regression/academic-grading-suite.js` línea 102 solo afirma que el texto de Code.gs contiene `createTeacherSubstitution` y `[F11-Task12]`. No invoca la función, no prueba fechas, estados, conflictos, carga, titular, notificaciones, permisos ni expiración.
- `ChangesLogs.txt` (F11-Task12, aprox. línea 3672) declara que la sustitución pasa automáticamente a Vencida. El código solo calcula ese valor en la respuesta de `getTeacherSubstitutions`; no lo persiste y los consumidores de calendario no leen ese DTO. El registro histórico sobrestima el comportamiento efectivo.
- No se encontraron pruebas conductuales específicas de CA-F7-99..105 en las suites inspeccionadas.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-F7-99 | NO CUMPLE | Los consumidores no filtran por inicio/fin; creación usa Activa y resolutores buscan Temporal. |
| CA-F7-100 | PARCIAL | La fila del titular no se sobrescribe, pero no hay vínculo histórico explícito titular-sustituto-bloque-período. |
| CA-F7-101 | NO CUMPLE | Índices de HorariosClase desplazados; no se comprueban asignatura/grupo/requisitos; la carga puede calcularse con horas/códigos incorrectos. |
| CA-F7-102 | NO CUMPLE | No existe preview multibloque; la razón del conflicto se lee de `message` en vez de `reason`; el bypass puede forzarse desde payload. |
| CA-F7-103 | NO CUMPLE | UI ausente y consumidores filtran estados incompatibles; no se resuelve el responsable efectivo por fecha. |
| CA-F7-104 | NO CUMPLE | No hay invocación de dispatcher ni resolución de destinatarios en la operación. |
| CA-F7-105 | NO CUMPLE | La expiración solo se calcula en un DTO; no se restaura/garantiza el docente titular ni se limita el cambio a su intervalo. |

## 5. Hallazgos y relaciones

### AUD-NG-168 (ALTO/P1) - Ampliación: esquema de asignaciones/sustituciones y validación de conflictos
Se confirma que la causa raíz ya registrada sigue presente. Se amplía con:
- `HorariosClase` tiene ocho columnas canónicas; `createTeacherSubstitution` usa r[8] como estado y desplaza día/inicio/fin.
- El estado Activa no coincide con Temporal en `getStudentSchedule`, `getIndividualCalendar` y `syncAcademicScheduleIntegrity`; tampoco coincide con Activo en `getCoordinatorOverview`.
- `AsignacionesDocentes` tiene usos de columna 8 incompatibles: el esquema canónico la denomina Motivo, mientras `assignTeacherToClass` inicializa esa columna como SeccionKey.
- La prueba histórica solo comprueba presencia de nombres; TC-F7-05 usa el contrato de respuesta equivocado.
- Relacionado con AUD-NG-247, AUD-NG-246, TASK-173, TASK-585, TASK-591 y TASK-598.

### AUD-NG-251 (ALTO/P1) - Autorización contextual y atribución no confiable de sustituciones
- **Descripción:** un Profesor está autorizado por la matriz estática a invocar creación/consulta; el endpoint no verifica ámbito de oferta/docente, permite consultar todas las sustituciones al omitir filtros, confía en `autorizadoPor` del payload y permite `forzarSustitucion` sin autorización elevada.
- **Impacto:** sustituciones fuera del ámbito académico, exposición de información de otros docentes, registro de autoría falsificable y bypass de controles de disponibilidad.
- **Archivos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `tests/regression/academic-grading-suite.js`.
- **Relaciones:** AUD-NG-158, AUD-NG-168, AUD-NG-245, AUD-NG-246; TASK-567 y TASK-586.

### Ampliaciones de hallazgos existentes
- **AUD-NG-245:** el ciclo de sustitución debe emitir eventos/notificaciones a destinatarios correctos, con outbox/deduplicación y estado real; la función actual no llama al dispatcher.
- **AUD-NG-246:** ampliar la brecha de portal/DOM/estado a los controles de sustitución y a la resolución del docente efectivo por intervalo.
- **AUD-NG-250:** incluir `createTeacherSubstitution` entre los escritores que requieren exclusión mutua, idempotencia y protección de operaciones relacionadas; actualmente no toma LockService.
- **AUD-NG-168:** conservar el antecedente de índices incorrectos y ampliarlo con los contratos y consumidores actuales. No crear un segundo hallazgo por el mismo desajuste de columnas/estados.

## 6. Tareas ejecutables derivadas de los hallazgos

### Nuevas tareas

#### [TASK-607] Implementar el ciclo de vida temporal y la resolución efectiva de sustituciones
- **Hallazgo de origen:** AUD-NG-168 ampliado.
- **Severidad:** Alto.
- **Objetivo:** garantizar que cada sustitución sea efectiva únicamente dentro de su intervalo y que al vencer se restituya la asignación titular para las fechas posteriores, manteniendo historial.
- **Acción ejecutable:** validar fechas obligatorias y ordenadas; definir estados canónicos (Programada/Activa/Vencida/Cancelada o contrato equivalente); resolver sustituto por fecha de la clase en todas las consultas; no elegir la primera fila sin considerar vigencia; persistir/derivar vencimiento de forma consistente; diferenciar sustitución temporal de reasignación permanente; conservar titular y versiones históricas.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, esquema `AsignacionesDocentes`, `getStudentSchedule`, `getIndividualCalendar`, `getTeacherAssignments`, `getCoordinatorOverview`, `syncAcademicScheduleIntegrity`.
- **Dependencias:** AUD-NG-168, TASK-585, TASK-591, TASK-587.
- **Criterios verificables:** antes del inicio se presenta titular; durante el intervalo se presenta sustituto; después del fin vuelve a presentarse titular; un período vacío/invertido se rechaza; los registros históricos no se sobrescriben; todas las vistas usan el mismo resolver y estados; una sustitución cancelada deja de ser efectiva.
- **Prioridad:** P1. **Estado:** Pendiente.

#### [TASK-608] Implementar planificación, previsualización y aplicación multibloque de sustituciones
- **Hallazgo de origen:** AUD-NG-168 ampliado; AUD-NG-250 ampliado.
- **Severidad:** Alto.
- **Objetivo:** localizar todos los bloques/actividades afectados y aplicar una sustitución relacionada a varios horarios sin omitir asignaturas ni crear ofertas ficticias.
- **Acción ejecutable:** aceptar IDs explícitos de horarios/ofertas afectadas; construir una vista previa por bloque con docente titular, grupo, asignatura, aula, período y sustituto; comprobar disponibilidad por fecha/día/hora, carga laboral, jornada/turnos/vacaciones, aula y requisitos académicos; registrar relación sustitución-bloque; confirmar el lote con operación identificable, lock, versión/idempotencia y all-or-none o recuperación/reconciliación; preservar la asignación titular.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `teacher-dashboard.html`, `AsignacionesDocentes`, `HorariosClase`.
- **Dependencias:** TASK-605, TASK-606, TAREA-F7-IMP-15, TASK-173, TASK-598, TASK-585, TASK-607.
- **Criterios verificables:** preview no escribe; todos los bloques elegidos aparecen con IDs; cada conflicto identifica el bloque y razón; no se crea una OfertaAcademica como efecto colateral; el lote no deja asignaciones parciales; reintento no duplica; el titular se conserva y la sustitución queda vinculada a cada bloque.
- **Prioridad:** P1. **Estado:** Pendiente.

#### [TASK-609] Proteger autorización, consulta y atribución de sustituciones en backend
- **Hallazgo de origen:** AUD-NG-251.
- **Severidad:** Alto.
- **Objetivo:** impedir altas, consultas y excepciones fuera del ámbito del usuario y asegurar una autoría verificable.
- **Acción ejecutable:** limitar create/get a roles autorizados por política; verificar que el usuario puede gestionar la oferta y el sustituto; derivar autorizador desde `_verifiedUserId`/`_verifiedRole`, no desde texto del payload; exigir permiso elevado y justificación para forzar conflictos; filtrar consultas por identidad/ámbito y reservar consultas globales para roles institucionales autorizados; registrar evento de auditoría estructurado.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, pruebas RBAC.
- **Dependencias:** AUD-NG-158, AUD-NG-251, TASK-567, TASK-586.
- **Criterios verificables:** Profesor solo administra sustituciones dentro de su ámbito autorizado; consulta sin filtros no revela sustituciones ajenas; `autorizadoPor` coincide con la identidad validada; forzar no autorizado se rechaza en servidor; cada alta/cancelación/override registra actor, motivo, oferta, bloque y período.
- **Prioridad:** P1. **Estado:** Pendiente.

### Tareas existentes ampliadas (sin duplicar IDs)

- **TASK-584:** incorporar el botón, modal, campos y formulario reales de sustitución en `teacher-dashboard.html`; enlazar submit/cierre/preview/consulta de historial; eliminar controladores que retornan por falta de DOM. El flujo no debe crear ofertas académicas como efecto lateral.
- **TASK-585:** unificar esquema/DTO y estados de `HorariosClase` y `AsignacionesDocentes`; resolver la divergencia Activa/Activo/Temporal y la columna 8 Motivo/SeccionKey.
- **TASK-586:** extender autorización contextual a create/get de sustituciones, oferta, docente titular/sustituto y consulta histórica.
- **TASK-567:** derivar actor/autorizador desde identidad de sesión verificada y no aceptar `autorizadoPor` como identidad autoritativa.
- **TASK-577..TASK-583 / AUD-NG-245:** integrar alta, cancelación, vencimiento y reasignación con notificaciones; resolver titular/sustituto/grupos/destinatarios; deduplicar y registrar estado/outbox; añadir consulta de historial.
- **TASK-587:** invalidar caché de horarios y vistas cuando se activa, cancela o vence una sustitución.
- **TASK-591:** normalizar estados vigentes y cálculo de carga para incluir sustituciones efectivas y excluir asignaciones vencidas/canceladas.
- **TASK-598:** reutilizar el motor de conflictos con los índices correctos, oferta/bloque, aula, asignatura, período y fechas efectivas.
- **TASK-602:** ampliar la regresión para CA-F7-99..105, incluyendo fechas antes/durante/después, estado Activa/Temporal, titular, varias ofertas/bloques, conflictos de carga/aula/turnos/vacaciones, notificaciones, permisos, bypass, errores y rollback.
- **TASK-605:** incluir create/cancel/update de sustituciones en el bloqueo común de horarios/docentes.
- **TASK-606:** usar revisión/versionado obligatorio cuando se editen/cancelen sustituciones y sus bloques relacionados.
- **TASK-173 (Pendientes.md):** ampliar la validación de sustituciones para comprobar período exacto, jornada laboral, turnos de apoyo, descansos y permisos/vacaciones aprobados. No crear otra tarea genérica de colisiones.

### Control de duplicados
- No crear otro motor genérico de conflictos: ampliar TASK-173/TASK-598.
- No crear otro sistema genérico de notificaciones: ampliar TASK-577..583.
- No crear otra tarea genérica de autenticación: ampliar TASK-567/TASK-586 y limitar la política específica en TASK-609.
- No crear otra tarea genérica de locks/atomicidad: ampliar TASK-605 y TAREA-F7-IMP-15.
- No crear otro contrato de estado de horarios: ampliar TASK-585/TASK-591 y AUD-NG-168.

## 7. Pruebas y límites

- **Ejecutadas:** inspección estática/manual de esquema, funciones, router, permisos, consumers, interfaz, notificaciones, pruebas, ChangesLogs, completadas, Pendientes por blob, plan, mapa y metodología; verificación de SHAs y ramas.
- **No ejecutadas:** Apps Script runtime, HTTP/OAuth, navegador/DOM, Google Sheets productivas, pruebas con sustituciones reales, concurrencia, inyección de fallos, notificaciones reales, suite Node ni E2E.
- **Datos productivos:** no consultados ni modificados.
- **Código y pruebas:** sin cambios.
- **Estado histórico:** la marca [X] de completadas.md se conserva; el dictamen técnico es NO CUMPLE.
- **Límite de verificación:** no se afirma que una prueba estática sustituya pruebas funcionales; la suite TC-F7-05 estática y de contrato debe corregirse antes de poder usarse como evidencia.

## 8. Archivos y SHAs de respaldo

- `backend/academic-service/Code.gs`: `df87a2eea9f0ef79d0b966d03fd5bbe432003df5`.
- `js/teacher.js`: `c475fce5afcd28fca23e7b64398ad32b17773746`.
- `teacher-dashboard.html`: `cbb9e6a272a7d8ad33f99727303305d950533e71`.
- `tests/regression/academic-grading-suite.js`: `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6`.
- `completadas.md`: `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- `Pendientes.md`: blob `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`.
- `ChangesLogs.txt`: `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`.
- `METODOLOGIA_DESARROLLO.md`: `cf796728bb384a32537392df2f9c72a339fa03ee`.
- **Documentos de auditoría antes de esta iteración:** plan `2908ae95f89ebac51b0e66738f03e7fdf697d5e9`; Auditoria.txt `8a6a11fb8219d2c8dbdcf26bbfdd1ea75fc35a31`; MapaDependencias.md `dcebe57161df38ab4c5b9cef09a12c570e76f9fa`; Contexto_personal.txt `6dc48a3c03048abf3ee06fe6d6a20dd62d3688ff`.
- **Nuevo:** `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md`.
- **Actualizados:** `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`, `AUDITORIAS/Contexto_personal.txt`.
- **Sin cambios:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.

## 9. Continuidad

- **Última tarea completamente auditada:** TAREA-F7-IMP-16, dictamen NO CUMPLE.
- **Tarea en curso al cierre:** ninguna.
- **Siguiente tarea exacta:** TAREA-F7-IMP-17, gestión de eventos y actividades con participantes y recursos (CA-F7-106..111). Buscar primero informe individual y documento fuente; si faltan, auditar directamente el bloque completo de completadas.md contra el código vigente.
