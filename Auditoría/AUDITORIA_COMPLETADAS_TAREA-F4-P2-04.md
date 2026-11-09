# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P2-04

**Checkpoint:** C1.88  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `05987b81b1361d8605829b90dab0b3f5014f17e3`  
**Tree SHA de partida:** `427f03e570c6a0b2d0d778027442d286dbfb8a74`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 150 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; C1.87 y C1.88 intermedios; sesión abierta; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE.** El cambio log declara locks para cuatro operaciones de USER, pero el código actual solo adquiere LockService en dos de ellas. Además, hay rutas de delegación que modifican el mismo registro sin coordinarse con ese lock, y updateUserProfile hace una escritura de fila completa sin exclusión mutua.

## 1. Alcance y fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1785-1789) marca TAREA-F4-P2-04 como [X], severidad Medio, backend/*/Code.gs. No contiene criterios detallados.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1759-1761) declara que `createSecurityDelegation`, `revokeSecurityDelegation`, `updateUserProfile` y `manageAccountState` usan `LockService.getScriptLock()`, espera de 10.000 ms y `try...finally { lock.releaseLock(); }`.

La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no está en el árbol; el contraste se limita a la declaración del changelog y a la implementación actual.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | generateInstitutionalId 1706-1743; createSecurityDelegation 1746-1801; getSecurityDelegations 1803-1859; revokeSecurityDelegation 2276-2314; manageAccountState 2342-2386; registerUser 2393-2452; updateUserProfile 2654-2695; recordEntityChangeLog 2714-2745. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de las cuatro operaciones y pruebas de LockService. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida; sin casos coincidentes. |
| `Pendientes.md` | `83e885f4b8f860aba200ed5ae739b794c7c02dc8` | AUD-NG-161, AUD-NG-218, AUD-NG-219 y TASK-118. |

## 3. Contraste de las cuatro funciones declaradas

| Función | Lock en código | Resultado |
|---|---|---|
| createSecurityDelegation | Sí, waitLock(10000), finally releaseLock (1761-1798). | Tiene lock, pero llama a generateInstitutionalId dentro del lock; el generador intenta adquirir ScriptLock de nuevo. Requiere prueba runtime para determinar efecto. |
| revokeSecurityDelegation | No. | Lee, valida y escribe Revocada sin lock (2276-2314). |
| updateUserProfile | No. | Lee fila, modifica copia y escribe fila completa con setValues sin lock (2654-2695). |
| manageAccountState | Sí, waitLock(10000), finally releaseLock (2349-2386). | Tiene lock, pero dentro llama a recordEntityChangeLog, que llama a generateInstitutionalId y vuelve a adquirir ScriptLock. Requiere prueba runtime. |

Por tanto, la afirmación del changelog de que las cuatro funciones están protegidas no coincide con el código: solo dos muestran adquisición explícita.

## 4. Hallazgos y reconciliación

### 4.1. Pérdida de actualizaciones concurrentes de perfil (nuevo AUD-NG-229 / TASK-509)

`updateUserProfile` (2654-2695) lee la fila completa de Usuarios, actualiza campos en una copia y reescribe toda la fila sin lock ni versión. Dos peticiones concurrentes pueden leer la misma versión inicial y la última escritura sobrescribir campos actualizados por la primera.

Se crea AUD-NG-229/TASK-509 para este alcance específico.

### 4.2. Revocación y expiración de delegaciones sin coordinación mutua (AUD-NG-219)

`revokeSecurityDelegation` (2276-2314) no adquiere lock para leer/validar/escribir. `getSecurityDelegations` (1803-1859) cambia Activa a Expirada con setValue durante una consulta y tampoco adquiere lock. Ambas rutas pueden competir entre sí y no se coordinan con el lock de `createSecurityDelegation`.

Se amplía AUD-NG-219/TASK-498; no se crea ID duplicado.

### 4.3. Inicialización y adquisición anidada del generador (TASK-118)

`generateInstitutionalId` (1706-1743) crea la hoja `SecuenciasIDs` y escribe encabezados antes de adquirir ScriptLock, dejando sin protección la inicialización inicial.

`createSecurityDelegation` mantiene ScriptLock y llama al generador, que también adquiere ScriptLock. `manageAccountState` mantiene ScriptLock y llama a `recordEntityChangeLog`, que a su vez llama al generador. Esto plantea una posible adquisición anidada del mismo recurso; no se afirma que haya timeout reproducido porque no se ejecutó Apps Script runtime. Debe resolverse el contrato de lock (por ejemplo, operación interna que no reacquiera) y probarse.

`registerUser` mantiene la comprobación de email y el append fuera de una sección crítica única; ya está documentado en TASK-118/C1.40 y no se duplica.

### 4.4. Contador de intentos y pruebas de concurrencia (AUD-NG-218 / AUD-NG-161)

El contador de login sin lock permanece bajo AUD-NG-218. La búsqueda dirigida no encontró pruebas para las cuatro funciones de esta tarea en los dos archivos regression inspeccionados. La suite académica contiene asserts de locks de otras operaciones; la suite modular no aporta casos de estas funciones. AUD-NG-161 ya cubre reemplazar las pruebas nominales por concurrencia conductual real.

## 5. Límites de verificación

**Ejecutado:** inspección estática/manual de locks, bloques try/finally, lecturas/escrituras de hojas, llamadas anidadas al generador y búsqueda dirigida en pruebas; cotejo con Pendientes.md y ChangesLogs.txt.

**No ejecutado:** Apps Script runtime, ejecuciones concurrentes reales, pruebas de reentrada/timeout de LockService, fallos de SpreadsheetApp, colisiones de creación inicial de SecuenciasIDs, carreras de revocación/expiración, dos actualizaciones paralelas de perfil ni suites automatizadas. No se modificó código ni pruebas.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 85/183 identificadores auditados; 98 pendientes.
- **Última tarea auditada:** C1.88 / TAREA-F4-P2-04.
- **Siguiente tarea exacta:** TAREA-F4-P2-05 - Consolidar la documentación institucional de privacidad y tratamiento de datos.
- **Archivos documentales previstos para C1.88:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.


## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-229 / TASK-509] Serializar la actualización de perfiles y evitar la pérdida de cambios concurrentes

- **Hallazgo de origen:** sección 4.1 y registro preexistente AUD-NG-229/TASK-509 en `AUDITORIAS/Auditoria.txt` y `AUDITORIAS/MapaDependencias.md`. `updateUserProfile` (USER 2654-2695) lee la fila completa de Usuarios, modifica una copia y vuelve a escribirla con `setValues` sin adquirir lock ni comprobar una versión. Dos solicitudes concurrentes pueden leer la misma versión inicial y la última escritura sobrescribir los cambios de la primera.
- **Clasificación:** la tarea madre TAREA-F4-P2-04 figura con severidad Medio en completadas.md. El registro resumido de AUD-NG-229 no asigna severidad ni prioridad propias; no se inventa una clasificación adicional.
- **Objetivo:** garantizar que las actualizaciones concurrentes del perfil se serialicen o detecten conflictos de versión, evitando que una escritura de fila completa sobrescriba cambios independientes ya persistidos.
- **Acción ejecutable:**
  1. Definir el contrato de actualización de perfil y la lista de campos mutables. Validar los tipos y valores permitidos antes de iniciar la sección crítica; derivar la identidad del actor de la sesión verificada y conservar las comprobaciones de autorización existentes.
  2. Implementar una estrategia explícita de concurrencia para la fila objetivo: adquisición de un lock común a todos los escritores del mismo proyecto USER antes de leer el estado vigente y mantenerlo hasta completar la escritura, o control optimista mediante versión/revisión persistente con comparación y rechazo de versiones obsoletas.
  3. Volver a leer la fila dentro de la sección crítica y aplicar únicamente los campos autorizados de la petición sobre esa versión vigente. Evitar reescribir valores obsoletos de columnas no modificadas por la solicitud.
  4. Si se utiliza LockService, responder con error explícito cuando no se obtenga el lock dentro del tiempo configurado; no continuar sin protección ni devolver éxito. Liberar el lock en finally y solo cuando haya sido adquirido.
  5. Definir el límite del mecanismo: ScriptLock coordina ejecuciones del mismo proyecto de Apps Script, pero no debe presentarse como lock distribuido entre proyectos distintos que compartan la hoja Usuarios. Identificar otros escritores de esa hoja y, si cruzan proyectos, establecer una versión/autoridad común o mecanismo de coordinación compartido.
  6. Coordinar la bitácora y la invalidación de caché con la sección crítica sin introducir una adquisición anidada del mismo ScriptLock. El generador de IDs y los locks anidados ya pertenecen a TASK-118; usar un helper interno con propiedad de lock explícita o un mecanismo recuperable que no vuelva a adquirir el lock retenido.
  7. Definir el comportamiento ante errores de lectura, validación, escritura, bitácora e invalidación: distinguir qué operación quedó persistida, evitar respuestas de éxito engañosas y dejar trazabilidad recuperable sin exponer datos sensibles.
  8. Añadir pruebas conductuales aisladas con dos o más actualizaciones paralelas del mismo usuario, cambios en campos distintos, conflicto sobre el mismo campo, timeout de lock, error de escritura y recuperación. Las pruebas deben verificar el estado final de la fila, no limitarse a comprobar que se llamó LockService.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs` (`updateUserProfile`, mecanismo de lock/versionado, registro de cambios y purga de caché); pruebas aisladas de concurrencia para USER.
- **Dependencias y límites:** AUD-NG-161 conserva la suite de pruebas conductuales reales; TASK-118 conserva el generador institucional, la inicialización de SecuenciasIDs, los bypasses y las posibles adquisiciones anidadas; AUD-NG-219/TASK-498 conserva la coordinación de revocación/expiración de delegaciones; AUD-NG-218 conserva el contador y la política antiabuso de login. Esta tarea se limita al read-modify-write de updateUserProfile y no absorbe los otros alcances.
- **Criterios de aceptación:**
  1. Dos actualizaciones simultáneas de campos distintos del mismo usuario no pierden cambios; ambas se conservan o una recibe un conflicto explícito y recuperable según el contrato definido.
  2. Dos actualizaciones simultáneas del mismo campo siguen una política determinista de conflicto y nunca producen una respuesta de éxito para una escritura descartada silenciosamente.
  3. La fila se lee después de obtener el lock o se verifica una versión vigente antes de escribir; no se persiste una copia obsoleta sin detectar el conflicto.
  4. Un timeout o fallo al adquirir el lock aborta la escritura y devuelve un resultado explícito; el lock se libera en finally cuando corresponde.
  5. Los escritores del mismo proyecto USER usan el mecanismo común; cualquier escritor de otro proyecto se coordina mediante una estrategia compartida y no se considera protegido por el ScriptLock local.
  6. La bitácora y la purga de caché no introducen deadlock/reentrada por adquisición anidada; las operaciones parciales quedan identificadas y recuperables.
  7. Las pruebas paralelas y de fallo usan fixtures aislados, verifican valores persistidos y distinguen PASS, FAIL, SKIP y NOT RUN. No se ejecutan contra hojas productivas.
- **Prioridad:** no asignada en las fuentes del hallazgo.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Adjuntar commit de implementación, pruebas concurrentes reproducibles, evidencia de conflicto/timeout y verificación del contrato de lock con el registro de cambios.

## Aclaración documental sobre Pendientes.md y la reconciliación de IDs

La versión histórica de `Pendientes.md` citada por el informe C1.88 (blob SHA `83e885f4b8f860aba200ed5ae739b794c7c02dc8`) fue inspeccionada directamente: contiene 1.764.184 caracteres y bloques detallados para AUD-NG-161, AUD-NG-218, AUD-NG-219 y TASK-118. La versión actual de la rama (blob SHA `ef47d232db3ed46317dc14f22b1cdf8f938e8405`) contiene 1.425.933 caracteres; conserva TASK-118, pero no contiene esas tres cadenas AUD-NG ni AUD-NG-229/TASK-509. La diferencia entre snapshots no demuestra que esos hallazgos hayan desaparecido del repositorio: permanecen registrados en Auditoria.txt, MapaDependencias.md, el plan y los informes correspondientes. No se restaura ni modifica Pendientes.md en esta iteración.
