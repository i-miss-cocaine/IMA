# AUDITORÍA TÉCNICA - TAREA-F6-003: batería automatizada de regresión del ciclo de vida del estudiante

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.219  
**Checkpoint de cierre:** C1.220  
**Sesión:** IMA-AUDIT-20261107-1953Z  
**Dictamen:** **NO CUMPLE**  
**Estado en completadas.md:** [X] Completado (se conserva el estado histórico; esta auditoría no modifica el registro maestro).

## 1. Continuidad, fuentes y alcance

### 1.1 Estado Git
- HEAD de trabajo al iniciar: e1de4306ab4ddeb7de91494f96c17e695f5e8b69; árbol c7a7367d1ba053e5a3938c0450e2fa11eb53f09b.
- Padre del HEAD: 8c492238f99f7902c7468b06676aab819f9eab35 (commit que contiene C1.219).
- Rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Comparación al inicio: rama de trabajo 287 commits adelante y 0 detrás de la base.
- C1.219 consignó 8c4922 como HEAD auditado porque era el padre de su commit documental. La referencia actual avanzó al commit e1de430 que contiene el checkpoint C1.219; no hay divergencia ni cambio ajeno. Se actualiza la continuidad en C1.220.
- La rama base permanece sin cambios.

### 1.2 Requisitos y registros
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, línea 2548: TAREA-F6-003 aparece [X]. Se revisaron los siete requisitos funcionales y CA-016..CA-022.
- Pendientes.md: lectura convencional devuelve 0 caracteres. Se recuperó el blob histórico íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1782094 caracteres y 20182 líneas. No contiene TAREA-F6-003, F6-003 ni "regresión del ciclo de vida". No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1945-1948: el único cambio atribuido a F6-003 fue agregar TC-06 y TC-07 a runStudentLifecycleRegressionSuite. No se documentan otras suites, fixtures, pruebas de permisos, Drive, fallos de integración ni ejecución concurrente.
- No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-003.md en el árbol actual; el historial Git consultado para esa ruta devuelve lista vacía.
- No existe AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md en el árbol ni en el historial Git consultado para esa ruta.
- Auditoria.txt, MapaDependencias.md y AUDITORIA_COMPLETADAS_PLAN.md no contenían auditoría individual previa de F6-003.
- METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee: se siguieron las reglas de checkpoint, auditoría previa a cambios, commit único por iteración, preservación histórica y verificación Git. Se inspeccionaron las secciones 15, 16 y 17.

### 1.3 Archivos y componentes inspeccionados
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, 14.449 líneas:
  - SPREADSHEET_ID y configuración: línea 5.
  - ROLE_PERMISSIONS: línea 168; runStudentLifecycleRegressionSuite está autorizado para Administrador, Director, Secretaría y Secretaria.
  - PUBLIC_ACTIONS: línea 265; la suite no es pública.
  - validateRolePermission: desde línea 524; requiere credencial de sesión válida y permiso.
  - doPost: validación RBAC, saneamiento de skipLock y despacho; suite despachada en línea 892.
  - validateApiContractsTestSuite: alrededor de línea 3900; solo cuatro endpoints de contrato.
  - runStudentLifecycleRegressionSuite: línea 3964, casos TC-01..TC-07 y registro de resultado.
  - runConcurrencyAndConsistencySuite: línea 3296; solo adquiere y libera un lock en una única ejecución.
  - runCurricularAreaServiceTests: línea 4147; declara resultados PASS estáticos sin ejecutar pruebas de conectividad, RBAC ni integridad.
  - findDuplicateStudents: línea 10107.
  - mergeStudentFiles: línea 10282.
  - getStudentGuardians: línea 10553.
  - uploadStudentDocument: línea 10693.
  - checkEnrollmentCapacity: línea 11147.
  - createStudentEnrollment: línea 11271.
  - getStudentFile: línea 2510.
  - reconcileStudentLifecycleState: línea 12199.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412; el registro ACADEMIC declara runStudentLifecycleRegressionSuite.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6, 412 líneas; 0 menciones de F6-003, runStudentLifecycleRegressionSuite o flujos del expediente.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683, 61 líneas; suite ajena al ciclo de vida.
- Árbol Git completo: 985 entradas, no truncado. Solo existen esos dos archivos bajo tests/regression. No se encontró package.json, configuración Jest/Vitest/Playwright/Cypress ni workflow de CI en el árbol.

## 2. Evidencia técnica

### 2.1 La suite contiene siete casos, pero no es una batería de regresión integral
runStudentLifecycleRegressionSuite define TC-01..TC-07:
- TC-01 comprueba dos propiedades de la matriz ALLOWED_STUDENT_LIFECYCLE_TRANSITIONS en memoria.
- TC-02 llama reconcileStudentLifecycleState({autoFix:false}) y valida únicamente status y que totalExpedientesAuditados sea numérico.
- TC-03 comprueba que la lista de transiciones de Graduado no incluya Activo; no invoca una operación que rechace una transición.
- TC-04 llama findDuplicateStudents con {nombre, dni}; la función espera {nombres, apellidos, identificacion, fechaNacimiento, email, telefono, solicitudId}. Los nombres de parámetros no coinciden.
- TC-05 consulta capacidad para 2026/1er Grado/A y valida tipos boolean/number. No crea escenario controlado ni comprueba límite, cupo ocupado, sobrecupo o persistencia.
- TC-06 llama getAcademicHistory con un identificador sintético, pero solo comprueba status y que calificaciones sea un arreglo. No toma snapshot antes/después, no compara notas ni matrícula histórica y no invoca una escritura de año nuevo.
- TC-07 llama una sola vez createStudentEnrollment con userId STU-SYNTHETIC-TEST-001 y skipLock:true. No lanza solicitudes concurrentes, no repite la misma clave, no consulta conteos antes/después y acepta status success o error como PASS. El mensaje afirma que no hubo duplicación sin verificarlo.

### 2.2 La suite no está aislada de producción y puede escribir datos reales
- backend/academic-service/Code.gs declara un SPREADSHEET_ID fijo en línea 5, sin inyección de dependencia ni selección de base de pruebas en la suite.
- TC-02, TC-04, TC-05 y TC-06 llaman funciones que acceden al SpreadsheetApp configurado. Varios caminos usan getOrCreateSheet, que puede crear hojas si faltan.
- TC-07 llama createStudentEnrollment directamente con el mismo SPREADSHEET_ID de producción. La función puede insertar una matrícula si no encuentra una existente y sus validaciones permiten continuar en ciertos escenarios sin expediente localizado. El identificador STU-SYNTHETIC-TEST-001 no convierte la hoja de producción en un entorno sintético.
- Al final de la suite se llama logStructuredEvent, que abre el mismo spreadsheet y añade un registro en LogsSistema.
- La suite no dispone de setup/teardown, fixtures aislados, rollback, spreadsheet temporal ni una barrera que rechace explícitamente el ID productivo.
- Por estas razones CA-021 no se cumple y la ejecución remota de la suite puede alterar Matriculas, crear hojas o escribir LogsSistema. No se ejecutó para evitar cualquier modificación productiva.

### 2.3 TC-07 no prueba concurrencia ni idempotencia
- El caso es una sola llamada síncrona, no un conjunto de solicitudes simultáneas.
- Pasa skipLock:true a createStudentEnrollment, evitando precisamente el candado que se debería probar. El doPost elimina skipLock en llamadas externas, pero la suite llama la función internamente y construye el payload con skipLock:true.
- No prueba token idempotente, reutilización con payload distinto, respuesta perdida, reintento ni resultado persistido.
- Aceptar tanto success como error hace que una falla de cupo, validación o servicio pueda contarse como aprobación.
- No hay assertion del número de filas activas antes/después ni de unicidad por estudiante/periodo.
- runConcurrencyAndConsistencySuite no cubre este vacío: su caso único ejecuta withConcurrencyLock una vez y verifica executed=true. No crea contención ni solicita dos escrituras simultáneas.

### 2.4 No se prueban los flujos críticos declarados
No se encontraron casos conductuales que ejecuten y verifiquen:
- creación de expediente y asociación con identidad;
- fusión de expedientes, re-vinculación de documentos/movimientos e historial de fusión;
- asociación, revocación y aislamiento de responsables/tutores;
- carga, sustitución, recuperación, integridad y permisos de documentos en Drive;
- matrícula inicial y renovación con assertions de persistencia;
- cambio de sección/grado y conservación de matrícula anterior;
- traslado, retiro temporal/definitivo, reingreso, promoción, repitencia y graduación;
- lectura histórica por rol y preservación de calificaciones/matrículas anteriores;
- llamadas entre servicios, fallos de dependencias y reintentos;
- restauración/verificación de respaldos del expediente.
getStudentFile y mergeStudentFiles existen, pero la suite no los invoca. Tampoco invoca getStudentGuardians ni uploadStudentDocument.

### 2.5 Las pruebas de contratos y áreas curriculares no sustituyen la regresión F6-003
- validateApiContractsTestSuite verifica cuatro respuestas básicas (ping, getAcademicConfig, getSectionEquivalences, calculateUnifiedAcademicGrade). Comprueba campos y status, no contratos de operaciones del expediente, permisos, persistencia o fallos.
- runCurricularAreaServiceTests busca un área en hoja y luego construye cuatro resultados PASS constantes (ping, RBAC, integridad, esquema). No realiza esas cuatro pruebas.
- academic-grading-suite.js contiene comprobaciones estáticas de presencia de funciones/cadenas para múltiples fases, pero no contiene referencia F6-003 ni ejecuta los casos de ciclo de vida.
- modular-dashboard-suite.js prueba archivos/configuración de dashboards, no el ciclo de vida.
- No se encontró orquestador local, script npm ni workflow de CI que ejecute una suite F6-003 aislada y publique un reporte.

### 2.6 Autorización de la suite y reporte de resultados
- La acción está despachada en doPost y protegida por validateRolePermission. No está en PUBLIC_ACTIONS.
- ROLE_PERMISSIONS permite ejecutar la suite a Administrador, Director, Secretaría y Secretaria. No hay un caso que invoque el backend con rol no autorizado y demuestre rechazo, ni prueba directa de bypass del dispatcher.
- Cada caso guarda id, name y status PASS/FAIL, y los errores guardan err.message. Sin embargo, no se registra payload de entrada, precondición, resultado esperado frente al observado ni un estado SKIP/NOT_RUN.
- La función devuelve status:"success" incluso si passedCount es menor que testCases.length; el consumidor debe revisar aparte todasPruebasPasaron. Esto facilita interpretar como éxito una ejecución que contiene fallos.

## 3. Matriz de requisitos y criterios

| Requisito/criterio | Resultado | Evidencia |
|---|---|---|
| RF1: pruebas repetibles de todos los flujos enumerados | No cumple | Solo siete casos superficiales; no cubren expediente, fusión, tutores, documentos, movimientos, graduación ni respaldos. |
| RF2: positivos, inválidos, concurrencia, fallos y reintentos | No cumple | No hay pruebas negativas operativas, concurrencia, fallos inyectados ni reintentos. |
| RF3: resultados visibles y persistencia en Sheets/Drive | No cumple | No hay assertions de filas/Drive ni comparación de estado antes/después. |
| RF4: rechazo de roles no autorizados por llamada directa | No cumple | No hay caso de autorización negativa ni llamada directa con token/rol no autorizado. |
| RF5: datos sintéticos aislados | No cumple | SPREADSHEET_ID fijo; TC-07 puede escribir en Matriculas productiva; suite registra en LogsSistema. |
| RF6: año nuevo no altera notas/matrículas anteriores | No cumple | TC-06 solo valida tipo de respuesta; no toma snapshots ni compara valores. |
| RF7: informe de aprobadas, fallidas y no ejecutadas | Parcial | PASS/FAIL existe; no hay SKIP/NOT_RUN ni reporte completo con inputs y expected/actual. |
| CA-016: cada flujo crítico tiene prueba positiva y negativa reproducible | No cumple | Flujos ausentes y casos existentes no ejecutan operaciones críticas. |
| CA-017: detectar duplicados ante reintentos concurrentes | No cumple | TC-07 es secuencial, omite lock y no mide duplicados. |
| CA-018: detectar accesos no autorizados a expedientes/documentos | No cumple | No hay pruebas de RBAC/IDOR sobre estos recursos. |
| CA-019: detectar alteraciones indebidas del historial | No cumple | TC-06 no compara historial antes/después. |
| CA-020: fallos de integración no se interpretan como éxito | No cumple | No hay inyección de fallos; TC-07 admite error como PASS y la suite devuelve status success siempre. |
| CA-021: ejecución sin modificar expedientes reales | No cumple | Spreadsheet productivo fijo, posibles escrituras en Matriculas y LogsSistema, sin entorno aislado. |
| CA-022: identificar caso, entrada y resultado observado | Parcial | Identifica ID/nombre/estado/error, pero no entrada, expected/actual ni casos omitidos. |

## 4. Hallazgos

### H1 - CRÍTICO/P0: la suite puede modificar datos productivos
No existe separación de entorno ni protección contra SPREADSHEET_ID productivo. TC-07 puede insertar una matrícula real y cada ejecución escribe un evento en LogsSistema. Otros casos pueden crear hojas por getOrCreateSheet. La propia suite incumple CA-021 y no es segura para ejecución periódica.

### H2 - CRÍTICO/P0: TC-07 puede aprobar sin demostrar idempotencia
La prueba llama una vez, desactiva el lock con skipLock:true y considera PASS tanto success como error. No verifica número de matrículas ni movimientos, ni utiliza clave idempotente. No puede detectar duplicados ni concurrencia.

### H3 - ALTO/P1: TC-04 envía parámetros incompatibles
findDuplicateStudents espera nombres/apellidos/identificacion, pero TC-04 envía nombre/dni. La búsqueda queda sin los atributos que el caso dice probar y puede devolver una respuesta formalmente válida sin comprobar detección de duplicados.

### H4 - ALTO/P1: TC-01 y TC-03 son pruebas estáticas, no conductuales
Ambos leen la matriz en memoria. Ninguno invoca updateStudentLifecycleStatus ni una operación de negocio con estado inválido; no detectan escrituras parciales ni regresiones de validación.

### H5 - ALTO/P1: TC-02 y TC-05 verifican forma, no reglas del negocio
TC-02 valida status y un contador; no afirma que la conciliación detecte inconsistencias conocidas ni que autoFix:false preserve el estado. TC-05 valida tipos, no límites, reservas, sobrecupo ni persistencia.

### H6 - ALTO/P1: historial académico no se compara antes/después
TC-06 solo comprueba que la consulta de historial devuelva un arreglo. No captura calificaciones/matrículas previas, ejecuta cambio de año ni compara snapshots. CA-019 y RF6 quedan sin prueba.

### H7 - ALTO/P1: ausencia de cobertura de expedientes, documentos, tutores, permisos e integraciones
No hay casos para la mayoría de los flujos exigidos en RF1/RF2/RF3/RF4. Las dependencias declaradas (getStudentFile, mergeStudentFiles, etc.) no aparecen en los casos TC-01..TC-07.

### H8 - ALTO/P1: no se prueban fallos dependientes ni reintentos
No hay stubs/mocks, inyección de error, timeout, respuesta perdida, rollback, reintento ni recuperación. El contrato de status puede marcar error como PASS en TC-07 y la suite externa siempre devuelve status success.

### H9 - MEDIO/P2: reporte incompleto y estado global ambiguo
No existe estado SKIP/NOT_RUN, ni expected/actual, fixture/entrada, duración o evidencia de persistencia. status:"success" indica que la función terminó, no que las pruebas pasaron; el reporte no distingue inequívocamente esos conceptos.

### H10 - MEDIO/P2: no existe ejecución automatizada reproducible integrada al repositorio
El árbol solo contiene dos scripts de regresión no específicos de F6-003. No se encontró package.json, runner de pruebas ni workflow CI. No hay evidencia de ejecución automatizada periódica ni artefacto de reporte.

## 5. Dictamen

**NO CUMPLE.** La implementación actual es un conjunto de siete comprobaciones parciales incrustadas en el backend productivo, no una suite integral y segura. Varias pruebas verifican únicamente propiedades estáticas o formas de respuesta. TC-04 utiliza parámetros incorrectos; TC-06 no demuestra inmutabilidad; TC-07 no es concurrente, desactiva el lock y acepta error como éxito. Además, el conjunto utiliza el spreadsheet configurado para producción y escribe LogsSistema, por lo que no satisface el aislamiento sintético exigido. No hay cobertura suficiente de permisos, Drive, responsables, fusión, movimientos, fallos de servicios ni respaldos.

La marca [X] de completadas.md y el registro de ChangesLogs.txt se conservan como histórico, pero no acreditan CA-016..CA-022. No se modificó código ni se ejecutó la suite contra producción.

## 6. Pruebas ejecutadas y limitaciones

**Ejecutadas:** inspección estática del alcance F6-003, TC-01..TC-07, firma de parámetros, llamadas, escrituras, locks, dispatcher, RBAC, log, funciones de expediente, dependencias declaradas, suites de contratos/concurrencia/áreas curriculares, scripts bajo tests/regression, árbol Git, SHAs, historial de archivos de auditoría, ChangesLogs y blob íntegro Pendientes.md.

**No ejecutadas:** runStudentLifecycleRegressionSuite, Apps Script runtime, Google Sheets, Drive, navegador, HTTP por rol, concurrencia real, fallos inyectados, reintentos, persistencia, restauración de respaldos y scripts Node. No se ejecutó la suite porque su código está conectado al SPREADSHEET_ID productivo y carece de aislamiento; ejecutar TC-07 podría insertar matrícula. No se accedió ni modificó información productiva.

## 7. Tareas ejecutables derivadas de los hallazgos

Las siguientes tareas son locales a esta auditoría; no sustituyen ni duplican IDs globales.

### F6-003-A01 - Separar por completo el entorno de pruebas de producción
- **Hallazgos de origen:** H1.
- **Severidad:** Crítico/P0.
- **Objetivo:** impedir que cualquier prueba cree, edite o elimine datos reales.
- **Acción ejecutable:** introducir proveedor de dependencias para spreadsheet/Drive; configurar IDs de test fuera del código; bloquear ejecución si el entorno no es TEST; crear y destruir fixtures sintéticos; aislar LogsSistema; impedir llamadas de prueba a servicios productivos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs; configuración de pruebas y runner.
- **Criterios de aceptación:** la suite falla cerrada si detecta IDs productivos; cada prueba corre en spreadsheet/Drive temporal; setup/teardown limpia solo recursos creados por el test; no se modifica producción; el log de test queda separado.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F6-003-A02 - Corregir los casos TC-01..TC-07 y sus assertions
- **Hallazgos de origen:** H2, H3, H4, H5 y H6.
- **Severidad:** Alto.
- **Objetivo:** hacer que cada caso pruebe el comportamiento anunciado y falle ante regresiones.
- **Acción ejecutable:** alinear el payload de TC-04 con nombres/apellidos/identificacion; cambiar TC-01/03 a llamadas reales de validación con fixture; TC-02 debe introducir una inconsistencia controlada y verificar dry-run; TC-05 debe probar capacidad límite/sobre-cupo; TC-06 debe comparar snapshots; TC-07 debe comparar conteos y respuestas con idempotency key.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; nueva suite aislada bajo tests/regression.
- **Criterios de aceptación:** cada caso tiene expected/actual; un error inesperado falla; no se acepta error como PASS salvo que sea el error esperado exacto; las pruebas fallan cuando la regla se rompe.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F6-003-A03 - Probar concurrencia e idempotencia con solicitudes simultáneas
- **Hallazgos de origen:** H2.
- **Severidad:** Crítico/P0.
- **Objetivo:** detectar matrículas/movimientos duplicados ante reintentos y carreras.
- **Acción ejecutable:** lanzar solicitudes simultáneas independientes sobre fixture aislado; probar misma clave/payload, misma clave/payload distinto, respuesta perdida y repetición; medir filas de Matriculas y MovimientosEstudiante antes/después.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; tests/regression; runner de integración.
- **Criterios de aceptación:** una sola ejecución lógica por clave; payload incompatible se rechaza; cupos no se exceden; lock no se omite; duplicados de matrículas y movimientos detectados.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F6-003-A04 - Cubrir creación, fusión, tutores y documentos del expediente
- **Hallazgos de origen:** H7.
- **Severidad:** Alto.
- **Objetivo:** cubrir todos los componentes del expediente declarados en RF1.
- **Acción ejecutable:** probar creación/consulta, detección/fusión y trazabilidad, asociación/revocación de tutores, carga/sustitución/recuperación de documentos, integridad de Drive y permisos por rol.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; Drive; tests/regression.
- **Criterios de aceptación:** casos positivos y negativos por operación; cambios persistidos verificados en Sheets y Drive; rollback/limpieza de fixtures; no se exponen expedientes ajenos.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F6-003-A05 - Cubrir matrícula y todos los movimientos del ciclo de vida
- **Hallazgos de origen:** H7.
- **Severidad:** Alto.
- **Objetivo:** probar matrícula inicial, renovación, sección/grado, traslado, retiro, reingreso, promoción, repitencia y graduación.
- **Acción ejecutable:** crear fixtures con estados/periodos conocidos; ejecutar endpoints reales; comprobar precondiciones, respuestas, filas, movimientos, estados e idempotencia.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; tests/regression.
- **Criterios de aceptación:** pruebas positivas/negativas por flujo; cambios de periodo no alteran matrículas históricas; errores de cupo/transición no generan movimientos falsos; duplicados se detectan.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F6-003-A06 - Probar autorización directa y aislamiento de expedientes/documentos
- **Hallazgos de origen:** H7.
- **Severidad:** Alto.
- **Objetivo:** demostrar que los roles no autorizados no pueden invocar operaciones directamente.
- **Acción ejecutable:** construir matriz de usuarios/tokens/roles; llamar endpoints sin UI con credencial ausente, inválida, caducada, rol insuficiente e ID ajeno; verificar códigos y ausencia de escrituras.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; tests de integración HTTP.
- **Criterios de aceptación:** cada acción protegida rechaza roles no autorizados; acceso cruzado a expediente/Drive es denegado; ningún rechazo modifica datos; respuestas y logs no filtran PII.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F6-003-A07 - Inyectar fallos de dependencias y verificar reintentos/recuperación
- **Hallazgos de origen:** H8.
- **Severidad:** Alto.
- **Objetivo:** garantizar que errores externos no se reporten como operaciones completadas.
- **Acción ejecutable:** simular timeout, error de Sheets/Drive, respuesta perdida y fallo entre escrituras; verificar reintento limitado, idempotencia, compensación y resultado final.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs; tests/regression.
- **Criterios de aceptación:** fallo se representa como FAIL/error esperado; nunca se emite éxito falso; no hay duplicados tras reintento; estado queda íntegro o recuperable.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F6-003-A08 - Estandarizar reporte PASS/FAIL/SKIP y evidencia de cada caso
- **Hallazgos de origen:** H9.
- **Severidad:** Medio.
- **Objetivo:** distinguir ejecución técnica de éxito funcional y dejar evidencia reproducible.
- **Acción ejecutable:** definir contrato con id, nombre, estado, fixture, entrada saneada, precondición, expected, actual, duración, error, evidencia de persistencia y estado SKIP/NOT_RUN; el status global debe ser error/failure cuando haya fallos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; runner y reportes.
- **Criterios de aceptación:** todos los casos producen un resultado estructurado; fallos y no ejecutados se distinguen; el estado global no dice success si falla una prueba; se identifica el caso y su evidencia.
- **Prioridad:** P2.
- **Estado:** Pendiente.

### F6-003-A09 - Incorporar runner reproducible y ejecución CI
- **Hallazgos de origen:** H10.
- **Severidad:** Medio.
- **Objetivo:** ejecutar la suite aislada de forma repetible y conservar artefactos.
- **Acción ejecutable:** incorporar comandos documentados, configuración del entorno TEST, dependencias controladas y workflow CI; separar pruebas unitarias, integración simulada y pruebas de integración contra recursos temporales.
- **Archivos/módulos afectados:** tests/regression; package/configuración de test; .github/workflows; documentación de desarrollo.
- **Criterios de aceptación:** ejecución local documentada y repetible; CI corre en cada cambio pertinente; artefacto incluye PASS/FAIL/SKIP y logs sin PII; no se conecta a producción.
- **Prioridad:** P2.
- **Estado:** Pendiente.

## 8. Cierre
- Dictamen: NO CUMPLE.
- Código y tests: sin modificaciones.
- completadas.md: sin modificación; se conserva [X] histórico.
- Pendientes.md: consultado desde blob íntegro; sin modificación.
- ChangesLogs.txt: sin modificación porque no hubo cambio funcional.
- Rama base: sin modificaciones.
- Siguiente tarea: TAREA-F6-004, según el orden de completadas.md; auditarla por separado.

## 9. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, línea 2548, requisitos RF1-RF7 y CA-016..CA-022.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1945-1948.
- METODOLOGIA_DESARROLLO.md SHA cf796728bb384a32537392df2f9c72a339fa03ee.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.
- Auditoría individual F6-003 e informe de fase 6: ausentes del árbol e historial consultado.
