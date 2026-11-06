# Informe de auditoría - Lote A

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** `NG_beta_work`  
**Commit de referencia:** `28c08ba9736532075e41f3255c0f387a88d23484`  
**Tarea principal:** `AUD-NG-101` (permanece En Ejecución)

## Alcance y método

Se revisaron individualmente UNIF-001, FIX-001, HIST-001, AUTH-001, PROF-001 y NAV-001. La inspección fue estática y manual sobre el código vigente, contrastando cambios históricos. No se modificó código fuente, no se realizaron solicitudes de explotación y no se accedió ni escribió en la hoja de cálculo productiva.

Cambios históricos consultados:
- `7952f726f9d6b1281b1761b91a5608b1db78e0cb`: persistencia, historial, mapa de asignaturas por grado y personalización docente.
- `2760cdab87b198b2723923bb4da2f2e49d00c874`: personalización docente, integridad de asignaciones, historial y navegación.
- `4f0941d5a73cb4025346df476b3d2e66d8f4e970`: reestructuración del historial y filtrado de asignaturas.
- `a55dd2700069250a2358838eba991d849c8356ae`: unificación granular de configuración.
- `0f795e265c237fb093dd375dc5d088b708901211`: migración al microservicio académico.
- `3f9efb13f48084acde81b7d0b9c9b1a85f4d3a66`: filtrado granular y salto automático de sección única.

## Archivos y respaldos Git

| Archivo | Blob SHA |
|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` |
| `js/teacher.js` | `c475fce5afcd28fca23e7b64398ad32b17773746` |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` |
| `js/persistence.js` | `94ac26feb4f7f31f1f3f2a238e164d23be565d94` |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` |
| `completadas_legacy.md` | `c9622ea9e03ec16dcecb12ae97b17b89ed204157` |

## Resultado por tarea

### UNIF-001 - Unificación de Configuración Académica
**Estado: Cumple parcialmente.** La configuración activa se consolidó en `ConfiguracionAcademica` con nueve columnas y `GranularConfig`; `getAsignaturasActivas` lee esa tabla y `updateAsignaturasActivas` está deprecada. No se encontraron referencias a `AsignaturasPorParcial` en los dos microservicios inspeccionados. Sin embargo, la clave de persistencia de `updateAcademicConfig` omite parcial y unidad; el constructor docente no conserva parcial/tema/unidad al reconstruir y guardar asignaciones. Hallazgos AUD-NG-102 y AUD-NG-103. No se verificó la eliminación física de una hoja antigua en el Spreadsheet productivo.

### FIX-001 - Corrección DataError y Persistencia profesorId
**Estado: Cumple parcialmente.** `PersistenceManager.delete` usa `key || getActiveId()`, el frontend docente envía `currentUser.userId` como `profesorId` y el backend lo almacena. No obstante, el caché estudiantil pasa un nombre dinámico por usuario como nombre del almacén IndexedDB, aunque solo se crea el almacén fijo `cache_estudiante_dashboard`; la lectura ocurre antes del bloque try principal. Hallazgo AUD-NG-104.

### HIST-001 - Reestructuración de Historial Académico
**Estado: Cumple parcialmente.** Existe tabla de ocho columnas con IDs `hist-XXXX`, parcial, grado, sección, asignatura, unidad y profesorId. El lector compara el ID autenticado del estudiante con `r[0]`, que contiene `hist-XXXX`; la tabla no almacena studentId. Además, el rol `Estudiante` no tiene permiso para `getAcademicHistory`, aunque `Alumno` sí. Hallazgo AUD-NG-105.

### AUTH-001 - Filtrado de Asignaturas por Grado
**Estado: No cumple.** Existe `SUBJECT_GRADE_MAP` y filtrado de interfaz, pero `getAcademicConfig` acepta grado y sección del cliente. `validateContextualAccess` no contrasta esos campos con el perfil autenticado, y los filtros ausentes actúan como comodines. El servidor dispone de `_verifiedUserId`, pero la función no lo utiliza para derivar el alcance. Hallazgo AUD-NG-106. Como brecha adicional, `isContentAuthorized` puede retornar al coincidir el tema antes de ejecutar la validación de perfil basada en `SUBJECT_GRADE_MAP` (AUD-NG-107).

### PROF-001 - Personalización Docente e Integridad de Asignación
**Estado: No cumple.** Los roles Profesor pueden leer y actualizar la configuración, pero el backend acepta `profesorId` y `fullScope.profesorId` enviados por el cliente sin vincularlos con `_verifiedUserId`. `validateContextualAccess` no impone propiedad de configuración docente. Un docente puede solicitar o modificar el ámbito de otro docente mediante el payload. Hallazgo crítico AUD-NG-108.

### NAV-001 - Flujo de Navegación Contextual Docente
**Estado: Cumple.** La navegación visible sigue Grados -> Secciones -> Asignaturas -> Alumnos -> Detalles. Cuando un grado tiene una sola sección, la interfaz salta directamente a Asignaturas, comportamiento introducido en la evolución posterior v7.9.1 como optimización explícita. El filtrado exacto por parcial se reserva para NAV-002 del Lote C.

## Hallazgos y tareas derivadas

Se registraron ocho hallazgos en `Auditoria.txt` y se añadieron tareas al final de `Pendientes.md`:
- AUD-NG-102: clave granular debe preservar parcial y unidad.
- AUD-NG-103: el constructor docente debe preservar parcial, tema y unidad.
- AUD-NG-104: corregir el almacén IndexedDB del dashboard estudiantil.
- AUD-NG-105: alinear esquema, permisos y lectura del historial académico.
- AUD-NG-106: vincular grado/sección con la identidad estudiantil verificada.
- AUD-NG-107: aplicar validación de grado antes de autorizar recursos temáticos.
- AUD-NG-108: aislar la configuración por el profesor autenticado.
- AUD-NG-109: añadir pruebas funcionales de regresión.

## Cobertura de pruebas y límites

El directorio `tests/regression` contiene dos suites. No se encontraron pruebas conductuales específicas de estas seis tareas ni invocaciones de `getAcademicConfig`, `updateAcademicConfig` o `getAcademicHistory` para comprobar autorización, persistencia entre parciales o lectura del historial. La suite académica inspeccionada contiene principalmente aserciones de presencia de funciones y marcadores de fases posteriores.

No se ejecutaron las suites. Este informe no declara resultados de ejecución, pruebas de explotación ni validación de datos productivos.

## Estado y continuidad

- Lote A: inspección estática completada para sus seis tareas.
- Ninguna tarea histórica se marca como completada ni se altera `completadas_legacy.md`.
- `AUD-NG-101` permanece En Ejecución porque la auditoría de las 49 tareas continúa.
- Próximo lote: B.
- No se modificó código fuente ni se actualizó `ChangesLogs.txt`.
- `MapaDependencias.md` se conserva intacto por ser v7.6.1 y no haberse validado el grafo completo; las dependencias comprobadas figuran en este informe y en los hallazgos.
