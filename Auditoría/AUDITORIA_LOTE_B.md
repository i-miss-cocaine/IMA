# Informe de auditoría - Lote B

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base inspeccionada:** `NG_beta_0.0.0.1`  
**Rama de trabajo documental:** `NG_beta_0.0.0.1_work`  
**Commit de referencia:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Tarea principal:** `AUD-NG-101` (permanece En Ejecución)

## Alcance y método

Se inspeccionaron individualmente CORS-001, LOOP-001, UI-001 y DB-001. La revisión fue estática y manual sobre el código vigente, con consulta de los cambios históricos posteriores para distinguir implementación vigente, reemplazos y limitaciones. No se modificó código fuente, no se ejecutaron pruebas, no se accedió al Spreadsheet productivo ni se hicieron llamadas de escritura a servicios desplegados.

Los blobs Git del commit de referencia se conservaron como respaldo inmutable para comparar los archivos inspeccionados. No se alteró `completadas_legacy.md` ni sus 49 estados históricos.

## Evidencia y versiones consultadas

| Archivo | Blob SHA |
|---|---|
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` |
| `js/persistence.js` | `94ac26feb4f7f31f1f3f2a238e164d23be565d94` |
| `student-dashboard.html` | `6379ea0ed39d71b89747a0280bb925fdf12202c1` |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` |

Cambios históricos relevantes:
- `b35fda1539d13704e9c324b04812ff671451a88d`: commit v7.8.6 que documenta la implementación inicial de CORS `text/plain`, flag de control de carga, navegación por tarjetas y esquemas 9/8.
- `4a57d06d89222a196909f0c6081bbbb7c009934a`: consolidación de tarjetas expandibles y filtrado inicial del parcial vigente.
- `6aae7f1933e07b431fbb84ea00da71d1f40dd151`: cambio posterior que incorpora consulta de parciales históricos y mantiene pestañas de vistas generales del dashboard.
- `0f795e265c237fb093dd375dc5d088b708901211`: migración de la configuración e historial al microservicio ACADEMIC.
- `cff3ab459a9b93d599d0d45aff3a40ebe1d237a9`: actualización posterior del constructor jerárquico y tarjetas estudiantiles.

## Resultado por tarea

### CORS-001 - Estabilización de conexión (Red/CORS)
**Estado: Cumple parcialmente.** En `js/api.js:55-57`, `fetchApi` envía POST con `Content-Type: text/plain` y el cuerpo JSON, por lo que el encabezado utilizado corresponde a un tipo de contenido simple y evita el preflight provocado por `application/json`. La ruta histórica `USER/getAcademicConfig` ya no es la ruta activa: `js/config.js:467` llama a `ACADEMIC/getAcademicConfig`, tras la modularización documentada en el commit `0f795e2`. No se ejecutó una petición desde el origen web desplegado ni se verificó la respuesta del endpoint; por ello no se certifica que la petición real no termine en `TypeError: Failed to fetch`. Hallazgo AUD-NG-112.

### LOOP-001 - Eliminación de bucle infinito en Dashboard
**Estado: Cumple parcialmente.** `js/student.js:1167` activa `isFetchingActivities` y la función evita llamadas simultáneas; no se encontró una llamada recursiva directa a `syncAcademicScope` dentro de `fetchAllActivities`. El evento `academic-scope-updated` se ignora mientras la carga está activa (`js/student.js:2658`), y `js/config.js:441` solo lo emite cuando el alcance cambia. Sin embargo, `fetchAllActivities` ejecuta `await PersistenceManager.get(cacheKeyDashboard)` en la línea 1176 antes del `try` de la línea 1205. Si `PersistenceManager.init` rechaza por un fallo de `indexedDB.open` (`js/persistence.js:20-43, 77-85`), la ejecución no alcanza el `finally` de las líneas 1345-1346 y el flag permanece activo. Además, el nombre dinámico de almacén en esta consulta ya está documentado en AUD-NG-104 y no se duplica como hallazgo. Hallazgo AUD-NG-110.

### UI-001 - Eliminación de navegación residual por pestañas
**Estado: Reemplazada por implementación posterior.** No existe `#subject-tabs-container` ni referencias `subject-tabs` en `student-dashboard.html` o `js/student.js`. `renderSubjectNavigation` (`js/student.js:1608` en adelante) construye tarjetas por asignatura y la expansión de cada tarjeta muestra sus actividades. Las pestañas que permanecen en `student-dashboard.html:129-145` corresponden a vistas generales (Actividades, Progreso, Finanzas y Guías), no a pestañas por asignatura. No obstante, el requisito histórico de mostrar exclusivamente el parcial vigente fue ampliado por el cambio posterior `6aae7f1`, que incorporó el selector de parciales históricos. Se conserva la navegación por tarjetas y se reconoce la ampliación posterior del alcance temporal; no se trata como regresión sin evidencia de que esa función posterior deba retirarse.

### DB-001 - Normalización tabular 9/8 columnas
**Estado: Cumple parcialmente.** La lógica fue trasladada de `backend/user-service/Code.gs` a `backend/academic-service/Code.gs`. `getOrCreateSheet` (`Code.gs:84-92`) define nueve encabezados para `ConfiguracionAcademica` y ocho para `HistorialAcademico`. `updateAcademicConfig` construye filas granulares y escribe el ancho de encabezados existente (`12404-12504`); el recorrido alternativo expande grados, secciones, asignaturas y temas sin serializar esos registros en JSON. `saveToAcademicHistory` escribe filas de ocho posiciones (`12515-12584`). La limitación es que `getOrCreateSheet` solo agrega encabezados cuando la hoja no existe; si ya existe, no valida cantidad, nombres ni orden de columnas, aunque las funciones posteriores usan índices fijos. No se verificó la estructura real de la hoja productiva. Hallazgo AUD-NG-111.

## Pruebas y calidad

Se inspeccionaron las suites `academic-grading-suite.js` y `modular-dashboard-suite.js`; no se identificaron pruebas dirigidas a los cuatro contratos históricos ni a los escenarios de fallo de caché, CORS real o esquema heredado descritos en este lote. No se ejecutaron las suites. No se afirma que una prueba haya pasado ni que el servicio desplegado esté operativo.

Hallazgos convertidos en tareas:
- AUD-NG-110: garantizar la liberación del bloqueo de carga ante fallos de caché.
- AUD-NG-111: validar el esquema de las hojas académicas existentes sin pérdida de datos.
- AUD-NG-112: verificar CORS real del endpoint académico vigente.

## Estado y continuidad

- Lote B: cuatro tareas inspeccionadas; ninguna marca histórica fue modificada.
- AUD-NG-101 permanece En Ejecución porque faltan los lotes C-H.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- No se accedió al Spreadsheet productivo ni se ejecutaron pruebas en el despliegue GAS.
- Próximo lote: C.
