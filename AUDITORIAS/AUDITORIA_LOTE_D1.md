# Informe de auditoría - Lote D1

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base:** `NG_beta_0.0.0.1`  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`  
**Commit de referencia:** `44d9891132332e692dbe2ba8602b41f50a508a59`

## Alcance

Subdivisión D1 del Lote D: REQ-EXP-001, REQ-EXP-002 y REQ-EXP-003. La inspección fue estática. No se modificó código ni se accedió a datos productivos.

## REQ-EXP-001 - Metodología de desarrollo y auditoría
**Estado: Cumple parcialmente.** `METODOLOGIA_DESARROLLO.md` está presente y define expresamente ocho fases (Fase 0 a Fase 7), roles separados de auditor/desarrollador/revisor, los archivos maestros, registro de hallazgos, conversión a tareas y reglas de respaldo, verificación y Code Review. Sin embargo, el criterio exige que toda modificación histórica cumpla el proceso completo. La mera existencia del documento y de los registros no demuestra que cada commit histórico tenga respaldo, auditoría, pruebas y aprobación externa trazables. No se certifica cumplimiento global sin revisar individualmente todo el historial de cambios.

## REQ-EXP-002 - Auditoría del libro de referencia e inspección de datos
**Estado: No verificable con la evidencia disponible.** El archivo `backend/Spreadsheet/AREA DE INFORMATICA IMA.xlsx` existe en el árbol Git (904,629 bytes; blob SHA `d013d4d3b35252b62327ef210829d6855c107f47`). El conector permitió recuperar su representación base64, pero no materializar ni analizar el binario XLSX en esta sesión; tampoco hay conexión a la hoja productiva. Por ello no se inspeccionaron las hojas, encabezados, claves, índices ni datos de Tareas/Entregas. La inspección de modelos backend no sustituye la inspección real del libro. Se registra AUD-NG-117 para completar la verificación con acceso apto al archivo/datos.

## REQ-EXP-003 - Estructura académica jerárquica y separación estricta
**Estado: Cumple parcialmente.** El backend `updateAcademicConfig` aplica validación de unicidad por cuatro factores: parcial, grado, sección y asignatura, comparando contra otros docentes (`backend/academic-service/Code.gs:12434-12453`). La navegación docente cuenta con niveles Grados, Secciones, Asignaturas, Alumnos y Detalles; las funciones consumen `GLOBAL_SCOPE`/ `GranularConfig`. Sin embargo, el constructor `initAssignmentBuilder` usa secciones fijas A/B/C (`js/teacher.js:400-405`) en lugar de derivarlas de la configuración real. En la ruta de navegación observada, `pushNav` agrega el nivel recibido a `navStack` y `renderCurrentLevel` muestra Secciones como paso separado; no se identificó salto automático cuando existe una única sección. El filtrado por parcial de grados/secciones tiene un hallazgo separado, AUD-NG-115. Se registra AUD-NG-118 para resolver catálogo y salto automático.

## Pruebas y límites

Se inspeccionaron las suites de regresión sin localizar pruebas dirigidas para `hierarchicalAssignments`, `renderGrados`, `renderSecciones`, `renderAsignaturas` o `GLOBAL_SCOPE`. No se ejecutaron pruebas. No se inspeccionó el libro XLSX ni la hoja de cálculo productiva.

Hallazgos convertidos en tareas:
- AUD-NG-117: inspeccionar el libro de referencia y conciliar sus datos con el modelo académico.
- AUD-NG-118: completar navegación jerárquica con secciones dinámicas y salto automático.

## Continuidad

- Tres tareas históricas inspeccionadas; ninguna marca histórica fue alterada.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- Siguiente sublote: D2 (REQ-EXP-004 a REQ-EXP-006).
