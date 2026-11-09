# AUDITORÍA COMPLETADA — TAREA-F5-003
## Identificadores únicos, concurrencia e idempotencia en admisiones

- **Repositorio:** `i-miss-cocaine/IMA`
- **Rama auditada:** `NG_beta_0.0.0.1_work`
- **HEAD auditado:** `f70b684b18f341e7d59e876ec53218422c345e05`
- **Tree SHA auditado:** `69a525b23ae5232e28bdf603d3abd3b052c4c0d0`
- **Fecha:** 2026-11-07
- **ID operativo de sesión/chat:** `IMA-AUDIT-20261107-0140Z` (identificador operativo, no ID nativo de ChatGPT).
- **Tarea histórica:** TAREA-F5-003.
- **Informe:** no existía en el árbol ni en el historial Git consultado; se crea mediante auditoría desde cero.
- **Dictamen:** **NO CUMPLE**.
- **Alcance:** inspección estática/manual de IDs, locks, duplicidad, idempotencia, persistencia y pruebas. No se modificó código ni se ejecutaron pruebas runtime.

## 1. Existencia del informe y reconstrucción del alcance

Se verificó el árbol completo de la rama de trabajo (965 entradas, `truncated=false`). No existe `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-003.md`. La consulta del historial de esa ruta en `NG_beta_0.0.0.1_work` devolvió cero commits. Tampoco se encontró `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` en el árbol ni en el historial consultado.

La descripción histórica se reconstruyó desde:
- `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1893-1901: alcance de IDs ADM/EXP/MAT, locks, unicidad, idempotencia, duplicados y rollback.
- `ChangesLogs.txt`, SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1534-1546: declara una reestructuración de `createAdmissionRequest` con generador, lock, duplicidad e idempotencia, y afirma que se registró un informe en `Auditoria.txt`.
- `AUDITORIAS/Auditoria.txt`, SHA de partida `c520d487c2e4f7eb392886600120c5cbcc31c3bc`: no contiene un registro identificable de TAREA-F5-003.
- La versión histórica de raíz `Auditoria.txt`, blob SHA `7f8783e353fe3b5b2a66e4e8569986f6d0097fff`, tampoco contiene `TAREA-F5-003` ni `HALLAZGOS-F5-P0-04`. La variante acentuada `AUDITORIAS/Auditoría.txt`, SHA `e63c6cfcfaf05238d1a07a375ba65e16b83b9184`, tampoco contiene referencias F5-003.
- La búsqueda de historial del informe específico y de la fuente histórica citada devolvió cero commits. Por ello, no se afirma haber recuperado un informe anterior: el alcance se reconstruye de los registros disponibles y se contrasta con el código actual.

La marca histórica `[X] Completada` no demuestra el cumplimiento vigente. Los criterios de aceptación se verifican contra la implementación actual.

## 2. Evidencia técnica inspeccionada

| Archivo | SHA | Alcance revisado |
|---|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | `sanitizePayloadForLog` 29-49; `logStructuredEvent` 52-77; `ROLE_PERMISSIONS` 165-235; `PUBLIC_ACTIONS` 265; idempotencia 268-318; `validateRolePermission` 524-583; `doPost` 671-690, dispatcher 847-860, guardado global 967-974 y catch; `createAdmissionRequest` 983-1110; `generateInstitutionalId` 2107-2153; `convertAdmissionToStudent` 2156-2392; `registerStudentEnrollment` 12670-12730. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | 404 líneas; búsqueda dirigida de admisiones, IDs, generador, idempotencia y locks. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | 61 líneas; búsqueda dirigida de las mismas rutas. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Líneas 1893-1901: criterios históricos de TAREA-F5-003. |
| `ChangesLogs.txt` | `d57cf4bd861b5c3720e60cf83241ed804ff645d9` | Líneas 1534-1546: modificación histórica declarada. |
| `AUDITORIAS/Auditoria.txt` | `c520d487c2e4f7eb392886600120c5cbcc31c3bc` | Registro de hallazgos y reconciliación de tareas existentes. |
| `AUDITORIAS/MapaDependencias.md` | `49bf6cb2bbc7f60050df01e758b3601233491d1c` | Líneas 549-553, 712-722, 3952-3960 y 6490-6496: idempotencia, matrícula, pruebas y generador/IDs. |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-002.md` | `b1809a57c8ff285b3e1abe983a7a1fd207e54186` (corregido en este commit) | Revisión cruzada de la idempotencia global de `doPost`; corrección de precisión de H4. |
| `METODOLOGIA_DESARROLLO.md` | `cf796728bb384a32537392df2f9c72a339fa03ee` | Reglas de inspección manual, registro de hallazgos, tareas ejecutables y prohibición de alterar código durante auditoría. |

## 3. Hallazgos

### H1. El generador institucional permite escrituras de secuencia sin lock y prepara la hoja antes de protegerla
**Clasificación: CRÍTICO / P0 — ampliación de TASK-118**

`generateInstitutionalId` (2107-2153) recibe `skipLock`. Solo intenta `tryLock(10000)` cuando ese parámetro es falso (2120-2127). La apertura/creación de `SecuenciasIDs` y la escritura inicial de encabezados ocurren antes de adquirir el lock (2112-2118). Con `skipLock: true`, lectura/incremento/escritura de la secuencia se ejecutan sin sección crítica. No hay validación de encabezados, reserva atómica, verificación de unicidad contra la tabla destino ni reconciliación del contador con los IDs ya persistidos.

El helper se invoca con `skipLock: true` en múltiples rutas de admisión: `createAdmissionRequest` (1037), `saveAdmissionDraft` (1461), `scheduleAdmissionInterview` (1622), `saveAdmissionEvaluation` (1701), `addToWaitlist` (1786), `convertAdmissionToStudent` (2229-2238, 2281, 2297, 2341 y 2361) y `uploadStudentDocument` (10682). Algunas rutas tienen un lock exterior; otras no muestran una sección crítica que proteja el generador. La unicidad no está garantizada para todas las entidades de admisión.

Si `SecuenciasIDs` se crea concurrentemente, su inicialización queda fuera del lock. Si la hoja existe sin encabezados válidos, o el contador se pierde/reinicia, el helper no inspecciona los IDs existentes para reconstruir el máximo y puede reiniciar una secuencia. La unicidad depende de que el estado externo de la hoja sea correcto.

### H2. El lock de creación de solicitudes puede omitirse desde el payload público
**Clasificación: CRÍTICO / P0 — ampliación de TASK-118 y AUD-NG-234/TASK-514**

`createAdmissionRequest` extrae `skipLock` del payload (985) y omite `tryLock(10000)` si es truthy (994-1002). `doPost` elimina `payload.skipLock` solo cuando `payload.isInternalCall` no es truthy (675-677). `isInternalCall` no se acredita como marca emitida por el servidor; se recibe dentro del payload.

Además, `createAdmissionRequest` está en `PUBLIC_ACTIONS` (265), y `validateRolePermission` autoriza directamente las acciones públicas (524-526). Por tanto, una petición pública puede incluir simultáneamente `skipLock: true` e `isInternalCall: true`; el middleware conserva el bypass y la función no adquiere lock. Esto permite competir por el contador y por la comprobación de duplicidad sin serialización.

La conversión `convertAdmissionToStudent` sí adquiere lock obligatorio y falla si no lo obtiene (2160-2166), pero el control general de transición `updateAdmissionStatus` tiene un bypass análogo ya documentado en AUD-NG-234/TASK-514. No se duplica ese hallazgo: se amplía su alcance a creación y a cualquier bypass de lock derivado del cliente.

### H3. La detección de solicitudes duplicadas no cumple todos los factores exigidos
**Clasificación: ALTO / P1 — ampliación de TASK-118**

Dentro de la sección protegida de `createAdmissionRequest` (1013-1029), la búsqueda compara:
- identificación exacta tras `trim()` para el mismo año lectivo (1020-1026);
- nombre completo normalizado junto con fecha de nacimiento (1022-1027).

`cleanEmail` se calcula (1010) y se persiste, pero no participa en la detección. Dos solicitudes con el mismo correo del responsable y datos de identificación/nombre diferentes no se detectan por ese factor. La identificación tampoco se normaliza más allá de espacios exteriores. La regla excluye estados Rechazada/Retirada, pero no valida unicidad contra expedientes o personas existentes.

El código rechaza una solicitud detectada y no fusiona automáticamente personas por coincidencia de nombre; esto satisface parcialmente la prohibición de fusiones arbitrarias, pero no cubre la detección por email solicitada en los criterios históricos.

### H4. La idempotencia es una caché posterior al chequeo, no una reserva atómica durable
**Clasificación: CRÍTICO / P0 — ampliación de AUD-NG-006**

`checkAndRegisterIdempotencyKey` (279-304) lee `CacheService.getScriptCache()`, compara una firma y devuelve un resultado almacenado. No reserva la clave, no crea estado InProgress y no serializa dos peticiones simultáneas con el mismo token. `saveIdempotentResult` (306-318) escribe el resultado únicamente después de un resultado exitoso, con TTL de 21.600 segundos; los errores de `cache.put` se capturan y se silencian. No se encontró uso de `TablaIdempotencia` ni del código de conflicto `IDEMPOTENCY_CONFLICT` en ACADEMIC.

`doPost` comprueba la clave antes del dispatcher (684-689) y guarda el resultado después de la operación (967-968). `createAdmissionRequest` vuelve a consultar la clave dentro de su función (991-992), pero también lo hace antes de adquirir el lock (994-1002). Dos solicitudes simultáneas con la misma clave pueden superar ambas comprobaciones iniciales; una espera por el lock, pero no revalida la clave al entrar en la sección crítica. La deduplicación natural puede detener el segundo intento solo si los datos del aspirante coinciden con los factores actualmente comparados. Una clave reutilizada con payload incompatible puede superar la carrera si los datos de identidad no coinciden o no están completos.

La idempotencia global sí se aplica por middleware a `updateAdmissionStatus`, `reopenAdmissionRequest` y `convertAdmissionToStudent` cuando se invocan mediante `doPost`; no se afirma que esas acciones carezcan de guardado. El defecto común es que la clave no se reserva atómicamente antes de los efectos y el resultado solo vive en caché temporal. Las llamadas directas internas a funciones tampoco pasan por el middleware global.

### H5. La matrícula no usa el ID secuencial que la conversión genera; persiste un ID basado solo en timestamp
**Clasificación: CRÍTICO / P0 — ampliación de AUD-NG-129 y TASK-118**

`convertAdmissionToStudent` genera un ID `MAT-` mediante `generateInstitutionalId` (2341-2342), pero no lo entrega a `registerStudentEnrollment`. Esta última función (12670-12730) crea la matrícula con `"MAT-" + now.getTime()` cuando no encuentra una fila previa (línea 12702). Como devuelve siempre `matriculaId` en el camino exitoso, el `fallbackMatId` secuencial de la conversión no se utiliza normalmente.

`registerStudentEnrollment` lee y comprueba la matrícula por usuario y período antes de escribir, pero no adquiere lock propio. La acción aparece en el dispatcher y se concede a Director, Subdirector, Secretaría, Secretaria y Contador en `ROLE_PERMISSIONS` (165-235). Dos llamadas directas concurrentes pueden superar el mismo chequeo y crear matrículas duplicadas. El ID basado únicamente en milisegundos no satisface la unicidad secuencial exigida. Los IDs de cargos usan `Date.now()` más un componente aleatorio (línea 12724), no una secuencia institucional.

### H6. El formato de IDs no corresponde al formato anual definido y existen fallbacks constantes
**Clasificación: ALTO / P1 — ampliación de TASK-118**

La solicitud se genera como `ADM-000001` (1037-1039), y el expediente como `EXP-000001` cuando el resultado del helper no contiene ID (2229-2230). La secuencia no incorpora el año lectivo, aunque los criterios históricos especifican `ADM-2026-XXXXX`, `EXP-2026-XXXXX` y `MAT-2026-XXXXX`. La matrícula real, además, usa timestamp (H5). Los fallbacks constantes `ADM-000001`, `EXP-000001`, `STU-000001`, `PER-000001`, `USR-000001`, `REL-000001` y `INV-000001` son rutas de riesgo de colisión si una futura implementación devuelve un resultado incompleto en lugar de lanzar error.

### H7. No existe compensación demostrable entre avance de secuencia y persistencia de solicitud
**Clasificación: ALTO / P1 — ampliación de TASK-118 y AUD-NG-232/TASK-512**

En `createAdmissionRequest`, el contador de `SecuenciasIDs` se actualiza antes de `appendRow` en `SolicitudesAdmision` (1037-1060). No existe compensación del contador ni rollback explícito si falla la escritura o el flush. Después de escribir la fila se intenta guardar idempotencia y registrar el evento; el resultado de caché puede fallar silenciosamente. El flujo no ofrece un estado durable InProgress/Completed/Failed que permita recuperar una petición cuyo cliente perdió la respuesta.

La conversión multihoja mantiene brechas de recuperación ya asignadas a AUD-NG-232/TASK-512; esta auditoría no crea otra tarea de saga ni duplica el alcance de F5-001.

### H8. Los logs de errores no cumplen la minimización de datos personales requerida
**Clasificación: ALTO / P1 — ampliación de AUD-NG-145**

El catch global de `doPost` registra `err.message` y el objeto `e.postData` completo (líneas 970-973). `sanitizePayloadForLog` (29-49) enmascara claves que contienen password/clave/token/secret/credencial/authorization, pero no identifica nombres, DNI/identificación, email o teléfono. Además, `e.postData.contents` es una cadena JSON, por lo que el sanitizador no recorre sus claves internas. La excepción de duplicidad de `createAdmissionRequest` incluye el nombre completo del aspirante (1031-1032), y el mensaje se guarda sin sanitización de texto en `logStructuredEvent` (52-77).

No se encontró un evento específico de conflicto/reintento que use identificadores de correlación y metadatos no sensibles. La ruta actual puede persistir datos personales en el mensaje y payload del log, incumpliendo el criterio de registrar conflictos sin PII.

### H9. No se acreditan pruebas conductuales de IDs, locks ni idempotencia de admisiones
**Clasificación: ALTO / P1 — ampliación de AUD-NG-161**

Los dos archivos de regresión presentes en el árbol son `academic-grading-suite.js` (404 líneas) y `modular-dashboard-suite.js` (61 líneas). La búsqueda dirigida no encontró pruebas de `createAdmissionRequest`, `generateInstitutionalId`, `SecuenciasIDs`, `registerStudentEnrollment` ni de reintentos/concurrencia de admisión. La suite académica contiene comprobaciones de idempotencia en otros servicios (por ejemplo USER/ACCOUNTING), pero eso no demuestra el comportamiento del servicio ACADEMIC. No se acreditan fixtures que simulen dos peticiones concurrentes, pérdida de respuesta, cache eviction, fallo de persistencia o colisión de secuencia.

## 4. Corrección de precisión a la auditoría F5-002

Durante esta auditoría se inspeccionó el final de `doPost` (967-968): el middleware sí ejecuta `saveIdempotentResult` para toda acción no-get exitosa. Por tanto, la afirmación H4 del informe F5-002 de que `updateAdmissionStatus` y `reopenAdmissionRequest` no guardaban resultados era incorrecta/incompleta. Se corrigió el mismo informe, conservando su ID y su dictamen. La brecha verdadera es ausencia de reserva atómica, persistencia durable y revalidación bajo lock, no ausencia de llamada al helper desde el endpoint.

Esta corrección también ajusta la nota C1.196 de `Auditoria.txt` y la trazabilidad de `MapaDependencias.md`. No se modifica el resultado general NO CUMPLE de F5-002.

## 5. Reconciliación de tareas existentes

No se crea un AUD-NG ni TASK nuevo. Los hallazgos se asignan a tareas existentes:
- **TASK-118:** generador institucional, inicialización de secuencias, formato anual, validación de colisiones, ausencia de fallbacks y uso del ID real en matrícula.
- **AUD-NG-006:** reserva atómica de claves, idempotencia durable, conflicto explícito, revalidación bajo lock y recuperación ante pérdida de respuesta.
- **AUD-NG-234 / TASK-514:** eliminación de bypasses de lock controlados por payload y protección de las operaciones de admisión, coordinado con la máquina de estados de F5-002.
- **AUD-NG-129:** matrícula y cargos: reemplazar timestamp/aleatorio, lock propio y upsert atómico de matrícula y conceptos.
- **AUD-NG-145:** sanitización de PII en mensajes y payloads de logs; correlationId y registro seguro de conflictos/reintentos.
- **AUD-NG-161:** pruebas conductuales reales de secuencias, colisiones, concurrencia, idempotencia, fallos y recuperación.
- **AUD-NG-232 / TASK-512:** conservar el alcance de recuperación multi-etapa de conversión; coordinar el ID y matrícula sin duplicar la saga.
- **AUD-NG-233 / TASK-513:** conservar validaciones documentales/capacidad/overrides ya asignadas; no duplicar.

## 6. Tareas ejecutables derivadas de los hallazgos

### Ampliación — TASK-118: generador institucional de identificadores
- **Hallazgos:** H1, H2, H5, H6 y H7.
- **Severidad:** Crítico / P0.
- **Objetivo:** garantizar IDs únicos, secuenciales y coherentes con el año lectivo para solicitud, expediente y matrícula.
- **Acciones ejecutables:** mover creación/validación de `SecuenciasIDs` dentro del lock obligatorio; eliminar `skipLock` controlable por cliente; reservar/incrementar secuencia en una sección crítica; validar encabezados y filas; reconciliar el contador con los IDs existentes antes de continuar; incorporar año y formato institucional; eliminar fallbacks constantes y fallar cerrado; pasar el ID MAT generado a `registerStudentEnrollment` y persistirlo realmente.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, hojas `SecuenciasIDs`, `SolicitudesAdmision`, `ExpedientesEstudiantes`, `Matriculas`.
- **Dependencias y riesgos:** AUD-NG-234/TASK-514, AUD-NG-129, AUD-NG-161, AUD-NG-232/TASK-512; compatibilidad con IDs históricos y múltiples instancias/proyectos Apps Script.
- **Criterios de aceptación:** dos creaciones simultáneas reciben IDs distintos; contador recuperable tras reinicio; no se escribe sin lock; formato ADM/EXP/MAT incorpora año; no hay fallbacks constantes ni timestamp como ID único; el ID MAT persistido es el que genera el mecanismo institucional; ningún ID nuevo colisiona con datos preexistentes.
- **Prioridad/estado:** P0 · Pendiente.
- **Evidencia de cierre:** diff, prueba de colisión/contención real, inventario de IDs previos y reporte de unicidad.

### Ampliación — AUD-NG-006: idempotencia atómica y durable de operaciones
- **Hallazgos:** H4 y H7.
- **Severidad:** Crítico / P0.
- **Objetivo:** que la clave se reserve antes de los efectos, que el mismo payload recupere el mismo resultado y que un payload distinto con la misma clave produzca conflicto.
- **Acciones ejecutables:** crear reserva atómica por acción+clave con estados InProgress/Completed/Failed; asociar firma canónica de payload; persistir resultado durable (por ejemplo TablaIdempotencia o repositorio transaccional); revalidar la clave dentro del lock; propagar fallos de persistencia; establecer error `IDEMPOTENCY_CONFLICT`; definir retención y recuperación tras pérdida/evicción de caché; aplicar a createAdmissionRequest, updateAdmissionStatus y convertAdmissionToStudent.
- **Archivos/módulos:** ACADEMIC `Code.gs`, almacenamiento de idempotencia y middleware `doPost`.
- **Dependencias:** TASK-118, AUD-NG-234/TASK-514, AUD-NG-232/TASK-512, AUD-NG-161.
- **Criterios de aceptación:** dos peticiones simultáneas con igual clave producen un único efecto; igual clave con payload diferente se rechaza con código estable; el resultado se recupera tras reinicio/expiración de caché; una respuesta perdida no duplica registros ni notificaciones; error al persistir reserva/resultado impide confirmar operación.
- **Prioridad/estado:** P0 · Pendiente.
- **Evidencia de cierre:** pruebas de concurrencia, reintentos, TTL/evicción, pérdida de respuesta y fallos inyectados.

### Ampliación — AUD-NG-234 / TASK-514: lock no eludible en operaciones de admisión
- **Hallazgos:** H2 y relación con H1.
- **Severidad:** Crítico / P0.
- **Objetivo:** asegurar que creación y cambio de estado nunca omitan la sección crítica por flags del cliente.
- **Acciones ejecutables:** eliminar `isInternalCall`/`skipLock` del contrato público; derivar privilegios internos de contexto server-side; adquirir lock obligatorio antes de consultar duplicados, secuencias y estado; fallar cerrado ante timeout; volver a leer los datos dentro del lock.
- **Archivos/módulos:** ACADEMIC `Code.gs`, `doPost`, `createAdmissionRequest`, `updateAdmissionStatus` y `reopenAdmissionRequest`.
- **Dependencias:** TASK-118, AUD-NG-006, AUD-NG-161.
- **Criterios de aceptación:** peticiones públicas con flags falsificados no omiten lock; timeout no produce escritura; chequeo de duplicados y asignación de ID se ejecutan en la misma sección crítica; pruebas concurrentes no generan solicitudes/estados duplicados.
- **Prioridad/estado:** P0 · Pendiente.
- **Evidencia de cierre:** diff y pruebas reales con flags adversariales y dos ejecuciones simultáneas.

### Ampliación — AUD-NG-129: matrícula y cargos con ID y upsert atómicos
- **Hallazgos:** H5 y H6.
- **Severidad:** Alto / P1.
- **Objetivo:** que toda matrícula use un ID institucional y que el chequeo de duplicidad y escritura sean indivisibles.
- **Acciones ejecutables:** cambiar `registerStudentEnrollment` para aceptar/persistir el MAT generado; eliminar `MAT-Date.now()`; adquirir lock dentro de la función; realizar upsert por usuario/período dentro de la sección crítica; asegurar que conversión no genere un MAT que después descarta; coordinar la creación de cargos y sus IDs con la misma operación recuperable.
- **Archivos/módulos:** ACADEMIC `Code.gs`, hojas `Matriculas` y `CargosEstudiante`.
- **Dependencias:** TASK-118, AUD-NG-006, AUD-NG-161, AUD-NG-232/TASK-512.
- **Criterios de aceptación:** llamadas directas concurrentes para el mismo usuario/período dejan una sola matrícula; ID MAT único y secuencial; no se generan cargos duplicados; fallos parciales se recuperan o compensan; todos los caminos devuelven el mismo identificador persistido.
- **Prioridad/estado:** P1 · Pendiente.
- **Evidencia de cierre:** diff, conteo antes/después y pruebas concurrentes/fallos inyectados.

### Ampliación — AUD-NG-145: logs sin PII y con correlación
- **Hallazgos:** H8.
- **Severidad:** Alto / P1.
- **Objetivo:** registrar conflictos/reintentos sin almacenar datos personales ni payloads completos.
- **Acciones ejecutables:** sustituir el registro de `e.postData` por metadatos permitidos; sanitizar también cadenas JSON y claves de identificación, nombres, correo y teléfono; evitar nombres en mensajes de excepción; añadir correlationId, action, código de conflicto y huella no reversible del token/payload.
- **Archivos/módulos:** ACADEMIC `Code.gs`, `sanitizePayloadForLog`, `logStructuredEvent`, catch de `doPost`.
- **Dependencias:** AUD-NG-006, AUD-NG-161.
- **Criterios de aceptación:** logs de errores y duplicidad no contienen DNI, nombre, email, teléfono, tokens ni cuerpo JSON; los eventos pueden correlacionarse sin revelar PII; pruebas inspeccionan el contenido final de LogsSistema.
- **Prioridad/estado:** P1 · Pendiente.
- **Evidencia de cierre:** fixtures PII y comprobación del registro persistido.

### Ampliación — AUD-NG-161: pruebas conductuales de admisiones
- **Hallazgos:** H1-H9.
- **Severidad:** Alto / P1.
- **Objetivo:** demostrar unicidad, exclusión mutua, idempotencia, rollback y privacidad en escenarios reales controlados.
- **Acciones ejecutables:** probar IDs simultáneos ADM/EXP/MAT; inicialización de SecuenciasIDs; flags skipLock/isInternalCall falsificados; duplicados por DNI/email; mismo token concurrente y payload incompatible; caché expirada/no disponible; fallo entre incremento y append; registro de matrícula duplicada; ausencia de PII en LogsSistema.
- **Archivos/módulos:** `tests/regression/`, ACADEMIC `Code.gs`, fixtures aislados.
- **Dependencias:** TASK-118, AUD-NG-006, AUD-NG-129, AUD-NG-145, AUD-NG-234/TASK-514 y AUD-NG-232/TASK-512.
- **Criterios de aceptación:** las pruebas ejecutan dos operaciones realmente concurrentes, verifican filas/IDs finales y resultados persistidos, inyectan fallos y prueban reintentos; no basta con comprobar presencia de símbolos ni adquisición aislada de lock.
- **Prioridad/estado:** P1 · Pendiente.
- **Evidencia de cierre:** suite reproducible ejecutada y reporte de resultados/cobertura.

## 7. Pruebas y límites

**Ejecutado:** inspección estática/manual de funciones y callsites; cotejo de SHA; revisión de la ruta pública, RBAC, dispatcher y wrapper idempotente; lectura de creación de solicitud, generador, conversión, matrícula, sanitizador y logger; revisión de los dos archivos de regresión; consulta del historial de rutas y de registros históricos; verificación del árbol y rama base.

**No ejecutado:** suites automatizadas; Apps Script runtime; dos peticiones HTTP simultáneas; CacheService real/evicción; Google Sheets productivo; inyección de fallos; rollback; pruebas de duplicados reales; despliegue o lectura de datos personales productivos.

**Archivos modificados en esta iteración:** este informe; corrección documental del informe F5-002; Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt. No se modifica código, pruebas, completadas.md, ChangesLogs.txt, Pendientes.md, metodología ni rama base.

## 8. Dictamen y continuidad

**TAREA-F5-003: NO CUMPLE.** Hay generador secuencial y wrapper idempotente parcial, pero los locks pueden omitirse, la idempotencia no reserva ni persiste de forma durable, el email no se usa en duplicidad, la matrícula real usa timestamp y no el ID secuencial, y no hay pruebas conductuales que acrediten los criterios.

No se crean identificadores de hallazgo nuevos. Se amplían TASK-118, AUD-NG-006, AUD-NG-234/TASK-514, AUD-NG-129, AUD-NG-145 y AUD-NG-161; se coordina con AUD-NG-232/TASK-512 sin duplicar la recuperación multi-etapa.

**Progreso histórico:** 91/183 identificadores auditados; 92 restantes. No se altera el conteo porque no se creó un ID nuevo.

**Siguiente tarea oficial:** TAREA-F5-004 — Construir el formulario público de admisión y conectarlo con el backend. Verificar árbol e historial de su informe antes de iniciar.
