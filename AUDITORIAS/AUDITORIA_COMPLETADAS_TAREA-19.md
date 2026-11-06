# Auditoría TAREA-19: migración curricular sin pérdida de datos

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
HEAD de partida: f586c40ca12dfc034c28584b7ca71839cbc4b2b6  
Dictamen: **NO CUMPLE**.

## Archivos inspeccionados

| Archivo | SHA |
|---|---|
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 |
| teacher-dashboard.html | cbb9e6a272a7d8ad33f99727303305d950533e71 |
| tests/regression/academic-grading-suite.js | 3433b707edd4a2f35c68368a3172932adc2a3b32 |

Los tres archivos principales tienen SHA idéntico en NG_beta_0.0.0.1 y NG_beta_0.0.0.1_work; no hay correcciones posteriores.

## Evidencia

### Equivalencias
getCurricularEquivalences (academic-service, línea 3093) solo lee CatalogoAsignaturas. Aunque recibe planOrigenId y planDestinoId, no consulta PlanesEstudio ni PlanAsignaturas. Devuelve cada asignatura como equivalencia consigo misma, estado MapeadoExacto y requiereRevision=false. No detecta ambigüedades ni asignaturas no encontradas. La variable de normalización declarada no se utiliza.

El modelo sí define CatalogoAsignaturas, PlanesEstudio y PlanAsignaturas (líneas 108-110), pero el motor no usa sus relaciones. La interfaz envía PLAN-2026-OFICIAL como destino, mientras el backend usa PLAN-2026 como valor predeterminado y no valida ninguno.

### Prevalidación y ejecución
executeCurricularMigration (línea 3130) recibe equivalenciasMap pero no lo utiliza. Solo cuenta filas de HistorialAcademico y CalificacionesEstudiantes y señala filas con ID/nota vacíos. duplicadosDetectados y modificacionesEfectuadas se inicializan en cero y nunca se actualizan; no busca relaciones huérfanas, no valida matrículas, códigos de estudiante, asignaturas del plan ni boletines/documentos emitidos.

No crea snapshot, no compara antes/después, no registra un diario de cambios y no modifica registros. Aun así, si se solicita modo REAL devuelve status success y el mensaje de que la migración fue ejecutada, con modificacionesEfectuadas=0. El contador calificacionesOficialesPreservadas refleja el número de filas, no una verificación de integridad.

### Rollback e interfaz
No se encontró función o tabla específica para reversión curricular. La restauración general de backups no está vinculada a esta operación ni conserva por sí misma las transacciones posteriores.

js/teacher.js (2192-2273) define un controlador que intenta abrir modal-curricular-migration. teacher-dashboard.html no contiene ese modal ni los controles. El formulario tampoco envía equivalenciasMap y solo muestra conteos. Los endpoints están permitidos para Director/Admin, no Profesor, aunque el controlador se encuentra en el panel docente.

tests/regression/academic-grading-suite.js no contiene pruebas de equivalencias ni migración.

## Dictamen por criterio

- Equivalencias reales entre planes: **No cumple**.
- Revisión de equivalencias ambiguas: **No cumple**.
- Prevalidación de duplicados/huérfanos: **No cumple**.
- Preservación verificada de códigos, notas y boletines: **No cumple**.
- Comparación antes/después: **No cumple**.
- Migración real: **No cumple**.
- Reversión curricular: **No cumple**.
- Interfaz funcional: **No cumple**.

## Hallazgo nuevo

**AUD-NG-172 (P1): Implementar migración curricular transaccional con prevalidación y rollback verificable.** Requiere mapeo real por plan, revisión manual de ambigüedades, detección de duplicados/huérfanos, snapshot, comparación antes/después, ejecución idempotente, preservación de notas/boletines y reversión comprobable.

## Reconciliación
- AUD-NG-164: catálogo y relaciones de planes.
- AUD-NG-167: integridad de calificaciones y boletines.
- TASK-078: rollback operativo general y delta post-corte; no sustituye la reversión específica de migración.
- AUD-NG-158: RBAC y actor verificado.
- TASK-296: renderizado seguro del panel de equivalencias.

## Límites
Inspección estática/manual. No se ejecutaron migraciones, fixtures, snapshots, rollback ni despliegues. No se usaron datos productivos ni se modificó código fuente. AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md no está disponible en la rama; se usó el alcance explícito de completadas.md.
