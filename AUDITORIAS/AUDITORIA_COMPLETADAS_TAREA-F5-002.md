# AUDITORÍA COMPLETADA — TAREA-F5-002
## Máquina de estados y reglas de transición para solicitudes de admisión

- **Repositorio:** `i-miss-cocaine/IMA`
- **Rama auditada:** `NG_beta_0.0.0.1_work`
- **HEAD auditado:** `5a0b306f2d2c16f65634b138bfe49a49d62df7a5`
- **Fecha de auditoría:** 2026-11-06 (hora local Honduras)
- **Tarea histórica:** TAREA-F5-002
- **Informe:** creado en esta iteración porque no existía en el árbol ni en el historial Git consultado.
- **Dictamen:** **NO CUMPLE**
- **Alcance:** auditoría estática y documental. No se modificó código fuente ni se ejecutaron pruebas runtime.

## 1. Antecedentes y alcance reconstruido

La búsqueda del árbol completo de la rama (964 entradas, `truncated=false`) no encontró un informe de auditoría para TAREA-F5-002. Tampoco existe historial Git para las rutas consultadas `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-002.md` ni `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md`. Por tanto, no se presentó como recuperado un informe que no existe.

Se recuperó el alcance histórico desde `completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1862-1900) y `ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1550-1562). La tarea fue marcada históricamente como completada y el registro afirma que se implementaron:
- `ALLOWED_ADMISSION_STATE_TRANSITIONS`;
- `updateAdmissionStatus` con estados reconocidos, transición permitida, justificación de 10 caracteres, validación documental, historial y LockService;
- `reopenAdmissionRequest` para Dirección/Administración;
- permiso y dispatcher de reapertura.

Los criterios de aceptación archivados exigen, además, que las transiciones sean seguras frente a concurrencia y reintentos, que la reapertura sea explícita y privilegiada, que se conserve la decisión original, que los requisitos documentales/evaluativos se comprueben antes de avanzar y que el estado de admisión se mantenga separado del estado de matrícula.

La fuente histórica `Auditoria.txt` no conserva el texto original de HALLAZGOS-F5-P0-03; el archivo `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` tampoco está presente en el árbol ni en el historial consultado. El alcance se reconstruyó únicamente desde los registros existentes y se contrastó con el código vigente.

## 2. Evidencia técnica vigente

Todos los siguientes archivos se inspeccionaron en el HEAD auditado:

| Archivo | SHA | Ubicación relevante |
|---|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | `validateRolePermission` 524-583; `doPost` 671-690 y dispatcher 847-860; idempotencia 279-318; matriz 1556-1568; `updateAdmissionStatus` 1928-2059; `reopenAdmissionRequest` 2061-2105; documentos 10708-10785; evaluaciones 1724-1747. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de admisiones, TAREA-F5-002, máquina de estados, transiciones y reapertura. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida de admisiones, estados y reapertura. |
| `AUDITORIAS/MapaDependencias.md` | `4f68d56f910c6a4e87c20ecac82daeb3a615bcaa` | Líneas 1723-1727: incompatibilidad de esquema y fallos silenciados en HistorialCambiosEntidad; sección C1.96, líneas 1917-1921: dependencias F5-001. |
| `ChangesLogs.txt` | `d57cf4bd861b5c3720e60cf83241ed804ff645d9` | Líneas 1550-1562: descripción histórica de la implementación. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Líneas 1862-1900: alcance, criterios y estado histórico [X]. |

## 3. Hallazgos

### H1. La reapertura privilegiada no aplica la máquina de estados y admite destinos arbitrarios
**Clasificación: CRÍTICO / P0 — AUD-NG-234**

`reopenAdmissionRequest` (2062-2105) valida el rol y exige motivo, pero:
- no verifica que el estado de origen sea `Rechazada` o `Retirada`;
- acepta `nuevoEstado` directamente desde el payload y no limita el destino a `Reabierta`;
- no comprueba que el destino exista en `ALLOWED_ADMISSION_STATE_TRANSITIONS`;
- no adquiere LockService ni vuelve a leer el estado bajo una sección crítica.

Por ello, un usuario con permiso para esta operación puede cambiar una solicitud desde estados no reabribles y asignar destinos arbitrarios, incluso `Convertida`, sin respetar la matriz. La operación también puede competir con una actualización simultánea. La función registra una observación y llama al historial después de escribir el estado, pero no garantiza atomicidad.

### H2. La reapertura también puede ejecutarse por el endpoint ordinario
**Clasificación: CRÍTICO / P0 — AUD-NG-234**

La matriz `ALLOWED_ADMISSION_STATE_TRANSITIONS` incluye `Reabierta` como destino desde `Rechazada` y `Retirada`. Sin embargo, `updateAdmissionStatus` es una acción concedida a roles operativos como Secretaría y Subdirección en `ROLE_PERMISSIONS`; el handler acepta esa transición ordinaria sin exigir la operación privilegiada `reopenAdmissionRequest`.

Esto contradice el criterio histórico que reserva la reapertura explícita a Director/Administrador. El control de rol de la función especializada queda eludible usando el endpoint ordinario autorizado para roles menos privilegiados.

### H3. El bloqueo de concurrencia de la transición ordinaria puede omitirse mediante campos del payload
**Clasificación: ALTO / P1 — AUD-NG-234**

En `doPost` (675-677), el servicio elimina `payload.skipLock` solo cuando `payload.isInternalCall` es falso. No se observa una prueba de que `isInternalCall` provenga de un contexto interno autenticado y no del cliente. Un cliente que envíe ambos campos puede conservar `skipLock=true`; `updateAdmissionStatus` (1929, 1941-1949) respeta ese flag y omite `tryLock`.

La función normal sí falla cuando no obtiene el bloqueo, pero el bypass anterior permite saltarse esa protección. Dos cambios concurrentes pueden leer el mismo estado y sobrescribirse. El bloqueo no debe depender de flags declarados por el cliente.

### H4. La idempotencia no se completa para las mutaciones de estado
**Clasificación: ALTO / P1 — ampliación de AUD-NG-006**

`doPost` consulta `checkAndRegisterIdempotencyKey` antes del dispatcher (684-689), y existe `saveIdempotentResult` (306-318). Sin embargo, `updateAdmissionStatus` y `reopenAdmissionRequest` no guardan el resultado mediante `saveIdempotentResult`; la consulta inicial por sí sola no reserva ni persiste la clave. Un reintento no puede recuperar de forma garantizada el resultado de la primera operación ni detectar la reutilización incompatible de la misma clave en estas mutaciones. El retorno `isAlreadyInState` de `updateAdmissionStatus` no sustituye una garantía de idempotencia por operación ni cubre la reapertura.

### H5. El historial de transición no es una condición durable de éxito
**Clasificación: ALTO / P1 — ampliación de AUD-NG-145**

`updateAdmissionStatus` escribe primero el estado (2014-2020) y después llama a `recordEntityChangeLog` y `logStructuredEvent` (2022-2024). El helper `recordEntityChangeLog` (1571 en adelante) captura errores y los silencia, por lo que la operación puede responder éxito aunque el historial no se haya persistido. La llamada no entrega un `correlationId` de la operación. `reopenAdmissionRequest` repite el patrón de escritura previa y registro posterior (2089-2096).

Además, `MapaDependencias.md` (1723-1727) ya documenta que el esquema de `HistorialCambiosEntidad` difiere entre ACADEMIC y USER y que los lectores comunes no reconstruyen correctamente las filas académicas. Este hallazgo se amplía en AUD-NG-145; no se crea una segunda tarea de auditoría genérica.

### H6. Las guardas documentales y evaluativas permiten avanzar cuando no hay datos que acreditar
**Clasificación: ALTO / P1 — ampliación de AUD-NG-233 / TASK-513**

En `updateAdmissionStatus` (1985-2003), el paso a `Evaluacion` solo bloquea documentos devueltos con estado Pendiente/Rechazado. No valida contra un catálogo de documentos obligatorios ni demuestra que todos los requisitos configurados estén presentes. El paso a `Admitida` solo bloquea evaluaciones obligatorias que estén Pendiente/Reprobado; si la consulta devuelve un arreglo vacío, la condición no bloquea la transición. No se acredita un contrato fail-closed para errores o respuestas incompletas de las consultas.

La ampliación se asigna a AUD-NG-233/TASK-513, que ya cubre validación documental, capacidad y overrides en el mismo flujo. No se duplica el hallazgo.

### H7. No se acreditan pruebas conductuales específicas de la máquina de estados
**Clasificación: ALTO / P1 — ampliación de AUD-NG-161**

La búsqueda dirigida en `academic-grading-suite.js` y `modular-dashboard-suite.js` no encontró pruebas para `updateAdmissionStatus`, `reopenAdmissionRequest`, `ALLOWED_ADMISSION_STATE_TRANSITIONS` ni TAREA-F5-002. No hay evidencia en los archivos examinados de pruebas de matriz completa, reapertura desde estados no permitidos, bypass de bloqueo, concurrencia, idempotencia, fallo de persistencia de historial o requisitos incompletos.

## 4. Dictamen

**NO CUMPLE.** La implementación contiene una matriz de estados y validaciones parciales, pero no satisface los controles esenciales de integridad. En particular, la operación de reapertura puede eludir la matriz, el endpoint ordinario permite reabrir con permisos más amplios, el bloqueo puede omitirse mediante un campo no confiable, la idempotencia no se persiste para las mutaciones de estado y el historial puede fallar sin impedir que se informe éxito.

La marca histórica [X] en `completadas.md` y la descripción de `ChangesLogs.txt` acreditan que hubo una implementación declarada, no que los criterios de aceptación estén satisfechos hoy. No se considera resuelta la tarea por existir código ni por crear este informe.

## 5. Reconciliación de tareas existentes

- **Nueva:** `AUD-NG-234 / TASK-514` — integridad de la máquina de estados y reapertura privilegiada, incluyendo matriz única, bloqueo no eludible, validación de origen/destino y conservación de la decisión.
- **Ampliar `AUD-NG-006`:** idempotencia de `updateAdmissionStatus` y `reopenAdmissionRequest`, con reserva/persistencia y respuesta reproducible.
- **Ampliar `AUD-NG-145`:** persistencia verificable del historial, esquema compatible y correlación de transición.
- **Ampliar `AUD-NG-233 / TASK-513`:** validación fail-closed de documentos/evaluaciones obligatorios antes de los cambios de etapa.
- **Ampliar `AUD-NG-161`:** pruebas conductuales de transiciones, roles, concurrencia, idempotencia, historial y fallos.

No se reutiliza `AUD-NG-179` para duplicar el hallazgo de lock timeout de capacidad: su alcance vigente es el bloqueo fail-closed en las operaciones ya identificadas. La brecha de transición/reapertura se registra como AUD-NG-234. Tampoco se duplica `AUD-NG-232/TASK-512`, que cubre recuperación multi-etapa de conversión, ni `AUD-NG-233/TASK-513`, cuyo alcance se amplía solo en la guarda documental/evaluativa.

## 6. Tareas ejecutables derivadas de los hallazgos

### Nueva — AUD-NG-234 / TASK-514
- **Referencia:** H1, H2 y H3.
- **Severidad:** Crítico / P0.
- **Objetivo:** hacer que toda transición de admisión, incluida la reapertura, pase por una única máquina de estados del servidor y respete el rol, el origen, el destino y la concurrencia.
- **Acciones concretas:**
  1. Centralizar la mutación en un servicio interno que reciba estado esperado, estado destino, actor autenticado y motivo; impedir escrituras directas desde handlers alternativos.
  2. Reservar `Reabierta` a `reopenAdmissionRequest`; impedir que `updateAdmissionStatus` la acepte como destino ordinario.
  3. Permitir reapertura únicamente desde estados explícitamente definidos (como mínimo Rechazada/Retirada), fijar el destino a Reabierta y rechazar cualquier `nuevoEstado` arbitrario.
  4. Exigir Director/Administrador según la política institucional y hacer coincidir la matriz de permisos con la validación interna; eliminar discrepancias de roles.
  5. Adquirir LockService obligatoriamente, releer la fila y validar el estado de origen dentro del bloqueo. Rechazar timeout sin continuar.
  6. No aceptar `skipLock`, `isInternalCall` ni flags de privilegio del cliente. Si se necesita una ruta interna, generar la autorización en el servidor, no desde el payload.
  7. Conservar la decisión previa como evento inmutable y registrar origen, destino, actor verificado, motivo, fecha y correlationId.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, permisos y dispatcher de ACADEMIC; pruebas de regresión correspondientes.
- **Dependencias:** AUD-NG-006, AUD-NG-145, AUD-NG-161.
- **Criterios de aceptación verificables:** transición ordinaria a Reabierta rechazada para todos los roles; reapertura solo desde estados permitidos y por rol autorizado; destino arbitrario rechazado; intento desde Convertida rechazado; flag cliente `isInternalCall/skipLock` no omite lock; timeout falla cerrado; dos transiciones concurrentes no sobrescriben el estado esperado; historial conserva la decisión previa.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-006 (idempotencia)
- **Referencia:** H4.
- **Severidad:** Alto / P1.
- **Objetivo:** asegurar que las transiciones de estado sean idempotentes ante reintentos y claves reutilizadas.
- **Acciones:** reservar la clave antes del efecto, vincularla a firma de payload y operación, persistir resultado junto con estado/evento, rechazar payload incompatible y devolver el resultado original ante repetición; cubrir tanto actualización como reapertura.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, almacenamiento durable de idempotencia y suite de regresión.
- **Dependencias:** AUD-NG-234, AUD-NG-161.
- **Criterios de aceptación:** reintento de una transición confirmada devuelve el mismo resultado sin duplicar historial/notificación; misma clave con payload distinto devuelve conflicto; solicitudes simultáneas con la misma clave producen un único efecto.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-145 (trazabilidad)
- **Referencia:** H5.
- **Severidad:** Alto / P1.
- **Objetivo:** impedir que una transición se confirme sin trazabilidad durable y legible.
- **Acciones:** normalizar el contrato de HistorialCambiosEntidad; suministrar correlationId real; propagar errores de persistencia o aplicar compensación transaccional; verificar que los lectores reconstruyan los eventos ACADEMIC.
- **Archivos/módulos:** ACADEMIC y USER `Code.gs`, lectores de historial y pruebas.
- **Dependencias:** AUD-NG-234, AUD-NG-161.
- **Criterios de aceptación:** cada transición confirmada tiene evento durable con actor/fecha/origen/destino/motivo/correlationId; fallo de auditoría no se silencia como éxito; lector común reconstruye el evento sin ambigüedad.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-233 / TASK-513 (guardas de etapa)
- **Referencia:** H6.
- **Severidad:** Alto / P1.
- **Objetivo:** hacer fail-closed las condiciones documentales y evaluativas de la transición.
- **Acciones:** obtener requisitos obligatorios desde catálogo institucional; comparar documentos presentes, vigentes y aprobados contra el conjunto requerido; exigir evaluaciones obligatorias definidas y dictamen válido; rechazar respuesta ausente, incompleta o fallida.
- **Archivos/módulos:** ACADEMIC `Code.gs`, catálogo documental/evaluativo y pruebas.
- **Dependencias:** AUD-NG-234, TASK-512 si se comparte el flujo de conversión.
- **Criterios de aceptación:** solicitud sin documentos requeridos no avanza; documentos rechazados/vencidos no satisfacen requisitos; ausencia de evaluaciones requeridas no equivale a aprobación; error de consulta bloquea la transición.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-161 (pruebas conductuales)
- **Referencia:** H1-H7.
- **Severidad:** Alto / P1.
- **Objetivo:** cubrir el comportamiento real de la máquina de estados, sus controles de seguridad y sus fallos.
- **Acciones:** construir fixtures aislados; probar todas las aristas permitidas y denegadas; probar roles, reapertura, flags no confiables, lock timeout/concurrencia, idempotencia, fallos de historial, documentos/evaluaciones incompletos y no regresión de conversión.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js` o suite académica específica y los handlers ACADEMIC.
- **Dependencias:** AUD-NG-234, AUD-NG-006, AUD-NG-145, AUD-NG-233.
- **Criterios de aceptación:** pruebas automatizadas reproducibles verifican estado final, actor, eventos, ausencia de duplicados y rechazo de todos los caminos no permitidos; se ejecutan en entorno aislado sin alterar datos productivos.
- **Prioridad:** P1.
- **Estado:** Pendiente.

## 7. Pruebas y límites de esta auditoría

**Ejecutado:** lectura del registro histórico de tarea y sus criterios; búsqueda de informe en el árbol y su historial; inspección estática de permisos, dispatcher, matriz, mutaciones, helper de idempotencia, historial, guardas documentales/evaluativas y suites de regresión; cotejo de SHA; consulta de metodología y dependencias; verificación de HEAD, árbol completo y rama base.

**No ejecutado:** Apps Script runtime; llamadas HTTP a deployments; Google Sheets/CacheService/Drive productivos; pruebas de roles reales; concurrencia o inyección de fallos; simulación de pérdida de respuesta; suites automatizadas; navegador/UI; despliegue.

**Cambios realizados en esta iteración:** este informe de auditoría y el checkpoint acumulativo en `AUDITORIAS/Contexto_personal.txt`. No se modificó código fuente, pruebas, bitácoras históricas, plan, metodología, registros externos de pendientes ni la rama base.

---
**Conclusión:** la implementación histórica existe, pero la máquina de estados no cumple los criterios críticos de autorización, transición, concurrencia, idempotencia y trazabilidad. TAREA-F5-002 permanece **NO CUMPLE** hasta completar las tareas indicadas y verificar sus pruebas.
