# AUDITORÍA TÉCNICA - TAREA-F6-031: Plantilla de microservicio académico reutilizable (criterios ampliados)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.222  
**Checkpoint de cierre:** C1.223  
**Sesión:** IMA-AUDIT-20261107-2045Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Relación con TAREA-F6-006
TAREA-F6-031 (completadas.md, líneas 3517-3588) repite el título de TAREA-F6-006 y amplía el alcance con CA-061..CA-070 y CA-151..CA-153. Ambas carecían de informe individual. Se auditaron conjuntamente porque utilizan los mismos servicios y modelos de datos. Este informe conserva la trazabilidad del ID F6-031 y reutiliza el bloque canónico F6-006-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md; no se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3517-3588.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1967-1970 para la tarea base F6-006.
- Evidencia de código, SHAs y detalle de hallazgos: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md.

## 2. Verificación del alcance ampliado

### Catálogo y siete áreas
El catálogo backend contiene siete áreas seed hardcodeadas; el frontend declara doce. registerCurricularAreaExtension permite registrar extensiones y createSubjectCatalogItem permite crear asignaturas, pero no existe un catálogo completo de grados/secciones con IDs ni sincronización canónica. Los IDs de asignaturas/ofertas se generan con Date.now y no se valida unicidad/relación.

### Relaciones e historial
Las ofertas guardan asignaturaId pero grado/sección como texto. Las tareas y exámenes usan nombres de asignatura/grado/sección y no incluyen consistentemente areaId, instanceId, offerId, assignmentId ni periodId. Las asignaciones docentes y áreas se actualizan in-place; no se conserva un historial inmutable de cambios. No se demuestra que las calificaciones históricas sobrevivan a cambios de docente, grupo o año.

### Acceso de estudiantes, docentes y coordinadores
TASK declara getStudentTasks/getAllTasks como PUBLIC_ACTIONS y EXAM declara getStudentExams/getAllExams como PUBLIC_ACTIONS. AUD-NG-002 ya documenta el bypass; sigue presente en este código. Las consultas individuales usan userId/grado/seccion del payload cuando no existe identidad verificada. Los filtros de docentes aceptan docenteUserId del cliente. El ámbito de coordinación solo registra areaId/tipo/fechas, puede devolver todas las coordinaciones si no se filtra y no se aplica a las consultas de tareas/exámenes/ofertas.

### Instancias y almacenamiento
deployAcademicMicroserviceInstance solo escribe metadatos, permite scriptId/driveFolderId vacíos, usa SPREADSHEET_ID compartido como fallback, fija connectivityCheck en PASS y EstadoDespliegue en Activo. No crea proyecto Apps Script, Spreadsheet, Drive folder ni endpoint independiente. js/api.js enruta por SERVICE_URLS estáticos, no por instancia/área.

### Pruebas y activación
runCurricularAreaServiceTests construye cuatro resultados PASS constantes y activa el área sin ejecutar conectividad, RBAC ni integridad histórica reales.

## 3. Matriz de aceptación
| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-061 siete áreas y materias configurables | Parcial | siete seeds hardcodeados frente a doce áreas frontend; materias no se sincronizan. |
| CA-062 crear áreas/materias/grados/secciones/asignaciones sin código | Parcial | APIs parciales; grado/sección permanecen como texto. |
| CA-063 relaciones por IDs inmutables | No cumple | faltan areaId/instanceId/offerId/periodId en tareas y exámenes. |
| CA-064 historial de calificaciones estable | No cumple | asignaciones y catálogos mutables sin snapshots. |
| CA-065 estudiante solo consulta materias matriculadas | No cumple | acciones públicas y filtros de payload sin validación de matrícula. |
| CA-066 docente solo consulta grupos asignados | No cumple | consultas públicas y filtros de docente controlados por cliente. |
| CA-067 coordinador solo consulta su ámbito | No cumple | ámbito opcional, sin identidad verificada ni enforcement. |
| CA-068 instancia propia de Apps Script/Spreadsheet/Drive | No cumple | despliegue de metadatos; almacenamiento compartido. |
| CA-069 múltiples roles sin duplicar identidad ni ampliar permisos | Parcial | existen asignaciones de ámbito, no roles activos integrados en token/enforcement. |
| CA-070 funciones operativas por área | No cumple | no hay routing por instancia ni pruebas de aislamiento. |
| CA-151 ámbito de coordinación configurable | Parcial | solo área/tipo/fechas, sin materia/grado/sección/periodo. |
| CA-152 relaciones de coordinación con periodos | No cumple | no se almacenan esos IDs. |
| CA-153 roles adicionales sin heredar privilegios | No cumple | el token usa un solo rol y no existe intersección por ámbito. |

## 4. Tareas derivadas
Se reutiliza el bloque canónico F6-006-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md:
1. F6-006-A01: catálogo curricular único, configurable y con IDs canónicos.
2. F6-006-A02: despliegue real y aislamiento por instancia.
3. F6-006-A03: relaciones académicas por IDs inmutables e historial.
4. F6-006-A04: ABAC de docentes, estudiantes y coordinadores.
5. F6-006-A05: retirar consultas públicas sensibles y aislar TASK/EXAM.
6. F6-006-A06: pruebas E2E de las siete áreas y aislamiento.
Todas permanecen pendientes. No se crean IDs globales ni tareas locales duplicadas.

## 5. Cierre
- Dictamen TAREA-F6-031: NO CUMPLE.
- El estado [X] de completadas.md se conserva como histórico.
- El informe detallado y las tareas derivadas están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md.
- Este archivo mantiene la trazabilidad individual de F6-031 y sus criterios ampliados.
- No se modificó código ni se ejecutaron pruebas en sistemas productivos.
- Siguiente tarea: TAREA-F6-007 y su registro ampliado TAREA-F6-032.
