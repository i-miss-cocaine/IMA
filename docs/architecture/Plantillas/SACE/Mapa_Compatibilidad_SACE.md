# Mapa de compatibilidad IMA ↔ SACE (Honduras)

**Estado:** análisis de mapeo; no es una declaración de compatibilidad certificada ni una especificación de importación validada.

**Alcance:** identificar qué datos del libro consolidado de IMA pueden alimentar los archivos de calificaciones que SACE genera para el docente y qué datos/artefactos faltan para una integración verificable.

## 1. Fuentes oficiales consultadas

1. **Manual de Usuario Docente SACE, actualización agosto de 2023.** Describe la descarga del archivo de calificaciones por modalidad, curso, sección, jornada y clase, su llenado y la carga del mismo archivo. En la página impresa 21 muestra un ejemplo de nueve columnas que incluye NIVELACIÓN y RECUPERACIÓN.  
   https://www.se.gob.hn/media/files/usinieh/documentos/Manual_de_usuario_SACE_Docente.pdf
2. **Manual de Usuario Docente SACE, actualización marzo de 2022.** La versión alojada en el portal SACE también muestra un ejemplo de dos parciales, NIVELACIÓN y RECUPERACIÓN en nueve columnas; su página impresa 22 no sustituye la plantilla que SACE genera actualmente para una clase/periodo.  
   https://sace.se.gob.hn/media/documentos_sace/Manual_de___usuario_SACE_Docente.pdf
3. **Manual de Usuario Director SACE.** Describe documentos distintos: calificaciones por parcial, resumen anual de calificaciones por área, acta final, acta final de recuperación, boleta interna, boleta externa y certificación. No son formatos intercambiables.  
   https://sace.se.gob.hn/media/documentos_sace/Manual_de_usuario_SACE_Director.pdf
4. **Reglamento del Sistema Nacional de Información Educativa, Acuerdo 1178-SE-2015, La Gaceta No. 33,817, 25-08-2015.** Artículos 78 y 84 establecen la evaluación/promoción mediante SACE; artículos 86–87 remiten la evaluación final al manual emitido/actualizado por USINIEH; el artículo 88 establece que las certificaciones y calificaciones oficiales las emite la dirección del centro y no son válidas sin las firmas correspondientes y los códigos de autenticidad generados por SACE.  
   https://www.tsc.gob.hn/web/leyes/Reglamento_sistema_nacional_info_edu_hn.pdf
5. **Reglamento del Sistema Integrado de Información Educativa, Acuerdo CNE-002-2021.** Crea el SIIE como marco integrado y prevé el Registro Educativo Único, reportes y lineamientos/manuales propios. El texto consultado no menciona SACE; por ello no se presume que lo derogue ni que lo sustituya. La relación institucional SACE–SIIE debe confirmarse con la autoridad competente antes de diseñar una integración más amplia.\n   https://www.tsc.gob.hn/web/leyes/Acuerdo-Ejecutivo-CNE-002-2021.pdf\n
## 2. Flujo SACE documentado

- El docente descarga un archivo Excel generado por SACE para una clase del centro educativo, modalidad, curso/grado, sección, jornada y asignatura.
- El docente completa las celdas de notas totales e inasistencias por parcial y carga nuevamente ese mismo archivo.
- El formato, diseño y celdas generadas por SACE no deben modificarse.
- El manual docente actualizado en agosto de 2023 muestra un ejemplo de nueve columnas: A DOCUMENTO, B IDENTIDAD, C NOMBRE, D INASISTENCIAS del parcial I, E NOTA TOTAL del parcial I, F NIVELACIÓN, G INASISTENCIAS del parcial II, H NOTA TOTAL del parcial II e I RECUPERACIÓN. La versión de marzo de 2022 muestra la misma distribución.
- Esta distribución documentada no demuestra que todos los archivos generados actualmente tengan idéntico layout. IMA no debe fijar dos o cuatro parciales como regla universal: la plantilla descargada desde SACE para el centro/periodo de prueba sigue siendo la autoridad.
- El manual de Director presenta documentos y cuadros distintos, incluidos parciales 1 a 4; no deben confundirse con el archivo docente descargable.
- Las boletas, resumen anual, actas y certificaciones del perfil Director son salidas diferentes. Una tabla de notas por periodo no demuestra por sí sola equivalencia con todas esas salidas.
- Los manuales consultados documentan intercambio por archivos Excel; no documentan una API pública de integración. No se presume una API SACE.

## 3. Mapeo preliminar de datos IMA

| Campo/elemento SACE | Fuente IMA identificada | Estado y observación |
|---|---|---|
| Código del centro | No se identificó un campo SACE explícito. `OfertaAcademica.SedeID` es un ID interno. | **Falta** código oficial; no equiparar SedeID con código SACE. |
| Nombre del centro/sede | `SedesAulas.NombreSede`, relacionado por `SedeID`. | **Parcial**; confirmar que la sede corresponda al centro SACE. |
| Modalidad/carrera | `OfertaAcademica.Modalidad`. | **Disponible**; validar nomenclatura oficial y relación con carrera. |
| Curso/grado | `OfertaAcademica.Grado`, `Usuarios.Grado` y matrícula. | **Disponible**; requiere normalizar nomenclaturas oficiales. |
| Sección | `OfertaAcademica.Seccion`, `Usuarios.Seccion` y matrícula. | **Disponible**. |
| Jornada | `JornadasAcademicas` tiene catálogo y horarios; `HorariosClase` relaciona OfertaID, día y horas, pero no contiene un JornadaID explícito. | **Parcial**; no inferir jornada por horario sin regla aprobada. |
| Código de clase | `OfertaAcademica.CodigoClase`. | **Disponible**; confirmar equivalencia con el código que SACE imprime. |
| Asignatura | `CatalogoAsignaturas.NombreOficial` y `AsignaturaID`. | **Disponible**; validar nombre/código oficial SACE. |
| DOCUMENTO | No se identificó un tipo de documento SACE en el perfil del usuario. | **Falta** catálogo de tipo; no fijar HND sin validar la identidad del estudiante. |
| IDENTIDAD | `Usuarios.PersonaID` → `Personas.Identificacion`. | **Disponible si existe y está verificada**; no usar el UserId como identidad. |
| NOMBRE | `Usuarios.PersonaID` → `Personas.Nombres` + `Personas.Apellidos`. | **Disponible**. |
| Parcial/periodo | `PeriodosAcademicos` contiene PeriodoID, AnoID, Nombre, TipoPeriodo, FechaInicio, FechaFin y Orden. | **Parcial**; requiere correspondencia aprobada entre Orden/Nombre y el parcial SACE de la plantilla real. |
| NOTA TOTAL por parcial | Libro consolidado contextual y cálculo ponderado del periodo; requiere estado publicado/cerrado y cálculo completo. | **Disponible como dato calculado**; verificar escala, redondeo y regla SACE por nivel/modalidad. |
| INASISTENCIAS por parcial/clase | `SesionesAsistencia` + `RegistrosAsistencia`; las sesiones guardan fecha, grado, sección y asignatura. | **Fuente disponible**, pero falta un contrato de agregación por fechas del parcial, estudiante y clase, que excluya sesiones fuera del periodo. |
| RECUPERACIÓN | Registros de recuperación vinculados al contexto del libro. | **Parcial**; el manual consultado no especifica completamente la regla de presentación de la columna. Confirmar con plantilla y procedimiento vigente. |

## 4. Diferencia entre el informe IMA y los documentos SACE

El `libroConsolidado` de IMA presenta resultados por contexto/año/periodo/asignatura y aplica las ponderaciones y recuperaciones del libro. El archivo de carga SACE necesita además metadatos de centro, modalidad, jornada, clase, identidad del estudiante, inasistencias por parcial y una distribución de notas por los parciales que contenga la plantilla vigente.

El resumen anual por área, acta final, acta final de recuperación, boletas interna/externa y certificación requieren reglas y estructuras adicionales. No deben generarse copiando la tabla de un solo periodo.

El artículo 88 del Reglamento impide presentar un documento IMA como certificación/calificación oficial SACE: la emisión oficial corresponde a la dirección del centro y requiere firmas y códigos de autenticidad generados por SACE.

## 5. Decisión técnica

**No generar todavía un XLSX SACE desde cero ni modificar una plantilla genérica.** SACE indica que el archivo descargado debe conservar su formato y diseño. Para implementar un adaptador de archivo fiable se requiere una plantilla real descargada de SACE para un centro/clase de prueba autorizada, con datos ficticios o anonimizados.

Una vez disponible esa plantilla, el adaptador deberá:
1. conservar hojas, encabezados, estilos, celdas combinadas, fórmulas y validaciones;
2. mapear los datos IMA a las celdas de entrada exactas, sin cambiar el diseño;
3. obtener código oficial del centro, jornada y tipo de documento desde catálogos verificados;
4. calcular inasistencias por estudiante/clase y rango de fechas del parcial;
5. mapear los periodos IMA a los parciales SACE según el archivo real, sin asumir número fijo;
6. llenar únicamente notas publicadas y contextos completos; tratar recuperación según regla SACE confirmada;
7. probar la carga del archivo en un entorno SACE autorizado y comparar el resultado con el cuadro generado por SACE.

**Criterio de aceptación pendiente:** el archivo exportado conserva la estructura de la plantilla SACE original, se carga sin alterar el formato, y los datos de prueba coinciden con el libro IMA para estudiantes, clase, parcial, nota, inasistencias y recuperación. Hasta entonces el estado es *mapeo preliminar*, no compatibilidad demostrada.


## 6. Plantillas candidatas que ya existen en el repositorio

El repositorio contiene tres libros .xls en docs/architecture/Plantillas/SACE/. Su estructura se inspeccionó y se registró en MAPEO_ESTRUCTURAL_BASELINE.md y manifest.json:

- Contenedor OLE/BIFF8, una hoja visible, dimensión A1:I31 y 13 rangos combinados.
- 22 filas de estudiantes (8–29), dos parciales, inasistencias en D/F, notas en E/G y recuperación en H.
- Los tres libros comparten la misma firma estructural. Los datos de estudiantes que contienen son de muestra y no deben usarse como padrón de producción.
- El manifiesto mantiene status CANDIDATE, officialSourceVerified=false y sin fechas de vigencia. La versión repo-baseline-2026-11-19 identifica solo una revisión interna de Git; no es versión normativa SACE.

Se agregó js/sace-template.js, un parcheador de los libros BIFF8 existentes que modifica únicamente las celdas de inasistencias D/F, notas de parciales E/G y recuperación H cuando se suministran valores; conserva el contenedor OLE, tamaño del archivo, dimensión, combinaciones, fórmulas, validaciones, protección y demás celdas. Los contratos sace-template-structure-contract y sace-template-binary-patch pasan para los tres archivos candidatos.

**Límites actuales del parcheador:** inspecciona los metadatos y el padrón de la plantilla XLS (DOCUMENTO, IDENTIDAD y NOMBRE), empareja una lista fuente suministrada por identidad, nombre normalizado y tipo documental obligatorio respetando el orden de la plantilla, y ofrece prepareCandidateExport para componer inspección, emparejamiento y parcheo binario en un flujo candidato sin activar UI ni exportación de producción. Todavía no obtiene esa lista desde el backend académico ni calcula inasistencias desde SesionesAsistencia/RegistrosAsistencia; tampoco resuelve código SACE del centro/jornada, mapeo de PeriodoID a parciales o regla oficial de recuperación, ni está conectado a la consulta del libro consolidado o a la UI de exportación. Tampoco se ha cargado ninguno de los tres libros en SACE para confirmar procedencia, vigencia o aceptación.

Por tanto, el resultado automatizado demuestra que se puede parchear sin reconstruir ni alterar la estructura de esos tres archivos candidatos; **no demuestra que sean plantillas oficiales vigentes ni que un archivo resultante sea aceptado por SACE**. BETA-EXAM-106 sigue siendo obligatorio.


## Verificación de fuente oficial SACE — 2026-11-19
La página oficial de descargas de SACE (https://sace.se.gob.hn/descargas/descargar/archivos) publica el recurso Manual Usuario de Docente SACE. El PDF enlazado desde esa página es https://sace.se.gob.hn/media/documentos_sace/Manual_de___usuario_SACE_Docente_2.pdf. La página 4 del PDF registra la actualización más reciente de este manual en JUNIO 2025; las secciones 4.1.1 y 4.1.2, páginas impresas 21–23, describen descargar el archivo de notas por clase y cargar el mismo archivo completado en SACE. Esta verificación confirma el flujo oficial documentado y la versión del manual publicada en el portal a la fecha de consulta; no proporciona una plantilla XLS de prueba ni acredita los tres libros de este repositorio como archivos oficiales vigentes. El manifiesto permanece CANDIDATE y officialSourceVerified=false.


## 7. Proveedor candidato de datos académicos y asistencia — C1.831

Se añadió `js/sace-data-provider.js` como módulo puro de preparación de datos, sin conexión a servicios ni UI. Su contrato recibe dos instantáneas del endpoint contextual `getGradebookData` (una por cada periodo designado), una tabla de identidad documental, sesiones de clase y registros de asistencia. Devuelve filas candidatas compatibles con el ensamblador `prepareCandidateExport`.

Condiciones que aplica:

- Los dos libros deben pertenecer al mismo año, institución, grado, sección y asignatura; cada periodo se identifica explícitamente por `PeriodoID` y rango de fechas, sin deducir el parcial SACE por el orden del catálogo.
- Los dos periodos deben estar cerrados y cada alumno debe tener resumen `calculated` con nota final numérica de 0 a 100. Los estados provisionales, pendientes, sin nota y notas fuera de rango bloquean el armado.
- Los padrones de ambos periodos deben coincidir por `UserID` y nombre. Identidad y tipo documental se exigen desde un directorio institucional suministrado por separado; no se derivan del XLS candidato ni de datos libres del cliente.
- La asistencia se vincula a sesiones por fecha de la sesión, grado, sección, `AsignaturaID` y docente autenticado. Cada alumno debe tener exactamente un registro por sesión de clase seleccionada. Faltantes, duplicados o registros de estudiantes ajenos al padrón bloquean el resultado.
- Se cuentan los estados explícitos AUSENTE/AUSENCIA/FALTA/INASISTENCIA/ABSENT. Tardanza no se cuenta como inasistencia. Las ausencias justificadas se cuentan provisionalmente porque la regla oficial SACE no se ha confirmado; este comportamiento no es una declaración normativa.
- La columna RECUPERACIÓN se mantiene vacía. Si el libro contextual contiene registros de recuperación, el proveedor bloquea el resultado hasta verificar cómo debe expresarse esa información en la plantilla oficial.

**Hallazgo de fuente:** `getBatchAttendanceRecords` no basta como fuente para este propósito: filtra por la fecha de registro (`FechaRegistro`) y devuelve registros sin los metadatos de la sesión que permiten comprobar fecha de clase, asignatura, sección y docente. `getClassAttendance` devuelve registros por sesión, pero no incorpora el join con `SesionesAsistencia`. El proveedor, por tanto, requiere que el backend construya una instantánea server-side que una ambas hojas y aplique el contexto autenticado; no se debe pasar al módulo un conjunto arbitrario enviado por el navegador.

**Límite:** el módulo permanece en estado CANDIDATE. No está llamado por backend, API ni UI; no lee Sheets directamente, no habilita descarga y no declara compatibilidad SACE. Los datos de identidad y el contexto docente deben proceder de fuentes institucionales verificadas. El mapeo PeriodoID→parcial, la regla de ausencias justificadas y la recuperación siguen sujetos a validación con plantilla/procedimiento SACE real.


## 8. Instantánea server-side autenticada de asistencia — C1.833

Se añadió la acción de solo lectura `getSaceAttendanceSnapshot` en Academic-Service, disponible explícitamente para el rol `Profesor` y resuelta por el contexto de autorización de entrada ya existente. La función reutiliza la identidad de sesión verificada del servicio, deriva `teacherUserId` de ella y exige que coincida con `SesionesAsistencia.DocenteUserId`. Usa `claims.institutionId` como contexto institucional y, si existe `IMA_INSTITUTION_ID` en propiedades del servicio, exige coincidencia.

El endpoint recibe únicamente el contexto académico solicitado (año, grado, sección, asignatura, dos `PeriodoID` y la lista de `UserID` obtenida del libro de calificaciones). Antes de devolver datos:
- verifica año y periodos únicos, pertenecientes al año solicitado, cerrados, con fechas válidas y rangos no solapados;
- resuelve el nombre oficial de la asignatura desde `CatalogoAsignaturas`;
- valida cada alumno contra una matrícula activa en el mismo grado/sección/año en Academic-Service;
- solicita identificación y `TipoIdentificacion` a USER-Service mediante el envelope HMAC interservicio existente (`ACADEMIC→USER`), con sesión de docente verificada y lista de IDs acotada; USER-Service valida cuenta/rol/persona activos y devuelve solo identidad, tipo documental y nombre;
- obtiene las sesiones por fecha de clase y contexto exacto de grado, sección, asignatura y docente, excluyendo sesiones no cerradas/finalizadas y canceladas;
- une `RegistrosAsistencia` con las sesiones seleccionadas y devuelve únicamente registros del padrón solicitado.

La lista de estudiantes del cliente no se considera prueba de matrícula: cada ID debe tener inscripción activa coincidente en el año/grado/sección. La consulta a USER-Service se autentica con el envelope ACADEMIC→USER y vuelve a validar la sesión del docente, institución y estado de las cuentas/personas. El endpoint no lee una hoja Personas local en Academic-Service ni acepta identidad del docente/institución desde campos libres del cliente.

**Límite de esquema:** se amplió el esquema canónico de `Personas` con `TipoIdentificacion`, opcional y de valor institucional explícito. `createPerson` lo acepta y migra de forma aditiva hojas antiguas; el escritor de migración conserva el campo y deja vacío el valor de las personas históricas que no lo tenían. USER-Service devuelve `documentType` desde ese campo; Academic-Service lo transporta y mantiene `documentMarker: ""`. El tipo general de identificación no se equipara automáticamente al marcador/código de la plantilla SACE. El proveedor exige un marcador no vacío y por ello sigue bloqueando la exportación hasta verificar la equivalencia con la plantilla oficial. No se infiere del formato de la identidad.

**Límite de política:** el snapshot conserva `justificado` por registro, pero el significado de una ausencia justificada para la plantilla SACE no se resuelve en este endpoint. La especificación de asistencia de IMA define la ausencia injustificada como estado Ausente sin justificación aprobada; la regla SACE debe confirmarse antes de cambiar el cómputo del proveedor.

**Estado:** endpoint de lectura candidato, sin activación UI ni exportación productiva. Los contratos locales prueban autenticación/rol, institución, periodo, matrícula, filtro de sesiones, envelope ACADEMIC→USER y validación del directorio de identidad. La llamada real al servicio desplegado y la provisión del credential registry quedan registradas como beta.


## 9. Composición del snapshot autenticado con el proveedor candidato — C1.835

Se añadió `buildCandidateStudentsFromSnapshot(input)` a `js/sace-data-provider.js`. El wrapper consume la respuesta `getSaceAttendanceSnapshot` del Academic-Service junto con los dos snapshots del libro contextual provenientes de Exam-Service. Los dos IDs de periodo deben indicarse explícitamente como `partial1PeriodId` y `partial2PeriodId`; el wrapper no infiere el orden ni la equivalencia de parciales.

La composición usa el contexto, los periodos, el directorio de identidad y las sesiones/registros devueltos por el endpoint. Conserva las limitaciones de la fuente en la respuesta. Si el snapshot es inválido, falta `documentTypeMappings`, no se encuentran los periodos, falta `documentType` o no hay correspondencia para el tipo registrado, el armado se rechaza. El wrapper aplica la correspondencia explícita al `documentMarker` antes de invocar el proveedor; si el snapshot ya trae un marcador distinto, también rechaza el conflicto. No hay mapeos por defecto.

El contrato local amplía `sace-data-provider-contract.test.js` para probar la ruta snapshot→proveedor, la conservación de limitaciones, el bloqueo por marcador vacío, periodos duplicados y snapshots incompletos.

**Límite:** es una composición entre contratos locales, no una llamada HTTP entre servicios ni una integración desplegada. No se añadió UI ni se habilitó descarga/producción. El tipo documental debe venir del campo institucional verificado y la equivalencia a marcador SACE debe suministrarse explícitamente y confirmarse con la plantilla oficial. Los valores de las pruebas son sintéticos y no representan códigos oficiales.


## 10. Tipo documental canónico de Persona — C1.836

El servicio USER añade `Personas.TipoIdentificacion` como atributo opcional del registro canónico de identidad. El campo se puede registrar explícitamente en `createPerson`, se valida como texto de hasta 40 caracteres y se conserva vacío cuando no hay dato verificado. La migración de una hoja anterior agrega la columna al final; no asigna tipos a registros históricos ni cambia la identificación existente. El escritor de migración de Personas reconoce el esquema anterior y lo amplía de forma compatible, preservando valores existentes.

Academic-Service devuelve `documentType` separado de `documentMarker`. La plantilla SACE usa un marcador/código que no debe asumirse idéntico al tipo documental general. El endpoint devuelve `documentMarker` vacío. `buildCandidateStudentsFromSnapshot` puede aplicar un mapeo explícito `documentTypeMappings`, pero no trae valores predeterminados ni declara que el mapeo sea oficial. Sin mapeo para cada tipo, el armado se rechaza. No se habilita una exportación parcial.


## 11. Correspondencia explícita TipoIdentificacion→marcador SACE — C1.837

El wrapper `buildCandidateStudentsFromSnapshot` ahora requiere `documentTypeMappings`, una lista explícita de pares `{ documentType, documentMarker }`. Normaliza el tipo para detectar duplicados de escritura/acentos, exige tipo y marcador no vacíos, rechaza tipos sin correspondencia y conflictos con cualquier marcador ya presente en el snapshot. El marcador resultante se entrega al matching de la plantilla, que aún debe confirmar igualdad por identidad y marcador.

No se agregan equivalencias predeterminadas. Los pares usados en pruebas son datos sintéticos y no constituyen una afirmación sobre los códigos oficiales SACE. La configuración real requiere inspeccionar una plantilla docente autorizada y confirmar su diccionario/campo. La salida sigue siendo CANDIDATE y no se habilita la descarga.


## 12. Orquestación local snapshot→plantilla→XLS candidato — C1.838

Se creó `js/sace-export-orchestrator.js` como módulo puro de composición en memoria. Recibe bytes de plantilla, snapshot de asistencia autenticado, los dos snapshots de calificaciones, IDs explícitos de parciales, equivalencias documentType→documentMarker, contexto de plantilla y configuración de escala. Invoca el proveedor, resuelve filas por identidad/nombre/marcador y ejecuta `prepareCandidateExport`.

Después de generar el archivo, vuelve a inspeccionar el XLS y verifica las 22 filas en las cinco celdas editables (inasistencias y notas de ambos parciales y recuperación), además de tamaño OLE, capacidad, fórmulas, validaciones y merges. Devuelve bytes en memoria con estado `candidate`, cantidad de filas y limitaciones; no escribe archivos, no descarga, no invoca SACE y no se integra a UI.

El contrato usa las tres plantillas XLS versionadas en el repositorio y snapshots/identidades/calificaciones/asistencia sintéticos. GitHub Actions 44542962606 SUCCESS. Demuestra la ruta de extremo a extremo local, no la compatibilidad oficial ni la carga real. Los mapeos documentales de prueba son ficticios; la equivalencia real debe ser aprobada con plantilla docente autorizada.


## 13. Directorio de identidad USER→Academic para el snapshot SACE — C1.839

Se corrigió el límite de servicio detectado en C1.838: Academic-Service y USER-Service usan almacenes independientes. Academic-Service no tiene una hoja `Personas` canónica y no debe leerla localmente. La acción `getSaceAttendanceSnapshot` ahora valida las matrículas en el libro académico y solicita la identidad al USER-Service por el envelope HMAC interservicio ya implementado (`createInterServiceEnvelope` / `verifyInterServiceEnvelope`, credential type `IMA_MIGRATION_HMAC_SECRET`). No se crea un secreto ni protocolo paralelo.

USER-Service solo acepta la acción `getSaceStudentIdentityDirectory` cuando el envelope viene de `ACADEMIC` y está dirigido a `USER`. Revalida el token de sesión, rol Profesor, UserID e institución; valida cuentas estudiantiles y Personas activas; devuelve únicamente UserID, identificación, tipo documental y nombre para la lista solicitada. No expone email ni teléfono. La protección HMAC, vigencia y replay usa el protocolo interservicio existente.

Se corrigió además el contrato de lectura de `PeriodosAcademicos`: el esquema canónico declara `TipoPeriodo` (con lectura compatible de `Tipo` legado), no un encabezado obligatorio `Tipo`. El endpoint ya no intenta leer `Usuarios` ni `Personas` desde el spreadsheet de Academic-Service.

**Límite operativo:** la integración requiere `IMA_USER_SERVICE_URL` configurada en Academic-Service y un credential ACADEMIC→USER activo/verificable en el catálogo HMAC de ambos servicios. Si falta cualquiera, la solicitud falla cerrada. BETA-EXAM-110 documenta esa prueba real.


## 14. Snapshots contextuales de calificaciones desde Exam-Service — C1.840

Se añadió getSaceGradebookSnapshot en Exam-Service como una acción de lectura autenticada para Profesor. La acción reutiliza withAuthorizedExamRead_ y getGradebookDataUnlocked_, por lo que mantiene el permiso de rol, el contexto institucional, la asignación docente y el bloqueo de lectura existente. No crea un mecanismo de autenticación ni una ruta de acceso alternativa.

El endpoint recibe el PeriodoID académico y el identificador de parcial que utiliza el libro como dos valores separados. La correspondencia se exige explícitamente desde Academic-Service (examPeriodMappings); no se deduce del orden ni del nombre del periodo. El endpoint comprueba que el cierre corresponde al mismo AnoID, PeriodoID/parcial, grado, sección y asignatura, exige un único cierre Cerrado y rechaza esquemas legacy que no permitan comprobar el año.

El DTO devuelve únicamente el roster solicitado (UserID, nombre, grado y sección), los resúmenes de calificación mínimos, el estado de cierre y el contexto. No devuelve correo, observaciones ni registros completos de calificaciones. Las recuperaciones del roster se mantienen visibles para que el proveedor bloquee mientras la semántica oficial siga sin resolverse.

Academic-Service añade requestSaceGradebookSnapshotFromExam_ y consulta ambos parciales usando el token de sesión del Profesor; Exam-Service vuelve a validar ese token, el rol, la asignación docente y la institución. La URL se configura en IMA_EXAM_SERVICE_URL. getSaceAttendanceSnapshot exige dos pares explícitos { periodoId, parcial } y devuelve gradebookSnapshots vinculados por periodoId, junto al snapshot de asistencia e identidad USER.

**Verificación local:** Actions 44548365751 (Academic-Service) SUCCESS. En Exam-Service, el nuevo contrato y la suite específica de Exam-Service pasaron en 44548848434; el workflow completo reportó FAIL solo en tres pruebas generales ajenas a este cambio (phase22-document-management-suite-contract, accounting-school-document-binary-integrity y session-token-expiry). La prueba de scope también conserva un fallo ajeno configureSchoolDocumentTemplate ausente. Estos fallos no se presentan como PASS ni alteran la evidencia de los contratos específicos.

**Límite:** la llamada HTTP entre los despliegues, la URL IMA_EXAM_SERVICE_URL y la sesión válida del entorno beta se verifican en BETA-EXAM-111. No hay UI, descarga ni exportación productiva.


## 15. Consumo de gradebookSnapshots en el orquestador — C1.841

Se añadió prepareCandidateExportFromAcademicSnapshot al módulo js/sace-export-orchestrator.js. El wrapper consume directamente attendanceSnapshot.data.gradebookSnapshots, exige exactamente dos snapshots, rechaza periodoId duplicado, snapshots inválidos y discrepancia entre el periodoId de la entrada y el contexto interno.

Los parciales se seleccionan únicamente por partial1PeriodId y partial2PeriodId explícitos. El wrapper construye la entrada del orquestador interno con los snapshots recuperados del objeto Academic y no utiliza partial1Gradebook/partial2Gradebook si el llamador intenta suministrarlos por separado. Los IDs no se infieren del orden ni del nombre.

El contrato sace-export-orchestrator-contract.test.js ahora construye snapshots académicos con los dos gradebookSnapshots y ejecuta la composición binaria sobre las tres plantillas XLS del repositorio. Verifica las 22 filas D/E/F/G/H, el tamaño y estructura del archivo, y comprueba que un gradebook externo manipulado no sustituye los datos contenidos en el snapshot. Incluye rechazos para snapshots faltantes, periodos duplicados y contexto-periodo discordante.

**Verificación:** GitHub Actions 44549715550 — SACE template structure compatibility contract: SUCCESS. Pasaron sintaxis del orquestador y contrato, proveedor, estructura XLS y parcheo binario.

**Límite:** el orquestador sigue siendo una composición local interna y devuelve bytes con estado CANDIDATE. No se expone a UI, no descarga ni guarda archivos, no llama a SACE y no convierte el objeto recibido en una prueba de autenticidad de un servicio desplegado. La llamada real entre servicios se valida separadamente en BETA-EXAM-111.

Estado AUD-NG-167: [~] En progreso.
Siguiente acción: hacer explícita la política de inasistencias justificadas. El proveedor no debe asumir si una ausencia justificada cuenta para SACE; debe exigir una regla configurada y probada, conservando el bloqueo cuando no exista decisión institucional/plantilla oficial.


## 16. Política explícita de ausencias justificadas — C1.842

Se eliminó la decisión implícita de contar todas las ausencias justificadas. El proveedor ahora exige absencePolicy.justifiedAbsenceMode con uno de dos valores explícitos: COUNT o EXCLUDE. COUNT incluye las ausencias justificadas; EXCLUDE las omite. Las tardanzas y otros estados no incluidos en el catálogo de ausencias siguen sin incrementar el contador.

Cada registro de asistencia debe incluir el booleano justificado; si falta o no es booleano, el proveedor rechaza el cálculo. Si no se proporciona una política válida, también falla cerrado. La respuesta candidate conserva el modo seleccionado y declara que es una entrada explícita todavía no confirmada contra la regla oficial SACE. No se agregan valores predeterminados.

El parámetro se propaga desde prepareCandidateExportFromAcademicSnapshot hasta el proveedor. Los contratos prueban ambos modos, ausencia de política, modo inválido y estado de justificación faltante. Los fixtures son sintéticos; COUNT y EXCLUDE son opciones configurables, no equivalencias oficiales declaradas.

**Verificación:** GitHub Actions 44550379659 — SACE template structure compatibility contract: SUCCESS. Pasaron sintaxis y contratos del proveedor/orquestador, pruebas estructurales XLS y parcheo binario.

**Límite:** la selección institucional del modo queda pendiente de BETA-EXAM-112 y evidencia oficial autorizada. El resultado permanece CANDIDATE; no se habilita UI, descarga ni carga SACE.


## 17. Justificación de inasistencia: fuente canónica y sincronización — C1.843

El campo RegistrosAsistencia.Justificado no se considera por sí solo evidencia de una justificación aprobada. El flujo ordinario saveClassAttendance puede escribir ese booleano; por ello, el snapshot SACE ahora exige también JustificacionID y consulta JustificacionesAsistencia.

resolveSaceAttendanceJustification_ aplica estas reglas por cada registro de sesión/estudiante:
- Sin JustificacionID y Justificado=false: no se considera justificado, siempre que no exista una justificación canónica aprobada o pendiente de sincronización para ese mismo estudiante, periodo, sesión y fecha.
- Con JustificacionID: exige un único registro canónico, mismo estudiante y periodo, EstadoRevision=Aprobada, SyncEstado=SINCRONIZADO, sesión aprobada incluida y fecha afectada coincidente.
- Justificado=true sin enlace, enlace ausente/duplicado, estudiante/periodo/sesión/fecha discordantes, aprobación pendiente o sincronización pendiente: rechaza el snapshot.
- También rechaza una justificación aprobada y sincronizada que no esté enlazada al registro de asistencia, para evitar contarla accidentalmente como ausencia no justificada.

Academic-Service devuelve justificacionVerificada=true solo después de comprobar el vínculo canónico o la ausencia de una justificación aplicable. El proveedor exige ese indicador junto al booleano justificado. Los datos sintéticos verifican aprobación/sincronización y las rutas negativas.

**Verificación:** Actions 44552470318 — Academic-Service single authorization context: SUCCESS; 44551873276 — SACE template structure compatibility contract: SUCCESS. Pasaron los contratos del snapshot, proveedor y orquestador.

**Límite:** el snapshot real y las transiciones de justificación en Apps Script desplegado se validan en BETA-EXAM-113. La política COUNT/EXCLUDE sigue sin fuente oficial confirmada (BETA-EXAM-112); la plantilla oficial y recuperación también pendientes.


## 18. Trazabilidad de revisiones en el XLS candidato y verificación de procedencia — C1.885

El snapshot Academic ahora expone sourceRevisions para Academic, USER y Exam después de completar la revalidación A1→U1→E1→A2→U2→E2. El orquestador candidato conserva esos tokens reportados en el objeto de resultado como metadatos separados del libro:
- sourceRevisionStatus="present" y sourceRevisions con los tres tokens cuando el snapshot los incluye y su formato/contador es válido.
- sourceRevisionStatus="absent" y una limitación explícita cuando se recibe un snapshot legacy sin sourceRevisions; se mantiene la compatibilidad de la composición candidata, pero no se afirma que su estabilidad entre servicios esté acreditada.
- Un objeto presente con token incompleto, malformado o con contador no seguro se rechaza con SACE_SOURCE_REVISIONS_INVALID.
- Los tokens no se escriben en celdas ni en el contenedor OLE/BIFF. Solo se conservan en metadatos del resultado candidato; el contrato automatizado comprueba que no aparecen en los bytes XLS.

### Verificación de procedencia oficial

El catálogo público de descargas SACE consultado el 2026-11-20 enumera nomenclaturas, fichas y manuales, pero no publica una plantilla de calificaciones .xls genérica: https://sace.se.gob.hn/descargas/descargar/archivos

El manual público de usuario docente describe la descarga del archivo de calificaciones desde el módulo Notas para las clases asignadas al docente: https://sace.se.gob.hn/media/documentos_sace/Manual_de_usuario_SACE_Docente.pdf

Por tanto, los tres libros del repositorio siguen siendo ejemplos estructurales candidatos; no se ha demostrado que sean los archivos que SACE genera actualmente para una clase y periodo reales. No se cambia manifest.json: officialSourceVerified permanece false, effectiveFrom/effectiveTo permanecen null y los tres templates permanecen CANDIDATE.

**Verificación local:** GitHub Actions 44647806731 — SACE template structure compatibility contract: SUCCESS. Pasaron sintaxis del orquestador, parche binario, proveedor, contrato de composición y aislamiento de producción. El contrato prueba metadatos presentes, ausencia legacy, tokens inválidos y que el token no se escribe en el XLS.

**Límite:** el orquestador continúa devolviendo un candidato local; no se expone a UI, descarga, almacenamiento ni carga a SACE. BETA-EXAM-115 documenta la comparación futura contra un libro descargado desde una sesión docente autorizada. La semántica de recuperación H y la política oficial COUNT/EXCLUDE siguen pendientes; no se promueve el candidato.

Estado AUD-NG-167: [~] En progreso.


## 19. Formato de sourceRevision — C1.886

Los tokens de revisión reportados por Academic, USER y Exam usan el formato `UUID:counter`. Cada servicio genera el epoch con `Utilities.getUuid()` y ahora valida el UUID hexadecimal canónico de cinco grupos (8-4-4-4-12) tanto al inicializar como al leer Script Properties. El contador sigue limitado a entero seguro no negativo y el incremento permanece fail-closed antes de mutar.

El orquestador candidato aplica el mismo formato antes de conservar `sourceRevisions` en metadatos. Snapshots legacy sin tokens mantienen el estado `absent`; objetos presentes con UUID o contador inválido se rechazan. Los tokens continúan fuera del binario XLS. Los contratos cubren UUID válido y epoch malformado para los tres servicios y el cliente.

**Verificación:** parser V8 PASS en tres servicios, orquestador y dos contratos; matriz de formato/contador PASS. Los estados consultables de CI muestran Department Reference Consumers SUCCESS y Department Scope FAILURE sin logs accesibles; no se declara PASS de los workflows SACE hasta obtener sus resultados verificables. No se modifican manifest ni los tres templates CANDIDATE.

Estado AUD-NG-167: [~] En progreso.


**Evidencia complementaria C1.886:** un harness V8 aislado ejecutó los helpers reales extraídos de Academic, USER y Exam. Los tres pasaron inicialización UUID:0, incrementos monotónicos, rechazo de UUID persistido malformado, overflow y fallo simulado de persistencia (el token permaneció sin avanzar). El normalizador del orquestador pasó UUID válido, epoch inválido y ausencia legacy. Este harness no se presenta como Node.js, GitHub Actions ni despliegue Apps Script.


## 20. Discrepancia entre la muestra oficial 2023 y la plantilla candidata — C1.887

La versión oficial del **Manual de Usuario Docente del Centro Educativo**, con actualización registrada en agosto de 2023, muestra en la página impresa 21 un cuadro de nueve columnas (A:I): DOCUMENTO, IDENTIDAD, NOMBRE, INASISTENCIAS P-I, NOTA TOTAL P-I, NIVELACIÓN, INASISTENCIAS P-II, NOTA TOTAL P-II y RECUPERACIÓN. El mismo orden aparece en la versión SACE actualizada en marzo de 2022 (página impresa 22). La instrucción del manual indica que solo deben ingresarse notas en las casillas generadas por el sistema y que no debe alterarse el formato.

La plantilla candidata actualmente inventariada en `manifest.json` usa otro mapeo: D/E para parcial I, F/G para parcial II y H para recuperación, con I sin uso. Frente a la muestra oficial 2023, F sería NIVELACIÓN, G las inasistencias del parcial II, H la nota total del parcial II e I la recuperación. Por ello, F/G/H/I no son intercambiables: aplicar el mapeo candidato a esa muestra sobrescribiría campos distintos. El inspector binario actual exige encabezados y rangos combinados exactos y falla cerrado ante una estructura distinta; no se relaja esa comprobación.

La discrepancia **no acredita por sí sola** que todo archivo actual de SACE tenga ese mismo diseño, porque el manual contiene un ejemplo y la plantilla efectiva debe descargarse desde una sesión docente autorizada. Se registra como incompatibilidad con la muestra publicada, no como especificación universal. `manifest.json` mantiene `status=CANDIDATE`, `officialSourceVerified=false` y sin vigencia; los tres XLS del repositorio no se promueven ni se usan para exportación productiva.

El manual muestra campos de inasistencias, pero no establece si las ausencias justificadas se cuentan o excluyen; COUNT/EXCLUDE sigue sin decisión oficial. BETA-EXAM-115 debe inspeccionar específicamente F/G/H/I, nivelación, inasistencias, nota total y recuperación en el archivo real, además de la vigencia y la procedencia.
