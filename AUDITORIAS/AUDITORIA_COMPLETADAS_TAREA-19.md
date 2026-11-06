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


## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-172 - Migración curricular transaccional con prevalidación y rollback verificable (P1)
- Construir equivalencias reales entre plan de origen y destino consultando `PlanesEstudio`, `PlanAsignaturas` y `CatalogoAsignaturas`. No generar equivalencias exactas por identidad de cada asignatura ni marcar `requiereRevision=false` sin comparar códigos, créditos, contenidos, grado, vigencia y relaciones curriculares.
- Validar que ambos planes existan, estén vigentes y sean compatibles con el año lectivo y población seleccionada. Resolver IDs canónicos; no usar `PLAN-2026-OFICIAL` en UI y `PLAN-2026` por defecto en backend sin validación.
- Clasificar cada equivalencia como exacta, equivalente con diferencias, ambigua o sin correspondencia. Para casos ambiguos/no encontrados, exigir revisión humana con decisión, actor verificado, fecha y justificación; bloquear ejecución mientras existan casos no resueltos.
- Implementar prevalidación de integridad que recorra matrículas, historial académico, calificaciones, asignaturas, códigos de estudiante, relaciones PlanAsignaturas y documentos/boletines emitidos. Detectar IDs duplicados, referencias huérfanas, conflictos y datos fuera del alcance.
- Producir un informe de prevalidación sin efectos secundarios, con conteos y detalle de cada registro a migrar, preservar, excluir o revisar. No inicializar contadores a cero y devolver éxito sin ejecutar comprobaciones reales.
- Generar snapshot íntegro previo a la migración, con versión de esquema, contexto de planes, IDs afectados, hashes/conteos y fecha. El snapshot debe permitir reconstruir el estado anterior y quedar vinculado al ID de migración.
- Registrar un plan de cambios determinista a partir de equivalencias aprobadas. Antes de escribir, validar que los registros no hayan cambiado desde el snapshot (control de versión/huella) para evitar migrar sobre datos concurrentemente modificados.
- Ejecutar la migración con transacción o estrategia por lotes reanudable y compensable. Cada escritura debe registrar valor anterior/nuevo, entidad, clave, versión, estado y orden; ante fallo, detener el lote y permitir reanudar o revertir sin duplicar efectos.
- Hacer la ejecución idempotente por `migrationId` y huella del plan aprobado. Repetir la misma solicitud debe recuperar el resultado; una misma clave con otro mapa/plan debe rechazarse.
- Preservar códigos de estudiante, notas, historial, matrículas, boletines y documentos emitidos. Validar equivalencias y referencias de cada entidad, no solo contar filas. Los registros históricos deben mantener la interpretación curricular original o una relación de equivalencia explícita.
- Comparar antes/después con invariantes verificables: totales por entidad, claves únicas, referencias válidas, notas y puntajes sin cambio no autorizado, boletines/documentos recuperables y cero huérfanos nuevos. El número de filas preservadas no demuestra integridad de contenido.
- Implementar rollback específico por migración usando el diario/snapshot, con vista previa de impacto y validación de que los registros no fueron modificados posteriormente por otros procesos. Revertir solo cambios atribuibles a la migración y conservar cambios legítimos posteriores.
- Registrar cada etapa (prevalidación, aprobación, snapshot, ejecución por lote, verificación, cierre/rollback) con actor verificado, timestamp, estado, errores, conteos y evidencia. Nunca devolver `success` ni mensaje de ejecución real cuando no se realizaron escrituras.
- Separar claramente modo simulación y modo real. La simulación no escribe; la ejecución real requiere aprobación explícita, permisos, snapshot válido y prevalidación sin bloqueos.
- Incorporar una interfaz funcional de administración curricular que permita revisar equivalencias, resolver ambigüedades, inspeccionar prevalidación, aprobar, ejecutar, monitorear y revertir. El controlador no debe apuntar a un modal inexistente ni omitir `equivalenciasMap`.
- Mantener el proceso accesible solo a los perfiles institucionales autorizados; no habilitarlo a Profesor solo porque el controlador se encuentre en el panel docente.

### AUD-NG-164 - Catálogo curricular y relaciones de planes
- Consolidar las referencias de planes y asignaturas como fuente canónica: IDs estables, códigos, créditos, contenidos, grado, vigencia, prerequisitos y relaciones PlanAsignaturas.
- Validar integridad referencial y vigencia antes de permitir que una asignatura participe en equivalencias o migraciones.
- Proporcionar al motor de migración el catálogo y las relaciones curriculares completas; no duplicar ni mantener un segundo catálogo paralelo.
- Mantener AUD-NG-164 como propietario de la calidad del catálogo; AUD-NG-172 consume esa fuente para mapear y migrar registros.

### AUD-NG-167 - Preservación del libro académico y boletines
- Exigir que la migración preserve notas, puntajes, periodo, asignatura, estudiante y estado de publicación del libro académico.
- Verificar boletines y documentos emitidos vinculados a las calificaciones migradas; no basta con contar filas de CalificacionesEstudiantes/HistorialAcademico.
- Mantener la fuente consolidada y la trazabilidad contextual de AUD-NG-167; el rollback curricular debe restaurar referencias sin alterar resultados académicos oficiales.

### TASK-078 - Coordinación con rollback operativo general
- Reutilizar los mecanismos generales de backup/rollback y registro delta post-corte cuando sean aplicables, asegurando que la migración curricular emita un identificador, snapshot y diario compatibles.
- No considerar el backup general como sustituto del rollback selectivo: AUD-NG-172 debe identificar y revertir únicamente los cambios de su propia migración, protegiendo modificaciones posteriores ajenas.
- Documentar el procedimiento operativo de recuperación y probarlo con fixtures antes de autorizar una migración real.

### AUD-NG-158 - RBAC/ABAC y actor verificado para migraciones
- Restringir prevalidación, aprobación, ejecución, consulta de resultados y rollback a roles autorizados explícitamente.
- Derivar el actor desde sesión verificada y registrar aprobador/ejecutor; no aceptar `autorId`, `profesorId` ni rol declarados por el cliente.
- Validar ámbito institucional, plan, año lectivo y población autorizada en cada transición; comprobar nuevamente permisos al ejecutar y revertir.
- Mantener la autorización transversal separada de la lógica transaccional de AUD-NG-172.

### TASK-296 - Renderizado seguro del panel de equivalencias
- Escapar en contexto todos los datos de asignaturas, equivalencias, observaciones, errores y resultados antes de insertarlos en la interfaz.
- Evitar concatenación de HTML con valores provenientes del catálogo o del proceso de migración; usar APIs DOM seguras.
- Validar URLs/enlaces asociados a documentos o evidencias y respetar las ACL correspondientes.
- Incorporar pruebas de XSS almacenado/reflejado en el panel de equivalencias como parte de la interfaz de administración.

**Reconciliación y límites:** AUD-NG-172 es propietario del flujo específico de migración curricular (equivalencias, prevalidación, snapshot, ejecución, comparación y rollback selectivo). AUD-NG-164 conserva el catálogo y las relaciones de planes; AUD-NG-167 la integridad de calificaciones/boletines; TASK-078 el rollback operativo general; AUD-NG-158 la autorización y actor; TASK-296 el renderizado seguro. El backup general no reemplaza el rollback específico. No se crean IDs adicionales.

**Evidencia requerida:** equivalencias reales y casos ambiguos; prevalidación con duplicados/huérfanos; snapshot recuperable; plan determinista; ejecución idempotente; fallo inducido a mitad de lote; rollback selectivo que preserve cambios posteriores; comparación antes/después de notas, matrículas, códigos y boletines; autorización por rol/ámbito; y pruebas de interfaz. La auditoría actual es estática y no acredita ninguno de estos resultados.

