# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P2-01

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** \`NG_beta_0.0.0.1_work\`  
**HEAD de partida:** \`3ee443cddd959d2c5ff1c4d4c698d944107875f5\`  
**Rama base:** \`NG_beta_0.0.0.1\`  
**HEAD de rama base:** \`44d9891132332e692dbe2ba8602b41f50a508a59\`  
**ID operativo de sesión/chat:** \`IMA-AUDIT-20261106-1529Z\` (inicio registrado a las 15:29:51 UTC; identificador operativo, no ID nativo de ChatGPT).

**Dictamen:** CUMPLE PARCIALMENTE. El cambio puntual declarado en \`registerUser\` elimina el fallback temporal y falla de forma cerrada si no obtiene un ID institucional. No se acredita, sin embargo, unicidad institucional global ni comportamiento bajo concurrencia entre los generadores USER y ACADEMIC. Los riesgos de generador duplicado, alcance local de ScriptLock y pruebas conductuales ya están cubiertos por AUD-NG-161/TASK-118 en el histórico; no se crea un hallazgo duplicado.

## 1. Alcance y límites de la fuente

\`completadas.md\` marca TAREA-F4-P2-01 como completada, con severidad Media, categoría Identidad y archivo \`backend/user-service/Code.gs\`. La entrada conserva título, origen y archivo, pero no criterios de aceptación detallados. La fuente original \`AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md\` no está disponible en la rama actual.

\`ChangesLogs.txt\` describe el cambio específico: modificar \`registerUser\` para eliminar el fallback de ID basado en \`now.getTime()\` y utilizar \`generateInstitutionalId({ entityType: "Usuario", prefix: "USR-" })\`. La auditoría contrasta ese cambio declarado con la implementación actual y con el flujo de conversión académica que también puede generar un UserId.

No se amplía el alcance a identificadores de Persona, invitaciones, relaciones familiares, noticias, mensajes ni otros registros. Por ejemplo, \`createPerson\` genera \`PER-\` + timestamp, pero es un PersonaID, no un UserId; queda fuera de esta tarea.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques revisados |
|---|---|---|
| \`backend/user-service/Code.gs\` | \`12079dd410aa6d8afbce55a4bc62a79dea605f9f\` | ROLE_PERMISSIONS 941-963; doPost/router 1351-1435; createPerson 1663-1687 (exclusión de PersonaID); generateInstitutionalId 1706-1746; registerUser 2393-2450. |
| \`backend/academic-service/Code.gs\` | \`daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc\` | doPost 655-695; generateInstitutionalId 2107-2150; convertAdmissionToStudent 2156-2390, en particular lock exterior y asignación targetUserId 2238-2239. |
| \`tests/regression/academic-grading-suite.js\` | \`3433b707edd4a2f35c68368a3172932adc2a3b32\` | 1-220 y búsqueda dirigida de registerUser, generateInstitutionalId, USR- y TAREA-F4-P2-01. |
| \`completadas.md\` | \`f57f1aef832e81e44fc4f7ec36a852d50e464676\` | TAREA-F4-P2-01, líneas 1767-1774. |
| \`ChangesLogs.txt\` | \`d57cf4bd861b5c3720e60cf83241ed804ff645d9\` | Registro TAREA-F4-P2-01, líneas 1744-1748. |
| \`Auditoria.txt\` | \`014b19e132f09c6008f04e1c975918f64cf38dfe\` | FASE2-05/C1.33, aprox. 5257-5295; auditoría de concurrencia TAREA-16, aprox. 4717-4735. |
| \`Pendientes.md\` | blob \`f8e6091a0db9d95751f46fc8fb2b65544270a9ca\` | Se preserva sin cambios en esta iteración; no se crea ID nuevo. |

## 3. Resultado de la verificación

### 3.1. Cambio directo en USER: correcto

En \`registerUser\` (2393-2450), cuando el correo no existe, el código llama a \`generateInstitutionalId({ entityType: "Usuario", prefix: "USR-" })\`. Si el resultado no contiene \`generatedId\`, lanza un error y detiene el registro. No se encontró fallback a \`now.getTime()\`, \`Date.now()\` ni a un ID de usuario construido con timestamp dentro de esta función.

La ruta de actualización de una cuenta existente conserva el UserId almacenado; no genera uno nuevo. El flujo nuevo persiste el identificador obtenido en la primera columna de \`Usuarios\`.

**Resultado del criterio literal documentado en ChangesLogs.txt:** satisfecho en \`registerUser\`.

### 3.2. Generador USER y secuencia

\`generateInstitutionalId\` (1706-1746) utiliza la hoja \`SecuenciasIDs\`, identifica la fila por \`entityType\`, incrementa \`UltimoNumero\`, forma el ID con prefijo y seis dígitos, persiste el contador y ejecuta \`SpreadsheetApp.flush()\`. La lectura/incremento/escritura de la secuencia está dentro de \`LockService.getScriptLock()\` con \`waitLock(10000)\`; el lock se libera en \`finally\`.

El inicializado/creación de la hoja \`SecuenciasIDs\` ocurre antes de adquirir el lock. No se ejecutó una carrera de primera inicialización ni se inspeccionó una hoja productiva. El contador tampoco valida explícitamente que el valor leído sea un entero finito ni que exista una sola fila para cada entidad. Son límites de robustez que no permiten certificar integridad de datos corruptos o inicialización simultánea; no se afirma que hayan producido una colisión real.

### 3.3. Flujo ACADEMIC que también genera UserId

En \`convertAdmissionToStudent\` (2156-2390), el servicio adquiere un ScriptLock exterior antes de procesar la conversión. En el bloque 2238-2239 llama a su propia copia de \`generateInstitutionalId\` con \`entityType: "Usuario"\` y \`skipLock: true\`; dentro de ese flujo, la llamada está protegida por el lock exterior de la conversión.

No obstante, USER y ACADEMIC mantienen copias independientes de \`generateInstitutionalId\` y cada proyecto Apps Script obtiene su propio \`getScriptLock()\`. Esos locks no coordinan entre proyectos aunque ambos lean/escriban la misma hoja \`SecuenciasIDs\`. Por ello, una ejecución simultánea de \`registerUser\` en USER y de \`convertAdmissionToStudent\` en ACADEMIC puede leer el mismo contador antes de que la otra ejecución lo actualice y emitir el mismo número. Es un riesgo estructural derivado de los contratos observados; no se ejecutó una carrera real.

Además, ACADEMIC asigna \`targetUserId = userId || (userGen.generatedId || "USR-000001")\`. Si no se proporciona un UserId y el generador falla o no devuelve un ID, el flujo utiliza un valor constante que puede repetirse. Este fallback no es temporal, pero contradice una garantía de unicidad institucional. El patrón ya está documentado en la auditoría FASE2-05/C1.33 y se reconcilia con AUD-NG-161/TASK-118; no se registra como hallazgo nuevo.

### 3.4. Pruebas

No se encontraron aserciones específicas para \`registerUser\` ni \`generateInstitutionalId\` en \`tests/regression/academic-grading-suite.js\`. La búsqueda dirigida tampoco identificó una prueba de colisión, monotonía de secuencia, fallo de generación, reintento o concurrencia entre USER y ACADEMIC.

No se ejecutó \`registerUser\` porque escribe en la hoja real \`Usuarios\`; tampoco se ejecutaron funciones Apps Script, llamadas HTTP, mutaciones de Sheets ni pruebas concurrentes. La evidencia es estática y documental.

## 4. Reconciliación histórica

- **AUD-NG-161:** conserva la necesidad de pruebas conductuales reales de colisión/concurrencia, el alcance local de \`getScriptLock()\`, generadores duplicados y bypasses de bloqueo. Se mantiene como responsable de ese problema; esta auditoría no crea un duplicado.
- **TASK-118:** ya aparece como tarea de seguimiento en la auditoría FASE2-05 para el modelo de IDs, fallback, esquema y correlativo. Se conserva su relación histórica.
- **TAREA-F4-P2-01:** el cambio declarado en USER elimina el fallback temporal de \`registerUser\`; la marca [X] no demuestra por sí sola unicidad global ni pruebas conductuales.
- **AUD-NG-225/AUD-NG-226:** corresponden al catálogo de roles y a integridad de departamentos/cargos/adscripciones; no son hallazgos de generación de UserId y no se vinculan a esta tarea.

**No se crea un AUD-NG ni TASK nuevo.** Se amplía el contexto de AUD-NG-161 en el registro de auditoría y el mapa de dependencias, manteniendo los límites existentes.

## 5. Dictamen

**CUMPLE PARCIALMENTE.** La corrección puntual en \`registerUser\` satisface el objetivo literal: ya no genera UserId mediante timestamp y no inventa un fallback cuando falla el generador. La solución no acredita que todos los flujos institucionales que generan UserId compartan un mecanismo globalmente exclusivo y atómico: ACADEMIC conserva una copia independiente del generador, el lock es local al proyecto y existe un fallback constante \`USR-000001\`. Esas brechas se mantienen bajo AUD-NG-161/TASK-118. La ausencia de pruebas conductuales impide elevar el dictamen a cumplimiento integral.

## 6. Pruebas y límites

**Ejecutado:** inspección estática/manual de funciones y call sites; revisión del router y permisos; comparación de SHA; búsqueda dirigida en la suite de regresión; reconciliación con FASE2-05, TAREA-16, AUD-NG-161 y TASK-118.

**No ejecutado:** Apps Script runtime, HTTP, Google Sheets productivo, creación concurrente de SecuenciasIDs, concurrencia cruzada USER/ACADEMIC, pruebas de colisión, fallo del generador, recuperación, pruebas de registro de usuarios ni suites automatizadas.

No se modificó código fuente ni se utilizaron datos productivos.

## 7. Cierre documental

Se anexa el resultado a \`Auditoria.txt\`, se actualizan \`MapaDependencias.md\`, \`AUDITORIA_COMPLETADAS_PLAN.md\` y \`Contexto_personal.txt\), y se crea este informe. Se preserva \`Pendientes.md\` sin cambios y no se modifica \`completadas.md\`, \`ChangesLogs.txt\`, \`METODOLOGIA_DESARROLLO.md\`, \`README.md\` ni código fuente.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-118] Unificar la generación institucional de identificadores y garantizar su unicidad entre servicios

- **Hallazgo de origen:** secciones 3.2 y 3.3, reconciliación de la sección 4 y dictamen de la sección 5. USER y ACADEMIC mantienen copias independientes de `generateInstitutionalId`; los `ScriptLock` pertenecen a proyectos Apps Script distintos y no coordinan el acceso a `SecuenciasIDs`. ACADEMIC conserva además el fallback constante `USR-000001` cuando la generación no devuelve un ID. La inicialización de hoja/encabezados ocurre antes de adquirir el lock, y no se acredita validación del contador ni unicidad de filas por entidad.
- **Severidad:** Alta (P1), por el riesgo de colisión de identidad y asociación de registros al usuario equivocado.
- **Objetivo:** disponer de una única operación institucional, atómica y fail-closed para emitir UserId, compartida por todos los servicios que crean o convierten cuentas, sin fallback temporal ni constante.
- **Acción ejecutable:**
  1. Definir un único propietario/servicio de generación de identificadores institucionales y migrar USER, ACADEMIC y cualquier otro consumidor de UserId para que invoquen ese contrato, sin mantener copias independientes del algoritmo.
  2. Hacer atómica la inicialización de `SecuenciasIDs`, la validación de esquema, la lectura del contador, su incremento y la persistencia. La exclusión mutua debe ser efectiva entre proyectos Apps Script, no depender de ScriptLock locales.
  3. Validar que exista exactamente una fila por `entityType`, que `UltimoNumero` sea un entero finito no negativo y que el siguiente identificador no esté ya asignado. Ante esquema corrupto, timeout o fallo de persistencia, abortar sin emitir un identificador alternativo.
  4. Eliminar el fallback `USR-000001` de `convertAdmissionToStudent` y cualquier bypass de bloqueo controlable por payload, incluido `skipLock` si permite saltarse la exclusión mutua desde una frontera no confiable.
  5. Revisar los callers que ya mantienen locks exteriores (incluidos `createSecurityDelegation` y `manageAccountState`) para evitar adquisición anidada o deadlocks; establecer una única política de locking y un orden de adquisición documentado.
  6. Hacer atómica o idempotente la relación entre reserva del identificador y persistencia del usuario, de modo que fallos/reintentos no asignen el mismo ID a dos entidades ni consuman silenciosamente secuencias inconsistentes.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`; `backend/academic-service/Code.gs`; módulo/servicio institucional de identidad que se defina como propietario; contratos interservicio y configuración de acceso a la secuencia; pruebas de integración asociadas.
- **Dependencias y riesgos:** AUD-NG-161 cubre las pruebas conductuales de colisión, concurrencia y bypasses; TASK-118 conserva el modelo institucional de IDs. Requiere definir autoridad única y coordinación de exclusión entre proyectos. Riesgos: colisiones entre proyectos, deadlocks por locks anidados, pérdida de números por fallos parciales, incompatibilidad con IDs existentes y asociación incorrecta de matrículas/cuentas. No asumir que ScriptLock de USER protege ejecuciones de ACADEMIC.
- **Alcance:** UserId institucional y secuencia `USR-` compartida por los flujos de registro y conversión de usuarios. Incluye la robustez de `SecuenciasIDs`, la exclusión mutua distribuida y el manejo fail-closed de errores. No convierte PersonaID, MAT, CRG ni CUV en UserId; esos identificadores conservan sus tareas y contratos propios.
- **Criterios de aceptación:**
  1. USER y ACADEMIC utilizan el mismo generador autoritativo; no quedan copias capaces de emitir UserId independientemente.
  2. La inicialización y actualización de la secuencia son atómicas frente a ejecuciones simultáneas desde ambos proyectos.
  3. Una prueba concurrente real con llamadas simultáneas USER/ACADEMIC demuestra que no se emiten UserId duplicados y que el contador no retrocede ni pierde actualizaciones.
  4. Filas duplicadas, contador no numérico/negativo, timeout, error de escritura o respuesta incompleta provocan fallo explícito; nunca se usa `USR-000001`, timestamp ni otro fallback.
  5. Ningún parámetro del cliente puede omitir la exclusión mutua ni forzar `skipLock`; los callers internos siguen un contrato seguro que no produce locks anidados.
  6. Reintentos después de pérdida de respuesta o fallo parcial no asignan el mismo UserId a dos usuarios y dejan trazabilidad suficiente para reconciliar la operación.
  7. Los UserId existentes se preservan; la migración no reescribe identificadores históricos ni rompe referencias.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Adjuntar commits de implementación, pruebas concurrentes cruzadas USER/ACADEMIC, pruebas de fallo y reintento, verificación de unicidad sobre fixtures aislados y evidencia de que no se usaron datos productivos.

### [AUD-NG-161] Sustituir las pruebas nominales de concurrencia por pruebas conductuales reales de identidad e integridad

- **Hallazgo de origen:** sección 3.4 y reconciliación de las secciones 4 y 5. La suite existente puede declarar éxito sin ejecutar dos operaciones concurrentes ni comprobar unicidad; no se encontraron aserciones específicas para `registerUser`/`generateInstitutionalId`, colisiones, fallos del generador o concurrencia entre USER y ACADEMIC.
- **Severidad:** Alta (P1).
- **Objetivo:** demostrar con pruebas reproducibles que la generación institucional de UserId es única, atómica y segura ante concurrencia, fallos, reintentos y rutas alternativas.
- **Acción ejecutable:**
  1. Reemplazar pruebas que asignan `PASSED` incondicionalmente o solo comprueban adquisición/liberación de un lock por escenarios que ejecuten operaciones reales contra fixtures aislados.
  2. Añadir escenarios simultáneos de registro USER y conversión ACADEMIC contra una secuencia compartida, verificando ausencia de colisiones, monotonía y persistencia consistente.
  3. Probar primera inicialización concurrente de `SecuenciasIDs`, duplicidad de filas de entidad, contador corrupto, timeout, error entre reserva y persistencia, reintento tras pérdida de respuesta y agotamiento/colisión de candidatos.
  4. Probar que el fallo del generador aborta la operación y que no se aceptan fallbacks temporales/constantes ni bypasses `skipLock`/equivalentes desde payload.
  5. Aislar las pruebas de hojas, cuentas y datos productivos; introducir fixtures y limpieza/restauración verificable. Una prueba que no ejecuta el comportamiento debe marcarse como no ejecutada, no como aprobada.
- **Archivos/módulos afectados:** `backend/accounting-service/Code.gs` (suite de concurrencia actualmente señalada); `tests/regression/academic-grading-suite.js` y nuevas pruebas aisladas de USER/ACADEMIC; harness y fixtures de integración; generador institucional definido por TASK-118.
- **Dependencias y riesgos:** TASK-118 debe definir el contrato único y la estrategia de locking antes de fijar las aserciones de integración. AUD-NG-006 conserva reserva/idempotencia del cliente; AUD-NG-133 conserva idempotencia transaccional de pagos. No duplicar esos mecanismos ni confundir las pruebas de IDs con las de pagos/CUV.
- **Alcance:** pruebas conductuales de generación de UserId, concurrencia cruzada, fallos y reintentos, además de la veracidad de la suite que actualmente reporta éxito. No implementa por sí misma el generador ni corrige los mecanismos de pagos o CUV.
- **Criterios de aceptación:**
  1. Ningún caso devuelve `PASSED` sin ejecutar una operación y comprobar una propiedad observable.
  2. Dos o más operaciones simultáneas desde USER y ACADEMIC producen UserId distintos, persistidos una sola vez y asociados al usuario correcto.
  3. Las pruebas de inicialización, corrupción de secuencia, colisión, timeout, fallo parcial y reintento verifican resultados y estados finales, no solo respuestas nominales.
  4. Los fallbacks constantes/temporales y bypasses de bloqueo se detectan como fallos.
  5. Los fixtures no escriben en hojas productivas ni envían notificaciones reales; la limpieza/restauración queda comprobada.
  6. La suite distingue PASS, FAIL, SKIP y NOT RUN; cualquier escenario no ejecutado se informa como tal y no eleva el dictamen.
  7. Los resultados son reproducibles y se conserva evidencia de ejecución, datos de fixture y versión del código probado.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Registrar ejecución de suite aislada, resultados de cada escenario, evidencia de no colisión y confirmación de aislamiento de datos productivos.

