# AUDITORÍA TÉCNICA - TAREA-F6-002: ciclo de vida y consistencia de matrículas

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.218  
**Checkpoint de cierre:** C1.219  
**Sesión:** IMA-AUDIT-20261107-1943Z  
**Dictamen:** **NO CUMPLE**  
**Estado en completadas.md:** [X] Completado (se conserva el estado histórico; la auditoría no modifica el registro maestro).

## 1. Continuidad, fuentes y alcance

### 1.1 Estado Git
- HEAD de trabajo verificado al inicio y antes de preparar la publicación: 8c492238f99f7902c7468b06676aab819f9eab35; árbol fef688a80199fcba7b620cea2c5bfaad4dbffccc.
- Padre del commit C1.218: ae5dea9f7d342df58a5db393e66691d8249f892e.
- HEAD de la rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Rama de trabajo: 285 commits adelante y 0 detrás de la base al checkpoint C1.218. Se volvió a verificar que ambas referencias permanecían iguales antes de preparar este cierre.

### 1.2 Registros e historial
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2505-2538: TAREA-F6-002 figura [X]. Se verificaron los 12 requisitos funcionales y CA-008..CA-015 contra el código.
- Pendientes.md: lectura convencional devuelve 0 caracteres. Se recuperó y consultó el blob de la rama de trabajo SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene TAREA-F6-002, F6-Task02, changeStudentSection, processStudentReentry ni reconcileStudentLifecycleState. No se modificó. La consulta se realiza por instrucción expresa del usuario, aun cuando la metodología general excluye Pendientes.md del flujo operativo.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff incluye una entrada F6-002 que afirma que changeStudentSection valida el estado del expediente y la capacidad, y que se verificaron comentarios identificativos. La inspección del código contradice parcialmente esa afirmación: no rechaza Inactivo/Suspendido y varias operaciones no aplican la máquina de estados.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-002.md en el árbol actual.
- No existe AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md en la raíz ni en AUDITORIAS del árbol actual. La consulta del historial Git de esa ruta en la rama NG_beta_0.0.0.1_work devolvió una lista vacía. El origen de fase declarado en completadas.md no pudo recuperarse de la rama autorizada.
- Auditoria.txt, MapaDependencias.md y AUDITORIA_COMPLETADAS_PLAN.md no contenían una auditoría individual previa de F6-002.

### 1.3 Archivos y componentes inspeccionados
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, 14.449 líneas:
  - ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS: 1546-1553.
  - getStudentFile: 2510-2614.
  - checkAndRegisterIdempotencyKey/saveIdempotentResult: 279-318.
  - runStudentLifecycleRegressionSuite: 3965-4081.
  - doPost y despacho de operaciones: 879-892; validación común e idempotencia antes del despacho: 660-680 y 968-970.
  - checkEnrollmentCapacity: 11147-11243.
  - createStudentEnrollment/getStudentEnrollments/renewStudentEnrollment: 11271-11395.
  - changeStudentSection: 11403-11480.
  - recordStudentTransfer: 11819-11885.
  - recordStudentWithdrawal: 11888-11954.
  - processStudentReentry: 11957-12019.
  - processStudentPromotion: 12022-12082.
  - processStudentGraduation: 12085-12154.
  - updateStudentLifecycleStatus: 12157-12196.
  - reconcileStudentLifecycleState: 12199-12248.
- dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.

## 2. Evidencia técnica

### 2.1 La máquina de estados existe, pero no gobierna todas las operaciones
ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS (1546-1553) define Activo, Inactivo, Retirado, Trasladado, Suspendido y Graduado. updateStudentLifecycleStatus (12157-12196) sí consulta la matriz antes de escribir. En cambio, recordStudentTransfer, recordStudentWithdrawal, processStudentReentry, processStudentPromotion y processStudentGraduation escriben estados directamente sin validar la transición permitida ni las precondiciones institucionales correspondientes. createStudentEnrollment (11286-11300, 11335-11342) rechaza Fusionado/Eliminado/Graduado, pero permite reactivar otros estados sin exigir el flujo de reincorporación. changeStudentSection (11424-11427) rechaza Fusionado, Eliminado, Graduado, Retirado y Trasladado, pero permite Inactivo y Suspendido, contrario a la afirmación de ChangesLogs.txt.

### 2.2 No se valida consistentemente expediente, matrícula de origen ni periodo
- createStudentEnrollment (11287-11299) continúa cuando no encuentra expediente (expRowIdx === -1), por lo que admite crear una matrícula asociada a un userId sin expediente localizado. Tampoco valida que el periodo destino exista, esté abierto o sea válido; usa "2026" como valor por defecto.
- changeStudentSection (11420-11434) no rechaza explícitamente expediente inexistente si recibe userId y encuentra matrícula activa. No valida la existencia/estado del periodo destino.
- recordStudentTransfer y recordStudentWithdrawal (11835-11847; 11904-11916) no rechazan expRowIdx === -1 ni idx === -1. Pueden escribir un movimiento sin expediente ni matrícula de origen válida y aun así devolver status success.
- processStudentReentry (11972-11993) no exige expRowIdx distinto de -1 antes de llamar createStudentEnrollment. Si se aporta userId inexistente en ExpedientesEstudiantes, createStudentEnrollment también permite continuar sin expediente.
- processStudentPromotion (12037-12056) no rechaza expediente inexistente; con userId puede continuar y crear una matrícula sin expediente.
- processStudentGraduation (12101-12105) sí exige expediente existente.
La búsqueda de matrícula por userId y año no equivale a verificar una matrícula de origen suministrada ni que el movimiento sea compatible con su estado.

### 2.3 Cambios de sección: capacidad y trazabilidad incompletas
changeStudentSection toma LockService (11407-11409), busca una matrícula activa del estudiante y consulta capacidad de destino (11430-11447). Sin embargo:
- actualiza la sección de la misma fila de Matriculas (11451-11452); la situación anterior solo queda en MovimientosEstudiante, no como matrícula histórica independiente.
- no valida que fechaEfectiva sea una fecha válida ni registra explícitamente una fecha de registro en la fila del movimiento.
- permite estados institucionales Inactivo/Suspendido.
- si falla appendRow después de actualizar Matriculas, queda el cambio sin movimiento correspondiente; el lock no revierte escrituras anteriores.
- solo se observó endpoint de cambio de sección; no se acreditó una operación equivalente para jornada/programa en los archivos de UI incluidos.

### 2.4 Traslado solicitado se representa como traslado completado
recordStudentTransfer (11819-11885) cambia cualquier matrícula activa/confirmada a Trasladado (11845-11848) y cambia el expediente a Trasladado (11853-11860), independientemente de estadoTramite. El movimiento guarda estadoTramite o "Completado" (11862-11877). Por tanto, un estadoTramite "Solicitado" no impide que el expediente y la matrícula queden presentados como trasladados. No valida que exista matrícula activa ni expediente; puede crear movimiento con IDs vacíos y devolver éxito. El destino, fecha efectiva y motivo se guardan, pero el flujo de solicitud y confirmación no está separado.

### 2.5 Retiro temporal y definitivo comparten la misma transición institucional
recordStudentWithdrawal (11888-11954) acepta tipoRetiro, pero siempre cambia la matrícula a Retirada y el expediente a Retirado (11914-11928). La descripción del expediente y el tipo de movimiento conservan el texto temporal/definitivo, pero no existe comportamiento operativo distinto para un retiro temporal. Tampoco exige matrícula activa ni expediente existente antes de registrar el movimiento. No se elimina el historial, pero el estado general no diferencia las consecuencias de ambos tipos.

### 2.6 Reincorporación susceptible a fallos parciales y repetición de movimientos
processStudentReentry (11957-12019):
- cambia el expediente a Activo y registra historial antes de crear la matrícula (11974-11980).
- después llama createStudentEnrollment (11983-11993); si la validación de capacidad falla o la escritura falla, el expediente puede quedar Activo sin matrícula.
- al repetir una solicitud, createStudentEnrollment evita una segunda matrícula activa del mismo año (11309-11316), pero processStudentReentry continúa y añade otro movimiento (11995-12011). No es idempotencia integral de la operación.
- no valida que el estado previo permita reincorporación ni que el expediente esté realmente Retirado/Inactivo/Trasladado.
- no se valida el periodo escolar destino.
El lock reduce concurrencia en esta ruta, pero no hace atómicas las escrituras de expediente, matrícula, historial y movimiento.

### 2.7 Promoción/repitencia no comprueba resultados del periodo cerrado
processStudentPromotion recibe anoLectivoCerrado (12023), pero no lo utiliza. No consulta calificaciones ni resultados del periodo cerrado, no valida que esté cerrado, no determina promoción/repitencia desde resultados ni registra una decisión administrativa validada. Solo crea una matrícula en anoLectivoNuevo (12046-12056) y añade un movimiento (12058-12074). Si createStudentEnrollment devuelve status error por cupo, el método no comprueba result.status antes de añadir movimiento y devuelve éxito con matriculaId vacío. No se acredita conservación de matrícula anterior como registro separado ni validación de expediente/periodo.

### 2.8 Graduación sin comprobación de requisitos configurados
processStudentGraduation (12085-12154) exige expediente y evita repetir el cambio si ya está Graduado (12103-12110), pero no consulta requisitos configurados del programa, asignaturas, créditos, resultados o cierre académico antes de graduar. Cambia todas las matrículas Activa/Confirmada del estudiante, sin filtrar por año (12112-12118), a Graduada. Conserva expediente, matrículas, documentos y movimientos; getStudentFile (2510-2614) consulta el expediente y lista todas las matrículas/movimientos sin excluir por estado, por lo que el acceso histórico autorizado parece preservarse en el flujo de lectura. No se ejecutó prueba funcional de permisos ni de acceso.

### 2.9 Idempotencia opcional, temporal y con carrera concurrente
checkAndRegisterIdempotencyKey (279-304) retorna null si el cliente no proporciona idempotencyToken/idempotencyKey. No registra una clave en curso antes de ejecutar la operación. saveIdempotentResult (306-318) guarda solo respuestas success en CacheService por 21.600 segundos (6 horas). Dos solicitudes simultáneas con la misma clave pueden leer caché vacía antes de que cualquiera guarde el resultado y ejecutar ambas. No es idempotencia durable.
createStudentEnrollment evita una segunda matrícula activa por userId/año (11309-11316), pero no evita duplicar los movimientos de reingreso/traslado/retiro/promoción ni las escrituras parciales. Las funciones críticas usan tryLock, pero la presencia de LockService no proporciona rollback entre hojas. checkEnrollmentCapacity (11151-11156) continúa leyendo si tryLock devuelve false, en lugar de fallar cerrado; las rutas de escritura principales tienen sus propios locks, pero no se aportó prueba concurrente que certifique CA-009.

### 2.10 Conciliación limitada y no transaccional
reconcileStudentLifecycleState (12199-12248) no adquiere LockService. Solo detecta matrículas Activa/Confirmada de expedientes Graduado, Retirado o Trasladado (12216-12237). No detecta duplicados activos por periodo, expedientes sin matrícula, movimientos sin expediente/matrícula, traslados pendientes mal representados, reincorporaciones parciales ni promociones fallidas. autoFix escribe filas una por una sin journal, bloqueo ni mecanismo de reversión; una excepción durante el recorrido puede dejar corrección parcial. No es un mecanismo general de recuperación ante fallos entre hojas/microservicios.

### 2.11 Fecha efectiva y fecha de registro no están explícitamente separadas
Las filas añadidas a MovimientosEstudiante guardan fecha efectiva en el índice 9, pero no incluyen una columna independiente fechaRegistro/createdAt. El ID MOV-<epoch> codifica indirectamente el momento de creación y logStructuredEvent puede registrar eventos aparte, pero eso no sustituye dos campos explícitos y consultables en el propio movimiento. La lectura getStudentFile expone fechaEfectiva, no fechaRegistro (2580-2590).

### 2.12 UI y pruebas no acreditan el flujo completo
- js/secretary.js contiene la consola de solicitudes de admisión y conversión, pero no referencias a createStudentEnrollment, renewStudentEnrollment, changeStudentSection, recordStudentTransfer, recordStudentWithdrawal, processStudentReentry, processStudentPromotion, processStudentGraduation o reconcileStudentLifecycleState.
- js/teacher.js y teacher-dashboard.html tampoco contienen llamadas a esas operaciones. dashboard-secretaria.html no contiene controles identificables para los movimientos F6-002. Esto no prueba que no exista otra interfaz fuera del alcance inspeccionado, pero los archivos involucrados declarados en la tarea no acreditan integración de esos flujos.
- runStudentLifecycleRegressionSuite (3965-4081) incluye TC-01 a TC-07, pero TC-07 solo llama createStudentEnrollment con skipLock:true y acepta status success o error (4038-4046); no compara conteos antes/después ni crea concurrencia real. TC-02 ejecuta conciliación dry-run; TC-03 verifica solo la matriz en memoria; TC-06 comprueba forma de respuesta de historial, no inmutabilidad de datos.
- tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen casos F6-002 ni llamadas a los endpoints de ciclo de vida.
- No se ejecutaron Apps Script, navegador, pruebas de integración ni pruebas concurrentes con Google Sheets. Los casos de la suite embebida no fueron ejecutados.

## 3. Matriz de requisitos y criterios

| Requisito/criterio | Resultado | Evidencia |
|---|---|---|
| R1: transiciones generales y de matrícula | Parcial | Existe matriz, pero los endpoints de movimientos la omiten; estados de expediente y matrícula se actualizan por separado. |
| R2: impedir matrículas activas incompatibles por periodo | Parcial | createStudentEnrollment detecta duplicado userId/año bajo lock; no hay invariante transversal ni prueba concurrente. |
| R3: expediente, periodo, matrícula origen, estado y condiciones | No cumple | Varios métodos aceptan expediente/matrícula inexistentes; no se valida periodo; operaciones omiten matriz. |
| R4: conservar situación anterior y registrar nueva con fecha/motivo | Parcial | changeStudentSection registra movimiento, pero sobrescribe sección en la misma matrícula; faltan operaciones para otros cambios y fechaRegistro. |
| R5: traslado con estado solicitado/completado | No cumple | La matrícula y expediente se marcan Trasladado incluso con estadoTramite Solicitado. |
| R6: retiro temporal/definitivo | No cumple | Se almacena el texto tipo, pero ambos ejecutan idéntica transición Retirada/Retirado. |
| R7: reingreso reutiliza identidad y crea matrícula del nuevo periodo | Parcial | Reutiliza userId/expediente cuando existe; no exige expediente y puede dejar estado parcial. |
| R8: promoción/repitencia desde periodo cerrado | No cumple | anoLectivoCerrado no se utiliza; no se consultan resultados. |
| R9: graduación con requisitos y bloqueo de nuevas matrículas | No cumple | No se validan requisitos; createStudentEnrollment sí bloquea Graduado, pero no se acredita control integral de todas las rutas. |
| R10: idempotencia y concurrencia con LockService | Parcial | Locks en rutas principales y deduplicación matrícula/año; claves opcionales en caché y movimientos duplicables. |
| R11: recuperación/conciliación de fallos parciales | No cumple | Conciliación limitada, sin lock, journal ni rollback. |
| R12: fecha efectiva y fecha real de registro | Parcial | fecha efectiva se guarda; fechaRegistro no es un campo de movimiento independiente. |
| CA-008: segundo reingreso idéntico no duplica matrícula | Parcial | La matrícula por userId/año se deduplica, pero se duplica el movimiento y no hay idempotencia completa. |
| CA-009: solicitudes concurrentes no exceden cupo | No verificable | Lock en escritores principales, pero no hay prueba concurrente; checkEnrollmentCapacity sigue sin lock cuando tryLock falla. |
| CA-010: transición inválida no deja cambios parciales | No cumple | Algunas rutas validan matriz, otras la omiten; reingreso modifica expediente antes de crear matrícula. |
| CA-011: traslado incompleto queda pendiente | No cumple | Estado expediente/matrícula se vuelve Trasladado aunque trámite sea Solicitado. |
| CA-012: promoción/repitencia no altera calificaciones históricas | Parcial | La función no escribe directamente calificaciones, pero no consulta periodo cerrado ni existe prueba de inmutabilidad. |
| CA-013: graduación conserva acceso histórico autorizado | Parcial/Cumple estático | getStudentFile sigue devolviendo expediente, matrículas y movimientos sin filtrar Graduado; no se probó autorización/runtime. |
| CA-014: distinguir fecha efectiva y fecha de registro | No cumple | No existe fechaRegistro explícita en la fila de movimiento. |
| CA-015: coherencia tras fallo simulado y recuperación | No cumple | No hay simulación de fallos ni recuperación transaccional suficiente. |

## 4. Hallazgos

### H1 - CRÍTICO/P0: escrituras parciales entre expediente, matrícula y movimiento
Reingreso cambia el expediente antes de crear la matrícula; cambios de sección/traslado/retiro/promoción/graduación realizan varias escrituras sin rollback ni journal transaccional. Un error intermedio puede dejar estado institucional y matrícula divergentes.

### H2 - ALTO/P1: máquina de estados no aplicada de forma uniforme y precondiciones incompletas
Solo updateStudentLifecycleStatus usa ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS. Otros endpoints cambian estados directamente. Se aceptan expedientes inexistentes en varios caminos, no se valida periodo y no se exige una matrícula de origen válida en traslado/retiro.

### H3 - ALTO/P1: traslado solicitado marca al estudiante como trasladado
recordStudentTransfer actualiza expediente/matrícula a Trasladado independientemente de estadoTramite; falla CA-011.

### H4 - ALTO/P1: retiro temporal y definitivo no tienen semántica operativa distinta
Ambos marcan expediente Retirado y matrícula Retirada; el tipo solo queda en texto/movimiento.

### H5 - ALTO/P1: promoción/repitencia no usa resultados del periodo cerrado
anoLectivoCerrado no se utiliza y no se consultan resultados; puede emitir movimiento y éxito incluso cuando createStudentEnrollment devuelve error de cupo.

### H6 - ALTO/P1: graduación no valida requisitos configurados
El endpoint declara Graduado sin comprobar requisitos académicos/administrativos del programa y cambia todas las matrículas activas sin filtrar periodo.

### H7 - ALTO/P1: idempotencia no garantiza operaciones críticas ni solicitudes simultáneas
El token es opcional, el resultado se guarda después de ejecutar y solo en caché por seis horas. No hay reserva atómica de clave en curso. Los movimientos pueden duplicarse aun cuando matrícula se deduplica.

### H8 - ALTO/P1: conciliación no recupera estados parciales generales
reconcileStudentLifecycleState no usa lock y cubre solo expedientes terminales con matrícula activa; no restaura operaciones interrumpidas ni valida todos los enlaces.

### H9 - MEDIO/P2: fecha real de registro no es explícita en el movimiento
El registro expone fecha efectiva, pero no un campo de fecha de registro.

### H10 - MEDIO/P2: integración UI y pruebas conductuales incompletas
Los archivos de UI incluidos no invocan los endpoints de ciclo de vida. La suite embebida no prueba de forma efectiva idempotencia, concurrencia, fallos parciales, requisitos de graduación ni estados de traslado/retiro.

## 5. Dictamen

**NO CUMPLE.** El backend dispone de una matriz de estados, locks en varios endpoints, una deduplicación de matrícula por estudiante/año y una función de conciliación. No obstante, esos elementos no forman un flujo institucional íntegro: los movimientos no aplican uniformemente la matriz, se permiten expedientes/matrículas de origen ausentes, el traslado solicitado se convierte en traslado final, el retiro temporal se procesa igual que el definitivo, la promoción ignora el periodo cerrado, la graduación omite requisitos y la recuperación no es transaccional. La idempotencia basada en token es opcional y temporal. Los registros [X] de completadas.md y ChangesLogs.txt se conservan como histórico, pero no acreditan los criterios.

## 6. Pruebas ejecutadas y limitaciones

**Ejecutadas:** inspección manual dirigida de requisitos, matriz, validaciones, operaciones backend, locks, escrituras, idempotencia, dispatcher, acceso histórico, archivos UI, suites, historial de ruta del informe de fase, SHA y árbol Git. Se recuperó Pendientes.md desde el blob íntegro y se consultó por las referencias de F6-002.

**No ejecutadas:** Apps Script runtime, navegador, Google Sheets real, pruebas HTTP por rol, concurrencia real, inyección de fallos entre escrituras, pruebas de recuperación, verificación de configuración institucional de graduación ni pruebas automatizadas. No se accedió ni modificó datos productivos.

## 7. Tareas ejecutables derivadas de los hallazgos

Las tareas siguientes son locales a esta auditoría; no sustituyen ni duplican IDs globales. La implementación deberá coordinarse con TAREA-F6-003 (suite de regresión) y las operaciones de matrícula ya existentes.

### F6-002-A01 - Aplicar una máquina de estados única y validar precondiciones institucionales
- **Hallazgos de origen:** H2.
- **Severidad:** Alto.
- **Objetivo:** impedir transiciones no permitidas y movimientos sobre expedientes o matrículas inexistentes.
- **Acción ejecutable:** centralizar validación de estado general y matrícula; exigir expediente existente/no fusionado, periodo destino válido, matrícula origen perteneciente al usuario y condiciones académicas/administrativas; hacer que todos los endpoints utilicen la matriz.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; hojas ExpedientesEstudiantes, Matriculas, OfertaAcademica y periodos académicos.
- **Dependencias y riesgos:** ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS; createStudentEnrollment; validateRolePermission; no bloquear acceso histórico.
- **Alcance:** validación backend de operaciones F6-002; no rediseñar roles ni otras fases.
- **Criterios de aceptación:** expediente inexistente/fusionado y periodo inválido se rechazan antes de escribir; cada transición se valida contra matriz; estado general y de matrícula quedan coherentes; estados Inactivo/Suspendido no pasan por rutas no permitidas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A02 - Separar solicitud y confirmación de traslado
- **Hallazgos de origen:** H3.
- **Severidad:** Alto.
- **Objetivo:** mantener traslado pendiente hasta que exista confirmación válida.
- **Acción ejecutable:** definir estados de trámite permitidos; solicitud registra destino/fecha/motivo sin cerrar expediente ni matrícula; completar solo mediante transición explícita y validada; rechazar expediente/matrícula inexistente.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html.
- **Dependencias y riesgos:** recordStudentTransfer; MovimientosEstudiante; ExpedientesEstudiantes; Matriculas.
- **Alcance:** traslado externo y su ciclo solicitado/completado.
- **Criterios de aceptación:** Solicitado conserva estado institucional/matrícula vigente; Completado cambia ambos con trazabilidad; transición inválida no escribe; doble solicitud no duplica movimientos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A03 - Diferenciar retiro temporal y definitivo
- **Hallazgos de origen:** H4.
- **Severidad:** Alto.
- **Objetivo:** preservar consecuencias distintas de ambos tipos de retiro.
- **Acción ejecutable:** definir estados y reglas para temporal/definitivo; impedir que un retiro temporal cierre definitivamente el expediente; validar matrícula de origen y guardar motivo/fechas.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html.
- **Dependencias y riesgos:** recordStudentWithdrawal; processStudentReentry; ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS.
- **Alcance:** retiro y posterior reingreso; no borrar antecedentes.
- **Criterios de aceptación:** temporal queda suspendido/retirado temporal conforme a regla institucional configurable; definitivo bloquea reingreso ordinario; ambos conservan historial y no alteran calificaciones.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A04 - Hacer reincorporación atómica e idempotente
- **Hallazgos de origen:** H1 y H7.
- **Severidad:** Crítico.
- **Objetivo:** evitar expediente Activo sin matrícula y movimientos duplicados.
- **Acción ejecutable:** validar expediente y estado antes de iniciar; aplicar clave idempotente durable/atómica; registrar operación y resultado; ordenar o compensar escrituras para que expediente, matrícula, historial y movimiento se confirmen juntos o queden recuperables.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; ExpedientesEstudiantes; Matriculas; MovimientosEstudiante; HistorialCambiosEntidad.
- **Dependencias y riesgos:** processStudentReentry; createStudentEnrollment; LockService; CacheService; checkAndRegisterIdempotencyKey.
- **Alcance:** reincorporación y reintentos idénticos.
- **Criterios de aceptación:** segundo reingreso idéntico devuelve el mismo resultado y no añade matrícula ni movimiento; fallo en cada punto de escritura deja estado recuperable y no declara éxito; expediente inexistente/estado incompatible se rechaza.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A05 - Validar promoción y repitencia contra el periodo cerrado
- **Hallazgos de origen:** H5.
- **Severidad:** Alto.
- **Objetivo:** que la decisión se derive de resultados académicos oficiales y decisión administrativa válida.
- **Acción ejecutable:** usar anoLectivoCerrado; comprobar que está cerrado; consultar calificaciones/promedios oficiales; validar reglas de promoción/repitencia y crear la matrícula nueva sin modificar registros anteriores; comprobar status de creación antes de registrar movimiento/éxito.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; Matriculas; HistorialAcademico; js/secretary.js; dashboard-secretaria.html.
- **Dependencias y riesgos:** processStudentPromotion; createStudentEnrollment; getAcademicHistory; reglas institucionales.
- **Alcance:** promoción/repitencia; no recalcular ni sobrescribir notas históricas.
- **Criterios de aceptación:** periodo origen cerrado y perteneciente al estudiante; resultado determina la opción permitida; fallo de cupo no registra movimiento ni éxito; notas históricas permanecen idénticas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A06 - Aplicar requisitos configurados antes de graduar
- **Hallazgos de origen:** H6.
- **Severidad:** Alto.
- **Objetivo:** impedir graduaciones sin cumplimiento académico/administrativo.
- **Acción ejecutable:** consultar requisitos configurados del programa y resultados oficiales; validar periodo/programa/fecha; bloquear matrículas incompatibles posteriores sin borrar historial.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; configuración institucional; Matriculas; HistorialAcademico; js/secretary.js; dashboard-secretaria.html.
- **Dependencias y riesgos:** processStudentGraduation; getStudentFile; getAcademicHistory; ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS.
- **Alcance:** validación y registro de graduación.
- **Criterios de aceptación:** requisitos incompletos impiden graduar sin escrituras; requisitos cumplidos generan registro único con programa/fecha; expediente y documentos históricos siguen accesibles para roles autorizados; no quedan matrículas activas incompatibles.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A07 - Fortalecer concurrencia e idempotencia de todas las operaciones críticas
- **Hallazgos de origen:** H1 y H7.
- **Severidad:** Alto.
- **Objetivo:** garantizar una sola ejecución lógica por operación y proteger cupos.
- **Acción ejecutable:** exigir clave idempotente por operación crítica; reservarla atómicamente antes de escribir; persistir resultado; asegurar que todos los escritores respeten el mismo lock y que un lock no adquirido detenga la operación.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; CacheService/LockService; Matriculas; MovimientosEstudiante.
- **Dependencias y riesgos:** checkAndRegisterIdempotencyKey; saveIdempotentResult; checkEnrollmentCapacity; createStudentEnrollment; endpoints F6-002.
- **Alcance:** cambio de sección, traslado, retiro, reingreso, renovación, promoción y graduación.
- **Criterios de aceptación:** solicitudes concurrentes idénticas no duplican filas; operaciones distintas no exceden cupo; token reutilizado con payload distinto se rechaza; fallo de lock devuelve error sin leer/escribir como si estuviera protegido.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A08 - Incorporar fecha efectiva y fecha real de registro en movimientos
- **Hallazgos de origen:** H9.
- **Severidad:** Medio.
- **Objetivo:** diferenciar operaciones retroactivas de operaciones registradas en tiempo real.
- **Acción ejecutable:** agregar fechaRegistro/createdAt explícita e inmutable a MovimientosEstudiante; conservar fechaEfectiva; adaptar lectura y compatibilidad histórica.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; MovimientosEstudiante; getStudentFile y reportes consumidores.
- **Dependencias y riesgos:** appendRow de movimientos; hojas existentes con esquema legacy; no reinterpretar fechas históricas.
- **Alcance:** trazabilidad temporal de movimientos.
- **Criterios de aceptación:** toda operación guarda ambas fechas; fechaRegistro la asigna servidor y no puede retrotraerse por el cliente; consultas muestran ambas; registros antiguos siguen leyéndose sin inventar fechas.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A09 - Integrar controles de ciclo de vida en las interfaces declaradas
- **Hallazgos de origen:** H10.
- **Severidad:** Medio.
- **Objetivo:** que Secretaría pueda operar los flujos institucionales desde la interfaz declarada en la tarea.
- **Acción ejecutable:** incorporar controles y llamadas para cambio de sección, traslado, retiro, reingreso, promoción, repitencia y graduación; presentar estados de trámite y errores reales; no permitir éxito visual ante fallo de backend.
- **Archivos/módulos afectados:** dashboard-secretaria.html; js/secretary.js; teacher-dashboard.html; js/teacher.js solo si el alcance funcional lo requiere.
- **Dependencias y riesgos:** endpoints ACADEMIC y permisos; no exponer operaciones a roles no autorizados.
- **Alcance:** interfaz de ciclo de vida, no rediseño general del dashboard.
- **Criterios de aceptación:** cada acción visible invoca el endpoint correcto; permisos se validan en servidor; errores/pendientes se muestran sin falsos éxitos; historial refleja el movimiento.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-002-A10 - Ampliar pruebas conductuales de ciclo de vida
- **Hallazgos de origen:** H1-H10.
- **Severidad:** Alto.
- **Objetivo:** probar criterios CA-008..CA-015 y fallos de integración.
- **Acción ejecutable:** añadir fixtures aislados y pruebas de doble solicitud/concurrencia, fallos entre escrituras, transición inválida, traslado solicitado, retiro temporal/definitivo, promoción con periodo cerrado, graduación sin requisitos, acceso histórico y fechas retroactivas.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js o suite específica; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** TAREA-F6-003 (batería general de regresión) se referencia como dependencia; no duplicar su ID ni asumir que su marca [X] certifica estas pruebas.
- **Alcance:** pruebas específicas F6-002, sin modificar datos productivos.
- **Criterios de aceptación:** cada CA tiene al menos un caso positivo y uno negativo; concurrencia real simulada; fallos parciales reproducibles; assertions comparan filas antes/después y no solo status; resultados repetibles y aislados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

## 8. Cierre
- Dictamen: NO CUMPLE.
- Código y pruebas: sin modificaciones.
- completadas.md: sin modificación; se conserva [X] histórico.
- Pendientes.md: consultado desde blob íntegro; sin modificación.
- ChangesLogs.txt: sin modificación porque no hubo cambio funcional.
- Rama base: sin modificaciones.
- Siguiente tarea: TAREA-F6-003, marcada [X] en completadas.md; debe auditarse por separado.

## 9. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2505-2538.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.
- Informe de fase declarado por la tarea: no encontrado en el árbol ni historial de la rama autorizada.
