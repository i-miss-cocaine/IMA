# AUDITORÍA TÉCNICA - TAREA-F5-017: detección de duplicados, validación y calidad de datos de aspirantes

- Repositorio: i-miss-cocaine/IMA
- Rama auditada: NG_beta_0.0.0.1_work
- Último checkpoint designado expresamente por el usuario: C1.210 (HEAD 8ab2fdf7e1825f04a977ff9ac93f52bcb41ae641; árbol 15b91e7c081d502a237db4def3ec9b8572ea5553).
- Checkpoint de inicio de esta iteración: C1.212.
- HEAD real de la rama al iniciar: d72e39580df79369b45b418a4773eda25fc36679; árbol 1e5c70b8fb865aed7592fb3f0ca4298d7453ff91.
- Rama base protegida: NG_beta_0.0.0.1.
- HEAD de rama base: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Comparación de ramas al inicio: 280 commits adelante y 0 detrás.
- Checkpoint de cierre: C1.213.
- Sesión operativa: IMA-AUDIT-20261107-1725Z (identificador operativo de auditoría, no ID nativo de ChatGPT).
- Fecha: 2026-11-07.
- Dictamen técnico: **NO CUMPLE**.

## 1. Búsqueda documental, fuente y continuidad

Se consultó el árbol recursivo completo de NG_beta_0.0.0.1_work (979 entradas, no truncado). La ruta AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md no existe. La consulta del historial de commits de esa ruta devolvió una lista vacía. En consecuencia, la auditoría se realizó desde cero y este informe se crea por primera vez.

**Fuente de requisitos:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2355-2379. TAREA-F5-017 contiene nueve requisitos y cinco criterios de aceptación, todos marcados [x], con estado administrativo [X] Completada. Esa marca se conserva como registro histórico y no se considera evidencia de cumplimiento técnico.

**Origen citado por la tarea:** Auditoria.txt (HALLAZGOS F5: HALLAZGOS-F5-P0-01) y AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md (Subcapacidades 5.1 y 5.6, Brecha P0-01). El identificador HALLAZGOS-F5-P0-01 no está registrado como hallazgo individual en la bitácora vigente; la mención recuperada en la auditoría previa F5-012 indica que no se localizó. El informe de fase citado tampoco aparece en el árbol de la rama. La procedencia original no puede verificarse con los documentos actuales.

**ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1906-1914. Declara la extensión de findDuplicateStudents, clasificación exacta/alta/media, enmascaramiento de DNI, creación de resolveAdmissionDuplicate, registro en HistorialCambiosEntidad y panel de Secretaría. Estas declaraciones se contrastaron contra los handlers, esquema, permisos, interfaz y pruebas actuales. El registro menciona renderAdmissionDuplicatesSection, pero no se encontró una función con ese nombre en js/secretary.js; el renderizado está incorporado dentro de checkAdmissionDuplicates.

**Pendientes.md:** la lectura convencional de la ruta devuelve 0 caracteres. Se recuperó el blob histórico SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, con 1.782.094 caracteres, 20.182 líneas y sin U+FFFD. No contiene una entrada directa F5-017, findDuplicateStudents ni resolveAdmissionDuplicate. Se encontraron AUD-NG-145 (bitácoras y PII) y AUD-NG-224/TASK-504 (esquema, actor verificado, escritores ad hoc y errores de persistencia), todos como trabajo pendiente y directamente relacionados con partes de esta auditoría. TASK-113 aborda duplicados en importaciones de datos de otra fase y otro flujo; no sustituye la detección de aspirantes y no se duplica.

**Continuidad de rama:** se verificaron NG_beta_0.0.0.1_work en d72e39580df79369b45b418a4773eda25fc36679 y NG_beta_0.0.0.1 en 44d9891132332e692dbe2ba8602b41f50a508a59. La rama de trabajo está 280 commits adelante y 0 detrás. C1.210 sigue siendo el último checkpoint que el usuario designó expresamente como referencia válida. El commit C1.211 no se adopta como checkpoint de referencia; C1.212 es el HEAD publicado de partida de esta iteración. No se realizó reset, force-push ni modificación de la rama base.

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
| AUDITORIAS/Auditoria.txt | c0799cd63cdf5dae5d2ac3bc688fcabda4c421c8 | Antecedentes F5-012 y C1.212; no existe una entrada de auditoría individual F5-017 ni el hallazgo de origen citado. |
| AUDITORIAS/MapaDependencias.md | f986dc3c1509c0f1a6a479fdd5cb753c2ae1a49e | Registro de ACADEMIC/HistorialCambiosEntidad y AUD-NG-224/TASK-504; antecedentes de admisiones y trazabilidad. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 455b40679eb587d21cfee71a814395eaa8ce4940 | Continuidad hasta C1.212. |
| AUDITORIAS/Contexto_personal.txt | e9cd043ea18cd24cb99db34095532d8d4be7b240 | Reglas de inicio/cierre y checkpoints C1.211/C1.212. |
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

### H5 - La conversión puede vincular automáticamente una solicitud a un expediente sin revisión manual
- **Severidad:** Alta / P1.
- **Evidencia:** convertAdmissionToStudent (aprox. 2240-2255) busca dupExp comparando PersonaID generado o si Observaciones (índice 10) contiene la identificación entrante; si encuentra una fila, asigna finalExpId = dupExp[0] y continúa con la conversión. No exige una resolución previa de Secretaría ni verifica una relación estructurada de identidad.
- **Impacto:** un texto coincidente dentro de observaciones puede provocar una vinculación automática. La revisión manual que ofrece resolveAdmissionDuplicate puede eludirse por el flujo de conversión.

### H6 - La respuesta pública de duplicidad revela datos de una solicitud y el panel inserta valores no confiables como HTML
- **Severidad:** Alta / P1.
- **Evidencia:** PUBLIC_ACTIONS (265) incluye createAdmissionRequest; al detectar una solicitud existente, createAdmissionRequest devuelve un error con duplicate[0] y el nombre completo recibido en el payload (no lo recupera de la fila duplicada); aun así confirma la existencia y revela el ID de un tercero. El endpoint findDuplicateStudents retorna email completo en los objetos candidates (10107-10195), aunque secretary.js no lo necesita para renderizar. secretary.js (1242-1315) interpola nombreCompleto, codigoInstitucional/id, identificacion y coincidencia directamente en innerHTML. Los nombres y observaciones proceden de datos almacenados y pueden contener contenido no confiable.
- **Impacto:** enumeración de existencia/identificador y nombre de aspirantes a través de una acción pública; exposición innecesaria de correo al cliente administrativo y riesgo de XSS almacenado en el panel si un campo persistido contiene marcado/JavaScript. No se ejecutó una prueba XSS dinámica.

### H7 - Los permisos visibles no coinciden con los permisos efectivos del servidor y el actor de resolución es manipulable
- **Severidad:** Alta / P1.
- **Evidencia:** dashboard-secretaria.html permite los roles Secretaría, Secretaria, Director, Administrador y Desarrollador. ROLE_PERMISSIONS permite findDuplicateStudents a Secretaria, pero no resolveAdmissionDuplicate; Desarrollador no tiene permiso estático para ninguno de los dos. El servidor sí añade _verifiedUserId y _verifiedRole durante validateRolePermission (524-583), pero resolveAdmissionDuplicate (10218-10281) lee authUserId/authRole del payload. El flujo UI no envía esos campos, por lo que la auditoría usa el fallback genérico; un llamante directo puede falsificarlos.
- **Impacto:** el panel puede ofrecer acciones que el backend rechazará para determinados roles y la identidad registrada no acredita al actor real que tomó la decisión.

### H8 - La bitácora de resolución usa un esquema incompatible y no garantiza el registro
- **Severidad:** Alta / P1.
- **Evidencia:** recordEntityChangeLog en ACADEMIC (1568-1595) usa nueve columnas: HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable y CorrelationID. resolveAdmissionDuplicate (10218-10281) escribe directamente ocho valores con otro orden y captura cualquier error con catch vacío. logStructuredEvent también suprime errores de escritura. El MapaDependencias ya documenta este escritor directo y la incompatibilidad bajo AUD-NG-224/TASK-504.
- **Impacto:** el evento no es interpretable por los lectores de historial existentes y el endpoint puede retornar success aunque el registro durable falle. No se crea un hallazgo global duplicado: ampliar AUD-NG-224/TASK-504 y coordinar AUD-NG-145.

### H9 - No existe un flujo verificable para corregir datos de una solicitud conservando su versión original
- **Severidad:** Media / P2.
- **Evidencia:** no se encontró función/acción updateAdmissionRequest, editAdmissionRequest o equivalente en el dispatcher ni en js/secretary.js. updateAdmissionStatus solo cambia estado/observaciones; resolveAdmissionDuplicate solo cambia estado, observaciones o ExpedienteID. No se encontró registro de valor anterior/nuevo para correcciones de nombres, identificación, nacimiento o contacto.
- **Impacto:** el requisito de trazabilidad de correcciones no puede darse por satisfecho; tampoco hay un mecanismo funcional para revisar quién corrigió un dato y cuál era su valor previo.

### H10 - La prueba interna de duplicados usa un contrato incompatible y no hay cobertura conductual F5-017
- **Severidad:** Alta / P1.
- **Evidencia:** el caso TC-04-DUPLICATE_SEARCH_INTEGRITY (aprox. línea 4008 de Code.gs) invoca findDuplicateStudents con {nombre, dni} y espera dupRes.coincidencias. El handler recibe nombres, apellidos e identificacion y retorna candidates; el caso no valida el contrato real y fallaría si se ejecuta. tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen F5-017 ni pruebas de los endpoints o panel. No se encontró una suite dedicada de admisiones.
- **Impacto:** la prueba declarada no demuestra la detección; no existen casos reproducibles para formatos, coincidencias exactas/altas/medias, privacidad, permisos, resolución manual, auditoría ni regresión de conversión.

## 5. Reconciliación de hallazgos y dependencias

- **AUD-NG-224 / TASK-504:** ya cubren la unificación de HistorialCambiosEntidad, el orden de columnas, los escritores ad hoc de ocho columnas, el actor/correlationId verificados, la integridad y el manejo explícito de fallos. Ampliar el caso concreto de resolveAdmissionDuplicate y su falso éxito ante fallo de bitácora; no crear otro AUD-NG/TASK para el mismo esquema.
- **AUD-NG-145:** conserva sanitización de PII y bitácoras estructuradas. Coordinar la reducción de datos sensibles de candidates y la consistencia de actor/rol; no duplicar el alcance transversal de logs.
- **AUD-NG-161:** conserva la brecha transversal de pruebas de regresión; ampliar la cobertura con casos de admisión y duplicidad, sin crear un framework global duplicado.
- **F5-007-A05:** coordinar el renderizado seguro de datos del panel de Secretaría, ya que su alcance cubre salida segura de vistas de admisión. La nueva subtarea local se limita al panel de duplicados.
- **F5-012 H8 / controles de UI:** conservar el hallazgo previo de interpolación de datos personales en vistas familiares; el panel de duplicados es un sink adicional y debe corregirse con la misma política de salida segura.
- **TASK-113:** trata detección de duplicados en importaciones de datos de Fase 35; no sustituye el matching de aspirantes ni se modifica.
- No se crean IDs globales nuevos ni se duplican AUD-NG-224, TASK-504, AUD-NG-145 o AUD-NG-161.

## 6. Pruebas y límites de verificación

**Ejecutado:** inspección estática/manual de los nueve requisitos y cinco criterios; lectura de los handlers, campos y esquemas, roles, dispatcher, conversión, UI y panel; inspección del caso TC-04; revisión de las dos suites de regresión; búsqueda de árbol e historial del informe; comparación de rama de trabajo/base; lectura íntegra del blob Pendientes.md; revisión de bitácora, mapa, plan, metodología y contexto.

**No ejecutado:** Apps Script runtime; llamadas HTTP; lectura/escritura de Google Sheets productivo; pruebas con registros reales o sintéticos aislados; concurrencia; navegador; prueba XSS; sesión con cada rol; validación de formularios en vivo; suites automatizadas; auditoría de ACL productiva. No se afirma que los criterios dinámicos hayan pasado.

## 7. Dictamen

**TAREA-F5-017: NO CUMPLE.** La implementación contiene una base útil (búsqueda de coincidencias, clasificación parcial, panel de Secretaría y opciones de resolución manual), pero no garantiza validación de formato, comparación correcta contra expedientes existentes, clasificación media conforme a la especificación, bloqueo completo de DNI duplicado, prohibición de vinculación automática, privacidad, permisos consistentes, atribución verificable ni trazabilidad de correcciones. La marca [X] en completadas.md se conserva sin modificación como dato administrativo, no como aprobación técnica.

---

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
- **Hallazgo de origen:** H5.
- **Severidad:** Alta / P1.
- **Objetivo:** impedir que una conversión cree o vincule relaciones de identidad basadas en coincidencias heurísticas sin autorización explícita.
- **Acción concreta:** retirar la vinculación automática basada en includes() sobre Observaciones; exigir resolución previa y persistida de Secretaría para AprobarNuevo/VincularExistente/RechazarDuplicado; validar que el expediente destino exista, esté habilitado y corresponda al candidato revisado; impedir doble resolución y cambios concurrentes; registrar la decisión antes de convertir.
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
- **Hallazgo de origen:** H1-H8 y H10.
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

