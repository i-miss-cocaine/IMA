# Informe de auditoría - Lote C

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base inspeccionada:** `NG_beta_0.0.0.1`  
**Rama de trabajo documental:** `NG_beta_0.0.0.1_work`  
**Commit de referencia del código:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Tarea principal:** `AUD-NG-101` (En Ejecución)

## Alcance

Se auditaron ocho tareas históricas: CONF-001, DATE-001, NAV-002, STUD-002, POST-001, MOD-001, FIX-002 y FIX-003. Se comparó el alcance original con el código actual y con commits posteriores, sin asumir que una marca histórica de completada certifica la implementación. No se modificó código fuente ni se accedió a hojas productivas.

## Evidencia por tarea

### CONF-001 - Desacoplamiento Parcial/Unidad y lógica Upsert
**Estado: Cumple parcialmente.** El backend normaliza Parcial y Unidad de forma independiente (`Code.gs:12425-12426`). Sin embargo, la búsqueda `oldRow` (`12466-12472`) compara profesor, grado, sección, asignatura y tema, pero no compara el parcial. La clave de `finalConfigMap` también omite el parcial. Una asignación del mismo tema en otro parcial puede reutilizar y sobrescribir una fila anterior. El alcance de upsert por los seis factores no está completo. Hallazgo AUD-NG-113.

### DATE-001 - Ciclo de vida dinámico de columna Fecha
**Estado: No cumple.** `updateAcademicConfig` obtiene `currentMonth` y lo escribe como valor de Fecha tanto al insertar como al actualizar (`12426`, `12472-12475`, `12491-12494`). No se encontró en esta ruta lógica que cierre la fecha del parcial anterior como intervalo inicio-fin al configurar el siguiente. La tabla `PeriodosAcademicos` contiene campos FechaInicio/FechaFin, pero no se observó integración con la ruta heredada `ConfiguracionAcademica`. Hallazgo AUD-NG-114.

### NAV-002 - Navegación docente basada en configuración vigente
**Estado: Cumple parcialmente.** `renderGrados` (`js/teacher.js:3786`) utiliza `GLOBAL_SCOPE.GradoActual`, pero el backend `getAcademicConfig` construye esa lista con todas las filas relevantes del profesor, sin limitarla al parcial activo (`Code.gs:12388-12402`). `renderSecciones` (`teacher.js:3836`) deriva secciones de `GranularConfig` filtrando solo por grado. `renderAsignaturas` (`teacher.js:3871`) sí aplica el filtro de parcial, grado y sección. Los niveles de grado y sección pueden, por tanto, mostrar elementos de otros parciales. Hallazgo AUD-NG-115.

### STUD-002 - Tarjeta de estudiante e interfaz
**Estado: Reemplazada parcialmente por implementación posterior.** `renderStudentHeader` (`js/student.js:80-120`) muestra email, teléfono y enlace WhatsApp `wa.me/504`. `student-dashboard.html:166` muestra la instrucción solicitada y no contiene el texto anterior “Vista Unificada de Asignaturas”. El filtrado usa el parcial seleccionado y permite consultar históricos mediante el selector incorporado después de v7.8.7; esto amplía el criterio original de parcial exclusivamente vigente, en coherencia con el cambio histórico que introdujo consulta de parciales anteriores. No se interpreta como regresión sin una decisión de retirar esa funcionalidad.

### POST-001 - Validación de rango de fecha en historial
**Estado: No verificable empíricamente.** `saveToAcademicHistory` (`Code.gs:12515-12584`) guarda el mes de registro como instantánea y evita insertar de nuevo el mismo contexto de cinco factores. No actualiza las filas anteriores a intervalos. El código indica una semántica de snapshot, pero la tarea original solicitó comprobarlo después de un cambio real de parcial; no se ejecutó una transición ni se consultó la hoja productiva. Hallazgo AUD-NG-116 para formalizar la decisión funcional y verificarla en entorno controlado.

### MOD-001 - Modularización de microservicio académico
**Estado: Cumple.** La lógica `getAcademicConfig`, `updateAcademicConfig` y `saveToAcademicHistory` reside en `backend/academic-service/Code.gs`. El frontend consulta `ACADEMIC/getAcademicConfig` desde `js/config.js`; `backend/user-service/Code.gs` ya no contiene esas funciones. La migración corresponde al commit histórico `0f795e265c237fb093dd375dc5d088b708901211`.

### FIX-002 - Resolución de duplicidad en Historial
**Estado: Cumple en la implementación inspeccionada.** `saveToAcademicHistory` normaliza y construye una clave con cinco factores (parcial, grado, sección, asignatura y profesor) en `Code.gs:12544`; comprueba la clave antes de insertar tanto en la ruta jerárquica como en la ruta de producto cartesiano. La llamada se realiza dentro del bloqueo de `updateAcademicConfig`. No se verificó el contenido de la hoja para certificar si persistían duplicados históricos anteriores a esta lógica.

### FIX-003 - Reparación de filtrado de asignaturas (matchParcial)
**Estado: Cumple.** En `js/student.js:1662` la variable `matchParcial` está declarada y se utiliza en la condición que filtra `GranularConfig` por parcial, junto con grado y sección. No se observa el ReferenceError histórico.

## Calidad, pruebas y límites

Se inspeccionaron `tests/regression/academic-grading-suite.js` y `tests/regression/modular-dashboard-suite.js`; no se identificaron pruebas dirigidas por nombre o contrato para las funciones de configuración, fecha, navegación y deduplicación de este lote. No se ejecutaron suites. No se accedió a SpreadsheetApp productivo ni se verificó una transición real de parcial.

Tareas derivadas:
- AUD-NG-113: completar la clave Upsert con el parcial y preservar otros periodos.
- AUD-NG-114: implementar el ciclo de vida de fechas de ConfiguracionAcademica.
- AUD-NG-115: filtrar grados y secciones por el parcial vigente.
- AUD-NG-116: definir y verificar la semántica temporal de HistorialAcademico.

## Continuidad

- Ocho tareas históricas inspeccionadas; ninguna marca de `completadas_legacy.md` fue alterada.
- AUD-NG-101 permanece En Ejecución porque faltan los lotes D-H.
- No se modificó código fuente ni `ChangesLogs.txt`.
- Siguiente lote: D.
