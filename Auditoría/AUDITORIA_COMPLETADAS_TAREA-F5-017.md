# AUDITORÍA TÉCNICA - TAREA-F5-017: detección de duplicados, validación y calidad de datos de aspirantes

- **Repositorio:** i-miss-cocaine/IMA
- **Rama auditada:** NG_beta_0.0.0.1_work
- **Último checkpoint válido indicado expresamente por el usuario para esta iteración:** C1.212 (HEAD d72e39580df79369b45b418a4773eda25fc36679; árbol 1e5c70b8fb865aed7592fb3f0ca4298d7453ff91).
- **Checkpoint de inicio:** C1.212.
- **HEAD real de la rama antes de publicar esta reauditoría:** 5307832d34e767dbda5052cc6d0c7295c48565c0 (commit rotulado C1.213; no se acepta como checkpoint válido).
- **Árbol de la rama antes de publicar:** 8e3e5b6fcbbc84d7f8bbf3e2377ce732cb1e5c6b.
- **Rama base protegida:** NG_beta_0.0.0.1.
- **HEAD de rama base verificado:** 44d9891132332e692dbe2ba8602b41f50a508a59.
- **Comparación previa a publicación:** 281 commits adelante y 0 detrás.
- **Checkpoint de cierre preparado:** C1.214.
- **Sesión operativa:** IMA-AUDIT-20261107-1744Z (identificador operativo, no ID nativo de ChatGPT).
- **Fecha:** 2026-11-07.
- **Dictamen técnico:** **NO CUMPLE**.

## 1. Búsqueda documental, fuente y continuidad

En el árbol de C1.212 (1e5c70b8fb865aed7592fb3f0ca4298d7453ff91) no existía la ruta `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md`. El historial consultado muestra que la ruta apareció por primera vez en el commit C1.213 (5307832d34e767dbda5052cc6d0c7295c48565c0). El usuario indicó expresamente que los checkpoints posteriores a C1.212 no son válidos; por tanto, C1.213 no se adopta como checkpoint ni como autoridad de dictamen. Su contenido se volvió a contrastar de manera independiente contra los requisitos y el código, y este informe sustituye el documento provisional conservando el historial Git.

**Fuente de requisitos:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 2355-2379. TAREA-F5-017 contiene nueve requisitos y cinco criterios de aceptación, todos marcados [x], con estado administrativo [X] Completada. La marca se conserva sin modificar y no acredita cumplimiento técnico.

**Origen citado por la tarea:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P0-01) y `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidades 5.1 y 5.6, Brecha P0-01). El identificador citado no aparece como hallazgo individual verificable en la bitácora vigente y el informe de fase citado no está en el árbol inspeccionado. La procedencia original del hallazgo no puede verificarse con los documentos disponibles.

**ChangesLogs.txt:** SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`, líneas 1906-1914. Declara la comparación de solicitudes/expedientes, clasificación exacta/alta/media, enmascaramiento de DNI, endpoint de resolución, auditoría y panel de Secretaría. La inspección confirmó diferencias entre esas declaraciones y la implementación. También se menciona `renderAdmissionDuplicatesSection`, pero no existe esa función en `js/secretary.js`; el renderizado está dentro de `checkAdmissionDuplicates`.

**Pendientes.md:** la lectura ordinaria de la ruta devolvió 0 caracteres. Se recuperó directamente el blob histórico SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`: 1.782.094 caracteres, 20.182 líneas y sin U+FFFD. No contiene una entrada directa F5-017 ni referencias a `findDuplicateStudents`/`resolveAdmissionDuplicate`. Sí contiene AUD-NG-145 (sanitización/PII), AUD-NG-224/TASK-504 (esquema, actor verificado, escritores ad hoc y fallos de persistencia) y AUD-NG-161 (pruebas reales de concurrencia/idempotencia), relacionados con hallazgos de esta auditoría. TASK-113 corresponde a duplicados en importaciones de otra fase y no sustituye este flujo.

**Continuidad de rama:** C1.212 es el punto de referencia válido por instrucción expresa del usuario. El HEAD previo a esta publicación es C1.213, pero ese checkpoint no se adopta. El commit C1.213 contiene cambios documentales; los SHA de `backend/academic-service/Code.gs`, `js/secretary.js`, `dashboard-secretaria.html`, las suites, `completadas.md` y `ChangesLogs.txt` coinciden con C1.212. Por ello el código auditado es exactamente el código del árbol C1.212. No se hace reset ni force-push; se conserva el historial. La rama base protegida permanece en `44d9891132332e692dbe2ba8602b41f50a508a59`.



## 2. Evidencia técnica y respaldos

| Archivo | SHA de respaldo | Secciones/rangos examinados |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | TAREA-F5-017, líneas 2355-2379; nueve requisitos/cinco criterios. |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Declaración F5-017, líneas 1906-1914. |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | normalizeString (79-82); ROLE_PERMISSIONS (168-260); PUBLIC_ACTIONS (265); validateRolePermission (524-583); doPost/dispatcher (671-977); createAdmissionRequest (984-1100); recordEntityChangeLog (1568-1595); TC-04 de la suite interna (aprox. 4008); findDuplicateStudents/maskDni (10107-10217); resolveAdmissionDuplicate (10218-10281); convertAdmissionToStudent (2156-2380). |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | Apertura de detalle y llamada a checkAdmissionDuplicates (197); checkAdmissionDuplicates y promptResolveAdmissionDuplicate (1228-1355). |
| dashboard-secretaria.html | fa0d8c23aace24a6acab2d4956398a7f5e1309b8 | Panel de duplicados en modal de detalle (222-237); control de acceso del dashboard revisado en inicialización. |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | Archivo completo; no contiene pruebas F5-017 ni llamadas a los endpoints de admisión. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo; no contiene pruebas F5-017 ni llamadas a los endpoints de admisión. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md | 70d88def7e9c3789c473aa7b22482fe5a97eb63c (provisional C1.213) | Informe provisional reexaminado y sustituido por esta versión C1.214; su creación inicial no acredita el checkpoint C1.213. |
| AUDITORIAS/Auditoria.txt | c0799cd63cdf5dae5d2ac3bc688fcabda4c421c8 (C1.212); 4aa7992941e8a9426e605d59818b59060a5c6c00 (prepublicación) | Antecedentes F5-012 y C1.212; no existe una entrada de auditoría individual F5-017 ni el hallazgo de origen citado. |
| AUDITORIAS/MapaDependencias.md | f986dc3c1509c0f1a6a479fdd5cb753c2ae1a49e (C1.212); 4b0ccceccab51a88808798c1ea1931fb1e3533ad (prepublicación) | Registro de ACADEMIC/HistorialCambiosEntidad y AUD-NG-224/TASK-504; antecedentes de admisiones y trazabilidad. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 455b40679eb587d21cfee71a814395eaa8ce4940 (C1.212); f6b1aefdf4e1b068cbe6bfc3d63386f96381aa9f (prepublicación) | Continuidad hasta C1.213; se corrige mediante C1.214 sin aceptar C1.213 como checkpoint válido. |
| AUDITORIAS/Contexto_personal.txt | e9cd043ea18cd24cb99db34095532d8d4be7b240 (C1.212); bf74ac20f79c1f7beef903f37c761f820be203c2 (prepublicación) | Reglas de inicio/cierre y checkpoints previos; la instrucción actual del usuario fija C1.212 como referencia válida. |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Reglas de auditoría manual, tareas derivadas, commit único, checkpoint acumulativo y publicación controlada. |
| AUDITORIAS/README.md | 2f649c6ffc39ec7cdd242e85cb71b4344fd69e34 | Convención de informe y sección obligatoria de tareas derivadas. |
| Pendientes.md (blob histórico) | 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c | Lectura íntegra recuperada: 1.782.094 caracteres/20.182 líneas/sin U+FFFD; sin entrada directa F5-017; AUD-NG-145 y AUD-NG-224/TASK-504 relacionados. |

## 3. Matriz de requisitos y criterios

| Requisito | Resultado | Evidencia y evaluación |
|---|---|---|
| 1. Validación estricta de DNI, pasaporte, teléfono, email y fecha de nacimiento en servidor. | **NO CUMPLE** | createAdmissionRequest solo exige nombres, apellidos y grado; identificación se recorta, email se pasa a minúsculas y teléfono se recorta, sin validación de formato; fecha se acepta sin comprobar validez/rango. findDuplicateStudents tampoco valida formatos. No hay regla específica de pasaporte. |
| 2. Normalización diacrítica, caracteres especiales y espacios redundantes. | **PARCIAL** | normalizeString convierte a minúsculas, elimina marcas diacríticas NFD y aplica trim externo. No elimina puntuación/caracteres especiales ni colapsa espacios internos repetidos. |
| 3. Comparar solicitudes activas con expedientes existentes y otras solicitudes. | **PARCIAL / FALLA EN EXPEDIENTES** | El recorrido de solicitudes existe. En expedientes, la búsqueda de usuario compara Usuarios[0] con ExpedientesEstudiantes[1], que es PersonaID y no el UserId; además compara fechaNacimiento con e[7] (EstadoExpediente) en lugar de e[3] (FechaNacimiento). La conversión crea PersonaID y UserId distintos. |
| 4. Clasificar coincidencia exacta, alta y media según las reglas definidas. | **NO CUMPLE** | Exacta y alta se evalúan para solicitudes, pero la media se dispara por email O teléfono, sin exigir ambos ni nombres similares. La comparación telefónica es asimétrica. Para expedientes, los defectos de relación/índice impiden confiar en la detección. |
| 5. Prohibir fusión o vinculación automática sin verificación manual de Secretaría. | **NO CUMPLE** | resolveAdmissionDuplicate ofrece una decisión manual, pero convertAdmissionToStudent busca coincidencias en ExpedientesEstudiantes[10] (Observaciones) mediante includes(identificacion) y reutiliza automáticamente el expediente encontrado. No exige constancia de revisión manual ni valida que el destino sea el candidato confirmado. |
| 6. Evitar exposición de datos personales a usuarios no autorizados. | **NO CUMPLE / PARCIAL** | RBAC restringe findDuplicateStudents a determinados roles, pero createAdmissionRequest está en PUBLIC_ACTIONS y su error de duplicado devuelve el ID de la solicitud previa junto al nombre completo repetido desde el payload del solicitante (no consultado desde la fila duplicada), lo que confirma la existencia de una solicitud y revela su identificador. findDuplicateStudents retorna email íntegro en candidates aunque la UI no lo muestra. El panel interpola nombres, códigos e identificadores en innerHTML sin escape contextual. |
| 7. Panel de resolución para que Secretaría apruebe nuevo expediente o vincule uno existente. | **PARCIAL** | Existe tarjeta en dashboard-secretaria.html y flujo checkAdmissionDuplicates/promptResolveAdmissionDuplicate. Sin embargo, el rol Secretaria (sin tilde) está permitido por el dashboard y puede buscar, pero no tiene resolveAdmissionDuplicate en ROLE_PERMISSIONS; Desarrollador también pasa el guard del HTML pero no tiene permiso para estos endpoints. |
| 8. Registrar decisión en bitácora de auditoría. | **NO CUMPLE** | El handler genera fecha y un texto de decisión, pero el actor viene de authUserId/authRole del payload en vez de _verifiedUserId/_verifiedRole; el flujo normal omite esos campos y deja un actor genérico. La escritura directa agrega ocho valores a HistorialCambiosEntidad, cuyo esquema canónico académico tiene nueve columnas y otro orden; los errores se silencian. |
| 9. Corrección de datos de una solicitud con trazabilidad original. | **NO CUMPLE / NO DEMOSTRADO** | No se encontró endpoint ni flujo de UI para corregir los campos de la solicitud. updateAdmissionStatus cambia estado/observaciones y resolveAdmissionDuplicate modifica observaciones/vínculo; no conservan una versión anterior/nueva de los datos corregidos. |

**Criterios de aceptación:**

1. DNI existente en SolicitudesAdmision o ExpedientesEstudiantes detectado e informado: **PARCIAL**. createAdmissionRequest compara solo solicitudes del mismo año lectivo, con igualdad textual del DNI; no consulta expedientes. findDuplicateStudents intenta revisar expedientes, pero el join PersonaID/UserId y el índice de fecha son incorrectos.
2. No fusionar personas automáticamente solo por nombres: **PARCIAL**. No se encontró una fusión basada exclusivamente en nombre dentro de este flujo; sin embargo, convertAdmissionToStudent realiza vinculación automática por una coincidencia de texto en Observaciones sin revisión manual documentada, por lo que incumple la prohibición más amplia del requisito 5.
3. Consola administrativa muestra alertas para Secretaría: **PARCIAL**. El panel y las alertas existen, pero hay discrepancias entre roles visibles y permisos de servidor.
4. Mensajes no revelan información confidencial de terceros: **NO CUMPLE**. La acción pública de alta revela el identificador de una solicitud previa y refleja el nombre completo enviado por quien consulta, confirmando la existencia del registro; la respuesta de búsqueda además contiene correo completo.
5. Resolución documentada con usuario, fecha y decisión: **NO CUMPLE**. La fecha y la decisión se construyen, pero el usuario no procede de claims verificados y la fila se escribe con esquema incompatible; no se garantiza que el lector de auditoría pueda recuperarla.

## 4. Hallazgos técnicos

### H1 - No hay validación de formato de los datos de identidad y contacto en el servidor
- **Severidad:** Alta / P1.
- **Evidencia:** createAdmissionRequest (984-1100) solo comprueba presencia de nombres, apellidos y grado. cleanIdent usa String(...).trim(); cleanEmail aplica trim/lowercase; telefonoContacto solo trim; fechaNacimiento se guarda directamente. findDuplicateStudents (10107-10195) tampoco valida longitud, estructura ni fecha real.
- **Impacto:** pueden persistirse documentos de identidad, teléfonos, correos y fechas mal formados. La interfaz no puede ser la única barrera porque createAdmissionRequest es una acción pública y puede invocarse directamente.

### H2 - normalizeString no implementa la normalización completa exigida
- **Severidad:** Media / P2.
- **Evidencia:** normalizeString (79-82) aplica toLowerCase, NFD, elimina U+0300-U+036F y trim. No elimina caracteres especiales ni convierte secuencias de espacios internos en un único espacio.
- **Impacto:** nombres e identificadores equivalentes con puntuación o espacios repetidos pueden no coincidir. La igualdad textual de identificación en createAdmissionRequest es aún más restrictiva porque no utiliza normalizeString para el DNI almacenado.

### H3 - La búsqueda contra expedientes utiliza claves e índices incompatibles con el esquema
- **Severidad:** Alta / P1.
- **Evidencia:** getOrCreateSheet define ExpedientesEstudiantes como [ExpedienteID, PersonaID, CodigoInstitucional, FechaNacimiento, Nacionalidad, DireccionResidencia, FotografiaUrl, EstadoExpediente, FechaCreacion, FechaActualizacion, Observaciones]. findDuplicateStudents (10107-10195) busca el usuario comparando Usuarios[0] con ExpedientesEstudiantes[1], aunque el segundo campo es PersonaID. convertAdmissionToStudent (2156-2380) genera targetPersonaId y targetUserId por separado y escribe targetPersonaId en ExpedientesEstudiantes[1]. La comparación de fecha de nacimiento usa e[7], que es EstadoExpediente, no e[3].
- **Impacto:** los expedientes existentes pueden no asociarse a un usuario y la coincidencia alta por nombre/fecha de nacimiento no funciona de forma fiable; no se puede acreditar la detección contra estudiantes ya matriculados.

### H4 - La clasificación media y el bloqueo de identificación exacta no siguen los criterios de la tarea
- **Severidad:** Alta / P1.
- **Evidencia:** findDuplicateStudents marca coincidencia media si coincide email O teléfono; no exige email y teléfono conjuntamente ni nombres similares. El teléfono usa normPhone.endsWith(rPhone.slice(-8)), lo que permite coincidencias parciales y asimétricas. createAdmissionRequest (984-1100) bloquea solo una solicitud activa del mismo año, compara DNI con igualdad textual y no busca ExpedientesEstudiantes ni reutiliza la detección del endpoint.
- **Impacto:** se producen falsos positivos por datos de contacto compartidos y falsos negativos por diferencias de formato, año lectivo o existencia previa de un expediente. El bloqueo exacto solicitado no cubre ambos repositorios de personas.

### H5 - La conversión puede vincular automáticamente una solicitud a un expediente sin revisión manual y la resolución acepta destinos no verificados
- **Severidad:** Alta / P1.
- **Evidencia:** `convertAdmissionToStudent` (2156-2380) busca `dupExp` comparando PersonaID generado o si `ExpedientesEstudiantes[10]` (Observaciones) contiene la identificación entrante mediante `includes()`; si encuentra una fila, asigna `finalExpId = dupExp[0]` y continúa la conversión. No exige una resolución previa de Secretaría ni una relación estructurada de identidad. En `resolveAdmissionDuplicate` (10218-10281), la opción `VincularExistente` solo comprueba que `expedienteDestinoId` no esté vacío; no consulta que exista, esté activo ni corresponda al candidato que Secretaría revisó.
- **Impacto:** una coincidencia parcial en texto libre puede vincular una solicitud a un expediente incorrecto. Además, el endpoint permite registrar un destino arbitrario sin validación referencial. La revisión manual del panel puede eludirse durante la conversión.

### H6 - La respuesta pública de duplicidad revela la existencia e ID de otra solicitud y el panel inserta datos no confiables como HTML
- **Severidad:** Alta / P1.
- **Evidencia:** `PUBLIC_ACTIONS` (265) incluye `createAdmissionRequest`; al detectar una solicitud previa, el error devuelve `duplicate[0]` (ID de seguimiento del registro existente) y el nombre recibido en el payload actual. No devuelve el nombre de la fila duplicada, pero confirma públicamente que existe una solicitud y revela su identificador. `findDuplicateStudents` retorna también email íntegro en `candidates`, aunque el panel no lo necesita; ese endpoint sí está sujeto a RBAC. En `js/secretary.js` (1228-1355) se interpolan `c.nombreCompleto`, `c.codigoInstitucional/id`, `c.identificacion`, `c.coincidencia` y nombres del aspirante directamente en `innerHTML`, sin escape contextual. Esos valores proceden de solicitudes almacenadas y pueden ser controlados desde el formulario público.
- **Impacto:** la acción pública permite enumerar la existencia de una solicitud y su ID. La interpolación no escapada crea un sink de XSS almacenado en el dashboard privilegiado si un aspirante introduce marcado/JavaScript. No se ejecutó una prueba dinámica de explotación; el hallazgo se basa en el flujo fuente-sink estático. El email completo en la respuesta administrativa constituye exposición innecesaria de PII y debe minimizarse, pero no se afirma que ese endpoint sea público.

### H7 - Los permisos visibles no coinciden con la matriz estática y el actor de resolución no se deriva de claims verificados
- **Severidad:** Alta / P1.
- **Evidencia:** `dashboard-secretaria.html` permite entrar a roles Secretaría, Secretaria, Director, Administrador y Desarrollador. En `ROLE_PERMISSIONS`, el rol `Secretaria` incluye `findDuplicateStudents` pero no `resolveAdmissionDuplicate`; `Secretaría` sí incluye ambas; `Desarrollador` no tiene permisos estáticos para estas acciones. El backend puede aplicar una matriz dinámica antes de la estática (`getDynamicPermissionsForRole`), pero su configuración productiva no fue consultada; por ello la discrepancia estática es comprobada y el permiso efectivo de esos roles queda pendiente de prueba. `validateRolePermission` (524-583) agrega `_verifiedUserId` y `_verifiedRole`, pero `resolveAdmissionDuplicate` (10218-10281) lee `authUserId/authRole` del payload. La UI no envía esos campos; el flujo normal termina registrando un actor genérico, mientras un llamante directo podría falsificarlos.
- **Impacto:** la UI puede mostrar acciones que la matriz estática no autoriza y el registro de decisión no acredita al usuario autenticado. La autorización dinámica debe verificarse antes de afirmar qué rol concreto es rechazado en producción.

### H8 - La bitácora de resolución usa un esquema incompatible y no garantiza el registro
- **Severidad:** Alta / P1.
- **Evidencia:** `recordEntityChangeLog` en ACADEMIC (1568-1595) usa nueve columnas: HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable y CorrelationID. `resolveAdmissionDuplicate` escribe directamente ocho valores en un orden distinto: ID, tipo, solicitud, acción, resolución, actor, fecha y motivo. La fila no se ajusta al contrato del escritor/lector canónico. Además, el append se envuelve en `catch (_){ }`; `logStructuredEvent` también captura y silencia fallos.
- **Impacto:** los lectores no pueden interpretar consistentemente el evento y el endpoint puede devolver `success` aunque la evidencia durable falle. Se amplía AUD-NG-224/TASK-504; no se crea un hallazgo global duplicado.

### H9 - No existe un flujo verificable para corregir datos de una solicitud conservando su versión original
- **Severidad:** Media / P2.
- **Evidencia:** no se encontró función/acción updateAdmissionRequest, editAdmissionRequest o equivalente en el dispatcher ni en js/secretary.js. updateAdmissionStatus solo cambia estado/observaciones; resolveAdmissionDuplicate solo cambia estado, observaciones o ExpedienteID. No se encontró registro de valor anterior/nuevo para correcciones de nombres, identificación, nacimiento o contacto.
- **Impacto:** el requisito de trazabilidad de correcciones no puede darse por satisfecho; tampoco hay un mecanismo funcional para revisar quién corrigió un dato y cuál era su valor previo.

### H10 - La prueba interna de duplicados usa un contrato incompatible y no hay cobertura conductual F5-017
- **Severidad:** Alta / P1.
- **Evidencia:** el caso `TC-04-DUPLICATE_SEARCH_INTEGRITY` (aprox. línea 4008 de Code.gs) invoca `findDuplicateStudents` con `{nombre, dni}` y espera `dupRes.coincidencias`. El handler recibe `nombres, apellidos, identificacion` y retorna `candidates`; el caso no valida el contrato real y fallaría si se ejecuta. `tests/regression/academic-grading-suite.js` y `modular-dashboard-suite.js` no contienen F5-017 ni referencias a los endpoints/panel de duplicados. No se encontró suite dedicada de admisiones.
- **Impacto:** la prueba declarada no demuestra la detección y no hay regresión reproducible para formatos, coincidencias, privacidad, roles, resolución, auditoría ni conversión.

### H11 - La resolución carece de exclusión mutua e idempotencia propia
- **Severidad:** Alta / P1.
- **Evidencia:** `resolveAdmissionDuplicate` lee la hoja, localiza una fila y escribe estado, ExpedienteID, observaciones y bitácora en operaciones separadas sin adquirir `LockService` ni comprobar una clave de idempotencia. La llamada desde `js/secretary.js` no envía `idempotencyToken`/`idempotencyKey`; el control global de idempotencia de `doPost` no se activa sin token.
- **Impacto:** dos resoluciones concurrentes pueden leer el mismo estado y sobrescribir decisiones/destinos, o dejar estado y bitácora discordantes tras un fallo parcial. La verificación dinámica de concurrencia no fue ejecutada.

## 5. Reconciliación de hallazgos y dependencias

- **AUD-NG-224 / TASK-504:** ya cubren el esquema canónico de `HistorialCambiosEntidad`, escritores ad hoc, actor/correlationId verificados, integridad y manejo explícito de fallos. Ampliar con la resolución de duplicados y su falso éxito ante fallo de bitácora; no crear otro ID global para el mismo defecto.
- **AUD-NG-145:** conserva la sanitización de PII/bitácoras. Coordinar la minimización de `candidates` y la salida segura de datos de admisión; no duplicar el alcance transversal de registros.
- **AUD-NG-161:** conserva pruebas conductuales reales de concurrencia/idempotencia. Ampliar sus escenarios cuando se corrija la resolución sin lock/idempotencia; la cobertura funcional específica F5-017 queda en F5-017-A07.
- **TASK-113:** aborda duplicados en importaciones de datos de Fase 35; no sustituye la detección de aspirantes ni se modifica.
- **Tareas locales nuevas:** F5-017-A01..A07, definidas al final de este informe. No se crean IDs globales duplicados.

## 6. Pruebas y límites de verificación

**Ejecutado:** inspección manual de los nueve requisitos y cinco criterios; revisión de `normalizeString`, `createAdmissionRequest`, `findDuplicateStudents`, `resolveAdmissionDuplicate`, `convertAdmissionToStudent`, esquema de `ExpedientesEstudiantes`, RBAC estático, precedencia de permisos dinámicos, dispatcher, escritura de `HistorialCambiosEntidad`, panel y llamadas de UI; contraste de `ChangesLogs.txt`; inspección de TC-04 y de ambas suites; búsqueda del árbol/historial del informe en C1.212/C1.213; recuperación íntegra del blob Pendientes.md; revisión de dependencias AUD-NG-145, AUD-NG-224/TASK-504 y AUD-NG-161. Los SHA del código auditado coinciden con el árbol C1.212.

**No ejecutado:** Apps Script runtime, HTTP, Google Sheets productivo, matriz dinámica de permisos productiva, navegador/XSS, pruebas por rol, concurrencia, formularios en vivo y suites automatizadas. No se afirma que los criterios dinámicos hayan pasado ni que el XSS haya sido explotado.

## 7. Dictamen

**TAREA-F5-017: NO CUMPLE.** La implementación contiene una base parcial (consulta de coincidencias, panel de Secretaría y opciones manuales), pero falla validación de formato, normalización completa, join contra expedientes, niveles de coincidencia, bloqueo de DNI en ambos repositorios, control de vinculación manual, privacidad de la respuesta pública, salida segura del panel, consistencia de permisos, atribución verificable, persistencia de bitácora, corrección trazable y resolución concurrente. La marca [X] en `completadas.md` permanece como dato administrativo, no como aprobación técnica.

## 8. Tareas ejecutables derivadas de los hallazgos

> Todas las tareas siguientes son locales a esta auditoría. AUD-NG-224/TASK-504, AUD-NG-145 y AUD-NG-161 se amplían por referencia; no se crean IDs globales duplicados.

### F5-017-A01 - Validación de formato y normalización canónica de aspirantes
- **Hallazgo de origen:** H1 y H2.
- **Severidad:** Alta / P1 para validación; Media / P2 para normalización.
- **Objetivo:** impedir que datos de identidad, contacto y nacimiento mal formados ingresen al sistema y garantizar comparaciones consistentes.
- **Acción concreta:** definir validadores de servidor para DNI/identidad y pasaporte según tipo/país, teléfono, email y fecha de nacimiento; distinguir campos obligatorios y opcionales; rechazar fechas imposibles/futuras y formatos fuera de regla. Ampliar normalización para quitar diacríticos, normalizar puntuación/caracteres permitidos y colapsar espacios internos, manteniendo reglas específicas para identificadores y correos.
- **Archivos/módulos:** backend/academic-service/Code.gs (normalizeString, createAdmissionRequest, findDuplicateStudents); formularios de admisión que consumen createAdmissionRequest.
- **Dependencias/riesgos:** compatibilidad con datos históricos y formatos válidos de Honduras/otros mercados; no alterar identificadores institucionales ni borrar caracteres significativos sin reglas por tipo.
- **Alcance:** validación de solicitudes de admisión y normalización usada por detección de duplicados.
- **Criterios de aceptación:** el servidor rechaza DNI/pasaporte/teléfono/email/fecha inválidos; valida de igual forma llamadas directas y formulario; los casos con acentos, puntuación permitida y espacios redundantes se normalizan de forma determinista; los datos históricos no se reescriben silenciosamente.
- **Prioridad:** P1 (validadores) / P2 (normalización).
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas unitarias por formato/tipo, casos límite y comparación de valores normalizados, más revisión del diff.

### F5-017-A02 - Corregir detección de duplicados y bloqueo de identificación exacta
- **Hallazgo de origen:** H3 y H4.
- **Severidad:** Alta / P1.
- **Objetivo:** comparar correctamente solicitudes activas y expedientes existentes, con los niveles exacto/alto/medio especificados.
- **Acción concreta:** corregir la relación PersonaID-Usuario mediante la clave institucional real; leer FechaNacimiento desde la columna correcta; aplicar normalización coherente; definir coincidencia exacta por identificación normalizada y bloquear antes de persistir contra SolicitudesAdmision y ExpedientesEstudiantes; clasificar alta por nombres/apellidos y fecha de nacimiento; clasificar media solo cuando email y teléfono coincidan y los nombres sean similares; documentar estados que se excluyen y alcance temporal del bloqueo.
- **Archivos/módulos:** backend/academic-service/Code.gs (findDuplicateStudents, createAdmissionRequest, esquema ExpedientesEstudiantes/Usuarios).
- **Dependencias/riesgos:** integridad de PersonaID/UserId y registros antiguos; LockService/idempotencia; falsos positivos por datos familiares compartidos y falsos negativos por diferencias de formato.
- **Alcance:** detección previa al alta y consulta de coincidencias del panel, sin fusionar registros.
- **Criterios de aceptación:** identificación existente en expediente o solicitud activa se detecta y bloquea en servidor; coincidencia alta usa nombre completo y fecha correcta; coincidencia media exige email, teléfono y similitud de nombres; cada clase devuelve un motivo y nivel coherentes; la detección no depende de observaciones libres.
- **Prioridad:** P1 (bloqueo y join de expedientes).
- **Estado:** Pendiente.
- **Evidencia de cierre:** fixtures aislados de solicitudes/expedientes con claves distintas PersonaID/UserId y matriz de coincidencias exactas/altas/medias, incluida concurrencia de alta.

### F5-017-A03 - Exigir revisión manual antes de vincular o reutilizar un expediente
- **Hallazgo de origen:** H5 y H11.
- **Severidad:** Alta / P1.
- **Objetivo:** impedir que una conversión cree o vincule relaciones de identidad basadas en coincidencias heurísticas sin autorización explícita.
- **Acción concreta:** retirar la vinculación automática basada en includes() sobre Observaciones; exigir resolución previa y persistida de Secretaría para AprobarNuevo/VincularExistente/RechazarDuplicado; validar que el expediente destino exista, esté habilitado y corresponda al candidato revisado; serializar la decisión con LockService o control de versión; hacer idempotente la operación; registrar la decisión antes de convertir.
- **Archivos/módulos:** backend/academic-service/Code.gs (convertAdmissionToStudent, resolveAdmissionDuplicate); js/secretary.js; dashboard-secretaria.html.
- **Dependencias/riesgos:** máquina de estados de admisión, conversión, matrículas y relaciones familiares; una corrección debe preservar la idempotencia sin reusar expedientes por coincidencias de texto.
- **Alcance:** vínculo entre solicitud y expediente durante revisión y conversión; no sustituye el procedimiento general F6 de fusión de expedientes.
- **Criterios de aceptación:** ninguna conversión enlaza automáticamente por texto en Observaciones; una vinculación requiere resolución de usuario autorizado y expediente existente; la conversión rechaza solicitud sin decisión de duplicidad cuando se detectó candidato exacto/alto; los reintentos no duplican ni cambian el destino.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de conversión con candidato/no candidato, destino inexistente, resolución ausente, rechazo, vinculación autorizada y reintento.

### F5-017-A04 - Cerrar exposición de datos y alinear permisos/renderizado del panel
- **Hallazgo de origen:** H6 y H7.
- **Severidad:** Alta / P1.
- **Objetivo:** limitar la información de duplicidad al mínimo necesario y hacer que la interfaz y el backend compartan la misma política de acceso.
- **Acción concreta:** reemplazar el error público de duplicidad por una respuesta genérica sin ID/nombre de terceros; minimizar o enmascarar email y otros PII en candidates; añadir autorización contextual según rol/función; alinear permisos de Secretaría/Secretaria/Director/Administrador/Desarrollador con los botones realmente disponibles; renderizar valores de aspirantes con textContent/escape contextual y no interpolarlos como HTML.
- **Archivos/módulos:** backend/academic-service/Code.gs (PUBLIC_ACTIONS, ROLE_PERMISSIONS, createAdmissionRequest, findDuplicateStudents); dashboard-secretaria.html; js/secretary.js.
- **Dependencias/riesgos:** AUD-NG-145 (PII/logs), F5-007-A05 y F5-012 H8 (salida segura); evitar bloquear a roles institucionales legítimos y evitar revelar si un tercero existe.
- **Alcance:** respuestas y UI de detección/resolución de duplicados; no reabrir todo el modelo RBAC.
- **Criterios de aceptación:** acción pública no revela nombre, DNI ni ID previo; respuestas administrativas solo incluyen campos imprescindibles y autorizados; todos los roles visibles pueden ejecutar las acciones permitidas y los no autorizados reciben rechazo; payload con HTML/JS se muestra como texto inerte; pruebas por rol y XSS almacenado pasan.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas HTTP de enumeración, matriz de roles y prueba de navegador con valores sintéticos maliciosos.

### F5-017-A05 - Registrar la resolución con actor verificado y bitácora interoperable
- **Hallazgo de origen:** H7 y H8.
- **Severidad:** Alta / P1.
- **Objetivo:** garantizar que la decisión de Secretaría sea atribuible al usuario autenticado y recuperable por todos los lectores de auditoría.
- **Acción concreta:** usar exclusivamente _verifiedUserId/_verifiedRole (o el contrato canónico de AUD-NG-224) en lugar de authUserId/authRole del payload; sustituir el appendRow ad hoc de ocho columnas por el escritor canónico; propagar correlationId; no devolver success si la decisión se persiste pero el registro de auditoría falla, o implementar una transacción/outbox recuperable; registrar valores previos/nuevos y destino de vínculo.
- **Archivos/módulos:** backend/academic-service/Code.gs (resolveAdmissionDuplicate, recordEntityChangeLog); js/secretary.js (consulta de bitácora).
- **Dependencias/riesgos:** ampliar AUD-NG-224/TASK-504 y AUD-NG-145; preservar compatibilidad/migración de filas históricas y evitar doble escritura.
- **Alcance:** evento de resolución de duplicidad; la unificación transversal de la hoja permanece en TASK-504.
- **Criterios de aceptación:** actor/rol provienen de claims verificados; cada decisión tiene fecha, solicitud, resolución, valores anterior/nuevo, destino y correlationId; todos los lectores muestran la misma fila; un fallo de auditoría no se presenta como registro plenamente exitoso; reintentos no duplican eventos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** prueba de falsificación de authUserId, prueba de esquema con lectores USER/ACADEMIC y simulación de fallo de escritura.

### F5-017-A06 - Incorporar corrección controlada de datos con historial de valores
- **Hallazgo de origen:** H9.
- **Severidad:** Media / P2.
- **Objetivo:** permitir correcciones legítimas de la solicitud sin perder la información original ni la identidad de quien las autorizó.
- **Acción concreta:** definir campos corregibles, permisos, justificación y estados permitidos; implementar operación de actualización con validación server-side y registro de valor anterior/nuevo mediante el historial canónico; reflejar el cambio y su motivo en la vista de Secretaría.
- **Archivos/módulos:** backend/academic-service/Code.gs (nuevo contrato de corrección de solicitud); js/secretary.js; dashboard-secretaria.html; integración con HistorialCambiosEntidad.
- **Dependencias/riesgos:** AUD-NG-224/TASK-504 y AUD-NG-145; no permitir que una corrección altere silenciosamente una identidad ya vinculada o una solicitud convertida.
- **Alcance:** corrección de datos de SolicitudesAdmision; no sustituye updateAdmissionStatus ni edición general de ExpedientesEstudiantes.
- **Criterios de aceptación:** solo roles autorizados corrigen; el servidor valida cada campo; cada cambio conserva valor anterior/nuevo, actor verificado, fecha, motivo y correlación; se bloquean cambios incompatibles con estado Convertida o vínculo cerrado; la UI permite revisar el historial.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de permisos, validación, transición de estados, historial y preservación de valores previos.

### F5-017-A07 - Crear pruebas conductuales de admisión y reparar TC-04
- **Hallazgo de origen:** H1-H11.
- **Severidad:** Alta / P1.
- **Objetivo:** demostrar la detección, privacidad, resolución manual, atribución y conversión mediante pruebas repetibles y aisladas.
- **Acción concreta:** corregir TC-04 para usar nombres/apellidos/identificacion y candidates; sustituir cualquier dependencia de hojas productivas por fixtures aislados; incorporar pruebas de formato, normalización, coincidencia exacta/alta/media, expediente PersonaID/UserId, bloqueo de duplicados, privacidad, roles, resolución, conversión, auditoría y XSS; integrar la suite al flujo de regresión institucional.
- **Archivos/módulos:** backend/academic-service/Code.gs (TC-04 y suite correspondiente); tests/regression/academic-grading-suite.js; tests/regression/ o suite dedicada de admisiones.
- **Dependencias/riesgos:** ampliar AUD-NG-161; evitar mutaciones de datos productivos y falsos PASS por presencia de funciones.
- **Alcance:** cobertura de TAREA-F5-017; no crear un framework general paralelo.
- **Criterios de aceptación:** TC-04 ejecuta el contrato real y pasa con datos sintéticos; cada regla tiene casos positivos/negativos; los casos de permisos y auditoría verifican el actor y la fila; ambas suites o la suite dedicada ejecutan las pruebas en CI/regresión; ningún caso se declara aprobado si no se ejecutó.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** salida íntegra de la suite, resultados por caso y revisión de fixtures/aislamiento.

