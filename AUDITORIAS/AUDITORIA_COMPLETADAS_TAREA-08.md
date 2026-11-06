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
