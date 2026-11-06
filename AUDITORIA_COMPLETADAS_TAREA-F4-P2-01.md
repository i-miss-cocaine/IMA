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
