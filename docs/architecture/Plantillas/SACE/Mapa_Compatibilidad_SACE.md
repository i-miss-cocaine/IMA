# Mapa de compatibilidad IMA ↔ SACE (Honduras)

**Estado:** análisis de mapeo; no es una declaración de compatibilidad certificada ni una especificación de importación validada.

**Alcance:** identificar qué datos del libro consolidado de IMA pueden alimentar los archivos de calificaciones que SACE genera para el docente y qué datos/artefactos faltan para una integración verificable.

## 1. Fuentes oficiales consultadas

1. **Manual de Usuario Docente SACE, actualización junio de 2025.** Describe la descarga del archivo Excel de calificaciones por modalidad, curso, sección, jornada y clase; el archivo se completa con nota total e inasistencias por parcial y se vuelve a cargar en SACE. El manual cubre las páginas impresas 21–24.  
   https://sace.se.gob.hn/media/documentos_sace/Manual_de___usuario_SACE_Docente_2.pdf
2. **Manual de Usuario Docente SACE, actualización junio de 2019.** Incluye un ejemplo legible del archivo Excel: identificación del centro/modalidad/grado/sección/jornada/asignatura y columnas DOCUMENTO, IDENTIDAD, NOMBRE, PARCIAL I (INASISTENCIAS y NOTA TOTAL), PARCIAL II (INASISTENCIAS y NOTA TOTAL) y RECUPERACIÓN. Indica que el archivo se descarga para una clase seleccionada, que pueden cargarse notas de un parcial por vez y que no debe alterarse el formato generado por SACE. Páginas impresas 19–20. Esta es una referencia de ejemplo, no sustituye la plantilla actual generada por SACE.  
   https://sace.se.gob.hn/media/documentos_sace/Manual_de_usuario_SACE_Docente.pdf
3. **Manual de Usuario Director SACE.** Describe documentos distintos: calificaciones por parcial, resumen anual de calificaciones por área, acta final, acta final de recuperación, boleta interna, boleta externa y certificación. No son formatos intercambiables.  
   https://sace.se.gob.hn/media/documentos_sace/Manual_de_usuario_SACE_Director.pdf
4. **Reglamento del Sistema Nacional de Información Educativa, Acuerdo 1178-SE-2015, La Gaceta No. 33,817, 25-08-2015.** Artículos 78 y 84 establecen la evaluación/promoción mediante SACE; artículos 86–87 remiten la evaluación final al manual emitido/actualizado por USINIEH; el artículo 88 establece que las certificaciones y calificaciones oficiales las emite la dirección del centro y no son válidas sin las firmas correspondientes y los códigos de autenticidad generados por SACE.  
   https://www.tsc.gob.hn/web/leyes/Reglamento_sistema_nacional_info_edu_hn.pdf
5. **Reglamento del Sistema Integrado de Información Educativa, Acuerdo CNE-002-2021.** Crea el SIIE como marco integrado y prevé el Registro Educativo Único, reportes y lineamientos/manuales propios. El texto consultado no menciona SACE; por ello no se presume que lo derogue ni que lo sustituya. La relación institucional SACE–SIIE debe confirmarse con la autoridad competente antes de diseñar una integración más amplia.\n   https://www.tsc.gob.hn/web/leyes/Acuerdo-Ejecutivo-CNE-002-2021.pdf\n
## 2. Flujo SACE documentado

- El docente descarga un archivo Excel generado por SACE para una clase del centro educativo, modalidad, curso/grado, sección, jornada y asignatura.
- El docente completa las celdas de notas totales e inasistencias por parcial y carga nuevamente ese mismo archivo.
- El formato, diseño y celdas generadas por SACE no deben modificarse.
- El manual de 2019 muestra dos parciales en su ejemplo; el manual de Director presenta calificaciones para parciales 1 a 4. Por tanto, IMA no debe fijar dos o cuatro parciales como regla universal: la plantilla generada por SACE para el centro/periodo de prueba es la autoridad para el número y orden de parciales.
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

Se añadió la acción de solo lectura `getSaceAttendanceSnapshot` en Academic-Service, disponible explícitamente para el rol `Profesor` y resuelta por el contexto de autorización de entrada ya existente. La función vuelve a usar la identidad de sesión verificada del servicio, pero no crea una segunda cadena de permisos: deriva `teacherUserId` de esa identidad y exige que coincida con `SesionesAsistencia.DocenteUserId`. También exige que `claims.institutionId` coincida con `IMA_INSTITUTION_ID` configurado en el servicio.

El endpoint recibe únicamente el contexto académico solicitado (año, grado, sección, asignatura, dos `PeriodoID` y la lista de `UserID` obtenida del libro de calificaciones). Antes de devolver datos:
- verifica año y periodos únicos, pertenecientes al año solicitado, cerrados, con fechas válidas y rangos no solapados;
- resuelve el nombre oficial de la asignatura desde `CatalogoAsignaturas`;
- valida cada alumno contra `Usuarios` (cuenta activa y rol estudiante), `Personas` (identificación y nombre) y una matrícula activa en el mismo grado/sección/año;
- obtiene las sesiones por fecha de clase y contexto exacto de grado, sección, asignatura y docente, excluyendo sesiones no cerradas/finalizadas y canceladas;
- une `RegistrosAsistencia` con las sesiones seleccionadas y devuelve únicamente registros del padrón solicitado.

La lista de estudiantes del cliente no se considera prueba de matrícula: cada ID debe tener cuenta activa, persona única e inscripción activa coincidente. La identidad del docente, institución y el ámbito de la clase no se aceptan desde campos de identidad libres del cliente.

**Límite de esquema:** se amplió el esquema canónico de `Personas` con `TipoIdentificacion`, opcional y de valor institucional explícito. `createPerson` lo acepta y migra de forma aditiva hojas antiguas; el escritor de migración conserva el campo y deja vacío el valor de las personas históricas que no lo tenían. El endpoint devuelve `documentType` desde ese campo, pero mantiene `documentMarker: ""` salvo que exista un campo separado `SaceDocumentMarker`. El tipo general de identificación no se equipara automáticamente al marcador/código de la plantilla SACE. El proveedor exige un marcador no vacío y por ello sigue bloqueando la exportación hasta verificar la equivalencia con la plantilla oficial. No se infiere del formato de la identidad.

**Límite de política:** el snapshot conserva `justificado` por registro, pero el significado de una ausencia justificada para la plantilla SACE no se resuelve en este endpoint. La especificación de asistencia de IMA define la ausencia injustificada como estado Ausente sin justificación aprobada; la regla SACE debe confirmarse antes de cambiar el cómputo del proveedor.

**Estado:** endpoint de lectura candidato, sin activación UI ni exportación productiva. El contrato local prueba autenticación/rol, institución, periodo, matrícula, join de identidad, filtros de sesión y filtrado de registros. La llamada real al servicio desplegado queda registrada como beta.


## 9. Composición del snapshot autenticado con el proveedor candidato — C1.835

Se añadió `buildCandidateStudentsFromSnapshot(input)` a `js/sace-data-provider.js`. El wrapper consume la respuesta `getSaceAttendanceSnapshot` del Academic-Service junto con los dos snapshots del libro contextual provenientes de Exam-Service. Los dos IDs de periodo deben indicarse explícitamente como `partial1PeriodId` y `partial2PeriodId`; el wrapper no infiere el orden ni la equivalencia de parciales.

La composición usa el contexto, los periodos, el directorio de identidad y las sesiones/registros devueltos por el endpoint. Conserva las limitaciones de la fuente en la respuesta. Si el snapshot es inválido, falta el mapeo explícito, no se encuentran los periodos o el directorio no contiene un marcador documental, el armado se rechaza. La prueba confirma que un `documentMarker` vacío produce `SACE_STUDENT_DOCUMENT_TYPE_REQUIRED`, por lo que la falta de tipo documental no se convierte en una exportación parcial.

El contrato local amplía `sace-data-provider-contract.test.js` para probar la ruta snapshot→proveedor, la conservación de limitaciones, el bloqueo por marcador vacío, periodos duplicados y snapshots incompletos.

**Límite:** es una composición entre contratos locales, no una llamada HTTP entre servicios ni una integración desplegada. No se añadió UI ni se habilitó descarga/producción. El marcador documental debe venir de un campo institucional verificado y su equivalencia con el campo SACE debe confirmarse con la plantilla oficial.


## 10. Tipo documental canónico de Persona — C1.836

El servicio USER añade `Personas.TipoIdentificacion` como atributo opcional del registro canónico de identidad. El campo se puede registrar explícitamente en `createPerson`, se valida como texto de hasta 40 caracteres y se conserva vacío cuando no hay dato verificado. La migración de una hoja anterior agrega la columna al final; no asigna tipos a registros históricos ni cambia la identificación existente. El escritor de migración de Personas reconoce el esquema anterior y lo amplía de forma compatible, preservando valores existentes.

Academic-Service devuelve `documentType` separado de `documentMarker`. La plantilla SACE usa un marcador/código que no debe asumirse idéntico al tipo documental general. Hasta confirmar el diccionario oficial y configurar una equivalencia explícita, `documentMarker` permanece vacío y `buildCandidateStudentsFromSnapshot` rechaza el armado. No se habilita una exportación parcial.
