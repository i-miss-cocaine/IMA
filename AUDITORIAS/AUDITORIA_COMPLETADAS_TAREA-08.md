# Auditoría TAREA-08

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Hallazgos

- ChangesLogs.txt solo atribuye a TAREA-08 la incorporación de dos catálogos estáticos en js/config.js; no registra cambios funcionales en los archivos backend o la interfaz incluidos en el alcance.
- El cliente declara 12 áreas y 8 departamentos; getAcademicAreaTemplateCatalog inicializa 7 áreas diferentes. USER mantiene CatalogoDepartamentos y ACADEMIC usa DepartamentosAcademicos, sin sincronización demostrada.
- registerCurricularAreaExtension permite registrar áreas pendientes de pruebas, pero js/teacher.js y teacher-dashboard.html no consumen ese flujo.
- getSubjectCatalog/createSubjectCatalogItem solo almacenan ID, nombre, código, área y estado. No modelan departamento, programa, grado, idioma, horas, créditos, prerrequisitos ni obligatoriedad/optatividad; no validan código único ni área existente.
- getStudyPlans/createStudyPlan solo almacenan nombre, versión, grado, estado y vigencia.
- getAcademicOffers/createAcademicOffer no validan la existencia/compatibilidad de asignatura y plan. El flujo docente puede continuar con identificadores genéricos/sintéticos cuando no obtiene una oferta válida.
- Las operaciones de creación están sujetas a ROLE_PERMISSIONS para Director/Administrador; la brecha es de modelo, validación e integración, no ausencia total de RBAC.

## Hallazgo nuevo

**AUD-NG-164 - Completar el catálogo curricular maestro y sus relaciones con planes y oferta académica.** P1. Fuente única para áreas/departamentos/programas/grados/asignaturas/planes/ofertas; IDs/códigos únicos; metadatos curriculares completos; planes versionados; referencias validadas; desactivación sin borrar historia; propagación a horarios, matrícula, formularios, filtros y reportes.

No duplica TASK-005 (pertenencia docente a áreas), AUD-NG-011 (aislamiento), AUD-NG-018 (historial de asignaciones), AUD-NG-093 (rol), AUD-NG-108 (ámbito docente), AUD-NG-111 (esquemas), AUD-NG-113/115 (parcial/navegación), AUD-NG-117 (conciliación) ni TASK-153 (ABAC departamental).

## Calidad y límites

Calidad insuficiente por divergencia entre catálogos, modelo incompleto y propagación no demostrada. Auditoría estática; no se ejecutaron pruebas funcionales, de integridad referencial ni preservación histórica. No se modificó código fuente, completadas.md ni ChangesLogs.txt.


## Tareas ejecutables derivadas de los hallazgos

**AUD-NG-164 - Catálogo curricular maestro y relaciones académicas (P1)**

**Objetivo:** establecer una fuente institucional única y consistente para áreas, departamentos, programas, grados, asignaturas, planes de estudio y ofertas académicas, con identificadores estables, relaciones verificadas y propagación coherente a los módulos que consumen esos catálogos.

**Tareas y criterios de aceptación:**
- Definir el catálogo maestro y su propiedad funcional, eliminando la divergencia entre las áreas declaradas por el cliente y las inicializadas por ACADEMIC, así como la duplicidad no sincronizada entre `CatalogoDepartamentos` de USER y `DepartamentosAcademicos` de ACADEMIC.
- Normalizar las entidades curriculares y sus relaciones: área, departamento, programa, grado, asignatura, plan de estudio y oferta. Cada entidad debe tener ID/código único, estado y referencias válidas; las relaciones deben impedir asignaciones a entidades inexistentes o incompatibles.
- Completar los metadatos de asignaturas que exige el modelo curricular: departamento, programa, grado, idioma, horas, créditos, prerrequisitos y condición obligatoria/optativa. Validar campos requeridos, unicidad de códigos y pertenencia al catálogo vigente.
- Ampliar los planes de estudio para representar su estructura curricular y versionado, incluyendo vigencia y relaciones con asignaturas, programas y grados. Una nueva versión no debe sobrescribir ni borrar la historia de una versión anterior.
- Validar al crear o actualizar una oferta que la asignatura y el plan existan, estén vigentes y sean compatibles entre sí y con el contexto académico. Rechazar referencias genéricas, sintéticas o inexistentes; no continuar el flujo docente con identificadores de sustitución cuando la consulta falle.
- Integrar los flujos de administración y consulta con la interfaz docente y los consumidores institucionales. El catálogo debe alimentar horarios, matrícula, formularios, filtros y reportes, sin mantener listas estáticas paralelas ni flujos de administración desconectados.
- Permitir desactivar áreas, departamentos, programas, asignaturas, planes y ofertas sin borrar registros históricos ni romper matrículas, calificaciones u otras relaciones ya existentes. La desactivación debe impedir nuevas asignaciones incompatibles y preservar la consulta histórica.
- Aplicar las autorizaciones institucionales ya existentes para Director/Administrador en las operaciones de administración. El alcance de este hallazgo es el modelo, sus validaciones, la consistencia y la integración; no sustituye las tareas separadas de permisos o aislamiento por ámbito.

**Reconciliación y no duplicación:**
- `TASK-005` conserva la asignación institucional de docentes a áreas académicas; no se amplía para convertirse en catálogo curricular.
- `AUD-NG-011` conserva el aislamiento arquitectónico por área; no se absorbe dentro del catálogo maestro.
- `AUD-NG-018` conserva la trazabilidad histórica de asignaciones docentes.
- `AUD-NG-093` y `AUD-NG-108` conservan sus hallazgos de autorización y propiedad contextual.
- `AUD-NG-111` conserva la validación de esquemas de hojas existentes.
- `AUD-NG-113` y `AUD-NG-115` conservan sus defectos de parcial y navegación contextual.
- `AUD-NG-117` conserva la verificación pendiente de los datos del libro XLSX de referencia.
- `TASK-153` conserva el control ABAC departamental.
- No se crean IDs adicionales ni se modifican estados o prioridades de las tareas relacionadas.

**Evidencia requerida para cerrar AUD-NG-164:** inventario reconciliado de catálogos; esquema y relaciones documentadas; validaciones negativas y positivas de unicidad/referencias/compatibilidad; prueba de versionado y desactivación con preservación histórica; y evidencia de consumo real por los módulos institucionales. La inspección estática actual no acredita esos resultados.

